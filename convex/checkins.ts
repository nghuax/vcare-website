import { v } from "convex/values";

import {
  distanceMeters,
  getMembership,
  getRallyById,
  nowTs,
  requireUserByAuthKey,
} from "./helpers";
import { mutation } from "./server";

function asId(value: string) {
  return value as any;
}

export const submitCheckIn = mutation({
  args: {
    authKey: v.string(),
    rallyId: v.string(),
    checkpointId: v.string(),
    latitude: v.number(),
    longitude: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireUserByAuthKey(ctx, args.authKey);
    const rally = await getRallyById(ctx, asId(args.rallyId));

    if (!rally) {
      throw new Error("RALLY_NOT_FOUND");
    }

    if (rally.status !== "active") {
      throw new Error("RALLY_NOT_ACTIVE");
    }

    const participant = await getMembership(ctx, rally._id, user._id);

    if (!participant) {
      throw new Error("FORBIDDEN_PARTICIPANT_ONLY");
    }

    const checkpoint = await ctx.db.get(asId(args.checkpointId));

    if (!checkpoint || checkpoint.rallyId !== rally._id) {
      throw new Error("CHECKPOINT_NOT_FOUND");
    }

    const duplicate = await ctx.db
      .query("checkIns")
      .withIndex("by_rally_participant_checkpoint", (q: any) =>
        q
          .eq("rallyId", rally._id)
          .eq("participantId", participant._id)
          .eq("checkpointId", checkpoint._id),
      )
      .first();

    if (duplicate) {
      throw new Error("ALREADY_CHECKED_IN");
    }

    if (rally.sequentialCheckpoints) {
      const expectedOrder = participant.currentCheckpointOrder + 1;
      if (checkpoint.order !== expectedOrder) {
        throw new Error("CHECKPOINT_LOCKED");
      }
    }

    const radius = checkpoint.radius || rally.checkpointRadius;
    const distance = distanceMeters(
      args.latitude,
      args.longitude,
      checkpoint.latitude,
      checkpoint.longitude,
    );

    if (distance > radius) {
      throw new Error("OUTSIDE_CHECKPOINT_RADIUS");
    }

    const now = nowTs();

    await ctx.db.insert("checkIns", {
      rallyId: rally._id,
      participantId: participant._id,
      checkpointId: checkpoint._id,
      latitude: args.latitude,
      longitude: args.longitude,
      checkedInAt: now,
      createdAt: now,
    });

    const checkpoints = await ctx.db
      .query("checkpoints")
      .withIndex("by_rally_order", (q) => q.eq("rallyId", rally._id))
      .collect();

    const completedCheckpointCount = Math.max(
      participant.completedCheckpointCount + 1,
      checkpoint.order,
    );
    const isFinished = completedCheckpointCount >= checkpoints.length;

    await ctx.db.patch(participant._id, {
      currentCheckpointOrder: Math.max(participant.currentCheckpointOrder, checkpoint.order),
      completedCheckpointCount,
      lastCheckInAt: now,
      status: isFinished ? "finished" : "active",
      finishedAt: isFinished ? now : undefined,
      updatedAt: now,
    });

    const existingResult = await ctx.db
      .query("rallyResults")
      .withIndex("by_rally_participant", (q: any) =>
        q.eq("rallyId", rally._id).eq("participantId", participant._id),
      )
      .first();

    const resultTimeline = existingResult?.checkpointTimeline ?? [];

    const payload = {
      participantName: user.displayName,
      checkpointTimeline: [
        ...resultTimeline,
        {
          checkpointId: checkpoint._id,
          checkpointTitle: checkpoint.title,
          checkedInAt: now,
        },
      ],
      completionTimeMs:
        isFinished && rally.startedAt ? now - rally.startedAt : existingResult?.completionTimeMs,
      finishTime: isFinished ? now : existingResult?.finishTime,
      averageSpeedKmh: participant.averageSpeedKmh,
      distanceKm: participant.distanceKm,
      updatedAt: now,
    };

    if (existingResult) {
      await ctx.db.patch(existingResult._id, payload);
    } else {
      await ctx.db.insert("rallyResults", {
        rallyId: rally._id,
        participantId: participant._id,
        createdAt: now,
        ...payload,
      });
    }

    return { ok: true as const };
  },
});

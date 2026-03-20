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

function normalizeSpeed(speedKmh: number | undefined) {
  if (typeof speedKmh !== "number" || Number.isNaN(speedKmh)) {
    return undefined;
  }
  return Math.max(0, speedKmh);
}

export const publishLocation = mutation({
  args: {
    authKey: v.string(),
    rallyId: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    heading: v.optional(v.number()),
    speedKmh: v.optional(v.number()),
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

    if (participant.status !== "active") {
      throw new Error("PARTICIPANT_NOT_ACTIVE");
    }

    const now = nowTs();
    const settings = await ctx.db
      .query("appSettings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    const speedKmh = settings?.shareLiveSpeed === false ? undefined : normalizeSpeed(args.speedKmh);

    const existing = await ctx.db
      .query("liveLocations")
      .withIndex("by_rally_participant", (q: any) =>
        q.eq("rallyId", rally._id).eq("participantId", participant._id),
      )
      .first();

    let addedDistanceKm = 0;

    if (existing) {
      const segmentMeters = distanceMeters(
        existing.latitude,
        existing.longitude,
        args.latitude,
        args.longitude,
      );
      addedDistanceKm = segmentMeters / 1000;

      await ctx.db.patch(existing._id, {
        latitude: args.latitude,
        longitude: args.longitude,
        heading: args.heading,
        speedKmh,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("liveLocations", {
        rallyId: rally._id,
        participantId: participant._id,
        latitude: args.latitude,
        longitude: args.longitude,
        heading: args.heading,
        speedKmh,
        updatedAt: now,
        createdAt: now,
      });
    }

    const nextDistanceKm = (participant.distanceKm ?? 0) + addedDistanceKm;
    const checkpointCount = participant.completedCheckpointCount + (participant.currentCheckpointOrder > 0 ? 1 : 0);
    const nextAverageSpeed =
      typeof speedKmh === "number"
        ? participant.averageSpeedKmh
          ? (participant.averageSpeedKmh * checkpointCount + speedKmh) / (checkpointCount + 1)
          : speedKmh
        : participant.averageSpeedKmh;

    await ctx.db.patch(participant._id, {
      lastLocationAt: now,
      distanceKm: Number(nextDistanceKm.toFixed(3)),
      averageSpeedKmh:
        typeof nextAverageSpeed === "number"
          ? Number(nextAverageSpeed.toFixed(1))
          : undefined,
      updatedAt: now,
    });

    return { ok: true as const };
  },
});

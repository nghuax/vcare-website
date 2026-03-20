import { v } from "convex/values";

import {
  createInviteCode,
  getMembership,
  getRallyById,
  nowTs,
  requireUserByAuthKey,
} from "./helpers";
import { mutation, query } from "./server";

function asId(value: string) {
  return value as any;
}

function isRallyVisibleToPublic(status: string) {
  return status === "not_started" || status === "active" || status === "published";
}

async function uniqueInviteCode(ctx: any) {
  let attempts = 0;
  while (attempts < 10) {
    attempts += 1;
    const code = createInviteCode();
    const existing = await ctx.db
      .query("rallies")
      .withIndex("by_invite_code", (q: any) => q.eq("inviteCode", code))
      .first();
    if (!existing) {
      return code;
    }
  }
  return `${createInviteCode()}${Math.floor(Math.random() * 9)}`;
}

async function buildRallyCard(ctx: any, rally: any) {
  const [host, participants, checkpoints] = await Promise.all([
    ctx.db.get(rally.hostUserId),
    ctx.db
      .query("rallyParticipants")
      .withIndex("by_rally", (q: any) => q.eq("rallyId", rally._id))
      .collect(),
    ctx.db
      .query("checkpoints")
      .withIndex("by_rally_order", (q: any) => q.eq("rallyId", rally._id))
      .collect(),
  ]);

  return {
    _id: rally._id,
    title: rally.title,
    description: rally.description,
    coverImageUrl: rally.coverImageUrl,
    scheduledAt: rally.scheduledAt,
    status: rally.status,
    visibility: rally.visibility,
    inviteCode: rally.inviteCode,
    hostName: host?.displayName ?? "Host",
    participantCount: participants.length,
    checkpointCount: checkpoints.length,
    startedAt: rally.startedAt,
    finishedAt: rally.finishedAt,
  };
}

async function hydrateParticipants(ctx: any, rows: any[]) {
  const users = await Promise.all(rows.map((row) => ctx.db.get(row.userId)));
  const vehicles = await Promise.all(
    rows.map((row) =>
      ctx.db
        .query("vehicles")
        .withIndex("by_user", (q: any) => q.eq("userId", row.userId))
        .first(),
    ),
  );

  return rows.map((row, index) => ({
    _id: row._id,
    rallyId: row.rallyId,
    userId: row.userId,
    displayName: users[index]?.displayName ?? "Participant",
    avatarUrl: users[index]?.avatarUrl,
    vehicleName: vehicles[index]?.carName,
    plateNickname: vehicles[index]?.plateNickname,
    role: row.role,
    status: row.status,
    joinedAt: row.joinedAt,
    currentCheckpointOrder: row.currentCheckpointOrder,
    completedCheckpointCount: row.completedCheckpointCount,
    lastCheckInAt: row.lastCheckInAt,
    lastLocationAt: row.lastLocationAt,
    averageSpeedKmh: row.averageSpeedKmh,
    distanceKm: row.distanceKm,
  }));
}

async function requireHostForRally(ctx: any, authKey: string, rallyId: string) {
  const user = await requireUserByAuthKey(ctx, authKey);
  const rally = await getRallyById(ctx, asId(rallyId));

  if (!rally) {
    throw new Error("RALLY_NOT_FOUND");
  }

  if (rally.hostUserId !== user._id) {
    throw new Error("FORBIDDEN_HOST_ONLY");
  }

  return { user, rally };
}

async function buildHomeData(ctx: any, user: any) {
  const now = nowTs();

  const [allRallies, hostedRows, participantRows] = await Promise.all([
    ctx.db.query("rallies").collect(),
    ctx.db
      .query("rallies")
      .withIndex("by_host", (q: any) => q.eq("hostUserId", user._id))
      .collect(),
    ctx.db
      .query("rallyParticipants")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect(),
  ]);

  const joinedIds = new Set(participantRows.map((row: any) => row.rallyId));
  const joinedRows = await Promise.all(
    Array.from(joinedIds).map((rallyId) => ctx.db.get(rallyId)),
  );

  const upcomingRows = allRallies
    .filter(
      (rally: any) =>
        rally.visibility === "public" &&
        isRallyVisibleToPublic(rally.status) &&
        rally.scheduledAt >= now - 1000 * 60 * 60 * 24,
    )
    .sort((a: any, b: any) => a.scheduledAt - b.scheduledAt)
    .slice(0, 8);

  const [upcoming, joined, hosted] = await Promise.all([
    Promise.all(upcomingRows.map((row: any) => buildRallyCard(ctx, row))),
    Promise.all(
      joinedRows
        .filter((row): row is any => Boolean(row))
        .sort((a, b) => b.scheduledAt - a.scheduledAt)
        .map((row) => buildRallyCard(ctx, row)),
    ),
    Promise.all(
      hostedRows
        .sort((a: any, b: any) => b.scheduledAt - a.scheduledAt)
        .map((row: any) => buildRallyCard(ctx, row)),
    ),
  ]);

  return {
    upcoming,
    joined,
    hosted,
  };
}

export const getHomeData = query({
  args: {
    authKey: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUserByAuthKey(ctx, args.authKey);
    return await buildHomeData(ctx, user);
  },
});

export const listMyRallies = query({
  args: {
    authKey: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUserByAuthKey(ctx, args.authKey);
    return await buildHomeData(ctx, user);
  },
});

export const listDiscoverRallies = query({
  args: {
    authKey: v.string(),
  },
  handler: async (ctx, args) => {
    await requireUserByAuthKey(ctx, args.authKey);

    const rows = await ctx.db
      .query("rallies")
      .collect();

    const visibleRows = rows
      .filter((item) => item.visibility === "public" && isRallyVisibleToPublic(item.status))
      .sort((a, b) => a.scheduledAt - b.scheduledAt);

    return await Promise.all(visibleRows.map((item) => buildRallyCard(ctx, item)));
  },
});

export const getRallyDetail = query({
  args: {
    authKey: v.string(),
    rallyId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUserByAuthKey(ctx, args.authKey);
    const rally = await getRallyById(ctx, asId(args.rallyId));

    if (!rally) {
      return null;
    }

    const membership = await getMembership(ctx, asId(args.rallyId), user._id);
    const isHost = rally.hostUserId === user._id;

    if (rally.visibility === "private" && !membership && !isHost) {
      throw new Error("FORBIDDEN_PRIVATE_RALLY");
    }

    const [checkpoints, routePoints, participantRows, rallyCard] = await Promise.all([
      ctx.db
        .query("checkpoints")
        .withIndex("by_rally_order", (q) => q.eq("rallyId", rally._id))
        .collect(),
      ctx.db
        .query("routePoints")
        .withIndex("by_rally_order", (q) => q.eq("rallyId", rally._id))
        .collect(),
      ctx.db
        .query("rallyParticipants")
        .withIndex("by_rally", (q) => q.eq("rallyId", rally._id))
        .collect(),
      buildRallyCard(ctx, rally),
    ]);

    const participants = await hydrateParticipants(ctx, participantRows);

    return {
      rally: rallyCard,
      checkpoints,
      routePoints,
      participants,
      currentParticipant: participants.find((item) => item.userId === user._id),
    };
  },
});

export const getHostDashboard = query({
  args: {
    authKey: v.string(),
    rallyId: v.string(),
  },
  handler: async (ctx, args) => {
    const { user, rally } = await requireHostForRally(ctx, args.authKey, args.rallyId);

    const [participantRows, checkIns, checkpoints] = await Promise.all([
      ctx.db
        .query("rallyParticipants")
        .withIndex("by_rally", (q) => q.eq("rallyId", rally._id))
        .collect(),
      ctx.db
        .query("checkIns")
        .withIndex("by_rally_checkpoint", (q) => q.eq("rallyId", rally._id))
        .collect(),
      ctx.db
        .query("checkpoints")
        .withIndex("by_rally_order", (q) => q.eq("rallyId", rally._id))
        .collect(),
    ]);

    const participants = await hydrateParticipants(ctx, participantRows);
    const participantMap = new Map(participants.map((item) => [item._id, item]));
    const checkpointMap = new Map(checkpoints.map((item) => [item._id, item]));

    const checkInLog = checkIns
      .map((item) => ({
        participantName: participantMap.get(item.participantId)?.displayName ?? "Participant",
        checkpointTitle: checkpointMap.get(item.checkpointId)?.title ?? "Checkpoint",
        checkedInAt: item.checkedInAt,
      }))
      .sort((a, b) => b.checkedInAt - a.checkedInAt);

    return {
      host: {
        userId: user._id,
        displayName: user.displayName,
      },
      participants,
      checkInLog,
    };
  },
});

export const getTrackingMapData = query({
  args: {
    authKey: v.string(),
    rallyId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUserByAuthKey(ctx, args.authKey);
    const rally = await getRallyById(ctx, asId(args.rallyId));

    if (!rally) {
      throw new Error("RALLY_NOT_FOUND");
    }

    const membership = await getMembership(ctx, rally._id, user._id);
    const isHost = rally.hostUserId === user._id;

    if (!membership && !isHost) {
      throw new Error("FORBIDDEN_PARTICIPANT_ONLY");
    }

    const [participantRows, checkpointRows, locationRows] = await Promise.all([
      ctx.db
        .query("rallyParticipants")
        .withIndex("by_rally", (q) => q.eq("rallyId", rally._id))
        .collect(),
      ctx.db
        .query("checkpoints")
        .withIndex("by_rally_order", (q) => q.eq("rallyId", rally._id))
        .collect(),
      ctx.db
        .query("liveLocations")
        .withIndex("by_rally_participant", (q) => q.eq("rallyId", rally._id))
        .collect(),
    ]);

    const participants = await hydrateParticipants(ctx, participantRows);

    if (isHost || rally.allowParticipantTracking) {
      return {
        participants,
        locations: locationRows,
        checkpoints: checkpointRows,
      };
    }

    const currentParticipant = participants.find((item) => item.userId === user._id);

    return {
      participants: currentParticipant ? [currentParticipant] : [],
      locations: currentParticipant
        ? locationRows.filter((item) => item.participantId === currentParticipant._id)
        : [],
      checkpoints: checkpointRows,
    };
  },
});

export const getResults = query({
  args: {
    authKey: v.string(),
    rallyId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUserByAuthKey(ctx, args.authKey);
    const rally = await getRallyById(ctx, asId(args.rallyId));

    if (!rally) {
      throw new Error("RALLY_NOT_FOUND");
    }

    const membership = await getMembership(ctx, rally._id, user._id);
    const isHost = rally.hostUserId === user._id;

    if (!membership && !isHost && rally.visibility !== "public") {
      throw new Error("FORBIDDEN_PRIVATE_RALLY");
    }

    const rows = await ctx.db
      .query("rallyResults")
      .withIndex("by_rally", (q) => q.eq("rallyId", rally._id))
      .collect();

    return rows.sort((a, b) => {
      if (a.rank && b.rank) {
        return a.rank - b.rank;
      }
      if (a.rank) {
        return -1;
      }
      if (b.rank) {
        return 1;
      }
      if (a.completionTimeMs && b.completionTimeMs) {
        return a.completionTimeMs - b.completionTimeMs;
      }
      return 0;
    });
  },
});

export const createRallyDraft = mutation({
  args: {
    authKey: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    scheduledAt: v.number(),
    visibility: v.union(v.literal("public"), v.literal("private")),
  },
  handler: async (ctx, args) => {
    const user = await requireUserByAuthKey(ctx, args.authKey);
    const now = nowTs();

    const inviteCode = await uniqueInviteCode(ctx);

    const rallyId = await ctx.db.insert("rallies", {
      hostUserId: user._id,
      title: args.title,
      description: args.description,
      scheduledAt: args.scheduledAt,
      visibility: args.visibility,
      inviteCode,
      status: "draft",
      startLatitude: 10.776889,
      startLongitude: 106.700806,
      finishLatitude: 10.823099,
      finishLongitude: 106.629664,
      sequentialCheckpoints: true,
      checkInType: "gps_manual_confirm",
      checkpointRadius: 120,
      allowParticipantTracking: true,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("rallyParticipants", {
      rallyId,
      userId: user._id,
      role: "host",
      status: "registered",
      joinedAt: now,
      currentCheckpointOrder: 0,
      completedCheckpointCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return { rallyId };
  },
});

export const updateRallyBasics = mutation({
  args: {
    authKey: v.string(),
    rallyId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    coverImageUrl: v.optional(v.string()),
    scheduledAt: v.number(),
    visibility: v.union(v.literal("public"), v.literal("private")),
    startLatitude: v.number(),
    startLongitude: v.number(),
    finishLatitude: v.number(),
    finishLongitude: v.number(),
  },
  handler: async (ctx, args) => {
    const { rally } = await requireHostForRally(ctx, args.authKey, args.rallyId);

    await ctx.db.patch(rally._id, {
      title: args.title,
      description: args.description,
      coverImageUrl: args.coverImageUrl,
      scheduledAt: args.scheduledAt,
      visibility: args.visibility,
      startLatitude: args.startLatitude,
      startLongitude: args.startLongitude,
      finishLatitude: args.finishLatitude,
      finishLongitude: args.finishLongitude,
      updatedAt: nowTs(),
    });

    return { ok: true as const };
  },
});

export const upsertRoutePoint = mutation({
  args: {
    authKey: v.string(),
    rallyId: v.string(),
    routePointId: v.optional(v.string()),
    title: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const { rally } = await requireHostForRally(ctx, args.authKey, args.rallyId);
    const now = nowTs();

    if (args.routePointId) {
      await ctx.db.patch(asId(args.routePointId), {
        title: args.title,
        latitude: args.latitude,
        longitude: args.longitude,
        order: args.order,
        updatedAt: now,
      });
      return { routePointId: args.routePointId };
    }

    const routePointId = await ctx.db.insert("routePoints", {
      rallyId: rally._id,
      title: args.title,
      latitude: args.latitude,
      longitude: args.longitude,
      order: args.order,
      createdAt: now,
      updatedAt: now,
    });

    return { routePointId };
  },
});

export const reorderRoutePoints = mutation({
  args: {
    authKey: v.string(),
    rallyId: v.string(),
    orderedIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await requireHostForRally(ctx, args.authKey, args.rallyId);
    const now = nowTs();

    await Promise.all(
      args.orderedIds.map((id, index) =>
        ctx.db.patch(asId(id), {
          order: index + 1,
          updatedAt: now,
        }),
      ),
    );

    return { ok: true as const };
  },
});

export const upsertCheckpoint = mutation({
  args: {
    authKey: v.string(),
    rallyId: v.string(),
    checkpointId: v.optional(v.string()),
    title: v.string(),
    description: v.optional(v.string()),
    latitude: v.number(),
    longitude: v.number(),
    radius: v.number(),
    order: v.number(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { rally } = await requireHostForRally(ctx, args.authKey, args.rallyId);
    const now = nowTs();

    if (args.checkpointId) {
      await ctx.db.patch(asId(args.checkpointId), {
        title: args.title,
        description: args.description,
        latitude: args.latitude,
        longitude: args.longitude,
        radius: args.radius,
        order: args.order,
        imageUrl: args.imageUrl,
        updatedAt: now,
      });
      return { checkpointId: args.checkpointId };
    }

    const checkpointId = await ctx.db.insert("checkpoints", {
      rallyId: rally._id,
      title: args.title,
      description: args.description,
      latitude: args.latitude,
      longitude: args.longitude,
      radius: args.radius,
      order: args.order,
      imageUrl: args.imageUrl,
      createdAt: now,
      updatedAt: now,
    });

    return { checkpointId };
  },
});

export const reorderCheckpoints = mutation({
  args: {
    authKey: v.string(),
    rallyId: v.string(),
    orderedIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await requireHostForRally(ctx, args.authKey, args.rallyId);
    const now = nowTs();

    await Promise.all(
      args.orderedIds.map((id, index) =>
        ctx.db.patch(asId(id), {
          order: index + 1,
          updatedAt: now,
        }),
      ),
    );

    return { ok: true as const };
  },
});

export const setRallyRules = mutation({
  args: {
    authKey: v.string(),
    rallyId: v.string(),
    sequentialCheckpoints: v.boolean(),
    checkInType: v.union(
      v.literal("gps_manual_confirm"),
      v.literal("qr"),
      v.literal("photo"),
    ),
    checkpointRadius: v.number(),
    allowParticipantTracking: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { rally } = await requireHostForRally(ctx, args.authKey, args.rallyId);

    await ctx.db.patch(rally._id, {
      sequentialCheckpoints: args.sequentialCheckpoints,
      checkInType: args.checkInType,
      checkpointRadius: args.checkpointRadius,
      allowParticipantTracking: args.allowParticipantTracking,
      updatedAt: nowTs(),
    });

    return { ok: true as const };
  },
});

export const publishRally = mutation({
  args: {
    authKey: v.string(),
    rallyId: v.string(),
  },
  handler: async (ctx, args) => {
    const { rally } = await requireHostForRally(ctx, args.authKey, args.rallyId);

    const checkpoints = await ctx.db
      .query("checkpoints")
      .withIndex("by_rally_order", (q) => q.eq("rallyId", rally._id))
      .collect();

    if (checkpoints.length === 0) {
      throw new Error("CHECKPOINT_REQUIRED");
    }

    const now = nowTs();

    await ctx.db.patch(rally._id, {
      status: "not_started",
      publishedAt: now,
      updatedAt: now,
    });

    return { ok: true as const };
  },
});

export const joinByInviteCode = mutation({
  args: {
    authKey: v.string(),
    inviteCode: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUserByAuthKey(ctx, args.authKey);

    const rally = await ctx.db
      .query("rallies")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", args.inviteCode.toUpperCase()))
      .first();

    if (!rally) {
      throw new Error("RALLY_NOT_FOUND");
    }

    if (rally.status === "draft") {
      throw new Error("RALLY_NOT_PUBLISHED");
    }

    const existing = await getMembership(ctx, rally._id, user._id);

    if (existing) {
      return { rallyId: rally._id };
    }

    const now = nowTs();
    await ctx.db.insert("rallyParticipants", {
      rallyId: rally._id,
      userId: user._id,
      role: "participant",
      status: rally.status === "active" ? "active" : "registered",
      joinedAt: now,
      currentCheckpointOrder: 0,
      completedCheckpointCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return { rallyId: rally._id };
  },
});

export const startRally = mutation({
  args: {
    authKey: v.string(),
    rallyId: v.string(),
  },
  handler: async (ctx, args) => {
    const { rally } = await requireHostForRally(ctx, args.authKey, args.rallyId);

    if (rally.status === "active") {
      return { ok: true as const };
    }

    if (rally.status === "finished") {
      throw new Error("RALLY_ALREADY_FINISHED");
    }

    const now = nowTs();

    await ctx.db.patch(rally._id, {
      status: "active",
      startedAt: rally.startedAt ?? now,
      updatedAt: now,
    });

    const participants = await ctx.db
      .query("rallyParticipants")
      .withIndex("by_rally", (q) => q.eq("rallyId", rally._id))
      .collect();

    await Promise.all(
      participants.map((participant) =>
        ctx.db.patch(participant._id, {
          status: participant.status === "finished" ? "finished" : "active",
          updatedAt: now,
        }),
      ),
    );

    return { ok: true as const };
  },
});

export const finishRally = mutation({
  args: {
    authKey: v.string(),
    rallyId: v.string(),
  },
  handler: async (ctx, args) => {
    const { rally } = await requireHostForRally(ctx, args.authKey, args.rallyId);
    const finishTime = nowTs();

    const [participants, checkpoints] = await Promise.all([
      ctx.db
        .query("rallyParticipants")
        .withIndex("by_rally", (q) => q.eq("rallyId", rally._id))
        .collect(),
      ctx.db
        .query("checkpoints")
        .withIndex("by_rally_order", (q) => q.eq("rallyId", rally._id))
        .collect(),
    ]);

    const checkpointMap = new Map(checkpoints.map((item) => [item._id, item]));

    const resultRows = await Promise.all(
      participants.map(async (participant) => {
        const checkIns = await ctx.db
          .query("checkIns")
          .withIndex("by_rally_participant_time", (q: any) =>
            q.eq("rallyId", rally._id).eq("participantId", participant._id),
          )
          .collect();

        const completionTimeMs =
          checkIns.length >= checkpoints.length && rally.startedAt
            ? (checkIns[checkIns.length - 1]?.checkedInAt ?? finishTime) - rally.startedAt
            : undefined;

        const timeline = checkIns.map((item) => ({
          checkpointId: item.checkpointId,
          checkpointTitle: checkpointMap.get(item.checkpointId)?.title ?? "Checkpoint",
          checkedInAt: item.checkedInAt,
        }));

        const existingResult = await ctx.db
          .query("rallyResults")
          .withIndex("by_rally_participant", (q: any) =>
            q.eq("rallyId", rally._id).eq("participantId", participant._id),
          )
          .first();

        const payload = {
          participantName: (await ctx.db.get(participant.userId))?.displayName ?? "Participant",
          completionTimeMs,
          finishTime: completionTimeMs ? checkIns[checkIns.length - 1]?.checkedInAt ?? finishTime : undefined,
          checkpointTimeline: timeline,
          averageSpeedKmh: participant.averageSpeedKmh,
          distanceKm: participant.distanceKm,
          updatedAt: finishTime,
        };

        let resultId = existingResult?._id;

        if (existingResult) {
          await ctx.db.patch(existingResult._id, payload);
        } else {
          resultId = await ctx.db.insert("rallyResults", {
            rallyId: rally._id,
            participantId: participant._id,
            createdAt: finishTime,
            ...payload,
          });
        }

        await ctx.db.patch(participant._id, {
          status: completionTimeMs ? "finished" : "missed_checkpoint",
          finishedAt: completionTimeMs ? finishTime : undefined,
          updatedAt: finishTime,
        });

        return {
          resultId,
          completionTimeMs,
        };
      }),
    );

    const rankingRows = resultRows
      .filter((item) => item.resultId && typeof item.completionTimeMs === "number")
      .sort((a, b) => (a.completionTimeMs ?? Number.MAX_SAFE_INTEGER) - (b.completionTimeMs ?? Number.MAX_SAFE_INTEGER));

    await Promise.all(
      rankingRows.map((item, index) =>
        ctx.db.patch(item.resultId, {
          rank: index + 1,
          updatedAt: finishTime,
        }),
      ),
    );

    await ctx.db.patch(rally._id, {
      status: "finished",
      finishedAt: finishTime,
      updatedAt: finishTime,
    });

    return { ok: true as const };
  },
});

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const rallyStatus = v.union(
  v.literal("draft"),
  v.literal("published"),
  v.literal("not_started"),
  v.literal("active"),
  v.literal("finished"),
);

const participantStatus = v.union(
  v.literal("registered"),
  v.literal("active"),
  v.literal("finished"),
  v.literal("missed_checkpoint"),
  v.literal("disconnected"),
);

export default defineSchema({
  users: defineTable({
    authKey: v.string(),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
    role: v.union(v.literal("host"), v.literal("participant")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_auth_key", ["authKey"])
    .index("by_role", ["role"]),

  vehicles: defineTable({
    userId: v.id("users"),
    carName: v.string(),
    plateNickname: v.string(),
    photoUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  rallies: defineTable({
    hostUserId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    coverImageUrl: v.optional(v.string()),
    scheduledAt: v.number(),
    visibility: v.union(v.literal("public"), v.literal("private")),
    inviteCode: v.string(),
    status: rallyStatus,
    startLatitude: v.number(),
    startLongitude: v.number(),
    finishLatitude: v.number(),
    finishLongitude: v.number(),
    sequentialCheckpoints: v.boolean(),
    checkInType: v.union(
      v.literal("gps_manual_confirm"),
      v.literal("qr"),
      v.literal("photo"),
    ),
    checkpointRadius: v.number(),
    allowParticipantTracking: v.boolean(),
    publishedAt: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    finishedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_host", ["hostUserId"])
    .index("by_status_scheduled", ["status", "scheduledAt"])
    .index("by_invite_code", ["inviteCode"]),

  rallyParticipants: defineTable({
    rallyId: v.id("rallies"),
    userId: v.id("users"),
    role: v.union(v.literal("host"), v.literal("participant")),
    status: participantStatus,
    joinedAt: v.number(),
    currentCheckpointOrder: v.number(),
    completedCheckpointCount: v.number(),
    lastCheckInAt: v.optional(v.number()),
    lastLocationAt: v.optional(v.number()),
    averageSpeedKmh: v.optional(v.number()),
    distanceKm: v.optional(v.number()),
    finishedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_rally", ["rallyId"])
    .index("by_user", ["userId"])
    .index("by_rally_user", ["rallyId", "userId"]),

  routePoints: defineTable({
    rallyId: v.id("rallies"),
    title: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    order: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_rally_order", ["rallyId", "order"]),

  checkpoints: defineTable({
    rallyId: v.id("rallies"),
    title: v.string(),
    description: v.optional(v.string()),
    latitude: v.number(),
    longitude: v.number(),
    radius: v.number(),
    order: v.number(),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_rally_order", ["rallyId", "order"]),

  checkIns: defineTable({
    rallyId: v.id("rallies"),
    participantId: v.id("rallyParticipants"),
    checkpointId: v.id("checkpoints"),
    latitude: v.number(),
    longitude: v.number(),
    checkedInAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_rally_participant_checkpoint", ["rallyId", "participantId", "checkpointId"])
    .index("by_rally_participant_time", ["rallyId", "participantId", "checkedInAt"])
    .index("by_rally_checkpoint", ["rallyId", "checkpointId"]),

  liveLocations: defineTable({
    rallyId: v.id("rallies"),
    participantId: v.id("rallyParticipants"),
    latitude: v.number(),
    longitude: v.number(),
    heading: v.optional(v.number()),
    speedKmh: v.optional(v.number()),
    updatedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_rally_participant", ["rallyId", "participantId"])
    .index("by_rally_updated_at", ["rallyId", "updatedAt"]),

  rallyResults: defineTable({
    rallyId: v.id("rallies"),
    participantId: v.id("rallyParticipants"),
    participantName: v.string(),
    completionTimeMs: v.optional(v.number()),
    finishTime: v.optional(v.number()),
    checkpointTimeline: v.array(
      v.object({
        checkpointId: v.id("checkpoints"),
        checkpointTitle: v.string(),
        checkedInAt: v.number(),
      }),
    ),
    averageSpeedKmh: v.optional(v.number()),
    distanceKm: v.optional(v.number()),
    rank: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_rally", ["rallyId"])
    .index("by_rally_participant", ["rallyId", "participantId"])
    .index("by_rally_rank", ["rallyId", "rank"]),

  appSettings: defineTable({
    userId: v.id("users"),
    preferredNavigation: v.union(v.literal("google_maps"), v.literal("vietmap")),
    allowParticipantTracking: v.boolean(),
    shareLiveSpeed: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
});

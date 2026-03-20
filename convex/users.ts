import { v } from "convex/values";

import { mutation, query } from "./server";
import { nowTs, requireUserByAuthKey } from "./helpers";

export const listProfiles = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.map((item) => ({
      authKey: item.authKey,
      displayName: item.displayName,
      avatarUrl: item.avatarUrl,
      role: item.role,
    }));
  },
});

export const getProfile = query({
  args: {
    authKey: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_key", (q) => q.eq("authKey", args.authKey))
      .first();

    if (!user) {
      return null;
    }

    return {
      authKey: user.authKey,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
    };
  },
});

export const getProfileWithVehicle = query({
  args: {
    authKey: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUserByAuthKey(ctx, args.authKey);
    const vehicle = await ctx.db
      .query("vehicles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    return {
      authKey: user.authKey,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      vehicle: vehicle
        ? {
            carName: vehicle.carName,
            plateNickname: vehicle.plateNickname,
            photoUrl: vehicle.photoUrl,
          }
        : null,
    };
  },
});

export const upsertProfile = mutation({
  args: {
    authKey: v.string(),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
    role: v.union(v.literal("host"), v.literal("participant")),
  },
  handler: async (ctx, args) => {
    const now = nowTs();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_auth_key", (q) => q.eq("authKey", args.authKey))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        displayName: args.displayName,
        avatarUrl: args.avatarUrl,
        role: args.role,
        updatedAt: now,
      });
      return { userId: existing._id };
    }

    const userId = await ctx.db.insert("users", {
      authKey: args.authKey,
      displayName: args.displayName,
      avatarUrl: args.avatarUrl,
      role: args.role,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("appSettings", {
      userId,
      preferredNavigation: "google_maps",
      allowParticipantTracking: true,
      shareLiveSpeed: true,
      createdAt: now,
      updatedAt: now,
    });

    return { userId };
  },
});

export const upsertVehicle = mutation({
  args: {
    authKey: v.string(),
    carName: v.string(),
    plateNickname: v.string(),
    photoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = nowTs();
    const user = await requireUserByAuthKey(ctx, args.authKey);

    const existing = await ctx.db
      .query("vehicles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        carName: args.carName,
        plateNickname: args.plateNickname,
        photoUrl: args.photoUrl,
        updatedAt: now,
      });
      return { vehicleId: existing._id };
    }

    const vehicleId = await ctx.db.insert("vehicles", {
      userId: user._id,
      carName: args.carName,
      plateNickname: args.plateNickname,
      photoUrl: args.photoUrl,
      createdAt: now,
      updatedAt: now,
    });

    return { vehicleId };
  },
});

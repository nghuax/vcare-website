import { v } from "convex/values";

import { nowTs, requireUserByAuthKey } from "./helpers";
import { mutation, query } from "./server";

export const getSettings = query({
  args: {
    authKey: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUserByAuthKey(ctx, args.authKey);

    const settings = await ctx.db
      .query("appSettings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!settings) {
      return {
        preferredNavigation: "google_maps" as const,
        allowParticipantTracking: true,
        shareLiveSpeed: true,
      };
    }

    return {
      preferredNavigation: settings.preferredNavigation,
      allowParticipantTracking: settings.allowParticipantTracking,
      shareLiveSpeed: settings.shareLiveSpeed,
    };
  },
});

export const updateSettings = mutation({
  args: {
    authKey: v.string(),
    preferredNavigation: v.union(v.literal("google_maps"), v.literal("vietmap")),
    allowParticipantTracking: v.boolean(),
    shareLiveSpeed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireUserByAuthKey(ctx, args.authKey);
    const now = nowTs();

    const existing = await ctx.db
      .query("appSettings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        preferredNavigation: args.preferredNavigation,
        allowParticipantTracking: args.allowParticipantTracking,
        shareLiveSpeed: args.shareLiveSpeed,
        updatedAt: now,
      });
      return { ok: true as const };
    }

    await ctx.db.insert("appSettings", {
      userId: user._id,
      preferredNavigation: args.preferredNavigation,
      allowParticipantTracking: args.allowParticipantTracking,
      shareLiveSpeed: args.shareLiveSpeed,
      createdAt: now,
      updatedAt: now,
    });

    return { ok: true as const };
  },
});

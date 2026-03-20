import { mutation } from "./server";
import { nowTs } from "./helpers";

async function upsertUser(ctx: any, user: { authKey: string; displayName: string; role: "host" | "participant"; avatarUrl?: string; }) {
  const existing = await ctx.db
    .query("users")
    .withIndex("by_auth_key", (q: any) => q.eq("authKey", user.authKey))
    .first();

  const now = nowTs();

  if (existing) {
    await ctx.db.patch(existing._id, {
      displayName: user.displayName,
      role: user.role,
      avatarUrl: user.avatarUrl,
      updatedAt: now,
    });
    return existing._id;
  }

  const userId = await ctx.db.insert("users", {
    authKey: user.authKey,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    role: user.role,
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

  return userId;
}

async function upsertVehicle(
  ctx: any,
  userId: any,
  vehicle: { carName: string; plateNickname: string; photoUrl?: string },
) {
  const existing = await ctx.db
    .query("vehicles")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .first();

  const now = nowTs();

  if (existing) {
    await ctx.db.patch(existing._id, {
      carName: vehicle.carName,
      plateNickname: vehicle.plateNickname,
      photoUrl: vehicle.photoUrl,
      updatedAt: now,
    });
    return existing._id;
  }

  return await ctx.db.insert("vehicles", {
    userId,
    carName: vehicle.carName,
    plateNickname: vehicle.plateNickname,
    photoUrl: vehicle.photoUrl,
    createdAt: now,
    updatedAt: now,
  });
}

async function ensureParticipant(
  ctx: any,
  rallyId: any,
  userId: any,
  role: "host" | "participant",
  status: "registered" | "active" | "finished" | "missed_checkpoint" | "disconnected",
) {
  const existing = await ctx.db
    .query("rallyParticipants")
    .withIndex("by_rally_user", (q: any) => q.eq("rallyId", rallyId).eq("userId", userId))
    .first();

  const now = nowTs();

  if (existing) {
    await ctx.db.patch(existing._id, {
      role,
      status,
      updatedAt: now,
    });
    return existing._id;
  }

  return await ctx.db.insert("rallyParticipants", {
    rallyId,
    userId,
    role,
    status,
    joinedAt: now,
    currentCheckpointOrder: 0,
    completedCheckpointCount: 0,
    createdAt: now,
    updatedAt: now,
  });
}

export const seedDemoData = mutation({
  args: {},
  handler: async (ctx) => {
    const now = nowTs();

    const hostUserId = await upsertUser(ctx, {
      authKey: "demo_host_01",
      displayName: "Hà Trần - Host",
      role: "host",
      avatarUrl: "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&w=256&q=80",
    });
    const participantOneId = await upsertUser(ctx, {
      authKey: "demo_driver_01",
      displayName: "Minh Lê",
      role: "participant",
      avatarUrl: "https://images.unsplash.com/photo-1542204625-de293a0620ab?auto=format&fit=crop&w=256&q=80",
    });
    const participantTwoId = await upsertUser(ctx, {
      authKey: "demo_driver_02",
      displayName: "An Nguyễn",
      role: "participant",
      avatarUrl: "https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=256&q=80",
    });

    await Promise.all([
      upsertVehicle(ctx, hostUserId, {
        carName: "Ford Everest Sport",
        plateNickname: "EVE-001",
      }),
      upsertVehicle(ctx, participantOneId, {
        carName: "Mazda CX-5 Premium",
        plateNickname: "CX5-MINH",
      }),
      upsertVehicle(ctx, participantTwoId, {
        carName: "Toyota Corolla Cross",
        plateNickname: "CROSS-AN",
      }),
    ]);

    let activeRally = await ctx.db
      .query("rallies")
      .withIndex("by_invite_code", (q: any) => q.eq("inviteCode", "RVN001"))
      .first();

    if (!activeRally) {
      const activeRallyId = await ctx.db.insert("rallies", {
        hostUserId,
        title: "Rally Sài Gòn - Đà Lạt Bình Minh",
        description: "Hành trình đêm cao tốc và đèo Prenn, check-in các điểm ngắm bình minh.",
        coverImageUrl: "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1200&q=80",
        scheduledAt: now - 1000 * 60 * 60,
        visibility: "public",
        inviteCode: "RVN001",
        status: "active",
        startLatitude: 10.776889,
        startLongitude: 106.700806,
        finishLatitude: 11.94042,
        finishLongitude: 108.458313,
        sequentialCheckpoints: true,
        checkInType: "gps_manual_confirm",
        checkpointRadius: 120,
        allowParticipantTracking: true,
        publishedAt: now - 1000 * 60 * 120,
        startedAt: now - 1000 * 60 * 30,
        createdAt: now - 1000 * 60 * 130,
        updatedAt: now,
      });

      activeRally = await ctx.db.get(activeRallyId);
    }

    let upcomingRally = await ctx.db
      .query("rallies")
      .withIndex("by_invite_code", (q: any) => q.eq("inviteCode", "RVN777"))
      .first();

    if (!upcomingRally) {
      const upcomingRallyId = await ctx.db.insert("rallies", {
        hostUserId,
        title: "Rally Đà Nẵng - Hội An Coastal Drive",
        description: "Cung đường ven biển cho cộng đồng xe gia đình, tốc độ ổn định và an toàn.",
        coverImageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80",
        scheduledAt: now + 1000 * 60 * 60 * 24 * 2,
        visibility: "private",
        inviteCode: "RVN777",
        status: "not_started",
        startLatitude: 16.054407,
        startLongitude: 108.202164,
        finishLatitude: 15.880058,
        finishLongitude: 108.338047,
        sequentialCheckpoints: true,
        checkInType: "gps_manual_confirm",
        checkpointRadius: 100,
        allowParticipantTracking: false,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      });

      upcomingRally = await ctx.db.get(upcomingRallyId);
    }

    if (!activeRally || !upcomingRally) {
      throw new Error("SEED_RALLY_ERROR");
    }

    const [activeHostParticipantId, activeParticipantOneId, activeParticipantTwoId] = await Promise.all([
      ensureParticipant(ctx, activeRally._id, hostUserId, "host", "active"),
      ensureParticipant(ctx, activeRally._id, participantOneId, "participant", "active"),
      ensureParticipant(ctx, activeRally._id, participantTwoId, "participant", "active"),
    ]);

    await Promise.all([
      ensureParticipant(ctx, upcomingRally._id, hostUserId, "host", "registered"),
      ensureParticipant(ctx, upcomingRally._id, participantOneId, "participant", "registered"),
    ]);

    const existingActiveCheckpoints = await ctx.db
      .query("checkpoints")
      .withIndex("by_rally_order", (q: any) => q.eq("rallyId", activeRally._id))
      .collect();

    if (existingActiveCheckpoints.length === 0) {
      const cp1 = await ctx.db.insert("checkpoints", {
        rallyId: activeRally._id,
        title: "Trạm Long Thành",
        description: "Điểm check-in nghỉ ngắn trước khi vào cao tốc dài.",
        latitude: 10.769372,
        longitude: 107.001456,
        radius: 120,
        order: 1,
        createdAt: now,
        updatedAt: now,
      });
      const cp2 = await ctx.db.insert("checkpoints", {
        rallyId: activeRally._id,
        title: "Trạm Bảo Lộc",
        description: "Kiểm tra đội hình và tốc độ trung bình.",
        latitude: 11.547518,
        longitude: 107.807724,
        radius: 130,
        order: 2,
        createdAt: now,
        updatedAt: now,
      });
      const cp3 = await ctx.db.insert("checkpoints", {
        rallyId: activeRally._id,
        title: "Đích Hồ Xuân Hương",
        description: "Check-in hoàn thành cung đường.",
        latitude: 11.94042,
        longitude: 108.458313,
        radius: 150,
        order: 3,
        createdAt: now,
        updatedAt: now,
      });

      await Promise.all([
        ctx.db.insert("routePoints", {
          rallyId: activeRally._id,
          title: "Xuất phát Quận 1",
          latitude: 10.776889,
          longitude: 106.700806,
          order: 1,
          createdAt: now,
          updatedAt: now,
        }),
        ctx.db.insert("routePoints", {
          rallyId: activeRally._id,
          title: "Qua Long Thành",
          latitude: 10.769372,
          longitude: 107.001456,
          order: 2,
          createdAt: now,
          updatedAt: now,
        }),
        ctx.db.insert("routePoints", {
          rallyId: activeRally._id,
          title: "Qua Bảo Lộc",
          latitude: 11.547518,
          longitude: 107.807724,
          order: 3,
          createdAt: now,
          updatedAt: now,
        }),
        ctx.db.insert("routePoints", {
          rallyId: activeRally._id,
          title: "Kết thúc Đà Lạt",
          latitude: 11.94042,
          longitude: 108.458313,
          order: 4,
          createdAt: now,
          updatedAt: now,
        }),
      ]);

      await Promise.all([
        ctx.db.insert("checkIns", {
          rallyId: activeRally._id,
          participantId: activeParticipantOneId,
          checkpointId: cp1,
          latitude: 10.7694,
          longitude: 107.0015,
          checkedInAt: now - 1000 * 60 * 22,
          createdAt: now,
        }),
        ctx.db.insert("checkIns", {
          rallyId: activeRally._id,
          participantId: activeParticipantTwoId,
          checkpointId: cp1,
          latitude: 10.7692,
          longitude: 107.0016,
          checkedInAt: now - 1000 * 60 * 21,
          createdAt: now,
        }),
        ctx.db.insert("checkIns", {
          rallyId: activeRally._id,
          participantId: activeParticipantOneId,
          checkpointId: cp2,
          latitude: 11.5476,
          longitude: 107.8076,
          checkedInAt: now - 1000 * 60 * 8,
          createdAt: now,
        }),
      ]);

      await Promise.all([
        ctx.db.insert("liveLocations", {
          rallyId: activeRally._id,
          participantId: activeHostParticipantId,
          latitude: 11.7321,
          longitude: 108.0124,
          heading: 40,
          speedKmh: 62,
          updatedAt: now - 1000 * 10,
          createdAt: now - 1000 * 10,
        }),
        ctx.db.insert("liveLocations", {
          rallyId: activeRally._id,
          participantId: activeParticipantOneId,
          latitude: 11.7458,
          longitude: 108.0472,
          heading: 37,
          speedKmh: 68,
          updatedAt: now - 1000 * 8,
          createdAt: now - 1000 * 8,
        }),
        ctx.db.insert("liveLocations", {
          rallyId: activeRally._id,
          participantId: activeParticipantTwoId,
          latitude: 11.7027,
          longitude: 108.0091,
          heading: 42,
          speedKmh: 58,
          updatedAt: now - 1000 * 6,
          createdAt: now - 1000 * 6,
        }),
      ]);
    }

    const existingUpcomingCheckpoints = await ctx.db
      .query("checkpoints")
      .withIndex("by_rally_order", (q: any) => q.eq("rallyId", upcomingRally._id))
      .collect();

    if (existingUpcomingCheckpoints.length === 0) {
      await Promise.all([
        ctx.db.insert("checkpoints", {
          rallyId: upcomingRally._id,
          title: "Bán đảo Sơn Trà",
          description: "Điểm tập hợp và briefing đội hình.",
          latitude: 16.113389,
          longitude: 108.300171,
          radius: 110,
          order: 1,
          createdAt: now,
          updatedAt: now,
        }),
        ctx.db.insert("checkpoints", {
          rallyId: upcomingRally._id,
          title: "Cầu Cửa Đại",
          description: "Kiểm tra checkpoint trước khi vào phố cổ.",
          latitude: 15.909069,
          longitude: 108.368271,
          radius: 110,
          order: 2,
          createdAt: now,
          updatedAt: now,
        }),
        ctx.db.insert("checkpoints", {
          rallyId: upcomingRally._id,
          title: "Phố cổ Hội An",
          description: "Điểm đích và tổng kết đội hình.",
          latitude: 15.880058,
          longitude: 108.338047,
          radius: 120,
          order: 3,
          createdAt: now,
          updatedAt: now,
        }),
      ]);
    }

    return {
      ok: true as const,
      seededRallyId: activeRally._id,
    };
  },
});

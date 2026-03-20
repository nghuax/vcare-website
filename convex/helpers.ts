export type ConvexCtx = {
  db: any;
};

export function nowTs() {
  return Date.now();
}

export function createInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let value = "";
  for (let i = 0; i < 6; i += 1) {
    value += chars[Math.floor(Math.random() * chars.length)];
  }
  return value;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function distanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const earthRadius = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

export async function getUserByAuthKey(ctx: ConvexCtx, authKey: string) {
  const user = await ctx.db
    .query("users")
    .withIndex("by_auth_key", (q: any) => q.eq("authKey", authKey))
    .first();
  return user ?? null;
}

export async function requireUserByAuthKey(ctx: ConvexCtx, authKey: string) {
  const user = await getUserByAuthKey(ctx, authKey);
  if (!user) {
    throw new Error("UNAUTHORIZED_USER");
  }
  return user;
}

export async function getMembership(ctx: ConvexCtx, rallyId: string, userId: string) {
  const membership = await ctx.db
    .query("rallyParticipants")
    .withIndex("by_rally_user", (q: any) =>
      q.eq("rallyId", rallyId).eq("userId", userId),
    )
    .first();
  return membership ?? null;
}

export async function requireHostMembership(
  ctx: ConvexCtx,
  rallyId: string,
  userId: string,
) {
  const membership = await getMembership(ctx, rallyId, userId);
  if (!membership || membership.role !== "host") {
    throw new Error("FORBIDDEN_HOST_ONLY");
  }
  return membership;
}

export async function requireParticipantMembership(
  ctx: ConvexCtx,
  rallyId: string,
  userId: string,
) {
  const membership = await getMembership(ctx, rallyId, userId);
  if (!membership) {
    throw new Error("FORBIDDEN_PARTICIPANT_ONLY");
  }
  return membership;
}

export async function getRallyById(ctx: ConvexCtx, rallyId: string) {
  const rally = await ctx.db.get(rallyId);
  if (!rally) {
    return null;
  }
  return rally;
}

# Convex Backend (Rally VN)

This folder now contains the Rally VN backend:

- `schema.ts` - tables/indexes
- `users.ts` - profile + vehicle
- `rallies.ts` - rally CRUD, publish/start/finish, dashboard/read models
- `checkins.ts` - GPS radius check-in + sequential constraints
- `tracking.ts` - live location + speed updates
- `settings.ts` - app settings (navigation + privacy)
- `seed.ts` - Vietnamese demo data

Deployment URLs used by app env:

- Cloud URL: `https://first-wren-192.convex.cloud`
- HTTP Actions URL: `https://first-wren-192.convex.site`

Run locally:

```bash
npm run convex:dev
```

Seed demo data from UI:
- `/rally/auth` -> `Seed dữ liệu demo`
- `/rally/home` -> `Seed Demo`

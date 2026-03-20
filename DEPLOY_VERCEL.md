# Deploy VCare On Vercel (Full Version)

1. Open: `https://vercel.com/new`
2. Import repo: `nghuax/vcare-website`
3. Framework preset: `Next.js`
4. Add environment variables from `.env.example`:
   - `DATABASE_URL`
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`
   - `NEXT_PUBLIC_APP_NAME`
   - `NEXT_PUBLIC_APP_URL`
   - `NEXT_PUBLIC_CONVEX_URL`
   - `CONVEX_HTTP_ACTIONS_URL`
   - `EXPO_PUBLIC_CONVEX_URL`
   - `EXPO_PUBLIC_CONVEX_HTTP_URL`
5. Deploy.
6. After first deploy, set `NEXTAUTH_URL` to the deployed production URL and redeploy.
7. Run one-time schema sync against production DB:
   - `npx prisma db push`

Notes:
- `vercel.json` already sets install/build commands.
- API routes and Prisma are supported on Vercel.

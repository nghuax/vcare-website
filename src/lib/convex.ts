import { ConvexHttpClient } from "convex/browser";

const defaultConvexCloudUrl = "https://first-wren-192.convex.cloud";
const defaultConvexHttpUrl = "https://first-wren-192.convex.site";

export const convexCloudUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL ??
  process.env.EXPO_PUBLIC_CONVEX_URL ??
  defaultConvexCloudUrl;

export const convexClient = new ConvexHttpClient(convexCloudUrl);

export const convexHttpActionsUrl =
  process.env.CONVEX_HTTP_ACTIONS_URL ??
  process.env.EXPO_PUBLIC_CONVEX_HTTP_URL ??
  defaultConvexHttpUrl;

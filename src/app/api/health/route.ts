import { NextResponse } from "next/server";

import { convexCloudUrl, convexHttpActionsUrl } from "@/lib/convex";

export async function GET() {
  return NextResponse.json({
    name: "VCare",
    status: "ok",
    timestamp: new Date().toISOString(),
    convex: {
      cloudUrl: convexCloudUrl,
      httpActionsUrl: convexHttpActionsUrl,
    },
  });
}

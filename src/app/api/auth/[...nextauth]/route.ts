import { NextResponse } from "next/server";

function disabledAuthResponse() {
  return NextResponse.json(
    {
      message:
        "Authentication is disabled. VCare currently runs in guest mode without login.",
    },
    { status: 410 },
  );
}

export async function GET() {
  return disabledAuthResponse();
}

export async function POST() {
  return disabledAuthResponse();
}

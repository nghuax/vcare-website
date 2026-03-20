import { NextResponse } from "next/server";

export async function POST(request: Request) {
  void request;

  return NextResponse.json(
    {
      message:
        "Signup is disabled. VCare currently runs in guest mode without account creation.",
    },
    { status: 410 },
  );
}

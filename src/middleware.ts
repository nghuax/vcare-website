import { NextResponse } from "next/server";

export async function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/patient/:path*", "/admin/:path*", "/login", "/signup", "/admin-login"],
};

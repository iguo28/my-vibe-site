import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE = "cafe_connect_user";

export function middleware(request: NextRequest) {
  if (request.cookies.get(COOKIE)?.value) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  response.cookies.set(COOKIE, crypto.randomUUID(), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

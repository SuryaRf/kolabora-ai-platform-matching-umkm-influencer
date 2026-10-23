import { NextResponse } from "next/server";

// Route protection is handled server-side in the dashboard layouts and in each
// API route (NextAuth session check). We keep middleware as a no-op with an
// empty matcher so Prisma never gets bundled into the edge runtime.
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

export const runtime = "nodejs";

/**
 * Mengakhiri sesi yang sudah tidak selaras dengan basis data.
 *
 * Route Handler adalah satu-satunya tempat yang boleh menghapus cookie
 * sekaligus mengalihkan, sehingga tidak terjadi loop dengan middleware.
 */
export async function GET(request: NextRequest) {
  const res = NextResponse.redirect(new URL("/login?err=sesi", request.url));
  res.cookies.delete(SESSION_COOKIE);
  return res;
}

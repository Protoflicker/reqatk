import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

const USER_HOME = "/dashboard";
const ADMIN_HOME = "/admin";

/** Halaman milik user biasa; admin diarahkan ke area /admin. */
const USER_PATHS = ["/dashboard", "/barang", "/permintaan", "/laporan"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  const isLogin = pathname === "/login";

  if (!session) {
    if (isLogin) return NextResponse.next();
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  const home = session.role === "admin" ? ADMIN_HOME : USER_HOME;

  if (isLogin || pathname === "/") {
    return NextResponse.redirect(new URL(home, request.url));
  }

  if (pathname.startsWith("/admin") && session.role !== "admin") {
    return NextResponse.redirect(new URL(USER_HOME, request.url));
  }

  if (
    session.role === "admin" &&
    USER_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  ) {
    return NextResponse.redirect(new URL(ADMIN_HOME, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|ico|webp)$).*)"],
};

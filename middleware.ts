import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabaseMiddleware";

const PUBLIC_ROUTES = ["/login", "/auth/callback", "/votes"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  const { supabase, getResponse } = createSupabaseMiddlewareClient(request);

  if (!supabase) {
    if (isPublicRoute) return getResponse();
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // getUser() refreshes expired tokens and writes them back via setAll —
  // middleware is the only place that can do this correctly.
  // Fall back to getSession() if the network call fails so a transient
  // error never causes a false logout.
  const { data: { user } } = await supabase.auth.getUser();

  const supabaseResponse = getResponse();

  let authenticated = !!user;
  if (!authenticated) {
    const { data: { session: fallbackSession } } = await supabase.auth.getSession();
    authenticated = !!fallbackSession;
  }

  if (!authenticated && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    // Copy refreshed session cookies onto the redirect so they aren't lost
    const redirectRes = NextResponse.redirect(loginUrl);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectRes.cookies.set(cookie.name, cookie.value);
    });
    return redirectRes;
  }

  if (authenticated && pathname === "/login") {
    const homeUrl = new URL("/", request.url);
    const redirectRes = NextResponse.redirect(homeUrl);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectRes.cookies.set(cookie.name, cookie.value);
    });
    return redirectRes;
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

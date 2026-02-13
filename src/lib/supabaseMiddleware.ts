import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export function createSupabaseMiddlewareClient(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  if (!url || !anonKey) {
    return { supabase: null, response };
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options) {
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options) {
        response.cookies.set({ name, value: "", ...options, maxAge: 0 });
      },
    },
  });

  return { supabase, response };
}

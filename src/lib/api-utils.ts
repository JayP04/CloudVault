import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export type AuthenticatedRequest = {
  user: SupabaseUser;
};

/**
 * Get the authenticated user from a request.
 * Returns the user or a 401 response — API routes just check:
 *
 * const auth = await getAuthUser(request);
 * if (auth instanceof NextResponse) return auth;
 * const { user } = auth;
 */
export async function getAuthUser(
  request: NextRequest
): Promise<AuthenticatedRequest | NextResponse> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // API routes don't need to set cookies
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return { user };
}

/** Standard JSON error response */
export function apiError(message: string, status: number = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/** Standard JSON success response */
export function apiSuccess<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

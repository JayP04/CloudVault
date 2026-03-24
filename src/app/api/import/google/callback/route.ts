import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens } from "@/lib/google-photos";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  // Verify auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", appUrl));
  }

  // Verify CSRF state
  const cookieStore = await cookies();
  const storedState = cookieStore.get("google_photos_state")?.value;
  const returnedState = request.nextUrl.searchParams.get("state");

  if (!storedState || storedState !== returnedState) {
    return NextResponse.redirect(new URL("/library?import=error&reason=state_mismatch", appUrl));
  }

  // Clear the state cookie
  cookieStore.delete("google_photos_state");

  // Check for error from Google
  const error = request.nextUrl.searchParams.get("error");
  if (error) {
    return NextResponse.redirect(new URL(`/library?import=error&reason=${error}`, appUrl));
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/library?import=error&reason=no_code", appUrl));
  }

  try {
    const redirectUri = `${appUrl}/api/import/google/callback`;
    const tokens = await exchangeCodeForTokens(code, redirectUri);

    // Store tokens in import_sources (using admin to bypass RLS)
    const admin = getAdminClient();

    // Upsert: if user already connected Google Photos, update tokens
    const { error: dbError } = await admin
      .from("import_sources")
      .upsert(
        {
          user_id: user.id,
          provider: "google_photos",
          access_token_encrypted: tokens.access_token,
          refresh_token_encrypted: tokens.refresh_token,
          token_expires_at: new Date(
            Date.now() + tokens.expires_in * 1000
          ).toISOString(),
          is_connected: true,
        },
        { onConflict: "user_id,provider" }
      );

    if (dbError) {
      console.error("Failed to store import source:", dbError);
      return NextResponse.redirect(new URL("/library?import=error&reason=db_error", appUrl));
    }

    return NextResponse.redirect(new URL("/library?import=google_connected", appUrl));
  } catch (err) {
    console.error("Google Photos callback error:", err);
    return NextResponse.redirect(new URL("/library?import=error&reason=token_exchange", appUrl));
  }
}

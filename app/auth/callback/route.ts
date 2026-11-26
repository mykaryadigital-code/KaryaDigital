import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const productPath =
  /^\/ebook\/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");

  const productDestination =
    next && productPath.test(next) ? next : null;

  const loginUrl = new URL("/login", url.origin);

  if (productDestination) {
    loginUrl.searchParams.set("next", productDestination);
  }

  function loginError(reason: string) {
    const destination = new URL(loginUrl);
    destination.searchParams.set("error", reason);

    return NextResponse.redirect(destination, {
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  if (!code) return loginError("invalid_link");

  const supabase = await createClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) return loginError("expired_link");

  // Kekalkan aliran recovery dan cookie asal.
  const isRecovery = next === "/reset-password";
  const destination = isRecovery
    ? new URL("/reset-password", url.origin)
    : loginUrl;

  const response = NextResponse.redirect(destination, {
    headers: { "Cache-Control": "private, no-store" },
  });

  if (isRecovery) {
    response.cookies.set("kd_password_recovery", "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
  }

  return response;
}

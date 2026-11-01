
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
console.log("KD callback parameters:", {
  hasCode: Boolean(code),
  next,
  hasError: url.searchParams.has("error"),
  errorCode: url.searchParams.get("error_code"),
});
  const redirectPath =
    next === "/reset-password" ? next : "/login";

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=invalid_link", url.origin)
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);
console.log("KD recovery callback:", {
  next,
  success: !error,
  errorCode: error?.code ?? null,
});
  if (error) {
    return NextResponse.redirect(
      new URL("/login?error=expired_link", url.origin)
    );
  }

 
const response = NextResponse.redirect(
  new URL(redirectPath, url.origin)
);

if (redirectPath === "/reset-password") {
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

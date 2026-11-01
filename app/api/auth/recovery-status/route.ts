
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const cookieStore = await cookies();

  const recoveryMarker =
    cookieStore.get("kd_password_recovery")?.value === "1";

  if (!recoveryMarker) {
    return NextResponse.json(
      { ready: false },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return NextResponse.json(
    { ready: !error && !!user },
    { headers: { "Cache-Control": "no-store" } }
  );
}

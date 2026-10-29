
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

export default async function SellerDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();

  // Sahkan pengguna melalui Supabase Auth
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Semak peranan daripada database
  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

  // Hanya seller dibenarkan masuk
  if (profileError || profile?.role !== "seller") {
    redirect("/akaun");
  }

  return <>{children}</>;
}

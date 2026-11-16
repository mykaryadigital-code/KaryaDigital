"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Role = "buyer" | "seller" | "admin";

export default function AkaunPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const loggingOut = useRef(false);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadAccount() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (!active) return;

        if (authError || !user) {
          router.replace("/login");
          return;
        }

        setEmail(user.email ?? "");

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", user.id)
          .maybeSingle();

        if (!active) return;

        if (profileError || !profile) {
          setErrorMessage(
            "Maklumat profil gagal dimuatkan. Sila muat semula halaman."
          );
          return;
        }

        setFullName(profile.full_name?.trim() ?? "");

        if (
          profile.role === "buyer" ||
          profile.role === "seller" ||
          profile.role === "admin"
        ) {
          setRole(profile.role);
        } else {
          setErrorMessage(
            "Peranan akaun tidak dikenal pasti. Sila hubungi pentadbir."
          );
        }
      } catch {
        if (active) {
          setErrorMessage(
            "Gagal menyemak akaun. Sila muat semula halaman."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadAccount();

    return () => {
      active = false;
    };
  }, [router, supabase]);

  async function logout() {
    if (loggingOut.current) return;

    loggingOut.current = true;
    setLogoutLoading(true);
    setErrorMessage("");

    try {
      const { error } = await supabase.auth.signOut({
        scope: "local",
      });

      if (error) {
        setErrorMessage("Gagal log keluar. Sila cuba lagi.");
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setErrorMessage(
        "Sambungan terganggu semasa log keluar. Sila cuba lagi."
      );
    } finally {
      loggingOut.current = false;
      setLogoutLoading(false);
    }
  }

  const roleLabels: Record<Role, string> = {
    buyer: "Pembeli",
    seller: "Penjual",
    admin: "Admin",
  };

  const menuItems = [
    {
      title: "Marketplace",
      description: "Terokai eBook yang tersedia.",
      href: "/",
    },
    {
      title: "Pesanan Saya",
      description: "Semak bayaran, baca dan muat turun pembelian.",
      href: "/pesanan",
    },
    {
      title: "Maklumat Pembeli",
      description: "Lengkapkan nama dan nombor telefon untuk pembelian.",
      href: "/maklumat-pembeli",
    },
  ];

  if (role === "admin") {
    menuItems.unshift({
      title: "Dashboard Admin",
      description: "Urus penjual, eBook, jualan dan payout.",
      href: "/admin",
    });
  }

  if (role === "seller") {
    menuItems.unshift(
      {
        title: "Dashboard Penjual",
        description: "Urus eBook, jualan dan ringkasan pendapatan.",
        href: "/penjual/dashboard",
      },
      {
        title: "Butiran Bank",
        description: "Semak dan kemas kini akaun bank payout.",
        href: "/penjual/bank",
      },
      {
        title: "Sejarah Payout",
        description: "Lihat status payout dan rujukan transfer.",
        href: "/penjual/payout",
      }
    );
  }

  if (role === "buyer") {
    menuItems.push({
      title: "Jadi Penjual",
      description: "Mohon membuka kedai dan menjual eBook anda.",
      href: "/jadi-penjual",
    });
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-10 text-center text-gray-600">
        Sedang memuatkan akaun...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <Link
            href="/"
            className="text-2xl font-extrabold text-indigo-600"
          >
            KaryaDigital
          </Link>

          <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Akaun Saya
              </h1>

              <p className="mt-2 text-gray-600">
                {fullName
                  ? `Selamat datang, ${fullName}!`
                  : "Selamat datang!"}
              </p>

              {email && (
                <p className="mt-2 break-all text-sm text-gray-600">
                  {email}
                </p>
              )}
            </div>

            {role && (
              <span className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
                {roleLabels[role]}
              </span>
            )}
          </div>

          {errorMessage && (
            <p
              role="alert"
              className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
            >
              {errorMessage}
            </p>
          )}
        </section>

        <nav
          aria-label="Menu akaun"
          className="mt-6 grid gap-4 sm:grid-cols-2"
        >
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
            >
              <h2 className="text-lg font-bold text-gray-900">
                {item.title}
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {item.description}
              </p>

              <span
                aria-hidden="true"
                className="mt-4 inline-block font-semibold text-indigo-600"
              >
                Buka →
              </span>
            </Link>
          ))}
        </nav>

        <div className="mt-8">
          <button
            type="button"
            onClick={logout}
            disabled={logoutLoading}
            className="rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {logoutLoading ? "Sedang Log Keluar..." : "Log Keluar"}
          </button>

          <p className="mt-3 text-xs text-gray-500">
            Log keluar daripada sesi pada browser ini.
          </p>
        </div>
      </div>
    </main>
  );
}

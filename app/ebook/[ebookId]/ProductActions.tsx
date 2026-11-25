"use client";

import Link from "next/link";
import { useRef, useState } from "react";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type CheckoutResult = {
  success?: boolean;
  orderId?: string;
  error?: string;
};

export default function ProductActions({
  ebookId,
  canBuy,
}: {
  ebookId: string;
  canBuy: boolean;
}) {
  const sending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [shareUrl, setShareUrl] = useState("");

  async function buyNow() {
    if (sending.current || busy || locked || !canBuy) return;

    sending.current = true;
    setBusy(true);
    setMessage("");
    setNeedsLogin(false);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ebookIds: [ebookId] }),
        cache: "no-store",
      });

      const result: CheckoutResult | null =
        await response.json().catch(() => null);

      if (response.status === 401) {
        setNeedsLogin(true);
        setMessage(
        "Sila log masuk dahulu. Selepas login, anda akan kembali " +
        "ke produk ini untuk meneruskan pembelian."
        );
        return;
      }

      if (!response.ok) {
        if (response.status >= 500) {
          setLocked(true);
          setMessage(
            "Keputusan pesanan belum dapat dipastikan. Semak " +
              "Pesanan Saya sebelum membuat pesanan lain."
          );
        } else {
          setMessage(
            result?.error ??
              "Pesanan tidak dapat dibuat. Muat semula halaman " +
                "untuk menyemak ketersediaan produk."
          );
        }
        return;
      }

      if (
        result?.success !== true ||
        typeof result.orderId !== "string" ||
        !uuidPattern.test(result.orderId)
      ) {
        setLocked(true);
        setMessage(
          "Jawapan pesanan tidak lengkap. Semak Pesanan Saya " +
            "sebelum mencuba lagi."
        );
        return;
      }

      setLocked(true);
      setOrderId(result.orderId);
      setMessage(
        "Pesanan berjaya dibuat. Membuka Pesanan Saya untuk pembayaran..."
      );
      window.location.assign("/pesanan");
    } catch {
      setLocked(true);
      setMessage(
        "Sambungan terganggu. Semak Pesanan Saya sebelum mencuba " +
          "lagi supaya tidak mencipta pesanan berganda."
      );
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  async function copyLink() {
    const url = `${window.location.origin}/ebook/${ebookId}`;
    setShareUrl(url);
    setShareMessage("");

    try {
      await navigator.clipboard.writeText(url);
      setShareMessage("Pautan produk berjaya disalin.");
    } catch {
      setShareMessage("Salin pautan dalam ruang di bawah.");
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <button
        type="button"
        onClick={buyNow}
        disabled={!canBuy || busy || locked}
        className="w-full rounded-xl bg-orange-600 px-5 py-3 font-bold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
      >
        {busy
          ? "Sedang membuat pesanan..."
          : locked
          ? "Semak Pesanan Saya"
          : "Beli Sekarang"}
      </button>

      <p className="text-sm leading-relaxed text-slate-600">
        Butang ini membuat pesanan satu eBook. Pembayaran
        diteruskan melalui halaman Pesanan Saya.
      </p>

      {!canBuy && (
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          Produk ini belum tersedia untuk checkout kerana harga
          jualan tidak memenuhi syarat. Hubungi bantuan.
        </p>
      )}

      {message && (
        <div
          role="status"
          className="space-y-3 rounded-xl bg-slate-100 p-4 text-sm"
        >
          <p>{message}</p>

          {orderId && (
            <p className="break-all font-mono text-xs">
              ID pesanan: {orderId}
            </p>
          )}

          {needsLogin && (
            <Link
            href={`/login?next=${encodeURIComponent(`/ebook/${ebookId}`)}`}
              className="block font-semibold text-orange-700 underline"
            >
              Log Masuk
            </Link>
          )}

          <Link
            href="/pesanan"
            className="block font-semibold text-orange-700 underline"
          >
            Buka Pesanan Saya
          </Link>
        </div>
      )}

      <button
        type="button"
        onClick={copyLink}
        className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold hover:bg-slate-50"
      >
        Salin Pautan Produk
      </button>

      {shareMessage && (
        <div className="space-y-2">
          <p role="status" className="text-sm text-slate-600">
            {shareMessage}
          </p>
          <input
            aria-label="Pautan produk untuk dikongsi"
            readOnly
            value={shareUrl}
            onFocus={(event) => event.currentTarget.select()}
            className="w-full rounded-lg border bg-white p-3 text-sm"
          />
        </div>
      )}
    </div>
  );
}

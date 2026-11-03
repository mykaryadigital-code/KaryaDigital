
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function BacaEbookPage() {
  const params = useParams();
  const ebookId = params.ebookId as string;

  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let objectUrl = "";

    async function loadPage() {
      setLoading(true);
      setError("");
      setImageUrl("");

      try {
        const response = await fetch("/api/reader/page", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ebookId,
            pageNumber,
          }),
          cache: "no-store",
        });

        if (!response.ok) {
          const result = await response.json().catch(() => null);

          throw new Error(
            result?.error || "Gagal membuka halaman eBook."
          );
        }

        const contentType =
          response.headers.get("content-type") || "";

        if (!contentType.includes("image/png")) {
          throw new Error("Format halaman tidak sah.");
        }

        const pages = Number(
          response.headers.get("X-Total-Pages")
        );

        if (!Number.isSafeInteger(pages) || pages < 1) {
          throw new Error("Jumlah halaman tidak sah.");
        }

        const blob = await response.blob();

        if (!active) return;

        objectUrl = URL.createObjectURL(blob);

        setTotalPages(pages);
        setImageUrl(objectUrl);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Gagal memaparkan halaman eBook."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadPage();

    return () => {
      active = false;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [ebookId, pageNumber]);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/perpustakaan"
          className="text-sm font-semibold text-orange-600"
        >
          ← Kembali ke Perpustakaan
        </Link>

        <h1 className="mt-5 text-2xl font-bold text-slate-900">
          📖 Pembaca eBook KaryaDigital
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Bacaan dalam talian untuk eBook yang telah dibeli.
        </p>

        {loading && (
          <div className="mt-8 rounded-xl bg-white p-8 text-center">
            <p className="text-slate-600">
              Sedang memaparkan halaman...
            </p>
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-xl bg-red-50 p-5 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && imageUrl && (
          <div className="mt-6">
            <div className="rounded-xl bg-white p-3 shadow">
              {/* Imej halaman yang dijana oleh server */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={`Halaman ${pageNumber} eBook`}
                className="mx-auto h-auto max-w-full select-none"
                draggable={false}
                onContextMenu={(event) => event.preventDefault()}
              />
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() =>
                  setPageNumber((p) => Math.max(1, p - 1))
                }
                disabled={pageNumber <= 1 || loading}
                className="rounded-lg bg-orange-500 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Sebelumnya
              </button>

              <span className="text-sm font-semibold text-slate-700">
                Halaman {pageNumber} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() =>
                  setPageNumber((p) =>
                    Math.min(totalPages, p + 1)
                  )
                }
                disabled={pageNumber >= totalPages || loading}
                className="rounded-lg bg-orange-500 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Seterusnya →
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-slate-500">
              © KaryaDigital — Untuk bacaan pemilik akaun sahaja.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

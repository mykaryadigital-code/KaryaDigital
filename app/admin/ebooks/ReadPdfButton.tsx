
"use client";

import { useState } from "react";

type Props = {
  ebookId: string;
};

export default function ReadPdfButton({ ebookId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleReadPdf() {
    setLoading(true);
    setError("");

    // Buka tab dahulu supaya browser tidak sekat popup
    const pdfTab = window.open("", "_blank");

    if (!pdfTab) {
      setError("Browser menyekat tab baharu. Benarkan popup.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/ebooks/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ebookId }),
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.url) {
        throw new Error(result.error || "Gagal membuka PDF.");
      }

      pdfTab.location.replace(result.url);
    } catch (err) {
      pdfTab.close();

      setError(
        err instanceof Error
          ? err.message
          : "Ralat semasa membuka PDF."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleReadPdf}
        disabled={loading}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Membuka PDF..." : "📖 Baca PDF"}
      </button>

      {error && (
        <p className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

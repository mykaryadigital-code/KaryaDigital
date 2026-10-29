
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  ebookId: string;
};

export default function ReviewEbookButtons({ ebookId }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleReview(
    decision: "approved" | "rejected"
  ) {
    const action =
      decision === "approved" ? "meluluskan" : "menolak";

    const confirmed = window.confirm(
      `Adakah anda pasti mahu ${action} eBook ini?`
    );

    if (!confirmed) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { error: rpcError } = await supabase.rpc(
        "review_ebook",
        {
          p_ebook_id: ebookId,
          p_decision: decision,
        }
      );

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      setSuccess(
        decision === "approved"
          ? "eBook berjaya diluluskan!"
          : "eBook berjaya ditolak!"
      );

      // Segarkan senarai eBook selepas keputusan dibuat
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ralat semasa menyemak eBook."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleReview("approved")}
          disabled={loading}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Memproses..." : "✓ Luluskan"}
        </button>

        <button
          type="button"
          onClick={() => handleReview("rejected")}
          disabled={loading}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "Memproses..." : "✕ Tolak"}
        </button>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {success && (
        <p className="mt-2 text-sm text-green-600">
          {success}
        </p>
      )}
    </div>
  );
}

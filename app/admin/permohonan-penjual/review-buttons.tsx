
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";

export default function ReviewButtons({
  applicationId,
}: {
  applicationId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function review(decision: "approved" | "rejected") {
    const action =
      decision === "approved" ? "meluluskan" : "menolak";

    if (!window.confirm(`Adakah anda pasti mahu ${action} permohonan ini?`)) {
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const supabase = createClient();

      const { error } = await supabase.rpc(
        "review_seller_application",
        {
          p_application_id: applicationId,
          p_decision: decision,
        }
      );

      if (error) throw error;

      setSuccessMessage(
        decision === "approved"
          ? "Permohonan berjaya diluluskan."
          : "Permohonan berjaya ditolak."
      );

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Gagal memproses permohonan."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={() => review("approved")}
          className="rounded-lg bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Memproses..." : "✓ Lulus"}
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => review("rejected")}
          className="rounded-lg bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "Memproses..." : "✕ Tolak"}
        </button>
      </div>

      {errorMessage && (
        <p role="alert" className="text-sm text-red-600">
          {errorMessage}
        </p>
      )}

      {successMessage && (
        <p role="status" className="text-sm text-green-700">
          {successMessage}
        </p>
      )}
    </div>
  );
}

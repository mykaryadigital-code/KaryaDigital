"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { createClient } from "@/lib/supabase/client";

type Revision = number | string;

function validRevision(value: unknown): value is Revision {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value >= 1;
  }

  return (
    typeof value === "string" &&
    /^[1-9]\d*$/.test(value)
  );
}

export default function SellerBankForm() {
  const supabase = useMemo(() => createClient(), []);
  const submitting = useRef(false);

  const [bankName, setBankName] = useState("");
  const [holderName, setHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [revision, setRevision] = useState<Revision | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mustReload, setMustReload] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadBankAccount() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          throw new Error(
            "Sesi log masuk tamat. Sila log masuk semula."
          );
        }

        const { data, error: queryError } = await supabase
          .from("seller_bank_accounts")
          .select(
            "bank_name, account_holder_name, account_number, revision"
          )
          .eq("seller_id", user.id)
          .maybeSingle();

        if (queryError) {
          throw new Error("Butiran bank gagal dimuatkan.");
        }

        if (!active) return;

        if (data) {
          if (!validRevision(data.revision)) {
            throw new Error(
              "Versi rekod bank tidak sah. Sila hubungi sokongan."
            );
          }

          setBankName(data.bank_name);
          setHolderName(data.account_holder_name);
          setAccountNumber(data.account_number);
          setRevision(data.revision);
        }
      } catch (err) {
        if (active) {
          setLoadFailed(true);
          setError(
            err instanceof Error
              ? err.message
              : "Gagal memuatkan butiran bank."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadBankAccount();

    return () => {
      active = false;
    };
  }, [supabase]);

  function clearMessages() {
    setError("");
    setMessage("");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      submitting.current ||
      loading ||
      loadFailed ||
      mustReload
    ) {
      return;
    }

    clearMessages();

    const cleanBankName = bankName.trim();
    const cleanHolderName = holderName.trim();
    const cleanAccountNumber = accountNumber
      .trim()
      .replace(/[ -]/g, "");

    if (
      cleanBankName.length < 2 ||
      cleanBankName.length > 100
    ) {
      setError("Masukkan nama bank antara 2 hingga 100 aksara.");
      return;
    }

    if (
      cleanHolderName.length < 2 ||
      cleanHolderName.length > 200
    ) {
      setError("Masukkan nama pemegang akaun yang lengkap.");
      return;
    }

    if (!/^[0-9]{6,34}$/.test(cleanAccountNumber)) {
      setError(
        "Nombor akaun mesti mengandungi 6 hingga 34 digit."
      );
      return;
    }

    const confirmed = window.confirm(
      `Simpan butiran bank berikut?\n\nBank: ${cleanBankName}\nPemegang: ${cleanHolderName}\nNombor akaun: ${cleanAccountNumber}\n\nPastikan semua maklumat tepat.`
    );

    if (!confirmed) return;

    submitting.current = true;
    setSaving(true);

    try {
      const { data, error: saveError } = await supabase.rpc(
        "save_seller_bank_account",
        {
          p_bank_name: cleanBankName,
          p_account_holder_name: cleanHolderName,
          p_account_number: cleanAccountNumber,
          p_expected_revision: revision,
        }
      );

      if (saveError) {
        setError(
          `${saveError.message} Muat semula halaman untuk menyemak rekod terkini sebelum mencuba lagi.`
        );
        setMustReload(true);
        return;
      }

      if (!validRevision(data)) {
        setError(
          "Keputusan simpanan belum dapat dipastikan. Muat semula halaman untuk menyemak butiran terkini."
        );
        setMustReload(true);
        return;
      }

      setBankName(cleanBankName);
      setHolderName(cleanHolderName);
      setAccountNumber(cleanAccountNumber);
      setRevision(data);

      setMessage(
        "Butiran bank berjaya disimpan. Simpanan ini bukan pengesahan pemilikan akaun bank."
      );
    } catch {
      setError(
        "Sambungan terganggu. Muat semula halaman untuk menyemak sama ada butiran telah disimpan."
      );
      setMustReload(true);
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  const inputStyle =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100";

  if (loading) {
    return (
      <p className="mt-8 text-sm text-slate-500">
        Sedang memuatkan butiran bank...
      </p>
    );
  }

  if (loadFailed) {
    return (
      <div className="mt-8 rounded-2xl border bg-white p-6">
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white"
        >
          Muat Semula
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <fieldset
        disabled={saving || mustReload}
        className="space-y-5"
      >
        <div>
          <label
            htmlFor="seller-bank-name"
            className="mb-2 block text-sm font-semibold"
          >
            Nama Bank
          </label>

          <input
            id="seller-bank-name"
            type="text"
            value={bankName}
            onChange={(event) => {
              setBankName(event.target.value);
              clearMessages();
            }}
            minLength={2}
            maxLength={100}
            required
            autoComplete="off"
            placeholder="Nama bank"
            className={inputStyle}
          />
        </div>

        <div>
          <label
            htmlFor="seller-account-holder"
            className="mb-2 block text-sm font-semibold"
          >
            Nama Pemegang Akaun
          </label>

          <input
            id="seller-account-holder"
            type="text"
            value={holderName}
            onChange={(event) => {
              setHolderName(event.target.value);
              clearMessages();
            }}
            minLength={2}
            maxLength={200}
            required
            autoComplete="off"
            placeholder="Nama seperti pada akaun bank"
            className={inputStyle}
          />
        </div>

        <div>
          <label
            htmlFor="seller-account-number"
            className="mb-2 block text-sm font-semibold"
          >
            Nombor Akaun
          </label>

          <input
            id="seller-account-number"
            type="text"
            inputMode="numeric"
            value={accountNumber}
            onChange={(event) => {
              setAccountNumber(event.target.value);
              clearMessages();
            }}
            maxLength={70}
            required
            autoComplete="off"
            spellCheck={false}
            placeholder="Masukkan nombor akaun bank"
            className={inputStyle}
          />

          <p className="mt-2 text-xs text-slate-500">
            Masukkan nombor akaun, bukan nombor kad, PIN,
            password atau TAC/OTP.
          </p>
        </div>

        <div className="rounded-xl bg-indigo-50 p-4 text-sm leading-relaxed text-indigo-900">
          Butiran ini boleh dilihat oleh anda dan Admin untuk
          urusan payout. Menyimpan borang tidak membuat
          pemindahan wang.
        </div>

        <button
          type="submit"
          disabled={saving || mustReload}
          className="w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Sedang Menyimpan..." : "Simpan Butiran Bank"}
        </button>
      </fieldset>

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {message && (
        <p
          role="status"
          className="mt-5 rounded-xl bg-green-50 p-4 text-sm text-green-800"
        >
          {message}
        </p>
      )}

      {mustReload && (
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-xl border border-indigo-600 px-5 py-3 text-sm font-bold text-indigo-700"
        >
          Muat Semula Butiran Terkini
        </button>
      )}
    </form>
  );
}
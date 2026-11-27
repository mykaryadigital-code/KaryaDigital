"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SellerAvatar from "./SellerAvatar";

type SellerProfileFormProps = {
  sellerId: string;
  shopName: string;
  initialAvatarPath: string | null;
};

const BUCKET = "seller-avatars";
const MAX_BYTES = 2 * 1024 * 1024;
const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export default function SellerProfileForm({
  sellerId,
  shopName,
  initialAvatarPath,
}: SellerProfileFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const inputRef = useRef<HTMLInputElement>(null);
  const sending = useRef(false);
  const selectionVersion = useRef(0);
  const [avatarPath, setAvatarPath] = useState(initialAvatarPath);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    return () => { selectionVersion.current += 1; };
  }, []);

  const avatarUrl = avatarPath
    ? supabase.storage.from(BUCKET).getPublicUrl(avatarPath).data.publicUrl
    : null;
  const disabled = checking || saving || needsRefresh;

  function resetSelection() {
    selectionVersion.current += 1;
    setSelectedFile(null);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    if (sending.current || needsRefresh) return;
    const file = event.target.files?.[0];
    if (!file) return;
    const version = ++selectionVersion.current;
    setChecking(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setMessage("");
    setErrorMessage("");

    if (!extensions[file.type]) {
      setErrorMessage("Pilih fail JPG, PNG atau WebP.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (file.size === 0 || file.size > MAX_BYTES) {
      setErrorMessage("Saiz gambar mestilah lebih daripada 0 dan maksimum 2MB.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setChecking(true);
    const localUrl = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = localUrl;
      await image.decode();
      if (!image.naturalWidth || !image.naturalHeight) {
        throw new Error("Invalid image");
      }
      // Saiz sesuai untuk profil; pengekodan semula membuang metadata fail.
      const scale = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Image processing unavailable");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", 0.9)
      );
      if (!blob || !extensions[blob.type] || blob.size === 0 || blob.size > MAX_BYTES) {
        throw new Error("Image processing failed");
      }
      if (version !== selectionVersion.current) {
        URL.revokeObjectURL(localUrl);
        return;
      }
      const prepared = new File([blob], `profile.${extensions[blob.type]}`, {
        type: blob.type,
      });
      const preparedUrl = URL.createObjectURL(prepared);
      URL.revokeObjectURL(localUrl);
      setSelectedFile(prepared);
      setPreviewUrl(preparedUrl);
    } catch {
      URL.revokeObjectURL(localUrl);
      if (version === selectionVersion.current) {
        setErrorMessage("Fail gambar tidak boleh dibaca. Pilih gambar lain.");
        if (inputRef.current) inputRef.current.value = "";
      }
    } finally {
      if (version === selectionVersion.current) setChecking(false);
    }
  }

  async function removeOldFile(path: string) {
    try {
      const { error } = await supabase.storage.from(BUCKET).remove([path]);
      if (error) {
        console.warn("Gambar profil dikemas kini, tetapi fail lama belum dipadam.");
      }
    } catch {
      console.warn("Pembersihan fail gambar lama tertangguh.");
    }
  }

  async function saveImage() {
    if (!selectedFile || disabled || sending.current) return;
    sending.current = true;
    setSaving(true);
    setMessage("");
    setErrorMessage("");
    let uploadFinished = false;

    try {
      const extension = extensions[selectedFile.type];
      if (!extension || selectedFile.size === 0 || selectedFile.size > MAX_BYTES) {
        setErrorMessage("Pilih gambar JPG, PNG atau WebP yang tidak melebihi 2MB.");
        return;
      }
      const nextPath = `${sellerId}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(
        nextPath,
        selectedFile,
        { contentType: selectedFile.type, cacheControl: "3600", upsert: false }
      );
      if (uploadError) {
        setErrorMessage("Gagal memuat naik gambar. Sila cuba lagi.");
        return;
      }
      uploadFinished = true;

      const { data, error: saveError } = await supabase.rpc(
        "set_seller_profile_image",
        { p_avatar_path: nextPath }
      );
      if (saveError || data !== nextPath) {
        // Jangan padam fail baharu jika keputusan simpan belum pasti.
        setNeedsRefresh(true);
        setErrorMessage("Status simpan gambar belum dapat disahkan. Muat semula halaman untuk menyemaknya.");
        return;
      }

      const previousPath = avatarPath;
      setAvatarPath(nextPath);
      resetSelection();
      setMessage("Foto atau logo profil berjaya disimpan.");
      router.refresh();
      if (previousPath && previousPath !== nextPath) {
        await removeOldFile(previousPath);
      }
    } catch {
      if (uploadFinished) setNeedsRefresh(true);
      setErrorMessage("Sambungan terganggu. Muat semula halaman untuk menyemak gambar profil.");
    } finally {
      sending.current = false;
      setSaving(false);
    }
  }

  async function removeImage() {
    if (!avatarPath || disabled || sending.current) return;
    sending.current = true;
    setSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      const previousPath = avatarPath;
      const { error } = await supabase.rpc(
        "set_seller_profile_image",
        { p_avatar_path: null }
      );
      if (error) {
        setNeedsRefresh(true);
        setErrorMessage("Status gambar belum dapat disahkan. Muat semula halaman untuk menyemaknya.");
        return;
      }
      setAvatarPath(null);
      resetSelection();
      setMessage("Gambar telah dikeluarkan daripada profil penjual.");
      router.refresh();
      await removeOldFile(previousPath);
    } catch {
      setNeedsRefresh(true);
      setErrorMessage("Sambungan terganggu. Muat semula halaman untuk menyemak gambar profil.");
    } finally {
      sending.current = false;
      setSaving(false);
    }
  }

  return (
    <div className="mt-7 border-t border-slate-100 pt-6">
      <div className="flex flex-wrap items-center gap-5">
        <SellerAvatar src={previewUrl ?? avatarUrl} name={shopName} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-slate-900">Foto atau logo penjual</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Pilihan. Gambar ini akan dipaparkan secara umum bersama
            nama kedai pada halaman produk anda.
          </p>
          <p className="mt-2 text-xs text-slate-500">JPG, PNG atau WebP. Maksimum 2MB.</p>
        </div>
      </div>

      <label htmlFor="seller-photo" className="mt-6 block text-sm font-semibold text-slate-800">
        Pilih gambar
      </label>
      <input
        ref={inputRef}
        id="seller-photo"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={disabled}
        onChange={chooseFile}
        aria-describedby="seller-photo-help"
        className="mt-2 block w-full min-w-0 rounded-xl border border-slate-200 p-3 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-orange-50 file:px-3 file:py-2 file:font-semibold file:text-orange-700 disabled:opacity-50"
      />
      <p id="seller-photo-help" className="mt-2 text-xs text-slate-500">
        {checking ? "Sedang menyemak gambar..." : selectedFile
          ? "Pratonton sahaja. Tekan Simpan Gambar untuk menerbitkannya."
          : "Jika tiada gambar, avatar lalai akan digunakan."}
      </p>

      {message && <p role="status" className="mt-5 rounded-xl bg-green-50 p-4 text-sm text-green-800">{message}</p>}
      {errorMessage && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{errorMessage}</p>}

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={saveImage} disabled={!selectedFile || disabled}
          className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50">
          {saving ? "Sedang memproses..." : "Simpan Gambar"}
        </button>
        {selectedFile && <button type="button" onClick={resetSelection} disabled={disabled}
          className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 disabled:opacity-50">
          Batalkan Pilihan
        </button>}
        {avatarPath && <button type="button" onClick={removeImage} disabled={disabled}
          className="rounded-xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">
          Buang Gambar
        </button>}
        {needsRefresh && <button type="button" onClick={() => window.location.reload()}
          className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">
          Muat Semula Halaman
        </button>}
      </div>
    </div>
  );
}

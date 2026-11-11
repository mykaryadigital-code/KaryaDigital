"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const categories = [
  "Bisnes & Keusahawanan",
  "Kewangan",
  "Pendidikan",
  "Motivasi & Pembangunan Diri",
  "Agama & Kerohanian",
  "Kesihatan & Gaya Hidup",
  "Keluarga & Perhubungan",
  "Novel & Fiksyen",
  "Teknologi",
  "Lain-lain",
];

export default function TambahEbookPage() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [fileResetKey, setFileResetKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");
    setMessage("");

    let uploadedCoverPath: string | null = null;
    let uploadedPdfPath: string | null = null;

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Sesi login tamat. Sila login semula.");
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError || profile?.role !== "seller") {
        throw new Error(
          "Hanya penjual yang diluluskan boleh tambah eBook."
        );
      }

      const cleanTitle = title.trim();
      const cleanCategory = category.trim();
      const numericPrice = Number(price);

      if (!cleanTitle || cleanTitle.length > 200) {
        throw new Error(
          "Tajuk eBook mesti antara 1 hingga 200 aksara."
        );
      }

      if (!categories.includes(cleanCategory)) {
        throw new Error("Sila pilih kategori.");
      }

      if (
        price.trim() === "" ||
        !Number.isFinite(numericPrice) ||
        numericPrice < 0 ||
        !/^\d+(\.\d{1,2})?$/.test(price)
      ) {
        throw new Error("Harga tidak sah. Contoh: 29.90");
      }

      if (!coverFile || !pdfFile) {
        throw new Error("Sila pilih gambar kulit dan fail PDF.");
      }

      const allowedCoverTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
      ];

      if (!allowedCoverTypes.includes(coverFile.type)) {
        throw new Error("Gambar kulit mesti JPG, PNG atau WebP.");
      }

      if (coverFile.size > 5 * 1024 * 1024) {
        throw new Error("Gambar kulit tidak boleh melebihi 5 MB.");
      }

      if (
        pdfFile.type !== "application/pdf" ||
        !pdfFile.name.toLowerCase().endsWith(".pdf")
      ) {
        throw new Error("Fail eBook mesti dalam format PDF.");
      }

      if (pdfFile.size > 20 * 1024 * 1024) {
        throw new Error("Fail PDF tidak boleh melebihi 20 MB.");
      }

      const coverExtension =
        coverFile.type === "image/jpeg"
          ? "jpg"
          : coverFile.type === "image/png"
          ? "png"
          : "webp";

      const uniqueId = crypto.randomUUID();
      const coverPath = `${user.id}/${uniqueId}.${coverExtension}`;
      const pdfPath = `${user.id}/${uniqueId}.pdf`;

      const { error: coverError } = await supabase.storage
        .from("ebook-covers")
        .upload(coverPath, coverFile, {
          contentType: coverFile.type,
          upsert: false,
        });

      if (coverError) {
        throw new Error(
          "Gagal muat naik gambar kulit: " + coverError.message
        );
      }

      uploadedCoverPath = coverPath;

      const { error: pdfError } = await supabase.storage
        .from("ebook-pdfs")
        .upload(pdfPath, pdfFile, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (pdfError) {
        throw new Error("Gagal muat naik PDF: " + pdfError.message);
      }

      uploadedPdfPath = pdfPath;

      const { error: insertError } = await supabase
        .from("ebooks")
        .insert({
          seller_id: user.id,
          title: cleanTitle,
          description: description.trim(),
          category: cleanCategory,
          price: numericPrice,
          cover_path: coverPath,
          pdf_path: pdfPath,
          access_type: "downloadable",
          status: "draft",
        });

      if (insertError) {
        throw new Error(
          "Gagal simpan eBook: " + insertError.message
        );
      }

      setMessage("eBook berjaya disimpan sebagai draf!");
      setTitle("");
      setCategory("");
      setPrice("");
      setDescription("");
      setCoverFile(null);
      setPdfFile(null);
      setFileResetKey((previous) => previous + 1);

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ralat tidak diketahui."
      );

      if (uploadedCoverPath || uploadedPdfPath) {
        console.warn("Semak fail muat naik selepas kegagalan:", {
          uploadedCoverPath,
          uploadedPdfPath,
        });
      }
    } finally {
      setLoading(false);
    }
  }

  const inputStyle =
    "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100";

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/penjual/dashboard"
          className="mb-6 inline-block text-sm font-medium text-indigo-600 hover:underline"
        >
          Kembali ke Dashboard
        </Link>

        <h1 className="text-3xl font-bold text-gray-900">
          Tambah eBook
        </h1>

        <p className="mt-2 text-gray-600">
          Simpan eBook sebagai draf sebelum menghantarnya untuk
          semakan Admin.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <fieldset disabled={loading} className="space-y-6">
            <div>
              <label
                htmlFor="ebook-title"
                className="mb-2 block text-sm font-semibold text-gray-800"
              >
                Tajuk eBook
              </label>
              <input
                id="ebook-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                required
                className={inputStyle}
                placeholder="Masukkan tajuk eBook"
              />
            </div>

            <div>
              <label
                htmlFor="ebook-category"
                className="mb-2 block text-sm font-semibold text-gray-800"
              >
                Kategori
              </label>
              <select
                id="ebook-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className={inputStyle}
              >
                <option value="">Pilih kategori</option>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="ebook-price"
                className="mb-2 block text-sm font-semibold text-gray-800"
              >
                Harga (RM)
              </label>
              <input
                id="ebook-price"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className={inputStyle}
                placeholder="Contoh: 29.90"
              />
            </div>

            <div>
              <label
                htmlFor="ebook-description"
                className="mb-2 block text-sm font-semibold text-gray-800"
              >
                Penerangan eBook
              </label>
              <textarea
                id="ebook-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className={inputStyle}
                placeholder="Terangkan kandungan dan manfaat eBook"
              />
            </div>

            <div className="rounded-xl bg-indigo-50 p-4 text-sm text-indigo-900">
              Pembeli boleh membaca eBook secara online dan
              memuat turun PDF selepas pembayaran disahkan.
            </div>

            <div>
              <label
                htmlFor="ebook-cover"
                className="mb-2 block text-sm font-semibold text-gray-800"
              >
                Gambar Kulit
              </label>
              <input
                key={`cover-${fileResetKey}`}
                id="ebook-cover"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) =>
                  setCoverFile(e.target.files?.[0] ?? null)
                }
                required
                className={inputStyle}
              />
              <p className="mt-2 text-xs text-gray-500">
                Format JPG, PNG atau WebP. Maksimum 5 MB.
              </p>
            </div>

            <div>
              <label
                htmlFor="ebook-pdf"
                className="mb-2 block text-sm font-semibold text-gray-800"
              >
                Fail PDF eBook
              </label>
              <input
                key={`pdf-${fileResetKey}`}
                id="ebook-pdf"
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) =>
                  setPdfFile(e.target.files?.[0] ?? null)
                }
                required
                className={inputStyle}
              />
              <p className="mt-2 text-xs text-gray-500">
                Format PDF. Maksimum 20 MB.
              </p>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            {message && (
              <div
                role="status"
                className="rounded-xl bg-green-50 p-4 text-sm text-green-800"
              >
                <p>{message}</p>
                <Link
                  href="/penjual/dashboard"
                  className="mt-2 inline-block font-semibold underline"
                >
                  Lihat eBook di Dashboard
                </Link>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Sedang Menyimpan..." : "Simpan Sebagai Draf"}
            </button>
          </fieldset>
        </form>
      </div>
    </main>
  );
}
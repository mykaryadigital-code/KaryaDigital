
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

  const [coverFile, setCoverFile] = useState<File | null>(
    null
  );
  const [pdfFile, setPdfFile] = useState<File | null>(
    null
  );

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
        throw new Error(
          "Sesi login tamat. Sila login semula."
        );
      }

      const { data: profile, error: profileError } =
        await supabase
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

      if (!cleanCategory || cleanCategory.length > 100) {
        throw new Error("Sila pilih kategori.");
      }

      if (
        price.trim() === "" ||
        !Number.isFinite(numericPrice) ||
        numericPrice < 0 ||
        !/^\d+(\.\d{1,2})?$/.test(price)
      ) {
        throw new Error(
          "Harga tidak sah. Contoh: 29.90"
        );
      }

      if (!coverFile || !pdfFile) {
        throw new Error(
          "Sila pilih gambar kulit dan fail PDF."
        );
      }

      const allowedCoverTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
      ];

      if (!allowedCoverTypes.includes(coverFile.type)) {
        throw new Error(
          "Gambar kulit mesti JPG, PNG atau WebP."
        );
      }

      if (coverFile.size > 5 * 1024 * 1024) {
        throw new Error(
          "Gambar kulit tidak boleh melebihi 5 MB."
        );
      }

      if (
        pdfFile.type !== "application/pdf" ||
        !pdfFile.name.toLowerCase().endsWith(".pdf")
      ) {
        throw new Error(
          "Fail eBook mesti dalam format PDF."
        );
      }

      if (pdfFile.size > 20 * 1024 * 1024) {
        throw new Error(
          "Fail PDF tidak boleh melebihi 20 MB."
        );
      }

      const coverExtension =
        coverFile.type === "image/jpeg"
          ? "jpg"
          : coverFile.type === "image/png"
          ? "png"
          : "webp";

      const uniqueId = crypto.randomUUID();

      const coverPath =
        `${user.id}/${uniqueId}.${coverExtension}`;

      const pdfPath =
        `${user.id}/${uniqueId}.pdf`;

      // Muat naik gambar kulit
      const { error: coverError } =
        await supabase.storage
          .from("ebook-covers")
          .upload(coverPath, coverFile, {
            contentType: coverFile.type,
            upsert: false,
          });

      if (coverError) {
        throw new Error(
          "Gagal muat naik gambar kulit: " +
            coverError.message
        );
      }

      uploadedCoverPath = coverPath;

      // Muat naik fail PDF peribadi
      const { error: pdfError } =
        await supabase.storage
          .from("ebook-pdfs")
          .upload(pdfPath, pdfFile, {
            contentType: "application/pdf",
            upsert: false,
          });

      if (pdfError) {
        throw new Error(
          "Gagal muat naik PDF: " +
            pdfError.message
        );
      }

      uploadedPdfPath = pdfPath;

      // Simpan maklumat eBook ke database
      const { error: insertError } =
        await supabase.from("ebooks").insert({
          seller_id: user.id,
          title: cleanTitle,
          description: description.trim(),
          category: cleanCategory,
          price: numericPrice,
          cover_path: coverPath,
          pdf_path: pdfPath,
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

      router.refresh();
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Ralat tidak diketahui.";

      setError(errorMessage);

      // Nota:
      // Fail yang sudah dimuat naik mungkin kekal
      // jika langkah berikutnya gagal.
      // Polisi DELETE belum disediakan,
      // jadi pembersihan akan dibuat melalui
      // proses server yang selamat kemudian.
      if (uploadedCoverPath || uploadedPdfPath) {
        console.warn("Fail belum dipautkan:", {
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
          ← Kembali ke Dashboard Penjual
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Tambah eBook Baharu
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Lengkapkan maklumat eBook anda dan
              simpan sebagai draf.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {message && (
            <div
              role="status"
              className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
            >
              {message}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Tajuk eBook *
              </label>

              <input
                id="title"
                type="text"
                required
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Panduan Bisnes Online"
                className={inputStyle}
              />
            </div>

            <div>
              <label
                htmlFor="category"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Kategori *
              </label>

              <select
                id="category"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputStyle}
              >
                <option value="">
                  -- Pilih kategori --
                </option>

                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="price"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Harga (RM) *
              </label>

              <input
                id="price"
                type="number"
                min="0"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="29.90"
                className={inputStyle}
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Penerangan eBook
              </label>

              <textarea
                id="description"
                rows={5}
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                placeholder="Terangkan kandungan dan manfaat eBook..."
                className={inputStyle}
              />
            </div>

            <div>
              <label
                htmlFor="cover"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Gambar Kulit eBook *
              </label>

              <input
                key={message ? "cover-reset" : "cover"}
                id="cover"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required
                onChange={(e) =>
                  setCoverFile(
                    e.target.files?.[0] ?? null
                  )
                }
                className={inputStyle}
              />

              <p className="mt-2 text-xs text-gray-500">
                JPG, PNG atau WebP. Maksimum 5 MB.
              </p>
            </div>

            <div>
              <label
                htmlFor="pdf"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Fail eBook (PDF) *
              </label>

              <input
                key={message ? "pdf-reset" : "pdf"}
                id="pdf"
                type="file"
                accept="application/pdf,.pdf"
                required
                onChange={(e) =>
                  setPdfFile(
                    e.target.files?.[0] ?? null
                  )
                }
                className={inputStyle}
              />

              <p className="mt-2 text-xs text-gray-500">
                PDF sahaja. Maksimum 20 MB.
              </p>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Sedang menyimpan..."
                  : "Simpan sebagai Draf"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

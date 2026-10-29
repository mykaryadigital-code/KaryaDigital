
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ReadPdfButton from "./ReadPdfButton";
import ReviewEbookButtons from "./ReviewEbookButtons";

export default async function AdminEbooksPage() {
  const supabase = await createClient();

  // Semak pengguna yang sedang login
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Pastikan pengguna ialah Super Admin
  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

  if (profileError || profile?.role !== "admin") {
    redirect("/akaun");
  }

  // Ambil eBook yang menunggu semakan
  const { data: ebooks, error: ebooksError } =
    await supabase
      .from("ebooks")
      .select(
        "id, title, category, price, cover_path, pdf_path,seller_id, created_at"
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false });

  if (ebooksError) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">
          Ralat Memuatkan eBook
        </h1>
        <p className="mt-3 text-red-600">
          {ebooksError.message}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/admin"
          className="text-sm font-semibold text-indigo-600 hover:underline"
        >
          ← Kembali ke Dashboard Admin
        </Link>

        <div className="mb-8 mt-6">
          <h1 className="text-3xl font-extrabold">
            Semakan eBook
          </h1>
          <p className="mt-2 text-slate-500">
            Senarai eBook yang menunggu kelulusan
            Super Admin KaryaDigital.
          </p>
        </div>

        <div className="mb-6 rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Menunggu Semakan
          </p>
          <p className="mt-2 text-3xl font-extrabold text-indigo-600">
            {ebooks?.length ?? 0}
          </p>
        </div>

        {!ebooks?.length ? (
          <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-bold">
              Tiada eBook menunggu semakan
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              eBook baharu yang dihantar oleh penjual
              akan muncul di sini.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {ebooks.map((ebook) => {
              const coverUrl = ebook.cover_path
                ? supabase.storage
                    .from("ebook-covers")
                    .getPublicUrl(ebook.cover_path)
                    .data.publicUrl
                : null;

              return (
                <div
                  key={ebook.id}
                  className="rounded-2xl border bg-white p-5 shadow-sm"
                >
                  <div className="flex gap-4">
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={`Kulit ${ebook.title}`}
                        className="h-32 w-24 rounded-lg border object-cover"
                      />
                    ) : (
                      <div className="flex h-32 w-24 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-500">
                        Tiada kulit
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-bold">
                        {ebook.title}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        {ebook.category}
                      </p>

                      <p className="mt-2 font-bold text-indigo-600">
                        {new Intl.NumberFormat("ms-MY", {
                          style: "currency",
                          currency: "MYR",
                        }).format(Number(ebook.price))}
                      </p>

                      <span className="mt-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                        Menunggu Semakan
                      </span>
                    </div>
                    <div className="mt-4">
                        <ReadPdfButton ebookId={ebook.id} />
                    </div>
                        
                        <ReviewEbookButtons ebookId={ebook.id} />

                  </div>

                  <div className="mt-4 border-t pt-4 text-xs text-slate-500">
                    <p>
                      ID Penjual: {ebook.seller_id}
                    </p>
                    <p className="mt-1">
                      Dihantar ke senarai semakan:{" "}
                      {new Date(
                        ebook.created_at
                      ).toLocaleDateString("ms-MY")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

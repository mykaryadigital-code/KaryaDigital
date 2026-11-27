"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Download,
  Menu,
  ShieldCheck,
  Store,
  X,
} from "lucide-react";
import Header from "@/components/Header";
import BookCard from "@/components/BookCard";
import { rm } from "@/data/books";

type Ebook = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  price: number;
  cover_path: string | null;
};

export default function Home() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Semua");
  const [cart, setCart] = useState<(number | string)[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [menu, setMenu] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [checkoutOrderId, setCheckoutOrderId] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [approvedEbooks, setApprovedEbooks] = useState<Ebook[]>([]);

  const categories = useMemo(
    () => [
      "Semua",
      ...Array.from(
        new Set(approvedEbooks.map((ebook) => ebook.category))
      ).filter((name) => name && name !== "Semua"),
    ],
    [approvedEbooks]
  );

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function loadApprovedEbooks() {
      const { data, error } = await supabase
        .from("ebooks")
        .select("id, title, description, category, price, cover_path")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (!active) return;

      if (error) {
        console.error("Gagal mengambil eBook:", error.message);
        return;
      }

      setApprovedEbooks(data ?? []);
    }

    void loadApprovedEbooks();

    return () => {
      active = false;
    };
  }, []);

  const marketplaceBooks = useMemo(
    () =>
      approvedEbooks.map((ebook) => ({
        id: ebook.id,
        title: ebook.title,
        author: "",
        category: ebook.category,
        price: Number(ebook.price),
        rating: 0,
        color: "#163d54",
        accent: "#ffffff",
        coverUrl: ebook.cover_path
          ? createClient()
              .storage.from("ebook-covers")
              .getPublicUrl(ebook.cover_path).data.publicUrl
          : undefined,
      })),
    [approvedEbooks]
  );

  const featuredBook = marketplaceBooks.find(
    (book) => Number.isFinite(book.price) && book.price >= 5
  );

  const filtered = useMemo(
    () =>
      marketplaceBooks.filter(
        (book) =>
          (category === "Semua" || book.category === category) &&
          `${book.title} ${book.category}`
            .toLowerCase()
            .includes(search.toLowerCase())
      ),
    [marketplaceBooks, search, category]
  );

  const cartBooks = marketplaceBooks.filter((book) =>
    cart.includes(book.id)
  );

  const cartTotal = cartBooks.reduce(
    (total, book) => total + book.price,
    0
  );

  function toggleCart(id: number | string) {
    if (checkoutLoading || checkoutOrderId) return;

    setCheckoutMessage("");
    setNeedsLogin(false);
    setCart((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function scrollToCatalog() {
    document
      .getElementById("katalog")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleCheckout() {
    if (checkoutLoading || cart.length === 0 || checkoutOrderId) {
      return;
    }

    setCheckoutLoading(true);
    setCheckoutMessage("");
    setNeedsLogin(false);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ebookIds: cart }),
      });

      const result: {
        error?: string;
        orderId?: string;
        message?: string;
      } = await response.json();

      if (!response.ok) {
        setNeedsLogin(response.status === 401);
        setCheckoutMessage(
          response.status === 401
            ? "Sila log masuk dahulu sebelum membuat pesanan."
            : result.error || "Pesanan gagal dibuat. Sila cuba lagi."
        );
        return;
      }

      if (!result.orderId) {
        setCheckoutMessage(
          "ID pesanan tidak diterima. Semak Pesanan Saya sebelum mencuba lagi."
        );
        return;
      }

      setCheckoutOrderId(result.orderId);
      setCheckoutMessage(
        "Pesanan berjaya dibuat. Membuka halaman pembayaran..."
      );
      setCart([]);
      window.location.assign("/pesanan");
    } catch (error) {
      console.error("Ralat checkout:", error);
      setCheckoutMessage(
        "Sambungan terganggu. Semak Pesanan Saya sebelum mencuba lagi."
      );
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f8fb]">
      <Header
        search={search}
        setSearch={setSearch}
        cartCount={cart.length}
        onCart={() => setShowCart(true)}
      />

      <nav className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3 text-xs font-semibold text-slate-600 lg:px-8">
          <button
            type="button"
            className="flex items-center gap-1 md:hidden"
            onClick={() => setMenu(!menu)}
          >
            <Menu size={16} />
            Menu
          </button>

          <span className="hidden md:inline">Kategori eBook</span>

          <div
            className={`${menu ? "flex" : "hidden"} flex-wrap gap-4 md:flex`}
          >
            {categories.slice(1, 7).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setCategory(item);
                  scrollToCatalog();
                  setMenu(false);
                }}
                className="hover:text-orange-600"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main>
        <section
          aria-labelledby="marketplace-title"
          className="mx-auto max-w-7xl px-4 pb-5 pt-5 lg:px-8"
        >
          <div className="grid items-center gap-6 overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-orange-500 to-amber-400 px-6 py-6 text-white sm:px-8 sm:py-7 lg:grid-cols-[1.1fr_1fr] lg:gap-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-orange-50">
                Marketplace eBook Malaysia
              </p>
              <h1
                id="marketplace-title"
                className="mt-3 max-w-lg text-3xl font-extrabold leading-tight sm:text-4xl"
              >
                Temui Bacaan
                <br />
                Seterusnya.
              </h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-orange-50">
                Beli eBook digital. Baca online atau muat turun PDF
                selepas pembayaran disahkan.
              </p>
              <button
                type="button"
                onClick={scrollToCatalog}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-orange-700 shadow-sm hover:bg-orange-50"
              >
                Terokai eBook
                <ArrowRight size={17} aria-hidden="true" />
              </button>
            </div>

            {featuredBook ? (
              <div className="flex min-w-0 items-center gap-4 rounded-2xl border border-orange-100 bg-[#fffdf8] p-4 text-slate-900 shadow-sm sm:gap-5 sm:p-5">
                <Link
                  href={`/ebook/${encodeURIComponent(String(featuredBook.id))}`}
                  aria-label={`Lihat butiran ${featuredBook.title}`}
                  className="flex h-32 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-orange-50 p-2 sm:h-44 sm:w-32"
                >
                  {featuredBook.coverUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={featuredBook.coverUrl}
                      alt={`Kulit ${featuredBook.title}`}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <BookOpen size={48} aria-hidden="true" />
                  )}
                </Link>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-orange-700">
                    {featuredBook.category}
                  </p>
                  <h2 className="mt-2 break-words text-lg font-bold leading-snug sm:text-xl">
                    <Link
                      href={`/ebook/${encodeURIComponent(String(featuredBook.id))}`}
                      className="hover:underline"
                    >
                      {featuredBook.title}
                    </Link>
                  </h2>
                  <p className="mt-3 text-xl font-extrabold text-orange-600 sm:text-2xl">
                    {rm(featuredBook.price)}
                  </p>
                  <Link
                    href={`/ebook/${encodeURIComponent(String(featuredBook.id))}`}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-orange-600 sm:text-sm"
                  >
                    Lihat eBook
                    <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="hidden items-center justify-center rounded-2xl bg-white/10 p-8 lg:flex">
                <BookOpen size={120} strokeWidth={1} aria-hidden="true" />
              </div>
            )}
          </div>
        </section>

        <section
          aria-label="Cara pembelian eBook"
          className="mx-auto grid max-w-7xl grid-cols-3 gap-2 px-4 pb-6 sm:gap-3 lg:px-8"
        >
          {[
            {
              icon: Download,
              title: "100% Digital",
              sub: "Tanpa penghantaran fizikal",
            },
            {
              icon: ShieldCheck,
              title: "Akses Selepas Bayaran",
              sub: "Selepas pembayaran disahkan",
            },
            {
              icon: BookOpen,
              title: "Baca & Muat Turun",
              sub: "Baca online atau simpan PDF",
            },
          ].map(({ icon: Icon, title, sub }) => (
            <div
              key={title}
              className="flex min-w-0 flex-col items-start gap-2 rounded-2xl bg-white p-3 sm:flex-row sm:items-center sm:gap-3 sm:p-4"
            >
              <span className="shrink-0 rounded-xl bg-orange-50 p-2 text-orange-600 sm:p-3">
                <Icon size={20} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h3 className="text-[11px] font-bold leading-snug text-slate-900 sm:text-sm">
                  {title}
                </h3>
                <p className="mt-1 hidden text-xs text-slate-500 sm:block">
                  {sub}
                </p>
              </div>
            </div>
          ))}
        </section>

        <section
          id="katalog"
          className="mx-auto max-w-7xl scroll-mt-40 px-4 pb-16 lg:px-8"
        >
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-orange-600">
                Koleksi Pilihan
              </p>
              <h2 className="mt-1 text-2xl font-extrabold sm:text-3xl">
                Cari Bacaan Kegemaran
              </h2>
            </div>
            <span className="text-sm text-slate-500">
              {filtered.length} eBook ditemui
            </span>
          </div>

          <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
                  category === item
                    ? "bg-orange-500 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-orange-300"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {filtered.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
              {filtered.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onAdd={toggleCart}
                  inCart={cart.includes(book.id)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-12 text-center text-slate-500">
              Tiada eBook ditemui. Cuba kata kunci atau kategori lain.
            </div>
          )}
        </section>

        <section
          id="jadi-penjual"
          className="scroll-mt-40 bg-slate-900 px-4 py-14 text-white"
        >
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-300">
                Bersama KaryaDigital
              </p>
              <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">
                Ada eBook untuk dijual?
              </h2>
              <p className="mt-2 max-w-xl text-sm text-slate-300">
                Jual eBook anda melalui KaryaDigital. Daftar akaun dan
                hantar permohonan penjual untuk semakan Admin.
              </p>
            </div>

            <Link
              href="/jadi-penjual"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              <CheckCircle2 size={17} />
              Mohon Jadi Penjual
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-8">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-lg font-extrabold text-indigo-600">
            KaryaDigital
          </p>

          <p className="mt-2 text-sm text-slate-600">
            Marketplace eBook karya penulis Malaysia.
          </p>

          <nav
            aria-label="Pautan footer"
            className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm"
          >
            <Link
              href="/akaun"
              className="font-medium text-slate-600 hover:text-indigo-600"
            >
              Akaun Saya
            </Link>

            <Link
              href="/pesanan"
              className="font-medium text-slate-600 hover:text-indigo-600"
            >
              Pesanan Saya
            </Link>
            <Link
              href="/bantuan"
              className="font-medium text-slate-600 hover:text-indigo-600"
            >
              Bantuan Pembeli
            </Link>
            <Link
              href="/polisi-refund"
              className="font-medium text-slate-600 hover:text-indigo-600"
            >
              Polisi Bayaran Balik
            </Link>
            <Link
              href="/maklumat-penjual"
              className="font-medium text-slate-600 hover:text-indigo-600"
            >
              Maklumat Penjual
            </Link>
            <Link
              href="/jadi-penjual"
              className="font-medium text-slate-600 hover:text-indigo-600"
            >
              Jadi Penjual
            </Link>
          </nav>

          <p className="mt-6 text-xs text-slate-500">
            {"\u00A9"} {new Date().getFullYear()} KaryaDigital.
          </p>
        </div>
      </footer>

      {showCart && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/50"
          onClick={() => setShowCart(false)}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Troli saya"
            className="flex h-full w-full max-w-md flex-col bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                Troli Saya ({cart.length})
              </h2>
              <button
                type="button"
                aria-label="Tutup troli"
                onClick={() => setShowCart(false)}
              >
                <X />
              </button>
            </div>

            <div className="mt-6 flex-1 space-y-4 overflow-y-auto">
              {cartBooks.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Troli anda masih kosong.
                </p>
              ) : (
                cartBooks.map((book) => (
                  <div
                    key={book.id}
                    className="flex items-center justify-between gap-3 border-b pb-3"
                  >
                    <div>
                      <p className="text-sm font-bold">{book.title}</p>
                      <p className="text-sm font-semibold text-orange-600">
                        {rm(book.price)}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={checkoutLoading}
                      onClick={() => toggleCart(book.id)}
                      className="text-xs text-red-600 disabled:opacity-50"
                    >
                      Buang
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between font-bold">
                <span>Jumlah</span>
                <span>{rm(cartTotal)}</span>
              </div>

              <p className="mt-3 text-xs text-slate-500">
                Teruskan pembayaran di halaman Pesanan Saya.
                Selepas bayaran disahkan, eBook boleh dibaca online
                dan dimuat turun.
              </p>

              <Link
                href="/maklumat-pembeli"
                className="mt-3 inline-block text-sm font-semibold text-orange-600 underline"
              >
                Lengkapkan maklumat pembeli
              </Link>

              {checkoutMessage && (
                <div
                  role="status"
                  className="mt-3 rounded-xl bg-slate-100 p-3 text-sm text-slate-700"
                >
                  <p>{checkoutMessage}</p>

                  {checkoutOrderId && (
                    <p className="mt-2 break-all text-xs">
                      ID Pesanan: {checkoutOrderId}
                    </p>
                  )}

                  {needsLogin && (
                    <Link
                      href="/login"
                      className="mt-3 inline-block font-bold text-orange-600 underline"
                    >
                      Log Masuk
                    </Link>
                  )}

                  <Link
                    href="/pesanan"
                    className="mt-3 block font-bold text-orange-600 underline"
                  >
                    Lihat Pesanan Saya
                  </Link>
                </div>
              )}

              <button
                type="button"
                onClick={handleCheckout}
                disabled={
                  checkoutLoading ||
                  cart.length === 0 ||
                  checkoutOrderId !== null
                }
                className="mt-4 w-full rounded-xl bg-orange-500 p-3 text-sm font-bold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                {checkoutLoading
                  ? "Memproses pesanan..."
                  : checkoutOrderId
                  ? "Pesanan Telah Dibuat"
                  : "Teruskan ke Pembayaran"}
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-20 flex justify-around border-t bg-white p-3 text-[10px] text-slate-600 sm:hidden">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex flex-col items-center gap-1"
        >
          <BookOpen size={19} />
          Utama
        </button>
        <button
          type="button"
          onClick={scrollToCatalog}
          className="flex flex-col items-center gap-1"
        >
          <ChevronRight size={19} />
          Katalog
        </button>
        <button
          type="button"
          onClick={() => setShowCart(true)}
          className="flex flex-col items-center gap-1"
        >
          <Store size={19} />
          Troli ({cart.length})
        </button>
      </div>

      <div className="h-14 sm:hidden" />
    </div>
  );
}

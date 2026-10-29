
"use client";

import {
  BookOpen,
  ShoppingCart,
  Store,
  Search,
  ClipboardList,
} from "lucide-react";

import Link from "next/link";

type HeaderProps = {
  search: string;
  setSearch: (s: string) => void;
  cartCount: number;
  onCart: () => void;
};

export default function Header({
  search,
  setSearch,
  cartCount,
  onCart,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:gap-6 lg:px-8">

        {/* Logo KaryaDigital */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-xl font-extrabold tracking-tight text-slate-900"
        >
          <span className="rounded-xl bg-orange-500 p-2 text-white">
            <BookOpen size={22} />
          </span>

          Karya<span className="-ml-2 text-orange-500">Digital</span>
        </Link>

        {/* Carian eBook */}
        <div className="order-3 flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 sm:order-none sm:flex-1">
          <Search size={18} className="text-slate-400" />

          <input
            aria-label="Cari eBook"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari eBook, penulis atau kategori..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>

        {/* Jadi Penjual */}
        <button
          onClick={() =>
            document
              .getElementById("jadi-penjual")
              ?.scrollIntoView({ behavior: "smooth" })
          }
          className="ml-auto hidden items-center gap-2 text-sm font-semibold text-slate-700 hover:text-orange-600 md:flex"
        >
          <Store size={19} />
          Jadi Penjual
        </button>

        {/* Pesanan Saya */}
        <Link
          href="/pesanan"
          className="flex items-center gap-1.5 rounded-xl px-2 py-2 text-sm font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-600"
          title="Lihat Pesanan Saya"
        >
          <ClipboardList size={21} />
          <span className="hidden lg:inline">
            Pesanan Saya
          </span>
        </Link>

        {/* Troli */}
        <button
          onClick={onCart}
          aria-label={`Buka troli, ${cartCount} item`}
          className="relative rounded-xl p-2 text-slate-700 hover:bg-slate-100"
        >
          <ShoppingCart size={23} />

          {cartCount > 0 && (
            <span className="absolute -right-1 -top-1 rounded-full bg-orange-500 px-1.5 text-[10px] font-bold text-white">
              {cartCount}
            </span>
          )}
        </button>

      </div>
    </header>
  );
}

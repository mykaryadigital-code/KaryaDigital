"use client";

import Link from "next/link";
import {
  BookOpen,
  ClipboardList,
  Search,
  ShoppingCart,
   UserRound,
} from "lucide-react";

type HeaderProps = {
  search: string;
  setSearch: (value: string) => void;
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
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-3 sm:gap-4 lg:px-8">
        <Link
          href="/"
          aria-label="KaryaDigital, halaman utama"
          className="flex shrink-0 items-center gap-2 text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl"
        >
          <span className="rounded-xl bg-orange-500 p-2 text-white">
            <BookOpen size={20} aria-hidden="true" />
          </span>
          <span>
            Karya<span className="text-orange-500">Digital</span>
          </span>
        </Link>

        <div className="order-3 flex w-full min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 lg:order-none lg:w-auto lg:flex-1">
          <Search
            size={18}
            aria-hidden="true"
            className="shrink-0 text-slate-400"
          />
          <input
            type="search"
            aria-label="Cari tajuk eBook atau kategori"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari tajuk eBook atau kategori..."
            className="min-w-0 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>

        <nav
          aria-label="Pautan akaun dan pembelian"
          className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2"
        >

          <Link
            href="/akaun"
            aria-label="Akaun Saya"
            title="Akaun Saya"
            className="inline-flex items-center gap-1.5 rounded-xl p-2 text-sm font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-600"
          >
            <UserRound size={21} aria-hidden="true" />
            <span className="hidden sm:inline">Akaun Saya</span>
          </Link>

          <Link
            href="/pesanan"
            aria-label="Pesanan Saya"
            title="Pesanan Saya"
            className="inline-flex items-center gap-1.5 rounded-xl p-2 text-sm font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-600"
          >
            <ClipboardList size={21} aria-hidden="true" />
            <span className="hidden sm:inline">Pesanan Saya</span>
          </Link>

          <button
            type="button"
            onClick={onCart}
            aria-label={`Buka troli, ${cartCount} item`}
            className="relative rounded-xl p-2 text-slate-700 hover:bg-orange-50 hover:text-orange-600"
          >
            <ShoppingCart size={23} aria-hidden="true" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 rounded-full bg-orange-500 px-1.5 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}

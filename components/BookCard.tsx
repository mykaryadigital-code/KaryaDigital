
import { Book, rm } from "@/data/books";
import { ShoppingCart, Star, BookOpen } from "lucide-react";

export default function BookCard({
  book,
  onAdd,
  inCart,
}: {
  book: Book;
  onAdd: (id: number | string) => void;
  inCart: boolean;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div
        className="relative flex h-48 items-center justify-center p-5 sm:h-56"
        style={{
          background: `linear-gradient(135deg,${book.color},#0e1d30)`,
        }}
      >
        {book.tag && (
          <span className="absolute left-3 top-3 rounded-full bg-amber-300 px-2.5 py-1 text-[10px] font-bold text-slate-900">
            {book.tag}
          </span>
        )}

        {book.coverUrl ? (
          <div className="book-shadow h-40 w-28 overflow-hidden rounded-sm sm:h-44 sm:w-32">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={book.coverUrl}
              alt={`Cover ${book.title}`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        ) : (
          <div
            className="book-shadow flex h-40 w-28 flex-col items-center justify-between border-l-8 border-black/20 p-3 text-center sm:h-44 sm:w-32"
            style={{
              background: book.color,
              color: book.accent,
            }}
          >
            <BookOpen size={20} />
            <strong className="text-sm leading-snug">
              {book.title}
            </strong>
            <span className="text-[10px] tracking-widest">
              BUKUKITA
            </span>
          </div>
        )}
      </div>

      <div className="p-3.5">
        <span className="text-[11px] font-semibold text-orange-600">
          {book.category}
        </span>

        <h3 className="mt-1 line-clamp-2 min-h-11 text-sm font-bold">
          {book.title}
        </h3>

        <p className="mt-1 text-xs text-slate-500">
          {book.author}
        </p>

        <div className="mt-2 flex items-center gap-1 text-xs text-amber-500">
          <Star size={13} fill="currentColor" />
          <span className="font-semibold text-slate-700">
            {book.rating.toFixed(1)}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-2">
          <strong className="text-base text-orange-600">
            {rm(book.price)}
          </strong>

          {book.oldPrice && (
            <span className="text-xs text-slate-400 line-through">
              {rm(book.oldPrice)}
            </span>
          )}
        </div>

        <button
          onClick={() => onAdd(book.id)}
          className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-xs font-bold ${
            inCart
              ? "bg-emerald-100 text-emerald-800"
              : "bg-orange-500 text-white hover:bg-orange-600"
          }`}
        >
          <ShoppingCart size={15} />
          {inCart ? "Buang dari Troli" : "Tambah ke Troli"}
        </button>
      </div>
    </article>
  );
}

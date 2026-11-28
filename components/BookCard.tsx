import Link from "next/link";
import { Book, rm } from "@/data/books";
import { BookOpen, ShoppingCart } from "lucide-react";

export default function BookCard({
  book,
  onAdd,
  inCart,
}: {
  book: Book;
  onAdd: (id: number | string) => void;
  inCart: boolean;
}) {
  const productHref = `/ebook/${encodeURIComponent(String(book.id))}`;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link
        href={productHref}
        aria-label={`Lihat butiran ${book.title}`}
        className="relative block aspect-[3/4] w-full shrink-0 overflow-hidden bg-[#faf7f2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-600"
      >
        {book.coverUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={book.coverUrl}
            alt={`Kulit ${book.title}`}
            className="absolute inset-0 h-full w-full object-contain"
            loading="lazy"
          />
        ) : (
          <div
            className="absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-5 p-5 text-center"
            style={{
              background: `linear-gradient(145deg, ${book.color}, #0e1d30)`,
              color: book.accent,
            }}
          >
            <BookOpen size={40} aria-hidden="true" />
            <strong className="break-words text-base leading-snug sm:text-xl">
              {book.title}
            </strong>
            <span className="text-[10px] font-semibold tracking-widest">
              <span className="text-white">MY</span><span className="text-orange-500">KARYA</span>
            </span>
          </div>
        )}

        {book.tag && (
          <span className="absolute left-3 top-3 rounded-full bg-amber-300 px-2.5 py-1 text-[10px] font-bold text-slate-900 shadow-sm">
            {book.tag}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p
          title={book.category}
          className="line-clamp-1 text-[11px] font-semibold text-orange-700 sm:text-xs"
        >
          {book.category}
        </p>

        <h3 className="mt-2 min-h-10 text-sm font-bold leading-5 text-slate-900 sm:min-h-12 sm:text-base sm:leading-6">
          <Link
            href={productHref}
            className="line-clamp-2 break-words hover:text-orange-700 hover:underline"
          >
            {book.title}
          </Link>
        </h3>

        <div className="mt-auto pt-4">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <strong className="text-lg font-extrabold text-orange-600 sm:text-xl">
              {rm(book.price)}
            </strong>
            {book.oldPrice && (
              <span className="text-xs text-slate-400 line-through">
                {rm(book.oldPrice)}
              </span>
            )}
          </div>

          <button
            type="button"
            aria-pressed={inCart}
            onClick={() => onAdd(book.id)}
            className={`mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-xs font-bold transition-colors sm:text-sm ${
              inCart
                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                : "bg-orange-500 text-white hover:bg-orange-600"
            }`}
          >
            <ShoppingCart size={16} aria-hidden="true" />
            {inCart ? "Buang dari Troli" : "Tambah ke Troli"}
          </button>
        </div>
      </div>
    </article>
  );
}


"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "/pdf.worker.min.mjs";

export default function BacaEbookPage() {
  const params = useParams();
  const ebookId = params.ebookId as string;

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const pdfRef =
    useRef<pdfjsLib.PDFDocumentProxy | null>(null);

  const [pdf, setPdf] =
    useState<pdfjsLib.PDFDocumentProxy | null>(null);

  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState("");

  // Muatkan eBook selepas pengesahan pembelian
  useEffect(() => {
    let active = true;

    let loadingTask:
      pdfjsLib.PDFDocumentLoadingTask | null = null;

    async function loadBook() {
      setLoading(true);
      setError("");
      setPdf(null);
      setTotalPages(0);
      setPageNumber(1);

      try {
        const response = await fetch(
          "/api/reader/open",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ ebookId }),
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (!active) return;

        if (!response.ok || !result.url) {
          throw new Error(
            result.error || "Gagal membuka eBook."
          );
        }

        loadingTask = pdfjsLib.getDocument({
          url: result.url,
        });

        const document = await loadingTask.promise;

        if (!active) return;

        pdfRef.current = document;
        setPdf(document);
        setTotalPages(document.numPages);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Gagal membuka eBook."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadBook();

    return () => {
      active = false;
      pdfRef.current = null;

      if (loadingTask) {
        void loadingTask.destroy();
      }
    };
  }, [ebookId]);

  // Paparkan satu halaman PDF pada canvas
  useEffect(() => {
    if (!pdf || loading || error) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    let renderTask:
      pdfjsLib.RenderTask | null = null;

    async function renderPage() {
      setRendering(true);

      try {
        const page = await pdf!.getPage(pageNumber);

        if (cancelled) return;

        const containerWidth =
          canvas!.parentElement?.clientWidth ?? 800;

        const baseViewport = page.getViewport({
          scale: 1,
        });

        const scale = Math.min(
          2,
          Math.max(
            0.5,
            (containerWidth - 24) / baseViewport.width
          )
        );

        const viewport = page.getViewport({
          scale,
        });

        const context = canvas!.getContext("2d");

        if (!context) {
          throw new Error("Canvas tidak tersedia.");
        }

        canvas!.width = Math.floor(viewport.width);
        canvas!.height = Math.floor(viewport.height);

        renderTask = page.render({
          canvas: canvas!,
          canvasContext: context,
          viewport,
        });

        await renderTask.promise;
      } catch (err) {
        if (
          !cancelled &&
          !(
            err instanceof Error &&
            err.name === "RenderingCancelledException"
          )
        ) {
          setError("Gagal memaparkan halaman eBook.");
        }
      } finally {
        if (!cancelled) setRendering(false);
      }
    }

    void renderPage();

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pdf, pageNumber, loading, error]);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/perpustakaan"
          className="text-sm font-semibold text-orange-600"
        >
          ← Kembali ke Perpustakaan
        </Link>

        <h1 className="mt-5 text-2xl font-bold text-slate-900">
          📖 Pembaca eBook KaryaDigital
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Bacaan dalam talian untuk eBook yang telah dibeli.
        </p>

        {loading && (
          <div className="mt-8 rounded-xl bg-white p-8 text-center">
            <p className="text-slate-600">
              Sedang membuka eBook...
            </p>
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-xl bg-red-50 p-5 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && pdf && totalPages > 0 && (
          <div className="mt-6">
            <div className="rounded-xl bg-white p-3 shadow">
              {rendering && (
                <p className="mb-3 text-center text-sm text-slate-500">
                  Memaparkan halaman...
                </p>
              )}

              <canvas
                ref={canvasRef}
                className="mx-auto h-auto max-w-full"
              />
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() =>
                  setPageNumber((p) => Math.max(1, p - 1))
                }
                disabled={pageNumber <= 1 || rendering}
                className="rounded-lg bg-orange-500 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Sebelumnya
              </button>

              <span className="text-sm font-semibold text-slate-700">
                Halaman {pageNumber} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() =>
                  setPageNumber((p) =>
                    Math.min(totalPages, p + 1)
                  )
                }
                disabled={
                  pageNumber >= totalPages || rendering
                }
                className="rounded-lg bg-orange-500 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Seterusnya →
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-slate-500">
              © KaryaDigital — Untuk bacaan pemilik akaun sahaja.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

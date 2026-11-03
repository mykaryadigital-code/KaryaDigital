
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { createCanvas } from "@napi-rs/canvas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    // 1. Pastikan pengguna sudah log masuk
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Sila log masuk terlebih dahulu." },
        { status: 401 }
      );
    }

    // 2. Semak ID eBook dan nombor halaman
    const body = await request.json().catch(() => null);

    const ebookId = body?.ebookId;
    const pageNumber = body?.pageNumber;

    if (
      typeof ebookId !== "string" ||
      !uuidPattern.test(ebookId) ||
      !Number.isSafeInteger(pageNumber) ||
      pageNumber < 1 ||
      pageNumber > 10000
    ) {
      return NextResponse.json(
        { error: "Maklumat halaman tidak sah." },
        { status: 400 }
      );
    }

    // 3. Semak pesanan berbayar milik pengguna
    const { data: paidOrders, error: orderError } =
      await supabase
        .from("orders")
        .select("id")
        .eq("buyer_id", user.id)
        .eq("status", "paid");

    if (orderError) {
      return NextResponse.json(
        { error: "Gagal menyemak pembelian." },
        { status: 500 }
      );
    }

    const orderIds = (paidOrders ?? []).map(
      (order) => order.id
    );

    if (orderIds.length === 0) {
      return NextResponse.json(
        { error: "Anda belum membeli eBook ini." },
        { status: 403 }
      );
    }

    // 4. Sahkan eBook termasuk dalam pesanan berbayar
    const { data: purchasedItem, error: itemError } =
      await supabase
        .from("order_items")
        .select("ebook_id")
        .eq("ebook_id", ebookId)
        .in("order_id", orderIds)
        .limit(1)
        .maybeSingle();

    if (itemError) {
      return NextResponse.json(
        { error: "Gagal menyemak hak bacaan." },
        { status: 500 }
      );
    }

    if (!purchasedItem) {
      return NextResponse.json(
        { error: "Anda tidak mempunyai akses kepada eBook ini." },
        { status: 403 }
      );
    }

    // 5. Dapatkan lokasi PDF daripada pangkalan data
    const { data: ebook, error: ebookError } =
      await supabase
        .from("ebooks")
        .select("pdf_path")
        .eq("id", ebookId)
        .single();

    if (ebookError || !ebook?.pdf_path) {
      return NextResponse.json(
        { error: "Fail eBook tidak tersedia." },
        { status: 404 }
      );
    }

    // 6. Ambil PDF terus di server, bukan melalui URL awam
    const { data: pdfBlob, error: downloadError } =
      await supabase.storage
        .from("ebook-pdfs")
        .download(ebook.pdf_path);

    if (downloadError || !pdfBlob) {
      return NextResponse.json(
        { error: "Gagal membaca fail eBook." },
        { status: 500 }
      );
    }

    // Had keselamatan untuk fail PDF
    const MAX_PDF_BYTES = 25 * 1024 * 1024;

    if (pdfBlob.size > MAX_PDF_BYTES) {
      return NextResponse.json(
        { error: "Fail eBook terlalu besar untuk dipaparkan." },
        { status: 413 }
      );
    }

    // 7. Buka PDF menggunakan PDF.js
    const pdfBytes = new Uint8Array(
      await pdfBlob.arrayBuffer()
    );

    const loadingTask = getDocument({
  data: pdfBytes,
  useSystemFonts: true,
});

    let pdf;

    try {
      pdf = await loadingTask.promise;

      if (pageNumber > pdf.numPages) {
        return NextResponse.json(
          { error: "Halaman tidak wujud." },
          { status: 404 }
        );
      }

      // 8. Tukarkan satu halaman kepada PNG
      const page = await pdf.getPage(pageNumber);

      const baseViewport = page.getViewport({ scale: 1 });

      const scale = Math.min(
        1.5,
        1400 / Math.max(
          baseViewport.width,
          baseViewport.height
        )
      );

      const viewport = page.getViewport({ scale });

      const width = Math.ceil(viewport.width);
      const height = Math.ceil(viewport.height);

      if (
        width < 1 ||
        height < 1 ||
        width * height > 4_000_000
      ) {
        return NextResponse.json(
          { error: "Saiz halaman tidak disokong." },
          { status: 413 }
        );
      }

      const canvas = createCanvas(width, height);
      const context = canvas.getContext("2d");

      await page.render({
  canvas: canvas as unknown as HTMLCanvasElement,
  canvasContext: context as unknown as
    Parameters<typeof page.render>[0]["canvasContext"],
  viewport,
}).promise;

      const png = canvas.toBuffer("image/png");

      return new NextResponse(new Uint8Array(png), {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
          "Content-Disposition": "inline",
          "X-Total-Pages": String(pdf.numPages),
        },
      });
    } finally {
      await loadingTask.destroy();
    }
  } catch (error) {
    console.error(
      "Reader page error:",
      error instanceof Error ? error.name : "unknown"
    );

    return NextResponse.json(
      { error: "Gagal memaparkan halaman eBook." },
      { status: 500 }
    );
  }
}

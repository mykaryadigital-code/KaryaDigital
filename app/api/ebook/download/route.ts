
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MAX_PDF_BYTES = 20 * 1024 * 1024;

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        "Cache-Control": "private, no-store",
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    // 1. Client pengguna untuk semakan akses
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonError(
        "Sila log masuk terlebih dahulu.",
        401
      );
    }

    // 2. Sahkan ID eBook
    const body = await request.json().catch(() => null);
    const ebookId = body?.ebookId;

    if (
      typeof ebookId !== "string" ||
      !uuidPattern.test(ebookId)
    ) {
      return jsonError("ID eBook tidak sah.", 400);
    }

    // 3. Cari pesanan berbayar milik pengguna
    const { data: paidOrders, error: orderError } =
      await supabase
        .from("orders")
        .select("id")
        .eq("buyer_id", user.id)
        .eq("status", "paid");

    if (orderError) {
      return jsonError(
        "Gagal menyemak rekod pembelian.",
        500
      );
    }

    const orderIds = (paidOrders ?? []).map(
      (order) => order.id
    );

    if (orderIds.length === 0) {
      return jsonError(
        "Anda belum membeli eBook ini.",
        403
      );
    }

    // 4. Pastikan eBook berada dalam pesanan berbayar
    const { data: purchasedItem, error: itemError } =
      await supabase
        .from("order_items")
        .select("ebook_id")
        .eq("ebook_id", ebookId)
        .in("order_id", orderIds)
        .limit(1)
        .maybeSingle();

    if (itemError) {
      return jsonError(
        "Gagal menyemak hak download.",
        500
      );
    }

    if (!purchasedItem) {
      return jsonError(
        "Anda tidak mempunyai hak download eBook ini.",
        403
      );
    }

    // 5. Semak jenis akses dan lokasi PDF
    const { data: ebook, error: ebookError } =
      await supabase
        .from("ebooks")
        .select("pdf_path, access_type")
        .eq("id", ebookId)
        .single();

    if (ebookError || !ebook?.pdf_path) {
      return jsonError(
        "Fail eBook tidak tersedia.",
        404
      );
    }



    // 6. Hanya selepas semua semakan berjaya,
    // gunakan Admin Client untuk membaca Storage private
    const admin = createAdminClient();

    const { data: pdfBlob, error: downloadError } =
      await admin.storage
        .from("ebook-pdfs")
        .download(ebook.pdf_path);

    if (downloadError || !pdfBlob) {
      console.error(
        "Private PDF download failed:",
        downloadError?.message
      );

      return jsonError(
        "Gagal mendapatkan fail PDF.",
        500
      );
    }

    if (pdfBlob.size > MAX_PDF_BYTES) {
      return jsonError(
        "Fail PDF terlalu besar untuk dimuat turun.",
        413
      );
    }

    // 7. Hantar PDF sebagai fail download
    const pdfBytes = await pdfBlob.arrayBuffer();

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          `attachment; filename="karyadigital-${ebookId}.pdf"`,
        "Content-Length": String(pdfBytes.byteLength),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Ebook download error:", error);

    return jsonError(
      "Gagal memproses permintaan download.",
      500
    );
  }
}


import { createAdminClient } from "@/lib/supabase/admin";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Pastikan pembeli sudah login
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

    // 2. Semak ID eBook
    const body = await request.json().catch(() => null);
    const ebookId = body?.ebookId;

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (
      typeof ebookId !== "string" ||
      !uuidPattern.test(ebookId)
    ) {
      return NextResponse.json(
        { error: "ID eBook tidak sah." },
        { status: 400 }
      );
    }

    // 3. Semak pesanan yang sudah dibayar
    // dan dimiliki oleh pengguna ini
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

    // 4. Pastikan eBook termasuk dalam pesanan berbayar
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
        { error: "Gagal menyemak eBook yang dibeli." },
        { status: 500 }
      );
    }

    if (!purchasedItem) {
      return NextResponse.json(
        { error: "Anda tidak mempunyai akses kepada eBook ini." },
        { status: 403 }
      );
    }

    // 5. Dapatkan lokasi PDF
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
// 6. Sediakan pautan bacaan sementara
// Hanya selepas hak pembelian pengguna disahkan.
const admin = createAdminClient();

const { data: signedData, error: signedError } =
  await admin.storage
    .from("ebook-pdfs")
    .createSignedUrl(ebook.pdf_path, 60);


    if (signedError || !signedData?.signedUrl) {
      return NextResponse.json(
        { error: "Gagal menyediakan pautan bacaan." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { url: signedData.signedUrl },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { error: "Ralat sistem. Sila cuba lagi." },
      { status: 500 }
    );
  }
}

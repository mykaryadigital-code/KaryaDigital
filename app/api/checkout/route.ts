
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Pastikan pembeli sudah log masuk
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Sila log masuk untuk membuat pesanan." },
        { status: 401 }
      );
    }

    // Baca senarai ID eBook daripada troli
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Format permintaan tidak sah." },
        { status: 400 }
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      !("ebookIds" in body)
    ) {
      return NextResponse.json(
        { error: "Senarai eBook diperlukan." },
        { status: 400 }
      );
    }

    const ebookIds = body.ebookIds;

    if (
      !Array.isArray(ebookIds) ||
      ebookIds.length < 1 ||
      ebookIds.length > 20 ||
      !ebookIds.every(
        (id) =>
          typeof id === "string" &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
      )
    ) {
      return NextResponse.json(
        { error: "Senarai ID eBook tidak sah." },
        { status: 400 }
      );
    }

    // Database mengesahkan eBook dan mengira harga
    const { data: orderId, error } = await supabase.rpc(
      "create_checkout_order",
      { p_ebook_ids: ebookIds }
    );

    if (error) {
      console.error("Checkout gagal:", error.message);

      return NextResponse.json(
        { error: "Pesanan gagal dibuat. Sila semak eBook dalam troli." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        orderId,
        message: "Pesanan berjaya dibuat. Menunggu pembayaran.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Ralat API checkout:", error);

    return NextResponse.json(
      { error: "Ralat server. Sila cuba lagi." },
      { status: 500 }
    );
  }
}

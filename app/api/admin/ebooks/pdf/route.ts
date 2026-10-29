
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Semak pengguna yang sedang login
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Sila login terlebih dahulu." },
        { status: 401 }
      );
    }

    // 2. Pastikan pengguna ialah Admin
    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profileError || profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Akses hanya untuk Super Admin." },
        { status: 403 }
      );
    }

    // 3. Dapatkan ID eBook
    const body = await request.json().catch(() => null);
    const ebookId = body?.ebookId;

    if (
      typeof ebookId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        ebookId
      )
    ) {
      return NextResponse.json(
        { error: "ID eBook tidak sah." },
        { status: 400 }
      );
    }

    // 4. Cari PDF eBook dalam database
    const { data: ebook, error: ebookError } =
      await supabase
        .from("ebooks")
        .select("id, pdf_path, status")
        .eq("id", ebookId)
        .single();

    if (ebookError || !ebook) {
      return NextResponse.json(
        { error: "eBook tidak ditemui." },
        { status: 404 }
      );
    }

    if (ebook.status !== "pending") {
      return NextResponse.json(
        { error: "eBook bukan dalam proses semakan." },
        { status: 400 }
      );
    }

    if (!ebook.pdf_path) {
      return NextResponse.json(
        { error: "Fail PDF tidak tersedia." },
        { status: 404 }
      );
    }

    // 5. Cipta Signed URL selama 60 saat
    const { data: signedData, error: signedError } =
      await supabase.storage
        .from("ebook-pdfs")
        .createSignedUrl(ebook.pdf_path, 60);

    if (signedError || !signedData?.signedUrl) {
      return NextResponse.json(
        { error: "Gagal menyediakan pautan PDF." },
        { status: 500 }
      );
    }

    // 6. Hantar pautan kepada Admin
    return NextResponse.json(
      { url: signedData.signedUrl },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Ralat semasa membuka PDF." },
      { status: 500 }
    );
  }
}

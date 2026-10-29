
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Semak pengguna yang sedang log masuk
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Sila log masuk dahulu." },
        { status: 401 }
      );
    }

    // Ambil ID pesanan daripada permintaan
    const body = await request.json().catch(() => null);
    const orderId = body?.orderId;

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (
      typeof orderId !== "string" ||
      !uuidPattern.test(orderId)
    ) {
      return NextResponse.json(
        { error: "ID pesanan tidak sah." },
        { status: 400 }
      );
    }

    // Cari pesanan milik pembeli ini sahaja
    const { data: order, error: orderError } =
      await supabase
        .from("orders")
        .select("id, buyer_id, total_amount, status")
        .eq("id", orderId)
        .eq("buyer_id", user.id)
        .maybeSingle();

    if (orderError) {
      console.error("Order lookup error:", orderError);

      return NextResponse.json(
        { error: "Gagal menyemak pesanan." },
        { status: 500 }
      );
    }

    if (!order) {
      return NextResponse.json(
        { error: "Pesanan tidak dijumpai." },
        { status: 404 }
      );
    }

    if (order.status !== "pending") {
      return NextResponse.json(
        { error: "Pesanan ini bukan lagi pending." },
        { status: 409 }
      );
    }

    const amount = Number(order.total_amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Jumlah pesanan tidak sah." },
        { status: 400 }
      );
    }

    // Belum mencipta bil toyyibPay
    
    // Dapatkan maklumat pembeli
    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) {
      console.error(
        "Buyer profile error:",
        profileError
      );

      return NextResponse.json(
        { error: "Gagal mendapatkan maklumat pembeli." },
        { status: 500 }
      );
    }

    const buyerName = profile?.full_name?.trim();
    const buyerEmail = user.email?.trim();
    const buyerPhone = profile?.phone?.trim();

    if (!buyerName || !buyerEmail || !buyerPhone) {
      return NextResponse.json(
        {
          error:
            "Maklumat pembeli belum lengkap. Sila lengkapkan nama, email dan nombor telefon.",
        },
        { status: 400 }
      );
    }

    // Semakan sahaja, belum cipta bil
    
    // Simpan atau dapatkan rekod pembayaran
    // menggunakan fungsi Supabase yang dilindungi.
    const admin = createAdminClient();

    const { data: payment, error: paymentError } =
      await admin.rpc("reserve_order_payment", {
        p_order_id: order.id,
      });

    if (paymentError || !payment) {
      console.error(
        "Payment reservation error:",
        paymentError
      );

      return NextResponse.json(
        {
          error: "Gagal menyediakan rekod pembayaran.",
        },
        { status: 500 }
      );
    }

    // Semak sama ada bil sudah wujud
    if (payment.provider_bill_code) {
      return NextResponse.json({
        success: true,
        message: "Bil pembayaran sudah tersedia.",
        paymentId: payment.id,
        billCode: payment.provider_bill_code,
        paymentStatus: payment.status,
      });
    }

    // Jangan cipta bil kedua jika proses
    // sedang berjalan atau sudah selesai.
    if (payment.status !== "pending") {
      return NextResponse.json(
        {
          error:
            "Pembayaran sedang diproses atau memerlukan semakan.",
          paymentStatus: payment.status,
        },
        { status: 409 }
      );
    }

    // Belum mencipta bil toyyibPay
    
    // Pastikan rujukan pembayaran tersedia
    if (!payment.external_reference) {
      return NextResponse.json(
        {
          error: "Rujukan pembayaran tidak tersedia.",
        },
        { status: 500 }
      );
    }

    // Kunci proses penciptaan bil supaya
    // hanya satu permintaan boleh meneruskannya.
    const { data: claimed, error: claimError } =
      await admin.rpc("claim_payment_creation", {
        p_payment_id: payment.id,
      });

    if (claimError) {
      console.error(
        "Payment claim error:",
        claimError
      );

      return NextResponse.json(
        { error: "Gagal mengunci proses pembayaran." },
        { status: 500 }
      );
    }

    if (claimed !== true) {
      return NextResponse.json(
        {
          error:
            "Proses pembayaran sudah dimulakan.",
        },
        { status: 409 }
      );
    }

const toyyibPayBaseUrl =
  process.env.TOYYIBPAY_BASE_URL?.replace(/\/+$/, "");

const toyyibPayCreateBillUrl =
  `${toyyibPayBaseUrl}/index.php/api/createBill`;

const toyyibPaySecretKey =
  process.env.TOYYIBPAY_SECRET_KEY;

const toyyibPayCategoryCode =
  process.env.TOYYIBPAY_CATEGORY_CODE;

if (
  !toyyibPayBaseUrl ||
  !toyyibPaySecretKey ||
  !toyyibPayCategoryCode
) {
  console.error(
    "Konfigurasi toyyibPay tidak lengkap."
  );

  return NextResponse.json(
    {
      error:
        "Konfigurasi pembayaran belum lengkap.",
    },
    { status: 500 }
  );
}

const toyyibPayBillData = new URLSearchParams({
  userSecretKey: toyyibPaySecretKey,
  categoryCode: toyyibPayCategoryCode,
  billName: `KaryaDigital - ${order.id.slice(0, 8)}`,
  billDescription: "Pembelian eBook KaryaDigital",
  billPriceSetting: "1",
  billPayorInfo: "1",
  billAmount: String(Math.round(amount * 100)),
  
billReturnUrl: "https://mykarya.digital/pesanan",
billCallbackUrl: "https://mykarya.digital/api/payments/callback",

  billExternalReferenceNo: payment.external_reference,
  billTo: buyerName,
  billEmail: buyerEmail,
  billPhone: buyerPhone,
  billSplitPayment: "0",
  billPaymentChannel: "0",
  billContentEmail: "Terima kasih kerana membeli di KaryaDigital.",
  billChargeToCustomer: "1",
});
const createBillRequestOptions: RequestInit = {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: toyyibPayBillData.toString(),
  cache: "no-store",
};

const createBillResponse = await fetch(
  toyyibPayCreateBillUrl,
  {
    ...createBillRequestOptions,
    signal: AbortSignal.timeout(10000),
  }
);
   if (!createBillResponse.ok) {
  console.error(
    "Permintaan Create Bill toyyibPay gagal:",
    createBillResponse.status
  );

  return NextResponse.json(
    { error: "Gagal mencipta bil pembayaran." },
    { status: 503 }
  );
} const createBillData: unknown =
  await createBillResponse.json();
  if (!Array.isArray(createBillData) || createBillData.length === 0) {
  console.error("Format respons Create Bill toyyibPay tidak sah.");

  return NextResponse.json(
    { error: "Respons penciptaan bil tidak sah." },
    { status: 503 }
  );
}const firstBill = createBillData[0];

const billCode =
  firstBill !== null &&
  typeof firstBill === "object" &&
  !Array.isArray(firstBill) &&
  "BillCode" in firstBill &&
  typeof firstBill.BillCode === "string"
    ? firstBill.BillCode.trim()
    : "";
    if (!billCode) {
  console.error("Bill Code daripada toyyibPay tidak sah.");

  return NextResponse.json(
    { error: "Kod bil pembayaran tidak diterima." },
    { status: 503 }
  );
}
const { data: billSaved, error: billSaveError } = await admin.rpc(
  "save_payment_bill_code",
  {
    p_payment_id: payment.id,
    p_bill_code: billCode,
  }
);

if (billSaveError || billSaved !== true) {
  console.error("Gagal menyimpan Bill Code pembayaran.");

  return NextResponse.json(
    { error: "Bil telah dicipta tetapi belum dapat disimpan. Sila hubungi sokongan." },
    { status: 503 }
  );
}
return NextResponse.json(
  {
    success: true,
    message: "Bil pembayaran berjaya dicipta.",
    orderId: order.id,
    paymentId: payment.id,
    billCode,
paymentUrl: `${toyyibPayBaseUrl}/${billCode}`,
paymentStatus: "creating",
  },
  { status: 200 }
);


  } catch (error) {
    console.error("Create Bill API error:", error);

    return NextResponse.json(
      { error: "Ralat dalaman server." },
      { status: 500 }
    );
  }
}

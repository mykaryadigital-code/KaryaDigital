import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function reply(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

function validAppUrl(value: string): boolean {
  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return reply({ error: "Sila log masuk dahulu." }, 401);
    }

    const body = await request.json().catch(() => null);
    const orderId = body?.orderId;

    if (
      typeof orderId !== "string" ||
      !uuidPattern.test(orderId)
    ) {
      return reply({ error: "ID pesanan tidak sah." }, 400);
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, buyer_id, total_amount, status")
      .eq("id", orderId)
      .eq("buyer_id", user.id)
      .maybeSingle();

    if (orderError) {
      return reply({ error: "Gagal menyemak pesanan." }, 500);
    }

    if (!order) {
      return reply({ error: "Pesanan tidak dijumpai." }, 404);
    }

    if (order.status !== "pending") {
      return reply(
        { error: "Pesanan ini bukan lagi menunggu pembayaran." },
        409
      );
    }

    const amount = Number(order.total_amount);
    const amountInSen = Math.round(amount * 100);

    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !Number.isSafeInteger(amountInSen) ||
      amountInSen <= 0 ||
      Math.abs(amount * 100 - amountInSen) > 0.000001
    ) {
      return reply({ error: "Jumlah pesanan tidak sah." }, 400);
    }

    // Semak konfigurasi sebelum menyediakan atau mengunci pembayaran.
    const baseUrl = process.env.TOYYIBPAY_BASE_URL
      ?.trim()
      .replace(/\/+$/, "");

    const secretKey = process.env.TOYYIBPAY_SECRET_KEY?.trim();
    const categoryCode = process.env.TOYYIBPAY_CATEGORY_CODE?.trim();

    const appUrl = process.env.TOYYIBPAY_APP_URL
      ?.trim()
      .replace(/\/+$/, "");

    if (
      !baseUrl ||
      !["https://dev.toyyibpay.com", "https://toyyibpay.com"].includes(
        baseUrl
      ) ||
      !secretKey ||
      !categoryCode ||
      !appUrl ||
      !validAppUrl(appUrl)
    ) {
      return reply(
        { error: "Konfigurasi pembayaran belum lengkap atau tidak sah." },
        500
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return reply(
        { error: "Gagal mendapatkan maklumat pembeli." },
        500
      );
    }

    const buyerName = profile?.full_name?.trim();
    const buyerEmail = user.email?.trim();
    const buyerPhone = profile?.phone?.trim();

    if (!buyerName || !buyerEmail || !buyerPhone) {
      return reply(
        {
          error:
            "Maklumat pembeli belum lengkap. Sila lengkapkan nama, email dan nombor telefon.",
        },
        400
      );
    }

    const admin = createAdminClient();

    const { data: payment, error: paymentError } = await admin.rpc(
      "reserve_order_payment",
      { p_order_id: order.id }
    );

    if (paymentError || !payment) {
      return reply(
        { error: "Gagal menyediakan rekod pembayaran." },
        500
      );
    }

    const paymentAmount = Number(payment.amount);

    if (
      !Number.isFinite(paymentAmount) ||
      Math.abs(paymentAmount - amount) > 0.000001
    ) {
      return reply(
        { error: "Jumlah rekod pembayaran tidak sepadan dengan pesanan." },
        409
      );
    }

    if (payment.status === "paid") {
      return reply(
        {
          error:
            "Rekod pembayaran sudah dibayar. Sila semak status pesanan.",
        },
        409
      );
    }

    if (!["pending", "failed", "creating"].includes(payment.status)) {
      return reply(
        { error: "Status pembayaran memerlukan semakan." },
        409
      );
    }

    // Gunakan bil sedia ada. Jangan cipta bil kedua.
    if (payment.provider_bill_code) {
      const savedBillCode = payment.provider_bill_code;

      if (
        typeof savedBillCode !== "string" ||
        !/^[a-zA-Z0-9]+$/.test(savedBillCode)
      ) {
        return reply(
          { error: "Kod bil tersimpan memerlukan semakan." },
          500
        );
      }

      return reply({
        success: true,
        message: "Bil pembayaran sudah tersedia.",
        orderId: order.id,
        paymentId: payment.id,
        billCode: savedBillCode,
        paymentUrl: `${baseUrl}/${savedBillCode}`,
        paymentStatus: payment.status,
      });
    }

    // Status creating tanpa kod bil ialah keputusan yang belum pasti.
    // Jangan reset atau cuba mencipta bil baharu secara automatik.
    if (payment.status === "creating") {
      return reply(
        {
          error:
            "Penciptaan bil telah dimulakan tetapi kod bil belum tersedia. Jangan buat bayaran atau pesanan baharu untuk pembelian ini. Hubungi sokongan dengan ID pesanan.",
          orderId: order.id,
          paymentStatus: payment.status,
          requiresReview: true,
        },
        409
      );
    }

    if (
      typeof payment.external_reference !== "string" ||
      !payment.external_reference.trim()
    ) {
      return reply(
        { error: "Rujukan pembayaran tidak tersedia." },
        500
      );
    }

    // Sediakan data sebelum mengambil kunci pembayaran.
    const billData = new URLSearchParams({
      userSecretKey: secretKey,
      categoryCode,
      billName: `KaryaDigital - ${order.id.slice(0, 8)}`,
      billDescription: "Pembelian eBook KaryaDigital",
      billPriceSetting: "1",
      billPayorInfo: "1",
      billAmount: String(amountInSen),
      billReturnUrl: `${appUrl}/pesanan`,
      billCallbackUrl: `${appUrl}/api/payments/callback`,
      billExternalReferenceNo: payment.external_reference,
      billTo: buyerName,
      billEmail: buyerEmail,
      billPhone: buyerPhone,
      billSplitPayment: "0",
      billPaymentChannel: "0",
      billContentEmail: "Terima kasih kerana membeli di KaryaDigital.",
      billChargeToCustomer: "1",
    });

    const { data: claimed, error: claimError } = await admin.rpc(
      "claim_payment_creation",
      { p_payment_id: payment.id }
    );

    if (claimError || claimed !== true) {
      return reply(
        {
          error:
            "Proses pembayaran belum dapat dimulakan atau sedang diproses. Sila semak semula pesanan.",
        },
        claimError ? 503 : 409
      );
    }
        const confirmedOrderId = order.id;

    function needsReview(message: string) {
      return reply(
        {
          error: message,
          orderId: confirmedOrderId,
          requiresReview: true,
        },
        503
      );
    }

    let billCode = "";

    try {
      // Hanya satu permintaan Create Bill. Tiada retry automatik.
      const response = await fetch(
        `${baseUrl}/index.php/api/createBill`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: billData.toString(),
          cache: "no-store",
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!response.ok) {
        console.error("Create Bill HTTP error:", {
          paymentId: payment.id,
          status: response.status,
        });

        return needsReview(
          "Jawapan penciptaan bil belum dapat dipastikan. Jangan bayar semula. Hubungi sokongan dengan ID pesanan."
        );
      }

      const result: unknown = await response.json();

      if (Array.isArray(result) && result.length > 0) {
        const first: unknown = result[0];

        if (
          first !== null &&
          typeof first === "object" &&
          "BillCode" in first &&
          typeof first.BillCode === "string"
        ) {
          billCode = first.BillCode.trim();
        }
      }

      if (!/^[a-zA-Z0-9]+$/.test(billCode)) {
        console.error("Create Bill returned no valid code:", {
          paymentId: payment.id,
        });

        return needsReview(
          "Kod bil tidak dapat dipastikan. Jangan bayar semula. Hubungi sokongan dengan ID pesanan."
        );
      }
    } catch (error) {
      console.error("Create Bill response uncertain:", {
        paymentId: payment.id,
        errorName: error instanceof Error ? error.name : "unknown",
      });

      return needsReview(
        "Sambungan penciptaan bil terganggu atau tamat masa. Bil mungkin telah dicipta. Jangan bayar semula; hubungi sokongan dengan ID pesanan."
      );
    }

    // Retry penyimpanan kod yang SAMA, bukan penciptaan bil.
    let billSaved = false;

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const { data: saved, error: saveError } = await admin.rpc(
          "save_payment_bill_code",
          {
            p_payment_id: payment.id,
            p_bill_code: billCode,
          }
        );

        if (!saveError && saved === true) {
          billSaved = true;
          break;
        }

        console.error("Bill code save failed:", {
          paymentId: payment.id,
          attempt,
          errorCode: saveError?.code,
        });
      } catch {
        console.error("Bill code save connection failed:", {
          paymentId: payment.id,
          attempt,
        });
      }
    }

    if (!billSaved) {
      // Kod bil disimpan dalam log server untuk pemulihan oleh operator.
      // Jangan log secret key atau maklumat peribadi pembeli.
      console.error("Bill requires manual recovery:", {
        orderId: order.id,
        paymentId: payment.id,
        billCode,
      });

      return needsReview(
        "Bil telah dicipta tetapi kodnya belum dapat disimpan. Jangan bayar semula. Hubungi sokongan dengan ID pesanan."
      );
    }

    return reply({
      success: true,
      message: "Bil pembayaran berjaya disediakan.",
      orderId: order.id,
      paymentId: payment.id,
      billCode,
      paymentUrl: `${baseUrl}/${billCode}`,
      paymentStatus: "creating",
    });
  } catch (error) {
    console.error("Create Bill API error:", {
      errorName: error instanceof Error ? error.name : "unknown",
    });

    return reply(
      {
        error:
          "Permintaan pembayaran belum dapat diselesaikan. Semak pesanan sebelum mencuba lagi.",
      },
      500
    );
  }
}
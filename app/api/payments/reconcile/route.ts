
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type ToyyibPayTransaction = {
  billCode?: unknown;
  billpaymentStatus?: unknown;
  billpaymentAmount?: unknown;
  billExternalReferenceNo?: unknown;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function toSen(value: unknown): number | null {
  if (
    (typeof value !== "string" && typeof value !== "number") ||
    String(value).trim() === ""
  ) {
    return null;
  }

  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  const sen = Math.round(amount * 100);

  if (Math.abs(amount * 100 - sen) > 0.00001) {
    return null;
  }

  return sen;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Sahkan pengguna
    const supabase = await createClient();

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

    // 2. Sahkan ID pesanan
    const body = await request.json().catch(() => null);
    const orderId = body?.orderId;

    if (
      typeof orderId !== "string" ||
      !uuidPattern.test(orderId)
    ) {
      return NextResponse.json(
        { error: "ID pesanan tidak sah." },
        { status: 400 }
      );
    }

    // 3. Pastikan pesanan milik pembeli
    const { data: order, error: orderError } =
      await supabase
        .from("orders")
        .select("id, buyer_id, total_amount, status")
        .eq("id", orderId)
        .eq("buyer_id", user.id)
        .maybeSingle();

    if (orderError) {
      console.error("Reconcile order lookup:", orderError.code);

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

    if (order.status === "paid") {
      return NextResponse.json({
        success: true,
        paymentStatus: "paid",
        message: "Pesanan sudah dibayar.",
      });
    }

    if (order.status !== "pending") {
      return NextResponse.json(
        { error: "Pesanan tidak boleh disemak." },
        { status: 409 }
      );
    }

    // 4. Dapatkan rekod pembayaran sedia ada
    const admin = createAdminClient();

    const { data: payment, error: paymentError } =
      await admin
        .from("payments")
        .select(
          "id, order_id, provider, provider_bill_code, external_reference, amount, status"
        )
        .eq("order_id", order.id)
        .eq("provider", "toyyibpay")
        .maybeSingle();

    if (paymentError) {
      console.error(
        "Reconcile payment lookup:",
        paymentError.code
      );

      return NextResponse.json(
        { error: "Gagal menyemak rekod pembayaran." },
        { status: 500 }
      );
    }

    if (
      !payment ||
      typeof payment.provider_bill_code !== "string" ||
      !payment.provider_bill_code.trim() ||
      typeof payment.external_reference !== "string" ||
      !payment.external_reference.trim() ||
      payment.order_id !== order.id ||
      payment.provider !== "toyyibpay" ||
      !["creating", "pending"].includes(payment.status)
    ) {
      return NextResponse.json(
        { error: "Rekod pembayaran tidak boleh disahkan." },
        { status: 409 }
      );
    }

    const expectedSen = toSen(order.total_amount);
    const paymentSen = toSen(payment.amount);

    if (
      expectedSen === null ||
      paymentSen === null ||
      expectedSen !== paymentSen
    ) {
      return NextResponse.json(
        { error: "Jumlah pesanan tidak sepadan." },
        { status: 409 }
      );
    }

    // 5. Semak konfigurasi toyyibPay
    const baseUrl =
      process.env.TOYYIBPAY_BASE_URL?.replace(/\/+$/, "");

    const secretKey = process.env.TOYYIBPAY_SECRET_KEY;

    if (!baseUrl || !secretKey) {
      return NextResponse.json(
        { error: "Konfigurasi toyyibPay tidak lengkap." },
        { status: 503 }
      );
    }

    // 6. Dapatkan transaksi daripada toyyibPay
    const params = new URLSearchParams({
      billCode: payment.provider_bill_code,
      userSecretKey: secretKey,
    });

    const response = await fetch(
      `${baseUrl}/index.php/api/getBillTransactions`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body: params.toString(),
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      console.error(
        "Reconcile toyyibPay HTTP:",
        response.status
      );

      return NextResponse.json(
        { error: "Gagal menghubungi toyyibPay." },
        { status: 503 }
      );
    }

    const result: unknown = await response.json();

    if (!Array.isArray(result)) {
      return NextResponse.json(
        { error: "Respons toyyibPay tidak sah." },
        { status: 503 }
      );
    }

    // 7. Cari transaksi berjaya yang sepadan
    const matching = (result as ToyyibPayTransaction[])
      .filter(
        (transaction) =>
          transaction !== null &&
          typeof transaction === "object" &&
          String(transaction.billpaymentStatus) === "1" &&
          typeof transaction.billCode === "string" &&
          transaction.billCode.trim() ===
            payment.provider_bill_code.trim() &&
          toSen(transaction.billpaymentAmount) === expectedSen
      );

    // Rujukan transaksi mesti sepadan dengan rekod asal
    const verified = matching.find(
      (transaction) =>
        typeof transaction.billExternalReferenceNo ===
          "string" &&
        transaction.billExternalReferenceNo.trim() ===
          payment.external_reference.trim()
    );

    if (!verified) {
      console.warn("Reconcile: Semakan transaksi gagal.", {
  totalTransactions: Array.isArray(result) ? result.length : 0,
  successfulStatusCount: (result as ToyyibPayTransaction[]).filter(
    (t) => String(t?.billpaymentStatus) === "1"
  ).length,
  matchingBillCount: (result as ToyyibPayTransaction[]).filter(
    (t) =>
      typeof t?.billCode === "string" &&
      t.billCode.trim() === payment.provider_bill_code.trim()
  ).length,
  matchingAmountCount: (result as ToyyibPayTransaction[]).filter(
    (t) => toSen(t?.billpaymentAmount) === expectedSen
  ).length,
  matchingReferenceCount: (result as ToyyibPayTransaction[]).filter(
    (t) =>
      typeof t?.billExternalReferenceNo === "string" &&
      t.billExternalReferenceNo.trim() === payment.external_reference.trim()
  ).length,
});

      return NextResponse.json(
        {
          success: false,
          paymentStatus: "pending",
          message:
            "Bayaran belum dapat disahkan. Status pesanan tidak diubah.",
        },
        { status: 409 }
      );
    }

    // 8. Kemaskini pembayaran melalui fungsi DB dilindungi
    const { data: finalized, error: finalizeError } =
      await admin.rpc("finalize_verified_payment", {
        p_payment_id: payment.id,
        p_order_id: order.id,
        p_bill_code: payment.provider_bill_code,
        p_external_reference: payment.external_reference,
        p_amount: Number(payment.amount),
      });

    if (finalizeError || finalized !== true) {
      console.error(
        "Reconcile finalization:",
        finalizeError?.code ?? "rejected"
      );

      return NextResponse.json(
        { error: "Bayaran disahkan tetapi rekod belum dapat dikemas kini." },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentStatus: "paid",
      message: "Pembayaran berjaya disahkan.",
    });
  } catch (error) {
    console.error(
      "Reconcile unexpected error:",
      error instanceof Error ? error.name : "unknown"
    );

    return NextResponse.json(
      { error: "Ralat semasa mengesahkan pembayaran." },
      { status: 500 }
    );
  }
}

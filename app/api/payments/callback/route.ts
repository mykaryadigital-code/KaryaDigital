
import {
  NextRequest,
  NextResponse,
} from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";


const toyyibPayBaseUrl =
  process.env.TOYYIBPAY_BASE_URL?.replace(/\/+$/, "");


const toyyibPaySecretKey =
  process.env.TOYYIBPAY_SECRET_KEY;

const toyyibPayStatusUrl = toyyibPayBaseUrl
  ? `${toyyibPayBaseUrl}/index.php/api/getBillTransactions`
  : null;

type ToyyibPayTransaction = {
  billCode?: unknown;
  billpaymentStatus?: unknown;
  billpaymentAmount?: unknown;
  billExternalReferenceNo?: unknown;
};

export async function POST(
  request: NextRequest
) {
  try {
    
if (
  !toyyibPayStatusUrl ||
  !toyyibPaySecretKey
) {
  console.error(
    "Konfigurasi semakan pembayaran toyyibPay tidak lengkap."
  );

  return NextResponse.json(
    {
      error:
        "Perkhidmatan semakan pembayaran belum tersedia.",
    },
    { status: 503 }
  );
}

    // Baca data callback sebagai teks.
    // Pengesahan dengan toyyibPay belum dibuat.
    
const callbackBody = await request.text();

const callbackParams = new URLSearchParams(
  callbackBody
);

const billCode = callbackParams.get("billcode");

if (!billCode || !billCode.trim()) {
  return NextResponse.json(
    {
      error: "Bill Code tidak diterima.",
    },
    { status: 400 }
  );
}



const transactionParams = new URLSearchParams({
  billCode: billCode.trim(),
  userSecretKey: toyyibPaySecretKey,
});


const transactionRequestOptions: RequestInit = {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: transactionParams.toString(),
  cache: "no-store",
};

const transactionResponse = await fetch(
  toyyibPayStatusUrl,
  {
    ...transactionRequestOptions,
    signal: AbortSignal.timeout(10000),
  }
);

if (!transactionResponse.ok) {
  console.error(
    "Semakan transaksi toyyibPay gagal:",
    transactionResponse.status
  );

  return NextResponse.json(
    {
      error: "Gagal menyemak transaksi pembayaran.",
    },
    { status: 503 }
  );
}

const transactionData: unknown =
  await transactionResponse.json();

if (!Array.isArray(transactionData)) {
  console.error(
    "Format respons transaksi toyyibPay tidak sah."
  );

  return NextResponse.json(
    {
      error: "Respons semakan pembayaran tidak sah.",
    },
    { status: 503 }
  );
}

if (transactionData.length === 0) {
  console.error(
    "Tiada transaksi ditemui untuk Bill Code ini."
  );

  return NextResponse.json(
    {
      error: "Rekod transaksi pembayaran tidak ditemui.",
    },
    { status: 503 }
  );
}

const hasInvalidTransaction = transactionData.some(
  (item: unknown) =>
    item === null ||
    typeof item !== "object" ||
    Array.isArray(item)
);

if (hasInvalidTransaction) {
  console.error(
    "Struktur rekod transaksi toyyibPay tidak sah."
  );

  return NextResponse.json(
    {
      error: "Data transaksi pembayaran tidak sah.",
    },
    { status: 503 }
  );
}

const successfulTransactions =
  (transactionData as ToyyibPayTransaction[]).filter(
    (transaction) =>
      String(transaction.billpaymentStatus) === "1"
  );

if (successfulTransactions.length === 0) {
  return NextResponse.json(
    {
      error:
        "Pembayaran belum disahkan berjaya oleh toyyibPay.",
    },
    { status: 503 }
  );
}
const admin = createAdminClient();

const { data: payment, error: paymentError } =
  await admin
    .from("payments")
    .select(
      "id, order_id, provider_bill_code, external_reference, amount, status"
    )
    .eq("provider_bill_code", billCode.trim())
    .eq("provider", "toyyibpay")
    .maybeSingle();

if (paymentError || !payment) {
  console.error(
    "Rekod pembayaran tidak ditemui atau carian gagal.",
    paymentError?.code
  );

  return NextResponse.json(
    {
      error: "Rekod pembayaran tidak dapat disahkan.",
    },
    { status: 503 }
  );
}

if (
  typeof payment.external_reference !== "string" ||
  !payment.external_reference.trim()
) {
  console.error(
    "Rekod pembayaran tiada external_reference yang sah."
  );

  return NextResponse.json(
    {
      error: "Rujukan pembayaran tidak sah.",
    },
    { status: 503 }
  );
}

const matchingTransactions = successfulTransactions.filter(
  (transaction) =>
    typeof transaction.billExternalReferenceNo === "string" &&
    transaction.billExternalReferenceNo ===
      payment.external_reference
);

if (matchingTransactions.length === 0) {
  console.error(
    "Tiada transaksi berjaya dengan rujukan pembayaran yang sepadan."
  );

  return NextResponse.json(
    {
      error: "Rujukan transaksi pembayaran tidak sepadan.",
    },
    { status: 503 }
  );
}

const expectedAmount = Number(payment.amount);

if (
  !Number.isFinite(expectedAmount) ||
  expectedAmount <= 0
) {
  console.error(
    "Jumlah pembayaran dalam Supabase tidak sah."
  );

  return NextResponse.json(
    {
      error: "Jumlah pembayaran tidak sah.",
    },
    { status: 503 }
  );
}

const expectedAmountInSen = Math.round(
  expectedAmount * 100
);

if (
  !Number.isSafeInteger(expectedAmountInSen) ||
  expectedAmountInSen <= 0
) {
  console.error(
    "Jumlah pembayaran dalam sen tidak sah."
  );

  return NextResponse.json(
    {
      error: "Jumlah pembayaran dalam sen tidak sah.",
    },
    { status: 503 }
  );
}

if (
  Math.abs(
    expectedAmount * 100 - expectedAmountInSen
  ) > 0.000001
) {
  console.error(
    "Jumlah pembayaran mempunyai pecahan sen yang tidak sah."
  );

  return NextResponse.json(
    {
      error: "Ketepatan jumlah pembayaran tidak sah.",
    },
    { status: 503 }
  );
}

const hasMissingTransactionAmount =
  matchingTransactions.some(
    (transaction) =>
      transaction.billpaymentAmount === null ||
      transaction.billpaymentAmount === undefined ||
      String(transaction.billpaymentAmount).trim() === ""
  );

if (hasMissingTransactionAmount) {
  console.error(
    "Transaksi toyyibPay tiada jumlah pembayaran."
  );

  return NextResponse.json(
    {
      error: "Jumlah transaksi toyyibPay tidak lengkap.",
    },
    { status: 503 }
  );
}

const hasInvalidTransactionAmount =
  matchingTransactions.some((transaction) => {
    const amount = Number(transaction.billpaymentAmount);

    return (
      !Number.isFinite(amount) ||
      amount <= 0
    );
  });

if (hasInvalidTransactionAmount) {
  console.error(
    "Jumlah transaksi toyyibPay bukan nombor positif yang sah."
  );

  return NextResponse.json(
    {
      error: "Format jumlah transaksi tidak sah.",
    },
    { status: 503 }
  );
}


if (
  payment.status !== "creating" &&
  payment.status !== "pending" &&
  payment.status !== "paid"
) {

  console.error(
    "Status rekod pembayaran tidak sesuai untuk pengesahan."
  );

  return NextResponse.json(
    {
      error: "Status pembayaran tidak membenarkan pengesahan.",
    },
    { status: 503 }
  );
}

const { data: order, error: orderError } =
  await admin
    .from("orders")
    .select("id, total_amount, status")
    .eq("id", payment.order_id)
    .maybeSingle();

if (orderError || !order) {
  console.error(
    "Pesanan asal tidak ditemui atau carian gagal.",
    orderError?.code
  );

  return NextResponse.json(
    {
      error: "Pesanan asal tidak dapat disahkan.",
    },
    { status: 503 }
  );
}


if (
  order.status !== "pending" &&
  order.status !== "paid"
) {

  console.error(
    "Status pesanan tidak sesuai untuk pengesahan pembayaran."
  );

  return NextResponse.json(
    {
      error: "Status pesanan tidak membenarkan pengesahan.",
    },
    { status: 503 }
  );
}

    if (
      (payment.status === "paid" && order.status !== "paid") ||
      (order.status === "paid" && payment.status !== "paid")
    ) {
      console.error("Status pembayaran dan pesanan tidak konsisten.");

      return NextResponse.json(
        { error: "Status pembayaran perlu disemak." },
        { status: 503 }
      );
    }

const orderAmount = Number(order.total_amount);

if (
  !Number.isFinite(orderAmount) ||
  Math.abs(orderAmount - expectedAmount) > 0.000001
) {
  console.error(
    "Jumlah pesanan dan rekod pembayaran tidak sepadan."
  );

  return NextResponse.json(
    {
      error: "Jumlah pesanan tidak sepadan dengan pembayaran.",
    },
    { status: 503 }
  );
}

if (
  typeof payment.provider_bill_code !== "string" ||
  payment.provider_bill_code !== billCode.trim()
) {
  console.error(
    "Bill Code callback tidak sepadan dengan rekod pembayaran."
  );

  return NextResponse.json(
    {
      error: "Bill Code pembayaran tidak sepadan.",
    },
    { status: 503 }
  );
}


const hasExcessiveAmountDecimals =
  matchingTransactions.some((transaction) => {
    const amount = Number(transaction.billpaymentAmount);
    const roundedAmount = Math.round(amount * 100);

    return (
      !Number.isSafeInteger(roundedAmount) ||
      Math.abs(amount * 100 - roundedAmount) > 0.000001
    );
  });

if (hasExcessiveAmountDecimals) {
  console.error(
    "Ketepatan jumlah transaksi toyyibPay tidak sah."
  );

  return NextResponse.json(
    {
      error: "Ketepatan jumlah transaksi tidak sah.",
    },
    { status: 503 }
  );
}

const hasMatchingAmount = matchingTransactions.some(
  (transaction) => {
    const paidAmountInSen = Math.round(
      Number(transaction.billpaymentAmount) * 100
    );

    return paidAmountInSen === expectedAmountInSen;
  }
);

if (!hasMatchingAmount) {
  console.error(
    "Jumlah transaksi toyyibPay tidak sepadan dengan pesanan."
  );

  return NextResponse.json(
    {
      error: "Jumlah pembayaran tidak sepadan.",
    },
    { status: 503 }
  );
}

const verifiedTransaction = matchingTransactions.find(
  (transaction) => {
    const amount = Number(transaction.billpaymentAmount);

    return (
      Number.isFinite(amount) &&
      Number.isSafeInteger(Math.round(amount * 100)) &&
      Math.abs(
        amount * 100 - Math.round(amount * 100)
      ) <= 0.000001 &&
      Math.round(amount * 100) === expectedAmountInSen
    );
  }
);

if (!verifiedTransaction) {
  console.error(
    "Tiada transaksi yang memenuhi semua syarat pengesahan."
  );

  return NextResponse.json(
    {
      error: "Transaksi pembayaran tidak dapat disahkan.",
    },
    { status: 503 }
  );
}

const verifiedAmountInSen = Math.round(
  Number(verifiedTransaction.billpaymentAmount) * 100
);

if (verifiedAmountInSen !== expectedAmountInSen) {
  return NextResponse.json(
    { error: "Jumlah transaksi yang disahkan tidak sepadan." },
    { status: 503 }
  );
}

if (
  typeof payment.id !== "string" ||
  !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    payment.id
  )
) {
  return NextResponse.json(
    { error: "ID rekod pembayaran tidak sah." },
    { status: 503 }
  );
}

if (order.id !== payment.order_id) {
  console.error(
    "ID pesanan tidak sepadan dengan rekod pembayaran."
  );

  return NextResponse.json(
    { error: "Rujukan pesanan tidak sepadan." },
    { status: 503 }
  );
}

const verifiedPayment = {
  paymentId: payment.id,
  orderId: order.id,
  billCode: payment.provider_bill_code,
  externalReference: payment.external_reference,
  amountInSen: verifiedAmountInSen,
};

if (
  !verifiedPayment.paymentId ||
  !verifiedPayment.orderId ||
  !verifiedPayment.billCode ||
  !verifiedPayment.externalReference ||
  !Number.isSafeInteger(verifiedPayment.amountInSen) ||
  verifiedPayment.amountInSen <= 0
) {
  console.error(
    "Maklumat pengesahan pembayaran tidak lengkap."
  );

  return NextResponse.json(
    { error: "Maklumat pengesahan tidak lengkap." },
    { status: 503 }
  );
}

    const { data: finalized, error: finalizeError } = await admin.rpc(
      "finalize_verified_payment",
      {
        p_payment_id: verifiedPayment.paymentId,
        p_order_id: verifiedPayment.orderId,
        p_bill_code: verifiedPayment.billCode,
        p_external_reference: verifiedPayment.externalReference,
        p_amount: verifiedPayment.amountInSen / 100,
      }
    );

    if (finalizeError || finalized !== true) {
      console.error("Gagal memuktamadkan pembayaran.");

      return NextResponse.json(
        { error: "Pengesahan pembayaran belum dapat diselesaikan." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Pembayaran berjaya disahkan.",
      },
      { status: 200 }
    );

  } catch (error) {
    console.error(
      "Payment callback parsing error:",
      error
    );

    return NextResponse.json(
      {
        error: "Gagal membaca callback pembayaran.",
      },
      { status: 400 }
    );
  }
}

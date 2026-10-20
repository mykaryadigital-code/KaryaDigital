/**
 * @file toyyibpay.ts
 * Integrasi Gerbang Pembayaran Tempatan ToyyibPay (Malaysia FPX & E-Wallet).
 * Dokumentasi Rasmi API: https://toyyibpay.com/apidoc
 */

export interface CreateToyyibPayBillParams {
  orderId: string;
  bookTitle: string;
  amountMYR: number; // Dalam Ringgit Malaysia (contoh: 15.00)
  userName: string;
  userEmail: string;
  userPhone?: string;
  appBaseUrl: string;
}

export interface ToyyibPayBillResult {
  billCode: string;
  paymentUrl: string;
  isSandbox: boolean;
  orderId: string;
}

export interface ToyyibPayWebhookPayload {
  refno?: string;
  status_id?: string; // '1' = SUCCESS, '2' = PENDING, '3' = FAILED
  billcode?: string;
  order_id?: string;
  amount?: string;
  reason?: string;
  transaction_time?: string;
}

/**
 * Mendapatkan konfigurasi ToyyibPay daripada pembolehubah persekitaran (env).
 */
export function getToyyibPayConfig() {
  const secretKey = process.env.TOYYIBPAY_USER_SECRET_KEY || '';
  const categoryCode = process.env.TOYYIBPAY_CATEGORY_CODE || '';
  const isSandbox = process.env.TOYYIBPAY_IS_SANDBOX !== 'false'; // Lalai kepada sandbox jika tiada

  const baseUrl = isSandbox
    ? 'https://dev.toyyibpay.com'
    : 'https://toyyibpay.com';

  return {
    secretKey,
    categoryCode,
    isSandbox,
    baseUrl,
  };
}

/**
 * 1. Cipta Bil / Invois di ToyyibPay
 * Menghantar permohonan POST ke endpoint /index.php/api/createBill.
 * Sekiranya kunci belum diisi, sistem menyediakan mod simulasi Sandbox interaktif.
 */
export async function createToyyibPayBill(
  params: CreateToyyibPayBillParams
): Promise<ToyyibPayBillResult> {
  const config = getToyyibPayConfig();
  const { orderId, bookTitle, amountMYR, userName, userEmail, userPhone, appBaseUrl } = params;

  // Nilai amaun mesti ditukar kepada sen (Contoh: RM 15.00 = 1500 sen)
  const amountInCents = Math.round(amountMYR * 100);

  const callbackUrl = `${appBaseUrl}/api/payment/toyyibpay-callback`;
  const returnUrl = `${appBaseUrl}/api/payment/toyyibpay-return?order_id=${orderId}`;

  // Semak sama ada kunci API sebenar telah dibekalkan
  if (config.secretKey && config.categoryCode && config.secretKey !== 'your_toyyibpay_user_secret_key_here') {
    try {
      const formData = new URLSearchParams();
      formData.append('userSecretKey', config.secretKey);
      formData.append('categoryCode', config.categoryCode);
      formData.append('billName', `KaryaDigital: ${bookTitle.substring(0, 30)}`);
      formData.append('billDescription', `Pembelian e-buku tempatan ${bookTitle} oleh ${userName}`);
      formData.append('billPriceSetting', '1'); // 1 = Nilai tetap (Fixed Amount)
      formData.append('billPayorInfo', '1'); // 1 = Wajibkan maklumat pembeli
      formData.append('billAmount', amountInCents.toString());
      formData.append('billReturnUrl', returnUrl);
      formData.append('billCallbackUrl', callbackUrl);
      formData.append('billExternalReferenceNo', orderId);
      formData.append('billTo', userName || 'Pembaca Tempatan');
      formData.append('billEmail', userEmail || 'pembaca@karyadigital.my');
      formData.append('billPhone', userPhone || '0123456789');
      formData.append('billPaymentChannel', '0'); // 0 = Semua kaedah (FPX, kad, e-wallet)

      const response = await fetch(`${config.baseUrl}/index.php/api/createBill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const responseData = await response.json();
      console.log('[ToyyibPay API Respon]:', responseData);

      if (Array.isArray(responseData) && responseData.length > 0 && responseData[0].BillCode) {
        const billCode = responseData[0].BillCode;
        return {
          billCode,
          paymentUrl: `${config.baseUrl}/${billCode}`,
          isSandbox: config.isSandbox,
          orderId,
        };
      }
    } catch (error) {
      console.error('[ToyyibPay] Ralat sambungan API sebenar, beralih ke simulasi bil:', error);
    }
  }

  // Mod Simulasi Tempatan (Membolehkan ujian alur kerja FPX / ToyyibPay tanpa memerlukan akaun SSM rasmi dahulu)
  const simulatedBillCode = `BILL-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  const simulatedPaymentUrl = `${appBaseUrl}?payment_view=toyyibpay&bill_code=${simulatedBillCode}&order_id=${orderId}&amount=${amountMYR}`;

  return {
    billCode: simulatedBillCode,
    paymentUrl: simulatedPaymentUrl,
    isSandbox: true,
    orderId,
  };
}

/**
 * 2. Analisis & Sahkan Respon Webhook ToyyibPay
 * Mengesahkan sama ada transaksi pembayaran telah berjaya (status_id === '1').
 */
export function verifyToyyibPayCallback(payload: ToyyibPayWebhookPayload): {
  isSuccess: boolean;
  orderId: string;
  billCode: string;
  transactionRef: string;
  amount: number;
} {
  const isSuccess = payload.status_id === '1';
  const orderId = payload.order_id || '';
  const billCode = payload.billcode || '';
  const transactionRef = payload.refno || `TXN-${Date.now()}`;
  const amount = payload.amount ? parseFloat(payload.amount) : 0;

  return {
    isSuccess,
    orderId,
    billCode,
    transactionRef,
    amount,
  };
}

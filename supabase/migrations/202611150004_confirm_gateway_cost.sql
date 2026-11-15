BEGIN;

CREATE OR REPLACE FUNCTION public.confirm_gateway_cost(
  p_payment_id uuid,
  p_fee_amount numeric,
  p_evidence_reference text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_admin_id uuid;
  v_order_id uuid;
  v_payment public.payments%ROWTYPE;
  v_existing public.payment_gateway_costs%ROWTYPE;
  v_reference text;
  v_item_count bigint;
  v_updated_count bigint;
  v_gross numeric;
  v_before_fee numeric;
  v_fee_sen numeric;
BEGIN
  v_admin_id := auth.uid();

  IF v_admin_id IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = v_admin_id
      AND p.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Akses hanya untuk Admin.';
  END IF;

  IF p_fee_amount IS NULL THEN
    RAISE EXCEPTION 'Jumlah caj diperlukan.';
  END IF;

  IF NOT (
    p_fee_amount >= 0
    AND p_fee_amount < 'Infinity'::numeric
    AND p_fee_amount = round(p_fee_amount, 2)
  ) THEN
    RAISE EXCEPTION 'Jumlah caj tidak sah.';
  END IF;

  v_reference := trim(p_evidence_reference);

  IF v_reference IS NULL
     OR length(v_reference) NOT BETWEEN 1 AND 500 THEN
    RAISE EXCEPTION 'Rujukan bukti caj diperlukan.';
  END IF;

  SELECT order_id
  INTO v_order_id
  FROM public.payments
  WHERE id = p_payment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pembayaran tidak ditemui.';
  END IF;

  -- Urutan kunci sama seperti pengesahan pembayaran.
  PERFORM id
  FROM public.orders
  WHERE id = v_order_id
    AND status = 'paid'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pesanan belum dibayar.';
  END IF;

  SELECT *
  INTO v_payment
  FROM public.payments
  WHERE id = p_payment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pembayaran tidak ditemui.';
  END IF;

  IF v_payment.order_id IS DISTINCT FROM v_order_id
     OR v_payment.status IS DISTINCT FROM 'paid'
     OR v_payment.provider IS DISTINCT FROM 'toyyibpay' THEN
    RAISE EXCEPTION 'Rekod pembayaran tidak sesuai.';
  END IF;

  SELECT *
  INTO v_existing
  FROM public.payment_gateway_costs
  WHERE payment_id = p_payment_id;

  IF FOUND THEN
    IF v_existing.fee_amount = p_fee_amount
       AND v_existing.evidence_reference = v_reference THEN
      RETURN true;
    END IF;

    RAISE EXCEPTION
      'Caj sudah disahkan. Pembetulan memerlukan proses berasingan.';
  END IF;

  PERFORM id
  FROM public.seller_earnings
  WHERE payment_id = p_payment_id
  ORDER BY id
  FOR UPDATE;

  SELECT
    count(*),
    sum(gross_amount),
    sum(gross_amount - platform_commission)
  INTO v_item_count, v_gross, v_before_fee
  FROM public.seller_earnings
  WHERE payment_id = p_payment_id;

  IF v_item_count = 0
     OR v_gross IS DISTINCT FROM v_payment.amount THEN
    RAISE EXCEPTION
      'Rekod pendapatan tiada atau jumlah tidak sepadan.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.seller_earnings
    WHERE payment_id = p_payment_id
      AND (
        order_id IS DISTINCT FROM v_order_id
        OR gateway_fee IS NOT NULL
      )
  ) THEN
    RAISE EXCEPTION
      'Rekod pendapatan memerlukan semakan sebelum agihan caj.';
  END IF;

  IF p_fee_amount > v_before_fee THEN
    RAISE EXCEPTION
      'Caj melebihi pendapatan yang tersedia untuk diagihkan.';
  END IF;

  INSERT INTO public.payment_gateway_costs (
    payment_id,
    fee_amount,
    currency,
    evidence_reference,
    confirmed_by
  )
  VALUES (
    p_payment_id,
    p_fee_amount,
    'MYR',
    v_reference,
    v_admin_id
  );

  v_fee_sen := p_fee_amount * 100;

  WITH weights AS (
    SELECT
      id,
      gross_amount * 100 AS gross_sen
    FROM public.seller_earnings
    WHERE payment_id = p_payment_id
  ),
  portions AS (
    SELECT
      id,
      floor(
        v_fee_sen * gross_sen / (v_gross * 100)
      ) AS base_sen,
      mod(
        v_fee_sen * gross_sen,
        v_gross * 100
      ) AS remainder
    FROM weights
  ),
  ranked AS (
    SELECT
      id,
      base_sen,
      row_number() OVER (
        ORDER BY remainder DESC, id
      ) AS position,
      v_fee_sen - sum(base_sen) OVER () AS extra_sen
    FROM portions
  )
  UPDATE public.seller_earnings se
  SET gateway_fee = (
    ranked.base_sen +
    CASE
      WHEN ranked.position <= ranked.extra_sen THEN 1
      ELSE 0
    END
  ) / 100
  FROM ranked
  WHERE se.id = ranked.id;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  IF v_updated_count <> v_item_count THEN
    RAISE EXCEPTION 'Agihan caj tidak lengkap.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.seller_earnings
    WHERE payment_id = p_payment_id
      AND (net_amount IS NULL OR net_amount < 0)
  ) THEN
    RAISE EXCEPTION
      'Agihan menyebabkan pendapatan negatif. Semakan manual diperlukan.';
  END IF;

  IF (
    SELECT sum(gateway_fee)
    FROM public.seller_earnings
    WHERE payment_id = p_payment_id
  ) IS DISTINCT FROM p_fee_amount THEN
    RAISE EXCEPTION 'Jumlah agihan caj tidak sepadan.';
  END IF;

  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.confirm_gateway_cost(
  uuid, numeric, text
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.confirm_gateway_cost(
  uuid, numeric, text
) TO authenticated;

COMMIT;
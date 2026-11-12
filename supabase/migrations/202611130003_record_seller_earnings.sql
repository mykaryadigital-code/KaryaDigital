BEGIN;

CREATE OR REPLACE FUNCTION public.finalize_verified_payment(
  p_payment_id uuid,
  p_order_id uuid,
  p_bill_code text,
  p_external_reference text,
  p_amount numeric
)
RETURNS boolean
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
DECLARE
  v_payment public.payments%ROWTYPE;
  v_order public.orders%ROWTYPE;
  v_paid_at timestamptz;
  v_item_count bigint;
  v_ebook_count bigint;
  v_items_total numeric;
  v_inserted_count bigint;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT *
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  SELECT *
  INTO v_payment
  FROM public.payments
  WHERE id = p_payment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF nullif(trim(p_bill_code), '') IS NULL
     OR p_amount IS NULL
     OR p_amount <= 0
     OR nullif(trim(p_external_reference), '') IS NULL
     OR v_payment.order_id IS DISTINCT FROM v_order.id
     OR v_payment.provider IS DISTINCT FROM 'toyyibpay'
     OR v_payment.provider_bill_code IS DISTINCT FROM p_bill_code
     OR v_payment.external_reference IS DISTINCT FROM p_external_reference
     OR v_payment.amount IS DISTINCT FROM p_amount
     OR v_order.total_amount IS DISTINCT FROM p_amount THEN
    RETURN false;
  END IF;

  -- Callback berulang tidak mencipta pendapatan berganda.
  -- Jualan lama yang sudah paid juga tidak diisi semula.
  IF v_payment.status = 'paid'
     AND v_order.status = 'paid' THEN
    RETURN true;
  END IF;

  IF v_payment.status NOT IN ('creating', 'pending')
     OR v_order.status <> 'pending' THEN
    RETURN false;
  END IF;

  SELECT
    count(*),
    count(e.id),
    sum(oi.price_at_purchase)
  INTO
    v_item_count,
    v_ebook_count,
    v_items_total
  FROM public.order_items oi
  LEFT JOIN public.ebooks e
    ON e.id = oi.ebook_id
  WHERE oi.order_id = p_order_id;

  IF v_item_count = 0
     OR v_item_count <> v_ebook_count
     OR v_items_total IS DISTINCT FROM p_amount THEN
    RAISE EXCEPTION
      'Item pesanan tidak lengkap atau jumlah tidak sepadan';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.order_items oi
    WHERE oi.order_id = p_order_id
      AND (
        oi.price_at_purchase IS NULL
        OR oi.price_at_purchase < 0
        OR oi.price_at_purchase <>
           round(oi.price_at_purchase, 2)
      )
  ) THEN
    RAISE EXCEPTION 'Harga item pesanan tidak sah';
  END IF;

  v_paid_at := now();

  UPDATE public.payments
  SET
    status = 'paid',
    paid_at = v_paid_at,
    updated_at = v_paid_at
  WHERE id = p_payment_id;

  UPDATE public.orders
  SET
    status = 'paid',
    updated_at = v_paid_at
  WHERE id = p_order_id;

  INSERT INTO public.seller_earnings (
    order_item_id,
    order_id,
    payment_id,
    seller_id,
    ebook_id,
    ebook_title,
    paid_at,
    gross_amount,
    commission_rate,
    platform_commission,
    gateway_fee
  )
  SELECT
    oi.id,
    oi.order_id,
    p_payment_id,
    e.seller_id,
    e.id,
    e.title,
    v_paid_at,
    oi.price_at_purchase,
    0.1000,
    round(oi.price_at_purchase * 0.1000, 2),
    NULL
  FROM public.order_items oi
  JOIN public.ebooks e
    ON e.id = oi.ebook_id
  WHERE oi.order_id = p_order_id;

  GET DIAGNOSTICS v_inserted_count = ROW_COUNT;

  IF v_inserted_count <> v_item_count THEN
    RAISE EXCEPTION 'Rekod pendapatan tidak lengkap';
  END IF;

  RETURN true;
END;
$function$;

COMMIT;
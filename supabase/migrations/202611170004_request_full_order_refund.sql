BEGIN;

CREATE OR REPLACE FUNCTION public.request_full_order_refund(
  p_order_id uuid,
  p_reason text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_admin_id uuid;
  v_reason text;
  v_order public.orders%ROWTYPE;
  v_payment public.payments%ROWTYPE;
  v_existing public.order_refunds%ROWTYPE;
  v_payment_count bigint;
  v_refund_id uuid;
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

  v_reason := trim(p_reason);

  IF p_order_id IS NULL
     OR v_reason IS NULL
     OR length(v_reason) NOT BETWEEN 1 AND 1000 THEN
    RAISE EXCEPTION 'Pesanan dan sebab refund yang sah diperlukan.';
  END IF;

  -- Ikut urutan penyediaan payout:
  -- profil seller, pesanan, pembayaran, pendapatan.
  PERFORM p.id
  FROM public.profiles p
  WHERE EXISTS (
    SELECT 1
    FROM public.seller_earnings se
    WHERE se.order_id = p_order_id
      AND se.seller_id = p.id
  )
  ORDER BY p.id
  FOR UPDATE;

  SELECT *
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pesanan tidak ditemui.';
  END IF;

  SELECT *
  INTO v_existing
  FROM public.order_refunds
  WHERE order_id = p_order_id;

  IF FOUND THEN
    IF v_existing.status = 'requested'
       AND v_existing.reason = v_reason THEN
      RETURN v_existing.id;
    END IF;

    RAISE EXCEPTION
      'Pesanan sudah mempunyai rekod refund. Semak rekod sedia ada.';
  END IF;

  IF v_order.status IS DISTINCT FROM 'paid' THEN
    RAISE EXCEPTION 'Hanya pesanan berbayar boleh memohon refund.';
  END IF;

  SELECT count(*)
  INTO v_payment_count
  FROM public.payments
  WHERE order_id = p_order_id
    AND status = 'paid';

  IF v_payment_count <> 1 THEN
    RAISE EXCEPTION
      'Bilangan pembayaran berbayar memerlukan semakan manual.';
  END IF;

  SELECT *
  INTO v_payment
  FROM public.payments
  WHERE order_id = p_order_id
    AND status = 'paid'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pembayaran berbayar tidak ditemui.';
  END IF;

  IF v_payment.amount IS DISTINCT FROM v_order.total_amount
     OR v_payment.amount IS NULL
     OR NOT (
       v_payment.amount > 0
       AND v_payment.amount < 'Infinity'::numeric
       AND v_payment.amount = round(v_payment.amount, 2)
     ) THEN
    RAISE EXCEPTION 'Jumlah pembayaran tidak sah atau tidak sepadan.';
  END IF;

  PERFORM se.id
  FROM public.seller_earnings se
  WHERE se.order_id = p_order_id
  ORDER BY se.id
  FOR UPDATE;

  IF EXISTS (
    SELECT 1
    FROM public.seller_payout_items item
    JOIN public.seller_earnings se
      ON se.id = item.earning_id
    WHERE se.order_id = p_order_id
      AND item.released_at IS NULL
  ) THEN
    RAISE EXCEPTION
      'Pendapatan sudah ditempah dalam payout. Semakan payout diperlukan sebelum refund.';
  END IF;

  INSERT INTO public.order_refunds (
    order_id,
    payment_id,
    amount,
    reason,
    created_by
  )
  VALUES (
    v_order.id,
    v_payment.id,
    v_payment.amount,
    v_reason,
    v_admin_id
  )
  RETURNING id INTO v_refund_id;

  RETURN v_refund_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.request_full_order_refund(
  uuid, text
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.request_full_order_refund(
  uuid, text
) TO authenticated;

COMMIT;

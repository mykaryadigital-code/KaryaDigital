BEGIN;

-- Benarkan paid -> refunded hanya dengan rekod refund lengkap.
-- Status refunded tidak boleh ditukar semula.
CREATE OR REPLACE FUNCTION public.protect_paid_order_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
BEGIN
  IF OLD.status = 'refunded'
     AND NEW.status IS DISTINCT FROM 'refunded' THEN
    RAISE EXCEPTION 'Refunded order status cannot be changed';
  END IF;

  IF OLD.status = 'paid'
     AND NEW.status IS DISTINCT FROM 'paid' THEN
    IF NEW.status = 'refunded'
       AND EXISTS (
         SELECT 1
         FROM public.profiles p
         WHERE p.id = auth.uid()
           AND p.role = 'admin'
       )
       AND EXISTS (
         SELECT 1
         FROM public.order_refunds refund
         JOIN public.order_refund_costs cost
           ON cost.refund_id = refund.id
         WHERE refund.order_id = OLD.id
           AND refund.status = 'completed'
           AND refund.amount = OLD.total_amount
           AND (
             cost.seller_charge = 0
             OR (
               SELECT coalesce(sum(adjustment.amount), 0)
               FROM public.seller_refund_adjustments adjustment
               WHERE adjustment.refund_cost_id = cost.id
             ) = cost.seller_charge
           )
       ) THEN
      RETURN NEW;
    END IF;

    RAISE EXCEPTION 'Paid order status cannot be changed';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.complete_full_order_refund(
  p_refund_id uuid,
  p_amount numeric,
  p_refund_reference text,
  p_refunded_at timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_admin_id uuid;
  v_order_id uuid;
  v_order public.orders%ROWTYPE;
  v_payment public.payments%ROWTYPE;
  v_refund public.order_refunds%ROWTYPE;
  v_cost public.order_refund_costs%ROWTYPE;
  v_gateway_cost public.payment_gateway_costs%ROWTYPE;
  v_reference text;
  v_seller_id uuid;
  v_seller_count bigint;
  v_ledger_gross numeric;
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

  IF p_amount IS NULL OR NOT (
    p_amount > 0
    AND p_amount < 'Infinity'::numeric
    AND p_amount = round(p_amount, 2)
  ) THEN
    RAISE EXCEPTION 'Jumlah refund tidak sah.';
  END IF;

  v_reference := trim(p_refund_reference);

  IF v_reference IS NULL
     OR length(v_reference) NOT BETWEEN 1 AND 500 THEN
    RAISE EXCEPTION 'Rujukan pemulangan wang diperlukan.';
  END IF;

  IF p_refunded_at IS NULL THEN
    RAISE EXCEPTION 'Masa pemulangan wang diperlukan.';
  END IF;

  IF NOT isfinite(p_refunded_at)
     OR p_refunded_at > clock_timestamp() THEN
    RAISE EXCEPTION
      'Masa pemulangan wang tidak sah atau berada pada masa hadapan.';
  END IF;

  SELECT order_id
  INTO v_order_id
  FROM public.order_refunds
  WHERE id = p_refund_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rekod refund tidak ditemui.';
  END IF;

  -- Urutan kunci sejajar dengan penyediaan payout.
  PERFORM p.id
  FROM public.profiles p
  WHERE EXISTS (
    SELECT 1
    FROM public.seller_earnings se
    WHERE se.order_id = v_order_id
      AND se.seller_id = p.id
  )
  ORDER BY p.id
  FOR UPDATE;

  SELECT *
  INTO v_order
  FROM public.orders
  WHERE id = v_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pesanan tidak ditemui.';
  END IF;

  SELECT *
  INTO v_refund
  FROM public.order_refunds
  WHERE id = p_refund_id
  FOR UPDATE;

  IF NOT FOUND
     OR v_refund.order_id IS DISTINCT FROM v_order_id THEN
    RAISE EXCEPTION 'Rekod refund tidak sepadan.';
  END IF;

  SELECT *
  INTO v_payment
  FROM public.payments
  WHERE id = v_refund.payment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pembayaran asal tidak ditemui.';
  END IF;

  IF v_payment.status IS DISTINCT FROM 'paid'
     OR v_payment.paid_at IS NULL
     OR v_payment.order_id IS DISTINCT FROM v_order.id
     OR v_payment.amount IS DISTINCT FROM p_amount
     OR v_order.total_amount IS DISTINCT FROM p_amount
     OR v_refund.amount IS DISTINCT FROM p_amount THEN
    RAISE EXCEPTION
      'Jumlah refund penuh atau pembayaran asal tidak sepadan.';
  END IF;

  IF p_refunded_at < v_refund.created_at
     OR p_refunded_at < v_payment.paid_at THEN
    RAISE EXCEPTION
      'Masa refund tidak boleh sebelum permohonan atau pembayaran.';
  END IF;

  SELECT *
  INTO v_cost
  FROM public.order_refund_costs
  WHERE refund_id = v_refund.id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Keputusan tanggungan kos refund belum direkodkan.';
  END IF;

  SELECT *
  INTO v_gateway_cost
  FROM public.payment_gateway_costs
  WHERE id = v_cost.gateway_cost_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rekod caj gateway asal tidak ditemui.';
  END IF;

  IF v_gateway_cost.payment_id IS DISTINCT FROM v_payment.id
     OR v_gateway_cost.fee_amount IS DISTINCT FROM
        v_cost.original_gateway_fee THEN
    RAISE EXCEPTION 'Rekod kos refund tidak sepadan dengan pembayaran.';
  END IF;

  PERFORM se.id
  FROM public.seller_earnings se
  WHERE se.order_id = v_order.id
  ORDER BY se.id
  FOR UPDATE;

  IF EXISTS (
    SELECT 1
    FROM public.seller_payout_items item
    JOIN public.seller_earnings se
      ON se.id = item.earning_id
    WHERE se.order_id = v_order.id
      AND item.released_at IS NULL
  ) THEN
    RAISE EXCEPTION
      'Pendapatan sudah ditempah dalam payout. Refund memerlukan semakan berasingan.';
  END IF;

  IF v_cost.seller_charge > 0 THEN
    SELECT count(DISTINCT se.seller_id), sum(se.gross_amount)
    INTO v_seller_count, v_ledger_gross
    FROM public.seller_earnings se
    WHERE se.order_id = v_order.id
      AND se.payment_id = v_payment.id;

    IF v_seller_count <> 1
       OR v_ledger_gross IS DISTINCT FROM p_amount THEN
      RAISE EXCEPTION
        'Pemilik pendapatan untuk potongan refund tidak jelas.';
    END IF;

    SELECT se.seller_id
    INTO v_seller_id
    FROM public.seller_earnings se
    WHERE se.order_id = v_order.id
      AND se.payment_id = v_payment.id
    LIMIT 1;
  END IF;

  -- Ulangan sama tidak menulis semula rekod atau potongan.
  IF v_refund.status = 'completed' THEN
    IF v_order.status = 'refunded'
       AND v_refund.refund_reference = v_reference
       AND v_refund.refunded_at = p_refunded_at
       AND (
         (
           v_cost.seller_charge = 0
           AND NOT EXISTS (
             SELECT 1
             FROM public.seller_refund_adjustments adjustment
             WHERE adjustment.refund_cost_id = v_cost.id
           )
         )
         OR
         (
           v_cost.seller_charge > 0
           AND (
             SELECT count(*)
             FROM public.seller_refund_adjustments adjustment
             WHERE adjustment.refund_cost_id = v_cost.id
           ) = 1
           AND EXISTS (
             SELECT 1
             FROM public.seller_refund_adjustments adjustment
             WHERE adjustment.refund_cost_id = v_cost.id
               AND adjustment.seller_id = v_seller_id
               AND adjustment.amount = v_cost.seller_charge
           )
         )
       ) THEN
      RETURN true;
    END IF;

    RAISE EXCEPTION
      'Refund sudah selesai. Butiran asal tidak boleh diganti.';
  END IF;

  IF v_refund.status <> 'requested'
     OR v_order.status <> 'paid' THEN
    RAISE EXCEPTION
      'Hanya permohonan refund terbuka bagi pesanan paid boleh diselesaikan.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.seller_refund_adjustments adjustment
    WHERE adjustment.refund_cost_id = v_cost.id
  ) THEN
    RAISE EXCEPTION
      'Potongan refund sudah wujud sebelum penyelesaian. Semakan diperlukan.';
  END IF;

  UPDATE public.order_refunds
  SET
    status = 'completed',
    completed_by = v_admin_id,
    refunded_at = p_refunded_at,
    refund_reference = v_reference
  WHERE id = v_refund.id;

  IF v_cost.seller_charge > 0 THEN
    INSERT INTO public.seller_refund_adjustments (
      refund_cost_id,
      seller_id,
      amount
    )
    VALUES (
      v_cost.id,
      v_seller_id,
      v_cost.seller_charge
    );
  END IF;

  UPDATE public.orders
  SET
    status = 'refunded',
    updated_at = now()
  WHERE id = v_order.id;

  -- Pembayaran dan seller_earnings asal dikekalkan.
  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.complete_full_order_refund(
  uuid, numeric, text, timestamptz
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.complete_full_order_refund(
  uuid, numeric, text, timestamptz
) TO authenticated;

COMMIT;

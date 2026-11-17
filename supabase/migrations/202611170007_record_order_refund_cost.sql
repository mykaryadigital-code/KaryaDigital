BEGIN;

CREATE OR REPLACE FUNCTION public.record_order_refund_cost(
  p_refund_id uuid,
  p_gateway_fee_returned numeric,
  p_cost_bearer text,
  p_responsibility_reason text,
  p_evidence_reference text
)
RETURNS uuid
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
  v_cost public.payment_gateway_costs%ROWTYPE;
  v_existing public.order_refund_costs%ROWTYPE;
  v_reason text;
  v_evidence text;
  v_seller_count bigint;
  v_ledger_gross numeric;
  v_result_id uuid;
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

  IF p_gateway_fee_returned IS NULL OR NOT (
    p_gateway_fee_returned >= 0
    AND p_gateway_fee_returned < 'Infinity'::numeric
    AND p_gateway_fee_returned =
      round(p_gateway_fee_returned, 2)
  ) THEN
    RAISE EXCEPTION 'Jumlah caj yang dipulangkan tidak sah.';
  END IF;

  IF p_cost_bearer IS NULL
     OR p_cost_bearer NOT IN ('seller', 'platform') THEN
    RAISE EXCEPTION 'Pilih penanggung kos yang sah.';
  END IF;

  v_reason := trim(p_responsibility_reason);
  v_evidence := trim(p_evidence_reference);

  IF v_reason IS NULL
     OR length(v_reason) NOT BETWEEN 1 AND 1000
     OR v_evidence IS NULL
     OR length(v_evidence) NOT BETWEEN 1 AND 1000 THEN
    RAISE EXCEPTION 'Sebab tanggungan dan rujukan bukti diperlukan.';
  END IF;

  SELECT order_id
  INTO v_order_id
  FROM public.order_refunds
  WHERE id = p_refund_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rekod refund tidak ditemui.';
  END IF;

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

  IF v_refund.status <> 'requested'
     OR v_order.status <> 'paid' THEN
    RAISE EXCEPTION
      'Keputusan kos hanya boleh direkod bagi refund yang masih dimohon.';
  END IF;

  SELECT *
  INTO v_payment
  FROM public.payments
  WHERE id = v_refund.payment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pembayaran tidak ditemui.';
  END IF;

  IF v_payment.status <> 'paid'
     OR v_payment.order_id IS DISTINCT FROM v_order.id
     OR v_payment.amount IS DISTINCT FROM v_refund.amount
     OR v_order.total_amount IS DISTINCT FROM v_refund.amount THEN
    RAISE EXCEPTION 'Pembayaran dan jumlah refund tidak sepadan.';
  END IF;

  SELECT *
  INTO v_cost
  FROM public.payment_gateway_costs
  WHERE payment_id = v_payment.id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Caj gateway asal perlu disahkan sebelum keputusan kos refund.';
  END IF;

  IF p_gateway_fee_returned > v_cost.fee_amount THEN
    RAISE EXCEPTION
      'Caj dipulangkan tidak boleh melebihi caj asal.';
  END IF;

  SELECT *
  INTO v_existing
  FROM public.order_refund_costs
  WHERE refund_id = p_refund_id;

  IF FOUND THEN
    IF v_existing.gateway_cost_id = v_cost.id
       AND v_existing.original_gateway_fee = v_cost.fee_amount
       AND v_existing.gateway_fee_returned = p_gateway_fee_returned
       AND v_existing.cost_bearer = p_cost_bearer
       AND v_existing.responsibility_reason = v_reason
       AND v_existing.evidence_reference = v_evidence THEN
      RETURN v_existing.id;
    END IF;

    RAISE EXCEPTION
      'Keputusan kos sudah direkod. Pembetulan memerlukan proses berasingan.';
  END IF;

  -- Caj seller memerlukan pemilik pendapatan yang jelas.
  IF p_cost_bearer = 'seller'
     AND v_cost.fee_amount > p_gateway_fee_returned THEN
    SELECT count(DISTINCT se.seller_id), sum(se.gross_amount)
    INTO v_seller_count, v_ledger_gross
    FROM public.seller_earnings se
    WHERE se.payment_id = v_payment.id
      AND se.order_id = v_order.id;

    IF v_seller_count <> 1
       OR v_ledger_gross IS DISTINCT FROM v_payment.amount THEN
      RAISE EXCEPTION
        'Tanggungan seller memerlukan satu seller dan rekod pendapatan lengkap. Semakan berasingan diperlukan.';
    END IF;
  END IF;

  INSERT INTO public.order_refund_costs (
    refund_id,
    gateway_cost_id,
    original_gateway_fee,
    gateway_fee_returned,
    cost_bearer,
    responsibility_reason,
    evidence_reference,
    recorded_by
  )
  VALUES (
    v_refund.id,
    v_cost.id,
    v_cost.fee_amount,
    p_gateway_fee_returned,
    p_cost_bearer,
    v_reason,
    v_evidence,
    v_admin_id
  )
  RETURNING id INTO v_result_id;

  RETURN v_result_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.record_order_refund_cost(
  uuid, numeric, text, text, text
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.record_order_refund_cost(
  uuid, numeric, text, text, text
) TO authenticated;

COMMIT;

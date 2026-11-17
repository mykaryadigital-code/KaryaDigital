BEGIN;

CREATE OR REPLACE FUNCTION public.prepare_seller_payout(
  p_seller_id uuid,
  p_payout_month date,
  p_expected_bank_revision bigint
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_admin_id uuid;
  v_seller_role text;
  v_bank public.seller_bank_accounts%ROWTYPE;
  v_payout_id uuid;
  v_order_ids uuid[];
  v_earning_ids uuid[];
  v_adjustment_ids uuid[];
  v_earnings_total numeric;
  v_adjustments_total numeric;
  v_transfer_total numeric;
  v_inserted_count bigint;
  v_today date;
  v_cutoff timestamptz;
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

  IF p_seller_id IS NULL
     OR p_payout_month IS NULL
     OR NOT isfinite(p_payout_month)
     OR extract(day FROM p_payout_month) <> 1 THEN
    RAISE EXCEPTION
      'Seller dan bulan payout yang sah diperlukan.';
  END IF;

  v_today := (now() AT TIME ZONE 'Asia/Kuala_Lumpur')::date;

  IF p_payout_month + 6 > v_today THEN
    RAISE EXCEPTION
      'Tarikh payout belum tiba. Payout bermula pada 7 haribulan.';
  END IF;

  v_cutoff :=
    p_payout_month::timestamp
    AT TIME ZONE 'Asia/Kuala_Lumpur';

  SELECT role
  INTO v_seller_role
  FROM public.profiles
  WHERE id = p_seller_id
  FOR UPDATE;

  IF v_seller_role IS DISTINCT FROM 'seller' THEN
    RAISE EXCEPTION 'Penjual yang diluluskan tidak ditemui.';
  END IF;

  SELECT id
  INTO v_payout_id
  FROM public.seller_payouts
  WHERE seller_id = p_seller_id
    AND payout_month = p_payout_month
    AND status IN ('prepared', 'paid');

  IF FOUND THEN
    RETURN v_payout_id;
  END IF;

  SELECT *
  INTO v_bank
  FROM public.seller_bank_accounts
  WHERE seller_id = p_seller_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Penjual belum menyimpan butiran bank.';
  END IF;

  IF p_expected_bank_revision IS DISTINCT FROM v_bank.revision THEN
    RAISE EXCEPTION
      'Butiran bank telah berubah. Semak semula sebelum menyediakan payout.';
  END IF;

  -- Tetapkan senarai pesanan sebelum menguncinya.
  SELECT array_agg(candidate.order_id ORDER BY candidate.order_id)
  INTO v_order_ids
  FROM (
    SELECT DISTINCT se.order_id
    FROM public.seller_earnings se
    JOIN public.orders o ON o.id = se.order_id
    JOIN public.payments payment
      ON payment.id = se.payment_id
      AND payment.order_id = o.id
    JOIN public.payment_gateway_costs cost
      ON cost.payment_id = payment.id
    WHERE se.seller_id = p_seller_id
      AND se.paid_at < v_cutoff
      AND o.status = 'paid'
      AND payment.status = 'paid'
      AND se.gateway_fee IS NOT NULL
      AND se.net_amount IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.order_refunds refund
        WHERE refund.order_id = o.id
          AND refund.status IN ('requested', 'completed')
      )
      AND NOT EXISTS (
        SELECT 1
        FROM public.seller_payout_items item
        WHERE item.earning_id = se.id
          AND item.released_at IS NULL
      )
  ) candidate;

  PERFORM o.id
  FROM public.orders o
  WHERE o.id = ANY(v_order_ids)
  ORDER BY o.id
  FOR UPDATE;

  -- Semak semula selepas kunci diperoleh.
  SELECT array_agg(eligible.id ORDER BY eligible.id)
  INTO v_earning_ids
  FROM (
    SELECT se.id
    FROM public.seller_earnings se
    JOIN public.orders o ON o.id = se.order_id
    JOIN public.payments payment
      ON payment.id = se.payment_id
      AND payment.order_id = o.id
    JOIN public.payment_gateway_costs cost
      ON cost.payment_id = payment.id
    WHERE se.seller_id = p_seller_id
      AND se.order_id = ANY(v_order_ids)
      AND se.paid_at < v_cutoff
      AND o.status = 'paid'
      AND payment.status = 'paid'
      AND se.gateway_fee IS NOT NULL
      AND se.net_amount IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.order_refunds refund
        WHERE refund.order_id = o.id
          AND refund.status IN ('requested', 'completed')
      )
      AND NOT EXISTS (
        SELECT 1
        FROM public.seller_payout_items item
        WHERE item.earning_id = se.id
          AND item.released_at IS NULL
      )
    ORDER BY se.id
    FOR UPDATE OF se
  ) eligible;

  IF v_earning_ids IS NULL THEN
    RAISE EXCEPTION
      'Tiada pendapatan layak untuk payout bulan ini.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.seller_earnings
    WHERE id = ANY(v_earning_ids)
      AND net_amount < 0
  ) THEN
    RAISE EXCEPTION
      'Pendapatan negatif memerlukan semakan sebelum payout.';
  END IF;

  -- Potongan sebelum bulan payout sahaja.
  -- Refund mesti benar-benar selesai.
  SELECT array_agg(eligible.id ORDER BY eligible.id)
  INTO v_adjustment_ids
  FROM (
    SELECT adjustment.id
    FROM public.seller_refund_adjustments adjustment
    JOIN public.order_refund_costs cost
      ON cost.id = adjustment.refund_cost_id
    JOIN public.order_refunds refund
      ON refund.id = cost.refund_id
    WHERE adjustment.seller_id = p_seller_id
      AND adjustment.created_at < v_cutoff
      AND refund.status = 'completed'
      AND NOT EXISTS (
        SELECT 1
        FROM public.seller_payout_adjustments reserved
        WHERE reserved.adjustment_id = adjustment.id
          AND reserved.released_at IS NULL
      )
    ORDER BY adjustment.id
    FOR UPDATE OF adjustment
  ) eligible;

  SELECT coalesce(sum(net_amount), 0)
  INTO v_earnings_total
  FROM public.seller_earnings
  WHERE id = ANY(v_earning_ids);

  SELECT coalesce(sum(amount), 0)
  INTO v_adjustments_total
  FROM public.seller_refund_adjustments
  WHERE id = ANY(v_adjustment_ids);

  v_transfer_total :=
    v_earnings_total - v_adjustments_total;

  IF NOT (
    v_transfer_total >= 20
    AND v_transfer_total < 'Infinity'::numeric
  ) THEN
    RAISE EXCEPTION
      'Baki selepas potongan belum mencapai minimum RM20. Baki dan potongan dibawa ke bulan seterusnya.';
  END IF;

  INSERT INTO public.seller_payouts (
    seller_id,
    payout_month,
    amount,
    status,
    bank_name,
    account_holder_name,
    account_number,
    bank_revision,
    prepared_by
  )
  VALUES (
    p_seller_id,
    p_payout_month,
    v_transfer_total,
    'prepared',
    v_bank.bank_name,
    v_bank.account_holder_name,
    v_bank.account_number,
    v_bank.revision,
    v_admin_id
  )
  RETURNING id INTO v_payout_id;

  INSERT INTO public.seller_payout_items (
    payout_id,
    earning_id,
    gross_amount,
    platform_commission,
    gateway_fee,
    net_amount
  )
  SELECT
    v_payout_id,
    se.id,
    se.gross_amount,
    se.platform_commission,
    se.gateway_fee,
    se.net_amount
  FROM public.seller_earnings se
  WHERE se.id = ANY(v_earning_ids);

  GET DIAGNOSTICS v_inserted_count = ROW_COUNT;

  IF v_inserted_count <> cardinality(v_earning_ids) THEN
    RAISE EXCEPTION 'Item payout tidak lengkap.';
  END IF;

  INSERT INTO public.seller_payout_adjustments (
    payout_id,
    adjustment_id,
    amount
  )
  SELECT
    v_payout_id,
    adjustment.id,
    adjustment.amount
  FROM public.seller_refund_adjustments adjustment
  WHERE adjustment.id = ANY(v_adjustment_ids);

  GET DIAGNOSTICS v_inserted_count = ROW_COUNT;

  IF v_inserted_count <>
     coalesce(cardinality(v_adjustment_ids), 0) THEN
    RAISE EXCEPTION 'Potongan payout tidak lengkap.';
  END IF;

  IF (
    (
      SELECT coalesce(sum(net_amount), 0)
      FROM public.seller_payout_items
      WHERE payout_id = v_payout_id
    )
    -
    (
      SELECT coalesce(sum(amount), 0)
      FROM public.seller_payout_adjustments
      WHERE payout_id = v_payout_id
    )
  ) IS DISTINCT FROM v_transfer_total THEN
    RAISE EXCEPTION 'Jumlah akhir payout tidak sepadan.';
  END IF;

  RETURN v_payout_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.prepare_seller_payout(
  uuid, date, bigint
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.prepare_seller_payout(
  uuid, date, bigint
) TO authenticated;

COMMIT;

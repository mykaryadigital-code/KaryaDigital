BEGIN;

CREATE OR REPLACE FUNCTION public.get_admin_payout_candidates_v2(
  p_payout_month date,
  p_limit integer DEFAULT 25,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  seller_id uuid,
  seller_name text,
  bank_name text,
  account_holder_name text,
  account_last_four text,
  bank_revision bigint,
  eligible_items bigint,
  eligible_amount numeric,
  unconfirmed_items bigint,
  has_negative_earnings boolean,
  existing_payout_id uuid,
  existing_payout_status text,
  existing_payout_amount numeric,
  earnings_before_adjustments numeric,
  refund_deductions numeric,
  refund_held_amount numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_cutoff timestamptz;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Akses hanya untuk Admin.';
  END IF;

  IF p_payout_month IS NULL
     OR NOT isfinite(p_payout_month)
     OR extract(day FROM p_payout_month) <> 1 THEN
    RAISE EXCEPTION 'Bulan payout tidak sah.';
  END IF;

  IF p_limit IS NULL
     OR p_limit NOT BETWEEN 1 AND 100
     OR p_offset IS NULL
     OR p_offset < 0 THEN
    RAISE EXCEPTION 'Parameter halaman tidak sah.';
  END IF;

  v_cutoff :=
    p_payout_month::timestamp
    AT TIME ZONE 'Asia/Kuala_Lumpur';

  RETURN QUERY
  WITH available_earnings AS (
    SELECT
      se.seller_id,
      se.net_amount,
      (
        cost.id IS NOT NULL
        AND se.gateway_fee IS NOT NULL
        AND se.net_amount IS NOT NULL
      ) AS fee_confirmed,
      EXISTS (
        SELECT 1
        FROM public.order_refunds refund
        WHERE refund.order_id = o.id
          AND refund.status = 'requested'
      ) AS refund_pending
    FROM public.seller_earnings se
    JOIN public.orders o
      ON o.id = se.order_id
      AND o.status = 'paid'
    JOIN public.payments payment
      ON payment.id = se.payment_id
      AND payment.order_id = o.id
      AND payment.status = 'paid'
    LEFT JOIN public.payment_gateway_costs cost
      ON cost.payment_id = payment.id
    WHERE se.paid_at < v_cutoff
      AND NOT EXISTS (
        SELECT 1
        FROM public.order_refunds refund
        WHERE refund.order_id = o.id
          AND refund.status = 'completed'
      )
      AND NOT EXISTS (
        SELECT 1
        FROM public.seller_payout_items item
        WHERE item.earning_id = se.id
          AND item.released_at IS NULL
      )
  ),
  earnings_totals AS (
    SELECT
      e.seller_id,
      count(*) FILTER (
        WHERE e.fee_confirmed AND NOT e.refund_pending
      ) AS eligible_count,
      coalesce(
        sum(e.net_amount) FILTER (
          WHERE e.fee_confirmed AND NOT e.refund_pending
        ),
        0
      ) AS available_net,
      count(*) FILTER (
        WHERE NOT e.fee_confirmed AND NOT e.refund_pending
      ) AS unconfirmed_count,
      coalesce(
        bool_or(e.net_amount < 0) FILTER (
          WHERE e.fee_confirmed AND NOT e.refund_pending
        ),
        false
      ) AS negative_earnings,
      coalesce(
        sum(e.net_amount) FILTER (
          WHERE e.fee_confirmed AND e.refund_pending
        ),
        0
      ) AS held_net
    FROM available_earnings e
    GROUP BY e.seller_id
  ),
  adjustment_totals AS (
    SELECT
      adjustment.seller_id,
      sum(adjustment.amount) AS deduction
    FROM public.seller_refund_adjustments adjustment
    JOIN public.order_refund_costs cost
      ON cost.id = adjustment.refund_cost_id
    JOIN public.order_refunds refund
      ON refund.id = cost.refund_id
      AND refund.status = 'completed'
    WHERE adjustment.created_at < v_cutoff
      AND NOT EXISTS (
        SELECT 1
        FROM public.seller_payout_adjustments reserved
        WHERE reserved.adjustment_id = adjustment.id
          AND reserved.released_at IS NULL
      )
    GROUP BY adjustment.seller_id
  )
  SELECT
    profile.id,
    coalesce(
      nullif(trim(profile.full_name), ''),
      'Penjual tanpa nama'
    )::text,
    bank.bank_name,
    bank.account_holder_name,
    right(bank.account_number, 4)::text,
    bank.revision,
    coalesce(earnings.eligible_count, 0)::bigint,
    (
      coalesce(earnings.available_net, 0)
      - coalesce(adjustments.deduction, 0)
    )::numeric,
    coalesce(earnings.unconfirmed_count, 0)::bigint,
    coalesce(earnings.negative_earnings, false),
    payout.id,
    payout.status,
    payout.amount,
    coalesce(earnings.available_net, 0)::numeric,
    coalesce(adjustments.deduction, 0)::numeric,
    coalesce(earnings.held_net, 0)::numeric
  FROM public.profiles profile
  LEFT JOIN public.seller_bank_accounts bank
    ON bank.seller_id = profile.id
  LEFT JOIN earnings_totals earnings
    ON earnings.seller_id = profile.id
  LEFT JOIN adjustment_totals adjustments
    ON adjustments.seller_id = profile.id
  LEFT JOIN public.seller_payouts payout
    ON payout.seller_id = profile.id
    AND payout.payout_month = p_payout_month
    AND payout.status IN ('prepared', 'paid')
  WHERE profile.role = 'seller'
  ORDER BY profile.id
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_admin_payout_candidates_v2(
  date, integer, integer
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_admin_payout_candidates_v2(
  date, integer, integer
) TO authenticated;

COMMIT;

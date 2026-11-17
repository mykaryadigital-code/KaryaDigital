BEGIN;

CREATE OR REPLACE FUNCTION public.get_seller_earnings_summary_v2()
RETURNS TABLE (
  recorded_items bigint,
  gross_amount numeric,
  platform_commission numeric,
  confirmed_gateway_fee numeric,
  unconfirmed_items bigint,
  confirmed_net_amount numeric,
  unreserved_net_amount numeric,
  prepared_payout_amount numeric,
  paid_payout_amount numeric,
  refund_charges_total numeric,
  refund_charges_unreserved numeric,
  refund_held_amount numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_seller_id uuid;
BEGIN
  v_seller_id := auth.uid();

  IF v_seller_id IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = v_seller_id
      AND p.role = 'seller'
  ) THEN
    RAISE EXCEPTION
      'Akses hanya untuk penjual yang diluluskan.';
  END IF;

  RETURN QUERY
  WITH earnings AS (
    SELECT
      se.id,
      se.gross_amount,
      se.platform_commission,
      se.gateway_fee,
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
      ) AS refund_pending,
      EXISTS (
        SELECT 1
        FROM public.seller_payout_items item
        WHERE item.earning_id = se.id
          AND item.released_at IS NULL
      ) AS reserved
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
    WHERE se.seller_id = v_seller_id
      AND NOT EXISTS (
        SELECT 1
        FROM public.order_refunds refund
        WHERE refund.order_id = o.id
          AND refund.status = 'completed'
      )
  ),
  earning_totals AS (
    SELECT
      count(*) AS item_count,
      coalesce(sum(e.gross_amount), 0) AS gross,
      coalesce(sum(e.platform_commission), 0) AS commission,
      coalesce(
        sum(e.gateway_fee) FILTER (WHERE e.fee_confirmed),
        0
      ) AS fees,
      count(*) FILTER (
        WHERE NOT e.fee_confirmed
      ) AS unconfirmed,
      coalesce(
        sum(e.net_amount) FILTER (WHERE e.fee_confirmed),
        0
      ) AS confirmed_net,
      coalesce(
        sum(e.net_amount) FILTER (
          WHERE e.fee_confirmed
            AND NOT e.reserved
            AND NOT e.refund_pending
        ),
        0
      ) AS unreserved_net,
      coalesce(
        sum(e.net_amount) FILTER (
          WHERE e.fee_confirmed
            AND e.refund_pending
            AND NOT e.reserved
        ),
        0
      ) AS held_net
    FROM earnings e
  ),
  adjustments AS (
    SELECT
      adjustment.amount,
      EXISTS (
        SELECT 1
        FROM public.seller_payout_adjustments reserved
        WHERE reserved.adjustment_id = adjustment.id
          AND reserved.released_at IS NULL
      ) AS reserved
    FROM public.seller_refund_adjustments adjustment
    JOIN public.order_refund_costs cost
      ON cost.id = adjustment.refund_cost_id
    JOIN public.order_refunds refund
      ON refund.id = cost.refund_id
      AND refund.status = 'completed'
    WHERE adjustment.seller_id = v_seller_id
  ),
  adjustment_totals AS (
    SELECT
      coalesce(sum(a.amount), 0) AS total_charge,
      coalesce(
        sum(a.amount) FILTER (WHERE NOT a.reserved),
        0
      ) AS unreserved_charge
    FROM adjustments a
  ),
  payout_totals AS (
    SELECT
      coalesce(
        sum(p.amount) FILTER (WHERE p.status = 'prepared'),
        0
      ) AS prepared_amount,
      coalesce(
        sum(p.amount) FILTER (WHERE p.status = 'paid'),
        0
      ) AS paid_amount
    FROM public.seller_payouts p
    WHERE p.seller_id = v_seller_id
  )
  SELECT
    e.item_count,
    e.gross,
    e.commission,
    e.fees,
    e.unconfirmed,
    e.confirmed_net - a.total_charge,
    e.unreserved_net - a.unreserved_charge,
    p.prepared_amount,
    p.paid_amount,
    a.total_charge,
    a.unreserved_charge,
    e.held_net
  FROM earning_totals e
  CROSS JOIN adjustment_totals a
  CROSS JOIN payout_totals p;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_seller_earnings_summary_v2()
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_seller_earnings_summary_v2()
TO authenticated;

COMMIT;

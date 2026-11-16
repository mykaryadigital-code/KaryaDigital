BEGIN;

CREATE OR REPLACE FUNCTION public.get_admin_gateway_costs(
  p_limit integer DEFAULT 25,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  payment_id uuid,
  order_id uuid,
  bill_code text,
  payment_amount numeric,
  paid_at timestamptz,
  item_count bigint,
  gross_total numeric,
  commission_total numeric,
  allocated_fee_total numeric,
  net_total numeric,
  confirmed_fee numeric,
  evidence_reference text,
  confirmed_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.profiles profile
    WHERE profile.id = auth.uid()
      AND profile.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Akses hanya untuk Admin.';
  END IF;

  IF p_limit IS NULL
     OR p_limit < 1
     OR p_limit > 100
     OR p_offset IS NULL
     OR p_offset < 0 THEN
    RAISE EXCEPTION 'Parameter halaman tidak sah.';
  END IF;

  RETURN QUERY
  WITH earnings AS (
    SELECT
      se.payment_id AS earnings_payment_id,
      count(*) AS item_count,
      sum(se.gross_amount) AS gross_total,
      sum(se.platform_commission) AS commission_total,

      -- Jangan tunjuk jumlah separa sebagai jumlah lengkap.
      CASE
        WHEN count(se.gateway_fee) = count(*)
        THEN sum(se.gateway_fee)
        ELSE NULL
      END AS allocated_fee_total,

      CASE
        WHEN count(se.net_amount) = count(*)
        THEN sum(se.net_amount)
        ELSE NULL
      END AS net_total

    FROM public.seller_earnings se
    GROUP BY se.payment_id
  )
  SELECT
    payment.id,
    payment.order_id,
    payment.provider_bill_code::text,
    payment.amount,
    payment.paid_at,
    earnings.item_count,
    earnings.gross_total,
    earnings.commission_total,
    earnings.allocated_fee_total,
    earnings.net_total,
    cost.fee_amount,
    cost.evidence_reference,
    cost.confirmed_at

  FROM public.payments payment

  JOIN public.orders orders
    ON orders.id = payment.order_id

  JOIN earnings
    ON earnings.earnings_payment_id = payment.id

  LEFT JOIN public.payment_gateway_costs cost
    ON cost.payment_id = payment.id

  WHERE payment.provider = 'toyyibpay'
    AND payment.status = 'paid'
    AND orders.status = 'paid'

  ORDER BY
    payment.paid_at DESC NULLS LAST,
    payment.id DESC

  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_admin_gateway_costs(
  integer, integer
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_admin_gateway_costs(
  integer, integer
) TO authenticated;

COMMIT;
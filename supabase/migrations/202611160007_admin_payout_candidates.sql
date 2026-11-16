BEGIN;

CREATE OR REPLACE FUNCTION public.get_admin_payout_candidates(
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
  existing_payout_amount numeric
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
  WITH outstanding AS (
    SELECT
      se.seller_id,

      count(*) FILTER (
        WHERE cost.id IS NOT NULL
          AND se.gateway_fee IS NOT NULL
          AND se.net_amount IS NOT NULL
      ) AS eligible_items,

      coalesce(
        sum(se.net_amount) FILTER (
          WHERE cost.id IS NOT NULL
            AND se.gateway_fee IS NOT NULL
            AND se.net_amount IS NOT NULL
        ),
        0
      ) AS eligible_amount,

      count(*) FILTER (
        WHERE cost.id IS NULL
          OR se.gateway_fee IS NULL
          OR se.net_amount IS NULL
      ) AS unconfirmed_items,

      coalesce(
        bool_or(se.net_amount < 0) FILTER (
          WHERE cost.id IS NOT NULL
            AND se.gateway_fee IS NOT NULL
            AND se.net_amount IS NOT NULL
        ),
        false
      ) AS has_negative_earnings

    FROM public.seller_earnings se

    JOIN public.orders orders
      ON orders.id = se.order_id
      AND orders.status = 'paid'

    JOIN public.payments payment
      ON payment.id = se.payment_id
      AND payment.order_id = orders.id
      AND payment.status = 'paid'

    LEFT JOIN public.payment_gateway_costs cost
      ON cost.payment_id = payment.id

    WHERE se.paid_at < v_cutoff
      AND NOT EXISTS (
        SELECT 1
        FROM public.seller_payout_items item
        WHERE item.earning_id = se.id
          AND item.released_at IS NULL
      )

    GROUP BY se.seller_id
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
    coalesce(outstanding.eligible_items, 0)::bigint,
    coalesce(outstanding.eligible_amount, 0)::numeric,
    coalesce(outstanding.unconfirmed_items, 0)::bigint,
    coalesce(outstanding.has_negative_earnings, false),
    payout.id,
    payout.status,
    payout.amount

  FROM public.profiles profile

  LEFT JOIN public.seller_bank_accounts bank
    ON bank.seller_id = profile.id

  LEFT JOIN outstanding
    ON outstanding.seller_id = profile.id

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

REVOKE ALL ON FUNCTION public.get_admin_payout_candidates(
  date, integer, integer
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_admin_payout_candidates(
  date, integer, integer
) TO authenticated;

COMMIT;

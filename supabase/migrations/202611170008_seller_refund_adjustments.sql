BEGIN;

CREATE TABLE public.seller_refund_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  refund_cost_id uuid NOT NULL
    REFERENCES public.order_refund_costs(id),

  seller_id uuid NOT NULL
    REFERENCES public.profiles(id),

  -- Amaun positif ialah kos yang perlu ditolak
  -- daripada pendapatan seller.
  amount numeric(14, 2) NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT seller_refund_adjustment_amount_valid
    CHECK (
      amount > 0
      AND amount < 'Infinity'::numeric
    ),

  -- Elakkan kos refund yang sama dikenakan dua kali.
  CONSTRAINT seller_refund_adjustment_unique
    UNIQUE (refund_cost_id, seller_id)
);

CREATE INDEX seller_refund_adjustments_seller_idx
ON public.seller_refund_adjustments (seller_id, created_at);

ALTER TABLE public.seller_refund_adjustments
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.seller_refund_adjustments
  FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE public.seller_refund_adjustments
  TO authenticated;

GRANT ALL ON TABLE public.seller_refund_adjustments
  TO service_role;

CREATE POLICY seller_reads_own_refund_adjustments
ON public.seller_refund_adjustments
FOR SELECT
TO authenticated
USING (
  seller_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role = 'seller'
  )
);

CREATE POLICY admin_reads_refund_adjustments
ON public.seller_refund_adjustments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role = 'admin'
  )
);

COMMIT;

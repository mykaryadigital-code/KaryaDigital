BEGIN;

CREATE TABLE public.seller_payout_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  payout_id uuid NOT NULL
    REFERENCES public.seller_payouts(id),

  adjustment_id uuid NOT NULL
    REFERENCES public.seller_refund_adjustments(id),

  -- Salinan amaun potongan ketika payout disediakan.
  amount numeric(14, 2) NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  -- Diisi apabila payout dibatalkan.
  released_at timestamptz,

  CONSTRAINT seller_payout_adjustment_amount_valid
    CHECK (
      amount > 0
      AND amount < 'Infinity'::numeric
    ),

  CONSTRAINT seller_payout_adjustment_pair_unique
    UNIQUE (payout_id, adjustment_id)
);

-- Satu potongan hanya boleh ditempah dalam satu payout aktif.
CREATE UNIQUE INDEX seller_payout_adjustment_active_unique
ON public.seller_payout_adjustments (adjustment_id)
WHERE released_at IS NULL;

ALTER TABLE public.seller_payout_adjustments
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.seller_payout_adjustments
  FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE public.seller_payout_adjustments
  TO authenticated;

GRANT ALL ON TABLE public.seller_payout_adjustments
  TO service_role;

CREATE POLICY admin_reads_payout_adjustments
ON public.seller_payout_adjustments
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

CREATE POLICY seller_reads_own_payout_adjustments
ON public.seller_payout_adjustments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.seller_payouts payout
    JOIN public.profiles profile
      ON profile.id = payout.seller_id
    WHERE payout.id = seller_payout_adjustments.payout_id
      AND payout.seller_id = (SELECT auth.uid())
      AND profile.role = 'seller'
  )
);

COMMIT;

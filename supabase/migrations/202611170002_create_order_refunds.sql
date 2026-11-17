BEGIN;

CREATE TABLE public.order_refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Satu proses refund penuh bagi setiap pesanan.
  order_id uuid NOT NULL UNIQUE
    REFERENCES public.orders(id),

  payment_id uuid NOT NULL UNIQUE
    REFERENCES public.payments(id),

  amount numeric(14, 2) NOT NULL,

  reason text NOT NULL,

  status text NOT NULL DEFAULT 'requested',

  created_by uuid NOT NULL
    REFERENCES public.profiles(id),

  created_at timestamptz NOT NULL DEFAULT now(),

  completed_by uuid
    REFERENCES public.profiles(id),

  -- Masa pemulangan wang benar-benar dibuat.
  refunded_at timestamptz,

  refund_reference text,

  closed_by uuid
    REFERENCES public.profiles(id),

  closed_at timestamptz,

  closure_reason text,

  CONSTRAINT order_refund_amount_valid
    CHECK (
      amount > 0
      AND amount < 'Infinity'::numeric
    ),

  CONSTRAINT order_refund_reason_valid
    CHECK (
      length(trim(reason)) BETWEEN 1 AND 1000
    ),

  CONSTRAINT order_refund_status_valid
    CHECK (
      status IN ('requested', 'completed', 'cancelled')
    ),

  CONSTRAINT order_refund_state_valid
    CHECK (
      (
        status = 'requested'
        AND completed_by IS NULL
        AND refunded_at IS NULL
        AND refund_reference IS NULL
        AND closed_by IS NULL
        AND closed_at IS NULL
        AND closure_reason IS NULL
      )
      OR
      (
        status = 'completed'
        AND completed_by IS NOT NULL
        AND refunded_at IS NOT NULL
        AND isfinite(refunded_at)
        AND refund_reference IS NOT NULL
        AND length(trim(refund_reference)) BETWEEN 1 AND 500
        AND closed_by IS NULL
        AND closed_at IS NULL
        AND closure_reason IS NULL
      )
      OR
      (
        status = 'cancelled'
        AND completed_by IS NULL
        AND refunded_at IS NULL
        AND refund_reference IS NULL
        AND closed_by IS NOT NULL
        AND closed_at IS NOT NULL
        AND closure_reason IS NOT NULL
        AND length(trim(closure_reason)) BETWEEN 1 AND 1000
      )
    )
);

ALTER TABLE public.order_refunds
  ENABLE ROW LEVEL SECURITY;

-- Permohonan dan perubahan status akan melalui fungsi terkawal.
REVOKE ALL ON TABLE public.order_refunds
  FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE public.order_refunds
  TO authenticated;

GRANT ALL ON TABLE public.order_refunds
  TO service_role;

CREATE POLICY admin_reads_order_refunds
ON public.order_refunds
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

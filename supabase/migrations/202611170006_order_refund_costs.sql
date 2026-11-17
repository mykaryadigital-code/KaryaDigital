BEGIN;

CREATE TABLE public.order_refund_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Satu keputusan kos bagi setiap refund penuh.
  refund_id uuid NOT NULL UNIQUE
    REFERENCES public.order_refunds(id),

  -- Rujukan kepada caj pembayaran yang telah disahkan.
  gateway_cost_id uuid NOT NULL UNIQUE
    REFERENCES public.payment_gateway_costs(id),

  -- Salinan caj asal ketika keputusan refund direkodkan.
  original_gateway_fee numeric(14, 2) NOT NULL,

  -- Jumlah caj asal yang dipulangkan oleh gateway.
  gateway_fee_returned numeric(14, 2) NOT NULL,

  remaining_gateway_fee numeric(14, 2)
    GENERATED ALWAYS AS (
      original_gateway_fee - gateway_fee_returned
    ) STORED,

  cost_bearer text NOT NULL,

  seller_charge numeric(14, 2)
    GENERATED ALWAYS AS (
      CASE
        WHEN cost_bearer = 'seller'
        THEN original_gateway_fee - gateway_fee_returned
        ELSE 0::numeric
      END
    ) STORED,

  responsibility_reason text NOT NULL,

  -- Bukti caj dan keputusan pemulangan caj gateway.
  evidence_reference text NOT NULL,

  recorded_by uuid NOT NULL
    REFERENCES public.profiles(id),

  recorded_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT order_refund_original_fee_valid
    CHECK (
      original_gateway_fee >= 0
      AND original_gateway_fee < 'Infinity'::numeric
    ),

  CONSTRAINT order_refund_returned_fee_valid
    CHECK (
      gateway_fee_returned >= 0
      AND gateway_fee_returned <= original_gateway_fee
    ),

  CONSTRAINT order_refund_cost_bearer_valid
    CHECK (cost_bearer IN ('seller', 'platform')),

  CONSTRAINT order_refund_responsibility_valid
    CHECK (
      length(trim(responsibility_reason)) BETWEEN 1 AND 1000
    ),

  CONSTRAINT order_refund_cost_evidence_valid
    CHECK (
      length(trim(evidence_reference)) BETWEEN 1 AND 1000
    )
);

ALTER TABLE public.order_refund_costs
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.order_refund_costs
  FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE public.order_refund_costs
  TO authenticated;

GRANT ALL ON TABLE public.order_refund_costs
  TO service_role;

CREATE POLICY admin_reads_order_refund_costs
ON public.order_refund_costs
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

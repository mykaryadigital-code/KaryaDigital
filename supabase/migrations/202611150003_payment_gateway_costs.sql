BEGIN;

CREATE TABLE public.payment_gateway_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Satu rekod caj yang disahkan bagi setiap pembayaran.
  payment_id uuid NOT NULL UNIQUE
    REFERENCES public.payments(id),

  fee_amount numeric(14, 2) NOT NULL,

  currency text NOT NULL DEFAULT 'MYR',

  -- Contoh: rujukan transaksi atau penyata gateway.
  evidence_reference text NOT NULL,

  notes text,

  confirmed_by uuid NOT NULL
    REFERENCES public.profiles(id),

  confirmed_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT payment_gateway_costs_amount_valid
    CHECK (
      fee_amount >= 0
      AND fee_amount < 'Infinity'::numeric
    ),

  CONSTRAINT payment_gateway_costs_currency_valid
    CHECK (currency = 'MYR'),

  CONSTRAINT payment_gateway_costs_reference_valid
    CHECK (
      length(trim(evidence_reference)) BETWEEN 1 AND 500
    )
);

ALTER TABLE public.payment_gateway_costs
  ENABLE ROW LEVEL SECURITY;

-- Browser tidak boleh menulis caj secara terus.
REVOKE ALL ON TABLE public.payment_gateway_costs
  FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE public.payment_gateway_costs
  TO authenticated;

GRANT ALL ON TABLE public.payment_gateway_costs
  TO service_role;

-- Hanya Admin boleh membaca rekod caj penuh.
-- Seller akan melihat bahagian cajnya melalui seller_earnings.
CREATE POLICY admin_reads_gateway_costs
ON public.payment_gateway_costs
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
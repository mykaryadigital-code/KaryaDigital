BEGIN;

CREATE TABLE public.seller_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  order_item_id uuid NOT NULL UNIQUE
    REFERENCES public.order_items(id),

  order_id uuid NOT NULL
    REFERENCES public.orders(id),

  payment_id uuid NOT NULL
    REFERENCES public.payments(id),

  seller_id uuid NOT NULL
    REFERENCES public.profiles(id),

  ebook_id uuid NOT NULL
    REFERENCES public.ebooks(id),

  -- Simpan tajuk ketika pendapatan direkodkan.
  ebook_title text NOT NULL,

  -- Masa bayaran disahkan oleh sistem.
  paid_at timestamptz NOT NULL,

  gross_amount numeric(14, 2) NOT NULL,

  commission_rate numeric(5, 4) NOT NULL DEFAULT 0.1000,

  platform_commission numeric(14, 2) NOT NULL,

  -- NULL bermaksud caj belum disahkan.
  gateway_fee numeric(14, 2),

  net_amount numeric(14, 2)
    GENERATED ALWAYS AS (
      gross_amount - platform_commission - gateway_fee
    ) STORED,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT seller_earnings_gross_valid
    CHECK (gross_amount >= 0),

  CONSTRAINT seller_earnings_rate_valid
    CHECK (commission_rate >= 0 AND commission_rate <= 1),

  CONSTRAINT seller_earnings_commission_valid
    CHECK (
      platform_commission =
      round(gross_amount * commission_rate, 2)
    ),

  CONSTRAINT seller_earnings_gateway_valid
    CHECK (gateway_fee IS NULL OR gateway_fee >= 0)
);

CREATE INDEX seller_earnings_seller_paid_idx
  ON public.seller_earnings (seller_id, paid_at);

CREATE INDEX seller_earnings_payment_idx
  ON public.seller_earnings (payment_id);

CREATE INDEX seller_earnings_order_idx
  ON public.seller_earnings (order_id);

ALTER TABLE public.seller_earnings
  ENABLE ROW LEVEL SECURITY;

-- Browser tidak boleh mencipta atau mengubah pendapatan.
REVOKE ALL ON TABLE public.seller_earnings
  FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE public.seller_earnings
  TO authenticated;

GRANT ALL ON TABLE public.seller_earnings
  TO service_role;

CREATE POLICY seller_reads_own_earnings
ON public.seller_earnings
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

CREATE POLICY admin_reads_all_earnings
ON public.seller_earnings
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
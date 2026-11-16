BEGIN;

CREATE TABLE public.seller_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  seller_id uuid NOT NULL
    REFERENCES public.profiles(id),

  -- Bulan payout, sentiasa hari pertama.
  -- Contoh: 2026-12-01 untuk payout 7 Disember.
  payout_month date NOT NULL,

  scheduled_date date
    GENERATED ALWAYS AS (payout_month + 6) STORED,

  amount numeric(14, 2) NOT NULL,

  status text NOT NULL DEFAULT 'prepared',

  -- Salinan butiran bank ketika payout disediakan.
  -- Perubahan bank kemudian tidak menukar salinan ini.
  bank_name text NOT NULL,
  account_holder_name text NOT NULL,
  account_number text NOT NULL,
  bank_revision bigint NOT NULL,

  prepared_by uuid NOT NULL
    REFERENCES public.profiles(id),

  created_at timestamptz NOT NULL DEFAULT now(),

  -- Diisi selepas Admin benar-benar membuat transfer.
  paid_at timestamptz,
  paid_by uuid REFERENCES public.profiles(id),
  transfer_reference text,

  cancelled_at timestamptz,
  cancelled_by uuid REFERENCES public.profiles(id),
  cancellation_reason text,

  CONSTRAINT seller_payout_month_valid
    CHECK (extract(day FROM payout_month) = 1),

  CONSTRAINT seller_payout_amount_valid
    CHECK (
      amount >= 20
      AND amount < 'Infinity'::numeric
    ),

  CONSTRAINT seller_payout_status_valid
    CHECK (status IN ('prepared', 'paid', 'cancelled')),

  CONSTRAINT seller_payout_bank_valid
    CHECK (
      length(trim(bank_name)) BETWEEN 2 AND 100
      AND length(trim(account_holder_name)) BETWEEN 2 AND 200
      AND account_number ~ '^[0-9]{6,34}$'
      AND bank_revision >= 1
    ),

  CONSTRAINT seller_payout_state_valid
    CHECK (
      (
        status = 'prepared'
        AND paid_at IS NULL
        AND paid_by IS NULL
        AND transfer_reference IS NULL
        AND cancelled_at IS NULL
        AND cancelled_by IS NULL
        AND cancellation_reason IS NULL
      )
      OR
      (
        status = 'paid'
        AND paid_at IS NOT NULL
        AND paid_by IS NOT NULL
        AND transfer_reference IS NOT NULL
        AND length(trim(transfer_reference)) BETWEEN 1 AND 500
        AND cancelled_at IS NULL
        AND cancelled_by IS NULL
        AND cancellation_reason IS NULL
      )
      OR
      (
        status = 'cancelled'
        AND paid_at IS NULL
        AND paid_by IS NULL
        AND transfer_reference IS NULL
        AND cancelled_at IS NOT NULL
        AND cancelled_by IS NOT NULL
        AND cancellation_reason IS NOT NULL
        AND length(trim(cancellation_reason)) BETWEEN 1 AND 500
      )
    )
);

-- Satu payout aktif bagi setiap seller untuk satu bulan.
CREATE UNIQUE INDEX seller_payout_active_month_unique
ON public.seller_payouts (seller_id, payout_month)
WHERE status <> 'cancelled';

CREATE TABLE public.seller_payout_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  payout_id uuid NOT NULL
    REFERENCES public.seller_payouts(id),

  earning_id uuid NOT NULL
    REFERENCES public.seller_earnings(id),

  -- Salinan pecahan pendapatan ketika dimasukkan ke payout.
  gross_amount numeric(14, 2) NOT NULL,
  platform_commission numeric(14, 2) NOT NULL,
  gateway_fee numeric(14, 2) NOT NULL,
  net_amount numeric(14, 2) NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  -- Diisi jika payout dibatalkan dan item dilepaskan.
  released_at timestamptz,

  CONSTRAINT seller_payout_item_amounts_valid
    CHECK (
      gross_amount >= 0
      AND gross_amount < 'Infinity'::numeric
      AND platform_commission >= 0
      AND gateway_fee >= 0
      AND net_amount >= 0
      AND net_amount =
        gross_amount - platform_commission - gateway_fee
    ),

  CONSTRAINT seller_payout_item_unique
    UNIQUE (payout_id, earning_id)
);

-- Pendapatan tidak boleh ditempah/dibayar dalam dua payout.
CREATE UNIQUE INDEX seller_payout_earning_active_unique
ON public.seller_payout_items (earning_id)
WHERE released_at IS NULL;

ALTER TABLE public.seller_payouts
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.seller_payout_items
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
  public.seller_payouts,
  public.seller_payout_items
FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE
  public.seller_payouts,
  public.seller_payout_items
TO authenticated;

GRANT ALL ON TABLE
  public.seller_payouts,
  public.seller_payout_items
TO service_role;

CREATE POLICY seller_reads_own_payouts
ON public.seller_payouts
FOR SELECT TO authenticated
USING (
  seller_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role = 'seller'
  )
);

CREATE POLICY admin_reads_all_payouts
ON public.seller_payouts
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role = 'admin'
  )
);

CREATE POLICY seller_reads_own_payout_items
ON public.seller_payout_items
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.seller_payouts payout
    JOIN public.profiles profile
      ON profile.id = payout.seller_id
    WHERE payout.id = payout_id
      AND payout.seller_id = (SELECT auth.uid())
      AND profile.role = 'seller'
  )
);

CREATE POLICY admin_reads_all_payout_items
ON public.seller_payout_items
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role = 'admin'
  )
);

COMMIT;
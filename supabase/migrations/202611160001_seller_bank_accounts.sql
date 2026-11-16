BEGIN;

CREATE TABLE public.seller_bank_accounts (
  seller_id uuid PRIMARY KEY
    REFERENCES public.profiles(id),

  bank_name text NOT NULL,

  account_holder_name text NOT NULL,

  -- Simpan sebagai teks supaya sifar di depan tidak hilang.
  account_number text NOT NULL,

  -- Akan digunakan untuk mengesan perubahan butiran bank.
  revision bigint NOT NULL DEFAULT 1,

  created_at timestamptz NOT NULL DEFAULT now(),

  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT seller_bank_name_valid
    CHECK (
      bank_name = trim(bank_name)
      AND length(bank_name) BETWEEN 2 AND 100
    ),

  CONSTRAINT seller_account_holder_valid
    CHECK (
      account_holder_name = trim(account_holder_name)
      AND length(account_holder_name) BETWEEN 2 AND 200
    ),

  -- Ini semakan format sahaja, bukan pengesahan bank.
  CONSTRAINT seller_account_number_valid
    CHECK (
      account_number ~ '^[0-9]{6,34}$'
    ),

  CONSTRAINT seller_bank_revision_valid
    CHECK (revision >= 1)
);

ALTER TABLE public.seller_bank_accounts
  ENABLE ROW LEVEL SECURITY;

-- Browser tidak dibenarkan menulis terus ke jadual.
-- Penyimpanan akan melalui fungsi yang menyemak pemilik.
REVOKE ALL ON TABLE public.seller_bank_accounts
  FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE public.seller_bank_accounts
  TO authenticated;

GRANT ALL ON TABLE public.seller_bank_accounts
  TO service_role;

CREATE POLICY seller_reads_own_bank_account
ON public.seller_bank_accounts
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

CREATE POLICY admin_reads_seller_bank_accounts
ON public.seller_bank_accounts
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
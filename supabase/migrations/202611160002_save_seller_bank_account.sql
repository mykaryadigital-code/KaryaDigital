BEGIN;

CREATE OR REPLACE FUNCTION public.save_seller_bank_account(
  p_bank_name text,
  p_account_holder_name text,
  p_account_number text,
  p_expected_revision bigint DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_seller_id uuid;
  v_role text;
  v_bank_name text;
  v_holder_name text;
  v_account_number text;
  v_existing public.seller_bank_accounts%ROWTYPE;
  v_new_revision bigint;
BEGIN
  v_seller_id := auth.uid();

  IF v_seller_id IS NULL THEN
    RAISE EXCEPTION 'Sila log masuk dahulu.';
  END IF;

  -- Kunci profil supaya simpanan serentak disusun.
  SELECT p.role
  INTO v_role
  FROM public.profiles p
  WHERE p.id = v_seller_id
  FOR UPDATE;

  IF v_role IS DISTINCT FROM 'seller' THEN
    RAISE EXCEPTION
      'Hanya penjual yang diluluskan boleh menyimpan butiran bank.';
  END IF;

  v_bank_name := trim(p_bank_name);
  v_holder_name := trim(p_account_holder_name);

  -- Buang ruang dan sengkang sahaja.
  -- Nombor masih dikekalkan sebagai teks.
  v_account_number := replace(
    replace(trim(p_account_number), ' ', ''),
    '-',
    ''
  );

  IF v_bank_name IS NULL
     OR length(v_bank_name) NOT BETWEEN 2 AND 100
     OR v_bank_name ~ '[[:cntrl:]]' THEN
    RAISE EXCEPTION
      'Masukkan nama bank yang sah, antara 2 hingga 100 aksara.';
  END IF;

  IF v_holder_name IS NULL
     OR length(v_holder_name) NOT BETWEEN 2 AND 200
     OR v_holder_name ~ '[[:cntrl:]]' THEN
    RAISE EXCEPTION
      'Masukkan nama pemegang akaun yang sah.';
  END IF;

  IF v_account_number IS NULL
     OR v_account_number !~ '^[0-9]{6,34}$' THEN
    RAISE EXCEPTION
      'Nombor akaun mesti mengandungi 6 hingga 34 digit.';
  END IF;

  SELECT *
  INTO v_existing
  FROM public.seller_bank_accounts
  WHERE seller_id = v_seller_id
  FOR UPDATE;

  IF FOUND THEN
    -- Permintaan berulang dengan maklumat sama:
    -- tidak mengubah rekod atau menambah revision.
    IF v_existing.bank_name = v_bank_name
       AND v_existing.account_holder_name = v_holder_name
       AND v_existing.account_number = v_account_number THEN
      RETURN v_existing.revision;
    END IF;

    IF p_expected_revision IS DISTINCT FROM
       v_existing.revision THEN
      RAISE EXCEPTION
        'Butiran bank telah berubah. Muat semula borang sebelum menyimpan.';
    END IF;

    UPDATE public.seller_bank_accounts
    SET
      bank_name = v_bank_name,
      account_holder_name = v_holder_name,
      account_number = v_account_number,
      revision = revision + 1,
      updated_at = now()
    WHERE seller_id = v_seller_id
    RETURNING revision INTO v_new_revision;

    RETURN v_new_revision;
  END IF;

  IF p_expected_revision IS NOT NULL THEN
    RAISE EXCEPTION
      'Rekod bank tidak lagi sepadan. Muat semula borang.';
  END IF;

  INSERT INTO public.seller_bank_accounts (
    seller_id,
    bank_name,
    account_holder_name,
    account_number
  )
  VALUES (
    v_seller_id,
    v_bank_name,
    v_holder_name,
    v_account_number
  )
  RETURNING revision INTO v_new_revision;

  RETURN v_new_revision;
END;
$function$;

REVOKE ALL ON FUNCTION public.save_seller_bank_account(
  text, text, text, bigint
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.save_seller_bank_account(
  text, text, text, bigint
) TO authenticated;

COMMIT;
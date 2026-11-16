BEGIN;

CREATE OR REPLACE FUNCTION public.record_seller_payout_paid(
  p_payout_id uuid,
  p_amount numeric,
  p_transfer_reference text,
  p_transferred_at timestamptz,
  p_expected_bank_revision bigint
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_admin_id uuid;
  v_seller_id uuid;
  v_payout public.seller_payouts%ROWTYPE;
  v_reference text;
  v_item_count bigint;
  v_total numeric;
BEGIN
  v_admin_id := auth.uid();

  IF v_admin_id IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = v_admin_id
      AND p.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Akses hanya untuk Admin.';
  END IF;

  IF p_amount IS NULL THEN
    RAISE EXCEPTION 'Jumlah transfer diperlukan.';
  END IF;

  IF NOT (
    p_amount >= 20
    AND p_amount < 'Infinity'::numeric
    AND p_amount = round(p_amount, 2)
  ) THEN
    RAISE EXCEPTION 'Jumlah transfer tidak sah.';
  END IF;

  v_reference := trim(p_transfer_reference);

  IF v_reference IS NULL
     OR length(v_reference) NOT BETWEEN 1 AND 500 THEN
    RAISE EXCEPTION
      'Rujukan transfer diperlukan, maksimum 500 aksara.';
  END IF;

  IF p_transferred_at IS NULL THEN
    RAISE EXCEPTION 'Tarikh transfer diperlukan.';
  END IF;

  IF NOT isfinite(p_transferred_at)
     OR p_transferred_at > clock_timestamp() THEN
    RAISE EXCEPTION
      'Tarikh transfer tidak sah atau berada pada masa hadapan.';
  END IF;

  SELECT seller_id
  INTO v_seller_id
  FROM public.seller_payouts
  WHERE id = p_payout_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payout tidak ditemui.';
  END IF;

  -- Selaraskan urutan kunci dengan fungsi payout lain.
  PERFORM id
  FROM public.profiles
  WHERE id = v_seller_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profil penjual tidak ditemui.';
  END IF;

  SELECT *
  INTO v_payout
  FROM public.seller_payouts
  WHERE id = p_payout_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payout tidak ditemui.';
  END IF;

  IF v_payout.seller_id IS DISTINCT FROM v_seller_id THEN
    RAISE EXCEPTION 'Rekod penjual tidak sepadan.';
  END IF;

  IF p_amount IS DISTINCT FROM v_payout.amount THEN
    RAISE EXCEPTION
      'Jumlah transfer tidak sepadan dengan jumlah payout.';
  END IF;

  -- Bandingkan dengan salinan bank pada payout,
  -- bukan butiran bank semasa yang mungkin sudah berubah.
  IF p_expected_bank_revision IS DISTINCT FROM
     v_payout.bank_revision THEN
    RAISE EXCEPTION
      'Versi butiran bank payout tidak sepadan.';
  END IF;

  IF p_transferred_at < v_payout.created_at THEN
    RAISE EXCEPTION
      'Tarikh transfer tidak boleh sebelum payout disediakan.';
  END IF;

  -- Permintaan sama tidak mengubah rekod pembayaran asal.
  IF v_payout.status = 'paid' THEN
    IF v_payout.transfer_reference = v_reference
       AND v_payout.paid_at = p_transferred_at THEN
      RETURN true;
    END IF;

    RAISE EXCEPTION
      'Payout sudah dibayar. Butiran transfer tidak boleh diganti.';
  END IF;

  IF v_payout.status <> 'prepared' THEN
    RAISE EXCEPTION
      'Hanya payout berstatus prepared boleh direkodkan sebagai dibayar.';
  END IF;

  PERFORM id
  FROM public.seller_payout_items
  WHERE payout_id = p_payout_id
  ORDER BY earning_id
  FOR UPDATE;

  PERFORM se.id
  FROM public.seller_earnings se
  WHERE EXISTS (
    SELECT 1
    FROM public.seller_payout_items item
    WHERE item.payout_id = p_payout_id
      AND item.earning_id = se.id
  )
  ORDER BY se.id
  FOR UPDATE;

  SELECT count(*), sum(net_amount)
  INTO v_item_count, v_total
  FROM public.seller_payout_items
  WHERE payout_id = p_payout_id;

  IF v_item_count = 0
     OR v_total IS DISTINCT FROM v_payout.amount THEN
    RAISE EXCEPTION
      'Item payout tiada atau jumlahnya tidak sepadan.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.seller_payout_items item
    JOIN public.seller_earnings se
      ON se.id = item.earning_id
    WHERE item.payout_id = p_payout_id
      AND (
        item.released_at IS NOT NULL
        OR se.seller_id IS DISTINCT FROM v_payout.seller_id
        OR se.gross_amount IS DISTINCT FROM item.gross_amount
        OR se.platform_commission IS DISTINCT FROM
           item.platform_commission
        OR se.gateway_fee IS DISTINCT FROM item.gateway_fee
        OR se.net_amount IS DISTINCT FROM item.net_amount
      )
  ) THEN
    RAISE EXCEPTION
      'Rekod pendapatan payout tidak sepadan atau telah dilepaskan.';
  END IF;

  UPDATE public.seller_payouts
  SET
    status = 'paid',
    paid_at = p_transferred_at,
    paid_by = v_admin_id,
    transfer_reference = v_reference
  WHERE id = p_payout_id;

  -- Item kekal ditempah supaya tidak dibayar sekali lagi.
  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.record_seller_payout_paid(
  uuid, numeric, text, timestamptz, bigint
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.record_seller_payout_paid(
  uuid, numeric, text, timestamptz, bigint
) TO authenticated;

COMMIT;

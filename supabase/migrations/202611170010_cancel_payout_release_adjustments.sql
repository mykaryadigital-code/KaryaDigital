BEGIN;

CREATE OR REPLACE FUNCTION public.cancel_seller_payout(
  p_payout_id uuid,
  p_reason text
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
  v_reason text;
  v_cancelled_at timestamptz;
  v_item_count bigint;
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

  v_reason := trim(p_reason);

  IF v_reason IS NULL
     OR length(v_reason) NOT BETWEEN 1 AND 500 THEN
    RAISE EXCEPTION
      'Masukkan sebab pembatalan antara 1 hingga 500 aksara.';
  END IF;

  SELECT seller_id
  INTO v_seller_id
  FROM public.seller_payouts
  WHERE id = p_payout_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payout tidak ditemui.';
  END IF;

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

  -- Ulangan tidak mengubah sejarah asal.
  IF v_payout.status = 'cancelled' THEN
    IF v_payout.cancellation_reason = v_reason
       AND NOT EXISTS (
         SELECT 1
         FROM public.seller_payout_items
         WHERE payout_id = p_payout_id
           AND released_at IS NULL
       )
       AND NOT EXISTS (
         SELECT 1
         FROM public.seller_payout_adjustments
         WHERE payout_id = p_payout_id
           AND released_at IS NULL
       ) THEN
      RETURN true;
    END IF;

    RAISE EXCEPTION
      'Payout sudah dibatalkan atau memerlukan semakan.';
  END IF;

  IF v_payout.status <> 'prepared' THEN
    RAISE EXCEPTION
      'Hanya payout belum dibayar boleh dibatalkan.';
  END IF;

  PERFORM id
  FROM public.seller_payout_items
  WHERE payout_id = p_payout_id
  ORDER BY earning_id
  FOR UPDATE;

  PERFORM id
  FROM public.seller_payout_adjustments
  WHERE payout_id = p_payout_id
  ORDER BY adjustment_id
  FOR UPDATE;

  SELECT count(*)
  INTO v_item_count
  FROM public.seller_payout_items
  WHERE payout_id = p_payout_id;

  IF v_item_count = 0 THEN
    RAISE EXCEPTION
      'Payout tiada item. Semakan manual diperlukan.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.seller_payout_items
    WHERE payout_id = p_payout_id
      AND released_at IS NOT NULL
  ) OR EXISTS (
    SELECT 1
    FROM public.seller_payout_adjustments
    WHERE payout_id = p_payout_id
      AND released_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION
      'Sebahagian item atau potongan sudah dilepaskan. Semakan manual diperlukan.';
  END IF;

  v_cancelled_at := now();

  UPDATE public.seller_payout_items
  SET released_at = v_cancelled_at
  WHERE payout_id = p_payout_id;

  UPDATE public.seller_payout_adjustments
  SET released_at = v_cancelled_at
  WHERE payout_id = p_payout_id;

  UPDATE public.seller_payouts
  SET
    status = 'cancelled',
    cancelled_at = v_cancelled_at,
    cancelled_by = v_admin_id,
    cancellation_reason = v_reason
  WHERE id = p_payout_id;

  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.cancel_seller_payout(
  uuid, text
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.cancel_seller_payout(
  uuid, text
) TO authenticated;

COMMIT;

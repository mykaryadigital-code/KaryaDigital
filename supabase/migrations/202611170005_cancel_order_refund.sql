BEGIN;

CREATE OR REPLACE FUNCTION public.cancel_order_refund(
  p_refund_id uuid,
  p_reason text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_admin_id uuid;
  v_order_id uuid;
  v_order_status text;
  v_refund public.order_refunds%ROWTYPE;
  v_reason text;
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

  IF p_refund_id IS NULL
     OR v_reason IS NULL
     OR length(v_reason) NOT BETWEEN 1 AND 1000 THEN
    RAISE EXCEPTION
      'ID refund dan sebab pembatalan yang sah diperlukan.';
  END IF;

  SELECT order_id
  INTO v_order_id
  FROM public.order_refunds
  WHERE id = p_refund_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rekod refund tidak ditemui.';
  END IF;

  -- Kunci pesanan dahulu, sejajar dengan proses refund
  -- dan semakan item payout.
  SELECT status
  INTO v_order_status
  FROM public.orders
  WHERE id = v_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pesanan tidak ditemui.';
  END IF;

  SELECT *
  INTO v_refund
  FROM public.order_refunds
  WHERE id = p_refund_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rekod refund tidak ditemui.';
  END IF;

  IF v_refund.order_id IS DISTINCT FROM v_order_id THEN
    RAISE EXCEPTION 'Pesanan refund tidak sepadan.';
  END IF;

  -- Permintaan pembatalan sama tidak menulis semula sejarah.
  IF v_refund.status = 'cancelled' THEN
    IF v_refund.closure_reason = v_reason THEN
      RETURN true;
    END IF;

    RAISE EXCEPTION
      'Permohonan refund sudah dibatalkan dengan sebab lain.';
  END IF;

  IF v_refund.status <> 'requested' THEN
    RAISE EXCEPTION
      'Hanya permohonan refund yang belum selesai boleh dibatalkan.';
  END IF;

  IF v_order_status IS DISTINCT FROM 'paid' THEN
    RAISE EXCEPTION
      'Status pesanan memerlukan semakan sebelum pembatalan refund.';
  END IF;

  UPDATE public.order_refunds
  SET
    status = 'cancelled',
    closed_by = v_admin_id,
    closed_at = now(),
    closure_reason = v_reason
  WHERE id = p_refund_id;

  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.cancel_order_refund(
  uuid, text
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.cancel_order_refund(
  uuid, text
) TO authenticated;

COMMIT;

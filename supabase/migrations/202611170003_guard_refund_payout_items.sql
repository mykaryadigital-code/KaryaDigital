BEGIN;

CREATE OR REPLACE FUNCTION public.guard_refund_payout_item()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
DECLARE
  v_order_id uuid;
  v_order_status text;
BEGIN
  SELECT se.order_id
  INTO v_order_id
  FROM public.seller_earnings se
  WHERE se.id = NEW.earning_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rekod pendapatan tidak ditemui.';
  END IF;

  -- Selaraskan semakan dengan proses refund yang akan
  -- mengunci pesanan yang sama sebelum merekod permohonan.
  SELECT o.status
  INTO v_order_status
  FROM public.orders o
  WHERE o.id = v_order_id
  FOR UPDATE;

  IF NOT FOUND
     OR v_order_status IS DISTINCT FROM 'paid' THEN
    RAISE EXCEPTION
      'Pendapatan daripada pesanan ini tidak layak untuk payout.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.order_refunds refund
    WHERE refund.order_id = v_order_id
      AND refund.status IN ('requested', 'completed')
  ) THEN
    RAISE EXCEPTION
      'Pesanan mempunyai proses refund. Item tidak boleh dimasukkan ke payout.';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER guard_refund_before_payout_item_insert
BEFORE INSERT ON public.seller_payout_items
FOR EACH ROW
EXECUTE FUNCTION public.guard_refund_payout_item();

COMMIT;

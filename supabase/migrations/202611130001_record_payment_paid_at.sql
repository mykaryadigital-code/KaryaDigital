CREATE OR REPLACE FUNCTION public.finalize_verified_payment(
  p_payment_id uuid,
  p_order_id uuid,
  p_bill_code text,
  p_external_reference text,
  p_amount numeric
)
RETURNS boolean
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
DECLARE
  v_payment public.payments%ROWTYPE;
  v_order public.orders%ROWTYPE;
  v_paid_at timestamptz;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT *
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  SELECT *
  INTO v_payment
  FROM public.payments
  WHERE id = p_payment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF nullif(trim(p_bill_code), '') IS NULL
     OR p_amount IS NULL
     OR p_amount <= 0
     OR nullif(trim(p_external_reference), '') IS NULL
     OR v_payment.order_id IS DISTINCT FROM v_order.id
     OR v_payment.provider IS DISTINCT FROM 'toyyibpay'
     OR v_payment.provider_bill_code IS DISTINCT FROM p_bill_code
     OR v_payment.external_reference IS DISTINCT FROM p_external_reference
     OR v_payment.amount IS DISTINCT FROM p_amount
     OR v_order.total_amount IS DISTINCT FROM p_amount THEN
    RETURN false;
  END IF;

  -- Callback berulang tidak mengubah tarikh bayaran asal.
  -- Rekod lama tanpa paid_at juga tidak diberi tarikh rekaan.
  IF v_payment.status = 'paid'
     AND v_order.status = 'paid' THEN
    RETURN true;
  END IF;

  IF v_payment.status NOT IN ('creating', 'pending')
     OR v_order.status <> 'pending' THEN
    RETURN false;
  END IF;

  -- Masa bayaran mula disahkan oleh sistem KaryaDigital.
  v_paid_at := now();

  UPDATE public.payments
  SET
    status = 'paid',
    paid_at = v_paid_at,
    updated_at = v_paid_at
  WHERE id = p_payment_id;

  UPDATE public.orders
  SET
    status = 'paid',
    updated_at = v_paid_at
  WHERE id = p_order_id;

  RETURN true;
END;
$function$;
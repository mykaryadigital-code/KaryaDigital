CREATE OR REPLACE FUNCTION public.save_payment_bill_code(
  p_payment_id uuid,
  p_bill_code text
)
RETURNS boolean
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
DECLARE
  v_updated_id uuid;
  v_bill_code text;
BEGIN
  v_bill_code := trim(p_bill_code);

  IF v_bill_code IS NULL OR length(v_bill_code) = 0 THEN
    RETURN false;
  END IF;

  UPDATE public.payments
  SET
    provider_bill_code = v_bill_code,
    updated_at = now()
  WHERE id = p_payment_id
    AND provider = 'toyyibpay'
    AND status = 'creating'
    AND provider_bill_code IS NULL
  RETURNING id INTO v_updated_id;

  IF v_updated_id IS NOT NULL THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.payments
    WHERE id = p_payment_id
      AND provider = 'toyyibpay'
      AND provider_bill_code = v_bill_code
  );
END;
$function$;
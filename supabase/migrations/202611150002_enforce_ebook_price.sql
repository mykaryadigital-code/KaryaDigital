BEGIN;

CREATE OR REPLACE FUNCTION public.enforce_ebook_price()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
BEGIN
  -- Benarkan rekod lama dikemas kini tanpa mengubah harga.
  IF TG_OP = 'UPDATE' THEN
    IF NEW.price IS NOT DISTINCT FROM OLD.price THEN
      RETURN NEW;
    END IF;
  END IF;

  IF NEW.price IS NULL THEN
    RAISE EXCEPTION 'Harga eBook diperlukan.';
  END IF;

  IF NOT (
    NEW.price >= 5
    AND NEW.price < 'Infinity'::numeric
  ) THEN
    RAISE EXCEPTION 'Harga minimum eBook ialah RM5.';
  END IF;

  IF NEW.price <> round(NEW.price, 2) THEN
    RAISE EXCEPTION
      'Harga mesti mempunyai maksimum dua tempat perpuluhan.';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER enforce_ebook_price_before_write
BEFORE INSERT OR UPDATE OF price
ON public.ebooks
FOR EACH ROW
EXECUTE FUNCTION public.enforce_ebook_price();

COMMIT;

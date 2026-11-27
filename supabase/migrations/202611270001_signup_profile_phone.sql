BEGIN;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_phone text;
BEGIN
  v_phone := nullif(
    regexp_replace(
      coalesce(NEW.raw_user_meta_data ->> 'phone', ''),
      '[[:space:]-]',
      '',
      'g'
    ),
    ''
  );

  IF v_phone IS NULL THEN
    -- Sokong pendaftaran lama yang belum menghantar telefon.
    INSERT INTO public.profiles (
      id,
      full_name,
      role
    )
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data ->> 'full_name',
      'buyer'
    );
  ELSE
    IF v_phone !~ '^([+]?60|0)1[0-9]{8,9}$' THEN
      RAISE EXCEPTION 'Nombor telefon Malaysia tidak sah.'
        USING ERRCODE = '22023';
    END IF;

    -- Simpan dalam format tempatan, contohnya 0123456789.
    IF v_phone LIKE '+60%' THEN
      v_phone := '0' || substr(v_phone, 4);
    ELSIF v_phone LIKE '60%' THEN
      v_phone := '0' || substr(v_phone, 3);
    END IF;

    INSERT INTO public.profiles (
      id,
      full_name,
      phone,
      role
    )
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data ->> 'full_name',
      v_phone,
      'buyer'
    );
  END IF;

  RETURN NEW;
END;
$function$;

COMMIT;

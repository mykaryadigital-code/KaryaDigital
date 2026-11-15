BEGIN;

CREATE OR REPLACE FUNCTION public.create_checkout_order(
  p_ebook_ids uuid[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_buyer_id uuid;
  v_order_id uuid;
  v_total numeric(10,2);
  v_count integer;
  v_valid_count integer;
BEGIN
  v_buyer_id := auth.uid();

  IF v_buyer_id IS NULL THEN
    RAISE EXCEPTION 'Sila log masuk dahulu.';
  END IF;

  IF p_ebook_ids IS NULL
     OR cardinality(p_ebook_ids) = 0
     OR cardinality(p_ebook_ids) > 20 THEN
    RAISE EXCEPTION
      'Troli mesti mempunyai 1 hingga 20 eBook.';
  END IF;

  SELECT count(DISTINCT item.ebook_id)
  INTO v_count
  FROM unnest(p_ebook_ids) AS item(ebook_id);

  IF v_count <> cardinality(p_ebook_ids) THEN
    RAISE EXCEPTION
      'Troli mengandungi ID kosong atau eBook berulang.';
  END IF;

  -- Kunci rekod supaya harga dan status tidak berubah
  -- antara pengiraan jumlah dan penyimpanan item.
  PERFORM e.id
  FROM public.ebooks e
  WHERE e.id = ANY(p_ebook_ids)
  ORDER BY e.id
  FOR SHARE;

  SELECT count(*), coalesce(sum(e.price), 0)
  INTO v_valid_count, v_total
  FROM public.ebooks e
  WHERE e.id = ANY(p_ebook_ids)
    AND e.status = 'approved'
    AND e.price >= 5
    AND e.price < 'Infinity'::numeric
    AND e.price = round(e.price, 2);

  IF v_valid_count <> v_count THEN
    RAISE EXCEPTION
      'Ada eBook yang tidak tersedia atau harganya tidak sah. Harga minimum setiap eBook ialah RM5.';
  END IF;

  INSERT INTO public.orders (
    buyer_id,
    total_amount,
    status
  )
  VALUES (
    v_buyer_id,
    v_total,
    'pending'
  )
  RETURNING id INTO v_order_id;

  INSERT INTO public.order_items (
    order_id,
    ebook_id,
    price_at_purchase
  )
  SELECT
    v_order_id,
    e.id,
    e.price
  FROM public.ebooks e
  WHERE e.id = ANY(p_ebook_ids)
    AND e.status = 'approved'
    AND e.price >= 5
    AND e.price < 'Infinity'::numeric
    AND e.price = round(e.price, 2);

  RETURN v_order_id;
END;
$function$;

COMMIT;

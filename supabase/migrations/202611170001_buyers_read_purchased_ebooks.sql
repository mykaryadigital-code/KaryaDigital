BEGIN;

CREATE POLICY buyers_read_purchased_ebooks
ON public.ebooks
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.order_items item
    JOIN public.orders purchased_order
      ON purchased_order.id = item.order_id
    WHERE item.ebook_id = ebooks.id
      AND purchased_order.buyer_id = (SELECT auth.uid())
      AND purchased_order.status = 'paid'
  )
);

COMMIT;

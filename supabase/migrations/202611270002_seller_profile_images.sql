BEGIN;

-- Rekod gambar sahaja; nama kedai/penulis kekal pada permohonan diluluskan.
CREATE TABLE public.seller_profile_images (
  seller_id uuid PRIMARY KEY
    REFERENCES public.profiles(id) ON DELETE CASCADE,
  avatar_path text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT seller_profile_image_path_valid CHECK (
    avatar_path IS NULL
    OR avatar_path ~ (
      '^' || seller_id::text ||
      '/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|png|webp)$'
    )
  )
);

ALTER TABLE public.seller_profile_images ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.seller_profile_images
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.seller_profile_images TO authenticated;
GRANT ALL ON TABLE public.seller_profile_images TO service_role;

CREATE POLICY sellers_read_own_profile_image
ON public.seller_profile_images
FOR SELECT TO authenticated
USING (seller_id = (SELECT auth.uid()));

-- Foto/logo ini digunakan pada halaman produk awam.
INSERT INTO storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
)
VALUES (
  'seller-avatars',
  'seller-avatars',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
);

-- Had ini turut terpakai jika projek mempunyai polisi permissive lain.
-- Ia hanya mengehadkan bucket seller-avatars.
CREATE POLICY guard_seller_avatar_authenticated
ON storage.objects
AS RESTRICTIVE
FOR ALL TO authenticated
USING (
  bucket_id IS DISTINCT FROM 'seller-avatars'
  OR (
    (storage.foldername(name))[1] = (SELECT auth.uid()::text)
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.seller_applications a ON a.user_id = p.id
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'seller' AND a.status = 'approved'
    )
  )
)
WITH CHECK (
  bucket_id IS DISTINCT FROM 'seller-avatars'
  OR (
    (storage.foldername(name))[1] = (SELECT auth.uid()::text)
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.seller_applications a ON a.user_id = p.id
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'seller' AND a.status = 'approved'
    )
  )
);

-- URL awam gambar tetap boleh dibaca; operasi metadata anon disekat.
CREATE POLICY guard_seller_avatar_anon
ON storage.objects
AS RESTRICTIVE
FOR ALL TO anon
USING (bucket_id IS DISTINCT FROM 'seller-avatars')
WITH CHECK (bucket_id IS DISTINCT FROM 'seller-avatars');

CREATE POLICY sellers_upload_own_profile_images
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'seller-avatars'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  AND storage.extension(name) IN ('jpg', 'png', 'webp')
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.seller_applications a ON a.user_id = p.id
    WHERE p.id = (SELECT auth.uid())
      AND p.role = 'seller'
      AND a.status = 'approved'
  )
);

CREATE POLICY sellers_read_own_profile_image_files
ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'seller-avatars'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.seller_applications a ON a.user_id = p.id
    WHERE p.id = (SELECT auth.uid())
      AND p.role = 'seller'
      AND a.status = 'approved'
  )
);

CREATE POLICY sellers_delete_own_profile_image_files
ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'seller-avatars'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.seller_applications a ON a.user_id = p.id
    WHERE p.id = (SELECT auth.uid())
      AND p.role = 'seller'
      AND a.status = 'approved'
  )
);

CREATE FUNCTION public.set_seller_profile_image(p_avatar_path text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_seller_id uuid;
BEGIN
  v_seller_id := auth.uid();

  IF v_seller_id IS NULL THEN
    RAISE EXCEPTION 'Sila log masuk dahulu.';
  END IF;

  -- Selaraskan perubahan gambar bagi penjual yang sama.
  PERFORM p.id
  FROM public.profiles p
  WHERE p.id = v_seller_id AND p.role = 'seller'
  FOR UPDATE;

  IF NOT FOUND OR NOT EXISTS (
    SELECT 1
    FROM public.seller_applications a
    WHERE a.user_id = v_seller_id AND a.status = 'approved'
  ) THEN
    RAISE EXCEPTION 'Akses hanya untuk penjual yang diluluskan.';
  END IF;

  IF p_avatar_path IS NOT NULL THEN
    IF p_avatar_path !~ (
      '^' || v_seller_id::text ||
      '/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|png|webp)$'
    ) THEN
      RAISE EXCEPTION 'Rujukan gambar profil tidak sah.';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM storage.objects o
      WHERE o.bucket_id = 'seller-avatars' AND o.name = p_avatar_path
    ) THEN
      RAISE EXCEPTION 'Gambar perlu dimuat naik sebelum disimpan.';
    END IF;
  END IF;

  INSERT INTO public.seller_profile_images (seller_id, avatar_path)
  VALUES (v_seller_id, p_avatar_path)
  ON CONFLICT (seller_id) DO UPDATE
  SET avatar_path = EXCLUDED.avatar_path, updated_at = now();

  RETURN p_avatar_path;
END;
$function$;

REVOKE ALL ON FUNCTION public.set_seller_profile_image(text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_seller_profile_image(text)
  TO authenticated;

-- Paparan awam terhad kepada identiti penjual bagi eBook diluluskan.
CREATE FUNCTION public.get_public_seller_profile(p_ebook_id uuid)
RETURNS TABLE (
  shop_name text,
  author_name text,
  avatar_path text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT
    a.shop_name,
    a.author_name,
    CASE
      WHEN EXISTS (
        SELECT 1
        FROM storage.objects o
        WHERE o.bucket_id = 'seller-avatars'
          AND o.name = image.avatar_path
      ) THEN image.avatar_path
      ELSE NULL::text
    END
  FROM public.ebooks e
  JOIN public.profiles p
    ON p.id = e.seller_id AND p.role = 'seller'
  JOIN public.seller_applications a
    ON a.user_id = p.id AND a.status = 'approved'
  LEFT JOIN public.seller_profile_images image ON image.seller_id = p.id
  WHERE e.id = p_ebook_id AND e.status = 'approved'
  ORDER BY a.reviewed_at DESC NULLS LAST, a.created_at DESC, a.id DESC
  LIMIT 1;
$function$;

REVOKE ALL ON FUNCTION public.get_public_seller_profile(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_seller_profile(uuid)
  TO anon, authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;

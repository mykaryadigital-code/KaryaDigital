-- ====================================================================
-- SKEMA PANGKALAN DATA SUPABASE (POSTGRESQL) - KARYADIGITAL MALAYSIA
-- Salin dan jalankan kod SQL ini dalam "SQL Editor" portal Supabase anda
-- ====================================================================

-- 1. Jadual Pengguna (Users Profile)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    wallet_balance NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Jadual Naskhah E-Buku & Komik (E-Books & Comics Catalog)
CREATE TABLE IF NOT EXISTS public.ebooks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('novel', 'komik')),
    genre TEXT NOT NULL,
    price_myr NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    r2_file_key TEXT NOT NULL, -- Kunci fail dalam Cloudflare R2 bucket (cth: "novels/bayang.epub")
    pages_count INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Jadual Pesanan & Transaksi ToyyibPay (Orders & Transactions)
CREATE TABLE IF NOT EXISTS public.orders (
    order_id TEXT PRIMARY KEY,
    bill_code TEXT UNIQUE NOT NULL, -- Kod bil yang dijana oleh ToyyibPay
    user_email TEXT NOT NULL,
    book_id TEXT REFERENCES public.ebooks(id) ON DELETE RESTRICT,
    book_title TEXT NOT NULL,
    amount_myr NUMERIC(10, 2) NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'SUCCESS', 'FAILED')),
    transaction_id TEXT, -- ID Rujukan transaksi FPX / ToyyibPay
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE
);

-- 4. Jadual Perpustakaan Pembaca (User Library - Akses Naskhah)
CREATE TABLE IF NOT EXISTS public.user_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    book_id TEXT REFERENCES public.ebooks(id) ON DELETE CASCADE,
    order_id TEXT REFERENCES public.orders(order_id) ON DELETE SET NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_book UNIQUE (user_email, book_id)
);

-- 5. Indeks untuk carian pantas
CREATE INDEX IF NOT EXISTS idx_orders_bill_code ON public.orders(bill_code);
CREATE INDEX IF NOT EXISTS idx_orders_user_email ON public.orders(user_email);
CREATE INDEX IF NOT EXISTS idx_user_library_email ON public.user_library(user_email);

-- 6. Row Level Security (RLS) untuk Keselamatan
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_library ENABLE ROW LEVEL SECURITY;

-- Polisi RLS: Pengguna hanya boleh melihat pesanan dan perpustakaan milik mereka sendiri
CREATE POLICY "Pengguna boleh lihat pesanan sendiri" ON public.orders
    FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Pengguna boleh lihat buku dalam perpustakaan sendiri" ON public.user_library
    FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

-- 7. Data Benih Contoh (Seed Data)
INSERT INTO public.ebooks (id, title, author, category, genre, price_myr, r2_file_key, pages_count)
VALUES 
    ('novel-1', 'Bayang Di Sebalik Menara', 'Ramlee Awang Harun', 'novel', 'Misteri & Thriller', 18.50, 'novels/bayang-di-sebalik-menara.epub', 348),
    ('novel-2', 'Kisah Secangkir Kopi di Kota Bharu', 'Aiman Hafiz & Siti Zulaikha', 'novel', 'Romantik & Kehidupan', 15.00, 'novels/kopi-kota-bharu.epub', 280),
    ('komik-1', 'Lawak Kampus Generasi Z: Jilid 1', 'Keith & Cikgu Zaki', 'komik', 'Komedi & Santai', 12.00, 'comics/lawak-kampus-vol1.pdf', 128),
    ('komik-2', 'Pendekar Cyber: Arkib Malaya 2099', 'Studio Komik Gempak', 'komik', 'Aksi & Sci-Fi Cyberpunk', 14.50, 'comics/pendekar-cyber-2099.pdf', 160)
ON CONFLICT (id) DO NOTHING;

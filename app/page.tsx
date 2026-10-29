'use client';

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {ArrowRight,BookOpen,CheckCircle2,ChevronRight,Download,Menu,ShieldCheck,Store,X} from 'lucide-react';
import Header from '@/components/Header';
import BookCard from '@/components/BookCard';
import {categories,rm} from '@/data/books';
export default function Home(){const [search,setSearch]=useState('');const [category,setCategory]=useState('Semua');
const [cart, setCart] = useState<(number | string)[]>([]);const [showCart,setShowCart]=useState(false);const [menu,setMenu]=useState(false);
const [checkoutLoading, setCheckoutLoading] = useState(false);
const [checkoutMessage, setCheckoutMessage] = useState("");
const [checkoutOrderId, setCheckoutOrderId] = useState<string | null>(null);


const [approvedEbooks, setApprovedEbooks] = useState<
  {
    id: string;
    title: string;
    description: string | null;
    category: string;
    price: number;
    cover_path: string | null;
  }[]
>([]);

useEffect(() => {
  const supabase = createClient();

  async function loadApprovedEbooks() {
    const { data, error } = await supabase
      .from("ebooks")
      .select("id, title, description, category, price, cover_path")
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Gagal mengambil eBook:", error.message);
      return;
    }

    setApprovedEbooks(data ?? []);
  }

  loadApprovedEbooks();
}, []);
const marketplaceBooks = approvedEbooks.map((ebook) => ({
  id: ebook.id,
  title: ebook.title,
  author: "Penulis Tempatan",
  category: ebook.category,
  price: ebook.price,
  rating: 0,
  color: "#163d54",
  accent: "#ffffff",
  coverUrl: ebook.cover_path
    ? createClient().storage
        .from("ebook-covers")
        .getPublicUrl(ebook.cover_path).data.publicUrl
    : undefined,
}));

const filtered = useMemo(
  () =>
    marketplaceBooks.filter(
      (b) =>
        (category === "Semua" || b.category === category) &&
        `${b.title} ${b.author} ${b.category}`
          .toLowerCase()
          .includes(search.toLowerCase())
    ),
  [marketplaceBooks, search, category]
);
;const cartBooks=marketplaceBooks.filter(b=>cart.includes(b.id));const 
toggleCart=(id:number|string)=>{
  setCheckoutMessage("");
  setCheckoutOrderId(null);
  setCart(c=>c.includes(id)?c.filter(x=>x!==id):[...c,id]);
};

async function handleCheckout() {
  if (checkoutLoading || cart.length === 0) return;
  setCheckoutLoading(true);
  setCheckoutMessage("");
  setCheckoutOrderId(null);
  try {
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ebookIds: cart }),
    });
    const result: { error?: string; orderId?: string; message?: string } = await response.json();
    if (!response.ok) {
      setCheckoutMessage(
        response.status === 401
          ? "Sila log masuk dahulu sebelum membuat pesanan."
          : result.error || "Pesanan gagal dibuat. Sila cuba lagi."
      );
      return;
    }
    if (!result.orderId) {
      setCheckoutMessage("Server tidak mengembalikan ID pesanan.");
      return;
    }
    setCheckoutOrderId(result.orderId);
    setCheckoutMessage("Pesanan berjaya direkodkan. Status: Menunggu pembayaran.");
    setCart([]);
  } catch (error) {
    console.error("Ralat checkout:", error);
    setCheckoutMessage("Sambungan gagal. Sila cuba lagi.");
  } finally {
    setCheckoutLoading(false);
  }
}
return <div className="min-h-screen bg-[#f7f8fb]"><Header search={search} setSearch={setSearch} cartCount={cart.length} onCart={()=>setShowCart(true)}/><nav className="border-b bg-white"><div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3 text-xs font-semibold text-slate-600 lg:px-8"><button className="flex items-center gap-1 md:hidden" onClick={()=>setMenu(!menu)}><Menu size={16}/> Menu</button><span className="hidden md:inline">Kategori Popular</span><div className={`${menu?'flex':'hidden'} flex-wrap gap-4 md:flex`}>{categories.slice(1,7).map(c=><button key={c} onClick={()=>{setCategory(c);document.getElementById('katalog')?.scrollIntoView({behavior:'smooth'});setMenu(false)}} className="hover:text-orange-600">{c}</button>)}</div></div></nav><main><section className="mx-auto grid max-w-7xl gap-6 px-4 py-7 lg:grid-cols-[1.65fr_1fr] lg:px-8"><div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-orange-500 to-amber-400 px-7 py-10 text-white sm:px-12 sm:py-14"><span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold">🇲🇾 Marketplace eBook Malaysia</span><h1 className="mt-5 max-w-lg text-3xl font-extrabold leading-tight sm:text-5xl">Ribuan Cerita.<br/>Satu Tempat.</h1><p className="mt-4 max-w-md text-sm leading-relaxed text-orange-50 sm:text-base">Terokai eBook daripada penulis tempatan. Beli dengan mudah, baca di mana-mana.</p><button onClick={()=>document.getElementById('katalog')?.scrollIntoView({behavior:'smooth'})} className="mt-7 flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-orange-600 shadow-sm hover:bg-orange-50">Terokai eBook <ArrowRight size={17}/></button><BookOpen size={180} strokeWidth={0.7} className="absolute -bottom-10 -right-10 rotate-[-15deg] text-white/20 sm:right-3"/></div><div className="flex flex-col justify-between gap-5 rounded-3xl bg-[#163d54] p-7 text-white sm:p-9"><div><span className="text-xs font-bold tracking-widest text-amber-300">UNTUK PENULIS & PENERBIT</span><h2 className="mt-4 text-2xl font-extrabold sm:text-3xl">Karya anda, peluang baharu.</h2><p className="mt-3 text-sm leading-7 text-slate-200">Bina kedai eBook sendiri dan capai lebih ramai pembaca di Malaysia.</p></div><button onClick={()=>document.getElementById('jadi-penjual')?.scrollIntoView({behavior:'smooth'})} className="flex w-fit items-center gap-2 rounded-xl bg-amber-300 px-5 py-3 text-sm font-bold text-slate-900">Ketahui Lebih Lanjut <ArrowRight size={16}/></button></div></section><section className="mx-auto grid max-w-7xl grid-cols-1 gap-3 px-4 pb-8 sm:grid-cols-3 lg:px-8">{[{icon:Download,title:'100% Digital',sub:'Akses eBook tanpa penghantaran fizikal'},{icon:ShieldCheck,title:'Pembelian Selamat',sub:'Akses selepas pembayaran disahkan'},{icon:Store,title:'Penulis Tempatan',sub:'Sokong karya kreatif Malaysia'}].map(({icon:Icon,title,sub})=><div key={title} className="flex items-center gap-3 rounded-2xl bg-white p-4"><span className="rounded-xl bg-orange-50 p-3 text-orange-500"><Icon size={23}/></span><div><h3 className="text-sm font-bold">{title}</h3><p className="text-xs text-slate-500">{sub}</p></div></div>)}</section><section id="katalog" className="mx-auto max-w-7xl px-4 pb-16 lg:px-8"><div className="mb-5 flex flex-wrap items-end justify-between gap-2"><div><p className="text-xs font-bold uppercase tracking-wider text-orange-600">Koleksi Pilihan</p><h2 className="mt-1 text-2xl font-extrabold sm:text-3xl">Cari Bacaan Kegemaran</h2></div><span className="text-sm text-slate-500">{filtered.length} eBook ditemui</span></div><div className="mb-6 flex gap-2 overflow-x-auto pb-2">{categories.map(c=><button key={c} onClick={()=>setCategory(c)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${category===c?'bg-orange-500 text-white':'border border-slate-200 bg-white text-slate-600 hover:border-orange-300'}`}>{c}</button>)}</div>{filtered.length?<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">{filtered.map(b=><BookCard key={b.id} book={b} onAdd={toggleCart} inCart={cart.includes(b.id)}/>)}</div>:<div className="rounded-2xl bg-white p-12 text-center text-slate-500">Tiada eBook ditemui. Cuba kata kunci atau kategori lain.</div>}</section><section id="jadi-penjual" className="bg-slate-900 px-4 py-14 text-white"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 md:flex-row md:items-center"><div><p className="text-xs font-bold uppercase tracking-widest text-amber-300">Bersama BukuKita</p><h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">Ada eBook untuk dijual?</h2><p className="mt-2 max-w-xl text-sm text-slate-300">Marketplace ini sedang dibangunkan. Pendaftaran penjual akan tersedia selepas sistem akaun dan kelulusan siap.</p></div><span className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-5 py-3 text-sm font-semibold text-white"><CheckCircle2 size={17}/> Pendaftaran Akan Datang</span></div></section></main><footer className="bg-white px-4 py-8 text-center text-xs text-slate-500">© {new Date().getFullYear()} BukuKita. Demo marketplace eBook Malaysia.</footer>{showCart&&<div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={()=>setShowCart(false)}><aside role="dialog" aria-modal="true" aria-label="Troli saya" className="flex h-full w-full max-w-md flex-col bg-white p-6 shadow-xl" onClick={e=>e.stopPropagation()}><div className="flex items-center justify-between"><h2 className="text-xl font-bold">Troli Saya ({cart.length})</h2><button aria-label="Tutup troli" onClick={()=>setShowCart(false)}><X/></button></div><div className="mt-6 flex-1 space-y-4 overflow-y-auto">{cartBooks.length===0?<p className="text-sm text-slate-500">Troli anda masih kosong.</p>:cartBooks.map(b=><div key={b.id} className="flex items-center justify-between gap-3 border-b pb-3"><div><p className="text-sm font-bold">{b.title}</p><p className="text-xs text-slate-500">{b.author}</p><p className="text-sm font-semibold text-orange-600">{rm(b.price)}</p></div><button onClick={()=>toggleCart(b.id)} className="text-xs text-red-600">Buang</button></div>)}</div><div className="border-t pt-4"><div className="flex justify-between font-bold"><span>Jumlah</span><span>{rm(cartBooks.reduce((s,b)=>s+b.price,0))}</span></div><p className="mt-3 text-xs text-slate-500">Checkout hanya merekodkan pesanan. Pembayaran belum diaktifkan dan eBook belum boleh dimuat turun.</p>{checkoutMessage&&<div role="status" className="mt-3 rounded-xl bg-slate-100 p-3 text-sm text-slate-700"><p>{checkoutMessage}</p>{checkoutOrderId&&<p className="mt-2 break-all text-xs">ID Pesanan: {checkoutOrderId}</p>}</div>}<button type="button" onClick={handleCheckout} disabled={checkoutLoading||cart.length===0} className="mt-4 w-full rounded-xl bg-orange-500 p-3 text-sm font-bold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500">{checkoutLoading?'Memproses pesanan...':'Buat Pesanan (Belum Bayar)'}</button></div></aside></div>}<div className="fixed bottom-0 left-0 right-0 z-20 flex justify-around border-t bg-white p-3 text-[10px] text-slate-600 sm:hidden"><button onClick={()=>window.scrollTo({top:0,behavior:'smooth'})} className="flex flex-col items-center gap-1"><BookOpen size={19}/>Utama</button><button onClick={()=>document.getElementById('katalog')?.scrollIntoView({behavior:'smooth'})} className="flex flex-col items-center gap-1"><ChevronRight size={19}/>Katalog</button><button onClick={()=>setShowCart(true)} className="flex flex-col items-center gap-1"><Store size={19}/>Troli ({cart.length})</button></div><div className="h-14 sm:hidden"/></div>}

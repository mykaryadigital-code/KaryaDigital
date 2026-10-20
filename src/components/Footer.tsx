import React from 'react';
import { BookOpen, ShieldCheck, Heart, Award, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-amber-600 flex items-center justify-center text-white shadow-sm">
                <BookOpen className="w-5 h-5 text-amber-300" />
              </div>
              <span className="text-lg font-black text-white tracking-tight">
                Karya<span className="text-amber-500">Digital</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Platform pasaran dan pembaca e-buku serta komik tempatan rasmi Malaysia. Menghubungkan pembaca dengan karya terbaik tanah air.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Sistem Keselamatan Hak Cipta 2026</span>
            </div>
          </div>

          {/* Quick Links 1: Kategori */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-white">Kategori Pilihan</div>
            <ul className="space-y-2">
              <li><span className="hover:text-white transition-colors cursor-pointer">Novel Thriller & Misteri</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Komik Lawak Kampus</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Hikayat & Fantasi Nusantara</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Resipi & Warisan Masakan</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Koleksi E-Buku Percuma</span></li>
            </ul>
          </div>

          {/* Quick Links 2: Untuk Penulis (Self-Publishing) */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-white">
              Pendaftaran Penulis (Self-Publishing)
            </div>
            <ul className="space-y-2">
              <li>
                <span className="hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-1.5 font-semibold text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  Portal Penulis Bebas (Self-Publishing Hub)
                </span>
              </li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Daftar Manuskrip e-Buku & Komik</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Kadar Royalti 70% Terus ke Akaun Bank</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Panduan Hak Cipta Akta 1987</span></li>
            </ul>
          </div>

          {/* Sistem Keselamatan DRM & Rakan Pembayaran Sah */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-white">
              Sistem Keselamatan DRM & Perbankan
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-[11px]">
              <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>DRM Enkripsi Pelayar & Cloudflare R2</span>
              </div>
              <p className="text-slate-400 leading-snug">
                Pencegahan cetak rompak, sekatan cetakan dan muat turun haram, watermark dinamik e-mel pembeli.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 text-[10px] font-mono font-bold text-slate-300">
              <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md">BCL / BAYARCASH</span>
              <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md">FPX ONLINE BANKING</span>
              <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md">DUITNOW QR</span>
              <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md">TOYYIBPAY</span>
            </div>
          </div>
        </div>

        {/* Social Media & Legal Bar */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <div className="space-y-1 text-center sm:text-left">
            <div>
              © 2026 KaryaDigital Malaysia (No. Pendaftaran 202601004523-M).
            </div>
            <div className="text-slate-500">
              Hak Cipta Terpelihara di bawah Akta Hak Cipta Malaysia 1987. Dikuasakan oleh Firebase & BCL.
            </div>
          </div>

          {/* Social Media Icons */}
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-xs mr-1">Ikuti Kami:</span>
            {/* Facebook */}
            <a
              href="#facebook"
              aria-label="Facebook KaryaDigital"
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            {/* Instagram */}
            <a
              href="#instagram"
              aria-label="Instagram KaryaDigital"
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-pink-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
            {/* X / Twitter */}
            <a
              href="#twitter"
              aria-label="Twitter X KaryaDigital"
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            {/* TikTok */}
            <a
              href="#tiktok"
              aria-label="TikTok KaryaDigital"
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-rose-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

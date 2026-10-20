import React from 'react';
import { BookOpen, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Top Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 pb-6 border-b border-slate-800/80">
          {/* Brand */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
                <BookOpen className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-base font-extrabold text-white tracking-tight">
                Karya<span className="text-amber-500">Digital</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Platform rasmi pasaran & pembaca e-buku serta komik tempatan Malaysia.
            </p>
          </div>

          {/* Pautan Bantuan & Pembaca */}
          <div className="space-y-1.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-white">
              Bantuan Pembaca
            </h4>
            <ul className="space-y-1 text-[11px]">
              <li><span className="hover:text-white transition-colors cursor-pointer">Panduan Membaca dalam Pelayar</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Soalan Lazim (FAQ) & Bayaran</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Polisi Privasi & Terma Penggunaan</span></li>
            </ul>
          </div>

          {/* Untuk Penulis (Self-Publishing Hub) */}
          <div className="space-y-1.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-white">
              Pendaftaran Penulis
            </h4>
            <ul className="space-y-1 text-[11px]">
              <li>
                <span className="hover:text-amber-400 text-slate-300 font-semibold transition-colors cursor-pointer flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  Portal Penulis (Self-Publishing)
                </span>
              </li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Kadar Royalti 70% ke Akaun Bank</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Panduan Hak Cipta Akta 1987</span></li>
            </ul>
          </div>

          {/* Keselamatan DRM & Pembayaran */}
          <div className="space-y-1.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-white">
              Keselamatan & Perbankan
            </h4>
            <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>DRM & Enkripsi Cloudflare R2</span>
            </div>
            <div className="flex flex-wrap gap-1 text-[9px] font-mono font-bold text-slate-300 pt-1">
              <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded">BCL / BAYARCASH</span>
              <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded">FPX</span>
              <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded">DUITNOW QR</span>
              <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded">TOYYIBPAY</span>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Social */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <p>© 2026 KaryaDigital Malaysia (No. Pendaftaran 202601004523-M). Hak Cipta Terpelihara di bawah Akta Hak Cipta 1987.</p>
          <div className="flex items-center gap-2">
            <a href="#facebook" aria-label="Facebook" className="w-7 h-7 rounded-full bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
            </a>
            <a href="#instagram" aria-label="Instagram" className="w-7 h-7 rounded-full bg-slate-800 hover:bg-pink-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
            </a>
            <a href="#twitter" aria-label="X Twitter" className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

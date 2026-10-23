import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  PenTool,
} from 'lucide-react';
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  resetPassword,
} from '../firebase.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: 'login' | 'register';
  redirectMessage?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
  redirectMessage,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isAuthorInterest, setIsAuthorInterest] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  // Reset state when changing tabs
  const switchMode = (newMode: 'login' | 'register' | 'forgot') => {
    setMode(newMode);
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Google 1-Click Login
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await signInWithGoogle();
      setSuccessMessage('Log masuk Google berjaya! Mengalihkan ke perpustakaan...');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 700);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/unauthorized-domain') {
        const hostname = typeof window !== 'undefined' ? window.location.hostname : 'mykarya.digital';
        setErrorMessage(
          `Domain (${hostname}) belum didaftarkan dalam senarai "Authorized domains" Firebase Authentication Console untuk Google Sign-In. Sila gunakan pilihan E-mel & Kata Laluan di bawah, atau daftar akaun baharu.`
        );
      } else if (err.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Tetingkap log masuk Google ditutup sebelum selesai.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setErrorMessage('Permintaan dibatalkan.');
      } else {
        setErrorMessage(err.message || 'Gagal log masuk Google. Sila cuba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Email / Password Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim()) {
      setErrorMessage('Sila masukkan alamat e-mel anda.');
      return;
    }

    if (mode === 'forgot') {
      setIsLoading(true);
      try {
        await resetPassword(email);
        setSuccessMessage(`Pautan tetapan semula kata laluan telah dihantar ke ${email}. Sila semak peti masuk anda.`);
      } catch (err: any) {
        if (err.code === 'auth/user-not-found') {
          setErrorMessage('Tiada akaun berdaftar dengan alamat e-mel ini.');
        } else {
          setErrorMessage(err.message || 'Gagal menghantar e-mel tetapan semula.');
        }
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Kata laluan mestilah sekurang-kurangnya 6 aksara.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
        setSuccessMessage('Log masuk berjaya! Selamat kembali ke KaryaDigital.');
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 700);
      } else if (mode === 'register') {
        if (!displayName.trim()) {
          setErrorMessage('Sila masukkan Nama Penuh atau Nama Pena anda.');
          setIsLoading(false);
          return;
        }
        await signUpWithEmail(email, password, displayName, isAuthorInterest);
        setSuccessMessage('Akaun berjaya dicipta! Selamat datang ke KaryaDigital.');
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 800);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setErrorMessage(
          'Penyedia E-mel & Kata Laluan belum diaktifkan di Firebase Console. Sila klik butang "Daftar Pantas dengan Google" di atas untuk log masuk serta-merta menggunakan akaun Google anda!'
        );
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setErrorMessage('E-mel atau kata laluan tidak tepat. Jika anda belum mendaftar, sila klik tab "Daftar Akaun" di atas.');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMessage('E-mel ini telah pun didaftarkan. Sila pilih tab Log Masuk dan masukkan kata laluan.');
      } else if (err.code === 'auth/weak-password') {
        setErrorMessage('Kata laluan terlalu mudah. Gunakan sekurang-kurangnya 6 aksara kukuh.');
      } else {
        setErrorMessage(err.message || 'Ralat berlaku semasa pengesahan akaun.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Log Masuk KaryaDigital"
    >
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative">
        {/* Top Header with Gradient Accent */}
        <div className="relative bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 pb-5">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Tutup log masuk"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center shadow-md">
              <BookOpen className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-white">
                Karya<span className="text-indigo-400">Digital</span>
              </span>
              <span className="ml-1 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-mono">
                MY
              </span>
            </div>
          </div>

          <h3 className="text-lg font-black text-white">
            {mode === 'login' && 'Log Masuk Akaun'}
            {mode === 'register' && 'Daftar Akaun Baharu'}
            {mode === 'forgot' && 'Tetapan Semula Kata Laluan'}
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            {mode === 'login' && 'Akses rak buku anda, baca bila-bila masa dan segerak antara peranti.'}
            {mode === 'register' && 'Sertai komuniti pembaca & penulis e-buku terbesar Malaysia.'}
            {mode === 'forgot' && 'Masukkan e-mel anda untuk menerima pautan penetapan semula.'}
          </p>

          {redirectMessage && (
            <div className="mt-3 py-1.5 px-3 bg-amber-500/20 border border-amber-400/40 rounded-xl text-[11px] text-amber-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>{redirectMessage}</span>
            </div>
          )}
        </div>

        {/* Tab Switcher */}
        {mode !== 'forgot' && (
          <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 text-xs font-bold">
            <button
              onClick={() => switchMode('login')}
              className={`py-3 text-center transition-colors border-b-2 cursor-pointer ${
                mode === 'login'
                  ? 'border-indigo-600 text-indigo-700 bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Log Masuk
            </button>
            <button
              onClick={() => switchMode('register')}
              className={`py-3 text-center transition-colors border-b-2 cursor-pointer ${
                mode === 'register'
                  ? 'border-indigo-600 text-indigo-700 bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Daftar Akaun
            </button>
          </div>
        )}

        {/* Modal Form Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Error & Success Feedback alerts */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
              {errorMessage.includes('Daftar Pantas dengan Google') && (
                <div className="pt-2 border-t border-rose-200/80 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-rose-700 font-semibold">
                    🚀 Kaedah aktif:
                  </span>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-xl transition cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
                  >
                    <span>Log Masuk Google Sekarang →</span>
                  </button>
                </div>
              )}
              {errorMessage.includes('Authorized domains') && (
                <div className="pt-1 border-t border-rose-200/80 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-rose-700 font-semibold">
                    💡 Gunakan borang E-mel di bawah:
                  </span>
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] rounded-lg transition cursor-pointer shrink-0"
                  >
                    Daftar Akaun Baharu →
                  </button>
                </div>
              )}
              {errorMessage.includes('Daftar Akaun') && !errorMessage.includes('Authorized domains') && !errorMessage.includes('Daftar Pantas dengan Google') && mode === 'login' && (
                <div className="pt-1 border-t border-rose-200/80 text-right">
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className="text-[11px] font-bold text-rose-700 hover:text-rose-900 underline cursor-pointer"
                  >
                    Tukar ke Tab Daftar Akaun →
                  </button>
                </div>
              )}
            </div>
          )}
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Google 1-Click Button */}
          {mode !== 'forgot' && (
            <>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 hover:border-slate-400 font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer group disabled:opacity-50"
              >
                <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>
                  {mode === 'login' ? 'Log Masuk Pantas dengan Google' : 'Daftar Pantas dengan Google'}
                </span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  atau guna e-mel
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>
            </>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Display Name field (only for Register) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Penuh / Nama Pena Penulis:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Contoh: Farhan Iskandar"
                    className="w-full pl-9.5 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-900"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alamat E-mel:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="anda@contoh.my"
                  className="w-full pl-9.5 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-900"
                />
              </div>
            </div>

            {/* Password Field (Only for Login & Register) */}
            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Kata Laluan:
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                    >
                      Lupa kata laluan?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9.5 pr-10 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label="Tunjuk kata laluan"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Author Interest Checkbox (for Register) */}
            {mode === 'register' && (
              <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAuthorInterest}
                  onChange={(e) => setIsAuthorInterest(e.target.checked)}
                  className="mt-0.5 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="text-[11px] text-slate-700 leading-tight">
                  <span className="font-bold text-indigo-950 flex items-center gap-1">
                    <PenTool className="w-3 h-3 text-indigo-600 inline" />
                    Daftar Sebagai Penulis (Program Royalti 70%)
                  </span>
                  <span className="text-slate-500 block mt-0.5">
                    Aktifkan ciri memuat naik karya & pantau jualan naskhah anda.
                  </span>
                </div>
              </label>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'login' && 'Log Masuk'}
                    {mode === 'register' && 'Cipta Akaun Sekarang'}
                    {mode === 'forgot' && 'Hantar Pautan E-mel'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Back to Login link when in Forgot mode */}
          {mode === 'forgot' && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
              >
                ← Kembali ke Log Masuk
              </button>
            </div>
          )}
        </div>

        {/* Benefits Footer Strip */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Hak Cipta Terpelihara</span>
          </div>
          <div className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Penyegerakan Awan</span>
          </div>
          <div className="flex items-center gap-1">
            <PenTool className="w-3.5 h-3.5 text-indigo-600" />
            <span>Karya Asli Malaysia</span>
          </div>
        </div>
      </div>
    </div>
  );
};

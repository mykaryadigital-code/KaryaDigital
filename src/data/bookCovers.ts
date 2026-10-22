/**
 * Koleksi ilustrasi muka depan e-buku & komik rasmi KaryaDigital Malaysia.
 * Menggunakan vektor SVG berkualiti tinggi dengan tipografi dan palet warna
 * yang sepadan dengan reka bentuk showcase rasmi.
 */

function encodeSvg(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim())}`;
}

// 1. Resipi Kasih Mak Tok (Aina Zulkifli)
export const COVER_MAK_TOK = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="100%" height="100%">
  <defs>
    <linearGradient id="makTokBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#78350f"/>
      <stop offset="35%" stop-color="#b45309"/>
      <stop offset="70%" stop-color="#d97706"/>
      <stop offset="100%" stop-color="#451a03"/>
    </linearGradient>
    <radialGradient id="hearthGlow" cx="50%" cy="65%" r="45%">
      <stop offset="0%" stop-color="#fef08a" stop-opacity="0.9"/>
      <stop offset="40%" stop-color="#f59e0b" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#78350f" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="potShine" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#713f12"/>
      <stop offset="50%" stop-color="#ca8a04"/>
      <stop offset="100%" stop-color="#422006"/>
    </linearGradient>
  </defs>

  <!-- Background Base -->
  <rect width="400" height="500" fill="url(#makTokBg)"/>
  
  <!-- Warm Hearth Kitchen Glow -->
  <circle cx="200" cy="320" r="180" fill="url(#hearthGlow)"/>

  <!-- Kitchen Wooden Shelves & Props -->
  <rect x="20" y="240" width="360" height="12" rx="4" fill="#451a03" opacity="0.6"/>
  <!-- Jars on shelf -->
  <rect x="50" y="200" width="30" height="40" rx="6" fill="#fef08a" opacity="0.4"/>
  <rect x="90" y="210" width="25" height="30" rx="4" fill="#fbbf24" opacity="0.5"/>
  <rect x="290" y="205" width="28" height="35" rx="5" fill="#f97316" opacity="0.4"/>
  <rect x="330" y="195" width="32" height="45" rx="6" fill="#ea580c" opacity="0.4"/>

  <!-- Steaming Pot on Table -->
  <ellipse cx="200" cy="380" rx="100" ry="25" fill="#1c1917" opacity="0.5"/>
  <path d="M120 340 Q110 400 200 410 Q290 400 280 340 Z" fill="url(#potShine)"/>
  <ellipse cx="200" cy="340" rx="80" ry="16" fill="#ca8a04" stroke="#fef08a" stroke-width="2"/>
  <!-- Pot Handles -->
  <path d="M108 348 C95 348 95 362 112 362" stroke="#ca8a04" stroke-width="6" fill="none" stroke-linecap="round"/>
  <path d="M292 348 C305 348 305 362 288 362" stroke="#ca8a04" stroke-width="6" fill="none" stroke-linecap="round"/>

  <!-- Steam Clouds -->
  <path d="M170 310 Q160 270 185 240 Q170 200 190 170" stroke="#ffffff" stroke-width="5" stroke-linecap="round" fill="none" opacity="0.4" stroke-dasharray="10 15"/>
  <path d="M220 315 Q235 275 215 245 Q230 205 210 175" stroke="#ffffff" stroke-width="5" stroke-linecap="round" fill="none" opacity="0.35" stroke-dasharray="8 12"/>

  <!-- Mak Tok Character Silhouette / Illustrated Face -->
  <ellipse cx="200" cy="245" rx="42" ry="50" fill="#fef3c7"/>
  <!-- Hijab / Selendang Kampung -->
  <path d="M150 250 C145 190 255 190 250 250 C250 280 230 310 200 312 C170 310 150 280 150 250 Z" fill="#fffbeb" opacity="0.95"/>
  <ellipse cx="200" cy="248" rx="28" ry="32" fill="#fed7aa"/>
  <!-- Gentle Smiling Eyes & Glasses -->
  <circle cx="188" cy="245" r="7" stroke="#9a3412" stroke-width="2" fill="none"/>
  <circle cx="212" cy="245" r="7" stroke="#9a3412" stroke-width="2" fill="none"/>
  <line x1="195" y1="245" x2="205" y2="245" stroke="#9a3412" stroke-width="2"/>
  <path d="M192 262 Q200 270 208 262" stroke="#9a3412" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- Apron / Baju Kurung -->
  <path d="M140 310 L260 310 L280 430 L120 430 Z" fill="#b45309" opacity="0.8"/>
  <path d="M170 310 L230 310 L240 400 L160 400 Z" fill="#fef08a" opacity="0.6"/>

  <!-- Decorative Border -->
  <rect x="12" y="12" width="376" height="476" rx="8" fill="none" stroke="#fde047" stroke-width="2" opacity="0.6"/>

  <!-- Book Header Typography -->
  <rect x="25" y="24" width="350" height="96" rx="8" fill="#1c1917" opacity="0.45"/>
  <text x="200" y="52" font-family="serif" font-size="18" font-weight="900" fill="#fef08a" text-anchor="middle" letter-spacing="3">RESIPI</text>
  <text x="200" y="78" font-family="serif" font-size="24" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="2">KASIH</text>
  <text x="200" y="106" font-family="serif" font-size="20" font-weight="800" fill="#fbbf24" text-anchor="middle" letter-spacing="3">MAK TOK</text>

  <!-- Author Name at Bottom -->
  <rect x="50" y="450" width="300" height="30" rx="15" fill="#1c1917" opacity="0.75"/>
  <text x="200" y="470" font-family="sans-serif" font-size="13" font-weight="700" fill="#fef3c7" text-anchor="middle" letter-spacing="1.5">Aina Zulkifli</text>
</svg>
`);

// 2. Pendekar Cyber (Hafiz Rahman)
export const COVER_PENDEKAR_CYBER = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="100%" height="100%">
  <defs>
    <linearGradient id="cyberBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#050814"/>
      <stop offset="40%" stop-color="#0f172a"/>
      <stop offset="80%" stop-color="#1e1b4b"/>
      <stop offset="100%" stop-color="#2e1065"/>
    </linearGradient>
    <linearGradient id="neonLaser" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#22d3ee"/>
      <stop offset="50%" stop-color="#818cf8"/>
      <stop offset="100%" stop-color="#f43f5e"/>
    </linearGradient>
    <radialGradient id="cyberGlow" cx="50%" cy="55%" r="50%">
      <stop offset="0%" stop-color="#a855f7" stop-opacity="0.8"/>
      <stop offset="60%" stop-color="#06b6d4" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#050814" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background Base -->
  <rect width="400" height="500" fill="url(#cyberBg)"/>
  
  <!-- Cyberpunk City Skyline in Background -->
  <rect x="30" y="160" width="40" height="240" fill="#0f172a" opacity="0.7"/>
  <rect x="75" y="120" width="55" height="280" fill="#1e1b4b" opacity="0.8"/>
  <rect x="270" y="140" width="50" height="260" fill="#1e1b4b" opacity="0.8"/>
  <rect x="325" y="180" width="45" height="220" fill="#0f172a" opacity="0.7"/>
  
  <!-- Twin Towers Futuristic Silhouette -->
  <path d="M140 380 L140 100 L145 90 L150 100 L150 380 Z" fill="#06b6d4" opacity="0.3"/>
  <path d="M165 380 L165 100 L170 90 L175 100 L175 380 Z" fill="#06b6d4" opacity="0.3"/>
  <line x1="150" y1="200" x2="165" y2="200" stroke="#06b6d4" stroke-width="3" opacity="0.4"/>

  <!-- Neon Glowing Signs & Windows -->
  <rect x="85" y="140" width="8" height="60" fill="#f43f5e" opacity="0.7"/>
  <rect x="98" y="180" width="8" height="40" fill="#22d3ee" opacity="0.8"/>
  <rect x="285" y="160" width="10" height="70" fill="#a855f7" opacity="0.7"/>
  <rect x="300" y="210" width="8" height="50" fill="#f43f5e" opacity="0.8"/>

  <!-- Cyber Glow Sphere -->
  <circle cx="200" cy="270" r="160" fill="url(#cyberGlow)"/>

  <!-- Grid Perspective Floor -->
  <path d="M0 400 L400 400 L400 500 L0 500 Z" fill="#0f0c24"/>
  <line x1="50" y1="400" x2="0" y2="500" stroke="#818cf8" stroke-width="1.5" opacity="0.5"/>
  <line x1="120" y1="400" x2="80" y2="500" stroke="#818cf8" stroke-width="1.5" opacity="0.5"/>
  <line x1="200" y1="400" x2="200" y2="500" stroke="#818cf8" stroke-width="2" opacity="0.7"/>
  <line x1="280" y1="400" x2="320" y2="500" stroke="#818cf8" stroke-width="1.5" opacity="0.5"/>
  <line x1="350" y1="400" x2="400" y2="500" stroke="#818cf8" stroke-width="1.5" opacity="0.5"/>

  <!-- Cyber Warrior Character (Back view / 3/4 standing heroically) -->
  <!-- Cloak / Cyber Hoodie -->
  <path d="M175 190 Q200 170 225 190 Q240 230 235 320 Q200 340 165 320 Q160 230 175 190 Z" fill="#090d16" stroke="#22d3ee" stroke-width="1.5"/>
  <!-- Hood Interior Glow -->
  <ellipse cx="200" cy="215" rx="14" ry="18" fill="#1e1b4b"/>
  <!-- Glowing Cyber Visor Eyes -->
  <path d="M192 215 L208 215" stroke="#22d3ee" stroke-width="4" stroke-linecap="round" filter="drop-shadow(0 0 6px #22d3ee)"/>

  <!-- High-Tech Cyber Keris / Plasma Sword -->
  <path d="M228 290 Q235 240 248 160 Q252 140 258 110" stroke="url(#neonLaser)" stroke-width="6" stroke-linecap="round" fill="none" filter="drop-shadow(0 0 10px #f43f5e)"/>
  <path d="M228 290 Q235 240 248 160 Q252 140 258 110" stroke="#ffffff" stroke-width="2" stroke-linecap="round" fill="none"/>
  <!-- Hilt -->
  <rect x="220" y="285" width="16" height="30" rx="3" fill="#334155" transform="rotate(20 228 300)"/>

  <!-- Neon Frame Border -->
  <rect x="12" y="12" width="376" height="476" rx="8" fill="none" stroke="#22d3ee" stroke-width="2" opacity="0.7"/>

  <!-- Header Typography -->
  <rect x="30" y="24" width="340" height="90" rx="8" fill="#030712" opacity="0.8" stroke="#f43f5e" stroke-width="1.5"/>
  <text x="200" y="58" font-family="sans-serif" font-size="28" font-weight="900" fill="#22d3ee" text-anchor="middle" letter-spacing="4">PENDEKAR</text>
  <text x="200" y="92" font-family="sans-serif" font-size="24" font-weight="900" fill="#f43f5e" text-anchor="middle" letter-spacing="6">CYBER</text>

  <!-- Author Name at Bottom -->
  <rect x="60" y="450" width="280" height="30" rx="15" fill="#030712" opacity="0.9" stroke="#818cf8" stroke-width="1"/>
  <text x="200" y="470" font-family="sans-serif" font-size="13" font-weight="800" fill="#38bdf8" text-anchor="middle" letter-spacing="2">HAFIZ RAHMAN</text>
</svg>
`);

// 3. Hutan Seribu Bisikan (Nadia Kamal)
export const COVER_HUTAN_BISIKAN = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="100%" height="100%">
  <defs>
    <linearGradient id="forestBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#022c22"/>
      <stop offset="35%" stop-color="#064e3b"/>
      <stop offset="70%" stop-color="#047857"/>
      <stop offset="100%" stop-color="#022c22"/>
    </linearGradient>
    <radialGradient id="moonRays" cx="50%" cy="20%" r="55%">
      <stop offset="0%" stop-color="#a7f3d0" stop-opacity="0.8"/>
      <stop offset="50%" stop-color="#10b981" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#022c22" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Forest Canopy Background -->
  <rect width="400" height="500" fill="url(#forestBg)"/>
  
  <!-- Moonlight breaking through canopy -->
  <circle cx="200" cy="120" r="140" fill="url(#moonRays)"/>

  <!-- Ancient Rainforest Giant Trees Silhouette -->
  <!-- Left Tree Trunk -->
  <path d="M0 500 L60 380 Q90 280 40 180 Q20 140 0 100 Z" fill="#021c15"/>
  <path d="M40 220 Q80 190 120 160" stroke="#021c15" stroke-width="14" stroke-linecap="round" fill="none"/>
  <path d="M50 310 Q90 270 140 250" stroke="#021c15" stroke-width="12" stroke-linecap="round" fill="none"/>

  <!-- Right Tree Trunk -->
  <path d="M400 500 L340 380 Q310 270 360 170 Q380 130 400 90 Z" fill="#021c15"/>
  <path d="M350 240 Q310 200 270 170" stroke="#021c15" stroke-width="14" stroke-linecap="round" fill="none"/>
  
  <!-- Hanging Lianas & Vines -->
  <path d="M90 170 Q110 270 85 360" stroke="#065f46" stroke-width="3" fill="none"/>
  <path d="M120 160 Q145 280 110 390" stroke="#065f46" stroke-width="2.5" fill="none"/>
  <path d="M290 180 Q270 290 300 400" stroke="#065f46" stroke-width="3" fill="none"/>

  <!-- Fireflies & Golden Forest Spores -->
  <circle cx="150" cy="220" r="4" fill="#fef08a" opacity="0.8"/>
  <circle cx="250" cy="260" r="3.5" fill="#fef08a" opacity="0.9"/>
  <circle cx="180" cy="310" r="5" fill="#6ee7b7" opacity="0.85"/>
  <circle cx="220" cy="340" r="3" fill="#fef08a" opacity="0.8"/>
  <circle cx="130" cy="380" r="4" fill="#a7f3d0" opacity="0.7"/>
  <circle cx="270" cy="370" r="4.5" fill="#fef08a" opacity="0.85"/>

  <!-- Lone Adventurer Silhouette on Mossy Rock -->
  <path d="M150 440 Q200 420 250 440 L280 500 L120 500 Z" fill="#01140e"/>
  <!-- Figure with staff and backpack -->
  <circle cx="195" cy="380" r="10" fill="#01140e"/>
  <path d="M185 390 Q195 385 205 390 L210 425 L180 425 Z" fill="#01140e"/>
  <line x1="215" y1="365" x2="222" y2="440" stroke="#34d399" stroke-width="3" stroke-linecap="round"/>
  <!-- Glowing staff tip -->
  <circle cx="215" cy="365" r="5" fill="#fef08a"/>

  <!-- Border -->
  <rect x="12" y="12" width="376" height="476" rx="8" fill="none" stroke="#34d399" stroke-width="2" opacity="0.6"/>

  <!-- Header Typography -->
  <rect x="25" y="24" width="350" height="96" rx="8" fill="#021c15" opacity="0.8" stroke="#10b981" stroke-width="1"/>
  <text x="200" y="52" font-family="serif" font-size="20" font-weight="900" fill="#34d399" text-anchor="middle" letter-spacing="4">HUTAN</text>
  <text x="200" y="80" font-family="serif" font-size="24" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="3">SERIBU</text>
  <text x="200" y="106" font-family="serif" font-size="20" font-weight="800" fill="#a7f3d0" text-anchor="middle" letter-spacing="3">BISIKAN</text>

  <!-- Author Name -->
  <rect x="60" y="450" width="280" height="30" rx="15" fill="#021c15" opacity="0.9"/>
  <text x="200" y="470" font-family="sans-serif" font-size="13" font-weight="700" fill="#6ee7b7" text-anchor="middle" letter-spacing="2">NADIA KAMAL</text>
</svg>
`);

// 4. Kedai Kopi Rindu (Suri Hanim)
export const COVER_KEDAI_KOPI = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="100%" height="100%">
  <defs>
    <linearGradient id="coffeeBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#27160c"/>
      <stop offset="40%" stop-color="#451a03"/>
      <stop offset="80%" stop-color="#78350f"/>
      <stop offset="100%" stop-color="#291407"/>
    </linearGradient>
    <radialGradient id="warmLamp" cx="50%" cy="30%" r="50%">
      <stop offset="0%" stop-color="#fef08a" stop-opacity="0.8"/>
      <stop offset="40%" stop-color="#fbbf24" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#451a03" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="400" height="500" fill="url(#coffeeBg)"/>
  <circle cx="200" cy="180" r="160" fill="url(#warmLamp)"/>

  <!-- Cafe Window Frame -->
  <rect x="40" y="130" width="320" height="200" rx="12" fill="#1c1917" opacity="0.5" stroke="#92400e" stroke-width="3"/>
  <line x1="200" y1="130" x2="200" y2="330" stroke="#92400e" stroke-width="3"/>
  <line x1="40" y1="230" x2="360" y2="230" stroke="#92400e" stroke-width="3"/>

  <!-- Hanging Edison Bulb -->
  <line x1="200" y1="40" x2="200" y2="150" stroke="#78350f" stroke-width="3"/>
  <circle cx="200" cy="155" r="12" fill="#fef08a" stroke="#d97706" stroke-width="2"/>

  <!-- Table & Couple Silhouette -->
  <ellipse cx="200" cy="380" rx="140" ry="30" fill="#180e06"/>
  <!-- Left person -->
  <circle cx="140" cy="310" r="18" fill="#1c1917"/>
  <path d="M120 330 C120 330 140 325 160 330 L165 375 L115 375 Z" fill="#1c1917"/>
  <!-- Right person -->
  <circle cx="260" cy="308" r="17" fill="#1c1917"/>
  <path d="M240 328 C240 328 260 324 280 328 L285 375 L235 375 Z" fill="#1c1917"/>

  <!-- Coffee Cups with Steam -->
  <rect x="175" y="365" width="16" height="14" rx="2" fill="#fef3c7"/>
  <rect x="205" y="365" width="16" height="14" rx="2" fill="#fef3c7"/>
  <path d="M182 360 Q185 350 180 340" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.6"/>
  <path d="M212 360 Q215 350 210 340" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.6"/>

  <!-- Border -->
  <rect x="12" y="12" width="376" height="476" rx="8" fill="none" stroke="#d97706" stroke-width="2" opacity="0.5"/>

  <!-- Script Typography -->
  <rect x="35" y="25" width="330" height="90" rx="8" fill="#180e06" opacity="0.6"/>
  <text x="200" y="60" font-family="serif" font-style="italic" font-size="28" font-weight="700" fill="#fef08a" text-anchor="middle">Kedai Kopi</text>
  <text x="200" y="96" font-family="serif" font-style="italic" font-size="34" font-weight="800" fill="#ffffff" text-anchor="middle">Rindu</text>

  <!-- Author -->
  <rect x="70" y="450" width="260" height="30" rx="15" fill="#180e06" opacity="0.85"/>
  <text x="200" y="470" font-family="sans-serif" font-size="13" font-weight="700" fill="#fed7aa" text-anchor="middle" letter-spacing="1.5">Suri Hanim</text>
</svg>
`);

// 5. Rumah di Hujung Jalan (Zul Ariffin)
export const COVER_RUMAH_HUJUNG_JALAN = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="100%" height="100%">
  <defs>
    <linearGradient id="spookyBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#040810"/>
      <stop offset="45%" stop-color="#0b1329"/>
      <stop offset="80%" stop-color="#141f3d"/>
      <stop offset="100%" stop-color="#070b16"/>
    </linearGradient>
    <radialGradient id="spookyMoon" cx="70%" cy="25%" r="40%">
      <stop offset="0%" stop-color="#f8fafc" stop-opacity="0.9"/>
      <stop offset="40%" stop-color="#94a3b8" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#040810" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="400" height="500" fill="url(#spookyBg)"/>
  
  <!-- Pale Moon -->
  <circle cx="280" cy="140" r="50" fill="url(#spookyMoon)"/>
  <circle cx="280" cy="140" r="32" fill="#f1f5f9"/>

  <!-- Spooky Clouds -->
  <path d="M180 140 Q240 120 320 150 Q360 140 380 160" stroke="#334155" stroke-width="20" opacity="0.4" stroke-linecap="round" fill="none"/>
  
  <!-- Dead Gnarled Trees -->
  <path d="M30 460 Q60 360 50 280 Q40 230 15 190" stroke="#060913" stroke-width="12" stroke-linecap="round" fill="none"/>
  <path d="M50 280 Q80 240 100 200" stroke="#060913" stroke-width="7" stroke-linecap="round" fill="none"/>
  <path d="M370 460 Q340 350 355 260 Q365 210 390 170" stroke="#060913" stroke-width="12" stroke-linecap="round" fill="none"/>

  <!-- Haunted House Silhouette -->
  <!-- Roof Gables -->
  <path d="M120 360 L200 240 L280 360 Z" fill="#080c18"/>
  <path d="M80 360 L140 280 L200 360 Z" fill="#050810"/>
  <path d="M200 360 L260 280 L320 360 Z" fill="#050810"/>
  <!-- House Base & Porch -->
  <rect x="90" y="360" width="220" height="70" fill="#080c18"/>
  <!-- Glowing Amber Windows -->
  <rect x="185" y="275" width="30" height="40" rx="3" fill="#f59e0b" opacity="0.9" filter="drop-shadow(0 0 8px #f59e0b)"/>
  <line x1="200" y1="275" x2="200" y2="315" stroke="#080c18" stroke-width="2"/>
  <line x1="185" y1="295" x2="215" y2="295" stroke="#080c18" stroke-width="2"/>
  <rect x="120" y="375" width="22" height="30" fill="#f59e0b" opacity="0.8"/>
  <rect x="255" y="375" width="22" height="30" fill="#f59e0b" opacity="0.8"/>

  <!-- Misty Road Leading to House -->
  <path d="M190 430 L130 500 L270 500 L210 430 Z" fill="#111827" opacity="0.7"/>

  <!-- Border -->
  <rect x="12" y="12" width="376" height="476" rx="8" fill="none" stroke="#64748b" stroke-width="1.5" opacity="0.5"/>

  <!-- Header Typography -->
  <rect x="25" y="24" width="350" height="96" rx="8" fill="#040810" opacity="0.85" stroke="#334155" stroke-width="1"/>
  <text x="200" y="54" font-family="serif" font-size="22" font-weight="900" fill="#e2e8f0" text-anchor="middle" letter-spacing="3">RUMAH DI</text>
  <text x="200" y="82" font-family="serif" font-size="24" font-weight="900" fill="#f59e0b" text-anchor="middle" letter-spacing="2">HUJUNG JALAN</text>

  <!-- Author -->
  <rect x="70" y="450" width="260" height="30" rx="15" fill="#040810" opacity="0.9"/>
  <text x="200" y="470" font-family="sans-serif" font-size="13" font-weight="700" fill="#cbd5e1" text-anchor="middle" letter-spacing="1.5">Zul Ariffin</text>
</svg>
`);

// 6. Langit Seorang Perantau (Radzi Kassim)
export const COVER_LANGIT_PERANTAU = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="100%" height="100%">
  <defs>
    <linearGradient id="sunsetBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#31103f"/>
      <stop offset="30%" stop-color="#7c2d12"/>
      <stop offset="60%" stop-color="#c2410c"/>
      <stop offset="85%" stop-color="#ea580c"/>
      <stop offset="100%" stop-color="#fed7aa"/>
    </linearGradient>
  </defs>

  <rect width="400" height="500" fill="url(#sunsetBg)"/>
  
  <!-- Glowing Golden Sun at Horizon -->
  <circle cx="200" cy="380" r="70" fill="#fef08a" opacity="0.9"/>
  
  <!-- Mountains Silhouette -->
  <path d="M0 400 L80 340 L160 410 L260 330 L350 400 L400 370 L400 500 L0 500 Z" fill="#1c0e05"/>
  <path d="M40 430 L120 380 L220 440 L320 370 L400 420 L400 500 L0 500 Z" fill="#0f0702"/>

  <!-- Migrating Birds -->
  <path d="M120 180 Q130 170 140 180 Q150 170 160 180" stroke="#451a03" stroke-width="2.5" fill="none"/>
  <path d="M240 150 Q248 142 256 150 Q264 142 272 150" stroke="#451a03" stroke-width="2" fill="none"/>
  <path d="M180 140 Q186 134 192 140 Q198 134 204 140" stroke="#451a03" stroke-width="1.8" fill="none"/>

  <!-- Border -->
  <rect x="12" y="12" width="376" height="476" rx="8" fill="none" stroke="#fdba74" stroke-width="1.5" opacity="0.6"/>

  <!-- Typography -->
  <rect x="30" y="24" width="340" height="96" rx="8" fill="#1c0e05" opacity="0.65"/>
  <text x="200" y="55" font-family="serif" font-style="italic" font-size="28" font-weight="700" fill="#fed7aa" text-anchor="middle">Langit</text>
  <text x="200" y="90" font-family="serif" font-style="italic" font-size="24" font-weight="800" fill="#ffffff" text-anchor="middle">Seorang Perantau</text>

  <!-- Author -->
  <rect x="70" y="450" width="260" height="30" rx="15" fill="#0f0702" opacity="0.85"/>
  <text x="200" y="470" font-family="sans-serif" font-size="13" font-weight="700" fill="#fed7aa" text-anchor="middle" letter-spacing="1.5">Radzi Kassim</text>
</svg>
`);

// 7. Tawaran di Hujung Senja (Farhan Daniel)
export const COVER_TAWARAN_SENJA = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="100%" height="100%">
  <defs>
    <linearGradient id="twilightBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3b0764"/>
      <stop offset="40%" stop-color="#701a75"/>
      <stop offset="75%" stop-color="#be185d"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
  </defs>
  <rect width="400" height="500" fill="url(#twilightBg)"/>
  <!-- Harbor Pier & Sea Silhouette -->
  <path d="M0 380 Q200 375 400 380 L400 500 L0 500 Z" fill="#18021e"/>
  <rect x="80" y="360" width="120" height="15" fill="#2e083a"/>
  <rect x="100" y="375" width="12" height="40" fill="#2e083a"/>
  <rect x="160" y="375" width="12" height="40" fill="#2e083a"/>
  <!-- Light reflections on water -->
  <ellipse cx="200" cy="420" rx="90" ry="6" fill="#fbcfe8" opacity="0.3"/>
  <ellipse cx="200" cy="450" rx="130" ry="8" fill="#fbcfe8" opacity="0.2"/>

  <!-- Typography -->
  <rect x="30" y="24" width="340" height="96" rx="8" fill="#18021e" opacity="0.6"/>
  <text x="200" y="55" font-family="serif" font-style="italic" font-size="26" font-weight="800" fill="#fbcfe8" text-anchor="middle">Tawaran</text>
  <text x="200" y="90" font-family="serif" font-style="italic" font-size="22" font-weight="700" fill="#ffffff" text-anchor="middle">di Hujung Senja</text>
  <!-- Author -->
  <rect x="70" y="450" width="260" height="30" rx="15" fill="#18021e" opacity="0.85"/>
  <text x="200" y="470" font-family="sans-serif" font-size="13" font-weight="700" fill="#fbcfe8" text-anchor="middle">Farhan Daniel</text>
</svg>
`);

// 8. Mimpi di Tajuk 7 (Azlan Shah)
export const COVER_MIMPI_TAJUK7 = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="100%" height="100%">
  <defs>
    <linearGradient id="nightSkyBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#020617"/>
      <stop offset="40%" stop-color="#0f172a"/>
      <stop offset="80%" stop-color="#1e1b4b"/>
      <stop offset="100%" stop-color="#312e81"/>
    </linearGradient>
  </defs>
  <rect width="400" height="500" fill="url(#nightSkyBg)"/>
  <!-- Stars & Constellations -->
  <circle cx="80" cy="180" r="2.5" fill="#ffffff"/>
  <circle cx="150" cy="150" r="3" fill="#ffffff"/>
  <circle cx="220" cy="190" r="2" fill="#38bdf8"/>
  <circle cx="310" cy="160" r="3" fill="#ffffff"/>
  <circle cx="260" cy="240" r="2.5" fill="#818cf8"/>
  <circle cx="180" cy="260" r="3.5" fill="#38bdf8"/>
  <line x1="80" y1="180" x2="150" y2="150" stroke="#38bdf8" stroke-width="1" opacity="0.4"/>
  <line x1="150" y1="150" x2="220" y2="190" stroke="#38bdf8" stroke-width="1" opacity="0.4"/>
  <line x1="220" y1="190" x2="310" y2="160" stroke="#38bdf8" stroke-width="1" opacity="0.4"/>

  <!-- Giant Dream Crescent Moon -->
  <path d="M200 240 A60 60 0 1 0 280 340 A70 70 0 1 1 200 240 Z" fill="#e0f2fe" opacity="0.9" filter="drop-shadow(0 0 15px #38bdf8)"/>

  <!-- Typography -->
  <rect x="30" y="24" width="340" height="96" rx="8" fill="#020617" opacity="0.75" stroke="#38bdf8" stroke-width="1"/>
  <text x="200" y="58" font-family="serif" font-size="28" font-weight="900" fill="#e0f2fe" text-anchor="middle" letter-spacing="3">Mimpi</text>
  <text x="200" y="92" font-family="serif" font-size="24" font-weight="800" fill="#38bdf8" text-anchor="middle" letter-spacing="2">di Tajuk 7</text>
  <!-- Author -->
  <rect x="70" y="450" width="260" height="30" rx="15" fill="#020617" opacity="0.85"/>
  <text x="200" y="470" font-family="sans-serif" font-size="13" font-weight="700" fill="#bae6fd" text-anchor="middle">Azlan Shah</text>
</svg>
`);

// 9. Sajak Seorang Perempuan (Dian Maisarah)
export const COVER_SAJAK_PEREMPUAN = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="100%" height="100%">
  <defs>
    <linearGradient id="poeticBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#4a044e"/>
      <stop offset="45%" stop-color="#831843"/>
      <stop offset="85%" stop-color="#be185d"/>
      <stop offset="100%" stop-color="#500724"/>
    </linearGradient>
  </defs>
  <rect width="400" height="500" fill="url(#poeticBg)"/>
  <!-- Elegant Floral Petals Silhouette -->
  <path d="M200 200 C150 250 150 350 200 400 C250 350 250 250 200 200 Z" fill="#fdf2f8" opacity="0.15"/>
  <path d="M140 280 C180 250 260 250 300 280 C260 320 180 320 140 280 Z" fill="#fdf2f8" opacity="0.12"/>
  
  <!-- Calligraphy Silhouette of Rose / Petal -->
  <circle cx="200" cy="290" r="40" stroke="#fbcfe8" stroke-width="2.5" fill="none" opacity="0.6"/>
  <circle cx="200" cy="290" r="24" stroke="#fbcfe8" stroke-width="2" fill="none" opacity="0.5"/>

  <!-- Typography -->
  <rect x="30" y="24" width="340" height="96" rx="8" fill="#500724" opacity="0.7"/>
  <text x="200" y="55" font-family="serif" font-style="italic" font-size="28" font-weight="700" fill="#fdf2f8" text-anchor="middle">Sajak</text>
  <text x="200" y="90" font-family="serif" font-style="italic" font-size="22" font-weight="600" fill="#fbcfe8" text-anchor="middle">Seorang Perempuan</text>
  <!-- Author -->
  <rect x="70" y="450" width="260" height="30" rx="15" fill="#500724" opacity="0.85"/>
  <text x="200" y="470" font-family="sans-serif" font-size="13" font-weight="700" fill="#fdf2f8" text-anchor="middle">Dian Maisarah</text>
</svg>
`);

// 10. Pulau Terakhir (Captain Roslan)
export const COVER_PULAU_TERAKHIR = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="100%" height="100%">
  <defs>
    <linearGradient id="oceanBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#020617"/>
      <stop offset="40%" stop-color="#0c4a6e"/>
      <stop offset="75%" stop-color="#0369a1"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
  </defs>
  <rect width="400" height="500" fill="url(#oceanBg)"/>
  <!-- Isolated Island Silhouette & Lighthouse -->
  <path d="M60 410 Q200 350 340 410 L400 500 L0 500 Z" fill="#030712"/>
  <!-- Lighthouse on Peak -->
  <rect x="194" y="335" width="12" height="35" fill="#e0f2fe"/>
  <path d="M190 335 L200 320 L210 335 Z" fill="#e0f2fe"/>
  <!-- Lighthouse Beacon Beam -->
  <polygon points="200,328 0,260 0,290" fill="#fef08a" opacity="0.35"/>
  <polygon points="200,328 400,260 400,290" fill="#fef08a" opacity="0.35"/>
  <!-- Ocean Waves -->
  <path d="M0 450 Q50 440 100 450 Q150 460 200 450 Q250 440 300 450 Q350 460 400 450" stroke="#38bdf8" stroke-width="2" fill="none" opacity="0.5"/>

  <!-- Typography -->
  <rect x="30" y="24" width="340" height="96" rx="8" fill="#020617" opacity="0.8" stroke="#38bdf8" stroke-width="1"/>
  <text x="200" y="58" font-family="serif" font-size="28" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="4">PULAU</text>
  <text x="200" y="92" font-family="serif" font-size="24" font-weight="900" fill="#38bdf8" text-anchor="middle" letter-spacing="3">TERAKHIR</text>
  <!-- Author -->
  <rect x="70" y="450" width="260" height="30" rx="15" fill="#020617" opacity="0.85"/>
  <text x="200" y="470" font-family="sans-serif" font-size="13" font-weight="700" fill="#bae6fd" text-anchor="middle">Captain Roslan</text>
</svg>
`);

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// SVG template for standard and apple icon
function createSvg(size, isMaskable = false) {
  // If maskable, safe zone is central 70-80% of canvas, so add margin
  const padding = isMaskable ? size * 0.16 : size * 0.08;
  const innerSize = size - (padding * 2);

  return `
  <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="50%" stop-color="#1e1b4b" />
        <stop offset="100%" stop-color="#312e81" />
      </linearGradient>
      <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fbbf24" />
        <stop offset="100%" stop-color="#f59e0b" />
      </linearGradient>
      <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#6366f1" />
        <stop offset="100%" stop-color="#818cf8" />
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.35" />
      </filter>
    </defs>

    <!-- Background -->
    <rect width="${size}" height="${size}" rx="${isMaskable ? 0 : size * 0.22}" fill="url(#bg)" />

    <!-- Subtle inner border for unmasked/standard -->
    ${!isMaskable ? `<rect x="2" y="2" width="${size - 4}" height="${size - 4}" rx="${size * 0.22}" fill="none" stroke="#6366f1" stroke-width="2" stroke-opacity="0.4" />` : ''}

    <g transform="translate(${padding}, ${padding})" filter="url(#shadow)">
      <!-- Book open pages -->
      <path d="M ${innerSize * 0.1} ${innerSize * 0.28} 
               C ${innerSize * 0.3} ${innerSize * 0.24}, ${innerSize * 0.45} ${innerSize * 0.26}, ${innerSize * 0.5} ${innerSize * 0.32}
               L ${innerSize * 0.5} ${innerSize * 0.78}
               C ${innerSize * 0.45} ${innerSize * 0.72}, ${innerSize * 0.3} ${innerSize * 0.7}, ${innerSize * 0.1} ${innerSize * 0.74}
               Z" fill="url(#gold)" />
      
      <path d="M ${innerSize * 0.9} ${innerSize * 0.28} 
               C ${innerSize * 0.7} ${innerSize * 0.24}, ${innerSize * 0.55} ${innerSize * 0.26}, ${innerSize * 0.5} ${innerSize * 0.32}
               L ${innerSize * 0.5} ${innerSize * 0.78}
               C ${innerSize * 0.55} ${innerSize * 0.72}, ${innerSize * 0.7} ${innerSize * 0.7}, ${innerSize * 0.9} ${innerSize * 0.74}
               Z" fill="#ffffff" fill-opacity="0.95" />

      <!-- Center spine divider -->
      <line x1="${innerSize * 0.5}" y1="${innerSize * 0.32}" x2="${innerSize * 0.5}" y2="${innerSize * 0.8}" stroke="#4338ca" stroke-width="${Math.max(2, innerSize * 0.02)}" stroke-linecap="round" />

      <!-- Bookmark Ribbon -->
      <path d="M ${innerSize * 0.48} ${innerSize * 0.2}
               L ${innerSize * 0.56} ${innerSize * 0.2}
               L ${innerSize * 0.56} ${innerSize * 0.42}
               L ${innerSize * 0.52} ${innerSize * 0.38}
               L ${innerSize * 0.48} ${innerSize * 0.42}
               Z" fill="#ef4444" />

      <!-- Stylized Sparkle / Digital star -->
      <circle cx="${innerSize * 0.82}" cy="${innerSize * 0.22}" r="${innerSize * 0.04}" fill="#facc15" />
    </g>
  </svg>
  `;
}

async function generate() {
  console.log('Generating PWA icons...');
  
  // 1. icon.svg
  const baseSvg = createSvg(512, false);
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), baseSvg);

  // 2. pwa-192x192.png
  await sharp(Buffer.from(createSvg(192, false)))
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  // 3. pwa-512x512.png
  await sharp(Buffer.from(createSvg(512, false)))
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  // 4. pwa-maskable-512x512.png (with safe-margin padding and full bleed background)
  await sharp(Buffer.from(createSvg(512, true)))
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  // 5. apple-touch-icon.png (180x180)
  await sharp(Buffer.from(createSvg(180, false)))
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  console.log('Successfully generated all PWA icons!');
}

generate().catch(err => {
  console.error('Failed to generate icons:', err);
  process.exit(1);
});

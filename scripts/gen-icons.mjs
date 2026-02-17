import { writeFileSync } from 'fs';

function makeSvg(size) {
    const rx = Math.round(size * 0.15);
    const fs1 = Math.round(size * 0.45);
    const fs2 = Math.round(size * 0.1);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${rx}" fill="#0f172a"/>
  <text x="50%" y="42%" text-anchor="middle" dominant-baseline="central" font-size="${fs1}">&#x1F432;</text>
  <text x="50%" y="78%" text-anchor="middle" dominant-baseline="central" font-size="${fs2}" font-weight="bold" fill="#fbbf24" font-family="sans-serif">NEXUS</text>
</svg>`;
}

writeFileSync('public/pwa-192x192.svg', makeSvg(192));
writeFileSync('public/pwa-512x512.svg', makeSvg(512));
writeFileSync('public/apple-touch-icon.svg', makeSvg(180));
console.log('Created SVG icons in public/');

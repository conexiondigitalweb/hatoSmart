// One-off script — run to (re)produce the optimized web assets from raw
// image exports dropped in public/images/landing/ (source originals
// themselves aren't committed — see the note in LandingPage.jsx). Not part
// of the build pipeline (no image processing happens at build/runtime), so
// `sharp` is a dev-time tool only, not a project dependency:
//
//   npm install --no-save sharp && node scripts/optimize-landing-images.mjs
//
// --no-save keeps it out of package.json/package-lock.json on purpose.
import sharp from 'sharp'
import path from 'node:path'
import { stat } from 'node:fs/promises'

const dir = path.resolve('public/images/landing')

const jobs = [
  // Hero — opaque photo, already 4:3. Displays at ~half of a max-w-6xl
  // (1152px) column on desktop; 1400w covers that at 2x retina with room
  // to spare without shipping the full 4160x3120 original (5.2MB).
  { src: 'hero-finca.jpg', out: 'hero-finca.webp', width: 1400, quality: 78, alpha: false },
  // Module illustrations — transparent PNG (polaroid/tape/clip artwork),
  // 1080x1350 (4:5) native. Card width on desktop is ~1/3 of the same
  // container (~360px); 800w covers that at 2x retina.
  { src: 'modulo-animales.png', out: 'modulo-animales.webp', width: 800, quality: 82, alpha: true },
  { src: 'modulo-ordeno.png', out: 'modulo-ordeno.webp', width: 800, quality: 82, alpha: true },
  { src: 'modulo-pesaje.png', out: 'modulo-pesaje.webp', width: 800, quality: 82, alpha: true },
  { src: 'modulo-sanidad.png', out: 'modulo-sanidad.webp', width: 800, quality: 82, alpha: true },
  { src: 'modulo-reproduccion.png', out: 'modulo-reproduccion.webp', width: 800, quality: 82, alpha: true },
  { src: 'modulo-alertas.png', out: 'modulo-alertas.webp', width: 800, quality: 82, alpha: true },
]

for (const job of jobs) {
  const srcPath = path.join(dir, job.src)
  const outPath = path.join(dir, job.out)
  const srcSize = (await stat(srcPath)).size

  await sharp(srcPath)
    .resize({ width: job.width, withoutEnlargement: true })
    .webp({ quality: job.quality, alphaQuality: job.alpha ? 90 : undefined })
    .toFile(outPath)

  const outSize = (await stat(outPath)).size
  console.log(
    `${job.src} → ${job.out}: ${(srcSize / 1024).toFixed(0)}kb → ${(outSize / 1024).toFixed(0)}kb ` +
    `(-${(100 - (outSize / srcSize) * 100).toFixed(0)}%)`
  )
}

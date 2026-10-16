// Generate PWA icons with RSS icon (Lucide-style) instead of beaker
import sharp from 'sharp'
import * as fs from 'fs'
import * as path from 'path'

// RSS icon SVG — matches the user's reference image:
// - 2 arcs (curves) emanating from bottom-left to top-right
// - 1 small circle at bottom-left (the source)
// - White color on the gradient background
// Lucide RSS path: M4 11a9 9 0 0 1 9 9 / M4 4a16 16 0 0 1 16 16 / circle cx=5 cy=19 r=1

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F67B56"/>
      <stop offset="50%" stop-color="#E08B7C"/>
      <stop offset="100%" stop-color="#C19BE9"/>
    </linearGradient>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="6"/>
      <feOffset dx="0" dy="4" result="offsetblur"/>
      <feFlood flood-color="rgba(0,0,0,0.2)"/>
      <feComposite in2="offsetblur" operator="in"/>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <!-- Background: full bleed gradient -->
  <rect width="512" height="512" fill="url(#bg)"/>
  <!-- RSS icon (white) centered - scaled up from 24x24 viewBox to 512 -->
  <!-- Translate: center the 24x24 icon in 512x512 canvas, scale by ~16x -->
  <!-- Center calculation: (512 - 24*16) / 2 = (512 - 384) / 2 = 64 -->
  <g transform="translate(64, 64) scale(16)" filter="url(#shadow)">
    <!-- Arc 1: smaller (M4 11a9 9 0 0 1 9 9) -->
    <path d="M4 11a9 9 0 0 1 9 9" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <!-- Arc 2: larger (M4 4a16 16 0 0 1 16 16) -->
    <path d="M4 4a16 16 0 0 1 16 16" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <!-- Source dot (circle cx=5 cy=19 r=1) -->
    <circle cx="5" cy="19" r="1.5" fill="white"/>
  </g>
</svg>`

const PUBLIC_DIR = '/home/z/my-project/public'
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons')

// Create icons directory
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true })
}

// All sizes needed for iOS + Android + manifest
const sizes = [
  { name: 'icon-16.png', size: 16 },
  { name: 'icon-32.png', size: 32 },
  { name: 'favicon-32.png', size: 32 },
  { name: 'favicon-64.png', size: 64 },
  { name: 'favicon.png', size: 64 },
  { name: 'apple-touch-icon-57.png', size: 57 },
  { name: 'apple-touch-icon-60.png', size: 60 },
  { name: 'apple-touch-icon-72.png', size: 72 },
  { name: 'apple-touch-icon-76.png', size: 76 },
  { name: 'apple-touch-icon-114.png', size: 114 },
  { name: 'apple-touch-icon-120.png', size: 120 },
  { name: 'apple-touch-icon-144.png', size: 144 },
  { name: 'apple-touch-icon-152.png', size: 152 },
  { name: 'apple-touch-icon-167.png', size: 167 },
  { name: 'apple-touch-icon-180.png', size: 180 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-96.png', size: 96 },
  { name: 'icon-128.png', size: 128 },
  { name: 'icon-144.png', size: 144 },
  { name: 'icon-152.png', size: 152 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-256.png', size: 256 },
  { name: 'icon-384.png', size: 384 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-1024.png', size: 1024 },
]

async function main() {
  console.log('Generating PWA icons with RSS design...')
  
  // Save the SVG
  fs.writeFileSync(path.join(PUBLIC_DIR, 'logo.svg'), SVG)
  console.log('  ✓ logo.svg updated (RSS icon)')
  
  for (const { name, size } of sizes) {
    const outPath = path.join(ICONS_DIR, name)
    await sharp(Buffer.from(SVG))
      .resize(size, size)
      .png()
      .toFile(outPath)
    console.log(`  ✓ ${name} (${size}x${size})`)
  }
  
  // favicon.ico
  const icoBuffer = await sharp(Buffer.from(SVG))
    .resize(32, 32)
    .png()
    .toBuffer()
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), icoBuffer)
  console.log('  ✓ favicon.ico (32x32)')
  
  console.log('Done!')
}

main().catch(console.error)

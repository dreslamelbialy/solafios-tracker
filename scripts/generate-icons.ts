// Generate PWA icons from a polished SVG design
import sharp from 'sharp'
import * as fs from 'fs'
import * as path from 'path'

// Polished icon design: beaker in white, centered, with gradient bg
// Using a bigger viewBox for better quality
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F67B56"/>
      <stop offset="50%" stop-color="#E08B7C"/>
      <stop offset="100%" stop-color="#C19BE9"/>
    </linearGradient>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="8"/>
      <feOffset dx="0" dy="6" result="offsetblur"/>
      <feFlood flood-color="rgba(0,0,0,0.25)"/>
      <feComposite in2="offsetblur" operator="in"/>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <!-- Background: full bleed gradient -->
  <rect width="512" height="512" fill="url(#bg)"/>
  <!-- Beaker icon (white) centered -->
  <g transform="translate(156, 100) scale(8.33)" filter="url(#shadow)">
    <path d="M22 14h20v6h-2v18a8 8 0 0 1-8 8 8 8 0 0 1-8-8V20h-2v-6z" fill="white"/>
    <path d="M26 24h12M26 30h12M26 36h8" stroke="#F67B56" stroke-width="2" stroke-linecap="round"/>
    <circle cx="32" cy="48" r="3" fill="white"/>
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
  console.log('Generating PWA icons (polished)...')
  
  // Save the SVG (for reference)
  fs.writeFileSync(path.join(PUBLIC_DIR, 'logo.svg'), SVG)
  console.log('  ✓ logo.svg updated')
  
  for (const { name, size } of sizes) {
    const outPath = path.join(ICONS_DIR, name)
    await sharp(Buffer.from(SVG))
      .resize(size, size)
      .png()
      .toFile(outPath)
    console.log(`  ✓ ${name} (${size}x${size})`)
  }
  
  // Also create a favicon.ico (just rename favicon-32.png as ico, browsers will accept png)
  // Actually let's create a real ico using sharp
  const icoBuffer = await sharp(Buffer.from(SVG))
    .resize(32, 32)
    .png()
    .toBuffer()
  // ICO format is complex; we'll just use PNG as favicon.ico (most browsers accept it)
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), icoBuffer)
  console.log('  ✓ favicon.ico (32x32)')
  
  console.log('Done!')
}

main().catch(console.error)

// Generate PWA icons from logo.svg
import sharp from 'sharp'
import * as fs from 'fs'
import * as path from 'path'

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F67B56"/>
      <stop offset="100%" stop-color="#C19BE9"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="128" fill="url(#bg)"/>
  <g transform="translate(128, 96) scale(11)">
    <path d="M22 14h20v6h-2v18a8 8 0 0 1-8 8 8 8 0 0 1-8-8V20h-2v-6z" fill="white" opacity="0.95"/>
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

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-32.png', size: 32 },
  { name: 'icon-16.png', size: 16 },
  { name: 'favicon.png', size: 64 },
]

async function main() {
  console.log('Generating PWA icons...')
  
  for (const { name, size } of sizes) {
    const outPath = path.join(ICONS_DIR, name)
    await sharp(Buffer.from(SVG))
      .resize(size, size)
      .png()
      .toFile(outPath)
    console.log(`  ✓ ${name} (${size}x${size})`)
  }
  
  // Also update the main logo.svg
  fs.writeFileSync(path.join(PUBLIC_DIR, 'logo.svg'), SVG)
  console.log('  ✓ logo.svg updated')
  
  console.log('Done!')
}

main().catch(console.error)

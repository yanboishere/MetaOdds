import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const sizes = [16, 48, 128]
const outputDir = 'public/icons'

// Create a simple colored square with text
async function generateIcon(size) {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="#4F46E5"/>
      <text x="${size/2}" y="${size * 0.7}" font-size="${size * 0.5}" text-anchor="middle" fill="white" font-family="Arial">📊</text>
    </svg>
  `
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(outputDir, `icon${size}.png`))
  
  console.log(`Generated icon${size}.png`)
}

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

// Generate all sizes
for (const size of sizes) {
  await generateIcon(size)
}

console.log('All icons generated!')

/**
 * PWA Icon Generator Script
 * 
 * This script creates placeholder icons for PWA.
 * For production, replace with actual high-quality icons using tools like:
 * - https://realfavicongenerator.net/
 * - https://www.pwabuilder.com/imageGenerator
 */

const fs = require('fs');
const path = require('path');

const iconsDir = path.join(process.cwd(), 'public', 'icons');
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('🎨 Generating PWA icon placeholders...\n');

// Create SVG template for each size
sizes.forEach(size => {
  const filename = `icon-${size}x${size}.png`;
  const filepath = path.join(iconsDir, filename);
  
  // Create simple SVG placeholder
  const svg = `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Gold gradient background -->
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#d4af37;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#c9a434;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="url(#grad)" />
  
  <!-- Navy border -->
  <rect x="${size * 0.05}" y="${size * 0.05}" 
        width="${size * 0.9}" height="${size * 0.9}" 
        fill="none" stroke="#1a2332" stroke-width="${size * 0.02}" 
        rx="${size * 0.1}" />
  
  <!-- Text: BB -->
  <text x="50%" y="50%" 
        font-family="Arial, sans-serif" 
        font-size="${size * 0.35}" 
        font-weight="bold" 
        fill="#1a2332" 
        text-anchor="middle" 
        dominant-baseline="middle">BB</text>
</svg>
  `.trim();
  
  fs.writeFileSync(filepath, svg);
  console.log(`✓ Created ${filename} (${size}x${size})`);
});

console.log('\n✅ Icon placeholders generated!');
console.log('\n📝 Next steps:');
console.log('1. Replace placeholders with real icons using:');
console.log('   - https://realfavicongenerator.net/');
console.log('   - https://www.pwabuilder.com/imageGenerator');
console.log('2. Use your logo/brand image for best results');
console.log('3. Ensure icons are high quality (512x512 minimum)');

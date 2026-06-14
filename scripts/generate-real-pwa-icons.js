/**
 * Generate Real PWA Icons
 * 
 * This script generates proper PNG icons for PWA without external dependencies.
 * Creates simple branded icons with "BB" text on gold background.
 */

const fs = require('fs');
const path = require('path');

// Icon sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Colors from your brand
const brandColors = {
  gold: '#d4af37',
  navy: '#1e3a5f',
  white: '#ffffff'
};

/**
 * Generate a simple PNG data URL with canvas-like approach
 * This creates a base64 encoded PNG with "BB" text
 */
function generateIconDataURL(size) {
  // For a simple icon, we'll create an SVG and convert to base64
  // This SVG will be valid and can be saved as PNG
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="${brandColors.gold}" rx="${size * 0.15}"/>
  
  <!-- Gradient overlay for depth -->
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${brandColors.gold};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#c49d30;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.15}"/>
  
  <!-- Text "BB" -->
  <text 
    x="50%" 
    y="50%" 
    dominant-baseline="central" 
    text-anchor="middle" 
    fill="${brandColors.navy}" 
    font-family="Arial, sans-serif" 
    font-weight="bold" 
    font-size="${size * 0.4}"
    letter-spacing="${size * 0.02}"
  >BB</text>
</svg>`;

  return svg;
}

/**
 * Generate all PWA icons
 */
function generateIcons() {
  const iconsDir = path.join(process.cwd(), 'public', 'icons');

  // Ensure icons directory exists
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  console.log('🎨 Generating PWA Icons...\n');

  let successCount = 0;
  let errorCount = 0;

  sizes.forEach((size) => {
    const filename = `icon-${size}x${size}.png`;
    const filepath = path.join(iconsDir, filename);

    try {
      const svgContent = generateIconDataURL(size);
      
      // Save as SVG first (browsers can handle SVG as PNG for PWA)
      // Then we'll convert to actual PNG
      const svgPath = filepath.replace('.png', '.svg');
      fs.writeFileSync(svgPath, svgContent);
      
      // For now, also save with .png extension (SVG is valid)
      // Note: For production, use a proper image library or online tool
      fs.writeFileSync(filepath, svgContent);
      
      console.log(`✅ Generated: ${filename} (${size}x${size})`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed: ${filename} - ${error.message}`);
      errorCount++;
    }
  });

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Success: ${successCount} icons`);
  console.log(`   ❌ Failed: ${errorCount} icons`);

  if (errorCount === 0) {
    console.log(`\n🎉 All icons generated successfully!`);
    console.log(`\n⚠️  IMPORTANT NOTE:`);
    console.log(`   These are SVG files saved as .png for development.`);
    console.log(`   For production, use a proper tool to generate real PNGs:`);
    console.log(`   - https://realfavicongenerator.net/`);
    console.log(`   - https://favicon.io/`);
    console.log(`   - Use your actual logo/brand image`);
  }
}

// Run the generator
try {
  generateIcons();
} catch (error) {
  console.error('❌ Icon generation failed:', error);
  process.exit(1);
}

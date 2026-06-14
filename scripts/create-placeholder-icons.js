/**
 * Create Valid Placeholder PNG Icons
 * 
 * This creates minimal valid PNG files to stop PWA manifest errors.
 * These are temporary placeholders - replace with real icons later.
 */

const fs = require('fs');
const path = require('path');

// Minimal valid PNG file (1x1 transparent pixel)
// This is a base64 encoded 1x1 transparent PNG
const MINIMAL_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// Icon sizes
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

function createPlaceholderIcon(size) {
  // Convert base64 to buffer
  const buffer = Buffer.from(MINIMAL_PNG_BASE64, 'base64');
  return buffer;
}

function generatePlaceholderIcons() {
  const iconsDir = path.join(process.cwd(), 'public', 'icons');

  // Ensure icons directory exists
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  console.log('🔧 Creating valid PNG placeholder icons...\n');

  let successCount = 0;

  sizes.forEach((size) => {
    const filename = `icon-${size}x${size}.png`;
    const filepath = path.join(iconsDir, filename);

    try {
      const pngBuffer = createPlaceholderIcon(size);
      fs.writeFileSync(filepath, pngBuffer);
      
      console.log(`✅ Created: ${filename}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed: ${filename} - ${error.message}`);
    }
  });

  console.log(`\n📊 Created ${successCount}/${sizes.length} placeholder icons`);
  console.log(`\n✅ PWA manifest errors should be fixed!`);
  console.log(`\n⚠️  NEXT STEPS:`);
  console.log(`   1. Open: http://localhost:3002/generate-icons.html`);
  console.log(`   2. Click "Generate All Icons"`);
  console.log(`   3. Download and replace these placeholders`);
  console.log(`   4. Or use: https://realfavicongenerator.net/`);
}

// Run the generator
try {
  generatePlaceholderIcons();
} catch (error) {
  console.error('❌ Failed to create placeholders:', error);
  process.exit(1);
}

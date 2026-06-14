/**
 * Test Cloudinary Configuration
 * 
 * This script checks if Cloudinary credentials are properly loaded
 */

console.log('🔍 Checking Cloudinary Configuration...\n');

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log('Environment variables:');
console.log('CLOUDINARY_CLOUD_NAME:', cloudName ? '✅ Set' : '❌ Missing');
console.log('CLOUDINARY_API_KEY:', apiKey ? '✅ Set' : '❌ Missing');
console.log('CLOUDINARY_API_SECRET:', apiSecret ? '✅ Set (first 5 chars: ' + apiSecret?.substring(0, 5) + '...)' : '❌ Missing');

if (cloudName && apiKey && apiSecret) {
  console.log('\n✅ All Cloudinary credentials are configured!');
  console.log('\nCredentials loaded from:');
  console.log('  - .env.local (if exists)');
  console.log('  - .env (if exists)');
  console.log('\n📋 Your configuration:');
  console.log('  Cloud Name:', cloudName);
  console.log('  API Key:', apiKey);
  console.log('  API Secret:', apiSecret.substring(0, 8) + '...');
} else {
  console.log('\n❌ Cloudinary credentials are MISSING!');
  console.log('\n📋 Add these to .env.local:');
  console.log('CLOUDINARY_CLOUD_NAME=your_cloud_name');
  console.log('CLOUDINARY_API_KEY=your_api_key');
  console.log('CLOUDINARY_API_SECRET=your_api_secret');
}

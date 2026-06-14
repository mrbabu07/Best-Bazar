/**
 * Warm Next.js cache by precompiling frequently accessed routes
 * Run this after starting dev server to speed up first loads
 */

const http = require('http');

const port = process.env.PORT || '3002';

// Admin routes that are frequently accessed
const adminRoutes = [
  '/en/admin/dashboard',
  '/en/admin/orders',
  '/en/admin/products',
  '/en/admin/settings',
  '/en/admin/users',
  '/en/admin/categories',
  '/en/admin/banners',
  '/en/admin/coupons',
  '/en/admin/reviews',
];

// Storefront routes (optional)
const storefrontRoutes = [
  '/en',
  '/ar',
];

const routes = [...adminRoutes, ...storefrontRoutes];

console.log(`\n🔥 Warming Next.js cache on port ${port}...\n`);

let completed = 0;
let failed = 0;

routes.forEach((route, i) => {
  setTimeout(() => {
    const startTime = Date.now();
    
    http.get(`http://localhost:${port}${route}`, (res) => {
      const duration = Date.now() - startTime;
      completed++;
      
      if (res.statusCode === 200) {
        console.log(`✓ ${route.padEnd(35)} (${res.statusCode}) - ${duration}ms`);
      } else {
        console.log(`⚠ ${route.padEnd(35)} (${res.statusCode}) - ${duration}ms`);
      }
      
      if (completed + failed === routes.length) {
        console.log(`\n🎉 Cache warming complete! ${completed} successful, ${failed} failed.\n`);
      }
    }).on('error', (err) => {
      failed++;
      console.log(`✗ ${route.padEnd(35)} - Error: ${err.message}`);
      
      if (completed + failed === routes.length) {
        console.log(`\n🎉 Cache warming complete! ${completed} successful, ${failed} failed.\n`);
      }
    });
  }, i * 500); // Stagger requests by 500ms
});

// Add timeout to prevent hanging
setTimeout(() => {
  if (completed + failed < routes.length) {
    console.log(`\n⚠️  Timeout: Only ${completed + failed}/${routes.length} routes completed.\n`);
    console.log('Make sure dev server is running on port', port);
    process.exit(1);
  }
}, routes.length * 500 + 10000); // Give extra time for slow routes

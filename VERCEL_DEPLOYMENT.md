# 🚀 Vercel Deployment Guide

## ✅ Project Ready for Vercel!

Your project is configured and ready to deploy to Vercel.

---

## 📋 Pre-Deployment Checklist

- [x] Next.js 14 configured
- [x] `.gitignore` configured (env files excluded)
- [x] `.vercelignore` created
- [x] `vercel.json` configured
- [x] Prisma setup complete
- [x] PWA configured
- [x] All code committed to Git

---

## 🎯 Deployment Steps

### Step 1: Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Ready for Vercel deployment"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/best-bazar.git

# Push
git push -u origin main
```

---

### Step 2: Import to Vercel

1. **Visit:** https://vercel.com/new

2. **Import Git Repository:**
   - Click "Import Git Repository"
   - Select your GitHub repo
   - Click "Import"

3. **Configure Project:**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./` (keep default)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)

4. **Click "Deploy"**

---

### Step 3: Add Environment Variables

**IMPORTANT:** Add these in Vercel Dashboard before deployment works!

1. **Go to:** Project Settings → Environment Variables

2. **Add these variables:**

```env
# Database
DATABASE_URL=your_neon_database_url_here

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://your-project.vercel.app

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Payment Settings
STRIPE_MODE=payment_element
COD_ENABLED=true

# Admin Credentials
SEED_ADMIN_PASSWORD=your_admin_password
SEED_USER_PASSWORD=your_user_password
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your_admin_password
ADMIN_NAME=Admin
```

3. **Environment:** Select **All** (Production, Preview, Development)

4. **Click "Save"**

---

### Step 4: Redeploy

After adding environment variables:

1. Go to **Deployments** tab
2. Click **⋮** (three dots) on latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

---

### Step 5: Update NEXTAUTH_URL

1. After first deployment, copy your Vercel URL: `https://your-project.vercel.app`

2. Update `NEXTAUTH_URL` environment variable:
   - Go to Settings → Environment Variables
   - Find `NEXTAUTH_URL`
   - Change to your actual Vercel URL
   - Save

3. Redeploy again

---

### Step 6: Setup Custom Domain (Optional)

1. **Go to:** Settings → Domains

2. **Add domain:**
   - Enter your domain: `yourdomain.com`
   - Follow DNS configuration instructions
   - Add both `yourdomain.com` and `www.yourdomain.com`

3. **Update NEXTAUTH_URL** to your custom domain

---

## ⚠️ Important Notes

### 1. Database Connection

Your Neon PostgreSQL database is already configured. Vercel will connect automatically.

**If you see connection errors:**
- Check Neon dashboard: https://console.neon.tech/
- Verify connection string in environment variables
- Check connection limits (increase if needed)

---

### 2. WebSocket Limitation

**Vercel does NOT support WebSocket!**

The custom server (`server.js`) with Socket.IO will NOT work on Vercel.

**Options:**
1. **Remove WebSocket** (simplest for Vercel)
2. **Use Vercel + separate WebSocket server** (Railway, Render)
3. **Deploy to different platform** (Railway, Render, DigitalOcean)

**For Vercel deployment, we'll disable WebSocket temporarily.**

---

### 3. Serverless Functions

Vercel uses serverless functions for API routes:
- Each API route is a separate serverless function
- No persistent connections (stateless)
- Cold starts possible (first request slower)

---

### 4. Build Time

First deployment takes 3-5 minutes:
- Installing dependencies
- Building Next.js app
- Optimizing assets
- Running Prisma generate

---

## 🔧 Vercel-Specific Configuration

### Disable Custom Server for Vercel

Since Vercel doesn't support custom servers, we use standard Next.js:

**`package.json` scripts are already correct:**
```json
{
  "scripts": {
    "build": "next build",  ← Vercel uses this
    "start": "next start"    ← Standard Next.js start
  }
}
```

---

## 🐛 Troubleshooting

### Build Fails

**Check build logs in Vercel dashboard**

Common issues:
- Missing environment variables
- TypeScript errors
- Prisma client not generated

**Solution:** Fix errors and redeploy

---

### Database Connection Error

```
Error: P1001: Can't reach database server
```

**Solution:**
- Check DATABASE_URL is correct
- Check Neon database is running
- Check connection string format
- Add `?connection_limit=1` to DATABASE_URL

---

### 404 on API Routes

**Solution:**
- Check API routes are in `app/api/` folder
- Check file naming: `route.ts` not `route.tsx`
- Redeploy

---

### Image Optimization Error

```
Error: Invalid src prop
```

**Solution:**
- Add Cloudinary domain to `next.config.mjs`:
```javascript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'res.cloudinary.com',
    }
  ]
}
```

---

## 📊 Post-Deployment Checklist

After successful deployment:

- [ ] Visit your site: `https://your-project.vercel.app`
- [ ] Test homepage loads
- [ ] Test product pages
- [ ] Test admin login
- [ ] Test image upload
- [ ] Test checkout flow
- [ ] Test mobile responsiveness
- [ ] Check PWA installation
- [ ] Setup custom domain (if applicable)
- [ ] Configure Stripe webhook (production)
- [ ] Test payment flow
- [ ] Monitor Vercel analytics

---

## 🎯 Vercel Dashboard Features

### Analytics
- Page views
- Visitors
- Core Web Vitals
- Performance metrics

### Logs
- Real-time function logs
- Error tracking
- Build logs

### Deployments
- Automatic deployment on git push
- Preview deployments for branches
- Instant rollback

---

## 🚀 Auto-Deploy Setup

Vercel automatically deploys when you push to git:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push

# Vercel automatically:
# 1. Detects push
# 2. Builds project
# 3. Deploys to production
# 4. Sends notification
```

**Preview deployments:**
- Every branch gets its own URL
- Test changes before merging
- Share with team for review

---

## 💰 Vercel Pricing

**Hobby (Free):**
- ✅ Unlimited projects
- ✅ 100GB bandwidth
- ✅ Serverless functions
- ✅ Auto SSL
- ✅ Perfect for this project!

**Pro ($20/month):**
- More bandwidth
- More build minutes
- Team collaboration
- Analytics

---

## 🇧🇩 বাংলা নির্দেশিকা

### Vercel এ Deploy করুন:

**১. GitHub এ Push করুন:**
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

**২. Vercel এ Import করুন:**
- যান: https://vercel.com/new
- GitHub repo select করুন
- Click "Import"

**৩. Environment Variables যোগ করুন:**
- Settings → Environment Variables
- সব env variables copy করুন
- `NEXTAUTH_URL` change করুন: `https://your-project.vercel.app`

**৪. Redeploy করুন:**
- Deployments tab
- Click "Redeploy"

**৫. Live site দেখুন:**
- `https://your-project.vercel.app`

### ⚠️ WebSocket কাজ করবে না:
- Vercel এ WebSocket support নেই
- সব feature কাজ করবে শুধু real-time notification ছাড়া
- অন্য platform এ deploy করলে WebSocket কাজ করবে

---

## ✅ Summary

**Ready to deploy:**
- ✅ All files configured
- ✅ Git ready
- ✅ Vercel configuration ready
- ✅ Environment variables documented

**Next steps:**
1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy!

**Time needed:** 10-15 minutes

---

**Your project is production-ready! 🎉**

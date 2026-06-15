# 🔧 Vercel Environment Variables Setup

## ✅ Fix for "Secret does not exist" Error

The error is fixed! Now add environment variables manually in Vercel dashboard.

---

## 📋 Step-by-Step Instructions

### Step 1: Go to Vercel Dashboard

After importing your project, go to:

**Settings** → **Environment Variables**

Or visit: `https://vercel.com/[your-username]/best-bazar/settings/environment-variables`

---

### Step 2: Add Each Variable

Click **"Add New"** for each variable below:

---

### 🗄️ Database Variables:

**1. DATABASE_URL**
```
your_postgresql_database_url_here
```
⚠️ Copy from your `.env` file
Environment: **All**

---

### 🔐 Authentication Variables:

**2. NEXTAUTH_SECRET**
```
your_nextauth_secret_here
```
⚠️ Copy from your `.env` file
Environment: **All**

**3. NEXTAUTH_URL**
```
https://your-project-name.vercel.app
```
⚠️ **IMPORTANT:** Replace with your actual Vercel URL after first deployment!
Environment: **All**

**4. NEXT_PUBLIC_SITE_URL**
```
https://your-project-name.vercel.app
```
⚠️ **IMPORTANT:** Replace with your actual Vercel URL after first deployment!
Environment: **All**

---

### ☁️ Cloudinary Variables:

**5. CLOUDINARY_CLOUD_NAME**
```
your_cloudinary_cloud_name
```
⚠️ Copy from your `.env` file
Environment: **All**

**6. CLOUDINARY_API_KEY**
```
your_cloudinary_api_key
```
⚠️ Copy from your `.env` file
Environment: **All**

**7. CLOUDINARY_API_SECRET**
```
your_cloudinary_api_secret
```
⚠️ Copy from your `.env` file
Environment: **All**

---

### 💳 Stripe Variables:

**8. STRIPE_SECRET_KEY**
```
sk_test_your_stripe_secret_key_here
```
⚠️ Use your actual Stripe secret key from `.env` file
Environment: **All**

**9. STRIPE_WEBHOOK_SECRET**
```
(leave empty for now)
```
Environment: **All**

**10. NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**
```
pk_test_your_stripe_publishable_key_here
```
⚠️ Use your actual Stripe publishable key from `.env` file
Environment: **All**

**11. STRIPE_MODE**
```
payment_element
```
Environment: **All**

**12. COD_ENABLED**
```
true
```
Environment: **All**

---

### 👤 Admin Variables (Optional):

**13. SEED_ADMIN_PASSWORD**
```
your_admin_seed_password
```
⚠️ Copy from your `.env` file
Environment: **All**

**14. SEED_USER_PASSWORD**
```
your_user_seed_password
```
⚠️ Copy from your `.env` file
Environment: **All**

**15. ADMIN_EMAIL**
```
admin@yourdomain.com
```
Environment: **All**

**16. ADMIN_PASSWORD**
```
your_admin_password
```
Environment: **All**

**17. ADMIN_NAME**
```
Admin
```
Environment: **All**

---

### Step 3: Save All Variables

After adding each variable:
1. Click **"Save"**
2. Make sure **"All"** environments are selected

---

### Step 4: Deploy

After adding all variables:

1. Go to **"Deployments"** tab
2. Click **"Redeploy"** on latest deployment
3. Or just click **"Deploy"** if not deployed yet

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Site loads (homepage)
- [ ] Products page works
- [ ] Images load
- [ ] Admin login works (`/en/admin/dashboard`)
- [ ] No database errors

---

## 🔄 Update NEXTAUTH_URL After First Deploy

After your first successful deployment:

1. Copy your Vercel URL: `https://your-project-xxx.vercel.app`

2. Update these two variables:
   - `NEXTAUTH_URL`
   - `NEXT_PUBLIC_SITE_URL`

3. Change from placeholder to actual URL

4. **Redeploy** again

---

## 🇧🇩 বাংলা নির্দেশিকা

### Error Fix হয়ে গেছে! ✅

এখন Vercel dashboard এ manually environment variables add করুন:

**১. Settings → Environment Variables এ যান**

**২. "Add New" click করে প্রতিটি variable add করুন:**

```
DATABASE_URL → Your database URL
NEXTAUTH_SECRET → Your secret
NEXTAUTH_URL → https://your-vercel-url.vercel.app
CLOUDINARY_* → Your Cloudinary credentials
STRIPE_* → Your Stripe keys
```

**৩. সব variables add করার পর "Save"**

**৪. "Redeploy" click করুন**

**৫. 2-3 মিনিট wait করুন**

**৬. Site live হবে!** ✅

---

## 📊 Total Variables: 17

Make sure you add all 17 environment variables!

---

## ⚠️ Common Mistakes

### 1. Wrong NEXTAUTH_URL
```
❌ http://localhost:3002
✅ https://your-project.vercel.app
```

### 2. Missing Environment Selection
Make sure to select **"All"** for each variable!

### 3. Extra Spaces
Don't add spaces before/after values!

---

## 🚀 After Adding All Variables

Your deployment should succeed and you'll see:

```
✅ Build completed
✅ Deployment ready
✅ Visit: https://your-project.vercel.app
```

---

## 🆘 Still Getting Errors?

Check Vercel deployment logs:
1. Go to **Deployments** tab
2. Click on latest deployment
3. Check **Build Logs**
4. Look for specific error message

Share the error message and I'll help fix it!

---

**The fix is pushed to GitHub. Now just add environment variables in Vercel dashboard!** ✅

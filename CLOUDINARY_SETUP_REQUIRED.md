# ⚠️ Cloudinary Setup Required!

## 🔴 Problem Found

The **500 error** is happening because **Cloudinary credentials are missing** from your `.env` file!

---

## ❌ Current Status

Your `.env` file has:
```
✅ DATABASE_URL
✅ NEXTAUTH_SECRET
✅ NEXTAUTH_URL
❌ CLOUDINARY_CLOUD_NAME (MISSING)
❌ CLOUDINARY_API_KEY (MISSING)
❌ CLOUDINARY_API_SECRET (MISSING)
```

**Without Cloudinary credentials, image/video uploads cannot work!**

---

## ✅ Solution: Setup Cloudinary (5 minutes)

### Step 1: Create Cloudinary Account (FREE)

1. **Visit:** https://cloudinary.com/users/register/free

2. **Sign up:**
   - Email address
   - Password
   - Choose a cloud name (example: `best-bazar-shop`)

3. **Verify email** (check inbox)

4. **Login:** https://cloudinary.com/console

---

### Step 2: Get Your Credentials

1. **Dashboard:** https://cloudinary.com/console

2. **You'll see:**
   ```
   Cloud name: best-bazar-shop
   API Key: 123456789012345
   API Secret: abcdefghijklmnopqrstuvwxyz
   ```

3. **Click "Copy" on each value**

---

### Step 3: Add to .env File

**Open:** `e:\programming hero\Best Bazar\.env`

**Add these lines:**
```env
# Cloudinary (for image/video uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

**Example:**
```env
CLOUDINARY_CLOUD_NAME=best-bazar-shop
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz1234
```

---

### Step 4: Restart Server

```bash
# Stop current server
Ctrl+C

# Restart
npm run dev
```

---

### Step 5: Test Upload

1. Login as admin
2. Go to: http://localhost:3002/en/admin/banners
3. Click "Upload image or video"
4. Select an image
5. Should upload successfully! ✅

---

## 📊 Cloudinary Free Tier

**Includes:**
- ✅ 25 GB storage
- ✅ 25 GB bandwidth/month
- ✅ Image optimization
- ✅ Video hosting
- ✅ Image transformations
- ✅ CDN delivery

**Perfect for development and small projects!**

---

## 🔧 Alternative: Use Different Upload Method

If you don't want to use Cloudinary, you can:

### Option 1: Local File Storage

Create `app/api/upload-local/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { requireAdmin } from "@/lib/api/admin";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Save to public/uploads
    const filename = `${Date.now()}-${file.name}`;
    const filepath = join(process.cwd(), "public", "uploads", filename);
    
    await writeFile(filepath, buffer);
    
    return NextResponse.json({
      secureUrl: `/uploads/${filename}`
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
```

**Note:** This stores files locally, not recommended for production.

---

### Option 2: AWS S3

Install AWS SDK:
```bash
npm install @aws-sdk/client-s3
```

Configure S3 upload - more complex but production-ready.

---

### Option 3: Vercel Blob Storage

If deploying to Vercel:
```bash
npm install @vercel/blob
```

---

## 🚀 Recommended: Use Cloudinary

**Why Cloudinary is best:**
- ✅ Free tier generous
- ✅ Easy setup (5 minutes)
- ✅ Image optimization automatic
- ✅ Video support built-in
- ✅ CDN included
- ✅ No server storage needed
- ✅ Transformations on-the-fly

---

## 📋 Quick Checklist

- [ ] Create Cloudinary account
- [ ] Get credentials (cloud name, API key, API secret)
- [ ] Add to `.env` file
- [ ] Restart dev server
- [ ] Test image upload
- [ ] Test video upload

**Time needed:** 5-10 minutes

---

## 🇧🇩 বাংলা নির্দেশিকা

### সমস্যা:
```
❌ 500 Error কারণ Cloudinary credentials নেই
```

### সমাধান (৫ মিনিট):

**1. Cloudinary Account তৈরি করুন:**
- যান: https://cloudinary.com/users/register/free
- Sign up করুন (FREE)
- Email verify করুন

**2. Credentials নিন:**
- Dashboard: https://cloudinary.com/console
- Copy করুন: Cloud name, API key, API secret

**3. .env ফাইলে যোগ করুন:**
```env
CLOUDINARY_CLOUD_NAME=আপনার_cloud_name
CLOUDINARY_API_KEY=আপনার_api_key
CLOUDINARY_API_SECRET=আপনার_api_secret
```

**4. Server restart করুন:**
```bash
Ctrl+C
npm run dev
```

**5. Test করুন:**
- Admin banners page এ যান
- Image upload করুন
- কাজ করবে! ✅

---

## ✅ After Setup

Once Cloudinary is configured:

```
✅ Image uploads will work
✅ Video uploads will work
✅ No more 500 errors
✅ Files stored on Cloudinary CDN
✅ Automatic optimization
✅ Fast delivery worldwide
```

---

## 📞 Need Help?

**Cloudinary Support:**
- Docs: https://cloudinary.com/documentation
- Getting Started: https://cloudinary.com/documentation/node_integration

**Common Issues:**
- Forgot credentials: Check Cloudinary dashboard
- Account not verified: Check email
- API limits: Check usage in dashboard

---

**Setup Cloudinary first, then uploads will work! 🚀**

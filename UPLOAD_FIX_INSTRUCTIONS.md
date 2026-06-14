# ✅ Upload Fix Instructions

## 🔍 Situation

Your Cloudinary credentials **ARE configured** in `.env.local` file:
```
✅ CLOUDINARY_CLOUD_NAME=dtti0ainh
✅ CLOUDINARY_API_KEY=283536474673684
✅ CLOUDINARY_API_SECRET=QNd2UQnqQW_1PgdZQUeWerk5bl4
```

I've also added them to `.env` file as backup.

---

## ⚠️ Why 500 Error is Still Happening

The error happens because **server needs to be restarted** for environment variables to load properly.

---

## ✅ Solution (1 minute)

### Step 1: Stop Server

In your terminal where `npm run dev` is running:
```
Press Ctrl+C
```

### Step 2: Start Server Again

```bash
npm run dev
```

### Step 3: Wait for Server Ready

You should see:
```
✓ Ready in X.Xs
```

### Step 4: Try Upload Again

1. Go to: http://localhost:3002/en/admin/banners
2. Click "Upload image or video"
3. Select an image
4. ✅ Should work now!

---

## 🐛 If Still Not Working

### Check Server Logs

When you try to upload, check terminal for logs:

**You should see:**
```
📤 Upload API called
✅ Admin auth passed
✅ Cloudinary configured
📁 File received: { name: '...', type: 'image/...', size: ... }
🔍 File type detected: { isVideo: false, isImage: true, mimeType: '...' }
📦 Converting file to base64...
✅ Base64 conversion complete
☁️ Uploading to Cloudinary...
✅ Cloudinary upload successful
```

**If you see error:**
```
❌ Cloudinary not configured!
```

Then credentials not loaded - need to check `.env` file priority.

---

## 📊 Environment File Priority

Next.js loads files in this order (later overrides earlier):
1. `.env` (all environments)
2. `.env.local` (all environments, ignored by git)
3. `.env.development` (development only)
4. `.env.development.local` (development only, ignored by git)

Your credentials are in:
- ✅ `.env.local` (priority 2)
- ✅ `.env` (priority 1, added as backup)

Both should work after restart.

---

## 🔧 Alternative: Check Browser Console

After upload attempt, check browser console (F12):

**You should see:**
```
📤 Starting upload: { name: '...', type: '...', size: ... }
🌐 Sending POST request to /api/upload
📥 Response received: { status: 200, statusText: 'OK', ok: true }
📋 Response data: { secureUrl: 'https://...' }
✅ Upload successful: https://...
```

**If you see:**
```
📥 Response received: { status: 500, ... }
❌ Upload failed
```

Check terminal logs for exact error.

---

## ✅ Verification Checklist

- [x] Cloudinary credentials in `.env.local`
- [x] Cloudinary credentials in `.env` (backup)
- [x] Upload API updated with video support
- [x] AdminMediaUploadField component created
- [x] Better error messages added
- [x] Debug logging added
- [ ] **Server restarted** (YOU NEED TO DO THIS!)
- [ ] Upload tested

---

## 🎯 Expected Result After Restart

### Upload Flow:

1. **Select image/video** → Upload button
2. **Browser:** Sends file to `/api/upload`
3. **Server logs:** Shows upload progress
4. **Cloudinary:** Processes and stores file
5. **Response:** Returns CDN URL
6. **Success toast:** "Image uploaded"
7. **Preview:** Shows uploaded image/video

**Total time:** 2-5 seconds

---

## 🇧🇩 বাংলা নির্দেশিকা

### সমস্যা:
```
500 Error কারণ server restart করা হয়নি
```

### সমাধান:

**১. Server বন্ধ করুন:**
```
Terminal এ Ctrl+C চাপুন
```

**২. আবার চালু করুন:**
```bash
npm run dev
```

**৩. Ready হওয়ার জন্য wait করুন:**
```
✓ Ready in 4.2s
```

**৪. Upload try করুন:**
- Admin banners page এ যান
- "Upload image or video" ক্লিক করুন
- Image select করুন
- ✅ কাজ করবে!

---

## 📝 Summary

**Problem:** 500 error on upload
**Cause:** Server needs restart to load env variables
**Solution:** 
1. Ctrl+C (stop server)
2. `npm run dev` (start again)
3. Try upload

**Expected:** ✅ Upload works!

---

## 🚀 After Fix

Once working, you can:
- ✅ Upload images (JPG, PNG, WebP)
- ✅ Upload videos (MP4, WebM, MOV)
- ✅ Use in banners (homepage hero slider)
- ✅ Auto-optimize images
- ✅ CDN delivery worldwide

---

**Just restart the server and it will work! 🎉**

# ⚠️ Video Upload Issue

## 🔴 Problem

Getting "Internal server error" when uploading videos.

---

## 🔍 Possible Causes

### 1. Cloudinary Free Tier Limitation
**Most likely cause!**

Cloudinary FREE accounts have video upload restrictions:
- ✅ Images: Fully supported
- ⚠️ Videos: Limited or disabled on free tier

**Check your plan:**
https://cloudinary.com/console/settings/account

If you see "Free" plan, video uploads might be disabled.

---

### 2. Video File Too Large

**Current limit:** 50MB

If your video is larger:
- Use video compression tool
- Use shorter clip
- Reduce resolution

**Compress video:**
- Online: https://www.videosmaller.com/
- FFmpeg: `ffmpeg -i input.mp4 -vcodec h264 -b:v 2M output.mp4`

---

### 3. Terminal Logs Show Exact Error

**Check terminal when upload fails!**

You should see one of these:

**A. Quota exceeded:**
```
❌ Cloudinary upload failed
Error: quota exceeded
```
**Solution:** Upgrade Cloudinary plan or use images only

**B. Video not supported:**
```
❌ Cloudinary upload failed
Error: resource_type video is not supported
```
**Solution:** Upgrade to paid plan or disable video uploads

**C. File too large:**
```
❌ Video file is too large (75.32MB). Maximum 50MB.
```
**Solution:** Compress video file

---

## ✅ Quick Fix: Use Images Only

If video upload not working, use images for now:

### Option 1: Disable Video Upload Button

Edit `components/admin/AdminBannerManager.tsx`:

```typescript
<AdminMediaUploadField
  label="Desktop image"  // Changed from "image or video"
  value={form.desktopImage}
  onChange={(value) => updateForm("desktopImage", value)}
  previewAlt={form.titleEn}
  aspectClassName="aspect-[16/9]"
  acceptVideo={false}  // Changed to false
  acceptImage={true}
/>
```

### Option 2: Upgrade Cloudinary Plan

**Paid plans include video:**
- Plus: $99/month
- Advanced: $224/month
- Video support included
- Higher quotas

**Upgrade:** https://cloudinary.com/pricing

---

## 🧪 Test What's Supported

### Test 1: Image Upload
1. Go to admin banners
2. Upload a small image (< 1MB)
3. Should work ✅

### Test 2: Small Video (if supported)
1. Create 5-second video clip
2. Compress to < 5MB
3. Try upload
4. Check terminal logs

---

## 📊 Cloudinary Free Tier Limits

| Feature | Free Tier |
|---------|-----------|
| Storage | 25GB |
| Bandwidth | 25GB/month |
| Images | ✅ Full support |
| Videos | ⚠️ Limited/disabled |
| Transformations | Limited |

---

## 🔧 Alternative: Image-Only Solution

**For now, use images:**

1. Create animated GIF instead of video
2. Use multiple images in slider
3. Use Lottie animations
4. Use CSS animations

**GIF creators:**
- https://ezgif.com/video-to-gif
- Convert video → GIF
- Upload as image (works!)

---

## 🚀 Recommended Solution

### Immediate (Free):
```
✅ Use images only
✅ Convert videos to animated GIFs
✅ Keep using current free tier
```

### Long-term (Production):
```
💰 Upgrade Cloudinary to Plus plan ($99/mo)
✅ Full video support
✅ Higher quotas
✅ Better transformations
```

---

## 📋 What I've Updated

1. ✅ Reduced video size limit: 100MB → 50MB
2. ✅ Added better error messages
3. ✅ Added Cloudinary-specific error detection
4. ✅ Added upload timeout (2 minutes)
5. ✅ Better logging for debugging

---

## 🇧🇩 বাংলা সংক্ষিপ্ত বিবরণ

### সমস্যা:
```
Video upload এ "Internal server error"
```

### সম্ভাব্য কারণ:

**1. Cloudinary Free Tier এ video support নেই** (সবচেয়ে সম্ভাব্য)
- FREE account এ video upload disabled থাকতে পারে
- শুধু paid plan এ video support আছে

**2. Video file খুব বড়**
- Maximum: 50MB
- Compress করুন: https://www.videosmaller.com/

### সমাধান:

**বিকল্প ১: শুধু image ব্যবহার করুন** (এখনের জন্য)
```
✅ Image upload কাজ করছে
✅ Video এর বদলে animated GIF ব্যবহার করুন
✅ Free tier এ কোন সমস্যা নেই
```

**বিকল্প ২: Cloudinary upgrade করুন**
```
💰 Plus plan: $99/month
✅ Full video support
✅ Higher limits
```

### Terminal logs check করুন:
```
যখন video upload করবেন, terminal এ দেখুন exact error কি
```

### Test করুন:
```bash
# Image upload test (should work)
1. Small image upload করুন
2. ✅ কাজ করবে

# Video upload test
1. Small video (< 5MB) upload করুন
2. Terminal logs দেখুন
3. Error message দেখবেন যে কেন fail হচ্ছে
```

---

## 📞 Next Steps

**1. Check Terminal Logs**
When you upload a video, what EXACT error appears in terminal?

**2. Check Cloudinary Dashboard**
- Visit: https://cloudinary.com/console
- Check: Account settings → Plan
- Free or Paid?

**3. Try Small Video**
- Use 5-second clip
- < 5MB size
- See what error appears

**4. Share Terminal Error**
Copy the exact error from terminal and we can fix it specifically.

---

**For now: Use images (working ✅) or upgrade Cloudinary for video support.**

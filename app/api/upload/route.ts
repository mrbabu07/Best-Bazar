import { NextResponse } from "next/server";
import { assertCloudinaryConfigured, cloudinary } from "@/lib/cloudinary";
import { optimizeCloudinaryImage } from "@/lib/images";
import { ApiError, handleApiError, requireAdmin } from "@/lib/api/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    console.log('📤 Upload API called');
    
    await requireAdmin();
    console.log('✅ Admin auth passed');
    
    // Check Cloudinary configuration with better error message
    try {
      assertCloudinaryConfigured();
      console.log('✅ Cloudinary configured');
    } catch (error) {
      console.error('❌ Cloudinary not configured!');
      throw new ApiError(
        "Cloudinary is not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your .env file. See CLOUDINARY_SETUP_REQUIRED.md for instructions.",
        503
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const folder = String(formData.get("folder") ?? "best-mart/uploads");

    console.log('📁 File received:', {
      name: file instanceof File ? file.name : 'not a file',
      type: file instanceof File ? file.type : 'unknown',
      size: file instanceof File ? file.size : 'unknown'
    });

    if (!(file instanceof File)) {
      throw new ApiError("A file field is required.", 422);
    }

    // Detect resource type based on file MIME type
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    
    console.log('🔍 File type detected:', { isVideo, isImage, mimeType: file.type });
    
    if (!isImage && !isVideo) {
      throw new ApiError("Only image and video files are supported.", 415);
    }

    // Size limits
    const maxImageSize = 10 * 1024 * 1024; // 10MB
    const maxVideoSize = 50 * 1024 * 1024; // 50MB (reduced for better compatibility)
    
    if (isImage && file.size > maxImageSize) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(2);
      throw new ApiError(`Image file is too large (${sizeMB}MB). Maximum size is 10MB. Please compress your image.`, 413);
    }
    
    if (isVideo && file.size > maxVideoSize) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(2);
      throw new ApiError(`Video file is too large (${sizeMB}MB). Maximum size is 50MB. Please compress your video or use a shorter clip.`, 413);
    }

    console.log('📦 Converting file to base64...');
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const dataUri = `data:${file.type};base64,${base64}`;
    console.log('✅ Base64 conversion complete, length:', base64.length);

    const resourceType = isVideo ? "video" : "image";
    
    console.log('☁️ Uploading to Cloudinary...', { 
      folder, 
      resourceType,
      fileSize: file.size,
      fileSizeMB: (file.size / 1024 / 1024).toFixed(2) + 'MB'
    });

    try {
      const upload = await cloudinary.uploader.upload(dataUri, {
        folder,
        resource_type: resourceType,
        timeout: 120000 // 2 minutes timeout
      });

      console.log('✅ Cloudinary upload successful:', {
        publicId: upload.public_id,
        format: upload.format,
        bytes: upload.bytes
      });

      // For images, optimize the URL. For videos, return as-is
      const secureUrl = isVideo 
        ? upload.secure_url 
        : optimizeCloudinaryImage(upload.secure_url, { width: 1800 });

      return NextResponse.json({
        publicId: upload.public_id,
        secureUrl,
        width: upload.width,
        height: upload.height,
        format: upload.format,
        bytes: upload.bytes,
        resourceType
      });
    } catch (cloudinaryError) {
      console.error('❌ Cloudinary upload failed:', cloudinaryError);
      
      // Check if it's a quota/limit error
      const errorMessage = cloudinaryError instanceof Error ? cloudinaryError.message : String(cloudinaryError);
      
      if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
        throw new ApiError(
          'Upload failed: Cloudinary quota exceeded. Please check your Cloudinary account limits or try a smaller file.',
          507
        );
      }
      
      if (errorMessage.includes('video')) {
        throw new ApiError(
          'Video upload failed. Your Cloudinary account may not support video uploads. Please check your plan or try uploading an image instead.',
          403
        );
      }
      
      throw new ApiError(
        `Upload to Cloudinary failed: ${errorMessage}`,
        500
      );
    }
  } catch (error) {
    console.error('❌ Upload API Error:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'no stack'
    });
    return handleApiError(error);
  }
}

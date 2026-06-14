"use client";

import Image from "next/image";
import { FileVideo, ImagePlus } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { imageUrlValidationMessage, isAllowedRemoteImage } from "@/lib/images";
import { safeResponseJson } from "@/lib/safe-json";

type AdminMediaUploadFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  previewAlt: string;
  aspectClassName?: string;
  acceptVideo?: boolean;
  acceptImage?: boolean;
};

export function AdminMediaUploadField({
  label,
  value,
  onChange,
  previewAlt,
  aspectClassName = "aspect-[4/3]",
  acceptVideo = false,
  acceptImage = true
}: AdminMediaUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const canPreview = isAllowedRemoteImage(value);
  const isVideo = value && (value.includes('.mp4') || value.includes('.webm') || value.includes('.mov') || value.includes('video'));

  // Determine accept attribute
  const getAcceptTypes = () => {
    const types = [];
    if (acceptImage) types.push('image/*');
    if (acceptVideo) types.push('video/*');
    return types.join(',');
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.set("file", file);
    setUploading(true);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const result = await safeResponseJson<{ error?: string; secureUrl?: string; resourceType?: string }>(response, {});

      if (!response.ok) {
        throw new Error(result?.error ?? "Unable to upload file.");
      }

      if (!result?.secureUrl) {
        throw new Error("Uploaded file URL was not returned.");
      }

      onChange(result.secureUrl);
      const fileType = result.resourceType === 'video' ? 'Video' : 'Image';
      toast.success(`${fileType} uploaded successfully`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to upload file.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold text-navy">{label}</label>
      {value ? (
        <div className={`relative overflow-hidden rounded-md border border-neutral-200 bg-neutral-100 ${aspectClassName}`}>
          {isVideo ? (
            <video 
              src={value} 
              controls 
              className="h-full w-full object-cover"
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          ) : canPreview ? (
            <Image src={value} alt={previewAlt || label} fill sizes="360px" className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center p-4 text-center text-xs font-semibold text-neutral-500">
              {imageUrlValidationMessage}
            </div>
          )}
        </div>
      ) : null}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="https://..."
        className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
      />
      <label className="flex h-24 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gold-300 bg-gold-50 text-sm font-bold text-navy hover:bg-gold-100">
        {acceptVideo ? <FileVideo size={18} /> : <ImagePlus size={18} />}
        {uploading ? "Uploading..." : acceptVideo ? "Upload image or video" : "Upload image"}
        <input
          type="file"
          accept={getAcceptTypes()}
          disabled={uploading}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void uploadFile(file);
            }
            event.currentTarget.value = "";
          }}
        />
      </label>
      {acceptVideo && (
        <p className="text-xs text-neutral-500">
          Supported: Images (JPG, PNG, WebP) and Videos (MP4, WebM, MOV)
        </p>
      )}
    </div>
  );
}

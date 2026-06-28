"use client";

import { Copy, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";

type ParcelContactActionsProps = {
  phone: string;
  address: string;
  whatsappHref: string;
};

async function copyText(value: string, successMessage: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(successMessage);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
    toast.success(successMessage);
  }
}

export function ParcelContactActions({ phone, address, whatsappHref }: ParcelContactActionsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <a
        href={whatsappHref}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-12 items-center justify-center gap-2 bg-[#128c7e] px-4 text-sm font-bold text-white"
      >
        <MessageCircle size={18} />
        WhatsApp
      </a>
      <button
        type="button"
        onClick={() => void copyText(phone, "Phone number copied")}
        className="inline-flex h-12 items-center justify-center gap-2 border border-neutral-950 bg-white px-4 text-sm font-bold text-neutral-950"
      >
        <Copy size={17} />
        Copy phone
      </button>
      <button
        type="button"
        onClick={() => void copyText(address, "Address copied")}
        className="inline-flex h-12 items-center justify-center gap-2 border border-neutral-950 bg-white px-4 text-sm font-bold text-neutral-950"
      >
        <Copy size={17} />
        Copy address
      </button>
    </div>
  );
}

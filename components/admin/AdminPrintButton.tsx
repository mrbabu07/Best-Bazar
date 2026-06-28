"use client";

import { Printer } from "lucide-react";

type AdminPrintButtonProps = {
  label: string;
  targetSelector?: string;
  pageSize?: "a4" | "label";
};

export function AdminPrintButton({ label, targetSelector = ".admin-print-target", pageSize = "a4" }: AdminPrintButtonProps) {
  const printTarget = () => {
    const target = document.querySelector<HTMLElement>(targetSelector);

    if (!target) {
      window.print();
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const printDocument = iframe.contentDocument;

    if (!printDocument) {
      iframe.remove();
      window.print();
      return;
    }

    const printableMarkup = targetSelector === ".admin-print-target" ? target.innerHTML : target.outerHTML;
    const pageRule = pageSize === "label" ? "size: 4in 6in; margin: 0;" : "size: A4; margin: 8mm;";
    printDocument.open();
    printDocument.write(`
      <!doctype html>
      <html>
        <head>
          <title>${label}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 8px;
              background: #ffffff;
              color: #1a1a2e;
              font-family: Arial, sans-serif;
            }
            .admin-print-hide { display: none !important; }
            .admin-print-block { display: block !important; }
            .admin-print-target {
              width: 100%;
              max-width: 760px;
              margin: 0 auto;
              border: 0 !important;
              box-shadow: none !important;
              background: #ffffff !important;
              padding: 0 !important;
            }
            .hidden { display: none !important; }
            .admin-print-block.hidden,
            .hidden.admin-print-block { display: block !important; }
            .flex { display: flex; }
            .grid { display: grid; }
            .relative { position: relative; }
            .justify-between { justify-content: space-between; }
            .items-start { align-items: flex-start; }
            .items-center { align-items: center; }
            .flex-wrap { flex-wrap: wrap; }
            .gap-2 { gap: 8px; }
            .gap-3 { gap: 12px; }
            .gap-4 { gap: 16px; }
            .mt-1 { margin-top: 4px; }
            .mt-2 { margin-top: 8px; }
            .mt-3 { margin-top: 12px; }
            .mt-5 { margin-top: 20px; }
            .mb-5 { margin-bottom: 20px; }
            .p-3 { padding: 12px; }
            .p-4 { padding: 16px; }
            .px-4 { padding-left: 16px; padding-right: 16px; }
            .py-3 { padding-top: 12px; padding-bottom: 12px; }
            .pb-4 { padding-bottom: 16px; }
            .pt-5 { padding-top: 20px; }
            .text-right { text-align: right; }
            .border-b, .border-t { border-color: #e5e5e5; }
            .border-b { border-bottom: 1px solid #e5e5e5; }
            .border-t { border-top: 1px solid #e5e5e5; }
            .border { border: 1px solid #e5e5e5; }
            .rounded-md { border-radius: 8px; }
            .bg-paper { background: #f8f6f1; }
            .bg-white { background: #ffffff; }
            .text-xs { font-size: 12px; }
            .text-sm { font-size: 14px; }
            .text-base { font-size: 16px; }
            .text-lg { font-size: 18px; }
            .text-2xl { font-size: 24px; }
            .break-all { word-break: break-all; }
            .font-semibold, .font-bold { font-weight: 700; }
            .uppercase { text-transform: uppercase; }
            .tracking-\\[0\\.18em\\] { letter-spacing: 0.18em; }
            .tracking-\\[0\\.12em\\] { letter-spacing: 0.12em; }
            .text-neutral-500, .text-neutral-600 { color: #525252; }
            .text-gold-700 { color: #7a5c25; }
            .text-navy { color: #1a1a2e; }
            .invoice-meta-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 6px;
            }
            .invoice-card {
              border: 1px solid #e5e5e5;
              border-radius: 8px;
              background: #f8f6f1;
              padding: 7px;
            }
            .invoice-card:nth-child(3) { grid-column: 1 / -1; }
            .invoice-products {
              border: 1px solid #e5e5e5;
              border-radius: 8px;
              overflow: hidden;
            }
            .invoice-item {
              display: grid;
              grid-template-columns: 48px 1fr 90px;
              gap: 8px;
              padding: 8px;
              border-bottom: 1px solid #eeeeee;
              page-break-inside: avoid;
            }
            .invoice-item:last-child { border-bottom: 0; }
            .invoice-image {
              width: 48px;
              height: 48px;
              border: 1px solid #e5e5e5;
              border-radius: 8px;
              overflow: hidden;
              background: #ffffff;
            }
            .invoice-image img,
            img {
              width: 100% !important;
              height: 100% !important;
              max-width: 48px;
              max-height: 48px;
              object-fit: cover;
              position: static !important;
            }
            .invoice-qr img { width: 86px !important; height: 86px !important; max-width: 86px; max-height: 86px; object-fit: contain; }
            .invoice-qr { text-align: right; }
            .invoice-line-total { text-align: right; }
            .admin-parcel-label { width: 4in; height: 6in; margin: 0; border: 2px solid #000; padding: 0.15in; overflow: hidden; background: #fff; color: #000; font-size: 11px; }
            .admin-parcel-label.hidden { display: block !important; }
            .parcel-header { border-bottom: 3px solid #000; padding-bottom: 6px; }
            .parcel-header .items-end { align-items: flex-end; }
            .parcel-brand { margin: 0; font-size: 32px; font-weight: 900; letter-spacing: -1px; }
            .parcel-service { margin: 0 0 4px; font-size: 10px; font-weight: 900; letter-spacing: 2px; }
            .parcel-recipient { border-bottom: 1px solid #000; padding: 9px 0; }
            .parcel-recipient-name { margin: 0 0 3px; font-size: 20px; font-weight: 900; }
            .parcel-address { margin: 0 0 4px; font-size: 12px; font-weight: 600; line-height: 1.35; }
            .parcel-phone { margin: 0; font-size: 13px; font-weight: 800; }
            .parcel-route { margin: 7px 0 0; font-size: 10px; font-weight: 900; letter-spacing: 1px; }
            .parcel-date { height: .42in; margin: 0; padding: 9px 0; border-bottom: 2px dashed #000; font-size: 12px; font-weight: 800; }
            .parcel-products { min-height: 1in; border-bottom: 2px dashed #000; padding: 8px 0; }
            .parcel-label-title { margin: 0 0 4px; font-size: 9px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
            .parcel-value { margin: 0; font-size: 11px; font-weight: 700; line-height: 1.4; }
            .parcel-bottom { display: grid; grid-template-columns: 1fr 1.72in; min-height: 1.78in; }
            .parcel-codes { display: grid; grid-template-columns: 1fr 1fr; border-right: 2px dashed #000; }
            .parcel-codes div { min-height: .55in; padding: 7px 4px; border-bottom: 1px dashed #000; }
            .parcel-codes span { display: block; margin-bottom: 3px; font-size: 8px; font-weight: 800; letter-spacing: 1px; }
            .parcel-codes strong { display: block; font-size: 12px; line-height: 1.2; }
            .parcel-codes .parcel-total strong { font-size: 15px; }
            .parcel-codes .parcel-product-code { grid-column: 1 / -1; min-height: .62in; }
            .parcel-codes .parcel-product-code strong { font-size: 19px; letter-spacing: .04em; }
            .admin-parcel-label .invoice-qr { display: grid; place-items: center; }
            .admin-parcel-label .invoice-qr img { width: 1.62in !important; height: 1.62in !important; max-width: 1.62in; max-height: 1.62in; object-fit: contain; border: 1px solid #000; }
            .parcel-footer { border-top: 1px solid #000; padding-top: 5px; text-align: center; font-size: 8px; font-weight: 700; }
            @media (max-width: 640px) {
              .invoice-meta-grid,
              .invoice-item {
                grid-template-columns: 1fr;
              }
              .invoice-line-total { text-align: left; }
            }
            .admin-print-target { zoom: 0.88; }
            @page { ${pageRule} }
          </style>
        </head>
        <body>
          <section class="admin-print-target">${printableMarkup}</section>
        </body>
      </html>
    `);
    printDocument.close();

    window.setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      window.setTimeout(() => iframe.remove(), 500);
    }, 50);
  };

  return (
    <button
      type="button"
      onClick={printTarget}
      className="admin-print-hide grid h-10 w-10 place-items-center rounded-md border border-gold-200 text-navy hover:bg-gold-50"
      aria-label={label}
    >
      <Printer size={18} />
    </button>
  );
}

"use client";

import { Printer } from "lucide-react";

type AdminPrintButtonProps = {
  label: string;
};

export function AdminPrintButton({ label }: AdminPrintButtonProps) {
  const printTarget = () => {
    const target = document.querySelector<HTMLElement>(".admin-print-target");

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
              padding: 24px;
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
            .justify-between { justify-content: space-between; }
            .items-start { align-items: flex-start; }
            .gap-2 { gap: 8px; }
            .gap-4 { gap: 16px; }
            .mt-1 { margin-top: 4px; }
            .mt-5 { margin-top: 20px; }
            .mb-5 { margin-bottom: 20px; }
            .pb-4 { padding-bottom: 16px; }
            .pt-5 { padding-top: 20px; }
            .border-b, .border-t { border-color: #e5e5e5; }
            .border-b { border-bottom: 1px solid #e5e5e5; }
            .border-t { border-top: 1px solid #e5e5e5; }
            .text-xs { font-size: 12px; }
            .text-sm { font-size: 14px; }
            .text-base { font-size: 16px; }
            .text-lg { font-size: 18px; }
            .text-2xl { font-size: 24px; }
            .font-semibold, .font-bold { font-weight: 700; }
            .uppercase { text-transform: uppercase; }
            .tracking-\\[0\\.18em\\] { letter-spacing: 0.18em; }
            .text-neutral-500, .text-neutral-600 { color: #525252; }
            .text-gold-700 { color: #7a5c25; }
            .text-navy { color: #1a1a2e; }
            @page { margin: 16mm; }
          </style>
        </head>
        <body>
          <section class="admin-print-target">${target.innerHTML}</section>
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

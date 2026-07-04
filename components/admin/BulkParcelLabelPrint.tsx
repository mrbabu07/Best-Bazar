"use client";

import { Printer } from "lucide-react";
import toast from "react-hot-toast";

type ParcelData = {
  orderNumber: string;
  date: string;
  customerName: string;
  phone: string;
  address: string;
  productCode: string;
  products: string;
  variantSummary: string;
  itemLines?: string[];
  payment: string;
  subtotal: string;
  deliveryFee: string;
  total: string;
  note: string;
  qrPayload?: string;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[character] ?? character));
}

export function BulkParcelLabelPrint() {
  const printSelected = () => {
    const inputs = Array.from(document.querySelectorAll<HTMLInputElement>("[data-parcel-order]:checked"));
    const labels = inputs.flatMap((input) => {
      try { return [JSON.parse(decodeURIComponent(input.dataset.parcelOrder ?? "")) as ParcelData]; } catch { return []; }
    });

    if (!labels.length) {
      toast.error("Select at least one order first.");
      return;
    }

    const markup = labels.map((order) => {
      const qrText = order.qrPayload || `Order: ${order.orderNumber}\nCustomer: ${order.customerName}\nPhone: ${order.phone}\nAddress: ${order.address}\nProduct code: ${order.productCode}\nProducts: ${order.products}\nProduct price: ${order.subtotal}\nDelivery: ${order.deliveryFee}\nTotal: ${order.total}`;
      const itemLines = order.itemLines?.length ? order.itemLines : [order.variantSummary || order.products];
      const visibleLines = itemLines.slice(0, 3).map((line, index) => `<li><b>${index + 1}.</b> ${escapeHtml(line)}</li>`).join("");
      const more = itemLines.length > 3 ? `<em>+${itemLines.length - 3} more - scan QR</em>` : "";
      return `<section class="label"><header><strong>AYVELLA</strong></header><section class="recipient"><h1>${escapeHtml(order.customerName)}</h1><p>${escapeHtml(order.address)}</p><b>${escapeHtml(order.phone)}</b><small>AY AE-${escapeHtml(order.orderNumber.slice(-6))}</small></section><section class="date-row"><p>${escapeHtml(order.date)}</p><div>AY</div></section><section class="operations"><div class="codes"><section class="product-code"><small>PRODUCT CODE</small><strong>${escapeHtml(order.productCode)}</strong></section><section class="variant"><small>CODE / COLOR / SIZE / QTY</small><ol>${visibleLines}</ol>${more}</section><section><small>PRODUCT</small><strong>${escapeHtml(order.subtotal)}</strong></section><section><small>DELIVERY</small><strong>${escapeHtml(order.deliveryFee)}</strong></section><section class="total"><small>TOTAL</small><strong>${escapeHtml(order.total)}</strong></section></div><div class="qr"><img src="https://api.qrserver.com/v1/create-qr-code/?size=600x600&ecc=M&margin=6&data=${encodeURIComponent(qrText)}" alt="Order QR"><p>${escapeHtml(order.orderNumber)}</p></div></section><footer>SCAN FOR CUSTOMER &amp; ORDER DETAILS</footer></section>`;
    }).join("");
    const printWindow = window.open("", "_blank", "width=480,height=720");
    if (!printWindow) return;
    printWindow.document.write(`<!doctype html><html><head><title>Parcel labels</title><style>@page{size:4in 6in;margin:0}*{box-sizing:border-box}body{margin:0;font-family:Arial;color:#000}.label{width:4in;height:6in;padding:.16in;border:2px solid #000;border-radius:12px;page-break-after:always;overflow:hidden}.label:last-child{page-break-after:auto}header{padding-bottom:4px}header strong{font-size:42px;font-weight:900;letter-spacing:-2px;line-height:.95}.recipient{padding:7px 0 8px}.recipient h1{margin:0 0 3px;font-size:21px}.recipient p{margin:0 0 3px;font-size:12px;font-weight:600;line-height:1.3}.recipient b{display:block;font-size:12px}.recipient small{display:block;margin-top:7px;font-size:10px;font-weight:900;letter-spacing:1.2px}.date-row{display:flex;align-items:center;justify-content:space-between;min-height:.92in;border-bottom:2px dashed #000;padding:7px 2px}.date-row p{margin:0;font-size:12px;font-weight:800}.date-row div{display:grid;width:.72in;height:.72in;place-items:center;border:2px solid #000;border-radius:50%;font-size:18px;font-weight:900}.operations{display:grid;grid-template-columns:1fr 1.62in;min-height:2.45in}.codes{display:grid;grid-template-columns:1fr 1fr;border-right:2px dashed #000}.codes>section{min-height:.48in;padding:6px 4px;border-bottom:1px dashed #000}.codes .product-code,.codes .variant,.codes .total{grid-column:1/-1}.codes .product-code{min-height:.62in}.codes small{display:block;margin-bottom:3px;font-size:8px;font-weight:800;letter-spacing:1px}.codes strong{display:block;font-size:11px;line-height:1.2}.codes .product-code strong{font-size:15px;letter-spacing:.5px}.codes .variant ol{margin:0;padding:0;list-style:none}.codes .variant li{margin:0 0 2px;font-size:8px;font-weight:800;line-height:1.15}.codes .variant em{display:block;margin-top:3px;font-size:8px;font-weight:900;font-style:normal}.codes .total strong{font-size:14px}.qr{display:grid;align-content:center;justify-items:center;padding-left:6px}.qr img{width:1.5in;height:1.5in;border:1px solid #000}.qr p{margin:4px 0 0;max-width:1.5in;overflow:hidden;font-size:7px;font-weight:800;white-space:nowrap}footer{border-top:1px solid #000;padding-top:5px;text-align:center;font-size:8px;font-weight:bold}</style></head><body>${markup}</body></html>`);
    printWindow.document.close();
    window.setTimeout(() => { printWindow.focus(); printWindow.print(); }, 100);
  };

  return <button type="button" onClick={printSelected} className="inline-flex h-10 items-center gap-2 rounded-md bg-neutral-950 px-3 text-xs font-bold text-white hover:bg-neutral-800"><Printer size={16} />Print selected labels</button>;
}

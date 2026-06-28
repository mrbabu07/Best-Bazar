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
      return `<section class="label"><header><strong>BEST MART</strong><span>DELIVERY</span></header><section class="recipient"><h1>${escapeHtml(order.customerName)}</h1><p>${escapeHtml(order.address)}</p><b>${escapeHtml(order.phone)}</b><small>ORDER ${escapeHtml(order.orderNumber)}</small></section><p class="date">${escapeHtml(order.date)}</p><section class="product"><b>PRODUCT DETAILS</b><p>${escapeHtml(order.products)}</p></section><section class="operations"><div class="codes"><div class="product-code"><small>PRODUCT CODE</small><strong>${escapeHtml(order.productCode)}</strong></div><div><small>PRODUCT</small><strong>${escapeHtml(order.subtotal)}</strong></div><div><small>DELIVERY</small><strong>${escapeHtml(order.deliveryFee)}</strong></div><div><small>TOTAL</small><strong>${escapeHtml(order.total)}</strong></div></div><img src="https://api.qrserver.com/v1/create-qr-code/?size=600x600&ecc=M&margin=6&data=${encodeURIComponent(qrText)}" alt="Order QR"></section><footer>Scan QR for customer, order and WhatsApp contact</footer></section>`;
    }).join("");
    const printWindow = window.open("", "_blank", "width=480,height=720");
    if (!printWindow) return;
    printWindow.document.write(`<!doctype html><html><head><title>Parcel labels</title><style>@page{size:4in 6in;margin:0}*{box-sizing:border-box}body{margin:0;font-family:Arial;color:#000}.label{width:4in;height:6in;padding:.15in;border:2px solid #000;page-break-after:always;overflow:hidden}.label:last-child{page-break-after:auto}header{display:flex;align-items:flex-end;justify-content:space-between;border-bottom:3px solid #000;padding-bottom:6px}header strong{font-size:32px;font-weight:900;letter-spacing:-1px}header span{font-size:10px;font-weight:900;letter-spacing:2px}.recipient{padding:10px 0;border-bottom:1px solid #000}.recipient h1{margin:0 0 3px;font-size:20px}.recipient p{margin:0 0 4px;font-size:12px;line-height:1.35}.recipient b{display:block;font-size:13px}.recipient small{display:block;margin-top:7px;font-weight:800;letter-spacing:1px}.date{height:.45in;margin:0;padding:10px 0;border-bottom:2px dashed #000;font-size:13px;font-weight:800}.product{min-height:1.05in;padding:9px 0;border-bottom:2px dashed #000}.product>b{font-size:9px;letter-spacing:1.4px}.product p{margin:5px 0 0;font-size:11px;font-weight:700;line-height:1.4}.operations{display:grid;grid-template-columns:1fr 1.75in;min-height:1.8in}.codes{display:grid;grid-template-columns:1fr 1fr;align-content:start;border-right:2px dashed #000}.codes>div{min-height:.52in;padding:6px 5px;border-bottom:1px dashed #000}.codes .product-code{grid-column:1/-1;min-height:.62in}.codes .product-code strong{font-size:19px;letter-spacing:1px}.codes small{display:block;margin-bottom:3px;font-size:8px;font-weight:800;letter-spacing:1px}.codes strong{font-size:12px}.operations img{width:1.65in;height:1.65in;margin:auto;border:1px solid #000}footer{border-top:1px solid #000;padding-top:5px;text-align:center;font-size:8px;font-weight:bold}</style></head><body>${markup}</body></html>`);
    printWindow.document.close();
    window.setTimeout(() => { printWindow.focus(); printWindow.print(); }, 100);
  };

  return <button type="button" onClick={printSelected} className="inline-flex h-10 items-center gap-2 rounded-md bg-neutral-950 px-3 text-xs font-bold text-white hover:bg-neutral-800"><Printer size={16} />Print selected labels</button>;
}

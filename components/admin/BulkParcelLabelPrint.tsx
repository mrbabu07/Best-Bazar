"use client";

import { Printer } from "lucide-react";
import toast from "react-hot-toast";

type ParcelData = {
  orderNumber: string;
  date: string;
  customerName: string;
  phone: string;
  address: string;
  products: string;
  payment: string;
  due: string;
  note: string;
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
      const qrText = `Order: ${order.orderNumber}\nCustomer: ${order.customerName}\nPhone: ${order.phone}\nAddress: ${order.address}\nProducts: ${order.products}\nPayment: ${order.payment}\nDue: ${order.due}\nNote: ${order.note}`;
      return `<section class="label"><header><strong>BEST MART</strong><p>Tracking: ${escapeHtml(order.orderNumber)}</p></header><div class="details"><p><b>Order:</b> #${escapeHtml(order.orderNumber)}<br><b>Date:</b> ${escapeHtml(order.date)}</p><p><b>${escapeHtml(order.customerName)}</b><br>${escapeHtml(order.phone)}<br>${escapeHtml(order.address)}</p></div><div class="bottom"><div><p><b>Products</b><br>${escapeHtml(order.products)}</p><p><b>Payment:</b> ${escapeHtml(order.payment)}<br><b>Due:</b> ${escapeHtml(order.due)}${order.note ? `<br><b>Note:</b> ${escapeHtml(order.note)}` : ""}</p></div><img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrText)}" alt="Order QR"></div><footer>Powered by Best Mart Delivery System</footer></section>`;
    }).join("");
    const printWindow = window.open("", "_blank", "width=480,height=720");
    if (!printWindow) return;
    printWindow.document.write(`<!doctype html><html><head><title>Parcel labels</title><style>@page{size:4in 6in;margin:0}*{box-sizing:border-box}body{margin:0;font-family:Arial;color:#000}.label{width:4in;height:6in;padding:.14in;border:2px solid #000;page-break-after:always}.label:last-child{page-break-after:auto}header{border-bottom:2px solid #000;padding-bottom:7px}header strong{font-size:21px}header p{margin:4px 0 0;font-size:11px}.details{border-bottom:1px solid #000;padding:8px 0;font-size:12px;line-height:1.45}.details p{margin:0 0 7px}.bottom{display:grid;grid-template-columns:1fr 2in;gap:8px;padding-top:9px;font-size:11px;line-height:1.45}.bottom p{margin:0 0 8px}.bottom img{width:2in;height:2in;border:1px solid #000}footer{border-top:1px solid #000;margin-top:8px;padding-top:6px;text-align:center;font-size:9px;font-weight:bold}</style></head><body>${markup}</body></html>`);
    printWindow.document.close();
    window.setTimeout(() => { printWindow.focus(); printWindow.print(); }, 100);
  };

  return <button type="button" onClick={printSelected} className="inline-flex h-10 items-center gap-2 rounded-md bg-neutral-950 px-3 text-xs font-bold text-white hover:bg-neutral-800"><Printer size={16} />Print selected labels</button>;
}

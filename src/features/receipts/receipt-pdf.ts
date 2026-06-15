import jsPDF from "jspdf";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";
import type { Order, Company } from "@/types/database.types";
import { formatCurrency, formatDate, formatDateShort } from "@/shared/lib/utils";
import { SERVICE_TYPE_LABELS } from "@/shared/constants/orders";

function barcodeDataUrl(value: string): string {
  const canvas = document.createElement("canvas");
  JsBarcode(canvas, value, {
    format: "CODE128",
    displayValue: true,
    fontSize: 14,
    height: 40,
    width: 2,
    margin: 4,
  });
  return canvas.toDataURL("image/png");
}

async function drawCopy(
  doc: jsPDF,
  order: Order,
  company: Company | null,
  copyLabel: string,
  offsetY: number
) {
  const left = 10;
  let y = offsetY + 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(company?.name ?? "Shoe Care", left, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  if (company?.phone) {
    doc.text(company.phone, left, y);
    y += 4;
  }
  if (company?.address) {
    doc.text(company.address, left, y);
    y += 4;
  }

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(copyLabel.toUpperCase(), left, y);
  doc.setTextColor(0);
  y += 4;

  doc.setLineDashPattern([1, 1], 0);
  doc.line(left, y, 200, y);
  y += 5;

  doc.setFontSize(9);
  const rows: [string, string][] = [
    ["Buyurtma raqami", order.order_number],
    ["Mijoz", order.customer_name],
    ["Telefon", order.customer_phone],
    ["Oyoq kiyim", `${order.shoe_type}${order.brand ? " - " + order.brand : ""}`],
    ["Xizmat turi", SERVICE_TYPE_LABELS[order.service_type]],
    ["Narx", formatCurrency(order.price)],
    ["Sana", formatDate(order.created_at)],
  ];
  if (order.estimated_ready_at) {
    rows.push(["Tayyor bo'lish sanasi", formatDateShort(order.estimated_ready_at)]);
  }

  for (const [label, value] of rows) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(110);
    doc.text(`${label}:`, left, y);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text(value, left + 45, y);
    y += 5;
  }

  y += 2;
  doc.setLineDashPattern([1, 1], 0);
  doc.line(left, y, 200, y);
  y += 4;

  // QR Code
  const qrDataUrl = await QRCode.toDataURL(
    JSON.stringify({ id: order.id, order_number: order.order_number }),
    { margin: 1, width: 200 }
  );
  doc.addImage(qrDataUrl, "PNG", left, y, 28, 28);

  // Barcode
  const barcodeUrl = barcodeDataUrl(order.order_number);
  doc.addImage(barcodeUrl, "PNG", left + 33, y + 4, 60, 20);

  y += 32;

  if (company?.receipt_footer_text) {
    doc.setFontSize(8);
    doc.setTextColor(130);
    doc.text(company.receipt_footer_text, left, y, { maxWidth: 90 });
    doc.setTextColor(0);
  }
}

/** Generates a 2-up PDF receipt (customer copy + worker copy) and returns a Blob URL. */
export async function generateReceiptPdf(order: Order, company: Company | null): Promise<Blob> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  await drawCopy(doc, order, company, "Mijoz uchun", 0);

  doc.setLineDashPattern([2, 2], 0);
  doc.line(10, 145, 200, 145);

  await drawCopy(doc, order, company, "Ishchi uchun", 145);

  return doc.output("blob");
}

export async function downloadReceiptPdf(order: Order, company: Company | null) {
  const blob = await generateReceiptPdf(order, company);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `chek-${order.order_number}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

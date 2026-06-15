import { QRCodeSVG } from "qrcode.react";
import { BarcodeSVG } from "@/features/receipts/barcode-svg";
import type { Order, Company } from "@/types/database.types";
import { formatCurrency, formatDateShort, formatDate } from "@/shared/lib/utils";
import { SERVICE_TYPE_LABELS } from "@/shared/constants/orders";

interface ReceiptCopyProps {
  order: Order;
  company: Company | null;
  copyLabel: string;
}

function ReceiptCopy({ order, company, copyLabel }: ReceiptCopyProps) {
  return (
    <div className="receipt-copy mx-auto w-[300px] border border-dashed border-border bg-white p-4 text-black">
      <div className="text-center">
        <p className="font-display text-base font-bold">{company?.name ?? "Shoe Care"}</p>
        {company?.phone && <p className="text-xs">{company.phone}</p>}
        {company?.address && <p className="text-xs">{company.address}</p>}
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
          {copyLabel}
        </p>
      </div>

      <div className="my-2 border-t border-dashed border-gray-300" />

      <div className="space-y-1 text-xs">
        <Row label="Buyurtma raqami" value={order.order_number} mono />
        <Row label="Mijoz" value={order.customer_name} />
        <Row label="Telefon" value={order.customer_phone} />
        <Row label="Oyoq kiyim" value={`${order.shoe_type}${order.brand ? " · " + order.brand : ""}`} />
        <Row label="Xizmat turi" value={SERVICE_TYPE_LABELS[order.service_type]} />
        <Row label="Narx" value={formatCurrency(order.price)} />
        <Row label="Sana" value={formatDate(order.created_at)} />
        {order.estimated_ready_at && (
          <Row label="Tayyor bo'lish sanasi" value={formatDateShort(order.estimated_ready_at)} />
        )}
      </div>

      <div className="my-2 border-t border-dashed border-gray-300" />

      <div className="flex flex-col items-center gap-2">
        <QRCodeSVG
          value={JSON.stringify({ id: order.id, order_number: order.order_number })}
          size={110}
          level="M"
        />
        <BarcodeSVG value={order.order_number} height={40} fontSize={12} width={1.5} />
      </div>

      {company?.receipt_footer_text && (
        <p className="mt-2 text-center text-[10px] text-gray-500">{company.receipt_footer_text}</p>
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-gray-500">{label}:</span>
      <span className={mono ? "font-mono font-semibold" : "font-medium"}>{value}</span>
    </div>
  );
}

/** Renders both customer & worker copies, ready for printing. */
export function OrderReceipt({ order, company }: { order: Order; company: Company | null }) {
  return (
    <div className="grid gap-4 print:grid-cols-2 sm:grid-cols-2">
      <ReceiptCopy order={order} company={company} copyLabel="Mijoz uchun" />
      <ReceiptCopy order={order} company={company} copyLabel="Ishchi uchun" />
    </div>
  );
}

import * as React from "react";
import { useParams, Link } from "react-router-dom";
import {
  Phone,
  Wallet,
  Calendar,
  Tag,
  Palette,
  MessageSquare,
  Printer,
  Download,
  ArrowLeft,
  Loader2,
  History,
} from "lucide-react";
import { PageHeader } from "@/shared/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { StatusBadge } from "@/shared/ui/badge";
import { Select } from "@/shared/ui/select";
import { Dialog } from "@/shared/ui/dialog";
import {
  useOrder,
  useOrderImages,
  useStatusHistory,
  useUpdateOrderStatus,
  useCompleteOrder,
} from "@/features/orders/hooks/use-orders";
import { useCompany } from "@/features/companies/api/companies-api";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { StatusRail } from "@/widgets/orders/status-rail";
import { OrderReceipt } from "@/features/receipts/order-receipt";
import { downloadReceiptPdf } from "@/features/receipts/receipt-pdf";
import {
  ORDER_STATUS_CONFIG,
  PAYMENT_METHOD_LABELS,
  SERVICE_TYPE_LABELS,
} from "@/shared/constants/orders";
import { formatCurrency, formatDate } from "@/shared/lib/utils";
import { getNextStatus, isTerminalStatus } from "@/features/orders/utils/order-helpers";
import type { OrderStatus, PaymentMethod } from "@/types/database.types";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const profile = useAuthStore((s) => s.profile);

  const { data: order, isLoading } = useOrder(id);
  const { data: company } = useCompany(order?.company_id);
  const { data: images } = useOrderImages(id);
  const { data: history } = useStatusHistory(id);

  const updateStatus = useUpdateOrderStatus();
  const completeOrder = useCompleteOrder();

  const [receiptOpen, setReceiptOpen] = React.useState(false);
  const [paymentOpen, setPaymentOpen] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("naqd");
  const [downloading, setDownloading] = React.useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-40" />
        <Skeleton className="h-60" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="font-display text-lg font-semibold">Buyurtma topilmadi</p>
        <Link to="/orders">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" /> Buyurtmalarga qaytish
          </Button>
        </Link>
      </div>
    );
  }

  const nextStatus = getNextStatus(order.status);
  const terminal = isTerminalStatus(order.status);

  const handleStatusChange = (status: OrderStatus) => {
    updateStatus.mutate({ orderId: order.id, status });
  };

  const handleComplete = () => {
    if (!profile) return;
    completeOrder.mutate(
      {
        orderId: order.id,
        paymentMethod,
        amount: order.price,
        receivedBy: profile.id,
        companyId: order.company_id,
      },
      { onSuccess: () => setPaymentOpen(false) }
    );
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      await downloadReceiptPdf(order, company ?? null);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={order.order_number}
        description={`Yaratilgan: ${formatDate(order.created_at)}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setReceiptOpen(true)}>
              <Printer className="h-4 w-4" /> Chek
            </Button>
            <Link to="/orders">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" /> Orqaga
              </Button>
            </Link>
          </div>
        }
      />

      {/* Status rail */}
      <Card className="mb-5 p-5">
        <div className="mb-4 flex items-center justify-between">
          <StatusBadge status={order.status} />
          <div className="flex gap-2">
            {!terminal && nextStatus && (
              <Button
                size="sm"
                onClick={() => handleStatusChange(nextStatus)}
                disabled={updateStatus.isPending}
              >
                {updateStatus.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {ORDER_STATUS_CONFIG[nextStatus].emoji} {ORDER_STATUS_CONFIG[nextStatus].label}ga o'tkazish
              </Button>
            )}
            {order.status === "topshirildi" && (
              <Button size="sm" variant="success" onClick={() => setPaymentOpen(true)}>
                <Wallet className="h-4 w-4" /> To'lovni qabul qilish
              </Button>
            )}
            {!terminal && order.status !== "bekor_qilindi" && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleStatusChange("bekor_qilindi")}
                disabled={updateStatus.isPending}
              >
                Bekor qilish
              </Button>
            )}
          </div>
        </div>
        <StatusRail status={order.status} />
      </Card>

      <div className="grid gap-5 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Mijoz ma'lumotlari</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <InfoRow icon={<Tag className="h-4 w-4" />} label="Ism" value={order.customer_name} />
            <InfoRow icon={<Phone className="h-4 w-4" />} label="Telefon" value={order.customer_phone} />
            {order.customer_telegram_id && (
              <InfoRow icon={<MessageSquare className="h-4 w-4" />} label="Telegram ID" value={String(order.customer_telegram_id)} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Buyurtma ma'lumotlari</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <InfoRow icon={<Tag className="h-4 w-4" />} label="Oyoq kiyim" value={`${order.shoe_type}${order.brand ? " · " + order.brand : ""}`} />
            {order.color && <InfoRow icon={<Palette className="h-4 w-4" />} label="Rang" value={order.color} />}
            <InfoRow icon={<Tag className="h-4 w-4" />} label="Xizmat turi" value={SERVICE_TYPE_LABELS[order.service_type]} />
            <InfoRow icon={<Wallet className="h-4 w-4" />} label="Narx" value={formatCurrency(order.price)} />
            {order.estimated_ready_at && (
              <InfoRow icon={<Calendar className="h-4 w-4" />} label="Taxminiy tayyor" value={formatDate(order.estimated_ready_at)} />
            )}
            {order.payment_method && (
              <InfoRow icon={<Wallet className="h-4 w-4" />} label="To'lov turi" value={PAYMENT_METHOD_LABELS[order.payment_method]} />
            )}
            {order.worker_earning != null && (
              <InfoRow icon={<Wallet className="h-4 w-4" />} label="Ishchi daromadi" value={formatCurrency(order.worker_earning)} />
            )}
            {order.comment && <InfoRow icon={<MessageSquare className="h-4 w-4" />} label="Izoh" value={order.comment} />}
          </CardContent>
        </Card>
      </div>

      {images && images.length > 0 && (
        <Card className="mt-5">
          <CardHeader>
            <CardTitle>Rasmlar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {images.map((img) => (
                <a key={img.id} href={img.image_url} target="_blank" rel="noreferrer">
                  <img
                    src={img.image_url}
                    alt="Buyurtma rasmi"
                    className="h-24 w-24 rounded-lg border border-border object-cover transition-transform hover:scale-105"
                  />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {history && history.length > 0 && (
        <Card className="mt-5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-4 w-4" /> Status tarixi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {history.map((h) => (
                <li key={h.id} className="flex items-center justify-between border-b border-border/60 pb-2 last:border-0 last:pb-0">
                  <span className="flex items-center gap-2">
                    <StatusBadge status={h.new_status} />
                  </span>
                  <span className="text-xs text-muted-foreground">{formatDate(h.created_at)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Receipt dialog */}
      <Dialog open={receiptOpen} onClose={() => setReceiptOpen(false)} title="Chek" className="max-w-2xl">
        <OrderReceipt order={order} company={company ?? null} />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={downloading}>
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            PDF yuklab olish
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Chop etish
          </Button>
        </div>
      </Dialog>

      {/* Payment dialog */}
      <Dialog open={paymentOpen} onClose={() => setPaymentOpen(false)} title="To'lovni qabul qilish">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Jami summa: <span className="font-semibold text-foreground">{formatCurrency(order.price)}</span>
          </p>
          <div>
            <label className="mb-1.5 block text-sm font-medium">To'lov turi</label>
            <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
              {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setPaymentOpen(false)}>
              Bekor qilish
            </Button>
            <Button size="sm" variant="success" onClick={handleComplete} disabled={completeOrder.isPending}>
              {completeOrder.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Tasdiqlash
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}

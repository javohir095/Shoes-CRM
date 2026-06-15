import * as React from "react";
import { useNavigate } from "react-router-dom";
import jsQR from "jsqr";
import { Camera, Search, ScanLine, Loader2 } from "lucide-react";
import { PageHeader } from "@/shared/ui/page-header";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { StatusBadge } from "@/shared/ui/badge";
import { useOrderByCode } from "@/features/orders/hooks/use-orders";
import { useCompleteOrder, useUpdateOrderStatus } from "@/features/orders/hooks/use-orders";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { Select } from "@/shared/ui/select";
import { formatCurrency } from "@/shared/lib/utils";
import { PAYMENT_METHOD_LABELS, SERVICE_TYPE_LABELS } from "@/shared/constants/orders";
import type { PaymentMethod } from "@/types/database.types";
import { toast } from "sonner";

export default function QrScannerPage() {
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const [scanning, setScanning] = React.useState(false);
  const [manualCode, setManualCode] = React.useState("");
  const [activeCode, setActiveCode] = React.useState<string | undefined>();
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("naqd");

  const { data: order, isLoading, isFetched } = useOrderByCode(activeCode);
  const updateStatus = useUpdateOrderStatus();
  const completeOrder = useCompleteOrder();

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);
    } catch {
      toast.error("Kameraga ruxsat berilmadi yoki topilmadi");
    }
  };

  const stopScanning = React.useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  React.useEffect(() => {
    if (!scanning) return;
    let raf: number;

    const tick = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code?.data) {
            handleDetected(code.data);
            return;
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);

  React.useEffect(() => {
    return () => stopScanning();
  }, [stopScanning]);

  const handleDetected = (raw: string) => {
    stopScanning();
    let code = raw;
    try {
      const parsed = JSON.parse(raw);
      code = parsed.order_number || parsed.id || raw;
    } catch {
      // not JSON - treat as plain order number / barcode value
    }
    setActiveCode(code);
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) setActiveCode(manualCode.trim());
  };

  const handleComplete = () => {
    if (!order || !profile) return;
    completeOrder.mutate({
      orderId: order.id,
      paymentMethod,
      amount: order.price,
      receivedBy: profile.id,
      companyId: order.company_id,
    });
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="QR Scanner" description="Buyurtmani QR kod, shtrix kod yoki raqami orqali topish" />

      <Card className="mb-5">
        <CardContent className="space-y-4 pt-5">
          <div className="relative overflow-hidden rounded-xl border border-border bg-black/80">
            {scanning ? (
              <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
            ) : (
              <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <ScanLine className="h-10 w-10" />
                <p className="text-sm">Skanerlash uchun kamerani yoqing</p>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="flex gap-2">
            {!scanning ? (
              <Button onClick={startScanning} className="flex-1">
                <Camera className="h-4 w-4" /> Kamerani yoqish
              </Button>
            ) : (
              <Button onClick={stopScanning} variant="outline" className="flex-1">
                To'xtatish
              </Button>
            )}
          </div>

          <div className="relative flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">yoki qo'lda kiriting</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleManualSearch} className="flex gap-2">
            <Input
              placeholder="SH-20260820-0001"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="font-mono"
            />
            <Button type="submit" variant="outline">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {isFetched && !order && activeCode && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="font-medium">Buyurtma topilmadi</p>
            <p className="mt-1 text-sm text-muted-foreground">
              "{activeCode}" bo'yicha hech qanday buyurtma topilmadi.
            </p>
          </CardContent>
        </Card>
      )}

      {order && (
        <Card>
          <CardContent className="space-y-4 pt-5">
            <div className="flex items-center justify-between">
              <p className="font-mono text-lg font-semibold text-primary">{order.order_number}</p>
              <StatusBadge status={order.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Mijoz</p>
                <p className="font-medium">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Telefon</p>
                <p className="font-medium">{order.customer_phone}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Oyoq kiyim</p>
                <p className="font-medium">{order.shoe_type}{order.brand ? ` · ${order.brand}` : ""}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Xizmat turi</p>
                <p className="font-medium">{SERVICE_TYPE_LABELS[order.service_type]}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Narx</p>
                <p className="font-semibold">{formatCurrency(order.price)}</p>
              </div>
            </div>

            {order.status === "tayyor" && (
              <Button className="w-full" onClick={() => updateStatus.mutate({ orderId: order.id, status: "topshirildi" })}>
                Topshirildi deb belgilash
              </Button>
            )}

            {order.status === "topshirildi" && (
              <div className="space-y-3 rounded-xl border border-border bg-secondary/40 p-4">
                <p className="text-sm font-medium">To'lovni qabul qilish</p>
                <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </Select>
                <Button className="w-full" variant="success" onClick={handleComplete} disabled={completeOrder.isPending}>
                  {completeOrder.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {formatCurrency(order.price)} qabul qilish
                </Button>
              </div>
            )}

            {(order.status === "tugallangan" || order.status === "bekor_qilindi") && (
              <p className="text-center text-sm text-muted-foreground">
                Bu buyurtma allaqachon yakunlangan.
              </p>
            )}

            <Button variant="ghost" className="w-full" onClick={() => navigate(`/orders/${order.id}`)}>
              To'liq ma'lumotni ko'rish
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { Loader2, ImagePlus, X } from "lucide-react";
import { PageHeader } from "@/shared/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";
import { Button } from "@/shared/ui/button";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useWorkers } from "@/features/workers/hooks/use-workers";
import { useCreateOrder, useUploadOrderImage } from "@/features/orders/hooks/use-orders";
import { SERVICE_TYPE_LABELS } from "@/shared/constants/orders";

const orderSchema = z.object({
  customer_name: z.string().min(2, "Mijoz ismini kiriting"),
  customer_phone: z
    .string()
    .min(9, "Telefon raqamini to'liq kiriting")
    .regex(/^[+0-9\s-]+$/, "Telefon raqami noto'g'ri formatda"),
  customer_telegram_id: z.string().optional(),
  shoe_type: z.string().min(1, "Oyoq kiyim turini kiriting"),
  brand: z.string().optional(),
  color: z.string().optional(),
  service_type: z.enum(["tozalash", "tamirlash", "bo_yash", "tozalash_va_tamirlash", "boshqa"]),
  price: z.coerce.number().min(0, "Narx 0 dan katta bo'lishi kerak"),
  comment: z.string().optional(),
  worker_id: z.string().optional(),
  estimated_ready_at: z.string().optional(),
});

type OrderFormInput = z.input<typeof orderSchema>;
type OrderFormValues = z.output<typeof orderSchema>;

export default function NewOrderPage() {
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const { data: workers } = useWorkers(profile?.company_id ?? undefined);
  const createOrder = useCreateOrder();
  const uploadImage = useUploadOrderImage();

  const [images, setImages] = React.useState<File[]>([]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<OrderFormInput, unknown, OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      service_type: "tozalash",
      worker_id: profile?.role === "worker" ? profile.id : "",
    },
  });

  const onSubmit = async (values: OrderFormValues) => {
    if (!profile?.company_id) return;

    const order = await createOrder.mutateAsync({
      company_id: profile.company_id,
      worker_id: values.worker_id || profile.id,
      customer_name: values.customer_name,
      customer_phone: values.customer_phone,
      customer_telegram_id: values.customer_telegram_id
        ? Number(values.customer_telegram_id)
        : null,
      shoe_type: values.shoe_type,
      brand: values.brand || null,
      color: values.color || null,
      service_type: values.service_type,
      price: values.price,
      comment: values.comment || null,
      estimated_ready_at: values.estimated_ready_at
        ? new Date(values.estimated_ready_at).toISOString()
        : null,
    });

    // Upload images sequentially (best-effort, non-blocking for navigation)
    for (const file of images) {
      try {
        await uploadImage.mutateAsync({ orderId: order.id, file, uploadedBy: profile.id });
      } catch {
        // errors are toasted inside the hook
      }
    }

    navigate(`/orders/${order.id}`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setImages((prev) => [...prev, ...files].slice(0, 6));
    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Yangi buyurtma" description="Mijoz va buyurtma ma'lumotlarini kiriting" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Mijoz ma'lumotlari</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="customer_name">Mijoz ism familyasi</Label>
              <Input id="customer_name" placeholder="Aliyev Vali" {...register("customer_name")} />
              {errors.customer_name && (
                <p className="mt-1 text-xs text-destructive">{errors.customer_name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="customer_phone">Telefon raqami</Label>
              <Input id="customer_phone" placeholder="+998901234567" {...register("customer_phone")} />
              {errors.customer_phone && (
                <p className="mt-1 text-xs text-destructive">{errors.customer_phone.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="customer_telegram_id">Telegram ID (ixtiyoriy)</Label>
              <Input
                id="customer_telegram_id"
                placeholder="123456789"
                {...register("customer_telegram_id")}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Buyurtma ma'lumotlari</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="shoe_type">Oyoq kiyim turi</Label>
              <Input id="shoe_type" placeholder="Krossovka, Botilka..." {...register("shoe_type")} />
              {errors.shoe_type && (
                <p className="mt-1 text-xs text-destructive">{errors.shoe_type.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="brand">Brend</Label>
              <Input id="brand" placeholder="Nike, Adidas..." {...register("brand")} />
            </div>
            <div>
              <Label htmlFor="color">Rang</Label>
              <Input id="color" placeholder="Oq, Qora..." {...register("color")} />
            </div>
            <div>
              <Label htmlFor="service_type">Xizmat turi</Label>
              <Controller
                control={control}
                name="service_type"
                render={({ field }) => (
                  <Select id="service_type" {...field}>
                    {Object.entries(SERVICE_TYPE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </Select>
                )}
              />
            </div>
            <div>
              <Label htmlFor="price">Narx (so'm)</Label>
              <Input id="price" type="number" min={0} step={1000} placeholder="100000" {...register("price")} />
              {errors.price && <p className="mt-1 text-xs text-destructive">{errors.price.message}</p>}
            </div>
            <div>
              <Label htmlFor="estimated_ready_at">Taxminiy tayyor bo'lish sanasi</Label>
              <Input id="estimated_ready_at" type="datetime-local" {...register("estimated_ready_at")} />
            </div>
            {workers && workers.length > 0 && profile?.role !== "worker" && (
              <div>
                <Label htmlFor="worker_id">Ishchiga biriktirish</Label>
                <Controller
                  control={control}
                  name="worker_id"
                  render={({ field }) => (
                    <Select id="worker_id" {...field}>
                      <option value="">Tanlanmagan</option>
                      {workers.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.full_name}
                        </option>
                      ))}
                    </Select>
                  )}
                />
              </div>
            )}
            <div className="sm:col-span-2">
              <Label htmlFor="comment">Izoh</Label>
              <Textarea id="comment" placeholder="Qo'shimcha izohlar..." {...register("comment")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rasmlar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {images.map((file, idx) => (
                <div key={idx} className="relative h-20 w-20 overflow-hidden rounded-lg border border-border">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Rasm ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                    aria-label="O'chirish"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {images.length < 6 && (
                <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-primary">
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-[10px]">Rasm qo'sh</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                </label>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Bekor qilish
          </Button>
          <Button type="submit" disabled={isSubmitting || createOrder.isPending}>
            {(isSubmitting || createOrder.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
            Buyurtma yaratish
          </Button>
        </div>
      </form>
    </div>
  );
}

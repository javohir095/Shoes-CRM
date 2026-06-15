import { Bot, MessageCircle, ExternalLink } from "lucide-react";
import { PageHeader } from "@/shared/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useCompany } from "@/features/companies/api/companies-api";

export default function TelegramBotPage() {
  const profile = useAuthStore((s) => s.profile);
  const { data: company } = useCompany(profile?.company_id);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Telegram Bot" description="Mijozlar uchun Telegram bot holati va sozlamalari" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-4 w-4" /> Bot haqida
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Telegram bot mijozlarga buyurtma holatini kuzatish, chekni qayta olish, QR/Barcode
            olish va xizmat sifatini baholash imkonini beradi. Bot alohida Node.js (Telegraf.js)
            servis sifatida ishlaydi va Supabase'ga ulanadi.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>📦 Buyurtmalarim</li>
            <li>🔍 Buyurtma qidirish</li>
            <li>📄 Chekni qayta olish</li>
            <li>📱 QR Code olish</li>
            <li>⭐ Mening baholarim</li>
            <li>📞 Aloqa</li>
            <li>ℹ️ Biz haqimizda</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" /> Ulanish
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Botni ishga tushirish uchun BotFather orqali token olish va uni bot serveriga
            qo'shish kerak. Bot statusi va ulanish sozlamalari keyingi versiyada shu yerda
            ko'rsatiladi.
          </p>
          {company?.phone && (
            <p className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              Filial telefon raqami: <span className="font-medium">{company.phone}</span>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

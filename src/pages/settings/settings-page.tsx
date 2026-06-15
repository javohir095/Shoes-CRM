import * as React from "react";
import { Loader2, Save } from "lucide-react";
import { PageHeader } from "@/shared/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Button } from "@/shared/ui/button";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useCompany } from "@/features/companies/api/companies-api";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase";
import { toast } from "sonner";

export default function SettingsPage() {
  const profile = useAuthStore((s) => s.profile);
  const { data: company, isLoading } = useCompany(profile?.company_id);
  const queryClient = useQueryClient();

  const [form, setForm] = React.useState({
    name: "",
    legal_name: "",
    phone: "",
    address: "",
    receipt_footer_text: "",
  });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (company) {
      setForm({
        name: company.name ?? "",
        legal_name: company.legal_name ?? "",
        phone: company.phone ?? "",
        address: company.address ?? "",
        receipt_footer_text: company.receipt_footer_text ?? "",
      });
    }
  }, [company]);

  const handleSave = async () => {
    if (!profile?.company_id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("companies")
        .update({
          name: form.name,
          legal_name: form.legal_name || null,
          phone: form.phone || null,
          address: form.address || null,
          receipt_footer_text: form.receipt_footer_text || null,
        })
        .eq("id", profile.company_id);
      if (error) throw error;
      toast.success("Sozlamalar saqlandi");
      queryClient.invalidateQueries({ queryKey: ["company", profile.company_id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Sozlamalar" description="Kompaniya va chek sozlamalari" />

      <Card>
        <CardHeader>
          <CardTitle>Kompaniya ma'lumotlari</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Nomi</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="legal_name">Yuridik nomi</Label>
            <Input
              id="legal_name"
              value={form.legal_name}
              onChange={(e) => setForm({ ...form, legal_name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="phone">Telefon</Label>
            <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="address">Manzil</Label>
            <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="receipt_footer_text">Chek pastki matni</Label>
            <Textarea
              id="receipt_footer_text"
              value={form.receipt_footer_text}
              onChange={(e) => setForm({ ...form, receipt_footer_text: e.target.value })}
              placeholder="Xaridingiz uchun rahmat!"
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Saqlash
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

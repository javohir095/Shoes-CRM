import * as React from "react";
import { Loader2 } from "lucide-react";
import { Dialog } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Button } from "@/shared/ui/button";
import { useCreateCompany, useUpdateCompany } from "@/features/companies/api/companies-api";
import type { Company } from "@/types/database.types";

interface CompanyFormDialogProps {
  open: boolean;
  onClose: () => void;
  company?: Company | null; // if provided -> edit mode
}

export function CompanyFormDialog({ open, onClose, company }: CompanyFormDialogProps) {
  const isEdit = !!company;
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();

  const [form, setForm] = React.useState({
    name: "",
    legal_name: "",
    phone: "",
    address: "",
    receipt_footer_text: "",
  });

  React.useEffect(() => {
    if (open) {
      setForm({
        name: company?.name ?? "",
        legal_name: company?.legal_name ?? "",
        phone: company?.phone ?? "",
        address: company?.address ?? "",
        receipt_footer_text: company?.receipt_footer_text ?? "",
      });
    }
  }, [open, company]);

  const submitting = createCompany.isPending || updateCompany.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const payload = {
      name: form.name.trim(),
      legal_name: form.legal_name || null,
      phone: form.phone || null,
      address: form.address || null,
      receipt_footer_text: form.receipt_footer_text || null,
    };

    if (isEdit && company) {
      await updateCompany.mutateAsync({ id: company.id, ...payload });
    } else {
      await createCompany.mutateAsync(payload);
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title={isEdit ? "Filialni tahrirlash" : "Yangi filial"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="company-name">Filial nomi</Label>
          <Input
            id="company-name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Shoe Care - Chilonzor"
          />
        </div>
        <div>
          <Label htmlFor="company-legal-name">Yuridik nomi</Label>
          <Input
            id="company-legal-name"
            value={form.legal_name}
            onChange={(e) => setForm((f) => ({ ...f, legal_name: e.target.value }))}
            placeholder='"Shoe Care Tashkent" MChJ'
          />
        </div>
        <div>
          <Label htmlFor="company-phone">Telefon</Label>
          <Input
            id="company-phone"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="+998901234567"
          />
        </div>
        <div>
          <Label htmlFor="company-address">Manzil</Label>
          <Input
            id="company-address"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            placeholder="Toshkent sh., ..."
          />
        </div>
        <div>
          <Label htmlFor="company-receipt-footer">Chek pastki matni</Label>
          <Textarea
            id="company-receipt-footer"
            value={form.receipt_footer_text}
            onChange={(e) => setForm((f) => ({ ...f, receipt_footer_text: e.target.value }))}
            placeholder="Xizmatimizdan foydalanganingiz uchun rahmat!"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Saqlash" : "Yaratish"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

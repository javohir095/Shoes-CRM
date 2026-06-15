import * as React from "react";
import { Building2, Plus, Pencil, Trash2, Users, Phone, MapPin, ArrowLeft } from "lucide-react";
import { PageHeader, EmptyState } from "@/shared/ui/page-header";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { useAllCompanies, useUpdateCompany, useDeleteCompany } from "@/features/companies/api/companies-api";
import { CompanyFormDialog } from "@/features/companies/ui/company-form-dialog";
import { StaffList } from "@/widgets/workers/staff-list";
import { formatDate } from "@/shared/lib/utils";
import type { Company } from "@/types/database.types";

export default function CompaniesPage() {
  const { data: companies, isLoading } = useAllCompanies();
  const updateCompany = useUpdateCompany();
  const deleteCompany = useDeleteCompany();

  const [formOpen, setFormOpen] = React.useState(false);
  const [editingCompany, setEditingCompany] = React.useState<Company | null>(null);
  const [deletingCompany, setDeletingCompany] = React.useState<Company | null>(null);
  const [selectedCompany, setSelectedCompany] = React.useState<Company | null>(null);

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditingCompany(null);
    setFormOpen(true);
  };

  const handleToggleActive = (company: Company) => {
    updateCompany.mutate({ id: company.id, is_active: !company.is_active });
  };

  const handleDelete = async () => {
    if (!deletingCompany) return;
    await deleteCompany.mutateAsync(deletingCompany.id);
    setDeletingCompany(null);
  };

  // Drill-down: show staff of the selected company
  if (selectedCompany) {
    return (
      <div>
        <PageHeader
          title={selectedCompany.name}
          description="Filial xodimlari"
          actions={
            <Button variant="ghost" size="sm" onClick={() => setSelectedCompany(null)}>
              <ArrowLeft className="h-4 w-4" /> Filiallarga qaytish
            </Button>
          }
        />
        <StaffList companyId={selectedCompany.id} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Filiallar"
        description="Barcha filiallarni boshqarish"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4" /> Yangi filial
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : !companies || companies.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-10 w-10" />}
          title="Filiallar topilmadi"
          action={
            <Button variant="outline" size="sm" onClick={handleCreate}>
              <Plus className="h-4 w-4" /> Yangi filial
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((c) => (
            <Card key={c.id} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-base font-semibold">{c.name}</p>
                  {c.legal_name && <p className="text-xs text-muted-foreground">{c.legal_name}</p>}
                </div>
                <button
                  onClick={() => handleToggleActive(c)}
                  className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium transition-colors ${
                    c.is_active ? "bg-success/10 text-success hover:bg-success/20" : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                  }`}
                  title="Holatni almashtirish"
                >
                  {c.is_active ? "Faol" : "Faol emas"}
                </button>
              </div>

              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                {c.phone && (
                  <p className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> {c.phone}
                  </p>
                )}
                {c.address && (
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> {c.address}
                  </p>
                )}
              </div>

              <p className="mt-3 text-xs text-muted-foreground">Yaratilgan: {formatDate(c.created_at)}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setSelectedCompany(c)}>
                  <Users className="h-3.5 w-3.5" /> Xodimlar
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleEdit(c)}>
                  <Pencil className="h-3.5 w-3.5" /> Tahrirlash
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setDeletingCompany(c)}>
                  <Trash2 className="h-3.5 w-3.5" /> O'chirish
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CompanyFormDialog open={formOpen} onClose={() => setFormOpen(false)} company={editingCompany} />

      <ConfirmDialog
        open={!!deletingCompany}
        onClose={() => setDeletingCompany(null)}
        onConfirm={handleDelete}
        title="Filialni o'chirish"
        description={`"${deletingCompany?.name}" filialini o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi va filialga bog'liq barcha ma'lumotlar (buyurtmalar, xodimlar va h.k.) o'chiriladi.`}
        confirmLabel="O'chirish"
        loading={deleteCompany.isPending}
      />
    </div>
  );
}

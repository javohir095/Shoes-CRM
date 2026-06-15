import * as React from "react";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Dialog } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select } from "@/shared/ui/select";
import { Button } from "@/shared/ui/button";
import { createStaffAccount } from "@/features/auth/api/staff-api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useAllCompanies } from "@/features/companies/api/companies-api";
import { ROLE_LABELS } from "@/shared/constants/orders";
import type { UserRole } from "@/types/database.types";

interface AddStaffDialogProps {
  open: boolean;
  onClose: () => void;
  /** Agar berilsa (super_admin filial ichidan qo'shganda), kompaniya tanlovi yashiriladi */
  companyId?: string;
}

export function AddStaffDialog({ open, onClose, companyId }: AddStaffDialogProps) {
  const profile = useAuthStore((s) => s.profile);
  const queryClient = useQueryClient();
  const isSuperAdmin = profile?.role === "super_admin";
  const { data: companies } = useAllCompanies();

  const availableRoles: UserRole[] = isSuperAdmin ? ["worker", "admin", "super_admin"] : ["worker"];

  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [login, setLogin] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [role, setRole] = React.useState<UserRole>("worker");
  const [percentage, setPercentage] = React.useState("30");
  const [selectedCompanyId, setSelectedCompanyId] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setFullName("");
      setPhone("");
      setLogin("");
      setPassword("");
      setShowPassword(false);
      setRole("worker");
      setPercentage("30");
      setError(null);
      setSelectedCompanyId(companyId ?? profile?.company_id ?? "");
    }
  }, [open, companyId, profile?.company_id]);

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) return setError("Ism familyani kiriting");
    if (!/^[a-zA-Z0-9_.]{3,32}$/.test(login)) {
      return setError("Login 3-32 belgi, faqat lotin harf/raqam/._ bo'lishi mumkin");
    }
    if (password.length < 6) return setError("Parol kamida 6 belgidan iborat bo'lishi kerak");

    const targetCompanyId = role === "super_admin" ? null : (companyId ?? selectedCompanyId);
    if (role !== "super_admin" && !targetCompanyId) {
      return setError("Filialni tanlang");
    }

    setSubmitting(true);
    try {
      await createStaffAccount({
        login,
        password,
        full_name: fullName.trim(),
        phone: phone || null,
        role,
        percentage: role === "worker" ? Number(percentage) : undefined,
        company_id: targetCompanyId,
      });
      toast.success("Xodim qo'shildi");
      queryClient.invalidateQueries({ queryKey: ["company-users"] });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} title="Yangi xodim qo'shish">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="staff-full-name">Ism familya</Label>
          <Input
            id="staff-full-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Sardor Tojiyev"
          />
        </div>

        <div>
          <Label htmlFor="staff-phone">Telefon (ixtiyoriy)</Label>
          <Input
            id="staff-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+998901234567"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="staff-login">Login</Label>
            <Input
              id="staff-login"
              value={login}
              onChange={(e) => setLogin(e.target.value.toLowerCase())}
              placeholder="sardor"
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>
          <div>
            <Label htmlFor="staff-password">Parol</Label>
            <div className="relative">
              <Input
                id="staff-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="staff-role">Rol</Label>
            <Select
              id="staff-role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              disabled={availableRoles.length === 1}
            >
              {availableRoles.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </Select>
          </div>
          {role === "worker" && (
            <div>
              <Label htmlFor="staff-percentage">Ulush foizi (%)</Label>
              <Input
                id="staff-percentage"
                type="number"
                min={0}
                max={100}
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
              />
            </div>
          )}
        </div>

        {isSuperAdmin && !companyId && role !== "super_admin" && (
          <div>
            <Label htmlFor="staff-company">Filial</Label>
            <Select
              id="staff-company"
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
            >
              <option value="">Tanlanmagan</option>
              {(companies ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleClose}>
            Bekor qilish
          </Button>
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Qo'shish
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

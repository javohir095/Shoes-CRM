import { PageHeader } from "@/shared/ui/page-header";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { StaffList } from "@/widgets/workers/staff-list";

export default function WorkersPage() {
  const profile = useAuthStore((s) => s.profile);

  return (
    <div>
      <PageHeader title="Xodimlar" description="Ishchilar va adminlarni boshqarish" />
      <StaffList companyId={profile?.company_id ?? undefined} />
    </div>
  );
}

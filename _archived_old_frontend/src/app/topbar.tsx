import * as React from "react";
import { Menu, Sun, Moon, LogOut, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/shared/theme/theme-provider";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { signOut } from "@/features/auth/api/auth-api";
import { Avatar } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { ROLE_LABELS } from "@/shared/constants/orders";
import { toast } from "sonner";
import { ChangePasswordDialog } from "@/features/auth/ui/change-password-dialog";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { theme, toggleTheme } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const navigate = useNavigate();
  const [passwordOpen, setPasswordOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch {
      toast.error("Chiqishda xatolik yuz berdi");
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-xl lg:px-8">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-muted-foreground hover:bg-secondary lg:hidden"
        aria-label="Menyu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </Button>

        {profile && (
          <div className="ml-1 flex items-center gap-3 rounded-xl border border-border bg-card/60 px-2 py-1.5">
            <Avatar name={profile.full_name} src={profile.avatar_url} className="h-8 w-8" />
            <div className="hidden text-left leading-tight sm:block">
              <p className="text-sm font-medium">{profile.full_name}</p>
              <p className="text-xs text-muted-foreground">{ROLE_LABELS[profile.role]}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPasswordOpen(true)}
              aria-label="Parolni o'zgartirish"
              className="ml-1"
            >
              <KeyRound className="h-[18px] w-[18px]" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Chiqish">
              <LogOut className="h-[18px] w-[18px]" />
            </Button>
          </div>
        )}
      </div>

      {profile && (
        <ChangePasswordDialog
          open={passwordOpen}
          onClose={() => setPasswordOpen(false)}
          userId={profile.id}
          userName={profile.full_name}
        />
      )}
    </header>
  );
}

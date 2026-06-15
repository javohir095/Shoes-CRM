import { KeyRound } from "lucide-react";
import { Dialog } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";

interface ChangePasswordDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

export function ChangePasswordDialog({ open, onClose, userName }: ChangePasswordDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={`Parolni o'zgartirish — ${userName}`}>
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <KeyRound className="h-6 w-6" />
        </div>
        <p className="font-medium">Tez kunda</p>
        <p className="text-sm text-muted-foreground">
          Parolni UI orqali o'zgartirish funksiyasi tayyorlanmoqda. Hozircha parolni Supabase
          Dashboard → Authentication → Users bo'limidan o'zgartirish mumkin.
        </p>
        <Button size="sm" variant="outline" onClick={onClose}>
          Tushunarli
        </Button>
      </div>
    </Dialog>
  );
}

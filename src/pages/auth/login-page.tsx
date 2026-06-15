import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Footprints, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { signInWithPassword } from "@/features/auth/api/auth-api";
import { loginToEmailCandidates } from "@/features/auth/lib/login-email";

const loginSchema = z.object({
  login: z.string().min(2, "Login kiriting"),
  password: z.string().min(6, "Parol kamida 6 belgidan iborat bo'lishi kerak"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginForm) => {
    const candidates = loginToEmailCandidates(values.login);
    let lastError: unknown = null;

    for (const email of candidates) {
      try {
        await signInWithPassword(email, values.password);
        toast.success("Xush kelibsiz!");
        const redirectTo = (location.state as { from?: string })?.from || "/";
        navigate(redirectTo, { replace: true });
        return;
      } catch (err) {
        lastError = err;
        // "Invalid login credentials" bo'lsa, keyingi domen bilan urinib ko'ramiz
        const message = err instanceof Error ? err.message : "";
        if (message !== "Invalid login credentials") break;
      }
    }

    const message = lastError instanceof Error ? lastError.message : "Kirishda xatolik yuz berdi";
    toast.error(message === "Invalid login credentials" ? "Login yoki parol noto'g'ri" : message);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* Ambient gradient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[500px] rounded-full bg-leather/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="glass-strong w-full max-w-md rounded-2xl p-8"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-glow">
            <Footprints className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Shoe Care ERP
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tizimga kirish uchun ma'lumotlarni kiriting
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="login">Login</Label>
            <Input
              id="login"
              type="text"
              placeholder="masalan: sardor"
              autoComplete="username"
              autoCapitalize="none"
              {...register("login")}
            />
            {errors.login && (
              <p className="mt-1 text-xs text-destructive">{errors.login.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password">Parol</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                className="pr-10"
                {...register("password")}
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
            {errors.password && (
              <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting} size="lg">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Kirish
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

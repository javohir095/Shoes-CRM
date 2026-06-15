import { cn } from "@/shared/lib/utils";

export function Avatar({
  name,
  src,
  className,
}: {
  name: string;
  src?: string | null;
  className?: string;
}) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn("h-9 w-9 rounded-full object-cover border border-border", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary border border-primary/20",
        className
      )}
    >
      {initials || "?"}
    </div>
  );
}

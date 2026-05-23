import { cn } from "@/utils/cn";

interface BadgeProps {
  variant: "active" | "inactive" | "critical" | "custom";
  children: React.ReactNode;
  className?: string;
}

const variantStyles = {
  active:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/25",
  inactive:
    "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/15 dark:text-slate-400 dark:border-slate-500/25",
  critical:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/25",
  custom: "",
};

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-medium transition-colors",
        variantStyles[variant],
        className
      )}
    >
      {variant !== "custom" && variant !== "inactive" && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            variant === "active" && "bg-emerald-500 dark:bg-emerald-400",
            variant === "critical" && "bg-red-500 dark:bg-red-400 animate-pulse"
          )}
        />
      )}
      {children}
    </span>
  );
}

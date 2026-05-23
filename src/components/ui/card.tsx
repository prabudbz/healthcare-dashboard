import { type ReactNode } from "react";
import { cn } from "@/utils/cn";

interface CardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}

export function Card({ children, className, glow = false }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800/50 dark:backdrop-blur-xl",
        "transition-all duration-300 shadow-sm",
        glow &&
          "hover:border-teal-500/30 dark:hover:border-teal-500/20 hover:shadow-md hover:shadow-teal-500/5",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/50",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("px-5 py-3.5", className)}>{children}</div>;
}

export function CardFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "px-5 py-3.5 border-t border-slate-100 dark:border-slate-800/50",
        className
      )}
    >
      {children}
    </div>
  );
}

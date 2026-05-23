"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/utils/cn";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  trend?: { value: number; positive: boolean };
  gradient: string;
  delay?: number;
  href?: string;
}

export function StatsCard({
  title,
  value,
  icon,
  trend,
  gradient,
  delay = 0,
  href,
}: StatsCardProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const content = (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/50 dark:backdrop-blur-xl p-6 shadow-sm transition-all duration-500 h-full",
        mounted
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0",
        href && "hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-md cursor-pointer"
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {value.toLocaleString()}
            </h3>
            {trend && (
              <span
                className={cn(
                  "flex items-center text-xs font-semibold",
                  trend.positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                )}
              >
                {trend.positive ? (
                  <TrendingUp className="mr-0.5 w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="mr-0.5 w-3.5 h-3.5" />
                )}
                {trend.value}%
              </span>
            )}
          </div>
        </div>
        <div
          className={cn(
            "flex items-center justify-center w-12 h-12 rounded-xl",
            gradient
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block h-full">{content}</Link>;
  }

  return content;
}

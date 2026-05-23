"use client";

import { useTheme } from "@/store/theme-context";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/utils/cn";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative p-1.5 rounded-lg transition-all duration-300",
        "hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
      )}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <div className="relative w-4 h-4">
        <Sun
          className={cn(
            "absolute inset-0 h-4 w-4 transition-all duration-300",
            theme === "dark"
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-0 opacity-0"
          )}
        />
        <Moon
          className={cn(
            "absolute inset-0 h-4 w-4 transition-all duration-300",
            theme === "light"
              ? "rotate-0 scale-100 opacity-100"
              : "rotate-90 scale-0 opacity-0"
          )}
        />
      </div>
    </button>
  );
}

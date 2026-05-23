"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/cn";
import { useAuth } from "@/store/auth-context";
import { useSidebar } from "@/store/sidebar-context";
import { getInitials } from "@/utils/format";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Activity,
  FileText,
} from "lucide-react";

import { Stethoscope } from "lucide-react";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "staff", "doctor"],
  },
  {
    label: "Patients",
    href: "/dashboard/patients",
    icon: Users,
    roles: ["admin", "staff", "doctor"],
  },
  {
    label: "Appointments",
    href: "/dashboard/appointments",
    icon: CalendarDays,
    roles: ["admin", "staff", "doctor"],
  },
  {
    label: "Doctors",
    href: "/dashboard/doctors",
    icon: Stethoscope,
    roles: ["admin", "staff"], // Only admin/staff
  },
  {
    label: "Reports",
    href: "/dashboard/reports",
    icon: FileText,
    roles: ["admin"], // Only admin
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    roles: ["admin", "staff", "doctor"],
  },
];

export function Sidebar() {
  const { isOpen, setIsOpen, isCollapsed, setIsCollapsed } = useSidebar();
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();

  const userEmail = user?.email ?? "User";
  const initials = getInitials(userEmail.split("@")[0].replace(/[._-]/g, " "));

  const showFullContent = !isCollapsed || isOpen;
  const isCollapsedDesktopOnly = isCollapsed && !isOpen;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          "flex flex-col h-full bg-white dark:bg-slate-950/50 border-r border-slate-200 dark:border-slate-800/50 dark:backdrop-blur-xl transition-all duration-300",
          // Mobile responsive drawer
          "fixed inset-y-0 left-0 z-50 md:static md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          // Desktop responsive collapsible width
          isCollapsedDesktopOnly ? "md:w-[68px]" : "md:w-60",
          "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 h-16 border-b border-slate-200 dark:border-slate-800/50">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-teal-500 shadow-sm shadow-teal-500/20">
            <Activity className="w-5 h-5 text-white" />
          </div>
          {showFullContent && (
            <div className="flex flex-col">
              <span className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                MedDash
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Healthcare
              </span>
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1.5" aria-label="Main navigation">
          {navItems
            .filter((item) => profile?.role ? item.roles.includes(profile.role) : false)
            .map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50",
                  isCollapsedDesktopOnly && "md:justify-center md:px-0 md:py-3"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
                {showFullContent && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle (Desktop only) */}
        <div className="hidden md:block px-3 pb-3">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>

        {/* User section */}
        <div className="border-t border-slate-200 dark:border-slate-800/50 p-3.5">
          <div
            className={cn(
              "flex items-center gap-2.5",
              isCollapsedDesktopOnly && "md:justify-center"
            )}
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-500 text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            {showFullContent && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-200 truncate">
                  {profile?.full_name || userEmail.split("@")[0]}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={cn(
                    "text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-sm",
                    profile?.role === "admin" ? "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400" :
                    profile?.role === "doctor" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" :
                    "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400"
                  )}>
                    {profile?.role || "Staff"}
                  </span>
                  <p className="text-[10px] text-slate-500 truncate">{userEmail}</p>
                </div>
              </div>
            )}
            {showFullContent && (
              <button
                onClick={signOut}
                className="p-1.5 rounded-md text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

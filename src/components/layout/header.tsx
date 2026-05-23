"use client";

import { useState, useEffect, useRef } from "react";
import { ThemeToggle } from "./theme-toggle";
import { Bell, Search, Menu, CheckCircle2 } from "lucide-react";
import { cn } from "@/utils/cn";
import { useSidebar } from "@/store/sidebar-context";
import { GlobalSearch } from "./global-search";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, type Notification } from "@/services/notification-actions";
import { formatDate } from "@/utils/format";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({ title = "Dashboard", subtitle }: HeaderProps) {
  const { setIsOpen } = useSidebar();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch initial notifications
    const fetchNotifs = async () => {
      const res = await getNotifications();
      if (res.success && res.data) {
        setNotifications(res.data);
      }
    };
    fetchNotifs();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    await markNotificationAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    await markAllNotificationsAsRead();
  };

  return (
    <header className="relative z-50 flex items-center justify-between h-16 px-6 border-b border-slate-200 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/30 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        {/* Hamburger Menu Toggle (Mobile) */}
        <button
          onClick={() => setIsOpen(true)}
          className="p-1.5 -ml-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 md:hidden transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h1>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Global Search */}
        <GlobalSearch />

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={cn(
              "relative p-2 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500",
              showNotifications 
                ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100" 
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50"
            )}
            aria-label="Notifications"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-teal-500 ring-2 ring-white dark:ring-slate-950" />
            )}
          </button>
          
          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800/50">
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllAsRead}
                    className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              
              <div className="max-h-[360px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mx-auto mb-3">
                      <Bell className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">All caught up!</p>
                    <p className="text-xs text-slate-500 mt-1">No new notifications right now.</p>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {notifications.map(n => (
                      <div 
                        key={n.id} 
                        className={cn(
                          "relative p-4 border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors cursor-pointer group",
                          !n.is_read ? "bg-teal-50/50 dark:bg-teal-500/5" : ""
                        )}
                        onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                      >
                        {!n.is_read && (
                          <span className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500 rounded-r" />
                        )}
                        <div className="flex justify-between items-start mb-1 gap-2">
                          <h4 className={cn(
                            "text-sm font-semibold",
                            !n.is_read ? "text-slate-900 dark:text-slate-100" : "text-slate-700 dark:text-slate-300"
                          )}>
                            {n.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {formatDate(n.created_at)}
                          </span>
                        </div>
                        <p className={cn(
                          "text-xs leading-relaxed",
                          !n.is_read ? "text-slate-700 dark:text-slate-300" : "text-slate-500 dark:text-slate-400"
                        )}>
                          {n.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />
      </div>
    </header>
  );
}

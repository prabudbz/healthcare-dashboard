"use client";

import { useState, useEffect, useRef } from "react";
import { Search, User, Activity, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { globalSearch, type SearchResult } from "@/services/search-actions";
import { cn } from "@/utils/cn";

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 2) {
        setLoading(true);
        const res = await globalSearch(query);
        if (res.success && res.data) {
          setResults(res.data);
          setIsOpen(true);
        }
        setLoading(false);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (href: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(href);
  };

  return (
    <div className="relative hidden md:block mr-2" ref={dropdownRef}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        type="search"
        placeholder="Search patients & doctors..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (results.length > 0) setIsOpen(true);
        }}
        className={cn(
          "h-10 pl-9.5 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50",
          "text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400",
          "focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500",
          "transition-all duration-200 w-44 focus:w-64 shadow-sm"
        )}
        aria-label="Search"
      />

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden z-50">
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            </div>
          ) : results.length > 0 ? (
            <div className="max-h-80 overflow-y-auto py-2">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result.href)}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-start gap-3"
                >
                  <div className="mt-0.5">
                    {result.type === "patient" ? (
                      <User className="w-4 h-4 text-teal-500" />
                    ) : (
                      <Activity className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {result.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {result.subtitle}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="p-4 text-center text-sm text-slate-500">
              No results found.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { type AppointmentWithPatient, APPOINTMENT_TYPE_COLORS } from "@/types/appointment";
import { formatTime } from "@/utils/format";

interface AppointmentsCalendarProps {
  appointments: AppointmentWithPatient[];
  onDateSelect: (date: Date) => void;
  selectedDate: Date;
}

export function AppointmentsCalendar({ appointments, onDateSelect, selectedDate }: AppointmentsCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const days = useMemo(() => {
    const arr = [];
    // Padding for empty days at the start
    for (let i = 0; i < firstDayOfMonth; i++) {
      arr.push(null);
    }
    // Actual days
    for (let i = 1; i <= daysInMonth; i++) {
      arr.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
    }
    // Padding for end
    const remainder = arr.length % 7;
    if (remainder !== 0) {
      for (let i = 0; i < 7 - remainder; i++) {
        arr.push(null);
      }
    }
    return arr;
  }, [currentMonth, daysInMonth, firstDayOfMonth]);

  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, AppointmentWithPatient[]>();
    appointments.forEach((apt) => {
      const existing = map.get(apt.appointment_date) || [];
      existing.push(apt);
      map.set(apt.appointment_date, existing);
    });
    return map;
  }, [appointments]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const isToday = (d: Date) => {
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  };

  const isSelected = (d: Date) => {
    return d.getDate() === selectedDate.getDate() &&
           d.getMonth() === selectedDate.getMonth() &&
           d.getFullYear() === selectedDate.getFullYear();
  };

  const getLocalDateString = (d: Date) => {
    // Return YYYY-MM-DD
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="h-8 w-8 p-0" onClick={prevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="secondary" size="sm" className="h-8 w-8 p-0" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="grid grid-cols-7 gap-px mb-2">
          {dayNames.map((day) => (
            <div key={day} className="text-center text-xs font-semibold uppercase tracking-wider text-slate-500 py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2 sm:gap-3">
          {days.map((date, i) => {
            if (!date) {
              return <div key={`empty-${i}`} className="min-h-[80px]" />;
            }
            
            const dateStr = getLocalDateString(date);
            const dayApts = appointmentsByDate.get(dateStr) || [];
            
            return (
              <button
                key={dateStr}
                onClick={() => onDateSelect(date)}
                className={cn(
                  "relative flex flex-col items-start min-h-[80px] p-2 rounded-xl transition-all border text-left",
                  isSelected(date)
                    ? "bg-teal-50 border-teal-500 dark:bg-teal-500/20 dark:border-teal-500"
                    : isToday(date)
                    ? "bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-700"
                    : "bg-white border-transparent hover:bg-slate-50 dark:bg-transparent dark:hover:bg-slate-800/50 hover:border-slate-200 dark:hover:border-slate-700"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={cn(
                    "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                    isSelected(date) ? "text-teal-700 dark:text-teal-300 font-bold" 
                    : isToday(date) ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white"
                    : "text-slate-700 dark:text-slate-300"
                  )}>
                    {date.getDate()}
                  </span>
                  {dayApts.length > 0 && (
                    <span className="text-[10px] font-semibold text-slate-500 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                      {dayApts.length}
                    </span>
                  )}
                </div>

                {/* Event dots/indicators */}
                <div className="mt-auto pt-1 w-full flex flex-col gap-1">
                  {dayApts.slice(0, 3).map((apt) => (
                    <div 
                      key={apt.id} 
                      className={cn(
                        "text-[10px] truncate px-1.5 py-0.5 rounded font-medium",
                        APPOINTMENT_TYPE_COLORS[apt.type] || "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      )}
                    >
                      {formatTime(apt.start_time)}
                    </div>
                  ))}
                  {dayApts.length > 3 && (
                    <div className="text-[10px] text-slate-500 px-1">
                      +{dayApts.length - 3} more
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSupabaseRealtime } from "@/hooks/use-supabase-realtime";
import { getAppointmentsByDateRange } from "@/services/appointment-actions";
import { type AppointmentWithPatient } from "@/types/appointment";
import { formatTime, formatDate } from "@/utils/format";
import { Clock, Calendar, AlertCircle, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

export function CalendarView() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Get today's date string in YYYY-MM-DD
  const [currentDateStr, setCurrentDateStr] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const fetchAppointments = async (dateStr: string) => {
    setLoading(true);
    const { data } = await getAppointmentsByDateRange(dateStr, dateStr);
    if (data) setAppointments(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments(currentDateStr);
  }, [currentDateStr]);

  // Realtime subscription
  useSupabaseRealtime<AppointmentWithPatient>({
    table: "appointments",
    onInsert: () => fetchAppointments(currentDateStr),
    onUpdate: () => fetchAppointments(currentDateStr),
    onDelete: () => fetchAppointments(currentDateStr),
  });

  const navigateDate = (days: number) => {
    const d = new Date(currentDateStr);
    d.setDate(d.getDate() + days);
    setCurrentDateStr(d.toISOString().split("T")[0]);
  };

  const setToday = () => {
    setCurrentDateStr(new Date().toISOString().split("T")[0]);
  };

  const isToday = currentDateStr === new Date().toISOString().split("T")[0];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 gap-4 border-b border-slate-100 dark:border-slate-800/50">
        <div className="flex flex-col">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-4.5 h-4.5 text-teal-500" />
            {isToday ? "Today's Schedule" : `Schedule for ${formatDate(currentDateStr)}`}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            <Badge variant="custom" className="bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20 text-[10px] px-2 py-0">
              {appointments.length} Appointments
            </Badge>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 rounded-lg p-1">
            <button 
              onClick={() => navigateDate(-1)}
              className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-white dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={setToday}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                isToday 
                  ? "bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50"
              }`}
            >
              Today
            </button>
            <button 
              onClick={() => navigateDate(1)}
              className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-white dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <Button 
            variant="secondary" 
            size="sm" 
            className="text-xs h-8 gap-1.5"
            onClick={() => router.push("/dashboard/appointments")}
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardHeader>
      
      <CardBody className="flex-1 overflow-auto px-6 py-4">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex gap-4 p-4 rounded-lg border border-slate-100 dark:border-slate-800/50">
                <div className="w-14 h-14 bg-slate-200 dark:bg-slate-800 rounded-md" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : appointments.length > 0 ? (
          <div className="space-y-4">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="group relative flex flex-col gap-2.5 p-4 rounded-xl border border-slate-200 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30 hover:border-teal-500/30 hover:bg-white dark:hover:bg-slate-900/80 transition-all shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center w-9 h-9 rounded bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400">
                      <Clock className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {formatTime(apt.start_time)} - {formatTime(apt.end_time)}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        with {apt.provider_name}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      apt.status === "scheduled" ? "active"
                      : apt.status === "completed" ? "inactive"
                      : apt.status === "cancelled" ? "critical"
                      : "inactive"
                    }
                  >
                    {apt.status}
                  </Badge>
                </div>
                
                <div className="pl-11">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-300">
                    Patient: <span className="font-semibold text-slate-900 dark:text-slate-100">{apt.patient?.full_name || `ID: ${apt.patient_id.substring(0, 8)}...`}</span>
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Badge variant="custom" className="bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 text-[10px] uppercase tracking-wider font-medium px-2 py-0.5">
                      {apt.type}
                    </Badge>
                  </div>
                  {apt.recorded_by && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
                      Recorded by: {apt.recorded_by}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <div className="w-14 h-14 rounded-full bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center mb-3">
              <Calendar className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-base font-semibold text-slate-900 dark:text-slate-200">No appointments</p>
            <p className="text-sm text-slate-500 mt-1">Your schedule is clear for {isToday ? "today" : formatDate(currentDateStr)}.</p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

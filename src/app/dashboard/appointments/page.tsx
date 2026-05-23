"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { AppointmentForm } from "@/components/dashboard/appointment-form";
import { AppointmentsCalendar } from "@/components/appointments/appointments-calendar";
import { getAppointmentsByDateRange, updateAppointmentStatus } from "@/services/appointment-actions";
import { type AppointmentWithPatient, APPOINTMENT_TYPE_COLORS, APPOINTMENT_STATUS_COLORS } from "@/types/appointment";
import { useSupabaseRealtime } from "@/hooks/use-supabase-realtime";
import { formatTime, formatDate } from "@/utils/format";
import { cn } from "@/utils/cn";
import { CalendarPlus, Clock, User, FileText, CheckCircle2, XCircle } from "lucide-react";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Date formatting helper for selected date
  const getLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const selectedDateStr = getLocalDateString(selectedDate);
  const selectedAppointments = appointments.filter(a => a.appointment_date === selectedDateStr);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    // Fetch a wide range (e.g., 3 months before and after)
    const start = new Date();
    start.setMonth(start.getMonth() - 3);
    const end = new Date();
    end.setMonth(end.getMonth() + 3);
    
    const { data } = await getAppointmentsByDateRange(
      getLocalDateString(start),
      getLocalDateString(end)
    );
    
    if (data) {
      setAppointments(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Realtime subscription
  useSupabaseRealtime<AppointmentWithPatient>({
    table: "appointments",
    onInsert: fetchAppointments,
    onUpdate: fetchAppointments,
    onDelete: fetchAppointments,
  });

  const handleBookingSuccess = () => {
    setShowBookingModal(false);
    fetchAppointments();
  };

  const handleStatusChange = async (id: string, status: "completed" | "cancelled") => {
    await updateAppointmentStatus(id, status);
    // Realtime will auto-refresh, but we can optimistically update
    fetchAppointments();
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 lg:h-[calc(100vh-4rem)] min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Appointments</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your schedule and bookings
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowBookingModal(true)}
          className="self-start sm:self-auto"
        >
          <CalendarPlus className="w-4 h-4" />
          Book Appointment
        </Button>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-5 lg:min-h-0">
        {/* Left: Calendar (takes 2 cols on lg) */}
        <div className="lg:col-span-2 lg:h-full min-h-[450px]">
          <AppointmentsCalendar 
            appointments={appointments}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
        </div>

        {/* Right: Selected Date Agenda */}
        <div className="lg:col-span-1 lg:h-full h-[400px] lg:h-auto flex flex-col bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {formatDate(selectedDate)}
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              {selectedAppointments.length} appointment{selectedAppointments.length !== 1 && 's'}
            </p>
          </div>
          
          <div className="flex-1 overflow-auto p-5 space-y-4">
            {selectedAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-center gap-2">
                <CalendarPlus className="w-8 h-8 opacity-20" />
                <p className="text-sm">No appointments scheduled.</p>
              </div>
            ) : (
              selectedAppointments.map(apt => (
                <div 
                  key={apt.id} 
                  className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {formatTime(apt.start_time)} - {formatTime(apt.end_time)}
                        </p>
                        <p className="text-xs text-slate-500">with {apt.provider_name}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border",
                      APPOINTMENT_STATUS_COLORS[apt.status]
                    )}>
                      {apt.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2.5">
                      <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {apt.patient?.full_name}
                        </p>
                        <p className="text-xs text-slate-500 font-mono">
                          {apt.patient?.medical_record_number}
                        </p>
                      </div>
                    </div>
                    {apt.notes && (
                      <div className="flex items-start gap-2.5">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {apt.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions for scheduled appointments */}
                  {apt.status === "scheduled" && (
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/50">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="flex-1 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400 dark:hover:border-emerald-500/30"
                        onClick={() => handleStatusChange(apt.id, "completed")}
                      >
                        <CheckCircle2 className="w-4 h-4" /> Complete
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="flex-1 hover:text-red-600 hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-500/10 dark:hover:text-red-400 dark:hover:border-red-500/30"
                        onClick={() => handleStatusChange(apt.id, "cancelled")}
                      >
                        <XCircle className="w-4 h-4" /> Cancel
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <Modal
        open={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        title="Book Appointment"
        size="lg"
      >
        <AppointmentForm 
          onSuccess={handleBookingSuccess}
          onCancel={() => setShowBookingModal(false)}
        />
      </Modal>
    </div>
  );
}

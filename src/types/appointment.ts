import { z } from "zod";

export interface Appointment {
  id: string;
  patient_id: string;
  patient_name?: string;
  provider_name: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  type: "checkup" | "follow-up" | "emergency" | "consultation";
  status: "scheduled" | "completed" | "cancelled" | "no-show";
  notes: string | null;
  recorded_by?: string;
  created_at: string;
  [key: string]: any;
}

export const AppointmentFormSchema = z.object({
  patient_id: z.string().uuid("Invalid patient ID"),
  provider_name: z
    .string()
    .min(2, "Provider name must be at least 2 characters"),
  appointment_date: z.string().min(1, "Appointment date is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  type: z.enum(["checkup", "follow-up", "emergency", "consultation"]),
  status: z
    .enum(["scheduled", "completed", "cancelled", "no-show"])
    .default("scheduled"),
  notes: z.string().nullable().optional(),
});

export type AppointmentFormData = z.infer<typeof AppointmentFormSchema>;

export interface AppointmentWithPatient extends Appointment {
  patient: {
    id: string;
    full_name: string;
    medical_record_number: string;
  };
}

export const APPOINTMENT_TYPE_COLORS: Record<Appointment["type"], string> = {
  checkup: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "follow-up": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  emergency: "bg-red-500/20 text-red-400 border-red-500/30",
  consultation: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export const APPOINTMENT_STATUS_COLORS: Record<Appointment["status"], string> = {
  scheduled: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  "no-show": "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

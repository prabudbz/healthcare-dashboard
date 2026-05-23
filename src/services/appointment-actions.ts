"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  AppointmentFormSchema,
  type AppointmentFormData,
  type Appointment,
  type AppointmentWithPatient,
} from "@/types/appointment";
import type { ActionResponse } from "@/types";

export async function getAppointments(
  filters?: {
    date?: string;
    status?: Appointment["status"];
    patientId?: string;
  }
): Promise<ActionResponse<AppointmentWithPatient[]>> {
  try {
    const supabase = await createServerSupabaseClient();

    let query = supabase
      .from("appointments")
      .select(`
        *,
        patient:patients!patient_id (
          id,
          full_name,
          medical_record_number
        )
      `)
      .order("appointment_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (filters?.date) {
      query = query.eq("appointment_date", filters.date);
    }

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    if (filters?.patientId) {
      query = query.eq("patient_id", filters.patientId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, data: data as AppointmentWithPatient[] };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch appointments",
    };
  }
}

export async function getAppointmentsByDateRange(
  startDate: string,
  endDate: string
): Promise<ActionResponse<AppointmentWithPatient[]>> {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("appointments")
      .select(`
        *,
        patient:patients!patient_id (
          id,
          full_name,
          medical_record_number
        )
      `)
      .gte("appointment_date", startDate)
      .lte("appointment_date", endDate)
      .order("appointment_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) throw error;

    return { success: true, data: data as AppointmentWithPatient[] };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch appointments",
    };
  }
}

export async function createAppointment(
  formData: AppointmentFormData
): Promise<ActionResponse<Appointment>> {
  try {
    const validated = AppointmentFormSchema.parse(formData);
    const supabase = await createServerSupabaseClient();

    // Check for time conflicts
    const { data: conflicts } = await supabase
      .from("appointments")
      .select("id")
      .eq("appointment_date", validated.appointment_date)
      .eq("provider_name", validated.provider_name)
      .neq("status", "cancelled")
      .or(
        `and(start_time.lt.${validated.end_time},end_time.gt.${validated.start_time})`
      );

    if (conflicts && conflicts.length > 0) {
      return {
        success: false,
        error: "Time conflict: provider already has an appointment in this slot",
      };
    }

    // Determine who is recording this
    let recordedBy = "System";
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", session.user.id)
        .single();
      if (profile) {
        recordedBy = `${profile.full_name} (${profile.role.charAt(0).toUpperCase() + profile.role.slice(1)})`;
      }
    }
    
    const insertPayload = { ...validated, recorded_by: recordedBy };

    const { data, error } = await supabase
      .from("appointments")
      .insert([insertPayload])
      .select()
      .single();

    if (error) throw error;

    // Send notification to the assigned doctor
    if (validated.provider_name) {
      const rawName = validated.provider_name.replace(/^Dr\.\s*/i, '');
      const { data: docProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "doctor")
        .ilike("full_name", rawName)
        .single();
        
      if (docProfile) {
        await supabase.from("notifications").insert({
          user_id: docProfile.id,
          title: "New Appointment Booked",
          message: `A new ${validated.type} appointment has been scheduled with you on ${validated.appointment_date} by ${recordedBy}.`
        });
      }
    }

    return { success: true, data: data as Appointment };
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return { success: false, error: "Validation failed: " + error.message };
    }
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create appointment",
    };
  }
}

export async function updateAppointmentStatus(
  id: string,
  status: Appointment["status"]
): Promise<ActionResponse<Appointment>> {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: data as Appointment };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update appointment status",
    };
  }
}

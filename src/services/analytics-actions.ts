"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { ActionResponse, DashboardStats } from "@/types";
import type { Patient } from "@/types/patient";
import type { AppointmentWithPatient } from "@/types/appointment";

export async function getDashboardStats(): Promise<
  ActionResponse<DashboardStats>
> {
  try {
    const supabase = await createServerSupabaseClient();
    const today = new Date().toISOString().split("T")[0];
    const monthStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    )
      .toISOString()
      .split("T")[0];
    const weekStart = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    )
      .toISOString()
      .split("T")[0];

    const [
      totalPatients,
      patientsToday,
      activePatients,
      criticalPatients,
      todayAppointments,
      completedToday,
      upcomingAppointments,
      newPatientsThisMonth,
      cancelledThisWeek,
    ] = await Promise.all([
      supabase.from("patients").select("*", { count: "exact", head: true }),
      supabase
        .from("patients")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today),
      supabase
        .from("patients")
        .select("*", { count: "exact", head: true })
        .eq("status", "active"),
      supabase
        .from("patients")
        .select("*", { count: "exact", head: true })
        .eq("status", "critical"),
      supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("appointment_date", today),
      supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("appointment_date", today)
        .eq("status", "completed"),
      supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .gte("appointment_date", today)
        .eq("status", "scheduled"),
      supabase
        .from("patients")
        .select("*", { count: "exact", head: true })
        .gte("created_at", monthStart),
      supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .gte("appointment_date", weekStart)
        .eq("status", "cancelled"),
    ]);

    return {
      success: true,
      data: {
        totalPatients: totalPatients.count ?? 0,
        patientsToday: patientsToday.count ?? 0,
        activePatients: activePatients.count ?? 0,
        criticalPatients: criticalPatients.count ?? 0,
        todayAppointments: todayAppointments.count ?? 0,
        completedToday: completedToday.count ?? 0,
        upcomingAppointments: upcomingAppointments.count ?? 0,
        newPatientsThisMonth: newPatientsThisMonth.count ?? 0,
        cancelledThisWeek: cancelledThisWeek.count ?? 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch dashboard stats",
    };
  }
}

export async function getRecentPatients(): Promise<
  ActionResponse<Patient[]>
> {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) throw error;

    return { success: true, data: data as Patient[] };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch recent patients",
    };
  }
}

export async function getUpcomingAppointments(): Promise<
  ActionResponse<AppointmentWithPatient[]>
> {
  try {
    const supabase = await createServerSupabaseClient();
    const today = new Date().toISOString().split("T")[0];

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
      .gte("appointment_date", today)
      .eq("status", "scheduled")
      .order("appointment_date", { ascending: true })
      .order("start_time", { ascending: true })
      .limit(5);

    if (error) throw error;

    return { success: true, data: data as AppointmentWithPatient[] };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch upcoming appointments",
    };
  }
}

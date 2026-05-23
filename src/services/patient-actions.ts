"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { PatientFormSchema, type PatientFormData, type Patient } from "@/types/patient";
import type { ActionResponse, PaginatedResponse } from "@/types";

export async function getPatients(
  page = 1,
  pageSize = 10,
  search?: string,
  statusFilter?: Patient["status"],
  filter?: "today" | string,
  dateRange?: { start: string; end: string }
): Promise<ActionResponse<PaginatedResponse<Patient>>> {
  try {
    const supabase = await createServerSupabaseClient();

    let query = supabase
      .from("patients")
      .select("*", { count: "exact" });

    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,email.ilike.%${search}%,medical_record_number.ilike.%${search}%`
      );
    }

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    if (filter === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query = query.gte("created_at", today.toISOString());
    }

    if (dateRange && dateRange.start && dateRange.end) {
      // Ensure end date covers the whole day by appending time
      const endOfDay = new Date(dateRange.end);
      endOfDay.setHours(23, 59, 59, 999);
      query = query.gte("created_at", new Date(dateRange.start).toISOString())
                   .lte("created_at", endOfDay.toISOString());
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      success: true,
      data: {
        data: data as Patient[],
        count: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch patients",
    };
  }
}

export async function getPatientById(
  id: string
): Promise<ActionResponse<Patient>> {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    return { success: true, data: data as Patient };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch patient",
    };
  }
}

export async function createPatient(
  formData: PatientFormData
): Promise<ActionResponse<Patient>> {
  try {
    const validated = PatientFormSchema.parse(formData);
    const supabase = await createServerSupabaseClient();

    // Auto-generate MRN if not provided
    if (!validated.medical_record_number) {
      const ts = Date.now().toString(36).toUpperCase();
      const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
      validated.medical_record_number = `MRN-${ts}-${rand}`;
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
    
    // Create patient with recorded_by
    const insertPayload = { ...validated, recorded_by: recordedBy };

    const { data, error } = await supabase
      .from("patients")
      .insert([insertPayload])
      .select()
      .single();

    if (error) throw error;

    // Send notification to the assigned doctor
    if (validated.assigned_doctor) {
      // The assigned doctor name might have "Dr. " prefix. We look them up.
      const rawName = validated.assigned_doctor.replace(/^Dr\.\s*/i, '');
      const { data: docProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "doctor")
        .ilike("full_name", rawName)
        .single();
        
      if (docProfile) {
        await supabase.from("notifications").insert({
          user_id: docProfile.id,
          title: "New Patient Assigned",
          message: `${data.full_name} has been assigned to you by ${recordedBy}.`
        });
      }
    }

    return { success: true, data: data as Patient };
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return { success: false, error: "Validation failed: " + error.message };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create patient",
    };
  }
}

export async function updatePatient(
  id: string,
  formData: Partial<PatientFormData>
): Promise<ActionResponse<Patient>> {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("patients")
      .update({ ...formData, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: data as Patient };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update patient",
    };
  }
}

export async function deletePatient(
  id: string
): Promise<ActionResponse> {
  try {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase
      .from("patients")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete patient",
    };
  }
}

export async function searchPatients(
  query: string
): Promise<ActionResponse<Pick<Patient, "id" | "full_name" | "medical_record_number">[]>> {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("patients")
      .select("id, full_name, medical_record_number")
      .or(`full_name.ilike.%${query}%,medical_record_number.ilike.%${query}%`)
      .limit(10);

    if (error) throw error;

    return { success: true, data: data ?? [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Search failed",
    };
  }
}

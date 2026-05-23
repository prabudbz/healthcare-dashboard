"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { type ActionResponse } from "@/types";

export type SearchResult = {
  type: "patient" | "doctor";
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

export async function globalSearch(query: string): Promise<ActionResponse<SearchResult[]>> {
  if (!query || query.length < 2) return { success: true, data: [] };

  try {
    const supabase = await createServerSupabaseClient();
    const results: SearchResult[] = [];

    // Search Patients
    const { data: patients, error: patientError } = await supabase
      .from("patients")
      .select("id, full_name, medical_record_number")
      .or(`full_name.ilike.%${query}%,medical_record_number.ilike.%${query}%`)
      .limit(5);

    if (!patientError && patients) {
      patients.forEach(p => results.push({
        type: "patient",
        id: p.id,
        title: p.full_name,
        subtitle: `MRN: ${p.medical_record_number}`,
        href: `/dashboard/patients/${p.id}`
      }));
    }

    // Search Doctors
    const { data: doctors, error: doctorError } = await supabase
      .from("profiles")
      .select("id, full_name, specialty")
      .eq("role", "doctor")
      .ilike("full_name", `%${query}%`)
      .limit(5);

    if (!doctorError && doctors) {
      doctors.forEach(d => results.push({
        type: "doctor",
        id: d.id,
        title: `Dr. ${d.full_name}`,
        subtitle: d.specialty || "Doctor",
        href: `/dashboard/doctors?doctorId=${d.id}`
      }));
    }

    return { success: true, data: results };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Search failed",
    };
  }
}

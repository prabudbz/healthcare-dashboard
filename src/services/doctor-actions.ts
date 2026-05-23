"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { type Profile, type ActionResponse } from "@/types";

export async function getDoctors(): Promise<ActionResponse<Profile[]>> {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "doctor")
      .eq("is_approved", true)
      .order("full_name", { ascending: true });

    if (error) throw error;

    return { success: true, data: data as Profile[] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch doctors",
    };
  }
}

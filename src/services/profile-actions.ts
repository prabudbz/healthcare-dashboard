"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { type Profile, type UserRole, type ActionResponse } from "@/types";

export async function getCurrentProfile(): Promise<ActionResponse<Profile>> {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw userError || new Error("Not authenticated");

    // Get the profile
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) throw error;

    return { success: true, data: data as Profile };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch profile",
    };
  }
}

export async function getAllProfiles(): Promise<ActionResponse<Profile[]>> {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { success: true, data: data as Profile[] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch profiles",
    };
  }
}

export async function updateProfileDetails(
  id: string,
  details: { full_name: string; phone?: string; address?: string; specialty?: string }
): Promise<ActionResponse<Profile>> {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name: details.full_name,
        phone: details.phone ?? null,
        address: details.address ?? null,
        specialty: details.specialty ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: data as Profile };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update profile",
    };
  }
}

// Keep backward compatibility alias
export async function updateProfileName(id: string, fullName: string) {
  return updateProfileDetails(id, { full_name: fullName });
}

export async function updateProfileRole(id: string, newRole: UserRole): Promise<ActionResponse<void>> {
  try {
    const supabase = await createServerSupabaseClient();

    // Call the security definer function since RLS prevents normal updates of roles
    const { error } = await supabase.rpc('admin_update_role', {
      target_user_id: id,
      new_role: newRole
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update role",
    };
  }
}

export async function approveUser(id: string): Promise<ActionResponse<void>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.rpc('admin_approve_user', { target_user_id: id });
    if (error) throw error;
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to approve user",
    };
  }
}

export async function rejectUser(id: string): Promise<ActionResponse<void>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.rpc('admin_reject_user', { target_user_id: id });
    if (error) throw error;
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reject user",
    };
  }
}

export async function suspendUser(id: string): Promise<ActionResponse<void>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.rpc('admin_suspend_user', { target_user_id: id });
    if (error) throw error;
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to suspend user",
    };
  }
}

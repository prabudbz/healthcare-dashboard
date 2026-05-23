import { z } from "zod";

// Indian mobile: optional +91/91/0 prefix, then 6-9 followed by 9 digits = 10 total
const indianPhoneRegex = /^(\+91|91|0)?[6-9]\d{9}$/;

export interface Patient {
  id: string;
  full_name: string;
  date_of_birth: string;
  gender: "male" | "female" | "other";
  email: string;
  phone: string;
  address: string;
  medical_record_number: string | null;
  insurance_provider: string | null;
  status: "active" | "inactive" | "critical";
  chief_complaint: string | null;
  assigned_doctor: string | null;
  admission_type?: string;
  recorded_by?: string;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export const PatientFormSchema = z.object({
  // --- Required fields ---
  full_name: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be less than 100 characters"),

  date_of_birth: z.string().min(1, "Date of birth is required"),

  gender: z.enum(["male", "female", "other"] as const),

  email: z
    .string()
    .min(1, "Email address is required")
    .email("Please enter a valid email address"),

  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(
      indianPhoneRegex,
      "Enter a valid Indian mobile number (e.g. 9876543210 or +919876543210)"
    ),

  address: z
    .string()
    .min(5, "Address must be at least 5 characters")
    .max(300, "Address must be less than 300 characters"),

  status: z
    .enum(["active", "inactive", "critical"] as const)
    .default("active"),

  // --- Optional fields ---
  medical_record_number: z.string().nullable().optional(),
  insurance_provider: z.string().nullable().optional(),
  chief_complaint: z.string().nullable().optional(),
  assigned_doctor: z.string().nullable().optional(),
  admission_type: z.string().nullable().optional(),
});

export type PatientFormData = z.infer<typeof PatientFormSchema>;

export interface PatientStats {
  total: number;
  active: number;
  critical: number;
  newThisMonth: number;
}

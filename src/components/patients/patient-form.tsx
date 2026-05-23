"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createPatient, updatePatient } from "@/services/patient-actions";
import { PatientFormSchema, type PatientFormData, type Patient } from "@/types/patient";
import { cn } from "@/utils/cn";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { getDoctors } from "@/services/doctor-actions";
import type { Profile } from "@/types";

const GENDER_OPTIONS = [
  { value: "", label: "Select gender…" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "critical", label: "Critical" },
];

const ADMISSION_OPTIONS = [
  { value: "", label: "Select admission type…" },
  { value: "Outpatient", label: "Outpatient" },
  { value: "Inpatient (Room)", label: "Inpatient (Room)" },
  { value: "ICU", label: "ICU" },
  { value: "Emergency", label: "Emergency" },
];

type FieldErrors = Partial<Record<keyof PatientFormData, string>>;

const emptyForm: PatientFormData = {
  full_name: "",
  date_of_birth: "",
  gender: "male",
  email: "",
  phone: "",
  address: "",
  medical_record_number: "",
  insurance_provider: "",
  status: "active",
  chief_complaint: "",
  assigned_doctor: "",
  admission_type: "",
};

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {title}
        </p>
        <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
      </div>
      {children}
    </div>
  );
}

interface PatientFormProps {
  patient?: Patient;
  onSuccess?: (patient: Patient) => void;
  onCancel?: () => void;
}

export function PatientForm({ patient, onSuccess, onCancel }: PatientFormProps) {
  const isEdit = !!patient;

  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [doctors, setDoctors] = useState<Profile[]>([]);

  useEffect(() => {
    getDoctors().then(res => {
      if (res.success && res.data) {
        setDoctors(res.data);
      }
    });
  }, []);

  const [form, setForm] = useState<PatientFormData>({
    full_name: patient?.full_name ?? "",
    date_of_birth: patient?.date_of_birth?.slice(0, 10) ?? "",
    gender: patient?.gender ?? "male",
    email: patient?.email ?? "",
    phone: patient?.phone ?? "",
    address: patient?.address ?? "",
    medical_record_number: patient?.medical_record_number ?? "",
    insurance_provider: patient?.insurance_provider ?? "",
    status: patient?.status ?? "active",
    chief_complaint: patient?.chief_complaint ?? "",
    assigned_doctor: patient?.assigned_doctor ?? "",
    admission_type: patient?.admission_type ?? "",
  });

  const setField = <K extends keyof PatientFormData>(
    key: K,
    value: PatientFormData[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setSuccessMessage(null);
    setFieldErrors({});

    // Normalise empty strings to null for optional fields
    const payload: PatientFormData = {
      ...form,
      medical_record_number: form.medical_record_number?.trim() || null,
      insurance_provider: form.insurance_provider?.trim() || null,
      chief_complaint: form.chief_complaint?.trim() || null,
      assigned_doctor: form.assigned_doctor?.trim() || null,
      admission_type: form.admission_type?.trim() || null,
    };

    const parsed = PatientFormSchema.safeParse(payload);
    if (!parsed.success) {
      const errs: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof PatientFormData;
        if (!errs[key]) errs[key] = issue.message;
      }
      setFieldErrors(errs);
      // Scroll to first error
      const firstErrKey = parsed.error.issues[0]?.path[0] as string;
      document.getElementById(`field-${firstErrKey}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }

    setLoading(true);
    try {
      const result = isEdit
        ? await updatePatient(patient!.id, parsed.data)
        : await createPatient(parsed.data);

      if (!result.success) {
        setServerError(result.error ?? "An unexpected error occurred.");
      } else {
        setSuccessMessage(
          isEdit ? "Patient updated successfully!" : "Patient registered successfully!"
        );
        onSuccess?.(result.data!);
        if (!isEdit) {
          setForm(emptyForm);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const fieldId = (name: keyof PatientFormData) => `field-${name}`;

  const textareaClass = (hasError: boolean) =>
    cn(
      "w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-800/50 border text-slate-900 dark:text-slate-100 text-sm",
      "placeholder:text-slate-400 dark:placeholder:text-slate-500",
      "transition-all duration-200 shadow-sm resize-none",
      "focus:outline-none focus:ring-2 focus:ring-offset-0",
      hasError
        ? "border-red-300 dark:border-red-500/50 focus:ring-red-500/30 focus:border-red-500"
        : "border-slate-200 dark:border-slate-700/50 focus:ring-teal-500/30 focus:border-teal-500"
    );

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Success banner */}
      {successMessage && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-lg bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20 text-teal-700 dark:text-teal-400 text-sm">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {successMessage}
        </div>
      )}

      {/* Server error banner */}
      {serverError && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {serverError}
        </div>
      )}

      {/* ── Personal Information ─────────────────── */}
      <Section title="Personal Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input
              id={fieldId("full_name")}
              label="Full Name *"
              placeholder="e.g. Priya Sharma"
              value={form.full_name}
              onChange={(e) => setField("full_name", e.target.value)}
              error={fieldErrors.full_name}
              required
            />
          </div>
          <Input
            id={fieldId("date_of_birth")}
            label="Date of Birth *"
            type="date"
            value={form.date_of_birth}
            onChange={(e) => setField("date_of_birth", e.target.value)}
            error={fieldErrors.date_of_birth}
            required
          />
          <Select
            id={fieldId("gender")}
            label="Gender *"
            options={GENDER_OPTIONS}
            value={form.gender}
            onChange={(e) =>
              setField("gender", e.target.value as PatientFormData["gender"])
            }
            error={fieldErrors.gender}
          />
        </div>
      </Section>

      {/* ── Contact Details ───────────────────────── */}
      <Section title="Contact Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id={fieldId("email")}
            label="Email Address *"
            type="email"
            placeholder="priya@example.com"
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            error={fieldErrors.email}
            required
          />
          <Input
            id={fieldId("phone")}
            label="Phone Number (Indian) *"
            type="tel"
            placeholder="9876543210 or +919876543210"
            value={form.phone}
            onChange={(e) => setField("phone", e.target.value)}
            error={fieldErrors.phone}
            helperText="10-digit Indian mobile starting with 6–9"
            required
          />
          <div className="sm:col-span-2">
            <Input
              id={fieldId("address")}
              label="Address *"
              placeholder="123, MG Road, Bangalore, Karnataka"
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
              error={fieldErrors.address}
              required
            />
          </div>
        </div>
      </Section>

      {/* ── Clinical Information ──────────────────── */}
      <Section title="Clinical Information">
        <div className="space-y-4">
          {/* Chief Complaint */}
          <div className="space-y-1.5">
            <label
              htmlFor={fieldId("chief_complaint")}
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Chief Complaint / Initial Diagnosis
            </label>
            <textarea
              id={fieldId("chief_complaint")}
              rows={3}
              placeholder="Describe the patient's primary complaint, symptoms or initial diagnosis…"
              value={form.chief_complaint ?? ""}
              onChange={(e) => setField("chief_complaint", e.target.value)}
              className={textareaClass(!!fieldErrors.chief_complaint)}
            />
            {fieldErrors.chief_complaint && (
              <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                <span className="inline-block w-1 h-1 rounded-full bg-current" />
                {fieldErrors.chief_complaint}
              </p>
            )}
          </div>

          {/* Assigned Doctor */}
          <div className="space-y-1.5">
            <label
              htmlFor={fieldId("assigned_doctor")}
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Assigned Doctor
            </label>
            <input
              id={fieldId("assigned_doctor")}
              type="text"
              list="doctor-suggestions"
              placeholder="Start typing doctor's name…"
              value={form.assigned_doctor ?? ""}
              onChange={(e) => setField("assigned_doctor", e.target.value)}
              className={cn(
                "w-full h-10 px-3.5 rounded-lg bg-white dark:bg-slate-800/50 border text-slate-900 dark:text-slate-100 text-sm",
                "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                "transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0",
                "border-slate-200 dark:border-slate-700/50 focus:ring-teal-500/30 focus:border-teal-500"
              )}
            />
            <datalist id="doctor-suggestions">
              {doctors.map((doc) => (
                <option key={doc.id} value={`Dr. ${doc.full_name}`} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              id={fieldId("status")}
              label="Status *"
              options={STATUS_OPTIONS}
              value={form.status}
              onChange={(e) =>
                setField("status", e.target.value as PatientFormData["status"])
              }
              error={fieldErrors.status}
            />
            <Select
              id={fieldId("admission_type")}
              label="Admission Type"
              options={ADMISSION_OPTIONS}
              value={form.admission_type ?? ""}
              onChange={(e) =>
                setField("admission_type", e.target.value || null)
              }
              error={fieldErrors.admission_type}
            />
          </div>
        </div>
      </Section>

      {/* ── Medical Record (optional) ─────────────── */}
      <Section title="Medical Record (Optional)">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id={fieldId("medical_record_number")}
            label="Medical Record Number"
            placeholder="Auto-generated if left blank"
            value={form.medical_record_number ?? ""}
            onChange={(e) =>
              setField("medical_record_number", e.target.value || null)
            }
            error={fieldErrors.medical_record_number}
            helperText="Leave blank to auto-generate"
          />
          <Input
            id={fieldId("insurance_provider")}
            label="Insurance Provider"
            placeholder="e.g. Star Health, HDFC Ergo"
            value={form.insurance_provider ?? ""}
            onChange={(e) =>
              setField("insurance_provider", e.target.value || null)
            }
            error={fieldErrors.insurance_provider}
          />
        </div>
      </Section>

      {/* ── Actions ───────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" loading={loading}>
          {isEdit ? "Save Changes" : "Register Patient"}
        </Button>
      </div>
    </form>
  );
}

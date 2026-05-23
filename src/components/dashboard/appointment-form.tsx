"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createAppointment } from "@/services/appointment-actions";
import { searchPatients } from "@/services/patient-actions";
import type { AppointmentFormData } from "@/types/appointment";
import type { Patient } from "@/types/patient";
import { Search, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/utils/cn";
import { getDoctors } from "@/services/doctor-actions";
import type { Profile } from "@/types";



interface AppointmentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AppointmentForm({ onSuccess, onCancel }: AppointmentFormProps) {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [patientSearch, setPatientSearch] = useState("");
  const [patientResults, setPatientResults] = useState<
    Pick<Patient, "id" | "full_name" | "medical_record_number">[]
  >([]);
  const [selectedPatient, setSelectedPatient] = useState<{
    id: string;
    full_name: string;
  } | null>(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  const [doctors, setDoctors] = useState<Profile[]>([]);

  useEffect(() => {
    getDoctors().then(res => {
      if (res.success && res.data) {
        setDoctors(res.data);
      }
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (patientSearch.length >= 2) {
        const result = await searchPatients(patientSearch);
        if (result.success && result.data) {
          setPatientResults(result.data);
          setShowPatientDropdown(true);
        }
      } else {
        setPatientResults([]);
        setShowPatientDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [patientSearch]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPatient) {
      setServerError("Please select a patient");
      return;
    }

    setLoading(true);
    setServerError(null);
    setSuccessMessage(null);

    const formData = new FormData(e.currentTarget);
    const data: AppointmentFormData = {
      patient_id: selectedPatient.id,
      provider_name: formData.get("provider_name") as string,
      appointment_date: formData.get("appointment_date") as string,
      start_time: formData.get("start_time") as string,
      end_time: formData.get("end_time") as string,
      type: formData.get("type") as AppointmentFormData["type"],
      status: "scheduled",
      notes: (formData.get("notes") as string) || null,
    };

    const result = await createAppointment(data);
    if (result.success) {
      setSuccessMessage("Appointment booked successfully!");
      if (onSuccess) onSuccess();
    } else {
      setServerError(result.error || "Failed to book appointment");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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

      {/* Patient Search */}
      <div className="relative">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Patient *
        </label>
        {selectedPatient ? (
          <div className="flex items-center gap-2 h-10 px-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-teal-500/30">
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100 flex-1">
              {selectedPatient.full_name}
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectedPatient(null);
                setPatientSearch("");
              }}
              className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300"
            >
              Change
            </button>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                placeholder="Search patient by name or MRN..."
                className="w-full h-10 pl-10 pr-4 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all shadow-sm"
                aria-label="Search for patient"
              />
            </div>
            {showPatientDropdown && patientResults.length > 0 && (
              <div className="absolute z-10 mt-1.5 w-full rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl max-h-48 overflow-y-auto">
                {patientResults.map((patient) => (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => {
                      setSelectedPatient({
                        id: patient.id,
                        full_name: patient.full_name,
                      });
                      setShowPatientDropdown(false);
                      setPatientSearch("");
                    }}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors first:rounded-t-lg last:rounded-b-lg border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                  >
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-200">
                      {patient.full_name}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {patient.medical_record_number}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Input
            id="provider_name"
            name="provider_name"
            label="Provider Name *"
            placeholder="Start typing doctor's name..."
            list="doctor-suggestions"
            required
          />
          <datalist id="doctor-suggestions">
            {doctors.map((doc) => (
              <option key={doc.id} value={`Dr. ${doc.full_name}`} />
            ))}
          </datalist>
        </div>
        
        <Select
          label="Appointment Type *"
          name="type"
          options={[
            { value: "checkup", label: "Checkup" },
            { value: "follow-up", label: "Follow-up" },
            { value: "emergency", label: "Emergency" },
            { value: "consultation", label: "Consultation" },
          ]}
          required
        />
        
        <Input
          label="Date *"
          name="appointment_date"
          type="date"
          required
        />
        
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Start Time *"
            name="start_time"
            type="time"
            required
          />
          <Input
            label="End Time *"
            name="end_time"
            type="time"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Notes
        </label>
        <textarea
          name="notes"
          rows={3}
          placeholder="Optional notes or reasons for visit..."
          className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all resize-none shadow-sm"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" loading={loading}>
          Book Appointment
        </Button>
      </div>
    </form>
  );
}

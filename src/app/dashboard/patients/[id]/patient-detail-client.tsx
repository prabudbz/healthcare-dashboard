"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PatientForm } from "@/components/patients/patient-form";
import { getPatientById, deletePatient } from "@/services/patient-actions";
import { type Patient } from "@/types/patient";
import { formatDate } from "@/utils/format";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Loader2,
  UserCircle2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShieldCheck,
  Hash,
  AlertTriangle,
  CheckCircle2,
  Stethoscope,
  ClipboardList,
} from "lucide-react";

interface DetailRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

function DetailRow({ icon, label, value }: DetailRowProps) {
  return (
    <div className="flex items-start gap-3 py-3.5 border-b border-slate-100 dark:border-slate-800/50 last:border-0">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
          {label}
        </p>
        <p className="text-sm text-slate-800 dark:text-slate-200 break-words">{value}</p>
      </div>
    </div>
  );
}

export function PatientDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const startInEdit = searchParams.get("edit") === "true";

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isEditing, setIsEditing] = useState(startInEdit);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const result = await getPatientById(id);
      if (result.success && result.data) {
        setPatient(result.data);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleEditSuccess = (updated: Patient) => {
    setPatient(updated);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await deletePatient(id);
    setDeleting(false);
    setShowDeleteModal(false);
    router.push("/dashboard/patients");
  };

  const genderLabel = (g: string) => g.charAt(0).toUpperCase() + g.slice(1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
      </div>
    );
  }

  if (notFound || !patient) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-slate-500 dark:text-slate-400">Patient not found.</p>
        <Button variant="secondary" onClick={() => router.push("/dashboard/patients")}>
          <ArrowLeft className="w-4 h-4" /> Back to Patients
        </Button>
      </div>
    );
  }

  const initials = patient.full_name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0 flex-shrink-0"
          onClick={() => router.push("/dashboard/patients")}
          aria-label="Back to patients"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Patient Details
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {patient.medical_record_number}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Profile card */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardBody className="p-5 flex flex-col items-center text-center gap-3">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-teal-500/20 mt-1">
                {initials}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {patient.full_name}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {patient.email}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={patient.status}>{patient.status}</Badge>
                {patient.admission_type && (
                  <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {patient.admission_type}
                  </span>
                )}
              </div>

              <div className="w-full pt-2 border-t border-slate-100 dark:border-slate-800/50 space-y-2.5 text-left">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Gender</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {genderLabel(patient.gender)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Registered</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {formatDate(patient.created_at)}
                  </span>
                </div>
                {patient.updated_at && patient.updated_at !== patient.created_at && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Last Updated</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {formatDate(patient.updated_at)}
                    </span>
                  </div>
                )}
                {patient.recorded_by && (
                  <div className="flex items-center justify-between text-sm pt-2 mt-2 border-t border-slate-100 dark:border-slate-800/50">
                    <span className="text-slate-500 dark:text-slate-400">Recorded By</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 text-right">
                      {patient.recorded_by}
                    </span>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <Button
              variant="primary"
              className="w-full"
              onClick={() => setIsEditing(true)}
              disabled={isEditing}
            >
              <Edit2 className="w-4 h-4" />
              Edit Patient
            </Button>
            <Button
              variant="secondary"
              className="w-full hover:border-red-300 hover:text-red-600 dark:hover:border-red-500/50 dark:hover:text-red-400 transition-colors"
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 className="w-4 h-4" />
              Delete Patient
            </Button>
          </div>
        </div>

        {/* Right: Details or Edit form */}
        <div className="lg:col-span-2 space-y-4">
          {isEditing ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Edit Patient Information
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  className="text-xs"
                >
                  Discard
                </Button>
              </CardHeader>
              <CardBody className="p-5">
                <PatientForm
                  patient={patient}
                  onSuccess={handleEditSuccess}
                  onCancel={() => setIsEditing(false)}
                />
              </CardBody>
            </Card>
          ) : (
            <>
              {/* Personal Info */}
              <Card>
                <CardHeader>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Personal Information
                  </h3>
                </CardHeader>
                <CardBody className="px-5 py-1">
                  <DetailRow
                    icon={<UserCircle2 className="w-4 h-4" />}
                    label="Full Name"
                    value={patient.full_name}
                  />
                  <DetailRow
                    icon={<Calendar className="w-4 h-4" />}
                    label="Date of Birth"
                    value={patient.date_of_birth ? formatDate(patient.date_of_birth) : "—"}
                  />
                  <DetailRow
                    icon={<UserCircle2 className="w-4 h-4" />}
                    label="Gender"
                    value={genderLabel(patient.gender)}
                  />
                </CardBody>
              </Card>

              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Contact Details
                  </h3>
                </CardHeader>
                <CardBody className="px-5 py-1">
                  <DetailRow
                    icon={<Mail className="w-4 h-4" />}
                    label="Email Address"
                    value={
                      <a
                        href={`mailto:${patient.email}`}
                        className="text-teal-600 dark:text-teal-400 hover:underline"
                      >
                        {patient.email}
                      </a>
                    }
                  />
                  <DetailRow
                    icon={<Phone className="w-4 h-4" />}
                    label="Phone Number"
                    value={patient.phone}
                  />
                  <DetailRow
                    icon={<MapPin className="w-4 h-4" />}
                    label="Address"
                    value={patient.address}
                  />
                </CardBody>
              </Card>

              {/* Medical Record */}
              <Card>
                <CardHeader>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Medical Record
                  </h3>
                </CardHeader>
                <CardBody className="px-5 py-1">
                  <DetailRow
                    icon={<Hash className="w-4 h-4" />}
                    label="Medical Record Number"
                    value={
                      <span className="font-mono">{patient.medical_record_number || "—"}</span>
                    }
                  />
                  <DetailRow
                    icon={<ShieldCheck className="w-4 h-4" />}
                    label="Insurance Provider"
                    value={patient.insurance_provider || "—"}
                  />
                  <DetailRow
                    icon={<CheckCircle2 className="w-4 h-4" />}
                    label="Status"
                    value={<Badge variant={patient.status}>{patient.status}</Badge>}
                  />
                  {patient.admission_type && (
                    <DetailRow
                      icon={<ShieldCheck className="w-4 h-4" />}
                      label="Admission Type"
                      value={patient.admission_type}
                    />
                  )}
                  {patient.assigned_doctor && (
                    <DetailRow
                      icon={<Stethoscope className="w-4 h-4" />}
                      label="Assigned Doctor"
                      value={patient.assigned_doctor}
                    />
                  )}
                  {patient.chief_complaint && (
                    <DetailRow
                      icon={<ClipboardList className="w-4 h-4" />}
                      label="Chief Complaint / Initial Diagnosis"
                      value={
                        <span className="whitespace-pre-wrap">{patient.chief_complaint}</span>
                      }
                    />
                  )}
                </CardBody>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Patient"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                This action cannot be undone
              </p>
              <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-0.5">
                Permanently delete{" "}
                <span className="font-semibold">{patient.full_name}</span> and all
                associated records?
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>
              Delete Patient
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { PatientForm } from "@/components/patients/patient-form";
import { getPatients, deletePatient } from "@/services/patient-actions";
import { type Patient } from "@/types/patient";
import { formatDate } from "@/utils/format";
import { useSupabaseRealtime } from "@/hooks/use-supabase-realtime";
import {
  UserPlus,
  Search,
  Eye,
  Edit2,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Users,
} from "lucide-react";

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "critical", label: "Critical" },
];

const PAGE_SIZE = 10;

export default function PatientsPage() {
  return (
    <Suspense fallback={<div className="p-6"><Loader2 className="w-6 h-6 animate-spin text-teal-500" /></div>}>
      <PatientsPageContent />
    </Suspense>
  );
}

function PatientsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<Patient["status"] | "">(
    (searchParams.get("status") as Patient["status"]) || ""
  );
  const filterParam = searchParams.get("filter") || undefined;

  // Sync state when URL params change from dashboard card clicks
  useEffect(() => {
    const status = searchParams.get("status") as Patient["status"] | null;
    if (status) setStatusFilter(status);
    else if (!searchParams.has("status") && !searchParams.has("filter")) {
      // Only reset if no filter is applied at all (basic navigation)
      // If ?filter=today is there, we don't reset status necessarily, but it's fine.
    }
  }, [searchParams]);

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    const result = await getPatients(
      currentPage,
      PAGE_SIZE,
      search || undefined,
      (statusFilter as Patient["status"]) || undefined,
      filterParam
    );
    if (result.success && result.data) {
      setPatients(result.data.data);
      setTotalCount(result.data.count);
      setTotalPages(result.data.totalPages);
    }
    setLoading(false);
  }, [currentPage, search, statusFilter, filterParam]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // Live updates
  useSupabaseRealtime<Patient>({
    table: "patients",
    onInsert: fetchPatients,
    onUpdate: fetchPatients,
    onDelete: fetchPatients,
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleStatusFilter = (val: string) => {
    setStatusFilter(val as Patient["status"] | "");
    setCurrentPage(1);
  };

  const handleRegisterSuccess = () => {
    setShowRegisterModal(false);
    fetchPatients();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await deletePatient(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    fetchPatients();
  };

  const handleViewPatient = (id: string) => {
    startTransition(() => router.push(`/dashboard/patients/${id}`));
  };

  const handleEditPatient = (id: string) => {
    startTransition(() => router.push(`/dashboard/patients/${id}?edit=true`));
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Patients</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {totalCount} patient{totalCount !== 1 ? "s" : ""} registered
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowRegisterModal(true)}
          className="self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          Register Patient
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="search"
            placeholder="Search by name, email or MRN…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 shadow-sm transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => handleStatusFilter(e.target.value)}
          className="h-10 px-3.5 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 shadow-sm transition-all sm:w-44"
        >
          {STATUS_FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table card */}
      <Card>
        <CardBody className="p-0 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
            </div>
          ) : patients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
              <Users className="w-10 h-10 opacity-30" />
              <p className="text-sm">No patients found.</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowRegisterModal(true)}
              >
                <UserPlus className="w-4 h-4" /> Register First Patient
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[640px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/60 dark:bg-slate-900/30">
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Patient
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Contact
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      DOB
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Status & Admission
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Registered
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {patients.map((patient) => (
                    <tr
                      key={patient.id}
                      className="group hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
                            {patient.full_name
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {patient.full_name}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {patient.medical_record_number}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm text-slate-700 dark:text-slate-300">{patient.email}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{patient.phone}</div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {patient.date_of_birth ? formatDate(patient.date_of_birth) : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col items-start gap-1.5">
                          <Badge variant={patient.status}>{patient.status}</Badge>
                          {patient.admission_type && (
                            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-sm">
                              {patient.admission_type}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
                        {formatDate(patient.created_at)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="View details"
                            onClick={() => handleViewPatient(patient.id)}
                            disabled={isPending}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Edit patient"
                            onClick={() => handleEditPatient(patient.id)}
                            disabled={isPending}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                            title="Delete patient"
                            onClick={() => setDeleteTarget(patient)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 dark:border-slate-800/50">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Page {currentPage} of {totalPages} &middot; {totalCount} total
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || loading}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Register Patient Modal */}
      <Modal
        open={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        title="Register New Patient"
        size="lg"
      >
        <PatientForm
          onSuccess={handleRegisterSuccess}
          onCancel={() => setShowRegisterModal(false)}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
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
                <span className="font-semibold">{deleteTarget?.full_name}</span> and all
                associated records?
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setDeleteTarget(null)}
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

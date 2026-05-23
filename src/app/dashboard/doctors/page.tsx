"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { getDoctors } from "@/services/doctor-actions";
import { useAuth } from "@/store/auth-context";
import { type Profile } from "@/types";
import { formatDate } from "@/utils/format";
import {
  Search,
  Loader2,
  Stethoscope,
  Mail,
  Phone,
  MapPin,
  Calendar,
  X,
} from "lucide-react";
import { cn } from "@/utils/cn";

function DoctorInitials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const colors = [
    "from-teal-400 to-teal-600",
    "from-indigo-400 to-indigo-600",
    "from-violet-400 to-violet-600",
    "from-sky-400 to-sky-600",
    "from-emerald-400 to-emerald-600",
    "from-amber-400 to-amber-600",
  ];
  const colorIdx = name.charCodeAt(0) % colors.length;

  return (
    <div
      className={cn(
        "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white text-lg font-bold shadow-md shrink-0",
        colors[colorIdx]
      )}
    >
      {initials}
    </div>
  );
}

function DoctorDetailModal({
  doctor,
  onClose,
}: {
  doctor: Profile;
  onClose: () => void;
}) {
  const initials = doctor.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Modal open={!!doctor} onClose={onClose} title="Doctor Profile" size="sm">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-teal-500/20 shrink-0">
            {initials}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Dr. {doctor.full_name}
            </h3>
            <div className="mt-1.5">
              <Badge variant="inactive" className="text-xs">
                {doctor.specialty ? doctor.specialty : "Doctor"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-3.5">
          <div className="flex items-start gap-3 text-sm">
            <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Email</p>
              <p className="font-medium text-slate-900 dark:text-slate-100">{doctor.email}</p>
            </div>
          </div>

          {doctor.phone ? (
            <div className="flex items-start gap-3 text-sm">
              <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Phone</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">{doctor.phone}</p>
              </div>
            </div>
          ) : null}

          {doctor.address ? (
            <div className="flex items-start gap-3 text-sm">
              <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Address</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">{doctor.address}</p>
              </div>
            </div>
          ) : null}

          <div className="flex items-start gap-3 text-sm">
            <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Member Since</p>
              <p className="font-medium text-slate-900 dark:text-slate-100">{formatDate(doctor.created_at)}</p>
            </div>
          </div>
        </div>

        <div className="pt-1">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function DoctorsPage() {
  return (
    <Suspense fallback={<div className="p-6 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-teal-500" /></div>}>
      <DoctorsPageContent />
    </Suspense>
  );
}

function DoctorsPageContent() {
  const { profile } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [doctors, setDoctors] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<Profile | null>(null);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    const res = await getDoctors();
    if (res.success && res.data) {
      setDoctors(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  // Handle auto-opening doctor modal if doctorId is present in URL
  useEffect(() => {
    const doctorId = searchParams.get("doctorId");
    if (doctorId && doctors.length > 0) {
      const doc = doctors.find(d => d.id === doctorId);
      if (doc) {
        setSelectedDoctor(doc);
      }
    }
  }, [searchParams, doctors]);

  // Clear query param when modal closes
  const handleCloseModal = () => {
    setSelectedDoctor(null);
    if (searchParams.has("doctorId")) {
      router.replace(pathname, { scroll: false });
    }
  };

  // Guard: only admin and staff can view
  if (profile && profile.role === "doctor") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 p-6">
        <Stethoscope className="w-12 h-12 opacity-20" />
        <p className="text-sm font-medium">Access Restricted</p>
        <p className="text-xs text-center">This page is only accessible to Admin and Staff members.</p>
      </div>
    );
  }

  const filtered = doctors.filter(
    (d) =>
      d.full_name.toLowerCase().includes(search.toLowerCase()) ||
      d.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Doctors</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {doctors.length} doctor{doctors.length !== 1 ? "s" : ""} on staff
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="search"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 shadow-sm transition-all"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
          <Stethoscope className="w-10 h-10 opacity-30" />
          <p className="text-sm">
            {search ? "No doctors match your search." : "No doctors registered yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doctor) => (
            <button
              key={doctor.id}
              onClick={() => setSelectedDoctor(doctor)}
              className="text-left group"
            >
              <Card className="h-full hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-lg hover:shadow-teal-500/5 transition-all duration-200 cursor-pointer">
                <CardBody className="p-5">
                  <div className="flex items-start gap-4">
                    <DoctorInitials name={doctor.full_name} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        Dr. {doctor.full_name}
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{doctor.email}</p>

                      <div className="mt-3 space-y-1.5">
                        {doctor.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <Phone className="w-3 h-3 shrink-0" />
                            <span className="truncate">{doctor.phone}</span>
                          </div>
                        )}
                        {doctor.address && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{doctor.address}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <Calendar className="w-3 h-3 shrink-0" />
                          <span>Since {formatDate(doctor.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <Badge variant="inactive" className="text-[10px]">
                      {doctor.specialty ? doctor.specialty : "Doctor"}
                    </Badge>
                    <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      View profile →
                    </span>
                  </div>
                </CardBody>
              </Card>
            </button>
          ))}
        </div>
      )}

      {/* Detail Modal */}
        {selectedDoctor && (
          <DoctorDetailModal
            doctor={selectedDoctor}
            onClose={handleCloseModal}
          />
        )}
    </div>
  );
}

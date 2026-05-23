"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSupabaseRealtime } from "@/hooks/use-supabase-realtime";
import { getPatients } from "@/services/patient-actions";
import { type Patient } from "@/types/patient";
import { formatDate } from "@/utils/format";
import { Eye, Edit2, Loader2, ArrowRight, UserPlus } from "lucide-react";
import Link from "next/link";

export function PatientTable() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPatients = async () => {
    const result = await getPatients(1, 5);
    if (result.success && result.data && result.data.data) {
      setPatients(result.data.data);
    } else {
      setPatients([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // Realtime subscription
  useSupabaseRealtime<Patient>({
    table: "patients",
    onInsert: () => fetchPatients(),
    onUpdate: () => fetchPatients(),
    onDelete: () => fetchPatients(),
  });

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between px-6 py-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Recent Patients
        </h3>
        <Link href="/dashboard/patients">
          <Button variant="ghost" size="sm">
            View All
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardBody className="flex-1 p-0 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-5 h-5 text-teal-500 animate-spin" />
          </div>
        ) : patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400">
            <p className="text-sm">No patients yet.</p>
            <Link href="/dashboard/patients">
              <Button variant="secondary" size="sm">
                <UserPlus className="w-4 h-4" /> Register Patient
              </Button>
            </Link>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/20 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Patient Name</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Added</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800/50">
                {patients.map((patient) => (
                  <tr
                    key={patient.id}
                    className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {patient.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {patient.full_name}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {patient.medical_record_number}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1.5">
                        <Badge variant={patient.status}>{patient.status}</Badge>
                        {patient.admission_type && (
                          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-sm">
                            {patient.admission_type}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {formatDate(patient.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="View Patient"
                          onClick={() => router.push(`/dashboard/patients/${patient.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="Edit Patient"
                          onClick={() => router.push(`/dashboard/patients/${patient.id}?edit=true`)}
                        >
                          <Edit2 className="w-4 h-4" />
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
    </Card>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/store/auth-context";
import { ShieldAlert, Download, FileText, Loader2, Users, Stethoscope } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getPatients, getPatientById } from "@/services/patient-actions";
import { getDoctors } from "@/services/doctor-actions";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDate } from "@/utils/format";
import { type Profile } from "@/types";
import { type Patient } from "@/types/patient";

export default function ReportsPage() {
  const { profile } = useAuth();
  
  // Patient report state
  const [downloadingPatients, setDownloadingPatients] = useState(false);
  const [patientReportType, setPatientReportType] = useState<"all" | "date" | "specific">("all");
  const [patientStartDate, setPatientStartDate] = useState("");
  const [patientEndDate, setPatientEndDate] = useState("");
  const [specificPatientId, setSpecificPatientId] = useState("");
  
  // Doctor report state
  const [downloadingDoctors, setDownloadingDoctors] = useState(false);
  const [doctorReportType, setDoctorReportType] = useState<"all" | "specialty" | "specific">("all");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [specificDoctorId, setSpecificDoctorId] = useState("");
  
  // Base Data (for dropdowns)
  const [allDoctors, setAllDoctors] = useState<Profile[]>([]);
  const [allPatientsList, setAllPatientsList] = useState<Patient[]>([]); // For specific patient dropdown
  
  useEffect(() => {
    // Fetch doctors and a lightweight patient list for dropdowns
    getDoctors().then(res => {
      if (res.success && res.data) setAllDoctors(res.data);
    });
    // For a real app, 'specific patient' might use an autocomplete search, but we'll fetch a list of 100 for now.
    getPatients(1, 100).then(res => {
      if (res.success && res.data) setAllPatientsList(res.data.data);
    });
  }, []);

  const specialties = Array.from(new Set(allDoctors.map(d => d.specialty).filter(Boolean))) as string[];

  // Guard: only admin can view
  if (profile && profile.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 p-6">
        <ShieldAlert className="w-12 h-12 opacity-20 text-rose-500" />
        <p className="text-sm font-medium">Access Restricted</p>
        <p className="text-xs text-center max-w-sm">
          This page is only accessible to Administrators. If you need a report, please contact your system admin.
        </p>
      </div>
    );
  }

  const handleDownloadPatients = async () => {
    try {
      setDownloadingPatients(true);
      
      let patientsToExport: Patient[] = [];
      const doc = new jsPDF();
      
      if (patientReportType === "specific" && specificPatientId) {
        const res = await getPatientById(specificPatientId);
        if (!res.success || !res.data) throw new Error("Patient not found");
        patientsToExport = [res.data];
      } else {
        const dateRange = patientReportType === "date" && patientStartDate && patientEndDate 
          ? { start: patientStartDate, end: patientEndDate } 
          : undefined;
          
        const res = await getPatients(1, 1000, undefined, undefined, undefined, dateRange); 
        if (!res.success || !res.data) throw new Error("Failed to fetch patients");
        patientsToExport = res.data.data;
      }
      
      if (patientsToExport.length === 0) {
        alert("No patients found for the selected criteria.");
        return;
      }
      
      doc.setFontSize(20);
      doc.text(patientReportType === "specific" ? "Patient Profile Report" : "Patient Directory Report", 14, 22);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
      
      if (patientReportType === "specific") {
        const p = patientsToExport[0];
        doc.setFontSize(12);
        doc.text(`Name: ${p.full_name}`, 14, 45);
        doc.text(`MRN: ${p.medical_record_number}`, 14, 52);
        doc.text(`Email: ${p.email}`, 14, 59);
        doc.text(`Phone: ${p.phone}`, 14, 66);
        doc.text(`DOB: ${formatDate(p.date_of_birth)}`, 14, 73);
        doc.text(`Gender: ${p.gender}`, 14, 80);
        doc.text(`Address: ${p.address || "N/A"}`, 14, 87);
        doc.text(`Status: ${p.status}`, 14, 94);
        doc.text(`Admission Type: ${p.admission_type || "N/A"}`, 14, 101);
        doc.text(`Assigned Doctor: ${p.assigned_doctor || "None"}`, 14, 108);
      } else {
        const tableData = patientsToExport.map((p) => [
          p.medical_record_number,
          p.full_name,
          p.email,
          p.status,
          p.admission_type || "N/A",
          formatDate(p.created_at)
        ]);

        autoTable(doc, {
          startY: 35,
          head: [['MRN', 'Name', 'Email', 'Status', 'Admission Type', 'Registration Date']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [20, 184, 166] }, // teal-500
          styles: { fontSize: 8 },
        });
      }

      doc.save("patient_report.pdf");
      
    } catch (err) {
      console.error(err);
      alert("Failed to generate patient report.");
    } finally {
      setDownloadingPatients(false);
    }
  };

  const handleDownloadDoctors = async () => {
    try {
      setDownloadingDoctors(true);
      
      let doctorsToExport = allDoctors;
      
      if (doctorReportType === "specialty" && selectedSpecialty) {
        doctorsToExport = allDoctors.filter(d => d.specialty === selectedSpecialty);
      } else if (doctorReportType === "specific" && specificDoctorId) {
        doctorsToExport = allDoctors.filter(d => d.id === specificDoctorId);
      }
      
      if (doctorsToExport.length === 0) {
        alert("No doctors found for the selected criteria.");
        return;
      }
      
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.text(doctorReportType === "specific" ? "Doctor Profile Report" : "Doctor Directory Report", 14, 22);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
      
      if (doctorReportType === "specific") {
        const d = doctorsToExport[0];
        doc.setFontSize(12);
        doc.text(`Name: Dr. ${d.full_name}`, 14, 45);
        doc.text(`Specialty: ${d.specialty || "General"}`, 14, 52);
        doc.text(`Email: ${d.email}`, 14, 59);
        doc.text(`Member Since: ${formatDate(d.created_at)}`, 14, 66);
      } else {
        const tableData = doctorsToExport.map((d) => [
          `Dr. ${d.full_name}`,
          d.email,
          d.specialty || "General",
          formatDate(d.created_at)
        ]);

        autoTable(doc, {
          startY: 35,
          head: [['Name', 'Email', 'Specialty', 'Member Since']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246] }, // blue-500
          styles: { fontSize: 8 },
        });
      }

      doc.save("doctor_report.pdf");
      
    } catch (err) {
      console.error(err);
      alert("Failed to generate doctor report.");
    } finally {
      setDownloadingDoctors(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto pb-24">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Reports Directory</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Generate and download highly customizable system reports.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Patients Report Card */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-teal-500/10 rounded-xl">
                <Users className="w-6 h-6 text-teal-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">Patient Details</h3>
                <p className="text-xs text-slate-500">Comprehensive patient registry</p>
              </div>
            </div>
          </CardHeader>
          <CardBody className="border-t border-slate-100 dark:border-slate-800 flex-1 flex flex-col space-y-4">
            <div className="flex-1 space-y-4">
              <Select 
                label="Report Type" 
                value={patientReportType} 
                onChange={(e) => setPatientReportType(e.target.value as any)}
                options={[
                  { value: "all", label: "All Patients" },
                  { value: "date", label: "By Registration Date Range" },
                  { value: "specific", label: "Specific Patient Profile" }
                ]}
              />
              
              {patientReportType === "date" && (
                <div className="grid grid-cols-2 gap-3">
                  <Input 
                    type="date" 
                    label="Start Date" 
                    value={patientStartDate}
                    onChange={(e) => setPatientStartDate(e.target.value)}
                  />
                  <Input 
                    type="date" 
                    label="End Date" 
                    value={patientEndDate}
                    onChange={(e) => setPatientEndDate(e.target.value)}
                  />
                </div>
              )}
              
              {patientReportType === "specific" && (
                <Select
                  label="Select Patient"
                  value={specificPatientId}
                  onChange={(e) => setSpecificPatientId(e.target.value)}
                  options={[
                    { value: "", label: "Choose a patient..." },
                    ...allPatientsList.map(p => ({
                      value: p.id,
                      label: `${p.full_name} (${p.medical_record_number})`
                    }))
                  ]}
                />
              )}
            </div>

            <Button 
              variant="primary" 
              className="w-full justify-center" 
              onClick={handleDownloadPatients}
              disabled={downloadingPatients || (patientReportType === 'date' && (!patientStartDate || !patientEndDate)) || (patientReportType === 'specific' && !specificPatientId)}
            >
              {downloadingPatients ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </CardBody>
        </Card>

        {/* Doctors Report Card */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 rounded-xl">
                <Stethoscope className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">Doctor Details</h3>
                <p className="text-xs text-slate-500">Staff directory and specialties</p>
              </div>
            </div>
          </CardHeader>
          <CardBody className="border-t border-slate-100 dark:border-slate-800 flex-1 flex flex-col space-y-4">
            <div className="flex-1 space-y-4">
              <Select 
                label="Report Type" 
                value={doctorReportType} 
                onChange={(e) => setDoctorReportType(e.target.value as any)}
                options={[
                  { value: "all", label: "All Doctors" },
                  { value: "specialty", label: "By Clinical Specialty" },
                  { value: "specific", label: "Specific Doctor Profile" }
                ]}
              />
              
              {doctorReportType === "specialty" && (
                <Select
                  label="Select Specialty"
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  options={[
                    { value: "", label: "Choose a specialty..." },
                    ...specialties.map(s => ({ value: s, label: s }))
                  ]}
                />
              )}
              
              {doctorReportType === "specific" && (
                <Select
                  label="Select Doctor"
                  value={specificDoctorId}
                  onChange={(e) => setSpecificDoctorId(e.target.value)}
                  options={[
                    { value: "", label: "Choose a doctor..." },
                    ...allDoctors.map(d => ({ value: d.id, label: `Dr. ${d.full_name}` }))
                  ]}
                />
              )}
            </div>

            <Button 
              variant="secondary" 
              className="w-full justify-center" 
              onClick={handleDownloadDoctors}
              disabled={downloadingDoctors || (doctorReportType === 'specialty' && !selectedSpecialty) || (doctorReportType === 'specific' && !specificDoctorId)}
            >
              {downloadingDoctors ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

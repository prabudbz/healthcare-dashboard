import { StatsCard } from "@/components/dashboard/stats-card";
import { PatientTable } from "@/components/dashboard/patient-table";
import { CalendarView } from "@/components/dashboard/calendar-view";
import { getDashboardStats } from "@/services/analytics-actions";
import { Users, Activity, CalendarDays, HeartPulse } from "lucide-react";

export default async function DashboardPage() {
  const statsResult = await getDashboardStats();
  const stats = statsResult.data || {
    totalPatients: 0,
    patientsToday: 0,
    activePatients: 0,
    criticalPatients: 0,
    todayAppointments: 0,
    completedToday: 0,
    upcomingAppointments: 0,
    newPatientsThisMonth: 0,
    cancelledThisWeek: 0,
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard
          title="Total Patients Today"
          value={stats.patientsToday}
          icon={<Users className="w-6 h-6 text-white" />}
          gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
          trend={{ value: 12, positive: true }}
          delay={100}
          href="/dashboard/patients?filter=today"
        />
        <StatsCard
          title="Today's Appointments"
          value={stats.todayAppointments}
          icon={<CalendarDays className="w-6 h-6 text-white" />}
          gradient="bg-gradient-to-br from-teal-500 to-cyan-500"
          trend={{ value: 5, positive: true }}
          delay={200}
          href="/dashboard/appointments?filter=today"
        />
        <StatsCard
          title="Active Patients"
          value={stats.activePatients}
          icon={<Activity className="w-6 h-6 text-white" />}
          gradient="bg-gradient-to-br from-emerald-500 to-green-600"
          delay={300}
          href="/dashboard/patients?status=active"
        />
        <StatsCard
          title="Critical Cases"
          value={stats.criticalPatients}
          icon={<HeartPulse className="w-6 h-6 text-white" />}
          gradient="bg-gradient-to-br from-rose-500 to-red-600"
          trend={{ value: 2, positive: false }}
          delay={400}
          href="/dashboard/patients?status=critical"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        <div className="xl:col-span-2 space-y-6">
          <PatientTable />
        </div>
        <div className="xl:col-span-1 space-y-6">
          <CalendarView />
        </div>
      </div>
    </div>
  );
}

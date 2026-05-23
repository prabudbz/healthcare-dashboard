export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DashboardStats {
  totalPatients: number;
  patientsToday: number;
  activePatients: number;
  criticalPatients: number;
  todayAppointments: number;
  completedToday: number;
  upcomingAppointments: number;
  newPatientsThisMonth: number;
  cancelledThisWeek: number;
}

export type UserRole = "admin" | "staff" | "doctor";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_approved: boolean;
  phone?: string;
  address?: string;
  specialty?: string;
  created_at: string;
  updated_at: string;
}

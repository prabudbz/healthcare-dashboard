# MedDash - Advanced Healthcare Dashboard

A production-ready, enterprise-grade healthcare management dashboard built with **Next.js App Router**, **TypeScript**, and **Supabase**. This application streamlines clinic operations by providing robust tools for patient management, appointment scheduling, real-time analytics, and role-based access control.

---

## 🚀 Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (with Dark Mode support)
- **Database & Backend:** Supabase (PostgreSQL, Auth, RLS)
- **Data Fetching & API:** Next.js Server Actions (Replaces traditional REST/GraphQL layers for enhanced security and type safety)
- **Real-time:** Supabase Realtime (WebSockets)
- **State Management:** React Context API & React Hooks
- **Form Validation:** Zod schema validation
- **PDF Generation:** jsPDF & jsPDF-AutoTable

---

## ✨ Implemented Core Features & Scenarios

### 🔐 Authentication & Role-Based Access Control (RBAC)
- **Login & Protected Routes:** Secure session handling using Supabase SSR authentication. Protected layouts ensure unauthenticated users are redirected.
- **Role-based Access:** Multi-tier roles (`admin`, `doctor`, `staff`).
- **Approval Workflow:** Newly registered users are placed in a "Pending" queue. Only administrators can approve, assign roles, or suspend/remove users.
- **Security:** Strict Postgres Row Level Security (RLS) ensures doctors only see patients assigned to them, while staff and admins have broader access.

### 📊 Dashboard Analytics
- Dynamic status cards tracking active/critical patients, daily appointments, and historical trends.
- **Real-time Synchronization:** Dashboard cards and tables update in real-time as changes are made elsewhere in the clinic via WebSockets.

### 🏥 Patient Registration & CRUD Operations
- Full Create, Read, Update, and Delete capabilities for patient profiles.
- Comprehensive form validation using `Zod` ensuring data integrity.
- Detailed patient view including admission status (ICU, Outpatient, etc.) and assigned providers.

### 📅 Appointment Management
- Book, edit, and cancel appointments with collision handling and status tracking.
- **Calendar View:** Visual scheduling interface allowing quick navigation between days.

### 🔍 Search & Filters
- Global search functionality across the dashboard.
- Dynamic URL-based filtering (e.g., `?filter=today`, `?status=active`) that persists state and updates live.

### 📄 Reports Export
- Generate structured, tabular PDF reports for Patient and Appointment data.
- **Advanced Filtering:** Export specific date ranges, specialties, or individual patient records (Admin exclusive feature).

### ⚙️ Settings Page
- Personal profile management and secure password updates.
- **Team Management:** Admin-exclusive panel to approve pending registrations, change roles, and suspend or permanently remove staff/doctors.

---

## 🌟 Bonus Features Implemented

- **WebSocket / Real-time Features:** Live updates for new appointments, patient registrations, and status changes without refreshing the page.
- **Notification System:** A real-time notification bell alerts doctors of new patient assignments and alerts admins of newly registered users awaiting approval.
- **Audit Logs:** System automatically tracks "Recorded By" metadata, logging the exact user name and role responsible for creating an appointment or patient record.
- **Dark Mode Support:** Fully accessible, seamless light/dark mode toggling using Tailwind CSS class strategy.

---

## 🛡️ Technical Evaluation Criteria

- **Clean Architecture & Folder Structure:** Production-ready scalable folder structure utilizing `/app`, `/components`, `/services`, `/hooks`, and `/types`.
- **Reusable Components:** Headless UI concepts applied to generic cards, badges, inputs, and modals.
- **Performance Optimization:** Use of React Server Components, Server Actions, `Suspense` boundaries, and debounced search inputs.
- **Type Safety:** 100% strict TypeScript configuration preventing runtime errors.
- **Accessibility:** Semantic HTML elements, ARIA labels, and accessible color contrast.
- **Error Handling:** Graceful error catching and display via Toast/Alert components, both on the client and server.

---

## 💻 Environment Setup Guide

Follow these steps to run the application locally.

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- A Supabase account

### 1. Clone & Install Dependencies
```bash
git clone <your-repository-url>
cd healthcare-dashboard
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Database Setup (Supabase)
Navigate to your Supabase project's **SQL Editor** and run the migration files located in the `/supabase/migrations/` directory in sequential order:
- `001_initial_schema.sql`
- `002_add_patient_fields.sql`
- `003_rbac_profiles.sql`
- `004_approval_workflow.sql`
- `005_appointments_schema.sql`
- `006_system_expansion.sql`
- `007_doctor_rls_fix.sql`
- `008_audit_and_notifications.sql`
- `009_admin_approval_notifications.sql`
- `010_admin_suspend.sql`

*(Alternatively, you can run `npm run db:push` if you have the Supabase CLI configured).*

### 4. Seed Initial Data
You can populate the database with mock doctors, staff, patients, and appointments to test the dashboard. 

With the development server running, navigate your browser to:
`http://localhost:3000/api/seed`

### 5. Create the Initial Admin Account
Once the database is set up and the migrations are run:
1. Start the application (`npm run dev`).
2. Go to the `/register` page in your browser.
3. Sign up with the exact email: **`admin@meddash.com`** and password: **`admin123`**.
4. The system will automatically recognize this email, auto-approve the account, and grant you full Administrator privileges.

### 6. Run the Application
Start the development server:
```bash
npm run dev
```
Navigate to `http://localhost:3000` to view the application.

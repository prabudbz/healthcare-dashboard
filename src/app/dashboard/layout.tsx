import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { SidebarProvider } from "@/store/sidebar-context";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

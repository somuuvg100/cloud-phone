"use client";

import * as React from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopNav } from "@/components/dashboard/top-nav";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const [userName, setUserName] = React.useState("Sarah Jenkins");
  const [userEmail, setUserEmail] = React.useState("sarah@company.com");

  React.useEffect(() => {
    async function loadUserData() {
      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user) {
            setUserEmail(user.email || "user@reachout.global");
            setUserName(user.user_metadata?.full_name || "ReachOut User");
          }
        } catch (err) {
          console.error("Failed to load user profile in layout:", err);
        }
      }
    }

    loadUserData();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar Navigation */}
      <DashboardSidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        userName={userName}
        userEmail={userEmail}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation */}
        <DashboardTopNav
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          userName={userName}
          userEmail={userEmail}
        />

        {/* Viewport Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}


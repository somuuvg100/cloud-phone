"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthCard } from "@/components/auth/auth-card";

export default function LogoutPage() {
  const router = useRouter();
  const [loggedOut, setLoggedOut] = React.useState(false);

  React.useEffect(() => {
    async function performSignOut() {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch (err) {
        console.error("Signout error:", err);
      } finally {
        setLoggedOut(true);
        setTimeout(() => {
          router.push("/login");
          router.refresh();
        }, 1200);
      }
    }

    performSignOut();
  }, [router]);

  return (
    <AuthCard
      title="Signing out"
      subtitle="Securing your session and logging out of ReachOut..."
    >
      <div className="py-8 flex flex-col items-center justify-center space-y-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground border border-border">
          {loggedOut ? (
            <CheckCircle2 className="w-7 h-7 text-emerald-500 animate-in zoom-in-50" />
          ) : (
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {loggedOut ? "Session ended successfully" : "Clearing secure credentials..."}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Redirecting to login...
          </p>
        </div>
      </div>
    </AuthCard>
  );
}


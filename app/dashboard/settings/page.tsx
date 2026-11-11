"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Building,
  Phone,
  ShieldCheck,
  Key,
  Save,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Trash2,
  Sliders,
  Bell,
  Layers,
  Zap,
  ShieldAlert,
  Ban,
  Plus,
  RefreshCw,
  FileText,
  Activity,
  Globe2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PasswordStrength } from "@/components/auth/password-strength";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  getProfile,
  updateProfile,
  getUserPreferences,
  updateMessagingPreferences,
} from "@/services/database";
import { SuppressionRecordRow, SecurityAuditLogRow, SuppressionReasonType } from "@/types/database";

export default function ProfileSettingsPage() {
  const router = useRouter();

  // User Profile State
  const [userId, setUserId] = React.useState("usr_reachout_demo_9921");
  const [fullName, setFullName] = React.useState("Sarah Jenkins");
  const [email, setEmail] = React.useState("sarah@company.com");
  const [newEmail, setNewEmail] = React.useState("");
  const [company, setCompany] = React.useState("Global Reach Solutions Ltd.");
  const [phone, setPhone] = React.useState("+1 (415) 890-2314");

  // Messaging Preferences State
  const [dailyLimit, setDailyLimit] = React.useState(1000);
  const [sentToday, setSentToday] = React.useState(780);
  const [notifyOnDeliveryFailure, setNotifyOnDeliveryFailure] = React.useState(true);

  // Password Change State
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmNewPassword, setConfirmNewPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  // Account Deletion State
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = React.useState("");
  const [isDeletingAccount, setIsDeletingAccount] = React.useState(false);

  // Feedback & Loading States
  const [loading, setLoading] = React.useState(true);
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = React.useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = React.useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = React.useState(false);

  // Suppression & Security State (Phase 10)
  const [suppressionItems, setSuppressionItems] = React.useState<SuppressionRecordRow[]>([]);
  const [loadingSuppression, setLoadingSuppression] = React.useState(false);
  const [newSuppressionPhone, setNewSuppressionPhone] = React.useState("");
  const [newSuppressionReason, setNewSuppressionReason] = React.useState<SuppressionReasonType>("user_opt_out");
  const [isAddingSuppression, setIsAddingSuppression] = React.useState(false);
  const [suppressionSuccess, setSuppressionSuccess] = React.useState<string | null>(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = React.useState<SecurityAuditLogRow[]>([]);
  const [loadingAudit, setLoadingAudit] = React.useState(false);

  const [profileSuccess, setProfileSuccess] = React.useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = React.useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = React.useState<string | null>(null);
  const [prefSuccess, setPrefSuccess] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Load Suppression List
  const loadSuppression = React.useCallback(async () => {
    setLoadingSuppression(true);
    try {
      const res = await fetch("/api/suppression");
      const data = await res.json();
      if (data.items) setSuppressionItems(data.items);
    } catch (err) {
      console.error("Failed to load suppression:", err);
    } finally {
      setLoadingSuppression(false);
    }
  }, []);

  // Load Audit Logs
  const loadAuditLogs = React.useCallback(async () => {
    setLoadingAudit(true);
    try {
      const res = await fetch("/api/security/audit");
      const data = await res.json();
      if (data.logs) setAuditLogs(data.logs);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoadingAudit(false);
    }
  }, []);

  // Handle Add to Suppression
  const handleAddSuppression = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSuppressionPhone.trim()) return;
    setIsAddingSuppression(true);
    setSuppressionSuccess(null);
    try {
      const res = await fetch("/api/suppression", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: newSuppressionPhone.trim(),
          reason: newSuppressionReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add suppression entry");
      setSuppressionSuccess(data.message || "Recipient added to suppression list");
      setNewSuppressionPhone("");
      loadSuppression();
      loadAuditLogs();
      setTimeout(() => setSuppressionSuccess(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to add suppression");
    } finally {
      setIsAddingSuppression(false);
    }
  };

  // Handle Remove from Suppression
  const handleRemoveSuppression = async (phone: string) => {
    try {
      const res = await fetch("/api/suppression", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (res.ok) {
        setSuppressionItems((prev) => prev.filter((i) => i.recipient_phone !== phone));
        loadAuditLogs();
      }
    } catch (err) {
      console.error("Failed to remove suppression:", err);
    }
  };

  // Load User Profile & Preferences
  React.useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        if (isSupabaseConfigured()) {
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user) {
            setUserId(user.id);
            setEmail(user.email || "");

            // Fetch profile
            const { data: profile } = await getProfile(user.id);
            if (profile) {
              setFullName(profile.full_name || "");
              setCompany(profile.company_name || "");
            } else if (user.user_metadata?.full_name) {
              setFullName(user.user_metadata.full_name);
            }

            // Fetch preferences
            const { data: prefs } = await getUserPreferences(user.id);
            if (prefs) {
              setDailyLimit(prefs.daily_limit);
              setSentToday(prefs.messages_sent_today);
            }
          }
        }
      } catch (err: any) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    loadSuppression();
    loadAuditLogs();
  }, [loadSuppression, loadAuditLogs]);

  // 1. Update Full Name & Profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccess(null);
    setErrorMessage(null);

    try {
      const { error: updateErr } = await updateProfile(userId, {
        full_name: fullName.trim(),
        company_name: company.trim(),
      });
      if (updateErr) throw new Error(updateErr);

      if (isSupabaseConfigured()) {
        const supabase = createClient();
        await supabase.auth.updateUser({
          data: { full_name: fullName.trim() },
        });
      }

      setProfileSuccess("Full name and profile updated successfully.");
      setTimeout(() => setProfileSuccess(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // 2. Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmNewPassword) {
      setErrorMessage("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordSuccess(null);
    setErrorMessage(null);

    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (error) throw error;
      }

      setPasswordSuccess("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setTimeout(() => setPasswordSuccess(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update password.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // 3. Update Email
  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes("@")) {
      setErrorMessage("Please enter a valid new email address.");
      return;
    }

    setIsUpdatingEmail(true);
    setEmailSuccess(null);
    setErrorMessage(null);

    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({
          email: newEmail.trim().toLowerCase(),
        });
        if (error) throw error;
      }

      setEmailSuccess(`Confirmation email dispatched to ${newEmail}. Please click the link to confirm.`);
      setNewEmail("");
      setTimeout(() => setEmailSuccess(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update email.");
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  // 4. Update Messaging Preferences
  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPreferences(true);
    setPrefSuccess(null);
    setErrorMessage(null);

    try {
      const { error } = await updateMessagingPreferences(userId, {
        daily_limit: dailyLimit,
      });
      if (error) throw new Error(error);

      setPrefSuccess("Messaging preferences saved.");
      setTimeout(() => setPrefSuccess(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save preferences.");
    } finally {
      setIsSavingPreferences(false);
    }
  };

  // 5. Account Deletion (Danger Zone)
  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== "DELETE MY ACCOUNT") return;

    setIsDeletingAccount(true);
    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        // Clear message history
        await supabase.from("messages").delete().eq("user_id", userId);
        await supabase.from("consent_records").delete().eq("user_id", userId);
        await supabase.from("messaging_preferences").delete().eq("user_id", userId);
        await supabase.from("profiles").delete().eq("id", userId);
        await supabase.auth.signOut();
      }
      router.push("/login?message=Account+successfully+deleted");
    } catch (err: any) {
      console.error("Account deletion error:", err);
      setErrorMessage(err.message || "Failed to delete account. Contact support.");
      setIsDeletingAccount(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
          Profile & Account Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage your personal identity, login security, messaging quotas, and account preferences.
        </p>
      </div>

      {/* Global Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center justify-between animate-in fade-in-50">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button type="button" onClick={() => setErrorMessage(null)} className="text-xs underline font-medium">
            Dismiss
          </button>
        </div>
      )}

      {/* Section 1: Update Full Name & Profile Details */}
      <form onSubmit={handleUpdateProfile} className="p-6 sm:p-7 rounded-3xl bg-card border border-border/80 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Personal Information</h2>
              <p className="text-[11px] text-muted-foreground">Stored in Supabase public.profiles</p>
            </div>
          </div>
          <Badge variant="pill" className="text-[10px]">Profile</Badge>
        </div>

        {profileSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{profileSuccess}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-foreground mb-1.5">
              Full Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1.5">
              Company / Organization
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button type="submit" variant="glow" size="sm" disabled={isSavingProfile} className="text-xs font-semibold gap-1.5 shadow-md">
            <Save className="w-3.5 h-3.5" />
            <span>{isSavingProfile ? "Saving..." : "Update Full Name"}</span>
          </Button>
        </div>
      </form>

      {/* Section 2: Update Email Address */}
      <form onSubmit={handleUpdateEmail} className="p-6 sm:p-7 rounded-3xl bg-card border border-border/80 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Email Address</h2>
              <p className="text-[11px] text-muted-foreground">Used for authentication and delivery alerts</p>
            </div>
          </div>
          <Badge variant="pill" className="text-[10px]">Auth</Badge>
        </div>

        {emailSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{emailSuccess}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-foreground mb-1.5">
              Current Email
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-3.5 py-2.5 rounded-xl bg-muted/60 border border-border text-muted-foreground cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1.5">
              New Email Address
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="new.email@company.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button type="submit" variant="glow" size="sm" disabled={!newEmail.trim() || isUpdatingEmail} className="text-xs font-semibold gap-1.5 shadow-md">
            <Mail className="w-3.5 h-3.5" />
            <span>{isUpdatingEmail ? "Sending Confirmation..." : "Update Email"}</span>
          </Button>
        </div>
      </form>

      {/* Section 3: Change Password */}
      <form onSubmit={handleChangePassword} className="p-6 sm:p-7 rounded-3xl bg-card border border-border/80 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Change Password</h2>
              <p className="text-[11px] text-muted-foreground">Secure your ReachOut account</p>
            </div>
          </div>
          <Badge variant="pill" className="text-[10px]">Security</Badge>
        </div>

        {passwordSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-foreground mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 pr-9 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <PasswordStrength password={newPassword} />
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1.5">
              Confirm New Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            type="submit"
            variant="glow"
            size="sm"
            disabled={!newPassword || newPassword !== confirmNewPassword || isUpdatingPassword}
            className="text-xs font-semibold gap-1.5 shadow-md"
          >
            <Key className="w-3.5 h-3.5" />
            <span>{isUpdatingPassword ? "Updating..." : "Change Password"}</span>
          </Button>
        </div>
      </form>

      {/* Section 4: Messaging Preferences */}
      <form onSubmit={handleSavePreferences} className="p-6 sm:p-7 rounded-3xl bg-card border border-border/80 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Messaging Preferences</h2>
              <p className="text-[11px] text-muted-foreground">Telecommunication limits and delivery alerts</p>
            </div>
          </div>
          <Badge variant="pill" className="text-[10px]">Quotas</Badge>
        </div>

        {prefSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{prefSuccess}</span>
          </div>
        )}

        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-foreground mb-1.5">
                Daily Message Allowance
              </label>
              <select
                value={dailyLimit}
                onChange={(e) => setDailyLimit(parseInt(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value={500}>500 messages / day (Starter)</option>
                <option value={1000}>1,000 messages / day (Pro Default)</option>
                <option value={2500}>2,500 messages / day (Scale)</option>
                <option value={10000}>10,000 messages / day (Enterprise)</option>
              </select>
              <span className="text-[11px] text-muted-foreground mt-1 block font-mono">
                Used today: {sentToday} / {dailyLimit}
              </span>
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1.5">
                Delivery Webhook Status Callback
              </label>
              <input
                type="text"
                disabled
                value="POST /api/webhooks/twilio"
                className="w-full px-3.5 py-2.5 rounded-xl bg-muted/60 border border-border text-muted-foreground font-mono text-[11px]"
              />
              <span className="text-[11px] text-muted-foreground mt-1 block">
                Active Tier-1 handshake callback endpoint
              </span>
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={notifyOnDeliveryFailure}
              onChange={(e) => setNotifyOnDeliveryFailure(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary/30 h-4 w-4"
            />
            <span className="text-xs text-foreground">
              Notify me via email if an international message fails carrier delivery
            </span>
          </label>
        </div>

        <div className="pt-2 flex justify-end">
          <Button type="submit" variant="glow" size="sm" disabled={isSavingPreferences} className="text-xs font-semibold gap-1.5 shadow-md">
            <Save className="w-3.5 h-3.5" />
            <span>{isSavingPreferences ? "Saving..." : "Save Preferences"}</span>
          </Button>
        </div>
      </form>

      {/* Section 5: Security Architecture & Abuse Prevention Overview */}
      <div className="p-6 sm:p-7 rounded-3xl bg-card border border-border/80 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Security & Abuse Prevention Architecture</h2>
              <p className="text-[11px] text-muted-foreground">Active enterprise safeguards and telecommunication defense systems</p>
            </div>
          </div>
          <Badge variant="pill" className="text-[10px]">Active Defense</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-500" />
                Row Level Security
              </span>
              <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full font-medium">
                Enforced
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Multi-tenant database isolation. Users can only access, mutate, or query their own records via Supabase PostgreSQL policies.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                Webhook Cryptography
              </span>
              <span className="text-[10px] font-mono text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded-full font-medium">
                HMAC SHA-1
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Inbound carrier status callbacks require cryptographic <code className="text-[10px] font-mono">X-Twilio-Signature</code> verification against secret auth tokens.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-indigo-500" />
                Rate Limiting
              </span>
              <span className="text-[10px] font-mono text-indigo-500 bg-indigo-500/10 px-1.5 py-0.5 rounded-full font-medium">
                20 req/min
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Sliding-window request throttling stops rapid bulk scraping, automated credential stuffing, and bot attacks.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                Anti-Harassment Cap
              </span>
              <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full font-medium">
                Max 3 / 10m
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Prevents telephone bombing: limits dispatches to the exact same recipient number to 3 SMS per 10-minute window.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Ban className="w-3.5 h-3.5 text-red-500" />
                Carrier STOP Opt-Out
              </span>
              <span className="text-[10px] font-mono text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-full font-medium">
                Auto-Suppression
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Inbound carrier keywords (STOP, CANCEL, QUIT, UNSUBSCRIBE) immediately register numbers onto the suppression list.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-cyan-500" />
                Zero Client Secrets
              </span>
              <span className="text-[10px] font-mono text-cyan-500 bg-cyan-500/10 px-1.5 py-0.5 rounded-full font-medium">
                Server-Only
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Twilio API credentials, service role keys, and internal HMAC salts are strictly restricted to isolated server-side runtimes.
            </p>
          </div>
        </div>
      </div>

      {/* Section 6: Suppression List & Opt-Out Management */}
      <div className="p-6 sm:p-7 rounded-3xl bg-card border border-border/80 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
              <Ban className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Suppression List & Recipient Opt-Outs</h2>
              <p className="text-[11px] text-muted-foreground">Blocked numbers that have opted out or submitted abuse complaints</p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadSuppression}
            disabled={loadingSuppression}
            className="text-xs gap-1.5 h-8 px-2.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingSuppression ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>

        {suppressionSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{suppressionSuccess}</span>
          </div>
        )}

        {/* Add new number to suppression list form */}
        <form onSubmit={handleAddSuppression} className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-3">
          <span className="text-xs font-semibold text-foreground block">
            Add Recipient Number to Suppression List
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
            <div className="sm:col-span-6">
              <input
                type="text"
                placeholder="+14155550199 or +919876543210"
                value={newSuppressionPhone}
                onChange={(e) => setNewSuppressionPhone(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-red-500/30"
              />
            </div>
            <div className="sm:col-span-4">
              <select
                value={newSuppressionReason}
                onChange={(e) => setNewSuppressionReason(e.target.value as SuppressionReasonType)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30"
              >
                <option value="user_opt_out">User Opt-Out</option>
                <option value="stop_keyword">Carrier STOP Request</option>
                <option value="spam_complaint">Spam / Abuse Complaint</option>
                <option value="carrier_block">Carrier Level Block</option>
                <option value="admin_block">Administrative Block</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <Button
                type="submit"
                disabled={isAddingSuppression || !newSuppressionPhone.trim()}
                className="w-full h-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </Button>
            </div>
          </div>
        </form>

        {/* Suppression Items Table */}
        <div className="overflow-x-auto rounded-2xl border border-border/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/70 text-muted-foreground uppercase text-[10px] tracking-wider font-semibold border-b border-border/60">
              <tr>
                <th className="py-2.5 px-3.5">Suppressed Number</th>
                <th className="py-2.5 px-3.5">Reason</th>
                <th className="py-2.5 px-3.5">Source</th>
                <th className="py-2.5 px-3.5">Date Added</th>
                <th className="py-2.5 px-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {suppressionItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted-foreground text-xs">
                    No recipients currently suppressed. All registered numbers remain eligible.
                  </td>
                </tr>
              ) : (
                suppressionItems.map((item) => {
                  const reasonLabel = {
                    stop_keyword: "Carrier STOP",
                    user_opt_out: "User Opt-Out",
                    spam_complaint: "Spam Complaint",
                    carrier_block: "Carrier Block",
                    admin_block: "Admin Block",
                  }[item.reason] || item.reason;

                  const badgeVariant =
                    item.reason === "spam_complaint" || item.reason === "admin_block"
                      ? "destructive"
                      : "secondary";

                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3.5 font-mono font-medium text-foreground">
                        {item.recipient_phone}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <Badge variant={badgeVariant as any} className="text-[10px] capitalize">
                          {reasonLabel}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3.5 text-muted-foreground text-[11px]">
                        {item.source || "inbound_sms"}
                      </td>
                      <td className="py-2.5 px-3.5 text-muted-foreground text-[11px]">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveSuppression(item.recipient_phone)}
                          className="text-[11px] text-destructive hover:underline font-medium"
                        >
                          Unsuppress
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 7: Security Audit Logging System */}
      <div className="p-6 sm:p-7 rounded-3xl bg-card border border-border/80 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Security Audit & Compliance Logs</h2>
              <p className="text-[11px] text-muted-foreground">Immutable forensic stream tracking dispatches, auth, and policy triggers</p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadAuditLogs}
            disabled={loadingAudit}
            className="text-xs gap-1.5 h-8 px-2.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingAudit ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/70 text-muted-foreground uppercase text-[10px] tracking-wider font-semibold border-b border-border/60">
              <tr>
                <th className="py-2.5 px-3.5">Severity</th>
                <th className="py-2.5 px-3.5">Event Type</th>
                <th className="py-2.5 px-3.5">IP Address</th>
                <th className="py-2.5 px-3.5">Details</th>
                <th className="py-2.5 px-3.5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted-foreground text-xs">
                    No security events recorded yet in this session.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => {
                  const severityBadge = {
                    info: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
                    warn: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                    error: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
                    critical: "bg-red-600 text-white font-bold",
                  }[log.severity] || "bg-muted text-muted-foreground";

                  let detailSummary = "";
                  if (typeof log.details === "object" && log.details !== null) {
                    const keys = Object.keys(log.details as Record<string, any>);
                    detailSummary = keys
                      .map((k) => `${k}: ${(log.details as any)[k]}`)
                      .slice(0, 2)
                      .join(" | ");
                  }

                  return (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3.5">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${severityBadge}`}>
                          {log.severity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 font-mono font-medium text-foreground text-[11px]">
                        {log.event_type}
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-muted-foreground text-[11px]">
                        {log.ip_address || "127.0.0.1"}
                      </td>
                      <td className="py-2.5 px-3.5 text-muted-foreground text-[11px] font-mono max-w-xs truncate">
                        {detailSummary || "—"}
                      </td>
                      <td className="py-2.5 px-3.5 text-right text-muted-foreground text-[11px]">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 5: Account Deletion (Danger Zone) */}
      <div className="p-6 sm:p-7 rounded-3xl bg-destructive/5 border border-destructive/20 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-destructive/15">
          <div className="flex items-center gap-2.5 text-destructive">
            <div className="p-2 rounded-xl bg-destructive/10">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Danger Zone</h2>
              <p className="text-[11px] text-muted-foreground">Permanent deletion of account and telecom data</p>
            </div>
          </div>
          <Badge variant="destructive" className="text-[10px]">Irreversible</Badge>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <p className="text-muted-foreground leading-relaxed max-w-lg">
            Deleting your account will permanently delete all user profile information, message history, recipient consent records, and carrier telemetry. This action cannot be undone.
          </p>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            className="text-xs font-semibold shrink-0"
          >
            Delete Account
          </Button>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-50">
          <div className="relative w-full max-w-md bg-card border border-destructive/30 rounded-3xl shadow-2xl p-6 sm:p-7 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-destructive">
              <div className="p-2.5 rounded-xl bg-destructive/10">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">
                Confirm Permanent Account Deletion
              </h3>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              This will permanently delete your account, API tokens, consent logs, and messages. To confirm, please type{" "}
              <span className="font-mono font-bold text-destructive">DELETE MY ACCOUNT</span> below:
            </p>

            <div>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="DELETE MY ACCOUNT"
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-destructive/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-destructive/30 font-mono"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                disabled={isDeletingAccount}
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmationText("");
                }}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={deleteConfirmationText !== "DELETE MY ACCOUNT" || isDeletingAccount}
                onClick={handleDeleteAccount}
                className="text-xs font-semibold"
              >
                {isDeletingAccount ? "Deleting..." : "Permanently Delete Account"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

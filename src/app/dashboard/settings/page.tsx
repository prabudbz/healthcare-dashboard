"use client";

import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "@/store/auth-context";
import { getAllProfiles, updateProfileDetails, updateProfileRole, approveUser, rejectUser, suspendUser } from "@/services/profile-actions";
import type { Profile, UserRole } from "@/types";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { User, Users, ShieldCheck, CheckCircle2, AlertCircle, Loader2, Lock } from "lucide-react";
import { cn } from "@/utils/cn";
import { createClient } from "@/lib/supabase";

export default function SettingsPage() {
  const { profile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "team" | "security">("profile");

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  const isAdmin = profile.role === "admin";

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Manage your personal preferences and team access
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("profile")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
            activeTab === "profile"
              ? "border-teal-500 text-teal-600 dark:text-teal-400"
              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          )}
        >
          <User className="w-4 h-4" />
          My Profile
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab("team")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
              activeTab === "team"
                ? "border-teal-500 text-teal-600 dark:text-teal-400"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            <Users className="w-4 h-4" />
            Team Management
          </button>
        )}
        <button
          onClick={() => setActiveTab("security")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
            activeTab === "security"
              ? "border-teal-500 text-teal-600 dark:text-teal-400"
              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          )}
        >
          <Lock className="w-4 h-4" />
          Security
        </button>
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === "profile" && <ProfileSettings profile={profile} onUpdate={refreshProfile} />}
        {activeTab === "team" && isAdmin && <TeamManagement currentUserId={profile.id} />}
        {activeTab === "security" && <ChangePassword />}
      </div>
    </div>
  );
}

function ProfileSettings({ profile, onUpdate }: { profile: Profile; onUpdate: () => Promise<void> }) {
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(profile.full_name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [address, setAddress] = useState(profile.address ?? "");
  const [specialty, setSpecialty] = useState(profile.specialty ?? "");
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await updateProfileDetails(profile.id, {
      full_name: fullName,
      phone: phone || undefined,
      address: address || undefined,
      specialty: specialty || undefined,
    });

    if (res.success) {
      setMessage({ type: "success", text: "Profile updated successfully." });
      await onUpdate();
    } else {
      setMessage({ type: "error", text: res.error || "Failed to update profile." });
    }
    setLoading(false);
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Personal Information</h2>
        <p className="text-xs text-slate-500 mt-0.5">Update your personal details and contact information.</p>
      </CardHeader>
      <CardBody className="p-6">
        {/* Avatar section */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-teal-500/20 shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{fullName}</p>
            <p className="text-xs text-slate-500 mt-0.5">{profile.email}</p>
            <div className="mt-1.5">
              <Badge
                variant={profile.role === "admin" ? "active" : profile.role === "doctor" ? "inactive" : "custom"}
                className={profile.role === "staff" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400" : ""}
              >
                {profile.role}
              </Badge>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {message && (
            <div className={cn(
              "flex items-center gap-2.5 p-3.5 rounded-lg border text-sm",
              message.type === "success"
                ? "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20"
                : "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
            )}>
              {message.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              {message.text}
            </div>
          )}

          {/* Read-only fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address</label>
              <input
                type="text"
                disabled
                value={profile.email}
                className="w-full h-10 px-3.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm cursor-not-allowed"
              />
              <p className="text-xs text-slate-400">Email cannot be changed.</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Account Role</label>
              <div className="flex items-center h-10 px-3.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <Badge
                  variant={profile.role === "admin" ? "active" : profile.role === "doctor" ? "inactive" : "custom"}
                  className={profile.role === "staff" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400" : ""}
                >
                  {profile.role}
                </Badge>
              </div>
              <p className="text-xs text-slate-400">Role is managed by your administrator.</p>
            </div>
          </div>

          {/* Divider */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Editable Information</p>

            <div className="space-y-4">
              <div>
                <Input
                  label="Full Name *"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
                {profile.role === "doctor" && (
                  <p className="text-xs text-slate-500 mt-1.5 flex items-start gap-1">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    Your full name must match the name used in patient and appointment records.
                  </p>
                )}
              </div>

              <Input
                label="Mobile Number"
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              {profile.role === "doctor" && (
                <Input
                  label="Medical Specialty"
                  placeholder="e.g. Cardiology, Pediatrics"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                />
              )}

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main Street, City, State, PIN"
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 dark:focus:border-teal-500 transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Button type="submit" loading={loading}>Save Changes</Button>
          </div>
        </form>
      </CardBody>
    </Card>

  );
}

function ChangePassword() {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (password !== confirm) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    if (password.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters long." });
      return;
    }

    setLoading(true);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Password updated successfully." });
      setPassword("");
      setConfirm("");
    }
    setLoading(false);
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Change Password</h2>
        <p className="text-xs text-slate-500 mt-0.5">Ensure your account is using a long, random password to stay secure.</p>
      </CardHeader>
      <CardBody className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {message && (
            <div className={cn(
              "flex items-center gap-2.5 p-3.5 rounded-lg border text-sm",
              message.type === "success"
                ? "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20"
                : "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
            )}>
              {message.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              {message.text}
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="New Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" loading={loading}>Update Password</Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

function TeamManagement({ currentUserId }: { currentUserId: string }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProfiles = async () => {
    setLoading(true);
    const res = await getAllProfiles();
    if (res.success && res.data) {
      setProfiles(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const res = await updateProfileRole(userId, newRole);
    if (res.success) {
      await loadProfiles();
    } else {
      alert(res.error || "Failed to update role");
    }
  };

  const handleApprove = async (userId: string) => {
    const res = await approveUser(userId);
    if (res.success) {
      await loadProfiles();
    } else {
      alert(res.error || "Failed to approve user");
    }
  };

  const handleReject = async (userId: string, isRemoval = false) => {
    if (!confirm(isRemoval ? "Are you sure you want to permanently remove this user from the active team?" : "Are you sure you want to reject and delete this user's profile?")) return;
    const res = await rejectUser(userId);
    if (res.success) {
      await loadProfiles();
    } else {
      alert(res.error || "Failed to remove user");
    }
  };

  const handleSuspend = async (userId: string) => {
    if (!confirm("Are you sure you want to temporarily suspend this user? They will be moved to pending approvals and cannot log in.")) return;
    const res = await suspendUser(userId);
    if (res.success) {
      await loadProfiles();
    } else {
      alert(res.error || "Failed to suspend user");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;
  }

  const pendingProfiles = profiles.filter(p => !p.is_approved);
  const activeProfiles = profiles.filter(p => p.is_approved);

  return (
    <div className="space-y-6">
      {/* Pending Approvals */}
      {pendingProfiles.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-900/50 shadow-sm shadow-amber-500/5">
          <CardHeader className="px-6 py-5 border-b border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-500/5 flex flex-row items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-amber-900 dark:text-amber-400 flex items-center gap-2">
                <AlertCircle className="w-4.5 h-4.5" />
                Pending Approvals
              </h2>
              <p className="text-xs text-amber-700/70 dark:text-amber-400/70 mt-1">Users waiting for admin approval.</p>
            </div>
            <Badge variant="custom" className="bg-amber-200 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 font-bold">
              {pendingProfiles.length}
            </Badge>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <tbody className="divide-y divide-amber-100/50 dark:divide-amber-900/30">
                {pendingProfiles.map(p => (
                  <tr key={p.id} className="hover:bg-amber-50/30 dark:hover:bg-amber-500/5 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{p.full_name}</p>
                      <p className="text-xs text-slate-500">{p.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-500 font-medium">Requested Role:</p>
                      <Badge variant="custom" className="mt-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {p.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button variant="secondary" size="sm" onClick={() => handleReject(p.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:hover:bg-red-500/10 dark:text-red-400 dark:border-red-500/30">
                        Reject
                      </Button>
                      <Button size="sm" onClick={() => handleApprove(p.id)} className="bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600">
                        Approve
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Active Team */}
      <Card>
        <CardHeader className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4.5 h-4.5 text-teal-500" />
              Active Team
            </h2>
            <p className="text-xs text-slate-500 mt-1">Manage roles and permissions for approved users.</p>
          </div>
          <Badge variant="custom" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            {activeProfiles.length} Users
          </Badge>
        </CardHeader>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {activeProfiles.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{p.full_name}</p>
                    <p className="text-xs text-slate-500">{p.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={p.role === "admin" ? "active" : p.role === "doctor" ? "inactive" : "custom"}
                      className={p.role === "staff" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400" : ""}
                    >
                      {p.role}
                    </Badge>
                  </td>
                    <td className="px-6 py-4 text-right">
                      {p.id === currentUserId ? (
                        <span className="text-xs text-slate-400 italic">Current User</span>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <div className="inline-block w-[140px]">
                            <Select
                              label=""
                              value={p.role}
                              onChange={(e) => handleRoleChange(p.id, e.target.value as UserRole)}
                              options={[
                                { value: "admin", label: "Make Admin" },
                                { value: "staff", label: "Make Staff" },
                                { value: "doctor", label: "Make Doctor" },
                              ]}
                            />
                          </div>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => handleSuspend(p.id)} 
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200"
                            title="Temporarily Block User"
                          >
                            Suspend
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => handleReject(p.id, true)} 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:hover:bg-red-500/10 dark:text-red-400 dark:border-red-500/30"
                            title="Permanently Remove User"
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

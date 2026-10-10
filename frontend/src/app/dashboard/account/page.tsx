"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  AtSign,
  Building2,
  Check,
  CheckCircle2,
  KeyRound,
  LogOut,
  Package,
  Save,
  Settings2,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { authApi, getErrorMessage, User } from "@/lib/api";
import { toast } from "sonner";

function ProfileEditor({ user, refreshUser }: { user: User; refreshUser: () => Promise<void> }) {
  const [name, setName] = useState(user.name);
  const [location, setLocation] = useState(user.participant?.location || "");
  const [contactPhone, setContactPhone] = useState(user.participant?.contactPhone || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const isDirty = name !== user.name || location !== (user.participant?.location || "") || contactPhone !== (user.participant?.contactPhone || "");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      const response = await authApi.updateProfile({
        name: name.trim(),
        ...(user.participant ? { location: location.trim(), contactPhone: contactPhone.trim() } : {}),
      });
      if (!response.data.success) throw new Error(response.data.error?.message || "Profile update failed.");
      setName(response.data.data.user.name);
      setLocation(response.data.data.user.participant?.location || "");
      setContactPhone(response.data.data.user.participant?.contactPhone || "");
      await refreshUser();
      setSaved(true);
      toast.success("Profile updated.");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Could not save your profile. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.section
      id="personal-information"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.12 }}
      className="card p-5 sm:p-7"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Profile details</p>
          <h2 className="mt-1 font-display text-xl font-bold">Personal information</h2>
        </div>
        <span className="rounded-full border border-[var(--bg-border)] px-3 py-1 text-xs text-[var(--text-tertiary)]">
          {user.role === "admin" ? "Administrator" : user.participant?.role || "Partner"}
        </span>
      </div>

      {error && (
        <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}
      {saved && (
        <div role="status" className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          <CheckCircle2 size={16} /> Your profile changes were saved.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="profile-name">{user.participant ? "Account contact name" : "Full name"}</label>
            <input
              id="profile-name"
              className="input"
              value={name}
              onChange={(event) => { setName(event.target.value); setSaved(false); }}
              minLength={2}
              maxLength={100}
              autoComplete="name"
              required
            />
          </div>
          <div>
            <label htmlFor="profile-email">Email address</label>
            <input id="profile-email" type="email" className="input cursor-not-allowed bg-[var(--bg-lifted)]" value={user.email} readOnly aria-readonly="true" />
            <p className="mt-1 text-[10px] text-[var(--text-tertiary)]">Email changes are not available here.</p>
          </div>
          {user.participant && (
            <>
              <div>
                <label htmlFor="profile-location">Organization location</label>
                <input
                  id="profile-location"
                  className="input"
                  value={location}
                  onChange={(event) => { setLocation(event.target.value); setSaved(false); }}
                  maxLength={200}
                  autoComplete="address-level2"
                  placeholder="City or region"
                />
              </div>
              <div>
                <label htmlFor="profile-phone">Contact phone</label>
                <input
                  id="profile-phone"
                  type="tel"
                  className="input"
                  value={contactPhone}
                  onChange={(event) => { setContactPhone(event.target.value); setSaved(false); }}
                  maxLength={30}
                  autoComplete="tel"
                  placeholder="Phone number"
                />
              </div>
            </>
          )}
        </div>
        {user.participant && (
          <div className="rounded-xl border border-[var(--bg-border)] bg-white/70 px-4 py-3 text-xs leading-5 text-[var(--text-secondary)]">
            Organization: <span className="font-semibold text-[var(--text-primary)]">{user.participant.name}</span>. Role and wallet are assigned by an administrator and cannot be edited here.
          </div>
        )}
        <div className="flex justify-end border-t border-[var(--bg-border)] pt-4">
          <button type="submit" disabled={saving || !isDirty || name.trim().length < 2} className="btn btn-primary gap-2 disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" /> Saving…</> : <><Save size={15} /> Save changes</>}
          </button>
        </div>
      </form>
    </motion.section>
  );
}

export default function AccountPage() {
  const { user, loading, logout, refreshUser } = useAuth();
  const participant = user?.participant;
  const displayName = user?.name || participant?.name || "Account";
  const isAdministrator = user?.role === "admin";
  const accountRole = isAdministrator ? "Administrator" : "Partner";
  const accountNavigation = [
    { label: "Overview", href: "#overview", icon: UserRound },
    { label: isAdministrator ? "Administrator profile" : "Partner profile", href: "#personal-information", icon: AtSign },
    ...(isAdministrator ? [{ label: "Partner management", href: "/dashboard/participants", icon: Building2 }] : []),
    { label: "Preferences & security", href: "/dashboard/settings", icon: Settings2 },
  ];
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  if (loading) {
    return <div className="mx-auto max-w-screen-xl"><div className="skeleton h-48 rounded-3xl" /></div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <ShieldCheck size={38} className="mx-auto mb-4 text-[var(--text-tertiary)]" />
        <h1 className="font-display text-2xl font-bold">Sign in to view your account</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Your account profile is only available after authentication.</p>
        <Link href="/login" className="btn btn-primary mt-6">Go to partner login</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-xl space-y-7 pb-10">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">{isAdministrator ? "Administrator workspace" : "Partner workspace"}</p>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{accountRole} account</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{isAdministrator ? "Your profile and administration shortcuts." : "Your organization profile and supply-chain workspace."}</p>
        </div>
        <Link href="/dashboard/settings" className="btn btn-secondary gap-2">
          <Settings2 size={16} /> Account settings
        </Link>
      </motion.header>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="card p-3 lg:sticky lg:top-24">
          <p className="px-3 pb-3 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Account menu</p>
          <nav aria-label="Account sections" className="space-y-1">
            {accountNavigation.map(({ label, href, icon: Icon }, index) => (
              <a
                key={label}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${index === 0 ? "bg-[var(--bg-lifted)] text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"}`}
              >
                <Icon size={16} /> {label}
              </a>
            ))}
          </nav>
          <div className="my-4 border-t border-[var(--bg-border)]" />
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-rose-50 hover:text-rose-700">
            <LogOut size={16} /> Sign out
          </button>
        </aside>

        <main className="min-w-0 space-y-6">
          <motion.section
            id="overview"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="overflow-hidden rounded-3xl border border-[var(--bg-border)] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.055)]"
          >
            <div className="h-24 bg-[linear-gradient(110deg,#f4f4f2_0%,#ffffff_52%,#eeefec_100%)] sm:h-32" />
            <div className="px-5 pb-6 sm:px-8">
              <div className="-mt-10 flex flex-wrap items-end justify-between gap-4 sm:-mt-12">
                <div className="flex items-end gap-4">
                  <div aria-label={`${displayName} profile placeholder`} className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-[#242329] font-display text-2xl font-bold text-white shadow-md sm:h-24 sm:w-24">
                    {initials || <UserRound size={28} />}
                  </div>
                  <div className="pb-1">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--bg-border)] bg-white px-2.5 py-1 text-[11px] font-semibold text-[var(--text-secondary)]">
                      <Check size={12} /> {isAdministrator ? accountRole : `${accountRole} · ${participant?.role || "Organization"}`}
                    </span>
                    <h2 className="mt-2 font-display text-xl font-bold tracking-tight sm:text-2xl">{displayName}</h2>
                  </div>
                </div>
                <span className="mb-1 inline-flex items-center gap-2 text-xs font-medium text-emerald-700">
                  <span className={`h-2 w-2 rounded-full ${participant && !participant.active ? "bg-amber-500" : "bg-emerald-500"}`} />
                  {participant ? (participant.active ? "Organization active" : "Organization inactive") : "Signed in"}
                </span>
              </div>
              <p className="mt-5 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                {isAdministrator
                  ? "Administrator access for managing partner accounts and the PharmaChain workspace. Your role is assigned by the system and cannot be changed here."
                  : "Partner access for medicine traceability and supply-chain operations. Your organization role is assigned by an administrator and cannot be changed here."}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {isAdministrator ? (
                  <Link href="/dashboard/participants" className="btn btn-primary gap-2">Manage partners <ArrowRight size={15} /></Link>
                ) : (
                  <>
                    <Link href="/dashboard/batches" className="btn btn-primary gap-2"><Package size={15} /> View records</Link>
                    <Link href="/dashboard/transfers" className="btn btn-secondary gap-2">Transfers <ArrowRight size={15} /></Link>
                  </>
                )}
              </div>
            </div>
          </motion.section>

          {isAdministrator ? (
            <motion.section
              id="partner-management"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="card p-5 sm:p-7"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Administrator tools</p>
                  <h2 className="mt-1 font-display text-xl font-bold">Manage partner access</h2>
                  <p className="mt-1 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">Review partner organizations, account status, and provisioning from the administrator-only area.</p>
                </div>
                <Link href="/dashboard/participants" className="btn btn-primary shrink-0 gap-2">Open partner management <ArrowRight size={15} /></Link>
              </div>
            </motion.section>
          ) : (
            <motion.section
              id="partner-workspace"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="card p-5 sm:p-7"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Partner workspace</p>
              <h2 className="mt-1 font-display text-xl font-bold">Your supply-chain activity</h2>
              <p className="mt-1 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">Open your authorized batch records and transfer requests. Partner data access is scoped to your organization by the API.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/dashboard/batches" className="btn btn-secondary gap-2"><Package size={15} /> My batches <ArrowRight size={14} /></Link>
                <Link href="/dashboard/transfers" className="btn btn-secondary gap-2">My transfers <ArrowRight size={14} /></Link>
              </div>
            </motion.section>
          )}

          <ProfileEditor user={user} refreshUser={refreshUser} />

          <motion.section
            id="preferences-security"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-lifted)] text-[var(--text-secondary)]"><KeyRound size={18} /></span>
              <div>
                <h2 className="font-display font-semibold">Preferences & security</h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">Manage appearance and account security settings.</p>
              </div>
            </div>
            <Link href="/dashboard/settings" className="btn btn-secondary shrink-0">Open settings <ArrowRight size={15} /></Link>
          </motion.section>

          <div className="flex justify-end md:hidden">
            <button onClick={logout} className="btn btn-ghost gap-2 text-rose-700"><LogOut size={16} /> Sign out</button>
          </div>
        </main>
      </div>
    </div>
  );
}

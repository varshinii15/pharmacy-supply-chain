"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
  UserPlus,
  UserRound,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { adminApi, authApi, CreateParticipantPayload, getErrorMessage, participantApi } from "@/lib/api";
import { toast } from "sonner";
import { Navbar } from "@/components/layout/Navbar";

type AccountKind = "participant" | "admin";
type ParticipantRole = "Manufacturer" | "Distributor" | "Wholesaler" | "Pharmacy";

const participantRoles: ParticipantRole[] = ["Manufacturer", "Distributor", "Wholesaler", "Pharmacy"];

export default function CreateAccountPage() {
  const { user, register: authRegister } = useAuth();
  const router = useRouter();
  const [kind, setKind] = useState<AccountKind>("participant");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [role, setRole] = useState<ParticipantRole>("Manufacturer");
  const [location, setLocation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdUser, setCreatedUser] = useState<{ email: string; name: string; role: string } | null>(null);

  const isAdmin = user?.role === "admin";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please provide both an email address and password.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);

    try {
      // If signed in as admin and explicitly provisioning on-chain with a valid wallet
      if (isAdmin && kind === "participant" && walletAddress.trim().startsWith("0x")) {
        const payload: CreateParticipantPayload = {
          name: name.trim() || email.split("@")[0],
          email: email.trim(),
          password,
          walletAddress: walletAddress.trim(),
          role,
          location: location.trim() || undefined,
        };
        await participantApi.add(payload);
        toast.success("Participant registered on-chain and loaded to database!");
      } else if (isAdmin && kind === "admin") {
        await adminApi.createAdmin({
          name: name.trim() || email.split("@")[0],
          email: email.trim(),
          password,
        });
        toast.success("Administrator account created in database!");
      } else {
        // Standard / Public account creation loaded directly into MongoDB database
        await authApi.register({
          name: name.trim() || email.split("@")[0],
          email: email.trim(),
          password,
          role: kind,
          participantRole: role,
          walletAddress: walletAddress.trim() || undefined,
          location: location.trim() || undefined,
        });
        toast.success("Account created and loaded to database successfully!");
      }

      setCreatedUser({
        email: email.trim(),
        name: name.trim() || email.split("@")[0],
        role: kind === "admin" ? "Administrator" : `Participant (${role})`,
      });
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Could not create account. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="site-grid-surface login-grid-surface min-h-screen flex flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 pb-12 pt-24">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="w-full max-w-xl"
        >
          <Link
            href={isAdmin ? "/dashboard/participants" : "/login"}
            className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            <ArrowLeft size={15} /> {isAdmin ? "Back to participants" : "Back to sign in"}
          </Link>

          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#18161d] text-white shadow-lg">
              <UserPlus size={26} />
            </div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              Account Registration
            </p>
            <h1 className="font-display text-3xl font-bold tracking-tight">Create an account</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-secondary)]">
              Enter your email and password to create an account and save it to the database.
            </p>
          </div>

          {createdUser ? (
            <div className="card p-8 text-center sm:p-10">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40">
                <CheckCircle2 size={36} />
              </div>
              <h2 className="font-display text-2xl font-semibold">Account created!</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Your account details have been successfully loaded and saved to the database.
              </p>

              <div className="mt-6 rounded-xl border border-[var(--bg-border)] bg-[var(--bg-lifted)] p-4 text-left text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">Email:</span>
                  <span className="font-semibold text-[var(--text-primary)]">{createdUser.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">Name:</span>
                  <span className="font-medium text-[var(--text-primary)]">{createdUser.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">Account Type:</span>
                  <span className="font-medium text-[var(--text-primary)]">{createdUser.role}</span>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setCreatedUser(null);
                    setName("");
                    setEmail("");
                    setPassword("");
                    setWalletAddress("");
                    setLocation("");
                  }}
                >
                  Create another
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => router.push("/login")}
                >
                  Sign in now
                </button>
              </div>
            </div>
          ) : (
            <div className="card overflow-hidden p-6 sm:p-8">
              {/* Account kind switch */}
              <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-[var(--bg-lifted)] p-1.5" role="tablist" aria-label="Account type">
                <button
                  type="button"
                  role="tab"
                  aria-selected={kind === "participant"}
                  onClick={() => { setKind("participant"); setError(""); }}
                  className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition-all ${
                    kind === "participant" ? "bg-white text-[#18161d] shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <Building2 size={16} /> Participant
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={kind === "admin"}
                  onClick={() => { setKind("admin"); setError(""); }}
                  className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition-all ${
                    kind === "admin" ? "bg-white text-[#18161d] shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <ShieldCheck size={16} /> Administrator
                </button>
              </div>

              {error && (
                <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-400">
                  <AlertCircle size={17} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Address */}
                <div>
                  <label htmlFor="account-email" className="block text-sm font-medium mb-1.5">
                    Email address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                    <input
                      id="account-email"
                      type="email"
                      className="input pl-9"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@company.com"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="account-password" className="block text-sm font-medium mb-1.5">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                    <input
                      id="account-password"
                      type={showPassword ? "text" : "password"}
                      className="input pl-9 pr-11"
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={100}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="At least 8 characters (letters & numbers)"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                    Must be at least 8 characters and contain letters and numbers.
                  </p>
                </div>

                {/* Name */}
                <div>
                  <label htmlFor="account-name" className="block text-sm font-medium mb-1.5">
                    {kind === "participant" ? "Organization / Partner name" : "Administrator name"}
                  </label>
                  <div className="relative">
                    <UserRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                    <input
                      id="account-name"
                      className="input pl-9"
                      autoComplete="name"
                      maxLength={100}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder={kind === "participant" ? "e.g. Apex Pharma Logistics (optional)" : "e.g. John Doe (optional)"}
                    />
                  </div>
                </div>

                {/* Participant extra fields */}
                {kind === "participant" && (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="participant-role" className="block text-sm font-medium mb-1.5">
                          Supply-chain role
                        </label>
                        <select
                          id="participant-role"
                          className="input"
                          value={role}
                          onChange={(event) => setRole(event.target.value as ParticipantRole)}
                        >
                          {participantRoles.map((participantRole) => (
                            <option key={participantRole} value={participantRole}>
                              {participantRole}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="participant-location" className="block text-sm font-medium mb-1.5">
                          Location / City (optional)
                        </label>
                        <input
                          id="participant-location"
                          className="input"
                          autoComplete="address-level2"
                          maxLength={200}
                          value={location}
                          onChange={(event) => setLocation(event.target.value)}
                          placeholder="e.g. Chennai"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="participant-wallet" className="block text-sm font-medium mb-1.5">
                        Ethereum wallet address (optional)
                      </label>
                      <div className="relative">
                        <Wallet size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                        <input
                          id="participant-wallet"
                          className="input pl-9 font-mono text-sm"
                          autoComplete="off"
                          spellCheck={false}
                          value={walletAddress}
                          onChange={(event) => setWalletAddress(event.target.value)}
                          placeholder="0x… (optional, can be linked later)"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="pt-2">
                  <button
                    id="create-account-submit"
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary w-full py-3 text-base"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Saving to database…
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-6 border-t border-[var(--bg-border)] pt-4 text-center">
                <p className="text-sm text-[var(--text-tertiary)]">
                  Already have an account?{" "}
                  <Link href="/login" className="font-medium text-[var(--brand-to)] hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          )}
        </motion.section>
      </main>
    </div>
  );
}

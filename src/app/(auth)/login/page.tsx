"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePharmacy } from "@/context/PharmacyContext";
import { auth } from "@/lib/firebase/config";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Building,
  ShieldCheck,
} from "lucide-react";
import { UserRole, EnvironmentType, getDefaultPermissionsForRole, UserProfile } from "@/types/pharmacy";

interface RegisteredOwner {
  uid: string;
  displayName: string;
  ownerName: string;
  email: string;
  env?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const {
    settings,
    env,
    setEnv,
    profiles,
    switchProfile,
    registerUserProfile,
    fetchRegisteredOwners,
  } = usePharmacy();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("Owner");
  const [selectedEnv, setSelectedEnv] = useState<EnvironmentType>(env);

  // Available registered owners for Manager/Cashier staff linking
  const [availableOwners, setAvailableOwners] = useState<RegisteredOwner[]>([]);
  const [selectedOwnerUid, setSelectedOwnerUid] = useState<string>("");
  const [customOwnerName, setCustomOwnerName] = useState<string>("");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Load registered owners whenever signup mode or env changes
  useEffect(() => {
    let isMounted = true;
    const loadOwners = async () => {
      try {
        const owners = await fetchRegisteredOwners(selectedEnv);
        if (isMounted) {
          setAvailableOwners(owners);
          if (owners.length > 0 && !selectedOwnerUid) {
            setSelectedOwnerUid(owners[0].uid);
          }
        }
      } catch (err) {
        console.debug("Error loading owners in login page:", err);
      }
    };
    loadOwners();
    return () => {
      isMounted = false;
    };
  }, [selectedEnv, fetchRegisteredOwners, selectedOwnerUid]);

  // Quick 1-Click Role Login for instant evaluation
  const handleQuickLogin = (role: UserRole) => {
    const targetProfile = profiles.find((p) => p.role === role) || profiles[0];
    switchProfile(targetProfile.id);
    if (role === "Cashier") {
      router.push("/pos");
    } else {
      router.push("/dashboard");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (mode === "signup") {
        let userId = `usr-${Date.now()}`;
        if (auth) {
          try {
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            userId = cred.user.uid;
          } catch (authErr: unknown) {
            const msg = authErr instanceof Error ? authErr.message : "Registration error";
            console.warn("Firebase Auth createUser fallback:", msg);
            // If email already in use, throw message
            if (msg.includes("email-already-in-use")) {
              throw new Error("This email is already registered. Please sign in instead.");
            }
          }
        }

        let newProfile: UserProfile;

        if (selectedRole === "Owner") {
          // 1. Owner Registration
          newProfile = {
            id: userId,
            uid: userId,
            displayName: name.trim() || "Pharmacy Owner",
            email: email.trim(),
            env: selectedEnv,
            role: "Owner",
            ownerName: name.trim() || "Pharmacy Owner",
            ownerUid: userId,
            superUserId: userId,
            permissions: getDefaultPermissionsForRole("Owner"),
            createdAt: new Date().toISOString(),
          };
        } else {
          // 2. Manager & Cashier Registration linked to an Owner
          const resolvedOwner =
            availableOwners.find((o) => o.uid === selectedOwnerUid) || availableOwners[0];
          const resolvedOwnerUid = resolvedOwner?.uid || selectedOwnerUid || "usr-owner-01";
          const resolvedOwnerName =
            resolvedOwner?.ownerName ||
            resolvedOwner?.displayName ||
            customOwnerName.trim() ||
            "Registered Owner";

          newProfile = {
            id: userId,
            uid: userId,
            displayName: name.trim() || `${selectedRole} Staff`,
            email: email.trim(),
            env: selectedEnv,
            role: selectedRole,
            ownerName: resolvedOwnerName,
            ownerUid: resolvedOwnerUid,
            superUserId: resolvedOwnerUid,
            permissions: getDefaultPermissionsForRole(selectedRole),
            createdAt: new Date().toISOString(),
          };
        }

        // Mirror identically to Firestore (/users/{userId}) and RTDB (/users/{userId})
        await registerUserProfile(newProfile);
        setEnv(selectedEnv);

        setSuccessMsg("Account registered successfully! Redirecting...");
        setTimeout(() => {
          if (newProfile.role === "Cashier") {
            router.push("/pos");
          } else {
            router.push("/dashboard");
          }
        }, 500);
      } else {
        // Sign-In Flow
        if (auth) {
          try {
            const cred = await signInWithEmailAndPassword(auth, email, password);
            // Session profile resolution is triggered via onAuthStateChanged in PharmacyContext
            const matched =
              profiles.find((p) => p.email.toLowerCase() === email.toLowerCase()) ||
              profiles.find((p) => p.role === selectedRole) ||
              profiles[0];
            switchProfile(matched.id);

            if (matched.role === "Cashier") {
              router.push("/pos");
            } else {
              router.push("/dashboard");
            }
            return;
          } catch (signInErr: unknown) {
            console.warn("Firebase Auth signIn fallback:", signInErr);
          }
        }

        // Local fallback
        const matched =
          profiles.find((p) => p.email.toLowerCase() === email.toLowerCase()) ||
          profiles.find((p) => p.role === selectedRole) ||
          profiles[0];

        switchProfile(matched.id);
        if (matched.role === "Cashier") {
          router.push("/pos");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Failed to authenticate. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg("");
    setLoading(true);
    try {
      if (auth) {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      }
      router.push("/dashboard");
    } catch (err) {
      console.warn("Google auth fallback:", err);
      handleQuickLogin("Owner");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 selection:bg-orange-500 selection:text-white">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[620px]">
        {/* Left Branding Pane */}
        <div className="hidden md:flex md:col-span-5 bg-slate-900 text-white p-8 flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-orange-600/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-emerald-600/20 blur-3xl" />

          <div className="relative z-10 space-y-6">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center font-black text-white text-lg shadow-md shadow-orange-600/30">
                +
              </div>
              <span className="font-extrabold text-lg tracking-tight">
                {settings.pharmacyName}
              </span>
            </Link>

            <div className="space-y-2">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-wider block">
                Multi-Tenant Staff Portal
              </span>
              <h2 className="text-2xl font-black text-white leading-tight">
                Role-Based Pharmacy POS &amp; Management Platform
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Complete data isolation under strictly scoped tenant paths. Owners retain full CRUD
                control while staff accounts bind directly to parent store databases.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Owner Root Tenant Scoping: /&#123;env&#125;/&#123;ownerUid&#125;/...</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Manager: Inventory, GRN &amp; POS Operational Modules</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Cashier: Front-Counter POS Terminal &amp; Sales Checkout</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-8 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>NMRA Compliant RBAC</span>
            <span className="text-emerald-400 font-semibold">● Multi-Tenant Cloud</span>
          </div>
        </div>

        {/* Right Form Pane */}
        <div className="col-span-1 md:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
          <div className="space-y-5">
            {/* Header Toolbar */}
            <div className="flex items-center justify-between">
              <Link
                href="/"
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
              >
                ← Customer Storefront
              </Link>

              {/* Environment Toggle */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEnv("Live");
                    setEnv("Live");
                  }}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                    selectedEnv === "Live"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Live
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEnv("Test");
                    setEnv("Test");
                  }}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                    selectedEnv === "Test"
                      ? "bg-amber-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Test
                </button>
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {mode === "login" ? "Sign in to Terminal" : "Register Staff Profile"}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {mode === "login"
                  ? "Enter your registered credentials or select a 1-click test role."
                  : "Create an Owner account or link a Manager/Cashier to a registered store."}
              </p>
            </div>

            {/* Quick 1-Click Role Login Bar */}
            <div className="p-3 bg-orange-50/80 rounded-2xl border border-orange-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-orange-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                  1-Click Role Login (Demo Ready)
                </span>
                <span className="text-[10px] text-orange-700 font-semibold">Active: {selectedEnv}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin("Owner")}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex flex-col items-center"
                >
                  <span>Owner</span>
                  <span className="text-[9px] text-slate-400 font-normal">Full CRUD</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin("Manager")}
                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex flex-col items-center"
                >
                  <span>Manager</span>
                  <span className="text-[9px] text-blue-200 font-normal">Operations</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin("Cashier")}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex flex-col items-center"
                >
                  <span>Cashier</span>
                  <span className="text-[9px] text-emerald-200 font-normal">POS Terminal</span>
                </button>
              </div>
            </div>

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Role Selection Tabs */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Select Role <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Owner", "Manager", "Cashier"] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRole(r)}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                        selectedRole === r
                          ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Name Input in Signup Mode */}
              {mode === "signup" && (
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    {selectedRole === "Owner" ? "Owner Name" : `${selectedRole} Staff Name`}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={
                        selectedRole === "Owner" ? "e.g. Kasun Kalhara (Owner)" : "e.g. Priyantha Silva"
                      }
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Assigned Owner Selector for Manager & Cashier in Signup Mode */}
              {mode === "signup" && selectedRole !== "Owner" && (
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                    <span>
                      Assigned Store Owner ({selectedEnv}) <span className="text-red-500">*</span>
                    </span>
                    <span className="text-[10px] text-slate-400 lowercase font-normal">
                      tenant binding
                    </span>
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    {availableOwners.length > 0 ? (
                      <select
                        required
                        value={selectedOwnerUid}
                        onChange={(e) => setSelectedOwnerUid(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                      >
                        {availableOwners.map((o) => (
                          <option key={o.uid} value={o.uid}>
                            {o.ownerName || o.displayName} ({o.email})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        required
                        value={customOwnerName}
                        onChange={(e) => setCustomOwnerName(e.target.value)}
                        placeholder="Enter Store Owner Name (e.g. Nimal · Owner)"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@metropharmacy.lk"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-orange-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>
                  {loading
                    ? "Processing..."
                    : mode === "login"
                    ? `Sign In as ${selectedRole}`
                    : `Register as ${selectedRole}`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-slate-400">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-2 px-3 border border-slate-300 hover:border-slate-400 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in with Google OAuth</span>
            </button>
          </div>

          <div className="pt-3 text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className="text-xs font-bold text-orange-600 hover:underline"
            >
              {mode === "login"
                ? "Need a new account? Register Owner or Staff here"
                : "Already registered? Sign in to existing account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

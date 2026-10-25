"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { usePharmacy } from "@/context/PharmacyContext";
import {
  Search,
  Bell,
  Clock,
  ShieldAlert,
  AlertTriangle,
  FileText,
  CheckCircle2,
  X,
  CreditCard,
  LogOut,
  ExternalLink,
} from "lucide-react";

export const GlobalHeader: React.FC = () => {
  const {
    settings,
    env,
    setEnv,
    currentUser,
    signOutUser,
    totalAlertsCount,
    pendingPrescriptionsCount,
    expiredBatchesCount,
    expiringSoonCount,
    lowStockCount,
    creditAlertCount,
    onlinePrescriptions,
    batches,
    products,
    creditCustomers,
    setIsSearchOpen,
    setPendingPrescriptionForPOS,
  } = usePharmacy();

  const router = useRouter();
  const [timeString, setTimeString] = useState<string>("");
  const [dateString, setDateString] = useState<string>("");
  const [isAlertsOpen, setIsAlertsOpen] = useState<boolean>(false);
  const [activeAlertTab, setActiveAlertTab] = useState<
    "all" | "rx" | "expired" | "soon" | "stock" | "credit"
  >("all");

  // Live system clock & date
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setDateString(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Global Ctrl + K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setIsSearchOpen]);

  const handleOpenRxInPOS = (rx: typeof onlinePrescriptions[0]) => {
    setPendingPrescriptionForPOS(rx);
    setIsAlertsOpen(false);
    router.push("/pos");
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs px-4 py-2.5 flex items-center justify-between gap-4">
      {/* Left: Branding & Environment selector */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-black shadow-sm group-hover:scale-105 transition-transform">
            +
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-900 tracking-tight leading-none group-hover:text-orange-600 transition-colors">
              {settings.pharmacyName}
            </h1>
            <span className="text-[10px] text-slate-500 font-medium">
              SaaS Staff Workspace
            </span>
          </div>
        </Link>

        {/* Dynamic Environment Toggle */}
        <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            onClick={() => setEnv("Live")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              env === "Live"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            ● Live
          </button>
          <button
            onClick={() => setEnv("Test")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              env === "Test"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            ● Test
          </button>
        </div>
      </div>

      {/* Middle: Global Search Button & Real-Time Clock */}
      <div className="flex items-center gap-4 flex-1 max-w-xl justify-center">
        <button
          onClick={() => setIsSearchOpen(true)}
          className="w-full max-w-md flex items-center justify-between px-3.5 py-1.5 text-sm bg-slate-100/80 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <span className="text-xs sm:text-sm">Search medicines, barcodes, invoices...</span>
          </div>
          <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-500 bg-white border border-slate-300 rounded shadow-2xs">
            Ctrl K
          </kbd>
        </button>

        {/* Live Clock */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
          <Clock className="w-3.5 h-3.5 text-orange-600" />
          <span className="font-mono font-semibold">{timeString}</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-500">{dateString}</span>
        </div>
      </div>

      {/* Right: Actions, Notifications Bell & Role Switcher */}
      <div className="flex items-center gap-2">
        {/* Public Storefront Link */}
        <Link
          href="/"
          target="_blank"
          className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
          title="Open Public Customer Portal"
        >
          <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          <span>Customer Portal</span>
        </Link>

        {/* Smart Action Centre (Notification Bell) */}
        <div className="relative">
          <button
            onClick={() => setIsAlertsOpen(!isAlertsOpen)}
            className={`relative p-2 rounded-lg border transition-all ${
              isAlertsOpen
                ? "bg-orange-50 border-orange-300 text-orange-600"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            title="Smart Action Centre"
          >
            <Bell className="w-4 h-4" />
            {totalAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-xs animate-pulse">
                {totalAlertsCount}
              </span>
            )}
          </button>

          {/* Action Centre Drawer Dropdown */}
          {isAlertsOpen && (
            <div className="absolute right-0 mt-2 w-96 max-w-[90vw] bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">
                    Smart Action Centre
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-300">
                    {totalAlertsCount} Urgent Alerts
                  </span>
                  <button
                    onClick={() => setIsAlertsOpen(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Drawer Filter Tabs */}
              <div className="flex items-center overflow-x-auto p-1.5 bg-slate-100 border-b border-slate-200 gap-1 text-[11px] font-medium text-slate-600">
                <button
                  onClick={() => setActiveAlertTab("all")}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    activeAlertTab === "all" ? "bg-white text-slate-900 font-bold shadow-2xs" : ""
                  }`}
                >
                  All ({totalAlertsCount})
                </button>
                <button
                  onClick={() => setActiveAlertTab("rx")}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    activeAlertTab === "rx" ? "bg-orange-500 text-white font-bold" : ""
                  }`}
                >
                  Online Rx ({pendingPrescriptionsCount})
                </button>
                <button
                  onClick={() => setActiveAlertTab("expired")}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    activeAlertTab === "expired" ? "bg-red-600 text-white font-bold" : ""
                  }`}
                >
                  Expired ({expiredBatchesCount})
                </button>
                <button
                  onClick={() => setActiveAlertTab("soon")}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    activeAlertTab === "soon" ? "bg-amber-600 text-white font-bold" : ""
                  }`}
                >
                  Soon ({expiringSoonCount})
                </button>
                <button
                  onClick={() => setActiveAlertTab("stock")}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    activeAlertTab === "stock" ? "bg-slate-700 text-white font-bold" : ""
                  }`}
                >
                  Stock ({lowStockCount})
                </button>
              </div>

              {/* Alerts List Body */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
                {/* Online Prescriptions */}
                {(activeAlertTab === "all" || activeAlertTab === "rx") &&
                  onlinePrescriptions
                    .filter((r) => r.status === "pending")
                    .map((rx) => (
                      <div
                        key={rx.id}
                        className="p-3 bg-orange-50/40 hover:bg-orange-50 transition-colors flex items-start gap-2.5"
                      >
                        <FileText className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{rx.referenceId}</span>
                            <span className="text-[10px] text-orange-700 font-semibold bg-orange-100 px-1.5 py-0.5 rounded">
                              Pending Rx
                            </span>
                          </div>
                          <p className="text-slate-700 font-medium">{rx.customerName}</p>
                          <p className="text-[11px] text-slate-500">{rx.contactNumber}</p>
                          {rx.notes && (
                            <p className="text-[10px] text-slate-600 italic mt-0.5 line-clamp-1">
                              &ldquo;{rx.notes}&rdquo;
                            </p>
                          )}
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              onClick={() => handleOpenRxInPOS(rx)}
                              className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded font-semibold text-[10px] shadow-2xs transition-colors"
                            >
                              Send to POS Bill →
                            </button>
                            <Link
                              href="/sales/prescriptions"
                              onClick={() => setIsAlertsOpen(false)}
                              className="text-[10px] text-slate-600 hover:underline"
                            >
                              View details
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}

                {/* Expired Batches */}
                {(activeAlertTab === "all" || activeAlertTab === "expired") &&
                  batches
                    .filter((b) => b.status === "expired")
                    .map((batch) => (
                      <div
                        key={batch.id}
                        className="p-3 bg-red-50/40 hover:bg-red-50 transition-colors flex items-start gap-2.5"
                      >
                        <ShieldAlert className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-red-900">{batch.productName}</span>
                            <span className="text-[10px] bg-red-100 text-red-800 font-bold px-1.5 py-0.5 rounded">
                              BLOCKED AT POS
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600">
                            Batch: <span className="font-mono">{batch.batchNumber}</span> | Expired:{" "}
                            {batch.expiryDate}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Remaining in stock: {batch.quantity} units
                          </p>
                          <Link
                            href="/inventory"
                            onClick={() => setIsAlertsOpen(false)}
                            className="inline-block mt-1 text-[10px] text-red-700 font-semibold hover:underline"
                          >
                            Quarantine / Stock Adjustment →
                          </Link>
                        </div>
                      </div>
                    ))}

                {/* Expiring Soon */}
                {(activeAlertTab === "all" || activeAlertTab === "soon") &&
                  batches
                    .filter((b) => b.status === "expiring_soon")
                    .map((batch) => (
                      <div
                        key={batch.id}
                        className="p-3 bg-amber-50/40 hover:bg-amber-50 transition-colors flex items-start gap-2.5"
                      >
                        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{batch.productName}</span>
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                              Expiring Soon
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600">
                            Batch: <span className="font-mono">{batch.batchNumber}</span> | Expiry:{" "}
                            {batch.expiryDate}
                          </p>
                          <p className="text-[10px] text-slate-500">{batch.quantity} units on shelf</p>
                        </div>
                      </div>
                    ))}

                {/* Low Stock Items */}
                {(activeAlertTab === "all" || activeAlertTab === "stock") &&
                  products
                    .filter((p) => p.totalStock <= p.lowStockLimit)
                    .map((product) => (
                      <div
                        key={product.id}
                        className="p-3 hover:bg-slate-50 transition-colors flex items-start gap-2.5"
                      >
                        <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{product.name}</span>
                            <span className="text-[10px] text-orange-700 font-medium">
                              {product.totalStock} / {product.lowStockLimit} limit
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Barcode: {product.barcode} · {product.unit}
                          </p>
                          <Link
                            href="/inventory/grn"
                            onClick={() => setIsAlertsOpen(false)}
                            className="inline-block mt-1 text-[10px] text-orange-600 font-semibold hover:underline"
                          >
                            Create GRN Reorder →
                          </Link>
                        </div>
                      </div>
                    ))}

                {/* Credit Overdue */}
                {(activeAlertTab === "all" || activeAlertTab === "credit") &&
                  creditCustomers
                    .filter((c) => c.outstandingBalance >= c.creditLimit * 0.75)
                    .map((cust) => (
                      <div
                        key={cust.id}
                        className="p-3 bg-purple-50/40 hover:bg-purple-50 transition-colors flex items-start gap-2.5"
                      >
                        <CreditCard className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{cust.name}</span>
                            <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded">
                              Near Limit
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600">
                            Balance: LKR {cust.outstandingBalance.toLocaleString()} / Limit: LKR{" "}
                            {cust.creditLimit.toLocaleString()}
                          </p>
                          <Link
                            href="/partners/credit"
                            onClick={() => setIsAlertsOpen(false)}
                            className="inline-block mt-1 text-[10px] text-purple-700 font-semibold hover:underline"
                          >
                            Receive Payment →
                          </Link>
                        </div>
                      </div>
                    ))}

                {totalAlertsCount === 0 && (
                  <div className="p-8 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                    <p className="font-medium text-slate-700">All Systems Normal</p>
                    <p className="text-[11px]">No urgent inventory or prescription alerts.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Static Authenticated Session Identity Badge & Sign Out (Role Switcher Removed) */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="flex items-center gap-2.5 bg-slate-100/80 border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs text-white shadow-xs ${
                currentUser.role === "Owner"
                  ? "bg-slate-900"
                  : currentUser.role === "Manager"
                  ? "bg-blue-600"
                  : "bg-emerald-600"
              }`}
            >
              {currentUser.displayName ? currentUser.displayName.charAt(0) : "U"}
            </div>

            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-900 leading-none">
                  {currentUser.displayName}
                </span>

                {/* Role Badge */}
                <span
                  className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md ${
                    currentUser.role === "Owner"
                      ? "bg-purple-100 text-purple-800 border border-purple-200"
                      : currentUser.role === "Manager"
                      ? "bg-blue-100 text-blue-800 border border-blue-200"
                      : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  }`}
                >
                  {currentUser.role}
                </span>

                {/* Environment Pill */}
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                    env === "Live"
                      ? "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-700 border border-amber-500/30"
                  }`}
                >
                  {env}
                </span>
              </div>

              {/* Parent Owner Identity */}
              <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                Owner:{" "}
                <strong className="text-slate-700 font-bold">
                  {currentUser.ownerName || currentUser.displayName}
                </strong>
              </span>
            </div>
          </div>

          {/* Direct Sign Out Button */}
          <button
            type="button"
            onClick={signOutUser}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/80 rounded-xl border border-red-200 transition-colors shadow-2xs"
            title="Sign out of active staff terminal"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};

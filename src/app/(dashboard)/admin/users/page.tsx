"use client";

import React, { useState } from "react";
import { usePharmacy } from "@/context/PharmacyContext";
import { UserProfile, UserPermissions, UserRole } from "@/types/pharmacy";
import {
  UserCog,
  CheckCircle,
  Shield,
  Sliders,
  Lock,
  Unlock,
  KeyRound,
  UserCheck,
} from "lucide-react";

export default function UsersAndRolesPage() {
  const { profiles, updateUserPermissions, currentUser } = usePharmacy();
  const [selectedUser, setSelectedUser] = useState<UserProfile>(profiles[0]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Local copy of permissions for editing
  const [currentPermissions, setCurrentPermissions] = useState<UserPermissions>(
    selectedUser.permissions
  );

  const handleSelectUser = (u: UserProfile) => {
    setSelectedUser(u);
    setCurrentPermissions(u.permissions);
  };

  const handleToggleModule = (moduleKey: keyof UserPermissions["modules"]) => {
    setCurrentPermissions((prev) => ({
      ...prev,
      modules: {
        ...prev.modules,
        [moduleKey]: !prev.modules[moduleKey],
      },
    }));
  };

  const handleToggleAction = (actionKey: keyof UserPermissions["actions"]) => {
    setCurrentPermissions((prev) => ({
      ...prev,
      actions: {
        ...prev.actions,
        [actionKey]: !prev.actions[actionKey],
      },
    }));
  };

  const handleSave = () => {
    updateUserPermissions(selectedUser.id, currentPermissions);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const moduleLabels: { key: keyof UserPermissions["modules"]; label: string; desc: string }[] = [
    { key: "dashboard", label: "Executive Dashboard", desc: "View daily sales KPIs and financial trends" },
    { key: "pos", label: "Smart POS Terminal", desc: "Process walk-in, online Rx, and credit bills" },
    { key: "inventory", label: "Products & Stock", desc: "View catalogue and stock level statuses" },
    { key: "grn", label: "GRN / Purchases", desc: "Record procurement shipments and supplier invoices" },
    { key: "sales", label: "Sales History", desc: "Access invoice records and customer receipts" },
    { key: "credit", label: "Credit Customers", desc: "Manage credit limits and customer statements" },
    { key: "suppliers", label: "Suppliers Directory", desc: "Manage distributor contact profiles" },
    { key: "prescriptions", label: "Prescriptions Queue", desc: "Review customer uploaded online prescriptions" },
    { key: "reports", label: "Smart Reports Engine", desc: "Generate and export 9 specialized audit views" },
    { key: "users", label: "Users & Roles Admin", desc: "Modify system role permissions matrix" },
    { key: "settings", label: "System Settings", desc: "Change store details and manage backups" },
  ];

  const actionLabels: { key: keyof UserPermissions["actions"]; label: string; desc: string }[] = [
    { key: "allowCustomPrice", label: "Allow Custom POS Prices", desc: "Permits manually overriding selling prices during checkout" },
    { key: "allowBillDiscount", label: "Allow Bill Discounts", desc: "Permits cashier to apply percentage or fixed LKR bill discounts" },
    { key: "allowCreditBilling", label: "Allow Credit Billing", desc: "Permits billing unpaid invoices to customer credit accounts" },
    { key: "allowRefunds", label: "Allow Sales Refunds & Exchanges", desc: "Permits processing returns and cash/credit refund settlements" },
    { key: "allowStockAdjustment", label: "Allow Manual Stock Adjustments", desc: "Permits writing off damaged medicines or manually altering counts" },
  ];

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
            RBAC Access Governance
          </span>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Users, Roles &amp; Granular Permissions Matrix
          </h1>
          <p className="text-xs text-slate-500">
            Define module-level access rules and fine-grained cashier action boundaries.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-orange-600/20 transition-all flex items-center gap-1.5"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Save Active Permissions Matrix</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle className="w-4 h-4" />
          <span>Permissions Matrix Successfully Updated in Real Time!</span>
        </div>
      )}

      {/* Main Grid: Staff Users List / Permissions Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left: Staff Profiles List */}
        <div className="md:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Registered Staff Profiles
          </span>

          <div className="space-y-2">
            {profiles.map((p) => {
              const isSelected = p.id === selectedUser.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectUser(p)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                    isSelected
                      ? "bg-orange-50 border-orange-300 shadow-xs"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white ${
                        p.role === "Owner"
                          ? "bg-slate-900"
                          : p.role === "Manager"
                          ? "bg-blue-600"
                          : "bg-emerald-600"
                      }`}
                    >
                      {p.displayName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 text-xs">{p.displayName}</p>
                      <p className="text-[10px] text-slate-500">{p.email}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      p.role === "Owner"
                        ? "bg-slate-900 text-white"
                        : p.role === "Manager"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {p.role}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Permissions Matrix Form */}
        <div className="md:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-6">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Configuring Role Policy For
                </span>
                <h3 className="text-base font-black text-slate-900">
                  {selectedUser.displayName} ({selectedUser.role})
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">{selectedUser.email}</span>
            </div>
          </div>

          {/* Section 1: Module-Level Access Matrix (11 Modules) */}
          <div className="space-y-3">
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-orange-600" />
              <span>Module-Level Access Rights (11 Modules)</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {moduleLabels.map((m) => {
                const isEnabled = currentPermissions.modules[m.key];
                return (
                  <div
                    key={m.key}
                    onClick={() => handleToggleModule(m.key)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-2 select-none ${
                      isEnabled
                        ? "bg-emerald-50/50 border-emerald-300"
                        : "bg-slate-50 border-slate-200 opacity-60"
                    }`}
                  >
                    <div>
                      <p className="font-extrabold text-slate-900">{m.label}</p>
                      <p className="text-[10px] text-slate-500">{m.desc}</p>
                    </div>

                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                        isEnabled ? "bg-emerald-600 text-white" : "bg-slate-300 text-slate-600"
                      }`}
                    >
                      {isEnabled ? "✓" : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Action-Level Permission Toggles (5 switches) */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>Action-Level Operational Switches</span>
            </span>

            <div className="space-y-2 text-xs">
              {actionLabels.map((a) => {
                const isAllowed = currentPermissions.actions[a.key];
                return (
                  <div
                    key={a.key}
                    onClick={() => handleToggleAction(a.key)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between select-none ${
                      isAllowed
                        ? "bg-blue-50/60 border-blue-300"
                        : "bg-slate-50 border-slate-200 opacity-60"
                    }`}
                  >
                    <div>
                      <p className="font-extrabold text-slate-900">{a.label}</p>
                      <p className="text-[10px] text-slate-500">{a.desc}</p>
                    </div>

                    <div
                      className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                        isAllowed ? "bg-blue-600" : "bg-slate-300"
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          isAllowed ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

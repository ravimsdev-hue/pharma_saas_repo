"use client";

import React, { useState, useRef } from "react";
import { usePharmacy } from "@/context/PharmacyContext";
import {
  Settings,
  Download,
  Upload,
  RotateCcw,
  CheckCircle,
  Save,
  Building,
  Phone,
  FileText,
  AlertTriangle,
  HardDrive,
} from "lucide-react";

export default function SystemSettingsPage() {
  const {
    settings,
    updateSettings,
    exportBackup,
    importBackup,
    resetDemoData,
    env,
  } = usePharmacy();

  const [pharmacyName, setPharmacyName] = useState(settings.pharmacyName);
  const [tagline, setTagline] = useState(settings.tagline);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);
  const [address, setAddress] = useState(settings.address);
  const [receiptFooter, setReceiptFooter] = useState(settings.receiptFooter);
  const [lowLimitDefault, setLowLimitDefault] = useState(settings.lowStockThresholdDefault);
  const [expiryDays, setExpiryDays] = useState(settings.expiryWarningDays);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      pharmacyName,
      tagline,
      phone,
      email,
      address,
      receiptFooter,
      lowStockThresholdDefault: Number(lowLimitDefault),
      expiryWarningDays: Number(expiryDays),
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleExport = () => {
    const jsonStr = exportBackup();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Metro_Pharmacy_Backup_${env}_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const ok = await importBackup(content);
      if (ok) {
        setImportNotice("Database successfully restored from JSON backup!");
      } else {
        setImportNotice("Failed to import. Invalid JSON structure.");
      }
      setTimeout(() => setImportNotice(null), 3500);
    };
    reader.readAsText(file);
  };

  const handleResetDemo = async () => {
    if (confirm("Reset environment back to initial pharmacy demo seed data?")) {
      await resetDemoData();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
            System Administration
          </span>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Store Profile &amp; Database Lifecycle
          </h1>
          <p className="text-xs text-slate-500">
            Customize storefront branding, thermal receipt metadata, and manage database snapshots.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            Active Tenant Environment: <strong className="text-orange-600">{env}</strong>
          </span>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle className="w-4 h-4" />
          <span>System Settings &amp; Store Branding Successfully Saved!</span>
        </div>
      )}

      {resetSuccess && (
        <div className="p-3 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle className="w-4 h-4" />
          <span>Environment Reset to Clean Pharmacy Demo Dataset!</span>
        </div>
      )}

      {importNotice && (
        <div className="p-3 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{importNotice}</span>
        </div>
      )}

      {/* Main Grid: Store Profile / Database Snapshots */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Store Profile Settings Form */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
            <Building className="w-5 h-5 text-orange-600" />
            <h3 className="font-extrabold text-slate-900 text-sm">
              Pharmacy Storefront &amp; Contact Metadata
            </h3>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase">Pharmacy Display Name *</label>
                <input
                  type="text"
                  required
                  value={pharmacyName}
                  onChange={(e) => setPharmacyName(e.target.value)}
                  placeholder="Metro Pharmacy / Borcelle Pharmacy"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-extrabold text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase">Tagline / Motto</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="All Medicines Store"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase">Hotline Phone Number *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+94 47 224 0000"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase">Official Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="care@metropharmacy.lk"
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Location / Address</label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Beach Road, Tangalle, Sri Lanka"
                className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">
                Printable 80mm Receipt Footer Notice
              </label>
              <textarea
                rows={2}
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                placeholder="Thank you for trusting Metro Pharmacy. Please bring this receipt for returns within 7 days..."
                className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase">
                  Default Low Stock Alert Threshold
                </label>
                <input
                  type="number"
                  min="1"
                  value={lowLimitDefault}
                  onChange={(e) => setLowLimitDefault(Number(e.target.value))}
                  className="w-full p-2 rounded-lg border border-slate-300 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase">
                  Expiry Warning Threshold (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(Number(e.target.value))}
                  className="w-full p-2 rounded-lg border border-slate-300 font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              className="py-3 px-6 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs rounded-xl shadow-md transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </form>
        </div>

        {/* Right: Database Backup, Import & Reset */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
              <HardDrive className="w-5 h-5 text-slate-700" />
              <h3 className="font-extrabold text-slate-900 text-sm">
                Data Backup &amp; Recovery
              </h3>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Export complete tenant database (catalogues, batches, sales, credit balances) as a timestamped JSON file.
            </p>

            <button
              type="button"
              onClick={handleExport}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Export Full JSON Backup</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Import JSON Backup</span>
            </button>
          </div>

          {/* Reset Demo Seed Data */}
          <div className="bg-red-50 rounded-2xl border border-red-200 p-6 space-y-3">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h4 className="font-extrabold text-xs uppercase tracking-wider">
                Reset Demo Data
              </h4>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Restores the current environment back to the clean initial demo seed data (medicines, batches, suppliers, credit customers, sample sales).
            </p>

            <button
              type="button"
              onClick={handleResetDemo}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Clean Seed Dataset</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

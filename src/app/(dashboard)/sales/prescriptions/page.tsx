"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { usePharmacy } from "@/context/PharmacyContext";
import { OnlinePrescription } from "@/types/pharmacy";
import {
  FileText,
  Search,
  ShoppingCart,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  Phone,
  MapPin,
  ExternalLink,
  X,
  AlertCircle,
} from "lucide-react";

export default function PrescriptionsPage() {
  const router = useRouter();
  const {
    onlinePrescriptions,
    sales,
    updatePrescriptionStatus,
    setPendingPrescriptionForPOS,
  } = usePharmacy();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedPreviewRx, setSelectedPreviewRx] = useState<OnlinePrescription | null>(null);

  // In-store prescriptions attached to sales invoices
  const inStorePrescriptionSales = useMemo(() => {
    return sales.filter((s) => s.prescriptionUrl);
  }, [sales]);

  const filteredOnline = useMemo(() => {
    const q = query.trim().toLowerCase();
    return onlinePrescriptions.filter((rx) => {
      const matchQ =
        !q ||
        rx.referenceId.toLowerCase().includes(q) ||
        rx.customerName.toLowerCase().includes(q) ||
        rx.contactNumber.includes(q);

      const matchStatus = statusFilter === "All" || rx.status === statusFilter;
      return matchQ && matchStatus;
    });
  }, [onlinePrescriptions, query, statusFilter]);

  const handleSendToPOS = (rx: OnlinePrescription) => {
    updatePrescriptionStatus(rx.id, "in_pos");
    setPendingPrescriptionForPOS(rx);
    router.push("/pos");
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
            Digital Archive &amp; Fulfillment
          </span>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Prescriptions Compliance &amp; Online Queue
          </h1>
          <p className="text-xs text-slate-500">
            Real-time verification queue for public online submissions and in-store dispensary records.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          {(["All", "pending", "in_pos", "completed", "rejected"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
                statusFilter === st
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {st === "in_pos" ? "In POS" : st}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by prescription reference ID (RX-2026-...), customer name, or phone number..."
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Online Customer Prescriptions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOnline.map((rx) => (
          <div
            key={rx.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-sm text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                  {rx.referenceId}
                </span>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                    rx.status === "pending"
                      ? "bg-amber-100 text-amber-800 animate-pulse"
                      : rx.status === "in_pos"
                      ? "bg-blue-100 text-blue-800"
                      : rx.status === "completed"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  ● {rx.status === "in_pos" ? "In POS Billing" : rx.status}
                </span>
              </div>

              {/* Customer Contact Details */}
              <div className="space-y-1 text-xs">
                <p className="font-extrabold text-slate-900 text-sm">{rx.customerName}</p>
                <p className="text-slate-600 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{rx.contactNumber}</span>
                </p>
                <p className="text-slate-500 flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <span className="line-clamp-2">{rx.address}</span>
                </p>
                {rx.notes && (
                  <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-200">
                    &ldquo;{rx.notes}&rdquo;
                  </p>
                )}
              </div>

              {/* Document Thumbnail Preview */}
              {rx.fileUrl && (
                <div
                  onClick={() => setSelectedPreviewRx(rx)}
                  className="relative h-32 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer group"
                >
                  <Image
                    src={rx.fileUrl}
                    alt="Prescription document"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold gap-1 transition-opacity">
                    <Eye className="w-4 h-4" />
                    <span>Click to Zoom</span>
                  </div>
                </div>
              )}
            </div>

            {/* Actions Toolbar */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400">
                {new Date(rx.submittedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>

              <div className="flex items-center gap-1.5">
                {rx.status !== "completed" && (
                  <button
                    onClick={() => handleSendToPOS(rx)}
                    className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Send to POS →</span>
                  </button>
                )}

                {rx.status === "pending" && (
                  <button
                    onClick={() => updatePrescriptionStatus(rx.id, "rejected")}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100"
                    title="Reject Prescription"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredOnline.length === 0 && (
        <div className="py-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-400">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-xs font-bold text-slate-600 uppercase">No prescriptions found</p>
        </div>
      )}

      {/* Prescription Document Zoom Modal */}
      {selectedPreviewRx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-xs font-mono font-bold text-orange-600">
                  {selectedPreviewRx.referenceId}
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Patient Prescription: {selectedPreviewRx.customerName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPreviewRx(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative h-96 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
              <Image
                src={selectedPreviewRx.fileUrl}
                alt="Prescription full zoom"
                fill
                className="object-contain"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <p>Address: <strong>{selectedPreviewRx.address}</strong></p>
              <p>Contact: <strong>{selectedPreviewRx.contactNumber}</strong></p>
              {selectedPreviewRx.notes && <p className="italic">Note: {selectedPreviewRx.notes}</p>}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedPreviewRx(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Close Preview
              </button>
              <button
                onClick={() => {
                  handleSendToPOS(selectedPreviewRx);
                  setSelectedPreviewRx(null);
                }}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-xs"
              >
                Send to POS Terminal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

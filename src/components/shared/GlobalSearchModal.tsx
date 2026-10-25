"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { usePharmacy } from "@/context/PharmacyContext";
import {
  Search,
  X,
  Package,
  Receipt,
  FileText,
  Building2,
  Users,
  ArrowRight,
} from "lucide-react";

export const GlobalSearchModal: React.FC = () => {
  const {
    isSearchOpen,
    setIsSearchOpen,
    products,
    sales,
    onlinePrescriptions,
    suppliers,
    creditCustomers,
    setPendingPrescriptionForPOS,
  } = usePharmacy();

  const router = useRouter();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!isSearchOpen) {
      setQuery("");
    }
  }, [isSearchOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  const cleanQuery = query.trim().toLowerCase();

  const filteredProducts = useMemo(() => {
    if (!cleanQuery) return [];
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(cleanQuery) ||
          p.barcode.includes(cleanQuery) ||
          (p.genericName && p.genericName.toLowerCase().includes(cleanQuery))
      )
      .slice(0, 5);
  }, [cleanQuery, products]);

  const filteredSales = useMemo(() => {
    if (!cleanQuery) return [];
    return sales
      .filter(
        (s) =>
          s.invoiceNumber.toLowerCase().includes(cleanQuery) ||
          s.customerName.toLowerCase().includes(cleanQuery) ||
          (s.customerPhone && s.customerPhone.includes(cleanQuery))
      )
      .slice(0, 4);
  }, [cleanQuery, sales]);

  const filteredPrescriptions = useMemo(() => {
    if (!cleanQuery) return [];
    return onlinePrescriptions
      .filter(
        (rx) =>
          rx.referenceId.toLowerCase().includes(cleanQuery) ||
          rx.customerName.toLowerCase().includes(cleanQuery) ||
          rx.contactNumber.includes(cleanQuery)
      )
      .slice(0, 4);
  }, [cleanQuery, onlinePrescriptions]);

  const filteredSuppliers = useMemo(() => {
    if (!cleanQuery) return [];
    return suppliers
      .filter(
        (s) =>
          s.name.toLowerCase().includes(cleanQuery) ||
          s.contactPerson.toLowerCase().includes(cleanQuery) ||
          s.phone.includes(cleanQuery)
      )
      .slice(0, 3);
  }, [cleanQuery, suppliers]);

  const filteredCreditCustomers = useMemo(() => {
    if (!cleanQuery) return [];
    return creditCustomers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(cleanQuery) ||
          c.nic.toLowerCase().includes(cleanQuery) ||
          c.phone.includes(cleanQuery)
      )
      .slice(0, 3);
  }, [cleanQuery, creditCustomers]);

  const totalResults =
    filteredProducts.length +
    filteredSales.length +
    filteredPrescriptions.length +
    filteredSuppliers.length +
    filteredCreditCustomers.length;

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3 border-b border-slate-200 bg-slate-50">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search medicines, barcodes, invoices, online prescriptions, suppliers..."
            className="w-full bg-transparent text-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="ml-2 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-500 bg-white border border-slate-300 rounded">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {!cleanQuery && (
            <div className="py-8 text-center text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Universal Command Palette
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Type anything to search across inventory, sales history, prescriptions, credit ledgers, and suppliers.
              </p>
            </div>
          )}

          {cleanQuery && totalResults === 0 && (
            <div className="py-8 text-center text-slate-400">
              <p className="text-sm font-semibold text-slate-600">No matching records found</p>
              <p className="text-xs mt-1">Try searching by barcode, patient phone, or invoice number.</p>
            </div>
          )}

          {/* Medicines & Stock */}
          {filteredProducts.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                <Package className="w-3.5 h-3.5 text-orange-600" />
                <span>Medicines & Products ({filteredProducts.length})</span>
              </div>
              <div className="space-y-1">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setIsSearchOpen(false);
                      router.push("/inventory");
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-100 flex items-center justify-between text-xs transition-colors group"
                  >
                    <div>
                      <p className="font-bold text-slate-900 group-hover:text-orange-600">
                        {p.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Barcode: <span className="font-mono">{p.barcode}</span> · {p.category} · Stock: {p.totalStock} {p.unit}s
                      </p>
                    </div>
                    <span className="font-semibold text-slate-700 bg-slate-200/60 px-2 py-1 rounded">
                      LKR {p.sellPrice.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Online Prescriptions */}
          {filteredPrescriptions.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Online Prescriptions ({filteredPrescriptions.length})</span>
              </div>
              <div className="space-y-1">
                {filteredPrescriptions.map((rx) => (
                  <button
                    key={rx.id}
                    onClick={() => {
                      setPendingPrescriptionForPOS(rx);
                      setIsSearchOpen(false);
                      router.push("/pos");
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-blue-50/60 flex items-center justify-between text-xs transition-colors group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-700">{rx.referenceId}</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                          {rx.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-slate-800 font-medium">{rx.customerName} · {rx.contactNumber}</p>
                    </div>
                    <span className="text-blue-600 font-semibold flex items-center gap-1 text-[11px]">
                      Open in POS <ArrowRight className="w-3 h-3" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sales Invoices */}
          {filteredSales.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                <span>Sales Invoices ({filteredSales.length})</span>
              </div>
              <div className="space-y-1">
                {filteredSales.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setIsSearchOpen(false);
                      router.push("/sales");
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-100 flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <p className="font-mono font-bold text-slate-900">{s.invoiceNumber}</p>
                      <p className="text-[11px] text-slate-500">
                        {s.customerName} · {s.paymentMethod} · Cashier: {s.cashierName}
                      </p>
                    </div>
                    <span className="font-bold text-emerald-700">
                      LKR {s.netTotal.toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Credit Customers */}
          {filteredCreditCustomers.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                <Users className="w-3.5 h-3.5 text-purple-600" />
                <span>Credit Customers ({filteredCreditCustomers.length})</span>
              </div>
              <div className="space-y-1">
                {filteredCreditCustomers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setIsSearchOpen(false);
                      router.push("/partners/credit");
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-purple-50/50 flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{c.name}</p>
                      <p className="text-[11px] text-slate-500">
                        NIC: {c.nic} · {c.phone}
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-purple-700">
                      Bal: LKR {c.outstandingBalance.toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Suppliers */}
          {filteredSuppliers.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                <Building2 className="w-3.5 h-3.5 text-slate-700" />
                <span>Suppliers ({filteredSuppliers.length})</span>
              </div>
              <div className="space-y-1">
                {filteredSuppliers.map((sup) => (
                  <button
                    key={sup.id}
                    onClick={() => {
                      setIsSearchOpen(false);
                      router.push("/partners/suppliers");
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-100 flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{sup.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {sup.contactPerson} · {sup.phone}
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-600">View Supplier →</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

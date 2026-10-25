"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePharmacy } from "@/context/PharmacyContext";
import { GRNLineItem, Product } from "@/types/pharmacy";
import {
  Truck,
  Plus,
  Trash2,
  CheckCircle,
  FileText,
  Calendar,
  Building2,
  Paperclip,
  ChevronRight,
  Eye,
  X,
} from "lucide-react";

export default function GRNPage() {
  const { suppliers, products, grns, createGRN } = usePharmacy();

  // Tab: New GRN vs History
  const [activeTab, setActiveTab] = useState<"new" | "history">("new");

  // Form states
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || "");
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("2026-02-01");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<GRNLineItem[]>([]);
  const [formError, setFormError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Selected GRN for history details modal
  const [selectedGRN, setSelectedGRN] = useState<typeof grns[0] | null>(null);

  // Line item builder temporary states
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || "");
  const [itemBatchNum, setItemBatchNum] = useState("");
  const [itemExpiry, setItemExpiry] = useState("2027-01-01");
  const [itemQty, setItemQty] = useState(50);

  React.useEffect(() => {
    const today = new Date();
    setInvoiceDate(today.toISOString().split("T")[0]);
    const exp = new Date(Date.now() + 365 * 24 * 3600 * 1000);
    setItemExpiry(exp.toISOString().split("T")[0]);
  }, []);
  const [itemCost, setItemCost] = useState(15);
  const [itemSell, setItemSell] = useState(25);

  const handleAddLineItem = () => {
    const targetProduct = products.find((p) => p.id === selectedProductId);
    if (!targetProduct) return;
    if (!itemBatchNum) {
      setFormError("Batch number is required for every line item.");
      return;
    }

    const newItem: GRNLineItem = {
      productId: targetProduct.id,
      productName: targetProduct.name,
      barcode: targetProduct.barcode,
      batchNumber: itemBatchNum,
      expiryDate: itemExpiry,
      receivedQuantity: Number(itemQty),
      unitCostPrice: Number(itemCost),
      unitSellingPrice: Number(itemSell),
      lineTotal: Number(itemQty) * Number(itemCost),
    };

    setLineItems((prev) => [...prev, newItem]);
    setItemBatchNum("");
    setFormError("");
  };

  const handleRemoveLineItem = (idx: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const totalCost = lineItems.reduce((acc, i) => acc + i.lineTotal, 0);

  const handleSubmitGRN = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!supplierId || !supplierInvoiceNumber || lineItems.length === 0) {
      setFormError("Please select a supplier, enter invoice number, and add at least one batch item.");
      return;
    }

    const sup = suppliers.find((s) => s.id === supplierId);

    await createGRN({
      supplierId,
      supplierName: sup?.name || "Supplier",
      supplierInvoiceNumber,
      invoiceDate,
      lineItems,
      totalCost,
      notes,
    });

    setIsSuccess(true);
    setLineItems([]);
    setSupplierInvoiceNumber("");
    setNotes("");
    setTimeout(() => {
      setIsSuccess(false);
      setActiveTab("history");
    }, 1500);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
            Procurement &amp; Stock Inflow
          </span>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Goods Received Notes (GRN)
          </h1>
          <p className="text-xs text-slate-500">
            Register incoming shipments, track batch expiry, and auto-sync inventory valuation.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab("new")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "new" ? "bg-orange-600 text-white shadow-xs" : "text-slate-600"
            }`}
          >
            + Create New GRN
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "history" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600"
            }`}
          >
            GRN History ({grns.length})
          </button>
        </div>
      </div>

      {activeTab === "new" ? (
        /* Create GRN Form */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-6">
          <form onSubmit={handleSubmitGRN} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase">Primary Supplier *</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 bg-white"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase">
                  Supplier Invoice / Ref Number *
                </label>
                <input
                  type="text"
                  required
                  value={supplierInvoiceNumber}
                  onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
                  placeholder="e.g. SPC-INV-2026-9901"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase">Invoice Date *</label>
                <input
                  type="date"
                  required
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                />
              </div>
            </div>

            {/* Dynamic Line-Item Batch Builder */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Line-Item Batch Builder
                </span>
                <span className="text-[11px] text-slate-500">
                  Adds new batches or updates existing batches upon submission
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
                <div className="col-span-2 space-y-1">
                  <label className="font-bold text-slate-600">Product</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => {
                      setSelectedProductId(e.target.value);
                      const p = products.find((x) => x.id === e.target.value);
                      if (p) {
                        setItemCost(p.costPrice);
                        setItemSell(p.sellPrice);
                      }
                    }}
                    className="w-full p-2 rounded-lg border border-slate-300 font-semibold bg-white"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Batch #</label>
                  <input
                    type="text"
                    value={itemBatchNum}
                    onChange={(e) => setItemBatchNum(e.target.value)}
                    placeholder="BAT-NEW"
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Expiry Date</label>
                  <input
                    type="date"
                    value={itemExpiry}
                    onChange={(e) => setItemExpiry(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Cost (LKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={itemCost}
                    onChange={(e) => setItemCost(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-300 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Qty</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      value={itemQty}
                      onChange={(e) => setItemQty(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-slate-300 font-bold"
                    />
                    <button
                      type="button"
                      onClick={handleAddLineItem}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold"
                    >
                      +Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Added Line Items Table */}
              {lineItems.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-[10px] font-bold text-slate-600 uppercase">
                      <tr>
                        <th className="p-2.5">Medicine</th>
                        <th className="p-2.5">Batch</th>
                        <th className="p-2.5">Expiry</th>
                        <th className="p-2.5 text-right">Received Qty</th>
                        <th className="p-2.5 text-right">Unit Cost</th>
                        <th className="p-2.5 text-right">Line Total (LKR)</th>
                        <th className="p-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lineItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-bold text-slate-900">{item.productName}</td>
                          <td className="p-2.5 font-mono">{item.batchNumber}</td>
                          <td className="p-2.5">{item.expiryDate}</td>
                          <td className="p-2.5 text-right font-bold">{item.receivedQuantity}</td>
                          <td className="p-2.5 text-right font-mono">
                            {item.unitCostPrice.toFixed(2)}
                          </td>
                          <td className="p-2.5 text-right font-black text-slate-900">
                            {item.lineTotal.toFixed(2)}
                          </td>
                          <td className="p-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveLineItem(idx)}
                              className="text-slate-400 hover:text-red-600 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Invoice Attachment & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase">Procurement Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Temperature checks verified upon arrival, cold storage zone..."
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-200 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  Total GRN Valuation
                </span>
                <span className="text-2xl font-black text-orange-600">
                  LKR {totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <p className="text-[10px] text-slate-500 mt-1">
                  Synchronizes with batch assets and ledger accounts.
                </p>
              </div>
            </div>

            {formError && <p className="text-xs text-red-600 font-bold">{formError}</p>}
            {isSuccess && (
              <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> GRN Submitted &amp; Inventory Synchronized!
              </p>
            )}

            <button
              type="submit"
              disabled={lineItems.length === 0}
              className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors disabled:opacity-50"
            >
              Submit GRN &amp; Auto-Sync Batches to Inventory
            </button>
          </form>
        </div>
      ) : (
        /* GRN History Ledger */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3.5">GRN # &amp; Date</th>
                  <th className="p-3.5">Supplier</th>
                  <th className="p-3.5">Supplier Invoice #</th>
                  <th className="p-3.5 text-center">Batch Lines</th>
                  <th className="p-3.5 text-right">Total Cost (LKR)</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {grns.map((grn) => (
                  <tr key={grn.id} className="hover:bg-slate-50">
                    <td className="p-3.5">
                      <span className="font-mono font-bold text-slate-900">{grn.grnNumber}</span>
                      <span className="block text-[10px] text-slate-400">
                        {new Date(grn.receivedAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">{grn.supplierName}</td>
                    <td className="p-3.5 font-mono text-slate-600">{grn.supplierInvoiceNumber}</td>
                    <td className="p-3.5 text-center">
                      <span className="bg-slate-100 font-bold px-2 py-0.5 rounded-full">
                        {grn.lineItems.length} Items
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-black text-slate-900">
                      LKR {grn.totalCost.toLocaleString()}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedGRN(grn)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
                      >
                        Inspect Details →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GRN Detail Modal */}
      {selectedGRN && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider block">
                  Goods Received Note Record
                </span>
                <h3 className="text-lg font-black text-slate-900">{selectedGRN.grnNumber}</h3>
              </div>
              <button
                onClick={() => setSelectedGRN(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <p>Supplier: <strong>{selectedGRN.supplierName}</strong></p>
              <p>Supplier Invoice #: <strong className="font-mono">{selectedGRN.supplierInvoiceNumber}</strong></p>
              <p>Received At: {new Date(selectedGRN.receivedAt).toLocaleString()}</p>
              <p>Received By: {selectedGRN.receivedBy}</p>
              {selectedGRN.notes && <p className="italic text-slate-500">Note: {selectedGRN.notes}</p>}
            </div>

            {/* Line items */}
            <div className="space-y-1 text-xs">
              <span className="font-bold text-slate-700 uppercase text-[10px] block">
                Received Batches
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {selectedGRN.lineItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg border border-slate-200 bg-white flex justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{item.productName}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        Batch: {item.batchNumber} · Exp: {item.expiryDate}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900">
                        {item.receivedQuantity} units
                      </span>
                      <span className="block text-[10px] text-slate-500">
                        LKR {item.lineTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-900 text-white rounded-xl flex justify-between items-center text-xs">
              <span>Total Spend:</span>
              <span className="text-base font-black text-orange-400">
                LKR {selectedGRN.totalCost.toLocaleString()}
              </span>
            </div>

            <button
              onClick={() => setSelectedGRN(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

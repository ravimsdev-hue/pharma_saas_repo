"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { usePharmacy } from "@/context/PharmacyContext";
import { Product, Batch, StockAdjustment } from "@/types/pharmacy";
import {
  Boxes,
  Search,
  Plus,
  Download,
  AlertTriangle,
  ShieldAlert,
  CheckCircle,
  SlidersHorizontal,
  X,
  Clock,
  ArrowRight,
  TrendingUp,
  Truck,
  RotateCcw,
} from "lucide-react";

export default function InventoryPage() {
  const {
    products,
    batches,
    suppliers,
    sales,
    grns,
    addProduct,
    adjustStock,
    currentUser,
    settings,
  } = usePharmacy();

  // Search & Filters
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSupplier, setSelectedSupplier] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Low Stock" | "Expired" | "Expiring Soon">("All");

  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProductDetails, setSelectedProductDetails] = useState<Product | null>(null);

  // Form states for Add Product
  const [newProdName, setNewProdName] = useState("");
  const [newProdGeneric, setNewProdGeneric] = useState("");
  const [newProdBarcode, setNewProdBarcode] = useState("");
  const [newProdCategory, setNewProdCategory] = useState<Product["category"]>("Pain Relief");
  const [newProdUnit, setNewProdUnit] = useState<Product["unit"]>("Tablet");
  const [newProdSupplierId, setNewProdSupplierId] = useState("");
  const [newProdLowLimit, setNewProdLowLimit] = useState(20);
  const [newProdCost, setNewProdCost] = useState(10);
  const [newProdSell, setNewProdSell] = useState(18);
  const [newProdOpeningStock, setNewProdOpeningStock] = useState(50);
  const [newProdBatchNum, setNewProdBatchNum] = useState("");
  const [newProdExpiry, setNewProdExpiry] = useState("2026-12-31");

  React.useEffect(() => {
    const d = new Date(Date.now() + 180 * 24 * 3600 * 1000);
    setNewProdExpiry(d.toISOString().split("T")[0]);
  }, []);
  const [formError, setFormError] = useState("");

  // Form states for Stock Adjustment
  const [adjProductId, setAdjProductId] = useState("");
  const [adjBatchId, setAdjBatchId] = useState("");
  const [adjType, setAdjType] = useState<StockAdjustment["type"]>("remove_damaged");
  const [adjQty, setAdjQty] = useState(1);
  const [adjReason, setAdjReason] = useState("");
  const [adjError, setAdjError] = useState("");

  // Filtered Products
  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        (p.genericName && p.genericName.toLowerCase().includes(q));

      const matchCat = selectedCategory === "All" || p.category === selectedCategory;
      const matchSup = selectedSupplier === "All" || p.primarySupplierId === selectedSupplier;

      // Status check
      let matchStatus = true;
      if (statusFilter === "Low Stock") {
        matchStatus = p.totalStock <= p.lowStockLimit;
      } else if (statusFilter === "Expired") {
        const prodBatches = batches.filter((b) => b.productId === p.id);
        matchStatus = prodBatches.some((b) => b.status === "expired");
      } else if (statusFilter === "Expiring Soon") {
        const prodBatches = batches.filter((b) => b.productId === p.id);
        matchStatus = prodBatches.some((b) => b.status === "expiring_soon");
      }

      return matchQ && matchCat && matchSup && matchStatus;
    });
  }, [products, batches, query, selectedCategory, selectedSupplier, statusFilter]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      "Barcode",
      "Medicine Name",
      "Category",
      "Unit",
      "Total Stock",
      "Cost Price (LKR)",
      "Sell Price (LKR)",
      "Low Reorder Limit",
      "Supplier",
    ];

    const rows = filteredProducts.map((p) => [
      `"${p.barcode}"`,
      `"${p.name}"`,
      `"${p.category}"`,
      `"${p.unit}"`,
      p.totalStock,
      p.costPrice,
      p.sellPrice,
      p.lowStockLimit,
      `"${p.primarySupplierName || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Metro_Pharmacy_Stock_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Add Product Submit
  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!newProdName || !newProdBarcode || !newProdBatchNum || !newProdExpiry) {
      setFormError("Please fill out all required fields.");
      return;
    }

    const supplier = suppliers.find((s) => s.id === newProdSupplierId);

    await addProduct(
      {
        name: newProdName,
        genericName: newProdGeneric,
        barcode: newProdBarcode,
        category: newProdCategory,
        unit: newProdUnit,
        lowStockLimit: Number(newProdLowLimit),
        costPrice: Number(newProdCost),
        sellPrice: Number(newProdSell),
        primarySupplierId: newProdSupplierId,
        primarySupplierName: supplier?.name,
      },
      {
        batchNumber: newProdBatchNum,
        expiryDate: newProdExpiry,
        quantity: Number(newProdOpeningStock),
        costPrice: Number(newProdCost),
        sellPrice: Number(newProdSell),
      }
    );

    setIsAddModalOpen(false);
    // reset form
    setNewProdName("");
    setNewProdBarcode("");
    setNewProdBatchNum("");
  };

  // Stock Adjustment Submit
  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdjError("");

    if (!adjProductId || !adjBatchId || !adjReason) {
      setAdjError("All fields and audit reason notes are required.");
      return;
    }

    const prod = products.find((p) => p.id === adjProductId);
    const bat = batches.find((b) => b.id === adjBatchId);
    if (!prod || !bat) {
      setAdjError("Product or Batch record not found.");
      return;
    }

    await adjustStock({
      productId: prod.id,
      productName: prod.name,
      batchId: bat.id,
      batchNumber: bat.batchNumber,
      type: adjType,
      quantity: Number(adjQty),
      previousQuantity: bat.quantity,
      newQuantity: 0, // context computes
      reason: adjReason,
    });

    setIsAdjustModalOpen(false);
    setAdjReason("");
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
            Batch-Level Inventory Control
          </span>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Products &amp; Stock Catalogue
          </h1>
          <p className="text-xs text-slate-500">
            Real-time multi-batch tracking, expiry locking, reorder levels, and audit logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {currentUser.permissions.actions.allowStockAdjustment && (
            <button
              onClick={() => {
                if (products[0]) {
                  setAdjProductId(products[0].id);
                  const b = batches.find((x) => x.productId === products[0].id);
                  if (b) setAdjBatchId(b.id);
                }
                setIsAdjustModalOpen(true);
              }}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Stock Adjustment</span>
            </button>
          )}

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-600/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Product</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* Search */}
        <div className="sm:col-span-5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search medicine name, barcode, or generic..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Category */}
        <div className="sm:col-span-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="All">All Categories</option>
            <option value="Pain Relief">Pain Relief</option>
            <option value="Antibiotics">Antibiotics</option>
            <option value="Vitamins">Vitamins</option>
            <option value="Respiratory">Respiratory</option>
            <option value="Stomach Care">Stomach Care</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="sm:col-span-4 flex items-center gap-1 overflow-x-auto text-xs font-bold">
          {(["All", "Low Stock", "Expired", "Expiring Soon"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? "bg-slate-900 text-white font-bold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <th className="p-3.5">Medicine &amp; Barcode</th>
                <th className="p-3.5">Category &amp; Unit</th>
                <th className="p-3.5 text-right">Cost (LKR)</th>
                <th className="p-3.5 text-right">Sell (LKR)</th>
                <th className="p-3.5 text-center">Sellable Stock</th>
                <th className="p-3.5 text-center">Batch Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const prodBatches = batches.filter((b) => b.productId === p.id);
                const hasExpired = prodBatches.some((b) => b.status === "expired");
                const hasSoon = prodBatches.some((b) => b.status === "expiring_soon");
                const isLow = p.totalStock <= p.lowStockLimit;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-3.5">
                      <div className="font-extrabold text-slate-900 group-hover:text-orange-600 transition-colors">
                        {p.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {p.barcode} {p.genericName && `· ${p.genericName}`}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className="font-bold text-slate-700">{p.category}</span>
                      <span className="block text-[10px] text-slate-400">{p.unit}</span>
                    </td>

                    <td className="p-3.5 text-right font-mono font-medium text-slate-600">
                      {p.costPrice.toFixed(2)}
                    </td>

                    <td className="p-3.5 text-right font-mono font-black text-slate-900">
                      {p.sellPrice.toFixed(2)}
                    </td>

                    <td className="p-3.5 text-center">
                      <span
                        className={`font-black text-xs px-2 py-0.5 rounded-full ${
                          isLow
                            ? "bg-red-100 text-red-800"
                            : p.totalStock > p.lowStockLimit * 2
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {p.totalStock} {p.unit}s
                      </span>
                      <span className="block text-[9px] text-slate-400 mt-0.5">
                        Min limit: {p.lowStockLimit}
                      </span>
                    </td>

                    <td className="p-3.5 text-center">
                      {hasExpired ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-600 text-white inline-flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" /> Expired Batch Blocked
                        </span>
                      ) : hasSoon ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500 text-white inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Expiring Soon
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                          Healthy ({prodBatches.length} batches)
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedProductDetails(p)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                      >
                        Batches &amp; Logs →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Intelligence & Batch History Side Panel */}
      {selectedProductDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider block">
                    Product Intelligence &amp; Batches
                  </span>
                  <h3 className="text-xl font-black text-slate-900">
                    {selectedProductDetails.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Barcode: {selectedProductDetails.barcode} · {selectedProductDetails.category}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedProductDetails(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Batches Table for this Product */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  Active &amp; Historical Batches
                </span>
                <div className="space-y-2">
                  {batches
                    .filter((b) => b.productId === selectedProductDetails.id)
                    .map((batch) => (
                      <div
                        key={batch.id}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-black text-slate-900">
                            {batch.batchNumber}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              batch.status === "expired"
                                ? "bg-red-600 text-white"
                                : batch.status === "expiring_soon"
                                ? "bg-amber-500 text-white"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {batch.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-500 text-[11px]">
                          <span>Expiry: {batch.expiryDate}</span>
                          <span>Quantity: <strong>{batch.quantity} units</strong></span>
                        </div>
                        <div className="flex justify-between text-slate-600 text-[11px] pt-1 border-t border-slate-200">
                          <span>Cost: LKR {batch.costPrice}</span>
                          <span className="font-bold text-orange-600">
                            Sell: LKR {batch.sellPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Active Selling Hours Chart Simulation */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  Most Active Dispensing Hours
                </span>
                <p className="text-[11px] text-slate-500">
                  Peak transaction distribution for this medication.
                </p>
                <div className="h-20 flex items-end justify-between gap-1 pt-4">
                  {[
                    { h: "8am", v: 20 },
                    { h: "10am", v: 75 },
                    { h: "12pm", v: 45 },
                    { h: "2pm", v: 30 },
                    { h: "4pm", v: 85 },
                    { h: "6pm", v: 95 },
                    { h: "8pm", v: 60 },
                  ].map((hour) => (
                    <div key={hour.h} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <div
                        style={{ height: `${hour.v}%` }}
                        className="w-full bg-orange-500 rounded-t-xs"
                      />
                      <span className="text-[9px] text-slate-400 font-bold">{hour.h}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedProductDetails(null)}
              className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold mt-4"
            >
              Close Intelligence Panel
            </button>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-black text-slate-900 text-lg">+ Register New Product &amp; Batch</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProductSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase">Medicine Name *</label>
                  <input
                    type="text"
                    required
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    placeholder="e.g. Ciprofloxacin 500mg"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase">Generic Formula</label>
                  <input
                    type="text"
                    value={newProdGeneric}
                    onChange={(e) => setNewProdGeneric(e.target.value)}
                    placeholder="e.g. Ciprofloxacin HCl"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase">Barcode *</label>
                  <input
                    type="text"
                    required
                    value={newProdBarcode}
                    onChange={(e) => setNewProdBarcode(e.target.value)}
                    placeholder="890123..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase">Category</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value as Product["category"])}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                  >
                    <option value="Pain Relief">Pain Relief</option>
                    <option value="Antibiotics">Antibiotics</option>
                    <option value="Vitamins">Vitamins</option>
                    <option value="Respiratory">Respiratory</option>
                    <option value="Stomach Care">Stomach Care</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase">Unit Type</label>
                  <select
                    value={newProdUnit}
                    onChange={(e) => setNewProdUnit(e.target.value as Product["unit"])}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Bottle">Bottle</option>
                    <option value="Sachet">Sachet</option>
                    <option value="Inhaler">Inhaler</option>
                    <option value="Tube">Tube</option>
                    <option value="Strip">Strip</option>
                  </select>
                </div>
              </div>

              {/* Initial Batch Information */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="font-extrabold text-slate-800 uppercase tracking-wider block text-[10px]">
                  Opening Stock &amp; Initial Batch
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Batch Number *</label>
                    <input
                      type="text"
                      required
                      value={newProdBatchNum}
                      onChange={(e) => setNewProdBatchNum(e.target.value)}
                      placeholder="BAT-26-01"
                      className="w-full p-2 rounded-lg border border-slate-300 font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Expiry Date *</label>
                    <input
                      type="date"
                      required
                      value={newProdExpiry}
                      onChange={(e) => setNewProdExpiry(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Opening Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={newProdOpeningStock}
                      onChange={(e) => setNewProdOpeningStock(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-slate-300 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Cost Price (LKR)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProdCost}
                      onChange={(e) => setNewProdCost(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-slate-300 font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Selling Price (LKR)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProdSell}
                      onChange={(e) => setNewProdSell(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-slate-300 font-bold text-orange-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Low Stock Limit</label>
                    <input
                      type="number"
                      min="1"
                      value={newProdLowLimit}
                      onChange={(e) => setNewProdLowLimit(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-slate-300 font-bold"
                    />
                  </div>
                </div>
              </div>

              {formError && <p className="text-xs text-red-600 font-bold">{formError}</p>}

              <button
                type="submit"
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors"
              >
                Save Medicine to Catalogue
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-black text-slate-900 text-base">Manual Stock Adjustment</h3>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase">Product</label>
                <select
                  value={adjProductId}
                  onChange={(e) => {
                    setAdjProductId(e.target.value);
                    const b = batches.find((x) => x.productId === e.target.value);
                    if (b) setAdjBatchId(b.id);
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase">Batch</label>
                <select
                  value={adjBatchId}
                  onChange={(e) => setAdjBatchId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                >
                  {batches
                    .filter((b) => b.productId === adjProductId)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.batchNumber} (Current: {b.quantity} units, Exp: {b.expiryDate})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase">Adjustment Type</label>
                  <select
                    value={adjType}
                    onChange={(e) => setAdjType(e.target.value as StockAdjustment["type"])}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                  >
                    <option value="add">Add Stock (+)</option>
                    <option value="remove_damaged">Damage Write-off (-)</option>
                    <option value="expiry_writeoff">Expiry Write-off (-)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={adjQty}
                    onChange={(e) => setAdjQty(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase">
                  Audit Reason Notes (Mandatory for Compliance) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="Explain why stock is being modified (e.g. damaged blister pack during transit)..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              {adjError && <p className="text-xs text-red-600 font-bold">{adjError}</p>}

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-md transition-colors"
              >
                Confirm Stock Adjustment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

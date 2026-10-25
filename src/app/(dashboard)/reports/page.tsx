"use client";

import React, { useState, useMemo } from "react";
import { usePharmacy } from "@/context/PharmacyContext";
import {
  BarChart3,
  Printer,
  Download,
  Calendar,
  Filter,
  DollarSign,
  TrendingUp,
  Boxes,
  ShieldAlert,
  Users,
  Building2,
  FileSpreadsheet,
} from "lucide-react";

type ReportType =
  | "sales_summary"
  | "product_sales"
  | "cashier_performance"
  | "payment_breakdown"
  | "stock_valuation"
  | "expiry_low_stock"
  | "supplier_purchases"
  | "credit_outstanding"
  | "returns_exchanges";

export default function SmartReportsPage() {
  const {
    sales,
    products,
    batches,
    suppliers,
    creditCustomers,
    returns,
    grns,
    settings,
  } = usePharmacy();

  const [selectedReport, setSelectedReport] = useState<ReportType>("sales_summary");
  const [fromDate, setFromDate] = useState("2026-01-01");
  const [toDate, setToDate] = useState("2026-12-31");
  const [filterCashier, setFilterCashier] = useState("All");

  React.useEffect(() => {
    setToDate(new Date().toISOString().split("T")[0]);
  }, []);

  // Filtered sales by date and cashier
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const d = s.createdAt.split("T")[0];
      const matchDate = d >= fromDate && d <= toDate;
      const matchCashier = filterCashier === "All" || s.cashierName === filterCashier;
      return matchDate && matchCashier;
    });
  }, [sales, fromDate, toDate, filterCashier]);

  // Unique cashiers
  const cashiersList = useMemo(() => {
    const set = new Set<string>();
    sales.forEach((s) => set.add(s.cashierName));
    return Array.from(set);
  }, [sales]);

  // Export CSV generator based on selected report view
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    const filename = `Metro_Pharmacy_Report_${selectedReport}_${toDate}.csv`;

    if (selectedReport === "sales_summary") {
      headers = ["Invoice #", "Date", "Customer", "Cashier", "Payment", "Net Total", "Gross Profit"];
      rows = filteredSales.map((s) => [
        s.invoiceNumber,
        s.createdAt.split("T")[0],
        s.customerName,
        s.cashierName,
        s.paymentMethod,
        s.netTotal,
        s.grossProfit,
      ]);
    } else if (selectedReport === "stock_valuation") {
      headers = ["Product", "Batch", "Expiry", "Stock Qty", "Cost Price", "Sell Price", "Cost Value", "Projected Retail"];
      rows = batches.map((b) => [
        b.productName,
        b.batchNumber,
        b.expiryDate,
        b.quantity,
        b.costPrice,
        b.sellPrice,
        b.costPrice * b.quantity,
        b.sellPrice * b.quantity,
      ]);
    } else if (selectedReport === "credit_outstanding") {
      headers = ["Customer", "NIC", "Phone", "Credit Limit", "Outstanding Balance", "Utilization %"];
      rows = creditCustomers.map((c) => [
        c.name,
        c.nic,
        c.phone,
        c.creditLimit,
        c.outstandingBalance,
        ((c.outstandingBalance / (c.creditLimit || 1)) * 100).toFixed(1),
      ]);
    } else {
      headers = ["Record ID", "Name / Reference", "Value (LKR)", "Date"];
      rows = filteredSales.map((s) => [s.invoiceNumber, s.customerName, s.netTotal, s.createdAt.split("T")[0]]);
    }

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reportTabs = [
    { id: "sales_summary", label: "1. Sales Summary" },
    { id: "product_sales", label: "2. Product Sales" },
    { id: "cashier_performance", label: "3. Cashier Performance" },
    { id: "payment_breakdown", label: "4. Payment Breakdown" },
    { id: "stock_valuation", label: "5. Stock Valuation" },
    { id: "expiry_low_stock", label: "6. Expiry & Low Stock" },
    { id: "supplier_purchases", label: "7. Supplier Purchases" },
    { id: "credit_outstanding", label: "8. Credit Outstanding" },
    { id: "returns_exchanges", label: "9. Returns & Exchanges" },
  ];

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
            Auditing &amp; Financial Intelligence
          </span>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Smart Reports Engine (9 Specialized Views)
          </h1>
          <p className="text-xs text-slate-500">
            Exportable audit statements for sales, inventory valuations, cashier metrics, and risk analysis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Unified Filter Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Cashier:</span>
            <select
              value={filterCashier}
              onChange={(e) => setFilterCashier(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
            >
              <option value="All">All Cashiers</option>
              {cashiersList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-slate-400 font-normal">
          Generated for: <strong className="text-slate-700">{settings.pharmacyName}</strong>
        </span>
      </div>

      {/* 9 Report Navigation Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
        {reportTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedReport(tab.id as ReportType)}
            className={`px-3 py-2 rounded-xl whitespace-nowrap transition-colors border ${
              selectedReport === tab.id
                ? "bg-orange-600 text-white border-orange-600 shadow-xs"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report View Body */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 overflow-hidden">
        {/* VIEW 1: Sales Summary */}
        {selectedReport === "sales_summary" && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border">
                <span className="text-slate-400 uppercase text-[10px] font-bold block">
                  Completed Bills
                </span>
                <span className="text-xl font-black text-slate-900">{filteredSales.length}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border">
                <span className="text-slate-400 uppercase text-[10px] font-bold block">
                  Gross Revenue
                </span>
                <span className="text-xl font-black text-slate-900">
                  LKR {filteredSales.reduce((a, s) => a + s.subtotal, 0).toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border">
                <span className="text-slate-400 uppercase text-[10px] font-bold block">
                  Total Discounts
                </span>
                <span className="text-xl font-black text-emerald-700">
                  -LKR {filteredSales.reduce((a, s) => a + s.discountAmount, 0).toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-orange-50 rounded-xl border border-orange-200">
                <span className="text-orange-700 uppercase text-[10px] font-bold block">
                  Net Gross Profit
                </span>
                <span className="text-xl font-black text-orange-600">
                  LKR {filteredSales.reduce((a, s) => a + s.grossProfit, 0).toLocaleString()}
                </span>
              </div>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b">
                <tr>
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Cashier</th>
                  <th className="p-3 text-right">Net Total (LKR)</th>
                  <th className="p-3 text-right">Profit (LKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map((s) => (
                  <tr key={s.id}>
                    <td className="p-3 font-mono font-bold">{s.invoiceNumber}</td>
                    <td className="p-3">{s.customerName}</td>
                    <td className="p-3">{s.cashierName}</td>
                    <td className="p-3 text-right font-black">{s.netTotal.toLocaleString()}</td>
                    <td className="p-3 text-right font-bold text-emerald-700">
                      {s.grossProfit.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW 2: Product Sales */}
        {selectedReport === "product_sales" && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900">Medicine Dispensing Volume</h3>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b">
                <tr>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-center">Units Sold</th>
                  <th className="p-3 text-right">Revenue (LKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => {
                  let units = 0;
                  let rev = 0;
                  filteredSales.forEach((s) => {
                    s.items.forEach((item) => {
                      if (item.product.id === p.id) {
                        units += item.quantity;
                        rev += item.lineTotal;
                      }
                    });
                  });
                  return (
                    <tr key={p.id}>
                      <td className="p-3 font-bold text-slate-900">{p.name}</td>
                      <td className="p-3">{p.category}</td>
                      <td className="p-3 text-center font-black">{units} {p.unit}s</td>
                      <td className="p-3 text-right font-black">LKR {rev.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW 3: Cashier Performance */}
        {selectedReport === "cashier_performance" && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900">Cashier Throughput &amp; Average Bill</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {cashiersList.map((cashier) => {
                const cSales = filteredSales.filter((s) => s.cashierName === cashier);
                const total = cSales.reduce((a, s) => a + s.netTotal, 0);
                const avg = total / (cSales.length || 1);

                return (
                  <div key={cashier} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                    <h4 className="font-extrabold text-slate-900 text-sm">{cashier}</h4>
                    <p className="text-xs text-slate-500">Bills Completed: <strong>{cSales.length}</strong></p>
                    <p className="text-xs text-slate-500">Total Sales: <strong>LKR {total.toLocaleString()}</strong></p>
                    <p className="text-xs text-emerald-700 font-bold">Average Bill Value: LKR {avg.toFixed(2)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 4: Payment Breakdown */}
        {selectedReport === "payment_breakdown" && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900">Financial Tender Reconciliation</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {["Cash", "Card", "Credit", "Bank Transfer", "QR Payment", "Split Payment"].map((m) => {
                const total = filteredSales
                  .filter((s) => s.paymentMethod === m)
                  .reduce((a, s) => a + s.netTotal, 0);
                return (
                  <div key={m} className="p-4 rounded-2xl border bg-slate-50">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{m}</span>
                    <p className="text-lg font-black text-slate-900 mt-1">
                      LKR {total.toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 5: Stock Valuation */}
        {selectedReport === "stock_valuation" && (
          <div className="space-y-4">
            <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 flex justify-between items-center text-xs">
              <div>
                <span className="text-purple-700 uppercase font-bold text-[10px] block">
                  Total Valuation Comparison
                </span>
                <p className="text-xl font-black text-purple-900">
                  Cost: LKR {batches.reduce((a, b) => a + b.costPrice * b.quantity, 0).toLocaleString()}
                </p>
              </div>
              <p className="text-lg font-black text-slate-800">
                Projected Retail: LKR{" "}
                {batches.reduce((a, b) => a + b.sellPrice * b.quantity, 0).toLocaleString()}
              </p>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3">Batch</th>
                  <th className="p-3">Expiry</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Cost Value (LKR)</th>
                  <th className="p-3 text-right">Retail Value (LKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map((b) => (
                  <tr key={b.id}>
                    <td className="p-3 font-bold">{b.productName}</td>
                    <td className="p-3 font-mono">{b.batchNumber}</td>
                    <td className="p-3">{b.expiryDate}</td>
                    <td className="p-3 text-center font-bold">{b.quantity}</td>
                    <td className="p-3 text-right font-mono">
                      {(b.costPrice * b.quantity).toFixed(2)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold">
                      {(b.sellPrice * b.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW 6: Expiry & Low Stock */}
        {selectedReport === "expiry_low_stock" && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-sm text-red-600">Inventory Expiry &amp; Reorder Risk Analysis</h3>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b">
                <tr>
                  <th className="p-3">Medicine</th>
                  <th className="p-3">Batch</th>
                  <th className="p-3">Expiry Date</th>
                  <th className="p-3 text-center">Remaining Stock</th>
                  <th className="p-3 text-center">Risk Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches
                  .filter((b) => b.status === "expired" || b.status === "expiring_soon")
                  .map((b) => (
                    <tr key={b.id}>
                      <td className="p-3 font-bold">{b.productName}</td>
                      <td className="p-3 font-mono">{b.batchNumber}</td>
                      <td className="p-3 font-bold">{b.expiryDate}</td>
                      <td className="p-3 text-center">{b.quantity} units</td>
                      <td className="p-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            b.status === "expired"
                              ? "bg-red-600 text-white"
                              : "bg-amber-500 text-white"
                          }`}
                        >
                          {b.status === "expired" ? "BLOCKED AT POS" : "EXPIRING IN 20 DAYS"}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW 7: Supplier Purchases */}
        {selectedReport === "supplier_purchases" && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900">Procurement &amp; Distributor Summary</h3>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b">
                <tr>
                  <th className="p-3">Supplier Name</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3 text-center">Total GRNs</th>
                  <th className="p-3 text-right">Cumulative Spend (LKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suppliers.map((sup) => (
                  <tr key={sup.id}>
                    <td className="p-3 font-bold">{sup.name}</td>
                    <td className="p-3">{sup.contactPerson}</td>
                    <td className="p-3 text-center font-bold">{sup.totalGRNs || 0}</td>
                    <td className="p-3 text-right font-black">
                      LKR {(sup.totalSpend || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW 8: Credit Outstanding */}
        {selectedReport === "credit_outstanding" && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-sm text-purple-900">Accounts Receivable Aging Report</h3>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b">
                <tr>
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">NIC</th>
                  <th className="p-3 text-right">Credit Limit</th>
                  <th className="p-3 text-right">Outstanding Debt</th>
                  <th className="p-3 text-center">Utilization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {creditCustomers.map((c) => (
                  <tr key={c.id}>
                    <td className="p-3 font-bold">{c.name}</td>
                    <td className="p-3 font-mono">{c.nic}</td>
                    <td className="p-3 text-right">LKR {c.creditLimit.toLocaleString()}</td>
                    <td className="p-3 text-right font-black text-purple-900">
                      LKR {c.outstandingBalance.toLocaleString()}
                    </td>
                    <td className="p-3 text-center font-bold">
                      {((c.outstandingBalance / (c.creditLimit || 1)) * 100).toFixed(0)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW 9: Returns & Exchanges */}
        {selectedReport === "returns_exchanges" && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-sm text-red-700">Audit of Returned Goods &amp; Doctor Directions</h3>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b">
                <tr>
                  <th className="p-3">Return #</th>
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Audit Reason</th>
                  <th className="p-3 text-right">Refund Amount (LKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {returns.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400">
                      No returned goods on record for selected period.
                    </td>
                  </tr>
                ) : (
                  returns.map((r) => (
                    <tr key={r.id}>
                      <td className="p-3 font-mono font-bold">{r.returnNumber}</td>
                      <td className="p-3 font-mono">{r.invoiceNumber}</td>
                      <td className="p-3">{r.customerName}</td>
                      <td className="p-3 italic">{r.reason}</td>
                      <td className="p-3 text-right font-black text-red-600">
                        LKR {r.totalRefundAmount.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

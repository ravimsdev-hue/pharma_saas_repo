"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { usePharmacy } from "@/context/PharmacyContext";
import { SaleInvoice } from "@/types/pharmacy";
import {
  Receipt,
  Search,
  Download,
  Printer,
  RotateCcw,
  Eye,
  CheckCircle,
  X,
  Calendar,
  AlertTriangle,
} from "lucide-react";

export default function SalesHistoryPage() {
  const { sales, currentUser, settings, processReturn } = usePharmacy();

  // Search & Filters
  const [query, setQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("All");

  // Modals
  const [selectedInvoice, setSelectedInvoice] = useState<SaleInvoice | null>(null);
  const [returnInvoice, setReturnInvoice] = useState<SaleInvoice | null>(null);

  // Return modal form states
  const [returnType, setReturnType] = useState<"refund" | "exchange">("refund");
  const [returnReason, setReturnReason] = useState("");
  const [refundMethod, setRefundMethod] = useState<"Cash" | "Credit Adjustment" | "Original Payment">("Cash");
  const [returnItemQty, setReturnItemQty] = useState<Record<string, number>>({});
  const [returnSuccess, setReturnSuccess] = useState(false);

  // Filtered sales
  const filteredSales = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sales.filter((s) => {
      const matchQ =
        !q ||
        s.invoiceNumber.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q) ||
        s.cashierName.toLowerCase().includes(q);

      const matchPay = paymentFilter === "All" || s.paymentMethod === paymentFilter;
      return matchQ && matchPay;
    });
  }, [sales, query, paymentFilter]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      "Invoice Number",
      "Date",
      "Customer",
      "Cashier",
      "Payment Method",
      "Subtotal",
      "Discount",
      "Net Total (LKR)",
      "Gross Profit (LKR)",
      "Status",
    ];

    const rows = filteredSales.map((s) => [
      `"${s.invoiceNumber}"`,
      `"${new Date(s.createdAt).toLocaleString()}"`,
      `"${s.customerName}"`,
      `"${s.cashierName}"`,
      `"${s.paymentMethod}"`,
      s.subtotal,
      s.discountAmount,
      s.netTotal,
      s.grossProfit,
      s.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Metro_Pharmacy_Sales_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submit Return
  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnInvoice) return;

    const itemsToReturn = returnInvoice.items
      .map((item) => {
        const qty = returnItemQty[item.cartItemId] || 0;
        if (qty <= 0) return null;
        return {
          productId: item.product.id,
          productName: item.product.name,
          batchId: item.batch.id,
          batchNumber: item.batch.batchNumber,
          returnedQuantity: qty,
          unitPrice: item.unitPrice,
          refundAmount: qty * item.unitPrice,
        };
      })
      .filter(Boolean) as {
        productId: string;
        productName: string;
        batchId: string;
        batchNumber: string;
        returnedQuantity: number;
        unitPrice: number;
        refundAmount: number;
      }[];

    if (itemsToReturn.length === 0) {
      alert("Please enter return quantity > 0 for at least one item.");
      return;
    }

    const totalRefund = itemsToReturn.reduce((a, b) => a + b.refundAmount, 0);

    await processReturn({
      invoiceId: returnInvoice.id,
      invoiceNumber: returnInvoice.invoiceNumber,
      cashierId: currentUser.id,
      cashierName: currentUser.displayName,
      customerName: returnInvoice.customerName,
      type: returnType,
      items: itemsToReturn,
      totalRefundAmount: totalRefund,
      reason: returnReason,
      refundMethod,
    });

    setReturnSuccess(true);
    setTimeout(() => {
      setReturnSuccess(false);
      setReturnInvoice(null);
    }, 1500);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
            Transaction Ledger
          </span>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Sales History, Returns &amp; Exchanges
          </h1>
          <p className="text-xs text-slate-500">
            Searchable sales receipts, itemized audit trails, and returns workflow.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Sales CSV</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by invoice #, customer name, or cashier..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="w-full sm:w-48 py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700"
        >
          <option value="All">All Payment Types</option>
          <option value="Cash">Cash</option>
          <option value="Card">Card</option>
          <option value="Credit">Credit</option>
          <option value="Bank Transfer">Bank Transfer</option>
          <option value="QR Payment">QR Payment</option>
          <option value="Split Payment">Split Payment</option>
        </select>
      </div>

      {/* Sales Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="p-3.5">Invoice # &amp; Date</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Cashier</th>
                <th className="p-3.5 text-center">Payment Method</th>
                <th className="p-3.5 text-right">Net Amount</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5">
                    <span className="font-mono font-black text-slate-900 block">
                      {sale.invoiceNumber}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(sale.createdAt).toLocaleString()}
                    </span>
                  </td>

                  <td className="p-3.5">
                    <span className="font-bold text-slate-800">{sale.customerName}</span>
                    {sale.onlinePrescriptionId && (
                      <span className="block text-[10px] text-orange-600 font-semibold">
                        ★ Online Prescription
                      </span>
                    )}
                  </td>

                  <td className="p-3.5 font-medium text-slate-600">{sale.cashierName}</td>

                  <td className="p-3.5 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        sale.paymentMethod === "Cash"
                          ? "bg-emerald-100 text-emerald-800"
                          : sale.paymentMethod === "Card"
                          ? "bg-blue-100 text-blue-800"
                          : sale.paymentMethod === "Credit"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {sale.paymentMethod}
                    </span>
                  </td>

                  <td className="p-3.5 text-right font-black text-slate-900 text-sm">
                    LKR {sale.netTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>

                  <td className="p-3.5 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        sale.status === "completed"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {sale.status.toUpperCase()}
                    </span>
                  </td>

                  <td className="p-3.5 text-right space-x-1">
                    <button
                      onClick={() => setSelectedInvoice(sale)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px]"
                    >
                      Inspect
                    </button>

                    {currentUser.permissions.actions.allowRefunds &&
                      sale.status === "completed" && (
                        <button
                          onClick={() => {
                            setReturnInvoice(sale);
                            const initialQty: Record<string, number> = {};
                            sale.items.forEach((i) => {
                              initialQty[i.cartItemId] = 0;
                            });
                            setReturnItemQty(initialQty);
                          }}
                          className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg text-[11px]"
                        >
                          Return / Refund
                        </button>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail & Thermal Reprint Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase">
                Invoice Breakdown
              </span>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Preview */}
            <div
              id="thermal-receipt-print-area"
              className="bg-white border border-slate-300 rounded-xl p-4 font-mono text-[11px] text-slate-900 space-y-3"
            >
              <div className="text-center space-y-0.5 border-b border-dashed pb-2">
                <h2 className="text-sm font-black uppercase">{settings.pharmacyName}</h2>
                <p className="text-[10px] text-slate-600">{settings.address}</p>
                <p className="text-[10px] text-slate-600">Hotline: {settings.phone}</p>
              </div>

              <div className="space-y-0.5 text-[10px] border-b border-dashed pb-2">
                <div className="flex justify-between">
                  <span>Invoice:</span>
                  <strong>{selectedInvoice.invoiceNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{new Date(selectedInvoice.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cashier:</span>
                  <span>{selectedInvoice.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span>{selectedInvoice.customerName}</span>
                </div>
              </div>

              <div className="space-y-1 border-b border-dashed pb-2">
                {selectedInvoice.items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between font-bold">
                      <span className="truncate max-w-[170px]">{item.product.name}</span>
                      <span>{item.lineTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-500">
                      <span>
                        {item.quantity} x {item.unitPrice.toFixed(2)} [{item.batch.batchNumber}]
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-0.5 text-xs font-bold pt-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>LKR {selectedInvoice.subtotal.toFixed(2)}</span>
                </div>
                {selectedInvoice.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span>-LKR {selectedInvoice.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black pt-1 border-t">
                  <span>NET TOTAL:</span>
                  <span>LKR {selectedInvoice.netTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-600 pt-1">
                  <span>Method:</span>
                  <span>{selectedInvoice.paymentMethod}</span>
                </div>
              </div>

              <div className="text-center text-[9px] text-slate-500 pt-2 border-t border-dashed">
                <p>{settings.receiptFooter}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Reprint Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Returns & Exchanges Workflow Modal */}
      {returnInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">
                  Returns &amp; Exchanges Workflow
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Return Invoice {returnInvoice.invoiceNumber}
                </h3>
              </div>
              <button
                onClick={() => setReturnInvoice(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReturn} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase">Process Type</label>
                  <select
                    value={returnType}
                    onChange={(e) => setReturnType(e.target.value as "refund" | "exchange")}
                    className="w-full p-2 rounded-lg border border-slate-300 font-bold"
                  >
                    <option value="refund">Refund Money</option>
                    <option value="exchange">Product Exchange</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase">Refund Tender</label>
                  <select
                    value={refundMethod}
                    onChange={(e) =>
                      setRefundMethod(e.target.value as "Cash" | "Credit Adjustment" | "Original Payment")
                    }
                    className="w-full p-2 rounded-lg border border-slate-300 font-bold"
                  >
                    <option value="Cash">Cash Refund</option>
                    <option value="Credit Adjustment">Credit Ledger Adjustment</option>
                    <option value="Original Payment">Original Payment Method</option>
                  </select>
                </div>
              </div>

              {/* Items to Return */}
              <div className="space-y-2">
                <span className="font-bold text-slate-700 uppercase text-[10px] block">
                  Select Items &amp; Enter Returned Quantities
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {returnInvoice.items.map((item) => (
                    <div
                      key={item.cartItemId}
                      className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{item.product.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          Batch: {item.batch.batchNumber} · Sold Qty: {item.quantity} units
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <label className="text-[10px] text-slate-500">Return Qty:</label>
                        <input
                          type="number"
                          min="0"
                          max={item.quantity}
                          value={returnItemQty[item.cartItemId] || 0}
                          onChange={(e) => {
                            const val = Math.min(item.quantity, Math.max(0, Number(e.target.value)));
                            setReturnItemQty((prev) => ({
                              ...prev,
                              [item.cartItemId]: val,
                            }));
                          }}
                          className="w-14 p-1 text-center font-bold bg-white border border-slate-300 rounded"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mandatory Reason */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase">
                  Mandatory Return Reason / Doctor Direction Note *
                </label>
                <textarea
                  required
                  rows={2}
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="e.g. Doctor altered prescription from Amoxicillin to Azithromycin..."
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              {returnSuccess && (
                <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Return Processed &amp; Stock Reconciled!
                </p>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors"
              >
                Confirm Return &amp; Reconcile Inventory
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

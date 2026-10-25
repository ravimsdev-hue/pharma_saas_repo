"use client";

import React, { useState, useMemo } from "react";
import { usePharmacy } from "@/context/PharmacyContext";
import { CreditCustomer, CreditLedgerEntry } from "@/types/pharmacy";
import {
  Users,
  Search,
  Plus,
  CreditCard,
  DollarSign,
  AlertTriangle,
  Receipt,
  CheckCircle,
  X,
  ArrowDownRight,
  ArrowUpRight,
  History,
} from "lucide-react";

export default function CreditCustomersPage() {
  const {
    creditCustomers,
    creditLedgers,
    receiveCreditPayment,
    addCreditCustomer,
  } = usePharmacy();

  const [query, setQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CreditCustomer | null>(null);
  const [paymentCustomer, setPaymentCustomer] = useState<CreditCustomer | null>(null);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

  // Receive Payment Form states
  const [paymentAmount, setPaymentAmount] = useState<number>(1000);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Add Customer Form states
  const [newName, setNewName] = useState("");
  const [newNic, setNewNic] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newLimit, setNewLimit] = useState(50000);
  const [newNotes, setNewNotes] = useState("");

  const filteredCustomers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return creditCustomers.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.nic.toLowerCase().includes(q) ||
        c.phone.includes(q)
    );
  }, [creditCustomers, query]);

  // Handle Receive Payment
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentCustomer || paymentAmount <= 0) return;

    await receiveCreditPayment(
      paymentCustomer.id,
      paymentAmount,
      paymentMethod,
      paymentNotes
    );

    setPaymentSuccess(true);
    setTimeout(() => {
      setPaymentSuccess(false);
      setPaymentCustomer(null);
    }, 1500);
  };

  // Handle Add Customer
  const handleAddCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newNic || !newPhone) return;

    await addCreditCustomer({
      name: newName,
      nic: newNic,
      phone: newPhone,
      address: newAddress,
      creditLimit: Number(newLimit),
      notes: newNotes,
    });

    setIsAddCustomerOpen(false);
    setNewName("");
    setNewNic("");
    setNewPhone("");
    setNewAddress("");
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
            Financial Ledger &amp; Receivables
          </span>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Credit Customers &amp; Ledgers
          </h1>
          <p className="text-xs text-slate-500">
            Credit limits, outstanding balances, double-entry statement history, and payment collection.
          </p>
        </div>

        <button
          onClick={() => setIsAddCustomerOpen(true)}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-600/20 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>+ Register Credit Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by customer name, National Identity Card (NIC), or contact number..."
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="p-3.5">Customer &amp; NIC</th>
                <th className="p-3.5">Contact Details</th>
                <th className="p-3.5 text-right">Credit Limit</th>
                <th className="p-3.5 text-right">Outstanding Balance</th>
                <th className="p-3.5 text-center">Credit Health Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((cust) => {
                const percentUsed = (cust.outstandingBalance / (cust.creditLimit || 1)) * 100;
                const isOverdue = percentUsed >= 90;
                const isWarning = percentUsed >= 70;

                return (
                  <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <p className="font-extrabold text-slate-900">{cust.name}</p>
                      <p className="text-[10px] font-mono text-slate-400">NIC: {cust.nic}</p>
                    </td>

                    <td className="p-3.5">
                      <p className="font-medium text-slate-700">{cust.phone}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-xs">{cust.address}</p>
                    </td>

                    <td className="p-3.5 text-right font-bold text-slate-800">
                      LKR {cust.creditLimit.toLocaleString()}
                    </td>

                    <td className="p-3.5 text-right font-black text-slate-900 text-sm">
                      LKR {cust.outstandingBalance.toLocaleString()}
                    </td>

                    <td className="p-3.5 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isOverdue
                            ? "bg-red-100 text-red-800"
                            : isWarning
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {percentUsed.toFixed(0)}% Utilized
                      </span>
                    </td>

                    <td className="p-3.5 text-right space-x-1">
                      <button
                        onClick={() => setSelectedCustomer(cust)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
                      >
                        Statement Ledger
                      </button>

                      <button
                        onClick={() => {
                          setPaymentCustomer(cust);
                          setPaymentAmount(Math.min(cust.outstandingBalance, 5000) || 1000);
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-xs"
                      >
                        Receive Payment
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Statement Ledger Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider block">
                  Double-Entry Customer Statement
                </span>
                <h3 className="text-xl font-black text-slate-900">{selectedCustomer.name}</h3>
                <p className="text-xs text-slate-500">
                  NIC: {selectedCustomer.nic} · Phone: {selectedCustomer.phone}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary Banner */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Approved Credit Limit
                </span>
                <p className="text-base font-black text-slate-800">
                  LKR {selectedCustomer.creditLimit.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                <span className="text-[10px] text-purple-700 uppercase font-semibold">
                  Current Outstanding Balance
                </span>
                <p className="text-base font-black text-purple-900">
                  LKR {selectedCustomer.outstandingBalance.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Chronological Entries */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Transaction Statement History
              </span>
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {creditLedgers
                  .filter((l) => l.customerId === selectedCustomer.id)
                  .map((entry) => (
                    <div
                      key={entry.id}
                      className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                            entry.type === "charge"
                              ? "bg-red-100 text-red-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {entry.type === "charge" ? "+" : "-"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{entry.reference}</p>
                          <p className="text-[10px] text-slate-500">
                            {new Date(entry.createdAt).toLocaleDateString()} · {entry.notes}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-black text-xs ${
                            entry.type === "charge" ? "text-red-700" : "text-emerald-700"
                          }`}
                        >
                          {entry.type === "charge" ? "+" : "-"} LKR {entry.amount.toLocaleString()}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          Balance: LKR {entry.balanceAfter.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <button
              onClick={() => setSelectedCustomer(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
            >
              Close Statement
            </button>
          </div>
        </div>
      )}

      {/* Receive Payment Modal */}
      {paymentCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                  Receive Credit Settlement
                </span>
                <h3 className="text-lg font-black text-slate-900">{paymentCustomer.name}</h3>
              </div>
              <button
                onClick={() => setPaymentCustomer(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs">
              <span className="text-purple-700 font-semibold block">Outstanding Debt:</span>
              <span className="text-xl font-black text-purple-900">
                LKR {paymentCustomer.outstandingBalance.toLocaleString()}
              </span>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase">Settlement Amount (LKR) *</label>
                <input
                  type="number"
                  min="1"
                  max={paymentCustomer.outstandingBalance || 1000000}
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full p-3 rounded-xl border border-slate-300 text-lg font-black text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase">Payment Tender</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card Terminal</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque Settlement</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase">Receipt Notes</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Paid by clinic assistant..."
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              {paymentSuccess && (
                <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Settlement Recorded &amp; Balance Updated!
                </p>
              )}

              <button
                type="submit"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors"
              >
                Record Payment &amp; Issue Receipt
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Credit Customer Modal */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-black text-slate-900 text-base">Register Credit Account</h3>
              <button
                onClick={() => setIsAddCustomerOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomerSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase">Customer / Clinic Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Dr. Wickrama Fernando"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase">NIC Number *</label>
                  <input
                    type="text"
                    required
                    value={newNic}
                    onChange={(e) => setNewNic(e.target.value)}
                    placeholder="781290345V"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+94 77 ..."
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase">Address / Location</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Tangalle, Sri Lanka"
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase">Allocated Credit Limit (LKR)</label>
                <input
                  type="number"
                  min="0"
                  value={newLimit}
                  onChange={(e) => setNewLimit(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors"
              >
                Save Credit Customer
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

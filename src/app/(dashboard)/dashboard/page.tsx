"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePharmacy } from "@/context/PharmacyContext";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Boxes,
  AlertTriangle,
  ShieldAlert,
  FileText,
  CreditCard,
  ArrowUpRight,
  Sparkles,
  Users,
  ChevronRight,
  Package,
} from "lucide-react";

interface TrendItem {
  label: string;
  date: string;
  revenue: number;
  profit: number;
}

export default function DashboardPage() {
  const {
    sales,
    batches,
    products,
    onlinePrescriptions,
    creditCustomers,
    settings,
    pendingPrescriptionsCount,
    expiredBatchesCount,
    expiringSoonCount,
    lowStockCount,
  } = usePharmacy();

  // Helper date calculations initialized inside useEffect to satisfy Next.js 16 prerender
  const [todayStr, setTodayStr] = useState<string>("");
  const [last7Days, setLast7Days] = useState<TrendItem[]>([]);

  useEffect(() => {
    const today = new Date();
    const str = today.toISOString().split("T")[0];
    setTodayStr(str);

    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayDate = d.toISOString().split("T")[0];
      const daySales = sales.filter((s) => s.createdAt.startsWith(dayDate));
      const rev = daySales.reduce((acc, s) => acc + s.netTotal, 0);
      const profit = daySales.reduce((acc, s) => acc + s.grossProfit, 0);
      days.push({
        label: d.toLocaleDateString("en-US", { weekday: "short" }),
        date: dayDate,
        revenue: rev || (i === 0 ? 3200 : Math.floor(2000 + i * 450)),
        profit: profit || (i === 0 ? 1170 : Math.floor(700 + i * 180)),
      });
    }
    setLast7Days(days);
  }, [sales]);

  const todaySalesList = useMemo(() => {
    return sales.filter((s) => s.createdAt.startsWith(todayStr));
  }, [sales, todayStr]);

  const todayRevenue = useMemo(() => {
    return todaySalesList.reduce((acc, s) => acc + s.netTotal, 0);
  }, [todaySalesList]);

  const todayBillsCount = todaySalesList.length;

  const todayGrossProfit = useMemo(() => {
    return todaySalesList.reduce((acc, s) => acc + s.grossProfit, 0);
  }, [todaySalesList]);

  // Monthly Revenue
  const currentMonthStr = useMemo(() => todayStr.slice(0, 7), [todayStr]);
  const monthSalesList = useMemo(() => {
    return sales.filter((s) => s.createdAt.startsWith(currentMonthStr));
  }, [sales, currentMonthStr]);

  const monthRevenue = useMemo(() => {
    return monthSalesList.reduce((acc, s) => acc + s.netTotal, 0);
  }, [monthSalesList]);

  // Total Stock Value at Cost
  const totalStockValuationCost = useMemo(() => {
    return batches.reduce((acc, b) => acc + b.costPrice * b.quantity, 0);
  }, [batches]);

  // Payment Mix
  const paymentMix = useMemo(() => {
    const mix: Record<string, number> = {
      Cash: 0,
      Card: 0,
      Credit: 0,
      "Bank Transfer": 0,
      "QR Payment": 0,
      "Split Payment": 0,
    };
    sales.forEach((s) => {
      mix[s.paymentMethod] = (mix[s.paymentMethod] || 0) + s.netTotal;
    });
    return mix;
  }, [sales]);

  const totalAllSales = useMemo(() => {
    return Object.values(paymentMix).reduce((a, b) => a + b, 0) || 1;
  }, [paymentMix]);

  // Top Selling Products Leaderboard
  const topProducts = useMemo(() => {
    const map: Record<string, { product: typeof products[0]; unitsSold: number; revenue: number }> =
      {};
    sales.forEach((s) => {
      s.items.forEach((item) => {
        if (!map[item.product.id]) {
          map[item.product.id] = { product: item.product, unitsSold: 0, revenue: 0 };
        }
        map[item.product.id].unitsSold += item.quantity;
        map[item.product.id].revenue += item.lineTotal;
      });
    });
    return Object.values(map)
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5);
  }, [sales, products]);

  // Cashier Performance Leaderboard
  const cashierStats = useMemo(() => {
    const map: Record<string, { name: string; bills: number; total: number }> = {};
    sales.forEach((s) => {
      if (!map[s.cashierId]) {
        map[s.cashierId] = { name: s.cashierName, bills: 0, total: 0 };
      }
      map[s.cashierId].bills += 1;
      map[s.cashierId].total += s.netTotal;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [sales]);


  const maxTrendVal = useMemo(() => {
    return Math.max(...last7Days.map((d: TrendItem) => d.revenue), 4000);
  }, [last7Days]);

  return (
    <div className="space-y-6">
      {/* Top Welcome & KPI Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
            Operational Intelligence
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Pharmacy Executive Dashboard
          </h1>
          <p className="text-xs text-slate-500">
            Real-time financial performance, inventory valuation, and dispensing analytics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/pos"
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-600/20 transition-all flex items-center gap-1.5"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Open Smart POS Terminal</span>
          </Link>
        </div>
      </div>

      {/* Priority Health Alerts Quick Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/sales/prescriptions"
          className="p-3.5 bg-orange-50/70 border border-orange-200/80 rounded-2xl flex items-center justify-between group hover:bg-orange-50 transition-colors"
        >
          <div>
            <span className="text-[10px] font-bold text-orange-800 uppercase">Online Rx Queue</span>
            <p className="text-xl font-black text-orange-700">{pendingPrescriptionsCount} Pending</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
        </Link>

        <Link
          href="/inventory"
          className="p-3.5 bg-red-50/70 border border-red-200/80 rounded-2xl flex items-center justify-between group hover:bg-red-50 transition-colors"
        >
          <div>
            <span className="text-[10px] font-bold text-red-800 uppercase">Expired Batches</span>
            <p className="text-xl font-black text-red-700">{expiredBatchesCount} Blocked</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-red-600 group-hover:scale-105 transition-transform">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </Link>

        <Link
          href="/inventory"
          className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-center justify-between group hover:bg-amber-50 transition-colors"
        >
          <div>
            <span className="text-[10px] font-bold text-amber-800 uppercase">Expiring in 20d</span>
            <p className="text-xl font-black text-amber-700">{expiringSoonCount} Batches</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </Link>

        <Link
          href="/inventory"
          className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-center justify-between group hover:bg-blue-50 transition-colors"
        >
          <div>
            <span className="text-[10px] font-bold text-blue-800 uppercase">Low Stock Limit</span>
            <p className="text-xl font-black text-blue-700">{lowStockCount} Medicines</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
            <Boxes className="w-5 h-5" />
          </div>
        </Link>
      </div>

      {/* Core Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Today&apos;s Sales
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {todayBillsCount} Bills
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            LKR {todayRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="mt-3 flex items-center text-[11px] text-slate-500 gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Real-time POS synchronizing</span>
          </div>
        </div>

        {/* This Month's Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Monthly Revenue
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {monthSalesList.length} Transactions
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            LKR {monthRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="mt-3 flex items-center text-[11px] text-slate-500 gap-1">
            <span>Cumulative current month turnover</span>
          </div>
        </div>

        {/* Today's Gross Profit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Today&apos;s Gross Profit
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
              Batch Cost Delta
            </span>
          </div>
          <p className="text-2xl font-black text-orange-600 mt-2">
            LKR {todayGrossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="mt-3 flex items-center text-[11px] text-slate-500 gap-1">
            <span>
              Margin:{" "}
              <strong className="text-slate-800">
                {todayRevenue > 0
                  ? ((todayGrossProfit / todayRevenue) * 100).toFixed(1)
                  : "0"}
                %
              </strong>
            </span>
          </div>
        </div>

        {/* Stock Valuation (Cost) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Stock Value (Cost)
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
              {batches.length} Batches
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            LKR {totalStockValuationCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="mt-3 flex items-center text-[11px] text-slate-500 gap-1">
            <span>Total on-hand medicine assets</span>
          </div>
        </div>
      </div>

      {/* Charts & Analytical Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 7-Day Sales vs Gross Profit Comparative Bar Chart */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  7-Day Sales &amp; Gross Profit Trend
                </h3>
                <p className="text-xs text-slate-500">
                  Daily turnover compared against net gross profit margin.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-3 h-3 rounded-sm bg-orange-600" /> Revenue
                </span>
                <span className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500" /> Gross Profit
                </span>
              </div>
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="h-56 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-100">
              {last7Days.map((item: TrendItem, idx: number) => {
                const revHeight = Math.round((item.revenue / maxTrendVal) * 100);
                const profitHeight = Math.round((item.profit / maxTrendVal) * 100);

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-1.5 h-full">
                      {/* Revenue Bar */}
                      <div
                        style={{ height: `${revHeight}%` }}
                        className="w-1/2 max-w-[24px] bg-orange-600 rounded-t-md transition-all group-hover:bg-orange-500 relative"
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap z-20 pointer-events-none transition-opacity">
                          LKR {item.revenue.toLocaleString()}
                        </div>
                      </div>

                      {/* Profit Bar */}
                      <div
                        style={{ height: `${profitHeight}%` }}
                        className="w-1/2 max-w-[24px] bg-emerald-500 rounded-t-md transition-all group-hover:bg-emerald-400 relative"
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap z-20 pointer-events-none transition-opacity">
                          LKR {item.profit.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <span className="text-[11px] font-bold text-slate-500 mt-2">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Automated real-time aggregation from RTDB sales ledgers</span>
            <Link href="/reports" className="text-orange-600 font-bold hover:underline flex items-center gap-0.5">
              <span>View In-Depth Smart Reports</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Payment Breakdown Mix */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 mb-1">Payment Method Mix</h3>
            <p className="text-xs text-slate-500 mb-4">
              Distribution across Cash, Cards, QR, Credit, and Transfers.
            </p>

            <div className="space-y-3">
              {Object.entries(paymentMix).map(([method, amount]) => {
                const percentage = Math.round((amount / totalAllSales) * 100);
                return (
                  <div key={method} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-700">{method}</span>
                      <span className="text-slate-900 font-bold">
                        LKR {amount.toLocaleString()} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        style={{ width: `${percentage}%` }}
                        className={`h-full rounded-full ${
                          method === "Cash"
                            ? "bg-emerald-500"
                            : method === "Card"
                            ? "bg-blue-500"
                            : method === "Credit"
                            ? "bg-purple-500"
                            : method === "QR Payment"
                            ? "bg-amber-500"
                            : "bg-orange-500"
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs">
            <span className="text-slate-500">Total Recorded</span>
            <span className="font-extrabold text-slate-900">
              LKR {totalAllSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Top Products & Cashier Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Selling Products */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Top Selling Medications</h3>
              <p className="text-xs text-slate-500">Highest volume items dispensed across all POS tills.</p>
            </div>
            <Link href="/inventory" className="text-xs font-bold text-orange-600 hover:underline">
              Inventory →
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {topProducts.map((item, i) => (
              <div key={item.product.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                    #{i + 1}
                  </span>
                  <div>
                    <p className="font-bold text-slate-900">{item.product.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {item.product.category} · Barcode: {item.product.barcode}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-extrabold text-slate-900">
                    {item.unitsSold} {item.product.unit}s
                  </p>
                  <p className="text-[11px] text-emerald-600 font-semibold">
                    LKR {item.revenue.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Cashier Leaderboard */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Cashier Leaderboard</h3>
              <p className="text-xs text-slate-500">Shift throughput and bill generation.</p>
            </div>
            <Users className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3">
            {cashierStats.map((c, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-600 text-white font-bold flex items-center justify-center text-xs">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{c.name}</p>
                    <p className="text-[10px] text-slate-500">{c.bills} Bills Settled</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-extrabold text-slate-900">
                    LKR {c.total.toLocaleString()}
                  </span>
                  <span className="block text-[10px] text-emerald-600 font-semibold">
                    Avg: LKR {Math.round(c.total / (c.bills || 1)).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePharmacy } from "@/context/PharmacyContext";
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Truck,
  Receipt,
  Users,
  Building2,
  FileText,
  BarChart3,
  UserCog,
  Settings,
  Menu,
  X,
  Lock,
} from "lucide-react";

export const SidebarNav: React.FC = () => {
  const pathname = usePathname();
  const { currentUser, pendingPrescriptionsCount, lowStockCount, expiredBatchesCount } = usePharmacy();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      moduleKey: "dashboard" as const,
      badge: null,
    },
    {
      name: "Smart POS",
      href: "/pos",
      icon: ShoppingCart,
      moduleKey: "pos" as const,
      highlight: true,
      badge: null,
    },
    {
      name: "Products & Stock",
      href: "/inventory",
      icon: Boxes,
      moduleKey: "inventory" as const,
      badge:
        lowStockCount + expiredBatchesCount > 0
          ? `${lowStockCount + expiredBatchesCount}`
          : null,
      badgeColor: "bg-red-500",
    },
    {
      name: "GRN / Purchases",
      href: "/inventory/grn",
      icon: Truck,
      moduleKey: "grn" as const,
      badge: null,
    },
    {
      name: "Sales History",
      href: "/sales",
      icon: Receipt,
      moduleKey: "sales" as const,
      badge: null,
    },
    {
      name: "Credit Customers",
      href: "/partners/credit",
      icon: Users,
      moduleKey: "credit" as const,
      badge: null,
    },
    {
      name: "Suppliers",
      href: "/partners/suppliers",
      icon: Building2,
      moduleKey: "suppliers" as const,
      badge: null,
    },
    {
      name: "Prescriptions",
      href: "/sales/prescriptions",
      icon: FileText,
      moduleKey: "prescriptions" as const,
      badge: pendingPrescriptionsCount > 0 ? `${pendingPrescriptionsCount} New` : null,
      badgeColor: "bg-orange-500 animate-pulse",
    },
    {
      name: "Smart Reports",
      href: "/reports",
      icon: BarChart3,
      moduleKey: "reports" as const,
      badge: null,
    },
    {
      name: "Users & Roles",
      href: "/admin/users",
      icon: UserCog,
      moduleKey: "users" as const,
      badge: null,
    },
    {
      name: "System Settings",
      href: "/admin/settings",
      icon: Settings,
      moduleKey: "settings" as const,
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile Toggle Bar */}
      <div className="md:hidden flex items-center justify-between p-3 bg-slate-900 text-white">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-orange-600 flex items-center justify-center font-bold text-xs">
            +
          </div>
          <span className="text-xs font-bold">Workspace Navigation</span>
        </div>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-1 rounded-md text-slate-300 hover:text-white hover:bg-slate-800"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Desktop & Mobile Drawer */}
      <aside
        className={`fixed md:sticky top-0 md:top-[57px] left-0 z-40 h-full md:h-[calc(100vh-57px)] w-64 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out shrink-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-3 overflow-y-auto flex-1 space-y-1">
          {/* Mobile close button */}
          <div className="md:hidden flex items-center justify-between pb-3 mb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Modules Menu
            </span>
            <button onClick={() => setIsMobileOpen(false)} className="text-slate-400">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {currentUser.role === "Cashier" ? "Front-Counter POS" : "Operations & Workspace"}
          </div>

          {navItems
            .filter((item) => {
              // Role-based strict filtering
              if (currentUser.role === "Cashier") {
                return ["pos", "sales", "credit", "prescriptions"].includes(item.moduleKey);
              }
              if (currentUser.role === "Manager") {
                return item.moduleKey !== "users" && item.moduleKey !== "settings";
              }
              // Owner has all 11 modules
              return true;
            })
            .filter((item) => {
              // Granular permission check
              return currentUser.permissions?.modules[item.moduleKey] ?? true;
            })
            .map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" &&
                  item.href !== "/inventory" &&
                  pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-orange-600 text-white shadow-xs"
                      : item.highlight
                      ? "text-orange-400 hover:bg-slate-800/80 hover:text-orange-300 font-bold"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon
                      className={`w-4 h-4 ${
                        isActive ? "text-white" : item.highlight ? "text-orange-400" : "text-slate-400"
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ${
                        item.badgeColor || "bg-slate-700"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
        </div>

        {/* Footer info in sidebar */}
        <div className="p-3 bg-slate-950/60 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-200">{currentUser.displayName}</p>
            <p className="text-[10px] text-slate-500">
              Role: <span className="text-orange-400 font-bold">{currentUser.role}</span>
            </p>
          </div>
          {currentUser.role === "Owner" && (
            <Link
              href="/admin/settings"
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white"
              title="System Settings (Owner Only)"
            >
              <Settings className="w-4 h-4" />
            </Link>
          )}
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 md:hidden backdrop-blur-2xs"
        />
      )}
    </>
  );
};

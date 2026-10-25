"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePharmacy } from "@/context/PharmacyContext";
import { GlobalHeader } from "@/components/shared/GlobalHeader";
import { SidebarNav } from "@/components/shared/SidebarNav";
import { GlobalSearchModal } from "@/components/shared/GlobalSearchModal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser } = usePharmacy();

  useEffect(() => {
    if (!currentUser) return;

    // Strict Cashier restrictions: Only POS, Sales, Credit, Prescriptions
    if (currentUser.role === "Cashier") {
      const allowedPaths = [
        "/pos",
        "/sales",
        "/partners/credit",
        "/sales/prescriptions",
        "/prescriptions",
      ];
      const isAllowed = allowedPaths.some(
        (p) => pathname === p || pathname.startsWith(`${p}/`)
      );
      if (!isAllowed) {
        router.replace("/pos");
      }
    }

    // Strict Manager restrictions: Operational routes only, block /admin/users and /admin/settings
    if (currentUser.role === "Manager") {
      if (pathname.startsWith("/admin/users") || pathname.startsWith("/admin/settings")) {
        router.replace("/dashboard");
      }
    }
  }, [pathname, currentUser, router]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <GlobalHeader />
      <div className="flex-1 flex flex-col md:flex-row min-h-[calc(100vh-57px)]">
        <SidebarNav />
        <main className="flex-1 p-3 sm:p-5 lg:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
      <GlobalSearchModal />
    </div>
  );
}

"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { Sidebar } from "@/components/admin/Sidebar";
import { Header } from "@/components/admin/Header";

const AdminGuard = dynamic(
  () => import("@/components/admin/AdminGuard").then((mod) => mod.AdminGuard),
  { ssr: false }
);

interface ProtectedAdminLayoutProps {
  children: ReactNode;
}

export default function ProtectedAdminLayout({ children }: ProtectedAdminLayoutProps) {
  return (
    <AdminGuard>
      <div className="admin-layout min-h-screen bg-background">
        <Sidebar />
        <div className="lg:ml-64 flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}

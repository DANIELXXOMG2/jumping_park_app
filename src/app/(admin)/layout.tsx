"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";


const AuthProvider = dynamic(
  () => import("@/contexts/AuthContext").then((mod) => mod.AuthProvider),
  { ssr: false }
);

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}

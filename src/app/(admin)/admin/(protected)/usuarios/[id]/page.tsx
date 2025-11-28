"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  FileCheck,
  Baby,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/admin/Card";
import { Badge } from "@/components/admin/Badge";
import { Button } from "@/components/admin/Button";
import { formatRelativeTime } from "@/lib/utils";
import { adminGet } from "@/lib/adminApi";

interface Minor {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  birthDate: string;
  relationship: string;
  eps?: string;
  idType?: string;
  idNumber?: string;
}

interface User {
  id: string;
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  minors: Minor[];
  createdAt: string | null;
  updatedAt: string | null;
}

interface Consent {
  id: string;
  consecutivo: number;
  policyVersion: string;
  signatureUrl: string;
  minorsCount: number;
  createdAt: string | null;
  signedAt: string | null;
  validUntil: string | null;
}

interface UserStats {
  totalConsents: number;
  minorsCount: number;
}

interface UserData {
  user: User;
  consents: Consent[];
  stats: UserStats;
}

interface UserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await adminGet<UserData>(`/api/admin/users/${id}`);
      setData(result);
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.message.includes("404")) {
        setError("Usuario no encontrado");
      } else {
        setError(err instanceof Error ? err.message : "Error desconocido");
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-red-400">{error || "Usuario no encontrado"}</p>
        <Button variant="secondary" onClick={() => router.back()}>
          Volver
        </Button>
      </div>
    );
  }

  const { user, consents, stats } = data;

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Back button and header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Button>
      </div>

      {/* User Info Header */}
      <div className="bg-surface rounded-xl border border-border p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-br from-primary to-primary-contrast flex items-center justify-center">
            <span className="text-2xl lg:text-3xl font-bold text-background">
              {user.fullName?.charAt(0)?.toUpperCase() || "U"}
            </span>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              {user.fullName}
            </h1>
            <p className="text-foreground/60 mt-1 font-mono">
              Doc: {user.uid}
            </p>
            <div className="flex flex-wrap gap-4 mt-3">
              <div className="flex items-center gap-2 text-sm text-foreground/70">
                <Mail className="w-4 h-4" />
                {user.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground/70">
                <Phone className="w-4 h-4" />
                {user.phone || "Sin teléfono"}
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground/70">
                <Calendar className="w-4 h-4" />
                Registrado{" "}
                {user.createdAt ? formatRelativeTime(user.createdAt) : "-"}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-foreground/60">
              <FileCheck className="w-4 h-4" />
              <span className="text-xs uppercase">Consentimientos</span>
            </div>
            <p className="text-2xl font-bold text-foreground mt-1">
              {stats.totalConsents}
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-foreground/60">
              <Baby className="w-4 h-4" />
              <span className="text-xs uppercase">Menores</span>
            </div>
            <p className="text-2xl font-bold text-foreground mt-1">
              {stats.minorsCount}
            </p>
          </div>
        </div>
      </div>

      {/* Minors */}
      <Card>
        <CardHeader>
          <CardTitle>Menores Asociados ({user.minors.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {user.minors.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {user.minors.map((minor, index) => (
                <div
                  key={index}
                  className="bg-surface-muted rounded-lg p-4 border border-border/50"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        {minor.fullName ||
                          `${minor.firstName || ""} ${minor.lastName || ""}`.trim() ||
                          "Sin nombre"}
                      </p>
                      <p className="text-sm text-foreground/60 mt-1">
                        {minor.relationship}
                      </p>
                    </div>
                    <Badge variant="info">
                      {calculateAge(minor.birthDate)} años
                    </Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-foreground/50">
                    <div>
                      <span className="uppercase">Documento:</span>{" "}
                      {minor.idType?.toUpperCase()} {minor.idNumber || "-"}
                    </div>
                    <div>
                      <span className="uppercase">EPS:</span>{" "}
                      {minor.eps || "-"}
                    </div>
                    <div>
                      <span className="uppercase">Nacimiento:</span>{" "}
                      {minor.birthDate}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-foreground/50 py-8">
              No hay menores registrados
            </p>
          )}
        </CardContent>
      </Card>

      {/* Consents */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Consentimientos</CardTitle>
        </CardHeader>
        <CardContent>
          {consents.length > 0 ? (
            <div className="space-y-3">
              {consents.map((consent) => {
                const isValid =
                  consent.validUntil && new Date(consent.validUntil) > new Date();
                return (
                  <div
                    key={consent.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-surface-muted border border-border/50"
                  >
                    <div className="flex items-center gap-4">
                      <Badge variant="info">#{consent.consecutivo}</Badge>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {consent.minorsCount} menor(es)
                        </p>
                        <p className="text-xs text-foreground/50">
                          Versión {consent.policyVersion}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={isValid ? "success" : "error"}>
                        {isValid ? "Vigente" : "Vencido"}
                      </Badge>
                      <p className="text-xs text-foreground/50 mt-1">
                        {consent.signedAt
                          ? formatRelativeTime(consent.signedAt)
                          : "-"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-foreground/50 py-8">
              No hay consentimientos registrados
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

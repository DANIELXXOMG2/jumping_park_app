"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Users, FileCheck, Baby, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/admin/Card";
import { Badge } from "@/components/admin/Badge";
import { formatRelativeTime } from "@/lib/utils";
import { adminGet } from "@/lib/adminApi";
import Link from "next/link";

interface DashboardStats {
  totalUsers: number;
  totalConsents: number;
  totalMinors: number;
  usersToday: number;
  consentsToday: number;
}

interface RecentUser {
  id: string;
  uid: string;
  fullName: string;
  email: string;
  createdAt: string | null;
}

interface RecentConsent {
  id: string;
  consecutivo: number;
  adultSnapshot?: {
    fullName: string;
  };
  minorsSnapshot?: unknown[];
  createdAt: string | null;
}

interface ChartData {
  name: string;
  value: number;
}

interface DashboardData {
  stats: DashboardStats;
  recentUsers: RecentUser[];
  recentConsents: RecentConsent[];
  chartData: ChartData[];
}

function SkeletonStatCard() {
  return (
    <div className="bg-surface rounded-xl border border-border p-4 animate-pulse">
      <div className="h-4 w-24 bg-surface-muted rounded mb-3" />
      <div className="h-8 w-16 bg-surface-muted rounded mb-2" />
      <div className="h-3 w-20 bg-surface-muted rounded" />
    </div>
  );
}

function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
          <div className="w-9 h-9 rounded-full bg-surface-muted" />
          <div className="flex-1">
            <div className="h-4 w-32 bg-surface-muted rounded mb-2" />
            <div className="h-3 w-24 bg-surface-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 animate-pulse">
          <div className="h-6 w-12 bg-surface-muted rounded" />
          <div className="h-4 w-32 bg-surface-muted rounded" />
          <div className="h-6 w-20 bg-surface-muted rounded" />
          <div className="h-4 w-24 bg-surface-muted rounded" />
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<{ data: DashboardData; timestamp: number } | null>(null);
  const CACHE_DURATION = 10000;

  const fetchDashboardData = useCallback(async (force = false) => {
    if (!force && cacheRef.current && Date.now() - cacheRef.current.timestamp < CACHE_DURATION) {
      setData(cacheRef.current.data);
      setIsLoading(false);
      return;
    }

    try {
      if (!data) setIsLoading(true);
      const result = await adminGet<DashboardData>("/api/admin/stats");
      cacheRef.current = { data: result, timestamp: Date.now() };
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  }, [data]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => fetchDashboardData(true), 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  if (isLoading && !data) {
    return (
      <div className="space-y-6 pb-20 lg:pb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-foreground/60 mt-1">Resumen de actividad del parque</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Consentimientos por Día</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-40">
                {[1,2,3,4,5,6,7].map((i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 animate-pulse">
                    <div className="w-full bg-surface-muted rounded-t" style={{ height: `${Math.random() * 60 + 20}%` }} />
                    <div className="h-3 w-6 bg-surface-muted rounded" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Usuarios Recientes</CardTitle></CardHeader>
            <CardContent><SkeletonList /></CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader><CardTitle>Consentimientos Recientes</CardTitle></CardHeader>
          <CardContent><SkeletonTable /></CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-red-400">{error}</p>
        <button
          onClick={() => fetchDashboardData(true)}
          className="px-4 py-2 bg-primary text-background rounded-lg font-medium min-h-0"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const maxChartValue = data?.chartData
    ? Math.max(...data.chartData.map((d) => d.value), 1)
    : 1;

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-foreground/60 mt-1">
          Resumen de actividad del parque
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Usuarios Totales"
          value={data?.stats.totalUsers || 0}
          subtitle={`+${data?.stats.usersToday || 0} hoy`}
          icon={Users}
        />
        <StatCard
          title="Consentimientos"
          value={data?.stats.totalConsents || 0}
          subtitle={`+${data?.stats.consentsToday || 0} hoy`}
          icon={FileCheck}
        />
        <StatCard
          title="Menores Registrados"
          value={data?.stats.totalMinors || 0}
          icon={Baby}
        />
        <StatCard
          title="Tasa de Conversión"
          value={
            data?.stats.totalUsers
              ? Math.round(
                  (data.stats.totalConsents / data.stats.totalUsers) * 100
                )
              : 0
          }
          subtitle="Usuarios con firma"
          icon={TrendingUp}
        />
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Consentimientos por Día</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-40">
              {data?.chartData.map((item) => (
                <div
                  key={item.name}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  <div
                    className="w-full bg-primary/20 rounded-t transition-all duration-500"
                    style={{
                      height: `${(item.value / maxChartValue) * 100}%`,
                      minHeight: item.value > 0 ? "8px" : "2px",
                    }}
                  >
                    <div
                      className="w-full h-full bg-gradient-to-t from-primary to-primary/60 rounded-t"
                      style={{
                        opacity: item.value > 0 ? 1 : 0.3,
                      }}
                    />
                  </div>
                  <span className="text-xs text-foreground/50">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle>Usuarios Recientes</CardTitle>
            <Link
              href="/admin/usuarios"
              className="text-sm text-primary hover:underline"
            >
              Ver todos
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.recentUsers.map((user) => (
                <Link
                  key={user.id}
                  href={`/admin/usuarios/${user.uid}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-surface-muted hover:bg-surface-muted/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-primary-contrast/30 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">
                        {user.fullName?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {user.fullName}
                      </p>
                      <p className="text-xs text-foreground/50">{user.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-foreground/40">
                    {user.createdAt ? formatRelativeTime(user.createdAt) : "-"}
                  </span>
                </Link>
              ))}
              {(!data?.recentUsers || data.recentUsers.length === 0) && (
                <p className="text-center text-foreground/50 py-4">
                  No hay usuarios recientes
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Consents */}
      <Card>
        <CardHeader>
          <CardTitle>Consentimientos Recientes</CardTitle>
          <Link
            href="/admin/consentimientos"
            className="text-sm text-primary hover:underline"
          >
            Ver todos
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground/60">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground/60">
                    Responsable
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground/60">
                    Menores
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground/60">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.recentConsents.map((consent) => (
                  <tr
                    key={consent.id}
                    className="border-b border-border/50 hover:bg-surface-muted/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Badge variant="info">#{consent.consecutivo}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground/80">
                      {consent.adultSnapshot?.fullName || "N/A"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="default">
                        {consent.minorsSnapshot?.length || 0} menores
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground/50">
                      {consent.createdAt
                        ? formatRelativeTime(consent.createdAt)
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!data?.recentConsents || data.recentConsents.length === 0) && (
              <p className="text-center text-foreground/50 py-8">
                No hay consentimientos recientes
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/admin/DataTable";
import { SearchInput } from "@/components/admin/SearchInput";
import { Badge } from "@/components/admin/Badge";
import { adminGet } from "@/lib/adminApi";

interface Minor {
  id: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  birthDate: string;
  relationship: string;
  eps?: string;
  idType?: string;
  idNumber?: string;
  parentId: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
}

interface Pagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export default function MinorsPage() {
  const router = useRouter();
  const [minors, setMinors] = useState<Minor[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  });
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchMinors = useCallback(async (searchTerm: string, offset: number) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        limit: "20",
        offset: offset.toString(),
      });
      if (searchTerm) {
        params.set("search", searchTerm);
      }

      const data = await adminGet<{ minors: Minor[]; pagination: Pagination }>(
        `/api/admin/minors?${params}`
      );
      setMinors(data.minors);
      setPagination(data.pagination);
    } catch {
      // Error silencioso
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMinors(search, 0);
  }, [search, fetchMinors]);

  const handlePageChange = (newOffset: number) => {
    fetchMinors(search, newOffset);
  };

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

  const columns = [
    {
      key: "fullName",
      header: "Nombre",
      render: (minor: Minor) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400/30 to-purple-400/30 flex items-center justify-center">
            <span className="text-xs font-bold text-blue-400">
              {minor.fullName?.charAt(0)?.toUpperCase() || "M"}
            </span>
          </div>
          <span className="font-medium">{minor.fullName}</span>
        </div>
      ),
    },
    {
      key: "birthDate",
      header: "Edad",
      render: (minor: Minor) => (
        <Badge variant="info">{calculateAge(minor.birthDate)} años</Badge>
      ),
    },
    {
      key: "idNumber",
      header: "Documento",
      render: (minor: Minor) => (
        <span className="font-mono text-xs text-foreground/70">
          {minor.idType?.toUpperCase()} {minor.idNumber || "-"}
        </span>
      ),
    },
    {
      key: "relationship",
      header: "Parentesco",
      render: (minor: Minor) => (
        <span className="text-foreground/70 capitalize">
          {minor.relationship}
        </span>
      ),
    },
    {
      key: "eps",
      header: "EPS",
      render: (minor: Minor) => (
        <span className="text-foreground/70 capitalize">{minor.eps || "-"}</span>
      ),
    },
    {
      key: "parentName",
      header: "Responsable",
      render: (minor: Minor) => (
        <div>
          <p className="text-sm font-medium">{minor.parentName}</p>
          <p className="text-xs text-foreground/50">{minor.parentId}</p>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Menores
          </h1>
          <p className="text-foreground/60 mt-1">
            {pagination.total} menores registrados
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPagination((prev) => ({ ...prev, offset: 0 }));
          }}
          placeholder="Buscar por nombre, documento, responsable..."
          className="flex-1 max-w-md"
        />
      </div>

      {/* Minors Table */}
      <div className="bg-surface rounded-xl border border-border p-4 lg:p-6">
        <DataTable
          data={minors}
          columns={columns}
          keyExtractor={(minor) => minor.id}
          onRowClick={(minor) => router.push(`/admin/usuarios/${minor.parentId}`)}
          isLoading={isLoading}
          emptyMessage="No se encontraron menores"
          pagination={{
            ...pagination,
            onPageChange: handlePageChange,
          }}
        />
      </div>
    </div>
  );
}

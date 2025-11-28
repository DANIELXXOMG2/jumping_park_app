"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/admin/DataTable";
import { SearchInput } from "@/components/admin/SearchInput";
import { Badge } from "@/components/admin/Badge";
import { formatRelativeTime } from "@/lib/utils";
import { adminGet } from "@/lib/adminApi";

interface User {
  id: string;
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  minorsCount: number;
  createdAt: string | null;
}

interface Pagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  });
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = useCallback(async (searchTerm: string, offset: number) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        limit: "20",
        offset: offset.toString(),
      });
      if (searchTerm) {
        params.set("search", searchTerm);
      }

      const data = await adminGet<{ users: User[]; pagination: Pagination }>(
        `/api/admin/users?${params}`
      );
      setUsers(data.users);
      setPagination(data.pagination);
    } catch {
      // Error silencioso
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(search, 0);
  }, [search, fetchUsers]);

  const handlePageChange = (newOffset: number) => {
    fetchUsers(search, newOffset);
  };

  const columns = [
    {
      key: "uid",
      header: "Documento",
      render: (user: User) => (
        <span className="font-mono text-xs">{user.uid}</span>
      ),
    },
    {
      key: "fullName",
      header: "Nombre",
      render: (user: User) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary-contrast/30 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">
              {user.fullName?.charAt(0)?.toUpperCase() || "U"}
            </span>
          </div>
          <span className="font-medium">{user.fullName}</span>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (user: User) => (
        <span className="text-foreground/70">{user.email}</span>
      ),
    },
    {
      key: "phone",
      header: "Teléfono",
      render: (user: User) => (
        <span className="text-foreground/70">{user.phone || "-"}</span>
      ),
    },
    {
      key: "minorsCount",
      header: "Menores",
      render: (user: User) => (
        <Badge variant={user.minorsCount > 0 ? "success" : "default"}>
          {user.minorsCount}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Registrado",
      render: (user: User) => (
        <span className="text-foreground/50 text-xs">
          {user.createdAt ? formatRelativeTime(user.createdAt) : "-"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Usuarios
          </h1>
          <p className="text-foreground/60 mt-1">
            {pagination.total} usuarios registrados
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPagination((prev) => ({ ...prev, offset: 0 }));
          }}
          placeholder="Buscar por nombre, email, documento..."
          className="flex-1 max-w-md"
        />
      </div>

      {/* Users Table */}
      <div className="bg-surface rounded-xl border border-border p-4 lg:p-6">
        <DataTable
          data={users}
          columns={columns}
          keyExtractor={(user) => user.id}
          onRowClick={(user) => router.push(`/admin/usuarios/${user.uid}`)}
          isLoading={isLoading}
          emptyMessage="No se encontraron usuarios"
          pagination={{
            ...pagination,
            onPageChange: handlePageChange,
          }}
        />
      </div>
    </div>
  );
}

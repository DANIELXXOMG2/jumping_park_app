"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/admin/DataTable";
import { SearchInput } from "@/components/admin/SearchInput";
import { Badge } from "@/components/admin/Badge";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/admin/Button";
import { formatRelativeTime } from "@/lib/utils";
import { adminGet } from "@/lib/adminApi";
import { Eye, ExternalLink } from "lucide-react";

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

interface Consent {
  id: string;
  consecutivo: number;
  userId: string;
  adultName: string;
  adultEmail: string;
  adultPhone: string;
  minorsCount: number;
  minors: Minor[];
  signatureUrl: string;
  policyVersion: string;
  ipAddress?: string;
  createdAt: string | null;
  signedAt: string | null;
  validUntil: string | null;
}

interface Pagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export default function ConsentsPage() {
  const router = useRouter();
  const [consents, setConsents] = useState<Consent[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  });
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConsent, setSelectedConsent] = useState<Consent | null>(null);

  const fetchConsents = useCallback(
    async (searchTerm: string, offset: number) => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          limit: "20",
          offset: offset.toString(),
        });
        if (searchTerm) {
          params.set("search", searchTerm);
        }

        const data = await adminGet<{ consents: Consent[]; pagination: Pagination }>(
          `/api/admin/consents?${params}`
        );
        setConsents(data.consents);
        setPagination(data.pagination);
      } catch {
        // Error silencioso
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchConsents(search, 0);
  }, [search, fetchConsents]);

  const handlePageChange = (newOffset: number) => {
    fetchConsents(search, newOffset);
  };

  const isValidConsent = (validUntil: string | null) => {
    if (!validUntil) return false;
    return new Date(validUntil) > new Date();
  };

  const columns = [
    {
      key: "consecutivo",
      header: "#",
      render: (consent: Consent) => (
        <Badge variant="info">#{consent.consecutivo}</Badge>
      ),
    },
    {
      key: "adultName",
      header: "Responsable",
      render: (consent: Consent) => (
        <div>
          <p className="font-medium">{consent.adultName}</p>
          <p className="text-xs text-foreground/50">{consent.userId}</p>
        </div>
      ),
    },
    {
      key: "adultEmail",
      header: "Contacto",
      render: (consent: Consent) => (
        <div className="text-xs">
          <p className="text-foreground/70">{consent.adultEmail}</p>
          <p className="text-foreground/50">{consent.adultPhone}</p>
        </div>
      ),
    },
    {
      key: "minorsCount",
      header: "Menores",
      render: (consent: Consent) => (
        <Badge variant="default">{consent.minorsCount}</Badge>
      ),
    },
    {
      key: "validUntil",
      header: "Estado",
      render: (consent: Consent) => (
        <Badge variant={isValidConsent(consent.validUntil) ? "success" : "error"}>
          {isValidConsent(consent.validUntil) ? "Vigente" : "Vencido"}
        </Badge>
      ),
    },
    {
      key: "signedAt",
      header: "Firmado",
      render: (consent: Consent) => (
        <span className="text-xs text-foreground/50">
          {consent.signedAt ? formatRelativeTime(consent.signedAt) : "-"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (consent: Consent) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedConsent(consent);
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>
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
            Consentimientos
          </h1>
          <p className="text-foreground/60 mt-1">
            {pagination.total} consentimientos registrados
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
          placeholder="Buscar por nombre, email, documento, consecutivo..."
          className="flex-1 max-w-md"
        />
      </div>

      {/* Consents Table */}
      <div className="bg-surface rounded-xl border border-border p-4 lg:p-6">
        <DataTable
          data={consents}
          columns={columns}
          keyExtractor={(consent) => consent.id}
          onRowClick={(consent) => setSelectedConsent(consent)}
          isLoading={isLoading}
          emptyMessage="No se encontraron consentimientos"
          pagination={{
            ...pagination,
            onPageChange: handlePageChange,
          }}
        />
      </div>

      {/* Consent Detail Modal */}
      <Modal
        isOpen={!!selectedConsent}
        onClose={() => setSelectedConsent(null)}
        title={`Consentimiento #${selectedConsent?.consecutivo}`}
      >
        {selectedConsent && (
          <div className="space-y-6">
            {/* Adult Info */}
            <div>
              <h4 className="text-sm font-semibold text-foreground/60 uppercase mb-3">
                Información del Responsable
              </h4>
              <div className="bg-surface-muted rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-foreground/60">Nombre:</span>
                  <span className="text-sm font-medium">
                    {selectedConsent.adultName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-foreground/60">Documento:</span>
                  <span className="text-sm font-mono">
                    {selectedConsent.userId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-foreground/60">Email:</span>
                  <span className="text-sm">{selectedConsent.adultEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-foreground/60">Teléfono:</span>
                  <span className="text-sm">{selectedConsent.adultPhone}</span>
                </div>
              </div>
            </div>

            {/* Minors */}
            <div>
              <h4 className="text-sm font-semibold text-foreground/60 uppercase mb-3">
                Menores ({selectedConsent.minors.length})
              </h4>
              <div className="space-y-2">
                {selectedConsent.minors.map((minor, index) => (
                  <div
                    key={index}
                    className="bg-surface-muted rounded-lg p-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {minor.fullName ||
                          `${minor.firstName || ""} ${minor.lastName || ""}`.trim()}
                      </p>
                      <p className="text-xs text-foreground/50">
                        {minor.relationship} • {minor.birthDate}
                      </p>
                    </div>
                    <Badge variant="default" className="text-xs">
                      {minor.idType?.toUpperCase()} {minor.idNumber}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Consent Details */}
            <div>
              <h4 className="text-sm font-semibold text-foreground/60 uppercase mb-3">
                Detalles del Consentimiento
              </h4>
              <div className="bg-surface-muted rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-foreground/60">Versión:</span>
                  <span className="text-sm">
                    {selectedConsent.policyVersion}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-foreground/60">IP:</span>
                  <span className="text-sm font-mono">
                    {selectedConsent.ipAddress || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-foreground/60">Firmado:</span>
                  <span className="text-sm">
                    {selectedConsent.signedAt
                      ? new Date(selectedConsent.signedAt).toLocaleString("es-CO")
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-foreground/60">
                    Válido hasta:
                  </span>
                  <span className="text-sm">
                    {selectedConsent.validUntil
                      ? new Date(selectedConsent.validUntil).toLocaleString(
                          "es-CO"
                        )
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground/60">Estado:</span>
                  <Badge
                    variant={
                      isValidConsent(selectedConsent.validUntil)
                        ? "success"
                        : "error"
                    }
                  >
                    {isValidConsent(selectedConsent.validUntil)
                      ? "Vigente"
                      : "Vencido"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Signature */}
            {selectedConsent.signatureUrl && (
              <div>
                <h4 className="text-sm font-semibold text-foreground/60 uppercase mb-3">
                  Firma Digital
                </h4>
                <div className="bg-white rounded-lg p-4">
                  <img
                    src={selectedConsent.signatureUrl}
                    alt="Firma"
                    className="max-h-24 mx-auto"
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setSelectedConsent(null);
                  router.push(`/admin/usuarios/${selectedConsent.userId}`);
                }}
              >
                Ver Usuario
              </Button>
              {selectedConsent.signatureUrl && (
                <Button
                  variant="outline"
                  onClick={() =>
                    window.open(selectedConsent.signatureUrl, "_blank")
                  }
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

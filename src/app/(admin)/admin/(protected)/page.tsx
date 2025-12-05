"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, FileCheck, CheckCircle, XCircle, FileText, Baby, Loader2 } from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/admin/Card";
import { adminGet } from "@/lib/adminApi";

interface DashboardStats {
  consentsToday: number;
}

interface MinorSnapshot {
  firstName: string;
  lastName: string;
}

interface ConsentResult {
  found: boolean;
  consent?: {
    id: string;
    consecutivo: number;
    adultSnapshot: {
      fullName: string;
      uid: string;
    };
    minorsSnapshot: MinorSnapshot[];
    pdfUrl?: string;
    createdAt: string;
    expiresAt?: string;
  };
  isExpired?: boolean;
}

export default function AdminDashboard() {
  const [cedula, setCedula] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<ConsentResult | null>(null);
  const [consentsToday, setConsentsToday] = useState<number>(0);
  const [statsLoading, setStatsLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cargar estadísticas simples al inicio
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const result = await adminGet<{ stats: DashboardStats }>("/api/admin/stats");
        setConsentsToday(result.stats.consentsToday || 0);
      } catch {
        // Silenciar error, mostrar 0
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Focus en el input al cargar
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = useCallback(async () => {
    if (!cedula.trim() || cedula.length < 6) return;

    setIsSearching(true);
    setSearchResult(null);

    try {
      const result = await adminGet<ConsentResult>(
        `/api/admin/verificar-consentimiento?cedula=${encodeURIComponent(cedula.trim())}`
      );
      setSearchResult(result);
    } catch {
      setSearchResult({ found: false });
    } finally {
      setIsSearching(false);
    }
  }, [cedula]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleClear = () => {
    setCedula("");
    setSearchResult(null);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-start pt-8 px-4 pb-20 lg:pb-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
          Visor de Verificación
        </h1>
        <p className="text-foreground/60 mt-2">
          Ingresa la cédula para verificar el consentimiento vigente
        </p>
      </div>

      {/* Contador simple */}
      <div className="w-full max-w-md mb-8">
        <StatCard
          title="Consentimientos Hoy"
          value={statsLoading ? "..." : consentsToday}
          icon={FileCheck}
        />
      </div>

      {/* Buscador Central */}
      <div className="w-full max-w-lg mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-foreground/40" />
          <input
            ref={inputRef}
            type="text"
            value={cedula}
            onChange={(e) => setCedula(e.target.value.replace(/\D/g, ""))}
            onKeyDown={handleKeyDown}
            placeholder="Ingresa número de cédula..."
            className="w-full pl-14 pr-4 py-4 text-xl bg-surface border-2 border-border rounded-2xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-foreground/40"
            maxLength={12}
            autoComplete="off"
          />
        </div>
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleSearch}
            disabled={isSearching || cedula.length < 6}
            className="flex-1 py-4 px-6 bg-primary text-background font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Verificar
              </>
            )}
          </button>
          {searchResult && (
            <button
              onClick={handleClear}
              className="py-4 px-6 bg-surface-muted text-foreground font-medium rounded-xl hover:bg-surface-muted/80 transition-all"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Resultado de búsqueda */}
      {searchResult && (
        <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
          {searchResult.found && searchResult.consent && !searchResult.isExpired ? (
            // ✅ CONSENTIMIENTO VIGENTE
            <Card className="border-2 border-green-500 bg-green-500/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-12 h-12 text-green-500" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-center text-green-500 mb-2">
                  CONSENTIMIENTO VIGENTE
                </h2>
                <div className="text-center space-y-3 mt-6">
                  <p className="text-xl font-semibold text-foreground">
                    {searchResult.consent.adultSnapshot.fullName}
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full">
                    <FileText className="w-4 h-4 text-green-400" />
                    <span className="font-mono text-lg text-green-400">
                      #{searchResult.consent.consecutivo}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-foreground/70">
                    <Baby className="w-5 h-5" />
                    <span className="text-lg">
                      {searchResult.consent.minorsSnapshot.length} menor(es) autorizado(s)
                    </span>
                  </div>
                  {searchResult.consent.minorsSnapshot.length > 0 && (
                    <div className="mt-4 p-3 bg-surface-muted rounded-lg">
                      <p className="text-sm text-foreground/60 mb-2">Menores:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {searchResult.consent.minorsSnapshot.map((minor, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm"
                          >
                            {minor.firstName} {minor.lastName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {searchResult.consent.pdfUrl && (
                  <a
                    href={searchResult.consent.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 w-full py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-all flex items-center justify-center gap-2"
                  >
                    <FileText className="w-5 h-5" />
                    Ver PDF del Consentimiento
                  </a>
                )}
              </CardContent>
            </Card>
          ) : (
            // ❌ SIN CONSENTIMIENTO O EXPIRADO
            <Card className="border-2 border-red-500 bg-red-500/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
                    <XCircle className="w-12 h-12 text-red-500" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-center text-red-500 mb-2">
                  {searchResult.isExpired 
                    ? "CONSENTIMIENTO VENCIDO" 
                    : "SIN CONSENTIMIENTO VIGENTE"
                  }
                </h2>
                <p className="text-center text-foreground/60 mt-4">
                  {searchResult.isExpired
                    ? "El consentimiento de este usuario ha expirado. Debe firmar uno nuevo."
                    : "No se encontró un consentimiento activo para esta cédula."
                  }
                </p>
                <div className="mt-6 p-4 bg-red-500/10 rounded-lg border border-red-500/30">
                  <p className="text-center text-red-400 font-medium">
                    ⚠️ El usuario debe completar el registro en el kiosco antes de ingresar.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

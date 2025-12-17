import useSWR from "swr";
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

interface ConsentsResponse {
  consents: Consent[];
  pagination: Pagination;
}

interface UseConsentsOptions {
  search?: string;
  offset?: number;
  limit?: number;
}

/**
 * Hook para obtener consentimientos con caché SWR.
 * Optimiza costos de lectura en Firestore mediante Stale-While-Revalidate.
 */
export function useConsents(options: UseConsentsOptions = {}) {
  const { search = "", offset = 0, limit = 20 } = options;

  // Construir la key de SWR basada en los parámetros
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });
  if (search) {
    params.set("search", search);
  }
  const key = `admin/consents?${params}`;

  const fetcher = async () => {
    return adminGet<ConsentsResponse>(`/api/${key}`);
  };

  const { data, error, isLoading, isValidating, mutate } = useSWR<ConsentsResponse>(
    key,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 60 segundos de deduplicación
      keepPreviousData: true, // Mantener datos previos mientras carga nuevos
    }
  );

  return {
    consents: data?.consents ?? [],
    pagination: data?.pagination ?? { total: 0, limit, offset, hasMore: false },
    isLoading,
    isValidating,
    error,
    mutate, // Para invalidar el caché manualmente si es necesario
  };
}

export type { Consent, Minor, Pagination, ConsentsResponse };

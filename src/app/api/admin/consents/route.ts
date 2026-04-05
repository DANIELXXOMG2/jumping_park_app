import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminTokenWithPermission } from "@/lib/adminAuth";
import { db } from "@/lib/firebaseAdmin";
import { normalizeText } from "@/lib/utils/searchUtils";
import { getConsentSignatureAccessUrl } from "@/services/consentService";
import type { Consent } from "@/types/firestore";

const querySchema = z.object({
	search: z.string().optional(),
	limit: z.coerce.number().min(1).max(100).default(20),
	offset: z.coerce.number().min(0).default(0),
	userId: z.string().optional(),
});

// Campos mínimos necesarios para la lista de consentimientos (optimiza lecturas)
const CONSENT_LIST_FIELDS = [
	"consecutivo",
	"userId",
	"adultSnapshot",
	"minorsSnapshot",
	"signedAt",
	"createdAt",
	"signaturePath",
	"signatureUrl",
	"policyVersion",
	"ipAddress",
	"validUntil",
] as const;

export async function GET(request: NextRequest) {
	try {
		// Verificar autenticación y permiso consents:view
		const authResult = await verifyAdminTokenWithPermission(request, "consents:view");
		if (!authResult.success) {
			return authResult.response;
		}

		const { searchParams } = new URL(request.url);

		const query = querySchema.parse({
			search: searchParams.get("search") || undefined,
			limit: searchParams.get("limit") || 20,
			offset: searchParams.get("offset") || 0,
			userId: searchParams.get("userId") || undefined,
		});

		// Helper para mapear documento a respuesta
		const mapConsent = async (doc: FirebaseFirestore.DocumentSnapshot) => {
			const data = doc.data();
			if (!data) return null;
			const consentData = data as Consent;
			return {
				id: doc.id,
				consecutivo: data.consecutivo,
				userId: data.userId,
				adultName: data.adultSnapshot?.fullName || "N/A",
				adultEmail: data.adultSnapshot?.email || "N/A",
				adultPhone: data.adultSnapshot?.phone || "N/A",
				minorsCount: data.minorsSnapshot?.length || 0,
				minors: data.minorsSnapshot || [],
				signaturePath: consentData.signaturePath || null,
				signatureUrl: await getConsentSignatureAccessUrl(consentData),
				policyVersion: data.policyVersion,
				ipAddress: data.ipAddress,
				createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
				signedAt: data.signedAt?.toDate?.()?.toISOString() || null,
				validUntil: data.validUntil?.toDate?.()?.toISOString() || null,
			};
		};
		type ConsentListItem = NonNullable<Awaited<ReturnType<typeof mapConsent>>>;

		// Filtrar por userId específico
		if (query.userId) {
			const snapshot = await db
				.collection("consents")
				.where("userId", "==", query.userId)
				.orderBy("createdAt", "desc")
				.select(...CONSENT_LIST_FIELDS)
				.get();

			const consents = (await Promise.all(snapshot.docs.map(mapConsent))).filter(Boolean);

			return NextResponse.json({
				consents,
				pagination: {
					total: consents.length,
					limit: query.limit,
					offset: 0,
					hasMore: false,
				},
			});
		}

		// Con búsqueda: usar estrategia optimizada según tipo de término
		if (query.search) {
			const searchTerm = query.search.trim();
			const searchNormalized = normalizeText(searchTerm);

			// CASO 1: Búsqueda por consecutivo (números cortos: 1-7 dígitos, ej: "1047" o "#1047")
			const consecutivoMatch = searchTerm.match(/^#?(\d{1,7})$/);
			if (consecutivoMatch) {
				const consecutivo = parseInt(consecutivoMatch[1], 10);
				const snapshot = await db
					.collection("consents")
					.where("consecutivo", "==", consecutivo)
					.select(...CONSENT_LIST_FIELDS)
					.limit(1)
					.get();

				const consents = (await Promise.all(snapshot.docs.map(mapConsent))).filter(Boolean);

				return NextResponse.json({
					consents,
					pagination: {
						total: consents.length,
						limit: query.limit,
						offset: 0,
						hasMore: false,
					},
				});
			}

			// CASO 2: Búsqueda por cédula (solo dígitos, 8+ caracteres)
			// Podría ser cédula de adulto (userId) o de menor (en searchTokens)
			// OPTIMIZADO: Reducido a limit(20) y agregado .select() para reducir lecturas
			if (/^\d{8,}$/.test(searchTerm)) {
				const [adultResult, minorResult] = await Promise.allSettled([
					db
						.collection("consents")
						.where("userId", "==", searchTerm)
						.select(...CONSENT_LIST_FIELDS)
						.limit(20)
						.get(),
					db
						.collection("consents")
						.where("searchTokens", "array-contains", searchTerm)
						.select(...CONSENT_LIST_FIELDS)
						.limit(20)
						.get(),
				]);

				if (adultResult.status === "rejected") {
					console.error("[consents] Error buscando por userId:", adultResult.reason);
				}
				if (minorResult.status === "rejected") {
					console.error("[consents] Error buscando por searchTokens:", minorResult.reason);
				}

				const consentMap = new Map<string, ConsentListItem>();

				if (adultResult.status === "fulfilled") {
					for (const doc of adultResult.value.docs) {
						const mapped = await mapConsent(doc);
						if (mapped) consentMap.set(doc.id, mapped);
					}
				}

				if (minorResult.status === "fulfilled") {
					for (const doc of minorResult.value.docs) {
						const mapped = await mapConsent(doc);
						if (mapped) consentMap.set(doc.id, mapped);
					}
				}

				const consents = Array.from(consentMap.values()).sort((a, b) => {
					const aDate = a?.signedAt ? new Date(a.signedAt) : new Date(0);
					const bDate = b?.signedAt ? new Date(b.signedAt) : new Date(0);
					return bDate.getTime() - aDate.getTime();
				});

				return NextResponse.json({
					consents,
					pagination: {
						total: consents.length,
						limit: query.limit,
						offset: 0,
						hasMore: false,
					},
				});
			}

			// CASO 3: Búsqueda por nombre usando searchTokens (con normalización de tildes)
			const searchWords = searchNormalized
				.split(/\s+/)
				.filter((w) => w.length >= 2);

			if (searchWords.length > 0) {
				const termsToSearch = searchWords.slice(0, 10);
				const fullToken = searchWords.join("");

				// Estrategia optimizada: Priorizar token completo, solo query amplia si es necesario
				// Query 1: Buscar token completo concatenado (más preciso, menos lecturas)
				const fullTokenSnapshot = await db
					.collection("consents")
					.where("searchTokens", "array-contains", fullToken)
					.select(...CONSENT_LIST_FIELDS)
					.limit(Math.max(query.limit * 2, 20))
					.get();

				// Combinar resultados sin duplicados
				const consentMap = new Map<string, ConsentListItem>();
				for (const doc of fullTokenSnapshot.docs) {
					const mapped = await mapConsent(doc);
					if (mapped) consentMap.set(doc.id, mapped);
				}

				// Solo si no hay suficientes resultados del token completo, buscar por palabras individuales
				if (consentMap.size < query.limit) {
					let tokenQuery: FirebaseFirestore.Query;

					if (termsToSearch.length === 1) {
						tokenQuery = db
							.collection("consents")
							.where("searchTokens", "array-contains", termsToSearch[0])
							.select(...CONSENT_LIST_FIELDS)
							.limit(50);
					} else {
						tokenQuery = db
							.collection("consents")
							.where("searchTokens", "array-contains-any", termsToSearch)
							.select(...CONSENT_LIST_FIELDS)
							.limit(100);
					}

					const snapshot = await tokenQuery.get();

					for (const doc of snapshot.docs) {
						if (!consentMap.has(doc.id)) {
							const mapped = await mapConsent(doc);
							if (mapped) consentMap.set(doc.id, mapped);
						}
					}
				}

				let consents = Array.from(consentMap.values()).filter(Boolean);

				// FILTRAR usando normalizeText para ignorar tildes
				if (searchWords.length > 1) {
					consents = consents.filter((consent) => {
						const nameNormalized = normalizeText(consent?.adultName || "");
						const emailNormalized = normalizeText(consent?.adultEmail || "");
						const combinedText = `${nameNormalized} ${emailNormalized}`;
						return searchWords.every((word) => combinedText.includes(word));
					});
				}

				// Ordenar por relevancia (usando normalizeText)
				consents = consents.sort((a, b) => {
					const aName = normalizeText(a?.adultName || "");
					const bName = normalizeText(b?.adultName || "");
					const aEmail = normalizeText(a?.adultEmail || "");
					const bEmail = normalizeText(b?.adultEmail || "");

					const getScore = (name: string, email: string): number => {
						let score = 0;
						if (name === searchNormalized) score += 1000;
						else if (name.startsWith(searchNormalized)) score += 500;
						else if (name.includes(searchNormalized)) score += 300;
						if (email === searchNormalized) score += 200;
						else if (email.startsWith(searchNormalized)) score += 100;
						else if (email.includes(searchNormalized)) score += 50;
						for (const word of searchWords) {
							if (name.startsWith(word)) score += 20;
							else if (name.includes(word)) score += 10;
							else if (email.includes(word)) score += 5;
						}
						return score;
					};

					const scoreA = getScore(aName, aEmail);
					const scoreB = getScore(bName, bEmail);

					if (scoreB !== scoreA) return scoreB - scoreA;
					return aName.length - bName.length;
				});

				const total = consents.length;
				const paginatedConsents = consents.slice(
					query.offset,
					query.offset + query.limit,
				);

				return NextResponse.json({
					consents: paginatedConsents,
					pagination: {
						total,
						limit: query.limit,
						offset: query.offset,
						hasMore: query.offset + query.limit < total,
					},
				});
			}

			// CASO 4: Fallback - buscar en últimos 100 (usando normalizeText)
			const snapshot = await db
				.collection("consents")
				.orderBy("createdAt", "desc")
				.select(...CONSENT_LIST_FIELDS)
				.limit(100)
				.get();

			const consents = (await Promise.all(snapshot.docs.map(mapConsent)))
				.filter(Boolean)
				.filter(
					(consent) =>
						normalizeText(consent?.adultName || "").includes(searchNormalized) ||
						normalizeText(consent?.adultEmail || "").includes(searchNormalized),
				);

			const total = consents.length;
			const paginatedConsents = consents.slice(
				query.offset,
				query.offset + query.limit,
			);

			return NextResponse.json({
				consents: paginatedConsents,
				pagination: {
					total,
					limit: query.limit,
					offset: query.offset,
					hasMore: query.offset + query.limit < total,
				},
			});
		}

		// Sin búsqueda: paginación real de Firestore (OPTIMIZADO)
		const [countSnap, snapshot] = await Promise.all([
			db.collection("consents").count().get(),
			db.collection("consents")
				.orderBy("createdAt", "desc")
				.select(...CONSENT_LIST_FIELDS)
				.offset(query.offset)
				.limit(query.limit)
				.get(),
		]);

		const total = countSnap.data().count;
		const consents = (await Promise.all(snapshot.docs.map(mapConsent))).filter(Boolean);

		return NextResponse.json({
			consents,
			pagination: {
				total,
				limit: query.limit,
				offset: query.offset,
				hasMore: query.offset + query.limit < total,
			},
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Parámetros inválidos", details: error.issues },
				{ status: 400 },
			);
		}
		console.error("[API Consents] Error:", error);
		return NextResponse.json(
			{ error: "Error al obtener consentimientos" },
			{ status: 500 },
		);
	}
}

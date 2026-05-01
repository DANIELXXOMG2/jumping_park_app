import { db } from "@/lib/firebaseAdmin";
import {
	getDateRangeColombia,
	getTodayStartColombia,
} from "@/lib/utils/dateUtils";
import {
	ADMIN_METRIC_FRESHNESS_SOURCE,
	ADMIN_METRIC_KIND,
	type AdminMetricDaily,
	type AdminMetricFreshness,
	type AdminMetricOverview,
	type AdminMetricUnknownDateBuckets,
	type ConsentDocument,
} from "@/types/firestore";

export const ADMIN_METRIC_PERIOD = {
	TODAY: "today",
	WEEK: "week",
	MONTH: "month",
	YEAR: "year",
	ALL: "all",
} as const;

export type AdminMetricPeriod =
	(typeof ADMIN_METRIC_PERIOD)[keyof typeof ADMIN_METRIC_PERIOD];

export interface AdminDetailedStats {
	period: AdminMetricPeriod;
	dateRange: {
		start: string;
		end: string;
	};
	kpis: {
		consents: { value: number; change: number; previousValue: number };
		users: { value: number; change: number; previousValue: number };
		minors: { value: number; change: number; previousValue: number };
		uniqueMinors: { value: number; label: string };
		activeConsents: { value: number; label: string };
		expiredConsents: { value: number; label: string };
	};
	totals: {
		users: number;
		consents: number;
		minors: number;
	};
	chartData: Array<{
		date: string;
		consents: number;
		users: number;
		minors: number;
	}>;
	topDays: Array<{ date: string; count: number }>;
	averages: {
		consentsPerDay: number;
		minorsPerConsent: number;
	};
	freshness: AdminMetricFreshness;
	unknownDateBuckets: AdminMetricUnknownDateBuckets;
}

interface DailyAccumulator {
	users: number;
	consents: number;
	minors: number;
	activeConsents: number;
	expiredConsents: number;
	minorIds: Set<string>;
}

const ADMIN_METRICS_COLLECTION = "admin_metrics";
const OVERVIEW_DOC_ID = "overview";
const DAILY_DOC_PREFIX = "daily:";
const ADMIN_METRICS_STALE_AFTER_MS = 5 * 60 * 1000;

interface AdminMetricsDocLike {
	id: string;
	ref: Pick<FirebaseFirestore.DocumentReference, "delete">;
	get: (field: string) => unknown;
}

interface AdminMetricsQuerySnapshotLike {
	docs: AdminMetricsDocLike[];
	size: number;
}

interface AdminMetricsCountSnapshotLike {
	data: () => { count: number };
}

interface AdminMetricsDocRefLike {
	id: string;
	set: (
		data: FirebaseFirestore.DocumentData,
		options?: FirebaseFirestore.SetOptions,
	) => Promise<unknown>;
	get: () => Promise<{
		exists: boolean;
		data: () => unknown;
	}>;
}

interface AdminMetricsCollectionLike {
	select: (...fields: string[]) => AdminMetricsCollectionLike;
	orderBy: (
		fieldPath: string,
		directionStr?: FirebaseFirestore.OrderByDirection,
	) => AdminMetricsCollectionLike;
	limit: (limit: number) => AdminMetricsCollectionLike;
	where: (
		fieldPath: string,
		opStr: FirebaseFirestore.WhereFilterOp,
		value: unknown,
	) => Pick<AdminMetricsCollectionLike, "get">;
	count: () => { get: () => Promise<AdminMetricsCountSnapshotLike> };
	doc: (id: string) => AdminMetricsDocRefLike;
	get: () => Promise<AdminMetricsQuerySnapshotLike>;
}

export interface AdminMetricsDbLike {
	collection: (name: string) => AdminMetricsCollectionLike;
	getAll: (
		...documentRefs: AdminMetricsDocRefLike[]
	) => Promise<Array<{ data: () => unknown }>>;
}

export const EMPTY_ADMIN_UNKNOWN_DATE_BUCKETS: AdminMetricUnknownDateBuckets = {
	users: 0,
	consents: 0,
} as const;

export function normalizeAdminUnknownDateBuckets(
	value: Partial<AdminMetricUnknownDateBuckets> | undefined,
): AdminMetricUnknownDateBuckets {
	return {
		users: value?.users ?? EMPTY_ADMIN_UNKNOWN_DATE_BUCKETS.users,
		consents: value?.consents ?? EMPTY_ADMIN_UNKNOWN_DATE_BUCKETS.consents,
	};
}

function createDailyAccumulator(): DailyAccumulator {
	return {
		users: 0,
		consents: 0,
		minors: 0,
		activeConsents: 0,
		expiredConsents: 0,
		minorIds: new Set<string>(),
	};
}

function formatDateKey(date: Date): string {
	return date.toISOString().split("T")[0] ?? "";
}

function getDailyDocId(dateKey: string): string {
	return `${DAILY_DOC_PREFIX}${dateKey}`;
}

function parseFreshnessDate(
	freshness: AdminMetricFreshness | undefined,
): number | null {
	if (!freshness?.computedAt) {
		return null;
	}

	const value = new Date(freshness.computedAt).getTime();
	return Number.isNaN(value) ? null : value;
}

function isFreshEnough(freshness: AdminMetricFreshness | undefined): boolean {
	const computedAtMs = parseFreshnessDate(freshness);
	if (computedAtMs === null) {
		return false;
	}

	return Date.now() - computedAtMs <= ADMIN_METRICS_STALE_AFTER_MS;
}

function buildFreshness(computedAt: string): AdminMetricFreshness {
	return {
		computedAt,
		source: ADMIN_METRIC_FRESHNESS_SOURCE.AGGREGATE,
		stale: false,
	};
}

function toIsoString(value: unknown): string | null {
	if (value instanceof Date) {
		return value.toISOString();
	}

	if (typeof value === "object" && value !== null && "toDate" in value) {
		const typedValue = value as { toDate?: () => Date };
		const date = typedValue.toDate?.();
		return date instanceof Date ? date.toISOString() : null;
	}

	return null;
}

function toDate(value: unknown): Date | null {
	if (value instanceof Date) {
		return value;
	}

	if (typeof value === "object" && value !== null && "toDate" in value) {
		const typedValue = value as { toDate?: () => Date };
		const date = typedValue.toDate?.();
		return date instanceof Date ? date : null;
	}

	return null;
}

function readString(value: unknown, fallback: string): string {
	return typeof value === "string" ? value : fallback;
}

function readNumber(value: unknown, fallback = 0): number {
	return typeof value === "number" ? value : fallback;
}

function readMinorSnapshotCount(value: unknown): number {
	return Array.isArray(value) ? value.length : 0;
}

function readAdultName(value: unknown): string {
	if (typeof value === "object" && value !== null && "fullName" in value) {
		const fullName = (value as { fullName?: unknown }).fullName;
		return typeof fullName === "string" ? fullName : "N/A";
	}

	return "N/A";
}

function calculateChange(current: number, previous: number): number {
	if (previous === 0) {
		return current > 0 ? 100 : 0;
	}

	return Math.round(((current - previous) / previous) * 100);
}

function getPreviousPeriodRange(period: AdminMetricPeriod): {
	start: Date;
	end: Date;
} {
	const { start: currentStart, end: currentEnd } = getDateRangeColombia(period);
	const duration = currentEnd.getTime() - currentStart.getTime();

	return {
		start: new Date(currentStart.getTime() - duration),
		end: new Date(currentStart.getTime() - 1),
	};
}

function listDateKeys(start: Date, end: Date): string[] {
	const keys: string[] = [];
	const cursor = new Date(start);

	while (cursor <= end) {
		keys.push(formatDateKey(cursor));
		cursor.setUTCDate(cursor.getUTCDate() + 1);
	}

	return keys;
}

function hydrateDailyMetric(
	dateKey: string,
	value?: Partial<AdminMetricDaily>,
): AdminMetricDaily {
	return {
		kind: ADMIN_METRIC_KIND.DAILY,
		dateKey,
		counts: {
			users: value?.counts?.users ?? 0,
			consents: value?.counts?.consents ?? 0,
			minors: value?.counts?.minors ?? 0,
			activeConsents: value?.counts?.activeConsents ?? 0,
			expiredConsents: value?.counts?.expiredConsents ?? 0,
		},
		minorIds: value?.minorIds ?? [],
		freshness: value?.freshness ?? buildFreshness(new Date(0).toISOString()),
	};
}

export function buildDetailedAggregateStats(options: {
	period: AdminMetricPeriod;
	overview: AdminMetricOverview;
	currentDaily: AdminMetricDaily[];
	previousDaily: AdminMetricDaily[];
	start: Date;
	end: Date;
}): AdminDetailedStats {
	const now = new Date();
	const currentTotals = options.currentDaily.reduce(
		(accumulator, item) => {
			accumulator.consents += item.counts.consents;
			accumulator.users += item.counts.users;
			accumulator.minors += item.counts.minors;
			accumulator.activeConsents += item.counts.activeConsents;
			accumulator.expiredConsents += item.counts.expiredConsents;
			item.minorIds.forEach((minorId) => {
				accumulator.minorIds.add(minorId);
			});
			return accumulator;
		},
		{
			consents: 0,
			users: 0,
			minors: 0,
			activeConsents: 0,
			expiredConsents: 0,
			minorIds: new Set<string>(),
		},
	);

	const previousTotals = options.previousDaily.reduce(
		(accumulator, item) => {
			accumulator.consents += item.counts.consents;
			accumulator.users += item.counts.users;
			accumulator.minors += item.counts.minors;
			return accumulator;
		},
		{ consents: 0, users: 0, minors: 0 },
	);

	const dayActivity = Object.fromEntries(
		options.currentDaily.map((item) => [item.dateKey, item.counts]),
	);

	const daysToShow =
		options.period === ADMIN_METRIC_PERIOD.TODAY
			? 1
			: options.period === ADMIN_METRIC_PERIOD.WEEK
				? 7
				: options.period === ADMIN_METRIC_PERIOD.MONTH
					? 30
					: options.period === ADMIN_METRIC_PERIOD.YEAR
						? 12
						: 30;

	const chartData: AdminDetailedStats["chartData"] = [];
	if (options.period === ADMIN_METRIC_PERIOD.YEAR) {
		for (let index = 11; index >= 0; index -= 1) {
			const monthStart = new Date(now.getFullYear(), now.getMonth() - index, 1);
			const monthKey = monthStart.toISOString().slice(0, 7);

			let consents = 0;
			let users = 0;
			let minors = 0;

			for (const item of options.currentDaily) {
				if (item.dateKey.startsWith(monthKey)) {
					consents += item.counts.consents;
					users += item.counts.users;
					minors += item.counts.minors;
				}
			}

			chartData.push({
				date: monthStart.toLocaleDateString("es-CO", {
					month: "short",
					year: "2-digit",
				}),
				consents,
				users,
				minors,
			});
		}
	} else {
		for (let index = daysToShow - 1; index >= 0; index -= 1) {
			const dayStart = new Date(now.getTime() - index * 24 * 60 * 60 * 1000);
			const dayKey = formatDateKey(dayStart);
			const counts = dayActivity[dayKey];

			chartData.push({
				date: dayStart.toLocaleDateString("es-CO", {
					day: "2-digit",
					month: "short",
				}),
				consents: counts?.consents ?? 0,
				users: counts?.users ?? 0,
				minors: counts?.minors ?? 0,
			});
		}
	}

	const topDays = options.currentDaily
		.slice()
		.sort((left, right) => right.counts.consents - left.counts.consents)
		.slice(0, 5)
		.map((item) => ({
			date: new Date(item.dateKey).toLocaleDateString("es-CO", {
				weekday: "short",
				day: "numeric",
				month: "short",
			}),
			count: item.counts.consents,
		}));

	return {
		period: options.period,
		dateRange: {
			start: options.start.toISOString(),
			end: options.end.toISOString(),
		},
		kpis: {
			consents: {
				value: currentTotals.consents,
				change: calculateChange(
					currentTotals.consents,
					previousTotals.consents,
				),
				previousValue: previousTotals.consents,
			},
			users: {
				value: currentTotals.users,
				change: calculateChange(currentTotals.users, previousTotals.users),
				previousValue: previousTotals.users,
			},
			minors: {
				value: currentTotals.minors,
				change: calculateChange(currentTotals.minors, previousTotals.minors),
				previousValue: previousTotals.minors,
			},
			uniqueMinors: {
				value: currentTotals.minorIds.size,
				label: "Participantes únicos",
			},
			activeConsents: {
				value: currentTotals.activeConsents,
				label: "Vigentes",
			},
			expiredConsents: {
				value: currentTotals.expiredConsents,
				label: "Vencidos",
			},
		},
		totals: {
			users: options.overview.stats.totalUsers,
			consents: options.overview.stats.totalConsents,
			minors: options.overview.stats.totalMinors,
		},
		chartData,
		topDays,
		averages: {
			consentsPerDay:
				daysToShow > 0
					? Math.round((currentTotals.consents / daysToShow) * 10) / 10
					: 0,
			minorsPerConsent:
				currentTotals.consents > 0
					? Math.round((currentTotals.minors / currentTotals.consents) * 10) /
						10
					: 0,
		},
		freshness: options.overview.freshness,
		unknownDateBuckets: normalizeAdminUnknownDateBuckets(
			options.overview.unknownDateBuckets,
		),
	};
}

async function readOverviewDoc(): Promise<AdminMetricOverview | null> {
	const snapshot = await db
		.collection(ADMIN_METRICS_COLLECTION)
		.doc(OVERVIEW_DOC_ID)
		.get();
	if (!snapshot.exists) {
		return null;
	}

	return snapshot.data() as AdminMetricOverview;
}

async function readDailyDocs(dateKeys: string[]): Promise<AdminMetricDaily[]> {
	if (dateKeys.length === 0) {
		return [];
	}

	const refs = dateKeys.map((dateKey) =>
		db.collection(ADMIN_METRICS_COLLECTION).doc(getDailyDocId(dateKey)),
	);
	const snapshots = await db.getAll(...refs);

	return snapshots.map((snapshot, index) =>
		hydrateDailyMetric(
			dateKeys[index] ?? "",
			snapshot.data() as Partial<AdminMetricDaily>,
		),
	);
}

export async function recomputeAdminMetricsWithDb(
	metricsDb: AdminMetricsDbLike,
): Promise<AdminMetricOverview> {
	const now = new Date();
	const computedAt = now.toISOString();
	const todayStart = getTodayStartColombia();
	const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
	const weekStart = new Date(todayStart);
	weekStart.setUTCDate(weekStart.getUTCDate() - 6);

	const [
		usersSnapshot,
		consentsSnapshot,
		minorsCountSnap,
		recentUsersSnap,
		recentConsentsSnap,
	] = await Promise.all([
		metricsDb.collection("users").select("createdAt").get(),
		metricsDb
			.collection("consents")
			.select("signedAt", "createdAt", "minorsSnapshot", "validUntil")
			.get(),
		metricsDb.collection("minors_index").count().get(),
		metricsDb
			.collection("users")
			.select("uid", "fullName", "email", "createdAt")
			.orderBy("createdAt", "desc")
			.limit(5)
			.get(),
		metricsDb
			.collection("consents")
			.select(
				"consecutivo",
				"adultSnapshot",
				"minorsSnapshot",
				"createdAt",
				"signedAt",
			)
			.orderBy("createdAt", "desc")
			.limit(5)
			.get(),
	]);

	const dailyMap = new Map<string, DailyAccumulator>();
	const unknownDateBuckets: AdminMetricUnknownDateBuckets = {
		users: 0,
		consents: 0,
	};

	for (const userDoc of usersSnapshot.docs) {
		const createdAt = toDate(userDoc.get("createdAt"));
		if (!createdAt) {
			unknownDateBuckets.users += 1;
			continue;
		}

		const dateKey = formatDateKey(createdAt);
		const currentDay = dailyMap.get(dateKey) ?? createDailyAccumulator();
		currentDay.users += 1;
		dailyMap.set(dateKey, currentDay);
	}

	for (const consentDoc of consentsSnapshot.docs) {
		const signedAt =
			toDate(consentDoc.get("signedAt")) ?? toDate(consentDoc.get("createdAt"));
		if (!signedAt) {
			unknownDateBuckets.consents += 1;
			continue;
		}

		const dateKey = formatDateKey(signedAt);
		const currentDay = dailyMap.get(dateKey) ?? createDailyAccumulator();
		const minorsSnapshot = Array.isArray(consentDoc.get("minorsSnapshot"))
			? (consentDoc.get("minorsSnapshot") as Array<{ idNumber?: string }>)
			: [];
		const minorsCount = minorsSnapshot.length;

		currentDay.consents += 1;
		currentDay.minors += minorsCount;

		for (const minor of minorsSnapshot) {
			if (minor.idNumber) {
				currentDay.minorIds.add(minor.idNumber);
			}
		}

		const validUntil = toDate(consentDoc.get("validUntil"));
		if (validUntil && validUntil > now) {
			currentDay.activeConsents += 1;
		} else {
			currentDay.expiredConsents += 1;
		}

		dailyMap.set(dateKey, currentDay);
	}

	const batchOperations: Array<() => Promise<void>> = [];
	const existingDailyDocs = await metricsDb
		.collection(ADMIN_METRICS_COLLECTION)
		.where("kind", "==", ADMIN_METRIC_KIND.DAILY)
		.get();
	const nextDailyDocIds = new Set<string>();

	for (const [dateKey, value] of dailyMap.entries()) {
		const docId = getDailyDocId(dateKey);
		nextDailyDocIds.add(docId);
		batchOperations.push(async () => {
			await metricsDb
				.collection(ADMIN_METRICS_COLLECTION)
				.doc(docId)
				.set(
					{
						kind: ADMIN_METRIC_KIND.DAILY,
						dateKey,
						counts: {
							users: value.users,
							consents: value.consents,
							minors: value.minors,
							activeConsents: value.activeConsents,
							expiredConsents: value.expiredConsents,
						},
						minorIds: Array.from(value.minorIds),
						freshness: buildFreshness(computedAt),
						updatedAt: now,
					},
					{ merge: true },
				);
		});
	}

	for (const snapshot of existingDailyDocs.docs) {
		if (!nextDailyDocIds.has(snapshot.id)) {
			batchOperations.push(async () => {
				await snapshot.ref.delete();
			});
		}
	}

	for (const operation of batchOperations) {
		await operation();
	}

	const weeklyChartData = dayNames.map((dayName, index) => {
		const currentDate = new Date(weekStart);
		currentDate.setUTCDate(weekStart.getUTCDate() + index);
		const counts = dailyMap.get(formatDateKey(currentDate));

		return {
			name: dayName,
			value: counts?.consents ?? 0,
		};
	});

	const overview: AdminMetricOverview = {
		kind: ADMIN_METRIC_KIND.OVERVIEW,
		stats: {
			totalUsers: usersSnapshot.size,
			totalConsents: consentsSnapshot.size,
			totalMinors: minorsCountSnap.data().count,
			usersToday: dailyMap.get(formatDateKey(todayStart))?.users ?? 0,
			consentsToday: dailyMap.get(formatDateKey(todayStart))?.consents ?? 0,
			minorsToday: dailyMap.get(formatDateKey(todayStart))?.minors ?? 0,
		},
		recentUsers: recentUsersSnap.docs.map((doc) => ({
			id: doc.id,
			uid:
				typeof doc.get("uid") === "string"
					? (doc.get("uid") as string)
					: undefined,
			fullName: readString(doc.get("fullName"), "N/A"),
			email: readString(doc.get("email"), "N/A"),
			createdAt: toIsoString(doc.get("createdAt")),
		})),
		recentConsents: recentConsentsSnap.docs.map((doc) => ({
			id: doc.id,
			consecutivo: readNumber(doc.get("consecutivo")),
			adultName: readAdultName(doc.get("adultSnapshot")),
			minorsCount: readMinorSnapshotCount(doc.get("minorsSnapshot")),
			createdAt: toIsoString(doc.get("createdAt")),
			signedAt: toIsoString(doc.get("signedAt")),
		})),
		chartData: weeklyChartData,
		freshness: buildFreshness(computedAt),
		unknownDateBuckets,
		updatedAt: now,
	};

	await metricsDb
		.collection(ADMIN_METRICS_COLLECTION)
		.doc(OVERVIEW_DOC_ID)
		.set(overview, {
			merge: true,
		});

	return overview;
}

async function recomputeAdminMetrics(): Promise<AdminMetricOverview> {
	return recomputeAdminMetricsWithDb(db as unknown as AdminMetricsDbLike);
}

async function ensureOverview(options?: {
	forceRecompute?: boolean;
}): Promise<AdminMetricOverview> {
	const overview = await readOverviewDoc();
	if (
		options?.forceRecompute ||
		!overview ||
		!isFreshEnough(overview.freshness)
	) {
		return recomputeAdminMetrics();
	}

	return overview;
}

export const adminMetricsService = {
	async getOverview(options?: {
		forceRecompute?: boolean;
	}): Promise<AdminMetricOverview> {
		return ensureOverview(options);
	},

	async getDetailed(
		period: AdminMetricPeriod,
		options?: { forceRecompute?: boolean },
	): Promise<AdminDetailedStats> {
		const overview = await ensureOverview(options);
		const { start, end } = getDateRangeColombia(period);
		const previousRange = getPreviousPeriodRange(period);
		const [currentDaily, previousDaily] = await Promise.all([
			readDailyDocs(listDateKeys(start, end)),
			readDailyDocs(listDateKeys(previousRange.start, previousRange.end)),
		]);

		return buildDetailedAggregateStats({
			period,
			overview,
			currentDaily,
			previousDaily,
			start,
			end,
		});
	},

	async getAdminActivity(): Promise<{
		consentsToday: number;
		minorsToday: number;
		latestConsents: Array<{
			id: string;
			consecutivo?: number;
			adultName: string;
			minorsCount: number;
			signedAt: string | null;
		}>;
		hourlyData: Array<{ hour: number; label: string; count: number }>;
	}> {
		const todayStart = getTodayStartColombia();

		const [todaySnapshot, latestSnapshot] = await Promise.all([
			db
				.collection("consents")
				.where("signedAt", ">=", todayStart)
				.select("signedAt", "minorsSnapshot")
				.limit(1000)
				.get(),
			db
				.collection("consents")
				.orderBy("signedAt", "desc")
				.limit(10)
				.select("consecutivo", "signedAt", "adultSnapshot", "minorsSnapshot")
				.get(),
		]);

		let minorsToday = 0;
		const hourlyStats: Record<number, number> = {};

		todaySnapshot.docs.forEach((doc) => {
			const data = doc.data() as ConsentDocument;
			minorsToday += data.minorsSnapshot?.length || 0;

			if (data.signedAt) {
				const signedDate =
					data.signedAt instanceof Date
						? data.signedAt
						: (data.signedAt as unknown as { toDate(): Date }).toDate();
				const hour = signedDate.getHours();
				hourlyStats[hour] = (hourlyStats[hour] || 0) + 1;
			}
		});

		const latestConsents = latestSnapshot.docs.map((doc) => {
			const data = doc.data() as ConsentDocument;

			let signedAt: string | null = null;
			if (data.signedAt) {
				if (data.signedAt instanceof Date) {
					signedAt = data.signedAt.toISOString();
				} else if (typeof (data.signedAt as unknown as { toDate?(): Date }).toDate === "function") {
					signedAt = (data.signedAt as unknown as { toDate(): Date }).toDate().toISOString();
				}
			}

			return {
				id: doc.id,
				consecutivo: data.consecutivo,
				adultName: data.adultSnapshot?.fullName || "N/A",
				minorsCount: data.minorsSnapshot?.length || 0,
				signedAt,
			};
		});

		const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
			hour,
			label: `${hour.toString().padStart(2, "0")}:00`,
			count: hourlyStats[hour] || 0,
		})).filter((h) => h.hour >= 8 && h.hour <= 22);

		return {
			consentsToday: todaySnapshot.size,
			minorsToday,
			latestConsents,
			hourlyData,
		};
	},
};

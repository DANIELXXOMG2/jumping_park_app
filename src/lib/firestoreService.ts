import type { DocumentData, DocumentSnapshot, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { db, admin } from './firebaseAdmin';
import type { Consent, OtpRecord, UserProfile } from '@/types/firestore';

type BaseDoc = DocumentData;
type WithId<T extends BaseDoc> = T & { id: string };

type FirestoreCollectionMap = {
  usuarios: UserProfile;
  consentimientos: Consent;
  otps: OtpRecord;
};

type KnownCollection = keyof FirestoreCollectionMap;
type Snapshot = DocumentSnapshot<BaseDoc> | QueryDocumentSnapshot<BaseDoc>;

const snapshotWithId = <T extends BaseDoc>(snapshot: Snapshot): WithId<T> => {
  const data = snapshot.data();
  if (!data) {
    throw new Error(`Documento sin datos en la ruta ${snapshot.ref.path}`);
  }
  return { id: snapshot.id, ...(data as T) };
};

export function createDoc<C extends KnownCollection>(
  collection: C,
  data: FirestoreCollectionMap[C],
  id?: string,
): Promise<WithId<FirestoreCollectionMap[C]>>;
export function createDoc<T extends BaseDoc>(collection: string, data: T, id?: string): Promise<WithId<T>>;
export async function createDoc<T extends BaseDoc>(collection: string, data: T, id?: string): Promise<WithId<T>> {
  const colRef = db.collection(collection);
  const docRef = id ? colRef.doc(id) : colRef.doc();
  const payload: BaseDoc = {
    ...data,
    creado_en: admin.firestore.FieldValue.serverTimestamp(),
  };
  await docRef.set(payload);
  const freshSnap = await docRef.get();
  return snapshotWithId<T>(freshSnap);
}

export async function getDocs<C extends KnownCollection>(
  collection: C,
  limit?: number,
): Promise<Array<WithId<FirestoreCollectionMap[C]>>>;
export async function getDocs<T extends BaseDoc>(collection: string, limit?: number): Promise<Array<WithId<T>>>;
export async function getDocs<T extends BaseDoc>(collection: string, limit = 100): Promise<Array<WithId<T>>> {
  const colRef = db.collection(collection);
  const query = colRef.orderBy('creado_en', 'desc').limit(limit);
  const snap = await query.get();
  return snap.docs.map((docSnap) => snapshotWithId<T>(docSnap));
}

export function getDocById<C extends KnownCollection>(
  collection: C,
  id: string,
): Promise<WithId<FirestoreCollectionMap[C]> | null>;
export function getDocById<T extends BaseDoc>(collection: string, id: string): Promise<WithId<T> | null>;
export async function getDocById<T extends BaseDoc>(collection: string, id: string): Promise<WithId<T> | null> {
  const doc = await db.collection(collection).doc(id).get();
  if (!doc.exists) return null;
  return snapshotWithId<T>(doc);
}

export function updateDoc<C extends KnownCollection>(
  collection: C,
  id: string,
  data: Partial<FirestoreCollectionMap[C]>,
): Promise<WithId<FirestoreCollectionMap[C]>>;
export function updateDoc<T extends BaseDoc>(collection: string, id: string, data: Partial<T>): Promise<WithId<T>>;
export async function updateDoc<T extends BaseDoc>(collection: string, id: string, data: Partial<T>): Promise<WithId<T>> {
  const ref = db.collection(collection).doc(id);
  await ref.update({
    ...data,
    actualizado_en: admin.firestore.FieldValue.serverTimestamp(),
  });
  const updated = await ref.get();
  return snapshotWithId<T>(updated);
}

export async function deleteDoc(collection: string, id: string) {
  await db.collection(collection).doc(id).delete();
  return { id };
}

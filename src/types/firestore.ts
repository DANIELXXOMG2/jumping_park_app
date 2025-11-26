import type { Timestamp } from 'firebase-admin/firestore';

// Valores compatibles con Timestamp de Firestore para entornos Admin/Cliente.
export type FirestoreDateValue = Date | Timestamp;

// 1. Colección 'users'
export interface Minor {
  fullName: string;
  birthDate: string; // ISO YYYY-MM-DD
  relationship: 'hijo' | 'sobrino' | 'nieto' | 'otro';
  // Optional additional fields captured from the consent form
  eps?: string;
  idType?: 'cc' | 'ti' | 'passport' | 'otro';
  idNumber?: string;
}

export interface UserProfile {
  uid: string; // La cédula
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  minors: Minor[];
  createdAt: Date;
  updatedAt: Date;
}

// 2. Colección 'consents'
export interface Consent {
  id: string;
  consecutivo: number;
  userId: string;
  adultSnapshot: UserProfile;
  minorsSnapshot: Minor[];
  signatureUrl: string;
  policyVersion: string;
  ipAddress?: string;
  signedAt: Date;
  validUntil: Date;
}

// 3. Colección 'otps'
export interface OtpRecord {
  email: string;
  code: string;
  expiresAt: Date;
  attempts: number;
}

export interface TravelDocumentData {
  // Required Visa & Passport particulars
  visaNumber: string;
  dateOfIssue: string;
  validUntil: string;
  durationOfStay: string;
  passportNumber: string;
  placeOfIssue: string;
  name: string;
  dateOfBirth: string;
  nationality: string;
  typeOfVisa: string;
  umrahOperator: string;
  externalAgent: string;

  // Additional metadata
  applicantPhotoUrl?: string;
  barcode?: string;
  notes?: string;
}

export type KeyStatus = 'active' | 'standby' | 'quota_exhausted' | 'invalid' | 'untested';

export interface GeminiKeyConfig {
  id: number;
  key: string;
  label: string;
  status: KeyStatus;
  lastUsed?: number;
  errorCount: number;
  lastError?: string;
}

export interface ExtractionLog {
  id: string;
  timestamp: string;
  keyUsedLabel: string;
  keyIndex: number;
  status: 'success' | 'quota_failover' | 'error' | 'info';
  message: string;
}

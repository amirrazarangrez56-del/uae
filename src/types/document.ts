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

export type RoomStatus = 'available' | 'checked_in' | 'checked_out' | 'cleaning' | 'maintenance';

export type PaymentMode = 'Cash' | 'Card';
export type PaymentStatus = 'Paid' | 'Pending' | 'Partial';

export interface RoomPaymentInfo {
  mode: PaymentMode;
  status: PaymentStatus;
  currency: string; // Defaults to 'SAR'
  totalAmount: number | string; // Manually typed in SAR
  amountPaid: number | string; // Manually typed in SAR
  balanceDue: number | string; // in SAR
  transactionRef?: string;
  notes?: string;
}

export interface GuestEntry {
  id: string;
  name: string;
  phoneNumber?: string;
  email?: string;
  nationality?: string;
  docType?: string;
  docNumber?: string;
  documentImageUrl?: string;
  parsedData: TravelDocumentData;
  isPrimary?: boolean;
}

export interface HotelRoom {
  id: string;
  roomNumber: string;
  roomType: string;
  floor: number | string;
  maxCapacity: number; // Configurable per room, e.g. 1 to 10
  pricePerNight: number | string; // in SAR
  status: RoomStatus;
  
  // Check-In & Check-Out Details
  checkInDate?: string; // YYYY-MM-DD
  checkInTime?: string; // e.g. 14:00 or formatted timestamp
  checkOutDate?: string; // YYYY-MM-DD
  checkOutTime?: string; // e.g. 12:00
  nights?: number;

  // Manual payment in SAR
  payment: RoomPaymentInfo;

  // Bulk guest entries for this room
  guests: GuestEntry[];

  notes?: string;
}

// Backwards compatibility interface for existing references
export interface DemoGuestProfile {
  id: string;
  roomNumber: string;
  roomType: string;
  guestName: string;
  phoneNumber?: string;
  nationality: string;
  docType: 'UAE Golden Visa' | 'Tourist Visa' | 'Umrah Pilgrim Visa' | 'Diplomatic Passport' | string;
  docNumber: string;
  durationOfStay: string;
  documentImageUrl: string;
  status: RoomStatus;
  checkInTime?: string;
  checkInDate?: string;
  checkOutDate?: string;
  checkOutTime?: string;
  maxCapacity?: number;
  payment?: RoomPaymentInfo;
  guests?: GuestEntry[];
  notes?: string;
  parsedData: TravelDocumentData;
}


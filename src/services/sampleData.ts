import type { TravelDocumentData, DemoGuestProfile, HotelRoom } from '../types/document';

export const EMPTY_DOCUMENT: TravelDocumentData = {
  visaNumber: '',
  dateOfIssue: '',
  validUntil: '',
  durationOfStay: '',
  passportNumber: '',
  placeOfIssue: '',
  name: '',
  dateOfBirth: '',
  nationality: '',
  typeOfVisa: '',
  umrahOperator: '',
  externalAgent: '',
  applicantPhotoUrl: '',
  barcode: '',
  notes: ''
};

// SVG Graphic generator for UAE Golden Visa document
export function generateUaeVisaSvg(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" width="800" height="520">
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#b45309"/>
        <stop offset="50%" stop-color="#f59e0b"/>
        <stop offset="100%" stop-color="#d97706"/>
      </linearGradient>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="100%" stop-color="#f8fafc"/>
      </linearGradient>
      <pattern id="guilloche" width="40" height="40" patternUnits="userSpaceOnUse">
        <circle cx="20" cy="20" r="18" fill="none" stroke="#e2e8f0" stroke-width="0.75" opacity="0.6"/>
        <circle cx="20" cy="20" r="10" fill="none" stroke="#cbd5e1" stroke-width="0.5" opacity="0.5"/>
      </pattern>
    </defs>

    <!-- Card Background -->
    <rect width="800" height="520" rx="16" fill="url(#bgGrad)" stroke="#cbd5e1" stroke-width="2"/>
    <rect x="12" y="12" width="776" height="496" rx="12" fill="url(#guilloche)" />
    <rect x="12" y="12" width="776" height="496" rx="12" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="6,4"/>

    <!-- Header Flag & Gold Header -->
    <rect x="30" y="30" width="740" height="70" rx="8" fill="#0f172a"/>
    <rect x="30" y="96" width="740" height="4" fill="url(#goldGrad)"/>
    
    <!-- Top Emblems -->
    <circle cx="70" cy="65" r="22" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>
    <text x="70" y="71" font-family="sans-serif" font-size="20" text-anchor="middle" fill="#f59e0b">★</text>

    <!-- Header Texts -->
    <text x="110" y="55" font-family="'Outfit', sans-serif" font-weight="bold" font-size="19" fill="#ffffff" letter-spacing="1">UNITED ARAB EMIRATES</text>
    <text x="110" y="80" font-family="'Noto Sans Arabic', sans-serif" font-size="14" fill="#cbd5e1">الهيئة الاتحادية للهوية والجنسية والجمارك وأمن المنافذ</text>
    <text x="740" y="55" font-family="'Outfit', sans-serif" font-weight="bold" font-size="14" fill="#f59e0b" text-anchor="end">GOLDEN RESIDENCE VISA</text>
    <text x="740" y="78" font-family="'Noto Sans Arabic', sans-serif" font-size="13" fill="#ffffff" text-anchor="end">إقامة المستثمر والمواهب الذهبية</text>

    <!-- Photo Area -->
    <g transform="translate(45, 125)">
      <rect width="140" height="180" rx="8" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1.5"/>
      <circle cx="70" cy="70" r="38" fill="#cbd5e1"/>
      <path d="M25,165 C25,115 115,115 115,165 Z" fill="#94a3b8"/>
      <rect x="10" y="195" width="120" height="24" rx="4" fill="#0f172a"/>
      <text x="70" y="211" font-family="sans-serif" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">VERIFIED GUEST</text>
    </g>

    <!-- Document Info Fields -->
    <g transform="translate(210, 125)" font-family="'Inter', sans-serif">
      <!-- Full Name -->
      <text x="0" y="18" font-size="11" fill="#64748b">FULL NAME / الاسم الكامل</text>
      <text x="0" y="42" font-size="18" font-weight="bold" fill="#0f172a">MOHAMMED AL HASHIMI</text>
      <text x="0" y="62" font-family="'Noto Sans Arabic', sans-serif" font-size="14" fill="#334155">محمد الهاشمي</text>

      <!-- Grid Column 1 -->
      <text x="0" y="100" font-size="10" fill="#64748b">VISA NUMBER / رقم التأشيرة</text>
      <text x="0" y="120" font-family="'IBM Plex Mono', monospace" font-size="16" font-weight="bold" fill="#b45309">201/2024/778921</text>

      <text x="0" y="152" font-size="10" fill="#64748b">NATIONALITY / الجنسية</text>
      <text x="0" y="172" font-size="14" font-weight="bold" fill="#0f172a">UNITED ARAB EMIRATES</text>

      <text x="0" y="204" font-size="10" fill="#64748b">DATE OF ISSUE / تاريخ الإصدار</text>
      <text x="0" y="224" font-family="'IBM Plex Mono', monospace" font-size="13" font-weight="600" fill="#334155">2024-01-15</text>

      <!-- Grid Column 2 -->
      <g transform="translate(270, 0)">
        <text x="0" y="100" font-size="10" fill="#64748b">PASSPORT NO / رقم الجواز</text>
        <text x="0" y="120" font-family="'IBM Plex Mono', monospace" font-size="16" font-weight="bold" fill="#0f172a">N8830192</text>

        <text x="0" y="152" font-size="10" fill="#64748b">DATE OF BIRTH / تاريخ الميلاد</text>
        <text x="0" y="172" font-family="'IBM Plex Mono', monospace" font-size="14" font-weight="600" fill="#0f172a">1988-04-14</text>

        <text x="0" y="204" font-size="10" fill="#64748b">VALID UNTIL / صالحة حتى</text>
        <text x="0" y="224" font-family="'IBM Plex Mono', monospace" font-size="13" font-weight="bold" fill="#059669">2034-01-14</text>
      </g>
    </g>

    <!-- Additional Info Bar -->
    <g transform="translate(45, 360)">
      <rect width="710" height="42" rx="6" fill="#f1f5f9" stroke="#e2e8f0"/>
      <text x="15" y="25" font-family="sans-serif" font-size="11" fill="#475569">
        <tspan font-weight="bold" fill="#0f172a">TYPE:</tspan> Golden Residence (10 Years)  |  <tspan font-weight="bold" fill="#0f172a">PLACE:</tspan> Dubai GDRFA  |  <tspan font-weight="bold" fill="#0f172a">SPONSOR:</tspan> Dubai Silicon Oasis
      </text>
    </g>

    <!-- Bottom MRZ / Barcode Band -->
    <g transform="translate(45, 420)">
      <rect width="710" height="70" rx="6" fill="#0f172a"/>
      <text x="25" y="32" font-family="'IBM Plex Mono', monospace" font-size="14" fill="#f8fafc" letter-spacing="3">
        V&lt;AREALHASHIMI&lt;&lt;MOHAMMED&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;
      </text>
      <text x="25" y="54" font-family="'IBM Plex Mono', monospace" font-size="14" fill="#f8fafc" letter-spacing="3">
        20120247789215ARE8804149M3401147&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;02
      </text>
    </g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// SVG Graphic generator for UK Tourist Visa / Passport
export function generateUkTouristSvg(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" width="800" height="520">
    <defs>
      <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e3a8a"/>
        <stop offset="100%" stop-color="#2563eb"/>
      </linearGradient>
      <pattern id="waves" width="30" height="30" patternUnits="userSpaceOnUse">
        <path d="M0 15 Q 7.5 5, 15 15 T 30 15" fill="none" stroke="#e0e7ff" stroke-width="1" opacity="0.6"/>
      </pattern>
    </defs>

    <!-- Card Background -->
    <rect width="800" height="520" rx="16" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
    <rect x="12" y="12" width="776" height="496" rx="12" fill="url(#waves)"/>
    <rect x="12" y="12" width="776" height="496" rx="12" fill="none" stroke="#93c5fd" stroke-width="1.5"/>

    <!-- Header Banner -->
    <rect x="30" y="30" width="740" height="70" rx="8" fill="url(#blueGrad)"/>
    
    <circle cx="70" cy="65" r="22" fill="#ffffff" opacity="0.2"/>
    <text x="70" y="72" font-family="sans-serif" font-size="20" text-anchor="middle" fill="#ffffff">✈</text>

    <text x="110" y="55" font-family="'Outfit', sans-serif" font-weight="bold" font-size="19" fill="#ffffff">DUBAI ENTRY PERMIT / TOURIST VISA</text>
    <text x="110" y="78" font-family="'Noto Sans Arabic', sans-serif" font-size="14" fill="#e0e7ff">إذن دخول للسياحة - إمارة دبي</text>
    <text x="740" y="55" font-family="'Outfit', sans-serif" font-weight="bold" font-size="14" fill="#93c5fd" text-anchor="end">30 DAYS SINGLE ENTRY</text>
    <text x="740" y="78" font-family="'Inter', sans-serif" font-size="12" fill="#ffffff" text-anchor="end">GDRFA ELECTRONIC SYSTEM</text>

    <!-- Photo Area -->
    <g transform="translate(45, 125)">
      <rect width="140" height="180" rx="8" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>
      <circle cx="70" cy="70" r="38" fill="#cbd5e1"/>
      <path d="M25,165 C25,115 115,115 115,165 Z" fill="#94a3b8"/>
      <rect x="10" y="195" width="120" height="24" rx="4" fill="#2563eb"/>
      <text x="70" y="211" font-family="sans-serif" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">TOURIST PASS</text>
    </g>

    <!-- Details Column -->
    <g transform="translate(210, 125)" font-family="'Inter', sans-serif">
      <text x="0" y="18" font-size="11" fill="#64748b">FULL NAME / الاسم الكامل</text>
      <text x="0" y="42" font-size="18" font-weight="bold" fill="#0f172a">TRAVELER NAME</text>
      <text x="0" y="62" font-family="'Noto Sans Arabic', sans-serif" font-size="14" fill="#334155">سارة جينكينز</text>

      <!-- Grid 1 -->
      <text x="0" y="100" font-size="10" fill="#64748b">ENTRY PERMIT NO / رقم الإذن</text>
      <text x="0" y="120" font-family="'IBM Plex Mono', monospace" font-size="16" font-weight="bold" fill="#2563eb">201/2024/345129</text>

      <text x="0" y="152" font-size="10" fill="#64748b">NATIONALITY / الجنسية</text>
      <text x="0" y="172" font-size="14" font-weight="bold" fill="#0f172a">UNITED KINGDOM</text>

      <text x="0" y="204" font-size="10" fill="#64748b">DATE OF ISSUE / تاريخ الإصدار</text>
      <text x="0" y="224" font-family="'IBM Plex Mono', monospace" font-size="13" font-weight="600" fill="#334155">2024-03-01</text>

      <!-- Grid 2 -->
      <g transform="translate(270, 0)">
        <text x="0" y="100" font-size="10" fill="#64748b">PASSPORT NO / رقم الجواز</text>
        <text x="0" y="120" font-family="'IBM Plex Mono', monospace" font-size="16" font-weight="bold" fill="#0f172a">GB8842109</text>

        <text x="0" y="152" font-size="10" fill="#64748b">DATE OF BIRTH / تاريخ الميلاد</text>
        <text x="0" y="172" font-family="'IBM Plex Mono', monospace" font-size="14" font-weight="600" fill="#0f172a">1994-08-22</text>

        <text x="0" y="204" font-size="10" fill="#64748b">VALID UNTIL / صالحة حتى</text>
        <text x="0" y="224" font-family="'IBM Plex Mono', monospace" font-size="13" font-weight="bold" fill="#d97706">2024-05-30</text>
      </g>
    </g>

    <!-- Additional Info Bar -->
    <g transform="translate(45, 360)">
      <rect width="710" height="42" rx="6" fill="#f8fafc" stroke="#e2e8f0"/>
      <text x="15" y="25" font-family="sans-serif" font-size="11" fill="#475569">
        <tspan font-weight="bold" fill="#0f172a">STAY DURATION:</tspan> 30 Days  |  <tspan font-weight="bold" fill="#0f172a">PORT OF ENTRY:</tspan> Dubai DXB  |  <tspan font-weight="bold" fill="#0f172a">SPONSOR:</tspan> Emirates Holidays
      </text>
    </g>

    <!-- Bottom MRZ Band -->
    <g transform="translate(45, 420)">
      <rect width="710" height="70" rx="6" fill="#0f172a"/>
      <text x="25" y="32" font-family="'IBM Plex Mono', monospace" font-size="14" fill="#f8fafc" letter-spacing="3">
        V&lt;GBRJENKINS&lt;&lt;SARAH&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;
      </text>
      <text x="25" y="54" font-family="'IBM Plex Mono', monospace" font-size="14" fill="#f8fafc" letter-spacing="3">
        20120243451294GBR9408226F2405308&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;01
      </text>
    </g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// SVG Graphic generator for Umrah Pilgrim Visa
export function generateUmrahVisaSvg(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" width="800" height="520">
    <defs>
      <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#064e3b"/>
        <stop offset="100%" stop-color="#059669"/>
      </linearGradient>
      <pattern id="islamicStar" width="40" height="40" patternUnits="userSpaceOnUse">
        <polygon points="20,4 24,14 36,14 26,22 30,34 20,26 10,34 14,22 4,14 16,14" fill="none" stroke="#d1fae5" stroke-width="0.75" opacity="0.6"/>
      </pattern>
    </defs>

    <!-- Card Background -->
    <rect width="800" height="520" rx="16" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
    <rect x="12" y="12" width="776" height="496" rx="12" fill="url(#islamicStar)"/>
    <rect x="12" y="12" width="776" height="496" rx="12" fill="none" stroke="#6ee7b7" stroke-width="1.5"/>

    <!-- Header Banner -->
    <rect x="30" y="30" width="740" height="70" rx="8" fill="url(#emeraldGrad)"/>
    
    <circle cx="70" cy="65" r="22" fill="#ffffff" opacity="0.2"/>
    <text x="70" y="73" font-family="sans-serif" font-size="22" text-anchor="middle" fill="#ffffff">☪</text>

    <text x="110" y="55" font-family="'Outfit', sans-serif" font-weight="bold" font-size="19" fill="#ffffff">KINGDOM OF SAUDI ARABIA • UMRAH VISA</text>
    <text x="110" y="78" font-family="'Noto Sans Arabic', sans-serif" font-size="14" fill="#a7f3d0">المملكة العربية السعودية • تأشيرة عمرة إلكترونية</text>
    <text x="740" y="55" font-family="'Outfit', sans-serif" font-weight="bold" font-size="14" fill="#a7f3d0" text-anchor="end">MINISTRY OF HAJJ &amp; UMRAH</text>
    <text x="740" y="78" font-family="'Inter', sans-serif" font-size="12" fill="#ffffff" text-anchor="end">VALID FOR PILGRIMAGE</text>

    <!-- Photo Area -->
    <g transform="translate(45, 125)">
      <rect width="140" height="180" rx="8" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>
      <circle cx="70" cy="70" r="38" fill="#cbd5e1"/>
      <path d="M25,165 C25,115 115,115 115,165 Z" fill="#94a3b8"/>
      <rect x="10" y="195" width="120" height="24" rx="4" fill="#059669"/>
      <text x="70" y="211" font-family="sans-serif" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">PILGRIM PASS</text>
    </g>

    <!-- Details Column -->
    <g transform="translate(210, 125)" font-family="'Inter', sans-serif">
      <text x="0" y="18" font-size="11" fill="#64748b">FULL NAME / الاسم الكامل</text>
      <text x="0" y="42" font-size="18" font-weight="bold" fill="#0f172a">AHMED MANSOOR</text>
      <text x="0" y="62" font-family="'Noto Sans Arabic', sans-serif" font-size="14" fill="#334155">أحمد منصور</text>

      <!-- Grid 1 -->
      <text x="0" y="100" font-size="10" fill="#64748b">VISA NUMBER / رقم التأشيرة</text>
      <text x="0" y="120" font-family="'IBM Plex Mono', monospace" font-size="16" font-weight="bold" fill="#059669">1445/889210</text>

      <text x="0" y="152" font-size="10" fill="#64748b">NATIONALITY / الجنسية</text>
      <text x="0" y="172" font-size="14" font-weight="bold" fill="#0f172a">PAKISTAN</text>

      <text x="0" y="204" font-size="10" fill="#64748b">DATE OF ISSUE / تاريخ الإصدار</text>
      <text x="0" y="224" font-family="'IBM Plex Mono', monospace" font-size="13" font-weight="600" fill="#334155">2024-02-10</text>

      <!-- Grid 2 -->
      <g transform="translate(270, 0)">
        <text x="0" y="100" font-size="10" fill="#64748b">PASSPORT NO / رقم الجواز</text>
        <text x="0" y="120" font-family="'IBM Plex Mono', monospace" font-size="16" font-weight="bold" fill="#0f172a">PK5410982</text>

        <text x="0" y="152" font-size="10" fill="#64748b">DATE OF BIRTH / تاريخ الميلاد</text>
        <text x="0" y="172" font-family="'IBM Plex Mono', monospace" font-size="14" font-weight="600" fill="#0f172a">1982-11-03</text>

        <text x="0" y="204" font-size="10" fill="#64748b">VALID UNTIL / صالحة حتى</text>
        <text x="0" y="224" font-family="'IBM Plex Mono', monospace" font-size="13" font-weight="bold" fill="#059669">2024-05-10</text>
      </g>
    </g>

    <!-- Additional Info Bar -->
    <g transform="translate(45, 360)">
      <rect width="710" height="42" rx="6" fill="#f8fafc" stroke="#e2e8f0"/>
      <text x="15" y="25" font-family="sans-serif" font-size="11" fill="#475569">
        <tspan font-weight="bold" fill="#0f172a">OPERATOR:</tspan> Rawabi Al-Haramain Co.  |  <tspan font-weight="bold" fill="#0f172a">AGENT:</tspan> Al-Madinah Travel  |  <tspan font-weight="bold" fill="#0f172a">ENTRY:</tspan> Jeddah Airport
      </text>
    </g>

    <!-- Bottom MRZ Band -->
    <g transform="translate(45, 420)">
      <rect width="710" height="70" rx="6" fill="#0f172a"/>
      <text x="25" y="32" font-family="'IBM Plex Mono', monospace" font-size="14" fill="#f8fafc" letter-spacing="3">
        V&lt;SAUMANSOOR&lt;&lt;AHMED&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;
      </text>
      <text x="25" y="54" font-family="'IBM Plex Mono', monospace" font-size="14" fill="#f8fafc" letter-spacing="3">
        14458892100PAK8211038M2405105&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;03
      </text>
    </g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Realistic Hotel Rooms & Guest Profiles (Rooms 101, 102, 103, 777)
export const INITIAL_HOTEL_ROOMS: HotelRoom[] = [
  {
    id: 'room-101',
    roomNumber: '101',
    roomType: 'Deluxe Room',
    floor: '1st Floor',
    maxCapacity: 2,
    pricePerNight: 280,
    status: 'available', // Ready for check-in
    checkInDate: '',
    checkInTime: '',
    checkOutDate: '',
    checkOutTime: '',
    nights: 1,
    payment: {
      mode: 'Cash',
      status: 'Pending',
      currency: 'SAR',
      totalAmount: 280,
      amountPaid: 0,
      balanceDue: 280,
      transactionRef: '',
      notes: ''
    },
    guests: []
  },
  {
    id: 'room-102',
    roomNumber: '102',
    roomType: 'Superior King',
    floor: '1st Floor',
    maxCapacity: 3,
    pricePerNight: 350,
    status: 'available',
    checkInDate: '',
    checkInTime: '',
    checkOutDate: '',
    checkOutTime: '',
    nights: 1,
    payment: {
      mode: 'UPI',
      status: 'Pending',
      currency: 'SAR',
      totalAmount: 350,
      amountPaid: 0,
      balanceDue: 350,
      transactionRef: '',
      notes: ''
    },
    guests: []
  },
  {
    id: 'room-103',
    roomNumber: '103',
    roomType: 'Executive Suite',
    floor: '2nd Floor',
    maxCapacity: 4,
    pricePerNight: 550,
    status: 'available',
    checkInDate: '',
    checkInTime: '',
    checkOutDate: '',
    checkOutTime: '',
    nights: 1,
    payment: {
      mode: 'Card',
      status: 'Pending',
      currency: 'SAR',
      totalAmount: 550,
      amountPaid: 0,
      balanceDue: 550,
      transactionRef: '',
      notes: ''
    },
    guests: []
  },
  {
    id: 'room-777',
    roomNumber: '777',
    roomType: 'Royal Penthouse',
    floor: '7th Floor',
    maxCapacity: 6,
    pricePerNight: 1200,
    status: 'available',
    checkInDate: '',
    checkInTime: '',
    checkOutDate: '',
    checkOutTime: '',
    nights: 1,
    payment: {
      mode: 'Cheque',
      status: 'Pending',
      currency: 'SAR',
      totalAmount: 1200,
      amountPaid: 0,
      balanceDue: 1200,
      transactionRef: '',
      notes: ''
    },
    guests: []
  }
];

// Backwards-compatible export mapping
export const INITIAL_DEMO_GUESTS: DemoGuestProfile[] = INITIAL_HOTEL_ROOMS.map((r) => ({
  id: r.id,
  roomNumber: r.roomNumber,
  roomType: r.roomType,
  guestName: '',
  phoneNumber: '',
  nationality: '',
  docType: 'Tourist Visa',
  docNumber: '',
  durationOfStay: '',
  documentImageUrl: '',
  status: r.status,
  checkInTime: undefined,
  maxCapacity: r.maxCapacity,
  payment: r.payment,
  guests: r.guests,
  parsedData: EMPTY_DOCUMENT,
}));



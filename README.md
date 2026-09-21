# فندق ساري المسك • Sari Al Mesk Hotel PMS & Guest Registration System

A clean, modern React + TypeScript hotel management & guest registration system for Sari Al Mesk Hotel (فندق ساري المسك), scanning and uploading passport/visa documents (Saudi Umrah visas, UAE tourist/residence visas, international passports), extracting all key particulars via Google Gemini Vision API, editing details in real time, managing room occupancy, and generating a printable official A4 table-wise document.

## Features

- **Document Scanner & Uploader**: Drag & drop or browse document photos (or capture directly with camera).
- **Gemini Multi-Key Failover Engine**: Configure 1, 2, or 3 Gemini API keys in Settings (`⚙️`). If Key 1 hits quota or rate limits (HTTP 429), the engine automatically shifts traffic to Key 2 and Key 3 seamlessly.
- **Robust Field Extraction**:
  - Full Name (الاسم)
  - Visa Number (رقم التأشيرة)
  - Passport No (رقم الجواز)
  - Date of Birth (تاريخ الميلاد)
  - Nationality (الجنسية)
  - Type of Visa (نوع التأشيرة)
  - Duration of Stay (مدة الإقامة)
  - Date of Issue (تاريخ الإصدار)
  - Valid Until / Expiry (صالحة حتى)
  - Place of Issue (مكان الإصدار)
  - Umrah Operator / Saudi Company (الشركة السعودية / مشغل العمرة)
  - External Agent (الوكيل الخارجي)
- **Official A4 Table-Wise Print Format**:
  - Standard ISO 216 A4 sheet (210 × 297 mm) with exact 1-page fit.
  - Clean numbered rows (`Sr. No. 01` to `12`) with English and Arabic labels.
  - Official sign-off blocks (Applicant Signature & Authorized Stamp).
  - Print / Save as PDF with one click.
- **Zero Demo Entries**: Starts 100% clean and blank.

## Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Icons**: Lucide React
- **Animations / Confetti**: Canvas Confetti
- **Styling**: Vanilla CSS (Modern Light Aesthetic & Official `@media print` rules)

## Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/amirrazarangrez56-del/uae.git
   cd uae
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

## License

MIT

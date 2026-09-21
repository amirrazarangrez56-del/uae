import React, { useState } from 'react';
import type { TravelDocumentData, HotelRoom, GuestEntry } from '../types/document';
import { 
  Printer, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  FileText,
  Users
} from 'lucide-react';

interface A4DocumentPreviewProps {
  data: TravelDocumentData;
  onPrint: () => void;
  activeRoom?: HotelRoom | null;
  guestList?: GuestEntry[];
}

export const A4DocumentPreview: React.FC<A4DocumentPreviewProps> = ({ 
  data, 
  onPrint,
  activeRoom,
  guestList = []
}) => {
  const [zoom, setZoom] = useState<number>(0.92);
  const [selectedGuestView, setSelectedGuestView] = useState<'all' | number>('all');

  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // Collect the items to print: either all guests in the room, or just the currently active one
  const roomGuests: Array<{ guestIndex: number; data: TravelDocumentData; name?: string }> = 
    guestList.length > 0
      ? guestList.map((g, idx) => {
          const hasParsedContent = g.parsedData && Object.values(g.parsedData).some((v) => typeof v === 'string' && v.trim().length > 0);
          return {
            guestIndex: idx + 1,
            data: hasParsedContent ? g.parsedData : (g.parsedData || { ...data, name: g.name || data.name }),
            name: g.name || (hasParsedContent ? g.parsedData.name : data.name),
          };
        })
      : [{ guestIndex: 1, data, name: data.name }];

  const guestsToDisplay = 
    selectedGuestView === 'all'
      ? roomGuests
      : [roomGuests[selectedGuestView] || roomGuests[0]];

  const roomNumber = activeRoom?.roomNumber || '101';
  const roomType = activeRoom?.roomType || 'Deluxe Room';
  const checkInDate = activeRoom?.checkInDate || currentDate;
  const checkOutDate = activeRoom?.checkOutDate || '—';
  const nights = activeRoom?.nights || 1;
  const payment = activeRoom?.payment || {
    mode: 'Cash',
    status: 'Pending',
    currency: 'SAR',
    totalAmount: '280',
    amountPaid: '0',
    balanceDue: '280',
    transactionRef: '',
  };

  return (
    <div className="a4-preview-wrapper">
      {/* Top Toolbar (Hidden on Print) */}
      <div className="a4-toolbar no-print">
        <div className="toolbar-info">
          <FileText size={18} className="text-primary" />
          <span className="toolbar-title">Official Check-In Registration Dossier</span>
          <span className="sheet-spec-tag">A4 (210 × 297 mm)</span>
          {activeRoom && (
            <span className="toolbar-room-tag">Room {roomNumber} • {roomType}</span>
          )}
        </div>

        {/* Guest Selector when Room has multiple guests */}
        {roomGuests.length > 1 && (
          <div className="a4-guest-selector-pill">
            <Users size={14} className="text-muted" />
            <span className="selector-label">Print For:</span>
            <select
              value={selectedGuestView}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedGuestView(val === 'all' ? 'all' : parseInt(val, 10));
              }}
              className="guest-select-dropdown"
            >
              <option value="all">All Guests (Batch Print {roomGuests.length} Sheets)</option>
              {roomGuests.map((g, idx) => (
                <option key={idx} value={idx}>
                  Guest #{g.guestIndex}: {g.name || g.data.name || `Guest ${idx + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="toolbar-actions">
          <div className="zoom-controls">
            <button
              type="button"
              className="tool-btn"
              onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(1)))}
              title="Zoom Out"
            >
              <ZoomOut size={15} />
            </button>
            <span className="zoom-percentage">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              className="tool-btn"
              onClick={() => setZoom((z) => Math.min(1.4, +(z + 0.1).toFixed(1)))}
              title="Zoom In"
            >
              <ZoomIn size={15} />
            </button>
            <button
              type="button"
              className="tool-btn"
              onClick={() => setZoom(0.92)}
              title="Fit to Screen"
            >
              <Maximize2 size={15} />
              <span>Fit</span>
            </button>
          </div>

          <button
            type="button"
            className="clean-btn-primary"
            onClick={onPrint}
            title="Print Official A4 Registration Card"
          >
            <Printer size={16} />
            <span>
              {selectedGuestView === 'all' && roomGuests.length > 1
                ? `Batch Print All (${roomGuests.length} Forms)`
                : 'Print A4 Form'}
            </span>
          </button>
        </div>
      </div>

      {/* A4 Scroll Viewport */}
      <div className="a4-scroll-viewport">
        <div 
          className="a4-scale-container" 
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
        >
          {guestsToDisplay.map((item, index) => {
            const docData = item.data;
            const guestNum = item.guestIndex;
            const isLast = index === guestsToDisplay.length - 1;

            return (
              <div 
                key={index} 
                className={`a4-paper-sheet ${!isLast ? 'page-break-after' : ''}`}
                id={`printable-a4-dossier-${index}`}
              >
                {/* Official Hotel Print Header */}
                <div className="table-print-header">
                  <div className="header-text-side">
                    <div className="hotel-bilingual-brand">
                      <div className="hotel-ar-name" dir="rtl">فندق ساري المسك</div>
                      <div className="hotel-en-name">SARI AL MESK HOTEL</div>
                    </div>
                    <h1 className="table-doc-title">GUEST CHECK-IN &amp; TRAVEL DOCUMENT PARTICULARS</h1>
                    <p className="table-doc-subtitle">
                      Official Electronic Verification &amp; Registration Record • بطاقة تسجيل النزيل وبيانات وثيقة السفر
                    </p>
                  </div>
                </div>

                {/* Stay & Room Details Summary Strip */}
                <div className="a4-stay-summary-strip">
                  <div className="stay-meta-box">
                    <span className="meta-label">ROOM NO (رقم الغرفة)</span>
                    <span className="meta-val highlight-num">Room {roomNumber}</span>
                  </div>
                  <div className="stay-meta-box">
                    <span className="meta-label">ROOM TYPE</span>
                    <span className="meta-val">{roomType}</span>
                  </div>
                  <div className="stay-meta-box">
                    <span className="meta-label">CHECK-IN (تاريخ الوصول)</span>
                    <span className="meta-val">{checkInDate}</span>
                  </div>
                  <div className="stay-meta-box">
                    <span className="meta-label">CHECK-OUT (تاريخ المغادرة)</span>
                    <span className="meta-val">{checkOutDate} ({nights} {nights === 1 ? 'Night' : 'Nights'})</span>
                  </div>
                  <div className="stay-meta-box">
                    <span className="meta-label">OCCUPANT (النزيل)</span>
                    <span className="meta-val">
                      Guest #{guestNum} of {roomGuests.length}
                      {guestNum === 1 ? ' (Primary)' : ''}
                    </span>
                  </div>
                </div>

                {/* Payment Particulars Strip (Typed manually in SAR) */}
                <div className="a4-payment-summary-strip">
                  <div className="pay-meta-box">
                    <span className="pay-label">PAYMENT MODE (طريقة الدفع)</span>
                    <span className="pay-val font-bold">{payment.mode}</span>
                  </div>
                  <div className="pay-meta-box">
                    <span className="pay-label">TOTAL AMOUNT (الإجمالي)</span>
                    <span className="pay-val">{payment.totalAmount ? `${payment.totalAmount} SAR` : '0.00 SAR'}</span>
                  </div>
                  <div className="pay-meta-box">
                    <span className="pay-label">AMOUNT PAID (المدفوع)</span>
                    <span className="pay-val text-green">{payment.amountPaid ? `${payment.amountPaid} SAR` : '0.00 SAR'}</span>
                  </div>
                  <div className="pay-meta-box">
                    <span className="pay-label">BALANCE DUE (المتبقي)</span>
                    <span className="pay-val text-amber">{payment.balanceDue ? `${payment.balanceDue} SAR` : '0.00 SAR'}</span>
                  </div>
                  <div className="pay-meta-box">
                    <span className="pay-label">STATUS</span>
                    <span className={`pay-status-badge ${payment.status.toLowerCase()}`}>{payment.status.toUpperCase()}</span>
                  </div>
                  {payment.transactionRef && (
                    <div className="pay-meta-box full-width">
                      <span className="pay-label">TRANSACTION / CARD AUTH REF (المرجع):</span>
                      <span className="pay-val font-mono">{payment.transactionRef}</span>
                    </div>
                  )}
                </div>

                {/* Table-Wise Extracted Particulars Layout */}
                <table className="easy-doc-table">
                  <thead>
                    <tr>
                      <th className="th-num">Sr. No.</th>
                      <th className="th-desc">Field Description / البيان</th>
                      <th className="th-val">Extracted Particulars / التفاصيل</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="col-num">01</td>
                      <td className="col-label">Full Name (الاسم الكامل)</td>
                      <td className="col-value val-name">{docData.name || '—'}</td>
                    </tr>
                    <tr>
                      <td className="col-num">02</td>
                      <td className="col-label">Visa Number (رقم التأشيرة)</td>
                      <td className="col-value val-mono val-highlight">{docData.visaNumber || '—'}</td>
                    </tr>
                    <tr>
                      <td className="col-num">03</td>
                      <td className="col-label">Passport No (رقم الجواز)</td>
                      <td className="col-value val-mono val-bold">{docData.passportNumber || '—'}</td>
                    </tr>
                    <tr>
                      <td className="col-num">04</td>
                      <td className="col-label">Date of Birth (تاريخ الميلاد)</td>
                      <td className="col-value val-mono">{docData.dateOfBirth || '—'}</td>
                    </tr>
                    <tr>
                      <td className="col-num">05</td>
                      <td className="col-label">Nationality (الجنسية)</td>
                      <td className="col-value val-bold">{docData.nationality || '—'}</td>
                    </tr>
                    <tr>
                      <td className="col-num">06</td>
                      <td className="col-label">Type of Visa (نوع التأشيرة)</td>
                      <td className="col-value val-bold">{docData.typeOfVisa || '—'}</td>
                    </tr>
                    <tr>
                      <td className="col-num">07</td>
                      <td className="col-label">Duration of Stay (مدة الإقامة)</td>
                      <td className="col-value val-bold">{docData.durationOfStay || '—'}</td>
                    </tr>
                    <tr>
                      <td className="col-num">08</td>
                      <td className="col-label">Date of Issue (تاريخ الإصدار)</td>
                      <td className="col-value val-mono">{docData.dateOfIssue || '—'}</td>
                    </tr>
                    <tr>
                      <td className="col-num">09</td>
                      <td className="col-label">Valid Until (صالحة حتى)</td>
                      <td className="col-value val-mono val-bold">{docData.validUntil || '—'}</td>
                    </tr>
                    <tr>
                      <td className="col-num">10</td>
                      <td className="col-label">Place of Issue (مكان الإصدار)</td>
                      <td className="col-value">{docData.placeOfIssue || '—'}</td>
                    </tr>
                    <tr>
                      <td className="col-num">11</td>
                      <td className="col-label">Umrah Operator / Saudi Company (الشركة السعودية / مشغل العمرة)</td>
                      <td className="col-value val-bold">{docData.umrahOperator || '—'}</td>
                    </tr>
                    <tr>
                      <td className="col-num">12</td>
                      <td className="col-label">External Agent (الوكيل الخارجي)</td>
                      <td className="col-value">{docData.externalAgent || '—'}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Clean Simple Signatures & Attestation */}
                <div className="table-doc-signatures">
                  <div className="sig-column">
                    <div className="sig-line"></div>
                    <span className="sig-title">Guest Signature / توقيع النزيل</span>
                  </div>
                  <div className="sig-column">
                    <div className="sig-line"></div>
                    <span className="sig-title">Hotel Reception Stamp / ختم الفندق والاعتماد</span>
                  </div>
                </div>

                {/* Clean Footer */}
                <div className="table-doc-footer">
                  <span>Page {index + 1} of {guestsToDisplay.length} • ISO 216 Standard A4 Table Format</span>
                  <span>Sari Al Mesk Hotel Registration Record • {currentDate}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

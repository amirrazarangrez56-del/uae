import React, { useState } from 'react';
import type { TravelDocumentData } from '../types/document';
import { 
  Printer, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  FileText
} from 'lucide-react';

interface A4DocumentPreviewProps {
  data: TravelDocumentData;
  onPrint: () => void;
}

export const A4DocumentPreview: React.FC<A4DocumentPreviewProps> = ({ data, onPrint }) => {
  const [zoom, setZoom] = useState<number>(0.92);

  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="a4-preview-wrapper">
      {/* Top Toolbar (Hidden on Print) */}
      <div className="a4-toolbar no-print">
        <div className="toolbar-info">
          <FileText size={18} className="text-primary" />
          <span className="toolbar-title">Official A4 Size Paper (Table Format)</span>
          <span className="sheet-spec-tag">A4 (210 × 297 mm)</span>
        </div>

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
            title="Print A4 Document"
          >
            <Printer size={16} />
            <span>Print A4 Form</span>
          </button>
        </div>
      </div>

      {/* A4 Sheet Container */}
      <div className="a4-scroll-viewport">
        <div 
          className="a4-scale-container" 
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
        >
          <div className="a4-paper-sheet" id="printable-a4-dossier">
            {/* Easy Clean Header */}
            <div className="table-print-header">
              <div className="header-text-side">
                <h1 className="table-doc-title">VISA & PASSPORT DOCUMENT PARTICULARS</h1>
                <p className="table-doc-subtitle">Electronic Verification & Extraction Record • تفاصيل وثيقة السفر</p>
                <div className="table-doc-meta-row">
                  <span><strong>Date:</strong> {currentDate}</span>
                  {data.visaNumber && <span><strong>Visa Ref:</strong> {data.visaNumber}</span>}
                  {data.passportNumber && <span><strong>Passport Ref:</strong> {data.passportNumber}</span>}
                </div>
              </div>
            </div>

            {/* Table-Wise Only Layout */}
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
                  <td className="col-value val-name">{data.name || '—'}</td>
                </tr>
                <tr>
                  <td className="col-num">02</td>
                  <td className="col-label">Visa Number (رقم التأشيرة)</td>
                  <td className="col-value val-mono val-highlight">{data.visaNumber || '—'}</td>
                </tr>
                <tr>
                  <td className="col-num">03</td>
                  <td className="col-label">Passport No (رقم الجواز)</td>
                  <td className="col-value val-mono val-bold">{data.passportNumber || '—'}</td>
                </tr>
                <tr>
                  <td className="col-num">04</td>
                  <td className="col-label">Date of Birth (تاريخ الميلاد)</td>
                  <td className="col-value val-mono">{data.dateOfBirth || '—'}</td>
                </tr>
                <tr>
                  <td className="col-num">05</td>
                  <td className="col-label">Nationality (الجنسية)</td>
                  <td className="col-value val-bold">{data.nationality || '—'}</td>
                </tr>
                <tr>
                  <td className="col-num">06</td>
                  <td className="col-label">Type of Visa (نوع التأشيرة)</td>
                  <td className="col-value val-bold">{data.typeOfVisa || '—'}</td>
                </tr>
                <tr>
                  <td className="col-num">07</td>
                  <td className="col-label">Duration of Stay (مدة الإقامة)</td>
                  <td className="col-value val-bold">{data.durationOfStay || '—'}</td>
                </tr>
                <tr>
                  <td className="col-num">08</td>
                  <td className="col-label">Date of Issue (تاريخ الإصدار)</td>
                  <td className="col-value val-mono">{data.dateOfIssue || '—'}</td>
                </tr>
                <tr>
                  <td className="col-num">09</td>
                  <td className="col-label">Valid Until (صالحة حتى)</td>
                  <td className="col-value val-mono val-bold">{data.validUntil || '—'}</td>
                </tr>
                <tr>
                  <td className="col-num">10</td>
                  <td className="col-label">Place of Issue (مكان الإصدار)</td>
                  <td className="col-value">{data.placeOfIssue || '—'}</td>
                </tr>
                <tr>
                  <td className="col-num">11</td>
                  <td className="col-label">Umrah Operator / Saudi Company (الشركة السعودية / مشغل العمرة)</td>
                  <td className="col-value val-bold">{data.umrahOperator || '—'}</td>
                </tr>
                <tr>
                  <td className="col-num">12</td>
                  <td className="col-label">External Agent (الوكيل الخارجي)</td>
                  <td className="col-value">{data.externalAgent || '—'}</td>
                </tr>
              </tbody>
            </table>

            {/* Clean Simple Signatures & Attestation */}
            <div className="table-doc-signatures">
              <div className="sig-column">
                <div className="sig-line"></div>
                <span className="sig-title">Applicant Signature / توقيع المسافر</span>
              </div>
              <div className="sig-column">
                <div className="sig-line"></div>
                <span className="sig-title">Authorized Stamp / الختم والاعتماد الرسمي</span>
              </div>
            </div>

            {/* Clean Footer */}
            <div className="table-doc-footer">
              <span>Page 1 of 1 • ISO 216 Standard A4 Table Format</span>
              <span>Official Extraction Record • {currentDate}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

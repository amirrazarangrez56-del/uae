import React from 'react';
import type { TravelDocumentData, DemoGuestProfile } from '../types/document';
import { 
  FileText, 
  Printer, 
  RotateCcw, 
  CheckCircle2, 
  DoorOpen, 
  BedDouble, 
  Clock, 
  ShieldCheck 
} from 'lucide-react';

interface FormEditorProps {
  data: TravelDocumentData;
  onChange: (updated: TravelDocumentData) => void;
  onReset: () => void;
  onSwitchToA4: () => void;
  activeDemoProfile?: DemoGuestProfile | null;
  onCheckInRoom?: () => void;
  onCheckOutRoom?: () => void;
}

export const FormEditor: React.FC<FormEditorProps> = ({
  data,
  onChange,
  onReset,
  onSwitchToA4,
  activeDemoProfile,
  onCheckInRoom,
  onCheckOutRoom,
}) => {
  const handleFieldChange = (field: keyof TravelDocumentData, val: string) => {
    onChange({
      ...data,
      [field]: val,
    });
  };

  const isCheckedIn = activeDemoProfile?.status === 'checked_in';
  const roomNumber = activeDemoProfile?.roomNumber || '205';
  const roomType = activeDemoProfile?.roomType || 'Standard Deluxe Suite';
  const hasExtractedData = Boolean(data.name || data.passportNumber || data.visaNumber);

  return (
    <div className="clean-card form-box">
      <div className="clean-card-header">
        <div className="clean-card-title">
          <FileText size={18} className="text-primary" />
          <span>Extracted Document Details</span>
        </div>
        <div className="clean-header-actions">
          <button
            type="button"
            className="clean-btn-subtle"
            onClick={onReset}
            title="Reset form"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
          <button
            type="button"
            className="clean-btn-primary small"
            onClick={onSwitchToA4}
            title="Preview on A4 Size Paper"
          >
            <Printer size={14} />
            <span>View A4 Paper</span>
          </button>
        </div>
      </div>

      {/* Prominent Room Check-In & Tracking Bar */}
      <div className={`room-checkin-banner ${isCheckedIn ? 'banner-checked-in' : 'banner-vacant'}`}>
        <div className="checkin-banner-info">
          <div className="room-title-line">
            <BedDouble size={18} />
            <span className="room-title-num">Room {roomNumber}</span>
            <span className="room-title-type">• {roomType}</span>
          </div>

          <div className="checkin-status-row">
            {isCheckedIn ? (
              <div className="status-badge-green">
                <CheckCircle2 size={14} />
                <span>CHECKED IN</span>
                {activeDemoProfile?.checkInTime && (
                  <span className="badge-time">
                    <Clock size={12} /> {activeDemoProfile.checkInTime}
                  </span>
                )}
              </div>
            ) : (
              <div className="status-badge-amber">
                <span className="vacant-pulse-dot"></span>
                <span>VACANT / READY FOR CHECK-IN</span>
              </div>
            )}
          </div>
        </div>

        <div className="checkin-banner-actions">
          {!isCheckedIn ? (
            <button
              type="button"
              className="btn-checkin-action"
              onClick={onCheckInRoom}
              disabled={!hasExtractedData && !activeDemoProfile}
              title="Confirm document verification and check guest into room"
            >
              <ShieldCheck size={16} />
              <span>Check-In Room {roomNumber}</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn-checkout-action"
              onClick={onCheckOutRoom}
              title="Release room and check out guest"
            >
              <DoorOpen size={16} />
              <span>Check Out Room</span>
            </button>
          )}
        </div>
      </div>


      <div className="clean-form-grid">
        {/* Row 1: Name */}
        <div className="form-item full-span">
          <label htmlFor="name">Full Name (الاسم)</label>
          <input
            id="name"
            type="text"
            value={data.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            placeholder="Full Name as on Passport/Visa"
            className="font-semibold"
          />
        </div>

        {/* Row 2: Visa Number & Passport Number */}
        <div className="form-item">
          <label htmlFor="visaNumber">Visa Number (رقم التأشيرة)</label>
          <input
            id="visaNumber"
            type="text"
            value={data.visaNumber}
            onChange={(e) => handleFieldChange('visaNumber', e.target.value)}
            placeholder="Visa Number"
            className="font-mono text-bold"
          />
        </div>

        <div className="form-item">
          <label htmlFor="passportNumber">Passport No (رقم الجواز)</label>
          <input
            id="passportNumber"
            type="text"
            value={data.passportNumber}
            onChange={(e) => handleFieldChange('passportNumber', e.target.value)}
            placeholder="Passport Number"
            className="font-mono text-bold"
          />
        </div>

        {/* Row 3: Date of Birth & Nationality */}
        <div className="form-item">
          <label htmlFor="dateOfBirth">Date of Birth (تاريخ الميلاد)</label>
          <input
            id="dateOfBirth"
            type="text"
            value={data.dateOfBirth}
            onChange={(e) => handleFieldChange('dateOfBirth', e.target.value)}
            placeholder="YYYY-MM-DD"
          />
        </div>

        <div className="form-item">
          <label htmlFor="nationality">Nationality (الجنسية)</label>
          <input
            id="nationality"
            type="text"
            value={data.nationality}
            onChange={(e) => handleFieldChange('nationality', e.target.value)}
            placeholder="Nationality / Country"
          />
        </div>

        {/* Row 4: Type of Visa & Duration of Stay */}
        <div className="form-item">
          <label htmlFor="typeOfVisa">Type of Visa (نوع التأشيرة)</label>
          <input
            id="typeOfVisa"
            type="text"
            value={data.typeOfVisa}
            onChange={(e) => handleFieldChange('typeOfVisa', e.target.value)}
            placeholder="Type of Visa"
          />
        </div>

        <div className="form-item">
          <label htmlFor="durationOfStay">Duration of Stay (مدة الإقامة)</label>
          <input
            id="durationOfStay"
            type="text"
            value={data.durationOfStay}
            onChange={(e) => handleFieldChange('durationOfStay', e.target.value)}
            placeholder="Duration of Stay"
          />
        </div>

        {/* Row 5: Date of Issue & Valid Until */}
        <div className="form-item">
          <label htmlFor="dateOfIssue">Date of Issue (تاريخ الإصدار)</label>
          <input
            id="dateOfIssue"
            type="text"
            value={data.dateOfIssue}
            onChange={(e) => handleFieldChange('dateOfIssue', e.target.value)}
            placeholder="YYYY-MM-DD"
          />
        </div>

        <div className="form-item">
          <label htmlFor="validUntil">Valid Until (صالحة حتى)</label>
          <input
            id="validUntil"
            type="text"
            value={data.validUntil}
            onChange={(e) => handleFieldChange('validUntil', e.target.value)}
            placeholder="YYYY-MM-DD"
            className="text-amber font-semibold"
          />
        </div>

        {/* Row 6: Place of Issue */}
        <div className="form-item full-span">
          <label htmlFor="placeOfIssue">Place of Issue (مكان الإصدار)</label>
          <input
            id="placeOfIssue"
            type="text"
            value={data.placeOfIssue}
            onChange={(e) => handleFieldChange('placeOfIssue', e.target.value)}
            placeholder="City / Country of Issue"
          />
        </div>

        {/* Row 7: Umrah Operator & External Agent */}
        <div className="form-item full-span">
          <label htmlFor="umrahOperator">Umrah Operator / Saudi Company (الشركة السعودية / مشغل العمرة)</label>
          <input
            id="umrahOperator"
            type="text"
            value={data.umrahOperator}
            onChange={(e) => handleFieldChange('umrahOperator', e.target.value)}
            placeholder="Operator / Company Name"
          />
        </div>

        <div className="form-item full-span">
          <label htmlFor="externalAgent">External Agent (الوكيل الخارجي)</label>
          <input
            id="externalAgent"
            type="text"
            value={data.externalAgent}
            onChange={(e) => handleFieldChange('externalAgent', e.target.value)}
            placeholder="External Travel Agent / Agency"
          />
        </div>
      </div>
    </div>
  );
};

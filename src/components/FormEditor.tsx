import React, { useState } from 'react';
import type { 
  TravelDocumentData, 
  HotelRoom, 
  PaymentMode, 
  PaymentStatus,
  GuestEntry 
} from '../types/document';
import { EMPTY_DOCUMENT } from '../services/sampleData';
import { 
  FileText, 
  Printer, 
  RotateCcw, 
  CheckCircle2, 
  DoorOpen, 
  BedDouble, 
  Clock, 
  ShieldCheck, 
  Calendar,
  CreditCard,
  Banknote,
  Users,
  Plus,
  AlertTriangle,
  Minus,
  Sparkles,
  Layers,
  FileSpreadsheet,
  UserCheck
} from 'lucide-react';

interface FormEditorProps {
  data: TravelDocumentData;
  onChange: (updated: TravelDocumentData) => void;
  onReset: () => void;
  onSwitchToA4: () => void;
  onPrintGuestA4?: (guestIndex: number) => void;
  activeRoom?: HotelRoom | null;
  onCheckInRoom?: () => void;
  onCheckOutRoom?: () => void;
  onUpdateRoomDetails?: (updates: Partial<HotelRoom>) => void;
  activeGuestIndex?: number;
  onSelectGuestIndex?: (index: number) => void;
  onAddGuestEntry?: () => void;
  onRemoveGuestEntry?: (index: number) => void;
  onUpdateMaxCapacity?: (newCapacity: number) => void;
  onUpdateGuestData?: (index: number, updated: TravelDocumentData) => void;
}

export const FormEditor: React.FC<FormEditorProps> = ({
  data,
  onChange,
  onReset,
  onSwitchToA4,
  onPrintGuestA4,
  activeRoom,
  onCheckInRoom,
  onCheckOutRoom,
  onUpdateRoomDetails,
  activeGuestIndex = 0,
  onSelectGuestIndex,
  onAddGuestEntry,
  onRemoveGuestEntry,
  onUpdateMaxCapacity,
  onUpdateGuestData,
}) => {
  // View mode: 'tabs' (show active guest only) vs 'all' (stacked view showing all filled forms at once)
  const [viewMode, setViewMode] = useState<'tabs' | 'all'>('tabs');

  const isCheckedIn = activeRoom?.status === 'checked_in';
  const roomNumber = activeRoom?.roomNumber || '101';
  const roomType = activeRoom?.roomType || 'Deluxe Room';
  const maxCapacity = activeRoom?.maxCapacity || 2;
  const guests = activeRoom?.guests || [];
  const guestCount = Math.max(1, guests.length);
  const isAtCapacity = guestCount >= maxCapacity;

  const payment = activeRoom?.payment || {
    mode: 'Cash',
    status: 'Pending',
    currency: 'SAR',
    totalAmount: 280,
    amountPaid: 0,
    balanceDue: 280,
    transactionRef: '',
  };

  const handleGuestFieldChange = (guestIdx: number, field: keyof TravelDocumentData, val: string) => {
    const currentGuestData = guests[guestIdx]?.parsedData || data;
    const updated = {
      ...currentGuestData,
      [field]: val,
    };

    if (onUpdateGuestData) {
      onUpdateGuestData(guestIdx, updated);
    } else {
      onChange(updated);
    }
  };

  const handlePaymentChange = (field: keyof typeof payment, val: any) => {
    if (!onUpdateRoomDetails) return;
    const updatedPayment = { ...payment, [field]: val };

    // Auto-calculate balance if total or paid changes
    if (field === 'totalAmount' || field === 'amountPaid') {
      const totalNum = parseFloat(String(field === 'totalAmount' ? val : updatedPayment.totalAmount)) || 0;
      const paidNum = parseFloat(String(field === 'amountPaid' ? val : updatedPayment.amountPaid)) || 0;
      const balance = Math.max(0, totalNum - paidNum);
      updatedPayment.balanceDue = balance;
      if (paidNum >= totalNum && totalNum > 0) {
        updatedPayment.status = 'Paid';
      } else if (paidNum > 0) {
        updatedPayment.status = 'Partial';
      } else {
        updatedPayment.status = 'Pending';
      }
    }

    onUpdateRoomDetails({ payment: updatedPayment });
  };

  // Check-In and Check-Out Dates handling
  const checkInDate = activeRoom?.checkInDate || new Date().toISOString().split('T')[0];
  const checkInTime = activeRoom?.checkInTime || '14:00';
  const checkOutDate = activeRoom?.checkOutDate || (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();
  const checkOutTime = activeRoom?.checkOutTime || '12:00';

  const calculateNights = (inDate: string, outDate: string) => {
    try {
      const start = new Date(inDate);
      const end = new Date(outDate);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(1, diffDays);
    } catch {
      return 1;
    }
  };

  const currentNights = activeRoom?.nights || calculateNights(checkInDate, checkOutDate);

  const handleDateChange = (type: 'checkInDate' | 'checkOutDate', val: string) => {
    if (!onUpdateRoomDetails) return;
    const newIn = type === 'checkInDate' ? val : checkInDate;
    const newOut = type === 'checkOutDate' ? val : checkOutDate;
    const nights = calculateNights(newIn, newOut);
    onUpdateRoomDetails({
      [type]: val,
      nights,
    });
  };

  // List of guest form items to render
  const formsToRender: Array<{ index: number; guest: GuestEntry; data: TravelDocumentData }> = 
    guests.length > 0
      ? guests.map((g, idx) => {
          const hasParsedContent = g.parsedData && Object.values(g.parsedData).some((v) => typeof v === 'string' && v.trim().length > 0);
          return {
            index: idx,
            guest: g,
            data: hasParsedContent
              ? g.parsedData
              : (idx === activeGuestIndex ? data : (g.parsedData || { ...EMPTY_DOCUMENT, name: g.name })),
          };
        })
      : [
          {
            index: 0,
            guest: {
              id: 'guest-1',
              name: data.name || 'Primary Guest',
              parsedData: data,
              isPrimary: true,
            },
            data,
          },
        ];

  return (
    <div className="clean-card form-box">
      {/* Top Header */}
      <div className="clean-card-header">
        <div className="clean-card-title">
          <FileText size={18} className="text-primary" />
          <span>Room Check-In &amp; Guest Particulars</span>
          {guests.length > 1 && (
            <span className="multi-form-auto-badge">
              <Sparkles size={13} />
              <span>{guests.length} Forms Auto-Filled</span>
            </span>
          )}
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
            title="Preview on Official A4 Size Paper"
          >
            <Printer size={14} />
            <span>{guests.length > 1 ? `Print Forms (${guests.length})` : 'View A4 Paper'}</span>
          </button>
        </div>
      </div>

      {/* Prominent Room Check-In & Tracking Banner */}
      <div className={`room-checkin-banner ${isCheckedIn ? 'banner-checked-in' : 'banner-vacant'}`}>
        <div className="checkin-banner-info">
          <div className="room-title-line">
            <BedDouble size={20} />
            <span className="room-title-num">Room {roomNumber}</span>
            <span className="room-title-type">• {roomType}</span>
          </div>

          <div className="checkin-status-row">
            {isCheckedIn ? (
              <div className="status-badge-green">
                <CheckCircle2 size={14} />
                <span>CHECKED IN ({guestCount} Occupants)</span>
                {activeRoom?.checkInTime && (
                  <span className="badge-time">
                    <Clock size={12} /> {activeRoom.checkInTime}
                  </span>
                )}
              </div>
            ) : (
              <div className="status-badge-amber">
                <span className="vacant-pulse-dot"></span>
                <span>VACANT / READY FOR CHECK-IN ({guestCount} Forms Ready)</span>
              </div>
            )}
          </div>
        </div>

        {/* Capacity Stepper & Check-In / Check-Out Actions */}
        <div className="checkin-banner-actions">
          {onUpdateMaxCapacity && (
            <div className="capacity-stepper-box" title="Adjust room maximum capacity">
              <span className="stepper-label">Max Capacity:</span>
              <div className="stepper-controls">
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() => onUpdateMaxCapacity(Math.max(1, maxCapacity - 1))}
                  title="Decrease Capacity"
                >
                  <Minus size={12} />
                </button>
                <span className="stepper-value">{maxCapacity}</span>
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() => onUpdateMaxCapacity(maxCapacity + 1)}
                  title="Increase Capacity"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>
          )}

          {!isCheckedIn ? (
            <button
              type="button"
              className="btn-checkin-action"
              onClick={onCheckInRoom}
              title="Confirm check-in for room and all guests"
            >
              <ShieldCheck size={16} />
              <span>Check-In Room {roomNumber} ({guestCount} Guests)</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn-checkout-action"
              onClick={onCheckOutRoom}
              title="Release room and check out all guests"
            >
              <DoorOpen size={16} />
              <span>Check Out Room</span>
            </button>
          )}
        </div>
      </div>

      {/* SECTION 1: STAY DATES & TIMES (Check-in / Check-out) */}
      <div className="form-sub-section stay-dates-card">
        <div className="sub-section-title">
          <Calendar size={16} className="text-primary" />
          <span>Stay Dates &amp; Duration</span>
          <span className="stay-duration-pill">{currentNights} {currentNights === 1 ? 'Night' : 'Nights'} Stay</span>
        </div>

        <div className="dates-grid-row">
          <div className="date-input-group">
            <label htmlFor="checkInDate">Check-In Date (تاريخ الوصول)</label>
            <input
              id="checkInDate"
              type="date"
              value={checkInDate}
              onChange={(e) => handleDateChange('checkInDate', e.target.value)}
              className="font-medium"
            />
          </div>

          <div className="date-input-group">
            <label htmlFor="checkInTime">Check-In Time</label>
            <input
              id="checkInTime"
              type="time"
              value={checkInTime}
              onChange={(e) => onUpdateRoomDetails?.({ checkInTime: e.target.value })}
            />
          </div>

          <div className="date-input-group">
            <label htmlFor="checkOutDate">Check-Out Date (تاريخ المغادرة)</label>
            <input
              id="checkOutDate"
              type="date"
              value={checkOutDate}
              onChange={(e) => handleDateChange('checkOutDate', e.target.value)}
              className="font-medium"
            />
          </div>

          <div className="date-input-group">
            <label htmlFor="checkOutTime">Check-Out Time</label>
            <input
              id="checkOutTime"
              type="time"
              value={checkOutTime}
              onChange={(e) => onUpdateRoomDetails?.({ checkOutTime: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: PAYMENT DETAILS (Typed manually in SAR) */}
      <div className="form-sub-section payment-card">
        <div className="sub-section-title">
          <CreditCard size={16} className="text-primary" />
          <span>Payment Details (Typed Manually in SAR • ر.س)</span>
          <span className={`payment-status-tag ${payment.status.toLowerCase()}`}>
            {payment.status}
          </span>
        </div>

        {/* Payment Mode Selector Pills */}
        <div className="payment-mode-selector">
          <label className="mode-label">Payment Mode (طريقة الدفع):</label>
          <div className="mode-pills-row">
            {(['Cash', 'Card'] as PaymentMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                className={`mode-pill-btn ${payment.mode === mode ? 'active' : ''}`}
                onClick={() => handlePaymentChange('mode', mode)}
              >
                {mode === 'Cash' && <Banknote size={15} />}
                {mode === 'Card' && <CreditCard size={15} />}
                <span>{mode}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Manual Payment Amounts in SAR */}
        <div className="payment-fields-grid">
          <div className="form-item">
            <label htmlFor="totalAmount">Total Tariff (SAR • المبلغ الإجمالي)</label>
            <div className="input-currency-wrapper">
              <span className="currency-prefix">SAR</span>
              <input
                id="totalAmount"
                type="number"
                step="any"
                value={payment.totalAmount}
                onChange={(e) => handlePaymentChange('totalAmount', e.target.value)}
                placeholder="0.00"
                className="font-semibold"
              />
            </div>
          </div>

          <div className="form-item">
            <label htmlFor="amountPaid">Amount Paid (SAR • المبلغ المدفوع)</label>
            <div className="input-currency-wrapper">
              <span className="currency-prefix">SAR</span>
              <input
                id="amountPaid"
                type="number"
                step="any"
                value={payment.amountPaid}
                onChange={(e) => handlePaymentChange('amountPaid', e.target.value)}
                placeholder="0.00"
                className="font-semibold text-success"
              />
            </div>
          </div>

          <div className="form-item">
            <label htmlFor="balanceDue">Balance Due (SAR • المتبقي)</label>
            <div className="input-currency-wrapper">
              <span className="currency-prefix">SAR</span>
              <input
                id="balanceDue"
                type="number"
                step="any"
                value={payment.balanceDue}
                onChange={(e) => handlePaymentChange('balanceDue', e.target.value)}
                placeholder="0.00"
                className="font-semibold text-warning"
              />
            </div>
          </div>

          <div className="form-item">
            <label htmlFor="paymentStatus">Payment Status</label>
            <select
              id="paymentStatus"
              value={payment.status}
              onChange={(e) => handlePaymentChange('status', e.target.value as PaymentStatus)}
            >
              <option value="Paid">Paid (مدفوع بالكامل)</option>
              <option value="Partial">Partial (دفع جزئي)</option>
              <option value="Pending">Pending (معلق)</option>
            </select>
          </div>

          <div className="form-item full-span">
            <label htmlFor="transactionRef">
              Transaction / Card Auth Ref (رقم المرجع أو البطاقة)
            </label>
            <input
              id="transactionRef"
              type="text"
              value={payment.transactionRef || ''}
              onChange={(e) => handlePaymentChange('transactionRef', e.target.value)}
              placeholder="e.g. TXN-894120 / AUTH-98214"
              className="font-mono"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: MULTI-GUEST / BULK FORMS AUTO-FILL CONTROLLER */}
      <div className="form-sub-section guests-management-card">
        <div className="sub-section-title">
          <Users size={16} className="text-primary" />
          <span>
            {guests.length > 1
              ? `Auto-Filled Check-In Forms (${guests.length} Guests from Uploaded Visas)`
              : 'Room Guest & Visa Particulars'}
          </span>

          <span className="guest-capacity-pill">
            {guests.length} / {maxCapacity} Capacity
          </span>
        </div>

        {/* View Switcher: Tabs vs Stacked All Forms */}
        <div className="forms-view-mode-bar">
          <div className="view-mode-toggles">
            <button
              type="button"
              className={`mode-toggle-btn ${viewMode === 'tabs' ? 'active' : ''}`}
              onClick={() => setViewMode('tabs')}
              title="Switch between guest forms using tabs"
            >
              <Layers size={13} />
              <span>Tabs View</span>
            </button>
            <button
              type="button"
              className={`mode-toggle-btn ${viewMode === 'all' ? 'active' : ''}`}
              onClick={() => setViewMode('all')}
              title="Show all forms stacked together on screen"
            >
              <FileSpreadsheet size={13} />
              <span>Show All {guests.length} Forms (Stacked)</span>
            </button>
          </div>

          {onAddGuestEntry && (
            <button
              type="button"
              className="add-guest-pill-btn"
              onClick={onAddGuestEntry}
              title={
                isAtCapacity
                  ? `Room at capacity (${maxCapacity}). Clicking will auto-increase capacity!`
                  : 'Add another guest form to this room'
              }
            >
              <Plus size={14} />
              <span>+ Add Another Form</span>
            </button>
          )}
        </div>

        {/* Guest Tabs Bar (Visible in Tabs View) */}
        {viewMode === 'tabs' && (
          <div className="guest-tabs-bar">
            <div className="guest-tabs-row">
              {guests.length === 0 ? (
                <button type="button" className="guest-tab-btn active">
                  <span>Guest 1 (Primary)</span>
                </button>
              ) : (
                guests.map((g, index) => {
                  const isActive = index === activeGuestIndex;
                  return (
                    <div
                      key={g.id}
                      className={`guest-tab-btn ${isActive ? 'active' : ''}`}
                      onClick={() => onSelectGuestIndex?.(index)}
                    >
                      <UserCheck size={13} />
                      <span className="guest-tab-num">#{index + 1}</span>
                      <span className="guest-tab-name">
                        {g.name || `Guest ${index + 1}`}
                        {index === 0 ? ' (Primary)' : ''}
                      </span>
                      {guests.length > 1 && onRemoveGuestEntry && (
                        <button
                          type="button"
                          className="tab-remove-guest-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveGuestEntry(index);
                          }}
                          title="Remove this guest form"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {isAtCapacity && (
          <div className="capacity-warning-row">
            <AlertTriangle size={14} className="text-warning" />
            <span>
              Room is at full capacity ({maxCapacity} guests). Capacity expands automatically when uploading more visas or clicking "+ Add Form".
            </span>
          </div>
        )}
      </div>

      {/* SECTION 4: RENDER FORMS (Either single active form or all stacked forms) */}
      {viewMode === 'tabs' ? (
        /* SINGLE FORM VIEW (for active guest) */
        <GuestFormCard
          guestIndex={activeGuestIndex}
          guestTotal={guestCount}
          guest={guests[activeGuestIndex] || formsToRender[0].guest}
          formData={data}
          onFieldChange={(field, val) => handleGuestFieldChange(activeGuestIndex, field, val)}
          onPrintThisForm={() => onPrintGuestA4?.(activeGuestIndex)}
          onRemoveThisForm={
            guests.length > 1 && onRemoveGuestEntry
              ? () => onRemoveGuestEntry(activeGuestIndex)
              : undefined
          }
        />
      ) : (
        /* ALL FORMS VIEW (Stacked view showing each filled form sequentially) */
        <div className="stacked-all-forms-container">
          <div className="stacked-banner-info">
            <Sparkles size={15} className="text-primary" />
            <span>
              All <strong>{formsToRender.length} Guest Forms</strong> auto-populated from uploaded visas. You can review, edit, and print each form individually below:
            </span>
          </div>

          {formsToRender.map((item) => (
            <GuestFormCard
              key={item.guest.id || item.index}
              guestIndex={item.index}
              guestTotal={formsToRender.length}
              guest={item.guest}
              formData={item.data}
              onFieldChange={(field, val) => handleGuestFieldChange(item.index, field, val)}
              onPrintThisForm={() => onPrintGuestA4?.(item.index)}
              onRemoveThisForm={
                formsToRender.length > 1 && onRemoveGuestEntry
                  ? () => onRemoveGuestEntry(item.index)
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* REUSABLE GUEST FORM CARD COMPONENT */
interface GuestFormCardProps {
  guestIndex: number;
  guestTotal: number;
  guest: GuestEntry;
  formData: TravelDocumentData;
  onFieldChange: (field: keyof TravelDocumentData, val: string) => void;
  onPrintThisForm?: () => void;
  onRemoveThisForm?: () => void;
}

const GuestFormCard: React.FC<GuestFormCardProps> = ({
  guestIndex,
  guestTotal,
  guest,
  formData,
  onFieldChange,
  onPrintThisForm,
  onRemoveThisForm,
}) => {
  const isPrimary = guestIndex === 0;

  return (
    <div className={`single-guest-form-card ${isPrimary ? 'is-primary-card' : ''}`}>
      <div className="guest-form-card-header">
        <div className="guest-card-title-line">
          <span className="guest-card-index-badge">
            Form #{guestIndex + 1} of {guestTotal}
          </span>
          <span className="guest-card-name-title">
            {formData.name || guest.name || `Guest ${guestIndex + 1}`}
          </span>
          {isPrimary && <span className="primary-tag">Primary Guest</span>}
          {formData.visaNumber && (
            <span className="visa-ref-tag">Visa Ref: {formData.visaNumber}</span>
          )}
        </div>

        <div className="guest-card-actions">
          {onPrintThisForm && (
            <button
              type="button"
              className="clean-btn-subtle small"
              onClick={onPrintThisForm}
              title={`Print A4 Form for ${formData.name || `Guest ${guestIndex + 1}`}`}
            >
              <Printer size={13} />
              <span>Print This Form</span>
            </button>
          )}

          {onRemoveThisForm && (
            <button
              type="button"
              className="clean-btn-subtle small text-danger"
              onClick={onRemoveThisForm}
              title="Remove this form"
            >
              <span>Remove Form</span>
            </button>
          )}
        </div>
      </div>

      <div className="clean-form-grid">
        {/* Row 1: Full Name */}
        <div className="form-item full-span">
          <label htmlFor={`name-${guestIndex}`}>Full Name (الاسم الكامل)</label>
          <input
            id={`name-${guestIndex}`}
            type="text"
            value={formData.name}
            onChange={(e) => onFieldChange('name', e.target.value)}
            placeholder="Full Name as on Passport/Visa"
            className="font-semibold"
          />
        </div>

        {/* Row 2: Visa Number & Passport Number */}
        <div className="form-item">
          <label htmlFor={`visaNumber-${guestIndex}`}>Visa Number (رقم التأشيرة)</label>
          <input
            id={`visaNumber-${guestIndex}`}
            type="text"
            value={formData.visaNumber}
            onChange={(e) => onFieldChange('visaNumber', e.target.value)}
            placeholder="Visa Number"
            className="font-mono font-bold"
          />
        </div>

        <div className="form-item">
          <label htmlFor={`passportNumber-${guestIndex}`}>Passport No (رقم الجواز)</label>
          <input
            id={`passportNumber-${guestIndex}`}
            type="text"
            value={formData.passportNumber}
            onChange={(e) => onFieldChange('passportNumber', e.target.value)}
            placeholder="Passport Number"
            className="font-mono font-bold"
          />
        </div>

        {/* Row 3: Date of Birth & Nationality */}
        <div className="form-item">
          <label htmlFor={`dateOfBirth-${guestIndex}`}>Date of Birth (تاريخ الميلاد)</label>
          <input
            id={`dateOfBirth-${guestIndex}`}
            type="text"
            value={formData.dateOfBirth}
            onChange={(e) => onFieldChange('dateOfBirth', e.target.value)}
            placeholder="YYYY-MM-DD"
          />
        </div>

        <div className="form-item">
          <label htmlFor={`nationality-${guestIndex}`}>Nationality (الجنسية)</label>
          <input
            id={`nationality-${guestIndex}`}
            type="text"
            value={formData.nationality}
            onChange={(e) => onFieldChange('nationality', e.target.value)}
            placeholder="Nationality / Country"
          />
        </div>

        {/* Row 4: Type of Visa & Duration of Stay */}
        <div className="form-item">
          <label htmlFor={`typeOfVisa-${guestIndex}`}>Type of Visa (نوع التأشيرة)</label>
          <input
            id={`typeOfVisa-${guestIndex}`}
            type="text"
            value={formData.typeOfVisa}
            onChange={(e) => onFieldChange('typeOfVisa', e.target.value)}
            placeholder="Type of Visa"
          />
        </div>

        <div className="form-item">
          <label htmlFor={`durationOfStay-${guestIndex}`}>Duration of Stay (مدة الإقامة)</label>
          <input
            id={`durationOfStay-${guestIndex}`}
            type="text"
            value={formData.durationOfStay}
            onChange={(e) => onFieldChange('durationOfStay', e.target.value)}
            placeholder="Duration of Stay"
          />
        </div>

        {/* Row 5: Date of Issue & Valid Until */}
        <div className="form-item">
          <label htmlFor={`dateOfIssue-${guestIndex}`}>Date of Issue (تاريخ الإصدار)</label>
          <input
            id={`dateOfIssue-${guestIndex}`}
            type="text"
            value={formData.dateOfIssue}
            onChange={(e) => onFieldChange('dateOfIssue', e.target.value)}
            placeholder="YYYY-MM-DD"
          />
        </div>

        <div className="form-item">
          <label htmlFor={`validUntil-${guestIndex}`}>Valid Until (صالحة حتى)</label>
          <input
            id={`validUntil-${guestIndex}`}
            type="text"
            value={formData.validUntil}
            onChange={(e) => onFieldChange('validUntil', e.target.value)}
            placeholder="YYYY-MM-DD"
            className="text-amber font-semibold"
          />
        </div>

        {/* Row 6: Place of Issue */}
        <div className="form-item full-span">
          <label htmlFor={`placeOfIssue-${guestIndex}`}>Place of Issue (مكان الإصدار)</label>
          <input
            id={`placeOfIssue-${guestIndex}`}
            type="text"
            value={formData.placeOfIssue}
            onChange={(e) => onFieldChange('placeOfIssue', e.target.value)}
            placeholder="City / Country of Issue"
          />
        </div>

        {/* Row 7: Umrah Operator & External Agent */}
        <div className="form-item full-span">
          <label htmlFor={`umrahOperator-${guestIndex}`}>
            Umrah Operator / Saudi Company (الشركة السعودية / مشغل العمرة)
          </label>
          <input
            id={`umrahOperator-${guestIndex}`}
            type="text"
            value={formData.umrahOperator}
            onChange={(e) => onFieldChange('umrahOperator', e.target.value)}
            placeholder="Operator / Company Name"
          />
        </div>

        <div className="form-item full-span">
          <label htmlFor={`externalAgent-${guestIndex}`}>External Agent (الوكيل الخارجي)</label>
          <input
            id={`externalAgent-${guestIndex}`}
            type="text"
            value={formData.externalAgent}
            onChange={(e) => onFieldChange('externalAgent', e.target.value)}
            placeholder="External Travel Agent / Agency"
          />
        </div>
      </div>
    </div>
  );
};

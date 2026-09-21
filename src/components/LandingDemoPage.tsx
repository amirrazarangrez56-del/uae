import React, { useState } from 'react';
import type { HotelRoom, RoomStatus, DemoGuestProfile } from '../types/document';
import { 
  User, 
  Phone, 
  DoorOpen, 
  FileText, 
  Sparkles,
  ArrowRight,
  Users,
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  FileCheck2,
  Wrench,
  Brush
} from 'lucide-react';

interface LandingDemoPageProps {
  rooms: HotelRoom[];
  onSelectRoom: (room: HotelRoom) => void;
  onCheckOutRoom: (roomId: string) => void;
  onViewA4: (room: HotelRoom) => void;
  onUpdateRoomStatus?: (roomId: string, status: RoomStatus) => void;
  // Fallback props for backwards compatibility
  guests?: DemoGuestProfile[];
  onSelectGuest?: (guest: DemoGuestProfile) => void;
  onCheckOutGuest?: (guestId: string) => void;
}

type FilterType = 'all' | 'ready' | 'occupied' | 'cleaning' | 'maintenance';

export const LandingDemoPage: React.FC<LandingDemoPageProps> = ({
  rooms,
  onSelectRoom,
  onCheckOutRoom,
  onViewA4,
  onUpdateRoomStatus,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const readyCount = rooms.filter((r) => r.status === 'available').length;
  const occupiedCount = rooms.filter((r) => r.status === 'checked_in').length;
  const cleaningCount = rooms.filter((r) => r.status === 'cleaning').length;
  const maintenanceCount = rooms.filter((r) => r.status === 'maintenance').length;

  const filteredRooms = rooms.filter((r) => {
    if (activeFilter === 'ready') return r.status === 'available';
    if (activeFilter === 'occupied') return r.status === 'checked_in';
    if (activeFilter === 'cleaning') return r.status === 'cleaning';
    if (activeFilter === 'maintenance') return r.status === 'maintenance';
    return true;
  });

  return (
    <div className="sari-hotel-board-page">
      {/* Main Board Container */}
      <div className="rooms-board-container">
        {/* Rooms Header Row with Title & Filter Pills */}
        <div className="rooms-top-control-bar">
          <div className="rooms-title-box">
            <h2 className="rooms-section-title">Rooms Board</h2>
            <span className="rooms-board-subtitle">Real-time status, occupancy, and guest particulars</span>
          </div>

          {/* Filter Pills */}
          <div className="rooms-filter-pills-row">
            <button
              type="button"
              className={`filter-pill-btn ${activeFilter === 'all' ? 'active-dark' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              <span>All Rooms</span>
              <span className="pill-count-tag">{rooms.length}</span>
            </button>

            <button
              type="button"
              className={`filter-pill-btn ${activeFilter === 'ready' ? 'active-dark' : ''}`}
              onClick={() => setActiveFilter('ready')}
            >
              <span>Ready (Check-In)</span>
              <span className="pill-count-tag">{readyCount}</span>
            </button>

            <button
              type="button"
              className={`filter-pill-btn ${activeFilter === 'occupied' ? 'active-dark' : ''}`}
              onClick={() => setActiveFilter('occupied')}
            >
              <span>Occupied</span>
              <span className="pill-count-tag">{occupiedCount}</span>
            </button>

            <button
              type="button"
              className={`filter-pill-btn ${activeFilter === 'cleaning' ? 'active-dark' : ''}`}
              onClick={() => setActiveFilter('cleaning')}
            >
              <span>Needs Cleaning</span>
              <span className="pill-count-tag">{cleaningCount}</span>
            </button>

            <button
              type="button"
              className={`filter-pill-btn ${activeFilter === 'maintenance' ? 'active-dark' : ''}`}
              onClick={() => setActiveFilter('maintenance')}
            >
              <span>Maintenance</span>
              <span className="pill-count-tag">{maintenanceCount}</span>
            </button>
          </div>
        </div>

        {/* Room Cards Grid */}
        {filteredRooms.length === 0 ? (
          <div className="empty-rooms-state">
            <p>No rooms in this category right now.</p>
          </div>
        ) : (
          <div className="pms-rooms-grid">
            {filteredRooms.map((room) => {
              const isOccupied = room.status === 'checked_in';
              const isCleaning = room.status === 'cleaning';
              const isMaintenance = room.status === 'maintenance';
              const primaryGuest = room.guests?.[0];
              const guestName = primaryGuest?.name || 'Guest Occupant';
              const guestCount = room.guests?.length || (isOccupied ? 1 : 0);
              const maxCap = room.maxCapacity || 2;
              const payment = room.payment;

              if (isOccupied) {
                return (
                  /* OCCUPIED ROOM CARD */
                  <div 
                    key={room.id}
                    className="pms-room-card occupied-card"
                    onClick={() => onSelectRoom(room)}
                  >
                    <div className="room-card-inner">
                      {/* Top: Room Number & OCCUPIED Badge */}
                      <div className="room-number-display">{room.roomNumber}</div>
                      <div className="room-meta-type-line">{room.roomType}</div>
                      
                      <div className="badge-pill badge-occupied">
                        OCCUPIED ({guestCount}/{maxCap})
                      </div>

                      {/* Bottom: Guest & Phone Details */}
                      <div className="occupied-guest-details">
                        <div className="guest-name-line" title={guestName}>
                          <User size={14} className="guest-icon" />
                          <span className="guest-name-text">
                            {guestName}
                            {guestCount > 1 ? ` (+${guestCount - 1} more)` : ''}
                          </span>
                        </div>

                        {primaryGuest?.phoneNumber && (
                          <div className="guest-phone-line">
                            <Phone size={13} className="phone-icon" />
                            <span className="guest-phone-text">{primaryGuest.phoneNumber}</span>
                          </div>
                        )}

                        {/* Stay Dates & Duration */}
                        {(room.checkInDate || room.checkInTime) && (
                          <div className="guest-stay-dates-tag">
                            <Calendar size={12} />
                            <span>
                              {room.checkInDate || room.checkInTime}
                              {room.checkOutDate ? ` → ${room.checkOutDate}` : ''}
                              {room.nights ? ` (${room.nights}N)` : ''}
                            </span>
                          </div>
                        )}

                        {/* Payment Mode & Amount in SAR */}
                        {payment && (
                          <div className={`guest-payment-badge ${payment.status?.toLowerCase() || 'pending'}`}>
                            {payment.mode === 'Cash' && <Banknote size={12} />}
                            {payment.mode === 'Cheque' && <FileCheck2 size={12} />}
                            {payment.mode === 'UPI' && <Smartphone size={12} />}
                            {payment.mode === 'Card' && <CreditCard size={12} />}
                            <span>{payment.mode} • {payment.amountPaid || payment.totalAmount || room.pricePerNight} SAR</span>
                            <span className="pay-tag-status">({payment.status})</span>
                          </div>
                        )}
                      </div>

                      {/* Card Actions on Hover / Interaction */}
                      <div className="occupied-card-hover-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="btn-pms-action btn-view-dossier"
                          onClick={() => onViewA4(room)}
                          title="Print Check-in Record"
                        >
                          <FileText size={13} />
                          <span>Form</span>
                        </button>
                        <button
                          type="button"
                          className="btn-pms-action btn-checkout"
                          onClick={() => onCheckOutRoom(room.id)}
                          title="Check out guest"
                        >
                          <DoorOpen size={13} />
                          <span>Check Out</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              if (isCleaning || isMaintenance) {
                return (
                  /* OUT OF SERVICE (CLEANING / MAINTENANCE) */
                  <div 
                    key={room.id}
                    className={`pms-room-card oos-card ${isCleaning ? 'cleaning-card' : 'maintenance-card'}`}
                    onClick={() => onSelectRoom(room)}
                  >
                    <div className="room-card-inner centered-content">
                      <div className="room-number-display">{room.roomNumber}</div>
                      <div className="room-meta-type-line">{room.roomType}</div>
                      
                      <div className={`badge-pill ${isCleaning ? 'badge-cleaning' : 'badge-maintenance'}`}>
                        {isCleaning ? <Brush size={12} /> : <Wrench size={12} />}
                        <span>{isCleaning ? 'NEEDS CLEANING' : 'MAINTENANCE'}</span>
                      </div>

                      <div className="oos-capacity-hint">
                        <Users size={13} />
                        <span>Capacity: {maxCap} Guests</span>
                      </div>

                      {onUpdateRoomStatus && (
                        <div className="oos-card-action" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="btn-ready-toggle"
                            onClick={() => onUpdateRoomStatus(room.id, 'available')}
                          >
                            Mark as Ready
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              /* READY ROOM CARD */
              return (
                <div 
                  key={room.id}
                  className="pms-room-card ready-card"
                  onClick={() => onSelectRoom(room)}
                  title={`Click to check-in Room ${room.roomNumber}`}
                >
                  <div className="room-card-inner centered-content">
                    {/* Centered Large Room Number */}
                    <div className="room-number-display">{room.roomNumber}</div>
                    <div className="room-meta-type-line">{room.roomType} • {room.floor || '1st Floor'}</div>
                    
                    {/* READY Status Badge */}
                    <div className="badge-pill badge-ready">
                      READY FOR CHECK-IN
                    </div>

                    <div className="ready-specs-row">
                      <span className="spec-item">
                        <Users size={12} />
                        <span>Max {maxCap} Guests</span>
                      </span>
                      <span className="spec-dot">•</span>
                      <span className="spec-item font-semibold">
                        {room.pricePerNight} SAR / Night
                      </span>
                    </div>

                    {/* Subtle Click to Check In hint */}
                    <div className="ready-click-hint">
                      <Sparkles size={13} />
                      <span>Check In / Scan</span>
                      <ArrowRight size={12} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

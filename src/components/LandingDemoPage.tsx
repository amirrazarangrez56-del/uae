import React, { useState } from 'react';
import type { DemoGuestProfile } from '../types/document';
import { 
  User, 
  Phone, 
  DoorOpen, 
  FileText, 
  Sparkles,
  ArrowRight,
  Clock
} from 'lucide-react';

interface LandingDemoPageProps {
  guests: DemoGuestProfile[];
  onSelectGuest: (guest: DemoGuestProfile) => void;
  onCheckOutGuest: (guestId: string) => void;
  onDirectCheckInGuest: (guestId: string) => void;
  onViewA4: (guest: DemoGuestProfile) => void;
}

type FilterType = 'all' | 'ready' | 'occupied' | 'cleaning' | 'maintenance';

export const LandingDemoPage: React.FC<LandingDemoPageProps> = ({
  guests,
  onSelectGuest,
  onCheckOutGuest,
  onViewA4,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const readyCount = guests.filter((g) => g.status === 'available').length;
  const occupiedCount = guests.filter((g) => g.status === 'checked_in').length;
  const cleaningCount = 0;
  const maintenanceCount = 0;

  const filteredGuests = guests.filter((g) => {
    if (activeFilter === 'ready') return g.status === 'available';
    if (activeFilter === 'occupied') return g.status === 'checked_in';
    if (activeFilter === 'cleaning' || activeFilter === 'maintenance') return false;
    return true;
  });

  return (
    <div className="sari-hotel-board-page">
      {/* Main Board Container */}
      <div className="rooms-board-container">
        {/* Rooms Header Row with Title & Filter Pills */}
        <div className="rooms-top-control-bar">
          <h2 className="rooms-section-title">Rooms</h2>

          {/* Filter Pills matching the screenshot */}
          <div className="rooms-filter-pills-row">
            <button
              type="button"
              className={`filter-pill-btn ${activeFilter === 'all' ? 'active-dark' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              <span>All Rooms</span>
              <span className="pill-count-tag">{guests.length}</span>
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

        {/* Room Cards Grid (Matching the Screenshot Layout) */}
        {filteredGuests.length === 0 ? (
          <div className="empty-rooms-state">
            <p>No rooms in this category right now.</p>
          </div>
        ) : (
          <div className="pms-rooms-grid">
            {filteredGuests.map((room) => {
              const isOccupied = room.status === 'checked_in';

              return isOccupied ? (
                /* OCCUPIED ROOM CARD (Room 101 in screenshot) */
                <div 
                  key={room.id}
                  className="pms-room-card occupied-card"
                  onClick={() => onSelectGuest(room)}
                >
                  <div className="room-card-inner">
                    {/* Top: Room Number & OCCUPIED Badge */}
                    <div className="room-number-display">{room.roomNumber}</div>
                    <div className="badge-pill badge-occupied">
                      OCCUPIED
                    </div>

                    {/* Bottom: Guest & Phone Details */}
                    <div className="occupied-guest-details">
                      <div className="guest-name-line" title={room.guestName}>
                        <User size={14} className="guest-icon" />
                        <span className="guest-name-text">{room.guestName}</span>
                      </div>
                      <div className="guest-phone-line">
                        <Phone size={13} className="phone-icon" />
                        <span className="guest-phone-text">
                          {room.phoneNumber || '9028850715'}
                        </span>
                      </div>
                      {room.checkInTime && (
                        <div className="guest-checkin-time-line" title={`Check-in: ${room.checkInTime}`}>
                          <Clock size={12} className="time-icon" />
                          <span className="guest-time-text">{room.checkInTime}</span>
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
                        onClick={() => onCheckOutGuest(room.id)}
                        title="Check out guest"
                      >
                        <DoorOpen size={13} />
                        <span>Check Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* READY ROOM CARD (Rooms 102, 103, 777 in screenshot) */
                <div 
                  key={room.id}
                  className="pms-room-card ready-card"
                  onClick={() => onSelectGuest(room)}
                  title={`Click to open document upload & parsing for Room ${room.roomNumber}`}
                >
                  <div className="room-card-inner centered-content">
                    {/* Centered Large Room Number */}
                    <div className="room-number-display">{room.roomNumber}</div>
                    
                    {/* READY Status Badge */}
                    <div className="badge-pill badge-ready">
                      READY
                    </div>

                    {/* Subtle Click to Check In hint */}
                    <div className="ready-click-hint">
                      <Sparkles size={13} />
                      <span>Check In</span>
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

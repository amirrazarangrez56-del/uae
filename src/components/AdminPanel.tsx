import React, { useState } from 'react';
import type { HotelRoom, RoomStatus } from '../types/document';
import { 
  Building2, 
  Plus, 
  Edit3, 
  Trash2, 
  Users, 
  BedDouble, 
  AlertTriangle, 
  Search, 
  CheckCircle2, 
  CreditCard,
  Minus,
  Sparkles,
  X,
  Key
} from 'lucide-react';

interface AdminPanelProps {
  rooms: HotelRoom[];
  onAddRoom: (newRoom: Omit<HotelRoom, 'id'>) => void;
  onUpdateRoom: (roomId: string, updates: Partial<HotelRoom>) => void;
  onDeleteRoom: (roomId: string) => void;
  onSelectRoomForCheckIn: (room: HotelRoom) => void;
  onOpenKeyModal?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  rooms,
  onAddRoom,
  onUpdateRoom,
  onDeleteRoom,
  onSelectRoomForCheckIn,
  onOpenKeyModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | RoomStatus>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<HotelRoom | null>(null);
  const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);

  // Form state for Add / Edit Room
  const [formData, setFormData] = useState<{
    roomNumber: string;
    roomType: string;
    floor: string;
    maxCapacity: number;
    pricePerNight: number;
    status: RoomStatus;
  }>({
    roomNumber: '',
    roomType: 'Deluxe Room',
    floor: '1st Floor',
    maxCapacity: 2,
    pricePerNight: 300,
    status: 'available',
  });

  // Calculate Metrics
  const totalRooms = rooms.length;
  const readyRooms = rooms.filter((r) => r.status === 'available').length;
  const occupiedRooms = rooms.filter((r) => r.status === 'checked_in').length;
  const cleaningRooms = rooms.filter((r) => r.status === 'cleaning').length;
  const maintenanceRooms = rooms.filter((r) => r.status === 'maintenance').length;
  const totalCapacity = rooms.reduce((acc, r) => acc + (r.maxCapacity || 2), 0);
  const totalOccupants = rooms.reduce((acc, r) => acc + (r.guests?.length || (r.status === 'checked_in' ? 1 : 0)), 0);

  const totalCollectedSAR = rooms.reduce((acc, r) => {
    const paid = parseFloat(String(r.payment?.amountPaid || 0));
    return acc + (isNaN(paid) ? 0 : paid);
  }, 0);

  const totalBalanceSAR = rooms.reduce((acc, r) => {
    const bal = parseFloat(String(r.payment?.balanceDue || 0));
    return acc + (isNaN(bal) ? 0 : bal);
  }, 0);

  // Filtered rooms
  const filteredRooms = rooms.filter((r) => {
    const matchSearch = 
      r.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.roomType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(r.floor).toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleOpenAddModal = () => {
    setFormData({
      roomNumber: `${Math.floor(100 + Math.random() * 900)}`,
      roomType: 'Deluxe Room',
      floor: '1st Floor',
      maxCapacity: 2,
      pricePerNight: 300,
      status: 'available',
    });
    setEditingRoom(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (room: HotelRoom) => {
    setFormData({
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      floor: String(room.floor || '1st Floor'),
      maxCapacity: room.maxCapacity || 2,
      pricePerNight: typeof room.pricePerNight === 'number' ? room.pricePerNight : parseFloat(String(room.pricePerNight)) || 300,
      status: room.status,
    });
    setEditingRoom(room);
    setIsAddModalOpen(true);
  };

  const handleSubmitRoomForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.roomNumber.trim()) return;

    if (editingRoom) {
      onUpdateRoom(editingRoom.id, {
        roomNumber: formData.roomNumber.trim(),
        roomType: formData.roomType,
        floor: formData.floor,
        maxCapacity: formData.maxCapacity,
        pricePerNight: formData.pricePerNight,
        status: formData.status,
      });
    } else {
      onAddRoom({
        roomNumber: formData.roomNumber.trim(),
        roomType: formData.roomType,
        floor: formData.floor,
        maxCapacity: formData.maxCapacity,
        pricePerNight: formData.pricePerNight,
        status: formData.status,
        payment: {
          mode: 'Cash',
          status: 'Pending',
          currency: 'SAR',
          totalAmount: formData.pricePerNight,
          amountPaid: 0,
          balanceDue: formData.pricePerNight,
          transactionRef: '',
        },
        guests: [],
      });
    }

    setIsAddModalOpen(false);
    setEditingRoom(null);
  };

  const handleQuickCapacityChange = (roomId: string, newCap: number) => {
    if (newCap < 1) return;
    onUpdateRoom(roomId, { maxCapacity: newCap });
  };

  const handleQuickStatusChange = (roomId: string, newStatus: RoomStatus) => {
    onUpdateRoom(roomId, { status: newStatus });
  };

  return (
    <div className="admin-panel-page">
      {/* Top Banner & Title */}
      <div className="admin-top-bar">
        <div className="admin-title-group">
          <Building2 size={28} className="text-primary" />
          <div>
            <h1 className="admin-main-title">Hotel Administration &amp; Room Management</h1>
            <p className="admin-subtitle">
              Manage rooms, customize max guest capacity, modify tariffs, and track SAR collections
            </p>
          </div>
        </div>

        <div className="admin-header-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {onOpenKeyModal && (
            <button
              type="button"
              className="clean-btn-secondary"
              onClick={onOpenKeyModal}
              title="Configure Gemini API Keys (Auto-Failover)"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Key size={16} />
              <span>Gemini API Keys</span>
            </button>
          )}

          <button
            type="button"
            className="clean-btn-primary admin-add-btn"
            onClick={handleOpenAddModal}
          >
            <Plus size={16} />
            <span>Add New Room</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Metrics Dashboard */}
      <div className="admin-metrics-grid">
        <div className="admin-metric-card">
          <div className="metric-icon-box blue">
            <BedDouble size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Rooms</span>
            <span className="metric-num">{totalRooms}</span>
          </div>
          <div className="metric-sub">{readyRooms} Ready • {occupiedRooms} Occupied</div>
        </div>

        <div className="admin-metric-card">
          <div className="metric-icon-box purple">
            <Users size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Hotel Capacity</span>
            <span className="metric-num">{totalCapacity} <span className="metric-unit">Guests</span></span>
          </div>
          <div className="metric-sub">{totalOccupants} Current Occupants</div>
        </div>

        <div className="admin-metric-card">
          <div className="metric-icon-box green">
            <CheckCircle2 size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Occupancy Rate</span>
            <span className="metric-num">
              {totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0}%
            </span>
          </div>
          <div className="metric-sub">{cleaningRooms + maintenanceRooms} Out of Service</div>
        </div>

        <div className="admin-metric-card">
          <div className="metric-icon-box amber">
            <CreditCard size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Revenue (SAR)</span>
            <span className="metric-num">{totalCollectedSAR.toLocaleString()} <span className="metric-unit">SAR</span></span>
          </div>
          <div className="metric-sub text-warning">
            Pending Due: {totalBalanceSAR.toLocaleString()} SAR
          </div>
        </div>
      </div>

      {/* Room Table & Controls Container */}
      <div className="clean-card admin-table-card">
        <div className="table-filter-controls">
          <div className="search-box-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by Room Number, Type, or Floor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-search-input"
            />
          </div>

          <div className="status-filter-buttons">
            <button
              type="button"
              className={`filter-tag-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All ({rooms.length})
            </button>
            <button
              type="button"
              className={`filter-tag-btn ${statusFilter === 'available' ? 'active' : ''}`}
              onClick={() => setStatusFilter('available')}
            >
              Ready ({readyRooms})
            </button>
            <button
              type="button"
              className={`filter-tag-btn ${statusFilter === 'checked_in' ? 'active' : ''}`}
              onClick={() => setStatusFilter('checked_in')}
            >
              Occupied ({occupiedRooms})
            </button>
            <button
              type="button"
              className={`filter-tag-btn ${statusFilter === 'cleaning' ? 'active' : ''}`}
              onClick={() => setStatusFilter('cleaning')}
            >
              Needs Cleaning ({cleaningRooms})
            </button>
            <button
              type="button"
              className={`filter-tag-btn ${statusFilter === 'maintenance' ? 'active' : ''}`}
              onClick={() => setStatusFilter('maintenance')}
            >
              Maintenance ({maintenanceRooms})
            </button>
          </div>
        </div>

        {/* Room Table View */}
        <div className="admin-table-scroll">
          <table className="admin-rooms-table">
            <thead>
              <tr>
                <th>Room No.</th>
                <th>Room Type &amp; Floor</th>
                <th>Max Capacity (Bed Spaces)</th>
                <th>Occupancy</th>
                <th>Price / Night (SAR)</th>
                <th>Status</th>
                <th>Payment Mode &amp; Due</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-table-cell">
                    No rooms found matching your search.
                  </td>
                </tr>
              ) : (
                filteredRooms.map((room) => {
                  const occupantCount = room.guests?.length || (room.status === 'checked_in' ? 1 : 0);

                  return (
                    <tr key={room.id} className={`admin-room-row ${room.status}`}>
                      <td className="cell-room-num">
                        <span className="room-num-badge">Room {room.roomNumber}</span>
                      </td>

                      <td className="cell-room-type">
                        <div className="type-title">{room.roomType}</div>
                        <div className="type-floor">{room.floor || '1st Floor'}</div>
                      </td>

                      {/* Dynamic Max Capacity Stepper */}
                      <td className="cell-capacity">
                        <div className="table-capacity-stepper">
                          <button
                            type="button"
                            className="cap-step-btn"
                            onClick={() => handleQuickCapacityChange(room.id, (room.maxCapacity || 2) - 1)}
                            title="Decrease Capacity"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="cap-val-tag">
                            <strong>{room.maxCapacity || 2}</strong> Guests
                          </span>
                          <button
                            type="button"
                            className="cap-step-btn"
                            onClick={() => handleQuickCapacityChange(room.id, (room.maxCapacity || 2) + 1)}
                            title="Increase Capacity"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </td>

                      {/* Current Occupancy */}
                      <td className="cell-occupancy">
                        <span className={`occupancy-pill ${occupantCount > 0 ? 'has-guests' : 'empty'}`}>
                          <Users size={12} />
                          <span>{occupantCount} / {room.maxCapacity || 2}</span>
                        </span>
                      </td>

                      {/* Tariff in SAR */}
                      <td className="cell-price">
                        <span className="price-sar-val">{room.pricePerNight} SAR</span>
                      </td>

                      {/* Status Dropdown */}
                      <td className="cell-status">
                        <select
                          value={room.status}
                          onChange={(e) => handleQuickStatusChange(room.id, e.target.value as RoomStatus)}
                          className={`status-select-pill ${room.status}`}
                        >
                          <option value="available">Ready (Available)</option>
                          <option value="checked_in">Occupied</option>
                          <option value="cleaning">Needs Cleaning</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                      </td>

                      {/* Payment */}
                      <td className="cell-payment">
                        <div className="pay-cell-group">
                          <span className="pay-mode-tag">{room.payment?.mode || 'Cash'}</span>
                          <span className={`pay-status-mini ${room.payment?.status?.toLowerCase() || 'pending'}`}>
                            {room.payment?.status || 'Pending'}
                          </span>
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="cell-actions">
                        <div className="row-action-buttons">
                          <button
                            type="button"
                            className="btn-table-action checkin"
                            onClick={() => onSelectRoomForCheckIn(room)}
                            title="Open Scanner / Check-In"
                          >
                            <Sparkles size={13} />
                            <span>Check-In</span>
                          </button>

                          <button
                            type="button"
                            className="btn-table-action edit"
                            onClick={() => handleOpenEditModal(room)}
                            title="Edit Room Details"
                          >
                            <Edit3 size={13} />
                          </button>

                          <button
                            type="button"
                            className="btn-table-action delete"
                            onClick={() => setDeletingRoomId(room.id)}
                            title="Delete Room"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Room Modal */}
      {isAddModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <div className="modal-header">
              <div className="modal-title">
                <Building2 size={18} className="text-primary" />
                <span>{editingRoom ? `Edit Room ${editingRoom.roomNumber}` : 'Add New Hotel Room'}</span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsAddModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitRoomForm} className="modal-form">
              <div className="modal-form-grid">
                <div className="form-item">
                  <label htmlFor="modalRoomNumber">Room Number (رقم الغرفة) *</label>
                  <input
                    id="modalRoomNumber"
                    type="text"
                    required
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    placeholder="e.g. 104, 205, 888"
                    className="font-bold font-display"
                  />
                </div>

                <div className="form-item">
                  <label htmlFor="modalRoomType">Room Type (نوع الغرفة) *</label>
                  <select
                    id="modalRoomType"
                    value={formData.roomType}
                    onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                  >
                    <option value="Deluxe Room">Deluxe Room</option>
                    <option value="Superior King">Superior King</option>
                    <option value="Executive Suite">Executive Suite</option>
                    <option value="Family Suite">Family Suite</option>
                    <option value="Royal Penthouse">Royal Penthouse</option>
                    <option value="Standard Twin">Standard Twin</option>
                  </select>
                </div>

                <div className="form-item">
                  <label htmlFor="modalFloor">Floor (الطابق)</label>
                  <input
                    id="modalFloor"
                    type="text"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    placeholder="e.g. 1st Floor, 2nd Floor"
                  />
                </div>

                <div className="form-item">
                  <label htmlFor="modalCapacity">
                    Max Capacity (السعة القصوى - عدد النزلاء) *
                  </label>
                  <div className="modal-stepper-row">
                    <button
                      type="button"
                      className="stepper-btn"
                      onClick={() => setFormData({ ...formData, maxCapacity: Math.max(1, formData.maxCapacity - 1) })}
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      id="modalCapacity"
                      type="number"
                      min={1}
                      max={20}
                      value={formData.maxCapacity}
                      onChange={(e) => setFormData({ ...formData, maxCapacity: parseInt(e.target.value, 10) || 1 })}
                      className="stepper-num-input"
                    />
                    <button
                      type="button"
                      className="stepper-btn"
                      onClick={() => setFormData({ ...formData, maxCapacity: formData.maxCapacity + 1 })}
                    >
                      <Plus size={14} />
                    </button>
                    <span className="stepper-unit">Guests</span>
                  </div>
                </div>

                <div className="form-item">
                  <label htmlFor="modalPrice">Price Per Night (SAR • سعر الليلة) *</label>
                  <div className="input-currency-wrapper">
                    <span className="currency-prefix">SAR</span>
                    <input
                      id="modalPrice"
                      type="number"
                      required
                      min={0}
                      step="any"
                      value={formData.pricePerNight}
                      onChange={(e) => setFormData({ ...formData, pricePerNight: parseFloat(e.target.value) || 0 })}
                      className="font-bold"
                    />
                  </div>
                </div>

                <div className="form-item">
                  <label htmlFor="modalStatus">Initial Status (الحالة)</label>
                  <select
                    id="modalStatus"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as RoomStatus })}
                  >
                    <option value="available">Ready (Available)</option>
                    <option value="cleaning">Needs Cleaning</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions-footer">
                <button
                  type="button"
                  className="clean-btn-subtle"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="clean-btn-primary"
                >
                  {editingRoom ? 'Save Changes' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingRoomId && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card delete-modal">
            <div className="modal-header">
              <div className="modal-title text-danger">
                <AlertTriangle size={18} />
                <span>Confirm Room Deletion</span>
              </div>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete <strong>Room {rooms.find((r) => r.id === deletingRoomId)?.roomNumber}</strong>?
              </p>
              <p className="delete-sub-warn">
                This action cannot be undone. All assigned guests and records will be removed.
              </p>
            </div>
            <div className="modal-actions-footer">
              <button
                type="button"
                className="clean-btn-subtle"
                onClick={() => setDeletingRoomId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="clean-btn-danger"
                onClick={() => {
                  onDeleteRoom(deletingRoomId);
                  setDeletingRoomId(null);
                }}
              >
                <Trash2 size={14} />
                <span>Delete Room</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

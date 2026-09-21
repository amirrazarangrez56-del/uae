import { useState, useEffect } from 'react';
import type { 
  GeminiKeyConfig, 
  TravelDocumentData,
  HotelRoom,
  GuestEntry
} from './types/document';
import { EMPTY_DOCUMENT, INITIAL_HOTEL_ROOMS } from './services/sampleData';
import { extractDocumentWithFailover } from './services/geminiService';
import { Header } from './components/Header';
import { KeyManagerModal } from './components/KeyManagerModal';
import { DocumentScanner, type QueuedDocument } from './components/DocumentScanner';
import { FormEditor } from './components/FormEditor';
import { A4DocumentPreview } from './components/A4DocumentPreview';
import { LandingDemoPage } from './components/LandingDemoPage';
import { AdminPanel } from './components/AdminPanel';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  X
} from 'lucide-react';
import './App.css';

const PROVIDED_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) || '';

const DEFAULT_KEYS: GeminiKeyConfig[] = [
  {
    id: 1,
    key: PROVIDED_API_KEY,
    label: 'Key 1 (Primary)',
    status: PROVIDED_API_KEY ? 'active' : 'untested',
    errorCount: 0,
  },
  {
    id: 2,
    key: '',
    label: 'Key 2 (Auto-Failover)',
    status: 'standby',
    errorCount: 0,
  },
  {
    id: 3,
    key: '',
    label: 'Key 3 (Auto-Failover)',
    status: 'standby',
    errorCount: 0,
  },
];

export function App() {
  const [keys, setKeys] = useState<GeminiKeyConfig[]>(() => {
    try {
      const saved = localStorage.getItem('emirates_gemini_keys');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (PROVIDED_API_KEY) {
            parsed[0] = {
              ...parsed[0],
              key: PROVIDED_API_KEY,
              status: 'active',
              errorCount: 0,
            };
          }
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_KEYS;
  });

  const [rooms, setRooms] = useState<HotelRoom[]>(() => {
    try {
      const saved = localStorage.getItem('sari_almesk_rooms_v8');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_HOTEL_ROOMS;
  });

  const [activeRoomId, setActiveRoomId] = useState<string>(rooms[0]?.id || 'room-101');
  const [activeGuestIndex, setActiveGuestIndex] = useState<number>(0);
  const [selectedModel] = useState<string>('gemini-3.1-flash-lite');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(false);
  const [documentData, setDocumentData] = useState<TravelDocumentData>(EMPTY_DOCUMENT);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [queuedDocs, setQueuedDocs] = useState<QueuedDocument[]>([]);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; currentDocName?: string } | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'demo' | 'editor' | 'a4' | 'admin'>('demo');
  const [toast, setToast] = useState<{
    id: string;
    type: 'success' | 'warn' | 'error';
    title: string;
    message: string;
  } | null>(null);

  const activeRoom = rooms.find((r) => r.id === activeRoomId) || rooms[0] || null;

  useEffect(() => {
    try {
      localStorage.setItem('emirates_gemini_keys', JSON.stringify(keys));
    } catch {
      // ignore
    }
  }, [keys]);

  useEffect(() => {
    try {
      localStorage.setItem('sari_almesk_rooms_v8', JSON.stringify(rooms));
    } catch {
      // ignore
    }
  }, [rooms]);

  const showToast = (title: string, message: string, type: 'success' | 'warn' | 'error' = 'success') => {
    setToast({
      id: `${Date.now()}`,
      title,
      message,
      type,
    });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  const handleSaveKeys = (updatedKeys: GeminiKeyConfig[]) => {
    setKeys(updatedKeys);
    showToast('Keys Saved', 'Gemini API keys updated successfully.');
  };

  const hasConfiguredKeys = keys.some((k) => k.key && k.key.trim().length > 0);

  // Sync documentData with the active guest when switching rooms or guest tabs
  const handleSelectRoom = (room: HotelRoom) => {
    setActiveRoomId(room.id);
    setActiveGuestIndex(0);

    const primaryGuest = room.guests?.[0];
    if (primaryGuest && primaryGuest.parsedData) {
      setImageSrc(primaryGuest.documentImageUrl || null);
      setDocumentData(primaryGuest.parsedData);
    } else if (primaryGuest) {
      setImageSrc(primaryGuest.documentImageUrl || null);
      setDocumentData({ ...EMPTY_DOCUMENT, name: primaryGuest.name });
    } else {
      setImageSrc(null);
      setDocumentData(EMPTY_DOCUMENT);
    }

    setQueuedDocs([]);
    setActiveTab('editor');
    showToast(
      'Room Selected',
      `Room ${room.roomNumber} selected. Upload passport(s) or visa(s) to check-in!`,
      'success'
    );
  };

  const handleSelectGuestIndex = (idx: number) => {
    if (!activeRoom) return;
    setActiveGuestIndex(idx);
    const guest = activeRoom.guests[idx];
    if (guest && guest.parsedData) {
      setDocumentData(guest.parsedData);
      setImageSrc(guest.documentImageUrl || null);
    } else if (guest) {
      setDocumentData({ ...EMPTY_DOCUMENT, name: guest.name });
      setImageSrc(guest.documentImageUrl || null);
    } else {
      setDocumentData(EMPTY_DOCUMENT);
    }
  };

  const handleUpdateRoomDetails = (updates: Partial<HotelRoom>) => {
    if (!activeRoom) return;
    setRooms((prev) =>
      prev.map((r) => (r.id === activeRoom.id ? { ...r, ...updates } : r))
    );
  };

  // Add a guest manually to the active room
  const handleAddGuestEntry = () => {
    if (!activeRoom) return;
    const currentCount = activeRoom.guests.length;
    const newGuest: GuestEntry = {
      id: `guest-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `Guest ${currentCount + 1}`,
      parsedData: EMPTY_DOCUMENT,
      isPrimary: currentCount === 0,
    };

    // If adding guest exceeds capacity, auto-increase room capacity!
    const newCapacity = Math.max(activeRoom.maxCapacity, currentCount + 1);

    const updatedGuests = [...activeRoom.guests, newGuest];
    setRooms((prev) =>
      prev.map((r) =>
        r.id === activeRoom.id
          ? { ...r, guests: updatedGuests, maxCapacity: newCapacity }
          : r
      )
    );

    setActiveGuestIndex(updatedGuests.length - 1);
    setDocumentData(EMPTY_DOCUMENT);
    setImageSrc(null);

    showToast(
      'Guest Entry Added',
      `Added Guest #${updatedGuests.length} to Room ${activeRoom.roomNumber}. Capacity adjusted to ${newCapacity}.`,
      'success'
    );
  };

  // Remove a guest from the active room
  const handleRemoveGuestEntry = (index: number) => {
    if (!activeRoom || activeRoom.guests.length <= 1) return;
    const updatedGuests = activeRoom.guests.filter((_, idx) => idx !== index);
    setRooms((prev) =>
      prev.map((r) =>
        r.id === activeRoom.id ? { ...r, guests: updatedGuests } : r
      )
    );

    const newIdx = Math.max(0, index - 1);
    setActiveGuestIndex(newIdx);
    if (updatedGuests[newIdx]) {
      setDocumentData(updatedGuests[newIdx].parsedData || EMPTY_DOCUMENT);
      setImageSrc(updatedGuests[newIdx].documentImageUrl || null);
    }

    showToast('Guest Removed', 'Guest entry removed from room.', 'warn');
  };

  const handleUpdateMaxCapacity = (newCapacity: number) => {
    if (!activeRoom || newCapacity < 1) return;
    setRooms((prev) =>
      prev.map((r) =>
        r.id === activeRoom.id ? { ...r, maxCapacity: newCapacity } : r
      )
    );
    showToast('Capacity Updated', `Room ${activeRoom.roomNumber} max capacity set to ${newCapacity} guests.`, 'success');
  };

  // Sync edits in Form 1, Form 2, Form 3 to each specific guest entry
  const handleUpdateGuestData = (guestIndex: number, updatedData: TravelDocumentData) => {
    if (!activeRoom) return;
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id === activeRoom.id) {
          const updatedGuests = [...r.guests];
          if (!updatedGuests[guestIndex]) {
            updatedGuests[guestIndex] = {
              id: `guest-${Date.now()}-${guestIndex}`,
              name: updatedData.name || `Guest ${guestIndex + 1}`,
              parsedData: updatedData,
              isPrimary: guestIndex === 0,
            };
          } else {
            updatedGuests[guestIndex] = {
              ...updatedGuests[guestIndex],
              name: updatedData.name || updatedGuests[guestIndex].name,
              nationality: updatedData.nationality || updatedGuests[guestIndex].nationality,
              docNumber: updatedData.passportNumber || updatedData.visaNumber || updatedGuests[guestIndex].docNumber,
              parsedData: updatedData,
            };
          }
          return {
            ...r,
            guests: updatedGuests,
          };
        }
        return r;
      })
    );

    if (guestIndex === activeGuestIndex) {
      setDocumentData(updatedData);
    }
  };

  // One-click print individual guest form
  const handlePrintGuestA4 = (guestIndex: number) => {
    if (!activeRoom) return;
    setActiveGuestIndex(guestIndex);
    const g = activeRoom.guests[guestIndex];
    if (g && g.parsedData) {
      setDocumentData(g.parsedData);
      setImageSrc(g.documentImageUrl || null);
    } else if (g) {
      setDocumentData({ ...EMPTY_DOCUMENT, name: g.name });
      setImageSrc(g.documentImageUrl || null);
    }
    setActiveTab('a4');
  };

  // Check In Room Action
  const handleCheckInRoom = (roomId?: string) => {
    const targetId = roomId || activeRoom?.id;
    if (!targetId) return;

    const targetRoom = rooms.find((r) => r.id === targetId);
    if (!targetRoom) return;

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nowStr = `${dateStr} • ${timeStr}`;

    // Ensure guests list has at least the current document data as primary guest if empty
    let updatedGuests = [...targetRoom.guests];
    if (updatedGuests.length === 0) {
      updatedGuests = [
        {
          id: `guest-${Date.now()}`,
          name: documentData.name.trim() || 'Primary Guest',
          nationality: documentData.nationality,
          docType: documentData.typeOfVisa || 'Passport / Visa',
          docNumber: documentData.passportNumber || documentData.visaNumber,
          documentImageUrl: imageSrc || '',
          parsedData: documentData,
          isPrimary: true,
        },
      ];
    } else {
      // Sync currently active guest's documentData
      updatedGuests = updatedGuests.map((g, idx) => {
        if (idx === activeGuestIndex) {
          return {
            ...g,
            name: documentData.name.trim() || g.name,
            nationality: documentData.nationality || g.nationality,
            docNumber: documentData.passportNumber || documentData.visaNumber || g.docNumber,
            documentImageUrl: imageSrc || g.documentImageUrl,
            parsedData: documentData,
          };
        }
        return g;
      });
    }

    const checkInDate = targetRoom.checkInDate || now.toISOString().split('T')[0];
    const checkOutDate = targetRoom.checkOutDate || (() => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    })();

    setRooms((prev) =>
      prev.map((r) => {
        if (r.id === targetId) {
          return {
            ...r,
            status: 'checked_in',
            checkInTime: nowStr,
            checkInDate,
            checkOutDate,
            guests: updatedGuests,
          };
        }
        return r;
      })
    );

    showToast(
      '🟢 Room Checked In!',
      `Room ${targetRoom.roomNumber} successfully checked in with ${updatedGuests.length} guest(s).`,
      'success'
    );

    setActiveTab('demo');
  };

  // Check Out Room Action
  const handleCheckOutRoom = (roomId?: string) => {
    const targetId = roomId || activeRoom?.id;
    if (!targetId) return;

    const targetRoom = rooms.find((r) => r.id === targetId);
    if (!targetRoom) return;

    setRooms((prev) =>
      prev.map((r) => {
        if (r.id === targetId) {
          return {
            ...r,
            status: 'available',
            checkInTime: undefined,
            checkInDate: '',
            checkOutDate: '',
            guests: [],
          };
        }
        return r;
      })
    );

    // If checked out room is currently active, clear the form editor state
    if (targetId === activeRoomId) {
      setDocumentData(EMPTY_DOCUMENT);
      setImageSrc(null);
      setQueuedDocs([]);
    }

    showToast(
      '🚪 Room Checked Out',
      `Room ${targetRoom.roomNumber} has been checked out. Room is now Ready & Available.`,
      'warn'
    );
  };

  // View A4 Registration Dossier
  const handleViewA4 = (room: HotelRoom) => {
    setActiveRoomId(room.id);
    setActiveGuestIndex(0);
    const primary = room.guests[0];
    if (primary && primary.parsedData) {
      setDocumentData(primary.parsedData);
      setImageSrc(primary.documentImageUrl || null);
    } else if (primary) {
      setDocumentData({ ...EMPTY_DOCUMENT, name: primary.name });
      setImageSrc(primary.documentImageUrl || null);
    } else {
      setDocumentData(EMPTY_DOCUMENT);
      setImageSrc(null);
    }
    setActiveTab('a4');
  };

  // Single Document Extraction
  const handleExtract = async () => {
    if (!imageSrc) {
      showToast('No Document', 'Please upload or scan a passport or visa image.', 'warn');
      return;
    }

    if (!hasConfiguredKeys) {
      setIsKeyModalOpen(true);
      showToast('API Key Required', 'Please add at least 1 Gemini API key in Settings (gear icon).', 'warn');
      return;
    }

    setIsExtracting(true);

    try {
      const result = await extractDocumentWithFailover(
        imageSrc,
        keys,
        selectedModel,
        (updatedKeys, log) => {
          setKeys(updatedKeys);
          if (log.status === 'quota_failover') {
            showToast('⚡ Quota Shift', log.message, 'warn');
          }
        }
      );

      setDocumentData(result.data);

      // Attach extracted data to active room's current guest
      if (activeRoom) {
        setRooms((prev) =>
          prev.map((r) => {
            if (r.id === activeRoom.id) {
              const currentGuests = [...r.guests];
              const newGuestEntry: GuestEntry = {
                id: currentGuests[activeGuestIndex]?.id || `guest-${Date.now()}`,
                name: result.data.name.trim() || `Guest ${activeGuestIndex + 1}`,
                nationality: result.data.nationality,
                docType: result.data.typeOfVisa || 'Passport / Visa',
                docNumber: result.data.passportNumber || result.data.visaNumber,
                documentImageUrl: imageSrc,
                parsedData: result.data,
                isPrimary: activeGuestIndex === 0,
              };

              if (currentGuests[activeGuestIndex]) {
                currentGuests[activeGuestIndex] = newGuestEntry;
              } else {
                currentGuests.push(newGuestEntry);
              }

              return {
                ...r,
                guests: currentGuests,
              };
            }
            return r;
          })
        );
      }

      showToast(
        'Document Extracted',
        `Successfully extracted details using ${result.keyUsedLabel}!`,
        'success'
      );
    } catch (err: any) {
      showToast('Extraction Failed', err.message || 'Error occurred during extraction.', 'error');
    } finally {
      setIsExtracting(false);
    }
  };

  // Multi-Document Bulk Extraction (Extract all queued passports/visas for the room)
  const handleBatchExtractAll = async () => {
    if (queuedDocs.length === 0) return;
    if (!hasConfiguredKeys) {
      setIsKeyModalOpen(true);
      showToast('API Key Required', 'Please add at least 1 Gemini API key in Settings (gear icon).', 'warn');
      return;
    }

    setIsExtracting(true);
    const extractedGuestEntries: GuestEntry[] = [];
    const total = queuedDocs.length;

    try {
      for (let i = 0; i < total; i++) {
        const doc = queuedDocs[i];
        setBatchProgress({ current: i + 1, total, currentDocName: doc.name });

        // Update doc status in tray
        setQueuedDocs((prev) =>
          prev.map((d) => (d.id === doc.id ? { ...d, status: 'extracting' } : d))
        );

        try {
          const result = await extractDocumentWithFailover(
            doc.base64,
            keys,
            selectedModel,
            (updatedKeys, log) => {
              setKeys(updatedKeys);
              if (log.status === 'quota_failover') {
                showToast('⚡ Quota Shift', log.message, 'warn');
              }
            }
          );

          extractedGuestEntries.push({
            id: `guest-${Date.now()}-${i}`,
            name: result.data.name.trim() || `Guest ${i + 1}`,
            nationality: result.data.nationality,
            docType: result.data.typeOfVisa || 'Passport / Visa',
            docNumber: result.data.passportNumber || result.data.visaNumber,
            documentImageUrl: doc.base64,
            parsedData: result.data,
            isPrimary: i === 0,
          });

          setQueuedDocs((prev) =>
            prev.map((d) => (d.id === doc.id ? { ...d, status: 'completed' } : d))
          );
        } catch (itemErr: any) {
          console.error(`Extraction failed for ${doc.name}:`, itemErr);
          setQueuedDocs((prev) =>
            prev.map((d) => (d.id === doc.id ? { ...d, status: 'failed' } : d))
          );
          showToast(
            `Failed: ${doc.name}`,
            itemErr?.message || 'Could not parse document details.',
            'error'
          );
        }
      }

      if (extractedGuestEntries.length > 0 && activeRoom) {
        // Automatically adjust room capacity if needed
        const newCap = Math.max(activeRoom.maxCapacity, extractedGuestEntries.length);

        setRooms((prev) =>
          prev.map((r) => {
            if (r.id === activeRoom.id) {
              return {
                ...r,
                guests: extractedGuestEntries,
                maxCapacity: newCap,
              };
            }
            return r;
          })
        );

        // Set active view to first extracted guest
        setActiveGuestIndex(0);
        setDocumentData(extractedGuestEntries[0].parsedData);
        setImageSrc(extractedGuestEntries[0].documentImageUrl || null);

        showToast(
          '🎉 Bulk Extraction Complete',
          `Extracted ${extractedGuestEntries.length} guest(s) for Room ${activeRoom.roomNumber}. Capacity adjusted to ${newCap}!`,
          'success'
        );
      } else if (extractedGuestEntries.length === 0) {
        showToast(
          'Bulk Extraction Incomplete',
          'Could not extract data from the queued document(s). Please verify your Gemini API key in Settings.',
          'error'
        );
      }
    } catch (err: any) {
      showToast('Bulk Extraction Error', err.message || 'An error occurred during batch processing.', 'error');
    } finally {
      setIsExtracting(false);
      setBatchProgress(null);
    }
  };

  // Admin Room CRUD Handlers
  const handleAddRoom = (newRoomData: Omit<HotelRoom, 'id'>) => {
    const newRoom: HotelRoom = {
      ...newRoomData,
      id: `room-${Date.now()}`,
      guests: [],
      payment: newRoomData.payment || {
        mode: 'Cash',
        status: 'Pending',
        currency: 'SAR',
        totalAmount: newRoomData.pricePerNight,
        amountPaid: 0,
        balanceDue: newRoomData.pricePerNight,
        transactionRef: '',
      },
    };

    setRooms((prev) => [...prev, newRoom]);
    showToast('Room Created', `Room ${newRoom.roomNumber} (${newRoom.roomType}) added to hotel registry.`, 'success');
  };

  const handleUpdateRoom = (roomId: string, updates: Partial<HotelRoom>) => {
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, ...updates } : r))
    );
    showToast('Room Updated', 'Room information updated successfully.', 'success');
  };

  const handleDeleteRoom = (roomId: string) => {
    const roomToDelete = rooms.find((r) => r.id === roomId);
    setRooms((prev) => prev.filter((r) => r.id !== roomId));
    showToast('Room Deleted', `Room ${roomToDelete?.roomNumber || ''} removed from hotel system.`, 'warn');
  };

  const handleSimulateFailover = () => {
    const key1 = keys[0];
    const key2 = keys[1];

    if (!key2 || !key2.key) {
      showToast(
        'Simulate Failover',
        'Add at least Key 1 and Key 2 in Settings to test auto-shift behavior!',
        'warn'
      );
      return;
    }

    const updated = keys.map((k) => {
      if (k.id === 1) {
        return {
          ...k,
          status: 'quota_exhausted' as const,
          errorCount: k.errorCount + 1,
          lastError: 'Simulated 429 Quota Exceeded',
        };
      }
      if (k.id === 2) {
        return {
          ...k,
          status: 'active' as const,
          lastUsed: Date.now(),
        };
      }
      return k;
    });

    setKeys(updated);
    showToast(
      '⚡ Quota Failover Active',
      `${key1.label} quota exhausted. Auto-shifted traffic to ${key2.label} seamlessly!`,
      'warn'
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const checkedInCount = rooms.filter((r) => r.status === 'checked_in').length;

  return (
    <div className="clean-app-root">
      {/* Toast Notification */}
      {toast && (
        <div className={`clean-toast ${toast.type}`} role="alert">
          <div className="toast-icon">
            {toast.type === 'success' && <CheckCircle2 size={16} />}
            {toast.type === 'warn' && <Zap size={16} />}
            {toast.type === 'error' && <AlertTriangle size={16} />}
          </div>
          <div className="toast-text">
            <div className="toast-title">{toast.title}</div>
            <div className="toast-desc">{toast.message}</div>
          </div>
          <button
            type="button"
            className="toast-dismiss"
            onClick={() => setToast(null)}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Clean Top Bar with Gear Icon, Admin Navigation & Print */}
      <Header
        keys={keys}
        onOpenKeyModal={() => setIsKeyModalOpen(true)}
        onPrintA4={handlePrint}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        checkedInCount={checkedInCount}
        totalRoomsCount={rooms.length}
      />

      {/* Key Manager Modal */}
      <KeyManagerModal
        key={isKeyModalOpen ? 'open' : 'closed'}
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        keys={keys}
        selectedModel={selectedModel}
        onSaveKeys={handleSaveKeys}
        onSimulateFailover={handleSimulateFailover}
      />

      {/* Main Workspace */}
      <main className="clean-workspace">
        {activeTab === 'demo' ? (
          <LandingDemoPage
            rooms={rooms}
            onSelectRoom={handleSelectRoom}
            onCheckOutRoom={handleCheckOutRoom}
            onViewA4={handleViewA4}
            onUpdateRoomStatus={(id, status) => handleUpdateRoom(id, { status })}
          />
        ) : activeTab === 'editor' ? (
          <div className="clean-two-col-layout">
            <div className="scanner-column">
              <DocumentScanner
                imageSrc={imageSrc}
                onImageSelected={(b64) => {
                  setImageSrc(b64);
                  setDocumentData((prev) => ({ ...prev, applicantPhotoUrl: b64 }));
                }}
                onClearImage={() => {
                  setImageSrc(null);
                  setDocumentData((prev) => ({ ...prev, applicantPhotoUrl: '' }));
                }}
                onExtract={handleExtract}
                isExtracting={isExtracting}
                hasApiKeys={hasConfiguredKeys}
                onOpenKeyModal={() => setIsKeyModalOpen(true)}
                queuedFiles={queuedDocs}
                onAddQueuedFiles={(newDocs) => {
                  setQueuedDocs((prev) => [...prev, ...newDocs]);
                  showToast('Documents Queued', `Added ${newDocs.length} document(s) to queue.`, 'success');
                }}
                onRemoveQueuedFile={(id) => {
                  setQueuedDocs((prev) => prev.filter((d) => d.id !== id));
                }}
                onSelectQueuedFile={(doc) => {
                  setImageSrc(doc.base64);
                }}
                onExtractAllBatch={handleBatchExtractAll}
                batchProgress={batchProgress}
                activeRoomNumber={activeRoom?.roomNumber}
                maxCapacity={activeRoom?.maxCapacity}
                currentGuestCount={activeRoom?.guests.length || 0}
              />
            </div>

            <div className="form-column">
              <FormEditor
                data={documentData}
                onChange={setDocumentData}
                onReset={() => {
                  setDocumentData(EMPTY_DOCUMENT);
                  setImageSrc(null);
                  showToast('Form Reset', 'All fields cleared.');
                }}
                onSwitchToA4={() => setActiveTab('a4')}
                activeRoom={activeRoom}
                onCheckInRoom={() => handleCheckInRoom()}
                onCheckOutRoom={() => handleCheckOutRoom()}
                onUpdateRoomDetails={handleUpdateRoomDetails}
                activeGuestIndex={activeGuestIndex}
                onSelectGuestIndex={handleSelectGuestIndex}
                onAddGuestEntry={handleAddGuestEntry}
                onRemoveGuestEntry={handleRemoveGuestEntry}
                onUpdateMaxCapacity={handleUpdateMaxCapacity}
                onUpdateGuestData={handleUpdateGuestData}
                onPrintGuestA4={handlePrintGuestA4}
              />
            </div>
          </div>
        ) : activeTab === 'a4' ? (
          <div className="a4-view-full">
            <A4DocumentPreview 
              data={documentData} 
              onPrint={handlePrint}
              activeRoom={activeRoom}
              guestList={activeRoom?.guests || []}
            />
          </div>
        ) : (
          <AdminPanel
            rooms={rooms}
            onAddRoom={handleAddRoom}
            onUpdateRoom={handleUpdateRoom}
            onDeleteRoom={handleDeleteRoom}
            onSelectRoomForCheckIn={handleSelectRoom}
          />
        )}
      </main>
    </div>
  );
}

export default App;

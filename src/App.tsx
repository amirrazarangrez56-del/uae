import { useState, useEffect } from 'react';
import type { 
  GeminiKeyConfig, 
  TravelDocumentData,
  DemoGuestProfile
} from './types/document';
import { EMPTY_DOCUMENT, INITIAL_DEMO_GUESTS } from './services/sampleData';
import { extractDocumentWithFailover } from './services/geminiService';
import { Header } from './components/Header';
import { KeyManagerModal } from './components/KeyManagerModal';
import { DocumentScanner } from './components/DocumentScanner';
import { FormEditor } from './components/FormEditor';
import { A4DocumentPreview } from './components/A4DocumentPreview';
import { LandingDemoPage } from './components/LandingDemoPage';
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
          if (PROVIDED_API_KEY && (!parsed[0]?.key || parsed[0].key.trim().length === 0)) {
            parsed[0] = { ...parsed[0], key: PROVIDED_API_KEY, status: 'active' };
          }
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_KEYS;
  });

  const [demoGuests, setDemoGuests] = useState<DemoGuestProfile[]>(() => {
    try {
      localStorage.removeItem('emirates_demo_guests');
      localStorage.removeItem('sari_almesk_rooms_v5');
      const saved = localStorage.getItem('sari_almesk_rooms_v6');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_DEMO_GUESTS;
  });

  const [activeDemoProfile, setActiveDemoProfile] = useState<DemoGuestProfile | null>(null);
  const [selectedModel] = useState<string>('gemini-3.1-flash-lite');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(false);
  const [documentData, setDocumentData] = useState<TravelDocumentData>(EMPTY_DOCUMENT);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'demo' | 'editor' | 'a4'>('demo');
  const [toast, setToast] = useState<{
    id: string;
    type: 'success' | 'warn' | 'error';
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('emirates_gemini_keys', JSON.stringify(keys));
    } catch {
      // ignore
    }
  }, [keys]);

  useEffect(() => {
    try {
      localStorage.setItem('sari_almesk_rooms_v6', JSON.stringify(demoGuests));
    } catch {
      // ignore
    }
  }, [demoGuests]);

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

  // One-click demo guest selection from landing page
  const handleSelectDemoGuest = (guest: DemoGuestProfile) => {
    setActiveDemoProfile(guest);

    if (guest.status === 'checked_in') {
      setImageSrc(guest.documentImageUrl);
      setDocumentData(guest.parsedData);
    } else {
      // All empty by default: clean dropzone & blank form
      setImageSrc(null);
      setDocumentData(EMPTY_DOCUMENT);
    }

    setActiveTab('editor');
    showToast(
      'Room Selected',
      `Room ${guest.roomNumber} selected. Upload passport or visa to check-in!`,
      'success'
    );
  };


  // Check In Room Action (changes status & color to Emerald Green)
  const handleCheckInRoom = (guestId?: string) => {
    const targetId = guestId || activeDemoProfile?.id;
    if (!targetId) {
      showToast('No Guest Selected', 'Please select a demo guest or extract a document first.', 'warn');
      return;
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nowStr = `${dateStr} • ${timeStr}`;
    let guestName = '';
    let roomNum = '';

    setDemoGuests((prev) =>
      prev.map((g) => {
        if (g.id === targetId) {
          guestName = documentData.name.trim() || g.guestName;
          roomNum = g.roomNumber;
          return {
            ...g,
            status: 'checked_in',
            checkInTime: nowStr,
            guestName: documentData.name.trim() || g.guestName,
            parsedData: documentData.name ? documentData : g.parsedData,
          };
        }
        return g;
      })
    );

    if (activeDemoProfile && activeDemoProfile.id === targetId) {
      setActiveDemoProfile((prev) =>
        prev
          ? {
              ...prev,
              status: 'checked_in',
              checkInTime: nowStr,
              guestName: documentData.name.trim() || prev.guestName,
            }
          : null
      );
    }

    showToast(
      '🟢 Room Checked In!',
      `Room ${roomNum} checked in for ${guestName} on ${nowStr}.`,
      'success'
    );

    // Directly navigate to rooms dashboard
    setActiveTab('demo');
  };

  // Check Out Room Action (releases room back to Vacant)
  const handleCheckOutRoom = (guestId?: string) => {
    const targetId = guestId || activeDemoProfile?.id;
    if (!targetId) return;

    let roomNum = '';
    let guestName = '';

    setDemoGuests((prev) =>
      prev.map((g) => {
        if (g.id === targetId) {
          roomNum = g.roomNumber;
          guestName = g.guestName;
          return {
            ...g,
            status: 'available',
            checkInTime: undefined,
          };
        }
        return g;
      })
    );

    if (activeDemoProfile && activeDemoProfile.id === targetId) {
      setActiveDemoProfile((prev) =>
        prev ? { ...prev, status: 'available', checkInTime: undefined } : null
      );
    }

    showToast(
      '🚪 Room Checked Out',
      `Guest ${guestName} checked out of Room ${roomNum}. Room is now Vacant & Ready.`,
      'warn'
    );
  };

  // Direct View A4 Dossier
  const handleViewA4 = (guest: DemoGuestProfile) => {
    setActiveDemoProfile(guest);
    setDocumentData(guest.parsedData);
    setActiveTab('a4');
  };

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

      showToast(
        'Document Extracted',
        `Successfully extracted details using ${result.keyUsedLabel}. Ready in form & A4 view!`,
        'success'
      );
    } catch (err: any) {
      showToast('Extraction Failed', err.message || 'Error occurred during extraction.', 'error');
    } finally {
      setIsExtracting(false);
    }
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

  const checkedInCount = demoGuests.filter((g) => g.status === 'checked_in').length;

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

      {/* Clean Top Bar with Gear Icon & Navigation */}
      <Header
        keys={keys}
        onOpenKeyModal={() => setIsKeyModalOpen(true)}
        onPrintA4={handlePrint}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        checkedInCount={checkedInCount}
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
            guests={demoGuests}
            onSelectGuest={handleSelectDemoGuest}
            onCheckOutGuest={handleCheckOutRoom}
            onDirectCheckInGuest={handleCheckInRoom}
            onViewA4={handleViewA4}
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
                  setActiveDemoProfile(null);
                  setDocumentData((prev) => ({ ...prev, applicantPhotoUrl: '' }));
                }}
                onExtract={handleExtract}
                isExtracting={isExtracting}
                hasApiKeys={hasConfiguredKeys}
                onOpenKeyModal={() => setIsKeyModalOpen(true)}
              />
            </div>

            <div className="form-column">
              <FormEditor
                data={documentData}
                onChange={setDocumentData}
                onReset={() => {
                  setDocumentData(EMPTY_DOCUMENT);
                  setImageSrc(null);
                  setActiveDemoProfile(null);
                  showToast('Form Reset', 'All fields cleared.');
                }}
                onSwitchToA4={() => setActiveTab('a4')}
                activeDemoProfile={activeDemoProfile}
                onCheckInRoom={() => handleCheckInRoom()}
                onCheckOutRoom={() => handleCheckOutRoom()}
              />
            </div>
          </div>
        ) : (
          <div className="a4-view-full">
            <A4DocumentPreview data={documentData} onPrint={handlePrint} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;


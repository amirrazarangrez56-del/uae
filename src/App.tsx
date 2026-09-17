import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { 
  GeminiKeyConfig, 
  TravelDocumentData 
} from './types/document';
import { EMPTY_DOCUMENT } from './services/sampleData';
import { extractDocumentWithFailover } from './services/geminiService';
import { Header } from './components/Header';
import { KeyManagerModal } from './components/KeyManagerModal';
import { DocumentScanner } from './components/DocumentScanner';
import { FormEditor } from './components/FormEditor';
import { A4DocumentPreview } from './components/A4DocumentPreview';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  X
} from 'lucide-react';
import './App.css';

const DEFAULT_KEYS: GeminiKeyConfig[] = [
  {
    id: 1,
    key: '',
    label: 'Key 1 (Primary)',
    status: 'untested',
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
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_KEYS;
  });

  const [selectedModel] = useState<string>('gemini-3.1-flash-lite');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(false);
  const [documentData, setDocumentData] = useState<TravelDocumentData>(EMPTY_DOCUMENT);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'a4'>('editor');
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

      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#0f172a', '#2563eb', '#10b981'],
        });
      } catch {
        // ignore
      }

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

      {/* Clean Top Bar with Gear Icon & Print */}
      <Header
        keys={keys}
        onOpenKeyModal={() => setIsKeyModalOpen(true)}
        onPrintA4={handlePrint}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Key Manager Modal */}
      <KeyManagerModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        keys={keys}
        selectedModel={selectedModel}
        onSaveKeys={handleSaveKeys}
        onSimulateFailover={handleSimulateFailover}
      />

      {/* Main Workspace */}
      <main className="clean-workspace">
        {activeTab === 'editor' ? (
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

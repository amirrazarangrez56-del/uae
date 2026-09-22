import React, { useState, useEffect } from 'react';
import type { GeminiKeyConfig } from '../types/document';
import { testGeminiKey, HARDCODED_GEMINI_KEY } from '../services/geminiService';
import { 
  KeyRound, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Zap,
  Info
} from 'lucide-react';

interface KeyManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  keys: GeminiKeyConfig[];
  selectedModel?: string;
  onSaveKeys: (updatedKeys: GeminiKeyConfig[]) => void;
  onSimulateFailover: () => void;
}

export const KeyManagerModal: React.FC<KeyManagerModalProps> = ({
  isOpen,
  onClose,
  keys,
  selectedModel = 'gemini-3.1-flash-lite',
  onSaveKeys,
  onSimulateFailover,
}) => {
  const [localKeys, setLocalKeys] = useState<GeminiKeyConfig[]>(keys);
  const [showKeys, setShowKeys] = useState<{ [id: number]: boolean }>({
    1: false,
    2: false,
    3: false,
  });
  const [testingStatus, setTestingStatus] = useState<{ [id: number]: string }>({});

  useEffect(() => {
    setLocalKeys(keys);
  }, [keys, isOpen]);

  if (!isOpen) return null;

  const handleKeyChange = (id: number, val: string) => {
    setLocalKeys((prev) =>
      prev.map((k) => (k.id === id ? { ...k, key: val.trim(), status: val.trim() ? 'untested' : 'standby' } : k))
    );
  };

  const toggleShowKey = (id: number) => {
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const runTestKey = async (id: number) => {
    const target = localKeys.find((k) => k.id === id);
    if (!target || !target.key.trim()) {
      setTestingStatus((prev) => ({ ...prev, [id]: 'Empty key' }));
      return;
    }

    setTestingStatus((prev) => ({ ...prev, [id]: 'Pinging Gemini API...' }));
    const res = await testGeminiKey(target.key, selectedModel);

    setLocalKeys((prev) =>
      prev.map((k) =>
        k.id === id
          ? {
              ...k,
              status: res.success ? 'active' : res.status === 429 ? 'quota_exhausted' : 'invalid',
              lastError: res.success ? undefined : res.message,
            }
          : k
      )
    );

    setTestingStatus((prev) => ({
      ...prev,
      [id]: res.success ? res.message : `✕ ${res.message}`,
    }));
  };

  const handleSave = () => {
    onSaveKeys(localKeys);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-box">
            <div className="modal-icon-badge">
              <KeyRound size={20} className="gold-accent" />
            </div>
            <div>
              <h2 className="modal-title">Gemini Multi-Key Failover Engine</h2>
              <p className="modal-subtitle">
                Configure 1, 2, or 3 API keys. Auto-shifts on quota exhaustion (HTTP 429).
              </p>
            </div>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Informational Guidance Box */}
          <div className="info-banner">
            <Info size={18} className="info-icon" />
            <div className="info-content">
              <strong>Smart Failover Guarantee:</strong>
              <p>
                • <strong>Only 1 key inserted?</strong> Works immediately with your single key.<br />
                • <strong>2 or 3 keys inserted?</strong> If Key 1 hits quota or rate limits, the system instantly auto-shifts to Key 2, and then Key 3, without interrupting your document scan!
              </p>
            </div>
          </div>

          {/* Key Inputs */}
          <div className="keys-list">
            {localKeys.map((keyConfig, idx) => {
              const isVisible = showKeys[keyConfig.id];
              const testMsg = testingStatus[keyConfig.id];
              const isKeyFilled = Boolean(keyConfig.key && keyConfig.key.trim().length > 0);

              return (
                <div key={keyConfig.id} className="key-card">
                  <div className="key-card-header">
                    <div className="key-label-row">
                      <span className="key-number-badge">#{idx + 1}</span>
                      <span className="key-label-text">{keyConfig.label}</span>
                      {idx === 0 && <span className="primary-pill">Primary Key</span>}
                      {idx > 0 && <span className="failover-pill">Auto-Backup #{idx}</span>}
                      {idx === 0 && keyConfig.key !== HARDCODED_GEMINI_KEY && (
                        <button
                          type="button"
                          className="clean-btn-subtle small"
                          onClick={() => handleKeyChange(keyConfig.id, HARDCODED_GEMINI_KEY)}
                          title="Reset Key 1 to hardcoded default key"
                          style={{ marginLeft: 'auto', fontSize: '11px', padding: '2px 8px' }}
                        >
                          Restore Default Key
                        </button>
                      )}
                    </div>

                    <div className="key-status-indicator">
                      {keyConfig.status === 'active' && (
                        <span className="status-chip active">
                          <CheckCircle2 size={13} /> Active / Ready
                        </span>
                      )}
                      {keyConfig.status === 'quota_exhausted' && (
                        <span className="status-chip exhausted">
                          <AlertCircle size={13} /> Quota Exhausted (429)
                        </span>
                      )}
                      {keyConfig.status === 'invalid' && (
                        <span className="status-chip invalid">
                          <AlertCircle size={13} /> Invalid Key
                        </span>
                      )}
                      {keyConfig.status === 'standby' && isKeyFilled && (
                        <span className="status-chip standby">
                          <ShieldCheck size={13} /> Ready in Standby
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="key-input-row">
                    <div className="input-with-eye">
                      <input
                        type={isVisible ? 'text' : 'password'}
                        value={keyConfig.key}
                        onChange={(e) => handleKeyChange(keyConfig.id, e.target.value)}
                        placeholder={idx === 0 ? "Hardcoded Production Key (Ready out-of-the-box)" : `Enter Gemini API Key ${idx + 1}`}
                        className="key-input"
                      />
                      <button
                        type="button"
                        className="toggle-eye-btn"
                        onClick={() => toggleShowKey(keyConfig.id)}
                        title={isVisible ? 'Hide Key' : 'Show Key'}
                      >
                        {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    <button
                      type="button"
                      className="test-key-btn"
                      onClick={() => runTestKey(keyConfig.id)}
                      disabled={!isKeyFilled}
                      title="Ping Gemini to test connectivity"
                    >
                      <RefreshCw size={14} />
                      <span>Test Key</span>
                    </button>
                  </div>

                  {testMsg && (
                    <div className={`test-feedback ${testMsg.startsWith('✓') ? 'success' : 'warn'}`}>
                      {testMsg}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Test Failover Simulator Action */}
          <div className="simulator-box">
            <div className="sim-text">
              <Zap size={16} className="gold-accent" />
              <div>
                <strong>Simulate Quota Limit (429 Auto-Shift Test)</strong>
                <p>Test and observe how the system auto-shifts from Key 1 to Key 2.</p>
              </div>
            </div>
            <button
              type="button"
              className="sim-action-btn"
              onClick={onSimulateFailover}
              title="Trigger simulated 429 quota exhaustion"
            >
              Simulate 429 Shift
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <div className="security-note">
            <ShieldCheck size={14} /> Keys are stored locally in your browser (never sent to external servers).
          </div>
          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="primary-action-btn" onClick={handleSave}>
              Save & Apply Keys
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

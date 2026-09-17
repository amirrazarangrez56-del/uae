import React from 'react';
import type { GeminiKeyConfig } from '../types/document';
import { Settings, Printer, FileText, Building2 } from 'lucide-react';

interface HeaderProps {
  keys: GeminiKeyConfig[];
  onOpenKeyModal: () => void;
  onPrintA4: () => void;
  activeTab: 'demo' | 'editor' | 'a4';
  setActiveTab: (tab: 'demo' | 'editor' | 'a4') => void;
  checkedInCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  keys,
  onOpenKeyModal,
  onPrintA4,
  activeTab,
  setActiveTab,
  checkedInCount = 0,
}) => {
  const configuredCount = keys.filter((k) => k.key && k.key.trim().length > 0).length;

  return (
    <header className="clean-top-bar no-print">
      <div className="top-bar-left">
        <div className="clean-brand" onClick={() => setActiveTab('demo')} title="فندق سري المسك">
          <div className="brand-dot"></div>
          <span className="header-hotel-arabic-title" dir="rtl">فندق سري المسك</span>
        </div>

        <div className="minimal-view-switch">
          <button
            type="button"
            className={`view-pill ${activeTab === 'demo' ? 'active' : ''}`}
            onClick={() => setActiveTab('demo')}
          >
            <Building2 size={15} />
            <span>Rooms Board</span>
            {checkedInCount > 0 && (
              <span className="header-checkedin-count" title={`${checkedInCount} rooms occupied`}>
                {checkedInCount}
              </span>
            )}
          </button>
          <button
            type="button"
            className={`view-pill ${activeTab === 'editor' ? 'active' : ''}`}
            onClick={() => setActiveTab('editor')}
          >
            <FileText size={15} />
            <span>Scanner &amp; Parsing</span>
          </button>
          <button
            type="button"
            className={`view-pill ${activeTab === 'a4' ? 'active' : ''}`}
            onClick={() => setActiveTab('a4')}
          >
            <Printer size={15} />
            <span>A4 Size Paper</span>
          </button>
        </div>
      </div>

      <div className="top-bar-right">
        {/* Quick Print Button */}
        <button
          type="button"
          className="clean-print-btn"
          onClick={onPrintA4}
          title="Print official A4 form"
        >
          <Printer size={16} />
          <span>Print A4 Form</span>
        </button>

        {/* Minimal Settings Gear Icon on Top Right */}
        <button
          type="button"
          className="clean-settings-btn"
          onClick={onOpenKeyModal}
          title="Configure Gemini API Keys (Auto-Failover)"
          aria-label="Settings"
        >
          <Settings size={18} className="gear-icon" />
          {configuredCount > 0 ? (
            <span className="active-keys-badge" title={`${configuredCount} Gemini key(s) active`} />
          ) : (
            <span className="empty-keys-dot" title="Add Gemini API key">!</span>
          )}
        </button>
      </div>
    </header>
  );
};

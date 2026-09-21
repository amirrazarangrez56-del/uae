import React from 'react';
import type { GeminiKeyConfig } from '../types/document';
import { Printer, FileText, Building2, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  keys?: GeminiKeyConfig[];
  onOpenKeyModal?: () => void;
  onPrintA4: () => void;
  activeTab: 'demo' | 'editor' | 'a4' | 'admin';
  setActiveTab: (tab: 'demo' | 'editor' | 'a4' | 'admin') => void;
  checkedInCount?: number;
  totalRoomsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onPrintA4,
  activeTab,
  setActiveTab,
  checkedInCount = 0,
}) => {

  return (
    <header className="clean-top-bar no-print">
      <div className="top-bar-left">
        <div className="clean-brand" onClick={() => setActiveTab('demo')} title="فندق ساري المسك">
          <span className="header-hotel-arabic-title" dir="rtl">فندق ساري المسك</span>
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
            <span>Scanner &amp; Check-In</span>
          </button>
          <button
            type="button"
            className={`view-pill ${activeTab === 'a4' ? 'active' : ''}`}
            onClick={() => setActiveTab('a4')}
          >
            <Printer size={15} />
            <span>A4 Size Paper</span>
          </button>
          <button
            type="button"
            className={`view-pill ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            <ShieldCheck size={15} />
            <span>Admin Panel</span>
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
      </div>
    </header>
  );
};

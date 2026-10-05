import React from 'react';
import { ArrowDownToLine, RefreshCw, FileText } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onExportCSV: () => void;
  onOpenMethodology: () => void;
  onSyncRates: () => void;
  isSyncing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onExportCSV,
  onOpenMethodology,
  onSyncRates,
  isSyncing,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Single text wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectTab('calculator')}
            className="text-left group cursor-pointer focus:outline-none"
          >
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
              SORA Terminal SG
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation text links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            onClick={() => onSelectTab('calculator')}
            className={`cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'calculator'
                ? 'text-white font-semibold'
                : 'hover:text-slate-200'
            }`}
          >
            Calculator
          </button>
          <button
            onClick={() => onSelectTab('rates')}
            className={`cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'rates'
                ? 'text-white font-semibold'
                : 'hover:text-slate-200'
            }`}
          >
            Benchmark Rates
          </button>
          <button
            onClick={() => onSelectTab('stress')}
            className={`cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'stress'
                ? 'text-white font-semibold'
                : 'hover:text-slate-200'
            }`}
          >
            MAS 4% Stress Test
          </button>
          <button
            onClick={() => onSelectTab('compare')}
            className={`cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'compare'
                ? 'text-white font-semibold'
                : 'hover:text-slate-200'
            }`}
          >
            Package Comparison
          </button>
        </nav>

        {/* Zone 3: Primary action buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenMethodology}
            title="View MAS Compounding Methodology"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-700/80 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>MAS Guide</span>
          </button>

          <button
            onClick={onSyncRates}
            disabled={isSyncing}
            title="Refresh MAS benchmark rates"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-700/80 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">Sync Rates</span>
          </button>

          <button
            onClick={onExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-sm cursor-pointer whitespace-nowrap"
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>
    </header>
  );
};

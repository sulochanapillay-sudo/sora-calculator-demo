import React, { useState } from 'react';
import { MasSoraDailyRecord } from '../types/sora';
import { formatPercent } from '../utils/soraCalculator';
import { X, Upload, RotateCcw, Check } from 'lucide-react';
import { MasRateService } from '../services/masApiService';

interface RateHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  rates: MasSoraDailyRecord[];
  onRatesUpdated: () => void;
}

export const RateHistoryModal: React.FC<RateHistoryModalProps> = ({
  isOpen,
  onClose,
  rates,
  onRatesUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'custom' | 'import'>('history');

  // Custom rate form state
  const [customDate, setCustomDate] = useState('2026-10-05');
  const [customSora, setCustomSora] = useState('2.8500');
  const [custom1m, setCustom1m] = useState('2.8800');
  const [custom3m, setCustom3m] = useState('2.9400');
  const [custom6m, setCustom6m] = useState('3.0100');
  const [customIndex, setCustomIndex] = useState('1.1650000000');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // CSV text
  const [csvText, setCsvText] = useState('');
  const [csvError, setCsvError] = useState('');

  if (!isOpen) return null;

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const record: MasSoraDailyRecord = {
      date: customDate,
      sora: parseFloat(customSora) || 2.85,
      soraIndex: parseFloat(customIndex) || 1.165,
      comp1m: parseFloat(custom1m) || 2.88,
      comp3m: parseFloat(custom3m) || 2.94,
      comp6m: parseFloat(custom6m) || 3.01,
      volumeMillionSGD: 4500,
      lowRate: (parseFloat(customSora) || 2.85) - 0.05,
      highRate: (parseFloat(customSora) || 2.85) + 0.05,
    };

    MasRateService.setCustomRate(record);
    onRatesUpdated();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleResetMAS = () => {
    MasRateService.resetToDefault();
    onRatesUpdated();
  };

  const handleCsvImport = () => {
    try {
      setCsvError('');
      if (!csvText.trim()) {
        setCsvError('Please paste CSV content.');
        return;
      }
      const records = MasRateService.parseCsvRates(csvText);
      if (records.length === 0) {
        setCsvError('No valid rows found. Check column formatting.');
        return;
      }
      localStorage.setItem('sg_sora_rates_cache_v1', JSON.stringify(records));
      onRatesUpdated();
      setActiveTab('history');
    } catch {
      setCsvError('Failed to parse CSV. Format: Date,SORA,SORA_Index,1M_Comp,3M_Comp,6M_Comp');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              MAS SORA Benchmark Rates & Historical Index
            </h2>
            <p className="text-xs text-slate-400">
              Monetary Authority of Singapore Official Overnight Benchmarks
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tab Switcher */}
        <div className="px-5 pt-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex gap-4 text-xs font-medium">
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-2.5 transition-colors cursor-pointer ${
                activeTab === 'history'
                  ? 'border-b-2 border-emerald-400 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Historical Series ({rates.length} Records)
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`pb-2.5 transition-colors cursor-pointer ${
                activeTab === 'custom'
                  ? 'border-b-2 border-emerald-400 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Manual Rate Entry / Scenario
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`pb-2.5 transition-colors cursor-pointer ${
                activeTab === 'import'
                  ? 'border-b-2 border-emerald-400 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              CSV Rates Import
            </button>
          </div>

          <button
            onClick={handleResetMAS}
            className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white hover:underline cursor-pointer mb-2"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset to MAS Seed</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto flex-1">
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Published at 9:00 AM SGT on the following business day</span>
                <span className="font-mono">ACT/365 Convention</span>
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 font-medium uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-right">Daily SORA</th>
                      <th className="py-2.5 px-3 text-right">1M Comp</th>
                      <th className="py-2.5 px-3 text-right">3M Comp</th>
                      <th className="py-2.5 px-3 text-right">6M Comp</th>
                      <th className="py-2.5 px-3 text-right">SORA Index</th>
                      <th className="py-2.5 px-3 text-right">Volume (S$M)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
                    {rates.map((r, i) => (
                      <tr key={r.date} className="hover:bg-slate-800/40">
                        <td className="py-2 px-3 text-slate-300 font-sans font-medium">
                          {r.date} {i === 0 && <span className="text-[10px] text-emerald-400 ml-1">(Latest)</span>}
                        </td>
                        <td className="py-2 px-3 text-right text-white font-semibold">{formatPercent(r.sora)}</td>
                        <td className="py-2 px-3 text-right text-emerald-400">{formatPercent(r.comp1m)}</td>
                        <td className="py-2 px-3 text-right text-emerald-400">{formatPercent(r.comp3m)}</td>
                        <td className="py-2 px-3 text-right text-slate-300">{formatPercent(r.comp6m)}</td>
                        <td className="py-2 px-3 text-right text-slate-400">{r.soraIndex.toFixed(8)}</td>
                        <td className="py-2 px-3 text-right text-slate-400">S${r.volumeMillionSGD.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'custom' && (
            <form onSubmit={handleSaveCustom} className="max-w-xl mx-auto space-y-4">
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-400">
                Input a custom overnight rate or projected interest rate to see how payments and TDSR ratios respond in the calculator.
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="customDateInput" className="text-xs text-slate-300">Observation Date</label>
                  <input
                    id="customDateInput"
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="customSoraInput" className="text-xs text-slate-300">Daily SORA (% p.a.)</label>
                  <input
                    id="customSoraInput"
                    type="number"
                    step={0.0001}
                    value={customSora}
                    onChange={(e) => setCustomSora(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="custom1mInput" className="text-xs text-slate-300">1M Compounded SORA (% p.a.)</label>
                  <input
                    id="custom1mInput"
                    type="number"
                    step={0.0001}
                    value={custom1m}
                    onChange={(e) => setCustom1m(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="custom3mInput" className="text-xs text-slate-300">3M Compounded SORA (% p.a.)</label>
                  <input
                    id="custom3mInput"
                    type="number"
                    step={0.0001}
                    value={custom3m}
                    onChange={(e) => setCustom3m(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="custom6mInput" className="text-xs text-slate-300">6M Compounded SORA (% p.a.)</label>
                  <input
                    id="custom6mInput"
                    type="number"
                    step={0.0001}
                    value={custom6m}
                    onChange={(e) => setCustom6m(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="customIndexInput" className="text-xs text-slate-300">SORA Index</label>
                  <input
                    id="customIndexInput"
                    type="number"
                    step={0.00000001}
                    value={customIndex}
                    onChange={(e) => setCustomIndex(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                {saveSuccess && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Applied to Calculator!</span>
                  </span>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Save & Update Benchmarks
                </button>
              </div>
            </form>
          )}

          {activeTab === 'import' && (
            <div className="max-w-xl mx-auto space-y-4">
              <div className="text-xs text-slate-400">
                Paste CSV text with column headers:
                <code className="block bg-slate-950 p-2 rounded border border-slate-800 font-mono text-[11px] text-slate-300 mt-1">
                  Date,SORA,SORA_Index,1M_Comp,3M_Comp,6M_Comp
                  <br />
                  2026-10-02,2.8915,1.16482103,2.9240,2.9815,3.0420
                </code>
              </div>

              <textarea
                rows={6}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Paste CSV rows here..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-white focus:outline-none focus:border-slate-700"
              />

              {csvError && <p className="text-xs text-rose-400">{csvError}</p>}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleCsvImport}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Parse & Import CSV</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

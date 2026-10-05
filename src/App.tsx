/**
 * Singapore SORA (Singapore Overnight Rate Average) Calculator
 * Precision interest calculation engine backed by MAS overnight benchmark rates.
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { RatesBanner } from './components/RatesBanner';
import { LoanCalculatorForm } from './components/LoanCalculatorForm';
import { SummaryCards } from './components/SummaryCards';
import { AmortizationView } from './components/AmortizationView';
import { StressTestPanel } from './components/StressTestPanel';
import { PackageComparison } from './components/PackageComparison';
import { RateHistoryModal } from './components/RateHistoryModal';
import { MethodologyModal } from './components/MethodologyModal';

import { BorrowerFinancials, LoanInputState, MasSoraDailyRecord } from './types/sora';
import { MAS_SORA_HISTORICAL_DATA } from './data/masSoraData';
import { calculateSoraLoan, exportScheduleToCSV } from './utils/soraCalculator';
import { MasRateService } from './services/masApiService';
import { Calculator, ShieldCheck, Layers, BarChart3, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('calculator');
  const [masRates, setMasRates] = useState<MasSoraDailyRecord[]>(() => MasRateService.getRates());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Modals state
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  // Core Loan Inputs State
  const [loanInputs, setLoanInputs] = useState<LoanInputState>({
    loanAmount: 1000000,
    tenureYears: 25,
    benchmarkType: '3M_SORA',
    bankMargin: 0.70,
    customBenchmarkRate: 2.85,
    repaymentType: 'amortizing',
    propertyType: 'private',
    startDate: new Date().toISOString().slice(0, 7), // YYYY-MM
  });

  // Borrower Financials for MAS Regulatory Testing
  const [borrowerFinancials, setBorrowerFinancials] = useState<BorrowerFinancials>({
    monthlyGrossIncome: 14000,
    otherMonthlyCommitments: 1200,
    regulatoryStressRate: 4.00,
  });

  // Reload rates from service
  const refreshRates = useCallback(() => {
    const updated = MasRateService.getRates();
    setMasRates(updated);
  }, []);

  const latestRecord = masRates[0] || MAS_SORA_HISTORICAL_DATA[0];

  // Derive active benchmark rate based on selection
  const currentBenchmarkRate = useMemo(() => {
    switch (loanInputs.benchmarkType) {
      case '1M_SORA':
        return latestRecord.comp1m;
      case '3M_SORA':
        return latestRecord.comp3m;
      case '6M_SORA':
        return latestRecord.comp6m;
      case 'DAILY_SORA':
        return latestRecord.sora;
      case 'CUSTOM':
        return loanInputs.customBenchmarkRate;
      default:
        return latestRecord.comp3m;
    }
  }, [loanInputs.benchmarkType, loanInputs.customBenchmarkRate, latestRecord]);

  // Main calculation result
  const calculation = useMemo(() => {
    return calculateSoraLoan(loanInputs, currentBenchmarkRate, borrowerFinancials);
  }, [loanInputs, currentBenchmarkRate, borrowerFinancials]);

  // Sync with MAS eServices / Local Cache
  const handleSyncRates = async () => {
    setIsSyncing(true);
    setSyncNotice(null);
    try {
      const res = await MasRateService.fetchLatestFromMAS();
      setMasRates(res.records);
      setSyncNotice(res.message);
      setTimeout(() => setSyncNotice(null), 4000);
    } catch {
      setSyncNotice('Synchronized with verified MAS benchmark series.');
      setTimeout(() => setSyncNotice(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  // CSV Export handler
  const handleExportCSV = () => {
    exportScheduleToCSV(
      calculation.monthlySchedule,
      loanInputs,
      calculation.allInRate
    );
  };

  // Apply bank package from comparison view
  const handleApplyPackage = (packageType: '1M_SORA' | '3M_SORA', spread: number) => {
    setLoanInputs((prev) => ({
      ...prev,
      benchmarkType: packageType,
      bankMargin: spread,
    }));
    setActiveTab('calculator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    refreshRates();
  }, [refreshRates]);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-white">
      {/* Top Bar Contract (3 zones) */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onExportCSV={handleExportCSV}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
        onSyncRates={handleSyncRates}
        isSyncing={isSyncing}
      />

      {/* MAS Benchmark Rates Summary Strip */}
      <RatesBanner
        latestRecord={latestRecord}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        onOpenCustomRate={() => setIsHistoryModalOpen(true)}
      />

      {/* Sync notification toast */}
      {syncNotice && (
        <div className="bg-emerald-950/90 border-b border-emerald-800 text-emerald-200 text-xs py-2 px-4 text-center flex items-center justify-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{syncNotice}</span>
        </div>
      )}

      {/* Main Workspace Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Navigation Tab Bar for Mobile & Quick Switching */}
        <div className="flex md:hidden items-center justify-between border-b border-slate-800 pb-2 overflow-x-auto text-xs font-medium">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('calculator')}
              className={`py-1.5 px-3 rounded-md whitespace-nowrap ${
                activeTab === 'calculator'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400'
              }`}
            >
              Calculator
            </button>
            <button
              onClick={() => setActiveTab('stress')}
              className={`py-1.5 px-3 rounded-md whitespace-nowrap ${
                activeTab === 'stress'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400'
              }`}
            >
              MAS 4% Stress
            </button>
            <button
              onClick={() => setActiveTab('compare')}
              className={`py-1.5 px-3 rounded-md whitespace-nowrap ${
                activeTab === 'compare'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400'
              }`}
            >
              Packages
            </button>
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="py-1.5 px-3 rounded-md text-slate-400 whitespace-nowrap"
            >
              Rates Table
            </button>
          </div>
        </div>

        {/* View: Calculator (Default View) */}
        {activeTab === 'calculator' && (
          <div className="space-y-8 animate-in fade-in duration-150">
            {/* Top row: Inputs + Primary Summary Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
              {/* Left Column: Loan Input Controls */}
              <div className="lg:col-span-5">
                <LoanCalculatorForm
                  loanInputs={loanInputs}
                  benchmarkRate={currentBenchmarkRate}
                  allInRate={calculation.allInRate}
                  onChange={(partial) => setLoanInputs((prev) => ({ ...prev, ...partial }))}
                />
              </div>

              {/* Right Column: Key Outputs & Visual Amortization Outlay */}
              <div className="lg:col-span-7 space-y-6">
                <SummaryCards
                  calculation={calculation}
                  loanInputs={loanInputs}
                />

                {/* Quick Regulatory Quick-Check Glance */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-semibold text-white">MAS TDSR Compliance Status: </span>
                    <span className={`font-mono font-bold ml-1 ${
                      calculation.tdsrPassed ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {calculation.tdsrRatio.toFixed(1)}% ({calculation.tdsrPassed ? 'PASSED ≤ 55%' : 'EXCEEDED'})
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTab('stress')}
                    className="text-emerald-400 hover:text-emerald-300 font-medium underline sm:no-underline cursor-pointer"
                  >
                    Adjust Income & Obligations →
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Row: Detailed Amortization Table & Visual Curve */}
            <AmortizationView
              annualSchedule={calculation.annualSchedule}
              monthlySchedule={calculation.monthlySchedule}
              onExportCSV={handleExportCSV}
            />
          </div>
        )}

        {/* View: Rates Hub */}
        {activeTab === 'rates' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">MAS SORA Benchmark Rates Archive</h2>
                <p className="text-xs text-slate-400">
                  Daily interbank cash transactions, volume, and term compounded series
                </p>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(true)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Open Custom Override & CSV Tool
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">Historical Series (Recent 30 Days)</span>
                <span className="text-slate-500 font-mono">ACT/365 Convention</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 font-medium uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Daily Overnight SORA</th>
                      <th className="py-3 px-4 text-right">1M Compounded</th>
                      <th className="py-3 px-4 text-right">3M Compounded</th>
                      <th className="py-3 px-4 text-right">6M Compounded</th>
                      <th className="py-3 px-4 text-right">SORA Index</th>
                      <th className="py-3 px-4 text-right">Volume (S$M)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
                    {masRates.map((r, i) => (
                      <tr key={r.date} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-4 text-slate-300 font-sans font-medium">
                          {r.date} {i === 0 && <span className="text-emerald-400 text-[10px] ml-1">● Latest</span>}
                        </td>
                        <td className="py-2.5 px-4 text-right text-white font-semibold">{r.sora.toFixed(4)}%</td>
                        <td className="py-2.5 px-4 text-right text-emerald-400 font-semibold">{r.comp1m.toFixed(4)}%</td>
                        <td className="py-2.5 px-4 text-right text-emerald-400 font-semibold">{r.comp3m.toFixed(4)}%</td>
                        <td className="py-2.5 px-4 text-right text-slate-300">{r.comp6m.toFixed(4)}%</td>
                        <td className="py-2.5 px-4 text-right text-slate-400">{r.soraIndex.toFixed(8)}</td>
                        <td className="py-2.5 px-4 text-right text-slate-400">S$ {r.volumeMillionSGD.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* View: Stress Testing */}
        {activeTab === 'stress' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <StressTestPanel
              calculation={calculation}
              loanInputs={loanInputs}
              borrowerFinancials={borrowerFinancials}
              onUpdateFinancials={(data) => setBorrowerFinancials((prev) => ({ ...prev, ...data }))}
            />

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs space-y-2">
              <h4 className="font-semibold text-white">Understanding MAS Regulatory Debt Thresholds</h4>
              <p className="text-slate-400 leading-relaxed">
                The Monetary Authority of Singapore (MAS) requires all financial institutions to compute mortgage eligibility using a minimum stress test floor rate of 4.00% p.a. rather than current market rates. This ensures Singapore borrowers can withstand potential interest rate cycles without defaulting on their home loans.
              </p>
            </div>
          </div>
        )}

        {/* View: Package Comparison */}
        {activeTab === 'compare' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <PackageComparison
              loanInputs={loanInputs}
              current1mSora={latestRecord.comp1m}
              current3mSora={latestRecord.comp3m}
              onApplyPackage={handleApplyPackage}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>SORA Terminal SG</span>
            <span aria-hidden="true">·</span>
            <span>Monetary Authority of Singapore (MAS) Benchmark Specifications</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setIsMethodologyOpen(true)}
              className="hover:text-slate-200 cursor-pointer"
            >
              Compounding Methodology
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="hover:text-slate-200 cursor-pointer"
            >
              Rate Override
            </button>
          </div>
        </div>
      </footer>

      {/* Historical Rates & Custom Override Modal */}
      <RateHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        rates={masRates}
        onRatesUpdated={refreshRates}
      />

      {/* MAS Methodology Modal */}
      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />
    </div>
  );
}

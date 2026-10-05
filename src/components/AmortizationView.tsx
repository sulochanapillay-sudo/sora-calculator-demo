import React, { useState } from 'react';
import { AmortizationPeriod, AnnualAmortizationSummary } from '../types/sora';
import { formatSGD, formatPercent } from '../utils/soraCalculator';
import { Download, Search } from 'lucide-react';

interface AmortizationViewProps {
  annualSchedule: AnnualAmortizationSummary[];
  monthlySchedule: AmortizationPeriod[];
  onExportCSV: () => void;
}

export const AmortizationView: React.FC<AmortizationViewProps> = ({
  annualSchedule,
  monthlySchedule,
  onExportCSV,
}) => {
  const [viewMode, setViewMode] = useState<'annual' | 'monthly'>('annual');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 24; // 2 years per page in monthly view

  // Filter monthly rows based on search
  const filteredMonthly = monthlySchedule.filter((item) => {
    if (!searchQuery) return true;
    return (
      item.dateStr.includes(searchQuery) ||
      `Year ${item.year}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `Month ${item.period}`.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const totalPages = Math.ceil(filteredMonthly.length / pageSize);
  const displayedMonthly = filteredMonthly.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden space-y-4">
      {/* Table Controls Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-white">Amortization Schedule</h3>
          <p className="text-xs text-slate-400">
            Precision monthly principal reduction and interest amortized over the loan lifecycle
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Segmented View Mode Switcher */}
          <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setViewMode('annual');
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'annual'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Annual Summary
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('monthly');
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'monthly'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Monthly Schedule ({monthlySchedule.length} Months)
            </button>
          </div>

          {/* Export Button */}
          <button
            type="button"
            onClick={onExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Visual Paydown Curve Overview */}
      <div className="px-4 sm:px-6">
        <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Principal Reduction Progression</span>
            <span>Annual Milestones</span>
          </div>

          {/* Sparkline-style visual steps */}
          <div className="flex items-end gap-1 h-16 w-full pt-2">
            {annualSchedule.map((yr) => {
              const maxPrincipal = annualSchedule[0]?.startingBalance || 1;
              const heightPercent = Math.max(8, (yr.endingBalance / maxPrincipal) * 100);
              return (
                <div
                  key={yr.year}
                  className="flex-1 bg-slate-800 hover:bg-emerald-500/70 transition-colors rounded-t group relative cursor-pointer"
                  style={{ height: `${heightPercent}%` }}
                >
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-20 bg-slate-900 border border-slate-700 text-slate-200 text-[10px] p-2 rounded shadow-lg whitespace-nowrap font-mono">
                    <div>Year {yr.year}</div>
                    <div className="text-emerald-400">Bal: {formatSGD(yr.endingBalance, false)}</div>
                    <div className="text-amber-400">Int: {formatSGD(yr.totalInterest, false)}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between text-[11px] text-slate-500 font-mono mt-1.5">
            <span>Year 1</span>
            <span>Mid-term</span>
            <span>Year {annualSchedule.length}</span>
          </div>
        </div>
      </div>

      {/* Monthly Search Filter if Monthly View */}
      {viewMode === 'monthly' && (
        <div className="px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search year or date (e.g. 2027)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-slate-700"
            />
          </div>

          <span className="text-xs text-slate-400 font-mono">
            Showing {displayedMonthly.length} of {filteredMonthly.length} periods
          </span>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto">
        {viewMode === 'annual' ? (
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 uppercase font-medium tracking-wider border-y border-slate-800">
              <tr>
                <th scope="col" className="py-3 px-4 sm:px-6">Year</th>
                <th scope="col" className="py-3 px-4 text-right">Starting Balance</th>
                <th scope="col" className="py-3 px-4 text-right">Annual Payment</th>
                <th scope="col" className="py-3 px-4 text-right">Principal Paid</th>
                <th scope="col" className="py-3 px-4 text-right">Interest Paid</th>
                <th scope="col" className="py-3 px-4 sm:px-6 text-right">Ending Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
              {annualSchedule.map((row) => (
                <tr key={row.year} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 sm:px-6 font-semibold text-white">Year {row.year}</td>
                  <td className="py-3 px-4 text-right text-slate-300">{formatSGD(row.startingBalance)}</td>
                  <td className="py-3 px-4 text-right text-slate-100 font-medium">{formatSGD(row.totalPayment)}</td>
                  <td className="py-3 px-4 text-right text-emerald-400">{formatSGD(row.totalPrincipal)}</td>
                  <td className="py-3 px-4 text-right text-amber-400">{formatSGD(row.totalInterest)}</td>
                  <td className="py-3 px-4 sm:px-6 text-right text-white font-semibold">{formatSGD(row.endingBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 uppercase font-medium tracking-wider border-y border-slate-800">
              <tr>
                <th scope="col" className="py-3 px-4 sm:px-6">Month</th>
                <th scope="col" className="py-3 px-4">Date</th>
                <th scope="col" className="py-3 px-4 text-right">Payment</th>
                <th scope="col" className="py-3 px-4 text-right">Principal</th>
                <th scope="col" className="py-3 px-4 text-right">Interest</th>
                <th scope="col" className="py-3 px-4 text-right">Rate</th>
                <th scope="col" className="py-3 px-4 sm:px-6 text-right">Remaining Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
              {displayedMonthly.map((item) => (
                <tr key={item.period} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-4 sm:px-6 text-slate-400">M{item.period}</td>
                  <td className="py-2.5 px-4 text-slate-300">{item.dateStr}</td>
                  <td className="py-2.5 px-4 text-right text-slate-100 font-medium">{formatSGD(item.monthlyPayment)}</td>
                  <td className="py-2.5 px-4 text-right text-emerald-400">{formatSGD(item.principalPayment)}</td>
                  <td className="py-2.5 px-4 text-right text-amber-400">{formatSGD(item.interestPayment)}</td>
                  <td className="py-2.5 px-4 text-right text-slate-400">{formatPercent(item.applicableRate, 2)}</td>
                  <td className="py-2.5 px-4 sm:px-6 text-right text-white font-semibold">{formatSGD(item.remainingBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls for Monthly View */}
      {viewMode === 'monthly' && totalPages > 1 && (
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            Page <strong className="text-white font-mono">{page}</strong> of <strong className="text-white font-mono">{totalPages}</strong>
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

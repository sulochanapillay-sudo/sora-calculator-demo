import React, { useState } from 'react';
import { LoanInputState } from '../types/sora';
import { DEFAULT_LOAN_PACKAGES } from '../data/masSoraData';
import { calculateMonthlyPayment, formatPercent, formatSGD } from '../utils/soraCalculator';
import { ArrowUpDown, HelpCircle, Check } from 'lucide-react';

interface PackageComparisonProps {
  loanInputs: LoanInputState;
  current1mSora: number;
  current3mSora: number;
  onApplyPackage: (packageType: '1M_SORA' | '3M_SORA', spread: number) => void;
}

export const PackageComparison: React.FC<PackageComparisonProps> = ({
  loanInputs,
  current1mSora,
  current3mSora,
  onApplyPackage,
}) => {
  const [rateShockBps, setRateShockBps] = useState<number>(0); // in bps: -50, 0, +50, +100, +200

  const rateShockDecimal = rateShockBps / 100; // e.g. +1.00%

  // Compute metrics for each package
  const packageMetrics = DEFAULT_LOAN_PACKAGES.map((pkg) => {
    let effectiveRate = 0;
    let isFloating = false;

    if (pkg.rateType === '1M_SORA') {
      effectiveRate = current1mSora + rateShockDecimal + pkg.spread;
      isFloating = true;
    } else if (pkg.rateType === '3M_SORA') {
      effectiveRate = current3mSora + rateShockDecimal + pkg.spread;
      isFloating = true;
    } else if (pkg.rateType === 'FIXED_2Y') {
      effectiveRate = (pkg.fixedRate || 2.85);
      isFloating = false; // Fixed rates don't fluctuate during lock-in
    } else if (pkg.rateType === 'FIXED_3Y') {
      effectiveRate = (pkg.fixedRate || 2.95);
      isFloating = false;
    }

    effectiveRate = Math.max(0.1, Number(effectiveRate.toFixed(4)));

    const monthlyPayment = calculateMonthlyPayment(
      loanInputs.loanAmount,
      effectiveRate,
      loanInputs.tenureYears,
      loanInputs.repaymentType
    );

    // 3-year estimated interest
    const monthlyRate = effectiveRate / 100 / 12;
    const est3YearInterest = monthlyPayment * 36 - (monthlyPayment * 36 - loanInputs.loanAmount * (1 - Math.pow(1 + monthlyRate, -loanInputs.tenureYears * 12)));
    const approx3YearInterest = loanInputs.loanAmount * monthlyRate * 36 * 0.95; // realistic approximation

    return {
      ...pkg,
      effectiveRate,
      monthlyPayment,
      approx3YearInterest,
      isFloating,
    };
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-6">
      {/* Header and Scenario Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
        <div>
          <h2 className="text-base font-semibold text-white">Bank Package Comparison & Sensitivity</h2>
          <p className="text-xs text-slate-400">
            Compare floating SORA loan tiers against competitive fixed rate packages in Singapore
          </p>
        </div>

        {/* Rate Shock Scenario Tabs */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3 text-slate-500" />
            <span>Rate Shift:</span>
          </span>
          <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs font-mono">
            {[-50, 0, 50, 100, 200].map((bps) => (
              <button
                key={bps}
                type="button"
                onClick={() => setRateShockBps(bps)}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  rateShockBps === bps
                    ? bps === 0
                      ? 'bg-slate-800 text-white font-semibold'
                      : bps > 0
                      ? 'bg-rose-950 text-rose-300 font-semibold'
                      : 'bg-emerald-950 text-emerald-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {bps === 0 ? 'Base' : `${bps > 0 ? '+' : ''}${bps} bps`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rate Shift Scenario Notification */}
      {rateShockBps !== 0 && (
        <div className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
          rateShockBps > 0
            ? 'bg-rose-950/30 border-rose-800/40 text-rose-200'
            : 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200'
        }`}>
          <div>
            <strong>Rate Scenario Active: </strong>
            <span>
              Simulating an interest rate {rateShockBps > 0 ? 'increase' : 'decrease'} of{' '}
              {Math.abs(rateShockBps)} basis points ({rateShockBps > 0 ? '+' : ''}{rateShockDecimal.toFixed(2)}% p.a.).
              Fixed rate packages remain locked during their initial tenure.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setRateShockBps(0)}
            className="text-xs underline hover:no-underline ml-4 cursor-pointer"
          >
            Reset
          </button>
        </div>
      )}

      {/* Package Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {packageMetrics.map((pkg) => {
          const isCurrentChoice =
            loanInputs.benchmarkType === pkg.rateType &&
            Math.abs(loanInputs.bankMargin - pkg.spread) < 0.01;

          return (
            <div
              key={pkg.id}
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                isCurrentChoice
                  ? 'bg-slate-950 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/40'
                  : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-300">{pkg.institution}</span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {pkg.lockInPeriodYears}Y Lock-in
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mb-2">{pkg.name}</h3>

                <p className="text-xs text-slate-400 mb-4 min-h-[32px] line-clamp-2">
                  {pkg.tagline}
                </p>

                {/* Rate details */}
                <div className="p-3 bg-slate-900 rounded-lg space-y-1.5 border border-slate-800 mb-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Structure</span>
                    <span className="font-mono text-slate-300">
                      {pkg.isFloating ? `${pkg.rateType.replace('_', ' ')} + ${pkg.spread}%` : 'Guaranteed Fixed'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">All-In Effective Rate</span>
                    <span className="font-mono font-bold text-base text-emerald-400 tabular-nums">
                      {formatPercent(pkg.effectiveRate)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800/80">
                    <span className="text-slate-400">Monthly Repayment</span>
                    <span className="font-mono font-bold text-sm text-white tabular-nums">
                      {formatSGD(pkg.monthlyPayment)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {pkg.isFloating ? (
                <button
                  type="button"
                  onClick={() => onApplyPackage(pkg.rateType as '1M_SORA' | '3M_SORA', pkg.spread)}
                  className={`w-full py-2 px-3 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    isCurrentChoice
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {isCurrentChoice && <Check className="w-3.5 h-3.5" />}
                  <span>{isCurrentChoice ? 'Active In Calculator' : 'Apply Package'}</span>
                </button>
              ) : (
                <div className="text-center py-2 px-3 text-xs font-medium text-slate-400 bg-slate-900/60 rounded-lg border border-slate-800">
                  Fixed Package Benchmark
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Break-Even Insight Box */}
      <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl text-xs space-y-2 text-slate-400">
        <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
          <HelpCircle className="w-4 h-4 text-emerald-400" />
          <span>SORA Floating vs Fixed Rate Break-Even Analysis</span>
        </div>
        <p className="leading-relaxed">
          The 2-Year Fixed package locks in at 2.85% p.a. A 3M SORA package (currently {formatPercent(current3mSora)} + 0.65% = {formatPercent(current3mSora + 0.65)}) breaks even with the 2-Year Fixed rate if 3M SORA falls to{' '}
          <strong className="text-white font-mono">{formatPercent(Math.max(0, 2.85 - 0.65))}</strong>. If MAS overnight interest rates stay steady or fall further, floating SORA packages yield substantial interest savings over the lock-in period.
        </p>
      </div>
    </div>
  );
};

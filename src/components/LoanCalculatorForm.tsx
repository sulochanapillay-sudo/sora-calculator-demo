import React from 'react';
import { BenchmarkType, LoanInputState, PropertyType, RepaymentType } from '../types/sora';
import { formatPercent } from '../utils/soraCalculator';
import { Building2, Home, Store } from 'lucide-react';

interface LoanCalculatorFormProps {
  loanInputs: LoanInputState;
  benchmarkRate: number;
  allInRate: number;
  onChange: (inputs: Partial<LoanInputState>) => void;
}

const LOAN_PRESETS = [
  { label: 'S$ 500K (HDB 4-Room)', amount: 500000, tenure: 25, type: 'hdb' as PropertyType },
  { label: 'S$ 1.0M (EC / Suburb Condo)', amount: 1000000, tenure: 30, type: 'private' as PropertyType },
  { label: 'S$ 1.8M (Prime Condo)', amount: 1800000, tenure: 30, type: 'private' as PropertyType },
  { label: 'S$ 3.5M (Landed / Shophouse)', amount: 3500000, tenure: 25, type: 'commercial' as PropertyType },
];

const SPREAD_PRESETS = [0.60, 0.65, 0.70, 0.75, 0.85];

export const LoanCalculatorForm: React.FC<LoanCalculatorFormProps> = ({
  loanInputs,
  benchmarkRate,
  allInRate,
  onChange,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-semibold text-white">Loan Parameters</h2>
          <p className="text-xs text-slate-400">Configure mortgage borrowing amount, tenure, and bank margin</p>
        </div>

        {/* Repayment mode selector */}
        <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800">
          <button
            type="button"
            onClick={() => onChange({ repaymentType: 'amortizing' })}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              loanInputs.repaymentType === 'amortizing'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Amortizing (P + I)
          </button>
          <button
            type="button"
            onClick={() => onChange({ repaymentType: 'interest_only' })}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              loanInputs.repaymentType === 'interest_only'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Interest Only
          </button>
        </div>
      </div>

      {/* Property Type Selection */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-300">Property Segment</label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onChange({ propertyType: 'hdb' })}
            className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
              loanInputs.propertyType === 'hdb'
                ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'
                : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>HDB / EC</span>
          </button>
          <button
            type="button"
            onClick={() => onChange({ propertyType: 'private' })}
            className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
              loanInputs.propertyType === 'private'
                ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'
                : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Private Residential</span>
          </button>
          <button
            type="button"
            onClick={() => onChange({ propertyType: 'commercial' })}
            className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
              loanInputs.propertyType === 'commercial'
                ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'
                : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Commercial</span>
          </button>
        </div>
      </div>

      {/* Loan Amount with quick presets */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="loanAmountInput" className="text-xs font-medium text-slate-300">
            Loan Principal Amount (SGD)
          </label>
          <span className="text-xs font-mono text-emerald-400 font-semibold tabular-nums">
            S$ {loanInputs.loanAmount.toLocaleString()}
          </span>
        </div>

        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 text-sm font-semibold">
            S$
          </span>
          <input
            id="loanAmountInput"
            type="number"
            min={50000}
            max={50000000}
            step={10000}
            value={loanInputs.loanAmount}
            onChange={(e) => {
              const val = Math.max(0, Number(e.target.value));
              onChange({ loanAmount: val });
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-base font-semibold font-mono tabular-nums text-white focus:outline-none focus:border-emerald-500/80 transition-colors"
          />
        </div>

        {/* Quick presets */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {LOAN_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => onChange({ loanAmount: p.amount, tenureYears: p.tenure, propertyType: p.type })}
              className="text-[11px] py-1 px-2.5 rounded-md bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loan Tenure Slider & Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="loanTenureInput" className="text-xs font-medium text-slate-300">
            Loan Tenure
          </label>
          <div className="text-xs font-mono font-semibold text-white">
            <span className="tabular-nums">{loanInputs.tenureYears} Years</span>
            <span className="text-slate-500 ml-1">({loanInputs.tenureYears * 12} mos)</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <input
            id="loanTenureInput"
            type="range"
            min={5}
            max={loanInputs.propertyType === 'hdb' ? 30 : 35}
            step={1}
            value={loanInputs.tenureYears}
            onChange={(e) => onChange({ tenureYears: Number(e.target.value) })}
            className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <span className="text-xs font-mono text-slate-400 w-12 text-right">
            {loanInputs.tenureYears} yrs
          </span>
        </div>
      </div>

      {/* Benchmark Rate Selection */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-slate-300">SORA Benchmark</label>
          <span className="text-xs text-slate-400">
            Current: <span className="text-emerald-400 font-mono font-semibold">{formatPercent(benchmarkRate)}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(['1M_SORA', '3M_SORA', '6M_SORA', 'CUSTOM'] as BenchmarkType[]).map((type) => {
            const labels: Record<BenchmarkType, string> = {
              '1M_SORA': '1M SORA',
              '3M_SORA': '3M SORA',
              '6M_SORA': '6M SORA',
              'DAILY_SORA': 'Daily SORA',
              'CUSTOM': 'Custom Rate',
            };

            const isSelected = loanInputs.benchmarkType === type;

            return (
              <button
                key={type}
                type="button"
                onClick={() => onChange({ benchmarkType: type })}
                className={`py-2 px-3 rounded-lg border text-center text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-500/15 text-white'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div>{labels[type]}</div>
              </button>
            );
          })}
        </div>

        {loanInputs.benchmarkType === 'CUSTOM' && (
          <div className="mt-3 p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
            <label htmlFor="customBenchmarkInput" className="text-xs text-slate-400">
              Custom Benchmark Rate (% p.a.)
            </label>
            <input
              id="customBenchmarkInput"
              type="number"
              step={0.01}
              min={0}
              max={15}
              value={loanInputs.customBenchmarkRate}
              onChange={(e) => onChange({ customBenchmarkRate: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}
      </div>

      {/* Bank Spread / Margin */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="bankMarginInput" className="text-xs font-medium text-slate-300">
            Bank Margin / Spread (+ % p.a.)
          </label>
          <span className="text-xs font-mono font-semibold text-emerald-400 tabular-nums">
            +{loanInputs.bankMargin.toFixed(2)}%
          </span>
        </div>

        <div className="flex items-center gap-3">
          <input
            id="bankMarginInput"
            type="number"
            step={0.05}
            min={0}
            max={5}
            value={loanInputs.bankMargin}
            onChange={(e) => onChange({ bankMargin: Number(e.target.value) })}
            className="w-32 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono font-semibold tabular-nums text-white focus:outline-none focus:border-emerald-500"
          />

          <div className="flex flex-wrap gap-1.5 flex-1">
            {SPREAD_PRESETS.map((spread) => (
              <button
                key={spread}
                type="button"
                onClick={() => onChange({ bankMargin: spread })}
                className={`text-xs py-1.5 px-2.5 rounded-md border font-mono transition-colors cursor-pointer ${
                  loanInputs.bankMargin === spread
                    ? 'border-emerald-500/80 bg-emerald-500/20 text-emerald-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                +{spread.toFixed(2)}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* All-in Net Effective Rate Banner */}
      <div className="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-lg flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400">Total All-In Interest Rate</span>
          <div className="text-xs text-slate-500 font-mono">
            {formatPercent(benchmarkRate)} (SORA) + {formatPercent(loanInputs.bankMargin, 2)} (Spread)
          </div>
        </div>
        <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
          {formatPercent(allInRate)}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { BorrowerFinancials, CalculationResult, LoanInputState } from '../types/sora';
import { formatPercent, formatSGD } from '../utils/soraCalculator';
import { ShieldAlert, CheckCircle2, AlertTriangle, Scale, Info } from 'lucide-react';

interface StressTestPanelProps {
  calculation: CalculationResult;
  loanInputs: LoanInputState;
  borrowerFinancials: BorrowerFinancials;
  onUpdateFinancials: (data: Partial<BorrowerFinancials>) => void;
}

export const StressTestPanel: React.FC<StressTestPanelProps> = ({
  calculation,
  loanInputs,
  borrowerFinancials,
  onUpdateFinancials,
}) => {
  // MAS max TDSR borrowing estimation:
  // (Income * 0.55 - OtherCommitments) = max allowable monthly stress payment
  const maxAllowableMonthlyDebt = borrowerFinancials.monthlyGrossIncome * 0.55;
  const maxAllowableMortgageInstallment = Math.max(
    0,
    maxAllowableMonthlyDebt - borrowerFinancials.otherMonthlyCommitments
  );

  // Approximate principal that corresponds to this stress monthly installment:
  const monthlyStressRate = calculation.stressRate / 100 / 12;
  const totalMonths = loanInputs.tenureYears * 12;
  let maxBorrowingCapacity = 0;
  if (monthlyStressRate > 0) {
    const factor = Math.pow(1 + monthlyStressRate, totalMonths);
    maxBorrowingCapacity = maxAllowableMortgageInstallment * (factor - 1) / (monthlyStressRate * factor);
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              MAS Regulatory Stress-Test & Debt Ratios
            </h2>
            <p className="text-xs text-slate-400">
              Monetary Authority of Singapore (MAS) Notice 645 & Notice 632 Compliance Engine
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
          <span>MAS Stress Rate Floor: </span>
          <strong className="text-rose-400 font-bold">{formatPercent(calculation.stressRate, 2)}</strong>
        </div>
      </div>

      {/* Regulatory Ratios Compliance Badges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* TDSR Card */}
        <div className={`p-4 rounded-xl border transition-colors ${
          calculation.tdsrPassed
            ? 'bg-slate-950/80 border-emerald-500/30'
            : 'bg-rose-950/20 border-rose-500/40'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Debt Servicing Ratio (TDSR)
            </span>
            {calculation.tdsrPassed ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Compliant (≤ 55%)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-rose-400 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Exceeds MAS 55% Limit</span>
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold font-mono tabular-nums ${
              calculation.tdsrPassed ? 'text-white' : 'text-rose-400'
            }`}>
              {calculation.tdsrRatio.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-500 font-mono">/ 55.0% MAS Cap</span>
          </div>

          {/* Ratio bar */}
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mt-3">
            <div
              style={{ width: `${Math.min(100, (calculation.tdsrRatio / 55) * 100)}%` }}
              className={`h-full ${calculation.tdsrPassed ? 'bg-emerald-500' : 'bg-rose-500'}`}
            />
          </div>

          <div className="text-[11px] text-slate-400 mt-2 flex justify-between">
            <span>Includes car/credit loans: {formatSGD(borrowerFinancials.otherMonthlyCommitments)}</span>
            <span>Stress Inst: {formatSGD(calculation.stressMonthlyPayment)}</span>
          </div>
        </div>

        {/* MSR Card (Only active for HDB/EC) */}
        <div className={`p-4 rounded-xl border transition-colors ${
          loanInputs.propertyType === 'hdb'
            ? calculation.msrPassed
              ? 'bg-slate-950/80 border-emerald-500/30'
              : 'bg-rose-950/20 border-rose-500/40'
            : 'bg-slate-950/40 border-slate-800 opacity-60'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Mortgage Servicing Ratio (MSR)
            </span>
            {loanInputs.propertyType === 'hdb' ? (
              calculation.msrPassed ? (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Compliant (≤ 30%)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-rose-400 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Exceeds 30% HDB Cap</span>
                </span>
              )
            ) : (
              <span className="text-xs text-slate-500">N/A (Private/Commercial)</span>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold font-mono tabular-nums ${
              loanInputs.propertyType === 'hdb'
                ? calculation.msrPassed
                  ? 'text-white'
                  : 'text-rose-400'
                : 'text-slate-400'
            }`}>
              {loanInputs.propertyType === 'hdb' && calculation.msrRatio !== null
                ? `${calculation.msrRatio.toFixed(1)}%`
                : 'Exempt'}
            </span>
            {loanInputs.propertyType === 'hdb' && (
              <span className="text-xs text-slate-500 font-mono">/ 30.0% MAS Cap</span>
            )}
          </div>

          {/* Ratio bar */}
          {loanInputs.propertyType === 'hdb' && calculation.msrRatio !== null ? (
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mt-3">
              <div
                style={{ width: `${Math.min(100, (calculation.msrRatio / 30) * 100)}%` }}
                className={`h-full ${calculation.msrPassed ? 'bg-emerald-500' : 'bg-rose-500'}`}
              />
            </div>
          ) : (
            <p className="text-[11px] text-slate-500 mt-3">
              MSR applies strictly to HDB flats and new Executive Condominiums.
            </p>
          )}

          {loanInputs.propertyType === 'hdb' && (
            <div className="text-[11px] text-slate-400 mt-2">
              <span>HDB/EC monthly installment cap: </span>
              <strong className="text-slate-200 font-mono">
                {formatSGD(borrowerFinancials.monthlyGrossIncome * 0.3)}
              </strong>
            </div>
          )}
        </div>
      </div>

      {/* Income & Financial Commitments Input Form */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        {/* Monthly Gross Income */}
        <div className="space-y-1.5">
          <label htmlFor="grossIncomeInput" className="text-xs font-medium text-slate-300">
            Monthly Gross Household Income (SGD)
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 text-xs font-mono">
              S$
            </span>
            <input
              id="grossIncomeInput"
              type="number"
              step={500}
              min={1000}
              value={borrowerFinancials.monthlyGrossIncome}
              onChange={(e) => onUpdateFinancials({ monthlyGrossIncome: Math.max(0, Number(e.target.value)) })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-sm font-mono tabular-nums text-white focus:outline-none focus:border-slate-700"
            />
          </div>
        </div>

        {/* Other Monthly Commitments */}
        <div className="space-y-1.5">
          <label htmlFor="otherDebtInput" className="text-xs font-medium text-slate-300">
            Other Monthly Debt Commitments (SGD)
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 text-xs font-mono">
              S$
            </span>
            <input
              id="otherDebtInput"
              type="number"
              step={100}
              min={0}
              value={borrowerFinancials.otherMonthlyCommitments}
              onChange={(e) => onUpdateFinancials({ otherMonthlyCommitments: Math.max(0, Number(e.target.value)) })}
              placeholder="Car loans, study loans, cards"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-sm font-mono tabular-nums text-white focus:outline-none focus:border-slate-700"
            />
          </div>
        </div>

        {/* Regulatory Stress Rate */}
        <div className="space-y-1.5">
          <label htmlFor="stressRateInput" className="text-xs font-medium text-slate-300">
            Stress Test Rate (% p.a.)
          </label>
          <div className="flex items-center gap-2">
            <input
              id="stressRateInput"
              type="number"
              step={0.1}
              min={3.5}
              max={10.0}
              value={borrowerFinancials.regulatoryStressRate}
              onChange={(e) => onUpdateFinancials({ regulatoryStressRate: Math.max(3.0, Number(e.target.value)) })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono tabular-nums text-white focus:outline-none focus:border-slate-700"
            />
            <button
              type="button"
              onClick={() => onUpdateFinancials({ regulatoryStressRate: 4.0 })}
              className="px-2.5 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap cursor-pointer"
            >
              Reset 4%
            </button>
          </div>
        </div>
      </div>

      {/* Max Borrowing Capacity Summary */}
      <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Estimated Max Borrowing Capacity under MAS TDSR</span>
          </div>
          <div className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
            {formatSGD(maxBorrowingCapacity, false)}
          </div>
        </div>

        <div className="text-xs text-slate-400 space-y-0.5 sm:text-right">
          <div>
            Max Monthly Installment Capacity: <strong className="text-white font-mono">{formatSGD(maxAllowableMortgageInstallment)}</strong>
          </div>
          <div>
            Current Requested Loan: <strong className="text-slate-200 font-mono">{formatSGD(loanInputs.loanAmount, false)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

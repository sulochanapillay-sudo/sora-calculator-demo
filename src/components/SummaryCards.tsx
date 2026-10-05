import React from 'react';
import { CalculationResult, LoanInputState } from '../types/sora';
import { formatPercent, formatSGD } from '../utils/soraCalculator';
import { CreditCard, Landmark, TrendingUp, ShieldAlert } from 'lucide-react';

interface SummaryCardsProps {
  calculation: CalculationResult;
  loanInputs: LoanInputState;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  calculation,
  loanInputs,
}) => {
  const firstYearSummary = calculation.annualSchedule[0];
  const principalPercent = calculation.totalPayment > 0
    ? (loanInputs.loanAmount / calculation.totalPayment) * 100
    : 0;
  const interestPercent = 100 - principalPercent;

  return (
    <div className="space-y-4">
      {/* 4-Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Monthly Installment */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Monthly Installment</span>
            <CreditCard className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight tabular-nums">
            {formatSGD(calculation.monthlyPayment)}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>At All-In Rate</span>
            <span className="font-mono text-emerald-400 font-semibold">{formatPercent(calculation.allInRate)}</span>
          </div>
        </div>

        {/* Total Interest Payable */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Lifetime Interest</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-400 tracking-tight tabular-nums">
            {formatSGD(calculation.totalInterest)}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>Over {loanInputs.tenureYears} Years</span>
            <span className="font-mono text-slate-300 font-medium">{interestPercent.toFixed(1)}% of total</span>
          </div>
        </div>

        {/* Total Principal + Interest Outlay */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Loan Repayment</span>
            <Landmark className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-100 tracking-tight tabular-nums">
            {formatSGD(calculation.totalPayment)}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>Principal Borrowed</span>
            <span className="font-mono text-slate-300 font-medium">{formatSGD(loanInputs.loanAmount, false)}</span>
          </div>
        </div>

        {/* MAS Stress Monthly Payment */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>MAS 4% Stress Payment</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-rose-300 tracking-tight tabular-nums">
            {formatSGD(calculation.stressMonthlyPayment)}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>Regulatory Floor Rate</span>
            <span className="font-mono text-rose-400 font-semibold">{formatPercent(calculation.stressRate, 2)}</span>
          </div>
        </div>
      </div>

      {/* Visual Amortization Outlay Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>Lifetime Capital Allocation</span>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
              <span>Principal: {principalPercent.toFixed(1)}%</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" />
              <span>Interest: {interestPercent.toFixed(1)}%</span>
            </span>
          </div>
        </div>

        {/* Multi-segment progress bar */}
        <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${principalPercent}%` }}
            className="h-full bg-emerald-500 transition-all duration-300"
            title={`Principal: ${formatSGD(loanInputs.loanAmount)}`}
          />
          <div
            style={{ width: `${interestPercent}%` }}
            className="h-full bg-amber-500 transition-all duration-300"
            title={`Total Interest: ${formatSGD(calculation.totalInterest)}`}
          />
        </div>

        {/* Year 1 Breakdown Insight */}
        {firstYearSummary && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-slate-400">Year 1 Total Outlay: </span>
              <span className="font-mono text-slate-200 font-semibold">{formatSGD(firstYearSummary.totalPayment)}</span>
            </div>
            <div>
              <span className="text-slate-400">Year 1 Principal Paid: </span>
              <span className="font-mono text-emerald-400 font-semibold">{formatSGD(firstYearSummary.totalPrincipal)}</span>
            </div>
            <div>
              <span className="text-slate-400">Year 1 Interest Paid: </span>
              <span className="font-mono text-amber-400 font-semibold">{formatSGD(firstYearSummary.totalInterest)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

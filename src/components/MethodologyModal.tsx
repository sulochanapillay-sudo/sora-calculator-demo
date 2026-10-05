import React from 'react';
import { X, BookOpen, CheckCircle, Calculator, ShieldCheck } from 'lucide-react';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                MAS SORA Methodology & Banking Standards
              </h2>
              <p className="text-xs text-slate-400">
                Official Monetary Authority of Singapore (MAS) and ABS Specifications
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs text-slate-300 leading-relaxed">
          {/* Section 1: What is SORA? */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>1. What is SORA?</span>
            </h3>
            <p>
              The <strong>Singapore Overnight Rate Average (SORA)</strong> is the volume-weighted average rate of unsecured overnight interbank Singapore Dollar (SGD) borrowing transactions brokered in Singapore between 8:00 AM and 6:15 PM.
            </p>
            <p>
              SORA is calculated and published daily by the <strong>Monetary Authority of Singapore (MAS)</strong> at 9:00 AM on the following business day. Because it is backed by actual, verified interbank cash transactions, SORA is transparent, robust, and free from quote manipulation.
            </p>
          </div>

          {/* Section 2: Compounded SORA Formula & SORA Index */}
          <div className="space-y-2.5 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-400" />
              <span>2. MAS SORA Index Compounding Formula</span>
            </h3>
            <p>
              MAS facilitates compound rate calculations through the <strong>SORA Index</strong>, a daily series initialized with a base value of <code>1.0000000000</code> on 3 January 2020.
            </p>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded font-mono text-emerald-300 text-center text-xs">
              Compounded SORA = [(SORA Index_end / SORA Index_start) - 1] × (365 / d) × 100%
            </div>

            <ul className="space-y-1 text-slate-400 pl-4 list-disc">
              <li><strong>SORA Index_end</strong>: Index value on the last date of the Observation Period.</li>
              <li><strong>SORA Index_start</strong>: Index value on the first date of the Observation Period.</li>
              <li><strong>d</strong>: Total number of calendar days in the observation window (e.g. 30, 90, or 180 days).</li>
              <li><strong>Day Count Convention</strong>: Exact Singapore actual days over 365 (ACT/365). Compounding applies strictly on business days, rolling over for weekends and public holidays.</li>
            </ul>
          </div>

          {/* Section 3: 1M vs 3M vs 6M Compounded SORA */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>3. Tenor Conventions (1M, 3M, 6M)</span>
            </h3>
            <p>
              Floating mortgage packages in Singapore reset at predetermined intervals based on historical compounding:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <div className="font-semibold text-white mb-1">1-Month SORA</div>
                <p className="text-slate-400 text-[11px]">
                  Interest resets every month. Adjusts rapidly to interest rate cuts or hikes by global central banks.
                </p>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <div className="font-semibold text-white mb-1">3-Month SORA</div>
                <p className="text-slate-400 text-[11px]">
                  Most popular home loan benchmark in Singapore. Balances quarterly payment predictability with market tracking.
                </p>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <div className="font-semibold text-white mb-1">6-Month SORA</div>
                <p className="text-slate-400 text-[11px]">
                  Semi-annual reset period favored by corporate borrowers and institutional credit facilities.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: MAS Regulatory Framework (TDSR & MSR) */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-rose-400" />
              <span>4. MAS Regulatory Framework (TDSR, MSR & Stress Rate)</span>
            </h3>
            <p>
              Under MAS Notice 645, all financial institutions in Singapore are mandated to safeguard financial stability using debt threshold caps:
            </p>
            <ul className="space-y-1.5 text-slate-400 pl-4 list-disc">
              <li>
                <strong>4.00% Medium-Term Stress Rate Floor</strong>: When assessing loan approval and servicing capacity, banks must apply at least 4.00% p.a. (or current rate + spread if higher).
              </li>
              <li>
                <strong>TDSR (Total Debt Servicing Ratio) ≤ 55%</strong>: The borrower’s total monthly debt obligations (mortgage stress installment + car loans + student loans + minimum credit card dues) must not exceed 55% of gross monthly income.
              </li>
              <li>
                <strong>MSR (Mortgage Servicing Ratio) ≤ 30%</strong>: For HDB flats and new Executive Condominiums (EC), mortgage payments alone under stress testing must not exceed 30% of gross monthly income.
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};

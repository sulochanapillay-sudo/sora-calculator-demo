import React from 'react';
import { MasSoraDailyRecord } from '../types/sora';
import { formatPercent } from '../utils/soraCalculator';
import { ExternalLink, SlidersHorizontal } from 'lucide-react';

interface RatesBannerProps {
  latestRecord: MasSoraDailyRecord;
  onOpenHistory: () => void;
  onOpenCustomRate: () => void;
}

export const RatesBanner: React.FC<RatesBannerProps> = ({
  latestRecord,
  onOpenHistory,
  onOpenCustomRate,
}) => {
  return (
    <section className="border-b border-slate-800 bg-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Rate series figures */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex lg:items-center gap-4 sm:gap-6 lg:gap-8">
            {/* Daily Overnight SORA */}
            <div className="space-y-0.5">
              <span className="text-xs font-medium text-slate-400">
                Daily SORA
              </span>
              <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-white">
                {formatPercent(latestRecord.sora)}
              </div>
            </div>

            {/* 1M Compounded SORA */}
            <div className="space-y-0.5">
              <span className="text-xs font-medium text-slate-400">
                1M Compounded SORA
              </span>
              <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-emerald-400">
                {formatPercent(latestRecord.comp1m)}
              </div>
            </div>

            {/* 3M Compounded SORA */}
            <div className="space-y-0.5">
              <span className="text-xs font-medium text-slate-400">
                3M Compounded SORA
              </span>
              <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-emerald-400">
                {formatPercent(latestRecord.comp3m)}
              </div>
            </div>

            {/* 6M Compounded SORA */}
            <div className="space-y-0.5">
              <span className="text-xs font-medium text-slate-400">
                6M Compounded SORA
              </span>
              <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-slate-200">
                {formatPercent(latestRecord.comp6m)}
              </div>
            </div>

            {/* SORA Index */}
            <div className="hidden xl:block space-y-0.5 pl-4 border-l border-slate-800">
              <span className="text-xs font-medium text-slate-400">
                SORA Index
              </span>
              <div className="text-base font-mono tabular-nums text-slate-300">
                {latestRecord.soraIndex.toFixed(6)}
              </div>
            </div>
          </div>

          {/* Source attribution & action triggers */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-400 pt-2 lg:pt-0 border-t border-slate-800/80 lg:border-t-0">
            <div>
              <span>Benchmark Date: <strong className="text-slate-200 font-mono">{latestRecord.date}</strong></span>
              <span className="mx-2 text-slate-600">·</span>
              <span className="text-slate-400">Published 9:00 AM SGT by MAS</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenHistory}
                className="inline-flex items-center gap-1 text-slate-300 hover:text-emerald-400 transition-colors font-medium cursor-pointer"
              >
                <span>Rate History</span>
                <ExternalLink className="w-3 h-3" />
              </button>

              <span className="text-slate-700">·</span>

              <button
                onClick={onOpenCustomRate}
                className="inline-flex items-center gap-1 text-slate-300 hover:text-emerald-400 transition-colors font-medium cursor-pointer"
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>Custom Override</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

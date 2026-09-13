"use client";

import React, { useState } from 'react';
import { TrendingUp, Globe, AlertTriangle } from 'lucide-react';
import {
  parseAndFormatCurrency,
  parseCurrencyNumber,
  getRevenueBudgetMultiplier,
  getEstimatedRevenueDifference,
  assessFinancialDataQuality,
  CurrencyCode,
} from '../utils/formatCurrency';

interface BoxOfficeCardProps {
  mediaType: string;
  details: {
    budget?: number;
    revenue?: number;
    original_language?: string;
    production_countries?: Array<{ iso_3166_1?: string; name?: string }>;
    omdb?: {
      BoxOffice?: string;
    };
  };
  dominantColor?: string | null;
}

export const BoxOfficeCard: React.FC<BoxOfficeCardProps> = ({
  mediaType,
  details,
  dominantColor,
}) => {
  const [currency, setCurrency] = useState<CurrencyCode>('USD');

  // Strict guard: Only for movies
  if (mediaType !== 'movie') return null;

  const rawBudget = parseCurrencyNumber(details?.budget);
  const rawRevenue = parseCurrencyNumber(details?.revenue);
  const rawDomestic = parseCurrencyNumber(details?.omdb?.BoxOffice);

  // Guard: Must have at least one valid financial metric
  if (!rawBudget && !rawRevenue && !rawDomestic) {
    return null;
  }

  // ─── Financial Data Quality Assessment ────────────────────────────────────
  // Determines if profit/ROI metrics are safe to show (e.g. suppressed for
  // Indian films where TMDB revenue often reflects only a partial USD figure).
  const qualityResult = assessFinancialDataQuality({
    budget: rawBudget,
    revenue: rawRevenue,
    originalLanguage: details?.original_language,
    productionCountries: details?.production_countries,
  });

  const isPartial = qualityResult.quality === 'partial';
  const suppressPerformance = qualityResult.suppressPerformance;

  // ─── Formatting ───────────────────────────────────────────────────────────
  const formattedBudget = parseAndFormatCurrency(rawBudget, currency);
  const formattedRevenue = parseAndFormatCurrency(rawRevenue, currency);
  const formattedDomestic = parseAndFormatCurrency(rawDomestic, currency);

  // Only compute these when performance data is trustworthy
  const multiplier = suppressPerformance
    ? null
    : getRevenueBudgetMultiplier(rawBudget, rawRevenue);
  const estimatedDiff = suppressPerformance
    ? null
    : getEstimatedRevenueDifference(rawBudget, rawRevenue, currency);

  // International calculation (if both worldwide and domestic exist)
  const rawInternational =
    rawRevenue && rawDomestic && rawRevenue > rawDomestic
      ? rawRevenue - rawDomestic
      : null;
  const formattedInternational = parseAndFormatCurrency(rawInternational, currency);

  // Percentages for recoupment and geographic split
  const budgetRatio =
    rawBudget && rawRevenue && rawRevenue > 0
      ? (rawBudget / rawRevenue) * 100
      : null;
  const budgetPercent =
    budgetRatio !== null ? Math.min(100, Math.round(budgetRatio)) : null;
  const profitPercent =
    budgetPercent !== null ? Math.max(0, 100 - budgetPercent) : null;

  const domesticShare =
    rawDomestic && rawRevenue && rawRevenue > 0
      ? Math.round((rawDomestic / rawRevenue) * 100)
      : null;
  const internationalShare =
    domesticShare !== null ? Math.max(0, 100 - domesticShare) : null;

  return (
    <section className="w-full max-w-2xl sm:max-w-3xl mx-auto my-4 sm:my-6 px-0 sm:px-2">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-2.5 px-1">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-zinc-400" />
          <span className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">
            Box Office &amp; Financials
          </span>
        </div>

        {/* Currency Switcher: $ USD | ₹ INR */}
        <div className="flex items-center p-0.5 rounded-full bg-zinc-900/80 border border-white/10 text-[10px] sm:text-[11px] shadow-inner">
          <button
            onClick={() => setCurrency('USD')}
            className={`px-2.5 py-0.5 rounded-full font-semibold transition-all duration-150 cursor-pointer ${
              currency === 'USD'
                ? 'bg-zinc-700 text-white shadow-sm border border-white/15'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            aria-label="Display in US Dollars"
          >
            $ USD
          </button>
          <button
            onClick={() => setCurrency('INR')}
            className={`px-2.5 py-0.5 rounded-full font-semibold transition-all duration-150 cursor-pointer ${
              currency === 'INR'
                ? 'bg-zinc-700 text-white shadow-sm border border-white/15'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            aria-label="Display in Indian Rupees (Crores)"
          >
            ₹ INR
          </button>
        </div>
      </div>

      {/* Main Financial Card */}
      <div
        className={`relative overflow-hidden rounded-2xl bg-zinc-950/70 border border-white/[0.08] backdrop-blur-xl shadow-2xl transition-all duration-300 ${isPartial ? 'p-3 sm:p-4' : 'p-4 sm:p-5'}`}
        style={{
          boxShadow: dominantColor
            ? `0 12px 35px -15px ${dominantColor.replace('rgb', 'rgba').replace(')', ', 0.25)')}`
            : '0 12px 35px -15px rgba(0,0,0,0.7)',
        }}
      >
        {/* Ambient Glow */}
        <div
          className="absolute -top-20 -right-20 w-44 h-44 rounded-full pointer-events-none opacity-20 blur-3xl"
          style={{ backgroundColor: dominantColor || '#10b981' }}
        />



        {/* Hero Revenue & Return Badge */}
        <div className={`relative z-10 flex items-end justify-between gap-3 ${isPartial ? 'pb-2' : 'pb-3'}`}>
          <div>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-0.5">
              <Globe className="w-3 h-3 text-zinc-500" />
              <span>{isPartial ? 'Reported Revenue' : 'Worldwide Gross'}</span>
            </div>
            <div className={`font-black text-white tracking-tight leading-none ${isPartial ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-4xl'}`}>
              {formattedRevenue || (formattedDomestic ? '—' : 'N/A')}
            </div>
            {isPartial && currency === 'INR' && formattedRevenue && (
              <p className="text-[9px] sm:text-[10px] text-zinc-500 mt-0.5">
                USD amount × 86.5 (est. conversion)
              </p>
            )}
          </div>

          {/* ROI & Net Profit Pill — only when data is trustworthy */}
          {!suppressPerformance && (
            <div className="flex flex-col items-end text-right">
              {multiplier && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-xs sm:text-sm shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                  {multiplier} Return
                </span>
              )}
              {estimatedDiff && (
                <span
                  className={`text-[10px] sm:text-xs font-semibold mt-1 ${
                    estimatedDiff.isPositive ? 'text-emerald-400/90' : 'text-rose-400/90'
                  }`}
                >
                  {estimatedDiff.formatted} net profit
                </span>
              )}
            </div>
          )}
        </div>

        {/* Secondary Financial Metrics */}
        <div
          className={`relative z-10 grid gap-2 sm:gap-3 ${isPartial ? 'my-1.5' : 'my-2.5'} ${
            formattedInternational ? 'grid-cols-3' : 'grid-cols-2'
          }`}
        >
          {/* Production Budget Tile */}
          {formattedBudget && (
            <div className="p-2 sm:p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex flex-col justify-between">
              <span className="text-[9px] sm:text-[10px] font-semibold text-zinc-400 uppercase tracking-wider truncate">
                Budget
              </span>
              <div className="mt-1">
                <span className="text-xs sm:text-sm md:text-base font-bold text-zinc-200">
                  {formattedBudget}
                </span>
                {/* Budget-as-% of gross only shown when data is reliable */}
                {!suppressPerformance && budgetPercent !== null && (
                  <span className="block text-[9px] sm:text-[10px] text-zinc-500 font-medium">
                    {budgetPercent}% of gross
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Domestic Gross Tile */}
          {formattedDomestic && (
            <div className="p-2 sm:p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex flex-col justify-between">
              <span className="text-[9px] sm:text-[10px] font-semibold text-zinc-400 uppercase tracking-wider truncate">
                Domestic
              </span>
              <div className="mt-1">
                <span className="text-xs sm:text-sm md:text-base font-bold text-zinc-200">
                  {formattedDomestic}
                </span>
                {!suppressPerformance && domesticShare !== null && (
                  <span className="block text-[9px] sm:text-[10px] text-zinc-500 font-medium">
                    {domesticShare}% share
                  </span>
                )}
              </div>
            </div>
          )}

          {/* International Gross Tile or Net Profit Tile */}
          {formattedInternational ? (
            <div className="p-2 sm:p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex flex-col justify-between">
              <span className="text-[9px] sm:text-[10px] font-semibold text-zinc-400 uppercase tracking-wider truncate">
                Overseas
              </span>
              <div className="mt-1">
                <span className="text-xs sm:text-sm md:text-base font-bold text-zinc-200">
                  {formattedInternational}
                </span>
                {!suppressPerformance && internationalShare !== null && (
                  <span className="block text-[9px] sm:text-[10px] text-zinc-500 font-medium">
                    {internationalShare}% share
                  </span>
                )}
              </div>
            </div>
          ) : !suppressPerformance && estimatedDiff && !formattedDomestic ? (
            <div
              className={`p-2 sm:p-2.5 rounded-xl border flex flex-col justify-between ${
                estimatedDiff.isPositive
                  ? 'bg-emerald-500/[0.04] border-emerald-500/20'
                  : 'bg-rose-500/[0.04] border-rose-500/20'
              }`}
            >
              <span className="text-[9px] sm:text-[10px] font-semibold text-zinc-400 uppercase tracking-wider truncate">
                Net Profit
              </span>
              <div className="mt-1">
                <span
                  className={`text-xs sm:text-sm md:text-base font-bold ${
                    estimatedDiff.isPositive ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {estimatedDiff.formatted}
                </span>
                <span className="block text-[9px] sm:text-[10px] text-zinc-500 font-medium">
                  {estimatedDiff.isPositive ? 'Exceeded budget' : 'Recoup pending'}
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {/* ─── Data Quality Warning Banner (bottom) ─────────────────────── */}
        {isPartial && (
          <div className="relative z-10 flex items-center gap-2 mt-2 px-2.5 py-1.5 rounded-lg bg-amber-500/[0.08] border border-amber-500/20">
            <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />
            <p className="text-[9px] sm:text-[10px] text-amber-300/80 leading-snug">
              <span className="font-semibold text-amber-300">Data may be incomplete.</span>
              {' '}TMDB revenue for Indian films is often partial or US-only.
            </p>
          </div>
        )}

        {/* Budget vs Profit Spectrum Bar — suppressed when data is partial */}
        {!suppressPerformance &&
          rawBudget &&
          rawRevenue &&
          rawRevenue > 0 &&
          budgetPercent !== null && (
            <div className="relative z-10 pt-2 border-t border-white/[0.05]">
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-medium text-zinc-400 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
                  Budget ({budgetPercent}%)
                </span>
                {rawRevenue > rawBudget && profitPercent !== null && (
                  <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                    Net Profit ({profitPercent}%)
                  </span>
                )}
              </div>

              {/* Gradient Track Bar */}
              <div className="w-full h-2 rounded-full bg-zinc-800/80 overflow-hidden flex p-0.5 ring-1 ring-white/5">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-l-full transition-all duration-700"
                  style={{ width: `${Math.min(100, budgetPercent)}%` }}
                  title={`Budget: ${formattedBudget} (${budgetPercent}%)`}
                />
                {rawRevenue > rawBudget && profitPercent !== null && (
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 rounded-r-full transition-all duration-700 ml-0.5"
                    style={{ width: `${profitPercent}%` }}
                    title={`Net Surplus: ${estimatedDiff?.formatted} (${profitPercent}%)`}
                  />
                )}
              </div>
            </div>
          )}
      </div>
    </section>
  );
};

export default BoxOfficeCard;

export type CurrencyCode = 'USD' | 'INR';

export const USD_TO_INR_RATE = 86.5;

/**
 * Parses numeric or formatted currency strings (e.g., "$188,020,017" or 165000000)
 * and formats them into compact currency strings:
 * - In USD: $1.2B, $165.0M, $450.0K
 * - In INR: ₹20,760 Cr, ₹1,946 Cr, ₹85.5 Lakh (using the standard Indian Crore/Lakh box office convention)
 * Returns null if the value is zero, negative, invalid, or missing.
 */
export function parseAndFormatCurrency(
  value: number | string | null | undefined,
  currency: CurrencyCode = 'USD'
): string | null {
  const num = parseCurrencyNumber(value);
  if (!num) return null;

  if (currency === 'INR') {
    const inr = num * USD_TO_INR_RATE;
    // Indian Numbering: 1 Crore = 10,000,000 (10M), 1 Lakh = 100,000
    if (inr >= 10_000_000) {
      const cr = inr / 10_000_000;
      if (cr >= 100) {
        return `₹${Math.round(cr).toLocaleString('en-IN')} Cr`;
      }
      return `₹${cr.toFixed(1)} Cr`;
    }
    if (inr >= 100_000) {
      const lakh = inr / 100_000;
      return `₹${lakh.toFixed(1)} Lakh`;
    }
    return `₹${Math.round(inr).toLocaleString('en-IN')}`;
  }

  // Default USD formatting
  if (num >= 1_000_000_000) {
    return `$${(num / 1_000_000_000).toFixed(1)}B`;
  }
  if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(1)}K`;
  }

  return `$${num.toLocaleString('en-US')}`;
}

/**
 * Returns raw numeric value in USD from number or string, or null if invalid/non-positive.
 */
export function parseCurrencyNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;

  let num: number;
  if (typeof value === 'number') {
    num = value;
  } else {
    const cleanStr = value.replace(/[^0-9.-]+/g, '');
    num = parseFloat(cleanStr);
  }

  if (isNaN(num) || num <= 0) {
    return null;
  }

  return num;
}

/**
 * Computes the Revenue / Budget multiplier.
 * Multipliers are unitless (same in USD, INR, EUR, etc.).
 * e.g., 10.70×
 */
export function getRevenueBudgetMultiplier(
  budget: number | null | undefined,
  revenue: number | null | undefined
): string | null {
  const b = parseCurrencyNumber(budget);
  const r = parseCurrencyNumber(revenue);

  if (!b || !r) return null;

  const ratio = r / b;
  return `${ratio.toFixed(2)}×`;
}

/**
 * Computes Estimated Revenue − Budget difference formatted with sign.
 * e.g., "+$2.2B" or "+₹18,814 Cr"
 */
export function getEstimatedRevenueDifference(
  budget: number | null | undefined,
  revenue: number | null | undefined,
  currency: CurrencyCode = 'USD'
): { formatted: string; isPositive: boolean } | null {
  const b = parseCurrencyNumber(budget);
  const r = parseCurrencyNumber(revenue);

  if (!b || !r) return null;

  const diff = r - b;
  const isPositive = diff >= 0;
  const absFormatted = parseAndFormatCurrency(Math.abs(diff), currency) || (currency === 'INR' ? '₹0' : '$0');

  return {
    formatted: `${isPositive ? '+' : '-'}${absFormatted}`,
    isPositive,
  };
}

// ─── Financial Data Quality Assessment ───────────────────────────────────────

/**
 * Languages primarily used in Indian cinema.
 * Used to detect Indian-market films where TMDB revenue data is often
 * incomplete (regional theatrical gross not reflected in USD revenue field).
 */
const INDIAN_LANGUAGES = new Set([
  'hi', // Hindi
  'ta', // Tamil
  'te', // Telugu
  'ml', // Malayalam
  'kn', // Kannada
  'mr', // Marathi
  'gu', // Gujarati
  'pa', // Punjabi
  'bn', // Bengali (Indian)
  'or', // Odia
]);

export type FinancialDataQuality = 'reliable' | 'partial' | 'missing';

export interface FinancialQualityResult {
  /** Overall quality classification */
  quality: FinancialDataQuality;
  /** Human-readable reason shown in the warning banner */
  reason: string | null;
  /** Whether profit/ROI metrics should be suppressed */
  suppressPerformance: boolean;
}

/**
 * Assesses whether TMDB/OMDb financial data is reliable enough to
 * display profit/loss conclusions.
 *
 * Returns `partial` (and sets suppressPerformance = true) when:
 *  - The film is detected as Indian-market AND
 *    revenue is missing, or revenue < 50% of budget (suspicious for Indian films
 *    whose theatrical gross is often reported in INR crores, not USD)
 *  - Revenue is missing entirely (only budget known)
 *
 * Returns `reliable` when enough data exists to draw conclusions.
 */
export function assessFinancialDataQuality(params: {
  budget: number | null;
  revenue: number | null;
  originalLanguage?: string | null;
  productionCountries?: Array<{ iso_3166_1?: string; name?: string }> | null;
}): FinancialQualityResult {
  const { budget, revenue, originalLanguage, productionCountries } = params;

  // No financial data at all
  if (!budget && !revenue) {
    return { quality: 'missing', reason: null, suppressPerformance: true };
  }

  // Only budget, no revenue — can't assess performance
  if (budget && !revenue) {
    return {
      quality: 'partial',
      reason: 'Box office data is unavailable from our sources.',
      suppressPerformance: true,
    };
  }

  // Detect Indian market
  const langCode = (originalLanguage || '').toLowerCase();
  const isIndianLanguage = INDIAN_LANGUAGES.has(langCode);
  const isIndianCountry = (productionCountries || []).some(
    (c) =>
      c?.iso_3166_1?.toUpperCase() === 'IN' ||
      c?.name?.toLowerCase() === 'india'
  );
  const isIndianMarket = isIndianLanguage || isIndianCountry;

  if (isIndianMarket && budget && revenue) {
    // For Indian films, TMDB sometimes stores only a fraction of the true
    // theatrical gross (e.g. only overseas USD, not the INR domestic gross).
    // If revenue is less than 60% of budget it's almost certainly incomplete.
    const ratio = revenue / budget;
    if (ratio < 0.6) {
      return {
        quality: 'partial',
        reason:
          'The reported revenue may only reflect a portion of the actual theatrical collection. ' +
          'TMDB data for Indian films is often incomplete or in USD only.',
        suppressPerformance: true,
      };
    }
  }

  return { quality: 'reliable', reason: null, suppressPerformance: false };
}

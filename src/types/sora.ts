/**
 * Singapore SORA (Singapore Overnight Rate Average) Calculator Types
 * Aligned with Monetary Authority of Singapore (MAS) and ABS conventions.
 */

export type BenchmarkType = '1M_SORA' | '3M_SORA' | '6M_SORA' | 'DAILY_SORA' | 'CUSTOM';

export type RepaymentType = 'amortizing' | 'interest_only';

export type PropertyType = 'hdb' | 'private' | 'commercial';

export interface MasSoraDailyRecord {
  date: string; // YYYY-MM-DD
  sora: number; // Daily Overnight SORA rate in % p.a.
  soraIndex: number; // Official MAS SORA Index (Base 1.0000000000 on 3 Jan 2020)
  comp1m: number; // 1-Month Compounded SORA in % p.a.
  comp3m: number; // 3-Month Compounded SORA in % p.a.
  comp6m: number; // 6-Month Compounded SORA in % p.a.
  volumeMillionSGD: number; // Aggregate unsecured overnight interbank borrowing volume
  lowRate: number;
  highRate: number;
}

export interface LoanInputState {
  loanAmount: number; // Principal in SGD
  tenureYears: number; // Loan duration (typically 5 - 30 years)
  benchmarkType: BenchmarkType;
  bankMargin: number; // Spread in % p.a. (e.g. 0.70%)
  customBenchmarkRate: number; // In % p.a. when benchmarkType === 'CUSTOM'
  repaymentType: RepaymentType;
  propertyType: PropertyType;
  startDate: string; // YYYY-MM
}

export interface BorrowerFinancials {
  monthlyGrossIncome: number; // SGD
  otherMonthlyCommitments: number; // SGD (car loans, student loans, other debt)
  regulatoryStressRate: number; // MAS mandated floor, default 4.00%
}

export interface AmortizationPeriod {
  period: number; // 1, 2, 3...
  year: number;
  month: number;
  dateStr: string;
  monthlyPayment: number;
  principalPayment: number;
  interestPayment: number;
  remainingBalance: number;
  cumulativeInterest: number;
  applicableRate: number;
}

export interface AnnualAmortizationSummary {
  year: number;
  startingBalance: number;
  totalPayment: number;
  totalPrincipal: number;
  totalInterest: number;
  endingBalance: number;
  effectiveRate: number;
}

export interface CalculationResult {
  allInRate: number; // Benchmark + Bank Margin
  benchmarkRate: number;
  bankMargin: number;
  monthlyPayment: number;
  totalInterest: number;
  totalPayment: number;
  stressMonthlyPayment: number;
  stressRate: number;
  tdsrRatio: number; // Total Debt Servicing Ratio (MAS cap: 55%)
  tdsrPassed: boolean;
  msrRatio: number | null; // Mortgage Servicing Ratio (MAS cap: 30% for HDB/EC)
  msrPassed: boolean | null;
  monthlySchedule: AmortizationPeriod[];
  annualSchedule: AnnualAmortizationSummary[];
}

export interface LoanPackageComparison {
  id: string;
  name: string;
  institution: string;
  rateType: '1M_SORA' | '3M_SORA' | 'FIXED_2Y' | 'FIXED_3Y' | 'CUSTOM';
  baseRate: number;
  spread: number;
  effectiveRate: number;
  lockInPeriodYears: number;
  monthlyPayment: number;
  interestOver3Years: number;
  totalInterest: number;
  tagline: string;
}

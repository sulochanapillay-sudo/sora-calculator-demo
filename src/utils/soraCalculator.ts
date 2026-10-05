import {
  AmortizationPeriod,
  AnnualAmortizationSummary,
  BorrowerFinancials,
  CalculationResult,
  LoanInputState,
  RepaymentType,
} from '../types/sora';

/**
 * Official MAS SORA Compounded Rate calculation formula using SORA Index:
 * Compounded SORA = [(SORA Index_end / SORA Index_start) - 1] * (365 / d) * 100%
 */
export function calculateCompoundedSoraFromIndices(
  indexStart: number,
  indexEnd: number,
  calendarDays: number
): number {
  if (calendarDays <= 0 || indexStart <= 0) return 0;
  const rateDecimal = (indexEnd / indexStart - 1) * (365 / calendarDays);
  return Number((rateDecimal * 100).toFixed(4));
}

/**
 * Calculate standard monthly installment using the standard Singapore amortization formula
 * or interest-only schedule.
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRatePct: number,
  tenureYears: number,
  repaymentType: RepaymentType
): number {
  if (principal <= 0 || tenureYears <= 0) return 0;
  const monthlyRate = annualRatePct / 100 / 12;
  const totalMonths = tenureYears * 12;

  if (repaymentType === 'interest_only') {
    return principal * monthlyRate;
  }

  if (monthlyRate === 0) {
    return principal / totalMonths;
  }

  const factor = Math.pow(1 + monthlyRate, totalMonths);
  const payment = principal * (monthlyRate * factor) / (factor - 1);
  return payment;
}

/**
 * Generates month-by-month amortization schedule and annual summaries.
 */
export function generateFullAmortizationSchedule(
  principal: number,
  annualRatePct: number,
  tenureYears: number,
  startDateStr: string,
  repaymentType: RepaymentType
): {
  monthlySchedule: AmortizationPeriod[];
  annualSchedule: AnnualAmortizationSummary[];
  totalInterest: number;
  totalPayment: number;
} {
  const monthlySchedule: AmortizationPeriod[] = [];
  const annualSchedule: AnnualAmortizationSummary[] = [];

  const totalMonths = tenureYears * 12;
  const monthlyPayment = calculateMonthlyPayment(principal, annualRatePct, tenureYears, repaymentType);
  const monthlyRate = annualRatePct / 100 / 12;

  let remainingBalance = principal;
  let cumulativeInterest = 0;

  const startYear = parseInt(startDateStr.split('-')[0]) || new Date().getFullYear();
  const startMonth = parseInt(startDateStr.split('-')[1]) || (new Date().getMonth() + 1);

  let currentYearPrincipal = 0;
  let currentYearInterest = 0;
  let currentYearStartingBal = principal;

  for (let m = 1; m <= totalMonths; m++) {
    const calendarMonthIndex = ((startMonth - 1 + (m - 1)) % 12) + 1;
    const calendarYear = startYear + Math.floor((startMonth - 1 + (m - 1)) / 12);
    const dateStr = `${calendarYear}-${String(calendarMonthIndex).padStart(2, '0')}`;

    let interestPayment = remainingBalance * monthlyRate;
    let principalPayment = monthlyPayment - interestPayment;

    if (repaymentType === 'interest_only') {
      principalPayment = 0;
      interestPayment = monthlyPayment;
    } else {
      if (m === totalMonths || principalPayment > remainingBalance) {
        principalPayment = remainingBalance;
      }
    }

    remainingBalance = Math.max(0, remainingBalance - principalPayment);
    cumulativeInterest += interestPayment;

    currentYearPrincipal += principalPayment;
    currentYearInterest += interestPayment;

    monthlySchedule.push({
      period: m,
      year: calendarYear,
      month: calendarMonthIndex,
      dateStr,
      monthlyPayment,
      principalPayment,
      interestPayment,
      remainingBalance,
      cumulativeInterest,
      applicableRate: annualRatePct,
    });

    // Check if end of year or final month
    if (calendarMonthIndex === 12 || m === totalMonths) {
      const yearNumber = Math.ceil(m / 12);
      annualSchedule.push({
        year: yearNumber,
        startingBalance: currentYearStartingBal,
        totalPayment: currentYearPrincipal + currentYearInterest,
        totalPrincipal: currentYearPrincipal,
        totalInterest: currentYearInterest,
        endingBalance: remainingBalance,
        effectiveRate: annualRatePct,
      });

      currentYearStartingBal = remainingBalance;
      currentYearPrincipal = 0;
      currentYearInterest = 0;
    }

    if (remainingBalance <= 0 && repaymentType !== 'interest_only') {
      break;
    }
  }

  const totalInterest = cumulativeInterest;
  const totalPayment = principal + totalInterest;

  return {
    monthlySchedule,
    annualSchedule,
    totalInterest,
    totalPayment,
  };
}

/**
 * Main evaluation coordinating inputs, benchmark lookups, stress testing, and debt servicing ratios.
 */
export function calculateSoraLoan(
  loanInputs: LoanInputState,
  currentBenchmarkRate: number,
  borrowerFinancials: BorrowerFinancials
): CalculationResult {
  const allInRate = Number((currentBenchmarkRate + loanInputs.bankMargin).toFixed(4));
  const monthlyPayment = calculateMonthlyPayment(
    loanInputs.loanAmount,
    allInRate,
    loanInputs.tenureYears,
    loanInputs.repaymentType
  );

  const { monthlySchedule, annualSchedule, totalInterest, totalPayment } = generateFullAmortizationSchedule(
    loanInputs.loanAmount,
    allInRate,
    loanInputs.tenureYears,
    loanInputs.startDate,
    loanInputs.repaymentType
  );

  // Regulatory Stress test (MAS requires 4.00% floor for residential property)
  const stressRate = Math.max(allInRate, borrowerFinancials.regulatoryStressRate);
  const stressMonthlyPayment = calculateMonthlyPayment(
    loanInputs.loanAmount,
    stressRate,
    loanInputs.tenureYears,
    'amortizing'
  );

  // TDSR calculation (MAS cap is 55%)
  const totalDebtObligations = borrowerFinancials.otherMonthlyCommitments + stressMonthlyPayment;
  const tdsrRatio = borrowerFinancials.monthlyGrossIncome > 0
    ? (totalDebtObligations / borrowerFinancials.monthlyGrossIncome) * 100
    : 0;
  const tdsrPassed = tdsrRatio <= 55;

  // MSR calculation (MAS cap is 30% for HDB and Executive Condominiums)
  let msrRatio: number | null = null;
  let msrPassed: boolean | null = null;

  if (loanInputs.propertyType === 'hdb') {
    msrRatio = borrowerFinancials.monthlyGrossIncome > 0
      ? (stressMonthlyPayment / borrowerFinancials.monthlyGrossIncome) * 100
      : 0;
    msrPassed = msrRatio <= 30;
  }

  return {
    allInRate,
    benchmarkRate: currentBenchmarkRate,
    bankMargin: loanInputs.bankMargin,
    monthlyPayment,
    totalInterest,
    totalPayment,
    stressMonthlyPayment,
    stressRate,
    tdsrRatio,
    tdsrPassed,
    msrRatio,
    msrPassed,
    monthlySchedule,
    annualSchedule,
  };
}

/**
 * Format SGD currency with standard Singapore comma grouping.
 */
export function formatSGD(amount: number, showDecimals = true): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);
}

/**
 * Format interest rates with specified precision.
 */
export function formatPercent(rate: number, decimals = 4): string {
  return `${rate.toFixed(decimals)}%`;
}

/**
 * Trigger browser download for Amortization Schedule CSV.
 */
export function exportScheduleToCSV(
  schedule: AmortizationPeriod[],
  loanInputs: LoanInputState,
  allInRate: number
): void {
  const headers = [
    'Period (Month)',
    'Date (YYYY-MM)',
    'Payment (SGD)',
    'Principal Paid (SGD)',
    'Interest Paid (SGD)',
    'Remaining Balance (SGD)',
    'Cumulative Interest (SGD)',
    'Interest Rate (%)',
  ];

  const rows = schedule.map((item) => [
    item.period,
    item.dateStr,
    item.monthlyPayment.toFixed(2),
    item.principalPayment.toFixed(2),
    item.interestPayment.toFixed(2),
    item.remainingBalance.toFixed(2),
    item.cumulativeInterest.toFixed(2),
    item.applicableRate.toFixed(4),
  ]);

  const metaHeader = [
    `# Singapore SORA Loan Amortization Schedule`,
    `# Loan Amount: SGD ${loanInputs.loanAmount.toLocaleString()}`,
    `# Tenure: ${loanInputs.tenureYears} Years`,
    `# Benchmark: ${loanInputs.benchmarkType}`,
    `# Bank Margin: ${loanInputs.bankMargin}%`,
    `# All-in Rate: ${allInRate}%`,
    `# Export Date: ${new Date().toISOString()}`,
    '',
  ].join('\n');

  const csvContent =
    metaHeader +
    headers.join(',') +
    '\n' +
    rows.map((row) => row.join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `SORA_Schedule_${loanInputs.loanAmount}_${loanInputs.tenureYears}Y.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

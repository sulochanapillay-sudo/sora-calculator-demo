import { MAS_SORA_HISTORICAL_DATA, LATEST_MAS_SORA } from '../data/masSoraData';
import { MasSoraDailyRecord } from '../types/sora';

const LOCAL_STORAGE_KEY = 'sg_sora_rates_cache_v1';
const CUSTOM_RATE_KEY = 'sg_sora_custom_record_v1';

export interface RateFeedStatus {
  source: 'mas_verified' | 'custom_override' | 'imported_csv' | 'mas_live_api';
  lastUpdated: string;
  isLive: boolean;
  message: string;
}

export class MasRateService {
  /**
   * Retrieves active rate records.
   * Checks localStorage for cached updates or user overrides, fallback to built-in verified MAS data.
   */
  public static getRates(): MasSoraDailyRecord[] {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Ignore localStorage errors
    }
    return MAS_SORA_HISTORICAL_DATA;
  }

  /**
   * Get latest active rate record.
   */
  public static getLatestRate(): MasSoraDailyRecord {
    const rates = this.getRates();
    return rates[0] || LATEST_MAS_SORA;
  }

  /**
   * Save a custom override or simulated rate update.
   */
  public static setCustomRate(record: MasSoraDailyRecord): void {
    try {
      const existing = this.getRates();
      const updated = [record, ...existing.filter((r) => r.date !== record.date)];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      localStorage.setItem(CUSTOM_RATE_KEY, JSON.stringify(record));
    } catch {
      // Storage unavailable
    }
  }

  /**
   * Reset to official MAS benchmark dataset.
   */
  public static resetToDefault(): void {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      localStorage.removeItem(CUSTOM_RATE_KEY);
    } catch {
      // Storage unavailable
    }
  }

  /**
   * Queries the serverless backend connection at /api/health to inspect Gateway status.
   */
  public static async checkHealth(): Promise<{
    status: string;
    keyConfigured: boolean;
    timestamp?: string;
  }> {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        return {
          status: data.status || 'ok',
          keyConfigured: Boolean(data?.masIntegration?.keyConfigured),
          timestamp: data.timestamp,
        };
      }
    } catch {
      // Offline / fallback
    }
    return { status: 'offline', keyConfigured: false };
  }

  /**
   * Fetches latest data via the serverless gateway (/api/sora) backed by official MAS endpoint:
   * https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily
   */
  public static async fetchLatestFromMAS(): Promise<{
    success: boolean;
    records: MasSoraDailyRecord[];
    message: string;
    keyMissing?: boolean;
  }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      // Call our serverless endpoint at project root level /api/sora
      const response = await fetch('/api/sora?limit=30', {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (response) {
        const json = await response.json().catch(() => null);

        if (response.status === 401 && json?.error === 'MAS_KEY_ID_NOT_CONFIGURED') {
          return {
            success: true,
            records: this.getRates(),
            keyMissing: true,
            message:
              'Serverless gateway active. MAS_KEY_ID not configured yet in environment (using benchmark dataset).',
          };
        }

        if (response.ok && json?.records && Array.isArray(json.records) && json.records.length > 0) {
          // Map normalized records into MasSoraDailyRecord
          const mappedRecords: MasSoraDailyRecord[] = json.records
            .filter((r: { date?: string }) => Boolean(r.date))
            .map((r: {
              date: string;
              sora?: number | null;
              soraIndex?: number | null;
              comp1m?: number | null;
              comp3m?: number | null;
              comp6m?: number | null;
              volumeMillionSGD?: number | null;
            }) => {
              const soraVal = r.sora ?? 2.89;
              return {
                date: r.date,
                sora: soraVal,
                soraIndex: r.soraIndex ?? 1.164,
                comp1m: r.comp1m ?? soraVal,
                comp3m: r.comp3m ?? soraVal + 0.05,
                comp6m: r.comp6m ?? soraVal + 0.1,
                volumeMillionSGD: r.volumeMillionSGD ?? 4000,
                lowRate: soraVal - 0.05,
                highRate: soraVal + 0.05,
              };
            });

          if (mappedRecords.length > 0) {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mappedRecords));
            return {
              success: true,
              records: mappedRecords,
              message: `Live MAS data synchronized (${mappedRecords.length} records fetched).`,
            };
          }
        }
      }
    } catch {
      // Network failure
    }

    return {
      success: true,
      records: this.getRates(),
      message: 'MAS benchmark rate series active (Published 9:00 AM SGT preceding business day).',
    };
  }

  /**
   * Parse user-uploaded CSV with daily rates:
   * Format: Date, SORA, SORA_Index, 1M_Comp, 3M_Comp, 6M_Comp
   */
  public static parseCsvRates(csvText: string): MasSoraDailyRecord[] {
    const lines = csvText.trim().split('\n');
    const records: MasSoraDailyRecord[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length >= 2) {
        const date = parts[0];
        const sora = parseFloat(parts[1]) || 0;
        const soraIndex = parseFloat(parts[2]) || 1.15;
        const comp1m = parseFloat(parts[3]) || sora;
        const comp3m = parseFloat(parts[4]) || sora;
        const comp6m = parseFloat(parts[5]) || sora;

        records.push({
          date,
          sora,
          soraIndex,
          comp1m,
          comp3m,
          comp6m,
          volumeMillionSGD: 4000,
          lowRate: sora - 0.05,
          highRate: sora + 0.05,
        });
      }
    }

    return records.sort((a, b) => (b.date > a.date ? 1 : -1));
  }
}

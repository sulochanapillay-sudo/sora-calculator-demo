import type { Request, Response } from 'express';

const MAS_SORA_ENDPOINT =
  'https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily';

export interface MasNormalizedRecord {
  date: string;
  sora: number | null;
  soraIndex: number | null;
  comp1m: number | null;
  comp3m: number | null;
  comp6m: number | null;
  volumeMillionSGD?: number | null;
  raw?: Record<string, unknown>;
}

/**
 * Serverless handler pulling MAS SORA Daily & Compounded Rates
 * Route: /api/sora
 * Method: GET
 */
export default async function handler(req: Request, res: Response) {
  // Set CORS and JSON headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, KeyId');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const masKeyId =
    process.env.MAS_KEY_ID ||
    process.env.MAS_API_KEY ||
    (req.headers['keyid'] as string) ||
    '';

  if (!masKeyId) {
    return res.status(401).json({
      error: 'MAS_KEY_ID_NOT_CONFIGURED',
      message:
        'Missing MAS API Key. Please configure MAS_KEY_ID in your environment variables (.env) or pass KeyId header.',
      endpoint: MAS_SORA_ENDPOINT,
    });
  }

  try {
    // Forward any query parameters (limit, sort, start_date, end_date)
    const url = new URL(MAS_SORA_ENDPOINT);
    const query = req.query as Record<string, string>;

    // Default limit to 30 days if not provided
    if (!query.limit) {
      url.searchParams.set('limit', '30');
    }

    Object.entries(query).forEach(([key, val]) => {
      if (typeof val === 'string' && val.trim()) {
        url.searchParams.set(key, val);
      }
    });

    const masResponse = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        KeyId: masKeyId,
        Accept: 'application/json',
        'User-Agent': 'SORA-Calculator-Engine/1.0',
      },
    });

    if (!masResponse.ok) {
      const errorText = await masResponse.text();
      return res.status(masResponse.status).json({
        error: 'MAS_UPSTREAM_ERROR',
        status: masResponse.status,
        statusText: masResponse.statusText,
        details: errorText,
      });
    }

    const data = await masResponse.json();

    // MAS API returns records inside result.records or root records
    const rawRecords: Array<Record<string, unknown>> =
      data?.result?.records || data?.records || (Array.isArray(data) ? data : []);

    const normalizedRecords: MasNormalizedRecord[] = rawRecords.map((item) => {
      // MAS field naming mappings:
      // end_of_day, sora, sora_index, comp_sora_1m, comp_sora_3m, comp_sora_6m, aggregate_volume
      const date =
        (item.end_of_day as string) ||
        (item.date as string) ||
        (item.Date as string) ||
        '';

      const parseNum = (val: unknown): number | null => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
          const parsed = parseFloat(val);
          return isNaN(parsed) ? null : parsed;
        }
        return null;
      };

      const sora = parseNum(item.sora || item.sora_rate || item.SORA);
      const soraIndex = parseNum(item.sora_index || item.soraIndex || item.SORA_INDEX);
      const comp1m = parseNum(item.comp_sora_1m || item.comp1m || item.soracomp1m);
      const comp3m = parseNum(item.comp_sora_3m || item.comp3m || item.soracomp3m);
      const comp6m = parseNum(item.comp_sora_6m || item.comp6m || item.soracomp6m);
      const volume = parseNum(item.aggregate_volume || item.volume || item.volume_mil);

      return {
        date,
        sora,
        soraIndex,
        comp1m,
        comp3m,
        comp6m,
        volumeMillionSGD: volume,
        raw: item,
      };
    });

    return res.status(200).json({
      status: 'success',
      source: 'Monetary Authority of Singapore (MAS)',
      totalRecords: normalizedRecords.length,
      records: normalizedRecords,
      rawResponse: data,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown upstream error';
    return res.status(502).json({
      error: 'MAS_GATEWAY_TIMEOUT_OR_FAILURE',
      message,
    });
  }
}

import type { Request, Response } from 'express';

/**
 * Health check endpoint for SORA MAS API integration.
 * Method: GET
 * Route: /api/health
 */
export default async function handler(req: Request, res: Response) {
  const masKeyConfigured = Boolean(process.env.MAS_KEY_ID || process.env.MAS_API_KEY);

  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({
    status: 'ok',
    service: 'MAS SORA Gateway',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    masIntegration: {
      keyConfigured: masKeyConfigured,
      endpoint:
        'https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily',
    },
  });
}

/**
 * Vercel Serverless Function: /api/stats
 */

const SEED_DATA = require('../server/seeds/seed_data.json');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const total = SEED_DATA.length;
  const returned = SEED_DATA.filter(i => i.status === 3).length;
  const inReview = SEED_DATA.filter(i => i.status === 1 || i.status === 2).length;
  const rate = total > 0 ? Math.round(((returned + inReview) / total) * 100) : 95;

  return res.status(200).json({
    totalItems: total,
    safelyReturned: returned,
    underReview: inReview,
    resolutionRate: `${rate}%`,
    lastUpdated: new Date().toISOString()
  });
};

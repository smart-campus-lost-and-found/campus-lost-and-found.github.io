/**
 * Vercel Serverless Function: /api/items
 */

const SEED_DATA = require('../server/seeds/seed_data.json');

// In-memory cache for serverless environment
let itemsCache = [...SEED_DATA];

module.exports = (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // GET: Query items
  if (req.method === 'GET') {
    const { search, category, type, location, status } = req.query || {};
    let filtered = itemsCache;

    if (search) {
      const q = String(search).toLowerCase().trim();
      filtered = filtered.filter(item => {
        const searchable = [
          item.title,
          item.description,
          item.location,
          item.id,
          item.campusBlock,
          item.category
        ].join(' ').toLowerCase();
        return searchable.includes(q);
      });
    }

    if (category && category !== 'all') {
      filtered = filtered.filter(item => item.category === category);
    }

    if (type && type !== 'all') {
      filtered = filtered.filter(item => item.type === type);
    }

    if (location && location !== 'all') {
      filtered = filtered.filter(item => item.location === location || item.campusBlock === location);
    }

    if (status !== undefined && status !== 'all') {
      filtered = filtered.filter(item => String(item.status) === String(status));
    }

    return res.status(200).json({
      count: filtered.length,
      total: itemsCache.length,
      items: filtered
    });
  }

  // POST: Create report
  if (req.method === 'POST') {
    const body = req.body || {};
    if (!body.title || !body.location || !body.contact) {
      return res.status(400).json({ error: 'Missing mandatory fields' });
    }

    const year = new Date().getFullYear();
    const count = itemsCache.length + 1001;
    const newId = `CU-LF-${year}-${count}`;

    const newItem = {
      id: newId,
      type: body.type === 'lost' ? 'lost' : 'found',
      title: body.title.trim(),
      category: body.category || 'other',
      location: body.location.trim(),
      campusBlock: body.campusBlock || body.location.split(' - ')[0] || 'Campus General',
      date: body.date || new Date().toISOString().split('T')[0],
      time: body.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      description: body.description ? body.description.trim() : 'No public description added.',
      privateIdentifier: body.privateIdentifier ? body.privateIdentifier.trim() : 'Verify with Student Smart Card',
      custodianDesk: body.type === 'found' ? `${body.location} Security Booth` : 'DSW Central Lost & Found Desk',
      reportingPerson: body.reportingPerson || 'Campus Student',
      contact: body.contact.trim(),
      status: 0,
      imageUrl: body.imageUrl || '',
      claim: null
    };

    itemsCache.unshift(newItem);
    return res.status(201).json({ success: true, item: newItem });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

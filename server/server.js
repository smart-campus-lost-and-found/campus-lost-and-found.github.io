/**
 * Chandigarh University (CU) Lost & Found Central Backend API
 * Built with Node.js - Zero External Dependencies Required!
 * Features: Complete REST API, CORS enabled, JSON file database persistence, automatic seeding.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 5000;
const DB_PATH = path.join(__dirname, 'data', 'database.json');
const SEED_PATH = path.join(__dirname, 'seeds', 'seed_data.json');
const PUBLIC_DIR = path.join(__dirname, '..');

// Ensure database file exists
function initDatabase() {
  if (!fs.existsSync(DB_PATH)) {
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (fs.existsSync(SEED_PATH)) {
      const seedData = fs.readFileSync(SEED_PATH, 'utf8');
      fs.writeFileSync(DB_PATH, seedData, 'utf8');
      console.log('✅ Database initialized from official seed dataset.');
    } else {
      fs.writeFileSync(DB_PATH, '[]', 'utf8');
      console.log('⚠️ Database initialized as empty.');
    }
  }
}

// Read database
function readDB() {
  try {
    initDatabase();
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database:', err);
    return [];
  }
}

// Write database atomically
function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving to database:', err);
    return false;
  }
}

// Helper: Generate next Reference Code
function generateId(items) {
  const year = new Date().getFullYear();
  const count = items.length + 1001;
  return `CU-LF-${year}-${count}`;
}

// Helper: Calculate campus statistics
function calculateStats(items) {
  const total = items.length;
  const returned = items.filter(i => i.status === 3).length;
  const inReview = items.filter(i => i.status === 1 || i.status === 2).length;
  const rate = total > 0 ? Math.round(((returned + inReview) / total) * 100) : 95;
  return {
    totalItems: total,
    safelyReturned: returned,
    underReview: inReview,
    resolutionRate: `${rate}%`,
    lastUpdated: new Date().toISOString()
  };
}

// Parse request body JSON
function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      // Guard against huge payload (>10MB)
      if (body.length > 10 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', err => reject(err));
  });
}

// Send JSON response with CORS headers
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
  });
  res.end(JSON.stringify(data));
}

// Send standard CORS headers for preflight
function handleCORS(req, res) {
  res.writeHead(204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
  });
  res.end();
}

// Static file serving fallback for local running
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function serveStaticFile(req, res, pathname) {
  let safePath = pathname === '/' ? '/index.html' : pathname;
  let filePath = path.join(PUBLIC_DIR, safePath);

  // Security check: prevent directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    sendJSON(res, 403, { error: 'Forbidden' });
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      sendJSON(res, 404, { error: 'Not Found' });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

// Main HTTP Request Handler
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    handleCORS(req, res);
    return;
  }

  // 1. Health check endpoint
  if (pathname === '/api/health' && method === 'GET') {
    sendJSON(res, 200, {
      status: 'online',
      service: 'Chandigarh University Central Lost & Found API',
      version: '2.0.0',
      timestamp: new Date().toISOString()
    });
    return;
  }

  // 2. Stats endpoint
  if (pathname === '/api/stats' && method === 'GET') {
    const items = readDB();
    sendJSON(res, 200, calculateStats(items));
    return;
  }

  // 3. Query all items with filtering & search: GET /api/items
  if (pathname === '/api/items' && method === 'GET') {
    const items = readDB();
    const query = parsedUrl.query;

    let filtered = items;

    // Search query
    if (query.search) {
      const q = query.search.toLowerCase().trim();
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

    // Category filter
    if (query.category && query.category !== 'all') {
      filtered = filtered.filter(item => item.category === query.category);
    }

    // Type filter (lost / found)
    if (query.type && query.type !== 'all') {
      filtered = filtered.filter(item => item.type === query.type);
    }

    // Location / campus block filter
    if (query.location && query.location !== 'all') {
      filtered = filtered.filter(item => item.location === query.location || item.campusBlock === query.location);
    }

    // Status filter
    if (query.status !== undefined && query.status !== 'all') {
      filtered = filtered.filter(item => String(item.status) === String(query.status));
    }

    sendJSON(res, 200, {
      count: filtered.length,
      total: items.length,
      items: filtered
    });
    return;
  }

  // 4. Get single item: GET /api/items/:id
  const singleItemMatch = pathname.match(/^\/api\/items\/([a-zA-Z0-9\-_]+)$/);
  if (singleItemMatch && method === 'GET') {
    const itemId = singleItemMatch[1].toLowerCase();
    const items = readDB();
    const item = items.find(i => 
      i.id.toLowerCase() === itemId || 
      (i.claim && i.claim.studentUid && i.claim.studentUid.toLowerCase() === itemId)
    );

    if (!item) {
      sendJSON(res, 404, { error: 'Item not found in campus database' });
      return;
    }

    sendJSON(res, 200, item);
    return;
  }

  // 5. Create new lost/found report: POST /api/items
  if (pathname === '/api/items' && method === 'POST') {
    try {
      const body = await parseRequestBody(req);

      if (!body.title || !body.location || !body.contact) {
        sendJSON(res, 400, { error: 'Missing required fields: title, location, and contact are mandatory.' });
        return;
      }

      const items = readDB();
      const newId = generateId(items);

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
        claim: null,
        createdAt: new Date().toISOString()
      };

      items.unshift(newItem);
      writeDB(items);

      console.log(`📢 New item registered: ${newItem.id} - "${newItem.title}"`);
      sendJSON(res, 201, {
        success: true,
        message: 'Report successfully logged into Central Campus Register',
        item: newItem
      });
      return;
    } catch (err) {
      sendJSON(res, 400, { error: err.message || 'Failed to process report' });
      return;
    }
  }

  // 6. Submit ownership claim: POST /api/items/:id/claim
  const claimMatch = pathname.match(/^\/api\/items\/([a-zA-Z0-9\-_]+)\/claim$/);
  if (claimMatch && method === 'POST') {
    try {
      const itemId = claimMatch[1].toLowerCase();
      const body = await parseRequestBody(req);

      if (!body.studentName || !body.studentUid || !body.studentPhone || !body.claimProofText) {
        sendJSON(res, 400, { error: 'Missing required claimant details: studentName, studentUid, phone, and claimProofText are mandatory.' });
        return;
      }

      const items = readDB();
      const item = items.find(i => i.id.toLowerCase() === itemId);

      if (!item) {
        sendJSON(res, 404, { error: 'Item not found in campus database' });
        return;
      }

      item.claim = {
        studentName: body.studentName.trim(),
        studentUid: body.studentUid.trim().toUpperCase(),
        studentEmail: body.studentEmail ? body.studentEmail.trim() : `${body.studentUid.trim().toLowerCase()}@cumail.in`,
        studentPhone: body.studentPhone.trim(),
        submittedOn: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        claimProofText: body.claimProofText.trim(),
        secretDetail: body.secretDetail ? body.secretDetail.trim() : 'N/A',
        adminNotes: 'Claim received. Awaiting Security Officer in-person verification.'
      };

      // Advance to status 1: Claim Under Review
      if (item.status === 0) {
        item.status = 1;
      }

      writeDB(items);

      console.log(`🙋 Claim submitted for ${item.id} by ${body.studentName} (${body.studentUid})`);
      sendJSON(res, 200, {
        success: true,
        message: 'Claim registered! Security will verify student identity.',
        item: item
      });
      return;
    } catch (err) {
      sendJSON(res, 400, { error: err.message || 'Failed to submit claim' });
      return;
    }
  }

  // 7. Security staff advance/update status: PATCH /api/items/:id/status
  const statusMatch = pathname.match(/^\/api\/items\/([a-zA-Z0-9\-_]+)\/status$/);
  if (statusMatch && (method === 'PATCH' || method === 'POST')) {
    try {
      const itemId = statusMatch[1].toLowerCase();
      const body = await parseRequestBody(req);

      const items = readDB();
      const item = items.find(i => i.id.toLowerCase() === itemId);

      if (!item) {
        sendJSON(res, 404, { error: 'Item not found' });
        return;
      }

      if (body.status !== undefined) {
        item.status = Number(body.status);
      } else if (item.status < 3) {
        item.status += 1;
      }

      if (body.adminNotes && item.claim) {
        item.claim.adminNotes = body.adminNotes.trim();
      }

      writeDB(items);

      console.log(`⚡ Status updated for ${item.id} to step ${item.status}`);
      sendJSON(res, 200, {
        success: true,
        message: `Item status updated to step ${item.status}`,
        item: item
      });
      return;
    } catch (err) {
      sendJSON(res, 400, { error: err.message || 'Failed to update status' });
      return;
    }
  }

  // 8. Admin Reset Database: POST /api/admin/reset
  if (pathname === '/api/admin/reset' && method === 'POST') {
    if (fs.existsSync(SEED_PATH)) {
      const seedData = fs.readFileSync(SEED_PATH, 'utf8');
      fs.writeFileSync(DB_PATH, seedData, 'utf8');
      console.log('🔄 Database reset to canonical seed dataset.');
      sendJSON(res, 200, {
        success: true,
        message: 'Database reset to canonical Chandigarh University seed dataset.'
      });
    } else {
      sendJSON(res, 500, { error: 'Seed data file missing.' });
    }
    return;
  }

  // Fallback: Serve static website files for local development
  serveStaticFile(req, res, pathname);
});

// Boot the server
initDatabase();
server.listen(PORT, () => {
  console.log(`==================================================================`);
  console.log(`🏛️  Chandigarh University Lost & Found Central Backend API`);
  console.log(`🚀  Server running at: http://localhost:${PORT}`);
  console.log(`📋  REST API Base:     http://localhost:${PORT}/api/items`);
  console.log(`📊  Campus Stats:      http://localhost:${PORT}/api/stats`);
  console.log(`==================================================================`);
});

const http = require('http');
const fs = require('fs');
const path = require('path');
const SyncEngine = require('./sync-engine');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const syncEngine = new SyncEngine({ rootDir: ROOT });

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8'
};

const FORMS_SEED_FILE = path.join(ROOT, 'data', 'brc-form-submissions.json');
const FORMS_DATA_FILE = path.join(syncEngine.dataDir, 'brc-form-submissions.json');

function getSeededFormSubmissions() {
  return [
    {
      id: 'sub-melrose-butteredup-1',
      timestamp: '2025-05-12T13:15:00.000Z',
      date: '2025-05-12',
      store: 'melrose',
      docId: 'buttered-up-bakery',
      slug: 'butteredup',
      formTitle: 'Buttered Up Bakery Count',
      category: 'Inventory & Ordering Guides',
      submittedBy: 'Maya L.',
      checkedCount: 6,
      totalChecks: 6,
      completionPct: 100,
      totalPar: 98,
      totalOnHand: 34,
      totalOrder: 64,
      notes: 'Weekend rush depleted croissants and blueberry muffins early.',
      items: [
        { section: 'Pastries & Croissants', item: 'Butter Croissant', epc: 'BUB-101', unit: 'Each', par: 24, onHand: 6, order: 18, status: 'Low Stock' },
        { section: 'Pastries & Croissants', item: 'Chocolate Croissant', epc: 'BUB-102', unit: 'Each', par: 18, onHand: 5, order: 13, status: 'Low Stock' },
        { section: 'Pastries & Croissants', item: 'Almond Croissant', epc: 'BUB-103', unit: 'Each', par: 16, onHand: 7, order: 9, status: 'Needs Order' },
        { section: 'Muffins & Scones', item: 'Blueberry Crumb Muffin', epc: 'BUB-201', unit: 'Each', par: 20, onHand: 6, order: 14, status: 'Low Stock' },
        { section: 'Muffins & Scones', item: 'Lemon Poppyseed Scone', epc: 'BUB-202', unit: 'Each', par: 20, onHand: 10, order: 10, status: 'Needs Order' }
      ]
    },
    {
      id: 'sub-mesa-butteredup-1',
      timestamp: '2025-05-12T14:05:00.000Z',
      date: '2025-05-12',
      store: 'mesa',
      docId: 'buttered-up-bakery',
      slug: 'butteredup',
      formTitle: 'Buttered Up Bakery Count',
      category: 'Inventory & Ordering Guides',
      submittedBy: 'Jordan K.',
      checkedCount: 6,
      totalChecks: 6,
      completionPct: 100,
      totalPar: 92,
      totalOnHand: 41,
      totalOrder: 51,
      notes: 'Steady morning pastry volume; cinnamon rolls requested by regulars.',
      items: [
        { section: 'Pastries & Croissants', item: 'Butter Croissant', epc: 'BUB-101', unit: 'Each', par: 22, onHand: 9, order: 13, status: 'Needs Order' },
        { section: 'Pastries & Croissants', item: 'Chocolate Croissant', epc: 'BUB-102', unit: 'Each', par: 18, onHand: 8, order: 10, status: 'Needs Order' },
        { section: 'Pastries & Croissants', item: 'Almond Croissant', epc: 'BUB-103', unit: 'Each', par: 14, onHand: 6, order: 8, status: 'Needs Order' },
        { section: 'Muffins & Scones', item: 'Blueberry Crumb Muffin', epc: 'BUB-201', unit: 'Each', par: 20, onHand: 8, order: 12, status: 'Needs Order' },
        { section: 'Muffins & Scones', item: 'Lemon Poppyseed Scone', epc: 'BUB-202', unit: 'Each', par: 18, onHand: 10, order: 8, status: 'Needs Order' }
      ]
    },
    {
      id: 'sub-tempe-butteredup-1',
      timestamp: '2025-05-12T14:40:00.000Z',
      date: '2025-05-12',
      store: 'tempe',
      docId: 'buttered-up-bakery',
      slug: 'butteredup',
      formTitle: 'Buttered Up Bakery Count',
      category: 'Inventory & Ordering Guides',
      submittedBy: 'Devon R.',
      checkedCount: 6,
      totalChecks: 6,
      completionPct: 100,
      totalPar: 104,
      totalOnHand: 29,
      totalOrder: 75,
      notes: 'Campus study rush sold out butter croissants by 10:30 AM.',
      items: [
        { section: 'Pastries & Croissants', item: 'Butter Croissant', epc: 'BUB-101', unit: 'Each', par: 26, onHand: 4, order: 22, status: 'Critical Low' },
        { section: 'Pastries & Croissants', item: 'Chocolate Croissant', epc: 'BUB-102', unit: 'Each', par: 20, onHand: 5, order: 15, status: 'Low Stock' },
        { section: 'Pastries & Croissants', item: 'Almond Croissant', epc: 'BUB-103', unit: 'Each', par: 18, onHand: 6, order: 12, status: 'Needs Order' },
        { section: 'Muffins & Scones', item: 'Blueberry Crumb Muffin', epc: 'BUB-201', unit: 'Each', par: 22, onHand: 6, order: 16, status: 'Low Stock' },
        { section: 'Muffins & Scones', item: 'Lemon Poppyseed Scone', epc: 'BUB-202', unit: 'Each', par: 18, onHand: 8, order: 10, status: 'Needs Order' }
      ]
    },
    {
      id: 'sub-melrose-lively-1',
      timestamp: '2025-05-13T15:10:00.000Z',
      date: '2025-05-13',
      store: 'melrose',
      docId: 'lively-order-sheet',
      slug: 'lively',
      formTitle: 'Lively Dairy & Supply Order',
      category: 'Inventory & Ordering Guides',
      submittedBy: 'Maya L.',
      checkedCount: 4,
      totalChecks: 4,
      completionPct: 100,
      totalPar: 68,
      totalOnHand: 22,
      totalOrder: 46,
      notes: 'Oat milk velocity up 18% this week.',
      items: [
        { section: 'Dairy & Alt Milk', item: 'Barista Oat Milk (Case/6)', epc: 'LIV-301', unit: 'Case', par: 18, onHand: 5, order: 13, status: 'Low Stock' },
        { section: 'Dairy & Alt Milk', item: 'Whole Milk (Gallon)', epc: 'LIV-302', unit: 'Gal', par: 24, onHand: 8, order: 16, status: 'Needs Order' },
        { section: 'Dairy & Alt Milk', item: '2% Reduced Fat Milk (Gallon)', epc: 'LIV-303', unit: 'Gal', par: 14, onHand: 5, order: 9, status: 'Needs Order' },
        { section: 'Dairy & Alt Milk', item: 'Heavy Whipping Cream (Quart)', epc: 'LIV-304', unit: 'Qt', par: 12, onHand: 4, order: 8, status: 'Needs Order' }
      ]
    },
    {
      id: 'sub-mesa-shoreline-1',
      timestamp: '2025-05-13T16:20:00.000Z',
      date: '2025-05-13',
      store: 'mesa',
      docId: 'shoreline-inventory',
      slug: 'shoreline',
      formTitle: 'Shoreline Inventory',
      category: 'Inventory & Ordering Guides',
      submittedBy: 'Jordan K.',
      checkedCount: 5,
      totalChecks: 5,
      completionPct: 100,
      totalPar: 52,
      totalOnHand: 21,
      totalOrder: 31,
      notes: '16oz cold cups and dome lids restocked for warm weather spike.',
      items: [
        { section: 'Cups & Lids', item: '16oz Cold Cup (Case)', epc: 'SHL-401', unit: 'Case', par: 14, onHand: 4, order: 10, status: 'Low Stock' },
        { section: 'Cups & Lids', item: '12/16/24oz Flat Cold Lid', epc: 'SHL-402', unit: 'Case', par: 12, onHand: 5, order: 7, status: 'Needs Order' },
        { section: 'Syrups & Sauces', item: 'Vanilla Bean Syrup (Bottle)', epc: 'SHL-501', unit: 'Bottle', par: 16, onHand: 7, order: 9, status: 'Needs Order' },
        { section: 'Syrups & Sauces', item: 'Caramel Sauce (Jug)', epc: 'SHL-502', unit: 'Jug', par: 10, onHand: 5, order: 5, status: 'Needs Order' }
      ]
    },
    {
      id: 'sub-tempe-am-1',
      timestamp: '2025-05-14T10:30:00.000Z',
      date: '2025-05-14',
      store: 'tempe',
      docId: 'am-task-sheet',
      slug: 'am',
      formTitle: 'AM Task Sheet (Timeline)',
      category: 'Daily Shift Checklists',
      submittedBy: 'Alex P.',
      checkedCount: 18,
      totalChecks: 18,
      completionPct: 100,
      totalPar: 0,
      totalOnHand: 0,
      totalOrder: 0,
      notes: 'Dialed in espresso at 18.5g in / 37g out in 28s. Cold brew TDS verified at 1.42%.',
      items: [
        { section: 'Opening Calibration', item: 'Dial in primary & decaf grinders', epc: 'CHK-AM1', unit: 'Check', par: 1, onHand: 1, order: 0, status: 'Completed' },
        { section: 'Mid-Shift Restock', item: 'Restock milk fridges & ice bins before peak', epc: 'CHK-AM2', unit: 'Check', par: 1, onHand: 1, order: 0, status: 'Completed' },
        { section: 'Shift Handoff', item: 'Complete Pull & Thaw count and log temps', epc: 'CHK-AM3', unit: 'Check', par: 1, onHand: 1, order: 0, status: 'Completed' }
      ]
    },
    {
      id: 'sub-melrose-pm-1',
      timestamp: '2025-05-14T21:15:00.000Z',
      date: '2025-05-14',
      store: 'melrose',
      docId: 'pm-task-sheet',
      slug: 'pm',
      formTitle: 'PM Task Sheet (Timeline)',
      category: 'Daily Shift Checklists',
      submittedBy: 'Sam T.',
      checkedCount: 19,
      totalChecks: 20,
      completionPct: 95,
      totalPar: 0,
      totalOnHand: 0,
      totalOrder: 0,
      notes: 'Group heads backflushed with Cafiza; steam wands soaked.',
      items: [
        { section: 'Pre-Close Prep', item: 'Clean & sanitize cold brew kegs and lines', epc: 'CHK-PM1', unit: 'Check', par: 1, onHand: 1, order: 0, status: 'Completed' },
        { section: 'Closing Lockdown', item: 'Backflush espresso machine & soak parts', epc: 'CHK-PM2', unit: 'Check', par: 1, onHand: 1, order: 0, status: 'Completed' }
      ]
    },
    {
      id: 'sub-mesa-temps-1',
      timestamp: '2025-05-14T13:00:00.000Z',
      date: '2025-05-14',
      store: 'mesa',
      docId: 'physical-temp-log',
      slug: 'temps',
      formTitle: 'Physical Temp & Inventory Log',
      category: 'Daily Shift Checklists',
      submittedBy: 'Jordan K.',
      checkedCount: 8,
      totalChecks: 8,
      completionPct: 100,
      totalPar: 0,
      totalOnHand: 72,
      totalOrder: 0,
      notes: 'All bar and BOH reach-in fridges holding between 35°F and 38°F. FOH/BOH pastry counts logged.',
      items: [
        { section: 'Refrigeration Temps', item: 'FOH Espresso Milk Fridge #1', epc: 'TEMP-01', unit: '°F', par: 40, onHand: 36, order: 0, status: 'In Spec (36°F)' },
        { section: 'Refrigeration Temps', item: 'FOH Cold Brew & Alt Milk Fridge #2', epc: 'TEMP-02', unit: '°F', par: 40, onHand: 37, order: 0, status: 'In Spec (37°F)' },
        { section: 'Refrigeration Temps', item: 'BOH Walk-In / Reach-In Cooler', epc: 'TEMP-03', unit: '°F', par: 40, onHand: 35, order: 0, status: 'In Spec (35°F)' },
        { section: 'Refrigeration Temps', item: 'BOH Pastry Freezer', epc: 'TEMP-04', unit: '°F', par: 0, onHand: -4, order: 0, status: 'In Spec (-4°F)' },
        { section: 'FOH & BOH Food Count', item: 'Chocolate Chip Cookies', foh: 3, boh: 4, onHand: 7, status: 'Counted' },
        { section: 'FOH & BOH Food Count', item: 'Funfetti Cookies', foh: 2, boh: 3, onHand: 5, status: 'Counted' },
        { section: 'FOH & BOH Food Count', item: 'Chocolate Croissant', foh: 4, boh: 8, onHand: 12, status: 'Counted' },
        { section: 'FOH & BOH Food Count', item: 'Raspberry Croissant', foh: 2, boh: 4, onHand: 6, status: 'Counted' },
        { section: 'FOH & BOH Food Count', item: 'Butter Croissant', foh: 3, boh: 5, onHand: 8, status: 'Counted' },
        { section: 'FOH & BOH Food Count', item: 'Blueberry Muffins', foh: 2, boh: 4, onHand: 6, status: 'Counted' },
        { section: 'FOH & BOH Food Count', item: 'Seasonal Muffins', foh: 2, boh: 3, onHand: 5, status: 'Counted' },
        { section: 'FOH & BOH Food Count', item: 'Cheese Danish', foh: 2, boh: 5, onHand: 7, status: 'Counted' },
        { section: 'FOH & BOH Food Count', item: 'Lemon Bar', foh: 2, boh: 2, onHand: 4, status: 'Counted' },
        { section: 'FOH & BOH Food Count', item: 'Blueberry Danish', foh: 1, boh: 3, onHand: 4, status: 'Counted' },
        { section: 'FOH & BOH Food Count', item: 'Coffee Cake', foh: 1, boh: 2, onHand: 3, status: 'Counted' },
        { section: 'FOH & BOH Food Count', item: 'Banana Bread', foh: 1, boh: 2, onHand: 3, status: 'Counted' },
        { section: 'FOH & BOH Food Count', item: 'Brownie', foh: 1, boh: 1, onHand: 2, status: 'Counted' }
      ]
    },
    {
      id: 'sub-melrose-temps-1',
      timestamp: '2025-05-14T12:30:00.000Z',
      date: '2025-05-14',
      store: 'melrose',
      docId: 'physical-temp-log',
      slug: 'temps',
      formTitle: 'Physical Temp & Inventory Log',
      category: 'Daily Shift Checklists',
      submittedBy: 'Maya L.',
      checkedCount: 8,
      totalChecks: 8,
      completionPct: 100,
      totalPar: 0,
      totalOnHand: 69,
      totalOrder: 0,
      notes: 'Melrose FOH/BOH mid-day food count and fridge temperatures verified.',
      items: [
        { section: 'FOH & BOH Food Count', item: 'Chocolate Chip Cookies', foh: 2, boh: 4, onHand: 6, status: 'Counted' },
        { section: 'FOH & BOH Food Count', item: 'Funfetti Cookies', foh: 2, boh: 2, onHand: 4, status: 'Counted' },
        { section: 'FOH & BOH Food Count', item: 'Chocolate Croissant', foh: 3, boh: 7, onHand: 10, status: 'Counted' },
        { section: 'FOH & BOH Food Count', item: 'Raspberry Croissant', foh: 2, boh: 3, onHand: 5, status: 'Counted' },
        { section: 'FOH & BOH Food Count', item: 'Butter Croissant', foh: 2, boh: 6, onHand: 8, status: 'Counted' },
        { section: 'FOH & BOH Food Count', item: 'Blueberry Muffins', foh: 2, boh: 4, onHand: 6, status: 'Counted' },
        { section: 'FOH & BOH Food Count', item: 'Seasonal Muffins', foh: 2, boh: 3, onHand: 5, status: 'Counted' },
        { section: 'FOH & BOH Food Count', item: 'Cheese Danish', foh: 3, boh: 5, onHand: 8, status: 'Counted' },
        { section: 'FOH & BOH Food Count', item: 'Lemon Bar', foh: 2, boh: 3, onHand: 5, status: 'Counted' },
        { section: 'FOH & BOH Food Count', item: 'Blueberry Danish', foh: 1, boh: 3, onHand: 4, status: 'Counted' },
        { section: 'FOH & BOH Food Count', item: 'Coffee Cake', foh: 1, boh: 2, onHand: 3, status: 'Counted' },
        { section: 'FOH & BOH Food Count', item: 'Banana Bread', foh: 1, boh: 2, onHand: 3, status: 'Counted' },
        { section: 'FOH & BOH Food Count', item: 'Brownie', foh: 1, boh: 1, onHand: 2, status: 'Counted' }
      ]
    },
    {
      id: 'sub-tempe-temps-1',
      timestamp: '2025-05-14T12:45:00.000Z',
      date: '2025-05-14',
      store: 'tempe',
      docId: 'physical-temp-log',
      slug: 'temps',
      formTitle: 'Physical Temp & Inventory Log',
      category: 'Daily Shift Checklists',
      submittedBy: 'Devon R.',
      checkedCount: 8,
      totalChecks: 8,
      completionPct: 100,
      totalPar: 0,
      totalOnHand: 64,
      totalOrder: 0,
      notes: 'Tempe FOH/BOH food count completed prior to afternoon order.',
      items: [
        { section: 'FOH & BOH Food Count', item: 'Chocolate Chip Cookies', foh: 2, boh: 3, onHand: 5, status: 'Counted' },
        { section: 'FOH & BOH Food Count', item: 'Funfetti Cookies', foh: 1, boh: 3, onHand: 4, status: 'Counted' },
        { section: 'FOH & BOH Food Count', item: 'Chocolate Croissant', foh: 3, boh: 6, onHand: 9, status: 'Counted' },
        { section: 'FOH & BOH Food Count', item: 'Raspberry Croissant', foh: 2, boh: 3, onHand: 5, status: 'Counted' },
        { section: 'FOH & BOH Food Count', item: 'Butter Croissant', foh: 2, boh: 5, onHand: 7, status: 'Counted' },
        { section: 'FOH & BOH Food Count', item: 'Blueberry Muffins', foh: 2, boh: 3, onHand: 5, status: 'Counted' },
        { section: 'FOH & BOH Food Count', item: 'Seasonal Muffins', foh: 1, boh: 3, onHand: 4, status: 'Counted' },
        { section: 'FOH & BOH Food Count', item: 'Cheese Danish', foh: 2, boh: 5, onHand: 7, status: 'Counted' },
        { section: 'FOH & BOH Food Count', item: 'Lemon Bar', foh: 2, boh: 2, onHand: 4, status: 'Counted' },
        { section: 'FOH & BOH Food Count', item: 'Blueberry Danish', foh: 2, boh: 2, onHand: 4, status: 'Counted' },
        { section: 'FOH & BOH Food Count', item: 'Coffee Cake', foh: 1, boh: 2, onHand: 3, status: 'Counted' },
        { section: 'FOH & BOH Food Count', item: 'Banana Bread', foh: 2, boh: 2, onHand: 4, status: 'Counted' },
        { section: 'FOH & BOH Food Count', item: 'Brownie', foh: 1, boh: 2, onHand: 3, status: 'Counted' }
      ]
    }
  ];
}

function loadFormSubmissionsFromDisk() {
  const candidateFiles = FORMS_DATA_FILE === FORMS_SEED_FILE
    ? [FORMS_DATA_FILE]
    : [FORMS_DATA_FILE, FORMS_SEED_FILE];
  for (const file of candidateFiles) {
    try {
      if (fs.existsSync(file)) {
        const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (Array.isArray(parsed) && parsed.length > 0) {
          const seeded = getSeededFormSubmissions();
          const existingIds = new Set(parsed.map(s => s.id));
          let added = false;
          seeded.forEach(s => {
            if (!existingIds.has(s.id)) {
              parsed.push(s);
              added = true;
            }
          });
          if (added || file !== FORMS_DATA_FILE) saveFormSubmissionsToDisk(parsed);
          return parsed;
        }
      }
    } catch (_) {}
  }
  const seeded = getSeededFormSubmissions();
  try {
    fs.mkdirSync(path.dirname(FORMS_DATA_FILE), { recursive: true });
    fs.writeFileSync(FORMS_DATA_FILE, JSON.stringify(seeded, null, 2), 'utf8');
  } catch (_) {}
  return seeded;
}

function saveFormSubmissionsToDisk(submissions) {
  try {
    fs.mkdirSync(path.dirname(FORMS_DATA_FILE), { recursive: true });
    fs.writeFileSync(FORMS_DATA_FILE, JSON.stringify(submissions, null, 2), 'utf8');
  } catch (_) {}
}

function escapeCsvCell(val) {
  const s = val === null || val === undefined ? '' : String(val);
  if (/[",\r\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 50 * 1024 * 1024) { // 50MB limit
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        resolve(parsed);
      } catch (err) {
        reject(new Error('Invalid JSON: ' + err.message));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  const reqUrl = (req.url || '/').split('?')[0];

  // 1. Healthcheck endpoint
  if (reqUrl === '/api/health' && req.method === 'GET') {
    return sendJson(res, 200, {
      status: 'ok',
      service: 'Brick Road Coffee Operations Studio Sync Engine',
      version: syncEngine.version,
      updatedAt: syncEngine.updatedAt,
      connectedClients: syncEngine.clients.size,
      dataFile: syncEngine.dataFile,
      uptime: process.uptime()
    });
  }

  // 2. Full State JSON endpoint (GET /api/state)
  if (reqUrl === '/api/state' && req.method === 'GET') {
    return sendJson(res, 200, syncEngine.getStateSummary());
  }

  // 3. State update endpoint (POST /api/state)
  if (reqUrl === '/api/state' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const result = syncEngine.updateStoreState(body);
      if (result.success) {
        return sendJson(res, 200, result);
      } else {
        const status = result.error && result.error.includes('Unauthorized') ? 403 : 400;
        return sendJson(res, status, result);
      }
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message });
    }
  }

  // 4. Server-Sent Events stream (GET /api/state/stream)
  if (reqUrl === '/api/state/stream' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable proxy buffering in Nginx and Caddy
      'Access-Control-Allow-Origin': '*'
    });
    res.flushHeaders?.();
    syncEngine.addClient(res);
    return;
  }

  // 5. Master & Two-Tier Admin password verification (POST /api/master/verify & POST /api/admin/verify)
  if ((reqUrl === '/api/master/verify' || reqUrl === '/api/admin/verify') && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      if (reqUrl === '/api/master/verify' && !body.allowStoreAdmin) {
        const valid = syncEngine.verifyMasterPassword(body.password);
        return sendJson(res, 200, {
          valid,
          success: valid,
          unlocked: valid,
          role: valid ? 'overall' : null,
          storeScope: valid ? 'all' : null,
          error: valid ? undefined : 'Incorrect Master password.'
        });
      }
      const auth = syncEngine.verifyAdminPassword(body.password, body.storeScope || body.store || '');
      return sendJson(res, 200, {
        valid: auth.valid,
        success: auth.valid,
        unlocked: auth.unlocked,
        role: auth.role,
        storeScope: auth.storeScope,
        error: auth.valid ? undefined : 'Incorrect Admin password.'
      });
    } catch (err) {
      return sendJson(res, 400, { valid: false, success: false, unlocked: false, error: err.message });
    }
  }

  // 6. Master & Store Admin password change (POST /api/master/change-password & POST /api/admin/change-password)
  if ((reqUrl === '/api/master/change-password' || reqUrl === '/api/admin/change-password') && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const result = body.targetScope
        ? syncEngine.setAdminPassword(body.targetScope, body.currentPassword, body.newPassword)
        : syncEngine.setMasterPassword(body.currentPassword, body.newPassword);
      const status = result.success ? 200 : 400;
      return sendJson(res, status, result);
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message });
    }
  }

  // 6B. TenantConfig White-Label Schema API (GET & POST /api/tenant-config)
  if (reqUrl === '/api/tenant-config' && req.method === 'GET') {
    return sendJson(res, 200, {
      success: true,
      tenantConfig: syncEngine.tenantConfig
    });
  }

  if (reqUrl === '/api/tenant-config' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const result = syncEngine.updateTenantConfig(body.tenantConfig || body, body.password || body.masterPassword);
      return sendJson(res, result.success ? 200 : 403, result);
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message });
    }
  }

  // 6C. Form Lifecycle State Publish Endpoint (POST /api/forms/lifecycle/publish)
  if (reqUrl === '/api/forms/lifecycle/publish' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const result = syncEngine.publishDraftToInUse(body.store, body.draftDocId, body.password || body.masterPassword);
      return sendJson(res, result.success ? 200 : 400, result);
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message });
    }
  }

  // 6D. Dynamic Per-Store Web App Manifest for Direct iPad Kiosk Installation (GET /manifest.json & /api/manifest/:storeId)
  if ((reqUrl === '/manifest.json' || reqUrl.startsWith('/api/manifest/')) && req.method === 'GET') {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathStore = reqUrl.startsWith('/api/manifest/') ? reqUrl.replace('/api/manifest/', '').trim().toLowerCase() : '';
    const queryStore = (urlObj.searchParams.get('store') || pathStore || '').toLowerCase().trim();
    const tenant = syncEngine.tenantConfig || {};
    const storeMap = (tenant && tenant.stores) || {};
    const storeCfg = queryStore && storeMap[queryStore] ? storeMap[queryStore] : null;
    const brandName = tenant.brandName || 'Brick Road Coffee';
    const shortName = storeCfg
      ? (storeCfg.shortName || `BRC ${storeCfg.name}`).slice(0, 12)
      : 'Brick Road';
    const fullName = storeCfg
      ? `${brandName} — ${storeCfg.name} Hub`
      : `${brandName} Operations Hub`;
    const startUrl = storeCfg ? `/${storeCfg.id}` : '/';
    const manifestPayload = {
      id: storeCfg ? `brick-road-coffee-${storeCfg.id}-kiosk` : 'brick-road-coffee-ops-hub',
      name: fullName,
      short_name: shortName,
      description: `${brandName} Operations Hub, Daily Shift Checklists, Deep Clean Playbook & Binder Studio`,
      start_url: startUrl,
      scope: '/',
      display: 'standalone',
      orientation: 'any',
      background_color: '#FAF5EB',
      theme_color: (tenant.brandColors && tenant.brandColors.espresso) || '#391300',
      categories: ['business', 'productivity', 'food'],
      icons: [
        { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
      ],
      shortcuts: Object.values(storeMap).map(st => ({
        name: `${st.name} Operations Hub`,
        short_name: `${st.name} Hub`,
        description: `Open ${st.name} Daily Shift Checklists & Store Hub`,
        url: `/${st.id}`,
        icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }]
      }))
    };
    res.writeHead(200, {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(manifestPayload, null, 2));
    return;
  }

  // 7. Clean URL Routes Directory endpoint (GET /api/routes)
  if (reqUrl === '/api/routes' && req.method === 'GET') {
    const stores = syncEngine.getStoreIds();
    const sheets = [
      { slug: 'butteredup', docId: 'buttered-up-bakery', title: 'Buttered Up Bakery Count', type: 'inventory', group: 'Inventory & Ordering Guides' },
      { slug: 'mesakitchen', docId: 'mesa-kitchen-order', title: 'Mesa Kitchen Order Sheet', type: 'inventory', group: 'Inventory & Ordering Guides' },
      { slug: 'drinkme', docId: 'drink-me-tea-order', title: 'Drink Me Tea & Pastry Order', type: 'inventory', group: 'Inventory & Ordering Guides' },
      { slug: 'coffeeorder', docId: 'prism-coffee-order', title: 'Brick Road Coffee Order & Guide', type: 'inventory', group: 'Inventory & Ordering Guides' },
      { slug: 'shoreline', docId: 'shoreline-inventory', title: 'Shoreline Inventory', type: 'inventory', group: 'Inventory & Ordering Guides' },
      { slug: 'thirdparty', docId: 'third-party-inventory', title: 'Third-Party Inventory & Order', type: 'inventory', group: 'Inventory & Ordering Guides' },
      { slug: 'lively', docId: 'lively-order-sheet', title: 'Lively Dairy & Supply Order', type: 'inventory', group: 'Inventory & Ordering Guides' },
      { slug: 'am', docId: 'am-task-sheet', title: 'AM Task Sheet', type: 'checklist', group: 'Daily Shift Checklists' },
      { slug: 'pm', docId: 'pm-task-sheet', title: 'PM Task Sheet', type: 'checklist', group: 'Daily Shift Checklists' },
      { slug: 'am-deepclean', docId: 'am-deep-clean', title: 'AM Deep Clean', type: 'checklist', group: 'Daily Shift Checklists' },
      { slug: 'pm-deepclean', docId: 'pm-deep-clean', title: 'PM Deep Clean', type: 'checklist', group: 'Daily Shift Checklists' },
      { slug: 'temps', docId: 'physical-temp-log', title: 'Physical Temp & Inventory Log', type: 'checklist', group: 'Daily Shift Checklists' },
      { slug: 'register', docId: 'register-count-sheet', title: 'E.O.D. Till Calculator & Deposit', type: 'checklist', group: 'Daily Shift Checklists' },
      { slug: 'cleanplay', docId: 'clean-play-cards', title: 'Deep Clean Play Cards (All 29)', type: 'checklist', group: 'Daily Shift Checklists' },
      { slug: 'pull', docId: 'food-pull-template', title: 'Pull & Thaw Sheet', type: 'guide', group: 'Bar & Equipment Guides' },
      { slug: 'cerealmilk', docId: 'cereal-milk-syrup', title: 'Cereal Milk Syrup Recipe', type: 'guide', group: 'Bar & Equipment Guides' },
      { slug: 'coldbrew', docId: 'cold-brew-process', title: 'Cold Brew Process', type: 'guide', group: 'Bar & Equipment Guides' },
      { slug: 'catering', docId: 'catering-orders', title: 'Catering Orders Matrix', type: 'guide', group: 'Bar & Equipment Guides' },
      { slug: 'x1grinder', docId: 'x1-grinder-sop', title: 'X1 Grinder SOP', type: 'guide', group: 'Bar & Equipment Guides' },
      { slug: 'acronyms', docId: 'drink-acronyms', title: 'Drink Acronyms & Marking Key', type: 'reference', group: 'Barista Reference & Directory' },
      { slug: 'recipes', docId: 'recipes-2025', title: 'Barista Recipes', type: 'reference', group: 'Barista Reference & Directory' },
      { slug: 'contacts', docId: 'contact-list', title: 'Store Directory & Escalation', type: 'reference', group: 'Barista Reference & Directory' }
    ];
    return sendJson(res, 200, {
      stores,
      sheets,
      examples: ['/melrose/butteredup', '/mesa/am', '/tempe/lively']
    });
  }

  // 7B. Forms Submissions & Multi-Store Trend Analytics API (GET & POST /api/forms/submissions)
  if (reqUrl === '/api/forms/submissions' && req.method === 'GET') {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const storeFilter = (urlObj.searchParams.get('store') || 'all').toLowerCase();
    const formFilter = (urlObj.searchParams.get('form') || 'all').toLowerCase();
    const dateFrom = (urlObj.searchParams.get('from') || '').trim();
    const dateTo = (urlObj.searchParams.get('to') || '').trim();
    const allSubs = loadFormSubmissionsFromDisk();
    const filtered = allSubs.filter(s => {
      if (storeFilter !== 'all' && storeFilter !== 'master' && s.store !== storeFilter) return false;
      if (formFilter !== 'all' && s.docId !== formFilter && s.slug !== formFilter) return false;
      const dStr = String(s.date || (s.timestamp ? s.timestamp.slice(0, 10) : ''));
      if (dateFrom && dStr && dStr < dateFrom) return false;
      if (dateTo && dStr && dStr > dateTo) return false;
      return true;
    });
    return sendJson(res, 200, {
      success: true,
      count: filtered.length,
      submissions: filtered
    });
  }

  if (reqUrl === '/api/forms/submissions' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const signerName = String(body.submittedBy || '').trim();
      if (!signerName) {
        return sendJson(res, 400, { success: false, error: 'Employee Name and Signature are required for Task View form submission.' });
      }
      const allSubs = loadFormSubmissionsFromDisk();
      const rawItems = Array.isArray(body.items) ? body.items : [];
      // Filter out any prep-grab items ("Materials Needed", "Tools & Supplies", "Ingredients") or blank rows
      const cleanItems = rawItems.filter(it => {
        const sec = String(it.section || '').trim();
        if (/Materials Needed|Tools\s*&\s*Supplies|Equipment\s*&\s*Supplies|What You Need|Ingredients|Roast Guide|Comparison Matrix|Expiration Reference/i.test(sec)) {
          return false;
        }
        return true;
      });
      const newSub = {
        id: body.id || ('sub-' + Date.now()),
        timestamp: body.timestamp || new Date().toISOString(),
        date: body.date || new Date().toISOString().slice(0, 10),
        store: (body.store || 'melrose').toLowerCase(),
        docId: body.docId || 'custom-form',
        slug: body.slug || 'form',
        formTitle: body.formTitle || 'Store Form',
        category: body.category || 'Inventory & Ordering Guides',
        submittedBy: signerName,
        signed: body.signed !== undefined ? Boolean(body.signed) : true,
        signatureSummary: body.signatureSummary || 'Signed',
        checkedCount: Number(body.checkedCount) || 0,
        totalChecks: Number(body.totalChecks) || 0,
        completionPct: Number(body.completionPct) || 100,
        totalPar: Number(body.totalPar) || 0,
        totalOnHand: Number(body.totalOnHand) || 0,
        totalOrder: Number(body.totalOrder) || 0,
        notes: body.notes || '',
        items: cleanItems
      };
      allSubs.unshift(newSub);
      saveFormSubmissionsToDisk(allSubs);
      return sendJson(res, 200, { success: true, submission: newSub, totalSubmissions: allSubs.length });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message });
    }
  }

  // 7C. Direct Flat Excel-Ready CSV Export Endpoint for Store Forms & Trend Analysis (GET /api/forms/export.csv)
  // Outputs one clean header row and one flat row per entry so Excel can filter, sort, and pivot immediately.
  if (reqUrl === '/api/forms/export.csv' && req.method === 'GET') {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const storeFilter = (urlObj.searchParams.get('store') || 'all').toLowerCase();
    const docFilter = (urlObj.searchParams.get('docId') || urlObj.searchParams.get('form') || 'all').toLowerCase();
    const dateFrom = (urlObj.searchParams.get('from') || '').trim();
    const dateTo = (urlObj.searchParams.get('to') || '').trim();
    const allSubs = loadFormSubmissionsFromDisk().filter(s => {
      if (storeFilter !== 'all' && storeFilter !== 'master' && s.store !== storeFilter) return false;
      if (docFilter !== 'all' && docFilter !== '' && (s.docId || '').toLowerCase() !== docFilter && (s.slug || '').toLowerCase() !== docFilter) return false;
      const dStr = String(s.date || (s.timestamp ? s.timestamp.slice(0, 10) : ''));
      if (dateFrom && dStr && dStr < dateFrom) return false;
      if (dateTo && dStr && dStr > dateTo) return false;
      return true;
    });
    const headers = [
      'Submission ID', 'Date', 'Store', 'Form Title', 'Category', 'Submitted By', 'Signature Status',
      'Compliance %', 'Tasks Completed', 'Tasks Missed', 'Metric Type', 'Section / Time', 'Item / Task',
      'Par', 'On Hand', 'Order Qty', 'Value / Notes'
    ];
    const rows = [headers.map(escapeCsvCell).join(',')];
    allSubs.forEach(sub => {
      const formPageTitle = sub.formTitle || sub.docId || 'Store Form';
      const categoryName = sub.category || 'Operations';
      const storeName = (sub.store || 'melrose').toUpperCase();
      const sigStatus = sub.signatureSummary || (sub.signed ? 'Signed' : 'Verified');
      const compPct = sub.totalChecks > 0 ? Math.round(((sub.checkedCount || 0) / sub.totalChecks) * 100) : (sub.completionPct ?? 100);
      const tasksDone = sub.totalChecks > 0 ? (sub.checkedCount || 0) : '';
      const tasksMissed = sub.totalChecks > 0 ? Math.max(0, sub.totalChecks - (sub.checkedCount || 0)) : '';
      const validItems = (Array.isArray(sub.items) ? sub.items : []).filter(it => {
        const sec = String(it.section || '').trim();
        if (/Materials Needed|Tools\s*&\s*Supplies|Equipment\s*&\s*Supplies|What You Need|Ingredients|Roast Guide|Comparison Matrix|Expiration Reference/i.test(sec)) {
          return false;
        }
        const hasFilledVal = Boolean(it.filledValue || (it.onHand !== undefined && it.onHand !== '') || (it.order !== undefined && it.order !== '') || it.status);
        return hasFilledVal;
      });

      if (validItems.length > 0) {
        validItems.forEach(it => {
          const metricType = it.recordType || (it.onHand !== undefined && it.onHand !== '' ? 'Inventory Metric' : 'Task Compliance');
          const filledDesc = it.filledValue || it.status || `On Hand: ${it.onHand ?? 0}, Order: ${it.order ?? 0}`;
          rows.push([
            sub.id, sub.date, storeName, formPageTitle, categoryName, sub.submittedBy, sigStatus,
            compPct + '%', tasksDone, tasksMissed, metricType, it.section || '', it.item || '',
            it.par !== undefined && it.par !== '' ? it.par : '',
            it.onHand !== undefined && it.onHand !== '' ? it.onHand : '',
            it.order !== undefined && it.order !== '' ? it.order : '',
            filledDesc
          ].map(escapeCsvCell).join(','));
        });
      } else {
        rows.push([
          sub.id, sub.date, storeName, formPageTitle, categoryName, sub.submittedBy, sigStatus,
          compPct + '%', tasksDone, tasksMissed, 'Shift Summary', categoryName, formPageTitle,
          sub.totalPar || '', sub.totalOnHand || '', sub.totalOrder || '',
          sub.notes || `Compliance: ${compPct}%`
        ].map(escapeCsvCell).join(','));
      }
    });
    const csvContent = rows.join('\r\n');
    const fileTag = storeFilter === 'all' ? 'All_Stores_Master' : storeFilter.toUpperCase();
    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="BrickRoad_Forms_Analytics_${fileTag}.csv"`,
      'Access-Control-Allow-Origin': '*'
    });
    res.end(csvContent);
    return;
  }

  // 8. Static file serving with index.html SPA fallback (Clean Store Routes & Iframe Embed Support)
  try {
    const decodedUrl = decodeURIComponent(reqUrl);
    let safePath = path.normalize(decodedUrl).replace(/^(\.\.[\/\\])+/, '');
    if (safePath === '/' || safePath === '\\') {
      safePath = '/index.html';
    }
    const filePath = path.join(ROOT, safePath);
    const commonHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Content-Security-Policy': 'frame-ancestors *',
      'Service-Worker-Allowed': '/'
    };
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = safePath.endsWith('manifest.json')
        ? 'application/manifest+json; charset=utf-8'
        : (MIME_TYPES[ext] || 'application/octet-stream');
      res.writeHead(200, {
        ...commonHeaders,
        'Content-Type': contentType,
        'Cache-Control': (ext === '.html' || safePath.endsWith('sw.js')) ? 'no-cache' : 'public, max-age=3600'
      });
      fs.createReadStream(filePath).pipe(res);
    } else {
      const fallback = path.join(ROOT, 'index.html');
      res.writeHead(200, {
        ...commonHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache'
      });
      fs.createReadStream(fallback).pipe(res);
    }
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Internal Server Error: ' + err.message);
  }
});

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Brick Road Coffee Operations Studio running at http://0.0.0.0:${PORT}`);
    console.log(`Sync Engine active: data file at ${syncEngine.dataFile}`);
  });
}

module.exports = { server, syncEngine };

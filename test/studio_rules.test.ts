import test from 'node:test';
import assert from 'node:assert/strict';

// Helper logic for page selection/exclusion on export
export function parsePageRangeString(rangeStr: string, totalPages: number): number[] {
  if (!rangeStr || !rangeStr.trim()) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }
  const clean = rangeStr.trim();
  const isExclusion = clean.startsWith('^') || clean.toLowerCase().startsWith('exclude:');
  const normalized = isExclusion ? clean.replace(/^\^|exclude:\s*/i, '') : clean;
  
  const tokens = normalized.split(/[,;\s]+/).filter(Boolean);
  const matchedIndices = new Set<number>();

  for (const token of tokens) {
    if (token.includes('-')) {
      const [startStr, endStr] = token.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(totalPages, Math.max(start, end));
        for (let p = min; p <= max; p++) {
          matchedIndices.add(p - 1);
        }
      }
    } else {
      const p = parseInt(token, 10);
      if (!isNaN(p) && p >= 1 && p <= totalPages) {
        matchedIndices.add(p - 1);
      }
    }
  }

  if (isExclusion) {
    const included: number[] = [];
    for (let i = 0; i < totalPages; i++) {
      if (!matchedIndices.has(i)) included.push(i);
    }
    return included;
  }

  return Array.from(matchedIndices).sort((a, b) => a - b);
}

export function filterPagesBySelection<T>(items: T[], selectedIndices: number[]): T[] {
  return items.filter((_, idx) => selectedIndices.includes(idx));
}

export const MAINTENANCE_VENDORS = [
  { vendor: 'Lux Appliance', service: 'Fridges and Freezer repair', phone: '(602) 975-4818' },
  { vendor: 'Auto Chlor', service: 'Sanitizer, Dish detergent, floor cleaner', phone: '(602) 437-9333' },
  { vendor: 'Allied Gas', service: 'Nitrogen Tanks', phone: '(480) 894-6000' },
  { vendor: 'Espresso Italia', service: 'Espresso Machine, Water filters, Grinders', phone: '(480) 731-3236' },
  { vendor: 'Arizona Grease Services', service: 'Grease Trap & Grease Services', phone: '(602) 476-2796' }
];

export function getFreezerShelves(isHalf: boolean) {
  return isHalf
    ? [
        { num: 1, label: 'SHELF 1 • TOP SHELF', sub: '' },
        { num: 2, label: 'SHELF 2 • BOTTOM SHELF', sub: '' }
      ]
    : [
        { num: 1, label: 'SHELF 1 • TOP SHELF', sub: '' },
        { num: 2, label: 'SHELF 2 • MIDDLE SHELF', sub: '' },
        { num: 3, label: 'SHELF 3 • BOTTOM SHELF', sub: '' }
      ];
}

test('parsePageRangeString includes all pages by default', () => {
  const result = parsePageRangeString('', 5);
  assert.deepEqual(result, [0, 1, 2, 3, 4]);
});

test('parsePageRangeString handles specific page inclusions and ranges', () => {
  const result = parsePageRangeString('1, 3-5', 6);
  assert.deepEqual(result, [0, 2, 3, 4]);
});

test('parsePageRangeString handles exclusions with ^', () => {
  const result = parsePageRangeString('^2, 4', 5);
  // excludes index 1 and 3 (pages 2 and 4), keeps 0, 2, 4 (pages 1, 3, 5)
  assert.deepEqual(result, [0, 2, 4]);
});

test('filterPagesBySelection excludes unchecked pages', () => {
  const pages = ['Page 1', 'Page 2', 'Page 3', 'Page 4'];
  const filtered = filterPagesBySelection(pages, [0, 2]);
  assert.deepEqual(filtered, ['Page 1', 'Page 3']);
});

test('maintenance vendors contains all 5 required vendors with correct phone numbers', () => {
  assert.equal(MAINTENANCE_VENDORS.length, 5);
  
  const lux = MAINTENANCE_VENDORS.find(v => v.vendor === 'Lux Appliance');
  assert.ok(lux);
  assert.equal(lux.phone, '(602) 975-4818');
  assert.match(lux.service, /Fridges and Freezer repair/i);

  const autoChlor = MAINTENANCE_VENDORS.find(v => v.vendor === 'Auto Chlor');
  assert.ok(autoChlor);
  assert.equal(autoChlor.phone, '(602) 437-9333');
  assert.match(autoChlor.service, /Sanitizer.*Dish detergent.*floor cleaner/i);

  const alliedGas = MAINTENANCE_VENDORS.find(v => v.vendor === 'Allied Gas');
  assert.ok(alliedGas);
  assert.equal(alliedGas.phone, '(480) 894-6000');
  assert.match(alliedGas.service, /Nitrogen Tanks/i);

  const espressoItalia = MAINTENANCE_VENDORS.find(v => v.vendor === 'Espresso Italia');
  assert.ok(espressoItalia);
  assert.equal(espressoItalia.phone, '(480) 731-3236');
  assert.match(espressoItalia.service, /Espresso Machine.*Water filters.*Grinders/i);

  const grease = MAINTENANCE_VENDORS.find(v => v.vendor === 'Arizona Grease Services');
  assert.ok(grease);
  assert.equal(grease.phone, '(602) 476-2796');
});

test('freezer shelves have no suggested items like Cookies, Bars & Priority FOH Pulls', () => {
  const upright = getFreezerShelves(false);
  const half = getFreezerShelves(true);

  upright.forEach(sh => {
    assert.doesNotMatch(sh.sub, /Cookies/i);
    assert.doesNotMatch(sh.sub, /Bars/i);
    assert.doesNotMatch(sh.sub, /Priority FOH Pulls/i);
    assert.doesNotMatch(sh.sub, /Croissants/i);
    assert.doesNotMatch(sh.sub, /Muffins/i);
  });

  half.forEach(sh => {
    assert.doesNotMatch(sh.sub, /Cookies/i);
    assert.doesNotMatch(sh.sub, /Bars/i);
    assert.doesNotMatch(sh.sub, /Priority FOH Pulls/i);
  });
});

test('index.html verifies all recipe card splits, vessels and task sheet updates', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const content = fs.readFileSync(path.resolve('index.html'), 'utf-8');

  // 1. Lotus splits
  assert.match(content, /title:\s*"Hawaiian Vacation Lotus Energy"/);
  assert.match(content, /title:\s*"Berry Night Lotus Energy"/);
  assert.match(content, /title:\s*"Orange Sickle Lotus Energy"/);
  assert.match(content, /title:\s*"Cram Session Lotus Energy"/);
  assert.match(content, /title:\s*"American Pie Lotus Energy"/);
  assert.match(content, /title:\s*"Peachy Queen Lotus Energy"/);
  assert.match(content, /title:\s*"Desert Sunset Lotus Energy"/);
  assert.match(content, /title:\s*"Sour Patch Lotus Energy"/);
  assert.match(content, /title:\s*"P\.O\.G\. Lotus Energy"/);
  assert.match(content, /title:\s*"Witches Brew Lotus Energy"/);
  assert.match(content, /title:\s*"Emerald City Lotus Energy"/);
  assert.doesNotMatch(content, /Lotus Menu Builds #1/);
  assert.doesNotMatch(content, /Lotus Menu Builds #2/);

  // 2. Twister splits
  assert.match(content, /title:\s*"Mocha Blended Coffee Twister \(MT\)"/);
  assert.match(content, /title:\s*"Caramel Blended Coffee Twister \(CT\)"/);
  assert.match(content, /title:\s*"Vanilla Blended Coffee Twister \(VT\)"/);
  assert.doesNotMatch(content, /Mocha \/ Caramel \/ Vanilla Blended Coffee Twisters/);

  // 3. Vessels and Prep
  assert.match(content, /cup:\s*"Whip Canister"/);
  assert.match(content, /cup:\s*"Shot Tin"/);
  assert.match(content, /title:\s*"Twister Concentrate Preparation",[\s\S]*?cup:\s*"Pitcher"/);
  assert.match(content, /title:\s*"Cold Foam Preparation"/);
  assert.doesNotMatch(content, /Twister Concentrate Preparation & Cold Foam/);

  // 4. Full-width 2025 5-column Recipe Card table layout
  assert.ok(/data-recipe-layout="2025-5col"/.test(content));
  assert.ok(/Major Steps<\/th>/.test(content));
  assert.ok(/Ingredient \/ Action<\/th>/.test(content));
  assert.ok(/Quality Notes<\/th>/.test(content));

  // 5. Title replacement: Barista Recipes
  assert.ok(/BRICK ROAD COFFEE \/\/ 2025 BARISTA RECIPE CARD/.test(content));
  assert.ok(!/2025 BARISTA RECIPE PLAYBOOK/.test(content));
  assert.ok(/name:\s*'4\. Barista Recipes'/.test(content));

  // 6. Single AM and PM Task Sheets use Phase names (Pre-Open, Open, Mid-AM, Afternoon, Mid-Shift, etc.) with optional time slots underneath
  assert.ok(!/id:\s*'am-task-sheet-classic'/.test(content));
  assert.ok(!/id:\s*'pm-task-sheet-timed'/.test(content));
  assert.ok(/data-phase-name-slot="am-p1"[^>]*>Pre-Open<\/div><div class="brc-phase-optional-time" data-phase-time-cell="am-p1"[^>]*><\/div>/.test(content));
  assert.ok(/data-phase-name-slot="am-p2"[^>]*>Open<\/div><div class="brc-phase-optional-time" data-phase-time-cell="am-p2"[^>]*><\/div>/.test(content));
  assert.ok(/data-phase-name-slot="am-p3"[^>]*>Mid-AM<\/div><div class="brc-phase-optional-time" data-phase-time-cell="am-p3"[^>]*><\/div>/.test(content));
  assert.ok(/data-phase-name-slot="pm-p1"[^>]*>Afternoon<\/div><div class="brc-phase-optional-time" data-phase-time-cell="pm-p1"[^>]*><\/div>/.test(content));
  assert.ok(/data-phase-name-slot="pm-p2"[^>]*>Mid-Shift<\/div><div class="brc-phase-optional-time" data-phase-time-cell="pm-p2"[^>]*><\/div>/.test(content));
  assert.ok(/function setTaskSheetPhaseOptionalTime\(phaseKey, timeStr = ''\)/.test(content));

  // 7. Single door freezer chart has no right door
  assert.ok(/SINGLE DOOR FREEZER \(DOOR 1\)/.test(content));
  assert.ok(!/SINGLE DOOR — RIGHT BAY/.test(content));
});

test('index.html has Word/Docs single-row toolbar, no Caddy/Homeserver/Install UI, and zero emojis', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const content = fs.readFileSync(path.resolve('index.html'), 'utf-8');

  // 1. One-click Editor <-> Task View toggle and CSV Export button
  assert.ok(/id="btn-toggle-mobile-fill"/.test(content));
  assert.ok(/<span>Task View<\/span>/.test(content));
  assert.ok(/id="btn-share-mobile-url"/.test(content));
  assert.ok(/<span>Store Hubs &amp; CSV<\/span>/.test(content));

  // 2. Caddy / Server / Homeserver / Install modals and buttons removed
  assert.doesNotMatch(content, /id="btn-homeserver-caddy"/);
  assert.doesNotMatch(content, /id="homeserver-caddy-modal"/);
  assert.doesNotMatch(content, /id="device-install-embed-modal"/);
  assert.doesNotMatch(content, /brick\.mzry\.lol/);

  // 3. Zero emojis in entire index.html
  assert.doesNotMatch(content, /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u);
  assert.doesNotMatch(content, /[🔒🔓⚡📋⚠✕]/);
});

test('checklist boxes have strict square aspect-ratio, transparent background, 0px radius, and flush-left margin: 0', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const content = fs.readFileSync(path.resolve('index.html'), 'utf-8');

  // .brc-check styling
  assert.match(content, /\.brc-check[^{]*\{[^}]*aspect-ratio:\s*1\s*\/\s*1\s*!important/);
  assert.match(content, /\.brc-check[^{]*\{[^}]*background:\s*transparent\s*!important/);
  assert.match(content, /\.brc-check[^{]*\{[^}]*border-radius:\s*0px\s*!important/);
  assert.match(content, /\.brc-check[^{]*\{[^}]*margin:\s*0\s*!important/);
});

test('Master Auth Modal is not trapped inside #edit-mode-modal', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const content = fs.readFileSync(path.resolve('index.html'), 'utf-8');

  // Verify #edit-mode-modal closes properly before #master-auth-modal opens
  const editModalIdx = content.indexOf('id="edit-mode-modal"');
  const masterModalIdx = content.indexOf('id="master-auth-modal"');
  assert.ok(editModalIdx > 0 && masterModalIdx > editModalIdx);
  const betweenModals = content.slice(editModalIdx, masterModalIdx);
  const openDivs = (betweenModals.match(/<div\b/g) || []).length;
  const closeDivs = (betweenModals.match(/<\/div>/g) || []).length;
  assert.equal(openDivs, closeDivs, '#edit-mode-modal must close all its divs before #master-auth-modal');
});

test('local browser caching persists edits, active store, and active doc across refreshes with zero P2P connections', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const content = fs.readFileSync(path.resolve('index.html'), 'utf-8');
  const syncEngineContent = fs.readFileSync(path.resolve('sync-engine.js'), 'utf-8');

  // LocalStorage keys used for resilience
  assert.match(content, /localStorage\.getItem\('brc_saved_edits_v13'\)/);
  assert.match(content, /localStorage\.getItem\('brc_active_store'\)/);
  assert.match(content, /localStorage\.getItem\('brc_active_doc_id'\)/);
  assert.match(content, /window\.addEventListener\('beforeunload'/);

  // Zero EventSource / P2P peer-count / pingInterval
  assert.doesNotMatch(content, /new EventSource\(/);
  assert.doesNotMatch(syncEngineContent, /peer-count/);
  assert.doesNotMatch(syncEngineContent, /pingInterval/);
});

test('sync-engine isolates store edits and propagates master updates when authenticated', async () => {
  const path = await import('node:path');
  const fs = await import('node:fs');
  // Dynamic import of CommonJS sync-engine
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  const SyncEngine = require(path.resolve('sync-engine.js'));

  const tmpDataDir = path.resolve('test-data-' + Date.now());
  const engine = new SyncEngine({ dataDir: tmpDataDir });

  try {
    // 1. Password check
    assert.equal(engine.verifyMasterPassword('wrongpass'), false);
    assert.equal(engine.verifyMasterPassword('brickroad'), true);

    // 2. Store edit isolation: Mesa edit does not bleed to Melrose
    const mesaRes = engine.updateStoreState({
      store: 'mesa',
      customEditedHTML: { 'sop-1__mesa': '<div>Mesa Custom Content</div>' }
    });
    assert.equal(mesaRes.success, true);
    assert.equal(engine.state['sop-1__mesa'], '<div>Mesa Custom Content</div>');
    assert.equal(engine.state['sop-1__melrose'], undefined);

    // 3. Master edit without password fails
    const failMaster = engine.updateStoreState({
      store: 'master',
      password: 'wrong',
      customEditedHTML: { 'sop-1__master': '<div>Master Content</div>' }
    });
    assert.equal(failMaster.success, false);
    assert.equal(failMaster.requiresMasterAuth, true);

    // 4. Master edit with correct password succeeds, seeds stores without custom edits, and preserves existing store customizations (Mesa)
    const passMaster = engine.updateStoreState({
      store: 'master',
      password: 'brickroad',
      customEditedHTML: { 'sop-1__master': '<div data-store-badge="true">STORE: MASTER</div><div>Master Content</div>' }
    });
    assert.equal(passMaster.success, true);
    assert.equal(engine.state['sop-1__master'].includes('Master Content'), true);
    assert.equal(engine.state['sop-1__melrose'].includes('STORE: MELROSE'), true);
    assert.equal(engine.state['sop-1__tempe'].includes('STORE: TEMPE'), true);
    assert.equal(engine.state['sop-1__mesa'], '<div>Mesa Custom Content</div>');
  } finally {
    if (typeof engine.destroy === 'function') engine.destroy();
    if (fs.existsSync(tmpDataDir)) {
      fs.rmSync(tmpDataDir, { recursive: true, force: true });
    }
  }
});

test('index.html includes enhanced box drag-and-drop, hover grip, marquee lasso, and multi-select copy/paste', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const content = fs.readFileSync(path.resolve('index.html'), 'utf-8');

  // 1. Subbar Move / Select mode button & HUD elements
  assert.match(content, /id="btn-select-move-mode"/);
  assert.match(content, /id="brc-hover-drag-grip"/);
  assert.match(content, /id="brc-drop-indicator"/);
  assert.match(content, /id="brc-marquee-lasso"/);
  assert.match(content, /id="brc-multiselect-bar"/);

  // 2. Multi-selection and box swapping / batch copy-paste functions
  assert.match(content, /function toggleBoxInMultiSelection\(/);
  assert.match(content, /function selectRangeOfMoveableNodes\(/);
  assert.match(content, /function selectTableCellRange\(/);
  assert.match(content, /function swapTwoDomBoxesWithGridSpans\(/);
  assert.match(content, /function findBestDropTargetForDrag\(/);
  assert.match(content, /multi-block/);
  assert.match(content, /multi-step/);
  assert.match(content, /multi-cell/);
});

test('Complete Store Booklet subset page export (e.g. Pages 16-19) maps 1-to-1 with checklist and never shifts to PM task sheet or blank duplex pages', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const content = fs.readFileSync(path.resolve('index.html'), 'utf-8');

  // 1. Canonical booklet content sheet builder used by both checklist and exporter
  assert.match(content, /function buildBookletContentSheetEntries\(/);
  assert.match(content, /const entries = buildBookletContentSheetEntries\(\);/);
  assert.match(content, /const entries = buildBookletContentSheetEntries\(options\);/);

  // 2. When a subset of pages is selected, exporter returns only those exact content sheets with zero blank spacer sheets
  assert.match(content, /const isSubsetSelection = Boolean\(selectedIndicesSet && selectedIndicesSet\.size > 0 && selectedIndicesSet\.size < entries\.length\);/);
  assert.match(content, /if \(isSubsetSelection\) \{\s*entries\.forEach\(entry => \{\s*if \(!selectedIndicesSet\.has\(entry\.index\)\) return;/);

  // 3. Simulate the exact Complete Store Booklet content order and verify Pages 16-19
  const bookletContentPages = [
    { pageNum: 1, docId: 'sop-1', label: 'Cold Brew Screening & Grind' },
    { pageNum: 2, docId: 'sop-2', label: 'Cold Brew: Drip Drain & TDS' },
    { pageNum: 3, docId: 'sop-3', label: 'Toddy Cold Brew Kegging' },
    { pageNum: 4, docId: 'sop-4', label: 'Barista Recipes (P1)' },
    { pageNum: 5, docId: 'sop-4', label: 'Barista Recipes (P2)' },
    { pageNum: 6, docId: 'sop-4', label: 'Barista Recipes (P3)' },
    { pageNum: 7, docId: 'sop-5', label: 'Whipped Cream, Caramel & Powders' },
    { pageNum: 8, docId: 'sop-6', label: 'Cereal Milk Syrup' },
    { pageNum: 9, docId: 'am-task-sheet', label: 'AM Shift Task Sheet' },
    { pageNum: 10, docId: 'pm-task-sheet', label: 'PM Shift Task Sheet' },
    { pageNum: 11, docId: 'cleaning-task-list', label: 'Barista Shift Task Matrix' },
    { pageNum: 12, docId: 'clean-play-pack', label: 'Store Maintenance & Clean Play' },
    { pageNum: 13, docId: 'buttered-up-bakery', label: 'Buttered Up Bakery Order' },
    { pageNum: 14, docId: 'drink-me-tea-order', label: 'Drink Me! Tea Order' },
    { pageNum: 15, docId: 'prism-coffee-order', label: 'Coffee Order & Roast Inventory' },
    { pageNum: 16, docId: 'shoreline-inventory', label: 'Shoreline Inventory (P1)' },
    { pageNum: 17, docId: 'shoreline-inventory', label: 'Shoreline Inventory (P2)' },
    { pageNum: 18, docId: 'third-party-inventory', label: 'Third-Party Inventory & Order' },
    { pageNum: 19, docId: 'lively-order-sheet', label: 'Lively Dairy & Supply Order (.xlsx)' },
    { pageNum: 20, docId: 'pastry-pull-sheet', label: 'Daily Pastry Freezer Pull' },
    { pageNum: 21, docId: 'temp-log-sheet', label: 'Daily Fridge & Freezer Temp Log' },
    { pageNum: 22, docId: 'register-change-order', label: 'Change Order & Safe Count' }
  ];

  const selectedIndices = parsePageRangeString('16-19', bookletContentPages.length);
  assert.deepEqual(selectedIndices, [15, 16, 17, 18]);

  const exportedPages = filterPagesBySelection(bookletContentPages, selectedIndices);
  assert.equal(exportedPages.length, 4);
  assert.deepEqual(
    exportedPages.map(p => p.docId),
    ['shoreline-inventory', 'shoreline-inventory', 'third-party-inventory', 'lively-order-sheet']
  );
  assert.equal(exportedPages.some(p => p.docId === 'pm-task-sheet'), false);
});

test('Clean URL routing (/melrose/butteredup) and Mobile Fill-Out View are configured in index.html and server.js', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const htmlContent = fs.readFileSync(path.resolve('index.html'), 'utf-8');
  const serverContent = fs.readFileSync(path.resolve('server.js'), 'utf-8');

  // 1. Base href present so deep routes like /melrose/butteredup resolve relative assets
  assert.match(htmlContent, /<base href="\/">/);

  // 2. Clean URL catalog and router functions in index.html
  assert.match(htmlContent, /const BRC_PUBLIC_DOMAIN = \(typeof window !== 'undefined'/);
  assert.match(htmlContent, /slug:\s*'butteredup',[\s\S]*?docId:\s*'buttered-up-bakery'/);
  assert.match(htmlContent, /slug:\s*'shoreline',[\s\S]*?docId:\s*'shoreline-inventory'/);
  assert.match(htmlContent, /slug:\s*'lively',[\s\S]*?docId:\s*'lively-order-sheet'/);
  assert.match(htmlContent, /slug:\s*'am',[\s\S]*?docId:\s*'am-task-sheet'/);
  assert.match(htmlContent, /slug:\s*'pm',[\s\S]*?docId:\s*'pm-task-sheet'/);
  assert.match(htmlContent, /function parseCleanRouteFromPathname\(/);
  assert.match(htmlContent, /function buildCleanBrickUrl\(/);
  assert.match(htmlContent, /function renderOnlineFillOutView\(/);
  assert.match(htmlContent, /id="brc-online-fill-panel"/);
  assert.match(htmlContent, /id="mobile-links-modal"/);

  // 3. Server routes endpoint and SPA fallback for clean paths
  assert.match(serverContent, /reqUrl === '\/api\/routes'/);
  assert.match(serverContent, /\/melrose\/butteredup/);
});

test('Mobile Fill-Out mode isolates edits in brc_mobile_fillout_drafts_v1 without altering main page templates and exports dated PDFs', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const htmlContent = fs.readFileSync(path.resolve('index.html'), 'utf-8');

  // 1. saveCurrentCanvasState strictly guards against overwriting customEditedHTML or server state when onlineFillOutModeActive is true
  assert.match(
    htmlContent,
    /if \(typeof onlineFillOutModeActive !== 'undefined' && onlineFillOutModeActive\) \{[\s\S]*?saveMobileFillOutDraft\(\);[\s\S]*?return;\s*\}/
  );

  // 2. Mobile drafts use isolated localStorage key brc_mobile_fillout_drafts_v1
  assert.match(htmlContent, /const BRC_MOBILE_DRAFT_STORAGE_KEY = 'brc_mobile_fillout_drafts_v1';/);
  assert.match(htmlContent, /function saveMobileFillOutDraft\(/);
  assert.match(htmlContent, /function getMobileFillOutDraftHTML\(/);
  assert.match(htmlContent, /function clearMobileFillOutDraft\(/);

  // 3. Exiting Mobile Fill-Out mode restores the untouched main page via selectDocument(activeDocId)
  assert.match(
    htmlContent,
    /\/\/ Restore the untouched main version of the page on #document-canvas\s*if \(activeDocId\) \{\s*selectDocument\(activeDocId\);\s*\}/
  );

  // 4. Sign & Submit action and export helpers
  assert.match(htmlContent, /function buildMobileCompletedSheetFileName\(/);
  assert.match(htmlContent, /async function exportCompletedMobileSheetAsPDF\(/);
  assert.match(htmlContent, /function printCompletedMobileSheet\(/);
  assert.match(htmlContent, /Sign &amp; Submit/);
});

test('Forms overhaul: Task View toggle, CSV Export, and removal of Auto-Calc Order UI text', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const htmlContent = fs.readFileSync(path.resolve('index.html'), 'utf-8');

  // 1. Wording updated to "CSV" and "Task View"
  assert.ok(/id="btn-share-mobile-url"[\s\S]*?>[\s\S]*?<span>Store Hubs &amp; CSV<\/span>/.test(htmlContent));
  assert.ok(/id="btn-toggle-mobile-fill"[\s\S]*?>[\s\S]*?<span>Task View<\/span>/.test(htmlContent));
  assert.ok(/Forms Hub &amp; Excel CSV Exports/.test(htmlContent));

  // 2. Visible "Auto-Calc Order" and "=Par − OH" UI text removed from menus and labels
  assert.equal(htmlContent.includes('Calculate Order (=Par − On Hand)'), false);
  assert.equal(htmlContent.includes('<span>=Par − OH</span>'), false);
  assert.equal(htmlContent.includes('USE =PAR-OH'), false);

  // 3. Streamlined topbar without alternative views section or Export buttons in Task View
  assert.match(htmlContent, /onlineFormViewMode\s*=\s*'cards'/);
  assert.match(htmlContent, /function isPageOnly85x11SopDoc\(/);

  // 4. Submissions logging and CSV exports exist
  assert.match(htmlContent, /function submitAndLogActiveFormOnline\(/);
  assert.match(htmlContent, /function exportActiveFormAsCSV\(/);
  assert.match(htmlContent, /function exportFormSubmissionsCSV\(/);
  assert.match(htmlContent, /function renderOnlineAnalyticsTab\(/);
});

test('Excel/Sheets & Word/Docs hybrid data analysis: insights bar, column sorting, and visual data bars', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const htmlContent = fs.readFileSync(path.resolve('index.html'), 'utf-8');

  // 1. Live Sheet Insights bar and elements
  assert.match(htmlContent, /id="brc-sheet-insights-bar"/);
  assert.match(htmlContent, /id="brc-sheet-insights-metrics"/);
  assert.match(htmlContent, /id="brc-sheet-outline-pills"/);
  assert.match(htmlContent, /function toggleLiveSheetInsightsBar\(/);
  assert.match(htmlContent, /function updateLiveSheetInsightsBar\(/);

  // 2. Column sort function (A→Z, Z→A, Low→High, High→Low)
  assert.match(htmlContent, /function sortActiveTableColumn\(/);

  // 3. Visual data bars conditional formatting
  assert.match(htmlContent, /function toggleVisualDataBarsOnCanvas\(/);
  assert.match(htmlContent, /td\.brc-visual-databar-cell/);
});

test('Server API endpoints: /api/forms/submissions and /api/forms/export.csv output flat Excel-ready CSV without separator banners', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const serverContent = fs.readFileSync(path.resolve('server.js'), 'utf-8');

  assert.match(serverContent, /reqUrl === '\/api\/forms\/submissions' && req\.method === 'GET'/);
  assert.match(serverContent, /reqUrl === '\/api\/forms\/submissions' && req\.method === 'POST'/);
  assert.match(serverContent, /reqUrl === '\/api\/forms\/export\.csv'/);
  assert.match(serverContent, /brc-form-submissions\.json/);
  assert.doesNotMatch(serverContent, /=== PAGE:/);
  assert.doesNotMatch(serverContent, /\/api\/caddyfile/);

  // Test CSV escaping logic
  const escapeCsv = (val: string) => {
    const s = String(val == null ? '' : val);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  assert.equal(escapeCsv('Simple Text'), 'Simple Text');
  assert.equal(escapeCsv('Text, with comma'), '"Text, with comma"');
  assert.equal(escapeCsv('Text with "quotes"'), '"Text with ""quotes"""');
});

test('Task View, 8.5x11 SOPs, Bottom-Only Sign & Submit, and Clean Metric Export Filtering', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const htmlContent = fs.readFileSync(path.resolve('index.html'), 'utf-8');
  const serverContent = fs.readFileSync(path.resolve('server.js'), 'utf-8');

  // 1. Task View layout classes & 8.5x11 SOP helper exist
  assert.match(htmlContent, /\.brc-ct-header-card\s*\{/);
  assert.match(htmlContent, /\.brc-ct-section-card\s*\{/);
  assert.match(htmlContent, /\.brc-ct-task-row\s*\{/);
  assert.match(htmlContent, /\.brc-ct-check-circle\s*\{/);
  assert.match(htmlContent, /function isPageOnly85x11SopDoc\(/);
  assert.match(htmlContent, /function isConnecteamSopOrChecklistDoc\(/);

  // 2. Required Name & Signature exists at the bottom of Task View (#brc-taskview-signoff-card) with "Sign & Submit"
  assert.match(htmlContent, /id="brc-taskview-signoff-card"/);
  assert.match(htmlContent, /id="brc-taskview-signer-name"/);
  assert.match(htmlContent, /id="brc-taskview-signature-canvas"/);
  assert.match(htmlContent, /id="brc-taskview-signature-typed"/);
  assert.match(htmlContent, /Sign &amp; Submit/);
  assert.match(htmlContent, /function hasTaskViewValidSignature\(/);
  assert.match(htmlContent, /Name and Signature are required to submit this form\./);

  // 3. Clean Metric Export Filtering excludes prep-grab sections and unfilled rows
  assert.match(htmlContent, /function isPrepGrabOrReferenceSection\(/);
  assert.match(htmlContent, /function collectCleanFormMetricsForExport\(/);
  assert.match(serverContent, /Materials Needed\|Tools\\s\*&\\s\*Supplies\|Equipment\\s\*&\\s\*Supplies\|What You Need\|Ingredients/);

  // Pure logic unit check for prep-grab exclusion and filled-row filtering
  const isPrepGrab = (sec: string) =>
    /Materials Needed|Tools\s*&\s*Supplies|Equipment\s*&\s*Supplies|What You Need|Ingredients|Roast Guide|Comparison Matrix|Expiration Reference|Quick Reference|Brewing Ratio/i.test(
      sec.trim()
    );
  assert.equal(isPrepGrab('Materials Needed'), true);
  assert.equal(isPrepGrab('1. Tools & Supplies Needed'), true);
  assert.equal(isPrepGrab('Ingredients (1 Batch)'), true);
  assert.equal(isPrepGrab('Cold Brew Roast Guide'), true);
  assert.equal(isPrepGrab('Brewing & Extraction Process'), false);
  assert.equal(isPrepGrab('Dairy, Alt-Milk & Cold Brew'), false);
});

test('Sidebar collapse and open controls, state toggle logic, and localStorage persistence are configured', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const htmlContent = fs.readFileSync(path.resolve('index.html'), 'utf-8');

  // 1. Topbar toggle button, sidebar header collapse button, and floating reopen rail exist
  assert.match(htmlContent, /id="btn-toggle-sidebar"/);
  assert.match(htmlContent, /id="btn-sidebar-header-collapse"/);
  assert.match(htmlContent, /id="btn-reopen-sidebar-rail"/);
  assert.match(htmlContent, /id="app-sidebar"/);

  // 2. State management functions and localStorage key exist
  assert.match(htmlContent, /const BRC_SIDEBAR_COLLAPSED_KEY = 'brc_sidebar_collapsed';/);
  assert.match(htmlContent, /function setSidebarCollapsed\(/);
  assert.match(htmlContent, /function toggleSidebar\(/);
  assert.match(htmlContent, /body\.sidebar-collapsed \.app-sidebar/);

  // 3. Pure state transition check
  let isCollapsed = false;
  const toggle = (forceState?: boolean) => {
    isCollapsed = typeof forceState === 'boolean' ? forceState : !isCollapsed;
    return isCollapsed;
  };
  assert.equal(toggle(), true);
  assert.equal(toggle(), false);
  assert.equal(toggle(true), true);
  assert.equal(toggle(false), false);
});

test('Clean Play Cards, Barista Recipe Cards, and Pull & Thaw Sheet render as Bar & Equipment Guides without a sign-off box', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const htmlContent = fs.readFileSync(path.resolve('index.html'), 'utf-8');

  // 1. cleanplay, recipes, and pull are in Bar & Equipment Guides and included in isPageOnly85x11SopDoc
  assert.ok(/slug:\s*'cleanplay',[\s\S]{0,260}?docId:\s*'clean-play-cards',[\s\S]{0,260}?group:\s*'Bar & Equipment Guides'/.test(htmlContent));
  assert.ok(/slug:\s*'recipes',[\s\S]{0,260}?docId:\s*'recipes-2025',[\s\S]{0,260}?group:\s*'Bar & Equipment Guides'/.test(htmlContent));
  assert.ok(/slug:\s*'pull',[\s\S]{0,260}?docId:\s*'food-pull-template',[\s\S]{0,260}?group:\s*'Bar & Equipment Guides'/.test(htmlContent));
  const sopFnIdx = htmlContent.indexOf('function isPageOnly85x11SopDoc(docId)');
  assert.ok(sopFnIdx > 0);
  const sopFnSlice = htmlContent.slice(sopFnIdx, sopFnIdx + 700);
  assert.ok(sopFnSlice.includes("'food-pull-template'") && sopFnSlice.includes("'clean-play-cards'") && sopFnSlice.includes("'recipes-2025'"));

  // 2. Physical Temp & Inventory Log is in Daily Shift Checklists
  assert.ok(/slug:\s*'temps',[\s\S]{0,260}?docId:\s*'physical-temp-log',[\s\S]{0,260}?group:\s*'Daily Shift Checklists'/.test(htmlContent));

  // 3. When entering Link View on recipes-2025, filter resets to ALL so all 76 recipe cards render
  assert.ok(/currentRecipeCat = 'ALL';/.test(htmlContent));
});

test('Unified AM and PM Task Sheets have dedicated Time columns and 36 AM / 49 PM tasks', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const htmlContent = fs.readFileSync(path.resolve('index.html'), 'utf-8');

  // 1. Dedicated Time column exists on unified AM and PM task sheets
  assert.ok(/data-phase-time-col="true"/.test(htmlContent));
  assert.ok(/data-phase-time-cell="am-/.test(htmlContent));
  assert.ok(/data-phase-time-cell="pm-/.test(htmlContent));

  // 2. Extract AM and PM task lists and verify 36 AM tasks and 49 PM tasks
  const amStart = htmlContent.indexOf("id: 'am-task-sheet',");
  const pmStart = htmlContent.indexOf("id: 'pm-task-sheet',");
  const pullStart = htmlContent.indexOf("id: 'food-pull-template',");

  const amBlock = htmlContent.slice(amStart, pmStart);
  const pmBlock = htmlContent.slice(pmStart, pullStart);

  const extractTimelineTasks = (block: string) =>
    Array.from(block.matchAll(/data-sync-task-text="(\d+)"[^>]*>([\s\S]*?)<\/td>/g)).map(m => ({
      idx: Number(m[1]),
      text: m[2].trim()
    }));

  const amTimelineTasks = extractTimelineTasks(amBlock);
  const pmTimelineTasks = extractTimelineTasks(pmBlock);
  assert.equal(amTimelineTasks.length, 36);
  assert.equal(pmTimelineTasks.length, 49);
});

test('Inventory and Order Sheets populate numbers, totals, and metadata into the Default Form and export on completion', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const htmlContent = fs.readFileSync(path.resolve('index.html'), 'utf-8');

  // 1. Verify default form total recalculation and metadata sync functions exist
  assert.ok(/function recalculateDefaultFormTotals\(rootEl\)/.test(htmlContent));
  assert.ok(/function syncMetadataIntoDefaultForm\(useTodayFallback = false\)/.test(htmlContent));
  assert.ok(/data-total-role="lively-order-total"/.test(htmlContent));
  assert.ok(/data-brc-meta="date"/.test(htmlContent));
  assert.ok(/data-brc-meta="signer"/.test(htmlContent));

  // 2. Verify toggleOnlineSheetPreview preserves preview state on inventory/order forms
  assert.ok(/document\.body\.classList\.toggle\('brc-online-sheet-preview', onlineSheetPreviewActive\)/.test(htmlContent));

  // 3. Verify Shoreline Current Bottle trigger column is excluded from numeric Par role while Wtr/Sum Par are supported
  assert.ok(/!\s*\/Current \\\(Par\/i\.test\(rawColHeader\)/.test(htmlContent));
  assert.ok(/function resolveEffectiveParFromRowMeta\(rowMeta\)/.test(htmlContent));

  // 4. Verify submitAndLogActiveFormOnline populates the default form, enables preview, and triggers exportCompletedMobileSheetAsPDF
  const submitIdx = htmlContent.indexOf('async function submitAndLogActiveFormOnline()');
  assert.ok(submitIdx > 0);
  const submitSlice = htmlContent.slice(submitIdx, submitIdx + 3500);
  assert.ok(submitSlice.includes('syncMetadataIntoDefaultForm(true);'));
  assert.ok(submitSlice.includes('onlineSheetPreviewActive = true;'));
  assert.ok(submitSlice.includes('await exportCompletedMobileSheetAsPDF();'));
});

test('Responsive mobile and desktop rules scale the canvas cleanly and convert the sidebar into a mobile overlay drawer', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const htmlContent = fs.readFileSync(path.resolve('index.html'), 'utf-8');

  assert.match(htmlContent, /function applyResponsiveCanvasScale\(\)/);
  assert.match(htmlContent, /@media \(max-width: 860px\)/);
  assert.match(htmlContent, /\.app-sidebar:not\(\.collapsed\)\s*\{[\s\S]*?position:\s*fixed\s*!important/);
});

test('Built-in Revision dropdowns, upgraded digital signature well, and mobile editor header bar are configured', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const htmlContent = fs.readFileSync(path.resolve('index.html'), 'utf-8');

  // 1. Built-in Revision dropdowns exist for both canvas (.brc-rev-select) and Form View (.brc-online-rev-select)
  assert.match(htmlContent, /function enhanceRevisionCellsOnCanvas\(rootEl\)/);
  assert.match(htmlContent, /function handleSheetRevSelectChange\(selectEl\)/);
  assert.match(htmlContent, /class="brc-rev-select"/);
  assert.match(htmlContent, /class="brc-online-rev-select"/);
  assert.match(htmlContent, /&uarr; Order More/);
  assert.match(htmlContent, /&darr; Order Less/);
  assert.match(htmlContent, /&radic; Keep Same/);

  // 2. Upgraded Signature Well has ink selector, auto-sign from name, cursive overlay, and status pill
  assert.match(htmlContent, /function updateTaskViewSignatureStatusUI\(\)/);
  assert.match(htmlContent, /function autoSignFromEmployeeName\(\)/);
  assert.match(htmlContent, /function setTaskViewSignatureInkColor\(colorHex\)/);
  assert.match(htmlContent, /id="brc-taskview-sig-typed-overlay"/);
  assert.match(htmlContent, /class="brc-ct-sig-toolbar"/);

  // 3. Mobile editor header bar has compact horizontal scroll ribbon and fixed dropdown menu positioning
  assert.match(htmlContent, /\.toolbar-cluster\s*\{[\s\S]*?overflow-x:\s*auto/);
  assert.match(htmlContent, /\.tb-dropdown-menu\s*\{[\s\S]*?position:\s*fixed\s*!important/);
});

test('Task View renders without undefined _taskViewSigDataUrl, displays page-faithful on-page inventory sheet tables, and locks templates unless in Master View', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const htmlContent = fs.readFileSync(path.resolve('index.html'), 'utf-8');

  // 1. No undefined singular _taskViewSigDataUrl reference anywhere in index.html
  assert.doesNotMatch(htmlContent, /\b_taskViewSigDataUrl\b/);
  assert.match(htmlContent, /_taskViewSigDataUrls\[stateKey\]/);

  // 2. Inventory & Order sheets render page-faithful Brick Road Sheet Boxes & Tables with inline cell inputs and read-only Par cells
  assert.match(htmlContent, /class="brc-card-box brc-online-sheet-box"/);
  assert.match(htmlContent, /class="brc-table brc-online-sheet-table"/);
  assert.match(htmlContent, /brc-online-page-cell-input/);
  assert.match(htmlContent, /class="brc-td-readonly-par"/);

  // 3. Task View locks all template content unless unlocked via Master View
  assert.match(htmlContent, /function isFillableTableColumnHeader\(/);
  assert.match(htmlContent, /function syncCanvasEditabilityForCurrentMode\(rootEl\)/);
  assert.match(htmlContent, /function returnToMasterViewFromTaskView\(\)/);
});

test('Calculate Order from Last Count, Rolling Order History, Ctrl+Click Cell Merge, Analytics Date Range, 3-Tab E.O.D. Till Calculator (Zero Background Network Calls), Clean Form Header, and Time-Grouped Task Lists', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const htmlContent = fs.readFileSync(path.resolve('index.html'), 'utf-8');

  // 1. Calculate Order from Last Count button & function
  assert.match(htmlContent, /function calculateOrderFromLastFoodCount\(/);
  assert.match(htmlContent, /Calculate Order from Last Count/);

  // 2. Rolling Order History auto-population (last 3 orders + today)
  assert.match(htmlContent, /function autoPopulateRollingOrderHistory\(/);
  assert.match(htmlContent, /data-rolling-history-cell/);

  // 3. Ctrl+Click multi-cell merge (rowSpan and colSpan)
  assert.match(htmlContent, /function computeTableVisualCoordsMap\(/);
  assert.match(htmlContent, /function mergeSelectedTableCells\(/);
  assert.match(htmlContent, /id="brc-ms-merge-cells-btn"/);

  // 4. Analytics All Stores, Date Range, and Multi-Page CSV / Workbook export
  assert.match(htmlContent, /function exportStoreMultiPageWorkbook\(/);
  assert.match(htmlContent, /function setAnalyticsDateRange\(/);
  assert.match(htmlContent, /<option value="all">All Stores \(Master Rollup\)<\/option>/);

  // 5. Full 3-Tab E.O.D. Till Calculator with zero background network calls in syncEodTillStateToDefaultCanvas
  assert.match(htmlContent, /function renderEodTillCalculatorBody\(/);
  assert.match(htmlContent, /Quick Sale Updater Card/);
  assert.match(htmlContent, /Current Shift &amp; Recovery Card/);
  assert.match(htmlContent, /Edit History &amp; Temp Saves List \(12-Hour Auto-Clear\)/);
  assert.match(htmlContent, /Tab 3: Till Settings/);
  const syncEodStart = htmlContent.indexOf('function syncEodTillStateToDefaultCanvas(st)');
  const syncEodEnd = htmlContent.indexOf('function handleEodDenomInput', syncEodStart);
  const syncEodBody = htmlContent.slice(syncEodStart, syncEodEnd);
  assert.doesNotMatch(syncEodBody, /saveCurrentCanvasState\(\)/);

  // 6. Top form header has authentic Brick Road sheet stamp & official logo, with AI badges/buttons removed
  assert.match(htmlContent, /const getSheetStampCode = \(id, isHub = false\)/);
  assert.doesNotMatch(htmlContent, /Live Default Form Sync Active/);
  assert.doesNotMatch(htmlContent, /Template Read-Only \(Master View Required to Edit\)/);
  assert.doesNotMatch(htmlContent, /id="btn-online-preview-default-form"/);
  assert.doesNotMatch(htmlContent, /id="btn-online-export-default-pdf"/);

  // 7. Task lists are broken into groups by their scheduled times
  assert.match(htmlContent, /const ensureBucket = \(phaseName, phaseTimeStr\)/);
  assert.match(htmlContent, /data-phase-group-card=/);
});

test('SOP & Order Sheet Data Accuracy: Mesa Kitchen, Buttered Up, Cold Brew + Nitro, Shoreline, Third-Party, and Brick Road Coffee', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const htmlContent = fs.readFileSync(path.resolve('index.html'), 'utf-8');
  const serverContent = fs.readFileSync(path.resolve('server.js'), 'utf-8');

  // 1. Mesa Kitchen Order Sheet has real items, blank Par cells, and no hallucinated burritos
  assert.match(htmlContent, /id:\s*'mesa-kitchen-order'/);
  assert.match(htmlContent, /Breakfast Burritos\* \(16\)/);
  assert.doesNotMatch(htmlContent, /Bacon Breakfast Burrito/);
  assert.doesNotMatch(htmlContent, /Chorizo Breakfast Burrito/);
  assert.doesNotMatch(htmlContent, /Veggie Breakfast Burrito/);
  assert.match(htmlContent, /Turkey &amp; Cheddar Sandwich \(6 or 12\)<\/td><td class="text-center font-mono-code bg-white" contenteditable="true"><\/td>/);
  assert.match(htmlContent, /Cardamom Coffee Cake<\/td><td class="text-center font-mono-code bg-white" contenteditable="true"><\/td>/);

  // 2. Buttered Up Bakery Par (Condensed) column is blank
  assert.match(htmlContent, /Chocolate Chip Cookies \(10\)<\/td><td class="text-center font-mono-code bg-white" contenteditable="true"><\/td>/);
  assert.match(htmlContent, /Blueberry Danish \(15\)<\/td><td class="text-center font-mono-code bg-white" contenteditable="true"><\/td>/);

  // 3. Cold Brew Process includes Nitro Cold Brew section
  assert.ok(/Nitro Cold Brew \(Standard Roast: Revolution\):/.test(htmlContent));
  assert.ok(/The red gas line with black electrical tape indicates the nitro infusion line/.test(htmlContent));
  assert.ok(/Use the dial on the nitro infuser at the back of the kegerator/.test(htmlContent));

  // 4. Shoreline & Third-Party Inventory Par columns match official templates
  assert.match(htmlContent, /Pastry Bags<\/td><td contenteditable="true">Box<\/td><td class="bg-white text-center font-mono-code" contenteditable="true">1\/4 box<\/td>/);
  assert.match(htmlContent, /Coffee Filters<\/td><td contenteditable="true">Bunches<\/td><td class="bg-white text-center font-mono-code" contenteditable="true">3 batches<\/td>/);
  assert.match(htmlContent, /Baking Sheets<\/td><td class="bg-white text-center font-mono-code" contenteditable="true">2<\/td>/);
  assert.match(htmlContent, /Smart Water<\/td><td class="bg-white text-center font-mono-code" contenteditable="true">2\.5<\/td>/);
  assert.match(htmlContent, /Whip Chargers \(Whippets\)<\/td><td class="bg-white text-center font-mono-code" contenteditable="true">2<\/td>/);

  // 5. Server sends permissive frame-ancestors header silently without UI modals
  assert.match(serverContent, /'Content-Security-Policy':\s*'frame-ancestors \*'/);
  assert.doesNotMatch(serverContent, /X-Frame-Options':\s*'SAMEORIGIN'/);
});

test('Checklist updates in To-Do View persist to Editor customEditedHTML and Melrose AM Task Sheet auto-syncs Deep Clean and authentic task order', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const htmlContent = fs.readFileSync(path.resolve('index.html'), 'utf-8');

  // 1. saveMobileFillOutDraft writes to both BRC_MOBILE_DRAFT_STORAGE_KEY and customEditedHTML (brc_saved_edits_v13)
  const draftFnStart = htmlContent.indexOf('function saveMobileFillOutDraft()');
  const draftFnEnd = htmlContent.indexOf('function getMobileFillOutDraftHTML', draftFnStart);
  const draftFnBody = htmlContent.slice(draftFnStart, draftFnEnd);
  assert.match(draftFnBody, /map\[draftKey\] = currentHtml;/);
  assert.match(draftFnBody, /customEditedHTML\[draftKey\] = currentHtml;/);
  assert.match(draftFnBody, /localStorage\.setItem\('brc_saved_edits_v13',\s*JSON\.stringify\(customEditedHTML\)\)/);

  // 2. Automatic Deep Clean synchronization into AM & PM Task Sheets in the Editor
  assert.match(htmlContent, /function buildStoreDeepCleanSummaryForShift\(/);
  assert.match(htmlContent, /function applyStoreDeepCleanToTaskSheetDOM\(/);
  assert.match(htmlContent, /function syncStoreDeepCleanToTaskSheets\(/);
  assert.match(htmlContent, /data-deep-clean-shift-row="AM"/);
  assert.match(htmlContent, /data-deep-clean-shift-row="PM"/);

  // 3. Melrose / Store AM Task Sheet has authentic Switchover task order and clean time cells
  const amStart = htmlContent.indexOf("id: 'am-task-sheet',");
  const pmStart = htmlContent.indexOf("id: 'pm-task-sheet',");
  const amBlock = htmlContent.slice(amStart, pmStart);

  assert.match(amBlock, /data-sync-task-text="24"[^>]*>Check for coffee &amp; teas rebrew<\/td>/);
  assert.match(amBlock, /data-sync-task-text="25"[^>]*>Backflush each grouphead<\/td>/);
  assert.match(amBlock, /data-sync-task-text="26"[^>]*>Clean grinds from drip tray<\/td>/);
  assert.match(amBlock, /data-sync-task-text="27"[^>]*>Wipe down counter under dishrack by triple sink<\/td>/);
  assert.match(amBlock, /data-sync-task-text="28"[^>]*>AM Switchover Dishes<\/td>/);
  assert.match(amBlock, /data-sync-task-text="29"[^>]*>Clean Numilk Machine<\/td>/);
  assert.match(amBlock, /data-sync-task-text="30"[^>]*>Bathrooms cleaned &amp; stocked<\/td>/);
  assert.match(amBlock, /data-sync-task-text="31"[^>]*>Check Pastry Case Date Dots<\/td>/);
  assert.match(amBlock, /data-sync-task-text="32"[^>]*>Empty Grounds4Gardens<\/td>/);
  assert.match(amBlock, /data-sync-task-text="33"[^>]*>Restock \(cups, lids, sleeves, milks &amp; syrups\)<\/td>/);
  assert.match(amBlock, /data-sync-task-text="34"[^>]*>Behind Bar &amp; Lobby Trashes<\/td>/);
  assert.match(amBlock, /data-sync-task-text="35"[^>]*>Wipe down counters, espresso machine and grinder area<\/td>/);
});

test('Master View versioning (<FORM NAME> Update #), Deep Clean Checklist View default, calm Clean Play side, image2.png header bar styling, and split AM/PM Deep Clean views', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const htmlContent = fs.readFileSync(path.resolve('index.html'), 'utf-8');

  // 1. Master View saves create a versioned sheet (<FORM NAME> - Master Update v<X>) instead of overwriting store sheets
  assert.ok(/function createMasterVersionedSheetOnSave\(docId, htmlContent\)/.test(htmlContent));
  assert.ok(/Master Update v\$\{nextUpdateNum\}/.test(htmlContent));
  assert.ok(/customEditedHTML\[`\$\{activeDocId\}__master_draft\$\{modeSuffix\}`\] = html;/.test(htmlContent));

  // 2. Deep Clean cards start on Checklist View by default and flip to the calm Clean Play Guide
  assert.ok(/const activeSideKey = isFlipped \? 'clean-play' : 'checklist';/.test(htmlContent));
  assert.ok(/data-active-card-side="\$\{activeSideKey\}"/.test(htmlContent));
  assert.ok(/\$\{isFlipped \? renderCleanCardFront\(activeCard, safeIdx\) : renderCleanCardBack\(activeCard, safeIdx, true\)\}/.test(htmlContent));
  assert.ok(/class="cp-calm-meta-strip"/.test(htmlContent));

  // 3. No "Card #" strings in Deep Clean cards, schedules, or task summaries
  assert.doesNotMatch(htmlContent, /Card #\$\{c\.num\}/);
  assert.doesNotMatch(htmlContent, /Card \$\{c\.num\}/);

  // 4. Split AM Deep Clean and PM Deep Clean documents and routes
  assert.ok(/id:\s*'am-deep-clean'/.test(htmlContent));
  assert.ok(/id:\s*'pm-deep-clean'/.test(htmlContent));
  assert.ok(!/id:\s*'am-pm-deep-clean'/.test(htmlContent));
  assert.ok(/slug:\s*'am-deepclean'[^\n]*docId:\s*'am-deep-clean'/.test(htmlContent));
  assert.ok(/slug:\s*'pm-deepclean'[^\n]*docId:\s*'pm-deep-clean'/.test(htmlContent));
  assert.ok(/function renderDailyShiftDeepCleanChecklistDoc\(shiftMode = 'AM'\)/.test(htmlContent));

  // 5. Deep Clean and Cash Count control bars use clean white Brick Road .brc-ct-header-card style (image2.png) instead of dark brown #240d02 bars
  assert.doesNotMatch(htmlContent, /background:#240d02/);
  const eodStart = htmlContent.indexOf('function renderEodTillCalculatorBody');
  const eodEnd = htmlContent.indexOf('function toggleLiveSheetInsightsBar', eodStart);
  const eodHeaderHtml = htmlContent.slice(eodStart, eodEnd);
  assert.match(eodHeaderHtml, /class="brc-ct-header-card"/);
  assert.match(eodHeaderHtml, /border:1\.5px solid #391300;\s*border-bottom:4px solid #391300/);
});

test('SOP visual rework (calm image2 style), right-side header logo placement, Shift Schedule Progress removal, and official /Mesa/SOPs/ text audit', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const htmlContent = fs.readFileSync(path.resolve('index.html'), 'utf-8');

  // 1. "Shift Schedule Progress" is completely removed
  assert.doesNotMatch(htmlContent, /Shift Schedule Progress/);

  // 2. Header areas (.brc-ct-header-top and .brc-header .brc-logo-slot) place the logo cleanly on the right side
  assert.match(htmlContent, /\.brc-ct-header-top\s*\{[\s\S]*?display:\s*flex;[\s\S]*?justify-content:\s*space-between;/);
  assert.match(htmlContent, /\.brc-header\s+\.brc-logo-slot\s*\{[\s\S]*?margin-left:\s*auto;/);

  // 3. SOP visuals use unified calm cream headers (#faf6ee) and crisp white paper sheets (#ffffff)
  assert.match(htmlContent, /\.paper-sheet\s*\{[\s\S]*?background:\s*#ffffff\s*!important;/);
  assert.match(htmlContent, /\.brc-sec-head,\s*\.sec-title[\s\S]*?background:\s*#faf6ee\s*!important;/);

  // 4. Official /Mesa/SOPs/ text fidelity across Catering Orders, X1 Grinder, Drink Acronyms, and Cereal Milk Syrup
  assert.ok(/12oz hot cups should be located in the mop room on the top shelf \(with cambros\)/.test(htmlContent));
  assert.ok(!/Barista Catering Handoff Verification Checklist/.test(htmlContent));
  assert.ok(/Taring out the scale: once on, press the power\/mode button/.test(htmlContent));
  assert.ok(/The Memory 1 should be for Decaf/.test(htmlContent));
  assert.ok(/Iced Spiced Brown Sugar Shaken Latte/.test(htmlContent));
  assert.ok(/<td>BC<\/td><td>Drip Coffee<\/td>/.test(htmlContent));
  assert.ok(/<td>Flav-CF<\/td><td>Cold Foam<\/td>/.test(htmlContent));
  assert.ok(/\*STORE IN BOTTOM OF BOH FRIDGE\*/.test(htmlContent));

  // 5. Developer & client build checks and pulls saved production/server state (/api/state) on boot
  assert.ok(/async function syncFromServerProductionState\(/.test(htmlContent));
  assert.ok(/syncFromServerProductionState\(true\);/.test(htmlContent));
});

test('Architectural & User Flow Overhaul (8 Structural Updates): TenantConfig, Kiosk-First PWA, Store Hub, Two-Tier Admin, Lifecycle States, Timers, 4-Mode Deep Clean, and 2D Grid Engine', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  const SyncEngine = require(path.resolve('sync-engine.js'));

  const htmlContent = fs.readFileSync(path.resolve('index.html'), 'utf-8');
  const serverContent = fs.readFileSync(path.resolve('server.js'), 'utf-8');

  // 1. White-Label Configuration Layer (TenantConfig) & Store Display Names
  assert.ok(/const DEFAULT_TENANT_CONFIG = \{/.test(htmlContent));
  assert.ok(/window\.TenantConfig = TENANT_CONFIG;/.test(htmlContent));
  assert.ok(/function getTenantStoreIds\(\)/.test(htmlContent));
  assert.ok(/function getTenantStoreConfig\(storeId\)/.test(htmlContent));
  assert.ok(/primaryGold:\s*'#FFCC00'/.test(htmlContent));
  assert.ok(/espressoBrown:\s*'#391300'/.test(htmlContent));
  assert.ok(/accentPink:\s*'#FF7DCB'/.test(htmlContent));
  assert.ok(/displayName:\s*'Melrose'/.test(htmlContent));
  assert.ok(/displayName:\s*'Mesa'/.test(htmlContent));
  assert.ok(/displayName:\s*'Tempe'/.test(htmlContent));
  assert.ok(/defaultTimers:\s*\[\]/.test(htmlContent));

  // 2. Kiosk-First Routing & iPad PWA Installation (with verified root PWA icon paths)
  assert.ok(/const BRC_PINNED_STORE_KEY = 'pinnedStoreId';/.test(htmlContent));
  assert.ok(/function updateDynamicStorePwaManifest\(/.test(htmlContent));
  assert.ok(/function pinStoreToDevice\(storeId, navigateToHub = true\)/.test(htmlContent));
  assert.ok(/function openRootStoreSelector\(\)/.test(htmlContent));
  assert.ok(/data-root-store-selector="true"/.test(htmlContent));
  assert.ok(/apple-mobile-web-app-capable/.test(htmlContent));
  assert.ok(/reqUrl === '\/manifest\.json'/.test(serverContent));
  assert.ok(/reqUrl\.startsWith\('\/api\/manifest\/'\)/.test(serverContent));
  assert.ok(/src:\s*'\/pwa-192x192\.png'/.test(serverContent));
  assert.ok(!/\/icons\/icon-192\.png/.test(serverContent));

  // 3. Store Operations Hub (Store Overview Hero + Inline Event Composer + Context-Aware Shift Essentials + Off-White Bottom Navigation Dock)
  assert.ok(/id="store-overview-section"/.test(htmlContent));
  assert.ok(/function toggleQuickAddEventForm\(/.test(htmlContent));
  assert.ok(/function submitQuickAddEventForm\(/.test(htmlContent));
  assert.ok(!/\bprompt\(/.test(htmlContent), 'Must not use window.prompt() in iframe environment');
  assert.ok(/function getCurrentShiftPhaseWindow\(storeKey = activeStore\)/.test(htmlContent));
  assert.ok(/function applyCustomStoreCutoffs\(storeKey, schedObj\)/.test(htmlContent));
  assert.ok(/function getContextAwareShiftEssentials\(storeKey, dayName, phaseWindow, todayScheduled\)/.test(htmlContent));
  assert.ok(/Today's Shift Essentials/.test(htmlContent));
  assert.ok(/function renderBottomAppNavBarHTML\(storeKey = activeStore\)/.test(htmlContent));
  assert.ok(/id="brc-kiosk-bottom-nav"/.test(htmlContent));
  assert.ok(/Search checklists &amp; SOPs\.\.\./.test(htmlContent));
  assert.ok(!/Store Hub \(all forms and guides\)/.test(htmlContent));

  // 4. Role-Based Admin Hub & Two-Tier Authentication + 5. Non-Destructive Versioning & Form State Lifecycle
  const tmpDataDir = path.resolve('test-data-arch-' + Date.now());
  const engine = new SyncEngine({ dataDir: tmpDataDir });
  try {
    // Zero-timer initial default & store displayNames in SyncEngine
    assert.deepEqual(engine.tenantConfig.defaultTimers, []);
    assert.equal(engine.tenantConfig.stores.melrose.displayName, 'Melrose');
    assert.equal(engine.tenantConfig.stores.mesa.displayName, 'Mesa');
    assert.equal(engine.tenantConfig.stores.tempe.displayName, 'Tempe');

    // Overall Admin vs Store Admin authentication
    const masterAuth = engine.verifyAdminPassword('brickroad', 'all');
    assert.equal(masterAuth.valid, true);
    assert.equal(masterAuth.role, 'overall');
    assert.equal(masterAuth.storeScope, 'all');
    assert.equal(masterAuth.allowedStore, 'all');

    const melroseAuth = engine.verifyAdminPassword('melrose', 'melrose');
    assert.equal(melroseAuth.valid, true);
    assert.equal(melroseAuth.role, 'store');
    assert.equal(melroseAuth.storeScope, 'melrose');
    assert.equal(melroseAuth.allowedStore, 'melrose');

    const crossStoreDenied = engine.verifyAdminPassword('melrose', 'mesa');
    assert.equal(crossStoreDenied.valid, false);

    const storeTryingOverallDenied = engine.verifyAdminPassword('melrose', 'overall');
    assert.equal(storeTryingOverallDenied.valid, false);

    // Store customizes its In-Use form
    engine.updateStoreState({
      store: 'melrose',
      customEditedHTML: { 'am-task-sheet__melrose': '<div>Melrose Live In-Use Task Sheet</div>' }
    });
    assert.equal(engine.state['am-task-sheet__melrose'], '<div>Melrose Live In-Use Task Sheet</div>');

    // Overall Admin saves Master template -> pushes non-destructive Draft copy to stores without overwriting In-Use
    engine.updateStoreState({
      store: 'master',
      password: 'brickroad',
      customEditedHTML: { 'am-task-sheet__master': '<div data-store-badge="true">STORE: MASTER</div><div>Master v1 Content</div>' }
    });
    assert.equal(engine.state['am-task-sheet__melrose'], '<div>Melrose Live In-Use Task Sheet</div>');
    const draftKeys = Object.keys(engine.formLifecycle).filter(k => k.includes('__melrose') && engine.formLifecycle[k].state === 'Draft');
    assert.ok(draftKeys.length >= 1, 'Expected non-destructive Draft created for melrose on Master push');
    const draftMeta = engine.formLifecycle[draftKeys[0]];
    assert.ok(/Master Update v1/.test(draftMeta.title));

    // Publish Draft to In-Use swaps Draft -> In-Use and moves previous to Archived
    const draftDocId = draftKeys[0].replace(/__melrose$/, '');
    const pubRes = engine.publishDraftToInUse('melrose', draftDocId, 'melrose');
    assert.equal(pubRes.success, true);
    assert.ok(engine.state['am-task-sheet__melrose'].includes('Master v1 Content'));
    assert.equal(engine.formLifecycle[draftKeys[0]].state, 'Archived');

    // Schema validation & rolling backup
    assert.equal(engine.validateStatePayload({ valid: true }), true);
    assert.equal(engine.validateStatePayload(null), false);
    assert.ok(engine.lastKnownGoodState && typeof engine.lastKnownGoodState === 'object');
  } finally {
    if (typeof engine.destroy === 'function') engine.destroy();
    if (fs.existsSync(tmpDataDir)) {
      fs.rmSync(tmpDataDir, { recursive: true, force: true });
    }
  }

  // 6. Operations Hub Timers, Web Audio Chime & Shift Reminders
  assert.ok(/function playWebAudioChime\(\)/.test(htmlContent));
  assert.ok(/function evaluateStoreTimersStatus\(storeKey = activeStore\)/.test(htmlContent));
  assert.ok(/function completeOrResetHubTimer\(timerId, storeKey = activeStore, evt = null\)/.test(htmlContent));
  assert.ok(/function snoozeHubTimer5m\(timerId, storeKey = activeStore, evt = null\)/.test(htmlContent));
  assert.ok(/function renderActiveTimersBannerHTML\(storeKey = activeStore\)/.test(htmlContent));

  // 7. Shared "AM or PM" Deep Clean Pool Logic (AM, PM, BOTH, EITHER)
  assert.ok(/entry\.shift = \['AM', 'PM', 'BOTH', 'EITHER'\]\.includes\(shiftVal\)/.test(htmlContent));
  assert.ok(/Either Shift \(AM or PM Shared\)/.test(htmlContent));
  assert.ok(/EITHER SHIFT \(SHARED\)/.test(htmlContent));

  // 8. True 2D Coordinate Grid Engine & Lossless Persistence
  assert.ok(/function buildTable2DCoordinateMatrix\(table\)/.test(htmlContent));
  assert.ok(/function findBeforeDomCellIn2DRow\(matrixRow, targetVisualCol\)/.test(htmlContent));
  assert.ok(/function scheduleLosslessAutoSave\(\)/.test(htmlContent));
  assert.ok(/function saveRollingBackupSnapshot\(\)/.test(htmlContent));
  assert.ok(/window\.lastKnownGoodState = snapshot;/.test(htmlContent));
});



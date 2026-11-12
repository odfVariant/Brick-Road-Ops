const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_TENANT_CONFIG = {
  tenantId: 'brick-road-coffee',
  brandName: 'Brick Road Coffee',
  brandShortName: 'BRC',
  brandTagline: 'Operations Hub & Binder Studio',
  brandColors: {
    yellow: '#FFCC00',
    espresso: '#391300',
    pink: '#FF7DCB',
    cream: '#FAF5EB',
    sage: '#A7D7C5',
    orange: '#FF6B35'
  },
  shiftPhases: {
    amEnd: '13:30',
    switchoverEnd: '14:00'
  },
  stores: {
    melrose: {
      id: 'melrose',
      name: 'Melrose',
      displayName: 'Melrose',
      shortName: 'BRC Melrose',
      badge: 'STORE: MELROSE (7TH AVE)',
      location: 'Phoenix — 7th Ave & Glenrosa',
      hours: 'Mon–Thu: 6:00 AM – 6:00 PM | Fri: 6:00 AM – 9:00 PM | Sat: 7:00 AM – 9:00 PM | Sun: 7:00 AM – 2:00 PM',
      address: '635 W Glenrosa Ave, Ste 109, Phoenix, AZ 85013',
      espressoMachine: 'La Marzocco KB90 (3-Group)',
      grinders: 'Mahlkönig E80S GbW + EK43S + HeyCafé X1',
      brewer: 'Curtis G4 Twin 1.5 Gal',
      coldBrewSystem: '5-Gal Toddy Commercial + Nitro Draft',
      safeDropTarget: '$200.00 Till Base',
      wifiName: 'BrickRoad_Guest / BRC_Staff_Melrose',
      managerLead: 'Melrose Store Lead',
      shiftCutoffs: { amEnd: '13:30', switchoverEnd: '14:00' }
    },
    mesa: {
      id: 'mesa',
      name: 'Mesa',
      displayName: 'Mesa',
      shortName: 'BRC Mesa',
      badge: 'STORE: MESA (MAIN ST)',
      location: 'Mesa — Gilbert Rd & Southern',
      hours: '6:00 AM – 8:00 PM Daily',
      address: '1337 South Gilbert Rd, Ste 120, Mesa, AZ 85204',
      espressoMachine: 'La Marzocco Linea PB (2-Group)',
      grinders: 'Mahlkönig E65S GbW + EK43 + HeyCafé X1',
      brewer: 'Curtis G4 Single 1.0 Gal',
      coldBrewSystem: '5-Gal Toddy Commercial + Keg Fridge',
      safeDropTarget: '$200.00 Till Base',
      wifiName: 'BrickRoad_Guest / BRC_Staff_Mesa',
      managerLead: 'Mesa Store Lead',
      shiftCutoffs: { amEnd: '13:30', switchoverEnd: '14:00' }
    },
    tempe: {
      id: 'tempe',
      name: 'Tempe',
      displayName: 'Tempe',
      shortName: 'BRC Tempe',
      badge: 'STORE: TEMPE (UNIVERSITY)',
      location: 'Tempe — Rural Rd & Baseline',
      hours: '7:00 AM – 10:00 PM Daily',
      address: '4415 S Rural Rd, Ste 10, Tempe, AZ 85282',
      espressoMachine: 'Synesso MVP Hydra (3-Group)',
      grinders: 'Mahlkönig E80S GbW + Peak + HeyCafé X1',
      brewer: 'Fetco CBS-2132XTS Twin',
      coldBrewSystem: 'Dual 5-Gal Toddy + 4-Tap Draft Tower',
      safeDropTarget: '$200.00 Till Base',
      wifiName: 'BrickRoad_Guest / BRC_Staff_Tempe',
      managerLead: 'Tempe Store Lead',
      shiftCutoffs: { amEnd: '13:30', switchoverEnd: '14:00' }
    }
  },
  defaultTimers: []
};

class SyncEngine {
  constructor(options = {}) {
    this.rootDir = options.rootDir || __dirname;

    // Choose data directory: prefer ./data inside rootDir so state persists in workspace
    let chosenDataDir = path.join(this.rootDir, 'data');
    if (options.dataDir) {
      chosenDataDir = options.dataDir;
    } else if (process.env.BRC_DATA_DIR) {
      chosenDataDir = process.env.BRC_DATA_DIR;
    } else {
      try {
        if (!fs.existsSync(chosenDataDir)) {
          fs.mkdirSync(chosenDataDir, { recursive: true });
        }
        fs.accessSync(chosenDataDir, fs.constants.W_OK);
      } catch (_) {
        chosenDataDir = path.join(os.tmpdir(), 'brc-data');
        try {
          fs.mkdirSync(chosenDataDir, { recursive: true });
        } catch (__) {}
      }
    }

    this.dataDir = chosenDataDir;
    this.dataFile = options.dataFile || process.env.BRC_DATA_FILE || path.join(this.dataDir, 'brc-live-state.json');
    this.backupFile = path.join(this.dataDir, 'brc-live-state.backup.json');

    this.state = {};
    this.customDocsRegistry = [];
    this.formLifecycle = {};
    this.tenantConfig = JSON.parse(JSON.stringify(DEFAULT_TENANT_CONFIG));
    this.lastKnownGoodState = null;
    this.version = 1;
    this.updatedAt = new Date().toISOString();
    this.clients = new Set();

    // Default Overall Master password 'brickroad', overridable via env var BRC_MASTER_PASSWORD
    this.defaultMasterPassword = process.env.BRC_MASTER_PASSWORD || 'brickroad';
    this.masterPasswordHash = this.hashPassword(this.defaultMasterPassword);

    // Default Store-Specific Admin passwords ('melrose', 'mesa', 'tempe')
    this.storePasswordHashes = {
      melrose: this.hashPassword(process.env.BRC_STORE_PASSWORD_MELROSE || 'melrose'),
      mesa: this.hashPassword(process.env.BRC_STORE_PASSWORD_MESA || 'mesa'),
      tempe: this.hashPassword(process.env.BRC_STORE_PASSWORD_TEMPE || 'tempe')
    };

    this.init();
  }

  destroy() {
    for (const client of this.clients) {
      try { client.res.end(); } catch (_) {}
    }
    this.clients.clear();
  }

  hashPassword(pwd) {
    return crypto.createHash('sha256').update(String(pwd || '').trim()).digest('hex');
  }

  getStoreIds() {
    if (this.tenantConfig && this.tenantConfig.stores && typeof this.tenantConfig.stores === 'object') {
      const ids = Object.keys(this.tenantConfig.stores);
      if (ids.length > 0) return ids;
    }
    return ['melrose', 'mesa', 'tempe'];
  }

  init() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      this.load();
    } catch (err) {
      console.warn('[SyncEngine] Warning initializing data directory:', err.message);
    }
  }

  validateStatePayload(parsed) {
    if (!parsed || typeof parsed !== 'object') return false;
    const st = parsed.state || parsed.customEditedHTML || parsed;
    if (!st || typeof st !== 'object' || Array.isArray(st)) return false;
    return true;
  }

  load() {
    const tryLoadFile = (filePath) => {
      if (!fs.existsSync(filePath)) return null;
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw);
      return this.validateStatePayload(parsed) ? parsed : null;
    };

    try {
      let parsed = null;
      try {
        parsed = tryLoadFile(this.dataFile);
      } catch (primaryErr) {
        console.warn('[SyncEngine] Primary state file unreadable, attempting backup recovery:', primaryErr.message);
      }
      if (!parsed) {
        try {
          parsed = tryLoadFile(this.backupFile);
          if (parsed) {
            console.log('[SyncEngine] Recovered state from rolling backup file:', this.backupFile);
          }
        } catch (_) {}
      }

      if (parsed && typeof parsed === 'object') {
        this.state = parsed.state || parsed.customEditedHTML || parsed || {};
        if (Array.isArray(parsed.customDocsRegistry)) {
          this.customDocsRegistry = parsed.customDocsRegistry;
        }
        if (parsed.formLifecycle && typeof parsed.formLifecycle === 'object') {
          this.formLifecycle = parsed.formLifecycle;
        }
        if (parsed.tenantConfig && typeof parsed.tenantConfig === 'object') {
          this.tenantConfig = {
            ...JSON.parse(JSON.stringify(DEFAULT_TENANT_CONFIG)),
            ...parsed.tenantConfig,
            stores: {
              ...DEFAULT_TENANT_CONFIG.stores,
              ...(parsed.tenantConfig.stores || {})
            }
          };
        }
        this.version = parsed.version || 1;
        this.updatedAt = parsed.updatedAt || new Date().toISOString();
        if (parsed.masterPasswordHash && !process.env.BRC_MASTER_PASSWORD) {
          this.masterPasswordHash = parsed.masterPasswordHash;
        }
        if (parsed.storePasswordHashes && typeof parsed.storePasswordHashes === 'object') {
          this.storePasswordHashes = {
            ...this.storePasswordHashes,
            ...parsed.storePasswordHashes
          };
        }
        this.lastKnownGoodState = JSON.parse(JSON.stringify({
          version: this.version,
          updatedAt: this.updatedAt,
          customDocsRegistry: this.customDocsRegistry,
          formLifecycle: this.formLifecycle,
          tenantConfig: this.tenantConfig,
          state: this.state
        }));
        console.log(`[SyncEngine] Loaded ${Object.keys(this.state).length} state keys from ${this.dataFile} (v${this.version})`);
      }
    } catch (err) {
      console.error('[SyncEngine] Error loading state from disk:', err.message);
    }
  }

  save() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      const payload = {
        version: this.version,
        updatedAt: this.updatedAt,
        masterPasswordHash: this.masterPasswordHash,
        storePasswordHashes: this.storePasswordHashes,
        customDocsRegistry: this.customDocsRegistry,
        formLifecycle: this.formLifecycle,
        tenantConfig: this.tenantConfig,
        state: this.state
      };
      if (!this.validateStatePayload(payload)) {
        console.error('[SyncEngine] Aborting save: payload failed schema validation');
        return false;
      }
      const serialized = JSON.stringify(payload, null, 2);
      // Save rolling backup snapshot before replacing main file
      if (this.lastKnownGoodState) {
        try {
          const backupTmp = `${this.backupFile}.tmp.${Date.now()}`;
          fs.writeFileSync(backupTmp, JSON.stringify(this.lastKnownGoodState, null, 2), 'utf8');
          fs.renameSync(backupTmp, this.backupFile);
        } catch (_) {}
      }
      // Atomic write: write to temp file then rename to avoid corruption
      const tmpFile = `${this.dataFile}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpFile, serialized, 'utf8');
      fs.renameSync(tmpFile, this.dataFile);
      this.lastKnownGoodState = JSON.parse(serialized);
      return true;
    } catch (err) {
      console.error('[SyncEngine] Error saving state to disk:', err.message);
      return false;
    }
  }

  verifyMasterPassword(pwd) {
    if (!pwd) return false;
    return this.hashPassword(pwd) === this.masterPasswordHash;
  }

  verifyAdminPassword(pwd, requestedScope = '') {
    if (!pwd) {
      return { valid: false, role: null, storeScope: null, allowedStore: null, unlocked: false };
    }
    const cleanPwd = String(pwd).trim();
    const hashed = this.hashPassword(cleanPwd);

    // 1. Check Overall Master Password first
    if (hashed === this.masterPasswordHash) {
      return {
        valid: true,
        role: 'overall',
        storeScope: 'all',
        allowedStore: 'all',
        unlocked: true
      };
    }

    const normScope = String(requestedScope || '').toLowerCase().trim();

    // If explicitly requesting Overall/Master tier, store passwords are not valid
    if (normScope === 'overall' || normScope === 'master') {
      return { valid: false, role: null, storeScope: null, allowedStore: null, unlocked: false };
    }

    // 2. If a specific store scope was requested, enforce strict matching against that store only
    if (normScope && normScope !== 'all') {
      if (this.storePasswordHashes[normScope] && hashed === this.storePasswordHashes[normScope]) {
        return {
          valid: true,
          role: 'store',
          storeScope: normScope,
          allowedStore: normScope,
          unlocked: true
        };
      }
      return { valid: false, role: null, storeScope: null, allowedStore: null, unlocked: false };
    }

    // 3. Auto-detect ('all' or empty): check if password matches any configured store
    for (const [storeId, storeHash] of Object.entries(this.storePasswordHashes)) {
      if (hashed === storeHash) {
        return {
          valid: true,
          role: 'store',
          storeScope: storeId,
          allowedStore: storeId,
          unlocked: true
        };
      }
    }

    return { valid: false, role: null, storeScope: null, allowedStore: null, unlocked: false };
  }

  setMasterPassword(currentPwd, newPwd) {
    if (!this.verifyMasterPassword(currentPwd)) {
      return { success: false, error: 'Current Master password is incorrect.' };
    }
    if (!newPwd || String(newPwd).trim().length < 4) {
      return { success: false, error: 'New password must be at least 4 characters long.' };
    }
    this.masterPasswordHash = this.hashPassword(newPwd);
    this.save();
    return { success: true, message: 'Master password updated successfully.' };
  }

  setAdminPassword(targetScope, currentPwd, newPwd) {
    const auth = this.verifyAdminPassword(currentPwd, targetScope);
    if (!auth.valid) {
      return { success: false, error: 'Current password is incorrect.' };
    }
    if (!newPwd || String(newPwd).trim().length < 4) {
      return { success: false, error: 'New password must be at least 4 characters long.' };
    }
    const scope = String(targetScope || 'master').toLowerCase().trim();
    if (scope === 'master' || scope === 'overall' || scope === 'all') {
      if (auth.role !== 'overall') {
        return { success: false, error: 'Only Overall Admin can change the Master password.' };
      }
      this.masterPasswordHash = this.hashPassword(newPwd);
    } else if (this.getStoreIds().includes(scope)) {
      if (auth.role !== 'overall' && auth.storeScope !== scope) {
        return { success: false, error: 'Unauthorized to change password for this store.' };
      }
      this.storePasswordHashes[scope] = this.hashPassword(newPwd);
    } else {
      return { success: false, error: 'Unknown target scope for password update.' };
    }
    this.save();
    return { success: true, scope, message: `Password for ${scope.toUpperCase()} updated successfully.` };
  }

  updateTenantConfig(partialConfig, password) {
    const auth = this.verifyAdminPassword(password);
    if (!auth.valid) {
      return { success: false, error: 'Unauthorized: Valid Admin password required.' };
    }
    if (partialConfig && typeof partialConfig === 'object') {
      if (auth.role === 'overall') {
        this.tenantConfig = {
          ...this.tenantConfig,
          ...partialConfig,
          stores: {
            ...this.tenantConfig.stores,
            ...(partialConfig.stores || {})
          }
        };
      } else if (auth.role === 'store' && auth.storeScope) {
        // Store admin can only update their own store's profile or timers
        const st = auth.storeScope;
        if (partialConfig.stores && partialConfig.stores[st]) {
          this.tenantConfig.stores[st] = {
            ...this.tenantConfig.stores[st],
            ...partialConfig.stores[st]
          };
        }
        if (Array.isArray(partialConfig.defaultTimers)) {
          this.tenantConfig.defaultTimers = partialConfig.defaultTimers;
        }
      }
      this.version += 1;
      this.updatedAt = new Date().toISOString();
      this.save();
      this.broadcast('tenant-config-update', {
        type: 'tenant-config-update',
        version: this.version,
        updatedAt: this.updatedAt,
        tenantConfig: this.tenantConfig
      });
      return { success: true, version: this.version, tenantConfig: this.tenantConfig };
    }
    return { success: false, error: 'Invalid tenant config payload' };
  }

  publishDraftToInUse(storeId, draftDocId, password) {
    const st = String(storeId || '').toLowerCase().trim();
    if (!this.getStoreIds().includes(st)) {
      return { success: false, error: 'Invalid store ID.' };
    }
    if (password) {
      const auth = this.verifyAdminPassword(password, st);
      if (!auth.valid || (auth.role === 'store' && auth.storeScope !== st)) {
        return { success: false, error: 'Unauthorized to publish forms for this store.' };
      }
    }

    const draftEntryIdx = this.customDocsRegistry.findIndex(d => d && d.id === draftDocId);
    const draftMeta = draftEntryIdx >= 0 ? this.customDocsRegistry[draftEntryIdx] : (this.formLifecycle[`${draftDocId}__${st}`] || null);
    const baseDocId = (draftMeta && draftMeta.baseDocId) || draftDocId.replace(/-master-update-v\d+.*$/i, '').replace(/-update-\d+.*$/i, '');
    const draftStateKey = `${draftDocId}__${st}`;
    const targetInUseKey = `${baseDocId}__${st}`;
    const draftHtml = this.state[draftStateKey] || this.state[draftDocId];

    if (!draftHtml) {
      return { success: false, error: 'Draft HTML content not found.' };
    }

    // 1. Archive previous In-Use version if present
    const prevInUseHtml = this.state[targetInUseKey];
    let archivedDocId = null;
    if (prevInUseHtml) {
      archivedDocId = `${baseDocId}-archived-${Date.now()}`;
      this.state[`${archivedDocId}__${st}`] = prevInUseHtml;
      this.formLifecycle[`${archivedDocId}__${st}`] = {
        docId: archivedDocId,
        baseDocId,
        store: st,
        state: 'Archived',
        archivedAt: new Date().toISOString(),
        title: `${(draftMeta && draftMeta.baseTitle) || baseDocId} (Archived ${new Date().toISOString().slice(0, 10)})`
      };
      this.customDocsRegistry.push({
        id: archivedDocId,
        baseDocId,
        storeScope: st,
        lifecycleState: 'Archived',
        title: `${(draftMeta && draftMeta.baseTitle) || baseDocId} (Archived ${new Date().toISOString().slice(0, 10)})`,
        category: (draftMeta && draftMeta.category) || 'Store Customized Forms',
        createdAt: new Date().toISOString()
      });
    }

    // 2. Atomically promote Draft content to active In-Use key
    this.state[targetInUseKey] = draftHtml;
    this.formLifecycle[targetInUseKey] = {
      docId: baseDocId,
      baseDocId,
      store: st,
      state: 'In-Use',
      publishedFromDraftId: draftDocId,
      publishedAt: new Date().toISOString()
    };

    // 3. Mark the draft entry itself as Archived/Published so it no longer sits in Draft queue
    this.formLifecycle[draftStateKey] = {
      ...(this.formLifecycle[draftStateKey] || {}),
      docId: draftDocId,
      baseDocId,
      store: st,
      state: 'Archived',
      promotedToInUseAt: new Date().toISOString()
    };
    if (draftEntryIdx >= 0) {
      this.customDocsRegistry[draftEntryIdx] = {
        ...this.customDocsRegistry[draftEntryIdx],
        lifecycleState: 'Archived',
        promotedToInUseAt: new Date().toISOString()
      };
    }

    this.version += 1;
    this.updatedAt = new Date().toISOString();
    this.save();
    this.broadcast('state-update', {
      type: 'state-update',
      version: this.version,
      updatedAt: this.updatedAt,
      customDocsRegistry: this.customDocsRegistry,
      formLifecycle: this.formLifecycle,
      updates: [
        { key: targetInUseKey, value: draftHtml, store: st, lifecycleState: 'In-Use' }
      ]
    });

    return {
      success: true,
      version: this.version,
      store: st,
      baseDocId,
      promotedDraftId: draftDocId,
      archivedDocId,
      formLifecycle: this.formLifecycle
    };
  }

  getStateSummary() {
    return {
      version: this.version,
      updatedAt: this.updatedAt,
      connectedClients: this.clients.size,
      dataFile: this.dataFile,
      customDocsRegistry: this.customDocsRegistry,
      formLifecycle: this.formLifecycle,
      tenantConfig: this.tenantConfig,
      state: this.state
    };
  }

  applyUpdate(body) {
    if (!body || typeof body !== 'object') {
      return { success: false, error: 'Invalid update payload' };
    }

    const updates = Array.isArray(body.updates) ? body.updates : [body];
    const appliedKeys = [];
    const broadcastUpdates = [];
    const STORES = this.getStoreIds();

    if (Array.isArray(body.customDocsRegistry)) {
      this.customDocsRegistry = body.customDocsRegistry;
    }
    if (body.formLifecycle && typeof body.formLifecycle === 'object') {
      this.formLifecycle = { ...this.formLifecycle, ...body.formLifecycle };
    }

    for (const item of updates) {
      if (!item) continue;
      const store = (item.store || '').toLowerCase().trim();
      const docId = (item.docId || '').trim();
      let key = (item.key || '').trim();
      if (!key && docId && store) {
        key = `${docId}__${store}`;
      } else if (!key && docId) {
        key = docId;
      }
      const value = item.value !== undefined ? item.value : '';

      if (!key) continue;

      const isMaster = store === 'master' || key.includes('__master');

      if (isMaster) {
        // Enforce Master Password
        const pwd = item.masterPassword || body.masterPassword || item.password || body.password;
        if (!this.verifyMasterPassword(pwd)) {
          return {
            success: false,
            requiresMasterAuth: true,
            error: 'Unauthorized: Valid Master password required to edit Master templates.'
          };
        }

        const masterKey = key.includes('__master') ? key : `${docId || key}__master`;
        this.state[masterKey] = value;
        appliedKeys.push(masterKey);
        broadcastUpdates.push({ key: masterKey, value, store: 'master' });

        // Non-Destructive Master Push Workflow:
        // 1. If a store does NOT have an active In-Use sheet yet, seed it initially.
        // 2. If a store ALREADY has an active In-Use sheet (or pushMasterDraft is set), push a non-destructive Draft copy titled `<Form Name> - Master Update v<X>` without overwriting the store's active In-Use sheet.
        const baseDoc = docId || masterKey.replace(/__master.*$/, '');
        const suffix = masterKey.includes('__simplified') ? '__simplified' : '';
        const isMetaKey = baseDoc.startsWith('__');

        for (const st of STORES) {
          const storeKey = `${baseDoc}__${st}${suffix}`;
          let storeVal = value;
          if (typeof value === 'string' && value.includes('data-store-badge="true"')) {
            storeVal = value.replace(/(data-store-badge="true"[^>]*>)([^<]*)(<\/)/gi, `$1STORE: ${st.toUpperCase()}$3`);
          }

          if (!this.state[storeKey]) {
            this.state[storeKey] = storeVal;
            if (!isMetaKey && !suffix) {
              this.formLifecycle[storeKey] = {
                docId: baseDoc,
                baseDocId: baseDoc,
                store: st,
                state: 'In-Use',
                updatedAt: new Date().toISOString()
              };
            }
            appliedKeys.push(storeKey);
            broadcastUpdates.push({ key: storeKey, value: storeVal, store: st, propagatedFrom: 'master', lifecycleState: 'In-Use' });
          } else if (!isMetaKey && !suffix && item.createMasterDraft !== false) {
            // Compute next Master Update v<X> number for this baseDoc + store
            const existingDrafts = this.customDocsRegistry.filter(d => d && d.baseDocId === baseDoc && (!d.storeScope || d.storeScope === st));
            const nextVer = existingDrafts.length + 1;
            const formTitle = item.formTitle || baseDoc.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            const draftDocId = `${baseDoc}-master-update-v${nextVer}`;
            const draftStoreKey = `${draftDocId}__${st}`;
            const draftTitle = `${formTitle} - Master Update v${nextVer}`;

            this.state[draftStoreKey] = storeVal;
            this.formLifecycle[draftStoreKey] = {
              docId: draftDocId,
              baseDocId: baseDoc,
              baseTitle: formTitle,
              store: st,
              state: 'Draft',
              version: nextVer,
              title: draftTitle,
              updatedAt: new Date().toISOString()
            };
            if (!this.customDocsRegistry.some(d => d && d.id === draftDocId && d.storeScope === st)) {
              this.customDocsRegistry.push({
                id: draftDocId,
                baseDocId: baseDoc,
                baseTitle: formTitle,
                storeScope: st,
                lifecycleState: 'Draft',
                updateNumber: nextVer,
                title: draftTitle,
                sub: `Incoming Master Update v${nextVer} (Draft — Review & Publish to In-Use)`,
                category: item.category || 'Master Updates (Drafts)',
                createdAt: new Date().toISOString()
              });
            }
            appliedKeys.push(draftStoreKey);
            broadcastUpdates.push({
              key: draftStoreKey,
              value: storeVal,
              store: st,
              propagatedFrom: 'master',
              lifecycleState: 'Draft',
              draftDocId,
              draftTitle
            });
          }
        }
      } else {
        // Scoped to specific store (melrose, mesa, or tempe)
        this.state[key] = value;
        const lifecycleState = item.lifecycleState || (this.formLifecycle[key] && this.formLifecycle[key].state) || 'In-Use';
        if (docId && store && !docId.startsWith('__')) {
          this.formLifecycle[key] = {
            ...(this.formLifecycle[key] || {}),
            docId,
            baseDocId: item.baseDocId || docId,
            store,
            state: lifecycleState,
            updatedAt: new Date().toISOString()
          };
        }
        appliedKeys.push(key);
        broadcastUpdates.push({ key, value, store: store || 'store', lifecycleState });
      }
    }

    if (appliedKeys.length > 0 || Array.isArray(body.customDocsRegistry) || body.formLifecycle) {
      this.version += 1;
      this.updatedAt = new Date().toISOString();
      this.save();
      this.broadcast('state-update', {
        type: 'state-update',
        version: this.version,
        updatedAt: this.updatedAt,
        customDocsRegistry: this.customDocsRegistry,
        formLifecycle: this.formLifecycle,
        updates: broadcastUpdates
      });
      return {
        success: true,
        version: this.version,
        updatedAt: this.updatedAt,
        appliedKeys,
        customDocsRegistry: this.customDocsRegistry,
        formLifecycle: this.formLifecycle
      };
    }

    return { success: false, error: 'No valid state keys updated' };
  }

  updateStoreState(payload) {
    if (!payload || typeof payload !== 'object') {
      return { success: false, error: 'Invalid payload' };
    }
    const store = (payload.store || '').toLowerCase().trim();
    const isMaster = store === 'master';
    const pwd = payload.password || payload.masterPassword;
    if (isMaster && !this.verifyMasterPassword(pwd)) {
      return { success: false, requiresMasterAuth: true, error: 'Unauthorized: Valid Master password required.' };
    }
    if (Array.isArray(payload.customDocsRegistry)) {
      this.customDocsRegistry = payload.customDocsRegistry;
    }
    if (payload.formLifecycle && typeof payload.formLifecycle === 'object') {
      this.formLifecycle = { ...this.formLifecycle, ...payload.formLifecycle };
    }
    if (payload.customEditedHTML && typeof payload.customEditedHTML === 'object') {
      const entries = Object.entries(payload.customEditedHTML);
      if (entries.length === 0) {
        if (Array.isArray(payload.customDocsRegistry) || payload.formLifecycle) this.save();
        return {
          success: true,
          version: this.version,
          updatedAt: this.updatedAt,
          appliedKeys: []
        };
      }
      // Process store-specific keys FIRST so existing store customizations are registered before any __master fallback keys
      const sortedEntries = entries.slice().sort(([kA], [kB]) => {
        const aMaster = kA.includes('__master') ? 1 : 0;
        const bMaster = kB.includes('__master') ? 1 : 0;
        return aMaster - bMaster;
      });
      const updates = [];
      for (const [key, val] of sortedEntries) {
        if (!isMaster && key.includes('__master')) continue;
        updates.push({
          key,
          value: val,
          store: key.includes('__master') ? 'master' : store,
          masterPassword: pwd,
          createMasterDraft: payload.createMasterDraft
        });
      }
      if (updates.length === 0) {
        if (Array.isArray(payload.customDocsRegistry) || payload.formLifecycle) this.save();
        return {
          success: true,
          version: this.version,
          updatedAt: this.updatedAt,
          appliedKeys: []
        };
      }
      return this.applyUpdate({
        updates,
        customDocsRegistry: payload.customDocsRegistry,
        formLifecycle: payload.formLifecycle,
        masterPassword: pwd
      });
    }
    return this.applyUpdate(payload);
  }

  addClient(res) {
    this.clients.add(res);

    // Initial handshake event
    res.write(`event: init\ndata: ${JSON.stringify({
      type: 'init',
      version: this.version,
      updatedAt: this.updatedAt,
      customDocsRegistry: this.customDocsRegistry,
      formLifecycle: this.formLifecycle,
      tenantConfig: this.tenantConfig,
      state: this.state
    })}\n\n`);

    res.on('close', () => {
      this.clients.delete(res);
    });
  }

  broadcast(event, data) {
    const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of this.clients) {
      try {
        client.write(msg);
      } catch (err) {
        this.clients.delete(client);
      }
    }
  }

  close() {
    for (const client of this.clients) {
      try {
        client.end();
      } catch (_) {}
    }
    this.clients.clear();
  }
}

module.exports = SyncEngine;

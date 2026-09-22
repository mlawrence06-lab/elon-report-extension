const TRACKING_API_URL = "https://elon.report/wp-json/ere/v1/track";
const DEFAULT_SYNC_URL = "https://elon.report/wp-json/ere/v1/domains";
const SUBMIT_DOMAIN_API_URL = "https://elon.report/wp-json/ere/v1/submit-domain";
const GLOBAL_STATS_API_URL = "https://elon.report/wp-json/ere/v1/global-stats";
const SYNC_ALARM_NAME = "ere_daily_domain_sync";

export const CATEGORIES = {
  1: { id: 1, slug: "transport-av", name: "Transportation / Autonomous Vehicles", short: "AV / Transport" },
  2: { id: 2, slug: "neuro-robotics", name: "Neurotechnology / Robotics & Automation", short: "Neuro / Robotics" },
  3: { id: 3, slug: "ai-compute", name: "Artificial Intelligence / Frontier Compute", short: "AI / Compute" },
  4: { id: 4, slug: "space-orbital", name: "Space Exploration / Orbital & Deep Space", short: "Space / Orbital" },
  5: { id: 5, slug: "politics", name: "Politics (Reality)", short: "Politics", optional: true },
  6: { id: 6, slug: "energy-storage", name: "Energy Systems / Storage & Power", short: "Energy / Grid" },
  7: { id: 7, slug: "investments-equity", name: "Investments / Financial Realities & Equities", short: "Investments / TSLA" },
  8: { id: 8, slug: "crypto-digital", name: "Crypto Ecosystem / Mining & Digital Assets", short: "Crypto / Mining" },
  9: { id: 9, slug: "media-social", name: "Digital Town Square / Media & Social", short: "Media / X" }
};

const volatilePrivacyLog = [];

setInterval(() => {
  const pruneCutoff = Date.now() - (60 * 60 * 1000);
  while (volatilePrivacyLog.length && volatilePrivacyLog[volatilePrivacyLog.length - 1].time < pruneCutoff) {
    volatilePrivacyLog.pop();
  }
}, 60000);

function generateUUID() {
  return "ere_" + "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function broadcastMessage(info) {
  try {
    const tabs = await chrome.tabs.query({});
    for (const t of tabs) {
      if (t.id) {
        chrome.tabs.sendMessage(t.id, info).catch(() => {});
      }
    }
  } catch (e) {}
}

let lastFetchTime = 0;
let cachedGlobalTotal = 0;

// Load persisted total immediately on boot
chrome.storage.local.get(["totalTrackedVisitors"], (res) => {
  if (res && res.totalTrackedVisitors) {
    const val = parseInt(res.totalTrackedVisitors, 10);
    if (!isNaN(val) && val > 0) {
      cachedGlobalTotal = val;
    }
  }
  fetchGlobalStats().catch(() => {});
});

function recordGlobalTotal(newTotal) {
  const n = parseInt(newTotal, 10);
  if (!isNaN(n) && n > 0) {
    cachedGlobalTotal = n;
    lastFetchTime = Date.now();
    chrome.storage.local.set({ totalTrackedVisitors: n }).catch(() => {});
    broadcastMessage({ type: "GLOBAL_STATS_UPDATED", totalVisitors: n });
    return n;
  }
  return cachedGlobalTotal;
}

async function fetchGlobalStats() {
  const now = Date.now();
  if (cachedGlobalTotal > 0 && (now - lastFetchTime) < 2000) {
    return cachedGlobalTotal;
  }
  try {
    const res = await fetch(`${GLOBAL_STATS_API_URL}?_t=${now}`, {
      headers: { "Accept": "application/json" },
      cache: "no-store"
    });
    if (res.ok) {
      const data = await res.json();
      const count = data ? (data.total_visits !== undefined ? data.total_visits : data.total_visitors) : null;
      if (count !== null && count !== undefined) {
        recordGlobalTotal(count);
      }
    }
  } catch (e) {}
  return cachedGlobalTotal;
}

chrome.runtime.onInstalled.addListener(async () => {
  try {
    chrome.contextMenus.create({
      id: "ere-toggle-pause",
      title: "Pause / Resume Tracking",
      contexts: ["action"]
    });
    chrome.contextMenus.create({
      id: "ere-reset-hud",
      title: "Reset ERE (Position & Transparency)",
      contexts: ["action"]
    });
  } catch (e) {}

  const data = await chrome.storage.local.get([
    "ere_uuid",
    "isPaused",
    "trackedDomains",
    "excludedDomains",
    "domainCount",
    "lastSyncTime",
    "personalStats",
    "pillarFilters",
    "idleOpacity",
    "bitcointalkDarkTheme",
    "hudDisplayMode",
    "totalTrackedVisitors"
  ]);

  const updates = {};

  if (!data.ere_uuid) {
    updates.ere_uuid = generateUUID();
  }

  if (data.isPaused === undefined) {
    updates.isPaused = false;
  }

  if (data.hudDisplayMode === undefined) {
    updates.hudDisplayMode = "total";
  }

  if (data.totalTrackedVisitors === undefined) {
    updates.totalTrackedVisitors = 0;
  }

  if (data.idleOpacity === undefined) {
    updates.idleOpacity = 100;
  }

  if (data.bitcointalkDarkTheme === undefined) {
    updates.bitcointalkDarkTheme = false;
  }

  if (!data.personalStats) {
    updates.personalStats = {
      totalPagesTracked: 0,
      meritPoints: 25,
      pillarCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 }
    };
  }

  if (!data.pillarFilters) {
    updates.pillarFilters = { 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true, 9: true };
  }

  if (!data.domainCount) {
    try {
      const metaRes = await fetch(chrome.runtime.getURL("data/meta.json"));
      if (metaRes.ok) {
        const meta = await metaRes.json();
        updates.domainCount = meta.count || 1377451;
        updates.lastSyncTime = meta.updated_at ? meta.updated_at * 1000 : Date.now();
        if (meta.level_thresholds) {
          updates.levelThresholds = meta.level_thresholds;
        }
      }
    } catch (e) {
      updates.domainCount = 1377451;
      updates.lastSyncTime = Date.now();
    }
  }

  if (Object.keys(updates).length > 0) {
    await chrome.storage.local.set(updates);
  }

  fetchGlobalStats().catch(() => {});
  chrome.alarms.create(SYNC_ALARM_NAME, { periodInMinutes: 1440 });
  syncDomains().catch(() => {});
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId === "ere-toggle-pause") {
    const { isPaused } = await chrome.storage.local.get("isPaused");
    const next = !isPaused;
    await chrome.storage.local.set({ isPaused: next });
    broadcastMessage({ type: "PAUSE_STATE_CHANGED", isPaused: next });
  } else if (info.menuItemId === "ere-reset-hud") {
    await chrome.storage.local.set({ hudPosition: { x: null, y: null }, idleOpacity: 100 });
    broadcastMessage({ type: "HUD_POS_CHANGED", x: null, y: null });
    broadcastMessage({ type: "IDLE_OPACITY_CHANGED", opacity: 100 });
    const { ere_uuid } = await chrome.storage.local.get("ere_uuid");
    if (ere_uuid) {
      fetch("https://elon.report/wp-json/ere/v1/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid: ere_uuid, settings: { hudPosition: { x: null, y: null }, idleOpacity: 100 } })
      }).catch(() => {});
    }
  }
});

chrome.runtime.onStartup.addListener(() => {
  syncDomains().catch(() => {});
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === SYNC_ALARM_NAME) {
    await syncDomains();
  }
});

function openDomainDB(timeoutMs = 200) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error("IndexedDB timeout"));
      }
    }, timeoutMs);

    try {
      const req = indexedDB.open("ere_domain_db", 1);
      req.onblocked = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          reject(new Error("IndexedDB blocked"));
        }
      };
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("domains")) {
          db.createObjectStore("domains");
        }
        if (!db.objectStoreNames.contains("meta")) {
          db.createObjectStore("meta");
        }
      };
      req.onsuccess = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(req.result);
        }
      };
      req.onerror = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          reject(req.error);
        }
      };
    } catch (e) {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(e);
      }
    }
  });
}

async function applyDeltaSyncToIndexedDB(newDomains, removedDomains, excludedList, meta) {
  const db = await openDomainDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["domains", "meta"], "readwrite");
    const domStore = tx.objectStore("domains");
    const metaStore = tx.objectStore("meta");

    for (const [dom, cat] of Object.entries(newDomains)) {
      domStore.put(cat, dom);
    }

    if (Array.isArray(removedDomains)) {
      for (const dom of removedDomains) {
        domStore.delete(dom);
      }
    }

    const metaReq = metaStore.get("excluded");
    metaReq.onsuccess = () => {
      const currentExcluded = new Set(metaReq.result || []);
      if (Array.isArray(excludedList)) {
        for (const d of excludedList) currentExcluded.add(d);
      }
      if (Array.isArray(removedDomains)) {
        for (const d of removedDomains) currentExcluded.add(d);
      }
      metaStore.put(Array.from(currentExcluded), "excluded");

      if (meta) {
        for (const [k, v] of Object.entries(meta)) {
          metaStore.put(v, k);
        }
      }
    };
    metaReq.onerror = () => {
      if (meta) {
        for (const [k, v] of Object.entries(meta)) {
          metaStore.put(v, k);
        }
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

let isSyncInProgress = false;

async function syncDomains(force = false) {
  if (isSyncInProgress) return { status: "in_progress" };
  isSyncInProgress = true;

  try {
    const storage = await chrome.storage.local.get(["lastSyncTime", "domainCount"]);
    let lastSync = storage.lastSyncTime || 0;
    const now = Date.now();

    if (!lastSync) {
      try {
        const metaRes = await fetch(chrome.runtime.getURL("data/meta.json"));
        if (metaRes.ok) {
          const meta = await metaRes.json();
          lastSync = meta.updated_at ? meta.updated_at * 1000 : 0;
        }
      } catch (e) {}
    }

    if (!force && storage.domainCount > 0 && lastSync > 0 && (now - lastSync < 24 * 60 * 60 * 1000)) {
      isSyncInProgress = false;
      return { status: "cached", lastSync, totalDomains: storage.domainCount };
    }

    broadcastMessage({ type: "SYNC_PROGRESS", text: "Checking for new records..." });

    const sinceParam = lastSync > 0 ? lastSync : 0;
    const url = `${DEFAULT_SYNC_URL}?since=${sinceParam}`;
    const res = await fetch(url, {
      headers: { "If-Modified-Since": new Date(lastSync).toUTCString() },
      cache: "no-cache"
    });

    if (res.status === 304) {
      await chrome.storage.local.set({ lastSyncTime: now });
      const currentCount = storage.domainCount || 1377451;
      broadcastMessage({ type: "DOMAINS_SYNC_COMPLETED", totalDomains: currentCount, lastSync: now, newCount: 0, removedCount: 0 });
      isSyncInProgress = false;
      return { status: "not_modified", lastSync: now, totalDomains: currentCount, newCount: 0, removedCount: 0 };
    }

    if (res.ok) {
      const data = await res.json();
      const newDomains = data.domains || {};
      const removedDomains = Array.isArray(data.removed) ? data.removed : [];
      const newCount = Object.keys(newDomains).length;
      const removedCount = removedDomains.length;
      const totalCount = data.count || ((storage.domainCount || 1377451) + newCount - removedCount);

      if (newCount > 0 || removedCount > 0) {
        broadcastMessage({ type: "SYNC_PROGRESS", text: `Syncing ${newCount} added, ${removedCount} removed...` });
        const excluded = Array.isArray(data.excluded) ? data.excluded : [];
        await applyDeltaSyncToIndexedDB(newDomains, removedDomains, excluded, { count: totalCount, lastSync: now });
      }

      const toSet = {
        lastSyncTime: now,
        domainCount: totalCount
      };
      if (data.level_thresholds) {
        toSet.levelThresholds = data.level_thresholds;
      }
      await chrome.storage.local.set(toSet);
      await chrome.storage.local.remove(["trackedDomains", "excludedDomains"]);

      broadcastMessage({ type: "DOMAINS_SYNC_COMPLETED", totalDomains: totalCount, lastSync: now, newCount, removedCount });
      isSyncInProgress = false;
      return { status: "updated", count: totalCount, totalDomains: totalCount, lastSync: now, newCount, removedCount };
    }
  } catch (err) {
    broadcastMessage({ type: "SYNC_FAILED" });
  }

  isSyncInProgress = false;
  const storage = await chrome.storage.local.get(["domainCount", "lastSyncTime"]);
  const currentCount = storage.domainCount || 1377451;
  broadcastMessage({ type: "DOMAINS_SYNC_COMPLETED", totalDomains: currentCount, lastSync: storage.lastSyncTime || null, newCount: 0, removedCount: 0 });
  return { status: "fallback", lastSync: storage.lastSyncTime || null, totalDomains: currentCount, newCount: 0, removedCount: 0 };
}

const SUBREDDIT_MAP = {
  "teslamotors": 1, "teslalounge": 1, "cybertruck": 1, "selfdrivingcars": 1, "rivian": 1, "lucidmotors": 1, "electricvehicles": 1, "boringcompany": 1, "loop": 1,
  "neuralink": 2, "bci": 2, "robotics": 2, "humanoidrobots": 2, "cybernetics": 2,
  "xai": 3, "grok": 3, "openai": 3, "chatgpt": 3, "anthropic": 3, "claudeai": 3, "localllama": 3, "machinelearning": 3, "artificial": 3, "singularity": 3,
  "spacex": 4, "spacexlounge": 4, "starlink": 4, "space": 4, "nasa": 4, "astronomy": 4, "rocketry": 4,
  "politics": 5, "politicaldiscussion": 5, "geopolitics": 5, "neutralpolitics": 5,
  "teslasolar": 6, "solar": 6, "renewableenergy": 6, "batteries": 6, "energy": 6,
  "teslainvestorsclub": 7, "tsla": 7, "stocks": 7, "wallstreetbets": 7, "investing": 7, "options": 7, "valueinvesting": 7,
  "bitcoin": 8, "dogecoin": 8, "cryptocurrency": 8, "cryptomarkets": 8, "btc": 8, "solana": 8, "ethereum": 8, "defi": 8,
  "elonmusk": 9, "twitter": 9, "x_twitter": 9, "freespeech": 9
};

const SHARD_CACHE = new Map();
const MAX_SHARD_CACHE = 40;

function getBaseDomain(hostname, pathname) {
  const cleanHost = (hostname || "").toLowerCase().replace(/^www\./, "");
  if (cleanHost === "reddit.com" || cleanHost.endsWith(".reddit.com")) {
    const p = pathname || "";
    const match = p.match(/^\/r\/([a-zA-Z0-9_]+)/i);
    if (match && match[1]) {
      return `reddit.com/r/${match[1].toLowerCase()}`;
    }
    return "reddit.com";
  }
  return cleanHost;
}

async function lookupBundledShard(domain) {
  if (!domain) return null;
  const prefix = domain.slice(0, 2).toLowerCase();
  const shardKey = /^[a-z0-9]{2}$/.test(prefix) ? prefix : "misc";

  if (SHARD_CACHE.has(shardKey)) {
    const data = SHARD_CACHE.get(shardKey);
    return data && data[domain] !== undefined ? data[domain] : null;
  }

  try {
    const url = chrome.runtime.getURL(`data/domains/${shardKey}.json`);
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (SHARD_CACHE.size >= MAX_SHARD_CACHE) {
        const firstKey = SHARD_CACHE.keys().next().value;
        SHARD_CACHE.delete(firstKey);
      }
      SHARD_CACHE.set(shardKey, data);
      return data && data[domain] !== undefined ? data[domain] : null;
    }
  } catch (e) {}
  return null;
}

async function classifyUrlAsync(hostname, pathname) {
  if (!hostname) return null;
  const cleanHost = hostname.toLowerCase().replace(/^www\./, "");

  if (cleanHost === "reddit.com" || cleanHost.endsWith(".reddit.com")) {
    if (pathname) {
      const match = pathname.match(/^\/r\/([a-zA-Z0-9_]+)/i);
      if (match && match[1]) {
        const sub = match[1].toLowerCase();
        if (SUBREDDIT_MAP[sub]) return SUBREDDIT_MAP[sub];
      }
    }
    return null;
  }

  // 1. Fast path: Check bundled shards first (instant < 1ms, zero lock)
  const bundledDirect = await lookupBundledShard(cleanHost);
  if (bundledDirect !== null && bundledDirect !== undefined) return bundledDirect;

  const parts = cleanHost.split(".");
  if (parts.length > 2) {
    const rootDomain = parts.slice(-2).join(".");
    const bundledRoot = await lookupBundledShard(rootDomain);
    if (bundledRoot !== null && bundledRoot !== undefined) return bundledRoot;
  }

  // 2. Fallback to IndexedDB (for dynamically synced domains or excluded domains)
  let isExcluded = false;
  let idbMatch = null;
  let idbRootMatch = null;

  try {
    const db = await openDomainDB(100);
    await new Promise((resolve) => {
      let isDone = false;
      const done = () => {
        if (!isDone) {
          isDone = true;
          clearTimeout(timer);
          resolve();
        }
      };
      const timer = setTimeout(done, 80);

      try {
        const tx = db.transaction(["domains", "meta"], "readonly");
        const domStore = tx.objectStore("domains");
        const metaStore = tx.objectStore("meta");

        const metaReq = metaStore.get("excluded");
        metaReq.onsuccess = () => {
          const excludedArr = metaReq.result || [];
          const excludedSet = new Set(excludedArr);
          if (excludedSet.has(cleanHost)) {
            isExcluded = true;
            done();
            return;
          }

          const domReq = domStore.get(cleanHost);
          domReq.onsuccess = () => {
            if (domReq.result !== undefined) {
              idbMatch = domReq.result;
              done();
              return;
            }
            if (parts.length > 2) {
              const rootDomain = parts.slice(-2).join(".");
              if (excludedSet.has(rootDomain)) {
                isExcluded = true;
                done();
                return;
              }
              const rootReq = domStore.get(rootDomain);
              rootReq.onsuccess = () => {
                if (rootReq.result !== undefined) {
                  idbRootMatch = rootReq.result;
                }
                done();
              };
              rootReq.onerror = () => done();
            } else {
              done();
            }
          };
          domReq.onerror = () => done();
        };
        metaReq.onerror = () => done();
      } catch (txErr) {
        done();
      }
    });
  } catch (err) {}

  if (isExcluded) return null;
  if (idbMatch !== null && idbMatch !== undefined) return idbMatch;
  if (idbRootMatch !== null && idbRootMatch !== undefined) return idbRootMatch;

  return null;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    switch (msg.type) {
      case "GET_INITIAL_STATE": {
        const data = await chrome.storage.local.get([
          "ere_uuid",
          "ere_uuid_saved",
          "isPaused",
          "hudPosition",
          "personalStats",
          "pillarFilters",
          "lastSyncTime",
          "domainCount",
          "levelThresholds",
          "recentRankings",
          "idleOpacity",
          "bitcointalkDarkTheme",
          "activeTab",
          "hudDisplayMode",
          "totalTrackedVisitors",
          "trendMode",
          "trendRange",
          "visitRange"
        ]);

        if (!data.domainCount) {
          syncDomains().catch(() => {});
        }

        if (!cachedGlobalTotal) {
          try {
            await Promise.race([
              fetchGlobalStats(),
              new Promise((r) => setTimeout(r, 600))
            ]);
          } catch (e) {}
        }

        const cleanHost = (msg.hostname || "").toLowerCase().replace(/^www\./, "");
        const categoryId = await classifyUrlAsync(msg.hostname, msg.pathname);
        const category = categoryId ? CATEGORIES[categoryId] : null;
        const recentRankings = data.recentRankings || {};
        const cachedRanking = recentRankings[cleanHost] || null;

        sendResponse({
          uuid: data.ere_uuid,
          isUuidSaved: !!data.ere_uuid_saved,
          isPaused: !!data.isPaused,
          isModalOpen: false,
          activeTab: data.activeTab !== undefined ? data.activeTab : 1,
          hudDisplayMode: data.hudDisplayMode || "total",
          totalTrackedVisitors: Math.max(cachedGlobalTotal, parseInt(data.totalTrackedVisitors, 10) || 0),
          trendMode: data.trendMode || "rank",
          trendRange: data.trendRange || "28d",
          visitRange: data.visitRange || "24h",
          hudPosition: data.hudPosition || { x: null, y: null },
          idleOpacity: data.idleOpacity !== undefined ? data.idleOpacity : 100,
          bitcointalkDarkTheme: !!data.bitcointalkDarkTheme,
          privacyHistory: volatilePrivacyLog.filter(item => Date.now() - item.time < 60 * 60 * 1000),
          category,
          categoryId,
          ranking: cachedRanking || { rank: 1, unique_visitors_24h: 1, total_category_domains_24h: 1, total_category_urls_24h: 1 },
          personalStats: data.personalStats,
          pillarFilters: data.pillarFilters,
          lastSyncTime: data.lastSyncTime || null,
          totalDomains: data.domainCount || 1377451,
          categories: CATEGORIES,
          levelThresholds: data.levelThresholds || { level_2: 10, level_3: 100, level_4: 1000 },
          version: chrome.runtime?.getManifest?.()?.version || "1.2.11"
        });
        break;
      }

      case "GET_GLOBAL_STATS": {
        const total = await fetchGlobalStats();
        sendResponse({ ok: true, totalVisitors: total });
        break;
      }

      case "CONFIRM_UUID_SAVED": {
        await chrome.storage.local.set({ ere_uuid_saved: true });
        sendResponse({ ok: true, isUuidSaved: true });
        break;
      }

      case "RESTORE_UUID": {
        const newUuid = (msg.uuid || "").trim();
        let stats = { totalPagesTracked: 0, meritPoints: 0, pillarCounts: {} };
        let bttDark = true;
        let idleOpacity = 100;
        let hudPosition = { x: null, y: null };

        try {
          const statsUrl = `${TRACKING_API_URL.replace('/track', '/stats')}?uuid=${encodeURIComponent(newUuid)}`;
          const res = await fetch(statsUrl);
          if (res.ok) {
            const remote = await res.json();
            if (remote && (remote.exists || remote.total_visits !== undefined)) {
              stats.totalPagesTracked = remote.total_visits || (remote.client ? remote.client.total_visits : 0);
              stats.meritPoints = remote.merit_points || (remote.client ? remote.client.merit_points : 0);
              stats.pillarCounts = remote.pillar_counts || (remote.client ? remote.pillar_breakdown : {});

              if (remote.settings && remote.settings.bitcointalkDarkTheme !== undefined) {
                bttDark = !!remote.settings.bitcointalkDarkTheme;
              } else if (remote.bitcointalk_dark_theme !== undefined) {
                bttDark = !!remote.bitcointalk_dark_theme;
              }

              if (remote.settings && remote.settings.idleOpacity !== undefined) {
                const parsed = parseInt(remote.settings.idleOpacity, 10);
                if (!isNaN(parsed)) idleOpacity = Math.max(0, Math.min(100, parsed));
              }

              if (remote.settings && remote.settings.hudPosition !== undefined) {
                hudPosition = remote.settings.hudPosition;
              }
            }
          }
        } catch (err) {}

        await chrome.storage.local.set({
          ere_uuid: newUuid,
          ere_uuid_saved: true,
          personalStats: stats,
          bitcointalkDarkTheme: bttDark,
          idleOpacity: idleOpacity,
          hudPosition: hudPosition
        });

        broadcastMessage({ type: "BTT_DARK_THEME_CHANGED", enabled: bttDark });
        broadcastMessage({ type: "IDLE_OPACITY_CHANGED", opacity: idleOpacity });
        broadcastMessage({ type: "HUD_POS_CHANGED", x: hudPosition.x, y: hudPosition.y });

        fetch("https://elon.report/wp-json/ere/v1/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uuid: newUuid, settings: { bitcointalkDarkTheme: bttDark, idleOpacity: idleOpacity, hudPosition: hudPosition } })
        }).catch(() => {});

        sendResponse({ ok: true, uuid: newUuid, stats, bitcointalkDarkTheme: bttDark, idleOpacity, hudPosition });
        break;
      }

      case "GET_RANK_TREND": {
        const domain = (msg.domain || "").toLowerCase().trim();
        const catId = msg.categoryId || 0;
        const range = msg.range || "28d";

        try {
          const trendUrl = `${TRACKING_API_URL.replace('/track', '/rank-trend')}?domain=${encodeURIComponent(domain)}&category_id=${catId}&range=${encodeURIComponent(range)}`;
          const res = await fetch(trendUrl);
          if (res.ok) {
            const data = await res.json();
            sendResponse(data);
            break;
          }
        } catch (err) {}

        sendResponse({
          success: true,
          domain,
          category_id: catId,
          range,
          current_rank: 1,
          peak: 1,
          low: 1,
          delta: 0,
          delta_str: "0 (Stable)",
          points: []
        });
        break;
      }

      case "TOGGLE_PAUSE": {
        const { isPaused } = await chrome.storage.local.get("isPaused");
        const nextState = !isPaused;
        await chrome.storage.local.set({ isPaused: nextState });

        const tabs = await chrome.tabs.query({});
        for (const t of tabs) {
          if (t.id) {
            chrome.tabs.sendMessage(t.id, { type: "PAUSE_STATE_CHANGED", isPaused: nextState }).catch(() => {});
          }
        }
        sendResponse({ isPaused: nextState });
        break;
      }

      case "SAVE_HUD_POS": {
        const hudPos = { x: msg.x, y: msg.y };
        await chrome.storage.local.set({ hudPosition: hudPos });
        broadcastMessage({ type: "HUD_POS_CHANGED", x: hudPos.x, y: hudPos.y });
        const { ere_uuid } = await chrome.storage.local.get("ere_uuid");
        if (ere_uuid) {
          fetch("https://elon.report/wp-json/ere/v1/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uuid: ere_uuid, settings: { hudPosition: hudPos } })
          }).catch(() => {});
        }
        sendResponse({ ok: true });
        break;
      }

      case "LOG_PAGE_TRACK": {
        const { isPaused, personalStats, ere_uuid, levelThresholds } = await chrome.storage.local.get([
          "isPaused",
          "personalStats",
          "ere_uuid",
          "levelThresholds"
        ]);

        if (isPaused) {
          sendResponse({ tracked: false, reason: "paused" });
          return;
        }

        const catId = msg.categoryId;
        if (catId) {
          const stats = personalStats || { totalPagesTracked: 0, meritPoints: 0, pillarCounts: {}, visitedSites: {} };
          stats.visitedSites = stats.visitedSites || {};
          
          const cleanDomain = msg.domain || getBaseDomain(msg.hostname, msg.pathname);
          const now = Date.now();
          const lastVisitTime = stats.visitedSites[cleanDomain] || 0;
          const isWithin24h = (now - lastVisitTime) < (24 * 60 * 60 * 1000);

          let rankData = { rank: 1, unique_visitors_24h: 1, total_category_domains_24h: 1, total_category_urls_24h: 1 };
          let thresholds = levelThresholds || { level_2: 10, level_3: 100, level_4: 1000 };

          const { recentRankings } = await chrome.storage.local.get("recentRankings");
          const rankingsMap = recentRankings || {};
          if (rankingsMap[cleanDomain]) {
            rankData = rankingsMap[cleanDomain];
          }

          // If the domain is at the top of the list, edit it. Otherwise, add a new record.
          if (volatilePrivacyLog.length > 0 && volatilePrivacyLog[0].domain === cleanDomain) {
            volatilePrivacyLog[0].time = now;
            volatilePrivacyLog[0].isTracked = true;
            volatilePrivacyLog[0].categoryId = catId;
          } else {
            volatilePrivacyLog.unshift({
              domain: cleanDomain,
              time: now,
              isTracked: true,
              categoryId: catId
            });
          }
          const pruneCutoff = now - (60 * 60 * 1000);
          while (volatilePrivacyLog.length > 250 || (volatilePrivacyLog.length > 0 && volatilePrivacyLog[volatilePrivacyLog.length - 1].time < pruneCutoff)) {
            volatilePrivacyLog.pop();
          }

          // Local merit points gate (merit points increment once per 24h per domain)
          if (!isWithin24h) {
            stats.visitedSites[cleanDomain] = now;
            stats.pillarCounts[catId] = (stats.pillarCounts[catId] || 0) + 1;
            stats.meritPoints = (stats.meritPoints || 0) + 1;
          }
          stats.totalPagesTracked = (stats.totalPagesTracked || 0) + 1;

          let updatedGlobalTotal = null;

          // Always send telemetry to server on every visit/refresh (UUID, domain, category_id ONLY)
          try {
            const res = await fetch(TRACKING_API_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                uuid: ere_uuid,
                domain: cleanDomain,
                category_id: catId
              })
            });
            if (res.ok) {
              const remote = await res.json();
              if (remote && remote.success) {
                stats.totalPagesTracked = remote.total_visits || stats.totalPagesTracked;
                stats.meritPoints = remote.merit_points !== undefined ? remote.merit_points : stats.meritPoints;
                if (remote.pillar_counts) {
                  stats.pillarCounts = remote.pillar_counts;
                }
                if (remote.level_thresholds) {
                  thresholds = remote.level_thresholds;
                }
                rankData = {
                  rank: remote.rank || 1,
                  unique_visitors_24h: remote.unique_visitors_24h || 1,
                  total_category_domains_24h: remote.total_category_domains_24h || remote.total_category_urls_24h || 1,
                  total_category_urls_24h: remote.total_category_domains_24h || remote.total_category_urls_24h || 1
                };
                if (remote.global_total_visits !== undefined) {
                  updatedGlobalTotal = recordGlobalTotal(remote.global_total_visits);
                }
              }
            }
          } catch (err) {}

          rankingsMap[cleanDomain] = rankData;

          await chrome.storage.local.set({ 
            personalStats: stats, 
            levelThresholds: thresholds,
            recentRankings: rankingsMap
          });

          sendResponse({
            tracked: true,
            stats,
            ranking: rankData,
            levelThresholds: thresholds,
            globalTotalVisits: updatedGlobalTotal
          });
        } else {
          sendResponse({ tracked: false, reason: "filtered" });
        }
        break;
      }

      case "LOG_UNTRACKED_DOMAIN": {
        const cleanHost = (msg.hostname || "").toLowerCase().replace(/^www\./, "");
        if (cleanHost) {
          const now = Date.now();
          // If the domain is at the top of the list, edit it. Otherwise, add a new record.
          if (volatilePrivacyLog.length > 0 && volatilePrivacyLog[0].domain === cleanHost) {
            volatilePrivacyLog[0].time = now;
            volatilePrivacyLog[0].isTracked = false;
            volatilePrivacyLog[0].categoryId = 0;
          } else {
            volatilePrivacyLog.unshift({
              domain: cleanHost,
              time: now,
              isTracked: false,
              categoryId: 0
            });
          }
        }
        const pruneCutoff = Date.now() - (60 * 60 * 1000);
        while (volatilePrivacyLog.length > 250 || (volatilePrivacyLog.length > 0 && volatilePrivacyLog[volatilePrivacyLog.length - 1].time < pruneCutoff)) {
          volatilePrivacyLog.pop();
        }
        sendResponse({ ok: true });
        break;
      }

      case "GET_PRIVACY_LOG": {
        const pruneCutoff = Date.now() - (60 * 60 * 1000);
        while (volatilePrivacyLog.length && volatilePrivacyLog[volatilePrivacyLog.length - 1].time < pruneCutoff) {
          volatilePrivacyLog.pop();
        }
        sendResponse({ history: volatilePrivacyLog });
        break;
      }

      case "SAVE_IDLE_OPACITY": {
        const parsed = parseInt(msg.opacity, 10);
        const op = Math.max(0, Math.min(100, isNaN(parsed) ? 100 : parsed));
        await chrome.storage.local.set({ idleOpacity: op });
        broadcastMessage({ type: "IDLE_OPACITY_CHANGED", opacity: op });
        const { ere_uuid } = await chrome.storage.local.get("ere_uuid");
        if (ere_uuid) {
          fetch("https://elon.report/wp-json/ere/v1/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uuid: ere_uuid, settings: { idleOpacity: op } })
          }).catch(() => {});
        }
        sendResponse({ ok: true, opacity: op });
        break;
      }

      case "SAVE_BTT_DARK_THEME": {
        const enabled = !!msg.enabled;
        await chrome.storage.local.set({ bitcointalkDarkTheme: enabled });
        broadcastMessage({ type: "BTT_DARK_THEME_CHANGED", enabled });
        const { ere_uuid } = await chrome.storage.local.get("ere_uuid");
        if (ere_uuid) {
          fetch("https://elon.report/wp-json/ere/v1/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uuid: ere_uuid, settings: { bitcointalkDarkTheme: enabled } })
          }).catch(() => {});
        }
        sendResponse({ ok: true, enabled });
        break;
      }

      case "SAVE_PILLAR_FILTERS": {
        await chrome.storage.local.set({ pillarFilters: msg.filters });
        sendResponse({ ok: true });
        break;
      }

      case "RESET_ERE": {
        await chrome.storage.local.set({
          hudPosition: { x: null, y: null },
          idleOpacity: 100,
          bitcointalkDarkTheme: false
        });
        broadcastMessage({ type: "HUD_POS_CHANGED", x: null, y: null });
        broadcastMessage({ type: "IDLE_OPACITY_CHANGED", opacity: 100 });
        broadcastMessage({ type: "BTT_DARK_THEME_CHANGED", enabled: false });
        const { ere_uuid } = await chrome.storage.local.get("ere_uuid");
        if (ere_uuid) {
          fetch("https://elon.report/wp-json/ere/v1/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              uuid: ere_uuid,
              settings: { hudPosition: { x: null, y: null }, idleOpacity: 100, bitcointalkDarkTheme: false }
            })
          }).catch(() => {});
        }
        sendResponse({ ok: true });
        break;
      }

      case "GET_STATS_LIVE": {
        const { ere_uuid, personalStats } = await chrome.storage.local.get(["ere_uuid", "personalStats"]);
        try {
          const res = await fetch(`https://elon.report/wp-json/ere/v1/stats?uuid=${encodeURIComponent(ere_uuid)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.exists) {
              const updated = {
                totalPagesTracked: data.total_visits,
                meritPoints: data.merit_points,
                pillarCounts: data.pillar_counts || {}
              };
              await chrome.storage.local.set({ personalStats: updated });
              sendResponse({ ok: true, stats: updated });
              return;
            }
          }
        } catch (e) {}
        sendResponse({ ok: true, stats: personalStats });
        break;
      }

      case "SUBMIT_DOMAIN": {
        const { domain, category_id, is_report } = msg;
        const catId = parseInt(category_id !== undefined ? category_id : 0, 10);
        const { ere_uuid } = await chrome.storage.local.get("ere_uuid");
        const cleanHost = (domain || "").toLowerCase().replace(/^www\./, "");

        try {
          fetch(SUBMIT_DOMAIN_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              domain: cleanHost,
              category_id: catId,
              uuid: ere_uuid,
              is_report: !!is_report
            })
          }).catch(() => {});
        } catch (e) {}

        sendResponse({
          success: true,
          pending: true,
          domain: cleanHost,
          categoryId: catId,
          isReport: !!is_report,
          category: CATEGORIES[catId] || { id: 0, name: "Exclude / Not Relevant", short: "Excluded" }
        });
        break;
      }

      case "FORCE_SYNC": {
        syncDomains(true);
        sendResponse({ ok: true, status: "started" });
        break;
      }

      default:
        sendResponse({ error: "Unknown message type" });
    }
  })();
  return true;
});

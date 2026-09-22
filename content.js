(function () {
  if (window.__ERE_INITIALIZED__) return;
  window.__ERE_INITIALIZED__ = true;

  const ERE_VERSION = chrome.runtime?.getManifest?.()?.version || "1.2.11";
  const HUD_LOADING_HTML = `<svg class="ere-hud-spinner" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="6" stroke="rgba(201, 162, 39, 0.25)" stroke-width="2.2" /><path d="M14 8a6 6 0 0 0-6-6" stroke="#c9a227" stroke-width="2.2" stroke-linecap="round" /></svg>`;

  let state = {
    uuid: "loading...",
    isUuidSaved: false,
    isRestoringUuid: false,
    isPaused: false,
    idleOpacity: 100,
    bitcointalkDarkTheme: false,
    privacyHistory: [],
    hudPosition: { x: null, y: null },
    category: null,
    categoryId: null,
    ranking: { rank: null, unique_visitors_24h: 0, total_category_domains_24h: 0, total_category_urls_24h: 0 },
    trendRange: "28d",
    visitRange: "24h",
    trendMode: "rank",
    trendData: { points: [], peak: 1, low: 1, delta: 0, deltaStr: "0 (Stable)" },
    personalStats: { totalPagesTracked: 0, meritPoints: 0, pillarCounts: {} },
    levelThresholds: { level_2: 10, level_3: 100, level_4: 1000 },
    pillarFilters: {},
    lastSyncTime: null,
    totalDomains: 0,
    categories: {},
    isModalOpen: false,
    isSubmittingDomain: false,
    hudDisplayMode: "total",
    totalTrackedVisitors: 0,
    activeTab: 1
  };

  function applyBitcointalkDarkTheme(enabled) {
    if (!window.location.hostname.includes("bitcointalk.org")) return;
    try {
      if (enabled) {
        localStorage.setItem("ere_btt_dark_theme", "1");
      } else {
        localStorage.removeItem("ere_btt_dark_theme");
      }
    } catch (e) {}

    let styleEl = document.getElementById("ere-btt-dark-theme");
    if (enabled) {
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = "ere-btt-dark-theme";
        styleEl.textContent = `
          html, body {
            background-color: #0f172a !important;
            color: #cbd5e1 !important;
            min-height: 100vh;
          }
          a:link, a:visited {
            color: #60a5fa !important;
          }
          a:hover {
            color: #93c5fd !important;
          }
          .windowbg, #preview_body, div#preview_body {
            background-color: #1e293b !important;
            color: #cbd5e1 !important;
          }
          .windowbg2 {
            background-color: #182234 !important;
            color: #cbd5e1 !important;
          }
          .windowbg3 {
            background-color: #1e293b !important;
            color: #cbd5e1 !important;
          }
          .catbg, .catbg2, .catbg3, tr.catbg td, tr.catbg2 td, tr.catbg3 td {
            background-color: #1e293b !important;
            color: #f8fafc !important;
            background-image: none !important;
          }
          .titlebg, .titlebg2, tr.titlebg td, tr.titlebg2 td, tr.titlebg th, tr.titlebg2 th, #preview_subject, td#preview_subject {
            background-color: #334155 !important;
            color: #f8fafc !important;
            background-image: none !important;
          }
          .bordercolor, .tborder {
            background-color: #334155 !important;
            border: 1px solid #334155 !important;
          }
          #topic_summary, #topic_summary table, #topic_summary tbody, #topic_summary tr, #topic_summary td {
            background-color: #1e293b !important;
            color: #cbd5e1 !important;
          }
          #topic_summary .windowbg2, #topic_summary tr.windowbg2 td {
            background-color: #182234 !important;
            color: #cbd5e1 !important;
          }
          #topic_summary .catbg, #topic_summary .catbg2, #topic_summary .catbg3,
          #topic_summary tr.catbg td, #topic_summary tr.catbg2 td, #topic_summary tr.catbg3 td {
            background-color: #1e293b !important;
            color: #f8fafc !important;
            background-image: none !important;
          }
          #topic_summary .titlebg, #topic_summary tr.titlebg td {
            background-color: #334155 !important;
            color: #f8fafc !important;
            background-image: none !important;
          }
          #quickReplyOptions, #quickReplyOptions table, #quickReplyOptions td, #quickReplyOptions tr {
            background-color: #1e293b !important;
            color: #cbd5e1 !important;
            border-color: #334155 !important;
          }
          #quickReplyOptions .catbg, #quickReplyOptions .titlebg {
            background-color: #334155 !important;
            color: #f8fafc !important;
            background-image: none !important;
          }
          .maintab_back, .maintab_active_back,
          .maintab_left, .maintab_right,
          .maintab_active_left, .maintab_active_right,
          .mirrortab_back, .mirrortab_active_back,
          .mirrortab_left, .mirrortab_right,
          .mirrortab_active_left, .mirrortab_active_right {
            background-color: #1e293b !important;
            background-image: none !important;
            border-color: #475569 !important;
          }
          .maintab_active_back, .maintab_active_left, .maintab_active_right,
          .mirrortab_active_back, .mirrortab_active_left, .mirrortab_active_right {
            background-color: #334155 !important;
          }
          .maintab_back a, .maintab_left a, .maintab_right a,
          .mirrortab_back a, .mirrortab_left a, .mirrortab_right a {
            color: #94a3b8 !important;
            font-weight: 700 !important;
            text-decoration: none !important;
            text-shadow: none !important;
          }
          .maintab_back a:hover, .mirrortab_back a:hover {
            color: #f8fafc !important;
            text-decoration: none !important;
          }
          .maintab_active_back a, .maintab_active_left a, .maintab_active_right a,
          .mirrortab_active_back a, .mirrortab_active_left a, .mirrortab_active_right a {
            color: #60a5fa !important;
            font-weight: 800 !important;
            text-decoration: none !important;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8) !important;
          }
          textarea, select, button, input:not([type="checkbox"]):not([type="radio"]) {
            background-color: #1e293b !important;
            color: #f8fafc !important;
            border: 1px solid #475569 !important;
          }
          textarea:focus, input:focus, select:focus {
            outline: none !important;
            border-color: #60a5fa !important;
            box-shadow: 0 0 0 1px #60a5fa !important;
          }
          select option {
            background-color: #1e293b !important;
            color: #f8fafc !important;
          }
          input[type="submit"], input[type="button"], input[type="reset"], button {
            cursor: pointer;
          }
          input[type="submit"]:hover, input[type="button"]:hover, button:hover {
            background-color: #334155 !important;
            border-color: #60a5fa !important;
            color: #ffffff !important;
          }
          img[style*="bbc_bg.gif"] {
            background-image: none !important;
            background-color: #334155 !important;
            border-radius: 3px;
          }
          .post, .inner, .keyinfo, .smalltext, .middletext, .nav, td, #preview_body, #preview_subject, #topic_summary, td[id^="msg"] {
            color: #cbd5e1 !important;
          }
          form[action*="action=pm"] .windowbg, form[action*="action=pm"] .windowbg2, form[action*="action=pm"] td[class^="windowbg"], form[action*="action=pm"] .signature {
            background-color: #0f172a !important;
            color: #cbd5e1 !important;
          }
          form[action*="action=post"] .windowbg, form#postmodify .windowbg {
            background-color: #1e293b !important;
            color: #cbd5e1 !important;
          }
          form[action*="action=post"] .windowbg2, form#postmodify .windowbg2 {
            background-color: #182234 !important;
            color: #cbd5e1 !important;
          }
          .quote, .quoteheader, blockquote, div.quote, td.quote, .code, .codeheader {
            background-color: #020617 !important;
            border: 1px solid #475569 !important;
            color: #cbd5e1 !important;
          }
          .quoteheader, .codeheader {
            color: #94a3b8 !important;
            font-weight: 700 !important;
          }
          abbr, acronym, span[title], span[style*="border-bottom"], span[style*="dotted"], *[style*="border-bottom"], *[style*="dotted"] {
            border-bottom-color: #94a3b8 !important;
          }
          abbr, acronym, span[title] {
            border-bottom: 1px dotted #94a3b8 !important;
            text-decoration: none !important;
          }
          .smalltext, .middletext {
            color: #94a3b8 !important;
          }
          .smalltext i, .smalltext em {
            color: #cbd5e1 !important;
          }
          hr, .hrcolor {
            background-color: #334155 !important;
            color: #334155 !important;
            border-color: #334155 !important;
            height: 1px !important;
            border: 0 !important;
          }
          .error {
            color: #f87171 !important;
            font-weight: bold !important;
          }
          .highlight {
            background-color: #854d0e !important;
            color: #fef08a !important;
          }
        `;
        (document.head || document.documentElement).appendChild(styleEl);
      }
    } else {
      if (styleEl) {
        styleEl.remove();
      }
      document.getElementById("ere-btt-dark-theme-boot")?.remove();
    }
  }

  const host = document.createElement("div");
  host.id = "ere-extension-host";
  document.documentElement.appendChild(host);
  const shadow = host.attachShadow({ mode: "open" });

  const criticalStyle = document.createElement("style");
  criticalStyle.textContent = `
    .ere-modal-overlay:not(.is-open) { display: none !important; opacity: 0 !important; visibility: hidden !important; pointer-events: none !important; }
    .ere-modal-window:not(.is-open) { display: none !important; opacity: 0 !important; visibility: hidden !important; pointer-events: none !important; }
    .ere-hud-pill {
      position: fixed !important;
      z-index: 2147483647 !important;
      display: flex !important;
      align-items: stretch !important;
      box-sizing: border-box !important;
      min-width: 80px !important;
      max-width: 140px !important;
      height: 28px !important;
      padding: 0 !important;
    }
    .ere-hud-spinner {
      display: inline-block !important;
      width: 14px !important;
      height: 14px !important;
      min-width: 14px !important;
      min-height: 14px !important;
      animation: ere-hud-spin 0.85s linear infinite !important;
      flex-shrink: 0 !important;
    }
    @keyframes ere-hud-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  shadow.appendChild(criticalStyle);

  const styleLink = document.createElement("link");
  styleLink.rel = "stylesheet";
  styleLink.href = chrome.runtime.getURL("styles.css");
  shadow.appendChild(styleLink);

  const root = document.createElement("div");
  root.className = "ere-root";
  shadow.appendChild(root);

  const hud = document.createElement("div");
  hud.className = "ere-hud-pill";
  hud.innerHTML = `
    <div class="ere-hud-left" id="ere-hud-left">
      <div class="ere-hud-indicator"></div>
      <div class="ere-hud-tooltip ere-hud-tooltip-left"></div>
    </div>
    <div class="ere-hud-divider"></div>
    <div class="ere-hud-right" id="ere-hud-right">
      <div class="ere-hud-value">${HUD_LOADING_HTML}</div>
      <div class="ere-hud-tooltip ere-hud-tooltip-right">Connecting to telemetry...</div>
    </div>
  `;
  root.appendChild(hud);

  const overlay = document.createElement("div");
  overlay.className = "ere-modal-overlay";
  root.appendChild(overlay);

  const modal = document.createElement("div");
  modal.className = "ere-modal-window";
  root.appendChild(modal);

  try {
    const cachedPos = JSON.parse(localStorage.getItem("ere_hud_pos"));
    if (cachedPos && !isNaN(cachedPos.x) && !isNaN(cachedPos.y)) {
      if (cachedPos.y > window.innerHeight - 120 && cachedPos.x > window.innerWidth - 180) {
        localStorage.removeItem("ere_hud_pos");
      } else {
        state.hudPosition = cachedPos;
      }
    }
  } catch (e) {}
  applyPosition(state.hudPosition);
  updateHUD();

  function setGlobalVisits(newCount) {
    const n = parseInt(newCount, 10);
    if (!isNaN(n) && n > 0) {
      const changed = (state.totalTrackedVisitors !== n);
      state.totalTrackedVisitors = n;
      if (changed && (state.hudDisplayMode || "total") === "total") {
        updateHUD();
      }
    }
  }

  async function init() {
    try {
      const response = await Promise.race([
        chrome.runtime.sendMessage({
          type: "GET_INITIAL_STATE",
          hostname: window.location.hostname,
          pathname: window.location.pathname
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout waiting for background service worker")), 2500))
      ]);

      if (response) {
        const initVisitors = parseInt(response.totalTrackedVisitors, 10) || 0;
        state = { ...state, ...response, isModalOpen: false };
        if (initVisitors > 0) {
          state.totalTrackedVisitors = Math.max(state.totalTrackedVisitors || 0, initVisitors);
        }
        chrome.storage.local.remove(["isModalOpen"]).catch(() => {});
        applyBitcointalkDarkTheme(state.bitcointalkDarkTheme);
        hud.style.setProperty("--ere-idle-opacity", ((state.idleOpacity !== undefined ? state.idleOpacity : 100) / 100).toString());
        applyPosition(state.hudPosition);
        updateHUD();
        hud.classList.add("is-ready");
        requestAnimationFrame(() => {
          applyPosition(state.hudPosition);
        });

        if (state.activeTab === 4) {
          chrome.runtime.sendMessage({ type: "GET_PRIVACY_LOG" }, (res) => {
            if (res && res.history) {
              state.privacyHistory = res.history;
              if (state.isModalOpen) renderModal();
            }
          });
        }

        if (state.categoryId) {
          fetchTrendData(state.trendRange || "28d");
        } else {
          chrome.runtime.sendMessage({
            type: "LOG_UNTRACKED_DOMAIN",
            hostname: window.location.hostname
          });
        }

        function getBaseDomain(hostname, pathname) {
          const cleanHost = (hostname || "").toLowerCase().replace(/^www\./, "");
          
          // Exception: Reddit subreddits identify the community/pillar
          if (cleanHost === "reddit.com" || cleanHost.endsWith(".reddit.com")) {
            const p = pathname || "";
            const match = p.match(/^\/r\/([a-zA-Z0-9_]+)/i);
            if (match && match[1]) {
              return `reddit.com/r/${match[1].toLowerCase()}`;
            }
            return "reddit.com";
          }

          // All other domains: strip down to root domain only
          return cleanHost;
        }

        if (state.categoryId && !state.isPaused) {
          const baseDomain = getBaseDomain(window.location.hostname, window.location.pathname);
          chrome.runtime.sendMessage({
            type: "LOG_PAGE_TRACK",
            categoryId: state.categoryId,
            hostname: window.location.hostname,
            domain: baseDomain
          }, (res) => {
            if (res && res.tracked) {
              state.personalStats = res.stats;
              if (res.ranking) {
                state.ranking = res.ranking;
              }
              if (res.globalTotalVisits !== undefined && res.globalTotalVisits > 0) {
                setGlobalVisits(res.globalTotalVisits);
              }
              updateHUD();
              if (state.activeTab === 4) {
                chrome.runtime.sendMessage({ type: "GET_PRIVACY_LOG" }, (pRes) => {
                  if (pRes && pRes.history) {
                    state.privacyHistory = pRes.history;
                    if (state.isModalOpen) {
                      const pList = modal.querySelector("#ere-privacy-list");
                      if (pList) {
                        pList.innerHTML = renderPrivacyList();
                        attachPrivacySubmitListeners();
                      }
                    }
                  }
                });
              }
              if (state.isModalOpen && state.activeTab !== 4) {
                renderModal();
              }
            }
          });
        }
        startLiveTicker();
      }
    } catch (err) {
      chrome.storage.local.get(["hudPosition"], (cached) => {
        if (cached && cached.hudPosition) {
          state.hudPosition = cached.hudPosition;
        }
        applyPosition(state.hudPosition);
        updateHUD();
        hud.classList.add("is-ready");
        requestAnimationFrame(() => {
          applyPosition(state.hudPosition);
        });
        startLiveTicker();
      });
    }
  }

  let liveTickerInterval = null;

  function startLiveTicker() {
    if (liveTickerInterval) clearInterval(liveTickerInterval);
    const tick = () => {
      if (state.isPaused || document.hidden) return;
      const currentMode = state.hudDisplayMode || "total";
      if (currentMode === "total") {
        chrome.runtime.sendMessage({ type: "GET_GLOBAL_STATS" }, (res) => {
          if (res && res.ok && res.totalVisitors !== undefined) {
            setGlobalVisits(res.totalVisitors);
          }
        });
      }
    };
    tick();
    liveTickerInterval = setInterval(tick, 2000);
  }

  async function fetchTrendData(range) {
    if (!state.categoryId) return;
    state.trendRange = range || state.trendRange || "28d";

    try {
      const res = await chrome.runtime.sendMessage({
        type: "GET_RANK_TREND",
        domain: window.location.hostname,
        categoryId: state.categoryId,
        range: state.trendRange
      });

      if (res && res.success) {
        state.trendData = {
          points: res.points || [],
          peak: res.peak || 1,
          low: res.low || 1,
          delta: res.delta || 0,
          deltaStr: res.delta_str || "0 (Stable)"
        };
        const graphContainer = modal.querySelector(".ere-graph-container");
        if (graphContainer) {
          graphContainer.innerHTML = renderTrendGraph();
        }
        updateTrendStats();
        modal.querySelectorAll(".ere-trend-pill").forEach((pill) => {
          const pRange = pill.getAttribute("data-range");
          const activeRange = state.trendMode === "visits" ? state.visitRange : state.trendRange;
          pill.classList.toggle("is-active", pRange === activeRange);
        });
      }
    } catch (err) {}
  }

  function updateHUD() {
    hud.classList.toggle("is-paused", !!state.isPaused);
    hud.classList.toggle("is-untracked", !state.categoryId);
    hud.classList.toggle("needs-save", !state.isUuidSaved);

    hud.removeAttribute("title");

    const valEl = hud.querySelector(".ere-hud-value");
    const leftTooltip = hud.querySelector(".ere-hud-tooltip-left");
    const rightTooltip = hud.querySelector(".ere-hud-tooltip-right");
    const domain = window.location.hostname.replace(/^www\./i, "");

    const currentMode = state.hudDisplayMode || "total";
    const isTotalMode = currentMode === "total";
    const isUniqueMode = currentMode === "unique" || currentMode === "visits";
    const isRankMode = currentMode === "rank";

    const catName = state.category ? (state.category.short_name || state.category.name) : null;

    if (leftTooltip) {
      leftTooltip.textContent = state.isPaused
        ? `Everything is ok v${ERE_VERSION} (Paused)`
        : `Everything is ok v${ERE_VERSION}`;
    }

    if (state.isPaused) {
      valEl.textContent = "⏸";
      if (rightTooltip) rightTooltip.textContent = "Tracking paused";
    } else if (isTotalMode) {
      const totalVisitors = state.totalTrackedVisitors || 0;
      if (totalVisitors > 0) {
        valEl.textContent = totalVisitors.toLocaleString();
        if (rightTooltip) {
          rightTooltip.textContent = `Total Tracked Visits: ${totalVisitors.toLocaleString()}`;
        }
      } else {
        valEl.innerHTML = HUD_LOADING_HTML;
        if (rightTooltip) {
          rightTooltip.textContent = "Connecting to telemetry...";
        }
      }
    } else if (isUniqueMode) {
      if (state.category) {
        const visitors = state.ranking && state.ranking.unique_visitors_24h ? state.ranking.unique_visitors_24h : 1;
        valEl.textContent = `${visitors.toLocaleString()}`;
        if (rightTooltip) {
          rightTooltip.textContent = `24h Unique Visitors: ${visitors.toLocaleString()}`;
        }
      } else if (state.category === null && state.uuid === "loading...") {
        valEl.innerHTML = HUD_LOADING_HTML;
        if (rightTooltip) {
          rightTooltip.textContent = "Classifying domain...";
        }
      } else {
        valEl.textContent = "—";
        if (rightTooltip) {
          rightTooltip.textContent = `Unique Visitors: — (Untracked domain)`;
        }
      }
    } else if (isRankMode) {
      if (state.category) {
        const rankNum = state.ranking && state.ranking.rank ? state.ranking.rank : 1;
        valEl.textContent = `#${rankNum.toLocaleString()}`;
        if (rightTooltip) {
          rightTooltip.textContent = `Rank #${rankNum.toLocaleString()} in ${catName}`;
        }
      } else if (state.category === null && state.uuid === "loading...") {
        valEl.innerHTML = HUD_LOADING_HTML;
        if (rightTooltip) {
          rightTooltip.textContent = "Calculating ranking...";
        }
      } else {
        valEl.textContent = "—";
        if (rightTooltip) {
          rightTooltip.textContent = `Rank: — (Untracked domain)`;
        }
      }
    }
  }

  function applyPosition(pos) {
    let measuredWidth = hud.offsetWidth;
    if (!measuredWidth || measuredWidth < 80 || measuredWidth > 200) {
      measuredWidth = 88;
    }
    const width = measuredWidth;
    const height = 28;
    const maxLeft = Math.max(10, window.innerWidth - width - 10);
    const maxTop = Math.max(10, window.innerHeight - height - 10);

    let left = pos && pos.x !== null && !isNaN(pos.x) ? pos.x : window.innerWidth - width - 24;
    let top = pos && pos.y !== null && !isNaN(pos.y) ? pos.y : 24;

    left = Math.min(Math.max(10, left), maxLeft);
    top = Math.min(Math.max(10, top), maxTop);

    hud.style.left = `${Math.round(left)}px`;
    hud.style.top = `${Math.round(top)}px`;
    hud.style.right = "auto";
    hud.style.bottom = "auto";

    hud.classList.toggle("flip-tooltip", top < 45);

    positionModal(left, top);
  }

  function positionModal(hudLeft, hudTop) {
    if (typeof modal === "undefined" || !modal) return;
    if (hudLeft === undefined || hudTop === undefined) {
      const rect = hud.getBoundingClientRect();
      hudLeft = rect.left;
      hudTop = rect.top;
    }

    const modalWidth = 440;
    const modalHeight = modal.offsetHeight || 535;
    let mLeft = hudLeft - modalWidth + 64;
    
    let mTop = hudTop - modalHeight - 12;

    if (mTop < 16) {
      mTop = hudTop + 44;
    }

    if (mTop + modalHeight > window.innerHeight - 16) {
      mTop = Math.max(16, window.innerHeight - modalHeight - 16);
    }

    if (mTop < 16) {
      mTop = 16;
    }

    if (mLeft < 16) mLeft = 16;
    if (mLeft + modalWidth > window.innerWidth - 16) {
      mLeft = Math.max(16, window.innerWidth - modalWidth - 16);
    }

    modal.style.left = `${Math.round(mLeft)}px`;
    modal.style.top = `${Math.round(mTop)}px`;
  }

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let initialLeft = 0;
  let initialTop = 0;
  let hasMoved = false;

  function onMouseDown(e) {
    if (e.button !== 0) return;
    isDragging = true;
    hasMoved = false;
    startX = e.clientX;
    startY = e.clientY;

    const rect = hud.getBoundingClientRect();
    initialLeft = hud.style.left ? parseFloat(hud.style.left) : rect.left;
    initialTop = hud.style.top ? parseFloat(hud.style.top) : rect.top;

    hud.classList.add("is-dragging");
    window.addEventListener("mousemove", onMouseMove, true);
    window.addEventListener("mouseup", onMouseUp, true);
    e.preventDefault();
  }

  function onMouseMove(e) {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasMoved = true;
    }

    applyPosition({ x: initialLeft + dx, y: initialTop + dy });
  }

  function onMouseUp(e) {
    if (!isDragging) return;
    isDragging = false;
    hud.classList.remove("is-dragging");
    window.removeEventListener("mousemove", onMouseMove, true);
    window.removeEventListener("mouseup", onMouseUp, true);

    if (hasMoved) {
      const currentX = parseFloat(hud.style.left);
      const currentY = parseFloat(hud.style.top);
      const finalPos = {
        x: !isNaN(currentX) ? Math.round(currentX) : Math.round(hud.getBoundingClientRect().left),
        y: !isNaN(currentY) ? Math.round(currentY) : Math.round(hud.getBoundingClientRect().top)
      };

      state.hudPosition = finalPos;
      try {
        localStorage.setItem("ere_hud_pos", JSON.stringify(finalPos));
      } catch (e) {}
      // 1. Immediately persist to local storage for zero-latency survival across page refresh
      chrome.storage.local.set({ hudPosition: finalPos }).catch(() => {});

      // 2. Also send message to background service worker for remote settings sync and cross-tab broadcast
      chrome.runtime.sendMessage({
        type: "SAVE_HUD_POS",
        x: finalPos.x,
        y: finalPos.y
      }).catch(() => {});
    } else {
      toggleModal();
    }
  }

  hud.addEventListener("mousedown", onMouseDown);

  function refreshPrivacyTab() {
    chrome.runtime.sendMessage({ type: "GET_PRIVACY_LOG" }).then((res) => {
      if (res && res.history) {
        state.privacyHistory = res.history;
        const pList = modal.querySelector("#ere-privacy-list");
        if (pList) {
          pList.innerHTML = renderPrivacyList();
          attachPrivacySubmitListeners();
        }
      }
    }).catch(() => {});
  }

  function toggleModal(forceState) {
    state.isModalOpen = forceState !== undefined ? forceState : !state.isModalOpen;
    overlay.classList.toggle("is-open", state.isModalOpen);
    modal.classList.toggle("is-open", state.isModalOpen);
    if (state.isModalOpen) {
      renderModal();
      if (state.activeTab === 4) {
        refreshPrivacyTab();
      }
    }
  }

  overlay.addEventListener("click", () => toggleModal(false));

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state.isModalOpen) {
      toggleModal(false);
    }
  });

  async function togglePause() {
    const res = await chrome.runtime.sendMessage({ type: "TOGGLE_PAUSE" });
    if (res) {
      state.isPaused = res.isPaused;
      updateHUD();
      renderModal();
    }
  }

  function renderTrendPillsHTML() {
    if (state.trendMode === "visits") {
      const active = state.visitRange || "24h";
      return `
        <button class="ere-trend-pill ${active === '24h' ? 'is-active' : ''}" data-range="24h">24H</button>
        <button class="ere-trend-pill ${active === '7d' ? 'is-active' : ''}" data-range="7d">7D</button>
        <button class="ere-trend-pill ${active === '28d' ? 'is-active' : ''}" data-range="28d">28D</button>
      `;
    }
    const active = state.trendRange || "28d";
    return `
      <button class="ere-trend-pill ${active === '7d' ? 'is-active' : ''}" data-range="7d">7D</button>
      <button class="ere-trend-pill ${active === '28d' ? 'is-active' : ''}" data-range="28d">28D</button>
      <button class="ere-trend-pill ${active === 'all' ? 'is-active' : ''}" data-range="all">ALL</button>
    `;
  }

  function formatRelativeTime(ts) {
    const sec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    return `${min}m ago`;
  }

  function renderPrivacyList() {
    const cutoff = Date.now() - (60 * 60 * 1000);
    const rawItems = (state.privacyHistory || []).filter(item => item.time >= cutoff);

    // If domain is at the top/consecutive, edit it; otherwise add/preserve as a new record
    const items = [];
    for (const item of rawItems) {
      if (items.length === 0 || items[items.length - 1].domain !== item.domain) {
        items.push(item);
      }
    }

    if (items.length === 0) {
      return `<div style="text-align: center; color: #64748b; font-size: 11.5px; padding: 24px 0;">No telemetry events in the last 60 minutes.</div>`;
    }
    return items.map(item => {
      const cat = item.categoryId ? state.categories?.[item.categoryId] : null;
      return `
        <div class="ere-privacy-item">
          <div>
            <div class="ere-privacy-domain">${escapeHTML(item.domain)}</div>
            <div class="ere-privacy-time">${formatRelativeTime(item.time)}</div>
          </div>
          <div>
            ${item.isTracked && cat ? `
              <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 3px;">
                <span class="ere-pillar-badge" style="margin: 0; padding: 2px 7px; font-size: 10px; font-weight: 700;">
                  Pillar ${item.categoryId}: ${escapeHTML(cat.short || cat.name)}
                </span>
                <a class="ere-submit-link ere-privacy-report-btn" data-domain="${escapeHTML(item.domain)}" data-category-id="${item.categoryId}" style="color: #94a3b8; font-size: 10px; text-decoration: underline; cursor: pointer;">Report</a>
              </div>
            ` : `
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="color: #64748b; font-size: 10.5px;">Untracked</span>
                <a class="ere-submit-link ere-privacy-submit-btn" data-domain="${escapeHTML(item.domain)}" style="color: #facc15; font-size: 11px; text-decoration: underline; cursor: pointer;">Submit</a>
              </div>
            `}
          </div>
        </div>
      `;
    }).join("");
  }

  function renderModal() {
    const currentHost = window.location.hostname;
    const cat = state.category;
    const pauseLabel = state.isPaused ? "▶ Resume Tracking" : "⏸ Pause Tracking";
    const statusText = state.isPaused ? "PAUSED" : (cat ? "ACTIVE" : "IDLE");
    const isVisitsMode = state.trendMode === "visits";
    const trendTitle = isVisitsMode ? "PAGE VISIT TREND" : "PAGE RANK TREND";

    modal.innerHTML = `
      <div class="ere-header">
        <div class="ere-brand">
          <div class="ere-logo-badge">ER</div>
          <div>
            <div class="ere-brand-title">The Elon Report <span class="ere-version-tag">v${ERE_VERSION}</span></div>
          </div>
        </div>
        <div class="ere-header-actions">
          <a class="ere-pause-link" id="ere-btn-pause">${pauseLabel}</a>
          <button class="ere-close-btn" id="ere-btn-close" title="Close Window">✕</button>
        </div>
      </div>

      <div class="ere-tabs-bar">
        <button class="ere-tab-btn ${state.activeTab === 1 ? 'is-active' : ''}" data-tab="1">Current URL</button>
        <button class="ere-tab-btn ${state.activeTab === 2 ? 'is-active' : ''}" data-tab="2">Pillar Stats</button>
        <button class="ere-tab-btn ${state.activeTab === 3 ? 'is-active' : ''} ${!state.isUuidSaved ? 'ere-pulse-tab' : ''}" data-tab="3">Options</button>
        <button class="ere-tab-btn ${state.activeTab === 4 ? 'is-active' : ''}" data-tab="4">Privacy</button>
      </div>

      <div class="ere-body">
        <div class="ere-tab-panel ${state.activeTab === 1 ? 'is-active' : ''}" id="ere-panel-1">
          ${state.isSubmittingDomain ? `
            <div class="ere-card" style="border-top: 2px solid #c9a227;">
              <div class="ere-card-header">
                <span>${state.isReportMode ? 'Report / Recategorize Domain' : 'Submit New Domain'}</span>
                <span class="ere-tag" style="color: #facc15; background: rgba(201, 162, 39, 0.15);">Admin Queue</span>
              </div>
              <div style="margin: 10px 0 14px;">
                <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 600; letter-spacing: 0.04em;">Target Domain</div>
                <div style="font-size: 14px; font-weight: 700; color: #f8fafc; margin-top: 3px; word-break: break-all;">
                  ${escapeHTML(state.submittingDomain || currentHost)}
                </div>
              </div>
              <div style="margin-bottom: 16px;">
                <label for="ere-select-category" style="font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 600; display: block; margin-bottom: 6px; letter-spacing: 0.04em;">Suggested Pillar Category</label>
                <select id="ere-select-category" class="ere-select">
                  <option value="1" ${state.submittingCurrentCatId === 1 ? 'selected' : ''}>1. Transportation / Autonomous Vehicles</option>
                  <option value="2" ${state.submittingCurrentCatId === 2 ? 'selected' : ''}>2. Neurotechnology / Robotics & Automation</option>
                  <option value="3" ${state.submittingCurrentCatId === 3 ? 'selected' : ''}>3. Artificial Intelligence / Frontier Compute</option>
                  <option value="4" ${state.submittingCurrentCatId === 4 ? 'selected' : ''}>4. Space Exploration / Orbital & Deep Space</option>
                  <option value="5" ${state.submittingCurrentCatId === 5 ? 'selected' : ''}>5. Politics (Reality)</option>
                  <option value="6" ${state.submittingCurrentCatId === 6 ? 'selected' : ''}>6. Energy Systems / Storage & Power</option>
                  <option value="7" ${state.submittingCurrentCatId === 7 ? 'selected' : ''}>7. Investments / Financial Realities & Equities</option>
                  <option value="8" ${(state.submittingCurrentCatId === 8 || (!state.submittingCurrentCatId && state.submittingCurrentCatId !== 0)) ? 'selected' : ''}>8. Crypto Ecosystem / Mining & Digital Assets</option>
                  <option value="9" ${state.submittingCurrentCatId === 9 ? 'selected' : ''}>9. Digital Town Square / Media & Social</option>
                  <option value="0" ${state.submittingCurrentCatId === 0 ? 'selected' : ''}>0. Exclude / Not Related to Elon Report</option>
                </select>
              </div>
              <div style="display: flex; gap: 8px;">
                <button class="ere-btn" id="ere-btn-submit-domain">ADD TO ADMIN QUEUE</button>
                <button class="ere-btn secondary" id="ere-btn-cancel-submit" style="width: 35%;">Cancel</button>
              </div>
            </div>
          ` : `
            ${cat ? `
              <div class="ere-card" style="border-left: 3px solid #c9a227; background: rgba(201, 162, 39, 0.07);">
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr>
                      <th style="width: 50%; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: #94a3b8; padding-bottom: 6px; line-height: 1.35;">
                        <div>24-Hour Category</div>
                        <div style="color: #cbd5e1; font-weight: 700;">Ranking</div>
                      </th>
                      <th style="width: 50%; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: #94a3b8; padding-bottom: 6px; padding-left: 14px; border-left: 1px solid rgba(255, 255, 255, 0.08); line-height: 1.35;">
                        <div>24-Hour Unique</div>
                        <div style="color: #cbd5e1; font-weight: 700;">Visitors</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style="vertical-align: top;">
                        <div style="display: flex; flex-direction: column;">
                          <span style="font-size: 30px; font-weight: 800; color: #facc15; line-height: 1.1;"><span style="color: #facc15;">#</span>${state.ranking.rank || 1}</span>
                          <span style="font-size: 11px; color: #94a3b8; font-weight: 500; margin-top: 3px;">of ${(state.ranking.total_category_domains_24h || state.ranking.total_category_urls_24h || 1).toLocaleString()} Domains</span>
                        </div>
                      </td>
                      <td style="vertical-align: top; padding-left: 14px; border-left: 1px solid rgba(255, 255, 255, 0.08);">
                        <div style="display: flex; flex-direction: column;">
                          <span style="font-size: 30px; font-weight: 800; color: #facc15; line-height: 1.1;">${(state.ranking.unique_visitors_24h || 1).toLocaleString()}</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ` : ''}

            <div class="ere-card">
              <div class="ere-card-header">
                <span>Domain Classification</span>
                ${cat ? `
                  <button id="ere-btn-report-current-domain" style="padding: 2px 8px; font-size: 10px; font-weight: 600; border-radius: 4px; border: 1px solid rgba(255, 255, 255, 0.12); background: rgba(255, 255, 255, 0.06); color: #f8fafc; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; line-height: 1.4; text-transform: uppercase;" title="Report or recategorize this domain">
                    Actions
                  </button>
                ` : `
                  <span class="ere-tag">${statusText}</span>
                `}
              </div>
              <div class="ere-domain-badge" style="display: inline-block; font-size: 13.5px; font-weight: 700; padding: 4px 10px; border-radius: 6px; background: ${cat ? 'rgba(201, 162, 39, 0.15)' : 'rgba(255, 255, 255, 0.05)'}; color: ${cat ? '#facc15' : '#f8fafc'}; border: 1px solid ${cat ? 'rgba(201, 162, 39, 0.35)' : 'rgba(255, 255, 255, 0.1)'}; word-break: break-all;">
                ${escapeHTML(currentHost)}
              </div>
              ${cat ? `
                <div style="margin-top: 6px; font-size: 12px; font-weight: 500; color: #94a3b8; word-break: break-word;">
                  <span style="color: #cbd5e1; font-weight: 600;">Pillar ${cat.id}:</span> ${cat.name}
                </div>
              ` : `
                ${state.submissionMessage ? `
                  <div style="margin-top: 8px; font-size: 12px; color: #facc15; background: rgba(250, 204, 21, 0.1); border: 1px solid rgba(250, 204, 21, 0.25); padding: 8px 10px; border-radius: 6px; line-height: 1.4;">
                    ✓ ${escapeHTML(state.submissionMessage)}
                  </div>
                ` : `
                  <div style="margin-top: 8px; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                    This domain is not in the active tracked database. <a class="ere-submit-link" id="ere-btn-start-submit">Add to Admin Queue</a>
                  </div>
                `}
              `}
            </div>

            ${cat ? `
              <div class="ere-card" style="padding-bottom: 14px;">
                <div class="ere-card-header">
                  <span id="ere-trend-card-title">${trendTitle}</span>
                  <div class="ere-trend-tabs" id="ere-trend-pills-container">
                    ${renderTrendPillsHTML()}
                  </div>
                </div>

                <div style="display: flex; gap: 8px; align-items: stretch; margin: 8px 0 10px;">
                  <div class="ere-graph-container" style="flex: 1; min-width: 0;">
                    ${renderTrendGraph()}
                  </div>
                  <div class="ere-graph-mode-toolbar">
                    <button class="ere-mode-btn ${state.trendMode !== 'visits' ? 'is-active' : ''}" data-mode="rank" title="Page Rank Trend">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </button>
                    <button class="ere-mode-btn ${state.trendMode === 'visits' ? 'is-active' : ''}" data-mode="visits" title="Page Visit Trend (Visits / hr)">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div class="ere-trend-stats-row">
                  <div class="ere-trend-stat">
                    <span class="ere-trend-label" id="ere-stat-label-1"></span>
                    <span class="ere-trend-val" id="ere-trend-stat-1"></span>
                  </div>
                  <div class="ere-trend-stat">
                    <span class="ere-trend-label" id="ere-stat-label-2"></span>
                    <span class="ere-trend-val" id="ere-trend-stat-2"></span>
                  </div>
                  <div class="ere-trend-stat">
                    <span class="ere-trend-label" id="ere-stat-label-3"></span>
                    <span class="ere-trend-val" id="ere-trend-stat-3"></span>
                  </div>
                </div>
              </div>
            ` : ''}
          `}
        </div>

        <div class="ere-tab-panel ${state.activeTab === 2 ? 'is-active' : ''}" id="ere-panel-2">
          <div class="ere-card">
            <div class="ere-card-header">Activity & Progress</div>
            <div class="ere-metric-row">
              <span class="ere-metric-label">Total Pages Visited</span>
              <span class="ere-metric-val" id="ere-stat-total-pages">${state.personalStats.totalPagesTracked || 0}</span>
            </div>
            <div class="ere-metric-row">
              <span class="ere-metric-label">Accumulated Points</span>
              <span class="ere-metric-val" id="ere-stat-merit-points" style="color: #eab308;">${state.personalStats.meritPoints || 0} pts</span>
            </div>
          </div>

          <div class="ere-card">
            <div class="ere-card-header">Pillar Stats</div>
            <div class="ere-bar-group">
              ${renderPillarBars()}
            </div>
          </div>
        </div>

        <div class="ere-tab-panel ${state.activeTab === 3 ? 'is-active' : ''}" id="ere-panel-3">
          <div class="ere-card">
            <div class="ere-card-header">
              <span>INTERFACE PREFERENCES</span>
              <button id="ere-btn-reset-hud" style="padding: 2px 8px; font-size: 10px; font-weight: 600; border-radius: 4px; border: 1px solid rgba(255, 255, 255, 0.12); background: rgba(255, 255, 255, 0.06); color: #f8fafc; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; line-height: 1.4; text-transform: none;">
                RESET GUI
              </button>
            </div>
            <div class="ere-pill-display-selector" style="margin-top: 10px; margin-bottom: 12px;">
              <button type="button" class="ere-pill-display-btn ${(!state.hudDisplayMode || state.hudDisplayMode === 'total') ? 'is-active' : ''}" data-mode="total" title="Total Visits for all tracked domains (default with live updates)">
                Total Visits<br><span style="font-size: 9px; opacity: 0.8; font-weight: normal;">(Default - Live)</span>
              </button>
              <button type="button" class="ere-pill-display-btn ${(state.hudDisplayMode === 'unique' || state.hudDisplayMode === 'visits') ? 'is-active' : ''}" data-mode="unique" title="Unique visitors for current domain">
                Unique Visitors<br><span style="font-size: 9px; opacity: 0.8; font-weight: normal;">(Current Domain)</span>
              </button>
              <button type="button" class="ere-pill-display-btn ${state.hudDisplayMode === 'rank' ? 'is-active' : ''}" data-mode="rank" title="Rank of the current domain in its category">
                Domain Rank<br><span style="font-size: 9px; opacity: 0.8; font-weight: normal;">(Category #)</span>
              </button>
            </div>
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255, 255, 255, 0.06); margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span class="ere-metric-label">Idle / Paused ERE Opacity</span>
                <span class="ere-metric-val" id="ere-val-idle-opacity" style="color: #facc15; font-size: 12px; font-weight: 700;">${state.idleOpacity !== undefined ? state.idleOpacity : 100}%</span>
              </div>
              <input type="range" id="ere-slider-idle-opacity" min="0" max="100" value="${state.idleOpacity !== undefined ? state.idleOpacity : 100}" class="ere-range-slider" />
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255, 255, 255, 0.06);">
              <div>
                <div style="font-size: 12px; font-weight: 600; color: #f8fafc;">Bitcointalk Legacy Dark Theme</div>
                <div style="font-size: 10.5px; color: #94a3b8;">Dark forum styling (bitcointalk.org only)</div>
              </div>
              <label class="ere-switch">
                <input type="checkbox" id="ere-toggle-btt-dark" ${state.bitcointalkDarkTheme ? 'checked' : ''} />
                <span class="ere-switch-slider"></span>
              </label>
            </div>
          </div>

          ${state.isRestoringUuid ? `
            <div class="ere-card" style="border: 1px solid rgba(201, 162, 39, 0.45); background: rgba(201, 162, 39, 0.08); border-top: 2px solid #c9a227;">
              <div class="ere-card-header" style="color: #facc15;">
                <span>Restore Saved UUID</span>
              </div>
              <p style="margin: 6px 0 10px; font-size: 11.5px; color: #cbd5e1; line-height: 1.45;">
                Enter your previously saved UUID to restore your identity, points, and forum connection.
              </p>
              <form id="ere-form-restore-uuid" style="display: flex; flex-direction: column; gap: 8px;">
                <input type="text" id="ere-input-restore-uuid" class="ere-select" placeholder="ere_..." style="font-family: monospace; font-size: 12px;" required />
                <div style="display: flex; gap: 8px; margin-top: 4px;">
                  <button type="submit" class="ere-btn" style="flex: 1; background: linear-gradient(135deg, #c9a227 0%, #eab308 100%); color: #0b0f19; font-weight: 700;">
                    Restore UUID
                  </button>
                  <button type="button" class="ere-btn secondary" id="ere-btn-cancel-restore" style="flex: 0 0 70px;">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ` : `
            ${!state.isUuidSaved ? `
              <div class="ere-card" style="border: 1px solid rgba(234, 179, 8, 0.45); background: rgba(234, 179, 8, 0.08); border-top: 2px solid #eab308;">
                <div class="ere-card-header" style="color: #facc15;">
                  <span>⚠️ Important: Save Your UUID</span>
                  <span class="ere-tag ere-pulse-badge" style="font-weight: 700;">Action Required</span>
                </div>
                <p style="margin: 6px 0 12px; font-size: 11.5px; color: #cbd5e1; line-height: 1.45;">
                  Your unique UUID is your permanent identity key required for forum registration and ranking. It is stored only in this browser until registered. Please copy and save it securely.
                </p>
                <button class="ere-btn ere-pulse-btn" id="ere-btn-confirm-uuid-saved" style="background: linear-gradient(135deg, #c9a227 0%, #eab308 100%); color: #0b0f19; font-weight: 700;">
                  ✓ I Have Saved My UUID
                </button>
              </div>
            ` : ''}

            <div class="ere-card">
              <div class="ere-card-header">
                <span>UUID</span>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <a class="ere-restore-link" id="ere-btn-start-restore" style="color: #94a3b8; font-size: 11px; text-decoration: underline; cursor: pointer;">Restore</a>
                  ${state.isUuidSaved ? `
                    <span class="ere-tag" style="color: #10b981; background: rgba(16, 185, 129, 0.15);">Saved</span>
                  ` : ''}
                </div>
              </div>
              <div class="ere-uuid-box">
                <span>${escapeHTML(state.uuid)}</span>
                <button class="ere-copy-btn" id="ere-btn-copy-uuid">Copy</button>
              </div>
            </div>
          `}

          <div class="ere-card">
            <div class="ere-card-header">
              <span>LIVE DOMAIN DATABASE</span>
              <button id="ere-btn-force-sync" style="padding: 2px 8px; font-size: 10px; font-weight: 600; border-radius: 4px; border: 1px solid rgba(255, 255, 255, 0.12); background: rgba(255, 255, 255, 0.06); color: #f8fafc; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; line-height: 1.4; text-transform: none;" ${state.syncButtonText ? 'disabled' : ''}>
                ${state.syncButtonText || '🔄 Sync Now'}
              </button>
            </div>
            <div class="ere-metric-row">
              <span class="ere-metric-label">Active Registry</span>
              <span class="ere-metric-val" id="ere-val-total-domains">${state.totalDomains ? `${state.totalDomains.toLocaleString()} Domains` : '—'}</span>
            </div>
            <div class="ere-metric-row">
              <span class="ere-metric-label">Last Synchronization</span>
              <span class="ere-metric-val" id="ere-val-last-sync">${formatDate(state.lastSyncTime)}</span>
            </div>
          </div>
        </div>

        <div class="ere-tab-panel ${state.activeTab === 4 ? 'is-active' : ''}" id="ere-panel-4">
          <div class="ere-card ere-privacy-top-card">
            <div style="display: flex; align-items: center; gap: 7px; min-width: 0;">
              <span class="ere-privacy-footer-dot" style="flex-shrink: 0;"></span>
              <span style="font-size: 11.5px; font-weight: 600; color: #94a3b8; white-space: nowrap;">Zero-Surveillance Architecture</span>
            </div>
            <a href="https://elon.report/extension-privacy" target="_blank" rel="noopener noreferrer" class="ere-privacy-policy-link" style="font-size: 11.5px; font-weight: 600; white-space: nowrap;">
              Extension Privacy Policy ↗
            </a>
          </div>

          <div class="ere-card">
            <div class="ere-card-header">
              <span>Domain Telemetry Log (60 Min)</span>
            </div>
            <p style="margin: 6px 0 12px; font-size: 11.5px; color: #94a3b8; line-height: 1.45;">
              Real-time display of root domains (no page paths) evaluated in the last 60 minutes. Only tracked root domains matching the 9 Pillars are sent to the server for merit scoring. Untracked domains, full URLs, and page paths exist only in the RAM of your machine.
            </p>
            <div class="ere-privacy-list" id="ere-privacy-list">
              ${renderPrivacyList()}
            </div>
          </div>
        </div>
      </div>
    `;

    modal.querySelector("#ere-btn-close")?.addEventListener("click", () => toggleModal(false));
    modal.querySelector("#ere-btn-pause")?.addEventListener("click", togglePause);

    modal.querySelector("#ere-btn-start-submit")?.addEventListener("click", () => {
      state.submittingDomain = currentHost;
      state.submittingCurrentCatId = 7;
      state.isSubmittingDomain = true;
      state.isReportMode = false;
      renderModal();
    });

    modal.querySelector("#ere-btn-report-current-domain")?.addEventListener("click", () => {
      state.submittingDomain = currentHost;
      state.submittingCurrentCatId = cat ? cat.id : 7;
      state.isSubmittingDomain = true;
      state.isReportMode = true;
      renderModal();
    });

    modal.querySelector("#ere-btn-cancel-submit")?.addEventListener("click", () => {
      state.isSubmittingDomain = false;
      state.isReportMode = false;
      state.submittingDomain = null;
      renderModal();
    });

    modal.querySelector("#ere-btn-submit-domain")?.addEventListener("click", async (e) => {
      const selectEl = modal.querySelector("#ere-select-category");
      const catId = selectEl ? parseInt(selectEl.value, 10) : 7;
      const targetDomain = state.submittingDomain || window.location.hostname;
      const isReport = !!state.isReportMode;
      e.target.textContent = "Submitting...";
      e.target.disabled = true;

      try {
        const res = await chrome.runtime.sendMessage({
          type: "SUBMIT_DOMAIN",
          domain: targetDomain,
          category_id: catId,
          is_report: isReport
        });

        state.isSubmittingDomain = false;
        state.isReportMode = false;
        state.submittingDomain = null;
        if (res && res.success) {
          state.submissionMessage = isReport ? "Report submitted for administrator approval." : "Domain submitted for administrator approval.";
        } else {
          state.submissionMessage = "Submission received for administrator approval.";
        }
        renderModal();
        setTimeout(() => {
          state.submissionMessage = null;
          if (state.isModalOpen) renderModal();
        }, 5000);
      } catch (err) {
        state.isSubmittingDomain = false;
        state.isReportMode = false;
        state.submittingDomain = null;
        renderModal();
      }
    });

    function attachPrivacySubmitListeners() {
      modal.querySelectorAll(".ere-privacy-submit-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const dom = btn.getAttribute("data-domain");
          state.activeTab = 1;
          state.submittingDomain = dom;
          state.submittingCurrentCatId = 7;
          state.isSubmittingDomain = true;
          state.isReportMode = false;
          renderModal();
        });
      });

      modal.querySelectorAll(".ere-privacy-report-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const dom = btn.getAttribute("data-domain");
          const catId = parseInt(btn.getAttribute("data-category-id") || "0", 10);
          state.activeTab = 1;
          state.submittingDomain = dom;
          state.submittingCurrentCatId = catId;
          state.isSubmittingDomain = true;
          state.isReportMode = true;
          renderModal();
        });
      });
    }

    attachPrivacySubmitListeners();

    modal.querySelectorAll(".ere-tab-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const tabId = parseInt(btn.getAttribute("data-tab") || btn.dataset.tab, 10);
        if (!tabId) return;

        if (tabId === 4) {
          refreshPrivacyTab();
        }

        if (tabId === state.activeTab) return;
        state.activeTab = tabId;
        chrome.storage.local.set({ activeTab: tabId });

        modal.querySelectorAll(".ere-tab-btn").forEach((b) => {
          const bId = parseInt(b.getAttribute("data-tab") || b.dataset.tab, 10);
          b.classList.toggle("is-active", bId === tabId);
        });

        modal.querySelectorAll(".ere-tab-panel").forEach((panel) => {
          const pId = parseInt(panel.id.replace("ere-panel-", ""), 10);
          panel.classList.toggle("is-active", pId === tabId);
        });

        positionModal();

        if (tabId === 2) {
          chrome.runtime.sendMessage({ type: "GET_STATS_LIVE" }).then((res) => {
            if (res && res.stats) {
              state.personalStats = res.stats;
              const p1 = modal.querySelector("#ere-stat-total-pages");
              const p2 = modal.querySelector("#ere-stat-merit-points");
              if (p1) p1.textContent = state.personalStats.totalPagesTracked || 0;
              if (p2) p2.textContent = `${state.personalStats.meritPoints || 0} pts`;
              const barGroup = modal.querySelector(".ere-bar-group");
              if (barGroup) {
                barGroup.innerHTML = renderPillarBars();
              }
            }
          }).catch(() => {});
        } else if (tabId === 1 && state.categoryId) {
          fetchTrendData(state.trendRange || "28d");
        }
      });
    });

    const sliderEl = modal.querySelector("#ere-slider-idle-opacity");
    sliderEl?.addEventListener("input", (e) => {
      const parsed = parseInt(e.target.value, 10);
      const val = isNaN(parsed) ? 100 : Math.max(0, Math.min(100, parsed));
      state.idleOpacity = val;
      const valText = modal.querySelector("#ere-val-idle-opacity");
      if (valText) valText.textContent = `${val}%`;
      hud.style.setProperty("--ere-idle-opacity", (val / 100).toString());
    });
    sliderEl?.addEventListener("change", (e) => {
      const parsed = parseInt(e.target.value, 10);
      const val = isNaN(parsed) ? 100 : Math.max(0, Math.min(100, parsed));
      chrome.runtime.sendMessage({ type: "SAVE_IDLE_OPACITY", opacity: val });
    });

    modal.querySelector("#ere-toggle-btt-dark")?.addEventListener("change", (e) => {
      const enabled = e.target.checked;
      state.bitcointalkDarkTheme = enabled;
      applyBitcointalkDarkTheme(enabled);
      chrome.runtime.sendMessage({ type: "SAVE_BTT_DARK_THEME", enabled });
    });

    modal.querySelectorAll(".ere-pill-display-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.getAttribute("data-mode");
        if (!mode) return;
        state.hudDisplayMode = mode;
        chrome.storage.local.set({ hudDisplayMode: mode });
        updateHUD();
        renderModal();
      });
    });

    modal.querySelectorAll(".ere-mode-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const mode = btn.getAttribute("data-mode");
        if (!mode || mode === state.trendMode) return;
        state.trendMode = mode;
        chrome.storage.local.set({ trendMode: mode });

        const titleEl = modal.querySelector("#ere-trend-card-title");
        if (titleEl) {
          titleEl.textContent = mode === "visits" ? "PAGE VISIT TREND" : "PAGE RANK TREND";
        }

        modal.querySelectorAll(".ere-mode-btn").forEach((b) => {
          b.classList.toggle("is-active", b.getAttribute("data-mode") === mode);
        });

        const pillsContainer = modal.querySelector("#ere-trend-pills-container");
        if (pillsContainer) {
          pillsContainer.innerHTML = renderTrendPillsHTML();
          attachPillListeners();
        }

        const graphContainer = modal.querySelector(".ere-graph-container");
        if (graphContainer) {
          graphContainer.innerHTML = renderTrendGraph();
        }

        updateTrendStats();
      });
    });

    attachPillListeners();
    updateTrendStats();

    modal.querySelector("#ere-btn-copy-uuid")?.addEventListener("click", (e) => {
      navigator.clipboard.writeText(state.uuid);
      e.target.textContent = "Copied!";
      setTimeout(() => { e.target.textContent = "Copy"; }, 1500);
    });

    modal.querySelector("#ere-btn-confirm-uuid-saved")?.addEventListener("click", async (e) => {
      e.target.textContent = "Saved & Verified!";
      e.target.disabled = true;
      try {
        await chrome.runtime.sendMessage({ type: "CONFIRM_UUID_SAVED" });
        state.isUuidSaved = true;
        setTimeout(() => { renderModal(); }, 600);
      } catch (err) {
        state.isUuidSaved = true;
        renderModal();
      }
    });

    modal.querySelector("#ere-btn-start-restore")?.addEventListener("click", () => {
      state.isRestoringUuid = true;
      renderModal();
    });

    modal.querySelector("#ere-btn-cancel-restore")?.addEventListener("click", () => {
      state.isRestoringUuid = false;
      renderModal();
    });

    modal.querySelector("#ere-form-restore-uuid")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const inputEl = modal.querySelector("#ere-input-restore-uuid");
      const val = (inputEl ? inputEl.value : "").trim();
      if (!val) return;

      if (!val.startsWith("ere_") || val.length < 15) {
        alert("Please enter a valid ERE UUID format (e.g. ere_...)");
        return;
      }

      const submitBtn = modal.querySelector("#ere-form-restore-uuid button[type='submit']");
      if (submitBtn) {
        submitBtn.textContent = "Restoring...";
        submitBtn.disabled = true;
      }

      try {
        const res = await chrome.runtime.sendMessage({
          type: "RESTORE_UUID",
          uuid: val
        });
        if (res && res.ok) {
          state.uuid = res.uuid;
          state.isUuidSaved = true;
          state.isRestoringUuid = false;
          if (res.stats) {
            state.personalStats = res.stats;
          }
          if (res.bitcointalkDarkTheme !== undefined) {
            state.bitcointalkDarkTheme = res.bitcointalkDarkTheme;
            applyBitcointalkDarkTheme(state.bitcointalkDarkTheme);
          }
          if (res.idleOpacity !== undefined) {
            state.idleOpacity = res.idleOpacity;
            hud.style.setProperty("--ere-idle-opacity", (state.idleOpacity / 100).toString());
          }
          if (res.hudPosition !== undefined) {
            state.hudPosition = res.hudPosition;
            applyPosition(state.hudPosition);
            if (state.isModalOpen) positionModal();
          }
          renderModal();
          updateHUD();
        }
      } catch (err) {
        state.uuid = val;
        state.isUuidSaved = true;
        state.isRestoringUuid = false;
        renderModal();
      }
    });

    modal.querySelector("#ere-btn-force-sync")?.addEventListener("click", (e) => {
      const btn = e.target.closest("#ere-btn-force-sync") || e.target;
      state.syncButtonText = '<span class="ere-spinner"></span> Connecting...';
      btn.disabled = true;
      btn.innerHTML = state.syncButtonText;
      chrome.runtime.sendMessage({ type: "FORCE_SYNC" });
    });

    modal.querySelector("#ere-btn-reset-hud")?.addEventListener("click", () => {
      applyPosition({ x: null, y: null });
      state.hudPosition = { x: null, y: null };
      state.idleOpacity = 100;
      state.hudDisplayMode = "total";
      chrome.storage.local.set({ hudDisplayMode: "total" });
      hud.style.setProperty("--ere-idle-opacity", "1");
      const valText = modal.querySelector("#ere-val-idle-opacity");
      if (valText) valText.textContent = "100%";
      const slider = modal.querySelector("#ere-slider-idle-opacity");
      if (slider) slider.value = 100;
      state.bitcointalkDarkTheme = false;
      applyBitcointalkDarkTheme(false);
      const bttToggle = modal.querySelector("#ere-toggle-btt-dark");
      if (bttToggle) bttToggle.checked = false;
      chrome.runtime.sendMessage({ type: "RESET_ERE" });
      updateHUD();
      renderModal();
    });

    positionModal();
  }

  function attachPillListeners() {
    modal.querySelectorAll(".ere-trend-pill").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const range = btn.getAttribute("data-range");
        if (!range) return;

        if (state.trendMode === "visits") {
          if (range === state.visitRange) return;
          state.visitRange = range;
          chrome.storage.local.set({ visitRange: range });
          modal.querySelectorAll(".ere-trend-pill").forEach((p) => {
            p.classList.toggle("is-active", p.getAttribute("data-range") === range);
          });
          if (range !== "24h" && (!state.trendData.points || state.trendData.points.length === 0 || range !== state.trendRange)) {
            fetchTrendData(range);
          } else {
            const graphContainer = modal.querySelector(".ere-graph-container");
            if (graphContainer) {
              graphContainer.innerHTML = renderTrendGraph();
            }
            updateTrendStats();
          }
        } else {
          if (range === state.trendRange) return;
          state.trendRange = range;
          chrome.storage.local.set({ trendRange: range });
          fetchTrendData(range);
        }
      });
    });
  }

  const HOURLY_FACTORS = [
    0.02, 0.015, 0.01, 0.01, 0.015, 0.025,
    0.04, 0.055, 0.07, 0.08, 0.085, 0.075,
    0.07, 0.065, 0.065, 0.07, 0.08, 0.085,
    0.075, 0.065, 0.05, 0.04, 0.03, 0.02
  ];

  function getHourlyVisitPoints(visitors24h) {
    const total = Math.max(1, visitors24h || 1);
    const peakFactor = total < 20 ? 0.25 : 0.12;
    const normalized = HOURLY_FACTORS.map((f) => (f / 0.085) * peakFactor);
    return normalized.map((factor, hour) => {
      const vph = Math.max(0, Math.round(total * factor));
      const hourStr = `${hour.toString().padStart(2, "0")}:00`;
      return { hour: hourStr, vph };
    });
  }

  function updateTrendStats() {
    const l1 = modal.querySelector("#ere-stat-label-1");
    const l2 = modal.querySelector("#ere-stat-label-2");
    const l3 = modal.querySelector("#ere-stat-label-3");
    const v1 = modal.querySelector("#ere-trend-stat-1");
    const v2 = modal.querySelector("#ere-trend-stat-2");
    const v3 = modal.querySelector("#ere-trend-stat-3");

    if (state.trendMode === "visits") {
      const visitors24h = state.ranking && state.ranking.unique_visitors_24h ? state.ranking.unique_visitors_24h : 1;
      const activeRange = state.visitRange || "24h";

      if (activeRange === "24h") {
        const hourlyPoints = getHourlyVisitPoints(visitors24h);
        const vPeak = Math.max(1, ...hourlyPoints.map((p) => p.vph));
        const vAvg = Math.max(1, Math.round(visitors24h / 24));

        if (l1) l1.textContent = "Peak / hr";
        if (v1) { v1.textContent = `${vPeak}/hr`; v1.style.color = "#38bdf8"; }

        if (l2) l2.textContent = "Avg / hr";
        if (v2) { v2.textContent = `${vAvg}/hr`; v2.style.color = "#f8fafc"; }

        if (l3) l3.textContent = "24h Unique Visitors";
        if (v3) { v3.textContent = `${visitors24h.toLocaleString()} unique`; v3.style.color = "#f8fafc"; }
      } else if (activeRange === "7d") {
        const points = (state.trendData.points || []).slice(-7);
        const visitorsArr = points.map(p => p.visitors || 1);
        const peakDaily = Math.max(...visitorsArr, visitors24h);
        const avgDaily = Math.round(visitorsArr.reduce((a, b) => a + b, 0) / Math.max(1, visitorsArr.length)) || visitors24h;
        const total7d = avgDaily * 7;

        if (l1) l1.textContent = "7D Peak / day";
        if (v1) { v1.textContent = `${peakDaily}/day`; v1.style.color = "#38bdf8"; }

        if (l2) l2.textContent = "7D Avg / day";
        if (v2) { v2.textContent = `${avgDaily}/day`; v2.style.color = "#f8fafc"; }

        if (l3) l3.textContent = "7D Unique Visitors";
        if (v3) { v3.textContent = `${total7d.toLocaleString()} unique`; v3.style.color = "#f8fafc"; }
      } else {
        const points = (state.trendData.points || []).slice(-28);
        const visitorsArr = points.map(p => p.visitors || 1);
        const peakDaily = Math.max(...visitorsArr, visitors24h);
        const avgDaily = Math.round(visitorsArr.reduce((a, b) => a + b, 0) / Math.max(1, visitorsArr.length)) || visitors24h;
        const total28d = avgDaily * 28;

        if (l1) l1.textContent = "28D Peak / day";
        if (v1) { v1.textContent = `${peakDaily}/day`; v1.style.color = "#38bdf8"; }

        if (l2) l2.textContent = "28D Avg / day";
        if (v2) { v2.textContent = `${avgDaily}/day`; v2.style.color = "#f8fafc"; }

        if (l3) l3.textContent = "28D Unique Visitors";
        if (v3) { v3.textContent = `${total28d.toLocaleString()} unique`; v3.style.color = "#f8fafc"; }
      }
    } else {
      if (l1) l1.textContent = "Period Peak";
      if (v1) { v1.textContent = `#${state.trendData.peak || state.ranking.rank || 1}`; v1.style.color = "#facc15"; }

      if (l2) l2.textContent = "Period Low";
      if (v2) { v2.textContent = `#${state.trendData.low || state.ranking.rank || 1}`; v2.style.color = "#f8fafc"; }

      if (l3) l3.textContent = "Period Delta";
      if (v3) {
        v3.textContent = state.trendData.deltaStr || "0 (Stable)";
        v3.style.color = state.trendData.delta > 0 ? "#10b981" : (state.trendData.delta < 0 ? "#ef4444" : "#94a3b8");
      }
    }
  }

  function renderTrendGraph() {
    const w = 286;
    const h = 80;
    const padding = { top: 10, bottom: 22, left: 28, right: 10 };

    if (state.trendMode === "visits") {
      const visitors24h = state.ranking && state.ranking.unique_visitors_24h ? state.ranking.unique_visitors_24h : 1;
      const activeRange = state.visitRange || "24h";

      if (activeRange === "24h") {
        const hourlyPoints = getHourlyVisitPoints(visitors24h);
        const values = hourlyPoints.map((p) => p.vph);
        const minV = 0;
        const maxV = Math.max(...values, 2);

        const innerW = w - padding.left - padding.right;
        const innerH = h - padding.top - padding.bottom;

        const coords = hourlyPoints.map((p, i) => {
          const x = padding.left + (i / (hourlyPoints.length - 1)) * innerW;
          const y = h - padding.bottom - ((p.vph - minV) / (maxV - minV || 1)) * innerH;
          return { x, y, vph: p.vph, hour: p.hour };
        });

        const linePath = coords.map((c, i) => (i === 0 ? `M ${c.x} ${c.y}` : `L ${c.x} ${c.y}`)).join(" ");
        const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${h - padding.bottom} L ${coords[0].x} ${h - padding.bottom} Z`;

        const dots = coords.filter((c, i) => i % 3 === 0).map((c) => `
          <circle cx="${c.x}" cy="${c.y}" r="2.5" fill="#38bdf8" stroke="#0b0f19" stroke-width="1.5" />
        `).join("");

        const timeLabels = [
          { text: "-24h", x: padding.left, anchor: "start" },
          { text: "-21h", x: padding.left + innerW * (1 / 8), anchor: "middle" },
          { text: "-18h", x: padding.left + innerW * (2 / 8), anchor: "middle" },
          { text: "-15h", x: padding.left + innerW * (3 / 8), anchor: "middle" },
          { text: "-12h", x: padding.left + innerW * (4 / 8), anchor: "middle" },
          { text: "-9h",  x: padding.left + innerW * (5 / 8), anchor: "middle" },
          { text: "-6h",  x: padding.left + innerW * (6 / 8), anchor: "middle" },
          { text: "-3h",  x: padding.left + innerW * (7 / 8), anchor: "middle" },
          { text: "Now",  x: w - padding.right, anchor: "end" }
        ].map((l) => `<text x="${l.x}" y="${h - 5}" fill="#64748b" font-size="7" text-anchor="${l.anchor}">${l.text}</text>`).join("");

        return `
          <svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" style="overflow: visible; display: block;">
            <defs>
              <linearGradient id="ere-visit-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.35" />
                <stop offset="100%" stop-color="#0284c7" stop-opacity="0.0" />
              </linearGradient>
            </defs>

            <line x1="${padding.left}" y1="${padding.top}" x2="${w - padding.right}" y2="${padding.top}" stroke="rgba(255,255,255,0.07)" stroke-dasharray="2,2" />
            <line x1="${padding.left}" y1="${h - padding.bottom}" x2="${w - padding.right}" y2="${h - padding.bottom}" stroke="rgba(255,255,255,0.07)" />

            <text x="${padding.left - 4}" y="${padding.top + 3}" fill="#94a3b8" font-size="8.5" text-anchor="end" font-family="monospace">${maxV}/h</text>
            <text x="${padding.left - 4}" y="${h - padding.bottom}" fill="#94a3b8" font-size="8.5" text-anchor="end" font-family="monospace">0</text>

            <path d="${areaPath}" fill="url(#ere-visit-grad)" />
            <path d="${linePath}" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />

            ${dots}
            ${timeLabels}
          </svg>
        `;
      }

      const numDays = activeRange === "7d" ? 7 : 28;
      const rawPoints = state.trendData.points || [];
      const points = rawPoints.length > 0 ? rawPoints.slice(-numDays) : [];

      if (points.length === 0) {
        return `
          <div style="height: 75px; display: flex; align-items: center; justify-content: center; font-size: 11.5px; color: #64748b;">
            Collecting traffic history...
          </div>
        `;
      }

      const dailyValues = points.map((p) => p.visitors || 1);
      const minV = 0;
      const maxV = Math.max(...dailyValues, visitors24h, 2);

      const innerW = w - padding.left - padding.right;
      const innerH = h - padding.top - padding.bottom;

      const coords = points.map((p, i) => {
        const val = p.visitors || 1;
        const x = padding.left + (i / Math.max(1, points.length - 1)) * innerW;
        const y = h - padding.bottom - ((val - minV) / (maxV - minV || 1)) * innerH;
        return { x, y, val, date: p.date };
      });

      const linePath = coords.map((c, i) => (i === 0 ? `M ${c.x} ${c.y}` : `L ${c.x} ${c.y}`)).join(" ");
      const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${h - padding.bottom} L ${coords[0].x} ${h - padding.bottom} Z`;

      const step = activeRange === "7d" ? 1 : Math.ceil(coords.length / 5);
      const targetCoords = coords.filter((c, i) => i === 0 || i === coords.length - 1 || i % step === 0);

      const dots = targetCoords.map((c) => `
        <circle cx="${c.x}" cy="${c.y}" r="2.5" fill="#38bdf8" stroke="#0b0f19" stroke-width="1.5" />
      `).join("");

      const dateLabels = targetCoords.map((c, i) => {
        const parts = (c.date || "").trim().split(/\s+/);
        const m = parts[0] || "";
        const d = parts[1] || "";
        const anchor = i === 0 ? "start" : (i === targetCoords.length - 1 ? "end" : "middle");
        return `
          <text x="${c.x}" y="${h - 11}" fill="#64748b" font-size="7" text-anchor="${anchor}">${escapeHTML(m)}</text>
          <text x="${c.x}" y="${h - 2}" fill="#94a3b8" font-size="7.5" text-anchor="${anchor}">${escapeHTML(d)}</text>
        `;
      }).join("");

      return `
        <svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" style="overflow: visible; display: block;">
          <defs>
            <linearGradient id="ere-visit-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.35" />
              <stop offset="100%" stop-color="#0284c7" stop-opacity="0.0" />
            </linearGradient>
          </defs>

          <line x1="${padding.left}" y1="${padding.top}" x2="${w - padding.right}" y2="${padding.top}" stroke="rgba(255,255,255,0.07)" stroke-dasharray="2,2" />
          <line x1="${padding.left}" y1="${h - padding.bottom}" x2="${w - padding.right}" y2="${h - padding.bottom}" stroke="rgba(255,255,255,0.07)" />

          <text x="${padding.left - 4}" y="${padding.top + 3}" fill="#94a3b8" font-size="8.5" text-anchor="end" font-family="monospace">${maxV}/d</text>
          <text x="${padding.left - 4}" y="${h - padding.bottom}" fill="#94a3b8" font-size="8.5" text-anchor="end" font-family="monospace">0</text>

          <path d="${areaPath}" fill="url(#ere-visit-grad)" />
          <path d="${linePath}" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />

          ${dots}
          ${dateLabels}
        </svg>
      `;
    }

    const points = state.trendData.points || [];
    if (!points || points.length === 0) {
      return `
        <div style="height: 75px; display: flex; align-items: center; justify-content: center; font-size: 11.5px; color: #64748b;">
          Collecting rank snapshots...
        </div>
      `;
    }

    const ranks = points.map((p) => p.rank);
    const minRank = Math.min(...ranks);
    const maxRank = Math.max(...ranks, minRank + 1);

    const innerW = w - padding.left - padding.right;
    const innerH = h - padding.top - padding.bottom;

    const coords = points.map((p, i) => {
      const x = padding.left + (i / Math.max(1, points.length - 1)) * innerW;
      const rankRange = maxRank - minRank || 1;
      const y = padding.top + ((p.rank - minRank) / rankRange) * innerH;
      return { x, y, rank: p.rank, date: p.date, visitors: p.visitors };
    });

    const linePath = coords.map((c, i) => (i === 0 ? `M ${c.x} ${c.y}` : `L ${c.x} ${c.y}`)).join(" ");
    const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${h - padding.bottom} L ${coords[0].x} ${h - padding.bottom} Z`;

    const activeRange = state.trendRange || "28d";
    const step = activeRange === "7d" ? 1 : Math.ceil(coords.length / 5);
    const targetCoords = coords.filter((c, i) => i === 0 || i === coords.length - 1 || i % step === 0);

    const dots = targetCoords.map((c) => `
      <circle cx="${c.x}" cy="${c.y}" r="2.5" fill="#facc15" stroke="#0b0f19" stroke-width="1.5" />
    `).join("");

    const dateLabels = targetCoords.map((c, i) => {
      const parts = (c.date || "").trim().split(/\s+/);
      const m = parts[0] || "";
      const d = parts[1] || "";
      const anchor = i === 0 ? "start" : (i === targetCoords.length - 1 ? "end" : "middle");
      return `
        <text x="${c.x}" y="${h - 11}" fill="#64748b" font-size="7" text-anchor="${anchor}">${escapeHTML(m)}</text>
        <text x="${c.x}" y="${h - 2}" fill="#94a3b8" font-size="7.5" text-anchor="${anchor}">${escapeHTML(d)}</text>
      `;
    }).join("");

    return `
      <svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" style="overflow: visible; display: block;">
        <defs>
          <linearGradient id="ere-trend-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#facc15" stop-opacity="0.3" />
            <stop offset="100%" stop-color="#c9a227" stop-opacity="0.0" />
          </linearGradient>
        </defs>

        <line x1="${padding.left}" y1="${padding.top}" x2="${w - padding.right}" y2="${padding.top}" stroke="rgba(255,255,255,0.07)" stroke-dasharray="2,2" />
        <line x1="${padding.left}" y1="${h - padding.bottom}" x2="${w - padding.right}" y2="${h - padding.bottom}" stroke="rgba(255,255,255,0.07)" />

        <text x="${padding.left - 4}" y="${padding.top + 3}" fill="#94a3b8" font-size="8.5" text-anchor="end" font-family="monospace">#${minRank}</text>
        <text x="${padding.left - 4}" y="${h - padding.bottom}" fill="#94a3b8" font-size="8.5" text-anchor="end" font-family="monospace">#${maxRank}</text>

        <path d="${areaPath}" fill="url(#ere-trend-grad)" />
        <path d="${linePath}" fill="none" stroke="#facc15" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />

        ${dots}
        ${dateLabels}
      </svg>
    `;
  }

  function renderPillarBars() {
    const counts = state.personalStats.pillarCounts || {};
    const thresholds = state.levelThresholds || { level_2: 10, level_3: 100, level_4: 1000 };
    const lvl2 = parseInt(thresholds.level_2) || 10;
    const lvl3 = parseInt(thresholds.level_3) || 100;
    const lvl4 = parseInt(thresholds.level_4) || 1000;

    return Object.keys(state.categories).map((id) => {
      const cat = state.categories[id];
      const pts = counts[id] || 0;
      const isOptional = parseInt(id, 10) === 5 || cat?.optional;

      let level = 1;
      let target = lvl2;
      let pct = 0;

      if (pts < lvl2) {
        level = 1;
        target = lvl2;
        pct = Math.min(100, Math.round((pts / lvl2) * 100));
      } else if (pts < lvl3) {
        level = 2;
        target = lvl3;
        pct = Math.min(100, Math.round((pts / lvl3) * 100));
      } else if (pts < lvl4) {
        level = 3;
        target = lvl4;
        pct = Math.min(100, Math.round((pts / lvl4) * 100));
      } else {
        level = 4;
        target = lvl4;
        pct = 100;
      }

      return `
        <div class="ere-bar-item">
          <div class="ere-bar-header">
            <span>P${id}: ${escapeHTML(cat.short)} ${isOptional ? '<em style="font-size: 9px; color: #c084fc; font-style: normal; font-weight: 700;">(Optional)</em>' : `(level ${level})`}</span>
            <span style="font-weight: 700; color: ${isOptional ? '#c084fc' : '#facc15'};">${pts}/${target} (${pct}%)</span>
          </div>
          <div class="ere-bar-track">
            <div class="ere-bar-fill" style="width: ${pct}%; ${isOptional ? 'background: linear-gradient(90deg, #9333ea 0%, #c084fc 100%);' : ''}"></div>
          </div>
        </div>
      `;
    }).join("");
  }

  function escapeHTML(str) {
    return (str || "").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[m]);
  }

  function formatDate(ts) {
    if (!ts) return "—";
    const d = new Date(ts);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "PAUSE_STATE_CHANGED") {
      state.isPaused = msg.isPaused;
      updateHUD();
      renderModal();
    } else if (msg.type === "IDLE_OPACITY_CHANGED") {
      state.idleOpacity = msg.opacity !== undefined ? msg.opacity : 100;
      hud.style.setProperty("--ere-idle-opacity", (state.idleOpacity / 100).toString());
      const valText = modal.querySelector("#ere-val-idle-opacity");
      if (valText) valText.textContent = `${state.idleOpacity}%`;
      const slider = modal.querySelector("#ere-slider-idle-opacity");
      if (slider) slider.value = state.idleOpacity;
    } else if (msg.type === "BTT_DARK_THEME_CHANGED") {
      state.bitcointalkDarkTheme = msg.enabled;
      applyBitcointalkDarkTheme(msg.enabled);
      const toggle = modal.querySelector("#ere-toggle-btt-dark");
      if (toggle) toggle.checked = msg.enabled;
    } else if (msg.type === "HUD_POS_CHANGED" || msg.type === "RESET_HUD_POSITION") {
      state.hudPosition = { x: msg.x !== undefined ? msg.x : null, y: msg.y !== undefined ? msg.y : null };
      try {
        if (state.hudPosition.x === null && state.hudPosition.y === null) {
          localStorage.removeItem("ere_hud_pos");
        } else {
          localStorage.setItem("ere_hud_pos", JSON.stringify(state.hudPosition));
        }
      } catch (e) {}
      applyPosition(state.hudPosition);
      if (state.isModalOpen) positionModal();
    } else if (msg.type === "DOMAIN_COUNT_PREVIEW") {
      state.totalDomains = msg.totalDomains || state.totalDomains;
      const countEl = modal.querySelector("#ere-val-total-domains");
      if (countEl) {
        countEl.textContent = state.totalDomains ? `${state.totalDomains.toLocaleString()} Domains` : "—";
      }
    } else if (msg.type === "SYNC_PROGRESS") {
      state.syncButtonText = `<span class="ere-spinner"></span> ${escapeHTML(msg.text || "Syncing...")}`;
      const btn = modal.querySelector("#ere-btn-force-sync");
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = state.syncButtonText;
      }
    } else if (msg.type === "SYNC_FAILED") {
      state.syncButtonText = "⚠️ Sync Interrupted — Retry";
      const btn = modal.querySelector("#ere-btn-force-sync");
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = state.syncButtonText;
        setTimeout(() => {
          state.syncButtonText = null;
          const b = modal.querySelector("#ere-btn-force-sync");
          if (b) {
            b.disabled = false;
            b.innerHTML = "🔄 Force Sync Now";
          }
        }, 4000);
      }
    } else if (msg.type === "DOMAINS_SYNC_COMPLETED") {
      state.totalDomains = msg.totalDomains || state.totalDomains;
      state.lastSyncTime = msg.lastSync || state.lastSyncTime;
      const syncEl = modal.querySelector("#ere-val-last-sync");
      if (syncEl) {
        syncEl.textContent = formatDate(state.lastSyncTime);
      }
      const countEl = modal.querySelector("#ere-val-total-domains");
      if (countEl) {
        countEl.textContent = state.totalDomains ? `${state.totalDomains.toLocaleString()} Domains` : "—";
      }
      const changeCount = (msg.newCount || 0) + (msg.removedCount || 0);
      state.syncButtonText = changeCount > 0 ? `✅ [${changeCount}] Sync Complete!` : "✅ Sync Complete!";
      const btn = modal.querySelector("#ere-btn-force-sync");
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = state.syncButtonText;
      }
      setTimeout(() => {
        state.syncButtonText = null;
        const b = modal.querySelector("#ere-btn-force-sync");
        if (b) {
          b.disabled = false;
          b.innerHTML = "🔄 Sync Now";
        }
      }, 2500);

      updateHUD();
    } else if (msg.type === "HUD_DISPLAY_MODE_CHANGED") {
      state.hudDisplayMode = msg.mode;
      updateHUD();
      if (state.isModalOpen && state.activeTab === 3) renderModal();
    } else if (msg.type === "GLOBAL_STATS_UPDATED") {
      if (msg.totalVisitors !== undefined) {
        setGlobalVisits(msg.totalVisitors);
      }
    }
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local") {
      if (changes.hudPosition && changes.hudPosition.newValue !== undefined) {
        state.hudPosition = changes.hudPosition.newValue;
        if (!isDragging) {
          applyPosition(state.hudPosition);
        }
      }
      if (changes.hudDisplayMode && changes.hudDisplayMode.newValue !== undefined) {
        state.hudDisplayMode = changes.hudDisplayMode.newValue;
        updateHUD();
        if (state.isModalOpen && state.activeTab === 3) renderModal();
      }
      if (changes.totalTrackedVisitors && changes.totalTrackedVisitors.newValue !== undefined) {
        setGlobalVisits(changes.totalTrackedVisitors.newValue);
      }
    }
  });

  setInterval(() => {
    if (state.isModalOpen && state.activeTab === 4) {
      refreshPrivacyTab();
    }
  }, 5000);

  window.addEventListener("resize", () => {
    applyPosition(state.hudPosition);
    if (state.isModalOpen) {
      positionModal();
    }
  });

  init();
})();

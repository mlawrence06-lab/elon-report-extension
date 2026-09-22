# Privacy Policy & Data Architecture — The Elon Report Extension (ERE)

**Last Updated:** September 5, 2026  
**Version:** 1.1.68  
**Applies to:** The Elon Report Extension (ERE) for Chromium / Chrome  

---

## 1. Core Philosophy: Zero-Surveillance Architecture

The Elon Report Extension (ERE) is designed for a target audience that prioritizes digital sovereignty, privacy, and cryptographic principles (including the Bitcointalk and cryptocurrency communities).

Most browser extensions that monitor web activity operate as surveillance tools—logging full URLs, recording history, tracking IP addresses, and selling telemetry. **ERE is engineered with the exact opposite philosophy: a local-first, privacy-preserving protocol where 99.9% of the web is completely invisible to our servers.**

---

## 2. The 99.9% Rule: Local-First Evaluation

When you browse the internet with ERE installed, **your browsing history is NOT sent to our servers.**

1. **Offline Registry**: ERE ships with an offline, local registry of domains matching the 9 Elon Report Pillars (Autonomous Vehicles, Robotics, AI, Space, Politics, Energy, TSLA/Equities, Crypto/Mining, and Digital Town Square).
2. **Local Evaluation**: Every URL you visit is evaluated **entirely on your local machine** inside the extension’s sandboxed service worker.
3. **Untracked Domains (The 99.9%)**:
   - If a domain does **not** match one of the 9 Pillars (e.g., your bank, your email, news portals, personal search queries, private messaging, personal work), **NO network request is sent to our servers.**
   - The domain is retained strictly in volatile browser RAM for 60 minutes solely so you can inspect it in **Tab 4 (Domain Telemetry Log)** to verify that it was evaluated locally and discarded.
   - It is never written to disk, never cached in persistent storage, and never transmitted over the internet.

---

## 3. What ERE Transmits (Tracked Pillar Domains Only)

If and **only if** you visit a domain that matches one of the 9 curated Pillars (e.g., `bitcointalk.org`, `tesla.com`, `spacex.com`, `x.com`), ERE transmits a minimal telemetry payload stripped down strictly to root domain identifiers:

> 🔒 **WE DO NOT TRANSMIT PAGE URLS.**  
> The browser address is stripped down to the root domain / base URL client-side before any network request is created. Full page paths, thread titles, post IDs, search queries, and parameter strings are **NEVER transmitted, NEVER received, and NEVER processed by our servers.**

| Data Point | What Is Sent | Purpose |
| :--- | :--- | :--- |
| **Client UUID** | Pseudonymous string (e.g. `ere_a1b2...`) | Credits merit points to your installation |
| **Root Domain / Base URL** | Clean host only (e.g. `bitcointalk.org` — or `reddit.com/r/Bitcoin` for subreddits) | Calculates 24h aggregate category rankings |
| **Pillar ID** | Integer (`1` to `9`) | Categorizes visit under the relevant Pillar (Pillar 5 Politics is optional) |

### Merit Gating
Merit scoring is strictly capped at **1 point per domain per 24-hour period**. Repeated page views on the same domain increment total visit statistics for global analytics, but cannot be exploited to artificially inflate merit scores.

---

## 4. What ERE NEVER Collects or Stores

We have deliberately engineered the client and backend to make user surveillance technically impossible:

- **NO Page Paths, Thread Titles, or Query Strings**: URLs are stripped down to the root domain before leaving your machine (e.g. `https://bitcointalk.org`). We never see, transmit, or store specific forum threads, article titles, search queries, or internal page paths. For community platforms with path-scoped communities (e.g. Reddit), only the top-level subreddit is retained (e.g. `reddit.com/r/Bitcoin`), while all individual post paths, comments, and query parameters are permanently stripped.
- **NO IP Address Logging**: The backend telemetry database (`wp_ere_visits` and `wp_ere_clients`) does not contain an IP address column. Telemetry visits are not linked to your IP address.
- **NO Personal Identifiable Information (PII)**: We do not collect names, email addresses, phone numbers, physical locations, or system hardware serials.
- **NO Cookies or Session Credentials**: ERE never reads, captures, or transmits cookies, auth tokens, passwords, session headers, or autofill data.
- **NO Keystroke or Form Logging**: ERE has zero access to form inputs, payment data, or typed content.
- **NO Browser Fingerprinting**: We do not construct canvas hashes, audio fingerprints, WebGL signatures, or battery status probes.
- **NO Third-Party Trackers**: There are **zero** third-party analytics libraries, trackers, or SDKs in ERE. No Google Analytics, no Facebook Pixels, no Mixpanel, no Datadog, no advertising networks.
- **Exception for Bitcointalk Dark Theme**: ERE includes an optional custom Dark Theme engineered exclusively for `bitcointalk.org` (it operates nowhere else and cannot be applied to any other website). When enabled, local CSS stylesheet rules are injected into the page DOM to improve readability. **Nothing else is sent or collected**—forum posts, user inputs, and page contents remain completely untouched; only the client-side CSS visual presentation is adjusted on that website.

---

## 5. Pseudonymous Client UUIDs

- **Client-Generated**: When ERE is installed, it generates a random, cryptographically strong UUID (Version 4 format) locally inside `chrome.storage.local`.
- **User-Owned & Exportable**: You can view your UUID at any time in the header of the ERE HUD modal. You can copy it, back it up, or import it into another browser to restore your merit points.
- **Zero Account Requirement**: Your UUID operates as an independent cryptographic identifier requiring zero registration, account creation, or personal identity.

---

## 6. Local Storage (`chrome.storage.local`)

All preferences and states stay on your local disk inside Chrome's sandboxed extension storage:

- **`ere_uuid`**: Your random client identifier.
- **`isPaused`**: Telemetry pause state (boolean).
- **`hudPosition`**: Screen coordinates `{ x, y }` for the floating HUD pill.
- **`idleOpacity`**: HUD transparency percentage when not hovered.
- **`bitcointalkDarkTheme`**: Dark theme preference for Bitcointalk.org (`on` or `off`).
- **`hudDisplayMode`**: Pill display toggle (`total`, `unique`, or `rank`).
- **`personalStats`**: Local cache of your merit points, pillar breakdown, and total visits.
- **`recentRankings`**: Cached category rankings for fast display without network lag.
- **`ere_domain_db` (IndexedDB)**: Local cached dictionary of 1.3M+ domain classifications for offline evaluation.

---

## 7. Network Communications

The extension communicates exclusively with our primary domain over secure HTTPS (`TLS 1.3`):

1. `POST https://elon.report/wp-json/ere/v1/track` — Dispatches telemetry when a tracked Pillar domain is visited.
2. `GET https://elon.report/wp-json/ere/v1/domains` — Daily synchronization of the 1.3M+ domain categorization index (cached with HTTP 304 headers).
3. `GET https://elon.report/wp-json/ere/v1/global-stats` — Fetches aggregate platform-wide total visits.
4. `POST https://elon.report/wp-json/ere/v1/submit-domain` — Sent only when you voluntarily submit an unlisted domain for review.

---

## 8. Full User Sovereignty & Controls

### ⏸ One-Click Kill Switch (Pause Tracking)
You can instantly pause all extension activity at any time:
- Click the **Pause** button inside the HUD modal, or
- Right-click the extension icon in Chrome’s toolbar and select **Pause / Resume Tracking**.
- When paused, the HUD shows `⏸`, and **zero telemetry is recorded or sent anywhere**.

### 🔍 Real-Time Audit Log (Tab 4: Privacy)
ERE provides a live, rolling 60-minute telemetry log in the HUD:
- Every evaluated domain appears with its relative timestamp.
- You can inspect exactly which sites were classified under a Pillar and which sites were discarded locally as Untracked.
- **Top-of-List Consolidation**: Repeated refreshes or consecutive page visits on the same domain simply update the timestamp of the top record, rather than cluttering your log.

### 🗑 Complete Data Wiping
- Right-click the extension icon in the toolbar and select **Reset ERE (Position & Transparency)** to restore UI defaults.
- Removing ERE from Chrome instantly wipes all `chrome.storage.local` data from your machine.

---

## 9. Open-Source Verifiability

We believe privacy cannot be trusted without verification. ERE is open-source:
- Every line of client code (`content.js`, `background.js`, `theme_boot.js`) is unminified and readable directly in your Chrome extension directory or on GitHub.
- You can open Chrome DevTools on the background service worker (`chrome://extensions` → **Inspect views: service worker**) and inspect the **Network** tab at any time to confirm that no unexpected network calls are ever made.

---

## 10. Contact & Community Verification

We welcome public security audits, domain classification suggestions, and code review:
- **Official Website**: [https://elon.report](https://elon.report)
- **Community Forum**: The Elon Report Forum (Coming Soon)
- **Bitcointalk Community**: The official Elon Report thread on Bitcointalk.org (Coming Soon)

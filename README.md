# Elon Report Extension

> **Merit-gated context tracking, real-time website popularity intelligence, and verified human exploration across the 8 Strategic Pillars.**

The official Chrome Extension (Manifest V3) for [ERE](https://elon.report). [ERE](https://elon.report) bridges authentic web exploration with sovereign forum discourse, proving domain familiarity, eliminating bot swarms, and tracking real-time popularity across 1.3M+ technological destinations.

---

## Key Capabilities

### 1. Human Activity Verification & Merit Gating
Traditional forums suffer from automated spam, Sybil attacks, and low-effort commentary. [ERE](https://elon.report) runs discreetly in the background, privately evaluating when you explore genuine technological destinations.
- **Bot-Proof Discourse**: Merit is earned solely through genuine, curious human engagement.
- **Informed Context**: Forum contributions carry authenticated domain depth and topic familiarity.
- **Zero Surveillance**: 99.9% of web browsing never leaves your browser. Zero tracking of banking, personal email, social feeds, search queries, or internal URLs.

### 2. Real-Time Website Popularity
Discover emerging tools, whitepapers, repositories, and platforms gaining organic traction among peers:
- **1.3M+ Partitioned Local Domain Index**: Instant offline category matching and tie-breaker sorting without latency.
- **Draggable Floating HUD**: Displays live category ranks directly on screen (e.g. `#1 in Frontier Compute`, `#4 in Autonomous Vehicles`).
- **24-Hour Unique Momentum**: Measures aggregate peer visits across curated technology categories.

### 3. The 8 Strategic Knowledge Pillars
Comprehensive coverage across all technological frontiers Elon Musk works on:
1. **P1: AV & Transit** — Autonomous Vehicles, Tesla FSD, Cybercab, The Boring Company tunnels, and transit networks.
2. **P2: Neuro & Robotics** — Neuralink brain-computer interfaces, Tesla Optimus humanoid robotics, and biomechatronics.
3. **P3: AI & Compute** — xAI, Grok frontier models, the Memphis Colossus cluster, and distributed compute.
4. **P4: Space & Orbital** — SpaceX Starship, Falcon 9 cadence, Starlink direct-to-cell, and Mars colonization.
5. **P5: Energy & Grid** — Tesla Megapack grid scaling, Powerwall 3, Solar Roof, and 4680 battery architecture.
6. **P6: Investments & TSLA** — Equity fundamentals, long-term valuation models, options volume, and SEC filings.
7. **P7: Crypto & Mining** — Bitcoin monetary layer, Proof-of-Work energy dynamics, and digital asset liquidity.
8. **P8: Media & X** — X.com, open-source recommendation algorithms, and Community Notes fact-checking.

### 4. Future Implementation: Martian RTS MMO & Attack Alerts
Beyond forum governance, [ERE](https://elon.report) is expanding into a persistent multiplayer real-time strategy (RTS) game about building civilization on Mars:
- **Colony Construction**: Extract subsurface glacial ice, establish solar/nuclear microgrids, synthesize Sabatier methane propellant, and expand Starship landing pads.
- **Persistent Multiplayer Warfare**: Form alliances, trade resources, and defend critical outposts against rival corporate factions.
- **ERE Browser Icon Attack Alerts**: Real-time incoming raid and attack notifications delivered directly to the [ERE](https://elon.report) browser extension icon badge with pulsing visual alerts and tactical countdown timers.

### 5. Bitcointalk Dark Theme
- Injects a high-contrast, obsidian and gold dark theme on `bitcointalk.org` at `document_start` to eliminate Flash of Unstyled Content (FOUC).
- Configurable directly from the [ERE](https://elon.report) HUD settings modal.

---

## Installation (Developer Mode)

1. Clone this repository:
   ```bash
   git clone https://github.com/mlawrence06-lab/elon-report-extension.git
   ```
2. Open Google Chrome and navigate to:
   ```
   chrome://extensions/
   ```
3. Enable **Developer mode** in the top right corner.
4. Click **Load unpacked** in the top left corner.
5. Select the repository folder (the folder containing `manifest.json`).
6. The extension will appear with the [ERE](https://elon.report) icon and start running immediately.

---

## Architecture & File Structure

```
├── manifest.json       # Manifest V3 configuration, permissions, and declarative rules
├── background.js       # Background service worker (ES module) — storage, alarms, API sync
├── content.js          # Content script — Shadow DOM HUD, settings modal, and merit tracking
├── theme_boot.js       # Fast-boot theme injector for bitcointalk.org (runs document_start)
├── styles.css          # Isolated Shadow DOM styling for HUD and controls
├── icons/              # Extension icon assets (16px, 32px, 48px, 128px)
├── data/
│   ├── meta.json       # Catalog metadata, domain counts, and level thresholds
│   └── domains/        # Partitioned 2-char local JSON dictionary (1.3M+ domains)
├── PRIVACY.md          # Comprehensive cryptographic and zero-knowledge privacy policy
└── README.md           # Documentation
```

---

## Privacy Architecture

Read the full [ERE Privacy Policy](https://elon.report/extension-privacy) or inspect [PRIVACY.md](./PRIVACY.md).
- **Local Evaluation**: All domain classification happens locally via partitioned dictionary lookups.
- **No Query Logging**: URLs are stripped to the base root domain before any telemetry is transmitted.
- **Zero Cookies**: [ERE](https://elon.report) never reads, captures, or transmits session cookies or credentials.
- **No Account Required**: Generates a local, pseudonymous client UUID stored exclusively on your device.

---

## Links

- **Website**: [ERE](https://elon.report)
- **Privacy Architecture**: [ERE Privacy Policy](https://elon.report/extension-privacy)

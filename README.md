# NEXORA ARENA - Full-Stack Esports Tournament Platform

NEXORA ARENA is an original browser-based esports tournament platform designed with zero client trust. Players can register, create teams, enter single-elimination and round-robin tournaments, compete anonymously in the original game **Reaction Grid Duel**, and receive verified match outcomes guarded by server-authoritative logic, anti-cheat telemetry, and explainable AI.

---

## Key Highlights

1. **Original Browser Title ("Reaction Grid Duel")**:
   - 5 rounds of sensory reaction duels across a 4x4 coordinate grid.
   - Synchronized server seed guarantees identical target timing and coordinates for both competitors.
   - Client sends only raw action telemetry (round ID, target ID, clicked grid coordinates, millisecond timestamps).
   - Server strictly validates order, coordinates, and reaction intervals. Scores are awarded exclusively by the server.

2. **Zero-Trust Anti-Cheat & FairPlayAnalyzer (Gemini 3.8 Flash)**:
   - **Sub-110ms Human Reflex Detection**: Any reaction faster than physiological visual-motor latency (110ms) is immediately trapped as anomalous.
   - **Robotic Interval Detection**: Low standard deviation in click intervals flags macro scripts.
   - **Browser Tab Focus Loss**: Monitored via non-invasive client telemetry without webcams or rootkits.
   - **Explainable AI Classification**: Categorizes telemetry into `NORMAL`, `REVIEW_REQUIRED`, or `HIGH_RISK`.
   - **Strict Human In The Loop**: AI never automatically bans players; human moderators make all final decisions.

3. **Anonymous Competitor Shield**:
   - In live match lobbies and active scoreboards, opponents never see real names, emails, or personal details.
   - Competitors are identified exclusively by deterministic anonymous handles (e.g. `Player-4821`, `Echo-710`).

4. **Bilingual Support (Tamil & English)**:
   - Full toggle support between English and தமிழ் across all 20 pages, rulebooks, and tournament notices.

5. **20 Core Application Pages**:
   - Landing, Auth, Player Dashboard, Tournament Discovery, Tournament Details, Tournament Registration, Teams, Match Schedule, Anonymous Pre-Match Lobby, Live Game (Reaction Grid Duel), Results, Leaderboards, Player Profile, Match History, Disputes, Organizer Hub, Moderator Review, Admin Center, Fair-Play Rules, and Privacy Charter.

---

## Production-Ready Features vs. Prototypes

| Component | Status | Implementation Details |
|---|---|---|
| **Server-Authoritative Game State** | **Production-Ready** | Full state machine (`WAITING`, `READY`, `COUNTDOWN`, `ACTIVE`, `COMPLETED`, `DISCONNECTED`) running in Node.js Express backend. Client cannot fabricate scores. |
| **Deterministic Target Generator** | **Production-Ready** | Seeded LCG algorithm generates identical target and distractor sequences for both players. |
| **Bracket Engine (Single Elim & Round Robin)** | **Production-Ready** | Seed sorting by MMR, power-of-two padding, Berger round-robin pairings. |
| **FairPlayAnalyzer AI Module** | **Production-Ready** | Integrates `@google/genai` model `gemini-3.8-flash` on server with fallback to deterministic heuristic. |
| **Anti-Cheat Signal Classifier** | **Production-Ready** | Traps sub-110ms clicks, high-frequency burst clicks, clock skew desync, and tab focus loss. |
| **Multi-Role Access Control (RBAC)** | **Production-Ready** | Players, Organizers, Moderators, Admins with discrete capabilities. |
| **Firestore Database IR & Rules** | **Production-Ready** | Complete `firebase-blueprint.json` and zero-trust `firestore.rules` adhering to the 8 pillars of security rules. |
| **Real-Time WebSockets** | **Prototype / Hybrid** | Match synchronization utilizes low-latency server heartbeat polling and SSE endpoints; ready for production WebSocket/Firestore listener scaling. |
| **External Payment Gateway** | **Prototype / Mock** | Prize descriptions are verified on-platform; external banking/crypto payout requires merchant provider integration. |

---

## Threat Model & Known Limitations

1. **Client Clock Tampering (Time Dilation)**:
   - *Threat*: A malicious user alters `performance.now()` or browser clock timers.
   - *Mitigation*: The server ignores client round timers and calculates reaction time strictly using server-received timestamps and server round start timestamps (`serverReceiveTime - targetSpawnServerTime`). Clock skew deltas exceeding 2500ms trigger telemetry warnings.

2. **Rapid Automated Macro Clicking**:
   - *Threat*: Hardware auto-clicker scripts flooding all 16 cells simultaneously.
   - *Mitigation*: The server enforces coordinate checking (wrong cell penalized -200 pts) and rate-limiting (`MAX_BURST_CLICKS_PER_SEC`). Standard deviation of click latency is evaluated; robotic consistency (<10ms variance) triggers `IDENTICAL_INTERVALS_BOT`.

3. **Visual Screen-Scraper Bots**:
   - *Threat*: AI computer vision bot running on external hardware looking at screen pixels.
   - *Mitigation*: In addition to 110ms human neural minimums, targets feature jittered display timings and distractors that inflict heavy score deductions. Matches flagged `REVIEW_REQUIRED` are routed to human moderators with replay logs.

4. **Targeted Harassment & Impersonation**:
   - *Threat*: Opponents harassing competitors based on identity, nationality, or past matches.
   - *Mitigation*: Anonymous Lobby Mode permanently hides personal profile data, country, and email during all active rounds.

---

## Setup & Running the Platform

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `GEMINI_API_KEY` is provided for the FairPlayAnalyzer AI engine.

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Test Suite
```bash
npm test
```

### 5. Build for Production
```bash
npm run build
npm start
```

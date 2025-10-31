## Algo Game Hub – Implementation Plan

### Phase 1 — Foundations (Ownership, Forks, Score Standard)
- Ownership registry (on-chain): Store `{ gameCid, version, owner, parentCid?, timestamp }` at publish time.
- Fork rev‑share: Default 90/10 owner/parent split for tips and entry fees.
- Score API standard (already added to AI prompt): postMessage helpers
  - `submitScore(score, extras?)`
  - `submitResult("win"|"lose"|"draw", extras?)`
  - `submitMetrics({ points?, moves?, durationMs? }, extras?)`
- Scoring config per version (DB):
  - `numeric`: fieldPriority (e.g., ["score","points"]) and order (desc)
  - `match_points`: win=2, draw=1, lose=0; tiebreakers (moves asc, durationMs asc)

Deliverables:
- Contract: Publish Registry (TypeScript, Algokit) + generated client.
- Backend: save scoringConfig with versions; expose read API.
- UI: publish flow calls registry; show fork lineage on game pages.

### Phase 2 — Tips and Payments
- Tip jar with split: `tip(gameCid)` forwards ALGO to owner (+ parent share).
- UI: Tip button on marketplace/detail pages; reuse `Transact.tsx` pattern.

Deliverables:
- Contract: TipSplit (owner/parent distribution).
- Backend: minimal endpoints to record tips and activity feed.
- UI: Tip modal and confirmation, activity list on game page.

### Phase 3 — Tournament MVP
- Contract (on-chain escrow):
  - Create: `{ gameCid, version, startAt, endAt, entryFee, minPointsToClaim, scoringMode, organizerFeeBps }`
  - Join: pay `entryFee` per play; funds → prize pool (minus organizer fee)
  - Close/Payout: organizer/oracle publishes winners; contract pays out
- Scoring modes supported:
  - `numeric_accumulate`: sum of submitted scores
  - `match_points`: win=2, draw=1, lose=0 accumulate
- Multiple plays allowed; cumulative totals per wallet per tournament.

Deliverables:
- Contract: TournamentEscrow (create/join/close/payout).
- Backend: endpoints
  - `POST /api/tournaments` create
  - `POST /api/tournaments/{id}/join` initiate entry fee payment
  - `POST /api/scores/submit` normalize + accumulate (per tournament)
  - `GET /api/tournaments/{id}/leaderboard`
- UI: Tournament tab (join, progress bar to min points, leaderboard, claim/payout state).

### Phase 4 — Integrity Hardening
- Wallet-signed submissions: sign `{ gameCid, version, tournamentId, normalizedPayload, timestamp }`.
- One-time start tokens to prevent spoofed posts.
- Rate limits and minimum elapsed play time.
- Optional (for prizes):
  - Commit–reveal (commit hash, later reveal score+salt)
  - Deterministic seed from-chain (inject to iframe)
  - Replay logs for top scores; headless spot verification

Deliverables:
- Backend: signature verification, token issuance, rate limiting.
- Contract: add `revealEndAt` if commit–reveal enabled.

### Phase 5 — UX Polish and Ops
- Beautiful game detail: Play, Tip, Tournament, Leaderboard, Fork lineage.
- Tournament cards: countdown, prize pool, entry fee, your cumulative points.
- Admin tools: pause/cancel tournament, refunds on cancel/no participants.
- IPFS integrity: store `sha256` of HTML with version; optional verify on load; gateway fallback.

### Data Model (DB)
- Game: `{ gameId, walletAddress, title, description, tags, originalOwner?, originalGameId?, published: { marketplace[], community[] }, versions: [...] }`
- Version: `{ version, html, ipfsCid, ipfsUrl, createdAt, scoringConfig }`
- Tournament: `{ id, gameId, version, gameCid, startAt, endAt, entryFee, minPointsToClaim, scoringMode, organizerFeeBps, state, prizePool }`
- Score: per play `{ tournamentId, wallet, payloadRaw, normalized, createdAt }`; aggregate per wallet `{ total, plays }`.

### Contracts (TS)
- PublishRegistry: register, getByCid, getLineage.
- TipSplit: tip(gameCid) → owner + parent split.
- TournamentEscrow: create, join, close, payout.

### APIs (Next.js)
- Scores: `POST /api/scores/submit`, `GET /api/tournaments/{id}/leaderboard`.
- Tournaments: `POST /api/tournaments`, `POST /api/tournaments/{id}/join`.
- Registry hooks (optional server actions) to mirror on-chain state.

### Env & Config
- Pinata: `PINATA_JWT`, `NEXT_PUBLIC_GATEWAY_URL`.
- Algorand: network config (already present), deploy keys for testnet.

### Rollout Order
1) PublishRegistry + TipSplit + UI Tip
2) TournamentEscrow + MVP endpoints + UI
3) Integrity hardening (signatures, tokens)
4) Optional commit–reveal + replay verification
5) UX polish and admin tooling

### Success Metrics
- Time to publish (min), number of published games, fork ratio
- Tips volume and distribution, tournament participation, prize payouts
- Cheating incident rate (post-hardening)



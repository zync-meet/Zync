# Free-Tier Scalability Plan (April 2026)

## Scope

This document captures the architecture brainstorming and execution plan for scaling the Zync stack under free-tier constraints.

Current deployment and platform mix:
- Frontend: Vercel (free tier)
- Backend runtime: Render deployment (free tier) + Oracle VM available
- Auth: Firebase Auth
- Data: Mongo-compatible Oracle backend + other cloud integrations

Primary objective:
- Make the product reliably usable for 500+ users (registered and active), with realistic concurrency expectations under free-tier compute/memory limits.

## 1) What Is Physically Realistic on Free Tiers

### User Scale Envelope
- 500+ registered users: feasible
- 500+ monthly active users: feasible
- 500+ daily active users: feasible with low/moderate concurrency
- 500+ concurrent active realtime users: not realistic on free tiers with current architecture

### Practical Throughput Target
With Oracle VM as primary backend runtime and current optimizations:
- Expected DAU band: 500 to 1500
- Expected concurrent active users: 40 to 120 (depends on chat/webhooks/AI load)

With Render free as primary backend runtime:
- Suitable for demos/light production traffic
- Cold starts and memory caps are likely to degrade reliability for sustained high concurrency

## 2) Core Constraints in Current Architecture

### Realtime and In-Memory State
- Socket.IO state maps are process-local (chat/tasks/notes/presence).
- Horizontal scaling is limited unless socket state is externalized/coordinated.

### Webhook Amplification Risk
- Webhook commit processing is per-commit and sequential.
- Push bursts can trigger repeated DB reads/writes + repeated socket fanout.

### Cache Safety and Memory Discipline
- In-memory caches require strict max-size/TTL enforcement and validation against bad env values.
- Misconfiguration can reintroduce heap growth.

### Trust Boundary
- Webhook verification must fail closed when secret/config is missing.
- Otherwise unauthenticated traffic can force expensive processing paths.

## 3) Recommended Topology (Free-Tier Optimized)

### Runtime Placement
- Use Oracle VM as primary backend host for production traffic.
- Keep Render free as staging/fallback/canary, not primary production runtime.

### Frontend
- Keep Vercel for frontend delivery.
- Keep API calls cache-friendly where possible to reduce backend load.

### Auth and Data
- Keep Firebase Auth for identity and token verification.
- Keep a single authoritative operational DB path for core entities.
- Avoid split-brain writes for same domain entity across multiple backends.

## 4) Execution Plan

## Phase 1: Stability and Security Gate (1-2 days)

Objectives:
- Eliminate unauthenticated heavy paths
- Enforce strict memory-safe config behavior

Actions:
1. Fail closed for missing webhook secret/config in webhook verification middleware.
2. Validate and clamp all cache env values (max entries, TTL, batch sizes).
3. Clamp external pagination input (for example `per_page`) to hard max.
4. Keep raw-body parsing restricted only to webhook routes.

Success criteria:
- Webhook endpoints reject unsigned/invalid requests in production.
- No cache setting can disable pruning due to NaN/invalid values.

## Phase 2: Throughput per MB (2-4 days)

Objectives:
- Reduce per-event memory churn and avoid fanout storms

Actions:
1. Aggregate webhook commit effects and perform bulk updates where possible.
2. Emit one project update per project per webhook event, not per commit.
3. Optimize reconnect delivery catchup using single-pass sender grouping.
4. Reduce noisy debug logging in hot paths; add log-level guards.

Success criteria:
- Lower p95 latency during push bursts.
- Lower peak RSS/heap during reconnect and webhook spikes.

## Phase 3: Free-Tier Scalability Mode (2-3 days)

Objectives:
- Remove expensive work from request path

Actions:
1. Move heavy webhook processing to an internal queue worker.
2. Move AI architecture analysis to async jobs (polling/status endpoint).
3. Keep API process focused on request-response + realtime transport.

Success criteria:
- API p95 remains stable during AI/webhook bursts.
- Event backlog is visible and bounded.

## Phase 4: Operational Guardrails (1 day)

Objectives:
- Detect saturation before user-facing failure

Actions:
1. Add memory metrics: rss, heapUsed, heapTotal.
2. Add event-loop lag and route latency metrics.
3. Add queue depth and processing lag metrics for webhook/AI jobs.
4. Add alerts and overload controls (shed non-critical work under pressure).

Success criteria:
- Alerts fire before OOM.
- Controlled degradation path exists under peak load.

## 5) Capacity Guardrails and SLO Direction

### Initial SLO Direction (Free Tier)
- API p95 under normal load: < 700ms
- API p95 during moderate bursts: < 1500ms
- Error rate target: < 1%

### Overload Behavior
- Prioritize auth/session/chat read/write paths.
- Defer non-critical analytics/inference tasks when memory threshold exceeded.

## 6) Configuration Baseline (Recommended Starting Values)

Use these as a conservative baseline for free-tier stability:
- ARCHITECTURE_CACHE_MAX_ENTRIES=60
- GITHUB_CACHE_MAX_SIZE=60
- GITHUB_CACHE_TTL_MS=180000
- DELIVERY_CATCHUP_BATCH_SIZE=100
- DELIVERY_CATCHUP_MAX_BATCHES=6

## 7) Risks and Tradeoffs

- Free tiers can enforce hidden throttles and instance sleep behavior.
- Process-local socket state limits horizontal scale consistency.
- Mixed-cloud architecture increases operational complexity and incident surface.

## 8) Final Recommendation

For the 500+ user goal under current constraints:
- Treat Oracle VM as the production backend runtime.
- Keep Render free for staging/fallback.
- Complete Phase 1 and Phase 2 before attempting aggressive user growth.
- Add queue-based processing (Phase 3) before targeting sustained high concurrency.

---

Owner: Engineering
Date: 2026-04-20
Status: Draft for implementation

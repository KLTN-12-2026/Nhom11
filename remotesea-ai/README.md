# RemoteSea AI Service

A self-hosted AI microservice for RemoteSea, independent from `remotesea-api`
(NestJS) and `remotesea-web` (React) — see the architecture doc this was
built from for the full 12-phase vision. **This README documents what's
actually implemented right now, not the full vision** — see "Scope" below.

The end-to-end target for this first slice is the full learning loop for one
task only: `CANDIDATE_ANALYSIS` → `AiInteraction` → Accept/Edit/Reject
feedback → Dataset Builder → `dataset-vN` → Google Colab QLoRA training →
Evaluation → Candidate Model → human approval → Ollama deployment. Job
Matching, Interview Analysis, and Scorecard Analysis are explicitly out of
scope until that loop works end-to-end.

Alongside that loop, this service is also becoming the **AI Orchestrator**
for a separate, later-stage architecture: RemoteSea's real domain model,
authorization, and business logic live in `remotesea-api` (NestJS) —
this service never duplicates them, only calls back into `remotesea-api`'s
own authenticated HTTP API as "Tools," and holds its own RAG knowledge base
independently. See "AI Orchestrator" below for what's built there.

## Architecture

Clean Architecture, four layers, dependencies point inward only (`api` →
`application` → `domain` ← `infrastructure`; `domain` never imports from any
other layer):

```
app/
├── main.py              # composition root — wires routers to the app
├── api/                 # PRESENTATION — thin FastAPI routers, no business logic.
│   ├── deps.py, health.py, inference.py, feedback.py, datasets.py,
│   │   model_registry.py, rag.py
│   └── orchestrator/    # health.py, tools.py, ask.py, chat.py — combined
│                        # under one /v1/orchestrator router in __init__.py
├── application/         # USE CASES — orchestrates domain + infrastructure.
│   │                    # One service class per capability: inference,
│   │                    # feedback, dataset_builder, model_registry,
│   │                    # rag_ingestion, rag_retrieval, orchestrator, chat,
│   │                    # tool_service, historical_case.
├── domain/               # PURE business rules/value objects — zero I/O,
│   │                    # zero framework imports, fully unit-testable.
│   ├── candidate_analysis/  # prompt building, HistoricalCase, ground-truth selection
│   ├── orchestrator/        # context_builder (ask/chat prompt assembly), HistoryTurn
│   ├── dataset/              # example selection/splitting for the Dataset Builder
│   ├── rag/                  # chunker, RetrievedChunk
│   └── shared/                # truncate(), parse_json_object(), error_message() —
│                              # small helpers used across the domain modules above
├── infrastructure/       # DB, model/embedding providers, external HTTP, config, security
│   ├── config.py, logging.py, security.py, database.py (generic engine/session
│   │   factory), main_db.py, rag_db.py, remotesea_api_client.py
│   ├── models/            # SQLAlchemy ORM (8 tables, 2 databases)
│   └── providers/
│       ├── llm/            # AiModelProvider: base/ollama/anthropic/gemini/mock/
│       │                   # factory/errors/retry
│       └── embedding/      # EmbeddingProvider: base/ollama/mock/factory
└── schemas/               # Pydantic request/response DTOs (API contract),
                           # spans api+application; base.py's CamelModel kills
                           # the repeated camelCase-alias boilerplate
```

Two independent Postgres databases, each with its own Alembic chain
(`alembic/` for `remotesea_ai`, `alembic_rag/` for `remotesea_rag`) — see
"Local setup" below. `application/` and `domain/` only ever depend on the
`AiModelProvider` interface in `providers/llm/base.py`, never a concrete
vendor — swapping models/vendors (`AI_MODEL_PROVIDER`/`AI_MODEL`, plus each
provider's own `OLLAMA_MODEL`/`CLOUDFLARE_MODEL` override — see below) or
adding a new one (a `VLLMProvider`, say) means adding/selecting one class
under `infrastructure/providers/llm/`, not touching either layer.

## Scope: what's built vs. what isn't

Built and verified end-to-end, against a real running Postgres + Ollama
stack (not just written — every item below has been exercised with real
curl calls and DB queries):

- FastAPI service, own PostgreSQL database (via SQLAlchemy async + Alembic),
  shared-secret auth for NestJS → AI Service calls.
- **`AiModelProvider` abstraction with three real implementations** —
  `OllamaProvider` (default, self-hosted, running **Qwen2.5-3B-Instruct**
  locally, CPU-only — zero API key needed), `AnthropicProvider`, and
  `GeminiProvider`, selected via `AI_MODEL_PROVIDER`/`AI_MODEL`
  (`app/infrastructure/providers/llm/factory.py`). All three implemented
  against raw `httpx` (no `anthropic`/`google-genai` SDK dependency added —
  same reasoning `OllamaProvider` already followed) and share one retry
  helper (`providers/llm/retry.py`: connection errors and 429/5xx retry up
  to 3x with backoff, a 400/401 or a timeout does not — a timeout on
  Ollama's CPU-only inference usually means "still generating," not
  "transient") and one normalized error type (`AiProviderError`), instead
  of each provider reimplementing that normalization. `json_schema`
  (grammar-constrained structured output) is honored by each vendor's own
  mechanism — Ollama's `format: <schema>`, Gemini's `responseSchema`/
  `responseMimeType`, Anthropic's forced single-tool-use pattern (Claude has
  no bare JSON-mode equivalent) — all three still return a plain string
  from `complete()`, so nothing downstream (`parse_json_object`, every
  caller) had to change. **Only `OllamaProvider` is live-verified** — no
  Anthropic/Gemini API key exists in this environment; those two are
  verified via unit tests on their pure request/response-shaping functions
  (`tests/test_anthropic_provider.py`, `tests/test_gemini_provider.py`) and
  built against each vendor's documented REST contract, not exercised
  against a real network call. `AiModelProvider` also declares `stream()`
  (all three implement it — Ollama's native NDJSON, Anthropic/Gemini's SSE)
  but **nothing calls it yet** — every current endpoint needs a complete,
  parseable JSON object, not partial text; built as available
  infrastructure for a future streaming endpoint, same "capability exists,
  not yet wired in" spirit as the rest of this section.
- `POST /v1/inference` for `task: "CANDIDATE_ANALYSIS"` — builds a prompt from
  candidate/job/application context, calls the model, validates the response
  against a strict Pydantic schema (`score`, `recommendation`, `strengths`,
  `weaknesses`, `missingRequirements`, `reasoning`), persists it as an
  `AiInteraction` (auditable: input, output, model version, latency, status,
  never overwritten), returns the structured result.
- `POST /v1/feedback` — a human records `ACCEPT` / `EDIT` / `REJECT` against
  an `AiInteraction`, optionally with a `correctedOutput` (required for
  `EDIT`) and a `reason`. Stored as an immutable `AiFeedback` row. **Never
  triggers anything automatically** — no auto-training, no auto-dataset-build
  — that's a hard rule from the architecture doc, enforced by construction:
  `FeedbackService` only validates and persists, nothing else.
- `POST /v1/datasets/build` and `GET /v1/datasets` — the Dataset Builder.
  Joins each `AiInteraction` with its *latest* `AiFeedback`, keeps `ACCEPT`
  (ground truth = the model's own output) and `EDIT` (ground truth = the
  human's `correctedOutput`), drops `REJECT` and anything with no feedback at
  all, validates the resulting ground truth against `CandidateAnalysisResult`
  (so stale-schema or malformed data can't silently poison training),
  deduplicates by input, splits 80/10/10 into train/validation/test, and
  writes `datasets/candidate_analysis/v{N}/{train,validation,test}.jsonl` in
  the exact `{"instruction", "input", "output"}` shape the training notebook
  expects. Every build inserts a new `AiDataset` row and new files — an
  existing version is never updated or overwritten (`dataset-v1` stays
  `dataset-v1` forever, including a `FAILED` one from a build that found zero
  valid samples). Explicitly invoked only — feedback volume never triggers a
  build on its own.
- `POST /v1/models`, `/complete-training`, `/evaluate`, `/approve`,
  `/rollback`, `GET /v1/models`, `GET /v1/models/active` — the Model
  Registry. One `AiModel` row per training attempt, status only ever moving
  forward through `TRAINING → EVALUATING → CANDIDATE → ACTIVE → ARCHIVED`
  (or off to `REJECTED` from `EVALUATING`); every mutating call checks the
  row is in the expected prior state first and 409s otherwise. `approve`
  enforces "exactly one ACTIVE row per task" by archiving the current active
  model in the same transaction — never two ACTIVE rows, never a gap.
  `rollback` only accepts a model that was previously ACTIVE (`deployedAt`
  set, now `ARCHIVED`); rolling back to a model that was never deployed
  (still `TRAINING`, `CANDIDATE`, or `REJECTED`) is rejected. Evaluation
  pass/fail (`passed: true|false` on `/evaluate`) is supplied by the caller
  — this service has no real model predictions to judge quality from without
  Colab, so it records the decision rather than inventing a threshold.
- `GET /health`.

### AI Orchestrator (Phases 1–3, verified live against both real services)

- **Context forwarding** (`require_orchestrator_context`, `/v1/orchestrator/health`) —
  remotesea-api mints a short-lived HS256 JWT per request (`AiOrchestratorService.
  mintContextToken`, signed with the same `AI_SERVICE_SECRET`) carrying the
  calling user's id/role/company membership (resolved through remotesea-api's
  own `CompanyMembershipService`, not re-derived here). This service verifies
  it, never trusts an unsigned identity. Round-trip verified live for both
  TALENT and EMPLOYER (with real `employerId`/`companyRole`) against a real
  Supabase-backed remotesea-api instance.
- **Tools** (`/v1/orchestrator/tools/applications/{id}`, `/candidate-analysis`,
  `/interview`, `/jobs/{id}`) — this service never queries remotesea-api's
  database or re-implements its authorization; each tool forwards the exact
  bearer token it received to a dedicated remotesea-api route
  (`GET /ai-orchestrator/tools/...`) guarded by the *same* `ApplicationAccessGuard`/
  `RolesGuard` classes real browser requests go through. Verified live: an
  owning employer gets data, a wrong-role caller gets 403, a
  different-company employer gets 403 (cross-tenant isolation), and a real
  business error (no résumé uploaded) propagates through unmodified rather
  than becoming an opaque 500.
- **RAG** (`POST /v1/rag/documents`, `GET /v1/rag/documents`,
  `POST /v1/rag/search`) — split storage: `RagDocument` (title/source/
  content) and a slim `RagChunk` (id/document_id/chunk_index/content, no
  vector) live in `remotesea_rag` (a second Postgres database, kept
  independent from the Learning Loop's tables); chunk **vectors** live in
  **Qdrant** (`app/infrastructure/qdrant_client.py`) — `qdrant-client`, the
  one deliberate exception to this codebase's otherwise raw-`httpx`-only
  provider convention (Qdrant's collection/query API is meaningfully more
  complex than a REST completion call). `EmbeddingProvider` abstraction
  (`app/infrastructure/providers/embedding/base.py`) with a real
  `OllamaEmbeddingProvider` (`nomic-embed-text`, 768-dim) and a
  `MockEmbeddingProvider` for tests, unchanged. Ingestion chunks on
  paragraph/sentence boundaries with overlap (`app/domain/rag/chunker.py`,
  pure/unit-tested), embeds in one batched call, writes the Postgres rows
  first then upserts the same chunks into Qdrant (id/vector/payload with
  document_id/title/source/content denormalized in) — the collection is
  created automatically on first ingest if it doesn't exist yet
  (`ensure_collection()`, idempotent). **Hybrid retrieval unchanged in
  spirit**: `retrieve()` combines Qdrant vector search with Postgres
  full-text search (`ts_rank`/`plainto_tsquery`), fused via Reciprocal Rank
  Fusion (`app/domain/rag/fusion.py`, pure/unit-tested). Every returned
  `distance` is still a real, comparable cosine distance regardless of
  which side found the chunk — Qdrant's own similarity `score` is converted
  (`1 - score`) for vector-side matches; a full-text-only match gets its
  vector fetched from Qdrant in one batched call and its distance computed
  the same way (never a `ts_rank` value mislabeled as a distance — the
  original hybrid-search correctness guarantee, preserved through the
  storage-backend change). A Qdrant failure (auth, network, missing
  collection) is caught and converted to a clean 502, the same convention
  used everywhere else in this service, not a bare unhandled 500 — this was
  a real gap found and fixed while wiring Qdrant in, since RAG search now
  has a real external network dependency it didn't have before.
  **Unverified this round**: no real `QDRANT_API_KEY` exists in this
  environment yet (confirmed a placeholder in chat) — every Qdrant-touching
  code path was exercised live up to the auth boundary (confirmed via a
  real `403 Forbidden` from the actual cluster, converted to a clean 502 as
  designed, not a crash), but no vector was ever actually stored or
  searched for real. Set a real `QDRANT_API_KEY` and re-ingest to close
  this gap — old Postgres-only test chunks from before this migration have
  no corresponding Qdrant point and will only ever be found by the
  full-text half of hybrid search (by design — not backfilled, see the
  migration's own "not in scope" note).
- **Context Builder + routing** (`POST /v1/orchestrator/ask`) — the first
  endpoint that decides what to fetch rather than being told exactly what to
  call. Without an `applicationId`, RAG always runs against the question —
  no page context to classify against. With one, a single LLM
  classification call (`OrchestratorService._select_tools`, `app/domain/
  orchestrator/tool_selection.py`) decides **both** which of that
  application's data sources (`application`/`candidate_analysis`/
  `interview`) to fetch **and** whether RAG/knowledge retrieval is relevant
  at all — **this classification call now always runs**, even with no
  `applicationId` (previously RAG ran unconditionally in that case); a
  purely conversational message skips RAG entirely instead of always paying
  for an embed call + DB queries it doesn't need. Runs on its own model
  (`AI_CLASSIFICATION_MODEL`, optional — see below) since it's a much
  simpler decision than the final answer. On any classification failure it
  falls back to "always fetch `application`" (or nothing, with no
  `applicationId`) + "always run RAG," so this can only do as well as or
  better than the old fixed rule. Once decided, the selected tool fetches
  and (if needed) RAG retrieval run **concurrently**, not sequentially.
  `context_builder.py` merges user role/company + live data from the
  selected tools + retrieved knowledge + the question into one prompt with
  hard character caps per section, pure and unit-tested. `sources` in the
  response is always computed from what this service actually fetched,
  never taken from the model's own claims. **`"interview"`'s tool
  description was corrected** after a business-context accuracy audit found
  it oversold what the tool actually returns — it's scheduling/status only
  (proposed/confirmed time slots, meeting link), not a hiring outcome or
  recommendation (that's `Scorecard.recommendation` on the remotesea-api
  side, which no Tool here exposes yet — a real, disclosed gap, not
  something to invent). Verified live: a pure knowledge question answered
  correctly from RAG alone; a purely conversational message with no
  `applicationId` correctly skipped RAG altogether (confirmed via server
  log: zero `/api/embed` calls); a question purely about an application's
  own status correctly skipped RAG too; a wrong-role/nonexistent-application
  Tool call is caught per-tool and the request still answers from whatever
  else was available rather than failing outright.
- **Fixed a real, live-reachable bug**: `CandidateAnalysisToolResult`
  required an `applicationId` field remotesea-api's real
  `candidate-analysis` Tool endpoint never returns (confirmed by reading
  `cvAnalysisSelect` in remotesea-api directly) — every real call to that
  tool raised a Pydantic `ValidationError`, which `_fetch_tool` didn't
  catch (only `HTTPException` was), turning into an unhandled 502 for the
  **entire** `/ask`/`/chat` request. Fixed by removing the field (it
  structurally doesn't exist) and broadening `_fetch_tool`'s exception
  handling to catch any unexpected failure per-tool, not just
  `HTTPException` — one Tool's response-shape mismatch now degrades
  gracefully (skip that source) instead of failing the whole request, the
  same defense-in-depth already applied to RAG/historical-case lookups.
  Verified live: the exact broken payload shape (matching remotesea-api's
  real `cvAnalysisSelect`) now validates successfully against the fixed
  schema, and was independently confirmed to have failed against the old
  one on the identical payload.
- **Schema-constrained decoding**: `AiModelProvider.complete()` accepts an
  optional `json_schema` — when given, Ollama's grammar-constrained decoding
  (`format: <schema>`, not just `format: "json"`) guarantees the response
  matches that shape, removing most malformed-response failures. Both
  `CandidateAnalysisResult` and `/ask`/`/chat`'s internal `_ParsedAnswer`
  use it. `CandidateAnalysisResult`'s field order is deliberate — evidence
  (`strengths`/`weaknesses`/`missingRequirements`/`reasoning`) before the
  verdict (`score`/`recommendation`) — since grammar-constrained decoding
  generates fields in schema order, this structurally forces
  reasoning-before-conclusion at zero added latency. Verified live against
  the running Ollama instance before wiring it through the app.
- **Connection reuse + `keep_alive`** — `OllamaProvider`/
  `OllamaEmbeddingProvider` (both process-lifetime singletons via
  `@lru_cache` in their `factory.py`) now hold one persistent
  `httpx.AsyncClient` each instead of opening a fresh connection per call,
  and every Ollama request sets `keep_alive` (`OLLAMA_KEEP_ALIVE`, default
  `30m`) so the model stays resident between requests — a live smoke test
  earlier in development hit a ~15.8s `load_duration` alone on a cold call
  after the model had unloaded; verified live that a second call
  immediately after a first shows no such reload spike. `app/main.py` has a
  `lifespan` handler that closes these clients (and
  `remotesea_api_client`'s own module-level client) on shutdown; confirmed
  live with a clean `Application shutdown complete`, no errors.
- **Validate-and-retry on unparseable structured output**
  (`app/application/structured_completion.py:complete_structured`) — schema-
  constrained decoding makes an invalid response rare, not impossible; both
  `InferenceService` and `OrchestratorService` now retry the completion call
  once (not just parse-and-give-up) before falling back to their existing
  failure handling (CANDIDATE_ANALYSIS still marks `FAILED`; ask/chat still
  falls back to raw text at 0 confidence) — today's failure-path *outcomes*
  are unchanged, only a second attempt happens first.
- **Per-task model** (`AI_CLASSIFICATION_MODEL`, optional, default unset =
  use `AI_MODEL`) — the tool-selection/RAG-necessity classification call can
  run on a different (e.g. smaller/faster) model than the main answer,
  since it's a much simpler decision. **Live-tested with a real smaller
  local model (`qwen2.5:1.5b` vs. the default `qwen2.5:3b-instruct`) and
  the result is a genuine, disclosed tradeoff, not a free win**: the smaller
  model *was* noticeably faster, but on one repeated test question ("what
  is the notice period policy for scheduling?") it incorrectly decided
  `needsKnowledge: false` and the request came back with no RAG grounding
  at all ("NOT ENOUGH INFORMATION" instead of the correct "48 hours") — the
  same question correctly triggers RAG and answers correctly with the
  default 3B model doing classification. Left unset by default for exactly
  this reason; documented here so switching it is an informed choice, not
  an assumed improvement.
- **Bounded RAG result cache** (`app/application/rag_retrieval_service.py`,
  module-level, keyed on normalized `(query, top_k)`, 5-minute TTL, small
  max size) — a repeated identical question skips the embed call + two DB
  queries entirely. `RagIngestionService` clears it after every successful
  ingest so a newly-added document is never masked by a stale cached result.
  Verified live: two identical `POST /v1/rag/search` calls back-to-back —
  the second logged zero `/api/embed` calls and returned in ~0.03s vs. the
  first's ~0.25s.
- **Groundedness check for CANDIDATE_ANALYSIS**
  (`check_missing_requirements_against_skills`, alongside the existing
  score/recommendation consistency check) — targets one specific, checkable
  hallucination pattern rather than general fact-checking: flags (via a
  `groundednessWarning` in `retrieved_context`, logged, never rewriting the
  model's output) when a `missingRequirements` entry names a skill the
  candidate's own skills list already states — a mistake small models make.
- **AI Chat** (`POST/GET /v1/orchestrator/chat`, `GET /v1/orchestrator/chat/{id}`
  — proxied through remotesea-api's `/ai-orchestrator/chat*`, and a real
  `/ai-chat` page in remotesea-web) — multi-turn on top of `ask()`'s same
  generation path (`OrchestratorService.generate`), persisted as
  `AiConversation`/`AiConversationTurn` (in `remotesea_ai`, not
  `remotesea_rag` — this is Learning Loop history, not knowledge-base
  content), with the last 6 turns fed back in as a capped CONVERSATION
  HISTORY section. Conversation ownership is checked against the JWT's own
  `user_id`, never a client-supplied field. Verified live end-to-end
  (browser → remotesea-web → remotesea-api → remotesea-ai → Ollama → back):
  a follow-up question with no explicit reference to the prior turn's topic
  answered correctly purely from conversation memory; a different user's
  token got 404 on both reading and continuing someone else's conversation.
  The remotesea-web UI itself was verified by compile/serve checks
  (`tsc`, `eslint`, Vite module loading) only — this environment has no
  working browser-automation tool (a real attempt with Playwright failed:
  incompatible with this machine's macOS 13), so the actual rendered page
  has not been visually confirmed; the user should check `/ai-chat` in a
  real browser themselves before treating the UI as done.
- **Chat grounded in the same user's past sessions, not just the current
  conversation** — `ChatService` embeds each question once (`nomic-embed-
  text`, pgvector now enabled on `remotesea_ai` too, not only
  `remotesea_rag`), reuses that same vector both to search the user's
  *other* conversations by cosine similarity and to store on the new turn
  (`ai_conversation_turns.embedding`, nullable — older turns have none and
  are naturally excluded). Scoped strictly to `context.user_id`, never
  cross-user — chat turns are real personal Q&A, unlike the anonymized
  `HistoricalCase`s CANDIDATE_ANALYSIS uses. Surfaced as a distinct `RELATED
  PAST CONVERSATIONS` prompt section, kept separate from the current
  conversation's own `CONVERSATION HISTORY`. Verified live: a fact stated in
  one conversation was correctly recalled when asked about from a brand-new,
  otherwise-empty conversation.
- **CANDIDATE_ANALYSIS is now grounded in RAG + historical cases**
  (`application/historical_case_service.py`) — before building its prompt,
  `InferenceService` retrieves relevant RAG chunks (query: job
  title/level/requirements) and up to 3 similar past `CANDIDATE_ANALYSIS`
  cases (matched on job title, latest-feedback-per-interaction, `REJECT`
  excluded, ground truth validated against the current
  `CandidateAnalysisResult` schema so a stale-shaped historical row can't
  leak in). Historical cases carry **only the anonymized outcome**
  (job title/level, score, recommendation, reasoning, and the human's
  correction reason if any) — never the candidate's name/skills/resume,
  since `AiInteraction` spans every company's candidates and this
  service has no per-tenant scoping the way remotesea-api's guards do.
  `AiInteraction.retrieved_context` now actually records what was
  retrieved (`ragChunkIds`, `historicalCaseCount`) instead of always being
  `null`. The external `POST /v1/inference` contract is unchanged — this is
  purely an internal enrichment (`InferenceService` also works with
  `rag_db`/`embedding_provider` omitted, e.g. in older tests). Two real bugs
  hit and fixed while wiring this up: SQLAlchemy's generic `JSON` type
  needs `.as_string()` for a LIKE match, not `.astext` (that's JSONB-only);
  and — found only once real historical data with the *old* pre-Phase-3
  output schema was queried — `AiInteraction.output`/`retrieved_context`
  had the same "Python `None` stored as JSON `null` instead of SQL `NULL`"
  bug already fixed on `AiFeedback.corrected_output`, now fixed here too
  (existing bad rows corrected in place). Verified live: a real inference
  call's persisted `retrieved_context` showed 2 real RAG chunk ids and
  `historicalCaseCount: 1` — correctly excluding 2 other matching
  interactions whose stored output used the old schema.
- **Soft score/recommendation consistency check** — after a successful
  parse, `check_score_recommendation_consistency` (`app/domain/
  candidate_analysis/consistency.py`, pure) flags an obviously mismatched
  pair (e.g. a high score paired with `REJECT`) as a logged warning plus a
  `consistencyWarning: true` flag folded into `retrieved_context` — for
  visibility only, it never rewrites the model's own score/recommendation
  (business rules stay out of this service, same boundary the system prompt
  itself states).

**Deliberately not built yet** (this is the honest gap, not an oversight):

- Every other `AiTask` (JOB_MATCHING, INTERVIEW_ANALYSIS, SCORECARD_ANALYSIS,
  INTERVIEW_QUESTION_GENERATION, KNOWLEDGE_ASSISTANT) — the enum exists, the
  request schema accepts them, but `InferenceService.run` raises a clean 501
  for anything except CANDIDATE_ANALYSIS, and the Dataset Builder raises
  `UnsupportedDatasetTaskError` for anything else too. Out of scope until the
  CANDIDATE_ANALYSIS loop works end-to-end (explicit instruction).
- **`notebooks/qlora_training.ipynb`** exists (QLoRA fine-tune of
  `Qwen/Qwen2.5-3B-Instruct` on `train.jsonl`, evaluate against `test.jsonl`,
  save the adapter) but **has never been run** — this environment has no
  GPU to run it against. Treat its hyperparameters as reasonable T4 defaults,
  not verified ones, until someone runs it on Colab.
- **`scripts/deploy_to_ollama.py`** (merge LoRA adapter → GGUF via llama.cpp
  → `ollama create`) is split into two stages with different verification
  status: the merge/convert/quantize stage needs torch/transformers/peft
  (`requirements-deploy.txt`, deliberately kept out of the main service's
  deps) and a built llama.cpp, and **has not been run** — no real adapter
  exists yet to test it against. The Modelfile-render + `ollama create` stage
  **has been run for real** (`--from-model qwen2.5:3b-instruct --skip-merge`,
  then removed) — confirmed the rendered `SYSTEM` prompt matches
  `CANDIDATE_ANALYSIS_SYSTEM` (`app/domain/candidate_analysis/prompts.py`)
  exactly (single source of truth, no copy-paste drift) and `ollama create`
  succeeds.
- The real Evaluation computation that feeds `/v1/models/{id}/evaluate`
  needs a trained model's actual predictions — the notebook's evaluation
  cell computes it, but hasn't been run for the same no-GPU reason.
- **Full intent detection**: `/v1/orchestrator/ask` and `/chat` now use one
  LLM classification step to pick which of an application's data sources to
  fetch *and* whether RAG/knowledge retrieval is relevant at all, and this
  now runs unconditionally (an `applicationId` is no longer required to
  trigger it — see "Context Builder + routing" above). The doc's full
  "Knowledge Question / Live Data Question / Complex Question / Pure
  Conversation" classification (deciding whether to skip the *final* LLM
  call entirely for something trivial like a greeting) is still future
  work — every message still gets a real generation call. `ask()` (unlike
  `chat()`) still has no related-past-session grounding — it has no
  conversation identity to anchor "past sessions" against.
- **No Scorecard/hiring-outcome Tool** — an accuracy audit against
  remotesea-api confirmed hiring recommendation data
  (`Scorecard.recommendation`: `STRONG_YES`/`YES`/`NO`/`STRONG_NO`) isn't
  exposed by any of the three existing Tools (`interview` is
  scheduling/status only). Adding one needs a new remotesea-api endpoint —
  cross-repo, out of scope for a remotesea-ai-only change — so a question
  about hiring outcome currently gets an honest "not enough information"
  rather than a wrong or invented answer, not a real answer.
  vLLM as a fourth provider (self-hosted, GPU) + production hardening.
- Nothing currently makes `OllamaProvider` read `GET /v1/models/active` to
  pick which model to serve — it still always uses the fixed `AI_MODEL`
  env var. Wiring dynamic model selection into the provider is follow-up
  work once there's an actual fine-tuned model to select.
- **Why no local training**: this machine has no GPU. Per the architecture
  doc's explicit hardware constraint, QLoRA/LoRA training must never run
  locally — it's designed to run on Colab's GPU against the `train.jsonl`
  this service produces, as a fully separate pipeline. Building the notebook
  now would mean shipping code that's never actually been executed anywhere,
  which is worse than not having it yet — it'll be built and the user will
  need to run it on Colab themselves once there's a real dataset worth
  training on.

## Local setup

Requires Docker (for Postgres) and Ollama running natively on the host — see
below for why Ollama isn't containerized here.

```bash
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt

cp .env.example .env   # then edit AI_SERVICE_SECRET to a real random value

docker compose up -d postgres
alembic upgrade head

# RAG's database is a second database on this same Postgres server, created
# once by hand (RagDocument + slim RagChunk metadata/content only — chunk
# *vectors* live in Qdrant, not here, so this database no longer needs
# CREATE EXTENSION vector for RAG's own sake):
docker exec -i $(docker compose ps -q postgres) psql -U ai_service -d postgres -c "CREATE DATABASE remotesea_rag;"
alembic -c alembic_rag.ini upgrade head

# RAG chunk vector storage — a Qdrant Cloud cluster (or self-hosted Qdrant),
# not a container here. Set QDRANT_URL/QDRANT_API_KEY in .env; the
# collection is created automatically on first document ingest.

# Ollama runs on the host, not in Docker — the official ollama/ollama image
# bundles NVIDIA CUDA libraries for GPU inference this machine can't use,
# which is 10GB+ of dead weight (and what filled a disk-constrained dev VM
# during initial setup). Install natively instead:
#   macOS: https://ollama.com/download (or `brew install ollama`, which
#   builds a large dependency tree from source on machines without a
#   Homebrew bottle for the current OS — the .com installer avoids that).
ollama serve &
ollama pull qwen2.5:3b-instruct   # or whatever AI_MODEL is set to in .env (Ollama path only)
ollama pull nomic-embed-text      # RAG's embedding model

uvicorn app.main:app --reload
```

Verify inference:

```bash
curl http://localhost:8000/health

curl http://localhost:8000/v1/inference \
  -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(grep AI_SERVICE_SECRET .env | cut -d= -f2)" \
  -d '{
    "task": "CANDIDATE_ANALYSIS",
    "userId": "user_123",
    "applicationId": "application_123",
    "context": {
      "candidate": {"name": "Jane Doe", "skills": ["Node.js", "PostgreSQL"], "yearsExperience": 5},
      "job": {"title": "Backend Engineer", "description": "Build APIs.", "level": "SENIOR"}
    }
  }'
```

On this dev machine (CPU-only, 3B model), a CANDIDATE_ANALYSIS call takes
roughly 2–3 minutes. Production (vLLM + GPU) is expected to be far faster —
nothing in the request/response contract changes when that swap happens.

Verify feedback + dataset build (using the `interactionId` from the call
above):

```bash
SECRET=$(grep AI_SERVICE_SECRET .env | cut -d= -f2)

curl http://localhost:8000/v1/feedback \
  -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $SECRET" \
  -d '{"interactionId": "<id from above>", "userId": "user_123", "action": "ACCEPT"}'

curl http://localhost:8000/v1/datasets/build \
  -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $SECRET" \
  -d '{"task": "CANDIDATE_ANALYSIS"}'

curl "http://localhost:8000/v1/datasets?task=CANDIDATE_ANALYSIS" \
  -H "Authorization: Bearer $SECRET"
```

Verify the model registry (normally driven by the Colab notebook + a human
approver, faked here with a placeholder artifact path):

```bash
MODEL_ID=$(curl -s http://localhost:8000/v1/models \
  -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $SECRET" \
  -d '{"task": "CANDIDATE_ANALYSIS", "name": "candidate-analysis-lora-v1", "baseModel": "Qwen/Qwen2.5-3B-Instruct", "datasetVersion": 1}' \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")

curl http://localhost:8000/v1/models/$MODEL_ID/complete-training \
  -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $SECRET" \
  -d '{"artifactPath": "/path/to/lora-adapter"}'

curl http://localhost:8000/v1/models/$MODEL_ID/evaluate \
  -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $SECRET" \
  -d '{"metrics": {"taskAccuracy": 0.82}, "passed": true}'

curl http://localhost:8000/v1/models/$MODEL_ID/approve \
  -X POST -H "Authorization: Bearer $SECRET"

curl "http://localhost:8000/v1/models/active?task=CANDIDATE_ANALYSIS" \
  -H "Authorization: Bearer $SECRET"
```

Verify RAG (self-contained — doesn't need remotesea-api running):

```bash
curl http://localhost:8000/v1/rag/documents \
  -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $SECRET" \
  -d '{"title": "Interview Scheduling Policy", "source": "interview-guidelines", "content": "..."}'

curl http://localhost:8000/v1/rag/search \
  -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $SECRET" \
  -d '{"query": "Can an employer reschedule a confirmed interview?", "topK": 3}'
```

Verify the AI Orchestrator's context-forwarding and Tools (needs
remotesea-api running too, and a real user JWT — the health check mints its
own token internally, the individual tool endpoints below expect one already
minted for you to forward; see remotesea-api's own README for how it mints
one via `AiOrchestratorService.mintContextToken`):

```bash
curl http://localhost:8000/v1/orchestrator/health -H "Authorization: Bearer <orchestrator-context-token>"
curl http://localhost:8000/v1/orchestrator/tools/applications/<id> -H "Authorization: Bearer <orchestrator-context-token>"

curl http://localhost:8000/v1/orchestrator/ask \
  -X POST -H "Content-Type: application/json" -H "Authorization: Bearer <orchestrator-context-token>" \
  -d '{"question": "Can an employer reschedule a confirmed interview?"}'

# With page context — pulls that application's live data as a Tool call too:
curl http://localhost:8000/v1/orchestrator/ask \
  -X POST -H "Content-Type: application/json" -H "Authorization: Bearer <orchestrator-context-token>" \
  -d '{"question": "What is the status of this application?", "applicationId": "<id>"}'
```

## Tests

```bash
python -m pytest tests/ -v
```

Covers pure logic only (prompt building, response parsing, feedback
validation, dataset example selection/splitting) — no DB/HTTP integration
tests yet, since those need a running Postgres + Ollama. Every DB/HTTP path
has instead been verified manually against the real running stack (see
commands above) each time it changed.

## Talking to this service from NestJS

Two integration paths exist side by side:

- **`CANDIDATE_ANALYSIS` inference/feedback/datasets/models** — not wired up
  on the remotesea-api side yet. When it is: NestJS builds the `context`
  (candidate/job/application) from its own database — this service never
  queries remotesea-api's Postgres directly — and calls the corresponding
  `/v1/...` endpoint with `Authorization: Bearer <AI_SERVICE_SECRET>`.
- **The AI Orchestrator (context/tools/RAG)** — wired up and verified live.
  remotesea-api's `AiOrchestratorModule` (`src/modules/ai-orchestrator/` in
  that repo) mints a per-request context token and calls this service's
  `/v1/orchestrator/...` routes; this service forwards that same token back
  to remotesea-api's `/ai-orchestrator/tools/...` routes for Tool calls. Both
  sides must have the identical `AI_SERVICE_SECRET` configured — it's the
  legacy bearer secret on one set of routes and the JWT signing key on the
  other, same value either way.

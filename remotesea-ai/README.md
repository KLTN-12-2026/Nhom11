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
│       ├── llm/            # AiModelProvider: base/ollama/mock/factory
│       └── embedding/      # EmbeddingProvider: base/ollama/mock/factory
└── schemas/               # Pydantic request/response DTOs (API contract),
                           # spans api+application; base.py's CamelModel kills
                           # the repeated camelCase-alias boilerplate
```

Two independent Postgres databases, each with its own Alembic chain
(`alembic/` for `remotesea_ai`, `alembic_rag/` for `remotesea_rag`) — see
"Local setup" below. Swapping the LLM (Qwen → Llama/Mistral) or the inference
runtime (Ollama → vLLM) means adding one class under
`infrastructure/providers/llm/` and pointing `factory.py` at it — nothing in
`application/` or `domain/` changes, since both only depend on the
`AiModelProvider` interface in `providers/llm/base.py`.

## Scope: what's built vs. what isn't

Built and verified end-to-end, against a real running Postgres + Ollama
stack (not just written — every item below has been exercised with real
curl calls and DB queries):

- FastAPI service, own PostgreSQL database (via SQLAlchemy async + Alembic),
  shared-secret auth for NestJS → AI Service calls.
- `AiModelProvider` abstraction with one real implementation (`OllamaProvider`,
  running **Qwen2.5-3B-Instruct** locally, CPU-only). Swapping in a
  `VLLMProvider` for production later means adding one class, not touching
  any caller — see `app/infrastructure/providers/llm/factory.py`.
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
  `POST /v1/rag/search`) — its own database (`remotesea_rag`, a second
  database on the same Postgres server as `remotesea_ai`, per the explicit
  decision to keep knowledge-base storage independent from the Learning
  Loop's tables), pgvector for storage/similarity search, `EmbeddingProvider`
  abstraction (`app/infrastructure/providers/embedding/base.py`) with a real
  `OllamaEmbeddingProvider` (`nomic-embed-text`, 768-dim) and a
  `MockEmbeddingProvider` for tests. Ingestion chunks on paragraph/sentence
  boundaries with overlap (`app/domain/rag/chunker.py`, pure/unit-tested) and
  embeds in one batched call. **Hybrid retrieval**: `retrieve()` combines
  pgvector cosine-similarity search with Postgres full-text search
  (`ts_rank`/`plainto_tsquery`), fused via Reciprocal Rank Fusion
  (`app/domain/rag/fusion.py`, pure/unit-tested) — a keyword-heavy query no
  longer has to rely on semantic similarity alone to surface an exact-term
  match; when the full-text side finds nothing, this degrades to exactly
  the vector-only ranking. Every returned `distance` is a real cosine
  distance (computed in Python from the chunk's own embedding when it was
  only found via full-text, not a mislabeled `ts_rank` score) — verified
  live: a keyword-heavy query and a semantically-phrased query for the same
  topic both correctly ranked the matching policy document first.
- **Context Builder + routing** (`POST /v1/orchestrator/ask`) — the first
  endpoint that decides what to fetch rather than being told exactly what to
  call. Without an `applicationId`, RAG always runs against the question —
  no page context to classify against. With one, a single LLM
  classification call (`OrchestratorService._select_tools`, `app/domain/
  orchestrator/tool_selection.py`) decides **both** which of that
  application's data sources (`application`/`candidate_analysis`/
  `interview`) to fetch **and** whether RAG/knowledge retrieval is relevant
  at all — a Tool-only question (e.g. "what's this application's status?")
  now skips RAG's embed call and DB queries entirely instead of always
  paying for both; on any classification failure it falls back to the old
  "always fetch `application`, always run RAG" rule, so this can only do as
  well as or better than before. Once decided, the selected tool fetches
  and (if needed) RAG retrieval run **concurrently**, not sequentially.
  `context_builder.py` merges user role/company + live data from the
  selected tools + retrieved knowledge + the question into one prompt with
  hard character caps per section, pure and unit-tested. `sources` in the
  response is always computed from what this service actually fetched,
  never taken from the model's own claims. Verified live: a pure knowledge
  question answered correctly from RAG alone; a question specifically about
  an interview's outcome, with an `applicationId`, correctly selected the
  `interview` tool (not `application`); a question purely about an
  application's own status correctly skipped RAG altogether (confirmed via
  server log: zero `/api/embed` calls for that request); a wrong-role/
  nonexistent-application Tool call is caught per-tool and the request
  still answers from whatever else was available rather than failing
  outright.
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
  fetch *and* whether RAG/knowledge retrieval is relevant at all (see
  "Context Builder + routing" above) — but only when an `applicationId` is
  given; without one, RAG still unconditionally runs (there's no page
  context to classify against). The doc's full "Knowledge Question / Live
  Data Question / Complex Question / Pure Conversation" classification
  (deciding whether to skip the LLM call entirely for something trivial) is
  still future work. No separate/smaller model for the classification call
  either — it uses the same `OLLAMA_MODEL` as everything else; a real speed
  lever, not built yet since it adds a second model to configure/pull for a
  call that's already short. `ask()` (unlike `chat()`) still has no
  related-past-session grounding — it has no conversation identity to
  anchor "past sessions" against. vLLM + production hardening.
- Nothing currently makes `OllamaProvider` read `GET /v1/models/active` to
  pick which model to serve — it still always uses the fixed `OLLAMA_MODEL`
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
# once by hand (the pgvector/pgvector:pg16 image bundles the extension, but
# CREATE DATABASE + CREATE EXTENSION only need to run once — they don't
# happen automatically against an existing data volume):
docker exec -i $(docker compose ps -q postgres) psql -U ai_service -d postgres -c "CREATE DATABASE remotesea_rag;"
docker exec -i $(docker compose ps -q postgres) psql -U ai_service -d remotesea_rag -c "CREATE EXTENSION vector;"
alembic -c alembic_rag.ini upgrade head

# Ollama runs on the host, not in Docker — the official ollama/ollama image
# bundles NVIDIA CUDA libraries for GPU inference this machine can't use,
# which is 10GB+ of dead weight (and what filled a disk-constrained dev VM
# during initial setup). Install natively instead:
#   macOS: https://ollama.com/download (or `brew install ollama`, which
#   builds a large dependency tree from source on machines without a
#   Homebrew bottle for the current OS — the .com installer avoids that).
ollama serve &
ollama pull qwen2.5:3b-instruct   # or whatever OLLAMA_MODEL is set to in .env
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

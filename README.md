# RemoteSEA

**Nền tảng tuyển dụng remote cho khu vực Đông Nam Á, tích hợp trợ lý AI và phân tích CV thông minh.**

RemoteSEA kết nối ứng viên (Talent) với nhà tuyển dụng (Employer) cho các vị trí làm việc từ xa: đăng tin, ứng tuyển, phỏng vấn, đánh giá ứng viên, nhắn tin, thanh toán đăng tin, cùng các tính năng AI như phân tích CV, kiểm duyệt tin tự động và chatbot hỏi đáp có RAG.

> Đồ án tốt nghiệp — Trường Đại học Duy Tân. GVHD: Trần Thị Thanh Lan.
> Nhóm thực hiện: Võ Văn Thịnh, Văn Công Duy Hoàng, Nguyễn Xuân Tùng, Hồ Văn Thanh, Lê Tự Tuấn Sang.
> Thời gian: 10/09/2026 – 15/12/2026.

## Mục lục

1. [Kiến trúc tổng quan](#1-kiến-trúc-tổng-quan)
2. [Vai trò người dùng & tính năng](#2-vai-trò-người-dùng--tính-năng)
3. [Luồng nghiệp vụ chính](#3-luồng-nghiệp-vụ-chính)
4. [remotesea-web — Frontend](#4-remotesea-web--frontend)
5. [remotesea-api — Backend](#5-remotesea-api--backend)
6. [remotesea-ai — AI service](#6-remotesea-ai--ai-service)
7. [Mô hình dữ liệu](#7-mô-hình-dữ-liệu)
8. [Cài đặt & chạy local](#8-cài-đặt--chạy-local)
9. [Biến môi trường](#9-biến-môi-trường)
10. [Kiểm thử & chất lượng mã](#10-kiểm-thử--chất-lượng-mã)
11. [Triển khai](#11-triển-khai)
12. [Tài liệu dự án](#12-tài-liệu-dự-án)

---

## 1. Kiến trúc tổng quan

Hệ thống gồm 3 service độc lập :
```
┌──────────────────┐   REST + JWT        ┌──────────────────┐   HTTP + shared secret   ┌──────────────────┐
│  remotesea-web   │ ──────────────────▶ │  remotesea-api   │ ───────────────────────▶ │   remotesea-ai   │
│  React 19 + Vite │                     │  NestJS + Prisma │ ◀─────────────────────── │ FastAPI + Python │
│  :3001 (dev)     │                     │  :4000           │   gọi "tools" của API    │  :8000           │
└──────────────────┘                     └────────┬─────────┘                          └────────┬─────────┘
                                                  │                                             │
                              PostgreSQL (Prisma) │                   PostgreSQL: remotesea_ai  │
                     Stripe · S3 · Resend · OAuth │                   PostgreSQL: remotesea_rag │
                  Anthropic / Gemini (CV analysis)│     Qdrant · Ollama / Anthropic / Gemini /  │
                                                  │                   Cloudflare Workers AI     │
```

| Thư mục | Vai trò | Công nghệ chính |
| --- | --- | --- |
| [remotesea-web/](remotesea-web/) | Frontend SPA, không có server riêng | React 19, TypeScript, Vite, React Router 7, TanStack Query, react-hook-form + Zod, Tailwind CSS, i18n (vi/en), Sentry |
| [remotesea-api/](remotesea-api/) | Backend REST, nắm toàn bộ nghiệp vụ & phân quyền | NestJS 10, Prisma 5 (PostgreSQL), Passport/JWT, OAuth (Google, GitHub, LinkedIn), 2FA TOTP, Stripe, AWS S3, Resend, Swagger, Prometheus, Sentry |
| [remotesea-ai/](remotesea-ai/) | AI microservice: phân tích ứng viên, AI Orchestrator (chat), RAG, learning loop | FastAPI, SQLAlchemy async + Alembic, pgvector, Qdrant, Ollama (Qwen2.5-3B) / Anthropic / Gemini / Cloudflare |
| [docs/](docs/) | Tài liệu: proposal, project plan, backlog, CSDL, báo cáo test theo sprint | Markdown, HTML, PDF, XLSX |

**Nguyên tắc thiết kế**

- Web chỉ nói chuyện với API, không gọi trực tiếp AI service.
- `remotesea-ai` **không** truy cập CSDL của `remotesea-api`. Khi cần dữ liệu nghiệp vụ, AI service gọi các endpoint “tool” đã xác thực của API (`/ai-orchestrator/tools/*`), nên phân quyền luôn do API quyết định.
- AI service có CSDL riêng (lịch sử tương tác, feedback, dataset, model registry) và knowledge base RAG riêng.
- Mọi provider LLM đều nằm sau một interface chung, đổi model hoặc nhà cung cấp chỉ cần đổi biến môi trường.

---

## 2. Vai trò người dùng & tính năng

Ba vai trò (`UserRole`): `TALENT`, `EMPLOYER`, `ADMIN`. Trong một công ty, nhà tuyển dụng có thể mời thêm thành viên vào team (`CompanyMember`).

### Ứng viên (Talent)

- Đăng ký / đăng nhập bằng email, Google, GitHub, LinkedIn; liên kết nhiều tài khoản OAuth; bật 2FA (TOTP + QR)
- Quên / đặt lại mật khẩu, xác thực email, quản lý phiên đăng nhập, tạm ẩn tài khoản, xuất dữ liệu cá nhân, xoá tài khoản
- Hồ sơ: thông tin cá nhân, kỹ năng, kinh nghiệm làm việc, profile highlights, chế độ hiển thị, CV (upload lên S3)
- Dashboard cá nhân, lịch sử hoạt động, thống kê ai đã xem hồ sơ
- Tìm việc theo danh mục / kỹ năng / loại hình, lưu việc, tạo job alert (gửi email định kỳ)
- Ứng tuyển, theo dõi trạng thái, rút đơn, chấp nhận / từ chối offer
- Nhận lời mời ứng tuyển từ nhà tuyển dụng, xác nhận lịch phỏng vấn (tải file `.ics`), nhắn tin theo từng hồ sơ ứng tuyển
- Đánh giá nhà tuyển dụng sau quá trình tuyển dụng, báo cáo tin tuyển dụng có dấu hiệu lừa đảo
- Tra cứu mức lương theo vị trí, cấp bậc, quốc gia; nhận thông báo trong ứng dụng

### Nhà tuyển dụng (Employer)

- Hồ sơ công ty (trang công khai `/companies/:slug`), xác thực doanh nghiệp qua email
- Quản lý team: mời thành viên, phân quyền, gỡ thành viên
- Đăng tin tuyển dụng, chọn gói và thanh toán qua Stripe, đóng tin
- Pipeline ứng viên: đổi trạng thái từng hồ sơ hoặc hàng loạt, xuất danh sách ứng viên, xem phễu tuyển dụng (funnel analytics)
- Lên lịch / huỷ phỏng vấn, chấm điểm bằng scorecard, ghi chú nội bộ trên hồ sơ, nhắn tin với ứng viên
- **Phân tích CV bằng AI** cho từng hồ sơ ứng tuyển (có thể chạy lại)
- Tìm kiếm talent, gửi lời mời ứng tuyển
- **Trợ lý AI (chat)** hỏi đáp về ứng viên, tin tuyển dụng, phỏng vấn

### Quản trị viên (Admin)

- Duyệt / khoá nhà tuyển dụng, duyệt / từ chối tin tuyển dụng
- Xem cờ kiểm duyệt do AI chấm mức rủi ro (`LOW` / `MEDIUM` / `HIGH`) cho từng tin, có thể chấm lại
- Xử lý báo cáo tin tuyển dụng, quản lý người dùng
- Xem doanh thu, audit log thao tác quản trị

---

## 3. Luồng nghiệp vụ chính

### Vòng đời tin tuyển dụng (`JobStatus`)

```
DRAFT ──(thanh toán Stripe)──▶ PENDING_REVIEW ──(admin duyệt)──▶ ACTIVE ──▶ CLOSED
                                     │                              │
                                     └──(admin từ chối)──▶ REJECTED └──(hết hạn, cron)──▶ EXPIRED
```

Gói đăng tin (`PlanType`, thanh toán bằng USD qua Stripe Checkout):

| Gói | Giá | Thời gian hiển thị |
| --- | --- | --- |
| `STANDARD` — Standard listing | $150 | 30 ngày |
| `FEATURED` — Featured listing | $350 | 60 ngày |
| `HANDS_ON` — Hands-on hiring | $1,200 | Không giới hạn |

Thời gian hiển thị bắt đầu tính từ lúc tin được duyệt (`publishedAt`), không phải lúc thanh toán.

### Vòng đời hồ sơ ứng tuyển (`ApplicationStatus`)

```
PENDING → REVIEWING → SHORTLISTED → INTERVIEW → OFFERED → OFFER_ACCEPTED
                                                        └→ OFFER_DECLINED
(bất kỳ bước nào) → REJECTED  (do nhà tuyển dụng)
(bất kỳ bước nào) → WITHDRAWN (do ứng viên rút đơn)
```

Nhà tuyển dụng chỉ chuyển trạng thái theo bảng chuyển hợp lệ. Hai trạng thái `OFFER_ACCEPTED` / `OFFER_DECLINED` chỉ ứng viên mới đặt được. Mỗi lần chuyển trạng thái đều được ghi lại (`ApplicationStatusEvent`).

### Tác vụ định kỳ (cron)

Các endpoint cron được bảo vệ bằng `CRON_SECRET` và do một scheduler bên ngoài gọi:

| Endpoint | Việc làm |
| --- | --- |
| `GET /alerts/cron/dispatch` | Gửi email job alert |
| `GET /jobs/cron/expire` | Chuyển tin quá hạn sang `EXPIRED` |
| `GET /applications/cron/reminders` | Nhắc nhà tuyển dụng phản hồi các hồ sơ tồn đọng (SLA phản hồi) |
| `GET /billing/cron/reconcile` | Đối soát Stripe cho các tin đã thanh toán nhưng bị kẹt trạng thái |

---

## 4. remotesea-web — Frontend

SPA React 19 build bằng Vite, dữ liệu server quản lý bằng TanStack Query, form dùng react-hook-form + Zod. Giao diện hỗ trợ tiếng Việt và tiếng Anh (`src/i18n/locales/{vi,en}`).

### Các trang chính

| Nhóm | Đường dẫn |
| --- | --- |
| Công khai | `/`, `/jobs`, `/jobs/:id`, `/salary`, `/blog`, `/community`, `/companies/:slug`, `/talent/:slug` |
| Xác thực | `/login`, `/register`, `/forgot-password`, `/reset-password`, `/auth/callback` (OAuth), `/talent/verify`, `/employer/verify` |
| Ứng viên | `/talent`, `/profile`, `/saved`, `/alerts`, `/notifications`, `/settings`, `/applications/:id`, `/applications/:id/messages`, `/applications/:id/interview` |
| Nhà tuyển dụng | `/employer`, `/post-job`, `/post-job/success`, `/employer-dashboard`, `/employer-dashboard/talent`, `/employer-dashboard/team`, `/employer-dashboard/interviews`, `/employer-dashboard/applications/:id`, `/team/invitations/:token` |
| Quản trị | `/admin` |
| Nội bộ | `/sprints` — bảng theo dõi kiểm thử theo sprint |

Các route cần đăng nhập đi qua `ProtectedRoute`, còn các trang login/register đi qua `GuestOnlyRoute`. Page được lazy-load và prefetch trước khi người dùng chuyển trang.

### Tổ chức mã nguồn

```
src/
├── app/         # App.tsx, providers (QueryClient, Auth, i18n, ...)
├── core/        # http client, query, token, pagination, validation, xử lý lỗi
├── features/    # mỗi domain một thư mục: jobs, applications, employer, admin, ai-chat,
│                # cv-analysis, interviews, messages, billing, team, salary, ...
│                # thường gồm *.api.ts / *.queries.ts / components / pages
├── components/  # ui (primitive), shared, layout, domain, home, salary, community
├── router/      # AppRouter, ProtectedRoute, GuestOnlyRoute, route-prefetch
├── i18n/        # bản dịch vi / en
├── contexts/ hooks/ layouts/ pages/ services/ styles/ types/ utils/ constants/
```

### Cờ tính năng

- `VITE_ENABLE_AI_CHAT=true` hiện widget chat AI cho người dùng đã đăng nhập.
- `VITE_SPRINT_FOCUS` giới hạn những màn hình được mở theo sprint (`1`, `1,2`, `all`).
- `VITE_ENABLE_SPRINT_BOARD` / `VITE_VISIBLE_SPRINTS` điều khiển bảng `/sprints` trong bản build.

---

## 5. remotesea-api — Backend

Ứng dụng NestJS chia module theo domain. Mỗi module tách lớp rõ ràng:

- **Controller**: khai báo route, guard, parse request. Không truy cập Prisma.
- **Service**: nghiệp vụ, kiểm tra quyền, điều phối. Không đụng tới request/response HTTP.
- **Repository**: chỉ chứa truy vấn Prisma, bao gồm transaction nhiều bước.
- **dto/**: schema Zod, validate bằng `ZodValidationPipe`.

Lỗi trả về theo định dạng thống nhất `{ error: ... }` qua `GlobalExceptionFilter`. Phần hạ tầng dùng chung nằm trong `core/` (config validate bằng Zod, guard JWT / role, logger, observability, Swagger), còn `common/` chứa exception, phân quyền theo quyền sở hữu tài nguyên (ownership guard, company role), rate limit, email, cache, circuit breaker.

### Danh sách endpoint

Swagger đầy đủ: `http://localhost:4000/docs` (chỉ bật khi không ở môi trường production).

| Module | Endpoint |
| --- | --- |
| **auth** | `POST /auth/register`, `/login`, `/forgot-password`, `/reset-password`, `/oauth/exchange` · `GET /auth/session` · OAuth: `GET /auth/{google,github,linkedin}` + `/callback`, `GET /auth/:provider/link` · 2FA: `POST /auth/2fa/{setup,verify,disable,challenge}`, `GET /auth/2fa/status` |
| **users** | `PATCH/DELETE /users/me` · `POST /users/me/password` · `GET/PATCH /users/me/account`, `/notification-preferences` · `GET/POST /users/me/pause`, `POST /users/me/reactivate` · `GET /users/me/export` · `GET /users/me/connections`, `DELETE /users/me/connections/:provider` · `GET/DELETE /users/me/sessions[/:id]` |
| **talent** | `GET/PUT /talent/me` · `GET /talent/me/{dashboard,activity,profile-views}` · `POST /talent/verification[/confirm]` · `GET /talent` (tìm kiếm) · `GET /talent/:slug` · CRUD `/talent/me/experience`, `/talent/me/highlights` |
| **jobs** | `GET/POST /jobs` · `GET/PATCH /jobs/:id` · `PATCH /jobs/:id/close` · `POST /jobs/:id/report` |
| **applications** | `GET/POST /applications` · `GET /applications/{stats,ids}` · `GET /applications/:id` · `PATCH /applications/:id/{withdraw,offer-response}` · `GET/POST /applications/:id/messages` · `GET /applications/:id/interview[/ics]`, `PATCH /applications/:id/interview/confirm` |
| **employer** | `GET/POST/PATCH /employer/profile` · `GET /employer/dashboard`, `/employer/jobs`, `/employer/jobs/:id/applications[/export]`, `/employer/applications/recent`, `/employer/analytics/funnel`, `/employer/interviews/upcoming` · `PATCH /employer/applications/bulk`, `/employer/applications/:id` · tin nhắn, phỏng vấn (`.ics`, huỷ), scorecards, comments, AI CV analysis (`GET` + `POST .../regenerate`) theo `/employer/applications/:id/*` · `POST /employer/verification[/confirm]` · `GET /companies/:slug` |
| **team** | `GET /team/members`, `PATCH/DELETE /team/members/:id` · `GET/POST /team/invitations`, `POST /team/invitations/accept`, `GET /team/invitations/:token`, `DELETE /team/invitations/:id` |
| **invitations** | `GET/POST /invitations`, `PATCH /invitations/:id` (lời mời ứng tuyển) |
| **reviews** | `GET /reviews/eligibility/:applicationId` · `POST /reviews` · `GET /reviews/user/:userId` |
| **saved** | `GET /saved`, `GET /saved/ids`, `PUT/DELETE /saved/:jobId` |
| **alerts** | CRUD `/alerts` · `GET /alerts/cron/dispatch` |
| **notifications** | `GET /notifications`, `/notifications/unread-count` · `PATCH /notifications/:id/read`, `/notifications/read-all` |
| **salary** | `GET /salary/benchmarks[/by-seniority \| /by-country]` |
| **taxonomy** | `GET /categories`, `GET /skills` |
| **billing** | `POST /billing/checkout`, `POST /billing/webhook` (Stripe, raw body), `GET /billing/cron/reconcile` |
| **uploads** | `POST /uploads/presign` (URL ký sẵn để upload thẳng lên S3) |
| **admin** | `GET/PATCH /admin/{employers,jobs,users,reports}[/:id]` · `GET /admin/jobs/:id/moderation-flag`, `POST .../regenerate` · `GET /admin/revenue`, `/admin/audit-log` |
| **ai-orchestrator** | `GET /ai-orchestrator/health` · `POST/GET /ai-orchestrator/chat`, `GET /ai-orchestrator/chat/:id` · tool cho AI service: `GET /ai-orchestrator/tools/{applications/:id, applications/:id/candidate-analysis, applications/:id/interview, jobs/:id}` |
| **health / metrics** | `GET /health`, `GET /health/live` · `GET /metrics` (Prometheus, cần `METRICS_SECRET`) |

### Các tính năng AI chạy ngay trong API

- **`cv-analysis`**: trích xuất nội dung CV (PDF), gửi kèm tin tuyển dụng cho LLM (Anthropic hoặc Gemini, chọn bằng `AI_PROVIDER`), parse kết quả và lưu vào `CvAnalysis`.
- **`job-moderation`**: dùng cùng provider AI để chấm mức rủi ro cho tin tuyển dụng (`JobModerationFlag`) để hỗ trợ admin duyệt.
- **`ai-orchestrator`**: proxy chat từ web sang `remotesea-ai`. API ký context token bằng `AI_SERVICE_SECRET` và cung cấp các endpoint tool để AI service đọc dữ liệu trong phạm vi quyền của người dùng.

---

## 6. remotesea-ai — AI service

Service FastAPI viết theo Clean Architecture, phụ thuộc chỉ đi vào trong (`api` → `application` → `domain` ← `infrastructure`):

```
app/
├── api/             # router FastAPI (mỏng): health, inference, feedback, datasets, models, rag, orchestrator/*
├── application/     # use case: inference, feedback, dataset_builder, model_registry,
│                    # rag_ingestion, rag_retrieval, orchestrator, chat, tool_service
├── domain/          # logic thuần, không I/O: candidate_analysis, orchestrator
│                    # (grounding, leak guard, claim validation, escalation), dataset, rag
├── infrastructure/  # DB, client gọi remotesea-api, Qdrant, provider LLM & embedding
└── schemas/         # DTO Pydantic (camelCase)
```

### Endpoint

Tất cả endpoint `/v1/*` yêu cầu `Authorization: Bearer <AI_SERVICE_SECRET>`, riêng orchestrator dùng context token HS256 do API ký.

| Nhóm | Endpoint |
| --- | --- |
| Health | `GET /health`, `GET /v1/orchestrator/health` |
| Phân tích ứng viên | `POST /v1/inference` (`task: "CANDIDATE_ANALYSIS"`) → trả `score`, `recommendation`, `strengths`, `weaknesses`, `missingRequirements`, `reasoning` |
| Feedback | `POST /v1/feedback` — con người đánh giá `ACCEPT` / `EDIT` / `REJECT` |
| Dataset | `GET /v1/datasets`, `POST /v1/datasets/build` |
| Model registry | `GET/POST /v1/models`, `GET /v1/models/active`, `POST /v1/models/:id/{complete-training,evaluate,approve,rollback}` |
| RAG | `GET/POST /v1/rag/documents`, `DELETE /v1/rag/documents/:id`, `POST /v1/rag/search` |
| Orchestrator | `POST /v1/orchestrator/ask`, `POST/GET /v1/orchestrator/chat`, `GET /v1/orchestrator/chat/:id`, `/v1/orchestrator/tools/*` |

### Learning loop

```
CANDIDATE_ANALYSIS → AiInteraction (lưu input, output, model, latency)
   → Feedback của con người (Accept / Edit / Reject)
   → Dataset Builder → dataset-vN
   → Fine-tune QLoRA trên Google Colab (notebooks/qlora_training.ipynb)
   → Evaluate → Candidate model → Con người duyệt → Deploy lên Ollama (scripts/deploy_to_ollama.py)
```

Không có bước nào chạy tự động. Feedback không kích hoạt train, và model chỉ được dùng sau khi có người duyệt.

### AI Orchestrator & RAG

- Chọn tool cần gọi, lấy dữ liệu qua tool của `remotesea-api`, rồi kết hợp với kết quả truy xuất RAG (full-text trong Postgres và vector trong Qdrant).
- Trước khi trả lời có các bước kiểm tra: grounding, đối chiếu claim, chặn lộ dữ liệu ngoài quyền (leak guard) và chuyển sang trả lời an toàn khi độ tin cậy thấp.
- Lịch sử hội thoại lưu trong `ai_conversations` / `ai_conversation_turns`, có embedding pgvector để dẫn ngữ cảnh giữa các phiên.
- Chi tiết thiết kế: [remotesea-ai/docs/intelligent-rag.md](remotesea-ai/docs/intelligent-rag.md).

### CSDL

| Database | Bảng |
| --- | --- |
| `remotesea_ai` (Alembic: `alembic/`) | `ai_interactions`, `ai_feedback`, `ai_datasets`, `ai_models`, `ai_conversations`, `ai_conversation_turns` |
| `remotesea_rag` (Alembic: `alembic_rag/`) | `rag_documents`, `rag_chunks` (vector chunk nằm trong Qdrant) |

Provider LLM: `OLLAMA` (mặc định, chạy Qwen2.5-3B-Instruct trên CPU), `ANTHROPIC`, `GEMINI`, `CLOUDFLARE`, `MOCK` (dùng cho test). Embedding: `nomic-embed-text` (Ollama) hoặc BGE (Cloudflare), 768 chiều.

---

## 7. Mô hình dữ liệu

Schema Prisma ([remotesea-api/prisma/schema.prisma](remotesea-api/prisma/schema.prisma)) có khoảng 36 model, chia theo nhóm:

| Nhóm | Model |
| --- | --- |
| Tài khoản & xác thực | `User`, `Account`, `Session`, `VerificationToken`, `NotificationPreference`, `Notification` |
| Ứng viên | `TalentProfile`, `TalentEmailVerification`, `TalentSkill`, `WorkExperience`, `ProfileHighlight`, `ProfileView` |
| Nhà tuyển dụng | `EmployerProfile`, `EmployerEmailVerification`, `CompanyMember`, `TeamInvitation` |
| Tin tuyển dụng | `Job`, `Category`, `JobCategory`, `Skill`, `JobSkill`, `JobReport`, `JobModerationFlag`, `SavedJob`, `JobAlert`, `AlertCategory` |
| Tuyển dụng | `Application`, `ApplicationStatusEvent`, `ApplicationComment`, `Message`, `Interview`, `InterviewScorecard`, `JobInvitation`, `Review`, `CvAnalysis` |
| Quản trị | `AdminAuditLog` |

Tài liệu CSDL chi tiết (ERD, mô tả từng bảng): [docs/PROJECT_DATABASE_DOCUMENTATION.md](docs/PROJECT_DATABASE_DOCUMENTATION.md).

---

## 8. Cài đặt & chạy local

### Yêu cầu

- Node.js 22+ và npm
- Python 3.11
- Docker & Docker Compose (PostgreSQL local)
- [Ollama](https://ollama.com/download) cài trực tiếp trên máy, nếu AI service dùng model self-host
- Tuỳ chọn: tài khoản Stripe, S3-compatible storage, Resend, Qdrant Cloud, Sentry, OAuth app

Khởi động theo thứ tự **API → AI → Web**. Mỗi service đọc file `.env` riêng, tạo từ `.env.example` tương ứng.

### 8.1. Backend — `remotesea-api` (cổng 4000)

```bash
cd remotesea-api
cp .env.example .env        # điền DATABASE_URL, AUTH_SECRET, ...
npm install                 # postinstall tự chạy prisma generate
npm run db:deploy           # áp dụng migrations
npm run db:seed             # (tuỳ chọn) dữ liệu mẫu
npm run start:dev           # http://localhost:4000
```

Muốn chạy cả Postgres, migrate và app bằng Docker thì dùng `npm run docker:up` / `npm run docker:down` (đọc `.env.docker`).

### 8.2. AI service — `remotesea-ai` (cổng 8000)

```bash
cd remotesea-ai
python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env        # AI_SERVICE_SECRET phải trùng với remotesea-api

docker compose up -d postgres                   # Postgres + pgvector ở cổng 5434
alembic upgrade head                            # DB remotesea_ai
docker exec -i $(docker compose ps -q postgres) \
  psql -U ai_service -d postgres -c "CREATE DATABASE remotesea_rag;"
alembic -c alembic_rag.ini upgrade head         # DB remotesea_rag

ollama serve &
ollama pull qwen2.5:3b-instruct                 # hoặc model đặt trong AI_MODEL
ollama pull nomic-embed-text                    # embedding cho RAG

uvicorn app.main:app --reload                   # http://localhost:8000
```

Không có Ollama thì có thể đặt `AI_MODEL_PROVIDER=MOCK` để chạy thử luồng mà không cần model thật.

### 8.3. Frontend — `remotesea-web` (cổng 3001)

```bash
cd remotesea-web
cp .env.example .env        # VITE_API_URL=http://localhost:4000
npm install
npm run dev                 # http://localhost:3001
```

---

## 9. Biến môi trường

Danh sách đầy đủ kèm giải thích nằm trong `.env.example` của từng service. **Không commit file `.env`.**

### remotesea-api

| Biến | Bắt buộc | Mô tả |
| --- | --- | --- |
| `DATABASE_URL` | ✔ | PostgreSQL cho Prisma |
| `AUTH_SECRET`, `JWT_EXPIRES_IN` | ✔ | Ký JWT |
| `FRONTEND_URL`, `ADDITIONAL_CORS_ORIGINS` | ✔ | CORS và link trong email |
| `AUTH_GOOGLE_*`, `AUTH_GITHUB_*`, `AUTH_LINKEDIN_*` | | OAuth; bỏ trống thì route tương ứng không được đăng ký |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | | Thanh toán đăng tin |
| `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_ENDPOINT`, `CDN_URL` | | Upload avatar, logo, CV |
| `RESEND_API_KEY`, `EMAIL_FROM` | | Email giao dịch |
| `CRON_SECRET` | | Bảo vệ các endpoint cron |
| `AI_PROVIDER`, `ANTHROPIC_API_KEY` / `GEMINI_API_KEY` | | Phân tích CV và kiểm duyệt tin trong API |
| `AI_SERVICE_URL`, `AI_SERVICE_SECRET` | | Kết nối tới `remotesea-ai` |
| `SENTRY_DSN`, `METRICS_SECRET` | | Theo dõi lỗi và bảo vệ `/metrics` |

### remotesea-ai

| Biến | Mô tả |
| --- | --- |
| `DATABASE_URL`, `RAG_DATABASE_URL` | Hai CSDL riêng của AI service |
| `AI_SERVICE_SECRET` | **Phải trùng** với giá trị bên `remotesea-api` |
| `AI_MODEL_PROVIDER`, `AI_MODEL`, `AI_TEMPERATURE` | Chọn provider và model LLM |
| `OLLAMA_BASE_URL`, `OLLAMA_MODEL` | Khi dùng Ollama |
| `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` | Khi dùng provider cloud |
| `EMBEDDING_PROVIDER`, `OLLAMA_EMBEDDING_MODEL`, `EMBEDDING_DIMENSIONS` | Embedding cho RAG |
| `QDRANT_URL`, `QDRANT_API_KEY`, `QDRANT_COLLECTION_NAME` | Vector store |
| `REMOTESEA_API_BASE_URL` | URL để AI gọi tool ngược về API |

### remotesea-web

| Biến | Mô tả |
| --- | --- |
| `VITE_API_URL` | **Bắt buộc**, build lỗi nếu thiếu |
| `VITE_SENTRY_DSN`, `VITE_GA_MEASUREMENT_ID` | Sentry và Google Analytics (tuỳ chọn) |
| `VITE_ENABLE_AI_CHAT` | Hiện widget chat AI |
| `VITE_SPRINT_FOCUS`, `VITE_ENABLE_SPRINT_BOARD`, `VITE_VISIBLE_SPRINTS` | Giới hạn màn hình theo sprint và bảng `/sprints` |

---

## 10. Kiểm thử & chất lượng mã

| Service | Lệnh |
| --- | --- |
| api | `npm test` (Jest unit, file `*.spec.ts` trong `src/`), `npm run test:cov`, `npm run lint`, `npm run format:check`, `npm run depcruise` |
| web | `npm test` (Vitest), `npm run test:e2e` (Playwright: apply-to-hire, checkout-to-job-live, i18n), `npm run lint`, `npm run type-check`, `npm run size` |
| ai | `pytest` |

- CI (GitHub Actions) nằm ở `.github/workflows/ci.yml` của `remotesea-api` và `remotesea-web`.
- `dependency-cruiser` được dùng để giữ ranh giới giữa các lớp và module.
- Kế hoạch kiểm thử, báo cáo theo sprint và ảnh minh chứng có trong [docs/](docs/) (`SPRINT{1,2,3}_TEST_REPORT.md`, `sprint*-evidence/`).

---

## 11. Triển khai

Cả ba service đều có `Dockerfile` multi-stage và cấu hình [Fly.io](https://fly.io) (`fly.toml`):

| App Fly.io | Image | Cổng nội bộ | Ghi chú |
| --- | --- | --- | --- |
| `remotesea-web` | Build Vite trên `node:22-alpine` → phục vụ bằng `nginx:1.27-alpine` | 80 | Có workflow `fly-deploy.yml` để deploy tự động |
| `remotesea-api` | `node:22-alpine` | 4000 | Healthcheck `GET /health`; cần chạy `npm run db:deploy` (prisma migrate deploy) lên DB production trước khi deploy bản có migration mới |
| `remotesea-ai` | `python:3.11-slim` + uvicorn | 8000 | Trên production nên dùng provider cloud (Cloudflare / Anthropic / Gemini) nếu không tự host Ollama |

---

## 12. Tài liệu dự án

| Tài liệu | Nội dung |
| --- | --- |
| [docs/PROPOSAL.md](docs/PROPOSAL.md) | Đề xuất dự án |
| [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md) | Kế hoạch dự án, phân công, mốc thời gian |
| [docs/PRODUCT_BACKLOG_OFFICIAL.md](docs/PRODUCT_BACKLOG_OFFICIAL.md) | Product backlog và user stories |
| [docs/GUEST_USER_STORIES.md](docs/GUEST_USER_STORIES.md) | User stories cho khách chưa đăng nhập |
| [docs/PROJECT_DATABASE_DOCUMENTATION.md](docs/PROJECT_DATABASE_DOCUMENTATION.md), [docs/DATABASE_SCHEMA_ANALYSIS.md](docs/DATABASE_SCHEMA_ANALYSIS.md) | Thiết kế CSDL |
| [docs/SPRINT1_TEST_REPORT.md](docs/SPRINT1_TEST_REPORT.md), [docs/SPRINT2_TEST_REPORT.md](docs/SPRINT2_TEST_REPORT.md), [docs/SPRINT3_TEST_REPORT.md](docs/SPRINT3_TEST_REPORT.md) | Báo cáo kiểm thử theo sprint |
| [remotesea-web/README.md](remotesea-web/README.md) · [remotesea-api/README.md](remotesea-api/README.md) · [remotesea-ai/README.md](remotesea-ai/README.md) | README chi tiết của từng service |

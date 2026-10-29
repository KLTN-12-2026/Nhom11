# Cơ sở dữ liệu — RemoteSEA

Tài liệu mô tả **schema hiện có trong code** của cả ba service. Nguồn sự thật:

| Service | Nguồn schema | Công cụ migrate |
| --- | --- | --- |
| `remotesea-api` | [remotesea-api/prisma/schema.prisma](../remotesea-api/prisma/schema.prisma) | Prisma Migrate ([prisma/migrations/](../remotesea-api/prisma/migrations/)) |
| `remotesea-ai` — DB chính | [remotesea-ai/app/infrastructure/models/](../remotesea-ai/app/infrastructure/models/) | Alembic ([alembic/](../remotesea-ai/alembic/)) |
| `remotesea-ai` — DB RAG | `rag_document.py`, `rag_chunk.py` trong cùng thư mục | Alembic ([alembic_rag/](../remotesea-ai/alembic_rag/), `alembic_rag.ini`) |

> **Lưu ý:** README gốc liệt kê ~36 model (Interview, Message, CvAnalysis, CompanyMember, AdminAuditLog, ...). Các model đó **chưa có** trong `schema.prisma` hiện tại — schema thực tế có **15 model**. Khi thêm model mới, cập nhật lại tài liệu này.

---

## 1. Tổng quan

```
┌──────────────────────────┐     ┌──────────────────────────┐     ┌──────────────────────────┐
│ PostgreSQL 16            │     │ PostgreSQL 16 + pgvector │     │ PostgreSQL 16            │
│ remotesea_dev / prod     │     │ remotesea_ai             │     │ remotesea_rag            │
│ (Prisma, remotesea-api)  │     │ (Alembic, remotesea-ai)  │     │ (Alembic, remotesea-ai)  │
│ 15 bảng nghiệp vụ        │     │ 6 bảng: AI log, feedback,│     │ rag_documents,           │
│                          │     │ dataset, model, chat     │     │ rag_chunks               │
└──────────────────────────┘     └──────────────────────────┘     └────────────┬─────────────┘
                                                                               │ chunk id
                                                                  ┌────────────▼─────────────┐
                                                                  │ Qdrant (vector, cosine,  │
                                                                  │ 768 chiều)               │
                                                                  └──────────────────────────┘
```

- Ba database **tách biệt hoàn toàn**, không có foreign key liên DB. `remotesea-ai` lưu `user_id`, `application_id` dưới dạng chuỗi tham chiếu sang `remotesea-api`, không có ràng buộc toàn vẹn.
- `remotesea-ai` không bao giờ đọc DB của `remotesea-api`; dữ liệu nghiệp vụ lấy qua HTTP tool endpoint.

---

## 2. Database `remotesea-api` (Prisma)

### 2.1. Quy ước

- Khoá chính: `String @default(cuid())`; bảng nối dùng khoá chính kép.
- Tên bảng `snake_case` số nhiều qua `@@map`, tên cột giữ `camelCase` (trừ các cột OAuth `refresh_token`, `access_token`, ... theo chuẩn Auth.js).
- Thời gian: `TIMESTAMP(3)` không múi giờ, `createdAt @default(now())`, `updatedAt @updatedAt`.
- Tiền: số nguyên (`Int`), kèm cột `currency` mặc định `"USD"`.
- Mọi quan hệ đều `ON DELETE CASCADE` — xoá `User` sẽ xoá dây chuyền toàn bộ dữ liệu liên quan (xem [mục 2.5](#25-hành-vi-xoá-cascade)).

### 2.2. ERD

```mermaid
erDiagram
    users ||--o{ accounts : "OAuth"
    users ||--o{ sessions : ""
    users ||--o| talent_profiles : ""
    users ||--o| employer_profiles : ""
    users ||--o{ job_alerts : ""
    users ||--o{ saved_jobs : ""

    talent_profiles ||--o{ talent_skills : ""
    skills ||--o{ talent_skills : ""
    talent_profiles ||--o{ applications : "ứng tuyển"

    employer_profiles ||--o{ jobs : "đăng"
    jobs ||--o{ job_skills : ""
    skills ||--o{ job_skills : ""
    jobs ||--o{ job_categories : ""
    categories ||--o{ job_categories : ""
    jobs ||--o{ applications : ""
    jobs ||--o{ saved_jobs : ""

    job_alerts ||--o{ alert_categories : ""
    categories ||--o{ alert_categories : ""
```

`verification_tokens` đứng độc lập (liên kết với user qua `identifier` = email, không có FK).

### 2.3. Enum

| Enum | Giá trị |
| --- | --- |
| `UserRole` | `TALENT`, `EMPLOYER`, `ADMIN` |
| `JobType` | `FULL_TIME`, `PART_TIME`, `CONTRACT`, `FREELANCE` |
| `ExperienceLevel` | `ENTRY`, `MID`, `SENIOR`, `LEAD`, `EXECUTIVE` |
| `ApplicationStatus` | `PENDING`, `REVIEWING`, `SHORTLISTED`, `INTERVIEW`, `OFFERED`, `REJECTED`, `WITHDRAWN` |
| `JobStatus` | `DRAFT`, `PENDING_REVIEW`, `ACTIVE`, `CLOSED`, `REJECTED` |
| `PlanType` | `STANDARD`, `FEATURED`, `HANDS_ON` |
| `AlertFrequency` | `IMMEDIATE`, `DAILY`, `WEEKLY` |

Bảng chuyển trạng thái hợp lệ của `ApplicationStatus` (nhà tuyển dụng) nằm ở [employer/constants.ts](../remotesea-api/src/modules/employer/constants.ts), không được ràng buộc ở tầng DB:

```
PENDING → REVIEWING → SHORTLISTED → INTERVIEW → OFFERED
   └──────────┴────────────┴────────────┴──────────┴──→ REJECTED
```

### 2.4. Chi tiết bảng

#### Tài khoản & xác thực

**`users`** — tài khoản gốc cho mọi vai trò.

| Cột | Kiểu | Ràng buộc | Ghi chú |
| --- | --- | --- | --- |
| `id` | text | PK | cuid |
| `email` | text | UNIQUE, NOT NULL | Khoá đăng nhập, cũng là khoá ghép tài khoản OAuth |
| `emailVerified` | timestamp | | Hiện chưa có luồng nào ghi cột này |
| `passwordHash` | text | | bcrypt (cost 12). `NULL` với tài khoản chỉ đăng nhập OAuth |
| `name`, `image` | text | | |
| `role` | `UserRole` | default `TALENT` | API chỉ cho đăng ký `TALENT`/`EMPLOYER`; `ADMIN` phải set tay trong DB |
| `createdAt`, `updatedAt` | timestamp | | |

**`accounts`** — liên kết OAuth (Google, GitHub). UNIQUE `(provider, providerAccountId)`. Các cột token (`access_token`, `refresh_token`, `id_token`, ...) có trong schema nhưng code hiện **không lưu** token của provider.

**`sessions`** — kế thừa từ schema Auth.js, **không được dùng** (API dùng JWT stateless). UNIQUE `sessionToken`.

**`verification_tokens`** — token đặt lại mật khẩu.

| Cột | Ghi chú |
| --- | --- |
| `identifier` | Email người dùng |
| `token` | UNIQUE. 32 byte ngẫu nhiên dạng hex, lưu **nguyên văn** |
| `expires` | `now + 1h` |

Token bị xoá khi đặt lại mật khẩu thành công (trong cùng transaction với việc cập nhật `passwordHash`). Token hết hạn không bị dọn tự động.

#### Ứng viên

**`talent_profiles`** — 1–1 với `users` (`userId` UNIQUE). Tạo tự động khi đăng ký vai trò `TALENT`.

| Cột | Ghi chú |
| --- | --- |
| `slug` | UNIQUE, dùng cho URL công khai `/talent/:slug` |
| `headline`, `bio`, `location`, `country`, `timezone` | |
| `yearsExperience`, `level` | `level` default `MID` |
| `resumeUrl`, `portfolioUrl`, `githubUrl`, `linkedinUrl` | `resumeUrl` trỏ tới object S3/CDN |
| `isOpenToWork` | default `true`. Khi `false`, API ẩn mức lương mong muốn trên hồ sơ công khai |
| `desiredSalaryMin`, `desiredSalaryMax`, `currency` | |

**`skills`** — danh mục kỹ năng dùng chung. UNIQUE `name`, UNIQUE `slug`.

**`talent_skills`** — N–N ứng viên ↔ kỹ năng. PK `(talentId, skillId)`, thêm `yearsExp`.

#### Nhà tuyển dụng

**`employer_profiles`** — 1–1 với `users` (`userId` UNIQUE).

| Cột | Ghi chú |
| --- | --- |
| `companyName`, `slug` | `slug` UNIQUE; trùng thì thêm hậu tố `nanoid(6)` |
| `logoUrl`, `websiteUrl`, `description`, `industry`, `size`, `founded`, `hqCountry`, `hqCity` | |
| `isVerified` | default `false`, admin bật/tắt |

#### Tin tuyển dụng

**`jobs`**

| Nhóm cột | Cột | Ghi chú |
| --- | --- | --- |
| Định danh | `id`, `employerId` (FK), `slug` (UNIQUE) | |
| Nội dung | `title`, `description`, `requirements`, `responsibilities`, `benefits text[]` | |
| Phân loại | `jobType`, `level`, `isRemote`, `timezone`, `country` | |
| Lương | `salaryMin`, `salaryMax`, `currency` | API kiểm tra `salaryMax ≥ salaryMin` khi tạo |
| Trạng thái | `status` (default `DRAFT`), `reviewNote` | `reviewNote` là ghi chú khi admin từ chối |
| Thanh toán | `planType`, `planPaid`, `paidAt`, `stripeSessionId` | Set bởi Stripe webhook `checkout.session.completed` |
| Hiển thị | `isFeatured`, `publishedAt`, `expiresAt` | |
| Thống kê | `viewCount`, `applyCount`, `vnHireCount` | `viewCount` tăng mỗi lần xem chi tiết |
| Khác | `applicationUrl`, `createdAt`, `updatedAt` | |

Index: `(status, publishedAt)` cho trang danh sách tin đang mở, `(employerId)` cho dashboard nhà tuyển dụng.

**`categories`** — UNIQUE `name`, UNIQUE `slug`, `icon`.

**`job_categories`**, **`job_skills`** — bảng nối; `job_skills.isRequired` default `true`.

#### Ứng tuyển

**`applications`**

| Cột | Ghi chú |
| --- | --- |
| `jobId`, `talentId` | FK; **UNIQUE `(jobId, talentId)`** — mỗi ứng viên chỉ nộp một lần cho một tin |
| `coverLetter`, `resumeUrl` | `resumeUrl` có thể khác CV trên hồ sơ |
| `status` | default `PENDING` |
| `notes` | Ghi chú nội bộ của nhà tuyển dụng |
| `appliedAt`, `updatedAt` | Dùng để tính thời gian tuyển trung bình trên dashboard |

Index: `(talentId)`, `(jobId)`.

#### Lưu tin & Job alert

**`saved_jobs`** — PK `(userId, jobId)`, index `(userId)`.

**`job_alerts`** — tiêu chí lọc (`keywords`, `jobType`, `level`, `salaryMin`, `country`, `timezone`), `frequency`, `isActive`, `lastSentAt`. Index `(userId)`. Cron `GET /alerts/cron/dispatch` đọc bảng này để gửi email.

**`alert_categories`** — N–N alert ↔ category.

### 2.5. Hành vi xoá (cascade)

Mọi FK đều `ON DELETE CASCADE ON UPDATE CASCADE`. Hệ quả cần biết:

| Xoá | Kéo theo |
| --- | --- |
| `users` | accounts, sessions, talent/employer profile, job_alerts, saved_jobs → và tiếp tục cascade bên dưới |
| `employer_profiles` | **toàn bộ jobs** của công ty → applications của các tin đó, saved_jobs trỏ tới các tin đó |
| `talent_profiles` | applications của ứng viên |
| `categories` / `skills` | các dòng nối tương ứng (tin vẫn còn, chỉ mất nhãn) |

`DELETE /users/me` xoá cứng. Một nhà tuyển dụng xoá tài khoản sẽ làm mất lịch sử ứng tuyển của ứng viên, kể cả tin đã thanh toán — cân nhắc soft delete nếu cần giữ dữ liệu đối soát doanh thu.

### 2.6. Lịch sử migration

| Migration | Nội dung |
| --- | --- |
| `20260617172548_backend_plan_job_status_talent_slug` | Khởi tạo: 7 enum, 14 bảng, index và FK |
| `20260617180958_add_saved_jobs` | Thêm `saved_jobs` |
| `20260706045000_add_job_paid_at` | Thêm `jobs.paidAt` |

### 2.7. Vận hành

```bash
cd remotesea-api
npm run db:migrate     # dev: tạo migration mới từ schema.prisma (prisma migrate dev)
npm run db:deploy      # prod/CI: áp dụng migration (prisma migrate deploy)
npm run db:generate    # sinh lại Prisma Client
```

- Docker local: `postgres:16-alpine`, mặc định `postgresql://remotesea:remotesea_password@postgres:5432/remotesea_dev` (chỉ dùng cho dev).
- Production: chạy `npm run db:deploy` **trước** khi deploy bản có migration mới.
- Script `db:seed` trỏ tới `prisma/seed.ts`, file này hiện chưa có trong repo.

---

## 3. Database `remotesea_ai` (Alembic)

Postgres 16 có extension `pgvector` (image `pgvector/pgvector:pg16`, cổng host `5434`). Khoá chính là UUID dạng chuỗi; thời gian là `timestamptz` (UTC).

```mermaid
erDiagram
    ai_interactions ||--o{ ai_feedback : "được đánh giá"
    ai_conversations ||--o{ ai_conversation_turns : ""
    ai_datasets
    ai_models
```

| Bảng | Mục đích | Cột chính |
| --- | --- | --- |
| `ai_interactions` | Log mỗi lần gọi LLM | `task` (`ai_task`: `CANDIDATE_ANALYSIS`, `JOB_MATCHING`, `INTERVIEW_ANALYSIS`, `SCORECARD_ANALYSIS`, `INTERVIEW_QUESTION_GENERATION`, `KNOWLEDGE_ASSISTANT`), `user_id`, `application_id`, `input` JSON, `retrieved_context` JSON, `output` JSON, `model_version`, `latency_ms`, `status` (`SUCCESS`/`FAILED`), `error` |
| `ai_feedback` | Đánh giá của con người cho một interaction | `interaction_id` FK → `ai_interactions` (CASCADE), `user_id`, `action` (`ACCEPT`/`EDIT`/`REJECT`), `corrected_output` JSON, `reason`, `quality_status` (`PENDING`/`APPROVED`/`REJECTED`) |
| `ai_datasets` | Phiên bản dataset sinh từ feedback | `task`, `version` (UNIQUE `(task, version)`), `status` (`READY`/`FAILED`), số mẫu train/validation/test, đường dẫn file, `build_summary` JSON |
| `ai_models` | Model registry | `task`, `version` (UNIQUE `(task, version)`), `name`, `base_model`, `dataset_version`, `artifact_path`, `metrics` JSON, `status` (`TRAINING`→`EVALUATING`→`CANDIDATE`→`ACTIVE`/`REJECTED`→`ARCHIVED`), `deployed_at` |
| `ai_conversations` | Phiên chat của AI Orchestrator | `user_id` (index), `title`, `created_at`, `updated_at` |
| `ai_conversation_turns` | Từng lượt hỏi–đáp | `conversation_id` FK (CASCADE, index), `application_id`, `question`, `answer`, `confidence`, `sources` JSON, `embedding vector(768)` |

- `ai_conversation_turns.embedding` dùng để tìm các lượt hỏi liên quan **của cùng một user** (truy vấn luôn lọc theo `user_id`).
- `ai_interactions.input`/`output` chứa nội dung CV và đánh giá ứng viên → là dữ liệu cá nhân, xem [SECURITY.md](SECURITY.md#5-dữ-liệu-cá-nhân).

```bash
cd remotesea-ai
alembic upgrade head                       # remotesea_ai
alembic -c alembic_rag.ini upgrade head    # remotesea_rag
```

---

## 4. Database `remotesea_rag` + Qdrant

| Bảng | Cột |
| --- | --- |
| `rag_documents` | `id`, `title`, `source`, `content` (toàn văn), `created_at`, `updated_at` |
| `rag_chunks` | `id`, `document_id` FK → `rag_documents` (CASCADE), `chunk_index`, `content`, `created_at` |

- Vector của chunk **không** nằm trong Postgres (cột `embedding` đã bị xoá ở migration `626fbd16b03e`) mà nằm trong Qdrant: collection `QDRANT_COLLECTION_NAME`, kích thước `EMBEDDING_DIMENSIONS` (768), khoảng cách cosine, point id = `rag_chunks.id`.
- Truy xuất là hybrid: full-text Postgres (`to_tsvector('english', content) @@ plainto_tsquery(...)`, xếp theo `ts_rank`) + vector Qdrant, sau đó gộp kết quả.
- Xoá document phải xoá cả point trong Qdrant; FK chỉ cascade phía Postgres.

---

## 5. Điểm cần cải thiện

| # | Vấn đề | Đề xuất |
| --- | --- | --- |
| 1 | Tìm kiếm tin dùng `ILIKE '%q%'` trên `title`/`description` → full scan khi dữ liệu lớn | Thêm index `pg_trgm` (GIN) hoặc cột `tsvector` |
| 2 | Không có index trên `applications.status`, `saved_jobs.jobId`, `jobs.expiresAt` | Thêm khi bật lọc theo trạng thái / cron hết hạn |
| 3 | Full-text RAG tính `to_tsvector` trực tiếp mỗi truy vấn, không có index | Thêm GIN index trên `to_tsvector('english', content)` |
| 4 | `verification_tokens` lưu token nguyên văn, không dọn token hết hạn | Lưu SHA-256 của token; cron dọn bản ghi hết hạn |
| 5 | `sessions` và các cột token trong `accounts` không được dùng | Xoá, hoặc dùng `sessions` cho cơ chế thu hồi JWT |
| 6 | `JobStatus` thiếu `EXPIRED` dù README mô tả cron hết hạn tin | Thêm giá trị enum qua migration khi làm tính năng |
| 7 | Cascade xoá cứng làm mất dữ liệu thanh toán | Soft delete (`deletedAt`) cho `users`, `employer_profiles`, `jobs` |
| 8 | Cột `jobs.applyCount`, `viewCount` cập nhật không đồng bộ, có thể lệch | Chấp nhận như số liệu gần đúng, hoặc tính lại định kỳ |

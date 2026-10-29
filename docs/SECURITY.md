# Bảo mật — RemoteSEA

Tài liệu mô tả mô hình bảo mật **đang có trong code**, các rủi ro đã biết và checklist khi triển khai. Phạm vi: `remotesea-web`, `remotesea-api`, `remotesea-ai`.

## Báo cáo lỗ hổng

Nếu phát hiện lỗ hổng, **không** mở issue công khai. Gửi mô tả, bước tái hiện và mức ảnh hưởng trực tiếp cho nhóm phát triển (Nhóm 11). Nhóm sẽ phản hồi trong vòng 3 ngày làm việc.

---

## 1. Ranh giới tin cậy

```
Trình duyệt ──JWT (Bearer)──▶ remotesea-api ──AI_SERVICE_SECRET / context JWT──▶ remotesea-ai
                                   │                                                │
                       Stripe webhook (chữ ký)                       gọi tool ngược về API
                       Scheduler cron (CRON_SECRET)                  bằng chính context JWT
                       S3 (presigned URL)
```

| Thành phần | Tin cậy | Ghi chú |
| --- | --- | --- |
| `remotesea-web` | **Không** | Mọi kiểm tra ở frontend (route guard, ẩn nút) chỉ là UX. Phân quyền thực sự nằm ở API |
| `remotesea-api` | Có | Nơi duy nhất quyết định xác thực, phân quyền, quyền sở hữu tài nguyên |
| `remotesea-ai` | Một phần | Chỉ nhận request từ API (shared secret). Không truy cập DB của API; dữ liệu nghiệp vụ lấy qua tool endpoint, nên API vẫn là nơi phân quyền |
| Stripe, S3, Resend, OAuth provider | Bên thứ ba | Xác thực bằng chữ ký / khoá API |

---

## 2. Xác thực (authentication)

### 2.1. Email + mật khẩu

- Mật khẩu băm bằng **bcrypt, cost 12** ([bcrypt.constants.ts](../remotesea-api/src/common/constants/bcrypt.constants.ts)). Không lưu mật khẩu gốc.
- Độ dài tối thiểu 8 ký tự (Zod).
- Đăng nhập sai trả về cùng một thông báo `Invalid email or password` cho cả "email không tồn tại" và "sai mật khẩu".
- Đăng ký chỉ cho phép `role ∈ {TALENT, EMPLOYER}`; tài khoản `ADMIN` không thể tự tạo qua API.

### 2.2. JWT

| Thuộc tính | Giá trị |
| --- | --- |
| Thuật toán | HS256, khoá `AUTH_SECRET` |
| Payload | `sub` (user id), `email`, `name`, `role` |
| Thời hạn | `JWT_EXPIRES_IN`, mặc định **30 ngày** |
| Truyền | Header `Authorization: Bearer <token>` |
| Lưu phía web | `localStorage` ("Ghi nhớ đăng nhập") hoặc `sessionStorage` ([token-storage.ts](../remotesea-web/src/services/token-storage.ts)) |

JWT là stateless: **không có cơ chế thu hồi**. Đổi mật khẩu, xoá tài khoản hay đổi `role` trong DB không làm token cũ mất hiệu lực cho tới khi hết hạn. `role` trong token được tin trực tiếp mà không đọc lại từ DB.

### 2.3. OAuth (Google, GitHub)

- Strategy chỉ được đăng ký khi có đủ `AUTH_*_ID` và `AUTH_*_SECRET`.
- Callback tạo JWT rồi redirect về `FRONTEND_URL/auth/callback?token=<jwt>`.
- Nếu email từ provider trùng với user đã có, tài khoản OAuth được **tự động liên kết** vào user đó.

### 2.4. Quên / đặt lại mật khẩu

- Token 32 byte ngẫu nhiên (`crypto.randomBytes`), hạn 1 giờ, dùng một lần (xoá trong cùng transaction với việc đổi mật khẩu).
- `POST /auth/forgot-password` luôn trả cùng một thông báo, không tiết lộ email có tồn tại hay không.

---

## 3. Phân quyền (authorization)

| Cơ chế | Vị trí | Dùng cho |
| --- | --- | --- |
| `JwtAuthGuard` | [core/guards/jwt-auth.guard.ts](../remotesea-api/src/core/guards/jwt-auth.guard.ts) | Mọi route cần đăng nhập |
| `RolesGuard` + `@Roles(...)` | [core/guards/roles.guard.ts](../remotesea-api/src/core/guards/roles.guard.ts) | `/admin/*` (`ADMIN`), một số route `/employer/*` (`EMPLOYER`) |
| Kiểm tra sở hữu trong service | `*.service.ts` | So `resource.employer.userId === user.id` trước khi đọc/ghi |
| `CronSecretGuard` | [alerts/guards/cron-secret.guard.ts](../remotesea-api/src/modules/alerts/guards/cron-secret.guard.ts) | Endpoint cron |

Các điểm kiểm tra sở hữu quan trọng:

| Hành động | Điều kiện |
| --- | --- |
| Sửa tin (`PATCH /jobs/:id`) | Admin, hoặc chủ tin **và** tin đang `DRAFT`/`REJECTED` |
| Xem ứng viên của tin (`GET /employer/jobs/:id/applications`) | Chủ tin |
| Đổi trạng thái hồ sơ (`PATCH /employer/applications/:id`) | Chủ tin + chuyển trạng thái hợp lệ theo `ALLOWED_TRANSITIONS` |
| Thanh toán (`POST /billing/checkout`) | Chủ tin + tin `DRAFT` chưa thanh toán. Tin không thuộc user trả 404 (không lộ sự tồn tại) |
| Alert, saved job, hồ sơ cá nhân | Luôn truy vấn theo `user.id` lấy từ JWT, không nhận user id từ body |

**Quy tắc khi thêm endpoint mới:** user id **luôn** lấy từ `@CurrentUser()`, không bao giờ từ body/query. Endpoint thao tác trên tài nguyên theo `:id` phải kiểm tra sở hữu trong service.

---

## 4. Kiểm tra đầu vào & xử lý lỗi

- Mọi body/query đi qua `ZodValidationPipe` với schema trong `dto/`. Trường lạ bị loại bỏ (Zod mặc định strip).
- Truy vấn DB qua Prisma (tham số hoá) → không có SQL injection từ input người dùng. Postgres raw query trong `remotesea-ai` dùng SQLAlchemy expression, không nối chuỗi.
- `GlobalExceptionFilter` trả `{ error: "Internal server error" }` cho lỗi không mong đợi và chỉ ghi stack trace vào log server.

---

## 5. Dữ liệu cá nhân

| Dữ liệu | Nơi lưu | Lưu ý |
| --- | --- | --- |
| Email, tên, ảnh | `users` | |
| Mật khẩu | `users.passwordHash` | bcrypt |
| CV, avatar, logo | S3 (`uploads/{type}/{userId}/...`) | Truy cập qua `CDN_URL` công khai |
| Thư xin việc, ghi chú tuyển dụng | `applications` | Chỉ ứng viên và chủ tin xem được |
| Mức lương mong muốn | `talent_profiles` | Ẩn khỏi hồ sơ công khai khi `isOpenToWork = false` |
| Input/output phân tích CV, lịch sử chat AI | `remotesea_ai.ai_interactions`, `ai_conversation_turns` | Gửi tới LLM provider đã cấu hình (Ollama local hoặc Anthropic/Gemini/Cloudflare) |

Khi dùng provider LLM đám mây, nội dung CV rời khỏi hạ tầng của nhóm. Với dữ liệu thật, ưu tiên Ollama tự host hoặc provider có cam kết không dùng dữ liệu để huấn luyện.

`DELETE /users/me` xoá cứng user và cascade dữ liệu trong DB của API. Dữ liệu tương ứng trong `remotesea_ai` và file trên S3 **không** bị xoá theo.

---

## 6. Tích hợp bên ngoài

| Tích hợp | Biện pháp hiện có |
| --- | --- |
| **Stripe** | Giá lấy từ `PLAN_PRICES` phía server, không nhận từ client. Webhook xác minh chữ ký bằng `STRIPE_WEBHOOK_SECRET` trên raw body; thiếu/sai chữ ký trả 400 |
| **S3 upload** | Client xin presigned PUT URL (hạn 5 phút). Server giới hạn `contentType` theo loại (`image/jpeg|png|webp` cho ảnh, `application/pdf` cho CV), làm sạch tên file, key nằm dưới thư mục của user |
| **Email (Resend)** | Gửi từ server; tắt hẳn khi không có `RESEND_API_KEY` |
| **remotesea-ai** | Endpoint `/v1/*` yêu cầu `Bearer AI_SERVICE_SECRET`, so sánh bằng `hmac.compare_digest`. Orchestrator dùng JWT HS256 ngắn hạn do API ký, mang `sub`/`role`/`employerId`; AI service không bao giờ nhận user id dạng trường không ký. Lịch sử chat luôn lọc theo `user_id` trong token |

---

## 7. Rủi ro đã biết

Các vấn đề phát hiện khi rà soát code hiện tại, xếp theo mức độ ưu tiên xử lý.

| # | Mức | Vấn đề | Vị trí | Hướng khắc phục |
| --- | --- | --- | --- | --- |
| 1 | **Cao** | `CRON_SECRET` là biến tuỳ chọn. Nếu không set, guard so sánh với chuỗi `"Bearer undefined"` → ai gửi header đó cũng gọi được cron | `cron-secret.guard.ts` | Từ chối khi secret rỗng; dùng `crypto.timingSafeEqual` |
| 2 | **Cao** | `POST /auth/login` không có rate limit → dò mật khẩu | `auth.controller.ts` | Thêm `rateLimitService.enforce` theo IP và theo email |
| 3 | **Trung bình** | Rate limit lấy IP từ phần tử đầu của `X-Forwarded-For` do client tự gửi → đổi header là vượt giới hạn. Bộ đếm nằm trong bộ nhớ, mỗi instance một bộ đếm riêng | `rate-limit.service.ts` | Dùng IP do proxy tin cậy gắn (`Fly-Client-IP` / `trust proxy`); chuyển bộ đếm sang Redis |
| 4 | **Trung bình** | Email HTML chèn trực tiếp dữ liệu người dùng (`name`, `jobTitle`, `note`) không escape → chèn link/HTML giả mạo vào email gửi cho người khác | `email.service.ts` | Escape HTML mọi giá trị động, hoặc dùng template engine có auto-escape |
| 5 | **Trung bình** | OAuth tự liên kết theo email mà không kiểm tra email đã xác minh ở provider → có thể chiếm tài khoản nếu provider trả email chưa xác minh | `auth.repository.ts` `findOrCreateOAuthUser` | Chỉ liên kết khi provider báo `email_verified`; nếu không, yêu cầu đăng nhập bằng mật khẩu để xác nhận |
| 6 | **Trung bình** | JWT nằm trên URL callback OAuth (`?token=`) → lưu trong lịch sử trình duyệt, log proxy, header `Referer` | `auth.controller.ts` | Trả mã dùng một lần ngắn hạn rồi đổi lấy token qua `POST /auth/oauth/exchange` |
| 7 | **Trung bình** | JWT sống 30 ngày, lưu ở `localStorage`, không thu hồi được → một lỗi XSS là lộ phiên dài hạn | `env.validation.ts`, `token-storage.ts` | Access token ngắn (15–60 phút) + refresh token trong cookie `HttpOnly; Secure; SameSite`; thêm `tokenVersion` vào user để thu hồi khi đổi mật khẩu |
| 8 | **Trung bình** | CV được phục vụ qua URL CDN công khai, ai có link đều tải được | `uploads.service.ts` | Bucket riêng tư cho `resume`, phát presigned GET URL ngắn hạn sau khi kiểm tra quyền |
| 9 | Thấp | Presigned PUT không giới hạn kích thước file | `uploads.service.ts` | Dùng presigned POST với `content-length-range` |
| 10 | Thấp | Token đặt lại mật khẩu lưu nguyên văn; yêu cầu mới không vô hiệu token cũ | `auth.service.ts` | Lưu SHA-256; xoá token cũ của cùng email khi tạo token mới |
| 11 | Thấp | Webhook Stripe không idempotent: Stripe gửi lại sự kiện có thể đưa tin đã `ACTIVE` về `PENDING_REVIEW` | `billing.repository.ts` | Chỉ cập nhật khi `planPaid = false`; kiểm tra `payment_status === "paid"` |
| 12 | Thấp | Swagger `/docs` luôn bật, kể cả production (README ghi là chỉ bật ngoài production) | `main.ts` | Chỉ `SwaggerModule.setup` khi `NODE_ENV !== "production"` |
| 13 | Thấp | Chưa có security header (`helmet`) cho API | `main.ts` | `app.use(helmet())` |
| 14 | Thấp | bcrypt chỉ dùng 72 byte đầu của mật khẩu; schema không giới hạn độ dài tối đa | `register.dto.ts` | `z.string().min(8).max(72)` |
| 15 | Thấp | `remotesea-ai` dùng chung một `AI_SERVICE_SECRET` cho cả xác thực service lẫn ký JWT ngữ cảnh | `security.py` | Tách hai secret khi có điều kiện |

---

## 8. Quản lý secret

- Không commit `.env`. Mỗi service có `.env.example` chỉ chứa giá trị mẫu.
- Mật khẩu Postgres trong `docker-compose.yml` (`remotesea_password`, `ai_service`) **chỉ dùng cho dev local**.
- `AUTH_SECRET`, `AI_SERVICE_SECRET`, `CRON_SECRET`: tối thiểu 32 byte ngẫu nhiên, ví dụ `openssl rand -base64 48`.
- `AI_SERVICE_SECRET` phải giống nhau ở `remotesea-api` và `remotesea-ai`.
- Trên Fly.io, đặt secret bằng `fly secrets set KEY=value`, không đưa vào `fly.toml`.
- Đổi `AUTH_SECRET` sẽ làm toàn bộ JWT hiện có mất hiệu lực (cách duy nhất hiện nay để "đăng xuất tất cả").

---

## 9. Checklist trước khi triển khai production

- [ ] `NODE_ENV=production`
- [ ] `AUTH_SECRET`, `CRON_SECRET`, `AI_SERVICE_SECRET`, `STRIPE_WEBHOOK_SECRET` đã set, đủ dài, khác giá trị dev
- [ ] `FRONTEND_URL` là domain HTTPS thật (dùng cho CORS và link trong email)
- [ ] Đã khắc phục rủi ro #1 và #2 ở [mục 7](#7-rủi-ro-đã-biết)
- [ ] Swagger tắt hoặc được bảo vệ
- [ ] Bucket S3 chứa CV không công khai
- [ ] Postgres không mở cổng ra Internet; dùng user DB riêng, quyền tối thiểu
- [ ] `remotesea-ai` chỉ truy cập được từ mạng nội bộ (Fly private network), không public
- [ ] Đã chạy `npm audit` (api, web) và `pip-audit` (ai)
- [ ] Sao lưu Postgres tự động đã bật và đã thử khôi phục

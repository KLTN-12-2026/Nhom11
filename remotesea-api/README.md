# API RemoteSEA

Hệ thống backend NestJS sẵn sàng cho môi trường sản xuất của RemoteSEA, một nền tảng việc làm từ xa dành cho khu vực Đông Nam Á. Dịch vụ này là sự chuyển đổi các tuyến API App Router gốc của Next.js (`remotesea/src/app/api/**`) thành một ứng dụng NestJS phân lớp, có cấu trúc mô-đun, bảo toàn các đường dẫn điểm cuối, hình dạng yêu cầu/phản hồi, mã trạng thái, quy tắc xác thực và logic nghiệp vụ, đồng thời áp dụng cấu trúc Kiến trúc Sạch (Clean Architecture) / lấy cảm hứng từ DDD có khả năng mở rộng.

## Công nghệ sử dụng

- **NestJS 10** — Khung API REST
- **TypeScript 5** — Chế độ nghiêm ngặt
- **Prisma 5** — ORM PostgreSQL (lược đồ được chia sẻ với ứng dụng Next.js gốc)
- **Passport + JWT** — Xác thực (thay thế việc xử lý phiên của NextAuth)
- **Zod** — Xác thực yêu cầu, được chuyển đổi nguyên văn từ lược đồ Zod của Next.js gốc để đảm bảo hình dạng phản hồi lỗi vẫn giống hệt nhau về byte
- **Stripe** — Thanh toán cho tin tuyển dụng
- **AWS S3** — Tải lên tệp được ký trước (ảnh đại diện, logo, sơ yếu lý lịch)
- **Nodemailer / SMTP** — Email giao dịch

## Kiến trúc

```
src/
├── main.ts # Khởi tạo, bộ lọc toàn cục, CORS, hỗ trợ nội dung thô (webhook của Stripe)
├── app.module.ts # Mô-đun gốc kết nối mọi tính năng module
│
├── core/ # cơ sở hạ tầng khung tổng thể
│ ├── config/ # cấu hình môi trường được xác thực bởi Zod
│ ├── database/ # singleton PrismaService
│ ├── guards/ # JwtAuthGuard, RolesGuard
│ ├── decorators/ # @CurrentUser(), @Roles()
│ ├── pipes/ # ZodValidationPipe
│ └── filters/ # GlobalExceptionFilter → dạng phản hồi { error }
│
├── common/ # các khối xây dựng dùng chung, có thể tái sử dụng
│ ├── exceptions/ # hệ thống phân cấp ApiException (Unauthorized/Forbidden/NotFound/Conflict/...)
│ ├── services/ # Dịch vụ Email, Dịch vụ Giới hạn Tỷ lệ (được cung cấp toàn cầu)
│ ├── constants/ # Hằng số liên mô-đun (ví dụ: giá gói dịch vụ)
│ ├── interfaces/ # Người dùng được xác thực, JwtPayload
│ └── types/ # Hình dạng phản hồi/kiểu dữ liệu được chia sẻ
│
└── modules/ # Một thư mục cho mỗi lĩnh vực kinh doanh
├── auth/ # Đăng ký, đăng nhập, OAuth (Google/GitHub), phiên, đặt lại mật khẩu
├── users/ # Tự phục vụ tài khoản (cập nhật tên, xóa tài khoản, thay đổi mật khẩu)

├── talent/ # Hồ sơ nhân tài (tự tìm kiếm + tìm kiếm công khai theo slug)

├── employer/ # Hồ sơ nhà tuyển dụng + bảng điều khiển quản lý việc làm/ứng tuyển ├── việc làm/ # bảng tuyển dụng công khai + tạo/chỉnh sửa việc làm

├── phân loại/ # danh mục + dữ liệu tham khảo kỹ năng

├── đơn xin việc/ # đơn xin việc của nhân tài

├── đã lưu/ # việc làm đã lưu/đánh dấu

├── quản trị viên/ # kiểm duyệt nền tảng (xác minh nhà tuyển dụng, phê duyệt việc làm)

├── cảnh báo/ # đăng ký nhận thông báo việc làm + gửi tác vụ định kỳ

├── thanh toán/ # thanh toán Stripe + webhook

├── tải lên/ # URL tải lên được ký trước S3

└── trạng thái/ # kiểm tra trạng thái hoạt động/sẵn sàng

```

Mỗi mô-đun đều tuân theo cùng một cấu trúc phân lớp nội bộ:

- **Bộ điều khiển** — chỉ xử lý định tuyến, bảo vệ, phân tích yêu cầu. Không bao giờ tương tác với Prisma.

- **Dịch vụ** — logic nghiệp vụ, kiểm tra ủy quyền, điều phối. Không bao giờ tương tác trực tiếp với Prisma (ủy quyền cho Repository), không bao giờ tương tác với các đối tượng yêu cầu/phản hồi HTTP.

- **Repository** — Chỉ thực hiện các truy vấn Prisma (`select`/`include` được định dạng để khớp chính xác với các phản hồi API gốc). Không có logic nghiệp vụ.

- **dto/** — Lược đồ Zod + kiểu dữ liệu suy luận, được xác thực thông qua `ZodValidationPipe`.

## Các quyết định thiết kế quan trọng

- **Sử dụng Zod thay vì class-validator.** Ứng dụng Next.js gốc trả về `{ error: parsed.error.flatten() }` khi nhập dữ liệu không hợp lệ. Để giữ cho người dùng API hoạt động mà không bị thay đổi, mỗi DTO sử dụng lại lược đồ Zod gốc và một `ZodValidationPipe` dùng chung — chứ không phải class-validator, vì class-validator sẽ tạo ra dạng lỗi khác.
- **Hệ thống phân cấp ngoại lệ tùy chỉnh.** Tất cả các lỗi được ném ra đều là các lớp con của `ApiException` (`UnauthorizedApiException`, `ForbiddenApiException`, `NotFoundApiException`, `ConflictApiException`, `BadRequestApiException`, `ValidationApiException`, `TooManyRequestsApiException`). Một `GlobalExceptionFilter` hiển thị mọi lỗi dưới dạng `{ error: <string|object> }`, khớp chính xác với hợp đồng `NextResponse.json({ error }, { status })` ban đầu.
- **Sử dụng JWT/Passport thay vì NextAuth.** `POST /auth/login` phát ra JWT; `GET /auth/google` và `GET /auth/github` (+ `/callback`) mô phỏng đăng nhập OAuth và chỉ đăng ký làm tuyến đường khi thông tin xác thực của chúng được cấu hình; `GET /auth/session` mô phỏng việc đọc phiên hiện tại từ một mã thông báo bearer.
- **Giao dịch do kho lưu trữ sở hữu.** Các thao tác ghi nguyên tử nhiều bước (ví dụ: tạm dừng một nhà tuyển dụng + đóng các công việc đang hoạt động của họ, thay thế danh sách kỹ năng của một tài năng) nằm trong một phương thức kho lưu trữ duy nhất sở hữu `prisma.$transaction([...])` nội bộ — các dịch vụ không bao giờ gọi trực tiếp Prisma.
- **Giới hạn tốc độ.** Được chuyển từ t

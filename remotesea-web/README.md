# remotesea-web

Giao diện React 19 + TypeScript + Vite cho RemoteSEA, một bảng việc làm từ xa dành cho Đông Nam Á. Giao tiếp với phần phụ trợ NestJS [`remotesea-api`](../remotesea-api) qua HTTP — ứng dụng này không có máy chủ riêng.

## ngăn xếp

- **Vite** (máy chủ nhà phát triển + bản dựng) với `@vitejs/plugin-react`
- **React 19**, **react-router-dom** để định tuyến
- **Truy vấn TanStack** cho trạng thái máy chủ, **react-hook-form** + **zod** cho biểu mẫu
- **Tailwind CSS** với thang đo mã thông báo thiết kế tùy chỉnh (xem `tailwind.config.ts`)
- **Sentry** (`@sentry/react`) để theo dõi lỗi, tùy chọn và bị tắt trừ khi `VITE_SENTRY_DSN` được đặt

## Thiết lập

```bash
cài đặt npm
cp .env.example .env # rồi điền VITE_API_URL
npm chạy dev
```

Ứng dụng yêu cầu một phiên bản `remotesea-api` đang chạy — xem README/docker-compose của dự án đó để biết cách khởi động cục bộ (mặc định là `http://localhost:4000`).

### Biến môi trường

| Biến                     | Bắt buộc                                                              | Mô tả                                                                                  |
| ------------------------ | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `VITE_API_URL`           | Có (bản dựng không thành công nếu không có nó - xem `vite.config.ts`) | URL cơ sở của chương trình phụ trợ `remotesea-api`.                                    |
| `VITE_SENTRY_DSN`        | Không                                                                 | Sentry DSN để theo dõi lỗi/phát lại phiên. Unset = `initMonitoring()` không hoạt động. |
| `VITE_GA_MEASUREMENT_ID` | Không                                                                 | Mã đo lường Google Analytics 4. Bỏ đặt = bị vô hiệu hóa.                               |

## Tập lệnh

| Lệnh                                  | Mô tả                                                                |
| ------------------------------------- | -------------------------------------------------------------------- |
| `npm chạy dev`                        | Khởi động máy chủ Vite dev (cổng 3000).                              |
| `npm run build`                       | Kiểm tra kiểu (`tsc -b`) sau đó tạo bản dựng sản xuất thành `dist/`. |
| `npm chạy xem trước`                  | Phục vụ công tác sản xuất xây dựng tại địa phương.                   |
| `npm run lint` / `lint:fix`           | ESLint (`eslint.config.js`).                                         |
| `định dạng chạy npm` / `format:check` | Đẹp hơn.                                                             |
| `npm run type-check`                  | chỉ `tsc -b`, không có bản dựng.                                     |

CI (`.github/workflows/ci.yml`) chạy lint, format:check, type-check và xây dựng trên mỗi lần đẩy/PR.

## Bố cục dự án

```
src/
app/ # nhà cung cấp, kết nối cấp ứng dụng
thành phần/ # nguyên gốc giao diện người dùng được chia sẻ (thành phần/ui) và các thành phần tính năng chéo (thành phần/được chia sẻ)
hằng số/ # hằng số được chia sẻ trên toàn ứng dụng (tuyến đường, v.v.)
bối cảnh/ # Nhà cung cấp bối cảnh phản ứng (auth, v.v.)
tính năng/ # một thư mục cho mỗi khu vực tên miền (việc làm, nhân tài, nhà tuyển dụng, quản trị viên, ...),
# mỗi cái thường có *.api.ts, *.queries.ts, Components/, pages/
hooks/ # móc tùy chỉnh được chia sẻ
bố cục/ # trình bao bọc bố cục trang
trang/ # trang cấp cao nhất, không có tính năng cụ thể
định nghĩa bộ định tuyến/ # tuyến đường (các thành phần trang được tải từng phần)
services/ # api-client, giám sát, phân tích
style/ # CSS toàn cục
loại/ # loại TypeScript được chia sẻ
utils/ # chức năng tiện ích được chia sẻ
```

Chưa có bộ thử nghiệm nào.

# Dịch vụ AI RemoteSea

Một microservice AI tự lưu trữ cho RemoteSea, độc lập với `remotesea-api`
(NestJS) và `remotesea-web` (React) — xem tài liệu kiến ​​trúc mà dịch vụ này được xây dựng dựa trên đó để có tầm nhìn 12 giai đoạn đầy đủ. **Tài liệu README này ghi lại những gì
thực sự đã được triển khai hiện tại, chứ không phải toàn bộ tầm nhìn** — xem phần "Phạm vi" bên dưới.

Mục tiêu từ đầu đến cuối cho phần đầu tiên này là vòng lặp học tập hoàn chỉnh cho một
nhiệm vụ duy nhất: `CANDIDATE_ANALYSIS` → `AiInteraction` → Chấp nhận/Chỉnh sửa/Từ chối
phản hồi → Trình tạo tập dữ liệu → `dataset-vN` → Huấn luyện QLoRA trên Google Colab →
Đánh giá → Mô hình ứng viên → phê duyệt của con người → Triển khai trên Ollama. Việc
Ghép nối công việc, Phân tích phỏng vấn và Phân tích bảng điểm nằm ngoài phạm vi cho đến khi vòng lặp đó hoạt động từ đầu đến cuối.

Song song với vòng lặp đó, dịch vụ này cũng đang trở thành **Trình điều phối AI**
cho một kiến ​​trúc riêng biệt, ở giai đoạn sau: mô hình miền thực,
ủy quyền và logic nghiệp vụ của RemoteSea nằm trong `remotesea-api` (NestJS) —
dịch vụ này không bao giờ sao chép chúng, chỉ gọi lại API HTTP được xác thực riêng của `remotesea-api` dưới dạng "Công cụ", và duy trì cơ sở tri thức RAG riêng của nó một cách độc lập. Xem "Trình điều phối AI" bên dưới để biết những gì được xây dựng ở đó, và
[docs/intelligent-rag.md](docs/intelligent-rag.md) để biết kiến ​​trúc truy xuất/dựa trên đầy đủ (truy xuất nhận biết ý định, cổng tin cậy,
kiểm tra tính nhất quán/rò rỉ xác định, nội dung chính sách RBAC) một cách chi tiết.

## Kiến trúc

Kiến trúc gọn gàng, bốn lớp, các phụ thuộc chỉ trỏ vào bên trong (`api` →
`application` → `domain` ← `infrastructure`; `domain` không bao giờ nhập từ bất kỳ
lớp nào khác):

```
app/
├── main.py # gốc cấu trúc — kết nối các bộ định tuyến với ứng dụng
├── api/ # TRÌNH BÀY — các bộ định tuyến FastAPI mỏng, không có logic nghiệp vụ.
│ ├── deps.py, health.py, inference.py, feedback.py, datasets.py,
│ │ model_registry.py, rag.py
│ └── orchestrator/ # health.py, tools.py, ask.py, chat.py — được kết hợp
│ # nằm dưới một bộ định tuyến /v1/orchestrator trong __init__.py
├── application/ # CÁC TRƯỜNG HỢP SỬ DỤNG — điều phối miền + cơ sở hạ tầng.

│ │ # Một lớp dịch vụ cho mỗi khả năng: suy luận,
│ │ # feedback, dataset_builder, model_registry,
│ │ # rag_ingestion, rag_retrieval, orchestrator, chat,
│ │ # tool_service, historical_case.
├── domain/ # Các quy tắc nghiệp vụ/đối tượng giá trị THUẦN TÚY — không cần I/O,
│ │ # không cần nhập framework, hoàn toàn có thể kiểm thử đơn vị.
│ ├── candidate_analysis/ # xây dựng lời nhắc, HistoricalCase, lựa chọn ground-truth
│ ├── orchestrator/ # context_builder (lắp ráp lời nhắc hỏi/trò chuyện), HistoryTurn
│ ├── dataset/ # ví dụ lựa chọn/chia nhỏ cho Dataset Builder
│ ├── rag/ # chunker, RetrievedChunk
│ └── shared/ # truncate(), parse_json_object(), error_message() —
│ # các hàm hỗ trợ nhỏ được sử dụng trong các mô-đun miền ở trên
├── infrastructure/ # DB, nhà cung cấp mô hình/nhúng, HTTP bên ngoài, cấu hình, bảo mật
│ ├── config.py, logging.py, security.py, database.py (công cụ/phiên chung
│ │ factory), main_db.py, rag_db.py, remotesea_api_client.py
│ ├── models/ # SQLAlchemy ORM (8 bảng, 2 cơ sở dữ liệu)
│ └── providers/
│ ├── llm/ # AiModelProvider: base/ollama/anthropic/gemini/mock/
│ │ # factory/errors/retry
│ └── embedding/ # EmbeddingProvider: base/ollama/mock/factory
└── schemas/ # DTO yêu cầu/phản hồi Pydantic (hợp đồng API),

# spans api+application; CamelModel của base.py loại bỏ
# phần mã lặp lại kiểu camelCase-alias
```

Hai cơ sở dữ liệu Postgres độc lập, mỗi cơ sở dữ liệu có chuỗi Alembic riêng
(`alembic/` cho `remotesea_ai`, `alembic_rag/` cho `remotesea_rag`) — xem
"Thiết lập cục bộ" bên dưới. `application/` và `domain/` chỉ phụ thuộc vào
giao diện `AiModelProvider` trong `providers/llm/base.py`, chứ không bao giờ phụ thuộc vào một nhà cung cấp cụ thể
— việc hoán đổi mô hình/nhà cung cấp (`AI_MODEL_PROVIDER`/`AI_MODEL`, cộng với mỗi
nhà cung cấp có ghi đè `OLLAMA_MODEL`/`CLOUDFLARE_MODEL` riêng — xem bên dưới) hoặc
thêm một cái mới (ví dụ: `VLLMProvider`) có nghĩa là thêm/chọn một lớp
trong `infrastructure/providers/llm/`, mà không ảnh hưởng đến bất kỳ lớp nào.

## Phạm vi: những gì đã được xây dựng so với những gì chưa được xây dựng

Đã được xây dựng và xác minh từ đầu đến cuối, dựa trên một hệ thống Postgres + Ollama đang hoạt động thực tế
(không chỉ được viết ra — mọi mục bên dưới đều đã được kiểm thử bằng các lệnh curl và truy vấn cơ sở dữ liệu thực tế):

- Dịch vụ FastAPI, cơ sở dữ liệu PostgreSQL riêng (thông qua SQLAlchemy async + Alembic),

xác thực bí mật dùng chung cho các lệnh gọi NestJS → Dịch vụ AI.

- **Trừu tượng hóa `AiModelProvider` với ba triển khai thực tế** —

`OllamaProvider` (mặc định, tự lưu trữ, chạy **Qwen2.5-3B-Instruct**

cục bộ, chỉ CPU — không cần khóa API), `AnthropicProvider` và

`GeminiProvider`, được chọn thông qua `AI_MODEL_PROVIDER`/`AI_MODEL`

(`app/infrastructure/providers/llm/factory.py`). Cả ba đều được triển khai

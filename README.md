# 🌿 Saigon Whispers (Thì Thầm Sài Gòn)
> **Nền tảng Hướng dẫn Du lịch Thông minh & Thuyết minh Âm thanh Tự động**  
> Ứng dụng tích hợp Định vị GPS thực địa, AI Đa ngôn ngữ, Tối ưu lộ trình PostGIS và Quản trị điểm đến thông minh.

---

## 📌 Mục lục
- [1. Giới thiệu & Tính năng chính](#1-giới-thiệu--tính-năng-chính)
- [2. Công nghệ sử dụng (Tech Stack)](#2-công-nghệ-sử-dụng-tech-stack)
- [3. Yêu cầu hệ thống](#3-yêu-cầu-hệ-thống)
- [4. Hướng dẫn cài đặt & Khởi chạy](#4-hướng-dẫn-cài-đặt--khởi-chạy)
- [5. Thông tin Tài khoản Kiểm thử (Credentials)](#5-thông-tin-tài-khoản-kiểm-thử-credentials)
- [6. Tài liệu API (Swagger / OpenAPI)](#6-tài-liệu-api-swagger--openapi)
- [7. Cấu trúc thư mục Monorepo](#7-cấu-trúc-thư-mục-monorepo)

---

## 1. Giới thiệu & Tính năng chính

**Saigon Whispers** là hệ thống hỗ trợ du khách khám phá các địa điểm văn hóa, lịch sử và ẩm thực đặc sắc (tập trung tại khu vực Quận 4, TP. Hồ Chí Minh).

* 🎧 **Thuyết minh âm thanh tự động (Geo-fence Audio Guide):** Tự động phát audio thuyết minh khi du khách bước vào bán kính 30m quanh điểm tham quan (POI) bằng GPS thời gian thực.
* 🌐 **Dịch động đa ngôn ngữ thời gian thực (AI Dynamic Translation):** Hệ thống tự động dịch dữ liệu địa điểm, thực đơn, đánh giá sang **6 ngôn ngữ** (*Tiếng Việt, Tiếng Anh, Tiếng Trung, Tiếng Nhật, Tiếng Hàn, Tiếng Pháp*) thông qua Google Gemini AI và tự động lưu bộ đệm (cache) vào PostgreSQL.
* 🤖 **Trợ lý AI Du lịch & Ẩm thực (Gemini AI Assistant):** Gợi ý món ăn theo ngân sách, sở thích khẩu vị và lập lịch trình tour cá nhân hóa thông minh.
* 🗺️ **Tối ưu hóa hành trình (PostGIS Routing):** Thuật toán tính toán đường đi ngắn nhất, ước tính thời gian di chuyển và sắp xếp thứ tự điểm dừng tối ưu.
* 📸 **Quét Menu thực đơn bằng OCR:** Tính năng trong Admin CMS cho phép tải ảnh thực đơn quán ăn lên, hệ thống tự động bóc tách tên món, giá tiền và phân loại món ăn.
* 🛡️ **Bảo mật & Phân quyền chặt chẽ:** 
  - Khách vãng lai: Tự động cấp phiên ẩn danh (Guest Session) để lưu trữ lộ trình và nhật ký nghe.
  - Người dùng: Đăng nhập Google 1-chạm hoặc xác thực OTP qua Telegram (giới hạn cooldown gửi lại 60 giây).
  - Yêu cầu đăng nhập khi thực hiện hành vi nhạy cảm: Đánh giá/bình luận, thêm và quản lý danh sách yêu thích.
  - Quản trị viên (Admin): Trang quản trị độc lập tại `/admin`, yêu cầu nhập tài khoản và mật khẩu bảo mật (mã hóa chuẩn PBKDF2).

---

## 2. Công nghệ sử dụng (Tech Stack)

| Phân hệ | Công nghệ & Thư viện |
| :--- | :--- |
| **Backend** | Java 17, Spring Boot 3.5, Spring JDBC, JJWT (JSON Web Token), Jackson |
| **Database & Cache** | PostgreSQL 17 + PostGIS 3.5 (Lưu trữ không gian địa lý), Redis 7 Alpine |
| **Trí tuệ nhân tạo (AI)**| Google Gemini API (`gemini-3.5-flash-lite`), Tesseract / Vision OCR |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Leaflet Map |
| **Giao thức & Tích hợp**| RESTful API, Server-Sent Events (SSE Realtime Visitors), Telegram Bot API |
| **DevOps & Container** | Docker, Docker Compose, Maven 3.9+ |

---

## 3. Yêu cầu hệ thống

Trước khi bắt đầu, hãy đảm bảo máy tính đã cài đặt:
- **Docker Desktop** (hoặc Docker Engine + Docker Compose)
- **Java Development Kit (JDK) 17** trở lên
- **Node.js 20.x** hoặc mới hơn (kèm npm)
- **Maven 3.6+** *(hoặc sử dụng bản Maven đóng gói sẵn trong thư mục backend)*

---

## 4. Hướng dẫn cài đặt & Khởi chạy

### Bước 1: Khởi động Cơ sở dữ liệu & Cache (PostGIS + Redis)

Tại thư mục gốc của dự án (`smart-tourism`), mở terminal và chạy:

```bash
docker compose up -d
```

Kiểm tra trạng thái các container đang chạy:
```bash
docker compose ps
```
> Kết quả mong đợi: `tourism-postgis` (cổng `5432`) và `tourism-redis` (cổng `6379`) đều ở trạng thái **healthy / running**.

---

### Bước 2: Cấu hình Biến môi trường

1. Tạo file `.env` tại thư mục gốc (hoặc sao chép từ `.env.example`):
```bash
copy .env.example .env
```
2. Đảm bảo file `.env` chứa khóa **Gemini API Key** để kích hoạt tính năng dịch tự động và trợ lý AI:
```properties
GEMINI_API_KEY=your_google_gemini_api_key_here
```
*(Nếu chưa có key, bạn có thể tạo miễn phí tại [Google AI Studio](https://aistudio.google.com/)).*

---

### Bước 3: Khởi động Backend (Spring Boot API)

Mở terminal thứ nhất và di chuyển vào thư mục `backend`:

```bash
cd backend

# Nếu máy đã cài sẵn Maven:
mvn spring-boot:run

# Hoặc sử dụng Maven wrapper đóng gói sẵn trong dự án (Windows):
.\apache-maven-3.9.6\bin\mvn.cmd spring-boot:run
```

- Khi khởi động thành công, backend sẽ lắng nghe tại: `http://localhost:8080`.
- Kiểm tra kết nối nhanh:
```bash
curl http://localhost:8080/api/v1/health
# Trả về: {"status":"UP","database":"CONNECTED",...}
```

---

### Bước 4: Khởi động Frontend (Next.js Web App)

Mở terminal thứ hai và di chuyển vào thư mục `frontend`:

```bash
cd frontend

# Cài đặt các gói phụ thuộc (nếu chưa cài):
npm install

# Khởi chạy server phát triển:
npm run dev
```

- Ứng dụng web sẽ chạy tại: **[http://localhost:3000](http://localhost:3000)**.

---

## 5. Thông tin Tài khoản Kiểm thử (Credentials)

Hệ thống phân tách rành mạch giữa môi trường Người dùng thông thường và Trang Quản trị:

### 🔑 1. Tài khoản Quản trị viên (Admin CMS)
Trang quản trị được đặt tại URL nội bộ độc lập, **không hiển thị form đăng nhập công khai ra ngoài giao diện du khách**:

| Mục | Thông tin đăng nhập |
| :--- | :--- |
| **Đường dẫn truy cập (URL)** | **[http://localhost:3000/admin](http://localhost:3000/admin)** |
| **Tài khoản / Email** | `admin` *(hoặc `admin@saigonwhispers.vn`)* |
| **Mật khẩu** | `admin123` |
| **Quyền hạn (Role)** | `ADMIN` |
| **Quyền truy cập** | Quản lý danh mục, điểm đến (POI), thực đơn món ăn, quét ảnh menu OCR, tạo tour, xem thống kê realtime và quản lý cache. |

> **Lưu ý:** Nếu truy cập `/admin` khi chưa đăng nhập hoặc đăng nhập bằng tài khoản người dùng thường, hệ thống sẽ chặn mã `403 Forbidden` và hiển thị màn hình bảo vệ yêu cầu xác thực tài khoản Quản trị viên.

---

### 👤 2. Tài khoản Khách & Người dùng (Tourist Mode)
Khi trải nghiệm trên trang chủ du khách [http://localhost:3000](http://localhost:3000):

* **Chế độ Khách vãng lai (Guest Mode):**
  - Mở web là có thể xem bản đồ, nghe audio thuyết minh và tra cứu thông tin địa điểm ngay lập tức.
  - Hệ thống tự động cấp định danh ẩn danh (`Khách #web-xxxx`).
* **Đăng nhập người dùng thành viên (Member):**
  - Khi thực hiện **bấm tim yêu thích (Favorites)** hoặc **đăng bình luận, đánh giá (Reviews)**, hệ thống sẽ tự động bật hộp thoại đăng nhập.
  - **Cách 1 - Đăng nhập Google:** 1-chạm qua tài khoản Google.
  - **Cách 2 - Đăng nhập số điện thoại (Telegram OTP):** Nhập số điện thoại bất kỳ (VD: `0912345678`), mã xác thực 6 số sẽ được gửi qua Telegram Bot. Hệ thống có cơ chế giới hạn gửi lại mã an toàn với **thời gian chờ đếm ngược 60 giây**.

---

## 6. Tài liệu API (Swagger / OpenAPI)

Sau khi backend khởi động, bạn có thể kiểm thử toàn bộ các API endpoint trực tiếp qua Swagger UI:

- **Swagger UI:** [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **OpenAPI Schema (JSON):** [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

> **Hướng dẫn Authorize trong Swagger:**  
> 1. Gọi API `POST /api/v1/auth/admin-login` với body `{"username": "admin", "password": "admin123"}` để lấy token.  
> 2. Bấm nút **Authorize** màu xanh ở góc trên bên phải Swagger UI, nhập theo định dạng: `Bearer <token_vừa_lấy>` ➔ Bấm **Authorize** để gọi các endpoint quản trị `/api/v1/admin/**`.

---

## 7. Cấu trúc thư mục Monorepo

```text
smart-tourism/
├── backend/                               # Spring Boot 3.5 API
│   ├── src/main/java/com/example/tourism/
│   │   ├── admin/                         # Controller & Service quản trị (POI, Menu, Cache)
│   │   ├── ai/                            # Gemini Client, OCR & Trợ lý thông minh
│   │   ├── analytics/                     # Thống kê lượng khách, dwell time, SSE realtime
│   │   ├── auth/                          # Xác thực JWT, Google OAuth2, Telegram OTP, Argument Resolvers
│   │   ├── common/                        # Xử lý ngoại lệ toàn cục (Global Exception Handler)
│   │   ├── poi/                           # Quản lý Điểm tham quan (PostGIS spatial queries)
│   │   ├── tour/                          # Tuyến đường du lịch & Tối ưu lộ trình
│   │   ├── translation/                   # Interceptor dịch tự động đa ngôn ngữ
│   │   └── user/                          # Model & Repository người dùng
│   └── src/main/resources/
│       ├── application.properties         # Cấu hình kết nối DB, Redis, Gemini Model
│       └── schema.sql                     # Khởi tạo bảng, chỉ mục PostGIS & dữ liệu mẫu
├── frontend/                              # Next.js 16 Web App
│   ├── src/
│   │   ├── app/                           # App Router (/page.tsx, /admin/page.tsx, /login)
│   │   ├── components/
│   │   │   ├── admin/                     # Bảng điều khiển Admin CMS, AdminLoginGuard
│   │   │   ├── ai/                        # Modal Trợ lý AI du lịch & ẩm thực
│   │   │   ├── auth/                      # Modal đăng nhập (Google, OTP), UserMenu
│   │   │   ├── map/                       # Bản đồ tương tác Leaflet & GPS tracking
│   │   │   ├── poi/                       # Modal chi tiết POI, Tab Đánh giá, Quán yêu thích
│   │   │   └── tours/                     # Lập kế hoạch tour tự động & tùy chỉnh
│   │   ├── contexts/                      # AuthContext, LanguageContext
│   │   ├── i18n/                          # Từ điển dịch tĩnh đa ngôn ngữ (6 ngôn ngữ)
│   │   └── services/                      # Cầu nối gọi API backend
├── docker-compose.yml                     # Cấu hình container PostGIS & Redis
├── render.yaml                            # Cấu hình Blueprint Deploy Backend Render
├── DEPLOY_FREE_GUIDE.md                   # Hướng dẫn chi tiết Deploy & CI/CD 100% Free
├── .env.example                           # Mẫu cấu hình môi trường
└── README.md                              # Tài liệu hướng dẫn sử dụng dự án
```

---

## 8. Triển khai Đám mây (Deploy) & CI/CD Miễn phí 100%

Hệ thống hỗ trợ quy trình CI/CD tự động cập nhật khi push code lên GitHub và hoàn toàn miễn phí:
* **Frontend:** Triển khai trên **Vercel** (Next.js 16 Edge CDN).
* **Backend:** Triển khai trên **Render** (chạy Dockerfile Java 17).
* **Database & Cache:** Sử dụng **Supabase** (PostGIS) và **Upstash** (Redis).

👉 **Xem hướng dẫn chi tiết từng bước tại:** [DEPLOY_FREE_GUIDE.md](file:///e:/smart-tourism/DEPLOY_FREE_GUIDE.md)

---
*Chúc bạn có trải nghiệm tuyệt vời cùng Saigon Whispers! Mọi đóng góp và phản hồi xin vui lòng tạo Issue hoặc Pull Request.* 🚀

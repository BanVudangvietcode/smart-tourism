# Hệ thống thuyết minh du lịch — Skeleton

Monorepo tối giản để kiểm tra luồng kết nối:

```text
Next.js (localhost:3000)
  -> GET http://localhost:8080/api/v1/health
Spring Boot (localhost:8080)
  -> SELECT 1
PostgreSQL + PostGIS (localhost:5432)
```

## Yêu cầu

- Docker Desktop / Docker Compose
- Java 17+
- Maven 3.6.3+
- Node.js 20.9+
- npm

## Chạy local

### 1. Database

```bash
docker compose up -d
docker compose ps
```

### 2. Backend

```bash
cd backend
mvn spring-boot:run
```

Kiểm tra trực tiếp:

```bash
curl http://localhost:8080/api/v1/health
```

### 3. Frontend

Mở terminal khác:

```bash
cd frontend
npm install
npm run dev
```

Truy cập [http://localhost:3000](http://localhost:3000). Trang sẽ tự gọi API và hiển thị trạng thái backend/database.

## Biến môi trường

Các giá trị local có mặc định an toàn cho phát triển. Khi cần tùy biến:

```bash
copy .env.example .env
```

Backend đọc `DB_HOST`, `DB_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`. Frontend đọc `NEXT_PUBLIC_API_BASE_URL` (mặc định `http://localhost:8080`). Không commit secret thật.

## CI/CD

Workflow `.github/workflows/ci.yml` chạy khi push hoặc pull request:

- Backend: Java 17 + `mvn verify`
- Frontend: Node 20 + `npm ci`, lint, type-check và build
- Docker Compose: kiểm tra cú pháp cấu hình

Skeleton chỉ cung cấp CI. Bước deploy (CD) nên được thêm sau khi chọn môi trường đích như VPS, AWS, Render hoặc Vercel.

# 🚀 HƯỚNG DẪN TRIỂN KHAI (DEPLOY) & THIẾT LẬP CI/CD MIỄN PHÍ 100%

Tài liệu này hướng dẫn bạn đưa toàn bộ hệ thống **Smart Tourism** (Next.js 16 + Spring Boot + PostGIS + Redis) lên môi trường trực tuyến đám mây hoạt động 24/7, có **CI/CD tự động cập nhật khi push code lên GitHub**, và **hoàn toàn 0 VNĐ** (không cần thẻ visa/tín dụng).

---

## 🏛️ KIẾN TRÚC HỆ THỐNG TRÊN ĐÁM MÂY

```
                     ┌──────────────────┐
                     │   GitHub Repo    │
                     └────────┬─────────┘
          git push origin main│ (Tự động kích hoạt CI/CD)
             ┌────────────────┴────────────────┐
             ▼                                 ▼
   ┌───────────────────┐             ┌───────────────────┐
   │      VERCEL       │             │      RENDER       │
   │ (Frontend NextJS) │             │ (Backend API JRE) │
   └─────────┬─────────┘             └─────────┬─────────┘
             │                                 │
             │ HTTPS                           ├────────► [SUPABASE] (PostGIS Database)
             ▼                                 │
    Du khách truy cập                          └────────► [UPSTASH]  (Redis Cache)
 (https://*.vercel.app)
```

---

## 📋 CÁC BƯỚC THỰC HIỆN (MẤT KHOẢNG 10 - 15 PHÚT)

### 🟢 BƯỚC 1: Tạo Database PostgreSQL + PostGIS miễn phí (Supabase)
*Thời gian: ~2 phút*

1. Truy cập [https://supabase.com](https://supabase.com) và bấm **Sign Up with GitHub** (hoặc Log in).
2. Bấm **New Project**:
   * **Name:** `smart-tourism-db`
   * **Database Password:** Nhập mật khẩu mạnh (hãy lưu lại mật khẩu này).
   * **Region:** Chọn `Southeast Asia (Singapore)` (gần Việt Nam nhất, tốc độ phản hồi nhanh nhất).
   * Bấm **Create new project** và đợi khoảng 1 phút để hệ thống khởi tạo.
3. Lấy thông tin kết nối Database:
   * Vào biểu tượng bánh răng **Project Settings** (góc dưới bên trái) ➔ Chọn thẻ **Database**.
   * Kéo xuống mục **Connection parameters**, bạn sẽ thấy các thông số:
     * **Host:** dạng `aws-0-ap-southeast-1.pooler.supabase.com` hoặc `db.xxxx.supabase.co`
     * **Database name:** `postgres`
     * **Port:** `5432` (hoặc `6543`)
     * **User:** `postgres` (hoặc `postgres.[PROJECT-REF]`)
     * **Password:** Mật khẩu bạn vừa đặt ở trên.
4. *(Tùy chọn an toàn)* Vào mục **SQL Editor** trong thanh menu bên trái của Supabase, dán lệnh sau và bấm **Run**:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```
   *(Hệ thống đã được cấu hình tự động bật extension này khi backend khởi chạy).*

---

### 🔴 BƯỚC 2: Tạo Redis Cache miễn phí (Upstash Redis)
*Thời gian: ~2 phút*

1. Truy cập [https://upstash.com](https://upstash.com) và đăng nhập bằng tài khoản **GitHub**.
2. Tại bảng điều khiển, bấm **Create Database**:
   * **Name:** `tourism-redis`
   * **Type:** `Regional`
   * **Region:** `ap-southeast-1 (Singapore)`
   * Bấm **Create**.
3. Sau khi tạo xong, cuộn xuống mục **Connect to your database**:
   * Chọn tab **Java** hoặc xem phần **Endpoint & Password**:
     * **Host:** `xxxx.upstash.io`
     * **Port:** `6379`
     * **Password:** Dãy ký tự mật khẩu hiển thị trong ô.
   * Lưu lại 3 thông số này.

---

### 🔵 BƯỚC 3: Deploy Backend Spring Boot lên Render (Có CI/CD tự động)
*Thời gian: ~5 phút*

1. Đẩy code dự án của bạn lên kho lưu trữ **GitHub** (nếu chưa đẩy):
   ```bash
   git add .
   git commit -m "Configure production Dockerfile and cloud settings"
   git push origin main
   ```
2. Truy cập [https://render.com](https://render.com), đăng nhập bằng tài khoản **GitHub**.
3. Bấm nút **New +** ở góc trên bên phải ➔ Chọn **Web Service**.
4. Chọn **Build and deploy from a Git repository** ➔ Chọn kho lưu trữ GitHub dự án của bạn (ví dụ: `your-username/smart-tourism`).
5. Cấu hình dịch vụ như sau:
   * **Name:** `smart-tourism-api`
   * **Region:** `Singapore` (để cùng khu vực với Supabase và Upstash)
   * **Branch:** `main`
   * **Runtime:** Chọn **Docker**
   * **Docker Context:** `./backend`
   * **Dockerfile Path:** `./backend/Dockerfile`
   * **Instance Type:** Chọn **Free** (0$/tháng)
6. Kéo xuống mục **Environment Variables** (Biến môi trường) ➔ Bấm **Add Environment Variable** để thêm các biến sau:
   * `DB_HOST`: *(Host lấy từ Supabase ở Bước 1)*
   * `DB_PORT`: `5432`
   * `POSTGRES_DB`: `postgres`
   * `POSTGRES_USER`: `postgres`
   * `POSTGRES_PASSWORD`: *(Mật khẩu Supabase ở Bước 1)*
   * `REDIS_HOST`: *(Host lấy từ Upstash ở Bước 2)*
   * `REDIS_PORT`: `6379`
   * `REDIS_PASSWORD`: *(Password lấy từ Upstash ở Bước 2)*
   * `REDIS_SSL`: `true`
   * `JWT_SECRET`: `0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF`
   * `GEMINI_API_KEY`: *(Dán API Key Gemini của bạn)*
   * `TELEGRAM_BOT_TOKEN`: `8702128093:AAHk3MMSsSxrlouVBUZ0fdN_60lHXC24LTo`
   * `TELEGRAM_BOT_CHAT_ID`: `8601901810`
7. Bấm **Create Web Service**.
8. Render sẽ tự động kéo Dockerfile về build. Quá trình build mất khoảng 3 - 5 phút. Khi màn hình hiện `Tomcat started on port 8080`, backend của bạn đã online!
   * Copy địa chỉ URL được Render cấp ở đầu trang (ví dụ: `https://smart-tourism-api.onrender.com`).

---

### 🌐 BƯỚC 4: Deploy Frontend Next.js lên Vercel (Có CI/CD tự động)
*Thời gian: ~2 phút*

1. Truy cập [https://vercel.com](https://vercel.com) và đăng nhập bằng **GitHub**.
2. Tại Dashboard, bấm **Add New...** ➔ Chọn **Project**.
3. Tìm và bấm nút **Import** bên cạnh kho lưu trữ GitHub của bạn.
4. Cấu hình Project trên Vercel:
   * **Framework Preset:** Next.js (hệ thống tự nhận diện).
   * **Root Directory:** Bấm nút **Edit** bên cạnh và chọn thư mục `frontend` ➔ Bấm **Continue**.
   * Mở rộng mục **Environment Variables**:
     * **Key:** `NEXT_PUBLIC_API_BASE_URL`
     * **Value:** *(Dán đường dẫn backend của Render vừa lấy ở Bước 3, ví dụ: `https://smart-tourism-api.onrender.com`)*
5. Bấm **Deploy**.
6. Sau khoảng 1 - 2 phút, Vercel sẽ hoàn tất và hiển thị pháo hoa chúc mừng 🎉 kèm đường dẫn website công khai (ví dụ: `https://smart-tourism-q4.vercel.app`).

---

### ⏰ BƯỚC 5: Thiết lập Chống ngủ đông cho Backend (Keep-Alive 24/7)
*Thời gian: ~1 phút*

*Gói miễn phí của Render sẽ tạm dừng (ngủ đông) nếu không có ai truy cập trong 15 phút. Để website luôn tải nhanh tức thì:*

1. Truy cập trang web miễn phí [https://cron-job.org](https://cron-job.org) (hoặc [https://uptimerobot.com](https://uptimerobot.com)).
2. Đăng ký tài khoản miễn phí.
3. Bấm **Create Cronjob**:
   * **Title:** `Keep Smart Tourism Alive`
   * **URL:** `https://smart-tourism-api.onrender.com/api/v1/health` *(thay bằng domain Render của bạn)*
   * **Schedule:** Chọn `Every 10 minutes` (Mỗi 10 phút ping 1 lần).
4. Bấm **Create**. Xong! Backend của bạn sẽ luôn thức và hoạt động 24/7/365.

---

## 🔄 CƠ CHẾ CI/CD TỰ ĐỘNG CẬP NHẬT TỪ NAY VỀ SAU

Từ thời điểm này, mỗi khi bạn phát triển tính năng mới hoặc chỉnh sửa mã nguồn:
```bash
git add .
git commit -m "Thêm tính năng mới"
git push origin main
```
1. **GitHub Actions** sẽ tự động kích hoạt workflow kiểm thử code.
2. **Vercel** sẽ tự động bắt Webhook, build lại Frontend và deploy bản mới nhất sau ~45 giây.
3. **Render** sẽ tự động bắt Webhook, build lại Backend Docker và cập nhật API sau ~2-3 phút.

Toàn bộ quy trình hoàn toàn tự động, khép kín và không tốn bất kỳ chi phí nào!

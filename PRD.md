# 📘 TÀI LIỆU YÊU CẦU SẢN PHẨM (PRODUCT REQUIREMENTS DOCUMENT - PRD)
## DỰ ÁN: SAIGON WHISPERS — THÌ THẦM SÀI GÒN
### Hệ Thống Du Lịch & Ẩm Thực Thông Minh Quận 4, TP. Hồ Chí Minh

---

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Tên sản phẩm** | **Saigon Whispers** *(Thì Thầm Sài Gòn — Du lịch thông minh Quận 4)* |
| **Mã dự án** | `SMART-TOURS-Q4` |
| **Phiên bản tài liệu** | `1.2.0 (Official Modular Architecture — Code-Grounded)` |
| **Thời điểm phê duyệt** | Tháng 11 / 2026 |
| **Tình trạng mã nguồn** | Production Ready (`v0.5.0-SNAPSHOT` Spring Boot Backend & Next.js 15 Frontend) |
| **Kiến trúc phân hệ** | Chuẩn hóa thành **8 Phân hệ Nghiệp vụ độc lập** |
| **Hạ tầng kỹ thuật** | Docker Container, Neon PostgreSQL 17 + PostGIS 3.5, Redis 7, Esri GIS, Google Gemini AI |

---

## 📑 MỤC LỤC TỔNG QUAN

1. [TỔNG QUAN HỆ THỐNG & TẦM NHÌN](#1-tổng-quan-hệ-thống--tầm-nhìn)
2. [ĐỐI TƯỢNG NGƯỜI DÙNG (ACTORS & ROLES)](#2-đối-tượng-người-dùng-actors--roles)
3. [KIẾN TRÚC KỸ THUẬT & CƠ SỞ DỮ LIỆU](#3-kiến-trúc-kỹ-thuật--cơ-sở-dữ-liệu)
4. [ĐẶC TẢ CHI TIẾT 8 PHÂN HỆ NGHIỆP VỤ](#4-đặc-tả-chi-tiết-8-phân-hệ-nghiệp-vụ)
   * [Phân hệ 1: Xác thực & Quản lý Danh tính (Auth & Identity)](#phân-hệ-1-xác-thực--quản-lý-danh-tính-auth--identity)
   * [Phân hệ 2: Bản đồ Tương tác & Dẫn đường Không gian (Web-GIS & Navigation)](#phân-hệ-2-bản-đồ-tương-tác--dẫn-đường-không-gian-web-gis--navigation)
   * [Phân hệ 3: Dữ liệu Điểm đến & Khám phá Du lịch (POI & Content Discovery)](#phân-hệ-3-dữ-liệu-điểm-đến--khám-phá-du-lịch-poi--content-discovery)
   * [Phân hệ 4: Thuyết minh Âm thanh Định vị Tự động (GPS Audio Geofencing)](#phân-hệ-4-thuyết-minh-âm-thanh-định-vị-tự-động-gps-audio-geofencing)
   * [Phân hệ 5: Trí tuệ Nhân tạo & Gợi ý Ẩm thực (Gemini AI & Food Budgeting)](#phân-hệ-5-trí-tuệ-nhân-tạo--gợi-ý-ẩm-thực-gemini-ai--food-budgeting)
   * [Phân hệ 6: Tour Tham quan & Lộ trình Cá nhân hóa (Curated & Custom Tours)](#phân-hệ-6-tour-tham-quan--lộ-trình-cá-nhân-hóa-curated--custom-tours)
   * [Phân hệ 7: Tương tác Cộng đồng & Gamification (Community & Engagement)](#phân-hệ-7-tương-tác-cộng-đồng--gamification-community--engagement)
   * [Phân hệ 8: Trung tâm Điều hành & Quản trị Nội dung (Admin CMS & Telemetry)](#phân-hệ-8-trung-tâm-điều-hành--quản-trị-nội-dung-admin-cms--telemetry)
5. [DANH MỤC TÍNH NĂNG CHỜ KÍCH HOẠT (BACKEND-READY BACKLOG)](#5-danh-mục-tính-năng-chờ-kích-hoạt-backend-ready-backlog)
6. [TIÊU CHUẨN NGHIỆM THU (ACCEPTANCE CRITERIA)](#6-tiêu-chuẩn-nghiệm-thu-acceptance-criteria)

---

## 1. TỔNG QUAN HỆ THỐNG & TẦM NHÌN

**Saigon Whispers** được định vị là **Người bạn đồng hành bỏ túi thông minh** (*Smart Pocket Guide*) dành cho du khách khám phá Quận 4, TP. Hồ Chí Minh. Hệ thống ứng dụng công nghệ Web-GIS tiên tiến, định vị GPS vệ tinh kích hoạt thuyết minh âm thanh rảnh tay, và Trí tuệ Nhân tạo thế hệ mới (Google Gemini Multimodal AI) nhằm:
1. Giải quyết triệt để bài toán **lạc đường trong mạng lưới ngõ hẻm chằng chịt** của Quận 4.
2. Tự động cất lời thuyết minh lịch sử tại chỗ khi du khách đi bộ ngang qua di tích mà **không cần hướng dẫn viên đi kèm**.
3. Tư vấn ẩm thực thông minh, giải quyết bài toán **chọn món ngon chuẩn vị khớp chính xác với ngân sách cá nhân**.
4. Cung cấp kênh dữ liệu **điều hành và giám sát mật độ du khách thời gian thực (Realtime SSE)** cho Ban Quản trị.

---

## 2. ĐỐI TƯỢNG NGƯỜI DÙNG (ACTORS & ROLES)

| Nhóm Actor | Vai trò hệ thống | Cơ chế định danh | Phạm vi truy cập |
| :--- | :--- | :--- | :--- |
| **Khách vãng lai** *(Guest)* | Du khách lần đầu mở ứng dụng trên điện thoại. | `deviceId` UUID tự sinh trong `localStorage`, bảng `guest_devices`. | Xem bản đồ, dẫn đường, nghe thuyết minh GPS tự động, gợi ý món AI, trải nghiệm tour. |
| **Khách thành viên** *(Registered Member)* | Du khách gắn bó, thích tích lũy kỷ niệm. | Đăng nhập Google 1-Tap / OAuth2 (`ROLE_USER`). | Toàn quyền khách vãng lai + Lưu yêu thích, Check-in GPS thực tế săn Huy hiệu, Viết đánh giá sao. |
| **Quản trị viên** *(Admin)* | Cán bộ quản lý dữ liệu du lịch & điều hành. | Đăng nhập tài khoản Quản trị (`ROLE_ADMIN`). | Truy cập `/admin`, quản trị POI/thực đơn, AI OCR menu, xóa cache Redis, theo dõi du khách trực tuyến. |

---

## 3. KIẾN TRÚC KỸ THUẬT & CƠ SỞ DỮ LIỆU

### 3.1 Ngăn xếp Công nghệ (Technology Stack)
* **Frontend**: Next.js 15 (App Router), React 19, TypeScript, TailwindCSS v4, Leaflet.
* **Bản đồ nền**: **Esri World Street Map** (`server.arcgisonline.com`) — Hiển thị sạch sẽ, zero-clutter, giữ trọn vẹn tên đường phố và ngõ hẻm Quận 4 tiếng Việt.
* **Backend**: Spring Boot 3.5 (Java 17), Spring Security (JWT Stateless), HikariCP, SseEmitter (Realtime SSE).
* **Cơ sở dữ liệu**: PostgreSQL 17 kết hợp phần mở rộng không gian **PostGIS 3.5** (`Point`, chỉ mục `GIST`, hàm `ST_DWithin`, `ST_Distance`).
* **Cache & Bộ nhớ đệm**: Redis 7 (lưu cache POI, Menu, Tour, danh sách active visitors).
* **Dịch vụ tích hợp**: Google Gemini AI (`gemini-2.5-flash`, Gemini Vision OCR), OSRM Foot Routing.

---

## 4. ĐẶC TẢ CHI TIẾT 8 PHÂN HỆ NGHIỆP VỤ

---

### Phân hệ 1: Xác thực & Quản lý Danh tính (Auth & Identity)
* **Mục tiêu**: Định danh linh hoạt không rào cản, tối ưu trải nghiệm chạm trên điện thoại di động.
* **Thành phần mã nguồn**:
  - Backend: `AuthController.java`, `AuthService.java`, `JwtTokenProvider.java`.
  - Frontend: `AuthContext.tsx`, `LoginModal.tsx`, `LoginForm.tsx`, `UserMenu.tsx`, `AdminLoginGuard.tsx`.
* **Tính năng thực tế đang hoạt động (Active)**:
  1. **Phiên Khách vãng lai (`POST /api/v1/auth/guest-session`)**: Tự động cấp mã UUID lưu trong `localStorage` (`sw_device_id`), ghi nhận vào bảng `guest_devices`. Dùng được ngay 100% bản đồ mà không cần đăng ký.
  2. **Đăng nhập Google 1-Tap (`POST /api/v1/auth/oauth2/google`)**: Đăng nhập nhanh bằng tài khoản Google, tự động tạo hồ sơ bảng `users`, cấp phát JWT Bearer Token (`ROLE_USER`).
  3. **Đăng nhập Quản trị viên (`POST /api/v1/auth/admin-login`)**: Xác thực tài khoản quản trị hệ thống tại `/admin`, cấp JWT Bearer Token (`ROLE_ADMIN`).
  4. **Thanh Header Người dùng**: Hiển thị avatar chữ cái viết tắt, tên hiển thị `displayName`, huy hiệu vai trò (`Thành viên` / `⚡ Admin`), menu dropdown và nút đăng xuất nhanh (`🚪`).

---

### Phân hệ 2: Bản đồ Tương tác & Dẫn đường Không gian (Web-GIS & Navigation)
* **Mục tiêu**: Cung cấp giao diện bản đồ du lịch trực quan, định vị GPS chính xác và dẫn đường đi bộ luồn lách qua các ngõ hẻm Quận 4.
* **Thành phần mã nguồn**:
  - Backend: Tọa độ không gian WGS84 lưu kiểu `GEOMETRY(Point, 4326)` trong PostGIS.
  - Frontend: `Map.tsx`, `MapControls.tsx`, `CustomMarker.tsx`, `RouteInfoCard.tsx`, thư viện thuật toán `routing.ts`.
* **Tính năng thực tế đang hoạt động (Active)**:
  1. **Lớp bản đồ nền chuyên dụng Esri**: Tải mượt mà, loại bỏ triệt để các chấm ghim quảng cáo thương mại ngoài dự án, bảo toàn dữ liệu ngõ hẻm Quận 4.
  2. **Định vị & Theo dõi vị trí GPS**: Tự động bắt vị trí du khách qua `navigator.geolocation.watchPosition()`.
  3. **Bảng giả lập GPS Quận 4**: Hỗ trợ chọn nhanh các tọa độ mẫu tại Quận 4 để trải nghiệm và nghiệm thu từ xa.
  4. **Dẫn đường đi bộ ngõ hẻm OSRM Foot Routing**:
     - Gửi yêu cầu tới `routing.openstreetmap.de/routed-foot`.
     - Bóc tách tọa độ GeoJSON vẽ đường nét đứt màu xanh dương.
     - Tự động dịch chỉ dẫn rẽ sang tiếng Việt (*Rẽ trái, rẽ phải, đi thẳng...*), hiển thị khoảng cách và thời gian ước tính (ETA).

---

### Phân hệ 3: Dữ liệu Điểm đến & Khám phá Du lịch (POI & Content Discovery)
* **Mục tiêu**: Số hóa, hiển thị và tra cứu toàn diện các danh lam thắng cảnh, di tích lịch sử và quán ẩm thực tại Quận 4.
* **Thành phần mã nguồn**:
  - Backend: `PoiController.java`, `CategoryController.java`, `PoiTypeController.java`.
  - Frontend: `PlacesTab.tsx`, `FoodTab.tsx`, `PoiDetailModal.tsx`, `PoiInfoTab.tsx`, `PoiPhotosTab.tsx`.
* **Tính năng thực tế đang hoạt động (Active)**:
  1. **Lấy danh mục điểm đến (`GET /api/v1/categories`)**: Nhóm theo Ẩm thực, Lịch sử, Tôn giáo, Cà phê...
  2. **Tìm kiếm & Bộ lọc nâng cao (`GET /api/v1/pois/search`)**: Tìm kiếm theo từ khóa, lọc theo Danh mục, loại điểm đến, sắp xếp theo độ phổ biến.
  3. **Xem chi tiết Địa điểm (`GET /api/v1/pois/{id}`)**: Trả về tên, địa chỉ, bài thuyết minh văn hóa, giờ hoạt động, khoảng giá, điểm đánh giá sao, album ảnh và liên kết audio.
  4. **Xem Thực đơn Quán ăn (`GET /api/v1/pois/{poiId}/menu`)**: Trả về danh sách món ăn, món đặc sản chữ ký (`is_signature`), giá tiền và ảnh minh họa.

---

### Phân hệ 4: Thuyết minh Âm thanh Định vị Tự động (GPS Audio Geofencing)
* **Mục tiêu**: Hoạt động như một hướng dẫn viên ảo bản địa, tự động cất tiếng thuyết minh khi du khách đi bộ ngang qua di tích.
* **Thành phần mã nguồn**:
  - Backend: `AudioController.java`, `AudioService.java` (HTTP Chunked Streaming `Accept-Ranges: bytes`).
  - Frontend: `Map.tsx` (Logic Geofencing `dist <= 30`), `PoiDetailModal.tsx` (`<audio>` player), `PoiAudioTab.tsx`.
* **Tính năng thực tế đang hoạt động (Active)**:
  1. **Kích hoạt tự động Geofence $\le 30\text{m}$**: Tính khoảng cách trắc địa Haversine liên tục theo thời gian thực; khi $d \le 30\text{m}$, tự động phát âm thanh giới thiệu.
  2. **Cơ chế chống lặp & Hàng đợi**: Lưu vết ID điểm đã phát (`playedPoiIds`) trong phiên để tránh phát lại khi đứng yên; hỗ trợ hàng đợi phát liên tiếp nếu đi qua nhiều điểm gần nhau.
  3. **Phát trực tiếp Chunked Audio (`GET /api/v1/audio/stream/{poiId}`)**: Tải từng phân đoạn nhỏ (byte range), phát tức thì trong $< 300\text{ms}$ mà không cần tải hết file.
  4. **Ghi nhận thống kê lượt nghe (`POST /api/v1/analytics/listen`)**: Thu thập số lượt nghe và số giây đã nghe để phục vụ báo cáo.

---

### Phân hệ 5: Trí tuệ Nhân tạo & Gợi ý Ẩm thực (Gemini AI & Food Budgeting)
* **Mục tiêu**: Cung cấp kênh trò chuyện thông minh hỏi đáp văn hóa và thuật toán gợi ý món ăn vừa miệng, vừa vặn với túi tiền.
* **Thành phần mã nguồn**:
  - Backend: `AiController.java`, `AiService.java`, `AiContextRepository.java`.
  - Frontend: `AiAssistantModal.tsx`, `PoiAiTab.tsx`.
* **Tính năng thực tế đang hoạt động (Active)**:
  1. **Trợ lý Du lịch Ảo RAG (`POST /api/v1/ai/ask`)**: Nạp ngữ cảnh dữ liệu di tích và văn hóa lịch sử thật của Quận 4 vào Gemini AI để trả lời chính xác, không bịa đặt thông tin.
  2. **Gợi ý món ăn theo Slider Ngân sách (`POST /api/v1/ai/recommend-dish`)**:
     - Du khách kéo chọn số tiền (từ 30.000đ đến 500.000đ) và số lượng người ăn (1 - 10 người).
     - AI tính toán đề xuất combo món ngon, hiển thị số tiền dự kiến và **số tiền dư còn lại**.
     - Cung cấp nút **"Xem quán →"** tự động đóng modal và xoay bản đồ tập trung vào quán ăn tương ứng.
  3. **Cơ chế Fallback Cục bộ**: Nếu Gemini mất mạng hoặc hết quota, thuật toán Greedy nội bộ tự động chọn món đặc sắc nhất đảm bảo không bao giờ báo lỗi trắng màn hình.

---

### Phân hệ 6: Tour Tham quan & Lộ trình Cá nhân hóa (Curated & Custom Tours)
* **Mục tiêu**: Định hình các tuyến tham quan trọn gói theo chủ đề và tự động lập lịch trình tối ưu theo quỹ thời gian của du khách.
* **Thành phần mã nguồn**:
  - Backend: `TourController.java`, `TourService.java`.
  - Frontend: `ToursTab.tsx`, `TourDetailModal.tsx`, `CustomTourModal.tsx`, `UserManualTourModal.tsx`.
* **Tính năng thực tế đang hoạt động (Active)**:
  1. **Danh mục Tour theo Chủ đề (`GET /api/v1/tours`)**: Phân loại theo Ẩm thực đêm, Di tích lịch sử, Tuyến tâm linh...
  2. **Chi tiết Chặng dừng (`GET /api/v1/tours/{tourId}`)**: Xem lộ trình các điểm đến theo thứ tự dừng `stop_order`, thời gian lưu trú ước tính và ghi chú trải nghiệm.
  3. **Tự động Lập Lộ trình Cá nhân hóa (`POST /api/v1/tours/custom-plan`)**: Du khách nhập số phút rảnh rỗi (ví dụ: 120 phút), hệ thống tự động tính toán khoảng cách và sắp xếp danh sách điểm ghé thăm vừa khớp với thời gian rảnh.
  4. **Tạo Tour Thủ công & Xóa Tour (`POST /api/v1/tours`, `DELETE /api/v1/tours/{tourId}`)**: Hỗ trợ tạo tour mới hoặc xóa tour.
  5. **Kích hoạt Đi Tour trên Bản đồ**: Tải toàn bộ tọa độ chặng dừng lên `Map.tsx` để dẫn đường liên hoàn từng chặng.

---

### Phân hệ 7: Tương tác Cộng đồng & Gamification (Community & Engagement)
* **Mục tiêu**: Gia tăng tính gắn kết, khuyến khích du khách khám phá Quận 4 qua cơ chế Check-in GPS thực tế và sưu tầm huy hiệu thành tích.
* **Thành phần mã nguồn**:
  - Backend: `CommunityController.java`, `CommunityService.java`.
  - Frontend: `PoiDetailModal.tsx`, `FavoritesModal.tsx`, `PoiReviewsTab.tsx`, `ToursTab.tsx`.
* **Tính năng thực tế đang hoạt động (Active)**:
  1. **Xác thực Check-in GPS Bán kính $\le 30\text{m}$ (`POST /api/v1/pois/{poiId}/checkin`)**: Kiểm tra khoảng cách số học nghiêm ngặt trên server; từ chối nếu đứng xa quá 30m.
  2. **Bộ 5 Huy hiệu Thành tích Độc quyền**:
     - 🏅 **`FIRST_CHECKIN`**: *Bước Chân Đầu Tiên* (Check-in lần đầu tại Quận 4).
     - 🍲 **`FOODIE_OC`**: *Thổ Địa Phố Ốc* (Check-in tại phố ốc Vĩnh Khánh / ẩm thực).
     - 🏛️ **`HISTORIAN`**: *Nhà Thám Hiểm Lịch Sử* (Check-in tại di tích lịch sử).
     - ⛩️ **`PILGRIM`**: *Dấu Ấn Tâm Linh* (Check-in tại cơ sở tôn giáo, chùa, nhà thờ).
     - 🌟 **`DISTRICT_EXPLORER`**: *Chuyên Gia Khám Phá Quận 4* (Tích lũy từ 3 lượt check-in khác nhau trở lên).
  3. **Lưu & Quản lý Địa điểm Yêu thích (`POST / DELETE /api/v1/pois/{poiId}/favorite`, `GET /api/v1/users/me/favorites`)**: Đánh dấu hoặc xem lại các điểm đến ưa thích.
  4. **Đánh giá sao & Nhận xét (`POST / GET /reviews`)**: Đánh giá từ 1 đến 5 sao cho điểm đến và tour du lịch.

---

### Phân hệ 8: Trung tâm Điều hành & Quản trị Nội dung (Admin CMS & Telemetry)
* **Mục tiêu**: Trao quyền cho Ban Quản lý cập nhật nội dung, số hóa menu vỉa hè thần tốc bằng AI Vision, quản lý cache Redis và theo dõi lưu lượng du khách trực tuyến.
* **Thành phần mã nguồn**:
  - Backend: `AdminPoiController.java`, `AdminMenuController.java`, `AdminCacheController.java`, `AdminUserController.java`, `AnalyticsController.java`.
  - Frontend: `app/admin/page.tsx`, `AdminSidebar.tsx`, `AdminDashboardView.tsx`, `AdminPoisView.tsx`, `AdminMenuView.tsx`, `AdminToursView.tsx`, `AdminUsersView.tsx`, `AdminSettingsView.tsx`.
* **Tính năng thực tế đang hoạt động (Active)**:
  1. **Quản trị POI Toàn diện**: Thêm mới, chỉnh sửa, xóa, upload album nhiều ảnh, upload file audio trực tiếp cho từng di tích.
  2. **Quét OCR Thực đơn bằng Gemini Vision (`POST /api/v1/admin/pois/{poiId}/menu/scan-ocr`)**: Upload ảnh menu/bảng hiệu quán ăn, AI tự động bóc tách tên món ăn, suy luận khoảng giá và tự điền vào danh sách duyệt chỉ bằng 1 click.
  3. **Thêm & Xóa món ăn**: Thêm món đơn lẻ (`POST /admin/pois/{id}/dishes`), xóa món (`DELETE /admin/dishes/{dishId}`).
  4. **Quản trị Danh mục & Loại điểm**: Tạo, sửa, xóa Category và PoiType qua các modal quản trị chuyên dụng.
  5. **Nút Thao Tác Nhanh ⚡ Xóa Cache Redis (`POST /api/v1/admin/cache/evict`)**: Nút bấm màu cam nổi bật trên topbar; xóa tức thì 3 nhóm keys `poi:*`, `menu:*`, `tour:*` để dữ liệu mới cập nhật có hiệu lực ngay với du khách.
  6. **Đo đạc & Giám sát Du khách Trực tuyến (Realtime Telemetry)**:
     - Heartbeat Ping 30s (`POST /api/v1/analytics/realtime/ping`) & Beacon Leave khi đóng tab (`POST /api/v1/analytics/realtime/leave`).
     - Kênh truyền trực tiếp Server-Sent Events (SSE) `/api/v1/analytics/realtime/visitors`: Cập nhật số lượng người đang truy cập web theo thời gian thực trên Dashboard.
     - Bản đồ nhiệt (Heatmap) và thống kê KPI (`getHeatmap`, `getDashboardSummary`).
  7. **Quản lý Tài khoản Người dùng (`GET /api/v1/admin/users`)**: Xem danh sách thành viên trong hệ thống.

---

## 5. DANH MỤC TÍNH NĂNG CHỜ KÍCH HOẠT (BACKEND-READY BACKLOG)

Dưới đây là các tính năng đã được lập trình sẵn ở Backend nhưng Frontend chưa tích hợp UI:

1. **Hỏi đáp AI bằng Giọng nói hai chiều (`POST /api/v1/ai/ask-voice`)**: Backend có thể nhận file âm thanh thu âm từ du khách và phát lại audio câu trả lời của AI.
2. **Ghi nhận thời gian nán lại Dwell Time (`POST /api/v1/analytics/dwell`)**: Backend có bảng `dwell_logs` để đo đạc thời gian dừng chân chi tiết theo từng phút của du khách.
3. **Tải gói âm thanh ngoại tuyến (`GET /api/v1/audio/offline-pack`)**: Backend có khả năng đóng gói nén ZIP toàn bộ file âm thanh phục vụ du khách khi mất sóng 4G.
4. **Nhập thực đơn hàng loạt từ CSV/Excel (`POST /api/v1/admin/pois/{poiId}/menu/batch-import`)**: Backend đã sẵn sàng hàm import số lượng lớn món ăn từ file bảng tính.
5. **Chỉnh sửa hồ sơ cá nhân (`PUT /api/v1/users/me`)**: Cập nhật thông tin họ tên, số điện thoại của người dùng trên database.

---

## 6. TIÊU CHUẨN NGHIỆM THU (ACCEPTANCE CRITERIA)

| Mã Kiểm Thử | Tên Kịch Bản Nghiệm Thu | Tiêu Chuẩn Đạt (Pass Criteria) | Phân Hệ Phụ Trách |
| :--- | :--- | :--- | :--- |
| **AC-01** | Trải nghiệm Khách vãng lai | Mở web $\rightarrow$ Tự cấp `deviceId` $\rightarrow$ Xem ngay bản đồ và POI không cần login. | Phân hệ 1, 2 |
| **AC-02** | Thuyết minh Geofence tự động | Di chuyển GPS vào bán kính $\le 30\text{m}$ $\rightarrow$ Audio tự động phát trong $< 1\text{s}$, không lặp lại khi đứng yên. | Phân hệ 4 |
| **AC-03** | Gợi ý món ăn theo Ngân sách | Kéo slider chọn 80.000đ cho 2 người $\rightarrow$ Trả về combo món $\le 80.000$đ, hiển thị rõ số tiền dư và nút "Xem quán →". | Phân hệ 5 |
| **AC-04** | Dẫn đường đi bộ OSRM | Bấm "Chỉ đường" $\rightarrow$ Hiển thị Polyline trọn tuyến trên nền Esri, danh sách rẽ tiếng Việt, cự ly và ETA. | Phân hệ 2 |
| **AC-05** | Xác thực Check-in & Huy hiệu | Đứng cự ly $\le 30\text{m}$ bấm check-in $\rightarrow$ Thành công và mở khóa huy hiệu. Đứng xa $> 30\text{m}$ $\rightarrow$ Báo lỗi cự ly. | Phân hệ 7 |
| **AC-06** | Đăng nhập Google 1-Tap | Bấm Đăng nhập $\rightarrow$ Chọn tài khoản Google $\rightarrow$ Tự động cấp JWT, hiển thị Avatar viết tắt và tên trên header. | Phân hệ 1 |
| **AC-07** | Giám sát Du khách Trực tuyến SSE | Du khách mở web $\rightarrow$ Topbar Admin nhảy số người trực tuyến theo thời gian thực qua luồng SSE. | Phân hệ 8 |
| **AC-08** | Admin AI OCR Menu & Xóa Cache | Admin upload ảnh menu $\rightarrow$ Gemini Vision bóc tách món; bấm **⚡ Xóa Cache** $\rightarrow$ Hệ thống làm mới tức thì dữ liệu Redis. | Phân hệ 8 |

# 📘 TÀI LIỆU YÊU CẦU SẢN PHẨM (PRODUCT REQUIREMENTS DOCUMENT - PRD)
## DỰ ÁN: SAIGON WHISPERS — THÌ THẦM SÀI GÒN
### Hệ Thống Du Lịch & Ẩm Thực Thông Minh Quận 4, TP. Hồ Chí Minh

---

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Tên sản phẩm** | **Saigon Whispers** *(Thì Thầm Sài Gòn — Du lịch thông minh Quận 4)* |
| **Mã dự án** | `SMART-TOURS-Q4` |
| **Phiên bản tài liệu** | `1.0.0 (Official Baseline)` |
| **Thời điểm phê duyệt** | Tháng 11 / 2026 |
| **Tình trạng mã nguồn** | Production Ready (`v0.5.0-SNAPSHOT` Backend & Next.js 15 Frontend) |
| **Đối chiếu thiết kế** | Đồng bộ 100% với [`usecase.drawio`](file:///e:/smart-tourism/usecase.drawio), [`dfd.drawio`](file:///e:/smart-tourism/dfd.drawio), [`activity.drawio`](file:///e:/smart-tourism/activity.drawio) |

---

## 📑 MỤC LỤC TỔNG QUAN

1. [TỔNG QUAN & BỐI CẢNH SẢN PHẨM](#1-tổng-quan--bối-cảnh-sản-phẩm)
2. [ĐỐI TƯỢNG NGƯỜI DÙNG & CHÂN DUNG PERSONAS](#2-đối-tượng-người-dùng--chân-dung-personas)
3. [KIẾN TRÚC HỆ THỐNG & CƠ SỞ DỮ LIỆU](#3-kiến-trúc-hệ-thống--cơ-sở-dữ-liệu)
4. [ĐẶC TẢ CHI TIẾT 10 PHÂN HỆ NGHIỆP VỤ](#4-đặc-tả-chi-tiết-10-phân-hệ-nghiệp-vụ)
   * [4.1 Phân hệ 1: Xác thực & Quản lý Tài khoản (Auth & Identity)](#41-phân-hệ-1-xác-thực--quản-lý-tài-khoản-auth--identity)
   * [4.2 Phân hệ 2: Khám phá & Quản lý Điểm đến (POI Discovery & GIS)](#42-phân-hệ-2-khám-phá--quản-lý-điểm-đến-poi-discovery--gis)
   * [4.3 Phân hệ 3: Quản lý Ẩm thực & Gợi ý Món theo Ngân sách (Food & Budget AI)](#43-phân-hệ-3-quản-lý-ẩm-thực--gợi-ý-món-theo-ngân-sách-food--budget-ai)
   * [4.4 Phân hệ 4: Tour Du lịch & Lộ trình Tham quan (Curated & Custom Tours)](#44-phân-hệ-4-tour-du-lịch--lộ-trình-tham-quan-curated--custom-tours)
   * [4.5 Phân hệ 5: Bản đồ Tương tác & Dẫn đường Đi bộ (OSRM Foot Routing)](#45-phân-hệ-5-bản-đồ-tương-tác--dẫn-đường-đi-bộ-osrm-foot-routing)
   * [4.6 Phân hệ 6: Thuyết minh Âm thanh GPS Tự động (Audio Geofencing)](#46-phân-hệ-6-thuyết-minh-âm-thanh-gps-tự-động-audio-geofencing)
   * [4.7 Phân hệ 7: Trợ lý Du lịch Ảo AI (Gemini Assistant & RAG Context)](#47-phân-hệ-7-trợ-lý-du-lịch-ảo-ai-gemini-assistant--rag-context)
   * [4.8 Phân hệ 8: Tương tác Cộng đồng, Check-in & Huy hiệu (Gamification)](#48-phân-hệ-8-tương-tác-cộng-đồng-check-in--huy-hiệu-gamification)
   * [4.9 Phân hệ 9: Phân tích Lưu trú, Dwell Time & Báo cáo Realtime (Telemetry & Realtime Visitors)](#49-phân-hệ-9-phân-tích-lưu-trú-dwell-time--báo-cáo-realtime-telemetry--heatmap)
   * [4.10 Phân hệ 10: Quản trị Nội dung Admin CMS & AI OCR Ingestion](#410-phân-hệ-10-quản-trị-nội-dung-admin-cms--ai-ocr-ingestion)
5. [MA TRẬN PHÂN LOẠI YÊU CẦU (MOSCOW PRIORITIZATION)](#5-ma-trận-phân-loại-yêu-cầu-moscow-prioritization)
6. [YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS - NFRS)](#6-yêu-cầu-phi-chức-năng-non-functional-requirements---nfrs)
7. [QUY TẮC NGHIỆP VỤ & BẢO TOÀN DỮ LIỆU](#7-quy-tắc-nghiệp-vụ--bảo-toàn-dữ-liệu)
8. [TIÊU CHUẨN NGHIỆM THU (ACCEPTANCE CRITERIA)](#8-tiêu-chuẩn-nghiệm-thu-acceptance-criteria)

---

## 1. TỔNG QUAN & BỐI CẢNH SẢN PHẨM

### 1.1 Bối cảnh thực tiễn
Quận 4 (TP. Hồ Chí Minh) là vùng đất cù lao độc đáo với mạng lưới hẻm chằng chịt, sở hữu mật độ di tích lịch sử dày đặc (Bến Nhà Rồng, Cầu Mống, Đình Vĩnh Hội, Nhà thờ Xóm Chiếu...) cùng nền văn hóa ẩm thực đường phố trứ danh (Phố ốc Vĩnh Khánh, chợ 200 Xóm Chiếu, phá lấu bò Cô Thảo...).
Tuy nhiên, khách du lịch khi đến Quận 4 thường gặp các rào cản:
1. **Lạc lõng trong ngõ hẻm**: Bản đồ thương mại thông thường (Google Maps) ưu tiên đường ô tô/xe máy, không tối ưu cho người đi bộ luồn lách hẻm sâu.
2. **Thiếu thuyết minh tại chỗ**: Nhiều di tích văn hóa không có bảng thuyết minh chi tiết hoặc hướng dẫn viên thường trực.
3. **Ẩm thực phong phú nhưng khó chọn lọc**: Du khách không biết ăn gì vừa đúng khẩu vị, vừa khớp với túi tiền/ngân sách cá nhân.
4. **Thiếu số liệu điều hành**: Ban quản lý du lịch thiếu dữ liệu đo đạc thời gian nán lại (Dwell Time) và mật độ du khách theo thời gian thực để phân luồng.

### 1.2 Tầm nhìn sản phẩm (Product Vision)
**Saigon Whispers** được định vị là **người bạn đồng hành thông minh bỏ túi** (*Smart Pocket Guide*), ứng dụng công nghệ Web-GIS hiện đại, thuyết minh âm thanh định vị vệ tinh tự động, và Trí tuệ Nhân tạo thế hệ mới (Google Gemini Multimodal AI) để kể lại câu chuyện lịch sử văn hóa sống động của Quận 4.

### 1.3 Mục tiêu trọng tâm (Key Objectives)
* **Trải nghiệm mượt mà không rào cản**: Cho phép khách vãng lai trải nghiệm ngay lập tức các tính năng cốt lõi (Bản đồ, Thuyết minh Geofence, Gợi ý món) mà không bắt buộc đăng ký phức tạp.
* **Định vị & Thuyết minh tự động rảnh tay (Hands-free Experience)**: Tự động phát âm thanh giới thiệu ngay khi du khách bước chân vào bán kính $\le 30\text{m}$ của di tích.
* **Tư vấn AI bám sát dữ liệu thật (Grounding RAG)**: Trợ lý ảo AI trả lời chuẩn xác dựa trên cơ sở dữ liệu ẩm thực, bảng giá và dữ liệu lịch sử đã xác thực của Quận 4, không bịa đặt thông tin.
* **Gamification thúc đẩy khám phá**: Xác thực GPS bán kính thực tế $\le 30\text{m}$ để trao tặng các huy hiệu thành tích độc quyền của Quận 4.

---

## 2. ĐỐI TƯỢNG NGƯỜI DÙNG & CHÂN DUNG PERSONAS

| Nhóm Actor | Mô tả vai trò | Đặc điểm & Hành vi | Nhu cầu chính |
| :--- | :--- | :--- | :--- |
| **Khách vãng lai** *(Guest User)* | Du khách lần đầu mở ứng dụng trên trình duyệt điện thoại. | Chưa tạo tài khoản, ngần ngại cung cấp thông tin cá nhân. | Xem ngay bản đồ, nghe thuyết minh tự động khi đi bộ, tìm nhanh quán ăn ngon gần mình. |
| **Khách thành viên** *(Registered User)* | Du khách đăng nhập bằng Google OAuth hoặc Telegram OTP. | Thích lưu dấu kỷ niệm, thích săn huy hiệu thành tích và đánh giá. | Lưu địa điểm yêu thích, check-in thực tế GPS nhận Huy hiệu Quận 4, viết nhận xét chấm sao. |
| **Quản trị viên / BQL** *(Admin)* | Cán bộ quản lý du lịch, cán bộ số hóa nội dung di tích. | Sử dụng máy tính bàn hoặc tablet để quản lý dữ liệu. | Quản lý danh mục POI, upload audio, quét OCR menu quán bằng AI, theo dõi số lượng khách trực tuyến Realtime. |

---

## 3. KIẾN TRÚC HỆ THỐNG & CƠ SỞ DỮ LIỆU

### 3.1 Kiến trúc Công nghệ (Stack)
* **Frontend**: Next.js 15 (App Router), React 19, TypeScript, TailwindCSS, React-Leaflet, Lucide Icons.
* **Backend**: Spring Boot 3.5 (Java 17), Spring Security, Jakarta Validation, Spring Data JDBC, HikariCP, SseEmitter (Realtime SSE).
* **Cơ sở dữ liệu**: PostgreSQL 17 kết hợp phần mở rộng không gian **PostGIS 3.5**.
* **Cache & Bộ nhớ đệm**: Redis 7 (lưu Cache danh mục POI, menu, phiên khách online `activeVisitorsMap`).
* **Dịch vụ tích hợp bên thứ ba (Third-party Services)**:
  * Google Gemini AI (`gemini-3.5-flash-lite` cho văn bản & RAG, `Gemini Multimodal Vision` cho quét OCR menu).
  * OSRM API (`routing.openstreetmap.de/routed-foot` cho thuật toán tìm đường đi bộ).
  * Telegram Bot API (Gửi mã xác thực OTP 6 số bảo mật).
  * Microsoft Edge-TTS / Audio Stream (Tổng hợp giọng nói thuyết minh).

### 3.2 Bảng phân loại 19 Bảng Dữ liệu Cơ sở (`schema.sql`)

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        CƠ SỞ DỮ LIỆU BẢN ĐỒ D4                         │
├────────────────────┬────────────────────┬──────────────────────────────┤
│ Nhóm Người Dùng    │ Nhóm Bản Đồ & POI  │ Nhóm Ẩm Thực & Món Ăn        │
│ • users            │ • categories       │ • menu_categories            │
│ • guest_devices    │ • poi_types        │ • dishes                     │
│                    │ • pois             │ • dish_images                │
│                    │ • poi_images       │                              │
│                    │ • poi_audios       │                              │
├────────────────────┼────────────────────┼──────────────────────────────┤
│ Nhóm Tour & Tuyến  │ Nhóm Tương Tác     │ Nhóm Thống Kê & Lưu Trú      │
│ • tours            │ • reviews          │ • audio_listen_logs          │
│ • tour_stops       │ • tour_reviews     │ • dwell_logs                 │
│                    │ • favorites        │                              │
│                    │ • checkins         │                              │
│                    │ • user_badges      │                              │
└────────────────────┴────────────────────┴──────────────────────────────┘
```

---

## 4. ĐẶC TẢ CHI TIẾT 10 PHÂN HỆ NGHIỆP VỤ

### 4.1 Phân hệ 1: Xác thực & Quản lý Tài khoản (Auth & Identity)
* **Mục tiêu**: Cung cấp cơ chế định danh linh hoạt, bảo mật và thân thiện từ khách vãng lai đến thành viên chính thức.
* **Đối tượng**: Khách vãng lai, Khách du lịch thành viên, Quản trị viên.
* **Chức năng chính**:
  1. **Khách vãng lai (`POST /api/v1/auth/guest-session`)**: Tự động sinh `deviceId` (UUID) và lưu vào bảng `guest_devices`. Cấp mã phiên để duy trì trạng thái nghe audio và dwell time.
  2. **Đăng nhập Google OAuth2 (`POST /api/v1/auth/oauth2/google`)**: Tiếp nhận `idToken`, giải mã danh tính Google, tạo mới hoặc cập nhật hồ sơ trong bảng `users`, trả về JWT Token (`ROLE_USER`).
  3. **Đăng nhập OTP qua Telegram Bot**:
     * Du khách nhập số điện thoại $\rightarrow$ Gọi `POST /api/auth/request-otp`.
     * Backend sinh ngẫu nhiên mã 6 chữ số, lưu tạm vào bộ nhớ (`otpStorage` với TTL 5 phút) và gửi trực tiếp qua Telegram Bot tới du khách.
     * Du khách nhập mã $\rightarrow$ Gọi `POST /api/auth/verify-otp`. Backend đối chiếu, nếu hợp lệ sẽ cấp JWT Token.
  4. **Đăng nhập Quản trị viên (`POST /api/v1/auth/admin-login`)**: Xác thực tài khoản Admin hệ thống, phân quyền `ROLE_ADMIN`.
  5. **Quản lý Hồ sơ cá nhân (`GET /api/v1/users/me`, `PUT /api/v1/users/me`)**: Xem và cập nhật họ tên, ảnh đại diện, số điện thoại.

---

### 4.2 Phân hệ 2: Khám phá & Quản lý Điểm đến (POI Discovery & GIS)
* **Mục tiêu**: Hiển thị, tìm kiếm và phân loại trực quan toàn bộ các danh lam thắng cảnh, di tích lịch sử, cơ sở tôn giáo và quán ẩm thực tại Quận 4.
* **Đối tượng**: Khách du lịch, Quản trị viên.
* **Chức năng chính**:
  1. **Tra cứu POI theo Viewport (`GET /api/v1/pois/in-viewport`)**: Truy vấn các điểm nằm trong khung nhìn bản đồ hiện tại dựa trên tọa độ giới hạn (`minLat, minLng, maxLat, maxLng`) nhằm tối ưu băng thông.
  2. **Tìm kiếm & Bộ lọc nâng cao (`GET /api/v1/pois/search`)**:
     * Lọc theo từ khóa (`keyword`).
     * Lọc theo danh mục (`categoryId`: Lịch sử, Tôn giáo, Ẩm thực, Check-in...).
     * Lọc theo loại điểm (`poiType`: HISTORICAL, RELIGIOUS, FOOD, LANDMARK).
     * Sắp xếp: Theo độ phổ biến (`popularity DESC`) hoặc theo cự ly gần nhất (`distance`).
  3. **Điểm đến lân cận (`GET /api/v1/pois/nearby`)**: Tính toán cự ly thực tế từ GPS du khách đến các điểm đến xung quanh bằng PostGIS.
  4. **Xem chi tiết Điểm đến (`GET /api/v1/pois/{id}`)**: Trả về toàn diện dữ liệu: tên, địa chỉ, mô tả lịch sử, giờ mở cửa, giá vé, điểm đánh giá sao trung bình (`avg_rating`), số lượt đánh giá (`review_count`), album ảnh (`poi_images`), file audio thuyết minh (`audio_url`).

---

### 4.3 Phân hệ 3: Quản lý Ẩm thực & Gợi ý Món theo Ngân sách (Food & Budget AI)
* **Mục tiêu**: Giúp du khách giải quyết bài toán "Ăn gì ở Quận 4 vừa ngon vừa hợp túi tiền" thông qua thuật toán AI tối ưu ngân sách.
* **Đối tượng**: Khách du lịch.
* **Luồng xử lý nghiệp vụ chuẩn (`activity.drawio` Tab 3)**:
  1. Du khách mở Tab **"Gợi ý theo ngân sách"** trên modal Trợ lý AI ([`AiAssistantModal.tsx`](file:///e:/smart-tourism/frontend/src/components/ai/AiAssistantModal.tsx)).
  2. Du khách kéo thanh **Slider ngân sách** (khoảng giá từ **30.000đ đến 500.000đ**, mặc định 100.000đ) và chọn số lượng người (`groupSize`: từ 1 đến 10).
  3. Frontend gửi request: `POST /api/v1/ai/recommend-dish` kèm `budget`, `groupSize`, `userLat`, `userLng`.
  4. Backend ([`AiService.java`](file:///e:/smart-tourism/backend/src/main/java/com/example/tourism/ai/service/AiService.java)):
     * Gọi `AiContextRepository.findCandidateDishes()` lấy danh sách món ăn từ các quán ẩm thực Quận 4.
     * Đóng gói System Prompt và dữ liệu món ăn gửi sang Google Gemini qua `geminiClient.generateJson()`.
     * **Xử lý phân nhánh:**
       * **Nếu Gemini sinh JSON thành công**: Bóc tách JSON thành `AiRecommendDishResponse` gồm tóm tắt thực đơn, combo món chọn lọc, tổng tiền ước tính (`totalEstimatedPrice`), và số tiền dư (`budgetRemaining`).
       * **Nếu lỗi mạng hoặc Gemini trả JSON không hợp lệ**: Tự động kích hoạt thuật toán Fallback cục bộ `generateFallbackRecommendations()`. Thuật toán sẽ sắp xếp món theo độ đặc sắc (`is_signature`), chọn từ 1 đến 3 món sao cho tổng giá không vượt quá ngân sách, tính số tiền dư: `budgetRemaining = Math.max(0, budget - totalEstimatedPrice)`.
  5. **Hiển thị kết quả**: Giao diện hiển thị rõ ràng:
     * 💰 **Tổng cộng**: Số tiền ước tính.
     * 💵 **Dư**: Số tiền còn lại trong ngân sách.
     * Danh sách thẻ món ăn kèm hình ảnh, giá bán, tên quán và nút **"Xem quán →"**.
  6. Khi bấm **"Xem quán →"**, hàm `onSelectPoi(dish.poiId)` được kích hoạt, tự động đóng modal và điều hướng bản đồ [`Map.tsx`](file:///e:/smart-tourism/frontend/src/components/map/Map.tsx) tập trung vào quán ăn tương ứng.

> [!IMPORTANT]
> Tuyệt đối không có thông báo lỗi hay ép buộc du khách phải "tăng tiền". Hệ thống luôn chủ động tối ưu và gợi ý combo món vừa vặn nhất với số tiền mà du khách đã chọn.

---

### 4.4 Phân hệ 4: Tour Du lịch & Lộ trình Tham quan (Curated & Custom Tours)
* **Mục tiêu**: Cung cấp các hành trình tham quan trọn gói theo chủ đề và khả năng tự động tạo lộ trình cá nhân hóa theo quỹ thời gian của du khách.
* **Đối tượng**: Khách du lịch, Quản trị viên.
* **Chức năng chính**:
  1. **Danh sách Tour theo Chủ đề (`GET /api/v1/tours`)**: Phân loại theo chủ đề (`FOOD`, `CULTURE`, `RELIGIOUS`, `LANDMARK`, `MIXED`).
  2. **Chi tiết lộ trình Tour (`GET /api/v1/tours/{tourId}`)**: Truy vấn các chặng dừng từ bảng `tour_stops`, sắp xếp theo `stop_order`. Mỗi chặng dừng chứa tên POI, hình ảnh, thời gian lưu trú dự kiến, và ghi chú trải nghiệm.
  3. **Tự động sinh Lộ trình Cá nhân hóa (`POST /api/v1/tours/custom-plan`)**:
     * Tiếp nhận thời gian rảnh của du khách (ví dụ: 120 phút), tọa độ bắt đầu, và sở thích.
     * Thuật toán Greedy nội bộ tính toán khoảng cách và thời gian di chuyển giữa các điểm lân cận để xây dựng một tour tối ưu nhất khớp với khung giờ đã chọn.
  4. **Kích hoạt Lộ trình trên Bản đồ**: Khi du khách chọn "Bắt đầu đi Tour", danh sách tọa độ các chặng dừng được chuyển tiếp sang phân hệ bản đồ để vẽ tuyến đường liên hoàn và bắt đầu hướng dẫn từng bước.
  5. **Đánh giá Tour (`POST /api/v1/tours/{tourId}/reviews`)**: Cho phép du khách chấm sao và gửi cảm nhận về chuyến đi.

---

### 4.5 Phân hệ 5: Bản đồ Tương tác & Dẫn đường Đi bộ (OSRM Foot Routing)
* **Mục tiêu**: Cung cấp giao diện bản đồ số trực quan, hỗ trợ định vị chính xác và dẫn đường đi bộ luồn lách qua các ngõ hẻm Quận 4.
* **Đối tượng**: Khách du lịch.
* **Đặc tả kỹ thuật luồng dẫn đường (`activity.drawio` Tab 5 & [`routing.ts`](file:///e:/smart-tourism/frontend/src/lib/routing.ts))**:
  1. **Định vị GPS du khách**:
     * Trình duyệt đọc vị trí từ `navigator.geolocation.watchPosition()`.
     * Tích hợp bảng **Test GPS giả lập** (Panel vị trí Quận 4) hỗ trợ du khách trải nghiệm thử nghiệm khi chưa đứng trực tiếp tại hiện trường.
  2. **Yêu cầu tìm đường**:
     * Khi bấm nút "Chỉ đường" tới một POI, hàm `fetchRoute(userPos, poi, 'walking')` được gọi.
     * Request gửi trực tiếp tới máy chủ OSRM:
       ```http
       GET https://routing.openstreetmap.de/routed-foot/route/v1/walking/{userLng},{userLat};{poiLng},{poiLat}?overview=full&geometries=geojson&steps=true
       ```
  3. **Giải mã & Hiển thị**:
     * Bóc tách mảng tọa độ `route.geometry.coordinates` $\rightarrow$ Vẽ đường nét đứt màu xanh dương trên nền bản đồ Leaflet.
     * Tự động căn chỉnh khung hình (`fitBounds`) hiển thị trọn vẹn điểm xuất phát và đích đến.
     * Dịch các chỉ dẫn rẽ sang tiếng Việt bằng hàm `getManeuverText()` (Rẽ trái, rẽ phải, đi thẳng, vào vòng xuyến...).
     * Hiển thị bảng chỉ đường tóm tắt: Khoảng cách (mét/km), Thời gian ước tính (phút), Giờ dự kiến đến nơi (ETA).

---

### 4.6 Phân hệ 6: Thuyết minh Âm thanh GPS Tự động (Audio Geofencing)
* **Mục tiêu**: Đóng vai trò như một thuyết minh viên bản địa ảo, tự động cất lời giới thiệu khi du khách đi bộ ngang qua các di tích lịch sử.
* **Đối tượng**: Khách du lịch.
* **Đặc tả kỹ thuật luồng Geofence (`activity.drawio` Tab 6 & [`Map.tsx`](file:///e:/smart-tourism/frontend/src/components/map/Map.tsx#L246-L265))**:
  1. Du khách bật chế độ **"Thuyết minh tự động (Auto-Guide)"** trên thanh điều khiển bản đồ.
  2. Hệ thống liên tục lắng nghe tọa độ GPS di chuyển và góc la bàn (`heading`).
  3. Với mỗi tọa độ mới, hàm `getDistance(userPos, [poi.lat, poi.lng])` tính toán khoảng cách trắc địa Haversine tới toàn bộ danh sách POI.
  4. **Điều kiện kích hoạt khắt khe**:
     * Bán kính Geofence: **$\le 30\text{ mét}$** (`item.dist <= 30`).
     * Kiểm tra chống lặp: Điểm đến chưa từng được phát trong phiên hiện tại (`!playedPoiIds.current.has(poi.id)`).
     * Kiểm tra hàng đợi: Điểm đến không trùng với audio đang phát hoặc đang chờ trong queue.
  5. **Thực thi phát Audio**:
     * Đẩy POI vào hàng đợi và nạp luồng phát: `GET /api/v1/audio/stream/{poiId}`.
     * Đánh dấu ID vào tập hợp đã phát (`playedPoiIds`).
     * Bắn bản tin ghi nhận thống kê lượt nghe: `POST /api/v1/analytics/listen` kèm `poiId`, `playbackSeconds`, `completed`.
  6. **Trình phát điều khiển**: Du khách có thể Play, Pause, Tua thanh thời gian, hoặc chuyển chế độ xem phụ đề thuyết minh dạng chữ (`transcript`).

---

### 4.7 Phân hệ 7: Trợ lý Du lịch Ảo AI (Gemini Assistant & RAG Context)
* **Mục tiêu**: Cung cấp kênh trò chuyện thông minh hỏi-đáp mọi thông tin về lịch sử, phong tục, giai thoại và ẩm thực Quận 4.
* **Đối tượng**: Khách du lịch.
* **Đặc tả luồng RAG & AI (`activity.drawio` Tab 7 & [`AiService.java`](file:///e:/smart-tourism/backend/src/main/java/com/example/tourism/ai/service/AiService.java))**:
  1. Du khách gửi câu hỏi bằng cách nhập văn bản hoặc chọn các chip câu hỏi nhanh (`QUICK_QUESTIONS`).
  2. Frontend gửi request: `POST /api/v1/ai/ask` chứa `question`, `poiId` (nếu đang đứng tại điểm), tọa độ `userLat`, `userLng`.
  3. **Truy xuất Ngữ cảnh Thực tế (RAG Context Ingestion)**:
     * `AiContextRepository` nạp thông tin POI, loại hình di tích, giờ mở cửa, giá vé, nội dung thuyết minh lịch sử đã xác thực, và thực đơn các món đặc sản kèm bảng giá.
     * Tính toán khoảng cách hiện tại của du khách đến di tích.
  4. **Kỹ thuật Prompt & Tương tác Gemini AI**:
     * Sử dụng model **`gemini-3.5-flash-lite`** kết hợp System Instruction đóng vai Hướng dẫn viên du lịch văn hóa Quận 4 uyên bác.
     * Gọi Google Generative Language API qua `geminiClient.generateText()`.
     * **Cơ chế Fallback**: Nếu lỗi kết nối bên ngoài, hệ thống kích hoạt hàm `generateFallbackAnswer()` trả về câu trả lời mẫu theo kịch bản để trải nghiệm người dùng không bị gián đoạn.
  5. **Phản hồi người dùng**:
     * Render câu trả lời định dạng Markdown đẹp mắt.
     * Hiển thị danh sách các câu hỏi gợi ý tiếp theo (`suggestedFollowUps`).
     * Tùy chọn nghe câu trả lời bằng giọng đọc nhân tạo (TTS).

---

### 4.8 Phân hệ 8: Tương tác Cộng đồng, Check-in & Huy hiệu (Gamification)
* **Mục tiêu**: Biến hành trình tham quan thành một chuyến phiêu lưu khám phá thông qua cơ chế Check-in GPS thực tế và sưu tầm huy hiệu Quận 4.
* **Đối tượng**: Khách du lịch đã đăng nhập.
* **Đặc tả luồng Check-in & Quy tắc Huy hiệu (`activity.drawio` Tab 8 & [`CommunityService.java`](file:///e:/smart-tourism/backend/src/main/java/com/example/tourism/community/service/CommunityService.java))**:
  1. Khi đứng tại di tích, du khách bấm nút **"Check-in tại đây"** trên modal điểm đến.
  2. Trình duyệt lấy tọa độ GPS thực tế và gọi `POST /api/v1/pois/{poiId}/checkin`.
  3. **Xác thực Khoảng cách Không gian**:
     * Backend tính cự ly Haversine giữa GPS người dùng và tọa độ POI: `distanceMeters = calculateHaversineDistance(...)`.
     * Ngưỡng quy định: **$\le 30.0\text{ mét}$** (`CHECKIN_MAX_DISTANCE_METERS = 30.0`).
     * **Nếu khoảng cách $> 30\text{m}$**: Từ chối check-in, trả về thông báo lỗi: *"Check-in thất bại: Bạn đang cách... (yêu cầu trong cự ly 30m để xác thực)"*.
     * **Nếu khoảng cách $\le 30\text{m}$**: Lưu bản ghi xác thực (`verified = true`) vào bảng `checkins`.
  4. **Quy tắc mở khóa 5 Huy hiệu Thành tích (Gamification Badges)**:

| Mã Huy Hiệu (`badge_code`) | Tên Danh Hiệu | Điều kiện mở khóa theo Code | Bảng lưu trữ |
| :--- | :--- | :--- | :--- |
| **`FIRST_CHECKIN`** | **Bước Chân Đầu Tiên** | Thực hiện thành công lượt check-in đầu tiên tại bất kỳ điểm nào của Quận 4. | `user_badges` |
| **`FOODIE_OC`** | **Thổ Địa Phố Ốc** | Check-in thành công tại các điểm ẩm thực thuộc danh mục ẩm thực / ốc Vĩnh Khánh (`categoryId = 1`). | `user_badges` |
| **`HISTORIAN`** | **Nhà Thám Hiểm Lịch Sử** | Check-in tại các điểm di tích lịch sử (`categoryId = 6` hoặc `poiType = 'HISTORICAL'`). | `user_badges` |
| **`PILGRIM`** | **Dấu Ấn Tâm Linh** | Check-in tại các ngôi chùa cổ, thánh đường lịch sử (`categoryId = 7` hoặc `poiType = 'RELIGIOUS'`). | `user_badges` |
| **`DISTRICT_EXPLORER`** | **Chuyên Gia Khám Phá Quận 4** | Tích lũy tối thiểu từ **3 lượt check-in** thực tế khác nhau trở lên trên khắp Quận 4. | `user_badges` |

  5. **Đánh giá & Yêu thích**:
     * Đánh giá sao từ 1 đến 5 sao kèm nhận xét (`POST /api/v1/pois/{poiId}/reviews`).
     * Đánh dấu / Bỏ đánh dấu địa điểm yêu thích (`POST / DELETE /api/v1/pois/{poiId}/favorite`).
     * Xem danh mục các địa điểm đã lưu yêu thích (`GET /api/v1/users/me/favorites`).

---

### 4.9 Phân hệ 9: Phân tích Lưu trú, Dwell Time & Báo cáo Realtime (Telemetry & Realtime Visitors)
* **Mục tiêu**: Thu thập hành vi di chuyển ẩn danh của du khách để đo lường độ hấp dẫn của các điểm đến và cung cấp số liệu thống kê thời gian thực cho Ban quản lý.
* **Đối tượng**: Khách du lịch (Client chạy ngầm), Quản trị viên BQL.
* **Đặc tả luồng đo đạc (`activity.drawio` Tab 9 & [`AnalyticsController.java`](file:///e:/smart-tourism/backend/src/main/java/com/example/tourism/analytics/controller/AnalyticsController.java))**:
  1. **Đo đạc thời gian nán lại (Dwell Time)**:
     * Client theo dõi thời gian du khách nán lại trong vùng bán kính của một điểm đến.
     * Khi du khách chuyển sang điểm khác, gửi bản tin `POST /api/v1/analytics/dwell` ghi nhận `poi_id`, `dwell_seconds`, `device_id` vào bảng `dwell_logs`.
  2. **Phiên trực tuyến Realtime (Heartbeat Ping)**:
     * Định kỳ mỗi 30 giây, Client gửi tín hiệu sống: `POST /api/v1/analytics/realtime/ping`.
     * Máy chủ ghi nhận vào bảng ánh xạ bộ nhớ đệm `activeVisitorsMap`.
  3. **Sự kiện rời trang (Beacon Leave)**:
     * Khi du khách đóng tab hoặc điều hướng thoát khỏi ứng dụng, sự kiện `beforeunload` hoặc `pagehide` kích hoạt gửi Beacon: `POST /api/v1/analytics/realtime/leave` (qua Next.js route `/api/realtime/leave`).
     * Máy chủ loại bỏ `deviceId` khỏi danh sách đang hoạt động.
  4. **Kênh truyền trực tiếp Server-Sent Events (SSE)**:
     * Quản trị viên kết nối tới `GET /api/v1/analytics/realtime/visitors`.
     * Định kỳ máy chủ broadcast tổng số lượng khách đang trực tuyến (`activeVisitorsCount`) tới toàn bộ màn hình điều hành.
  5. **Bản đồ nhiệt Mật độ du khách (Heatmap)**:
     * API `GET /api/v1/analytics/heatmap` tổng hợp dữ liệu từ `dwell_logs` và `pois` thành định dạng GeoJSON FeatureCollection phục vụ hiển thị lớp phủ nhiệt trên bản đồ quản trị.

---

### 4.10 Phân hệ 10: Quản trị Nội dung Admin CMS & AI OCR Ingestion
* **Mục tiêu**: Trao quyền cho Ban quản lý du lịch tự cập nhật điểm đến, upload audio và sử dụng AI Vision để số hóa thần tốc thực đơn các quán ăn vỉa hè.
* **Đối tượng**: Quản trị viên (Admin).
* **Chức năng chính**:
  1. **Quản trị POI toàn diện (`/api/v1/admin/pois`)**:
     * Tạo mới POI với hỗ trợ `multipart/form-data`: nạp tọa độ không gian (WGS84 `lat, lng`), thông tin lịch sử, ảnh đại diện.
     * Chỉnh sửa, cập nhật hoặc xóa POI.
     * Upload file âm thanh trực tiếp cho POI (`POST /api/v1/admin/pois/{id}/audio`).
  2. **Quét OCR Thực đơn bằng Gemini Multimodal Vision (`POST /api/v1/admin/pois/{poiId}/menu/scan-ocr`)**:
     * Admin chụp hoặc upload ảnh chụp bảng hiệu / menu quán ăn vỉa hè.
     * Backend gửi ảnh sang Google Gemini Vision. AI tự động đọc nhận dạng chữ viết tay/in, trích xuất tên món ăn, suy luận khoảng giá, nguyên liệu chính và cảnh báo chất gây dị ứng.
     * Trả về danh sách món nháp định dạng JSON để Admin đối chiếu và duyệt chỉ bằng 1 cú nhấp chuột.
  3. **Thêm món & Nhập thực đơn hàng loạt**:
     * Thêm món đơn lẻ (`POST /api/v1/admin/pois/{poiId}/dishes`).
     * Cập nhật món (`PUT /api/v1/admin/dishes/{dishId}`) hoặc Xóa món (`DELETE /api/v1/admin/dishes/{dishId}`).
     * Import hàng loạt từ CSV/Excel (`POST /api/v1/admin/pois/{poiId}/menu/batch-import`).
  4. **Quản trị Bộ nhớ đệm (`POST /api/v1/admin/cache/evict`)**: Cưỡng chế xóa Cache Redis để các thay đổi về địa điểm và thực đơn có hiệu lực ngay lập tức.

---

## 5. MA TRẬN PHÂN LOẠI YÊU CẦU (MOSCOW PRIORITIZATION)

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        MA TRẬN ƯU TIÊN MOSCOW                          │
├────────────────────────────────────────────────────────────────────────┤
│ MUST HAVE (Bắt buộc phải có để hệ thống vận hành)                      │
│ • Hiển thị bản đồ Leaflet, lọc POI theo danh mục và Viewport GIS.      │
│ • Thuyết minh Geofence tự động khi du khách trong bán kính <= 30m.     │
│ • Dẫn đường đi bộ OSRM Turn-by-Turn tiếng Việt.                        │
│ • Gợi ý món ăn theo Slider ngân sách (AiService + Fallback selector).   │
│ • Xác thực GPS Check-in <= 30m và mở khóa 5 loại huy hiệu thành tích.   │
│ • Đăng nhập Telegram OTP 6 số và Google OAuth2.                        │
├────────────────────────────────────────────────────────────────────────┤
│ SHOULD HAVE (Rất quan trọng, nâng cao trải nghiệm)                     │
│ • Trợ lý du lịch AI Gemini RAG hỏi đáp đa ngữ cảnh di tích.            │
│ • Tự động tạo Tour cá nhân hóa theo thời gian rảnh (Custom Plan).      │
│ • Đo lường thời gian nán lại (Dwell Time) và số lượng khách trực tuyến SSE.     │
│ • Đánh giá sao, viết nhận xét và lưu địa điểm yêu thích.               │
│ • Admin OCR quét menu quán ăn vỉa hè bằng Gemini Vision.               │
├────────────────────────────────────────────────────────────────────────┤
│ COULD HAVE (Tiện ích gia tăng khi có đủ tài nguyên)                    │
│ • Tải gói nghe âm thanh ngoại tuyến (Offline audio pack).              │
│ • Bảng điều khiển giả lập GPS để trải nghiệm từ xa không cần tới Q4.  │
│ • Tùy chọn giọng đọc thuyết minh TTS tự động đa ngôn ngữ.              │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 6. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS - NFRS)

### 6.1 Hiệu năng & Khả năng Đáp ứng (Performance)
* **Thời gian tải bản đồ**: Thời gian phản hồi API tra cứu POI (`/pois/in-viewport`) $< 150\text{ms}$ nhờ cấu chỉ mục không gian PostGIS `GIST(location)` và Redis Caching.
* **Tính toán Geofence**: Hàm tính cự ly Haversine chạy trực tiếp trên luồng nền của trình duyệt Client với tần suất quét 2 giây/lần, mức tiêu thụ CPU $< 3\%$, không gây lag giao diện.
* **Băng thông âm thanh**: Audio thuyết minh được phân phối qua giao thức HTTP Chunked Streaming (`Accept-Ranges: bytes`), cho phép phát ngay lập tức trong vòng $< 300\text{ms}$ sau khi chạm ngưỡng Geofence mà không cần chờ tải hết file mp3.

### 6.2 Độ tin cậy & Cơ chế Tự phục hồi (Reliability & Fault Tolerance)
* **Chiến lược Phục hồi AI (AI Fallback Strategy)**: Toàn bộ các API phụ thuộc dịch vụ ngoài (Google Gemini AI, OSRM API, Telegram Bot) đều có hàm Fallback cục bộ dự phòng. Nếu Gemini sập hoặc quá tải hạn mức (Quota Exceeded), hệ thống tự động kích hoạt bộ gợi ý dự phòng cục bộ `generateFallbackRecommendations()` và `generateFallbackAnswer()`, đảm bảo người dùng không nhận màn hình lỗi trắng.

### 6.3 Bảo mật & Quyền riêng tư (Security & Privacy)
* **JWT Stateless Security**: Mọi request yêu cầu quyền hạn đều được xác thực qua JWT Bearer Token theo thuật toán HMAC-SHA256, thời gian hết hạn hợp lý.
* **Xác thực 2 lớp qua Telegram OTP**: Mã OTP chỉ tồn tại trong bộ nhớ 5 phút và tự hủy sau khi sử dụng thành công 1 lần.
* **Chống giả mạo vị trí Check-in**: Tọa độ du khách gửi lên được kiểm tra khoảng cách số học nghiêm ngặt trên máy chủ thay vì tin tưởng cờ boolean từ phía Client.
* **Dữ liệu ẩn danh**: Khách vãng lai chỉ được định danh qua mã ngẫu nhiên UUID `deviceId`, không lưu vết số điện thoại hay email khi chưa có sự đồng ý.

---

## 7. QUY TẮC NGHIỆP VỤ & BẢO TOÀN DỮ LIỆU

1. **Quy tắc Bán kính Geofence Thuyết minh**:
   $$\text{Khoảng cách } d = \text{Haversine}(\text{UserGPS}, \text{PoiGPS}) \le 30.0\text{ mét}$$
   Điểm đến chỉ được kích hoạt tự động phát khi thỏa mãn $d \le 30\text{m}$ và chưa nằm trong danh sách đã phát của phiên truy cập hiện tại.
2. **Quy tắc Xác thực Check-in**:
   Check-in chỉ được xác nhận (`verified = true`) khi khoảng cách tính toán $d \le 30.0\text{m}$. Nếu $d > 30.0\text{m}$, máy chủ từ chối ghi nhận và trả mã phản hồi kèm khoảng cách chênh lệch thực tế.
3. **Quy tắc Tính toán Ngân sách Ẩm thực**:
   $$\sum_{i=1}^{k} \text{Giá món}_i \le \text{Ngân sách chọn}$$
   $$\text{Tiền dư} = \max(0, \text{Ngân sách} - \text{Tổng tiền combo})$$
   Tuyệt đối không từ chối yêu cầu của người dùng vì lý do thiếu tiền; luôn tìm ra ít nhất 1 món ăn tối ưu nhất trong ngân sách đã chọn.

---

## 8. TIÊU CHUẨN NGHIỆM THU (ACCEPTANCE CRITERIA)

| Mã Kiểm Thử | Tên Kịch Bản Nghiệm Thu | Tiêu Chuẩn Đạt (Pass Criteria) |
| :--- | :--- | :--- |
| **AC-01** | Trải nghiệm Khách vãng lai | Mở ứng dụng $\rightarrow$ Tự động sinh `guest_devices` $\rightarrow$ Xem được bản đồ và danh sách POI không cần login. |
| **AC-02** | Thuyết minh Geofence tự động | Di chuyển GPS vào bán kính $\le 30\text{m}$ của Bến Nhà Rồng $\rightarrow$ Audio tự động phát trong $< 1\text{s}$, không lặp lại khi đứng yên. |
| **AC-03** | Gợi ý món ăn theo Ngân sách | Kéo slider chọn 80.000đ cho 2 người $\rightarrow$ Trả về combo món có tổng tiền $\le 80.000$đ, hiển thị rõ số tiền dư và nút "Xem quán →". |
| **AC-04** | Dẫn đường đi bộ OSRM | Chọn Cầu Mống $\rightarrow$ Bấm "Chỉ đường" $ightarrow$ Hiển thị Polyline trọn tuyến, danh sách rẽ tiếng Việt, cự ly và ETA. |
| **AC-05** | Xác thực Check-in & Huy hiệu | Đứng tại cự ly $15\text{m}$ bấm check-in $\rightarrow$ Thành công và mở khóa huy hiệu `FIRST_CHECKIN`. Đứng xa $> 30\text{m}$ $\rightarrow$ Báo lỗi chi tiết. |
| **AC-06** | Đăng nhập OTP Telegram | Nhập số điện thoại $\rightarrow$ Nhận tin nhắn OTP từ bot Telegram $ightarrow$ Nhập đúng mã 6 số $ightarrow$ Đăng nhập thành công và cấp JWT. |
| **AC-07** | Đo đạc Dwell Time & SSE | Khách nán lại quán ốc 5 phút $\rightarrow$ Ghi nhận vào `dwell_logs`. Quản trị viên mở dashboard thấy số lượng khách online nhảy số qua SSE. |
| **AC-08** | Admin AI OCR Menu | Admin upload ảnh chụp menu quán $\rightarrow$ Gemini Vision bóc tách đúng danh sách món, giá tiền và tự điền vào form duyệt. |

---

> **Phụ lục Liên kết Tài liệu Kỹ thuật**:
> * File Sơ đồ Luồng Hoạt động (Activity Diagrams): [`activity.drawio`](file:///e:/smart-tourism/activity.drawio)
> * File Sơ đồ Ca Sử dụng (Use Case Diagrams): [`usecase.drawio`](file:///e:/smart-tourism/usecase.drawio)
> * File Sơ đồ Luồng Dữ liệu (DFD Mức 0, 1, 2, 3): [`dfd.drawio`](file:///e:/smart-tourism/dfd.drawio)
> * File Cấu trúc Cơ sở dữ liệu: [`backend/src/main/resources/schema.sql`](file:///e:/smart-tourism/backend/src/main/resources/schema.sql)

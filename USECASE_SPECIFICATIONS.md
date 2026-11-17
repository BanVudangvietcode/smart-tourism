# TÀI LIỆU ĐẶC TẢ USE CASE HỆ THỐNG (USE CASE SPECIFICATIONS)
## DỰ ÁN: SAIGON WHISPERS – HỆ THỐNG DU LỊCH THÔNG MINH QUẬN 4

> [!NOTE]
> **Tài liệu tham chiếu chuẩn:**
> - Báo cáo Yêu cầu sản phẩm: [PRD.md](file:///e:/smart-tourism/PRD.md)
> - Sơ đồ Luồng dữ liệu: [dfd.drawio](file:///e:/smart-tourism/dfd.drawio)
> - Sơ đồ Use Case chuẩn UML: [usecase.drawio](file:///e:/smart-tourism/usecase.drawio)
> - Backend Framework: Spring Boot 3.x (Java 17), PostGIS, Redis
> - Frontend Framework: Next.js 14 (App Router), Tailwind CSS, Leaflet/Esri GIS

### PHẦN I: GIỚI THIỆU & QUY ƯỚC CHUNG

#### 1. Mục đích tài liệu
Tài liệu này cung cấp đặc tả chi tiết toàn bộ các Use Case của hệ thống **Saigon Whispers**, bao gồm tiền điều kiện, hậu điều kiện, luồng xử lý chính, luồng rẽ nhánh, luồng ngoại lệ, các quy tắc nghiệp vụ và ánh xạ mã nguồn/cơ sở dữ liệu. Tài liệu phục vụ cho công tác kiểm thử (QA/QC), phát triển phần mềm (Dev), bảo trì và đánh giá thẩm định kiến trúc hệ thống.

#### 2. Danh mục Tác nhân (Actor Glossary)
| Tác nhân | Loại | Định nghĩa & Trách nhiệm trong hệ thống |
| :--- | :--- | :--- |
| **Khách du lịch (Tourist)** | Con người (Primary) | Lớp tác nhân cơ sở đại diện cho tất cả du khách tham gia trải nghiệm du lịch số tại Quận 4. |
| **Khách vãng lai (Guest)** | Con người (Kế thừa) | Du khách sử dụng ứng dụng tức thì không cần đăng ký tài khoản (định danh tự động qua `device_id` trong `guest_devices`). |
| **Người dùng đăng ký (Registered User)** | Con người (Kế thừa) | Du khách đã xác thực tài khoản qua Google OAuth 2.0 hoặc Telegram OTP; có quyền lưu yêu thích, đánh giá, chấm sao, check-in nhận huy hiệu và lưu tour cá nhân. |
| **Quản trị viên (Admin / BQL)** | Con người (Primary) | Ban quản lý điểm đến, có quyền truy cập Admin Portal để cấu hình POI, thực đơn món ăn, lộ trình tour, audio thuyết minh, xem Dashboard thời gian thực và quản lý cache. |
| **Ứng dụng Client (Tác vụ ngầm)** | Hệ thống (Background) | Tiến trình chạy ngầm phía trình duyệt gửi tín hiệu Ping Heartbeat, Leave event và sự kiện dừng chân (Dwell event) phục vụ phân tích. |
| **Google Identity Services** | Hệ thống ngoài (Secondary) | Cung cấp luồng xác thực Google ID Token cho người dùng đăng nhập bằng tài khoản Google. |
| **Telegram Bot API** | Hệ thống ngoài (Secondary) | Gửi mã OTP gồm 6 chữ số qua Telegram Bot phục vụ xác thực số điện thoại/tài khoản tức thì. |
| **Dịch vụ OSRM (Routing Engine)** | Hệ thống ngoài (Secondary) | Cung cấp API ma trận khoảng cách (`/table`) phục vụ thuật toán Greedy TSP cho Custom Plan và API dẫn đường đi bộ (`/route/v1/walking`). |
| **Google Gemini AI** | Hệ thống ngoài (Secondary) | Cung cấp mô hình ngôn ngữ lớn (Gemini 3.5 Flash Lite) cho Trợ lý ảo RAG và mô hình thị giác (Gemini Vision) cho tính năng quét OCR thực đơn. |

#### 3. Ma trận truy vết Use Case (Traceability Matrix)
| Mã UC | Tên Use Case | Phân hệ | Tác nhân chính | Tác nhân phụ | Độ ưu tiên | Bảng CSDL chính |
| :---: | :--- | :---: | :--- | :--- | :---: | :--- |
| `UC-1.1` | Đăng nhập Google OAuth 2.0 | 1.0 | Registered User | Google Identity | Cao | `users` |
| `UC-1.2` | Đăng nhập Telegram OTP | 1.0 | Registered User | Telegram Bot API | Cao | `users` |
| `UC-1.3` | Phiên Khách vãng lai (Guest) | 1.0 | Tourist (Guest) | - | Cao | `guest_devices`, `users` |
| `UC-1.4` | Đăng nhập Quản trị viên (Admin) | 1.0 | Admin | - | Cao | `users` |
| `UC-1.5` | Xác minh danh tính (`<<include>>`) | 1.0 | Hệ thống | Google/Telegram | Cao | `users` |
| `UC-1.6` | Cấp phát JWT & Role (`<<include>>`) | 1.0 | Hệ thống | - | Cao | `users` |
| `UC-1.7` | Xem & Sửa hồ sơ Profile | 1.0 | Registered User | - | Trung bình | `users` |
| `UC-1.8` | Đăng xuất khỏi hệ thống | 1.0 | Registered User / Admin | - | Cao | - |
| `UC-2.1` | Tìm kiếm POI theo từ khóa | 2.0 | Tourist | - | Cao | `pois` |
| `UC-2.2` | Lọc POI theo danh mục & chủ đề | 2.0 | Tourist | - | Cao | `pois`, `categories`, `poi_types` |
| `UC-2.3` | Lọc POI gần nhất theo GPS | 2.0 | Tourist | - | Cao | `pois` (PostGIS GIST) |
| `UC-2.4` | Xem chi tiết lịch sử POI | 2.0 | Tourist | - | Cao | `pois` |
| `UC-2.5` | Xem bộ sưu tập ảnh POI | 2.0 | Tourist | - | Trung bình | `poi_images` |
| `UC-2.6` | Thêm mới POI & Tọa độ GPS | 2.0 | Admin | - | Cao | `pois`, `poi_images` |
| `UC-2.7` | Chỉnh sửa thông tin POI | 2.0 | Admin | - | Cao | `pois` |
| `UC-2.8` | Xóa POI khỏi hệ thống | 2.0 | Admin | - | Trung bình | `pois` |
| `UC-2.9` | Quản lý Danh mục & Loại hình | 2.0 | Admin | - | Cao | `categories`, `poi_types` |
| `UC-3.1` | Khám phá đặc sản Quận 4 | 3.0 | Tourist | - | Cao | `dishes`, `pois` |
| `UC-3.2` | Gợi ý món theo Ngân sách | 3.0 | Tourist | - | Cao | `dishes`, `pois` |
| `UC-3.3` | Lọc quán theo bán kính GPS | 3.0 | Tourist | - | Cao | `dishes`, `pois` |
| `UC-3.4` | Xem chi tiết món & quán | 3.0 | Tourist | - | Cao | `dishes`, `dish_images` |
| `UC-3.5` | Quản lý thực đơn & giá bán | 3.0 | Admin | - | Cao | `dishes`, `menu_categories` |
| `UC-3.6` | Thêm món ăn mới | 3.0 | Admin | - | Cao | `dishes` |
| `UC-3.7` | Quét thực đơn AI OCR | 3.0 | Admin | Google Gemini Vision | Cao | `dishes` |
| `UC-3.8` | Xác nhận bản nháp OCR | 3.0 | Admin | - | Cao | `dishes` |
| `UC-4.1` | Xem danh sách Tour mẫu | 4.0 | Tourist | - | Cao | `tours` |
| `UC-4.2` | Xem chi tiết lộ trình chặng dừng | 4.0 | Tourist | - | Cao | `tours`, `tour_stops`, `pois` |
| `UC-4.3` | Tự động sinh Custom Plan | 4.0 | Tourist | OSRM Engine | Cao | `tours`, `pois` |
| `UC-4.4` | Tính ma trận TSP Greedy | 4.0 | Hệ thống | OSRM Engine | Cao | - |
| `UC-4.5` | Lưu Tour tùy biến cá nhân | 4.0 | Registered User | - | Trung bình | `tours`, `tour_stops` |
| `UC-4.6` | Đánh giá & Chấm sao Tour | 4.0 | Registered User | - | Trung bình | `tour_reviews` |
| `UC-4.7` | Thiết lập Tour mới | 4.0 | Admin | - | Cao | `tours`, `tour_stops` |
| `UC-4.8` | Chỉnh sửa & Xóa Tour | 4.0 | Admin | - | Cao | `tours` |
| `UC-5.1` | Xem bản đồ tương tác GIS | 5.0 | Tourist | - | Cao | `pois` |
| `UC-5.2` | Chuyển đổi lớp bản đồ nền | 5.0 | Tourist | - | Trung bình | - |
| `UC-5.3` | Bật định vị GPS thực tế | 5.0 | Tourist | - | Cao | - |
| `UC-5.4` | Xem Popup tóm tắt Marker | 5.0 | Tourist | - | Cao | `pois` |
| `UC-5.5` | Tìm đường đi bộ tới POI | 5.0 | Tourist | OSRM API | Cao | - |
| `UC-5.6` | Giải mã Polyline & ETA | 5.0 | Hệ thống | OSRM API | Cao | - |
| `UC-5.7` | Xem hướng dẫn từng bước | 5.0 | Tourist | - | Trung bình | - |
| `UC-6.1` | Bật chế độ Auto-Guide | 6.0 | Tourist | - | Cao | `poi_audios` |
| `UC-6.2` | Quét khoảng cách Geofence 30m | 6.0 | Hệ thống | - | Cao | `pois`, `poi_audios` |
| `UC-6.3` | Tự động phát âm thanh di tích | 6.0 | Hệ thống | - | Cao | `poi_audios` |
| `UC-6.4` | Điều khiển phát Audio | 6.0 | Tourist | - | Cao | - |
| `UC-6.5` | Xem Transcript thuyết minh | 6.0 | Tourist | - | Trung bình | `poi_audios` |
| `UC-6.6` | Ghi nhận hoàn thành bài nghe | 6.0 | Hệ thống | - | Cao | `audio_listen_logs` |
| `UC-6.7` | Upload Audio & Cấu hình phát | 6.0 | Admin | - | Cao | `poi_audios` |
| `UC-6.8` | Biên soạn kịch bản thuyết minh | 6.0 | Admin | - | Trung bình | `poi_audios` |
| `UC-7.1` | Hỏi đáp du lịch với AI | 7.0 | Tourist | Google Gemini AI | Cao | - |
| `UC-7.2` | Nạp ngữ cảnh RAG | 7.0 | Hệ thống | - | Cao | `pois`, `dishes`, `poi_audios` |
| `UC-7.3` | Chọn Prompt Chips nhanh | 7.0 | Tourist | - | Trung bình | - |
| `UC-7.4` | Chọn câu hỏi gợi ý Follow-up | 7.0 | Tourist | - | Trung bình | - |
| `UC-7.5` | Yêu cầu tư vấn lịch trình mẫu | 7.0 | Tourist | Google Gemini AI | Cao | - |
| `UC-7.6` | Phản hồi dự phòng Local Fallback | 7.0 | Hệ thống | - | Cao | - |
| `UC-8.1` | Xem đánh giá & điểm sao POI | 8.0 | Tourist | - | Cao | `reviews`, `pois` |
| `UC-8.2` | Lưu địa điểm Yêu thích | 8.0 | Registered User | - | Cao | `favorites` |
| `UC-8.3` | Xem danh sách Bookmark | 8.0 | Registered User | - | Cao | `favorites`, `pois` |
| `UC-8.4` | Viết đánh giá & Chấm sao POI | 8.0 | Registered User | - | Cao | `reviews`, `pois` |
| `UC-8.5` | Check-in thực tế tại POI | 8.0 | Registered User | - | Cao | `checkins` |
| `UC-8.6` | Xác thực GPS Haversine 30m | 8.0 | Hệ thống | - | Cao | `pois` |
| `UC-8.7` | Mở khóa Huy hiệu Badges | 8.0 | Hệ thống | - | Cao | `user_badges` |
| `UC-8.8` | Xem bộ sưu tập Huy hiệu | 8.0 | Registered User | - | Trung bình | `user_badges` |
| `UC-9.1` | Gửi Heartbeat Ping & Leave | 9.0 | Client ngầm | - | Cao | `dwell_logs` |
| `UC-9.2` | Ghi nhận sự kiện lưu trú | 9.0 | Client ngầm | - | Cao | `dwell_logs` |
| `UC-9.3` | Giám sát khách online trực tiếp SSE | 9.0 | Admin | - | Cao | Redis / In-memory SSE |
| `UC-9.4` | Xem thống kê Lượt nghe Audio | 9.0 | Admin | - | Cao | `audio_listen_logs` |
| `UC-9.5` | Bảng xếp hạng Điểm nóng ẩm thực | 9.0 | Admin | - | Cao | `dishes`, `reviews`, `pois` |
| `UC-9.6` | Phân tích Thời gian dừng chân | 9.0 | Admin | - | Cao | `dwell_logs` |
| `UC-9.7` | Xem tổng quan hệ thống Dashboard | 9.0 | Admin | - | Cao | `tours`, `checkins`, `reviews` |
| `UC-9.8` | Xóa bộ nhớ đệm Cache Eviction | 9.0 | Admin | - | Cao | Redis Cache |

---

### PHẦN II: ĐẶC TẢ CHI TIẾT TỪNG PHÂN HỆ NGHIỆP VỤ

## PHÂN HỆ 1.0: XÁC THỰC & TÀI KHOẢN (AUTHENTICATION & ACCOUNT)

Phân hệ quản lý toàn bộ vòng đời phiên đăng nhập của người dùng trong hệ thống Saigon Whispers, hỗ trợ 3 chế độ người dùng: Khách vãng lai (Guest Device), Người dùng mạng xã hội (Google OAuth 2.0 / Telegram OTP), và Quản trị viên (Admin Portal).

### UC-1.1: Đăng nhập bằng tài khoản Google (OAuth 2.0)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-1.1` |
| **Tên Use Case** | **Đăng nhập bằng tài khoản Google (OAuth 2.0)** |
| **Phân hệ** | 1.0 Xác thực & Tài khoản |
| **Tác nhân chính (Primary Actor)** | Người dùng đăng ký (Registered User) |
| **Tác nhân phụ (Secondary Actor)** | Google Identity Services |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | <<include>> UC-1.5 (Xác minh danh tính), UC-1.6 (Cấp phát JWT) |

#### 1. Mô tả tóm tắt (Description)
Cho phép du khách sử dụng tài khoản Google sẵn có để đăng nhập nhanh chóng chỉ với 1 cú nhấp chuột (One-tap), tự động đồng bộ họ tên, email và avatar.

#### 2. Tiền điều kiện (Pre-conditions)
- Người dùng đang mở ứng dụng web/di động Saigon Whispers.
- Thiết bị có kết nối Internet và có thể truy cập dịch vụ Google.

#### 3. Hậu điều kiện (Post-conditions)
- Tài khoản người dùng được tạo mới hoặc cập nhật trong bảng `users` với provider = "google".
- Phiên làm việc được thiết lập, JWT Access Token được lưu trữ an toàn tại Client.
- Người dùng được mở khóa toàn bộ quyền thành viên (viết review, lưu bookmark, check-in nhận huy hiệu).

#### 4. Điểm kích hoạt (Trigger)
Người dùng nhấn nút "Đăng nhập bằng Google" tại Modal Đăng nhập.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Người dùng nhấn nút "Đăng nhập bằng Google". | Hệ thống hiển thị hộp thoại đăng nhập của Google Identity Services. |
| **2** | Người dùng chọn tài khoản Google và cấp quyền truy cập. | Google Identity trả về Google ID Token (JWT) cho Client. |
| **3** | Client gửi Google ID Token lên máy chủ qua API `/api/auth/google`. | Hệ thống gọi UC-1.5 để kiểm tra tính hợp lệ và chữ ký điện tử của ID Token từ Google API. |
| **4** | Chờ phản hồi từ hệ thống. | Hệ thống trích xuất email, display_name, avatar_url; kiểm tra sự tồn tại trong CSDL: nếu chưa có thì tạo mới, nếu có thì cập nhật thông tin. |
| **5** | Chờ cấp quyền truy cập. | Hệ thống gọi UC-1.6 để sinh cặp JWT Token (Access Token 24h & Refresh Token) mang quyền hạn `ROLE_USER`. |
| **6** | Client nhận JWT Token. | Hệ thống trả về HTTP 200 kèm Token và thông tin User Profile. Giao diện chuyển sang trạng thái đã đăng nhập. |

#### 6. Các luồng rẽ nhánh (Alternative Flows)
- **Người dùng trước đó đang dùng phiên Guest có lưu tạm dữ liệu:**
  Hệ thống tự động liên kết các bản ghi tạm từ `device_id` sang `user_id` mới đăng nhập để bảo toàn danh sách yêu thích.

#### 7. Các luồng ngoại lệ (Exception Flows)
- **Google ID Token hết hạn hoặc không hợp lệ:**
  Hệ thống trả về HTTP 401 Unauthorized kèm thông báo "Mã xác thực Google không hợp lệ hoặc đã hết hạn". Yêu cầu người dùng thử lại.
- **Mất kết nối tới Google Identity Server:**
  Hệ thống trả về HTTP 503 Service Unavailable, gợi ý người dùng đăng nhập bằng Telegram OTP hoặc tiếp tục dùng tư cách Khách vãng lai.

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Token Google phải được xác thực bằng thư viện `google-api-client` phía backend, không tin cậy dữ liệu client gửi trực tiếp.
- Mỗi tài khoản Google chỉ tương ứng với duy nhất một bản ghi email trong bảng `users`.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `POST /api/auth/google (Body: { idToken: string })`
- **Backend Controller/Service:** `AuthController -> GoogleAuthService -> JwtTokenProvider`
- **Bảng CSDL liên quan:** `users`

---

### UC-1.2: Đăng nhập qua mã OTP Telegram

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-1.2` |
| **Tên Use Case** | **Đăng nhập qua mã OTP Telegram** |
| **Phân hệ** | 1.0 Xác thực & Tài khoản |
| **Tác nhân chính (Primary Actor)** | Người dùng đăng ký (Registered User) |
| **Tác nhân phụ (Secondary Actor)** | Telegram Bot API (@SaigonWhispersBot) |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | <<include>> UC-1.5 (Xác minh danh tính), UC-1.6 (Cấp phát JWT) |

#### 1. Mô tả tóm tắt (Description)
Cung cấp phương thức xác thực tài khoản tức thì, an toàn và hoàn toàn miễn phí qua ứng dụng nhắn tin Telegram, không phụ thuộc vào chi phí SMS truyền thống.

#### 2. Tiền điều kiện (Pre-conditions)
- Người dùng sở hữu tài khoản Telegram đang hoạt động.
- Hệ thống Telegram Bot của Saigon Whispers đang online.

#### 3. Hậu điều kiện (Post-conditions)
- Người dùng được xác thực số điện thoại/Telegram ID.
- JWT Token được cấp phát và lưu tại Client, quyền hạn nâng cấp thành `ROLE_USER`.

#### 4. Điểm kích hoạt (Trigger)
Người dùng nhập số điện thoại/Username Telegram và bấm "Gửi mã OTP".

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Người dùng nhập thông tin liên hệ Telegram và bấm "Gửi OTP". | Hệ thống sinh mã ngẫu nhiên gồm 6 chữ số bí mật với thời gian sống (TTL) 120 giây, lưu vào Redis Cache. |
| **2** | Chờ thông báo. | Hệ thống gọi Telegram Bot API gửi tin nhắn chứa mã OTP và hướng dẫn bảo mật đến tài khoản Telegram của du khách. |
| **3** | Người dùng mở Telegram, đọc mã OTP và nhập vào giao diện Saigon Whispers. | Client gửi mã OTP lên API `/api/auth/telegram/verify-otp`. |
| **4** | Chờ hệ thống kiểm tra. | Hệ thống đối chiếu mã OTP với giá trị trong Redis: mã chính xác và còn hạn $\rightarrow$ gọi UC-1.6 sinh JWT Token. |
| **5** | Nhận kết quả đăng nhập. | Hệ thống xóa mã OTP khỏi Redis và trả về JWT Token cùng thông tin User. |

#### 6. Các luồng rẽ nhánh (Alternative Flows)
- **Người dùng bấm gửi lại mã sau 60 giây:**
  Hệ thống hủy mã cũ, tạo mã mới và gửi lại qua Telegram Bot, đếm ngược thời gian mới.

#### 7. Các luồng ngoại lệ (Exception Flows)
- **Người dùng nhập sai mã OTP quá 5 lần:**
  Hệ thống khóa tạm thời yêu cầu trong 15 phút để chống tấn công Brute-force, trả về HTTP 429 Too Many Requests.
- **Mã OTP hết hạn quá 120 giây:**
  Hệ thống trả về HTTP 400 Bad Request kèm thông báo "Mã OTP đã hết hạn, vui lòng yêu cầu mã mới".

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Mã OTP phải có độ dài đúng 6 ký tự số từ [0-9].
- Thời gian hết hạn tối đa của OTP là 120 giây kể từ lúc phát sinh.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `POST /api/auth/telegram/send-otp, POST /api/auth/telegram/verify-otp`
- **Backend Controller/Service:** `AuthController -> TelegramAuthService -> JwtTokenProvider`
- **Bảng CSDL liên quan:** `users, Redis (otp:telegram:{id})`

---

### UC-1.3: Trải nghiệm với tư cách Khách vãng lai (Guest Session)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-1.3` |
| **Tên Use Case** | **Trải nghiệm với tư cách Khách vãng lai (Guest Session)** |
| **Phân hệ** | 1.0 Xác thực & Tài khoản |
| **Tác nhân chính (Primary Actor)** | Khách du lịch (Khách vãng lai) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | <<include>> UC-1.6 (Cấp phát JWT) |

#### 1. Mô tả tóm tắt (Description)
Cho phép du khách lần đầu mở ứng dụng có thể duyệt xem POI, nghe thuyết minh, tìm đường và hỏi đáp AI ngay lập tức mà không phải qua rào cản đăng ký tài khoản.

#### 2. Tiền điều kiện (Pre-conditions)
- Trình duyệt hỗ trợ LocalStorage / IndexedDB.

#### 3. Hậu điều kiện (Post-conditions)
- Tạo bản ghi định danh ẩn trong `guest_devices` và `users` với provider = "guest".
- Cấp JWT Token hạn chế (ROLE_GUEST) cho phép sử dụng tất cả chức năng đọc.

#### 4. Điểm kích hoạt (Trigger)
Người dùng mở ứng dụng lần đầu hoặc bấm "Tiếp tục với tư cách Khách".

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Người dùng truy cập trang chủ ứng dụng. | Frontend kiểm tra LocalStorage: nếu chưa có Token, tự động sinh UUID `device_id` duy nhất cho thiết bị. |
| **2** | Client tự động gửi `device_id` và thông tin OS lên `/api/auth/guest`. | Backend kiểm tra `guest_devices`: nếu chưa có, tạo bản ghi mới và tạo User ẩn với role `ROLE_GUEST`. |
| **3** | Client nhận JWT Guest Token. | Hệ thống gọi UC-1.6 cấp JWT Token có thời hạn dài, trả về HTTP 200. |
| **4** | Khách du lịch bắt đầu trải nghiệm khám phá. | Hệ thống cho phép truy cập đầy đủ Bản đồ, Danh sách POI, Thực đơn, Audio và Chatbot AI. |

#### 6. Các luồng rẽ nhánh (Alternative Flows)
- **Khách vãng lai đã từng truy cập trước đó:**
  Hệ thống nhận diện `device_id` cũ và tái kích hoạt phiên làm việc trước đó mà không tạo thêm bản ghi rác.

#### 7. Các luồng ngoại lệ (Exception Flows)
- **Trình duyệt chặn lưu Cookie / LocalStorage (Chế độ ẩn danh nghiêm ngặt):**
  Hệ thống duy trì phiên làm việc tạm trong bộ nhớ RAM (In-Memory Session) cho đến khi tab đóng.

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Khách vãng lai không được phép gửi đánh giá, chấm điểm sao, check-in nhận huy hiệu hay lưu tour tùy biến cá nhân (khi click các nút này sẽ bật Modal mời đăng nhập).

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `POST /api/auth/guest (Body: { deviceId: string, os: string })`
- **Backend Controller/Service:** `AuthController -> AuthService`
- **Bảng CSDL liên quan:** `guest_devices, users`

---

### UC-1.4: Đăng nhập Quản trị viên (Admin Portal)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-1.4` |
| **Tên Use Case** | **Đăng nhập Quản trị viên (Admin Portal)** |
| **Phân hệ** | 1.0 Xác thực & Tài khoản |
| **Tác nhân chính (Primary Actor)** | Quản trị viên (Admin / BQL) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | <<include>> UC-1.6 (Cấp phát JWT) |

#### 1. Mô tả tóm tắt (Description)
Xác thực tài khoản cán bộ quản trị để cấp quyền truy cập vào phân hệ Dashboard điều hành, quản trị dữ liệu POI, thực đơn, tour, audio và hệ thống báo cáo.

#### 2. Tiền điều kiện (Pre-conditions)
- Tài khoản quản trị đã được khởi tạo trong CSDL với quyền `ROLE_ADMIN`.
- Truy cập đúng địa chỉ cổng quản trị `/admin`.

#### 3. Hậu điều kiện (Post-conditions)
- Cấp JWT Access Token mang quyền hạn `ROLE_ADMIN`.
- Cho phép truy xuất toàn bộ các API quản trị `/api/admin/*`.

#### 4. Điểm kích hoạt (Trigger)
Admin nhập Email/Tên đăng nhập và Mật khẩu tại trang quản trị.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Admin truy cập trang `/admin/login`, nhập Email và Mật khẩu, bấm "Đăng nhập". | Client gửi thông tin mã hóa lên `/api/auth/admin/login`. |
| **2** | Chờ hệ thống kiểm tra. | Hệ thống tìm kiếm user theo email; dùng BCryptPasswordEncoder để đối chiếu mật khẩu băm (`password_hash`). |
| **3** | Hệ thống kiểm tra Role. | Kiểm tra trường `role`: bắt buộc phải là `ROLE_ADMIN`. |
| **4** | Chờ cấp token. | Gọi UC-1.6 sinh JWT Token mang Claims `role=ADMIN` có chữ ký điện tử HMAC-SHA256. |
| **5** | Admin nhận Token và chuyển hướng. | Hệ thống trả về HTTP 200, giao diện tự động chuyển hướng vào Trang điều hành trung tâm `/admin`. |

#### 7. Các luồng ngoại lệ (Exception Flows)
- **Sai mật khẩu hoặc email không tồn tại:**
  Hệ thống trả về HTTP 401 Unauthorized kèm thông báo "Tài khoản hoặc mật khẩu không chính xác".
- **Tài khoản đúng thông tin nhưng không có quyền ADMIN:**
  Hệ thống từ chối truy cập với mã HTTP 403 Forbidden: "Bạn không có quyền truy cập cổng quản trị".

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Mật khẩu Admin phải được băm an toàn bằng thuật toán BCrypt với độ phức tạp tối thiểu cost factor = 10.
- Token Admin có thời hạn hiệu lực 12 giờ và tự động thu hồi khi Admin bấm Đăng xuất.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `POST /api/auth/admin/login (Body: { email, password })`
- **Backend Controller/Service:** `AuthController -> AuthService -> JwtTokenProvider`
- **Bảng CSDL liên quan:** `users`

---

### UC-1.5: Xác minh danh tính (Identity Verification)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-1.5` |
| **Tên Use Case** | **Xác minh danh tính (Identity Verification)** |
| **Phân hệ** | 1.0 Xác thực & Tài khoản |
| **Tác nhân chính (Primary Actor)** | Hệ thống (System Core) |
| **Tác nhân phụ (Secondary Actor)** | Google Identity / Telegram Bot API |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | <<include>> được gọi bởi UC-1.1 và UC-1.2 |

#### 1. Mô tả tóm tắt (Description)
Tiến trình kiểm tra tính hợp lệ về mặt mật mã học của Token bên ngoài hoặc mã OTP được cung cấp trước khi cấp quyền cho tài khoản.

#### 2. Tiền điều kiện (Pre-conditions)
- Nhận được dữ liệu xác thực từ các Use Case đăng nhập.

#### 3. Hậu điều kiện (Post-conditions)
- Xác nhận danh tính người dùng thành công, trích xuất mã định danh duy nhất (sub, telegram_id).

#### 4. Điểm kích hoạt (Trigger)
Được gọi tự động bởi UC-1.1 hoặc UC-1.2.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Tiến trình gọi xác minh với payload xác thực. | Kiểm tra loại provider (Google hay Telegram). |
| **2** | Nếu là Google Token: | Gọi Google IdTokenVerifier kiểm tra chữ ký số, Issuer (`accounts.google.com`), Audience (`GOOGLE_CLIENT_ID`) và thời hạn còn hiệu lực. |
| **3** | Nếu là Telegram OTP: | Tra cứu mã OTP trong Redis theo khóa `otp:telegram:{id}`, so khớp giá trị và kiểm tra TTL. |
| **4** | Hoàn tất xác minh. | Trả kết quả `true` kèm Claims người dùng cho tiến trình cha. |

#### 7. Các luồng ngoại lệ (Exception Flows)
- **Xác minh thất bại (sai chữ ký hoặc hết hạn):**
  Trả về ngoại lệ `InvalidCredentialsException`, chấm dứt chuỗi đăng nhập.

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Không bao giờ bỏ qua bước kiểm tra chữ ký số từ máy chủ Google để tránh lỗ hổng Token Spoofing.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `Internal Component`
- **Backend Controller/Service:** `GoogleAuthService.verify(), TelegramAuthService.verify()`
- **Bảng CSDL liên quan:** `Redis Cache`

---

### UC-1.6: Cấp phát JWT Token & Phân quyền Role

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-1.6` |
| **Tên Use Case** | **Cấp phát JWT Token & Phân quyền Role** |
| **Phân hệ** | 1.0 Xác thực & Tài khoản |
| **Tác nhân chính (Primary Actor)** | Hệ thống (System Core) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | <<include>> được gọi bởi UC-1.1, UC-1.2, UC-1.3, UC-1.4 |

#### 1. Mô tả tóm tắt (Description)
Sinh cặp JSON Web Token mang thông tin định danh và phân quyền để Client gửi kèm trong Header Authorization cho các yêu cầu kế tiếp.

#### 2. Tiền điều kiện (Pre-conditions)
- Đã xác minh danh tính thành công hoặc đã tạo Guest Device thành công.

#### 3. Hậu điều kiện (Post-conditions)
- Sinh ra chuỗi JWT Token hợp lệ kèm Claims tương ứng (`ROLE_GUEST`, `ROLE_USER`, `ROLE_ADMIN`).

#### 4. Điểm kích hoạt (Trigger)
Được gọi tự động khi hoàn thành bước xác thực.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Hệ thống nhận thông tin User entity. | Trích xuất ID, Email, Role và thời gian tạo. |
| **2** | Tạo Payload JWT: | Đặt `sub=userId`, `role=ROLE_...`, `iat=now`, `exp=now+24h`. |
| **3** | Ký điện tử: | Ký toàn bộ Payload bằng thuật toán HMAC-SHA256 với khóa bí mật `jwt.secret` cấu hình trong hệ thống. |
| **4** | Đóng gói phản hồi: | Trả về chuỗi Token hoàn chỉnh kèm thời gian hết hạn (`expiresIn`) cho Client. |

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Secret key phải có độ dài tối thiểu 256 bits và được bảo mật tuyệt đối trong biến môi trường.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `Internal Component`
- **Backend Controller/Service:** `JwtTokenProvider.generateToken(User)`
- **Bảng CSDL liên quan:** `users`

---

### UC-1.7: Xem & Cập nhật Hồ sơ cá nhân (User Profile)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-1.7` |
| **Tên Use Case** | **Xem & Cập nhật Hồ sơ cá nhân (User Profile)** |
| **Phân hệ** | 1.0 Xác thực & Tài khoản |
| **Tác nhân chính (Primary Actor)** | Người dùng đăng ký (Registered User) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Trung bình |
| **Quan hệ UML** | Không |

#### 1. Mô tả tóm tắt (Description)
Cho phép người dùng xem thông tin tài khoản, cập nhật tên hiển thị, ảnh đại diện và tùy chọn sở thích ăn uống cá nhân (ăn cay, ăn chay, không ăn hải sản).

#### 2. Tiền điều kiện (Pre-conditions)
- Người dùng đã đăng nhập với quyền `ROLE_USER`.

#### 3. Hậu điều kiện (Post-conditions)
- Thông tin hồ sơ và tùy chọn ẩm thực được cập nhật trong bảng `users`.

#### 4. Điểm kích hoạt (Trigger)
Người dùng nhấn vào Avatar trên thanh điều hướng và chọn "Hồ sơ cá nhân".

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Người dùng truy cập mục "Hồ sơ cá nhân". | Client gửi GET `/api/user/profile` kèm Header Bearer Token. |
| **2** | Chờ tải dữ liệu. | Backend kiểm tra Token, trích xuất dữ liệu từ bảng `users`, trả về tên, email, avatar, sở thích ẩm thực. |
| **3** | Người dùng sửa tên hiển thị và tích chọn "Ăn cay", "Ăn chay" hoặc "Không ăn hải sản", bấm "Lưu thay đổi". | Client gửi PUT `/api/user/profile`. |
| **4** | Chờ hệ thống lưu. | Backend cập nhật các cột `display_name`, `spicy`, `vegetarian`, `no_seafood`, `updated_at` trong CSDL. |
| **5** | Nhận thông báo. | Hệ thống trả về HTTP 200, cập nhật trạng thái hiển thị trên giao diện. |

#### 7. Các luồng ngoại lệ (Exception Flows)
- **Token hết hạn trong lúc đang thao tác:**
  Hệ thống trả về HTTP 401, hiển thị thông báo phiên đăng nhập đã hết hạn và yêu cầu đăng nhập lại.

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Tên hiển thị tối thiểu 2 ký tự, tối đa 100 ký tự, không chứa các ký tự mã độc XSS.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `GET /api/user/profile, PUT /api/user/profile`
- **Backend Controller/Service:** `UserController -> UserService`
- **Bảng CSDL liên quan:** `users`

---

### UC-1.8: Đăng xuất khỏi hệ thống (Logout)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-1.8` |
| **Tên Use Case** | **Đăng xuất khỏi hệ thống (Logout)** |
| **Phân hệ** | 1.0 Xác thực & Tài khoản |
| **Tác nhân chính (Primary Actor)** | Người dùng đăng ký / Quản trị viên |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | Không |

#### 1. Mô tả tóm tắt (Description)
Hủy phiên làm việc hiện tại, xóa bỏ Token khỏi thiết bị và chuyển người dùng về trạng thái Khách vãng lai an toàn.

#### 2. Tiền điều kiện (Pre-conditions)
- Người dùng đang trong trạng thái đăng nhập.

#### 3. Hậu điều kiện (Post-conditions)
- Token bị xóa khỏi LocalStorage/SessionStorage phía Client.
- Hệ thống đưa người dùng về trạng thái Khách vãng lai.

#### 4. Điểm kích hoạt (Trigger)
Người dùng nhấn nút "Đăng xuất" trong menu tài khoản.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Người dùng nhấn nút "Đăng xuất". | Hệ thống hiển thị hộp thoại xác nhận đăng xuất. |
| **2** | Người dùng bấm xác nhận. | Client gọi POST `/api/auth/logout` và xóa sạch Token trong bộ nhớ trình duyệt. |
| **3** | Hoàn tất đăng xuất. | Giao diện tải lại, tự động khởi tạo phiên Khách vãng lai mới qua UC-1.3. |

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Sau khi đăng xuất, toàn bộ dữ liệu quyền riêng tư (Bookmark, Lịch sử check-in cá nhân) không còn hiển thị trên màn hình.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `POST /api/auth/logout`
- **Backend Controller/Service:** `AuthController`
- **Bảng CSDL liên quan:** `Redis Token Blacklist (nếu có)`

---

## PHÂN HỆ 2.0: KHÁM PHÁ & QUẢN LÝ POI (POINTS OF INTEREST)

Phân hệ cốt lõi quản lý toàn bộ cơ sở dữ liệu các điểm đến du lịch, di tích lịch sử, cơ sở tôn giáo và danh lam thắng cảnh Quận 4, tích hợp tìm kiếm toàn văn và truy vấn không gian PostGIS.

### UC-2.1: Tìm kiếm điểm đến theo từ khóa (Full-Text Search)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-2.1` |
| **Tên Use Case** | **Tìm kiếm điểm đến theo từ khóa (Full-Text Search)** |
| **Phân hệ** | 2.0 Khám phá & Quản lý POI |
| **Tác nhân chính (Primary Actor)** | Khách du lịch (Tourist) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | Không |

#### 1. Mô tả tóm tắt (Description)
Cho phép du khách tìm kiếm nhanh địa điểm theo tên quán, tên di tích, địa chỉ hoặc từ khóa liên quan bằng cơ chế tìm kiếm toàn văn tối ưu.

#### 2. Tiền điều kiện (Pre-conditions)
- Ứng dụng đang hiển thị màn hình Khám phá hoặc Bản đồ.

#### 3. Hậu điều kiện (Post-conditions)
- Danh sách điểm đến khớp với từ khóa được hiển thị theo độ liên quan.

#### 4. Điểm kích hoạt (Trigger)
Người dùng gõ ký tự vào ô tìm kiếm trên thanh điều hướng.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Người dùng nhập từ khóa (ví dụ: "Bến Nhà Rồng", "Ốc Oanh") vào ô tìm kiếm. | Client áp dụng kỹ thuật Debounce 300ms để tránh gửi request dồn dập. |
| **2** | Client tự động gửi GET `/api/pois?q={keyword}`. | Máy chủ truy vấn bảng `pois` sử dụng chỉ mục Full-Text Search PostgreSQL: `to_tsvector("simple", name) @@ to_tsquery(...)`. |
| **3** | Chờ nhận kết quả. | Hệ thống trả về danh sách POI gồm: Tên, ảnh thumbnail, địa chỉ, đánh giá sao, loại hình và khoảng cách. |
| **4** | Người dùng xem danh sách gợi ý và nhấn chọn 1 điểm đến. | Hệ thống mở màn hình xem chi tiết thông tin điểm đến (UC-2.4). |

#### 6. Các luồng rẽ nhánh (Alternative Flows)
- **Không tìm thấy kết quả nào khớp với từ khóa:**
  Hệ thống hiển thị thông báo "Không tìm thấy địa điểm phù hợp" và đề xuất các từ khóa phổ biến (ví dụ: Ốc Vĩnh Khánh, Phá lấu Chợ 200, Cầu Mống).

#### 7. Các luồng ngoại lệ (Exception Flows)
- **Từ khóa chứa các ký tự đặc biệt nguy hiểm (SQL Injection):**
  Hệ thống tự động chuẩn hóa chuỗi đầu vào (Sanitize), chỉ giữ lại các ký tự chữ và số an toàn.

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Hỗ trợ tìm kiếm tiếng Việt có dấu và không dấu.
- Kết quả tìm kiếm ưu tiên xếp hạng theo độ phổ biến (`popularity`) và điểm đánh giá (`avg_rating`).

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `GET /api/pois?q={keyword}&page=0&size=10`
- **Backend Controller/Service:** `PoiController.getPois() -> PoiService -> PoiRepository`
- **Bảng CSDL liên quan:** `pois, categories, poi_types`

---

### UC-2.2: Lọc POI theo danh mục & chủ đề

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-2.2` |
| **Tên Use Case** | **Lọc POI theo danh mục & chủ đề** |
| **Phân hệ** | 2.0 Khám phá & Quản lý POI |
| **Tác nhân chính (Primary Actor)** | Khách du lịch (Tourist) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | <<extend>> được mở rộng bởi UC-2.3 (Lọc theo GPS) |

#### 1. Mô tả tóm tắt (Description)
Cung cấp bộ lọc theo 4 loại hình chủ đạo (Ẩm thực, Di tích lịch sử, Tôn giáo, Cảnh quan) và các danh mục chuyên sâu (Ốc, Phá lấu, Chợ 200, Cà phê).

#### 2. Tiền điều kiện (Pre-conditions)
- Đang mở danh sách điểm đến.

#### 3. Hậu điều kiện (Post-conditions)
- Hiển thị các POI thuộc đúng danh mục/chủ đề được chọn.

#### 4. Điểm kích hoạt (Trigger)
Người dùng nhấn vào các thẻ Danh mục hoặc Dropdown bộ lọc.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Người dùng chọn thẻ "Di tích lịch sử" (HISTORICAL). | Client gửi GET `/api/pois?type=HISTORICAL`. |
| **2** | Chờ tải dữ liệu. | Backend truy vấn CSDL lọc theo điều kiện `poi_type = "HISTORICAL"` và `is_active = true`. |
| **3** | Xem danh sách kết quả. | Giao diện hiển thị danh sách các di tích tiêu biểu: Bến Nhà Rồng, Cầu Mống,... |

#### 6. Các luồng rẽ nhánh (Alternative Flows)
- **Người dùng kết hợp lọc nhiều tiêu chí (Danh mục + Mức giá):**
  Hệ thống kết hợp điều kiện `AND` trong mệnh đề SQL WHERE để trả kết quả chính xác.

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Mỗi POI bắt buộc phải thuộc về 1 loại hình (`poi_type`) hợp lệ nằm trong bảng `poi_types`.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `GET /api/pois?type={code}&categoryId={id}`
- **Backend Controller/Service:** `PoiController -> PoiService`
- **Bảng CSDL liên quan:** `pois, categories, poi_types`

---

### UC-2.3: Lọc danh sách điểm gần nhất theo GPS

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-2.3` |
| **Tên Use Case** | **Lọc danh sách điểm gần nhất theo GPS** |
| **Phân hệ** | 2.0 Khám phá & Quản lý POI |
| **Tác nhân chính (Primary Actor)** | Khách du lịch (Tourist) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | <<extend>> mở rộng cho UC-2.2 |

#### 1. Mô tả tóm tắt (Description)
Sử dụng hàm không gian PostGIS tính toán cự ly thực tế từ tọa độ GPS hiện tại của du khách đến tất cả các POI và sắp xếp tăng dần theo khoảng cách.

#### 2. Tiền điều kiện (Pre-conditions)
- Thiết bị đã bật dịch vụ định vị GPS và cấp quyền truy cập vị trí cho trình duyệt.

#### 3. Hậu điều kiện (Post-conditions)
- Danh sách địa điểm được sắp xếp từ gần nhất đến xa nhất kèm số mét / km hiển thị trực quan.

#### 4. Điểm kích hoạt (Trigger)
Người dùng nhấn nút "Gần tôi nhất" trên thanh bộ lọc.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Người dùng bật tùy chọn "Gần tôi nhất". | Trình duyệt đọc tọa độ GPS thực tế: `lat`, `lng`. |
| **2** | Client gửi GET `/api/pois/nearby?lat={lat}&lng={lng}&radius={meters}`. | Backend thực thi câu lệnh truy vấn PostGIS: `ST_Distance(location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography)`. |
| **3** | Chờ máy chủ tính toán. | Hệ thống lọc các POI nằm trong bán kính chỉ định (mặc định 2000m) và sắp xếp `ORDER BY distance ASC`. |
| **4** | Người dùng xem kết quả. | Mỗi thẻ POI hiển thị khoảng cách rõ ràng (ví dụ: "Cách bạn 180m", "Cách bạn 450m"). |

#### 6. Các luồng rẽ nhánh (Alternative Flows)
- **Người dùng thay đổi bán kính quét (ví dụ: 500m, 1km, 3km):**
  Hệ thống gửi lại request với tham số `radius` tương ứng và cập nhật lại danh sách.

#### 7. Các luồng ngoại lệ (Exception Flows)
- **Người dùng từ chối quyền truy cập vị trí GPS:**
  Hệ thống hiển thị thông báo "Không thể lấy vị trí của bạn, vui lòng cấp quyền GPS để sử dụng tính năng này", tự động chuyển về sắp xếp theo độ phổ biến.

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Khoảng cách không gian phải được tính bằng kiểu dữ liệu `geography(Point, 4326)` để đảm bảo độ chính xác trên bề mặt cong của Trái Đất theo chuẩn WGS84.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `GET /api/pois/nearby?lat={lat}&lng={lng}&radius={meters}`
- **Backend Controller/Service:** `PoiController -> PoiService.findNearby()`
- **Bảng CSDL liên quan:** `pois (Index GIST: idx_pois_location)`

---

### UC-2.4: Xem chi tiết lịch sử, mô tả & tọa độ POI

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-2.4` |
| **Tên Use Case** | **Xem chi tiết lịch sử, mô tả & tọa độ POI** |
| **Phân hệ** | 2.0 Khám phá & Quản lý POI |
| **Tác nhân chính (Primary Actor)** | Khách du lịch (Tourist) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | <<extend>> được mở rộng bởi UC-2.5 (Bộ sưu tập ảnh) |

#### 1. Mô tả tóm tắt (Description)
Hiển thị trang thông tin toàn diện của địa điểm: bài viết giới thiệu lịch sử, kiến trúc, văn hóa, địa chỉ, số điện thoại, giờ mở cửa, khung giá, đánh giá sao và bản đồ mini.

#### 2. Tiền điều kiện (Pre-conditions)
- Người dùng chọn một POI cụ thể từ danh sách hoặc bản đồ.

#### 3. Hậu điều kiện (Post-conditions)
- Toàn bộ chi tiết POI được tải và hiển thị trên màn hình.

#### 4. Điểm kích hoạt (Trigger)
Người dùng click vào Card điểm đến hoặc Marker trên bản đồ.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Người dùng click vào POI "Bảo tàng Hồ Chí Minh - Bến Nhà Rồng". | Client điều hướng đến `/poi/ben-nha-rong` và gửi GET `/api/pois/ben-nha-rong`. |
| **2** | Chờ tải dữ liệu. | Backend truy vấn thông tin chi tiết POI kèm danh mục, loại hình, các ảnh liên kết và số sao trung bình. |
| **3** | Hệ thống hiển thị màn hình chi tiết. | Giao diện hiển thị: Banner ảnh lớn, Nút phát thuyết minh Audio (nếu có), Tọa độ, Giờ mở cửa, Bài thuyết minh lịch sử, Nút "Chỉ đường" và Nút "Lưu yêu thích". |

#### 7. Các luồng ngoại lệ (Exception Flows)
- **Slug hoặc ID điểm đến không tồn tại trong hệ thống:**
  Hệ thống trả về HTTP 404 Not Found, hiển thị trang lỗi thân thiện và nút quay về trang Khám phá.

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Thông tin điểm đến được lưu vào Redis Cache với TTL = 1 giờ để tăng tốc độ phản hồi cho các điểm đến hot.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `GET /api/pois/{slug}`
- **Backend Controller/Service:** `PoiController.getPoiBySlug() -> PoiService`
- **Bảng CSDL liên quan:** `pois, categories, poi_types, poi_images`

---

### UC-2.5: Xem bộ sưu tập hình ảnh điểm đến

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-2.5` |
| **Tên Use Case** | **Xem bộ sưu tập hình ảnh điểm đến** |
| **Phân hệ** | 2.0 Khám phá & Quản lý POI |
| **Tác nhân chính (Primary Actor)** | Khách du lịch (Tourist) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Trung bình |
| **Quan hệ UML** | <<extend>> mở rộng cho UC-2.4 |

#### 1. Mô tả tóm tắt (Description)
Cho phép người dùng xem bộ sưu tập nhiều góc chụp sắc nét của điểm đến (toàn cảnh, cận cảnh, kiến trúc cổ) qua giao diện Lightbox phóng to trực quan.

#### 2. Tiền điều kiện (Pre-conditions)
- Đang mở trang chi tiết POI có chứa hình ảnh trong bảng `poi_images`.

#### 3. Hậu điều kiện (Post-conditions)
- Hiển thị ảnh phóng to chất lượng cao với chú thích chi tiết.

#### 4. Điểm kích hoạt (Trigger)
Người dùng click vào ảnh trong bộ sưu tập ảnh của trang chi tiết.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Người dùng nhấn vào một bức ảnh trong mục Gallery của POI. | Hệ thống mở hộp thoại Lightbox phóng to ảnh. |
| **2** | Người dùng vuốt (swipe) hoặc click nút mũi tên trái/phải. | Hệ thống chuyển tiếp sang ảnh kế tiếp kèm chú thích tương ứng (`caption`). |
| **3** | Người dùng click nút đóng (x). | Hệ thống đóng hộp thoại, trở lại trang chi tiết POI. |

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Ảnh được tải tối ưu dưới định dạng WebP với các kích thước Responsive phù hợp kích thước màn hình.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `Đã nằm trong payload của GET /api/pois/{slug}`
- **Backend Controller/Service:** `PoiController`
- **Bảng CSDL liên quan:** `poi_images`

---

### UC-2.6: Thêm mới địa điểm du lịch & Tọa độ GPS (Admin)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-2.6` |
| **Tên Use Case** | **Thêm mới địa điểm du lịch & Tọa độ GPS (Admin)** |
| **Phân hệ** | 2.0 Khám phá & Quản lý POI |
| **Tác nhân chính (Primary Actor)** | Quản trị viên (Admin / BQL) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | Không |

#### 1. Mô tả tóm tắt (Description)
Cung cấp biểu mẫu cho phép Quản trị viên nhập thông tin điểm đến mới, chọn vị trí trực quan trên bản đồ để lấy tọa độ PostGIS chính xác và tải lên hình ảnh.

#### 2. Tiền điều kiện (Pre-conditions)
- Quản trị viên đã đăng nhập với quyền `ROLE_ADMIN`.

#### 3. Hậu điều kiện (Post-conditions)
- Bản ghi POI mới được tạo trong bảng `pois` với tọa độ Point(lng, lat).
- Bộ nhớ đệm danh sách POI bị xóa để hiển thị ngay điểm đến mới.

#### 4. Điểm kích hoạt (Trigger)
Admin nhấn nút "Thêm mới POI" tại trang `/admin/pois`.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Admin mở form Thêm mới POI. | Hệ thống hiển thị form nhập: Tên, Phân loại, Danh mục, Địa chỉ, Phường, Giờ mở cửa, Giá vé, Bản đồ chọn tọa độ, Upload ảnh. |
| **2** | Admin click lên bản đồ để chấm tọa độ chính xác. | Hệ thống tự động điền kinh độ (lng) và vĩ độ (lat) vào form. |
| **3** | Admin nhập thông tin mô tả lịch sử và nhấn "Lưu địa điểm". | Client gửi POST `/api/admin/pois` kèm payload JSON. |
| **4** | Chờ hệ thống xử lý. | Backend kiểm tra tính hợp lệ dữ liệu, tạo chuỗi slug tự động, sinh trường `location = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography`. |
| **5** | Hệ thống lưu thành công. | Backend tự động gửi lệnh xóa cache Redis liên quan, trả về HTTP 201 Created. |
| **6** | Admin nhận thông báo. | Giao diện hiển thị thông báo "Thêm địa điểm thành công" và cập nhật danh sách. |

#### 7. Các luồng ngoại lệ (Exception Flows)
- **Tên địa điểm bị trùng slug với một điểm đến đã có:**
  Hệ thống tự động nối thêm hậu tố ngẫu nhiên vào slug (ví dụ: `quan-oc-oanh-1`) để bảo toàn tính duy nhất.
- **Tọa độ nằm ngoài phạm vi địa giới Quận 4:**
  Hệ thống hiển thị cảnh báo: "Tọa độ nằm ngoài phạm vi Quận 4, bạn có chắc chắn muốn lưu?".

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Tọa độ bắt buộc phải hợp lệ trong dải: Vĩ độ [-90, 90], Kinh độ [-180, 180].

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `POST /api/admin/pois (Body: CreateAdminPoiRequest)`
- **Backend Controller/Service:** `AdminPoiController -> AdminPoiService`
- **Bảng CSDL liên quan:** `pois, poi_images`

---

### UC-2.7: Chỉnh sửa & Cập nhật thông tin POI (Admin)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-2.7` |
| **Tên Use Case** | **Chỉnh sửa & Cập nhật thông tin POI (Admin)** |
| **Phân hệ** | 2.0 Khám phá & Quản lý POI |
| **Tác nhân chính (Primary Actor)** | Quản trị viên (Admin / BQL) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | Không |

#### 1. Mô tả tóm tắt (Description)
Cho phép Admin sửa đổi thông tin giờ mở cửa, giá vé, bài viết giới thiệu, số điện thoại hoặc định vị lại tọa độ của điểm đến đã tồn tại.

#### 2. Tiền điều kiện (Pre-conditions)
- Admin đã đăng nhập, POI cần sửa tồn tại trong CSDL.

#### 3. Hậu điều kiện (Post-conditions)
- Thông tin mới được ghi đè vào bản ghi POI, trường `updated_at` cập nhật timestamp hiện tại.

#### 4. Điểm kích hoạt (Trigger)
Admin nhấn biểu tượng "Chỉnh sửa" tại hàng địa điểm trong bảng quản trị.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Admin nhấn "Sửa" tại dòng POI. | Hệ thống tải dữ liệu hiện tại của POI vào form chỉnh sửa. |
| **2** | Admin cập nhật giờ mở cửa hoặc bài viết lịch sử, bấm "Cập nhật". | Client gửi PUT `/api/admin/pois/{id}`. |
| **3** | Chờ xử lý. | Backend cập nhật bản ghi trong bảng `pois`, xóa cache POI chi tiết trong Redis. |
| **4** | Nhận kết quả. | Hệ thống trả về HTTP 200 kèm thông báo thành công. |

#### 7. Các luồng ngoại lệ (Exception Flows)
- **POI không tồn tại trong hệ thống:**
  Hệ thống trả về HTTP 404 kèm thông báo lỗi.

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Cập nhật POI phải tự động làm mới nội dung ngữ cảnh RAG cho trợ lý AI.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `PUT /api/admin/pois/{id} (Body: UpdateAdminPoiRequest)`
- **Backend Controller/Service:** `AdminPoiController -> AdminPoiService`
- **Bảng CSDL liên quan:** `pois`

---

### UC-2.8: Xóa địa điểm du lịch khỏi hệ thống (Admin)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-2.8` |
| **Tên Use Case** | **Xóa địa điểm du lịch khỏi hệ thống (Admin)** |
| **Phân hệ** | 2.0 Khám phá & Quản lý POI |
| **Tác nhân chính (Primary Actor)** | Quản trị viên (Admin / BQL) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Trung bình |
| **Quan hệ UML** | Không |

#### 1. Mô tả tóm tắt (Description)
Xóa một điểm đến khỏi hệ thống hoặc chuyển trạng thái sang ngưng hoạt động (`is_active = false`) để đảm bảo toàn vẹn dữ liệu lịch sử.

#### 2. Tiền điều kiện (Pre-conditions)
- Admin đã đăng nhập với quyền `ROLE_ADMIN`.

#### 3. Hậu điều kiện (Post-conditions)
- POI được chuyển trạng thái ngưng hoạt động hoặc xóa hoàn toàn khỏi CSDL.

#### 4. Điểm kích hoạt (Trigger)
Admin nhấn nút "Xóa" tại hàng POI trong danh sách.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Admin bấm nút "Xóa" tại một POI. | Hệ thống hiển thị modal cảnh báo: "Hành động này sẽ ẩn/xóa điểm đến khỏi bản đồ và tour. Bạn có chắc chắn?". |
| **2** | Admin xác nhận xóa. | Client gửi DELETE `/api/admin/pois/{id}`. |
| **3** | Chờ máy chủ thực hiện. | Backend cập nhật `is_active = false` (Soft delete) và xóa cache Redis. |
| **4** | Hoàn tất. | Hệ thống trả về HTTP 200, giao diện ẩn điểm đến khỏi danh sách hiển thị. |

#### 7. Các luồng ngoại lệ (Exception Flows)
- **POI đang là chặng dừng duy nhất của một Tour du lịch đang phát hành:**
  Hệ thống cảnh báo Admin phải gỡ điểm đến khỏi các Tour liên quan trước khi xóa.

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Ưu tiên xóa mềm (Soft delete) để bảo toàn lịch sử đánh giá và dữ liệu lưu trú trong báo cáo.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `DELETE /api/admin/pois/{id}`
- **Backend Controller/Service:** `AdminPoiController -> AdminPoiService`
- **Bảng CSDL liên quan:** `pois`

---

### UC-2.9: Quản lý Danh mục & Loại hình POI (Admin)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-2.9` |
| **Tên Use Case** | **Quản lý Danh mục & Loại hình POI (Admin)** |
| **Phân hệ** | 2.0 Khám phá & Quản lý POI |
| **Tác nhân chính (Primary Actor)** | Quản trị viên (Admin / BQL) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | Không |

#### 1. Mô tả tóm tắt (Description)
Cho phép Admin quản lý các Danh mục điểm đến (`categories`) và 4 Loại hình cốt lõi (`poi_types`: FOOD, HISTORICAL, RELIGIOUS, LANDMARK), bao gồm icon, tên hiển thị và thứ tự sắp xếp.

#### 2. Tiền điều kiện (Pre-conditions)
- Admin đã đăng nhập cổng quản trị.

#### 3. Hậu điều kiện (Post-conditions)
- Bảng `categories` và `poi_types` được cập nhật, đồng bộ vào các bộ lọc người dùng.

#### 4. Điểm kích hoạt (Trigger)
Admin truy cập mục "Quản lý Danh mục" trên thanh menu.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Admin truy cập trang Quản lý danh mục. | Hệ thống hiển thị danh sách các danh mục và loại hình hiện có kèm thứ tự hiển thị. |
| **2** | Admin thêm danh mục mới (ví dụ: "Cà phê bờ sông") hoặc chỉnh sửa icon. | Client gửi POST / PUT lên `/api/categories` hoặc `/api/poi-types`. |
| **3** | Chờ hệ thống lưu. | Backend lưu thông tin và làm mới bộ nhớ đệm danh mục. |
| **4** | Nhận thông báo. | Giao diện cập nhật danh sách danh mục mới. |

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- 4 mã loại hình gốc (`FOOD`, `HISTORICAL`, `RELIGIOUS`, `LANDMARK`) không được phép xóa khỏi CSDL vì là các khóa ngoại toàn vẹn.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `CRUD /api/categories, CRUD /api/poi-types`
- **Backend Controller/Service:** `CategoryController, PoiTypeController`
- **Bảng CSDL liên quan:** `categories, poi_types`

---

## PHÂN HỆ 3.0: ẨM THỰC & MÓN ĂN (CULINARY & FOOD)

Phân hệ giới thiệu tinh hoa ẩm thực Quận 4 (Ốc Vĩnh Khánh, Phá lấu Chợ 200, Ăn vặt đường phố), cung cấp công cụ Lập kế hoạch ngân sách ăn uống thông minh (Budget Planner) và ứng dụng Trí tuệ nhân tạo thị giác Gemini Vision OCR quét thực đơn tự động.

### UC-3.1: Khám phá danh sách món ngon đặc sản Quận 4

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-3.1` |
| **Tên Use Case** | **Khám phá danh sách món ngon đặc sản Quận 4** |
| **Phân hệ** | 3.0 Ẩm thực & Món ăn |
| **Tác nhân chính (Primary Actor)** | Khách du lịch (Tourist) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | Không |

#### 1. Mô tả tóm tắt (Description)
Hiển thị danh sách các món ăn đặc trưng của Quận 4 kèm hình ảnh hấp dẫn, giá tiền, cờ món bán chạy (Best-seller / Signature) và tên quán phục vụ.

#### 2. Tiền điều kiện (Pre-conditions)
- Người dùng truy cập phân hệ Ẩm thực.

#### 3. Hậu điều kiện (Post-conditions)
- Danh sách món ăn được tải và phân nhóm theo chuyên mục.

#### 4. Điểm kích hoạt (Trigger)
Người dùng chọn tab "Ẩm thực" trên thanh điều hướng chính.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Người dùng truy cập trang Ẩm thực. | Client gửi GET `/api/dishes`. |
| **2** | Chờ tải dữ liệu. | Backend truy vấn bảng `dishes` kết hợp với bảng `pois` để lấy tên và địa chỉ quán, ưu tiên các món có `is_signature = true`. |
| **3** | Xem danh sách món ăn. | Giao diện hiển thị các món nổi bật: Ốc hương sốt trứng muối, Càng ghẹ rang muối ớt, Phá lấu bò nước dừa,... |

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Chỉ hiển thị các món có trạng thái `is_available = true`.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `GET /api/dishes`
- **Backend Controller/Service:** `DishController.getAllDishes() -> DishService`
- **Bảng CSDL liên quan:** `dishes, pois, menu_categories`

---

### UC-3.2: Gợi ý món ăn theo ngân sách & số người (Budget Planner)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-3.2` |
| **Tên Use Case** | **Gợi ý món ăn theo ngân sách & số người (Budget Planner)** |
| **Phân hệ** | 3.0 Ẩm thực & Món ăn |
| **Tác nhân chính (Primary Actor)** | Khách du lịch (Tourist) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | <<extend>> được mở rộng bởi UC-3.3 (Lọc bán kính GPS) |

#### 1. Mô tả tóm tắt (Description)
Thuật toán tối ưu hóa lựa chọn món ăn: Du khách nhập tổng ngân sách (ví dụ: 300.000 VNĐ) và số lượng người đi cùng, hệ thống tự động tính toán và đề xuất thực đơn kết hợp cân bằng (Món khai vị + Món chính + Đồ uống) sao cho tổng chi phí tối ưu nhất trong ngân sách.

#### 2. Tiền điều kiện (Pre-conditions)
- Người dùng đang ở công cụ "Lập kế hoạch ăn uống" (Budget Planner).

#### 3. Hậu điều kiện (Post-conditions)
- Hệ thống trả về danh sách combo món gợi ý kèm tổng tiền dự tính và địa chỉ quán.

#### 4. Điểm kích hoạt (Trigger)
Người dùng nhập số tiền, số người và bấm nút "Gợi ý cho tôi".

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Người dùng nhập: Ngân sách = 300.000 đ, Số người = 2 người. | Client gửi POST `/api/dishes/budget-planner` kèm payload `{ budget: 300000, peopleCount: 2 }`. |
| **2** | Chờ thuật toán tính toán. | Backend thực thi thuật toán phân bổ kinh phí theo tỷ lệ tối ưu: Khai vị (20%), Món chính (65%), Đồ uống (15%). |
| **3** | Hệ thống tìm kiếm các món ăn. | Truy vấn từ CSDL các món ăn phù hợp với tỷ lệ phân bổ của các quán uy tín tại Quận 4. |
| **4** | Hệ thống trả về kết quả combo. | Hiển thị thực đơn đề xuất hoàn chỉnh (Ví dụ: 1 Càng ghẹ rang muối + 1 Ốc hương trứng muối + 2 Trà đào cam sả = 280.000 đ). |

#### 6. Các luồng rẽ nhánh (Alternative Flows)
- **Người dùng muốn đổi món trong combo đề xuất:**
  Người dùng click "Đổi món khác", hệ thống gợi ý món thay thế có tầm giá tương đương trong cùng quán.

#### 7. Các luồng ngoại lệ (Exception Flows)
- **Ngân sách nhập vào quá thấp (dưới mức giá của món rẻ nhất):**
  Hệ thống hiển thị thông báo: "Ngân sách tối thiểu đề xuất là 50.000 đ/người để có trải nghiệm ẩm thực trọn vẹn".

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Tổng số tiền của combo gợi ý không được vượt quá 100% ngân sách do người dùng thiết lập.
- Ưu tiên gợi ý các món trong cùng một quán ăn để tiện việc di chuyển và thưởng thức.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `POST /api/dishes/budget-planner (Body: { budget: int, peopleCount: int, lat?: double, lng?: double })`
- **Backend Controller/Service:** `DishController -> DishService.planBudget()`
- **Bảng CSDL liên quan:** `dishes, pois`

---

### UC-3.3: Lọc quán ăn trong bán kính GPS hiện tại

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-3.3` |
| **Tên Use Case** | **Lọc quán ăn trong bán kính GPS hiện tại** |
| **Phân hệ** | 3.0 Ẩm thực & Món ăn |
| **Tác nhân chính (Primary Actor)** | Khách du lịch (Tourist) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | <<extend>> mở rộng cho UC-3.2 |

#### 1. Mô tả tóm tắt (Description)
Kết hợp vị trí GPS thực tế vào thuật toán Budget Planner để chỉ gợi ý các quán ăn nằm trong bán kính đi bộ gần nhất (ví dụ: trong vòng 500m hoặc 1km).

#### 2. Tiền điều kiện (Pre-conditions)
- Người dùng đã cấp quyền GPS, thiết bị có tọa độ vị trí.

#### 3. Hậu điều kiện (Post-conditions)
- Kết quả món ăn đề xuất được giới hạn trong các quán ăn gần vị trí người dùng nhất.

#### 4. Điểm kích hoạt (Trigger)
Người dùng bật công tắc "Chỉ tìm quán gần vị trí của tôi".

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Người dùng bật tùy chọn định vị GPS trong màn hình Budget Planner. | Client lấy tọa độ hiện tại `lat`, `lng`. |
| **2** | Client gửi request kèm tham số tọa độ. | Backend kết hợp truy vấn PostGIS: lọc các `poi_id` thỏa mãn `ST_DWithin(pois.location, point, 1000)` trước khi chạy thuật toán phân bổ món. |
| **3** | Xem kết quả. | Hiển thị combo món kèm khoảng cách đi bộ tới quán (ví dụ: "Cách bạn 250m - Phố ốc Vĩnh Khánh"). |

#### 7. Các luồng ngoại lệ (Exception Flows)
- **Trong bán kính 1km không có quán ăn nào mở cửa:**
  Hệ thống tự động mở rộng bán kính lên 2km và hiển thị thông báo gợi ý mở rộng vùng tìm kiếm.

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Khoảng cách bán kính mặc định là 1000m (tương đương khoảng 10-12 phút đi bộ).

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `POST /api/dishes/budget-planner`
- **Backend Controller/Service:** `DishService`
- **Bảng CSDL liên quan:** `dishes, pois`

---

### UC-3.4: Xem chi tiết món, giá bán & dị ứng nguyên liệu

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-3.4` |
| **Tên Use Case** | **Xem chi tiết món, giá bán & dị ứng nguyên liệu** |
| **Phân hệ** | 3.0 Ẩm thực & Món ăn |
| **Tác nhân chính (Primary Actor)** | Khách du lịch (Tourist) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | Không |

#### 1. Mô tả tóm tắt (Description)
Hiển thị thông tin sâu về món ăn: ảnh chụp cận cảnh độ nét cao, giá niêm yết, thành phần nguyên liệu, công thức chế biến đặc trưng và các cảnh báo dị ứng thực phẩm quan trọng (đậu phộng, hải sản, gluten).

#### 2. Tiền điều kiện (Pre-conditions)
- Người dùng click vào 1 món ăn cụ thể.

#### 3. Hậu điều kiện (Post-conditions)
- Màn hình hiển thị chi tiết món ăn kèm các nhãn cảnh báo an toàn thực phẩm.

#### 4. Điểm kích hoạt (Trigger)
Người dùng click vào thẻ món ăn.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Người dùng click chọn món "Ốc hương sốt trứng muối". | Client gửi GET `/api/dishes/{slug}`. |
| **2** | Chờ tải dữ liệu. | Backend truy vấn bảng `dishes` kèm các cờ dị ứng: `has_peanuts`, `has_seafood`, `has_gluten` và bảng `dish_images`. |
| **3** | Xem chi tiết món. | Giao diện hiển thị: Ảnh phóng to, Giá bán 135.000 đ, Tag "Best-seller", Danh sách nguyên liệu và Huy hiệu cảnh báo: "⚠️ Có chứa Hải sản & Gluten". |

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Nếu tài khoản của người dùng đã cấu hình dị ứng trong Profile (UC-1.7), hệ thống tự động làm nổi bật cảnh báo đỏ nếu món ăn chứa chất dị ứng tương ứng.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `GET /api/dishes/{slug}`
- **Backend Controller/Service:** `DishController -> DishService`
- **Bảng CSDL liên quan:** `dishes, dish_images, pois`

---

### UC-3.5: Quản lý thực đơn & bảng giá bán (Admin)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-3.5` |
| **Tên Use Case** | **Quản lý thực đơn & bảng giá bán (Admin)** |
| **Phân hệ** | 3.0 Ẩm thực & Món ăn |
| **Tác nhân chính (Primary Actor)** | Quản trị viên (Admin / BQL) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | Không |

#### 1. Mô tả tóm tắt (Description)
Cung cấp giao diện quản trị cho phép Admin duyệt danh sách thực đơn của từng quán ăn, cập nhật giá niêm yết, bật/tắt trạng thái còn hàng (`is_available`) và thiết lập cờ món tiêu biểu (`is_signature`).

#### 2. Tiền điều kiện (Pre-conditions)
- Admin đã đăng nhập với quyền `ROLE_ADMIN`.

#### 3. Hậu điều kiện (Post-conditions)
- Bảng giá và trạng thái món được cập nhật tức thì trên toàn hệ thống.

#### 4. Điểm kích hoạt (Trigger)
Admin truy cập mục "Quản lý Thực đơn" tại trang `/admin/menu`.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Admin chọn quán ăn "Quán Ốc Oanh". | Hệ thống hiển thị bảng thực đơn của quán chia theo danh mục (Món ăn chơi, Món chính, Đồ uống). |
| **2** | Admin sửa giá bán món ăn từ 120.000 đ thành 135.000 đ và tích chọn cờ "Món tiêu biểu". | Client gửi PUT `/api/admin/dishes/{id}`. |
| **3** | Chờ hệ thống lưu. | Backend cập nhật bản ghi trong bảng `dishes`, làm mới cache thực đơn. |
| **4** | Nhận thông báo. | Hệ thống hiển thị thông báo "Cập nhật món thành công". |

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Giá món ăn phải là số nguyên dương $\ge 0$.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `GET /api/admin/menu/poi/{poiId}, PUT /api/admin/dishes/{id}`
- **Backend Controller/Service:** `AdminMenuController -> AdminMenuService`
- **Bảng CSDL liên quan:** `dishes, menu_categories`

---

### UC-3.6: Thêm món ăn mới vào quán (Admin)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-3.6` |
| **Tên Use Case** | **Thêm món ăn mới vào quán (Admin)** |
| **Phân hệ** | 3.0 Ẩm thực & Món ăn |
| **Tác nhân chính (Primary Actor)** | Quản trị viên (Admin / BQL) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | Không |

#### 1. Mô tả tóm tắt (Description)
Cho phép Admin nhập thông tin món ăn thủ công vào thực đơn của quán ăn: tên món, giá bán, mô tả, thành phần và ảnh minh họa.

#### 2. Tiền điều kiện (Pre-conditions)
- Admin đã đăng nhập, quán ăn mục tiêu đã tồn tại trong bảng `pois`.

#### 3. Hậu điều kiện (Post-conditions)
- Bản ghi món mới được thêm vào bảng `dishes`.

#### 4. Điểm kích hoạt (Trigger)
Admin bấm "Thêm món mới" trên giao diện quản trị thực đơn.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Admin mở form Thêm món mới, điền: Tên, Giá, Đơn vị tính, Thành phần, chọn quán ăn. | Hệ thống kiểm tra hợp lệ dữ liệu nhập. |
| **2** | Admin bấm "Lưu món ăn". | Client gửi POST `/api/admin/dishes`. |
| **3** | Chờ máy chủ xử lý. | Backend tạo bản ghi mới trong bảng `dishes`, liên kết với `poi_id` tương ứng. |
| **4** | Hoàn tất. | Hệ thống trả về HTTP 201 Created. |

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Mỗi món ăn phải liên kết với 1 `poi_id` hợp lệ.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `POST /api/admin/dishes (Body: CreateAdminDishRequest)`
- **Backend Controller/Service:** `AdminMenuController -> AdminMenuService`
- **Bảng CSDL liên quan:** `dishes`

---

### UC-3.7: Quét thực đơn tự động bằng AI OCR (Admin)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-3.7` |
| **Tên Use Case** | **Quét thực đơn tự động bằng AI OCR (Admin)** |
| **Phân hệ** | 3.0 Ẩm thực & Món ăn |
| **Tác nhân chính (Primary Actor)** | Quản trị viên (Admin / BQL) |
| **Tác nhân phụ (Secondary Actor)** | Google Gemini Vision (Multimodal AI) |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | <<include>> UC-3.8 (Xác nhận bản nháp OCR) |

#### 1. Mô tả tóm tắt (Description)
Tính năng tự động hóa đỉnh cao: Admin chỉ cần chụp hoặc tải lên hình ảnh chụp bảng thực đơn thực tế tại quán ăn; hệ thống gửi ảnh đến mô hình Gemini Vision để tự động nhận diện ký tự quang học (OCR), bóc tách cấu trúc Tên món, Giá bán, Đơn vị tính và phân loại món vào danh sách nháp chỉ trong vài giây.

#### 2. Tiền điều kiện (Pre-conditions)
- Admin đã đăng nhập cổng quản trị.
- File ảnh chụp thực đơn rõ nét (JPEG, PNG, WebP) dung lượng dưới 10MB.

#### 3. Hậu điều kiện (Post-conditions)
- Bản nháp danh sách món ăn bóc tách được hiển thị sẵn sàng cho Admin kiểm tra và duyệt.

#### 4. Điểm kích hoạt (Trigger)
Admin nhấn nút "Quét thực đơn bằng AI" tại trang quản trị thực đơn và tải ảnh lên.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Admin chọn quán ăn mục tiêu, nhấn nút "Quét thực đơn bằng AI" và chọn file ảnh chụp menu. | Client tải ảnh lên và hiển thị màn hình chờ với hiệu ứng scanning trực quan. |
| **2** | Client gửi ảnh qua POST `/api/admin/menu/ocr-scan` (Multipart/form-data). | Backend tiếp nhận ảnh, chuyển đổi sang Base64 và xây dựng Structured Prompt cho Gemini Multimodal API. |
| **3** | Gemini AI xử lý ảnh thị giác. | Mô hình nhận dạng các dòng văn bản trên ảnh menu, phân tích cặp Tên món - Giá tiền, trích xuất cấu trúc JSON có định dạng `[{ name, price, unit, category }]`. |
| **4** | Backend nhận JSON từ Gemini. | Hệ thống chuẩn hóa dữ liệu: làm sạch chuỗi giá (loại bỏ ký tự k, đ, vnđ, dấu chấm/phẩy), chuyển về số nguyên INT. |
| **5** | Hệ thống gọi UC-3.8. | Chuyển toàn bộ danh sách bóc tách được thành danh sách bản nháp (`DetectedDishDraft`) hiển thị trên giao diện kiểm duyệt. |

#### 6. Các luồng rẽ nhánh (Alternative Flows)
- **Ảnh chụp có nhiều cột hoặc thực đơn phức tạp:**
  Gemini Vision tự động phân tách theo từng cột và nhóm món dựa trên tiêu đề phân mục trên ảnh.

#### 7. Các luồng ngoại lệ (Exception Flows)
- **Ảnh quá mờ, rung lắc hoặc thiếu sáng không thể đọc được:**
  Hệ thống thông báo: "AI không thể nhận diện rõ văn bản trong ảnh. Vui lòng chụp lại ảnh rõ nét hơn hoặc nhập thủ công".
- **Hết hạn ngạch (Quota) hoặc lỗi mạng tới Gemini API:**
  Hệ thống ghi log lỗi và hiển thị thông báo lỗi dịch vụ AI, đề xuất Admin thử lại sau.

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Giá tiền sau khi bóc tách phải được chuẩn hóa về đơn vị VNĐ nguyên bản (Ví dụ: "135k" $\rightarrow$ 135000, "75.000" $\rightarrow$ 75000).
- AI chỉ sinh bản nháp đề xuất, bắt buộc phải có sự xác nhận của Admin (UC-3.8) trước khi lưu chính thức vào CSDL.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `POST /api/admin/menu/ocr-scan (Multipart: file, poiId)`
- **Backend Controller/Service:** `AdminMenuController -> AdminMenuService -> GeminiClient`
- **Bảng CSDL liên quan:** `Bộ nhớ tạm / DTO DetectedDishDraft`

---

### UC-3.8: Kiểm tra & Xác nhận bản nháp OCR (Admin)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-3.8` |
| **Tên Use Case** | **Kiểm tra & Xác nhận bản nháp OCR (Admin)** |
| **Phân hệ** | 3.0 Ẩm thực & Món ăn |
| **Tác nhân chính (Primary Actor)** | Quản trị viên (Admin / BQL) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | <<include>> được gọi bởi UC-3.7 |

#### 1. Mô tả tóm tắt (Description)
Cho phép Quản trị viên đối soát danh sách món do AI bóc tách trực tiếp so với ảnh gốc, chỉnh sửa các lỗi sai sót (nếu có), xóa các dòng không cần thiết và bấm 1 nút để lưu hàng loạt (Batch Insert) vào CSDL.

#### 2. Tiền điều kiện (Pre-conditions)
- Tiến trình OCR UC-3.7 vừa hoàn thành và trả về danh sách bản nháp.

#### 3. Hậu điều kiện (Post-conditions)
- Tất cả các món đã xác nhận được thêm đồng loạt vào bảng `dishes` của quán.

#### 4. Điểm kích hoạt (Trigger)
Giao diện tự động mở bảng kiểm duyệt sau khi hoàn tất quét OCR.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Admin xem danh sách món ăn do AI đề xuất hiển thị cạnh ảnh chụp gốc. | Giao diện hiển thị bảng gồm: Tên món, Giá đề xuất, Đơn vị, Checkbox chọn lưu. |
| **2** | Admin chỉnh sửa lại tên 1 món bị AI đọc sai chính tả nhẹ (nếu có). | Hệ thống cập nhật giá trị trường dữ liệu trên giao diện. |
| **3** | Admin bỏ chọn các dòng quảng cáo/đồ uống không cần lưu. | Hệ thống loại bỏ các dòng đó khỏi mảng lưu. |
| **4** | Admin nhấn nút "Lưu toàn bộ vào thực đơn" (Save All). | Client gửi POST `/api/admin/menu/batch-import` kèm mảng các món đã duyệt. |
| **5** | Chờ máy chủ thực thi. | Backend thực thi Batch Insert trong 1 Database Transaction duy nhất, ghi tất cả vào bảng `dishes`. |
| **6** | Hoàn tất. | Hệ thống trả về HTTP 200 kèm số lượng món đã thêm (ví dụ: "Đã thêm thành công 18 món vào thực đơn!"). |

#### 7. Các luồng ngoại lệ (Exception Flows)
- **Lỗi CSDL trong quá trình Batch Insert:**
  Database Transaction tự động Rollback toàn bộ, đảm bảo không xảy ra tình trạng lưu dở dang một nửa số món.

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Giao dịch phải mang tính toàn vẹn (ACID Transactional): hoặc thành công tất cả, hoặc không lưu gì cả.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `POST /api/admin/menu/batch-import (Body: { poiId, dishes: [...] })`
- **Backend Controller/Service:** `AdminMenuController -> AdminMenuService`
- **Bảng CSDL liên quan:** `dishes`

---

## PHÂN HỆ 4.0: TOUR DU LỊCH & LỘ TRÌNH (TOURS & ITINERARIES)

Phân hệ cung cấp các Tour du lịch theo chủ đề được tuyển chọn sẵn và tính năng Lập lộ trình tùy biến thông minh (Custom Plan Generator) ứng dụng thuật toán Tối ưu hóa Hành trình người bán hàng (Traveling Salesperson Problem - Greedy TSP) kết hợp dịch vụ định tuyến OSRM.

### UC-4.1: Xem danh sách Tour du lịch theo chủ đề

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-4.1` |
| **Tên Use Case** | **Xem danh sách Tour du lịch theo chủ đề** |
| **Phân hệ** | 4.0 Tour du lịch & Lộ trình |
| **Tác nhân chính (Primary Actor)** | Khách du lịch (Tourist) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | Không |

#### 1. Mô tả tóm tắt (Description)
Hiển thị các tour du lịch được thiết kế sẵn theo nhiều chủ đề hấp dẫn: "Lịch sử & Hoài niệm Quận 4", "Thiên đường Ốc đêm Vĩnh Khánh", "Hành trình Xóm Đạo & Tâm linh", kèm thời lượng ước tính, cự ly và số lượng điểm dừng.

#### 2. Tiền điều kiện (Pre-conditions)
- Người dùng mở tab "Tour & Lộ trình".

#### 3. Hậu điều kiện (Post-conditions)
- Danh sách tour được hiển thị kèm thẻ tóm tắt và đánh giá sao trung bình.

#### 4. Điểm kích hoạt (Trigger)
Người dùng chọn mục "Tour du lịch" trên thanh điều hướng.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Người dùng truy cập trang danh sách Tour. | Client gửi GET `/api/tours`. |
| **2** | Chờ tải dữ liệu. | Backend truy vấn bảng `tours`, kèm điểm đánh giá từ `tour_reviews` và số lượng chặng dừng từ `tour_stops`. |
| **3** | Xem danh sách các tour. | Giao diện hiển thị các Card Tour: Ảnh bìa, Tên tour, Thời lượng (ví dụ: 120 phút), Khoảng cách (ví dụ: 2.5 km), Số điểm dừng (ví dụ: 5 điểm), Số sao đánh giá. |

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Chỉ hiển thị các Tour có trạng thái công khai (`is_active = true`).

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `GET /api/tours`
- **Backend Controller/Service:** `TourController.getAllTours() -> TourService`
- **Bảng CSDL liên quan:** `tours, tour_stops, tour_reviews`

---

### UC-4.2: Xem chi tiết lộ trình & thứ tự chặng dừng (Tour Stops)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-4.2` |
| **Tên Use Case** | **Xem chi tiết lộ trình & thứ tự chặng dừng (Tour Stops)** |
| **Phân hệ** | 4.0 Tour du lịch & Lộ trình |
| **Tác nhân chính (Primary Actor)** | Khách du lịch (Tourist) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | Không |

#### 1. Mô tả tóm tắt (Description)
Hiển thị toàn bộ thông tin chi tiết của một Tour: bản đồ hành trình nối các điểm dừng bằng đường Polyline, danh sách thứ tự chặng (Stop 1, Stop 2...), thời gian tham quan dự kiến tại mỗi điểm và nút "Bắt đầu đi Tour".

#### 2. Tiền điều kiện (Pre-conditions)
- Người dùng click chọn một Tour cụ thể.

#### 3. Hậu điều kiện (Post-conditions)
- Trang chi tiết Tour hiển thị đầy đủ lộ trình và danh sách chặng dừng.

#### 4. Điểm kích hoạt (Trigger)
Người dùng click vào Card Tour.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Người dùng chọn Tour "Hành trình Lịch sử Quận 4". | Client gửi GET `/api/tours/{id}`. |
| **2** | Chờ tải dữ liệu. | Backend truy vấn chi tiết Tour và join bảng `tour_stops` kết hợp bảng `pois` theo thứ tự `stop_order ASC`. |
| **3** | Xem lộ trình chi tiết. | Bản đồ vẽ các điểm dừng và tuyến đường nối; cột bên cạnh liệt kê từng chặng: 1. Bến Nhà Rồng (45p) $\rightarrow$ 2. Cầu Mống (30p) $\rightarrow$ 3. Nhà thờ Xóm Chiếu (30p). |
| **4** | Người dùng bấm nút "Bắt đầu hành trình". | Hệ thống chuyển sang chế độ Dẫn đường tương tác theo tour trên bản đồ GIS (UC-5.5). |

#### 7. Các luồng ngoại lệ (Exception Flows)
- **Tour không tồn tại hoặc đã bị ẩn:**
  Hệ thống trả về HTTP 404, điều hướng về trang danh sách tour.

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Thứ tự các chặng dừng phải được sắp xếp tuần tự tăng dần theo trường `stop_order` (1, 2, 3...).

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `GET /api/tours/{id}`
- **Backend Controller/Service:** `TourController.getTourDetail() -> TourService`
- **Bảng CSDL liên quan:** `tours, tour_stops, pois`

---

### UC-4.3: Tự động sinh lộ trình Custom Plan (Greedy TSP)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-4.3` |
| **Tên Use Case** | **Tự động sinh lộ trình Custom Plan (Greedy TSP)** |
| **Phân hệ** | 4.0 Tour du lịch & Lộ trình |
| **Tác nhân chính (Primary Actor)** | Khách du lịch (Tourist) |
| **Tác nhân phụ (Secondary Actor)** | Dịch vụ OSRM (Ma trận khoảng cách) |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | <<include>> UC-4.4 (Tính ma trận TSP), <<extend>> được mở rộng bởi UC-4.5 (Lưu Tour) |

#### 1. Mô tả tóm tắt (Description)
Tính năng tối ưu hóa lộ trình cá nhân hóa: Du khách chỉ định quỹ thời gian rảnh (ví dụ: 90 phút, 180 phút), phương thức di chuyển (đi bộ) và danh sách các thể loại/điểm đến muốn ghé thăm; hệ thống tự động tính toán thứ tự ghé thăm tối ưu nhất để tiết kiệm thời gian di chuyển giữa các điểm.

#### 2. Tiền điều kiện (Pre-conditions)
- Người dùng truy cập mục "Thiết kế tour tự chọn" (Custom Plan).

#### 3. Hậu điều kiện (Post-conditions)
- Lộ trình tùy biến hoàn chỉnh được tạo ra kèm tổng thời gian, quãng đường đi bộ và thứ tự các điểm dừng tối ưu.

#### 4. Điểm kích hoạt (Trigger)
Người dùng nhập tiêu chí thời gian, vị trí xuất phát và nhấn "Tạo lộ trình tối ưu".

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Người dùng chọn: Thời gian rảnh = 120 phút, Vị trí xuất phát = Vị trí GPS hiện tại, Thể loại = Ẩm thực + Di tích. | Client gửi POST `/api/tours/custom-plan` kèm payload `{ durationMinutes: 120, startLat: ..., startLng: ..., categories: [...] }`. |
| **2** | Hệ thống chọn lọc tập điểm đến ứng viên. | Backend truy vấn CSDL các POI phù hợp nằm trong bán kính di chuyển khả thi theo thời gian rảnh. |
| **3** | Hệ thống gọi UC-4.4. | Gửi tọa độ tập POI ứng viên sang OSRM Table API để lấy ma trận thời gian di chuyển, chạy thuật toán Greedy TSP tìm đường đi ngắn nhất. |
| **4** | Cắt tỉa lộ trình theo quỹ thời gian: | Cộng dồn thời gian di chuyển và thời gian tham quan tại mỗi điểm; dừng lại khi chạm ngưỡng 120 phút của du khách. |
| **5** | Người dùng nhận kết quả lộ trình tùy biến. | Hiển thị lộ trình hoàn chỉnh: Thứ tự ghé thăm tối ưu, tổng quãng đường đi bộ (ví dụ: 1.8 km), tổng thời gian dự kiến (115 phút). |

#### 6. Các luồng rẽ nhánh (Alternative Flows)
- **Người dùng muốn đổi điểm xuất phát (ví dụ: Chọn từ Cầu Mống thay vì GPS hiện tại):**
  Người dùng chọn điểm xuất phát khác trên bản đồ, hệ thống tái tính toán lại thứ tự lộ trình tối ưu.

#### 7. Các luồng ngoại lệ (Exception Flows)
- **Quỹ thời gian quá ngắn (dưới 30 phút):**
  Hệ thống thông báo: "Quỹ thời gian tối thiểu để tạo lộ trình tham quan là 45 phút. Vui lòng tăng thời gian".
- **Dịch vụ OSRM không phản hồi hoặc timeout:**
  Hệ thống tự động sử dụng công thức khoảng cách đường chim bay (Haversine Distance) làm ma trận dự phòng để giải bài toán TSP cục bộ.

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Thời gian dừng chân mặc định tại mỗi điểm di tích là 30 phút, điểm ẩm thực là 45 phút, điểm cảnh quan là 20 phút.
- Tổng thời gian tính toán bao gồm: $\sum (Thời\ gian\ di\ chuyển\ giữa\ các\ chặng) + \sum (Thời\ gian\ dừng\ chân\ tại\ từng\ điểm)$.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `POST /api/tours/custom-plan (Body: CustomPlanRequest)`
- **Backend Controller/Service:** `TourController -> CustomPlanService -> OSRM Client`
- **Bảng CSDL liên quan:** `pois, categories`

---

### UC-4.4: Tính ma trận khoảng cách tối ưu (Greedy TSP Engine)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-4.4` |
| **Tên Use Case** | **Tính ma trận khoảng cách tối ưu (Greedy TSP Engine)** |
| **Phân hệ** | 4.0 Tour du lịch & Lộ trình |
| **Tác nhân chính (Primary Actor)** | Hệ thống (System Core) |
| **Tác nhân phụ (Secondary Actor)** | Dịch vụ OSRM Table API |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | <<include>> được gọi bởi UC-4.3 |

#### 1. Mô tả tóm tắt (Description)
Thành phần thuật toán giải quyết bài toán người bán hàng (Traveling Salesperson Problem) theo chiến lược Greedy (Láng giềng gần nhất - Nearest Neighbor) trên ma trận khoảng cách thực tế từ mạng lưới đường phố OSRM.

#### 2. Tiền điều kiện (Pre-conditions)
- Nhận danh sách $N$ tọa độ điểm đến ($N \ge 2$).

#### 3. Hậu điều kiện (Post-conditions)
- Trả về mảng thứ tự các điểm dừng đã tối ưu hóa để tổng quãng đường đi là nhỏ nhất.

#### 4. Điểm kích hoạt (Trigger)
Được gọi tự động bởi UC-4.3 trong tiến trình sinh Custom Plan.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Tiến trình chuyển tập tọa độ sang URL OSRM Table: | Gọi GET `http://osrm:5000/table/v1/walking/{coords}?annotations=distance,duration`. |
| **2** | OSRM trả về ma trận $N \times N$: | Ma trận chứa thời gian di chuyển chính xác theo mạng lưới đường bộ giữa mọi cặp điểm. |
| **3** | Thuật toán Greedy khởi chạy: | Bắt đầu từ điểm xuất phát $S_0$. Tại mỗi bước, chọn điểm kế tiếp $S_{next}$ chưa ghé thăm có chi phí di chuyển nhỏ nhất từ điểm hiện tại. |
| **4** | Hoàn tất chu trình: | Ghi nhận chuỗi chặng dừng tối ưu và trả kết quả cho Use Case cha. |

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Độ phức tạp thuật toán Greedy là $\mathcal{O}(N^2)$, đảm bảo thời gian tính toán dưới 100ms trên máy chủ đối với tập $N \le 15$ điểm đến.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `Internal Component / External OSRM Table API`
- **Backend Controller/Service:** `CustomPlanService.solveGreedyTSP()`
- **Bảng CSDL liên quan:** `Không`

---

### UC-4.5: Lưu Tour tùy biến vào danh mục cá nhân (Save Custom Tour)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-4.5` |
| **Tên Use Case** | **Lưu Tour tùy biến vào danh mục cá nhân (Save Custom Tour)** |
| **Phân hệ** | 4.0 Tour du lịch & Lộ trình |
| **Tác nhân chính (Primary Actor)** | Người dùng đăng ký (Registered User) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Trung bình |
| **Quan hệ UML** | <<extend>> mở rộng cho UC-4.3 |

#### 1. Mô tả tóm tắt (Description)
Cho phép người dùng đã đăng nhập lưu lại lộ trình Custom Plan vừa sinh vào bộ sưu tập tour riêng của mình để có thể mở lại trải nghiệm bất kỳ lúc nào.

#### 2. Tiền điều kiện (Pre-conditions)
- Người dùng đã đăng nhập tài khoản (`ROLE_USER`), đã sinh Custom Plan thành công.

#### 3. Hậu điều kiện (Post-conditions)
- Bản ghi tour mới được tạo trong bảng `tours` với cờ `is_custom = true` gắn liền với `user_id` người tạo.

#### 4. Điểm kích hoạt (Trigger)
Người dùng nhấn nút "Lưu vào Tour của tôi" trên kết quả Custom Plan.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Người dùng nhập tên cho tour (ví dụ: "Tour ẩm thực chiều thứ 7") và bấm "Lưu". | Client gửi POST `/api/tours/save-custom`. |
| **2** | Chờ hệ thống lưu. | Backend lưu tour vào bảng `tours`, lưu các chặng dừng vào `tour_stops` kèm cờ chỉ định người sở hữu. |
| **3** | Nhận thông báo. | Hệ thống trả về HTTP 201 Created kèm thông báo "Đã lưu tour vào danh mục cá nhân của bạn!". |

#### 7. Các luồng ngoại lệ (Exception Flows)
- **Khách vãng lai bấm nút Lưu tour:**
  Hệ thống hiển thị Modal đăng nhập/đăng ký (UC-1.1 / UC-1.2) để người dùng đăng nhập trước khi hoàn tất lưu.

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Mỗi tài khoản được lưu tối đa 20 tour tùy biến cá nhân.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `POST /api/tours/save-custom`
- **Backend Controller/Service:** `TourController -> TourService`
- **Bảng CSDL liên quan:** `tours, tour_stops`

---

### UC-4.6: Viết đánh giá & Chấm sao Tour du lịch (Tour Reviews)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-4.6` |
| **Tên Use Case** | **Viết đánh giá & Chấm sao Tour du lịch (Tour Reviews)** |
| **Phân hệ** | 4.0 Tour du lịch & Lộ trình |
| **Tác nhân chính (Primary Actor)** | Người dùng đăng ký (Registered User) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Trung bình |
| **Quan hệ UML** | Không |

#### 1. Mô tả tóm tắt (Description)
Cho phép du khách sau khi trải nghiệm tour có thể viết nhận xét, góp ý và chấm điểm chất lượng lộ trình từ 1 đến 5 sao.

#### 2. Tiền điều kiện (Pre-conditions)
- Người dùng đã đăng nhập tài khoản (`ROLE_USER`).

#### 3. Hậu điều kiện (Post-conditions)
- Bản ghi đánh giá tour được ghi vào bảng `tour_reviews`, điểm sao trung bình của tour được cập nhật lại.

#### 4. Điểm kích hoạt (Trigger)
Người dùng bấm nút "Viết đánh giá Tour" tại màn hình chi tiết tour.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Người dùng mở form đánh giá tour, chọn số sao (1-5 sao) và nhập bình luận trải nghiệm. | Client kiểm tra độ dài nhận xét. |
| **2** | Người dùng bấm "Gửi đánh giá". | Client gửi POST `/api/tour-reviews` kèm payload `{ tourId, rating, comment }`. |
| **3** | Chờ máy chủ xử lý. | Backend lưu bản ghi vào `tour_reviews`, tính toán lại điểm `avg_rating` của tour trong bảng `tours`. |
| **4** | Nhận kết quả. | Hệ thống trả về HTTP 201, đánh giá mới xuất hiện ngay trên trang chi tiết tour. |

#### 7. Các luồng ngoại lệ (Exception Flows)
- **Người dùng đã từng đánh giá tour này trước đó:**
  Hệ thống cho phép cập nhật lại điểm số và nhận xét cũ thay vì tạo bản ghi trùng lặp.

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Điểm đánh giá phải là số nguyên từ 1 đến 5 sao.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `POST /api/tour-reviews (Body: CreateTourReviewRequest)`
- **Backend Controller/Service:** `TourController -> TourReviewRepository`
- **Bảng CSDL liên quan:** `tour_reviews, tours`

---

### UC-4.7: Thiết lập Tour mới & Cấu hình chặng dừng (Admin)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-4.7` |
| **Tên Use Case** | **Thiết lập Tour mới & Cấu hình chặng dừng (Admin)** |
| **Phân hệ** | 4.0 Tour du lịch & Lộ trình |
| **Tác nhân chính (Primary Actor)** | Quản trị viên (Admin / BQL) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | Không |

#### 1. Mô tả tóm tắt (Description)
Cung cấp công cụ cho Quản trị viên biên soạn các Tour du lịch chính thức cho Quận 4: đặt tên tour, tải ảnh bìa, kéo thả chọn các POI làm chặng dừng, sắp xếp thứ tự ghé thăm và quy định thời gian tham quan tại từng trạm.

#### 2. Tiền điều kiện (Pre-conditions)
- Admin đã đăng nhập với quyền `ROLE_ADMIN`.

#### 3. Hậu điều kiện (Post-conditions)
- Tour mới và các chặng dừng được ghi vào CSDL, sẵn sàng phát hành cho du khách.

#### 4. Điểm kích hoạt (Trigger)
Admin nhấn nút "Tạo Tour mới" tại trang `/admin/tours`.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Admin mở form tạo Tour, điền tên, mô tả, chọn chủ đề, upload ảnh bìa. | Hệ thống hiển thị danh sách các POI có sẵn để thêm vào tour. |
| **2** | Admin lần lượt thêm 4 điểm đến: Bến Nhà Rồng, Cầu Mống, Chùa Giác Nguyên, Ốc Oanh. | Giao diện hiển thị danh sách chặng dừng với các nút kéo thả sắp xếp thứ tự. |
| **3** | Admin cấu hình thời gian tham quan tại mỗi điểm và bấm "Lưu & Xuất bản". | Client gửi POST `/api/admin/tours`. |
| **4** | Chờ hệ thống lưu. | Backend thực thi Transaction lưu vào bảng `tours` và hàng loạt bản ghi trong `tour_stops` theo đúng `stop_order`. |
| **5** | Hoàn tất. | Hệ thống thông báo thành công, Tour xuất hiện trên trang chủ ứng dụng. |

#### 7. Các luồng ngoại lệ (Exception Flows)
- **Tour không có chặng dừng nào (danh sách rỗng):**
  Hệ thống chặn submit và cảnh báo: "Một tour du lịch phải có tối thiểu 2 chặng dừng trở lên".

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Một tour chính thức phải có tối thiểu 2 điểm dừng và tối đa 15 điểm dừng.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `POST /api/admin/tours (Body: CreateTourRequest)`
- **Backend Controller/Service:** `AdminTourController -> TourService`
- **Bảng CSDL liên quan:** `tours, tour_stops`

---

### UC-4.8: Chỉnh sửa & Xóa Tour du lịch (Admin)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-4.8` |
| **Tên Use Case** | **Chỉnh sửa & Xóa Tour du lịch (Admin)** |
| **Phân hệ** | 4.0 Tour du lịch & Lộ trình |
| **Tác nhân chính (Primary Actor)** | Quản trị viên (Admin / BQL) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | Không |

#### 1. Mô tả tóm tắt (Description)
Cho phép Admin cập nhật thông tin tour, thêm/bớt chặng dừng, thay đổi thứ tự các điểm hoặc xóa tour ngưng khai thác.

#### 2. Tiền điều kiện (Pre-conditions)
- Admin đã đăng nhập, Tour cần chỉnh sửa tồn tại trong hệ thống.

#### 3. Hậu điều kiện (Post-conditions)
- Thông tin tour và danh sách chặng dừng được đồng bộ mới.

#### 4. Điểm kích hoạt (Trigger)
Admin nhấn "Sửa" hoặc "Xóa" tại hàng tour trong bảng quản trị.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Admin chọn Tour cần sửa, thay đổi thời gian ước tính và bấm "Cập nhật". | Client gửi PUT `/api/admin/tours/{id}`. |
| **2** | Chờ xử lý. | Backend cập nhật thông tin trong CSDL và làm mới cache. |
| **3** | Nhận thông báo. | Hệ thống trả về HTTP 200. |

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Xóa tour sẽ tự động xóa các chặng dừng liên kết trong `tour_stops` (Cascade Delete).

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `PUT /api/admin/tours/{id}, DELETE /api/admin/tours/{id}`
- **Backend Controller/Service:** `AdminTourController -> TourService`
- **Bảng CSDL liên quan:** `tours, tour_stops`

---

## PHÂN HỆ 5.0: BẢN ĐỒ GIS & DẪN ĐƯỜNG (GIS MAP & NAVIGATION)

Phân hệ cung cấp bản đồ không gian địa lý số hóa tương tác đa lớp (Esri World Street Map, Topographic, Satellite), tích hợp định vị thời gian thực GPS và thuật toán dẫn đường đi bộ từng bước (Turn-by-turn Navigation) thông qua máy chủ định tuyến OSRM.

### UC-5.1: Xem bản đồ tương tác (Zoom, Pan, Ghim POI)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-5.1` |
| **Tên Use Case** | **Xem bản đồ tương tác (Zoom, Pan, Ghim POI)** |
| **Phân hệ** | 5.0 Bản đồ GIS & Dẫn đường |
| **Tác nhân chính (Primary Actor)** | Khách du lịch (Tourist) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | <<extend>> được mở rộng bởi UC-5.2 (Đổi lớp bản đồ nền), UC-5.4 (Popup Marker) |

#### 1. Mô tả tóm tắt (Description)
Hiển thị bản đồ số toàn diện của Quận 4 với đầy đủ các Marker điểm đến được phân màu và biểu tượng theo danh mục (Ẩm thực 🍲, Di tích 🏛️, Tôn giáo ⛩️, Cảnh quan 🌉), hỗ trợ thao tác thu phóng, xoay và di chuyển mượt mà.

#### 2. Tiền điều kiện (Pre-conditions)
- Người dùng truy cập trang Bản đồ (`/map`).

#### 3. Hậu điều kiện (Post-conditions)
- Bản đồ GIS tải hoàn tất, hiển thị đầy đủ các ghim địa điểm trong khung nhìn (Viewport).

#### 4. Điểm kích hoạt (Trigger)
Người dùng bấm tab "Bản đồ" trên thanh menu.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Người dùng mở màn hình Bản đồ. | Client khởi tạo khung Leaflet Map, căn giữa tọa độ trung tâm Quận 4 (10.7600, 106.7030), mức phóng to ban đầu Zoom = 15. |
| **2** | Client gửi GET `/api/pois` lấy danh sách điểm đến. | Backend trả về GeoJSON FeatureCollection của toàn bộ các POI. |
| **3** | Bản đồ vẽ các Marker lên giao diện. | Các Marker hiển thị theo đúng tọa độ kinh độ/vĩ độ, áp dụng icon tương ứng theo loại hình điểm đến. |
| **4** | Người dùng thao tác cuộn chuột để phóng to/thu nhỏ hoặc kéo rê bản đồ. | Bản đồ phản hồi tức thì với tốc độ khung hình 60 FPS. |

#### 7. Các luồng ngoại lệ (Exception Flows)
- **Mất kết nối mạng trong lúc đang xem bản đồ:**
  Bản đồ sử dụng các mảnh gạch bản đồ (Map Tiles) đã được lưu tạm trong bộ nhớ đệm trình duyệt để duy trì hiển thị ngoại tuyến.

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Tọa độ giới hạn khung nhìn (Bounding Box) tự động khóa trong phạm vi Quận 4 và các quận lân cận giáp ranh để tránh người dùng bị trôi bản đồ quá xa.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `GET /api/pois`
- **Backend Controller/Service:** `Map.tsx (Frontend Leaflet Component) -> PoiController`
- **Bảng CSDL liên quan:** `pois`

---

### UC-5.2: Chuyển đổi lớp bản đồ nền (Basemap Toggle)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-5.2` |
| **Tên Use Case** | **Chuyển đổi lớp bản đồ nền (Basemap Toggle)** |
| **Phân hệ** | 5.0 Bản đồ GIS & Dẫn đường |
| **Tác nhân chính (Primary Actor)** | Khách du lịch (Tourist) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Trung bình |
| **Quan hệ UML** | <<extend>> mở rộng cho UC-5.1 |

#### 1. Mô tả tóm tắt (Description)
Cho phép người dùng linh hoạt chuyển đổi giữa 3 lớp bản đồ nền chuyên dụng từ nhà cung cấp bản đồ GIS hàng đầu thế giới Esri ArcGIS: Bản đồ đường phố (World Street Map), Bản đồ địa hình chi tiết (World Topographic Map) và Bản đồ ảnh chụp vệ tinh (World Imagery).

#### 2. Tiền điều kiện (Pre-conditions)
- Bản đồ đang hiển thị trên màn hình.

#### 3. Hậu điều kiện (Post-conditions)
- Lớp bản đồ nền (TileLayer) được thay thế mượt mà mà không làm mất vị trí các Marker và lộ trình đang vẽ.

#### 4. Điểm kích hoạt (Trigger)
Người dùng bấm vào nút chuyển lớp bản đồ (Basemap Selector) ở góc trên bên phải màn hình.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Người dùng click nút "Lớp bản đồ". | Hệ thống hiển thị menu lựa chọn: 1. Đường phố (Street), 2. Địa hình (Topo), 3. Vệ tinh (Satellite). |
| **2** | Người dùng click chọn "Bản đồ Vệ tinh". | Leaflet gỡ bỏ TileLayer cũ và kích hoạt URL gạch bản đồ vệ tinh Esri ArcGIS Server. |
| **3** | Bản đồ chuyển sang nền vệ tinh sắc nét. | Hiển thị hình ảnh chụp từ vệ tinh các con đường, dòng kênh Bến Nghé và các tòa nhà Quận 4. |

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Lựa chọn lớp bản đồ nền của người dùng được lưu vào LocalStorage để ghi nhớ cho các lần truy cập tiếp theo.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `Client-side Tile URLs (server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x})`
- **Backend Controller/Service:** `Map.tsx`
- **Bảng CSDL liên quan:** `Không`

---

### UC-5.3: Bật định vị GPS theo dõi vị trí thực tế

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-5.3` |
| **Tên Use Case** | **Bật định vị GPS theo dõi vị trí thực tế** |
| **Phân hệ** | 5.0 Bản đồ GIS & Dẫn đường |
| **Tác nhân chính (Primary Actor)** | Khách du lịch (Tourist) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | Không |

#### 1. Mô tả tóm tắt (Description)
Kích hoạt bộ định vị vệ tinh GPS của thiết bị di động, hiển thị chấm tròn màu xanh lam có vòng tròn bán kính sai số (Accuracy Circle) đại diện cho vị trí người dùng và liên tục bám theo khi di chuyển.

#### 2. Tiền điều kiện (Pre-conditions)
- Thiết bị có chip GPS, người dùng cho phép trình duyệt truy cập vị trí.

#### 3. Hậu điều kiện (Post-conditions)
- Vị trí du khách hiển thị theo thời gian thực trên bản đồ, bản đồ tự động di chuyển tâm theo bước chân người dùng.

#### 4. Điểm kích hoạt (Trigger)
Người dùng nhấn nút "Định vị vị trí của tôi" (Biểu tượng GPS Target).

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Người dùng bấm biểu tượng GPS. | Client gọi API `navigator.geolocation.watchPosition()` với tùy chọn `enableHighAccuracy: true`. |
| **2** | Thiết bị trả về tọa độ chính xác: vĩ độ, kinh độ, độ chính xác (mét). | Bản đồ vẽ Marker vị trí người dùng kèm vòng tròn bán kính sai số màu xanh lam nhạt. |
| **3** | Khách du lịch bước đi trên phố. | Vị trí chấm xanh cập nhật liên tục theo từng giây, tâm bản đồ tự động dịch chuyển trơn tru (FlyTo) theo bước chân. |

#### 7. Các luồng ngoại lệ (Exception Flows)
- **Tín hiệu GPS bị yếu hoặc mất kết nối trong hẻm sâu:**
  Vòng tròn sai số mở rộng, hệ thống hiển thị cảnh báo nhẹ: "Độ chính xác GPS thấp, đang cố gắng định vị lại".

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Tần số cập nhật vị trí GPS được tối ưu hóa ở mức 1-3 giây/lần để tiết kiệm pin thiết bị di động.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `HTML5 Geolocation API (`navigator.geolocation.watchPosition`)`
- **Backend Controller/Service:** `useGeolocation hook -> Map.tsx`
- **Bảng CSDL liên quan:** `Không`

---

### UC-5.4: Xem Popup tóm tắt thông tin khi chọn Marker

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-5.4` |
| **Tên Use Case** | **Xem Popup tóm tắt thông tin khi chọn Marker** |
| **Phân hệ** | 5.0 Bản đồ GIS & Dẫn đường |
| **Tác nhân chính (Primary Actor)** | Khách du lịch (Tourist) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | <<extend>> mở rộng cho UC-5.1 |

#### 1. Mô tả tóm tắt (Description)
Khi người dùng click vào một Marker bất kỳ trên bản đồ, một thẻ Popup nhỏ gọn bật lên ngay tại đỉnh Marker chứa ảnh đại diện, tên quán/di tích, đánh giá sao, địa chỉ và 2 nút bấm tiện ích: "Xem chi tiết" và "Chỉ đường đến đây".

#### 2. Tiền điều kiện (Pre-conditions)
- Bản đồ đang hiển thị các Marker POI.

#### 3. Hậu điều kiện (Post-conditions)
- Popup thông tin mở ra đúng vị trí Marker được chọn.

#### 4. Điểm kích hoạt (Trigger)
Người dùng nhấp chuột hoặc chạm tay vào một Marker.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Người dùng chạm vào Marker "Quán Ốc Oanh". | Bản đồ zoom nhẹ và mở khung Popup. |
| **2** | Xem thông tin tóm tắt trong Popup. | Popup hiển thị: Ảnh bìa món ốc, Tên quán, 4.6 ⭐ (320 đánh giá), "534 Vĩnh Khánh, Phường 8". |
| **3** | Người dùng nhấn nút "Chỉ đường đến đây". | Hệ thống tự động kích hoạt tính năng tìm đường đi bộ (UC-5.5) từ vị trí hiện tại đến Quán Ốc Oanh. |

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Tại một thời điểm chỉ có duy nhất một Popup được mở trên bản đồ.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `Leaflet Popup Component`
- **Backend Controller/Service:** `Map.tsx`
- **Bảng CSDL liên quan:** `pois`

---

### UC-5.5: Yêu cầu tìm đường đi bộ từ vị trí tới POI

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-5.5` |
| **Tên Use Case** | **Yêu cầu tìm đường đi bộ từ vị trí tới POI** |
| **Phân hệ** | 5.0 Bản đồ GIS & Dẫn đường |
| **Tác nhân chính (Primary Actor)** | Khách du lịch (Tourist) |
| **Tác nhân phụ (Secondary Actor)** | Dịch vụ OSRM API (/route/v1/walking) |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | <<include>> UC-5.6 (Giải mã Polyline), <<extend>> được mở rộng bởi UC-5.7 (Hướng dẫn từng bước) |

#### 1. Mô tả tóm tắt (Description)
Tìm kiếm tuyến đường đi bộ ngắn nhất, an toàn và tối ưu nhất từ vị trí hiện tại của du khách đến địa điểm mục tiêu thông qua mạng lưới đường phố thực tế của máy chủ OSRM.

#### 2. Tiền điều kiện (Pre-conditions)
- Đã xác định được tọa độ xuất phát (GPS) và tọa độ đích (POI).

#### 3. Hậu điều kiện (Post-conditions)
- Vẽ đường dẫn màu xanh đậm trên bản đồ, hiển thị cự ly và thời gian đi bộ dự kiến (ETA).

#### 4. Điểm kích hoạt (Trigger)
Người dùng nhấn nút "Chỉ đường" tại trang chi tiết hoặc trong Popup Marker.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Người dùng nhấn "Chỉ đường" tới Bến Nhà Rồng. | Client lấy tọa độ xuất phát $(lat_1, lng_1)$ và tọa độ đích $(lat_2, lng_2)$. |
| **2** | Client gửi yêu cầu định tuyến sang máy chủ OSRM: | Gọi GET `http://osrm:5000/route/v1/walking/{lng1},{lat1};{lng2},{lat2}?overview=full&geometries=polyline&steps=true`. |
| **3** | OSRM tính toán và trả về kết quả. | Gọi UC-5.6 giải mã Polyline, vẽ tuyến đường đi bộ uốn lượn chính xác theo các con đường trên bản đồ. |
| **4** | Người dùng xem thông tin lộ trình. | Thanh điều hướng dưới đáy màn hình hiển thị: "Khoảng cách: 650m • Thời gian đi bộ: 8 phút". |

#### 6. Các luồng rẽ nhánh (Alternative Flows)
- **Khách du lịch di chuyển lệch khỏi tuyến đường đã chỉ định quá 30m:**
  Hệ thống tự động phát hiện sai lệch (Rerouting) và gửi yêu cầu tính lại lộ trình mới từ vị trí hiện tại.

#### 7. Các luồng ngoại lệ (Exception Flows)
- **Không tìm thấy đường đi bộ khả dụng giữa 2 điểm (ví dụ cách sông không có cầu gần):**
  Hệ thống hiển thị thông báo: "Không tìm thấy tuyến đường đi bộ trực tiếp. Vui lòng chọn điểm xuất phát khác gần cầu hơn".

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Tốc độ đi bộ trung bình dùng để tính toán thời gian ETA được chuẩn hóa ở mức $5.0\text{ km/h}$ ($1.38\text{ m/s}$).

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `GET /route/v1/walking/{coords} (OSRM Backend Routing)`
- **Backend Controller/Service:** `Map.tsx -> OSRM API Client`
- **Bảng CSDL liên quan:** `Không`

---

### UC-5.6: Giải mã Polyline & Tính cự ly, thời gian ETA

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-5.6` |
| **Tên Use Case** | **Giải mã Polyline & Tính cự ly, thời gian ETA** |
| **Phân hệ** | 5.0 Bản đồ GIS & Dẫn đường |
| **Tác nhân chính (Primary Actor)** | Hệ thống (System Core) |
| **Tác nhân phụ (Secondary Actor)** | OSRM API |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | <<include>> được gọi bởi UC-5.5 |

#### 1. Mô tả tóm tắt (Description)
Tiến trình giải mã chuỗi mã hóa ký tự Polyline (Google Encoded Polyline Algorithm Format) nhận từ OSRM thành mảng các cặp tọa độ `[lat, lng]` thực tế và định dạng hiển thị khoảng cách (m, km) cùng thời gian ETA (phút).

#### 2. Tiền điều kiện (Pre-conditions)
- Nhận được chuỗi mã hóa `geometry` từ phản hồi của OSRM.

#### 3. Hậu điều kiện (Post-conditions)
- Mảng tọa độ được nạp vào đối tượng `L.polyline` của Leaflet để vẽ lên Canvas bản đồ.

#### 4. Điểm kích hoạt (Trigger)
Được gọi tự động ngay sau khi OSRM phản hồi thành công.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Tiến trình tiếp nhận chuỗi Polyline. | Sử dụng thuật toán giải mã nhị phân Polyline Decoder chuyển thành danh sách các điểm nút tọa độ. |
| **2** | Tính toán định dạng hiển thị: | Nếu khoảng cách $< 1000m \rightarrow$ hiển thị ví dụ "450 m"; nếu $\ge 1000m \rightarrow$ hiển thị ví dụ "1.2 km". |
| **3** | Vẽ tuyến đường lên bản đồ: | Tạo Polyline màu xanh `#2563eb` với độ dày `weight = 5` và độ trong suốt `opacity = 0.8`. |
| **4** | Tự động chỉnh góc nhìn: | Gọi `map.fitBounds(polyline.getBounds())` để bao trọn toàn bộ tuyến đường vừa tìm trong tầm nhìn người dùng. |

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Độ chính xác tọa độ giải mã đạt 5 chữ số thập phân (sai số dưới 1 mét).

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `Client-side Utility (`@mapbox/polyline` hoặc thuật toán decode tự viết)`
- **Backend Controller/Service:** `Map.tsx`
- **Bảng CSDL liên quan:** `Không`

---

### UC-5.7: Xem bảng hướng dẫn di chuyển từng bước (Turn-by-turn)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-5.7` |
| **Tên Use Case** | **Xem bảng hướng dẫn di chuyển từng bước (Turn-by-turn)** |
| **Phân hệ** | 5.0 Bản đồ GIS & Dẫn đường |
| **Tác nhân chính (Primary Actor)** | Khách du lịch (Tourist) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Trung bình |
| **Quan hệ UML** | <<extend>> mở rộng cho UC-5.5 |

#### 1. Mô tả tóm tắt (Description)
Cung cấp danh sách các chỉ dẫn di chuyển trực quan từng ngã rẽ: "Đi thẳng 200m trên đường Hoàng Diệu", "Rẽ trái vào đường Vĩnh Khánh", "Điểm đến nằm bên tay phải", giúp du khách dễ dàng điều hướng trong mạng lưới ngõ hẻm Quận 4.

#### 2. Tiền điều kiện (Pre-conditions)
- Đã có lộ trình dẫn đường đang hoạt động.

#### 3. Hậu điều kiện (Post-conditions)
- Bảng hướng dẫn từng bước hiển thị ở khay trượt (Bottom Sheet) có thể kéo mở rộng.

#### 4. Điểm kích hoạt (Trigger)
Người dùng vuốt mở khay chỉ đường hoặc bấm vào thanh trạng thái dẫn đường.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Người dùng chạm vào thanh chỉ dẫn đường. | Khay trượt mở lên hiển thị danh sách các bước rẽ tuần tự. |
| **2** | Xem từng chỉ dẫn: | Mỗi bước hiển thị icon hướng rẽ (mũi tên rẽ trái, rẽ phải, đi thẳng), tên đường và khoảng cách tới ngã rẽ kế tiếp. |
| **3** | Người dùng click vào 1 bước chỉ dẫn cụ thể. | Bản đồ tự động phóng to và dịch chuyển tiêu điểm đến đúng giao lộ của ngã rẽ đó. |

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Các hướng rẽ được phiên dịch tự động sang tiếng Việt chuẩn theo các mã thao tác của OSRM (turn, depart, arrive, new name).

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `Trích xuất từ trường `steps` trong payload OSRM Route`
- **Backend Controller/Service:** `Map.tsx`
- **Bảng CSDL liên quan:** `Không`

---

## PHÂN HỆ 6.0: THUYẾT MINH GPS TỰ ĐỘNG (AUDIO AUTO-GUIDE)

Phân hệ "Linh hồn" của dự án Saigon Whispers: Biến chiếc điện thoại thông minh thành một Hướng dẫn viên du lịch ảo cá nhân. Ứng dụng công nghệ hàng rào địa lý Geofence (Haversine $\le 30m$) để tự động phát hiện khi du khách bước chân đến gần di tích và tự động kích hoạt bài thuyết minh giọng đọc truyền cảm mà không cần bất kỳ thao tác bấm nút nào.

### UC-6.1: Bật chế độ Thuyết minh tự động (Auto-Guide Mode)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-6.1` |
| **Tên Use Case** | **Bật chế độ Thuyết minh tự động (Auto-Guide Mode)** |
| **Phân hệ** | 6.0 Thuyết minh GPS tự động |
| **Tác nhân chính (Primary Actor)** | Khách du lịch (Tourist) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | <<include>> UC-6.2 (Quét Geofence 30m) |

#### 1. Mô tả tóm tắt (Description)
Cho phép du khách kích hoạt chế độ "Rảnh tay" (Hands-free Tourism): Người dùng có thể đút điện thoại vào túi quần hoặc đeo tai nghe, ứng dụng tự động chạy ngầm, theo dõi vị trí và phát âm thanh khi đến đúng điểm.

#### 2. Tiền điều kiện (Pre-conditions)
- Thiết bị đã bật định vị GPS, trình duyệt được cấp quyền chạy âm thanh.

#### 3. Hậu điều kiện (Post-conditions)
- Chế độ Auto-Guide chuyển sang trạng thái Active (Icon radar quét màu xanh lá phát sáng), tiến trình quét Geofence bắt đầu hoạt động.

#### 4. Điểm kích hoạt (Trigger)
Người dùng nhấn vào công tắc "Thuyết minh tự động (Auto-Guide)" trên màn hình chính hoặc bản đồ.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Người dùng bật công tắc "Auto-Guide". | Hệ thống yêu cầu xác nhận quyền phát âm thanh tự động (Audio Autoplay Policy). |
| **2** | Người dùng nhấn "Đồng ý kích hoạt". | Hệ thống phát một đoạn âm thanh ngắn (chime) không lời để xin quyền AudioContext từ trình duyệt thành công. |
| **3** | Khởi động tiến trình nền. | Gọi UC-6.2 khởi chạy vòng lặp quét khoảng cách Geofence với chu kỳ 3 giây/lần. |
| **4** | Khách du lịch bắt đầu tản bộ tham quan. | Giao diện hiển thị trạng thái: "Đang quét các điểm di tích xung quanh bạn...". |

#### 6. Các luồng rẽ nhánh (Alternative Flows)
- **Người dùng bấm tắt công tắc Auto-Guide:**
  Hệ thống dừng vòng lặp quét, tạm dừng âm thanh đang phát (nếu có) và đưa về chế độ nghe thủ công.

#### 7. Các luồng ngoại lệ (Exception Flows)
- **Trình duyệt chặn quyền tự động phát âm thanh (Autoplay Blocked):**
  Hệ thống hiển thị thông báo Modal hướng dẫn người dùng chạm 1 lần vào màn hình để mở khóa âm thanh.

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Khi chế độ Auto-Guide đang bật, màn hình được giữ sáng nhẹ (Wake Lock API nếu được hỗ trợ) để tránh hệ điều hành tắt tiến trình định vị.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `HTML5 Web Audio API, Geolocation Watcher`
- **Backend Controller/Service:** `useAudioGuide hook -> AudioPlayer.tsx`
- **Bảng CSDL liên quan:** `poi_audios`

---

### UC-6.2: Quét khoảng cách Geofence (Haversine <= 30m)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-6.2` |
| **Tên Use Case** | **Quét khoảng cách Geofence (Haversine <= 30m)** |
| **Phân hệ** | 6.0 Thuyết minh GPS tự động |
| **Tác nhân chính (Primary Actor)** | Hệ thống (System Core) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | <<include>> được gọi bởi UC-6.1, <<include>> gọi tiếp UC-6.3 |

#### 1. Mô tả tóm tắt (Description)
Thuật toán tính toán khoảng cách cầu lớn (Great-circle Distance) sử dụng công thức Haversine giữa tọa độ GPS hiện tại của du khách $(lat_1, lng_1)$ với tất cả các điểm di tích $(lat_2, lng_2)$ có file thuyết minh, so sánh với ngưỡng bán kính kích hoạt quy định ($R \le 30m$).

#### 2. Tiền điều kiện (Pre-conditions)
- Auto-Guide đang bật, thiết bị cập nhật tọa độ GPS mới.

#### 3. Hậu điều kiện (Post-conditions)
- Xác định được POI gần nhất có khoảng cách $\le 30m$ chưa được nghe trong phiên hiện tại.

#### 4. Điểm kích hoạt (Trigger)
Kích hoạt tự động theo chu kỳ mỗi khi GPS trả về tọa độ mới.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | GPS trả về tọa độ $(lat_u, lng_u)$. | Duyệt qua danh sách các POI có audio trong bộ nhớ tạm. |
| **2** | Hệ thống áp dụng công thức Haversine: | Tính khoảng cách $d = 2r \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta lat}{2}\right) + \cos(lat_u)\cos(lat_{poi})\sin^2\left(\frac{\Delta lng}{2}\right)}\right)$. |
| **3** | Kiểm tra điều kiện ngưỡng: | Nếu $d \le 30\text{ mét}$ và POI này chưa phát trong vòng 30 phút qua $\rightarrow$ Gọi UC-6.3. |

#### 6. Các luồng rẽ nhánh (Alternative Flows)
- **Khoảng cách $d > 30m$ với tất cả các điểm:**
  Hệ thống tiếp tục duy trì trạng thái chờ, không thực hiện hành động phát.

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Bán kính kích hoạt mặc định là $30\text{ mét}$ (có thể được ghi đè bởi cấu hình riêng `trigger_radius` trong bảng `poi_audios`).
- Cơ chế chống phát lặp lại (Cooldown): Cùng một địa điểm sẽ không tự động phát lại lần thứ hai trong vòng 30 phút trừ khi người dùng bấm phát thủ công.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `Client-side Haversine Function`
- **Backend Controller/Service:** `haversineDistance(lat1, lon1, lat2, lon2)`
- **Bảng CSDL liên quan:** `poi_audios, pois`

---

### UC-6.3: Tự động phát âm thanh khi vào vùng di tích

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-6.3` |
| **Tên Use Case** | **Tự động phát âm thanh khi vào vùng di tích** |
| **Phân hệ** | 6.0 Thuyết minh GPS tự động |
| **Tác nhân chính (Primary Actor)** | Hệ thống (System Core) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | <<include>> được gọi bởi UC-6.2 |

#### 1. Mô tả tóm tắt (Description)
Tự động tải luồng âm thanh bài thuyết minh MP3 từ máy chủ/CDN và phát qua tai nghe/loa ngoài kèm hiệu ứng rung nhẹ thiết bị (Vibration API) và hiển thị thông báo nổi thông báo cho du khách biết họ đã đến di tích.

#### 2. Tiền điều kiện (Pre-conditions)
- Thuật toán Geofence UC-6.2 xác nhận khoảng cách $\le 30m$.

#### 3. Hậu điều kiện (Post-conditions)
- Audio thuyết minh bắt đầu phát, thanh phát mini xuất hiện trên màn hình.

#### 4. Điểm kích hoạt (Trigger)
Được gọi tự động khi thỏa mãn điều kiện khoảng cách Geofence.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Du khách bước vào cổng Bảo tàng Bến Nhà Rồng (cách 22m). | Hệ thống kích hoạt rung nhẹ thiết bị 200ms thông báo cho du khách. |
| **2** | Âm thanh tự động cất lên trong tai nghe. | Trình phát tự động fade-in âm lượng và phát bài thuyết minh giọng chuẩn truyền cảm: "Chào mừng bạn đến với Di tích lịch sử Bến Nhà Rồng...". |
| **3** | Giao diện hiển thị thanh Mini Player. | Hiển thị ảnh di tích, thanh tiến trình thời gian và lời thuyết minh. |

#### 7. Các luồng ngoại lệ (Exception Flows)
- **Đang có một bài thuyết minh khác đang phát dở dang:**
  Hệ thống không ngắt đột ngột bài cũ mà hiển thị thông báo popup hỏi người dùng có muốn chuyển sang nghe bài của di tích mới hay không.

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Âm thanh sử dụng định dạng nén tối ưu MP3 bitrate 128kbps để đảm bảo chất lượng giọng đọc trong trẻo và tải nhanh ngay cả khi sóng 4G yếu.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `GET /audio/{filename}.mp3`
- **Backend Controller/Service:** `AudioPlayer.tsx`
- **Bảng CSDL liên quan:** `poi_audios`

---

### UC-6.4: Điều khiển phát Audio (Play, Pause, Tua lại)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-6.4` |
| **Tên Use Case** | **Điều khiển phát Audio (Play, Pause, Tua lại)** |
| **Phân hệ** | 6.0 Thuyết minh GPS tự động |
| **Tác nhân chính (Primary Actor)** | Khách du lịch (Tourist) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | <<extend>> được mở rộng bởi UC-6.5 (Xem Transcript), <<include>> gọi UC-6.6 (Ghi nhận bài nghe) |

#### 1. Mô tả tóm tắt (Description)
Cung cấp trình điều khiển phát âm thanh chuyên nghiệp: nút Tạm dừng (Pause), Tiếp tục (Play), Tua nhanh 15 giây, Tua lùi 15 giây, thanh trượt Seekbar tùy chỉnh và điều chỉnh âm lượng.

#### 2. Tiền điều kiện (Pre-conditions)
- Một bài thuyết minh đang được tải hoặc đang phát.

#### 3. Hậu điều kiện (Post-conditions)
- Trạng thái phát của âm thanh phản hồi theo thao tác người dùng.

#### 4. Điểm kích hoạt (Trigger)
Người dùng nhấn các nút điều khiển trên thanh Audio Player.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Người dùng bấm nút Tạm dừng (Pause) để chụp ảnh. | Hệ thống dừng phát âm thanh, ghi nhớ vị trí giây hiện tại. |
| **2** | Người dùng bấm Play để nghe tiếp. | Âm thanh tiếp tục phát từ đúng vị trí tạm dừng. |
| **3** | Người dùng bấm nút "Lùi 15s" để nghe lại một đoạn lịch sử vừa qua. | Hệ thống dịch chuyển con trỏ phát ngược lại 15 giây. |
| **4** | Bài thuyết minh phát đến giây cuối cùng. | Hệ thống gọi UC-6.6 để ghi nhận sự kiện hoàn thành bài nghe vào báo cáo lưu trú. |

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Thao tác điều khiển hỗ trợ cả qua phím bấm vật lý trên tai nghe Bluetooth (MediaSession API).

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `HTML5 Audio Element & MediaSession API`
- **Backend Controller/Service:** `AudioPlayer.tsx`
- **Bảng CSDL liên quan:** `Không`

---

### UC-6.5: Xem lời thoại văn bản thuyết minh (Audio Transcript)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-6.5` |
| **Tên Use Case** | **Xem lời thoại văn bản thuyết minh (Audio Transcript)** |
| **Phân hệ** | 6.0 Thuyết minh GPS tự động |
| **Tác nhân chính (Primary Actor)** | Khách du lịch (Tourist) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Trung bình |
| **Quan hệ UML** | <<extend>> mở rộng cho UC-6.4 |

#### 1. Mô tả tóm tắt (Description)
Cung cấp văn bản toàn bộ kịch bản bài thuyết minh bên dưới thanh phát âm thanh, hỗ trợ du khách khi ở môi trường ồn ào không nghe rõ tai nghe hoặc người khiếm thính có thể đọc trọn vẹn câu chuyện di tích.

#### 2. Tiền điều kiện (Pre-conditions)
- POI có chứa nội dung văn bản kịch bản trong cột `transcript`.

#### 3. Hậu điều kiện (Post-conditions)
- Khung kịch bản văn bản được mở ra, chữ hiển thị rõ ràng dễ đọc.

#### 4. Điểm kích hoạt (Trigger)
Người dùng nhấn nút "Xem lời thoại (Transcript)" trên Audio Player.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Người dùng nhấn biểu tượng văn bản Transcript. | Hệ thống mở rộng khung hiển thị lời thoại bên dưới player. |
| **2** | Đọc toàn văn câu chuyện lịch sử. | Văn bản được phân đoạn rõ ràng theo từng đoạn văn lịch sử, kích thước chữ lớn chống mỏi mắt. |
| **3** | Người dùng bấm thu gọn. | Khung transcript đóng lại, trả về giao diện bản đồ gọn gàng. |

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Hỗ trợ chế độ Dark Mode đọc ban đêm không chói mắt.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `Lấy từ trường `transcript` trong GET /api/audio-stories/{poiId}`
- **Backend Controller/Service:** `AudioController -> AudioStory`
- **Bảng CSDL liên quan:** `poi_audios`

---

### UC-6.6: Ghi nhận hoàn thành bài nghe (Telemetry Log)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-6.6` |
| **Tên Use Case** | **Ghi nhận hoàn thành bài nghe (Telemetry Log)** |
| **Phân hệ** | 6.0 Thuyết minh GPS tự động |
| **Tác nhân chính (Primary Actor)** | Hệ thống (System Core) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | <<include>> được gọi bởi UC-6.4 |

#### 1. Mô tả tóm tắt (Description)
Ghi nhận dữ liệu viễn trắc (Telemetry) khi du khách nghe bài thuyết minh (thời lượng nghe thực tế tính bằng giây, chế độ tự động hay thủ công) và gửi về máy chủ để phục vụ Thống kê Lượt nghe Thuyết minh (Thẻ Dashboard số 2 của Admin).

#### 2. Tiền điều kiện (Pre-conditions)
- Du khách nghe bài thuyết minh đạt tối thiểu 15 giây hoặc nghe hết bài.

#### 3. Hậu điều kiện (Post-conditions)
- Bản ghi mới được lưu vào bảng `audio_listen_logs` phục vụ báo cáo.

#### 4. Điểm kích hoạt (Trigger)
Kích hoạt khi người dùng nghe hết bài hoặc tắt player sau khi đã nghe > 15s.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Du khách nghe xong bài thuyết minh thời lượng 95 giây. | Client tự động tổng hợp payload viễn trắc: `{ poiId, durationSeconds: 95, isAutoPlay: true, completed: true }`. |
| **2** | Client gửi ngầm POST `/api/analytics/audio-listen` (sử dụng `navigator.sendBeacon` hoặc fetch non-blocking). | Backend tiếp nhận request và ghi vào bảng `audio_listen_logs`. |
| **3** | Chờ máy chủ ghi nhận. | Hệ thống tăng bộ đếm lượt nghe tổng hợp của POI trong CSDL. |

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Các lượt nghe dưới 5 giây được coi là thao tác bấm nhầm (Bounce) và tự động bị loại bỏ khỏi thống kê phân tích.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `POST /api/analytics/audio-listen (Body: AudioListenRequest)`
- **Backend Controller/Service:** `AnalyticsController -> AnalyticsService`
- **Bảng CSDL liên quan:** `audio_listen_logs`

---

### UC-6.7: Upload Audio & Cấu hình bán kính phát (Admin)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-6.7` |
| **Tên Use Case** | **Upload Audio & Cấu hình bán kính phát (Admin)** |
| **Phân hệ** | 6.0 Thuyết minh GPS tự động |
| **Tác nhân chính (Primary Actor)** | Quản trị viên (Admin / BQL) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | Không |

#### 1. Mô tả tóm tắt (Description)
Cung cấp giao diện cho Admin tải lên file âm thanh MP3 cho từng di tích, nghe thử trực tiếp trên trình duyệt, cấu hình bán kính kích hoạt Geofence (ví dụ: 30m, 50m tùy độ rộng của khuôn viên di tích) và thiết lập tên giọng đọc.

#### 2. Tiền điều kiện (Pre-conditions)
- Admin đã đăng nhập với quyền `ROLE_ADMIN`.

#### 3. Hậu điều kiện (Post-conditions)
- File âm thanh được lưu trữ, bản ghi `poi_audios` được tạo/cập nhật liên kết với POI.

#### 4. Điểm kích hoạt (Trigger)
Admin nhấn "Quản lý Thuyết minh" tại trang quản trị POI.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Admin chọn POI "Nhà thờ Xóm Chiếu", nhấn "Upload Audio". | Hệ thống mở form tải tệp âm thanh. |
| **2** | Admin chọn file MP3 từ máy tính, nhập tên người đọc "Phương Nam - Giọng Miền Nam truyền cảm", đặt bán kính kích hoạt = 35m. | Client kiểm tra định dạng tệp (MP3, WAV, AAC, dung lượng < 20MB). |
| **3** | Admin bấm "Tải lên & Lưu". | Client gửi POST `/api/admin/audio/upload` kèm file Multipart. |
| **4** | Chờ máy chủ lưu trữ. | Backend lưu file vào thư mục lưu trữ media tĩnh, tạo bản ghi trong bảng `poi_audios`. |
| **5** | Hoàn tất. | Hệ thống phát âm thanh nghe thử và báo thành công. |

#### 7. Các luồng ngoại lệ (Exception Flows)
- **File tải lên không phải là định dạng âm thanh hợp lệ:**
  Hệ thống từ chối tệp với mã HTTP 415 Unsupported Media Type và yêu cầu tải lại file MP3.

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Bán kính kích hoạt Geofence phải là số nguyên dương trong khoảng từ 10m đến 100m.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `POST /api/admin/audio/upload (Multipart file, poiId, radius, voiceName)`
- **Backend Controller/Service:** `AdminAudioController -> AudioService`
- **Bảng CSDL liên quan:** `poi_audios`

---

### UC-6.8: Biên soạn kịch bản lời thoại thuyết minh (Admin)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-6.8` |
| **Tên Use Case** | **Biên soạn kịch bản lời thoại thuyết minh (Admin)** |
| **Phân hệ** | 6.0 Thuyết minh GPS tự động |
| **Tác nhân chính (Primary Actor)** | Quản trị viên (Admin / BQL) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Trung bình |
| **Quan hệ UML** | Không |

#### 1. Mô tả tóm tắt (Description)
Cho phép Admin nhập và chỉnh sửa văn bản kịch bản thuyết minh (Transcript) đồng bộ với file ghi âm MP3, hỗ trợ định dạng câu chuyện văn hóa, giai thoại lịch sử và câu hỏi tương tác.

#### 2. Tiền điều kiện (Pre-conditions)
- Admin đã đăng nhập, POI đã có bản ghi audio.

#### 3. Hậu điều kiện (Post-conditions)
- Nội dung transcript được cập nhật trong cột `transcript` của bảng `poi_audios`.

#### 4. Điểm kích hoạt (Trigger)
Admin bấm vào nút "Chỉnh sửa Lời thoại" tại màn hình quản lý audio.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Admin mở trình soạn thảo văn bản kịch bản. | Hệ thống tải nội dung transcript hiện tại. |
| **2** | Admin hiệu đính lời thoại lịch sử và nhấn "Lưu kịch bản". | Client gửi PUT `/api/admin/audio/{id}/transcript`. |
| **3** | Chờ hệ thống lưu. | Backend cập nhật bản ghi trong CSDL và làm mới dữ liệu nạp ngữ cảnh AI RAG. |
| **4** | Nhận thông báo. | Hệ thống báo cập nhật thành công. |

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Văn bản transcript phải sử dụng tiếng Việt chuẩn Unicode UTF-8.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `PUT /api/admin/audio/{id}/transcript`
- **Backend Controller/Service:** `AdminAudioController`
- **Bảng CSDL liên quan:** `poi_audios`

---

## PHÂN HỆ 7.0: TRỢ LÝ DU LỊCH ẢO AI (AI VIRTUAL ASSISTANT)

Phân hệ tích hợp mô hình ngôn ngữ lớn tiên tiến nhất từ Google (Gemini 3.5 Flash Lite) ứng dụng kiến trúc Tạo sinh tăng cường truy xuất (Retrieval-Augmented Generation - RAG) nhằm cung cấp câu trả lời văn hóa, lịch sử, ẩm thực Quận 4 chính xác, sống động và loại bỏ hiện tượng bịa đặt thông tin (Hallucination).

### UC-7.1: Hỏi đáp văn hóa, lịch sử & ẩm thực với AI (Gemini RAG)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-7.1` |
| **Tên Use Case** | **Hỏi đáp văn hóa, lịch sử & ẩm thực với AI (Gemini RAG)** |
| **Phân hệ** | 7.0 Trợ lý Du lịch Ảo AI |
| **Tác nhân chính (Primary Actor)** | Khách du lịch (Tourist) |
| **Tác nhân phụ (Secondary Actor)** | Google Gemini AI (gemini-3.5-flash-lite) |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | <<include>> UC-7.2 (Nạp ngữ cảnh RAG), <<extend>> được mở rộng bởi UC-7.4 (Follow-ups), UC-7.6 (Local Fallback) |

#### 1. Mô tả tóm tắt (Description)
Cho phép du khách trò chuyện tự nhiên bằng ngôn ngữ đời thường với trợ lý du lịch ảo "Whisper Assistant" về lịch sử di tích, giai thoại Quận 4, quán ốc ngon, địa chỉ ăn vặt và phong tục tập quán địa phương.

#### 2. Tiền điều kiện (Pre-conditions)
- Người dùng mở khung chat AI (nút bóng chat nổi tròn ở góc màn hình).

#### 3. Hậu điều kiện (Post-conditions)
- Câu trả lời của AI xuất hiện trong dòng hội thoại, kèm danh sách thẻ POI/Món ăn liên quan (nếu có).

#### 4. Điểm kích hoạt (Trigger)
Người dùng nhập câu hỏi vào ô chat và nhấn phím Enter hoặc nút Gửi.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Người dùng gửi câu hỏi: "Ở Quận 4 có quán ốc nào nổi tiếng ăn đêm không?". | Client hiển thị tin nhắn của người dùng và hiệu ứng "Whisper Assistant đang suy nghĩ...". |
| **2** | Client gửi POST `/api/ai/chat` kèm lịch sử hội thoại gần nhất. | Backend kích hoạt UC-7.2 để nạp ngữ cảnh RAG: trích xuất thông tin các quán ốc và món đặc sản từ CSDL vào System Prompt. |
| **3** | Backend gửi Prompt hoàn chỉnh sang Google Gemini API. | Mô hình `gemini-3.5-flash-lite` phân tích câu hỏi dựa trên dữ liệu ngữ cảnh thực tế của Quận 4 và sinh câu trả lời tự nhiên, thân thiện. |
| **4** | Chờ nhận phản hồi. | Backend nhận câu trả lời dạng Markdown, tự động gắn link các địa điểm liên quan (ví dụ: Quán Ốc Oanh) và trả về HTTP 200. |
| **5** | Người dùng đọc câu trả lời và click vào link POI trong chat. | Hệ thống mở ngay thông tin chi tiết của Quán Ốc Oanh (UC-2.4) hoặc định vị trên bản đồ. |

#### 6. Các luồng rẽ nhánh (Alternative Flows)
- **Du khách hỏi bằng tiếng Anh hoặc ngôn ngữ khác:**
  Gemini tự động nhận diện ngôn ngữ của câu hỏi và phản hồi mượt mà bằng đúng ngôn ngữ đó.

#### 7. Các luồng ngoại lệ (Exception Flows)
- **Mất kết nối Internet hoặc Gemini API gặp sự cố quá tải:**
  Hệ thống tự động kích hoạt UC-7.6 để đưa ra phản hồi dự phòng cục bộ (Local Fallback) tức thì.

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Trợ lý ảo được định hình tính cách: Thân thiện, am hiểu sâu sắc về Quận 4, sử dụng đại từ xưng hô lịch sự, ấm áp mang phong cách người Sài Gòn.
- Mọi câu trả lời về địa điểm, giá bán, giờ mở cửa phải dựa trên dữ liệu thật của hệ thống Saigon Whispers, tuyệt đối không bịa đặt.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `POST /api/ai/chat (Body: AiAskRequest { question: string, context?: string })`
- **Backend Controller/Service:** `AiController -> AiService -> GeminiClient`
- **Bảng CSDL liên quan:** `pois, dishes, poi_audios`

---

### UC-7.2: Nạp ngữ cảnh RAG (POI, Thực đơn, Audio Stories)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-7.2` |
| **Tên Use Case** | **Nạp ngữ cảnh RAG (POI, Thực đơn, Audio Stories)** |
| **Phân hệ** | 7.0 Trợ lý Du lịch Ảo AI |
| **Tác nhân chính (Primary Actor)** | Hệ thống (System Core) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | <<include>> được gọi bởi UC-7.1 |

#### 1. Mô tả tóm tắt (Description)
Tiến trình trích xuất và cô đọng dữ liệu có cấu trúc từ các bảng `pois`, `dishes` và kịch bản `poi_audios` để tổng hợp thành tập dữ liệu bối cảnh tri thức (Knowledge Context) ngắn gọn nhúng vào Prompt của Gemini.

#### 2. Tiền điều kiện (Pre-conditions)
- Nhận câu hỏi từ người dùng.

#### 3. Hậu điều kiện (Post-conditions)
- Tạo ra chuỗi System Instruction chứa thông tin xác thực của toàn bộ địa danh và ẩm thực Quận 4.

#### 4. Điểm kích hoạt (Trigger)
Được gọi tự động mỗi khi có yêu cầu hỏi đáp AI.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Tiến trình RAG phân tích từ khóa câu hỏi (ví dụ: "ốc", "Bến Nhà Rồng", "chùa"). | Truy vấn các bản ghi POI và món ăn khớp chủ đề từ CSDL. |
| **2** | Tổng hợp ngữ cảnh: | Ghép dữ liệu tên, địa chỉ, giờ mở cửa, giá cả và câu chuyện lịch sử thành khối tri thức có cấu trúc. |
| **3** | Đóng gói Prompt: | Ghép khối tri thức vào sau câu lệnh chỉ dẫn của hệ thống (System Prompt) và chuyển sang cho GeminiClient. |

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Ngữ cảnh RAG được lưu bộ nhớ đệm (In-memory Cache) trong 30 phút để giảm tải truy vấn CSDL cho các câu hỏi liên tục.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `Internal Component`
- **Backend Controller/Service:** `AiContextRepository.getAggregatedContext() -> AiService`
- **Bảng CSDL liên quan:** `pois, dishes, poi_audios`

---

### UC-7.3: Chọn câu hỏi gợi ý nhanh (Prompt Chips)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-7.3` |
| **Tên Use Case** | **Chọn câu hỏi gợi ý nhanh (Prompt Chips)** |
| **Phân hệ** | 7.0 Trợ lý Du lịch Ảo AI |
| **Tác nhân chính (Primary Actor)** | Khách du lịch (Tourist) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Trung bình |
| **Quan hệ UML** | Không |

#### 1. Mô tả tóm tắt (Description)
Hiển thị các chip câu hỏi mẫu phổ biến ngay khi mở khung chat (ví dụ: "Quận 4 có gì chơi?", "Ăn gì ngon ở Chợ 200?", "Lịch sử Cầu Mống"), giúp du khách không phải gõ phím mà vẫn có thể bắt đầu cuộc trò chuyện ngay tức thì.

#### 2. Tiền điều kiện (Pre-conditions)
- Khung chat AI đang mở, lịch sử chat đang trống.

#### 3. Hậu điều kiện (Post-conditions)
- Câu hỏi gợi ý được đưa vào ô chat và tự động gửi đi.

#### 4. Điểm kích hoạt (Trigger)
Người dùng chạm vào một trong các Prompt Chip gợi ý.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Người dùng chạm vào chip "Quận 4 có món gì ngon nhất?". | Hệ thống tự động điền câu hỏi vào hộp nhập và gửi yêu cầu UC-7.1. |
| **2** | Xem câu trả lời. | AI phản hồi danh sách các món ngon tiêu biểu kèm địa chỉ quán. |

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Các Prompt Chip tự động xoay vòng hiển thị theo thời điểm trong ngày (Buổi sáng: Gợi ý điểm tâm & cà phê; Buổi tối: Gợi ý phố ốc & ẩm thực đêm).

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `Client-side Static Configuration`
- **Backend Controller/Service:** `AiChatModal.tsx`
- **Bảng CSDL liên quan:** `Không`

---

### UC-7.4: Chọn câu hỏi gợi ý tiếp theo (Follow-up Suggestions)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-7.4` |
| **Tên Use Case** | **Chọn câu hỏi gợi ý tiếp theo (Follow-up Suggestions)** |
| **Phân hệ** | 7.0 Trợ lý Du lịch Ảo AI |
| **Tác nhân chính (Primary Actor)** | Khách du lịch (Tourist) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Trung bình |
| **Quan hệ UML** | <<extend>> mở rộng cho UC-7.1 |

#### 1. Mô tả tóm tắt (Description)
Sau mỗi câu trả lời của AI, hệ thống tự động sinh ra 2-3 câu hỏi gợi ý tiếp nối ngữ cảnh (Follow-up chips) xuất hiện ở cuối tin nhắn, kích thích du khách tiếp tục tìm hiểu sâu hơn.

#### 2. Tiền điều kiện (Pre-conditions)
- AI vừa hoàn tất trả lời một câu hỏi.

#### 3. Hậu điều kiện (Post-conditions)
- Hiển thị 2-3 nút gợi ý câu hỏi tiếp theo ở đáy tin nhắn.

#### 4. Điểm kích hoạt (Trigger)
Hoàn tất luồng xử lý câu trả lời của UC-7.1.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | AI vừa trả lời về lịch sử Bến Nhà Rồng. | Hệ thống hiển thị các chip tiếp nối: "Giá vé vào cổng là bao nhiêu?", "Từ đây đi bộ ra Cầu Mống mất bao lâu?". |
| **2** | Người dùng click vào chip "Từ đây đi bộ ra Cầu Mống mất bao lâu?". | Hệ thống gửi câu hỏi mới đến AI và tiếp tục cuộc trò chuyện liền mạch. |

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Gemini được yêu cầu xuất mảng gợi ý `followUps: [string]` trong cấu trúc JSON trả về để hiển thị tương tác.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `Trích xuất từ trường `followUps` trong AiAskResponse`
- **Backend Controller/Service:** `AiChatModal.tsx`
- **Bảng CSDL liên quan:** `Không`

---

### UC-7.5: Yêu cầu AI tư vấn lịch trình tham quan mẫu

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-7.5` |
| **Tên Use Case** | **Yêu cầu AI tư vấn lịch trình tham quan mẫu** |
| **Phân hệ** | 7.0 Trợ lý Du lịch Ảo AI |
| **Tác nhân chính (Primary Actor)** | Khách du lịch (Tourist) |
| **Tác nhân phụ (Secondary Actor)** | Google Gemini AI |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | Không |

#### 1. Mô tả tóm tắt (Description)
Du khách có thể yêu cầu AI thiết kế một kế hoạch du lịch nguyên ngày hoặc nửa ngày theo sở thích tự do (ví dụ: "Tôi có 1 buổi chiều ở Quận 4, thích chụp ảnh và ăn vặt, hãy lên lịch trình giúp tôi").

#### 2. Tiền điều kiện (Pre-conditions)
- Khung chat AI đang mở.

#### 3. Hậu điều kiện (Post-conditions)
- AI trả về một bảng lịch trình chi tiết theo từng khung giờ (Morning, Afternoon, Evening) kèm ngân sách dự kiến.

#### 4. Điểm kích hoạt (Trigger)
Người dùng nhập câu hỏi yêu cầu lịch trình.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Người dùng yêu cầu: "Lên lịch trình 1 buổi chiều chụp ảnh sống ảo và ăn ốc ở Q4". | Hệ thống gửi yêu cầu sang AI kết hợp dữ liệu các điểm check-in (Cầu Mống, Bến Vân Đồn) và các quán ốc. |
| **2** | Xem lịch trình đề xuất. | AI xuất bảng lịch trình trực quan: 15:30 Check-in Cầu Mống $\rightarrow$ 17:00 Ngắm hoàng hôn Bến Vân Đồn $\rightarrow$ 18:30 Ăn ốc Vĩnh Khánh. |
| **3** | Người dùng click vào nút "Áp dụng lộ trình này". | Hệ thống liên kết sang tính năng Custom Plan (UC-4.3) để tạo ngay lộ trình trên bản đồ. |

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Lịch trình phải tính toán logic theo giờ mở cửa thực tế của từng địa điểm trong CSDL.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `POST /api/ai/chat`
- **Backend Controller/Service:** `AiController -> GeminiClient`
- **Bảng CSDL liên quan:** `pois, dishes`

---

### UC-7.6: Nhận phản hồi dự phòng cục bộ (Local Fallback Engine)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-7.6` |
| **Tên Use Case** | **Nhận phản hồi dự phòng cục bộ (Local Fallback Engine)** |
| **Phân hệ** | 7.0 Trợ lý Du lịch Ảo AI |
| **Tác nhân chính (Primary Actor)** | Hệ thống (System Core) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | <<extend>> mở rộng cho UC-7.1 |

#### 1. Mô tả tóm tắt (Description)
Cơ chế an toàn phòng vệ (Circuit Breaker & Graceful Degradation): Khi kết nối đến máy chủ Google Gemini bị ngắt, timeout hoặc hết hạn ngạch, hệ thống tự động chuyển sang bộ máy phản hồi cục bộ dựa trên từ khóa mẫu đã chuẩn bị sẵn để đảm bảo ứng dụng không bao giờ bị đứng hoặc báo lỗi crash với du khách.

#### 2. Tiền điều kiện (Pre-conditions)
- GeminiClient ném ra ngoại lệ `ApiException` hoặc timeout vượt quá 10 giây.

#### 3. Hậu điều kiện (Post-conditions)
- Trả về câu trả lời dự phòng hợp lý, ghi log cảnh báo sự cố cho Admin.

#### 4. Điểm kích hoạt (Trigger)
Được kích hoạt tự động trong khối catch của AiService.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Gọi Gemini API thất bại (Timeout 10s). | Hệ thống bắt ngoại lệ và kích hoạt bộ luật Rule-based Local Fallback. |
| **2** | Phân tích từ khóa câu hỏi cục bộ: | Nếu câu hỏi chứa "ốc", "ăn", "quán" $\rightarrow$ Trả về thông tin Quán Ốc Oanh và Phá Lấu Cô Thảo từ CSDL. Nếu chứa "lịch sử", "di tích" $\rightarrow$ Trả về thông tin Bến Nhà Rồng. |
| **3** | Đóng gói câu trả lời: | Trả về câu trả lời dự phòng kèm lời nhắn thân thiện: "Dịch vụ AI đang bảo trì nhẹ, dưới đây là gợi ý từ hệ thống Saigon Whispers dành cho bạn: ...". |

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Độ trễ của luồng Fallback phải dưới 50ms, đảm bảo trải nghiệm người dùng hoàn toàn liền mạch.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `Internal Fallback in AiService.java`
- **Backend Controller/Service:** `AiService.getFallbackResponse()`
- **Bảng CSDL liên quan:** `pois`

---

## PHÂN HỆ 8.0: ĐÁNH GIÁ & CHECK-IN (REVIEWS & CHECK-IN GAMIFICATION)

Phân hệ kích thích tương tác cộng đồng và trò chơi hóa (Gamification) du lịch: Cho phép du khách lưu địa điểm yêu thích (Bookmark), viết đánh giá chấm sao và thực hiện Check-in xác thực vị trí thực tế GPS (Haversine $\le 30m$) để mở khóa các Huy hiệu danh dự số (Digital Badges).

### UC-8.1: Xem đánh giá & Điểm sao trung bình POI

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-8.1` |
| **Tên Use Case** | **Xem đánh giá & Điểm sao trung bình POI** |
| **Phân hệ** | 8.0 Đánh giá & Check-in |
| **Tác nhân chính (Primary Actor)** | Khách du lịch (Tourist) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | Không |

#### 1. Mô tả tóm tắt (Description)
Hiển thị điểm đánh giá sao trung bình (ví dụ: 4.8 ⭐), tổng số lượt đánh giá, biểu đồ phân bổ số sao (1-5 sao) và danh sách các bình luận nhận xét chi tiết kèm hình ảnh thực tế từ cộng đồng du khách.

#### 2. Tiền điều kiện (Pre-conditions)
- Người dùng đang xem trang chi tiết POI.

#### 3. Hậu điều kiện (Post-conditions)
- Danh sách nhận xét được hiển thị theo thứ tự thời gian mới nhất.

#### 4. Điểm kích hoạt (Trigger)
Người dùng cuộn xuống mục "Đánh giá từ cộng đồng" tại trang chi tiết.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Người dùng xem mục Đánh giá của Bến Nhà Rồng. | Client gửi GET `/api/reviews/poi/{poiId}`. |
| **2** | Chờ tải dữ liệu. | Backend truy vấn bảng `reviews` kết hợp bảng `users` để lấy tên hiển thị và avatar của người đánh giá. |
| **3** | Xem danh sách đánh giá. | Hiển thị điểm tổng quát: 4.8/5.0, thanh đo tỷ lệ sao và các bình luận người dùng kèm ngày đánh giá. |

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Hỗ trợ phân trang: Mặc định hiển thị 5 đánh giá đầu tiên, có nút "Xem thêm đánh giá".

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `GET /api/reviews/poi/{poiId}?page=0&size=5`
- **Backend Controller/Service:** `CommunityController -> ReviewRepository`
- **Bảng CSDL liên quan:** `reviews, users, pois`

---

### UC-8.2: Lưu địa điểm vào danh sách Yêu thích (Bookmark)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-8.2` |
| **Tên Use Case** | **Lưu địa điểm vào danh sách Yêu thích (Bookmark)** |
| **Phân hệ** | 8.0 Đánh giá & Check-in |
| **Tác nhân chính (Primary Actor)** | Người dùng đăng ký (Registered User) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | <<extend>> được mở rộng bởi UC-8.3 (Xem danh sách Bookmark) |

#### 1. Mô tả tóm tắt (Description)
Cho phép du khách lưu lại các điểm đến yêu thích hoặc các quán ăn muốn ghé thăm trong tương lai bằng cách chạm vào biểu tượng trái tim (Favorite Bookmark).

#### 2. Tiền điều kiện (Pre-conditions)
- Người dùng đã đăng nhập tài khoản (`ROLE_USER`).

#### 3. Hậu điều kiện (Post-conditions)
- Bản ghi mới được thêm vào bảng `favorites`, icon trái tim chuyển sang màu đỏ rực rỡ.

#### 4. Điểm kích hoạt (Trigger)
Người dùng nhấn vào biểu tượng Trái tim trên Card điểm đến hoặc trang chi tiết.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Người dùng nhấn biểu tượng Trái tim tại Quán Ốc Oanh. | Icon chuyển ngay sang màu đỏ trên giao diện (Optimistic UI Update). |
| **2** | Client gửi POST `/api/bookmarks/toggle` kèm payload `{ poiId }` và Token. | Backend kiểm tra bảng `favorites`: nếu chưa có thì thêm mới; nếu đã có thì xóa bỏ (Toggle). |
| **3** | Chờ máy chủ xác nhận. | Backend trả về HTTP 200 kèm trạng thái `{ isBookmarked: true }`. |

#### 6. Các luồng rẽ nhánh (Alternative Flows)
- **Người dùng bấm lại vào trái tim đã lưu:**
  Hệ thống thực hiện bỏ lưu (Un-bookmark), xóa bản ghi khỏi bảng `favorites` và đổi icon về viền rỗng.

#### 7. Các luồng ngoại lệ (Exception Flows)
- **Khách vãng lai chưa đăng nhập bấm vào trái tim:**
  Hệ thống hiển thị Modal đăng nhập: "Vui lòng đăng nhập để lưu địa điểm vào danh sách yêu thích cá nhân".

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Mỗi cặp `(user_id, poi_id)` là duy nhất trong bảng `favorites` (Unique Constraint).

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `POST /api/bookmarks/toggle (Body: { poiId: long })`
- **Backend Controller/Service:** `CommunityController -> FavoriteRepository`
- **Bảng CSDL liên quan:** `favorites`

---

### UC-8.3: Xem danh sách địa điểm đã lưu (Bookmark List)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-8.3` |
| **Tên Use Case** | **Xem danh sách địa điểm đã lưu (Bookmark List)** |
| **Phân hệ** | 8.0 Đánh giá & Check-in |
| **Tác nhân chính (Primary Actor)** | Người dùng đăng ký (Registered User) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | <<extend>> mở rộng cho UC-8.2 |

#### 1. Mô tả tóm tắt (Description)
Cung cấp trang quản lý riêng biệt hiển thị toàn bộ các địa điểm du lịch và quán ăn mà du khách đã lưu lại, hỗ trợ lọc nhanh và xóa bớt điểm đến.

#### 2. Tiền điều kiện (Pre-conditions)
- Người dùng đã đăng nhập tài khoản.

#### 3. Hậu điều kiện (Post-conditions)
- Danh sách địa điểm yêu thích được hiển thị đầy đủ.

#### 4. Điểm kích hoạt (Trigger)
Người dùng chọn mục "Đã lưu (Bookmarks)" trên thanh điều hướng.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Người dùng mở trang "Địa điểm đã lưu". | Client gửi GET `/api/bookmarks/my`. |
| **2** | Chờ tải dữ liệu. | Backend truy vấn bảng `favorites` join với bảng `pois` theo `user_id` hiện tại. |
| **3** | Xem danh sách. | Giao diện hiển thị các POI đã lưu kèm nút "Chỉ đường" và nút "Bỏ lưu". |

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Danh sách tự động sắp xếp theo thứ tự lưu mới nhất lên đầu (`created_at DESC`).

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `GET /api/bookmarks/my`
- **Backend Controller/Service:** `CommunityController -> FavoriteRepository`
- **Bảng CSDL liên quan:** `favorites, pois`

---

### UC-8.4: Viết đánh giá & Chấm điểm số sao POI (1-5 sao)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-8.4` |
| **Tên Use Case** | **Viết đánh giá & Chấm điểm số sao POI (1-5 sao)** |
| **Phân hệ** | 8.0 Đánh giá & Check-in |
| **Tác nhân chính (Primary Actor)** | Người dùng đăng ký (Registered User) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | Không |

#### 1. Mô tả tóm tắt (Description)
Cho phép người dùng để lại cảm nhận thực tế, chấm điểm từ 1 đến 5 sao và tải lên hình ảnh trải nghiệm để chia sẻ cùng cộng đồng du lịch.

#### 2. Tiền điều kiện (Pre-conditions)
- Người dùng đã đăng nhập với quyền `ROLE_USER`.

#### 3. Hậu điều kiện (Post-conditions)
- Bản ghi đánh giá mới được lưu vào bảng `reviews`, điểm `avg_rating` và `review_count` của POI trong bảng `pois` được tính toán lại tự động.

#### 4. Điểm kích hoạt (Trigger)
Người dùng bấm nút "Viết đánh giá" tại trang chi tiết POI.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Người dùng mở form đánh giá, chọn 5 sao, nhập nhận xét: "Ốc rất tươi, sốt trứng muối béo ngậy chấm bánh mì đỉnh cao!". | Client kiểm tra độ dài văn bản tối thiểu 10 ký tự. |
| **2** | Người dùng bấm "Gửi đánh giá". | Client gửi POST `/api/reviews` kèm payload `{ poiId, rating, comment }`. |
| **3** | Chờ máy chủ xử lý. | Backend lưu vào bảng `reviews`, gọi hàm Trigger tính toán lại `avg_rating = AVG(rating)` và `review_count = COUNT(*)` của POI đó. |
| **4** | Nhận thông báo. | Hệ thống thông báo: "Cảm ơn bạn đã gửi đánh giá!", bình luận mới xuất hiện ngay lập tức. |

#### 6. Các luồng rẽ nhánh (Alternative Flows)
- **Người dùng sửa lại đánh giá trước đó của mình:**
  Hệ thống cập nhật lại nội dung và số sao, tính toán lại điểm trung bình tương ứng.

#### 7. Các luồng ngoại lệ (Exception Flows)
- **Đánh giá chứa các từ ngữ phản cảm hoặc spam:**
  Bộ lọc từ ngữ cấm (Profanity Filter) chặn gửi và yêu cầu người dùng chỉnh sửa từ ngữ văn minh.

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Điểm số sao là số nguyên từ 1 đến 5.
- Mỗi người dùng chỉ được có 1 bản ghi đánh giá cho mỗi địa điểm (nếu đánh giá lại sẽ là cập nhật).

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `POST /api/reviews (Body: { poiId: long, rating: int, comment: string })`
- **Backend Controller/Service:** `CommunityController -> ReviewService`
- **Bảng CSDL liên quan:** `reviews, pois`

---

### UC-8.5: Check-in thực tế tại địa điểm du lịch (GPS Check-in)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-8.5` |
| **Tên Use Case** | **Check-in thực tế tại địa điểm du lịch (GPS Check-in)** |
| **Phân hệ** | 8.0 Đánh giá & Check-in |
| **Tác nhân chính (Primary Actor)** | Người dùng đăng ký (Registered User) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | <<include>> UC-8.6 (Xác thực GPS 30m), UC-8.7 (Mở khóa Huy hiệu) |

#### 1. Mô tả tóm tắt (Description)
Tính năng trò chơi hóa đỉnh cao: Du khách chỉ có thể check-in khi thực sự có mặt tại địa điểm (chống check-in ảo từ xa). Hệ thống kiểm tra tọa độ GPS trong bán kính $\le 30m$, nếu hợp lệ sẽ ghi nhận check-in và tự động kích hoạt tiến trình kiểm tra mở khóa Huy hiệu danh dự.

#### 2. Tiền điều kiện (Pre-conditions)
- Người dùng đã đăng nhập tài khoản (`ROLE_USER`).
- Thiết bị đã bật định vị GPS có độ chính xác cao.

#### 3. Hậu điều kiện (Post-conditions)
- Bản ghi check-in thành công được lưu vào bảng `checkins`.
- Mở khóa Huy hiệu tương ứng nếu thỏa mãn điều kiện bộ sưu tập.

#### 4. Điểm kích hoạt (Trigger)
Người dùng bấm nút "Check-in ngay" trên thẻ POI hoặc trang chi tiết.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Người dùng đứng trước cổng Bến Nhà Rồng, bấm nút "Check-in ngay". | Client đọc tọa độ GPS thực tế: `lat`, `lng`. |
| **2** | Client gửi POST `/api/checkins` kèm `{ poiId, lat, lng }`. | Backend gọi UC-8.6 để xác thực khoảng cách không gian giữa người dùng và Bến Nhà Rồng. |
| **3** | Xác thực khoảng cách thành công ($d = 18m \le 30m$). | Backend ghi nhận bản ghi mới vào bảng `checkins`. |
| **4** | Hệ thống gọi UC-8.7. | Kiểm tra các tiêu chí huy hiệu: nếu đủ điều kiện, mở khóa Huy hiệu mới trong bảng `user_badges`. |
| **5** | Người dùng nhận hiệu ứng chúc mừng. | Màn hình bùng nổ hiệu ứng pháo hoa (Confetti) kèm thông báo: "Check-in thành công tại Bến Nhà Rồng! Bạn vừa mở khóa Huy hiệu 'Nhà Thám Hiểm Lịch Sử'!". |

#### 7. Các luồng ngoại lệ (Exception Flows)
- **Người dùng đứng cách địa điểm quá xa ($d > 30m$):**
  Hệ thống từ chối check-in và thông báo: "Bạn đang cách địa điểm này 350m. Vui lòng di chuyển đến gần trong phạm vi 30m để check-in thực tế!".
- **Người dùng đã check-in tại địa điểm này trong ngày hôm nay:**
  Hệ thống báo: "Bạn đã check-in tại đây hôm nay rồi. Hãy khám phá thêm các điểm đến mới nhé!".

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Bắt buộc kiểm tra tọa độ GPS máy chủ (Server-side Verification), không chấp nhận kết quả kiểm tra chỉ từ phía client để chống giả lập GPS (Fake GPS).
- Khoảng cách tối đa cho phép check-in là đúng 30 mét.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `POST /api/checkins (Body: { poiId: long, lat: double, lng: double })`
- **Backend Controller/Service:** `CommunityController -> CheckinService`
- **Bảng CSDL liên quan:** `checkins, user_badges, pois`

---

### UC-8.6: Xác thực khoảng cách GPS (Haversine <= 30m)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-8.6` |
| **Tên Use Case** | **Xác thực khoảng cách GPS (Haversine <= 30m)** |
| **Phân hệ** | 8.0 Đánh giá & Check-in |
| **Tác nhân chính (Primary Actor)** | Hệ thống (System Core) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | <<include>> được gọi bởi UC-8.5 |

#### 1. Mô tả tóm tắt (Description)
Tiến trình tính toán và kiểm định khoảng cách địa lý giữa tọa độ GPS do người dùng gửi lên và tọa độ chuẩn của POI trong cơ sở dữ liệu PostGIS.

#### 2. Tiền điều kiện (Pre-conditions)
- Nhận payload chứa `poiId`, `lat`, `lng`.

#### 3. Hậu điều kiện (Post-conditions)
- Trả về kết quả xác thực hợp lệ (`true`) nếu khoảng cách $\le 30m$, ngược lại ném ngoại lệ `DistanceExceededException`.

#### 4. Điểm kích hoạt (Trigger)
Được gọi tự động bởi UC-8.5.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Tiến trình tiếp nhận tọa độ người dùng $(lat_u, lng_u)$ và `poiId`. | Truy vấn tọa độ chuẩn của POI $(lat_{poi}, lng_{poi})$ từ CSDL. |
| **2** | Thực thi hàm tính khoảng cách địa lý: | Áp dụng công thức Haversine hoặc hàm PostGIS: `ST_Distance(poi.location, ST_MakePoint(lng_u, lat_u)::geography)`. |
| **3** | Kiểm tra điều kiện: | Nếu $distance \le 30.0\text{ m} \rightarrow$ Trả về kết quả thành công. |

#### 7. Các luồng ngoại lệ (Exception Flows)
- **Khoảng cách vượt quá 30m:**
  Ném ngoại lệ `LocationOutOfRangeException` kèm khoảng cách thực tế đo được để thông báo cho người dùng.

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Sai số cho phép của thuật toán là dưới $0.5\text{ mét}$.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `Internal Component`
- **Backend Controller/Service:** `CheckinService.verifyProximity()`
- **Bảng CSDL liên quan:** `pois (location)`

---

### UC-8.7: Mở khóa & Nhận Huy hiệu thành tích (Badges)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-8.7` |
| **Tên Use Case** | **Mở khóa & Nhận Huy hiệu thành tích (Badges)** |
| **Phân hệ** | 8.0 Đánh giá & Check-in |
| **Tác nhân chính (Primary Actor)** | Hệ thống (System Core) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | <<include>> được gọi bởi UC-8.5 |

#### 1. Mô tả tóm tắt (Description)
Hệ thống kiểm tra các tiêu chí hoàn thành thử thách du lịch để mở khóa các Huy hiệu danh dự: "Thổ Địa Quận 4" (check-in đủ 5 điểm), "Chuyên Gia Ốc Đêm" (check-in 3 quán ốc), "Người Yêu Lịch Sử" (check-in Bến Nhà Rồng + Cầu Mống),...

#### 2. Tiền điều kiện (Pre-conditions)
- Một lượt check-in vừa được ghi nhận thành công.

#### 3. Hậu điều kiện (Post-conditions)
- Bản ghi huy hiệu mới được thêm vào bảng `user_badges` kèm timestamp mở khóa.

#### 4. Điểm kích hoạt (Trigger)
Được gọi tự động sau khi lưu bản ghi `checkins`.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Tiến trình tổng hợp lịch sử check-in của User. | Đếm tổng số lượt check-in và phân loại theo danh mục điểm đến. |
| **2** | Kiểm tra quy tắc huy hiệu: | Nếu User chưa có huy hiệu 'Thánh Ăn Quận 4' và đã check-in $\ge 3$ quán ăn $\rightarrow$ Mở khóa! |
| **3** | Lưu huy hiệu: | Tạo bản ghi mới trong bảng `user_badges` kèm icon và tên huy hiệu. |
| **4** | Trả kết quả: | Gửi thông tin huy hiệu mới mở khóa về cho Client hiển thị popup vinh danh. |

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Mỗi loại huy hiệu chỉ được mở khóa một lần duy nhất cho mỗi tài khoản.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `Internal Component`
- **Backend Controller/Service:** `BadgeService.evaluateBadges(userId)`
- **Bảng CSDL liên quan:** `user_badges, checkins`

---

### UC-8.8: Xem Bộ sưu tập Huy hiệu cá nhân

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-8.8` |
| **Tên Use Case** | **Xem Bộ sưu tập Huy hiệu cá nhân** |
| **Phân hệ** | 8.0 Đánh giá & Check-in |
| **Tác nhân chính (Primary Actor)** | Người dùng đăng ký (Registered User) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Trung bình |
| **Quan hệ UML** | Không |

#### 1. Mô tả tóm tắt (Description)
Hiển thị trang bộ sưu tập tất cả các Huy hiệu du lịch: các huy hiệu đã đạt được (sáng màu rực rỡ kèm ngày mở khóa) và các huy hiệu chưa đạt (màu xám mờ kèm thanh tiến trình phần trăm hoàn thành, ví dụ: "2/3 quán ốc").

#### 2. Tiền điều kiện (Pre-conditions)
- Người dùng đã đăng nhập tài khoản.

#### 3. Hậu điều kiện (Post-conditions)
- Bộ sưu tập huy hiệu được hiển thị trực quan theo dạng lưới (Grid).

#### 4. Điểm kích hoạt (Trigger)
Người dùng chọn mục "Huy hiệu của tôi" trong trang Profile.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Người dùng truy cập trang "Bộ sưu tập Huy hiệu". | Client gửi GET `/api/badges/my`. |
| **2** | Chờ tải dữ liệu. | Backend truy vấn bảng `user_badges` theo `user_id` hiện tại. |
| **3** | Xem thành tích. | Giao diện hiển thị danh sách huy hiệu, cấp độ danh hiệu (Tân thủ $\rightarrow$ Du khách sành sỏi $\rightarrow$ Thổ địa Quận 4). |

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Cung cấp nút "Chia sẻ thành tích" để du khách chia sẻ ảnh huy hiệu lên mạng xã hội.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `GET /api/badges/my`
- **Backend Controller/Service:** `CommunityController -> BadgeRepository`
- **Bảng CSDL liên quan:** `user_badges`

---

## PHÂN HỆ 9.0: PHÂN TÍCH & BÁO CÁO LƯU TRÚ (ANALYTICS & DWELL TIME REPORTING)

Phân hệ quản trị thông minh (Smart Tourism Management Dashboard) dành cho Ban Quản trị: Giám sát lượng khách truy cập thời gian thực qua luồng Server-Sent Events (SSE), phân tích thời gian dừng chân lưu trú (Dwell Time Tracking), thống kê hiệu quả bài thuyết minh tự động và quản lý bộ nhớ đệm hệ thống.

### UC-9.1: Gửi tín hiệu Heartbeat Ping & Leave (Ứng dụng Client ngầm)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-9.1` |
| **Tên Use Case** | **Gửi tín hiệu Heartbeat Ping & Leave (Ứng dụng Client ngầm)** |
| **Phân hệ** | 9.0 Phân tích & Báo cáo lưu trú |
| **Tác nhân chính (Primary Actor)** | Ứng dụng Client (Tác vụ ngầm) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | Không |

#### 1. Mô tả tóm tắt (Description)
Tiến trình ngầm phía trình duyệt gửi tín hiệu nhịp tim định kỳ (Heartbeat Ping 15 giây/lần) khi du khách đang tương tác trên web/app và gửi sự kiện rời trang (`visibilitychange` / `beforeunload`) khi du khách đóng ứng dụng để máy chủ biết chính xác số lượng khách đang trực tiếp online.

#### 2. Tiền điều kiện (Pre-conditions)
- Khách du lịch đang mở ứng dụng Saigon Whispers trên thiết bị.

#### 3. Hậu điều kiện (Post-conditions)
- Bộ đếm phiên hoạt động trong Redis được gia hạn TTL; ghi nhận thời điểm rời trang chính xác.

#### 4. Điểm kích hoạt (Trigger)
Kích hoạt tự động theo bộ đếm thời gian (Timer) 15 giây/lần hoặc khi sự kiện đóng tab xảy ra.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Ứng dụng Client gửi ngầm POST `/api/dwell/ping` kèm `{ sessionId, poiId? }`. | Backend cập nhật timestamp hoạt động của phiên trong Redis Key `active:visitors:{sessionId}` với thời gian sống 45 giây. |
| **2** | Khách du lịch chuyển sang tab khác hoặc đóng trình duyệt. | Client tự động bắt sự kiện `visibilitychange` và gửi `navigator.sendBeacon("/api/dwell/leave")`. |
| **3** | Backend tiếp nhận sự kiện Leave. | Xóa session khỏi danh sách online và kích hoạt UC-9.2 để chốt thời gian dừng chân. |

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Nếu sau 45 giây không nhận được tín hiệu Ping mới từ một Session, hệ thống tự động coi phiên đó đã ngắt kết nối (Inactivity Timeout).

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `POST /api/dwell/ping, POST /api/dwell/leave`
- **Backend Controller/Service:** `AnalyticsController -> AnalyticsService`
- **Bảng CSDL liên quan:** `Redis Cache (`active:visitors`)`

---

### UC-9.2: Ghi nhận sự kiện lưu trú (Dwell Event)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-9.2` |
| **Tên Use Case** | **Ghi nhận sự kiện lưu trú (Dwell Event)** |
| **Phân hệ** | 9.0 Phân tích & Báo cáo lưu trú |
| **Tác nhân chính (Primary Actor)** | Ứng dụng Client (Tác vụ ngầm) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | Không |

#### 1. Mô tả tóm tắt (Description)
Ghi nhận tổng thời gian thực tế mà du khách dừng chân tham quan tại một địa điểm POI (tính từ lúc bước vào trang/khuôn viên đến lúc rời đi) và lưu vào bảng `dwell_logs` để tính toán chỉ số trung bình phục vụ Thẻ Dashboard số 4.

#### 2. Tiền điều kiện (Pre-conditions)
- Du khách dừng chân tại một điểm đến hoặc xem trang chi tiết POI.

#### 3. Hậu điều kiện (Post-conditions)
- Bản ghi mới được lưu vào bảng `dwell_logs` với các trường `dwell_seconds`, `poi_id`, `entered_at`, `left_at`.

#### 4. Điểm kích hoạt (Trigger)
Khi du khách rời khỏi POI hoặc chuyển sang điểm đến khác.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Du khách dừng chân tại Quán Ốc Oanh trong 22 phút (1320 giây). | Client gửi POST `/api/dwell/event` kèm `{ poiId: 1, durationSeconds: 1320 }`. |
| **2** | Backend tiếp nhận dữ liệu. | Kiểm tra tính hợp lệ của thời lượng dừng chân. |
| **3** | Lưu vào CSDL: | Thêm bản ghi vào bảng `dwell_logs`. |
| **4** | Hoàn tất. | Dữ liệu sẵn sàng cho các phép tính tổng hợp trên Dashboard Admin. |

#### 7. Các luồng ngoại lệ (Exception Flows)
- **Thời gian dừng chân quá ngắn (< 10 giây):**
  Hệ thống coi đây là thao tác lướt qua (Pass-by) và không tính vào thời gian lưu trú hiệu quả.

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Thời gian dừng chân được giới hạn tối đa 4 giờ/phiên để loại bỏ các trường hợp du khách quên tắt ứng dụng qua đêm.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `POST /api/dwell/event (Body: DwellEventRequest)`
- **Backend Controller/Service:** `AnalyticsController -> DwellRepository`
- **Bảng CSDL liên quan:** `dwell_logs`

---

### UC-9.3: Giám sát khách online trực tiếp qua SSE (Thẻ Dashboard 1)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-9.3` |
| **Tên Use Case** | **Giám sát khách online trực tiếp qua SSE (Thẻ Dashboard 1)** |
| **Phân hệ** | 9.0 Phân tích & Báo cáo lưu trú |
| **Tác nhân chính (Primary Actor)** | Quản trị viên (Admin / BQL) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | Không |

#### 1. Mô tả tóm tắt (Description)
Cung cấp luồng dữ liệu thời gian thực Server-Sent Events (SSE): Admin mở Dashboard, số lượng khách du lịch đang trực tiếp truy cập hệ thống (Web & Di động) hiển thị tại **Thẻ 1 (Màu tím)** và tự động nhảy số theo thời gian thực mà không cần F5 tải lại trang.

#### 2. Tiền điều kiện (Pre-conditions)
- Admin đã đăng nhập và đang mở trang Dashboard `/admin`.

#### 3. Hậu điều kiện (Post-conditions)
- Kênh kết nối SSE liên tục được duy trì, con số khách online cập nhật tức thì.

#### 4. Điểm kích hoạt (Trigger)
Trang Dashboard Admin được tải trên trình duyệt.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Admin mở trang `/admin`. | Client khởi tạo kết nối `new EventSource("/api/admin/analytics/realtime-sse")`. |
| **2** | Backend tiếp nhận kết nối SSE. | Đăng ký `SseEmitter` vào danh sách lắng nghe trong bộ nhớ máy chủ. |
| **3** | Định kỳ mỗi 3 giây hoặc khi có khách mới vào/ra: | Máy chủ đếm số lượng khóa `active:visitors:*` trong Redis và đẩy gói tin SSE `{ activeVisitors: N, timestamp: ... }` về cho trình duyệt Admin. |
| **4** | Admin quan sát Dashboard. | Thẻ 1 hiển thị trực quan: "1 khách • Trực tiếp (Real-time) - Web & Di Động". |

#### 7. Các luồng ngoại lệ (Exception Flows)
- **Kết nối SSE bị ngắt quãng do mạng:**
  Trình duyệt tự động thử kết nối lại (Auto Reconnect) sau 3 giây.

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Kết nối SSE phải được dọn dẹp (clean-up) ngay khi Admin rời khỏi trang để tránh rò rỉ bộ nhớ (Memory Leak).

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `GET /api/admin/analytics/realtime-sse (Text/event-stream)`
- **Backend Controller/Service:** `AnalyticsController.streamRealtimeVisitors() -> SseEmitter`
- **Bảng CSDL liên quan:** `Redis Cache`

---

### UC-9.4: Xem thống kê Lượt nghe Audio thuyết minh (Thẻ Dashboard 2)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-9.4` |
| **Tên Use Case** | **Xem thống kê Lượt nghe Audio thuyết minh (Thẻ Dashboard 2)** |
| **Phân hệ** | 9.0 Phân tích & Báo cáo lưu trú |
| **Tác nhân chính (Primary Actor)** | Quản trị viên (Admin / BQL) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | Không |

#### 1. Mô tả tóm tắt (Description)
Hiển thị dữ liệu viễn trắc thuyết minh tại **Thẻ 2 (Màu đỏ)**: Tổng số lượt nghe bài thuyết minh, thời lượng nghe trung bình (ví dụ: TB 85s / lượt nghe), và tỷ lệ kích hoạt tự động qua GPS (ví dụ: GPS tự động: 3 lượt).

#### 2. Tiền điều kiện (Pre-conditions)
- Admin đang mở trang Dashboard.

#### 3. Hậu điều kiện (Post-conditions)
- Số liệu thống kê lượt nghe audio được tải và hiển thị chính xác.

#### 4. Điểm kích hoạt (Trigger)
Tải dữ liệu tổng quan Dashboard.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Admin xem Thẻ số 2 trên Dashboard. | Client gửi GET `/api/admin/analytics/summary`. |
| **2** | Chờ máy chủ tính toán. | Backend truy vấn bảng `audio_listen_logs`, tính tổng lượt nghe `COUNT(*)`, thời lượng trung bình `AVG(duration_seconds)` và số lượt tự động `COUNT(*) WHERE is_autoplay = true`. |
| **3** | Hiển thị số liệu trực quan: | Thẻ 2 hiển thị: "LƯỢT NGHE THUYẾT MINH: 4 • TB: 85s / lượt nghe • GPS tự động: 3". |
| **4** | Admin click nút "Xem chi tiết →". | Hệ thống mở danh sách bảng thống kê lượt nghe chi tiết của từng di tích. |

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Dữ liệu tổng hợp được tính toán theo thời gian thực kết hợp bộ nhớ đệm cache ngắn hạn 30 giây.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `GET /api/admin/analytics/summary`
- **Backend Controller/Service:** `AnalyticsController -> AudioListenRepository`
- **Bảng CSDL liên quan:** `audio_listen_logs`

---

### UC-9.5: Bảng xếp hạng Điểm nóng ẩm thực & POI (Thẻ Dashboard 3)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-9.5` |
| **Tên Use Case** | **Bảng xếp hạng Điểm nóng ẩm thực & POI (Thẻ Dashboard 3)** |
| **Phân hệ** | 9.0 Phân tích & Báo cáo lưu trú |
| **Tác nhân chính (Primary Actor)** | Quản trị viên (Admin / BQL) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | Không |

#### 1. Mô tả tóm tắt (Description)
Hiển thị thông tin tại **Thẻ 3 (Màu xanh dương)**: Điểm nóng ẩm thực được lắng nghe và quan tâm nhiều nhất trong ngày (ví dụ: "Quán Ốc Oanh... Được lắng nghe nhiều nhất • 2 lượt nghe"), hỗ trợ xem Bảng xếp hạng Top Hotspots toàn diện.

#### 2. Tiền điều kiện (Pre-conditions)
- Admin đang mở trang Dashboard.

#### 3. Hậu điều kiện (Post-conditions)
- Hiển thị điểm nóng dẫn đầu và liên kết mở bảng xếp hạng.

#### 4. Điểm kích hoạt (Trigger)
Tải trang Dashboard.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Admin xem Thẻ số 3. | Backend nhóm dữ liệu theo `poi_id` trong `audio_listen_logs` và `dwell_logs`, sắp xếp giảm dần theo mức độ tương tác. |
| **2** | Hiển thị điểm nóng số 1: | Thẻ 3 làm nổi bật: "ĐIỂM NÓNG ẨM THỰC: Quán Ốc Oanh • 2 lượt nghe". |
| **3** | Admin click nút "Xem bảng xếp hạng →". | Hệ thống hiển thị Bảng xếp hạng Top 10 địa điểm thu hút du khách nhất Quận 4. |

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Thuật toán xếp hạng điểm nóng kết hợp giữa: Lượt nghe audio (40%) + Thời gian dừng chân (40%) + Số lượt check-in (20%).

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `GET /api/admin/analytics/hotspots`
- **Backend Controller/Service:** `AnalyticsController.getHotspots()`
- **Bảng CSDL liên quan:** `audio_listen_logs, dwell_logs, pois`

---

### UC-9.6: Phân tích Thời gian dừng chân Dwell Time (Thẻ Dashboard 4)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-9.6` |
| **Tên Use Case** | **Phân tích Thời gian dừng chân Dwell Time (Thẻ Dashboard 4)** |
| **Phân hệ** | 9.0 Phân tích & Báo cáo lưu trú |
| **Tác nhân chính (Primary Actor)** | Quản trị viên (Admin / BQL) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | Không |

#### 1. Mô tả tóm tắt (Description)
Hiển thị chỉ số tại **Thẻ 4 (Màu xanh lá)**: Tổng thời gian dừng chân của du khách tại các điểm đến Quận 4 (ví dụ: 22 phút), thời gian dừng chân trung bình mỗi lượt khách (ví dụ: TB: 5.5 phút / lượt khách) và tổng số phiên dừng chân (ví dụ: 4 phiên dừng chân).

#### 2. Tiền điều kiện (Pre-conditions)
- Admin đang mở trang Dashboard.

#### 3. Hậu điều kiện (Post-conditions)
- Số liệu lưu trú Dwell Time hiển thị chính xác theo phút.

#### 4. Điểm kích hoạt (Trigger)
Tải trang Dashboard.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Admin xem Thẻ số 4 trên Dashboard. | Backend truy vấn bảng `dwell_logs`, tính tổng thời gian $\sum(dwell\_seconds)$ chuyển sang đơn vị phút, tính giá trị trung bình $\frac{\sum}{N}$. |
| **2** | Hiển thị số liệu trực quan: | Thẻ 4 hiển thị: "THỜI GIAN DỪNG CHÂN: 22 phút • TB: 5.5 phút / lượt khách • 4 phiên dừng chân". |
| **3** | Admin click nút "Xem chi tiết →". | Hệ thống mở biểu đồ cột phân tích thời gian lưu trú theo từng khung giờ trong ngày. |

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Chỉ số Dwell Time là thước đo then chốt đánh giá mức độ hấp dẫn và khả năng giữ chân du khách của các điểm đến di tích & ẩm thực.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `GET /api/admin/analytics/dwell-stats`
- **Backend Controller/Service:** `AnalyticsController -> DwellRepository`
- **Bảng CSDL liên quan:** `dwell_logs`

---

### UC-9.7: Xem tổng quan hệ thống (Tour, Check-in, Rating) (Thẻ Dashboard 5)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-9.7` |
| **Tên Use Case** | **Xem tổng quan hệ thống (Tour, Check-in, Rating) (Thẻ Dashboard 5)** |
| **Phân hệ** | 9.0 Phân tích & Báo cáo lưu trú |
| **Tác nhân chính (Primary Actor)** | Quản trị viên (Admin / BQL) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | Không |

#### 1. Mô tả tóm tắt (Description)
Hiển thị chỉ số toàn hệ thống tại **Thẻ 5 (Màu cam)**: Tổng số tour du lịch đang vận hành (ví dụ: 4 Tour), tổng số lượt check-in thực tế (ví dụ: 1 lượt check-in thực tế) và tổng số lượt đánh giá cộng đồng (ví dụ: 3 đánh giá).

#### 2. Tiền điều kiện (Pre-conditions)
- Admin đang mở Dashboard.

#### 3. Hậu điều kiện (Post-conditions)
- Thẻ tổng quan 5 hiển thị đầy đủ các chỉ số thống kê tổng hợp.

#### 4. Điểm kích hoạt (Trigger)
Tải trang Dashboard.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Admin xem Thẻ số 5 trên Dashboard. | Backend thực thi các truy vấn đếm: `COUNT(*)` từ `tours`, `COUNT(*)` từ `checkins`, `COUNT(*)` từ `reviews`. |
| **2** | Hiển thị số liệu trực quan: | Thẻ 5 hiển thị: "TỔNG TOUR & CHECK-IN: 4 Tour • 1 lượt check-in thực tế • 3 đánh giá". |
| **3** | Admin click nút "Xem chi tiết →". | Hệ thống điều hướng sang trang quản lý danh sách chi tiết các đánh giá và lượt check-in. |

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Chỉ số check-in chỉ đếm các lượt check-in thực tế đã qua xác thực GPS hợp lệ.

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `GET /api/admin/analytics/overview`
- **Backend Controller/Service:** `AnalyticsController -> AnalyticsService`
- **Bảng CSDL liên quan:** `tours, checkins, reviews`

---

### UC-9.8: Xóa bộ nhớ đệm hệ thống (Cache Eviction - Admin)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | `UC-9.8` |
| **Tên Use Case** | **Xóa bộ nhớ đệm hệ thống (Cache Eviction - Admin)** |
| **Phân hệ** | 9.0 Phân tích & Báo cáo lưu trú |
| **Tác nhân chính (Primary Actor)** | Quản trị viên (Admin / BQL) |
| **Tác nhân phụ (Secondary Actor)** | Không |
| **Mức độ ưu tiên** | Cao (Must Have) |
| **Quan hệ UML** | Không |

#### 1. Mô tả tóm tắt (Description)
Cung cấp công cụ cho Quản trị viên xóa trắng các khóa bộ nhớ đệm trong Redis Cache (ví dụ: cache danh sách POI, cache thực đơn, cache tour, cache dịch thuật) để buộc hệ thống tải lại dữ liệu mới nhất từ CSDL PostgreSQL ngay tức thì mà không cần khởi động lại máy chủ.

#### 2. Tiền điều kiện (Pre-conditions)
- Admin đã đăng nhập với quyền `ROLE_ADMIN`.

#### 3. Hậu điều kiện (Post-conditions)
- Toàn bộ các khóa đệm chỉ định trong Redis bị xóa, dữ liệu mới hiển thị ngay lập tức.

#### 4. Điểm kích hoạt (Trigger)
Admin nhấn nút "Xóa Cache hệ thống" (Nút Flush Cache màu đỏ) tại thanh công cụ quản trị.

#### 5. Luồng sự kiện chính (Basic Flow - Main Success Scenario)

| Bước | Hành động của Tác nhân | Phản hồi của Hệ thống |
| :---: | :--- | :--- |
| **1** | Admin nhấn nút "Xóa Cache hệ thống", chọn loại cache cần xóa: "Tất cả (All)" hoặc "POI & Thực đơn". | Hệ thống hiển thị hộp thoại xác nhận. |
| **2** | Admin bấm xác nhận xóa cache. | Client gửi POST `/api/admin/cache/evict` kèm payload `{ cacheNames: ["all"] }`. |
| **3** | Chờ máy chủ thực hiện. | Backend gọi `RedisTemplate.delete(keys)` xóa sạch các khóa đệm tương ứng. |
| **4** | Nhận thông báo. | Hệ thống trả về HTTP 200 kèm thông báo: "Đã xóa trắng bộ nhớ đệm Redis thành công. Hệ thống đang đồng bộ dữ liệu mới nhất!". |

#### 7. Các luồng ngoại lệ (Exception Flows)
- **Máy chủ Redis bị ngắt kết nối:**
  Hệ thống ghi log lỗi và trả về HTTP 500: "Không thể kết nối đến máy chủ Redis Cache".

#### 8. Quy tắc nghiệp vụ & Phi chức năng (Business Rules)
- Hành động xóa cache toàn hệ thống chỉ dành riêng cho Admin cấp cao nhất và được ghi vết trong nhật ký kiểm toán (Audit Log).

#### 9. Ánh xạ kỹ thuật (Technical Mapping)
- **API Endpoint:** `POST /api/admin/cache/evict (Body: EvictCacheRequest)`
- **Backend Controller/Service:** `AdminCacheController -> AdminCacheService`
- **Bảng CSDL liên quan:** `Redis Cache`

---

## PHẦN III: QUY TẮC BẢO TRÌ & ĐỒNG BỘ HỆ THỐNG

1. **Nguyên tắc đồng bộ:** Khi có bất kỳ thay đổi nào về logic nghiệp vụ hoặc cơ sở dữ liệu, tài liệu [USECASE_SPECIFICATIONS.md](file:///e:/smart-tourism/USECASE_SPECIFICATIONS.md) phải được cập nhật đồng thời cùng với sơ đồ [usecase.drawio](file:///e:/smart-tourism/usecase.drawio), sơ đồ [dfd.drawio](file:///e:/smart-tourism/dfd.drawio) và báo cáo [PRD.md](file:///e:/smart-tourism/PRD.md).
2. **Tiêu chuẩn kiểm thử:** Mỗi Use Case trong tài liệu này là căn cứ trực tiếp để đội ngũ Kiểm thử (QA/QC) xây dựng các kịch bản kiểm thử tự động (Unit Test, Integration Test với Spring Boot Test & Playwright E2E).
3. **Toàn vẹn dữ liệu:** Mọi luồng xử lý ngoại lệ (Exception Flows) phải luôn đảm bảo an toàn giao dịch CSDL (Transaction Rollback) và không để lộ thông tin nhạy cảm của hệ thống ra ngoài giao diện.

---
*Tài liệu được khởi tạo và chuẩn hóa toàn diện cho dự án Saigon Whispers - Hệ thống Du lịch Thông minh Quận 4.*

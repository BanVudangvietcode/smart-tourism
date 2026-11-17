# DFD_CHANGELOG — Saigon Whispers: Hệ thống du lịch thông minh Quận 4

> **File nguồn:** `dfd.drawio` (140,918 bytes)
> **File kết quả:** `dfd_fixed.drawio` (161522 bytes)
> **Thời gian cập nhật:** 2026-11-16T09:26:00.566Z
> **Chuyên gia:** System Analyst / Information System Designer

## I. BẢNG TỔNG HỢP CÁC THAY ĐỔI ĐÃ THỰC HIỆN

| STT | Trang DFD | Mã phần tử XML | Trạng thái trước | Trạng thái sau | Lý do chuẩn hóa DFD |
|:---:|:---|:---|:---|:---|:---|
| 1 | 1. DFD Mức 0 (Ngữ cảnh) | `f0_5` | Luồng 2 chiều f0_5: Xác thực OAuth & OTP | **f0_5a (Yêu cầu xác thực) + f0_5b (Kết quả xác thực)** | Tách luồng xác thực thành 2 luồng một chiều theo chuẩn DFD |
| 2 | 1. DFD Mức 0 (Ngữ cảnh) | `f0_6` | Luồng 2 chiều f0_6: Tọa độ <--> Tuyến đường OSRM | **f0_6a (Tọa độ & Chế độ) + f0_6b (Tuyến đường, khoảng cách, thời gian & Chỉ dẫn)** | Làm rõ luồng dữ liệu 2 chiều với OSRM |
| 3 | 1. DFD Mức 0 (Ngữ cảnh) | `f0_7` | Luồng 2 chiều f0_7: Prompt <--> Câu trả lời tư vấn | **f0_7a (Câu hỏi, prompt & Ngữ cảnh) + f0_7b (Nội dung tư vấn AI & Thẻ gợi ý)** | Làm rõ luồng dữ liệu 2 chiều với Google Gemini |
| 4 | 2. DFD Mức 1 (Toàn hệ thống) | `ext_auth` | Google (Dịch vụ xác thực) | **Google & Telegram (Dịch vụ xác thực)** | Đồng bộ tên tác nhân xác thực giữa Mức 0 và Mức 1 |
| 5 | 2. DFD Mức 1 (Toàn hệ thống) | `fl_1_2 -> fl_8_9` | 8 luồng nối tiếp hình thức 1.0->2.0->...->9.0 | **Đã xóa hoàn toàn** | Xóa bỏ pipeline anti-pattern không hợp lệ trong DFD |
| 6 | 2. DFD Mức 1 (Toàn hệ thống) | `eIoVu1v8lwUDK5NHV0pi-1` | Edge không có source và không có label | **Đã xóa** | Sửa lỗi XML Draw.io |
| 7 | 2. DFD Mức 1 (Toàn hệ thống) | `fl_adm_update` | Edge có target null | **Đã xóa và thay bằng các luồng quản trị riêng** | Sửa lỗi XML Draw.io |
| 8 | 2. DFD Mức 1 (Toàn hệ thống) | `fl_u_return` | Edge gom chung từ p6 về Khách | **Đã xóa và thay bằng luồng phản hồi trực tiếp cho từng tiến trình** | Đảm bảo mỗi chức năng có luồng phản hồi đúng |
| 9 | 2. DFD Mức 1 (Toàn hệ thống) | `Level 1 Flows` | Thiếu luồng tương tác Khách/Admin với các tiến trình | **Bổ sung 14 luồng Khách ↔ Tiến trình, 11 luồng Admin ↔ Tiến trình, 4 luồng Data Store** | Đảm bảo tính cân bằng DFD và phản ánh chính xác nghiệp vụ |
| 10 | 3. DFD Mức 2 - 1.0 Xác thực | `fl2_1_2_ext` | Luồng 2 chiều chung chung | **Tách thành fl2_1_2_ext_req và fl2_1_2_ext_res** | Làm rõ yêu cầu gửi và kết quả nhận từ dịch vụ xác thực |
| 11 | 3. DFD Mức 2 - 1.0 Xác thực | `fl2_1_3_ds` | Ghi / Đọc tài khoản người dùng (2 chiều) | **Tách thành luồng đọc và ghi riêng biệt với D1** | Chuẩn hóa luồng truy xuất Data Store |
| 12 | 3. DFD Mức 2 - 1.0 Xác thực | `fl2_1_2_fail` | Chưa có nhánh thông báo lỗi | **Bổ sung luồng thông báo lỗi xác thực từ 1.2 về Khách** | Đáp ứng yêu cầu xử lý lỗi OTP/Token |
| 13 | 4. DFD Mức 2 - 2.0 Khám phá POI | `Admin POI feedback` | 2.3 và 2.4 chỉ có đầu vào từ Admin | **Bổ sung luồng phản hồi kết quả cập nhật về Admin** | Đảm bảo mỗi tiến trình quản lý đều có kết quả đầu ra |
| 14 | 5. DFD Mức 2 - 3.0 Ẩm thực &amp; Món ăn | `Admin Food feedback` | 3.4 chỉ nhận dữ liệu từ Admin | **Bổ sung bản nháp OCR và kết quả lưu món về Admin** | Đảm bảo quy trình OCR có bước kiểm tra trước khi lưu |
| 15 | 6. DFD Mức 2 - 4.0 Tour &amp; Lộ trình | `Process 4.3 vs 4.5` | Xung đột mã: Mức 2 dùng 4.3 cho Đánh giá Tour, Mức 3 dùng 4.3 cho Custom Plan | **Giữ 4.3 Đánh giá Tour, thêm 4.5 Sinh lộ trình Custom Plan ở Mức 2 và liên kết với Mức 3** | Giải quyết triệt để lỗi phân rã trùng mã giữa Mức 2 và Mức 3 |
| 16 | 7. DFD Mức 2 - 5.0 Bản đồ &amp; GIS | `fl2_5_3_osrm` | Luồng OSRM 2 chiều chung chung | **Tách thành luồng gửi tọa độ và luồng nhận kết quả tuyến đường** | Làm rõ dữ liệu trả về từ OSRM |
| 17 | 8. DFD Mức 2 - 6.0 Thuyết minh Audio | `Tách 6.4 & audio_listen_logs` | 6.4 gộp ghi log và quản lý audio; bảng tên visitor_logs | **Tách 6.4 (Ghi nhận lượt nghe) và 6.5 (Quản lý Audio); đổi tên bảng thành audio_listen_logs** | Tách bạch 2 nghiệp vụ độc lập và dùng đúng tên bảng CSDL |
| 18 | 9. DFD Mức 2 - 7.0 Trợ lý AI | `fl2_7_3_ai & D2/D3` | Luồng Gemini 2 chiều chung chung | **Tách gửi prompt và nhận phản hồi AI; làm rõ dữ liệu đọc D2/D3 gồm cả transcript audio** | Làm rõ tương tác với Gemini và cơ sở tri thức RAG |
| 19 | 10. DFD Mức 2 - 8.0 Đánh giá &amp; Check-in | `Review feedback & Badge read/write` | Thiếu phản hồi đánh giá và tách bạch đọc/ghi D6 | **Bổ sung phản hồi đánh giá cho Khách; tách luồng đọc reviews để tính sao và ghi user_badges** | Đảm bảo tính đầy đủ của chu trình đánh giá & check-in |
| 20 | 11. DFD Mức 2 - 9.0 Phân tích &amp; Báo cáo | `Analytics D7/D2 separation` | Luồng đọc/ghi 2 chiều chung chung | **Tách rõ luồng 9.2 ghi dwell_logs và 9.3 đọc dwell_logs + pois** | Làm rõ luồng dữ liệu thời gian lưu trú |
| 21 | 14. DFD Mức 3 - 6.1 Thuyết minh Geofence | `ds_listen_3_6` | Bảng visitor_logs | **Bảng audio_listen_logs** | Đồng bộ tên bảng CSDL thực tế cho log audio |
| 22 | 20. DFD Mức 3 - 4.5 Sinh Lộ trình Custom Plan | `Renumber 4.3 -> 4.5 & OSRM separation` | Tiến trình mang mã 4.3 trùng với 4.3 Đánh giá Tour ở Mức 2 | **Đổi toàn bộ mã thành 4.5.1-4.5.4, đổi tên trang thành DFD Mức 3 - 4.5; tách luồng OSRM gửi/nhận** | Đảm bảo tính nhất quán của cây phân rã DFD giữa Mức 2 và Mức 3 |

## II. CHI TIẾT SỬA ĐỔI THEO TỪNG CẤP ĐỘ PHÂN RÃ

### 1. DFD Mức 0 — Sơ đồ ngữ cảnh

- **Tách luồng f0_5:** Thay thế luồng 2 chiều `f0_5` ("Xác thực OAuth & OTP") bằng 2 luồng 1 chiều độc lập:
  - `f0_5a`: Hệ thống → Google & Telegram ("Yêu cầu xác thực (OAuth Token / Yêu cầu OTP)")
  - `f0_5b`: Google & Telegram → Hệ thống ("Kết quả xác thực (Danh tính đã xác minh / OTP)")
- **Tách luồng f0_6:** Thay thế luồng 2 chiều `f0_6` ("Tọa độ <--> Tuyến đường OSRM") bằng:
  - `f0_6a`: Hệ thống → OSRM ("Tọa độ điểm xuất phát, đích & Chế độ di chuyển")
  - `f0_6b`: OSRM → Hệ thống ("Tuyến đường, khoảng cách, thời gian & Chỉ dẫn di chuyển")
- **Tách luồng f0_7:** Thay thế luồng 2 chiều `f0_7` ("Prompt <--> Câu trả lời tư vấn") bằng:
  - `f0_7a`: Hệ thống → Gemini AI ("Câu hỏi, prompt & Ngữ cảnh du lịch Q4")
  - `f0_7b`: Gemini AI → Hệ thống ("Nội dung tư vấn AI & Thẻ gợi ý")

### 2. DFD Mức 1 — Toàn hệ thống (SỬA ĐỔI QUAN TRỌNG NHẤT)

- **XÓA HOÀN TOÀN 8 luồng pipeline nối tiếp mang tính hình thức:**
  - `fl_1_2` (1.0 → 2.0: Định danh User)
  - `fl_2_3` (2.0 → 3.0: POI ID & Tọa độ)
  - `fl_3_4` (3.0 → 4.0: Món ăn & Quán đề xuất)
  - `fl_4_5` (4.0 → 5.0: Lộ trình & Điểm dừng)
  - `fl_5_6` (5.0 → 6.0: Tọa độ GPS hiện tại)
  - `fl_6_7` (6.0 → 7.0: Vị trí & Di tích đang nghe)
  - `fl_7_8` (7.0 → 8.0: Điểm đã tham quan)
  - `fl_8_9` (8.0 → 9.0: Lượt check-in & Đánh giá)
- **SỬA LỖI XML:**
  - Xóa edge rác `eIoVu1v8lwUDK5NHV0pi-1` (không source, không nhãn).
  - Xóa edge lỗi `fl_adm_update` (target null).
  - Xóa edge `fl_u_return` (chỉ nối p6 về Khách).
- **ĐỒNG BỘ TÁC NHÂN XÁC THỰC:** Cập nhật `ext_auth` từ "Google" thành "Google & Telegram (Dịch vụ xác thực)" để đồng bộ với Mức 0.
- **BỔ SUNG 14 LUỒNG KHÁCH DU LỊCH ↔ CÁC TIẾN TRÌNH:**
  - Khách ↔ 1.0 (`fl_u_p1`, `fl_p1_u`): Đăng nhập ↔ JWT Bearer Token.
  - Khách ↔ 2.0 (`fl_u_p2`, `fl_p2_u`): Từ khóa/bộ lọc ↔ Danh sách/chi tiết POI.
  - Khách ↔ 3.0 (`fl_u_p3`, `fl_p3_u`): Ngân sách/số người ↔ Gợi ý món ăn & thực đơn.
  - Khách ↔ 4.0 (`fl_u_p4`, `fl_p4_u`): Yêu cầu xem/tạo tour ↔ Lộ trình & điểm dừng.
  - Khách ↔ 5.0 (`fl_u_p5`, `fl_p5_u`): Vị trí GPS/chỉ đường ↔ Bản đồ & tuyến đi bộ.
  - Khách ↔ 6.0 (`fl_u_p6`, `fl_p6_u`): Tọa độ GPS/điều khiển ↔ Audio thuyết minh & trạng thái.
  - Khách ↔ 7.0 (`fl_u_p7`, `fl_p7_u`): Câu hỏi AI ↔ Câu trả lời tư vấn & thẻ thông tin.
  - Khách ↔ 8.0 (`fl_u_p8`, `fl_p8_u`): Đánh giá/check-in GPS ↔ Kết quả & huy hiệu.
  - Khách → 9.0 (`fl_u_p9`): Tín hiệu Dwell Time heartbeat ping & leave (luồng 1 chiều).
- **BỔ SUNG 11 LUỒNG ADMIN ↔ CÁC TIẾN TRÌNH:**
  - Admin ↔ 1.0 (`fl_adm_p1`, `fl_p1_adm`): Đăng nhập Admin ↔ JWT Admin.
  - Admin ↔ 2.0 (`fl_adm_p2`, `fl_p2_adm`): Cập nhật POI & Danh mục ↔ Kết quả xử lý POI.
  - Admin ↔ 3.0 (`fl_adm_p3`, `fl_p3_adm`): Cập nhật món & OCR ↔ Kết quả xử lý món & Bản nháp OCR.
  - Admin ↔ 4.0 (`fl_adm_p4`, `fl_p4_adm`): Tạo/sửa Tour ↔ Kết quả xử lý Tour.
  - Admin ↔ 6.0 (`fl_adm_p6`, `fl_p6_adm`): Upload file MP3/bán kính ↔ Kết quả Audio.
  - Admin ↔ 9.0 (`fl_adm_p9`, `fl_adm_report`): Lọc báo cáo/SSE ↔ Báo cáo thống kê & Khách online.
- **BỔ SUNG CÁC LUỒNG DATA STORE CÒN THIẾU:**
  - `fl_5_ds2`: p5 đọc tọa độ POI từ D2.
  - `fl_7_ds2`: p7 đọc ngữ cảnh POI từ D2.
  - `fl_7_ds3`: p7 đọc thực đơn món ăn từ D3.
  - `fl_6_ds7`: p6 ghi log nghe vào D7 (audio_listen_logs).

### 3. DFD Mức 2 (Các tiến trình 1.0 đến 9.0)

- **1.0 Xác thực:** Tách luồng `fl2_1_2_ext` thành gửi/nhận riêng; tách đọc/ghi D1; bổ sung luồng thông báo lỗi xác thực về Khách du lịch.
- **2.0 Khám phá POI:** Tách luồng đọc D2 thành 1 chiều cho 2.1 và 2.2; bổ sung luồng phản hồi kết quả từ 2.3 và 2.4 về Admin.
- **3.0 Ẩm thực:** Bổ sung tọa độ GPS vào luồng 3.2; tách các luồng đọc D3 và D2; bổ sung bản nháp OCR và kết quả lưu món về Admin từ 3.4.
- **4.0 Tour & Lộ trình (Giải quyết xung đột mã):**
  - Giữ nguyên `4.3 Đánh giá & Nhận xét Tour` và bổ sung phản hồi đánh giá cho Khách.
  - Giữ nguyên `4.4 Thiết kế lộ trình & Quản lý Tour` và bổ sung phản hồi tạo tour cho Admin.
  - **Thêm mới tiến trình `4.5 Sinh lộ trình theo yêu cầu (Custom Plan)`** tại Mức 2 với đầy đủ kết nối tới Khách, D2, D4 và dịch vụ OSRM.
- **5.0 GIS & Dẫn đường:** Tách luồng OSRM thành gửi tọa độ (`fl2_5_3_osrm_req`) và nhận tuyến đường (`fl2_5_3_osrm_res`); làm rõ luồng đọc D2 là 1 chiều.
- **6.0 Thuyết minh Audio:**
  - **Tách 6.4 thành 2 tiến trình độc lập:** `6.4 Ghi nhận lượt nghe Audio` (ghi D7) và `6.5 Quản lý nội dung Audio` (Admin upload MP3, ghi D5).
  - Sửa tên kho D7 từ `visitor_logs` thành `audio_listen_logs`.
  - Bổ sung luồng phản hồi trạng thái phát audio về Khách du lịch.
- **7.0 Trợ lý AI:** Tách luồng Gemini thành gửi System Prompt + Context và nhận phản hồi AI; làm rõ dữ liệu đọc D2/D3 gồm cả transcript audio.
- **8.0 Đánh giá & Check-in:** Bổ sung phản hồi đánh giá cho Khách; tách luồng đọc reviews để tính sao và ghi user_badges; làm rõ việc xác thực GPS trước khi lưu check-in.
- **9.0 Phân tích lưu trú:** Tách bạch rõ ràng luồng 9.2 ghi `dwell_logs` và luồng 9.3 đọc `dwell_logs` + `pois`.

### 4. DFD Mức 3 (Phân rã chi tiết)

- **Trang 14 (6.1 Geofence):** Sửa tên kho dữ liệu `D7: Bảng visitor_logs` thành `D7: Bảng audio_listen_logs`.
- **Trang 20 (Custom Plan — Giải quyết xung đột):**
  - Đổi tên trang từ `20. DFD Mức 3 - 4.3 Sinh Lộ trình Custom Plan` thành `20. DFD Mức 3 - 4.5 Sinh Lộ trình Custom Plan`.
  - Đổi toàn bộ mã tiến trình con từ `4.3.1 - 4.3.4` thành `4.5.1 - 4.5.4`.
  - Tách luồng OSRM thành luồng gửi tọa độ chặng dừng và luồng nhận ma trận khoảng cách/thời gian.
  - Đồng bộ hoàn toàn với tiến trình `4.5` ở Mức 2.

## III. CÁC MỤC GHI CHÚ "CHƯA XÁC MINH"

1. **Telegram OTP trong hệ thống:** Backend có `TelegramBotService.java` và các endpoint OTP Telegram, nhưng chức năng polling đã bị disable và frontend đã ẩn nút Telegram. Sơ đồ DFD giữ lại tác nhân Telegram để phản ánh đúng năng lực mã nguồn backend, nhưng đánh dấu là **CHƯA XÁC MINH** về việc có tiếp tục duy trì kênh này trong tương lai hay không.
2. **Cơ chế lưu Custom Plan (4.5.4):** Sơ đồ thể hiện luồng lưu vào D4 nếu người dùng đã đăng nhập. Nếu thực tế hệ thống chỉ sinh kết quả tạm thời trên client mà không lưu vào database, luồng này có thể bỏ qua trong pha triển khai tiếp theo.
3. **Admin xác nhận bản nháp OCR (3.4.4):** Sơ đồ thể hiện bước Admin kiểm tra bản nháp trước khi lưu chính thức vào bảng `dishes`. Cần xác minh thêm giao diện Frontend Admin đã có form duyệt kết quả OCR hay đang gọi API import trực tiếp.

### 5. Tái cấu trúc Layout trực quan DFD Mức 1 (Khắc phục triệt để hiện tượng rối / đè chữ)

- **Vấn đề trước đó:** Khi chuyển từ sơ đồ chuỗi (pipeline) sang sơ đồ tương tác trực tiếp, nếu đặt 16 luồng của Khách du lịch và 11 luồng của Admin đi cùng một hành lang hẹp bên trái với các kho `D2` và `D6` nằm chắn ở giữa (`x=310`), các mũi tên và nhãn văn bản bị chồng đè lên nhau gây rối mắt.
- **Giải pháp chuẩn hóa kiến trúc 4 phân tầng (4-Tier Architecture):**
  1. **Tầng 1 - Tác nhân (Cánh trái, x=50):** 
     - `Quản trị viên (Admin / BQL)` đặt ở góc trên bên trái (`y=120`), kết nối trực tiếp và ngắn gọn tới các tiến trình quản lý (`1.0, 2.0, 3.0, 4.0`) và tuyến báo cáo `9.0`.
     - `Khách du lịch` đặt ở trung tâm bên trái (`y=720`), xòe đều các luồng (Fan-out) sang các tiến trình 1.0 đến 9.0 qua các kênh tọa độ X tách biệt (`x=280, 310, 340, 370...`), loại bỏ 100% việc đè đường.
  2. **Tầng 2 - Tiến trình hệ thống (Trung tâm, x=620):** 9 Tiến trình cốt lõi `p1` đến `p9` xếp dọc cách đều 160px với đường kính chuẩn 120px, nhãn chữ rõ ràng.
  3. **Tầng 3 - Kho dữ liệu (Cánh phải, x=980):** Toàn bộ 7 Data Stores (`D1` đến `D7`) được chuyển hết sang bên phải, đặt song song và thẳng hàng ngang với tiến trình tương ứng (`D1` cạnh `1.0`, `D2` cạnh `2.0`, `D3` cạnh `3.0`, `D4` cạnh `4.0`, `D5` cạnh `6.0`, `D6` cạnh `8.0`, `D7` cạnh `9.0`). Giải phóng 100% không gian bên trái, không còn bất kỳ đường nối nào cắt xuyên qua kho dữ liệu.
  4. **Tầng 4 - Dịch vụ bên ngoài (Cánh phải ngoài cùng, x=1270):** `Google & Telegram` (ngang hàng 1.0), `Dịch vụ OSRM` (ngang hàng 5.0), `Google Gemini AI` (ngang hàng 7.0) kết nối bằng đường thẳng ngang nét đứt.
- **Hợp nhất luồng yêu cầu - phản hồi:** Sử dụng luồng 2 chiều chuẩn hóa (`endArrow=block;startArrow=block;`) cho các cặp yêu cầu / kết quả, giảm số lượng đường từ 46 xuống 28 đường trực giao, có phân màu sắc trực quan (Xanh: Khách, Đỏ: Admin, Cam: Data Store, Tím: Dịch vụ ngoài).

### 6. Chuẩn hóa & Tinh gọn DFD Mức 2 - 9.0 (Khớp chính xác 5 thẻ KPI Dashboard thực tế)

- **Vấn đề trước đó:** Sơ đồ 9.0 cũ chia nhỏ quá đà và lặp lại 3 tiến trình chỉ cho riêng "Dwell Time" (9.1 Nhận Ping, 9.2 Tính dừng, 9.3 Tổng hợp nán lại), trong khi thực tế giao diện Admin chỉ tập trung vào đúng 5 thẻ KPI tổng quan.
- **Tái cấu trúc 3 tiến trình tinh gọn theo đúng mã nguồn Backend & Frontend:**
  1. **9.1 Giám sát truy cập trực tiếp & SSE (`/realtime/visitors, ping, leave`):** Khách gửi heartbeat ping/leave ngầm; hệ thống quản lý activeVisitors và phát Server-Sent Events (SSE) trực tiếp đến Dashboard Admin (Thẻ 1: *Số truy cập hiện tại*).
  2. **9.2 Ghi nhận thời gian dừng chân (`/analytics/dwell`):** Tiếp nhận sự kiện dừng chân từ GPS thiết bị khi lưu trú tại POI và ghi nhận vào bảng `dwell_logs`.
  3. **9.3 Tổng hợp 5 chỉ số KPI Dashboard (`/analytics/dashboard-summary`):** Đọc `dwell_logs` (thời gian dừng), `audio_listen_logs` (lượt nghe), `pois` (điểm nóng ẩm thực/du lịch), `tours` & `checkins` để kết xuất đúng bộ 5 thẻ KPI cho Quản trị viên:
     - Thẻ 1: **Số truy cập hiện tại** (Real-time)
     - Thẻ 2: **Lượt nghe thuyết minh** (Tổng số, TB giây/lượt, GPS tự động)
     - Thẻ 3: **Điểm nóng ẩm thực** (Quán/món được nghe nhiều nhất)
     - Thẻ 4: **Thời gian dừng chân** (Tổng phút, TB phút/lượt)
     - Thẻ 5: **Tổng Tour & Check-in** (Số tour, lượt check-in thực tế, đánh giá)

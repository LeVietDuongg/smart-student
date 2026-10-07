# Báo cáo kiểm thử Smart Student

Ngày kiểm tra: 04/10/2026, múi giờ Việt Nam.

## Kết quả máy chủ

Node.js 24.19.0, cơ sở dữ liệu SQLite tạm riêng. Kết quả kiểm tra lại: **48 tests pass, 0 fail** (33 tình huống API, 5 trạng thái client, 9 tình huống Gemini/cấu hình deploy và một kiểm tra tổng).

## Kết luận kiểm tra lại

**Bản demo dùng được để trình bày đồ án; chưa hoàn thiện toàn bộ theo hai ảnh và chưa sẵn sàng vận hành công khai.** Không quy đổi số kiểm thử đạt thành phần trăm hoàn thiện.

Đã sửa trong lần kiểm tra lại:

- Lịch mở tuần hiện tại, thay vì tuần của buổi học đầu tiên trong dữ liệu.
- Trợ lý chặn gửi trùng khi đang trả lời, bỏ phản hồi đến muộn sau khi xóa hội thoại hoặc đổi tài khoản, không dựng lại trang khác khi người dùng đã chuyển trang.
- Thêm 5 kiểm thử hồi quy trực tiếp trên hàm client với yêu cầu bất đồng bộ có thể điều khiển; phần DOM được giả lập. Trình duyệt thật xác nhận lịch hiện tại, gửi câu hỏi/hiển thị nguồn và không ghi nhận lỗi console trong luồng này.

Các khoảng thiếu so với yêu cầu hoàn thiện:

| Hạng mục | Trạng thái thực tế |
|---|---|
| Giao diện | Bám bố cục và màu ảnh mẫu, chưa giống từng pixel; minh họa và avatar được dựng lại |
| Menu và dữ liệu | Có 12 trang, dữ liệu lưu SQLite và 3 vai trò kiểm tra ở máy chủ |
| Trợ lý | Gemini đã gọi thật thành công tại local; cần khóa mới và kiểm tra lại quota trên hosting |
| Học liệu | Nội dung văn bản và TXT, hỗ trợ URL YouTube; chưa có tải lên/quản lý PDF, video hoặc lớp live |
| Game | 8 chế độ dùng ngân hàng câu hỏi nhỏ; flashcard/puzzle/ô chữ/đua xe ở mức đơn giản, chưa có đấu nhiều người hoặc ô chữ dạng lưới |
| Xếp hạng và nhiệm vụ | Xếp hạng tổng XP; chưa có bảng tuần/lớp/khoa và thưởng riêng cho nhiệm vụ |
| Điểm | Có tính điểm học phần; chưa có quy trình điểm rèn luyện như ảnh |
| Tài khoản | Có đăng nhập, đăng ký, đổi mật khẩu, khóa/phân quyền; chưa có xác minh email, quên mật khẩu qua email hoặc MFA |
| Vận hành | Chạy localhost; chưa có triển khai HTTPS thật, giám sát, sao lưu định kỳ/diễn tập khôi phục hoặc kiểm thử tải |
| Bảo mật | Các kiểm tra hiện có đạt; chưa kiểm toán/pentest độc lập. Rate limit trong RAM cần thiết kế thêm khi dùng reverse proxy/nhiều tiến trình |

Nội dung, tài khoản, quà và đánh giá ban đầu là minh họa; chưa kết nối dịch vụ của trường.

Các nhóm kiểm tra:

1. Dữ liệu riêng không truy cập được khi chưa đăng nhập.
2. Cookie HttpOnly/SameSite, xoay phiên và thu hồi phiên.
3. Hash scrypt có salt; cơ sở dữ liệu không lưu token phiên nguyên bản.
4. CSP, chống nhúng iframe và nosniff.
5. CSRF thiếu/sai token và Origin ngoài bị từ chối.
6. Giới hạn body JSON và Content-Type.
7. Đăng ký không thể tự cấp quyền hoặc tự gán xu.
8. Quyền sinh viên không truy cập quản trị hoặc tạo học liệu.
9. Thêm, sửa, hoàn thành và lưu công việc.
10. IDOR giữa hai tài khoản, kể cả dữ liệu cá nhân đối với quản trị.
11. Điểm tính đúng, trọng số và điểm sai bị từ chối.
12. Lịch thêm/sửa/xóa, thời gian ngược và quyền sở hữu.
13. Học liệu của giảng viên, bản nháp và quyền sửa.
14. Tải tài liệu và tiến độ bài học.
15. Nhóm thành viên, bài thảo luận và quyền xóa.
16. Đăng ký sự kiện không bị ghi trùng.
17. Đánh giá giảng viên theo vai trò và mỗi người một đánh giá.
18. Quiz chấm ở máy chủ, chặn chấm lại và giới hạn thưởng.
19. Cả 8 chế độ chơi chấm được đầy đủ điểm, gồm ô chữ.
20. Game tốc độ hết giờ không được điểm.
21. Đổi quà trừ xu/tồn kho; không tin giá client gửi lên.
22. Hủy quà hoàn xu một lần.
23. Hai yêu cầu đổi quà đồng thời không vượt tồn kho.
24. Link video độc hại bị từ chối, chỉ nhận YouTube HTTPS.
25. Ngày không tồn tại và Host giả bị chặn.
26. Trợ lý thư viện có nguồn, kế hoạch và tiến độ.
27. SQL injection, dữ liệu văn bản XSS và không phục vụ tệp riêng.
28. Thay quyền/khóa tài khoản thu hồi phiên; không tự nâng quyền.
29. Đổi mật khẩu kiểm tra mật khẩu cũ, thu hồi các phiên khác và giữ nguyên ký tự khoảng trắng trong mật khẩu.
30. Nhật ký quản trị và API không lộ hash mật khẩu.
31. Đăng xuất thu hồi phiên.
32. Rate limit đăng nhập trả HTTP 429.

## Kiểm tra trực tiếp trên trình duyệt

- Đăng nhập bằng sinh viên, giảng viên và quản trị viên.
- Cả 12 mục menu mở đúng trang tương ứng.
- Chơi Quiz trên giao diện, đạt 5/5 câu và cập nhật +50 xu.
- Thêm công việc, tải lại trang và xác nhận dữ liệu vẫn còn.
- Trợ lý thư viện trả lời và dẫn nguồn tài liệu.
- Giảng viên lưu tài liệu “Hướng dẫn sử dụng Smart Student”.
- Bảng quản trị hiển thị tài khoản, vai trò, yêu cầu quà, nhật ký và tồn kho.
- Bố cục desktop 1440px và điện thoại 390px; kiểm tra sáu trang chính ở điện thoại, không tràn ngang. Menu thu gọn hoạt động.
- Minh họa robot và game được lưu nội bộ, không cần tải từ dịch vụ ảnh bên ngoài khi mở website.
- Kiểm tra cú pháp server và client thành công. Sao lưu SQLite tạo được tệp hợp lệ.

Ảnh giao diện bàn giao: `trang-chu.jpg`, `game-hoc-tap.jpg`, `quan-tri.jpg`, `dien-thoai.jpg` trong thư mục outputs.

Trong bản ZIP, các ảnh được đặt ở thư mục `screenshots`.

## Phạm vi chưa xác minh bằng dịch vụ thật

Gemini đã được gọi thật qua script kiểm tra và giao diện AI Học tập ngày 04/10/2026, hiển thị Gemini · AI trực tuyến. Khóa chỉ nằm trong .env riêng, không trong mã công khai hoặc ZIP. Video nhúng được kiểm tra xác thực URL, chưa kiểm tra phát một bài giảng thật của trường. HTTPS/reverse proxy/tên miền chưa được triển khai công khai; cấu hình production có sẵn trong README. Nội dung và tài khoản ban đầu là dữ liệu minh họa.

Các kiểm tra này xác nhận các luồng trong phạm vi dự án, không thay thế pentest độc lập hoặc đảm bảo không còn lỗ hổng.

## Cập nhật Gemini và cấu hình hosting

- Nhà cung cấp Gemini được gọi bằng header x-goog-api-key tới endpoint Google cố định; không đưa khóa vào URL, frontend hoặc câu hỏi.
- Đã thử thật gemini-3.5-flash-lite: một câu kiểm tra ngắn và câu hỏi về cung cầu qua giao diện. Console trình duyệt không báo lỗi trong luồng này. Không đánh giá chất lượng kiến thức của mọi câu trả lời mô hình từ hai lần thử.
- Kiểm thử giả lập lỗi hạn mức, quyền/khóa, model, timeout, nội dung bị chặn/rỗng, giữ tích hợp OpenAI cũ, kiểm tra allowlist Origin và URL production.
- Health endpoint không tạo phiên. Đã kiểm tra Origin Vercel trong allowlist được nhận, tên miền khác vẫn bị từ chối.
- Có render.yaml (Node 24 + persistent disk), deploy/vercel/vercel.json (proxy về Render), HUONG-DAN-DEPLOY.md. Các file cấu hình chưa được triển khai thực tế lên hosting của người dùng.
- Bản ZIP mới Smart-Student-Gemini-Deploy.zip chứa mã và hướng dẫn; không chứa .env, SQLite hoặc mật khẩu tài khoản local.
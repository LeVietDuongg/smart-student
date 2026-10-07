# Smart Student

Website tiếng Việt theo bố cục hai ảnh mẫu: Trang chủ dạng dashboard, Game học tập với 8 chế độ và 12 mục điều hướng. Có máy chủ Node.js, cơ sở dữ liệu SQLite và phân quyền thực tế.

## Mở website trên máy hiện tại

1. Mở `http://127.0.0.1:3000` khi máy chủ đang chạy.
2. Tài khoản trình bày nằm trong `TAI-KHOAN.txt`. Có ba tài khoản: sinh viên, giảng viên và quản trị viên.
3. Nếu máy chủ đã tắt, nhấp đúp `START.cmd`, giữ cửa sổ đó mở và truy cập địa chỉ trên.
4. Khi dừng, nhấn Ctrl+C trong cửa sổ chạy máy chủ.

Nếu báo cổng 3000 đang được dùng, bản website có thể đã chạy. Mở địa chỉ trước khi chạy thêm một bản.

## Chạy trên máy khác

Cài [Node.js 24 trở lên](https://nodejs.org/en/download). Giải nén toàn bộ mã nguồn, rồi nhấp đúp `START.cmd` trên Windows hoặc chạy:

```sh
npm start
```

Không cần cài thư viện bên thứ ba. Lần chạy đầu tạo SQLite, nội dung minh họa và mật khẩu ngẫu nhiên. Tài khoản nằm trong `data/initial-credentials.json`; bản zip không chứa cơ sở dữ liệu hoặc mật khẩu của máy hiện tại.

Không mở `public/index.html` bằng cách nhấp đúp: xác thực và lưu dữ liệu cần máy chủ.

## Quyền truy cập

| Thao tác | Sinh viên | Giảng viên | Quản trị viên |
|---|---|---|---|
| Đọc nội dung đã công khai, dùng tìm kiếm | Có | Có | Có |
| Công việc, lịch, điểm, tiến độ cá nhân | Chỉ dữ liệu của mình | Chỉ dữ liệu của mình | Chỉ dữ liệu của mình |
| Chơi game và đổi quà | Có | Có | Có |
| Tạo nhóm, tham gia, đăng thảo luận | Có | Có | Có |
| Sửa/xóa nhóm mình tạo | Có | Có | Có |
| Sửa/xóa bài thảo luận | Bài của mình | Bài của mình | Mọi bài để kiểm duyệt |
| Tạo bài học, tài liệu, sự kiện | Không | Có | Có |
| Sửa/xóa học liệu và sự kiện | Không | Nội dung của mình | Toàn bộ |
| Đọc học liệu chưa công khai | Không | Bản nháp của mình | Toàn bộ |
| Đánh giá giảng viên | Có, mỗi giảng viên một đánh giá | Không | Không |
| Đổi vai trò, khóa tài khoản | Không | Không | Có, trừ tài khoản đang sử dụng |
| Xử lý yêu cầu đổi quà, tồn kho | Không | Không | Có |
| Xem nhật ký quản trị, gửi thông báo hệ thống | Không | Không | Có |

Đăng ký mới luôn nhận vai trò sinh viên. Giảng viên được quản trị viên cấp quyền. Thay quyền, khóa tài khoản hoặc đổi mật khẩu sẽ thu hồi phiên đăng nhập liên quan. Quyền được kiểm tra tại API, ngoài việc ẩn các nút trên giao diện.

## Các chức năng

- Trang chủ: các khối học tập, lịch tuần, tiến độ công việc và lối tắt.
- AI Học tập: tra cứu nội dung thư viện có nguồn, gợi ý kế hoạch từ công việc, tổng hợp tiến độ. Có thể kết nối AI trực tuyến bằng cấu hình máy chủ.
- Lịch: thêm, sửa, xóa lịch học, lịch thi và deadline; chuyển tuần, lọc loại lịch.
- Học liệu: thêm/sửa/xóa, công khai/bản nháp, nội dung bài học, tải TXT, đánh dấu đã học; hỗ trợ video YouTube do giảng viên thêm. Chỉ tải trình phát khi người dùng nhấn xem video.
- Trò chơi: Quiz, Flashcard, Puzzle kéo thả hoặc nhấp, Tốc độ 90 giây, Ô chữ nhập từ, thử thách ngày, Đường đua 3 phút và trò chơi theo môn.
- Máy chủ chọn và chấm 5 câu mỗi lượt. Mỗi câu đúng thưởng 10 xu, mỗi chế độ tối đa một lượt thưởng/ngày; chơi lại vẫn xem kết quả. Hết giờ không nhận điểm.
- Xu, XP, bảng xếp hạng, nhiệm vụ, lịch sử game và cửa hàng quà. Yêu cầu đổi quà được quản trị viên xác nhận đã trao hoặc hủy và hoàn xu.
- Nhóm: tạo nhóm, tham gia/rời nhóm, đọc/gửi thảo luận của thành viên và kiểm duyệt.
- Điểm: tính theo 3 thành phần, xác thực điểm 0–10 và trọng số tổng 100%, lưu/xóa lịch sử.
- Sự kiện: lọc, xem thông tin, đăng ký/hủy, giới hạn số chỗ.
- Giảng viên: tìm, xem hồ sơ, đánh giá sao và tổng hợp đánh giá.
- Công việc: thêm/sửa/xóa/hoàn thành. Thống kê sử dụng dữ liệu thật của từng người.
- Hồ sơ, tùy chọn thông báo, đổi mật khẩu, đăng xuất; tìm kiếm chung và thông báo trong website.

## Cấu hình AI và triển khai

Đã tích hợp Gemini tại máy chủ. Đặt `AI_PROVIDER=gemini`, `GEMINI_API_KEY` và `GEMINI_MODEL=gemini-3.5-flash-lite` trong `.env` riêng khi chạy local hoặc Environment của Render. Không đưa khóa vào trình duyệt, GitHub hay bản ZIP. Cấu hình mẫu không có khóa trong `.env.example`.

Lần cập nhật 04/10/2026 đã gọi Gemini thật thành công. Chạy `npm run check:ai` để kiểm tra khóa của bạn. Giao diện phân biệt Gemini trực tuyến với thư viện dự phòng và thông báo lỗi hạn mức/quyền truy cập. Vẫn hỗ trợ `AI_PROVIDER=openai` với `OPENAI_API_KEY`, hoặc `AI_PROVIDER=library` để chỉ dùng nội dung cục bộ.

Xem [hướng dẫn từng bước Render và Vercel](HUONG-DAN-DEPLOY.md). Có `render.yaml` cho máy chủ và disk, cùng `deploy/vercel/vercel.json` cho Vercel chuyển tiếp về Render. SQLite và khóa AI được lưu ở Render. Chưa triển khai lên tài khoản hosting của bạn.

## Bảo mật đã triển khai

- Mật khẩu băm bằng scrypt, mỗi mật khẩu có salt ngẫu nhiên; mật khẩu tối thiểu 12 ký tự.
- Token phiên ngẫu nhiên 256 bit, chỉ lưu bản băm ở SQLite. Cookie HttpOnly, SameSite=Strict, tự hết hạn sau 30 phút không hoạt động hoặc tối đa 8 giờ. Cookie Secure khi chạy HTTPS.
- Xoay token sau đăng nhập và đổi mật khẩu; thu hồi phiên khi đăng xuất, khóa tài khoản hoặc thay quyền.
- Kiểm tra Origin và CSRF token cho các API thay đổi dữ liệu, kể cả đăng nhập/đăng ký.
- SQL có tham số; kiểm tra vai trò và quyền sở hữu trên máy chủ. Văn bản người dùng được escape khi hiển thị, không cho chèn HTML.
- CSP giới hạn script nội bộ; chặn nhúng website trong iframe; nosniff, Referrer Policy và hạn chế camera/mic/location.
- Chỉ nhận ID video hợp lệ từ YouTube HTTPS. Không tải URL tùy ý trên máy chủ.
- Giới hạn tần suất đăng nhập, API, AI và game; giới hạn body JSON 64 KB, thời gian đọc request và header.
- Máy chủ quyết định điểm/xu. Đổi quà, trừ xu, giảm tồn kho và hoàn xu chạy trong transaction; chặn chấm lại và hoàn tiền lần hai.
- Mật khẩu/hash/khóa API không được gửi trong API người dùng. Thư mục dữ liệu, `.env` và mã máy chủ không được phục vụ như tệp công khai.
- Nhật ký các thao tác quản trị, phân quyền, nội dung và đổi quà.

Cách quản lý phiên và CSRF tham chiếu [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) và [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html). Kiểm thử trong dự án không phải chứng nhận an toàn hay kiểm toán độc lập.

## Đưa lên Internet

Website hiện chạy trên máy cá nhân. Để triển khai công khai, dùng máy chủ Node.js 24 có ổ đĩa bền vững và HTTPS reverse proxy. Tạo **cơ sở dữ liệu riêng** với `DATA_DIR`, không sử dụng tài khoản trình bày làm tài khoản vận hành.

```env
NODE_ENV=production
HOST=127.0.0.1
PORT=3000
APP_ORIGIN=https://ten-mien-cua-ban.example
COOKIE_SECURE=1
SEED_DEMO=0
DATA_DIR=/var/lib/smart-student
```

Máy chủ sẽ từ chối khởi động production nếu thiếu HTTPS, Secure cookie hoặc còn bật dữ liệu demo. Đặt quyền truy cập thư mục dữ liệu cho tài khoản dịch vụ, đọc mật khẩu khởi tạo tại chỗ, đổi mật khẩu quản trị và xóa tệp mật khẩu khởi tạo sau khi thiết lập. Reverse proxy cần giữ Host bằng tên miền trong APP_ORIGIN; chỉ bind ứng dụng vào loopback.

Phiên bản này dùng một tiến trình và rate limit trong bộ nhớ. Hệ thống nhiều máy chủ cần kho rate limit chung và cơ sở dữ liệu dùng chung; không chạy nhiều bản với các ổ SQLite khác nhau. Không có MFA, xác minh email hay khôi phục mật khẩu qua email; chưa tích hợp hệ thống đào tạo, video live hoặc kho PDF của trường. Những kết nối này cần tài khoản dịch vụ và dữ liệu thật của đơn vị sử dụng.

## Kiểm thử và sao lưu

```sh
npm test
npm run check
node backup.mjs
```

`TEST.cmd` chạy kiểm thử trên Windows. Các kiểm tra sử dụng một máy chủ và SQLite tạm riêng; không làm thay đổi dữ liệu đang trình bày. Báo cáo trong `BAO-CAO-KIEM-THU.md`.

`backup.mjs` sử dụng SQLite backup API để tạo bản sao nhất quán trong `data/backups`. Nếu dùng DATA_DIR riêng, truyền cùng biến môi trường khi chạy sao lưu. Để khôi phục, dừng ứng dụng, khôi phục bản SQLite vào thư mục dữ liệu và khởi động lại. Giữ nguyên bản dữ liệu cũ để có thể quay lại.

## Mã nguồn

| Tệp | Vai trò |
|---|---|
| `server.mjs` | HTTP server, SQLite, xác thực, phân quyền, API |
| `seed.mjs` | Nội dung và câu hỏi ban đầu, chế độ chơi, quà mẫu |
| `public/app.js` | Các trang và tương tác trên trình duyệt |
| `public/styles.css` | Giao diện máy tính/điện thoại |
| `public/assets/` | Minh họa robot và biểu tượng |
| `tests/integration.test.mjs` | Kiểm thử chức năng và quyền truy cập |
| `.env.example` | Cấu hình mẫu không chứa khóa |

Minh họa mới được tạo bằng công cụ imagegen tích hợp. Bố cục bám theo ảnh tham khảo; các hình minh họa và nội dung được dựng lại, không phải bản sao từng pixel.

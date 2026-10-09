# Smart Student — Gemini, Render và Vercel

Cập nhật ngày 04/10/2026. Đã gọi Gemini thật trên máy hiện tại. Chưa tạo dịch vụ Render/Vercel hoặc mua gói hosting thay bạn.

## 1. Cách triển khai phù hợp với mã nguồn hiện tại

```text
Cách A: Trình duyệt → Render → SQLite trên Persistent Disk
                            → Gemini API

Cách B: Trình duyệt → Vercel (chuyển tiếp toàn bộ website)
                   → Render → SQLite trên Persistent Disk
                            → Gemini API
```

Cách A đơn giản nhất và đã có URL HTTPS của Render. Cách B thêm địa chỉ Vercel; máy chủ, dữ liệu và khóa Gemini vẫn ở Render. Đây không phải hai cơ sở dữ liệu riêng. Tài khoản giống nhau ở hai địa chỉ, nhưng phải đăng nhập riêng vì cookie theo tên miền.

SQLite dạng tệp của dự án không phù hợp để chạy độc lập trong Vercel Functions. Nếu muốn Vercel chạy cả backend, cần chuyển sang cơ sở dữ liệu bên ngoài và điều chỉnh backend. [Tài liệu Vercel về SQLite](https://vercel.com/kb/guide/is-sqlite-supported-in-vercel).

Render cần **Web Service trả phí + Persistent Disk** để giữ SQLite qua lần khởi động/triển khai. File `render.yaml` chọn Starter và ổ 1 GB; xem chi phí hiện trên bảng điều khiển trước khi tạo. Không dùng ổ tạm của gói Free để giữ tài khoản thật. [Render Persistent Disks](https://render.com/docs/disks).

## 2. Khóa Gemini

Khóa đã gửi trong cuộc trò chuyện nên được thu hồi và thay bằng khóa mới trong [Google AI Studio](https://aistudio.google.com/api-keys). Không gửi khóa mới vào chat hoặc GitHub. [Hướng dẫn quản lý khóa của Google](https://ai.google.dev/gemini-api/docs/api-key).

Trên máy hiện tại, khóa đang nằm trong `.env` riêng, được `.gitignore` loại trừ. Bản ZIP bàn giao không chứa `.env` hoặc khóa thật. Để thay khóa cục bộ, sửa `.env`, lưu rồi khởi động lại server:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=DIEN_KHOA_MOI_CUA_BAN
GEMINI_MODEL=gemini-3.5-flash-lite
```

Mô hình trên đã gọi thành công trong lần kiểm tra. Có thể đổi `GEMINI_MODEL` theo mô hình tài khoản được cấp quyền tại [danh sách Gemini](https://ai.google.dev/gemini-api/docs/models). Không có cam kết mọi tài khoản đều có cùng hạn mức miễn phí.

Kiểm tra kết nối từ thư mục dự án với Node.js 24:

```sh
npm run check:ai
```

Lệnh gửi một câu hỏi kiểm tra ngắn đến nhà cung cấp đã chọn; không in khóa. Các kiểm thử `npm test` dùng dịch vụ giả lập, không gọi Gemini và không tiêu tốn quota.

## 3. Chuẩn bị GitHub

1. Giải nén bản `Smart-Student-Gemini-Deploy.zip` mới nhất.
2. Tạo repository GitHub, có thể chọn Private rồi cấp quyền cho Render/Vercel đọc repository đó.
3. Đưa **nội dung bên trong thư mục `smart-student`** lên gốc repository: gốc phải có `package.json`, `server.mjs`, `render.yaml`, `public`, `deploy` và các tệp còn lại.
4. Dùng mã từ ZIP sạch. Không đưa `.env`, `data`, `TAI-KHOAN.txt`, `node_modules` lên GitHub. Khi upload bằng giao diện GitHub, `.gitignore` không tự lọc những tệp bạn chọn thủ công.

## 4. Deploy Render

### Cách dùng Blueprint có sẵn

1. Đăng nhập [Render Dashboard](https://dashboard.render.com/).
2. Chọn **New → Blueprint**, kết nối repository vừa tạo.
3. Chọn nhánh chứa mã nguồn; Render đọc `render.yaml` ở gốc repository.
4. Điền `GEMINI_API_KEY` bằng khóa mới trong ô biến môi trường. Không sửa khóa vào file YAML.
5. Xem lại gói Starter và disk 1 GB, sau đó tự xác nhận tạo dịch vụ nếu đồng ý chi phí.
6. Chờ build/deploy thành công. Mở URL dạng `https://ten-dich-vu.onrender.com` được Render cấp.

File cấu hình có sẵn:

| Mục | Giá trị |
|---|---|
| Runtime | Node, phiên bản 24.19.0 |
| Build Command | `npm run check` |
| Start Command | `npm start` |
| Health Check | `/api/health` |
| HOST | `0.0.0.0` |
| NODE_ENV | `production` |
| COOKIE_SECURE | `1` |
| SEED_DEMO | `0` |
| DATA_DIR | `/var/data/smart-student` |
| Persistent Disk mount | `/var/data`, 1 GB |
| AI_PROVIDER | `gemini` |
| GEMINI_MODEL | `gemini-3.5-flash-lite` |
| GEMINI_API_KEY | Khóa mới, nhập trên Render |

Để Render tự cấp `PORT`. Không tải `.env` localhost lên Render. Không cần đặt `APP_ORIGIN` nếu dùng tên miền `onrender.com`: server đọc `RENDER_EXTERNAL_URL` do Render cung cấp. [Biến môi trường Render](https://render.com/docs/environment-variables).

Nếu tạo **Web Service** thủ công, nhập các giá trị trên và gắn disk trước khi sử dụng. Nếu repo vẫn bọc trong thư mục `smart-student`, đặt Root Directory là `smart-student`; Blueprint ở gốc sẽ thuận tiện hơn.

### Nếu Render báo `Production cần APP_ORIGIN HTTPS...`

Log `==> Running 'yarn start'` thường là bạn tạo Web Service thủ công, nên Render không áp dụng các biến trong Blueprint. Bản mã hiện tại đã tự lấy `RENDER_EXTERNAL_URL`, bind `0.0.0.0`, và mặc định `COOKIE_SECURE=1`, `SEED_DEMO=0` trong production. Hãy cập nhật mã mới nhất rồi redeploy.

Trong **Settings → Environment** của Render, kiểm tra và sửa các trường sau:

- Xóa `APP_ORIGIN` nếu đang là `http://127.0.0.1:3000`, `localhost`, URL Vercel hoặc tên miền ví dụ. Để trống để dùng URL HTTPS `onrender.com` Render cấp. Nếu đã có tên miền riêng trỏ thẳng đến Render, dùng URL HTTPS đó.
- Đặt `COOKIE_SECURE=1`.
- Đặt `SEED_DEMO=0` để không tạo nội dung demo trong cơ sở dữ liệu production.
- Đặt `NODE_ENV=production`.
- Đảm bảo `GEMINI_API_KEY` đã nhập trong Environment, không đặt trong mã nguồn.

Lưu thay đổi và chọn **Manual Deploy → Deploy latest commit**. Không dùng `SEED_DEMO=1` trên dữ liệu thật. Nếu deploy bằng Blueprint, kiểm tra đúng repository/branch và Blueprint gốc `render.yaml` đã cập nhật dịch vụ.

Nếu sau khi khởi động, `/api/health` trả 400 `Host không hợp lệ`, xem `APP_ORIGIN`: một biến cũ có thể đang ghi đè URL Render. Nếu ứng dụng mất dữ liệu sau redeploy, gắn Persistent Disk và đặt `DATA_DIR=/var/data/smart-student` trước khi nhập dữ liệu thật.

### Đăng nhập quản trị lần đầu

**Render Free (không có Shell, không có Persistent Disk):** trước khi deploy, vào **Environment** của dịch vụ và thêm hai biến bí mật:

| Key | Value |
|---|---|
| `ADMIN_EMAIL` | email quản trị bạn muốn dùng |
| `ADMIN_PASSWORD` | mật khẩu mạnh 12–128 ký tự, chỉ lưu ở Render và trình quản lý mật khẩu của bạn |

Mỗi lần cơ sở dữ liệu trống (lần đầu, sau redeploy/restart, hoặc sau khi dịch vụ Free ngủ 15 phút), máy chủ tạo lại quản trị viên này. Mật khẩu không được ghi ra log hay `initial-credentials.json`. Lưu ý: trên Free, `DATA_DIR` nằm trên ổ tạm (ví dụ `/tmp/smart-student`), nên tài khoản đăng ký, nội dung và xu **sẽ mất** khi dịch vụ ngủ/khởi động lại; chỉ dùng để demo. Đổi mật khẩu quản trị trong web cũng chỉ có hiệu lực đến lần khởi động lại tiếp theo.

**Gói trả phí có Shell + Persistent Disk:** nếu không đặt `ADMIN_PASSWORD`, production tạo một quản trị viên với mật khẩu ngẫu nhiên. Tài khoản demo trên máy cá nhân không được chuyển lên. Trong trang dịch vụ Render, mở **Shell** và chạy:

```sh
cat /var/data/smart-student/initial-credentials.json
```

Chỉ bạn đọc thông tin này trên Render. Đăng nhập web bằng tài khoản được ghi trong tệp, vào **Cài đặt → Đổi mật khẩu**. Sau khi đã đổi và lưu mật khẩu trong nơi riêng an toàn, xóa tệp khởi tạo tại đúng đường dẫn:

```sh
rm /var/data/smart-student/initial-credentials.json
```

Người học dùng Đăng ký để tạo tài khoản. Muốn cấp quyền giảng viên: người đó đăng ký trước, sau đó quản trị viên đổi vai trò ở mục Quản trị. Dữ liệu học liệu/nhóm/lịch mẫu của máy cá nhân không được mang sang; hãy thêm nội dung của bạn từ giao diện quản trị/giảng viên. Game dùng ngân hàng câu hỏi có sẵn trong mã nguồn.

## 5. Thêm Vercel

Chỉ làm phần này sau khi Render đã hoạt động. Vercel dùng khả năng chuyển tiếp đến máy chủ bên ngoài. [Tài liệu định tuyến Vercel](https://vercel.com/docs/routing/rewrites).

1. Sửa `deploy/vercel/vercel.json` trong repository. Thay `https://YOUR-SERVICE.onrender.com/$1` bằng URL Render thật, giữ nguyên `/$1`. Ví dụ:

   ```json
   "dest": "https://smart-student-abc.onrender.com/$1"
   ```

2. Commit thay đổi lên GitHub.
3. Trong [Vercel](https://vercel.com/new), chọn **Add New → Project**, import cùng repository.
4. Đặt **Root Directory = `deploy/vercel`**, **Framework Preset = Other**. Nếu repo có thư mục bọc, dùng `smart-student/deploy/vercel`.
5. Build Command và Install Command để trống; Output Directory là `public`. Cấu hình JSON đã khai báo sẵn. **Không chọn `public` của ứng dụng làm Root Directory**, và không chạy `npm start` trên Vercel.
6. Deploy. Vercel cấp tên miền production, ví dụ `https://smart-student-abc.vercel.app`.
7. Quay lại Render → Environment, thêm:

   ```env
   ADDITIONAL_ORIGINS=https://smart-student-abc.vercel.app
   ```

8. Save và deploy lại Render. Sau đó mở URL Vercel và đăng nhập.

Không đặt `GEMINI_API_KEY` trên Vercel: dự án Vercel này chỉ định tuyến. Cấu hình chuyển tiếp giữ yêu cầu API cùng tên miền với trình duyệt; không cần mở CORS `*` hay hạ cookie xuống `SameSite=None`. Cookie vẫn HttpOnly, Secure, SameSite=Strict. Phản hồi API có `Cache-Control: no-store`; cấu hình Vercel cũng tắt cache cho tuyến chuyển tiếp.

Chỉ thêm tên miền production hoặc tên miền riêng bạn kiểm soát, cách nhau bằng dấu phẩy khi có nhiều tên miền. Không dùng wildcard `*.vercel.app`. URL phải có `https://`, không có dấu `/` cuối. URL preview mỗi lần deploy sẽ bị từ chối thao tác nếu chưa được thêm chính xác; nên kiểm tra bằng tên miền production cố định.

Nếu gắn tên miền riêng, thêm tên miền đó vào `ADDITIONAL_ORIGINS` trên Render và cấu hình DNS theo bảng điều khiển dịch vụ đang phục vụ tên miền. Giữ nguyên URL Render làm đích proxy để tránh vòng lặp chuyển tiếp.

## 6. Kiểm tra sau khi deploy

1. Mở `/api/health` trên Render và Vercel: phải trả `{"ok":true}`.
2. Đăng nhập, tạo một công việc, tải lại: công việc vẫn còn.
3. Đăng xuất rồi đăng nhập: phiên hoạt động bình thường.
4. Gửi câu hỏi ở AI Học tập: câu trả lời ghi **Gemini · AI trực tuyến**. Nếu ghi “Đã tra cứu thư viện”, Gemini chưa trả lời thành công.
5. Đăng nhập tài khoản sinh viên: không được truy cập chức năng quản trị.
6. Sau một lần redeploy Render, kiểm tra công việc vẫn còn để xác nhận disk đã đúng.

Các bước công khai này chưa được thực hiện trong lần bàn giao vì chưa có dịch vụ/tên miền do bạn tạo. Bộ kiểm thử cục bộ đã xác minh allowlist Origin và chức năng Gemini; không thay thế kiểm tra thực tế qua hạ tầng hai nhà cung cấp.

## 7. Lỗi thường gặp và vận hành

| Hiện tượng | Cách xử lý |
|---|---|
| `Nguồn yêu cầu không được phép` | Kiểm tra tên miền đang mở đã nằm chính xác trong `ADDITIONAL_ORIGINS`; không có `/` cuối; deploy lại Render |
| `Host không hợp lệ` | Kiểm tra `APP_ORIGIN` không còn localhost; dùng mặc định Render; thêm đúng tên miền riêng nếu có |
| Gemini báo khóa/quyền/yêu cầu sai | Kiểm tra khóa, quyền Gemini API và tên mô hình; chạy `npm run check:ai` trong Render Shell |
| Gemini báo hết hạn mức | Xem quota/billing trên Google AI Studio; chờ hạn mức khôi phục hoặc đổi cấu hình phù hợp, không gửi liên tục |
| Vercel 502/404 hoặc hiện trang thiết lập | Kiểm tra URL `dest`, Root Directory, Render đang chạy và file cấu hình đã được deploy |
| Mất tài khoản sau redeploy | Kiểm tra disk mount `/var/data`, `DATA_DIR`; không dùng filesystem tạm |
| Node không hỗ trợ `node:sqlite` | Chọn Node.js 24, không dùng phiên bản Node cũ |
| HTTP 429 khi nhiều người đăng nhập | Giới hạn IP hiện dùng địa chỉ socket; proxy có thể làm nhiều người dùng chung nhóm giới hạn. Cần cấu hình nhận IP qua proxy tin cậy/rate limit ở biên trước khi mở cho lớp đông người; không tin tùy ý header do client gửi |

Sao lưu: chạy `node backup.mjs` trong Render Shell, dùng cùng `DATA_DIR`. Bản sao nằm trong `/var/data/smart-student/backups`. Hãy giữ thêm bản sao ở nơi độc lập và thử khôi phục trên môi trường thử nghiệm. Không dùng thao tác restore snapshot disk thay cho quy trình sao lưu/khôi phục SQLite đã kiểm tra.

Mã hiện dùng một tiến trình, SQLite và giới hạn tần suất trong RAM. Tích hợp Gemini và cấu hình deploy không tự hoàn thành các phần game nâng cao, điểm rèn luyện, email khôi phục hoặc kiểm thử tải trong báo cáo trước. Đây là cấu hình để chạy dự án hiện tại, chưa phải chứng nhận an toàn vận hành quy mô lớn.

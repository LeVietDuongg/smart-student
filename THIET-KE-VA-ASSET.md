# Thiết kế và hình minh họa

Hai ảnh đính kèm được dùng để tham chiếu bố cục, màu pastel, thẻ bo góc, menu trái và cấu trúc dashboard/game. Không sử dụng ảnh chụp làm toàn bộ website: nội dung và tương tác đều được dựng bằng HTML/CSS/JavaScript.

Các hình bitmap được tạo bằng imagegen tích hợp, sau đó sao chép vào `public/assets`. Chúng không phụ thuộc vào đường dẫn ảnh sinh ra ở nơi khác.

## Robot và banner: public/assets/hero.png

Prompt: “Production hero background for Vietnamese Smart Student university learning dashboard. A polished wide landscape 3D pastel illustration. An adorable glossy white rounded robot wearing a navy graduation cap with golden tassel sits at a wooden desk with laptop and stacked colorful textbooks on the right third of frame. Black glass face, cyan eyes and friendly smile. Soft turquoise blue sky, distant pastel university campus, greenery, clouds and tiny golden stars. Left half uncluttered pale blue for HTML title overlay. No text or watermark. Cyan, mint, pastel yellow and navy.”

## Bộ minh họa game: public/assets/game-atlas.png

Prompt: “A single production UI sprite atlas for Smart Student learning game cards. Exactly 4 columns × 2 rows, eight equally sized tiles, no gutters. Top row: golden trophy and question cards on peach; quiz flashcards and red clipboard on mint; jigsaw pieces and lightbulb on pink; stopwatch and flames on lavender. Bottom row: H O C crossword blocks on sky blue; daily calendar with green check on yellow; blue racing car with flag on peach; colorful textbooks on mint. Consistent polished friendly 3D clay educational style, soft shadows, small golden stars, no titles/buttons/watermarks.”

Giao diện sử dụng sprite bằng CSS; biểu tượng điều hướng là SVG nội bộ.

## Giao diện 1.1 (theme.css + scene3d.js)

- Lớp `public/theme.css` nạp sau `styles.css`, không đổi cấu trúc trang hay tên trường. Màu thương hiệu là xanh navy (mũ tốt nghiệp của robot), màu nhấn duy nhất là vàng tua mũ (xu, chuỗi ngày, tiến độ). Bo góc: 16px khung, 10px nút/ô nhập, 6px nhãn.
- Font Be Vietnam Pro (OFL), tự lưu trong `public/fonts`, chỉ gồm bộ ký tự Latin và tiếng Việt, 4 độ đậm.
- Hiệu ứng 3D dùng Three.js r180 (MIT) đặt trong `public/vendor/three` (kèm 2 addon `RoomEnvironment` và `RoundedBoxGeometry`, đã đổi đường dẫn import sang file cục bộ), không tải từ CDN nên CSP vẫn giữ `script-src 'self'`.
- `public/scene3d.js` dựng 3 cảnh bằng ánh sáng môi trường (IBL), bóng đổ mềm VSM trên sàn vô hình, vật liệu vật lý (clearcoat, sheen, kim loại) và hình bo tròn. Không dùng ảnh hay model tải ngoài: chữ trên gáy sách, mép giấy và hoa văn xu vẽ bằng canvas.
  - `campus` (đăng nhập): robot linh vật đội mũ tốt nghiệp, nhìn theo chuột, chớp mắt, quay đi và nhắm mắt khi ô mật khẩu đang được nhập, bấm vào thì xoay vòng vui vẻ. Trên điện thoại chỉ hiện robot.
  - `desk` (trang chủ): chồng sách có gáy chữ, mũ tốt nghiệp có tua rua, cốc cà phê bốc hơi, bút chì. Bấm vào mũ để tung mũ.
  - `arcade` (trang game): cúp vàng xoay trên bệ, chồng xu, một đồng xu đang quay, xúc xắc. Bấm xúc xắc để lăn, bấm cúp để xoay nhanh.
- Cảnh chỉ tải khi trang có `[data-scene]`, dừng khi khuất màn hình hoặc tab ẩn, đứng yên và tắt tương tác khi người dùng bật giảm chuyển động, tự giải phóng GPU khi chuyển trang. Máy không có WebGL hoặc gặp lỗi khi dựng cảnh sẽ hiện ảnh `hero.png` thay thế.
- Server nén gzip JS/CSS/SVG/HTML và cache 1 năm cho `/vendor/` và `/fonts/`.

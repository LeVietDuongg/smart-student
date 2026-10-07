# Thiết kế và hình minh họa

Hai ảnh đính kèm được dùng để tham chiếu bố cục, màu pastel, thẻ bo góc, menu trái và cấu trúc dashboard/game. Không sử dụng ảnh chụp làm toàn bộ website: nội dung và tương tác đều được dựng bằng HTML/CSS/JavaScript.

Các hình bitmap được tạo bằng imagegen tích hợp, sau đó sao chép vào `public/assets`. Chúng không phụ thuộc vào đường dẫn ảnh sinh ra ở nơi khác.

## Robot và banner: public/assets/hero.png

Prompt: “Production hero background for Vietnamese Smart Student university learning dashboard. A polished wide landscape 3D pastel illustration. An adorable glossy white rounded robot wearing a navy graduation cap with golden tassel sits at a wooden desk with laptop and stacked colorful textbooks on the right third of frame. Black glass face, cyan eyes and friendly smile. Soft turquoise blue sky, distant pastel university campus, greenery, clouds and tiny golden stars. Left half uncluttered pale blue for HTML title overlay. No text or watermark. Cyan, mint, pastel yellow and navy.”

## Bộ minh họa game: public/assets/game-atlas.png

Prompt: “A single production UI sprite atlas for Smart Student learning game cards. Exactly 4 columns × 2 rows, eight equally sized tiles, no gutters. Top row: golden trophy and question cards on peach; quiz flashcards and red clipboard on mint; jigsaw pieces and lightbulb on pink; stopwatch and flames on lavender. Bottom row: H O C crossword blocks on sky blue; daily calendar with green check on yellow; blue racing car with flag on peach; colorful textbooks on mint. Consistent polished friendly 3D clay educational style, soft shadows, small golden stars, no titles/buttons/watermarks.”

Giao diện sử dụng sprite bằng CSS; biểu tượng điều hướng là SVG nội bộ. Font dùng Segoe UI/Arial của máy, hỗ trợ tiếng Việt. Không có tài nguyên Google Fonts, CDN script hoặc tracker cần tải để dùng các chức năng cốt lõi.

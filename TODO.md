# TODO

- [x] Đọc `server/utils/chatbotEngine.mjs` và `server/utils/chatbotQueries.mjs` để xác định nhánh đang gọi Gemini trực tiếp cho câu phức tạp.
- [ ] Cập nhật `server/utils/chatbotQueries.mjs`: thêm helper nhận biết màu, query theo `variants.color`, và rule gợi ý size theo chiều cao + ưu tiên chọn size lớn hơn khi phân vân.
- [ ] Cập nhật `server/utils/chatbotEngine.mjs`: sửa nhánh `isComplexQuery` để pre-filter shortlist theo màu/loại/chiều cao; nếu có shortlist thì trả lời từ dữ liệu thật + nhắc size theo rule; nếu không có thì mới gọi Gemini.

- [ ] Test nhanh bằng các câu:
  - "Tìm áo màu xanh phù hợp người cao 1m7"
  - "Tìm giày ..." (case chỉ có size 37–41)
  - "Quần jean nam có những loại nào"
  - "Nike có những sản phẩm nào"
- [ ] Chạy lại server/lint (nếu có script) và xác nhận không lỗi build.


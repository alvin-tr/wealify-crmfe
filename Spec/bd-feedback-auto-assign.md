# Feedback Spec: Tính năng Auto-Assign (Round-Robin)

**Gửi team Business Development (BD),**

Đội kỹ thuật đã nhận và phân tích kỹ tài liệu Spec `crm-auto-assign-spec.md`. Về mặt luồng nghiệp vụ (Happy Path, Auto-Revoke SLA 30 ngày, và Duplicate Routing), hệ thống hoàn toàn có thể đáp ứng và sẽ được xử lý ngầm 100% dưới Backend `crm-server` đúng như định hướng của team. 

Tuy nhiên, đội kỹ thuật cần team BD clarify (làm rõ) thêm một số điểm mù (Blind Spots) sau để chốt phương án thiết kế Database trước khi tiến hành code:

## 1. Cần clarify: Nút "Bật ON nhận khách" của Sales
Trong Spec mục 2.2 có đề cập: *"lấy danh sách các bạn Sales đang bật nút ON (nhận khách) từ module Sales Users"*.
* Hệ thống hiện tại đang quản lý Sale bằng trạng thái làm việc chung (Status = `'active'`, `'inactive'`, `'on_leave'`).
* **Câu hỏi cho BD:** 
  Nút "ON" này có đồng nghĩa với việc Sale đang đi làm (`status = 'active'`) không? HAY team BD muốn hệ thống sinh thêm **một nút Toggle độc lập (Bật/Tắt nhận khách)** cho từng Sale (ví dụ: Sale vẫn đang active đi làm, nhưng hôm nay quá tải xin sếp tắt nút nhận khách để không bị chia Round-Robin)? 
  *Nếu là nút Toggle độc lập, chúng ta sẽ cần phải thiết kế thêm 1 nút bấm UI trên giao diện quản lý Sales để Admin có thể gạt Bật/Tắt.*

## 2. Xác nhận lại: Các tác động Giao diện (UI)
Để đảm bảo đúng tiêu chí "Không làm phát sinh UI mới", kỹ thuật xin chốt lại các luồng giao diện với team BD:
1. **Thông báo (Notification):** Khi khách được chia thành công, Frontend sẽ dùng tính năng System Notification có sẵn (Pusher WebSocket) để đẩy 1 pop-up Toast ngay góc màn hình cho Sale đó. Không cần vẽ thêm chuông báo mới.
2. **Manual Assign (Admin Override):** Khi Admin tạo khách hàng bằng tay, Form tạo sẽ hiển thị ô chọn `Sales Phụ Trách` là Optional (Không bắt buộc). Nếu Admin chọn, khách về thẳng Sale đó. Nếu Admin để trống, hệ thống tự động kích hoạt vòng xoay Round-Robin.

Anh em team BD kiểm tra lại điểm số 1 giúp kỹ thuật để chốt cấu trúc Database nhé. Xin cảm ơn!

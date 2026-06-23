# 🏥 WebAdminClinic - Clinic Management Portal

Đây là trang **Admin Portal** (Hệ thống quản trị) được xây dựng để phục vụ việc quản lý dữ liệu và vận hành cho một hệ sinh thái ứng dụng Y tế/Phòng khám lớn hơn. Dự án này đóng vai trò là "bộ não" thao tác dữ liệu, nơi các Quản trị viên (Admins) và Bác sĩ có thể tương tác, điều phối và phân tích toàn bộ hoạt động của phòng khám.

## 🌟 Vai trò & Điểm nhấn Kỹ thuật

Vì phục vụ cho một hệ thống lớn, WebAdminClinic tập trung xử lý các **logic nghiệp vụ (business logic) phức tạp** thay vì chỉ đơn thuần là các trang quản lý CRUD (Create, Read, Update, Delete) cơ bản. Các tính năng nổi bật có thể kể đến:

- 📅 **Quản lý lịch trực thông minh (Smart Scheduling)**: Sử dụng `react-big-calendar` để xây dựng giao diện quản lý ca trực trực quan. Tích hợp thuật toán tự động gợi ý phòng trống không trùng lặp (collision detection) và tính năng xếp lịch hàng loạt cho nhiều bác sĩ.
- 📊 **Dashboard & Thống kê**: Trực quan hóa số liệu hoạt động, doanh thu, lượt khám bệnh theo thời gian thực thông qua các biểu đồ (`recharts`).
- 👥 **Phân quyền chặt chẽ (RBAC)**: Hệ thống quản lý quyền truy cập đa tầng (Super Admin, Hospital Admin, Doctor) dựa trên JWT Token.
- 📝 **Quản lý Nội dung/Cẩm nang Y tế**: Tích hợp Rich Text Editor (`react-quill-new`) cho phép admin biên tập bài viết, tin tức y tế chuyên sâu gửi tới ứng dụng người dùng.
- ⚡ **Tối ưu Hiệu suất**: Áp dụng các React Hooks nâng cao (`useMemo`, `useCallback`) để xử lý hiệu quả lượng dữ liệu lớn (danh sách bác sĩ, phòng ban, lịch hẹn) mà không gây giật lag (re-render) trên UI.

## 🛠️ Công nghệ sử dụng (Tech Stack)

Dự án được xây dựng với các công nghệ Front-end hiện đại nhất:

- **Core Framework**: React 19, Vite (cho tốc độ build & HMR cực nhanh)
- **Styling**: Tailwind CSS v4, Lucide React, React Icons
- **Routing**: React Router DOM (v7)
- **Data Management**: `@tanstack/react-query`, React Context API
- **Advanced UI/Components**: 
  - `react-big-calendar` & `date-fns` (Xử lý lịch trình & Localize tiếng Việt)
  - `recharts` (Vẽ biểu đồ Dashboard)
  - `react-quill-new` (Soạn thảo văn bản WYSIWYG)
  - `sonner` (Hệ thống Toast Notification mượt mà)

## 🚀 Hướng dẫn chạy dự án cục bộ

Nếu bạn muốn chạy thử dự án này trên máy cá nhân:

1. Clone repository về máy.
2. Cài đặt các gói phụ thuộc (dependencies):
   ```bash
   npm install
   ```
3. Cấu hình biến môi trường `.env` (nếu có, để trỏ URL về Backend API).
4. Khởi động môi trường phát triển:
   ```bash
   npm run dev
   ```

---
*Dự án này là một minh chứng trong portfolio của tôi về khả năng xây dựng các hệ thống quản trị chuyên nghiệp (Back-office System) và khả năng xử lý các bài toán Front-end logic phức tạp.*

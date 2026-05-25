# Biểu đồ thiết kế hệ thống

Dựa trên thông tin phân tích yêu cầu từ dự án (gồm 2 phần `Schedule-a-medical-examination` và `web-admin`), dưới đây là các biểu đồ Use Case, Activity và Sequence được mô phỏng bằng ngôn ngữ Mermaid để tích hợp thẳng vào file Markdown.

## 3.5. Biểu đồ Use Case (Use Case Diagram)

Biểu đồ dưới đây thể hiện các chức năng của hệ thống đối với từng nhóm đối tượng người dùng (Bệnh nhân, Bác sĩ, Admin Bệnh viện, Admin Hệ thống).

```mermaid
flowchart LR
    %% Khai báo các Tác nhân (Actors)
    Patient(("👨‍💼 Bệnh nhân"))
    Doctor(("🩺 Bác sĩ"))
    HospitalAdmin(("🏥 Admin Bệnh viện"))
    SystemAdmin(("⚙️ Admin Hệ thống"))

    %% Khai báo Hệ thống
    subgraph System ["Hệ thống Đặt lịch khám"]
        %% Use cases của Bệnh nhân
        UC1([Đăng ký])
        UC2([Đăng nhập])
        UC3([Xem bệnh viện])
        UC4([Xem bác sĩ])
        UC5([Đặt lịch khám])
        UC6([Xem lịch hẹn])
        UC7([Xem tin tức])
        UC8([Xem bài đăng])
        UC9([Thích bài viết])
        UC10([Bình luận])
        UC11([Chia sẻ])
        UC12([Đánh giá])
        
        %% Use cases của Bác sĩ (và Admin)
        UC13([Quản lý lịch làm việc])
        UC14([Quản lý lịch hẹn])
        
        %% Use cases của Admin Bệnh viện
        UC15([Quản lý bác sĩ])
        UC16([Quản lý banner])
        UC17([Quản lý tin tức])
        UC18([Quản lý bài đăng])
        UC19([Quản lý thanh toán])
        
        %% Use cases của Admin Hệ thống
        UC20([Quản lý bệnh viện])
        UC21([Quản lý chuyên khoa])
        UC22([Quản lý người dùng])
        UC23([Cấu hình hệ thống])
    end

    %% Mapping Tác nhân tới Use case
    Patient --- UC1
    Patient --- UC2
    Patient --- UC3
    Patient --- UC4
    Patient --- UC5
    Patient --- UC6
    Patient --- UC7
    Patient --- UC8
    Patient --- UC9
    Patient --- UC10
    Patient --- UC11
    Patient --- UC12

    Doctor --- UC2
    Doctor --- UC13
    Doctor --- UC14

    HospitalAdmin --- UC15
    HospitalAdmin --- UC13
    HospitalAdmin --- UC14
    HospitalAdmin --- UC16
    HospitalAdmin --- UC17
    HospitalAdmin --- UC18
    HospitalAdmin --- UC19

    SystemAdmin --- UC20
    SystemAdmin --- UC21
    SystemAdmin --- UC22
    SystemAdmin --- UC23
```

## 3.6. Biểu đồ Activity (Activity Diagram)

Mô tả luồng xử lý nghiệp vụ **Đặt lịch khám bệnh**.

```mermaid
flowchart TD
    Start([Bắt đầu]) --> Step1[Đăng nhập]
    Step1 --> Step2[Chọn bệnh viện]
    Step2 --> Step3[Chọn chuyên khoa hoặc bác sĩ]
    Step3 --> Step4[Chọn ngày khám]
    Step4 --> Step5[Chọn lịch làm việc còn trống]
    Step5 --> Step6[Gửi yêu cầu đặt lịch]
    
    Step6 --> Backend[Backend tiếp nhận yêu cầu]
    Backend --> Check1{Kiểm tra Token}
    
    Check1 -- "Hợp lệ" --> Check2{Kiểm tra thông tin\nlịch làm việc}
    Check1 -- "Không hợp lệ" --> Error[Trả về thông báo lỗi]
    
    Check2 -- "Hợp lệ" --> Check3{Kiểm tra số lượng\nbệnh nhân trong khung giờ}
    Check2 -- "Không hợp lệ" --> Error
    
    Check3 -- "Còn chỗ trống" --> Create[Tạo bản ghi Appointment]
    Check3 -- "Đã đầy" --> Error
    
    Create --> Success[Frontend hiển thị thành công]
    Error --> ShowError[Frontend hiển thị lỗi cho người dùng]
    
    Success --> End([Kết thúc])
    ShowError --> End
```

## 3.7. Biểu đồ Sequence (Sequence Diagram)

### 3.7.1. Chức năng Upload Banner

Mô tả thứ tự tương tác khi Frontend Admin upload banner lên hệ thống (qua Cloudinary) và lưu vào cơ sở dữ liệu.

```mermaid
sequenceDiagram
    autonumber
    actor FrontendAdmin as Frontend Admin
    participant BannerController as BannerController
    participant FileInterceptor as FileInterceptor
    participant CloudinaryService as CloudinaryService
    participant Cloudinary as Cloudinary API
    participant BannerService as BannerService
    participant Repository as TypeORM Repository (MySQL)

    %% Phase 1: Upload file
    FrontendAdmin->>BannerController: Gửi request multipart/form-data (API upload)
    BannerController->>FileInterceptor: Chuyển tiếp file
    FileInterceptor->>CloudinaryService: Gọi upload ảnh
    CloudinaryService->>Cloudinary: Upload lên Cloudinary
    Cloudinary-->>CloudinaryService: Trả về secure_url và public_id
    CloudinaryService-->>BannerController: Trả dữ liệu ảnh
    BannerController-->>FrontendAdmin: Trả về image_url và image_public_id

    %% Phase 2: Create banner
    FrontendAdmin->>BannerController: Gửi request tạo banner
    BannerController->>BannerService: Gọi service tạo banner
    BannerService->>Repository: Kiểm tra dữ liệu & Lưu bản ghi
    Repository-->>BannerService: Kết quả lưu database
    BannerService-->>BannerController: Kết quả tạo thành công
    BannerController-->>FrontendAdmin: Trả kết quả cập nhật danh sách
```

### 3.7.2. Chức năng Đặt lịch khám

Mô tả trình tự tương tác giữa bệnh nhân, API và hệ thống cơ sở dữ liệu khi thực hiện đặt lịch hẹn.

```mermaid
sequenceDiagram
    autonumber
    actor PatientUI as Patient UI
    participant AppointmentController as AppointmentController
    participant AppointmentService as AppointmentService
    participant AppointmentRepository as AppointmentRepository

    PatientUI->>AppointmentController: Gửi request yêu cầu đặt lịch
    AppointmentController->>AppointmentService: Chuyển tiếp dữ liệu đặt lịch
    AppointmentService->>AppointmentService: Kiểm tra token & thông tin lịch làm việc
    AppointmentService->>AppointmentService: Kiểm tra số lượng bệnh nhân hiện tại
    
    alt Số lượng cho phép & Dữ liệu hợp lệ
        AppointmentService->>AppointmentRepository: Lưu thông tin lịch hẹn (Appointment)
        AppointmentRepository-->>AppointmentService: Trả kết quả tạo bản ghi
        AppointmentService-->>AppointmentController: Dữ liệu lịch hẹn mới
        AppointmentController-->>PatientUI: Thông báo thành công và trả về data
    else Lịch đã đầy hoặc Dữ liệu không hợp lệ
        AppointmentService-->>AppointmentController: Báo lỗi (VD: Lịch đầy/Sai thông tin)
        AppointmentController-->>PatientUI: Trả về thông báo lỗi cho người dùng
    end
```

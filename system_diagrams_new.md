# Biểu đồ thiết kế hệ thống

Dựa trên thông tin phân tích yêu cầu từ dự án, dưới đây là các biểu đồ Use Case, Activity và Sequence đã được mở rộng và tối ưu (dàn ngang) để hỗ trợ việc hiển thị và chụp ảnh rõ nét hơn.

## 3.5. Biểu đồ Use Case (Use Case Diagram)

```mermaid
flowchart LR
    %% Khai báo các Tác nhân (Actors)
    Patient(("👨‍💼 Bệnh nhân"))
    Doctor(("🩺 Bác sĩ"))
    HospitalAdmin(("🏥 Admin Bệnh viện"))
    SystemAdmin(("⚙️ Admin Hệ thống"))

    %% Khai báo Hệ thống
    subgraph System ["Hệ thống Đặt lịch khám"]
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
        
        UC13([Quản lý lịch làm việc])
        UC14([Quản lý lịch hẹn])
        
        UC15([Quản lý bác sĩ])
        UC16([Quản lý banner])
        UC17([Quản lý tin tức])
        UC18([Quản lý bài đăng])
        UC19([Quản lý thanh toán])
        
        UC20([Quản lý bệnh viện])
        UC21([Quản lý chuyên khoa])
        UC22([Quản lý người dùng])
        UC23([Cấu hình hệ thống])
    end

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

*Các biểu đồ đã được đổi hướng sang Left-to-Right (trải dài theo bề ngang) để tối ưu không gian hiển thị và chụp ảnh.*

### 3.6.1. Luồng đặt lịch khám bệnh (Bệnh nhân)
```mermaid
flowchart LR
    Start([Bắt đầu]) --> Step1[Đăng nhập]
    Step1 --> Step2[Chọn bệnh viện]
    Step2 --> Step3[Chọn chuyên khoa/bác sĩ]
    Step3 --> Step4[Chọn ngày & giờ khám]
    Step4 --> Step5[Gửi yêu cầu đặt lịch]
    
    Step5 --> Check1{Kiểm tra\nToken}
    
    Check1 -- "Hợp lệ" --> Check2{Kiểm tra\nlịch làm việc}
    Check1 -- "Không hợp lệ" --> Error[Trả về\nthông báo lỗi]
    
    Check2 -- "Hợp lệ" --> Check3{Kiểm tra\nsố lượng}
    Check2 -- "Lỗi lịch" --> Error
    
    Check3 -- "Còn chỗ" --> Create[Tạo bản ghi\nAppointment]
    Check3 -- "Đã đầy" --> Error
    
    Create --> Success[Frontend hiển thị\nthành công]
    Error --> ShowError[Frontend hiển thị\nlỗi cho người dùng]
    
    Success --> End([Kết thúc])
    ShowError --> End
```

### 3.6.2. Luồng tạo lịch làm việc (Bác sĩ/Admin)
```mermaid
flowchart LR
    Start([Bắt đầu]) --> Login[Đăng nhập]
    Login --> SelectMenu[Vào Quản lý\nlịch làm việc]
    SelectMenu --> ChooseDate[Chọn Ngày & Giờ]
    ChooseDate --> Submit[Gửi yêu cầu\ntạo lịch]
    
    Submit --> CheckValid{Dữ liệu\nhợp lệ?}
    CheckValid -- "Không" --> Error[Báo lỗi thiếu\nthông tin]
    CheckValid -- "Có" --> CheckConflict{Kiểm tra\ntrùng lịch}
    
    CheckConflict -- "Trùng" --> Error
    CheckConflict -- "Không trùng" --> SaveDB[Lưu bản ghi\nSchedule vào DB]
    
    SaveDB --> Success[Hiển thị\nthành công]
    Error --> ShowError[Hiển thị\nlỗi UI]
    
    Success --> End([Kết thúc])
    ShowError --> End
```

## 3.7. Biểu đồ Sequence (Sequence Diagram)

*(Tôi đã thêm các không gian đệm ở cuối biểu đồ để cụm nút công cụ zoom không che mất nội dung)*

### 3.7.1. Chức năng Đăng nhập (Authentication)
```mermaid
sequenceDiagram
    autonumber
    actor User as Bệnh nhân/Bác sĩ
    participant AuthController
    participant AuthService
    participant UserRepository as User Repository

    User->>AuthController: Gửi email & password
    AuthController->>AuthService: Chuyển dữ liệu đăng nhập
    AuthService->>UserRepository: Tìm user theo email
    UserRepository-->>AuthService: Trả về thông tin user (kèm mật khẩu băm)
    
    alt User tồn tại
        AuthService->>AuthService: So sánh mật khẩu (Bcrypt)
        alt Mật khẩu đúng
            AuthService->>AuthService: Tạo Access Token & Refresh Token
            AuthService-->>AuthController: Trả về Tokens & User Info
            AuthController-->>User: Đăng nhập thành công, lưu Token
        else Mật khẩu sai
            AuthService-->>AuthController: Lỗi (Sai mật khẩu)
            AuthController-->>User: Hiển thị thông báo lỗi
        end
    else User không tồn tại
        AuthService-->>AuthController: Lỗi (Không tìm thấy user)
        AuthController-->>User: Hiển thị thông báo lỗi
    end
    
    %% Tạo khoảng trắng để tránh bị che bởi cụm nút extension
    Note over User, UserRepository: <br/><br/><br/><br/>
```

### 3.7.2. Chức năng Quản lý lịch làm việc (Tạo ca làm việc)
```mermaid
sequenceDiagram
    autonumber
    actor Doctor as Bác sĩ
    participant ScheduleController
    participant ScheduleService
    participant ScheduleRepo as ScheduleRepository

    Doctor->>ScheduleController: Gửi data thời gian làm việc
    ScheduleController->>ScheduleService: Yêu cầu tạo lịch
    ScheduleService->>ScheduleRepo: Tìm kiếm lịch trùng lặp
    ScheduleRepo-->>ScheduleService: Kết quả tìm kiếm
    
    alt Không trùng lặp
        ScheduleService->>ScheduleRepo: Tạo bản ghi Schedule mới
        ScheduleRepo-->>ScheduleService: Kết quả lưu
        ScheduleService-->>ScheduleController: Dữ liệu lịch làm việc mới
        ScheduleController-->>Doctor: Cập nhật danh sách lịch
    else Bị trùng lặp thời gian
        ScheduleService-->>ScheduleController: Báo lỗi trùng lịch
        ScheduleController-->>Doctor: Hiển thị thông báo lỗi
    end
    
    %% Tạo khoảng trắng để tránh bị che bởi cụm nút extension
    Note over Doctor, ScheduleRepo: <br/><br/><br/><br/>
```

### 3.7.3. Chức năng Đặt lịch khám
```mermaid
sequenceDiagram
    autonumber
    actor Patient as Bệnh nhân
    participant ApptController as AppointmentController
    participant ApptService as AppointmentService
    participant ApptRepo as AppointmentRepository

    Patient->>ApptController: Gửi request yêu cầu đặt lịch
    ApptController->>ApptService: Chuyển tiếp dữ liệu đặt lịch
    ApptService->>ApptService: Kiểm tra token & thông tin lịch làm việc
    ApptService->>ApptService: Kiểm tra số lượng bệnh nhân hiện tại
    
    alt Số lượng cho phép & Dữ liệu hợp lệ
        ApptService->>ApptRepo: Lưu thông tin lịch hẹn (Appointment)
        ApptRepo-->>ApptService: Trả kết quả tạo bản ghi
        ApptService-->>ApptController: Dữ liệu lịch hẹn mới
        ApptController-->>Patient: Thông báo thành công và trả về data
    else Lịch đã đầy hoặc Dữ liệu không hợp lệ
        ApptService-->>ApptController: Báo lỗi (VD: Lịch đầy/Sai thông tin)
        ApptController-->>Patient: Trả về thông báo lỗi cho người dùng
    end
    
    %% Tạo khoảng trắng để tránh bị che bởi cụm nút extension
    Note over Patient, ApptRepo: <br/><br/><br/><br/>
```

### 3.7.4. Chức năng Upload Banner
```mermaid
sequenceDiagram
    autonumber
    actor Admin as Frontend Admin
    participant BannerController
    participant CloudinaryService
    participant Cloudinary as Cloudinary API
    participant BannerService
    participant BannerRepo as BannerRepository

    %% Phase 1: Upload file
    Admin->>BannerController: Gửi request multipart/form-data (API upload)
    BannerController->>CloudinaryService: Gọi upload ảnh
    CloudinaryService->>Cloudinary: Upload lên Cloudinary
    Cloudinary-->>CloudinaryService: Trả về secure_url và public_id
    CloudinaryService-->>BannerController: Trả dữ liệu ảnh
    BannerController-->>Admin: Trả về image_url và image_public_id

    %% Phase 2: Create banner
    Admin->>BannerController: Gửi request tạo banner
    BannerController->>BannerService: Gọi service tạo banner
    BannerService->>BannerRepo: Kiểm tra dữ liệu & Lưu bản ghi
    BannerRepo-->>BannerService: Kết quả lưu database
    BannerService-->>BannerController: Kết quả tạo thành công
    BannerController-->>Admin: Trả kết quả cập nhật danh sách
    
    %% Tạo khoảng trắng để tránh bị che bởi cụm nút extension
    Note over Admin, BannerRepo: <br/><br/><br/><br/>
```

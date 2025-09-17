CREATE DATABASE IF NOT EXISTS Notification_Service;
USE Notification_Service;

-- Bảng Notification chung cho customer, brand và all
CREATE TABLE Notification (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- ngày tạo
    started_at DATETIME NOT NULL,                          -- ngày bắt đầu
    end_at DATETIME NULL,                                  -- ngày kết thúc (có thể null)
    status BIT NOT NULL DEFAULT 1,                         -- 1 = bật, 0 = tắt
    is_read BIT NOT NULL DEFAULT 0,                        -- 0 = chưa đọc, 1 = đã đọc
    type ENUM('marketing','system') DEFAULT 'marketing',   -- loại thông báo
    target_type ENUM('customer','brand','all') DEFAULT 'customer', -- đối tượng nhận
    target_id INT NULL,                                    -- id cụ thể (brand_id, customer_id)
    CONSTRAINT chk_date_range CHECK (end_at IS NULL OR started_at <= end_at)
);

-- Dữ liệu mẫu
INSERT INTO Notification 
(title, message, started_at, end_at, status, is_read, type, target_type, target_id) VALUES

-- Customer marketing
('Khuyến mãi đặc biệt', 'Nhận ngay 20% điểm thưởng cho đơn hàng đầu tiên!', 
 '2025-04-21 10:00:00', '2025-05-21 10:00:00', 1, 0, 'marketing', 'customer', NULL),

('Giảm giá mùa hè', 'Giảm giá 30% cho tất cả sản phẩm trong tháng 6!', 
 '2025-04-22 11:00:00', '2025-06-30 11:00:00', 1, 0, 'marketing', 'customer', NULL),

('Chương trình tích điểm', 'Tích lũy điểm thưởng cho mỗi giao dịch!', 
 '2025-04-23 12:00:00', NULL, 1, 0, 'marketing', 'customer', NULL),

-- Brand marketing
('Ưu đãi cho brand', 'Mall giảm 10% phí dịch vụ trong tháng này!', 
 '2025-04-24 09:00:00', '2025-05-24 09:00:00', 1, 0, 'marketing', 'brand', NULL),

-- Brand system
('Hợp đồng sắp hết hạn', 'Hợp đồng của bạn sẽ hết hạn trong 30 ngày tới!', 
 '2025-04-25 09:00:00', '2025-05-25 09:00:00', 1, 0, 'system', 'brand', 1),

-- All users
('Bảo trì hệ thống', 'Hệ thống sẽ bảo trì từ 0h đến 2h ngày 20/09/2025', 
 '2025-09-10 09:00:00', '2025-09-20 02:00:00', 1, 0, 'system', 'all', NULL);

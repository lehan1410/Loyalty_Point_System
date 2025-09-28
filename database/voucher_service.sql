create database Voucher_Service;
use Voucher_Service;
CREATE TABLE Voucher 
(
  voucher_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255),
  description TEXT,
  points_required INT,
  discount_amount DECIMAL(10,2),
  created_at DEFAULT CURRENT_TIMESTAMP,
  start_at DATETIME,
  end_at DATETIME,
  approval_comment TEXT,
  stock INT DEFAULT 0,
  initial_stock INT DEFAULT 100

);

CREATE TABLE Voucher_Redemption (
  redemption_id INT AUTO_INCREMENT PRIMARY KEY,
  voucher_id INT,
  user_id INT,
  points_spent INT,
  redeemed_at DATETIME,
  redemption_code VARCHAR(100),
  user_snapshot VARCHAR(200),
  status ENUM('Chưa sử dụng', 'Đã sử dụng', 'Hết hạn') DEFAULT 'Chưa sử dụng',
  used_at DATETIME,
  FOREIGN KEY (voucher_id) REFERENCES Voucher(voucher_id)
);


ALTER TABLE Voucher
ADD COLUMN usage_instructions TEXT;
UPDATE Voucher
SET usage_instructions = CASE
    WHEN voucher_id = 1 THEN 'Sử dụng mã tại quầy thanh toán để nhận giảm giá 20%.'
    WHEN voucher_id = 3 THEN 'Đổi phiếu tại quầy KFC trong trung tâm thương mại.'
    WHEN voucher_id = 4 THEN 'Sử dụng mã để nhận voucher giảm giá tại quầy.'
    WHEN voucher_id = 5 THEN 'Đổi điểm để nhận quà tại quầy dịch vụ.'
END;

INSERT INTO Voucher (title, description, points_required, discount_amount, created_at, start_at, end_at, approval_comment, stock, initial_stock, usage_instructions)
VALUES
('Voucher Giảm Giá 20%', 'Giảm giá 20% cho hóa đơn từ 200K', 500, 40.00, NOW(), NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 'Được phê duyệt bởi Quản lý Chiến dịch', 100, 100, 'Sử dụng mã tại quầy thanh toán để nhận giảm giá 20%.'),
('Voucher Giảm Giá 50K', 'Giảm giá 50K cho hóa đơn từ 300K', 700, 50.00, NOW(), NOW(), DATE_ADD(NOW(), INTERVAL 60 DAY), 'Được phê duyệt bởi Quản lý Chiến dịch', 50, 50, 'Sử dụng mã tại quầy thanh toán để nhận giảm giá 50K.'),
('Phiếu Đổi Gà Rán', 'Đổi phiếu lấy 1 phần gà rán tại KFC', 400, 0.00, NOW(), NOW(), DATE_ADD(NOW(), INTERVAL 45 DAY), 'Được phê duyệt bởi Quản lý Chiến dịch', 200, 200, 'Đổi phiếu tại quầy KFC trong trung tâm thương mại.'),
('Voucher Sinh Nhật', 'Voucher 100K mừng sinh nhật khách hàng', 800, 100.00, NOW(), NOW(), DATE_ADD(NOW(), INTERVAL 20 DAY), 'Được phê duyệt bởi Quản lý Chiến dịch', 80, 80, 'Sử dụng mã để nhận voucher giảm giá tại quầy.'),
('Đổi Quà Tặng', 'Đổi điểm lấy quà tặng hấp dẫn', 300, 0.00, NOW(), NOW(), DATE_ADD(NOW(), INTERVAL 90 DAY), 'Được phê duyệt bởi Quản lý Chiến dịch', 150, 150, 'Đổi điểm để nhận quà tại quầy dịch vụ.');
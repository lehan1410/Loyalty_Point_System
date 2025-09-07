create database Voucher_Service;
use Voucher_Service;
CREATE TABLE Voucher 
(
  voucher_id INT AUTO_INCREMENT PRIMARY KEY,
  brand_id INT,
  title VARCHAR(255),
  description TEXT,
  points_required INT,
  discount_amount DECIMAL(10,2),
  created_at DATETIME,
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
  user_snapshot VARCHAR(200)
);

ALTER TABLE Voucher_Redemption
ADD COLUMN status ENUM('Chưa sử dụng', 'Đã sử dụng', 'Hết hạn') DEFAULT 'Chưa sử dụng';

ALTER TABLE Voucher
ADD COLUMN usage_instructions TEXT;
UPDATE Voucher
SET usage_instructions = CASE
    WHEN voucher_id = 1 THEN 'Sử dụng mã tại quầy thanh toán để nhận giảm giá 20%.'
    WHEN voucher_id = 3 THEN 'Đổi phiếu tại quầy KFC trong trung tâm thương mại.'
    WHEN voucher_id = 4 THEN 'Sử dụng mã để nhận voucher giảm giá tại quầy.'
    WHEN voucher_id = 5 THEN 'Đổi điểm để nhận quà tại quầy dịch vụ.'
END;

ALTER TABLE Voucher_Redemption ADD COLUMN used_at DATETIME;
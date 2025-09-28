-- create database Campaign_Service;
-- use Campaign_Service;

CREATE TABLE Campaign
(
  campaign_id INT NOT NULL AUTO_INCREMENT,
  brand_id VARCHAR(50) NOT NULL,
  title VARCHAR(100) NOT NULL,
  description VARCHAR(200) NOT NULL,
  points_required INT NOT NULL,
  reward VARCHAR(50) NOT NULL,
  created_at datetime NOT NULL,
  start_at datetime NOT NULL,
  end_at datetime NOT NULL,
  status VARCHAR(50) NOT NULL,
  redemption_code VARCHAR(6) NULL,
  PRIMARY KEY (campaign_id)
);

CREATE TABLE Campaign_Redemption
(
  campaign_redemption_id INT NOT NULL AUTO_INCREMENT,
  campaign_id INT NOT NULL,
  user_id INT NOT NULL,
  points_spent INT NOT NULL,
  redeemed_at datetime NOT NULL,
  PRIMARY KEY (campaign_redemption_id),
  FOREIGN KEY (campaign_id) REFERENCES Campaign(campaign_id)
);

INSERT INTO Campaign (brand_id, title, description, points_required, reward, created_at, start_at, end_at, status, redemption_code)
VALUES
('1', 'Chiến dịch Mùa Hè', 'Ưu đãi giảm giá mùa hè', 500, 'Discount 20%', NOW(), NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 'Đang hoạt động', 'A1B2C3'),
('1', 'Chiến dịch Noel', 'Quà tặng Giáng sinh cho khách hàng', 700, 'Voucher 100K', NOW(), NOW(), DATE_ADD(NOW(), INTERVAL 60 DAY), 'Đang hoạt động', 'D4E5F6'),
('1', 'Back to School', 'Ưu đãi mùa tựu trường', 400, 'Discount 15%', NOW(), NOW(), DATE_ADD(NOW(), INTERVAL 45 DAY), 'Sắp bắt đầu', 'G7H8I9'),
('1', 'Mừng Sinh Nhật', 'Voucher mừng sinh nhật khách hàng', 800, 'Voucher 200K', NOW(), NOW(), DATE_ADD(NOW(), INTERVAL 20 DAY), 'Đang hoạt động', 'J1K2L3'),
('1', 'Tích điểm đổi quà', 'Tích điểm đổi quà hấp dẫn', 300, 'Tích điểm', NOW(), NOW(), DATE_ADD(NOW(), INTERVAL 90 DAY), 'Đang hoạt động', 'M4N5O6'),
('1', 'Flash Sale 11.11', 'Giảm giá trong ngày siêu sale', 200, 'Discount 30%', NOW(), NOW(), DATE_ADD(NOW(), INTERVAL 1 DAY), 'Kết thúc', 'P7Q8R9'),
('1', 'Khách VIP ưu đãi', 'Ưu đãi đặc biệt cho khách VIP', 1000, 'Voucher 500K', NOW(), NOW(), DATE_ADD(NOW(), INTERVAL 15 DAY), 'Đang hoạt động', 'S1T2U3'),
('1', 'Cuối năm rộn ràng', 'Quà tặng cuối năm ấm áp', 600, 'Discount 10%', NOW(), NOW(), DATE_ADD(NOW(), INTERVAL 40 DAY), 'Đang hoạt động', 'V4W5X6'),
('1', 'Black Friday', 'Siêu ưu đãi Black Friday', 500, 'Discount 50%', NOW(), NOW(), DATE_ADD(NOW(), INTERVAL 2 DAY), 'Kết thúc', 'Y7Z8A9'),
('1', 'Tết Nguyên Đán', 'Ưu đãi mừng Tết', 900, 'Voucher 300K', NOW(), NOW(), DATE_ADD(NOW(), INTERVAL 70 DAY), 'Sắp bắt đầu', 'B1C2D3');

ALTER TABLE Campaign_Redemption
ADD COLUMN status ENUM('Chưa sử dụng', 'Đã sử dụng', 'Hết hạn') DEFAULT 'Chưa sử dụng';

ALTER TABLE Campaign
ADD COLUMN campaign_cost DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN brand_ratio DECIMAL(5, 2) NOT NULL DEFAULT 50.00 CHECK (brand_ratio >= 0 AND brand_ratio <= 100),
ADD COLUMN mall_ratio DECIMAL(5, 2) NOT NULL DEFAULT 50.00 CHECK (mall_ratio >= 0 AND mall_ratio <= 100),
ADD CONSTRAINT ratio_sum CHECK (brand_ratio + mall_ratio = 100);

UPDATE Campaign
SET 
    campaign_cost = CASE
        WHEN campaign_id = 1 THEN 50000000  -- Chiến dịch Mùa Hè
        WHEN campaign_id = 2 THEN 70000000  -- Chiến dịch Noel
        WHEN campaign_id = 3 THEN 40000000  -- Back to School
        WHEN campaign_id = 4 THEN 80000000  -- Mừng Sinh Nhật
        WHEN campaign_id = 5 THEN 30000000  -- Tích điểm đổi quà
        WHEN campaign_id = 6 THEN 20000000  -- Flash Sale 11.11
        WHEN campaign_id = 7 THEN 100000000 -- Khách VIP ưu đãi
        WHEN campaign_id = 8 THEN 60000000  -- Cuối năm rộn ràng
        WHEN campaign_id = 9 THEN 50000000  -- Black Friday
        WHEN campaign_id = 10 THEN 90000000 -- Tết Nguyên Đán
    END,
    brand_ratio = CASE
        WHEN campaign_id IN (1, 3, 5, 7, 9) THEN 60.00
        ELSE 50.00
    END,
    mall_ratio = CASE
        WHEN campaign_id IN (1, 3, 5, 7, 9) THEN 40.00
        ELSE 50.00
    END;

ALTER TABLE Campaign
ADD COLUMN usage_instructions TEXT;

UPDATE Campaign
SET usage_instructions = CASE
    WHEN campaign_id = 1 THEN 'Sử dụng mã tại quầy thanh toán để nhận giảm giá 20%.'
    WHEN campaign_id = 2 THEN 'Đổi voucher tại cửa hàng để nhận quà.'
    WHEN campaign_id = 3 THEN 'Áp dụng mã khi mua sắm tại cửa hàng trong thời gian diễn ra chương trình.'
    WHEN campaign_id = 4 THEN 'Sử dụng mã để nhận voucher giảm giá tại quầy.'
    WHEN campaign_id = 5 THEN 'Đổi điểm để nhận quà tại quầy dịch vụ.'
    WHEN campaign_id = 6 THEN 'Sử dụng mã để nhận ưu đãi trong ngày 11.11.'
    WHEN campaign_id = 7 THEN 'Áp dụng mã cho khách VIP tại quầy thanh toán.'
    WHEN campaign_id = 8 THEN 'Đổi quà tại quầy dịch vụ với mã này.'
    WHEN campaign_id = 9 THEN 'Sử dụng mã để nhận ưu đãi Black Friday.'
    WHEN campaign_id = 10 THEN 'Áp dụng mã để nhận quà Tết tại quầy.'
END;

ALTER TABLE Campaign
ADD COLUMN stock INT DEFAULT 0,
ADD COLUMN initial_stock INT DEFAULT 100;

ALTER TABLE Campaign_Redemption ADD COLUMN used_at DATETIME;

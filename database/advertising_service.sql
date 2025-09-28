-- create database Advertising_Service;
-- use Advertising_Service;

CREATE TABLE Ad
(
  ad_id INT NOT NULL AUTO_INCREMENT,
  brand_id INT NOT NULL,
  title VARCHAR(100) NOT NULL,
  description VARCHAR(200) NOT NULL,
  start_at datetime NOT NULL,
  end_at datetime NOT NULL,
  created_at datetime NOT NULL,
  status ENUM('DRAFT', 'PENDING', 'APPROVED', 'REJECTED') DEFAULT 'DRAFT',
  approval_comment TEXT,
  ad_cost DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (ad_id)
);

CREATE TABLE AdInteraction (
    interaction_id INT AUTO_INCREMENT PRIMARY KEY,
    ad_id INT NOT NULL,
    user_id INT NOT NULL,
    action ENUM('VIEW', 'DISMISS') NOT NULL,
    interaction_at DATETIME NOT NULL,
    FOREIGN KEY (ad_id) REFERENCES Ad(ad_id)
);



INSERT INTO Ad (brand_id, title, description, start_at, end_at, created_at, status, approval_comment, ad_cost) 
VALUES
(1, 'Sale 50% Off', 'Huge discounts on all products, up to 50% off!', '2025-05-01 00:00:00', '2025-05-15 23:59:59', NOW(), 'APPROVED', 'Đã duyệt bởi Brand', 5000000),
(1, 'New Product Launch', 'Come check out our brand new product line for 2025!', '2025-05-10 00:00:00', '2025-05-20 23:59:59', NOW(), 'APPROVED', 'Đã duyệt bởi Brand', 3000000),
(3, 'Summer Collection', 'Get ready for the summer with our latest fashion collection.', '2025-05-01 00:00:00', '2025-05-31 23:59:59', NOW(), 'PENDING', NULL, 4000000),
(4, 'Buy One Get One Free', 'Buy one, get another free for selected items!', '2025-05-05 00:00:00', '2025-05-25 23:59:59', NOW(), 'APPROVED', 'Đã duyệt bởi Brand', 2000000),
(5, 'Black Friday Early Deals', 'Exclusive early access to our Black Friday deals.', '2025-05-01 00:00:00', '2025-05-15 23:59:59', NOW(), 'REJECTED', 'Bị từ chối vì nội dung không phù hợp', 6000000);
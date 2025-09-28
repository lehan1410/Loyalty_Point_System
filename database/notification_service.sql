-- create database Notification_Service;
-- use Notification_Service;

CREATE TABLE Notification
(
  notification_id INT AUTO_INCREMENT,
  title VARCHAR(100) NOT NULL,
  message VARCHAR(100) NOT NULL,
  created_at datetime NOT NULL,
  end_at datetime,
  status bit NOT NULL,
  target_type ENUM('brand','customer','all') DEFAULT 'customer',
  target_id INT NULL,
  type ENUM('marketing', 'system'),
  PRIMARY KEY (notification_id)
);




create database Notification_Service;
use Notification_Service;

CREATE TABLE Notification
(
  notification_id INT AUTO_INCREMENT,
  title VARCHAR(100) NOT NULL,
  message VARCHAR(100) NOT NULL,
  created_at datetime NOT NULL,
  end_at datetime,
  status bit NOT NULL,
  PRIMARY KEY (notification_id)
);

ALTER TABLE Notification
ADD COLUMN target_type ENUM('brand','customer') DEFAULT 'customer',
ADD COLUMN target_id INT NULL;



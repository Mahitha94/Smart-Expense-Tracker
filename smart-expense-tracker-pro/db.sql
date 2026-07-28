-- Smart Expense Tracker Pro - Database Schema (MySQL)
-- College Mini Project - Module 1 (Architecture & Boilerplate)
-- Create Database: `smart_expense_tracker`

CREATE DATABASE IF NOT EXISTS `smart_expense_tracker` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `smart_expense_tracker`;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `fullname` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `avatar` VARCHAR(255) DEFAULT 'default-avatar.png',
  `currency` VARCHAR(10) DEFAULT 'USD',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `type` ENUM('income', 'expense') NOT NULL,
  `color` VARCHAR(20) DEFAULT '#007bff',
  `icon` VARCHAR(50) DEFAULT 'icon-folder'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Expenses Table
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `category_id` INT NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `receipt_path` VARCHAR(255) DEFAULT NULL,
  `expense_date` DATE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Income Table
CREATE TABLE IF NOT EXISTS `income` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `source_name` VARCHAR(100) NOT NULL, -- e.g. Salary, Freelance
  `amount` DECIMAL(10,2) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `income_date` DATE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Budgets Table
CREATE TABLE IF NOT EXISTS `budgets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `category_id` INT NOT NULL,
  `amount_limit` DECIMAL(10,2) NOT NULL,
  `budget_month` VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `user_category_month` (`user_id`, `category_id`, `budget_month`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Savings Goals Table
CREATE TABLE IF NOT EXISTS `savings_goals` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `goal_name` VARCHAR(100) NOT NULL,
  `target_amount` DECIMAL(10,2) NOT NULL,
  `current_amount` DECIMAL(10,2) DEFAULT 0.00,
  `target_date` DATE DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- SEED DATA FOR CATEGORIES (Default starting categories)
-- =========================================================
INSERT INTO `categories` (`name`, `type`, `color`, `icon`) VALUES
('Food & Dining', 'expense', '#e63946', 'icon-coffee'),
('Housing & Utilities', 'expense', '#1d3557', 'icon-home'),
('Transportation', 'expense', '#f4a261', 'icon-truck'),
('Entertainment', 'expense', '#9b5de5', 'icon-film'),
('Shopping', 'expense', '#ff006e', 'icon-shopping-bag'),
('Salary', 'income', '#2a9d8f', 'icon-dollar-sign'),
('Freelance', 'income', '#3a86c8', 'icon-briefcase'),
('Investments', 'income', '#4361ee', 'icon-trending-up'),
('Other', 'expense', '#6c757d', 'icon-help-circle');

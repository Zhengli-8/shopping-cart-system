/*
 Navicat Premium Data Transfer

 Source Server         : 222
 Source Server Type    : MySQL
 Source Server Version : 80037
 Source Host           : localhost:3306
 Source Schema         : shopping_cart

 Target Server Type    : MySQL
 Target Server Version : 80037
 File Encoding         : 65001

 Date: 24/03/2026 20:23:58
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Create database if not exists
-- ----------------------------
CREATE DATABASE IF NOT EXISTS `shopping_cart` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `shopping_cart`;

-- ----------------------------
-- Table structure for cart_items
-- ----------------------------
DROP TABLE IF EXISTS `cart_items`;
CREATE TABLE `cart_items`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `quantity` int NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_product`(`product_id` ASC) USING BTREE,
  CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of cart_items
-- ----------------------------

-- ----------------------------
-- Table structure for products
-- ----------------------------
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `price` decimal(10, 2) NOT NULL,
  `image` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `category` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `stock` int NULL DEFAULT 100,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 61 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of products
-- ----------------------------
INSERT INTO `products` VALUES (49, 'iPhone 15 Pro', 'Latest Apple phone with A17 Pro chip, titanium design', 8999.00, 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400&h=400&fit=crop', 'Electronics', 100, '2026-03-24 20:06:33');
INSERT INTO `products` VALUES (50, 'MacBook Pro 14', 'M3 Pro chip, 18-hour battery life', 14999.00, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop', 'Electronics', 100, '2026-03-24 20:06:33');
INSERT INTO `products` VALUES (51, 'AirPods Pro 2', 'Active noise cancellation, spatial audio', 1899.00, 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&h=400&fit=crop', 'Electronics', 100, '2026-03-24 20:06:33');
INSERT INTO `products` VALUES (52, 'iPad Pro 12.9', 'M2 chip, Liquid Retina XDR display', 9999.00, 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop', 'Electronics', 100, '2026-03-24 20:06:33');
INSERT INTO `products` VALUES (53, 'Apple Watch Ultra 2', 'Professional sports watch, 100m water resistant', 5999.00, 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400&h=400&fit=crop', 'Electronics', 100, '2026-03-24 20:06:33');
INSERT INTO `products` VALUES (54, 'Nike Air Max 270', 'Classic sneakers with comfortable cushioning', 1299.00, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', 'Clothing', 100, '2026-03-24 20:06:33');
INSERT INTO `products` VALUES (55, 'Adidas Ultraboost', 'Running shoes with Boost technology', 1599.00, 'https://images.unsplash.com/photo-1491553895911-0055uj66ef46?w=400&h=400&fit=crop', 'Clothing', 100, '2026-03-24 20:06:33');
INSERT INTO `products` VALUES (56, 'Levi\'s 501 Jeans', 'Classic straight fit, premium denim', 599.00, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop', 'Clothing', 100, '2026-03-24 20:06:33');
INSERT INTO `products` VALUES (57, 'The North Face Jacket', 'Gore-Tex waterproof breathable fabric', 2999.00, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop', 'Clothing', 100, '2026-03-24 20:06:33');
INSERT INTO `products` VALUES (58, 'Dyson Hair Dryer', 'Smart temperature control, fast drying', 2990.00, 'https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=400&h=400&fit=crop', 'Home Appliances', 100, '2026-03-24 20:06:33');
INSERT INTO `products` VALUES (59, 'Xiaomi Robot Vacuum', 'Laser navigation, smart obstacle avoidance', 1999.00, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop', 'Home Appliances', 100, '2026-03-24 20:06:33');
INSERT INTO `products` VALUES (60, 'Philips Air Purifier', 'Removes formaldehyde and PM2.5', 1499.00, 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=400&fit=crop', 'Home Appliances', 100, '2026-03-24 20:06:33');

SET FOREIGN_KEY_CHECKS = 1;

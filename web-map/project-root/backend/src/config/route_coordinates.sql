/*
 Navicat Premium Data Transfer

 Source Server         : test
 Source Server Type    : MySQL
 Source Server Version : 80033
 Source Host           : localhost:3306
 Source Schema         : hiking_platform

 Target Server Type    : MySQL
 Target Server Version : 80033
 File Encoding         : 65001

 Date: 18/05/2025 19:45:08
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for route_coordinates
-- ----------------------------
DROP TABLE IF EXISTS `route_coordinates`;
CREATE TABLE `route_coordinates`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `route_id` int NOT NULL,
  `start_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `start_lat` decimal(10, 6) NOT NULL,
  `start_lng` decimal(10, 6) NOT NULL,
  `end_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `end_lat` decimal(10, 6) NOT NULL,
  `end_lng` decimal(10, 6) NOT NULL,
  `waypoints` json NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `route_id`(`route_id` ASC) USING BTREE,
  CONSTRAINT `route_coordinates_ibfk_1` FOREIGN KEY (`route_id`) REFERENCES `hiking_routes` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of route_coordinates
-- ----------------------------

SET FOREIGN_KEY_CHECKS = 1;

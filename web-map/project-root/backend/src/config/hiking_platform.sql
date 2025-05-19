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

 Date: 17/05/2025 15:35:25
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for hiking_routes
-- ----------------------------
DROP TABLE IF EXISTS `hiking_routes`;
CREATE TABLE `hiking_routes`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `difficulty` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `difficulty_class` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `duration` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `distance` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `elevation` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `rating` decimal(2, 1) NOT NULL,
  `reviews` int NULL DEFAULT 0,
  `location` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `seasons` json NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_popular` tinyint(1) NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of hiking_routes
-- ----------------------------
INSERT INTO `hiking_routes` VALUES (1, '龙虎山观景徒步路线', '初级', 'easy', '3小时', '5.8公里', '320米', '适合初学者的经典路线，景色优美，路况良好，可欣赏山景和溪流。', 'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=1470&auto=format&fit=crop', 4.5, 128, '四川 成都', '[\"春季\", \"秋季\"]', '2025-05-11 20:33:27', '2025-05-11 20:33:27', 0);
INSERT INTO `hiking_routes` VALUES (2, '青龙峡谷探险路线', '中级', 'medium', '5小时', '9.5公里', '580米', '中等难度的峡谷路线，包含部分攀爬段，沿途有多处壮观的峡谷景观。', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1470&auto=format&fit=crop', 4.8, 97, '云南 丽江', '[\"春季\", \"夏季\", \"秋季\"]', '2025-05-11 20:33:27', '2025-05-11 20:33:27', 0);
INSERT INTO `hiking_routes` VALUES (3, '雪山高原长线徒步', '高级', 'hard', '8小时', '16.2公里', '1200米', '挑战性强的高海拔路线，需要良好的体能和户外经验，风景壮丽。', 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?q=80&w=1471&auto=format&fit=crop', 4.9, 76, '西藏 林芝', '[\"夏季\"]', '2025-05-11 20:33:27', '2025-05-11 20:33:27', 0);
INSERT INTO `hiking_routes` VALUES (4, '松林湖泊环线', '初级', 'easy', '2.5小时', '4.2公里', '150米', '平缓的湖泊环线，全程树荫遮盖，非常适合夏季徒步和亲子活动。', 'https://images.unsplash.com/photo-1465311530779-5241f5a29892?q=80&w=1470&auto=format&fit=crop', 4.3, 156, '浙江 杭州', '[\"春季\", \"夏季\", \"秋季\"]', '2025-05-11 20:33:27', '2025-05-11 20:33:27', 0);
INSERT INTO `hiking_routes` VALUES (5, '黄山西海大峡谷', '中级', 'medium', '6小时', '8.7公里', '750米', '穿越壮观的峡谷和山脉，欣赏黄山奇松怪石，沿途风景秀丽，适合徒步爱好者。', 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1574&auto=format&fit=crop', 4.7, 112, '安徽 黄山', '[\"春季\", \"秋季\"]', '2025-05-11 20:33:27', '2025-05-11 20:33:27', 0);
INSERT INTO `hiking_routes` VALUES (6, '海岸线礁石路线', '中级', 'medium', '4小时', '7.3公里', '210米', '沿海岸线穿行，经过多处礁石和海蚀地貌，可以欣赏壮观的海景。', 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1470&auto=format&fit=crop', 4.6, 88, '福建 厦门', '[\"春季\", \"秋季\", \"冬季\"]', '2025-05-11 20:33:27', '2025-05-11 20:33:27', 0);

-- ----------------------------
-- Table structure for messages
-- ----------------------------
DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `type` enum('like','comment') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '消息类型：点赞或评论',
  `sender_id` int NOT NULL COMMENT '发送者ID',
  `receiver_id` int NOT NULL COMMENT '接收者ID（帖子作者）',
  `post_id` int UNSIGNED NOT NULL COMMENT '相关帖子ID',
  `comment_id` int UNSIGNED NULL DEFAULT NULL COMMENT '相关评论ID（评论类型消息才有）',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '消息内容（评论类型存储评论内容）',
  `is_read` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否已读',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_receiver_id`(`receiver_id` ASC) USING BTREE,
  INDEX `idx_post_id`(`post_id` ASC) USING BTREE,
  INDEX `idx_sender_id`(`sender_id` ASC) USING BTREE,
  INDEX `idx_is_read`(`is_read` ASC) USING BTREE,
  INDEX `idx_type`(`type` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of messages
-- ----------------------------

-- ----------------------------
-- Table structure for post_comments
-- ----------------------------
DROP TABLE IF EXISTS `post_comments`;
CREATE TABLE `post_comments`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `post_id` int NOT NULL,
  `user_id` int NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `parent_id` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `post_id`(`post_id` ASC) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  INDEX `parent_id`(`parent_id` ASC) USING BTREE,
  CONSTRAINT `post_comments_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `post_comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `post_comments_ibfk_3` FOREIGN KEY (`parent_id`) REFERENCES `post_comments` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 18 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of post_comments
-- ----------------------------
INSERT INTO `post_comments` VALUES (1, 1, 1, '这篇帖子太有用了！我正打算去黄山徒步，这些信息帮了大忙。', '2025-05-10 21:07:37', '2025-05-14 21:07:37', NULL);
INSERT INTO `post_comments` VALUES (2, 1, 1, '请问黄山的哪家酒店推荐？价格大概是多少？', '2025-05-11 21:07:37', '2025-05-14 21:07:37', NULL);
INSERT INTO `post_comments` VALUES (3, 2, 1, '感谢分享！我一直在纠结是买Salomon还是Merrell，这篇文章帮我做了决定。', '2025-05-12 21:07:37', '2025-05-14 21:07:37', NULL);
INSERT INTO `post_comments` VALUES (4, 3, 1, '手机摄影技巧分享得太详细了，我要把这些都用到下次徒步中去！', '2025-05-13 21:07:37', '2025-05-14 21:07:37', NULL);
INSERT INTO `post_comments` VALUES (5, 6, 1, '这篇帖子太有用了！我正打算去黄山徒步，这些信息帮了大忙。', '2025-05-10 21:22:44', '2025-05-14 21:22:44', NULL);
INSERT INTO `post_comments` VALUES (6, 6, 1, '请问黄山的哪家酒店推荐？价格大概是多少？', '2025-05-11 21:22:44', '2025-05-14 21:22:44', NULL);
INSERT INTO `post_comments` VALUES (7, 7, 1, '感谢分享！我一直在纠结是买Salomon还是Merrell，这篇文章帮我做了决定。', '2025-05-12 21:22:44', '2025-05-14 21:22:44', NULL);
INSERT INTO `post_comments` VALUES (8, 8, 1, '手机摄影技巧分享得太详细了，我要把这些都用到下次徒步中去！', '2025-05-13 21:22:44', '2025-05-14 21:22:44', NULL);
INSERT INTO `post_comments` VALUES (9, 6, 1, '谢谢你的肯定！如果还有什么问题可以随时问我。', '2025-05-10 21:23:06', '2025-05-14 21:23:06', 5);
INSERT INTO `post_comments` VALUES (10, 8, 1, '很高兴你喜欢这些技巧！期待看到你的作品。', '2025-05-13 21:23:06', '2025-05-14 21:23:06', 8);
INSERT INTO `post_comments` VALUES (11, 15, 1, '哈哈哈', '2025-05-16 14:56:58', '2025-05-16 14:56:58', NULL);
INSERT INTO `post_comments` VALUES (12, 15, 1, '哈哈哈', '2025-05-16 14:57:23', '2025-05-16 14:57:23', NULL);
INSERT INTO `post_comments` VALUES (13, 14, 1, '哈哈', '2025-05-16 15:00:33', '2025-05-16 15:00:33', NULL);
INSERT INTO `post_comments` VALUES (14, 14, 1, '哈哈', '2025-05-16 15:01:24', '2025-05-16 15:01:24', NULL);
INSERT INTO `post_comments` VALUES (15, 13, 1, '规划', '2025-05-16 15:42:59', '2025-05-16 15:42:59', NULL);
INSERT INTO `post_comments` VALUES (16, 14, 2, 'good', '2025-05-16 16:18:26', '2025-05-16 16:18:26', NULL);
INSERT INTO `post_comments` VALUES (17, 23, 4, '赢', '2025-05-17 15:24:30', '2025-05-17 15:24:30', NULL);

-- ----------------------------
-- Table structure for post_images
-- ----------------------------
DROP TABLE IF EXISTS `post_images`;
CREATE TABLE `post_images`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `post_id` int NOT NULL,
  `image_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `sort_order` int NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `post_id`(`post_id` ASC) USING BTREE,
  CONSTRAINT `post_images_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 14 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of post_images
-- ----------------------------
INSERT INTO `post_images` VALUES (1, 1, 'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=1470&auto=format&fit=crop', 0);
INSERT INTO `post_images` VALUES (2, 2, 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1470&auto=format&fit=crop', 0);
INSERT INTO `post_images` VALUES (3, 3, 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?q=80&w=1471&auto=format&fit=crop', 0);
INSERT INTO `post_images` VALUES (4, 4, 'https://images.unsplash.com/photo-1465311530779-5241f5a29892?q=80&w=1470&auto=format&fit=crop', 0);
INSERT INTO `post_images` VALUES (5, 5, 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1574&auto=format&fit=crop', 0);
INSERT INTO `post_images` VALUES (6, 1, 'https://p1-arco.byteimg.com/oss-cn-beijing/fe42c34d-6994-480d-900c-afbf9c845f8e~tplv-k3u1fbpfcp-image.image', 0);
INSERT INTO `post_images` VALUES (7, 2, 'https://p1-arco.byteimg.com/oss-cn-beijing/a04a1102-d836-47bd-9186-b86aa66a2ede~tplv-k3u1fbpfcp-image.image', 0);
INSERT INTO `post_images` VALUES (8, 3, 'https://p1-arco.byteimg.com/oss-cn-beijing/e5da7b9f-d706-4a28-88d5-4cb872886ec0~tplv-k3u1fbpfcp-image.image', 0);
INSERT INTO `post_images` VALUES (9, 6, 'https://p1-arco.byteimg.com/oss-cn-beijing/fe42c34d-6994-480d-900c-afbf9c845f8e~tplv-k3u1fbpfcp-image.image', 0);
INSERT INTO `post_images` VALUES (10, 7, 'https://p1-arco.byteimg.com/oss-cn-beijing/a04a1102-d836-47bd-9186-b86aa66a2ede~tplv-k3u1fbpfcp-image.image', 0);
INSERT INTO `post_images` VALUES (11, 8, 'https://p1-arco.byteimg.com/oss-cn-beijing/e5da7b9f-d706-4a28-88d5-4cb872886ec0~tplv-k3u1fbpfcp-image.image', 0);
INSERT INTO `post_images` VALUES (12, 21, '/uploads/forum/1747387271327-524558488.JPG', 0);
INSERT INTO `post_images` VALUES (13, 23, '/uploads/forum/1747388266042-383074172.JPG', 0);

-- ----------------------------
-- Table structure for post_likes
-- ----------------------------
DROP TABLE IF EXISTS `post_likes`;
CREATE TABLE `post_likes`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `post_id` int NOT NULL,
  `user_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_like`(`post_id` ASC, `user_id` ASC) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `post_likes_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `post_likes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 58 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of post_likes
-- ----------------------------
INSERT INTO `post_likes` VALUES (1, 1, 1, '2025-05-14 21:06:08');
INSERT INTO `post_likes` VALUES (2, 2, 1, '2025-05-14 21:06:08');
INSERT INTO `post_likes` VALUES (3, 3, 1, '2025-05-14 21:06:08');
INSERT INTO `post_likes` VALUES (4, 6, 1, '2025-05-14 21:22:01');
INSERT INTO `post_likes` VALUES (6, 8, 1, '2025-05-14 21:22:01');
INSERT INTO `post_likes` VALUES (29, 13, 1, '2025-05-16 16:02:05');
INSERT INTO `post_likes` VALUES (33, 9, 1, '2025-05-16 16:07:31');
INSERT INTO `post_likes` VALUES (42, 15, 1, '2025-05-16 16:13:55');
INSERT INTO `post_likes` VALUES (43, 14, 1, '2025-05-16 16:14:02');
INSERT INTO `post_likes` VALUES (44, 7, 1, '2025-05-16 16:17:40');
INSERT INTO `post_likes` VALUES (45, 11, 1, '2025-05-16 16:17:49');
INSERT INTO `post_likes` VALUES (50, 10, 1, '2025-05-16 16:17:57');
INSERT INTO `post_likes` VALUES (51, 15, 2, '2025-05-16 16:18:18');
INSERT INTO `post_likes` VALUES (52, 14, 2, '2025-05-16 16:18:21');
INSERT INTO `post_likes` VALUES (53, 15, 4, '2025-05-16 16:38:06');
INSERT INTO `post_likes` VALUES (54, 14, 4, '2025-05-16 16:38:09');
INSERT INTO `post_likes` VALUES (55, 13, 4, '2025-05-16 16:38:12');
INSERT INTO `post_likes` VALUES (56, 12, 4, '2025-05-16 16:38:15');
INSERT INTO `post_likes` VALUES (57, 23, 4, '2025-05-17 15:24:15');

-- ----------------------------
-- Table structure for posts
-- ----------------------------
DROP TABLE IF EXISTS `posts`;
CREATE TABLE `posts`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `summary` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `user_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `likes` int NULL DEFAULT 0,
  `comments` int NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `posts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 24 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of posts
-- ----------------------------
INSERT INTO `posts` VALUES (1, '分享我的莫干山徒步经历', '上周末和朋友一起去了莫干山徒步，风景真的太美了！路线难度适中，适合初学者。沿途可以看到很多竹林和茶园，空气非常清新。建议早上出发，避开中午的高温。', '上周末和朋友一起去了莫干山徒步，风景真的太美了！路线难度适中，适合初学者。沿途可以看到很多竹林和茶园，空气非常清新。建议早上出发，避开中午的高温。', 1, '2024-03-15 10:00:00', '2025-05-14 21:06:32', '浙江省湖州市德清县莫干山', 1, 5);
INSERT INTO `posts` VALUES (2, '黄山徒步装备推荐', '作为一个经常徒步的爱好者，我想分享一下我的装备清单。首先是登山鞋，一定要选择防滑、透气的专业登山鞋。其次是背包，建议选择30-40L的容量，要带有防水功能。', '作为一个经常徒步的爱好者，我想分享一下我的装备清单。首先是登山鞋，一定要选择防滑、透气的专业登山鞋。其次是背包，建议选择30-40L的容量，要带有防水功能。', 2, '2024-03-14 15:30:00', '2025-05-14 21:06:32', '安徽省黄山市', 1, 8);
INSERT INTO `posts` VALUES (3, '杭州周边最适合初学者的5条徒步路线', '1. 龙井村-九溪烟树：全程约5公里，路况良好，适合亲子活动。2. 云栖竹径：约3公里，竹林环绕，空气清新。3. 虎跑公园：约4公里，有泉水景观。4. 玉皇山：约6公里，可以俯瞰西湖。5. 吴山：约3公里，城市中的徒步好去处。', '1. 龙井村-九溪烟树：全程约5公里，路况良好，适合亲子活动。2. 云栖竹径：约3公里，竹林环绕，空气清新。3. 虎跑公园：约4公里，有泉水景观。4. 玉皇山：约6公里，可以俯瞰西湖。5. 吴山：约3公里，城市中的徒步好去处。', 3, '2024-03-13 09:15:00', '2025-05-14 21:06:32', '浙江省杭州市', 1, 12);
INSERT INTO `posts` VALUES (4, '徒步安全注意事项', '1. 提前查看天气预报，避免恶劣天气出行。2. 准备充足的饮用水和干粮。3. 穿着合适的衣物和鞋子。4. 带上急救包和必要的药品。5. 结伴而行，不要单独行动。6. 保持手机电量充足。', '1. 提前查看天气预报，避免恶劣天气出行。2. 准备充足的饮用水和干粮。3. 穿着合适的衣物和鞋子。4. 带上急救包和必要的药品。5. 结伴而行，不要单独行动。6. 保持手机电量充足。', 4, '2024-03-12 14:20:00', '2024-03-12 14:20:00', NULL, 67, 15);
INSERT INTO `posts` VALUES (5, '我的第一次高原徒步经历', '上个月去了西藏林芝，体验了人生第一次高原徒步。虽然海拔较高，但景色真的震撼。建议提前一周服用红景天，准备充足的氧气瓶。高原徒步最重要的是要循序渐进，不要急于求成。', '上个月去了西藏林芝，体验了人生第一次高原徒步。虽然海拔较高，但景色真的震撼。建议提前一周服用红景天，准备充足的氧气瓶。高原徒步最重要的是要循序渐进，不要急于求成。', 5, '2024-03-11 11:45:00', '2024-03-11 11:45:00', '西藏自治区林芝市', 89, 20);
INSERT INTO `posts` VALUES (6, '黄山徒步三日游经验分享，适合新手的路线攻略', '分享我最近在黄山的三日徒步经验，包括路线规划、装备准备、住宿推荐以及注意事项。\n\n黄山是中国最著名的山脉之一，以其奇松、怪石、云海、温泉和冬雪闻名。我们这次选择了一条比较适合新手的路线，整个行程安排在三天两夜，难度适中，风景绝佳。\n\n【装备准备】\n1. 登山鞋：一定要防滑、透气，最好是有防水功能的\n2. 登山杖：减轻膝盖压力，增加稳定性\n3. 背包：30-40L容量即可，带防雨罩\n4. 衣物：建议穿速干衣，带防风防雨外套\n5. 充足的水和能量食品\n\n【路线安排】\n第一天：云谷寺→百步云梯→一线天→始信峰→西海大峡谷→飞来石（住山上）\n第二天：光明顶→天海景区→鳌鱼峰→莲花峰→观日台（住山上）\n第三天：清凉台→迎客松→南大门下山\n\n【住宿建议】\n山上住宿需要提前预定，特别是节假日，价格在300-800不等，条件比较简单，但体验山上日出日落很值得。\n\n如果有任何问题，欢迎在评论区交流！', '分享我最近在黄山的三日徒步经验，包括路线规划、装备准备、住宿推荐以及注意事项，非常适合徒步新手参考。', 1, '2025-05-09 21:19:38', '2025-05-14 21:23:23', '安徽省黄山市', 1, 3);
INSERT INTO `posts` VALUES (7, '专业登山鞋选购指南：五年徒步经验的心得', '作为一名有五年徒步经验的户外爱好者，今天想和大家分享我对各种登山鞋的使用体验和选购建议。\n\n一双好的登山鞋可以让你的徒步体验大大提升，反之则可能带来不必要的痛苦和危险。根据我的经验，选购登山鞋主要考虑以下几个因素：\n\n【鞋底硬度】\n- 软底鞋：适合轻度徒步，舒适度高但保护性差\n- 中硬度鞋底：多功能徒步鞋的标准，平衡了舒适度和保护性\n- 硬底鞋：适合高海拔和复杂地形，保护性好但舒适度差\n\n【防水透气性】\n防水膜（如Gore-Tex）能保持双脚干燥，但会降低透气性。在干燥地区徒步，可以选择无防水膜的透气款；而在潮湿环境，防水功能则非常重要。\n\n【鞋帮高度】\n- 低帮：轻便灵活，适合轻装短途徒步\n- 中帮：保护踝关节，适合一般徒步\n- 高帮：提供最好的踝关节保护，适合负重长途徒步和复杂地形\n\n【品牌推荐】\n入门级：迪卡侬、Columbia\n中端：Merrell、Salomon、Keen\n高端：Scarpa、La Sportiva、Lowa\n\n记住，最好的鞋不是最贵的，而是最适合你的。购买前一定要试穿，最好在下午或傍晚（脚会略微肿胀，更接近徒步状态）。\n\n希望这些建议对你有所帮助！', '作为一名有五年徒步经验的户外爱好者，分享我对各种登山鞋的使用体验和选购建议，帮助大家避开选购误区。', 1, '2025-05-08 21:20:13', '2025-05-16 16:17:40', NULL, 1, 1);
INSERT INTO `posts` VALUES (8, '户外徒步拍摄技巧：如何用手机拍出美照', '不需要专业相机，用手机也能在徒步中拍出令人惊艳的照片。今天我将分享一些实用的拍摄技巧。\n\n【光线运用】\n- 黄金时段：日出后和日落前的1-2小时，光线柔和，色彩饱满\n- 避开正午：中午光线强烈，容易过曝或产生强烈阴影\n- 逆光拍摄：可以创造剪影效果，但需要调整曝光\n\n【构图技巧】\n- 三分法则：将画面横竖各分为三等分，将主体放在交叉点上\n- 前景增加层次：在画面前景加入石头、树枝等元素，增加画面深度\n- 引导线：利用小路、河流等自然线条引导视线\n- 框架构图：利用树木、岩石等自然元素形成框架，突出主体\n\n【手机拍摄模式】\n- 全景模式：适合开阔的风景\n- HDR模式：适合光比较大的场景\n- 肖像模式：突出人物，虚化背景\n\n【简单后期处理】\n- Snapseed：我最常用的手机修图软件，功能强大且免费\n- Lightroom Mobile：专业级修图软件的手机版\n- VSCO：提供优质滤镜，一键美化\n\n【保护设备】\n- 防水袋：雨天或水边拍摄的必备\n- 备用电源：长途徒步必备\n- 稳定支架：夜景或自拍必备\n\n记住，最好的照片不是设备拍出来的，而是你的视角和感受。希望这些技巧能帮助你记录下美好的户外时光！', '不需要专业相机，用手机也能在徒步中拍出令人惊艳的照片。分享构图、光线利用、后期处理等实用技巧。', 1, '2025-05-07 21:20:47', '2025-05-14 21:23:23', NULL, 1, 2);
INSERT INTO `posts` VALUES (9, '徒步新手常见问题解答与注意事项', '作为一名户外教练，我经常收到各种徒步新手的问题。在这篇帖子中，我整理了最常见的20个问题及解答，希望能帮助徒步新手更安全、更愉快地享受户外活动。\n\n【体能准备】\n1. 问：没有运动习惯，如何准备第一次徒步？\n   答：从短距离平缓路线开始，每周进行3次30分钟以上的有氧训练，如快走、慢跑等，逐渐提高强度。\n\n2. 问：如何避免徒步中的肌肉酸痛？\n   答：徒步前充分热身，徒步中保持适当步频和水分摄入，徒步后进行拉伸。\n\n【装备选择】\n3. 问：第一双登山鞋该如何选择？\n   答：新手建议选择中帮、轻量级的登山鞋，品牌可考虑迪卡侬、Columbia等入门级品牌。\n\n4. 问：背包大小如何选择？\n   答：日间徒步20-30L，1-2天徒步30-40L，多日徒步可选择50L以上。\n\n5. 问：徒步服装如何选择？\n   答：遵循三层穿衣法：贴身层（排汗），中间层（保暖），外层（防风防水）。\n\n【安全注意事项】\n6. 问：如何预防水泡？\n   答：穿合适的鞋袜，保持脚部干燥，出现摩擦热点立即贴创可贴处理。\n\n7. 问：遇到野生动物怎么办？\n   答：保持距离，缓慢后退，不要跑，不要直视动物眼睛。\n\n8. 问：迷路了怎么办？\n   答：停下来，冷静思考，使用地图或GPS定位，如果确实找不到路，留在原地等待救援。\n\n【其他常见问题】\n9. 问：徒步时间如何计算？\n   答：平地每小时约4-5公里，上坡每小时爬升300-400米，下坡每小时下降500-600米。\n\n10. 问：如何判断天气变化？\n    答：出发前查看天气预报，注意云层变化和风向变化，带上防雨装备。\n\n希望这些回答能帮助到徒步新手们，如有其他问题，欢迎在评论区提问！', '整理了徒步新手最常遇到的20个问题及详细解答，涵盖装备选择、体能准备、安全防护等方面。', 1, '2025-05-06 21:21:17', '2025-05-16 16:07:31', NULL, 1, 0);
INSERT INTO `posts` VALUES (10, '1', '1', '1', 1, '2025-05-16 07:12:35', '2025-05-16 16:17:57', '', 1, 0);
INSERT INTO `posts` VALUES (11, '1', '1', '1', 1, '2025-05-16 07:12:49', '2025-05-16 16:17:49', '', 1, 0);
INSERT INTO `posts` VALUES (12, '2', '2', '2', 1, '2025-05-16 07:16:44', '2025-05-16 16:38:15', '', 1, 0);
INSERT INTO `posts` VALUES (13, '11', '1', '1', 1, '2025-05-16 07:23:40', '2025-05-16 16:38:12', '', 2, 1);
INSERT INTO `posts` VALUES (14, '11', '11', '11', 1, '2025-05-16 07:23:59', '2025-05-16 16:38:09', '', 3, 3);
INSERT INTO `posts` VALUES (15, '33333', '3333', '3333', 1, '2025-05-16 14:05:00', '2025-05-16 16:38:06', '', 3, 2);
INSERT INTO `posts` VALUES (16, '想出去玩了', '青城山徒步路线', '青城山徒步路线', 4, '2025-05-16 16:37:25', '2025-05-16 16:37:25', '', 0, 0);
INSERT INTO `posts` VALUES (17, 'w\'w\'w', 'www', 'www', 4, '2025-05-16 16:40:38', '2025-05-16 16:40:38', '', 0, 0);
INSERT INTO `posts` VALUES (18, '22222222', '222222222', '222222222', 4, '2025-05-16 17:09:02', '2025-05-16 17:09:02', '', 0, 0);
INSERT INTO `posts` VALUES (19, '1', '1', '1', 4, '2025-05-16 17:13:39', '2025-05-16 17:13:39', '', 0, 0);
INSERT INTO `posts` VALUES (21, 'qqqqq', 'qqq', 'qqq', 4, '2025-05-16 17:21:56', '2025-05-16 17:21:56', '', 0, 0);
INSERT INTO `posts` VALUES (23, '1', '1', '1', 4, '2025-05-16 17:37:52', '2025-05-17 15:24:30', '', 1, 1);

-- ----------------------------
-- Table structure for tags
-- ----------------------------
DROP TABLE IF EXISTS `tags`;
CREATE TABLE `tags`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `tag_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `tag_name`(`tag_name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of tags
-- ----------------------------

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `password` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `avatar` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `bio` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `is_admin` tinyint(1) NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `username`(`username` ASC) USING BTREE,
  UNIQUE INDEX `email`(`email` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES (1, 'xxx', '123456@qq.com', '$2a$10$t3UaxRTCh8Qfb4g8bfzvoOxwJObMGi3m.1oEvVJFg8U2hf6sA6zqS', 'http://localhost:3000/uploads/1746868040833-OIP-C.jpg', '2025-05-10 13:32:19', '2025-05-11 15:31:12', NULL, 1);
INSERT INTO `users` VALUES (2, 'xxxx', '1234567@qq.com', '$2a$10$HeUANKSZVZ/I701qv8uSyOAZzErmctFNjULvzctJ8G.h.GSjersYm', NULL, '2025-05-10 13:33:08', '2025-05-10 13:33:08', NULL, 0);
INSERT INTO `users` VALUES (3, 'admin', '1981178578@qq.com', '$2a$10$Df/3fYjiy6SBuwR1VtwAR.LHUCjnFD5k/B25xZplZ.dE0vPY9yciW', NULL, '2025-05-10 13:39:55', '2025-05-10 13:39:55', NULL, 0);
INSERT INTO `users` VALUES (4, 'ddd', '1988578@qq.com', '$2a$10$ONTNMjKlAprwt13aEKQR1ePosoEtf5O5kFZE2n2w1WmJwx1nZCeEG', NULL, '2025-05-10 13:44:17', '2025-05-10 13:44:17', NULL, 0);
INSERT INTO `users` VALUES (5, 'daddy', '224455@qq.com', '$2a$10$sfqryMch3vpWMliUg16XXe3WR3eGzafiUwXY7VbaigR2d23wqRRO6', NULL, '2025-05-10 13:46:12', '2025-05-10 13:46:12', NULL, 0);
INSERT INTO `users` VALUES (6, 'werrr', '222222@qq.com', '$2a$10$ETUTivcWtz/G.kWhgOFYyuDbU80cFiDvodLtJoeXP2omy.n8a1H3a', NULL, '2025-05-10 13:57:51', '2025-05-10 13:57:51', NULL, 0);

SET FOREIGN_KEY_CHECKS = 1;

-- 创建消息表
CREATE TABLE IF NOT EXISTS `messages` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `type` ENUM('like', 'comment') NOT NULL COMMENT '消息类型：点赞或评论',
  `sender_id` INT NOT NULL COMMENT '发送者ID',
  `receiver_id` INT NOT NULL COMMENT '接收者ID（帖子作者）',
  `post_id` INT NOT NULL COMMENT '相关帖子ID',
  `comment_id` INT NULL COMMENT '相关评论ID（评论类型消息才有）',
  `content` TEXT NULL COMMENT '消息内容（评论类型存储评论内容）',
  `is_read` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已读',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_receiver_id` (`receiver_id`),
  INDEX `idx_post_id` (`post_id`),
  INDEX `idx_sender_id` (`sender_id`),
  INDEX `idx_is_read` (`is_read`),
  INDEX `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 查询示例：查看消息记录
-- SELECT * FROM messages ORDER BY created_at DESC LIMIT 10;

-- 查询示例：获取用户未读消息
-- SELECT * FROM messages WHERE receiver_id = 1 AND is_read = 0 ORDER BY created_at DESC; 
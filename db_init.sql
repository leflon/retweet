/* Run these SQL queries to create the tables required for this app. */

CREATE TABLE `account` (
  `id` char(16) NOT NULL,
  `username` varchar(16) NOT NULL,
  `display_name` varchar(50) DEFAULT NULL,
  `password` char(60) NOT NULL,
  `created_at` DATETIME NOT NULL,
  `avatar_id` char(16) NOT NULL DEFAULT '0000000000000001',
  `banner_id` char(16) DEFAULT NULL,
  `bio` varchar(160) DEFAULT NULL,
  `website` varchar(50) DEFAULT NULL,
  `location` varchar(30) DEFAULT NULL,
  `follows` json NOT NULL,
  `followers` json NOT NULL,
  `likes` json NOT NULL,
  `is_admin` tinyint NOT NULL DEFAULT '0',
  `is_suspended` tinyint NOT NULL DEFAULT '0',
  `is_deleted` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`));

CREATE TABLE `tweet` (
  `id` CHAR(16) NOT NULL,
  `content` VARCHAR(45) NOT NULL,
  `author_id` CHAR(16) NOT NULL,
  `media_id` CHAR(16) NULL,
  `created_at` DATETIME NOT NULL,
  `likes` JSON NOT NULL,
  `replies` JSON NOT NULL,
  `retweets` JSON NOT NULL,
  `is_deleted` TINYINT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`));

CREATE TABLE `avatar` (
  `id` CHAR(16) NOT NULL,
  `file` VARCHAR(45) NOT NULL,
  `user_id` CHAR(16) NOT NULL,
  `created_at` DATETIME NOT NULL,
  `is_deleted` TINYINT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`));

CREATE TABLE `banner` (
  `id` CHAR(16) NOT NULL,
  `file` VARCHAR(45) NOT NULL,
  `user_id` CHAR(16) NOT NULL,
  `created_at` DATETIME NOT NULL,
  `is_deleted` TINYINT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`));

CREATE TABLE `media` (
  `id` CHAR(16) NOT NULL,
  `file` VARCHAR(45) NOT NULL,
  `tweet_id` CHAR(16) NOT NULL,
  `created_at` DATETIME NOT NULL,
  `is_deleted` TINYINT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`));

CREATE TABLE `id` (
  `id` CHAR(16) NOT NULL,
  `created_at` DATETIME NOT NULL,
  `type` TINYINT NOT NULL,
  PRIMARY KEY (`id`));
-- SoulSync Database Schema MySQL 8.0+
CREATE DATABASE IF NOT EXISTS soulsync_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE soulsync_db;

CREATE TABLE users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(150),
    avatar_url VARCHAR(500),
    bio TEXT,
    date_of_birth DATE,
    timezone VARCHAR(100) DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT TRUE,
    is_email_verified BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_email (email),
    UNIQUE KEY uk_users_username (username),
    INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE refresh_tokens (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    token VARCHAR(512) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_token (token),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE invite_codes (
    id BIGINT NOT NULL AUTO_INCREMENT,
    code VARCHAR(20) NOT NULL,
    creator_id BIGINT NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_invite_code (code),
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE couples (
    id BIGINT NOT NULL AUTO_INCREMENT,
    couple_code VARCHAR(20) NOT NULL,
    user1_id BIGINT NOT NULL,
    user2_id BIGINT NOT NULL,
    couple_name VARCHAR(200),
    anniversary_date DATE,
    status ENUM('ACTIVE','PAUSED','ENDED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_couple_code (couple_code),
    INDEX idx_couple_user1 (user1_id),
    INDEX idx_couple_user2 (user2_id),
    FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE messages (
    id BIGINT NOT NULL AUTO_INCREMENT,
    couple_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    content TEXT,
    message_type ENUM('TEXT','IMAGE','VOICE','VIDEO','EMOJI','SYSTEM') DEFAULT 'TEXT',
    media_url VARCHAR(500),
    reply_to_id BIGINT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_msg_couple_date (couple_id, created_at DESC),
    FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reply_to_id) REFERENCES messages(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE message_reactions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    message_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_reaction (message_id, user_id, emoji),
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE memories (
    id BIGINT NOT NULL AUTO_INCREMENT,
    couple_id BIGINT NOT NULL,
    uploader_id BIGINT NOT NULL,
    title VARCHAR(300) NOT NULL,
    caption TEXT,
    media_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    media_type ENUM('PHOTO','VIDEO','VOICE','DOCUMENT') DEFAULT 'PHOTO',
    file_size_bytes BIGINT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    location_name VARCHAR(300),
    memory_date DATE,
    is_favorite BOOLEAN DEFAULT FALSE,
    view_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_memories_couple_date (couple_id, memory_date DESC),
    FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE,
    FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE memory_tags (
    id BIGINT NOT NULL AUTO_INCREMENT,
    memory_id BIGINT NOT NULL,
    tag VARCHAR(100) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_tags_memory (memory_id),
    FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE moods (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    couple_id BIGINT NOT NULL,
    mood_score TINYINT NOT NULL COMMENT '1=Very Sad to 5=Very Happy',
    mood_label ENUM('ECSTATIC','HAPPY','CONTENT','NEUTRAL','ANXIOUS','SAD','ANGRY','LONELY') NOT NULL,
    note TEXT,
    energy_level TINYINT,
    logged_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_mood_user_date (user_id, logged_date),
    INDEX idx_moods_couple_date (couple_id, logged_date DESC),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE special_dates (
    id BIGINT NOT NULL AUTO_INCREMENT,
    couple_id BIGINT NOT NULL,
    created_by BIGINT NOT NULL,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    event_type ENUM('ANNIVERSARY','BIRTHDAY','FIRST_DATE','MILESTONE','HOLIDAY','OTHER') DEFAULT 'OTHER',
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_type ENUM('YEARLY','MONTHLY','WEEKLY') DEFAULT 'YEARLY',
    reminder_days INT DEFAULT 7,
    color_hex VARCHAR(7) DEFAULT '#FF6B9D',
    icon VARCHAR(50) DEFAULT 'heart',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_special_couple_date (couple_id, event_date),
    FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE love_notes (
    id BIGINT NOT NULL AUTO_INCREMENT,
    couple_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    title VARCHAR(300),
    content TEXT NOT NULL,
    media_url VARCHAR(500),
    is_scheduled BOOLEAN DEFAULT FALSE,
    deliver_at TIMESTAMP NULL,
    is_delivered BOOLEAN DEFAULT FALSE,
    delivered_at TIMESTAMP NULL,
    is_locked BOOLEAN DEFAULT FALSE,
    unlock_at TIMESTAMP NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    theme VARCHAR(50) DEFAULT 'default',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_love_notes_couple (couple_id),
    INDEX idx_love_notes_deliver (deliver_at, is_delivered),
    FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notifications (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    couple_id BIGINT,
    title VARCHAR(300) NOT NULL,
    body TEXT,
    notification_type ENUM('MESSAGE','MOOD','MEMORY','SPECIAL_DATE','LOVE_NOTE','SYSTEM','REMINDER') NOT NULL,
    reference_id BIGINT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_notif_user_read (user_id, is_read),
    INDEX idx_notif_created (created_at DESC),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample Data
INSERT INTO users (email, username, password_hash, display_name, bio) VALUES
('alice@soulsync.app', 'alice_heart', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYpfFh4LVPdLe4m', 'Alice', 'Living every moment with love'),
('bob@soulsync.app', 'bob_love', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYpfFh4LVPdLe4m', 'Bob', 'Making memories every day');

INSERT INTO couples (couple_code, user1_id, user2_id, couple_name, anniversary_date) VALUES
('SOUL123456', 1, 2, 'Alice & Bob', '2022-06-15');

INSERT INTO special_dates (couple_id, created_by, title, event_date, event_type, is_recurring) VALUES
(1, 1, 'Our Anniversary', '2025-06-15', 'ANNIVERSARY', TRUE),
(1, 1, 'First Date', '2022-02-14', 'FIRST_DATE', FALSE),
(1, 2, 'Bob Birthday', '1998-09-10', 'BIRTHDAY', TRUE);

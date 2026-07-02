-- =====================================================
-- USERS
-- =====================================================

DROP PROCEDURE IF EXISTS sp_create_user;
DELIMITER //
CREATE PROCEDURE sp_create_user(
    IN p_email VARCHAR(255),
    IN p_password VARCHAR(255),
    IN p_phone VARCHAR(20)
)
BEGIN
    INSERT INTO users(email, password_hash, phone, phone_verified, created_at, is_active)
    VALUES(p_email, p_password, p_phone, 1, NOW(), 1);
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_check_email_exists;
DELIMITER //
CREATE PROCEDURE sp_check_email_exists(
    IN p_email VARCHAR(255)
)
BEGIN
    SELECT * FROM users WHERE email = p_email;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_get_users;
DELIMITER //
CREATE PROCEDURE sp_get_users()
BEGIN
    SELECT * FROM users;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_disable_user;
DELIMITER //
CREATE PROCEDURE sp_disable_user(
    IN p_id_user INT
)
BEGIN
    UPDATE users SET is_active = 0 WHERE id_user = p_id_user;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_update_password;
DELIMITER //
CREATE PROCEDURE sp_update_password(
    IN p_id_user INT,
    IN p_password_hash VARCHAR(255)
)
BEGIN
    UPDATE users SET password_hash = p_password_hash WHERE id_user = p_id_user;
END //
DELIMITER ;

-- =====================================================
-- PROFILES
-- =====================================================

DROP PROCEDURE IF EXISTS sp_create_profile;
DELIMITER //
CREATE PROCEDURE sp_create_profile(
    IN p_name VARCHAR(45),
    IN p_avatar_url VARCHAR(500),
    IN p_id_user INT
)
BEGIN
    INSERT INTO profiles(name, avatar_url, created_at, updated_at, id_user)
    VALUES(p_name, p_avatar_url, NOW(), NOW(), p_id_user);
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_get_profile;
DELIMITER //
CREATE PROCEDURE sp_get_profile(
    IN p_id_user INT
)
BEGIN
    SELECT * FROM profiles WHERE id_user = p_id_user;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_update_profile;
DELIMITER //
CREATE PROCEDURE sp_update_profile(
    IN p_id_user INT,
    IN p_name VARCHAR(45),
    IN p_avatar_url VARCHAR(500)
)
BEGIN
    UPDATE profiles
    SET name = p_name, avatar_url = p_avatar_url, updated_at = NOW()
    WHERE id_user = p_id_user;
END //
DELIMITER ;

-- =====================================================
-- POSTS
-- =====================================================

DROP PROCEDURE IF EXISTS sp_create_post;
DELIMITER //
CREATE PROCEDURE sp_create_post(
    IN p_title VARCHAR(45),
    IN p_description TEXT,
    IN p_image_url VARCHAR(500),
    IN p_id_user INT,
    IN p_id_category INT
)
BEGIN
    INSERT INTO posts(title, description, image_url, created_at, is_active, id_user, id_category)
    VALUES(p_title, p_description, p_image_url, NOW(), 1, p_id_user, p_id_category);
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_get_posts;
DELIMITER //
CREATE PROCEDURE sp_get_posts()
BEGIN
    SELECT
        p.id_post,
        p.title,
        p.description,
        p.image_url,
        p.created_at,
        pr.name       AS author,
        pr.avatar_url AS author_avatar,
        c.name        AS category,
        c.id_category,
        u.phone       AS author_phone,
        u.email       AS author_email
    FROM posts p
    INNER JOIN profiles   pr ON p.id_user     = pr.id_user
    INNER JOIN categories c  ON p.id_category = c.id_category
    INNER JOIN users      u  ON p.id_user     = u.id_user
    WHERE p.is_active = 1
    ORDER BY p.created_at DESC;
END //
DELIMITER ;

-- =====================================================
-- SUPPORT TICKETS
-- =====================================================

DROP PROCEDURE IF EXISTS sp_create_ticket;
DELIMITER //
CREATE PROCEDURE sp_create_ticket(
    IN p_subject VARCHAR(100),
    IN p_id_user INT
)
BEGIN
    INSERT INTO support_tickets(subject, status, created_at, id_user)
    VALUES(p_subject, 'OPEN', NOW(), p_id_user);
    SELECT LAST_INSERT_ID() AS id_ticket;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_get_tickets;
DELIMITER //
CREATE PROCEDURE sp_get_tickets(
    IN p_id_user INT
)
BEGIN
    SELECT * FROM support_tickets
    WHERE id_user = p_id_user
    ORDER BY created_at DESC;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_close_ticket;
DELIMITER //
CREATE PROCEDURE sp_close_ticket(
    IN p_id_ticket INT
)
BEGIN
    UPDATE support_tickets
    SET status = 'CLOSED', closed_at = NOW()
    WHERE id_ticket = p_id_ticket;
END //
DELIMITER ;

-- =====================================================
-- SUPPORT MESSAGES
-- =====================================================

DROP PROCEDURE IF EXISTS sp_create_message;
DELIMITER //
CREATE PROCEDURE sp_create_message(
    IN p_message TEXT,
    IN p_id_ticket INT,
    IN p_id_user INT
)
BEGIN
    INSERT INTO support_messages(message, created_at, id_ticket, id_user)
    VALUES(p_message, NOW(), p_id_ticket, p_id_user);
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_get_messages;
DELIMITER //
CREATE PROCEDURE sp_get_messages(
    IN p_id_ticket INT
)
BEGIN
    SELECT
        sm.id_message,
        sm.message,
        sm.created_at,
        sm.id_user,
        pr.name AS sender_name,
        pr.avatar_url AS sender_avatar
    FROM support_messages sm
    INNER JOIN profiles pr ON sm.id_user = pr.id_user
    WHERE sm.id_ticket = p_id_ticket
    ORDER BY sm.created_at ASC;
END //
DELIMITER ;

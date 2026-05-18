USE marketplace_db;

/* =====================================================
   USERS PROCEDURES
===================================================== */

DELIMITER //

CREATE PROCEDURE sp_create_user(
    IN p_email VARCHAR(255),
    IN p_password VARCHAR(255)
)
BEGIN

    INSERT INTO users(
        email,
        password_hash,
        created_at,
        is_active
    )
    VALUES(
        p_email,
        p_password,
        NOW(),
        1
    );

END //

DELIMITER ;

/* ----------------------------------------------------- */

DELIMITER //

CREATE PROCEDURE sp_check_email_exists(
    IN p_email VARCHAR(255)
)
BEGIN

    SELECT *
    FROM users
    WHERE email = p_email;

END //

DELIMITER ;

/* ----------------------------------------------------- */

DELIMITER //

CREATE PROCEDURE sp_get_users()
BEGIN

    SELECT *
    FROM users;

END //

DELIMITER ;

/* ----------------------------------------------------- */

DELIMITER //

CREATE PROCEDURE sp_disable_user(
    IN p_id_user INT
)
BEGIN

    UPDATE users
    SET is_active = 0
    WHERE id_user = p_id_user;

END //

DELIMITER ;


/* =====================================================
   PROFILE PROCEDURES
===================================================== */

DELIMITER //

CREATE PROCEDURE sp_create_profile(
    IN p_name VARCHAR(45),
    IN p_avatar_url VARCHAR(255),
    IN p_id_user INT
)
BEGIN

    INSERT INTO profiles(
        name,
        avatar_url,
        created_at,
        updated_at,
        id_user
    )
    VALUES(
        p_name,
        p_avatar_url,
        NOW(),
        NOW(),
        p_id_user
    );

END //

DELIMITER ;

/* ----------------------------------------------------- */

DELIMITER //

CREATE PROCEDURE sp_get_profile(
    IN p_id_user INT
)
BEGIN

    SELECT *
    FROM profiles
    WHERE id_user = p_id_user;

END //

DELIMITER ;

/* ----------------------------------------------------- */

DELIMITER //

CREATE PROCEDURE sp_update_profile(
    IN p_id_user INT,
    IN p_name VARCHAR(45),
    IN p_avatar_url VARCHAR(255)
)
BEGIN

    UPDATE profiles
    SET
        name = p_name,
        avatar_url = p_avatar_url,
        updated_at = NOW()
    WHERE id_user = p_id_user;

END //

DELIMITER ;

/* ----------------------------------------------------- */

DELIMITER //

CREATE PROCEDURE sp_update_password(
    IN p_id_user INT,
    IN p_password_hash VARCHAR(255)
)
BEGIN

    UPDATE users
    SET password_hash = p_password_hash
    WHERE id_user = p_id_user;

END //

DELIMITER ;

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_login TEXT NOT NULL UNIQUE,
    password_or_hash TEXT NOT NULL,
    active TINYINT(1) DEFAULT 1,
    email TEXT NOT NULL,
    role INTEGER NOT NULL DEFAULT 3,
    phone TEXT,
    address TEXT,
    recover_token TEXT,
    recover_token_valid_timestamp INT,
    consecutive_failure INT,
    last_login_timestamp INT,
    last_login_ip TEXT,
    password_history TEXT,
    last_change_password_timestamp INT DEFAULT (strftime('%s', 'now') * 1000),
    password_retries NUMBER DEFAULT 0
);

CREATE TABLE login_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT,
    user_login TEXT,
    timestamp INT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_login) REFERENCES users(user_login)
);

INSERT INTO users(user_login, password_or_hash, email, active, role) VALUES ('admin', '$2a$10$z/sinyKOs52U5p1bfgUg2.0WNzjcS4ZgcF4dL3GQCnjh/CR2/5UHK', 'admin@hoang.com', 1, 1);
INSERT INTO users(user_login, password_or_hash, email, active, role) VALUES ('hoang', '$2a$10$N6fWdfFattiNnusj44hs2eRAOXMetD9ExzSstlDHCWXZ3LWw7crT2', 'hoang@hoang.com', 1, 3);
INSERT INTO users(user_login, password_or_hash, email, active, role) VALUES ('nhi', '$2a$10$Dm2QRldE6MZCdn0OoMDMDuIaaXoayosLeZefyRm2DC4RKs4dKF97O', 'nhi@hoang.com', 1, 3);
-- Users table: supports guest, email/password, and OAuth2 accounts
CREATE TABLE IF NOT EXISTS users (
    id              BIGSERIAL PRIMARY KEY,
    email           VARCHAR(255) UNIQUE,
    display_name    VARCHAR(100),
    avatar_url      TEXT,
    provider        VARCHAR(20) NOT NULL DEFAULT 'local',   -- 'local', 'google', 'guest'
    provider_id     VARCHAR(255),                            -- Google sub / device ID
    spicy           BOOLEAN NOT NULL DEFAULT false,
    vegetarian      BOOLEAN NOT NULL DEFAULT false,
    no_seafood      BOOLEAN NOT NULL DEFAULT false,
    role            VARCHAR(20) NOT NULL DEFAULT 'USER',     -- 'USER', 'ADMIN'
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

-- Guest devices table: maps anonymous devices to guest user records
CREATE TABLE IF NOT EXISTS guest_devices (
    id          BIGSERIAL PRIMARY KEY,
    device_id   VARCHAR(255) NOT NULL UNIQUE,
    os          VARCHAR(20) NOT NULL,  -- 'ios', 'android', 'web'
    user_id     BIGINT NOT NULL REFERENCES users(id),
    created_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_provider_id ON users(provider, provider_id);
CREATE INDEX IF NOT EXISTS idx_guest_devices_device_id ON guest_devices(device_id);

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

-- ============================================================
-- Categories & POI (Points of Interest) tables
-- ============================================================

CREATE TABLE IF NOT EXISTS categories (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    icon_url    TEXT,
    sort_order  INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pois (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(255) NOT NULL UNIQUE,
    description     TEXT,
    address         VARCHAR(500),
    district        VARCHAR(100),
    ward            VARCHAR(100),
    phone           VARCHAR(50),
    opening_hours   VARCHAR(255),
    price_range_min INT,
    price_range_max INT,
    avg_rating      NUMERIC(3,2) NOT NULL DEFAULT 0,
    review_count    INT NOT NULL DEFAULT 0,
    popularity      INT NOT NULL DEFAULT 0,
    audio_url       TEXT,
    thumbnail_url   TEXT,
    category_id     BIGINT REFERENCES categories(id),
    location        GEOGRAPHY(Point, 4326) NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS poi_images (
    id      BIGSERIAL PRIMARY KEY,
    poi_id  BIGINT NOT NULL REFERENCES pois(id) ON DELETE CASCADE,
    url     TEXT NOT NULL,
    caption VARCHAR(255),
    sort_order INT NOT NULL DEFAULT 0
);

-- Spatial index for bounding-box (viewport) and radius queries
CREATE INDEX IF NOT EXISTS idx_pois_location ON pois USING GIST (location);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_pois_name_fts ON pois USING GIN (to_tsvector('simple', name));

-- Category filter
CREATE INDEX IF NOT EXISTS idx_pois_category ON pois(category_id);

-- District/ward filter
CREATE INDEX IF NOT EXISTS idx_pois_district_ward ON pois(district, ward);

-- Seed categories
INSERT INTO categories (name, slug, sort_order) VALUES
    ('Ốc & Hải sản',       'oc-hai-san',        1),
    ('Ăn vặt chợ 200',     'an-vat-cho-200',     2),
    ('Phá lấu',            'pha-lau',            3),
    ('Món nước',            'mon-nuoc',           4),
    ('Cà phê hoài niệm',   'ca-phe-hoai-niem',   5)
ON CONFLICT (slug) DO NOTHING;

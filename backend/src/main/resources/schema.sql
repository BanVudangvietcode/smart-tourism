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

-- ============================================================
-- Menu & Dishes tables
-- ============================================================

CREATE TABLE IF NOT EXISTS menu_categories (
    id          BIGSERIAL PRIMARY KEY,
    poi_id      BIGINT REFERENCES pois(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    sort_order  INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dishes (
    id               BIGSERIAL PRIMARY KEY,
    poi_id           BIGINT NOT NULL REFERENCES pois(id) ON DELETE CASCADE,
    menu_category_id BIGINT REFERENCES menu_categories(id) ON DELETE SET NULL,
    name             VARCHAR(255) NOT NULL,
    slug             VARCHAR(255),
    description      TEXT,
    price            INT NOT NULL DEFAULT 0,
    original_price   INT,
    unit             VARCHAR(50) DEFAULT 'phần',
    is_signature     BOOLEAN NOT NULL DEFAULT false, -- cờ Best-seller
    thumbnail_url    TEXT,
    ingredients      TEXT,                          -- thành phần chính
    allergens        TEXT,                          -- cảnh báo dị ứng tổng hợp
    has_peanuts      BOOLEAN NOT NULL DEFAULT false,-- cảnh báo dị ứng đậu phộng
    has_seafood      BOOLEAN NOT NULL DEFAULT false,-- cảnh báo dị ứng hải sản
    has_gluten       BOOLEAN NOT NULL DEFAULT false,-- cảnh báo dị ứng gluten
    sort_order       INT NOT NULL DEFAULT 0,
    created_at       TIMESTAMP NOT NULL DEFAULT now(),
    updated_at       TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dish_images (
    id          BIGSERIAL PRIMARY KEY,
    dish_id     BIGINT NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    url         TEXT NOT NULL,
    caption     VARCHAR(255),
    is_close_up BOOLEAN NOT NULL DEFAULT true,      -- hình ảnh cận cảnh
    sort_order  INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_menu_categories_poi ON menu_categories(poi_id);
CREATE INDEX IF NOT EXISTS idx_dishes_poi ON dishes(poi_id);
CREATE INDEX IF NOT EXISTS idx_dishes_category ON dishes(menu_category_id);
CREATE INDEX IF NOT EXISTS idx_dishes_signature ON dishes(is_signature);
CREATE INDEX IF NOT EXISTS idx_dish_images_dish ON dish_images(dish_id);

-- Seed POIs (Quán Ốc Oanh, Phá Lấu Cô Thảo)
INSERT INTO pois (id, name, slug, description, address, district, ward, phone, opening_hours, price_range_min, price_range_max, avg_rating, review_count, popularity, audio_url, thumbnail_url, category_id, location)
VALUES
    (1, 'Quán Ốc Oanh', 'quan-oc-oanh',
     'Quán ốc nức tiếng phố ẩm thực Vĩnh Khánh với đa dạng các món ốc chảo thơm lừng, sốt trứng muối và bơ tỏi đặc trưng.',
     '534 Vĩnh Khánh', 'Quận 4', 'Phường 8', '0903123456', '15:00 - 23:00', 50000, 200000, 4.6, 320, 95,
     'https://cdn.example.com/audio/oc-oanh-guide.mp3',
     'https://images.unsplash.com/photo-1544025162-d76694265947?w=800', 1,
     ST_SetSRID(ST_MakePoint(106.7025, 10.7612), 4326)::geography),
    (2, 'Phá Lấu Bò Cô Thảo', 'pha-lau-bo-co-thao',
     'Phá lấu nước dừa béo thơm đậm đà, nước chấm tắc me ớt chua cay chuẩn vị chợ 200 truyền thống.',
     '243/29 Tôn Đản', 'Quận 4', 'Phường 15', '0908765432', '12:00 - 20:00', 30000, 70000, 4.8, 540, 98,
     'https://cdn.example.com/audio/pha-lau-co-thao.mp3',
     'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800', 3,
     ST_SetSRID(ST_MakePoint(106.7042, 10.7588), 4326)::geography)
ON CONFLICT (slug) DO NOTHING;

-- Seed Menu Categories for Quán Ốc Oanh (poi_id = 1)
INSERT INTO menu_categories (id, poi_id, name, sort_order) VALUES
    (1, 1, 'Món ăn chơi', 1),
    (2, 1, 'Món chính', 2),
    (3, 1, 'Đồ uống', 3),
    (4, 2, 'Món ăn chơi', 1),
    (5, 2, 'Món chính', 2),
    (6, 2, 'Đồ uống', 3)
ON CONFLICT (id) DO NOTHING;

-- Seed Dishes for Quán Ốc Oanh (poi_id = 1)
INSERT INTO dishes (id, poi_id, menu_category_id, name, slug, description, price, original_price, unit, is_signature, thumbnail_url, ingredients, allergens, has_peanuts, has_seafood, has_gluten, sort_order)
VALUES
    -- Món ăn chơi
    (1, 1, 1, 'Càng ghẹ rang muối ớt', 'cang-ghe-rang-muoi-ot',
     'Càng ghẹ biển tươi rang khô cùng muối ớt hột Tây Ninh, lớp vỏ giòn cay mặn ngọt bùng nổ vị giác.',
     110000, 125000, 'dĩa', true,
     'https://images.unsplash.com/photo-1559847844-5315695dadae?w=800',
     'Càng ghẹ biển tươi sống, Muối hột Tây Ninh, Ớt hiểm, Tỏi băm, Đường mía',
     'Hải sản (Cua, Ghẹ)', false, true, false, 1),
    (2, 1, 1, 'Ốc móng tay xào rau muống', 'oc-mong-tay-xao-rau-muong',
     'Ốc móng tay béo ngọt xào lửa lớn cùng rau muống non giòn sần sật và tỏi phi thơm nức.',
     75000, NULL, 'dĩa', false,
     'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=800',
     'Ốc móng tay sống, Rau muống đọt non, Tỏi phi, Dầu hào, Nước mắm cá cơm',
     'Hải sản, Đậu nành (trong dầu hào)', false, true, false, 2),
    (3, 1, 1, 'Đậu phộng rang tỏi ớt lá chanh', 'dau-phong-rang-toi-ot-la-chanh',
     'Món khai vị nhâm nhi giòn rụm với hạt đậu phộng béo bùi tẩm ớt bột và lá chanh thái sợi.',
     30000, NULL, 'đĩa nhỏ', false,
     'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800',
     'Đậu phộng loại 1, Tỏi phi, Ớt khô, Lá chanh non, Nước mắm đường',
     'Đậu phộng (Lạc)', true, false, false, 3),

    -- Món chính
    (4, 1, 2, 'Ốc hương sốt trứng muối', 'oc-huong-sot-trung-muoi',
     'Best-seller đỉnh chóp: Ốc hương biển tươi giòn ngọt quyện sốt trứng muối béo ngậy, bơ thơm lừng ăn kèm bánh mì nóng giòn.',
     135000, 150000, 'phần', true,
     'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
     'Ốc hương tươi sống, Lòng đỏ trứng muối, Bơ lạt Anchor, Sữa tươi, Tỏi băm, Ớt sừng, Ăn kèm bánh mì giòn',
     'Hải sản, Trứng, Sữa, Gluten (trong bánh mì)', false, true, true, 1),
    (5, 1, 2, 'Sò điệp nướng mỡ hành phô mai', 'so-diep-nuong-mo-hanh-pho-mai',
     'Sò điệp nướng than hồng thơm phức rưới mỡ hành xanh mướt, rắc đậu phộng rang giã dập và phô mai kéo sợi.',
     95000, NULL, 'dĩa', true,
     'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800',
     'Sò điệp Nhật, Hành lá tươi, Mỡ heo sạch, Đậu phộng rang, Phô mai Mozzarella',
     'Hải sản, Đậu phộng, Sữa (trong phô mai)', true, true, false, 2),
    (6, 1, 2, 'Nghêu hấp sả Thái chua cay', 'ngheu-hap-sa-thai-chua-cay',
     'Nghêu tươi thịt dày nấu cùng nước dùng sả gừng lá chúc kiểu Thái cay nồng ấm bụng.',
     65000, NULL, 'thố', false,
     'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
     'Nghêu sống, Sả cây đập dập, Nước cốt chanh, Riềng tươi, Ớt hiểm, Lá chanh',
     'Hải sản (Nghêu)', false, true, false, 3),

    -- Đồ uống
    (7, 1, 3, 'Trà đào cam sả hạt chia', 'tra-dao-cam-sa-hat-chia',
     'Trà đen ủ lạnh giải nhiệt cực đã kết hợp miếng đào giòn ngâm, cam vàng tươi mọng nước và hạt chia dinh dưỡng.',
     35000, NULL, 'ly', true,
     'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800',
     'Trà đen hảo hạng, Đào miếng giòn ngâm, Nước cốt cam tươi, Sả cây, Hạt chia Organic',
     'Không chứa chất dị ứng', false, false, false, 1),
    (8, 1, 3, 'Nước mía sầu riêng sủi bọt', 'nuoc-mia-sau-rieng-sui-bot',
     'Mía tươi ép cùng cơm sầu riêng Ri6 thơm lừng béo ngậy đặc sản Chợ 200.',
     25000, NULL, 'ly', false,
     'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=800',
     'Nước mía ngọt thanh, Cơm sầu riêng Ri6 tươi, Tắc trái',
     'Không chứa chất dị ứng', false, false, false, 2),
    (9, 1, 3, 'Bia Sài Gòn Special ướp lạnh', 'bia-sai-gon-special',
     'Bia lúa mạch thượng hạng giải nhiệt sảng khoái khi thưởng thức ốc đường phố.',
     22000, NULL, 'lon', false,
     'https://images.unsplash.com/photo-1608270118021-996ff629c13b?w=800',
     '100% lúa mạch mùa xuân, Hoa bia cao cấp, Men bia thuần chủng',
     'Gluten (từ lúa mạch)', false, false, true, 3),

    -- Dishes for Phá Lấu Cô Thảo (poi_id = 2)
    (10, 2, 5, 'Phá lấu bò thập cẩm chén + Bánh mì', 'pha-lau-bo-thap-cam',
     'Tổ ong, lá xách, gan và phèo bò ninh mềm béo ngậy trong nước cốt dừa tươi, ăn kèm chén nước mắm tắc me chua cay và bánh mì giòn.',
     35000, NULL, 'phần', true,
     'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
     'Lá xách, tổ ong, gan, phèo bò tươi, Nước dừa xiêm, Quế, Hồi, Bánh mì giòn, Nước mắm tắc me',
     'Không chứa chất gây dị ứng phổ biến', false, false, false, 1),
    (11, 2, 4, 'Phá lấu chiên bơ tỏi giòn rụm', 'pha-lau-chien-bo-toi',
     'Phá lấu luộc mềm đảo bơ tỏi cháy cạnh thơm lừng nức mũi, lớp da giòn sần sật ăn cùng rau răm và muối tiêu tắc.',
     45000, 50000, 'dĩa', true,
     'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
     'Lòng bò luộc mềm, Bơ lạt thơm béo, Tỏi phi giòn, Ớt sừng, Rau răm, Muối tiêu tắc',
     'Sữa (từ bơ)', false, false, false, 2),
    (12, 2, 5, 'Mì gói xào phá lấu rau muống', 'mi-goi-xao-pha-lau',
     'Mì tôm trụng vừa chín tới xào lửa lớn với phá lấu bò đậm vị, rau muống non giòn ngọt và tóp mỡ giòn rụm.',
     40000, NULL, 'dĩa', false,
     'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=800',
     'Mì tôm Miliket, Phá lấu bò thập cẩm, Rau muống đọt, Tóp mỡ, Tỏi phi, Nước sốt me cay',
     'Gluten (từ mì gói), Đậu nành', false, false, true, 3),
    (13, 2, 6, 'Trà tắc sả hạt chia mát lạnh', 'tra-tac-sa-hat-chia',
     'Trà lài ủ lạnh chua thanh ngọt dịu, sả cây đập dập thơm mát và hạt chia bổ dưỡng.',
     18000, NULL, 'ly', false,
     'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800',
     'Trà hoa lài, Tắc tươi, Đường mía, Sả tươi, Hạt chia Organic',
     'Không chứa chất gây dị ứng', false, false, false, 1),
    (14, 2, 6, 'Sữa đậu nành bắp ngọt nguyên chất', 'sua-dau-nanh-bap',
     'Sữa đậu nành hữu cơ nấu cùng bắp ngọt Mỹ xay mịn, vị ngọt tự nhiên thanh mát.',
     15000, NULL, 'ly', false,
     'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=800',
     'Hạt đậu nành sạch, Bắp ngọt Mỹ, Lá dứa thơm, Sữa tươi tiệt trùng',
     'Đậu nành, Sữa', false, false, false, 2)
ON CONFLICT (id) DO NOTHING;


-- Seed Close-up Images for Dishes
INSERT INTO dish_images (dish_id, url, caption, is_close_up, sort_order) VALUES
    (4, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200',
     'Cận cảnh sốt trứng muối vàng ươm sánh mịn bao quanh từng con ốc hương', true, 1),
    (4, 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1200',
     'Cận cảnh bánh mì nóng hổi giòn rụm chấm ngập trong sốt bơ trứng muối béo ngậy', true, 2),
    (1, 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=1200',
     'Cận cảnh lớp muối tuyết Tây Ninh phủ đều trên càng ghẹ nướng thơm lừng', true, 1),
    (5, 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=1200',
     'Cận cảnh phô mai kéo sợi thơm ngậy và đậu phộng rắc trên thịt sò điệp tươi', true, 1),
    (7, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=1200',
     'Cận cảnh lát cam tươi mọng nước và hạt chia thanh mát nổi bật trong ly trà đào', true, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Audio & Streaming tables
-- ============================================================

CREATE TABLE IF NOT EXISTS poi_audios (
    id               BIGSERIAL PRIMARY KEY,
    poi_id           BIGINT NOT NULL UNIQUE REFERENCES pois(id) ON DELETE CASCADE,
    title            VARCHAR(255) NOT NULL,
    file_name        VARCHAR(255) NOT NULL,
    duration_seconds INT NOT NULL DEFAULT 0,
    file_size_bytes  BIGINT NOT NULL DEFAULT 0,
    voice            VARCHAR(100) NOT NULL DEFAULT 'Nữ miền Nam (Truyền cảm)',
    language         VARCHAR(10) NOT NULL DEFAULT 'vi',
    zone             VARCHAR(50) NOT NULL DEFAULT 'quan4',
    transcript       TEXT NOT NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT now(),
    updated_at       TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_poi_audios_poi ON poi_audios(poi_id);
CREATE INDEX IF NOT EXISTS idx_poi_audios_zone ON poi_audios(zone);

-- Seed Audio Records
INSERT INTO poi_audios (poi_id, title, file_name, duration_seconds, file_size_bytes, voice, language, zone, transcript)
VALUES
    (1, 'Thuyết minh Phố Ốc Vĩnh Khánh & Quán Ốc Oanh', 'poi_1_oc_oanh.mp3', 64, 384192,
     'Nữ miền Nam (Truyền cảm)', 'vi', 'quan4',
     'Chào mừng quý khách đến với phố ẩm thực Vĩnh Khánh, quận 4 – thiên đường ốc đêm sôi động bậc nhất Sài Gòn. Ngay trước mắt bạn là Quán Ốc Oanh, địa chỉ quen thuộc của giới sành ăn hơn 15 năm qua. Điểm đặc biệt làm nên tên tuổi của Ốc Oanh chính là đĩa ốc hương sốt trứng muối vàng ươm, nước sốt béo ngậy được nêm nếm đậm đà ăn kèm bánh mì nóng giòn. Ngoài ra, càng ghẹ rang muối ớt khô giòn cay nồng hay sò điệp nướng mỡ hành phô mai kéo sợi cũng là những món bạn nhất định phải thử. Tiếng xèo xèo của chảo ốc trên lửa lớn cùng mùi thơm nồng của bơ tỏi sẽ mang đến cho bạn một trải nghiệm ẩm thực đường phố đậm chất phương Nam khó quên.'),
    (2, 'Thuyết minh Chợ 200 & Phá Lấu Bò Cô Thảo', 'poi_2_pha_lau_co_thao.mp3', 64, 383232,
     'Nữ miền Nam (Ấm áp)', 'vi', 'quan4',
     'Bạn đang dừng chân tại con hẻm 243 Tôn Đản, bước vào khu ẩm thực Chợ 200 nức tiếng của Quận 4. Quán Phá lấu bò Cô Thảo đã đỏ lửa hơn 20 năm tại góc hẻm này. Từng miếng lá xách, tổ ong, gan, phèo được làm sạch kỹ lưỡng, ninh mềm trong nước cốt dừa tươi béo ngậy cùng hoa hồi và quế thơm phức. Khi thưởng thức, bạn hãy dùng xiên tre gắp một miếng phá lấu giòn sần sật, chấm ngập vào chén nước mắm tắc me ớt chua cay độc quyền, rồi cắn thêm miếng bánh mì giòn rụm. Hương vị béo ngậy quyện vị chua ngọt hài hòa sẽ lý giải vì sao người Sài Gòn lại say mê món ăn này đến thế.')
ON CONFLICT (poi_id) DO NOTHING;

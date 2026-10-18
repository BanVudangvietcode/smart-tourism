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
    poi_type        VARCHAR(20) NOT NULL DEFAULT 'FOOD', -- 'FOOD', 'LANDMARK', 'RELIGIOUS', 'HISTORICAL'
    location        GEOGRAPHY(Point, 4326) NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT true,
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

-- POI Type filter
CREATE INDEX IF NOT EXISTS idx_pois_type ON pois(poi_type);

-- District/ward filter
CREATE INDEX IF NOT EXISTS idx_pois_district_ward ON pois(district, ward);

-- Seed categories
INSERT INTO categories (id, name, slug, sort_order) VALUES
    (1, 'Ốc & Hải sản',        'oc-hai-san',        1),
    (2, 'Ăn vặt chợ 200',      'an-vat-cho-200',     2),
    (3, 'Phá lấu',             'pha-lau',            3),
    (4, 'Món nước',             'mon-nuoc',           4),
    (5, 'Cà phê hoài niệm',    'ca-phe-hoai-niem',   5),
    (6, 'Di tích & Lịch sử',   'di-tich-lich-su',   6),
    (7, 'Chùa & Nhà thờ',      'chua-nha-tho',      7),
    (8, 'Cảnh quan & Check-in', 'canh-quan-checkin', 8)
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
    is_available     BOOLEAN NOT NULL DEFAULT true, -- trạng thái còn hàng / ẩn món
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

-- Seed POIs (Ẩm thực & Danh lam thắng cảnh Quận 4)
INSERT INTO pois (id, name, slug, poi_type, description, address, district, ward, phone, opening_hours, price_range_min, price_range_max, avg_rating, review_count, popularity, audio_url, thumbnail_url, category_id, location)
VALUES
    (1, 'Quán Ốc Oanh', 'quan-oc-oanh', 'FOOD',
     'Quán ốc nức tiếng phố ẩm thực Vĩnh Khánh với đa dạng các món ốc chảo thơm lừng, sốt trứng muối và bơ tỏi đặc trưng.',
     '534 Vĩnh Khánh', 'Quận 4', 'Phường 8', '0903123456', '15:00 - 23:00', 50000, 200000, 4.6, 320, 95,
     'https://cdn.example.com/audio/oc-oanh-guide.mp3',
     'https://images.unsplash.com/photo-1544025162-d76694265947?w=800', 1,
     ST_SetSRID(ST_MakePoint(106.7025, 10.7612), 4326)::geography),
    (2, 'Phá Lấu Bò Cô Thảo', 'pha-lau-bo-co-thao', 'FOOD',
     'Phá lấu nước dừa béo thơm đậm đà, nước chấm tắc me ớt chua cay chuẩn vị chợ 200 truyền thống.',
     '243/29 Tôn Đản', 'Quận 4', 'Phường 15', '0908765432', '12:00 - 20:00', 30000, 70000, 4.8, 540, 98,
     'https://cdn.example.com/audio/pha-lau-co-thao.mp3',
     'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800', 3,
     ST_SetSRID(ST_MakePoint(106.7042, 10.7588), 4326)::geography),
    (3, 'Bảo tàng Hồ Chí Minh - Bến Nhà Rồng', 'ben-nha-rong', 'HISTORICAL',
     'Di tích lịch sử cấp quốc gia đặc biệt, nơi người thanh niên yêu nước Nguyễn Tất Thành ra đi tìm đường cứu nước vào ngày 5/6/1911. Tòa nhà mang kiến trúc Pháp cổ kính bên ngã ba sông Sài Gòn.',
     '01 Nguyễn Tất Thành', 'Quận 4', 'Phường 12', '02839401053', '07:30 - 11:30, 13:30 - 17:00 (Thứ 3 - CN)', 30000, 30000, 4.8, 1250, 99,
     'https://cdn.example.com/audio/ben-nha-rong.mp3',
     'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800', 6,
     ST_SetSRID(ST_MakePoint(106.7068, 10.7682), 4326)::geography),
    (4, 'Nhà thờ Xóm Chiếu', 'nha-tho-xom-chieu', 'RELIGIOUS',
     'Một trong những giáo xứ lâu đời nhất tại Sài Gòn với lịch sử hơn 160 năm. Ngôi thánh đường mang phong cách Gothic giao thoa kiến trúc bản địa, không gian linh thiêng giữa xóm đạo Quận 4.',
     '200 Lê Quốc Hưng', 'Quận 4', 'Phường 12', '02839400264', '05:00 - 19:30', 0, 0, 4.7, 480, 92,
     'https://cdn.example.com/audio/nha-tho-xom-chieu.mp3',
     'https://images.unsplash.com/photo-1548625361-195fe57876a4?w=800', 7,
     ST_SetSRID(ST_MakePoint(106.7080, 10.7590), 4326)::geography),
    (5, 'Cầu Mống', 'cau-mong', 'LANDMARK',
     'Cây cầu thép cổ xưa nhất Sài Gòn nối liền Quận 1 và Quận 4, bắc qua dòng kênh Bến Nghé. Điểm check-in ngắm hoàng hôn và bình minh tuyệt đẹp của giới trẻ thành phố.',
     'Bến Vân Đồn - Bến Chương Dương', 'Quận 4', 'Phường 12', NULL, 'Mở cửa cả ngày (24/7)', 0, 0, 4.6, 680, 90,
     'https://cdn.example.com/audio/cau-mong.mp3',
     'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800', 8,
     ST_SetSRID(ST_MakePoint(106.7037, 10.7695), 4326)::geography),
    (6, 'Chùa Giác Nguyên', 'chua-giac-nguyen', 'RELIGIOUS',
     'Ngôi cổ tự thanh tịnh nằm sâu trong hẻm Bến Vân Đồn, đối diện kênh Bến Nghé. Nơi lưu giữ nét văn hóa tâm linh Phật giáo truyền thống và nhiều hoạt động thiện nguyện giàu ý nghĩa.',
     '129F/95 Bến Vân Đồn', 'Quận 4', 'Phường 8', '02838261234', '06:00 - 20:00', 0, 0, 4.6, 210, 88,
     'https://cdn.example.com/audio/chua-giac-nguyen.mp3',
     'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800', 7,
     ST_SetSRID(ST_MakePoint(106.6985, 10.7582), 4326)::geography)
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
     'Bạn đang dừng chân tại con hẻm 243 Tôn Đản, bước vào khu ẩm thực Chợ 200 nức tiếng của Quận 4. Quán Phá lấu bò Cô Thảo đã đỏ lửa hơn 20 năm tại góc hẻm này. Từng miếng lá xách, tổ ong, gan, phèo được làm sạch kỹ lưỡng, ninh mềm trong nước cốt dừa tươi béo ngậy cùng hoa hồi và quế thơm phức. Khi thưởng thức, bạn hãy dùng xiên tre gắp một miếng phá lấu giòn sần sật, chấm ngập vào chén nước mắm tắc me ớt chua cay độc quyền, rồi cắn thêm miếng bánh mì giòn rụm. Hương vị béo ngậy quyện vị chua ngọt hài hòa sẽ lý giải vì sao người Sài Gòn lại say mê món ăn này đến thế.'),
    (3, 'Thuyết minh Di tích Lịch sử Bến Nhà Rồng', 'poi_3_ben_nha_rong.mp3', 85, 510000,
     'Nữ miền Nam (Trang trọng)', 'vi', 'quan4',
     'Chào mừng bạn đến với Bến Nhà Rồng, nay là Bảo tàng Hồ Chí Minh chi nhánh Thành phố Hồ Chí Minh. Tòa nhà được xây dựng từ năm 1863 bởi Công ty Vận tải đường biển Pháp Messageries Maritimes. Điểm đặc trưng nhất là trên nóc tòa nhà có hình đôi rồng chầu mặt trăng theo phong cách lưỡng long triều nguyệt. Chính tại nơi đây, vào ngày 5 tháng 6 năm 1911, người thanh niên yêu nước Nguyễn Tất Thành khi ấy 21 tuổi đã bước lên con tàu Amiral Latouche-Tréville, bắt đầu hành trình bôn ba 30 năm tìm đường cứu nước cho dân tộc. Khi tham quan bảo tàng, quý khách vui lòng giữ trang nghiêm và tuân thủ quy định trang phục lịch sự.'),
    (4, 'Thuyết minh Nhà thờ Giáo xứ Xóm Chiếu', 'poi_4_nha_tho_xom_chieu.mp3', 75, 450000,
     'Nữ miền Nam (Ấm áp)', 'vi', 'quan4',
     'Bạn đang đứng trước Nhà thờ Xóm Chiếu, trung tâm sinh hoạt tôn giáo của một trong những giáo xứ cổ kính nhất Sài Gòn với hơn 160 năm lịch sử hình thành. Tên gọi Xóm Chiếu bắt nguồn từ nghề dệt chiếu lát truyền thống của cư dân nơi đây từ thế kỷ 19. Ngôi thánh đường mang những đường nét kiến trúc Gothic thanh thoát với tháp chuông uy nghiêm và các khung cửa vòm kính màu tuyệt đẹp. Tiếng chuông nhà thờ hòa cùng nhịp sống bình dị của xóm đạo Quận 4 đã tạo nên một nét đẹp văn hóa độc đáo. Xin lưu ý giữ im lặng khi vào bên trong thánh đường.'),
    (5, 'Thuyết minh Cầu Mống - Chứng nhân lịch sử', 'poi_5_cau_mong.mp3', 60, 360000,
     'Nữ miền Nam (Truyền cảm)', 'vi', 'quan4',
     'Chào mừng bạn đến với Cầu Mống, một trong những cây cầu thép cổ xưa nhất của Thành phố Hồ Chí Minh. Cây cầu được xây dựng từ cuối thế kỷ 19 bởi công ty xây dựng Levallois Perret của Pháp. Cầu có dáng cong hình cầu vồng nên người dân quen gọi là Cầu Mống. Nối liền Quận 1 và Quận 4 qua dòng kênh Bến Nghé thơ mộng, ngày nay Cầu Mống là cầu đi bộ ngắm cảnh, điểm hẹn quen thuộc của giới trẻ và du khách để chiêm ngưỡng vẻ đẹp lung linh của thành phố lúc hoàng hôn buông xuống.')
ON CONFLICT (poi_id) DO NOTHING;

-- ============================================================
-- Curated & Custom Tours tables
-- ============================================================

CREATE TABLE IF NOT EXISTS tours (
    id                         BIGSERIAL PRIMARY KEY,
    name                       VARCHAR(255) NOT NULL,
    slug                       VARCHAR(255) NOT NULL UNIQUE,
    description                TEXT,
    theme                      VARCHAR(50) NOT NULL DEFAULT 'FOOD',
    estimated_duration_minutes INT NOT NULL DEFAULT 60,
    estimated_cost             INT NOT NULL DEFAULT 0,
    total_distance_meters      INT NOT NULL DEFAULT 0,
    thumbnail_url              TEXT,
    is_public                  BOOLEAN NOT NULL DEFAULT true,
    creator_id                 BIGINT REFERENCES users(id) ON DELETE SET NULL,
    creator_role               VARCHAR(50) NOT NULL DEFAULT 'ADMIN',
    creator_name               VARCHAR(100) NOT NULL DEFAULT 'Hệ thống Smart Tourism',
    created_at                 TIMESTAMP NOT NULL DEFAULT now(),
    updated_at                 TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tour_stops (
    id                           BIGSERIAL PRIMARY KEY,
    tour_id                      BIGINT NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    poi_id                       BIGINT NOT NULL REFERENCES pois(id) ON DELETE CASCADE,
    stop_order                   INT NOT NULL,
    estimated_duration_minutes   INT NOT NULL DEFAULT 30,
    recommended_dish_or_activity TEXT,
    note                         TEXT,
    created_at                   TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uq_tour_stop_order UNIQUE (tour_id, stop_order)
);

CREATE INDEX IF NOT EXISTS idx_tours_is_public ON tours(is_public);
CREATE INDEX IF NOT EXISTS idx_tours_theme ON tours(theme);
CREATE INDEX IF NOT EXISTS idx_tours_creator ON tours(creator_id);
CREATE INDEX IF NOT EXISTS idx_tour_stops_tour ON tour_stops(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_stops_poi ON tour_stops(poi_id);

-- Seed Initial Curated Tours
INSERT INTO tours (id, name, slug, description, theme, estimated_duration_minutes, estimated_cost, total_distance_meters, thumbnail_url, is_public, creator_id, creator_role, creator_name)
VALUES
    (1, 'Foodtour Đêm Phố Ốc Vĩnh Khánh', 'foodtour-dem-pho-oc-vinh-khanh',
     'Khám phá trọn vẹn nét văn hóa ẩm thực đêm rực lửa của Quận 4: thưởng thức các món ốc chảo thơm lừng sốt trứng muối và phá lấu bò gia truyền.',
     'FOOD', 120, 250000, 1200,
     'https://images.unsplash.com/photo-1544025162-d76694265947?w=800', true, NULL, 'ADMIN', 'Hệ thống Smart Tourism'),
    (2, 'Khám Phá Ẩm Thực Chợ 200 & Phá Lấu Cô Thảo', 'kham-pha-am-thuc-cho-200',
     'Hành trình len lỏi vào thiên đường ăn vặt hẻm 243 Tôn Đản, thưởng thức phá lấu nước cốt dừa chấm mắm tắc và trà đào thanh mát.',
     'FOOD', 75, 120000, 800,
     'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800', true, NULL, 'ADMIN', 'Hệ thống Smart Tourism'),
    (3, 'Dấu Ấn Lịch Sử & Kiến Trúc Cổ Bến Vân Đồn', 'dau-an-lich-su-kien-truc-co',
     'Ngược dòng thời gian qua hơn một thế kỷ: chiêm ngưỡng thương cảng Bến Nhà Rồng huyền thoại, thánh đường Gothic Xóm Chiếu và cây cầu thép Cầu Mống.',
     'CULTURE', 150, 30000, 2600,
     'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800', true, NULL, 'ADMIN', 'Hệ thống Smart Tourism'),
    (4, 'Quận 4 Trọn Vẹn: Di Tích Sáng & Ẩm Thực Chiều', 'quan-4-tron-ven-di-tich-va-am-thuc',
     'Tour toàn diện kết hợp viếng cảnh tâm linh - lịch sử buổi sáng và bùng nổ vị giác với hải sản phố đêm Vĩnh Khánh buổi tối.',
     'MIXED', 210, 280000, 3400,
     'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800', true, NULL, 'ADMIN', 'Hệ thống Smart Tourism')
ON CONFLICT (id) DO NOTHING;

-- Seed Tour Stops
INSERT INTO tour_stops (tour_id, poi_id, stop_order, estimated_duration_minutes, recommended_dish_or_activity, note)
VALUES
    -- Tour 1: Foodtour Phố Ốc Vĩnh Khánh
    (1, 1, 1, 60, 'Ốc hương sốt trứng muối vàng óng, Càng ghẹ rang muối tuyết', 'Nên gọi thêm bánh mì nóng để chấm trọn nước sốt trứng muối béo ngậy'),
    (1, 2, 2, 45, 'Phá lấu bò thập cẩm chén đá, Nước mía sầu riêng', 'Đi bộ từ Vĩnh Khánh rẽ vào hẻm Tôn Đản chừng 450m'),

    -- Tour 2: Khám Phá Chợ 200
    (2, 2, 1, 45, 'Phá lấu bò lá xách giòn sần sật kèm nước mắm tắc chua cay', 'Ghé quán lúc 16h30 khi nước phá lấu vừa tới, thơm béo nhất'),
    (2, 1, 2, 30, 'Tráng miệng ốc mỡ xào me cay ngọt', 'Điểm kết thúc tuyệt vời cho một buổi chiều khám phá chợ'),

    -- Tour 3: Di Tích & Lịch Sử
    (3, 3, 1, 60, 'Tham quan bảo tàng, chụp ảnh tượng đài và đôi rồng chầu nguyệt', 'Vé vào cổng 30.000đ/người lớn. Chú ý trang phục lịch sự, kín đáo'),
    (3, 5, 2, 30, 'Đi bộ ngắm hoàng hôn kênh Bến Nghé, check-in view tòa tháp Bitexco', 'Thời điểm chụp ảnh đẹp nhất là lúc 17h15 - 17h45'),
    (3, 4, 3, 45, 'Chiêm ngưỡng kiến trúc Gothic cổ kính và tìm hiểu xóm nghề dệt chiếu lát xưa', 'Giữ yên lặng nơi tôn nghiêm, không quay phim khi đang cử hành phụng vụ'),

    -- Tour 4: Quận 4 Trọn Vẹn
    (4, 3, 1, 60, 'Tìm hiểu hành trình 30 năm cứu nước của Bác Hồ tại Bến Nhà Rồng', 'Nên đến đầu giờ sáng để đón nắng đẹp trên bến cảng'),
    (4, 6, 2, 35, 'Thắp hương chiêm bái tại Chùa Giác Nguyên thanh tịnh', 'Trang phục trang nghiêm, tháo giày trước khi vào chánh điện'),
    (4, 2, 3, 45, 'Nạp năng lượng xế chiều với món phá lấu bò Cô Thảo trứ danh', 'Nên thử cả phá lấu chiên giòn và phá lấu nước cốt dừa'),
    (4, 1, 4, 60, 'Đại tiệc ốc đêm sôi động tại Quán Ốc Oanh', 'Tận hưởng không khí nhộn nhịp đặc trưng của phố ẩm thực đêm Quận 4')
ON CONFLICT (tour_id, stop_order) DO NOTHING;

-- ============================================================
-- Community & Engagement tables: Reviews, Favorites, Check-ins, Badges
-- ============================================================

CREATE TABLE IF NOT EXISTS reviews (
    id              BIGSERIAL PRIMARY KEY,
    poi_id          BIGINT NOT NULL REFERENCES pois(id) ON DELETE CASCADE,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating          INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment         TEXT NOT NULL,
    images          TEXT[] DEFAULT '{}',
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_poi_id ON reviews(poi_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

CREATE TABLE IF NOT EXISTS favorites (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    poi_id          BIGINT NOT NULL REFERENCES pois(id) ON DELETE CASCADE,
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE(user_id, poi_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_poi_id ON favorites(poi_id);

CREATE TABLE IF NOT EXISTS checkins (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    poi_id          BIGINT NOT NULL REFERENCES pois(id) ON DELETE CASCADE,
    checkin_lat     DOUBLE PRECISION NOT NULL,
    checkin_lng     DOUBLE PRECISION NOT NULL,
    distance_meters DOUBLE PRECISION NOT NULL,
    verified        BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checkins_user_id ON checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_poi_id ON checkins(poi_id);

CREATE TABLE IF NOT EXISTS user_badges (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_code      VARCHAR(50) NOT NULL,
    badge_name      VARCHAR(100) NOT NULL,
    badge_description TEXT,
    badge_icon_url  VARCHAR(255),
    unlocked_at     TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE(user_id, badge_code)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);

-- Seed Community Reviews
INSERT INTO reviews (id, poi_id, user_id, rating, comment, images, created_at)
VALUES
    (1, 1, 1, 5, 'Ốc hương trứng muối béo ngậy thơm lừng, chấm bánh mì siêu ngon! Quán lúc nào cũng đông đúc vui vẻ.', ARRAY['https://images.unsplash.com/photo-1544025162-d76694265947?w=800'], now() - interval '2 days'),
    (2, 2, 1, 5, 'Phá lấu Cô Thảo ngon nhất Quận 4, nước dùng dừa ngọt thanh không bị ngấy, chén mắm tắc đậm đà.', ARRAY['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800'], now() - interval '1 day'),
    (3, 3, 1, 5, 'Bến Nhà Rồng rất uy nghiêm và đẹp, ngắm hoàng hôn bên sông Sài Gòn cực kỳ thư thái.', ARRAY['https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800'], now() - interval '5 hours')
ON CONFLICT (id) DO NOTHING;

-- Seed Favorites
INSERT INTO favorites (user_id, poi_id, created_at)
VALUES
    (1, 1, now() - interval '3 days'),
    (1, 3, now() - interval '2 days')
ON CONFLICT (user_id, poi_id) DO NOTHING;

-- Seed Checkins & First Badges
INSERT INTO checkins (id, user_id, poi_id, checkin_lat, checkin_lng, distance_meters, verified, created_at)
VALUES
    (1, 1, 1, 10.76125, 106.70252, 6.2, true, now() - interval '2 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_badges (user_id, badge_code, badge_name, badge_description, badge_icon_url, unlocked_at)
VALUES
    (1, 'FIRST_CHECKIN', 'Bước Chân Đầu Tiên', 'Thực hiện lượt check-in đầu tiên tại Quận 4', 'https://cdn-icons-png.flaticon.com/512/3176/3176366.png', now() - interval '2 days'),
    (1, 'FOODIE_OC', 'Thổ Địa Phố Ốc', 'Khám phá và check-in các điểm ẩm thực ốc trứ danh Quận 4', 'https://cdn-icons-png.flaticon.com/512/2921/2921822.png', now() - interval '2 days')
ON CONFLICT (user_id, badge_code) DO NOTHING;

-- Synchronize sequences for autoincrement PKs
SELECT setval('reviews_id_seq', (SELECT COALESCE(MAX(id), 1) FROM reviews));
SELECT setval('checkins_id_seq', (SELECT COALESCE(MAX(id), 1) FROM checkins));
SELECT setval('user_badges_id_seq', (SELECT COALESCE(MAX(id), 1) FROM user_badges));
SELECT setval('tours_id_seq', (SELECT COALESCE(MAX(id), 1) FROM tours));
SELECT setval('tour_stops_id_seq', (SELECT COALESCE(MAX(id), 1) FROM tour_stops));

-- ==========================================
-- Analytics & Telemetry Subsystem
-- ==========================================
CREATE TABLE IF NOT EXISTS audio_listen_logs (
    id BIGSERIAL PRIMARY KEY,
    device_id VARCHAR(100) NOT NULL,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    poi_id BIGINT NOT NULL REFERENCES pois(id) ON DELETE CASCADE,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    trigger_type VARCHAR(20) NOT NULL DEFAULT 'MANUAL', -- 'AUTO', 'MANUAL'
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audio_listen_poi ON audio_listen_logs(poi_id);
CREATE INDEX IF NOT EXISTS idx_audio_listen_created ON audio_listen_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audio_listen_device ON audio_listen_logs(device_id);

CREATE TABLE IF NOT EXISTS dwell_logs (
    id BIGSERIAL PRIMARY KEY,
    device_id VARCHAR(100) NOT NULL,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    location geography(Point, 4326) NOT NULL,
    dwell_seconds INTEGER NOT NULL,
    matched_poi_id BIGINT REFERENCES pois(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dwell_logs_location ON dwell_logs USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_dwell_logs_created ON dwell_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_dwell_logs_poi ON dwell_logs(matched_poi_id);

-- Seed Audio Listen Logs
INSERT INTO audio_listen_logs (id, device_id, user_id, poi_id, duration_seconds, completed, trigger_type, created_at)
VALUES
    (1, 'dev-mobile-001', 1, 1, 95, true, 'AUTO', now() - interval '2 days'),
    (2, 'dev-mobile-002', NULL, 1, 45, false, 'MANUAL', now() - interval '1 day'),
    (3, 'dev-mobile-003', NULL, 2, 80, true, 'AUTO', now() - interval '18 hours'),
    (4, 'dev-mobile-004', 1, 3, 120, true, 'AUTO', now() - interval '5 hours')
ON CONFLICT (id) DO NOTHING;

-- Seed Dwell Logs
INSERT INTO dwell_logs (id, device_id, user_id, location, dwell_seconds, matched_poi_id, created_at)
VALUES
    (1, 'dev-mobile-001', 1, ST_SetSRID(ST_MakePoint(106.70252, 10.76125), 4326)::geography, 240, 1, now() - interval '2 days'),
    (2, 'dev-mobile-002', NULL, ST_SetSRID(ST_MakePoint(106.70260, 10.76130), 4326)::geography, 180, 1, now() - interval '1 day'),
    (3, 'dev-mobile-003', NULL, ST_SetSRID(ST_MakePoint(106.70585, 10.75782), 4326)::geography, 300, 2, now() - interval '18 hours'),
    (4, 'dev-mobile-004', 1, ST_SetSRID(ST_MakePoint(106.70682, 10.76822), 4326)::geography, 600, 3, now() - interval '5 hours')
ON CONFLICT (id) DO NOTHING;

SELECT setval('audio_listen_logs_id_seq', (SELECT COALESCE(MAX(id), 1) FROM audio_listen_logs));
SELECT setval('dwell_logs_id_seq', (SELECT COALESCE(MAX(id), 1) FROM dwell_logs));
SELECT setval('pois_id_seq', COALESCE((SELECT MAX(id) FROM pois), 1));
SELECT setval('menu_categories_id_seq', COALESCE((SELECT MAX(id) FROM menu_categories), 1));
SELECT setval('dishes_id_seq', COALESCE((SELECT MAX(id) FROM dishes), 1));
SELECT setval('dish_images_id_seq', COALESCE((SELECT MAX(id) FROM dish_images), 1));
SELECT setval('categories_id_seq', COALESCE((SELECT MAX(id) FROM categories), 1));



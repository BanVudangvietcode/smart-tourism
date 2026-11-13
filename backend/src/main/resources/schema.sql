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

-- Phân loại hệ thống điểm đến (POI Types)
CREATE TABLE IF NOT EXISTS poi_types (
    code        VARCHAR(50) PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    icon        VARCHAR(50),
    description VARCHAR(255),
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
    poi_type        VARCHAR(50) NOT NULL DEFAULT 'FOOD' REFERENCES poi_types(code),
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

-- Migration an toan: Bo sung khoa ngoai fk_pois_poi_type cho database da ton tai
DO $do$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_pois_poi_type' AND table_name = 'pois'
    ) THEN
        ALTER TABLE pois ALTER COLUMN poi_type TYPE VARCHAR(50);
        ALTER TABLE pois ADD CONSTRAINT fk_pois_poi_type FOREIGN KEY (poi_type) REFERENCES poi_types(code);
    END IF;
END $do$;

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

-- Seed POI Types
INSERT INTO poi_types (code, name, icon, description, sort_order) VALUES
    ('FOOD',        'Ẩm Thực & Quán Ăn', '🍲', 'Các quán ăn, nhà hàng, ẩm thực đường phố Quận 4', 1),
    ('HISTORICAL',  'Di Tích Lịch Sử',   '🏛️', 'Bến Nhà Rồng, di tích, bảo tàng lịch sử', 2),
    ('RELIGIOUS',   'Chùa & Tôn Giáo',   '⛩️', 'Chùa chiền, miếu, nhà thờ linh thiêng', 3),
    ('LANDMARK',    'Cảnh Quan Check-in','🌉', 'Cầu Mống, bến cảng, công viên, điểm ngắm cảnh', 4)
ON CONFLICT (code) DO NOTHING;

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
    poi_id           BIGINT NOT NULL REFERENCES pois(id) ON DELETE CASCADE,
    title            VARCHAR(255) NOT NULL,
    file_name        VARCHAR(255) NOT NULL,
    duration_seconds INT NOT NULL DEFAULT 0,
    file_size_bytes  BIGINT NOT NULL DEFAULT 0,
    voice            VARCHAR(100) NOT NULL DEFAULT 'Nữ miền Nam (Truyền cảm)',
    language         VARCHAR(10) NOT NULL DEFAULT 'vi',
    zone             VARCHAR(50) NOT NULL DEFAULT 'quan4',
    transcript       TEXT NOT NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT now(),
    updated_at       TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uq_poi_audios_poi_lang UNIQUE (poi_id, language)
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
ON CONFLICT (poi_id, language) DO NOTHING;

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

CREATE TABLE IF NOT EXISTS tour_reviews (
    id              BIGSERIAL PRIMARY KEY,
    tour_id         BIGINT NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating          INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment         TEXT NOT NULL,
    is_anonymous    BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tour_reviews_tour_id ON tour_reviews(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_reviews_user_id ON tour_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_tour_reviews_created_at ON tour_reviews(created_at DESC);

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

-- ============================================================
-- Clean Up: Xóa bỏ các cột *_en riêng biệt khỏi DB
-- (Dữ liệu đa ngôn ngữ được tự động dịch AI và lưu vào translation_cache)
-- ============================================================
DROP INDEX IF EXISTS idx_pois_name_en_fts;
ALTER TABLE pois DROP COLUMN IF EXISTS name_en, DROP COLUMN IF EXISTS description_en, DROP COLUMN IF EXISTS address_en;
ALTER TABLE categories DROP COLUMN IF EXISTS name_en;
ALTER TABLE poi_types DROP COLUMN IF EXISTS name_en, DROP COLUMN IF EXISTS description_en;
ALTER TABLE menu_categories DROP COLUMN IF EXISTS name_en;
ALTER TABLE dishes DROP COLUMN IF EXISTS name_en, DROP COLUMN IF EXISTS description_en, DROP COLUMN IF EXISTS ingredients_en, DROP COLUMN IF EXISTS unit_en;
ALTER TABLE tours DROP COLUMN IF EXISTS name_en, DROP COLUMN IF EXISTS description_en;
ALTER TABLE tour_stops DROP COLUMN IF EXISTS recommended_dish_or_activity_en, DROP COLUMN IF EXISTS note_en;

-- ============================================================
-- Bilingual Audio Guide Migration & English Seed Transcripts
-- ============================================================
ALTER TABLE poi_audios DROP CONSTRAINT IF EXISTS poi_audios_poi_id_key;
ALTER TABLE poi_audios DROP CONSTRAINT IF EXISTS uq_poi_audios_poi_lang;
ALTER TABLE poi_audios ADD CONSTRAINT uq_poi_audios_poi_lang UNIQUE (poi_id, language);

INSERT INTO poi_audios (poi_id, title, file_name, duration_seconds, file_size_bytes, voice, language, zone, transcript)
VALUES
    (1, 'Audio Guide: Vinh Khanh Food Street & Oc Oanh Eatery', 'poi_1_en.mp3', 64, 384192,
     'English (Natural)', 'en', 'quan4',
     'Welcome to Vinh Khanh Street, District 4 – the most vibrant night seafood paradise in Saigon. Right in front of you is Oc Oanh Eatery, a legendary dining destination for food lovers for over 15 years. The signature specialty that made Oc Oanh famous is fresh spotted babylonia snails tossed in rich, creamy salted egg sauce, paired with warm crispy baguettes. Furthermore, crunchy chili salt crab claws and grilled scallops with scallion oil and melted cheese are must-try delicacies. The sizzling sound of seafood woks over high flames and the irresistible aroma of garlic butter will bring you an unforgettable Southern Vietnamese street food experience.'),
    (2, 'Audio Guide: Market 200 & Co Thao Beef Offal Stew', 'poi_2_en.mp3', 64, 383232,
     'English (Natural)', 'en', 'quan4',
     'You are stopping at alley 243 Ton Dan, entering the renowned Market 200 food paradise of District 4. Co Thao Beef Offal Stew has kept its stove burning for more than 20 years in this cozy alley corner. Each piece of honeycomb tripe, intestine, and tendon is thoroughly cleaned and slow-cooked in rich fresh coconut milk with aromatic star anise and cinnamon. When tasting, use a bamboo skewer to dip a tender piece into the signature sweet-and-sour tamarind chili sauce, then take a bite of warm crispy bread. The rich, velvety broth balanced with tangy flavors will reveal why Saigon locals adore this iconic street delicacy.'),
    (3, 'Audio Guide: Historical Landmark Dragon Wharf (Ben Nha Rong)', 'poi_3_en.mp3', 85, 510000,
     'English (Formal)', 'en', 'quan4',
     'Welcome to Dragon Wharf, now the Ho Chi Minh Museum Ho Chi Minh City Branch. Built in 1863 by the French shipping company Messageries Maritimes, the building is distinguished by two rooftop ceramic dragons flanking a moon. It was here on June 5, 1911, that the young patriot Nguyen Tat Thanh, then 21 years old, boarded the ship Amiral Latouche-Treville to embark on a 30-year journey seeking national salvation for Vietnam. When exploring the museum grounds and exhibitions, visitors are kindly requested to dress respectfully and maintain solemnity.'),
    (4, 'Audio Guide: Historic Xom Chieu Church', 'poi_4_en.mp3', 75, 450000,
     'English (Formal)', 'en', 'quan4',
     'You are visiting Xom Chieu Church, one of the oldest Catholic parishes in Saigon with over 160 years of history. The church boasts classic Gothic architecture with soaring pointed arches, colorful stained-glass windows, and a tranquil bell tower standing gracefully amidst the bustle of District 4. The parish has closely bonded with generations of local families since the days of the historic sedge mat weaving village. When stepping inside, please observe silence and dress reverently.'),
    (5, 'Audio Guide: Historic Mong Bridge (Rainbow Bridge)', 'poi_5_en.mp3', 60, 360000,
     'English (Natural)', 'en', 'quan4',
     'Standing before you is Mong Bridge, the oldest historic steel bridge in Saigon, connecting District 1 and District 4 across the Ben Nghe canal. Built in 1893 by the Eiffel company, the bridge is famous for its distinctive curved arch and turquoise paint. Today, Mong Bridge is a favorite pedestrian and cultural hotspot, offering spectacular sunset views of the Saigon River and modern Bitexco skyline. In the late afternoon, enjoy the cool canal breeze and immerse yourself in Saigon urban life.'),
    (6, 'Audio Guide: Giac Nguyen Pagoda', 'poi_6_en.mp3', 60, 360000,
     'English (Formal)', 'en', 'quan4',
     'Welcome to Giac Nguyen Pagoda, a serene Buddhist sanctuary located on Ben Van Don street along the canal. Founded in the mid-20th century, the pagoda follows the Mahayana tradition, providing a quiet spiritual haven for locals and travelers seeking peace and mindfulness in the heart of District 4. Please remove your shoes before entering the main hall and maintain a respectful demeanour.')
ON CONFLICT (poi_id, language) DO UPDATE SET
    title = EXCLUDED.title,
    transcript = EXCLUDED.transcript,
    voice = EXCLUDED.voice;

-- ============================================================
-- Multilingual Expansion Seed Data (zh, ja, ko, fr)
-- ============================================================
INSERT INTO poi_audios (poi_id, title, file_name, duration_seconds, file_size_bytes, voice, language, zone, transcript)
VALUES
    -- POI 1: Vinh Khanh / Oc Oanh
    (1, '语音导览：永庆夜市海鲜街与阿英螺店', 'poi_1_zh.mp3', 64, 384192,
     '中文 (标准普通话)', 'zh', 'quan4',
     '欢迎来到第四郡永庆美食街——西贡最热闹的夜间海鲜天堂。展现在您眼前的是拥有15年历史的著名餐厅阿英螺店。这里的招牌名菜是鲜香浓郁的咸蛋黄炒香螺，搭配热气腾腾的香脆法棍面包享用。此外，香辣椒盐炒蟹钳和浓郁芝士烤扇贝也是不容错过的街头美味。大火翻炒的海鲜滋滋作响，伴随着蒜香黄油的扑鼻香气，将带给您难忘的西贡夜生活美食体验。'),
    (1, '音声ガイド：ヴィンカイン通りとオック・オアン（巻き貝料理）', 'poi_1_ja.mp3', 64, 384192,
     '日本語 (ナチュラル)', 'ja', 'quan4',
     'サイゴン屈指の夜の海鮮天国、4区のヴィンカイン通りへようこそ。目の前にあるのは、15年以上にわたり地元民や旅行者に愛され続ける名店「オック・オアン」です。看板メニューは、濃厚でクリーミーな塩漬け卵黄ソースを絡めた新鮮なバイ貝料理で、焼きたてのフランスパンと一緒に食べるのが絶品です。強火で炒める海鮮の心地よい音とガーリックバターの芳醇な香りに包まれながら、本場サイゴンのストリートフードをご堪能ください。'),
    (1, '오디오 가이드: 빈카인 야간 해산물 거리 및 옥오안 맛집', 'poi_1_ko.mp3', 64, 384192,
     '한국어 (자연스러운)', 'ko', 'quan4',
     '호치민시 4군에서 가장 활기찬 밤의 해산물 천국인 빈카인 먹자골목에 오신 것을 환영합니다. 여러분 바로 앞에 있는 곳은 15년 이상의 전통을 자랑하는 유명한 해산물 맛집 옥오안입니다. 대표 메뉴는 고소하고 진한 솔티드 에그 소스를 곁들인 바빌로니아 고둥 요리로, 따끈따끈한 바게트 빵을 소스에 찍어 먹는 별미입니다. 매콤한 고추 소금 게 집게발과 치즈 가리비 구이도 꼭 맛보셔야 할 대표 음식입니다.'),
    (1, 'Guide Audio: Rue Gourmande Vinh Khanh et Restaurant Oc Oanh', 'poi_1_fr.mp3', 64, 384192,
     'Français (Naturel)', 'fr', 'quan4',
     'Bienvenue dans la rue Vinh Khanh, au 4ème arrondissement, le paradis nocturne des fruits de mer le plus animé de Saïgon. Devant vous se trouve le célèbre établissement Oc Oanh, réputé depuis plus de 15 ans. Sa spécialité emblématique reste les bulots frais nappés d une onctueuse sauce aux jaunes d oeufs salés, dégustés avec une baguette croustillante toute chaude. Laissez-vous séduire par les parfums exquis de beurre à l ail et la convivialité nocturne vietnamienne.'),

    -- POI 3: Ben Nha Rong
    (3, '语音导览：历史遗迹龙屋码头（胡志明博物馆）', 'poi_3_zh.mp3', 85, 510000,
     '中文 (标准普通话)', 'zh', 'quan4',
     '欢迎来到龙屋码头，现为胡志明博物馆胡志明市分馆。这座宏伟的建筑由法国海运公司于1863年建造，最独特的特征是屋顶上矗立着双龙戏珠的雕塑。1911年6月5日，年轻爱国者阮必成（即后来的胡志明主席）登上拉图什·特雷维尔号商船，踏上了长达30年的救国救民征程。参观博物馆各展厅时，请保持庄严并遵守参观礼仪。'),
    (3, '音声ガイド：歴史的名所ベンニャーロン（龍屋埠頭）', 'poi_3_ja.mp3', 85, 510000,
     '日本語 (ナチュラル)', 'ja', 'quan4',
     '現在ホーチミン博物館ホーチミン市支部となっている歴史的名所「龍屋埠頭（ベンニャーロン）」へようこそ。1863年にフランスの海運会社によって建設されたこの建物は、屋根の上に飾られた二匹の龍の陶器像が特徴的です。1911年6月5日、若き日のホー・チ・ミン主席が祖国救済の道を求めてフランス船に乗り込み、30年間に及ぶ旅に出航した運命の場所です。館内見学の際は静粛にお過ごしください。'),
    (3, '오디오 가이드: 역사적 명소 냐롱 부두 (호치민 박물관)', 'poi_3_ko.mp3', 85, 510000,
     '한국어 (자연스러운)', 'ko', 'quan4',
     '호치민 박물관 호치민 지부로 운영되고 있는 역사적 명소 냐롱 부두에 오신 것을 환영합니다. 1863년 프랑스 해운 회사에 의해 지어진 이 건물은 지붕 위에 장식된 두 마리의 용 도자기 조각이 인상적인 상징물입니다. 1911년 6월 5일, 스물한 살의 청년 응우옌 탓 타인(호치민 주석)이 조국 구원의 길을 찾아 30년간의 여정을 시작하며 배에 올랐던 역사적인 장소입니다.'),
    (3, 'Guide Audio: Monument Historique Quai du Dragon (Ben Nha Rong)', 'poi_3_fr.mp3', 85, 510000,
     'Français (Naturel)', 'fr', 'quan4',
     'Bienvenue au Quai du Dragon, devenu aujourd hui la branche du Musée Hô Chi Minh de la ville. Édifié en 1863 par la Compagnie des Messageries Maritimes, ce magnifique bâtiment colonial est surmonté de deux dragons en faïence encadrant une lune. C est d ici, le 5 juin 1911, que le jeune patriote Nguyen Tat Thanh embarqua à bord du paquebot Amiral Latouche-Tréville pour un périple de 30 ans à travers le monde.'),

    -- POI 5: Cau Mong
    (5, '语音导览：历史悠久之芒桥（西贡彩虹桥）', 'poi_5_zh.mp3', 60, 360000,
     '中文 (标准普通话)', 'zh', 'quan4',
     '呈现在您面前的是芒桥，西贡最古老的历史钢桥之一，横跨美丽的滨义运河，将第一郡与第四郡紧密相连。该桥于1893年由法国埃菲尔公司设计建造，以标志性的彩虹拱形结构和青绿漆色闻名。如今，芒桥已改建为步行观光桥，是欣赏西贡河壮丽日落与现代摩天大楼天际线的最佳打卡地。'),
    (5, '音声ガイド：歴史的建造物 モン橋（虹の橋）', 'poi_5_ja.mp3', 60, 360000,
     '日本語 (ナチュラル)', 'ja', 'quan4',
     'サイゴンで最も古い歴史ある鉄橋「モン橋」の前に立っています。ベンゲー運河を挟んで1区と4区を結ぶこの橋は、1893年にフランスのエッフェル社によって建設されました。美しい弧を描く虹のようなアーチと鮮やかなエメラルドグリーンが特徴です。現在は歩行者専用橋となっており、川の涼しい風を感じながら夕暮れの美しいスカイラインを眺める人気の散策スポットです。'),
    (5, '오디오 가이드: 역사적인 몽 다리 (무지개 다리)', 'poi_5_ko.mp3', 60, 360000,
     '한국어 (자연스러운)', 'ko', 'quan4',
     '사이공에서 가장 유서 깊은 철교 중 하나인 몽 다리(무지개 다리)에 오신 것을 환영합니다. 1893년 프랑스 에펠 건설 회사에 의해 완공된 이 다리는 벤응에 운하를 가로질러 1군과 4군을 연결합니다. 독특한 아치형 곡선 모양과 청록색 외관으로 사랑받고 있으며, 현재는 시민과 여행객들이 황혼 무렵 사이공 강의 아름다운 일몰을 감상할 수 있는 보행자 전용 다리로 운영되고 있습니다.'),
    (5, 'Guide Audio: Pont Historique des Messageries (Pont Mong)', 'poi_5_fr.mp3', 60, 360000,
     'Français (Naturel)', 'fr', 'quan4',
     'Vous vous trouvez devant le pont Mong, l un des plus anciens ponts métalliques historiques de Saïgon. Construit à la fin du 19ème siècle par la maison Levallois-Perret de Gustave Eiffel, ce pont suspendu enjambe le canal Ben Nghe pour relier le 1er et le 4ème arrondissement. Sa silhouette arquée caractéristique lui a valu le surnom populaire de pont arc-en-ciel. Aujourd hui réservé aux piétons, il offre une vue imprenable sur le coucher de soleil.')
ON CONFLICT (poi_id, language) DO UPDATE SET
    title = EXCLUDED.title,
    transcript = EXCLUDED.transcript,
    voice = EXCLUDED.voice;

-- ==============================================================================
-- 18. DYNAMIC TRANSLATION CACHE (Bản dịch AI đa ngôn ngữ: en, ja, ko, zh, fr)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS translation_cache (
    hash_key CHAR(32) PRIMARY KEY,
    locale VARCHAR(10) NOT NULL,
    translated_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_translation_cache_locale ON translation_cache(locale);

-- Nạp sẵn các bản dịch tiếng Anh chuẩn vào cache (0 token, tức thì)
INSERT INTO translation_cache (hash_key, locale, translated_text, created_at) VALUES
(md5('en:Ốc & Hải sản'), 'en', 'Seafood & Snails', CURRENT_TIMESTAMP),
(md5('en:Ăn vặt Chợ 200'), 'en', 'Market 200 Snacks', CURRENT_TIMESTAMP),
(md5('en:Phá lấu bò'), 'en', 'Beef Offal Stew', CURRENT_TIMESTAMP),
(md5('en:Món nước & Sợi'), 'en', 'Noodle Soups', CURRENT_TIMESTAMP),
(md5('en:Cà phê hoài niệm'), 'en', 'Vintage Cafes', CURRENT_TIMESTAMP),
(md5('en:Di tích lịch sử'), 'en', 'Historic Landmarks', CURRENT_TIMESTAMP),
(md5('en:Chùa & Nhà thờ'), 'en', 'Pagodas & Churches', CURRENT_TIMESTAMP),
(md5('en:Cảnh quan & Check-in'), 'en', 'Sightseeing & Check-in', CURRENT_TIMESTAMP),

(md5('en:Quán Ốc Oanh'), 'en', 'Oc Oanh Eatery', CURRENT_TIMESTAMP),
(md5('en:Phá Lấu Bò Cô Thảo'), 'en', 'Co Thao Beef Offal Stew', CURRENT_TIMESTAMP),
(md5('en:Bến Nhà Rồng'), 'en', 'Ho Chi Minh Museum - Dragon Wharf (Ben Nha Rong)', CURRENT_TIMESTAMP),
(md5('en:Nhà Thờ Xóm Chiếu'), 'en', 'Xom Chieu Church', CURRENT_TIMESTAMP),
(md5('en:Cầu Mống'), 'en', 'Mong Bridge (Rainbow Bridge)', CURRENT_TIMESTAMP),
(md5('en:Chùa Giác Nguyên'), 'en', 'Giac Nguyen Pagoda', CURRENT_TIMESTAMP),

(md5('en:534 Vĩnh Khánh, Phường 8, Quận 4'), 'en', '534 Vinh Khanh, Ward 8, District 4', CURRENT_TIMESTAMP),
(md5('en:243/29 Tôn Đản, Phường 15, Quận 4'), 'en', '243/29 Ton Dan, Ward 15, District 4', CURRENT_TIMESTAMP),
(md5('en:01 Nguyễn Tất Thành, Phường 12, Quận 4'), 'en', '01 Nguyen Tat Thanh, Ward 12, District 4', CURRENT_TIMESTAMP),
(md5('en:200 Lê Quốc Hưng, Phường 12, Quận 4'), 'en', '200 Le Quoc Hung, Ward 12, District 4', CURRENT_TIMESTAMP),
(md5('en:Cầu Mống, Phường 12, Quận 4'), 'en', 'Mong Bridge, Ward 12, District 4', CURRENT_TIMESTAMP),
(md5('en:243 Đoàn Văn Bơ, Phường 14, Quận 4'), 'en', '243 Doan Van Bo, Ward 14, District 4', CURRENT_TIMESTAMP),

(md5('en:Foodtour Đêm Phố Ốc Vĩnh Khánh'), 'en', 'Vinh Khanh Night Seafood Street Food Tour', CURRENT_TIMESTAMP),
(md5('en:Khám Phá Ẩm Thực Chợ 200 & Phá Lấu Cô Thảo'), 'en', 'Explore Market 200 & Co Thao Beef Offal', CURRENT_TIMESTAMP),
(md5('en:Dấu Ấn Lịch Sử & Kiến Trúc Cổ Bến Vân Đồn'), 'en', 'Historical Footprints & Ancient Architecture of Ben Van Don', CURRENT_TIMESTAMP),
(md5('en:Quận 4 Trọn Vẹn: Di Tích Sáng & Ẩm Thực Chiều'), 'en', 'Full District 4: Morning Heritage & Evening Gastronomy', CURRENT_TIMESTAMP),

(md5('en:Tour Ẩm Thực Đêm Phố Ốc Vĩnh Khánh'), 'en', 'Vinh Khanh Night Seafood Street Food Tour', CURRENT_TIMESTAMP),
(md5('en:Khám Phá Thiên Đường Ăn Vặt Chợ 200 & Phá Lấu Cô Thảo'), 'en', 'Explore Market 200 & Co Thao Beef Offal', CURRENT_TIMESTAMP),
(md5('en:Trọn Vẹn Quận 4: Sáng Di Tích - Tối Ẩm Thực'), 'en', 'Full District 4: Morning Heritage & Evening Gastronomy', CURRENT_TIMESTAMP),

(md5('en:Ốc hương sốt trứng muối vàng óng, Càng ghẹ rang muối tuyết'), 'en', 'Golden salted egg sweet snails, snow-salt roasted crab claws', CURRENT_TIMESTAMP),
(md5('en:Nên gọi thêm bánh mì nóng để chấm trọn nước sốt trứng muối béo ngậy'), 'en', 'Order hot baguette to dip into the rich salted egg sauce', CURRENT_TIMESTAMP),
(md5('en:Phá lấu bò thập cẩm chén đá, Nước mía sầu riêng'), 'en', 'Mixed beef offal stew in stone bowl, durian sugarcane juice', CURRENT_TIMESTAMP),
(md5('en:Đi bộ từ Vĩnh Khánh rẽ vào hẻm Tôn Đản chừng 450m'), 'en', 'Walk from Vinh Khanh into Ton Dan alley around 450m', CURRENT_TIMESTAMP),
(md5('en:Phá lấu bò lá xách giòn sần sật kèm nước mắm tắc chua cay'), 'en', 'Crunchy beef tripe offal stew with sweet and sour kumquat fish sauce', CURRENT_TIMESTAMP),
(md5('en:Ghé quán lúc 16h30 khi nước phá lấu vừa tới, thơm béo nhất'), 'en', 'Visit around 4:30 PM when the broth is freshly simmered and most fragrant', CURRENT_TIMESTAMP),
(md5('en:Tráng miệng ốc mỡ xào me cay ngọt'), 'en', 'Dessert sweet and sour tamarind stir-fried sweet snails', CURRENT_TIMESTAMP),
(md5('en:Điểm kết thúc tuyệt vời cho một buổi chiều khám phá chợ'), 'en', 'A wonderful sweet finale for an afternoon market crawl', CURRENT_TIMESTAMP),
(md5('en:Tham quan bảo tàng, chụp ảnh tượng đài và đôi rồng chầu nguyệt'), 'en', 'Visit the museum, photo Uncle Ho statue and dragon rooftop ornament', CURRENT_TIMESTAMP),
(md5('en:Vé vào cổng 30.000đ/người lớn. Chú ý trang phục lịch sự, kín đáo'), 'en', 'Entrance 30,000 VND/adult. Polite and modest attire required', CURRENT_TIMESTAMP),
(md5('en:Đi bộ ngắm hoàng hôn kênh Bến Nghé, check-in view tòa tháp Bitexco'), 'en', 'Stroll at sunset along Ben Nghe canal, check-in Bitexco tower view', CURRENT_TIMESTAMP),
(md5('en:Thời điểm chụp ảnh đẹp nhất là lúc 17h15 - 17h45'), 'en', 'Best photo golden hour is from 5:15 PM to 5:45 PM', CURRENT_TIMESTAMP),
(md5('en:Chiêm ngưỡng kiến trúc Gothic cổ kính và tìm hiểu xóm nghề dệt chiếu lát xưa'), 'en', 'Admire Gothic architecture and learn about historic sedge mat weaving village', CURRENT_TIMESTAMP),
(md5('en:Giữ yên lặng nơi tôn nghiêm, không quay phim khi đang cử hành phụng vụ'), 'en', 'Please remain quiet in this sacred place; no filming during liturgical services', CURRENT_TIMESTAMP),
(md5('en:Tìm hiểu hành trình 30 năm cứu nước của Bác Hồ tại Bến Nhà Rồng'), 'en', 'Trace Uncle Ho''s 30-year journey at Dragon Wharf', CURRENT_TIMESTAMP),
(md5('en:Nên đến đầu giờ sáng để đón nắng đẹp trên bến cảng'), 'en', 'Arrive early in the morning for crisp sunlight across the harbor', CURRENT_TIMESTAMP),
(md5('en:Thắp hương chiêm bái tại Chùa Giác Nguyên thanh tịnh'), 'en', 'Light incense and pay homage at serene Giac Nguyen Pagoda', CURRENT_TIMESTAMP),
(md5('en:Trang phục trang nghiêm, tháo giày trước khi vào chánh điện'), 'en', 'Dress reverently; remove shoes before stepping into the main sanctuary', CURRENT_TIMESTAMP),
(md5('en:Nạp năng lượng xế chiều với món phá lấu bò Cô Thảo trứ danh'), 'en', 'Recharge in the afternoon with Co Thao famous beef offal stew', CURRENT_TIMESTAMP),
(md5('en:Nên thử cả phá lấu chiên giòn và phá lấu nước cốt dừa'), 'en', 'Try both the crispy pan-fried offal and coconut milk broth stew', CURRENT_TIMESTAMP),
(md5('en:Đại tiệc ốc đêm sôi động tại Quán Ốc Oanh'), 'en', 'Vibrant night seafood feast at Oc Oanh Eatery', CURRENT_TIMESTAMP),
(md5('en:Tận hưởng không khí nhộn nhịp đặc trưng của phố ẩm thực đêm Quận 4'), 'en', 'Soak in the bustling energy iconic to District 4 night food street', CURRENT_TIMESTAMP)
ON CONFLICT (hash_key) DO UPDATE SET translated_text = EXCLUDED.translated_text;






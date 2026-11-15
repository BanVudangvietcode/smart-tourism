-- 1. Sửa lỗi font chữ tiếng Việt (UTF-8) cho các POI 9, 10, 11, 12, 13, 14
UPDATE pois SET 
    name = 'Quán Ốc Đêm Khánh Hội',
    description = 'Quán ốc đêm sầm uất trên đường Khánh Hội với thực đơn hải sản tươi sống phong phú, ốc hương rang muối ớt và sò điệp nướng mỡ hành thơm lừng.',
    address = '123 Khánh Hội, Phường 3, Quận 4'
WHERE id = 9;

UPDATE pois SET 
    name = 'Quán Ốc Đêm Bến Vân Đồn',
    description = 'Quán ốc ven sông ngắm cảnh kênh Tàu Hủ về đêm cực kỳ thoáng mát, nổi danh với các món ốc móng tay xào rau muống và càng ghẹ rang me.',
    address = '300 Bến Vân Đồn, Phường 1, Quận 4'
WHERE id = 10;

UPDATE pois SET 
    name = 'Bánh Tráng Nướng Chợ 200',
    description = 'Góc ăn vặt Chợ 200 Xóm Chiếu nức tiếng với món bánh tráng nướng Đà Lạt giòn rụm, ngập tràn tóp mỡ hành, trứng cút và phô mai béo ngậy.',
    address = 'Hẻm 200 Xóm Chiếu, Phường 15, Quận 4'
WHERE id = 11;

UPDATE pois SET 
    name = 'Bún Riêu Cua Cô Nga',
    description = 'Tô bún riêu đậm đà chuẩn vị Sài Gòn xưa với riêu cua đồng nguyên chất tơi xốp, chả lụa, đậu hũ chiên giòn và nước dùng nấu từ cà chua ngọt thanh.',
    address = '64 Nguyễn Hữu Hào, Phường 8, Quận 4'
WHERE id = 12;

UPDATE pois SET 
    name = 'Cà Phê Hoài Niệm Sài Gòn',
    description = 'Quán cà phê mang phong cách retro mộc mạc bên đường Hoàng Diệu. Không gian yên bình với những bản nhạc Trịnh và hương vị cà phê phin nguyên chất.',
    address = '299 Hoàng Diệu, Phường 6, Quận 4'
WHERE id = 13;

UPDATE pois SET 
    name = 'Trà Sữa Vĩnh Khánh',
    description = 'Quán trà sữa nhà làm thơm ngon với trân châu hoàng kim dẻo dai và trà sữa truyền thống đậm vị trà.',
    address = '150 Vĩnh Khánh, Phường 9, Quận 4'
WHERE id = 14;

-- 2. Thêm đánh giá chân thực (Community Reviews) cho các địa điểm để hiển thị đúng và đồng bộ
INSERT INTO reviews (poi_id, user_id, rating, comment, images, created_at, updated_at)
VALUES
    -- Quán Ốc Đêm Khánh Hội (POI 9)
    (9, 1, 5, 'Ốc hương rang muối ớt ở đây đỉnh chóp! Ốc tươi rói, sốt mằn mặn cay nồng chấm bánh mì ngon tuyệt vời.', ARRAY['/images/pois/poi_quan-oc-dem-khanh-hoi.jpg'], now() - interval '2 days', now() - interval '2 days'),
    (9, 12, 5, 'Quán mở khuya rất hợp cho hội bạn ăn đêm. Sò điệp nướng mỡ hành béo ngậy, phục vụ nhanh nhẹn dù quán rất đông.', ARRAY[]::text[], now() - interval '1 day', now() - interval '1 day'),
    (9, 1, 4, 'Hải sản phong phú tươi ngon, giá cả hợp lý so với mặt bằng Quận 4. Sẽ còn ghé ủng hộ quán dài dài.', ARRAY[]::text[], now() - interval '4 hours', now() - interval '4 hours'),

    -- Quán Ốc Đêm Bến Vân Đồn (POI 10)
    (10, 1, 5, 'Ngồi bờ kè gió thổi mát rượi, ngắm cảnh kênh lung linh về đêm. Càng ghẹ rang me chua ngọt bắt vị lắm.', ARRAY[]::text[], now() - interval '3 days', now() - interval '3 days'),
    (10, 12, 4, 'Ốc móng tay xào rau muống giòn ngọt, nêm nếm rất chuẩn vị miền Nam.', ARRAY[]::text[], now() - interval '1 day', now() - interval '1 day'),

    -- Bánh Tráng Nướng Chợ 200 (POI 11)
    (11, 1, 5, 'Bánh tráng nướng nhiều topping ngập tràn, giòn rụm nóng hổi ăn lúc chiều tối quá đã!', ARRAY[]::text[], now() - interval '2 days', now() - interval '2 days'),
    (11, 12, 5, 'Đi chợ 200 nhất định phải thử hàng này, cô bán hàng rất thân thiện và vui tính.', ARRAY[]::text[], now() - interval '12 hours', now() - interval '12 hours'),

    -- Bún Riêu Cua Cô Nga (POI 12)
    (12, 1, 5, 'Nước dùng thanh ngọt tự nhiên từ cà chua và riêu cua đồng nguyên chất, đĩa rau sống tươi roi rói.', ARRAY[]::text[], now() - interval '3 days', now() - interval '3 days'),
    (12, 12, 5, 'Một trong những quán bún riêu ngon nhất Quận 4 mình từng ăn, chả lụa và huyết giòn ngon.', ARRAY[]::text[], now() - interval '18 hours', now() - interval '18 hours'),

    -- Cà Phê Hoài Niệm Sài Gòn (POI 13)
    (13, 1, 5, 'Không gian hoài cổ tĩnh lặng, tiếng nhạc Trịnh du dương bên ly cà phê phin đậm đà truyền thống.', ARRAY[]::text[], now() - interval '4 days', now() - interval '4 days'),
    (13, 12, 4, 'Quán trang trí rất có gu, nhiều góc chụp ảnh retro đẹp, thức uống giá vừa túi tiền.', ARRAY[]::text[], now() - interval '2 days', now() - interval '2 days'),

    -- Cầu Mống (POI 5)
    (5, 1, 5, 'Điểm ngắm hoàng hôn và sông Sài Gòn tuyệt đẹp, gió mát và view thoáng đãng.', ARRAY[]::text[], now() - interval '5 days', now() - interval '5 days'),
    (5, 12, 4, 'Cây cầu lịch sử nổi tiếng, thích hợp đi dạo check-in chụp ảnh buổi chiều.', ARRAY[]::text[], now() - interval '2 days', now() - interval '2 days');

-- 3. Cập nhật lại avg_rating và review_count trong bảng pois khớp 100% với bảng reviews thực tế
UPDATE pois p
SET 
    review_count = COALESCE((SELECT COUNT(*) FROM reviews r WHERE r.poi_id = p.id), 0),
    avg_rating = COALESCE((SELECT ROUND(AVG(r.rating)::numeric, 1) FROM reviews r WHERE r.poi_id = p.id), 0.0);

UPDATE pois SET district = 'Quận 4', ward = 'Phường 3' WHERE id = 9;
UPDATE pois SET district = 'Quận 4', ward = 'Phường 1' WHERE id = 10;
UPDATE pois SET district = 'Quận 4', ward = 'Phường 15' WHERE id = 11;
UPDATE pois SET district = 'Quận 4', ward = 'Phường 8' WHERE id = 12;
UPDATE pois SET district = 'Quận 4', ward = 'Phường 6' WHERE id = 13;
UPDATE pois SET district = 'Quận 4', ward = 'Phường 9' WHERE id = 14;
UPDATE pois SET district = 'Quận 4' WHERE district IS NULL OR district LIKE '%??%';

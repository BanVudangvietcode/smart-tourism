import { MapPOI } from '@/types';

// Tọa độ trung tâm Quận 4, TP.HCM
export const D4_CENTER: [number, number] = [10.7613, 106.7056];

// Danh sách POI được nạp 100% động từ cơ sở dữ liệu PostgreSQL (PostGIS) qua API /api/v1/pois/search.
// Không dùng dữ liệu hardcode tĩnh.
export const POI_LIST: MapPOI[] = [];

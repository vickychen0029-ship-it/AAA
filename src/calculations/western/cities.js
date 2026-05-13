/**
 * City coordinates lookup table.
 * { lat: degrees north, lng: degrees east, tz: hours east of UTC }
 */
const CITIES = {
  '北京': { lat: 39.90, lng: 116.40, tz: 8 },
  '上海': { lat: 31.23, lng: 121.47, tz: 8 },
  '广州': { lat: 23.13, lng: 113.26, tz: 8 },
  '深圳': { lat: 22.54, lng: 114.06, tz: 8 },
  '成都': { lat: 30.57, lng: 104.07, tz: 8 },
  '重庆': { lat: 29.56, lng: 106.55, tz: 8 },
  '杭州': { lat: 30.27, lng: 120.15, tz: 8 },
  '南京': { lat: 32.06, lng: 118.80, tz: 8 },
  '武汉': { lat: 30.59, lng: 114.30, tz: 8 },
  '西安': { lat: 34.26, lng: 108.94, tz: 8 },
  '天津': { lat: 39.13, lng: 117.20, tz: 8 },
  '苏州': { lat: 31.30, lng: 120.62, tz: 8 },
  '长沙': { lat: 28.23, lng: 112.94, tz: 8 },
  '郑州': { lat: 34.75, lng: 113.62, tz: 8 },
  '沈阳': { lat: 41.80, lng: 123.43, tz: 8 },
  '济南': { lat: 36.67, lng: 116.98, tz: 8 },
  '青岛': { lat: 36.07, lng: 120.38, tz: 8 },
  '大连': { lat: 38.91, lng: 121.61, tz: 8 },
  '厦门': { lat: 24.48, lng: 118.09, tz: 8 },
  '福州': { lat: 26.07, lng: 119.30, tz: 8 },
  '昆明': { lat: 25.04, lng: 102.68, tz: 8 },
  '贵阳': { lat: 26.65, lng: 106.63, tz: 8 },
  '南宁': { lat: 22.82, lng: 108.37, tz: 8 },
  '海口': { lat: 20.02, lng: 110.35, tz: 8 },
  '哈尔滨': { lat: 45.80, lng: 126.53, tz: 8 },
  '长春': { lat: 43.88, lng: 125.32, tz: 8 },
  '乌鲁木齐': { lat: 43.83, lng: 87.62, tz: 6 },
  '拉萨': { lat: 29.65, lng: 91.10, tz: 6 },
  '呼和浩特': { lat: 40.82, lng: 111.75, tz: 8 },
  '西宁': { lat: 36.62, lng: 101.78, tz: 8 },
  '兰州': { lat: 36.06, lng: 103.79, tz: 8 },
  '银川': { lat: 38.49, lng: 106.23, tz: 8 },
  '合肥': { lat: 31.82, lng: 117.23, tz: 8 },
  '南昌': { lat: 28.68, lng: 115.86, tz: 8 },
  '石家庄': { lat: 38.04, lng: 114.51, tz: 8 },
  '太原': { lat: 37.87, lng: 112.55, tz: 8 },
  '台北': { lat: 25.03, lng: 121.57, tz: 8 },
  '香港': { lat: 22.32, lng: 114.17, tz: 8 },
  '澳门': { lat: 22.20, lng: 113.55, tz: 8 },
  'Tokyo': { lat: 35.68, lng: 139.76, tz: 9 },
  'Seoul': { lat: 37.57, lng: 126.98, tz: 9 },
  'Singapore': { lat: 1.35, lng: 103.82, tz: 8 },
  'Bangkok': { lat: 13.75, lng: 100.50, tz: 7 },
  'New York': { lat: 40.71, lng: -74.01, tz: -5 },
  'London': { lat: 51.51, lng: -0.13, tz: 0 },
  'Paris': { lat: 48.86, lng: 2.35, tz: 1 },
  'Sydney': { lat: -33.87, lng: 151.21, tz: 10 },
  'Los Angeles': { lat: 34.05, lng: -118.24, tz: -8 },
  'Vancouver': { lat: 49.28, lng: -123.12, tz: -8 },
  'Toronto': { lat: 43.65, lng: -79.38, tz: -5 },
  'Melbourne': { lat: -37.81, lng: 144.96, tz: 10 },
  'San Francisco': { lat: 37.77, lng: -122.42, tz: -8 },
  'Chicago': { lat: 41.88, lng: -87.63, tz: -6 },
}

/**
 * Look up city coordinates by name.
 * Performs exact match first, then partial match.
 * Returns { lat, lng, tz } or null.
 */
export function lookupCity(cityName) {
  if (!cityName) return null

  // Exact match
  if (CITIES[cityName]) return CITIES[cityName]

  // Case-insensitive partial match
  const lower = cityName.toLowerCase()
  for (const [name, coords] of Object.entries(CITIES)) {
    if (name.toLowerCase().includes(lower) || lower.includes(name.toLowerCase())) {
      return coords
    }
  }

  // Default: return Beijing coordinates if no match
  return { lat: 39.90, lng: 116.40, tz: 8 }
}

export default CITIES

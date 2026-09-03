/*
  ZAD — manual location catalogue.
  Used only when GPS is denied or unavailable. Egyptian cities come first
  (the app's day-to-day audience), then major Arab cities.
  Coordinates are approximate city-centre values — entirely sufficient
  for prayer-time calculation.
*/

export interface CityEntry {
  name: string
  lat: number
  lng: number
  tz: string
}

export const CITIES: CityEntry[] = [
  // مصر
  { name: 'القاهرة', lat: 30.04, lng: 31.24, tz: 'Africa/Cairo' },
  { name: 'الإسكندرية', lat: 31.2, lng: 29.92, tz: 'Africa/Cairo' },
  { name: 'دمنهور', lat: 30.97, lng: 30.47, tz: 'Africa/Cairo' },
  { name: 'طنطا', lat: 30.79, lng: 31.0, tz: 'Africa/Cairo' },
  { name: 'المنصورة', lat: 31.04, lng: 31.38, tz: 'Africa/Cairo' },
  { name: 'الزقازيق', lat: 30.58, lng: 31.51, tz: 'Africa/Cairo' },
  { name: 'شبين الكوم', lat: 30.56, lng: 31.01, tz: 'Africa/Cairo' },
  { name: 'بنها', lat: 30.46, lng: 31.18, tz: 'Africa/Cairo' },
  { name: 'دمياط', lat: 31.42, lng: 31.81, tz: 'Africa/Cairo' },
  { name: 'بورسعيد', lat: 31.26, lng: 32.3, tz: 'Africa/Cairo' },
  { name: 'الإسماعيلية', lat: 30.58, lng: 32.27, tz: 'Africa/Cairo' },
  { name: 'السويس', lat: 29.97, lng: 32.55, tz: 'Africa/Cairo' },
  { name: 'الفيوم', lat: 29.31, lng: 30.84, tz: 'Africa/Cairo' },
  { name: 'بني سويف', lat: 29.07, lng: 31.1, tz: 'Africa/Cairo' },
  { name: 'المنيا', lat: 28.1, lng: 30.75, tz: 'Africa/Cairo' },
  { name: 'أسيوط', lat: 27.18, lng: 31.19, tz: 'Africa/Cairo' },
  { name: 'سوهاج', lat: 26.56, lng: 31.7, tz: 'Africa/Cairo' },
  { name: 'الأقصر', lat: 25.69, lng: 32.64, tz: 'Africa/Cairo' },
  { name: 'أسوان', lat: 24.09, lng: 32.9, tz: 'Africa/Cairo' },
  { name: 'مرسى مطروح', lat: 31.35, lng: 27.24, tz: 'Africa/Cairo' },
  { name: 'الخارجة', lat: 25.45, lng: 30.55, tz: 'Africa/Cairo' },
  // الحجاز والخليج
  { name: 'مكة المكرمة', lat: 21.39, lng: 39.86, tz: 'Asia/Riyadh' },
  { name: 'المدينة المنورة', lat: 24.47, lng: 39.61, tz: 'Asia/Riyadh' },
  { name: 'الرياض', lat: 24.71, lng: 46.68, tz: 'Asia/Riyadh' },
  { name: 'جدة', lat: 21.49, lng: 39.19, tz: 'Asia/Riyadh' },
  { name: 'الدمام', lat: 26.43, lng: 50.1, tz: 'Asia/Riyadh' },
  { name: 'دبي', lat: 25.2, lng: 55.27, tz: 'Asia/Dubai' },
  { name: 'أبو ظبي', lat: 24.45, lng: 54.38, tz: 'Asia/Dubai' },
  { name: 'الدوحة', lat: 25.29, lng: 51.53, tz: 'Asia/Qatar' },
  { name: 'الكويت', lat: 29.38, lng: 47.99, tz: 'Asia/Kuwait' },
  { name: 'المنامة', lat: 26.23, lng: 50.59, tz: 'Asia/Bahrain' },
  { name: 'مسقط', lat: 23.59, lng: 58.41, tz: 'Asia/Muscat' },
  // الشام والعراق
  { name: 'عمّان', lat: 31.95, lng: 35.93, tz: 'Asia/Amman' },
  { name: 'بيروت', lat: 33.89, lng: 35.5, tz: 'Asia/Beirut' },
  { name: 'دمشق', lat: 33.51, lng: 36.29, tz: 'Asia/Damascus' },
  { name: 'بغداد', lat: 33.31, lng: 44.37, tz: 'Asia/Baghdad' },
  { name: 'القدس', lat: 31.78, lng: 35.22, tz: 'Asia/Jerusalem' },
  { name: 'غزة', lat: 31.5, lng: 34.47, tz: 'Asia/Gaza' },
  // وادي النيل والمغرب العربي وأفريقيا
  { name: 'الخرطوم', lat: 15.5, lng: 32.56, tz: 'Africa/Khartoum' },
  { name: 'صنعاء', lat: 15.35, lng: 44.21, tz: 'Asia/Aden' },
  { name: 'تونس', lat: 36.81, lng: 10.18, tz: 'Africa/Tunis' },
  { name: 'الجزائر', lat: 36.75, lng: 3.06, tz: 'Africa/Algiers' },
  { name: 'الرباط', lat: 34.02, lng: -6.83, tz: 'Africa/Casablanca' },
  { name: 'الدار البيضاء', lat: 33.57, lng: -7.59, tz: 'Africa/Casablanca' },
  { name: 'طرابلس', lat: 32.89, lng: 13.19, tz: 'Africa/Tripoli' },
  { name: 'نواكشوط', lat: 18.08, lng: -15.98, tz: 'Africa/Nouakchott' },
  { name: 'مقديشو', lat: 2.05, lng: 45.32, tz: 'Africa/Mogadishu' },
  { name: 'إستانبول', lat: 41.01, lng: 28.98, tz: 'Europe/Istanbul' },
]

/** Nearest catalogue city to a coordinate — for a readable place name after GPS. */
export function nearestCity(lat: number, lng: number): CityEntry {
  let best = CITIES[0]
  let bestDist = Number.POSITIVE_INFINITY
  for (const c of CITIES) {
    const dLat = c.lat - lat
    const dLng = (c.lng - lng) * Math.cos((lat * Math.PI) / 180)
    const dist = dLat * dLat + dLng * dLng
    if (dist < bestDist) {
      bestDist = dist
      best = c
    }
  }
  return best
}

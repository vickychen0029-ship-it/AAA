import { lookupCity } from '../western/cities.js'

/**
 * Resolve coordinates and timezone offset from profile.
 * Priority:
 *  1) profile.geo (standardized from API)
 *  2) built-in city table
 *  3) Beijing fallback
 */
export function resolveBirthLocation(profile) {
  const geo = profile?.geo
  const city = lookupCity(profile?.birthPlace)

  const lat = Number.isFinite(geo?.lat) ? geo.lat : (city?.lat ?? 39.9)
  const lng = Number.isFinite(geo?.lng) ? geo.lng : (city?.lng ?? 116.4)

  let tz = city?.tz
  if (typeof tz !== 'number' || Number.isNaN(tz)) tz = 8

  const timezone = typeof geo?.timezone === 'string' ? geo.timezone.trim() : ''

  return { lat, lng, tz, timezone }
}

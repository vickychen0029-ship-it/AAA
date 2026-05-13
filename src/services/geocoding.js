const CACHE_KEY = 'smweb_geocode_cache_v1'
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30

function normalizeQuery(query) {
  return (query || '').trim().toLowerCase()
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // ignore storage failure
  }
}

function getCached(query) {
  const key = normalizeQuery(query)
  if (!key) return null
  const cache = readCache()
  const hit = cache[key]
  if (!hit) return null
  if (Date.now() - hit.ts > CACHE_TTL_MS) return null
  return hit.value
}

function setCached(query, value) {
  const key = normalizeQuery(query)
  if (!key || !value) return
  const cache = readCache()
  cache[key] = { ts: Date.now(), value }
  writeCache(cache)
}

async function geocodeOpenMeteo(query) {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
  url.searchParams.set('name', query)
  url.searchParams.set('count', '1')
  url.searchParams.set('language', 'zh')
  url.searchParams.set('format', 'json')

  const res = await fetch(url.toString())
  if (!res.ok) return null
  const data = await res.json()
  const hit = data?.results?.[0]
  if (!hit) return null

  return {
    name: hit.name || query,
    lat: Number(hit.latitude),
    lng: Number(hit.longitude),
    timezone: hit.timezone || '',
    country: hit.country || '',
    admin1: hit.admin1 || '',
    source: 'open-meteo',
  }
}

async function geocodeNominatim(query) {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', '1')
  url.searchParams.set('addressdetails', '1')

  const res = await fetch(url.toString(), {
    headers: {
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    },
  })
  if (!res.ok) return null
  const list = await res.json()
  const hit = Array.isArray(list) ? list[0] : null
  if (!hit) return null

  return {
    name: hit.display_name || query,
    lat: Number(hit.lat),
    lng: Number(hit.lon),
    timezone: '',
    country: hit?.address?.country || '',
    admin1: hit?.address?.state || '',
    source: 'nominatim',
  }
}

/**
 * Standardize city/place into geo coordinates.
 * Priority: Open-Meteo -> (optional) Nominatim fallback in dev/test.
 */
export async function normalizeBirthPlace(placeText) {
  const query = (placeText || '').trim()
  if (!query) return null

  const cached = getCached(query)
  if (cached) return cached

  let result = null

  try {
    result = await geocodeOpenMeteo(query)
  } catch {
    // ignore network/provider failures and continue fallback chain
  }

  const allowNominatimFallback = import.meta.env.DEV || import.meta.env.VITE_ENABLE_NOMINATIM_FALLBACK === 'true'
  if (!result && allowNominatimFallback) {
    try {
      result = await geocodeNominatim(query)
    } catch {
      // ignore fallback provider failures
    }
  }

  if (!result) return null

  const normalized = {
    query,
    ...result,
    resolvedAt: new Date().toISOString(),
  }
  setCached(query, normalized)
  return normalized
}

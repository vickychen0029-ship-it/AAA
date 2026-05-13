import { gregorianToJD } from './julianDay.js'

function getOffsetHoursAtUtcMs(iana, utcMs) {
  try {
    const utcDate = new Date(utcMs)
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: iana,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })

    const parts = formatter.formatToParts(utcDate)
    const map = Object.fromEntries(parts.map((p) => [p.type, p.value]))
    const asUtcMs = Date.UTC(
      Number(map.year),
      Number(map.month) - 1,
      Number(map.day),
      Number(map.hour),
      Number(map.minute),
      Number(map.second),
    )

    return (asUtcMs - utcMs) / 3600000
  } catch {
    return null
  }
}

function localWallTimeToUtcMs({
  year,
  month,
  day,
  hour,
  minute,
  timezone,
  fallbackOffsetHours,
}) {
  const localWallUtcMs = Date.UTC(year, month - 1, day, hour, minute, 0)
  let guessUtcMs = localWallUtcMs - fallbackOffsetHours * 3600000

  for (let i = 0; i < 6; i += 1) {
    const offset = getOffsetHoursAtUtcMs(timezone, guessUtcMs)
    if (!Number.isFinite(offset)) return null

    const nextGuess = localWallUtcMs - offset * 3600000
    if (Math.abs(nextGuess - guessUtcMs) < 1000) {
      return { utcMs: nextGuess, offsetHours: offset, source: 'iana' }
    }
    guessUtcMs = nextGuess
  }

  const finalOffset = getOffsetHoursAtUtcMs(timezone, guessUtcMs)
  if (!Number.isFinite(finalOffset)) return null
  return { utcMs: guessUtcMs, offsetHours: finalOffset, source: 'iana' }
}

/**
 * Convert profile local birth time into UTC Julian Day.
 *
 * Priority:
 *  1) IANA timezone from geocoding (auto historical DST)
 *  2) Manual fallback: city tz plus optional profile.isDST (when dstMode='manual')
 */
export function birthTimeToJulianDay(profile, location, year, month, day, hour, minute) {
  const timezone = location?.timezone
  const fallbackOffsetHours = Number.isFinite(location?.tz) ? location.tz : 8
  const dstMode = profile?.dstMode === 'manual' ? 'manual' : 'auto'

  if (timezone && dstMode === 'auto') {
    const converted = localWallTimeToUtcMs({
      year,
      month,
      day,
      hour,
      minute,
      timezone,
      fallbackOffsetHours,
    })
    if (converted) {
      return {
        jd: converted.utcMs / 86400000 + 2440587.5,
        utcOffsetHours: converted.offsetHours,
        mode: 'iana-auto',
      }
    }
  }

  const manualDstHours = dstMode === 'manual' && profile?.isDST ? 1 : 0
  const utcHour = hour - fallbackOffsetHours - manualDstHours

  return {
    jd: gregorianToJD(year, month, day, utcHour, minute),
    utcOffsetHours: fallbackOffsetHours + manualDstHours,
    mode: 'manual-fallback',
  }
}

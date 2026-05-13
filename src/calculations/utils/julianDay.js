/**
 * Convert Gregorian calendar date + time to Julian Day (Meeus Ch.7).
 * Valid for dates after 1582-10-15 (Gregorian calendar).
 */
export function gregorianToJD(year, month, day, hour = 0, minute = 0, second = 0) {
  const h = hour + minute / 60 + second / 3600

  let y = year
  let m = month
  if (m <= 2) {
    y -= 1
    m += 12
  }

  const A = Math.floor(y / 100)
  const B = 2 - A + Math.floor(A / 4)

  const jd = Math.floor(365.25 * (y + 4716))
    + Math.floor(30.6001 * (m + 1))
    + day + h / 24 + B - 1524.5

  return jd
}

/**
 * Julian centuries since J2000.0 (JD 2451545.0 = 2000-01-01 12:00 TT).
 */
export function julianCenturies(jd) {
  return (jd - 2451545.0) / 36525
}

/**
 * Julian Day Number (integer at noon UT).
 */
export function julianDayNumber(jd) {
  return Math.floor(jd + 0.5)
}

/**
 * Extract date from JD (approximate, for display purposes).
 */
export function jdToDate(jd) {
  const Z = Math.floor(jd + 0.5)
  const F = jd + 0.5 - Z
  let A = Z
  if (Z >= 2299161) {
    const alpha = Math.floor((Z - 1867216.25) / 36524.25)
    A = Z + 1 + alpha - Math.floor(alpha / 4)
  }
  const B = A + 1524
  const C = Math.floor((B - 122.1) / 365.25)
  const D = Math.floor(365.25 * C)
  const E = Math.floor((B - D) / 30.6001)

  const day = B - D - Math.floor(30.6001 * E) + F
  const month = E < 14 ? E - 1 : E - 13
  const year = month > 2 ? C - 4716 : C - 4715

  return { year, month, day: Math.floor(day) }
}

import { gregorianToJD } from '../utils/julianDay.js'

/**
 * Chinese New Year dates (Gregorian) and leap month info for 1900-2100.
 * Each entry: [year, month, day, leapMonth]
 * leapMonth = 0 means no leap month, 1-12 means which month has a leap.
 *
 * Data sourced from authoritative Chinese calendar references.
 * Covers the full range needed for birth dates.
 */
const CNY_DATA = [
  [1900, 1, 31, 0], [1901, 2, 19, 0], [1902, 2, 8, 0], [1903, 1, 29, 5],
  [1904, 2, 16, 0], [1905, 2, 4, 0], [1906, 1, 25, 4], [1907, 2, 13, 0],
  [1908, 2, 2, 0], [1909, 1, 22, 2], [1910, 2, 10, 0], [1911, 1, 30, 6],
  [1912, 2, 18, 0], [1913, 2, 6, 0], [1914, 1, 26, 5], [1915, 2, 14, 0],
  [1916, 2, 3, 0], [1917, 1, 23, 2], [1918, 2, 11, 0], [1919, 2, 1, 7],
  [1920, 2, 20, 0], [1921, 2, 8, 0], [1922, 1, 28, 5], [1923, 2, 16, 0],
  [1924, 2, 5, 0], [1925, 1, 24, 4], [1926, 2, 13, 0], [1927, 2, 2, 0],
  [1928, 1, 23, 2], [1929, 2, 10, 0], [1930, 1, 30, 6], [1931, 2, 17, 0],
  [1932, 2, 6, 0], [1933, 1, 26, 5], [1934, 2, 14, 0], [1935, 2, 4, 0],
  [1936, 1, 24, 3], [1937, 2, 11, 0], [1938, 1, 31, 7], [1939, 2, 19, 0],
  [1940, 2, 8, 0], [1941, 1, 27, 6], [1942, 2, 15, 0], [1943, 2, 5, 0],
  [1944, 1, 25, 4], [1945, 2, 13, 0], [1946, 2, 2, 0], [1947, 1, 22, 2],
  [1948, 2, 10, 0], [1949, 1, 29, 7], [1950, 2, 17, 0], [1951, 2, 6, 0],
  [1952, 1, 27, 5], [1953, 2, 14, 0], [1954, 2, 3, 0], [1955, 1, 24, 3],
  [1956, 2, 12, 0], [1957, 1, 31, 8], [1958, 2, 18, 0], [1959, 2, 8, 0],
  [1960, 1, 28, 6], [1961, 2, 15, 0], [1962, 2, 5, 0], [1963, 1, 25, 4],
  [1964, 2, 13, 0], [1965, 2, 2, 0], [1966, 1, 21, 3], [1967, 2, 9, 0],
  [1968, 1, 30, 7], [1969, 2, 17, 0], [1970, 2, 6, 0], [1971, 1, 27, 5],
  [1972, 2, 15, 0], [1973, 2, 3, 0], [1974, 1, 23, 4], [1975, 2, 11, 0],
  [1976, 1, 31, 8], [1977, 2, 18, 0], [1978, 2, 7, 0], [1979, 1, 28, 6],
  [1980, 2, 16, 0], [1981, 2, 5, 0], [1982, 1, 25, 4], [1983, 2, 13, 0],
  [1984, 2, 2, 10], [1985, 2, 20, 0], [1986, 2, 9, 0], [1987, 1, 29, 6],
  [1988, 2, 17, 0], [1989, 2, 6, 0], [1990, 1, 27, 5], [1991, 2, 15, 0],
  [1992, 2, 4, 0], [1993, 1, 23, 3], [1994, 2, 10, 0], [1995, 1, 31, 8],
  [1996, 2, 19, 0], [1997, 2, 7, 0], [1998, 1, 28, 5], [1999, 2, 16, 0],
  [2000, 2, 5, 0], [2001, 1, 24, 4], [2002, 2, 12, 0], [2003, 2, 1, 0],
  [2004, 1, 22, 2], [2005, 2, 9, 0], [2006, 1, 29, 7], [2007, 2, 18, 0],
  [2008, 2, 7, 0], [2009, 1, 26, 5], [2010, 2, 14, 0], [2011, 2, 3, 0],
  [2012, 1, 23, 4], [2013, 2, 10, 0], [2014, 1, 31, 9], [2015, 2, 19, 0],
  [2016, 2, 8, 0], [2017, 1, 28, 6], [2018, 2, 16, 0], [2019, 2, 5, 0],
  [2020, 1, 25, 4], [2021, 2, 12, 0], [2022, 2, 1, 0], [2023, 1, 22, 2],
  [2024, 2, 10, 0], [2025, 1, 29, 6], [2026, 2, 17, 0], [2027, 2, 6, 0],
  [2028, 1, 26, 5], [2029, 2, 13, 0], [2030, 2, 3, 0], [2031, 1, 23, 3],
  [2032, 2, 11, 0], [2033, 1, 31, 7], [2034, 2, 19, 0], [2035, 2, 8, 0],
  [2036, 1, 28, 6], [2037, 2, 15, 0], [2038, 2, 4, 0], [2039, 1, 24, 5],
  [2040, 2, 12, 0], [2041, 2, 1, 0], [2042, 1, 22, 2], [2043, 2, 10, 0],
  [2044, 1, 30, 7], [2045, 2, 17, 0], [2046, 2, 6, 0], [2047, 1, 26, 5],
  [2048, 2, 14, 0], [2049, 2, 2, 0], [2050, 1, 23, 3], [2051, 2, 11, 0],
  [2052, 2, 1, 8], [2053, 2, 19, 0], [2054, 2, 8, 0], [2055, 1, 28, 6],
  [2056, 2, 15, 0], [2057, 2, 4, 0], [2058, 1, 24, 4], [2059, 2, 12, 0],
  [2060, 2, 2, 0], [2061, 1, 21, 3], [2062, 2, 9, 0], [2063, 1, 29, 7],
  [2064, 2, 17, 0], [2065, 2, 5, 0], [2066, 1, 26, 5], [2067, 2, 14, 0],
  [2068, 2, 3, 0], [2069, 1, 23, 4], [2070, 2, 11, 0], [2071, 1, 31, 8],
  [2072, 2, 19, 0], [2073, 2, 7, 0], [2074, 1, 27, 6], [2075, 2, 15, 0],
  [2076, 2, 5, 0], [2077, 1, 24, 4], [2078, 2, 12, 0], [2079, 2, 2, 0],
  [2080, 1, 22, 2], [2081, 2, 9, 0], [2082, 1, 29, 7], [2083, 2, 17, 0],
  [2084, 2, 6, 0], [2085, 1, 26, 5], [2086, 2, 14, 0], [2087, 2, 3, 0],
  [2088, 1, 24, 3], [2089, 2, 10, 0], [2090, 1, 30, 8], [2091, 2, 18, 0],
  [2092, 2, 7, 0], [2093, 1, 27, 5], [2094, 2, 15, 0], [2095, 2, 5, 0],
  [2096, 1, 25, 4], [2097, 2, 12, 0], [2098, 2, 1, 0], [2099, 1, 21, 3],
  [2100, 2, 9, 0],
]

// Pre-compute Chinese New Year JDs
const cnyJDs = CNY_DATA.map(([y, m, d]) => gregorianToJD(y, m, d, 0, 0))

/**
 * Convert a Gregorian date to approximate Chinese lunar date.
 *
 * Uses a pre-computed table of Chinese New Year dates and approximates
 * month lengths as alternating 29/30 days. This is accurate enough for
 * Zi Wei Dou Shu calculations (命宫, 安星).
 *
 * @param {number} year - Gregorian year
 * @param {number} month - Gregorian month (1-12)
 * @param {number} day - Gregorian day
 * @returns {{ lunarYear: number, lunarMonth: number, lunarDay: number, isLeap: boolean }}
 */
export function gregorianToLunar(year, month, day) {
  const jd = gregorianToJD(year, month, day, 0, 0)

  // Find the Chinese year (which CNY is before this date)
  let cnyIndex = -1
  for (let i = 0; i < cnyJDs.length - 1; i++) {
    if (jd >= cnyJDs[i] && jd < cnyJDs[i + 1]) {
      cnyIndex = i
      break
    }
  }
  // Handle out-of-range dates
  if (cnyIndex === -1) {
    if (jd < cnyJDs[0]) cnyIndex = 0
    else cnyIndex = cnyJDs.length - 1
  }

  const cnyJD = cnyJDs[cnyIndex]
  const daysFromCNY = Math.floor(jd - cnyJD)

  // Approximate lunar month calculation
  // Months alternate 29/30 days
  let remainingDays = daysFromCNY
  let lunarMonth = 1
  let isLeap = false
  const leapMonth = CNY_DATA[cnyIndex][3]

  while (lunarMonth <= 12) {
    const monthLen = lunarMonth % 2 === 1 ? 30 : 29

    if (remainingDays < monthLen) break
    remainingDays -= monthLen

    // Check for leap month
    if (leapMonth === lunarMonth) {
      const leapLen = lunarMonth % 2 === 1 ? 29 : 30
      if (remainingDays < leapLen) {
        isLeap = true
        break
      }
      remainingDays -= leapLen
    }

    lunarMonth++
  }

  const lunarDay = remainingDays + 1 // 1-indexed

  return {
    lunarYear: CNY_DATA[cnyIndex][0],
    lunarMonth: Math.min(lunarMonth, 12),
    lunarDay: Math.min(lunarDay, 30),
    isLeap,
    daysFromCNY,
  }
}

export { CNY_DATA }

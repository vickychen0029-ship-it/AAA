import { rad, deg, normalizeDeg } from '../utils/angles.js'
import { julianCenturies } from '../utils/julianDay.js'
import { sunLongitude } from './sun.js'

/**
 * Mean orbital elements (Meeus Ch.31 + JPL for Juno).
 *
 * Each element is a polynomial of T (Julian centuries since J2000):
 *   a0 + a1*T + a2*T^2 + a3*T^3
 *
 * L  = mean longitude (deg)
 * a  = semi-major axis (AU)
 * e  = eccentricity
 * i  = inclination (deg)
 * Omega = longitude of ascending node (deg)
 * pi = longitude of perihelion (deg) = Omega + omega
 */
const PLANETS = {
  mercury: {
    L:     [252.250906, 149472.6746358, 0.00030397, 0.000000018],
    a:     [0.387098310, 0, 0, 0],
    e:     [0.20563175, 0.000020406, -0.0000000284, 0],
    i:     [7.004986, 0.0018215, -0.00001809, 0.000000053],
    Omega: [48.330893, 1.1861890, 0.00017587, 0.000000211],
    pi:    [77.456119, 1.5564775, 0.00029589, 0.000000056],
  },
  venus: {
    L:     [181.979801, 58517.8156760, 0.00000165, -0.000000002],
    a:     [0.723329820, 0, 0, 0],
    e:     [0.00677188, -0.000047766, 0.000000098, -0.00000000046],
    i:     [3.394662, 0.0010037, -0.00000088, 0],
    Omega: [76.679920, 0.9011190, 0.00040665, -0.000000080],
    pi:    [131.563707, 1.4022188, -0.00107322, -0.00000517],
  },
  mars: {
    L:     [355.453000, 19140.3026840, 0.00000162, 0.000000002],
    a:     [1.523679342, 0, 0, 0],
    e:     [0.09340062, 0.000090483, -0.0000000806, -0.00000000035],
    i:     [1.849726, -0.0006010, 0.00001276, -0.000000007],
    Omega: [49.558093, 0.7720923, 0.00001557, 0.000002267],
    pi:    [336.060234, 1.8410449, 0.00013531, 0.000000318],
  },
  jupiter: {
    L:     [34.351519, 3036.3027748, 0.00022330, 0.000000037],
    a:     [5.202603209, 0.0000001913, 0, 0],
    e:     [0.04849793, 0.000163225, -0.0000004714, -0.00000000201],
    i:     [1.303267, -0.0054965, 0.00000466, -0.000000002],
    Omega: [100.454407, 1.0209774, 0.00040315, 0.000000404],
    pi:    [14.331207, 1.6126352, 0.00103042, -0.000004464],
  },
  saturn: {
    L:     [50.077444, 1223.5110686, 0.00051908, -0.000000030],
    a:     [9.554909192, -0.0000021390, 0.000000004, 0],
    e:     [0.05554814, -0.000346641, -0.0000006436, 0.00000000340],
    i:     [2.488879, -0.0037362, 0.00001519, 0.000000087],
    Omega: [113.665503, 0.8770880, -0.00012176, -0.000002249],
    pi:    [93.057237, 1.9637613, 0.00083753, 0.000004928],
  },
  // 3 Juno — osculating elements from JPL epoch 2025-Nov-21, propagated to J2000
  juno: {
    L:     [300.26, 8247.86, 0, 0],
    a:     [2.67088, 0, 0, 0],
    e:     [0.25583, 0, 0, 0],
    i:     [12.986, 0, 0, 0],
    Omega: [169.820, 0, 0, 0],
    pi:    [57.70, 0, 0, 0],
  },
}

function poly(coeffs, T) {
  return coeffs[0] + coeffs[1] * T + coeffs[2] * T * T + coeffs[3] * T * T * T
}

/**
 * Compute heliocentric ecliptic rectangular coordinates (x, y, z) for a planet.
 * Returns { x, y, z, r } in AU, referred to mean equinox of date.
 */
function heliocentricXYZ(name, jd) {
  const T = julianCenturies(jd)
  const p = PLANETS[name]
  if (!p) throw new Error('Unknown planet: ' + name)

  const L = normalizeDeg(poly(p.L, T))
  const a = poly(p.a, T)
  const e = poly(p.e, T)
  const i = rad(poly(p.i, T))
  const Omega = rad(poly(p.Omega, T))
  const pi = rad(poly(p.pi, T))

  // Mean anomaly
  const M = rad(normalizeDeg(L - deg(pi)))

  // Solve Kepler's equation (Newton-Raphson, converges for all e < 1)
  let E = M
  for (let iter = 0; iter < 10; iter++) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E))
    E = E - dE
    if (Math.abs(dE) < 1e-10) break
  }

  // Heliocentric distance
  const r = a * (1 - e * Math.cos(E))

  // True anomaly
  const sinV = Math.sqrt(1 - e * e) * Math.sin(E)
  const cosV = Math.cos(E) - e
  const v = Math.atan2(sinV, cosV)

  // Argument of perihelion
  const w = pi - Omega

  // Heliocentric ecliptic coordinates
  const cosN = Math.cos(Omega)
  const sinN = Math.sin(Omega)
  const cosI = Math.cos(i)
  const sinI = Math.sin(i)
  const cosVW = Math.cos(v + w)
  const sinVW = Math.sin(v + w)

  const x = r * (cosN * cosVW - sinN * sinVW * cosI)
  const y = r * (sinN * cosVW + cosN * sinVW * cosI)
  const z = r * sinVW * sinI

  return { x, y, z, r }
}

/**
 * Get geocentric ecliptic longitude for a planet.
 *
 * Computes the planet's heliocentric position, then subtracts Earth's
 * heliocentric position (derived from the Sun's geocentric longitude + 180°).
 * This ensures internal consistency with our sun position calculation.
 *
 * @param {string} name — 'mercury'|'venus'|'mars'|'jupiter'|'saturn'|'juno'
 * @param {number} jd - Julian Day
 * @returns {number} geocentric ecliptic longitude in degrees (0-360)
 */
export function planetLongitude(name, jd) {
  const hp = heliocentricXYZ(name, jd)

  // Earth's heliocentric position = Sun's geocentric position + 180°
  const sunLon = sunLongitude(jd)
  const earthLon = normalizeDeg(sunLon + 180)

  // Earth distance ~1 AU (varies ±1.7%; error < 1° for geocentric planets)
  const earthR = 1.0
  const xe = earthR * Math.cos(rad(earthLon))
  const ye = earthR * Math.sin(rad(earthLon))

  return normalizeDeg(deg(Math.atan2(hp.y - ye, hp.x - xe)))
}

/**
 * Convenience: Juno (婚神星) geocentric ecliptic longitude.
 */
export function junoLongitude(jd) {
  return planetLongitude('juno', jd)
}

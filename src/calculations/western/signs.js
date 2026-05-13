const ZODIAC_SIGNS = [
  { id: 'aries', emoji: '♈', name: '白羊座', element: '火', start: 0 },
  { id: 'taurus', emoji: '♉', name: '金牛座', element: '土', start: 30 },
  { id: 'gemini', emoji: '♊', name: '双子座', element: '风', start: 60 },
  { id: 'cancer', emoji: '♋', name: '巨蟹座', element: '水', start: 90 },
  { id: 'leo', emoji: '♌', name: '狮子座', element: '火', start: 120 },
  { id: 'virgo', emoji: '♍', name: '处女座', element: '土', start: 150 },
  { id: 'libra', emoji: '♎', name: '天秤座', element: '风', start: 180 },
  { id: 'scorpio', emoji: '♏', name: '天蝎座', element: '水', start: 210 },
  { id: 'sagittarius', emoji: '♐', name: '射手座', element: '火', start: 240 },
  { id: 'capricorn', emoji: '♑', name: '摩羯座', element: '土', start: 270 },
  { id: 'aquarius', emoji: '♒', name: '水瓶座', element: '风', start: 300 },
  { id: 'pisces', emoji: '♓', name: '双鱼座', element: '水', start: 330 },
]

/**
 * Get zodiac sign from ecliptic longitude (0-360 degrees, tropical).
 */
export function getSign(longitude) {
  const idx = Math.floor(((longitude % 360) + 360) % 360 / 30)
  return ZODIAC_SIGNS[idx]
}

export { ZODIAC_SIGNS }

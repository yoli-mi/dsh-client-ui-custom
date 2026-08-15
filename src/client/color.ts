/**
 * Pure color math for the wallpaper auto-accent feature (Material-You style).
 * DOM-free so it is unit-testable: feed it RGBA pixel data, get a hex color.
 *
 * Strategy: bucket pixels by hue, ignore washed-out samples (near-white,
 * near-black, low saturation), score each bucket by saturation-weighted
 * population, and average the winning bucket's RGB into a hex color.
 */

/** Number of hue buckets around the wheel. */
const HUE_BUCKETS = 24

/** Ignore pixels this close to white, black, or neutral gray. */
const MIN_SATURATION = 0.18
const MIN_LIGHTNESS = 0.14
const MAX_LIGHTNESS = 0.86

const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
  const rf = r / 255
  const gf = g / 255
  const bf = b / 255
  const max = Math.max(rf, gf, bf)
  const min = Math.min(rf, gf, bf)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === rf) h = ((gf - bf) / d + (gf < bf ? 6 : 0)) / 6
  else if (max === gf) h = ((bf - rf) / d + 2) / 6
  else h = ((rf - gf) / d + 4) / 6
  return { h, s, l }
}

/** Format an RGB triple as '#rrggbb'. */
export const rgbToHex = (r: number, g: number, b: number): string => {
  const hex = (n: number): string => Math.round(n).toString(16).padStart(2, '0')
  return `#${hex(r)}${hex(g)}${hex(b)}`
}

/** Parse a '#rrggbb' (or '#rgb') hex color into an RGB triple. */
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const match = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(hex.trim())
  if (match === null) return null
  const group = match[1] ?? ''
  const text = group.length === 3 ? group.split('').map((c) => c + c).join('') : group
  const value = Number.parseInt(text, 16)
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 }
}

/** Format an HSL triple as '#rrggbb'. */
const hslToHex = (h: number, s: number, l: number): string => {
  const f = (n: number): number => {
    const k = (n + h * 12) % 12
    const a = s * Math.min(l, 1 - l)
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
  }
  return rgbToHex(f(0) * 255, f(8) * 255, f(4) * 255)
}

/**
 * Derive a harmonious accent palette from one hex color (Material-You style):
 * the base, two analogous neighbors, the complementary, two triadic partners,
 * and one darkened tint — seven swatches the appearance page offers as
 * one-click accent alternatives. Pure and DOM-free.
 * @param hex - a '#rrggbb' accent color.
 * @returns '#rrggbb' swatches (the base first); an invalid hex yields [].
 */export function harmonySwatches(hex: string): string[] {
  const rgb = hexToRgb(hex)
  if (rgb === null) return []
  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b)
  if (s === 0) return [rgbToHex(rgb.r, rgb.g, rgb.b)]
  const hue = h * 360
  const wrap = (deg: number): number => ((deg % 360) + 360) % 360
  const at = (deg: number, sat: number, light: number): string => hslToHex(wrap(deg) / 360, sat, light)
  return [
    rgbToHex(rgb.r, rgb.g, rgb.b),
    at(hue + 30, s, l),
    at(hue - 30, s, l),
    at(hue + 180, s, l),
    at(hue + 120, s, l),
    at(hue - 120, s, l),
    at(hue, Math.min(1, s * 1.1), Math.max(0.12, l * 0.62)),
  ]
}

/**
 * Extract the dominant saturated color from RGBA pixel data (as produced by
 * canvas getImageData). Returns null when no usable color is found.
 * @param data - RGBA byte quadruples.
 * @returns '#rrggbb' or null.
 */
export function dominantColorFromRgba(data: Uint8ClampedArray): string | null {
  interface Bucket { count: number; satSum: number; r: number; g: number; b: number }
  const buckets: (Bucket | undefined)[] = new Array(HUE_BUCKETS)

  for (let i = 0; i + 3 < data.length; i += 4) {
    const a = data[i + 3]
    if (a === undefined || a < 125) continue // skip largely transparent pixels
    const r = data[i] ?? 0
    const g = data[i + 1] ?? 0
    const b = data[i + 2] ?? 0
    const { h, s, l } = rgbToHsl(r, g, b)
    if (s < MIN_SATURATION || l < MIN_LIGHTNESS || l > MAX_LIGHTNESS) continue
    const index = Math.min(HUE_BUCKETS - 1, Math.floor(h * HUE_BUCKETS))
    const bucket = (buckets[index] ??= { count: 0, satSum: 0, r: 0, g: 0, b: 0 })
    bucket.count += 1
    bucket.satSum += s
    bucket.r += r
    bucket.g += g
    bucket.b += b
  }

  // Score by saturation-weighted population (bright, colorful pixels win).
  let best: Bucket | undefined
  let bestScore = 0
  for (const bucket of buckets) {
    if (bucket === undefined || bucket.count === 0) continue
    const score = bucket.count * (bucket.satSum / bucket.count)
    if (score > bestScore) {
      bestScore = score
      best = bucket
    }
  }
  if (best === undefined) return null
  return rgbToHex(best.r / best.count, best.g / best.count, best.b / best.count)
}

/** A curated set of muted hues (degrees) for the "随机灵感" button — warm to
 * cool, all low-key enough to read as 高级 rather than neon. */
const INSPIRATION_HUES: readonly number[] = [0, 10, 20, 32, 46, 62, 82, 104, 124, 148, 172, 196, 220, 244, 264, 286, 306, 328]

const pick = <T>(rng: () => number, options: readonly T[]): T =>
  options[Math.min(options.length - 1, Math.floor(rng() * options.length))] ?? options[0] ?? (undefined as T)
const between = (rng: () => number, lo: number, hi: number): number => lo + rng() * (hi - lo)

/**
 * Generate one harmonious "random inspiration" theme from the color palette
 * algorithm: a muted accent sampled from a curated hue pool, a gradient built
 * from the accent + its analogous neighbor + a neutral end, and a coherent
 * glass/opacity/scrim recipe. Pure and DOM-free; the RNG is injectable so the
 * output is deterministic in tests.
 * @param rng - random source (default Math.random).
 * @returns a partial theme config (wallpaper cleared; fonts untouched).
 */
export function randomInspirationConfig(rng: () => number = Math.random): Partial<import('./config.ts').CustomThemeConfig> {
  const hue = pick(rng, INSPIRATION_HUES) + between(rng, -6, 6)
  const sat = between(rng, 0.30, 0.46)
  const light = between(rng, 0.52, 0.64)
  const dark = rng() < 0.35 // roughly a third of the time: a night scheme
  const accent = hslToHex(hue / 360, sat, light)
  const accentRgb = hexToRgb(accent) ?? { r: 128, g: 128, b: 128 }
  const mid = hslToHex(((hue + 16) % 360) / 360, Math.min(0.9, sat * 0.75), Math.min(0.92, light * 0.8 + 0.28))
  const midRgb = hexToRgb(mid) ?? accentRgb
  const end = hexToRgb(dark ? hslToHex(0, 0, 0.07) : hslToHex(0, 0, 0.97)) ?? accentRgb
  const gradient = dark
    ? `linear-gradient(160deg, rgb(${accentRgb.r} ${accentRgb.g} ${accentRgb.b} / 0.38) 0%, rgb(${midRgb.r} ${midRgb.g} ${midRgb.b} / 0.34) 55%, rgb(${end.r} ${end.g} ${end.b} / 0.52) 100%)`
    : `linear-gradient(160deg, rgb(${accentRgb.r} ${accentRgb.g} ${accentRgb.b} / 0.42) 0%, rgb(${midRgb.r} ${midRgb.g} ${midRgb.b} / 0.26) 55%, rgb(${end.r} ${end.g} ${end.b} / 0.32) 100%)`
  const surface = Math.round(between(rng, 30, 46))
  const glass = pick(rng, ['light', 'frosted', 'mica'] as const)
  const radius = pick(rng, ['md', 'lg'] as const)
  const shadow = pick(rng, ['soft', 'medium'] as const)
  return {
    wallpaper: '',
    glass,
    accent,
    autoAccent: false,
    surfaceOpacity: surface,
    sidebarOpacity: surface,
    chatSurfaceOpacity: Math.min(100, surface + 22),
    inputOpacity: Math.min(100, surface + 28),
    codeBlockOpacity: Math.min(100, surface + 12),
    darkSurfaceOpacity: surface,
    gradient,
    darkScrim: dark ? Math.round(between(rng, 26, 40)) : Math.round(between(rng, 10, 24)),
    fontFamily: '',
    codeFontFamily: '',
    fontScale: 1,
    scrollbarAccent: rng() < 0.7,
    vignette: dark,
    cornerRadius: radius,
    surfaceShadow: shadow,
    focusGlow: rng() < 0.6 ? 'on' : 'inherit',
    wallpaperTone: 'inherit',
    darkAccent: dark ? accent : '',
  }
}

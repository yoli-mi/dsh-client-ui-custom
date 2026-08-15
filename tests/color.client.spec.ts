// @vitest-environment node
/**
 * ui-custom dominant-color extraction (color.ts): pure RGBA → hex logic.
 * Feeds synthetic pixel data so the algorithm's behavior is pinned down:
 * washed-out pixels are ignored, saturated hues win, transparent pixels skip.
 */
import { describe, expect, it } from 'vitest'
import { dominantColorFromRgba, rgbToHex } from '../src/client/color.ts'

const rgba = (pixels: [number, number, number, number][]): Uint8ClampedArray =>
  new Uint8ClampedArray(pixels.flat())

describe('rgbToHex', () => {
  it('formats rgb triples as #rrggbb', () => {
    expect(rgbToHex(0, 0, 0)).toBe('#000000')
    expect(rgbToHex(255, 255, 255)).toBe('#ffffff')
    expect(rgbToHex(65, 118, 230)).toBe('#4176e6')
  })
})

describe('dominantColorFromRgba', () => {
  it('returns the dominant saturated hue', () => {
    // Mostly gray (ignored) with a block of saturated blue.
    const pixels: [number, number, number, number][] = []
    for (let i = 0; i < 900; i++) pixels.push([200, 200, 200, 255])
    for (let i = 0; i < 100; i++) pixels.push([65, 118, 230, 255])
    expect(dominantColorFromRgba(rgba(pixels))).toBe('#4176e6')
  })

  it('ignores near-white, near-black, and low-saturation pixels', () => {
    const pixels: [number, number, number, number][] = [
      [250, 251, 252, 255], // near-white
      [12, 12, 12, 255],    // near-black
      [128, 130, 132, 255], // neutral gray
      [65, 118, 230, 255],  // the only usable pixel
    ]
    expect(dominantColorFromRgba(rgba(pixels))).toBe('#4176e6')
  })

  it('skips largely transparent pixels', () => {
    const pixels: [number, number, number, number][] = [
      [65, 118, 230, 30],   // transparent → skipped
      [255, 0, 0, 255],     // opaque red remains
    ]
    expect(dominantColorFromRgba(rgba(pixels))).toBe('#ff0000')
  })

  it('returns null when nothing usable is present', () => {
    expect(dominantColorFromRgba(rgba([[240, 240, 240, 255]]))).toBeNull()
    expect(dominantColorFromRgba(new Uint8ClampedArray(0))).toBeNull()
  })

  it('prefers the more saturated population when hues tie in count', () => {
    const pixels: [number, number, number, number][] = []
    // 60 dull-ish blue + 40 vivid pink: vivid pink should win.
    for (let i = 0; i < 60; i++) pixels.push([90, 120, 200, 255])
    for (let i = 0; i < 40; i++) pixels.push([255, 60, 150, 255])
    expect(dominantColorFromRgba(rgba(pixels))).toBe('#ff3c96')
  })
})

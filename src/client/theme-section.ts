/**
 * Mapping from the runtime theme section (settings scope) onto a normalized
 * CustomThemeConfig. Pure and testable: the section carries the settings
 * document's resolved values (user overrides layered over the loader base);
 * fields absent while loading/unavailable fall back to the loader config.
 */
import {
  isCornerRadius, isFocusGlow, isSurfaceShadow, isWallpaperTone,
  type CustomThemeConfig, type GlassLevel,
} from './config.ts'
import type { ThemeSection } from '../shared.ts'

const GLASS_LEVELS: readonly string[] = ['off', 'light', 'frosted', 'mica']

const isGlassLevel = (value: unknown): value is GlassLevel =>
  typeof value === 'string' && GLASS_LEVELS.includes(value)

/**
 * Merge a theme section over the normalized loader config.
 * @param normalized - the loader-layer normalized config (fallback).
 * @param section - the settings scope's resolved theme section.
 * @returns the effective config the applier should render.
 */
export function configFromThemeSection(
  normalized: CustomThemeConfig,
  section: ThemeSection | undefined,
): CustomThemeConfig {
  if (section === undefined) return normalized
  // darkSurfaceOpacity is the only optional CustomThemeConfig field; spread it
  // out so an explicit undefined never lands on an optional property
  // (exactOptionalPropertyTypes).
  const { darkSurfaceOpacity, ...rest } = normalized
  // String knobs treat an empty section value as "no override" (falls back to
  // the loader layer): clearing wallpaper in the settings form must revert to
  // the loader wallpaper, never silently disable the whole theme.
  const stringField = (value: string | undefined, fallback: string): string =>
    value !== undefined && value !== '' ? value : fallback
  return {
    ...rest,
    // The dark main surface defaults to the LIVE surfaceOpacity: absent an
    // explicit darkSurfaceOpacity override (see index.ts applyTheme dropping
    // it when the raw user layer does not carry it), dragging 表面不透明度
    // moves the dark background too.
    darkSurfaceOpacity: section.darkSurfaceOpacity ?? section.surfaceOpacity ?? darkSurfaceOpacity ?? 100,
    wallpaper: stringField(section.wallpaper, normalized.wallpaper),
    glass: isGlassLevel(section.glass) ? section.glass : normalized.glass,
    accent: stringField(section.accent, normalized.accent),
    autoAccent: section.autoAccent ?? normalized.autoAccent,
    surfaceOpacity: section.surfaceOpacity ?? normalized.surfaceOpacity,
    sidebarOpacity: section.sidebarOpacity ?? normalized.sidebarOpacity,
    chatSurfaceOpacity: section.chatSurfaceOpacity ?? normalized.chatSurfaceOpacity,
    inputOpacity: section.inputOpacity ?? normalized.inputOpacity,
    codeBlockOpacity: section.codeBlockOpacity ?? normalized.codeBlockOpacity,
    gradient: stringField(section.gradient, normalized.gradient),
    darkScrim: section.darkScrim ?? normalized.darkScrim,
    fontFamily: stringField(section.fontFamily, normalized.fontFamily),
    codeFontFamily: stringField(section.codeFontFamily, normalized.codeFontFamily),
    fontScale: section.fontScale ?? normalized.fontScale,
    scrollbarAccent: section.scrollbarAccent ?? normalized.scrollbarAccent,
    vignette: section.vignette ?? normalized.vignette,
    // Opt-in refinement knobs: invalid/absent section values fall back to the
    // loader layer (whose neutral 'inherit' keeps the stock look).
    cornerRadius: isCornerRadius(section.cornerRadius) ? section.cornerRadius : normalized.cornerRadius,
    surfaceShadow: isSurfaceShadow(section.surfaceShadow) ? section.surfaceShadow : normalized.surfaceShadow,
    focusGlow: isFocusGlow(section.focusGlow) ? section.focusGlow : normalized.focusGlow,
    wallpaperTone: isWallpaperTone(section.wallpaperTone) ? section.wallpaperTone : normalized.wallpaperTone,
    darkAccent: stringField(section.darkAccent, normalized.darkAccent),
  }
}

/**
 * Mapping from the runtime theme section (settings scope) onto a normalized
 * CustomThemeConfig. Pure and testable: the section carries the settings
 * document's resolved values (user overrides layered over the loader base);
 * fields absent while loading/unavailable fall back to the loader config.
 */
import { type CustomThemeConfig } from './config.ts';
import type { ThemeSection } from '../shared.ts';
/**
 * Merge a theme section over the normalized loader config.
 * @param normalized - the loader-layer normalized config (fallback).
 * @param section - the settings scope's resolved theme section.
 * @returns the effective config the applier should render.
 */
export declare function configFromThemeSection(normalized: CustomThemeConfig, section: ThemeSection | undefined): CustomThemeConfig;
//# sourceMappingURL=theme-section.d.ts.map
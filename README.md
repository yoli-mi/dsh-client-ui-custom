# Dsh-client-ui-custom

Configurable web-surface theming for **any** dsh web profile — no shell edits.

The plugin is a small theme framework: it turns a config into theme-token
overrides at runtime.

- **Presets** — pick a named look (`preset: 'ink-teal'`) or hand-tune every knob
- **Wallpaper** — any URL or web-served path (`/wall.jpg`, `https://…`)
- **Glass levels** — one high-level choice for the frosted-glass look: `off` / `light` / `frosted` / `mica`
- **Auto accent** — derive the accent color from the wallpaper automatically (Material-You style)
- **Accent color** — one color drives the entire deepseek ramp (bubbles, info buttons, active/hover states, brand, scrollbar)
- **Translucent surfaces** — main / sidebar / chat / input / code opacities, with a separate dark-mode opacity
- **Tone-blend wash** — a light-theme gradient layered over the wallpaper
- **Dark scrim** — keeps text contrast over the wallpaper in dark mode
- **Escape hatches** — raw `customCss` and extra `customVars` for anything else
- **Shortcuts** — user-customizable keybindings: new conversation, next model, cycle thinking effort
- Font override, accent scrollbar, inset vignette

All rules live in the plugin's own stylesheet, gated behind
`html[data-dsu-active]`: with no `wallpaper` configured the plugin is a no-op
and the profile looks stock.

## Framework layout

```
packages/client/ui-custom/
├── src/client/
│   ├── index.ts          # plugin entry: resolve preset → normalize → apply
│   ├── config.ts         # CustomThemeConfig, DEFAULTS, normalizeConfig (coerce+clamp)
│   ├── presets.ts        # ThemePreset registry — the extension surface for art choices
│   ├── apply.ts          # config → DOM: --dsu-* vars, customCss, customVars
│   └── custom.module.css # token overrides consuming the --dsu-* vars
├── tests/                # config pipeline unit tests
└── README.md / README.zh.md
```

Adding a new art option later = one `ThemePreset` entry in `presets.ts` (and,
for brand-new knobs, one field in `config.ts` + one line in `apply.ts` +
`custom.module.css`).

## Install

1. Make sure the package builds into your deployment (`pnpm run build:lib:client`).
2. Add a browser-roster row to your web profile's patch layer —
   `~/.dsh/profiles/web/cordis.patch.yml` (or the equivalent `dsh.client`
   roster of your profile):

```yaml
- id: ui-custom
  name: '@deepseek-ai/dsh-client-ui-custom'
  config:
    preset: 'ink-teal'        # pick a preset; any field below overrides it
    wallpaper: '/my-wall.jpg'
    wallpaperBlur: 14
```

3. Restart `dsh web` (profile-level changes are read at boot) and hard-refresh
   the page.

The plugin ships **neutral** and **feature-off by default**: with no
`wallpaper` configured it changes nothing, and every opt-in feature (Markdown
rendering, the usage-panel shortcut, the floating history strip, GitHub
discovery) stays off until you turn it on in Settings. To go back to the
stock theme, remove the row or set `wallpaper: ''`.

## Presets

| id | name | look |
| --- | --- | --- |
| `ink-teal` | Ink Teal 黛青 | jade-green gradient, quiet and deep |
| `ink-blue` | Ink Blue 黛蓝 | deep ink blue, restrained |
| `dusty-rose` | Dusty Rose 藕荷 | warm dusty-rose gradient, gentle |
| `apricot-gold` | Apricot Gold 杏金 | understated warm gold |
| `mist-gray` | Mist Gray 雾灰 | cool slate mist, calm |
| `ink-violet` | Ink Violet 墨紫 | quiet violet, tuned for dark mode |

Each preset is a complete art direction carried by its own gradient (no shipped
wallpapers — a preset works on its own, and your `wallpaper` still layers under
it). More art choices will extend this list — see `src/client/presets.ts`.

## Glass levels

`glass` is the high-level "how translucent" switch; an explicit `wallpaperBlur`
always overrides the level's default radius.

| Level | Blur | Saturation | Vibe |
| --- | --- | --- | --- |
| `off` | 0px | 1.0 | opaque, no glass |
| `light` | 6px | 1.15 | subtle glass |
| `frosted` | 14px | 1.25 | strong acrylic (default) |
| `mica` | 22px | 1.1 | soft static tint, keeps wallpaper hues |

## Config reference

Every field is optional; explicit values always win over the preset.

| Key | Type | Default | Meaning |
| --- | --- | --- | --- |
| `preset` | string | `''` | Preset id (see above); `''` = none |
| `wallpaper` | string | `''` | Wallpaper URL/path served by the web server; empty string keeps the plugin off |
| `wallpaperBlur` | number 0–60 | glass default | Blur radius (px) on `#root`; explicit value overrides the glass level |
| `glass` | enum | `frosted` | `off` / `light` / `frosted` / `mica` (see Glass levels) |
| `accent` | string | `#4176e6` | Accent color; the whole deepseek ramp is derived from it |
| `autoAccent` | boolean | `false` | Derive the accent from the wallpaper automatically (overrides `accent` on success) |
| `surfaceOpacity` | number 0–100 | `100` | Main surface opacity (chat/details columns) |
| `sidebarOpacity` | number 0–100 | `100` | Sidebar surface opacity |
| `chatSurfaceOpacity` | number 0–100 | `100` | Chat column opacity (via `--dsw-chat-surface`) |
| `inputOpacity` | number 0–100 | `100` | Composer input opacity |
| `codeBlockOpacity` | number 0–100 | `100` | Code block / inline code opacity |
| `darkSurfaceOpacity` | number 0–100 | `surfaceOpacity` | Dark-mode surface opacity (independent knob) |
| `gradient` | string | `''` | Light-theme gradient layered over the wallpaper; empty = none |
| `darkScrim` | number 0–100 | `0` | Dark-theme scrim strength over the wallpaper |
| `fontFamily` | string | `''` | Font stack override; empty = theme default |
| `scrollbarAccent` | boolean | `false` | Tint scrollbars with the accent color |
| `vignette` | boolean | `false` | Soft inset vignette on the app root |
| `customCss` | string | `''` | Raw CSS appended verbatim (escape hatch) |
| `customVars` | object | `{}` | Extra CSS custom properties written on `<html>` (escape hatch) |
| `shortcuts` | object | unbound, except `sendMessage: 'Enter'`, `newline: 'Shift+Enter'` | Keybindings — see Shortcuts below |

## Shortcuts

Bind any of three actions to a key combo (empty/absent = disabled). Combos use
`Mod+Alt+Shift+<key>` syntax: `Mod` matches **Ctrl or Meta** (platform-agnostic),
`<key>` is a letter, digit, or named key (`space`, `enter`, `f5`, `arrowup`, …).

| Action | What it does |
| --- | --- |
| `newConversation` | Start a new conversation (same as the sidebar's New Session button) |
| `switchModel` | Cycle to the next model in the session's catalog (wraps; new model starts at its own default effort) |
| `cycleThinking` | Cycle the current model's reasoning effort (off → … → max, wraps) |
| `sendMessage` | Composer send gesture (default: `Enter`) |
| `newline` | Composer newline gesture (default: `Shift+Enter`) |
| `usagePanel` | Pop the app-usage panel (unbound by default — opt in from Settings, e.g. `Mod+Alt+U`) |

```yaml
config:
  shortcuts:
    newConversation: 'Mod+Alt+N'
    switchModel: 'Mod+Alt+M'
    cycleThinking: 'Mod+Alt+T'
```

Prefer Enter = newline? Swap the composer gestures — send moves to `Mod+Enter`,
plain Enter inserts a line break (send wins when both bindings match):

```yaml
config:
  shortcuts:
    sendMessage: 'Mod+Enter'
    newline: 'Enter'
```

Model actions use the same `session.models` / `session.selectModel` RPCs as the
built-in model selector, so the composer seat updates automatically; addressed
subagent sessions are skipped (same guard the UI applies). Combos without `Mod`
are suppressed while you're typing in an input, so plain keys never hijack the
composer.

### Settings page

The plugin registers a dedicated **Shortcuts** page in Settings (设置 → 快捷键).
Each binding is a click-to-record field (press the combination, Esc cancels),
with Save / Reset per section. Values live in the plugin's settings namespace
(`ui-custom`): the loader config (above) acts as the composition base, so a
Reset reverts to the loader default and runtime changes apply immediately
without a restart.

Self-builders: for the settings page to load, the `ui-custom` namespace must be
in the web client's settings exposure allowlist
(`WEB_SETTINGS_NAMESPACES` in `packages/host/apiproxy/src/api-proxy.ts`) — it is
in this checkout.

### Appearance settings (外观)

A dedicated **Appearance** page in Settings (设置 → 外观) with the full art
customization form — wallpaper, glass level, accent color (+ auto-extract),
all surface opacities, tone gradient, dark scrim, font, accent scrollbar and
vignette — plus the merged **theme preference** (light / dark / system) that
ui-theme contributes into this section. Changes save through the `ui-custom`
settings namespace and **apply immediately** (the theme re-renders live, no
restart). The loader config (above) acts as the composition base: Reset
reverts every field to it.

Note: this ships with a small ui-theme integration patch that moves the
product appearance row from General into the Appearance section
(`packages/client/ui-theme/src/client/index.ts` targets `settings.appearance.item`);
without ui-custom installed the row is simply not mounted.

### Plugin marketplace (插件市场)

A **Plugin Marketplace** tab in Settings → Plugins (next to Plugin
configuration and Plugin list): a catalog of **third-party** DSH plugins with
one-line descriptions and GitHub source links. DSH built-ins already ship in
the roster and are intentionally **not** listed. The catalog loads from a
GitHub raw manifest — set `marketplaceUrl` in the plugin config to the raw URL
of a `marketplace.json` you publish (this package ships one as an example),
and the market populates from GitHub with a bundled-empty fallback. **Install**
copies the exact `- insert:` YAML to the clipboard; pasting it into the
watched profile patch file (`~/.dsh/profiles/web/cordis.patch.yml`) applies
the plugin live, no restart. Entries already in the Host inventory show an
"Installed" badge.

### App usage

A dedicated **App Usage** page in Settings (设置 → 应用用量) plus a configurable
shortcut (unbound by default, e.g. `Mod+Alt+U`) that pops the same panel
anywhere. It aggregates
each session's usage projections (token-meter + session-stats) over four
windows — last year / month / week / 3 days — showing total / input / output
tokens, cache hits (with hit rate), model time, sessions & steps, a usage
trend chart, and a top-sessions list. Pure client-side: the session list rows
already carry the host-computed projections, so no extra RPCs.

### Conversation outline (对话大纲)

The **right sidebar** becomes a jump map of the current conversation: a
floating pill on the right edge opens it, and the panel lists every segment
(user question + following answer preview). Click a segment to smoothly scroll
the chat there and flash an accent marker on the row. Segments come from the
mounted chat snapshot, so jumping is a pure DOM operation — no extra RPCs.

Implementation note: the stock details column is a `single` slot whose stock
panel has no entry point, so the plugin **shadows** it (`priority: -1`, lowest
renders) with the outline panel. The tool-details seat it declared disappears
with it; ui-tool defers via `inject`, so nothing throws and a stock harness
without this plugin is untouched.

Example with overrides and escape hatches:

```yaml
config:
  preset: 'ink-teal'
  wallpaper: 'https://example.com/wall.jpg'
  glass: 'mica'              # or wallpaperBlur: 8 for a custom radius
  autoAccent: true           # accent derived from the wallpaper
  chatSurfaceOpacity: 70
  customCss: |
    .some-hashed-class { border-radius: 16px; }
  customVars:
    '--my-accent-soft': 'rgb(255 127 178 / 0.3)'
  shortcuts:
    newConversation: 'Mod+Alt+N'
    switchModel: 'Mod+Alt+M'
    cycleThinking: 'Mod+Alt+T'
```

## How it works

- The client half resolves `preset` (presets.ts), merges
  `DEFAULTS ← preset ← config`, clamps every field (config.ts), and writes
  `--dsu-*` custom properties onto `<html>` (apply.ts). The runner passes the
  roster row's `config` to `apply(ctx, config)`.
- The stylesheet (custom.module.css) consumes the variables and re-declares
  the theme tokens on `body` / `body[data-ds-dark-theme]` with selectors that
  out-specify the theme sheets, so the plugin always wins the cascade. No
  plugin or shell source is modified.
- Frosted glass applies `backdrop-filter` to `#root`; translucent surfaces
  read through it.
- The chat-column knob relies on `ConversationRoot` reading
  `var(--dsw-chat-surface, var(--dsw-alias-bg-base))` — a one-line, fully
  backwards-compatible fallback (stock harnesses without the token behave
  exactly as before). See `packages/client/ui-conversation`.

## Notes

- Profile `cordis.patch.yml` changes require a `dsh web` restart.
- The wallpaper must be reachable by the browser (e.g. placed under the web
  server's static root or an external URL).
- Config is read at plugin load; live reconfiguration through the settings UI
  is a planned follow-up (schemastery schema for `ui-settings-plugins`).

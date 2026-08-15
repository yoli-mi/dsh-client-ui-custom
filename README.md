# Dsh-client-ui-custom

<div align="center">

[**中文**](#中文) · [**English**](#english)

</div>

---

## 中文

面向**任意** dsh web profile 的可配置前端主题框架 —— 无需改动任何 shell 源码。

插件是一个小型主题框架：运行时把一份配置转换成主题 token 覆盖。

- **预设（Preset）** —— 选一个命名外观（`preset: 'ink-teal'`），或逐项手调
- **壁纸** —— 任意 URL 或 Web 可访问路径（`/wall.jpg`、`https://…`）
- **玻璃档位** —— 一键选择毛玻璃质感：`off` / `light` / `frosted` / `mica`
- **自动取色** —— 从壁纸自动派生强调色（Material You 风格）
- **强调色** —— 一个颜色驱动整套 deepseek 色阶（气泡、信息按钮、激活/悬停态、品牌色、滚动条）
- **半透明表面** —— 主表面 / 侧栏 / 聊天列 / 输入框 / 代码块不透明度，暗色模式另有独立档位
- **色调融合** —— 亮色模式下叠加在壁纸上的渐变
- **暗色遮罩** —— 暗色模式下保证壁纸上方文字对比度
- **逃生舱** —— 原生 `customCss` 与额外 `customVars`，覆盖一切其他需求
- **快捷键** —— 可自定义键位：新建对话、切换模型、循环思考强度
- 字体覆盖、主题色滚动条、内嵌晕影

所有规则都在插件自己的样式表里，并以 `html[data-dsu-active]` 为开关：
未配置 `wallpaper` 时插件完全无操作，profile 保持原样。

### 框架结构

```
packages/client/ui-custom/
├── src/client/
│   ├── index.ts          # 插件入口：解析预设 → 规范化 → 应用
│   ├── config.ts         # CustomThemeConfig、DEFAULTS、normalizeConfig（类型收窄+钳制）
│   ├── presets.ts        # ThemePreset 注册表 —— 美术选择的扩展面
│   ├── apply.ts          # config → DOM：--dsu-* 变量、customCss、customVars
│   └── custom.module.css # 消费 --dsu-* 变量的 token 覆盖
├── tests/                # 配置管线单元测试
└── README.md             # 本文档（中文 / English 双语）
```

后续新增美术选择 = 在 `presets.ts` 加一条 `ThemePreset`（若是全新旋钮，
再在 `config.ts` 加字段、`apply.ts` 与 `custom.module.css` 各加一行）。

### 安装

1. 确保构建会包含该包（`pnpm run build:lib:client`）。
2. 在 Web profile 的补丁层加入浏览器 roster 行 ——
   `~/.dsh/profiles/web/cordis.patch.yml`（或你 profile 中对应的 `dsh.client` roster）：

```yaml
- id: ui-custom
  name: '@deepseek-ai/dsh-client-ui-custom'
  config:
    preset: 'ink-teal'        # 选择预设；下面任意字段会覆盖它
    wallpaper: '/my-wall.jpg'
    wallpaperBlur: 14
```

3. 重启 `dsh web`（profile 级改动在启动时读取），然后强制刷新页面。

插件默认**完全中性、功能默认关闭**：未配置 `wallpaper` 时不做任何改动，
所有可选功能（Markdown 渲染、用量面板快捷键、浮动历史条、GitHub 自动发现）
默认关闭，需要时在设置里开启。想恢复默认主题：删除该行，或把 `wallpaper`
设为 `''`。

### 预设

| id | 名称 | 风格 |
| --- | --- | --- |
| `ink-teal` | Ink Teal 黛青 | 青玉色渐变，静谧沉稳 |
| `ink-blue` | Ink Blue 黛蓝 | 黛蓝渐变，深邃克制的蓝 |
| `dusty-rose` | Dusty Rose 藕荷 | 藕荷色渐变，温润柔和的粉 |
| `apricot-gold` | Apricot Gold 杏金 | 杏金色渐变，温雅低调的金 |
| `mist-gray` | Mist Gray 雾灰 | 雾灰色渐变，清冷安静的灰蓝 |
| `ink-violet` | Ink Violet 墨紫 | 墨紫色渐变，沉静神秘 |

每个预设都是完整的美术方向，由自身的渐变承载（不附带壁纸——预设可独立
生效，你自己的 `wallpaper` 仍会叠加在它之下）。更多美术选择后续会扩展进
这份列表 —— 见 `src/client/presets.ts`。

### 玻璃档位

`glass` 是"通透程度"的高层开关；显式设置 `wallpaperBlur` 时总是优先于档位的默认半径。

| 档位 | 模糊 | 饱和度 | 气质 |
| --- | --- | --- | --- |
| `off` | 0px | 1.0 | 不透明，无玻璃 |
| `light` | 6px | 1.15 | 轻微玻璃 |
| `frosted` | 14px | 1.25 | 强毛玻璃（默认） |
| `mica` | 22px | 1.1 | 柔和静态质感，保留壁纸色相 |

### 配置项

所有字段均可选；显式配置永远优先于预设。

| 键 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `preset` | string | `''` | 预设 id（见上表）；`''` = 不使用预设 |
| `wallpaper` | string | `''` | 壁纸 URL/路径（Web 可访问）；空字符串 = 插件保持关闭 |
| `wallpaperBlur` | number 0–60 | 玻璃档位默认 | `#root` 模糊半径（px）；显式值优先于玻璃档位 |
| `glass` | enum | `frosted` | `off` / `light` / `frosted` / `mica`（见玻璃档位表） |
| `accent` | string | `#4176e6` | 强调色，整套 deepseek 色阶由它派生 |
| `autoAccent` | boolean | `false` | 从壁纸自动派生强调色（成功后覆盖 `accent`） |
| `surfaceOpacity` | number 0–100 | `100` | 主表面不透明度（聊天/细节列） |
| `sidebarOpacity` | number 0–100 | `100` | 侧栏不透明度 |
| `chatSurfaceOpacity` | number 0–100 | `100` | 聊天列不透明度（经 `--dsw-chat-surface`） |
| `inputOpacity` | number 0–100 | `100` | 输入框不透明度 |
| `codeBlockOpacity` | number 0–100 | `100` | 代码块/行内代码不透明度 |
| `darkSurfaceOpacity` | number 0–100 | `surfaceOpacity` | 暗色模式表面不透明度（独立档位） |
| `gradient` | string | `''` | 亮色模式下叠加在壁纸上的渐变；空 = 无 |
| `darkScrim` | number 0–100 | `0` | 暗色模式下壁纸上的遮罩强度 |
| `fontFamily` | string | `''` | 字体栈覆盖；空 = 主题默认 |
| `scrollbarAccent` | boolean | `false` | 滚动条使用强调色 |
| `vignette` | boolean | `false` | 应用根节点的柔和内嵌晕影 |
| `customCss` | string | `''` | 原样追加的自定义 CSS（逃生舱） |
| `customVars` | object | `{}` | 额外写到 `<html>` 上的 CSS 自定义属性（逃生舱） |
| `shortcuts` | object | 默认未绑定，仅 `sendMessage: 'Enter'`、`newline: 'Shift+Enter'` | 快捷键绑定 —— 见下方「快捷键」 |

### 快捷键

三个动作可绑定任意组合键（空/缺省 = 关闭）。语法为 `Mod+Alt+Shift+<键>`：
`Mod` 匹配 **Ctrl 或 Meta**（跨平台），`<键>` 是字母、数字或具名键
（`space`、`enter`、`f5`、`arrowup` 等）。

| 动作 | 作用 |
| --- | --- |
| `newConversation` | 新建对话（与侧栏「新建会话」按钮一致） |
| `switchModel` | 循环切换到会话目录中的下一个模型（循环；新模型使用自身默认思考强度） |
| `cycleThinking` | 循环切换当前模型的思考强度（off → … → max，循环） |
| `sendMessage` | 输入框发送手势（默认 `Enter`） |
| `newline` | 输入框换行手势（默认 `Shift+Enter`） |
| `usagePanel` | 呼出应用用量面板（默认未绑定，可在设置中开启，如 `Mod+Alt+U`） |

```yaml
config:
  shortcuts:
    newConversation: 'Mod+Alt+N'
    switchModel: 'Mod+Alt+M'
    cycleThinking: 'Mod+Alt+T'
```

习惯 Enter 换行？把发送改为 `Mod+Enter`、换行改为 `Enter` 即可（两个手势
同时命中时发送优先）：

```yaml
config:
  shortcuts:
    sendMessage: 'Mod+Enter'
    newline: 'Enter'
```

模型动作走与内置模型选择器相同的 `session.models` / `session.selectModel`
RPC，输入区的模型显示会自动同步；被寻址的子代理会话会被跳过（与 UI 一致）。
不带 `Mod` 的组合键在输入框聚焦时不会触发，避免劫持正常打字。

#### 设置页

插件会在设置里注册独立的 **「快捷键」** 页面（设置 → 快捷键）。每项绑定是
一个"点击后录制"字段（按下组合键即可，Esc 取消），整页保存/恢复默认。值存
在插件的 settings 命名空间（`ui-custom`）里：上面的 loader 配置作为组合层
base，因此"恢复默认"会回到 loader 默认值，运行时的修改无需重启即可生效。

自行构建者注意：设置页要能加载，`ui-custom` 命名空间必须在 Web 客户端的
设置暴露白名单里（`packages/host/apiproxy/src/api-proxy.ts` 的
`WEB_SETTINGS_NAMESPACES`）——本检出已加入。

#### 外观设置（设置 → 外观）

设置里新增独立的 **「外观」** 页面：壁纸、玻璃档位、强调色（含壁纸自动取色）、
各表面不透明度、色调渐变、暗色遮罩、字体、主题色滚动条与晕影的完整定制表单，
并把 ui-theme 的**主题偏好**（浅色 / 深色 / 跟随系统）合并进本栏。改动通过
`ui-custom` settings 命名空间保存并**即时生效**（主题实时重渲染，无需重启）；
loader 配置作为组合层 base，「恢复默认」会回到 loader 值。

说明：随附一个小的 ui-theme 集成补丁，把产品外观行从「通用」移到「外观」栏
（`packages/client/ui-theme/src/client/index.ts` 改挂 `settings.appearance.item`）；
未安装本插件时该行不挂载。

#### 插件市场（设置 → 插件 → 插件市场）

设置 → 插件的第三个 tab **「插件市场」**（与插件配置、插件列表并列）：**第三方**
DSH 插件目录，每项带一句话简介与 GitHub 源码跳转链接。DSH 内置包已在 roster 中，
**故意不列出**。目录从 GitHub raw 清单拉取——在插件配置里设置 `marketplaceUrl`
指向你发布的 `marketplace.json`（本包自带一份示例）即可从 GitHub 填充市场，
拉取失败时保持空目录。点击**「安装」**会把 `- insert:` YAML 复制到剪贴板，
粘贴进被实时监听的 profile 补丁文件（`~/.dsh/profiles/web/cordis.patch.yml`）
即**无需重启**生效；已在宿主清单里的插件显示「已安装」徽标。

#### 应用用量

设置里新增独立的 **「应用用量」** 页面（设置 → 应用用量），并可通过快捷键
（默认未绑定，可设置为如 `Mod+Alt+U`）在任何界面呼出同一个面板。它按四个时间窗口
（近一年 / 近一月 / 近一周 / 近三天）聚合各会话的用量投影（token-meter +
session-stats）：总 / 输入 / 输出 Token、缓存命中（含命中率）、使用时长、
会话数与步数、用量趋势图与会话排行。纯客户端实现：会话列表行已携带
Host 计算好的投影基线，无需额外 RPC。

#### 对话大纲（右侧栏跳转）

**右侧栏**变成当前对话的跳转地图：右侧边缘悬浮一颗「大纲」按钮点开面板，
面板列出每一段对话（用户提问 + 紧随其后的回答预览）。点击某一段，聊天区
平滑滚动到该消息并闪烁高亮标记。段落数据来自已挂载的会话快照，跳转是纯
DOM 操作，无需额外 RPC。

实现说明：stock 的详情列是 `single` 槽，其内置面板没有入口（列从不打开），
因此插件用 `priority: -1`（最低优先级胜出）**shadow** 掉它，换成大纲面板。
随之消失的工具详情子席位，ui-tool 是通过 `inject` 延迟注册的，不会抛错；
不装本插件的原生环境完全不受影响。

带覆盖与逃生舱的示例：

```yaml
config:
  preset: 'ink-teal'
  wallpaper: 'https://example.com/wall.jpg'
  glass: 'mica'              # 或 wallpaperBlur: 8 自定义半径
  autoAccent: true           # 强调色由壁纸自动派生
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

### 工作原理

- 浏览器半区先解析 `preset`（presets.ts），按 `DEFAULTS ← 预设 ← 配置`
  合并并对每个字段做钳制（config.ts），再把 `--dsu-*` 自定义属性写到
  `<html>`（apply.ts）。runner 会把 roster 行的 `config` 作为
  `apply(ctx, config)` 的第二个参数传入。
- 样式表（custom.module.css）消费这些变量，用比主题表更高优先级的选择器
  在 `body` / `body[data-ds-dark-theme]` 上重新声明主题 token，插件总是
  赢得级联，且不修改任何插件或 shell 源码。
- 毛玻璃给 `#root` 加 `backdrop-filter`，半透明表面透过它显示壁纸。
- 聊天列旋钮依赖 `ConversationRoot` 读取
  `var(--dsw-chat-surface, var(--dsw-alias-bg-base))` —— 一行完全向后兼容
  的回退写法（没有该 token 的原生 Harness 行为与之前完全一致），见
  `packages/client/ui-conversation`。

### 注意事项

- profile 的 `cordis.patch.yml` 改动需要重启 `dsh web` 才生效。
- 壁纸必须能被浏览器访问（例如放在 Web 服务静态根目录下，或外部 URL）。
- 配置在插件加载时读取一次；通过设置界面热改是规划中的后续步骤
  （为 `ui-settings-plugins` 提供 schemastery schema）。

---

## English

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

### Framework layout

```
packages/client/ui-custom/
├── src/client/
│   ├── index.ts          # plugin entry: resolve preset → normalize → apply
│   ├── config.ts         # CustomThemeConfig, DEFAULTS, normalizeConfig (coerce+clamp)
│   ├── presets.ts        # ThemePreset registry — the extension surface for art choices
│   ├── apply.ts          # config → DOM: --dsu-* vars, customCss, customVars
│   └── custom.module.css # token overrides consuming the --dsu-* vars
├── tests/                # config pipeline unit tests
└── README.md             # this file (中文 / English bilingual)
```

Adding a new art option later = one `ThemePreset` entry in `presets.ts` (and,
for brand-new knobs, one field in `config.ts` + one line in `apply.ts` +
`custom.module.css`).

### Install

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

### Presets

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

### Glass levels

`glass` is the high-level "how translucent" switch; an explicit `wallpaperBlur`
always overrides the level's default radius.

| Level | Blur | Saturation | Vibe |
| --- | --- | --- | --- |
| `off` | 0px | 1.0 | opaque, no glass |
| `light` | 6px | 1.15 | subtle glass |
| `frosted` | 14px | 1.25 | strong acrylic (default) |
| `mica` | 22px | 1.1 | soft static tint, keeps wallpaper hues |

### Config reference

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

### Shortcuts

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

#### Settings page

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

#### Appearance settings (外观)

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

#### Plugin marketplace (插件市场)

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

#### App usage

A dedicated **App Usage** page in Settings (设置 → 应用用量) plus a configurable
shortcut (unbound by default, e.g. `Mod+Alt+U`) that pops the same panel
anywhere. It aggregates each session's usage projections (token-meter +
session-stats) over four windows — last year / month / week / 3 days — showing
total / input / output tokens, cache hits (with hit rate), model time, sessions
& steps, a usage trend chart, and a top-sessions list. Pure client-side: the
session list rows already carry the host-computed projections, so no extra RPCs.

#### Conversation outline (对话大纲)

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

### How it works

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

### Notes

- Profile `cordis.patch.yml` changes require a `dsh web` restart.
- The wallpaper must be reachable by the browser (e.g. placed under the web
  server's static root or an external URL).
- Config is read at plugin load; live reconfiguration through the settings UI
  is a planned follow-up (schemastery schema for `ui-settings-plugins`).

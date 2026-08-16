window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-client-ui-custom",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region \0rolldown/runtime.js
		var __defProp = Object.defineProperty;
		var __exportAll = (all, no_symbols) => {
			let target = {};
			for (var name in all) __defProp(target, name, {
				get: all[name],
				enumerable: true
			});
			if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
			return target;
		};
		//#endregion
		let _deepseek_ai_dsh_client_runtime_client = require("@deepseek-ai/dsh-client-runtime/client");
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		let react_dom = require("react-dom");
		let _deepseek_ai_dsh_client_ui_attachment = require("@deepseek-ai/dsh-client-ui-attachment");
		//#region src/client/actions.ts
		const faces = (ctx) => ctx;
		/** Resolve the current session's advisory model directory; null when unusable. */
		async function currentSessionModels(ctx) {
			const sessionId = ctx.sessions.list.getSnapshot().current;
			if (sessionId === void 0) return null;
			if (ctx.sessions.subagentAddress(sessionId) !== void 0) return null;
			const api = faces(ctx).connection?.api.sessions;
			if (api === void 0) return null;
			const { result } = await api.models({ sessionId });
			if (!result.ok) return null;
			return {
				sessionId,
				api,
				current: result.value.current,
				groups: result.value.groups
			};
		}
		/**
		* Cycle to the next model in the session's catalog (wraps around; new model
		* starts at its own default reasoning effort).
		* @param ctx - client context with connection/sessions services.
		*/
		async function switchModel(ctx) {
			const models = await currentSessionModels(ctx);
			if (models === null) return;
			const flat = models.groups.flatMap((group) => group.models.map((model) => ({
				provider: group.id,
				model: model.id,
				defaultEffort: model.reasoning?.defaultEffort
			})));
			if (flat.length === 0) return;
			const next = flat[(flat.findIndex((entry) => entry.provider === models.current.provider && entry.model === models.current.model) + 1) % flat.length];
			await models.api.selectModel({
				sessionId: models.sessionId,
				provider: next.provider,
				model: next.model,
				...next.defaultEffort === void 0 ? {} : { reasoningEffort: next.defaultEffort }
			});
		}
		/**
		* Cycle the current model's reasoning effort through its advertised efforts
		* (off → … → max, wrapping; a model without efforts is left untouched).
		* @param ctx - client context with connection/sessions services.
		*/
		async function cycleThinking(ctx) {
			const models = await currentSessionModels(ctx);
			if (models === null) return;
			for (const group of models.groups) for (const model of group.models) {
				if (model.id !== models.current.model || group.id !== models.current.provider) continue;
				const efforts = model.reasoning?.efforts ?? [];
				if (efforts.length === 0) return;
				const ids = efforts.map((effort) => effort.id);
				const nextId = ids[(ids.indexOf(models.current.reasoningEffort ?? model.reasoning?.defaultEffort ?? "") + 1) % ids.length];
				await models.api.selectModel({
					sessionId: models.sessionId,
					provider: models.current.provider,
					model: models.current.model,
					reasoningEffort: nextId
				});
				return;
			}
		}
		/**
		* The current session's model catalog as flat selectable options (empty when
		* there is no session, no connection, or the catalog is unavailable).
		* @param ctx - client context with connection/sessions services.
		* @returns provider/model options for the settings UI.
		*/
		async function modelCatalogOptions(ctx) {
			const models = await currentSessionModels(ctx);
			if (models === null) return [];
			return models.groups.flatMap((group) => group.models.map((model) => ({
				provider: group.id,
				model: model.id,
				label: `${group.id} / ${model.id}`
			})));
		}
		/**
		* Jump to a specific model in the session's catalog (one-to-one model
		* shortcut). The model's advertised default reasoning effort rides along when
		* the catalog declares one.
		* @param ctx - client context with connection/sessions services.
		* @param provider - catalog provider (group) id.
		* @param model - catalog model id within the provider.
		*/
		async function selectModelDirect(ctx, provider, model) {
			const models = await currentSessionModels(ctx);
			if (models === null) return;
			const entry = models.groups.find((group) => group.id === provider)?.models.find((candidate) => candidate.id === model);
			if (entry === void 0) return;
			await models.api.selectModel({
				sessionId: models.sessionId,
				provider,
				model,
				...entry.reasoning?.defaultEffort === void 0 ? {} : { reasoningEffort: entry.reasoning.defaultEffort }
			});
		}
		/**
		* Start a new conversation (same action as the sidebar's New Session button).
		* The optional default-workspace shortcut target routes the new conversation
		* into that workspace; without one the workspaces service inherits the
		* current session's workspace / recency projection.
		* @param ctx - client context with the workspaces service.
		* @param shortcuts - the active shortcut config (for the default workspace).
		*/
		function newConversation(ctx, shortcuts) {
			faces(ctx).workspaces?.startSession(shortcuts?.defaultWorkspace || void 0);
		}
		/** All dispatcher actions (sendMessage/newline are composer remaps, not dispatcher actions). */
		const SHORTCUT_HANDLERS = {
			newConversation,
			switchModel,
			cycleThinking,
			usagePanel: () => {
				Promise.resolve().then(() => usage_overlay_exports).then(({ usageOverlay }) => usageOverlay.toggle());
			}
		};
		//#endregion
		//#region src/client/shortcuts.ts
		/**
		* All actions, in config/settings order. `sendMessage` / `newline` are
		* composer-input remaps (handled by the composer listener), not dispatcher
		* actions — the dispatcher iterates SHORTCUT_HANDLERS' keys instead.
		*/
		const SHORTCUT_ACTIONS = [
			"newConversation",
			"switchModel",
			"cycleThinking",
			"sendMessage",
			"newline",
			"usagePanel"
		];
		/** Named key tokens → the `event.key` value they represent. */
		const NAMED_KEYS = {
			space: " ",
			enter: "Enter",
			esc: "Escape",
			escape: "Escape",
			tab: "Tab",
			backspace: "Backspace",
			delete: "Delete",
			up: "ArrowUp",
			down: "ArrowDown",
			left: "ArrowLeft",
			right: "ArrowRight",
			arrowup: "ArrowUp",
			arrowdown: "ArrowDown",
			arrowleft: "ArrowLeft",
			arrowright: "ArrowRight",
			home: "Home",
			end: "End",
			pageup: "PageUp",
			pagedown: "PageDown",
			insert: "Insert"
		};
		const MODIFIER_TOKENS = new Set([
			"mod",
			"cmd",
			"ctrl",
			"control",
			"meta",
			"super",
			"win"
		]);
		const ALT_TOKENS = new Set(["alt", "option"]);
		const SHIFT_TOKENS = new Set(["shift"]);
		/**
		* Parse a key-combo spec into a normalized {@link KeyCombo}.
		* @param spec - e.g. 'Mod+Shift+N'; '' / undefined / malformed → null (disabled).
		* @returns the parsed combo, or null.
		*/
		function parseKeyCombo(spec) {
			if (spec === void 0) return null;
			const tokens = spec.split("+").map((token) => token.trim().toLowerCase()).filter((token) => token !== "");
			if (tokens.length === 0) return null;
			let mod = false;
			let alt = false;
			let shift = false;
			let keyToken;
			for (const token of tokens) {
				if (MODIFIER_TOKENS.has(token)) {
					mod = true;
					continue;
				}
				if (ALT_TOKENS.has(token)) {
					alt = true;
					continue;
				}
				if (SHIFT_TOKENS.has(token)) {
					shift = true;
					continue;
				}
				if (keyToken !== void 0) return null;
				keyToken = token;
			}
			if (keyToken === void 0) return null;
			if (keyToken.length === 1) {
				const key = keyToken.toLowerCase();
				if (!/^[a-z0-9]$/.test(key)) return null;
				return {
					mod,
					alt,
					shift,
					key
				};
			}
			const named = NAMED_KEYS[keyToken];
			if (named !== void 0) return {
				mod,
				alt,
				shift,
				key: named
			};
			if (/^f([1-9]|1[0-9]|2[0-4])$/.test(keyToken)) return {
				mod,
				alt,
				shift,
				key: keyToken.toUpperCase()
			};
			return null;
		}
		/**
		* Whether a keyboard event matches a parsed combo. Modifier matching is
		* strict: unspecified modifiers must be released (Mod matches Ctrl or Meta).
		* @param combo - parsed combo.
		* @param event - the keyboard event (minimal structural type for tests).
		*/
		function matchesKeyCombo(combo, event) {
			const modPressed = event.ctrlKey || event.metaKey;
			if (combo.mod ? !modPressed : modPressed) return false;
			if (combo.alt !== event.altKey) return false;
			if (combo.shift !== event.shiftKey) return false;
			return event.key === combo.key;
		}
		/** Build the action → parsed-combo lookup for a normalized shortcuts config. */
		function buildShortcutMap(shortcuts) {
			return {
				newConversation: parseKeyCombo(shortcuts.newConversation),
				switchModel: parseKeyCombo(shortcuts.switchModel),
				cycleThinking: parseKeyCombo(shortcuts.cycleThinking),
				sendMessage: parseKeyCombo(shortcuts.sendMessage),
				newline: parseKeyCombo(shortcuts.newline),
				usagePanel: parseKeyCombo(shortcuts.usagePanel)
			};
		}
		/** Whether the combo is non-null (i.e. the action is enabled). */
		function comboEnabled(combo) {
			return combo !== null;
		}
		/**
		* Whether a keydown target is an editable field (input/textarea/contenteditable).
		* Plain-letter combos are suppressed there so typing is never hijacked; combos
		* carrying Mod (Ctrl/Meta) still fire (standard editor behavior).
		*/
		function isEditableTarget(target) {
			if (target === null || !(target instanceof HTMLElement)) return false;
			const element = target;
			return element.isContentEditable || element.tagName === "INPUT" || element.tagName === "TEXTAREA" || element.tagName === "SELECT";
		}
		/** Modifier-only event.key values (a lone press records nothing). */
		const MODIFIER_EVENT_KEYS = new Set([
			"Control",
			"Shift",
			"Alt",
			"Meta"
		]);
		/**
		* Map a pressed `event.key` to its combo token ('n', 'space', 'arrowup',
		* 'f5', …). Returns null for modifier-only or unknown keys.
		* @param eventKey - the keyboard event's key value.
		*/
		function keyToToken(eventKey) {
			if (MODIFIER_EVENT_KEYS.has(eventKey)) return null;
			if (eventKey === " ") return "space";
			if (eventKey.length === 1) return eventKey.toLowerCase();
			const lower = eventKey.toLowerCase();
			for (const [token, key] of Object.entries(NAMED_KEYS)) if (key === eventKey) return token;
			if (/^f([1-9]|1[0-9]|2[0-4])$/i.test(eventKey)) return lower;
			return null;
		}
		/**
		* Build a combo spec from a keydown event (for the settings recorder).
		* Modifier-only presses (e.g. pressing Ctrl alone) return null — the recorder
		* waits for the actual key.
		* @param event - the keyboard event.
		* @returns a combo spec like 'Mod+Alt+N', or null.
		*/
		function specFromEvent(event) {
			const key = keyToToken(event.key);
			if (key === null) return null;
			return `${event.ctrlKey || event.metaKey ? "Mod+" : ""}${event.altKey ? "Alt+" : ""}${event.shiftKey ? "Shift+" : ""}${key}`;
		}
		/**
		* Decide how an Enter keydown in the composer textarea should be handled
		* given the user's send/newline bindings.
		*
		* The composer's native behavior is: plain Enter (no Shift/Alt) submits,
		* Shift+Enter (no Ctrl/Meta/Alt) inserts a newline. The remapper only acts
		* when the user rebinds one of those gestures away from its native form:
		*   - a user send combo that isn't native Enter → remap to native send;
		*   - a user newline combo that isn't native Shift+Enter → remap to newline;
		*   - a native gesture whose default was rebound → suppress it;
		*   - otherwise → null (let the composer handle it natively).
		* Send wins over newline when both bindings match one gesture. Compositions
		* (IME) are never remapped.
		* @param sendCombo - parsed sendMessage combo (null = default).
		* @param newlineCombo - parsed newline combo (null = default).
		* @param event - the Enter keydown (structural type for tests).
		* @returns the remap decision.
		*/
		function composerRemapDecision(sendCombo, newlineCombo, event) {
			if (event.isComposing) return null;
			if (event.key !== "Enter") return null;
			const nativeSend = !event.shiftKey && !event.altKey;
			const nativeNewline = event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey;
			const sendIsNative = sendCombo !== null && !sendCombo.mod && !sendCombo.shift && !sendCombo.alt && sendCombo.key === "Enter";
			const newlineIsNative = newlineCombo !== null && newlineCombo.key === "Enter" && newlineCombo.shift && !newlineCombo.mod && !newlineCombo.alt;
			const isUserSend = sendCombo !== null && matchesKeyCombo(sendCombo, event);
			const isUserNewline = newlineCombo !== null && matchesKeyCombo(newlineCombo, event);
			if (isUserSend) return sendIsNative ? null : "send";
			if (isUserNewline && !newlineIsNative) return "newline";
			if (nativeSend && sendCombo !== null && !sendIsNative) return "suppress";
			if (nativeNewline && newlineCombo !== null && !newlineIsNative) return "suppress";
			return null;
		}
		//#endregion
		//#region src/shared.ts
		/**
		* Settings-namespace contract shared by the Host registration (node half)
		* and the browser scope (client half). Node-safe: no DOM, no React.
		*/
		/** Settings namespace owned by ui-custom (runtime-editable section). */
		const UI_CUSTOM_SETTINGS_NS = "ui-custom";
		/**
		* Individually selectable plugin features. The loader config's `features`
		* field is a whitelist: absent or empty = every feature mounts (backward
		* compatible); present = only the listed features register. Each feature
		* owns its settings rows / pages, so an unlisted feature is simply absent
		* from the Settings surface and the DOM.
		*/
		const FEATURES = [
			"history",
			"markdown",
			"appearance",
			"marketplace",
			"shortcuts",
			"usage"
		];
		/** Where the floating history strip can sit relative to the conversation. */
		const HISTORY_POSITIONS = [
			"left",
			"right",
			"off"
		];
		//#endregion
		//#region src/client/config.ts
		/**
		* Theme config model + normalization pipeline for the ui-custom plugin.
		*
		* The pipeline is: `DEFAULTS` ← preset (presets.ts) ← profile `config`
		* (explicit user values always win), then every field is coerced and clamped
		* into a `CustomThemeConfig` the applier can trust. Keeping normalization
		* here (pure, DOM-free) makes it unit-testable and gives GitHub users a
		* single documented contract for what each knob accepts.
		*/
		const SHORTCUT_DEFAULTS = {
			newConversation: "",
			switchModel: "",
			cycleThinking: "",
			sendMessage: "Enter",
			newline: "Shift+Enter",
			usagePanel: "",
			defaultWorkspace: "",
			modelShortcuts: []
		};
		/** Valid corner-radius values (in UI order). */
		const CORNER_RADIUS_LEVELS = [
			"inherit",
			"sm",
			"md",
			"lg",
			"xl"
		];
		/** Valid surface-shadow values (in UI order). */
		const SURFACE_SHADOW_LEVELS = [
			"inherit",
			"none",
			"soft",
			"medium",
			"strong"
		];
		/** Valid focus-glow values. */
		const FOCUS_GLOW_LEVELS = ["inherit", "on"];
		/** Valid wallpaper-tone values (in UI order). */
		const WALLPAPER_TONE_LEVELS = [
			"inherit",
			"soft",
			"dim",
			"bright"
		];
		const isOneOf = (value, options, fallback) => typeof value === "string" && options.includes(value) ? value : fallback;
		const isCornerRadius = (value) => typeof value === "string" && CORNER_RADIUS_LEVELS.includes(value);
		const isSurfaceShadow = (value) => typeof value === "string" && SURFACE_SHADOW_LEVELS.includes(value);
		const isFocusGlow = (value) => typeof value === "string" && FOCUS_GLOW_LEVELS.includes(value);
		const isWallpaperTone = (value) => typeof value === "string" && WALLPAPER_TONE_LEVELS.includes(value);
		/** Blur radius + saturation per glass level (mica ≈ subtle static tint, frosted ≈ strong acrylic). */
		const GLASS_LEVELS$1 = {
			off: {
				blur: 0,
				saturate: 1
			},
			light: {
				blur: 6,
				saturate: 1.15
			},
			frosted: {
				blur: 14,
				saturate: 1.25
			},
			mica: {
				blur: 22,
				saturate: 1.1
			}
		};
		const isGlassLevel$1 = (value) => typeof value === "string" && Object.hasOwn(GLASS_LEVELS$1, value);
		/**
		* Resolve the effective blur radius: an explicitly set `wallpaperBlur` always
		* wins; otherwise the glass level's default blur applies. The saturation
		* factor always comes from the level.
		* @param raw - the user's raw config (explicitness is judged against it).
		* @returns the effective { blur, saturate } pair.
		*/
		function resolveGlass(raw) {
			const base = GLASS_LEVELS$1[isGlassLevel$1(raw?.glass) ? raw.glass : DEFAULTS.glass];
			return {
				blur: typeof raw?.wallpaperBlur === "number" ? clampNumber(raw.wallpaperBlur, 0, 60, base.blur) : base.blur,
				saturate: base.saturate
			};
		}
		/**
		* Shipped defaults: deliberately neutral — no wallpaper, stock blue accent,
		* opaque surfaces. Out of the box the plugin changes nothing; users compose
		* their own look with a preset and/or explicit fields in their profile row.
		*/
		const DEFAULTS = {
			preset: "",
			wallpaper: "",
			wallpaperBlur: 14,
			glass: "frosted",
			accent: "#4176e6",
			autoAccent: false,
			surfaceOpacity: 100,
			sidebarOpacity: 100,
			chatSurfaceOpacity: 100,
			inputOpacity: 100,
			codeBlockOpacity: 100,
			gradient: "",
			darkScrim: 0,
			fontFamily: "",
			codeFontFamily: "",
			fontScale: 1,
			scrollbarAccent: false,
			vignette: false,
			cornerRadius: "inherit",
			surfaceShadow: "inherit",
			focusGlow: "inherit",
			wallpaperTone: "inherit",
			darkAccent: "",
			customCss: "",
			customVars: {},
			shortcuts: { ...SHORTCUT_DEFAULTS }
		};
		/** Clamp a number into [lo, hi], falling back when absent/non-finite. */
		const clampNumber = (value, lo, hi, fallback) => {
			return Math.min(hi, Math.max(lo, typeof value === "number" && Number.isFinite(value) ? value : fallback));
		};
		/** Trim a string, returning the fallback when empty/non-string. */
		const cleanString = (value, fallback) => typeof value === "string" && value.trim() !== "" ? value.trim() : fallback;
		const toBoolean = (value, fallback) => typeof value === "boolean" ? value : fallback;
		const toPercent = (value, fallback) => clampNumber(value, 0, 100, fallback);
		const toVars = (value) => {
			if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
			const out = {};
			for (const [key, raw] of Object.entries(value)) if (typeof raw === "string" || typeof raw === "number") out[key] = String(raw);
			return out;
		};
		/** Coerce a shortcuts config: unknown entries dropped, strings trimmed, missing → defaults. */
		function normalizeShortcuts(value) {
			const raw = typeof value === "object" && value !== null ? value : {};
			const out = { ...SHORTCUT_DEFAULTS };
			for (const action of SHORTCUT_ACTIONS) out[action] = typeof raw[action] === "string" ? raw[action].trim() : out[action];
			out.defaultWorkspace = typeof raw.defaultWorkspace === "string" ? raw.defaultWorkspace.trim() : "";
			out.modelShortcuts = (Array.isArray(raw.modelShortcuts) ? raw.modelShortcuts : []).filter((entry) => typeof entry === "object" && entry !== null && typeof entry.combo === "string" && typeof entry.provider === "string" && typeof entry.model === "string").map((entry) => ({
				combo: entry.combo.trim(),
				provider: entry.provider.trim(),
				model: entry.model.trim()
			})).filter((entry) => entry.combo !== "" && entry.provider !== "" && entry.model !== "");
			return out;
		}
		/**
		* Resolve the enabled feature set from the loader config. The `features`
		* field is a whitelist: absent or empty means every feature mounts (backward
		* compatible); present means only the listed features register. Unknown ids
		* are dropped. Pure: no DOM access, fully unit-testable.
		* @param raw - the profile-level plugin config.
		* @returns the set of features to mount.
		*/
		function resolveFeatures(raw) {
			const list = raw?.features;
			if (!Array.isArray(list) || list.length === 0) return new Set([...FEATURES]);
			return new Set(list.filter((id) => FEATURES.includes(id)));
		}
		/**
		* Merge DEFAULTS ← preset ← explicit config, then coerce/clamp every field.
		* Pure: no DOM access, fully unit-testable.
		* @param raw - profile-level plugin config (may be partial / malformed).
		* @param preset - resolved preset partial (undefined when no preset matched).
		* @returns a normalized config ready for the applier.
		*/
		function normalizeConfig(raw, preset) {
			const merged = {
				...DEFAULTS,
				...preset,
				...raw
			};
			const surfaceOpacity = toPercent(merged.surfaceOpacity, DEFAULTS.surfaceOpacity);
			const darkSurfaceOpacity = merged.darkSurfaceOpacity === void 0 ? surfaceOpacity : toPercent(merged.darkSurfaceOpacity, surfaceOpacity);
			const glass = isGlassLevel$1(merged.glass) ? merged.glass : DEFAULTS.glass;
			const { blur } = resolveGlass(raw);
			return {
				preset: cleanString(merged.preset, DEFAULTS.preset),
				wallpaper: cleanString(merged.wallpaper, DEFAULTS.wallpaper),
				wallpaperBlur: blur,
				glass,
				accent: cleanString(merged.accent, DEFAULTS.accent),
				autoAccent: toBoolean(merged.autoAccent, DEFAULTS.autoAccent),
				surfaceOpacity,
				sidebarOpacity: toPercent(merged.sidebarOpacity, DEFAULTS.sidebarOpacity),
				chatSurfaceOpacity: toPercent(merged.chatSurfaceOpacity, DEFAULTS.chatSurfaceOpacity),
				inputOpacity: toPercent(merged.inputOpacity, DEFAULTS.inputOpacity),
				codeBlockOpacity: toPercent(merged.codeBlockOpacity, DEFAULTS.codeBlockOpacity),
				darkSurfaceOpacity,
				gradient: typeof merged.gradient === "string" && merged.gradient.trim() !== "" ? merged.gradient.trim() : "",
				darkScrim: toPercent(merged.darkScrim, DEFAULTS.darkScrim),
				fontFamily: typeof merged.fontFamily === "string" ? merged.fontFamily.trim() : "",
				codeFontFamily: typeof merged.codeFontFamily === "string" ? merged.codeFontFamily.trim() : "",
				fontScale: Math.round(clampNumber(merged.fontScale, .9, 1.1, DEFAULTS.fontScale) * 20) / 20,
				scrollbarAccent: toBoolean(merged.scrollbarAccent, DEFAULTS.scrollbarAccent),
				vignette: toBoolean(merged.vignette, DEFAULTS.vignette),
				cornerRadius: isOneOf(merged.cornerRadius, CORNER_RADIUS_LEVELS, DEFAULTS.cornerRadius),
				surfaceShadow: isOneOf(merged.surfaceShadow, SURFACE_SHADOW_LEVELS, DEFAULTS.surfaceShadow),
				focusGlow: isOneOf(merged.focusGlow, FOCUS_GLOW_LEVELS, DEFAULTS.focusGlow),
				wallpaperTone: isOneOf(merged.wallpaperTone, WALLPAPER_TONE_LEVELS, DEFAULTS.wallpaperTone),
				darkAccent: cleanString(merged.darkAccent, DEFAULTS.darkAccent),
				customCss: typeof merged.customCss === "string" ? merged.customCss : "",
				customVars: toVars(merged.customVars),
				shortcuts: normalizeShortcuts(merged.shortcuts)
			};
		}
		/** All supported knob names (drives docs and future settings UI). */
		const CONFIG_KEYS = [
			"preset",
			"wallpaper",
			"wallpaperBlur",
			"glass",
			"accent",
			"autoAccent",
			"surfaceOpacity",
			"sidebarOpacity",
			"chatSurfaceOpacity",
			"inputOpacity",
			"codeBlockOpacity",
			"darkSurfaceOpacity",
			"gradient",
			"darkScrim",
			"fontFamily",
			"codeFontFamily",
			"fontScale",
			"scrollbarAccent",
			"vignette",
			"cornerRadius",
			"surfaceShadow",
			"focusGlow",
			"wallpaperTone",
			"darkAccent",
			"customCss",
			"customVars",
			"shortcuts"
		];
		//#endregion
		//#region src/client/color.ts
		/**
		* Pure color math for the wallpaper auto-accent feature (Material-You style).
		* DOM-free so it is unit-testable: feed it RGBA pixel data, get a hex color.
		*
		* Strategy: bucket pixels by hue, ignore washed-out samples (near-white,
		* near-black, low saturation), score each bucket by saturation-weighted
		* population, and average the winning bucket's RGB into a hex color.
		*/
		/** Number of hue buckets around the wheel. */
		const HUE_BUCKETS = 24;
		/** Ignore pixels this close to white, black, or neutral gray. */
		const MIN_SATURATION = .18;
		const MIN_LIGHTNESS = .14;
		const MAX_LIGHTNESS = .86;
		const rgbToHsl = (r, g, b) => {
			const rf = r / 255;
			const gf = g / 255;
			const bf = b / 255;
			const max = Math.max(rf, gf, bf);
			const min = Math.min(rf, gf, bf);
			const l = (max + min) / 2;
			if (max === min) return {
				h: 0,
				s: 0,
				l
			};
			const d = max - min;
			const s = l > .5 ? d / (2 - max - min) : d / (max + min);
			let h = 0;
			if (max === rf) h = ((gf - bf) / d + (gf < bf ? 6 : 0)) / 6;
			else if (max === gf) h = ((bf - rf) / d + 2) / 6;
			else h = ((rf - gf) / d + 4) / 6;
			return {
				h,
				s,
				l
			};
		};
		/** Format an RGB triple as '#rrggbb'. */
		const rgbToHex = (r, g, b) => {
			const hex = (n) => Math.round(n).toString(16).padStart(2, "0");
			return `#${hex(r)}${hex(g)}${hex(b)}`;
		};
		/** Parse a '#rrggbb' (or '#rgb') hex color into an RGB triple. */
		const hexToRgb = (hex) => {
			const match = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(hex.trim());
			if (match === null) return null;
			const group = match[1] ?? "";
			const text = group.length === 3 ? group.split("").map((c) => c + c).join("") : group;
			const value = Number.parseInt(text, 16);
			return {
				r: value >> 16 & 255,
				g: value >> 8 & 255,
				b: value & 255
			};
		};
		/** Format an HSL triple as '#rrggbb'. */
		const hslToHex = (h, s, l) => {
			const f = (n) => {
				const k = (n + h * 12) % 12;
				return l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1));
			};
			return rgbToHex(f(0) * 255, f(8) * 255, f(4) * 255);
		};
		/**
		* Derive a harmonious accent palette from one hex color (Material-You style):
		* the base, two analogous neighbors, the complementary, two triadic partners,
		* and one darkened tint — seven swatches the appearance page offers as
		* one-click accent alternatives. Pure and DOM-free.
		* @param hex - a '#rrggbb' accent color.
		* @returns '#rrggbb' swatches (the base first); an invalid hex yields [].
		*/ function harmonySwatches(hex) {
			const rgb = hexToRgb(hex);
			if (rgb === null) return [];
			const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
			if (s === 0) return [rgbToHex(rgb.r, rgb.g, rgb.b)];
			const hue = h * 360;
			const wrap = (deg) => (deg % 360 + 360) % 360;
			const at = (deg, sat, light) => hslToHex(wrap(deg) / 360, sat, light);
			return [
				rgbToHex(rgb.r, rgb.g, rgb.b),
				at(hue + 30, s, l),
				at(hue - 30, s, l),
				at(hue + 180, s, l),
				at(hue + 120, s, l),
				at(hue - 120, s, l),
				at(hue, Math.min(1, s * 1.1), Math.max(.12, l * .62))
			];
		}
		/**
		* Extract the dominant saturated color from RGBA pixel data (as produced by
		* canvas getImageData). Returns null when no usable color is found.
		* @param data - RGBA byte quadruples.
		* @returns '#rrggbb' or null.
		*/
		function dominantColorFromRgba(data) {
			const buckets = new Array(HUE_BUCKETS);
			for (let i = 0; i + 3 < data.length; i += 4) {
				const a = data[i + 3];
				if (a === void 0 || a < 125) continue;
				const r = data[i] ?? 0;
				const g = data[i + 1] ?? 0;
				const b = data[i + 2] ?? 0;
				const { h, s, l } = rgbToHsl(r, g, b);
				if (s < MIN_SATURATION || l < MIN_LIGHTNESS || l > MAX_LIGHTNESS) continue;
				const index = Math.min(HUE_BUCKETS - 1, Math.floor(h * HUE_BUCKETS));
				const bucket = buckets[index] ??= {
					count: 0,
					satSum: 0,
					r: 0,
					g: 0,
					b: 0
				};
				bucket.count += 1;
				bucket.satSum += s;
				bucket.r += r;
				bucket.g += g;
				bucket.b += b;
			}
			let best;
			let bestScore = 0;
			for (const bucket of buckets) {
				if (bucket === void 0 || bucket.count === 0) continue;
				const score = bucket.count * (bucket.satSum / bucket.count);
				if (score > bestScore) {
					bestScore = score;
					best = bucket;
				}
			}
			if (best === void 0) return null;
			return rgbToHex(best.r / best.count, best.g / best.count, best.b / best.count);
		}
		/** A curated set of muted hues (degrees) for the "随机灵感" button — warm to
		* cool, all low-key enough to read as 高级 rather than neon. */
		const INSPIRATION_HUES = [
			0,
			10,
			20,
			32,
			46,
			62,
			82,
			104,
			124,
			148,
			172,
			196,
			220,
			244,
			264,
			286,
			306,
			328
		];
		const pick = (rng, options) => options[Math.min(options.length - 1, Math.floor(rng() * options.length))] ?? options[0] ?? void 0;
		const between = (rng, lo, hi) => lo + rng() * (hi - lo);
		/**
		* Generate one harmonious "random inspiration" theme from the color palette
		* algorithm: a muted accent sampled from a curated hue pool, a gradient built
		* from the accent + its analogous neighbor + a neutral end, and a coherent
		* glass/opacity/scrim recipe. Pure and DOM-free; the RNG is injectable so the
		* output is deterministic in tests.
		* @param rng - random source (default Math.random).
		* @returns a partial theme config (wallpaper cleared; fonts untouched).
		*/
		function randomInspirationConfig(rng = Math.random) {
			const hue = pick(rng, INSPIRATION_HUES) + between(rng, -6, 6);
			const sat = between(rng, .3, .46);
			const light = between(rng, .52, .64);
			const dark = rng() < .35;
			const accent = hslToHex(hue / 360, sat, light);
			const accentRgb = hexToRgb(accent) ?? {
				r: 128,
				g: 128,
				b: 128
			};
			const midRgb = hexToRgb(hslToHex((hue + 16) % 360 / 360, Math.min(.9, sat * .75), Math.min(.92, light * .8 + .28))) ?? accentRgb;
			const end = hexToRgb(dark ? hslToHex(0, 0, .07) : hslToHex(0, 0, .97)) ?? accentRgb;
			const gradient = dark ? `linear-gradient(160deg, rgb(${accentRgb.r} ${accentRgb.g} ${accentRgb.b} / 0.38) 0%, rgb(${midRgb.r} ${midRgb.g} ${midRgb.b} / 0.34) 55%, rgb(${end.r} ${end.g} ${end.b} / 0.52) 100%)` : `linear-gradient(160deg, rgb(${accentRgb.r} ${accentRgb.g} ${accentRgb.b} / 0.42) 0%, rgb(${midRgb.r} ${midRgb.g} ${midRgb.b} / 0.26) 55%, rgb(${end.r} ${end.g} ${end.b} / 0.32) 100%)`;
			const surface = Math.round(between(rng, 30, 46));
			const glass = pick(rng, [
				"light",
				"frosted",
				"mica"
			]);
			const radius = pick(rng, ["md", "lg"]);
			const shadow = pick(rng, ["soft", "medium"]);
			return {
				wallpaper: "",
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
				fontFamily: "",
				codeFontFamily: "",
				fontScale: 1,
				scrollbarAccent: rng() < .7,
				vignette: dark,
				cornerRadius: radius,
				surfaceShadow: shadow,
				focusGlow: rng() < .6 ? "on" : "inherit",
				wallpaperTone: "inherit",
				darkAccent: dark ? accent : ""
			};
		}
		//#endregion
		//#region src/client/apply.ts
		const CUSTOM_STYLE_ID = "dsh-ui-custom-css";
		/** Corner radius px per level ('inherit' is handled by the caller). */
		const CORNER_RADIUS_PX = {
			sm: 6,
			md: 10,
			lg: 14,
			xl: 18
		};
		/** Box-shadow string per surface-shadow level ('inherit' is handled by the caller). */
		const SURFACE_SHADOW_CSS = {
			none: "none",
			soft: "0 8px 24px rgb(0 0 0 / 0.10)",
			medium: "0 14px 36px rgb(0 0 0 / 0.16)",
			strong: "0 24px 56px rgb(0 0 0 / 0.26)"
		};
		/** Tone-overlay layer per wallpaper-tone level ('inherit' is handled by the
		* caller). Must be a valid `background-image` layer — a solid gradient, since
		* a bare color would invalidate the whole background-image declaration. */
		const WALLPAPER_TONE_CSS = {
			soft: "linear-gradient(rgb(15 17 21 / 0.16), rgb(15 17 21 / 0.16))",
			dim: "linear-gradient(rgb(15 17 21 / 0.34), rgb(15 17 21 / 0.34))",
			bright: "linear-gradient(rgb(255 255 255 / 0.12), rgb(255 255 255 / 0.12))"
		};
		/** Escapes a wallpaper string for embedding inside `url("…")`. */
		const escapeUrl = (text) => text.replaceAll("\"", "\\\"");
		/**
		* Load the wallpaper into an offscreen canvas and extract its dominant
		* saturated color (Material-You style). Resolves null on any failure —
		* CORS-tainted canvases, decode errors, missing 2D context.
		* @param url - the wallpaper URL.
		* @returns '#rrggbb' or null.
		*/
		async function extractWallpaperAccent(url) {
			try {
				const image = new Image();
				image.crossOrigin = "anonymous";
				await new Promise((resolve, reject) => {
					image.onload = () => resolve();
					image.onerror = () => reject(/* @__PURE__ */ new Error("wallpaper decode failed"));
					image.src = url;
				});
				const size = 64;
				const canvas = document.createElement("canvas");
				canvas.width = size;
				canvas.height = size;
				const context = canvas.getContext("2d", { willReadFrequently: true });
				if (context === null) return null;
				context.drawImage(image, 0, 0, size, size);
				const pixels = context.getImageData(0, 0, size, size).data;
				return dominantColorFromRgba(pixels);
			} catch {
				return null;
			}
		}
		/**
		* True when the normalized config overrides nothing — the exact stock look.
		* The applier drops the theme gate then, so an unconfigured profile is
		* byte-for-byte identical to the stock UI (the "zero changes out of the box"
		* contract). Every knob the user turns (including a gradient-only theme with
		* no wallpaper) makes the config non-neutral and activates the theme.
		* Derived from DEFAULTS so a default-value change can never silently flip the
		* gate; darkSurfaceOpacity derives from surfaceOpacity, so 100 is the neutral.
		*/
		const isNeutralConfig = (config) => config.wallpaper === DEFAULTS.wallpaper && config.gradient === DEFAULTS.gradient && config.accent === DEFAULTS.accent && config.autoAccent === DEFAULTS.autoAccent && config.glass === DEFAULTS.glass && config.surfaceOpacity === DEFAULTS.surfaceOpacity && config.sidebarOpacity === DEFAULTS.sidebarOpacity && config.chatSurfaceOpacity === DEFAULTS.chatSurfaceOpacity && config.inputOpacity === DEFAULTS.inputOpacity && config.codeBlockOpacity === DEFAULTS.codeBlockOpacity && config.darkSurfaceOpacity === 100 && config.darkScrim === DEFAULTS.darkScrim && config.fontFamily === DEFAULTS.fontFamily && config.codeFontFamily === DEFAULTS.codeFontFamily && config.fontScale === DEFAULTS.fontScale && config.scrollbarAccent === DEFAULTS.scrollbarAccent && config.vignette === DEFAULTS.vignette && config.cornerRadius === DEFAULTS.cornerRadius && config.surfaceShadow === DEFAULTS.surfaceShadow && config.focusGlow === DEFAULTS.focusGlow && config.wallpaperTone === DEFAULTS.wallpaperTone && config.darkAccent === DEFAULTS.darkAccent && config.customCss === DEFAULTS.customCss && Object.keys(config.customVars).length === 0;
		/**
		* Apply the normalized config to the document.
		* @param config - normalized config from normalizeConfig().
		*/
		function applyConfig(config) {
			const root = document.documentElement;
			if (isNeutralConfig(config)) {
				root.removeAttribute("data-dsu-active");
				document.getElementById(CUSTOM_STYLE_ID)?.remove();
				return;
			}
			root.setAttribute("data-dsu-active", "1");
			const set = (name, value) => root.style.setProperty(name, value);
			const wallpaper = cleanString(config.wallpaper, "");
			if (wallpaper === "") root.style.removeProperty("--dsu-wallpaper");
			else set("--dsu-wallpaper", `url("${escapeUrl(wallpaper)}")`);
			set("--dsu-blur", `${clampNumber(config.wallpaperBlur, 0, 60, 14)}px`);
			set("--dsu-saturate", String(GLASS_LEVELS$1[config.glass]?.saturate ?? 1.25));
			set("--dsu-accent", cleanString(config.accent, "#4176e6"));
			set("--dsu-surface-alpha", `${clampNumber(config.surfaceOpacity, 0, 100, 50)}%`);
			set("--dsu-sidebar-alpha", `${clampNumber(config.sidebarOpacity, 0, 100, 50)}%`);
			set("--dsu-chat-alpha", `${clampNumber(config.chatSurfaceOpacity, 0, 100, 80)}%`);
			set("--dsu-input-alpha", `${clampNumber(config.inputOpacity, 0, 100, 82)}%`);
			set("--dsu-code-alpha", `${clampNumber(config.codeBlockOpacity, 0, 100, 45)}%`);
			set("--dsu-dark-alpha", `${clampNumber(config.darkSurfaceOpacity, 0, 100, config.surfaceOpacity)}%`);
			set("--dsu-scrim", `rgb(15 17 21 / ${clampNumber(config.darkScrim, 0, 100, 22) / 100})`);
			set("--dsu-gradient", config.gradient !== "" ? config.gradient : "none");
			const font = cleanString(config.fontFamily, "");
			if (font !== "") set("--dsu-font", font);
			else root.style.removeProperty("--dsu-font");
			const codeFont = cleanString(config.codeFontFamily, "");
			if (codeFont !== "") set("--dsu-code-font", codeFont);
			else root.style.removeProperty("--dsu-code-font");
			if (config.fontScale !== 1) set("--dsu-font-scale", `${clampNumber(config.fontScale, .9, 1.1, 1)}`);
			else root.style.removeProperty("--dsu-font-scale");
			set("--dsu-scrollbar", config.scrollbarAccent ? "1" : "0");
			set("--dsu-vignette", config.vignette ? "1" : "0");
			if (config.cornerRadius !== "inherit") set("--dsu-radius", `${CORNER_RADIUS_PX[config.cornerRadius] ?? 10}px`);
			else root.style.removeProperty("--dsu-radius");
			if (config.surfaceShadow !== "inherit") set("--dsu-shadow", SURFACE_SHADOW_CSS[config.surfaceShadow] ?? "none");
			else root.style.removeProperty("--dsu-shadow");
			set("--dsu-focus-glow", config.focusGlow === "on" ? "1" : "0");
			if (config.wallpaperTone !== "inherit") set("--dsu-tone", WALLPAPER_TONE_CSS[config.wallpaperTone] ?? "none");
			else root.style.removeProperty("--dsu-tone");
			const darkAccent = cleanString(config.darkAccent, "");
			if (darkAccent !== "") set("--dsu-dark-accent", darkAccent);
			else root.style.removeProperty("--dsu-dark-accent");
			if (config.autoAccent && wallpaper !== "") extractWallpaperAccent(wallpaper).then((color) => {
				if (color !== null) root.style.setProperty("--dsu-accent", color);
			});
			for (const [key, value] of Object.entries(config.customVars)) if (value === "") root.style.removeProperty(key);
			else root.style.setProperty(key, value);
			let style = document.getElementById(CUSTOM_STYLE_ID);
			if (config.customCss !== "") {
				if (style === null) {
					style = document.createElement("style");
					style.id = CUSTOM_STYLE_ID;
					style.dataset.plugin = "dsh-client-ui-custom";
					document.head.appendChild(style);
				}
				style.textContent = config.customCss;
			} else style?.remove();
		}
		//#endregion
		//#region src/client/composer.ts
		/** Marker placed on remapped events so the listener ignores its own echoes. */
		const REMAPPED = "__dsuRemapped";
		function insertNewline(target) {
			const start = target.selectionStart ?? target.value.length;
			const end = target.selectionEnd ?? start;
			target.setRangeText("\n", start, end, "end");
			target.dispatchEvent(new InputEvent("input", {
				bubbles: true,
				inputType: "insertLineBreak",
				data: "\n"
			}));
		}
		function dispatchNativeSend(target) {
			const event = new KeyboardEvent("keydown", {
				key: "Enter",
				code: "Enter",
				keyCode: 13,
				which: 13,
				bubbles: true,
				cancelable: true
			});
			event[REMAPPED] = true;
			target.dispatchEvent(event);
		}
		/**
		* Install the composer remapper for one shortcuts config. Re-installable:
		* returns the disposer.
		* @param shortcuts - normalized shortcut config.
		* @returns the disposer removing the listener.
		*/
		function installComposerInput(shortcuts) {
			const sendCombo = parseKeyCombo(shortcuts.sendMessage);
			const newlineCombo = parseKeyCombo(shortcuts.newline);
			if (sendCombo === null && newlineCombo === null) return () => {};
			const handler = (event) => {
				if (event[REMAPPED] === true) return;
				const target = event.target;
				if (!(target instanceof HTMLTextAreaElement)) return;
				if (event.isComposing || event.keyCode === 229) return;
				const decision = composerRemapDecision(sendCombo, newlineCombo, event);
				if (decision === null) return;
				event.preventDefault();
				event.stopPropagation();
				if (decision === "send") dispatchNativeSend(target);
				else if (decision === "newline") insertNewline(target);
			};
			window.addEventListener("keydown", handler, true);
			return () => window.removeEventListener("keydown", handler, true);
		}
		/** All shipped presets, in display order. */
		const PRESETS = [
			{
				id: "ink-teal",
				name: "黛青",
				description: "青玉色渐变，静谧沉稳。",
				config: {
					wallpaper: "",
					glass: "light",
					accent: "#1e8f7e",
					autoAccent: false,
					surfaceOpacity: 40,
					sidebarOpacity: 40,
					chatSurfaceOpacity: 64,
					inputOpacity: 70,
					codeBlockOpacity: 50,
					darkSurfaceOpacity: 40,
					gradient: "linear-gradient(160deg, rgb(30 143 126 / 0.42) 0%, rgb(103 197 178 / 0.26) 55%, rgb(243 250 247 / 0.34) 100%)",
					darkScrim: 18,
					fontFamily: "",
					scrollbarAccent: true,
					vignette: false,
					cornerRadius: "lg",
					surfaceShadow: "soft",
					focusGlow: "on",
					wallpaperTone: "inherit",
					darkAccent: ""
				}
			},
			{
				id: "ink-blue",
				name: "黛蓝",
				description: "黛蓝渐变，深邃克制的蓝。",
				config: {
					wallpaper: "",
					glass: "light",
					accent: "#3f63d8",
					autoAccent: false,
					surfaceOpacity: 38,
					sidebarOpacity: 38,
					chatSurfaceOpacity: 62,
					inputOpacity: 68,
					codeBlockOpacity: 48,
					darkSurfaceOpacity: 38,
					gradient: "linear-gradient(160deg, rgb(63 99 216 / 0.40) 0%, rgb(129 158 233 / 0.24) 55%, rgb(246 248 253 / 0.34) 100%)",
					darkScrim: 18,
					fontFamily: "",
					scrollbarAccent: true,
					vignette: false,
					cornerRadius: "md",
					surfaceShadow: "soft",
					focusGlow: "on",
					wallpaperTone: "inherit",
					darkAccent: ""
				}
			},
			{
				id: "dusty-rose",
				name: "藕荷",
				description: "藕荷色渐变，温润柔和的粉。",
				config: {
					wallpaper: "",
					glass: "light",
					accent: "#c2788f",
					autoAccent: false,
					surfaceOpacity: 42,
					sidebarOpacity: 42,
					chatSurfaceOpacity: 66,
					inputOpacity: 70,
					codeBlockOpacity: 52,
					darkSurfaceOpacity: 42,
					gradient: "linear-gradient(160deg, rgb(194 120 143 / 0.36) 0%, rgb(224 168 186 / 0.22) 55%, rgb(252 246 248 / 0.32) 100%)",
					darkScrim: 16,
					fontFamily: "",
					scrollbarAccent: true,
					vignette: false,
					cornerRadius: "md",
					surfaceShadow: "soft",
					focusGlow: "inherit",
					wallpaperTone: "inherit",
					darkAccent: ""
				}
			},
			{
				id: "apricot-gold",
				name: "杏金",
				description: "杏金色渐变，温雅低调的金。",
				config: {
					wallpaper: "",
					glass: "light",
					accent: "#c0863c",
					autoAccent: false,
					surfaceOpacity: 42,
					sidebarOpacity: 42,
					chatSurfaceOpacity: 66,
					inputOpacity: 72,
					codeBlockOpacity: 52,
					darkSurfaceOpacity: 42,
					gradient: "linear-gradient(160deg, rgb(192 134 60 / 0.36) 0%, rgb(224 184 122 / 0.22) 55%, rgb(250 246 238 / 0.32) 100%)",
					darkScrim: 16,
					fontFamily: "",
					scrollbarAccent: true,
					vignette: false,
					cornerRadius: "md",
					surfaceShadow: "soft",
					focusGlow: "inherit",
					wallpaperTone: "inherit",
					darkAccent: ""
				}
			},
			{
				id: "mist-gray",
				name: "雾灰",
				description: "雾灰色渐变，清冷安静的灰蓝。",
				config: {
					wallpaper: "",
					glass: "frosted",
					accent: "#64728e",
					autoAccent: false,
					surfaceOpacity: 30,
					sidebarOpacity: 30,
					chatSurfaceOpacity: 52,
					inputOpacity: 60,
					codeBlockOpacity: 40,
					darkSurfaceOpacity: 30,
					gradient: "linear-gradient(160deg, rgb(100 114 142 / 0.34) 0%, rgb(44 52 72 / 0.38) 55%, rgb(16 19 27 / 0.48) 100%)",
					darkScrim: 26,
					fontFamily: "",
					scrollbarAccent: false,
					vignette: true,
					cornerRadius: "md",
					surfaceShadow: "medium",
					focusGlow: "inherit",
					wallpaperTone: "inherit",
					darkAccent: ""
				}
			},
			{
				id: "ink-violet",
				name: "墨紫",
				description: "墨紫色渐变，沉静神秘。",
				config: {
					wallpaper: "",
					glass: "frosted",
					accent: "#8268c4",
					autoAccent: false,
					surfaceOpacity: 28,
					sidebarOpacity: 28,
					chatSurfaceOpacity: 50,
					inputOpacity: 60,
					codeBlockOpacity: 40,
					darkSurfaceOpacity: 28,
					gradient: "linear-gradient(160deg, rgb(130 104 196 / 0.36) 0%, rgb(76 62 122 / 0.42) 55%, rgb(22 18 38 / 0.52) 100%)",
					darkScrim: 30,
					fontFamily: "",
					scrollbarAccent: true,
					vignette: true,
					cornerRadius: "lg",
					surfaceShadow: "medium",
					focusGlow: "on",
					wallpaperTone: "inherit",
					darkAccent: "#8268c4"
				}
			}
		];
		/** Id → preset lookup. */
		const PRESET_MAP = new Map(PRESETS.map((preset) => [preset.id, preset]));
		/**
		* Resolve a preset id to its partial config.
		* @param id - preset id ('' or unknown ids resolve to undefined).
		* @returns the preset's partial config, or undefined.
		*/
		function resolvePreset(id) {
			if (id === void 0 || id === "") return void 0;
			return PRESET_MAP.get(id)?.config;
		}
		//#endregion
		//#region src/client/usage-overlay.ts
		var usage_overlay_exports = /* @__PURE__ */ __exportAll({ usageOverlay: () => usageOverlay });
		const state$1 = {
			visible: false,
			listeners: /* @__PURE__ */ new Set()
		};
		const notify$1 = () => {
			for (const listener of [...state$1.listeners]) listener();
		};
		/** HostObservable<boolean> face the overlay entry binds. */
		const usageOverlay = {
			/** @returns whether the usage panel is currently shown. */
			getSnapshot: () => state$1.visible,
			/** Subscribe to visibility changes. */
			subscribe: (listener) => {
				state$1.listeners.add(listener);
				return () => state$1.listeners.delete(listener);
			},
			/** Toggle the panel (shortcut action). */
			toggle: () => {
				state$1.visible = !state$1.visible;
				notify$1();
			},
			/** Hide the panel (close button / Esc). */
			close: () => {
				if (!state$1.visible) return;
				state$1.visible = false;
				notify$1();
			}
		};
		//#endregion
		//#region src/client/locales.ts
		/** Locale dictionaries for the shortcuts settings section. */
		/** Dictionary namespace owned by ui-custom's settings section. */
		const NS = "shortcuts";
		/** Simplified Chinese copy. */
		const zh$6 = {
			nav: "快捷键",
			title: "快捷键",
			intro: "自定义键盘快捷键：新建对话、切换模型、切换思考强度、呼出应用用量面板，以及聊天输入框的发送与换行手势。组合键语法：Mod 代表 Ctrl 或 Meta（Mac 的 Command），例如 Mod+Alt+N。发送默认 Enter、换行默认 Shift+Enter——习惯 Enter 换行的可以把发送改为 Mod+Enter、换行改为 Enter。",
			newConversation: "新建对话",
			switchModel: "切换模型",
			cycleThinking: "切换思考强度",
			sendMessage: "发送消息",
			newline: "换行",
			usagePanel: "呼出用量",
			defaultWorkspaceTitle: "默认工作区",
			defaultWorkspaceDesc: "「新建对话」快捷键在此工作区创建会话；不指定则沿用当前会话的工作区。",
			defaultWorkspaceNone: "不指定",
			modelShortcutTitle: "模型快捷键",
			modelShortcutDesc: "为特定模型绑定快捷键，按下即切换过去（每个快捷键对应一个模型）。",
			modelShortcutEmpty: "尚未添加模型快捷键。点击「添加模型快捷键」后，录制组合键并选择目标模型。",
			modelShortcutAdd: "添加模型快捷键",
			modelShortcutRemove: "删除该绑定",
			modelShortcutPickTarget: "选择目标模型",
			modelCatalogEmpty: "当前会话没有可用的模型目录，无法选择目标模型。",
			modelCatalogUnavailable: "模型目录加载失败。",
			comboHint: "点击后按下组合键…",
			record: "录制快捷键",
			reset: "恢复默认",
			save: "保存",
			saving: "保存中…",
			dirty: "有未保存的修改",
			unavailable: "快捷键设置当前不可用",
			unavailableHint: "连接处于内存模式或该命名空间未对浏览器暴露。"
		};
		/** English copy. */
		const en$6 = {
			nav: "Shortcuts",
			title: "Keyboard Shortcuts",
			intro: "Custom keyboard shortcuts: new conversation, next model, thinking-effort cycling, the app-usage panel, plus the composer send/newline gestures. Combo syntax: Mod means Ctrl or Meta (Cmd on macOS), e.g. Mod+Alt+N. Send defaults to Enter and newline to Shift+Enter — if you prefer Enter to insert a newline, set send to Mod+Enter and newline to Enter.",
			newConversation: "New conversation",
			switchModel: "Switch model",
			cycleThinking: "Cycle thinking effort",
			sendMessage: "Send message",
			newline: "Newline",
			usagePanel: "Open usage",
			defaultWorkspaceTitle: "Default workspace",
			defaultWorkspaceDesc: "The \"new conversation\" shortcut opens a session in this workspace; unset inherits the current session's workspace.",
			defaultWorkspaceNone: "Unset",
			modelShortcutTitle: "Model shortcuts",
			modelShortcutDesc: "Bind a key combo to a specific model; pressing it switches to that model directly.",
			modelShortcutEmpty: "No model shortcuts yet. Click \"Add model shortcut\", record a combo, and pick the target model.",
			modelShortcutAdd: "Add model shortcut",
			modelShortcutRemove: "Remove this binding",
			modelShortcutPickTarget: "Pick a target model",
			modelCatalogEmpty: "The current session has no model catalog to pick from.",
			modelCatalogUnavailable: "The model catalog failed to load.",
			comboHint: "Click, then press the combination…",
			record: "Record shortcut",
			reset: "Reset",
			save: "Save",
			saving: "Saving…",
			dirty: "Unsaved changes",
			unavailable: "Shortcut settings are unavailable",
			unavailableHint: "The connection is in memory mode, or the namespace is not exposed to the browser."
		};
		//#endregion
		//#region src/client/usage/usage-locales.ts
		/** Locale dictionaries for the app-usage surface (settings section + overlay). */
		/** Dictionary namespace owned by the usage surface. */
		const USAGE_NS = "usage";
		/** Simplified Chinese copy. */
		const zh$5 = {
			nav: "用量",
			title: "用量",
			intro: "按时间窗口查看所用模型的 Token 用量、缓存命中与使用时长，也可切换查看具体某个模型的用量。数据来自各会话的用量投影（token-meter / session-stats）。",
			close: "关闭",
			empty: "该时间范围内暂无用量数据。",
			"model.all": "全部模型",
			"range.year": "近一年",
			"range.month": "近一月",
			"range.week": "近一周",
			"range.days3": "近三天",
			"kpi.total": "总 Token",
			"kpi.input": "输入 Token",
			"kpi.output": "输出 Token",
			"kpi.cache": "缓存命中",
			"kpi.cacheRate": "缓存命中率",
			"kpi.time": "使用时长",
			"kpi.sessions": "会话数",
			"kpi.steps": "执行步数",
			breakdown: "用量趋势",
			topSessions: "会话用量排行",
			topEmpty: "暂无会话用量。"
		};
		/** English copy. */
		const en$5 = {
			nav: "Usage",
			title: "Usage",
			intro: "Token usage, cache hits, and model time across your sessions, filtered by time window or by a specific model. Data comes from each session's usage projections (token-meter / session-stats).",
			close: "Close",
			empty: "No usage data in this range yet.",
			"model.all": "All models",
			"range.year": "Last year",
			"range.month": "Last month",
			"range.week": "Last week",
			"range.days3": "Last 3 days",
			"kpi.total": "Total tokens",
			"kpi.input": "Input tokens",
			"kpi.output": "Output tokens",
			"kpi.cache": "Cache hits",
			"kpi.cacheRate": "Cache hit rate",
			"kpi.time": "Model time",
			"kpi.sessions": "Sessions",
			"kpi.steps": "Steps",
			breakdown: "Usage trend",
			topSessions: "Top sessions",
			topEmpty: "No session usage yet."
		};
		//#endregion
		//#region src/client/appearance/appearance-locales.ts
		/** Locale dictionaries for the appearance settings section (主题定制 + 外观偏好). */
		/** Dictionary namespace owned by the appearance surface. */
		const APPEARANCE_NS = "appearance";
		/** Simplified Chinese copy. */
		const zh$4 = {
			nav: "外观",
			title: "外观",
			intro: "主题偏好与美术定制：渐变底色、壁纸、毛玻璃、强调色、表面不透明度与暗色遮罩。改动保存后即时生效。",
			save: "保存",
			saving: "保存中…",
			reset: "恢复默认",
			dirty: "有未保存的修改",
			unavailable: "外观设置当前不可用",
			unavailableHint: "连接处于内存模式或该命名空间未对浏览器暴露。",
			wallpaper: "壁纸",
			wallpaperHint: "URL 或 Web 可访问路径；留空 = 关闭壁纸。",
			glass: "玻璃档位",
			"glass.off": "不透明",
			"glass.light": "轻玻璃",
			"glass.frosted": "毛玻璃",
			"glass.mica": "Mica",
			accent: "强调色",
			autoAccent: "从壁纸自动取色",
			surfaceOpacity: "主表面不透明度",
			sidebarOpacity: "侧栏不透明度",
			chatSurfaceOpacity: "聊天列不透明度",
			inputOpacity: "输入框不透明度",
			codeBlockOpacity: "代码块不透明度",
			darkSurfaceOpacity: "暗色表面不透明度",
			gradient: "色调渐变",
			gradientHint: "CSS 渐变，作为主题底色；叠加在壁纸上（如有）。留空 = 无。",
			darkScrim: "暗色遮罩",
			fontFamily: "字体",
			codeFontFamily: "代码字体",
			fontScale: "字号缩放",
			fontScaleHint: "整体界面 0.9–1.1 倍缩放。",
			scrollbarAccent: "主题色滚动条",
			vignette: "内嵌晕影",
			preview: "预览",
			previewing: "预览中——满意后点「保存」，不满意点「取消预览」",
			cancelPreview: "取消预览",
			refineTitle: "质感",
			cornerRadius: "圆角",
			"radius.inherit": "跟随默认",
			"radius.sm": "小 (6px)",
			"radius.md": "中 (10px)",
			"radius.lg": "大 (14px)",
			"radius.xl": "超大 (18px)",
			surfaceShadow: "表面阴影",
			"shadow.inherit": "跟随默认",
			"shadow.none": "无阴影",
			"shadow.soft": "轻盈",
			"shadow.medium": "适中",
			"shadow.strong": "深邃",
			wallpaperTone: "壁纸调性",
			"tone.inherit": "原样",
			"tone.soft": "柔化",
			"tone.dim": "压暗",
			"tone.bright": "提亮",
			darkAccent: "暗色强调色",
			darkAccentHint: "留空 = 暗色模式跟随主强调色；设置后仅暗色模式使用该颜色。",
			darkAccentPlaceholder: "留空 = 跟随主强调色",
			focusGlow: "焦点光晕",
			accentPalette: "和谐色板",
			accentPaletteHint: "从当前强调色派生的一组邻近/互补/三角色，点击即可选用。",
			presetTitle: "一键预设",
			presetHint: "点击预设将方案载入下方设置项（壁纸清空，由渐变作为底色），点「预览」查看效果，点「保存」持久化，或点「取消预览」还原。",
			myPresetName: "给这个外观起个名字，存为我的预设",
			saveMyPreset: "另存为我的预设",
			removeMyPreset: "删除该预设",
			activePreset: "当前",
			previewTitle: "实时预览",
			previewHint: "迷你界面随下方参数实时变化；点「随机灵感」可生成一套和谐配色。",
			randomInspiration: "随机灵感",
			groupBackground: "背景",
			groupColor: "色彩",
			groupSurface: "表面",
			groupTypography: "排版",
			groupReset: "恢复本组默认",
			fontPreset: "字体搭配",
			fontPresetHint: "一键套用「界面字体 + 代码字体」组合；字体栈内已含中文字体建议，未安装的字体自动回退。",
			fontCustom: "自定义",
			previewingBar: "按 F2 退出预览"
		};
		/** English copy. */
		const en$4 = {
			nav: "Appearance",
			title: "Appearance",
			intro: "Theme preference and art customization: wallpaper, frosted glass, accent, surface opacity and dark scrim. Changes apply immediately on save.",
			save: "Save",
			saving: "Saving…",
			reset: "Reset to defaults",
			dirty: "Unsaved changes",
			unavailable: "Appearance settings are unavailable",
			unavailableHint: "The connection is in memory mode, or the namespace is not exposed to the browser.",
			wallpaper: "Wallpaper",
			wallpaperHint: "URL or web-served path; empty disables the wallpaper.",
			glass: "Glass level",
			"glass.off": "Opaque",
			"glass.light": "Light",
			"glass.frosted": "Frosted",
			"glass.mica": "Mica",
			accent: "Accent color",
			autoAccent: "Auto accent from wallpaper",
			surfaceOpacity: "Main surface opacity",
			sidebarOpacity: "Sidebar opacity",
			chatSurfaceOpacity: "Chat column opacity",
			inputOpacity: "Input opacity",
			codeBlockOpacity: "Code block opacity",
			darkSurfaceOpacity: "Dark surface opacity",
			gradient: "Tone gradient",
			gradientHint: "CSS gradient wash as the theme base; layered over the wallpaper (if any). Empty = none.",
			darkScrim: "Dark scrim",
			fontFamily: "Font family",
			codeFontFamily: "Code font",
			fontScale: "Font scale",
			fontScaleHint: "Scales the whole UI from 0.9× to 1.1×.",
			scrollbarAccent: "Accent scrollbar",
			vignette: "Vignette",
			preview: "Preview",
			previewing: "Previewing — click Save to keep, or Cancel preview to revert",
			cancelPreview: "Cancel preview",
			refineTitle: "Refinement (optional — nothing changes by default)",
			cornerRadius: "Corner radius",
			"radius.inherit": "Follow default",
			"radius.sm": "Small (6px)",
			"radius.md": "Medium (10px)",
			"radius.lg": "Large (14px)",
			"radius.xl": "Extra large (18px)",
			surfaceShadow: "Surface shadow",
			"shadow.inherit": "Follow default",
			"shadow.none": "None",
			"shadow.soft": "Soft",
			"shadow.medium": "Medium",
			"shadow.strong": "Strong",
			wallpaperTone: "Wallpaper tone",
			"tone.inherit": "Original",
			"tone.soft": "Soft",
			"tone.dim": "Dim",
			"tone.bright": "Bright",
			darkAccent: "Dark-mode accent",
			darkAccentHint: "Empty inherits the main accent in dark mode; set to override it there only.",
			darkAccentPlaceholder: "Empty = follow main accent",
			focusGlow: "Focus glow",
			accentPalette: "Harmony palette",
			accentPaletteHint: "Neighboring / complementary / triadic shades derived from the accent — click to pick.",
			presetTitle: "One-click presets",
			presetHint: "Clicking a preset loads its scheme into the form below (the wallpaper clears so the gradient becomes the base); press Preview to see it, Save to persist, or Cancel preview to revert.",
			myPresetName: "Name this look and save it as my preset",
			saveMyPreset: "Save as my preset",
			removeMyPreset: "Remove this preset",
			activePreset: "Current",
			previewTitle: "Live preview",
			previewHint: "A mini UI that follows every parameter below in real time; hit Random inspiration for a harmonious palette.",
			randomInspiration: "Random inspiration",
			groupBackground: "Background",
			groupColor: "Color",
			groupSurface: "Surfaces",
			groupTypography: "Typography",
			groupReset: "Reset group",
			fontPreset: "Font pairing",
			fontPresetHint: "Apply a ui + code font pairing in one click; CJK stacks are built in, missing faces fall back automatically.",
			fontCustom: "Custom",
			previewingBar: "Press F2 to exit preview"
		};
		//#endregion
		//#region src/client/settings/contract.ts
		const SHORTCUT_FIELDS = [
			"newConversation",
			"switchModel",
			"cycleThinking",
			"sendMessage",
			"newline",
			"usagePanel"
		];
		/** Structural equality for the model-shortcut list. */
		const sameModelShortcuts = (a, b) => a.length === b.length && a.every((entry, index) => entry.combo === b[index]?.combo && entry.provider === b[index]?.provider && entry.model === b[index]?.model);
		/** Bridges the ui-custom settings scope onto the section's staged form. */
		var ShortcutsSettingsController = class {
			scope;
			loadModels;
			/** The projected snapshot store the section renders. */
			store;
			/** The current session's model catalog store. */
			models;
			values;
			draft;
			saving = false;
			alive = true;
			/**
			* @param scope - the bound settings scope for the ui-custom namespace.
			* @param defaults - loader-config shortcuts (fallback per unset field).
			* @param loadModels - loads the current session's model catalog ('' when none).
			*/
			constructor(scope, defaults, loadModels) {
				this.scope = scope;
				this.loadModels = loadModels;
				this.values = {
					...defaults,
					modelShortcuts: [...defaults.modelShortcuts]
				};
				this.draft = {
					...defaults,
					modelShortcuts: [...defaults.modelShortcuts]
				};
				this.models = (0, _deepseek_ai_dsh_client_runtime_client.createSnapshotStore)({
					status: "idle",
					options: []
				});
				this.store = (0, _deepseek_ai_dsh_client_runtime_client.createSnapshotStore)({
					status: "loading",
					writable: false,
					values: this.values,
					draft: this.draft,
					dirty: false,
					saving: false
				});
				this.sync();
			}
			/** Re-project from the scope snapshot (called on construction and scope changes). */
			sync() {
				const snapshot = this.scope.getSnapshot();
				const section = snapshot.value;
				const values = { ...this.values };
				for (const field of SHORTCUT_FIELDS) {
					const override = section?.[field];
					values[field] = override === void 0 ? this.values[field] : override;
				}
				values.defaultWorkspace = section?.defaultWorkspace ?? this.values.defaultWorkspace;
				values.modelShortcuts = section?.modelShortcuts ?? this.values.modelShortcuts;
				this.values = values;
				if (!this.dirty()) this.draft = {
					...values,
					modelShortcuts: [...values.modelShortcuts]
				};
				this.store.update((state) => {
					state.status = snapshot.status;
					state.writable = snapshot.writable;
					state.values = values;
					state.draft = this.draft;
					state.dirty = this.dirty();
					state.saving = this.saving;
				});
			}
			dirty() {
				return SHORTCUT_FIELDS.some((field) => this.draft[field] !== this.values[field]) || this.draft.defaultWorkspace !== this.values.defaultWorkspace || !sameModelShortcuts(this.draft.modelShortcuts, this.values.modelShortcuts);
			}
			publish() {
				this.store.update((state) => {
					state.values = this.values;
					state.draft = this.draft;
					state.dirty = this.dirty();
					state.saving = this.saving;
				});
			}
			/** Stage one standard field edit. */
			setDraft(field, spec) {
				this.draft = {
					...this.draft,
					[field]: spec.trim()
				};
				this.publish();
			}
			/** Stage the default workspace for the new-conversation shortcut. */
			setDefaultWorkspace(workspaceId) {
				this.draft = {
					...this.draft,
					defaultWorkspace: workspaceId
				};
				this.publish();
			}
			/** Stage a new (unbound) model shortcut row. */
			addModelShortcut() {
				this.draft = {
					...this.draft,
					modelShortcuts: [...this.draft.modelShortcuts, {
						combo: "",
						provider: "",
						model: ""
					}]
				};
				this.publish();
			}
			/** Stage removal of one model shortcut row. */
			removeModelShortcut(index) {
				const next = [...this.draft.modelShortcuts];
				next.splice(index, 1);
				this.draft = {
					...this.draft,
					modelShortcuts: next
				};
				this.publish();
			}
			/** Stage one model shortcut's key combo. */
			setModelShortcutCombo(index, combo) {
				this.draft = {
					...this.draft,
					modelShortcuts: this.draft.modelShortcuts.map((entry, i) => i === index ? {
						...entry,
						combo: combo.trim()
					} : entry)
				};
				this.publish();
			}
			/** Stage one model shortcut's target model. */
			setModelShortcutTarget(index, provider, model) {
				this.draft = {
					...this.draft,
					modelShortcuts: this.draft.modelShortcuts.map((entry, i) => i === index ? {
						...entry,
						provider,
						model
					} : entry)
				};
				this.publish();
			}
			/** Stage the field back to its effective value (clears the edit). */
			resetField(field) {
				this.setDraft(field, this.values[field]);
			}
			/** Write every changed field through the scope ('' → unset). */
			async save() {
				if (!this.dirty() || this.saving) return;
				this.saving = true;
				this.publish();
				try {
					for (const field of SHORTCUT_FIELDS) {
						const next = this.draft[field];
						if (next === this.values[field]) continue;
						if (next === "") await this.scope.unset(field);
						else await this.scope.set(field, next);
					}
					const nextWorkspace = this.draft.defaultWorkspace;
					if (nextWorkspace !== this.values.defaultWorkspace) if (nextWorkspace === "") await this.scope.unset("defaultWorkspace");
					else await this.scope.set("defaultWorkspace", nextWorkspace);
					const nextModels = this.draft.modelShortcuts;
					if (!sameModelShortcuts(nextModels, this.values.modelShortcuts)) if (nextModels.length === 0) await this.scope.unset("modelShortcuts");
					else await this.scope.set("modelShortcuts", nextModels.map((entry) => ({ ...entry })));
				} finally {
					this.saving = false;
					this.sync();
				}
			}
			/** Load the current session's model catalog into {@link models}. */
			async refreshModels() {
				if (!this.alive) return;
				this.models.update((state) => {
					state.status = "loading";
				});
				try {
					const options = await this.loadModels();
					if (!this.alive) return;
					this.models.update((state) => {
						state.status = "ready";
						state.options = options;
					});
				} catch {
					if (!this.alive) return;
					this.models.update((state) => {
						state.status = "error";
						state.options = [];
					});
				}
			}
			/** Wire the controller: subscribe the scope and expose the form actions. */
			mount() {
				const dispose = this.scope.subscribe(() => this.sync());
				return {
					dispose: () => {
						this.alive = false;
						dispose();
					},
					actions: {
						setDraft: (field, spec) => this.setDraft(field, spec),
						setDefaultWorkspace: (workspaceId) => this.setDefaultWorkspace(workspaceId),
						addModelShortcut: () => this.addModelShortcut(),
						removeModelShortcut: (index) => this.removeModelShortcut(index),
						setModelShortcutCombo: (index, combo) => this.setModelShortcutCombo(index, combo),
						setModelShortcutTarget: (index, provider, model) => this.setModelShortcutTarget(index, provider, model),
						save: () => {
							this.save();
						},
						resetField: (field) => this.resetField(field)
					}
				};
			}
		};
		//#endregion
		//#region \0dsh-css:D:\ZcodeWorkspace\.zcode\workspace\default\deepseek-harness\packages\client\ui-custom\src\client\settings\ShortcutsSection.module.css.mjs
		const css$13 = "._1lJSFG_section{flex-direction:column;gap:16px;display:flex}._1lJSFG_heading{margin:0;font-size:16px;font-weight:600;line-height:24px}._1lJSFG_intro{color:var(--dsw-alias-label-secondary);margin:0;font-size:13px;line-height:20px}._1lJSFG_rows{flex-direction:column;gap:10px;display:flex}._1lJSFG_row{align-items:center;gap:10px;display:flex}._1lJSFG_label{width:140px;color:var(--dsw-alias-label-primary);flex:none;font-size:13px;line-height:20px}._1lJSFG_capture{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-specific-input-major);min-width:120px;height:32px;color:var(--dsw-alias-label-primary);font:var(--dsw-font-markdown-code-block);text-align:left;cursor:pointer;border-radius:6px;flex:0 220px;padding:0 10px}._1lJSFG_capture:hover:not(:disabled){border-color:var(--dsw-alias-border-l3)}._1lJSFG_captureRecording{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary) 25%, transparent)}._1lJSFG_capture:disabled{cursor:default;opacity:.6}._1lJSFG_reset{height:28px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;border-radius:6px;padding:0 10px;font-size:12px;line-height:28px}._1lJSFG_reset:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}._1lJSFG_reset:disabled{cursor:default;opacity:.5}._1lJSFG_footer{justify-content:flex-end;align-items:center;gap:12px;display:flex}._1lJSFG_dirty{color:var(--dsw-alias-state-warn-primary);font-size:12px;line-height:18px}._1lJSFG_save{background:var(--dsw-alias-button-primary-fill);height:30px;color:var(--dsw-alias-label-primary-foreground);cursor:pointer;border:none;border-radius:6px;padding:0 14px;font-size:13px;line-height:30px}._1lJSFG_save:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover)}._1lJSFG_save:disabled{cursor:default;opacity:.5}._1lJSFG_unavailable{padding:12px 0}._1lJSFG_unavailable p{margin:0}._1lJSFG_unavailableHint{color:var(--dsw-alias-label-tertiary);margin-top:4px;font-size:12px;line-height:18px}._1lJSFG_rowDesc{color:var(--dsw-alias-label-tertiary);margin:-6px 0 0 150px;font-size:12px;line-height:18px}._1lJSFG_selector,._1lJSFG_modelTarget{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-specific-input-major);min-width:140px;height:32px;color:var(--dsw-alias-label-primary);text-align:left;cursor:pointer;border-radius:6px;flex:0 260px;justify-content:space-between;align-items:center;gap:8px;padding:0 10px;font-size:13px;display:inline-flex}._1lJSFG_selector:hover:not(:disabled),._1lJSFG_modelTarget:hover:not(:disabled){border-color:var(--dsw-alias-border-l3)}._1lJSFG_selector:disabled,._1lJSFG_modelTarget:disabled{cursor:default;opacity:.6}._1lJSFG_chevron{color:var(--dsw-alias-label-tertiary);flex:none}._1lJSFG_modelBlock{border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb, var(--dsw-alias-bg-base) 55%, transparent);border-radius:10px;flex-direction:column;gap:8px;margin-top:6px;padding:12px 14px;display:flex}._1lJSFG_modelTitle{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600;line-height:20px}._1lJSFG_modelDesc,._1lJSFG_modelEmpty{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:18px}._1lJSFG_modelList{flex-direction:column;gap:8px;display:flex}._1lJSFG_modelRow{align-items:center;gap:8px;display:flex}._1lJSFG_modelRow ._1lJSFG_capture{flex:0 200px}._1lJSFG_modelRemove{width:28px;height:28px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:none;border-radius:6px;flex:none;font-size:13px;line-height:28px}._1lJSFG_modelRemove:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary)}._1lJSFG_modelRemove:disabled{cursor:default;opacity:.5}._1lJSFG_modelAdd{border:1px solid var(--dsw-alias-border-l2);height:28px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border-radius:6px;align-self:flex-start;padding:0 12px;font-size:12px;line-height:26px}._1lJSFG_modelAdd:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}._1lJSFG_modelAdd:disabled{cursor:default;opacity:.5}";
		const tagId$13 = "@deepseek-ai/dsh-client-ui-custom/ShortcutsSection.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$13) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-custom";
			tag.dataset.pluginCss = tagId$13;
			tag.textContent = css$13;
			document.head.appendChild(tag);
		}
		var ShortcutsSection_module_css_default = {
			"reset": "_1lJSFG_reset",
			"capture": "_1lJSFG_capture",
			"section": "_1lJSFG_section",
			"footer": "_1lJSFG_footer",
			"row": "_1lJSFG_row",
			"unavailableHint": "_1lJSFG_unavailableHint",
			"save": "_1lJSFG_save",
			"rowDesc": "_1lJSFG_rowDesc",
			"selector": "_1lJSFG_selector",
			"modelRow": "_1lJSFG_modelRow",
			"modelEmpty": "_1lJSFG_modelEmpty",
			"label": "_1lJSFG_label",
			"dirty": "_1lJSFG_dirty",
			"modelTarget": "_1lJSFG_modelTarget",
			"heading": "_1lJSFG_heading",
			"unavailable": "_1lJSFG_unavailable",
			"captureRecording": "_1lJSFG_captureRecording",
			"modelTitle": "_1lJSFG_modelTitle",
			"modelRemove": "_1lJSFG_modelRemove",
			"modelAdd": "_1lJSFG_modelAdd",
			"chevron": "_1lJSFG_chevron",
			"modelBlock": "_1lJSFG_modelBlock",
			"intro": "_1lJSFG_intro",
			"rows": "_1lJSFG_rows",
			"modelList": "_1lJSFG_modelList",
			"modelDesc": "_1lJSFG_modelDesc"
		};
		//#endregion
		//#region src/client/settings/KeyCapture.tsx
		/**
		* KeyCapture: a recorder button — click, press the combination, done. Uses
		* the same pure parser as the shortcut listener, so a recorded spec always
		* round-trips. Esc cancels; modifier-only presses are ignored.
		*/
		/**
		* Render the recorder button.
		* @param props - recorder props.
		* @returns the button element.
		*/
		function KeyCapture({ value, onChange, t, disabled, id }) {
			const [recording, setRecording] = (0, react.useState)(false);
			const onChangeRef = (0, react.useRef)(onChange);
			onChangeRef.current = onChange;
			(0, react.useEffect)(() => {
				if (!recording) return;
				const onKeyDown = (event) => {
					event.preventDefault();
					event.stopPropagation();
					if (event.key === "Escape") {
						setRecording(false);
						return;
					}
					const spec = specFromEvent(event);
					if (spec !== null) {
						onChangeRef.current(spec);
						setRecording(false);
					}
				};
				window.addEventListener("keydown", onKeyDown, true);
				return () => window.removeEventListener("keydown", onKeyDown, true);
			}, [recording]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				id,
				className: recording ? `${ShortcutsSection_module_css_default.capture} ${ShortcutsSection_module_css_default.captureRecording}` : ShortcutsSection_module_css_default.capture,
				disabled,
				"aria-label": t("record"),
				onClick: () => setRecording(true),
				children: recording ? t("comboHint") : value === "" ? t("comboHint") : value
			});
		}
		//#endregion
		//#region src/client/settings/ShortcutsSection.tsx
		/** The "快捷键" settings section: six recordable bindings, the default
		* workspace for the new-conversation shortcut, one-to-one model shortcuts,
		* and the save/reset footer. */
		/** The rows, in display order. */
		const ROWS = [
			{
				field: "newConversation",
				label: "newConversation"
			},
			{
				field: "switchModel",
				label: "switchModel"
			},
			{
				field: "cycleThinking",
				label: "cycleThinking"
			},
			{
				field: "sendMessage",
				label: "sendMessage"
			},
			{
				field: "newline",
				label: "newline"
			},
			{
				field: "usagePanel",
				label: "usagePanel"
			}
		];
		/**
		* Render the shortcuts section content.
		* @param props - composed slot props + injected controller face.
		*/
		function ShortcutsSection({ t, useShortcuts, useWorkspaces, useModels, setDraft, save, resetField, setDefaultWorkspace, addModelShortcut, removeModelShortcut, setModelShortcutCombo, setModelShortcutTarget, usageAvailable }) {
			const state = useShortcuts((value) => value);
			const workspaces = useWorkspaces((value) => value);
			const models = useModels((value) => value);
			const [wsOpen, setWsOpen] = (0, react.useState)(false);
			const [modelOpen, setModelOpen] = (0, react.useState)(null);
			const items = workspaces?.items ?? [];
			const rows = ROWS.filter((row) => row.field !== "usagePanel" || usageAvailable);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: ShortcutsSection_module_css_default.section,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
						className: ShortcutsSection_module_css_default.heading,
						children: t("title")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: ShortcutsSection_module_css_default.intro,
						children: t("intro")
					}),
					state.status === "unavailable" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: ShortcutsSection_module_css_default.unavailable,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("unavailable") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: ShortcutsSection_module_css_default.unavailableHint,
							children: t("unavailableHint")
						})]
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: ShortcutsSection_module_css_default.rows,
						children: [
							rows.map((row) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: ShortcutsSection_module_css_default.row,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
										className: ShortcutsSection_module_css_default.label,
										htmlFor: `shortcut-${row.field}`,
										children: t(row.label)
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(KeyCapture, {
										id: `shortcut-${row.field}`,
										value: state.draft[row.field],
										onChange: (spec) => setDraft(row.field, spec),
										t,
										disabled: !state.writable
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: ShortcutsSection_module_css_default.reset,
										disabled: !state.writable,
										onClick: () => resetField(row.field),
										children: t("reset")
									})
								]
							}, row.field)),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: ShortcutsSection_module_css_default.row,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
									className: ShortcutsSection_module_css_default.label,
									htmlFor: "default-workspace",
									children: t("defaultWorkspaceTitle")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
									open: wsOpen,
									onClose: () => {
										setWsOpen(false);
									},
									items: [{
										id: "",
										label: t("defaultWorkspaceNone")
									}, ...items.map((workspace) => ({
										id: workspace.workspaceId,
										label: workspace.title
									}))],
									selectedId: state.draft.defaultWorkspace,
									onSelect: (id) => {
										setWsOpen(false);
										setDefaultWorkspace(id);
									},
									align: "end",
									portal: true,
									anchor: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										id: "default-workspace",
										className: ShortcutsSection_module_css_default.selector,
										"aria-haspopup": "menu",
										"aria-expanded": wsOpen,
										disabled: !state.writable,
										onClick: () => {
											setWsOpen((value) => !value);
										},
										children: [state.draft.defaultWorkspace === "" ? t("defaultWorkspaceNone") : items.find((workspace) => workspace.workspaceId === state.draft.defaultWorkspace)?.title ?? state.draft.defaultWorkspace, /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, { className: ShortcutsSection_module_css_default.chevron })]
									})
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: ShortcutsSection_module_css_default.rowDesc,
								children: t("defaultWorkspaceDesc")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: ShortcutsSection_module_css_default.modelBlock,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: ShortcutsSection_module_css_default.modelTitle,
										children: t("modelShortcutTitle")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: ShortcutsSection_module_css_default.modelDesc,
										children: t("modelShortcutDesc")
									}),
									state.draft.modelShortcuts.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: ShortcutsSection_module_css_default.modelEmpty,
										children: t("modelShortcutEmpty")
									}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: ShortcutsSection_module_css_default.modelList,
										children: state.draft.modelShortcuts.map((entry, index) => {
											const target = models.options.find((option) => option.provider === entry.provider && option.model === entry.model);
											return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												className: ShortcutsSection_module_css_default.modelRow,
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)(KeyCapture, {
														id: `model-shortcut-${index}`,
														value: entry.combo,
														onChange: (spec) => setModelShortcutCombo(index, spec),
														t,
														disabled: !state.writable
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
														open: modelOpen === index,
														onClose: () => {
															setModelOpen(null);
														},
														items: models.options.map((option) => ({
															id: `${option.provider}:${option.model}`,
															label: option.label
														})),
														selectedId: entry.provider === "" || entry.model === "" ? "" : `${entry.provider}:${entry.model}`,
														onSelect: (id) => {
															setModelOpen(null);
															const separator = id.indexOf(":");
															if (separator > 0) setModelShortcutTarget(index, id.slice(0, separator), id.slice(separator + 1));
														},
														align: "end",
														portal: true,
														anchor: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
															type: "button",
															className: ShortcutsSection_module_css_default.modelTarget,
															"aria-haspopup": "menu",
															"aria-expanded": modelOpen === index,
															disabled: !state.writable || models.options.length === 0,
															onClick: () => {
																setModelOpen((current) => current === index ? null : index);
															},
															children: [entry.provider === "" || entry.model === "" ? t("modelShortcutPickTarget") : target?.label ?? `${entry.provider} / ${entry.model}`, /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, { className: ShortcutsSection_module_css_default.chevron })]
														})
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
														type: "button",
														className: ShortcutsSection_module_css_default.modelRemove,
														"aria-label": t("modelShortcutRemove"),
														disabled: !state.writable,
														onClick: () => removeModelShortcut(index),
														children: "✕"
													})
												]
											}, index);
										})
									}),
									models.status === "error" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: ShortcutsSection_module_css_default.modelDesc,
										children: t("modelCatalogUnavailable")
									}),
									models.status === "ready" && models.options.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: ShortcutsSection_module_css_default.modelDesc,
										children: t("modelCatalogEmpty")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: ShortcutsSection_module_css_default.modelAdd,
										disabled: !state.writable,
										onClick: addModelShortcut,
										children: t("modelShortcutAdd")
									})
								]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: ShortcutsSection_module_css_default.footer,
						children: [state.dirty ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: ShortcutsSection_module_css_default.dirty,
							children: t("dirty")
						}) : null, /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: ShortcutsSection_module_css_default.save,
							disabled: !state.dirty || !state.writable || state.saving,
							onClick: save,
							children: state.saving ? t("saving") : t("save")
						})]
					})
				]
			});
		}
		//#endregion
		//#region src/client/font-presets.ts
		/** The stock look: no override, the theme's own stacks win. */
		const DEFAULT_PRESET = {
			id: "default",
			name: "默认",
			description: "跟随系统与主题默认字体，不做替换。",
			uiFont: "",
			codeFont: ""
		};
		/** All shipped font pairings, in display order. */
		const FONT_PRESETS = [
			DEFAULT_PRESET,
			{
				id: "harmony",
				name: "鸿蒙",
				description: "HarmonyOS Sans 界面 + 鸿蒙等宽代码，清爽克制。",
				uiFont: "'HarmonyOS Sans SC', 'HarmonyOS Sans', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', system-ui, sans-serif",
				codeFont: "'HarmonyOS Sans Mono', 'JetBrains Mono', 'Cascadia Code', Consolas, 'PingFang SC', monospace"
			},
			{
				id: "misans",
				name: "米思",
				description: "MiSans 界面 + JetBrains Mono 代码，现代利落。",
				uiFont: "'MiSans', 'HarmonyOS Sans SC', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
				codeFont: "'JetBrains Mono', 'Cascadia Code', Consolas, 'MiSans', monospace"
			},
			{
				id: "lxgw",
				name: "文楷",
				description: "霞鹜文楷界面（楷体装饰风）+ 文楷等宽代码，温润书卷气。",
				uiFont: "'LXGW WenKai', '霞鹜文楷', 'Kaiti SC', 'STKaiti', 'KaiTi', serif",
				codeFont: "'LXGW WenKai Mono', 'LXGW WenKai', 'JetBrains Mono', Consolas, monospace"
			},
			{
				id: "source-han",
				name: "思源",
				description: "思源黑体（Noto Sans SC）界面 + Fira Code 代码，稳重清晰。",
				uiFont: "'Source Han Sans SC', 'Noto Sans SC', 'HarmonyOS Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
				codeFont: "'Fira Code', 'JetBrains Mono', 'Cascadia Code', Consolas, 'Noto Sans SC', monospace"
			}
		];
		/** Id → font-preset lookup. */
		const FONT_PRESET_MAP = new Map(FONT_PRESETS.map((preset) => [preset.id, preset]));
		/**
		* Resolve a font pairing to its theme fields.
		* @param id - preset id ('' / unknown / 'default' resolve to the neutral pair).
		* @returns the partial config fields for `fontFamily` / `codeFontFamily`.
		*/
		function resolveFontPreset(id) {
			const preset = (id === void 0 || id === "" ? void 0 : FONT_PRESET_MAP.get(id)) ?? DEFAULT_PRESET;
			return {
				fontFamily: preset.uiFont,
				codeFontFamily: preset.codeFont
			};
		}
		//#endregion
		//#region src/client/preview-bar.ts
		/**
		* Preview-mode visibility store: a tiny module-level HostObservable so the
		* floating preview bar (shell.overlay) can appear when the appearance draft is
		* previewed on the document. The bar is shown by the appearance controller on
		* preview / preset-apply and hidden when the preview is saved, cancelled, or
		* invalidated — independent from the controller's `previewing` flag, because
		* "back to settings" keeps the draft staged while the bar itself disappears.
		*/
		const state = {
			visible: false,
			listeners: /* @__PURE__ */ new Set()
		};
		const notify = () => {
			for (const listener of [...state.listeners]) listener();
		};
		/** HostObservable<boolean> face the preview bar entry binds. */
		const previewBar = {
			/** @returns whether the preview bar is currently shown. */
			getSnapshot: () => state.visible,
			/** Subscribe to visibility changes. */
			subscribe: (listener) => {
				state.listeners.add(listener);
				return () => state.listeners.delete(listener);
			},
			/** Show the bar (entering preview mode). */
			show: () => {
				state.visible = true;
				notify();
			},
			/** Hide the bar (saved / cancelled / back to settings). */
			hide: () => {
				if (!state.visible) return;
				state.visible = false;
				notify();
			}
		};
		//#endregion
		//#region src/client/theme-section.ts
		/**
		* Mapping from the runtime theme section (settings scope) onto a normalized
		* CustomThemeConfig. Pure and testable: the section carries the settings
		* document's resolved values (user overrides layered over the loader base);
		* fields absent while loading/unavailable fall back to the loader config.
		*/
		const GLASS_LEVELS = [
			"off",
			"light",
			"frosted",
			"mica"
		];
		const isGlassLevel = (value) => typeof value === "string" && GLASS_LEVELS.includes(value);
		/**
		* Merge a theme section over the normalized loader config.
		* @param normalized - the loader-layer normalized config (fallback).
		* @param section - the settings scope's resolved theme section.
		* @returns the effective config the applier should render.
		*/
		function configFromThemeSection(normalized, section) {
			if (section === void 0) return normalized;
			const { darkSurfaceOpacity, ...rest } = normalized;
			const stringField = (value, fallback) => value !== void 0 && value !== "" ? value : fallback;
			return {
				...rest,
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
				cornerRadius: isCornerRadius(section.cornerRadius) ? section.cornerRadius : normalized.cornerRadius,
				surfaceShadow: isSurfaceShadow(section.surfaceShadow) ? section.surfaceShadow : normalized.surfaceShadow,
				focusGlow: isFocusGlow(section.focusGlow) ? section.focusGlow : normalized.focusGlow,
				wallpaperTone: isWallpaperTone(section.wallpaperTone) ? section.wallpaperTone : normalized.wallpaperTone,
				darkAccent: stringField(section.darkAccent, normalized.darkAccent)
			};
		}
		//#endregion
		//#region src/client/appearance/controller.ts
		/**
		* Appearance settings controller: a staged draft over the theme fields of the
		* ui-custom settings scope, projected into a snapshot store the section
		* renders. Values = the scope's resolved theme (user overrides over the
		* loader base); save writes changed fields, reset-all unsets them (reverting
		* to the loader defaults). Preview renders the draft to the document WITHOUT
		* touching the scope — the user decides after seeing the effect; cancel
		* re-applies the saved values.
		*/
		const THEME_FIELDS = [
			"wallpaper",
			"glass",
			"accent",
			"autoAccent",
			"surfaceOpacity",
			"sidebarOpacity",
			"chatSurfaceOpacity",
			"inputOpacity",
			"codeBlockOpacity",
			"darkSurfaceOpacity",
			"gradient",
			"darkScrim",
			"fontFamily",
			"codeFontFamily",
			"fontScale",
			"scrollbarAccent",
			"vignette",
			"cornerRadius",
			"surfaceShadow",
			"focusGlow",
			"wallpaperTone",
			"darkAccent"
		];
		/** Field list per group — drives the group reset. */
		const GROUP_FIELDS = {
			background: [
				"wallpaper",
				"glass",
				"gradient",
				"darkScrim",
				"wallpaperTone"
			],
			color: [
				"accent",
				"autoAccent",
				"darkAccent"
			],
			surface: [
				"surfaceOpacity",
				"sidebarOpacity",
				"chatSurfaceOpacity",
				"inputOpacity",
				"codeBlockOpacity",
				"darkSurfaceOpacity"
			],
			typography: [
				"fontFamily",
				"codeFontFamily",
				"fontScale"
			],
			refine: [
				"cornerRadius",
				"surfaceShadow",
				"focusGlow",
				"scrollbarAccent",
				"vignette"
			]
		};
		/** Neutral (stock-look) value per group field — what 恢复本组默认 writes. */
		const GROUP_NEUTRALS = {
			background: {
				wallpaper: DEFAULTS.wallpaper,
				glass: DEFAULTS.glass,
				gradient: DEFAULTS.gradient,
				darkScrim: DEFAULTS.darkScrim,
				wallpaperTone: DEFAULTS.wallpaperTone
			},
			color: {
				accent: DEFAULTS.accent,
				autoAccent: DEFAULTS.autoAccent,
				darkAccent: DEFAULTS.darkAccent
			},
			surface: {
				surfaceOpacity: DEFAULTS.surfaceOpacity,
				sidebarOpacity: DEFAULTS.sidebarOpacity,
				chatSurfaceOpacity: DEFAULTS.chatSurfaceOpacity,
				inputOpacity: DEFAULTS.inputOpacity,
				codeBlockOpacity: DEFAULTS.codeBlockOpacity,
				darkSurfaceOpacity: 100
			},
			typography: {
				fontFamily: DEFAULTS.fontFamily,
				codeFontFamily: DEFAULTS.codeFontFamily,
				fontScale: DEFAULTS.fontScale
			},
			refine: {
				cornerRadius: DEFAULTS.cornerRadius,
				surfaceShadow: DEFAULTS.surfaceShadow,
				focusGlow: DEFAULTS.focusGlow,
				scrollbarAccent: DEFAULTS.scrollbarAccent,
				vignette: DEFAULTS.vignette
			}
		};
		/** Serialize a user preset record for the settings document. */
		const serializeMyPreset = (name, config) => JSON.stringify({
			name,
			config
		});
		/** Map a theme section to a partial config, dropping undefined fields. */
		function themeSectionToPartial(section) {
			const out = {};
			for (const field of THEME_FIELDS) {
				const value = section[field];
				if (value !== void 0) out[field] = value;
			}
			return out;
		}
		/** Parse the settings document's myPresets dict into records (lenient). */
		function parseMyPresets(raw) {
			if (typeof raw !== "object" || raw === null) return [];
			const out = [];
			for (const [id, value] of Object.entries(raw)) {
				if (typeof value !== "string") continue;
				try {
					const parsed = JSON.parse(value);
					const name = typeof parsed.name === "string" && parsed.name !== "" ? parsed.name : id;
					if (typeof parsed.config !== "object" || parsed.config === null) continue;
					out.push({
						id,
						name,
						config: parsed.config
					});
				} catch {}
			}
			return out;
		}
		const themeOf = (config) => ({
			wallpaper: config.wallpaper,
			glass: config.glass,
			accent: config.accent,
			autoAccent: config.autoAccent,
			surfaceOpacity: config.surfaceOpacity,
			sidebarOpacity: config.sidebarOpacity,
			chatSurfaceOpacity: config.chatSurfaceOpacity,
			inputOpacity: config.inputOpacity,
			codeBlockOpacity: config.codeBlockOpacity,
			darkSurfaceOpacity: config.darkSurfaceOpacity,
			gradient: config.gradient,
			darkScrim: config.darkScrim,
			fontFamily: config.fontFamily,
			codeFontFamily: config.codeFontFamily,
			fontScale: config.fontScale,
			scrollbarAccent: config.scrollbarAccent,
			vignette: config.vignette,
			cornerRadius: config.cornerRadius,
			surfaceShadow: config.surfaceShadow,
			focusGlow: config.focusGlow,
			wallpaperTone: config.wallpaperTone,
			darkAccent: config.darkAccent
		});
		/** Bridges the ui-custom settings scope onto the appearance form. */
		var AppearanceSettingsController = class {
			scope;
			defaults;
			onPreview;
			store;
			values;
			draft;
			/** Whether the user staged a field edit; the draft follows the scope until then. */
			touched = false;
			saving = false;
			previewing = false;
			/**
			* @param scope - the bound settings scope for the ui-custom namespace.
			* @param defaults - the normalized loader config (fallback for absent fields).
			* @param onPreview - applies a merged config to the document (preview/cancel).
			*/
			constructor(scope, defaults, onPreview) {
				this.scope = scope;
				this.defaults = defaults;
				this.onPreview = onPreview;
				this.values = themeOf(configFromThemeSection(defaults, scope.getSnapshot().value));
				this.draft = { ...this.values };
				this.store = (0, _deepseek_ai_dsh_client_runtime_client.createSnapshotStore)({
					status: "loading",
					writable: false,
					values: this.values,
					draft: this.draft,
					dirty: false,
					saving: false,
					previewing: false,
					myPresets: [],
					activePreset: null
				});
				this.sync();
			}
			sync() {
				const snapshot = this.scope.getSnapshot();
				const config = configFromThemeSection(this.defaults, snapshot.value);
				this.values = themeOf(config);
				if (!this.touched) this.draft = { ...this.values };
				this.previewing = false;
				previewBar.hide();
				const myPresets = parseMyPresets(snapshot.value?.myPresets);
				this.store.update((state) => {
					state.status = snapshot.status;
					state.writable = snapshot.writable;
					state.values = this.values;
					state.draft = this.draft;
					state.dirty = this.dirty();
					state.saving = this.saving;
					state.previewing = this.previewing;
					state.myPresets = myPresets;
					state.activePreset = this.recomputeActivePreset(myPresets);
				});
			}
			dirty() {
				return THEME_FIELDS.some((field) => this.draft[field] !== this.values[field]);
			}
			publish() {
				this.store.update((state) => {
					state.values = this.values;
					state.draft = this.draft;
					state.dirty = this.dirty();
					state.saving = this.saving;
					state.previewing = this.previewing;
					state.activePreset = this.recomputeActivePreset(state.myPresets);
				});
			}
			/**
			* The preset (shipped or user) whose full config the staged theme matches —
			* its card is framed in the gallery so the active theme is visible at a
			* glance. The draft is the source of truth: it mirrors the saved theme until
			* the user stages an edit, and once a preset is clicked (staged) or previewed
			* it reflects exactly the theme the user is working with / looking at.
			*/
			recomputeActivePreset(myPresets) {
				for (const preset of PRESETS) if (this.matchesPreset(preset.config)) return {
					kind: "shipped",
					id: preset.id
				};
				for (const preset of myPresets) if (this.matchesPreset(preset.config)) return {
					kind: "my",
					id: preset.id
				};
				return null;
			}
			/** True when every theme field of the staged draft equals the preset's. */
			matchesPreset(config) {
				const presetSection = themeOf(normalizeConfig(void 0, config));
				return THEME_FIELDS.every((field) => presetSection[field] === this.draft[field]);
			}
			/** Render a theme section to the document via the injected applier. */
			applyTheme(section) {
				this.onPreview(configFromThemeSection(this.defaults, section));
			}
			/** Stage one field edit (re-applies the live preview when already previewing). */
			setField(field, value) {
				this.touched = true;
				this.draft = {
					...this.draft,
					[field]: value
				};
				if (this.previewing) this.applyTheme(this.draft);
				this.publish();
			}
			/** Render the staged draft to the document WITHOUT saving (the scope is untouched). */
			preview() {
				if (!this.dirty()) return;
				this.previewing = true;
				previewBar.show();
				this.applyTheme(this.draft);
				this.publish();
			}
			/**
			* Load a preset config into the draft — staging only, no preview. Shipped
			* presets are pure color-gradient themes and ship no wallpaper — the
			* gradient IS the background, so loading one clears the wallpaper instead
			* of letting it dilute the gradient (the saved wallpaper is untouched;
			* cancelPreview restores it, and the 壁纸 field re-adds it). The user then
			* enters the preview through the shared 预览 button, exactly like any
			* manual edit — one unified preview path.
			* @param config - the preset's partial config.
			*/
			loadPresetConfig(config) {
				const presetTheme = themeOf(configFromThemeSection(this.defaults, config));
				const wallpaper = typeof config.wallpaper === "string" && config.wallpaper !== "" ? config.wallpaper : "";
				this.touched = true;
				this.draft = {
					...presetTheme,
					wallpaper
				};
				this.previewing = false;
				this.publish();
			}
			/** Load a shipped preset into the draft (staging only — the 预览 button previews). */
			applyPreset(id) {
				const preset = PRESET_MAP.get(id)?.config;
				if (preset === void 0) return;
				this.loadPresetConfig(preset);
			}
			/** Save the current draft as a user preset (name shown in the gallery). */
			async saveMyPreset(name) {
				const clean = name.trim();
				if (clean === "") return;
				const record = serializeMyPreset(clean, themeSectionToPartial(this.draft));
				const current = this.scope.getSnapshot().value?.myPresets ?? {};
				const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
				await this.scope.set("myPresets", {
					...current,
					[id]: record
				});
				this.sync();
			}
			/** Remove one user preset. */
			async removeMyPreset(id) {
				const current = this.scope.getSnapshot().value?.myPresets ?? {};
				if (!(id in current)) return;
				const next = { ...current };
				delete next[id];
				if (Object.keys(next).length === 0) await this.scope.unset("myPresets");
				else await this.scope.set("myPresets", next);
				this.sync();
			}
			/** Load a user preset into the draft (staging only — the 预览 button previews). */
			applyMyPreset(id) {
				const preset = this.store.getSnapshot().myPresets.find((entry) => entry.id === id);
				if (preset === void 0) return;
				this.loadPresetConfig(preset.config);
			}
			/** Load a font pairing (ui + code stacks) into the draft. */
			applyFontPreset(id) {
				const fields = resolveFontPreset(id);
				this.touched = true;
				this.draft = {
					...this.draft,
					fontFamily: fields.fontFamily,
					codeFontFamily: fields.codeFontFamily
				};
				if (this.previewing) this.applyTheme(this.draft);
				this.publish();
			}
			/** Generate a harmonious random theme from the palette algorithm (staged). */
			randomInspiration() {
				this.loadPresetConfig(randomInspirationConfig());
			}
			/** Reset one parameter group to the neutral (stock) defaults. */
			resetGroup(group) {
				const neutral = GROUP_NEUTRALS[group];
				let next = this.draft;
				for (const field of GROUP_FIELDS[group]) next = {
					...next,
					[field]: neutral[field]
				};
				this.touched = true;
				this.draft = next;
				if (this.previewing) this.applyTheme(this.draft);
				this.publish();
			}
			/** Revert the document to the saved theme (leaves the staged draft for further edits). */
			cancelPreview() {
				if (!this.previewing) return;
				this.previewing = false;
				previewBar.hide();
				this.applyTheme(this.values);
				this.publish();
			}
			/** Restore every field to the loader defaults (unsets the user overrides). */
			async resetAll() {
				if (this.saving) return;
				this.saving = true;
				this.publish();
				try {
					for (const field of THEME_FIELDS) await this.scope.unset(field);
				} finally {
					this.saving = false;
					this.touched = false;
					this.sync();
				}
			}
			/** Write every changed field through the scope (live re-apply on publish). */
			async save() {
				if (!this.dirty() || this.saving) return;
				this.saving = true;
				this.publish();
				try {
					for (const field of THEME_FIELDS) {
						const next = this.draft[field];
						if (next === this.values[field]) continue;
						await this.scope.set(field, next);
					}
				} finally {
					this.saving = false;
					this.touched = false;
					this.sync();
				}
			}
			/** Wire the controller: subscribe the scope and expose the form actions. */
			mount() {
				return {
					dispose: this.scope.subscribe(() => this.sync()),
					actions: {
						setField: (field, value) => this.setField(field, value),
						applyFontPreset: (id) => this.applyFontPreset(id),
						randomInspiration: () => this.randomInspiration(),
						resetGroup: (group) => this.resetGroup(group),
						preview: () => this.preview(),
						applyPreset: (id) => this.applyPreset(id),
						saveMyPreset: (name) => {
							this.saveMyPreset(name);
						},
						removeMyPreset: (id) => {
							this.removeMyPreset(id);
						},
						applyMyPreset: (id) => this.applyMyPreset(id),
						cancelPreview: () => this.cancelPreview(),
						save: () => {
							this.save();
						},
						resetAll: () => {
							this.resetAll();
						}
					}
				};
			}
		};
		//#endregion
		//#region \0dsh-css:D:\ZcodeWorkspace\.zcode\workspace\default\deepseek-harness\packages\client\ui-custom\src\client\appearance\AppearancePreview.module.css.mjs
		const css$12 = ".JOqIcG_mock{--pv-base:var(--dsw-static-neutral-bluish-00);border:1px solid var(--dsw-alias-border-l2);background-color:color-mix(in srgb, var(--pv-base) 60%, transparent);background-position:50%;background-size:cover;border-radius:12px;height:128px;position:relative;overflow:hidden}body[data-ds-dark-theme] .JOqIcG_mock{--pv-base:var(--dsw-static-neutral-bluish-950)}.JOqIcG_scrim{background:rgb(15 17 21/var(--pv-scrim,22%));display:none;position:absolute;inset:0}body[data-ds-dark-theme] .JOqIcG_scrim{display:block}.JOqIcG_window{line-height:1.4;font-family:var(--dsw-font-family,system-ui, sans-serif);display:flex;position:absolute;inset:0}.JOqIcG_sidebar{border-right:1px solid color-mix(in srgb, var(--dsw-alias-border-l2) 60%, transparent);flex-direction:column;flex:none;gap:5px;width:22%;padding:8px 7px;display:flex}.JOqIcG_navDot{border-radius:50%;width:10px;height:10px;margin-bottom:2px}.JOqIcG_line{background:color-mix(in srgb, var(--dsw-alias-label-tertiary) 55%, transparent);border-radius:2px;height:3px}.JOqIcG_navActive{opacity:.85;border-radius:3px;height:10px}.JOqIcG_main{flex-direction:column;flex:auto;gap:6px;min-width:0;padding:8px;display:flex}.JOqIcG_topbar{justify-content:space-between;align-items:center;gap:6px;display:flex}.JOqIcG_title{color:var(--dsw-alias-label-primary);white-space:nowrap;text-overflow:ellipsis;font-weight:600;overflow:hidden}.JOqIcG_badge{border-radius:999px;flex:none;padding:1px 6px;font-size:.8em;font-weight:600}.JOqIcG_chat{border:1px solid color-mix(in srgb, var(--dsw-alias-border-l2) 55%, transparent);border-radius:8px;flex-direction:column;flex:auto;gap:5px;min-height:0;padding:6px;display:flex}.JOqIcG_bubbleLeft{background:color-mix(in srgb, var(--dsw-alias-label-tertiary) 32%, transparent);border-radius:4px;width:78%;height:7px}.JOqIcG_bubbleRight{opacity:.85;border:1px solid;border-radius:4px;align-self:flex-end;width:55%;height:7px}.JOqIcG_inputRow{align-items:center;gap:6px;display:flex}.JOqIcG_inputField{border:1px solid color-mix(in srgb, var(--dsw-alias-border-l2) 60%, transparent);border-radius:5px;flex:auto;height:14px}.JOqIcG_send{border-radius:50%;flex:none;width:14px;height:14px}";
		const tagId$12 = "@deepseek-ai/dsh-client-ui-custom/AppearancePreview.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$12) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-custom";
			tag.dataset.pluginCss = tagId$12;
			tag.textContent = css$12;
			document.head.appendChild(tag);
		}
		var AppearancePreview_module_css_default = {
			"inputField": "JOqIcG_inputField",
			"topbar": "JOqIcG_topbar",
			"mock": "JOqIcG_mock",
			"line": "JOqIcG_line",
			"bubbleLeft": "JOqIcG_bubbleLeft",
			"badge": "JOqIcG_badge",
			"sidebar": "JOqIcG_sidebar",
			"navDot": "JOqIcG_navDot",
			"main": "JOqIcG_main",
			"window": "JOqIcG_window",
			"chat": "JOqIcG_chat",
			"bubbleRight": "JOqIcG_bubbleRight",
			"inputRow": "JOqIcG_inputRow",
			"navActive": "JOqIcG_navActive",
			"title": "JOqIcG_title",
			"send": "JOqIcG_send",
			"scrim": "JOqIcG_scrim"
		};
		//#endregion
		//#region src/client/appearance/AppearancePreview.tsx
		const cleanString$1 = (value, fallback) => typeof value === "string" && value !== "" ? value : fallback;
		const toNumber = (value, fallback) => typeof value === "number" ? value : fallback;
		/** Mini interface mock reflecting the staged draft. */
		function AppearancePreview({ draft }) {
			const accent = cleanString$1(draft.accent, "#4176e6");
			const gradient = cleanString$1(draft.gradient, "");
			const wallpaper = cleanString$1(draft.wallpaper, "");
			const fontFamily = cleanString$1(draft.fontFamily, "");
			const codeFont = cleanString$1(draft.codeFontFamily, "");
			const scale = toNumber(draft.fontScale, 1);
			const scrim = toNumber(draft.darkScrim, 0);
			const px = (n) => `${Math.round(n * scale)}px`;
			const layers = [];
			if (gradient !== "") layers.push(gradient);
			if (wallpaper !== "") layers.push(`url("${wallpaper.replaceAll("\"", "\\\"")}")`);
			const backgroundImage = layers.length > 0 ? layers.join(", ") : void 0;
			const alpha = (value, fallback) => {
				const n = toNumber(value, fallback);
				return `color-mix(in srgb, var(--pv-base) ${Math.max(4, Math.min(100, n))}%, transparent)`;
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: AppearancePreview_module_css_default.mock,
				style: {
					["--pv-accent"]: accent,
					["--pv-scrim"]: `${scrim}%`,
					["--pv-surface"]: alpha(draft.surfaceOpacity, 100),
					["--pv-chat"]: alpha(draft.chatSurfaceOpacity, 100),
					["--pv-input"]: alpha(draft.inputOpacity, 100),
					["--pv-sidebar"]: alpha(draft.sidebarOpacity, 100),
					backgroundImage,
					fontFamily: fontFamily !== "" ? fontFamily : void 0
				},
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: AppearancePreview_module_css_default.scrim }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: AppearancePreview_module_css_default.window,
					style: { fontSize: px(10) },
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: AppearancePreview_module_css_default.sidebar,
						style: { background: "var(--pv-sidebar)" },
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: AppearancePreview_module_css_default.navDot,
								style: { background: accent }
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: AppearancePreview_module_css_default.line }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: AppearancePreview_module_css_default.line,
								style: { width: "70%" }
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: AppearancePreview_module_css_default.navActive,
								style: { background: accent }
							})
						]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: AppearancePreview_module_css_default.main,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: AppearancePreview_module_css_default.topbar,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: AppearancePreview_module_css_default.title,
									style: { fontFamily: codeFont !== "" ? codeFont : void 0 },
									children: "ui-custom"
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: AppearancePreview_module_css_default.badge,
									style: {
										background: accent,
										color: "#fff"
									},
									children: "预览"
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: AppearancePreview_module_css_default.chat,
								style: { background: "var(--pv-chat)" },
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: AppearancePreview_module_css_default.bubbleLeft }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: AppearancePreview_module_css_default.bubbleRight,
										style: { borderColor: accent }
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: AppearancePreview_module_css_default.bubbleLeft,
										style: { width: "62%" }
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: AppearancePreview_module_css_default.inputRow,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: AppearancePreview_module_css_default.inputField,
									style: { background: "var(--pv-input)" }
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: AppearancePreview_module_css_default.send,
									style: { background: accent }
								})]
							})
						]
					})]
				})]
			});
		}
		//#endregion
		//#region \0dsh-css:D:\ZcodeWorkspace\.zcode\workspace\default\deepseek-harness\packages\client\ui-custom\src\client\appearance\AppearanceSection.module.css.mjs
		const css$11 = ".JFmL8G_section{flex-direction:column;gap:14px;display:flex}.JFmL8G_heading{margin:0;font-size:16px;font-weight:600;line-height:24px}.JFmL8G_intro{color:var(--dsw-alias-label-secondary);margin:0;font-size:13px;line-height:20px}.JFmL8G_preference{border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb, var(--dsw-alias-bg-base) 78%, transparent);border-radius:12px;padding:12px 14px}.JFmL8G_card{border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb, var(--dsw-alias-bg-base) 78%, transparent);border-radius:12px;flex-direction:column;gap:12px;padding:14px;display:flex}.JFmL8G_row{grid-template-columns:150px 1fr;align-items:center;gap:10px;display:grid}.JFmL8G_groupHeader{justify-content:space-between;align-items:center;gap:10px;display:flex}.JFmL8G_groupReset{border:1px solid var(--dsw-alias-border-l2);height:24px;color:var(--dsw-alias-label-secondary);white-space:nowrap;cursor:pointer;background:0 0;border-radius:6px;flex:none;padding:0 10px;font-size:11px;line-height:22px;transition:border-color .12s,color .12s}.JFmL8G_groupReset:hover:not(:disabled){border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}.JFmL8G_groupReset:disabled{cursor:default;opacity:.5}.JFmL8G_inspire{border:1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 45%, transparent);background:color-mix(in srgb, var(--dsw-alias-brand-primary) 10%, transparent);height:24px;color:var(--dsw-alias-brand-primary);white-space:nowrap;cursor:pointer;border-radius:999px;flex:none;padding:0 12px;font-size:11px;line-height:22px;transition:background .12s}.JFmL8G_inspire:hover:not(:disabled){background:color-mix(in srgb, var(--dsw-alias-brand-primary) 18%, transparent)}.JFmL8G_inspire:disabled{cursor:default;opacity:.5}.JFmL8G_label{color:var(--dsw-alias-label-primary);font-size:13px;line-height:20px}.JFmL8G_hint{color:var(--dsw-alias-label-tertiary);grid-column:2;margin:-4px 0 0;font-size:11px;line-height:16px}.JFmL8G_slider{align-items:center;gap:10px;display:flex}.JFmL8G_text{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-specific-input-major);height:30px;color:var(--dsw-alias-label-primary);font-size:13px;line-height:30px;font-family:var(--dsw-font-family,system-ui, sans-serif);border-radius:6px;padding:0 10px}.JFmL8G_select{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-specific-input-major);height:30px;color:var(--dsw-alias-label-primary);border-radius:6px;padding:0 8px;font-size:13px}.JFmL8G_color{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);cursor:pointer;background:0 0;border-radius:6px;width:40px;height:30px;padding:0}.JFmL8G_color::-webkit-color-swatch-wrapper{padding:0}.JFmL8G_color::-webkit-color-swatch{border:none}.JFmL8G_range{-webkit-appearance:none;appearance:none;cursor:pointer;background:0 0;flex:auto;min-width:0;height:16px}.JFmL8G_range::-webkit-slider-runnable-track{background:linear-gradient(to right, var(--dsw-alias-brand-primary) var(--fill,0%), var(--dsw-static-neutral-bluish-300) var(--fill,0%));border-radius:999px;height:4px;box-shadow:inset 0 0 0 1px #0f11150d}.JFmL8G_range::-webkit-slider-thumb{-webkit-appearance:none;background:var(--dsw-alias-brand-primary);border:2px solid #fff;border-radius:50%;width:14px;height:14px;margin-top:-5px;transition:transform .12s,box-shadow .12s;box-shadow:0 1px 3px #00000047}.JFmL8G_range:hover::-webkit-slider-thumb,.JFmL8G_range:focus-visible::-webkit-slider-thumb{box-shadow:0 0 0 3px color-mix(in srgb, var(--dsw-alias-brand-primary) 22%, transparent), 0 1px 4px #0000004d;transform:scale(1.18)}.JFmL8G_range::-moz-range-track{background:var(--dsw-static-neutral-bluish-300);border-radius:999px;height:4px}.JFmL8G_range::-moz-range-progress{background:var(--dsw-alias-brand-primary);border-radius:999px;height:4px}.JFmL8G_range::-moz-range-thumb{background:var(--dsw-alias-brand-primary);border:2px solid #fff;border-radius:50%;width:12px;height:12px;box-shadow:0 1px 3px #00000047}body[data-ds-dark-theme] .JFmL8G_range::-webkit-slider-runnable-track{background:linear-gradient(to right, var(--dsw-alias-brand-primary) var(--fill,0%), #ffffff3d var(--fill,0%));box-shadow:none}body[data-ds-dark-theme] .JFmL8G_range::-moz-range-track{background:#ffffff3d}body[data-ds-dark-theme] .JFmL8G_range::-webkit-slider-thumb,body[data-ds-dark-theme] .JFmL8G_range::-moz-range-thumb{box-shadow:0 0 6px color-mix(in srgb, var(--dsw-alias-brand-primary) 55%, transparent), 0 1px 3px #0006;border-color:#ffffffe6}.JFmL8G_rangeValue{text-align:right;width:44px;color:var(--dsw-alias-label-secondary);flex:none;font-size:12px}.JFmL8G_check{align-items:center;gap:8px;display:flex}.JFmL8G_checkbox{accent-color:var(--dsw-alias-brand-primary)}.JFmL8G_footer{justify-content:flex-end;align-items:center;gap:12px;display:flex}.JFmL8G_dirty{color:var(--dsw-alias-state-warn-primary);font-size:12px;line-height:18px}.JFmL8G_save{background:var(--dsw-alias-button-primary-fill);height:30px;color:var(--dsw-alias-label-primary-foreground);white-space:nowrap;cursor:pointer;border:none;border-radius:6px;flex:none;padding:0 14px;font-size:13px;line-height:30px}.JFmL8G_save:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover)}.JFmL8G_save:disabled{cursor:default;opacity:.5}.JFmL8G_reset{height:28px;color:var(--dsw-alias-label-secondary);white-space:nowrap;cursor:pointer;background:0 0;border:none;border-radius:6px;flex:none;padding:0 10px;font-size:12px;line-height:28px}.JFmL8G_reset:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}.JFmL8G_reset:disabled{cursor:default;opacity:.5}.JFmL8G_cardTitle{color:var(--dsw-alias-label-primary);margin:0 0 2px;font-size:14px;font-weight:600;line-height:22px}.JFmL8G_presetGrid{grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-top:10px;display:grid}.JFmL8G_presetCard{border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb, var(--dsw-alias-bg-base) 55%, transparent);cursor:pointer;text-align:left;border-radius:10px;flex-direction:column;align-items:stretch;gap:4px;padding:0;transition:transform .12s,border-color .12s,box-shadow .12s;display:flex;position:relative;overflow:hidden}.JFmL8G_presetCard:hover:not(:disabled){border-color:var(--dsw-alias-border-l3,var(--dsw-alias-border-l2));transform:translateY(-2px);box-shadow:0 6px 18px #0000002e}.JFmL8G_presetCardActive,.JFmL8G_presetCardActive:hover:not(:disabled){border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 1px var(--dsw-alias-brand-primary), 0 6px 18px color-mix(in srgb, var(--dsw-alias-brand-primary) 22%, transparent);transform:none}.JFmL8G_presetBadge{background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-foreground);pointer-events:none;z-index:1;border-radius:999px;padding:1px 8px;font-size:10px;font-weight:600;line-height:16px;position:absolute;top:6px;left:6px}.JFmL8G_presetCard:disabled{cursor:default;opacity:.6}.JFmL8G_presetPreview{flex:none;height:52px;display:block}.JFmL8G_presetName{color:var(--dsw-alias-label-primary);padding:0 10px;font-size:12px;font-weight:600;line-height:18px}.JFmL8G_presetDesc{color:var(--dsw-alias-label-tertiary);padding:0 10px 8px;font-size:11px;line-height:16px}.JFmL8G_presetSaveRow{align-items:center;gap:8px;margin-top:12px;display:flex}.JFmL8G_presetNameInput{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-specific-input-major);min-width:0;height:28px;color:var(--dsw-alias-label-primary);border-radius:6px;flex:auto;padding:0 10px;font-size:12px;line-height:28px}.JFmL8G_presetSave{background:var(--dsw-alias-button-primary-fill);height:28px;color:var(--dsw-alias-label-primary-foreground);white-space:nowrap;cursor:pointer;border:none;border-radius:6px;flex:none;padding:0 12px;font-size:12px;line-height:28px}.JFmL8G_presetSave:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover)}.JFmL8G_presetSave:disabled{cursor:default;opacity:.5}.JFmL8G_presetRemove{background:color-mix(in srgb, var(--dsw-alias-bg-overlay) 85%, transparent);width:20px;height:20px;color:var(--dsw-alias-label-secondary);cursor:pointer;opacity:0;border:none;border-radius:50%;padding:0;font-size:11px;line-height:20px;transition:opacity .12s;position:absolute;top:6px;right:6px}.JFmL8G_presetCard:hover .JFmL8G_presetRemove,.JFmL8G_presetCard:focus-within .JFmL8G_presetRemove{opacity:1}.JFmL8G_presetRemove:hover{color:var(--dsw-alias-label-primary)}.JFmL8G_swatches{flex-wrap:wrap;align-items:center;gap:8px;display:flex}.JFmL8G_swatch{border:1px solid var(--dsw-alias-border-l2);cursor:pointer;border-radius:50%;width:24px;height:24px;padding:0;transition:transform .12s,box-shadow .12s}.JFmL8G_swatch:hover:not(:disabled){box-shadow:0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary) 35%, transparent);transform:scale(1.15)}.JFmL8G_swatch:disabled{cursor:default;opacity:.6}.JFmL8G_previewing{color:var(--dsw-alias-state-success-primary);font-size:12px;line-height:18px}.JFmL8G_preview{border:1px solid var(--dsw-alias-border-l2);height:30px;color:var(--dsw-alias-label-secondary);white-space:nowrap;cursor:pointer;background:0 0;border-radius:6px;flex:none;padding:0 14px;font-size:13px;line-height:28px}.JFmL8G_preview:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}.JFmL8G_preview:disabled{cursor:default;opacity:.5}.JFmL8G_cancel{border:1px solid var(--dsw-alias-state-warn-primary);height:30px;color:var(--dsw-alias-state-warn-primary);white-space:nowrap;cursor:pointer;background:0 0;border-radius:6px;flex:none;padding:0 14px;font-size:13px;line-height:28px}.JFmL8G_cancel:hover:not(:disabled){background:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 10%, transparent)}.JFmL8G_cancel:disabled{cursor:default;opacity:.5}";
		const tagId$11 = "@deepseek-ai/dsh-client-ui-custom/AppearanceSection.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$11) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-custom";
			tag.dataset.pluginCss = tagId$11;
			tag.textContent = css$11;
			document.head.appendChild(tag);
		}
		var AppearanceSection_module_css_default = {
			"preference": "JFmL8G_preference",
			"groupReset": "JFmL8G_groupReset",
			"slider": "JFmL8G_slider",
			"color": "JFmL8G_color",
			"card": "JFmL8G_card",
			"save": "JFmL8G_save",
			"reset": "JFmL8G_reset",
			"cardTitle": "JFmL8G_cardTitle",
			"presetGrid": "JFmL8G_presetGrid",
			"presetRemove": "JFmL8G_presetRemove",
			"cancel": "JFmL8G_cancel",
			"presetCard": "JFmL8G_presetCard",
			"label": "JFmL8G_label",
			"check": "JFmL8G_check",
			"presetSaveRow": "JFmL8G_presetSaveRow",
			"range": "JFmL8G_range",
			"presetName": "JFmL8G_presetName",
			"preview": "JFmL8G_preview",
			"previewing": "JFmL8G_previewing",
			"checkbox": "JFmL8G_checkbox",
			"presetDesc": "JFmL8G_presetDesc",
			"hint": "JFmL8G_hint",
			"swatches": "JFmL8G_swatches",
			"presetNameInput": "JFmL8G_presetNameInput",
			"intro": "JFmL8G_intro",
			"dirty": "JFmL8G_dirty",
			"rangeValue": "JFmL8G_rangeValue",
			"groupHeader": "JFmL8G_groupHeader",
			"row": "JFmL8G_row",
			"swatch": "JFmL8G_swatch",
			"presetCardActive": "JFmL8G_presetCardActive",
			"select": "JFmL8G_select",
			"presetBadge": "JFmL8G_presetBadge",
			"inspire": "JFmL8G_inspire",
			"presetPreview": "JFmL8G_presetPreview",
			"presetSave": "JFmL8G_presetSave",
			"heading": "JFmL8G_heading",
			"section": "JFmL8G_section",
			"text": "JFmL8G_text",
			"footer": "JFmL8G_footer"
		};
		//#endregion
		//#region src/client/appearance/AppearanceSection.tsx
		/** The 外观 settings section: theme preference (merged) + art customization form. */
		const GLASS_OPTIONS = [
			{
				id: "off",
				label: "glass.off"
			},
			{
				id: "light",
				label: "glass.light"
			},
			{
				id: "frosted",
				label: "glass.frosted"
			},
			{
				id: "mica",
				label: "glass.mica"
			}
		];
		const SLIDERS = [
			{
				field: "surfaceOpacity",
				label: "surfaceOpacity"
			},
			{
				field: "sidebarOpacity",
				label: "sidebarOpacity"
			},
			{
				field: "chatSurfaceOpacity",
				label: "chatSurfaceOpacity"
			},
			{
				field: "inputOpacity",
				label: "inputOpacity"
			},
			{
				field: "codeBlockOpacity",
				label: "codeBlockOpacity"
			},
			{
				field: "darkSurfaceOpacity",
				label: "darkSurfaceOpacity"
			}
		];
		const CORNER_RADIUS_OPTIONS = [
			{
				id: "inherit",
				label: "radius.inherit"
			},
			{
				id: "sm",
				label: "radius.sm"
			},
			{
				id: "md",
				label: "radius.md"
			},
			{
				id: "lg",
				label: "radius.lg"
			},
			{
				id: "xl",
				label: "radius.xl"
			}
		];
		const SHADOW_OPTIONS = [
			{
				id: "inherit",
				label: "shadow.inherit"
			},
			{
				id: "none",
				label: "shadow.none"
			},
			{
				id: "soft",
				label: "shadow.soft"
			},
			{
				id: "medium",
				label: "shadow.medium"
			},
			{
				id: "strong",
				label: "shadow.strong"
			}
		];
		const TONE_OPTIONS = [
			{
				id: "inherit",
				label: "tone.inherit"
			},
			{
				id: "soft",
				label: "tone.soft"
			},
			{
				id: "dim",
				label: "tone.dim"
			},
			{
				id: "bright",
				label: "tone.bright"
			}
		];
		/** Mini color preview for a preset (accent-graded wash; gradient when shipped). */
		const presetPreviewBackground = (config) => {
			const accent = typeof config.accent === "string" && config.accent !== "" ? config.accent : "#4176e6";
			if (typeof config.gradient === "string" && config.gradient !== "") return config.gradient;
			return `linear-gradient(135deg, ${accent}, ${accent}55)`;
		};
		/** One parameter-group card with a "恢复本组默认" action. */
		function GroupCard({ title, resetLabel, group, writable, onReset, children }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: AppearanceSection_module_css_default.card,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: AppearanceSection_module_css_default.groupHeader,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
						className: AppearanceSection_module_css_default.cardTitle,
						children: title
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: AppearanceSection_module_css_default.groupReset,
						disabled: !writable,
						onClick: () => onReset(group),
						children: resetLabel
					})]
				}), children]
			});
		}
		/**
		* Render the appearance section content.
		* @param props - composed slot props + injected controller face.
		* @returns the section element tree.
		*/
		function AppearanceSection({ t, useAppearance, setField, applyFontPreset, randomInspiration, resetGroup, preview, applyPreset, saveMyPreset, removeMyPreset, applyMyPreset, cancelPreview, save, resetAll, renderSlot, close }) {
			const state = useAppearance((value) => value);
			const translator = t;
			const draft = state.draft;
			const [presetName, setPresetName] = (0, react.useState)("");
			const num = (field, fallback) => typeof draft[field] === "number" ? draft[field] : fallback;
			const str = (field, fallback) => typeof draft[field] === "string" ? draft[field] : fallback;
			const bool = (field, fallback) => typeof draft[field] === "boolean" ? draft[field] : fallback;
			const accent = str("accent", "#4176e6");
			const swatches = (0, react.useMemo)(() => harmonySwatches(accent), [accent]);
			const handlePreset = (id) => {
				applyPreset(id);
			};
			const handleMyPreset = (id) => {
				applyMyPreset(id);
			};
			const handleSaveMyPreset = () => {
				saveMyPreset(presetName);
				setPresetName("");
			};
			const handlePreview = () => {
				preview();
				close();
			};
			const fontPresetId = FONT_PRESETS.find((preset) => preset.uiFont === str("fontFamily", "") && preset.codeFont === str("codeFontFamily", ""))?.id ?? "__custom__";
			if (state.status === "unavailable") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: AppearanceSection_module_css_default.section,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
						className: AppearanceSection_module_css_default.heading,
						children: translator("title")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: AppearanceSection_module_css_default.intro,
						children: translator("unavailable")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: AppearanceSection_module_css_default.hint,
						children: translator("unavailableHint")
					})
				]
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: AppearanceSection_module_css_default.section,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
						className: AppearanceSection_module_css_default.heading,
						children: translator("title")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: AppearanceSection_module_css_default.intro,
						children: translator("intro")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: AppearanceSection_module_css_default.preference,
						children: renderSlot("settings.appearance.item", {})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: AppearanceSection_module_css_default.card,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: AppearanceSection_module_css_default.groupHeader,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
									className: AppearanceSection_module_css_default.cardTitle,
									children: translator("previewTitle")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: AppearanceSection_module_css_default.inspire,
									disabled: !state.writable,
									onClick: randomInspiration,
									children: translator("randomInspiration")
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(AppearancePreview, { draft }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: AppearanceSection_module_css_default.hint,
								children: translator("previewHint")
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: AppearanceSection_module_css_default.card,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
								className: AppearanceSection_module_css_default.cardTitle,
								children: translator("presetTitle")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: AppearanceSection_module_css_default.hint,
								children: translator("presetHint")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: AppearanceSection_module_css_default.presetGrid,
								children: PRESETS.map((preset) => {
									const active = state.activePreset?.kind === "shipped" && state.activePreset.id === preset.id;
									return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: `${AppearanceSection_module_css_default.presetCard}${active ? ` ${AppearanceSection_module_css_default.presetCardActive}` : ""}`,
										disabled: !state.writable,
										onClick: () => handlePreset(preset.id),
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: AppearanceSection_module_css_default.presetPreview,
												style: { background: presetPreviewBackground(preset.config) }
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: AppearanceSection_module_css_default.presetName,
												children: preset.name
											}),
											active ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: AppearanceSection_module_css_default.presetBadge,
												children: translator("activePreset")
											}) : null,
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: AppearanceSection_module_css_default.presetDesc,
												children: preset.description
											})
										]
									}, preset.id);
								})
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: AppearanceSection_module_css_default.presetSaveRow,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									className: AppearanceSection_module_css_default.presetNameInput,
									type: "text",
									value: presetName,
									placeholder: translator("myPresetName"),
									disabled: !state.writable,
									onChange: (event) => setPresetName(event.target.value),
									onKeyDown: (event) => {
										if (event.key === "Enter") handleSaveMyPreset();
									}
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: AppearanceSection_module_css_default.presetSave,
									disabled: !state.writable || presetName.trim() === "",
									onClick: handleSaveMyPreset,
									children: translator("saveMyPreset")
								})]
							}),
							state.myPresets.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: AppearanceSection_module_css_default.presetGrid,
								children: state.myPresets.map((preset) => {
									const active = state.activePreset?.kind === "my" && state.activePreset.id === preset.id;
									return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: `${AppearanceSection_module_css_default.presetCard}${active ? ` ${AppearanceSection_module_css_default.presetCardActive}` : ""}`,
										role: "button",
										tabIndex: 0,
										onClick: () => handleMyPreset(preset.id),
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: AppearanceSection_module_css_default.presetPreview,
												style: { background: presetPreviewBackground(preset.config) }
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: AppearanceSection_module_css_default.presetName,
												children: preset.name
											}),
											active ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: AppearanceSection_module_css_default.presetBadge,
												children: translator("activePreset")
											}) : null,
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: AppearanceSection_module_css_default.presetRemove,
												"aria-label": translator("removeMyPreset"),
												onClick: (event) => {
													event.stopPropagation();
													removeMyPreset(preset.id);
												},
												children: "✕"
											})
										]
									}, preset.id);
								})
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(GroupCard, {
						title: translator("groupBackground"),
						resetLabel: translator("groupReset"),
						group: "background",
						writable: state.writable,
						onReset: resetGroup,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: AppearanceSection_module_css_default.row,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
										className: AppearanceSection_module_css_default.label,
										htmlFor: "appearance-wallpaper",
										children: translator("wallpaper")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										id: "appearance-wallpaper",
										className: AppearanceSection_module_css_default.text,
										type: "text",
										value: str("wallpaper", ""),
										disabled: !state.writable,
										onChange: (event) => setField("wallpaper", event.target.value)
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: AppearanceSection_module_css_default.hint,
										children: translator("wallpaperHint")
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: AppearanceSection_module_css_default.row,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
									className: AppearanceSection_module_css_default.label,
									htmlFor: "appearance-glass",
									children: translator("glass")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
									id: "appearance-glass",
									className: AppearanceSection_module_css_default.select,
									value: str("glass", "frosted"),
									disabled: !state.writable,
									onChange: (event) => setField("glass", event.target.value),
									children: GLASS_OPTIONS.map((option) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: option.id,
										children: translator(option.label)
									}, option.id))
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: AppearanceSection_module_css_default.row,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
										className: AppearanceSection_module_css_default.label,
										htmlFor: "appearance-gradient",
										children: translator("gradient")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										id: "appearance-gradient",
										className: AppearanceSection_module_css_default.text,
										type: "text",
										value: str("gradient", ""),
										disabled: !state.writable,
										onChange: (event) => setField("gradient", event.target.value)
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: AppearanceSection_module_css_default.hint,
										children: translator("gradientHint")
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: AppearanceSection_module_css_default.row,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
									className: AppearanceSection_module_css_default.label,
									htmlFor: "appearance-darkScrim",
									children: translator("darkScrim")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: AppearanceSection_module_css_default.slider,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										id: "appearance-darkScrim",
										className: AppearanceSection_module_css_default.range,
										type: "range",
										min: 0,
										max: 100,
										value: num("darkScrim", 0),
										style: { ["--fill"]: `${num("darkScrim", 0)}%` },
										disabled: !state.writable,
										onChange: (event) => setField("darkScrim", Number(event.target.value))
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: AppearanceSection_module_css_default.rangeValue,
										children: [num("darkScrim", 0), "%"]
									})]
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: AppearanceSection_module_css_default.row,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
									className: AppearanceSection_module_css_default.label,
									htmlFor: "appearance-wallpaperTone",
									children: translator("wallpaperTone")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
									id: "appearance-wallpaperTone",
									className: AppearanceSection_module_css_default.select,
									value: str("wallpaperTone", "inherit"),
									disabled: !state.writable,
									onChange: (event) => setField("wallpaperTone", event.target.value),
									children: TONE_OPTIONS.map((option) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: option.id,
										children: translator(option.label)
									}, option.id))
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(GroupCard, {
						title: translator("groupColor"),
						resetLabel: translator("groupReset"),
						group: "color",
						writable: state.writable,
						onReset: resetGroup,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: AppearanceSection_module_css_default.row,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
									className: AppearanceSection_module_css_default.label,
									htmlFor: "appearance-accent",
									children: translator("accent")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: AppearanceSection_module_css_default.slider,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										id: "appearance-accent",
										className: AppearanceSection_module_css_default.color,
										type: "color",
										value: accent,
										disabled: !state.writable,
										onChange: (event) => setField("accent", event.target.value)
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										className: AppearanceSection_module_css_default.text,
										type: "text",
										value: accent,
										disabled: !state.writable,
										onChange: (event) => setField("accent", event.target.value)
									})]
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: AppearanceSection_module_css_default.row,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
										className: AppearanceSection_module_css_default.label,
										children: translator("accentPalette")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: AppearanceSection_module_css_default.swatches,
										children: swatches.map((color) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: AppearanceSection_module_css_default.swatch,
											style: { background: color },
											title: color,
											"aria-label": color,
											disabled: !state.writable,
											onClick: () => setField("accent", color)
										}, color))
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: AppearanceSection_module_css_default.hint,
										children: translator("accentPaletteHint")
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: AppearanceSection_module_css_default.row,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
									className: AppearanceSection_module_css_default.label,
									htmlFor: "appearance-autoAccent",
									children: translator("autoAccent")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: AppearanceSection_module_css_default.check,
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										id: "appearance-autoAccent",
										className: AppearanceSection_module_css_default.checkbox,
										type: "checkbox",
										checked: bool("autoAccent", false),
										disabled: !state.writable,
										onChange: (event) => setField("autoAccent", event.target.checked)
									})
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: AppearanceSection_module_css_default.row,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
										className: AppearanceSection_module_css_default.label,
										htmlFor: "appearance-darkAccent",
										children: translator("darkAccent")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: AppearanceSection_module_css_default.slider,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											id: "appearance-darkAccent",
											className: AppearanceSection_module_css_default.color,
											type: "color",
											value: str("darkAccent", "") || "#4176e6",
											disabled: !state.writable,
											onChange: (event) => setField("darkAccent", event.target.value)
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											className: AppearanceSection_module_css_default.text,
											type: "text",
											value: str("darkAccent", ""),
											placeholder: translator("darkAccentPlaceholder"),
											disabled: !state.writable,
											onChange: (event) => setField("darkAccent", event.target.value)
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: AppearanceSection_module_css_default.hint,
										children: translator("darkAccentHint")
									})
								]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(GroupCard, {
						title: translator("groupSurface"),
						resetLabel: translator("groupReset"),
						group: "surface",
						writable: state.writable,
						onReset: resetGroup,
						children: SLIDERS.map((slider) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: AppearanceSection_module_css_default.row,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
								className: AppearanceSection_module_css_default.label,
								htmlFor: `appearance-${slider.field}`,
								children: translator(slider.label)
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: AppearanceSection_module_css_default.slider,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									id: `appearance-${slider.field}`,
									className: AppearanceSection_module_css_default.range,
									type: "range",
									min: 0,
									max: 100,
									value: num(slider.field, 100),
									style: { ["--fill"]: `${num(slider.field, 100)}%` },
									disabled: !state.writable,
									onChange: (event) => setField(slider.field, Number(event.target.value))
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: AppearanceSection_module_css_default.rangeValue,
									children: [num(slider.field, 100), "%"]
								})]
							})]
						}, slider.field))
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(GroupCard, {
						title: translator("groupTypography"),
						resetLabel: translator("groupReset"),
						group: "typography",
						writable: state.writable,
						onReset: resetGroup,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: AppearanceSection_module_css_default.row,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
										className: AppearanceSection_module_css_default.label,
										htmlFor: "appearance-fontPreset",
										children: translator("fontPreset")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
										id: "appearance-fontPreset",
										className: AppearanceSection_module_css_default.select,
										value: fontPresetId,
										disabled: !state.writable,
										onChange: (event) => {
											if (event.target.value !== "__custom__") applyFontPreset(event.target.value);
										},
										children: [FONT_PRESETS.map((preset) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value: preset.id,
											children: preset.name
										}, preset.id)), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value: "__custom__",
											children: translator("fontCustom")
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: AppearanceSection_module_css_default.hint,
										children: translator("fontPresetHint")
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: AppearanceSection_module_css_default.row,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
									className: AppearanceSection_module_css_default.label,
									htmlFor: "appearance-font",
									children: translator("fontFamily")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									id: "appearance-font",
									className: AppearanceSection_module_css_default.text,
									type: "text",
									value: str("fontFamily", ""),
									disabled: !state.writable,
									onChange: (event) => setField("fontFamily", event.target.value)
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: AppearanceSection_module_css_default.row,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
									className: AppearanceSection_module_css_default.label,
									htmlFor: "appearance-codeFont",
									children: translator("codeFontFamily")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									id: "appearance-codeFont",
									className: AppearanceSection_module_css_default.text,
									type: "text",
									value: str("codeFontFamily", ""),
									disabled: !state.writable,
									onChange: (event) => setField("codeFontFamily", event.target.value)
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: AppearanceSection_module_css_default.row,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
										className: AppearanceSection_module_css_default.label,
										htmlFor: "appearance-fontScale",
										children: translator("fontScale")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: AppearanceSection_module_css_default.slider,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											id: "appearance-fontScale",
											className: AppearanceSection_module_css_default.range,
											type: "range",
											min: .9,
											max: 1.1,
											step: .05,
											value: num("fontScale", 1),
											style: { ["--fill"]: `${(num("fontScale", 1) - .9) / .2 * 100}%` },
											disabled: !state.writable,
											onChange: (event) => setField("fontScale", Number(event.target.value))
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											className: AppearanceSection_module_css_default.rangeValue,
											children: ["×", num("fontScale", 1).toFixed(2)]
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: AppearanceSection_module_css_default.hint,
										children: translator("fontScaleHint")
									})
								]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(GroupCard, {
						title: translator("refineTitle"),
						resetLabel: translator("groupReset"),
						group: "refine",
						writable: state.writable,
						onReset: resetGroup,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: AppearanceSection_module_css_default.row,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
									className: AppearanceSection_module_css_default.label,
									htmlFor: "appearance-cornerRadius",
									children: translator("cornerRadius")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
									id: "appearance-cornerRadius",
									className: AppearanceSection_module_css_default.select,
									value: str("cornerRadius", "inherit"),
									disabled: !state.writable,
									onChange: (event) => setField("cornerRadius", event.target.value),
									children: CORNER_RADIUS_OPTIONS.map((option) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: option.id,
										children: translator(option.label)
									}, option.id))
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: AppearanceSection_module_css_default.row,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
									className: AppearanceSection_module_css_default.label,
									htmlFor: "appearance-surfaceShadow",
									children: translator("surfaceShadow")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
									id: "appearance-surfaceShadow",
									className: AppearanceSection_module_css_default.select,
									value: str("surfaceShadow", "inherit"),
									disabled: !state.writable,
									onChange: (event) => setField("surfaceShadow", event.target.value),
									children: SHADOW_OPTIONS.map((option) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: option.id,
										children: translator(option.label)
									}, option.id))
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: AppearanceSection_module_css_default.row,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
									className: AppearanceSection_module_css_default.label,
									htmlFor: "appearance-focusGlow",
									children: translator("focusGlow")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: AppearanceSection_module_css_default.check,
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										id: "appearance-focusGlow",
										className: AppearanceSection_module_css_default.checkbox,
										type: "checkbox",
										checked: str("focusGlow", "inherit") === "on",
										disabled: !state.writable,
										onChange: (event) => setField("focusGlow", event.target.checked ? "on" : "inherit")
									})
								})]
							}),
							["scrollbarAccent", "vignette"].map((field) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: AppearanceSection_module_css_default.row,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
									className: AppearanceSection_module_css_default.label,
									htmlFor: `appearance-${field}`,
									children: translator(field)
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: AppearanceSection_module_css_default.check,
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										id: `appearance-${field}`,
										className: AppearanceSection_module_css_default.checkbox,
										type: "checkbox",
										checked: bool(field, false),
										disabled: !state.writable,
										onChange: (event) => setField(field, event.target.checked)
									})
								})]
							}, field))
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: AppearanceSection_module_css_default.footer,
						children: [
							state.dirty ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: AppearanceSection_module_css_default.dirty,
								children: translator("dirty")
							}) : null,
							state.previewing ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: AppearanceSection_module_css_default.previewing,
								children: translator("previewing")
							}) : null,
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: AppearanceSection_module_css_default.reset,
								disabled: !state.writable || state.saving,
								onClick: resetAll,
								children: translator("reset")
							}),
							state.previewing ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: AppearanceSection_module_css_default.cancel,
								disabled: !state.writable || state.saving,
								onClick: cancelPreview,
								children: translator("cancelPreview")
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: AppearanceSection_module_css_default.preview,
								disabled: !state.dirty || !state.writable || state.saving,
								onClick: handlePreview,
								children: translator("preview")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: AppearanceSection_module_css_default.save,
								disabled: !state.dirty || !state.writable || state.saving,
								onClick: save,
								children: state.saving ? translator("saving") : translator("save")
							})
						]
					})
				]
			});
		}
		//#endregion
		//#region \0dsh-css:D:\ZcodeWorkspace\.zcode\workspace\default\deepseek-harness\packages\client\ui-custom\src\client\appearance\PreviewBar.module.css.mjs
		const css$10 = ".X1PZLq_hint{z-index:70;border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb, var(--dsw-alias-bg-overlay) 92%, transparent);box-shadow:var(--dsw-shadow-lv3);color:var(--dsw-alias-label-secondary);pointer-events:none;border-radius:999px;padding:6px 14px;font-size:12px;line-height:18px;position:fixed;bottom:20px;left:50%;transform:translate(-50%)}";
		const tagId$10 = "@deepseek-ai/dsh-client-ui-custom/PreviewBar.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$10) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-custom";
			tag.dataset.pluginCss = tagId$10;
			tag.textContent = css$10;
			document.head.appendChild(tag);
		}
		var PreviewBar_module_css_default = { "hint": "X1PZLq_hint" };
		//#endregion
		//#region src/client/appearance/PreviewBar.tsx
		/**
		* Floating preview hint (shell.overlay): while the appearance draft is
		* previewed on the document the screen stays clean — just a small "press F2 to
		* exit preview" pill. F2 exits preview mode and reopens the settings page,
		* where the user continues tweaking and finally decides to apply (save) or
		* cancel. (Escape is deliberately NOT used: the settings dialog closes on a
		* document-level Escape, so the reopen would be closed by the same keypress.)
		*/
		/** The exit key shown in the hint and listened for. */
		const EXIT_KEY = "F2";
		/**
		* Render the clean preview hint (null while not previewing).
		* @param props - composed slot props + injected exit action.
		* @returns the hint element tree, or null.
		*/
		function PreviewBar({ t, usePreviewVisible, onExit }) {
			const visible = usePreviewVisible((value) => value);
			const translator = t;
			(0, react.useEffect)(() => {
				if (!visible) return;
				const onKey = (event) => {
					if (event.key === EXIT_KEY) {
						event.preventDefault();
						onExit();
					}
				};
				window.addEventListener("keydown", onKey, true);
				return () => window.removeEventListener("keydown", onKey, true);
			}, [visible, onExit]);
			if (!visible) return null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: PreviewBar_module_css_default.hint,
				role: "status",
				children: translator("previewingBar")
			});
		}
		//#endregion
		//#region src/client/usage.ts
		/** All ranges, in display order. */
		const USAGE_RANGES = [
			"year",
			"month",
			"week",
			"days3"
		];
		const DAY_MS$1 = 864e5;
		/** Window start (ms epoch); sessions updated at/after it count. */
		function rangeStartMs(range, now) {
			switch (range) {
				case "year": return now - 365 * DAY_MS$1;
				case "month": return now - 30 * DAY_MS$1;
				case "week": return now - 7 * DAY_MS$1;
				case "days3": return now - 3 * DAY_MS$1;
			}
		}
		/** Zero aggregate. */
		const EMPTY_USAGE = {
			sessions: 0,
			turns: 0,
			steps: 0,
			inputTokens: 0,
			outputTokens: 0,
			cacheReadTokens: 0,
			cacheWriteTokens: 0,
			llmMs: 0,
			toolMs: 0
		};
		const num = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
		/**
		* Decode one session row's projection values into a {@link SessionUsageRow}.
		* @param updatedAt - the session's activity timestamp.
		* @param projectionValues - the row's projectionValues map (may be undefined).
		* @returns the leniently decoded row.
		*/
		function decodeUsageRow(updatedAt, projectionValues) {
			const usage = projectionValues?.["tokenUsage"];
			const stats = projectionValues?.["sessionStats"];
			const decodeBuckets = (value) => value === null || typeof value !== "object" ? null : {
				uncachedInputTokens: num(value.uncachedInputTokens),
				outputTokens: num(value.outputTokens),
				cacheReadTokens: num(value.cacheReadTokens),
				cacheWriteTokens: num(value.cacheWriteTokens)
			};
			const byModelRaw = usage !== null && typeof usage === "object" ? usage.byModel : void 0;
			let byModel = null;
			if (byModelRaw !== null && typeof byModelRaw === "object" && !Array.isArray(byModelRaw)) {
				byModel = {};
				for (const [modelKey, buckets] of Object.entries(byModelRaw)) {
					const decoded = decodeBuckets(buckets);
					if (decoded !== null) byModel[modelKey] = decoded;
				}
				if (Object.keys(byModel).length === 0) byModel = null;
			}
			return {
				updatedAt,
				usage: decodeBuckets(usage),
				byModel,
				stats: stats === null || typeof stats !== "object" ? null : {
					turns: num(stats.turns),
					steps: num(stats.steps),
					llmMs: num(stats.llmMs),
					toolMs: num(stats.toolMs)
				}
			};
		}
		/** Total provider tokens in one usage bucket (all four disjoint buckets). */
		function usageTokens(usage) {
			return usage.uncachedInputTokens + usage.cacheReadTokens + usage.cacheWriteTokens + usage.outputTokens;
		}
		/**
		* The row's usage slice for a model filter: the per-model buckets when a
		* model key is selected, otherwise the row totals. Null when the slice is
		* unavailable.
		* @param row - a decoded session row.
		* @param modelKey - selected model (`${provider}:${model}`) or null for all models.
		* @returns the usage slice, or null.
		*/
		function usageOfRow(row, modelKey) {
			if (modelKey === null) return row.usage;
			return row.byModel?.[modelKey] ?? null;
		}
		/**
		* The model keys (in first-seen order) any session reported usage for —
		* the model-selector options.
		* @param rows - decoded session rows.
		* @returns `provider:model` keys, deduplicated in first-seen order.
		*/
		function usageModelKeys(rows) {
			const keys = [];
			const seen = /* @__PURE__ */ new Set();
			for (const row of rows) {
				if (row.byModel === null) continue;
				for (const modelKey of Object.keys(row.byModel)) if (!seen.has(modelKey)) {
					seen.add(modelKey);
					keys.push(modelKey);
				}
			}
			return keys;
		}
		/**
		* Aggregate session rows whose activity falls inside the range window.
		* @param rows - decoded session rows.
		* @param range - the time window.
		* @param now - reference "now" (ms epoch).
		* @param modelKey - optional model filter (`${provider}:${model}`); null aggregates all models.
		* @returns summed figures.
		*/
		function aggregateUsage(rows, range, now, modelKey = null) {
			const cutoff = rangeStartMs(range, now);
			const total = { ...EMPTY_USAGE };
			for (const row of rows) {
				if (row.updatedAt < cutoff) continue;
				const usage = usageOfRow(row, modelKey);
				if (modelKey !== null && usage === null) continue;
				total.sessions += 1;
				if (row.stats !== null) {
					total.turns += row.stats.turns;
					total.steps += row.stats.steps;
					total.llmMs += row.stats.llmMs;
					total.toolMs += row.stats.toolMs;
				}
				if (usage !== null) {
					total.inputTokens += usage.uncachedInputTokens;
					total.outputTokens += usage.outputTokens;
					total.cacheReadTokens += usage.cacheReadTokens;
					total.cacheWriteTokens += usage.cacheWriteTokens;
				}
			}
			return total;
		}
		/**
		* Bucket token totals for a range's bar chart. Adaptive granularity: 12
		* monthly buckets for the year, 4 weekly for the month, daily for week/days3.
		* @param rows - decoded session rows.
		* @param range - the time window.
		* @param now - reference "now".
		* @param modelKey - optional model filter; null aggregates all models.
		* @returns buckets from oldest to newest.
		*/
		function usageByBucket(rows, range, now, modelKey = null) {
			const cutoff = rangeStartMs(range, now);
			const spec = range === "year" ? {
				count: 12,
				width: 30 * DAY_MS$1
			} : range === "month" ? {
				count: 4,
				width: 7 * DAY_MS$1
			} : {
				count: range === "week" ? 7 : 3,
				width: DAY_MS$1
			};
			const buckets = new Array(spec.count).fill(0).map((_, index) => ({
				start: now - (spec.count - 1 - index) * spec.width,
				tokens: 0
			}));
			for (const row of rows) {
				if (row.updatedAt < cutoff) continue;
				const usage = usageOfRow(row, modelKey);
				if (usage === null) continue;
				const age = now - row.updatedAt;
				const index = spec.count - 1 - Math.min(spec.count - 1, Math.floor(age / spec.width));
				buckets[index].tokens += usageTokens(usage);
			}
			return buckets;
		}
		/** Format a token count compactly (1.2k / 3.4M). */
		function formatTokens(count) {
			if (count >= 1e6) return `${(count / 1e6).toFixed(2)}M`;
			if (count >= 1e3) return `${(count / 1e3).toFixed(1)}k`;
			return String(count);
		}
		/** Format a duration compactly (45s / 12m 30s / 3h 12m). */
		function formatDuration(ms) {
			const seconds = Math.round(ms / 1e3);
			if (seconds < 60) return `${seconds}s`;
			const minutes = Math.floor(seconds / 60);
			if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
			return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
		}
		//#endregion
		//#region \0dsh-css:D:\ZcodeWorkspace\.zcode\workspace\default\deepseek-harness\packages\client\ui-custom\src\client\usage\UsagePanel.module.css.mjs
		const css$9 = ".Y9lxvG_section{flex-direction:column;gap:14px;display:flex}.Y9lxvG_toolbar{justify-content:space-between;align-items:center;gap:10px;display:flex}.Y9lxvG_model{border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb, var(--dsw-alias-bg-base) 70%, transparent);height:26px;color:var(--dsw-alias-label-secondary);cursor:pointer;border-radius:7px;justify-content:space-between;align-items:center;gap:8px;padding:0 10px;font-size:12px;display:inline-flex}.Y9lxvG_model:hover{color:var(--dsw-alias-label-primary)}.Y9lxvG_chevron{color:var(--dsw-alias-label-tertiary);flex:none}.Y9lxvG_heading{margin:0;font-size:16px;font-weight:600;line-height:24px}.Y9lxvG_intro{color:var(--dsw-alias-label-secondary);margin:0;font-size:13px;line-height:20px}.Y9lxvG_tabs{background:color-mix(in srgb, var(--dsw-alias-bg-base) 70%, transparent);border:1px solid var(--dsw-alias-border-l2);border-radius:10px;gap:6px;width:fit-content;padding:3px;display:inline-flex}.Y9lxvG_tab{height:26px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;border-radius:7px;padding:0 12px;font-size:12px;line-height:26px}.Y9lxvG_tabActive{background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-foreground)}.Y9lxvG_kpis{grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;display:grid}.Y9lxvG_kpi{border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb, var(--dsw-alias-bg-base) 78%, transparent);border-radius:12px;flex-direction:column;gap:4px;padding:12px 14px;display:flex}.Y9lxvG_kpiLabel{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}.Y9lxvG_kpiValue{color:var(--dsw-alias-label-primary);font-size:18px;font-weight:600;line-height:24px}.Y9lxvG_kpiSub{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px}.Y9lxvG_breakdown{flex-direction:column;gap:8px;display:flex}.Y9lxvG_breakdownLabel{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;line-height:20px}.Y9lxvG_bars{border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb, var(--dsw-alias-bg-base) 78%, transparent);border-radius:12px;align-items:flex-end;gap:6px;height:90px;padding:10px;display:flex}.Y9lxvG_barWrap{flex-direction:column;flex:1 1 0;justify-content:flex-end;align-items:center;gap:4px;min-width:0;height:100%;display:flex}.Y9lxvG_bar{background:linear-gradient(180deg, var(--dsw-alias-brand-primary), color-mix(in srgb, var(--dsw-alias-brand-primary) 55%, white));opacity:.9;border-radius:4px 4px 2px 2px;width:70%;min-height:2px}.Y9lxvG_barLabel{color:var(--dsw-alias-label-tertiary);white-space:nowrap;text-overflow:ellipsis;max-width:100%;font-size:10px;line-height:12px;overflow:hidden}.Y9lxvG_top{flex-direction:column;gap:6px;display:flex}.Y9lxvG_topRow{border:1px solid var(--dsw-alias-border-l1);background:color-mix(in srgb, var(--dsw-alias-bg-base) 70%, transparent);border-radius:10px;align-items:center;gap:10px;padding:8px 12px;font-size:13px;line-height:20px;display:flex}.Y9lxvG_topRank{text-align:center;width:20px;color:var(--dsw-alias-label-tertiary);flex:none;font-size:12px}.Y9lxvG_topTitle{text-overflow:ellipsis;white-space:nowrap;min-width:0;color:var(--dsw-alias-label-primary);flex:auto;overflow:hidden}.Y9lxvG_topTokens{color:var(--dsw-alias-label-primary);flex:none;font-weight:600}.Y9lxvG_empty{color:var(--dsw-alias-label-tertiary);padding:16px 0;font-size:13px;line-height:20px}";
		const tagId$9 = "@deepseek-ai/dsh-client-ui-custom/UsagePanel.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$9) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-custom";
			tag.dataset.pluginCss = tagId$9;
			tag.textContent = css$9;
			document.head.appendChild(tag);
		}
		var UsagePanel_module_css_default = {
			"toolbar": "Y9lxvG_toolbar",
			"chevron": "Y9lxvG_chevron",
			"tabs": "Y9lxvG_tabs",
			"model": "Y9lxvG_model",
			"tab": "Y9lxvG_tab",
			"kpis": "Y9lxvG_kpis",
			"kpiValue": "Y9lxvG_kpiValue",
			"breakdownLabel": "Y9lxvG_breakdownLabel",
			"bar": "Y9lxvG_bar",
			"intro": "Y9lxvG_intro",
			"heading": "Y9lxvG_heading",
			"kpi": "Y9lxvG_kpi",
			"barWrap": "Y9lxvG_barWrap",
			"topRow": "Y9lxvG_topRow",
			"topTitle": "Y9lxvG_topTitle",
			"kpiLabel": "Y9lxvG_kpiLabel",
			"empty": "Y9lxvG_empty",
			"breakdown": "Y9lxvG_breakdown",
			"kpiSub": "Y9lxvG_kpiSub",
			"tabActive": "Y9lxvG_tabActive",
			"bars": "Y9lxvG_bars",
			"barLabel": "Y9lxvG_barLabel",
			"top": "Y9lxvG_top",
			"topTokens": "Y9lxvG_topTokens",
			"section": "Y9lxvG_section",
			"topRank": "Y9lxvG_topRank"
		};
		//#endregion
		//#region src/client/usage/UsagePanel.tsx
		/** App-usage panel: model filter, time-range tabs, KPI cards, a bar trend, and top sessions. */
		const DAY_MS = 864e5;
		function bucketLabel(start, range) {
			const date = new Date(start);
			if (range === "year") return date.toLocaleDateString(void 0, { month: "short" });
			if (range === "month") return date.toLocaleDateString(void 0, {
				month: "short",
				day: "numeric"
			});
			return date.toLocaleDateString(void 0, { weekday: "short" });
		}
		/** Display label for a `provider:model` key. */
		const modelLabel = (modelKey) => modelKey.replace(":", " / ");
		/**
		* Render the usage panel content.
		* @param props - sessions hook + translator.
		* @returns the panel element tree.
		*/
		function UsagePanel({ useSessions, t }) {
			const list = useSessions((value) => value);
			const [range, setRange] = (0, react.useState)("week");
			const [modelKey, setModelKey] = (0, react.useState)(null);
			const [modelOpen, setModelOpen] = (0, react.useState)(false);
			const now = Date.now();
			const rows = Object.values(list.byId).map((summary) => decodeUsageRow(summary.updatedAt, summary.projectionValues));
			const modelKeys = usageModelKeys(rows);
			const activeModel = modelKey !== null && modelKeys.includes(modelKey) ? modelKey : null;
			const total = aggregateUsage(rows, range, now, activeModel);
			const buckets = usageByBucket(rows, range, now, activeModel);
			const maxTokens = Math.max(1, ...buckets.map((bucket) => bucket.tokens));
			const hitTokens = total.cacheReadTokens + total.inputTokens;
			const hitRate = hitTokens === 0 ? 0 : total.cacheReadTokens / hitTokens;
			const top = Object.values(list.byId).map((summary) => {
				const usage = usageOfRow(decodeUsageRow(summary.updatedAt, summary.projectionValues), activeModel);
				return {
					title: summary.displayTitle,
					updatedAt: summary.updatedAt,
					tokens: usage === null ? 0 : usageTokens(usage),
					missing: activeModel !== null && usage === null
				};
			}).filter((entry) => !entry.missing && entry.updatedAt >= now - (range === "year" ? 365 : range === "month" ? 30 : range === "week" ? 7 : 3) * DAY_MS).sort((a, b) => b.tokens - a.tokens).slice(0, 5);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: UsagePanel_module_css_default.section,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: UsagePanel_module_css_default.toolbar,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: UsagePanel_module_css_default.tabs,
						role: "tablist",
						"aria-label": "usage range",
						children: USAGE_RANGES.map((id) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							role: "tab",
							"aria-selected": id === range,
							className: id === range ? `${UsagePanel_module_css_default.tab} ${UsagePanel_module_css_default.tabActive}` : UsagePanel_module_css_default.tab,
							onClick: () => setRange(id),
							children: t(`range.${id}`)
						}, id))
					}), modelKeys.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
						open: modelOpen,
						onClose: () => {
							setModelOpen(false);
						},
						items: [{
							id: "",
							label: t("model.all")
						}, ...modelKeys.map((key) => ({
							id: key,
							label: modelLabel(key)
						}))],
						selectedId: activeModel ?? "",
						onSelect: (id) => {
							setModelOpen(false);
							setModelKey(id === "" ? null : id);
						},
						align: "end",
						portal: true,
						anchor: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: UsagePanel_module_css_default.model,
							"aria-haspopup": "menu",
							"aria-expanded": modelOpen,
							onClick: () => {
								setModelOpen((value) => !value);
							},
							children: [activeModel === null ? t("model.all") : modelLabel(activeModel), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, { className: UsagePanel_module_css_default.chevron })]
						})
					})]
				}), total.sessions === 0 && total.inputTokens === 0 && total.outputTokens === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: UsagePanel_module_css_default.empty,
					children: t("empty")
				}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: UsagePanel_module_css_default.kpis,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: UsagePanel_module_css_default.kpi,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: UsagePanel_module_css_default.kpiLabel,
									children: t("kpi.total")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: UsagePanel_module_css_default.kpiValue,
									children: formatTokens(total.inputTokens + total.outputTokens + total.cacheReadTokens + total.cacheWriteTokens)
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: UsagePanel_module_css_default.kpi,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: UsagePanel_module_css_default.kpiLabel,
										children: t("kpi.input")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: UsagePanel_module_css_default.kpiValue,
										children: formatTokens(total.inputTokens)
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: UsagePanel_module_css_default.kpiSub,
										children: [formatTokens(total.cacheWriteTokens), " write"]
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: UsagePanel_module_css_default.kpi,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: UsagePanel_module_css_default.kpiLabel,
									children: t("kpi.output")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: UsagePanel_module_css_default.kpiValue,
									children: formatTokens(total.outputTokens)
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: UsagePanel_module_css_default.kpi,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: UsagePanel_module_css_default.kpiLabel,
										children: t("kpi.cache")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: UsagePanel_module_css_default.kpiValue,
										children: formatTokens(total.cacheReadTokens)
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: UsagePanel_module_css_default.kpiSub,
										children: [
											t("kpi.cacheRate"),
											" ",
											(hitRate * 100).toFixed(1),
											"%"
										]
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: UsagePanel_module_css_default.kpi,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: UsagePanel_module_css_default.kpiLabel,
										children: t("kpi.time")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: UsagePanel_module_css_default.kpiValue,
										children: formatDuration(total.llmMs)
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: UsagePanel_module_css_default.kpiSub,
										children: [formatDuration(total.toolMs), " tool"]
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: UsagePanel_module_css_default.kpi,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: UsagePanel_module_css_default.kpiLabel,
										children: t("kpi.sessions")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: UsagePanel_module_css_default.kpiValue,
										children: total.sessions
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: UsagePanel_module_css_default.kpiSub,
										children: [
											t("kpi.steps"),
											" ",
											total.steps
										]
									})
								]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: UsagePanel_module_css_default.breakdown,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: UsagePanel_module_css_default.breakdownLabel,
							children: t("breakdown")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: UsagePanel_module_css_default.bars,
							children: buckets.map((bucket) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: UsagePanel_module_css_default.barWrap,
								title: `${formatTokens(bucket.tokens)}`,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: UsagePanel_module_css_default.bar,
									style: { height: `${Math.max(2, Math.round(bucket.tokens / maxTokens * 100))}%` }
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: UsagePanel_module_css_default.barLabel,
									children: bucketLabel(bucket.start, range)
								})]
							}, bucket.start))
						})]
					}),
					top.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: UsagePanel_module_css_default.top,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: UsagePanel_module_css_default.breakdownLabel,
							children: t("topSessions")
						}), top.map((entry, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: UsagePanel_module_css_default.topRow,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: UsagePanel_module_css_default.topRank,
									children: index + 1
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: UsagePanel_module_css_default.topTitle,
									children: entry.title
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: UsagePanel_module_css_default.topTokens,
									children: formatTokens(entry.tokens)
								})
							]
						}, entry.title + entry.updatedAt))]
					})
				] })]
			});
		}
		//#endregion
		//#region src/client/usage/UsageSection.tsx
		/**
		* Render the usage section content.
		* @param props - composed slot props + injected sessions hook.
		* @returns the section element tree.
		*/
		function UsageSection({ t, useSessions }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(UsagePanel, {
				useSessions,
				t
			});
		}
		//#endregion
		//#region \0dsh-css:D:\ZcodeWorkspace\.zcode\workspace\default\deepseek-harness\packages\client\ui-custom\src\client\usage\UsageOverlay.module.css.mjs
		const css$8 = "._8-SJqG_backdrop{z-index:60;background:var(--dsw-alias-bg-mask-1);place-items:center;padding:32px;display:grid;position:fixed;inset:0}._8-SJqG_panel{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);width:min(680px,100%);max-height:calc(100vh - 64px);box-shadow:var(--dsw-shadow-lv3);border-radius:16px;flex-direction:column;display:flex;overflow:hidden}._8-SJqG_header{border-bottom:1px solid var(--dsw-alias-border-l2);justify-content:space-between;align-items:center;gap:12px;padding:14px 18px;display:flex}._8-SJqG_title{margin:0;font-size:15px;font-weight:600;line-height:22px}._8-SJqG_close{width:28px;height:28px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;border-radius:7px;flex:none;font-size:16px;line-height:28px}._8-SJqG_close:hover{background:var(--dsw-alias-interactive-bg-hover)}._8-SJqG_body{padding:16px 18px 18px;overflow-y:auto}";
		const tagId$8 = "@deepseek-ai/dsh-client-ui-custom/UsageOverlay.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$8) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-custom";
			tag.dataset.pluginCss = tagId$8;
			tag.textContent = css$8;
			document.head.appendChild(tag);
		}
		var UsageOverlay_module_css_default = {
			"backdrop": "_8-SJqG_backdrop",
			"title": "_8-SJqG_title",
			"panel": "_8-SJqG_panel",
			"header": "_8-SJqG_header",
			"close": "_8-SJqG_close",
			"body": "_8-SJqG_body"
		};
		//#endregion
		//#region src/client/usage/UsageOverlay.tsx
		/** The shell.overlay entry: the usage panel popped by the shortcut (Mod+Alt+U). */
		/**
		* Render the usage overlay (null while hidden; Esc / backdrop / close hides it).
		* @param props - composed slot props + injected hooks.
		* @returns the overlay element tree, or null.
		*/
		function UsageOverlay({ t, useSessions, useUsageVisible }) {
			const visible = useUsageVisible((value) => value);
			(0, react.useEffect)(() => {
				if (!visible) return;
				const onKeyDown = (event) => {
					if (event.key === "Escape") usageOverlay.close();
				};
				window.addEventListener("keydown", onKeyDown);
				return () => window.removeEventListener("keydown", onKeyDown);
			}, [visible]);
			if (!visible) return null;
			const translator = t;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: UsageOverlay_module_css_default.backdrop,
				role: "presentation",
				onClick: () => usageOverlay.close(),
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: UsageOverlay_module_css_default.panel,
					role: "dialog",
					"aria-label": translator("title"),
					onClick: (event) => event.stopPropagation(),
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
						className: UsageOverlay_module_css_default.header,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
							className: UsageOverlay_module_css_default.title,
							children: translator("title")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: UsageOverlay_module_css_default.close,
							"aria-label": translator("close"),
							onClick: () => usageOverlay.close(),
							children: "×"
						})]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: UsageOverlay_module_css_default.body,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(UsagePanel, {
							useSessions,
							t: translator
						})
					})]
				})
			});
		}
		//#endregion
		//#region src/client/marketplace/marketplace-locales.ts
		/** Locale dictionaries for the plugin marketplace tab. */
		/** Dictionary namespace owned by the marketplace surface. */
		const MARKETPLACE_NS = "marketplace";
		/** Simplified Chinese copy. */
		const zh$3 = {
			tab: "插件市场",
			title: "插件市场",
			intro: "从 GitHub 发现并安装 DSH 第三方插件（DeepSeek 内置包已在 roster 中，不在此列出）。市场默认自动发现带 dsh-plugin 主题的 GitHub 插件仓库（按星标排序）；也可以在 marketplaceUrl 里配置你的清单地址，或直接填写 GitHub 仓库地址——仓库没有 marketplace.json 时会自动读取其信息生成条目。点击「安装」复制安装配置到剪贴板，粘贴到 profile 补丁文件后即自动生效（无需重启）。",
			refresh: "刷新",
			refreshing: "刷新中…",
			empty: "暂无插件。可以在 marketplaceUrl 里填写 GitHub 仓库地址（自动探测 marketplace.json，缺失时读取仓库信息），或发布 marketplace.json 清单。",
			installed: "已安装",
			install: "安装",
			copied: "已复制，请粘贴到补丁文件",
			source: "来源",
			"source.bundled": "内置清单",
			"source.remote": "GitHub",
			openOnGitHub: "GitHub 源码",
			installHint: "把复制的 YAML 追加到 ~/.dsh/profiles/web/cordis.patch.yml（该文件被实时监听，保存即生效）。",
			error: "清单加载失败",
			errorHint: "无法从任何配置的地址加载插件清单。请检查插件配置里的 marketplaceUrl：支持多个地址（用逗号或换行分隔），也可以直接填写 GitHub 仓库地址（自动探测 marketplace.json，缺失时读取仓库信息）；确认后重新点击刷新。",
			errorNetwork: "网络错误",
			errorHttp: "HTTP 错误",
			errorInvalid: "清单格式无效",
			total: "GitHub 插件总数",
			sort: "排序",
			"sort.stars": "按星标",
			"sort.date": "按发布日期",
			limit: "显示数量"
		};
		/** English copy. */
		const en$3 = {
			tab: "Marketplace",
			title: "Plugin Marketplace",
			intro: "Discover and install third-party DSH plugins from GitHub (DeepSeek built-ins already ship in the roster and are not listed here). The market auto-discovers GitHub plugin repos tagged with the dsh-plugin topic (sorted by stars); you can also point marketplaceUrl at your own manifest, or paste a plain GitHub repo URL — a repo without marketplace.json is resolved from its repo metadata automatically. Click Install to copy the install snippet; paste it into the profile patch file and it applies live (no restart).",
			refresh: "Refresh",
			refreshing: "Refreshing…",
			empty: "No plugins yet. Put a GitHub repo URL in marketplaceUrl (its marketplace.json is probed, falling back to the repo metadata), or publish a marketplace.json manifest.",
			installed: "Installed",
			install: "Install",
			copied: "Copied — paste into the patch file",
			source: "Source",
			"source.bundled": "Bundled catalog",
			"source.remote": "GitHub",
			openOnGitHub: "Source on GitHub",
			installHint: "Append the copied YAML to ~/.dsh/profiles/web/cordis.patch.yml (the file is watched; saving applies it live).",
			error: "Catalog failed to load",
			errorHint: "None of the configured sources produced a catalog. Check marketplaceUrl in the plugin config: multiple addresses are supported (comma or newline separated), and a plain GitHub repo URL is probed for marketplace.json, falling back to the repo metadata. Fix it, then refresh again.",
			errorNetwork: "Network error",
			errorHttp: "HTTP error",
			errorInvalid: "Invalid manifest",
			total: "GitHub plugins total",
			sort: "Sort",
			"sort.stars": "By stars",
			"sort.date": "By publish date",
			limit: "Show count"
		};
		//#endregion
		//#region src/client/marketplace/manifest.ts
		/** Build the install snippet for one package. */
		function installSnippet(id, pkg) {
			return [
				"- insert:",
				`    - id: ${id}`,
				`      name: '${pkg}'`
			].join("\n");
		}
		/**
		* The bundled catalog: empty by design. Built-ins ship in the roster already;
		* third-party plugins arrive through the configured sources and the GitHub
		* discovery search (see deriveMarketplaceSources / discoverGitHubPlugins).
		*/
		const BUNDLED_MARKETPLACE = [];
		/**
		* Default remote manifest URL (GitHub raw; CORS-open). Points at the
		* deepseek-harness `master` branch — the repo's default branch — where the
		* manifest lives once published. A profile without an explicit
		* `marketplaceUrl` shows this source's failure in the UI (instead of silently
		* rendering an empty market), so the missing manifest is diagnosable.
		*/
		const DEFAULT_MARKETPLACE_URL = "https://raw.githubusercontent.com/deepseek-ai/deepseek-harness/master/packages/client/ui-custom/marketplace.json";
		/** GitHub REST API base (CORS-open; used for repo fallback + discovery). */
		const GITHUB_API = "https://api.github.com";
		/** Raw-manifest candidates for a GitHub repo on the usual default branches. */
		const DEFAULT_BRANCHES = ["main", "master"];
		/** Derive raw-manifest URL(s) from a GitHub repo path (`owner/repo`). */
		function githubRepoRawCandidates(owner, repo) {
			const clean = repo.replace(/\.git$/, "").replace(/\/+$/, "");
			return DEFAULT_BRANCHES.map((branch) => `https://raw.githubusercontent.com/${owner}/${clean}/${branch}/marketplace.json`);
		}
		/**
		* Normalize a `marketplaceUrl` settings value into a flat list of sources.
		* Pure: no DOM, no fetch.
		*
		* Accepted shapes, separated by commas / semicolons / whitespace / newlines
		* (both ASCII and full-width separators):
		*   - a raw manifest URL (`https://raw.githubusercontent.com/…/marketplace.json`)
		*     or any other http(s) URL — a manifest source used as-is;
		*   - a GitHub repo URL (`https://github.com/owner/repo`) — a repo source,
		*     probed for its `marketplace.json` on `main` then `master`, then resolved
		*     from GitHub metadata;
		*   - a GitHub blob URL (`…/blob/<branch>/<path>`) — mapped to the raw URL.
		*
		* Unknown or malformed entries are dropped; duplicates are removed (first
		* occurrence wins).
		* @param setting - the raw marketplaceUrl setting ('' / undefined → no sources).
		* @returns sources, in configured order.
		*/
		function deriveMarketplaceSources(setting) {
			const out = [];
			const seen = /* @__PURE__ */ new Set();
			const push = (source) => {
				if (seen.has(source.label)) return;
				seen.add(source.label);
				out.push(source);
			};
			if (typeof setting !== "string" || setting.trim() === "") return out;
			const parts = setting.split(/[\s,;，；]+/).map((part) => part.trim()).filter((part) => part !== "");
			for (const part of parts) {
				const blob = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/\s]+)\/([^/\s]+?)\/blob\/([^/\s]+)\/(.+)$/.exec(part);
				if (blob !== null && blob[1] !== void 0 && blob[2] !== void 0 && blob[3] !== void 0 && blob[4] !== void 0) {
					push({
						kind: "manifest",
						url: `https://raw.githubusercontent.com/${blob[1]}/${blob[2]}/${blob[3]}/${blob[4]}`,
						label: part
					});
					continue;
				}
				const repo = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/\s]+)\/([^/\s]+?)(?:\/.*)?$/.exec(part);
				if (repo !== null && repo[1] !== void 0 && repo[2] !== void 0) {
					push({
						kind: "repo",
						owner: repo[1],
						repo: repo[2],
						probes: githubRepoRawCandidates(repo[1], repo[2]),
						label: `github.com/${repo[1]}/${repo[2]}`
					});
					continue;
				}
				if (/^https?:\/\//.test(part)) push({
					kind: "manifest",
					url: part,
					label: part
				});
			}
			return out;
		}
		/** Validate a raw manifest payload leniently. */
		function parseMarketplaceManifest(value) {
			if (!Array.isArray(value) || value.length === 0) return null;
			const entries = [];
			for (const raw of value) {
				if (typeof raw !== "object" || raw === null) continue;
				const entry = raw;
				if (typeof entry.id !== "string" || typeof entry.package !== "string") continue;
				if (typeof entry.name !== "string" || typeof entry.description !== "string") continue;
				entries.push({
					id: entry.id,
					package: entry.package,
					name: entry.name,
					description: entry.description,
					repoUrl: typeof entry.repoUrl === "string" ? entry.repoUrl : "",
					installYaml: typeof entry.installYaml === "string" ? entry.installYaml : installSnippet(entry.id, entry.package)
				});
			}
			return entries.length === 0 ? null : entries;
		}
		/** Fetch one manifest URL and classify the outcome. */
		async function fetchMarketplaceManifest(url) {
			let response;
			try {
				response = await fetch(url, { headers: { Accept: "application/json" } });
			} catch {
				return {
					ok: false,
					failure: { code: "network" }
				};
			}
			if (!response.ok) return {
				ok: false,
				failure: {
					code: "http",
					status: response.status
				}
			};
			let payload;
			try {
				payload = await response.json();
			} catch {
				return {
					ok: false,
					failure: { code: "invalid" }
				};
			}
			const entries = parseMarketplaceManifest(payload);
			if (entries === null) return {
				ok: false,
				failure: { code: "invalid" }
			};
			return {
				ok: true,
				entries
			};
		}
		/** One entry built from a GitHub repo, with a best-effort package name. */
		function repoEntry(owner, repo, packageName, description, htmlUrl, stars, createdAt) {
			const clean = repo.replace(/\.git$/, "").replace(/\/+$/, "");
			const pkg = packageName !== "" ? packageName : `@${owner}/${clean}`;
			return {
				id: clean,
				package: pkg,
				name: `${owner}/${clean}`,
				description,
				repoUrl: htmlUrl,
				installYaml: installSnippet(clean, pkg),
				...stars !== void 0 ? { stars } : {},
				...createdAt !== void 0 ? { createdAt } : {}
			};
		}
		/**
		* Resolve a GitHub repo into a marketplace entry from its metadata: the repos
		* endpoint provides the description, and the contents endpoint provides the
		* real npm package name (best-effort — a missing package.json degrades to
		* `@owner/repo`). Fails only when the repo itself is unreachable.
		* @param owner - the repo owner.
		* @param repo - the repo name.
		* @returns one entry, or a categorized failure.
		*/
		async function fetchRepoEntry(owner, repo) {
			const clean = repo.replace(/\.git$/, "").replace(/\/+$/, "");
			let metadata;
			try {
				const response = await fetch(`${GITHUB_API}/repos/${owner}/${clean}`, { headers: { Accept: "application/vnd.github+json" } });
				if (!response.ok) return {
					ok: false,
					failure: {
						code: "http",
						status: response.status
					}
				};
				metadata = await response.json();
			} catch {
				return {
					ok: false,
					failure: { code: "network" }
				};
			}
			let packageName = "";
			try {
				const response = await fetch(`${GITHUB_API}/repos/${owner}/${clean}/contents/package.json`, { headers: { Accept: "application/vnd.github+json" } });
				if (response.ok) {
					const payload = await response.json();
					if (typeof payload.content === "string") {
						const text = atob(payload.content.replace(/\s/g, ""));
						const manifest = JSON.parse(text);
						if (typeof manifest.name === "string" && manifest.name !== "") packageName = manifest.name;
					}
				}
			} catch {}
			return {
				ok: true,
				entries: [repoEntry(owner, clean, packageName, metadata.description ?? "", metadata.html_url ?? `https://github.com/${owner}/${clean}`, typeof metadata.stargazers_count === "number" ? metadata.stargazers_count : void 0, typeof metadata.created_at === "string" ? metadata.created_at : void 0)]
			};
		}
		/** The GitHub search query for the auto-discovery source (dsh-plugin topic + dsh- name). */
		const DISCOVERY_QUERY = "topic:dsh-plugin dsh- in:name";
		/**
		* Repo names (lowercase) that are index / aggregator / docs pages rather than
		* installable plugins. The name check also drops every `awesome` list (the
		* GitHub query cannot reliably exclude them). Explicitly configured sources
		* (manifest entries / repo URLs) are never filtered.
		*/
		const DISCOVERY_EXCLUDED_NAMES = new Set([
			"dsh-hub",
			"dsh-suite",
			"dsh-recommend",
			"dsh-plugin-marketplace",
			"dsh-plugin-hub",
			"dsh-handbook",
			"dsh-market"
		]);
		/** Whether a discovered repo name should be skipped (index/aggregator repos). */
		function isExcludedDiscoveryRepo(name) {
			const lower = name.toLowerCase();
			if (lower.includes("awesome")) return true;
			return DISCOVERY_EXCLUDED_NAMES.has(lower);
		}
		/**
		* Auto-discover third-party plugins from GitHub: repos tagged with the
		* `dsh-plugin` topic and a `dsh-` name prefix. The GitHub search sorts
		* natively by stars or by recency (`updated`); for the `date` mode the page is
		* re-sorted by the repo's publish date (`created_at`, newest first) before the
		* limit is applied. The response's `total_count` rides along so the tab can
		* show how many plugins exist on GitHub. Classified failures keep the UI
		* honest (network / HTTP status / invalid shape).
		* @param sort - 'stars' (default) or 'date' (publish date, recent first).
		* @param limit - how many entries to return (clamped to 1–100).
		* @returns discovered entries + the GitHub total, or a categorized failure.
		*/
		async function discoverGitHubPlugins(sort, limit) {
			const count = Math.min(100, Math.max(1, Math.round(limit)));
			const url = `${GITHUB_API}/search/repositories?q=${encodeURIComponent(DISCOVERY_QUERY)}&sort=${sort === "date" ? "updated" : "stars"}&order=desc&per_page=${count}`;
			let response;
			try {
				response = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
			} catch {
				return {
					ok: false,
					failure: { code: "network" }
				};
			}
			if (!response.ok) return {
				ok: false,
				failure: {
					code: "http",
					status: response.status
				}
			};
			let payload;
			try {
				payload = await response.json();
			} catch {
				return {
					ok: false,
					failure: { code: "invalid" }
				};
			}
			if (!Array.isArray(payload.items)) return {
				ok: false,
				failure: { code: "invalid" }
			};
			const total = typeof payload.total_count === "number" && Number.isFinite(payload.total_count) ? payload.total_count : 0;
			const items = payload.items.filter((raw) => typeof raw === "object" && raw !== null);
			if (sort === "date") items.sort((a, b) => (typeof b.created_at === "string" ? b.created_at : "").localeCompare(typeof a.created_at === "string" ? a.created_at : ""));
			const entries = [];
			for (const item of items.slice(0, count)) {
				const fullName = typeof item.full_name === "string" ? item.full_name : "";
				const name = typeof item.name === "string" ? item.name : "";
				if (fullName === "" || name === "") continue;
				if (isExcludedDiscoveryRepo(name)) continue;
				const separator = fullName.indexOf("/");
				const owner = separator > 0 ? fullName.slice(0, separator) : "";
				if (owner === "") continue;
				entries.push(repoEntry(owner, name, "", typeof item.description === "string" ? item.description : "", typeof item.html_url === "string" ? item.html_url : `https://github.com/${fullName}`, typeof item.stargazers_count === "number" ? item.stargazers_count : void 0, typeof item.created_at === "string" ? item.created_at : void 0));
			}
			if (entries.length === 0) return {
				ok: false,
				failure: { code: "invalid" }
			};
			return {
				ok: true,
				entries,
				total
			};
		}
		/** A `github.com/owner/repo` URL (the repo root form, trailing path ignored). */
		const GITHUB_REPO_URL = /^https?:\/\/(?:www\.)?github\.com\/([^/\s]+)\/([^/\s]+?)(?:\/|$)/;
		/** Cap on metadata-enrichment calls per refresh (GitHub API rate-limit courtesy). */
		const ENRICH_LIMIT = 8;
		/**
		* Best-effort: fill in `stars` / `createdAt` for entries that came from a
		* plain manifest (they carry a repo URL but no sort metadata), so the whole
		* merged list can be sorted by stars or by publish date. Entries already
		* carrying metadata (repo sources / discovery) and non-repo URLs are skipped;
		* failures are silent — the entry just sorts to the end.
		* @param entries - the merged entry list (mutated in place).
		*/
		async function enrichEntryMetadata(entries) {
			const targets = entries.filter((entry) => entry.stars === void 0 && entry.createdAt === void 0 && GITHUB_REPO_URL.test(entry.repoUrl)).slice(0, ENRICH_LIMIT);
			await Promise.allSettled(targets.map(async (entry) => {
				const match = GITHUB_REPO_URL.exec(entry.repoUrl);
				if (match === null || match[1] === void 0 || match[2] === void 0) return;
				try {
					const response = await fetch(`${GITHUB_API}/repos/${match[1]}/${match[2]}`, { headers: { Accept: "application/vnd.github+json" } });
					if (!response.ok) return;
					const meta = await response.json();
					if (typeof meta.stargazers_count === "number") entry.stars = meta.stargazers_count;
					if (typeof meta.created_at === "string") entry.createdAt = meta.created_at;
				} catch {}
			}));
		}
		//#endregion
		//#region src/client/marketplace/controller.ts
		/**
		* Plugin-marketplace controller: multi-source catalog refresh + GitHub
		* auto-discovery + installed-state projection + one-click install (copies the
		* insert YAML). Sources come from the `marketplaceUrl` settings field (see
		* deriveMarketplaceSources): raw manifests are fetched verbatim, GitHub repo
		* URLs are probed for `marketplace.json` and fall back to their repo metadata.
		* Discovery merges the top-starred `dsh-plugin` topic repos afterwards. If
		* every source fails, the failure is recorded per source so the tab can show
		* why instead of rendering a silent empty market.
		*/
		/** Resolve one configured source into entries (repo sources probe then fall back). */
		async function resolveSource(source) {
			if (source.kind === "manifest") return fetchMarketplaceManifest(source.url);
			for (const url of source.probes) {
				const result = await fetchMarketplaceManifest(url);
				if (result.ok) return result;
			}
			return fetchRepoEntry(source.owner, source.repo);
		}
		/** Merge entry lists, deduping by id (first occurrence wins). */
		function mergeEntries(target, extra) {
			const seen = new Set(target.map((entry) => entry.id));
			for (const entry of extra) {
				if (seen.has(entry.id)) continue;
				seen.add(entry.id);
				target.push(entry);
			}
		}
		/** Bridges the catalog + inventory + clipboard onto the tab. */
		var MarketplaceController = class {
			listInstalled;
			getSources;
			getDiscoverGitHub;
			getSort;
			getLimit;
			store;
			/**
			* @param listInstalled - resolves installed npm package names (Host inventory).
			* @param getSources - resolves the configured sources at refresh time (read
			*   lazily so a late-resolving settings scope is picked up).
			* @param getDiscoverGitHub - whether GitHub auto-discovery is enabled.
			* @param getSort - the discovery sort ('stars' | 'date').
			* @param getLimit - how many discovered entries to show.
			*/
			constructor(listInstalled, getSources, getDiscoverGitHub, getSort, getLimit) {
				this.listInstalled = listInstalled;
				this.getSources = getSources;
				this.getDiscoverGitHub = getDiscoverGitHub;
				this.getSort = getSort;
				this.getLimit = getLimit;
				this.store = (0, _deepseek_ai_dsh_client_runtime_client.createSnapshotStore)({
					entries: BUNDLED_MARKETPLACE,
					source: "bundled",
					installed: /* @__PURE__ */ new Set(),
					copiedId: null,
					refreshing: false,
					error: null,
					discoveredTotal: null,
					sort: "stars",
					limit: 30
				});
				this.refreshInstalled();
				this.refreshRemote();
			}
			/** Fetch every source, merge the results, then merge GitHub discovery. */
			async refreshRemote() {
				const sources = this.getSources();
				const discover = this.getDiscoverGitHub();
				const sort = this.getSort();
				const limit = this.getLimit();
				this.store.update((state) => {
					state.refreshing = true;
					state.error = null;
					state.sort = sort;
					state.limit = limit;
				});
				const settled = await Promise.allSettled(sources.map((source) => resolveSource(source)));
				const merged = [];
				const attempts = [];
				for (let index = 0; index < settled.length; index += 1) {
					const source = sources[index];
					const result = settled[index];
					if (source === void 0 || result === void 0) continue;
					if (result.status === "fulfilled" && result.value.ok) mergeEntries(merged, result.value.entries);
					else if (result.status === "fulfilled" && !result.value.ok) attempts.push({
						url: source.label,
						failure: result.value.failure
					});
					else attempts.push({
						url: source.label,
						failure: { code: "network" }
					});
				}
				let discoveryFailure = null;
				let discoveredTotal = null;
				if (discover) {
					const result = await discoverGitHubPlugins(sort, limit);
					if (result.ok) {
						mergeEntries(merged, result.entries);
						discoveredTotal = result.total;
					} else discoveryFailure = result.failure;
				}
				await enrichEntryMetadata(merged);
				if (sort === "stars") merged.sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0) || a.name.localeCompare(b.name));
				else merged.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "") || a.name.localeCompare(b.name));
				this.store.update((state) => {
					state.entries = merged.length > 0 ? merged : BUNDLED_MARKETPLACE;
					state.source = merged.length > 0 ? "remote" : "bundled";
					state.refreshing = false;
					state.discoveredTotal = discoveredTotal;
					if (merged.length === 0) {
						if (discoveryFailure !== null) attempts.push({
							url: "GitHub 发现 (topic:dsh-plugin)",
							failure: discoveryFailure
						});
						state.error = attempts.length > 0 ? { attempts } : null;
					} else state.error = null;
				});
			}
			/** Re-project the Host inventory's installed package names. */
			async refreshInstalled() {
				const installed = new Set(await this.listInstalled());
				this.store.update((state) => {
					state.installed = installed;
				});
			}
			/** Refresh both the catalog and the installed projection (the tab's button + config sync). */
			refresh() {
				this.refreshRemote();
				this.refreshInstalled();
			}
			/** One-click install: copy the insert YAML to the clipboard (paste into the watched profile patch). */
			async install(entry) {
				try {
					await navigator.clipboard.writeText(entry.installYaml);
				} catch {}
				this.store.update((state) => {
					state.copiedId = entry.id;
				});
				this.refreshInstalled();
			}
			/** Wire the controller: expose the tab face. */
			mount() {
				return {
					hooks: { marketplace: this.store },
					install: (entry) => {
						this.install(entry);
					},
					refresh: () => this.refresh()
				};
			}
		};
		//#endregion
		//#region \0dsh-css:D:\ZcodeWorkspace\.zcode\workspace\default\deepseek-harness\packages\client\ui-custom\src\client\marketplace\MarketplaceTab.module.css.mjs
		const css$7 = ".O9Tjia_section{flex-direction:column;gap:12px;display:flex}.O9Tjia_heading{margin:0;font-size:16px;font-weight:600;line-height:24px}.O9Tjia_intro{color:var(--dsw-alias-label-secondary);margin:0;font-size:13px;line-height:20px}.O9Tjia_toolbar{justify-content:space-between;align-items:center;gap:10px;display:flex}.O9Tjia_source{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}.O9Tjia_toolbarRight{align-items:center;gap:8px;display:flex}.O9Tjia_selector{border:1px solid var(--dsw-alias-border-l2);height:28px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border-radius:7px;align-items:center;gap:6px;padding:0 10px;font-size:12px;line-height:28px;display:inline-flex}.O9Tjia_selector:hover{background:var(--dsw-alias-interactive-bg-hover)}.O9Tjia_chevron{color:var(--dsw-alias-label-tertiary);flex:none}.O9Tjia_refresh{border:1px solid var(--dsw-alias-border-l2);height:28px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border-radius:7px;padding:0 12px;font-size:12px;line-height:28px}.O9Tjia_refresh:hover{background:var(--dsw-alias-interactive-bg-hover)}.O9Tjia_list{flex-direction:column;gap:10px;display:flex}.O9Tjia_card{border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb, var(--dsw-alias-bg-base) 78%, transparent);border-radius:12px;align-items:flex-start;gap:12px;padding:12px 14px;display:flex}.O9Tjia_body{flex-direction:column;flex:auto;gap:4px;min-width:0;display:flex}.O9Tjia_nameRow{align-items:center;gap:8px;display:flex}.O9Tjia_name{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:600;line-height:20px}.O9Tjia_badge{color:var(--dsw-alias-state-success-primary);background:color-mix(in srgb, var(--dsw-alias-state-success-primary) 12%, transparent);border-radius:999px;flex:none;padding:1px 8px;font-size:11px;line-height:18px}.O9Tjia_pkg{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px}.O9Tjia_description{color:var(--dsw-alias-label-secondary);font-size:13px;line-height:20px}.O9Tjia_hint{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px}.O9Tjia_actions{flex-direction:column;flex:none;align-items:stretch;gap:6px;display:flex}.O9Tjia_github{border:1px solid var(--dsw-alias-border-l2);height:26px;color:var(--dsw-alias-label-secondary);text-align:center;cursor:pointer;background:0 0;border-radius:7px;padding:0 10px;font-size:12px;line-height:26px;text-decoration:none}.O9Tjia_github:hover{background:var(--dsw-alias-interactive-bg-hover)}.O9Tjia_install{background:var(--dsw-alias-button-primary-fill);height:28px;color:var(--dsw-alias-label-primary-foreground);cursor:pointer;border:none;border-radius:7px;padding:0 14px;font-size:12px;line-height:28px}.O9Tjia_install:hover{background:var(--dsw-alias-button-primary-hover)}.O9Tjia_installInstalled{border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-state-success-primary);cursor:default;background:0 0}.O9Tjia_copied{color:var(--dsw-alias-state-success-primary)}.O9Tjia_error{border:1px solid var(--dsw-alias-state-warn-primary);background:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 8%, transparent);border-radius:12px;flex-direction:column;gap:6px;padding:12px 14px;display:flex}.O9Tjia_errorTitle{color:var(--dsw-alias-state-warn-primary);margin:0;font-size:13px;font-weight:600;line-height:20px}.O9Tjia_errorHint{color:var(--dsw-alias-label-secondary);margin:0;font-size:12px;line-height:18px}.O9Tjia_errorList{flex-direction:column;gap:4px;margin:2px 0 0;padding:0;list-style:none;display:flex}.O9Tjia_errorItem{justify-content:space-between;align-items:baseline;gap:10px;font-size:11px;line-height:16px;display:flex}.O9Tjia_errorUrl{text-overflow:ellipsis;white-space:nowrap;min-width:0;color:var(--dsw-alias-label-tertiary);overflow:hidden}.O9Tjia_errorCode{color:var(--dsw-alias-label-secondary);flex:none}";
		const tagId$7 = "@deepseek-ai/dsh-client-ui-custom/MarketplaceTab.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$7) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-custom";
			tag.dataset.pluginCss = tagId$7;
			tag.textContent = css$7;
			document.head.appendChild(tag);
		}
		var MarketplaceTab_module_css_default = {
			"badge": "O9Tjia_badge",
			"toolbar": "O9Tjia_toolbar",
			"installInstalled": "O9Tjia_installInstalled",
			"refresh": "O9Tjia_refresh",
			"errorUrl": "O9Tjia_errorUrl",
			"error": "O9Tjia_error",
			"name": "O9Tjia_name",
			"toolbarRight": "O9Tjia_toolbarRight",
			"source": "O9Tjia_source",
			"nameRow": "O9Tjia_nameRow",
			"selector": "O9Tjia_selector",
			"github": "O9Tjia_github",
			"list": "O9Tjia_list",
			"hint": "O9Tjia_hint",
			"errorList": "O9Tjia_errorList",
			"description": "O9Tjia_description",
			"section": "O9Tjia_section",
			"errorCode": "O9Tjia_errorCode",
			"intro": "O9Tjia_intro",
			"chevron": "O9Tjia_chevron",
			"pkg": "O9Tjia_pkg",
			"actions": "O9Tjia_actions",
			"install": "O9Tjia_install",
			"card": "O9Tjia_card",
			"errorItem": "O9Tjia_errorItem",
			"errorTitle": "O9Tjia_errorTitle",
			"errorHint": "O9Tjia_errorHint",
			"heading": "O9Tjia_heading",
			"copied": "O9Tjia_copied",
			"body": "O9Tjia_body"
		};
		//#endregion
		//#region src/client/marketplace/MarketplaceTab.tsx
		/** The 插件市场 tab: catalog cards with GitHub links and one-click install. */
		/** Selectable discovery counts. */
		const DISCOVER_LIMITS = [
			10,
			20,
			30,
			50
		];
		/**
		* Render the marketplace tab content.
		* @param props - composed slot props + injected controller face.
		* @returns the tab element tree.
		*/
		function MarketplaceTab({ t, useMarketplace, install, refresh, setDiscoverSort, setDiscoverLimit }) {
			const state = useMarketplace((value) => value);
			const translator = t;
			const [flash, setFlash] = (0, react.useState)(null);
			const [sortOpen, setSortOpen] = (0, react.useState)(false);
			const [limitOpen, setLimitOpen] = (0, react.useState)(false);
			(0, react.useEffect)(() => {
				if (state.copiedId === null) return;
				setFlash(state.copiedId);
				const timer = setTimeout(() => setFlash(null), 2500);
				return () => clearTimeout(timer);
			}, [state.copiedId]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: MarketplaceTab_module_css_default.section,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
						className: MarketplaceTab_module_css_default.heading,
						children: translator("title")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: MarketplaceTab_module_css_default.intro,
						children: translator("intro")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MarketplaceTab_module_css_default.toolbar,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: MarketplaceTab_module_css_default.source,
							children: [
								translator("source"),
								"：",
								translator(state.source === "remote" ? "source.remote" : "source.bundled"),
								state.discoveredTotal !== null && ` · ${translator("total")}：${state.discoveredTotal}`
							]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: MarketplaceTab_module_css_default.toolbarRight,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
									open: sortOpen,
									onClose: () => {
										setSortOpen(false);
									},
									items: [{
										id: "stars",
										label: translator("sort.stars")
									}, {
										id: "date",
										label: translator("sort.date")
									}],
									selectedId: state.sort,
									onSelect: (id) => {
										setSortOpen(false);
										if (id === "stars" || id === "date") setDiscoverSort(id);
									},
									align: "end",
									portal: true,
									anchor: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: MarketplaceTab_module_css_default.selector,
										"aria-haspopup": "menu",
										"aria-expanded": sortOpen,
										onClick: () => {
											setSortOpen((value) => !value);
										},
										children: [translator(state.sort === "date" ? "sort.date" : "sort.stars"), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, { className: MarketplaceTab_module_css_default.chevron })]
									})
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
									open: limitOpen,
									onClose: () => {
										setLimitOpen(false);
									},
									items: DISCOVER_LIMITS.map((count) => ({
										id: String(count),
										label: String(count)
									})),
									selectedId: String(state.limit),
									onSelect: (id) => {
										setLimitOpen(false);
										const count = Number(id);
										if (Number.isFinite(count)) setDiscoverLimit(count);
									},
									align: "end",
									portal: true,
									anchor: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: MarketplaceTab_module_css_default.selector,
										"aria-haspopup": "menu",
										"aria-expanded": limitOpen,
										onClick: () => {
											setLimitOpen((value) => !value);
										},
										children: [String(state.limit), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, { className: MarketplaceTab_module_css_default.chevron })]
									})
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: MarketplaceTab_module_css_default.refresh,
									onClick: refresh,
									disabled: state.refreshing,
									children: state.refreshing ? translator("refreshing") : translator("refresh")
								})
							]
						})]
					}),
					state.error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MarketplaceTab_module_css_default.error,
						role: "alert",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: MarketplaceTab_module_css_default.errorTitle,
								children: translator("error")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: MarketplaceTab_module_css_default.errorHint,
								children: translator("errorHint")
							}),
							state.error.attempts.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
								className: MarketplaceTab_module_css_default.errorList,
								children: state.error.attempts.map((attempt) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
									className: MarketplaceTab_module_css_default.errorItem,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: MarketplaceTab_module_css_default.errorUrl,
										children: attempt.url
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: MarketplaceTab_module_css_default.errorCode,
										children: [translator(attempt.failure.code === "network" ? "errorNetwork" : attempt.failure.code === "http" ? "errorHttp" : "errorInvalid"), attempt.failure.code === "http" && "status" in attempt.failure ? ` (${attempt.failure.status})` : ""]
									})]
								}, attempt.url))
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: MarketplaceTab_module_css_default.list,
						children: state.entries.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: MarketplaceTab_module_css_default.intro,
							children: translator("empty")
						}) : state.entries.map((entry) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MarketplaceCard, {
							entry,
							installed: state.installed.has(entry.package),
							copied: flash === entry.id,
							t: translator,
							onInstall: install
						}, entry.id))
					})
				]
			});
		}
		/** One marketplace card. */
		function MarketplaceCard({ entry, installed, copied, t, onInstall }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: MarketplaceTab_module_css_default.card,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: MarketplaceTab_module_css_default.body,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: MarketplaceTab_module_css_default.nameRow,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: MarketplaceTab_module_css_default.name,
								children: entry.name
							}), installed && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: MarketplaceTab_module_css_default.badge,
								children: t("installed")
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: MarketplaceTab_module_css_default.pkg,
							children: entry.package
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: MarketplaceTab_module_css_default.description,
							children: entry.description
						}),
						copied && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: `${MarketplaceTab_module_css_default.hint} ${MarketplaceTab_module_css_default.copied}`,
							children: t("copied")
						}),
						!installed && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: MarketplaceTab_module_css_default.hint,
							children: t("installHint")
						})
					]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: MarketplaceTab_module_css_default.actions,
					children: [entry.repoUrl !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
						className: MarketplaceTab_module_css_default.github,
						href: entry.repoUrl,
						target: "_blank",
						rel: "noreferrer",
						children: t("openOnGitHub")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: installed ? `${MarketplaceTab_module_css_default.install} ${MarketplaceTab_module_css_default.installInstalled}` : MarketplaceTab_module_css_default.install,
						disabled: installed,
						onClick: () => onInstall(entry),
						children: copied ? t("copied") : installed ? t("installed") : t("install")
					})]
				})]
			});
		}
		//#endregion
		//#region src/client/history/history-locales.ts
		/** Copy for the conversation-history strip, its toggle, and the General-settings row. */
		/** Dictionary namespace owned by the history surface. */
		const HISTORY_NS = "history";
		/** Simplified Chinese copy. */
		const zh$2 = {
			title: "历史记录",
			open: "历史",
			close: "关闭",
			noText: "（无文本）",
			jumpSegment: "跳转到该段对话",
			positionTitle: "历史条位置",
			positionDesc: "选择侧边历史条的位置；选择「关闭」后不显示历史条。",
			positionLeft: "左侧",
			positionRight: "右侧",
			positionOff: "关闭",
			limitTitle: "历史记录条数",
			limitDesc: "侧边历史条显示最近多少条记录；「全部」显示完整历史。",
			limit5: "最近 5 条",
			limit10: "最近 10 条",
			limit20: "最近 20 条",
			limitAll: "全部",
			justNow: "刚刚",
			minutes: "{n} 分钟前",
			hours: "{n} 小时前",
			days: "{n} 天前",
			date: "{m}月{d}日"
		};
		/** English copy. */
		const en$2 = {
			title: "History",
			open: "History",
			close: "Close",
			noText: "(no text)",
			jumpSegment: "Jump to this conversation segment",
			positionTitle: "History bar position",
			positionDesc: "Choose where the side history bar sits; \"Off\" hides it.",
			positionLeft: "Left",
			positionRight: "Right",
			positionOff: "Off",
			limitTitle: "History bar count",
			limitDesc: "How many recent records the side history bar shows; \"All\" shows the full history.",
			limit5: "Last 5",
			limit10: "Last 10",
			limit20: "Last 20",
			limitAll: "All",
			justNow: "just now",
			minutes: "{n}m ago",
			hours: "{n}h ago",
			days: "{n}d ago",
			date: "{m}/{d}"
		};
		//#endregion
		//#region src/client/history/turns.ts
		/** Preview length cap before ellipsis. */
		const PREVIEW_LIMIT = 60;
		/** Read a text block's text defensively. Content blocks carry `type: 'text'`,
		* assistant blocks carry `kind: 'text'` — accept both shapes. */
		function blockText(block) {
			if (typeof block !== "object" || block === null) return null;
			const candidate = block;
			return (candidate.type === "text" || candidate.kind === "text") && typeof candidate.text === "string" ? candidate.text : null;
		}
		/** Join block texts into one whitespace-normalized preview, capped + ellipsized. */
		function joinPreview(chunks) {
			const text = chunks.map(blockText).filter((chunk) => chunk !== null).join(" ").replace(/\s+/g, " ").trim();
			return text.length > PREVIEW_LIMIT ? `${text.slice(0, PREVIEW_LIMIT)}…` : text;
		}
		/**
		* First text preview of a chat node payload: user/steering messages carry
		* `content` blocks, assistant messages carry `blocks`. Everything else reads
		* as ''. Structural narrowing only — never throws on unknown payload shapes.
		*/
		function previewOfNode(kind, data) {
			if (typeof data !== "object" || data === null) return "";
			const payload = data;
			if (kind === "user" || kind === "steering") return Array.isArray(payload.content) ? joinPreview(payload.content) : "";
			if (kind === "assistant") return Array.isArray(payload.blocks) ? joinPreview(payload.blocks) : "";
			return "";
		}
		/** The turn number a node belongs to, from its engine location ('' path = none). */
		function nodeTurn(node) {
			const location = node.location;
			if (typeof location !== "object" || location === null) return void 0;
			const loc = location;
			if (loc.kind !== "turn" && loc.kind !== "step") return void 0;
			const turn = loc.turn?.turn;
			return typeof turn === "number" ? turn : void 0;
		}
		/**
		* Build the mounted history list from a Chat snapshot. Rows open at
		* user/steering messages; the turn start time (when resolvable) rides along.
		* Only nodes currently mounted in the window are listed — older paginated
		* history is reachable through the window pager (see HistoryStrip).
		*/
		function buildTurns(snapshot) {
			const turns = [];
			for (const key of snapshot.order) {
				const node = snapshot.nodes.get(key);
				if (node === void 0) continue;
				if (node.kind !== "user" && node.kind !== "steering") continue;
				const turnNumber = nodeTurn(node);
				const time = turnNumber === void 0 ? void 0 : snapshot.legacy.turnTimings.get(turnNumber)?.startTime;
				turns.push({
					key,
					index: turns.length + 1,
					question: previewOfNode(node.kind, node.data),
					time,
					turn: turnNumber
				});
			}
			return turns;
		}
		/**
		* The strip's visible turns: the recent-turns limit applied to the
		* NON-pinned turns, with every pinned turn merged back at its natural
		* position (pinned turns ignore the count limit). A zero limit shows all
		* turns. The result keeps the window's chronological order.
		* @param turns - all mounted turns (in window order).
		* @param limit - recent-turns count (0 = show all).
		* @param pinned - pinned turn numbers for the current session.
		* @returns the visible turns, in window order.
		*/
		function mergeVisibleTurns(turns, limit, pinned) {
			if (limit <= 0) return [...turns];
			const pinnedTurns = turns.filter((turn) => turn.turn !== void 0 && pinned.has(turn.turn));
			const rest = turns.filter((turn) => turn.turn === void 0 || !pinned.has(turn.turn));
			return [...pinnedTurns, ...rest.slice(-limit)].sort((a, b) => a.index - b.index);
		}
		/** Locate the mounted chat row for a node key (opaque engine key). */
		function findAnchorRow(key) {
			for (const row of document.querySelectorAll("[data-chat-anchor-key]")) if (row.dataset.chatAnchorKey === key) return row;
			return null;
		}
		/**
		* Smoothly scroll the conversation to a turn and flash a transient accent
		* marker on its row. No-op when the row is not mounted (paged out).
		* @param key - the turn's chat node key.
		*/
		function jumpToTurn(key) {
			const row = findAnchorRow(key);
			if (row === null) return;
			row.scrollIntoView({
				behavior: "smooth",
				block: "start"
			});
			const previousShadow = row.style.boxShadow;
			row.style.transition = "box-shadow 240ms ease";
			row.style.boxShadow = "inset 3px 0 0 0 var(--dsu-accent, var(--dsw-alias-brand-primary))";
			window.setTimeout(() => {
				row.style.boxShadow = previousShadow;
				row.style.transition = "";
			}, 1600);
		}
		/**
		* Pick the turn the reader is currently in: the last turn whose chat row top
		* has scrolled past the reading offset (below the app header). Falls back to
		* the topmost mounted row when none has reached the offset, so the history
		* always highlights one row while the conversation is on screen.
		* @param keys - turn keys, in history order.
		* @returns the current turn key, or null when no turn row is mounted.
		*/
		function currentTurnKey(keys) {
			const OFFSET = 120;
			const byKey = /* @__PURE__ */ new Map();
			for (const row of document.querySelectorAll("[data-chat-anchor-key]")) {
				const key = row.dataset.chatAnchorKey;
				if (key !== void 0) byKey.set(key, row);
			}
			let current = null;
			let topmost = null;
			for (const key of keys) {
				const row = byKey.get(key);
				if (row === void 0) continue;
				const top = row.getBoundingClientRect().top;
				if (topmost === null || top < topmost.top) topmost = {
					key,
					top
				};
				if (top <= OFFSET) current = key;
			}
			return current ?? topmost?.key ?? null;
		}
		//#endregion
		//#region \0dsh-css:D:\ZcodeWorkspace\.zcode\workspace\default\deepseek-harness\packages\client\ui-custom\src\client\history\HistoryStrip.module.css.mjs
		const css$6 = "._50pA8a_strip{z-index:50;pointer-events:auto;box-shadow:none;background:0 0;border:none;flex-direction:column;gap:5px;padding:8px 2px;display:flex;position:fixed;top:50%;translate:0 -50%}._50pA8a_stripRight{align-items:flex-end;right:12px}._50pA8a_stripLeft{align-items:flex-start;left:12px}._50pA8a_bar{background:var(--dsw-alias-border-l2);cursor:pointer;border:none;border-radius:3px;flex:none;height:5px;transition:width .2s cubic-bezier(.2,.7,.3,1.1),background .2s}._50pA8a_bar:hover,._50pA8a_bar:focus-visible{outline:none}._50pA8a_barPinned{background:color-mix(in srgb, var(--dsu-accent,var(--dsw-alias-brand-primary)) 25%, transparent);box-shadow:inset 0 0 0 1.5px var(--dsu-accent,var(--dsw-alias-brand-primary))}._50pA8a_barActive{background:color-mix(in srgb, var(--dsu-accent,var(--dsw-alias-brand-primary)) 55%, transparent)}._50pA8a_barPeak{background:var(--dsu-accent,var(--dsw-alias-brand-primary))}._50pA8a_barNear{background:color-mix(in srgb, var(--dsu-accent,var(--dsw-alias-brand-primary)) 50%, transparent)}._50pA8a_barFar{background:color-mix(in srgb, var(--dsu-accent,var(--dsw-alias-brand-primary)) 28%, transparent)}._50pA8a_tooltip{z-index:60;background:color-mix(in srgb, var(--dsu-accent,var(--dsw-alias-brand-primary)) 6%, var(--dsw-alias-bg-overlay));border:1px solid var(--dsw-alias-border-l2);pointer-events:none;border-radius:8px;align-items:center;gap:7px;width:220px;padding:7px 11px;animation:.16s _50pA8a_dshTooltipInRight;display:flex;position:fixed;right:64px;transform:translateY(-50%);box-shadow:0 4px 16px #00000040}._50pA8a_tooltipLeft{animation:.16s _50pA8a_dshTooltipInLeft;right:auto}@keyframes _50pA8a_dshTooltipInRight{0%{opacity:0;transform:translateY(-50%)translate(4px)}to{opacity:1;transform:translateY(-50%)translate(0)}}@keyframes _50pA8a_dshTooltipInLeft{0%{opacity:0;transform:translateY(-50%)translate(-4px)}to{opacity:1;transform:translateY(-50%)translate(0)}}._50pA8a_tooltipDot{background:var(--dsu-accent,var(--dsw-alias-brand-primary));border-radius:50%;flex:none;width:6px;height:6px}._50pA8a_tooltipText{min-width:0;color:var(--dsw-alias-label-primary);-webkit-line-clamp:2;-webkit-box-orient:vertical;flex:1;font-size:12px;line-height:17px;display:-webkit-box;overflow:hidden}";
		const tagId$6 = "@deepseek-ai/dsh-client-ui-custom/HistoryStrip.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$6) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-custom";
			tag.dataset.pluginCss = tagId$6;
			tag.textContent = css$6;
			document.head.appendChild(tag);
		}
		var HistoryStrip_module_css_default = {
			"bar": "_50pA8a_bar",
			"tooltipLeft": "_50pA8a_tooltipLeft",
			"barPinned": "_50pA8a_barPinned",
			"dshTooltipInRight": "_50pA8a_dshTooltipInRight",
			"barActive": "_50pA8a_barActive",
			"stripRight": "_50pA8a_stripRight",
			"barNear": "_50pA8a_barNear",
			"stripLeft": "_50pA8a_stripLeft",
			"strip": "_50pA8a_strip",
			"barPeak": "_50pA8a_barPeak",
			"tooltip": "_50pA8a_tooltip",
			"tooltipDot": "_50pA8a_tooltipDot",
			"dshTooltipInLeft": "_50pA8a_dshTooltipInLeft",
			"barFar": "_50pA8a_barFar",
			"tooltipText": "_50pA8a_tooltipText"
		};
		//#endregion
		//#region src/client/history/HistoryStrip.tsx
		/**
		* The conversation-blended history strip. Mounted in the (always-mounted,
		* zero-width when closed) details column, but renders `position: fixed`
		* floating content over the conversation's edge — so it reads as part
		* of the body, with no separate panel or column. Session-scoped, so it reads
		* the conversation through the reliable `useSession` hook.
		*
		* Side is a settings choice. The two sides mirror each other: bars align to
		* the strip's outer edge and grow inward on hover (peak/wave), and the
		* tooltip sits on the strip's inner side. The right strip anchors to the
		* conversation's right edge (the viewport's, details closed); the left strip
		* anchors to its left edge — the rendered sidebar width, measured from the
		* AppFrame grid so a dragged or collapsed sidebar re-anchors it live.
		*
		* Idle bars are small and equal; hovering one stretches it and tapers the
		* neighbours into a peak/wave silhouette with the appearance accent. Clicking
		* a bar jumps to that turn. The mounted window pages backwards until the
		* strip has enough turns — the recent-turns limit, or the visual fill cap
		* for "all": beyond ~MAX_STRIP_TURNS the bars are sub-pixel and not
		* individually clickable, so the pager stops there instead of loading the
		* whole conversation on open (the startup-jank source). Empty sessions render
		* nothing.
		*/
		/** Bar width % by distance from the hovered bar (the wave silhouette). */
		const WAVE_WIDTH = {
			0: 100,
			1: 62,
			2: 40,
			3: 24
		};
		/** Idle width % — the active turn is slightly longer than the rest. */
		const IDLE_CURRENT = 68;
		const IDLE_REST = 34;
		/** Strip width in px (bars are % of it). */
		const STRIP_WIDTH = 60;
		/** Edge margin from the conversation's edge (both sides). */
		const EDGE_MARGIN = 12;
		/** Tooltip gap from the strip's inner edge. */
		const TOOLTIP_GAP = 8;
		/**
		* Max turns the strip ever pages for: strip height ÷ bar pitch is ~100 bars
		* on a tall viewport, beyond which each bar is sub-pixel (and not separately
		* clickable). Capping the pager here bounds the "all" load to a handful of
		* loadOlder rounds instead of the whole conversation — the startup-jank fix.
		*/
		const MAX_STRIP_TURNS = 120;
		/** Delay between full-history pager batches (keeps a refresh smooth). */
		const THROTTLE_MS = 300;
		/** Max older-history batches auto-loaded per mount (safety net; the turn cap usually stops earlier). */
		const MAX_BATCHES = 24;
		/**
		* Render the wave history strip for the current session.
		* @param props - framework session hooks + injected close/pager actions + locale.
		*/
		function HistoryStrip({ useSession, loadOlder, sessionId, useHistoryLimit, useHistoryPosition, usePinnedTurns, t }) {
			const chat = useSession((s) => s.chat);
			const blank = useSession((s) => s.blank);
			const openState = useSession((s) => s.openState);
			const hasMore = useSession((s) => s.hasMore);
			const loadingOlder = useSession((s) => s.loadingOlder);
			const historyLimit = useHistoryLimit((value) => value)?.value?.historyLimit ?? 10;
			const position = useHistoryPosition((value) => value)?.value?.historyPosition ?? "off";
			const pinnedScope = usePinnedTurns((value) => value);
			const pinnedNumbers = (0, react.useMemo)(() => {
				const set = /* @__PURE__ */ new Set();
				for (const turn of pinnedScope?.value?.pinnedTurns?.[sessionId] ?? []) set.add(turn);
				return set;
			}, [pinnedScope, sessionId]);
			const allTurns = (0, react.useMemo)(() => blank || position === "off" ? [] : buildTurns(chat), [
				chat,
				blank,
				position
			]);
			const turns = (0, react.useMemo)(() => mergeVisibleTurns(allTurns, historyLimit, pinnedNumbers), [
				allTurns,
				historyLimit,
				pinnedNumbers
			]);
			const [activeKey, setActiveKey] = (0, react.useState)(null);
			const [hovered, setHovered] = (0, react.useState)(null);
			const [tooltipY, setTooltipY] = (0, react.useState)(0);
			const loadOlderRef = (0, react.useRef)(loadOlder);
			loadOlderRef.current = loadOlder;
			const loadedBatches = (0, react.useRef)(0);
			const stripRef = (0, react.useRef)(null);
			const [conversationLeft, setConversationLeft] = (0, react.useState)(null);
			(0, react.useLayoutEffect)(() => {
				const el = stripRef.current;
				if (el === null) return;
				let frame = el;
				while (frame !== null && frame.style.gridTemplateColumns === "") frame = frame.parentElement;
				if (frame === null) return;
				const measure = () => {
					const sidebar = frame?.children[0];
					if (sidebar === void 0) return;
					const width = sidebar.getBoundingClientRect().width;
					setConversationLeft((previous) => previous !== null && Math.abs(previous - width) <= 1 ? previous : width);
				};
				measure();
				const observer = new ResizeObserver(measure);
				observer.observe(frame);
				return () => observer.disconnect();
			}, [
				position,
				blank,
				turns.length === 0
			]);
			const target = historyLimit > 0 ? Math.min(historyLimit, MAX_STRIP_TURNS) : MAX_STRIP_TURNS;
			const unpinnedCount = (0, react.useMemo)(() => allTurns.filter((turn) => turn.turn === void 0 || !pinnedNumbers.has(turn.turn)).length, [allTurns, pinnedNumbers]);
			const pinnedMissing = (0, react.useMemo)(() => {
				if (pinnedNumbers.size === 0) return false;
				const loaded = /* @__PURE__ */ new Set();
				for (const turn of allTurns) if (turn.turn !== void 0) loaded.add(turn.turn);
				for (const turn of pinnedNumbers) if (!loaded.has(turn)) return true;
				return false;
			}, [allTurns, pinnedNumbers]);
			const pagerDone = unpinnedCount >= target && !pinnedMissing;
			(0, react.useEffect)(() => {
				if (position === "off") return;
				if (openState !== "open" || !hasMore || loadingOlder) return;
				if (pagerDone) return;
				if (loadedBatches.current >= MAX_BATCHES) return;
				const timer = setTimeout(() => {
					loadedBatches.current += 1;
					loadOlderRef.current();
				}, THROTTLE_MS);
				return () => clearTimeout(timer);
			}, [
				position,
				openState,
				hasMore,
				loadingOlder,
				pagerDone
			]);
			(0, react.useEffect)(() => {
				if (position === "off" || turns.length === 0) return;
				let raf = 0;
				const keys = turns.map((turn) => turn.key);
				const compute = () => {
					raf = 0;
					setActiveKey(currentTurnKey(keys));
				};
				const onScroll = () => {
					if (raf === 0) raf = requestAnimationFrame(compute);
				};
				compute();
				document.addEventListener("scroll", onScroll, true);
				window.addEventListener("resize", onScroll);
				return () => {
					document.removeEventListener("scroll", onScroll, true);
					window.removeEventListener("resize", onScroll);
					if (raf !== 0) cancelAnimationFrame(raf);
				};
			}, [turns, position]);
			if (blank || turns.length === 0 || position === "off") return null;
			const translator = t;
			const clearHover = () => setHovered(null);
			const leftAnchor = (conversationLeft ?? 0) + EDGE_MARGIN;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				ref: stripRef,
				className: `${HistoryStrip_module_css_default.strip} ${position === "left" ? HistoryStrip_module_css_default.stripLeft : HistoryStrip_module_css_default.stripRight}`,
				style: {
					width: STRIP_WIDTH,
					...position === "left" && conversationLeft !== null ? { left: leftAnchor } : {}
				},
				onMouseLeave: clearHover,
				children: [hovered !== null && (0, react_dom.createPortal)(/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: `${HistoryStrip_module_css_default.tooltip} ${position === "left" ? HistoryStrip_module_css_default.tooltipLeft : ""}`,
					style: {
						top: Math.max(48, Math.min(tooltipY, window.innerHeight - 48)),
						...position === "left" && conversationLeft !== null ? { left: leftAnchor + STRIP_WIDTH + TOOLTIP_GAP } : {}
					},
					role: "tooltip",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: HistoryStrip_module_css_default.tooltipDot,
						"aria-hidden": true
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: HistoryStrip_module_css_default.tooltipText,
						children: turns[hovered]?.question || translator("noText")
					})]
				}), document.body), turns.map((turn, index) => {
					const isActive = activeKey === turn.key;
					const isPinned = turn.turn !== void 0 && pinnedNumbers.has(turn.turn);
					const width = hovered === null ? isActive ? IDLE_CURRENT : IDLE_REST : WAVE_WIDTH[Math.min(3, Math.abs(index - hovered))] ?? IDLE_REST;
					const level = hovered === null ? -1 : Math.min(3, Math.abs(index - hovered));
					return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: [
							HistoryStrip_module_css_default.bar,
							isPinned ? HistoryStrip_module_css_default.barPinned : "",
							hovered !== null && level === 0 ? HistoryStrip_module_css_default.barPeak : "",
							hovered !== null && level === 1 ? HistoryStrip_module_css_default.barNear : "",
							hovered !== null && level === 2 ? HistoryStrip_module_css_default.barFar : "",
							isActive ? HistoryStrip_module_css_default.barActive : ""
						].filter(Boolean).join(" "),
						style: { width: `${width}%` },
						onMouseEnter: (event) => {
							setHovered(index);
							setTooltipY(event.currentTarget.getBoundingClientRect().top);
						},
						onClick: () => jumpToTurn(turn.key),
						"aria-label": translator("jumpSegment")
					}, turn.key);
				})]
			});
		}
		//#endregion
		//#region \0dsh-css:D:\ZcodeWorkspace\.zcode\workspace\default\deepseek-harness\packages\client\ui-custom\src\client\history\HistoryPositionRow.module.css.mjs
		const css$5 = "._8rwA8q_row{border-bottom:1px solid var(--dsw-alias-border-l2);align-items:center;gap:8px;padding:16px 0;display:flex}._8rwA8q_rowText{flex-direction:column;flex:1;gap:4px;min-width:0;padding-right:48px;display:flex}._8rwA8q_title{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:400;line-height:22px}._8rwA8q_desc{color:var(--dsw-alias-label-tertiary);font-size:12px;font-weight:400;line-height:18px}._8rwA8q_selector{background:var(--dsw-alias-bg-module-platform);height:36px;font:inherit;color:var(--dsw-alias-label-primary);cursor:pointer;border:none;border-radius:18px;align-items:center;gap:12px;padding:0 14px;font-size:14px;line-height:22px;display:inline-flex}._8rwA8q_selector:hover{background:var(--dsw-alias-interactive-bg-hover)}._8rwA8q_chevron{flex:none}";
		const tagId$5 = "@deepseek-ai/dsh-client-ui-custom/HistoryPositionRow.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$5) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-custom";
			tag.dataset.pluginCss = tagId$5;
			tag.textContent = css$5;
			document.head.appendChild(tag);
		}
		var HistoryPositionRow_module_css_default = {
			"title": "_8rwA8q_title",
			"row": "_8rwA8q_row",
			"desc": "_8rwA8q_desc",
			"rowText": "_8rwA8q_rowText",
			"chevron": "_8rwA8q_chevron",
			"selector": "_8rwA8q_selector"
		};
		//#endregion
		//#region src/client/history/HistoryPositionRow.tsx
		/**
		* General-settings row: where the floating history strip sits (left / right /
		* off). Reads/writes the ui-custom settings scope's `historyPosition`; the
		* strip's count selector (HistoryLimitRow) only appears while this is not
		* 'off'.
		*/
		/** The selectable sides, in display order (the default is the middle one). */
		const OPTIONS$1 = [
			{
				id: "left",
				label: "positionLeft"
			},
			{
				id: "right",
				label: "positionRight"
			},
			{
				id: "off",
				label: "positionOff"
			}
		];
		/**
		* Render the history bar position selector.
		* @param props - composed Settings slot props.
		*/
		function HistoryPositionRow({ useHistoryPosition, setHistoryPosition, t }) {
			const scope = useHistoryPosition((value) => value);
			const [open, setOpen] = (0, react.useState)(false);
			const position = scope?.value?.historyPosition ?? "off";
			const translator = t;
			const selectedLabel = (OPTIONS$1.find((option) => option.id === position) ?? OPTIONS$1[1]).label;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: HistoryPositionRow_module_css_default.row,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: HistoryPositionRow_module_css_default.rowText,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: HistoryPositionRow_module_css_default.title,
						children: translator("positionTitle")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: HistoryPositionRow_module_css_default.desc,
						children: translator("positionDesc")
					})]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
					open,
					onClose: () => {
						setOpen(false);
					},
					items: OPTIONS$1.map((option) => ({
						id: option.id,
						label: translator(option.label)
					})),
					selectedId: position,
					onSelect: (id) => {
						setOpen(false);
						if (HISTORY_POSITIONS.includes(id)) setHistoryPosition(id);
					},
					align: "end",
					portal: true,
					anchor: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: HistoryPositionRow_module_css_default.selector,
						"aria-haspopup": "menu",
						"aria-expanded": open,
						onClick: () => {
							setOpen((value) => !value);
						},
						children: [translator(selectedLabel), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, { className: HistoryPositionRow_module_css_default.chevron })]
					})
				})]
			});
		}
		//#endregion
		//#region \0dsh-css:D:\ZcodeWorkspace\.zcode\workspace\default\deepseek-harness\packages\client\ui-custom\src\client\history\HistoryLimitRow.module.css.mjs
		const css$4 = ".rLxJ5G_row{border-bottom:1px solid var(--dsw-alias-border-l2);align-items:center;gap:8px;padding:16px 0;display:flex}.rLxJ5G_rowText{flex-direction:column;flex:1;gap:4px;min-width:0;padding-right:48px;display:flex}.rLxJ5G_title{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:400;line-height:22px}.rLxJ5G_desc{color:var(--dsw-alias-label-tertiary);font-size:12px;font-weight:400;line-height:18px}.rLxJ5G_selector{background:var(--dsw-alias-bg-module-platform);height:36px;font:inherit;color:var(--dsw-alias-label-primary);cursor:pointer;border:none;border-radius:18px;align-items:center;gap:12px;padding:0 14px;font-size:14px;line-height:22px;display:inline-flex}.rLxJ5G_selector:hover{background:var(--dsw-alias-interactive-bg-hover)}.rLxJ5G_chevron{flex:none}";
		const tagId$4 = "@deepseek-ai/dsh-client-ui-custom/HistoryLimitRow.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$4) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-custom";
			tag.dataset.pluginCss = tagId$4;
			tag.textContent = css$4;
			document.head.appendChild(tag);
		}
		var HistoryLimitRow_module_css_default = {
			"desc": "rLxJ5G_desc",
			"chevron": "rLxJ5G_chevron",
			"selector": "rLxJ5G_selector",
			"row": "rLxJ5G_row",
			"rowText": "rLxJ5G_rowText",
			"title": "rLxJ5G_title"
		};
		//#endregion
		//#region src/client/history/HistoryLimitRow.tsx
		/**
		* General-settings row: how many recent turns the history strip shows.
		* Reads/writes the ui-custom settings scope's `historyLimit` (0 = all).
		*/
		/** The selectable limits: 0 is the "all" sentinel. */
		const OPTIONS = [
			{
				id: 5,
				label: "limit5"
			},
			{
				id: 10,
				label: "limit10"
			},
			{
				id: 20,
				label: "limit20"
			},
			{
				id: 0,
				label: "limitAll"
			}
		];
		/**
		* Render the history bar count selector. Hidden entirely while the strip is
		* turned off (historyPosition = 'off'); the hooks above stay ordered before
		* the conditional return.
		* @param props - composed Settings slot props.
		*/
		function HistoryLimitRow({ useHistoryLimit, setHistoryLimit, t }) {
			const scope = useHistoryLimit((value) => value);
			const [open, setOpen] = (0, react.useState)(false);
			if ((scope?.value?.historyPosition ?? "off") === "off") return null;
			const limit = scope?.value?.historyLimit ?? 10;
			const translator = t;
			const selectedLabel = (OPTIONS.find((option) => option.id === limit) ?? OPTIONS[OPTIONS.length - 1]).label;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: HistoryLimitRow_module_css_default.row,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: HistoryLimitRow_module_css_default.rowText,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: HistoryLimitRow_module_css_default.title,
						children: translator("limitTitle")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: HistoryLimitRow_module_css_default.desc,
						children: translator("limitDesc")
					})]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
					open,
					onClose: () => {
						setOpen(false);
					},
					items: OPTIONS.map((option) => ({
						id: String(option.id),
						label: translator(option.label)
					})),
					selectedId: String(limit),
					onSelect: (id) => {
						setOpen(false);
						setHistoryLimit(Number(id));
					},
					align: "end",
					portal: true,
					anchor: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: HistoryLimitRow_module_css_default.selector,
						"aria-haspopup": "menu",
						"aria-expanded": open,
						onClick: () => {
							setOpen((value) => !value);
						},
						children: [translator(selectedLabel), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, { className: HistoryLimitRow_module_css_default.chevron })]
					})
				})]
			});
		}
		//#endregion
		//#region src/client/pin/pin-locales.ts
		/** Simplified Chinese copy. */
		const zh$1 = {
			pin: "悬挂该段对话",
			pinActive: "取消悬挂",
			pinHint: "悬挂后该段对话无视条数限制，始终显示在历史条中"
		};
		/** English copy. */
		const en$1 = {
			pin: "Pin this segment",
			pinActive: "Unpin",
			pinHint: "Pinned segments always show in the history bar, ignoring the count limit"
		};
		//#endregion
		//#region \0dsh-css:D:\ZcodeWorkspace\.zcode\workspace\default\deepseek-harness\packages\client\ui-custom\src\client\pin\PinTurnAction.module.css.mjs
		const css$3 = ".lnBRKq_action{width:28px;height:28px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:none;border-radius:28px;justify-content:center;align-items:center;padding:6px;display:inline-flex}.lnBRKq_action:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary)}.lnBRKq_action[data-active]{color:var(--dsu-accent,var(--dsw-alias-brand-primary))}";
		const tagId$3 = "@deepseek-ai/dsh-client-ui-custom/PinTurnAction.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$3) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-custom";
			tag.dataset.pluginCss = tagId$3;
			tag.textContent = css$3;
			document.head.appendChild(tag);
		}
		var PinTurnAction_module_css_default = { "action": "lnBRKq_action" };
		//#endregion
		//#region src/client/pin/PinTurnAction.tsx
		/**
		* Per-message pin ("悬挂") control, rendered in the assistant message's
		* IconActions row (between copy and branch, via the
		* conversation.chat.assistant-actions slot). Pinning a turn makes its history
		* bar ignore the strip's count limit and marks it with the theme-accent
		* frame. Only renders while the history strip is enabled (historyPosition
		* ≠ 'off') — with the strip hidden there is nothing to pin to.
		*/
		/** A location-pin glyph (filled, matches the ic_ds_* icon chrome). */
		function PinIcon({ size = 16, className }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				width: size,
				height: size,
				className,
				viewBox: "0 0 24 24",
				fill: "none",
				xmlns: "http://www.w3.org/2000/svg",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					fillRule: "evenodd",
					clipRule: "evenodd",
					d: "M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z",
					fill: "currentColor"
				})
			});
		}
		/**
		* Render the pin toggle for one turn's assistant message.
		* @param props - owner turn/message identity + injected scope face + locale.
		*/
		function PinTurnAction({ turn, sessionId, usePosition, usePinnedTurns, togglePin, t }) {
			const position = usePosition((value) => value)?.value?.historyPosition ?? "off";
			const pinned = (usePinnedTurns((value) => value)?.value?.pinnedTurns?.[sessionId] ?? []).includes(turn);
			if (position === "off") return null;
			const label = pinned ? t("pinActive") : t("pin");
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
				label,
				side: "bottom",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: PinTurnAction_module_css_default.action,
					"aria-label": label,
					"aria-pressed": pinned,
					"data-active": pinned || void 0,
					onClick: () => {
						togglePin(turn);
					},
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PinIcon, {})
				})
			});
		}
		//#endregion
		//#region src/client/markdown/markdown-locales.ts
		/** Copy for the Markdown-rendering toggle in General settings. */
		/** Dictionary namespace owned by the user-markdown surface. */
		const MARKDOWN_NS = "markdown";
		/** Simplified Chinese copy. */
		const zh = {
			renderTitle: "Markdown 渲染",
			renderDesc: "你发送的消息以 Markdown 格式渲染（标题、列表、代码块等）；关闭后按纯文本显示。"
		};
		/** English copy. */
		const en = {
			renderTitle: "Markdown rendering",
			renderDesc: "Render the messages you send as Markdown (headings, lists, code blocks); off = plain text."
		};
		//#endregion
		//#region \0dsh-css:D:\ZcodeWorkspace\.zcode\workspace\default\deepseek-harness\packages\client\ui-custom\src\client\markdown\MarkdownRenderRow.module.css.mjs
		const css$2 = ".iSDaoW_row{justify-content:space-between;align-items:center;gap:16px;padding:12px 0;display:flex}.iSDaoW_rowText{min-width:0}.iSDaoW_title{color:var(--dsw-alias-label-primary);font-size:13px;line-height:20px}.iSDaoW_desc{color:var(--dsw-alias-label-tertiary);margin-top:2px;font-size:12px;line-height:18px}.iSDaoW_switch{flex:none;align-items:center;display:inline-flex}.iSDaoW_checkbox{width:16px;height:16px;accent-color:var(--dsw-alias-brand-primary);cursor:pointer}";
		const tagId$2 = "@deepseek-ai/dsh-client-ui-custom/MarkdownRenderRow.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$2) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-custom";
			tag.dataset.pluginCss = tagId$2;
			tag.textContent = css$2;
			document.head.appendChild(tag);
		}
		var MarkdownRenderRow_module_css_default = {
			"title": "iSDaoW_title",
			"switch": "iSDaoW_switch",
			"row": "iSDaoW_row",
			"desc": "iSDaoW_desc",
			"checkbox": "iSDaoW_checkbox",
			"rowText": "iSDaoW_rowText"
		};
		//#endregion
		//#region src/client/markdown/MarkdownRenderRow.tsx
		/**
		* Render the Markdown-rendering toggle row.
		* @param props - composed Settings slot props.
		*/
		function MarkdownRenderRow({ useMdRender, setRenderUserMarkdown, t }) {
			const enabled = useMdRender((value) => value)?.value?.renderUserMarkdown ?? false;
			const translator = t;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: MarkdownRenderRow_module_css_default.row,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: MarkdownRenderRow_module_css_default.rowText,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: MarkdownRenderRow_module_css_default.title,
						children: translator("renderTitle")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: MarkdownRenderRow_module_css_default.desc,
						children: translator("renderDesc")
					})]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
					className: MarkdownRenderRow_module_css_default.switch,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
						type: "checkbox",
						className: MarkdownRenderRow_module_css_default.checkbox,
						"aria-label": translator("renderTitle"),
						checked: enabled,
						onChange: (event) => setRenderUserMarkdown(event.target.checked)
					})
				})]
			});
		}
		//#endregion
		//#region \0dsh-css:D:\ZcodeWorkspace\.zcode\workspace\default\deepseek-harness\packages\client\ui-custom\src\client\markdown\MarkdownRender.module.css.mjs
		const css$1 = "._0iTFsW_userRow{flex-direction:column;align-items:flex-end;gap:6px;display:flex}._0iTFsW_userStack{flex-direction:column;align-items:flex-end;gap:8px;min-width:0;max-width:min(525px,82%);display:flex}._0iTFsW_bubble{background:var(--dsw-specific-bubble-user,var(--dsw-specific-bubble));max-width:100%;color:var(--dsw-alias-label-primary);border-radius:22px;padding:10px 16px;font-size:16px;line-height:24px;box-shadow:0 2px 10px #0f11150f}._0iTFsW_refChip{color:var(--dsw-alias-label-primary);white-space:nowrap;vertical-align:baseline;background:#6187d838;border-radius:6px;margin:0 2px;padding:0 8px;font-size:.85em;line-height:1.6;display:inline-block}._0iTFsW_actions{align-items:center;gap:10px;height:28px;display:flex}._0iTFsW_timeStart{color:var(--dsw-alias-label-tertiary);white-space:nowrap;padding-right:12px;font-size:14px;line-height:24px}@media (hover:hover){[data-time-hover-root] ._0iTFsW_timeStart{opacity:0;transition:opacity 80ms}[data-time-hover-root]:hover ._0iTFsW_timeStart,[data-time-hover-root]:focus-within ._0iTFsW_timeStart{opacity:1}}._0iTFsW_action{width:28px;height:28px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:none;border-radius:28px;justify-content:center;align-items:center;padding:6px;display:inline-flex}._0iTFsW_action:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}";
		const tagId$1 = "@deepseek-ai/dsh-client-ui-custom/MarkdownRender.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-custom";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var MarkdownRender_module_css_default = {
			"timeStart": "_0iTFsW_timeStart",
			"action": "_0iTFsW_action",
			"userStack": "_0iTFsW_userStack",
			"refChip": "_0iTFsW_refChip",
			"actions": "_0iTFsW_actions",
			"userRow": "_0iTFsW_userRow",
			"bubble": "_0iTFsW_bubble"
		};
		//#endregion
		//#region src/client/markdown/UserMarkdownNodeView.tsx
		/**
		* Keyed chat renderer shadowing `conversation.chat.node` for `user` and
		* `steering` cells (priority -1 beats ui-conversation's default renderer).
		* Reads the ui-custom settings scope's `renderUserMarkdown`: on, the bubble
		* text renders through MarkdownText; off, it falls back to the plain-text
		* bubble with /name @name reference chips — visually identical to stock.
		*
		* Self-contained on purpose: the platform purity gate forbids importing
		* another plugin's internals, so the bubble geometry, image gallery wiring,
		* reference chips and the copy/clock actions row are replicated here from
		* ui-conversation's MessageItem (only platform atoms are imported).
		*/
		/** Split a user node's content into text / images / remaining blocks. */
		function contentParts(content) {
			const texts = [];
			const images = [];
			const rest = [];
			for (const block of content) {
				const b = block;
				if (b.type === "text" && typeof b.text === "string") texts.push(b.text);
				else if (b.type === "image" && b.attachment !== void 0) images.push({ attachment: b.attachment });
				else rest.push(block);
			}
			return {
				text: texts.join(""),
				images,
				rest
			};
		}
		/** Image-gallery labels from the `conversation` namespace (see ui-conversation). */
		function imageLabels(t) {
			return {
				image: t("image.label"),
				open: t("image.openOriginal"),
				openNamed: (label) => t("image.openOriginalLabel", { label }),
				loading: t("image.loading"),
				loadFailed: t("image.loadFailed"),
				lightbox: {
					dialog: t("image.preview"),
					close: t("image.closePreview")
				}
			};
		}
		const pad2 = (n) => String(n).padStart(2, "0");
		/** Same-day clock `HH:MM`, otherwise `M/D HH:MM` / `Y/M/D HH:MM`. */
		function formatClock(time, t, now = Date.now()) {
			const d = new Date(time);
			const n = new Date(now);
			const clock = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
			if (d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate()) return clock;
			const params = {
				y: d.getFullYear(),
				m: d.getMonth() + 1,
				d: d.getDate()
			};
			return `${d.getFullYear() === n.getFullYear() ? t("clock.md", params) : t("clock.ymd", params)} ${clock}`;
		}
		/** Plain-text projection with /name @name reference chips (stock look). */
		function projectUserText(text) {
			const re = /(^|\s)([/@][\w-]+)(?=\s|$)/g;
			const parts = [];
			let cursor = 0;
			let m;
			while ((m = re.exec(text)) !== null) {
				const tokenStart = m.index + (m[1]?.length ?? 0);
				const label = m[2] ?? "";
				if (tokenStart > cursor) parts.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.MessageText, { text: text.slice(cursor, tokenStart) }, cursor));
				parts.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: MarkdownRender_module_css_default.refChip,
					"data-ref-chip": label.startsWith("@") ? "subagent" : "skill",
					children: label
				}, tokenStart));
				cursor = tokenStart + label.length;
			}
			if (parts.length === 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.MessageText, { text });
			if (cursor < text.length) parts.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.MessageText, { text: text.slice(cursor) }, cursor));
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: parts });
		}
		/** Copy + clock actions row (user bubble chrome). */
		function UserBubbleActions({ text, time, t }) {
			const [copied, setCopied] = (0, react.useState)(false);
			const onCopy = () => {
				(0, _deepseek_ai_dsh_client_ui_primitives.writeClipboard)(text).then((ok) => {
					if (!ok) return;
					setCopied(true);
					window.setTimeout(() => setCopied(false), 1e3);
				});
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: MarkdownRender_module_css_default.actions,
				children: [time !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: MarkdownRender_module_css_default.timeStart,
					children: formatClock(time, t)
				}) : null, /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
					label: copied ? t("copied") : t("copy"),
					side: "bottom",
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: MarkdownRender_module_css_default.action,
						"aria-label": copied ? t("copied") : t("copy"),
						onClick: onCopy,
						children: copied ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCheckOutline16, {}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCopyOutline16, {})
					})
				})]
			});
		}
		/** Right-aligned bubble shared by user and steering rows. */
		function UserStyleBubble({ content, imageLoader, renderMarkdown, t, actions }) {
			const { text, images, rest } = contentParts(content);
			const truncated = (total) => t("json.truncated", { total });
			const showBubble = text !== "" || rest.length > 0;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: MarkdownRender_module_css_default.userRow,
				"data-time-hover-root": true,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: MarkdownRender_module_css_default.userStack,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_attachment.ImageGallery, {
						images,
						load: imageLoader,
						align: "end",
						labels: imageLabels(t)
					}), showBubble && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MarkdownRender_module_css_default.bubble,
						children: [renderMarkdown ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.MarkdownText, { text }) : projectUserText(text), rest.map((block, i) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.JsonBlock, {
							label: t("message.extraBlock"),
							payload: block,
							truncatedLabel: truncated
						}, i))]
					})]
				}), actions?.(text)]
			});
		}
		/** User and admitted-steering keyed Chat renderer (shadow, priority -1). */
		const UserMarkdownNodeView = (0, react.memo)(function UserMarkdownNodeView({ node, loadImage, t, useMdRender }) {
			const renderMarkdown = useMdRender((value) => value)?.value?.renderUserMarkdown ?? false;
			const data = node.data;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(UserStyleBubble, {
				content: data.content,
				imageLoader: loadImage,
				renderMarkdown,
				t,
				actions: (text) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(UserBubbleActions, {
					text,
					time: data.time,
					t
				})
			});
		});
		//#endregion
		//#region \0dsh-css:D:\ZcodeWorkspace\.zcode\workspace\default\deepseek-harness\packages\client\ui-custom\src\client\custom.module.css.mjs
		const css = "html[data-dsu-active=\"1\"] body{background-image:var(--dsu-gradient,none), var(--dsu-tone,none), var(--dsu-wallpaper,none);zoom:var(--dsu-font-scale,1);--dsw-font-family:var(--dsu-font);--ds-font-family-code:var(--dsu-code-font);font-family:var(--dsw-font-family);--dsw-static-deepseek-50:color-mix(in srgb, var(--dsu-accent,#4176e6) 15%, white);--dsw-static-deepseek-100:color-mix(in srgb, var(--dsu-accent,#4176e6) 30%, white);--dsw-static-deepseek-200:color-mix(in srgb, var(--dsu-accent,#4176e6) 45%, white);--dsw-static-deepseek-300:color-mix(in srgb, var(--dsu-accent,#4176e6) 62%, white);--dsw-static-deepseek-400:color-mix(in srgb, var(--dsu-accent,#4176e6) 78%, white);--dsw-static-deepseek-450:color-mix(in srgb, var(--dsu-accent,#4176e6) 92%, white);--dsw-static-deepseek-500:var(--dsu-accent,#4176e6);--dsw-static-deepseek-600:color-mix(in srgb, var(--dsu-accent,#4176e6) 85%, black);--dsw-static-deepseek-700-delete:color-mix(in srgb, var(--dsu-accent,#4176e6) 75%, black);--dsw-static-deepseek-800:color-mix(in srgb, var(--dsu-accent,#4176e6) 60%, black);--dsw-static-deepseek-900:color-mix(in srgb, var(--dsu-accent,#4176e6) 45%, black);--dsw-alias-brand-primary:var(--dsw-static-deepseek-500);--dsw-alias-brand-primary-new-colorprimary-new-color:var(--dsw-static-deepseek-450);--dsw-alias-brand-text:var(--dsw-static-deepseek-600);--dsw-alias-button-primary-fill:var(--dsw-alias-brand-primary);--dsw-alias-button-primary-hover:var(--dsw-static-deepseek-600);--dsw-alias-interactive-bg-active:color-mix(in srgb, var(--dsu-accent,#4176e6) 16%, transparent);--dsw-alias-interactive-bg-hover-accent:color-mix(in srgb, var(--dsu-accent,#4176e6) 14%, transparent);--dsw-alias-bg-base:color-mix(in srgb, var(--dsw-static-neutral-bluish-00) var(--dsu-surface-alpha,50%), transparent);--dsw-specific-sidebar-fill:color-mix(in srgb, var(--dsw-static-neutral-bluish-50) var(--dsu-sidebar-alpha,50%), transparent);--dsw-chat-surface:color-mix(in srgb, var(--dsw-static-neutral-bluish-00) var(--dsu-chat-alpha,80%), transparent);--dsw-specific-input-major:color-mix(in srgb, var(--dsw-static-neutral-bluish-00) var(--dsu-input-alpha,82%), transparent);--dsw-alias-markdown-code-block:color-mix(in srgb, var(--dsw-static-deepseek-50) var(--dsu-code-alpha,45%), transparent);--dsw-alias-markdown-code-block-banner:color-mix(in srgb, var(--dsw-static-deepseek-100) calc(var(--dsu-code-alpha,45%) + 10%), transparent);--dsw-alias-markdown-inline-code:color-mix(in srgb, var(--dsw-static-deepseek-100) calc(var(--dsu-code-alpha,45%) + 15%), transparent);--dsw-alias-scrollbar-bg-l1:color-mix(in srgb, var(--dsu-accent,#4176e6) calc(var(--dsu-scrollbar,0) * 30%), transparent);--dsw-alias-scrollbar-bg-l2:color-mix(in srgb, var(--dsu-accent,#4176e6) calc(var(--dsu-scrollbar,0) * 30%), transparent);--dsw-alias-scrollbar-hover-l1:color-mix(in srgb, var(--dsu-accent,#4176e6) calc(var(--dsu-scrollbar,0) * 55%), transparent);--dsw-alias-scrollbar-hover-l2:color-mix(in srgb, var(--dsu-accent,#4176e6) calc(var(--dsu-scrollbar,0) * 55%), transparent);background-position:50%;background-repeat:no-repeat;background-size:cover;background-attachment:fixed}html[data-dsu-active=\"1\"] body[data-ds-dark-theme]{background-image:linear-gradient(180deg, var(--dsu-scrim,#0f111538), var(--dsu-scrim,#0f111538)), var(--dsu-gradient,none), var(--dsu-tone,none), var(--dsu-wallpaper,none);--dsw-alias-brand-primary:var(--dsu-dark-accent,var(--dsw-static-deepseek-400));--dsw-alias-button-primary-fill:var(--dsu-dark-accent,var(--dsw-static-deepseek-400));--dsw-alias-button-primary-hover:var(--dsu-dark-accent,var(--dsw-static-deepseek-400));--dsw-alias-brand-text:var(--dsw-static-deepseek-300);--dsw-alias-bg-base:color-mix(in srgb, var(--dsw-static-neutral-bluish-950) var(--dsu-dark-alpha,var(--dsu-surface-alpha,50%)), transparent);--dsw-specific-sidebar-fill:color-mix(in srgb, var(--dsw-static-neutral-bluish-950) var(--dsu-sidebar-alpha,var(--dsu-dark-alpha,50%)), transparent);--dsw-chat-surface:color-mix(in srgb, var(--dsw-static-neutral-bluish-950) var(--dsu-chat-alpha,var(--dsu-dark-alpha,50%)), transparent);--dsw-specific-input-major:color-mix(in srgb, var(--dsw-static-neutral-bluish-850) var(--dsu-input-alpha,var(--dsu-dark-alpha,50%)), transparent);--dsw-alias-markdown-code-block:color-mix(in srgb, var(--dsw-static-neutral-bluish-900) var(--dsu-code-alpha,var(--dsu-dark-alpha,50%)), transparent);--dsw-alias-markdown-code-block-banner:color-mix(in srgb, var(--dsw-static-neutral-bluish-850) calc(var(--dsu-code-alpha,var(--dsu-dark-alpha,50%)) + 10%), transparent);--dsw-alias-markdown-inline-code:color-mix(in srgb, var(--dsw-static-deepseek-900) calc(var(--dsu-code-alpha,var(--dsu-dark-alpha,50%)) + 15%), transparent)}html[data-dsu-active=\"1\"] #_-WJia_root{-webkit-backdrop-filter:blur(var(--dsu-blur,0px)) saturate(var(--dsu-saturate,1.25));box-shadow:inset 0 0 40px rgb(15 17 21/calc(var(--dsu-vignette,0) * .1))}html[data-dsu-active=\"1\"] [data-chat-anchor-key],html[data-dsu-active=\"1\"] input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color]),html[data-dsu-active=\"1\"] textarea,html[data-dsu-active=\"1\"] [role=dialog],html[data-dsu-active=\"1\"] [role=menu]{border-radius:var(--dsu-radius)}html[data-dsu-active=\"1\"] [role=dialog],html[data-dsu-active=\"1\"] [role=menu]{box-shadow:var(--dsu-shadow)}html[data-dsu-active=\"1\"] input:focus-visible,html[data-dsu-active=\"1\"] textarea:focus-visible,html[data-dsu-active=\"1\"] button:focus-visible,html[data-dsu-active=\"1\"] [role=button]:focus-visible{box-shadow:0 0 0 2px color-mix(in srgb, var(--dsu-accent,#4176e6) calc(var(--dsu-focus-glow,0) * 45%), transparent)}";
		const tagId = "@deepseek-ai/dsh-client-ui-custom/custom.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-custom";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		//#endregion
		//#region src/client/index.ts
		/** Required services: theme (none extra), shortcuts (connection/sessions/workspaces), settings UI (slots/locale/settingsScope), marketplace (remote inventory), history (layout). */
		const inject = [
			"slots",
			"locale",
			"connection",
			"sessions",
			"workspaces",
			"settingsScope",
			"remote",
			"remote.pluginInventory",
			"layout"
		];
		/**
		* Install the keydown listener for the dispatcher actions. All bindings share
		* one capture-phase listener; the first action whose combo matches wins and
		* the event is consumed. Standard actions dispatch first, then the one-to-one
		* model shortcuts (each combo jumps to its specific model). Re-installable:
		* returns the disposer.
		* @param ctx - client root context (for action dispatch).
		* @param shortcuts - normalized shortcut config.
		* @param disabledActions - actions to skip entirely (cross-feature gating: an
		* action whose target feature is not mounted is never dispatched).
		* @returns the disposer removing the listener.
		*/
		function installShortcuts(ctx, shortcuts, disabledActions = /* @__PURE__ */ new Set()) {
			const combos = buildShortcutMap(shortcuts);
			const actions = Object.keys(SHORTCUT_HANDLERS).filter((action) => !disabledActions.has(action));
			const modelShortcuts = shortcuts.modelShortcuts.map((entry) => ({
				entry,
				combo: parseKeyCombo(entry.combo)
			})).filter((item) => item.combo !== null);
			if (!(actions.some((action) => comboEnabled(combos[action])) || modelShortcuts.length > 0)) return () => {};
			const handler = (event) => {
				if (isEditableTarget(event.target) && !(event.ctrlKey || event.metaKey)) return;
				for (const action of actions) {
					const combo = combos[action];
					if (combo === null || !matchesKeyCombo(combo, event)) continue;
					event.preventDefault();
					event.stopPropagation();
					const handler = SHORTCUT_HANDLERS[action];
					if (handler === void 0) continue;
					Promise.resolve(handler(ctx, shortcuts)).catch(() => {});
					return;
				}
				for (const { entry, combo } of modelShortcuts) {
					if (!matchesKeyCombo(combo, event)) continue;
					event.preventDefault();
					event.stopPropagation();
					Promise.resolve(selectModelDirect(ctx, entry.provider, entry.model)).catch(() => {});
					return;
				}
			};
			window.addEventListener("keydown", handler, true);
			return () => window.removeEventListener("keydown", handler, true);
		}
		/**
		* Client plugin body: mount each enabled feature (appearance / shortcuts /
		* usage / marketplace / history / markdown). The loader config's `features`
		* whitelist decides which features register; absent = everything.
		* @param ctx - client root context.
		* @param config - profile-level plugin config (partial over the preset).
		*/
		function apply(ctx, config) {
			const normalized = normalizeConfig(config, resolvePreset(typeof config?.preset === "string" ? config.preset : ""));
			const features = resolveFeatures(config);
			const enabled = (feature) => features.has(feature);
			if (enabled("appearance")) applyConfig(normalized);
			ctx.effect(() => {
				const syncColorScheme = () => {
					const dark = document.body.hasAttribute("data-ds-dark-theme");
					document.documentElement.style.colorScheme = dark ? "dark" : "light";
				};
				syncColorScheme();
				const observer = new MutationObserver(syncColorScheme);
				observer.observe(document.body, {
					attributes: true,
					attributeFilter: ["data-ds-dark-theme"]
				});
				return () => {
					observer.disconnect();
				};
			}, "ui-custom: color-scheme follows the active theme");
			if (enabled("shortcuts")) ctx.effect(() => ctx.locale.register(NS, {
				zh: zh$6,
				en: en$6
			}), "ui-custom: section dictionaries");
			if (enabled("usage")) ctx.effect(() => ctx.locale.register(USAGE_NS, {
				zh: zh$5,
				en: en$5
			}), "ui-custom: usage dictionaries");
			if (enabled("appearance")) ctx.effect(() => ctx.locale.register(APPEARANCE_NS, {
				zh: zh$4,
				en: en$4
			}), "ui-custom: appearance dictionaries");
			if (enabled("marketplace")) ctx.effect(() => ctx.locale.register(MARKETPLACE_NS, {
				zh: zh$3,
				en: en$3
			}), "ui-custom: marketplace dictionaries");
			if (enabled("history")) {
				ctx.effect(() => ctx.locale.register(HISTORY_NS, {
					zh: zh$2,
					en: en$2
				}), "ui-custom: history dictionaries");
				ctx.effect(() => ctx.locale.register("pin", {
					zh: zh$1,
					en: en$1
				}), "ui-custom: pin dictionaries");
			}
			if (enabled("markdown")) ctx.effect(() => ctx.locale.register(MARKDOWN_NS, {
				zh,
				en
			}), "ui-custom: markdown dictionaries");
			const scope = ctx.settingsScope.bind({ namespace: UI_CUSTOM_SETTINGS_NS });
			if (enabled("appearance")) {
				const appearanceT = ctx.locale.bind(APPEARANCE_NS);
				const applyTheme = () => {
					const snapshot = scope.getSnapshot();
					const user = snapshot.user;
					const explicitDark = typeof user === "object" && user !== null && "darkSurfaceOpacity" in user;
					let effective;
					if (snapshot.value === void 0) effective = void 0;
					else if (explicitDark) effective = snapshot.value;
					else {
						const { darkSurfaceOpacity: _inherited, ...rest } = snapshot.value;
						effective = {
							...rest,
							darkSurfaceOpacity: void 0
						};
					}
					applyConfig(configFromThemeSection(normalized, effective));
				};
				applyTheme();
				ctx.effect(() => scope.subscribe(applyTheme), "ui-custom: theme settings sync");
				const appearance = new AppearanceSettingsController(scope, normalized, (config) => applyConfig(config));
				const { dispose: disposeAppearance, actions: appearanceActions } = appearance.mount();
				ctx.effect(() => () => disposeAppearance(), "ui-custom: appearance settings scope");
				ctx.slots.inject("settings.section", () => ctx.slots.register({
					name: "settings.section",
					id: "appearance",
					order: 10,
					label: () => appearanceT("nav"),
					locale: APPEARANCE_NS,
					children: { "settings.appearance.item": {
						kind: "list",
						scope: "root"
					} },
					inject: () => ({
						hooks: { appearance: appearance.store },
						...appearanceActions
					})
				}, AppearanceSection));
				const reopenSettings = () => {
					const triggers = document.querySelectorAll("[aria-haspopup=\"dialog\"]");
					for (const trigger of triggers) {
						const label = trigger.textContent ?? "";
						if (label.includes("设置") || label.includes("Settings") || label.includes("設定")) {
							trigger.click();
							break;
						}
					}
					window.setTimeout(() => {
						const rows = document.querySelectorAll("button");
						for (const row of rows) {
							const text = (row.textContent ?? "").trim();
							if (text === "外观" || text === "Appearance" || text === "外觀") {
								row.click();
								return;
							}
						}
					}, 60);
				};
				ctx.slots.inject("shell.overlay", () => ctx.slots.register({
					name: "shell.overlay",
					id: "ui-custom-preview",
					order: 90,
					locale: APPEARANCE_NS,
					inject: () => ({
						hooks: { previewVisible: previewBar },
						onExit: () => {
							previewBar.hide();
							reopenSettings();
						}
					})
				}, PreviewBar));
			}
			if (enabled("shortcuts")) {
				const t = ctx.locale.bind(NS);
				let disposeShortcuts;
				const applyShortcuts = () => {
					disposeShortcuts?.();
					const section = scope.getSnapshot().value;
					const shortcuts = {
						newConversation: section?.newConversation ?? normalized.shortcuts.newConversation,
						switchModel: section?.switchModel ?? normalized.shortcuts.switchModel,
						cycleThinking: section?.cycleThinking ?? normalized.shortcuts.cycleThinking,
						sendMessage: section?.sendMessage ?? normalized.shortcuts.sendMessage,
						newline: section?.newline ?? normalized.shortcuts.newline,
						usagePanel: section?.usagePanel ?? normalized.shortcuts.usagePanel,
						defaultWorkspace: section?.defaultWorkspace ?? normalized.shortcuts.defaultWorkspace,
						modelShortcuts: section?.modelShortcuts ?? normalized.shortcuts.modelShortcuts
					};
					const disposeActions = installShortcuts(ctx, shortcuts, enabled("usage") ? void 0 : new Set(["usagePanel"]));
					const disposeComposer = installComposerInput(shortcuts);
					disposeShortcuts = () => {
						disposeActions();
						disposeComposer();
					};
				};
				applyShortcuts();
				ctx.effect(() => scope.subscribe(applyShortcuts), "ui-custom: shortcut settings sync");
				ctx.effect(() => () => disposeShortcuts?.(), "ui-custom: shortcut listener teardown");
				const controller = new ShortcutsSettingsController(scope, normalized.shortcuts, () => modelCatalogOptions(ctx));
				const { dispose: disposeScope, actions } = controller.mount();
				ctx.effect(() => () => disposeScope(), "ui-custom: shortcut settings scope");
				controller.refreshModels();
				const unsubscribeModels = ctx.sessions.list.subscribe(() => {
					controller.refreshModels();
				});
				ctx.effect(() => () => unsubscribeModels(), "ui-custom: model catalog sync");
				ctx.slots.inject("settings.section", () => ctx.slots.register({
					name: "settings.section",
					id: "shortcuts",
					order: 20,
					label: () => t("nav"),
					locale: NS,
					inject: () => ({
						hooks: {
							shortcuts: controller.store,
							workspaces: ctx.workspaces.list,
							models: controller.models
						},
						usageAvailable: enabled("usage"),
						...actions
					})
				}, ShortcutsSection));
			}
			if (enabled("usage")) {
				const usageT = ctx.locale.bind(USAGE_NS);
				ctx.slots.inject("settings.section", () => ctx.slots.register({
					name: "settings.section",
					id: "usage",
					order: 25,
					label: () => usageT("nav"),
					locale: USAGE_NS,
					inject: () => ({ hooks: { sessions: ctx.sessions.list } })
				}, UsageSection));
				ctx.slots.inject("shell.overlay", () => ctx.slots.register({
					name: "shell.overlay",
					id: "ui-custom-usage",
					order: 100,
					locale: USAGE_NS,
					inject: () => ({ hooks: {
						sessions: ctx.sessions.list,
						usageVisible: usageOverlay
					} })
				}, UsageOverlay));
			}
			if (enabled("marketplace")) {
				const marketplaceT = ctx.locale.bind(MARKETPLACE_NS);
				const marketplace = new MarketplaceController(async () => {
					const result = await ctx.remote.pluginInventory.list();
					if (!result.ok) return [];
					return result.value.entries.map((entry) => entry.moduleName);
				}, () => {
					const setting = scope.getSnapshot().value?.marketplaceUrl;
					return deriveMarketplaceSources(setting !== void 0 && setting.trim() !== "" ? setting : DEFAULT_MARKETPLACE_URL);
				}, () => scope.getSnapshot().value?.discoverGitHub ?? false, () => scope.getSnapshot().value?.discoverSort === "date" ? "date" : "stars", () => {
					const raw = scope.getSnapshot().value?.discoverLimit;
					return typeof raw === "number" && Number.isFinite(raw) ? Math.min(100, Math.max(1, Math.round(raw))) : 30;
				});
				let lastMarketplaceKey;
				const applyMarketplace = () => {
					const section = scope.getSnapshot().value;
					const key = `${section?.marketplaceUrl ?? ""}|${section?.discoverGitHub ?? false}|${section?.discoverSort ?? "stars"}|${section?.discoverLimit ?? 30}`;
					if (key === lastMarketplaceKey) return;
					lastMarketplaceKey = key;
					marketplace.refresh();
				};
				ctx.effect(() => scope.subscribe(applyMarketplace), "ui-custom: marketplace source sync");
				ctx.slots.inject("settings.plugins.tab", () => ctx.slots.register({
					name: "settings.plugins.tab",
					id: "marketplace",
					order: 30,
					label: () => marketplaceT("tab"),
					locale: MARKETPLACE_NS,
					inject: () => ({
						...marketplace.mount(),
						setDiscoverSort: (sort) => {
							scope.set("discoverSort", sort);
						},
						setDiscoverLimit: (limit) => {
							scope.set("discoverLimit", limit);
						}
					})
				}, MarketplaceTab));
			}
			if (enabled("history")) {
				ctx.slots.inject("details", () => ctx.slots.register({
					name: "details",
					priority: -1,
					locale: HISTORY_NS,
					inject: (sessionId) => ({
						loadOlder: () => {
							ctx.sessions.binding(sessionId)?.session.loadOlder();
						},
						sessionId,
						hooks: {
							historyLimit: scope,
							historyPosition: scope,
							pinnedTurns: scope
						}
					})
				}, HistoryStrip));
				ctx.slots.inject("conversation.chat.assistant-actions", () => ctx.slots.register({
					name: "conversation.chat.assistant-actions",
					id: "ui-custom-pin",
					order: 5,
					locale: "pin",
					inject: (sessionId) => {
						const togglePin = (turn) => {
							const record = scope.getSnapshot().value?.pinnedTurns ?? {};
							const current = record[sessionId] ?? [];
							const next = current.includes(turn) ? current.filter((n) => n !== turn) : [...current, turn].sort((a, b) => a - b);
							const updated = { ...record };
							if (next.length === 0) delete updated[sessionId];
							else updated[sessionId] = next;
							if (Object.keys(updated).length === 0) scope.unset("pinnedTurns");
							else scope.set("pinnedTurns", updated);
						};
						return {
							sessionId,
							hooks: {
								position: scope,
								pinnedTurns: scope
							},
							togglePin
						};
					}
				}, PinTurnAction));
				ctx.slots.inject("settings.general.item", () => ctx.slots.register({
					name: "settings.general.item",
					id: "ui-custom-history-position",
					order: 40,
					locale: HISTORY_NS,
					inject: () => ({
						hooks: { historyPosition: scope },
						setHistoryPosition: (position) => {
							scope.set("historyPosition", position);
						}
					})
				}, HistoryPositionRow));
				ctx.slots.inject("settings.general.item", () => ctx.slots.register({
					name: "settings.general.item",
					id: "ui-custom-history-limit",
					order: 50,
					locale: HISTORY_NS,
					inject: () => ({
						hooks: { historyLimit: scope },
						setHistoryLimit: (limit) => {
							scope.set("historyLimit", limit);
						}
					})
				}, HistoryLimitRow));
			}
			if (enabled("markdown")) {
				ctx.slots.inject("settings.general.item", () => ctx.slots.register({
					name: "settings.general.item",
					id: "ui-custom-md-render",
					order: 55,
					locale: MARKDOWN_NS,
					inject: () => ({
						hooks: { mdRender: scope },
						setRenderUserMarkdown: (enabled) => {
							scope.set("renderUserMarkdown", enabled);
						}
					})
				}, MarkdownRenderRow));
				ctx.slots.inject("conversation.chat.node", () => ctx.slots.register({
					name: "conversation.chat.node",
					key: "user",
					priority: -1,
					locale: "conversation",
					inject: () => ({ hooks: { mdRender: scope } })
				}, UserMarkdownNodeView));
				ctx.slots.inject("conversation.chat.node", () => ctx.slots.register({
					name: "conversation.chat.node",
					key: "steering",
					priority: -1,
					locale: "conversation",
					inject: () => ({ hooks: { mdRender: scope } })
				}, UserMarkdownNodeView));
			}
			ctx.get("connection");
		}
		//#endregion
		exports.CONFIG_KEYS = CONFIG_KEYS;
		exports.DEFAULTS = DEFAULTS;
		exports.FEATURES = FEATURES;
		exports.PRESETS = PRESETS;
		exports.PRESET_MAP = PRESET_MAP;
		exports.SHORTCUT_ACTIONS = SHORTCUT_ACTIONS;
		exports.SHORTCUT_DEFAULTS = SHORTCUT_DEFAULTS;
		exports.apply = apply;
		exports.buildShortcutMap = buildShortcutMap;
		exports.clampNumber = clampNumber;
		exports.cleanString = cleanString;
		exports.cycleThinking = cycleThinking;
		exports.inject = inject;
		exports.keyToToken = keyToToken;
		exports.matchesKeyCombo = matchesKeyCombo;
		exports.modelCatalogOptions = modelCatalogOptions;
		exports.newConversation = newConversation;
		exports.normalizeConfig = normalizeConfig;
		exports.parseKeyCombo = parseKeyCombo;
		exports.resolveFeatures = resolveFeatures;
		exports.resolvePreset = resolvePreset;
		exports.selectModelDirect = selectModelDirect;
		exports.specFromEvent = specFromEvent;
		exports.switchModel = switchModel;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map
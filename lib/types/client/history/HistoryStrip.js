import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { buildTurns, currentTurnKey, jumpToTurn, mergeVisibleTurns } from "./turns.js";
import { DEFAULT_HISTORY_LIMIT, DEFAULT_HISTORY_POSITION } from "../../shared.js";
import css from './HistoryStrip.module.css';
/** Bar width % by distance from the hovered bar (the wave silhouette). */
const WAVE_WIDTH = { 0: 100, 1: 62, 2: 40, 3: 24 };
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
export function HistoryStrip({ useSession, loadOlder, sessionId, useHistoryLimit, useHistoryPosition, usePinnedTurns, t }) {
    // s.chat is a structural-shared reference, so the memo only rebuilds when
    // the mounted conversation actually changes.
    const chat = useSession(s => s.chat);
    const blank = useSession(s => s.blank);
    const openState = useSession(s => s.openState);
    const hasMore = useSession(s => s.hasMore);
    const loadingOlder = useSession(s => s.loadingOlder);
    // User preferences: how many recent turns to show (0 = all), which side
    // the strip sits on ('off' hides it entirely), and which turn numbers are
    // pinned for this session (pinned turns ignore the count limit). Read
    // before the turns model so a hidden strip skips building rows on long
    // conversations.
    const limitScope = useHistoryLimit(value => value);
    const historyLimit = limitScope?.value?.historyLimit ?? DEFAULT_HISTORY_LIMIT;
    const positionScope = useHistoryPosition(value => value);
    const position = positionScope?.value?.historyPosition ?? DEFAULT_HISTORY_POSITION;
    const pinnedScope = usePinnedTurns(value => value);
    const pinnedNumbers = useMemo(() => {
        const set = new Set();
        for (const turn of pinnedScope?.value?.pinnedTurns?.[sessionId] ?? [])
            set.add(turn);
        return set;
    }, [pinnedScope, sessionId]);
    const allTurns = useMemo(() => (blank || position === 'off') ? [] : buildTurns(chat), [chat, blank, position]);
    // The strip's bars: the recent-turns limit applied to non-pinned turns,
    // with every pinned turn merged back at its natural position.
    const turns = useMemo(() => mergeVisibleTurns(allTurns, historyLimit, pinnedNumbers), [allTurns, historyLimit, pinnedNumbers]);
    const [activeKey, setActiveKey] = useState(null);
    const [hovered, setHovered] = useState(null);
    // The hovered bar's viewport top, for anchoring the custom tooltip.
    const [tooltipY, setTooltipY] = useState(0);
    // Injected actions are closures recreated per render by the framework; keep
    // them in refs so effects depend only on the values that actually matter.
    const loadOlderRef = useRef(loadOlder);
    loadOlderRef.current = loadOlder;
    // Throttled full-history pager: how many batches this mount has already
    // requested, so a refresh never floods the session or the chat DOM.
    const loadedBatches = useRef(0);
    // The left strip anchors to the conversation's left edge = the rendered
    // sidebar width. The AppFrame owns the three-column grid (inline
    // gridTemplateColumns); measure its first track and follow sidebar drags
    // with a ResizeObserver. useLayoutEffect anchors the first paint (no
    // right→left flash), and the deps re-measure once the strip actually
    // renders (it returns null while the session is blank or the strip hidden).
    const stripRef = useRef(null);
    const [conversationLeft, setConversationLeft] = useState(null);
    useLayoutEffect(() => {
        const el = stripRef.current;
        if (el === null)
            return;
        let frame = el;
        while (frame !== null && frame.style.gridTemplateColumns === '')
            frame = frame.parentElement;
        if (frame === null)
            return;
        const measure = () => {
            const sidebar = frame?.children[0];
            if (sidebar === undefined)
                return;
            const width = sidebar.getBoundingClientRect().width;
            setConversationLeft(previous => previous !== null && Math.abs(previous - width) <= 1 ? previous : width);
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(frame);
        return () => observer.disconnect();
    }, [position, blank, turns.length === 0]);
    // Full history: page the mounted window backwards, throttled and gated on
    // the session being fully open, until the strip has enough turns — the
    // recent-turns limit, or the visual fill cap for "all" (fast; the whole
    // conversation is not needed for sub-pixel bars). Paging also runs while
    // the window has NO user turns yet (a dense tail of assistant/tool
    // messages), and while any pinned turn is still beyond the loaded window
    // (pinned turns must show regardless of the limit). Empty sessions are
    // bounded by hasMore (false) and MAX_BATCHES. With the strip hidden
    // ('off') there is nothing to draw, so the pager stays quiet.
    const target = historyLimit > 0 ? Math.min(historyLimit, MAX_STRIP_TURNS) : MAX_STRIP_TURNS;
    const unpinnedCount = useMemo(() => allTurns.filter(turn => turn.turn === undefined || !pinnedNumbers.has(turn.turn)).length, [allTurns, pinnedNumbers]);
    const pinnedMissing = useMemo(() => {
        if (pinnedNumbers.size === 0)
            return false;
        const loaded = new Set();
        for (const turn of allTurns)
            if (turn.turn !== undefined)
                loaded.add(turn.turn);
        for (const turn of pinnedNumbers)
            if (!loaded.has(turn))
                return true;
        return false;
    }, [allTurns, pinnedNumbers]);
    const pagerDone = unpinnedCount >= target && !pinnedMissing;
    useEffect(() => {
        if (position === 'off')
            return;
        if (openState !== 'open' || !hasMore || loadingOlder)
            return;
        if (pagerDone)
            return;
        if (loadedBatches.current >= MAX_BATCHES)
            return;
        const timer = setTimeout(() => {
            loadedBatches.current += 1;
            loadOlderRef.current();
        }, THROTTLE_MS);
        return () => clearTimeout(timer);
    }, [position, openState, hasMore, loadingOlder, pagerDone]);
    // Current turn: track the turn the reader is currently in (scroll +
    // resize, rAF-throttled); its bar keeps a subtle accent tint. Skipped while
    // the strip is hidden — no point scanning the conversation for a marker
    // nothing renders.
    useEffect(() => {
        if (position === 'off' || turns.length === 0)
            return;
        let raf = 0;
        const keys = turns.map(turn => turn.key);
        const compute = () => {
            raf = 0;
            setActiveKey(currentTurnKey(keys));
        };
        const onScroll = () => {
            if (raf === 0)
                raf = requestAnimationFrame(compute);
        };
        compute();
        document.addEventListener('scroll', onScroll, true);
        window.addEventListener('resize', onScroll);
        return () => {
            document.removeEventListener('scroll', onScroll, true);
            window.removeEventListener('resize', onScroll);
            if (raf !== 0)
                cancelAnimationFrame(raf);
        };
    }, [turns, position]);
    if (blank || turns.length === 0 || position === 'off')
        return null;
    const translator = t;
    const clearHover = () => setHovered(null);
    const leftAnchor = (conversationLeft ?? 0) + EDGE_MARGIN;
    return (_jsxs("div", { ref: stripRef, className: `${css.strip} ${position === 'left' ? css.stripLeft : css.stripRight}`, style: {
            width: STRIP_WIDTH,
            // The left edge is the measured sidebar width; until the frame is
            // found the CSS fallback (left: 12px) applies for one frame at most.
            ...(position === 'left' && conversationLeft !== null ? { left: leftAnchor } : {}),
        }, onMouseLeave: clearHover, children: [hovered !== null && createPortal((_jsxs("div", { className: `${css.tooltip} ${position === 'left' ? css.tooltipLeft : ''}`, style: {
                    top: Math.max(48, Math.min(tooltipY, window.innerHeight - 48)),
                    // Mirror of the right side: the tooltip sits just inside the
                    // strip's inner edge (beside the left strip, rightward).
                    ...(position === 'left' && conversationLeft !== null
                        ? { left: leftAnchor + STRIP_WIDTH + TOOLTIP_GAP }
                        : {}),
                }, role: "tooltip", children: [_jsx("span", { className: css.tooltipDot, "aria-hidden": true }), _jsx("span", { className: css.tooltipText, children: turns[hovered]?.question || translator('noText') })] })), 
            // Portal out of the (transformed) strip so `position: fixed` resolves
            // against the viewport, not the strip's containing block.
            document.body), turns.map((turn, index) => {
                const isActive = activeKey === turn.key;
                const isPinned = turn.turn !== undefined && pinnedNumbers.has(turn.turn);
                const width = hovered === null
                    ? (isActive ? IDLE_CURRENT : IDLE_REST)
                    : WAVE_WIDTH[Math.min(3, Math.abs(index - hovered))] ?? IDLE_REST;
                const level = hovered === null ? -1 : Math.min(3, Math.abs(index - hovered));
                return (_jsx("button", { type: "button", className: [
                        css.bar,
                        isPinned ? css.barPinned : '',
                        hovered !== null && level === 0 ? css.barPeak : '',
                        hovered !== null && level === 1 ? css.barNear : '',
                        hovered !== null && level === 2 ? css.barFar : '',
                        isActive ? css.barActive : '',
                    ].filter(Boolean).join(' '), style: { width: `${width}%` }, onMouseEnter: (event) => {
                        setHovered(index);
                        setTooltipY(event.currentTarget.getBoundingClientRect().top);
                    }, onClick: () => jumpToTurn(turn.key), "aria-label": translator('jumpSegment') }, turn.key));
            })] }));
}
//# sourceMappingURL=HistoryStrip.js.map
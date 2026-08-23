import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
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
import { memo, useState } from 'react';
import { IconCheckOutline16, IconCopyOutline16, JsonBlock, MarkdownText, MessageText, Tooltip, writeClipboard, } from '@deepseek-ai/dsh-client-ui-primitives';
import { ImageGallery } from '@deepseek-ai/dsh-client-ui-attachment';
import css from './MarkdownRender.module.css';
/** Split a user node's content into text / images / remaining blocks. */
function contentParts(content) {
    const texts = [];
    const images = [];
    const rest = [];
    for (const block of content) {
        const b = block;
        if (b.type === 'text' && typeof b.text === 'string')
            texts.push(b.text);
        else if (b.type === 'image' && b.attachment !== undefined) {
            images.push({ attachment: b.attachment });
        }
        else
            rest.push(block);
    }
    return { text: texts.join(''), images, rest };
}
/** Image-gallery labels from the `conversation` namespace (see ui-conversation). */
function imageLabels(t) {
    return {
        image: t('image.label'),
        open: t('image.openOriginal'),
        openNamed: label => t('image.openOriginalLabel', { label }),
        loading: t('image.loading'),
        loadFailed: t('image.loadFailed'),
        lightbox: {
            dialog: t('image.preview'),
            close: t('image.closePreview'),
        },
    };
}
const pad2 = (n) => String(n).padStart(2, '0');
/** Same-day clock `HH:MM`, otherwise `M/D HH:MM` / `Y/M/D HH:MM`. */
function formatClock(time, t, now = Date.now()) {
    const d = new Date(time);
    const n = new Date(now);
    const clock = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    if (d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate()) {
        return clock;
    }
    const params = { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() };
    const md = d.getFullYear() === n.getFullYear() ? t('clock.md', params) : t('clock.ymd', params);
    return `${md} ${clock}`;
}
/** Plain-text projection with /name @name reference chips (stock look). */
function projectUserText(text) {
    const re = /(^|\s)([/@][\w-]+)(?=\s|$)/g;
    const parts = [];
    let cursor = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
        const tokenStart = m.index + (m[1]?.length ?? 0);
        const label = m[2] ?? '';
        if (tokenStart > cursor)
            parts.push(_jsx(MessageText, { text: text.slice(cursor, tokenStart) }, cursor));
        parts.push(_jsx("span", { className: css.refChip, "data-ref-chip": label.startsWith('@') ? 'subagent' : 'skill', children: label }, tokenStart));
        cursor = tokenStart + label.length;
    }
    if (parts.length === 0)
        return _jsx(MessageText, { text: text });
    if (cursor < text.length)
        parts.push(_jsx(MessageText, { text: text.slice(cursor) }, cursor));
    return _jsx(_Fragment, { children: parts });
}
/** Copy + clock actions row (user bubble chrome). */
function UserBubbleActions({ text, time, t }) {
    const [copied, setCopied] = useState(false);
    const onCopy = () => {
        void writeClipboard(text).then((ok) => {
            if (!ok)
                return;
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1000);
        });
    };
    return (_jsxs("div", { className: css.actions, children: [time !== undefined ? _jsx("span", { className: css.timeStart, children: formatClock(time, t) }) : null, _jsx(Tooltip, { label: copied ? t('copied') : t('copy'), side: "bottom", children: _jsx("button", { type: "button", className: css.action, "data-dsu-motion": "press", "aria-label": copied ? t('copied') : t('copy'), onClick: onCopy, children: copied ? _jsx(IconCheckOutline16, {}) : _jsx(IconCopyOutline16, {}) }) })] }));
}
/** Right-aligned bubble shared by user and steering rows. */
function UserStyleBubble({ content, imageLoader, renderMarkdown, t, actions }) {
    const { text, images, rest } = contentParts(content);
    const truncated = (total) => t('json.truncated', { total });
    const showBubble = text !== '' || rest.length > 0;
    return (_jsxs("div", { className: css.userRow, "data-dsu-motion": "node", "data-time-hover-root": true, children: [_jsxs("div", { className: css.userStack, children: [_jsx(ImageGallery, { images: images, load: imageLoader, align: "end", labels: imageLabels(t) }), showBubble && (_jsxs("div", { className: css.bubble, children: [renderMarkdown ? _jsx(MarkdownText, { text: text }) : projectUserText(text), rest.map((block, i) => (_jsx(JsonBlock, { label: t('message.extraBlock'), payload: block, truncatedLabel: truncated }, i)))] }))] }), actions?.(text)] }));
}
/** User and admitted-steering keyed Chat renderer (shadow, priority -1). */
export const UserMarkdownNodeView = memo(function UserMarkdownNodeView({ node, loadImage, t, useMdRender, }) {
    const md = useMdRender((value) => value);
    const renderMarkdown = md?.value?.renderUserMarkdown ?? false;
    const data = node.data;
    return (_jsx(UserStyleBubble, { content: data.content, imageLoader: loadImage, renderMarkdown: renderMarkdown, t: t, actions: (text) => _jsx(UserBubbleActions, { text: text, time: data.time, t: t }) }));
});
//# sourceMappingURL=UserMarkdownNodeView.js.map
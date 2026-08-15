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
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client';
import type { UiCustomSection } from '../../shared.ts';
/** Registration-side face: the ui-custom scope behind the toggle. */
export interface MarkdownRenderInjected {
    hooks: {
        mdRender: SettingsScope<UiCustomSection>;
    };
}
/** Full props of the shadowed user/steering renderer. */
export type UserMarkdownNodeProps = PropsRuntime<'conversation.chat.node', 'user' | 'steering'> & PropsLocale<'conversation'> & InjectFace<MarkdownRenderInjected>;
/** User and admitted-steering keyed Chat renderer (shadow, priority -1). */
export declare const UserMarkdownNodeView: import("react").MemoExoticComponent<({ node, loadImage, t, useMdRender, }: UserMarkdownNodeProps) => import("react").JSX.Element>;
//# sourceMappingURL=UserMarkdownNodeView.d.ts.map
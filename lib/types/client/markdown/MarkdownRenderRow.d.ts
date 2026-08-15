/**
 * General-settings row: whether the user's own messages render as Markdown.
 * Reads/writes the ui-custom settings scope's `renderUserMarkdown`; the chat
 * renderer shadows the user node cell and switches on this flag.
 */
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client';
import type { UiCustomSection } from '../../shared.ts';
/** Registration-side preference face. */
export interface MarkdownRenderRowInjected {
    hooks: {
        /** The ui-custom settings scope, read for renderUserMarkdown. */
        mdRender: SettingsScope<UiCustomSection>;
    };
    /** Toggle Markdown rendering for the user's own messages. */
    setRenderUserMarkdown: (enabled: boolean) => void;
}
/** Full Settings-row props. */
export type MarkdownRenderRowProps = PropsRuntime<'settings.general.item'> & PropsLocale<'markdown'> & InjectFace<MarkdownRenderRowInjected>;
/**
 * Render the Markdown-rendering toggle row.
 * @param props - composed Settings slot props.
 */
export declare function MarkdownRenderRow({ useMdRender, setRenderUserMarkdown, t }: MarkdownRenderRowProps): import("react").JSX.Element;
//# sourceMappingURL=MarkdownRenderRow.d.ts.map
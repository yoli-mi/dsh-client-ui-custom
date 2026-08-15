import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
export interface KeyCaptureProps {
    /** The current combo spec ('' = unbound). */
    value: string;
    /** Called with a freshly recorded combo spec. */
    onChange: (spec: string) => void;
    /** Section translator. */
    t: TranslateNS<'shortcuts'>;
    /** Whether the document accepts writes. */
    disabled?: boolean;
    /** Optional id for label association. */
    id?: string;
}
/**
 * Render the recorder button.
 * @param props - recorder props.
 * @returns the button element.
 */
export declare function KeyCapture({ value, onChange, t, disabled, id }: KeyCaptureProps): import("react").JSX.Element;
//# sourceMappingURL=KeyCapture.d.ts.map
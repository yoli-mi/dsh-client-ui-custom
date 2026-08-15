import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import css from './MarkdownRenderRow.module.css';
/**
 * Render the Markdown-rendering toggle row.
 * @param props - composed Settings slot props.
 */
export function MarkdownRenderRow({ useMdRender, setRenderUserMarkdown, t }) {
    const scope = useMdRender((value) => value);
    const enabled = scope?.value?.renderUserMarkdown ?? false;
    const translator = t;
    return (_jsxs("div", { className: css.row, children: [_jsxs("div", { className: css.rowText, children: [_jsx("div", { className: css.title, children: translator('renderTitle') }), _jsx("div", { className: css.desc, children: translator('renderDesc') })] }), _jsx("label", { className: css.switch, children: _jsx("input", { type: "checkbox", className: css.checkbox, "aria-label": translator('renderTitle'), checked: enabled, onChange: (event) => setRenderUserMarkdown(event.target.checked) }) })] }));
}
//# sourceMappingURL=MarkdownRenderRow.js.map
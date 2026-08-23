import { jsx as _jsx } from "react/jsx-runtime";
import { UsagePanel } from "./UsagePanel.js";
/**
 * Render the usage section content.
 * @param props - composed slot props + injected sessions hook.
 * @returns the section element tree.
 */
export function UsageSection({ t, useSessions }) {
    return (_jsx("div", { "data-dsu-motion": "fade-up", children: _jsx(UsagePanel, { useSessions: useSessions, t: t }) }));
}
//# sourceMappingURL=UsageSection.js.map
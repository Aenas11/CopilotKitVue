export interface OpenGenerativeUIContent {
    initialHeight?: number;
    generating?: boolean;
    css?: string;
    cssComplete?: boolean;
    html?: string[];
    htmlComplete?: boolean;
    jsFunctions?: string;
    jsFunctionsComplete?: boolean;
    jsExpressions?: string[];
    jsExpressionsComplete?: boolean;
}

export function extractCompleteStyles(html: string): string {
    const matches = html.match(/<style\b[^>]*>[\s\S]*?<\/style>/gi);
    return matches ? matches.join("") : "";
}

export function processPartialHtml(html: string): string {
    let result = html;

    result = result.replace(/<[^>]*$/, "");
    result = result.replace(/<(style|script|head)\b[^>]*>[\s\S]*?<\/\1>/gi, "");
    result = result.replace(/<(style|script|head)\b[^>]*>[\s\S]*$/gi, "");
    result = result.replace(/&[a-zA-Z0-9#]*$/, "");

    const bodyMatch = result.match(/<body[^>]*>([\s\S]*)/i);
    if (bodyMatch) {
        result = bodyMatch[1] ?? "";
        result = result.replace(/<\/body>[\s\S]*/i, "");
    }

    return result;
}

export function ensureHead(html: string): string {
    if (/<head[\s>]/i.test(html)) {
        return html;
    }
    return `<head></head>${html}`;
}

export function injectCssIntoHtml(html: string, css: string): string {
    const headCloseIdx = html.indexOf("</head>");
    if (headCloseIdx !== -1) {
        return `${html.slice(0, headCloseIdx)}<style>${css}</style>${html.slice(headCloseIdx)}`;
    }
    return `<head><style>${css}</style></head>${html}`;
}

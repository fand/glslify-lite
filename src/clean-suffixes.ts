const suffix = /^([^_]+)_(\d{4,})$/;

/**
 * Remove redundant suffixes from identifier tokens
 */
export default function clean(tokens: Token[]): Token[] {
    const blacklist: { [data: string]: boolean } = {};
    const index: { [pre: string]: { [suf: string]: Token[] } } = {};

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (token.type !== "ident") continue;
        const match = token.data.match(suffix);
        if (!match) {
            blacklist[token.data] = true;
            continue;
        }

        const pre = match[1];
        const suf = match[2];

        index[pre] = index[pre] || {};
        index[pre][suf] = index[pre][suf] || [];
        index[pre][suf].push(token);
    }

    Object.keys(index).forEach(function(prefix) {
        const suffixes = Object.keys(index[prefix]);
        if (suffixes.length === 1 && !blacklist[prefix]) {
            const tokens = index[prefix][suffixes[0]];
            for (let i = 0; i < tokens.length; i++) {
                tokens[i].data = prefix;
            }

            return;
        }

        suffixes.forEach(function(suffix, i) {
            const token = index[prefix][suffix];
            const rename = prefix + "_" + i;
            if (blacklist[rename]) return;
            for (let j = 0; j < token.length; j++) {
                token[j].data = rename;
            }
        });
    });

    return tokens;
}

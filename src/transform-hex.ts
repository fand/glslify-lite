const regexLong = /#([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})?/i;
const regexShort = /#([a-f0-9])([a-f0-9])([a-f0-9])([a-f0-9])?(...)?/i;

function makeFloat(n: number): string {
    return String(n).indexOf(".") === -1 ? n + "." : n + "";
}

function makeVec(r: string, g: string, b: string, a: string): string {
    const nr = parseInt(r, 16) / 255;
    const ng = parseInt(g, 16) / 255;
    const nb = parseInt(b, 16) / 255;
    const na = parseInt(a, 16) / 255;

    return isNaN(na)
        ? "vec3(" + [nr, ng, nb].map(makeFloat).join(",") + ")"
        : "vec4(" + [nr, ng, nb, na].map(makeFloat).join(",") + ")";
}

export default (tokens: Token[]): Token[] => {
    return tokens.map(
        (t): Token => {
            if (t.type !== "preprocessor") return t;

            // "#define" matches hex code, so omit them before matchinf regex
            if (t.data.match(/#\s*define/)) return t;
            console.log(t);

            const m = t.data.match(regexLong) || t.data.match(regexShort);
            if (m && m.length > 3) {
                t.data = makeVec(m[1], m[2], m[3], m[4]);
                return t;
            }

            return t;
        }
    );
};

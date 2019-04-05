import * as sourceMap from "source-map";
import * as convert from "convert-source-map";

export default function tokensToString(tokens: Token[]): string {
    const output: string[] = [];
    const map = new sourceMap.SourceMapGenerator();

    let line = 1;
    let column = 1;

    tokens.forEach(token => {
        if (token.type === "eof") return;

        output.push(token.data);

        const sourceFile = token.source;
        const originalPos = token.original;
        if (!sourceFile || !originalPos) {
            return;
        }

        const tokenMap = {
            source: sourceFile,
            original: {
                line: originalPos.line,
                column: originalPos.column
            },
            generated: {
                line: line,
                column: column
            }
        };
        map.addMapping(tokenMap);

        const lines = token.data.split(/\r\n|\r|\n/);
        if (lines.length > 1) {
            // if token has multiple lines
            line += lines.length - 1;
            column = lines[lines.length - 1].length + 1;
        } else {
            column += token.data.length;
        }
    });

    const src = output.join("");
    const mapJSON = map.toString();
    const mapComment = convert.fromJSON(mapJSON).toComment();

    return src + "\n" + mapComment;
}

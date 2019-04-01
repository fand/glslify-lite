import * as sourceMap from 'source-map';
import * as convert from 'convert-source-map';

export default function tokensToStrign(tokens: Token[]): string {
    const output: string[] = [];
    const map = new sourceMap.SourceMapGenerator();

    let line = 1;
    let column = 1;

    tokens.forEach(token => {
        if (token.type === 'eof') return

        output.push(token.data)

        const sourceFile = token.source;
        if (!sourceFile) { return; }

        const originalLine = token.original ? token.original.line : token.line;
        const originalColumn = token.original ? token.original.column : token.column;

        map.addMapping({
            source: sourceFile,
            original: {
                line: originalLine,
                column: originalColumn,
            },
            generated: {
                line: line,
                column: column
            },
        });

        const lines = token.data.split(/\r\n|\r|\n/);
        line += lines.length - 1
        column = lines.length > 1 ?
            lines[lines.length - 1].length :
            (column + token.data.length);
    })

    const src = output.join('');
    const mapJSON = map.toString();
    const mapComment = convert.fromJSON(mapJSON).toComment();

    return src + '\n' + mapComment;
}

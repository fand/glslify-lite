import resolve = require("glsl-resolve");
import path = require("path");
import fs = require("fs");
import * as sourceMap from "source-map";
import * as convert from "convert-source-map";
import p from "pify";

function getImportPath(data: string): string | void {
    const m = /#pragma glslify:\s*import\(([^)]+)\)/.exec(data);
    if (m && m[1]) return m[1];
}

function getIncludePath(data: string): string | void {
    const m = /#include\s+"([^"]+)"/.exec(data);
    if (m && m[1]) return m[1];
}

export default async (src: string, filepath: string): Promise<string> => {
    const map = new sourceMap.SourceMapGenerator();
    const basedir = path.dirname(filepath);

    const lines: { content: string; source: string; line: number }[] = [];

    const dig = async (str: string, file: string): Promise<void> => {
        const strLines = str.split("\n");
        for (let i = 0; i < strLines.length; i++) {
            const line = strLines[i];
            let rawImportPath = getImportPath(line) || getIncludePath(line);

            if (rawImportPath) {
                // Append "./" so that glsl-resolve can find the file
                if (!rawImportPath.match(/^\.\//)) {
                    rawImportPath = `./${rawImportPath}`;
                }

                const importPath = await p(resolve)(rawImportPath, { basedir });
                const importFile = await p(fs.readFile)(importPath, "utf8");
                await dig(importFile, importPath);
            } else {
                lines.push({ content: line, source: file, line: i + 1 });
            }
        }
    };

    await dig(src, filepath);

    let output = "";
    lines.forEach(
        (l, i: number): void => {
            output += l.content + "\n";
            map.addMapping({
                source: l.source,
                original: {
                    line: l.line,
                    column: 1
                },
                generated: {
                    line: i + 1,
                    column: 1
                }
            });
        }
    );

    const mapJSON = map.toString();
    const mapComment = convert.fromJSON(mapJSON).toComment();

    return output + "\n" + mapComment;
};

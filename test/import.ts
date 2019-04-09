import test from "ava";
import * as path from "path";
import * as fs from "fs";
import gImport from "../src/glslify-import";
import * as convert from "convert-source-map";
import * as sourceMap from "source-map";

interface MapPos {
    line: number;
    column: number;
    name: string | null;
    source: string | null;
}

// Util: get original position
const gOP = (
    src: string,
    pos: { line: number; column: number },
    consumer: sourceMap.SourceMapConsumer
): MapPos | undefined => {
    // Try exact line
    const op = consumer.originalPositionFor(pos);
    if (op.line !== null) {
        return op;
    }

    const lines = src.split("\n");
    const line = lines[pos.line - 1]; // pos.line is 1-origin

    // Find nearest mappings
    let pBefore: MapPos, pAfter: MapPos;
    for (let i = pos.column - 1; i > 0; i--) {
        const op = consumer.originalPositionFor({ line: pos.line, column: i });
        if (op.line !== null) {
            pBefore = op;
            break;
        }
    }
    for (let i = pos.column + 1; i <= line.length + 1; i++) {
        const op = consumer.originalPositionFor({ line: pos.line, column: i });
        if (op.line !== null) {
            pAfter = op;
            break;
        }
    }

    if (pBefore && pAfter) {
        return pos.column - pBefore.column < pAfter.column - pos.column
            ? pBefore
            : pAfter;
    }
    if (pBefore || pAfter) {
        return pBefore || pAfter;
    }

    return undefined;
};

test("nested imports", async (t): Promise<void> => {
    const filepath = path.resolve(__dirname, "fixtures/import-entry.glsl");
    const input = fs.readFileSync(filepath, "utf8");
    const output = await gImport(input, filepath);

    // Test sourcemaps
    const lastLine = output.split("\n").pop();
    const sm = convert.fromComment(lastLine).toObject();
    const consumer = await new sourceMap.SourceMapConsumer(sm);

    const hasPos = (
        line: number,
        column: number,
        expLine: number,
        expCol: number,
        source: string
    ) => {
        const op = gOP(output, { line, column }, consumer);
        t.deepEqual(
            { line: op.line, column: op.column },
            { line: expLine, column: expCol }
        );
        t.regex(op.source, new RegExp(source));
    };

    hasPos(1, 1, 1, 1, "import-entry");
    hasPos(2, 1, 2, 1, "import-entry");

    hasPos(3, 1, 1, 1, "import-1");
    hasPos(4, 1, 2, 1, "import-1"); // line for EOF

    hasPos(5, 1, 4, 1, "import-entry");

    hasPos(6, 1, 1, 1, "import-2");

    hasPos(7, 1, 1, 1, "import-3");
    hasPos(8, 1, 2, 1, "import-3");
    hasPos(9, 1, 3, 1, "import-3");
    hasPos(10, 1, 4, 1, "import-3"); // line for EOF

    hasPos(11, 1, 3, 1, "import-2");
    hasPos(12, 1, 4, 1, "import-2"); // line for EOF

    hasPos(14, 1, 7, 1, "import-entry");

    consumer.destroy();
});

test("nested includes and imports", async (t): Promise<void> => {
    const filepath = path.resolve(__dirname, "fixtures/include-entry.glsl");
    const input = fs.readFileSync(filepath, "utf8");
    const output = await gImport(input, filepath);

    // Test sourcemaps
    const lastLine = output.split("\n").pop();
    const sm = convert.fromComment(lastLine).toObject();
    const consumer = await new sourceMap.SourceMapConsumer(sm);

    const hasPos = (
        line: number,
        column: number,
        expLine: number,
        expCol: number,
        source: string
    ) => {
        const op = gOP(output, { line, column }, consumer);
        t.deepEqual(
            { line: op.line, column: op.column },
            { line: expLine, column: expCol }
        );
        t.regex(op.source, new RegExp(source));
    };

    hasPos(1, 1, 1, 1, "include-entry");
    hasPos(2, 1, 2, 1, "include-entry");

    hasPos(3, 1, 1, 1, "include-1");
    hasPos(4, 1, 2, 1, "include-1"); // line for EOF

    hasPos(5, 1, 4, 1, "include-entry");

    hasPos(6, 1, 1, 1, "include-2");

    hasPos(7, 1, 1, 1, "include-3");
    hasPos(8, 1, 2, 1, "include-3");
    hasPos(9, 1, 3, 1, "include-3");
    hasPos(10, 1, 4, 1, "include-3"); // line for EOF

    hasPos(11, 1, 3, 1, "include-2");
    hasPos(12, 1, 4, 1, "include-2"); // line for EOF

    hasPos(14, 1, 7, 1, "include-entry");

    consumer.destroy();
});

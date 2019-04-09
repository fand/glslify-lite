import test from "ava";
import * as path from "path";
import * as fs from "fs";
import { compile } from "../src/glslify";
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

test("hex transform", async (t): Promise<void> => {
    const filepath = path.resolve(__dirname, "fixtures/hex.glsl");
    const input = fs.readFileSync(filepath, "utf8");
    const output = await compile(input);

    // Test sourcemaps
    const lastLine = output.split("\n").pop();
    const sm = convert.fromComment(lastLine).toObject();
    const consumer = await new sourceMap.SourceMapConsumer(sm);

    const hasPos = (
        line: number,
        column: number,
        expLine: number,
        expCol: number
    ) => {
        const op = gOP(output, { line, column }, consumer);
        t.deepEqual(
            { line: op.line, column: op.column },
            { line: expLine, column: expCol }
        );
    };
    console.log(output);
    hasPos(1, 1, 1, 1);

    t.assert(true);

    consumer.destroy();
});

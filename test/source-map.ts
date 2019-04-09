import test from "ava";
import * as path from "path";
import { file } from "../src/glslify";
import * as convert from "convert-source-map";
import * as sourceMap from "source-map";
import { createPosTest } from "./_util";

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

test("Import npm packages", async (t): Promise<void> => {
    const output = await file(path.resolve(__dirname, "fixtures/test01.frag"));

    // Test sourcemaps
    const lastLine = output.split("\n").pop();
    t.assert(
        /\/\/# sourceMappingURL=data:application\/json;charset=utf-8;base64,/.test(
            lastLine
        ),
        "contains sourceMaps of the file"
    );

    const sm = convert.fromComment(lastLine).toObject();
    const consumer = await new sourceMap.SourceMapConsumer(sm);
    const hasPos = (
        line: number,
        column: number,
        expLine: number,
        expCol: number
    ): void => {
        const op = gOP(output, { line, column }, consumer);
        // console.log(line, column, op.line, op.column);
        t.deepEqual(
            { line: op.line, column: op.column },
            { line: expLine, column: expCol }
        );
    };

    // Line 12
    hasPos(12, 0, 12, 1);
    hasPos(12, 1, 12, 1);
    hasPos(12, 4, 12, 1);
    hasPos(12, 5, 12, 5);
    hasPos(12, 6, 12, 6);
    hasPos(12, 22, 12, 6);
    hasPos(12, 23, 12, 12);
    hasPos(12, 24, 12, 13);
    hasPos(12, 27, 12, 13);
    hasPos(12, 28, 12, 17);
    hasPos(12, 29, 12, 18);
    hasPos(12, 30, 12, 19);
    hasPos(12, 31, 12, 20);
    hasPos(12, 32, 12, 21);
    hasPos(12, 33, 12, 22);

    // Line 101
    hasPos(101, 0, 101, 33);
    hasPos(101, 1, 101, 33);
    hasPos(101, 35, 101, 33);
    hasPos(101, 36, 101, 36);
    hasPos(101, 58, 101, 58);
    hasPos(101, 59, 101, 59);
    hasPos(101, 60, 101, 60);

    // Line 109
    hasPos(109, 0, 5, 3);
    hasPos(109, 1, 5, 3);
    hasPos(109, 3, 5, 3);
    hasPos(109, 14, 5, 3);
    hasPos(109, 15, 5, 15);
    hasPos(109, 22, 5, 22);
    hasPos(109, 23, 5, 23);
    hasPos(109, 39, 5, 23);
    hasPos(109, 40, 5, 28);
    hasPos(109, 41, 5, 29);
    hasPos(109, 54, 5, 42);
    hasPos(109, 55, 5, 43);

    consumer.destroy();
});

test("nested imports", async (t): Promise<void> => {
    const output = await file(
        path.resolve(__dirname, "fixtures/nest-conflict-entry.glsl")
    );

    // Test sourcemaps
    const lastLine = output.split("\n").pop();
    const sm = convert.fromComment(lastLine).toObject();
    const consumer = await new sourceMap.SourceMapConsumer(sm);
    const hasPos = createPosTest(t, output, consumer);

    hasPos(1, 1, 1, 1, "nest-conflict-entry");
    hasPos(3, 1, 3, 1, "nest-conflict-entry");

    hasPos(5, 1, 1, 1, "nest-conflict-2");

    hasPos(11, 1, 3, 1, "nest-conflict-1");
    hasPos(12, 1, 4, 1, "nest-conflict-1");

    hasPos(17, 1, 8, 1, "nest-conflict-entry");
    hasPos(19, 1, 10, 1, "nest-conflict-entry");

    consumer.destroy();
});

import * as sourceMap from "source-map";

// Util: get original position
export const getOriginalPos = (
    src: string,
    pos: { line: number; column: number },
    consumer: sourceMap.SourceMapConsumer
): MapPos | undefined => {
    // Try exact line
    const op = consumer.originalPositionFor(pos);
    if (op.line !== null) {
        return op as MapPos;
    }

    const lines = src.split("\n");
    const line = lines[pos.line - 1]; // pos.line is 1-origin

    // Find nearest mappings
    let pBefore: MapPos | undefined = undefined;
    let pAfter: MapPos | undefined = undefined;
    for (let i = pos.column - 1; i > 0; i--) {
        const op = consumer.originalPositionFor({ line: pos.line, column: i });
        if (op.line !== null) {
            pBefore = op as MapPos;
            break;
        }
    }
    for (let i = pos.column + 1; i <= line.length + 1; i++) {
        const op = consumer.originalPositionFor({ line: pos.line, column: i });
        if (op.line !== null) {
            pAfter = op as MapPos;
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

export const createPosTest = (
    t: any,
    output: string,
    consumer: sourceMap.SourceMapConsumer
): any => (
    line: number,
    column: number,
    expLine: number,
    expCol: number,
    source?: string
): void => {
    const op = getOriginalPos(output, { line, column }, consumer);
    if (op) {
        t.deepEqual(
            { line: op.line, column: op.column },
            { line: expLine, column: expCol }
        );
        if (source) {
            t.regex(op.source, new RegExp(source));
        }
    }
};

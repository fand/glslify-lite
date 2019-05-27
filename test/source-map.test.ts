import * as path from "path";
import { file } from "../src/glslify";
import * as convert from "convert-source-map";
import * as sourceMap from "source-map";
import { createPosTest } from "./_util";

test("Import npm packages", async (): Promise<void> => {
    const output = await file(path.resolve(__dirname, "fixtures/test01.frag"));

    // Test sourcemaps
    const lastLine = output.split("\n").pop() as string;
    expect(lastLine).toMatch(
        /\/\/# sourceMappingURL=data:application\/json;charset=utf-8;base64,/
    ); // contains sourceMaps of the file

    const sm = convert.fromComment(lastLine).toObject();
    const consumer = await new sourceMap.SourceMapConsumer(sm);
    const hasPos = createPosTest(expect, output, consumer);

    // Line 12
    hasPos(12, 0, 12, 1);
    hasPos(12, 1, 12, 1);
    hasPos(12, 4, 12, 1);
    hasPos(12, 5, 12, 5); // TODO
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

test("nested imports", async (): Promise<void> => {
    const output = await file(
        path.resolve(__dirname, "fixtures/nest-conflict-entry.glsl")
    );

    // Test sourcemaps
    const lastLine = output.split("\n").pop() as string;
    const sm = convert.fromComment(lastLine).toObject();
    const consumer = await new sourceMap.SourceMapConsumer(sm);
    const hasPos = createPosTest(expect, output, consumer);

    hasPos(1, 1, 1, 1, "nest-conflict-entry");
    hasPos(3, 1, 3, 1, "nest-conflict-entry");

    hasPos(5, 1, 1, 1, "nest-conflict-2");

    hasPos(11, 1, 3, 1, "nest-conflict-1");
    hasPos(12, 1, 4, 1, "nest-conflict-1");

    hasPos(17, 1, 8, 1, "nest-conflict-entry");
    hasPos(19, 1, 10, 1, "nest-conflict-entry");

    consumer.destroy();
});

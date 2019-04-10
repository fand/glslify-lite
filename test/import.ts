import test from "ava";
import * as path from "path";
import * as fs from "fs";
import gImport from "../src/glslify-import";
import { file } from "../src/glslify";
import * as convert from "convert-source-map";
import * as sourceMap from "source-map";
import { createPosTest } from "./_util";

test("nested imports", async (t): Promise<void> => {
    const filepath = path.resolve(__dirname, "fixtures/import-entry.glsl");
    const input = fs.readFileSync(filepath, "utf8");
    const output = await gImport(input, filepath);

    // Test sourcemaps
    const lastLine = output.split("\n").pop() as string;
    const sm = convert.fromComment(lastLine).toObject();
    const consumer = await new sourceMap.SourceMapConsumer(sm);
    const hasPos = createPosTest(t, output, consumer);

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
    const lastLine = output.split("\n").pop() as string;
    const sm = convert.fromComment(lastLine).toObject();
    const consumer = await new sourceMap.SourceMapConsumer(sm);
    const hasPos = createPosTest(t, output, consumer);

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

test("Bundling nested includes and imports", async (t): Promise<void> => {
    const filepath = path.resolve(__dirname, "fixtures/include-entry.glsl");
    const output = await file(filepath);
    console.log(output);
    // Test sourcemaps
    const lastLine = output.split("\n").pop() as string;
    const sm = convert.fromComment(lastLine).toObject();
    const consumer = await new sourceMap.SourceMapConsumer(sm);
    const hasPos = createPosTest(t, output, consumer);

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

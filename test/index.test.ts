import * as path from "path";
import { file, compile } from "../src/glslify";

test("node string", async (): Promise<void> => {
    var output = await compile(
        [
            '  #pragma glslify: noise = require("glsl-noise/simplex/3d")',
            "  precision mediump float;",
            "  varying vec3 vpos;",
            "  void main () {",
            "    gl_FragColor = vec4(noise(vpos*25.0),1);",
            "  }"
        ].join("\n")
    );
    expect(output).toMatch(/taylorInvSqrt/); // contains parts of the file
});

test("node file", async (): Promise<void> => {
    var output = await file(path.resolve(__dirname, "fixtures/test01.frag"));
    expect(output).toMatch(/taylorInvSqrt/); // contains parts of the file
});

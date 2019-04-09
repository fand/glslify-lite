import test from "ava";
import * as path from "path";
import { file, compile } from "../src/glslify";

test("node string", async t => {
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
    t.assert(/taylorInvSqrt/.test(output), "contains parts of the file");
});

test("node file", async t => {
    var output = await file(path.resolve(__dirname, "fixtures/test01.frag"));
    t.assert(/taylorInvSqrt/.test(output), "contains parts of the file");
});

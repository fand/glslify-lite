import test from 'ava';
import { file, compile, tag } from '../src/glslify';

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

test("node simulated tagged template string", async t => {
    var output = await tag(
        [
            `
#pragma glslify: noise = require("glsl-noise/simplex/3d")
precision mediump float;
varying vec3 vpos;
void main () {
    gl_FragColor = vec4(noise(vpos*`, `),1);
}`
        ],
        "25.0" as any
    );
    t.assert(/taylorInvSqrt/.test(output), "contains parts of the file");
    t.assert(/vpos\*25\.0\),1/.test(output), "interpolated var");
});

test("node tagged template string", async function(t) {
    var output = await tag`
#pragma glslify: noise = require("glsl-noise/simplex/3d")
precision mediump float;
varying vec3 vpos;
void main () {
    gl_FragColor = vec4(noise(vpos*${"25.0"}),1);
}
    `;
    t.assert(/taylorInvSqrt/.test(output), "contains parts of the file");
    t.assert(/vpos\*25\.0\),1/.test(output), "interpolated var");
});

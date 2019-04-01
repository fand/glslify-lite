import test from 'ava';
import { file, compile, tag } from '../src/glslify';
import * as convert from 'convert-source-map';

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

    // Test sourcemaps
    const lastLine = output.split('\n').pop();
    t.assert(/\/\/# sourceMappingURL=data:application\/json;charset=utf-8;base64,/.test(lastLine), "contains sourceMaps of the file");

    const json = convert.fromComment(lastLine).toObject();
    t.assert(typeof json.sources !== 'undefined', 'Sourcemap has sources property');
    t.assert(typeof json.names !== 'undefined', 'Sourcemap has names property');
    t.assert(typeof json.mappings !== 'undefined', 'Sourcemap has mapping property');
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

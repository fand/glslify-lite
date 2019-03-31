const test = require("ava");
const glx = require("../");

test("node string", async function(t) {
    var output = await glx(
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

test("node simulated tagged template string", async function(t) {
    var output = await glx(
        [
            "" +
                '  #pragma glslify: noise = require("glsl-noise/simplex/3d")\n' +
                "  precision mediump float;\n" +
                "  varying vec3 vpos;\n" +
                "  void main () {\n" +
                "    gl_FragColor = vec4(noise(vpos*",
            "),1);\n" + "  }\n"
        ],
        "25.0"
    );
    t.assert(/taylorInvSqrt/.test(output), "contains parts of the file");
    t.assert(/vpos\*25\.0\),1/.test(output), "interpolated var");
});

test("node tagged template string", async function(t) {
    var output = await Function(
        ["glx"],
        "return glx`\n" +
            '  #pragma glslify: noise = require("glsl-noise/simplex/3d")\n' +
            "  precision mediump float;\n" +
            "  varying vec3 vpos;\n" +
            "  void main () {\n" +
            '    gl_FragColor = vec4(noise(vpos*${"25.0"}),1);\n' +
            "  }\n" +
            "`"
    )(glx);
    t.assert(/taylorInvSqrt/.test(output), "contains parts of the file");
    t.assert(/vpos\*25\.0\),1/.test(output), "interpolated var");
});

import * as path from "path";
import * as cp from "child_process";
import * as fs from "fs";
import * as tmp from "tmp";
import p = require("pify");

const cmd = path.resolve(__dirname, "../bin/cli.js");
const exec = (...args: string[]) => {
    const proc = cp.spawnSync(cmd, args);
    return proc.stdout.toString();
};

const test01 = `
#pragma glslify: noise = require("glsl-noise/simplex/3d")
precision mediump float;
varying vec3 vpos;
void main () {
    gl_FragColor = vec4(noise(vpos*25.0),1);",
}
`;

test("CLI version", async (): Promise<void> => {
    const output = exec("-v");
    expect(output).toEqual(exec("--version"));
});

test("CLI help", async (): Promise<void> => {
    const output = exec("-h");
    expect(output).toEqual(exec("--help"));
    expect(output).toMatch("Usage");
    expect(output).toMatch("Example");
});

test("CLI read file and write to STDOUT", async (): Promise<void> => {
    const input = path.resolve(__dirname, "fixtures/test01.frag");
    expect(exec(input)).toMatch(/taylorInvSqrt/);
});

test("CLI read file and write to file", async (): Promise<void> => {
    const input = path.resolve(__dirname, "fixtures/test01.frag");
    const dst = tmp.fileSync().name;
    exec(input, "-o", dst);

    const output = await p(fs.readFile)(dst, "utf8");
    expect(output).toMatch(/taylorInvSqrt/);
});

test("CLI read STDIN and write to STDOUT", async (): Promise<void> => {
    const proc = cp.spawnSync(cmd, [], { input: test01 });

    const output = proc.stdout.toString();
    expect(output).toMatch(/taylorInvSqrt/);
});

test("CLI read STDIN and write to file", async (): Promise<void> => {
    const dst = tmp.fileSync().name;
    cp.spawnSync(cmd, ["-o", dst], { input: test01 });

    const output = await p(fs.readFile)(dst, "utf8");
    expect(output).toMatch(/taylorInvSqrt/);
});

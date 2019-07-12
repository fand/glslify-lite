import * as glslify from "..";
import { file, compile } from "..";

test("ES modules import", async (): Promise<void> => {
    expect(typeof glslify.compile).toEqual("function");
    expect(typeof glslify.file).toEqual("function");
    expect(glslify.compile).toEqual(compile);
    expect(glslify.file).toEqual(file);
});

test("CommonJS require", async (): Promise<void> => {
    const g = require("..");
    expect(typeof g.compile).toEqual("function");
    expect(typeof g.file).toEqual("function");
});

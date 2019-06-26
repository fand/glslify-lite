#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const meow = require("meow");
const getStdin = require("get-stdin");
const p = require("pify");
const glslify = require("..");

const cli = meow(
    `
    Usage
      $ glslify-lite <input> -o <output>

    Options
      --output, -o     Specify an output file to write your shader to.
      --version, -v    Output version number.
      --help, -h       Display this message.

    Examples
      Read index.glsl and write to output.glsl:
      $ glslify-lite index.glsl -o output.glsl

      Alternatively:
      $ cat index.glsl | glslify-lite > output.glsl
`,
    {
        flags: {
            output: {
                type: "string",
                alias: "o"
            },
            help: {
                type: "bool",
                alias: "h"
            },
            version: {
                type: "bool",
                alias: "v"
            }
        }
    }
);

if (cli.flags.help) {
    cli.showHelp();
    process.exit(0);
}

if (cli.flags.version) {
    cli.showVersion();
    process.exit(0);
}

const die = msg => {
    console.error(`ERROR: ${msg}`);
    process.exit(-1);
};

(async () => {
    let shader;
    if (cli.input[0]) {
        const input = path.resolve(process.cwd(), cli.input[0]);
        shader = await glslify.file(input, { basedir: process.cwd() });
    } else {
        const input = await getStdin();
        if (input.trim() == "") {
            die("Input from STDIN is empty");
        }
        shader = await glslify.compile(input, { basedir: process.cwd() });
    }

    if (!shader) {
        die("Invalid output");
    }

    if (cli.flags.output) {
        const output = cli.flags.output;
        await p(fs.writeFile)(output, shader, "utf8");
    } else {
        console.log(shader);
    }
})();

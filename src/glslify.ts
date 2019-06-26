import glslifyBundle from "./glslify-bundle";
import * as path from "path";
import * as stackTrace from "stack-trace";
import p from "pify";
import glslifyDeps = require("glslify-deps");

interface GlslifyOpts {
    basedir?: string;
}

class Glslifier {
    private basedir: string;

    public constructor() {
        try {
            // Get the filepath where module.exports.compile etc. was called
            this.basedir = path.dirname(stackTrace.get()[2].getFileName());
        } catch (err) {
            this.basedir = process.cwd();
        }
    }

    /**
     * Bundle the shader given as a string.
     * @param src - The content of the input shader
     */
    public async compile(src: string, opts?: GlslifyOpts): Promise<string> {
        if (!opts) {
            opts = {};
        }
        const depper = this.createDepper(opts);
        const deps = await p(depper.inline.bind(depper))(
            src,
            opts.basedir || this.basedir
        );

        return glslifyBundle(deps);
    }

    /**
     * Bundle the shader for given filename.
     * @param filename - The filepath of the input shader
     */
    public async file(filename: string, opts?: GlslifyOpts): Promise<string> {
        if (!opts) {
            opts = {};
        }
        const depper = this.createDepper(opts);
        const deps = await p(depper.add.bind(depper))(
            path.resolve(opts.basedir || this.basedir, filename)
        );

        return glslifyBundle(deps);
    }

    /**
     * Create depper for the basedir.
     */
    private createDepper(opts?: GlslifyOpts): Depper {
        if (!opts) opts = {};
        return glslifyDeps({ cwd: opts.basedir || this.basedir });
    }
}

export function compile(src: string, opts?: GlslifyOpts): Promise<string> {
    return new Glslifier().compile(src, opts);
}

export function file(file: string, opts?: GlslifyOpts): Promise<string> {
    return new Glslifier().file(file, opts);
}

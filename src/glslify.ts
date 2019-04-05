import glslifyBundle from "./glslify-bundle";
import * as path from "path";
import nodeResolve from "resolve";
import * as stackTrace from "stack-trace";
import p from "pify";
import glslifyDeps = require("glslify-deps");

interface GlslifyOpts {
    basedir?: string;
    transform?: [string, any][]; // eslint-disable-line
}

type Transform = any; // eslint-disable-line

class Glslifier {
    private basedir: string;
    private posts: PostTransform[] = [];

    constructor() {
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
        return this.bundle(deps);
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
        return this.bundle(deps);
    }

    /**
     * Create depper and install transformers.
     */
    private createDepper(opts?: GlslifyOpts): Depper {
        if (!opts) opts = {};
        const depper = glslifyDeps({ cwd: opts.basedir || this.basedir });
        let transforms = opts.transform || [];
        transforms = Array.isArray(transforms) ? transforms : [transforms];
        transforms.forEach((transform: Transform) => {
            transform = Array.isArray(transform) ? transform : [transform];
            const name = transform[0];
            const opts = transform[1] || {};
            if (opts.post) {
                this.posts.push({ name: name, opts: opts });
            } else {
                depper.transform(name, opts);
            }
        });
        return depper;
    }

    /**
     * Bundle deps and apply post transformations.
     */
    private bundle(deps: DepsInfo[]): string {
        let source = glslifyBundle(deps);

        // Load post transforms dynamically and apply them to the source
        this.posts.forEach(tr => {
            const target = nodeResolve.sync(tr.name, { basedir: this.basedir });
            const transform = require(target); // eslint-disable-line
            const src = transform(null, source, { post: true });
            if (src) {
                source = src;
            }
        });

        return source;
    }
}

export function compile(src: string, opts?: GlslifyOpts): Promise<string> {
    return new Glslifier().compile(src, opts);
}

export function file(file: string, opts?: GlslifyOpts): Promise<string> {
    return new Glslifier().file(file, opts);
}

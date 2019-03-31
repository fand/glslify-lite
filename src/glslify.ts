import glslifyBundle from "./glslify-bundle";
import * as path from "path";
import * as nodeResolve from "resolve";
import * as stackTrace from "stack-trace";
import p = require('pify');
import glslifyDeps = require("glslify-deps");

type GlslifyOpts = {
    basedir?: string;
    transform?: [string, any][];
    _flags?: any;
};

module.exports = function(arg: any, opts: GlslifyOpts): Promise<string> {
    if (Array.isArray(arg)) {
        // template string
        return iface().tag.apply(null, arguments as any);
    } else if (
        typeof arg === "string" &&
        !/\n/.test(arg) &&
        opts &&
        opts._flags
    ) {
        // browserify transform
        return require("./transform.js").apply(this, arguments);
    } else if (typeof arg === "string" && /\n/.test(arg)) {
        // source string
        return iface().compile(arg, opts);
    } else if (typeof arg === "string") {
        // source file
        return iface().file(arg, opts);
    } else throw new Error("unhandled argument type: " + typeof arg);
};

module.exports.compile = function(src: string, opts?: GlslifyOpts): Promise<string> {
    return iface().compile(src, opts);
};

module.exports.file = function(file: string, opts?: GlslifyOpts): Promise<string> {
    return iface().file(file, opts);
};

function iface() {
    try {
        var basedir = path.dirname(stackTrace.get()[2].getFileName());
    } catch (err) {
        basedir = process.cwd();
    }
    var posts: PostTransform[] = [];
    return { tag: tag, compile: compile, file: file };

    /**
     * Bundle
     */
    async function tag(strings: string[] | string): Promise<string> {
        if (typeof strings === "string") strings = [strings];
        var exprs = [].slice.call(arguments, 1);
        var parts = [];
        for (var i = 0; i < strings.length - 1; i++) {
            parts.push(strings[i], exprs[i] || "");
        }
        parts.push(strings[i]);
        return compile(parts.join(""));
    }

    /**
     * Bundle the shader given as a string.
     * @param src - The content of the input shader
     */
    async function compile(src: string, opts?: GlslifyOpts): Promise<string> {
        if (!opts) opts = {};
        var depper = gdeps(opts);
        var deps = await p(depper.inline.bind(depper))(src, opts.basedir || basedir);
        return bundle(deps);
    }

    /**
     * Bundle the shader for given filename.
     * @param filename - The filepath of the input shader
     */
    async function file(filename: string, opts?: GlslifyOpts): Promise<string> {
        if (!opts) opts = {};
        var depper = gdeps(opts);
        var deps = await p(depper.add.bind(depper))(path.resolve(opts.basedir || basedir, filename));
        return bundle(deps);
    }

    /**
     * Create depper and install transformers.
     */
    function gdeps(opts?: GlslifyOpts): Depper {
        if (!opts) opts = {};
        var depper = glslifyDeps({ cwd: opts.basedir || basedir });
        var transforms = opts.transform || [];
        transforms = Array.isArray(transforms) ? transforms : [transforms];
        transforms.forEach(function(transform: any) {
            transform = Array.isArray(transform) ? transform : [transform];
            var name = transform[0];
            var opts = transform[1] || {};
            if (opts.post) {
                posts.push({ name: name, opts: opts });
            } else {
                depper.transform(name, opts);
            }
        });
        return depper;
    }

    /**
     * Bundle deps and apply post transformations.
     */
    function bundle(deps: DepsInfo[]): string {
        var source = glslifyBundle(deps);

        // Load post transforms dynamically and apply them to the source
        posts.forEach(function(tr) {
            var target = nodeResolve.sync(tr.name, { basedir: basedir });
            var transform = require(target);
            var src = transform(null, source, { post: true });
            if (src) source = src;
        });

        return source;
    }
}

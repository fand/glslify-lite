/* eslint-disable no-redeclare */

import hash = require("murmurhash-js/murmurhash3_gc");
import trim = require("glsl-token-whitespace-trim");
import tokenize = require("glsl-tokenizer/string");
import inject = require("glsl-inject-defines");
import descope = require("glsl-token-descope");
import defines = require("glsl-token-defines");
import string = require("glsl-token-string");
import scope = require("glsl-token-scope");
import depth = require("glsl-token-depth");
import copy = require("shallow-copy");

import clean from "./clean-suffixes";
import topoSort from "./topo-sort";
import { DepsInfo, Token, DepsHash } from "./types";

module.exports = function(deps: DepsInfo[]) {
    return inject(new Bundle(deps).src, {
        GLSLIFY: 1
    });
};

class Bundle {
    src: string;
    depList: DepsInfo[];
    depIndex: DepsHash;
    exported: {} = {};
    cache: {} = {};
    varCounter: number = 0;

    constructor(deps: DepsInfo[]) {
        // Reorder dependencies topologically
        deps = topoSort(deps);

        this.depList = deps;
        this.depIndex = indexById(deps);

        for (var i = 0; i < deps.length; i++) {
            this.preprocess(deps[i]);
        }

        let tokens: Token[] = [];
        for (var i = 0; i < deps.length; i++) {
            if (deps[i].entry) {
                tokens = tokens.concat(this.bundle(deps[i]));
            }
        }

        const src = string(tokens);

        // Tokenize src again and tidy it up
        this.src = string(clean(trim(tokenize(src))));
    }

    preprocess(dep: DepsInfo) {
        var tokens = tokenize(dep.source);
        var imports = [];
        var exports = null;

        depth(tokens);
        scope(tokens);

        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            if (token.type !== "preprocessor") continue;
            if (!glslifyPreprocessor(token.data)) continue;

            var exported = glslifyExport(token.data);
            var imported = glslifyImport(token.data);

            if (exported) {
                exports = exported[1];
                tokens.splice(i--, 1);
            } else if (imported) {
                var name = imported[1];
                var maps = imported[2].split(/\s?,\s?/g);
                var path = maps
                    .shift()!
                    .trim()
                    .replace(/^'|'$/g, "")
                    .replace(/^"|"$/g, "");
                var target = this.depIndex[dep.deps[path]];
                imports.push({
                    name: name,
                    path: path,
                    target: target,
                    maps: toMapping(maps),
                    index: i
                });
                tokens.splice(i--, 1);
            }
        }

        var eof = tokens[tokens.length - 1];
        if (eof && eof.type === "eof") {
            tokens.pop();
        }

        if (dep.entry) {
            exports = exports || "main";
        }

        if (!exports) {
            throw new Error(dep.file + " does not export any symbols");
        }

        dep.parsed = {
            tokens: tokens,
            imports: imports,
            exports: exports
        };
    }

    /**
     * @param entry - An array of dependency entry returned from deps
     */
    bundle(entry: DepsInfo): Token[] {
        var resolved: { [name: string]: boolean } = {};
        var result = resolve(entry, [])[1];

        return result;

        function resolve(dep: DepsInfo, bindings: string[][]): [string, Token[]] {
            // Compute suffix for module
            bindings.sort();
            var ident = bindings.join(":") + ":" + dep.id;
            var suffix = "_" + hash(ident);

            if (dep.entry) {
                suffix = "";
            }

            // Test if export is already resolved
            var exportName = dep.parsed!.exports + suffix;
            if (resolved[exportName]) {
                return [exportName, []];
            }

            // Initialize map for variable renamings based on bindings
            var rename: { [from: string]: string | Token[] } = {};
            for (var i = 0; i < bindings.length; ++i) {
                var binding = bindings[i];
                rename[binding[0]] = binding[1];
            }

            // Resolve all dependencies
            var imports = dep.parsed!.imports;
            var edits: [number, Token[]][] = [];
            for (var i = 0; i < imports.length; ++i) {
                var data = imports[i];

                var importMaps = data.maps;
                var importName = data.name;
                var importTarget = data.target;

                var importBindings = Object.keys(importMaps).map(function(id) {
                    var value = importMaps[id];

                    // floats/ints should not be renamed
                    if (value.match(/^\d+(?:\.\d+?)?$/g)) {
                        return [id, value];
                    }

                    // properties (uVec.x, ray.origin, ray.origin.xy etc.) should
                    // have their host identifiers renamed
                    var parent = value.match(/^([^.]+)\.(.+)$/);
                    if (parent) {
                        return [
                            id,
                            (rename[parent[1]] || parent[1] + suffix) +
                                "." +
                                parent[2]
                        ];
                    }

                    return [id, rename[value] || value + suffix];
                });

                var importTokens = resolve(importTarget, importBindings);
                rename[importName] = importTokens[0];
                edits.push([data.index, importTokens[1]]);
            }

            // Rename tokens
            var parsedTokens = dep.parsed!.tokens.map(copy);
            var parsedDefs = defines(parsedTokens);
            var tokens = descope(parsedTokens, function(local: any) {
                if (parsedDefs[local]) return local;
                if (rename[local]) return rename[local];

                return local + suffix;
            });

            // Insert edits
            edits.sort((a, b) => {
                return b[0] - a[0];
            });

            for (var i = 0; i < edits.length; ++i) {
                var edit = edits[i];
                tokens = tokens
                    .slice(0, edit[0])
                    .concat(edit[1])
                    .concat(tokens.slice(edit[0]));
            }

            resolved[exportName] = true;
            return [exportName, tokens];
        }
    }
}

function glslifyPreprocessor(data: string): boolean {
    return /#pragma glslify:/.test(data);
}

function glslifyExport(data: string) {
    return /#pragma glslify:\s*export\(([^)]+)\)/.exec(data);
}

function glslifyImport(data: string) {
    return /#pragma glslify:\s*([^=\s]+)\s*=\s*require\(([^)]+)\)/.exec(data);
}

function indexById(deps: DepsInfo[]): DepsHash {
    return deps.reduce(function(hash: DepsHash, entry: DepsInfo) {
        hash[entry.id] = entry;
        return hash;
    }, {});
}

function toMapping(maps?: string[]) {
    if (!maps) return false;

    return maps.reduce(function(
        mapping: { [key: string]: string | undefined },
        defn
    ) {
        const defns = defn.split(/\s?=\s?/g);

        var expr = defns.pop();

        defns.forEach(function(key) {
            mapping[key] = expr;
        });

        return mapping;
    },
    {});
}

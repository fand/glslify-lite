import hash from "murmurhash-js/murmurhash3_gc";
import tokenize = require("glsl-tokenizer/string");
import descope = require("glsl-token-descope");
import defines = require("glsl-token-defines");
import scope = require("glsl-token-scope");
import depth = require("glsl-token-depth");
import copy = require("shallow-copy");

import topoSort from "./topo-sort";
import string from "./tokens-to-string";

function glslifyPreprocessor(data: string): boolean {
    return /#pragma glslify:/.test(data);
}

function glslifyExport(data: string): RegExpExecArray | null {
    return /#pragma glslify:\s*export\(([^)]+)\)/.exec(data);
}

function glslifyRequire(data: string): RegExpExecArray | null {
    return /#pragma glslify:\s*([^=\s]+)\s*=\s*require\(([^)]+)\)/.exec(data);
}

function indexById(deps: DepsInfo[]): DepsHash {
    return deps.reduce((hash: DepsHash, entry: DepsInfo): DepsHash => {
        hash[entry.id] = entry;
        return hash;
    }, {});
}

interface Mappings {
    [key: string]: string | undefined;
}

type Binding = string[];

function toMapping(maps?: string[]): {} | false {
    if (!maps) return false;

    return maps.reduce((mapping: Mappings, defn): Mappings => {
        const defns = defn.split(/\s?=\s?/g);

        const expr = defns.pop();

        defns.forEach(
            (key): void => {
                mapping[key] = expr;
            }
        );

        return mapping;
    }, {});
}

class Bundle {
    public src: string;
    private depIndex: DepsHash;

    public constructor(deps: DepsInfo[]) {
        // Reorder dependencies topologically
        deps = topoSort(deps);
        this.depIndex = indexById(deps);

        for (let i = 0; i < deps.length; i++) {
            this.preprocess(deps[i]);
        }

        let tokens: Token[] = [];
        for (let i = 0; i < deps.length; i++) {
            if (deps[i].entry) {
                tokens = tokens.concat(this.bundle(deps[i]));
            }
        }

        // Just use bundled source code.
        // Original glslify cleans up and trims the tokens, but we don't need it.
        this.src = string(tokens);
    }

    private preprocess(dep: DepsInfo): void {
        const tokens = tokenize(dep.source);
        const imports = [];
        let exports = null;

        depth(tokens);
        scope(tokens);

        // Note: tokens must be sorted by position
        let lastLine = 1;
        let lastColumn = 1;

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            token.source = dep.file;

            // Save original position.
            // Note: token.line and column is the end position of the token.
            token.original = {
                line: lastLine,
                column: lastColumn
            };
            if (token.type === "whitespace") {
                lastLine = token.line;
                lastColumn = token.column + 1;
            } else {
                lastColumn += token.data.length;
            }

            // console.log(token.original, token.data.length, token.type);
            if (token.type !== "preprocessor") continue;
            if (!glslifyPreprocessor(token.data)) continue;

            const exported = glslifyExport(token.data);
            const imported = glslifyRequire(token.data);

            if (exported) {
                exports = exported[1];
                tokens.splice(i--, 1); // Delete this token
            } else if (imported) {
                const name = imported[1];
                const maps = imported[2].split(/\s?,\s?/g);
                const map0 = maps.shift() as string;
                const path = map0
                    .trim()
                    .replace(/^'|'$/g, "")
                    .replace(/^"|"$/g, "");
                const target = this.depIndex[dep.deps[path]];
                imports.push({
                    name: name,
                    path: path,
                    target: target,
                    maps: toMapping(maps),
                    index: i
                });
                tokens.splice(i--, 1); // Delete this token
            }
        }

        const eof = tokens[tokens.length - 1];
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
    private bundle(entry: DepsInfo): Token[] {
        const resolved: { [name: string]: boolean } = {};

        function resolve(
            dep: DepsInfo,
            bindings: string[][]
        ): [string, Token[]] {
            // Compute suffix for module
            bindings.sort();
            const ident = bindings.join(":") + ":" + dep.id;
            let suffix = "_" + hash(ident);

            if (dep.entry) {
                suffix = "";
            }

            const parsed = dep.parsed;
            if (!parsed) {
                throw "Dep is not preprocessed";
            }

            // Test if export is already resolved
            const exportName = parsed.exports + suffix;
            if (resolved[exportName]) {
                return [exportName, []];
            }

            // Initialize map for variable renamings based on bindings
            const rename: { [from: string]: string } = {};
            for (let i = 0; i < bindings.length; ++i) {
                const binding = bindings[i];
                rename[binding[0]] = binding[1];
            }

            // Resolve all dependencies
            const imports = parsed.imports;
            const edits: [number, Token[]][] = [];
            for (let i = 0; i < imports.length; ++i) {
                const data = imports[i];

                const importMaps = data.maps;
                const importName = data.name;
                const importTarget = data.target;

                const importBindings = Object.keys(importMaps).map(
                    (id): Binding => {
                        const value = importMaps[id];

                        // floats/ints should not be renamed
                        if (value.match(/^\d+(?:\.\d+?)?$/g)) {
                            return [id, value];
                        }

                        // properties (uVec.x, ray.origin, ray.origin.xy etc.) should
                        // have their host identifiers renamed
                        const parent = value.match(/^([^.]+)\.(.+)$/);
                        if (parent) {
                            return [
                                id,
                                (rename[parent[1]] || parent[1] + suffix) +
                                    "." +
                                    parent[2]
                            ];
                        }

                        return [id, rename[value] || value + suffix];
                    }
                );

                const importTokens = resolve(importTarget, importBindings);
                rename[importName] = importTokens[0];
                edits.push([data.index, importTokens[1]]);
            }

            // Rename tokens
            const parsedTokens = parsed.tokens.map(copy);
            const parsedDefs = defines(parsedTokens);
            let tokens = descope(
                parsedTokens,
                (local: number): string => {
                    if (parsedDefs[local]) return local + "";
                    if (rename[local]) return rename[local] + "";

                    return local + suffix;
                }
            );

            // Insert edits
            edits.sort(
                (a, b): number => {
                    return b[0] - a[0];
                }
            );

            for (let i = 0; i < edits.length; ++i) {
                const edit = edits[i];
                tokens = tokens
                    .slice(0, edit[0])
                    .concat(edit[1])
                    .concat(tokens.slice(edit[0]));
            }

            resolved[exportName] = true;
            return [exportName, tokens];
        }

        const result = resolve(entry, [])[1];
        return result;
    }
}

export default function(deps: DepsInfo[]): string {
    // return inject(new Bundle(deps).src, {
    //     GLSLIFY: 1
    // });
    return new Bundle(deps).src;
}

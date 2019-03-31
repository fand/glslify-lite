/// <reference path="./core.d.ts"/>

declare module "glsl-token-whitespace-trim" {
    function trim(tokens: Token[]): Token[];
    export = trim;
}

declare module "glsl-tokenizer/string" {
    function tokenize(arg: string): Token[];
    export = tokenize;
}

declare module "glsl-inject-defines" {
    type Defs = {
        [key: string]: number | string;
    };
    function inject(src: string, defs: Defs): string;
    export = inject;
}

declare module "glsl-token-defines" {
    function defines(tokens: Token[]): Token[];
    export = defines;
}

declare module "glsl-token-descope" {
    function descope(tokens: Token[], callback: any): Token[];
    export = descope;
}

declare module "glsl-token-scope" {
    function scope(tokens: Token[]): Token[];
    export = scope;
}

declare module "glsl-token-string" {
    function string(tokens: Token[]): string;
    export = string;
}

declare module "glsl-token-depth" {
    function depth(tokens: Token[]): Token[];
    export = depth;
}

declare module "shallow-copy" {
    function copy<T>(object: T): T;
    export = copy;
}

declare module "glslify-deps/sync" {
    function deps(opts: { cwd: string }): Depper;
    export = deps;
}

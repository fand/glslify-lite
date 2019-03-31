export type DepsInfo = {
    id: number;
    deps: { [name: string]: number };
    file: string;
    source: string;
    entry: boolean;

    // Property added by Bundle.preprocess
    parsed?: {
        tokens: Token[];
        imports: DepImport[];
        exports: string;
    };
};

export type DepImport = {
    name: string;
    path: string;
    target: any;
    maps: any;
    index: number;
};

export type DepsHash = {
    [id: number]: DepsInfo;
};

export type Depper = {
    add(absPath: string): DepsInfo[];
    inline(src: string, basedir: string): DepsInfo[];
};

export type PostTransform = {
    name: string;
    opts: any;
};

export type Token = {
    type: "ident" | "whitespace" | "eof" | "preprocessor";
    data: string;
};

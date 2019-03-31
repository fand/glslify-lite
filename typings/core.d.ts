type DepsInfo = {
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

type DepImport = {
    name: string;
    path: string;
    target: any;
    maps: any;
    index: number;
};

type DepsHash = {
    [id: number]: DepsInfo;
};

type Depper = {
    add(absPath: string): DepsInfo[];
    inline(src: string, basedir: string): DepsInfo[];
    transform(name: string, opts: any): void;
};

type PostTransform = {
    name: string;
    opts: any;
};

type Token = {
    type: "ident" | "whitespace" | "eof" | "preprocessor";
    data: string;
};


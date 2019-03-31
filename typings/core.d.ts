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

type DepperOptions = {
    cwd?: string;
    readFile?: Function;
    resolve?: Function;
    files?: any;
};
type DepperCallback = (err: Error, result: DepsInfo[]) => void;
type DepperTransformOptions = any;

type Depper = {
    add(filename: string, callback: DepperCallback): void;
    inline(source: string, basedir: string, callback: DepperCallback): void;
    transform(transform: string, options: DepperTransformOptions): void;
    on(event: 'file', callback: (filename: string) => void): void;
};

type PostTransform = {
    name: string;
    opts: any;
};

type Token = {
    type: "ident" | "whitespace" | "eof" | "preprocessor";
    data: string;
};


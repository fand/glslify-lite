# glslify-lite

[![](https://img.shields.io/travis/fand/glslify-lite.svg)](https://travis-ci.org/fand/glslify-lite) [![](https://img.shields.io/codecov/c/github/fand/glslify-lite.svg)](https://codecov.io/gh/fand/glslify-lite) ![](https://img.shields.io/npm/l/glslify-lite.svg)

A fast, lightweight fork of [glslify](https://github.com/glslify/glslify).
Intended to provide more useful APIs for linters, live coding apps, etc.

## Why?

glslify is great, but has some problems especially in realtime usage such as linters, live coding, etc.

-   Synchronous, blocking API by design
-   No support for sourcemaps

glslify-lite overcomes these problems.
However, we don't provide completely same features as glslify.

|                         | glslify | glslify-lite  |
| ----------------------- | :-----: | :-----------: |
| API                     |  Sync   |     Async     |
| Sourcemaps              |    -    |      ✅       |
| Output code is clean    |   ✅    |       -       |
| Transformer support     |   ✅    | Only built-in |
| Tagged template literal |   ✅    |       -       |
| Browserify              |   ✅    |       -       |

## Install

```
npm i glslify-lite
```

## Usage

### CLI

The CLI can take a file as its first argument, and output to a file using the -o flag:

```
glslify-lite index.glsl -o output.glsl
```

It can also read input from stdin and output to stdout:

```
cat index.glsl | glslify-lite > output.glsl
```

### API

#### glslify.compile(src, opts): Promise<string>

Compile a shader string from a string `src`.

Optionally provide:

-   `opts.basedir` - directory to resolve relative paths in `src`

#### glslify.file(filename, opts): Promise<string>

Compile a shader from a `filename`.

Optionally provide:

-   `opts.basedir` - directory to resolve relative paths in `src`

## LICENSE

MIT

/**
 * Permutes the dependencies into topological order.
 */
export default function topoSort(deps: DepsInfo[]): DepsInfo[] {
    // Build reversed adjacency list
    var adj: { [id: number]: number[] } = {};
    var inDegree: { [id: number]: number } = {};
    var index: { [id: number]: DepsInfo } = {};
    deps.forEach(function(dep) {
        var v = dep.id;
        var nbhd = Object.keys(dep.deps);
        index[dep.id] = dep;
        inDegree[v] = nbhd.length;
        nbhd.forEach(function(filename) {
            var u = dep.deps[filename];
            if (adj[u]) {
                adj[u].push(v);
            } else {
                adj[u] = [v];
            }
        });
    });

    // Initialize toVisit queue
    var result: number[] = [];
    var inverse: { [id: number]: number } = {};
    deps.forEach(function(dep) {
        var v = dep.id;
        if (!adj[v]) {
            adj[v] = [];
        }
        if (inDegree[v] === 0) {
            inverse[v] = result.length;
            result.push(v);
        }
    });

    // Run BFS
    for (var ptr = 0; ptr < result.length; ptr++) {
        var v = result[ptr];
        adj[v].forEach(function(u) {
            if (--inDegree[u] === 0) {
                inverse[u] = result.length;
                result.push(u);
            }
        });
    }

    if (result.length !== deps.length) {
        throw new Error("cyclic dependency");
    }

    // Relabel dependencies
    return result.map(function(v) {
        var dep = index[v];
        var deps = dep.deps;
        var ndeps: { [filename: string]: number } = {};
        Object.keys(deps).forEach(function(filename) {
            ndeps[filename] = inverse[deps[filename]] | 0;
        });
        return {
            id: inverse[v] | 0,
            deps: ndeps,
            file: dep.file,
            source: dep.source,
            entry: dep.entry
        };
    });
}

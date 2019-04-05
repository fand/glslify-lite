/**
 * Permutes the dependencies into topological order.
 */
export default function topoSort(deps: DepsInfo[]): DepsInfo[] {
    // Build reversed adjacency list
    const adj: { [id: number]: number[] } = {};
    const inDegree: { [id: number]: number } = {};
    const index: { [id: number]: DepsInfo } = {};
    deps.forEach(
        (dep): void => {
            const v = dep.id;
            const nbhd = Object.keys(dep.deps);
            index[dep.id] = dep;
            inDegree[v] = nbhd.length;
            nbhd.forEach(
                (filename): void => {
                    const u = dep.deps[filename];
                    if (adj[u]) {
                        adj[u].push(v);
                    } else {
                        adj[u] = [v];
                    }
                }
            );
        }
    );

    // Initialize toVisit queue
    const result: number[] = [];
    const inverse: { [id: number]: number } = {};
    deps.forEach(
        (dep): void => {
            const v = dep.id;
            if (!adj[v]) {
                adj[v] = [];
            }
            if (inDegree[v] === 0) {
                inverse[v] = result.length;
                result.push(v);
            }
        }
    );

    // Run BFS
    for (let ptr = 0; ptr < result.length; ptr++) {
        const v = result[ptr];
        adj[v].forEach(
            (u): void => {
                if (--inDegree[u] === 0) {
                    inverse[u] = result.length;
                    result.push(u);
                }
            }
        );
    }

    if (result.length !== deps.length) {
        throw new Error("cyclic dependency");
    }

    // Relabel dependencies
    return result.map(
        (v): DepsInfo => {
            const dep = index[v];
            const deps = dep.deps;
            const ndeps: { [filename: string]: number } = {};
            Object.keys(deps).forEach(
                (filename): void => {
                    ndeps[filename] = inverse[deps[filename]] | 0;
                }
            );
            return {
                id: inverse[v] | 0,
                deps: ndeps,
                file: dep.file,
                source: dep.source,
                entry: dep.entry
            };
        }
    );
}

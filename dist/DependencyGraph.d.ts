/**
 * A graph of files and their dependencies.
 * Each file will only contain nodes that they directly reference (i.e. script imports, inheritance, etc)
 */
export declare class DependencyGraph {
    /**
     * A dictionary of all unique nodes in the entire graph
     */
    nodes: Record<string, Node>;
    /**
     * An internal event emitter for when keys have changed.
     */
    private onchangeEmitter;
    /**
     * Add a node to the graph.
     */
    addOrReplace(key: string, dependencies?: string[]): void;
    /**
     * Add a new dependency to an existing node (or create a new node if the node doesn't exist
     */
    addDependency(key: string, dependencyKey: string): void;
    /**
     * Remove a dependency from an existing node.
     * Do nothing if the node does not have that dependency.
     * Do nothing if that node does not exist
     */
    removeDependency(key: string, dependencyKey: string): void;
    /**
     * Get a list of the dependencies for the given key, recursively.
     * @param keys the key (or keys) for which to get the dependencies
     * @param exclude a list of keys to exclude from traversal. Anytime one of these nodes is encountered, it is skipped.
     */
    getAllDependencies(keys: string | string[], exclude?: string[]): string[];
    /**
     * Remove the item. This will emit an onchange event for all dependent nodes
     */
    remove(key: string): void;
    /**
     * Emit event that this item has changed
     */
    emit(key: string, event: DependencyChangedEvent): void;
    /**
     * Listen for any changes to dependencies with the given key.
     * @param key the name of the dependency
     * @param handler a function called anytime changes occur
     */
    onchange(key: string, handler: (event: DependencyChangedEvent) => void): () => void;
    dispose(): void;
}
export interface DependencyChangedEvent {
    /**
     * The key that was the initiator of this event. Child keys will emit this same event object, but this key will remain the same
     */
    sourceKey: string;
    /**
     * A set of keys that have already been notified of this change. Used to prevent circular reference notification cycles
     */
    notifiedKeys: Set<string>;
}
export declare class Node {
    key: string;
    dependencies: string[];
    graph: DependencyGraph;
    constructor(key: string, dependencies: string[], graph: DependencyGraph);
    private subscriptions;
    /**
     * Return the full list of unique dependencies for this node by traversing all descendents
     * @param exclude a list of keys to exclude from traversal. Anytime one of these nodes is encountered, it is skipped.
     */
    getAllDependencies(exclude?: string[]): string[];
    dispose(): void;
}

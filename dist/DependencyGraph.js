"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Node = exports.DependencyGraph = void 0;
const eventemitter3_1 = require("eventemitter3");
/**
 * A graph of files and their dependencies.
 * Each file will only contain nodes that they directly reference (i.e. script imports, inheritance, etc)
 */
class DependencyGraph {
    constructor() {
        /**
         * A dictionary of all unique nodes in the entire graph
         */
        this.nodes = {};
        /**
         * An internal event emitter for when keys have changed.
         */
        this.onchangeEmitter = new eventemitter3_1.EventEmitter();
    }
    /**
     * Add a node to the graph.
     */
    addOrReplace(key, dependencies) {
        var _a, _b;
        //sort the dependencies
        dependencies = (_a = dependencies === null || dependencies === void 0 ? void 0 : dependencies.sort()) !== null && _a !== void 0 ? _a : [];
        //dispose any existing node
        (_b = this.nodes[key]) === null || _b === void 0 ? void 0 : _b.dispose();
        //create a new dependency node
        let node = new Node(key, dependencies, this);
        this.nodes[key] = node;
        this.emit(key, { sourceKey: key, notifiedKeys: new Set() });
    }
    /**
     * Add a new dependency to an existing node (or create a new node if the node doesn't exist
     */
    addDependency(key, dependencyKey) {
        let existingNode = this.nodes[key];
        if (existingNode) {
            let dependencies = existingNode.dependencies.includes(dependencyKey) ? existingNode.dependencies : [dependencyKey, ...existingNode.dependencies];
            this.addOrReplace(key, dependencies);
        }
        else {
            this.addOrReplace(key, [dependencyKey]);
        }
    }
    /**
     * Remove a dependency from an existing node.
     * Do nothing if the node does not have that dependency.
     * Do nothing if that node does not exist
     */
    removeDependency(key, dependencyKey) {
        var _a;
        let existingNode = this.nodes[key];
        let idx = ((_a = existingNode === null || existingNode === void 0 ? void 0 : existingNode.dependencies) !== null && _a !== void 0 ? _a : []).indexOf(dependencyKey);
        if (existingNode && idx > -1) {
            existingNode.dependencies.splice(idx, 1);
            this.addOrReplace(key, existingNode.dependencies);
        }
    }
    /**
     * Get a list of the dependencies for the given key, recursively.
     * @param keys the key (or keys) for which to get the dependencies
     * @param exclude a list of keys to exclude from traversal. Anytime one of these nodes is encountered, it is skipped.
     */
    getAllDependencies(keys, exclude) {
        var _a, _b;
        if (typeof keys === 'string') {
            return (_b = (_a = this.nodes[keys]) === null || _a === void 0 ? void 0 : _a.getAllDependencies(exclude)) !== null && _b !== void 0 ? _b : [];
        }
        else {
            const set = new Set();
            for (const key of keys) {
                const dependencies = this.getAllDependencies(key, exclude);
                for (const dependency of dependencies) {
                    set.add(dependency);
                }
            }
            return [...set];
        }
    }
    /**
     * Remove the item. This will emit an onchange event for all dependent nodes
     */
    remove(key) {
        var _a;
        (_a = this.nodes[key]) === null || _a === void 0 ? void 0 : _a.dispose();
        delete this.nodes[key];
        this.emit(key, { sourceKey: key, notifiedKeys: new Set() });
    }
    /**
     * Emit event that this item has changed
     */
    emit(key, event) {
        //prevent infinite event loops by skipping already-notified keys
        if (!event.notifiedKeys.has(key)) {
            event.notifiedKeys.add(key);
            this.onchangeEmitter.emit(key, event);
        }
    }
    /**
     * Listen for any changes to dependencies with the given key.
     * @param key the name of the dependency
     * @param handler a function called anytime changes occur
     */
    onchange(key, handler) {
        this.onchangeEmitter.on(key, handler);
        return () => {
            this.onchangeEmitter.off(key, handler);
        };
    }
    dispose() {
        for (let key in this.nodes) {
            let node = this.nodes[key];
            node.dispose();
        }
        this.onchangeEmitter.removeAllListeners();
    }
}
exports.DependencyGraph = DependencyGraph;
class Node {
    constructor(key, dependencies, graph) {
        this.key = key;
        this.dependencies = dependencies;
        this.graph = graph;
        if (dependencies.length > 0) {
            this.subscriptions = [];
            for (let dependency of this.dependencies) {
                let sub = this.graph.onchange(dependency, (event) => {
                    //notify the graph that we changed since one of our dependencies changed
                    this.graph.emit(this.key, event);
                });
                this.subscriptions.push(sub);
            }
        }
    }
    /**
     * Return the full list of unique dependencies for this node by traversing all descendents
     * @param exclude a list of keys to exclude from traversal. Anytime one of these nodes is encountered, it is skipped.
     */
    getAllDependencies(exclude = []) {
        let dependencyMap = {};
        let dependencyStack = [...this.dependencies];
        //keep walking the dependency graph until we run out of unseen dependencies
        while (dependencyStack.length > 0) {
            let dependency = dependencyStack.pop();
            //if this is a new dependency and we aren't supposed to skip it
            if (dependency && !dependencyMap[dependency] && !exclude.includes(dependency)) {
                dependencyMap[dependency] = true;
                //get the node for this dependency
                let node = this.graph.nodes[dependency];
                if (node) {
                    dependencyStack.push(...node.dependencies);
                }
            }
        }
        return Object.keys(dependencyMap);
    }
    dispose() {
        var _a;
        for (let unsubscribe of (_a = this.subscriptions) !== null && _a !== void 0 ? _a : []) {
            unsubscribe();
        }
    }
}
exports.Node = Node;
//# sourceMappingURL=DependencyGraph.js.map
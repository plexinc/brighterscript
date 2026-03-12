"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Expression = exports.Statement = exports.AstNode = void 0;
const visitors_1 = require("../astUtils/visitors");
const vscode_languageserver_1 = require("vscode-languageserver");
const visitors_2 = require("../astUtils/visitors");
const util_1 = require("../util");
/**
 * A BrightScript AST node
 */
class AstNode {
    constructor() {
        /**
         * When being considered by the walk visitor, this describes what type of element the current class is.
         */
        this.visitMode = visitors_2.InternalWalkMode.visitStatements;
    }
    /**
     * Get the typedef for this node. (defaults to transpiling the node, should be overridden by subclasses if there's a more specific typedef requirement)
     */
    getTypedef(state) {
        return this.transpile(state);
    }
    /**
     * Get the closest symbol table for this node
     */
    getSymbolTable() {
        let node = this;
        while (node) {
            if (node.symbolTable) {
                return node.symbolTable;
            }
            node = node.parent;
        }
        //justification: we are following a chain of nodes until we get to one with a SymbolTable,
        //and the top-level node will always have a SymbolTable. So we'll never hit this undefined,
        //but it is not so easy to convince the typechecker of this.
        return undefined;
    }
    /**
     * Walk upward and return the first node that results in `true` from the matcher.
     * @param matcher a function called for each node. If you return true, this function returns the specified node. If you return a node, that node is returned. all other return values continue the loop
     *                The function's second parameter is a cancellation token. If you'd like to short-circuit the walk, call `cancellationToken.cancel()`, then this function will return `undefined`
     */
    findAncestor(matcher) {
        let node = this.parent;
        const cancel = new vscode_languageserver_1.CancellationTokenSource();
        while (node) {
            let matcherValue = matcher(node, cancel);
            if (cancel.token.isCancellationRequested) {
                return;
            }
            if (matcherValue) {
                cancel.cancel();
                return (matcherValue === true ? node : matcherValue);
            }
            node = node.parent;
        }
    }
    /**
     * Find the first child where the matcher evaluates to true.
     * @param matcher a function called for each node. If you return true, this function returns the specified node. If you return a node, that node is returned. all other return values continue the loop
     */
    findChild(matcher, options) {
        const cancel = new vscode_languageserver_1.CancellationTokenSource();
        let result;
        this.walk((node) => {
            const matcherValue = matcher(node, cancel);
            if (matcherValue) {
                cancel.cancel();
                result = matcherValue === true ? node : matcherValue;
            }
        }, Object.assign(Object.assign({ walkMode: visitors_1.WalkMode.visitAllRecursive }, options !== null && options !== void 0 ? options : {}), { cancel: cancel.token }));
        return result;
    }
    /**
     * FInd the deepest child that includes the given position
     */
    findChildAtPosition(position, options) {
        return this.findChild((node) => {
            var _a;
            //if the current node includes this range, keep that node
            if (util_1.default.rangeContains(node.range, position)) {
                return (_a = node.findChildAtPosition(position, options)) !== null && _a !== void 0 ? _a : node;
            }
        }, options);
    }
    /**
     * Links all child nodes to their parent AstNode, and the same with symbol tables. This performs a full AST walk, so you should use this sparingly
     */
    link() {
        //the act of walking causes the nodes to be linked
        this.walk(() => { }, {
            walkMode: visitors_1.WalkMode.visitAllRecursive
        });
    }
    /**
     * Helper function for creating a clone. This will clone any attached annotations, as well as reparent the cloned node's children to the clone
     */
    finalizeClone(clone, propsToReparent) {
        var _a;
        //clone the annotations if they exist
        if (Array.isArray(this.annotations)) {
            clone.annotations = (_a = this.annotations) === null || _a === void 0 ? void 0 : _a.map(x => x.clone());
        }
        //reparent all of the supplied props
        for (let key of propsToReparent !== null && propsToReparent !== void 0 ? propsToReparent : []) {
            const children = (Array.isArray(clone === null || clone === void 0 ? void 0 : clone[key]) ? clone[key] : [clone === null || clone === void 0 ? void 0 : clone[key]]);
            for (let child of children !== null && children !== void 0 ? children : []) {
                if (child) {
                    clone[key].parent = clone;
                }
            }
        }
        return clone;
    }
}
exports.AstNode = AstNode;
class Statement extends AstNode {
    constructor() {
        super(...arguments);
        /**
         * When being considered by the walk visitor, this describes what type of element the current class is.
         */
        this.visitMode = visitors_2.InternalWalkMode.visitStatements;
    }
}
exports.Statement = Statement;
/** A BrightScript expression */
class Expression extends AstNode {
    constructor() {
        super(...arguments);
        /**
         * When being considered by the walk visitor, this describes what type of element the current class is.
         */
        this.visitMode = visitors_2.InternalWalkMode.visitExpressions;
    }
}
exports.Expression = Expression;
//# sourceMappingURL=AstNode.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SymbolTable = void 0;
/**
 * Stores the types associated with variables and functions in the Brighterscript code
 * Can be part of a hierarchy, so lookups can reference parent scopes
 */
class SymbolTable {
    constructor(name, parentProvider) {
        this.name = name;
        /**
         * The map of symbols declared directly in this SymbolTable (excludes parent SymbolTable).
         * Indexed by lower symbol name
         */
        this.symbolMap = new Map();
        this.parentProviders = [];
        this.siblings = new Set();
        if (parentProvider) {
            this.pushParentProvider(parentProvider);
        }
    }
    /**
     * Push a function that will provide a parent SymbolTable when requested
     */
    pushParentProvider(provider) {
        this.parentProviders.push(provider);
    }
    /**
     * Pop the current parentProvider
     */
    popParentProvider() {
        this.parentProviders.pop();
    }
    /**
     * The parent SymbolTable (if there is one)
     */
    get parent() {
        var _a, _b;
        return (_b = (_a = this.parentProviders)[this.parentProviders.length - 1]) === null || _b === void 0 ? void 0 : _b.call(_a);
    }
    /**
     * Add a sibling symbol table (which will be inspected first before walking upward to the parent
     */
    addSibling(sibling) {
        this.siblings.add(sibling);
    }
    /**
     * Remove a sibling symbol table
     */
    removeSibling(sibling) {
        this.siblings.delete(sibling);
    }
    /**
     * Checks if the symbol table contains the given symbol by name
     * If the identifier is not in this table, it will check the parent
     *
     * @param name the name to lookup
     * @param searchParent should we look to our parent if we don't have the symbol?
     * @returns true if this symbol is in the symbol table
     */
    hasSymbol(name, searchParent = true) {
        return !!this.getSymbol(name, searchParent);
    }
    /**
     * Gets the name/type pair for a given named variable or function name
     * If the identifier is not in this table, it will check the parent
     *
     * @param  name the name to lookup
     * @param searchParent should we look to our parent if we don't have the symbol?
     * @returns An array of BscSymbols - one for each time this symbol had a type implicitly defined
     */
    getSymbol(name, searchParent = true) {
        var _a;
        const key = name.toLowerCase();
        let result;
        // look in our map first
        if ((result = this.symbolMap.get(key))) {
            return result;
        }
        //look through any sibling maps next
        for (let sibling of this.siblings) {
            if ((result = sibling.symbolMap.get(key))) {
                return result;
            }
        }
        // ask our parent for a symbol
        if (searchParent && (result = (_a = this.parent) === null || _a === void 0 ? void 0 : _a.getSymbol(key))) {
            return result;
        }
    }
    /**
     * Adds a new symbol to the table
     */
    addSymbol(name, range, type) {
        var _a;
        const key = name.toLowerCase();
        if (!this.symbolMap.has(key)) {
            this.symbolMap.set(key, []);
        }
        (_a = this.symbolMap.get(key)) === null || _a === void 0 ? void 0 : _a.push({
            name: name,
            range: range,
            type: type
        });
    }
    /**
     * Adds all the symbols from another table to this one
     * It will overwrite any existing symbols in this table
     */
    mergeSymbolTable(symbolTable) {
        for (let [, value] of symbolTable.symbolMap) {
            for (const symbol of value) {
                this.addSymbol(symbol.name, symbol.range, symbol.type);
            }
        }
    }
    /**
     * Serialize this SymbolTable to JSON (useful for debugging reasons)
     */
    toJSON() {
        var _a;
        return {
            name: this.name,
            parent: (_a = this.parent) === null || _a === void 0 ? void 0 : _a.toJSON(),
            symbols: [
                ...new Set([...this.symbolMap.entries()].map(([key, symbols]) => {
                    return symbols.map(x => x.name);
                }).flat().sort())
            ]
        };
    }
}
exports.SymbolTable = SymbolTable;
//# sourceMappingURL=SymbolTable.js.map
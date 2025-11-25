import type { Range } from 'vscode-languageserver';
import type { BscType } from './types/BscType';
/**
 * Stores the types associated with variables and functions in the Brighterscript code
 * Can be part of a hierarchy, so lookups can reference parent scopes
 */
export declare class SymbolTable {
    name: string;
    constructor(name: string, parentProvider?: SymbolTableProvider);
    /**
     * The map of symbols declared directly in this SymbolTable (excludes parent SymbolTable).
     * Indexed by lower symbol name
     */
    private symbolMap;
    private parentProviders;
    /**
     * Push a function that will provide a parent SymbolTable when requested
     */
    pushParentProvider(provider: SymbolTableProvider): void;
    /**
     * Pop the current parentProvider
     */
    popParentProvider(): void;
    /**
     * The parent SymbolTable (if there is one)
     */
    get parent(): SymbolTable | undefined;
    private siblings;
    /**
     * Add a sibling symbol table (which will be inspected first before walking upward to the parent
     */
    addSibling(sibling: SymbolTable): void;
    /**
     * Remove a sibling symbol table
     */
    removeSibling(sibling: SymbolTable): void;
    /**
     * Checks if the symbol table contains the given symbol by name
     * If the identifier is not in this table, it will check the parent
     *
     * @param name the name to lookup
     * @param searchParent should we look to our parent if we don't have the symbol?
     * @returns true if this symbol is in the symbol table
     */
    hasSymbol(name: string, searchParent?: boolean): boolean;
    /**
     * Gets the name/type pair for a given named variable or function name
     * If the identifier is not in this table, it will check the parent
     *
     * @param  name the name to lookup
     * @param searchParent should we look to our parent if we don't have the symbol?
     * @returns An array of BscSymbols - one for each time this symbol had a type implicitly defined
     */
    getSymbol(name: string, searchParent?: boolean): BscSymbol[] | undefined;
    /**
     * Adds a new symbol to the table
     */
    addSymbol(name: string, range: Range, type: BscType): void;
    /**
     * Adds all the symbols from another table to this one
     * It will overwrite any existing symbols in this table
     */
    mergeSymbolTable(symbolTable: SymbolTable): void;
    /**
     * Serialize this SymbolTable to JSON (useful for debugging reasons)
     */
    private toJSON;
}
export interface BscSymbol {
    name: string;
    range: Range;
    type: BscType;
}
/**
 * A function that returns a symbol table.
 */
export declare type SymbolTableProvider = () => SymbolTable | undefined;

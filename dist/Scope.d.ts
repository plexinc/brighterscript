import type { CompletionItem, Position, Range, Location } from 'vscode-languageserver';
import type { CallableContainer, BsDiagnostic, BscFile, CallableContainerMap, FileLink, Callable } from './interfaces';
import type { Program } from './Program';
import type { NamespaceStatement, FunctionStatement, ClassStatement, EnumStatement, InterfaceStatement, EnumMemberStatement, ConstStatement } from './parser/Statement';
import type { NewExpression } from './parser/Expression';
import { ParseMode } from './parser/Parser';
import { Cache } from './Cache';
import type { BrsFile } from './files/BrsFile';
import type { DependencyGraph, DependencyChangedEvent } from './DependencyGraph';
import { SymbolTable } from './SymbolTable';
import type { Statement } from './parser/AstNode';
/**
 * A class to keep track of all declarations within a given scope (like source scope, component scope)
 */
export declare class Scope {
    name: string;
    program: Program;
    private _dependencyGraphKey?;
    constructor(name: string, program: Program, _dependencyGraphKey?: string);
    /**
     * Indicates whether this scope needs to be validated.
     * Will be true when first constructed, or anytime one of its dependencies changes
     */
    readonly isValidated: boolean;
    protected cache: Cache<any, any>;
    get dependencyGraphKey(): string;
    /**
     * A dictionary of namespaces, indexed by the lower case full name of each namespace.
     * If a namespace is declared as "NameA.NameB.NameC", there will be 3 entries in this dictionary,
     * "namea", "namea.nameb", "namea.nameb.namec"
     */
    get namespaceLookup(): Map<string, NamespaceContainer>;
    /**
     * Get a NamespaceContainer by its name, looking for a fully qualified version first, then global version next if not found
     */
    getNamespace(name: string, containingNamespace?: string): NamespaceContainer;
    /**
     * Get the class with the specified name.
     * @param className - The class name, including the namespace of the class if possible
     * @param containingNamespace - The namespace used to resolve relative class names. (i.e. the namespace around the current statement trying to find a class)
     */
    getClass(className: string, containingNamespace?: string): ClassStatement;
    /**
     * Get the interface with the specified name.
     * @param ifaceName - The interface name, including the namespace of the interface if possible
     * @param containingNamespace - The namespace used to resolve relative interface names. (i.e. the namespace around the current statement trying to find a interface)
     */
    getInterface(ifaceName: string, containingNamespace?: string): InterfaceStatement;
    /**
     * Get the enum with the specified name.
     * @param enumName - The enum name, including the namespace if possible
     * @param containingNamespace - The namespace used to resolve relative enum names. (i.e. the namespace around the current statement trying to find an enum)
     */
    getEnum(enumName: string, containingNamespace?: string): EnumStatement;
    /**
     * Get a class and its containing file by the class name
     * @param className - The class name, including the namespace of the class if possible
     * @param containingNamespace - The namespace used to resolve relative class names. (i.e. the namespace around the current statement trying to find a class)
     */
    getClassFileLink(className: string, containingNamespace?: string): FileLink<ClassStatement>;
    /**
     * Get an interface and its containing file by the interface name
     * @param ifaceName - The interface name, including the namespace of the interface if possible
     * @param containingNamespace - The namespace used to resolve relative interface names. (i.e. the namespace around the current statement trying to find a interface)
     */
    getInterfaceFileLink(ifaceName: string, containingNamespace?: string): FileLink<InterfaceStatement>;
    /**
     * Get an Enum and its containing file by the Enum name
     * @param enumName - The Enum name, including the namespace of the enum if possible
     * @param containingNamespace - The namespace used to resolve relative enum names. (i.e. the namespace around the current statement trying to find a enum)
     */
    getEnumFileLink(enumName: string, containingNamespace?: string): FileLink<EnumStatement>;
    /**
     * Get an Enum and its containing file by the Enum name
     * @param enumMemberName - The Enum name, including the namespace of the enum if possible
     * @param containingNamespace - The namespace used to resolve relative enum names. (i.e. the namespace around the current statement trying to find a enum)
     */
    getEnumMemberFileLink(enumMemberName: string, containingNamespace?: string): FileLink<EnumMemberStatement>;
    /**
     * Get a constant and its containing file by the constant name
     * @param constName - The constant name, including the namespace of the constant if possible
     * @param containingNamespace - The namespace used to resolve relative constant names. (i.e. the namespace around the current statement trying to find a constant)
     */
    getConstFileLink(constName: string, containingNamespace?: string): FileLink<ConstStatement>;
    /**
     * Get a map of all enums by their member name.
     * The keys are lower-case fully-qualified paths to the enum and its member. For example:
     * namespace.enum.value
     */
    getEnumMemberMap(): Map<string, EnumMemberStatement>;
    /**
     * Tests if a class exists with the specified name
     * @param className - the all-lower-case namespace-included class name
     * @param namespaceName - The namespace used to resolve relative class names. (i.e. the namespace around the current statement trying to find a class)
     */
    hasClass(className: string, namespaceName?: string): boolean;
    /**
     * Tests if an interface exists with the specified name
     * @param ifaceName - the all-lower-case namespace-included interface name
     * @param namespaceName - the current namespace name
     */
    hasInterface(ifaceName: string, namespaceName?: string): boolean;
    /**
     * Tests if an enum exists with the specified name
     * @param enumName - the all-lower-case namespace-included enum name
     * @param namespaceName - the current namespace name
     */
    hasEnum(enumName: string, namespaceName?: string): boolean;
    /**
     * A dictionary of all classes in this scope. This includes namespaced classes always with their full name.
     * The key is stored in lower case
     */
    getClassMap(): Map<string, FileLink<ClassStatement>>;
    /**
     * A dictionary of all Interfaces in this scope. This includes namespaced Interfaces always with their full name.
     * The key is stored in lower case
     */
    getInterfaceMap(): Map<string, FileLink<InterfaceStatement>>;
    /**
     * A dictionary of all enums in this scope. This includes namespaced enums always with their full name.
     * The key is stored in lower case
     */
    getEnumMap(): Map<string, FileLink<EnumStatement>>;
    /**
     * A dictionary of all constants in this scope. This includes namespaced constants always with their full name.
     * The key is stored in lower case
     */
    getConstMap(): Map<string, FileLink<ConstStatement>>;
    /**
     * The list of diagnostics found specifically for this scope. Individual file diagnostics are stored on the files themselves.
     */
    protected diagnostics: BsDiagnostic[];
    protected onDependenciesChanged(event: DependencyChangedEvent): void;
    /**
     * Clean up all event handles
     */
    dispose(): void;
    /**
     * Does this scope know about the given namespace name?
     * @param namespaceName - the name of the namespace (i.e. "NameA", or "NameA.NameB", etc...)
     */
    isKnownNamespace(namespaceName: string): boolean;
    /**
     * Get the parent scope for this scope (for source scope this will always be the globalScope).
     * XmlScope overrides this to return the parent xml scope if available.
     * For globalScope this will return null.
     */
    getParentScope(): Scope | null;
    private dependencyGraph;
    /**
     * An unsubscribe function for the dependencyGraph subscription
     */
    private unsubscribeFromDependencyGraph;
    attachDependencyGraph(dependencyGraph: DependencyGraph): void;
    /**
     * Get the file from this scope with the given path.
     * @param filePath can be a srcPath or pkgPath
     * @param normalizePath should this function repair and standardize the path? Passing false should have a performance boost if you can guarantee your path is already sanitized
     */
    getFile<TFile extends BscFile>(filePath: string, normalizePath?: boolean): TFile;
    /**
     * Get the list of files referenced by this scope that are actually loaded in the program.
     * Excludes files from ancestor scopes
     */
    getOwnFiles(): BscFile[];
    /**
     * Get the list of files referenced by this scope that are actually loaded in the program.
     * Includes files from this scope and all ancestor scopes
     */
    getAllFiles(): BscFile[];
    /**
     * Get the list of errors for this scope. It's calculated on the fly, so
     * call this sparingly.
     */
    getDiagnostics(): BsDiagnostic[];
    addDiagnostics(diagnostics: BsDiagnostic[]): void;
    /**
     * Get the list of callables available in this scope (either declared in this scope or in a parent scope)
     */
    getAllCallables(): CallableContainer[];
    /**
     * Get the callable with the specified name.
     * If there are overridden callables with the same name, the closest callable to this scope is returned
     */
    getCallableByName(name: string): Callable;
    getCallableMap(): Map<string, Callable>;
    /**
     * Iterate over Brs files not shadowed by typedefs
     */
    enumerateBrsFiles(callback: (file: BrsFile) => void): void;
    /**
     * Call a function for each file directly included in this scope (excluding files found only in parent scopes).
     */
    enumerateOwnFiles(callback: (file: BscFile) => void): void;
    /**
     * Get the list of callables explicitly defined in files in this scope.
     * This excludes ancestor callables
     */
    getOwnCallables(): CallableContainer[];
    /**
     * Builds a tree of namespace objects
     */
    buildNamespaceLookup(): Map<string, NamespaceContainer>;
    getAllNamespaceStatements(): NamespaceStatement[];
    protected logDebug(...args: any[]): void;
    private _debugLogComponentName;
    validate(force?: boolean): void;
    protected _validate(callableContainerMap: CallableContainerMap): void;
    /**
     * Mark this scope as invalid, which means its `validate()` function needs to be called again before use.
     */
    invalidate(): void;
    get symbolTable(): SymbolTable;
    /**
     * Builds the current symbol table for the scope, by merging the tables for all the files in this scope.
     * Also links all file symbols tables to this new table
     * This will only rebuilt if the symbol table has not been built before
     */
    linkSymbolTable(): void;
    unlinkSymbolTable(): void;
    private detectVariableNamespaceCollisions;
    /**
     * Find various function collisions
     */
    private diagnosticDetectFunctionCollisions;
    /**
     * Find function parameters and function return types that are neither built-in types or known Class references
     */
    private diagnosticDetectInvalidFunctionExpressionTypes;
    getNewExpressions(): AugmentedNewExpression[];
    private validateClasses;
    /**
     * Detect calls to functions with the incorrect number of parameters
     */
    private diagnosticDetectFunctionCallsWithWrongParamCount;
    /**
     * Detect local variables (function scope) that have the same name as scope calls
     */
    private diagnosticDetectShadowedLocalVars;
    /**
     * Create diagnostics for any duplicate function declarations
     */
    private diagnosticFindDuplicateFunctionDeclarations;
    /**
     * Get the list of all script imports for this scope
     */
    private getOwnScriptImports;
    /**
     * Verify that all of the scripts imported by each file in this scope actually exist
     */
    private diagnosticValidateScriptImportPaths;
    /**
     * Find the file with the specified relative path
     */
    protected getFileByRelativePath(relativePath: string): BscFile;
    /**
     * Determine if this file is included in this scope (excluding parent scopes)
     */
    hasFile(file: BscFile): boolean;
    /**
     * Get all callables as completionItems
     */
    getCallablesAsCompletions(parseMode: ParseMode): CompletionItem[];
    createCompletionFromCallable(callableContainer: CallableContainer): CompletionItem;
    createCompletionFromFunctionStatement(statement: FunctionStatement): CompletionItem;
    /**
     * Get the definition (where was this thing first defined) of the symbol under the position
     * @deprecated use `DefinitionProvider.process()`
     */
    getDefinition(file: BscFile, position: Position): Location[];
    /**
     * Scan all files for property names, and return them as completions
     */
    getPropertyNameCompletions(): CompletionItem[];
    getAllClassMemberCompletions(): Map<string, CompletionItem>;
    /**
     * @param className - The name of the class (including namespace if possible)
     * @param callsiteNamespace - the name of the namespace where the call site resides (this is NOT the known namespace of the class).
     *                            This is used to help resolve non-namespaced class names that reside in the same namespac as the call site.
     */
    getClassHierarchy(className: string, callsiteNamespace?: string): FileLink<ClassStatement>[];
}
export interface NamespaceContainer {
    file: BscFile;
    fullName: string;
    nameRange: Range;
    lastPartName: string;
    statements: Statement[];
    classStatements: Record<string, ClassStatement>;
    functionStatements: Record<string, FunctionStatement>;
    enumStatements: Map<string, EnumStatement>;
    constStatements: Map<string, ConstStatement>;
    namespaces: Map<string, NamespaceContainer>;
    symbolTable: SymbolTable;
}
interface AugmentedNewExpression extends NewExpression {
    file: BscFile;
}
export {};

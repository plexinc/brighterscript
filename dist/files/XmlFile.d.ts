import type { CodeWithSourceMap } from 'source-map';
import type { CompletionItem, Location, Position, Range } from 'vscode-languageserver';
import type { FunctionScope } from '../FunctionScope';
import type { Callable, BsDiagnostic, File, FileReference, FunctionCall, CommentFlag } from '../interfaces';
import type { Program } from '../Program';
import SGParser from '../parser/SGParser';
import type { DependencyGraph } from '../DependencyGraph';
import type { SGToken } from '../parser/SGTypes';
import type { IToken, TokenType } from 'chevrotain';
export declare class XmlFile {
    srcPath: string;
    /**
     * The absolute path to the file, relative to the pkg
     */
    pkgPath: string;
    program: Program;
    constructor(srcPath: string, 
    /**
     * The absolute path to the file, relative to the pkg
     */
    pkgPath: string, program: Program);
    /**
     * The absolute path to the source location for this file
     * @deprecated use `srcPath` instead
     */
    get pathAbsolute(): string;
    set pathAbsolute(value: string);
    private cache;
    /**
     * The list of possible autoImport codebehind pkg paths.
     */
    possibleCodebehindPkgPaths: string[];
    /**
     * An unsubscribe function for the dependencyGraph subscription
     */
    private unsubscribeFromDependencyGraph;
    /**
     * Indicates whether this file needs to be validated.
     * Files are only ever validated a single time
     */
    isValidated: boolean;
    /**
     * The extension for this file
     */
    extension: string;
    commentFlags: CommentFlag[];
    /**
     * Will this file result in only comment or whitespace output? If so, it can be excluded from the output if that bsconfig setting is enabled.
     */
    readonly canBePruned = false;
    /**
     * The list of script imports delcared in the XML of this file.
     * This excludes parent imports and auto codebehind imports
     */
    get scriptTagImports(): FileReference[];
    /**
     * List of all pkgPaths to scripts that this XmlFile depends, regardless of whether they are loaded in the program or not.
     * This includes own dependencies and all parent compoent dependencies
     * coming from:
     *  - script tags
     *  - implied codebehind file
     *  - import statements from imported scripts or their descendents
     */
    getAllDependencies(): string[];
    /**
     * List of all pkgPaths to scripts that this XmlFile depends on directly, regardless of whether they are loaded in the program or not.
     * This does not account for parent component scripts
     * coming from:
     *  - script tags
     *  - implied codebehind file
     *  - import statements from imported scripts or their descendents
     */
    getOwnDependencies(): string[];
    /**
     * List of all pkgPaths to scripts that this XmlFile depends on that are actually loaded into the program.
     * This does not account for parent component scripts.
     * coming from:
     *  - script tags
     *  - inferred codebehind file
     *  - import statements from imported scripts or their descendants
     */
    getAvailableScriptImports(): string[];
    getDiagnostics(): BsDiagnostic[];
    addDiagnostics(diagnostics: BsDiagnostic[]): void;
    /**
     * The range of the entire file
     */
    fileRange: Range;
    /**
     * A collection of diagnostics related to this file
     */
    diagnostics: BsDiagnostic[];
    parser: SGParser;
    callables: Callable[];
    functionCalls: FunctionCall[];
    functionScopes: FunctionScope[];
    /**
     * The name of the component that this component extends.
     * Available after `parse()`
     */
    get parentComponentName(): SGToken;
    /**
     * The name of the component declared in this xml file
     * Available after `parse()`
     */
    get componentName(): SGToken;
    /**
     * Does this file need to be transpiled?
     */
    needsTranspiled: boolean;
    /**
     * The AST for this file
     */
    get ast(): import("../parser/SGTypes").SGAst;
    /**
     * The full file contents
     */
    fileContents: string;
    /**
     * Calculate the AST for this file
     * @param fileContents the xml source code to parse
     */
    parse(fileContents: string): void;
    /**
     * @deprecated logic has moved into XmlFileValidator, this is now an empty function
     */
    validate(): void;
    /**
     * Collect all bs: comment flags
     */
    getCommentFlags(tokens: Array<IToken & {
        tokenType: TokenType;
    }>): void;
    private dependencyGraph;
    /**
     * Attach the file to the dependency graph so it can monitor changes.
     * Also notify the dependency graph of our current dependencies so other dependents can be notified.
     */
    attachDependencyGraph(dependencyGraph: DependencyGraph): void;
    /**
     * A slight hack. Gives the Program a way to support multiple components with the same name
     * without causing major issues. A value of 0 will be ignored as part of the dependency graph key.
     * Howver, a nonzero value will be used as part of the dependency graph key so this component doesn't
     * collide with the primary component. For example, if there are three components with the same name, you will
     * have the following dependency graph keys: ["component:CustomGrid", "component:CustomGrid[1]", "component:CustomGrid[2]"]
     */
    dependencyGraphIndex: number;
    /**
     * The key used in the dependency graph for this file.
     * If we have a component name, we will use that so we can be discoverable by child components.
     * If we don't have a component name, use the pkgPath so at least we can self-validate
     */
    get dependencyGraphKey(): string;
    /**
     * The key used in the dependency graph for this component's parent.
     * If we have aparent, we will use that. If we don't, this will return undefined
     */
    get parentComponentDependencyGraphKey(): string;
    /**
     * Determines if this xml file has a reference to the specified file (or if it's itself)
     */
    doesReferenceFile(file: File): boolean;
    /**
     * Get all available completions for the specified position
     */
    getCompletions(position: Position): CompletionItem[];
    /**
     * Get the parent component (the component this component extends)
     */
    get parentComponent(): XmlFile;
    getReferences(position: Position): Promise<Location[]>;
    getFunctionScopeAtPosition(position: Position, functionScopes?: FunctionScope[]): FunctionScope;
    /**
     * Walk up the ancestor chain and aggregate all of the script tag imports
     */
    getAncestorScriptTagImports(): FileReference[];
    /**
     * Remove this file from the dependency graph as a node
     */
    detachDependencyGraph(dependencyGraph: DependencyGraph): void;
    /**
     * Get the list of script imports that this file needs to include.
     * It compares the list of imports on this file to those of its parent,
     * and only includes the ones that are not found on the parent.
     * If no parent is found, all imports are returned
     */
    private getMissingImportsForTranspile;
    private logDebug;
    private checkScriptsForPublishableImports;
    /**
     * Convert the brightscript/brighterscript source code into valid brightscript
     */
    transpile(): CodeWithSourceMap;
    dispose(): void;
}

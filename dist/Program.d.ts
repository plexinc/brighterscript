import type { CodeAction, CompletionItem, Position, Range, SignatureInformation, Location, DocumentSymbol, CancellationToken } from 'vscode-languageserver';
import type { BsConfig, FinalizedBsConfig } from './BsConfig';
import { Scope } from './Scope';
import { BrsFile } from './files/BrsFile';
import { XmlFile } from './files/XmlFile';
import type { BsDiagnostic, File, FileReference, FileObj, BscFile, SemanticToken, FileLink, Hover } from './interfaces';
import { XmlScope } from './XmlScope';
import type { Logger } from './logging';
import PluginInterface from './PluginInterface';
import type { FunctionStatement } from './parser/Statement';
import type { SourceMapGenerator } from 'source-map';
import type { Statement } from './parser/AstNode';
export interface SourceObj {
    /**
     * @deprecated use `srcPath` instead
     */
    pathAbsolute: string;
    srcPath: string;
    source: string;
    definitions?: string;
}
export interface TranspileObj {
    file: BscFile;
    outputPath: string;
}
export interface SignatureInfoObj {
    index: number;
    key: string;
    signature: SignatureInformation;
}
export declare class Program {
    constructor(
    /**
     * The root directory for this program
     */
    options: BsConfig, logger?: Logger, plugins?: PluginInterface);
    options: FinalizedBsConfig;
    logger: Logger;
    private createGlobalScope;
    /**
     * A graph of all files and their dependencies.
     * For example:
     *      File.xml -> [lib1.brs, lib2.brs]
     *      lib2.brs -> [lib3.brs] //via an import statement
     */
    private dependencyGraph;
    private diagnosticFilterer;
    private diagnosticAdjuster;
    /**
     * A scope that contains all built-in global functions.
     * All scopes should directly or indirectly inherit from this scope
     */
    globalScope: Scope;
    /**
     * Plugins which can provide extra diagnostics or transform AST
     */
    plugins: PluginInterface;
    /**
     * A set of diagnostics. This does not include any of the scope diagnostics.
     * Should only be set from `this.validate()`
     */
    private diagnostics;
    /**
     * The path to bslib.brs (the BrightScript runtime for certain BrighterScript features)
     */
    get bslibPkgPath(): string;
    get bslibPrefix(): "rokucommunity_bslib" | "bslib";
    /**
     * A map of every file loaded into this program, indexed by its original file location
     */
    files: Record<string, BscFile>;
    private pkgMap;
    private scopes;
    protected addScope(scope: Scope): void;
    /**
     * A map of every component currently loaded into the program, indexed by the component name.
     * It is a compile-time error to have multiple components with the same name. However, we store an array of components
     * by name so we can provide a better developer expreience. You shouldn't be directly accessing this array,
     * but if you do, only ever use the component at index 0.
     */
    private components;
    /**
     * Get the component with the specified name
     */
    getComponent(componentName: string): {
        file: XmlFile;
        scope: XmlScope;
    };
    /**
     * Register (or replace) the reference to a component in the component map
     */
    private registerComponent;
    /**
     * Remove the specified component from the components map
     */
    private unregisterComponent;
    /**
     * re-attach the dependency graph with a new key for any component who changed
     * their position in their own named array (only matters when there are multiple
     * components with the same name)
     */
    private syncComponentDependencyGraph;
    /**
     * Get a list of all files that are included in the project but are not referenced
     * by any scope in the program.
     */
    getUnreferencedFiles(): File[];
    /**
     * Get the list of errors for the entire program. It's calculated on the fly
     * by walking through every file, so call this sparingly.
     */
    getDiagnostics(): BsDiagnostic[];
    addDiagnostics(diagnostics: BsDiagnostic[]): void;
    /**
     * Determine if the specified file is loaded in this program right now.
     * @param filePath the absolute or relative path to the file
     * @param normalizePath should the provided path be normalized before use
     */
    hasFile(filePath: string, normalizePath?: boolean): boolean;
    getPkgPath(...args: any[]): any;
    /**
     * roku filesystem is case INsensitive, so find the scope by key case insensitive
     */
    getScopeByName(scopeName: string): Scope | undefined;
    /**
     * Return all scopes
     */
    getScopes(): Scope[];
    /**
     * Find the scope for the specified component
     */
    getComponentScope(componentName: string): XmlScope;
    /**
     * Update internal maps with this file reference
     */
    private assignFile;
    /**
     * Remove this file from internal maps
     */
    private unassignFile;
    /**
     * Load a file into the program. If that file already exists, it is replaced.
     * If file contents are provided, those are used, Otherwise, the file is loaded from the file system
     * @param srcPath the file path relative to the root dir
     * @param fileContents the file contents
     * @deprecated use `setFile` instead
     */
    addOrReplaceFile<T extends BscFile>(srcPath: string, fileContents: string): T;
    /**
     * Load a file into the program. If that file already exists, it is replaced.
     * @param fileEntry an object that specifies src and dest for the file.
     * @param fileContents the file contents. If not provided, the file will be loaded from disk
     * @deprecated use `setFile` instead
     */
    addOrReplaceFile<T extends BscFile>(fileEntry: FileObj, fileContents: string): T;
    /**
     * Load a file into the program. If that file already exists, it is replaced.
     * If file contents are provided, those are used, Otherwise, the file is loaded from the file system
     * @param srcDestOrPkgPath the absolute path, the pkg path (i.e. `pkg:/path/to/file.brs`), or the destPath (i.e. `path/to/file.brs` relative to `pkg:/`)
     * @param fileContents the file contents
     */
    setFile<T extends BscFile>(srcDestOrPkgPath: string, fileContents: string): T;
    /**
     * Load a file into the program. If that file already exists, it is replaced.
     * @param fileEntry an object that specifies src and dest for the file.
     * @param fileContents the file contents. If not provided, the file will be loaded from disk
     */
    setFile<T extends BscFile>(fileEntry: FileObj, fileContents: string): T;
    /**
     * Given a srcPath, a pkgPath, or both, resolve whichever is missing, relative to rootDir.
     * @param fileParam an object representing file paths
     * @param rootDir must be a pre-normalized path
     */
    private getPaths;
    /**
     * Remove any leading `pkg:/` found in the path
     */
    private removePkgPrefix;
    /**
     * Ensure source scope is created.
     * Note: automatically called internally, and no-op if it exists already.
     */
    createSourceScope(): void;
    /**
     * Find the file by its absolute path. This is case INSENSITIVE, since
     * Roku is a case insensitive file system. It is an error to have multiple files
     * with the same path with only case being different.
     * @param srcPath the absolute path to the file
     * @deprecated use `getFile` instead, which auto-detects the path type
     */
    getFileByPathAbsolute<T extends BrsFile | XmlFile>(srcPath: string): T;
    /**
     * Get a list of files for the given (platform-normalized) pkgPath array.
     * Missing files are just ignored.
     * @deprecated use `getFiles` instead, which auto-detects the path types
     */
    getFilesByPkgPaths<T extends BscFile[]>(pkgPaths: string[]): T;
    /**
     * Get a file with the specified (platform-normalized) pkg path.
     * If not found, return undefined
     * @deprecated use `getFile` instead, which auto-detects the path type
     */
    getFileByPkgPath<T extends BscFile>(pkgPath: string): T;
    /**
     * Remove a set of files from the program
     * @param srcPaths can be an array of srcPath or destPath strings
     * @param normalizePath should this function repair and standardize the filePaths? Passing false should have a performance boost if you can guarantee your paths are already sanitized
     */
    removeFiles(srcPaths: string[], normalizePath?: boolean): void;
    /**
     * Remove a file from the program
     * @param filePath can be a srcPath, a pkgPath, or a destPath (same as pkgPath but without `pkg:/`)
     * @param normalizePath should this function repair and standardize the path? Passing false should have a performance boost if you can guarantee your path is already sanitized
     */
    removeFile(filePath: string, normalizePath?: boolean): void;
    /**
     * Counter used to track which validation run is being logged
     */
    private validationRunSequence;
    /**
     * How many milliseconds can pass while doing synchronous operations in validate before we register a short timeout (i.e. yield to the event loop)
     */
    private validationMinSyncDuration;
    private validatePromise;
    /**
     * Traverse the entire project, and validate all scopes
     */
    validate(): void;
    validate(options: {
        async: false;
        cancellationToken?: CancellationToken;
    }): void;
    validate(options: {
        async: true;
        cancellationToken?: CancellationToken;
    }): Promise<void>;
    /**
     * Flag all duplicate component names
     */
    private detectDuplicateComponentNames;
    /**
     * Get the files for a list of filePaths
     * @param filePaths can be an array of srcPath or a destPath strings
     * @param normalizePath should this function repair and standardize the paths? Passing false should have a performance boost if you can guarantee your paths are already sanitized
     */
    getFiles<T extends BscFile>(filePaths: string[], normalizePath?: boolean): T[];
    /**
     * Get the file at the given path
     * @param filePath can be a srcPath or a destPath
     * @param normalizePath should this function repair and standardize the path? Passing false should have a performance boost if you can guarantee your path is already sanitized
     */
    getFile<T extends BscFile>(filePath: string, normalizePath?: boolean): T;
    /**
     * Get a list of all scopes the file is loaded into
     * @param file the file
     */
    getScopesForFile(file: XmlFile | BrsFile | string): Scope[];
    /**
     * Get the first found scope for a file.
     */
    getFirstScopeForFile(file: XmlFile | BrsFile): Scope | undefined;
    getStatementsByName(name: string, originFile: BrsFile, namespaceName?: string): FileLink<Statement>[];
    getStatementsForXmlFile(scope: XmlScope, filterName?: string): FileLink<FunctionStatement>[];
    /**
     * Find all available completion items at the given position
     * @param filePath can be a srcPath or a destPath
     * @param position the position (line & column) where completions should be found
     */
    getCompletions(filePath: string, position: Position): CompletionItem[];
    /**
     * Goes through each file and builds a list of workspace symbols for the program. Used by LanguageServer's onWorkspaceSymbol functionality
     */
    getWorkspaceSymbols(): import("vscode-languageserver-types").WorkspaceSymbol[];
    /**
     * Given a position in a file, if the position is sitting on some type of identifier,
     * go to the definition of that identifier (where this thing was first defined)
     */
    getDefinition(srcPath: string, position: Position): Location[];
    /**
     * Get hover information for a file and position
     */
    getHover(srcPath: string, position: Position): Hover[];
    /**
     * Get full list of document symbols for a file
     * @param srcPath path to the file
     */
    getDocumentSymbols(srcPath: string): DocumentSymbol[] | undefined;
    /**
     * Compute code actions for the given file and range
     */
    getCodeActions(srcPath: string, range: Range): CodeAction[];
    /**
     * Get semantic tokens for the specified file
     */
    getSemanticTokens(srcPath: string): SemanticToken[] | undefined;
    getSignatureHelp(filePath: string, position: Position): SignatureInfoObj[];
    getReferences(srcPath: string, position: Position): Location[];
    /**
     * Get a list of all script imports, relative to the specified pkgPath
     * @param sourcePkgPath - the pkgPath of the source that wants to resolve script imports.
     */
    getScriptImportCompletions(sourcePkgPath: string, scriptImport: FileReference): CompletionItem[];
    /**
     * Transpile a single file and get the result as a string.
     * This does not write anything to the file system.
     *
     * This should only be called by `LanguageServer`.
     * Internal usage should call `_getTranspiledFileContents` instead.
     * @param filePath can be a srcPath or a destPath
     */
    getTranspiledFileContents(filePath: string): Promise<FileTranspileResult>;
    /**
     * Internal function used to transpile files.
     * This does not write anything to the file system
     */
    private _getTranspiledFileContents;
    private beforeProgramTranspile;
    transpile(fileEntries: FileObj[], stagingDir: string): Promise<void>;
    private afterProgramTranspile;
    /**
     * Find a list of files in the program that have a function with the given name (case INsensitive)
     */
    findFilesForFunction(functionName: string): BscFile[];
    /**
     * Find a list of files in the program that have a class with the given name (case INsensitive)
     */
    findFilesForClass(className: string): BscFile[];
    findFilesForNamespace(name: string): BscFile[];
    findFilesForEnum(name: string): BscFile[];
    private _manifest;
    /**
     * Modify a parsed manifest map by reading `bs_const` and injecting values from `options.manifest.bs_const`
     * @param parsedManifest The manifest map to read from and modify
     */
    private buildBsConstsIntoParsedManifest;
    /**
     * Try to find and load the manifest into memory
     * @param manifestFileObj A pointer to a potential manifest file object found during loading
     * @param replaceIfAlreadyLoaded should we overwrite the internal `_manifest` if it already exists
     */
    loadManifest(manifestFileObj?: FileObj, replaceIfAlreadyLoaded?: boolean): void;
    /**
     * Get a map of the manifest information
     */
    getManifest(): Map<string, string>;
    dispose(): void;
}
export interface FileTranspileResult {
    srcPath: string;
    pkgPath: string;
    code: string;
    map: SourceMapGenerator;
    typedef: string;
}

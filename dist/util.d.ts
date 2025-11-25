/// <reference types="node" />
/// <reference types="node" />
import type { Diagnostic, Position, Range, Location } from 'vscode-languageserver';
import type { BsConfig, FinalizedBsConfig } from './BsConfig';
import type { CallableContainer, BsDiagnostic, FileReference, CallableContainerMap, Plugin, ExpressionInfo, TranspileResult, MaybePromise, DisposableLike } from './interfaces';
import { BooleanType } from './types/BooleanType';
import { DoubleType } from './types/DoubleType';
import { DynamicType } from './types/DynamicType';
import { FloatType } from './types/FloatType';
import { FunctionType } from './types/FunctionType';
import { IntegerType } from './types/IntegerType';
import { InvalidType } from './types/InvalidType';
import { LongIntegerType } from './types/LongIntegerType';
import { ObjectType } from './types/ObjectType';
import { StringType } from './types/StringType';
import { VoidType } from './types/VoidType';
import type { DottedGetExpression, VariableExpression } from './parser/Expression';
import type { Identifier, Locatable, Token } from './lexer/Token';
import { CustomType } from './types/CustomType';
import { SourceNode } from 'source-map';
import type { SGAttribute } from './parser/SGTypes';
import type { BrsFile } from './files/BrsFile';
import type { XmlFile } from './files/XmlFile';
import type { Expression, Statement } from './parser/AstNode';
export declare class Util {
    clearConsole(): void;
    /**
     * Get the version of brighterscript
     */
    getBrighterScriptVersion(): any;
    /**
     * Returns the number of parent directories in the filPath
     */
    getParentDirectoryCount(filePath: string | undefined): number;
    /**
     * Determine if the file exists
     */
    pathExists(filePath: string | undefined): Promise<boolean>;
    /**
     * Determine if the file exists
     */
    pathExistsSync(filePath: string | undefined): boolean;
    /**
     * Determine if this path is a directory
     */
    isDirectorySync(dirPath: string | undefined): boolean;
    /**
     * Read a file from disk. If a failure occurrs, simply return undefined
     * @param filePath path to the file
     * @returns the string contents, or undefined if the file doesn't exist
     */
    readFileSync(filePath: string): Buffer | undefined;
    /**
     * Given a pkg path of any kind, transform it to a roku-specific pkg path (i.e. "pkg:/some/path.brs")
     */
    sanitizePkgPath(pkgPath: string): string;
    /**
     * Determine if the given path starts with a protocol
     */
    startsWithProtocol(path: string): boolean;
    /**
     * Given a pkg path of any kind, transform it to a roku-specific pkg path (i.e. "pkg:/some/path.brs")
     */
    getRokuPkgPath(pkgPath: string): string;
    /**
     * Given a path to a file/directory, replace all path separators with the current system's version.
     */
    pathSepNormalize(filePath: string, separator?: string): string;
    /**
     * Find the path to the config file.
     * If the config file path doesn't exist
     * @param cwd the current working directory where the search for configs should begin
     */
    getConfigFilePath(cwd?: string): string;
    getRangeFromOffsetLength(text: string, offset: number, length: number): Range;
    /**
     * Load the contents of a config file.
     * If the file extends another config, this will load the base config as well.
     * @param configFilePath the relative or absolute path to a brighterscript config json file
     * @param parentProjectPaths a list of parent config files. This is used by this method to recursively build the config list
     */
    loadConfigFile(configFilePath: string | undefined, parentProjectPaths?: string[], cwd?: string): BsConfig | undefined;
    /**
     * Convert relative paths to absolute paths, relative to the given directory. Also de-dupes the paths. Modifies the array in-place
     * @param collection usually a bsconfig.
     * @param key a key of the config to read paths from (usually this is `'plugins'` or `'require'`)
     * @param relativeDir the path to the folder where the paths should be resolved relative to. This should be an absolute path
     */
    resolvePathsRelativeTo(collection: any, key: string, relativeDir: string): void;
    /**
     * Do work within the scope of a changed current working directory
     * @param targetCwd the cwd where the work should be performed
     * @param callback a function to call when the cwd has been changed to `targetCwd`
     */
    cwdWork<T>(targetCwd: string | null | undefined, callback: () => T): T;
    /**
     * Given a BsConfig object, start with defaults,
     * merge with bsconfig.json and the provided options.
     * @param config a bsconfig object to use as the baseline for the resulting config
     */
    normalizeAndResolveConfig(config: BsConfig | undefined): FinalizedBsConfig;
    /**
     * Set defaults for any missing items
     * @param config a bsconfig object to use as the baseline for the resulting config
     */
    normalizeConfig(config: BsConfig | undefined): FinalizedBsConfig;
    /**
     * Get the root directory from options.
     * Falls back to options.cwd.
     * Falls back to process.cwd
     * @param options a bsconfig object
     */
    getRootDir(options: BsConfig): string;
    /**
     * Given a list of callables as a dictionary indexed by their full name (namespace included, transpiled to underscore-separated.
     */
    getCallableContainersByLowerName(callables: CallableContainer[]): CallableContainerMap;
    /**
     * Split a file by newline characters (LF or CRLF)
     */
    getLines(text: string): string[];
    /**
     * Given an absolute path to a source file, and a target path,
     * compute the pkg path for the target relative to the source file's location
     */
    getPkgPathFromTarget(containingFilePathAbsolute: string, targetPath: string): string;
    /**
     * Compute the relative path from the source file to the target file
     * @param pkgSrcPath  - the absolute path to the source, where cwd is the package location
     * @param pkgTargetPath  - the absolute path to the target, where cwd is the package location
     */
    getRelativePath(pkgSrcPath: string, pkgTargetPath: string): string;
    /**
     * Walks left in a DottedGetExpression and returns a VariableExpression if found, or undefined if not found
     */
    findBeginningVariableExpression(dottedGet: DottedGetExpression): VariableExpression | undefined;
    /**
     * Do `a` and `b` overlap by at least one character. This returns false if they are at the edges. Here's some examples:
     * ```
     * | true | true | true | true | true | false | false | false | false |
     * |------|------|------|------|------|-------|-------|-------|-------|
     * | aa   |  aaa |  aaa | aaa  |  a   |  aa   |    aa | a     |     a |
     * |  bbb | bb   |  bbb |  b   | bbb  |    bb |  bb   |     b | a     |
     * ```
     */
    rangesIntersect(a: Range | undefined, b: Range | undefined): boolean;
    /**
     * Do `a` and `b` overlap by at least one character or touch at the edges
     * ```
     * | true | true | true | true | true | true  | true  | false | false |
     * |------|------|------|------|------|-------|-------|-------|-------|
     * | aa   |  aaa |  aaa | aaa  |  a   |  aa   |    aa | a     |     a |
     * |  bbb | bb   |  bbb |  b   | bbb  |    bb |  bb   |     b | a     |
     * ```
     */
    rangesIntersectOrTouch(a: Range | undefined, b: Range | undefined): boolean;
    /**
     * Test if `position` is in `range`. If the position is at the edges, will return true.
     * Adapted from core vscode
     */
    rangeContains(range: Range | undefined, position: Position | undefined): boolean;
    comparePositionToRange(position: Position | undefined, range: Range | undefined): 1 | -1 | 0;
    /**
     * Parse an xml file and get back a javascript object containing its results
     */
    parseXml(text: string): Promise<any>;
    propertyCount(object: Record<string, unknown>): number;
    padLeft(subject: string, totalLength: number, char: string): string;
    /**
     * Force the drive letter to lower case
     */
    driveLetterToLower(fullPath: string): string;
    /**
     * Replace the first instance of `search` in `subject` with `replacement`
     */
    replaceCaseInsensitive(subject: string, search: string, replacement: string): string;
    /**
     * Determine if two arrays containing primitive values are equal.
     * This considers order and compares by equality.
     */
    areArraysEqual(arr1: any[], arr2: any[]): boolean;
    /**
     * Does the string appear to be a uri (i.e. does it start with `file:`)
     */
    isUriLike(filePath: string): boolean;
    /**
     * Given a file path, convert it to a URI string
     */
    pathToUri(filePath: string): string;
    /**
     * Given a URI, convert that to a regular fs path
     */
    uriToPath(uri: string): string;
    /**
     * Get the outDir from options, taking into account cwd and absolute outFile paths
     */
    getOutDir(options: FinalizedBsConfig): string;
    /**
     * Get paths to all files on disc that match this project's source list
     */
    getFilePaths(options: FinalizedBsConfig): Promise<import("roku-deploy").StandardizedFileEntry[]>;
    /**
     * Given a path to a brs file, compute the path to a theoretical d.bs file.
     * Only `.brs` files can have typedef path, so return undefined for everything else
     */
    getTypedefPath(brsSrcPath: string): string;
    /**
     * Determine whether this diagnostic should be supressed or not, based on brs comment-flags
     */
    diagnosticIsSuppressed(diagnostic: BsDiagnostic): boolean;
    /**
     * Walks up the chain to find the closest bsconfig.json file
     */
    findClosestConfigFile(currentPath: string): Promise<string | undefined>;
    /**
     * Set a timeout for the specified milliseconds, and resolve the promise once the timeout is finished.
     * @param milliseconds the minimum number of milliseconds to sleep for
     */
    sleep(milliseconds: number): Promise<unknown>;
    /**
     * Given an array, map and then flatten
     * @param array the array to flatMap over
     * @param callback a function that is called for every array item
     */
    flatMap<T, R>(array: T[], callback: (arg: T) => R[]): R[];
    /**
     * Determines if the position is greater than the range. This means
     * the position does not touch the range, and has a position greater than the end
     * of the range. A position that touches the last line/char of a range is considered greater
     * than the range, because the `range.end` is EXclusive
     */
    positionIsGreaterThanRange(position: Position, range: Range): boolean;
    /**
     * Get a location object back by extracting location information from other objects that contain location
     */
    getRange(startObj: {
        range: Range;
    }, endObj: {
        range: Range;
    }): Range;
    /**
     * If the two items both start on the same line
     */
    sameStartLine(first: {
        range: Range;
    }, second: {
        range: Range;
    }): boolean;
    /**
     * If the two items have lines that touch
     */
    linesTouch(first: {
        range?: Range | undefined;
    }, second: {
        range?: Range | undefined;
    }): boolean;
    /**
     * Given text with (or without) dots separating text, get the rightmost word.
     * (i.e. given "A.B.C", returns "C". or "B" returns "B because there's no dot)
     */
    getTextAfterFinalDot(name: string): string;
    /**
     * Find a script import that the current position touches, or undefined if not found
     */
    getScriptImportAtPosition(scriptImports: FileReference[], position: Position): FileReference | undefined;
    /**
     * Given the class name text, return a namespace-prefixed name.
     * If the name already has a period in it, or the namespaceName was not provided, return the class name as is.
     * If the name does not have a period, and a namespaceName was provided, return the class name prepended by the namespace name.
     * If no namespace is provided, return the `className` unchanged.
     */
    getFullyQualifiedClassName(className: string, namespaceName?: string): string;
    splitIntoLines(string: string): string[];
    getTextForRange(string: string | string[], range: Range): string;
    /**
     * Helper for creating `Location` objects. Prefer using this function because vscode-languageserver's `Location.create()` is significantly slower at scale
     */
    createLocation(uri: string, range: Range): Location;
    /**
     * Helper for creating `Range` objects. Prefer using this function because vscode-languageserver's `Range.create()` is significantly slower
     */
    createRange(startLine: number, startCharacter: number, endLine: number, endCharacter: number): Range;
    /**
     * Create a `Range` from two `Position`s
     */
    createRangeFromPositions(startPosition: Position, endPosition: Position): Range;
    /**
     * Clone a range
     */
    cloneRange(range: Range): Range;
    /**
     * Clone every token
     */
    cloneToken<T extends Token>(token: T): T;
    /**
     * Given a list of ranges, create a range that starts with the first non-null lefthand range, and ends with the first non-null
     * righthand range. Returns undefined if none of the items have a range.
     */
    createBoundingRange(...locatables: Array<{
        range?: Range;
    } | null | undefined>): Range | undefined;
    /**
     * Create a `Position` object. Prefer this over `Position.create` for performance reasons
     */
    createPosition(line: number, character: number): {
        line: number;
        character: number;
    };
    /**
     * Convert a list of tokens into a string, including their leading whitespace
     */
    tokensToString(tokens: Token[]): string;
    /**
     * Convert a token into a BscType
     */
    tokenToBscType(token: Token, allowCustomType?: boolean): DynamicType | BooleanType | LongIntegerType | IntegerType | FloatType | DoubleType | FunctionType | InvalidType | ObjectType | StringType | VoidType | CustomType;
    /**
     * Get the extension for the given file path. Basically the part after the final dot, except for
     * `d.bs` which is treated as single extension
     */
    getExtension(filePath: string): string;
    /**
     * Load and return the list of plugins
     */
    loadPlugins(cwd: string, pathOrModules: string[], onError?: (pathOrModule: string, err: Error) => void): Plugin[];
    /**
     * Gathers expressions, variables, and unique names from an expression.
     * This is mostly used for the ternary expression
     */
    getExpressionInfo(expression: Expression, file: BrsFile): ExpressionInfo;
    /**
     * Create a SourceNode that maps every line to itself. Useful for creating maps for files
     * that haven't changed at all, but we still need the map
     */
    simpleMap(source: string, src: string): SourceNode;
    /**
     * Creates a new SGAttribute object, but keeps the existing Range references (since those shouldn't ever get changed directly)
     */
    cloneSGAttribute(attr: SGAttribute, value: string): SGAttribute;
    private isWindows;
    private standardizePathCache;
    /**
     * Converts a path into a standardized format (drive letter to lower, remove extra slashes, use single slash type, resolve relative parts, etc...)
     */
    standardizePath(thePath: string): string;
    /**
     * Copy the version of bslib from local node_modules to the staging folder
     */
    copyBslibToStaging(stagingDir: string, bslibDestinationDir?: string): Promise<void>;
    /**
     * Given a Diagnostic or BsDiagnostic, return a deep clone of the diagnostic.
     * @param diagnostic the diagnostic to clone
     * @param relatedInformationFallbackLocation a default location to use for all `relatedInformation` entries that are missing a location
     */
    toDiagnostic(diagnostic: Diagnostic | BsDiagnostic, relatedInformationFallbackLocation: string): Diagnostic;
    /**
     * Get the first locatable item found at the specified position
     * @param locatables an array of items that have a `range` property
     * @param position the position that the locatable must contain
     */
    getFirstLocatableAt(locatables: Locatable[], position: Position): Locatable;
    /**
     * Sort an array of objects that have a Range
     */
    sortByRange<T extends Locatable>(locatables: T[]): T[];
    /**
     * Split the given text and return ranges for each chunk.
     * Only works for single-line strings
     */
    splitGetRange(separator: string, text: string, range: Range): {
        text: string;
        range: Range;
    }[];
    /**
     * Wrap the given code in a markdown code fence (with the language)
     */
    mdFence(code: string, language?: string): string;
    /**
     * Gets each part of the dotted get.
     * @param node any ast expression
     * @returns an array of the parts of the dotted get. If not fully a dotted get, then returns undefined
     */
    getAllDottedGetParts(node: Expression | Statement): Identifier[] | undefined;
    /**
     * Break an expression into each part.
     */
    splitExpression(expression: Expression): Expression[];
    /**
     * Break an expression into each part, and return any VariableExpression or DottedGet expresisons from left-to-right.
     */
    getDottedGetPath(expression: Expression): [VariableExpression, ...DottedGetExpression[]];
    /**
     * Returns an integer if valid, or undefined. Eliminates checking for NaN
     */
    parseInt(value: any): number;
    /**
     * Converts a range to a string in the format 1:2-3:4
     */
    rangeToString(range: Range): string;
    validateTooDeepFile(file: (BrsFile | XmlFile)): void;
    /**
     * Execute dispose for a series of disposable items
     * @param disposables a list of functions or disposables
     */
    applyDispose(disposables: DisposableLike[]): void;
    /**
     * Race a series of promises, and return the first one that resolves AND matches the matcher function.
     * If all of the promises reject, then this will emit an AggregatreError with all of the errors.
     * If at least one promise resolves, then this will log all of the errors to the console
     * If at least one promise resolves but none of them match the matcher, then this will return undefined.
     * @param promises all of the promises to race
     * @param matcher a function that should return true if this value should be kept. Returning any value other than true means `false`
     * @returns the first resolved value that matches the matcher, or undefined if none of them match
     */
    promiseRaceMatch<T>(promises: MaybePromise<T>[], matcher: (value: T) => boolean): Promise<T>;
    /**
     * Wraps SourceNode's constructor to be compatible with the TranspileResult type
     */
    sourceNodeFromTranspileResult(line: number | null, column: number | null, source: string | null, chunks?: string | SourceNode | TranspileResult, name?: string): SourceNode;
    isBuiltInType(typeName: string): any;
    /**
     * Get a short name that can be used to reference the project in logs. (typically something like `prj1`, `prj8`, etc...)
     */
    getProjectLogName(config: {
        projectNumber: number;
    }): string;
}
/**
 * A tagged template literal function for standardizing the path. This has to be defined as standalone function since it's a tagged template literal function,
 * we can't use `object.tag` syntax.
 */
export declare function standardizePath(stringParts: any, ...expressions: any[]): string;
export declare let util: Util;
export default util;

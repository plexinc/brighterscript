import type { CodeWithSourceMap } from 'source-map';
import type { CompletionItem, Position, Location, Diagnostic } from 'vscode-languageserver';
import { Scope } from '../Scope';
import { FunctionScope } from '../FunctionScope';
import type { Callable, CommentFlag, FunctionCall, BsDiagnostic, FileReference, FileLink, BscFile } from '../interfaces';
import type { Token } from '../lexer/Token';
import { TokenKind } from '../lexer/TokenKind';
import { Parser, ParseMode } from '../parser/Parser';
import type { FunctionExpression } from '../parser/Expression';
import type { ClassStatement, NamespaceStatement, MethodStatement } from '../parser/Statement';
import type { Program } from '../Program';
import type { DependencyGraph } from '../DependencyGraph';
import type { AstNode, Expression } from '../parser/AstNode';
/**
 * Holds all details about this file within the scope of the whole program
 */
export declare class BrsFile {
    srcPath: string;
    /**
     * The full pkg path to this file
     */
    pkgPath: string;
    program: Program;
    constructor(srcPath: string, 
    /**
     * The full pkg path to this file
     */
    pkgPath: string, program: Program);
    /**
     * The absolute path to the source location for this file
     * @deprecated use `srcPath` instead
     */
    get pathAbsolute(): string;
    set pathAbsolute(value: string);
    /**
     * Will this file result in only comment or whitespace output? If so, it can be excluded from the output if that bsconfig setting is enabled.
     */
    get canBePruned(): boolean;
    /**
     * The parseMode used for the parser for this file
     */
    parseMode: ParseMode;
    /**
     * The key used to identify this file in the dependency graph
     */
    dependencyGraphKey: string;
    /**
     * Indicates whether this file needs to be validated.
     * Files are only ever validated a single time
     */
    isValidated: boolean;
    /**
     * The all-lowercase extension for this file (including the leading dot)
     */
    extension: string;
    /**
     * A collection of diagnostics related to this file
     */
    diagnostics: BsDiagnostic[];
    getDiagnostics(): BsDiagnostic[];
    addDiagnostic(diagnostic: Diagnostic & {
        file?: BscFile;
    }): void;
    addDiagnostics(diagnostics: BsDiagnostic[]): void;
    commentFlags: CommentFlag[];
    callables: Callable[];
    functionCalls: FunctionCall[];
    private _functionScopes;
    get functionScopes(): FunctionScope[];
    private get cache();
    /**
     * files referenced by import statements
     */
    get ownScriptImports(): FileReference[];
    /**
     * Does this file need to be transpiled?
     */
    needsTranspiled: boolean;
    /**
     * The AST for this file
     */
    get ast(): import("../parser/Statement").Body;
    /**
     * Get the token at the specified position
     */
    getTokenAt(position: Position): Token;
    /**
     * Walk the AST and find the expression that this token is most specifically contained within
     */
    getClosestExpression(position: Position): AstNode;
    get parser(): Parser;
    private _parser;
    fileContents: string;
    /**
     * If this is a typedef file
     */
    isTypedef: boolean;
    /**
     * The key to find the typedef file in the program's files map.
     * A falsey value means this file is ineligable for a typedef
     */
    typedefKey?: string;
    /**
     * If the file was given type definitions during parse
     */
    hasTypedef: any;
    /**
     * A reference to the typedef file (if one exists)
     */
    typedefFile?: BrsFile;
    /**
     * An unsubscribe function for the dependencyGraph subscription
     */
    private unsubscribeFromDependencyGraph;
    /**
     * Find and set the typedef variables (if a matching typedef file exists)
     */
    private resolveTypedef;
    /**
     * Attach the file to the dependency graph so it can monitor changes.
     * Also notify the dependency graph of our current dependencies so other dependents can be notified.
     */
    attachDependencyGraph(dependencyGraph: DependencyGraph): void;
    /**
     * Calculate the AST for this file
     * @param fileContents the raw source code to parse
     */
    parse(fileContents: string): void;
    /**
     * @deprecated logic has moved into BrsFileValidator, this is now an empty function
     */
    validate(): void;
    /**
     * Find a class. This scans all scopes for this file, and returns the first matching class that is found.
     * Returns undefined if not found.
     * @param className - The class name, including the namespace of the class if possible
     * @param containingNamespace - The namespace used to resolve relative class names. (i.e. the namespace around the current statement trying to find a class)
     * @returns the first class in the first scope found, or undefined if not found
     */
    getClassFileLink(className: string, containingNamespace?: string): FileLink<ClassStatement>;
    findPropertyNameCompletions(): CompletionItem[];
    private _propertyNameCompletions;
    get propertyNameCompletions(): CompletionItem[];
    /**
     * Find all comment flags in the source code. These enable or disable diagnostic messages.
     * @param tokens - an array of tokens of which to find `TokenKind.Comment` from
     */
    getCommentFlags(tokens: Token[]): void;
    scopesByFunc: Map<FunctionExpression, FunctionScope>;
    /**
     * Create a scope for every function in this file
     */
    private createFunctionScopes;
    private getBscTypeFromAssignment;
    private getCallableByName;
    private findCallables;
    private findFunctionCalls;
    /**
     * Find the function scope at the given position.
     * @param position the position used to find the deepest scope that contains it
     */
    getFunctionScopeAtPosition(position: Position): FunctionScope;
    _getFunctionScopeAtPosition(position: Position, functionScopes?: FunctionScope[]): FunctionScope;
    /**
     * Find the NamespaceStatement enclosing the given position
     */
    getNamespaceStatementForPosition(position: Position): NamespaceStatement;
    /**
     * Get completions available at the given cursor. This aggregates all values from this file and the current scope.
     */
    getCompletions(position: Position, scope?: Scope): CompletionItem[];
    private getLabelCompletion;
    private getClassMemberCompletions;
    getClassFromMReference(position: Position, currentToken: Token, functionScope: FunctionScope): FileLink<ClassStatement> | undefined;
    private getGlobalClassStatementCompletions;
    private getNonNamespacedEnumStatementCompletions;
    private getNonNamespacedConstStatementCompletions;
    private getEnumMemberStatementCompletions;
    private getNamespaceCompletions;
    /**
     * Given a current token, walk
     */
    getPartialVariableName(currentToken: Token, excludeTokens?: TokenKind[]): string;
    isPositionNextToTokenKind(position: Position, tokenKind: TokenKind): boolean;
    private getTokenBefore;
    private tokenFollows;
    getTokensUntil(currentToken: Token, tokenKind: TokenKind, direction?: -1 | 1): any[];
    getPreviousToken(token: Token): Token;
    /**
     * Finds the first scope for this file, then returns true if there's a namespace with this name.
     * Returns false if no namespace was found with that name
     */
    calleeStartsWithNamespace(callee: Expression): boolean;
    /**
     * Determine if the callee (i.e. function name) is a known function declared on the given namespace.
     */
    calleeIsKnownNamespaceFunction(callee: Expression, namespaceName: string | undefined): boolean;
    /**
     * Get the token closest to the position. if no token is found, the previous token is returned
     */
    getClosestToken(position: Position): Token;
    /**
     * Builds a list of document symbols for this file. Used by LanguageServer's onDocumentSymbol functionality
     * @deprecated use `DocumentSymbolProvider.process()` instead
     */
    getDocumentSymbols(): import("vscode-languageserver-types").DocumentSymbol[];
    /**
     * Builds a list of workspace symbols for this file. Used by LanguageServer's onWorkspaceSymbol functionality
     */
    getWorkspaceSymbols(): import("vscode-languageserver-types").WorkspaceSymbol[];
    /**
     * Given a position in a file, if the position is sitting on some type of identifier,
     * go to the definition of that identifier (where this thing was first defined)
     * @deprecated use `DefinitionProvider.process()` instead
     */
    getDefinition(position: Position): Location[];
    getClassMemberDefinitions(textToSearchFor: string, file: BrsFile): Location[];
    getClassMethod(classStatement: ClassStatement, name: string, walkParents?: boolean): MethodStatement | undefined;
    /**
     * Given a position in a file, if the position is sitting on some type of identifier,
     * look up all references of that identifier (every place that identifier is used across the whole app)
     * @deprecated use `ReferencesProvider.process()` instead
     */
    getReferences(position: Position): Location[];
    /**
     * Convert the brightscript/brighterscript source code into valid brightscript
     */
    transpile(): CodeWithSourceMap;
    getTypedef(): string;
    dispose(): void;
}
/**
 * List of completions for all valid keywords/reserved words.
 * Build this list once because it won't change for the lifetime of this process
 */
export declare const KeywordCompletions: CompletionItem[];

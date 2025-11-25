import type { Token } from '../lexer/Token';
import { AssignmentStatement, Body, ClassStatement, ConstStatement, EnumStatement, FunctionStatement, ImportStatement, InterfaceStatement, LibraryStatement, NamespaceStatement } from './Statement';
import { AnnotationExpression, FunctionExpression, NewExpression } from './Expression';
import type { Diagnostic } from 'vscode-languageserver';
import type { Logger } from '../logging';
import type { Expression, Statement } from './AstNode';
import { SymbolTable } from '../SymbolTable';
export declare class Parser {
    /**
     * The array of tokens passed to `parse()`
     */
    tokens: Token[];
    /**
     * The current token index
     */
    current: number;
    /**
     * The list of statements for the parsed file
     */
    ast: Body;
    get statements(): Statement[];
    /**
     * The top-level symbol table for the body of this file.
     */
    get symbolTable(): SymbolTable;
    /**
     * References for significant statements/expressions in the parser.
     * These are initially extracted during parse-time to improve performance, but will also be dynamically regenerated if need be.
     *
     * If a plugin modifies the AST, then the plugin should call Parser#invalidateReferences() to force this object to refresh
     */
    get references(): References;
    private _references;
    /**
     * Invalidates (clears) the references collection. This should be called anytime the AST has been manipulated.
     */
    invalidateReferences(): void;
    private addPropertyHints;
    /**
     * The list of diagnostics found during the parse process
     */
    diagnostics: Diagnostic[];
    /**
     * The depth of the calls to function declarations. Helps some checks know if they are at the root or not.
     */
    private namespaceAndFunctionDepth;
    /**
     * The options used to parse the file
     */
    options: ParseOptions;
    private globalTerminators;
    /**
     * A list of identifiers that are permitted to be used as local variables. We store this in a property because we augment the list in the constructor
     * based on the parse mode
     */
    private allowedLocalIdentifiers;
    /**
     * Annotations collected which should be attached to the next statement
     */
    private pendingAnnotations;
    /**
     * Get the currently active global terminators
     */
    private peekGlobalTerminators;
    /**
     * Static wrapper around creating a new parser and parsing a list of tokens
     */
    static parse(toParse: Token[] | string, options?: ParseOptions): Parser;
    /**
     * Parses an array of `Token`s into an abstract syntax tree
     * @param toParse the array of tokens to parse. May not contain any whitespace tokens
     * @returns the same instance of the parser which contains the diagnostics and statements
     */
    parse(toParse: Token[] | string, options?: ParseOptions): this;
    private logger;
    private body;
    private sanitizeParseOptions;
    /**
     * Determine if the parser is currently parsing tokens at the root level.
     */
    private isAtRootLevel;
    /**
     * Throws an error if the input file type is not BrighterScript
     */
    private warnIfNotBrighterScriptMode;
    /**
     * Throws an exception using the last diagnostic message
     */
    private lastDiagnosticAsError;
    private declaration;
    /**
     * Try to get an identifier. If not found, add diagnostic and return undefined
     */
    private tryIdentifier;
    private identifier;
    private enumMemberStatement;
    /**
     * Create a new InterfaceMethodStatement. This should only be called from within `interfaceDeclaration`
     */
    private interfaceFieldStatement;
    /**
     * Create a new InterfaceMethodStatement. This should only be called from within `interfaceDeclaration()`
     */
    private interfaceMethodStatement;
    private interfaceDeclaration;
    private enumDeclaration;
    /**
     * A BrighterScript class declaration
     */
    private classDeclaration;
    private fieldDeclaration;
    /**
     * An array of CallExpression for the current function body
     */
    private callExpressions;
    private functionDeclaration;
    private functionParameter;
    private assignment;
    private checkLibrary;
    private checkAlias;
    private statement;
    private whileStatement;
    private exitWhile;
    private forStatement;
    private forEachStatement;
    private exitFor;
    private commentStatement;
    private namespaceStatement;
    /**
     * Get an expression with identifiers separated by periods. Useful for namespaces and class extends
     */
    private getNamespacedVariableNameExpression;
    /**
     * Add an 'unexpected token' diagnostic for any token found between current and the first stopToken found.
     */
    private flagUntil;
    /**
     * Consume tokens until one of the `stopTokenKinds` is encountered
     * @param stopTokenKinds a list of tokenKinds where any tokenKind in this list will result in a match
     * @returns - the list of tokens consumed, EXCLUDING the `stopTokenKind` (you can use `this.peek()` to see which one it was)
     */
    private consumeUntil;
    private constDeclaration;
    private libraryStatement;
    private importStatement;
    private typecastStatement;
    private aliasStatement;
    private annotationExpression;
    private ternaryExpression;
    private nullCoalescingExpression;
    private regexLiteralExpression;
    private templateString;
    private tryCatchStatement;
    private throwStatement;
    private dimStatement;
    private ifStatement;
    private blockConditionalBranch;
    private ensureNewLineOrColon;
    private ensureInline;
    private inlineConditionalBranch;
    private expressionStatement;
    private setStatement;
    private printStatement;
    /**
     * Parses a return statement with an optional return value.
     * @returns an AST representation of a return statement.
     */
    private returnStatement;
    /**
     * Parses a `label` statement
     * @returns an AST representation of an `label` statement.
     */
    private labelStatement;
    /**
     * Parses a `continue` statement
     */
    private continueStatement;
    /**
     * Parses a `goto` statement
     * @returns an AST representation of an `goto` statement.
     */
    private gotoStatement;
    /**
     * Parses an `end` statement
     * @returns an AST representation of an `end` statement.
     */
    private endStatement;
    /**
     * Parses a `stop` statement
     * @returns an AST representation of a `stop` statement
     */
    private stopStatement;
    /**
     * Parses a block, looking for a specific terminating TokenKind to denote completion.
     * Always looks for `end sub`/`end function` to handle unterminated blocks.
     * @param terminators the token(s) that signifies the end of this block; all other terminators are
     *                    ignored.
     */
    private block;
    /**
     * Attach pending annotations to the provided statement,
     * and then reset the annotations array
     */
    consumePendingAnnotations(statement: Statement): void;
    enterAnnotationBlock(): AnnotationExpression[];
    exitAnnotationBlock(parentAnnotations: AnnotationExpression[]): void;
    private expression;
    private anonymousFunction;
    private boolean;
    private relational;
    private addExpressionsToReferences;
    private additive;
    private multiplicative;
    private exponential;
    private prefixUnary;
    private indexedGet;
    private newExpression;
    /**
     * A callfunc expression (i.e. `node@.someFunctionOnNode()`)
     */
    private callfunc;
    private call;
    private finishCall;
    /**
     * Tries to get the next token as a type
     * Allows for built-in types (double, string, etc.) or namespaced custom types in Brighterscript mode
     * Will return a token of whatever is next to be parsed
     * Will allow v1 type syntax (typed arrays, union types), but there is no validation on types used this way
     */
    private typeToken;
    private primary;
    private arrayLiteral;
    private aaLiteral;
    /**
     * Pop token if we encounter specified token
     */
    private match;
    /**
     * Pop token if we encounter a token in the specified list
     * @param tokenKinds a list of tokenKinds where any tokenKind in this list will result in a match
     */
    private matchAny;
    /**
     * If the next series of tokens matches the given set of tokens, pop them all
     * @param tokenKinds a list of tokenKinds used to match the next set of tokens
     */
    private matchSequence;
    /**
     * Get next token matching a specified list, or fail with an error
     */
    private consume;
    /**
     * Consume next token IF it matches the specified kind. Otherwise, do nothing and return undefined
     */
    private consumeTokenIf;
    private consumeToken;
    /**
     * Consume, or add a message if not found. But then continue and return undefined
     */
    private tryConsume;
    private tryConsumeToken;
    private consumeStatementSeparators;
    private advance;
    private checkEndOfStatement;
    private checkPrevious;
    /**
     * Check that the next token kind is the expected kind
     * @param tokenKind the expected next kind
     * @returns true if the next tokenKind is the expected value
     */
    private check;
    private checkAny;
    private checkNext;
    private checkAnyNext;
    private isAtEnd;
    private peekNext;
    private peek;
    private previous;
    /**
     * Sometimes we catch an error that is a diagnostic.
     * If that's the case, we want to continue parsing.
     * Otherwise, re-throw the error
     *
     * @param error error caught in a try/catch
     */
    private rethrowNonDiagnosticError;
    /**
     * Get the token that is {offset} indexes away from {this.current}
     * @param offset the number of index steps away from current index to fetch
     * @param tokenKinds the desired token must match one of these
     * @example
     * getToken(-1); //returns the previous token.
     * getToken(0);  //returns current token.
     * getToken(1);  //returns next token
     */
    private getMatchingTokenAtOffset;
    private synchronize;
    /**
     * References are found during the initial parse.
     * However, sometimes plugins can modify the AST, requiring a full walk to re-compute all references.
     * This does that walk.
     */
    private findReferences;
    dispose(): void;
}
export declare enum ParseMode {
    BrightScript = "BrightScript",
    BrighterScript = "BrighterScript"
}
export interface ParseOptions {
    /**
     * The parse mode. When in 'BrightScript' mode, no BrighterScript syntax is allowed, and will emit diagnostics.
     */
    mode?: ParseMode;
    /**
     * A logger that should be used for logging. If omitted, a default logger is used
     */
    logger?: Logger;
    /**
     * Should locations be tracked. If false, the `range` property will be omitted
     * @default true
     */
    trackLocations?: boolean;
}
export declare class References {
    private cache;
    assignmentStatements: AssignmentStatement[];
    classStatements: ClassStatement[];
    get classStatementLookup(): Map<string, ClassStatement>;
    private _classStatementLookup;
    functionExpressions: FunctionExpression[];
    functionStatements: FunctionStatement[];
    /**
     * A map of function statements, indexed by fully-namespaced lower function name.
     */
    get functionStatementLookup(): Map<string, FunctionStatement>;
    private _functionStatementLookup;
    interfaceStatements: InterfaceStatement[];
    get interfaceStatementLookup(): Map<string, InterfaceStatement>;
    private _interfaceStatementLookup;
    enumStatements: EnumStatement[];
    get enumStatementLookup(): Map<string, EnumStatement>;
    constStatements: ConstStatement[];
    get constStatementLookup(): Map<string, ConstStatement>;
    /**
     * A collection of full expressions. This excludes intermediary expressions.
     *
     * Example 1:
     * `a.b.c` is composed of `a` (variableExpression)  `.b` (DottedGetExpression) `.c` (DottedGetExpression)
     * This will only contain the final `.c` DottedGetExpression because `.b` and `a` can both be derived by walking back from the `.c` DottedGetExpression.
     *
     * Example 2:
     * `name.space.doSomething(a.b.c)` will result in 2 entries in this list. the `CallExpression` for `doSomething`, and the `.c` DottedGetExpression.
     *
     * Example 3:
     * `value = SomeEnum.value > 2 or SomeEnum.otherValue < 10` will result in 4 entries. `SomeEnum.value`, `2`, `SomeEnum.otherValue`, `10`
     */
    expressions: Set<Expression>;
    importStatements: ImportStatement[];
    libraryStatements: LibraryStatement[];
    namespaceStatements: NamespaceStatement[];
    newExpressions: NewExpression[];
    propertyHints: Record<string, string>;
}

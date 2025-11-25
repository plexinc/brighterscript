import type { Token, Identifier } from '../lexer/Token';
import { TokenKind } from '../lexer/TokenKind';
import type { NamespacedVariableNameExpression, FunctionParameterExpression } from './Expression';
import { FunctionExpression } from './Expression';
import type { Range } from 'vscode-languageserver';
import type { BrsTranspileState } from './BrsTranspileState';
import { ParseMode } from './Parser';
import type { WalkVisitor, WalkOptions } from '../astUtils/visitors';
import type { TranspileResult, TypedefProvider } from '../interfaces';
import type { BscType } from '../types/BscType';
import type { TranspileState } from './TranspileState';
import { SymbolTable } from '../SymbolTable';
import type { Expression } from './AstNode';
import { Statement } from './AstNode';
export declare class EmptyStatement extends Statement {
    /**
     * Create a negative range to indicate this is an interpolated location
     */
    range: Range;
    constructor(
    /**
     * Create a negative range to indicate this is an interpolated location
     */
    range?: Range);
    transpile(state: BrsTranspileState): any[];
    walk(visitor: WalkVisitor, options: WalkOptions): void;
    clone(): EmptyStatement;
}
/**
 * This is a top-level statement. Consider this the root of the AST
 */
export declare class Body extends Statement implements TypedefProvider {
    statements: Statement[];
    constructor(statements?: Statement[]);
    symbolTable: SymbolTable;
    get range(): Range;
    transpile(state: BrsTranspileState): TranspileResult;
    getTypedef(state: BrsTranspileState): TranspileResult;
    walk(visitor: WalkVisitor, options: WalkOptions): void;
    clone(): Body;
}
export declare class AssignmentStatement extends Statement {
    readonly equals: Token;
    readonly name: Identifier;
    readonly value: Expression;
    constructor(equals: Token, name: Identifier, value: Expression);
    readonly range: Range | undefined;
    /**
     * Get the name of the wrapping namespace (if it exists)
     * @deprecated use `.findAncestor(isFunctionExpression)` instead.
     */
    get containingFunction(): FunctionExpression;
    transpile(state: BrsTranspileState): TranspileResult;
    walk(visitor: WalkVisitor, options: WalkOptions): void;
    clone(): AssignmentStatement;
}
export declare class Block extends Statement {
    readonly statements: Statement[];
    readonly startingRange?: Range;
    constructor(statements: Statement[], startingRange?: Range);
    readonly range: Range | undefined;
    transpile(state: BrsTranspileState): TranspileResult;
    walk(visitor: WalkVisitor, options: WalkOptions): void;
    clone(): Block;
}
export declare class ExpressionStatement extends Statement {
    readonly expression: Expression;
    constructor(expression: Expression);
    readonly range: Range | undefined;
    transpile(state: BrsTranspileState): TranspileResult;
    walk(visitor: WalkVisitor, options: WalkOptions): void;
    clone(): ExpressionStatement;
}
export declare class CommentStatement extends Statement implements Expression, TypedefProvider {
    comments: Token[];
    constructor(comments: Token[]);
    range: Range | undefined;
    get text(): string;
    transpile(state: BrsTranspileState): TranspileResult;
    getTypedef(state: TranspileState): TranspileResult;
    walk(visitor: WalkVisitor, options: WalkOptions): void;
    clone(): CommentStatement;
}
export declare class ExitForStatement extends Statement {
    readonly tokens: {
        exitFor: Token;
    };
    constructor(tokens: {
        exitFor: Token;
    });
    readonly range: Range;
    transpile(state: BrsTranspileState): (string | import("source-map").SourceNode)[];
    walk(visitor: WalkVisitor, options: WalkOptions): void;
    clone(): ExitForStatement;
}
export declare class ExitWhileStatement extends Statement {
    readonly tokens: {
        exitWhile: Token;
    };
    constructor(tokens: {
        exitWhile: Token;
    });
    readonly range: Range;
    transpile(state: BrsTranspileState): (string | import("source-map").SourceNode)[];
    walk(visitor: WalkVisitor, options: WalkOptions): void;
    clone(): ExitWhileStatement;
}
export declare class FunctionStatement extends Statement implements TypedefProvider {
    name: Identifier;
    func: FunctionExpression;
    constructor(name: Identifier, func: FunctionExpression);
    readonly range: Range | undefined;
    /**
     * Get the name of this expression based on the parse mode
     */
    getName(parseMode: ParseMode): string;
    /**
     * Get the name of the wrapping namespace (if it exists)
     * @deprecated use `.findAncestor(isNamespaceStatement)` instead.
     */
    get namespaceName(): NamespacedVariableNameExpression;
    transpile(state: BrsTranspileState): TranspileResult;
    getTypedef(state: BrsTranspileState): TranspileResult;
    walk(visitor: WalkVisitor, options: WalkOptions): void;
    clone(): FunctionStatement;
}
export declare class IfStatement extends Statement {
    readonly tokens: {
        if: Token;
        then?: Token;
        else?: Token;
        endIf?: Token;
    };
    readonly condition: Expression;
    readonly thenBranch: Block;
    readonly elseBranch?: IfStatement | Block;
    readonly isInline?: boolean;
    constructor(tokens: {
        if: Token;
        then?: Token;
        else?: Token;
        endIf?: Token;
    }, condition: Expression, thenBranch: Block, elseBranch?: IfStatement | Block, isInline?: boolean);
    readonly range: Range | undefined;
    transpile(state: BrsTranspileState): TranspileResult;
    walk(visitor: WalkVisitor, options: WalkOptions): void;
    clone(): any;
}
export declare class IncrementStatement extends Statement {
    readonly value: Expression;
    readonly operator: Token;
    constructor(value: Expression, operator: Token);
    readonly range: Range | undefined;
    transpile(state: BrsTranspileState): (string | import("source-map").SourceNode | TranspileResult)[];
    walk(visitor: WalkVisitor, options: WalkOptions): void;
    clone(): IncrementStatement;
}
/** Used to indent the current `print` position to the next 16-character-width output zone. */
export interface PrintSeparatorTab extends Token {
    kind: TokenKind.Comma;
}
/** Used to insert a single whitespace character at the current `print` position. */
export interface PrintSeparatorSpace extends Token {
    kind: TokenKind.Semicolon;
}
/**
 * Represents a `print` statement within BrightScript.
 */
export declare class PrintStatement extends Statement {
    readonly tokens: {
        print: Token;
    };
    readonly expressions: Array<Expression | PrintSeparatorTab | PrintSeparatorSpace>;
    /**
     * Creates a new internal representation of a BrightScript `print` statement.
     * @param tokens the tokens for this statement
     * @param tokens.print a print token
     * @param expressions an array of expressions or `PrintSeparator`s to be evaluated and printed.
     */
    constructor(tokens: {
        print: Token;
    }, expressions: Array<Expression | PrintSeparatorTab | PrintSeparatorSpace>);
    readonly range: Range | undefined;
    transpile(state: BrsTranspileState): TranspileResult;
    walk(visitor: WalkVisitor, options: WalkOptions): void;
    clone(): PrintStatement;
}
export declare class DimStatement extends Statement {
    dimToken: Token;
    identifier?: Identifier;
    openingSquare?: Token;
    dimensions?: Expression[];
    closingSquare?: Token;
    constructor(dimToken: Token, identifier?: Identifier, openingSquare?: Token, dimensions?: Expression[], closingSquare?: Token);
    range: Range | undefined;
    transpile(state: BrsTranspileState): TranspileResult;
    walk(visitor: WalkVisitor, options: WalkOptions): void;
    clone(): DimStatement;
}
export declare class GotoStatement extends Statement {
    readonly tokens: {
        goto: Token;
        label: Token;
    };
    constructor(tokens: {
        goto: Token;
        label: Token;
    });
    readonly range: Range | undefined;
    transpile(state: BrsTranspileState): (string | import("source-map").SourceNode)[];
    walk(visitor: WalkVisitor, options: WalkOptions): void;
    clone(): GotoStatement;
}
export declare class LabelStatement extends Statement {
    readonly tokens: {
        identifier: Token;
        colon: Token;
    };
    constructor(tokens: {
        identifier: Token;
        colon: Token;
    });
    readonly range: Range | undefined;
    transpile(state: BrsTranspileState): (string | import("source-map").SourceNode)[];
    walk(visitor: WalkVisitor, options: WalkOptions): void;
    clone(): LabelStatement;
}
export declare class ReturnStatement extends Statement {
    readonly tokens: {
        return: Token;
    };
    readonly value?: Expression;
    constructor(tokens: {
        return: Token;
    }, value?: Expression);
    readonly range: Range | undefined;
    transpile(state: BrsTranspileState): TranspileResult;
    walk(visitor: WalkVisitor, options: WalkOptions): void;
    clone(): ReturnStatement;
}
export declare class EndStatement extends Statement {
    readonly tokens: {
        end: Token;
    };
    constructor(tokens: {
        end: Token;
    });
    readonly range: Range;
    transpile(state: BrsTranspileState): (string | import("source-map").SourceNode)[];
    walk(visitor: WalkVisitor, options: WalkOptions): void;
    clone(): EndStatement;
}
export declare class StopStatement extends Statement {
    readonly tokens: {
        stop: Token;
    };
    constructor(tokens: {
        stop: Token;
    });
    readonly range: Range;
    transpile(state: BrsTranspileState): (string | import("source-map").SourceNode)[];
    walk(visitor: WalkVisitor, options: WalkOptions): void;
    clone(): StopStatement;
}
export declare class ForStatement extends Statement {
    forToken: Token;
    counterDeclaration: AssignmentStatement;
    toToken: Token;
    finalValue: Expression;
    body: Block;
    endForToken: Token;
    stepToken?: Token;
    increment?: Expression;
    constructor(forToken: Token, counterDeclaration: AssignmentStatement, toToken: Token, finalValue: Expression, body: Block, endForToken: Token, stepToken?: Token, increment?: Expression);
    readonly range: Range | undefined;
    transpile(state: BrsTranspileState): TranspileResult;
    walk(visitor: WalkVisitor, options: WalkOptions): void;
    clone(): ForStatement;
}
export declare class ForEachStatement extends Statement {
    readonly tokens: {
        forEach: Token;
        in: Token;
        endFor: Token;
    };
    readonly item: Token;
    readonly target: Expression;
    readonly body: Block;
    constructor(tokens: {
        forEach: Token;
        in: Token;
        endFor: Token;
    }, item: Token, target: Expression, body: Block);
    readonly range: Range | undefined;
    transpile(state: BrsTranspileState): TranspileResult;
    walk(visitor: WalkVisitor, options: WalkOptions): void;
    clone(): ForEachStatement;
}
export declare class WhileStatement extends Statement {
    readonly tokens: {
        while: Token;
        endWhile: Token;
    };
    readonly condition: Expression;
    readonly body: Block;
    constructor(tokens: {
        while: Token;
        endWhile: Token;
    }, condition: Expression, body: Block);
    readonly range: Range | undefined;
    transpile(state: BrsTranspileState): TranspileResult;
    walk(visitor: WalkVisitor, options: WalkOptions): void;
    clone(): WhileStatement;
}
export declare class DottedSetStatement extends Statement {
    readonly obj: Expression;
    readonly name: Identifier;
    readonly value: Expression;
    readonly dot?: Token;
    readonly equals?: Token;
    constructor(obj: Expression, name: Identifier, value: Expression, dot?: Token, equals?: Token);
    readonly range: Range | undefined;
    transpile(state: BrsTranspileState): TranspileResult;
    walk(visitor: WalkVisitor, options: WalkOptions): void;
    clone(): DottedSetStatement;
}
export declare class IndexedSetStatement extends Statement {
    readonly obj: Expression;
    readonly index: Expression;
    readonly value: Expression;
    readonly openingSquare: Token;
    readonly closingSquare: Token;
    readonly additionalIndexes?: Expression[];
    readonly equals?: Token;
    constructor(obj: Expression, index: Expression, value: Expression, openingSquare: Token, closingSquare: Token, additionalIndexes?: Expression[], equals?: Token);
    readonly range: Range | undefined;
    transpile(state: BrsTranspileState): any[];
    walk(visitor: WalkVisitor, options: WalkOptions): void;
    clone(): IndexedSetStatement;
}
export declare class LibraryStatement extends Statement implements TypedefProvider {
    readonly tokens: {
        library: Token;
        filePath: Token | undefined;
    };
    constructor(tokens: {
        library: Token;
        filePath: Token | undefined;
    });
    readonly range: Range | undefined;
    transpile(state: BrsTranspileState): TranspileResult;
    getTypedef(state: BrsTranspileState): TranspileResult;
    walk(visitor: WalkVisitor, options: WalkOptions): void;
    clone(): LibraryStatement;
}
export declare class NamespaceStatement extends Statement implements TypedefProvider {
    keyword: Token;
    nameExpression: NamespacedVariableNameExpression;
    body: Body;
    endKeyword: Token;
    constructor(keyword: Token, nameExpression: NamespacedVariableNameExpression, body: Body, endKeyword: Token);
    /**
     * The string name for this namespace
     */
    get name(): string;
    get range(): Range;
    private _range;
    cacheRange(): Range;
    getName(parseMode: ParseMode): string;
    transpile(state: BrsTranspileState): TranspileResult;
    getTypedef(state: BrsTranspileState): TranspileResult;
    walk(visitor: WalkVisitor, options: WalkOptions): void;
    clone(): NamespaceStatement;
}
export declare class ImportStatement extends Statement implements TypedefProvider {
    readonly importToken: Token;
    readonly filePathToken: Token | undefined;
    constructor(importToken: Token, filePathToken: Token | undefined);
    filePath: string | undefined;
    range: Range | undefined;
    transpile(state: BrsTranspileState): (string | import("source-map").SourceNode)[];
    /**
     * Get the typedef for this statement
     */
    getTypedef(state: BrsTranspileState): string[];
    walk(visitor: WalkVisitor, options: WalkOptions): void;
    clone(): ImportStatement;
}
export declare class InterfaceStatement extends Statement implements TypedefProvider {
    parentInterfaceName: NamespacedVariableNameExpression;
    body: Statement[];
    constructor(interfaceToken: Token, name: Identifier, extendsToken: Token, parentInterfaceName: NamespacedVariableNameExpression, body: Statement[], endInterfaceToken: Token);
    tokens: {
        interface: Token;
        name: Identifier;
        extends: Token;
        endInterface: Token;
    };
    range: Range | undefined;
    /**
     * Get the name of the wrapping namespace (if it exists)
     * @deprecated use `.findAncestor(isNamespaceStatement)` instead.
     */
    get namespaceName(): NamespacedVariableNameExpression;
    get fields(): Statement[];
    get methods(): Statement[];
    /**
     * The name of the interface WITH its leading namespace (if applicable)
     */
    get fullName(): string;
    /**
     * The name of the interface (without the namespace prefix)
     */
    get name(): string;
    /**
     * Get the name of this expression based on the parse mode
     */
    getName(parseMode: ParseMode): string;
    transpile(state: BrsTranspileState): TranspileResult;
    getTypedef(state: BrsTranspileState): TranspileResult;
    walk(visitor: WalkVisitor, options: WalkOptions): void;
    clone(): InterfaceStatement;
}
export declare class InterfaceFieldStatement extends Statement implements TypedefProvider {
    type: BscType;
    transpile(state: BrsTranspileState): TranspileResult;
    constructor(nameToken: Identifier, asToken: Token, typeToken: Token, type: BscType, optionalToken?: Token);
    range: Range | undefined;
    tokens: {
        optional?: Token;
        name: Identifier;
        as: Token;
        type: Token;
    };
    get name(): string;
    get isOptional(): boolean;
    walk(visitor: WalkVisitor, options: WalkOptions): void;
    getTypedef(state: BrsTranspileState): TranspileResult;
    clone(): InterfaceFieldStatement;
}
export declare class InterfaceMethodStatement extends Statement implements TypedefProvider {
    params: FunctionParameterExpression[];
    returnType?: BscType;
    transpile(state: BrsTranspileState): TranspileResult;
    constructor(functionTypeToken: Token, nameToken: Identifier, leftParen: Token, params: FunctionParameterExpression[], rightParen: Token, asToken?: Token, returnTypeToken?: Token, returnType?: BscType, optionalToken?: Token);
    get range(): Range;
    tokens: {
        optional?: Token;
        functionType: Token;
        name: Identifier;
        leftParen: Token;
        rightParen: Token;
        as: Token | undefined;
        returnType: Token | undefined;
    };
    get isOptional(): boolean;
    walk(visitor: WalkVisitor, options: WalkOptions): void;
    getTypedef(state: BrsTranspileState): TranspileResult;
    clone(): InterfaceMethodStatement;
}
export declare class ClassStatement extends Statement implements TypedefProvider {
    readonly classKeyword: Token;
    /**
     * The name of the class (without namespace prefix)
     */
    readonly name: Identifier;
    body: Statement[];
    readonly end: Token;
    readonly extendsKeyword?: Token;
    readonly parentClassName?: NamespacedVariableNameExpression;
    constructor(classKeyword: Token, 
    /**
     * The name of the class (without namespace prefix)
     */
    name: Identifier, body: Statement[], end: Token, extendsKeyword?: Token, parentClassName?: NamespacedVariableNameExpression);
    /**
     * Get the name of the wrapping namespace (if it exists)
     * @deprecated use `.findAncestor(isNamespaceStatement)` instead.
     */
    get namespaceName(): NamespacedVariableNameExpression;
    getName(parseMode: ParseMode): string;
    memberMap: Record<string, MemberStatement>;
    methods: MethodStatement[];
    fields: FieldStatement[];
    readonly range: Range | undefined;
    transpile(state: BrsTranspileState): TranspileResult;
    getTypedef(state: BrsTranspileState): TranspileResult;
    /**
     * Find the parent index for this class's parent.
     * For class inheritance, every class is given an index.
     * The base class is index 0, its child is index 1, and so on.
     */
    getParentClassIndex(state: BrsTranspileState): number;
    hasParentClass(): boolean;
    /**
     * Get all ancestor classes, in closest-to-furthest order (i.e. 0 is parent, 1 is grandparent, etc...).
     * This will return an empty array if no ancestors were found
     */
    getAncestors(state: BrsTranspileState): ClassStatement[];
    private getBuilderName;
    private getMethodIdentifier;
    /**
     * Get the constructor function for this class (if exists), or undefined if not exist
     */
    private getConstructorFunction;
    /**
     * Return the parameters for the first constructor function for this class
     * @param ancestors The list of ancestors for this class
     * @returns The parameters for the first constructor function for this class
     */
    private getConstructorParams;
    /**
     * Determine if the specified field was declared in one of the ancestor classes
     */
    isFieldDeclaredByAncestor(fieldName: string, ancestors: ClassStatement[]): boolean;
    /**
     * The builder is a function that assigns all of the methods and property names to a class instance.
     * This needs to be a separate function so that child classes can call the builder from their parent
     * without instantiating the parent constructor at that point in time.
     */
    private getTranspiledBuilder;
    /**
     * Returns a copy of the class' body, with the constructor function added if it doesn't exist.
     */
    private getTranspiledClassBody;
    /**
     * These are the methods that are defined in this class. They are transpiled outside of the class body
     * to ensure they don't appear as "$anon_#" in stack traces and crash logs.
     */
    private getTranspiledMethods;
    /**
     * The class function is the function with the same name as the class. This is the function that
     * consumers should call to create a new instance of that class.
     * This invokes the builder, gets an instance of the class, then invokes the "new" function on that class.
     */
    private getTranspiledClassFunction;
    walk(visitor: WalkVisitor, options: WalkOptions): void;
    clone(): ClassStatement;
}
export declare class MethodStatement extends FunctionStatement {
    override: Token;
    constructor(modifiers: Token | Token[], name: Identifier, func: FunctionExpression, override: Token);
    modifiers: Token[];
    get accessModifier(): Token;
    readonly range: Range | undefined;
    /**
     * Get the name of this method.
     */
    getName(parseMode: ParseMode): string;
    transpile(state: BrsTranspileState, name?: Identifier): TranspileResult;
    getTypedef(state: BrsTranspileState): TranspileResult;
    /**
     * All child classes must call the parent constructor. The type checker will warn users when they don't call it in their own class,
     * but we still need to call it even if they have omitted it. This injects the super call if it's missing
     */
    private ensureSuperConstructorCall;
    /**
     * Inject field initializers at the top of the `new` function (after any present `super()` call)
     */
    private injectFieldInitializersForConstructor;
    walk(visitor: WalkVisitor, options: WalkOptions): void;
    clone(): MethodStatement;
}
/**
 * @deprecated use `MethodStatement`
 */
export declare class ClassMethodStatement extends MethodStatement {
}
export declare class FieldStatement extends Statement implements TypedefProvider {
    readonly accessModifier?: Token;
    readonly name?: Identifier;
    readonly as?: Token;
    readonly type?: Token;
    readonly equal?: Token;
    readonly initialValue?: Expression;
    readonly optional?: Token;
    constructor(accessModifier?: Token, name?: Identifier, as?: Token, type?: Token, equal?: Token, initialValue?: Expression, optional?: Token);
    /**
     * Derive a ValueKind from the type token, or the initial value.
     * Defaults to `DynamicType`
     */
    getType(): BscType;
    readonly range: Range | undefined;
    get isOptional(): boolean;
    transpile(state: BrsTranspileState): TranspileResult;
    getTypedef(state: BrsTranspileState): TranspileResult;
    walk(visitor: WalkVisitor, options: WalkOptions): void;
    clone(): FieldStatement;
}
/**
 * @deprecated use `FieldStatement`
 */
export declare class ClassFieldStatement extends FieldStatement {
}
export declare type MemberStatement = FieldStatement | MethodStatement;
/**
 * @deprecated use `MemeberStatement`
 */
export declare type ClassMemberStatement = MemberStatement;
export declare class TryCatchStatement extends Statement {
    tokens: {
        try: Token;
        endTry?: Token;
    };
    tryBranch?: Block;
    catchStatement?: CatchStatement;
    constructor(tokens: {
        try: Token;
        endTry?: Token;
    }, tryBranch?: Block, catchStatement?: CatchStatement);
    readonly range: Range | undefined;
    transpile(state: BrsTranspileState): TranspileResult;
    walk(visitor: WalkVisitor, options: WalkOptions): void;
    clone(): TryCatchStatement;
}
export declare class CatchStatement extends Statement {
    tokens: {
        catch: Token;
    };
    exceptionVariable?: Identifier;
    catchBranch?: Block;
    constructor(tokens: {
        catch: Token;
    }, exceptionVariable?: Identifier, catchBranch?: Block);
    range: Range | undefined;
    transpile(state: BrsTranspileState): TranspileResult;
    walk(visitor: WalkVisitor, options: WalkOptions): void;
    clone(): CatchStatement;
}
export declare class ThrowStatement extends Statement {
    throwToken: Token;
    expression?: Expression;
    constructor(throwToken: Token, expression?: Expression);
    range: Range | undefined;
    transpile(state: BrsTranspileState): TranspileResult;
    walk(visitor: WalkVisitor, options: WalkOptions): void;
    clone(): ThrowStatement;
}
export declare class EnumStatement extends Statement implements TypedefProvider {
    tokens: {
        enum: Token;
        name: Identifier;
        endEnum: Token;
    };
    body: Array<EnumMemberStatement | CommentStatement>;
    constructor(tokens: {
        enum: Token;
        name: Identifier;
        endEnum: Token;
    }, body: Array<EnumMemberStatement | CommentStatement>);
    get range(): Range | undefined;
    /**
     * Get the name of the wrapping namespace (if it exists)
     * @deprecated use `.findAncestor(isNamespaceStatement)` instead.
     */
    get namespaceName(): NamespacedVariableNameExpression;
    getMembers(): EnumMemberStatement[];
    /**
     * Get a map of member names and their values.
     * All values are stored as their AST LiteralExpression representation (i.e. string enum values include the wrapping quotes)
     */
    getMemberValueMap(): Map<string, string>;
    getMemberValue(name: string): string;
    /**
     * The name of the enum (without the namespace prefix)
     */
    get name(): string;
    /**
     * The name of the enum WITH its leading namespace (if applicable)
     */
    get fullName(): string;
    transpile(state: BrsTranspileState): any[];
    getTypedef(state: BrsTranspileState): TranspileResult;
    walk(visitor: WalkVisitor, options: WalkOptions): void;
    clone(): EnumStatement;
}
export declare class EnumMemberStatement extends Statement implements TypedefProvider {
    tokens: {
        name: Identifier;
        equal?: Token;
    };
    value?: Expression;
    constructor(tokens: {
        name: Identifier;
        equal?: Token;
    }, value?: Expression);
    /**
     * The name of the member
     */
    get name(): string;
    get range(): Range;
    /**
     * Get the value of this enum. Requires that `.parent` is set
     */
    getValue(): string;
    transpile(state: BrsTranspileState): TranspileResult;
    getTypedef(state: BrsTranspileState): TranspileResult;
    walk(visitor: WalkVisitor, options: WalkOptions): void;
    clone(): EnumMemberStatement;
}
export declare class ConstStatement extends Statement implements TypedefProvider {
    tokens: {
        const: Token;
        name: Identifier;
        equals: Token;
    };
    value: Expression;
    constructor(tokens: {
        const: Token;
        name: Identifier;
        equals: Token;
    }, value: Expression);
    range: Range | undefined;
    get name(): string;
    /**
     * The name of the statement WITH its leading namespace (if applicable)
     */
    get fullName(): string;
    transpile(state: BrsTranspileState): TranspileResult;
    getTypedef(state: BrsTranspileState): TranspileResult;
    walk(visitor: WalkVisitor, options: WalkOptions): void;
    clone(): ConstStatement;
}
export declare class ContinueStatement extends Statement {
    tokens: {
        continue: Token;
        loopType: Token;
    };
    constructor(tokens: {
        continue: Token;
        loopType: Token;
    });
    range: Range | undefined;
    transpile(state: BrsTranspileState): (string | import("source-map").SourceNode)[];
    walk(visitor: WalkVisitor, options: WalkOptions): void;
    clone(): ContinueStatement;
}
export declare class TypecastStatement extends Statement {
    constructor(options: {
        typecast?: Token;
        obj: Token;
        as?: Token;
        type: Token;
    });
    readonly tokens: {
        readonly typecast?: Token;
        readonly obj: Token;
        readonly as?: Token;
        readonly type: Token;
    };
    readonly typecastExpression: Expression;
    readonly range: Range;
    transpile(state: BrsTranspileState): any[];
    walk(visitor: WalkVisitor, options: WalkOptions): void;
    clone(): TypecastStatement;
}
export declare class AliasStatement extends Statement {
    constructor(options: {
        alias?: Token;
        name: Token;
        equals?: Token;
        value: Token;
    });
    readonly tokens: {
        readonly alias?: Token;
        readonly name: Token;
        readonly equals?: Token;
        readonly value: Token;
    };
    readonly range: Range;
    transpile(state: BrsTranspileState): any[];
    walk(visitor: WalkVisitor, options: WalkOptions): void;
    clone(): AliasStatement;
}

import type { CancellationToken } from 'vscode-languageserver';
import type { Body, AssignmentStatement, Block, ExpressionStatement, CommentStatement, ExitForStatement, ExitWhileStatement, FunctionStatement, IfStatement, IncrementStatement, PrintStatement, GotoStatement, LabelStatement, ReturnStatement, EndStatement, StopStatement, ForStatement, ForEachStatement, WhileStatement, DottedSetStatement, IndexedSetStatement, LibraryStatement, NamespaceStatement, ImportStatement, ClassStatement, ClassMethodStatement, ClassFieldStatement, EnumStatement, EnumMemberStatement, DimStatement, TryCatchStatement, CatchStatement, ThrowStatement, InterfaceStatement, InterfaceFieldStatement, InterfaceMethodStatement, FieldStatement, MethodStatement, ConstStatement, ContinueStatement } from '../parser/Statement';
import type { AALiteralExpression, AAMemberExpression, AnnotationExpression, ArrayLiteralExpression, BinaryExpression, CallExpression, CallfuncExpression, DottedGetExpression, EscapedCharCodeLiteralExpression, FunctionExpression, FunctionParameterExpression, GroupingExpression, IndexedGetExpression, LiteralExpression, NamespacedVariableNameExpression, NewExpression, NullCoalescingExpression, RegexLiteralExpression, SourceLiteralExpression, TaggedTemplateStringExpression, TemplateStringExpression, TemplateStringQuasiExpression, TernaryExpression, UnaryExpression, VariableExpression, XmlAttributeGetExpression } from '../parser/Expression';
import type { AstEditor } from './AstEditor';
import type { Statement, Expression, AstNode } from '../parser/AstNode';
/**
 * Walks the statements of a block and descendent sub-blocks, and allow replacing statements
 */
export declare function walkStatements(statement: Statement, visitor: (statement: Statement, parent?: Statement, owner?: any, key?: any) => Statement | void, cancel?: CancellationToken): void;
export declare type WalkVisitor = <T = AstNode>(node: AstNode, parent?: AstNode, owner?: any, key?: any) => void | T;
/**
 * A helper function for Statement and Expression `walkAll` calls.
 * @returns a new AstNode if it was changed by returning from the visitor, or undefined if not
 */
export declare function walk<T>(owner: T, key: keyof T, visitor: WalkVisitor, options: WalkOptions, parent?: AstNode): AstNode | void;
/**
 * Helper for AST elements to walk arrays when visitors might change the array size (to delete/insert items).
 * @param array the array to walk
 * @param visitor the visitor function to call on match
 * @param options the walk optoins
 * @param parent the parent AstNode of each item in the array
 * @param filter a function used to filter items from the array. return true if that item should be walked
 */
export declare function walkArray<T extends AstNode = AstNode>(array: Array<T>, visitor: WalkVisitor, options: WalkOptions, parent?: AstNode, filter?: <T>(element: T) => boolean): void;
/**
 * Creates an optimized visitor function.
 * Conventional visitors will need to inspect each incoming Statement/Expression, leading to many if statements.
 * This function will compare the constructor of the Statement/Expression, and perform a SINGLE logical check
 * to know which function to call.
 */
export declare function createVisitor(visitor: {
    Body?: (statement: Body, parent?: Statement, owner?: any, key?: any) => Statement | void;
    AssignmentStatement?: (statement: AssignmentStatement, parent?: Statement, owner?: any, key?: any) => Statement | void;
    Block?: (statement: Block, parent?: Statement, owner?: any, key?: any) => Statement | void;
    ExpressionStatement?: (statement: ExpressionStatement, parent?: Statement, owner?: any, key?: any) => Statement | void;
    CommentStatement?: (statement: CommentStatement, parent?: Statement, owner?: any, key?: any) => Statement | void;
    ExitForStatement?: (statement: ExitForStatement, parent?: Statement, owner?: any, key?: any) => Statement | void;
    ExitWhileStatement?: (statement: ExitWhileStatement, parent?: Statement, owner?: any, key?: any) => Statement | void;
    FunctionStatement?: (statement: FunctionStatement, parent?: Statement, owner?: any, key?: any) => Statement | void;
    IfStatement?: (statement: IfStatement, parent?: Statement, owner?: any, key?: any) => Statement | void;
    IncrementStatement?: (statement: IncrementStatement, parent?: Statement, owner?: any, key?: any) => Statement | void;
    PrintStatement?: (statement: PrintStatement, parent?: Statement, owner?: any, key?: any) => Statement | void;
    DimStatement?: (statement: DimStatement, parent?: Statement, owner?: any, key?: any) => Statement | void;
    GotoStatement?: (statement: GotoStatement, parent?: Statement, owner?: any, key?: any) => Statement | void;
    LabelStatement?: (statement: LabelStatement, parent?: Statement, owner?: any, key?: any) => Statement | void;
    ReturnStatement?: (statement: ReturnStatement, parent?: Statement, owner?: any, key?: any) => Statement | void;
    EndStatement?: (statement: EndStatement, parent?: Statement, owner?: any, key?: any) => Statement | void;
    StopStatement?: (statement: StopStatement, parent?: Statement, owner?: any, key?: any) => Statement | void;
    ForStatement?: (statement: ForStatement, parent?: Statement, owner?: any, key?: any) => Statement | void;
    ForEachStatement?: (statement: ForEachStatement, parent?: Statement, owner?: any, key?: any) => Statement | void;
    WhileStatement?: (statement: WhileStatement, parent?: Statement, owner?: any, key?: any) => Statement | void;
    DottedSetStatement?: (statement: DottedSetStatement, parent?: Statement, owner?: any, key?: any) => Statement | void;
    IndexedSetStatement?: (statement: IndexedSetStatement, parent?: Statement, owner?: any, key?: any) => Statement | void;
    LibraryStatement?: (statement: LibraryStatement, parent?: Statement, owner?: any, key?: any) => Statement | void;
    NamespaceStatement?: (statement: NamespaceStatement, parent?: Statement, owner?: any, key?: any) => Statement | void;
    ImportStatement?: (statement: ImportStatement, parent?: Statement, owner?: any, key?: any) => Statement | void;
    InterfaceStatement?: (statement: InterfaceStatement, parent?: Statement, owner?: any, key?: any) => Statement | void;
    InterfaceFieldStatement?: (statement: InterfaceFieldStatement, parent?: Statement) => Statement | void;
    InterfaceMethodStatement?: (statement: InterfaceMethodStatement, parent?: Statement, owner?: any, key?: any) => Statement | void;
    ClassStatement?: (statement: ClassStatement, parent?: Statement, owner?: any, key?: any) => Statement | void;
    /**
     * @deprecated use `MethodStatement`
     */
    ClassMethodStatement?: (statement: ClassMethodStatement, parent?: Statement, owner?: any, key?: any) => Statement | void;
    /**
     * @deprecated use `FieldStatement`
     */
    ClassFieldStatement?: (statement: ClassFieldStatement, parent?: Statement, owner?: any, key?: any) => Statement | void;
    ContinueStatement?: (statement: ContinueStatement, parent?: Statement, owner?: any, key?: any) => Statement | void;
    MethodStatement?: (statement: MethodStatement, parent?: Statement, owner?: any, key?: any) => Statement | void;
    FieldStatement?: (statement: FieldStatement, parent?: Statement, owner?: any, key?: any) => Statement | void;
    TryCatchStatement?: (statement: TryCatchStatement, parent?: Statement, owner?: any, key?: any) => Statement | void;
    CatchStatement?: (statement: CatchStatement, parent?: Statement, owner?: any, key?: any) => Statement | void;
    ThrowStatement?: (statement: ThrowStatement, parent?: Statement, owner?: any, key?: any) => Statement | void;
    EnumStatement?: (statement: EnumStatement, parent?: Statement, owner?: any, key?: any) => Statement | void;
    EnumMemberStatement?: (statement: EnumMemberStatement, parent?: Statement, owner?: any, key?: any) => Statement | void;
    ConstStatement?: (statement: ConstStatement, parent?: Statement, owner?: any, key?: any) => Statement | void;
    BinaryExpression?: (expression: BinaryExpression, parent?: AstNode, owner?: any, key?: any) => Expression | void;
    CallExpression?: (expression: CallExpression, parent?: AstNode, owner?: any, key?: any) => Expression | void;
    FunctionExpression?: (expression: FunctionExpression, parent?: AstNode, owner?: any, key?: any) => Expression | void;
    FunctionParameterExpression?: (expression: FunctionParameterExpression, parent?: AstNode, owner?: any, key?: any) => Expression | void;
    NamespacedVariableNameExpression?: (expression: NamespacedVariableNameExpression, parent?: AstNode, owner?: any, key?: any) => Expression | void;
    DottedGetExpression?: (expression: DottedGetExpression, parent?: AstNode, owner?: any, key?: any) => Expression | void;
    XmlAttributeGetExpression?: (expression: XmlAttributeGetExpression, parent?: AstNode, owner?: any, key?: any) => Expression | void;
    IndexedGetExpression?: (expression: IndexedGetExpression, parent?: AstNode, owner?: any, key?: any) => Expression | void;
    GroupingExpression?: (expression: GroupingExpression, parent?: AstNode, owner?: any, key?: any) => Expression | void;
    LiteralExpression?: (expression: LiteralExpression, parent?: AstNode, owner?: any, key?: any) => Expression | void;
    EscapedCharCodeLiteralExpression?: (expression: EscapedCharCodeLiteralExpression, parent?: AstNode, owner?: any, key?: any) => Expression | void;
    ArrayLiteralExpression?: (expression: ArrayLiteralExpression, parent?: AstNode, owner?: any, key?: any) => Expression | void;
    AAMemberExpression?: (expression: AAMemberExpression, parent?: AstNode, owner?: any, key?: any) => Expression | void;
    AALiteralExpression?: (expression: AALiteralExpression, parent?: AstNode, owner?: any, key?: any) => Expression | void;
    UnaryExpression?: (expression: UnaryExpression, parent?: AstNode, owner?: any, key?: any) => Expression | void;
    VariableExpression?: (expression: VariableExpression, parent?: AstNode, owner?: any, key?: any) => Expression | void;
    SourceLiteralExpression?: (expression: SourceLiteralExpression, parent?: AstNode, owner?: any, key?: any) => Expression | void;
    NewExpression?: (expression: NewExpression, parent?: AstNode, owner?: any, key?: any) => Expression | void;
    CallfuncExpression?: (expression: CallfuncExpression, parent?: AstNode, owner?: any, key?: any) => Expression | void;
    TemplateStringQuasiExpression?: (expression: TemplateStringQuasiExpression, parent?: AstNode, owner?: any, key?: any) => Expression | void;
    TemplateStringExpression?: (expression: TemplateStringExpression, parent?: AstNode, owner?: any, key?: any) => Expression | void;
    TaggedTemplateStringExpression?: (expression: TaggedTemplateStringExpression, parent?: AstNode, owner?: any, key?: any) => Expression | void;
    AnnotationExpression?: (expression: AnnotationExpression, parent?: AstNode, owner?: any, key?: any) => Expression | void;
    TernaryExpression?: (expression: TernaryExpression, parent?: AstNode, owner?: any, key?: any) => Expression | void;
    NullCoalescingExpression?: (expression: NullCoalescingExpression, parent?: AstNode, owner?: any, key?: any) => Expression | void;
    RegexLiteralExpression?: (expression: RegexLiteralExpression, parent?: AstNode, owner?: any, key?: any) => Expression | void;
}): WalkVisitor;
export interface WalkOptions {
    /**
     * What mode should the walker walk?
     * You can use the unique enums, or apply bitwise and to combine the various modes you're interested in
     */
    walkMode: WalkMode;
    /**
     * A token that can be used to cancel the walk operation
     */
    cancel?: CancellationToken;
    /**
     * If provided, any AST replacements will be done using this AstEditor instead of directly against the AST itself
     */
    editor?: AstEditor;
}
/**
 * An enum used to denote the specific WalkMode options (without
 */
export declare enum InternalWalkMode {
    /**
     * Walk statements
     */
    walkStatements = 1,
    /**
     * Call the visitor for every statement encountered by a walker
     */
    visitStatements = 2,
    /**
     * Walk expressions.
     */
    walkExpressions = 4,
    /**
     * Call the visitor for every expression encountered by a walker
     */
    visitExpressions = 8,
    /**
     * If child function expressions are encountered, this will allow the walker to step into them.
     */
    recurseChildFunctions = 16
}
export declare enum WalkMode {
    /**
     * Walk statements, but does NOT step into child functions
     */
    walkStatements = 1,
    /**
     * Walk and visit statements, but does NOT step into child functions
     */
    visitStatements = 3,
    /**
     * Walk expressions, but does NOT step into child functions
     */
    walkExpressions = 4,
    /**
     * Walk and visit expressions of the statement, but doesn't walk child statements
     */
    visitLocalExpressions = 12,
    /**
     * Walk and visit expressions, but does NOT step into child functions
     */
    visitExpressions = 13,
    /**
     * Visit all descendent statements and expressions, but does NOT step into child functions
     */
    visitAll = 15,
    /**
     * If child function expressions are encountered, this will allow the walker to step into them.
     * This includes `WalkMode.walkExpressions`
     */
    recurseChildFunctions = 20,
    /**
     * Visit all descendent statements, and DOES step into child functions
     */
    visitStatementsRecursive = 23,
    /**
     * Visit all descendent expressions, and DOES step into child functions
     */
    visitExpressionsRecursive = 29,
    /**
     * Visit all descendent statements and expressions, and DOES step into child functions
     */
    visitAllRecursive = 31
}

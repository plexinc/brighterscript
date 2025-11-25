import type { Body, AssignmentStatement, Block, ExpressionStatement, CommentStatement, ExitForStatement, ExitWhileStatement, FunctionStatement, IfStatement, IncrementStatement, PrintStatement, GotoStatement, LabelStatement, ReturnStatement, EndStatement, StopStatement, ForStatement, ForEachStatement, WhileStatement, DottedSetStatement, IndexedSetStatement, LibraryStatement, NamespaceStatement, ImportStatement, ClassFieldStatement, ClassMethodStatement, ClassStatement, InterfaceFieldStatement, InterfaceMethodStatement, InterfaceStatement, EnumStatement, EnumMemberStatement, TryCatchStatement, CatchStatement, ThrowStatement, MethodStatement, FieldStatement, ConstStatement, ContinueStatement, DimStatement, TypecastStatement, AliasStatement } from '../parser/Statement';
import type { LiteralExpression, BinaryExpression, CallExpression, FunctionExpression, NamespacedVariableNameExpression, DottedGetExpression, XmlAttributeGetExpression, IndexedGetExpression, GroupingExpression, EscapedCharCodeLiteralExpression, ArrayLiteralExpression, AALiteralExpression, UnaryExpression, VariableExpression, SourceLiteralExpression, NewExpression, CallfuncExpression, TemplateStringQuasiExpression, TemplateStringExpression, TaggedTemplateStringExpression, AnnotationExpression, FunctionParameterExpression, AAMemberExpression, TypeCastExpression, TernaryExpression, NullCoalescingExpression } from '../parser/Expression';
import type { BrsFile } from '../files/BrsFile';
import type { XmlFile } from '../files/XmlFile';
import type { BscFile, File, TypedefProvider } from '../interfaces';
import { InvalidType } from '../types/InvalidType';
import { VoidType } from '../types/VoidType';
import { FunctionType } from '../types/FunctionType';
import { StringType } from '../types/StringType';
import { BooleanType } from '../types/BooleanType';
import { IntegerType } from '../types/IntegerType';
import { LongIntegerType } from '../types/LongIntegerType';
import { FloatType } from '../types/FloatType';
import { DoubleType } from '../types/DoubleType';
import { CustomType } from '../types/CustomType';
import type { Scope } from '../Scope';
import type { XmlScope } from '../XmlScope';
import { DynamicType } from '../types/DynamicType';
import type { InterfaceType } from '../types/InterfaceType';
import type { ObjectType } from '../types/ObjectType';
import type { AstNode, Expression, Statement } from '../parser/AstNode';
export declare function isBrsFile(file: BscFile | File | undefined): file is BrsFile;
export declare function isXmlFile(file: BscFile | undefined): file is XmlFile;
export declare function isXmlScope(scope: Scope | undefined): scope is XmlScope;
/**
 * Determine if the variable is a descendent of the Statement base class.
 * Due to performance restrictions, this expects all statements to
 * directly extend Statement or FunctionStatement,
 * so it only checks the immediate parent's class name.
 */
export declare function isStatement(element: AstNode | undefined): element is Statement;
export declare function isBody(element: AstNode | undefined): element is Body;
export declare function isAssignmentStatement(element: AstNode | undefined): element is AssignmentStatement;
export declare function isBlock(element: AstNode | undefined): element is Block;
export declare function isExpressionStatement(element: AstNode | undefined): element is ExpressionStatement;
export declare function isCommentStatement(element: AstNode | undefined): element is CommentStatement;
export declare function isExitForStatement(element: AstNode | undefined): element is ExitForStatement;
export declare function isExitWhileStatement(element: AstNode | undefined): element is ExitWhileStatement;
export declare function isFunctionStatement(element: AstNode | undefined): element is FunctionStatement;
export declare function isIfStatement(element: AstNode | undefined): element is IfStatement;
export declare function isIncrementStatement(element: AstNode | undefined): element is IncrementStatement;
export declare function isPrintStatement(element: AstNode | undefined): element is PrintStatement;
export declare function isGotoStatement(element: AstNode | undefined): element is GotoStatement;
export declare function isLabelStatement(element: AstNode | undefined): element is LabelStatement;
export declare function isReturnStatement(element: AstNode | undefined): element is ReturnStatement;
export declare function isTernaryExpression(element: AstNode | undefined): element is TernaryExpression;
export declare function isNullCoalescingExpression(element: AstNode | undefined): element is NullCoalescingExpression;
export declare function isEndStatement(element: AstNode | undefined): element is EndStatement;
export declare function isStopStatement(element: AstNode | undefined): element is StopStatement;
export declare function isForStatement(element: AstNode | undefined): element is ForStatement;
export declare function isForEachStatement(element: AstNode | undefined): element is ForEachStatement;
export declare function isWhileStatement(element: AstNode | undefined): element is WhileStatement;
export declare function isDimStatement(element: AstNode | undefined): element is DimStatement;
export declare function isDottedSetStatement(element: AstNode | undefined): element is DottedSetStatement;
export declare function isIndexedSetStatement(element: AstNode | undefined): element is IndexedSetStatement;
export declare function isLibraryStatement(element: AstNode | undefined): element is LibraryStatement;
export declare function isNamespaceStatement(element: AstNode | undefined): element is NamespaceStatement;
export declare function isClassStatement(element: AstNode | undefined): element is ClassStatement;
export declare function isImportStatement(element: AstNode | undefined): element is ImportStatement;
export declare function isMethodStatement(element: AstNode | undefined): element is MethodStatement;
/**
 * @deprecated use `isMethodStatement`
 */
export declare function isClassMethodStatement(element: AstNode | undefined): element is ClassMethodStatement;
export declare function isFieldStatement(element: AstNode | undefined): element is FieldStatement;
/**
 * @deprecated use `isFieldStatement`
 */
export declare function isClassFieldStatement(element: AstNode | undefined): element is ClassFieldStatement;
export declare function isInterfaceStatement(element: AstNode | undefined): element is InterfaceStatement;
export declare function isInterfaceMethodStatement(element: AstNode | undefined): element is InterfaceMethodStatement;
export declare function isInterfaceFieldStatement(element: AstNode | undefined): element is InterfaceFieldStatement;
export declare function isEnumStatement(element: AstNode | undefined): element is EnumStatement;
export declare function isEnumMemberStatement(element: AstNode | undefined): element is EnumMemberStatement;
export declare function isConstStatement(element: AstNode | undefined): element is ConstStatement;
export declare function isContinueStatement(element: AstNode | undefined): element is ContinueStatement;
export declare function isTryCatchStatement(element: AstNode | undefined): element is TryCatchStatement;
export declare function isCatchStatement(element: AstNode | undefined): element is CatchStatement;
export declare function isThrowStatement(element: AstNode | undefined): element is ThrowStatement;
export declare function isTypecastStatement(element: AstNode | undefined): element is TypecastStatement;
export declare function isAliasStatement(element: AstNode | undefined): element is AliasStatement;
/**
 * Determine if the variable is a descendent of the Expression base class.
 * Due to performance restrictions, this expects all statements to directly extend Expression,
 * so it only checks the immediate parent's class name. For example:
 * this will work for StringLiteralExpression -> Expression,
 * but will not work CustomStringLiteralExpression -> StringLiteralExpression -> Expression
 */
export declare function isExpression(element: AstNode | undefined): element is Expression;
export declare function isBinaryExpression(element: AstNode | undefined): element is BinaryExpression;
export declare function isCallExpression(element: AstNode | undefined): element is CallExpression;
export declare function isFunctionExpression(element: AstNode | undefined): element is FunctionExpression;
export declare function isNamespacedVariableNameExpression(element: AstNode | undefined): element is NamespacedVariableNameExpression;
export declare function isDottedGetExpression(element: AstNode | undefined): element is DottedGetExpression;
export declare function isXmlAttributeGetExpression(element: AstNode | undefined): element is XmlAttributeGetExpression;
export declare function isIndexedGetExpression(element: AstNode | undefined): element is IndexedGetExpression;
export declare function isGroupingExpression(element: AstNode | undefined): element is GroupingExpression;
export declare function isLiteralExpression(element: AstNode | undefined): element is LiteralExpression;
export declare function isEscapedCharCodeLiteralExpression(element: AstNode | undefined): element is EscapedCharCodeLiteralExpression;
export declare function isArrayLiteralExpression(element: AstNode | undefined): element is ArrayLiteralExpression;
export declare function isAALiteralExpression(element: AstNode | undefined): element is AALiteralExpression;
export declare function isAAMemberExpression(element: AstNode | undefined): element is AAMemberExpression;
export declare function isUnaryExpression(element: AstNode | undefined): element is UnaryExpression;
export declare function isVariableExpression(element: AstNode | undefined): element is VariableExpression;
export declare function isSourceLiteralExpression(element: AstNode | undefined): element is SourceLiteralExpression;
export declare function isNewExpression(element: AstNode | undefined): element is NewExpression;
export declare function isCallfuncExpression(element: AstNode | undefined): element is CallfuncExpression;
export declare function isTemplateStringQuasiExpression(element: AstNode | undefined): element is TemplateStringQuasiExpression;
export declare function isTemplateStringExpression(element: AstNode | undefined): element is TemplateStringExpression;
export declare function isTaggedTemplateStringExpression(element: AstNode | undefined): element is TaggedTemplateStringExpression;
export declare function isFunctionParameterExpression(element: AstNode | undefined): element is FunctionParameterExpression;
export declare function isAnnotationExpression(element: AstNode | undefined): element is AnnotationExpression;
export declare function isTypedefProvider(element: any): element is TypedefProvider;
export declare function isTypeCastExpression(element: any): element is TypeCastExpression;
export declare function isStringType(value: any): value is StringType;
export declare function isFunctionType(e: any): e is FunctionType;
export declare function isBooleanType(e: any): e is BooleanType;
export declare function isIntegerType(e: any): e is IntegerType;
export declare function isLongIntegerType(e: any): e is LongIntegerType;
export declare function isFloatType(e: any): e is FloatType;
export declare function isDoubleType(e: any): e is DoubleType;
export declare function isInvalidType(e: any): e is InvalidType;
export declare function isVoidType(e: any): e is VoidType;
export declare function isCustomType(e: any): e is CustomType;
export declare function isDynamicType(e: any): e is DynamicType;
export declare function isInterfaceType(e: any): e is InterfaceType;
export declare function isObjectType(e: any): e is ObjectType;
export declare function isNumberType(e: any): e is IntegerType | LongIntegerType | FloatType | DoubleType;
export declare function isLiteralInvalid(e: any): e is LiteralExpression & {
    type: InvalidType;
};
export declare function isLiteralBoolean(e: any): e is LiteralExpression & {
    type: BooleanType;
};
export declare function isLiteralString(e: any): e is LiteralExpression & {
    type: StringType;
};
export declare function isLiteralNumber(e: any): e is LiteralExpression & {
    type: IntegerType | LongIntegerType | FloatType | DoubleType;
};

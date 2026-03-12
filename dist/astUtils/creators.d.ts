import type { Range } from 'vscode-languageserver';
import type { Identifier, Token } from '../lexer/Token';
import { TokenKind } from '../lexer/TokenKind';
import type { Expression, Statement } from '../parser/AstNode';
import { LiteralExpression, CallExpression, DottedGetExpression, VariableExpression, FunctionExpression } from '../parser/Expression';
import type { SGAttribute } from '../parser/SGTypes';
import { AssignmentStatement, Block, DottedSetStatement, IfStatement, IndexedSetStatement, MethodStatement } from '../parser/Statement';
/**
 * A range that points to the beginning of the file. Used to give non-null ranges to programmatically-added source code.
 * (Hardcoded range to prevent circular dependency issue in `../util.ts`)
 * @deprecated don't use this, it screws up sourcemaps. Just set range to null
 */
export declare const interpolatedRange: Range;
export declare function createToken<T extends TokenKind>(kind: T, text?: string, range?: Range): Token & {
    kind: T;
};
export declare function createIdentifier(name: string, range?: Range): Identifier;
export declare function createVariableExpression(ident: string, range?: Range): VariableExpression;
export declare function createDottedIdentifier(path: string[], range?: Range): DottedGetExpression;
/**
 * Create a StringLiteralExpression. The TokenKind.StringLiteral token value includes the leading and trailing doublequote during lexing.
 * Since brightscript doesn't support strings with quotes in them, we can safely auto-detect and wrap the value in quotes in this function.
 * @param value - the string value. (value will be wrapped in quotes if they are missing)
 */
export declare function createStringLiteral(value: string, range?: Range): LiteralExpression;
export declare function createIntegerLiteral(value: string, range?: Range): LiteralExpression;
export declare function createFloatLiteral(value: string, range?: Range): LiteralExpression;
export declare function createInvalidLiteral(value?: string, range?: Range): LiteralExpression;
export declare function createBooleanLiteral(value: 'true' | 'false', range?: Range): LiteralExpression;
export declare function createFunctionExpression(kind: TokenKind.Sub | TokenKind.Function): FunctionExpression;
export declare function createMethodStatement(name: string, kind?: TokenKind.Sub | TokenKind.Function, modifiers?: Token[]): MethodStatement;
/**
 * @deprecated use `createMethodStatement`
 */
export declare function createClassMethodStatement(name: string, kind?: TokenKind.Sub | TokenKind.Function, accessModifier?: Token): MethodStatement;
export declare function createCall(callee: Expression, args?: Expression[]): CallExpression;
/**
 * Create an SGAttribute without any ranges
 */
export declare function createSGAttribute(keyName: string, value: string): SGAttribute;
export declare function createIfStatement(options: {
    if?: Token;
    condition: Expression;
    then?: Token;
    thenBranch: Block;
    else?: Token;
    elseBranch?: IfStatement | Block;
    endIf?: Token;
}): IfStatement;
export declare function createBlock(options: {
    statements: Statement[];
}): Block;
export declare function createAssignmentStatement(options: {
    name: Identifier | string;
    equals?: Token;
    value: Expression;
}): AssignmentStatement;
export declare function createDottedSetStatement(options: {
    obj: Expression;
    dot?: Token;
    name: Identifier | string;
    equals?: Token;
    value: Expression;
}): DottedSetStatement;
export declare function createIndexedSetStatement(options: {
    obj: Expression;
    openingSquare?: Token;
    index: Expression;
    closingSquare?: Token;
    equals?: Token;
    value: Expression;
    additionalIndexes?: Expression[];
}): IndexedSetStatement;

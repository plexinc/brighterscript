import type { Expression } from '../parser/AstNode';
import type { CallExpression, NewExpression } from '../parser/Expression';
import type { ClassStatement } from '../parser/Statement';
import type { BrsFile } from '../files/BrsFile';
import type { Position } from 'vscode-languageserver-protocol';
import type { NamespaceContainer } from '../Scope';
export declare enum CallExpressionType {
    namespaceCall = "namespaceCall",
    call = "call",
    callFunc = "callFunc",
    constructorCall = "constructorCall",
    myClassCall = "myClassCall",
    otherClassCall = "otherClassCall",
    unknown = "unknown"
}
export declare class CallExpressionInfo {
    expression?: Expression;
    callExpression?: CallExpression;
    type: CallExpressionType;
    file: BrsFile;
    myClass: ClassStatement;
    namespace?: NamespaceContainer;
    dotPart: string;
    name: string;
    isCallingMethodOnMyClass: boolean;
    newExpression: NewExpression;
    parameterIndex: number;
    private position;
    constructor(file: BrsFile, position: Position);
    private process;
    isPositionBetweenParentheses(): boolean;
    ascertainCallExpression(): CallExpression;
    ascertainType(): CallExpressionType;
    private getNamespace;
    private getParameterIndex;
}

import type { LabelDeclaration, VariableDeclaration } from './interfaces';
import type { FunctionExpression } from './parser/Expression';
export declare class FunctionScope {
    func: FunctionExpression;
    constructor(func: FunctionExpression);
    /**
     * The full range of this function. Starts at the position of the `f` in function or `s` in sub,
     * and ends after the final `n` in `end function` or `b` in end sub.
     */
    get range(): import("vscode-languageserver-types").Range;
    /**
     * The scopes that are children of this scope
     */
    childrenScopes: FunctionScope[];
    /**
     * The parent scope of this scope
     */
    parentScope: FunctionScope | undefined;
    variableDeclarations: VariableDeclaration[];
    labelStatements: LabelDeclaration[];
    /**
     * Find all variable declarations above the given line index
     * @param lineIndex the 0-based line number
     */
    getVariablesAbove(lineIndex: number): VariableDeclaration[];
    getVariableByName(name: string): VariableDeclaration;
}

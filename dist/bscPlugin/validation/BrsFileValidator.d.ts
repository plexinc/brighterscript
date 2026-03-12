import type { BrsFile } from '../../files/BrsFile';
import type { OnFileValidateEvent } from '../../interfaces';
export declare class BrsFileValidator {
    event: OnFileValidateEvent<BrsFile>;
    constructor(event: OnFileValidateEvent<BrsFile>);
    process(): void;
    /**
     * Walk the full AST
     */
    private walk;
    /**
     * Validate that a statement is defined in one of these specific locations
     *  - the root of the AST
     *  - inside a namespace
     * This is applicable to things like FunctionStatement, ClassStatement, NamespaceStatement, EnumStatement, InterfaceStatement
     */
    private validateDeclarationLocations;
    private validateFunctionParameterCount;
    private validateEnumDeclaration;
    private validateEnumValueTypes;
    /**
     * Find statements defined at the top level (or inside a namespace body) that are not allowed to be there
     */
    private flagTopLevelStatements;
    private validateImportStatements;
    private validateContinueStatement;
    /**
     * Validate that there are no optional chaining operators on the left-hand-side of an assignment, indexed set, or dotted get
     */
    private validateNoOptionalChainingInVarSet;
}

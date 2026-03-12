import type { Scope } from '../Scope';
import type { BsDiagnostic } from '../interfaces';
export declare class BsClassValidator {
    private scope;
    diagnostics: BsDiagnostic[];
    /**
     * The key is the namespace-prefixed class name. (i.e. `NameA.NameB.SomeClass` or `CoolClass`)
     */
    private classes;
    constructor(scope: Scope);
    validate(): void;
    /**
     * Given a class name optionally prefixed with a namespace name, find the class that matches
     */
    private getClassByName;
    /**
     * Find all "new" statements in the program,
     * and make sure we can find a class with that name
     */
    private verifyNewExpressions;
    private findNamespaceNonNamespaceCollisions;
    private verifyChildConstructor;
    private detectCircularReferences;
    private validateMemberCollisions;
    /**
     * Check the types for fields, and validate they are valid types
     */
    private validateFieldTypes;
    /**
     * Get the closest member with the specified name (case-insensitive)
     */
    getAncestorMember(classStatement: any, memberName: any): {
        member: any;
        classStatement: any;
    };
    private cleanUp;
    private findClasses;
    private linkClassesWithParents;
}

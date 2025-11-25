import type { Program } from '../../Program';
export declare class ProgramValidator {
    private program;
    constructor(program: Program);
    process(): void;
    /**
     * Flag any files that are included in 0 scopes.
     */
    private flagScopelessBrsFiles;
}

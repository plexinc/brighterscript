import type { OnGetCodeActionsEvent } from '../../interfaces';
export declare class CodeActionsProcessor {
    event: OnGetCodeActionsEvent;
    constructor(event: OnGetCodeActionsEvent);
    process(): void;
    private suggestedImports;
    /**
     * Generic import suggestion function. Shouldn't be called directly from the main loop, but instead called by more specific diagnostic handlers
     */
    private suggestImports;
    private suggestCannotFindName;
    private suggestClassImports;
    private addMissingExtends;
    private addVoidFunctionReturnActions;
    private addNonVoidFunctionReturnActions;
}

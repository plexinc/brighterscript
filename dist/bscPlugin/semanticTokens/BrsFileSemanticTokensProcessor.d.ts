import type { BrsFile } from '../../files/BrsFile';
import type { OnGetSemanticTokensEvent } from '../../interfaces';
export declare class BrsFileSemanticTokensProcessor {
    event: OnGetSemanticTokensEvent<BrsFile>;
    constructor(event: OnGetSemanticTokensEvent<BrsFile>);
    process(): void;
    private handleConstDeclarations;
    private handleClasses;
    /**
     * Add tokens for each locatable item in the list.
     * Each locatable is paired with a token type. If there are more locatables than token types, all remaining locatables are given the final token type
     */
    private addTokens;
    private addToken;
    private iterateNodes;
}

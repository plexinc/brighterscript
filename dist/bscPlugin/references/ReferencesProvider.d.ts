import type { ProvideReferencesEvent } from '../../interfaces';
import type { Location } from 'vscode-languageserver-protocol';
export declare class ReferencesProvider {
    private event;
    constructor(event: ProvideReferencesEvent);
    process(): Location[];
    /**
     * For a position in a BrsFile, get the location where the token at that position was defined
     */
    private brsFileGetReferences;
    private xmlFileGetReferences;
}

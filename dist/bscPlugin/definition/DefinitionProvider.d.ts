import type { ProvideDefinitionEvent } from '../../interfaces';
import type { Location } from 'vscode-languageserver-protocol';
export declare class DefinitionProvider {
    private event;
    constructor(event: ProvideDefinitionEvent);
    process(): Location[];
    /**
     * For a position in a BrsFile, get the location where the token at that position was defined
     */
    private brsFileGetDefinition;
    private brsFileGetDefinitionsForNamespace;
    private xmlFileGetDefinition;
}

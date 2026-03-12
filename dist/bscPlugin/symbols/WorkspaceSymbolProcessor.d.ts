import type { ProvideWorkspaceSymbolsEvent } from '../../interfaces';
export declare class WorkspaceSymbolProcessor {
    event: ProvideWorkspaceSymbolsEvent;
    constructor(event: ProvideWorkspaceSymbolsEvent);
    process(): import("vscode-languageserver-types").WorkspaceSymbol[];
    private getBrsFileWorkspaceSymbols;
}

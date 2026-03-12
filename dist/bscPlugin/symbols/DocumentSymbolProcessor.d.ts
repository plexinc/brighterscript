import type { ProvideDocumentSymbolsEvent } from '../../interfaces';
export declare class DocumentSymbolProcessor {
    event: ProvideDocumentSymbolsEvent;
    constructor(event: ProvideDocumentSymbolsEvent);
    process(): import("vscode-languageserver-types").DocumentSymbol[];
    private getBrsFileDocumentSymbols;
}

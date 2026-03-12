import { WorkspaceSymbol } from 'vscode-languageserver-protocol';
import { DocumentSymbol } from 'vscode-languageserver-protocol';
import type { BrsFile } from '../../files/BrsFile';
export declare function getDocumentSymbolsFromBrsFile(file: BrsFile): DocumentSymbol[];
export declare function getWorkspaceSymbolsFromBrsFile(file: BrsFile): WorkspaceSymbol[];

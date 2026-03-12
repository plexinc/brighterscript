import type { Diagnostic, Position, Range } from 'vscode-languageserver';
import { CodeActionKind, CodeAction } from 'vscode-languageserver';
export declare class CodeActionUtil {
    createCodeAction(obj: CodeActionShorthand): CodeAction;
    serializableDiagnostics(diagnostics: Diagnostic[] | undefined): {
        range: Range;
        severity: import("vscode-languageserver-types").DiagnosticSeverity;
        source: string;
        code: string | number;
        message: string;
        relatedInformation: import("vscode-languageserver-types").DiagnosticRelatedInformation[];
    }[];
}
export { CodeActionKind };
export interface CodeActionShorthand {
    title: string;
    diagnostics?: Diagnostic[];
    kind?: CodeActionKind;
    isPreferred?: boolean;
    changes: Array<InsertChange | ReplaceChange | DeleteChange>;
}
export interface InsertChange {
    filePath: string;
    newText: string;
    type: 'insert';
    position: Position;
}
export interface ReplaceChange {
    filePath: string;
    newText: string;
    type: 'replace';
    range: Range;
}
export interface DeleteChange {
    filePath: string;
    type: 'delete';
    range: Range;
}
export declare const codeActionUtil: CodeActionUtil;

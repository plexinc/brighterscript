/// <reference types="sinon" />
import type { BscFile, BsDiagnostic } from './interfaces';
import type { CodeDescription, CompletionItem, CompletionList, Diagnostic, DiagnosticRelatedInformation, DiagnosticSeverity, DiagnosticTag, integer, Range } from 'vscode-languageserver';
import type { CodeActionShorthand } from './CodeActionUtil';
import type { BrsFile } from './files/BrsFile';
import type { Program } from './Program';
import undent from 'undent';
import type { WorkspaceConfig } from './lsp/ProjectManager';
export declare const cwd: string;
export declare const tempDir: string;
export declare const rootDir: string;
export declare const stagingDir: string;
export declare const workspaceSettings: WorkspaceConfig;
export declare const trim: typeof undent;
declare type DiagnosticCollection = {
    getDiagnostics(): Array<Diagnostic>;
} | {
    diagnostics: Diagnostic[];
} | Diagnostic[];
declare type DiagnosticCollectionAsync = DiagnosticCollection | {
    getDiagnostics(): Promise<Array<Diagnostic>>;
};
export interface PartialDiagnostic {
    range?: Range;
    severity?: DiagnosticSeverity;
    code?: integer | string;
    codeDescription?: Partial<CodeDescription>;
    source?: string;
    message?: string;
    tags?: Partial<DiagnosticTag>[];
    relatedInformation?: Partial<DiagnosticRelatedInformation>[];
    data?: unknown;
    file?: Partial<BscFile>;
}
/**
 *  Helper function to clone a Diagnostic so it will give partial data that has the same properties as the expected
 */
export declare function cloneDiagnostic(actualDiagnosticInput: BsDiagnostic, expectedDiagnostic: BsDiagnostic): Partial<BsDiagnostic>;
/**
 * Ensure the DiagnosticCollection exactly contains the data from expected list.
 * @param arg - any object that contains diagnostics (such as `Program`, `Scope`, or even an array of diagnostics)
 * @param expected an array of expected diagnostics. if it's a string, assume that's a diagnostic error message
 */
export declare function expectDiagnosticsAsync(arg: DiagnosticCollectionAsync, expected: Array<PartialDiagnostic | string | number>): Promise<void>;
/**
 * Ensure the DiagnosticCollection exactly contains the data from expected list.
 * @param arg - any object that contains diagnostics (such as `Program`, `Scope`, or even an array of diagnostics)
 * @param expectedDiagnostics an array of expected diagnostics. if it's a string, assume that's a diagnostic error message
 */
export declare function expectDiagnostics(arg: DiagnosticCollection, expectedDiagnostics: Array<PartialDiagnostic | string | number>): void;
/**
 * Normalizes a collection of diagnostics for comparison
 * @param actualDiagnostics the actual diagnostics that were found
 * @param expectedDiagnostics the diagnostics we're expecing
 */
export declare function normalizeDiagnostics(actualDiagnostics: BsDiagnostic[], expectedDiagnostics: Array<PartialDiagnostic | string | number>): (string | number | PartialDiagnostic)[][];
/**
 * Ensure the DiagnosticCollection includes data from expected list (note - order does not matter).
 * @param arg - any object that contains diagnostics (such as `Program`, `Scope`, or even an array of diagnostics)
 * @param expected an array of expected diagnostics. if it's a string, assume that's a diagnostic error message
 */
export declare function expectDiagnosticsIncludes(arg: DiagnosticCollection, expected: Array<PartialDiagnostic | string | number>): void;
/**
 * Test that the given object has zero diagnostics. If diagnostics are found, they are printed to the console in a pretty fashion.
 */
export declare function expectZeroDiagnostics(arg: DiagnosticCollection): void;
/**
 * Test if the arg has any diagnostics. This just checks the count, nothing more.
 * @param diagnosticsCollection a collection of diagnostics
 * @param length if specified, checks the diagnostic count is exactly that amount. If omitted, the collection is just verified as non-empty
 */
export declare function expectHasDiagnostics(diagnosticsCollection: DiagnosticCollection, length?: number | null): void;
/**
 * Remove sourcemap information at the end of the source
 */
export declare function trimMap(source: string): string;
export declare function expectCodeActions(test: () => any, expected: CodeActionShorthand[]): void;
export declare function expectInstanceOf<T>(items: any[], constructors: Array<new (...args: any[]) => T>): void;
export declare function getTestTranspile(scopeGetter: () => [program: Program, rootDir: string]): (source: string, expected?: string, formatType?: "trim" | "none", pkgPath?: string, failOnDiagnostic?: boolean) => {
    file: BrsFile;
    source: string;
    expected: string;
    actual: string;
    map: import("source-map").SourceMapGenerator;
};
export declare function getTestGetTypedef(scopeGetter: () => [program: Program, rootDir: string]): (source: string, expected?: string, formatType?: "trim" | "none", pkgPath?: string, failOnDiagnostic?: boolean) => {
    file: BrsFile;
    source: string;
    expected: string;
    actual: string;
    map: import("source-map").SourceMapGenerator;
};
/**
 * Test a set of completions includes the provided items
 */
export declare function expectCompletionsIncludes(collection: CompletionItem[] | CompletionList, expectedItems: Array<string | Partial<CompletionItem>>): void;
/**
 * Expect that the completions list does not include the provided items
 */
export declare function expectCompletionsExcludes(completions: CompletionItem[], expectedItems: Array<string | Partial<CompletionItem>>): void;
export declare function expectThrows(callback: () => any, expectedMessage?: string | undefined, failedTestMessage?: string): void;
export declare function expectThrowsAsync(callback: () => any, expectedMessage?: any, failedTestMessage?: string): Promise<void>;
export declare function objectToMap<T>(obj: Record<string, T>): Map<string, T>;
export declare function mapToObject<T>(map: Map<any, T>): Record<string, T>;
export declare function stripConsoleColors(inputString: any): any;
declare type FunctionReturnType<T> = T extends (...args: any[]) => infer R ? R : any;
/**
 * Mock something, and get a promise when it has been called once
 */
export declare function onCalledOnce<T, K extends keyof T>(thing: T, method: K): Promise<FunctionReturnType<T[K]>>;
/**
 * Create a stub that resolves a promise after the function has settled for a period of time
 */
export declare function createInactivityStub<T, K extends keyof T>(obj: T, methodName: keyof T, inactivityPeriod?: number, sinonRef?: import("sinon").SinonSandbox): {
    stub: import("sinon").SinonStub<any[], any>;
    promise: Promise<unknown>;
};
export declare function once<T = any>(obj: {
    on: (event: any, callback: any) => () => void;
}, event: string): Promise<T[]>;
export {};

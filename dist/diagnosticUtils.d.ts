import type { Chalk } from 'chalk';
import type { BsConfig } from './BsConfig';
import { DiagnosticSeverity } from 'vscode-languageserver';
import type { BsDiagnostic } from '.';
import type { Range } from 'vscode-languageserver';
/**
 * Prepare print diagnostic formatting options
 */
export declare function getPrintDiagnosticOptions(options: BsConfig): {
    cwd: string;
    emitFullPaths: boolean;
    severityLevel: DiagnosticSeverity;
    includeDiagnostic: {};
    typeColor: Record<string, Chalk>;
    severityTextMap: {};
};
/**
 * Format output of one diagnostic
 */
export declare function printDiagnostic(options: ReturnType<typeof getPrintDiagnosticOptions>, severity: DiagnosticSeverity, filePath: string | undefined, lines: string[], diagnostic: BsDiagnostic, relatedInformation?: Array<{
    range: Range;
    filePath: string;
    message: string;
}>): void;
export declare function getDiagnosticLine(diagnostic: BsDiagnostic, diagnosticLine: string, colorFunction: Chalk): string;
/**
 * Given a diagnostic, compute the range for the squiggly
 */
export declare function getDiagnosticSquigglyText(line: string | undefined, startCharacter: number | undefined, endCharacter: number | undefined): string;

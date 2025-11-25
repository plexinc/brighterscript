import { DiagnosticSeverity } from 'vscode-languageserver-protocol';
import type { BsConfig } from './BsConfig';
import type { BsDiagnostic } from './interfaces';
export declare class DiagnosticSeverityAdjuster {
    adjust(options: BsConfig, diagnostics: BsDiagnostic[]): void;
    createSeverityMap(diagnosticSeverityOverrides: BsConfig['diagnosticSeverityOverrides']): Map<string, DiagnosticSeverity>;
}

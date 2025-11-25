import type { BsDiagnostic } from './interfaces';
import type { BsConfig } from './BsConfig';
interface NormalizedFilter {
    src?: string;
    codes?: (number | string)[];
    isNegative: boolean;
}
export declare class DiagnosticFilterer {
    private byFile;
    private filters;
    private rootDir;
    constructor();
    /**
     * Filter a list of diagnostics based on the provided filters
     */
    filter(options: BsConfig, diagnostics: BsDiagnostic[]): BsDiagnostic[];
    /**
     * Iterate over all remaining diagnostics from the byFile map.
     * Also removes duplicates
     */
    private getDiagnostics;
    /**
     * group the diagnostics by file
     */
    private groupByFile;
    private filterAllFiles;
    private filterFile;
    getDiagnosticFilters(config: BsConfig): NormalizedFilter[];
}
export {};

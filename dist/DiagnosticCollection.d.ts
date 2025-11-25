import type { LspDiagnostic } from './lsp/LspProject';
export declare class DiagnosticCollection {
    private previousDiagnosticsByFile;
    /**
     * Get a patch of any changed diagnostics since last time. This takes a single project and diagnostics, but evaluates
     * the patch based on all previously seen projects. It's supposed to be a rolling patch.
     * This will include _ALL_ diagnostics for a file if any diagnostics have changed for that file, due to how the language server expects diagnostics to be sent.
     */
    getPatch(projectId: number, diagnostics: LspDiagnostic[]): {
        [x: string]: KeyedDiagnostic[];
    };
    /**
     * Get all the previous diagnostics, remove any that were exclusive to the current project, then mix in the project's new diagnostics.
     * @param projectId the id of the project that should have its diagnostics refreshed
     * @param thisProjectDiagnostics diagnostics for the project
     */
    private getDiagnosticsByFile;
    /**
     * Clone the previousDiagnosticsByFile, retaining the array of project references on each diagnostic
     */
    private clonePreviousDiagnosticsByFile;
    /**
     * Get a patch for all the files that have been removed since last time
     */
    private getRemovedPatch;
    /**
     * Get all files whose diagnostics have changed since last time
     */
    private getModifiedPatch;
    /**
     * Determine if two diagnostic lists are identical
     */
    private diagnosticListsAreIdentical;
    /**
     * Get diagnostics for all new files not seen since last time
     */
    private getAddedPatch;
}
interface KeyedDiagnostic extends LspDiagnostic {
    key: string;
    projectIds: Set<number>;
}
export {};

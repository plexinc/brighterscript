"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiagnosticCollection = void 0;
const vscode_uri_1 = require("vscode-uri");
const util_1 = require("./util");
const thenby_1 = require("thenby");
class DiagnosticCollection {
    constructor() {
        this.previousDiagnosticsByFile = {};
    }
    /**
     * Get a patch of any changed diagnostics since last time. This takes a single project and diagnostics, but evaluates
     * the patch based on all previously seen projects. It's supposed to be a rolling patch.
     * This will include _ALL_ diagnostics for a file if any diagnostics have changed for that file, due to how the language server expects diagnostics to be sent.
     */
    getPatch(projectId, diagnostics) {
        const diagnosticsByFile = this.getDiagnosticsByFile(projectId, diagnostics);
        const patch = Object.assign(Object.assign(Object.assign({}, this.getRemovedPatch(diagnosticsByFile)), this.getModifiedPatch(diagnosticsByFile)), this.getAddedPatch(diagnosticsByFile));
        //save the new list of diagnostics
        this.previousDiagnosticsByFile = diagnosticsByFile;
        return patch;
    }
    /**
     * Get all the previous diagnostics, remove any that were exclusive to the current project, then mix in the project's new diagnostics.
     * @param projectId the id of the project that should have its diagnostics refreshed
     * @param thisProjectDiagnostics diagnostics for the project
     */
    getDiagnosticsByFile(projectId, thisProjectDiagnostics) {
        var _a, _b;
        const result = this.clonePreviousDiagnosticsByFile();
        const diagnosticsByKey = new Map();
        //delete all diagnostics linked to this project
        for (const srcPath in result) {
            const diagnostics = result[srcPath];
            for (let i = diagnostics.length - 1; i >= 0; i--) {
                const diagnostic = diagnostics[i];
                //remember this diagnostic key for use when deduplicating down below
                diagnosticsByKey.set(diagnostic.key, diagnostic);
                //unlink the diagnostic from this project
                diagnostic.projectIds.delete(projectId);
                //delete this diagnostic if it's no longer linked to any projects
                if (diagnostic.projectIds.size === 0) {
                    diagnostics.splice(i, 1);
                    diagnosticsByKey.delete(diagnostic.key);
                }
            }
        }
        //build the full current set of diagnostics by file
        for (let diagnostic of thisProjectDiagnostics) {
            const srcPath = vscode_uri_1.URI.parse(diagnostic.uri).fsPath;
            //ensure the file entry exists
            if (!result[srcPath]) {
                result[srcPath] = [];
            }
            //fall back to a default range if missing
            const range = (_a = diagnostic.range) !== null && _a !== void 0 ? _a : util_1.util.createRange(0, 0, 0, 0);
            diagnostic.key =
                srcPath.toLowerCase() + '-' +
                    diagnostic.code + '-' +
                    range.start.line + '-' +
                    range.start.character + '-' +
                    range.end.line + '-' +
                    range.end.character +
                    diagnostic.message;
            (_b = diagnostic.projectIds) !== null && _b !== void 0 ? _b : (diagnostic.projectIds = new Set([projectId]));
            //don't include duplicates
            if (!diagnosticsByKey.has(diagnostic.key)) {
                diagnosticsByKey.set(diagnostic.key, diagnostic);
                const diagnosticsForFile = result[srcPath];
                diagnosticsForFile.push(diagnostic);
            }
            //link this project to the diagnostic
            diagnosticsByKey.get(diagnostic.key).projectIds.add(projectId);
        }
        //sort the list so it's easier to compare later
        for (let key in result) {
            result[key].sort((0, thenby_1.firstBy)(x => x.key));
        }
        return result;
    }
    /**
     * Clone the previousDiagnosticsByFile, retaining the array of project references on each diagnostic
     */
    clonePreviousDiagnosticsByFile() {
        let clone = {};
        for (let key in this.previousDiagnosticsByFile) {
            clone[key] = [];
            for (const diagnostic of this.previousDiagnosticsByFile[key]) {
                clone[key].push(Object.assign(Object.assign({}, diagnostic), { 
                    //make a copy of the projects array (but keep the project references intact)
                    projectIds: new Set([...diagnostic.projectIds]) }));
            }
        }
        return clone;
    }
    /**
     * Get a patch for all the files that have been removed since last time
     */
    getRemovedPatch(currentDiagnosticsByFile) {
        var _a, _b;
        const result = {};
        for (const filePath in this.previousDiagnosticsByFile) {
            //if there are no current diagnostics for this file, add an empty array to the result for that file path
            if (((_b = (_a = currentDiagnosticsByFile[filePath]) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) === 0) {
                result[filePath] = [];
            }
        }
        return result;
    }
    /**
     * Get all files whose diagnostics have changed since last time
     */
    getModifiedPatch(currentDiagnosticsByFile) {
        const result = {};
        for (const filePath in currentDiagnosticsByFile) {
            //for this file, if there were diagnostics last time AND there are diagnostics this time, and the lists are different
            if (this.previousDiagnosticsByFile[filePath] && !this.diagnosticListsAreIdentical(this.previousDiagnosticsByFile[filePath], currentDiagnosticsByFile[filePath])) {
                result[filePath] = currentDiagnosticsByFile[filePath];
            }
        }
        return result;
    }
    /**
     * Determine if two diagnostic lists are identical
     */
    diagnosticListsAreIdentical(list1, list2) {
        //skip all checks if the lists are not the same size
        if (list1.length !== list2.length) {
            return false;
        }
        for (let i = 0; i < list1.length; i++) {
            if (list1[i].key !== list2[i].key) {
                return false;
            }
        }
        //if we made it here, the lists are identical
        return true;
    }
    /**
     * Get diagnostics for all new files not seen since last time
     */
    getAddedPatch(currentDiagnosticsByFile) {
        var _a, _b;
        const result = {};
        for (const filePath in currentDiagnosticsByFile) {
            if (((_b = (_a = this.previousDiagnosticsByFile[filePath]) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) === 0) {
                result[filePath] = currentDiagnosticsByFile[filePath];
            }
        }
        return result;
    }
}
exports.DiagnosticCollection = DiagnosticCollection;
//# sourceMappingURL=DiagnosticCollection.js.map
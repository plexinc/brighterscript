"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiagnosticFilterer = void 0;
const path = require("path");
const minimatch = require("minimatch");
const util_1 = require("./util");
class DiagnosticFilterer {
    constructor() {
        this.byFile = {};
    }
    /**
     * Filter a list of diagnostics based on the provided filters
     */
    filter(options, diagnostics) {
        this.filters = this.getDiagnosticFilters(options);
        this.rootDir = options.rootDir;
        this.groupByFile(diagnostics);
        for (let filter of this.filters) {
            this.filterAllFiles(filter);
        }
        let result = this.getDiagnostics();
        //clean up
        this.byFile = {};
        delete this.rootDir;
        delete this.filters;
        return result;
    }
    /**
     * Iterate over all remaining diagnostics from the byFile map.
     * Also removes duplicates
     */
    getDiagnostics() {
        //combine all remaining diagnostics
        let finalDiagnostics = [];
        for (let key in this.byFile) {
            let fileDiagnostics = this.byFile[key];
            for (let diagnostic of fileDiagnostics) {
                //filter out duplicate and suppressed diagnostics
                if (!finalDiagnostics.includes(diagnostic.diagnostic) && !diagnostic.isSuppressed) {
                    finalDiagnostics.push(diagnostic.diagnostic);
                }
            }
        }
        return finalDiagnostics;
    }
    /**
     * group the diagnostics by file
     */
    groupByFile(diagnostics) {
        var _a, _b, _c;
        this.byFile = {};
        for (let diagnostic of diagnostics) {
            const srcPath = (_b = (_a = diagnostic === null || diagnostic === void 0 ? void 0 : diagnostic.file) === null || _a === void 0 ? void 0 : _a.srcPath) !== null && _b !== void 0 ? _b : (_c = diagnostic === null || diagnostic === void 0 ? void 0 : diagnostic.file) === null || _c === void 0 ? void 0 : _c.srcPath;
            //skip diagnostics that have issues
            if (!srcPath) {
                continue;
            }
            const lowerSrcPath = srcPath.toLowerCase();
            //make a new array for this file if one does not yet exist
            if (!this.byFile[lowerSrcPath]) {
                this.byFile[lowerSrcPath] = [];
            }
            this.byFile[lowerSrcPath].push({
                diagnostic: diagnostic,
                isSuppressed: false
            });
        }
    }
    filterAllFiles(filter) {
        let matchedFilePaths;
        //if there's a src, match against all files
        if (filter.src) {
            //prepend rootDir to src if the filter is a relative path
            let src = (0, util_1.standardizePath)(path.isAbsolute(filter.src) ? filter.src : `${this.rootDir}/${filter.src}`);
            matchedFilePaths = minimatch.match(Object.keys(this.byFile), src, {
                nocase: true
            });
            //there is no src; this applies to all files
        }
        else {
            matchedFilePaths = Object.keys(this.byFile);
        }
        //filter each matched file
        for (let filePath of matchedFilePaths) {
            this.filterFile(filter, filePath);
        }
    }
    filterFile(filter, filePath) {
        //if the filter is negative, we're turning diagnostics on
        //if the filter is not negative we're turning diagnostics off
        const isSuppressing = !filter.isNegative;
        //if there is no code, set isSuppressed on every diagnostic in this file
        if (!filter.codes) {
            this.byFile[filePath].forEach(diagnostic => {
                diagnostic.isSuppressed = isSuppressing;
            });
            //set isSuppressed for any diagnostics with matching codes
        }
        else {
            let fileDiagnostics = this.byFile[filePath];
            for (const diagnostic of fileDiagnostics) {
                if (filter.codes.includes(diagnostic.diagnostic.code)) {
                    diagnostic.isSuppressed = isSuppressing;
                }
            }
        }
    }
    getDiagnosticFilters(config) {
        var _a, _b;
        let globalIgnoreCodes = [...(_a = config.ignoreErrorCodes) !== null && _a !== void 0 ? _a : []];
        let diagnosticFilters = [...(_b = config.diagnosticFilters) !== null && _b !== void 0 ? _b : []];
        let result = [];
        //include a filter for all global ignore codes
        //this comes first, because negative patterns will override ignoreErrorCodes
        if (globalIgnoreCodes.length > 0) {
            result.push({
                codes: globalIgnoreCodes,
                isNegative: false
            });
        }
        for (let filter of diagnosticFilters) {
            if (typeof filter === 'number') {
                result.push({
                    codes: [filter],
                    isNegative: false
                });
                continue;
            }
            if (typeof filter === 'string') {
                const isNegative = filter.startsWith('!');
                const trimmedFilter = isNegative ? filter.slice(1) : filter;
                result.push({
                    src: trimmedFilter,
                    isNegative: isNegative
                });
                continue;
            }
            //filter out bad inputs
            if (!filter || typeof filter !== 'object') {
                continue;
            }
            //code-only filter
            if ('codes' in filter && !('src' in filter) && Array.isArray(filter.codes)) {
                result.push({
                    codes: filter.codes,
                    isNegative: false
                });
                continue;
            }
            if ('src' in filter) {
                const isNegative = filter.src.startsWith('!');
                const trimmedFilter = isNegative ? filter.src.slice(1) : filter.src;
                if ('codes' in filter) {
                    result.push({
                        src: trimmedFilter,
                        codes: filter.codes,
                        isNegative: isNegative
                    });
                }
                else {
                    result.push({
                        src: trimmedFilter,
                        isNegative: isNegative
                    });
                }
            }
        }
        return result;
    }
}
exports.DiagnosticFilterer = DiagnosticFilterer;
//# sourceMappingURL=DiagnosticFilterer.js.map
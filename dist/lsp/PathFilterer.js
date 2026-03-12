"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PathCollection = exports.PathFilterer = void 0;
const micromatch = require("micromatch");
const path = require("path");
const logging_1 = require("../logging");
const util_1 = require("../util");
/**
 * Manage collections of glob patterns used to filter paths.
 *
 * excludeLists are evaluated first to see if a path should be excluded. If the path is excluded, we then test it against the includeLists.
 * If the path matches an includeList, it will be included. If not, it will remain excluded.
 */
class PathFilterer {
    constructor(options) {
        var _a;
        this.includeCollections = [];
        this.excludeCollections = [];
        this.logger = (_a = options === null || options === void 0 ? void 0 : options.logger) !== null && _a !== void 0 ? _a : (0, logging_1.createLogger)();
    }
    /**
     * Filter the given list of entries based on the registered include and exclude lists.
     * @param entries the list of paths (or objects having paths) to filter
     * @param fetcher a function that can extract the path from the entry if it's not a string
     * @returns the filtered list of entries
     */
    filter(entries, fetcher) {
        var _a;
        //if there are no exclude lists, then all files should be included
        if (this.excludeCollections.length === 0) {
            return entries;
        }
        let results = [];
        //process each path
        for (let entry of entries) {
            let srcPath = (_a = fetcher === null || fetcher === void 0 ? void 0 : fetcher(entry)) !== null && _a !== void 0 ? _a : entry;
            //if this path is excluded
            if (this.isExclusionsMatch(srcPath)) {
                //if this path is re-included, keep it
                if (this.isInclusionsMatch(srcPath)) {
                    results.push(entry);
                }
                else {
                    //this path should be excluded
                }
                //this path is not excluded, so keep it
            }
            else {
                results.push(entry);
            }
        }
        return results;
    }
    /**
     * Does the path match at least one of the exclusions lists
     */
    isExclusionsMatch(path) {
        //does this path match an exclusion list?
        for (const collection of this.excludeCollections) {
            if (collection.isMatch(path)) {
                return true;
            }
        }
        return false;
    }
    /**
     * Does the path match at least one of the inclusions lists
     */
    isInclusionsMatch(path) {
        //does this path match an exclusion list?
        for (const collection of this.includeCollections) {
            if (collection.isMatch(path)) {
                return true;
            }
        }
        return false;
    }
    /**
     * Register a list of inclusive globs that should be evaluated together
     * These should be things like the `files` array from a bsconfig.json
     */
    registerIncludeList(rootDir, globs) {
        this.logger.debug('registerIncludeList', { rootDir: rootDir, globs: globs });
        let collection = new PathCollection({
            rootDir: rootDir,
            globs: globs
        });
        this.includeCollections.push(collection);
        return () => {
            this.removeCollection(collection);
        };
    }
    /**
     * Register glob patterns for files that should be _excluded_. positive patterns mean a file is excluded,
     * and negative patterns mean a file that was previously matched (excluded) should be unmatched (included)
     * These should be things like .gitignore or vscode's `files.exclude`.
     *
     * @example
     * ```typescript
     * [
     *     '.git',
     *     'node_modules'
     *     '!node_modules/@rokucommunity/bslib'
     * ]
     * ```
     * would exclude all files in the `.git` and `node_modules` directories, but would include the `node_modules/@rokucommunity/bslib` directory
     */
    registerExcludeList(rootDir, globs) {
        this.logger.debug('registerExcludeList', { rootDir: rootDir, globs: globs });
        let collection = new PathCollection({
            rootDir: rootDir,
            globs: globs
        });
        this.excludeCollections.push(collection);
        return () => {
            this.removeCollection(collection);
        };
    }
    registerExcludeMatcher(matcher) {
        this.logger.debug('registerExcludeMatcher', matcher);
        const collection = new PathCollection({
            matcher: matcher,
            isExcludePattern: false
        });
        this.excludeCollections.push(collection);
        return () => {
            this.removeCollection(collection);
        };
    }
    removeCollection(collection) {
        let idx = this.includeCollections.indexOf(collection);
        if (idx > -1) {
            this.includeCollections.splice(idx, 1);
        }
        idx = this.excludeCollections.indexOf(collection);
        if (idx > -1) {
            this.excludeCollections.splice(idx, 1);
        }
    }
    /**
     * Remove all registered collections
     */
    clear() {
        this.includeCollections = [];
        this.excludeCollections = [];
    }
}
exports.PathFilterer = PathFilterer;
class PathCollection {
    constructor(options) {
        var _a;
        this.options = options;
        this.matchers = [];
        if ('globs' in options) {
            //build matcher patterns from the globs
            for (let glob of (_a = options.globs) !== null && _a !== void 0 ? _a : []) {
                let isExcludePattern = glob.startsWith('!');
                if (isExcludePattern) {
                    glob = glob.substring(1);
                }
                const pattern = path.resolve(options.rootDir, glob).replace(/\\+/g, '/');
                this.matchers.push({
                    pattern: pattern,
                    isMatch: micromatch.matcher(pattern),
                    isExcludePattern: isExcludePattern
                });
            }
        }
        else {
            this.matchers.push({
                isMatch: options.matcher,
                isExcludePattern: options.isExcludePattern
            });
        }
    }
    isMatch(path) {
        let keep = false;
        //coerce the path into a normalized form and unix slashes
        path = util_1.default.standardizePath(path).replace(/\\+/g, '/');
        for (let matcher of this.matchers) {
            //exclusion pattern: do not keep the path if it matches
            if (matcher.isExcludePattern) {
                if (matcher.isMatch(path)) {
                    keep = false;
                }
                //inclusion pattern: keep the path if it matches
            }
            else {
                keep = keep || matcher.isMatch(path);
            }
        }
        return keep;
    }
}
exports.PathCollection = PathCollection;
//# sourceMappingURL=PathFilterer.js.map
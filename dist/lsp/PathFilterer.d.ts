import type { Logger } from '../logging';
/**
 * Manage collections of glob patterns used to filter paths.
 *
 * excludeLists are evaluated first to see if a path should be excluded. If the path is excluded, we then test it against the includeLists.
 * If the path matches an includeList, it will be included. If not, it will remain excluded.
 */
export declare class PathFilterer {
    constructor(options?: {
        logger?: Logger;
    });
    private logger;
    private includeCollections;
    private excludeCollections;
    /**
     * Filter the given list of entries based on the registered include and exclude lists.
     * @param entries the list of paths (or objects having paths) to filter
     * @param fetcher a function that can extract the path from the entry if it's not a string
     * @returns the filtered list of entries
     */
    filter<T = string>(entries: T[], fetcher?: (path: T) => string): T[];
    /**
     * Does the path match at least one of the exclusions lists
     */
    private isExclusionsMatch;
    /**
     * Does the path match at least one of the inclusions lists
     */
    private isInclusionsMatch;
    /**
     * Register a list of inclusive globs that should be evaluated together
     * These should be things like the `files` array from a bsconfig.json
     */
    registerIncludeList(rootDir: string, globs: string[]): () => void;
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
    registerExcludeList(rootDir: string, globs: string[]): () => void;
    registerExcludeMatcher(matcher: (path: string) => boolean): () => void;
    private removeCollection;
    /**
     * Remove all registered collections
     */
    clear(): void;
}
export declare class PathCollection {
    options: {
        rootDir: string;
        globs: string[];
    } | {
        matcher: (path: string) => boolean;
        isExcludePattern: boolean;
    };
    constructor(options: {
        rootDir: string;
        globs: string[];
    } | {
        matcher: (path: string) => boolean;
        isExcludePattern: boolean;
    });
    private matchers;
    isMatch(path: string): boolean;
}

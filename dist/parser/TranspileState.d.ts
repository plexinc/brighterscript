import { SourceNode } from 'source-map';
import type { Range } from 'vscode-languageserver';
import type { BsConfig } from '../BsConfig';
import type { TranspileResult } from '../interfaces';
/**
 * Holds the state of a transpile operation as it works its way through the transpile process
 */
export declare class TranspileState {
    /**
     * The absolute path to the source location of this file. If sourceRoot is specified,
     * this path will be full path to the file in sourceRoot instead of rootDir.
     * If the file resides outside of rootDir, then no changes will be made to this path.
     */
    srcPath: string;
    options: BsConfig;
    constructor(
    /**
     * The absolute path to the source location of this file. If sourceRoot is specified,
     * this path will be full path to the file in sourceRoot instead of rootDir.
     * If the file resides outside of rootDir, then no changes will be made to this path.
     */
    srcPath: string, options: BsConfig);
    indentText: string;
    /**
     * Append whitespace until we reach the current blockDepth amount
     * @param blockDepthChange - if provided, this will add (or subtract if negative) the value to the block depth BEFORE getting the next indent amount.
     */
    indent(blockDepthChange?: number): string;
    /**
     * The number of active parent blocks for the current location of the state.
     */
    get blockDepth(): number;
    set blockDepth(value: number);
    private _blockDepth;
    newline: string;
    /**
     * Shorthand for creating a new source node
     */
    sourceNode(locatable: {
        range?: Range;
    }, code: string | SourceNode | TranspileResult): SourceNode;
    /**
     * Create a SourceNode from a token. This is more efficient than the above `sourceNode` function
     * because the entire token is passed by reference, instead of the raw string being copied to the parameter,
     * only to then be copied again for the SourceNode constructor
     */
    tokenToSourceNode(token: {
        range?: Range;
        text: string;
    }): SourceNode;
    /**
     * Create a SourceNode from a token, accounting for missing range and multi-line text
     */
    transpileToken(token: {
        range?: Range;
        text: string;
    }, defaultValue?: string): string | SourceNode;
}

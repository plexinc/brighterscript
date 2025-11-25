"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranspileState = void 0;
const source_map_1 = require("source-map");
const util_1 = require("../util");
/**
 * Holds the state of a transpile operation as it works its way through the transpile process
 */
class TranspileState {
    constructor(
    /**
     * The absolute path to the source location of this file. If sourceRoot is specified,
     * this path will be full path to the file in sourceRoot instead of rootDir.
     * If the file resides outside of rootDir, then no changes will be made to this path.
     */
    srcPath, options) {
        this.srcPath = srcPath;
        this.options = options;
        this.indentText = '';
        this._blockDepth = 0;
        this.newline = '\n';
        this.srcPath = srcPath;
        //if a sourceRoot is specified, use that instead of the rootDir
        if (this.options.sourceRoot) {
            this.srcPath = this.srcPath.replace(this.options.rootDir, this.options.sourceRoot);
        }
    }
    /**
     * Append whitespace until we reach the current blockDepth amount
     * @param blockDepthChange - if provided, this will add (or subtract if negative) the value to the block depth BEFORE getting the next indent amount.
     */
    indent(blockDepthChange = 0) {
        this.blockDepth += blockDepthChange;
        return this.indentText;
    }
    /**
     * The number of active parent blocks for the current location of the state.
     */
    get blockDepth() {
        return this._blockDepth;
    }
    set blockDepth(value) {
        this._blockDepth = value;
        this.indentText = value === 0 ? '' : '    '.repeat(value);
    }
    /**
     * Shorthand for creating a new source node
     */
    sourceNode(locatable, code) {
        return util_1.default.sourceNodeFromTranspileResult(
        //convert 0-based range line to 1-based SourceNode line
        locatable.range ? locatable.range.start.line + 1 : null, 
        //range and SourceNode character are both 0-based, so no conversion necessary
        locatable.range ? locatable.range.start.character : null, this.srcPath, code);
    }
    /**
     * Create a SourceNode from a token. This is more efficient than the above `sourceNode` function
     * because the entire token is passed by reference, instead of the raw string being copied to the parameter,
     * only to then be copied again for the SourceNode constructor
     */
    tokenToSourceNode(token) {
        return new source_map_1.SourceNode(
        //convert 0-based range line to 1-based SourceNode line
        token.range ? token.range.start.line + 1 : null, 
        //range and SourceNode character are both 0-based, so no conversion necessary
        token.range ? token.range.start.character : null, this.srcPath, token.text);
    }
    /**
     * Create a SourceNode from a token, accounting for missing range and multi-line text
     */
    transpileToken(token, defaultValue) {
        if (!(token === null || token === void 0 ? void 0 : token.text) && defaultValue !== undefined) {
            return defaultValue;
        }
        if (!token.range) {
            return token.text;
        }
        //split multi-line text
        if (token.range.end.line > token.range.start.line) {
            const lines = token.text.split(/\r?\n/g);
            const code = [
                this.sourceNode(token, lines[0])
            ];
            for (let i = 1; i < lines.length; i++) {
                code.push(this.newline, new source_map_1.SourceNode(
                //convert 0-based range line to 1-based SourceNode line
                token.range.start.line + i + 1, 
                //SourceNode column is 0-based, and this starts at the beginning of the line
                0, this.srcPath, lines[i]));
            }
            return new source_map_1.SourceNode(null, null, null, code);
        }
        else {
            return this.tokenToSourceNode(token);
        }
    }
}
exports.TranspileState = TranspileState;
//# sourceMappingURL=TranspileState.js.map
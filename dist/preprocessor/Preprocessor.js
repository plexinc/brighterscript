"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Preprocessor = void 0;
const TokenKind_1 = require("../lexer/TokenKind");
const DiagnosticMessages_1 = require("../DiagnosticMessages");
const PreprocessorParser_1 = require("./PreprocessorParser");
const Manifest_1 = require("./Manifest");
/**
 * A simple pre-processor that executes BrightScript's conditional compilation directives by
 * selecting chunks of tokens to be considered for later evaluation.
 */
class Preprocessor {
    constructor() {
        this.constants = new Map();
        /** The set of errors encountered when pre-processing conditional compilation directives. */
        this.diagnostics = [];
        this.processedTokens = [];
    }
    /**
     * Filters the tokens contained within a set of chunks based on a set of constants.
     * @param tokens the tokens
     * @param manifest a manifest used to extract bs_const properties from
     * @returns an object containing an array of `errors` and an array of `processedTokens` filtered by conditional
     *          compilation directives included within
     */
    process(tokens, manifest) {
        this.processedTokens = [];
        let parser = PreprocessorParser_1.PreprocessorParser.parse(tokens);
        //absorb the parser's diagnostic messages
        this.diagnostics.push(...parser.diagnostics);
        //if we found diagnostics, quit now
        if (parser.diagnostics.length > 0) {
            return this;
        }
        let bsConst = (0, Manifest_1.getBsConst)(manifest);
        this.filter(parser.chunks, bsConst);
        return this;
    }
    filter(chunks, bsConst) {
        this.constants = new Map(bsConst);
        this.processedTokens = chunks
            .map(chunk => chunk.accept(this))
            .reduce((allTokens, chunkTokens) => [
            ...allTokens,
            ...chunkTokens
        ], []);
        return this;
    }
    static process(tokens, manifest) {
        return new Preprocessor().process(tokens, manifest);
    }
    /**
     * Emits an error via this processor's `events` property, then throws it.
     * @param diagnostic the ParseError to emit then throw
     */
    addError(diagnostic) {
        this.diagnostics.push(diagnostic);
        return diagnostic;
    }
    /**
     * Handles a simple chunk of BrightScript tokens by returning the tokens contained within.
     * @param chunk the chunk to extract tokens from
     * @returns the array of tokens contained within `chunk`
     */
    visitBrightScript(chunk) {
        return chunk.tokens;
    }
    /**
     * Handles a BrightScript `#const` directive, creating a variable in-scope only for the
     * conditional compilation pass.
     * @param chunk the `#const` directive, including the name and variable to use for the constant
     * @returns an empty array, since `#const` directives are always removed from the evaluated script.
     */
    visitDeclaration(chunk) {
        var _a, _b;
        const nameLower = (_b = (_a = chunk.name) === null || _a === void 0 ? void 0 : _a.text) === null || _b === void 0 ? void 0 : _b.toLocaleLowerCase();
        if (this.constants.has(nameLower)) {
            this.addError(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.duplicateConstDeclaration(chunk.name.text)), { range: chunk.name.range }));
        }
        let value;
        switch (chunk.value.kind) {
            case TokenKind_1.TokenKind.True:
                value = true;
                break;
            case TokenKind_1.TokenKind.False:
                value = false;
                break;
            case TokenKind_1.TokenKind.Identifier:
                if (this.constants.has(nameLower)) {
                    value = this.constants.get(nameLower);
                    break;
                }
                this.addError(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.constAliasDoesNotExist(chunk.value.text)), { range: chunk.value.range }));
                break;
            default:
                this.addError(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.invalidHashConstValue()), { range: chunk.value.range }));
        }
        this.constants.set(nameLower, value);
        return [];
    }
    /**
     * Throws an error, stopping "compilation" of the program.
     * @param chunk the error to report to users
     * @throws a JavaScript error with the provided message
     */
    visitError(chunk) {
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw this.addError(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.hashError(chunk.message.text)), { range: chunk.range }));
    }
    /**
     * Produces tokens from a branch of a conditional-compilation `#if`, or no tokens if no branches evaluate to `true`.
     * @param chunk the `#if` directive, any `#else if` or `#else` directives, and their associated BrightScript chunks.
     * @returns an array of tokens to include in the final executed script.
     */
    visitIf(chunk) {
        if (this.evaluateCondition(chunk.condition)) {
            return chunk.thenChunks
                .map(chunk => chunk.accept(this))
                .reduce((allTokens, chunkTokens) => [...allTokens, ...chunkTokens], []);
        }
        else {
            for (const elseIf of chunk.elseIfs) {
                if (this.evaluateCondition(elseIf.condition)) {
                    return elseIf.thenChunks
                        .map(chunk => chunk.accept(this))
                        .reduce((allTokens, chunkTokens) => [...allTokens, ...chunkTokens], []);
                }
            }
        }
        if (chunk.elseChunks) {
            return chunk.elseChunks
                .map(chunk => chunk.accept(this))
                .reduce((allTokens, chunkTokens) => [...allTokens, ...chunkTokens], []);
        }
        return [];
    }
    /**
     * Resolves a token to a JavaScript boolean value, or logs a diagnostic error.
     * @param token the token to resolve to either `true`, `false`, or `undefined`
     */
    evaluateCondition(token) {
        var _a;
        switch (token.kind) {
            case TokenKind_1.TokenKind.True:
                return true;
            case TokenKind_1.TokenKind.False:
                return false;
            case TokenKind_1.TokenKind.Identifier:
                const nameLower = (_a = token.text) === null || _a === void 0 ? void 0 : _a.toLowerCase();
                if (this.constants.has(nameLower)) {
                    return !!this.constants.get(nameLower);
                }
                this.addError(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.referencedConstDoesNotExist()), { range: token.range }));
                break;
            default:
                this.addError(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.invalidHashIfValue()), { range: token.range }));
        }
    }
}
exports.Preprocessor = Preprocessor;
//# sourceMappingURL=Preprocessor.js.map
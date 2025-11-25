"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EOF = exports.rangeMatch = exports.identifier = exports.token = void 0;
const TokenKind_1 = require("../../lexer/TokenKind");
/* A set of utilities to be used while writing tests for the BRS parser. */
/**
 * Creates a token with the given `kind` and (optional) `literal` value.
 */
function token(kind, text) {
    return {
        kind: kind,
        text: text,
        isReserved: TokenKind_1.ReservedWords.has((text !== null && text !== void 0 ? text : '').toLowerCase()),
        range: null,
        leadingWhitespace: ''
    };
}
exports.token = token;
/**
 * Creates an Identifier token with the given `text`.
 */
function identifier(text) {
    return token(TokenKind_1.TokenKind.Identifier, text);
}
exports.identifier = identifier;
/**
 * Test whether a range matches a group of elements with a `range`
 */
function rangeMatch(range, elements) {
    return range.start.line === elements[0].range.start.line &&
        range.start.character === elements[0].range.start.character &&
        range.end.line === elements[elements.length - 1].range.end.line &&
        range.end.character === elements[elements.length - 1].range.end.character;
}
exports.rangeMatch = rangeMatch;
/** An end-of-file token. */
exports.EOF = token(TokenKind_1.TokenKind.Eof, '\0');
//# sourceMappingURL=Parser.spec.js.map
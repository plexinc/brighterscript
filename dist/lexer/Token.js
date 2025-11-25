"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isIdentifier = exports.isToken = void 0;
const TokenKind_1 = require("./TokenKind");
/**
 * Determines whether or not `obj` is a `Token`.
 * @param obj the object to check for `Token`-ness
 * @returns `true` is `obj` is a `Token`, otherwise `false`
 */
function isToken(obj) {
    return !!(obj.kind && obj.text);
}
exports.isToken = isToken;
/**
 * Is this a token that has the `TokenKind.Identifier` kind?
 */
function isIdentifier(obj) {
    return (obj === null || obj === void 0 ? void 0 : obj.kind) === TokenKind_1.TokenKind.Identifier;
}
exports.isIdentifier = isIdentifier;
//# sourceMappingURL=Token.js.map
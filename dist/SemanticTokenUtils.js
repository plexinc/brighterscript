"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModifierBitFlags = exports.encodeSemanticTokens = exports.semanticTokensLegend = void 0;
const node_1 = require("vscode-languageserver-protocol/node");
const node_2 = require("vscode-languageserver/node");
const util_1 = require("./util");
exports.semanticTokensLegend = {
    tokenTypes: [
        node_1.SemanticTokenTypes.namespace,
        node_1.SemanticTokenTypes.type,
        node_1.SemanticTokenTypes.class,
        node_1.SemanticTokenTypes.enum,
        node_1.SemanticTokenTypes.interface,
        node_1.SemanticTokenTypes.struct,
        node_1.SemanticTokenTypes.typeParameter,
        node_1.SemanticTokenTypes.parameter,
        node_1.SemanticTokenTypes.variable,
        node_1.SemanticTokenTypes.property,
        node_1.SemanticTokenTypes.enumMember,
        node_1.SemanticTokenTypes.event,
        node_1.SemanticTokenTypes.function,
        node_1.SemanticTokenTypes.method,
        node_1.SemanticTokenTypes.macro,
        node_1.SemanticTokenTypes.keyword,
        node_1.SemanticTokenTypes.modifier,
        node_1.SemanticTokenTypes.comment,
        node_1.SemanticTokenTypes.string,
        node_1.SemanticTokenTypes.number,
        node_1.SemanticTokenTypes.regexp,
        node_1.SemanticTokenTypes.operator
    ],
    tokenModifiers: [
        node_1.SemanticTokenModifiers.declaration,
        node_1.SemanticTokenModifiers.definition,
        node_1.SemanticTokenModifiers.readonly,
        node_1.SemanticTokenModifiers.static,
        node_1.SemanticTokenModifiers.deprecated,
        node_1.SemanticTokenModifiers.abstract,
        node_1.SemanticTokenModifiers.async,
        node_1.SemanticTokenModifiers.modification,
        node_1.SemanticTokenModifiers.documentation,
        node_1.SemanticTokenModifiers.defaultLibrary
    ]
};
/**
 * The LSP has a very specific format for semantic tokens, so this encodes our internal representation into the LSP format.
 * Currently all tokens must be single-line
 * See for more info: https://microsoft.github.io/language-server-protocol/specifications/specification-current/#textDocument_semanticTokens
 */
function encodeSemanticTokens(tokens) {
    util_1.default.sortByRange(tokens);
    const builder = new node_2.SemanticTokensBuilder();
    for (const token of tokens !== null && tokens !== void 0 ? tokens : []) {
        builder.push(token.range.start.line, token.range.start.character, token.range.end.character - token.range.start.character, 
        //token type index
        exports.semanticTokensLegend.tokenTypes.indexOf(token.tokenType), 
        //modifier bit flags
        token.tokenModifiers ? getModifierBitFlags(token.tokenModifiers) : 0);
    }
    return builder.build().data;
}
exports.encodeSemanticTokens = encodeSemanticTokens;
/**
 * Convert an array of strings into a binary bitflag integer, where each non-zero bit indiciates the index of the modifier from `semanticTokensLegend.tokenModifiers`
 */
function getModifierBitFlags(modifiers) {
    let result = 0;
    for (const modifier of modifiers) {
        const idx = exports.semanticTokensLegend.tokenModifiers.indexOf(modifier);
        if (idx === -1) {
            throw new Error(`Unknown semantic token modifier: '${modifier}'`);
        }
        //convert the index into a bit flag by bitshifting 1 the by the number of zeros for the idx.
        //example: idx=3. binary should be 0b1000, so we bitshift 1 << 3
        // eslint-disable-next-line no-bitwise
        result |= 1 << idx;
    }
    return result;
}
exports.getModifierBitFlags = getModifierBitFlags;
//# sourceMappingURL=SemanticTokenUtils.js.map
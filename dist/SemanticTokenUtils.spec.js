"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-bitwise */
const chai_config_spec_1 = require("./chai-config.spec");
const vscode_languageserver_protocol_1 = require("vscode-languageserver-protocol");
const SemanticTokenUtils_1 = require("./SemanticTokenUtils");
const util_1 = require("./util");
describe('SemanticTokenUtils', () => {
    describe('encodeSemanticTokens', () => {
        it('encodes single entry at start of line', () => {
            expectEncodeEquals((0, SemanticTokenUtils_1.encodeSemanticTokens)([{
                    range: util_1.default.createRange(1, 0, 1, 2),
                    tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.class
                }]), [
                1, 0, 2, SemanticTokenUtils_1.semanticTokensLegend.tokenTypes.indexOf(vscode_languageserver_protocol_1.SemanticTokenTypes.class), 0
            ]);
        });
        it('encodes two non-touching entries on same line', () => {
            expectEncodeEquals((0, SemanticTokenUtils_1.encodeSemanticTokens)([{
                    range: util_1.default.createRange(1, 0, 1, 2),
                    tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.class
                }, {
                    range: util_1.default.createRange(1, 10, 1, 12),
                    tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.namespace
                }]), [
                1, 0, 2, SemanticTokenUtils_1.semanticTokensLegend.tokenTypes.indexOf(vscode_languageserver_protocol_1.SemanticTokenTypes.class), 0,
                0, 10, 2, SemanticTokenUtils_1.semanticTokensLegend.tokenTypes.indexOf(vscode_languageserver_protocol_1.SemanticTokenTypes.namespace), 0
            ]);
        });
    });
    //these tests depend on the semanticTokensLegend.tokenModifiers being in a specific order. If those change order, then this test needs changed as well
    describe('getModifierBitFlags', () => {
        it('works for single modifier', () => {
            (0, chai_config_spec_1.expect)((0, SemanticTokenUtils_1.getModifierBitFlags)([vscode_languageserver_protocol_1.SemanticTokenModifiers.declaration])).to.eql(1 << 0);
            (0, chai_config_spec_1.expect)((0, SemanticTokenUtils_1.getModifierBitFlags)([vscode_languageserver_protocol_1.SemanticTokenModifiers.definition])).to.eql(1 << 1);
            (0, chai_config_spec_1.expect)((0, SemanticTokenUtils_1.getModifierBitFlags)([vscode_languageserver_protocol_1.SemanticTokenModifiers.readonly])).to.eql(1 << 2);
            (0, chai_config_spec_1.expect)((0, SemanticTokenUtils_1.getModifierBitFlags)([vscode_languageserver_protocol_1.SemanticTokenModifiers.static])).to.eql(1 << 3);
            (0, chai_config_spec_1.expect)((0, SemanticTokenUtils_1.getModifierBitFlags)([vscode_languageserver_protocol_1.SemanticTokenModifiers.deprecated])).to.eql(1 << 4);
            (0, chai_config_spec_1.expect)((0, SemanticTokenUtils_1.getModifierBitFlags)([vscode_languageserver_protocol_1.SemanticTokenModifiers.abstract])).to.eql(1 << 5);
            (0, chai_config_spec_1.expect)((0, SemanticTokenUtils_1.getModifierBitFlags)([vscode_languageserver_protocol_1.SemanticTokenModifiers.async])).to.eql(1 << 6);
            (0, chai_config_spec_1.expect)((0, SemanticTokenUtils_1.getModifierBitFlags)([vscode_languageserver_protocol_1.SemanticTokenModifiers.modification])).to.eql(1 << 7);
            (0, chai_config_spec_1.expect)((0, SemanticTokenUtils_1.getModifierBitFlags)([vscode_languageserver_protocol_1.SemanticTokenModifiers.documentation])).to.eql(1 << 8);
            (0, chai_config_spec_1.expect)((0, SemanticTokenUtils_1.getModifierBitFlags)([vscode_languageserver_protocol_1.SemanticTokenModifiers.defaultLibrary])).to.eql(1 << 9);
        });
        it('properly combines multiple modifiers', () => {
            (0, chai_config_spec_1.expect)((0, SemanticTokenUtils_1.getModifierBitFlags)([
                vscode_languageserver_protocol_1.SemanticTokenModifiers.declaration,
                vscode_languageserver_protocol_1.SemanticTokenModifiers.static,
                vscode_languageserver_protocol_1.SemanticTokenModifiers.documentation //idx=8
            ])).to.eql(0b100001001);
        });
    });
});
function expectEncodeEquals(actual, expected) {
    //results should be in multiples of 5
    (0, chai_config_spec_1.expect)(actual.length % 5).to.eql(0);
    (0, chai_config_spec_1.expect)(expected.length % 5).to.eql(0);
    (0, chai_config_spec_1.expect)(decodeSemanticTokens(actual)).to.eql(decodeSemanticTokens(expected));
}
function decodeSemanticTokens(data) {
    const result = [];
    for (let i = 0; i < data.length; i += 5) {
        result.push({
            deltaLine: data[i],
            deltaCharacter: data[i + 1],
            length: data[i + 2],
            tokenTypeIndex: data[i + 3],
            tokenModifierIndex: data[i + 4]
        });
    }
    return result;
}
//# sourceMappingURL=SemanticTokenUtils.spec.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../../../chai-config.spec");
const Parser_1 = require("../../Parser");
const TokenKind_1 = require("../../../lexer/TokenKind");
const Parser_spec_1 = require("../Parser.spec");
const vscode_languageserver_1 = require("vscode-languageserver");
describe('parser boolean expressions', () => {
    it('parses boolean ANDs', () => {
        let { statements, diagnostics } = Parser_1.Parser.parse([
            (0, Parser_spec_1.identifier)('_'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.True, 'true'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.And, 'and'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.False, 'false'),
            Parser_spec_1.EOF
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
    });
    it('parses boolean ORs', () => {
        let { statements, diagnostics } = Parser_1.Parser.parse([
            (0, Parser_spec_1.identifier)('_'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.True, 'true'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Or, 'or'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.False, 'false'),
            Parser_spec_1.EOF
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
    });
    it('location tracking', () => {
        /**
         *    0   0   0   1   1   2
         *    0   4   8   2   6   0
         *  +----------------------
         * 0| a = true and false
         */
        let { statements, diagnostics } = Parser_1.Parser.parse([
            {
                kind: TokenKind_1.TokenKind.Identifier,
                text: 'a',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(0, 0, 0, 1)
            },
            {
                kind: TokenKind_1.TokenKind.Equal,
                text: '=',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(0, 2, 0, 3)
            },
            {
                kind: TokenKind_1.TokenKind.True,
                text: 'true',
                isReserved: true,
                range: vscode_languageserver_1.Range.create(0, 4, 0, 8)
            },
            {
                kind: TokenKind_1.TokenKind.And,
                text: 'and',
                isReserved: true,
                range: vscode_languageserver_1.Range.create(0, 9, 0, 12)
            },
            {
                kind: TokenKind_1.TokenKind.False,
                text: 'false',
                isReserved: true,
                range: vscode_languageserver_1.Range.create(0, 13, 0, 18)
            },
            {
                kind: TokenKind_1.TokenKind.Eof,
                text: '\0',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(0, 18, 0, 19)
            }
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.be.lengthOf(1);
        (0, chai_config_spec_1.expect)(statements[0].value.range).deep.include(vscode_languageserver_1.Range.create(0, 4, 0, 18));
    });
});
//# sourceMappingURL=Boolean.spec.js.map
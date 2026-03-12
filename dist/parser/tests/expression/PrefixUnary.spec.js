"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../../../chai-config.spec");
const Parser_1 = require("../../Parser");
const TokenKind_1 = require("../../../lexer/TokenKind");
const Parser_spec_1 = require("../Parser.spec");
const vscode_languageserver_1 = require("vscode-languageserver");
describe('parser prefix unary expressions', () => {
    it('parses unary \'not\'', () => {
        let { statements, diagnostics } = Parser_1.Parser.parse([
            (0, Parser_spec_1.identifier)('_'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Not, 'not'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.True, 'true'),
            Parser_spec_1.EOF
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
    });
    it('parses consecutive unary \'not\'', () => {
        let { statements, diagnostics } = Parser_1.Parser.parse([
            (0, Parser_spec_1.identifier)('_'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Not, 'not'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Not, 'not'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Not, 'not'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Not, 'not'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Not, 'not'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.True, 'true'),
            Parser_spec_1.EOF
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
    });
    it('parses unary \'-\'', () => {
        let { statements, diagnostics } = Parser_1.Parser.parse([
            (0, Parser_spec_1.identifier)('_'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Minus, '-'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '5'),
            Parser_spec_1.EOF
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
    });
    it('parses consecutive unary \'-\'', () => {
        let { statements, diagnostics } = Parser_1.Parser.parse([
            (0, Parser_spec_1.identifier)('_'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Minus, '-'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Minus, '-'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Minus, '-'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Minus, '-'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Minus, '-'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '5'),
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
         * 1| _false = not true
         */
        let { statements, diagnostics } = Parser_1.Parser.parse([
            {
                kind: TokenKind_1.TokenKind.Identifier,
                text: '_false',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(0, 0, 0, 6)
            },
            {
                kind: TokenKind_1.TokenKind.Equal,
                text: '=',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(0, 7, 0, 8)
            },
            {
                kind: TokenKind_1.TokenKind.Not,
                text: 'not',
                isReserved: true,
                range: vscode_languageserver_1.Range.create(0, 9, 0, 12)
            },
            {
                kind: TokenKind_1.TokenKind.True,
                text: 'true',
                isReserved: true,
                range: vscode_languageserver_1.Range.create(0, 13, 0, 17)
            },
            {
                kind: TokenKind_1.TokenKind.Eof,
                text: '\0',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(0, 17, 0, 18)
            }
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.be.lengthOf(1);
        (0, chai_config_spec_1.expect)(statements[0].value.range).to.deep.include(vscode_languageserver_1.Range.create(0, 9, 0, 17));
    });
});
//# sourceMappingURL=PrefixUnary.spec.js.map
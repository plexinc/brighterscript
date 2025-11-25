"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../../../chai-config.spec");
const Parser_1 = require("../../Parser");
const TokenKind_1 = require("../../../lexer/TokenKind");
const Parser_spec_1 = require("../Parser.spec");
const vscode_languageserver_1 = require("vscode-languageserver");
describe('parser variable declarations', () => {
    it('allows newlines before assignments', () => {
        let { statements, diagnostics } = Parser_1.Parser.parse([
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline),
            (0, Parser_spec_1.identifier)('hasNewlines'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.True),
            Parser_spec_1.EOF
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.exist;
        (0, chai_config_spec_1.expect)(statements).not.to.be.null;
    });
    it('allows newlines after assignments', () => {
        let { statements, diagnostics } = Parser_1.Parser.parse([
            (0, Parser_spec_1.identifier)('hasNewlines'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.True),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline),
            Parser_spec_1.EOF
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.exist;
        (0, chai_config_spec_1.expect)(statements).not.to.be.null;
    });
    it('parses literal value assignments', () => {
        let { statements, diagnostics } = Parser_1.Parser.parse([
            (0, Parser_spec_1.identifier)('foo'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '5'),
            Parser_spec_1.EOF
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.exist;
        (0, chai_config_spec_1.expect)(statements).not.to.be.null;
    });
    it('parses evaluated value assignments', () => {
        let { statements, diagnostics } = Parser_1.Parser.parse([
            (0, Parser_spec_1.identifier)('bar'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '5'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Caret),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '3'),
            Parser_spec_1.EOF
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.exist;
        (0, chai_config_spec_1.expect)(statements).not.to.be.null;
    });
    it('parses variable aliasing', () => {
        let { statements, diagnostics } = Parser_1.Parser.parse([
            (0, Parser_spec_1.identifier)('baz'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal),
            (0, Parser_spec_1.identifier)('foo'),
            Parser_spec_1.EOF
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.exist;
        (0, chai_config_spec_1.expect)(statements).not.to.be.null;
    });
    it('location tracking', () => {
        /**
         *    0   0   0   1   1
         *    0   4   8   2   6
         *  +------------------
         * 0| foo = invalid
         */
        let { statements, diagnostics } = Parser_1.Parser.parse([
            {
                kind: TokenKind_1.TokenKind.Identifier,
                text: 'foo',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(0, 0, 0, 3)
            },
            {
                kind: TokenKind_1.TokenKind.Equal,
                text: '=',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(0, 4, 0, 5)
            },
            {
                kind: TokenKind_1.TokenKind.Invalid,
                text: 'invalid',
                isReserved: true,
                range: vscode_languageserver_1.Range.create(0, 6, 0, 13)
            },
            {
                kind: TokenKind_1.TokenKind.Eof,
                text: '\0',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(0, 13, 0, 14)
            }
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.be.lengthOf(1);
        (0, chai_config_spec_1.expect)(statements[0].range).to.deep.include(vscode_languageserver_1.Range.create(0, 0, 0, 13));
    });
});
//# sourceMappingURL=Declaration.spec.js.map
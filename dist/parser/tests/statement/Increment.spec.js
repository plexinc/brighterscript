"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../../../chai-config.spec");
const Parser_1 = require("../../Parser");
const TokenKind_1 = require("../../../lexer/TokenKind");
const Parser_spec_1 = require("../Parser.spec");
const vscode_languageserver_1 = require("vscode-languageserver");
const DiagnosticMessages_1 = require("../../../DiagnosticMessages");
describe('parser postfix unary expressions', () => {
    it('parses postfix \'++\' for variables', () => {
        let { statements, diagnostics } = Parser_1.Parser.parse([
            (0, Parser_spec_1.identifier)('foo'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.PlusPlus, '++'),
            Parser_spec_1.EOF
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.exist;
        (0, chai_config_spec_1.expect)(statements).not.to.be.null;
    });
    it('parses postfix \'--\' for dotted get expressions', () => {
        let { statements, diagnostics } = Parser_1.Parser.parse([
            (0, Parser_spec_1.identifier)('obj'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Dot, '.'),
            (0, Parser_spec_1.identifier)('property'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.MinusMinus, '--'),
            Parser_spec_1.EOF
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.exist;
        (0, chai_config_spec_1.expect)(statements).not.to.be.null;
    });
    it('parses postfix \'++\' for indexed get expressions', () => {
        let { statements, diagnostics } = Parser_1.Parser.parse([
            (0, Parser_spec_1.identifier)('obj'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftSquareBracket, '['),
            (0, Parser_spec_1.identifier)('property'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightSquareBracket, ']'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.PlusPlus, '++'),
            Parser_spec_1.EOF
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.exist;
        (0, chai_config_spec_1.expect)(statements).not.to.be.null;
    });
    it('disallows consecutive postfix operators', () => {
        let { diagnostics } = Parser_1.Parser.parse([
            (0, Parser_spec_1.identifier)('foo'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.PlusPlus, '++'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.PlusPlus, '++'),
            Parser_spec_1.EOF
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(1);
        (0, chai_config_spec_1.expect)(diagnostics[0]).deep.include({
            message: 'Consecutive increment/decrement operators are not allowed'
        });
    });
    it('disallows postfix \'--\' for function call results', () => {
        let { diagnostics } = Parser_1.Parser.parse([
            (0, Parser_spec_1.identifier)('func'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftParen, '('),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.MinusMinus, '--'),
            Parser_spec_1.EOF
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(1);
        (0, chai_config_spec_1.expect)(diagnostics[0]).to.deep.include(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.incrementDecrementOperatorsAreNotAllowedAsResultOfFunctionCall()));
    });
    it('allows \'++\' at the end of a function', () => {
        let { statements, diagnostics } = Parser_1.Parser.parse([
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Sub, 'sub'),
            (0, Parser_spec_1.identifier)('foo'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftParen, '('),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
            (0, Parser_spec_1.identifier)('someValue'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.PlusPlus, '++'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.EndSub, 'end sub'),
            Parser_spec_1.EOF
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.exist;
        (0, chai_config_spec_1.expect)(statements).not.to.be.null;
    });
    it('location tracking', () => {
        /**
         *    0   0   0   1
         *    0   4   8   2
         *  +--------------
         * 0| someNumber++
         */
        let { statements, diagnostics } = Parser_1.Parser.parse([
            {
                kind: TokenKind_1.TokenKind.Identifier,
                text: 'someNumber',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(0, 0, 0, 10)
            },
            {
                kind: TokenKind_1.TokenKind.PlusPlus,
                text: '++',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(0, 10, 0, 12)
            },
            {
                kind: TokenKind_1.TokenKind.Eof,
                text: '\0',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(0, 12, 0, 13)
            }
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.be.lengthOf(1);
        (0, chai_config_spec_1.expect)(statements[0].range).deep.include(vscode_languageserver_1.Range.create(0, 0, 0, 12));
    });
});
//# sourceMappingURL=Increment.spec.js.map
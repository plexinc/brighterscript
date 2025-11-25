"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../../../chai-config.spec");
const Parser_1 = require("../../Parser");
const TokenKind_1 = require("../../../lexer/TokenKind");
const Parser_spec_1 = require("../Parser.spec");
const vscode_languageserver_1 = require("vscode-languageserver");
describe('parser return statements', () => {
    it('parses void returns', () => {
        let { statements, diagnostics } = Parser_1.Parser.parse([
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Function, 'function'),
            (0, Parser_spec_1.identifier)('foo'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftParen, '('),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\\n'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Return, 'return'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\\n'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.EndFunction, 'end function'),
            Parser_spec_1.EOF
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.ok;
    });
    it('parses literal returns', () => {
        let { statements, diagnostics } = Parser_1.Parser.parse([
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Function, 'function'),
            (0, Parser_spec_1.identifier)('foo'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftParen, '('),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\\n'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Return, 'return'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.StringLiteral, '"test"'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\\n'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.EndFunction, 'end function'),
            Parser_spec_1.EOF
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.be.ok;
    });
    it('parses expression returns', () => {
        let { statements, diagnostics } = Parser_1.Parser.parse([
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Function, 'function'),
            (0, Parser_spec_1.identifier)('foo'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftParen, '('),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\\n'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Return, 'return'),
            (0, Parser_spec_1.identifier)('RebootSystem'),
            { kind: TokenKind_1.TokenKind.LeftParen, text: '(', range: null },
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\\n'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.EndFunction, 'end function'),
            Parser_spec_1.EOF
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.be.ok;
    });
    it('location tracking', () => {
        var _a;
        /**
         *    0   0   0   1   1
         *    0   4   8   2   6
         *  +------------------
         * 0| function foo()
         * 1|   return 5
         * 2| end function
         */
        let { statements, diagnostics } = Parser_1.Parser.parse([
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Function, 'function'),
            (0, Parser_spec_1.identifier)('foo'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftParen, '('),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\\n'),
            {
                kind: TokenKind_1.TokenKind.Return,
                text: 'return',
                isReserved: true,
                range: vscode_languageserver_1.Range.create(1, 2, 1, 8)
            },
            {
                kind: TokenKind_1.TokenKind.IntegerLiteral,
                text: '5',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(1, 9, 1, 10)
            },
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\\n'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.EndFunction, 'end function'),
            Parser_spec_1.EOF
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)((_a = statements[0].func.body.statements[0]) === null || _a === void 0 ? void 0 : _a.range).to.exist.and.to.deep.include(vscode_languageserver_1.Range.create(1, 2, 1, 10));
    });
});
//# sourceMappingURL=ReturnStatement.spec.js.map
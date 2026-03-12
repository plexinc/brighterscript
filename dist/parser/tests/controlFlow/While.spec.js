"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../../../chai-config.spec");
const Parser_1 = require("../../Parser");
const TokenKind_1 = require("../../../lexer/TokenKind");
const Parser_spec_1 = require("../Parser.spec");
const vscode_languageserver_1 = require("vscode-languageserver");
describe('parser while statements', () => {
    it('while without exit', () => {
        const { statements, diagnostics } = Parser_1.Parser.parse([
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.While, 'while'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.True, 'true'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Print, 'print'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.StringLiteral, 'looping'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.EndWhile, 'end while'),
            Parser_spec_1.EOF
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
    });
    it('while with exit', () => {
        const { statements, diagnostics } = Parser_1.Parser.parse([
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.While, 'while'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.True, 'true'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Print, 'print'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.StringLiteral, 'looping'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.ExitWhile, 'exit while'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.EndWhile, 'end while'),
            Parser_spec_1.EOF
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
    });
    it('supports trailing colon at end of condition', () => {
        var _a;
        const parser = Parser_1.Parser.parse(`
            while i > 0:
                print "while"
            end while
        `);
        (0, chai_config_spec_1.expect)((_a = parser.diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).to.be.undefined;
    });
    it('catches unterminated while reaching function boundary', () => {
        const parser = Parser_1.Parser.parse(`
            function test()
                while i > 0:
                    print "while"
            end function
        `);
        (0, chai_config_spec_1.expect)(parser.diagnostics).to.be.lengthOf(1);
        (0, chai_config_spec_1.expect)(parser.statements).to.be.lengthOf(1);
        (0, chai_config_spec_1.expect)(parser.references.functionStatements[0].func.body.statements).to.be.lengthOf(1);
    });
    it('location tracking', () => {
        var _a;
        /**
         *    0   0   0   1   1
         *    0   4   8   2   6
         *  +------------------
         * 0| while true
         * 1|   Rnd(0)
         * 2| end while
         */
        const { statements, diagnostics } = Parser_1.Parser.parse([
            {
                kind: TokenKind_1.TokenKind.While,
                text: 'while',
                isReserved: true,
                range: vscode_languageserver_1.Range.create(0, 0, 0, 5)
            },
            {
                kind: TokenKind_1.TokenKind.True,
                text: 'true',
                isReserved: true,
                range: vscode_languageserver_1.Range.create(0, 6, 0, 10)
            },
            {
                kind: TokenKind_1.TokenKind.Newline,
                text: '\n',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(0, 10, 0, 11)
            },
            // loop body isn't significant for location tracking, so helper functions are safe
            (0, Parser_spec_1.identifier)('Rnd'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftParen, '('),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
            {
                kind: TokenKind_1.TokenKind.EndWhile,
                text: 'end while',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(2, 0, 2, 9)
            },
            Parser_spec_1.EOF
        ]);
        (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).not.to.exist;
        (0, chai_config_spec_1.expect)(statements).to.be.lengthOf(1);
        (0, chai_config_spec_1.expect)(statements[0].range).deep.include(vscode_languageserver_1.Range.create(0, 0, 2, 9));
    });
});
//# sourceMappingURL=While.spec.js.map
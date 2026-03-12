"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../../../chai-config.spec");
const Parser_1 = require("../../Parser");
const TokenKind_1 = require("../../../lexer/TokenKind");
const Parser_spec_1 = require("../Parser.spec");
const vscode_languageserver_1 = require("vscode-languageserver");
const Expression_1 = require("../../Expression");
describe('parser for loops', () => {
    it('accepts a \'step\' clause', () => {
        var _a;
        let { statements, diagnostics } = Parser_1.Parser.parse([
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.For, 'for'),
            (0, Parser_spec_1.identifier)('i'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '0'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.To, 'to'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '5'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Step, 'step'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '2'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
            // body would go here, but it's not necessary for this test
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.EndFor, 'end for'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
            Parser_spec_1.EOF
        ]);
        const statement = statements[0];
        (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).not.to.exist;
        (0, chai_config_spec_1.expect)(statement.increment).to.be.instanceof(Expression_1.LiteralExpression);
        (0, chai_config_spec_1.expect)(statement.increment.token.text).to.equal('2');
    });
    it('supports omitted \'step\' clause', () => {
        var _a;
        let { statements, diagnostics } = Parser_1.Parser.parse([
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.For, 'for'),
            (0, Parser_spec_1.identifier)('i'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '0'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.To, 'to'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '5'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
            // body would go here, but it's not necessary for this test
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.EndFor, 'end for'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
            Parser_spec_1.EOF
        ]);
        (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).not.to.exist;
        (0, chai_config_spec_1.expect)(statements[0].increment).not.to.exist;
    });
    it('catches unterminated for reaching function boundary', () => {
        const parser = Parser_1.Parser.parse(`
            function test()
                for i = 1 to 10
                    print "while"
            end function
        `);
        (0, chai_config_spec_1.expect)(parser.diagnostics).to.be.lengthOf(1);
        (0, chai_config_spec_1.expect)(parser.statements).to.be.lengthOf(1);
        (0, chai_config_spec_1.expect)(parser.references.functionStatements[0].func.body.statements).to.be.lengthOf(1);
    });
    it('allows \'next\' to terminate loop', () => {
        let { statements, diagnostics } = Parser_1.Parser.parse([
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.For, 'for'),
            (0, Parser_spec_1.identifier)('i'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '0'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.To, 'to'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '5'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
            // body would go here, but it's not necessary for this test
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Next, 'next'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
            Parser_spec_1.EOF
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
    });
    it('supports a single trailing colon after the `to` expression', () => {
        var _a;
        const parser = Parser_1.Parser.parse(`
            for i = 1 to 3:
                print "for"
            end for
        `);
        (0, chai_config_spec_1.expect)((_a = parser.diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).to.be.undefined;
    });
    it('location tracking', () => {
        /**
         *    0   0   0   1   1
         *    0   4   8   2   6
         *  +------------------
         * 0| for i = 0 to 10
         * 1|   Rnd(i)
         * 2| end for
         */
        let { statements, diagnostics } = Parser_1.Parser.parse([
            {
                kind: TokenKind_1.TokenKind.For,
                text: 'for',
                isReserved: true,
                range: vscode_languageserver_1.Range.create(0, 0, 0, 3)
            },
            {
                kind: TokenKind_1.TokenKind.Identifier,
                text: 'i',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(0, 4, 0, 5)
            },
            {
                kind: TokenKind_1.TokenKind.Equal,
                text: '=',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(0, 6, 0, 7)
            },
            {
                kind: TokenKind_1.TokenKind.IntegerLiteral,
                text: '0',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(0, 8, 0, 9)
            },
            {
                kind: TokenKind_1.TokenKind.To,
                text: 'to',
                isReserved: false,
                range: {
                    start: { line: 0, character: 10 },
                    end: { line: 0, character: 12 }
                }
            },
            {
                kind: TokenKind_1.TokenKind.IntegerLiteral,
                text: '10',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(0, 13, 0, 15)
            },
            {
                kind: TokenKind_1.TokenKind.Newline,
                text: '\n',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(0, 15, 0, 16)
            },
            // loop body isn't significant for location tracking, so helper functions are safe
            (0, Parser_spec_1.identifier)('Rnd'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftParen, '('),
            (0, Parser_spec_1.identifier)('i'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
            {
                kind: TokenKind_1.TokenKind.EndFor,
                text: 'end for',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(2, 0, 2, 8)
            },
            Parser_spec_1.EOF
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.be.lengthOf(1);
        (0, chai_config_spec_1.expect)(statements[0].range).to.deep.include(vscode_languageserver_1.Range.create(0, 0, 2, 8));
    });
});
//# sourceMappingURL=For.spec.js.map
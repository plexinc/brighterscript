"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../../../chai-config.spec");
const Parser_1 = require("../../Parser");
const TokenKind_1 = require("../../../lexer/TokenKind");
const Parser_spec_1 = require("../Parser.spec");
const vscode_languageserver_1 = require("vscode-languageserver");
describe('parser indexed assignment', () => {
    describe('dotted', () => {
        it('assigns anonymous functions', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.identifier)('foo'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Dot, '.'),
                (0, Parser_spec_1.identifier)('bar'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Function, 'function'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftParen, '('),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.EndFunction, 'end function'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.empty;
            (0, chai_config_spec_1.expect)(statements).to.exist;
            (0, chai_config_spec_1.expect)(statements).not.to.be.null;
        });
        it('assigns boolean expressions', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.identifier)('foo'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Dot, '.'),
                (0, Parser_spec_1.identifier)('bar'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.True, 'true'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.And, 'and'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.False, 'false'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\\n'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.empty;
            (0, chai_config_spec_1.expect)(statements).to.exist;
            (0, chai_config_spec_1.expect)(statements).not.to.be.null;
        });
        it('assignment operator', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.identifier)('foo'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Dot, '.'),
                (0, Parser_spec_1.identifier)('bar'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.StarEqual, '*='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '5'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\\n'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.empty;
            (0, chai_config_spec_1.expect)(statements).to.exist;
            (0, chai_config_spec_1.expect)(statements).not.to.be.null;
        });
    });
    describe('bracketed', () => {
        it('assigns anonymous functions', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.identifier)('someArray'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftSquareBracket, '['),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '0'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightSquareBracket, ']'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Function, 'function'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftParen, '('),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.EndFunction, 'end function'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.empty;
            (0, chai_config_spec_1.expect)(statements).to.exist;
            (0, chai_config_spec_1.expect)(statements).not.to.be.null;
        });
        it('assigns boolean expressions', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.identifier)('someArray'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftSquareBracket, '['),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '0'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightSquareBracket, ']'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.True, 'true'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.And, 'and'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.False, 'false'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\\n'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.empty;
            (0, chai_config_spec_1.expect)(statements).to.exist;
            (0, chai_config_spec_1.expect)(statements).not.to.be.null;
        });
        it('assignment operator', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.identifier)('someArray'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftSquareBracket, '['),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '0'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightSquareBracket, ']'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.StarEqual, '*='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '3'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.empty;
            (0, chai_config_spec_1.expect)(statements).to.exist;
            (0, chai_config_spec_1.expect)(statements).not.to.be.null;
        });
    });
    it('location tracking', () => {
        /**
         *    0   0   0   1   1
         *    0   4   8   2   6
         *  +------------------
         * 0| arr[0] = 1
         * 1| obj.a = 5
         */
        let { statements, diagnostics } = Parser_1.Parser.parse([
            {
                kind: TokenKind_1.TokenKind.Identifier,
                text: 'arr',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(0, 0, 0, 3),
                leadingWhitespace: ''
            },
            {
                kind: TokenKind_1.TokenKind.LeftSquareBracket,
                text: '[',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(0, 3, 0, 4),
                leadingWhitespace: ''
            },
            {
                kind: TokenKind_1.TokenKind.IntegerLiteral,
                text: '0',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(0, 4, 0, 5),
                leadingWhitespace: ''
            },
            {
                kind: TokenKind_1.TokenKind.RightSquareBracket,
                text: ']',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(0, 5, 0, 6),
                leadingWhitespace: ''
            },
            {
                kind: TokenKind_1.TokenKind.Equal,
                text: '=',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(0, 7, 0, 8),
                leadingWhitespace: ''
            },
            {
                kind: TokenKind_1.TokenKind.IntegerLiteral,
                text: '1',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(0, 9, 0, 10),
                leadingWhitespace: ''
            },
            {
                kind: TokenKind_1.TokenKind.Newline,
                text: '\n',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(0, 10, 0, 11),
                leadingWhitespace: ''
            },
            {
                kind: TokenKind_1.TokenKind.Identifier,
                text: 'obj',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(1, 0, 1, 3),
                leadingWhitespace: ''
            },
            {
                kind: TokenKind_1.TokenKind.Dot,
                text: '.',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(1, 3, 1, 4),
                leadingWhitespace: ''
            },
            {
                kind: TokenKind_1.TokenKind.Identifier,
                text: 'a',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(1, 4, 1, 5),
                leadingWhitespace: ''
            },
            {
                kind: TokenKind_1.TokenKind.Equal,
                text: '=',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(1, 6, 1, 7),
                leadingWhitespace: ''
            },
            {
                kind: TokenKind_1.TokenKind.IntegerLiteral,
                text: '5',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(1, 8, 1, 9),
                leadingWhitespace: ''
            },
            {
                kind: TokenKind_1.TokenKind.Eof,
                text: '\0',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(1, 10, 1, 11),
                leadingWhitespace: ''
            }
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.empty;
        (0, chai_config_spec_1.expect)(statements).to.be.lengthOf(2);
        (0, chai_config_spec_1.expect)(statements.map(s => s.range)).to.deep.equal([
            vscode_languageserver_1.Range.create(0, 0, 0, 10),
            vscode_languageserver_1.Range.create(1, 0, 1, 9)
        ]);
    });
});
//# sourceMappingURL=Set.spec.js.map
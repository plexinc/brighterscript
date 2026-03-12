"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../../../chai-config.spec");
const Parser_1 = require("../../Parser");
const TokenKind_1 = require("../../../lexer/TokenKind");
const Parser_spec_1 = require("../Parser.spec");
const vscode_languageserver_1 = require("vscode-languageserver");
describe('parser', () => {
    describe('function expressions', () => {
        it('parses minimal empty function expressions', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.identifier)('_'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Function, 'function'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftParen, '('),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.EndFunction, 'end function'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        });
        it('parses colon-separated function declarations', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.identifier)('_'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Function, 'function'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftParen, '('),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Colon, ':'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Print, 'print'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.StringLiteral, 'Lorem ipsum'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Colon, ':'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.EndFunction, 'end function'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        });
        it('parses non-empty function expressions', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.identifier)('_'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Function, 'function'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftParen, '('),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Print, 'print'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.StringLiteral, 'Lorem ipsum'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.EndFunction, 'end function'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        });
        it('parses functions with implicit-dynamic arguments', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.identifier)('_'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Function, 'function'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftParen, '('),
                (0, Parser_spec_1.identifier)('a'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Comma, ','),
                (0, Parser_spec_1.identifier)('b'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.EndFunction, 'end function'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        });
        it('parses functions with typed arguments', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.identifier)('_'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Function, 'function'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftParen, '('),
                (0, Parser_spec_1.identifier)('str'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.As, 'as'),
                (0, Parser_spec_1.identifier)('string'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Comma, ','),
                (0, Parser_spec_1.identifier)('count'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.As, 'as'),
                (0, Parser_spec_1.identifier)('integer'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Comma, ','),
                (0, Parser_spec_1.identifier)('separator'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.As, 'as'),
                (0, Parser_spec_1.identifier)('object'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.EndFunction, 'end function'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        });
        it('parses functions with default argument expressions', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.identifier)('_'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Function, 'function'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftParen, '('),
                (0, Parser_spec_1.identifier)('a'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '3'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Comma, ','),
                (0, Parser_spec_1.identifier)('b'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '4'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Comma, ','),
                (0, Parser_spec_1.identifier)('c'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.identifier)('a'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Plus, '+'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '5'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.EndFunction, 'end function'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        });
        it('parses functions with typed arguments and default expressions', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.identifier)('_'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Function, 'function'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftParen, '('),
                (0, Parser_spec_1.identifier)('a'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '3'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.As, 'as'),
                (0, Parser_spec_1.identifier)('integer'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Comma, ','),
                (0, Parser_spec_1.identifier)('b'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.identifier)('a'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Plus, '+'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '5'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.As, 'as'),
                (0, Parser_spec_1.identifier)('integer'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.EndFunction, 'end function'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        });
        it('parses return types', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.identifier)('_'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Function, 'function'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftParen, '('),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.As, 'as'),
                (0, Parser_spec_1.identifier)('void'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.EndFunction, 'end function'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        });
    });
    describe('sub expressions', () => {
        it('parses minimal sub expressions', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.identifier)('_'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Sub, 'sub'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftParen, '('),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.EndSub, 'end sub'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        });
        it('parses non-empty sub expressions', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.identifier)('_'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Sub, 'sub'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftParen, '('),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Print, 'print'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.StringLiteral, 'Lorem ipsum'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.EndSub, 'end sub'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        });
        it('parses subs with implicit-dynamic arguments', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.identifier)('_'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Function, 'sub'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftParen, '('),
                (0, Parser_spec_1.identifier)('a'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Comma, ','),
                (0, Parser_spec_1.identifier)('b'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.EndFunction, 'end sub'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        });
        it('parses subs with typed arguments', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.identifier)('_'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Function, 'sub'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftParen, '('),
                (0, Parser_spec_1.identifier)('str'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.As, 'as'),
                (0, Parser_spec_1.identifier)('string'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Comma, ','),
                (0, Parser_spec_1.identifier)('count'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.As, 'as'),
                (0, Parser_spec_1.identifier)('integer'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Comma, ','),
                (0, Parser_spec_1.identifier)('cb'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.As, 'as'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Function, 'function'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.EndFunction, 'end sub'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        });
        it('parses subs with default argument expressions', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.identifier)('_'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Sub, 'sub'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftParen, '('),
                (0, Parser_spec_1.identifier)('a'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '3'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Comma, ','),
                (0, Parser_spec_1.identifier)('b'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '4'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Comma, ','),
                (0, Parser_spec_1.identifier)('c'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.identifier)('a'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Plus, '+'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '5'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.EndSub, 'end sub'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        });
        it('parses subs with typed arguments and default expressions', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.identifier)('_'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Sub, 'sub'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftParen, '('),
                (0, Parser_spec_1.identifier)('a'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '3'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.As, 'as'),
                (0, Parser_spec_1.identifier)('integer'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Comma, ','),
                (0, Parser_spec_1.identifier)('b'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.identifier)('a'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Plus, '+'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '5'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.As, 'as'),
                (0, Parser_spec_1.identifier)('integer'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.EndSub, 'end sub'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        });
    });
    describe('usage', () => {
        it('allows sub expressions in call arguments', () => {
            const { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.identifier)('acceptsCallback'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftParen, '('),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Function, 'function'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftParen, '('),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Print, 'print'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.StringLiteral, 'I\'m a callback'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.EndFunction, 'end function'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        });
        it('allows function expressions in assignment RHS', () => {
            const { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.identifier)('anonymousFunction'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Function, 'function'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftParen, '('),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Print, 'print'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.StringLiteral, 'I\'m anonymous'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.EndFunction, 'end function'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        });
    });
    it('location tracking', () => {
        /**
         *    0   0   0   1   1
         *    0   4   8   2   6
         *  +------------------
         * 0| _ = sub foo()
         * 1|
         * 2| end sub
         */
        let { statements, diagnostics } = Parser_1.Parser.parse([
            {
                kind: TokenKind_1.TokenKind.Identifier,
                text: '_',
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
                kind: TokenKind_1.TokenKind.Sub,
                text: 'sub',
                isReserved: true,
                range: vscode_languageserver_1.Range.create(0, 4, 0, 7)
            },
            {
                kind: TokenKind_1.TokenKind.LeftParen,
                text: '(',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(0, 11, 0, 12)
            },
            {
                kind: TokenKind_1.TokenKind.RightParen,
                text: ')',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(0, 12, 0, 13)
            },
            {
                kind: TokenKind_1.TokenKind.Newline,
                text: '\n',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(0, 13, 0, 14)
            },
            {
                kind: TokenKind_1.TokenKind.EndSub,
                text: 'end sub',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(2, 0, 2, 7)
            },
            {
                kind: TokenKind_1.TokenKind.Eof,
                text: '\0',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(2, 7, 2, 8)
            }
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.be.lengthOf(1);
        (0, chai_config_spec_1.expect)(statements[0].value.range).to.deep.include(vscode_languageserver_1.Range.create(0, 4, 2, 7));
    });
});
//# sourceMappingURL=Function.spec.js.map
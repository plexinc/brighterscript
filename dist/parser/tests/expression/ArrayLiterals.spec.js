"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../../../chai-config.spec");
const Parser_1 = require("../../Parser");
const TokenKind_1 = require("../../../lexer/TokenKind");
const Parser_spec_1 = require("../Parser.spec");
const vscode_languageserver_1 = require("vscode-languageserver");
const testHelpers_spec_1 = require("../../../testHelpers.spec");
const DiagnosticMessages_1 = require("../../../DiagnosticMessages");
const reflection_1 = require("../../../astUtils/reflection");
describe('parser array literals', () => {
    describe('empty arrays', () => {
        it('on one line', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.identifier)('_'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftSquareBracket, '['),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightSquareBracket, ']'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        });
        it('on multiple lines', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.identifier)('_'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftSquareBracket, '['),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightSquareBracket, ']'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        });
    });
    describe('filled arrays', () => {
        it('on one line', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.identifier)('_'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftSquareBracket, '['),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '1'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Comma, ','),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '2'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Comma, ','),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '3'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightSquareBracket, ']'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        });
        it('on multiple lines with commas', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.identifier)('_'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftSquareBracket, '['),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '1'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Comma, ','),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '2'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Comma, ','),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '3'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightSquareBracket, ']'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        });
        it('on multiple lines without commas', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.identifier)('_'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftSquareBracket, '['),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '1'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '2'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '3'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightSquareBracket, ']'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        });
    });
    describe('contents', () => {
        it('can contain primitives', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.identifier)('_'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftSquareBracket, '['),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '1'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Comma, ','),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '2'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Comma, ','),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '3'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightSquareBracket, ']'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        });
        it('can contain other arrays', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.identifier)('_'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftSquareBracket, '['),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftSquareBracket, '['),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '1'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Comma, ','),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '2'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Comma, ','),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '3'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightSquareBracket, ']'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Comma, ','),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftSquareBracket, '['),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '4'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Comma, ','),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '5'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Comma, ','),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '6'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightSquareBracket, ']'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightSquareBracket, ']'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        });
        it('can contain expressions', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.identifier)('_'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftSquareBracket, '['),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '1'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Plus, '+'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '2'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Comma, ','),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Not, 'not'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.False, 'false'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightSquareBracket, ']'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        });
    });
    describe('unfinished', () => {
        it('will still be parsed', () => {
            // no closing brace:
            let { statements, diagnostics } = Parser_1.Parser.parse(`_ = [1, data.foo`);
            (0, testHelpers_spec_1.expectDiagnostics)(diagnostics, [DiagnosticMessages_1.DiagnosticMessages.unmatchedLeftSquareBraceAfterArrayLiteral()]);
            (0, chai_config_spec_1.expect)(statements).to.be.lengthOf(1);
            (0, chai_config_spec_1.expect)((0, reflection_1.isAssignmentStatement)(statements[0])).to.be.true;
            const assignStmt = statements[0];
            (0, chai_config_spec_1.expect)((0, reflection_1.isArrayLiteralExpression)(assignStmt.value));
            const arryLitExpr = assignStmt.value;
            (0, chai_config_spec_1.expect)((0, reflection_1.isLiteralExpression)(arryLitExpr.elements[0])).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isDottedGetExpression)(arryLitExpr.elements[1])).to.be.true;
        });
        it('gets correct diagnostic for missing square brace without elements', () => {
            let { diagnostics } = Parser_1.Parser.parse(`
                sub setData()
                    m.data = [
                end sub
            `);
            (0, testHelpers_spec_1.expectDiagnosticsIncludes)(diagnostics, [
                DiagnosticMessages_1.DiagnosticMessages.unmatchedLeftSquareBraceAfterArrayLiteral()
            ]);
        });
        it('gets correct diagnostic for missing curly brace with elements', () => {
            let { diagnostics } = Parser_1.Parser.parse(`
                sub setData()
                    m.data = [1,2,3
                end sub
            `);
            (0, testHelpers_spec_1.expectDiagnosticsIncludes)(diagnostics, [
                DiagnosticMessages_1.DiagnosticMessages.unmatchedLeftSquareBraceAfterArrayLiteral()
            ]);
        });
    });
    it('location tracking', () => {
        /**
         *    0   0   0   1
         *    0   4   8   2
         *  +--------------
         * 0| a = [   ]
         * 1|
         * 2| b = [
         * 3|
         * 4|
         * 5| ]
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
                kind: TokenKind_1.TokenKind.LeftSquareBracket,
                text: '[',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(0, 4, 0, 5)
            },
            {
                kind: TokenKind_1.TokenKind.RightSquareBracket,
                text: ']',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(0, 8, 0, 9)
            },
            {
                kind: TokenKind_1.TokenKind.Newline,
                text: '\n',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(0, 9, 0, 10)
            },
            {
                kind: TokenKind_1.TokenKind.Newline,
                text: '\n',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(1, 0, 1, 1)
            },
            {
                kind: TokenKind_1.TokenKind.Identifier,
                text: 'b',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(2, 0, 2, 1)
            },
            {
                kind: TokenKind_1.TokenKind.Equal,
                text: '=',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(2, 2, 2, 3)
            },
            {
                kind: TokenKind_1.TokenKind.LeftSquareBracket,
                text: '[',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(2, 4, 2, 5)
            },
            {
                kind: TokenKind_1.TokenKind.Newline,
                text: '\n',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(3, 0, 3, 1)
            },
            {
                kind: TokenKind_1.TokenKind.Newline,
                text: '\n',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(4, 0, 4, 1)
            },
            {
                kind: TokenKind_1.TokenKind.RightSquareBracket,
                text: ']',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(5, 0, 5, 1)
            },
            {
                kind: TokenKind_1.TokenKind.Eof,
                text: '',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(5, 1, 5, 2)
            }
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.be.lengthOf(2);
        (0, chai_config_spec_1.expect)(statements[0].value.range).deep.include(vscode_languageserver_1.Range.create(0, 4, 0, 9));
        (0, chai_config_spec_1.expect)(statements[1].value.range).deep.include(vscode_languageserver_1.Range.create(2, 4, 5, 1));
    });
});
//# sourceMappingURL=ArrayLiterals.spec.js.map
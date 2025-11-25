"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../../../chai-config.spec");
const Parser_1 = require("../../Parser");
const TokenKind_1 = require("../../../lexer/TokenKind");
const Parser_spec_1 = require("../Parser.spec");
const vscode_languageserver_1 = require("vscode-languageserver");
const DiagnosticMessages_1 = require("../../../DiagnosticMessages");
const Statement_1 = require("../../Statement");
const testHelpers_spec_1 = require("../../../testHelpers.spec");
const reflection_1 = require("../../../astUtils/reflection");
const visitors_1 = require("../../../astUtils/visitors");
describe('parser indexing', () => {
    describe('one level', () => {
        it('dotted', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.identifier)('_'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.identifier)('foo'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Dot, '.'),
                (0, Parser_spec_1.identifier)('bar'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.exist;
            (0, chai_config_spec_1.expect)(statements).not.to.be.null;
        });
        it('bracketed', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.identifier)('_'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.identifier)('foo'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftSquareBracket, '['),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '2'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightSquareBracket, ']'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.exist;
            (0, chai_config_spec_1.expect)(statements).not.to.be.null;
        });
        describe('dotted and bracketed', () => {
            it('single dot', () => {
                let { statements, diagnostics } = Parser_1.Parser.parse([
                    (0, Parser_spec_1.identifier)('_'),
                    (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                    (0, Parser_spec_1.identifier)('foo'),
                    (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Dot, '.'),
                    (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftSquareBracket, '['),
                    (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Integer, '2'),
                    (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightSquareBracket, ']'),
                    Parser_spec_1.EOF
                ]);
                (0, chai_config_spec_1.expect)(diagnostics).to.be.empty;
                (0, chai_config_spec_1.expect)(statements[0]).to.be.instanceof(Statement_1.AssignmentStatement);
            });
            it('multiple dots', () => {
                let { diagnostics, statements } = Parser_1.Parser.parse([
                    (0, Parser_spec_1.identifier)('_'),
                    (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                    (0, Parser_spec_1.identifier)('foo'),
                    (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Dot, '.'),
                    (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Dot, '.'),
                    (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Dot, '.'),
                    (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftSquareBracket, '['),
                    (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Integer, '2'),
                    (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightSquareBracket, ']'),
                    (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline),
                    Parser_spec_1.EOF
                ]);
                (0, chai_config_spec_1.expect)(diagnostics.length).to.equal(3);
                (0, testHelpers_spec_1.expectDiagnostics)(diagnostics, [
                    DiagnosticMessages_1.DiagnosticMessages.expectedPropertyNameAfterPeriod(),
                    DiagnosticMessages_1.DiagnosticMessages.expectedNewlineOrColon(),
                    DiagnosticMessages_1.DiagnosticMessages.unexpectedToken('.') // everything after the 2nd dot is ignored
                ]);
                // expect statement "_ = foo" to still be included
                (0, chai_config_spec_1.expect)(statements.length).to.equal(1);
            });
        });
        it('location tracking', () => {
            /**
             *    0   0   0   1
             *    0   4   8   2
             *  +--------------
             * 0| a = foo.bar
             * 1| b = foo[2]
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
                    kind: TokenKind_1.TokenKind.Identifier,
                    text: 'foo',
                    isReserved: false,
                    range: vscode_languageserver_1.Range.create(0, 4, 0, 7)
                },
                {
                    kind: TokenKind_1.TokenKind.Dot,
                    text: '.',
                    isReserved: false,
                    range: vscode_languageserver_1.Range.create(0, 7, 0, 8)
                },
                {
                    kind: TokenKind_1.TokenKind.Identifier,
                    text: 'bar',
                    isReserved: false,
                    range: vscode_languageserver_1.Range.create(0, 8, 0, 11)
                },
                {
                    kind: TokenKind_1.TokenKind.Newline,
                    text: '\n',
                    isReserved: false,
                    range: vscode_languageserver_1.Range.create(0, 11, 0, 12)
                },
                {
                    kind: TokenKind_1.TokenKind.Identifier,
                    text: 'b',
                    isReserved: false,
                    range: vscode_languageserver_1.Range.create(1, 0, 1, 1)
                },
                {
                    kind: TokenKind_1.TokenKind.Equal,
                    text: '=',
                    isReserved: false,
                    range: vscode_languageserver_1.Range.create(1, 2, 1, 3)
                },
                {
                    kind: TokenKind_1.TokenKind.Identifier,
                    text: 'bar',
                    isReserved: false,
                    range: vscode_languageserver_1.Range.create(1, 4, 1, 7)
                },
                {
                    kind: TokenKind_1.TokenKind.LeftSquareBracket,
                    text: '[',
                    isReserved: false,
                    range: vscode_languageserver_1.Range.create(1, 7, 1, 8)
                },
                {
                    kind: TokenKind_1.TokenKind.IntegerLiteral,
                    text: '2',
                    isReserved: false,
                    range: vscode_languageserver_1.Range.create(1, 8, 1, 9)
                },
                {
                    kind: TokenKind_1.TokenKind.RightSquareBracket,
                    text: ']',
                    isReserved: false,
                    range: vscode_languageserver_1.Range.create(1, 9, 1, 10)
                },
                {
                    kind: TokenKind_1.TokenKind.Eof,
                    text: '\0',
                    isReserved: false,
                    range: vscode_languageserver_1.Range.create(1, 10, 1, 11)
                }
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.be.lengthOf(2);
            (0, chai_config_spec_1.expect)(statements.map(s => s.value.range)).to.deep.equal([
                vscode_languageserver_1.Range.create(0, 4, 0, 11),
                vscode_languageserver_1.Range.create(1, 4, 1, 10)
            ]);
        });
    });
    it('walks every index in the indexed get', () => {
        const parser = Parser_1.Parser.parse(`
            result = arr[0, 1, 2]
        `);
        const nodes = [];
        parser.ast.findChild(reflection_1.isAssignmentStatement).value.walk((x) => {
            if ((0, reflection_1.isLiteralExpression)(x)) {
                nodes.push(x.token.text);
            }
        }, { walkMode: visitors_1.WalkMode.visitAllRecursive });
        (0, chai_config_spec_1.expect)(nodes).to.eql(['0', '1', '2']);
    });
    it('walks every index in the indexed get', () => {
        const parser = Parser_1.Parser.parse(`
            arr[0, 1, 2] = "value"
        `);
        const nodes = [];
        parser.ast.findChild(reflection_1.isIndexedSetStatement).walk((x) => {
            if ((0, reflection_1.isLiteralExpression)(x)) {
                nodes.push(x.token.text);
            }
        }, { walkMode: visitors_1.WalkMode.visitAllRecursive });
        (0, chai_config_spec_1.expect)(nodes).to.eql(['0', '1', '2', '"value"']);
    });
    describe('multi-level', () => {
        it('dotted', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.identifier)('_'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.identifier)('foo'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Dot, '.'),
                (0, Parser_spec_1.identifier)('bar'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        });
        it('bracketed', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.identifier)('_'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.identifier)('foo'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftSquareBracket, '['),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '2'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightSquareBracket, ']'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftSquareBracket, '['),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '0'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightSquareBracket, ']'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftSquareBracket, '['),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '6'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightSquareBracket, ']'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        });
        it('mixed', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.identifier)('_'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.identifier)('foo'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Dot, '.'),
                (0, Parser_spec_1.identifier)('bar'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftSquareBracket, '['),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '0'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightSquareBracket, ']'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Dot, '.'),
                (0, Parser_spec_1.identifier)('baz'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        });
    });
    describe('unfinished brackets', () => {
        it('parses expression inside of brackets', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse(`_ = foo[bar.baz.`);
            (0, chai_config_spec_1.expect)(diagnostics.length).to.be.greaterThan(0);
            (0, chai_config_spec_1.expect)(statements).to.be.lengthOf(1);
            (0, chai_config_spec_1.expect)((0, reflection_1.isAssignmentStatement)(statements[0])).to.be.true;
            const assignStmt = statements[0];
            (0, chai_config_spec_1.expect)(assignStmt.name.text).to.equal('_');
            (0, chai_config_spec_1.expect)((0, reflection_1.isIndexedGetExpression)(assignStmt.value)).to.be.true;
            const indexedGetExpr = assignStmt.value;
            (0, chai_config_spec_1.expect)(indexedGetExpr.obj.name.text).to.equal('foo');
            (0, chai_config_spec_1.expect)((0, reflection_1.isDottedGetExpression)(indexedGetExpr.index)).to.be.true;
            const dottedGetExpr = indexedGetExpr.index;
            (0, chai_config_spec_1.expect)(dottedGetExpr.name.text).to.equal('baz');
            (0, chai_config_spec_1.expect)((0, reflection_1.isVariableExpression)(dottedGetExpr.obj)).to.be.true;
        });
        it('gets correct diagnostic for missing square brace without index', () => {
            let { diagnostics } = Parser_1.Parser.parse(`
                sub setData(obj)
                    m.data = obj[
                end sub
            `);
            (0, testHelpers_spec_1.expectDiagnosticsIncludes)(diagnostics, [
                DiagnosticMessages_1.DiagnosticMessages.expectedRightSquareBraceAfterArrayOrObjectIndex()
            ]);
        });
        it('gets correct diagnostic for missing square brace with index', () => {
            let { diagnostics } = Parser_1.Parser.parse(`
                sub setData(obj)
                    m.data = obj[1
                end sub
            `);
            (0, testHelpers_spec_1.expectDiagnosticsIncludes)(diagnostics, [
                DiagnosticMessages_1.DiagnosticMessages.expectedRightSquareBraceAfterArrayOrObjectIndex()
            ]);
        });
    });
});
//# sourceMappingURL=Indexing.spec.js.map
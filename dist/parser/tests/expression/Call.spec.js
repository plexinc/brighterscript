"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../../../chai-config.spec");
const Parser_1 = require("../../Parser");
const Lexer_1 = require("../../../lexer/Lexer");
const TokenKind_1 = require("../../../lexer/TokenKind");
const Parser_spec_1 = require("../Parser.spec");
const vscode_languageserver_1 = require("vscode-languageserver");
const DiagnosticMessages_1 = require("../../../DiagnosticMessages");
const testHelpers_spec_1 = require("../../../testHelpers.spec");
const reflection_1 = require("../../../astUtils/reflection");
describe('parser call expressions', () => {
    it('parses named function calls', () => {
        const { statements, diagnostics } = Parser_1.Parser.parse([
            (0, Parser_spec_1.identifier)('RebootSystem'),
            { kind: TokenKind_1.TokenKind.LeftParen, text: '(', range: null },
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
            Parser_spec_1.EOF
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
    });
    it('does not invalidate the rest of the file on incomplete statement', () => {
        const { tokens } = Lexer_1.Lexer.scan(`
            sub DoThingOne()
                DoThin
            end sub
            sub DoThingTwo()
            end sub
        `);
        const { statements, diagnostics } = Parser_1.Parser.parse(tokens);
        (0, chai_config_spec_1.expect)(diagnostics).to.length.greaterThan(0);
        (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        //ALL of the diagnostics should be on the `DoThin` line
        let lineNumbers = diagnostics.map(x => x.range.start.line);
        for (let lineNumber of lineNumbers) {
            (0, chai_config_spec_1.expect)(lineNumber).to.equal(2);
        }
    });
    it('does not invalidate the next statement on a multi-statement line', () => {
        const { tokens } = Lexer_1.Lexer.scan(`
            sub DoThingOne()
                'missing closing paren
                DoThin(:name = "bob"
            end sub
            sub DoThingTwo()
            end sub
        `);
        const { statements, diagnostics } = Parser_1.Parser.parse(tokens);
        //there should only be 1 error
        (0, testHelpers_spec_1.expectDiagnostics)(diagnostics, [
            DiagnosticMessages_1.DiagnosticMessages.unexpectedToken(':'),
            DiagnosticMessages_1.DiagnosticMessages.expectedRightParenAfterFunctionCallArguments()
        ]);
        (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        //the error should be BEFORE the `name = "bob"` statement
        (0, chai_config_spec_1.expect)(diagnostics[0].range.end.character).to.be.lessThan(25);
    });
    it('allows closing parentheses on separate line', () => {
        const { statements, diagnostics } = Parser_1.Parser.parse([
            (0, Parser_spec_1.identifier)('RebootSystem'),
            { kind: TokenKind_1.TokenKind.LeftParen, text: '(', range: null },
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\\n'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\\n'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
            Parser_spec_1.EOF
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
    });
    it('includes partial statements and expressions', () => {
        const { statements, diagnostics } = Parser_1.Parser.parse(`
            function processData(data)
                data.foo.bar. = "hello"
                data.foo.func().
                result = data.foo.
                return result.
            end function
        `);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(4);
        (0, testHelpers_spec_1.expectDiagnostics)(diagnostics, [
            DiagnosticMessages_1.DiagnosticMessages.expectedPropertyNameAfterPeriod(),
            DiagnosticMessages_1.DiagnosticMessages.expectedPropertyNameAfterPeriod(),
            DiagnosticMessages_1.DiagnosticMessages.expectedPropertyNameAfterPeriod(),
            DiagnosticMessages_1.DiagnosticMessages.expectedPropertyNameAfterPeriod()
        ]);
        (0, chai_config_spec_1.expect)(statements).to.be.lengthOf(1);
        const bodyStatements = statements[0].func.body.statements;
        (0, chai_config_spec_1.expect)(bodyStatements).to.be.lengthOf(4); // each line is a statement
        // first should be: data.foo.bar = "hello"
        (0, chai_config_spec_1.expect)((0, reflection_1.isDottedSetStatement)(bodyStatements[0])).to.be.true;
        const setStmt = bodyStatements[0];
        (0, chai_config_spec_1.expect)(setStmt.name.text).to.equal('bar');
        (0, chai_config_spec_1.expect)(setStmt.obj.name.text).to.equal('foo');
        (0, chai_config_spec_1.expect)(setStmt.obj.obj.name.text).to.equal('data');
        (0, chai_config_spec_1.expect)(setStmt.value.token.text).to.equal('"hello"');
        // 2nd should be: data.foo.func()
        (0, chai_config_spec_1.expect)((0, reflection_1.isExpressionStatement)(bodyStatements[1])).to.be.true;
        (0, chai_config_spec_1.expect)((0, reflection_1.isCallExpression)(bodyStatements[1].expression)).to.be.true;
        const callExpr = bodyStatements[1].expression;
        (0, chai_config_spec_1.expect)(callExpr.callee.name.text).to.be.equal('func');
        (0, chai_config_spec_1.expect)(callExpr.callee.obj.name.text).to.be.equal('foo');
        (0, chai_config_spec_1.expect)(callExpr.callee.obj.obj.name.text).to.be.equal('data');
        // 3rd should be: result = data.foo
        (0, chai_config_spec_1.expect)((0, reflection_1.isAssignmentStatement)(bodyStatements[2])).to.be.true;
        const assignStmt = bodyStatements[2];
        (0, chai_config_spec_1.expect)(assignStmt.name.text).to.equal('result');
        (0, chai_config_spec_1.expect)(assignStmt.value.name.text).to.equal('foo');
        // 4th should be: return result
        (0, chai_config_spec_1.expect)((0, reflection_1.isReturnStatement)(bodyStatements[3])).to.be.true;
        const returnStmt = bodyStatements[3];
        (0, chai_config_spec_1.expect)(returnStmt.value.name.text).to.equal('result');
    });
    it('accepts arguments', () => {
        const { statements, diagnostics } = Parser_1.Parser.parse([
            (0, Parser_spec_1.identifier)('add'),
            { kind: TokenKind_1.TokenKind.LeftParen, text: '(', range: null },
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '1'),
            { kind: TokenKind_1.TokenKind.Comma, text: ',', range: null },
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '2'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
            Parser_spec_1.EOF
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        (0, chai_config_spec_1.expect)(statements[0].expression.args).to.be.ok;
    });
    it('location tracking', () => {
        /**
         *    0   0   0   1   1   2
         *    0   4   8   2   6   0
         *  +----------------------
         * 0| foo("bar", "baz")
         */
        const { statements, diagnostics } = Parser_1.Parser.parse([
            {
                kind: TokenKind_1.TokenKind.Identifier,
                text: 'foo',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(0, 0, 0, 3)
            },
            {
                kind: TokenKind_1.TokenKind.LeftParen,
                text: '(',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(0, 3, 0, 4)
            },
            {
                kind: TokenKind_1.TokenKind.StringLiteral,
                text: `"bar"`,
                isReserved: false,
                range: vscode_languageserver_1.Range.create(0, 4, 0, 9)
            },
            {
                kind: TokenKind_1.TokenKind.Comma,
                text: ',',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(0, 9, 0, 10)
            },
            {
                kind: TokenKind_1.TokenKind.StringLiteral,
                text: `"baz"`,
                isReserved: false,
                range: vscode_languageserver_1.Range.create(0, 11, 0, 16)
            },
            {
                kind: TokenKind_1.TokenKind.RightParen,
                text: ')',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(0, 16, 0, 17)
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
        (0, chai_config_spec_1.expect)(statements[0].range).to.deep.include(vscode_languageserver_1.Range.create(0, 0, 0, 17));
    });
    describe('unfinished', () => {
        it('continues parsing inside unfinished function calls', () => {
            const { statements, diagnostics } = Parser_1.Parser.parse(`
                sub doSomething(data)
                    otherFunc(data.foo, data.bar[0]
                end sub
            `);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(2);
            (0, testHelpers_spec_1.expectDiagnostics)(diagnostics, [
                DiagnosticMessages_1.DiagnosticMessages.expectedRightParenAfterFunctionCallArguments(),
                DiagnosticMessages_1.DiagnosticMessages.expectedNewlineOrColon()
            ]);
            (0, chai_config_spec_1.expect)(statements).to.be.lengthOf(1);
            const bodyStatements = statements[0].func.body.statements;
            (0, chai_config_spec_1.expect)(bodyStatements).to.be.lengthOf(1);
            // Function statement should still be parsed
            (0, chai_config_spec_1.expect)((0, reflection_1.isExpressionStatement)(bodyStatements[0])).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isCallExpression)(bodyStatements[0].expression)).to.be.true;
            const callExpr = bodyStatements[0].expression;
            (0, chai_config_spec_1.expect)(callExpr.callee.name.text).to.equal('otherFunc');
            // args should still be parsed, as well!
            (0, chai_config_spec_1.expect)(callExpr.args).to.be.lengthOf(2);
            (0, chai_config_spec_1.expect)((0, reflection_1.isDottedGetExpression)(callExpr.args[0])).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isIndexedGetExpression)(callExpr.args[1])).to.be.true;
        });
        it('gets correct diagnostic for missing close paren without args', () => {
            let { diagnostics } = Parser_1.Parser.parse(`
                sub process()
                    someFunc(
                end sub
            `);
            (0, testHelpers_spec_1.expectDiagnosticsIncludes)(diagnostics, [
                DiagnosticMessages_1.DiagnosticMessages.expectedRightParenAfterFunctionCallArguments()
            ]);
        });
        it('gets correct diagnostic for missing close paren with args', () => {
            let { diagnostics } = Parser_1.Parser.parse(`
                sub process()
                    someFunc("hello"
                end sub
            `);
            (0, testHelpers_spec_1.expectDiagnosticsIncludes)(diagnostics, [
                DiagnosticMessages_1.DiagnosticMessages.expectedRightParenAfterFunctionCallArguments()
            ]);
        });
        it('gets correct diagnostic for missing close paren with invalid expression as arg', () => {
            let { diagnostics, statements } = Parser_1.Parser.parse(`
                sub process(data)
                    someFunc(data.name. ,
                end sub
            `);
            (0, testHelpers_spec_1.expectDiagnosticsIncludes)(diagnostics, [
                DiagnosticMessages_1.DiagnosticMessages.expectedRightParenAfterFunctionCallArguments()
            ]);
            (0, chai_config_spec_1.expect)(statements).to.be.lengthOf(1);
            const bodyStatements = statements[0].func.body.statements;
            (0, chai_config_spec_1.expect)(bodyStatements).to.be.lengthOf(1);
        });
    });
});
//# sourceMappingURL=Call.spec.js.map
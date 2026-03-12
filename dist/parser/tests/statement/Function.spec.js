"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../../../chai-config.spec");
const Parser_1 = require("../../Parser");
const Lexer_1 = require("../../../lexer/Lexer");
const TokenKind_1 = require("../../../lexer/TokenKind");
const Parser_spec_1 = require("../Parser.spec");
const reflection_1 = require("../../../astUtils/reflection");
describe('parser', () => {
    describe('function declarations', () => {
        it('still provides a body when end keyword is mangled/missing', () => {
            const parser = Parser_1.Parser.parse(`
                sub test()
                end su
            `);
            const func = parser.ast.findChild(reflection_1.isFunctionStatement);
            (0, chai_config_spec_1.expect)(func === null || func === void 0 ? void 0 : func.func.body).to.exist;
        });
        it('recovers when using `end sub` instead of `end function`', () => {
            const { tokens } = Lexer_1.Lexer.scan(`
                function Main()
                    print "Hello world"
                end sub

                sub DoSomething()

                end sub
            `);
            let { statements, diagnostics } = Parser_1.Parser.parse(tokens);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(1);
            (0, chai_config_spec_1.expect)(statements).to.length.greaterThan(0);
        });
        it('parses minimal empty function declarations', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Function, 'function'),
                (0, Parser_spec_1.identifier)('foo'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftParen, '('),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.EndFunction, 'end function'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.length.greaterThan(0);
        });
        it('parses non-empty function declarations', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Function, 'function'),
                (0, Parser_spec_1.identifier)('foo'),
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
            (0, chai_config_spec_1.expect)(statements).to.length.greaterThan(0);
        });
        it('parses functions with implicit-dynamic arguments', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Function, 'function'),
                (0, Parser_spec_1.identifier)('add2'),
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
            (0, chai_config_spec_1.expect)(statements).to.length.greaterThan(0);
        });
        it('parses functions with typed arguments', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Function, 'function'),
                (0, Parser_spec_1.identifier)('repeat'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftParen, '('),
                (0, Parser_spec_1.identifier)('str'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.As, 'as'),
                (0, Parser_spec_1.identifier)('string'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Comma, ','),
                (0, Parser_spec_1.identifier)('count'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.As, 'as'),
                (0, Parser_spec_1.identifier)('integer'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.EndFunction, 'end function'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.length.greaterThan(0);
        });
        it('parses functions with default argument expressions', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Function, 'function'),
                (0, Parser_spec_1.identifier)('add'),
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
            (0, chai_config_spec_1.expect)(statements).to.length.greaterThan(0);
        });
        it('parses functions with typed arguments and default expressions', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Function, 'function'),
                (0, Parser_spec_1.identifier)('add'),
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
            (0, chai_config_spec_1.expect)(statements).to.length.greaterThan(0);
        });
        it('parses return types', () => {
            var _a;
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Function, 'function'),
                (0, Parser_spec_1.identifier)('foo'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftParen, '('),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.As, 'as'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Void, 'void'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.EndFunction, 'end function'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).to.not.exist;
            (0, chai_config_spec_1.expect)(statements).to.length.greaterThan(0);
        });
        it('does not allow type designators at end of name', () => {
            const { tokens } = Lexer_1.Lexer.scan(`
                function StringFunc#()
                    return 1
                end function

                function IntegerFunc%()
                    return 1
                end function

                function FloatFunc!()
                    return 1
                end function

                function DoubleFunc#()
                    return 1
                end function
            `);
            const { statements, diagnostics } = Parser_1.Parser.parse(tokens);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(4);
            (0, chai_config_spec_1.expect)(statements).to.length.greaterThan(0);
        });
    });
    describe('sub declarations', () => {
        it('recovers when using `end function` instead of `end sub`', () => {
            const { tokens } = Lexer_1.Lexer.scan(`
                sub Main()
                    print "Hello world"
                end function

                sub DoSomething()

                end sub
            `);
            let { statements, diagnostics } = Parser_1.Parser.parse(tokens);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(1);
            (0, chai_config_spec_1.expect)(statements).to.length.greaterThan(0);
        });
        it('parses minimal sub declarations', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Sub, 'sub'),
                (0, Parser_spec_1.identifier)('bar'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftParen, '('),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.EndSub, 'end sub'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.length.greaterThan(0);
        });
        it('parses non-empty sub declarations', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Sub, 'sub'),
                (0, Parser_spec_1.identifier)('foo'),
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
            (0, chai_config_spec_1.expect)(statements).to.length.greaterThan(0);
        });
        it('parses subs with implicit-dynamic arguments', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Function, 'sub'),
                (0, Parser_spec_1.identifier)('add2'),
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
            (0, chai_config_spec_1.expect)(statements).to.length.greaterThan(0);
        });
        it('parses subs with typed arguments', () => {
            var _a;
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Function, 'sub'),
                (0, Parser_spec_1.identifier)('repeat'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftParen, '('),
                (0, Parser_spec_1.identifier)('str'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.As, 'as'),
                (0, Parser_spec_1.identifier)('string'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Comma, ','),
                (0, Parser_spec_1.identifier)('count'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.As, 'as'),
                (0, Parser_spec_1.identifier)('integer'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.EndFunction, 'end sub'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).not.to.exist;
            (0, chai_config_spec_1.expect)(statements).to.length.greaterThan(0);
        });
        it('parses subs with default argument expressions', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Sub, 'sub'),
                (0, Parser_spec_1.identifier)('add'),
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
            (0, chai_config_spec_1.expect)(statements).to.length.greaterThan(0);
        });
        it('parses subs with typed arguments and default expressions', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Sub, 'sub'),
                (0, Parser_spec_1.identifier)('add'),
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
            (0, chai_config_spec_1.expect)(statements).to.length.greaterThan(0);
        });
        it('does not allow type designators at end of name', () => {
            const { tokens } = Lexer_1.Lexer.scan(`
                sub StringSub#()
                end sub

                sub IntegerSub%()
                end sub

                sub FloatSub!()
                end sub

                sub DoubleSub#()
                end sub
            `);
            const { statements, diagnostics } = Parser_1.Parser.parse(tokens);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(4);
            (0, chai_config_spec_1.expect)(statements).to.length.greaterThan(0);
        });
    });
});
//# sourceMappingURL=Function.spec.js.map
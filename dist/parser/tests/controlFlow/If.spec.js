"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../../../chai-config.spec");
const assert = require("assert");
const Parser_1 = require("../../Parser");
const Lexer_1 = require("../../../lexer/Lexer");
const TokenKind_1 = require("../../../lexer/TokenKind");
const Parser_spec_1 = require("../Parser.spec");
const reflection_1 = require("../../../astUtils/reflection");
describe('parser if statements', () => {
    it('allows empty if blocks', () => {
        var _a;
        let { tokens } = Lexer_1.Lexer.scan(`
            if true then

            else if true then
                stop
            else
                stop
            end if
        `);
        let { statements, diagnostics } = Parser_1.Parser.parse(tokens);
        (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).not.to.exist;
        (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
    });
    it('allows empty elseif blocks', () => {
        var _a;
        let { tokens } = Lexer_1.Lexer.scan(`
            if true then
                stop
            else if true then

            else
                stop
            end if
        `);
        let { statements, diagnostics } = Parser_1.Parser.parse(tokens);
        (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).not.to.exist;
        (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
    });
    it('allows empty else blocks', () => {
        var _a;
        let { tokens } = Lexer_1.Lexer.scan(`
            if true then
                stop
            else if true then
                stop
            else

            end if
        `);
        let { statements, diagnostics } = Parser_1.Parser.parse(tokens);
        (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).not.to.exist;
        (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
    });
    it('single-line if next to else or endif', () => {
        var _a;
        let { tokens } = Lexer_1.Lexer.scan(`
            if type(component.TextAttrs.font) = "roString"
                font = m.fonts.Lookup(component.TextAttrs.font)
                if font = invalid then font = m.fonts.medium
            else if type(component.TextAttrs.font) = "roFont"
                font = component.TextAttrs.font
            else
                font = m.fonts.reg.GetDefaultFont()
            end if
        `);
        let { statements, diagnostics } = Parser_1.Parser.parse(tokens);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        let ifs = statements[0];
        if (!(0, reflection_1.isIfStatement)(ifs) || !(0, reflection_1.isIfStatement)((_a = ifs.thenBranch) === null || _a === void 0 ? void 0 : _a.statements[1])) {
            assert.fail('Missing single-line if inside if-then');
        }
        if (!(0, reflection_1.isIfStatement)(ifs.elseBranch)) {
            assert.fail('Missing chained else-if statement');
        }
        (0, chai_config_spec_1.expect)(ifs.elseBranch.elseBranch).to.exist;
    });
    it('single-line if inside multi-line if', () => {
        var _a;
        let { tokens } = Lexer_1.Lexer.scan(`
            if true
                if true then t = 1
            else
                ' empty line or line with just a comment causes crash
            end if
        `);
        let { statements, diagnostics } = Parser_1.Parser.parse(tokens);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        let ifs = statements[0];
        if (!(0, reflection_1.isIfStatement)(ifs) || !(0, reflection_1.isIfStatement)((_a = ifs.thenBranch) === null || _a === void 0 ? void 0 : _a.statements[0])) {
            assert.fail('Missing single-line if inside if-then');
        }
        (0, chai_config_spec_1.expect)(ifs.elseBranch).to.exist;
        if (!(0, reflection_1.isBlock)(ifs.elseBranch) || !(0, reflection_1.isCommentStatement)(ifs.elseBranch.statements[0])) {
            assert.fail('Missing comment inside else branch');
        }
    });
    it('dotted set in else block', () => {
        let { tokens } = Lexer_1.Lexer.scan(`
            if true then m.top.visible = true else m.top.visible = false
        `);
        let { statements, diagnostics } = Parser_1.Parser.parse(tokens);
        if (diagnostics.length > 0) {
            console.log(diagnostics);
        }
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
    });
    describe('single-line if', () => {
        it('parses if only', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.If, 'if'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '1'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Less, '<'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '2'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Then, 'then'),
                (0, Parser_spec_1.identifier)('foo'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.True, 'true'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        });
        it('parses if-else', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.If, 'if'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '1'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Less, '<'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '2'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Then, 'then'),
                (0, Parser_spec_1.identifier)('foo'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.True, 'true'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Else, 'else'),
                (0, Parser_spec_1.identifier)('foo'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.False, 'true'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        });
        it('parses if-elseif-else', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.If, 'if'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '1'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Less, '<'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '2'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Then, 'then'),
                (0, Parser_spec_1.identifier)('foo'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.True, 'true'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Else, 'else'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.If, 'if'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '1'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '2'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Then, 'then'),
                (0, Parser_spec_1.identifier)('same'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.True, 'true'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Else, 'else'),
                (0, Parser_spec_1.identifier)('foo'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.True, 'true'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        });
        it('allows \'then\' to be skipped', () => {
            // if 1 < 2 foo = true else if 1 = 2 same = true
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.If, 'if'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '1'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Less, '<'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '2'),
                (0, Parser_spec_1.identifier)('foo'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.True, 'true'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Else, 'else'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.If, 'if'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '1'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '2'),
                (0, Parser_spec_1.identifier)('same'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.True, 'true'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Else, 'else'),
                (0, Parser_spec_1.identifier)('foo'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.False, 'false'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        });
        it('parses special statements in inline block', () => {
            const { statements, diagnostics } = Parser_1.Parser.parse(`
                if true print 1 else print 1
                if true then print 1 else print 1
                if true print "x=" ; 1 else print 1
                if true then print "x=", 1 else print 1
                if true print "x=" 1 else print 1
                if true return else print 1
                if true then return else print 1
            `);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        });
    });
    describe('block if', () => {
        it('parses if only', () => {
            //because the parser depends on line numbers for certain if statements, this needs to be location-aware
            let { tokens } = Lexer_1.Lexer.scan(`
                if 1 < 2 THEN
                    foo = true
                    bar = true
                end if
            `);
            let { statements, diagnostics } = Parser_1.Parser.parse(tokens);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        });
        it('parses if-else', () => {
            //this test requires token locations, so use the lexer
            let { tokens } = Lexer_1.Lexer.scan(`
                if 1 < 2 then
                    foo = true
                else
                    foo = false
                    bar = false
                end if
            `);
            let { statements, diagnostics } = Parser_1.Parser.parse(tokens);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        });
        it('parses if-elseif-else', () => {
            //this test requires token locations, so use the lexer
            let { tokens } = Lexer_1.Lexer.scan(`
                if 1 < 2 then
                    foo = true
                else if 1 > 2 then
                    foo = 3
                    bar = true
                else
                    foo = false
                end if
            `);
            let { statements, diagnostics } = Parser_1.Parser.parse(tokens);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        });
        it('allows \'then\' to be skipped', () => {
            //this test requires token locations, so use the lexer
            let { tokens } = Lexer_1.Lexer.scan(`
                if 1 < 2
                    foo = true
                else if 1 > 2
                    foo = 3
                    bar = true
                else
                    foo = false
                end if
            `);
            let { statements, diagnostics } = Parser_1.Parser.parse(tokens);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        });
        it('sets endif token properly', () => {
            //this test requires token locations, so use the lexer
            let { tokens } = Lexer_1.Lexer.scan(`
                sub a()
                    if true then
                        print false
                    else if true then
                        print "true"
                    else
                        print "else"
                    end if 'comment
                end sub
            `);
            let { statements, diagnostics } = Parser_1.Parser.parse(tokens);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
            //the endif token should be set
            let ifs = statements[0].func.body.statements[0];
            if (!(0, reflection_1.isIfStatement)(ifs) || !(0, reflection_1.isIfStatement)(ifs.elseBranch)) {
                assert.fail('Unexpected statement found');
            }
            (0, chai_config_spec_1.expect)(ifs.tokens.endIf).to.not.exist;
            (0, chai_config_spec_1.expect)(ifs.elseBranch.tokens.endIf).to.exist;
        });
    });
    it('supports trailing colons after conditional statements', () => {
        let { tokens } = Lexer_1.Lexer.scan(`
            sub main()
                if 1 > 0:
                    print "positive!"
                else if 1 < 0:
                    print "negative!"
                else:
                    print "tHaT NuMbEr iS ZeRo"
                end if
            end sub
        `);
        let { statements, diagnostics } = Parser_1.Parser.parse(tokens);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
    });
    it('supports trailing colons for one-line if statements', () => {
        let { tokens } = Lexer_1.Lexer.scan(`
            if 1 < 2: return true: end if
        `);
        let { statements, diagnostics } = Parser_1.Parser.parse(tokens);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
    });
    it('catches one-line if statement missing first colon', () => {
        //missing colon after 2
        let { tokens } = Lexer_1.Lexer.scan(`
            if 1 < 2 return true : end if
        `);
        let { statements, diagnostics } = Parser_1.Parser.parse(tokens);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.length.greaterThan(0);
        (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
    });
    it('catches one-line if statement with multiple statements missing first colon', () => {
        //missing colon after 2
        let { tokens } = Lexer_1.Lexer.scan(`
            if 1 < 2 print "ok" : return true : end if
        `);
        let { statements, diagnostics } = Parser_1.Parser.parse(tokens);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.length.greaterThan(0);
        (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
    });
    it('catches one-line if statement missing second colon', () => {
        //missing colon after `2`
        let { tokens } = Lexer_1.Lexer.scan(`
            if 1 < 2 : return true end if
        `);
        let { statements, diagnostics } = Parser_1.Parser.parse(tokens);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.length.greaterThan(0);
        (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
    });
    it('catches one-line if statement with else missing colons', () => {
        //missing colon after `2`
        let { tokens } = Lexer_1.Lexer.scan(`
            if 1 < 2 : return true: else return false end if
        `);
        let { statements, diagnostics } = Parser_1.Parser.parse(tokens);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.length.greaterThan(0);
        (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
    });
    it('catches one-line if statement with colon and missing end if', () => {
        //missing colon after `2`
        let { tokens } = Lexer_1.Lexer.scan(`
            if 1 < 2: return true
        `);
        let { statements, diagnostics } = Parser_1.Parser.parse(tokens);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.length.greaterThan(0);
        (0, chai_config_spec_1.expect)(statements).to.be.lengthOf(0);
    });
    it('catches one-line if multi-statement with colon and missing end if', () => {
        //missing colon after `2`
        let { tokens } = Lexer_1.Lexer.scan(`
            if 1 < 2: print "ok": return true
        `);
        let { statements, diagnostics } = Parser_1.Parser.parse(tokens);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.length.greaterThan(0);
        (0, chai_config_spec_1.expect)(statements).to.be.lengthOf(0);
    });
    it('catches one-line if statement with colon and missing endif inside a function', () => {
        //missing 'end if'
        let { tokens } = Lexer_1.Lexer.scan(`
            function missingendif()
                if true : return true
            end function
        `);
        let { statements, diagnostics } = Parser_1.Parser.parse(tokens);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(2);
        (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
    });
    it('catches extraneous colon at the end of one-line if-else', () => {
        //colon at the end not allowed
        let { tokens } = Lexer_1.Lexer.scan(`
            if 1 < 2 then return true else return false:
        `);
        let { statements, diagnostics } = Parser_1.Parser.parse(tokens);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(1);
        (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
    });
    it('catches colon before if, unless there is `then` before', () => {
        //colon before if isn't allowed
        let { tokens } = Lexer_1.Lexer.scan(`
            if 1 < 2 then: if 2<3: return false: end if
            : if 1 < 2: return true: end if
            end if
        `);
        let { statements, diagnostics } = Parser_1.Parser.parse(tokens);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(1);
        (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
    });
    it('catches extraneous colon+end if at the end of one-line if-else', () => {
        //expected newline + unexpected endif
        let { tokens } = Lexer_1.Lexer.scan(`
            if 1 < 2 then return true else return false: end if
        `);
        let { statements, diagnostics } = Parser_1.Parser.parse(tokens);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(2);
        (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
    });
    it('recovers from extraneous endif at the end of one-line if-else', () => {
        //unexpected endif
        let { tokens } = Lexer_1.Lexer.scan(`
            function test1()
                if 1 < 2: return true: else return false end if
            end function
        `);
        let { statements, diagnostics } = Parser_1.Parser.parse(tokens);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(2);
        (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
    });
    it('recovers from missing end-if', () => {
        //unexpected endif
        let { tokens } = Lexer_1.Lexer.scan(`
            function test1()
                if 1 < 2 then if 1 < 3
                    return true
            end function
            function test2()
            end function
        `);
        let { statements, diagnostics, references } = Parser_1.Parser.parse(tokens);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.length.greaterThan(0);
        (0, chai_config_spec_1.expect)(statements).to.be.lengthOf(2);
        (0, chai_config_spec_1.expect)(references.functionStatements).to.be.lengthOf(2);
    });
    it('catches extraneous colon at the end of one-line if', () => {
        //colon at the end not allowed
        let { tokens } = Lexer_1.Lexer.scan(`
            if 1 < 2 then return true:
        `);
        let { statements, diagnostics } = Parser_1.Parser.parse(tokens);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(1);
        (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
    });
    it('catches multi-line if inside a one-line if branch', () => {
        //second if should be inline
        let { tokens } = Lexer_1.Lexer.scan(`
            if 1 < 2 then if 1 < 3
                return true
            end if
        `);
        let { statements, diagnostics } = Parser_1.Parser.parse(tokens);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(1);
        (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
    });
    it('supports multiple statements in one-line if statements', () => {
        //second if should be inline
        let { tokens } = Lexer_1.Lexer.scan(`
            if 1 < 2 then ok = true : m.ok = true : print "ok" : ook() else if 1 < 3
                return true
            end if
        `);
        let { statements, diagnostics } = Parser_1.Parser.parse(tokens);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(1);
        (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
    });
    it('catches multi-line if inside a one-line if else branch', () => {
        //second if should be inline
        let { tokens } = Lexer_1.Lexer.scan(`
            if 1 < 2 then return false else if 1 < 3
                return true
            end if
        `);
        let { statements, diagnostics } = Parser_1.Parser.parse(tokens);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(1);
        (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
    });
    it('catches else statement missing colon', () => {
        //missing colon before `end if`
        let { tokens } = Lexer_1.Lexer.scan(`
            if 1 < 2
              return true
            else return false end if
        `);
        let { statements, diagnostics } = Parser_1.Parser.parse(tokens);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.length.greaterThan(0);
        (0, chai_config_spec_1.expect)(statements).to.be.lengthOf(1);
    });
    it('supports if statement with condition and action on one line, but end if on separate line', () => {
        let { tokens } = Lexer_1.Lexer.scan(`
            if 1 < 2: return true
            end if
        `);
        let { statements, diagnostics } = Parser_1.Parser.parse(tokens);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
    });
    it('supports colon after return in single-line if statement', () => {
        let { tokens } = Lexer_1.Lexer.scan(`
            if false : print "true" : end if
        `);
        let { statements, diagnostics } = Parser_1.Parser.parse(tokens);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
    });
    it('supports if elseif endif single line', () => {
        let { tokens } = Lexer_1.Lexer.scan(`
            if true: print "8 worked": else if true: print "not run": else: print "not run": end if
        `);
        let { statements, diagnostics } = Parser_1.Parser.parse(tokens);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
    });
    it('supports comment at the end of one-line if', () => {
        let { tokens } = Lexer_1.Lexer.scan(`
            if 1 > 2 then return true 'OK
        `);
        let { statements, diagnostics } = Parser_1.Parser.parse(tokens);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
    });
    it('supports colon at the beginning of a line', () => {
        let { tokens } = Lexer_1.Lexer.scan(`
            if 1 < 2 then: if 1 < 4 then return false
            : end if
        `);
        let { statements, diagnostics } = Parser_1.Parser.parse(tokens);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
    });
    it('supports one-line functions inside of one-line if statement', () => {
        let { tokens } = Lexer_1.Lexer.scan(`
            if true then : test = sub() : print "yes" : end sub : end if
        `);
        let { statements, diagnostics } = Parser_1.Parser.parse(tokens);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
    });
    it('single-line if block statements have correct range', () => {
        let { tokens } = Lexer_1.Lexer.scan(`
            if false then print "true"
            if false then print "true": a = 10
            if false then print "true" else print "false"
            if false then print "true" else print "false": a = 20
        `);
        let { statements, diagnostics } = Parser_1.Parser.parse(tokens);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        const then1 = statements[0].thenBranch;
        (0, chai_config_spec_1.expect)((0, Parser_spec_1.rangeMatch)(then1.range, then1.statements)).to.be.true;
        const then2 = statements[1].thenBranch;
        (0, chai_config_spec_1.expect)((0, Parser_spec_1.rangeMatch)(then2.range, then2.statements)).to.be.true;
        const else1 = statements[2].elseBranch;
        (0, chai_config_spec_1.expect)((0, Parser_spec_1.rangeMatch)(else1.range, else1.statements)).to.be.true;
        const else2 = statements[3].elseBranch;
        (0, chai_config_spec_1.expect)((0, Parser_spec_1.rangeMatch)(else2.range, else2.statements)).to.be.true;
    });
});
//# sourceMappingURL=If.spec.js.map
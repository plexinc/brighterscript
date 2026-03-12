"use strict";
/* eslint-disable @typescript-eslint/no-for-in-array */
/* eslint no-template-curly-in-string: 0 */
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../../../chai-config.spec");
const DiagnosticMessages_1 = require("../../../DiagnosticMessages");
const Lexer_1 = require("../../../lexer/Lexer");
const Parser_1 = require("../../Parser");
const Statement_1 = require("../../Statement");
const Program_1 = require("../../../Program");
const testHelpers_spec_1 = require("../../../testHelpers.spec");
const util_1 = require("../../../util");
describe('TemplateStringExpression', () => {
    describe('parser template String', () => {
        it('throws exception when used in brightscript scope', () => {
            var _a;
            let { tokens } = Lexer_1.Lexer.scan(`a = \`hello \=world`);
            let { diagnostics } = Parser_1.Parser.parse(tokens, { mode: Parser_1.ParseMode.BrightScript });
            (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.code).to.equal(DiagnosticMessages_1.DiagnosticMessages.bsFeatureNotSupportedInBrsFiles('').code);
        });
        describe('in assignment', () => {
            it('generates correct locations for quasis', () => {
                let { tokens } = Lexer_1.Lexer.scan('print `0xAAAAAA${"0xBBBBBB"}0xCCCCCC`');
                (0, chai_config_spec_1.expect)(tokens.filter(x => /"?0x/.test(x.text)).map(x => x.range)).to.eql([
                    util_1.util.createRange(0, 7, 0, 15),
                    util_1.util.createRange(0, 17, 0, 27),
                    util_1.util.createRange(0, 28, 0, 36) // 0xCCCCCC
                ]);
            });
            it('generates correct locations for items', () => {
                let { tokens } = Lexer_1.Lexer.scan('print `${111}${222}${333}`');
                //throw out the `print` token
                tokens.shift();
                (0, chai_config_spec_1.expect)(
                //compute the length of the token char spread
                tokens.filter(x => x.text !== '').map(x => [x.range.end.character - x.range.start.character, x.text])).to.eql([
                    '`',
                    '${',
                    '111',
                    '}',
                    '${',
                    '222',
                    '}',
                    '${',
                    '333',
                    '}',
                    '`'
                ].map(x => [x.length, x]));
            });
            it(`simple case`, () => {
                let { tokens } = Lexer_1.Lexer.scan(`a = \`hello      world\``);
                let { statements, diagnostics } = Parser_1.Parser.parse(tokens, { mode: Parser_1.ParseMode.BrighterScript });
                (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
                (0, chai_config_spec_1.expect)(statements[0]).instanceof(Statement_1.AssignmentStatement);
            });
            it(`complex case`, () => {
                let { tokens } = Lexer_1.Lexer.scan(`a = \`hello \${a.text} world \${"template" + m.getChars()} test\``);
                let { statements, diagnostics } = Parser_1.Parser.parse(tokens, { mode: Parser_1.ParseMode.BrighterScript });
                (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
                (0, chai_config_spec_1.expect)(statements[0]).instanceof(Statement_1.AssignmentStatement);
            });
            it(`complex case`, () => {
                var _a;
                let { tokens } = Lexer_1.Lexer.scan(`a = \`hello \${"world"}!
                    I am a \${"template" + "\`string\`"}
                    and I am very \${["pleased"][0]} to meet you \${m.top.getChildCount()}
                    the end.
                    goodnight\`
                `);
                let { statements, diagnostics } = Parser_1.Parser.parse(tokens, { mode: Parser_1.ParseMode.BrighterScript });
                (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).not.to.exist;
                (0, chai_config_spec_1.expect)(statements[0]).instanceof(Statement_1.AssignmentStatement);
            });
            it(`complex case that tripped up the transpile tests`, () => {
                let { tokens } = Lexer_1.Lexer.scan('a = ["one", "two", `I am a complex example\n${a.isRunning(["a","b","c"])}`]');
                let { statements, diagnostics } = Parser_1.Parser.parse(tokens, { mode: Parser_1.ParseMode.BrighterScript });
                (0, testHelpers_spec_1.expectZeroDiagnostics)(diagnostics);
                (0, chai_config_spec_1.expect)(statements[0]).instanceof(Statement_1.AssignmentStatement);
            });
        });
        it('catches missing closing backtick', () => {
            var _a;
            let { tokens } = Lexer_1.Lexer.scan('name = `hello world');
            let parser = Parser_1.Parser.parse(tokens, { mode: Parser_1.ParseMode.BrighterScript });
            (0, chai_config_spec_1.expect)((_a = parser.diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).to.equal(DiagnosticMessages_1.DiagnosticMessages.unterminatedTemplateStringAtEndOfFile().message);
        });
    });
    describe('transpile', () => {
        let rootDir = process.cwd();
        let program;
        let testTranspile = (0, testHelpers_spec_1.getTestTranspile)(() => [program, rootDir]);
        beforeEach(() => {
            program = new Program_1.Program({ rootDir: rootDir });
        });
        afterEach(() => {
            program.dispose();
        });
        it('uses the proper prefix when aliased package is installed', () => {
            program.setFile('source/roku_modules/rokucommunity_bslib/bslib.brs', '');
            testTranspile(`
                sub main()
                    a = \`\${LINE_NUM},\${LINE_NUM}\`
                end sub
            `, `
                sub main()
                    a = (rokucommunity_bslib_toString(LINE_NUM) + "," + rokucommunity_bslib_toString(LINE_NUM))
                end sub
            `);
        });
        it('properly transpiles simple template string with no leading text', () => {
            testTranspile(`
                    sub main()
                        a = \`\${LINE_NUM},\${LINE_NUM}\`
                    end sub
                `, `
                    sub main()
                        a = (bslib_toString(LINE_NUM) + "," + bslib_toString(LINE_NUM))
                    end sub
                `);
        });
        it('properly transpiles simple template string', () => {
            testTranspile(`
                sub main()
                    a = \`hello world\`
                end sub
            `, `
                sub main()
                    a = "hello world"
                end sub
            `);
        });
        it('properly transpiles one line template string with expressions', () => {
            testTranspile(`
                sub main()
                    a = \`hello \${LINE_NUM.text} world \${"template" + "".getChars()} test\`
                end sub
            `, `
                sub main()
                    a = ("hello " + bslib_toString(LINE_NUM.text) + " world " + bslib_toString("template" + "".getChars()) + " test")
                end sub
            `);
        });
        it('handles escaped characters', () => {
            testTranspile(`
                sub main()
                    a = \`\\r\\n\\\`\\$\`
                end sub
            `, `
                sub main()
                    a = (chr(13) + chr(10) + chr(96) + chr(36))
                end sub
            `);
        });
        it('handles escaped unicode char codes', () => {
            testTranspile(`
                sub main()
                    a = \`\\c2\\c987\`
                end sub
            `, `
                sub main()
                    a = (chr(2) + chr(987))
                end sub
            `);
        });
        it('properly transpiles simple multiline template string', () => {
            testTranspile(`
                sub main()
                    a = \`hello world\nI am multiline\`
                end sub
            `, `
                sub main()
                    a = ("hello world" + chr(10) + "I am multiline")
                end sub
            `);
        });
        it('properly handles newlines', () => {
            testTranspile(`
                sub main()
                    a = \`\n\`
                end sub
            `, `
                sub main()
                    a = (chr(10))
                end sub
            `);
        });
        it('properly handles clrf', () => {
            testTranspile(`
                sub main()
                    a = \`\r\n\`
                end sub
            `, `
                sub main()
                    a = (chr(13) + chr(10))
                end sub
            `);
        });
        it('properly transpiles more complex multiline template string', () => {
            testTranspile(`
                sub main()
                    a = \`I am multiline\n\${a.isRunning()}\nmore\`
                end sub
            `, `
                sub main()
                    a = ("I am multiline" + chr(10) + bslib_toString(a.isRunning()) + chr(10) + "more")
                end sub
            `);
        });
        it('properly transpiles complex multiline template string in array def', () => {
            testTranspile(`
                sub main()
                    a = [
                        "one",
                        "two",
                        \`I am a complex example\${a.isRunning(["a", "b", "c"])}\`
                    ]
                end sub
            `, `
                sub main()
                    a = [
                        "one"
                        "two"
                        ("I am a complex example" + bslib_toString(a.isRunning([
                            "a"
                            "b"
                            "c"
                        ])))
                    ]
                end sub
            `);
        });
        it('properly transpiles complex multiline template string in array def, with nested template', () => {
            testTranspile(`
                sub main()
                    a = [
                        "one",
                        "two",
                        \`I am a complex example \${a.isRunning([
                            "a",
                            "b",
                            "c",
                            \`d_open \${"inside" + m.items[1]} d_close\`
                        ])}\`
                    ]
                end sub
            `, `
                sub main()
                    a = [
                        "one"
                        "two"
                        ("I am a complex example " + bslib_toString(a.isRunning([
                            "a"
                            "b"
                            "c"
                            ("d_open " + bslib_toString("inside" + m.items[1]) + " d_close")
                        ])))
                    ]
                end sub
            `);
        });
        it('properly transpiles two expressions side-by-side', () => {
            testTranspile(`
                sub main()
                    a = \`\${"hello"}\${"world"}\`
                end sub
            `, `
                sub main()
                    a = ("hello" + "world")
                end sub
            `);
        });
        it('skips calling toString on strings', () => {
            testTranspile(`
                sub main()
                    text = \`Hello \${"world"}\`
                end sub
            `, `
                sub main()
                    text = ("Hello " + "world")
                end sub
            `);
        });
        describe('tagged template strings', () => {
            it('properly transpiles with escaped characters and quasis', () => {
                testTranspile(`
                    function zombify(strings, values)
                    end function
                    sub main()
                        zombie = zombify\`Hello \${"world"}\`
                    end sub
                `, `
                    function zombify(strings, values)
                    end function

                    sub main()
                        zombie = zombify(["Hello ", ""], ["world"])
                    end sub
                `);
            });
            it('handles multiple embedded expressions', () => {
                testTranspile(`
                    function zombify(strings, values)
                    end function
                    sub main()
                        zombie = zombify\`Hello \${"world"} I am \${12} years old\`
                    end sub
                `, `
                    function zombify(strings, values)
                    end function

                    sub main()
                        zombie = zombify(["Hello ", " I am ", " years old"], ["world", 12])
                    end sub
                `);
            });
            it('wraps result in parens when we have at least one expression', () => {
                testTranspile(`
                    sub main()
                        print \`hello \${1}\`
                    end sub
                `, `
                    sub main()
                        print ("hello " + bslib_toString(1))
                    end sub
                `);
            });
            it('wraps result in parens when we have at least one escaped char', () => {
                testTranspile(`
                    sub main()
                        print \`hello \\nworld\`
                    end sub
                `, `
                    sub main()
                        print ("hello " + chr(10) + "world")
                    end sub
                `);
            });
            it('wraps result in parens when we have an expression and at least one escaped char', () => {
                testTranspile(`
                    sub main()
                        num = 1
                        print \`hello \${num} \\nworld\`
                    end sub
                `, `
                    sub main()
                        num = 1
                        print ("hello " + bslib_toString(num) + " " + chr(10) + "world")
                    end sub
                `);
            });
            it('does not wrap a plain string with parens', () => {
                testTranspile(`
                    sub main()
                        print \`hello world\`
                    end sub
                `, `
                    sub main()
                        print "hello world"
                    end sub
                `);
            });
            it('can be concatenated with regular string', () => {
                testTranspile(`
                    sub main()
                        thing = "this" + \`that\`
                        otherThing = \`that\` + "this"
                    end sub
                `, `
                    sub main()
                        thing = "this" + "that"
                        otherThing = "that" + "this"
                    end sub
                `, undefined, 'source/main.bs');
            });
        });
    });
    it('gets right position for annotation', () => {
        const parser = Parser_1.Parser.parse(`
            @template(\`
                <label id="theLabel" />
            \`)
            function init()
            end function
        `);
        const ann = parser.ast.statements[0].annotations[0];
        (0, chai_config_spec_1.expect)(ann.range).to.eql(util_1.util.createRange(1, 12, 3, 14));
    });
});
//# sourceMappingURL=TemplateStringExpression.spec.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testHelpers_spec_1 = require("../../../testHelpers.spec");
const util_1 = require("../../../util");
const Program_1 = require("../../../Program");
const sinon_1 = require("sinon");
const Parser_1 = require("../../Parser");
const chai_config_spec_1 = require("../../../chai-config.spec");
const TokenKind_1 = require("../../../lexer/TokenKind");
const Expression_1 = require("../../Expression");
const vscode_languageserver_protocol_1 = require("vscode-languageserver-protocol");
const testHelpers_spec_2 = require("../../../testHelpers.spec");
const sinon = (0, sinon_1.createSandbox)();
describe('ConstStatement', () => {
    let program;
    let parser;
    let testTranspile = (0, testHelpers_spec_1.getTestTranspile)(() => [program, testHelpers_spec_2.rootDir]);
    let testGetTypedef = (0, testHelpers_spec_1.getTestGetTypedef)(() => [program, testHelpers_spec_2.rootDir]);
    beforeEach(() => {
        program = new Program_1.Program({ rootDir: testHelpers_spec_2.rootDir, sourceMap: true });
        parser = new Parser_1.Parser();
    });
    afterEach(() => {
        sinon.restore();
        program.dispose();
    });
    it('does not prevent using `const` as a variable name in .brs files', () => {
        program.setFile('source/main.brs', `
            sub main()
                const = {
                    name: "Bob"
                }
                print const.name = {}
            end sub
        `);
        program.validate();
        (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
    });
    it('supports basic structure', () => {
        var _a, _b;
        parser.parse('const API_KEY = "abc"', { mode: Parser_1.ParseMode.BrighterScript });
        (0, testHelpers_spec_1.expectZeroDiagnostics)(parser);
        const statement = parser.ast.statements[0];
        (0, chai_config_spec_1.expect)((_a = statement.tokens.const) === null || _a === void 0 ? void 0 : _a.kind).to.eql(TokenKind_1.TokenKind.Const);
        (0, chai_config_spec_1.expect)(statement.tokens.name).to.include({
            kind: TokenKind_1.TokenKind.Identifier,
            text: 'API_KEY'
        });
        const value = statement.value;
        (0, chai_config_spec_1.expect)(value).to.be.instanceof(Expression_1.LiteralExpression);
        (0, chai_config_spec_1.expect)((_b = value.token) === null || _b === void 0 ? void 0 : _b.text).to.eql('"abc"');
        //ensure range is correct
        (0, chai_config_spec_1.expect)(statement.range).to.eql(util_1.util.createRange(0, 0, 0, 21));
    });
    it('produces typedef', () => {
        testGetTypedef(`
            const API_KEY = "abc"
            const SOME_OBJ = {}
            const SOME_ARR = []
        `);
    });
    it('allows const with the name `optional`', () => {
        program.setFile('source/main.bs', `
            const optional = true
            namespace alpha
                const optional = true
            end namespace
            sub main()
                print optional
                print alpha.optional
            end sub
        `);
        program.validate();
        (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
    });
    describe('transpile', () => {
        it('transpiles simple consts', () => {
            testTranspile(`
                const API_KEY = "abc"
                sub main()
                    print API_KEY
                end sub
            `, `
                sub main()
                    print "abc"
                end sub
            `);
        });
        it('transpiles arrays', () => {
            testTranspile(`
                const WORDS = [
                    "alpha"
                    "beta"
                ]
                sub main()
                    print WORDS
                end sub
            `, `
                sub main()
                    print ([
                        "alpha"
                        "beta"
                    ])
                end sub
            `);
        });
        it('transpiles objects', () => {
            testTranspile(`
                const DEFAULTS = {
                    alpha: true
                    beta: true
                }
                sub main()
                    print DEFAULTS
                end sub
            `, `
                sub main()
                    print ({
                        alpha: true
                        beta: true
                    })
                end sub
            `);
        });
        it('supports consts inside namespaces', () => {
            testTranspile(`
                namespace network
                    const API_KEY = "abc"
                    sub get()
                        print API_KEY
                    end sub
                end namespace
                sub main()
                    print network.API_KEY
                end sub
            `, `
                sub network_get()
                    print "abc"
                end sub

                sub main()
                    print "abc"
                end sub
            `);
        });
        it('supports property access on complex objects', () => {
            testTranspile(`
                const DEFAULTS = {
                    enabled: true
                }
                sub main()
                    print DEFAULTS.enabled
                end sub
            `, `
                sub main()
                    print ({
                        enabled: true
                    }).enabled
                end sub
            `);
        });
        it('supports calling methods on consts', () => {
            testTranspile(`
                const API_KEY ="ABC"
                sub main()
                    print API_KEY.toString()
                end sub
            `, `
                sub main()
                    print "ABC".toString()
                end sub
            `);
        });
        it('transpiles within += operator', () => {
            testTranspile(`
                namespace constants
                    const API_KEY = "test"
                end namespace
                const API_URL = "url"
                sub main()
                    value = ""
                    value += constants.API_KEY
                    value += API_URL
                end sub
            `, `
                sub main()
                    value = ""
                    value += "test"
                    value += "url"
                end sub
            `);
        });
        it('transpiles nested consts that reference other consts within same namespace', () => {
            testTranspile(`
                namespace theming
                    const FLAG_A = "A"
                    const FLAG_B = "B"
                    const AD_BREAK_START = { a: FLAG_A, b: FLAG_B }
                end namespace
                sub main()
                    print theming.AD_BREAK_START
                end sub
            `, `
                sub main()
                    print ({
                        a: "A"
                        b: "B"
                    })
                end sub
            `);
        });
        it('transpiles nested consts that reference other consts in different namespaces', () => {
            testTranspile(`
                namespace aa.bb
                    const FLAG_A = "A"
                end namespace
                namespace main
                    const FLAG_B = "B"
                    const AD_BREAK_START = { a: aa.bb.FLAG_A, b: FLAG_B }
                end namespace
                sub main()
                    print main.AD_BREAK_START
                end sub
            `, `
                sub main()
                    print ({
                        a: "A"
                        b: "B"
                    })
                end sub
            `);
        });
        it('transpiles nested consts that reference other consts across files', () => {
            program.setFile('source/constants.bs', `
                namespace theming
                    const PRIMARY_COLOR = "blue"
                end namespace
                const FLAG_B = "B"
            `);
            testTranspile(`
                const SECONDARY_COLOR = theming.PRIMARY_COLOR
                const AD_BREAK_START = { a: SECONDARY_COLOR, b: FLAG_B }
                sub main()
                    print AD_BREAK_START
                end sub
            `, `
                sub main()
                    print ({
                        a: "blue"
                        b: "B"
                    })
                end sub
            `);
        });
        it('recursively resolves nested consts that reference other consts', () => {
            testTranspile(`
                const FLAG_A = "A"
                const FLAG_B = FLAG_A
                const AD_BREAK_START = { a: FLAG_A, b: FLAG_B }
                sub main()
                    print AD_BREAK_START
                end sub
            `, `
                sub main()
                    print ({
                        a: "A"
                        b: "A"
                    })
                end sub
            `);
        });
        it('handles the exact example from the issue - nested consts with namespace references', () => {
            testTranspile(`
                namespace aa.bb
                    const FLAG_A = "test"
                end namespace
                const FLAG_B = "another"
                const AD_BREAK_START = { a: aa.bb.FLAG_A, b: FLAG_B }
                sub main()
                    print AD_BREAK_START
                end sub
            `, `
                sub main()
                    print ({
                        a: "test"
                        b: "another"
                    })
                end sub
            `);
        });
        it('handles cyclical const references without infinite loop', () => {
            testTranspile(`
                const A = B
                const B = C
                const C = A
                sub main()
                    print A
                end sub
            `, `
                sub main()
                    print A
                end sub
            `);
        });
        it('resolves consts inside array literals', () => {
            testTranspile(`
                const FLAG_A = "A"
                const FLAG_B = "B"
                const MY_ARRAY = [FLAG_A, FLAG_B, "C"]
                sub main()
                    print MY_ARRAY
                end sub
            `, `
                sub main()
                    print ([
                        "A"
                        "B"
                        "C"
                    ])
                end sub
            `);
        });
        it('resolves enum used in const - same file', () => {
            testTranspile(`
                namespace Theming
                    enum Color
                        RED = "#FF0000"
                        BLUE = "#0000FF"
                    end enum
                    const PRIMARY_COLOR = Theming.Color.BLUE
                end namespace
                sub main()
                    a = Theming.PRIMARY_COLOR
                end sub
            `, `
                sub main()
                    a = "#0000FF"
                end sub
            `);
        });
        it('resolves enum used in const - cross file', () => {
            program.setFile('source/theming.bs', `
                namespace Theming
                    enum Color
                        BLACK = "#000000"
                        BLUE = "#0000FF"
                    end enum
                end namespace
            `);
            testTranspile(`
                namespace Theming
                    const PRIMARY_COLOR = Theming.Color.BLUE
                end namespace
                sub main()
                    a = Theming.PRIMARY_COLOR
                end sub
            `, `
                sub main()
                    a = "#0000FF"
                end sub
            `);
        });
        it('resolves const -> enum -> const -> enum chain across files', () => {
            program.setFile('source/theming1.bs', `
                namespace Theming
                    const BACKGROUND_COLOR = Theming.Color.BLACK
                end namespace
            `);
            program.setFile('source/theming2.bs', `
                namespace Theming
                    enum Color
                        BLACK = "#000000"
                        WHITE = "#FFFFFF"
                    end enum
                end namespace
            `);
            program.setFile('source/theming3.bs', `
                namespace Theming
                    const OVERLAY_COLOR = Theming.BACKGROUND_COLOR
                end namespace
            `);
            testTranspile(`
                sub test()
                    aa = {
                        backgroundOverlay: {
                            color: Theming.OVERLAY_COLOR
                        }
                    }
                end sub
            `, `
                sub test()
                    aa = {
                        backgroundOverlay: {
                            color: "#000000"
                        }
                    }
                end sub
            `);
        });
        it('resolves complex multi-file const-enum chain', () => {
            program.setFile('source/colors.bs', `
                namespace Theme
                    enum Color
                        PRIMARY = "#0000FF"
                        SECONDARY = "#00FF00"
                    end enum
                end namespace
            `);
            program.setFile('source/constants.bs', `
                namespace Theme
                    const MAIN_COLOR = Theme.Color.PRIMARY
                    const ALT_COLOR = Theme.MAIN_COLOR
                end namespace
            `);
            testTranspile(`
                sub main()
                    colors = {
                        main: Theme.ALT_COLOR
                        secondary: Theme.Color.SECONDARY
                    }
                end sub
            `, `
                sub main()
                    colors = {
                        main: "#0000FF"
                        secondary: "#00FF00"
                    }
                end sub
            `);
        });
    });
    describe('completions', () => {
        it('shows up in standard completions', () => {
            program.setFile('source/main.bs', `
                const API_KEY = "123"
                sub log(message)
                    log()
                end sub
            `);
            (0, testHelpers_spec_1.expectCompletionsIncludes)(
            // log(|)
            program.getCompletions('source/main.bs', util_1.util.createPosition(3, 24)), [{
                    label: 'API_KEY',
                    kind: vscode_languageserver_protocol_1.CompletionItemKind.Constant
                }]);
        });
        it('transpiles simple const in a unary expression', () => {
            testTranspile(`
                const foo = 1
                sub main()
                    bar = -foo
                end sub
            `, `
                sub main()
                    bar = -1
                end sub
            `, undefined, 'source/main.bs');
        });
        it('transpiles complex const in a unary expression', () => {
            testTranspile(`
                namespace some.consts
                    const foo = 1
                end namespace
                sub main()
                    bar = -some.consts.foo
                end sub
            `, `
                sub main()
                    bar = - 1
                end sub
            `, undefined, 'source/main.bs');
        });
        it('shows up in namespace completions', () => {
            program.setFile('source/main.bs', `
                namespace constants
                    const API_KEY = "123"
                end namespace
                sub log(message)
                    log(constants.)
                end sub
            `);
            (0, testHelpers_spec_1.expectCompletionsIncludes)(
            // log(|)
            program.getCompletions('source/main.bs', util_1.util.createPosition(5, 34)), [{
                    label: 'API_KEY',
                    kind: vscode_languageserver_protocol_1.CompletionItemKind.Constant
                }]);
        });
    });
});
//# sourceMappingURL=ConstStatement.spec.js.map
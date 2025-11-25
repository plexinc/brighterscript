"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../../../chai-config.spec");
const Expression_1 = require("../../Expression");
const DiagnosticMessages_1 = require("../../../DiagnosticMessages");
const testHelpers_spec_1 = require("../../../testHelpers.spec");
const Parser_1 = require("../../Parser");
const util_1 = require("../../../util");
const Statement_1 = require("../../Statement");
const Program_1 = require("../../../Program");
const sinon_1 = require("sinon");
const vscode_languageserver_protocol_1 = require("vscode-languageserver-protocol");
const visitors_1 = require("../../../astUtils/visitors");
const reflection_1 = require("../../../astUtils/reflection");
const vscode_uri_1 = require("vscode-uri");
const testHelpers_spec_2 = require("../../../testHelpers.spec");
const sinon = (0, sinon_1.createSandbox)();
describe('EnumStatement', () => {
    let program;
    let testTranspile = (0, testHelpers_spec_1.getTestTranspile)(() => [program, testHelpers_spec_2.rootDir]);
    beforeEach(() => {
        program = new Program_1.Program({ rootDir: testHelpers_spec_2.rootDir, sourceMap: true });
    });
    afterEach(() => {
        sinon.restore();
        program.dispose();
    });
    it('parses empty enum statement', () => {
        const parser = Parser_1.Parser.parse(`
            enum SomeEnum
            end enum
        `, { mode: Parser_1.ParseMode.BrighterScript });
        (0, testHelpers_spec_1.expectZeroDiagnostics)(parser);
        (0, chai_config_spec_1.expect)(parser.ast.statements[0]).to.be.instanceOf(Statement_1.EnumStatement);
    });
    it('supports annotations above', () => {
        const parser = Parser_1.Parser.parse(`
            @someAnnotation
            enum SomeEnum
            end enum
        `, { mode: Parser_1.ParseMode.BrighterScript });
        (0, testHelpers_spec_1.expectZeroDiagnostics)(parser);
        (0, chai_config_spec_1.expect)(parser.ast.statements[0].annotations[0].name).to.eql('someAnnotation');
    });
    it('constructs when missing enum name', () => {
        const parser = Parser_1.Parser.parse(`
            enum
            end enum
        `, { mode: Parser_1.ParseMode.BrighterScript });
        (0, testHelpers_spec_1.expectDiagnostics)(parser, [
            DiagnosticMessages_1.DiagnosticMessages.expectedIdentifier()
        ]);
        (0, chai_config_spec_1.expect)(parser.ast.statements[0]).to.be.instanceOf(Statement_1.EnumStatement);
    });
    it('collects uninitialized members', () => {
        const parser = Parser_1.Parser.parse(`
            enum Direction
                up
                down
                left
                right
            end enum
        `, { mode: Parser_1.ParseMode.BrighterScript });
        (0, testHelpers_spec_1.expectZeroDiagnostics)(parser);
        (0, chai_config_spec_1.expect)(parser.ast.statements[0].getMembers().map(x => x.tokens.name.text)).to.eql([
            'up',
            'down',
            'left',
            'right'
        ]);
    });
    it('collects int-initialized members', () => {
        const parser = Parser_1.Parser.parse(`
            enum Direction
                up = 1
                down = 2
                left = 3
                right = 4
            end enum
        `, { mode: Parser_1.ParseMode.BrighterScript });
        (0, testHelpers_spec_1.expectZeroDiagnostics)(parser);
        const values = parser.ast.statements[0].getMembers().map(x => x.value);
        (0, testHelpers_spec_1.expectInstanceOf)(values, [
            Expression_1.LiteralExpression,
            Expression_1.LiteralExpression,
            Expression_1.LiteralExpression,
            Expression_1.LiteralExpression
        ]);
        (0, chai_config_spec_1.expect)(values.map(x => x.token.text)).to.eql([
            '1',
            '2',
            '3',
            '4'
        ]);
    });
    it('collects string-initialized members', () => {
        const parser = Parser_1.Parser.parse(`
            enum Direction
                up = "u"
                down = "d"
                left = "l"
                right = "r"
            end enum
        `, { mode: Parser_1.ParseMode.BrighterScript });
        (0, testHelpers_spec_1.expectZeroDiagnostics)(parser);
        const values = parser.ast.statements[0].getMembers().map(x => x.value);
        (0, testHelpers_spec_1.expectInstanceOf)(values, [
            Expression_1.LiteralExpression,
            Expression_1.LiteralExpression,
            Expression_1.LiteralExpression,
            Expression_1.LiteralExpression
        ]);
        (0, chai_config_spec_1.expect)(values.map(x => x.token.text)).to.eql([
            '"u"',
            '"d"',
            '"l"',
            '"r"'
        ]);
    });
    it('flags when used in brs mode', () => {
        const parser = Parser_1.Parser.parse(`
            enum Direction
                up = "u"
                down = "d"
                left = "l"
                right = "r"
            end enum
        `, { mode: Parser_1.ParseMode.BrightScript });
        (0, testHelpers_spec_1.expectDiagnostics)(parser, [
            DiagnosticMessages_1.DiagnosticMessages.bsFeatureNotSupportedInBrsFiles('enum declarations')
        ]);
    });
    it('allows enum at top of file', () => {
        const parser = Parser_1.Parser.parse(`
            enum Direction
                value1
            end enum

            interface Person
                name as string
            end interface
        `, { mode: Parser_1.ParseMode.BrighterScript });
        (0, testHelpers_spec_1.expectZeroDiagnostics)(parser);
        (0, chai_config_spec_1.expect)(parser.statements[0]).instanceof(Statement_1.EnumStatement);
        (0, chai_config_spec_1.expect)(parser.statements[1]).instanceof(Statement_1.InterfaceStatement);
    });
    it('allows enum at bottom of file', () => {
        const parser = Parser_1.Parser.parse(`
            interface Person
                name as string
            end interface

            enum Direction
                value1
            end enum
        `, { mode: Parser_1.ParseMode.BrighterScript });
        (0, testHelpers_spec_1.expectZeroDiagnostics)(parser);
        (0, chai_config_spec_1.expect)(parser.statements[0]).instanceof(Statement_1.InterfaceStatement);
        (0, chai_config_spec_1.expect)(parser.statements[1]).instanceof(Statement_1.EnumStatement);
    });
    it('allows enum in namespace', () => {
        const file = program.setFile('source/types.bs', `
            namespace entities
                enum Person
                    name
                end enum
            end namespace

            enum Direction
                up
            end enum
        `);
        program.validate();
        (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
        (0, chai_config_spec_1.expect)(file.parser.references.enumStatements.map(x => x.fullName)).to.eql([
            'entities.Person',
            'Direction'
        ]);
    });
    describe('validation', () => {
        it('allows enums named `optional`', () => {
            program.setFile('source/main.bs', `
                enum optional
                    thing = 1
                end enum
            `);
            program.validate();
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
        });
        it('catches duplicate enums from same file', () => {
            program.setFile('source/main.bs', `
                enum Direction
                    up
                end enum

                enum Direction
                    up
                end enum
            `);
            program.validate();
            (0, testHelpers_spec_1.expectDiagnostics)(program, [Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.duplicateEnumDeclaration('source', 'Direction')), { relatedInformation: [{
                            location: util_1.util.createLocation(vscode_uri_1.URI.file((0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/source/main.bs`).toString(), util_1.util.createRange(1, 21, 1, 30)),
                            message: 'Enum declared here'
                        }] })]);
        });
        it('catches duplicate enums from different files in same scope', () => {
            program.setFile('source/main.bs', `
                enum Direction
                    up
                end enum
            `);
            program.setFile('source/lib.bs', `
                enum Direction
                    up
                end enum
            `);
            program.validate();
            (0, testHelpers_spec_1.expectDiagnostics)(program, [Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.duplicateEnumDeclaration('source', 'Direction')), { relatedInformation: [{
                            location: util_1.util.createLocation(vscode_uri_1.URI.file((0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/source/lib.bs`).toString(), util_1.util.createRange(1, 21, 1, 30)),
                            message: 'Enum declared here'
                        }] })]);
        });
        it('allows duplicate enums across different scopes', () => {
            program.setFile('source/main.bs', `
                enum Direction
                    up
                end enum
            `);
            program.setFile('components/comp1.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="Comp1" extends="Scene">
                    <script uri="comp1.bs" />
                </component>
            `);
            program.setFile('components/comp1.bs', `
                enum Direction
                    up
                end enum
            `);
            program.validate();
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
        });
        it('flags duplicate members', () => {
            program.setFile('source/main.bs', `
                enum Direction
                    name
                    name
                end enum
            `);
            program.validate();
            (0, testHelpers_spec_1.expectDiagnostics)(program, [Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.duplicateIdentifier('name')), { range: util_1.util.createRange(3, 20, 3, 24) })]);
        });
        it('flags mixed enum value types with int first', () => {
            program.setFile('source/main.bs', `
                enum Direction
                    a = 1
                    b = "c"
                end enum
            `);
            program.validate();
            (0, testHelpers_spec_1.expectDiagnostics)(program, [Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.enumValueMustBeType('integer')), { range: util_1.util.createRange(3, 24, 3, 27) })]);
        });
        it('flags mixed enum value types with string first', () => {
            program.setFile('source/main.bs', `
                enum Direction
                    a = "a"
                    b = 1
                end enum
            `);
            program.validate();
            (0, testHelpers_spec_1.expectDiagnostics)(program, [Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.enumValueMustBeType('string')), { range: util_1.util.createRange(3, 24, 3, 25) })]);
        });
        it('flags missing value for string enum when string is first item', () => {
            program.setFile('source/main.bs', `
                enum Direction
                    a = "a"
                    b
                end enum
            `);
            program.validate();
            (0, testHelpers_spec_1.expectDiagnostics)(program, [Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.enumValueIsRequired('string')), { range: util_1.util.createRange(3, 20, 3, 21) })]);
        });
        it('allows mixing-and-matching int and hex int', () => {
            program.setFile('source/main.bs', `
                enum Direction
                    a = 1
                    b = &HFF
                end enum
            `);
            program.validate();
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
        });
        it('allows floats', () => {
            program.setFile('source/main.bs', `
                enum Direction
                    a = 1.2
                    b = 5.2345
                end enum
            `);
            program.validate();
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
        });
        it('only support non-object literals', () => {
            program.setFile('source/main.bs', `
                enum AppConfig
                    serverInfo = {}
                end enum
            `);
            program.validate();
            (0, testHelpers_spec_1.expectDiagnostics)(program, [Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.enumValueMustBeType('integer')), { range: util_1.util.createRange(2, 33, 2, 35) })]);
        });
        it('considers -1 to be an integer', () => {
            program.setFile('source/main.bs', `
                enum AppConfig
                    alpha = 1
                    beta = -1
                end enum
            `);
            program.validate();
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
        });
        it('flags missing value for string enum where string is not first item', () => {
            program.setFile('source/main.bs', `
                enum Direction
                    a
                    b = "b" 'since this is the only value present, this is a string enum
                end enum
            `);
            program.validate();
            (0, testHelpers_spec_1.expectDiagnostics)(program, [Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.enumValueIsRequired('string')), { range: util_1.util.createRange(2, 20, 2, 21) })]);
        });
        it('catches unknown non-namespaced enum members', () => {
            program.setFile('source/main.bs', `
                enum Direction
                    up
                end enum

                sub main()
                    print Direction.up
                    print Direction.DOWN
                    print Direction.down
                end sub
            `);
            program.validate();
            (0, testHelpers_spec_1.expectDiagnostics)(program, [Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.unknownEnumValue('DOWN', 'Direction')), { range: util_1.util.createRange(7, 36, 7, 40) }), Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.unknownEnumValue('down', 'Direction')), { range: util_1.util.createRange(8, 36, 8, 40) })]);
        });
        it('catches unknown namespaced enum members', () => {
            program.setFile('source/main.bs', `
                sub main()
                    print Enums.Direction.DOWN
                    print Enums.Direction.down
                    print Enums.Direction.up
                end sub
                namespace Enums
                    enum Direction
                        up
                    end enum
                end namespace

            `);
            program.validate();
            (0, testHelpers_spec_1.expectDiagnostics)(program, [Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.unknownEnumValue('DOWN', 'Enums.Direction')), { range: util_1.util.createRange(2, 42, 2, 46) }), Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.unknownEnumValue('down', 'Enums.Direction')), { range: util_1.util.createRange(3, 42, 3, 46) })]);
        });
    });
    describe('getMemberValueMap', () => {
        function expectMemberValueMap(code, expected) {
            const file = program.setFile('source/lib.brs', code);
            const cancel = new vscode_languageserver_protocol_1.CancellationTokenSource();
            let firstEnum;
            file.ast.walk(statement => {
                if ((0, reflection_1.isEnumStatement)(statement)) {
                    firstEnum = statement;
                    cancel.cancel();
                }
            }, {
                walkMode: visitors_1.WalkMode.visitStatements,
                cancel: cancel.token
            });
            (0, chai_config_spec_1.expect)(firstEnum).to.exist;
            const values = firstEnum.getMemberValueMap();
            (0, chai_config_spec_1.expect)([...values].reduce((prev, [key, value]) => {
                prev[key] = value;
                return prev;
            }, {})).to.eql(expected);
        }
        it('defaults first enum value to 0', () => {
            expectMemberValueMap(`
                enum Direction
                    up
                    down
                    left
                    right
                end enum
            `, {
                up: '0',
                down: '1',
                left: '2',
                right: '3'
            });
        });
        it('continues incrementing after defined int value', () => {
            expectMemberValueMap(`
                enum Direction
                    up
                    down = 9
                    left
                    right = 20
                    other
                end enum
            `, {
                up: '0',
                down: '9',
                left: '10',
                right: '20',
                other: '21'
            });
        });
        it('returns string values when defined', () => {
            expectMemberValueMap(`
                enum Direction
                    up = "up"
                    down = "DOWN"
                    left = "LeFt"
                    right = "righT"
                end enum
            `, {
                up: '"up"',
                down: '"DOWN"',
                left: '"LeFt"',
                right: '"righT"'
            });
        });
    });
    describe('transpile', () => {
        it('supports non-namespaced enum from within a namespace', () => {
            program.options.autoImportComponentScript = true;
            testTranspile(`
                namespace alpha
                    sub test()
                        print Direction.up
                    end sub
                end namespace
                enum Direction
                    up = "up"
                end enum
            `, `
                sub alpha_test()
                    print "up"
                end sub
            `);
        });
        it('transpiles negative number', () => {
            testTranspile(`
                sub main()
                    print Direction.up
                end sub
                enum Direction
                    up = -1
                end enum
            `, `
                sub main()
                    print -1
                end sub
            `, undefined, undefined, false);
        });
        it('includes original value when no value could be computed', () => {
            testTranspile(`
                sub main()
                    print Direction.up
                end sub
                enum Direction
                    up = {}
                end enum
            `, `
                sub main()
                    print invalid
                end sub
            `, undefined, undefined, false);
        });
        it('writes all literal values as-is (even if there are errors)', () => {
            testTranspile(`
                sub main()
                    print Direction.up
                    print Direction.down
                    print Direction.left
                    print Direction.right
                    print Direction.upRight
                end sub
                enum Direction
                    up = 1
                    down = "asdf"
                    left = 3.14
                    right = &HFF '255
                    upRight ' will be 256 since hex ints are parsed as ints
                end enum
            `, `
                sub main()
                    print 1
                    print "asdf"
                    print 3.14
                    print &HFF
                    print 256
                end sub
            `, 'trim', undefined, false);
        });
        it('supports default-as-integer', () => {
            testTranspile(`
                enum Direction
                    up
                    down
                    left
                    right
                end enum
                sub main()
                    print Direction.up, Direction.down, Direction.left, Direction.right
                end sub
            `, `
                sub main()
                    print 0, 1, 2, 3
                end sub
            `);
        });
        it('supports string enums', () => {
            testTranspile(`
                enum Direction
                    up = "up"
                    down = "down"
                    left = "left"
                    right = "right"
                end enum
                sub main()
                    print Direction.up, Direction.down, Direction.left, Direction.right
                end sub
            `, `
                sub main()
                    print "up", "down", "left", "right"
                end sub
            `);
        });
        it('recognizes namespace-relative enums', () => {
            program.setFile('source/main.bs', `
                namespace MyNamespace
                    enum MyEnum
                        val1
                        val2
                    end enum

                    function foo() as integer
                        return MyEnum.val1
                    end function
                end namespace
            `);
            program.validate();
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
        });
        it('replaces enum values from separate file with literals', () => {
            program.setFile('source/enum.bs', `
                enum CharacterType
                    Human = "Human"
                    Zombie = "Zombie"
                end enum
                namespace Locations
                    enum Houses
                        TownHouse
                        FarmHouse
                    end enum
                end namespace
            `);
            testTranspile(`
                sub test()
                    print CharacterType.Human
                    print CharacterType.Zombie
                    print Locations.Houses.TownHouse
                    print Locations.Houses.FarmHouse
                end sub
            `, `
                sub test()
                    print "Human"
                    print "Zombie"
                    print 0
                    print 1
                end sub
            `);
        });
        it('replaces enums in if statements', () => {
            testTranspile(`
                enum CharacterType
                    zombie = "zombie"
                end enum
                sub main()
                    if "one" = CharacterType.zombie or "two" = CharacterType.zombie and "three" = CharacterType.zombie
                        print true
                    end if
                end sub
            `, `
                sub main()
                    if "one" = "zombie" or "two" = "zombie" and "three" = "zombie"
                        print true
                    end if
                end sub
            `);
        });
    });
    describe('completions', () => {
        it('does not crash when completing enum members with unsupported values', () => {
            program.setFile('source/main.bs', `
                sub Main()
                    direction.obj
                end sub
                enum Direction
                    up
                    down
                    obj = {}
                end enum
            `);
            //      direction.|obj
            (0, testHelpers_spec_1.expectCompletionsIncludes)(program.getCompletions('source/main.bs', util_1.util.createPosition(2, 30)), [{
                    label: 'up',
                    kind: vscode_languageserver_protocol_1.CompletionItemKind.EnumMember
                }, {
                    label: 'down',
                    kind: vscode_languageserver_protocol_1.CompletionItemKind.EnumMember
                }, {
                    label: 'obj',
                    kind: vscode_languageserver_protocol_1.CompletionItemKind.EnumMember
                }]);
        });
        it('gets enum statement completions from global enum', () => {
            program.setFile('source/main.bs', `
                sub Main()
                    direction.down
                end sub
                enum Direction
                    up
                    down
                end enum
            `);
            //      |direction.down
            (0, testHelpers_spec_1.expectCompletionsIncludes)(program.getCompletions('source/main.bs', util_1.util.createPosition(2, 20)), [{
                    label: 'Direction',
                    kind: vscode_languageserver_protocol_1.CompletionItemKind.Enum
                }]);
            //      dire|ction.down
            (0, testHelpers_spec_1.expectCompletionsIncludes)(program.getCompletions('source/main.bs', util_1.util.createPosition(2, 24)), [{
                    label: 'Direction',
                    kind: vscode_languageserver_protocol_1.CompletionItemKind.Enum
                }]);
            //      direction|.down
            (0, testHelpers_spec_1.expectCompletionsIncludes)(program.getCompletions('source/main.bs', util_1.util.createPosition(2, 29)), [{
                    label: 'Direction',
                    kind: vscode_languageserver_protocol_1.CompletionItemKind.Enum
                }]);
        });
        it('gets enum member completions from global enum', () => {
            program.setFile('source/main.bs', `
                sub Main()
                    direction.down
                end sub
                enum Direction
                    up
                    down
                end enum
            `);
            //      direction.|down
            (0, testHelpers_spec_1.expectCompletionsIncludes)(program.getCompletions('source/main.bs', util_1.util.createPosition(2, 30)), [{
                    label: 'up',
                    kind: vscode_languageserver_protocol_1.CompletionItemKind.EnumMember
                }, {
                    label: 'down',
                    kind: vscode_languageserver_protocol_1.CompletionItemKind.EnumMember
                }]);
            //      direction.do|wn
            (0, testHelpers_spec_1.expectCompletionsIncludes)(program.getCompletions('source/main.bs', util_1.util.createPosition(2, 32)), [{
                    label: 'up',
                    kind: vscode_languageserver_protocol_1.CompletionItemKind.EnumMember
                }, {
                    label: 'down',
                    kind: vscode_languageserver_protocol_1.CompletionItemKind.EnumMember
                }]);
            //      direction.down|
            (0, testHelpers_spec_1.expectCompletionsIncludes)(program.getCompletions('source/main.bs', util_1.util.createPosition(2, 34)), [{
                    label: 'up',
                    kind: vscode_languageserver_protocol_1.CompletionItemKind.EnumMember
                }, {
                    label: 'down',
                    kind: vscode_languageserver_protocol_1.CompletionItemKind.EnumMember
                }]);
        });
        it('gets enum statement completions from namespaced enum', () => {
            program.setFile('source/main.bs', `
                sub Main()
                    enums.direction.down
                end sub
                namespace enums
                    enum Direction
                        up
                        down
                    end enum
                end namespace
            `);
            //      enums.|direction.down
            (0, testHelpers_spec_1.expectCompletionsIncludes)(program.getCompletions('source/main.bs', util_1.util.createPosition(2, 26)), [{
                    label: 'Direction',
                    kind: vscode_languageserver_protocol_1.CompletionItemKind.Enum
                }]);
            //      enums.dire|ction.down
            (0, testHelpers_spec_1.expectCompletionsIncludes)(program.getCompletions('source/main.bs', util_1.util.createPosition(2, 30)), [{
                    label: 'Direction',
                    kind: vscode_languageserver_protocol_1.CompletionItemKind.Enum
                }]);
            //      enums.direction|.down
            (0, testHelpers_spec_1.expectCompletionsIncludes)(program.getCompletions('source/main.bs', util_1.util.createPosition(2, 35)), [{
                    label: 'Direction',
                    kind: vscode_languageserver_protocol_1.CompletionItemKind.Enum
                }]);
        });
        it('gets enum member completions from namespaced enum', () => {
            program.setFile('source/main.bs', `
                sub Main()
                    enums.direction.down
                end sub
                namespace enums
                    enum Direction
                        up
                        down
                    end enum
                end namespace
            `);
            program.validate();
            //      enums.direction.|down
            (0, testHelpers_spec_1.expectCompletionsIncludes)(program.getCompletions('source/main.bs', util_1.util.createPosition(2, 36)), [{
                    label: 'up',
                    kind: vscode_languageserver_protocol_1.CompletionItemKind.EnumMember
                }, {
                    label: 'down',
                    kind: vscode_languageserver_protocol_1.CompletionItemKind.EnumMember
                }]);
            //      enums.direction.do|wn
            (0, testHelpers_spec_1.expectCompletionsIncludes)(program.getCompletions('source/main.bs', util_1.util.createPosition(2, 38)), [{
                    label: 'up',
                    kind: vscode_languageserver_protocol_1.CompletionItemKind.EnumMember
                }, {
                    label: 'down',
                    kind: vscode_languageserver_protocol_1.CompletionItemKind.EnumMember
                }]);
            //      enums.direction.down|
            (0, testHelpers_spec_1.expectCompletionsIncludes)(program.getCompletions('source/main.bs', util_1.util.createPosition(2, 40)), [{
                    label: 'up',
                    kind: vscode_languageserver_protocol_1.CompletionItemKind.EnumMember
                }, {
                    label: 'down',
                    kind: vscode_languageserver_protocol_1.CompletionItemKind.EnumMember
                }]);
        });
        it('excludes enum member completions from namespace enum', () => {
            program.setFile('source/main.bs', `
                sub Main()
                    direction.ba
                end sub
                namespace enums
                    enum Direction
                        up
                        down
                    end enum
                end namespace
            `);
            program.validate();
            //should NOT find Direction because it's not directly available at the top level (you need to go through `enums.` to get at it)
            //      dire|ction.down
            (0, testHelpers_spec_1.expectCompletionsExcludes)(program.getCompletions('source/main.bs', util_1.util.createPosition(2, 24)), [{
                    label: 'Direction',
                    kind: vscode_languageserver_protocol_1.CompletionItemKind.Enum
                }]);
        });
        it('infers namespace for enum statement completions', () => {
            program.setFile('source/main.bs', `
                namespace enums
                    sub Main()
                        direction.down
                    end sub
                    enum Direction
                        up
                        down
                    end enum
                end namespace
                enum Logic
                    yes
                    no
                end enum
            `);
            //          dire|ction.down
            (0, testHelpers_spec_1.expectCompletionsIncludes)(program.getCompletions('source/main.bs', util_1.util.createPosition(3, 33)), [{
                    label: 'Direction',
                    kind: vscode_languageserver_protocol_1.CompletionItemKind.Enum
                }, {
                    label: 'Logic',
                    kind: vscode_languageserver_protocol_1.CompletionItemKind.Enum
                }]);
        });
        it('infers namespace for enum member completions', () => {
            program.setFile('source/main.bs', `
                namespace enums
                    sub Main()
                        direction.down
                    end sub
                    enum Direction
                        up
                        down
                    end enum
                end namespace
            `);
            //          direction.do|wn
            (0, testHelpers_spec_1.expectCompletionsIncludes)(program.getCompletions('source/main.bs', util_1.util.createPosition(3, 36)), [{
                    label: 'up',
                    kind: vscode_languageserver_protocol_1.CompletionItemKind.EnumMember
                }, {
                    label: 'down',
                    kind: vscode_languageserver_protocol_1.CompletionItemKind.EnumMember
                }]);
        });
        it('supports explicit namespace for enum statement completions', () => {
            program.setFile('source/main.bs', `
                namespace enums
                    sub Main()
                        enums.direction.down
                    end sub
                    enum Direction
                        up
                        down
                    end enum
                end namespace
            `);
            //          enums.dire|ction.down
            (0, testHelpers_spec_1.expectCompletionsIncludes)(program.getCompletions('source/main.bs', util_1.util.createPosition(3, 38)), [{
                    label: 'Direction',
                    kind: vscode_languageserver_protocol_1.CompletionItemKind.Enum
                }]);
        });
        it('supports explicit namespace for enum statement completions', () => {
            program.setFile('source/main.bs', `
                namespace logger
                    sub log()
                        enums.direction.down
                    end sub
                end namespace
                namespace enums
                    enum Direction
                        up
                        down
                    end enum
                end namespace
            `);
            //          enums.dire|ction.down
            (0, testHelpers_spec_1.expectCompletionsIncludes)(program.getCompletions('source/main.bs', util_1.util.createPosition(3, 38)), [{
                    label: 'Direction',
                    kind: vscode_languageserver_protocol_1.CompletionItemKind.Enum
                }]);
        });
    });
    it('transpiles simple enum in a unary expression', () => {
        testTranspile(`
            enum SomeEnum
                foo = 1
            end enum
            sub main()
                bar = -SomeEnum.foo
            end sub
        `, `
            sub main()
                bar = - 1
            end sub
        `, undefined, 'source/main.bs');
    });
    it('transpiles comples enum in a unary expression', () => {
        testTranspile(`
            namespace name.space
                enum SomeEnum
                    foo = 1
                end enum
            end namespace
            sub main()
                bar = -name.space.SomeEnum.foo
            end sub
        `, `
            sub main()
                bar = - 1
            end sub
        `, undefined, 'source/main.bs');
    });
    it('handles both sides of a logical expression', () => {
        testTranspile(`
            sub main()
                dir = m.direction = Direction.up
                dir = Direction.up = m.direction
            end sub
            enum Direction
                up = "up"
                down = "down"
            end enum
        `, `
            sub main()
                dir = m.direction = "up"
                dir = "up" = m.direction
            end sub
        `);
    });
    it('handles when found in boolean expressions', () => {
        testTranspile(`
            sub main()
                result = Direction.up = "up" or Direction.down = "down" and Direction.up = Direction.down
            end sub
            enum Direction
                up = "up"
                down = "down"
            end enum
        `, `
            sub main()
                result = "up" = "up" or "down" = "down" and "up" = "down"
            end sub
        `);
    });
    it('replaces enum values in if statements', () => {
        testTranspile(`
            sub main()
                if m.direction = Direction.up
                    print Direction.up
                end if
            end sub
            enum Direction
                up = "up"
                down = "down"
            end enum
        `, `
            sub main()
                if m.direction = "up"
                    print "up"
                end if
            end sub
        `);
    });
    it('replaces enum values in function default parameter value expressions', () => {
        testTranspile(`
            sub speak(dir = Direction.up)
            end sub
            enum Direction
                up = "up"
            end enum
        `, `
            sub speak(dir = "up")
            end sub
        `);
    });
    it('replaces enum values in for loops', () => {
        testTranspile(`
            sub main()
                for i = Loop.start to Loop.end step Loop.step
                end for
            end sub
            enum Loop
                start = 0
                end = 10
                step = 1
            end enum
        `, `
            sub main()
                for i = 0 to 10 step 1
                end for
            end sub
        `);
    });
    it('transpiles enum values when used in complex expressions', () => {
        testTranspile(`
            sub main()
                print Direction.up.toStr()
            end sub
            enum Direction
                up = "up"
                down = "down"
            end enum
        `, `
            sub main()
                print "up".toStr()
            end sub
        `);
    });
});
//# sourceMappingURL=Enum.spec.js.map
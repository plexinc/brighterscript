"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../../../chai-config.spec");
const Parser_1 = require("../../Parser");
const Lexer_1 = require("../../../lexer/Lexer");
const TokenKind_1 = require("../../../lexer/TokenKind");
const vscode_languageserver_1 = require("vscode-languageserver");
const testHelpers_spec_1 = require("../../../testHelpers.spec");
describe('parser', () => {
    describe('`end` keyword', () => {
        it('does not produce diagnostics', () => {
            var _a;
            let { tokens } = Lexer_1.Lexer.scan(`
                sub Main()
                    end
                end sub
            `);
            let { diagnostics } = Parser_1.Parser.parse(tokens);
            (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).to.not.exist;
        });
        it('can be used as a property name on objects', () => {
            let { tokens } = Lexer_1.Lexer.scan(`
                sub Main()
                    person = {
                        end: true
                    }
                end sub
            `);
            let { diagnostics } = Parser_1.Parser.parse(tokens);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        });
        it('is not allowed as a standalone variable', () => {
            //this test depends on token locations, so use the lexer to generate those locations.
            let { tokens } = Lexer_1.Lexer.scan(`sub Main()\n    else = true\nend sub`);
            let { diagnostics } = Parser_1.Parser.parse(tokens);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(1);
            //specifically check for the error location, because the identifier location was wrong in the past
            (0, chai_config_spec_1.expect)(diagnostics[0].range).to.deep.include(vscode_languageserver_1.Range.create(1, 4, 1, 8));
        });
    });
    it('certain reserved words are allowed as local var identifiers', () => {
        let { tokens } = Lexer_1.Lexer.scan(`
            sub Main()
                endfor = true
                double = true
                exitfor = true
                float = true
                foreach = true
                integer = true
                longinteger = true
                string = true
            end sub
        `);
        let { diagnostics } = Parser_1.Parser.parse(tokens);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
    });
    it('most reserved words are not allowed as local var identifiers', () => {
        let statementList = [];
        [...TokenKind_1.DisallowedLocalIdentifiersText].filter(x => x === 'if').forEach((disallowedIdentifier) => {
            //use the lexer to generate tokens because there are many different TokenKind types represented in this list
            let { tokens } = Lexer_1.Lexer.scan(`
                sub main()
                    ${disallowedIdentifier} = true
                end sub
            `);
            let { statements, diagnostics } = Parser_1.Parser.parse(tokens);
            if (diagnostics.length === 0) {
                console.log(TokenKind_1.DisallowedLocalIdentifiersText);
                throw new Error(`'${disallowedIdentifier}' cannot be used as an identifier, but was not detected as an error`);
            }
            statementList.push(statements);
        });
    });
    it('allows certain TokenKinds to be treated as local variables', () => {
        //a few additional keywords that we don't have tokenKinds for
        (0, testHelpers_spec_1.expectZeroDiagnostics)(Parser_1.Parser.parse(`
                sub main()
                    Void = true
                    Number = true
                    Boolean = true
                    Integer = true
                    LongInteger = true
                    Float = true
                    Double = true
                    String = true
                    Object = true
                    Interface = true
                    Dynamic = true
                    Class = true
                    Namespace = true
                end sub
            `));
    });
    it('allows certain TokenKinds as object properties', () => {
        let kinds = [
            TokenKind_1.TokenKind.As,
            TokenKind_1.TokenKind.And,
            TokenKind_1.TokenKind.Box,
            TokenKind_1.TokenKind.CreateObject,
            TokenKind_1.TokenKind.Dim,
            TokenKind_1.TokenKind.Then,
            TokenKind_1.TokenKind.Else,
            TokenKind_1.TokenKind.End,
            TokenKind_1.TokenKind.EndFunction,
            TokenKind_1.TokenKind.EndFor,
            TokenKind_1.TokenKind.EndIf,
            TokenKind_1.TokenKind.EndSub,
            TokenKind_1.TokenKind.EndWhile,
            TokenKind_1.TokenKind.Eval,
            TokenKind_1.TokenKind.Exit,
            TokenKind_1.TokenKind.ExitFor,
            TokenKind_1.TokenKind.ExitWhile,
            TokenKind_1.TokenKind.False,
            TokenKind_1.TokenKind.For,
            TokenKind_1.TokenKind.ForEach,
            TokenKind_1.TokenKind.Function,
            TokenKind_1.TokenKind.GetGlobalAA,
            TokenKind_1.TokenKind.GetLastRunCompileError,
            TokenKind_1.TokenKind.GetLastRunRunTimeError,
            TokenKind_1.TokenKind.Goto,
            TokenKind_1.TokenKind.If,
            TokenKind_1.TokenKind.Invalid,
            TokenKind_1.TokenKind.Let,
            TokenKind_1.TokenKind.Next,
            TokenKind_1.TokenKind.Not,
            TokenKind_1.TokenKind.ObjFun,
            TokenKind_1.TokenKind.Or,
            TokenKind_1.TokenKind.Pos,
            TokenKind_1.TokenKind.Print,
            TokenKind_1.TokenKind.Rem,
            TokenKind_1.TokenKind.Return,
            TokenKind_1.TokenKind.Step,
            TokenKind_1.TokenKind.Stop,
            TokenKind_1.TokenKind.Sub,
            TokenKind_1.TokenKind.Tab,
            TokenKind_1.TokenKind.To,
            TokenKind_1.TokenKind.True,
            TokenKind_1.TokenKind.Type,
            TokenKind_1.TokenKind.While,
            TokenKind_1.TokenKind.Void,
            TokenKind_1.TokenKind.Boolean,
            TokenKind_1.TokenKind.Integer,
            TokenKind_1.TokenKind.LongInteger,
            TokenKind_1.TokenKind.Float,
            TokenKind_1.TokenKind.Double,
            TokenKind_1.TokenKind.String,
            TokenKind_1.TokenKind.Object,
            TokenKind_1.TokenKind.Interface,
            TokenKind_1.TokenKind.Dynamic,
            TokenKind_1.TokenKind.Void,
            TokenKind_1.TokenKind.As
        ].map(x => x.toLowerCase());
        for (let kind of kinds) {
            let { tokens } = Lexer_1.Lexer.scan(`
                obj = {
                    ${kind}: true
                }
                obj.${kind} = false
                theValue = obj.${kind}
            `);
            let { diagnostics } = Parser_1.Parser.parse(tokens);
            if (diagnostics.length > 0) {
                throw new Error(`Using "${kind}" as object property. Expected no diagnostics, but received: ${JSON.stringify(diagnostics)}`);
            }
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        }
    });
    it('allows whitelisted reserved words as object properties', () => {
        //use the lexer to generate token list because...this list is huge.
        let { tokens } = Lexer_1.Lexer.scan(`
            sub Main()
                person = {}
                person.and = true
                person.box = true
                person.createobject = true
                person.dim = true
                person.double = true
                person.each = true
                person.else = true
                person.elseif = true
                person.end = true
                person.endfor = true
                person.endfunction = true
                person.endif = true
                person.endsub = true
                person.endwhile = true
                person.eval = true
                person.exit = true
                person.exitfor = true
                person.exitwhile = true
                person.false = true
                person.float = true
                person.for = true
                person.foreach = true
                person.function = true
                person.getglobalaa = true
                person.getlastruncompileerror = true
                person.getlastrunruntimeerror = true
                person.goto = true
                person.if = true
                person.integer = true
                person.invalid = true
                person.let = true
                person.line_num = true
                person.longinteger = true
                person.next = true
                person.not = true
                person.objfun = true
                person.or = true
                person.pos = true
                person.print = true
                'this one is broken
                'person.rem = true
                person.return = true
                person.run = true
                person.step = true
                person.stop = true
                person.string = true
                person.sub = true
                person.tab = true
                person.then = true
                person.to = true
                person.true = true
                person.type = true
                person.while = true
            end sub
        `);
        let { diagnostics } = Parser_1.Parser.parse(tokens);
        (0, chai_config_spec_1.expect)(JSON.stringify(diagnostics[0])).not.to.exist;
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
    });
    it('allows rem as a property name only in certain situations', () => {
        let { tokens } = Lexer_1.Lexer.scan(`
            function main ()
                person = {
                    rem: 1
                }
                person = {
                    name: "bob": rem: 2
                }
                person = {
                    rem: 3: name: "bob"
                }
                person.rem = 4
            end function
            `);
        let { diagnostics, statements } = Parser_1.Parser.parse(tokens);
        (0, chai_config_spec_1.expect)(diagnostics).to.exist.and.be.lengthOf(0, 'Error count should be 0');
        (0, chai_config_spec_1.expect)(statements[0].func.body.statements[0].value.elements[0].text).to.equal('rem: 1');
        (0, chai_config_spec_1.expect)(statements[0].func.body.statements[1].value.elements[1].text).to.equal('rem: 2');
        (0, chai_config_spec_1.expect)(statements[0].func.body.statements[2].value.elements[0].text).to.equal('rem: 3: name: "bob"');
        (0, chai_config_spec_1.expect)(statements[0].func.body.statements[3].name.text).to.equal('rem');
    });
    it('handles quoted AA keys', () => {
        var _a;
        let { tokens } = Lexer_1.Lexer.scan(`
            function main(arg as string)
                twoDimensional = {
                    "has-second-layer": true,
                    level: 1
                    secondLayer: {
                        level: 2
                    }
                }
            end function
        `);
        let { statements, diagnostics } = Parser_1.Parser.parse(tokens);
        let element = statements[0].func.body.statements[0].value.elements[0];
        (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).not.to.exist;
        (0, chai_config_spec_1.expect)(element.keyToken.text).to.equal('"has-second-layer"');
    });
    it('extracts property names for completion', () => {
        const { tokens } = Lexer_1.Lexer.scan(`
            function main(arg as string)
                aa1 = {
                    "sprop1": 0,
                    prop1: 1
                    prop2: {
                        prop3: 2
                    }
                }
                aa2 = {
                    prop4: {
                        prop5: 5,
                        "sprop2": 0,
                        prop6: 6
                    },
                    prop7: 7
                }
                calling({
                    prop8: 8,
                    prop9: 9
                })
                aa1.field1 = 1
                aa1.field2.field3 = 2
                calling(aa2.field4, 3 + aa2.field5.field6)
            end function
        `);
        const expected = [
            'field1', 'field2', 'field3', 'field4', 'field5', 'field6',
            'prop1', 'prop2', 'prop3', 'prop4', 'prop5', 'prop6', 'prop7', 'prop8', 'prop9'
        ];
        const parser = Parser_1.Parser.parse(tokens);
        const { propertyHints: initialHints } = parser.references;
        (0, chai_config_spec_1.expect)(Object.keys(initialHints).sort()).to.deep.equal(expected, 'Initial hints');
        parser.invalidateReferences();
        const { propertyHints: refreshedHints } = parser.references;
        (0, chai_config_spec_1.expect)(Object.keys(refreshedHints).sort()).to.deep.equal(expected, 'Refreshed hints');
    });
    it('extracts property names matching JavaScript reserved names', () => {
        const { tokens } = Lexer_1.Lexer.scan(`
            function main(arg as string)
                aa1 = {
                    "constructor": 0,
                    constructor: 1
                    valueOf: {
                        toString: 2
                    }
                }
                aa1.constructor = 1
                aa1.valueOf.toString = 2
            end function
        `);
        const expected = [
            'constructor', 'tostring', 'valueof'
        ];
        const parser = Parser_1.Parser.parse(tokens);
        const { propertyHints: initialHints } = parser.references;
        (0, chai_config_spec_1.expect)(Object.keys(initialHints).sort()).to.deep.equal(expected, 'Initial hints');
        parser.invalidateReferences();
        const { propertyHints: refreshedHints } = parser.references;
        (0, chai_config_spec_1.expect)(Object.keys(refreshedHints).sort()).to.deep.equal(expected, 'Refreshed hints');
    });
});
//# sourceMappingURL=Misc.spec.js.map
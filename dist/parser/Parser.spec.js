"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.failStatementType = exports.rangeToArray = void 0;
const chai_config_spec_1 = require("../chai-config.spec");
const Lexer_1 = require("../lexer/Lexer");
const TokenKind_1 = require("../lexer/TokenKind");
const Expression_1 = require("./Expression");
const Parser_1 = require("./Parser");
const Statement_1 = require("./Statement");
const vscode_languageserver_1 = require("vscode-languageserver");
const DiagnosticMessages_1 = require("../DiagnosticMessages");
const reflection_1 = require("../astUtils/reflection");
const testHelpers_spec_1 = require("../testHelpers.spec");
const BrsTranspileState_1 = require("./BrsTranspileState");
const source_map_1 = require("source-map");
const BrsFile_1 = require("../files/BrsFile");
const Program_1 = require("../Program");
const visitors_1 = require("../astUtils/visitors");
describe('parser', () => {
    it('emits empty object when empty token list is provided', () => {
        (0, chai_config_spec_1.expect)(Parser_1.Parser.parse([])).to.deep.include({
            statements: [],
            diagnostics: []
        });
    });
    describe('findReferences', () => {
        it('gets called if references are missing', () => {
            const parser = Parser_1.Parser.parse(`
                sub main()
                end sub

                sub UnusedFunction()
                end sub
            `);
            (0, chai_config_spec_1.expect)(parser.references.functionStatements.map(x => x.name.text)).to.eql([
                'main',
                'UnusedFunction'
            ]);
            //simulate a tree-shaking plugin by removing the `UnusedFunction`
            parser.ast.statements.splice(1);
            //tell the parser we modified the AST and need to regenerate references
            parser.invalidateReferences();
            (0, chai_config_spec_1.expect)(parser['_references']).not.to.exist;
            //calling `references` automatically regenerates the references
            (0, chai_config_spec_1.expect)(parser.references.functionStatements.map(x => x.name.text)).to.eql([
                'main'
            ]);
        });
        function expressionsToStrings(expressions) {
            return [...expressions.values()].map(x => {
                const file = new BrsFile_1.BrsFile('', '', new Program_1.Program({}));
                const state = new BrsTranspileState_1.BrsTranspileState(file);
                return new source_map_1.SourceNode(null, null, null, x.transpile(state)).toString();
            });
        }
        it('works for references.expressions', () => {
            const parser = Parser_1.Parser.parse(`
                b += "plus-equal"
                a += 1 + 2
                b += getValue1() + getValue2()
                increment++
                decrement--
                some.node@.doCallfunc()
                bravo(3 + 4).jump(callMe())
                obj = {
                    val1: someValue
                }
                arr = [
                    one
                ]
                thing = alpha.bravo
                alpha.charlie()
                delta(alpha.delta)
                call1().a.b.call2()
                class Person
                    name as string = "bob"
                end class
                function thing(p1 = name.space.getSomething())

                end function
            `);
            const expected = [
                '"plus-equal"',
                'b',
                'b += "plus-equal"',
                '1',
                '2',
                'a',
                'a += 1 + 2',
                'getValue1()',
                'getValue2()',
                'b',
                'b += getValue1() + getValue2()',
                'increment++',
                'decrement--',
                //currently the "toString" does a transpile, so that's why this is different.
                'some.node.callfunc("doCallfunc", invalid)',
                '3',
                '4',
                '3 + 4',
                'callMe()',
                'bravo(3 + 4).jump(callMe())',
                'someValue',
                '{\n    val1: someValue\n}',
                'one',
                '[\n    one\n]',
                'alpha.bravo',
                'alpha.charlie()',
                'alpha.delta',
                'delta(alpha.delta)',
                'call1().a.b.call2()',
                '"bob"',
                'name.space.getSomething()'
            ];
            (0, chai_config_spec_1.expect)(expressionsToStrings(parser.references.expressions)).to.eql(expected);
            //tell the parser we modified the AST and need to regenerate references
            parser.invalidateReferences();
            (0, chai_config_spec_1.expect)(expressionsToStrings(parser.references.expressions).sort()).to.eql(expected.sort());
        });
        it('works for references.expressions', () => {
            const parser = Parser_1.Parser.parse(`
                value = true or type(true) = "something" or Enums.A.Value = "value" and Enum1.Value = Name.Space.Enum2.Value
            `);
            const expected = [
                'true',
                'type(true)',
                '"something"',
                'true',
                'Enums.A.Value',
                '"value"',
                'Enum1.Value',
                'Name.Space.Enum2.Value',
                'true or type(true) = "something" or Enums.A.Value = "value" and Enum1.Value = Name.Space.Enum2.Value'
            ];
            (0, chai_config_spec_1.expect)(expressionsToStrings(parser.references.expressions)).to.eql(expected);
            //tell the parser we modified the AST and need to regenerate references
            parser.invalidateReferences();
            (0, chai_config_spec_1.expect)(expressionsToStrings(parser.references.expressions).sort()).to.eql(expected.sort());
        });
        it('works for logical expression', () => {
            const parser = Parser_1.Parser.parse(`
                value = Enums.A.Value = "value"
            `);
            const expected = [
                'Enums.A.Value',
                '"value"',
                'Enums.A.Value = "value"'
            ];
            (0, chai_config_spec_1.expect)(expressionsToStrings(parser.references.expressions)).to.eql(expected);
            //tell the parser we modified the AST and need to regenerate references
            parser.invalidateReferences();
            (0, chai_config_spec_1.expect)(expressionsToStrings(parser.references.expressions).sort()).to.eql(expected.sort());
        });
    });
    describe('callfunc operator', () => {
        it('is not allowed in brightscript mode', () => {
            var _a;
            let parser = parse(`
                sub main(node as dynamic)
                    node@.doSomething(1, 2)
                end sub
            `, Parser_1.ParseMode.BrightScript);
            (0, chai_config_spec_1.expect)((_a = parser.diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).to.equal(DiagnosticMessages_1.DiagnosticMessages.bsFeatureNotSupportedInBrsFiles('callfunc operator').message);
        });
        it('does not cause parse errors', () => {
            var _a, _b, _c, _d, _e;
            let parser = parse(`
                sub main(node as dynamic)
                    node@.doSomething(1, 2)
                end sub
            `, Parser_1.ParseMode.BrighterScript);
            (0, chai_config_spec_1.expect)((_a = parser.diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).not.to.exist;
            (0, chai_config_spec_1.expect)((_e = (_d = (_c = (_b = parser.statements[0]) === null || _b === void 0 ? void 0 : _b.func) === null || _c === void 0 ? void 0 : _c.body) === null || _d === void 0 ? void 0 : _d.statements[0]) === null || _e === void 0 ? void 0 : _e.expression).to.be.instanceof(Expression_1.CallfuncExpression);
        });
    });
    describe('optional chaining operator', () => {
        function getExpression(text, options) {
            const parser = parse(text, options === null || options === void 0 ? void 0 : options.parseMode);
            (0, testHelpers_spec_1.expectZeroDiagnostics)(parser);
            const expressions = [...parser.references.expressions];
            if (options === null || options === void 0 ? void 0 : options.matcher) {
                return expressions.find(options.matcher);
            }
            else {
                return expressions[0];
            }
        }
        it('works for ?.', () => {
            const expression = getExpression(`value = person?.name`);
            (0, chai_config_spec_1.expect)(expression).to.be.instanceOf(Expression_1.DottedGetExpression);
            (0, chai_config_spec_1.expect)(expression.dot.kind).to.eql(TokenKind_1.TokenKind.QuestionDot);
        });
        it('works for ?[', () => {
            const expression = getExpression(`value = person?["name"]`, { matcher: reflection_1.isIndexedGetExpression });
            (0, chai_config_spec_1.expect)(expression).to.be.instanceOf(Expression_1.IndexedGetExpression);
            (0, chai_config_spec_1.expect)(expression.openingSquare.kind).to.eql(TokenKind_1.TokenKind.QuestionLeftSquare);
            (0, chai_config_spec_1.expect)(expression.questionDotToken).not.to.exist;
        });
        it('works for ?.[', () => {
            var _a;
            const expression = getExpression(`value = person?.["name"]`, { matcher: reflection_1.isIndexedGetExpression });
            (0, chai_config_spec_1.expect)(expression).to.be.instanceOf(Expression_1.IndexedGetExpression);
            (0, chai_config_spec_1.expect)(expression.openingSquare.kind).to.eql(TokenKind_1.TokenKind.LeftSquareBracket);
            (0, chai_config_spec_1.expect)((_a = expression.questionDotToken) === null || _a === void 0 ? void 0 : _a.kind).to.eql(TokenKind_1.TokenKind.QuestionDot);
        });
        it('works for ?@', () => {
            const expression = getExpression(`value = someXml?@someAttr`);
            (0, chai_config_spec_1.expect)(expression).to.be.instanceOf(Expression_1.XmlAttributeGetExpression);
            (0, chai_config_spec_1.expect)(expression.at.kind).to.eql(TokenKind_1.TokenKind.QuestionAt);
        });
        it('works for ?(', () => {
            const expression = getExpression(`value = person.getName?()`);
            (0, chai_config_spec_1.expect)(expression).to.be.instanceOf(Expression_1.CallExpression);
            (0, chai_config_spec_1.expect)(expression.openingParen.kind).to.eql(TokenKind_1.TokenKind.QuestionLeftParen);
        });
        it('works for print statements using question mark', () => {
            const { statements } = parse(`
                ?[1]
                ?(1+1)
            `);
            (0, chai_config_spec_1.expect)(statements[0]).to.be.instanceOf(Statement_1.PrintStatement);
            (0, chai_config_spec_1.expect)(statements[1]).to.be.instanceOf(Statement_1.PrintStatement);
        });
        //TODO enable this once we properly parse IIFEs
        it.skip('works for ?( in anonymous function', () => {
            const expression = getExpression(`thing = (function() : end function)?()`);
            (0, chai_config_spec_1.expect)(expression).to.be.instanceOf(Expression_1.CallExpression);
            (0, chai_config_spec_1.expect)(expression.openingParen.kind).to.eql(TokenKind_1.TokenKind.QuestionLeftParen);
        });
        it('works for ?( in new call', () => {
            const expression = getExpression(`thing = new Person?()`, { parseMode: Parser_1.ParseMode.BrighterScript });
            (0, chai_config_spec_1.expect)(expression).to.be.instanceOf(Expression_1.NewExpression);
            (0, chai_config_spec_1.expect)(expression.call.openingParen.kind).to.eql(TokenKind_1.TokenKind.QuestionLeftParen);
        });
        it('distinguishes between optional chaining and ternary expression', () => {
            const parser = parse(`
                sub main()
                    name = person?["name"]
                    isTrue = true
                    key = isTrue ? ["name"] : ["age"]
                end sub
            `, Parser_1.ParseMode.BrighterScript);
            (0, chai_config_spec_1.expect)(parser.references.assignmentStatements[0].value).is.instanceof(Expression_1.IndexedGetExpression);
            (0, chai_config_spec_1.expect)(parser.references.assignmentStatements[2].value).is.instanceof(Expression_1.TernaryExpression);
        });
        it('distinguishes between optional chaining and ternary expression', () => {
            const parser = parse(`
                sub main()
                    'optional chain. the lack of whitespace between ? and [ matters
                    key = isTrue ?["name"] : getDefault()
                    'ternary
                    key = isTrue ? ["name"] : getDefault()
                end sub
            `, Parser_1.ParseMode.BrighterScript);
            (0, chai_config_spec_1.expect)(parser.references.assignmentStatements[0].value).is.instanceof(Expression_1.IndexedGetExpression);
            (0, chai_config_spec_1.expect)(parser.references.assignmentStatements[1].value).is.instanceof(Expression_1.TernaryExpression);
        });
    });
    describe('diagnostic locations', () => {
        it('tracks basic diagnostic locations', () => {
            (0, chai_config_spec_1.expect)(parse(`
                sub main()
                    call()a
                end sub
            `).diagnostics.map(x => rangeToArray(x.range))).to.eql([
                [2, 26, 2, 27],
                [2, 27, 2, 28]
            ]);
        });
        it.skip('handles edge cases', () => {
            var _a, _b;
            let diagnostics = parse(`
                function BuildCommit()
                    return "6c5cdf1"
                end functionasdf
            `).diagnostics;
            (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).to.exist.and.to.eql(DiagnosticMessages_1.DiagnosticMessages.expectedStatementOrFunctionCallButReceivedExpression().message);
            (0, chai_config_spec_1.expect)((_b = diagnostics[0]) === null || _b === void 0 ? void 0 : _b.range).to.eql(vscode_languageserver_1.Range.create(3, 20, 3, 32));
        });
    });
    describe('parse', () => {
        it('supports ungrouped iife in assignment', () => {
            const parser = parse(`
                sub main()
                    result = sub()
                    end sub()
                    result = function()
                    end function()
                end sub
            `);
            (0, testHelpers_spec_1.expectZeroDiagnostics)(parser);
        });
        it('supports grouped iife in assignment', () => {
            const parser = parse(`
                sub main()
                    result = (sub()
                    end sub)()
                    result = (function()
                    end function)()
                end sub
            `);
            (0, testHelpers_spec_1.expectZeroDiagnostics)(parser);
        });
        it('supports returning iife call', () => {
            const parser = parse(`
                sub main()
                    return (sub()
                    end sub)()
                end sub
            `);
            (0, testHelpers_spec_1.expectZeroDiagnostics)(parser);
        });
        it('supports using "interface" as parameter name', () => {
            var _a;
            (0, chai_config_spec_1.expect)((_a = parse(`
                sub main(interface as object)
                end sub
            `, Parser_1.ParseMode.BrighterScript).diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).not.to.exist;
        });
        it('does not scrap the entire function when encountering unknown parameter type', () => {
            const parser = parse(`
                sub test(param1 as unknownType)
                end sub
            `);
            (0, testHelpers_spec_1.expectDiagnostics)(parser, [Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.functionParameterTypeIsInvalid('param1', 'unknownType'))]);
            (0, chai_config_spec_1.expect)((0, reflection_1.isFunctionStatement)(parser.ast.statements[0])).to.be.true;
        });
        describe('namespace', () => {
            it('allows namespaces declared inside other namespaces', () => {
                const parser = parse(`
                    namespace Level1
                        namespace Level2.Level3
                            sub main()
                            end sub
                        end namespace
                    end namespace
                `, Parser_1.ParseMode.BrighterScript);
                (0, testHelpers_spec_1.expectZeroDiagnostics)(parser);
                // We expect these names to be "as given" in this context, because we aren't evaluating a full program.
                (0, chai_config_spec_1.expect)(parser.references.namespaceStatements.map(statement => statement.getName(Parser_1.ParseMode.BrighterScript))).to.deep.equal([
                    'Level1.Level2.Level3',
                    'Level1'
                ]);
            });
            it('parses empty namespace', () => {
                var _a;
                let { statements, diagnostics } = parse(`
                        namespace Name.Space
                        end namespace
                    `, Parser_1.ParseMode.BrighterScript);
                (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).not.to.exist;
                (0, chai_config_spec_1.expect)(statements[0]).to.be.instanceof(Statement_1.NamespaceStatement);
            });
            it('includes body', () => {
                var _a;
                let { statements, diagnostics } = parse(`
                        namespace Name.Space
                            sub main()
                            end sub
                        end namespace
                    `, Parser_1.ParseMode.BrighterScript);
                (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).not.to.exist;
                (0, chai_config_spec_1.expect)(statements[0]).to.be.instanceof(Statement_1.NamespaceStatement);
                (0, chai_config_spec_1.expect)(statements[0].body.statements[0]).to.be.instanceof(Statement_1.FunctionStatement);
            });
            it('supports comments and newlines', () => {
                var _a;
                let { diagnostics } = parse(`
                        namespace Name.Space 'comment

                        'comment

                            sub main() 'comment
                            end sub 'comment
                            'comment

                            'comment
                        end namespace 'comment
                    `, Parser_1.ParseMode.BrighterScript);
                (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).not.to.exist;
            });
            it('catches missing name', () => {
                var _a;
                let { diagnostics } = parse(`
                        namespace
                        end namespace
                    `, Parser_1.ParseMode.BrighterScript);
                (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).to.equal(DiagnosticMessages_1.DiagnosticMessages.expectedIdentifierAfterKeyword('namespace').message);
            });
            it('recovers after missing `end namespace`', () => {
                var _a, _b, _c;
                let parser = parse(`
                    namespace Name.Space
                        sub main()
                        end sub
                `, Parser_1.ParseMode.BrighterScript);
                (0, chai_config_spec_1.expect)(parser.ast.statements[0]).to.be.instanceof(Statement_1.NamespaceStatement);
                (0, chai_config_spec_1.expect)((_a = parser.diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).to.equal(DiagnosticMessages_1.DiagnosticMessages.couldNotFindMatchingEndKeyword('namespace').message);
                (0, chai_config_spec_1.expect)((_c = (_b = parser.ast.statements[0]) === null || _b === void 0 ? void 0 : _b.body) === null || _c === void 0 ? void 0 : _c.statements[0]).to.be.instanceof(Statement_1.FunctionStatement);
            });
            it('adds diagnostic when encountering namespace in brightscript mode', () => {
                var _a;
                let parser = Parser_1.Parser.parse(`
                    namespace Name.Space
                    end namespace
                `);
                (0, chai_config_spec_1.expect)((_a = parser.diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).to.equal(DiagnosticMessages_1.DiagnosticMessages.bsFeatureNotSupportedInBrsFiles('namespace').message);
            });
        });
        it('supports << operator', () => {
            var _a;
            (0, chai_config_spec_1.expect)((_a = parse(`
                sub main()
                    print ((r << 24) + (g << 16) + (b << 8) + a)
                end sub
            `).diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).not.to.exist;
        });
        it('supports >> operator', () => {
            var _a;
            (0, chai_config_spec_1.expect)((_a = parse(`
                sub main()
                    print ((r >> 24) + (g >> 16) + (b >> 8) + a)
                end sub
            `).diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).not.to.exist;
        });
        it('allows global function names with same as token to be called', () => {
            var _a;
            (0, chai_config_spec_1.expect)((_a = parse(`
                sub main()
                    print string(123)
                end sub
            `).diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).not.to.exist;
        });
        it('supports @ symbol between names', () => {
            var _a;
            let parser = parse(`
                sub main()
                    firstName = personXml@firstName
                    age = personXml.firstChild@age
                end sub
            `);
            (0, chai_config_spec_1.expect)((_a = parser.diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).to.not.exist;
            let statements = parser.statements[0].func.body.statements;
            let first = statements[0].value;
            (0, chai_config_spec_1.expect)(first).to.be.instanceof(Expression_1.XmlAttributeGetExpression);
            (0, chai_config_spec_1.expect)(first.name.text).to.equal('firstName');
            (0, chai_config_spec_1.expect)(first.at.text).to.equal('@');
            (0, chai_config_spec_1.expect)(first.obj.name.text).to.equal('personXml');
            let second = statements[1].value;
            (0, chai_config_spec_1.expect)(second).to.be.instanceof(Expression_1.XmlAttributeGetExpression);
            (0, chai_config_spec_1.expect)(second.name.text).to.equal('age');
            (0, chai_config_spec_1.expect)(second.at.text).to.equal('@');
            (0, chai_config_spec_1.expect)(second.obj.name.text).to.equal('firstChild');
        });
        it('does not allow chaining of @ symbols', () => {
            let parser = parse(`
                sub main()
                    personXml = invalid
                    name = personXml@name@age@shoeSize
                end sub
            `);
            (0, chai_config_spec_1.expect)(parser.diagnostics).not.to.be.empty;
        });
        it('unknown function type does not invalidate rest of function', () => {
            let { statements, diagnostics } = parse(`
                function log() as UNKNOWN_TYPE
                end function
            `, Parser_1.ParseMode.BrightScript);
            (0, chai_config_spec_1.expect)(diagnostics.length).to.be.greaterThan(0);
            (0, chai_config_spec_1.expect)(statements[0]).to.exist;
        });
        it('unknown function type is not a problem in Brighterscript mode', () => {
            let { statements, diagnostics } = parse(`
                function log() as UNKNOWN_TYPE
                end function
            `, Parser_1.ParseMode.BrighterScript);
            (0, chai_config_spec_1.expect)(diagnostics.length).to.equal(0);
            (0, chai_config_spec_1.expect)(statements[0]).to.exist;
        });
        it('allows namespaced function type in Brighterscript mode', () => {
            let { statements, diagnostics } = parse(`
                function log() as SOME_NAMESPACE.UNKNOWN_TYPE
                end function
            `, Parser_1.ParseMode.BrighterScript);
            (0, chai_config_spec_1.expect)(diagnostics.length).to.equal(0);
            (0, chai_config_spec_1.expect)(statements[0]).to.exist;
        });
        it('allows custom parameter types in BrighterscriptMode', () => {
            let { statements, diagnostics } = parse(`
                sub foo(value as UNKNOWN_TYPE)
                end sub
            `, Parser_1.ParseMode.BrighterScript);
            (0, chai_config_spec_1.expect)(diagnostics.length).to.equal(0);
            (0, chai_config_spec_1.expect)(statements[0]).to.exist;
        });
        it('does not allow custom parameter types in Brightscript Mode', () => {
            let { diagnostics } = parse(`
                sub foo(value as UNKNOWN_TYPE)
                end sub
            `, Parser_1.ParseMode.BrightScript);
            (0, chai_config_spec_1.expect)(diagnostics.length).not.to.equal(0);
        });
        it('allows custom namespaced parameter types in BrighterscriptMode', () => {
            let { statements, diagnostics } = parse(`
                sub foo(value as SOME_NAMESPACE.UNKNOWN_TYPE)
                end sub
            `, Parser_1.ParseMode.BrighterScript);
            (0, chai_config_spec_1.expect)(diagnostics.length).to.equal(0);
            (0, chai_config_spec_1.expect)(statements[0]).to.exist;
        });
        it('works with conditionals', () => {
            var _a;
            (0, chai_config_spec_1.expect)((_a = parse(`
                function printNumber()
                    if true then
                        print 1
                    else if true
                        return false
                    end if
                end function
            `).diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).not.to.exist;
        });
        it('supports single-line if statements', () => {
            var _a;
            (0, chai_config_spec_1.expect)((_a = parse(`If true Then print "error" : Stop`).diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).to.not.exist;
        });
        it('works with excess newlines', () => {
            var _a;
            let { tokens } = Lexer_1.Lexer.scan('function boolToNumber() as string\n\n' +
                '   if true then\n\n' +
                '       print 1\n\n' +
                '   elseif true then\n\n' +
                '       print 0\n\n' +
                '   else\n\n' +
                '       print 1\n\n' +
                '   end if\n\n' +
                'end function\n\n');
            (0, chai_config_spec_1.expect)((_a = Parser_1.Parser.parse(tokens).diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).to.not.exist;
        });
        it('does not invalidate entire file when line ends with a period', () => {
            let { tokens } = Lexer_1.Lexer.scan(`
                sub main()
                    person.a
                end sub

            `);
            let { diagnostics } = Parser_1.Parser.parse(tokens);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(1, 'Error count should be 0');
        });
        it.skip('allows printing object with trailing period', () => {
            let { tokens } = Lexer_1.Lexer.scan(`print a.`);
            let { statements, diagnostics } = Parser_1.Parser.parse(tokens);
            let printStatement = statements[0];
            (0, chai_config_spec_1.expect)(diagnostics).to.be.empty;
            (0, chai_config_spec_1.expect)(printStatement).to.be.instanceof(Statement_1.PrintStatement);
            (0, chai_config_spec_1.expect)(printStatement.expressions[0]).to.be.instanceof(Expression_1.DottedGetExpression);
        });
        describe('comments', () => {
            it('combines multi-line comments', () => {
                let { tokens } = Lexer_1.Lexer.scan(`
                    'line 1
                    'line 2
                    'line 3
                `);
                let { diagnostics, statements } = Parser_1.Parser.parse(tokens);
                (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0, 'Error count should be 0');
                (0, chai_config_spec_1.expect)(statements[0].text).to.equal(`'line 1\n'line 2\n'line 3`);
            });
            it('does not combile comments separated by newlines', () => {
                let { tokens } = Lexer_1.Lexer.scan(`
                    'line 1

                    'line 2

                    'line 3
                `);
                let { diagnostics, statements } = Parser_1.Parser.parse(tokens);
                (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0, 'Error count should be 0');
                (0, chai_config_spec_1.expect)(statements).to.be.lengthOf(3);
                (0, chai_config_spec_1.expect)(statements[0].text).to.equal(`'line 1`);
                (0, chai_config_spec_1.expect)(statements[1].text).to.equal(`'line 2`);
                (0, chai_config_spec_1.expect)(statements[2].text).to.equal(`'line 3`);
            });
            it('works after print statement', () => {
                let { tokens } = Lexer_1.Lexer.scan(`
                    sub main()
                        print "hi" 'comment 1
                    end sub
                `);
                let { diagnostics, statements } = Parser_1.Parser.parse(tokens);
                (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0, 'Error count should be 0');
                (0, chai_config_spec_1.expect)(statements[0].func.body.statements[1].text).to.equal(`'comment 1`);
            });
            it('declaration-level', () => {
                let { tokens } = Lexer_1.Lexer.scan(`
                    'comment 1
                    function a()
                    end function
                    'comment 2
                `);
                let { diagnostics, statements } = Parser_1.Parser.parse(tokens);
                (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0, 'Error count should be 0');
                (0, chai_config_spec_1.expect)(statements[0].text).to.equal(`'comment 1`);
                (0, chai_config_spec_1.expect)(statements[2].text).to.equal(`'comment 2`);
            });
            it('works in aa literal as its own statement', () => {
                let { tokens } = Lexer_1.Lexer.scan(`
                    obj = {
                        "name": true,
                        'comment
                    }
                `);
                let { diagnostics } = Parser_1.Parser.parse(tokens);
                (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0, 'Error count should be 0');
            });
            it('parses after function call', () => {
                let { tokens } = Lexer_1.Lexer.scan(`
                    sub Main()
                        name = "Hello"
                        DoSomething(name) 'comment 1
                    end sub
                `);
                let { diagnostics, statements } = Parser_1.Parser.parse(tokens);
                (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0, 'Should have zero diagnostics');
                (0, chai_config_spec_1.expect)(statements[0].func.body.statements[2].text).to.equal(`'comment 1`);
            });
            it('function', () => {
                let { tokens } = Lexer_1.Lexer.scan(`
                    function a() 'comment 1
                        'comment 2
                        num = 1
                        'comment 3
                    end function 'comment 4
                `);
                let { diagnostics, statements } = Parser_1.Parser.parse(tokens);
                (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0, 'Should have zero diagnostics');
                (0, chai_config_spec_1.expect)(statements[0].func.body.statements[0].text).to.equal(`'comment 1`);
                (0, chai_config_spec_1.expect)(statements[0].func.body.statements[1].text).to.equal(`'comment 2`);
                (0, chai_config_spec_1.expect)(statements[0].func.body.statements[3].text).to.equal(`'comment 3`);
                (0, chai_config_spec_1.expect)(statements[1].text).to.equal(`'comment 4`);
            });
            it('if statement`', () => {
                let { tokens } = Lexer_1.Lexer.scan(`
                    function a()
                        if true then 'comment 1
                            'comment 2
                            print "hello"
                            'comment 3
                        else if true then 'comment 4
                            'comment 5
                            print "hello"
                            'comment 6
                        else 'comment 7
                            'comment 8
                            print "hello"
                            'comment 9
                        end if 'comment 10
                    end function
                `);
                let { diagnostics, statements } = Parser_1.Parser.parse(tokens);
                (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0, 'Should have zero diagnostics');
                let fnSmt = statements[0];
                if ((0, reflection_1.isFunctionStatement)(fnSmt)) {
                    let ifStmt = fnSmt.func.body.statements[0];
                    if ((0, reflection_1.isIfStatement)(ifStmt)) {
                        expectCommentWithText(ifStmt.thenBranch.statements[0], `'comment 1`);
                        expectCommentWithText(ifStmt.thenBranch.statements[1], `'comment 2`);
                        expectCommentWithText(ifStmt.thenBranch.statements[3], `'comment 3`);
                        let elseIfBranch = ifStmt.elseBranch;
                        if ((0, reflection_1.isIfStatement)(elseIfBranch)) {
                            expectCommentWithText(elseIfBranch.thenBranch.statements[0], `'comment 4`);
                            expectCommentWithText(elseIfBranch.thenBranch.statements[1], `'comment 5`);
                            expectCommentWithText(elseIfBranch.thenBranch.statements[3], `'comment 6`);
                            let elseBranch = elseIfBranch.elseBranch;
                            if ((0, reflection_1.isBlock)(elseBranch)) {
                                expectCommentWithText(elseBranch.statements[0], `'comment 7`);
                                expectCommentWithText(elseBranch.statements[1], `'comment 8`);
                                expectCommentWithText(elseBranch.statements[3], `'comment 9`);
                            }
                            else {
                                failStatementType(elseBranch, 'Block');
                            }
                        }
                        else {
                            failStatementType(elseIfBranch, 'If');
                        }
                        expectCommentWithText(fnSmt.func.body.statements[1], `'comment 10`);
                    }
                    else {
                        failStatementType(ifStmt, 'If');
                    }
                }
                else {
                    failStatementType(fnSmt, 'Function');
                }
            });
            it('while', () => {
                let { tokens } = Lexer_1.Lexer.scan(`
                    function a()
                        while true 'comment 1
                            'comment 2
                            print "true"
                            'comment 3
                        end while 'comment 4
                    end function
                `);
                let { diagnostics, statements } = Parser_1.Parser.parse(tokens);
                (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0, 'Error count should be zero');
                let stmt = statements[0].func.body.statements[0];
                (0, chai_config_spec_1.expect)(stmt.body.statements[0].text).to.equal(`'comment 1`);
                (0, chai_config_spec_1.expect)(stmt.body.statements[1].text).to.equal(`'comment 2`);
                (0, chai_config_spec_1.expect)(stmt.body.statements[3].text).to.equal(`'comment 3`);
                (0, chai_config_spec_1.expect)(statements[0].func.body.statements[1].text).to.equal(`'comment 4`);
            });
            it('for', () => {
                let { tokens } = Lexer_1.Lexer.scan(`
                    function a()
                        for i = 0 to 10 step 1 'comment 1
                            'comment 2
                            print 1
                            'comment 3
                        end for 'comment 4
                    end function
                `);
                let { diagnostics, statements } = Parser_1.Parser.parse(tokens);
                (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0, 'Error count should be zero');
                let stmt = statements[0].func.body.statements[0];
                (0, chai_config_spec_1.expect)(stmt.body.statements[0].text).to.equal(`'comment 1`);
                (0, chai_config_spec_1.expect)(stmt.body.statements[1].text).to.equal(`'comment 2`);
                (0, chai_config_spec_1.expect)(stmt.body.statements[3].text).to.equal(`'comment 3`);
                (0, chai_config_spec_1.expect)(statements[0].func.body.statements[1].text).to.equal(`'comment 4`);
            });
            it('for each', () => {
                let { tokens } = Lexer_1.Lexer.scan(`
                    function a()
                        for each val in [1,2,3] 'comment 1
                            'comment 2
                            print 1
                            'comment 3
                        end for 'comment 4
                    end function
                `);
                let { diagnostics, statements } = Parser_1.Parser.parse(tokens);
                (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0, 'Error count should be zero');
                let stmt = statements[0].func.body.statements[0];
                (0, chai_config_spec_1.expect)(stmt.body.statements[0].text).to.equal(`'comment 1`);
                (0, chai_config_spec_1.expect)(stmt.body.statements[1].text).to.equal(`'comment 2`);
                (0, chai_config_spec_1.expect)(stmt.body.statements[3].text).to.equal(`'comment 3`);
                (0, chai_config_spec_1.expect)(statements[0].func.body.statements[1].text).to.equal(`'comment 4`);
            });
        });
    });
    describe('reservedWords', () => {
        describe('`then`', () => {
            it('is not allowed as a local identifier', () => {
                let { diagnostics } = parse(`
                    sub main()
                        then = true
                    end sub
                `);
                (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(1);
            });
            it('is allowed as an AA property name', () => {
                var _a;
                let { diagnostics } = parse(`
                    sub main()
                        person = {
                            then: true
                        }
                        person.then = false
                        print person.then
                    end sub
                `);
                (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).not.to.exist;
            });
            it('allows `mod` as an AA literal property', () => {
                const parser = parse(`
                    sub main()
                        person = {
                            mod: true
                        }
                        person.mod = false
                        print person.mod
                    end sub
                `);
                (0, testHelpers_spec_1.expectZeroDiagnostics)(parser);
            });
            it('converts aa literal property TokenKind to Identifier', () => {
                const parser = parse(`
                    sub main()
                        person = {
                            mod: true
                            and: true
                        }
                    end sub
                `);
                (0, testHelpers_spec_1.expectZeroDiagnostics)(parser);
                const elements = [];
                parser.ast.walk((0, visitors_1.createVisitor)({
                    AAMemberExpression: (node) => {
                        elements.push(node);
                    }
                }), {
                    walkMode: visitors_1.WalkMode.visitAllRecursive
                });
                (0, chai_config_spec_1.expect)(elements.map(x => x.keyToken.kind)).to.eql([TokenKind_1.TokenKind.Identifier, TokenKind_1.TokenKind.Identifier]);
            });
        });
        it('"end" is not allowed as a local identifier', () => {
            let { diagnostics } = parse(`
                sub main()
                    end = true
                end sub
            `);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.length.greaterThan(0);
        });
        it('none of them can be used as local variables', () => {
            let reservedWords = new Set(TokenKind_1.ReservedWords);
            //remove the rem keyword because it's a comment...won't cause error
            reservedWords.delete('rem');
            for (let reservedWord of reservedWords) {
                let { tokens } = Lexer_1.Lexer.scan(`
                    sub main()
                        ${reservedWord} = true
                    end sub
                `);
                let { diagnostics } = Parser_1.Parser.parse(tokens);
                (0, chai_config_spec_1.expect)(diagnostics, `assigning to reserved word "${reservedWord}" should have been an error`).to.be.length.greaterThan(0);
            }
        });
    });
    describe('import keyword', () => {
        it('parses without errors', () => {
            var _a;
            let { statements, diagnostics } = parse(`
                import "somePath"
            `, Parser_1.ParseMode.BrighterScript);
            (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).not.to.exist;
            (0, chai_config_spec_1.expect)(statements[0]).to.be.instanceof(Statement_1.ImportStatement);
        });
        it('catches import statements used in brightscript files', () => {
            var _a;
            let { statements, diagnostics } = parse(`
                import "somePath"
            `, Parser_1.ParseMode.BrightScript);
            (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).to.eql(DiagnosticMessages_1.DiagnosticMessages.bsFeatureNotSupportedInBrsFiles('import statements').message);
            (0, chai_config_spec_1.expect)(statements[0]).to.be.instanceof(Statement_1.ImportStatement);
        });
        it('catchs missing file path', () => {
            var _a;
            let { statements, diagnostics } = parse(`
                import
            `, Parser_1.ParseMode.BrighterScript);
            (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).to.equal(DiagnosticMessages_1.DiagnosticMessages.expectedStringLiteralAfterKeyword('import').message);
            (0, chai_config_spec_1.expect)(statements[0]).to.be.instanceof(Statement_1.ImportStatement);
        });
    });
    describe('Annotations', () => {
        it('parses with error if malformed', () => {
            var _a;
            let { diagnostics } = parse(`
                @
                sub main()
                end sub
            `, Parser_1.ParseMode.BrighterScript);
            (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).to.equal(DiagnosticMessages_1.DiagnosticMessages.unexpectedToken('@').message);
        });
        it('properly handles empty annotation above class method', () => {
            var _a;
            //this code used to cause an infinite loop, so the fact that the test passes/fails on its own is a success!
            let { diagnostics } = parse(`
                class Person
                    @
                    sub new()
                    end sub
                end class
            `, Parser_1.ParseMode.BrighterScript);
            (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).to.equal(DiagnosticMessages_1.DiagnosticMessages.expectedIdentifier().message);
        });
        it('parses with error if annotation is not followed by a statement', () => {
            var _a, _b, _c, _d;
            let { diagnostics } = parse(`
                sub main()
                    @meta2
                end sub
                class MyClass
                    @meta3
                    @meta4
                end class
                @meta1
            `, Parser_1.ParseMode.BrighterScript);
            (0, chai_config_spec_1.expect)(diagnostics.length).to.equal(4);
            (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).to.equal(DiagnosticMessages_1.DiagnosticMessages.unusedAnnotation().message);
            (0, chai_config_spec_1.expect)((_b = diagnostics[1]) === null || _b === void 0 ? void 0 : _b.message).to.equal(DiagnosticMessages_1.DiagnosticMessages.unusedAnnotation().message);
            (0, chai_config_spec_1.expect)((_c = diagnostics[2]) === null || _c === void 0 ? void 0 : _c.message).to.equal(DiagnosticMessages_1.DiagnosticMessages.unusedAnnotation().message);
            (0, chai_config_spec_1.expect)((_d = diagnostics[3]) === null || _d === void 0 ? void 0 : _d.message).to.equal(DiagnosticMessages_1.DiagnosticMessages.unusedAnnotation().message);
        });
        it('attaches an annotation to next statement', () => {
            var _a;
            let { statements, diagnostics } = parse(`
                @meta1
                function main()
                end function

                @meta2 sub init()
                end sub
            `, Parser_1.ParseMode.BrighterScript);
            (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).not.to.exist;
            (0, chai_config_spec_1.expect)(statements[0]).to.be.instanceof(Statement_1.FunctionStatement);
            let fn = statements[0];
            (0, chai_config_spec_1.expect)(fn.annotations).to.exist;
            (0, chai_config_spec_1.expect)(fn.annotations[0]).to.be.instanceof(Expression_1.AnnotationExpression);
            (0, chai_config_spec_1.expect)(fn.annotations[0].nameToken.text).to.equal('meta1');
            (0, chai_config_spec_1.expect)(fn.annotations[0].name).to.equal('meta1');
            (0, chai_config_spec_1.expect)(statements[1]).to.be.instanceof(Statement_1.FunctionStatement);
            fn = statements[1];
            (0, chai_config_spec_1.expect)(fn.annotations).to.exist;
            (0, chai_config_spec_1.expect)(fn.annotations[0]).to.be.instanceof(Expression_1.AnnotationExpression);
            (0, chai_config_spec_1.expect)(fn.annotations[0].nameToken.text).to.equal('meta2');
        });
        it('attaches annotations inside a function body', () => {
            var _a, _b;
            let { statements, diagnostics } = parse(`
                function main()
                    @meta1
                    print "hello"
                end function
            `, Parser_1.ParseMode.BrighterScript);
            (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).not.to.exist;
            let fn = statements[0];
            let fnStatements = fn.func.body.statements;
            let stat = fnStatements[0];
            (0, chai_config_spec_1.expect)(stat).to.exist;
            (0, chai_config_spec_1.expect)((_b = stat.annotations) === null || _b === void 0 ? void 0 : _b.length).to.equal(1);
            (0, chai_config_spec_1.expect)(stat.annotations[0]).to.be.instanceof(Expression_1.AnnotationExpression);
        });
        it('attaches multiple annotations to next statement', () => {
            var _a;
            let { statements, diagnostics } = parse(`
                @meta1
                @meta2 @meta3
                function main()
                end function
            `, Parser_1.ParseMode.BrighterScript);
            (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).not.to.exist;
            (0, chai_config_spec_1.expect)(statements[0]).to.be.instanceof(Statement_1.FunctionStatement);
            let fn = statements[0];
            (0, chai_config_spec_1.expect)(fn.annotations).to.exist;
            (0, chai_config_spec_1.expect)(fn.annotations.length).to.equal(3);
            (0, chai_config_spec_1.expect)(fn.annotations[0]).to.be.instanceof(Expression_1.AnnotationExpression);
            (0, chai_config_spec_1.expect)(fn.annotations[1]).to.be.instanceof(Expression_1.AnnotationExpression);
            (0, chai_config_spec_1.expect)(fn.annotations[2]).to.be.instanceof(Expression_1.AnnotationExpression);
        });
        it('allows annotations with parameters', () => {
            var _a;
            let { statements, diagnostics } = parse(`
                @meta1("arg", 2, true, { prop: "value" })
                function main()
                end function
            `, Parser_1.ParseMode.BrighterScript);
            (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).not.to.exist;
            let fn = statements[0];
            (0, chai_config_spec_1.expect)(fn.annotations).to.exist;
            (0, chai_config_spec_1.expect)(fn.annotations[0]).to.be.instanceof(Expression_1.AnnotationExpression);
            (0, chai_config_spec_1.expect)(fn.annotations[0].nameToken.text).to.equal('meta1');
            (0, chai_config_spec_1.expect)(fn.annotations[0].call).to.be.instanceof(Expression_1.CallExpression);
        });
        it('attaches annotations to a class', () => {
            var _a, _b;
            let { statements, diagnostics } = parse(`
                @meta1
                class MyClass
                    function main()
                        print "hello"
                    end function
                end class
            `, Parser_1.ParseMode.BrighterScript);
            (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).not.to.exist;
            let cs = statements[0];
            (0, chai_config_spec_1.expect)((_b = cs.annotations) === null || _b === void 0 ? void 0 : _b.length).to.equal(1);
            (0, chai_config_spec_1.expect)(cs.annotations[0]).to.be.instanceof(Expression_1.AnnotationExpression);
        });
        it('attaches annotations to multiple clases', () => {
            var _a, _b, _c;
            let { statements, diagnostics } = parse(`
                @meta1
                class MyClass
                    function main()
                        print "hello"
                    end function
                end class
                @meta2
                class MyClass2
                    function main()
                        print "hello"
                    end function
                end class
            `, Parser_1.ParseMode.BrighterScript);
            (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).not.to.exist;
            let cs = statements[0];
            (0, chai_config_spec_1.expect)((_b = cs.annotations) === null || _b === void 0 ? void 0 : _b.length).to.equal(1);
            (0, chai_config_spec_1.expect)(cs.annotations[0]).to.be.instanceof(Expression_1.AnnotationExpression);
            (0, chai_config_spec_1.expect)(cs.annotations[0].name).to.equal('meta1');
            let cs2 = statements[1];
            (0, chai_config_spec_1.expect)((_c = cs2.annotations) === null || _c === void 0 ? void 0 : _c.length).to.equal(1);
            (0, chai_config_spec_1.expect)(cs2.annotations[0]).to.be.instanceof(Expression_1.AnnotationExpression);
            (0, chai_config_spec_1.expect)(cs2.annotations[0].name).to.equal('meta2');
        });
        it('attaches annotations to a namespaced class', () => {
            var _a, _b;
            let { statements, diagnostics } = parse(`
                namespace ns
                    @meta1
                    class MyClass
                        function main()
                            print "hello"
                        end function
                    end class
                end namespace
            `, Parser_1.ParseMode.BrighterScript);
            (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).not.to.exist;
            let ns = statements[0];
            let cs = ns.body.statements[0];
            (0, chai_config_spec_1.expect)((_b = cs.annotations) === null || _b === void 0 ? void 0 : _b.length).to.equal(1);
            (0, chai_config_spec_1.expect)(cs.annotations[0]).to.be.instanceof(Expression_1.AnnotationExpression);
        });
        it('attaches annotations to a namespaced class - multiple', () => {
            var _a, _b, _c;
            let { statements, diagnostics } = parse(`
                namespace ns
                    @meta1
                    class MyClass
                        function main()
                            print "hello"
                        end function
                    end class
                    @meta2
                    class MyClass2
                        function main()
                            print "hello"
                        end function
                    end class
                end namespace
            `, Parser_1.ParseMode.BrighterScript);
            (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).not.to.exist;
            let ns = statements[0];
            let cs = ns.body.statements[0];
            (0, chai_config_spec_1.expect)((_b = cs.annotations) === null || _b === void 0 ? void 0 : _b.length).to.equal(1);
            (0, chai_config_spec_1.expect)(cs.annotations[0]).to.be.instanceof(Expression_1.AnnotationExpression);
            (0, chai_config_spec_1.expect)(cs.annotations[0].name).to.equal('meta1');
            let cs2 = ns.body.statements[1];
            (0, chai_config_spec_1.expect)((_c = cs2.annotations) === null || _c === void 0 ? void 0 : _c.length).to.equal(1);
            (0, chai_config_spec_1.expect)(cs2.annotations[0]).to.be.instanceof(Expression_1.AnnotationExpression);
            (0, chai_config_spec_1.expect)(cs2.annotations[0].name).to.equal('meta2');
        });
        it('attaches annotations to a class constructor', () => {
            var _a, _b;
            let { statements, diagnostics } = parse(`
                class MyClass
                    @meta1
                    function new()
                        print "hello"
                    end function
                    function methodA()
                        print "hello"
                    end function
                end class
            `, Parser_1.ParseMode.BrighterScript);
            (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).not.to.exist;
            let cs = statements[0];
            let stat = cs.body[0];
            (0, chai_config_spec_1.expect)((_b = stat.annotations) === null || _b === void 0 ? void 0 : _b.length).to.equal(1);
            (0, chai_config_spec_1.expect)(stat.annotations[0]).to.be.instanceof(Expression_1.AnnotationExpression);
        });
        it('attaches annotations to a class methods', () => {
            var _a, _b;
            let { statements, diagnostics } = parse(`
                class MyClass
                    function new()
                        print "hello"
                    end function
                    @meta1
                    function methodA()
                        print "hello"
                    end function
                end class
            `, Parser_1.ParseMode.BrighterScript);
            (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).not.to.exist;
            let cs = statements[0];
            let stat = cs.body[1];
            (0, chai_config_spec_1.expect)((_b = stat.annotations) === null || _b === void 0 ? void 0 : _b.length).to.equal(1);
            (0, chai_config_spec_1.expect)(stat.annotations[0]).to.be.instanceof(Expression_1.AnnotationExpression);
        });
        it('attaches annotations to a class methods, fields and constructor', () => {
            var _a, _b, _c, _d, _e;
            let { statements, diagnostics } = parse(`
                @meta2
                @meta1
                class MyClass
                    @meta3
                    @meta4
                    function new()
                        print "hello"
                    end function
                    @meta5
                    @meta6
                    function methodA()
                        print "hello"
                    end function

                    @meta5
                    @meta6
                    public foo="bar"
                end class
            `, Parser_1.ParseMode.BrighterScript);
            (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).not.to.exist;
            let cs = statements[0];
            (0, chai_config_spec_1.expect)((_b = cs.annotations) === null || _b === void 0 ? void 0 : _b.length).to.equal(2);
            (0, chai_config_spec_1.expect)(cs.annotations[0]).to.be.instanceof(Expression_1.AnnotationExpression);
            let stat1 = cs.body[0];
            let stat2 = cs.body[1];
            let f1 = cs.body[2];
            (0, chai_config_spec_1.expect)((_c = stat1.annotations) === null || _c === void 0 ? void 0 : _c.length).to.equal(2);
            (0, chai_config_spec_1.expect)(stat1.annotations[0]).to.be.instanceof(Expression_1.AnnotationExpression);
            (0, chai_config_spec_1.expect)((_d = stat2.annotations) === null || _d === void 0 ? void 0 : _d.length).to.equal(2);
            (0, chai_config_spec_1.expect)(stat2.annotations[0]).to.be.instanceof(Expression_1.AnnotationExpression);
            (0, chai_config_spec_1.expect)((_e = f1.annotations) === null || _e === void 0 ? void 0 : _e.length).to.equal(2);
            (0, chai_config_spec_1.expect)(f1.annotations[0]).to.be.instanceof(Expression_1.AnnotationExpression);
        });
        it('ignores annotations on commented out lines', () => {
            var _a;
            let { statements, diagnostics } = parse(`
                '@meta1
                '   @meta1
                function new()
                    print "hello"
                end function
            `, Parser_1.ParseMode.BrighterScript);
            (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).not.to.exist;
            let cs = statements[0];
            (0, chai_config_spec_1.expect)(cs.annotations).to.be.undefined;
        });
        it('can convert argument of an annotation to JS types', () => {
            var _a;
            let { statements, diagnostics } = parse(`
                @meta1
                function main()
                end function

                @meta2(
                    "arg", 2, true,
                    { prop: "value" }, [1, 2],
                    sub()
                    end sub
                )
                sub init()
                end sub
            `, Parser_1.ParseMode.BrighterScript);
            (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).not.to.exist;
            (0, chai_config_spec_1.expect)(statements[0]).to.be.instanceof(Statement_1.FunctionStatement);
            let fn = statements[0];
            (0, chai_config_spec_1.expect)(fn.annotations).to.exist;
            (0, chai_config_spec_1.expect)(fn.annotations[0].getArguments()).to.deep.equal([]);
            (0, chai_config_spec_1.expect)(statements[1]).to.be.instanceof(Statement_1.FunctionStatement);
            fn = statements[1];
            (0, chai_config_spec_1.expect)(fn.annotations).to.exist;
            (0, chai_config_spec_1.expect)(fn.annotations[0]).to.be.instanceof(Expression_1.AnnotationExpression);
            (0, chai_config_spec_1.expect)(fn.annotations[0].getArguments()).to.deep.equal([
                'arg', 2, true,
                { prop: 'value' }, [1, 2],
                null
            ]);
            let allArgs = fn.annotations[0].getArguments(false);
            (0, chai_config_spec_1.expect)(allArgs.pop()).to.be.instanceOf(Expression_1.FunctionExpression);
        });
        it('can handle negative numbers', () => {
            var _a;
            let { statements, diagnostics } = parse(`
                @meta(-100)
                function main()
                end function

                sub init()
                end sub
            `, Parser_1.ParseMode.BrighterScript);
            (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).not.to.exist;
            (0, chai_config_spec_1.expect)(statements[0]).to.be.instanceof(Statement_1.FunctionStatement);
            let fn = statements[0];
            (0, chai_config_spec_1.expect)(fn.annotations).to.exist;
            (0, chai_config_spec_1.expect)(fn.annotations[0].getArguments()).to.deep.equal([-100]);
        });
    });
    describe('typecast statement', () => {
        it('allows typecast statement ', () => {
            let { ast, diagnostics } = parse(`
                typeCAST m AS roAssociativeArray
            `, Parser_1.ParseMode.BrighterScript);
            (0, testHelpers_spec_1.expectZeroDiagnostics)(diagnostics);
            (0, chai_config_spec_1.expect)((0, reflection_1.isTypecastStatement)(ast.statements[0])).to.be.true;
            const stmt = ast.statements[0];
            (0, chai_config_spec_1.expect)(stmt.tokens.typecast.text).to.eq('typeCAST');
            (0, chai_config_spec_1.expect)(stmt.tokens.typecast).to.exist;
        });
        it('is disallowed in brightscript mode', () => {
            let { diagnostics } = parse(`
                typecast m AS roAssociativeArray
            `, Parser_1.ParseMode.BrightScript);
            (0, testHelpers_spec_1.expectDiagnostics)(diagnostics, [
                DiagnosticMessages_1.DiagnosticMessages.bsFeatureNotSupportedInBrsFiles('typecast statements')
            ]);
        });
        it('allows `typecast` for function name', () => {
            let { ast, diagnostics } = parse(`
                function typecast() as integer
                    return 1
                end function
            `, Parser_1.ParseMode.BrighterScript);
            (0, testHelpers_spec_1.expectZeroDiagnostics)(diagnostics);
            (0, chai_config_spec_1.expect)(ast.statements[0].name.text).to.eq('typecast');
        });
        it('allows `typecast` for variable name', () => {
            let { ast, diagnostics } = parse(`
                function foo() as integer
                    typecast = 1
                    return typecast
                end function
            `, Parser_1.ParseMode.BrighterScript);
            (0, testHelpers_spec_1.expectZeroDiagnostics)(diagnostics);
            (0, chai_config_spec_1.expect)(ast.statements[0].func.body.statements[0].name.text).to.eq('typecast');
        });
        it('is allowed in function', () => {
            let { diagnostics } = parse(`
                function foo() as integer
                    typecast m as MyObject
                    return m.getNum()
                end function
            `, Parser_1.ParseMode.BrighterScript);
            (0, testHelpers_spec_1.expectZeroDiagnostics)(diagnostics);
        });
        it('is allowed in function literal', () => {
            let { diagnostics } = parse(`
                interface PiGetter
                    pi as float
                    function getPi() as float
                end interface

                function makePiGetter() as object
                    x = {
                        pi: 3.14,
                        getPi: function() as float
                            typecast m as PiGetter
                            return m.pi
                        end function
                    }
                    return x
                end function
            `, Parser_1.ParseMode.BrighterScript);
            (0, testHelpers_spec_1.expectZeroDiagnostics)(diagnostics);
        });
    });
    describe('alias statement', () => {
        it('allows alias statement ', () => {
            let { ast, diagnostics } = parse(`
                ALIAS x = lcase
            `, Parser_1.ParseMode.BrighterScript);
            (0, testHelpers_spec_1.expectZeroDiagnostics)(diagnostics);
            (0, chai_config_spec_1.expect)((0, reflection_1.isAliasStatement)(ast.statements[0])).to.be.true;
            const stmt = ast.statements[0];
            (0, chai_config_spec_1.expect)(stmt.tokens.alias.text).to.eq('ALIAS');
            (0, chai_config_spec_1.expect)(stmt.tokens.value).to.exist;
        });
        it('is disallowed in brightscript mode', () => {
            let { diagnostics } = parse(`
                alias x = lcase
            `, Parser_1.ParseMode.BrightScript);
            (0, testHelpers_spec_1.expectDiagnostics)(diagnostics, [
                DiagnosticMessages_1.DiagnosticMessages.bsFeatureNotSupportedInBrsFiles('alias statements')
            ]);
        });
        it('allows `alias` for function name', () => {
            let { ast, diagnostics } = parse(`
                function alias() as integer
                    return 1
                end function
            `, Parser_1.ParseMode.BrighterScript);
            (0, testHelpers_spec_1.expectZeroDiagnostics)(diagnostics);
            (0, chai_config_spec_1.expect)(ast.statements[0].name.text).to.eq('alias');
        });
        it('allows `alias` for variable name', () => {
            let { ast, diagnostics } = parse(`
                function foo() as integer
                    alias = 1
                    return alias
                end function
            `, Parser_1.ParseMode.BrighterScript);
            (0, testHelpers_spec_1.expectZeroDiagnostics)(diagnostics);
            (0, chai_config_spec_1.expect)(ast.statements[0].func.body.statements[0].name.text).to.eq('alias');
        });
    });
});
function parse(text, mode) {
    let { tokens } = Lexer_1.Lexer.scan(text);
    return Parser_1.Parser.parse(tokens, {
        mode: mode
    });
}
function rangeToArray(range) {
    return [
        range.start.line,
        range.start.character,
        range.end.line,
        range.end.character
    ];
}
exports.rangeToArray = rangeToArray;
function expectCommentWithText(stat, text) {
    if ((0, reflection_1.isCommentStatement)(stat)) {
        (0, chai_config_spec_1.expect)(stat.text).to.equal(text);
    }
    else {
        failStatementType(stat, 'Comment');
    }
}
function failStatementType(stat, type) {
    chai_config_spec_1.assert.fail(`Statement ${stat.constructor.name} line ${stat.range.start.line} is not a ${type}`);
}
exports.failStatementType = failStatementType;
//# sourceMappingURL=Parser.spec.js.map
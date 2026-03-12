"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../chai-config.spec");
const DiagnosticMessages_1 = require("../DiagnosticMessages");
const TokenKind_1 = require("../lexer/TokenKind");
const Lexer_1 = require("../lexer/Lexer");
const Parser_1 = require("./Parser");
const Statement_1 = require("./Statement");
const Expression_1 = require("./Expression");
const testHelpers_spec_1 = require("../testHelpers.spec");
const reflection_1 = require("../astUtils/reflection");
const util_1 = require("../util");
describe('parser class', () => {
    it('throws exception when used in brightscript scope', () => {
        var _a;
        let { tokens } = Lexer_1.Lexer.scan(`
                class Person
                end class
            `);
        let { diagnostics } = Parser_1.Parser.parse(tokens, { mode: Parser_1.ParseMode.BrightScript });
        (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.code).to.equal(DiagnosticMessages_1.DiagnosticMessages.bsFeatureNotSupportedInBrsFiles('').code);
    });
    for (let keyword of TokenKind_1.AllowedProperties) {
        //skip a few of the class-specific keywords that are not allowed as field/method names
        if ([
            TokenKind_1.TokenKind.Function,
            TokenKind_1.TokenKind.Rem,
            TokenKind_1.TokenKind.Sub,
            TokenKind_1.TokenKind.Public,
            TokenKind_1.TokenKind.Protected,
            TokenKind_1.TokenKind.Private,
            TokenKind_1.TokenKind.Override
        ].includes(keyword)) {
            continue;
        }
        it(`supports ${keyword} as property name`, () => {
            //test as property
            let { tokens } = Lexer_1.Lexer.scan(`
                class Person
                    ${keyword} as string
                end class
            `);
            let { statements, diagnostics } = Parser_1.Parser.parse(tokens, { mode: Parser_1.ParseMode.BrighterScript });
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements[0]).instanceof(Statement_1.ClassStatement);
        });
        it(`supports ${keyword} as method name`, () => {
            var _a;
            //test as property
            let { tokens } = Lexer_1.Lexer.scan(`
                class Person
                   sub ${keyword}()
                   end sub
                end class
            `);
            let { statements, diagnostics } = Parser_1.Parser.parse(tokens, { mode: Parser_1.ParseMode.BrighterScript });
            (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).not.to.exist;
            (0, chai_config_spec_1.expect)(statements[0]).instanceof(Statement_1.ClassStatement);
        });
    }
    for (let keyword of TokenKind_1.AllowedLocalIdentifiers) {
        it(`supports ${keyword} as class name`, () => {
            //test as property
            let { tokens } = Lexer_1.Lexer.scan(`
                class ${keyword}
                end class
            `);
            let { statements, diagnostics } = Parser_1.Parser.parse(tokens, { mode: Parser_1.ParseMode.BrighterScript });
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements[0]).instanceof(Statement_1.ClassStatement);
        });
    }
    it('does not allow "throw" to be defined as a local var', () => {
        var _a;
        const parser = Parser_1.Parser.parse(`
            sub main()
                'not allowed to define "throw" as local var
                throw = true
            end sub
        `);
        (0, chai_config_spec_1.expect)((_a = parser.diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).to.eql(DiagnosticMessages_1.DiagnosticMessages.unexpectedToken('=').message);
    });
    it('does not allow function named "throw"', () => {
        var _a;
        const parser = Parser_1.Parser.parse(`
            'not allowed to define a function called "throw"
            sub throw()
            end sub
        `);
        (0, chai_config_spec_1.expect)((_a = parser.diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).to.eql(DiagnosticMessages_1.DiagnosticMessages.cannotUseReservedWordAsIdentifier('throw').message);
    });
    it('does not allow function param named "type"', () => {
        const parser = Parser_1.Parser.parse(`
            sub test(type as string)
            end sub
        `);
        (0, testHelpers_spec_1.expectDiagnostics)(parser, [Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.cannotUseReservedWordAsIdentifier('type')), { range: util_1.default.createRange(1, 21, 1, 25) })]);
    });
    it('does not allow class method named "type"', () => {
        const parser = Parser_1.Parser.parse(`
            class Person
                sub test(type as string)
                end sub
            end class
        `, { mode: Parser_1.ParseMode.BrighterScript });
        (0, testHelpers_spec_1.expectDiagnostics)(parser, [Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.cannotUseReservedWordAsIdentifier('type')), { range: util_1.default.createRange(2, 25, 2, 29) })]);
    });
    it('does not allow interface method named "type"', () => {
        const parser = Parser_1.Parser.parse(`
            interface Person
                sub test(type as string)
            end interface
        `, { mode: Parser_1.ParseMode.BrighterScript });
        (0, testHelpers_spec_1.expectDiagnostics)(parser, [Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.cannotUseReservedWordAsIdentifier('type')), { range: util_1.default.createRange(2, 25, 2, 29) })]);
    });
    it('supports the try/catch keywords in various places', () => {
        var _a;
        const parser = Parser_1.Parser.parse(`
            sub main()
                'allowed to be local vars
                try = true
                catch = true
                endTry = true
                'not allowed to use throw as local variable
                'throw = true

                'allowed to be object props
                person = {
                try: true,
                catch: true,
                endTry: true,
                throw: true
                }

                person.try = true
                person.catch = true
                person.endTry = true
                person.throw = true

                'allowed as object property reference
                print person.try
                print person.catch
                print person.endTry
                print person.throw
            end sub

            sub try()
            end sub

            sub catch()
            end sub

            sub endTry()
            end sub

            'not allowed to define a function called "throw"
            ' sub throw()
            ' end sub
        `);
        (0, chai_config_spec_1.expect)((_a = parser.diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).not.to.exist;
    });
    it('parses empty class', () => {
        let { tokens } = Lexer_1.Lexer.scan(`
                class Person
                end class
            `);
        let { statements, diagnostics } = Parser_1.Parser.parse(tokens, { mode: Parser_1.ParseMode.BrighterScript });
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements[0]).instanceof(Statement_1.ClassStatement);
    });
    it('bad property does not invalidate next sibling method', () => {
        let { tokens } = Lexer_1.Lexer.scan(`
                class Person
                    public firstname =
                    public sub new()
                    end sub
                end class
            `);
        let { statements } = Parser_1.Parser.parse(tokens, { mode: Parser_1.ParseMode.BrighterScript });
        let classStatement = statements[0];
        (0, chai_config_spec_1.expect)(classStatement.methods[0]).to.exist;
        (0, chai_config_spec_1.expect)(classStatement.methods[0].name.text).to.equal('new');
    });
    it('catches class without name', () => {
        let { tokens } = Lexer_1.Lexer.scan(`
                class
                end class
            `);
        let { statements, diagnostics } = Parser_1.Parser.parse(tokens, { mode: Parser_1.ParseMode.BrighterScript });
        (0, chai_config_spec_1.expect)(diagnostics).length.to.be.greaterThan(0);
        (0, chai_config_spec_1.expect)(diagnostics[0].code).to.equal(DiagnosticMessages_1.DiagnosticMessages.expectedIdentifierAfterKeyword('class').code);
        (0, chai_config_spec_1.expect)(statements[0]).instanceof(Statement_1.ClassStatement);
    });
    it('catches malformed class', () => {
        let { tokens } = Lexer_1.Lexer.scan(`
                class Person
            `);
        let { statements, diagnostics } = Parser_1.Parser.parse(tokens, { mode: Parser_1.ParseMode.BrighterScript });
        (0, chai_config_spec_1.expect)(diagnostics).length.to.be.greaterThan(0);
        (0, chai_config_spec_1.expect)(statements[0]).instanceof(Statement_1.ClassStatement);
    });
    describe('fields', () => {
        it('identifies perfect syntax', () => {
            let { tokens } = Lexer_1.Lexer.scan(`
                    class Person
                        public firstName as string
                    end class
                `);
            let { statements, diagnostics } = Parser_1.Parser.parse(tokens, { mode: Parser_1.ParseMode.BrighterScript });
            (0, chai_config_spec_1.expect)(diagnostics).to.be.empty;
            (0, chai_config_spec_1.expect)(statements[0]).instanceof(Statement_1.ClassStatement);
            let field = statements[0].body[0];
            (0, chai_config_spec_1.expect)(field.accessModifier.kind).to.equal(TokenKind_1.TokenKind.Public);
            (0, chai_config_spec_1.expect)(field.name.text).to.equal('firstName');
            (0, chai_config_spec_1.expect)(field.as.text).to.equal('as');
            (0, chai_config_spec_1.expect)(field.type.text).to.equal('string');
        });
        it('can be solely an identifier', () => {
            let { tokens } = Lexer_1.Lexer.scan(`
                    class Person
                        firstName
                    end class
                `);
            let { statements, diagnostics } = Parser_1.Parser.parse(tokens, { mode: Parser_1.ParseMode.BrighterScript });
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            let cls = statements[0];
            (0, chai_config_spec_1.expect)(cls.fields[0].name.text).to.equal('firstName');
        });
        it('malformed field does not impact leading and trailing fields', () => {
            let { tokens } = Lexer_1.Lexer.scan(`
                    class Person
                        firstName as string
                        middleName asdf asdf asdf
                        lastName as string
                    end class
                `);
            let { statements } = Parser_1.Parser.parse(tokens, { mode: Parser_1.ParseMode.BrighterScript });
            let cls = statements[0];
            (0, chai_config_spec_1.expect)(cls.fields[0].name.text).to.equal('firstName');
            (0, chai_config_spec_1.expect)(cls.fields[cls.fields.length - 1].name.text).to.equal('lastName');
        });
        it(`detects missing type after 'as' keyword`, () => {
            let { tokens } = Lexer_1.Lexer.scan(`
                    class Person
                        middleName as
                    end class
                `);
            let { diagnostics, statements } = Parser_1.Parser.parse(tokens, { mode: Parser_1.ParseMode.BrighterScript });
            (0, chai_config_spec_1.expect)(diagnostics.length).to.be.greaterThan(0);
            let cls = statements[0];
            (0, chai_config_spec_1.expect)(cls.fields[0].name.text).to.equal('middleName');
            (0, chai_config_spec_1.expect)(diagnostics[0].code).to.equal(DiagnosticMessages_1.DiagnosticMessages.expectedIdentifierAfterKeyword('as').code);
        });
        it('field access modifier defaults to undefined when omitted', () => {
            let { tokens } = Lexer_1.Lexer.scan(`
                    class Person
                        firstName as string
                    end class
                `);
            let { statements, diagnostics } = Parser_1.Parser.parse(tokens, { mode: Parser_1.ParseMode.BrighterScript });
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            let cls = statements[0];
            (0, chai_config_spec_1.expect)(cls.fields[0].accessModifier).to.be.undefined;
        });
    });
    describe('methods', () => {
        it('recognizes perfect syntax', () => {
            let { tokens } = Lexer_1.Lexer.scan(`
                    class Person
                        public function getName() as string
                            return "name"
                        end function
                    end class
                `);
            let { statements, diagnostics } = Parser_1.Parser.parse(tokens, { mode: Parser_1.ParseMode.BrighterScript });
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            let theClass = statements[0];
            (0, chai_config_spec_1.expect)(theClass).to.be.instanceof(Statement_1.ClassStatement);
            let method = theClass.methods[0];
            (0, chai_config_spec_1.expect)(method.name.text).to.equal('getName');
            (0, chai_config_spec_1.expect)(method.accessModifier.text).to.equal('public');
            (0, chai_config_spec_1.expect)(method.func).to.exist;
        });
        it('supports omitting method return type', () => {
            let { tokens } = Lexer_1.Lexer.scan(`
                    class Person
                        public function getName()
                            return "name"
                        end function
                    end class
                `);
            let { statements, diagnostics } = Parser_1.Parser.parse(tokens, { mode: Parser_1.ParseMode.BrighterScript });
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            let theClass = statements[0];
            let method = theClass.methods[0];
            (0, chai_config_spec_1.expect)(method.accessModifier.text).to.equal('public');
            (0, chai_config_spec_1.expect)(method.func).to.exist;
        });
        it('method access modifier is undefined when omitted', () => {
            let { tokens } = Lexer_1.Lexer.scan(`
                    class Person
                        function getName() as string
                            return "name"
                        end function
                    end class
                    `);
            let { statements, diagnostics } = Parser_1.Parser.parse(tokens, { mode: Parser_1.ParseMode.BrighterScript });
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            let cls = statements[0];
            (0, chai_config_spec_1.expect)(cls.methods[0].accessModifier).to.be.undefined;
        });
        it('supports primitive field initializers', () => {
            var _a;
            let { tokens } = Lexer_1.Lexer.scan(`
                class Person
                    name = "Bob"
                    age = 20
                    isAlive = true
                    callback = sub()
                        print "hello"
                    end sub
                end class
            `);
            let { statements, diagnostics } = Parser_1.Parser.parse(tokens, { mode: Parser_1.ParseMode.BrighterScript });
            (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).not.to.exist;
            let cls = statements[0];
            (0, chai_config_spec_1.expect)(cls.memberMap['name'].initialValue).to.exist;
            (0, chai_config_spec_1.expect)(cls.memberMap['age'].initialValue).to.exist;
            (0, chai_config_spec_1.expect)(cls.memberMap['isalive'].initialValue).to.exist;
            (0, chai_config_spec_1.expect)(cls.memberMap['callback'].initialValue).to.exist;
        });
        it('detects missing function keyword', () => {
            let { tokens } = Lexer_1.Lexer.scan(`
                    class Person
                        public getName() as string
                            return "name"
                        end function
                    end class
                    `);
            let { diagnostics } = Parser_1.Parser.parse(tokens, { mode: Parser_1.ParseMode.BrighterScript });
            (0, chai_config_spec_1.expect)(diagnostics).to.have.lengthOf(1);
            (0, chai_config_spec_1.expect)(diagnostics[0].code).to.equal(DiagnosticMessages_1.DiagnosticMessages.missingCallableKeyword().code);
        });
    });
    it('supports comments in various locations', () => {
        var _a;
        let { diagnostics } = Parser_1.Parser.parse(`
            'comment
            class Animal 'comment
                'comment
                sub new() 'comment
                    'comment
                end sub 'comment
                'comment
            end class 'comment
        `, { mode: Parser_1.ParseMode.BrighterScript });
        (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).to.not.exist;
    });
    it('recognizes the "extends" keyword', () => {
        var _a;
        let { tokens } = Lexer_1.Lexer.scan(`
            class Person
                public sub sayHi()
                    print "hi"
                end sub
            end class

            class Toddler extends Person
            end class
        `);
        let { statements, diagnostics } = Parser_1.Parser.parse(tokens, { mode: Parser_1.ParseMode.BrighterScript });
        (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).to.not.exist;
        let stmt = statements[1];
        (0, chai_config_spec_1.expect)(stmt.extendsKeyword.text).to.equal('extends');
        (0, chai_config_spec_1.expect)(stmt.parentClassName.getName(Parser_1.ParseMode.BrighterScript)).to.equal('Person');
    });
    it('catches missing identifier after "extends" keyword', () => {
        let { tokens } = Lexer_1.Lexer.scan(`
            class Person
                public sub sayHi()
                    print "hi"
                end sub
            end class

            class Toddler extends
            end class
        `);
        let { diagnostics } = Parser_1.Parser.parse(tokens, { mode: Parser_1.ParseMode.BrighterScript });
        (0, chai_config_spec_1.expect)(diagnostics[0].code).to.equal(DiagnosticMessages_1.DiagnosticMessages.expectedIdentifierAfterKeyword('extends').code);
    });
    describe('new keyword', () => {
        it('parses properly', () => {
            var _a;
            let { statements, diagnostics } = Parser_1.Parser.parse(`
                sub main()
                    a = new Animal()
                end sub
                class Animal
                end class
            `, { mode: Parser_1.ParseMode.BrighterScript });
            (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).to.not.exist;
            let body = statements[0].func.body;
            let stmt = body.statements[0];
            (0, chai_config_spec_1.expect)(stmt.value).to.be.instanceof(Expression_1.NewExpression);
        });
        it('is allowed to be used as a local variable in brs files', () => {
            var _a;
            let { diagnostics } = Parser_1.Parser.parse(`
                sub main()
                  new = true
                  old = new
                end sub
            `, { mode: Parser_1.ParseMode.BrightScript });
            (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).to.not.exist;
        });
    });
    describe('optional members', () => {
        it('allows optional fields', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse(`
                class HasOptional
                    optional name as string
                    optional height
                end class
            `, { mode: Parser_1.ParseMode.BrighterScript });
            (0, testHelpers_spec_1.expectZeroDiagnostics)(diagnostics);
            (0, chai_config_spec_1.expect)(statements.length).to.eq(1);
            (0, chai_config_spec_1.expect)((0, reflection_1.isClassStatement)(statements[0])).to.be.true;
            const klass = statements[0];
            klass.fields.forEach(f => (0, chai_config_spec_1.expect)(f.isOptional).to.be.true);
        });
        it('allows fields named optional', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse(`
                class IsJustOptional
                    optional
                    someThingElse
                end class
            `, { mode: Parser_1.ParseMode.BrighterScript });
            (0, testHelpers_spec_1.expectZeroDiagnostics)(diagnostics);
            (0, chai_config_spec_1.expect)(statements.length).to.eq(1);
            (0, chai_config_spec_1.expect)((0, reflection_1.isClassStatement)(statements[0])).to.be.true;
            const klass = statements[0];
            klass.fields.forEach(f => (0, chai_config_spec_1.expect)(f.isOptional).to.be.false);
        });
        it('allows typed fields named optional', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse(`
                class IsJustOptional
                    optional as string
                end class
            `, { mode: Parser_1.ParseMode.BrighterScript });
            (0, testHelpers_spec_1.expectZeroDiagnostics)(diagnostics);
            (0, chai_config_spec_1.expect)(statements.length).to.eq(1);
            (0, chai_config_spec_1.expect)((0, reflection_1.isClassStatement)(statements[0])).to.be.true;
            const klass = statements[0];
            klass.fields.forEach(f => (0, chai_config_spec_1.expect)(f.isOptional).to.be.false);
        });
        it('allows fields named optional that are also optional', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse(`
                class IsJustOptional
                    optional optional
                end class
            `, { mode: Parser_1.ParseMode.BrighterScript });
            (0, testHelpers_spec_1.expectZeroDiagnostics)(diagnostics);
            (0, chai_config_spec_1.expect)(statements.length).to.eq(1);
            (0, chai_config_spec_1.expect)((0, reflection_1.isClassStatement)(statements[0])).to.be.true;
            const klass = statements[0];
            klass.fields.forEach(f => (0, chai_config_spec_1.expect)(f.isOptional).to.be.true);
        });
        it('disallows optional methods', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse(`
                class HasOptional
                    optional function getValue() as boolean
                        return false
                    end function
                end class
            `, { mode: Parser_1.ParseMode.BrighterScript });
            (0, testHelpers_spec_1.expectDiagnosticsIncludes)(diagnostics, [
                DiagnosticMessages_1.DiagnosticMessages.expectedNewlineOrColon().message
            ]);
            (0, chai_config_spec_1.expect)(statements.length).to.eq(1);
        });
        it('allows fields named `as` that are also optional', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse(`
                class IsJustOptional
                    optional as
                end class
            `, { mode: Parser_1.ParseMode.BrighterScript });
            (0, testHelpers_spec_1.expectZeroDiagnostics)(diagnostics);
            (0, chai_config_spec_1.expect)(statements.length).to.eq(1);
            (0, chai_config_spec_1.expect)((0, reflection_1.isClassStatement)(statements[0])).to.be.true;
            const klass = statements[0];
            klass.fields.forEach(f => (0, chai_config_spec_1.expect)(f.isOptional).to.be.true);
        });
    });
});
//# sourceMappingURL=Parser.Class.spec.js.map
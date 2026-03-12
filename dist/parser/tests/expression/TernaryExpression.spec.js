"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-for-in-array */
const chai_config_spec_1 = require("../../../chai-config.spec");
const DiagnosticMessages_1 = require("../../../DiagnosticMessages");
const TokenKind_1 = require("../../../lexer/TokenKind");
const Parser_1 = require("../../Parser");
const Parser_spec_1 = require("../Parser.spec");
const Statement_1 = require("../../Statement");
const Expression_1 = require("../../Expression");
const Program_1 = require("../../../Program");
const testHelpers_spec_1 = require("../../../testHelpers.spec");
describe('ternary expressions', () => {
    it('throws exception when used in brightscript scope', () => {
        var _a;
        let { diagnostics } = Parser_1.Parser.parse(`a = true ? "human" : "Zombie"`, { mode: Parser_1.ParseMode.BrightScript });
        (0, chai_config_spec_1.expect)((_a = diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).to.equal(DiagnosticMessages_1.DiagnosticMessages.bsFeatureNotSupportedInBrsFiles('ternary operator').message);
    });
    it('cannot be used as a statement', () => {
        let { diagnostics } = Parser_1.Parser.parse([
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.True, 'true'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Question, '?'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.StringLiteral, 'Human'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Colon, ':'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.StringLiteral, 'Zombie'),
            Parser_spec_1.EOF
        ], { mode: Parser_1.ParseMode.BrighterScript });
        (0, chai_config_spec_1.expect)(diagnostics).not.to.be.empty;
    });
    it(`cannot be used as a statement`, () => {
        (0, chai_config_spec_1.expect)(parseBs(`true ? true : "zombie"`).diagnostics).not.to.be.empty;
        (0, chai_config_spec_1.expect)(parseBs(`false ? true : "zombie"`).diagnostics).not.to.be.empty;
        (0, chai_config_spec_1.expect)(parseBs(`len("person") = 10 ? true : "zombie"`).diagnostics).not.to.be.empty;
        (0, chai_config_spec_1.expect)(parseBs(`m.getResponse() ? true : "zombie"`).diagnostics).not.to.be.empty;
    });
    it(`supports boolean expression condition`, () => {
        let { statements, diagnostics } = parseBs(`being = isZombie = false ? "human" : "zombie"`);
        (0, chai_config_spec_1.expect)(statements[0]).to.be.instanceof(Statement_1.AssignmentStatement);
        (0, chai_config_spec_1.expect)(statements[0].value).to.be.instanceof(Expression_1.TernaryExpression);
        (0, testHelpers_spec_1.expectZeroDiagnostics)(diagnostics);
    });
    it(`supports function condition`, () => {
        let { statements, diagnostics } = parseBs(`a = user.getAccount() ? "logged in" : "not logged in"`);
        (0, chai_config_spec_1.expect)(statements[0]).to.be.instanceof(Statement_1.AssignmentStatement);
        (0, chai_config_spec_1.expect)(statements[0].value).to.be.instanceof(Expression_1.TernaryExpression);
        (0, testHelpers_spec_1.expectZeroDiagnostics)(diagnostics);
    });
    it(`supports various tests with primitive values:`, () => {
        (0, testHelpers_spec_1.expectZeroDiagnostics)(parseBs(`result = true ? "human" : "zombie"`));
        (0, testHelpers_spec_1.expectZeroDiagnostics)(parseBs(`result = false ? "human" : "zombie"`));
        (0, testHelpers_spec_1.expectZeroDiagnostics)(parseBs(`result = len("person") = 10 ? "human" : "zombie"`));
        (0, testHelpers_spec_1.expectZeroDiagnostics)(parseBs(`result = m.getResponse() ? "human" : "zombie"`));
        (0, testHelpers_spec_1.expectZeroDiagnostics)(parseBs(`result = m.myZombies[3].hasEaten = true ? "human" : "zombie"`));
    });
    it(`supports simple consequents`, () => {
        (0, testHelpers_spec_1.expectZeroDiagnostics)(parseBs(`result = true ? true : "zombie"`));
        (0, testHelpers_spec_1.expectZeroDiagnostics)(parseBs(`result = true ? false : "zombie"`));
        (0, testHelpers_spec_1.expectZeroDiagnostics)(parseBs(`result = true ? len("person") = 10 : "zombie"`));
        (0, testHelpers_spec_1.expectZeroDiagnostics)(parseBs(`result = true ? m.getResponse() : "zombie"`));
        (0, testHelpers_spec_1.expectZeroDiagnostics)(parseBs(`result = true ? m.myZombies[3].hasEaten = true : "zombie"`));
        (0, testHelpers_spec_1.expectZeroDiagnostics)(parseBs(`result = true ? getZombieName : "zombie"`));
    });
    it(`supports simple alternates`, () => {
        (0, testHelpers_spec_1.expectZeroDiagnostics)(parseBs(`result = true ? "zombie": true`));
        (0, testHelpers_spec_1.expectZeroDiagnostics)(parseBs(`result = true ? "zombie": false`));
        (0, testHelpers_spec_1.expectZeroDiagnostics)(parseBs(`result = true ? "zombie": len("person") = 10`));
        (0, testHelpers_spec_1.expectZeroDiagnostics)(parseBs(`result = true ? "zombie": m.getResponse()`));
        (0, testHelpers_spec_1.expectZeroDiagnostics)(parseBs(`result = true ? "zombie": m.myZombies[3].hasEaten = true`));
        (0, testHelpers_spec_1.expectZeroDiagnostics)(parseBs(`result = true ? "zombie": getZombieName`));
        (0, testHelpers_spec_1.expectZeroDiagnostics)(parseBs(`result = true ? "zombie": true`));
    });
    it('supports multi-line and comments', () => {
        (0, testHelpers_spec_1.expectZeroDiagnostics)(parseBs(`result = true ? \n"zombie"\n: \ntrue`));
        (0, testHelpers_spec_1.expectZeroDiagnostics)(parseBs(`result = true ? "zombie"\n: \ntrue`));
        (0, testHelpers_spec_1.expectZeroDiagnostics)(parseBs(`result = true ? \n"zombie": \ntrue`));
        (0, testHelpers_spec_1.expectZeroDiagnostics)(parseBs(`result = true ? \n"zombie"\n: true`));
        (0, testHelpers_spec_1.expectZeroDiagnostics)(parseBs(`result = true ? "zombie"\n: \ntrue`));
        (0, testHelpers_spec_1.expectZeroDiagnostics)(parseBs(`result = true ? "zombie": \ntrue`));
        (0, testHelpers_spec_1.expectZeroDiagnostics)(parseBs(`result = true ? \n\n\n"zombie": \n\n\n\ntrue`));
        //with comments
        (0, testHelpers_spec_1.expectZeroDiagnostics)(parseBs(`result = true ?'comment\n"zombie"'comment\n:'comment\nntrue`));
    });
    describe('in assignment', () => {
        it(`simple case`, () => {
            let { statements, diagnostics } = parseBs(`a = true ? "human" : "zombie"`);
            (0, testHelpers_spec_1.expectZeroDiagnostics)(diagnostics);
            (0, chai_config_spec_1.expect)(statements[0]).instanceof(Statement_1.AssignmentStatement);
        });
        it(`multi line arrays case`, () => {
            let { statements, diagnostics } = parseBs(`
                a = true ? [
                        "one"
                        "two"
                        "three"
                    ] : [
                        "one"
                        "two"
                        "three"
                    ]
            `);
            (0, testHelpers_spec_1.expectZeroDiagnostics)(diagnostics);
            (0, chai_config_spec_1.expect)(statements[0]).instanceof(Statement_1.AssignmentStatement);
        });
        it(`single line assoc array`, () => {
            let { statements, diagnostics } = parseBs(`a = true ? {"a":"a"} : {}`);
            (0, testHelpers_spec_1.expectZeroDiagnostics)(diagnostics);
            (0, chai_config_spec_1.expect)(statements[0]).instanceof(Statement_1.AssignmentStatement);
        });
        it(`multi line assoc array`, () => {
            let { statements, diagnostics } = parseBs(`
                a = true ? {"a":"a"} : {
                    "b": "test"
                }`);
            (0, testHelpers_spec_1.expectZeroDiagnostics)(diagnostics);
            (0, chai_config_spec_1.expect)(statements[0]).instanceof(Statement_1.AssignmentStatement);
        });
        it(`multi line assoc array - both sides`, () => {
            let { statements, diagnostics } = parseBs(`
                a = true ? {
                        "a":"a"
                        "b":"b"
                    } : {
                        "b": "test"
                    }
            `);
            (0, testHelpers_spec_1.expectZeroDiagnostics)(diagnostics);
            (0, chai_config_spec_1.expect)(statements[0]).instanceof(Statement_1.AssignmentStatement);
        });
        it(`in func call with array args`, () => {
            let { statements, diagnostics } = parseBs(`m.eatBrains(a.count() > 10 ? ["a","B"] : ["c", "d"])`);
            (0, testHelpers_spec_1.expectZeroDiagnostics)(diagnostics);
            (0, chai_config_spec_1.expect)(statements[0]).instanceof(Statement_1.ExpressionStatement);
            (0, chai_config_spec_1.expect)(statements[0].expression).instanceof(Expression_1.CallExpression);
            let callExpression = statements[0].expression;
            (0, chai_config_spec_1.expect)(callExpression.args.length).to.equal(1);
            (0, chai_config_spec_1.expect)(callExpression.args[0]).instanceof(Expression_1.TernaryExpression);
        });
        it(`in func call with aa args`, () => {
            let { statements, diagnostics } = parseBs(`m.eatBrains(a.count() > 10 ? {"a":1} : {"b": ["c", "d"]})`);
            (0, testHelpers_spec_1.expectZeroDiagnostics)(diagnostics);
            (0, chai_config_spec_1.expect)(statements[0]).instanceof(Statement_1.ExpressionStatement);
            (0, chai_config_spec_1.expect)(statements[0].expression).instanceof(Expression_1.CallExpression);
            let callExpression = statements[0].expression;
            (0, chai_config_spec_1.expect)(callExpression.args.length).to.equal(1);
            (0, chai_config_spec_1.expect)(callExpression.args[0]).instanceof(Expression_1.TernaryExpression);
        });
        it(`in simple func call`, () => {
            let { statements, diagnostics } = parseBs(`m.eatBrains(a = true ? "a" : "b")`);
            (0, testHelpers_spec_1.expectZeroDiagnostics)(diagnostics);
            (0, chai_config_spec_1.expect)(statements[0]).instanceof(Statement_1.ExpressionStatement);
            (0, chai_config_spec_1.expect)(statements[0].expression).instanceof(Expression_1.CallExpression);
            let callExpression = statements[0].expression;
            (0, chai_config_spec_1.expect)(callExpression.args.length).to.equal(1);
            (0, chai_config_spec_1.expect)(callExpression.args[0]).instanceof(Expression_1.TernaryExpression);
        });
        it(`in func call with more args`, () => {
            let { statements, diagnostics } = parseBs(`m.eatBrains(a = true ? "a" : "b", true, 12)`);
            (0, testHelpers_spec_1.expectZeroDiagnostics)(diagnostics);
            (0, chai_config_spec_1.expect)(statements[0]).instanceof(Statement_1.ExpressionStatement);
            (0, chai_config_spec_1.expect)(statements[0].expression).instanceof(Expression_1.CallExpression);
            let callExpression = statements[0].expression;
            (0, chai_config_spec_1.expect)(callExpression.args.length).to.equal(3);
            (0, chai_config_spec_1.expect)(callExpression.args[0]).instanceof(Expression_1.TernaryExpression);
        });
        it(`in func call with more args, and comparing value`, () => {
            let { statements, diagnostics } = parseBs(`m.eatBrains((a = true ? "a" : "b").count() = 3, true, 12)`);
            (0, testHelpers_spec_1.expectZeroDiagnostics)(diagnostics);
            (0, chai_config_spec_1.expect)(statements[0]).instanceof(Statement_1.ExpressionStatement);
            (0, chai_config_spec_1.expect)(statements[0].expression).instanceof(Expression_1.CallExpression);
            let callExpression = statements[0].expression;
            (0, chai_config_spec_1.expect)(callExpression.args.length).to.equal(3);
        });
        it(`in array`, () => {
            let { statements, diagnostics } = parseBs(`a = [a = true ? {"a":"a"} : {"b":"b"}, "c"]`);
            (0, testHelpers_spec_1.expectZeroDiagnostics)(diagnostics);
            (0, chai_config_spec_1.expect)(statements[0]).instanceof(Statement_1.AssignmentStatement);
            (0, chai_config_spec_1.expect)(statements[0].value).instanceof(Expression_1.ArrayLiteralExpression);
            let literalExpression = statements[0].value;
            (0, chai_config_spec_1.expect)(literalExpression.elements[0]).instanceOf(Expression_1.TernaryExpression);
            (0, chai_config_spec_1.expect)(literalExpression.elements[1]).instanceOf(Expression_1.LiteralExpression);
        });
        it(`in aa`, () => {
            let { statements, diagnostics } = parseBs(`a = {"v1": a = true ? {"a":"a"} : {"b":"b"}, "v2": "c"}`);
            (0, testHelpers_spec_1.expectZeroDiagnostics)(diagnostics);
            (0, chai_config_spec_1.expect)(statements[0]).instanceof(Statement_1.AssignmentStatement);
            (0, chai_config_spec_1.expect)(statements[0].value).instanceof(Expression_1.AALiteralExpression);
            let literalExpression = statements[0].value;
            (0, chai_config_spec_1.expect)(literalExpression.elements[0].keyToken.text).is.equal('"v1"');
            (0, chai_config_spec_1.expect)(literalExpression.elements[0].value).instanceOf(Expression_1.TernaryExpression);
            (0, chai_config_spec_1.expect)(literalExpression.elements[1].keyToken.text).is.equal('"v2"');
            (0, chai_config_spec_1.expect)(literalExpression.elements[1].value).instanceOf(Expression_1.LiteralExpression);
        });
        it(`in for each`, () => {
            let { statements, diagnostics } = parseBs(`for each person in isZombieMode ? zombies : humans
                    ? "person is " ; person
                end for
            `);
            (0, testHelpers_spec_1.expectZeroDiagnostics)(diagnostics);
            (0, chai_config_spec_1.expect)(statements[0]).instanceof(Statement_1.ForEachStatement);
            (0, chai_config_spec_1.expect)(statements[0].target).instanceof(Expression_1.TernaryExpression);
        });
        it('creates TernaryExpression with missing alternate', () => {
            const { statements } = parseBs(`
                print name = "bob" ? "human":
            `);
            const expr = statements[0].expressions[0];
            (0, chai_config_spec_1.expect)(expr).to.be.instanceof(Expression_1.TernaryExpression);
            (0, chai_config_spec_1.expect)(expr).property('alternate').to.be.undefined;
            (0, chai_config_spec_1.expect)(expr).property('consequent').not.to.be.undefined;
        });
        it('creates TernaryExpression with missing consequent', () => {
            const { statements } = parseBs(`
                print name = "bob" ? : "human"
            `);
            const expr = statements[0].expressions[0];
            (0, chai_config_spec_1.expect)(expr).to.be.instanceof(Expression_1.TernaryExpression);
            (0, chai_config_spec_1.expect)(expr).property('consequent').to.be.undefined;
            (0, chai_config_spec_1.expect)(expr).property('alternate').not.to.be.undefined;
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
        it('transpiles top-level ternary expression', () => {
            testTranspile(`
                a += true ? 1 : 2
            `, `
                if true then
                    a += 1
                else
                    a += 2
                end if
            `, undefined, undefined, false);
        });
        it('transpiles ternary in RHS of AssignmentStatement to IfStatement', () => {
            testTranspile(`
                sub main()
                    a = true ? 1 : 2
                end sub
            `, `
                sub main()
                    if true then
                        a = 1
                    else
                        a = 2
                    end if
                end sub
            `);
        });
        it('transpiles ternary in RHS of incrementor AssignmentStatement to IfStatement', () => {
            testTranspile(`
                sub main()
                    a += true ? 1 : 2
                end sub
            `, `
                sub main()
                    if true then
                        a += 1
                    else
                        a += 2
                    end if
                end sub
            `);
        });
        it('transpiles ternary in RHS of DottedSetStatement to IfStatement', () => {
            testTranspile(`
                sub main()
                    m.a = true ? 1 : 2
                end sub
            `, `
                sub main()
                    if true then
                        m.a = 1
                    else
                        m.a = 2
                    end if
                end sub
            `);
        });
        it('transpiles ternary in RHS of incrementor DottedSetStatement to IfStatement', () => {
            testTranspile(`
                sub main()
                    m.a += true ? 1 : 2
                end sub
            `, `
                sub main()
                    if true then
                        m.a += 1
                    else
                        m.a += 2
                    end if
                end sub
            `);
        });
        it('transpiles ternary in RHS of IndexedSetStatement to IfStatement', () => {
            testTranspile(`
                sub main()
                    m["a"] = true ? 1 : 2
                end sub
            `, `
                sub main()
                    if true then
                        m["a"] = 1
                    else
                        m["a"] = 2
                    end if
                end sub
            `);
        });
        it('transpiles ternary in RHS of incrementor IndexedSetStatement to IfStatement', () => {
            testTranspile(`
                sub main()
                    m["a"] += true ? 1 : 2
                end sub
            `, `
                sub main()
                    if true then
                        m["a"] += 1
                    else
                        m["a"] += 2
                    end if
                end sub
            `);
        });
        it('uses the proper prefix when aliased package is installed', () => {
            program.setFile('source/roku_modules/rokucommunity_bslib/bslib.brs', '');
            testTranspile(`
                sub main()
                    user = {}
                    result = [
                        user = invalid ? "no user" : "logged in"
                    ]
                end sub
            `, `
                sub main()
                    user = {}
                    result = [
                        rokucommunity_bslib_ternary(user = invalid, "no user", "logged in")
                    ]
                end sub
            `);
        });
        it('simple consequents', () => {
            testTranspile(`
                sub main()
                    user = {}
                    a = user = invalid ? "no user" : "logged in"
                end sub
            `, `
                sub main()
                    user = {}
                    if user = invalid then
                        a = "no user"
                    else
                        a = "logged in"
                    end if
                end sub
            `);
            testTranspile(`
                sub main()
                    user = {}
                    a = user = invalid ? 1 : "logged in"
                end sub
            `, `
                sub main()
                    user = {}
                    if user = invalid then
                        a = 1
                    else
                        a = "logged in"
                    end if
                end sub
            `);
            testTranspile(`
                sub main()
                    user = {}
                    a = user = invalid ? 1.2 : "logged in"
                end sub
            `, `
                sub main()
                    user = {}
                    if user = invalid then
                        a = 1.2
                    else
                        a = "logged in"
                    end if
                end sub
            `);
            testTranspile(`
                sub main()
                    user = {}
                    a = user = invalid ? {} : "logged in"
                end sub
            `, `
                sub main()
                    user = {}
                    if user = invalid then
                        a = {}
                    else
                        a = "logged in"
                    end if
                end sub
            `);
            testTranspile(`
                sub main()
                    user = {}
                    a = user = invalid ? [] : "logged in"
                end sub
            `, `
                sub main()
                    user = {}
                    if user = invalid then
                        a = []
                    else
                        a = "logged in"
                    end if
                end sub
            `);
        });
        it('simple alternates', () => {
            testTranspile(`
                sub main()
                    user = {}
                    a = user = invalid ? "logged in" : "no user"
                end sub
            `, `
                sub main()
                    user = {}
                    if user = invalid then
                        a = "logged in"
                    else
                        a = "no user"
                    end if
                end sub
            `);
            testTranspile(`
                sub main()
                    user = {}
                    a = user = invalid ? "logged in" : 1
                end sub
            `, `
                sub main()
                    user = {}
                    if user = invalid then
                        a = "logged in"
                    else
                        a = 1
                    end if
                end sub
            `);
            testTranspile(`
                sub main()
                    user = {}
                    a = user = invalid ? "logged in" : 1.2
                end sub
            `, `
                sub main()
                    user = {}
                    if user = invalid then
                        a = "logged in"
                    else
                        a = 1.2
                    end if
                end sub
            `);
            testTranspile(`
                sub main()
                    user = {}
                    a = user = invalid ? "logged in" :  []
                end sub
            `, `
                sub main()
                    user = {}
                    if user = invalid then
                        a = "logged in"
                    else
                        a = []
                    end if
                end sub
            `);
            testTranspile(`
                sub main()
                    user = {}
                    a = user = invalid ? "logged in" :  {}
                end sub
            `, `
                sub main()
                    user = {}
                    if user = invalid then
                        a = "logged in"
                    else
                        a = {}
                    end if
                end sub
            `);
        });
        it('does not capture restricted OS functions', () => {
            testTranspile(`
                sub main()
                    test(true ? invalid : [
                        createObject("roDeviceInfo")
                        type(true)
                        GetGlobalAA()
                        box(1)
                        run("file.brs", invalid)
                        eval("print 1")
                        GetLastRunCompileError()
                        GetLastRunRuntimeError()
                        Tab(1)
                        Pos(0)
                    ])
                end sub
                sub test(p1)
                end sub
            `, `
                sub main()
                    test((function(__bsCondition)
                            if __bsCondition then
                                return invalid
                            else
                                return [
                                    createObject("roDeviceInfo")
                                    type(true)
                                    GetGlobalAA()
                                    box(1)
                                    run("file.brs", invalid)
                                    eval("print 1")
                                    GetLastRunCompileError()
                                    GetLastRunRuntimeError()
                                    Tab(1)
                                    Pos(0)
                                ]
                            end if
                        end function)(true))
                end sub

                sub test(p1)
                end sub
            `);
        });
        it('complex conditions do not cause scope capture', () => {
            testTranspile(`
                sub main()
                    a = str("true") = "true" ? true : false
                end sub
            `, `
                sub main()
                    if str("true") = "true" then
                        a = true
                    else
                        a = false
                    end if
                end sub
            `);
            testTranspile(`
                sub main()
                    a = m.top.service.IsTrue() ? true : false
                end sub
            `, `
                sub main()
                    if m.top.service.IsTrue() then
                        a = true
                    else
                        a = false
                    end if
                end sub
            `);
            testTranspile(`
                sub test(param1)
                end sub

                sub main()
                    a = test(test(test(test(m.fifth()[123].truthy(1))))) ? true : false
                end sub
            `, `
                sub test(param1)
                end sub

                sub main()
                    if test(test(test(test(m.fifth()[123].truthy(1))))) then
                        a = true
                    else
                        a = false
                    end if
                end sub
            `);
        });
        it('captures scope for function call conseqent', () => {
            testTranspile(`
                sub main()
                    zombie = {}
                    result = [
                        zombie.getName() <> invalid ? zombie.GetName() : "zombie"
                    ]
                end sub
            `, `
                sub main()
                    zombie = {}
                    result = [
                        (function(__bsCondition, zombie)
                                if __bsCondition then
                                    return zombie.GetName()
                                else
                                    return "zombie"
                                end if
                            end function)(zombie.getName() <> invalid, zombie)
                    ]
                end sub
            `);
        });
        it('captures scope for function call alternate', () => {
            testTranspile(`
                sub main()
                    zombie = {}
                    result = [
                        zombie.getName() = invalid ? "zombie" :  zombie.GetName()
                    ]
                end sub
            `, `
                sub main()
                    zombie = {}
                    result = [
                        (function(__bsCondition, zombie)
                                if __bsCondition then
                                    return "zombie"
                                else
                                    return zombie.GetName()
                                end if
                            end function)(zombie.getName() = invalid, zombie)
                    ]
                end sub
            `);
        });
        it('captures scope for complex consequent', () => {
            testTranspile(`
                sub main()
                    settings = {}
                    result = [
                        {} ? m.defaults.getAccount(settings.name) : "no"
                    ]
                end sub
            `, `
                sub main()
                    settings = {}
                    result = [
                        (function(__bsCondition, m, settings)
                                if __bsCondition then
                                    return m.defaults.getAccount(settings.name)
                                else
                                    return "no"
                                end if
                            end function)({}, m, settings)
                    ]
                end sub
            `);
        });
        it('ignores enum variable names for scope capturing', () => {
            testTranspile(`
                enum Direction
                    up = "up"
                    down = "down"
                end enum
                sub main()
                    d = Direction.up
                    result = [
                        d = Direction.up ? Direction.up : false
                    ]
                end sub
            `, `
                sub main()
                    d = "up"
                    result = [
                        (function(__bsCondition)
                                if __bsCondition then
                                    return "up"
                                else
                                    return false
                                end if
                            end function)(d = "up")
                    ]
                end sub
            `);
        });
        it('ignores const variable names for scope capturing', () => {
            testTranspile(`
                enum Direction
                    up = "up"
                    down = "down"
                end enum
                const UP = "up"
                sub main()
                    d = Direction.up
                    result = [
                        d = Direction.up ? UP : Direction.down
                    ]
                end sub
            `, `
                sub main()
                    d = "up"
                    result = [
                        (function(__bsCondition)
                                if __bsCondition then
                                    return "up"
                                else
                                    return "down"
                                end if
                            end function)(d = "up")
                    ]
                end sub
            `);
        });
        it('supports scope-captured outer, and simple inner', () => {
            testTranspile(`
                    sub main()
                        zombie = {}
                        human = {}
                        result = zombie <> invalid ? zombie.Attack(human <> invalid ? human: zombie) : "zombie"
                    end sub
                `, `
                    sub main()
                        zombie = {}
                        human = {}
                        if zombie <> invalid then
                            result = zombie.Attack(bslib_ternary(human <> invalid, human, zombie))
                        else
                            result = "zombie"
                        end if
                    end sub
                `);
        });
        it('supports nested ternary in assignment', () => {
            testTranspile(`
                    sub main()
                        result = true ? (false ? "one" : "two") : "three"
                    end sub
                `, `
                    sub main()
                        if true then
                            if false then
                                result = "one"
                            else
                                result = "two"
                            end if
                        else
                            result = "three"
                        end if
                    end sub
                `);
        });
        it('supports nested ternary in DottedSet', () => {
            testTranspile(`
                    sub main()
                        m.result = true ? (false ? "one" : "two") : "three"
                    end sub
                `, `
                    sub main()
                        if true then
                            if false then
                                m.result = "one"
                            else
                                m.result = "two"
                            end if
                        else
                            m.result = "three"
                        end if
                    end sub
                `);
        });
        it('supports nested ternary in IndexedSet', () => {
            testTranspile(`
                    sub main()
                        m["result"] = true ? (false ? "one" : "two") : "three"
                    end sub
                `, `
                    sub main()
                        if true then
                            if false then
                                m["result"] = "one"
                            else
                                m["result"] = "two"
                            end if
                        else
                            m["result"] = "three"
                        end if
                    end sub
                `);
        });
        it('supports ternary in indexedSet key', () => {
            testTranspile(`
                    sub main()
                        m[m.isShiftPressed ? "a" : "b"] = 0
                        m[m.useAltKey ? m.altKey : m.key] = 1
                    end sub
                `, `
                    sub main()
                        m[bslib_ternary(m.isShiftPressed, "a", "b")] = 0
                        m[(function(__bsCondition, m)
                                if __bsCondition then
                                    return m.altKey
                                else
                                    return m.key
                                end if
                            end function)(m.useAltKey, m)] = 1
                    end sub
                `);
        });
        it('supports scope-captured outer, and simple inner', () => {
            testTranspile(`
                    sub main()
                        zombie = {}
                        human = {}
                        result = [
                            zombie <> invalid ? zombie.Attack(human <> invalid ? human: zombie) : "zombie"
                        ]
                    end sub
                `, `
                    sub main()
                        zombie = {}
                        human = {}
                        result = [
                            (function(__bsCondition, human, zombie)
                                    if __bsCondition then
                                        return zombie.Attack(bslib_ternary(human <> invalid, human, zombie))
                                    else
                                        return "zombie"
                                    end if
                                end function)(zombie <> invalid, human, zombie)
                        ]
                    end sub
                `);
        });
        it('uses scope capture for property access', () => {
            testTranspile(`
                    sub main()
                        person = {}
                        result = [
                            person <> invalid ? person.name : "John Doe"
                        ]
                    end sub
                    `, `
                    sub main()
                        person = {}
                        result = [
                            (function(__bsCondition, person)
                                    if __bsCondition then
                                        return person.name
                                    else
                                        return "John Doe"
                                    end if
                                end function)(person <> invalid, person)
                        ]
                    end sub
                `);
        });
        it('uses `invalid` in place of missing consequent ', () => {
            testTranspile(`print name = "bob" ? :"zombie"`, `print bslib_ternary(name = "bob", invalid, "zombie")`, 'none', undefined, false);
        });
        it('uses `invalid` in place of missing alternate ', () => {
            testTranspile(`print name = "bob" ? "human"`, `print bslib_ternary(name = "bob", "human", invalid)`, 'none', undefined, false);
        });
        it('uses `invalid` in place of missing alternate and consequent ', () => {
            testTranspile(`print name = "bob" ?:`, `print bslib_ternary(name = "bob", invalid, invalid)`, 'none', undefined, false);
        });
    });
});
function parseBs(text) {
    return Parser_1.Parser.parse(text, { mode: Parser_1.ParseMode.BrighterScript });
}
//# sourceMappingURL=TernaryExpression.spec.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../util");
const fsExtra = require("fs-extra");
const Program_1 = require("../Program");
const chai_config_spec_1 = require("../chai-config.spec");
const testHelpers_spec_1 = require("../testHelpers.spec");
const testHelpers_spec_2 = require("../testHelpers.spec");
const reflection_1 = require("../astUtils/reflection");
const Statement_1 = require("./Statement");
const Parser_1 = require("./Parser");
describe('AstNode', () => {
    let program;
    beforeEach(() => {
        fsExtra.emptyDirSync(testHelpers_spec_2.tempDir);
        program = new Program_1.Program({
            rootDir: testHelpers_spec_2.rootDir,
            stagingDir: testHelpers_spec_2.stagingDir
        });
        program.createSourceScope(); //ensure source scope is created
    });
    afterEach(() => {
        fsExtra.emptyDirSync(testHelpers_spec_2.tempDir);
        program.dispose();
    });
    describe('findChildAtPosition', () => {
        it('finds deepest AstNode that matches the position', () => {
            const file = program.setFile('source/main.brs', `
                    sub main()
                        alpha = invalid
                        print alpha.beta.charlie.delta(alpha.echo.foxtrot())
                    end sub
                `);
            program.validate();
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
            const delta = file.ast.findChildAtPosition(util_1.util.createPosition(3, 52));
            (0, chai_config_spec_1.expect)(delta.name.text).to.eql('delta');
            const foxtrot = file.ast.findChildAtPosition(util_1.util.createPosition(3, 71));
            (0, chai_config_spec_1.expect)(foxtrot.name.text).to.eql('foxtrot');
        });
    });
    describe('findChild', () => {
        it('finds a child that matches the matcher', () => {
            const file = program.setFile('source/main.brs', `
                sub main()
                    alpha = invalid
                    print alpha.beta.charlie.delta(alpha.echo.foxtrot())
                end sub
            `);
            (0, chai_config_spec_1.expect)(file.ast.findChild((node) => {
                return (0, reflection_1.isAssignmentStatement)(node) && node.name.text === 'alpha';
            })).instanceof(Statement_1.AssignmentStatement);
        });
        it('returns the exact node that matches', () => {
            const file = program.setFile('source/main.brs', `
                sub main()
                    alpha1 = invalid
                    alpha2 = invalid
                end sub
            `);
            let count = 0;
            const instance = file.ast.findChild((node) => {
                if ((0, reflection_1.isAssignmentStatement)(node)) {
                    count++;
                    if (count === 2) {
                        return true;
                    }
                }
            });
            const expected = file.ast.statements[0].func.body.statements[1];
            (0, chai_config_spec_1.expect)(instance).to.equal(expected);
        });
        it('returns undefined when matcher never returned true', () => {
            const file = program.setFile('source/main.brs', `
                sub main()
                    alpha = invalid
                    print alpha.beta.charlie.delta(alpha.echo.foxtrot())
                end sub
            `);
            (0, chai_config_spec_1.expect)(file.ast.findChild((node) => false)).not.to.exist;
        });
        it('returns the value returned from the matcher', () => {
            const file = program.setFile('source/main.brs', `
                sub main()
                    alpha = invalid
                    print alpha.beta.charlie.delta(alpha.echo.foxtrot())
                end sub
            `);
            const secondStatement = file.ast.statements[0].func.body.statements[1];
            (0, chai_config_spec_1.expect)(file.ast.findChild((node) => secondStatement)).to.equal(secondStatement);
        });
        it('cancels properly', () => {
            const file = program.setFile('source/main.brs', `
                sub main()
                    alpha = invalid
                    print alpha.beta.charlie.delta(alpha.echo.foxtrot())
                end sub
            `);
            let count = 0;
            file.ast.findChild((node, cancelToken) => {
                count++;
                cancelToken.cancel();
            });
            (0, chai_config_spec_1.expect)(count).to.eql(1);
        });
    });
    describe('findAncestor', () => {
        it('returns node when matcher returns true', () => {
            const file = program.setFile('source/main.brs', `
                sub main()
                    alpha = invalid
                    print alpha.beta.charlie.delta(alpha.echo.foxtrot())
                end sub
            `);
            const secondStatement = file.ast.statements[0].func.body.statements[1];
            const foxtrot = file.ast.findChild((node) => {
                var _a;
                return (0, reflection_1.isDottedGetExpression)(node) && ((_a = node.name) === null || _a === void 0 ? void 0 : _a.text) === 'foxtrot';
            });
            (0, chai_config_spec_1.expect)(foxtrot.findAncestor(reflection_1.isPrintStatement)).to.equal(secondStatement);
        });
        it('returns undefined when no match found', () => {
            const file = program.setFile('source/main.brs', `
                sub main()
                    alpha = invalid
                    print alpha.beta.charlie.delta(alpha.echo.foxtrot())
                end sub
            `);
            const foxtrot = file.ast.findChild((node) => {
                var _a;
                return (0, reflection_1.isDottedGetExpression)(node) && ((_a = node.name) === null || _a === void 0 ? void 0 : _a.text) === 'foxtrot';
            });
            (0, chai_config_spec_1.expect)(foxtrot.findAncestor(reflection_1.isClassStatement)).to.be.undefined;
        });
        it('returns overridden node when returned in matcher', () => {
            const file = program.setFile('source/main.brs', `
                sub main()
                    alpha = invalid
                    print alpha.beta.charlie.delta(alpha.echo.foxtrot())
                end sub
            `);
            const firstStatement = file.ast.statements[0].func.body.statements[0];
            const foxtrot = file.ast.findChild((node) => {
                var _a;
                return (0, reflection_1.isDottedGetExpression)(node) && ((_a = node.name) === null || _a === void 0 ? void 0 : _a.text) === 'foxtrot';
            });
            (0, chai_config_spec_1.expect)(foxtrot.findAncestor(node => firstStatement)).to.equal(firstStatement);
        });
        it('returns overridden node when returned in matcher', () => {
            const file = program.setFile('source/main.brs', `
                sub main()
                    alpha = invalid
                    print alpha.beta.charlie.delta(alpha.echo.foxtrot())
                end sub
            `);
            let count = 0;
            const firstStatement = file.ast.statements[0].func.body.statements[0];
            firstStatement.findAncestor((node, cancel) => {
                count++;
                cancel.cancel();
            });
            (0, chai_config_spec_1.expect)(count).to.eql(1);
        });
    });
    describe('clone', () => {
        function testClone(code) {
            let originalOuter;
            if (typeof code === 'string') {
                const parser = Parser_1.Parser.parse(code, { mode: Parser_1.ParseMode.BrighterScript });
                originalOuter = parser.ast;
                (0, testHelpers_spec_1.expectZeroDiagnostics)(parser);
            }
            else {
                originalOuter = code;
            }
            const cloneOuter = originalOuter.clone();
            //ensure the clone is identical to the original
            //compare them both ways to ensure no extra properties exist
            ensureIdentical(originalOuter, cloneOuter);
            ensureIdentical(cloneOuter, originalOuter);
            function ensureIdentical(original, clone, ancestors = [], seenNodes = new Map()) {
                var _a, _b, _c;
                for (let key in original) {
                    let fullKey = [...ancestors, key].join('.');
                    const originalValue = original === null || original === void 0 ? void 0 : original[key];
                    const cloneValue = clone === null || clone === void 0 ? void 0 : clone[key];
                    let typeOfValue = typeof originalValue;
                    //skip these properties
                    if (['parent', 'symbolTable', 'range'].includes(key) ||
                        //this is a circular reference property or the `returnType` prop, skip it
                        ((0, reflection_1.isFunctionExpression)(original) && (key === 'functionStatement' || key === 'returnType')) ||
                        //circular reference property for annotations
                        ((0, reflection_1.isAnnotationExpression)(original) && key === 'call')) {
                        continue;
                    }
                    //if this is an object, recurse
                    if (typeOfValue === 'object' && originalValue !== null) {
                        //skip circular references (but give some tollerance)
                        if (seenNodes.get(originalValue) > 2) {
                            throw new Error(`${fullKey} is a circular reference`);
                        }
                        seenNodes.set(originalValue, ((_a = seenNodes.get(originalValue)) !== null && _a !== void 0 ? _a : 0) + 1);
                        //object references should not be the same
                        if (originalValue === cloneValue) {
                            throw new Error(`${fullKey} is the same object reference`);
                        }
                        //compare child object values
                        ensureIdentical(originalValue, cloneValue, [...ancestors, key], seenNodes);
                        //for these tests, empty arrays can be the same as undefined so skip
                    }
                    else if ((Array.isArray(originalValue) && originalValue.length === 0 && cloneValue === undefined) ||
                        (Array.isArray(cloneValue) && cloneValue.length === 0 && originalValue === undefined)) {
                        continue;
                        //these values must be identical
                    }
                    else {
                        // eslint-disable-next-line no-useless-catch
                        try {
                            (0, chai_config_spec_1.expect)(cloneValue).to.equal(originalValue, `'${fullKey}' should be identical`);
                        }
                        catch (e) {
                            //build a full list of ancestors for orig and clone
                            let originalChain = [originalOuter];
                            let cloneChain = [cloneOuter];
                            for (let key of fullKey.split('.')) {
                                originalChain.push((_b = originalChain[originalChain.length - 1]) === null || _b === void 0 ? void 0 : _b[key]);
                                cloneChain.push((_c = cloneChain[cloneChain.length - 1]) === null || _c === void 0 ? void 0 : _c[key]);
                            }
                            console.error(e === null || e === void 0 ? void 0 : e.message, fullKey, originalChain, cloneChain);
                            throw e;
                        }
                    }
                }
            }
        }
        it('clones EmptyStatement', () => {
            testClone(new Statement_1.EmptyStatement(util_1.util.createRange(1, 2, 3, 4)));
        });
        it('clones body with undefined statements array', () => {
            const original = Parser_1.Parser.parse(`
                sub main()
                end sub
            `).ast;
            original.statements = undefined;
            testClone(original);
        });
        it('clones body with undefined in the statements array', () => {
            const original = Parser_1.Parser.parse(`
                sub main()
                end sub
            `).ast;
            original.statements.push(undefined);
            testClone(original);
        });
        it('clones interfaces', () => {
            testClone(`
                interface Empty
                end interface
                interface Movie
                    name as string
                    previous as Movie
                    sub play()
                    function play2(a, b as string) as dynamic
                end interface
                interface Short extends Movie
                    length as integer
                end interface
            `);
        });
        it('handles when interfaces are missing their body', () => {
            const original = Parser_1.Parser.parse(`
                interface Empty
                end interface
            `).ast;
            original.findChild(reflection_1.isInterfaceStatement).body = undefined;
            testClone(original);
        });
        it('handles when interfaces have undefined statements in the body', () => {
            const original = Parser_1.Parser.parse(`
                interface Empty
                end interface
            `).ast;
            original.findChild(reflection_1.isInterfaceStatement).body.push(undefined);
            testClone(original);
        });
        it('handles when interfaces have undefined field type', () => {
            const original = Parser_1.Parser.parse(`
                interface Empty
                    name as string
                end interface
            `).ast;
            original.findChild(reflection_1.isInterfaceFieldStatement).type = undefined;
            testClone(original);
        });
        it('handles when interface function has undefined param and return type', () => {
            const original = Parser_1.Parser.parse(`
                interface Empty
                    function test() as dynamic
                end interface
            `).ast;
            original.findChild(reflection_1.isInterfaceMethodStatement).params.push(undefined);
            original.findChild(reflection_1.isInterfaceMethodStatement).returnType = undefined;
            testClone(original);
        });
        it('handles when interface function has undefined params array', () => {
            const original = Parser_1.Parser.parse(`
                interface Empty
                    function test(a) as dynamic
                end interface
            `).ast;
            original.findChild(reflection_1.isInterfaceMethodStatement).params = undefined;
            testClone(original);
        });
        it('clones empty class', () => {
            testClone(`
                class Movie
                end class
            `);
        });
        it('clones class with undefined body', () => {
            const original = Parser_1.Parser.parse(`
                class Movie
                end class
            `).ast;
            original.findChild(reflection_1.isClassStatement).body = undefined;
            testClone(original);
        });
        it('clones class with undefined body statement', () => {
            const original = Parser_1.Parser.parse(`
                class Movie
                end class
            `).ast;
            original.findChild(reflection_1.isClassStatement).body.push(undefined);
            testClone(original);
        });
        it('clones class having parent class', () => {
            testClone(`
                class Video
                end class
                class Movie extends Video
                end class
            `);
        });
        it('clones class', () => {
            testClone(`
                class Movie
                    name as string
                    previous as Movie
                    sub play()
                    end sub
                    function play2(a, b as string) as dynamic
                    end function
                end class
            `);
        });
        it('clones access modifiers', () => {
            testClone(`
                class Movie
                    public sub test()
                    end sub
                    protected name = "bob"
                    private child = {}
                end class
            `);
        });
        it('clones AssignmentStatement', () => {
            testClone(`
                sub main()
                    thing = true
                end sub
            `);
        });
        it('clones AssignmentStatement with missing value', () => {
            const original = Parser_1.Parser.parse(`
                sub main()
                    thing = true
                end sub
            `).ast;
            original.findChild(reflection_1.isAssignmentStatement).value = undefined;
            testClone(original);
        });
        it('clones Block with undefined statements array', () => {
            const original = Parser_1.Parser.parse(`
                sub main()
                    thing = true
                end sub
            `).ast;
            original.findChild(reflection_1.isBlock).statements = undefined;
            testClone(original);
        });
        it('clones Block with undefined statement in statements array', () => {
            const original = Parser_1.Parser.parse(`
                sub main()
                    thing = true
                end sub
            `).ast;
            original.findChild(reflection_1.isBlock).statements.push(undefined);
            testClone(original);
        });
        it('clones comment statement with undefined comments array', () => {
            const original = Parser_1.Parser.parse(`
                'hello world
            `).ast;
            original.findChild(reflection_1.isCommentStatement).comments = undefined;
            testClone(original);
        });
        it('clones class with undefined method modifiers array', () => {
            const original = Parser_1.Parser.parse(`
                class Movie
                    sub test()
                    end sub
                end class
            `).ast;
            original.findChild(reflection_1.isMethodStatement).modifiers = undefined;
            testClone(original);
        });
        it('clones class with undefined func', () => {
            const original = Parser_1.Parser.parse(`
                class Movie
                    sub test()
                    end sub
                end class
            `).ast;
            original.findChild(reflection_1.isMethodStatement).func = undefined;
            testClone(original);
        });
        it('clones ExpressionStatement', () => {
            testClone(`
                sub main()
                    test()
                end sub
            `);
        });
        it('clones ExpressionStatement without an expression', () => {
            const original = Parser_1.Parser.parse(`
                sub main()
                    test()
                end sub
            `).ast;
            original.findChild(reflection_1.isExpressionStatement).expression = undefined;
            original.findChild(reflection_1.isFunctionExpression).callExpressions = [];
            testClone(original);
        });
        it('clones IfStatement', () => {
            testClone(`
                sub main()
                    if true
                    end if
                    if true then
                    end if
                    if true
                        print 1
                    else if true
                        print 1
                    else
                        print 1
                    end if
                end sub
            `);
        });
        it('clones IfStatement without condition or branches', () => {
            const original = Parser_1.Parser.parse(`
                sub main()
                    if true
                    end if
                end sub
            `).ast;
            original.findChild(reflection_1.isIfStatement).condition = undefined;
            original.findChild(reflection_1.isIfStatement).thenBranch = undefined;
            original.findChild(reflection_1.isIfStatement).elseBranch = undefined;
            testClone(original);
        });
        it('clones IncrementStatement', () => {
            testClone(`
                sub main()
                    i = 0
                    i++
                end sub
            `);
        });
        it('clones IncrementStatement with missing `value`', () => {
            const original = Parser_1.Parser.parse(`
                sub main()
                    i = 0
                    i++
                end sub
            `).ast;
            original.findChild(reflection_1.isIncrementStatement).value = undefined;
            testClone(original);
        });
        it('clones PrintStatement with undefined expressions array', () => {
            const original = Parser_1.Parser.parse(`
                sub main()
                    print 1
                end sub
            `).ast;
            original.findChild(reflection_1.isPrintStatement).expressions = undefined;
            testClone(original);
        });
        it('clones PrintStatement with undefined expression in the expressions array', () => {
            const original = Parser_1.Parser.parse(`
                sub main()
                    print 1
                end sub
            `).ast;
            original.findChild(reflection_1.isPrintStatement).expressions.push(undefined);
            testClone(original);
        });
        it('clones DimStatement', () => {
            testClone(`
                sub main()
                    dim alpha[1,2]
                end sub
            `);
        });
        it('clones DimStatement with undefined dimensions', () => {
            const original = Parser_1.Parser.parse(`
                sub main()
                    dim alpha[1,2]
                end sub
            `).ast;
            original.findChild(reflection_1.isDimStatement).dimensions = undefined;
            testClone(original);
        });
        it('clones DimStatement with undefined as item in dimensions', () => {
            const original = Parser_1.Parser.parse(`
                sub main()
                    dim alpha[1,2]
                end sub
            `).ast;
            original.findChild(reflection_1.isDimStatement).dimensions.push(undefined);
            testClone(original);
        });
        it('clones Goto statement', () => {
            testClone(`
                sub main()
                    label1:
                    for i = 0 to 10
                        goto label1
                    end for
                end sub
            `);
        });
        it('clones return statement', () => {
            testClone(`
                sub main()
                    return
                end sub
            `);
        });
        it('clones return statement with value', () => {
            testClone(`
                function test()
                    return true
                end function
            `);
        });
        it('clones return statement with undefined value expression', () => {
            const original = Parser_1.Parser.parse(`
                function test()
                    return true
                end function
            `).ast;
            original.findChild(reflection_1.isReturnStatement).value = undefined;
            testClone(original);
        });
        it('clones stop statement', () => {
            testClone(`
                sub main()
                    stop
                end sub
            `);
        });
        it('clones ForStatement', () => {
            testClone(`
                function test()
                    for i = 0 to 10 step 2
                    end for
                end function
            `);
        });
        it('clones ForStatement with undefined items', () => {
            const original = Parser_1.Parser.parse(`
                function test()
                    for i = 0 to 10 step 2
                    end for
                end function
            `).ast;
            original.findChild(reflection_1.isForStatement).counterDeclaration = undefined;
            original.findChild(reflection_1.isForStatement).finalValue = undefined;
            original.findChild(reflection_1.isForStatement).body = undefined;
            original.findChild(reflection_1.isForStatement).increment = undefined;
            testClone(original);
        });
        it('clones ForEachStatement', () => {
            testClone(`
                function test()
                    for each item in [1, 2, 3]
                    end for
                end function
            `);
        });
        it('clones ForEachStatement with undefined props', () => {
            const original = Parser_1.Parser.parse(`
                function test()
                    for each item in [1, 2, 3]
                    end for
                end function
            `).ast;
            original.findChild(reflection_1.isForEachStatement).target = undefined;
            original.findChild(reflection_1.isForEachStatement).body = undefined;
            testClone(original);
        });
        it('clones EndStatement', () => {
            testClone(`
                function test()
                    end
                end function
            `);
        });
        it('clones ExitFor statement', () => {
            testClone(`
                sub main()
                    for i = 0 to 10
                        exit for
                    end for
                end sub
            `);
        });
        it('clones While statement', () => {
            testClone(`
                sub main()
                    while true
                    end while
                end sub
            `);
        });
        it('clones While statement', () => {
            testClone(`
                sub main()
                    while true
                    end while
                end sub
            `);
        });
        it('clones ExitWhile statement', () => {
            testClone(`
                sub main()
                    while true
                        exit while
                    end while
                end sub
            `);
        });
        it('clones tryCatch statement', () => {
            testClone(`
                sub main()
                    try
                    catch e
                    end try
                end sub
            `);
        });
        it('clones tryCatch statement when missing branches', () => {
            const original = Parser_1.Parser.parse(`
               sub main()
                    try
                        print 1
                    catch e
                        print 2
                    end try
                end sub
            `).ast;
            original.findChild(reflection_1.isTryCatchStatement).tryBranch = undefined;
            original.findChild(reflection_1.isTryCatchStatement).catchStatement = undefined;
            testClone(original);
        });
        it('clones tryCatch statement when missing catch branch', () => {
            const original = Parser_1.Parser.parse(`
               sub main()
                    try
                        print 1
                    catch e
                        print 2
                    end try
                end sub
            `).ast;
            original.findChild(reflection_1.isCatchStatement).catchBranch = undefined;
            testClone(original);
        });
        it('clones throw statement', () => {
            testClone(`
                sub main()
                    throw "Crash"
                end sub
            `);
        });
        it('clones throw statement with missing expression', () => {
            const original = Parser_1.Parser.parse(`
                sub main()
                    throw "Crash"
                end sub
            `).ast;
            original.findChild(reflection_1.isThrowStatement).expression = undefined;
            testClone(original);
        });
        it('clones FunctionStatement when missing .func', () => {
            const original = Parser_1.Parser.parse(`
               sub main()
                end sub
            `).ast;
            original.findChild(reflection_1.isFunctionStatement).func = undefined;
            testClone(original);
        });
        it('clones empty enum statement', () => {
            testClone(`
               enum Direction
               end enum
            `);
        });
        it('clones enum statement with comments', () => {
            testClone(`
                enum Direction
                    'the up direction
                    up = "up"
                end enum
            `);
        });
        it('clones enum statement with missing body', () => {
            const original = Parser_1.Parser.parse(`
                enum Direction
                    'the up direction
                    up = "up"
                end enum
            `).ast;
            original.findChild(reflection_1.isEnumStatement).body = undefined;
            testClone(original);
        });
        it('clones enum statement with undefined in body', () => {
            const original = Parser_1.Parser.parse(`
                enum Direction
                    'the up direction
                    up = "up"
                end enum
            `).ast;
            original.findChild(reflection_1.isEnumStatement).body.push(undefined);
            testClone(original);
        });
        it('clones enum member with missing value', () => {
            const original = Parser_1.Parser.parse(`
                enum Direction
                    up = "up"
                end enum
            `).ast;
            original.findChild(reflection_1.isEnumMemberStatement).value = undefined;
            testClone(original);
        });
        it('clones const', () => {
            const original = Parser_1.Parser.parse(`
                const key = "KEY"
            `).ast;
            testClone(original);
        });
        it('clones const with missing value', () => {
            const original = Parser_1.Parser.parse(`
                const key = "KEY"
            `).ast;
            original.findChild(reflection_1.isConstStatement).value = undefined;
            testClone(original);
        });
        it('clones continue statement', () => {
            testClone(`
                sub main()
                    for i = 0 to 10
                        continue for
                    end for
                end sub
            `);
        });
        it('clones WhileStatement', () => {
            const original = Parser_1.Parser.parse(`
                sub main()
                    while true
                        print hello
                    end while
                end sub
            `).ast;
            original.findChild(reflection_1.isWhileStatement).condition = undefined;
            original.findChild(reflection_1.isWhileStatement).body = undefined;
            testClone(original);
        });
        it('clones DottedSetStatement', () => {
            const original = Parser_1.Parser.parse(`
                sub main()
                    m.value = true
                end sub
            `).ast;
            testClone(original);
        });
        it('clones DottedSetStatement with missing properties', () => {
            const original = Parser_1.Parser.parse(`
                sub main()
                    m.value = true
                end sub
            `).ast;
            original.findChild(reflection_1.isDottedSetStatement).obj = undefined;
            original.findChild(reflection_1.isDottedSetStatement).value = undefined;
            testClone(original);
        });
        it('clones IndexedSetStatement with missing props', () => {
            const original = Parser_1.Parser.parse(`
                sub main()
                    m["value"] = true
                end sub
            `).ast;
            original.findChild(reflection_1.isIndexedSetStatement).obj = undefined;
            original.findChild(reflection_1.isIndexedSetStatement).value = undefined;
            testClone(original);
        });
        it('clones IndexedSetStatement', () => {
            const original = Parser_1.Parser.parse(`
                sub main()
                    m["value"] = true
                end sub
            `).ast;
            testClone(original);
        });
        it('clones IndexedSetStatement', () => {
            const original = Parser_1.Parser.parse(`
                sub main()
                    m["value"][2] = true
                    m["value", 2] = true
                end sub
            `).ast;
            testClone(original);
        });
        it('clones IndexedSetStatement with undefined additional index', () => {
            const original = Parser_1.Parser.parse(`
                sub main()
                    m["value", 2] = true
                end sub
            `).ast;
            original.findChild(reflection_1.isIndexedSetStatement).additionalIndexes[0] = undefined;
            testClone(original);
        });
        it('clones IndexedSetStatement with missing props', () => {
            const original = Parser_1.Parser.parse(`
                sub main()
                    m["value"] = true
                end sub
            `).ast;
            original.findChild(reflection_1.isIndexedSetStatement).index = undefined;
            original.findChild(reflection_1.isIndexedSetStatement).additionalIndexes = undefined;
            testClone(original);
        });
        it('clones LibraryStatement', () => {
            const original = Parser_1.Parser.parse(`
                Library "v30/bslCore.brs"
            `).ast;
            testClone(original);
        });
        it('clones LibraryStatement with missing tokens', () => {
            const original = Parser_1.Parser.parse(`
                Library "v30/bslCore.brs"
            `).ast;
            original.findChild(reflection_1.isLibraryStatement).tokens = undefined;
            testClone(original);
        });
        it('clones NamespaceStatement', () => {
            const original = Parser_1.Parser.parse(`
                namespace Alpha
                end namespace
            `).ast;
            testClone(original);
        });
        it('clones NamespaceStatement with missing items', () => {
            const original = Parser_1.Parser.parse(`
                namespace Alpha
                end namespace
            `).ast;
            original.findChild(reflection_1.isNamespaceStatement).nameExpression = undefined;
            original.findChild(reflection_1.isNamespaceStatement).body = undefined;
            testClone(original);
        });
        it('clones ImportStatement', () => {
            const original = Parser_1.Parser.parse(`
                import "Something.brs"
            `).ast;
            testClone(original);
        });
        it('clones BinaryExpression', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    print 1 + 2
                end sub
            `).ast;
            testClone(original);
        });
        it('clones BinaryExpression with missing props', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    print 1 + 2
                end sub
            `).ast;
            original.findChild(reflection_1.isBinaryExpression).left = undefined;
            original.findChild(reflection_1.isBinaryExpression).right = undefined;
            testClone(original);
        });
        it('clones CallExpression', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    test()
                end sub
            `).ast;
            testClone(original);
        });
        it('clones CallExpression with args', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    test(1,2,3)
                end sub
            `).ast;
            testClone(original);
        });
        it('clones CallExpression with missing props', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    test(1,2,3)
                end sub
            `).ast;
            original.findChild(reflection_1.isCallExpression).callee = undefined;
            original.findChild(reflection_1.isCallExpression).args = undefined;
            testClone(original);
        });
        it('clones CallExpression with args containing undefined', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    test(1,2,3)
                end sub
            `).ast;
            original.findChild(reflection_1.isCallExpression).args[0] = undefined;
            testClone(original);
        });
        it('clones FunctionExpression', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                end sub
            `).ast;
            testClone(original);
        });
        it('clones FunctionExpression with undefined props', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                end sub
            `).ast;
            original.findChild(reflection_1.isFunctionExpression).parameters = undefined;
            original.findChild(reflection_1.isFunctionExpression).body = undefined;
            testClone(original);
        });
        it('clones FunctionExpression with a parameter that is undefined', () => {
            const original = Parser_1.Parser.parse(`
                sub test(p1)
                end sub
            `).ast;
            original.findChild(reflection_1.isFunctionExpression).parameters[0] = undefined;
            testClone(original);
        });
        it('clones FunctionParameterExpression', () => {
            const original = Parser_1.Parser.parse(`
                sub test(p1)
                end sub
            `).ast;
            testClone(original);
        });
        it('clones FunctionParameterExpression with default value', () => {
            const original = Parser_1.Parser.parse(`
                sub test(p1 = true)
                end sub
            `).ast;
            testClone(original);
        });
        it('clones FunctionParameterExpression with undefined default value', () => {
            const original = Parser_1.Parser.parse(`
                sub test(p1 = true)
                end sub
            `).ast;
            original.findChild(reflection_1.isFunctionExpression).parameters[0].defaultValue = undefined;
            testClone(original);
        });
        it('clones NamespacedVariableNameExpression', () => {
            const original = Parser_1.Parser.parse(`
                sub test(p1 as Alpha.Beta)
                end sub
            `).ast;
            testClone(original);
        });
        it('clones NamespacedVariableNameExpression with undefined expression', () => {
            const original = Parser_1.Parser.parse(`
                class Person extends Alpha.Humanoid
                end class
            `).ast;
            original.findChild(reflection_1.isClassStatement).parentClassName.expression = undefined;
            testClone(original);
        });
        it('clones DottedGetExpression', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    print alpha.beta.charlie
                end sub
            `).ast;
            testClone(original);
        });
        it('clones DottedGetExpression with undefined expression', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    print alpha.beta.charlie
                end sub
            `).ast;
            original.findChild(reflection_1.isDottedGetExpression).obj = undefined;
            testClone(original);
        });
        it('clones XmlAttributeGetExpression', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    print xml@name
                end sub
            `).ast;
            testClone(original);
        });
        it('clones XmlAttributeGetExpression with undefined expression', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    print xml@name
                end sub
            `).ast;
            original.findChild(reflection_1.isXmlAttributeGetExpression).obj = undefined;
            testClone(original);
        });
        it('clones IndexedGetExpression', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    print m.stuff[0]
                end sub
            `).ast;
            testClone(original);
        });
        it('clones IndexedGetExpression with undefined expression', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    print m.stuff[0]
                end sub
            `).ast;
            original.findChild(reflection_1.isIndexedGetExpression).obj = undefined;
            original.findChild(reflection_1.isIndexedGetExpression).index = undefined;
            original.findChild(reflection_1.isIndexedGetExpression).additionalIndexes = undefined;
            testClone(original);
        });
        it('clones IndexedGetExpression with additionalIndexes', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    print m.stuff[0, 1]
                end sub
            `).ast;
            testClone(original);
        });
        it('clones IndexedGetExpression with additionalIndexes having undefined', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    print m.stuff[0, 1]
                end sub
            `).ast;
            original.findChild(reflection_1.isIndexedGetExpression).additionalIndexes[0] = undefined;
            testClone(original);
        });
        it('clones GroupingExpression', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    print (1 + 2)
                end sub
            `).ast;
            testClone(original);
        });
        it('clones GroupingExpression with undefined expression', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    print (1 + 2)
                end sub
            `).ast;
            original.findChild(reflection_1.isGroupingExpression).expression = undefined;
            testClone(original);
        });
        it('clones LiteralExpression', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    print true
                end sub
            `).ast;
            testClone(original);
        });
        it('clones ExcapedCharCodeLiteralExpression', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    print \`\n\`
                end sub
            `).ast;
            testClone(original);
        });
        it('clones ArrayLiteralExpression', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    print []
                end sub
            `).ast;
            testClone(original);
        });
        it('clones ArrayLiteralExpression with undefined items', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    print []
                end sub
            `).ast;
            original.findChild(reflection_1.isArrayLiteralExpression).elements = undefined;
            testClone(original);
        });
        it('clones ArrayLiteralExpression with with elements having an undefined', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    print [1,2,3]
                end sub
            `).ast;
            original.findChild(reflection_1.isArrayLiteralExpression).elements[0] = undefined;
            testClone(original);
        });
        it('clones AAMemberExpression', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    movie = {
                        duration: 20
                    }
                end sub
            `).ast;
            testClone(original);
        });
        it('clones AAMemberExpression with undefined expression', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    movie = {
                        duration: 20
                    }
                end sub
            `).ast;
            original.findChild(reflection_1.isAAMemberExpression).value = undefined;
            testClone(original);
        });
        it('clones AALiteralExpression', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    movie = {
                        duration: 20
                    }
                end sub
            `).ast;
            testClone(original);
        });
        it('clones AALiteralExpression with undefined items', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    movie = {
                        duration: 20
                    }
                end sub
            `).ast;
            original.findChild(reflection_1.isAALiteralExpression).elements = undefined;
            testClone(original);
        });
        it('clones AALiteralExpression with undefined items', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    movie = {
                        duration: 20
                    }
                end sub
            `).ast;
            original.findChild(reflection_1.isAALiteralExpression).elements.push(undefined);
            testClone(original);
        });
        it('clones UnaryExpression', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    print not true
                end sub
            `).ast;
            testClone(original);
        });
        it('clones UnaryExpression with undefined expression', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    print not true
                end sub
            `).ast;
            original.findChild(reflection_1.isUnaryExpression).right = undefined;
            testClone(original);
        });
        it('clones SourceLiteralExpression', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    print LINE_NUM
                end sub
            `).ast;
            testClone(original);
        });
        it('clones NewExpression', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    print new Person()
                end sub
            `).ast;
            testClone(original);
        });
        it('clones NewExpression with undefined expression', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    print new Person()
                end sub
            `).ast;
            original.findChild(reflection_1.isNewExpression).call = undefined;
            testClone(original);
        });
        it('clones CallfuncExpression', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    print node@.run(1)
                end sub
            `).ast;
            testClone(original);
        });
        it('clones CallfuncExpression with undefined expression', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    print node@.run()
                end sub
            `).ast;
            original.findChild(reflection_1.isCallfuncExpression).callee = undefined;
            original.findChild(reflection_1.isCallfuncExpression).args = undefined;
            testClone(original);
        });
        it('clones CallfuncExpression with undefined args', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    print node@.run()
                end sub
            `).ast;
            original.findChild(reflection_1.isCallfuncExpression).args[0] = undefined;
            testClone(original);
        });
        it('clones TemplateStringQuasiExpression', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    print \`hello \${name}\`
                end sub
            `).ast;
            testClone(original);
        });
        it('clones TemplateStringQuasiExpression with undefined expressions', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    print \`hello \${name}\`
                end sub
            `).ast;
            original.findChild(reflection_1.isTemplateStringQuasiExpression).expressions = undefined;
            testClone(original);
        });
        it('clones TemplateStringQuasiExpression with undefined expressions', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    print \`hello \${name}\`
                end sub
            `).ast;
            original.findChild(reflection_1.isTemplateStringQuasiExpression).expressions[0] = undefined;
            testClone(original);
        });
        it('clones TemplateStringExpression', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    print \`hello \${name} \\n\`
                end sub
            `).ast;
            testClone(original);
        });
        it('clones TemplateStringExpression with undefined expressions', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    print \`hello \${name}\`
                end sub
            `).ast;
            original.findChild(reflection_1.isTemplateStringExpression).quasis = undefined;
            original.findChild(reflection_1.isTemplateStringExpression).expressions = undefined;
            testClone(original);
        });
        it('clones TemplateStringExpression with undefined expressions', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    print \`hello \${name}\`
                end sub
            `).ast;
            original.findChild(reflection_1.isTemplateStringExpression).quasis.push(undefined);
            original.findChild(reflection_1.isTemplateStringExpression).expressions.push(undefined);
            testClone(original);
        });
        it('clones TemplateStringExpression', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    print tag\`hello \${name} \\n\`
                end sub
            `).ast;
            testClone(original);
        });
        it('clones TemplateStringExpression with undefined expressions', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    print tag\`hello \${name}\`
                end sub
            `).ast;
            original.findChild(reflection_1.isTaggedTemplateStringExpression).quasis = undefined;
            original.findChild(reflection_1.isTaggedTemplateStringExpression).expressions = undefined;
            testClone(original);
        });
        it('clones TemplateStringExpression with undefined expressions', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    print tag\`hello \${name}\`
                end sub
            `).ast;
            original.findChild(reflection_1.isTaggedTemplateStringExpression).quasis.push(undefined);
            original.findChild(reflection_1.isTaggedTemplateStringExpression).expressions.push(undefined);
            testClone(original);
        });
        it('clones TernaryExpression', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    print true ? 1 : 2
                end sub
            `).ast;
            testClone(original);
        });
        it('clones TernaryExpression with undefined expressions', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    print true ? 1 : 2
                end sub
            `).ast;
            original.findChild(reflection_1.isTernaryExpression).test = undefined;
            original.findChild(reflection_1.isTernaryExpression).consequent = undefined;
            original.findChild(reflection_1.isTernaryExpression).alternate = undefined;
            testClone(original);
        });
        it('clones NullCoalescingExpression', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    print a ?? b
                end sub
            `).ast;
            testClone(original);
        });
        it('clones NullCoalescingExpression with undefined expressions', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    print a ?? b
                end sub
            `).ast;
            original.findChild(reflection_1.isNullCoalescingExpression).consequent = undefined;
            original.findChild(reflection_1.isNullCoalescingExpression).alternate = undefined;
            testClone(original);
        });
        it('clones RegexLiteralExpression', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    print /test/gi
                end sub
            `).ast;
            testClone(original);
        });
        it('clones TypeCastExpression', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    print name as string
                end sub
            `).ast;
            testClone(original);
        });
        it('clones TypeCastExpression with undefined expression', () => {
            const original = Parser_1.Parser.parse(`
                sub test()
                    print name as string
                end sub
            `).ast;
            original.findChild(reflection_1.isTypeCastExpression).obj = undefined;
            testClone(original);
        });
        it('clones AnnotationExpressions above every statement type', () => {
            const original = Parser_1.Parser.parse(`
                @annotation()
                sub test()
                    @annotation()
                    statement = true
                    @annotation()
                    call()
                    @annotation()
                    'comment
                end sub

                @annotation()
                class Person
                end class

                @annotation()
                enum Direction
                end enum

                @annotation()
                namespace alpha
                end namespace

                @annotation()
                const thing = 1
            `).ast;
            testClone(original);
        });
    });
});
//# sourceMappingURL=AstNode.spec.js.map
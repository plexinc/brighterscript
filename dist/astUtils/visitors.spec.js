"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageserver_1 = require("vscode-languageserver");
const chai_config_spec_1 = require("../chai-config.spec");
const sinon = require("sinon");
const Program_1 = require("../Program");
const Statement_1 = require("../parser/Statement");
const TokenKind_1 = require("../lexer/TokenKind");
const visitors_1 = require("./visitors");
const reflection_1 = require("./reflection");
const creators_1 = require("./creators");
const stackedVisitor_1 = require("./stackedVisitor");
const AstEditor_1 = require("./AstEditor");
const Parser_1 = require("../parser/Parser");
const testHelpers_spec_1 = require("../testHelpers.spec");
const Expression_1 = require("../parser/Expression");
describe('astUtils visitors', () => {
    const rootDir = process.cwd();
    let program;
    const PRINTS_SRC = `
        sub Main()
            print 1
            print 2

            function exec(s)
                s()
            end function

            exec(sub()
                print 8
            end sub)

            if a = 1
                print 3
            else if a = 2
                print 4
            else
                print 5
            end if

            while a <> invalid
                print 6
            end while

            for a = 1 to 10
                print 7
            end for
        end sub
    `;
    const EXPRESSIONS_SRC = `
        sub Main()
            'comment
            print "msg"; 3
            print \`expand \${var}\`
            a = "a"
            b = "b" + c
            m.global.x = "x"
            aa[10] = "aa"
            exec("e", some())
            for i = 1 to 10
            end for
            for each n in aa
            end for
            while i < 10
                i++
            end while
            if j > 0
            else if j < -10
            end if
            return invalid
        end sub
    `;
    beforeEach(() => {
        program = new Program_1.Program({ rootDir: rootDir });
    });
    afterEach(() => {
        program.dispose();
    });
    function functionsWalker(visitor, cancel) {
        return (file) => {
            file.parser.references.functionExpressions.some(functionExpression => {
                visitor(functionExpression.body, undefined);
                (0, visitors_1.walkStatements)(functionExpression.body, (statement, parent) => visitor(statement, parent), cancel);
                return cancel === null || cancel === void 0 ? void 0 : cancel.isCancellationRequested;
            });
        };
    }
    describe('Statements', () => {
        it('Walks through all the statements with depth', () => {
            const actual = [];
            const visitor = (0, stackedVisitor_1.createStackedVisitor)((s, stack) => {
                const d = stack.length;
                actual.push(`${s.constructor.name}:${d}`);
            });
            const walker = functionsWalker(visitor);
            program.plugins.add({
                name: 'walker',
                afterFileParse: file => walker(file)
            });
            program.setFile('source/main.brs', PRINTS_SRC);
            (0, chai_config_spec_1.expect)(actual).to.deep.equal([
                'Block:0',
                'PrintStatement:1',
                'PrintStatement:1',
                'FunctionStatement:1',
                'ExpressionStatement:1',
                'IfStatement:1',
                'Block:2',
                'PrintStatement:3',
                'IfStatement:2',
                'Block:3',
                'PrintStatement:4',
                'Block:3',
                'PrintStatement:4',
                'WhileStatement:1',
                'Block:2',
                'PrintStatement:3',
                'ForStatement:1',
                'AssignmentStatement:2',
                'Block:2',
                'PrintStatement:3',
                'Block:0',
                'ExpressionStatement:1',
                'Block:0',
                'PrintStatement:1' //   print 8
            ]);
        });
        it('Walks through all the statements with token not cancelled', () => {
            const cancel = new vscode_languageserver_1.CancellationTokenSource();
            const actual = [];
            const walker = functionsWalker(s => actual.push(s.constructor.name), cancel.token);
            program.plugins.add({
                name: 'walker',
                afterFileParse: file => walker(file)
            });
            program.setFile('source/main.brs', PRINTS_SRC);
            (0, chai_config_spec_1.expect)(actual).to.deep.equal([
                'Block',
                'PrintStatement',
                'PrintStatement',
                'FunctionStatement',
                'ExpressionStatement',
                'IfStatement',
                'Block',
                'PrintStatement',
                'IfStatement',
                'Block',
                'PrintStatement',
                'Block',
                'PrintStatement',
                'WhileStatement',
                'Block',
                'PrintStatement',
                'ForStatement',
                'AssignmentStatement',
                'Block',
                'PrintStatement',
                'Block',
                'ExpressionStatement',
                'Block',
                'PrintStatement' //   print 8
            ]);
        });
        it('Stops walking when requested', () => {
            const cancel = new vscode_languageserver_1.CancellationTokenSource();
            const actual = [];
            let count = 0;
            const walker = functionsWalker(s => {
                actual.push(s.constructor.name);
                if ((0, reflection_1.isPrintStatement)(s)) {
                    if (++count === 4) {
                        cancel.cancel();
                    }
                }
            }, cancel.token);
            program.plugins.add({
                name: 'walker',
                afterFileParse: file => walker(file)
            });
            program.setFile('source/main.brs', PRINTS_SRC);
            (0, chai_config_spec_1.expect)(actual).to.deep.equal([
                'Block',
                'PrintStatement',
                'PrintStatement',
                'FunctionStatement',
                'ExpressionStatement',
                'IfStatement',
                'Block',
                'PrintStatement',
                'IfStatement',
                'Block',
                'PrintStatement' // print 4
            ]);
        });
    });
    describe('Statement visitor', () => {
        it('Maps statements to individual handlers', () => {
            const printHandler = sinon.spy();
            const blockHandler = sinon.spy();
            const visitor = (0, visitors_1.createVisitor)({
                PrintStatement: printHandler,
                Block: blockHandler
            });
            const printStatement = new Statement_1.PrintStatement({
                print: (0, creators_1.createToken)(TokenKind_1.TokenKind.Print)
            }, []);
            const blockStatement = new Statement_1.Block([], vscode_languageserver_1.Range.create(0, 0, 0, 0));
            visitor(printStatement, undefined);
            visitor(blockStatement, undefined);
            (0, chai_config_spec_1.expect)(printHandler.callCount).to.equal(1);
            (0, chai_config_spec_1.expect)(printHandler.calledWith(printStatement)).to.be.true;
            (0, chai_config_spec_1.expect)(blockHandler.callCount).to.equal(1);
            (0, chai_config_spec_1.expect)(blockHandler.calledWith(blockStatement)).to.be.true;
        });
    });
    describe('Statement editor', () => {
        it('allows replacing statements', () => {
            const printStatement1 = new Statement_1.PrintStatement({
                print: (0, creators_1.createToken)(TokenKind_1.TokenKind.Print)
            }, []);
            const printStatement2 = new Statement_1.PrintStatement({
                print: (0, creators_1.createToken)(TokenKind_1.TokenKind.Print)
            }, []);
            const block = new Statement_1.Block([
                printStatement1,
                new Statement_1.ReturnStatement({ return: (0, creators_1.createToken)(TokenKind_1.TokenKind.Return) })
            ], vscode_languageserver_1.Range.create(0, 0, 0, 0));
            const visitor = (0, visitors_1.createVisitor)({
                PrintStatement: () => printStatement2
            });
            (0, visitors_1.walkStatements)(block, visitor);
            (0, chai_config_spec_1.expect)(block.statements[0]).to.equal(printStatement2);
        });
        it('uses the AstEditor for replacement when provided', () => {
            const editor = new AstEditor_1.AstEditor();
            const printStatement1 = new Statement_1.PrintStatement({
                print: (0, creators_1.createToken)(TokenKind_1.TokenKind.Print)
            }, []);
            const printStatement2 = new Statement_1.PrintStatement({
                print: (0, creators_1.createToken)(TokenKind_1.TokenKind.Print)
            }, []);
            const block = new Statement_1.Block([
                printStatement1
            ], vscode_languageserver_1.Range.create(0, 0, 0, 0));
            block.walk((0, visitors_1.createVisitor)({
                PrintStatement: () => printStatement2
            }), {
                walkMode: visitors_1.WalkMode.visitAll,
                editor: editor
            });
            (0, chai_config_spec_1.expect)(block.statements[0]).to.equal(printStatement2);
            editor.undoAll();
            (0, chai_config_spec_1.expect)(block.statements[0]).to.equal(printStatement1);
        });
    });
    describe('Expressions', () => {
        it('Walks through all expressions', () => {
            const actual = [];
            let curr;
            const statementVisitor = (0, stackedVisitor_1.createStackedVisitor)((statement, stack) => {
                curr = { statement: statement, depth: stack.length };
            });
            function expressionVisitor(expression, _) {
                const { statement, depth } = curr;
                actual.push(`${statement.constructor.name}:${depth}:${expression.constructor.name}`);
            }
            const walker = functionsWalker((statement, parentStatement) => {
                statementVisitor(statement, parentStatement);
                statement.walk(expressionVisitor, {
                    walkMode: visitors_1.WalkMode.visitLocalExpressions
                });
            });
            program.plugins.add({
                name: 'walker',
                afterFileParse: (file) => walker(file)
            });
            program.setFile('source/main.brs', EXPRESSIONS_SRC);
            (0, chai_config_spec_1.expect)(actual).to.deep.equal([
                //The comment statement is weird because it can't be both a statement and expression, but is treated that way. Just ignore it for now until we refactor comments.
                //'CommentStatement:1:CommentStatement',          // '<comment>
                'PrintStatement:1:LiteralExpression',
                'PrintStatement:1:LiteralExpression',
                'PrintStatement:1:TemplateStringExpression',
                'PrintStatement:1:TemplateStringQuasiExpression',
                'PrintStatement:1:LiteralExpression',
                'PrintStatement:1:VariableExpression',
                'PrintStatement:1:TemplateStringQuasiExpression',
                'PrintStatement:1:LiteralExpression',
                'AssignmentStatement:1:LiteralExpression',
                'AssignmentStatement:1:BinaryExpression',
                'AssignmentStatement:1:LiteralExpression',
                'AssignmentStatement:1:VariableExpression',
                'DottedSetStatement:1:DottedGetExpression',
                'DottedSetStatement:1:VariableExpression',
                'DottedSetStatement:1:LiteralExpression',
                'IndexedSetStatement:1:VariableExpression',
                'IndexedSetStatement:1:LiteralExpression',
                'IndexedSetStatement:1:LiteralExpression',
                'ExpressionStatement:1:CallExpression',
                'ExpressionStatement:1:VariableExpression',
                'ExpressionStatement:1:LiteralExpression',
                'ExpressionStatement:1:CallExpression',
                'ExpressionStatement:1:VariableExpression',
                'ForStatement:1:LiteralExpression',
                'AssignmentStatement:2:LiteralExpression',
                'ForEachStatement:1:VariableExpression',
                'WhileStatement:1:BinaryExpression',
                'WhileStatement:1:VariableExpression',
                'WhileStatement:1:LiteralExpression',
                'IncrementStatement:3:VariableExpression',
                'IfStatement:1:BinaryExpression',
                'IfStatement:1:VariableExpression',
                'IfStatement:1:LiteralExpression',
                'IfStatement:2:BinaryExpression',
                'IfStatement:2:VariableExpression',
                'IfStatement:2:UnaryExpression',
                'IfStatement:2:LiteralExpression',
                'ReturnStatement:1:LiteralExpression' // return <invalid>
            ]);
        });
    });
    describe('walk', () => {
        function testWalk(text, expectedConstructors, walkMode = visitors_1.WalkMode.visitAllRecursive) {
            const file = program.setFile('source/main.bs', text);
            const items = [];
            let index = 1;
            file.ast.walk((element) => {
                element._testId = index++;
                items.push(element);
            }, {
                walkMode: walkMode
            });
            index = 1;
            (0, chai_config_spec_1.expect)(items.map(x => `${x.constructor.name}:${x._testId}`)).to.eql(expectedConstructors.map(x => `${x}:${index++}`));
        }
        it('links every ast node to its parent when walked', () => {
            const { ast } = program.setFile('source/main.bs', `
                library "v30/bslCore.brs"
                import "source/main.bs"
                namespace alpha
                    namespace beta
                        sub charlie()
                            delta = 1
                            delta++
                            delta = sub()
                                'do some printing
                                print "hello"
                            end sub
                            delta()
                            for i = 0 to 10 step 1
                                exit for
                            end for
                            while false
                                exit while
                            end while
                            if true or false then
                                print 1.2
                            else
                                print 123123123123
                            end if
                            dim arr[1, 2]
                            goto theLabel
                            theLabel:
                            return false
                            end
                            stop
                            for each item in [1, 2, 3]
                                continue for
                            end for
                            obj = { name: "bob"}
                            obj.name = obj.name
                            obj["name"] = obj["name"]
                            obj.name = obj@firstName
                            print (true or false)
                            print \`true\${false}\\n\`
                            print not true
                            print FUNCTION_NAME
                            print new Person()
                            print tag\`stuff\${1}\`
                            print true ? true : false
                            print true ?? false
                            print /search stuff/g
                            try
                                obj.bob = "carl"
                                throw "e"
                            catch e
                                obj["name"] = "dale"
                            print e
                            end try
                            obj@.doCallfunc(1, 2)
                        end sub
                    end namespace
                end namespace
                @SomeAnnotation(1, "two")
                interface IPerson
                    name as string
                    function doSomething() as string
                end interface
                class Person
                    name as string = "bob"
                    function doSomething(value = true) as string
                    end function
                end class
                enum Direction
                    up = "up"
                end enum
                enum Logical
                    yes = 1
                    no = 0
                end enum
                const CONST_VALUE = 1.2
            `);
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
            const nodes = [];
            //get every expression and statement in the file
            ast.walk((node) => {
                nodes.push(node);
            }, { walkMode: visitors_1.WalkMode.visitAllRecursive });
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                //find the top-most ast node
                let top = node;
                while (top.parent) {
                    top = top.parent;
                }
                //should be the same instance. If it doesn't then something is wrong with the .parent linking
                (0, chai_config_spec_1.expect)(top === ast || node === ast, `Node ${node.constructor.name} (index ${i}) has broken parent link`).to.be.true;
            }
        });
        it('Walks through all expressions until cancelled', () => {
            const file = program.setFile('source/main.bs', `
                sub logger(message = "nil" as string)
                    innerLog = sub(message = "nil" as string)
                        print message
                    end sub
                    innerLog(message)
                end sub
            `);
            const cancel = new vscode_languageserver_1.CancellationTokenSource();
            let count = 0;
            const stopIndex = 5;
            file.ast.walk((statement, parent) => {
                count++;
                if (count === stopIndex) {
                    cancel.cancel();
                }
            }, {
                walkMode: visitors_1.WalkMode.visitAllRecursive,
                cancel: cancel.token
            });
            (0, chai_config_spec_1.expect)(count).to.equal(stopIndex);
        });
        it('walks if statement', () => {
            testWalk(`
                sub main()
                    if true then
                        print "true"
                    else if true then
                        print "true"
                    else
                        print "true"
                    end if
                end sub
            `, [
                'FunctionStatement',
                'FunctionExpression',
                'Block',
                //if
                'IfStatement',
                'LiteralExpression',
                'Block',
                'PrintStatement',
                'LiteralExpression',
                //else if
                'IfStatement',
                'LiteralExpression',
                'Block',
                'PrintStatement',
                'LiteralExpression',
                //else
                'Block',
                'PrintStatement',
                'LiteralExpression'
            ]);
        });
        it('walks if statement without else', () => {
            testWalk(`
                sub main()
                    if true then
                        print "true"
                    end if
                end sub
            `, [
                'FunctionStatement',
                'FunctionExpression',
                'Block',
                'IfStatement',
                'LiteralExpression',
                'Block',
                'PrintStatement',
                'LiteralExpression'
            ]);
        });
        it('walks increment statement', () => {
            testWalk(`
                sub main()
                    age = 12
                    age++
                end sub
            `, [
                'FunctionStatement',
                'FunctionExpression',
                'Block',
                'AssignmentStatement',
                'LiteralExpression',
                'IncrementStatement',
                'VariableExpression'
            ]);
        });
        it('walks ForStatement', () => {
            testWalk(`
                sub main()
                    for i = 0 to 10 step 1
                        print i
                    end for
                end sub
            `, [
                'FunctionStatement',
                'FunctionExpression',
                'Block',
                'ForStatement',
                'AssignmentStatement',
                'LiteralExpression',
                'LiteralExpression',
                'LiteralExpression',
                'Block',
                'PrintStatement',
                'VariableExpression'
            ]);
        });
        it('walks ForEachStatement', () => {
            testWalk(`
                sub main()
                    for each item in [1,2,3]
                        print item
                    end for
                end sub
            `, [
                'FunctionStatement',
                'FunctionExpression',
                'Block',
                'ForEachStatement',
                'ArrayLiteralExpression',
                'LiteralExpression',
                'LiteralExpression',
                'LiteralExpression',
                'Block',
                'PrintStatement',
                'VariableExpression'
            ]);
        });
        it('walks dotted and indexed set statements', () => {
            testWalk(`
                sub main()
                    person = {}
                    person.name = "person"
                    person["age"] = 12
                end sub
            `, [
                'FunctionStatement',
                'FunctionExpression',
                'Block',
                'AssignmentStatement',
                'AALiteralExpression',
                'DottedSetStatement',
                'VariableExpression',
                'LiteralExpression',
                'IndexedSetStatement',
                'VariableExpression',
                'LiteralExpression',
                'LiteralExpression'
            ]);
        });
        it('walks while loop', () => {
            testWalk(`
                sub main()
                    while 1 + 1 = 2
                        print "infinite"
                    end while
                end sub
            `, [
                'FunctionStatement',
                'FunctionExpression',
                'Block',
                'WhileStatement',
                'BinaryExpression',
                'BinaryExpression',
                'LiteralExpression',
                'LiteralExpression',
                'LiteralExpression',
                'Block',
                'PrintStatement',
                'LiteralExpression'
            ]);
        });
        it('walks namespace', () => {
            testWalk(`
               namespace NameA.NameB
               end namespace
            `, [
                'NamespaceStatement',
                'NamespacedVariableNameExpression',
                'DottedGetExpression',
                'VariableExpression'
            ]);
        });
        it('walks nested functions', () => {
            testWalk(`
                sub main()
                    print "main"
                    inner1 = sub()
                        print "inner1"
                        inner2 = sub()
                            print "inner2"
                            inner3 = sub()
                                print "inner3"
                            end sub
                        end sub
                    end sub
                end sub
            `, [
                //sub main()
                'FunctionStatement',
                'FunctionExpression',
                'Block',
                'PrintStatement',
                'LiteralExpression',
                //inner1 = sub()
                'AssignmentStatement',
                'FunctionExpression',
                'Block',
                'PrintStatement',
                'LiteralExpression',
                //inner2 = sub()
                'AssignmentStatement',
                'FunctionExpression',
                'Block',
                'PrintStatement',
                'LiteralExpression',
                //inner3 = sub
                'AssignmentStatement',
                'FunctionExpression',
                'Block',
                'PrintStatement',
                'LiteralExpression'
            ]);
        });
        it('walks CallExpression', () => {
            testWalk(`
                sub main()
                    Sleep(123)
                end sub
            `, [
                'FunctionStatement',
                'FunctionExpression',
                'Block',
                'ExpressionStatement',
                'CallExpression',
                'VariableExpression',
                'LiteralExpression'
            ]);
        });
        it('walks function parameters', () => {
            testWalk(`
                sub main(arg1)
                    speak = sub(arg1, arg2)
                    end sub
                end sub
            `, [
                'FunctionStatement',
                'FunctionExpression',
                'FunctionParameterExpression',
                'Block',
                'AssignmentStatement',
                'FunctionExpression',
                'FunctionParameterExpression',
                'FunctionParameterExpression',
                'Block'
            ]);
        });
        it('walks DottedGetExpression', () => {
            testWalk(`
                sub main()
                    print person.name
                end sub
            `, [
                'FunctionStatement',
                'FunctionExpression',
                'Block',
                'PrintStatement',
                'DottedGetExpression',
                'VariableExpression'
            ]);
        });
        it('walks XmlAttributeGetExpression', () => {
            testWalk(`
                sub main()
                    print person@name
                end sub
            `, [
                'FunctionStatement',
                'FunctionExpression',
                'Block',
                'PrintStatement',
                'XmlAttributeGetExpression',
                'VariableExpression'
            ]);
        });
        it('walks IndexedGetExpression', () => {
            testWalk(`
                sub main()
                    print person["name"]
                end sub
            `, [
                'FunctionStatement',
                'FunctionExpression',
                'Block',
                'PrintStatement',
                'IndexedGetExpression',
                'VariableExpression',
                'LiteralExpression'
            ]);
        });
        it('walks GroupingExpression', () => {
            testWalk(`
                sub main()
                    print 1 + ( 1 + 2 )
                end sub
            `, [
                'FunctionStatement',
                'FunctionExpression',
                'Block',
                'PrintStatement',
                'BinaryExpression',
                'LiteralExpression',
                'GroupingExpression',
                'BinaryExpression',
                'LiteralExpression',
                'LiteralExpression'
            ]);
        });
        it('walks AALiteralExpression', () => {
            testWalk(`
                sub main()
                    person = {
                        'comment
                        "name": "John Doe"
                    }
                end sub
            `, [
                'FunctionStatement',
                'FunctionExpression',
                'Block',
                'AssignmentStatement',
                'AALiteralExpression',
                'CommentStatement',
                'AAMemberExpression',
                'LiteralExpression'
            ]);
        });
        it('walks UnaryExpression', () => {
            testWalk(`
                sub main()
                   isAlive = not isDead
                end sub
            `, [
                'FunctionStatement',
                'FunctionExpression',
                'Block',
                'AssignmentStatement',
                'UnaryExpression',
                'VariableExpression'
            ]);
        });
        it('walks TemplateStringExpression', () => {
            testWalk(`
                sub main()
                   print \`Hello \${worldVar}\`
                end sub
            `, [
                'FunctionStatement',
                'FunctionExpression',
                'Block',
                'PrintStatement',
                'TemplateStringExpression',
                'TemplateStringQuasiExpression',
                'LiteralExpression',
                'VariableExpression',
                'TemplateStringQuasiExpression',
                'LiteralExpression'
            ]);
        });
        it('walks ReturnStatement with or without value', () => {
            testWalk(`
                sub main()
                    a = 0
                    if a = 0 then
                        return
                    else if a > 0 then
                        return 1
                    else
                        return 'nothing
                    end if
                end sub
            `, [
                'FunctionStatement',
                'FunctionExpression',
                'Block',
                'AssignmentStatement',
                'LiteralExpression',
                //if
                'IfStatement',
                'BinaryExpression',
                'VariableExpression',
                'LiteralExpression',
                'Block',
                'ReturnStatement',
                //else if
                'IfStatement',
                'BinaryExpression',
                'VariableExpression',
                'LiteralExpression',
                'Block',
                'ReturnStatement',
                'LiteralExpression',
                //else
                'Block',
                'ReturnStatement',
                'CommentStatement'
            ]);
        });
        it('walks TaggedTemplateStringExpression', () => {
            testWalk(`
                sub main()
                   print tag\`Hello \${worldVar}\`
                end sub
            `, [
                'FunctionStatement',
                'FunctionExpression',
                'Block',
                'PrintStatement',
                'TaggedTemplateStringExpression',
                'TemplateStringQuasiExpression',
                'LiteralExpression',
                'VariableExpression',
                'TemplateStringQuasiExpression',
                'LiteralExpression'
            ]);
        });
        it('walks CharCodeLiteral expression within TemplateLiteralExpression', () => {
            testWalk(`
                sub main()
                   print \`\\n\`
                end sub
            `, [
                'FunctionStatement',
                'FunctionExpression',
                'Block',
                'PrintStatement',
                'TemplateStringExpression',
                'TemplateStringQuasiExpression',
                'LiteralExpression',
                'EscapedCharCodeLiteralExpression',
                'LiteralExpression'
            ]);
        });
        it('walks NewExpression', () => {
            testWalk(`
                sub main()
                  person = new Person()
                end sub
            `, [
                'FunctionStatement',
                'FunctionExpression',
                'Block',
                'AssignmentStatement',
                'NewExpression',
                'CallExpression',
                'NamespacedVariableNameExpression',
                'VariableExpression'
            ]);
        });
        it('walks CallfuncExpression', () => {
            testWalk(`
                sub main()
                  person@.doSomething("arg1")
                end sub
            `, [
                'FunctionStatement',
                'FunctionExpression',
                'Block',
                'ExpressionStatement',
                'CallfuncExpression',
                'VariableExpression',
                'LiteralExpression'
            ]);
        });
        it('walks ClassStatement', () => {
            testWalk(`
                class Person
                    name as string
                    age as integer = 1
                    function getName()
                        return m.name
                    end function
                end class
            `, [
                'ClassStatement',
                'FieldStatement',
                'FieldStatement',
                'LiteralExpression',
                'MethodStatement',
                'FunctionExpression',
                'Block',
                'ReturnStatement',
                'DottedGetExpression',
                'VariableExpression'
            ]);
        });
        it('visits all statements and no expressions', () => {
            testWalk(`
                sub main()
                    log = sub(message)
                        print "hello " + message
                    end sub
                    log("hello" + " world")
                end sub
            `, [
                'FunctionStatement',
                'Block',
                'AssignmentStatement',
                'Block',
                'PrintStatement',
                'ExpressionStatement'
            ], visitors_1.WalkMode.visitStatementsRecursive);
        });
        it('visits all expressions and no statement', () => {
            testWalk(`
                sub main()
                    log = sub(message)
                        print "hello " + message
                    end sub
                    log("hello" + " world")
                end sub
            `, [
                'FunctionExpression',
                'FunctionExpression',
                'FunctionParameterExpression',
                'BinaryExpression',
                'LiteralExpression',
                'VariableExpression',
                'CallExpression',
                'VariableExpression',
                'BinaryExpression',
                'LiteralExpression',
                'LiteralExpression'
            ], visitors_1.WalkMode.visitExpressionsRecursive);
        });
        it('provides owner and key', () => {
            const items = [];
            const { ast } = Parser_1.Parser.parse(`
                sub main()
                    log = sub(message)
                        print "hello " + message
                    end sub
                    log("hello" + " world")
                end sub
            `);
            ast.walk((astNode, parent, owner, key) => {
                items.push(astNode);
                (0, chai_config_spec_1.expect)(owner[key]).to.equal(astNode);
            }, {
                walkMode: visitors_1.WalkMode.visitAllRecursive
            });
            (0, chai_config_spec_1.expect)(items).to.be.length(17);
        });
        it('can be used to delete statements', () => {
            const { ast } = Parser_1.Parser.parse(`
                sub main()
                    print 1
                    print 2
                    print 3
                end sub
            `);
            let callCount = 0;
            ast.walk((astNode, parent, owner, key) => {
                if ((0, reflection_1.isPrintStatement)(astNode)) {
                    callCount++;
                    //delete the print statement (we know owner is an array based on this specific test)
                    owner.splice(key, 1);
                }
            }, {
                walkMode: visitors_1.WalkMode.visitAllRecursive
            });
            //the visitor should have been called for every statement
            (0, chai_config_spec_1.expect)(callCount).to.eql(3);
            (0, chai_config_spec_1.expect)(ast.statements[0].func.body.statements).to.be.lengthOf(0);
        });
        it('walks everything when the first element is replaced', () => {
            const { ast } = Parser_1.Parser.parse(`
                sub main()
                    print 1
                    print 2
                    print 3
                end sub
            `);
            const target = ast.findChild(reflection_1.isBlock).statements[0];
            let callCount = 0;
            ast.walk((astNode, parent, owner, key) => {
                if ((0, reflection_1.isPrintStatement)(astNode)) {
                    callCount++;
                }
                if (astNode === target) {
                    owner.splice(key, 1);
                }
            }, {
                walkMode: visitors_1.WalkMode.visitAllRecursive
            });
            //the visitor should have been called for every statement
            (0, chai_config_spec_1.expect)(callCount).to.eql(3);
            (0, chai_config_spec_1.expect)(ast.statements[0].func.body.statements).not.to.include(target);
        });
        it('walks everything when the middle element is replaced', () => {
            const { ast } = Parser_1.Parser.parse(`
                sub main()
                    print 1
                    print 2
                    print 3
                end sub
            `);
            const target = ast.findChild(reflection_1.isBlock).statements[1];
            let callCount = 0;
            ast.walk((astNode, parent, owner, key) => {
                if ((0, reflection_1.isPrintStatement)(astNode)) {
                    callCount++;
                }
                if (astNode === target) {
                    owner.splice(key, 1);
                }
            }, {
                walkMode: visitors_1.WalkMode.visitAllRecursive
            });
            //the visitor should have been called for every statement
            (0, chai_config_spec_1.expect)(callCount).to.eql(3);
            (0, chai_config_spec_1.expect)(ast.statements[0].func.body.statements).not.to.include(target);
        });
        it('walks everything when the end element is replaced', () => {
            const { ast } = Parser_1.Parser.parse(`
                sub main()
                    print 1
                    print 2
                    print 3
                end sub
            `);
            const target = ast.findChild(reflection_1.isBlock).statements[2];
            let callCount = 0;
            ast.walk((astNode, parent, owner, key) => {
                if ((0, reflection_1.isPrintStatement)(astNode)) {
                    callCount++;
                }
                if (astNode === target) {
                    owner.splice(key, 1);
                }
            }, {
                walkMode: visitors_1.WalkMode.visitAllRecursive
            });
            //the visitor should have been called for every statement
            (0, chai_config_spec_1.expect)(callCount).to.eql(3);
            (0, chai_config_spec_1.expect)(ast.statements[0].func.body.statements).not.to.include(target);
        });
        it('can be used to insert statements', () => {
            const { ast } = Parser_1.Parser.parse(`
                sub main()
                    print 1
                    print 2
                    print 3
                end sub
            `);
            let printStatementCount = 0;
            let callExpressionCount = 0;
            const calls = [];
            ast.walk((0, visitors_1.createVisitor)({
                PrintStatement: (astNode, parent, owner, key) => {
                    printStatementCount++;
                    //add another expression to the list every time. This should result in 1 the first time, 2 the second, 3 the third.
                    calls.push(new Statement_1.ExpressionStatement((0, creators_1.createCall)((0, creators_1.createVariableExpression)('doSomethingBeforePrint'), [
                        (0, creators_1.createIntegerLiteral)(callExpressionCount.toString())
                    ])));
                    owner.splice(key + 1, 0, ...calls.map(x => x.clone()));
                },
                CallExpression: (call) => {
                    callExpressionCount++;
                    console.log('call visitor for', call.args[0].token.text);
                }
            }), {
                walkMode: visitors_1.WalkMode.visitAllRecursive
            });
            //the visitor should have been called for every statement
            (0, chai_config_spec_1.expect)(printStatementCount).to.eql(3);
            //since the calls were injected after each print statement, we should have 1 call for the first print, 2 for the second, and 3 for the third
            (0, chai_config_spec_1.expect)(callExpressionCount).to.eql(6);
            (0, chai_config_spec_1.expect)(ast.statements[0].func.body.statements).to.be.lengthOf(9);
        });
        it('walks a new child when returned from a visitor', () => {
            let walkedLiterals = [];
            Parser_1.Parser.parse(`
                sub main()
                    print 1 + 2
                end sub
            `).ast.walk((0, visitors_1.createVisitor)({
                BinaryExpression: (node, parent, owner, key) => {
                    //replace the `1 + 2` binary expression with a new binary expression
                    if ((0, reflection_1.isLiteralExpression)(node.left) && node.left.token.text === '1') {
                        return new Expression_1.BinaryExpression((0, creators_1.createIntegerLiteral)('3'), (0, creators_1.createToken)(TokenKind_1.TokenKind.Plus), (0, creators_1.createIntegerLiteral)('4'));
                    }
                },
                LiteralExpression: (node) => {
                    walkedLiterals.push(node.token.text);
                }
            }), {
                walkMode: visitors_1.WalkMode.visitAllRecursive
            });
            (0, chai_config_spec_1.expect)(walkedLiterals).to.eql(['3', '4']);
        });
        it('walks a new child when returned from a visitor and using an AstEditor', () => {
            let walkedLiterals = [];
            Parser_1.Parser.parse(`
                sub main()
                    print 1 + 2
                end sub
            `).ast.walk((0, visitors_1.createVisitor)({
                BinaryExpression: (node, parent, owner, key) => {
                    //replace the `1 + 2` binary expression with a new binary expression
                    if ((0, reflection_1.isLiteralExpression)(node.left) && node.left.token.text === '1') {
                        return new Expression_1.BinaryExpression((0, creators_1.createIntegerLiteral)('3'), (0, creators_1.createToken)(TokenKind_1.TokenKind.Plus), (0, creators_1.createIntegerLiteral)('4'));
                    }
                },
                LiteralExpression: (node) => {
                    walkedLiterals.push(node.token.text);
                }
            }), {
                walkMode: visitors_1.WalkMode.visitAllRecursive,
                editor: new AstEditor_1.AstEditor()
            });
            (0, chai_config_spec_1.expect)(walkedLiterals).to.eql(['3', '4']);
        });
    });
    describe('walkArray', () => {
        const one = (0, creators_1.createVariableExpression)('one');
        const two = (0, creators_1.createVariableExpression)('two');
        const three = (0, creators_1.createVariableExpression)('three');
        const four = (0, creators_1.createVariableExpression)('four');
        const five = (0, creators_1.createVariableExpression)('five');
        function doTest(startingArray, expected, visitor) {
            const visitedItems = [];
            (0, visitors_1.walkArray)(startingArray, (item, parent, owner, key) => {
                visitedItems.push(item);
                return visitor === null || visitor === void 0 ? void 0 : visitor(item, parent, owner, key);
            }, { walkMode: visitors_1.WalkMode.visitAllRecursive });
            (0, chai_config_spec_1.expect)(visitedItems.map(x => x.name.text)).to.eql(expected.map(x => x.name.text));
        }
        it('walks every element in the array', () => {
            doTest([one, two, three, four, five], [one, two, three, four, five]);
        });
        it('walks new items added to the array', () => {
            doTest([one, two], [one, three, two, four], (item, parent, owner, key) => {
                //insert a value after one
                if (item === one) {
                    owner.splice(key + 1, 0, three);
                    //insert a value after one
                }
                else if (item === two) {
                    owner.splice(key + 1, 0, four);
                }
            });
        });
        it('triggers on nodes that were skiped due to insertions', () => {
            doTest([one, two, three], [one, two, four, three], (item, parent, owner, key) => {
                //insert a value after one
                if (item === two) {
                    owner.splice(key, 0, four);
                }
            });
        });
    });
});
//# sourceMappingURL=visitors.spec.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../../chai-config.spec");
const Program_1 = require("../../Program");
const sinon_1 = require("sinon");
const testHelpers_spec_1 = require("../../testHelpers.spec");
const vscode_languageserver_types_1 = require("vscode-languageserver-types");
let sinon = (0, sinon_1.createSandbox)();
describe('DocumentSymbolProcessor', () => {
    let program;
    beforeEach(() => {
        program = new Program_1.Program({ rootDir: testHelpers_spec_1.rootDir, sourceMap: true });
    });
    afterEach(() => {
        sinon.restore();
        program.dispose();
    });
    function doTest(source, expected) {
        program.setFile('source/main.brs', source);
        expectSymbols(program.getDocumentSymbols('source/main.brs'), expected);
    }
    it('skips other file types for now', () => {
        program.setFile('components/MainScene.xml', `
            <component name="MainScene" extends="Scene">
            </component>
        `);
        expectSymbols(program.getDocumentSymbols('components/MainScene.xml'), {});
    });
    it('does not crash when name is missing', () => {
        program.plugins['suppressErrors'] = false;
        function testMissingToken(source, nameTokenPath, expected = {}) {
            const file = program.setFile('source/main.brs', source);
            let node = file.ast.statements[0];
            //delete the token at the given path
            for (let i = 0; i < nameTokenPath.length - 1; i++) {
                node = node[nameTokenPath[i]];
            }
            delete node[nameTokenPath[nameTokenPath.length - 1]];
            expectSymbols(program.getDocumentSymbols('source/main.brs'), expected);
        }
        //function name is missing
        testMissingToken(`
            sub alpha()
            end sub
        `, ['name']);
        //class name is missing
        testMissingToken(`
            class alpha
            end class
        `, ['name']);
        //class field name is missing
        testMissingToken(`
            class alpha
                name as string
            end class
        `, ['body', '0', 'name'], {
            alpha: vscode_languageserver_types_1.SymbolKind.Class
        });
        //class method name is missing
        testMissingToken(`
            class alpha
                sub test()
                end sub
            end class
        `, ['body', '0', 'name'], {
            alpha: vscode_languageserver_types_1.SymbolKind.Class
        });
        //interface name is missing
        testMissingToken(`
            interface alpha
            end interface
        `, ['tokens', 'name']);
        //interface method name is missing
        testMissingToken(`
            interface alpha
                sub test() as void
            end interface
        `, ['body', '0', 'tokens', 'name'], {
            alpha: vscode_languageserver_types_1.SymbolKind.Interface
        });
        //interface field name is missing
        testMissingToken(`
            interface alpha
                name as string
            end interface
        `, ['body', '0', 'tokens', 'name'], {
            alpha: vscode_languageserver_types_1.SymbolKind.Interface
        });
        //const name is missing
        testMissingToken(`
            const alpha = 1
        `, ['tokens', 'name']);
        //namespace name is missing
        testMissingToken(`
            namespace alpha
            end namespace
        `, ['nameExpression']);
        //enum name is missing
        testMissingToken(`
            enum alpha
            end enum
        `, ['tokens', 'name']);
        //enum member name is missing
        testMissingToken(`
            enum alpha
                name = 1
            end enum
        `, ['body', '0', 'tokens', 'name'], {
            alpha: vscode_languageserver_types_1.SymbolKind.Enum
        });
    });
    it('finds functions', () => {
        doTest(`
            function alpha()
            end function
            function beta()
            end function
        `, {
            'alpha': vscode_languageserver_types_1.SymbolKind.Function,
            'beta': vscode_languageserver_types_1.SymbolKind.Function
        });
    });
    it('finds namespaces', () => {
        doTest(`
            namespace alpha
            end namespace
            namespace beta
            end namespace
            namespace charlie
                namespace delta
                end namespace
            end namespace
        `, {
            alpha: vscode_languageserver_types_1.SymbolKind.Namespace,
            beta: vscode_languageserver_types_1.SymbolKind.Namespace,
            charlie: {
                kind: vscode_languageserver_types_1.SymbolKind.Namespace,
                children: {
                    delta: vscode_languageserver_types_1.SymbolKind.Namespace
                }
            }
        });
    });
    it('finds classes', () => {
        doTest(`
            class alpha
            end class

            namespace beta
                class charlie
                    name as string
                    sub speak()
                        print "I am " + m.name
                    end sub
                end class
            end namespace
        `, {
            alpha: vscode_languageserver_types_1.SymbolKind.Class,
            beta: {
                kind: vscode_languageserver_types_1.SymbolKind.Namespace,
                children: {
                    charlie: {
                        kind: vscode_languageserver_types_1.SymbolKind.Class,
                        children: {
                            name: vscode_languageserver_types_1.SymbolKind.Field,
                            speak: vscode_languageserver_types_1.SymbolKind.Method
                        }
                    }
                }
            }
        });
    });
    it('finds interfaces', () => {
        doTest(`
            interface alpha
                name as string
            end interface

            namespace beta
                interface charlie
                    age as string
                    sub speak() as void
                end interface
            end namespace
        `, {
            alpha: {
                kind: vscode_languageserver_types_1.SymbolKind.Interface,
                children: {
                    name: vscode_languageserver_types_1.SymbolKind.Field
                }
            },
            beta: {
                kind: vscode_languageserver_types_1.SymbolKind.Namespace,
                children: {
                    charlie: {
                        kind: vscode_languageserver_types_1.SymbolKind.Interface,
                        children: {
                            age: vscode_languageserver_types_1.SymbolKind.Field,
                            speak: vscode_languageserver_types_1.SymbolKind.Method
                        }
                    }
                }
            }
        });
    });
    it('finds consts', () => {
        doTest(`
            const alpha = 1
            namespace beta
                const charlie = 2
            end namespace
            const delta = 3
        `, {
            alpha: vscode_languageserver_types_1.SymbolKind.Constant,
            beta: {
                kind: vscode_languageserver_types_1.SymbolKind.Namespace,
                children: {
                    charlie: vscode_languageserver_types_1.SymbolKind.Constant
                }
            },
            delta: vscode_languageserver_types_1.SymbolKind.Constant
        });
    });
    it('finds enums', () => {
        doTest(`
            enum alpha
                a = 1
                b = 2
            end enum
            namespace beta
                enum charlie
                    c = 3
                    d = 4
                end enum
            end namespace
        `, {
            alpha: {
                kind: vscode_languageserver_types_1.SymbolKind.Enum,
                children: {
                    a: vscode_languageserver_types_1.SymbolKind.EnumMember,
                    b: vscode_languageserver_types_1.SymbolKind.EnumMember
                }
            },
            beta: {
                kind: vscode_languageserver_types_1.SymbolKind.Namespace,
                children: {
                    charlie: {
                        kind: vscode_languageserver_types_1.SymbolKind.Enum,
                        children: {
                            c: vscode_languageserver_types_1.SymbolKind.EnumMember,
                            d: vscode_languageserver_types_1.SymbolKind.EnumMember
                        }
                    }
                }
            }
        });
    });
    function expectSymbols(documentSymbols, expected) {
        (0, chai_config_spec_1.expect)(symbolKindToString(createSymbolTree(documentSymbols))).to.eql(symbolKindToString(expected));
    }
    const SymbolKindMap = new Map(Object.entries(vscode_languageserver_types_1.SymbolKind).map(x => [x[1], x[0]]));
    function symbolKindToString(tree) {
        //recursively walk the tree and convert every .kind property to a string
        for (let key in tree) {
            let value = tree[key];
            if (typeof value === 'object') {
                tree[key] = symbolKindToString(value);
            }
            else {
                tree[key] = SymbolKindMap.get(value);
            }
        }
        return tree;
    }
    function createSymbolTree(documentSymbols) {
        var _a;
        let tree = {};
        for (let symbol of documentSymbols) {
            tree[symbol.name] = symbol.kind;
            if (((_a = symbol.children) === null || _a === void 0 ? void 0 : _a.length) > 0) {
                tree[symbol.name] = {
                    kind: symbol.kind,
                    children: createSymbolTree(symbol.children)
                };
            }
        }
        return tree;
    }
});
//# sourceMappingURL=DocumentSymbolProcessor.spec.js.map
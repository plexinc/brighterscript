"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../../chai-config.spec");
const Program_1 = require("../../Program");
const sinon_1 = require("sinon");
const testHelpers_spec_1 = require("../../testHelpers.spec");
const vscode_languageserver_types_1 = require("vscode-languageserver-types");
const vscode_languageserver_types_2 = require("vscode-languageserver-types");
const util_1 = require("../../util");
let sinon = (0, sinon_1.createSandbox)();
describe('WorkspaceSymbolProcessor', () => {
    let program;
    beforeEach(() => {
        program = new Program_1.Program({ rootDir: testHelpers_spec_1.rootDir, sourceMap: true });
    });
    afterEach(() => {
        sinon.restore();
        program.dispose();
    });
    function doTest(sources, expected) {
        var _a;
        for (let i = 0; i < sources.length; i++) {
            program.setFile(`source/lib${i}.brs`, sources[i]);
        }
        const actual = program.getWorkspaceSymbols().sort((a, b) => symbolToString(a).localeCompare(symbolToString(b)));
        for (let i = 0; i < actual.length; i++) {
            let a = actual[i];
            let b = expected === null || expected === void 0 ? void 0 : expected[i];
            //if the expected doesn't have a range, delete the range from the actual
            if ((b === null || b === void 0 ? void 0 : b[3]) === undefined) {
                delete a.location.range;
            }
        }
        (0, chai_config_spec_1.expect)(actual.map(x => symbolToString(x))).to.eql((_a = expected === null || expected === void 0 ? void 0 : expected.map(x => {
            var _a;
            return symbolToString(vscode_languageserver_types_1.WorkspaceSymbol.create(x[0], x[1], util_1.default.pathToUri((0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/${(_a = x[2]) !== null && _a !== void 0 ? _a : 'source/lib0.brs'}`), typeof x[3] === 'number' ? util_1.default.createRange(x[3], x[4], x[5], x[6]) : null));
        })) !== null && _a !== void 0 ? _a : undefined);
    }
    const SymbolKindMap = new Map(Object.entries(vscode_languageserver_types_2.SymbolKind).map(x => [x[1], x[0]]));
    function symbolToString(symbol) {
        let result = `${symbol.name}|${SymbolKindMap.get(symbol.kind)}|${symbol.location.uri}`;
        const range = symbol.location.range;
        if (range) {
            result += '|' + util_1.default.rangeToString(range);
        }
        return result;
    }
    it('skips other file types for now', () => {
        program.setFile('components/MainScene.xml', `
            <component name="MainScene" extends="Scene">
            </component>
        `);
        (0, chai_config_spec_1.expect)(program.getWorkspaceSymbols()).to.eql([]);
    });
    it('does not crash when name is missing', () => {
        program.plugins['suppressErrors'] = false;
        function testMissingToken(source, nameTokenPath, expected) {
            const file = program.setFile('source/lib0.brs', source);
            let node = file.ast.statements[0];
            //delete the token at the given path
            for (let i = 0; i < nameTokenPath.length - 1; i++) {
                node = node[nameTokenPath[i]];
            }
            delete node[nameTokenPath[nameTokenPath.length - 1]];
            doTest([], expected !== null && expected !== void 0 ? expected : []);
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
        `, ['body', '0', 'name'], [
            ['alpha', vscode_languageserver_types_2.SymbolKind.Class]
        ]);
        //class method name is missing
        testMissingToken(`
            class alpha
                sub test()
                end sub
            end class
        `, ['body', '0', 'name'], [
            ['alpha', vscode_languageserver_types_2.SymbolKind.Class]
        ]);
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
        `, ['body', '0', 'tokens', 'name'], [
            ['alpha', vscode_languageserver_types_2.SymbolKind.Interface]
        ]);
        //interface field name is missing
        testMissingToken(`
            interface alpha
                name as string
            end interface
        `, ['body', '0', 'tokens', 'name'], [
            ['alpha', vscode_languageserver_types_2.SymbolKind.Interface]
        ]);
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
        `, ['body', '0', 'tokens', 'name'], [
            ['alpha', vscode_languageserver_types_2.SymbolKind.Enum]
        ]);
    });
    it('finds functions', () => {
        doTest([`
            function alpha()
            end function
            function beta()
            end function
        `], [
            ['alpha', vscode_languageserver_types_2.SymbolKind.Function, 'source/lib0.brs', 1, 21, 1, 26],
            ['beta', vscode_languageserver_types_2.SymbolKind.Function, 'source/lib0.brs', 3, 21, 3, 25]
        ]);
    });
    it('finds namespaces', () => {
        doTest([`
            namespace alpha
            end namespace
            namespace beta
            end namespace
            namespace charlie
                namespace delta
                end namespace
            end namespace
        `], [
            ['alpha', vscode_languageserver_types_2.SymbolKind.Namespace],
            ['beta', vscode_languageserver_types_2.SymbolKind.Namespace],
            ['charlie', vscode_languageserver_types_2.SymbolKind.Namespace],
            ['delta', vscode_languageserver_types_2.SymbolKind.Namespace]
        ]);
    });
    it('finds classes', () => {
        doTest([`
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
        `], [
            ['alpha', vscode_languageserver_types_2.SymbolKind.Class],
            ['beta', vscode_languageserver_types_2.SymbolKind.Namespace],
            ['charlie', vscode_languageserver_types_2.SymbolKind.Class],
            ['name', vscode_languageserver_types_2.SymbolKind.Field],
            ['speak', vscode_languageserver_types_2.SymbolKind.Method]
        ]);
    });
    it('finds interfaces', () => {
        doTest([`
            interface alpha
                beta as string
            end interface

            namespace charlie
                interface delta
                    echo as string
                    sub foxtrot() as void
                end interface
            end namespace
        `], [
            ['alpha', vscode_languageserver_types_2.SymbolKind.Interface],
            ['beta', vscode_languageserver_types_2.SymbolKind.Field],
            ['charlie', vscode_languageserver_types_2.SymbolKind.Namespace],
            ['delta', vscode_languageserver_types_2.SymbolKind.Interface],
            ['echo', vscode_languageserver_types_2.SymbolKind.Field],
            ['foxtrot', vscode_languageserver_types_2.SymbolKind.Method]
        ]);
    });
    it('finds consts', () => {
        doTest([`
            const alpha = 1
            namespace beta
                const charlie = 2
            end namespace
            const delta = 3
        `], [
            ['alpha', vscode_languageserver_types_2.SymbolKind.Constant],
            ['beta', vscode_languageserver_types_2.SymbolKind.Namespace],
            ['charlie', vscode_languageserver_types_2.SymbolKind.Constant],
            ['delta', vscode_languageserver_types_2.SymbolKind.Constant]
        ]);
    });
    it('finds enums', () => {
        doTest([`
            enum alpha
                b = 1
                c = 2
            end enum
            namespace delta
                enum echo
                    f = 3
                    g = 4
                end enum
            end namespace
        `], [
            ['alpha', vscode_languageserver_types_2.SymbolKind.Enum],
            ['b', vscode_languageserver_types_2.SymbolKind.EnumMember],
            ['c', vscode_languageserver_types_2.SymbolKind.EnumMember],
            ['delta', vscode_languageserver_types_2.SymbolKind.Namespace],
            ['echo', vscode_languageserver_types_2.SymbolKind.Enum],
            ['f', vscode_languageserver_types_2.SymbolKind.EnumMember],
            ['g', vscode_languageserver_types_2.SymbolKind.EnumMember]
        ]);
    });
});
//# sourceMappingURL=WorkspaceSymbolProcessor.spec.js.map
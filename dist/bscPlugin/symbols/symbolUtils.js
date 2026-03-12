"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkspaceSymbolsFromBrsFile = exports.getDocumentSymbolsFromBrsFile = void 0;
const vscode_languageserver_protocol_1 = require("vscode-languageserver-protocol");
const vscode_languageserver_protocol_2 = require("vscode-languageserver-protocol");
const util_1 = require("../../util");
const visitors_1 = require("../../astUtils/visitors");
function getDocumentSymbolsFromBrsFile(file) {
    let result = [];
    const symbols = getSymbolsFromAstNode(file.ast);
    for (let symbol of symbols) {
        result.push(createSymbol(symbol));
    }
    return result;
    function createSymbol(symbol) {
        return vscode_languageserver_protocol_2.DocumentSymbol.create(symbol.name, symbol.documentation, symbol.kind, symbol.range, symbol.selectionRange, symbol.children.map(x => createSymbol(x)));
    }
}
exports.getDocumentSymbolsFromBrsFile = getDocumentSymbolsFromBrsFile;
function getWorkspaceSymbolsFromBrsFile(file) {
    const result = [];
    const uri = util_1.default.pathToUri(file.srcPath);
    let symbolsToProcess = getSymbolsFromAstNode(file.ast);
    while (symbolsToProcess.length > 0) {
        //get the symbol
        const symbolInfo = symbolsToProcess.shift();
        //push any children to be processed later
        symbolsToProcess.push(...symbolInfo.children);
        const workspaceSymbol = vscode_languageserver_protocol_1.WorkspaceSymbol.create(symbolInfo.name, symbolInfo.kind, uri, symbolInfo.selectionRange);
        workspaceSymbol.containerName = symbolInfo.containerName;
        result.push(workspaceSymbol);
    }
    return result;
}
exports.getWorkspaceSymbolsFromBrsFile = getWorkspaceSymbolsFromBrsFile;
function getSymbolsFromAstNode(node) {
    //collection of every symbol, indexed by the node it was based on (this is useful to help attach children to their parents)
    const result = [];
    const lookup = new Map();
    function addSymbol(node, name, kind, range, selectionRange, documenation) {
        const symbol = {
            name: name,
            documentation: documenation,
            kind: kind,
            range: range,
            selectionRange: selectionRange,
            containerName: undefined,
            children: []
        };
        lookup.set(node, symbol);
        let parent = node.parent;
        while (parent) {
            if (lookup.has(parent)) {
                break;
            }
            parent = parent.parent;
        }
        //if we found a parent, add this symbol as a child of the parent
        if (parent) {
            const parentSymbol = lookup.get(parent);
            symbol.containerName = parentSymbol.name;
            parentSymbol.children.push(symbol);
        }
        else {
            //there's no parent. add the symbol as a top level result
            result.push(symbol);
        }
    }
    node.walk((0, visitors_1.createVisitor)({
        FunctionStatement: (statement) => {
            var _a;
            if ((_a = statement.name) === null || _a === void 0 ? void 0 : _a.text) {
                addSymbol(statement, statement.name.text, vscode_languageserver_protocol_2.SymbolKind.Function, statement.range, statement.name.range);
            }
        },
        ClassStatement: (statement, parent) => {
            var _a;
            if ((_a = statement.name) === null || _a === void 0 ? void 0 : _a.text) {
                addSymbol(statement, statement.name.text, vscode_languageserver_protocol_2.SymbolKind.Class, statement.range, statement.name.range);
            }
        },
        FieldStatement: (statement, parent) => {
            var _a;
            if ((_a = statement.name) === null || _a === void 0 ? void 0 : _a.text) {
                addSymbol(statement, statement.name.text, vscode_languageserver_protocol_2.SymbolKind.Field, statement.range, statement.name.range);
            }
        },
        MethodStatement: (statement, parent) => {
            var _a;
            if ((_a = statement.name) === null || _a === void 0 ? void 0 : _a.text) {
                addSymbol(statement, statement.name.text, vscode_languageserver_protocol_2.SymbolKind.Method, statement.range, statement.name.range);
            }
        },
        InterfaceStatement: (statement, parent) => {
            var _a;
            if ((_a = statement.tokens.name) === null || _a === void 0 ? void 0 : _a.text) {
                addSymbol(statement, statement.tokens.name.text, vscode_languageserver_protocol_2.SymbolKind.Interface, statement.range, statement.tokens.name.range);
            }
        },
        InterfaceFieldStatement: (statement, parent) => {
            var _a;
            if ((_a = statement.tokens.name) === null || _a === void 0 ? void 0 : _a.text) {
                addSymbol(statement, statement.tokens.name.text, vscode_languageserver_protocol_2.SymbolKind.Field, statement.range, statement.tokens.name.range);
            }
        },
        InterfaceMethodStatement: (statement, parent) => {
            var _a;
            if ((_a = statement.tokens.name) === null || _a === void 0 ? void 0 : _a.text) {
                addSymbol(statement, statement.tokens.name.text, vscode_languageserver_protocol_2.SymbolKind.Method, statement.range, statement.tokens.name.range);
            }
        },
        ConstStatement: (statement) => {
            var _a;
            if ((_a = statement.tokens.name) === null || _a === void 0 ? void 0 : _a.text) {
                addSymbol(statement, statement.tokens.name.text, vscode_languageserver_protocol_2.SymbolKind.Constant, statement.range, statement.tokens.name.range);
            }
        },
        NamespaceStatement: (statement) => {
            if (statement.nameExpression) {
                addSymbol(statement, statement.nameExpression.getNameParts().pop(), vscode_languageserver_protocol_2.SymbolKind.Namespace, statement.range, statement.nameExpression.range);
            }
        },
        EnumStatement: (statement) => {
            var _a;
            if ((_a = statement.tokens.name) === null || _a === void 0 ? void 0 : _a.text) {
                addSymbol(statement, statement.tokens.name.text, vscode_languageserver_protocol_2.SymbolKind.Enum, statement.range, statement.tokens.name.range);
            }
        },
        EnumMemberStatement: (statement) => {
            var _a;
            if ((_a = statement.tokens.name) === null || _a === void 0 ? void 0 : _a.text) {
                addSymbol(statement, statement.tokens.name.text, vscode_languageserver_protocol_2.SymbolKind.EnumMember, statement.range, statement.tokens.name.range);
            }
        }
    }), {
        walkMode: visitors_1.WalkMode.visitAllRecursive
    });
    return result;
}
//# sourceMappingURL=symbolUtils.js.map
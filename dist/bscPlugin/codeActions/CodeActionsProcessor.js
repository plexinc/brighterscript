"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeActionsProcessor = void 0;
const vscode_languageserver_1 = require("vscode-languageserver");
const CodeActionUtil_1 = require("../../CodeActionUtil");
const DiagnosticMessages_1 = require("../../DiagnosticMessages");
const Parser_1 = require("../../parser/Parser");
const util_1 = require("../../util");
const reflection_1 = require("../../astUtils/reflection");
const TokenKind_1 = require("../../lexer/TokenKind");
class CodeActionsProcessor {
    constructor(event) {
        this.event = event;
        this.suggestedImports = new Set();
    }
    process() {
        for (const diagnostic of this.event.diagnostics) {
            if (diagnostic.code === DiagnosticMessages_1.DiagnosticCodeMap.cannotFindName || diagnostic.code === DiagnosticMessages_1.DiagnosticCodeMap.cannotFindFunction) {
                this.suggestCannotFindName(diagnostic);
            }
            else if (diagnostic.code === DiagnosticMessages_1.DiagnosticCodeMap.classCouldNotBeFound) {
                this.suggestClassImports(diagnostic);
            }
            else if (diagnostic.code === DiagnosticMessages_1.DiagnosticCodeMap.xmlComponentMissingExtendsAttribute) {
                this.addMissingExtends(diagnostic);
            }
            else if (diagnostic.code === DiagnosticMessages_1.DiagnosticCodeMap.voidFunctionMayNotReturnValue) {
                this.addVoidFunctionReturnActions(diagnostic);
            }
            else if (diagnostic.code === DiagnosticMessages_1.DiagnosticCodeMap.nonVoidFunctionMustReturnValue) {
                this.addNonVoidFunctionReturnActions(diagnostic);
            }
        }
    }
    /**
     * Generic import suggestion function. Shouldn't be called directly from the main loop, but instead called by more specific diagnostic handlers
     */
    suggestImports(diagnostic, key, files) {
        var _a, _b, _c;
        //skip if we already have this suggestion
        if (this.suggestedImports.has(key)) {
            return;
        }
        this.suggestedImports.add(key);
        const importStatements = this.event.file.parser.references.importStatements;
        //find the position of the first import statement, or the top of the file if there is none
        const insertPosition = (_c = (_b = (_a = importStatements[importStatements.length - 1]) === null || _a === void 0 ? void 0 : _a.importToken.range) === null || _b === void 0 ? void 0 : _b.start) !== null && _c !== void 0 ? _c : util_1.util.createPosition(0, 0);
        //find all files that reference this function
        for (const file of files) {
            const pkgPath = util_1.util.getRokuPkgPath(file.pkgPath);
            this.event.codeActions.push(CodeActionUtil_1.codeActionUtil.createCodeAction({
                title: `import "${pkgPath}"`,
                diagnostics: [diagnostic],
                isPreferred: false,
                kind: vscode_languageserver_1.CodeActionKind.QuickFix,
                changes: [{
                        type: 'insert',
                        filePath: this.event.file.srcPath,
                        position: insertPosition,
                        newText: `import "${pkgPath}"\n`
                    }]
            }));
        }
    }
    suggestCannotFindName(diagnostic) {
        var _a;
        //skip if not a BrighterScript file
        if (diagnostic.file.parseMode !== Parser_1.ParseMode.BrighterScript) {
            return;
        }
        const lowerName = ((_a = diagnostic.data.fullName) !== null && _a !== void 0 ? _a : diagnostic.data.name).toLowerCase();
        this.suggestImports(diagnostic, lowerName, [
            ...this.event.file.program.findFilesForFunction(lowerName),
            ...this.event.file.program.findFilesForClass(lowerName),
            ...this.event.file.program.findFilesForNamespace(lowerName),
            ...this.event.file.program.findFilesForEnum(lowerName)
        ]);
    }
    suggestClassImports(diagnostic) {
        //skip if not a BrighterScript file
        if (diagnostic.file.parseMode !== Parser_1.ParseMode.BrighterScript) {
            return;
        }
        const lowerClassName = diagnostic.data.className.toLowerCase();
        this.suggestImports(diagnostic, lowerClassName, this.event.file.program.findFilesForClass(lowerClassName));
    }
    addMissingExtends(diagnostic) {
        var _a;
        const srcPath = this.event.file.srcPath;
        const { component } = this.event.file.parser.ast;
        //inject new attribute after the final attribute, or after the `<component` if there are no attributes
        const pos = ((_a = component.attributes[component.attributes.length - 1]) !== null && _a !== void 0 ? _a : component.tag).range.end;
        this.event.codeActions.push(CodeActionUtil_1.codeActionUtil.createCodeAction({
            title: `Extend "Group"`,
            diagnostics: [diagnostic],
            isPreferred: true,
            kind: vscode_languageserver_1.CodeActionKind.QuickFix,
            changes: [{
                    type: 'insert',
                    filePath: srcPath,
                    position: pos,
                    newText: ' extends="Group"'
                }]
        }));
        this.event.codeActions.push(CodeActionUtil_1.codeActionUtil.createCodeAction({
            title: `Extend "Task"`,
            diagnostics: [diagnostic],
            kind: vscode_languageserver_1.CodeActionKind.QuickFix,
            changes: [{
                    type: 'insert',
                    filePath: srcPath,
                    position: pos,
                    newText: ' extends="Task"'
                }]
        }));
        this.event.codeActions.push(CodeActionUtil_1.codeActionUtil.createCodeAction({
            title: `Extend "ContentNode"`,
            diagnostics: [diagnostic],
            kind: vscode_languageserver_1.CodeActionKind.QuickFix,
            changes: [{
                    type: 'insert',
                    filePath: srcPath,
                    position: pos,
                    newText: ' extends="ContentNode"'
                }]
        }));
    }
    addVoidFunctionReturnActions(diagnostic) {
        var _a, _b, _c, _d;
        this.event.codeActions.push(CodeActionUtil_1.codeActionUtil.createCodeAction({
            title: `Remove return value`,
            diagnostics: [diagnostic],
            kind: vscode_languageserver_1.CodeActionKind.QuickFix,
            changes: [{
                    type: 'delete',
                    filePath: this.event.file.srcPath,
                    range: util_1.util.createRange(diagnostic.range.start.line, diagnostic.range.start.character + 'return'.length, diagnostic.range.end.line, diagnostic.range.end.character)
                }]
        }));
        if ((0, reflection_1.isBrsFile)(this.event.file)) {
            const expression = this.event.file.getClosestExpression(diagnostic.range.start);
            const func = expression.findAncestor(reflection_1.isFunctionExpression);
            //if we're in a sub and we do not have a return type, suggest converting to a function
            if (func.functionType.kind === TokenKind_1.TokenKind.Sub && !func.returnTypeToken) {
                //find the first function in a file that uses the `function` keyword
                const referenceFunction = this.event.file.parser.ast.findChild((node) => {
                    return (0, reflection_1.isFunctionExpression)(node) && node.functionType.kind === TokenKind_1.TokenKind.Function;
                });
                const functionTypeText = (_a = referenceFunction === null || referenceFunction === void 0 ? void 0 : referenceFunction.functionType.text) !== null && _a !== void 0 ? _a : 'function';
                const endFunctionTypeText = (_c = (_b = referenceFunction === null || referenceFunction === void 0 ? void 0 : referenceFunction.end) === null || _b === void 0 ? void 0 : _b.text) !== null && _c !== void 0 ? _c : 'end function';
                this.event.codeActions.push(CodeActionUtil_1.codeActionUtil.createCodeAction({
                    title: `Convert ${func.functionType.text} to ${functionTypeText}`,
                    diagnostics: [diagnostic],
                    kind: vscode_languageserver_1.CodeActionKind.QuickFix,
                    changes: [
                        //function
                        {
                            type: 'replace',
                            filePath: this.event.file.srcPath,
                            range: func.functionType.range,
                            newText: functionTypeText
                        },
                        //end function
                        {
                            type: 'replace',
                            filePath: this.event.file.srcPath,
                            range: func.end.range,
                            newText: endFunctionTypeText
                        }
                    ]
                }));
            }
            //function `as void` return type. Suggest removing the return type
            if (func.functionType.kind === TokenKind_1.TokenKind.Function && ((_d = func.returnTypeToken) === null || _d === void 0 ? void 0 : _d.kind) === TokenKind_1.TokenKind.Void) {
                this.event.codeActions.push(CodeActionUtil_1.codeActionUtil.createCodeAction({
                    title: `Remove return type from function declaration`,
                    diagnostics: [diagnostic],
                    kind: vscode_languageserver_1.CodeActionKind.QuickFix,
                    changes: [{
                            type: 'delete',
                            filePath: this.event.file.srcPath,
                            // )| as void|
                            range: util_1.util.createRange(func.rightParen.range.start.line, func.rightParen.range.start.character + 1, func.returnTypeToken.range.end.line, func.returnTypeToken.range.end.character)
                        }]
                }));
            }
        }
    }
    addNonVoidFunctionReturnActions(diagnostic) {
        var _a;
        if ((0, reflection_1.isBrsFile)(this.event.file)) {
            const expression = this.event.file.getClosestExpression(diagnostic.range.start);
            const func = expression.findAncestor(reflection_1.isFunctionExpression);
            //`sub as <non-void type>`, suggest removing the return type
            if (func.functionType.kind === TokenKind_1.TokenKind.Sub && func.returnTypeToken && ((_a = func.returnTypeToken) === null || _a === void 0 ? void 0 : _a.kind) !== TokenKind_1.TokenKind.Void) {
                this.event.codeActions.push(CodeActionUtil_1.codeActionUtil.createCodeAction({
                    title: `Remove return type from sub declaration`,
                    diagnostics: [diagnostic],
                    kind: vscode_languageserver_1.CodeActionKind.QuickFix,
                    changes: [{
                            type: 'delete',
                            filePath: this.event.file.srcPath,
                            // )| as void|
                            range: util_1.util.createRange(func.rightParen.range.start.line, func.rightParen.range.start.character + 1, func.returnTypeToken.range.end.line, func.returnTypeToken.range.end.character)
                        }]
                }));
            }
            //function with no return type.
            if (func.functionType.kind === TokenKind_1.TokenKind.Function && !func.returnTypeToken) {
                //find tokens for `as` and `void` in the file if possible
                let asText;
                let voidText;
                let subText;
                let endSubText;
                for (const token of this.event.file.parser.tokens) {
                    if (asText && voidText && subText && endSubText) {
                        break;
                    }
                    if ((token === null || token === void 0 ? void 0 : token.kind) === TokenKind_1.TokenKind.As) {
                        asText = token === null || token === void 0 ? void 0 : token.text;
                    }
                    else if ((token === null || token === void 0 ? void 0 : token.kind) === TokenKind_1.TokenKind.Void) {
                        voidText = token === null || token === void 0 ? void 0 : token.text;
                    }
                    else if ((token === null || token === void 0 ? void 0 : token.kind) === TokenKind_1.TokenKind.Sub) {
                        subText = token === null || token === void 0 ? void 0 : token.text;
                    }
                    else if ((token === null || token === void 0 ? void 0 : token.kind) === TokenKind_1.TokenKind.EndSub) {
                        endSubText = token === null || token === void 0 ? void 0 : token.text;
                    }
                }
                //suggest converting to `as void`
                this.event.codeActions.push(CodeActionUtil_1.codeActionUtil.createCodeAction({
                    title: `Add void return type to function declaration`,
                    diagnostics: [diagnostic],
                    kind: vscode_languageserver_1.CodeActionKind.QuickFix,
                    changes: [{
                            type: 'insert',
                            filePath: this.event.file.srcPath,
                            position: func.rightParen.range.end,
                            newText: ` ${asText !== null && asText !== void 0 ? asText : 'as'} ${voidText !== null && voidText !== void 0 ? voidText : 'void'}`
                        }]
                }));
                //suggest converting to sub
                this.event.codeActions.push(CodeActionUtil_1.codeActionUtil.createCodeAction({
                    title: `Convert function to sub`,
                    diagnostics: [diagnostic],
                    kind: vscode_languageserver_1.CodeActionKind.QuickFix,
                    changes: [{
                            type: 'replace',
                            filePath: this.event.file.srcPath,
                            range: func.functionType.range,
                            newText: subText !== null && subText !== void 0 ? subText : 'sub'
                        }, {
                            type: 'replace',
                            filePath: this.event.file.srcPath,
                            range: func.end.range,
                            newText: endSubText !== null && endSubText !== void 0 ? endSubText : 'end sub'
                        }]
                }));
            }
        }
    }
}
exports.CodeActionsProcessor = CodeActionsProcessor;
//# sourceMappingURL=CodeActionsProcessor.js.map
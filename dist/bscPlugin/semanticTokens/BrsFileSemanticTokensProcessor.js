"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrsFileSemanticTokensProcessor = void 0;
const vscode_languageserver_protocol_1 = require("vscode-languageserver-protocol");
const vscode_languageserver_protocol_2 = require("vscode-languageserver-protocol");
const reflection_1 = require("../../astUtils/reflection");
const Parser_1 = require("../../parser/Parser");
const util_1 = require("../../util");
class BrsFileSemanticTokensProcessor {
    constructor(event) {
        this.event = event;
    }
    process() {
        this.handleClasses();
        this.handleConstDeclarations();
        this.iterateNodes();
    }
    handleConstDeclarations() {
        for (const stmt of this.event.file.parser.references.constStatements) {
            this.addToken(stmt.tokens.name, vscode_languageserver_protocol_2.SemanticTokenTypes.variable, [vscode_languageserver_protocol_1.SemanticTokenModifiers.readonly, vscode_languageserver_protocol_1.SemanticTokenModifiers.static]);
        }
    }
    handleClasses() {
        const classes = [];
        //classes used in function param types
        for (const func of this.event.file.parser.references.functionExpressions) {
            for (const parm of func.parameters) {
                if ((0, reflection_1.isCustomType)(parm.type)) {
                    const namespace = parm.findAncestor(reflection_1.isNamespaceStatement);
                    classes.push({
                        className: parm.typeToken.text,
                        namespaceName: namespace === null || namespace === void 0 ? void 0 : namespace.getName(Parser_1.ParseMode.BrighterScript),
                        range: parm.typeToken.range
                    });
                }
            }
        }
        for (const cls of classes) {
            if (cls.className.length > 0 &&
                //only highlight classes that are in scope
                this.event.scopes.some(x => x.hasClass(cls.className, cls.namespaceName))) {
                const tokens = util_1.default.splitGetRange('.', cls.className, cls.range);
                this.addTokens(tokens.reverse(), vscode_languageserver_protocol_2.SemanticTokenTypes.class, vscode_languageserver_protocol_2.SemanticTokenTypes.namespace);
            }
        }
    }
    /**
     * Add tokens for each locatable item in the list.
     * Each locatable is paired with a token type. If there are more locatables than token types, all remaining locatables are given the final token type
     */
    addTokens(locatables, ...semanticTokenTypes) {
        var _a;
        for (let i = 0; i < locatables.length; i++) {
            const locatable = locatables[i];
            //skip items that don't have a location
            if (locatable === null || locatable === void 0 ? void 0 : locatable.range) {
                this.addToken(locatables[i], 
                //use the type at the index, or the last type if missing
                (_a = semanticTokenTypes[i]) !== null && _a !== void 0 ? _a : semanticTokenTypes[semanticTokenTypes.length - 1]);
            }
        }
    }
    addToken(locatable, type, modifiers = []) {
        this.event.semanticTokens.push({
            range: locatable.range,
            tokenType: type,
            tokenModifiers: modifiers
        });
    }
    iterateNodes() {
        var _a, _b;
        const scope = this.event.scopes[0];
        //if this file has no scopes, there's nothing else we can do about this
        if (!scope) {
            return;
        }
        const nodes = [
            ...this.event.file.parser.references.expressions,
            //make a new VariableExpression to wrap the name. This is a hack, we could probably do it better
            ...this.event.file.parser.references.assignmentStatements,
            ...this.event.file.parser.references.functionExpressions.map(x => x.parameters).flat()
        ];
        for (let node of nodes) {
            //lift the callee from call expressions to handle namespaced function calls
            if ((0, reflection_1.isCallExpression)(node)) {
                node = node.callee;
            }
            else if ((0, reflection_1.isNewExpression)(node)) {
                node = node.call.callee;
            }
            const containingNamespaceNameLower = (_a = node.findAncestor(reflection_1.isNamespaceStatement)) === null || _a === void 0 ? void 0 : _a.getName(Parser_1.ParseMode.BrighterScript).toLowerCase();
            const tokens = util_1.default.getAllDottedGetParts(node);
            const processedNames = [];
            for (const token of tokens !== null && tokens !== void 0 ? tokens : []) {
                processedNames.push((_b = token.text) === null || _b === void 0 ? void 0 : _b.toLowerCase());
                const entityName = processedNames.join('.');
                if (scope.getEnumMemberFileLink(entityName, containingNamespaceNameLower)) {
                    this.addToken(token, vscode_languageserver_protocol_2.SemanticTokenTypes.enumMember);
                }
                else if (scope.getEnum(entityName, containingNamespaceNameLower)) {
                    this.addToken(token, vscode_languageserver_protocol_2.SemanticTokenTypes.enum);
                }
                else if (scope.getClass(entityName, containingNamespaceNameLower)) {
                    this.addToken(token, vscode_languageserver_protocol_2.SemanticTokenTypes.class);
                }
                else if (scope.getCallableByName(entityName)) {
                    this.addToken(token, vscode_languageserver_protocol_2.SemanticTokenTypes.function);
                }
                else if (scope.getNamespace(entityName, containingNamespaceNameLower)) {
                    this.addToken(token, vscode_languageserver_protocol_2.SemanticTokenTypes.namespace);
                }
                else if (scope.getConstFileLink(entityName, containingNamespaceNameLower)) {
                    this.addToken(token, vscode_languageserver_protocol_2.SemanticTokenTypes.variable, [vscode_languageserver_protocol_1.SemanticTokenModifiers.readonly, vscode_languageserver_protocol_1.SemanticTokenModifiers.static]);
                }
            }
        }
    }
}
exports.BrsFileSemanticTokensProcessor = BrsFileSemanticTokensProcessor;
//# sourceMappingURL=BrsFileSemanticTokensProcessor.js.map
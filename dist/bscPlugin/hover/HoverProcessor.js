"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HoverProcessor = void 0;
const reflection_1 = require("../../astUtils/reflection");
const TokenKind_1 = require("../../lexer/TokenKind");
const BrsTranspileState_1 = require("../../parser/BrsTranspileState");
const Parser_1 = require("../../parser/Parser");
const util_1 = require("../../util");
class HoverProcessor {
    constructor(event) {
        this.event = event;
    }
    process() {
        let hover;
        if ((0, reflection_1.isBrsFile)(this.event.file)) {
            hover = this.getBrsFileHover(this.event.file);
        }
        else if ((0, reflection_1.isXmlFile)(this.event.file)) {
            hover = this.getXmlFileHover(this.event.file);
        }
        //if we got a result, "return" it
        if (hover) {
            //assign the hover to the event
            this.event.hovers.push(hover);
        }
    }
    buildContentsWithDocs(text, startingToken) {
        const parts = [text];
        const docs = this.getTokenDocumentation(this.event.file.parser.tokens, startingToken);
        if (docs) {
            parts.push('***', docs);
        }
        return parts.join('\n');
    }
    getBrsFileHover(file) {
        var _a, _b, _c, _d;
        const scope = this.event.scopes[0];
        const fence = (code) => util_1.default.mdFence(code, 'brightscript');
        //get the token at the position
        let token = file.getTokenAt(this.event.position);
        let hoverTokenTypes = [
            TokenKind_1.TokenKind.Identifier,
            TokenKind_1.TokenKind.Function,
            TokenKind_1.TokenKind.EndFunction,
            TokenKind_1.TokenKind.Sub,
            TokenKind_1.TokenKind.EndSub
        ];
        //throw out invalid tokens and the wrong kind of tokens
        if (!token || !hoverTokenTypes.includes(token.kind)) {
            return undefined;
        }
        const expression = file.getClosestExpression(this.event.position);
        if (expression === null || expression === void 0 ? void 0 : expression.range) {
            let containingNamespace = (_a = file.getNamespaceStatementForPosition(expression.range.start)) === null || _a === void 0 ? void 0 : _a.getName(Parser_1.ParseMode.BrighterScript);
            const fullName = (_b = util_1.default.getAllDottedGetParts(expression)) === null || _b === void 0 ? void 0 : _b.map(x => x.text).join('.');
            //find a constant with this name
            const constant = scope === null || scope === void 0 ? void 0 : scope.getConstFileLink(fullName, containingNamespace);
            if (constant) {
                const constantValue = util_1.default.sourceNodeFromTranspileResult(null, null, null, constant.item.value.transpile(new BrsTranspileState_1.BrsTranspileState(file))).toString();
                return {
                    contents: this.buildContentsWithDocs(fence(`const ${constant.item.fullName} = ${constantValue}`), constant.item.tokens.const),
                    range: token.range
                };
            }
        }
        let lowerTokenText = token.text.toLowerCase();
        //look through local variables first
        {
            //get the function scope for this position (if exists)
            let functionScope = file.getFunctionScopeAtPosition(this.event.position);
            if (functionScope) {
                //find any variable with this name
                for (const varDeclaration of functionScope.variableDeclarations) {
                    //we found a variable declaration with this token text!
                    if (varDeclaration.name.toLowerCase() === lowerTokenText) {
                        let typeText;
                        if ((0, reflection_1.isFunctionType)(varDeclaration.type)) {
                            typeText = varDeclaration.type.toString();
                        }
                        else {
                            typeText = `${varDeclaration.name} as ${varDeclaration.type.toString()}`;
                        }
                        return {
                            range: token.range,
                            //append the variable name to the front for scope
                            contents: fence(typeText)
                        };
                    }
                }
                for (const labelStatement of functionScope.labelStatements) {
                    if (labelStatement.name.toLocaleLowerCase() === lowerTokenText) {
                        return {
                            range: token.range,
                            contents: fence(`${labelStatement.name}: label`)
                        };
                    }
                }
            }
        }
        //look through all callables in relevant scopes
        for (let scope of this.event.scopes) {
            let callable = scope.getCallableByName(lowerTokenText);
            if (callable) {
                return {
                    range: token.range,
                    contents: this.buildContentsWithDocs(fence(callable.type.toString()), (_d = (_c = callable.functionStatement) === null || _c === void 0 ? void 0 : _c.func) === null || _d === void 0 ? void 0 : _d.functionType)
                };
            }
        }
    }
    /**
     * Combine all the documentation found before a token (i.e. comment tokens)
     */
    getTokenDocumentation(tokens, token) {
        const comments = [];
        if (!token) {
            return undefined;
        }
        const idx = tokens === null || tokens === void 0 ? void 0 : tokens.indexOf(token);
        if (!idx || idx === -1) {
            return undefined;
        }
        for (let i = idx - 1; i >= 0; i--) {
            const token = tokens[i];
            //skip whitespace and newline chars
            if (token.kind === TokenKind_1.TokenKind.Comment) {
                comments.push(token);
            }
            else if (token.kind === TokenKind_1.TokenKind.Newline || token.kind === TokenKind_1.TokenKind.Whitespace) {
                //skip these tokens
                continue;
                //any other token means there are no more comments
            }
            else {
                break;
            }
        }
        if (comments.length > 0) {
            return comments.reverse().map(x => x.text.replace(/^('|rem)/i, '')).join('\n');
        }
    }
    getXmlFileHover(file) {
        //TODO add xml hovers
        return undefined;
    }
}
exports.HoverProcessor = HoverProcessor;
//# sourceMappingURL=HoverProcessor.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignatureHelpUtil = void 0;
const vscode_languageserver_protocol_1 = require("vscode-languageserver-protocol");
const reflection_1 = require("../astUtils/reflection");
const TokenKind_1 = require("../lexer/TokenKind");
const Parser_1 = require("../parser/Parser");
const CallExpressionInfo_1 = require("./CallExpressionInfo");
const util_1 = require("../util");
class SignatureHelpUtil {
    getSignatureHelpItems(callExpressionInfo) {
        let signatureHelpItems = [];
        let file = callExpressionInfo.file;
        let dotPart = callExpressionInfo.dotPart;
        let name = callExpressionInfo.name;
        let results = new Map();
        switch (callExpressionInfo.type) {
            case CallExpressionInfo_1.CallExpressionType.namespaceCall:
                signatureHelpItems = file.program.getStatementsByName(name, file, dotPart).map((fileLink) => this.getSignatureHelpForStatement(fileLink, dotPart));
                break;
            case CallExpressionInfo_1.CallExpressionType.myClassCall:
                let statement = file.getClassMethod(callExpressionInfo.myClass, name, true);
                if (statement) {
                    signatureHelpItems = [this.getSignatureHelpForStatement({ item: statement, file: file })];
                }
                break;
            case CallExpressionInfo_1.CallExpressionType.otherClassCall:
                signatureHelpItems = file.program.getStatementsByName(name, file).filter((fileLink) => (0, reflection_1.isClassStatement)(fileLink.item.parent)).map((fileLink) => this.getSignatureHelpForStatement(fileLink));
                break;
            case CallExpressionInfo_1.CallExpressionType.callFunc:
                // must be from some call func interface method
                signatureHelpItems = [];
                for (const scope of file.program.getScopes().filter((s) => (0, reflection_1.isXmlScope)(s))) {
                    signatureHelpItems.push(...file.program.getStatementsForXmlFile(scope, name).map((fileLink) => this.getSignatureHelpForStatement(fileLink)));
                }
                break;
            case CallExpressionInfo_1.CallExpressionType.call:
                signatureHelpItems = file.program.getStatementsByName(name, file).map((fileLink) => this.getSignatureHelpForStatement(fileLink));
                break;
            case CallExpressionInfo_1.CallExpressionType.constructorCall:
                let classItem = file.getClassFileLink(dotPart ? `${dotPart}.${name}` : name);
                let constructorSignatureHelp = this.getClassSignatureHelp(classItem);
                if (constructorSignatureHelp) {
                    signatureHelpItems.push(constructorSignatureHelp);
                }
                break;
            default:
        }
        for (let sigHelp of signatureHelpItems) {
            if (!results.has[sigHelp.key]) {
                sigHelp.index = callExpressionInfo.parameterIndex;
                results.set(sigHelp.key, sigHelp);
            }
        }
        return [...results.values()];
    }
    getSignatureHelpForStatement(fileLink, namespaceName) {
        let statement = fileLink.item;
        let file = fileLink.file;
        if (!(0, reflection_1.isFunctionStatement)(statement) && !(0, reflection_1.isMethodStatement)(statement)) {
            return undefined;
        }
        const func = statement.func;
        const funcStartPosition = func.range.start;
        // Get function comments in reverse order
        let currentToken = file.getTokenAt(funcStartPosition);
        let functionComments = [];
        while (currentToken) {
            currentToken = file.getPreviousToken(currentToken);
            if (!currentToken) {
                break;
            }
            if (currentToken.range.start.line + 1 < funcStartPosition.line) {
                if (functionComments.length === 0) {
                    break;
                }
            }
            const kind = currentToken.kind;
            if (kind === TokenKind_1.TokenKind.Comment) {
                // Strip off common leading characters to make it easier to read
                const commentText = currentToken.text.replace(/^[' *\/]+/, '');
                functionComments.unshift(commentText);
            }
            else if (kind === TokenKind_1.TokenKind.Newline) {
                if (functionComments.length === 0) {
                    continue;
                }
                // if we already had a new line as the last token then exit out
                if (functionComments[0] === currentToken.text) {
                    break;
                }
                functionComments.unshift(currentToken.text);
            }
            else {
                break;
            }
        }
        const documentation = functionComments.join('').trim();
        const lines = util_1.util.splitIntoLines(file.fileContents);
        let key = statement.name.text + documentation;
        const params = [];
        for (const param of func.parameters) {
            params.push(vscode_languageserver_protocol_1.ParameterInformation.create(param.name.text));
            key += param.name.text;
        }
        let label = util_1.util.getTextForRange(lines, util_1.util.createRangeFromPositions(func.functionType.range.start, func.body.range.start)).trim();
        if (namespaceName) {
            label = label.replace(/^(sub | function )/gim, `$1${namespaceName}.`);
        }
        const signature = vscode_languageserver_protocol_1.SignatureInformation.create(label, documentation, ...params);
        const index = 1;
        return { key: key, signature: signature, index: index };
    }
    getClassSignatureHelp(fileLink) {
        let file = fileLink.file;
        let classStatement = fileLink.item;
        const classConstructor = file.getClassMethod(classStatement, 'new');
        let sigHelp = classConstructor ? this.getSignatureHelpForStatement({ item: classConstructor, file: file }) : undefined;
        let className = classStatement.getName(Parser_1.ParseMode.BrighterScript);
        if (sigHelp) {
            sigHelp.key = className;
            sigHelp.signature.label = sigHelp.signature.label.replace(/(function|sub) new/, sigHelp.key);
        }
        else {
            sigHelp = {
                key: className,
                signature: vscode_languageserver_protocol_1.SignatureInformation.create(`${className}()`, ''),
                index: 0
            };
        }
        return sigHelp;
    }
}
exports.SignatureHelpUtil = SignatureHelpUtil;
//# sourceMappingURL=SignatureHelpUtil.js.map
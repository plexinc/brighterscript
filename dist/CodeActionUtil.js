"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.codeActionUtil = exports.CodeActionKind = exports.CodeActionUtil = void 0;
const vscode_languageserver_1 = require("vscode-languageserver");
Object.defineProperty(exports, "CodeActionKind", { enumerable: true, get: function () { return vscode_languageserver_1.CodeActionKind; } });
const vscode_uri_1 = require("vscode-uri");
class CodeActionUtil {
    createCodeAction(obj) {
        const edit = {
            changes: {}
        };
        for (const change of obj.changes) {
            const uri = vscode_uri_1.URI.file(change.filePath).toString();
            //create the edit changes array for this uri
            if (!edit.changes[uri]) {
                edit.changes[uri] = [];
            }
            if (change.type === 'insert') {
                edit.changes[uri].push(vscode_languageserver_1.TextEdit.insert(change.position, change.newText));
            }
            else if (change.type === 'replace') {
                edit.changes[uri].push(vscode_languageserver_1.TextEdit.replace(change.range, change.newText));
            }
            else if (change.type === 'delete') {
                edit.changes[uri].push(vscode_languageserver_1.TextEdit.del(change.range));
            }
        }
        const action = vscode_languageserver_1.CodeAction.create(obj.title, edit, obj.kind);
        action.isPreferred = obj.isPreferred;
        action.diagnostics = this.serializableDiagnostics(obj.diagnostics);
        return action;
    }
    serializableDiagnostics(diagnostics) {
        return diagnostics === null || diagnostics === void 0 ? void 0 : diagnostics.map(({ range, severity, code, source, message, relatedInformation }) => ({
            range: range,
            severity: severity,
            source: source,
            code: code,
            message: message,
            relatedInformation: relatedInformation
        }));
    }
}
exports.CodeActionUtil = CodeActionUtil;
exports.codeActionUtil = new CodeActionUtil();
//# sourceMappingURL=CodeActionUtil.js.map
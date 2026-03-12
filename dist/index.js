"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceMapConsumer = exports.SourceNode = exports.URI = exports.CodeDescription = exports.CodeAction = exports.SemanticTokenTypes = exports.DiagnosticTag = exports.DiagnosticSeverity = exports.DiagnosticRelatedInformation = exports.CancellationTokenSource = exports.CancellationToken = exports.Position = exports.Location = exports.Range = exports.Diagnostic = void 0;
__exportStar(require("./ProgramBuilder"), exports);
__exportStar(require("./Program"), exports);
__exportStar(require("./Scope"), exports);
__exportStar(require("./files/BrsFile"), exports);
__exportStar(require("./files/XmlFile"), exports);
__exportStar(require("./util"), exports);
__exportStar(require("./Watcher"), exports);
__exportStar(require("./interfaces"), exports);
__exportStar(require("./LanguageServer"), exports);
__exportStar(require("./XmlScope"), exports);
__exportStar(require("./lexer/TokenKind"), exports);
__exportStar(require("./lexer/Token"), exports);
__exportStar(require("./lexer/Lexer"), exports);
__exportStar(require("./parser/Parser"), exports);
__exportStar(require("./parser/AstNode"), exports);
__exportStar(require("./parser/Expression"), exports);
__exportStar(require("./parser/Statement"), exports);
__exportStar(require("./BsConfig"), exports);
__exportStar(require("./deferred"), exports);
__exportStar(require("./astUtils/visitors"), exports);
__exportStar(require("./astUtils/stackedVisitor"), exports);
__exportStar(require("./astUtils/reflection"), exports);
__exportStar(require("./astUtils/creators"), exports);
__exportStar(require("./astUtils/xml"), exports);
__exportStar(require("./astUtils/AstEditor"), exports);
__exportStar(require("./BusyStatusTracker"), exports);
__exportStar(require("./Logger"), exports);
__exportStar(require("./parser/SGTypes"), exports);
__exportStar(require("./parser/SGParser"), exports);
__exportStar(require("./CodeActionUtil"), exports);
__exportStar(require("./DependencyGraph"), exports);
__exportStar(require("./PluginInterface"), exports);
// convenience exports from related libraries
var vscode_languageserver_1 = require("vscode-languageserver");
Object.defineProperty(exports, "Diagnostic", { enumerable: true, get: function () { return vscode_languageserver_1.Diagnostic; } });
Object.defineProperty(exports, "Range", { enumerable: true, get: function () { return vscode_languageserver_1.Range; } });
Object.defineProperty(exports, "Location", { enumerable: true, get: function () { return vscode_languageserver_1.Location; } });
Object.defineProperty(exports, "Position", { enumerable: true, get: function () { return vscode_languageserver_1.Position; } });
Object.defineProperty(exports, "CancellationToken", { enumerable: true, get: function () { return vscode_languageserver_1.CancellationToken; } });
Object.defineProperty(exports, "CancellationTokenSource", { enumerable: true, get: function () { return vscode_languageserver_1.CancellationTokenSource; } });
Object.defineProperty(exports, "DiagnosticRelatedInformation", { enumerable: true, get: function () { return vscode_languageserver_1.DiagnosticRelatedInformation; } });
Object.defineProperty(exports, "DiagnosticSeverity", { enumerable: true, get: function () { return vscode_languageserver_1.DiagnosticSeverity; } });
Object.defineProperty(exports, "DiagnosticTag", { enumerable: true, get: function () { return vscode_languageserver_1.DiagnosticTag; } });
Object.defineProperty(exports, "SemanticTokenTypes", { enumerable: true, get: function () { return vscode_languageserver_1.SemanticTokenTypes; } });
Object.defineProperty(exports, "CodeAction", { enumerable: true, get: function () { return vscode_languageserver_1.CodeAction; } });
Object.defineProperty(exports, "CodeDescription", { enumerable: true, get: function () { return vscode_languageserver_1.CodeDescription; } });
Object.defineProperty(exports, "URI", { enumerable: true, get: function () { return vscode_languageserver_1.URI; } });
var source_map_1 = require("source-map");
Object.defineProperty(exports, "SourceNode", { enumerable: true, get: function () { return source_map_1.SourceNode; } });
Object.defineProperty(exports, "SourceMapConsumer", { enumerable: true, get: function () { return source_map_1.SourceMapConsumer; } });
//# sourceMappingURL=index.js.map
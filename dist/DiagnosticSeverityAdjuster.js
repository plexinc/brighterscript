"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiagnosticSeverityAdjuster = void 0;
const vscode_languageserver_protocol_1 = require("vscode-languageserver-protocol");
class DiagnosticSeverityAdjuster {
    adjust(options, diagnostics) {
        const map = this.createSeverityMap(options.diagnosticSeverityOverrides);
        diagnostics.forEach(diagnostic => {
            const code = String(diagnostic.code);
            if (map.has(code)) {
                diagnostic.severity = map.get(code);
            }
        });
    }
    createSeverityMap(diagnosticSeverityOverrides) {
        const map = new Map();
        if (!diagnosticSeverityOverrides) {
            return map;
        }
        Object.keys(diagnosticSeverityOverrides).forEach(key => {
            const value = diagnosticSeverityOverrides[key];
            switch (value) {
                case 'error':
                    map.set(key, vscode_languageserver_protocol_1.DiagnosticSeverity.Error);
                    break;
                case 'warn':
                    map.set(key, vscode_languageserver_protocol_1.DiagnosticSeverity.Warning);
                    break;
                case 'info':
                    map.set(key, vscode_languageserver_protocol_1.DiagnosticSeverity.Information);
                    break;
                case 'hint':
                    map.set(key, vscode_languageserver_protocol_1.DiagnosticSeverity.Hint);
                    break;
            }
        });
        return map;
    }
}
exports.DiagnosticSeverityAdjuster = DiagnosticSeverityAdjuster;
//# sourceMappingURL=DiagnosticSeverityAdjuster.js.map
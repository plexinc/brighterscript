"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageserver_protocol_1 = require("vscode-languageserver-protocol");
const chai_config_spec_1 = require("./chai-config.spec");
const DiagnosticSeverityAdjuster_1 = require("./DiagnosticSeverityAdjuster");
describe('DiagnosticSeverityAdjuster', () => {
    const adjuster = new DiagnosticSeverityAdjuster_1.DiagnosticSeverityAdjuster();
    it('supports empty map', () => {
        const actual = adjuster.createSeverityMap({});
        (0, chai_config_spec_1.expect)(Array.from(actual.keys()).length === 0);
    });
    it('maps strings to enums', () => {
        const actual = adjuster.createSeverityMap({
            'a': 'error',
            'b': 'warn',
            'c': 'info',
            1001: 'hint',
            // @ts-expect-error using invalid key
            'e': 'foo',
            // @ts-expect-error using invalid key
            'f': 42
        });
        (0, chai_config_spec_1.expect)(actual.get('a')).to.equal(vscode_languageserver_protocol_1.DiagnosticSeverity.Error);
        (0, chai_config_spec_1.expect)(actual.get('b')).to.equal(vscode_languageserver_protocol_1.DiagnosticSeverity.Warning);
        (0, chai_config_spec_1.expect)(actual.get('c')).to.equal(vscode_languageserver_protocol_1.DiagnosticSeverity.Information);
        (0, chai_config_spec_1.expect)(actual.get('1001')).to.equal(vscode_languageserver_protocol_1.DiagnosticSeverity.Hint);
        (0, chai_config_spec_1.expect)(actual.get('e')).to.equal(undefined);
        (0, chai_config_spec_1.expect)(actual.get('f')).to.equal(undefined);
    });
    it('adjusts severity', () => {
        const diagnostics = [
            {
                code: 'BSLINT1001',
                severity: vscode_languageserver_protocol_1.DiagnosticSeverity.Error
            }, {
                code: 1001,
                severity: vscode_languageserver_protocol_1.DiagnosticSeverity.Error
            }
        ];
        adjuster.adjust({
            diagnosticSeverityOverrides: {
                'BSLINT1001': 'warn',
                1001: 'info'
            }
        }, diagnostics);
        (0, chai_config_spec_1.expect)(diagnostics[0].severity).to.equal(vscode_languageserver_protocol_1.DiagnosticSeverity.Warning);
        (0, chai_config_spec_1.expect)(diagnostics[1].severity).to.equal(vscode_languageserver_protocol_1.DiagnosticSeverity.Information);
    });
});
//# sourceMappingURL=DiagnosticSeverityAdjuster.spec.js.map
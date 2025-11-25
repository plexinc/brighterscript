"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("./chai-config.spec");
const diagnosticUtils = require("./diagnosticUtils");
const vscode_languageserver_1 = require("vscode-languageserver");
const util_1 = require("./util");
const chalk_1 = require("chalk");
const sinon_1 = require("sinon");
const undent_1 = require("undent");
const testHelpers_spec_1 = require("./testHelpers.spec");
const sinon = (0, sinon_1.createSandbox)();
describe('diagnosticUtils', () => {
    let options;
    beforeEach(() => {
        sinon.restore();
        options = diagnosticUtils.getPrintDiagnosticOptions({});
    });
    afterEach(() => {
        sinon.restore();
    });
    describe('printDiagnostic', () => {
        it('does not crash when range is undefined', () => {
            //print a diagnostic that doesn't have a range...it should not explode
            diagnosticUtils.printDiagnostic(options, vscode_languageserver_1.DiagnosticSeverity.Error, './temp/file.brs', [], {
                message: 'Bad thing happened',
                range: null,
                code: 1234
            });
        });
        it('does not crash when filie path is missing', () => {
            //print a diagnostic that doesn't have a range...it should not explode
            diagnosticUtils.printDiagnostic(options, vscode_languageserver_1.DiagnosticSeverity.Error, undefined, [], {
                message: 'Bad thing happened',
                range: vscode_languageserver_1.Range.create(0, 0, 2, 2),
                code: 1234
            });
        });
        function testPrintDiagnostic(diagnostic, code, expected) {
            let logOutput = '';
            sinon.stub(console, 'log').callsFake((...args) => {
                if (logOutput.length > 0) {
                    logOutput += '\n';
                }
                logOutput += (0, testHelpers_spec_1.stripConsoleColors)(args.join(' '));
            });
            //print a diagnostic that doesn't have a range...it should not explode
            diagnosticUtils.printDiagnostic(options, vscode_languageserver_1.DiagnosticSeverity.Error, undefined, code.split(/\r?\n/g), diagnostic);
            //remove leading and trailing newlines
            logOutput = logOutput.replace(/^[\r\n]*/g, '').replace(/[\r\n]*$/g, '');
            expected = (0, undent_1.default)(logOutput).replace(/^[\r\n]*/g, '').replace(/[\r\n]*$/g, '');
            (0, chai_config_spec_1.expect)(logOutput).to.eql(expected);
        }
        it('handles mixed tabs and spaces', () => {
            testPrintDiagnostic({
                message: 'Bad thing happened',
                range: vscode_languageserver_1.Range.create(0, 5, 0, 18),
                code: 1234
            }, `\t  \t print "hello"`, `
                <unknown file>:1:6 - error BS1234: Bad thing happened
                 1             print "hello"
                 _             ~~~~~~~~~~~~~
            `);
        });
        it('handles only tabs', () => {
            testPrintDiagnostic({
                message: 'Bad thing happened',
                range: vscode_languageserver_1.Range.create(0, 5, 0, 18),
                code: 1234
            }, `\tprint "hello"`, `
                <unknown file>:1:6 - error BS1234: Bad thing happened
                 1      print "hello"
                 _      ~~~~~~~~~~~~~
            `);
        });
        it('handles only spaces', () => {
            testPrintDiagnostic({
                message: 'Bad thing happened',
                range: vscode_languageserver_1.Range.create(0, 5, 0, 18),
                code: 1234
            }, `   print "hello"`, `
                <unknown file>:1:6 - error BS1234: Bad thing happened
                 1     print "hello"
                 _     ~~~~~~~~~~~~~
            `);
        });
    });
    describe('getPrintDiagnosticOptions', () => {
        let options;
        it('prepares cwd value', () => {
            options = diagnosticUtils.getPrintDiagnosticOptions({ cwd: 'cwd' });
            (0, chai_config_spec_1.expect)(options.cwd).to.equal('cwd');
            // default value
            options = diagnosticUtils.getPrintDiagnosticOptions({});
            (0, chai_config_spec_1.expect)(options.cwd).to.equal(process.cwd());
        });
        it('prepares emitFullPaths value', () => {
            options = diagnosticUtils.getPrintDiagnosticOptions({ emitFullPaths: true });
            (0, chai_config_spec_1.expect)(options.emitFullPaths).to.equal(true);
            options = diagnosticUtils.getPrintDiagnosticOptions({ emitFullPaths: false });
            (0, chai_config_spec_1.expect)(options.emitFullPaths).to.equal(false);
            // default value
            options = diagnosticUtils.getPrintDiagnosticOptions({});
            (0, chai_config_spec_1.expect)(options.emitFullPaths).to.equal(false);
        });
        it('maps diagnosticLevel to severityLevel', () => {
            options = diagnosticUtils.getPrintDiagnosticOptions({ diagnosticLevel: 'info' });
            (0, chai_config_spec_1.expect)(options.severityLevel).to.equal(vscode_languageserver_1.DiagnosticSeverity.Information);
            options = diagnosticUtils.getPrintDiagnosticOptions({ diagnosticLevel: 'hint' });
            (0, chai_config_spec_1.expect)(options.severityLevel).to.equal(vscode_languageserver_1.DiagnosticSeverity.Hint);
            options = diagnosticUtils.getPrintDiagnosticOptions({ diagnosticLevel: 'warn' });
            (0, chai_config_spec_1.expect)(options.severityLevel).to.equal(vscode_languageserver_1.DiagnosticSeverity.Warning);
            options = diagnosticUtils.getPrintDiagnosticOptions({ diagnosticLevel: 'error' });
            (0, chai_config_spec_1.expect)(options.severityLevel).to.equal(vscode_languageserver_1.DiagnosticSeverity.Error);
            // default value
            options = diagnosticUtils.getPrintDiagnosticOptions({});
            (0, chai_config_spec_1.expect)(options.severityLevel).to.equal(vscode_languageserver_1.DiagnosticSeverity.Warning);
            options = diagnosticUtils.getPrintDiagnosticOptions({ diagnosticLevel: 'x' });
            (0, chai_config_spec_1.expect)(options.severityLevel).to.equal(vscode_languageserver_1.DiagnosticSeverity.Warning);
        });
        it('prepares the include map', () => {
            options = diagnosticUtils.getPrintDiagnosticOptions({ diagnosticLevel: 'info' });
            (0, chai_config_spec_1.expect)(options.includeDiagnostic).to.deep.equal({
                [vscode_languageserver_1.DiagnosticSeverity.Information]: true,
                [vscode_languageserver_1.DiagnosticSeverity.Hint]: true,
                [vscode_languageserver_1.DiagnosticSeverity.Warning]: true,
                [vscode_languageserver_1.DiagnosticSeverity.Error]: true
            });
            options = diagnosticUtils.getPrintDiagnosticOptions({ diagnosticLevel: 'hint' });
            (0, chai_config_spec_1.expect)(options.includeDiagnostic).to.deep.equal({
                [vscode_languageserver_1.DiagnosticSeverity.Hint]: true,
                [vscode_languageserver_1.DiagnosticSeverity.Warning]: true,
                [vscode_languageserver_1.DiagnosticSeverity.Error]: true
            });
            options = diagnosticUtils.getPrintDiagnosticOptions({ diagnosticLevel: 'warn' });
            (0, chai_config_spec_1.expect)(options.includeDiagnostic).to.deep.equal({
                [vscode_languageserver_1.DiagnosticSeverity.Warning]: true,
                [vscode_languageserver_1.DiagnosticSeverity.Error]: true
            });
            options = diagnosticUtils.getPrintDiagnosticOptions({ diagnosticLevel: 'error' });
            (0, chai_config_spec_1.expect)(options.includeDiagnostic).to.deep.equal({
                [vscode_languageserver_1.DiagnosticSeverity.Error]: true
            });
        });
    });
    describe('getDiagnosticSquiggly', () => {
        it('works for normal cases', () => {
            (0, chai_config_spec_1.expect)(diagnosticUtils.getDiagnosticSquigglyText('asdf', 0, 4)).to.equal('~~~~');
        });
        it('highlights whole line if no range', () => {
            (0, chai_config_spec_1.expect)(diagnosticUtils.getDiagnosticSquigglyText(' asdf ', undefined, undefined)).to.equal('~~~~~~');
        });
        it('returns empty string when no line is found', () => {
            (0, chai_config_spec_1.expect)(diagnosticUtils.getDiagnosticSquigglyText('', 0, 10)).to.equal('');
            (0, chai_config_spec_1.expect)(diagnosticUtils.getDiagnosticSquigglyText(undefined, 0, 10)).to.equal('');
        });
        it('supports diagnostic not at start of line', () => {
            (0, chai_config_spec_1.expect)(diagnosticUtils.getDiagnosticSquigglyText('  asdf', 2, 6)).to.equal('  ~~~~');
        });
        it('supports diagnostic that does not finish at end of line', () => {
            (0, chai_config_spec_1.expect)(diagnosticUtils.getDiagnosticSquigglyText('asdf  ', 0, 4)).to.equal('~~~~  ');
        });
        it('supports diagnostic with space on both sides', () => {
            (0, chai_config_spec_1.expect)(diagnosticUtils.getDiagnosticSquigglyText('  asdf  ', 2, 6)).to.equal('  ~~~~  ');
        });
        it('handles diagnostic that starts and stops on the same position', () => {
            (0, chai_config_spec_1.expect)(diagnosticUtils.getDiagnosticSquigglyText('abcde', 2, 2)).to.equal('~~~~~');
        });
        it('handles single-character diagnostic', () => {
            (0, chai_config_spec_1.expect)(diagnosticUtils.getDiagnosticSquigglyText('abcde', 2, 3)).to.equal('  ~  ');
        });
        it('handles diagnostics that are longer than the line', () => {
            (0, chai_config_spec_1.expect)(diagnosticUtils.getDiagnosticSquigglyText('abcde', 0, 10)).to.equal('~~~~~');
            (0, chai_config_spec_1.expect)(diagnosticUtils.getDiagnosticSquigglyText('abcde', 2, 10)).to.equal('  ~~~');
        });
        it('handles Number.MAX_VALUE for end character', () => {
            (0, chai_config_spec_1.expect)(diagnosticUtils.getDiagnosticSquigglyText('abcde', 0, Number.MAX_VALUE)).to.equal('~~~~~');
        });
        it.skip('handles edge cases', () => {
            (0, chai_config_spec_1.expect)(diagnosticUtils.getDiagnosticSquigglyText('end functionasdf', 16, 18)).to.equal('            ~~~~');
        });
    });
    describe('getDiagnosticLine', () => {
        const color = ((text) => text);
        function testGetDiagnosticLine(range, squigglyText, lineLength = 20) {
            (0, chai_config_spec_1.expect)(diagnosticUtils.getDiagnosticLine({ range: range }, '1'.repeat(lineLength), color)).to.eql([
                chalk_1.default.bgWhite(' ' + chalk_1.default.black((range.start.line + 1).toString()) + ' ') + ' ' + '1'.repeat(lineLength),
                chalk_1.default.bgWhite(' ' + chalk_1.default.white(' '.repeat((range.start.line + 1).toString().length)) + ' ') + ' ' + squigglyText.padEnd(lineLength, ' ')
            ].join('\n'));
        }
        it('lines up at beginning of line for single-digit line num', () => {
            testGetDiagnosticLine(util_1.util.createRange(0, 0, 0, 5), '~~~~~');
        });
        it('lines up in middle of line for single-digit line num', () => {
            testGetDiagnosticLine(util_1.util.createRange(0, 5, 0, 10), '     ~~~~~');
        });
        it('lines up at end of line for single-digit line num', () => {
            testGetDiagnosticLine(util_1.util.createRange(0, 5, 0, 10), '     ~~~~~', 10);
        });
        it('lines up at beginning of line for double-digit line num', () => {
            testGetDiagnosticLine(util_1.util.createRange(15, 0, 15, 5), '~~~~~');
        });
        it('lines up in middle of line for double-digit line num', () => {
            testGetDiagnosticLine(util_1.util.createRange(15, 5, 15, 10), '     ~~~~~');
        });
        it('lines up at end of line for double-digit line num', () => {
            testGetDiagnosticLine(util_1.util.createRange(15, 5, 15, 10), '     ~~~~~', 10);
        });
    });
});
//# sourceMappingURL=diagnosticUtils.spec.js.map
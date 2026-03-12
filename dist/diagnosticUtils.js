"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDiagnosticSquigglyText = exports.getDiagnosticLine = exports.printDiagnostic = exports.getPrintDiagnosticOptions = void 0;
const chalk_1 = require("chalk");
const vscode_languageserver_1 = require("vscode-languageserver");
/**
 * Prepare print diagnostic formatting options
 */
function getPrintDiagnosticOptions(options) {
    var _a;
    let cwd = (options === null || options === void 0 ? void 0 : options.cwd) ? options.cwd : process.cwd();
    let emitFullPaths = (options === null || options === void 0 ? void 0 : options.emitFullPaths) === true;
    let diagnosticLevel = (_a = options === null || options === void 0 ? void 0 : options.diagnosticLevel) !== null && _a !== void 0 ? _a : 'warn';
    let diagnosticSeverityMap = {};
    diagnosticSeverityMap.info = vscode_languageserver_1.DiagnosticSeverity.Information;
    diagnosticSeverityMap.hint = vscode_languageserver_1.DiagnosticSeverity.Hint;
    diagnosticSeverityMap.warn = vscode_languageserver_1.DiagnosticSeverity.Warning;
    diagnosticSeverityMap.error = vscode_languageserver_1.DiagnosticSeverity.Error;
    let severityLevel = diagnosticSeverityMap[diagnosticLevel] || vscode_languageserver_1.DiagnosticSeverity.Warning;
    let order = [vscode_languageserver_1.DiagnosticSeverity.Information, vscode_languageserver_1.DiagnosticSeverity.Hint, vscode_languageserver_1.DiagnosticSeverity.Warning, vscode_languageserver_1.DiagnosticSeverity.Error];
    let includeDiagnostic = order.slice(order.indexOf(severityLevel)).reduce((acc, value) => {
        acc[value] = true;
        return acc;
    }, {});
    let typeColor = {};
    typeColor[vscode_languageserver_1.DiagnosticSeverity.Information] = chalk_1.default.blue;
    typeColor[vscode_languageserver_1.DiagnosticSeverity.Hint] = chalk_1.default.green;
    typeColor[vscode_languageserver_1.DiagnosticSeverity.Warning] = chalk_1.default.yellow;
    typeColor[vscode_languageserver_1.DiagnosticSeverity.Error] = chalk_1.default.red;
    let severityTextMap = {};
    severityTextMap[vscode_languageserver_1.DiagnosticSeverity.Information] = 'info';
    severityTextMap[vscode_languageserver_1.DiagnosticSeverity.Hint] = 'hint';
    severityTextMap[vscode_languageserver_1.DiagnosticSeverity.Warning] = 'warning';
    severityTextMap[vscode_languageserver_1.DiagnosticSeverity.Error] = 'error';
    return {
        cwd: cwd,
        emitFullPaths: emitFullPaths,
        severityLevel: severityLevel,
        includeDiagnostic: includeDiagnostic,
        typeColor: typeColor,
        severityTextMap: severityTextMap
    };
}
exports.getPrintDiagnosticOptions = getPrintDiagnosticOptions;
/**
 * Format output of one diagnostic
 */
function printDiagnostic(options, severity, filePath, lines, diagnostic, relatedInformation) {
    var _a, _b, _c, _d, _e;
    let { includeDiagnostic, severityTextMap, typeColor } = options;
    if (!includeDiagnostic[severity]) {
        return;
    }
    let severityText = severityTextMap[severity];
    console.log('');
    console.log(chalk_1.default.cyan(filePath !== null && filePath !== void 0 ? filePath : '<unknown file>') +
        ':' +
        chalk_1.default.yellow(diagnostic.range
            ? (diagnostic.range.start.line + 1) + ':' + (diagnostic.range.start.character + 1)
            : 'line?:col?') +
        ' - ' +
        typeColor[severity](severityText) +
        ' ' +
        chalk_1.default.grey('BS' + diagnostic.code) +
        ': ' +
        chalk_1.default.white(diagnostic.message));
    console.log('');
    //Get the line referenced by the diagnostic. if we couldn't find a line,
    // default to an empty string so it doesn't crash the error printing below
    let diagnosticLine = (_d = lines[(_c = (_b = (_a = diagnostic.range) === null || _a === void 0 ? void 0 : _a.start) === null || _b === void 0 ? void 0 : _b.line) !== null && _c !== void 0 ? _c : -1]) !== null && _d !== void 0 ? _d : '';
    console.log(getDiagnosticLine(diagnostic, diagnosticLine, typeColor[severity]));
    //print related information if present (only first few rows)
    const relatedInfoList = relatedInformation !== null && relatedInformation !== void 0 ? relatedInformation : [];
    let indent = '    ';
    for (let i = 0; i < relatedInfoList.length; i++) {
        let relatedInfo = relatedInfoList[i];
        //only show the first 5 relatedInfo links
        if (i < 5) {
            console.log('');
            console.log(indent, chalk_1.default.cyan((_e = relatedInfo.filePath) !== null && _e !== void 0 ? _e : '<unknown file>') +
                ':' +
                chalk_1.default.yellow(relatedInfo.range
                    ? (relatedInfo.range.start.line + 1) + ':' + (relatedInfo.range.start.character + 1)
                    : 'line?:col?'));
            console.log(indent, relatedInfo.message);
        }
        else {
            console.log('\n', indent, `...and ${relatedInfoList.length - i + 1} more`);
            break;
        }
    }
    console.log('');
}
exports.printDiagnostic = printDiagnostic;
function getDiagnosticLine(diagnostic, diagnosticLine, colorFunction) {
    let result = '';
    //only print the line information if we have some
    if (diagnostic.range && diagnosticLine) {
        const lineNumberText = chalk_1.default.bgWhite(' ' + chalk_1.default.black((diagnostic.range.start.line + 1).toString()) + ' ') + ' ';
        const blankLineNumberText = chalk_1.default.bgWhite(' ' + chalk_1.default.white(' '.repeat((diagnostic.range.start.line + 1).toString().length)) + ' ') + ' ';
        //remove tabs in favor of spaces to make diagnostic printing more consistent
        let leadingText = diagnosticLine.slice(0, diagnostic.range.start.character);
        let leadingTextNormalized = leadingText.replace(/\t/g, '    ');
        let actualText = diagnosticLine.slice(diagnostic.range.start.character, diagnostic.range.end.character);
        let actualTextNormalized = actualText.replace(/\t/g, '    ');
        let startIndex = leadingTextNormalized.length;
        let endIndex = leadingTextNormalized.length + actualTextNormalized.length;
        let diagnosticLineNormalized = diagnosticLine.replace(/\t/g, '    ');
        const squigglyText = getDiagnosticSquigglyText(diagnosticLineNormalized, startIndex, endIndex);
        result +=
            lineNumberText + diagnosticLineNormalized + '\n' +
                blankLineNumberText + colorFunction(squigglyText);
    }
    return result;
}
exports.getDiagnosticLine = getDiagnosticLine;
/**
 * Given a diagnostic, compute the range for the squiggly
 */
function getDiagnosticSquigglyText(line, startCharacter, endCharacter) {
    var _a;
    let squiggle;
    //fill the entire line
    if (
    //there is no range
    typeof startCharacter !== 'number' || typeof endCharacter !== 'number' ||
        //there is no line
        !line ||
        //both positions point to same location
        startCharacter === endCharacter ||
        //the diagnostic starts after the end of the line
        startCharacter >= line.length) {
        squiggle = ''.padStart((_a = line === null || line === void 0 ? void 0 : line.length) !== null && _a !== void 0 ? _a : 0, '~');
    }
    else {
        let endIndex = Math.max(endCharacter, line.length);
        endIndex = endIndex > 0 ? endIndex : 0;
        if ((line === null || line === void 0 ? void 0 : line.length) < endIndex) {
            endIndex = line.length;
        }
        let leadingWhitespaceLength = startCharacter;
        let squiggleLength;
        if (endCharacter === Number.MAX_VALUE) {
            squiggleLength = line.length - leadingWhitespaceLength;
        }
        else {
            squiggleLength = endCharacter - startCharacter;
        }
        let trailingWhitespaceLength = endIndex - endCharacter;
        //opening whitespace
        squiggle =
            ''.padStart(leadingWhitespaceLength, ' ') +
                //squiggle
                ''.padStart(squiggleLength, '~') +
                //trailing whitespace
                ''.padStart(trailingWhitespaceLength, ' ');
        //trim the end of the squiggle so it doesn't go longer than the end of the line
        if (squiggle.length > endIndex) {
            squiggle = squiggle.slice(0, endIndex);
        }
    }
    return squiggle;
}
exports.getDiagnosticSquigglyText = getDiagnosticSquigglyText;
//# sourceMappingURL=diagnosticUtils.js.map
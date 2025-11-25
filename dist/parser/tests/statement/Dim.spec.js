"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../../../chai-config.spec");
const DiagnosticMessages_1 = require("../../../DiagnosticMessages");
const Parser_1 = require("../../Parser");
describe('parser DimStatement', () => {
    it('parses properly', () => {
        validatePass(`Dim c[5]`, 0, 'c', 1);
        validatePass(`Dim c[5, 4]`, 0, 'c', 2);
        validatePass(`Dim c[5, 4, 6]`, 0, 'c', 3);
        validatePass(`Dim requestData[requestList.count()]`, 0, 'requestData', 1);
        validatePass(`Dim requestData[1, requestList.count()]`, 0, 'requestData', 2);
        validatePass(`Dim requestData[1, requestList.count(), 2]`, 0, 'requestData', 3);
        validatePass(`Dim requestData[requestList[2]]`, 0, 'requestData', 1);
        validatePass(`Dim requestData[1, requestList[2]]`, 0, 'requestData', 2);
        validatePass(`Dim requestData[1, requestList[2], 2]`, 0, 'requestData', 3);
        validatePass(`Dim requestData[requestList["2"]]`, 0, 'requestData', 1);
        validatePass(`Dim requestData[1, requestList["2"]]`, 0, 'requestData', 2);
        validatePass(`Dim requestData[1, requestList["2"], 2]`, 0, 'requestData', 3);
        validatePass(`Dim requestData[getValue()]`, 0, 'requestData', 1);
        validatePass(`Dim requestData[getValue(), 2]`, 0, 'requestData', 2);
        validatePass(`Dim requestData[1, getValue(), 2]`, 0, 'requestData', 3);
        validatePass(`Dim requestData[1, getValue({
            key: "value"
        }), 2]`, 0, 'requestData', 3);
    });
    it('flags missing identifier after dim', () => {
        const parser = Parser_1.Parser.parse(`Dim [5]`);
        const dimStatement = parser.ast.statements[0];
        //the statement should still exist and have null identifier
        (0, chai_config_spec_1.expect)(dimStatement).to.exist;
        (0, chai_config_spec_1.expect)(dimStatement.identifier).to.not.exist;
        (0, chai_config_spec_1.expect)(parser.diagnostics.map(x => x.message)).to.include(DiagnosticMessages_1.DiagnosticMessages.expectedIdentifierAfterKeyword('dim').message);
    });
    it('flags missing left bracket', () => {
        const parser = Parser_1.Parser.parse(`Dim c]`);
        const dimStatement = parser.ast.statements[0];
        //the statement should still exist and have null dimensions
        (0, chai_config_spec_1.expect)(dimStatement).to.exist;
        (0, chai_config_spec_1.expect)(dimStatement.openingSquare).to.not.exist;
        (0, chai_config_spec_1.expect)(parser.diagnostics.map(x => x.message)).to.include(DiagnosticMessages_1.DiagnosticMessages.missingLeftSquareBracketAfterDimIdentifier().message);
    });
    it('flags missing right bracket', () => {
        const parser = Parser_1.Parser.parse(`Dim c[5, 5`);
        const dimStatement = parser.ast.statements[0];
        //the statement should still exist and have null dimensions
        (0, chai_config_spec_1.expect)(dimStatement).to.exist;
        (0, chai_config_spec_1.expect)(dimStatement.closingSquare).to.not.exist;
        (0, chai_config_spec_1.expect)(parser.diagnostics.map(x => x.message)).to.include(DiagnosticMessages_1.DiagnosticMessages.missingRightSquareBracketAfterDimIdentifier().message);
    });
    it('flags missing expression(s)', () => {
        const parser = Parser_1.Parser.parse(`Dim c[]`);
        const dimStatement = parser.ast.statements[0];
        //the statement should still exist and have null dimensions
        (0, chai_config_spec_1.expect)(dimStatement).to.exist;
        (0, chai_config_spec_1.expect)(dimStatement.dimensions).to.be.empty;
        (0, chai_config_spec_1.expect)(parser.diagnostics.map(x => x.message)).to.include(DiagnosticMessages_1.DiagnosticMessages.missingExpressionsInDimStatement().message);
    });
});
function validatePass(text, dimStatementIndex, identifierText, dimensionsCount) {
    const parser = Parser_1.Parser.parse(text);
    const dimStatement = parser.ast.statements[dimStatementIndex];
    (0, chai_config_spec_1.expect)(dimStatement).to.exist;
    (0, chai_config_spec_1.expect)(dimStatement.dimToken).to.exist;
    (0, chai_config_spec_1.expect)(dimStatement.identifier).to.exist;
    (0, chai_config_spec_1.expect)(dimStatement.identifier.text).to.equal(identifierText);
    (0, chai_config_spec_1.expect)(dimStatement.openingSquare).to.exist;
    (0, chai_config_spec_1.expect)(dimStatement.dimensions).to.exist;
    (0, chai_config_spec_1.expect)(dimStatement.dimensions.length).to.equal(dimensionsCount);
    (0, chai_config_spec_1.expect)(dimStatement.closingSquare).to.exist;
    (0, chai_config_spec_1.expect)(dimStatement.range).to.exist;
}
//# sourceMappingURL=Dim.spec.js.map
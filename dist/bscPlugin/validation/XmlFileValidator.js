"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XmlFileValidator = void 0;
const DiagnosticMessages_1 = require("../../DiagnosticMessages");
const util_1 = require("../../util");
class XmlFileValidator {
    constructor(event) {
        this.event = event;
    }
    process() {
        util_1.default.validateTooDeepFile(this.event.file);
        if (this.event.file.parser.ast.root) {
            this.validateComponent(this.event.file.parser.ast);
        }
        else {
            //skip empty XML
        }
    }
    validateComponent(ast) {
        const { root, component } = ast;
        if (!component) {
            //not a SG component
            this.event.file.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.xmlComponentMissingComponentDeclaration()), { range: root.range, file: this.event.file }));
            return;
        }
        //component name/extends
        if (!component.name) {
            this.event.file.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.xmlComponentMissingNameAttribute()), { range: component.tag.range, file: this.event.file }));
        }
        if (!component.extends) {
            this.event.file.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.xmlComponentMissingExtendsAttribute()), { range: component.tag.range, file: this.event.file }));
        }
        //catch script imports with same path as the auto-imported codebehind file
        const scriptTagImports = this.event.file.parser.references.scriptTagImports;
        let explicitCodebehindScriptTag = this.event.file.program.options.autoImportComponentScript === true
            ? scriptTagImports.find(x => this.event.file.possibleCodebehindPkgPaths.includes(x.pkgPath))
            : undefined;
        if (explicitCodebehindScriptTag) {
            this.event.file.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.unnecessaryCodebehindScriptImport()), { file: this.event.file, range: explicitCodebehindScriptTag.filePathRange }));
        }
    }
}
exports.XmlFileValidator = XmlFileValidator;
//# sourceMappingURL=XmlFileValidator.js.map
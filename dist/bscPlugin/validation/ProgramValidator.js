"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgramValidator = void 0;
const reflection_1 = require("../../astUtils/reflection");
const DiagnosticMessages_1 = require("../../DiagnosticMessages");
const util_1 = require("../../util");
class ProgramValidator {
    constructor(program) {
        this.program = program;
    }
    process() {
        this.flagScopelessBrsFiles();
    }
    /**
     * Flag any files that are included in 0 scopes.
     */
    flagScopelessBrsFiles() {
        for (const key in this.program.files) {
            const file = this.program.files[key];
            if (
            //if this isn't a brs file, skip
            !(0, reflection_1.isBrsFile)(file) ||
                //if the file is included in at least one scope, skip
                this.program.getFirstScopeForFile(file)) {
                continue;
            }
            this.program.addDiagnostics([Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.fileNotReferencedByAnyOtherFile()), { file: file, range: util_1.default.createRange(0, 0, 0, Number.MAX_VALUE) })]);
        }
    }
}
exports.ProgramValidator = ProgramValidator;
//# sourceMappingURL=ProgramValidator.js.map
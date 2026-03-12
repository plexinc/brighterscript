"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferencesProvider = void 0;
const util_1 = require("../../util");
const visitors_1 = require("../../astUtils/visitors");
const reflection_1 = require("../../astUtils/reflection");
class ReferencesProvider {
    constructor(event) {
        this.event = event;
    }
    process() {
        if ((0, reflection_1.isBrsFile)(this.event.file)) {
            this.brsFileGetReferences(this.event.file);
        }
        else if ((0, reflection_1.isXmlFile)(this.event.file)) {
            this.xmlFileGetReferences(this.event.file);
        }
        return this.event.references;
    }
    /**
     * For a position in a BrsFile, get the location where the token at that position was defined
     */
    brsFileGetReferences(file) {
        const callSiteToken = file.getTokenAt(this.event.position);
        const searchFor = callSiteToken.text.toLowerCase();
        const scopes = this.event.program.getScopesForFile(file);
        for (const scope of scopes) {
            const processedFiles = new Set();
            for (const file of scope.getAllFiles()) {
                if (!(0, reflection_1.isBrsFile)(file) || processedFiles.has(file)) {
                    continue;
                }
                processedFiles.add(file);
                file.ast.walk((0, visitors_1.createVisitor)({
                    AssignmentStatement: (s) => {
                        var _a, _b;
                        if (((_b = (_a = s.name) === null || _a === void 0 ? void 0 : _a.text) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === searchFor) {
                            this.event.references.push(util_1.default.createLocation(util_1.default.pathToUri(file.srcPath), s.name.range));
                        }
                    },
                    VariableExpression: (e) => {
                        if (e.name.text.toLowerCase() === searchFor) {
                            this.event.references.push(util_1.default.createLocation(util_1.default.pathToUri(file.srcPath), e.range));
                        }
                    }
                }), {
                    walkMode: visitors_1.WalkMode.visitAllRecursive
                });
            }
        }
    }
    xmlFileGetReferences(file) {
    }
}
exports.ReferencesProvider = ReferencesProvider;
//# sourceMappingURL=ReferencesProvider.js.map
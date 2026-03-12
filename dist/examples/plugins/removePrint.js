"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reflection_1 = require("../../astUtils/reflection");
const visitors_1 = require("../../astUtils/visitors");
function plugin() {
    return {
        name: 'removePrint',
        beforeFileTranspile: (event) => {
            if ((0, reflection_1.isBrsFile)(event.file)) {
                // visit functions bodies and replace `PrintStatement` nodes with `EmptyStatement`
                for (const func of event.file.parser.references.functionExpressions) {
                    func.body.walk((0, visitors_1.createVisitor)({
                        PrintStatement: (statement) => {
                            event.editor.overrideTranspileResult(statement, '');
                        }
                    }), {
                        walkMode: visitors_1.WalkMode.visitStatements
                    });
                }
            }
        }
    };
}
exports.default = plugin;
//# sourceMappingURL=removePrint.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceSymbolProcessor = void 0;
const reflection_1 = require("../../astUtils/reflection");
const symbolUtils_1 = require("./symbolUtils");
class WorkspaceSymbolProcessor {
    constructor(event) {
        this.event = event;
    }
    process() {
        const results = Object.values(this.event.program.files).map(file => {
            if ((0, reflection_1.isBrsFile)(file)) {
                return this.getBrsFileWorkspaceSymbols(file);
            }
            return [];
        });
        return results.flat();
    }
    getBrsFileWorkspaceSymbols(file) {
        const symbols = (0, symbolUtils_1.getWorkspaceSymbolsFromBrsFile)(file);
        this.event.workspaceSymbols.push(...symbols);
        return this.event.workspaceSymbols;
    }
}
exports.WorkspaceSymbolProcessor = WorkspaceSymbolProcessor;
//# sourceMappingURL=WorkspaceSymbolProcessor.js.map
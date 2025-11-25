"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentSymbolProcessor = void 0;
const reflection_1 = require("../../astUtils/reflection");
const symbolUtils_1 = require("./symbolUtils");
class DocumentSymbolProcessor {
    constructor(event) {
        this.event = event;
    }
    process() {
        if ((0, reflection_1.isBrsFile)(this.event.file)) {
            return this.getBrsFileDocumentSymbols(this.event.file);
        }
    }
    getBrsFileDocumentSymbols(file) {
        const symbols = (0, symbolUtils_1.getDocumentSymbolsFromBrsFile)(file);
        this.event.documentSymbols.push(...symbols);
        return this.event.documentSymbols;
    }
}
exports.DocumentSymbolProcessor = DocumentSymbolProcessor;
//# sourceMappingURL=DocumentSymbolProcessor.js.map
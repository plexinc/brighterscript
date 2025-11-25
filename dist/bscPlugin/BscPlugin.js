"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BscPlugin = void 0;
const reflection_1 = require("../astUtils/reflection");
const CodeActionsProcessor_1 = require("./codeActions/CodeActionsProcessor");
const CompletionsProcessor_1 = require("./completions/CompletionsProcessor");
const DefinitionProvider_1 = require("./definition/DefinitionProvider");
const DocumentSymbolProcessor_1 = require("./symbols/DocumentSymbolProcessor");
const HoverProcessor_1 = require("./hover/HoverProcessor");
const ReferencesProvider_1 = require("./references/ReferencesProvider");
const BrsFileSemanticTokensProcessor_1 = require("./semanticTokens/BrsFileSemanticTokensProcessor");
const BrsFilePreTranspileProcessor_1 = require("./transpile/BrsFilePreTranspileProcessor");
const BrsFileValidator_1 = require("./validation/BrsFileValidator");
const ProgramValidator_1 = require("./validation/ProgramValidator");
const ScopeValidator_1 = require("./validation/ScopeValidator");
const XmlFileValidator_1 = require("./validation/XmlFileValidator");
const WorkspaceSymbolProcessor_1 = require("./symbols/WorkspaceSymbolProcessor");
class BscPlugin {
    constructor() {
        this.name = 'BscPlugin';
        this.scopeValidator = new ScopeValidator_1.ScopeValidator();
    }
    onGetCodeActions(event) {
        new CodeActionsProcessor_1.CodeActionsProcessor(event).process();
    }
    provideHover(event) {
        return new HoverProcessor_1.HoverProcessor(event).process();
    }
    provideDocumentSymbols(event) {
        return new DocumentSymbolProcessor_1.DocumentSymbolProcessor(event).process();
    }
    provideWorkspaceSymbols(event) {
        return new WorkspaceSymbolProcessor_1.WorkspaceSymbolProcessor(event).process();
    }
    provideCompletions(event) {
        new CompletionsProcessor_1.CompletionsProcessor(event).process();
    }
    provideDefinition(event) {
        new DefinitionProvider_1.DefinitionProvider(event).process();
    }
    provideReferences(event) {
        new ReferencesProvider_1.ReferencesProvider(event).process();
    }
    onGetSemanticTokens(event) {
        if ((0, reflection_1.isBrsFile)(event.file)) {
            return new BrsFileSemanticTokensProcessor_1.BrsFileSemanticTokensProcessor(event).process();
        }
    }
    onFileValidate(event) {
        if ((0, reflection_1.isBrsFile)(event.file)) {
            return new BrsFileValidator_1.BrsFileValidator(event).process();
        }
        else if ((0, reflection_1.isXmlFile)(event.file)) {
            return new XmlFileValidator_1.XmlFileValidator(event).process();
        }
    }
    onScopeValidate(event) {
        this.scopeValidator.processEvent(event);
    }
    afterProgramValidate(program) {
        new ProgramValidator_1.ProgramValidator(program).process();
        //release memory once the validation cycle has finished
        this.scopeValidator.reset();
    }
    beforeFileTranspile(event) {
        if ((0, reflection_1.isBrsFile)(event.file)) {
            return new BrsFilePreTranspileProcessor_1.BrsFilePreTranspileProcessor(event).process();
        }
    }
}
exports.BscPlugin = BscPlugin;
//# sourceMappingURL=BscPlugin.js.map
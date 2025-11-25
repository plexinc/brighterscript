"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XmlScope = void 0;
const Scope_1 = require("./Scope");
const DiagnosticMessages_1 = require("./DiagnosticMessages");
const SGTypes_1 = require("./parser/SGTypes");
const DefinitionProvider_1 = require("./bscPlugin/definition/DefinitionProvider");
class XmlScope extends Scope_1.Scope {
    constructor(xmlFile, program) {
        super(xmlFile.pkgPath, program);
        this.xmlFile = xmlFile;
        this.program = program;
    }
    get dependencyGraphKey() {
        return this.xmlFile.dependencyGraphKey;
    }
    /**
     * Get the parent scope of this scope. If we could find the scope for our parentComponent, use that.
     * Otherwise default to global scope
     */
    getParentScope() {
        return this.cache.getOrAdd('parentScope', () => {
            var _a, _b;
            let scope;
            let parentComponentName = (_a = this.xmlFile.parentComponentName) === null || _a === void 0 ? void 0 : _a.text;
            if (parentComponentName) {
                scope = this.program.getComponentScope(parentComponentName);
            }
            if (scope) {
                return scope;
            }
            else {
                return (_b = this.program.globalScope) !== null && _b !== void 0 ? _b : null;
            }
        });
    }
    _validate(callableContainerMap) {
        //validate brs files
        super._validate(callableContainerMap);
        //detect when the child imports a script that its ancestor also imports
        this.diagnosticDetectDuplicateAncestorScriptImports();
        //validate component interface
        this.diagnosticValidateInterface(callableContainerMap);
    }
    diagnosticValidateInterface(callableContainerMap) {
        var _a, _b, _c, _d, _e;
        if (!((_b = (_a = this.xmlFile.parser.ast) === null || _a === void 0 ? void 0 : _a.component) === null || _b === void 0 ? void 0 : _b.api)) {
            return;
        }
        const { api } = this.xmlFile.parser.ast.component;
        //validate functions
        for (const fun of api.functions) {
            const name = fun.name;
            if (!name) {
                this.diagnosticMissingAttribute(fun, 'name');
            }
            else if (!callableContainerMap.has(name.toLowerCase())) {
                this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.xmlFunctionNotFound(name)), { range: (_c = fun.getAttribute('name')) === null || _c === void 0 ? void 0 : _c.value.range, file: this.xmlFile }));
            }
        }
        //validate fields
        for (const field of api.fields) {
            const { id, type, onChange } = field;
            if (!id) {
                this.diagnosticMissingAttribute(field, 'id');
            }
            if (!type) {
                if (!field.alias) {
                    this.diagnosticMissingAttribute(field, 'type');
                }
            }
            else if (!SGTypes_1.SGFieldTypes.includes(type.toLowerCase())) {
                this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.xmlInvalidFieldType(type)), { range: (_d = field.getAttribute('type')) === null || _d === void 0 ? void 0 : _d.value.range, file: this.xmlFile }));
            }
            if (onChange) {
                if (!callableContainerMap.has(onChange.toLowerCase())) {
                    this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.xmlFunctionNotFound(onChange)), { range: (_e = field.getAttribute('onchange')) === null || _e === void 0 ? void 0 : _e.value.range, file: this.xmlFile }));
                }
            }
        }
    }
    diagnosticMissingAttribute(tag, name) {
        const { text, range } = tag.tag;
        this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.xmlTagMissingAttribute(text, name)), { range: range, file: this.xmlFile }));
    }
    /**
     * Detect when a child has imported a script that an ancestor also imported
     */
    diagnosticDetectDuplicateAncestorScriptImports() {
        var _a, _b;
        if (this.xmlFile.parentComponent) {
            //build a lookup of pkg paths -> FileReference so we can more easily look up collisions
            let parentScriptImports = this.xmlFile.getAncestorScriptTagImports();
            let lookup = {};
            for (let parentScriptImport of parentScriptImports) {
                //keep the first occurance of a pkgPath. Parent imports are first in the array
                if (!lookup[parentScriptImport.pkgPath]) {
                    lookup[parentScriptImport.pkgPath] = parentScriptImport;
                }
            }
            //add warning for every script tag that this file shares with an ancestor
            for (let scriptImport of this.xmlFile.scriptTagImports) {
                let ancestorScriptImport = lookup[scriptImport.pkgPath];
                if (ancestorScriptImport) {
                    let ancestorComponent = ancestorScriptImport.sourceFile;
                    let ancestorComponentName = (_b = (_a = ancestorComponent.componentName) === null || _a === void 0 ? void 0 : _a.text) !== null && _b !== void 0 ? _b : ancestorComponent.pkgPath;
                    this.diagnostics.push(Object.assign({ file: this.xmlFile, range: scriptImport.filePathRange }, DiagnosticMessages_1.DiagnosticMessages.unnecessaryScriptImportInChildFromParent(ancestorComponentName)));
                }
            }
        }
    }
    getAllFiles() {
        return this.cache.getOrAdd('getAllFiles-xmlScope', () => {
            const allFiles = super.getAllFiles();
            allFiles.push(this.xmlFile);
            return allFiles;
        });
    }
    /**
     * Get the list of files referenced by this scope that are actually loaded in the program.
     * This does not account for parent scope.
     */
    getOwnFiles() {
        return this.cache.getOrAdd('getOwnFiles', () => {
            let result = [
                this.xmlFile
            ];
            let scriptPkgPaths = this.xmlFile.getOwnDependencies();
            for (let scriptPkgPath of scriptPkgPaths) {
                let file = this.program.getFileByPkgPath(scriptPkgPath);
                if (file) {
                    result.push(file);
                }
            }
            return result;
        });
    }
    /**
     * Get the definition (where was this thing first defined) of the symbol under the position
     * @deprecated use `DefinitionProvider.process()`
     */
    getDefinition(file, position) {
        return new DefinitionProvider_1.DefinitionProvider({
            program: this.program,
            file: file,
            position: position,
            definitions: []
        }).process();
    }
}
exports.XmlScope = XmlScope;
//# sourceMappingURL=XmlScope.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XmlFile = void 0;
const path = require("path");
const source_map_1 = require("source-map");
const DiagnosticMessages_1 = require("../DiagnosticMessages");
const util_1 = require("../util");
const SGParser_1 = require("../parser/SGParser");
const chalk_1 = require("chalk");
const Cache_1 = require("../Cache");
const SGTypes_1 = require("../parser/SGTypes");
const CommentFlagProcessor_1 = require("../CommentFlagProcessor");
const TranspileState_1 = require("../parser/TranspileState");
class XmlFile {
    constructor(srcPath, 
    /**
     * The absolute path to the file, relative to the pkg
     */
    pkgPath, program) {
        this.srcPath = srcPath;
        this.pkgPath = pkgPath;
        this.program = program;
        this.cache = new Cache_1.Cache();
        /**
         * Indicates whether this file needs to be validated.
         * Files are only ever validated a single time
         */
        this.isValidated = false;
        this.commentFlags = [];
        /**
         * Will this file result in only comment or whitespace output? If so, it can be excluded from the output if that bsconfig setting is enabled.
         */
        this.canBePruned = false;
        /**
         * A collection of diagnostics related to this file
         */
        this.diagnostics = [];
        this.parser = new SGParser_1.default();
        //TODO implement the xml CDATA parsing, which would populate this list
        this.callables = [];
        //TODO implement the xml CDATA parsing, which would populate this list
        this.functionCalls = [];
        this.functionScopes = [];
        /**
         * Does this file need to be transpiled?
         */
        this.needsTranspiled = false;
        /**
         * A slight hack. Gives the Program a way to support multiple components with the same name
         * without causing major issues. A value of 0 will be ignored as part of the dependency graph key.
         * Howver, a nonzero value will be used as part of the dependency graph key so this component doesn't
         * collide with the primary component. For example, if there are three components with the same name, you will
         * have the following dependency graph keys: ["component:CustomGrid", "component:CustomGrid[1]", "component:CustomGrid[2]"]
         */
        this.dependencyGraphIndex = -1;
        this.extension = path.extname(this.srcPath).toLowerCase();
        this.possibleCodebehindPkgPaths = [
            this.pkgPath.replace('.xml', '.bs'),
            this.pkgPath.replace('.xml', '.brs')
        ];
    }
    /**
     * The absolute path to the source location for this file
     * @deprecated use `srcPath` instead
     */
    get pathAbsolute() {
        return this.srcPath;
    }
    set pathAbsolute(value) {
        this.srcPath = value;
    }
    /**
     * The list of script imports delcared in the XML of this file.
     * This excludes parent imports and auto codebehind imports
     */
    get scriptTagImports() {
        return this.parser.references.scriptTagImports
            .map(tag => (Object.assign(Object.assign({}, tag), { sourceFile: this })));
    }
    /**
     * List of all pkgPaths to scripts that this XmlFile depends, regardless of whether they are loaded in the program or not.
     * This includes own dependencies and all parent compoent dependencies
     * coming from:
     *  - script tags
     *  - implied codebehind file
     *  - import statements from imported scripts or their descendents
     */
    getAllDependencies() {
        return this.cache.getOrAdd(`allScriptImports`, () => {
            const value = this.dependencyGraph.getAllDependencies(this.dependencyGraphKey);
            return value;
        });
    }
    /**
     * List of all pkgPaths to scripts that this XmlFile depends on directly, regardless of whether they are loaded in the program or not.
     * This does not account for parent component scripts
     * coming from:
     *  - script tags
     *  - implied codebehind file
     *  - import statements from imported scripts or their descendents
     */
    getOwnDependencies() {
        return this.cache.getOrAdd(`ownScriptImports`, () => {
            const value = this.dependencyGraph.getAllDependencies(this.dependencyGraphKey, [this.parentComponentDependencyGraphKey]);
            return value;
        });
    }
    /**
     * List of all pkgPaths to scripts that this XmlFile depends on that are actually loaded into the program.
     * This does not account for parent component scripts.
     * coming from:
     *  - script tags
     *  - inferred codebehind file
     *  - import statements from imported scripts or their descendants
     */
    getAvailableScriptImports() {
        return this.cache.getOrAdd('allAvailableScriptImports', () => {
            let allDependencies = this.getOwnDependencies()
                //skip typedef files
                .filter(x => util_1.default.getExtension(x) !== '.d.bs');
            let result = [];
            let filesInProgram = this.program.getFiles(allDependencies);
            for (let file of filesInProgram) {
                result.push(file.pkgPath);
            }
            this.logDebug('computed allAvailableScriptImports', () => result);
            return result;
        });
    }
    getDiagnostics() {
        return [...this.diagnostics];
    }
    addDiagnostics(diagnostics) {
        this.diagnostics.push(...diagnostics);
    }
    /**
     * The name of the component that this component extends.
     * Available after `parse()`
     */
    get parentComponentName() {
        var _a;
        return (_a = this.parser) === null || _a === void 0 ? void 0 : _a.references.extends;
    }
    /**
     * The name of the component declared in this xml file
     * Available after `parse()`
     */
    get componentName() {
        var _a;
        return (_a = this.parser) === null || _a === void 0 ? void 0 : _a.references.name;
    }
    /**
     * The AST for this file
     */
    get ast() {
        return this.parser.ast;
    }
    /**
     * Calculate the AST for this file
     * @param fileContents the xml source code to parse
     */
    parse(fileContents) {
        var _a, _b;
        this.fileContents = fileContents;
        this.parser.parse(this.pkgPath, fileContents);
        this.diagnostics = this.parser.diagnostics.map(diagnostic => (Object.assign(Object.assign({}, diagnostic), { file: this })));
        this.getCommentFlags(this.parser.tokens);
        //needsTranspiled should be true if an import is brighterscript
        this.needsTranspiled = this.needsTranspiled || ((_b = (_a = this.ast.component) === null || _a === void 0 ? void 0 : _a.scripts) === null || _b === void 0 ? void 0 : _b.some(script => { var _a, _b; return ((_a = script.type) === null || _a === void 0 ? void 0 : _a.indexOf('brighterscript')) > 0 || ((_b = script.uri) === null || _b === void 0 ? void 0 : _b.endsWith('.bs')); }));
    }
    /**
     * @deprecated logic has moved into XmlFileValidator, this is now an empty function
     */
    validate() {
    }
    /**
     * Collect all bs: comment flags
     */
    getCommentFlags(tokens) {
        const processor = new CommentFlagProcessor_1.CommentFlagProcessor(this, ['<!--'], DiagnosticMessages_1.diagnosticCodes, [DiagnosticMessages_1.DiagnosticCodeMap.unknownDiagnosticCode]);
        this.commentFlags = [];
        for (let token of tokens) {
            if (token.tokenType.name === 'Comment') {
                processor.tryAdd(
                //remove the close comment symbol
                token.image.replace(/\-\-\>$/, ''), (0, SGParser_1.rangeFromTokenValue)(token));
            }
        }
        this.commentFlags.push(...processor.commentFlags);
        this.diagnostics.push(...processor.diagnostics);
    }
    /**
     * Attach the file to the dependency graph so it can monitor changes.
     * Also notify the dependency graph of our current dependencies so other dependents can be notified.
     */
    attachDependencyGraph(dependencyGraph) {
        this.dependencyGraph = dependencyGraph;
        if (this.unsubscribeFromDependencyGraph) {
            this.unsubscribeFromDependencyGraph();
        }
        //anytime a dependency changes, clean up some cached values
        this.unsubscribeFromDependencyGraph = dependencyGraph.onchange(this.dependencyGraphKey, () => {
            this.logDebug('clear cache because dependency graph changed');
            this.cache.clear();
        });
        let dependencies = [
            ...this.scriptTagImports.map(x => x.pkgPath.toLowerCase())
        ];
        //if autoImportComponentScript is enabled, add the .bs and .brs files with the same name
        if (this.program.options.autoImportComponentScript) {
            dependencies.push(
            //add the codebehind file dependencies.
            //These are kind of optional, so it doesn't hurt to just add both extension versions
            this.pkgPath.replace(/\.xml$/i, '.bs').toLowerCase(), this.pkgPath.replace(/\.xml$/i, '.brs').toLowerCase());
        }
        const len = dependencies.length;
        for (let i = 0; i < len; i++) {
            const dep = dependencies[i];
            //add a dependency on `d.bs` file for every `.brs` file
            if (dep.slice(-4).toLowerCase() === '.brs') {
                dependencies.push(util_1.default.getTypedefPath(dep));
            }
        }
        if (this.parentComponentName) {
            dependencies.push(this.parentComponentDependencyGraphKey);
        }
        this.dependencyGraph.addOrReplace(this.dependencyGraphKey, dependencies);
    }
    /**
     * The key used in the dependency graph for this file.
     * If we have a component name, we will use that so we can be discoverable by child components.
     * If we don't have a component name, use the pkgPath so at least we can self-validate
     */
    get dependencyGraphKey() {
        let key;
        if (this.componentName) {
            key = `component:${this.componentName.text}`.toLowerCase();
        }
        else {
            key = this.pkgPath.toLowerCase();
        }
        //if our index is not zero, then we are not the primary component with that name, and need to
        //append our index to the dependency graph key as to prevent collisions in the program.
        if (this.dependencyGraphIndex !== 0) {
            key += '[' + this.dependencyGraphIndex + ']';
        }
        return key;
    }
    /**
     * The key used in the dependency graph for this component's parent.
     * If we have aparent, we will use that. If we don't, this will return undefined
     */
    get parentComponentDependencyGraphKey() {
        if (this.parentComponentName) {
            return `component:${this.parentComponentName.text}`.toLowerCase();
        }
        else {
            return undefined;
        }
    }
    /**
     * Determines if this xml file has a reference to the specified file (or if it's itself)
     */
    doesReferenceFile(file) {
        return this.cache.getOrAdd(`doesReferenceFile: ${file.pkgPath}`, () => {
            if (file === this) {
                return true;
            }
            let allDependencies = this.getOwnDependencies();
            for (let importPkgPath of allDependencies) {
                if (importPkgPath.toLowerCase() === file.pkgPath.toLowerCase()) {
                    return true;
                }
            }
            //if this is an xml file...do we extend the component it defines?
            if (path.extname(file.pkgPath).toLowerCase() === '.xml') {
                //didn't find any script imports for this file
                return false;
            }
            return false;
        });
    }
    /**
     * Get all available completions for the specified position
     */
    getCompletions(position) {
        let scriptImport = util_1.default.getScriptImportAtPosition(this.scriptTagImports, position);
        if (scriptImport) {
            return this.program.getScriptImportCompletions(this.pkgPath, scriptImport);
        }
        else {
            return [];
        }
    }
    /**
     * Get the parent component (the component this component extends)
     */
    get parentComponent() {
        const result = this.cache.getOrAdd('parent', () => {
            var _a, _b;
            return (_b = this.program.getComponent((_a = this.parentComponentName) === null || _a === void 0 ? void 0 : _a.text)) === null || _b === void 0 ? void 0 : _b.file;
        });
        return result;
    }
    getReferences(position) {
        //TODO implement
        return null;
    }
    getFunctionScopeAtPosition(position, functionScopes) {
        //TODO implement
        return null;
    }
    /**
     * Walk up the ancestor chain and aggregate all of the script tag imports
     */
    getAncestorScriptTagImports() {
        let result = [];
        let parent = this.parentComponent;
        while (parent) {
            result.push(...parent.scriptTagImports);
            parent = parent.parentComponent;
        }
        return result;
    }
    /**
     * Remove this file from the dependency graph as a node
     */
    detachDependencyGraph(dependencyGraph) {
        dependencyGraph.remove(this.dependencyGraphKey);
    }
    /**
     * Get the list of script imports that this file needs to include.
     * It compares the list of imports on this file to those of its parent,
     * and only includes the ones that are not found on the parent.
     * If no parent is found, all imports are returned
     */
    getMissingImportsForTranspile() {
        var _a, _b;
        let ownImports = this.getAvailableScriptImports();
        //add the bslib path to ownImports, it'll get filtered down below
        ownImports.push(this.program.bslibPkgPath);
        let parentImports = (_b = (_a = this.parentComponent) === null || _a === void 0 ? void 0 : _a.getAvailableScriptImports()) !== null && _b !== void 0 ? _b : [];
        let parentMap = parentImports.reduce((map, pkgPath) => {
            map[pkgPath.toLowerCase()] = true;
            return map;
        }, {});
        //if the XML already has this import, skip this one
        let alreadyThereScriptImportMap = this.scriptTagImports.reduce((map, fileReference) => {
            map[fileReference.pkgPath.toLowerCase()] = true;
            return map;
        }, {});
        let resultMap = {};
        let result = [];
        for (let ownImport of ownImports) {
            const ownImportLower = ownImport.toLowerCase();
            if (
            //if the parent doesn't have this import
            !parentMap[ownImportLower] &&
                //the XML doesn't already have a script reference for this
                !alreadyThereScriptImportMap[ownImportLower] &&
                //the result doesn't already have this reference
                !resultMap[ownImportLower]) {
                result.push(ownImport);
                resultMap[ownImportLower] = true;
            }
        }
        return result;
    }
    logDebug(...args) {
        this.program.logger.debug('XmlFile', chalk_1.default.green(this.pkgPath), ...args);
    }
    checkScriptsForPublishableImports(scripts) {
        if (!this.program.options.pruneEmptyCodeFiles) {
            return [false, scripts];
        }
        const publishableScripts = scripts.filter(script => {
            var _a;
            const uriAttributeValue = ((_a = script.attributes.find((v) => v.key.text === 'uri')) === null || _a === void 0 ? void 0 : _a.value.text) || '';
            const pkgMapPath = util_1.default.getPkgPathFromTarget(this.pkgPath, uriAttributeValue);
            let file = this.program.getFile(pkgMapPath);
            if (!file && pkgMapPath.endsWith(this.program.bslibPkgPath)) {
                return true;
            }
            if (!file && pkgMapPath.endsWith('.brs')) {
                file = this.program.getFile(pkgMapPath.replace(/\.brs$/, '.bs'));
            }
            return !(file === null || file === void 0 ? void 0 : file.canBePruned);
        });
        return [publishableScripts.length !== scripts.length, publishableScripts];
    }
    /**
     * Convert the brightscript/brighterscript source code into valid brightscript
     */
    transpile() {
        var _a, _b;
        const state = new TranspileState_1.TranspileState(this.srcPath, this.program.options);
        const originalScripts = (_b = (_a = this.ast.component) === null || _a === void 0 ? void 0 : _a.scripts) !== null && _b !== void 0 ? _b : [];
        const extraImportScripts = this.getMissingImportsForTranspile().map(uri => {
            const script = new SGTypes_1.SGScript();
            script.uri = util_1.default.getRokuPkgPath(uri.replace(/\.bs$/, '.brs'));
            return script;
        });
        const [scriptsHaveChanged, publishableScripts] = this.checkScriptsForPublishableImports([
            ...originalScripts,
            ...extraImportScripts
        ]);
        let transpileResult;
        if (this.needsTranspiled || extraImportScripts.length > 0 || scriptsHaveChanged) {
            //temporarily add the missing imports as script tags
            this.ast.component.scripts = publishableScripts;
            transpileResult = util_1.default.sourceNodeFromTranspileResult(null, null, state.srcPath, this.parser.ast.transpile(state));
            //restore the original scripts array
            this.ast.component.scripts = originalScripts;
        }
        else if (this.program.options.sourceMap) {
            //emit code as-is with a simple map to the original file location
            transpileResult = util_1.default.simpleMap(state.srcPath, this.fileContents);
        }
        else {
            //simple SourceNode wrapping the entire file to simplify the logic below
            transpileResult = new source_map_1.SourceNode(null, null, state.srcPath, this.fileContents);
        }
        //add the source map comment if configured to emit sourcemaps
        if (this.program.options.sourceMap) {
            return new source_map_1.SourceNode(null, null, state.srcPath, [
                transpileResult,
                //add the sourcemap reference comment
                `<!--//# sourceMappingURL=./${path.basename(state.srcPath)}.map -->`
            ]).toStringWithSourceMap();
        }
        else {
            return {
                code: transpileResult.toString(),
                map: undefined
            };
        }
    }
    dispose() {
        var _a;
        //unsubscribe from any DependencyGraph subscriptions
        (_a = this.unsubscribeFromDependencyGraph) === null || _a === void 0 ? void 0 : _a.call(this);
    }
}
exports.XmlFile = XmlFile;
//# sourceMappingURL=XmlFile.js.map
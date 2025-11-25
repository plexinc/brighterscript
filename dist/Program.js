"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Program = void 0;
const assert = require("assert");
const fsExtra = require("fs-extra");
const path = require("path");
const vscode_languageserver_1 = require("vscode-languageserver");
const Scope_1 = require("./Scope");
const DiagnosticMessages_1 = require("./DiagnosticMessages");
const BrsFile_1 = require("./files/BrsFile");
const XmlFile_1 = require("./files/XmlFile");
const util_1 = require("./util");
const XmlScope_1 = require("./XmlScope");
const DiagnosticFilterer_1 = require("./DiagnosticFilterer");
const DependencyGraph_1 = require("./DependencyGraph");
const logging_1 = require("./logging");
const chalk_1 = require("chalk");
const globalCallables_1 = require("./globalCallables");
const Manifest_1 = require("./preprocessor/Manifest");
const vscode_uri_1 = require("vscode-uri");
const PluginInterface_1 = require("./PluginInterface");
const reflection_1 = require("./astUtils/reflection");
const BscPlugin_1 = require("./bscPlugin/BscPlugin");
const AstEditor_1 = require("./astUtils/AstEditor");
const CallExpressionInfo_1 = require("./bscPlugin/CallExpressionInfo");
const SignatureHelpUtil_1 = require("./bscPlugin/SignatureHelpUtil");
const DiagnosticSeverityAdjuster_1 = require("./DiagnosticSeverityAdjuster");
const Sequencer_1 = require("./common/Sequencer");
const deferred_1 = require("./deferred");
const startOfSourcePkgPath = `source${path.sep}`;
const bslibNonAliasedRokuModulesPkgPath = (0, util_1.standardizePath) `source/roku_modules/rokucommunity_bslib/bslib.brs`;
const bslibAliasedRokuModulesPkgPath = (0, util_1.standardizePath) `source/roku_modules/bslib/bslib.brs`;
class Program {
    constructor(
    /**
     * The root directory for this program
     */
    options, logger, plugins) {
        /**
         * A graph of all files and their dependencies.
         * For example:
         *      File.xml -> [lib1.brs, lib2.brs]
         *      lib2.brs -> [lib3.brs] //via an import statement
         */
        this.dependencyGraph = new DependencyGraph_1.DependencyGraph();
        this.diagnosticFilterer = new DiagnosticFilterer_1.DiagnosticFilterer();
        this.diagnosticAdjuster = new DiagnosticSeverityAdjuster_1.DiagnosticSeverityAdjuster();
        /**
         * A scope that contains all built-in global functions.
         * All scopes should directly or indirectly inherit from this scope
         */
        this.globalScope = undefined;
        /**
         * A set of diagnostics. This does not include any of the scope diagnostics.
         * Should only be set from `this.validate()`
         */
        this.diagnostics = [];
        /**
         * A map of every file loaded into this program, indexed by its original file location
         */
        this.files = {};
        this.pkgMap = {};
        this.scopes = {};
        /**
         * A map of every component currently loaded into the program, indexed by the component name.
         * It is a compile-time error to have multiple components with the same name. However, we store an array of components
         * by name so we can provide a better developer expreience. You shouldn't be directly accessing this array,
         * but if you do, only ever use the component at index 0.
         */
        this.components = {};
        /**
         * Counter used to track which validation run is being logged
         */
        this.validationRunSequence = 1;
        /**
         * How many milliseconds can pass while doing synchronous operations in validate before we register a short timeout (i.e. yield to the event loop)
         */
        this.validationMinSyncDuration = 75;
        this.options = util_1.util.normalizeConfig(options);
        this.logger = logger !== null && logger !== void 0 ? logger : (0, logging_1.createLogger)(options);
        this.plugins = plugins || new PluginInterface_1.default([], { logger: this.logger });
        //inject the bsc plugin as the first plugin in the stack.
        this.plugins.addFirst(new BscPlugin_1.BscPlugin());
        //normalize the root dir path
        this.options.rootDir = util_1.util.getRootDir(this.options);
        this.createGlobalScope();
    }
    createGlobalScope() {
        //create the 'global' scope
        this.globalScope = new Scope_1.Scope('global', this, 'scope:global');
        this.globalScope.attachDependencyGraph(this.dependencyGraph);
        this.scopes.global = this.globalScope;
        //hardcode the files list for global scope to only contain the global file
        this.globalScope.getAllFiles = () => [globalCallables_1.globalFile];
        this.globalScope.validate();
        //for now, disable validation of global scope because the global files have some duplicate method declarations
        this.globalScope.getDiagnostics = () => [];
        //TODO we might need to fix this because the isValidated clears stuff now
        this.globalScope.isValidated = true;
    }
    /**
     * The path to bslib.brs (the BrightScript runtime for certain BrighterScript features)
     */
    get bslibPkgPath() {
        //if there's an aliased (preferred) version of bslib from roku_modules loaded into the program, use that
        if (this.getFile(bslibAliasedRokuModulesPkgPath)) {
            return bslibAliasedRokuModulesPkgPath;
            //if there's a non-aliased version of bslib from roku_modules, use that
        }
        else if (this.getFile(bslibNonAliasedRokuModulesPkgPath)) {
            return bslibNonAliasedRokuModulesPkgPath;
            //default to the embedded version
        }
        else {
            return `${this.options.bslibDestinationDir}${path.sep}bslib.brs`;
        }
    }
    get bslibPrefix() {
        if (this.bslibPkgPath === bslibNonAliasedRokuModulesPkgPath) {
            return 'rokucommunity_bslib';
        }
        else {
            return 'bslib';
        }
    }
    addScope(scope) {
        this.scopes[scope.name] = scope;
    }
    /**
     * Get the component with the specified name
     */
    getComponent(componentName) {
        var _a;
        if (componentName) {
            //return the first compoment in the list with this name
            //(components are ordered in this list by pkgPath to ensure consistency)
            return (_a = this.components[componentName.toLowerCase()]) === null || _a === void 0 ? void 0 : _a[0];
        }
        else {
            return undefined;
        }
    }
    /**
     * Register (or replace) the reference to a component in the component map
     */
    registerComponent(xmlFile, scope) {
        var _a, _b;
        const key = ((_b = (_a = xmlFile.componentName) === null || _a === void 0 ? void 0 : _a.text) !== null && _b !== void 0 ? _b : xmlFile.pkgPath).toLowerCase();
        if (!this.components[key]) {
            this.components[key] = [];
        }
        this.components[key].push({
            file: xmlFile,
            scope: scope
        });
        this.components[key].sort((a, b) => {
            const pathA = a.file.pkgPath.toLowerCase();
            const pathB = b.file.pkgPath.toLowerCase();
            if (pathA < pathB) {
                return -1;
            }
            else if (pathA > pathB) {
                return 1;
            }
            return 0;
        });
        this.syncComponentDependencyGraph(this.components[key]);
    }
    /**
     * Remove the specified component from the components map
     */
    unregisterComponent(xmlFile) {
        var _a, _b;
        const key = ((_b = (_a = xmlFile.componentName) === null || _a === void 0 ? void 0 : _a.text) !== null && _b !== void 0 ? _b : xmlFile.pkgPath).toLowerCase();
        const arr = this.components[key] || [];
        for (let i = 0; i < arr.length; i++) {
            if (arr[i].file === xmlFile) {
                arr.splice(i, 1);
                break;
            }
        }
        this.syncComponentDependencyGraph(arr);
    }
    /**
     * re-attach the dependency graph with a new key for any component who changed
     * their position in their own named array (only matters when there are multiple
     * components with the same name)
     */
    syncComponentDependencyGraph(components) {
        //reattach every dependency graph
        for (let i = 0; i < components.length; i++) {
            const { file, scope } = components[i];
            //attach (or re-attach) the dependencyGraph for every component whose position changed
            if (file.dependencyGraphIndex !== i) {
                file.dependencyGraphIndex = i;
                file.attachDependencyGraph(this.dependencyGraph);
                scope.attachDependencyGraph(this.dependencyGraph);
            }
        }
    }
    /**
     * Get a list of all files that are included in the project but are not referenced
     * by any scope in the program.
     */
    getUnreferencedFiles() {
        let result = [];
        for (let filePath in this.files) {
            let file = this.files[filePath];
            //is this file part of a scope
            if (!this.getFirstScopeForFile(file)) {
                //no scopes reference this file. add it to the list
                result.push(file);
            }
        }
        return result;
    }
    /**
     * Get the list of errors for the entire program. It's calculated on the fly
     * by walking through every file, so call this sparingly.
     */
    getDiagnostics() {
        return this.logger.time(logging_1.LogLevel.info, ['Program.getDiagnostics()'], () => {
            let diagnostics = [...this.diagnostics];
            //get the diagnostics from all scopes
            for (let scopeName in this.scopes) {
                let scope = this.scopes[scopeName];
                diagnostics.push(...scope.getDiagnostics());
            }
            //get the diagnostics from all unreferenced files
            let unreferencedFiles = this.getUnreferencedFiles();
            for (let file of unreferencedFiles) {
                diagnostics.push(...file.getDiagnostics());
            }
            const filteredDiagnostics = this.logger.time(logging_1.LogLevel.debug, ['filter diagnostics'], () => {
                //filter out diagnostics based on our diagnostic filters
                let finalDiagnostics = this.diagnosticFilterer.filter(Object.assign(Object.assign({}, this.options), { rootDir: this.options.rootDir }), diagnostics);
                return finalDiagnostics;
            });
            this.logger.time(logging_1.LogLevel.debug, ['adjust diagnostics severity'], () => {
                this.diagnosticAdjuster.adjust(this.options, diagnostics);
            });
            this.logger.info(`diagnostic counts: total=${chalk_1.default.yellow(diagnostics.length.toString())}, after filter=${chalk_1.default.yellow(filteredDiagnostics.length.toString())}`);
            return filteredDiagnostics;
        });
    }
    addDiagnostics(diagnostics) {
        this.diagnostics.push(...diagnostics);
    }
    /**
     * Determine if the specified file is loaded in this program right now.
     * @param filePath the absolute or relative path to the file
     * @param normalizePath should the provided path be normalized before use
     */
    hasFile(filePath, normalizePath = true) {
        return !!this.getFile(filePath, normalizePath);
    }
    getPkgPath(...args) {
        throw new Error('Not implemented');
    }
    /**
     * roku filesystem is case INsensitive, so find the scope by key case insensitive
     */
    getScopeByName(scopeName) {
        if (!scopeName) {
            return undefined;
        }
        //most scopes are xml file pkg paths. however, the ones that are not are single names like "global" and "scope",
        //so it's safe to run the standardizePkgPath method
        scopeName = (0, util_1.standardizePath) `${scopeName}`;
        let key = Object.keys(this.scopes).find(x => x.toLowerCase() === scopeName.toLowerCase());
        return this.scopes[key];
    }
    /**
     * Return all scopes
     */
    getScopes() {
        return Object.values(this.scopes);
    }
    /**
     * Find the scope for the specified component
     */
    getComponentScope(componentName) {
        var _a;
        return (_a = this.getComponent(componentName)) === null || _a === void 0 ? void 0 : _a.scope;
    }
    /**
     * Update internal maps with this file reference
     */
    assignFile(file) {
        this.files[file.srcPath.toLowerCase()] = file;
        this.pkgMap[file.pkgPath.toLowerCase()] = file;
        return file;
    }
    /**
     * Remove this file from internal maps
     */
    unassignFile(file) {
        delete this.files[file.srcPath.toLowerCase()];
        delete this.pkgMap[file.pkgPath.toLowerCase()];
        return file;
    }
    addOrReplaceFile(fileParam, fileContents) {
        return this.setFile(fileParam, fileContents);
    }
    setFile(fileParam, fileContents) {
        //normalize the file paths
        const { srcPath, pkgPath } = this.getPaths(fileParam, this.options.rootDir);
        let file = this.logger.time(logging_1.LogLevel.debug, ['Program.setFile()', chalk_1.default.green(srcPath)], () => {
            //if the file is already loaded, remove it
            if (this.hasFile(srcPath)) {
                this.removeFile(srcPath);
            }
            let fileExtension = path.extname(srcPath).toLowerCase();
            let file;
            if (fileExtension === '.brs' || fileExtension === '.bs') {
                //add the file to the program
                const brsFile = this.assignFile(new BrsFile_1.BrsFile(srcPath, pkgPath, this));
                //add file to the `source` dependency list
                if (brsFile.pkgPath.startsWith(startOfSourcePkgPath)) {
                    this.createSourceScope();
                    this.dependencyGraph.addDependency('scope:source', brsFile.dependencyGraphKey);
                }
                let sourceObj = {
                    //TODO remove `pathAbsolute` in v1
                    pathAbsolute: srcPath,
                    srcPath: srcPath,
                    source: fileContents
                };
                this.plugins.emit('beforeFileParse', sourceObj);
                this.logger.time(logging_1.LogLevel.debug, ['parse', chalk_1.default.green(srcPath)], () => {
                    brsFile.parse(sourceObj.source);
                });
                //notify plugins that this file has finished parsing
                this.plugins.emit('afterFileParse', brsFile);
                file = brsFile;
                brsFile.attachDependencyGraph(this.dependencyGraph);
            }
            else if (
            //is xml file
            fileExtension === '.xml' &&
                //resides in the components folder (Roku will only parse xml files in the components folder)
                pkgPath.toLowerCase().startsWith(util_1.util.pathSepNormalize(`components/`))) {
                //add the file to the program
                const xmlFile = this.assignFile(new XmlFile_1.XmlFile(srcPath, pkgPath, this));
                let sourceObj = {
                    //TODO remove `pathAbsolute` in v1
                    pathAbsolute: srcPath,
                    srcPath: srcPath,
                    source: fileContents
                };
                this.plugins.emit('beforeFileParse', sourceObj);
                this.logger.time(logging_1.LogLevel.debug, ['parse', chalk_1.default.green(srcPath)], () => {
                    xmlFile.parse(sourceObj.source);
                });
                //notify plugins that this file has finished parsing
                this.plugins.emit('afterFileParse', xmlFile);
                file = xmlFile;
                //create a new scope for this xml file
                let scope = new XmlScope_1.XmlScope(xmlFile, this);
                this.addScope(scope);
                //register this compoent now that we have parsed it and know its component name
                this.registerComponent(xmlFile, scope);
                //notify plugins that the scope is created and the component is registered
                this.plugins.emit('afterScopeCreate', scope);
            }
            else {
                //TODO do we actually need to implement this? Figure out how to handle img paths
                // let genericFile = this.files[srcPath] = <any>{
                //     srcPath: srcPath,
                //     pkgPath: pkgPath,
                //     wasProcessed: true
                // } as File;
                // file = <any>genericFile;
            }
            return file;
        });
        return file;
    }
    /**
     * Given a srcPath, a pkgPath, or both, resolve whichever is missing, relative to rootDir.
     * @param fileParam an object representing file paths
     * @param rootDir must be a pre-normalized path
     */
    getPaths(fileParam, rootDir) {
        let srcPath;
        let pkgPath;
        assert.ok(fileParam, 'fileParam is required');
        //lift the srcPath and pkgPath vars from the incoming param
        if (typeof fileParam === 'string') {
            fileParam = this.removePkgPrefix(fileParam);
            srcPath = (0, util_1.standardizePath) `${path.resolve(rootDir, fileParam)}`;
            pkgPath = (0, util_1.standardizePath) `${util_1.util.replaceCaseInsensitive(srcPath, rootDir, '')}`;
        }
        else {
            let param = fileParam;
            if (param.src) {
                srcPath = (0, util_1.standardizePath) `${param.src}`;
            }
            if (param.srcPath) {
                srcPath = (0, util_1.standardizePath) `${param.srcPath}`;
            }
            if (param.dest) {
                pkgPath = (0, util_1.standardizePath) `${this.removePkgPrefix(param.dest)}`;
            }
            if (param.pkgPath) {
                pkgPath = (0, util_1.standardizePath) `${this.removePkgPrefix(param.pkgPath)}`;
            }
        }
        //if there's no srcPath, use the pkgPath to build an absolute srcPath
        if (!srcPath) {
            srcPath = (0, util_1.standardizePath) `${rootDir}/${pkgPath}`;
        }
        //coerce srcPath to an absolute path
        if (!path.isAbsolute(srcPath)) {
            srcPath = util_1.util.standardizePath(srcPath);
        }
        //if there's no pkgPath, compute relative path from rootDir
        if (!pkgPath) {
            pkgPath = (0, util_1.standardizePath) `${util_1.util.replaceCaseInsensitive(srcPath, rootDir, '')}`;
        }
        assert.ok(srcPath, 'fileEntry.src is required');
        assert.ok(pkgPath, 'fileEntry.dest is required');
        return {
            srcPath: srcPath,
            //remove leading slash from pkgPath
            pkgPath: pkgPath.replace(/^[\/\\]+/, '')
        };
    }
    /**
     * Remove any leading `pkg:/` found in the path
     */
    removePkgPrefix(path) {
        return path.replace(/^pkg:\//i, '');
    }
    /**
     * Ensure source scope is created.
     * Note: automatically called internally, and no-op if it exists already.
     */
    createSourceScope() {
        if (!this.scopes.source) {
            const sourceScope = new Scope_1.Scope('source', this, 'scope:source');
            sourceScope.attachDependencyGraph(this.dependencyGraph);
            this.addScope(sourceScope);
            this.plugins.emit('afterScopeCreate', sourceScope);
        }
    }
    /**
     * Find the file by its absolute path. This is case INSENSITIVE, since
     * Roku is a case insensitive file system. It is an error to have multiple files
     * with the same path with only case being different.
     * @param srcPath the absolute path to the file
     * @deprecated use `getFile` instead, which auto-detects the path type
     */
    getFileByPathAbsolute(srcPath) {
        srcPath = (0, util_1.standardizePath) `${srcPath}`;
        for (let filePath in this.files) {
            if (filePath.toLowerCase() === srcPath.toLowerCase()) {
                return this.files[filePath];
            }
        }
    }
    /**
     * Get a list of files for the given (platform-normalized) pkgPath array.
     * Missing files are just ignored.
     * @deprecated use `getFiles` instead, which auto-detects the path types
     */
    getFilesByPkgPaths(pkgPaths) {
        return pkgPaths
            .map(pkgPath => this.getFileByPkgPath(pkgPath))
            .filter(file => file !== undefined);
    }
    /**
     * Get a file with the specified (platform-normalized) pkg path.
     * If not found, return undefined
     * @deprecated use `getFile` instead, which auto-detects the path type
     */
    getFileByPkgPath(pkgPath) {
        return this.pkgMap[pkgPath.toLowerCase()];
    }
    /**
     * Remove a set of files from the program
     * @param srcPaths can be an array of srcPath or destPath strings
     * @param normalizePath should this function repair and standardize the filePaths? Passing false should have a performance boost if you can guarantee your paths are already sanitized
     */
    removeFiles(srcPaths, normalizePath = true) {
        for (let srcPath of srcPaths) {
            this.removeFile(srcPath, normalizePath);
        }
    }
    /**
     * Remove a file from the program
     * @param filePath can be a srcPath, a pkgPath, or a destPath (same as pkgPath but without `pkg:/`)
     * @param normalizePath should this function repair and standardize the path? Passing false should have a performance boost if you can guarantee your path is already sanitized
     */
    removeFile(filePath, normalizePath = true) {
        this.logger.debug('Program.removeFile()', filePath);
        let file = this.getFile(filePath, normalizePath);
        if (file) {
            this.plugins.emit('beforeFileDispose', file);
            //if there is a scope named the same as this file's path, remove it (i.e. xml scopes)
            let scope = this.scopes[file.pkgPath];
            if (scope) {
                this.plugins.emit('beforeScopeDispose', scope);
                scope.dispose();
                //notify dependencies of this scope that it has been removed
                this.dependencyGraph.remove(scope.dependencyGraphKey);
                delete this.scopes[file.pkgPath];
                this.plugins.emit('afterScopeDispose', scope);
            }
            //remove the file from the program
            this.unassignFile(file);
            this.dependencyGraph.remove(file.dependencyGraphKey);
            //if this is a pkg:/source file, notify the `source` scope that it has changed
            if (file.pkgPath.startsWith(startOfSourcePkgPath)) {
                this.dependencyGraph.removeDependency('scope:source', file.dependencyGraphKey);
            }
            //if this is a component, remove it from our components map
            if ((0, reflection_1.isXmlFile)(file)) {
                this.unregisterComponent(file);
            }
            //dispose file
            file === null || file === void 0 ? void 0 : file.dispose();
            this.plugins.emit('afterFileDispose', file);
        }
    }
    validate(options) {
        var _a;
        const validationRunId = this.validationRunSequence++;
        const timeEnd = this.logger.timeStart(logging_1.LogLevel.log, `Validating project${this.logger.logLevel > logging_1.LogLevel.log ? ` (run ${validationRunId})` : ''}`);
        let previousValidationPromise = this.validatePromise;
        const deferred = new deferred_1.Deferred();
        if (options === null || options === void 0 ? void 0 : options.async) {
            //we're async, so create a new promise chain to resolve after this validation is done
            this.validatePromise = Promise.resolve(previousValidationPromise).then(() => {
                return deferred.promise;
            });
            //we are not async but there's a pending promise, then we cannot run this validation
        }
        else if (previousValidationPromise !== undefined) {
            throw new Error('Cannot run synchronous validation while an async validation is in progress');
        }
        if (options === null || options === void 0 ? void 0 : options.async) {
            //we're async, so create a new promise chain to resolve after this validation is done
            this.validatePromise = Promise.resolve(previousValidationPromise).then(() => {
                return deferred.promise;
            });
            //we are not async but there's a pending promise, then we cannot run this validation
        }
        else if (previousValidationPromise !== undefined) {
            throw new Error('Cannot run synchronous validation while an async validation is in progress');
        }
        const sequencer = new Sequencer_1.Sequencer({
            name: 'program.validate',
            cancellationToken: (_a = options === null || options === void 0 ? void 0 : options.cancellationToken) !== null && _a !== void 0 ? _a : new vscode_languageserver_1.CancellationTokenSource().token,
            minSyncDuration: this.validationMinSyncDuration
        });
        let beforeProgramValidateWasEmitted = false;
        //this sequencer allows us to run in both sync and async mode, depending on whether options.async is enabled.
        //We use this to prevent starving the CPU during long validate cycles when running in a language server context
        sequencer
            .once(() => {
            //if running in async mode, return the previous validation promise to ensure we're only running one at a time
            if (options === null || options === void 0 ? void 0 : options.async) {
                return previousValidationPromise;
            }
        })
            .once(() => {
            this.diagnostics = [];
            this.plugins.emit('beforeProgramValidate', this);
            beforeProgramValidateWasEmitted = true;
        })
            .forEach(() => Object.values(this.files), (file) => {
            var _a;
            if (!file.isValidated) {
                this.plugins.emit('beforeFileValidate', {
                    program: this,
                    file: file
                });
                //emit an event to allow plugins to contribute to the file validation process
                this.plugins.emit('onFileValidate', {
                    program: this,
                    file: file
                });
                //call file.validate() IF the file has that function defined
                (_a = file.validate) === null || _a === void 0 ? void 0 : _a.call(file);
                file.isValidated = true;
                this.plugins.emit('afterFileValidate', file);
            }
        })
            .forEach(Object.values(this.scopes), (scope) => {
            scope.linkSymbolTable();
            scope.validate();
            scope.unlinkSymbolTable();
        })
            .once(() => {
            this.detectDuplicateComponentNames();
        })
            .onCancel(() => {
            timeEnd('cancelled');
        })
            .onSuccess(() => {
            timeEnd();
        })
            .onComplete(() => {
            var _a, _b;
            //if we emitted the beforeProgramValidate hook, emit the afterProgramValidate hook as well
            if (beforeProgramValidateWasEmitted) {
                const wasCancelled = (_b = (_a = options === null || options === void 0 ? void 0 : options.cancellationToken) === null || _a === void 0 ? void 0 : _a.isCancellationRequested) !== null && _b !== void 0 ? _b : false;
                this.plugins.emit('afterProgramValidate', this, wasCancelled);
            }
            //regardless of the success of the validation, mark this run as complete
            deferred.resolve();
            //clear the validatePromise which means we're no longer running a validation
            this.validatePromise = undefined;
        });
        //run the sequencer in async mode if enabled
        if (options === null || options === void 0 ? void 0 : options.async) {
            return sequencer.run();
            //run the sequencer in sync mode
        }
        else {
            return sequencer.runSync();
        }
    }
    /**
     * Flag all duplicate component names
     */
    detectDuplicateComponentNames() {
        const componentsByName = Object.keys(this.files).reduce((map, filePath) => {
            var _a;
            const file = this.files[filePath];
            //if this is an XmlFile, and it has a valid `componentName` property
            if ((0, reflection_1.isXmlFile)(file) && ((_a = file.componentName) === null || _a === void 0 ? void 0 : _a.text)) {
                let lowerName = file.componentName.text.toLowerCase();
                if (!map[lowerName]) {
                    map[lowerName] = [];
                }
                map[lowerName].push(file);
            }
            return map;
        }, {});
        for (let name in componentsByName) {
            const xmlFiles = componentsByName[name];
            //add diagnostics for every duplicate component with this name
            if (xmlFiles.length > 1) {
                for (let xmlFile of xmlFiles) {
                    const { componentName } = xmlFile;
                    this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.duplicateComponentName(componentName.text)), { range: xmlFile.componentName.range, file: xmlFile, relatedInformation: xmlFiles.filter(x => x !== xmlFile).map(x => {
                            var _a;
                            return {
                                location: util_1.util.createLocation(vscode_uri_1.URI.file((_a = xmlFile.srcPath) !== null && _a !== void 0 ? _a : xmlFile.srcPath).toString(), x.componentName.range),
                                message: 'Also defined here'
                            };
                        }) }));
                }
            }
        }
    }
    /**
     * Get the files for a list of filePaths
     * @param filePaths can be an array of srcPath or a destPath strings
     * @param normalizePath should this function repair and standardize the paths? Passing false should have a performance boost if you can guarantee your paths are already sanitized
     */
    getFiles(filePaths, normalizePath = true) {
        return filePaths
            .map(filePath => this.getFile(filePath, normalizePath))
            .filter(file => file !== undefined);
    }
    /**
     * Get the file at the given path
     * @param filePath can be a srcPath or a destPath
     * @param normalizePath should this function repair and standardize the path? Passing false should have a performance boost if you can guarantee your path is already sanitized
     */
    getFile(filePath, normalizePath = true) {
        if (typeof filePath !== 'string') {
            return undefined;
        }
        else if (path.isAbsolute(filePath)) {
            return this.files[(normalizePath ? util_1.util.standardizePath(filePath) : filePath).toLowerCase()];
        }
        else {
            return this.pkgMap[(normalizePath ? util_1.util.standardizePath(filePath) : filePath).toLowerCase()];
        }
    }
    /**
     * Get a list of all scopes the file is loaded into
     * @param file the file
     */
    getScopesForFile(file) {
        const resolvedFile = typeof file === 'string' ? this.getFile(file) : file;
        let result = [];
        if (resolvedFile) {
            for (let key in this.scopes) {
                let scope = this.scopes[key];
                if (scope.hasFile(resolvedFile)) {
                    result.push(scope);
                }
            }
        }
        return result;
    }
    /**
     * Get the first found scope for a file.
     */
    getFirstScopeForFile(file) {
        for (let key in this.scopes) {
            let scope = this.scopes[key];
            if (scope.hasFile(file)) {
                return scope;
            }
        }
    }
    getStatementsByName(name, originFile, namespaceName) {
        var _a, _b;
        let results = new Map();
        const filesSearched = new Set();
        let lowerNamespaceName = namespaceName === null || namespaceName === void 0 ? void 0 : namespaceName.toLowerCase();
        let lowerName = name === null || name === void 0 ? void 0 : name.toLowerCase();
        //look through all files in scope for matches
        for (const scope of this.getScopesForFile(originFile)) {
            for (const file of scope.getAllFiles()) {
                if ((0, reflection_1.isXmlFile)(file) || filesSearched.has(file)) {
                    continue;
                }
                filesSearched.add(file);
                for (const statement of [...file.parser.references.functionStatements, ...file.parser.references.classStatements.flatMap((cs) => cs.methods)]) {
                    let parentNamespaceName = (_b = (_a = statement.findAncestor(reflection_1.isNamespaceStatement)) === null || _a === void 0 ? void 0 : _a.getName(originFile.parseMode)) === null || _b === void 0 ? void 0 : _b.toLowerCase();
                    if (statement.name.text.toLowerCase() === lowerName && (!lowerNamespaceName || parentNamespaceName === lowerNamespaceName)) {
                        if (!results.has(statement)) {
                            results.set(statement, { item: statement, file: file });
                        }
                    }
                }
            }
        }
        return [...results.values()];
    }
    getStatementsForXmlFile(scope, filterName) {
        var _a, _b;
        let results = new Map();
        const filesSearched = new Set();
        //get all function names for the xml file and parents
        let funcNames = new Set();
        let currentScope = scope;
        while ((0, reflection_1.isXmlScope)(currentScope)) {
            for (let name of (_b = (_a = currentScope.xmlFile.ast.component.api) === null || _a === void 0 ? void 0 : _a.functions.map((f) => f.name)) !== null && _b !== void 0 ? _b : []) {
                if (!filterName || name === filterName) {
                    funcNames.add(name);
                }
            }
            currentScope = currentScope.getParentScope();
        }
        //look through all files in scope for matches
        for (const file of scope.getOwnFiles()) {
            if ((0, reflection_1.isXmlFile)(file) || filesSearched.has(file)) {
                continue;
            }
            filesSearched.add(file);
            for (const statement of file.parser.references.functionStatements) {
                if (funcNames.has(statement.name.text)) {
                    if (!results.has(statement)) {
                        results.set(statement, { item: statement, file: file });
                    }
                }
            }
        }
        return [...results.values()];
    }
    /**
     * Find all available completion items at the given position
     * @param filePath can be a srcPath or a destPath
     * @param position the position (line & column) where completions should be found
     */
    getCompletions(filePath, position) {
        let file = this.getFile(filePath);
        if (!file) {
            return [];
        }
        //find the scopes for this file
        let scopes = this.getScopesForFile(file);
        //if there are no scopes, include the global scope so we at least get the built-in functions
        scopes = scopes.length > 0 ? scopes : [this.globalScope];
        const event = {
            program: this,
            file: file,
            scopes: scopes,
            position: position,
            completions: []
        };
        this.plugins.emit('beforeProvideCompletions', event);
        this.plugins.emit('provideCompletions', event);
        this.plugins.emit('afterProvideCompletions', event);
        return event.completions;
    }
    /**
     * Goes through each file and builds a list of workspace symbols for the program. Used by LanguageServer's onWorkspaceSymbol functionality
     */
    getWorkspaceSymbols() {
        const event = {
            program: this,
            workspaceSymbols: []
        };
        this.plugins.emit('beforeProvideWorkspaceSymbols', event);
        this.plugins.emit('provideWorkspaceSymbols', event);
        this.plugins.emit('afterProvideWorkspaceSymbols', event);
        return event.workspaceSymbols;
    }
    /**
     * Given a position in a file, if the position is sitting on some type of identifier,
     * go to the definition of that identifier (where this thing was first defined)
     */
    getDefinition(srcPath, position) {
        let file = this.getFile(srcPath);
        if (!file) {
            return [];
        }
        const event = {
            program: this,
            file: file,
            position: position,
            definitions: []
        };
        this.plugins.emit('beforeProvideDefinition', event);
        this.plugins.emit('provideDefinition', event);
        this.plugins.emit('afterProvideDefinition', event);
        return event.definitions;
    }
    /**
     * Get hover information for a file and position
     */
    getHover(srcPath, position) {
        let file = this.getFile(srcPath);
        let result;
        if (file) {
            const event = {
                program: this,
                file: file,
                position: position,
                scopes: this.getScopesForFile(file),
                hovers: []
            };
            this.plugins.emit('beforeProvideHover', event);
            this.plugins.emit('provideHover', event);
            this.plugins.emit('afterProvideHover', event);
            result = event.hovers;
        }
        return result !== null && result !== void 0 ? result : [];
    }
    /**
     * Get full list of document symbols for a file
     * @param srcPath path to the file
     */
    getDocumentSymbols(srcPath) {
        let file = this.getFile(srcPath);
        if (file) {
            const event = {
                program: this,
                file: file,
                documentSymbols: []
            };
            this.plugins.emit('beforeProvideDocumentSymbols', event);
            this.plugins.emit('provideDocumentSymbols', event);
            this.plugins.emit('afterProvideDocumentSymbols', event);
            return event.documentSymbols;
        }
        else {
            return undefined;
        }
    }
    /**
     * Compute code actions for the given file and range
     */
    getCodeActions(srcPath, range) {
        const codeActions = [];
        const file = this.getFile(srcPath);
        if (file) {
            const diagnostics = this
                //get all current diagnostics (filtered by diagnostic filters)
                .getDiagnostics()
                //only keep diagnostics related to this file
                .filter(x => x.file === file)
                //only keep diagnostics that touch this range
                .filter(x => util_1.util.rangesIntersectOrTouch(x.range, range));
            const scopes = this.getScopesForFile(file);
            this.plugins.emit('onGetCodeActions', {
                program: this,
                file: file,
                range: range,
                diagnostics: diagnostics,
                scopes: scopes,
                codeActions: codeActions
            });
        }
        return codeActions;
    }
    /**
     * Get semantic tokens for the specified file
     */
    getSemanticTokens(srcPath) {
        const file = this.getFile(srcPath);
        if (file) {
            const result = [];
            this.plugins.emit('onGetSemanticTokens', {
                program: this,
                file: file,
                scopes: this.getScopesForFile(file),
                semanticTokens: result
            });
            return result;
        }
    }
    getSignatureHelp(filePath, position) {
        let file = this.getFile(filePath);
        if (!file || !(0, reflection_1.isBrsFile)(file)) {
            return [];
        }
        let callExpressionInfo = new CallExpressionInfo_1.CallExpressionInfo(file, position);
        let signatureHelpUtil = new SignatureHelpUtil_1.SignatureHelpUtil();
        return signatureHelpUtil.getSignatureHelpItems(callExpressionInfo);
    }
    getReferences(srcPath, position) {
        //find the file
        let file = this.getFile(srcPath);
        if (!file) {
            return null;
        }
        const event = {
            program: this,
            file: file,
            position: position,
            references: []
        };
        this.plugins.emit('beforeProvideReferences', event);
        this.plugins.emit('provideReferences', event);
        this.plugins.emit('afterProvideReferences', event);
        return event.references;
    }
    /**
     * Get a list of all script imports, relative to the specified pkgPath
     * @param sourcePkgPath - the pkgPath of the source that wants to resolve script imports.
     */
    getScriptImportCompletions(sourcePkgPath, scriptImport) {
        let lowerSourcePkgPath = sourcePkgPath.toLowerCase();
        let result = [];
        /**
         * hashtable to prevent duplicate results
         */
        let resultPkgPaths = {};
        //restrict to only .brs files
        for (let key in this.files) {
            let file = this.files[key];
            if (
            //is a BrightScript or BrighterScript file
            (file.extension === '.bs' || file.extension === '.brs') &&
                //this file is not the current file
                lowerSourcePkgPath !== file.pkgPath.toLowerCase()) {
                //add the relative path
                let relativePath = util_1.util.getRelativePath(sourcePkgPath, file.pkgPath).replace(/\\/g, '/');
                let pkgPathStandardized = file.pkgPath.replace(/\\/g, '/');
                let filePkgPath = `pkg:/${pkgPathStandardized}`;
                let lowerFilePkgPath = filePkgPath.toLowerCase();
                if (!resultPkgPaths[lowerFilePkgPath]) {
                    resultPkgPaths[lowerFilePkgPath] = true;
                    result.push({
                        label: relativePath,
                        detail: file.srcPath,
                        kind: vscode_languageserver_1.CompletionItemKind.File,
                        textEdit: {
                            newText: relativePath,
                            range: scriptImport.filePathRange
                        }
                    });
                    //add the absolute path
                    result.push({
                        label: filePkgPath,
                        detail: file.srcPath,
                        kind: vscode_languageserver_1.CompletionItemKind.File,
                        textEdit: {
                            newText: filePkgPath,
                            range: scriptImport.filePathRange
                        }
                    });
                }
            }
        }
        return result;
    }
    /**
     * Transpile a single file and get the result as a string.
     * This does not write anything to the file system.
     *
     * This should only be called by `LanguageServer`.
     * Internal usage should call `_getTranspiledFileContents` instead.
     * @param filePath can be a srcPath or a destPath
     */
    async getTranspiledFileContents(filePath) {
        const file = this.getFile(filePath);
        const fileMap = [{
                src: file.srcPath,
                dest: file.pkgPath
            }];
        const { entries, astEditor } = this.beforeProgramTranspile(fileMap, this.options.stagingDir);
        const result = this._getTranspiledFileContents(file);
        this.afterProgramTranspile(entries, astEditor);
        return Promise.resolve(result);
    }
    /**
     * Internal function used to transpile files.
     * This does not write anything to the file system
     */
    _getTranspiledFileContents(file, outputPath) {
        const editor = new AstEditor_1.AstEditor();
        this.plugins.emit('beforeFileTranspile', {
            program: this,
            file: file,
            outputPath: outputPath,
            editor: editor
        });
        //if we have any edits, assume the file needs to be transpiled
        if (editor.hasChanges) {
            //use the `editor` because it'll track the previous value for us and revert later on
            editor.setProperty(file, 'needsTranspiled', true);
        }
        //transpile the file
        const result = file.transpile();
        //generate the typedef if enabled
        let typedef;
        if ((0, reflection_1.isBrsFile)(file) && this.options.emitDefinitions) {
            typedef = file.getTypedef();
        }
        const event = {
            program: this,
            file: file,
            outputPath: outputPath,
            editor: editor,
            code: result.code,
            map: result.map,
            typedef: typedef
        };
        this.plugins.emit('afterFileTranspile', event);
        //undo all `editor` edits that may have been applied to this file.
        editor.undoAll();
        return {
            srcPath: file.srcPath,
            pkgPath: file.pkgPath,
            code: event.code,
            map: event.map,
            typedef: event.typedef
        };
    }
    beforeProgramTranspile(fileEntries, stagingDir) {
        // map fileEntries using their path as key, to avoid excessive "find()" operations
        const mappedFileEntries = fileEntries.reduce((collection, entry) => {
            collection[(0, util_1.standardizePath) `${entry.src}`] = entry;
            return collection;
        }, {});
        const getOutputPath = (file) => {
            let filePathObj = mappedFileEntries[(0, util_1.standardizePath) `${file.srcPath}`];
            if (!filePathObj) {
                //this file has been added in-memory, from a plugin, for example
                filePathObj = {
                    //add an interpolated src path (since it doesn't actually exist in memory)
                    src: `bsc:/${file.pkgPath}`,
                    dest: file.pkgPath
                };
            }
            //replace the file extension
            let outputPath = filePathObj.dest.replace(/\.bs$/gi, '.brs');
            //prepend the staging folder path
            outputPath = (0, util_1.standardizePath) `${stagingDir}/${outputPath}`;
            return outputPath;
        };
        const entries = Object.values(this.files)
            //only include the files from fileEntries
            .filter(file => !!mappedFileEntries[file.srcPath])
            .map(file => {
            return {
                file: file,
                outputPath: getOutputPath(file)
            };
        })
            //sort the entries to make transpiling more deterministic
            .sort((a, b) => {
            return a.file.srcPath < b.file.srcPath ? -1 : 1;
        });
        const astEditor = new AstEditor_1.AstEditor();
        this.plugins.emit('beforeProgramTranspile', this, entries, astEditor);
        return {
            entries: entries,
            getOutputPath: getOutputPath,
            astEditor: astEditor
        };
    }
    async transpile(fileEntries, stagingDir) {
        const { entries, getOutputPath, astEditor } = this.beforeProgramTranspile(fileEntries, stagingDir);
        const processedFiles = new Set();
        const transpileFile = async (srcPath, outputPath) => {
            //find the file in the program
            const file = this.getFile(srcPath);
            //mark this file as processed so we don't process it more than once
            processedFiles.add(outputPath === null || outputPath === void 0 ? void 0 : outputPath.toLowerCase());
            if (!this.options.pruneEmptyCodeFiles || !file.canBePruned) {
                //skip transpiling typedef files
                if ((0, reflection_1.isBrsFile)(file) && file.isTypedef) {
                    return;
                }
                const fileTranspileResult = this._getTranspiledFileContents(file, outputPath);
                //make sure the full dir path exists
                await fsExtra.ensureDir(path.dirname(outputPath));
                if (await fsExtra.pathExists(outputPath)) {
                    throw new Error(`Error while transpiling "${file.srcPath}". A file already exists at "${outputPath}" and will not be overwritten.`);
                }
                const writeMapPromise = fileTranspileResult.map ? fsExtra.writeFile(`${outputPath}.map`, fileTranspileResult.map.toString()) : null;
                await Promise.all([
                    fsExtra.writeFile(outputPath, fileTranspileResult.code),
                    writeMapPromise
                ]);
                if (fileTranspileResult.typedef) {
                    const typedefPath = outputPath.replace(/\.brs$/i, '.d.bs');
                    await fsExtra.writeFile(typedefPath, fileTranspileResult.typedef);
                }
            }
        };
        let promises = entries.map(async (entry) => {
            var _a;
            return transpileFile((_a = entry === null || entry === void 0 ? void 0 : entry.file) === null || _a === void 0 ? void 0 : _a.srcPath, entry.outputPath);
        });
        //if there's no bslib file already loaded into the program, copy it to the staging directory
        if (!this.getFile(bslibAliasedRokuModulesPkgPath) && !this.getFile((0, util_1.standardizePath) `source/bslib.brs`)) {
            promises.push(util_1.util.copyBslibToStaging(stagingDir, this.options.bslibDestinationDir));
        }
        await Promise.all(promises);
        //transpile any new files that plugins added since the start of this transpile process
        do {
            promises = [];
            for (const key in this.files) {
                const file = this.files[key];
                //this is a new file
                const outputPath = getOutputPath(file);
                if (!processedFiles.has(outputPath === null || outputPath === void 0 ? void 0 : outputPath.toLowerCase())) {
                    promises.push(transpileFile(file === null || file === void 0 ? void 0 : file.srcPath, outputPath));
                }
            }
            if (promises.length > 0) {
                this.logger.info(`Transpiling ${promises.length} new files`);
                await Promise.all(promises);
            }
        } while (promises.length > 0);
        this.afterProgramTranspile(entries, astEditor);
    }
    afterProgramTranspile(entries, astEditor) {
        this.plugins.emit('afterProgramTranspile', this, entries, astEditor);
        astEditor.undoAll();
    }
    /**
     * Find a list of files in the program that have a function with the given name (case INsensitive)
     */
    findFilesForFunction(functionName) {
        const files = [];
        const lowerFunctionName = functionName.toLowerCase();
        //find every file with this function defined
        for (const file of Object.values(this.files)) {
            if ((0, reflection_1.isBrsFile)(file)) {
                //TODO handle namespace-relative function calls
                //if the file has a function with this name
                if (file.parser.references.functionStatementLookup.get(lowerFunctionName) !== undefined) {
                    files.push(file);
                }
            }
        }
        return files;
    }
    /**
     * Find a list of files in the program that have a class with the given name (case INsensitive)
     */
    findFilesForClass(className) {
        const files = [];
        const lowerClassName = className.toLowerCase();
        //find every file with this class defined
        for (const file of Object.values(this.files)) {
            if ((0, reflection_1.isBrsFile)(file)) {
                //TODO handle namespace-relative classes
                //if the file has a function with this name
                if (file.parser.references.classStatementLookup.get(lowerClassName) !== undefined) {
                    files.push(file);
                }
            }
        }
        return files;
    }
    findFilesForNamespace(name) {
        const files = [];
        const lowerName = name.toLowerCase();
        //find every file with this class defined
        for (const file of Object.values(this.files)) {
            if ((0, reflection_1.isBrsFile)(file)) {
                if (file.parser.references.namespaceStatements.find((x) => {
                    const namespaceName = x.name.toLowerCase();
                    return (
                    //the namespace name matches exactly
                    namespaceName === lowerName ||
                        //the full namespace starts with the name (honoring the part boundary)
                        namespaceName.startsWith(lowerName + '.'));
                })) {
                    files.push(file);
                }
            }
        }
        return files;
    }
    findFilesForEnum(name) {
        const files = [];
        const lowerName = name.toLowerCase();
        //find every file with this class defined
        for (const file of Object.values(this.files)) {
            if ((0, reflection_1.isBrsFile)(file)) {
                if (file.parser.references.enumStatementLookup.get(lowerName)) {
                    files.push(file);
                }
            }
        }
        return files;
    }
    /**
     * Modify a parsed manifest map by reading `bs_const` and injecting values from `options.manifest.bs_const`
     * @param parsedManifest The manifest map to read from and modify
     */
    buildBsConstsIntoParsedManifest(parsedManifest) {
        var _a, _b;
        // Lift the bs_consts defined in the manifest
        let bsConsts = (0, Manifest_1.getBsConst)(parsedManifest, false);
        // Override or delete any bs_consts defined in the bs config
        for (const key in (_b = (_a = this.options) === null || _a === void 0 ? void 0 : _a.manifest) === null || _b === void 0 ? void 0 : _b.bs_const) {
            const value = this.options.manifest.bs_const[key];
            if (value === null) {
                bsConsts.delete(key);
            }
            else {
                bsConsts.set(key, value);
            }
        }
        // convert the new list of bs consts back into a string for the rest of the down stream systems to use
        let constString = '';
        for (const [key, value] of bsConsts) {
            constString += `${constString !== '' ? ';' : ''}${key}=${value.toString()}`;
        }
        // Set the updated bs_const value
        parsedManifest.set('bs_const', constString);
    }
    /**
     * Try to find and load the manifest into memory
     * @param manifestFileObj A pointer to a potential manifest file object found during loading
     * @param replaceIfAlreadyLoaded should we overwrite the internal `_manifest` if it already exists
     */
    loadManifest(manifestFileObj, replaceIfAlreadyLoaded = true) {
        //if we already have a manifest instance, and should not replace...then don't replace
        if (!replaceIfAlreadyLoaded && this._manifest) {
            return;
        }
        let manifestPath = manifestFileObj
            ? manifestFileObj.src
            : path.join(this.options.rootDir, 'manifest');
        try {
            // we only load this manifest once, so do it sync to improve speed downstream
            const contents = fsExtra.readFileSync(manifestPath, 'utf-8');
            const parsedManifest = (0, Manifest_1.parseManifest)(contents);
            this.buildBsConstsIntoParsedManifest(parsedManifest);
            this._manifest = parsedManifest;
        }
        catch (e) {
            this._manifest = new Map();
        }
    }
    /**
     * Get a map of the manifest information
     */
    getManifest() {
        if (!this._manifest) {
            this.loadManifest();
        }
        return this._manifest;
    }
    dispose() {
        this.plugins.emit('beforeProgramDispose', { program: this });
        for (let filePath in this.files) {
            this.files[filePath].dispose();
        }
        for (let name in this.scopes) {
            this.scopes[name].dispose();
        }
        this.globalScope.dispose();
        this.dependencyGraph.dispose();
    }
}
exports.Program = Program;
//# sourceMappingURL=Program.js.map
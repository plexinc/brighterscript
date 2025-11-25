"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Project = void 0;
const ProgramBuilder_1 = require("../ProgramBuilder");
const EventEmitter = require("eventemitter3");
const util_1 = require("../util");
const path = require("path");
const DiagnosticMessages_1 = require("../DiagnosticMessages");
const vscode_uri_1 = require("vscode-uri");
const deferred_1 = require("../deferred");
const roku_deploy_1 = require("roku-deploy");
const vscode_languageserver_protocol_1 = require("vscode-languageserver-protocol");
const vscode_languageserver_protocol_2 = require("vscode-languageserver-protocol");
const logging_1 = require("../logging");
const fsExtra = require("fs-extra");
class Project {
    constructor(options) {
        var _a;
        this.isStandaloneProject = false;
        /**
         * Gets resolved when the project has finished activating
         */
        this.activationDeferred = new deferred_1.Deferred();
        this.emitter = new EventEmitter();
        this.disposables = [];
        this.logger = (_a = options === null || options === void 0 ? void 0 : options.logger) !== null && _a !== void 0 ? _a : (0, logging_1.createLogger)({
            //when running inside a worker thread, we don't want to use colors
            enableColor: false
        });
    }
    /**
     * Activates this project. Every call to `activate` should completely reset the project, clear all used ram and start from scratch.
     */
    async activate(options) {
        this.logger.info(`Project.activate. projectKey: ${options.projectKey}`);
        this.activateOptions = options;
        this.projectKey = options.projectKey ? util_1.default.standardizePath(options.projectKey) : options.projectKey;
        this.projectDir = options.projectDir ? util_1.default.standardizePath(options.projectDir) : options.projectDir;
        this.workspaceFolder = options.workspaceFolder ? util_1.default.standardizePath(options.workspaceFolder) : options.workspaceFolder;
        this.projectNumber = options.projectNumber;
        this.bsconfigPath = await this.getConfigFilePath(options);
        this.builder = new ProgramBuilder_1.ProgramBuilder({
            //share our logger with ProgramBuilder, which will keep our level in sync with the one in the program
            logger: this.logger
        });
        this.builder.logger.prefix = util_1.default.getProjectLogName(this);
        this.disposables.push(this.builder);
        let cwd;
        //if the config file exists, use it and its folder as cwd
        if (this.bsconfigPath && await util_1.default.pathExists(this.bsconfigPath)) {
            cwd = path.dirname(this.bsconfigPath);
            //load the bsconfig file contents (used for performance optimizations externally)
            try {
                this.bsconfigFileContents = (await fsExtra.readFile(this.bsconfigPath)).toString();
            }
            catch (_a) { }
        }
        else {
            cwd = this.projectDir;
            //config file doesn't exist...let `brighterscript` resolve the default way
            this.bsconfigPath = undefined;
        }
        const builderOptions = {
            cwd: cwd,
            project: this.bsconfigPath,
            watch: false,
            createPackage: false,
            deploy: false,
            copyToStaging: false,
            showDiagnosticsInConsole: false,
            validate: false
        };
        //Assign .files (mostly used for standalone projects) if available, as a dedicated assignment because `undefined` overrides the default value in the `bsconfig.json`
        if (options.files) {
            builderOptions.files = roku_deploy_1.rokuDeploy.normalizeFilesArray(options.files);
        }
        //run the builder to initialize the program. Skip validation for now, we'll trigger it soon in a more cancellable way
        await this.builder.run(Object.assign(Object.assign({}, builderOptions), { validate: false, 
            //don't show diagnostics in the console since this is run via the language server, they're presented in a different way
            showDiagnosticsInConsole: false }));
        //flush diagnostics every time the program finishes validating
        //this plugin must be added LAST to the program to ensure we can see all diagnostics
        this.builder.plugins.add({
            name: 'bsc-language-server',
            afterProgramValidate: () => {
                const diagnostics = this.getDiagnostics();
                this.emit('diagnostics', {
                    diagnostics: diagnostics
                });
            }
        });
        //if we found a deprecated brsconfig.json, add a diagnostic warning the user
        if (this.bsconfigPath && path.basename(this.bsconfigPath) === 'brsconfig.json') {
            this.builder.addDiagnostic(this.bsconfigPath, Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.brsConfigJsonIsDeprecated()), { range: util_1.default.createRange(0, 0, 0, 0) }));
        }
        //trigger a validation (but don't wait for it. That way we can cancel it sooner if we get new incoming data or requests)
        void this.validate();
        this.activationDeferred.resolve();
        return {
            bsconfigPath: this.bsconfigPath,
            logLevel: this.builder.program.options.logLevel,
            rootDir: this.builder.program.options.rootDir,
            filePatterns: this.filePatterns
        };
    }
    get rootDir() {
        return this.builder.program.options.rootDir;
    }
    /**
     * The file patterns from bsconfig.json that were used to find all files for this project
     */
    get filePatterns() {
        if (!this.builder) {
            return undefined;
        }
        const patterns = roku_deploy_1.rokuDeploy.normalizeFilesArray(this.builder.program.options.files);
        return patterns.map(x => {
            return typeof x === 'string' ? x : x.src;
        });
    }
    /**
     * Promise that resolves when the project finishes activating
     * @returns a promise that resolves when the project finishes activating
     */
    whenActivated() {
        return this.activationDeferred.promise;
    }
    /**
     * Validate the project. This will trigger a full validation on any scopes that were changed since the last validation,
     * and will also eventually emit a new 'diagnostics' event that includes all diagnostics for the project.
     *
     * This will cancel any currently running validation and then run a new one.
     */
    async validate() {
        this.logger.debug('Project.validate');
        this.cancelValidate();
        //store
        this.validationCancelToken = new vscode_languageserver_protocol_2.CancellationTokenSource();
        try {
            this.emit('validate-begin', {});
            await this.builder.program.validate({
                async: true,
                cancellationToken: this.validationCancelToken.token
            });
        }
        finally {
            this.emit('validate-end', {});
        }
    }
    /**
     * Cancel any active running validation
     */
    cancelValidate() {
        var _a;
        (_a = this.validationCancelToken) === null || _a === void 0 ? void 0 : _a.cancel();
        delete this.validationCancelToken;
    }
    getDiagnostics() {
        const diagnostics = this.builder.getDiagnostics();
        return diagnostics.map(x => {
            const uri = vscode_uri_1.URI.file(x.file.srcPath).toString();
            return Object.assign(Object.assign({}, util_1.default.toDiagnostic(x, uri)), { uri: uri });
        });
    }
    /**
     * Promise that resolves the next time the system is idle. If the system is already idle, it will resolve immediately
     */
    async onIdle() {
        await Promise.all([
            this.activationDeferred.promise
        ]);
    }
    /**
     * Add or replace the in-memory contents of the file at the specified path. This is typically called as the user is typing.
     * This will cancel any pending validation cycles and queue a future validation cycle instead.
     */
    async applyFileChanges(documentActions) {
        var _a, _b;
        this.logger.debug('Project.applyFileChanges', documentActions.map(x => x.srcPath));
        await this.onIdle();
        let didChangeFiles = false;
        const result = [...documentActions];
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < result.length; i++) {
            const action = result[i];
            let didChangeThisFile = false;
            //if this is a `set` and the file matches the project's files array, set it
            if (action.type === 'set' && Project.willAcceptFile(action.srcPath, this.builder.program.options.files, this.builder.program.options.rootDir)) {
                //load the file contents from disk if we don't have an in memory copy
                const fileContents = (_a = action.fileContents) !== null && _a !== void 0 ? _a : (_b = util_1.default.readFileSync(action.srcPath)) === null || _b === void 0 ? void 0 : _b.toString();
                //if we got file contents, set the file on the program
                if (fileContents !== undefined) {
                    didChangeThisFile = this.setFile(action.srcPath, fileContents);
                    //this file was accepted by the program
                    action.status = 'accepted';
                    //if we can't get file contents, apply this as a delete
                }
                else {
                    action.status = 'accepted';
                    result.push({
                        id: action.id,
                        srcPath: action.srcPath,
                        type: 'delete',
                        status: undefined,
                        allowStandaloneProject: false
                    });
                    continue;
                }
                //try to delete the file or directory
            }
            else if (action.type === 'delete') {
                didChangeThisFile = this.removeFileOrDirectory(action.srcPath);
                //if we deleted at least one file, mark this action as accepted
                action.status = didChangeThisFile ? 'accepted' : 'rejected';
                //we did not handle this action, so reject
            }
            else {
                action.status = 'rejected';
            }
            didChangeFiles = didChangeFiles || didChangeThisFile;
        }
        if (didChangeFiles) {
            //trigger a validation (but don't wait for it. That way we can cancel it sooner if we get new incoming data or requests)
            this.validate().catch(e => this.logger.error(e));
        }
        this.logger.debug('project.applyFileChanges done', documentActions.map(x => x.srcPath));
        return result;
    }
    /**
     * Determine if this project will accept the file at the specified path (i.e. does it match a pattern in the project's files array)
     */
    static willAcceptFile(srcPath, files, rootDir) {
        srcPath = util_1.default.standardizePath(srcPath);
        if (roku_deploy_1.rokuDeploy.getDestPath(srcPath, files, rootDir) !== undefined) {
            return true;
            //is this exact path in the `files` array? (this check is mostly for standalone projects)
        }
        else if (files.find(x => (0, util_1.standardizePath) `${x.src}` === srcPath)) {
            return true;
        }
        return false;
    }
    /**
     * Set new contents for a file. This is safe to call any time. Changes will be queued and flushed at the correct times
     * during the program's lifecycle flow
     * @param srcPath absolute source path of the file
     * @param fileContents the text contents of the file
     * @returns true if this program accepted and added the file. false if the program didn't want the file, or if the contents didn't change
     */
    setFile(srcPath, fileContents) {
        this.logger.debug('Project.setFile', { srcPath: srcPath, fileContentsLength: fileContents.length });
        const { files, rootDir } = this.builder.program.options;
        //get the dest path for this file.
        let destPath = roku_deploy_1.rokuDeploy.getDestPath(srcPath, files, rootDir);
        //if we have a file and the contents haven't changed
        let file = this.builder.program.getFile(destPath);
        if (file && file.fileContents === fileContents) {
            return false;
        }
        //if we got a dest path, then the program wants this file
        if (destPath) {
            this.builder.program.setFile({
                src: srcPath,
                dest: destPath
            }, fileContents);
            return true;
        }
        return false;
    }
    /**
     * Remove the in-memory file at the specified path. This is typically called when the user (or file system watcher) triggers a file delete
     * @param srcPath absolute path to the File
     * @returns true if we found and removed at least one file, or false if no files were removed
     */
    removeFileOrDirectory(srcPath) {
        var _a;
        this.logger.debug('Project.removeFileOrDirectory', srcPath);
        srcPath = util_1.default.standardizePath(srcPath);
        //if this is a direct file match, remove the file
        if (this.builder.program.hasFile(srcPath)) {
            this.builder.program.removeFile(srcPath);
            return true;
        }
        //maybe this is a directory. Remove all files that start with this path
        let removedSomeFiles = false;
        let lowerSrcPath = srcPath.toLowerCase();
        for (let file of Object.values(this.builder.program.files)) {
            //if the file path starts with the parent path and the file path does not exactly match the folder path
            if ((_a = file.srcPath) === null || _a === void 0 ? void 0 : _a.toLowerCase().startsWith(lowerSrcPath)) {
                this.logger.debug('Project.removeFileOrDirectory removing file because it matches the given directory', { dir: srcPath, srcPath: file.srcPath });
                this.builder.program.removeFile(file.srcPath, false);
                removedSomeFiles = true;
            }
        }
        //return true if we removed at least one file
        return removedSomeFiles;
    }
    /**
     * Get the full list of semantic tokens for the given file path
     * @param options options for getting semantic tokens
     * @param options.srcPath absolute path to the source file
     */
    async getSemanticTokens(options) {
        await this.onIdle();
        if (this.builder.program.hasFile(options.srcPath)) {
            return this.builder.program.getSemanticTokens(options.srcPath);
        }
    }
    async transpileFile(options) {
        await this.onIdle();
        if (this.builder.program.hasFile(options.srcPath)) {
            return this.builder.program.getTranspiledFileContents(options.srcPath);
        }
    }
    async getHover(options) {
        await this.onIdle();
        if (this.builder.program.hasFile(options.srcPath)) {
            return this.builder.program.getHover(options.srcPath, options.position);
        }
    }
    async getDefinition(options) {
        await this.onIdle();
        if (this.builder.program.hasFile(options.srcPath)) {
            return this.builder.program.getDefinition(options.srcPath, options.position);
        }
    }
    async getSignatureHelp(options) {
        await this.onIdle();
        if (this.builder.program.hasFile(options.srcPath)) {
            return this.builder.program.getSignatureHelp(options.srcPath, options.position);
        }
    }
    async getDocumentSymbol(options) {
        await this.onIdle();
        if (this.builder.program.hasFile(options.srcPath)) {
            return this.builder.program.getDocumentSymbols(options.srcPath);
        }
    }
    async getWorkspaceSymbol() {
        await this.onIdle();
        const result = this.builder.program.getWorkspaceSymbols();
        return result;
    }
    async getReferences(options) {
        await this.onIdle();
        if (this.builder.program.hasFile(options.srcPath)) {
            return this.builder.program.getReferences(options.srcPath, options.position);
        }
    }
    async getCodeActions(options) {
        var _a;
        await this.onIdle();
        if (this.builder.program.hasFile(options.srcPath)) {
            const codeActions = this.builder.program.getCodeActions(options.srcPath, options.range);
            //clone each diagnostic since certain diagnostics can have circular reference properties that kill the language server if serialized
            for (const codeAction of codeActions !== null && codeActions !== void 0 ? codeActions : []) {
                if (codeAction.diagnostics) {
                    codeAction.diagnostics = (_a = codeAction.diagnostics) === null || _a === void 0 ? void 0 : _a.map(x => util_1.default.toDiagnostic(x, options.srcPath));
                }
            }
            return codeActions;
        }
    }
    async getCompletions(options) {
        await this.onIdle();
        this.logger.debug('Project.getCompletions', options.srcPath, options.position);
        if (this.builder.program.hasFile(options.srcPath)) {
            const completions = this.builder.program.getCompletions(options.srcPath, options.position);
            const result = vscode_languageserver_protocol_1.CompletionList.create(completions);
            result.itemDefaults = {
                commitCharacters: ['.']
            };
            return result;
        }
        return undefined;
    }
    /**
     * Find the path to the bsconfig.json file for this project
     * @returns path to bsconfig.json, or undefined if unable to find it
     */
    async getConfigFilePath(config) {
        let bsconfigPath;
        //if there's a setting, we need to find the file or show error if it can't be found
        if (config === null || config === void 0 ? void 0 : config.bsconfigPath) {
            bsconfigPath = path.resolve(config.projectDir, config.bsconfigPath);
            if (await util_1.default.pathExists(bsconfigPath)) {
                return util_1.default.standardizePath(bsconfigPath);
            }
            else {
                this.emit('critical-failure', {
                    message: `Cannot find config file specified in user or workspace settings at '${bsconfigPath}'`
                });
            }
        }
        //the rest of these require a path to a project directory, so return early if we don't have one
        if (!(config === null || config === void 0 ? void 0 : config.projectDir)) {
            return undefined;
        }
        //default to config file path found in the root of the workspace
        bsconfigPath = (0, util_1.standardizePath) `${config.projectDir}/bsconfig.json`;
        if (await util_1.default.pathExists(bsconfigPath)) {
            return util_1.default.standardizePath(bsconfigPath);
        }
        //look for the deprecated `brsconfig.json` file
        bsconfigPath = (0, util_1.standardizePath) `${config.projectDir}/brsconfig.json`;
        if (await util_1.default.pathExists(bsconfigPath)) {
            return util_1.default.standardizePath(bsconfigPath);
        }
        //no config file could be found
        return undefined;
    }
    on(eventName, handler) {
        this.emitter.on(eventName, handler);
        return () => {
            this.emitter.removeListener(eventName, handler);
        };
    }
    async emit(eventName, data) {
        //emit these events on next tick, otherwise they will be processed immediately which could cause issues
        await util_1.default.sleep(0);
        this.emitter.emit(eventName, data);
        //emit the 'all' event
        this.emitter.emit('all', eventName, data);
    }
    dispose() {
        var _a, _b, _c, _d;
        for (let disposable of (_a = this.disposables) !== null && _a !== void 0 ? _a : []) {
            (_b = disposable === null || disposable === void 0 ? void 0 : disposable.dispose) === null || _b === void 0 ? void 0 : _b.call(disposable);
        }
        this.disposables = [];
        (_c = this.emitter) === null || _c === void 0 ? void 0 : _c.removeAllListeners();
        if (((_d = this.activationDeferred) === null || _d === void 0 ? void 0 : _d.isCompleted) === false) {
            this.activationDeferred.reject(new Error('Project was disposed, activation has been cancelled'));
        }
    }
}
exports.Project = Project;
//# sourceMappingURL=Project.js.map
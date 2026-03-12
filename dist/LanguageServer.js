"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationName = exports.CustomCommands = exports.LanguageServer = void 0;
const path = require("path");
require("array-flat-polyfill");
const node_1 = require("vscode-languageserver/node");
const vscode_uri_1 = require("vscode-uri");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const util_1 = require("./util");
const DiagnosticCollection_1 = require("./DiagnosticCollection");
const SemanticTokenUtils_1 = require("./SemanticTokenUtils");
const logging_1 = require("./logging");
const ignore_1 = require("ignore");
const micromatch = require("micromatch");
const PathFilterer_1 = require("./lsp/PathFilterer");
const ProjectManager_1 = require("./lsp/ProjectManager");
const fsExtra = require("fs-extra");
const WorkerThreadProject_1 = require("./lsp/worker/WorkerThreadProject");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const isEqual = require("lodash.isequal");
class LanguageServer {
    constructor() {
        /**
         * The language server protocol connection, used to send and receive all requests and responses
         */
        this.connection = undefined;
        this.hasConfigurationCapability = false;
        /**
         * Indicates whether the client supports workspace folders
         */
        this.clientHasWorkspaceFolderCapability = false;
        /**
         * Create a simple text document manager.
         * The text document manager supports full document sync only
         */
        this.documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
        this.logger = (0, logging_1.createLogger)({
            logLevel: logging_1.LogLevel.log
        });
        this.workspaceConfigsCache = new Map();
        this.busyStatusIndex = -1;
        this.pathFiltererDisposables = [];
        this.diagnosticCollection = new DiagnosticCollection_1.DiagnosticCollection();
        (0, logging_1.setLspLoggerProps)();
        //replace the workerPool logger with our own so logging info can be synced
        WorkerThreadProject_1.workerPool.logger = this.logger.createLogger();
        this.pathFilterer = new PathFilterer_1.PathFilterer({ logger: this.logger });
        this.projectManager = new ProjectManager_1.ProjectManager({
            pathFilterer: this.pathFilterer,
            logger: this.logger.createLogger()
        });
        //anytime a project emits a collection of diagnostics, send them to the client
        this.projectManager.on('diagnostics', (event) => {
            this.logger.debug(`Received ${event.diagnostics.length} diagnostics from project ${event.project.projectNumber}`);
            this.sendDiagnostics(event).catch(logAndIgnoreError);
        });
        // Send all open document changes whenever a project is activated. This is necessary because at project startup, the project loads files from disk
        // and may not have the latest unsaved file changes. Any existing projects that already use these files will just ignore the changes
        // because the file contents haven't changed.
        this.projectManager.on('project-activate', (event) => {
            //keep logLevel in sync with the most verbose log level found across all projects
            this.syncLogLevel().catch(logAndIgnoreError);
            //resend all open document changes
            const documents = [...this.documents.all()];
            if (documents.length > 0) {
                this.logger.log(`[${util_1.util.getProjectLogName(event.project)}] loaded or changed. Resending all open document changes.`, documents.map(x => x.uri));
                for (const document of this.documents.all()) {
                    this.onTextDocumentDidChangeContent({
                        document: document
                    }).catch(logAndIgnoreError);
                }
            }
        });
        this.projectManager.busyStatusTracker.on('active-runs-change', (event) => {
            this.sendBusyStatus();
        });
    }
    //run the server
    run() {
        var _a;
        // Create a connection for the server. The connection uses Node's IPC as a transport.
        this.connection = this.establishConnection();
        //disable logger colors when running in LSP mode
        logging_1.logger.enableColor = false;
        //listen to all of the output log events and pipe them into the debug channel in the extension
        this.loggerSubscription = logging_1.logger.subscribe((message) => {
            this.connection.tracer.log(message.argsText);
        });
        //bind all our on* methods that share the same name from connection
        for (const name of Object.getOwnPropertyNames(LanguageServer.prototype)) {
            if (/on+/.test(name) && typeof ((_a = this.connection) === null || _a === void 0 ? void 0 : _a[name]) === 'function') {
                this.connection[name](this[name].bind(this));
            }
        }
        //Register semantic token requests. TODO switch to a more specific connection function call once they actually add it
        this.connection.onRequest(node_1.SemanticTokensRequest.method, this.onFullSemanticTokens.bind(this));
        // The content of a text document has changed. This event is emitted
        // when the text document is first opened, when its content has changed,
        // or when document is closed without saving (original contents are sent as a change)
        //
        this.documents.onDidChangeContent(this.onTextDocumentDidChangeContent.bind(this));
        //whenever a document gets closed
        this.documents.onDidClose(this.onDocumentClose.bind(this));
        // listen for open, change and close text document events
        this.documents.listen(this.connection);
        // Listen on the connection
        this.connection.listen();
    }
    /**
     * Called when the client starts initialization
     */
    onInitialize(params) {
        let clientCapabilities = params.capabilities;
        // Does the client support the `workspace/configuration` request?
        // If not, we will fall back using global settings
        this.hasConfigurationCapability = !!(clientCapabilities.workspace && !!clientCapabilities.workspace.configuration);
        this.clientHasWorkspaceFolderCapability = !!(clientCapabilities.workspace && !!clientCapabilities.workspace.workspaceFolders);
        //return the capabilities of the server
        return {
            capabilities: {
                textDocumentSync: node_1.TextDocumentSyncKind.Full,
                // Tell the client that the server supports code completion
                completionProvider: {
                    resolveProvider: false,
                    //anytime the user types a period, auto-show the completion results
                    triggerCharacters: ['.'],
                    allCommitCharacters: ['.', '@']
                },
                documentSymbolProvider: true,
                workspaceSymbolProvider: true,
                semanticTokensProvider: {
                    legend: SemanticTokenUtils_1.semanticTokensLegend,
                    full: true
                },
                referencesProvider: true,
                codeActionProvider: {
                    codeActionKinds: [node_1.CodeActionKind.Refactor]
                },
                signatureHelpProvider: {
                    triggerCharacters: ['(', ',']
                },
                definitionProvider: true,
                hoverProvider: true,
                executeCommandProvider: {
                    commands: [
                        CustomCommands.TranspileFile
                    ]
                }
            }
        };
    }
    /**
     * Called when the client has finished initializing
     */
    async onInitialized() {
        this.logger.log('onInitialized');
        //cache a copy of all workspace configurations to use for comparison later
        this.workspaceConfigsCache = new Map((await this.getWorkspaceConfigs()).map(x => [x.workspaceFolder, x]));
        //set our logger to the most verbose logLevel found across any project
        await this.syncLogLevel();
        try {
            if (this.hasConfigurationCapability) {
                // register for when the user changes workspace or user settings
                await this.connection.client.register(node_1.DidChangeConfigurationNotification.type, {
                    //we only care about when these settings sections change
                    section: [
                        'brightscript',
                        'files'
                    ]
                });
            }
            //populate the path filterer with the client's include/exclude lists
            await this.rebuildPathFilterer();
            await this.syncProjects();
            if (this.clientHasWorkspaceFolderCapability) {
                //if the client changes their workspaces, we need to get our projects in sync
                this.connection.workspace.onDidChangeWorkspaceFolders(async (evt) => {
                    await this.syncProjects();
                });
            }
        }
        catch (e) {
            this.sendCriticalFailure(`Critical failure during BrighterScript language server startup.
                Please file a github issue and include the contents of the 'BrighterScript Language Server' output channel.

                Error message: ${e.message}`);
            throw e;
        }
    }
    /**
     * Set our logLevel to the most verbose log level found across all projects and workspaces
     */
    async syncLogLevel() {
        var _a, _b;
        /**
         * helper to get the logLevel from a list of items and return the item and level (if found), or undefined if not
         */
        const getLogLevel = async (items, fetcher) => {
            const logLevels = await Promise.all(items.map(async (item) => {
                let value = await fetcher(item);
                //force string values to lower case (so we can support things like 'log' or 'Log' or 'LOG')
                if (typeof value === 'string') {
                    value = value.toLowerCase();
                }
                const logLevelNumeric = this.logger.getLogLevelNumeric(value);
                if (typeof logLevelNumeric === 'number') {
                    return logLevelNumeric;
                }
                else {
                    return -1;
                }
            }));
            let idx = logLevels.findIndex(x => x > -1);
            if (idx > -1) {
                const mostVerboseLogLevel = Math.max(...logLevels);
                return {
                    logLevel: mostVerboseLogLevel,
                    logLevelText: this.logger.getLogLevelText(mostVerboseLogLevel),
                    //find the first item having the most verbose logLevel
                    item: items[logLevels.findIndex(x => x === mostVerboseLogLevel)]
                };
            }
        };
        const workspaces = await this.getWorkspaceConfigs();
        let workspaceResult = await getLogLevel(workspaces, workspace => { var _a; return (_a = workspace === null || workspace === void 0 ? void 0 : workspace.languageServer) === null || _a === void 0 ? void 0 : _a.logLevel; });
        if (workspaceResult) {
            this.logger.info(`Setting global logLevel to '${workspaceResult.logLevelText}' based on configuration from workspace '${(_a = workspaceResult === null || workspaceResult === void 0 ? void 0 : workspaceResult.item) === null || _a === void 0 ? void 0 : _a.workspaceFolder}'`);
            this.logger.logLevel = workspaceResult.logLevel;
            return;
        }
        let projectResult = await getLogLevel(this.projectManager.projects, (project) => project.logger.logLevel);
        if (projectResult) {
            this.logger.info(`Setting global logLevel to '${projectResult.logLevelText}' based on project #${(_b = projectResult === null || projectResult === void 0 ? void 0 : projectResult.item) === null || _b === void 0 ? void 0 : _b.projectNumber}`);
            this.logger.logLevel = projectResult.logLevel;
            return;
        }
        //use a default level if no other level was found
        this.logger.logLevel = logging_1.LogLevel.log;
    }
    async onTextDocumentDidChangeContent(event) {
        this.logger.debug('onTextDocumentDidChangeContent', event.document.uri);
        await this.projectManager.handleFileChanges([{
                srcPath: vscode_uri_1.URI.parse(event.document.uri).fsPath,
                type: node_1.FileChangeType.Changed,
                fileContents: event.document.getText(),
                allowStandaloneProject: true
            }]);
    }
    /**
     * Called when watched files changed (add/change/delete).
     * The CLIENT is in charge of what files to watch, so all client
     * implementations should ensure that all valid project
     * file types are watched (.brs,.bs,.xml,manifest, and any json/text/image files)
     */
    async onDidChangeWatchedFiles(params) {
        const workspacePaths = (await this.connection.workspace.getWorkspaceFolders()).map(x => util_1.util.uriToPath(x.uri));
        let changes = params.changes
            .map(x => ({
            srcPath: util_1.util.uriToPath(x.uri),
            type: x.type,
            //if this is an open document, allow this file to be loaded in a standalone project (if applicable)
            allowStandaloneProject: this.documents.get(x.uri) !== undefined
        }))
            //exclude all explicit top-level workspace folder paths (to fix a weird macos fs watcher bug that emits events for the workspace folder itself)
            .filter(x => !workspacePaths.includes(x.srcPath));
        this.logger.debug('onDidChangeWatchedFiles', changes);
        //if the client changed any files containing include/exclude patterns, rebuild the path filterer before processing these changes
        if (micromatch.some(changes.map(x => x.srcPath), [
            '**/.gitignore',
            '**/.vscode/settings.json',
            '**/*bsconfig*.json'
        ], {
            dot: true
        })) {
            await this.rebuildPathFilterer();
        }
        //handle the file changes
        await this.projectManager.handleFileChanges(changes);
    }
    async onDocumentClose(event) {
        this.logger.debug('onDocumentClose', event.document.uri);
        await this.projectManager.handleFileClose({
            srcPath: util_1.util.uriToPath(event.document.uri)
        });
    }
    /**
     * Provide a list of completion items based on the current cursor position
     */
    async onCompletion(params, cancellationToken, workDoneProgress, resultProgress) {
        this.logger.debug('onCompletion', params, cancellationToken);
        const srcPath = util_1.util.uriToPath(params.textDocument.uri);
        const completions = await this.projectManager.getCompletions({
            srcPath: srcPath,
            position: params.position,
            cancellationToken: cancellationToken
        });
        return completions;
    }
    /**
     * Get a list of workspaces, and their configurations.
     * Get only the settings for the workspace that are relevant to the language server. We do this so we can cache this object for use in change detection in the future.
     */
    async getWorkspaceConfigs() {
        var _a;
        //get all workspace folders (we'll use these to get settings)
        let workspaces = await Promise.all(((_a = await this.connection.workspace.getWorkspaceFolders()) !== null && _a !== void 0 ? _a : []).map(async (x) => {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            const workspaceFolder = util_1.util.uriToPath(x.uri);
            const brightscriptConfig = await this.getClientConfiguration(x.uri, 'brightscript');
            return {
                workspaceFolder: workspaceFolder,
                excludePatterns: await this.getWorkspaceExcludeGlobs(workspaceFolder),
                projects: this.normalizeProjectPaths(workspaceFolder, brightscriptConfig === null || brightscriptConfig === void 0 ? void 0 : brightscriptConfig.projects),
                languageServer: {
                    enableThreading: (_b = (_a = brightscriptConfig === null || brightscriptConfig === void 0 ? void 0 : brightscriptConfig.languageServer) === null || _a === void 0 ? void 0 : _a.enableThreading) !== null && _b !== void 0 ? _b : LanguageServer.enableThreadingDefault,
                    enableProjectDiscovery: (_d = (_c = brightscriptConfig === null || brightscriptConfig === void 0 ? void 0 : brightscriptConfig.languageServer) === null || _c === void 0 ? void 0 : _c.enableProjectDiscovery) !== null && _d !== void 0 ? _d : LanguageServer.enableProjectDiscoveryDefault,
                    projectDiscoveryMaxDepth: (_f = (_e = brightscriptConfig === null || brightscriptConfig === void 0 ? void 0 : brightscriptConfig.languageServer) === null || _e === void 0 ? void 0 : _e.projectDiscoveryMaxDepth) !== null && _f !== void 0 ? _f : 15,
                    projectDiscoveryExclude: (_g = brightscriptConfig === null || brightscriptConfig === void 0 ? void 0 : brightscriptConfig.languageServer) === null || _g === void 0 ? void 0 : _g.projectDiscoveryExclude,
                    logLevel: (_h = brightscriptConfig === null || brightscriptConfig === void 0 ? void 0 : brightscriptConfig.languageServer) === null || _h === void 0 ? void 0 : _h.logLevel
                }
            };
        }));
        return workspaces;
    }
    /**
     * Extract project paths from settings' projects list, expanding the workspaceFolder variable if necessary
     */
    normalizeProjectPaths(workspaceFolder, projects) {
        return projects === null || projects === void 0 ? void 0 : projects.reduce((acc, project) => {
            if (typeof project === 'string') {
                acc.push({ path: project });
            }
            else if (typeof project.path === 'string') {
                acc.push(project);
            }
            return acc;
        }, []).map(project => (Object.assign(Object.assign({}, project), { 
            // eslint-disable-next-line no-template-curly-in-string
            path: util_1.util.standardizePath(project.path.replace('${workspaceFolder}', workspaceFolder)) })));
    }
    async onDidChangeConfiguration(args) {
        this.logger.log('onDidChangeConfiguration', 'Reloading all projects');
        const configs = new Map((await this.getWorkspaceConfigs()).map(x => [x.workspaceFolder, x]));
        //find any changed configs. This includes newly created workspaces, deleted workspaces, etc.
        //TODO: enhance this to only reload specific projects, depending on the change
        if (!isEqual(configs, this.workspaceConfigsCache)) {
            //now that we've processed any config diffs, update the cached copy of them
            this.workspaceConfigsCache = configs;
            //if configuration changed, rebuild the path filterer
            await this.rebuildPathFilterer();
            //if the user changes any user/workspace config settings, just mass-reload all projects
            await this.syncProjects(true);
        }
    }
    async onHover(params) {
        this.logger.debug('onHover', params);
        const srcPath = util_1.util.uriToPath(params.textDocument.uri);
        const result = await this.projectManager.getHover({ srcPath: srcPath, position: params.position });
        return result;
    }
    async onWorkspaceSymbol(params) {
        this.logger.debug('onWorkspaceSymbol', params);
        const result = await this.projectManager.getWorkspaceSymbol();
        return result;
    }
    async onDocumentSymbol(params) {
        this.logger.debug('onDocumentSymbol', params);
        const srcPath = util_1.util.uriToPath(params.textDocument.uri);
        const result = await this.projectManager.getDocumentSymbol({ srcPath: srcPath });
        return result;
    }
    async onDefinition(params) {
        this.logger.debug('onDefinition', params);
        const srcPath = util_1.util.uriToPath(params.textDocument.uri);
        const result = this.projectManager.getDefinition({ srcPath: srcPath, position: params.position });
        return result;
    }
    async onSignatureHelp(params) {
        this.logger.debug('onSignatureHelp', params);
        const srcPath = util_1.util.uriToPath(params.textDocument.uri);
        const result = await this.projectManager.getSignatureHelp({ srcPath: srcPath, position: params.position });
        if (result) {
            return result;
        }
        else {
            return {
                signatures: [],
                activeSignature: null,
                activeParameter: null
            };
        }
    }
    async onReferences(params) {
        this.logger.debug('onReferences', params);
        const srcPath = util_1.util.uriToPath(params.textDocument.uri);
        const result = await this.projectManager.getReferences({ srcPath: srcPath, position: params.position });
        return result !== null && result !== void 0 ? result : [];
    }
    async onFullSemanticTokens(params) {
        this.logger.debug('onFullSemanticTokens', params);
        const srcPath = util_1.util.uriToPath(params.textDocument.uri);
        const result = await this.projectManager.getSemanticTokens({ srcPath: srcPath });
        return {
            data: (0, SemanticTokenUtils_1.encodeSemanticTokens)(result)
        };
    }
    async onCodeAction(params) {
        this.logger.debug('onCodeAction', params);
        const srcPath = util_1.util.uriToPath(params.textDocument.uri);
        const result = await this.projectManager.getCodeActions({ srcPath: srcPath, range: params.range });
        return result;
    }
    async onExecuteCommand(params) {
        this.logger.debug('onExecuteCommand', params);
        if (params.command === CustomCommands.TranspileFile) {
            const args = {
                srcPath: params.arguments[0]
            };
            const result = await this.projectManager.transpileFile(args);
            //back-compat: include `pathAbsolute` property so older vscode versions still work
            result.pathAbsolute = result.srcPath;
            return result;
        }
    }
    /**
     * Establish a connection to the client if not already connected
     */
    establishConnection() {
        if (!this.connection) {
            this.connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
        }
        return this.connection;
    }
    /**
     * Send a new busy status notification to the client based on the current busy status
     */
    sendBusyStatus() {
        var _a;
        this.busyStatusIndex = ++this.busyStatusIndex <= 0 ? 0 : this.busyStatusIndex;
        (_a = this.connection.sendNotification(NotificationName.busyStatus, {
            status: this.projectManager.busyStatusTracker.status,
            timestamp: Date.now(),
            index: this.busyStatusIndex,
            activeRuns: [
                //extract only specific information from the active run so we know what's going on
                ...this.projectManager.busyStatusTracker.activeRuns.map(x => ({
                    scope: util_1.util.getProjectLogName(x.scope),
                    label: x.label,
                    startTime: x.startTime.getTime()
                }))
            ]
        })) === null || _a === void 0 ? void 0 : _a.catch(logAndIgnoreError);
    }
    /**
     * Populate the path filterer with the client's include/exclude lists and the projects include lists
     * @returns the instance of the path filterer
     */
    async rebuildPathFilterer() {
        var _a;
        //dispose of any previous pathFilterer disposables
        (_a = this.pathFiltererDisposables) === null || _a === void 0 ? void 0 : _a.forEach(dispose => dispose());
        //keep track of all the pathFilterer disposables so we can dispose them later
        this.pathFiltererDisposables = [];
        const workspaceConfigs = await this.getWorkspaceConfigs();
        await Promise.all(workspaceConfigs.map(async (workspaceConfig) => {
            const rootDir = util_1.util.uriToPath(workspaceConfig.workspaceFolder);
            //always exclude everything from these common folders
            this.pathFiltererDisposables.push(this.pathFilterer.registerExcludeList(rootDir, [
                '**/node_modules/**/*',
                '**/.git/**/*',
                'out/**/*',
                '**/.roku-deploy-staging/**/*'
            ]));
            //get any `files.exclude` patterns from the client from this workspace
            this.pathFiltererDisposables.push(this.pathFilterer.registerExcludeList(rootDir, workspaceConfig.excludePatterns));
            //get any .gitignore patterns from the client from this workspace
            const gitignorePath = path.resolve(rootDir, '.gitignore');
            if (await fsExtra.pathExists(gitignorePath)) {
                const matcher = (0, ignore_1.default)({ ignoreCase: true }).add(fsExtra.readFileSync(gitignorePath).toString());
                this.pathFiltererDisposables.push(this.pathFilterer.registerExcludeMatcher((p) => {
                    const relPath = path.relative(rootDir, p);
                    if (ignore_1.default.isPathValid(relPath)) {
                        return matcher.test(relPath).ignored;
                    }
                    else {
                        //we do not have a valid relative path, so we cannot determine if it is ignored...thus it is NOT ignored
                        return false;
                    }
                }));
            }
        }));
        this.logger.log('pathFilterer successfully reconstructed');
        return this.pathFilterer;
    }
    /**
     * Ask the client for the list of `files.exclude` and `files.watcherExclude` patterns. Useful when determining if we should process a file
     */
    async getWorkspaceExcludeGlobs(workspaceFolder) {
        var _a;
        const filesConfig = await this.getClientConfiguration(workspaceFolder, 'files');
        const searchConfig = await this.getClientConfiguration(workspaceFolder, 'search');
        const languageServerConfig = await this.getClientConfiguration(workspaceFolder, 'brightscript');
        return [
            ...this.extractExcludes(filesConfig === null || filesConfig === void 0 ? void 0 : filesConfig.exclude),
            ...this.extractExcludes(filesConfig === null || filesConfig === void 0 ? void 0 : filesConfig.watcherExclude),
            ...this.extractExcludes(searchConfig === null || searchConfig === void 0 ? void 0 : searchConfig.exclude),
            ...this.extractExcludes((_a = languageServerConfig === null || languageServerConfig === void 0 ? void 0 : languageServerConfig.languageServer) === null || _a === void 0 ? void 0 : _a.projectDiscoveryExclude)
        ];
    }
    extractExcludes(exclude) {
        //if the exclude is not defined, return an empty array
        if (!exclude) {
            return [];
        }
        return Object
            .keys(exclude)
            .filter(x => exclude[x])
            //vscode files.exclude patterns support ignoring folders without needing to add `**/*`. So for our purposes, we need to
            //append **/* to everything without a file extension or magic at the end
            .map(pattern => {
            const result = [
                //send the pattern as-is (this handles weird cases and exact file matches)
                pattern
            ];
            //treat the pattern as a directory (no harm in doing this because if it's a file, the pattern will just never match anything)
            if (!pattern.endsWith('/**/*')) {
                result.push(`${pattern}/**/*`);
            }
            return result;
        })
            .flat(1);
    }
    /**
     * Ask the project manager to sync all projects found within the list of workspaces
     * @param forceReload if true, all projects are discarded and recreated from scratch
     */
    async syncProjects(forceReload = false) {
        const workspaces = await this.getWorkspaceConfigs();
        await this.projectManager.syncProjects(workspaces, forceReload);
        //set our logLevel to the most verbose log level found across all projects and workspaces
        await this.syncLogLevel();
    }
    /**
     * Given a workspaceFolder path, get the specified configuration from the client (if applicable).
     * Be sure to use optional chaining to traverse the result in case that configuration doesn't exist or the client doesn't support `getConfiguration`
     * @param workspaceFolder the folder for the workspace in the client
     */
    async getClientConfiguration(workspaceFolder, section) {
        const scopeUri = util_1.util.pathToUri(workspaceFolder);
        let config = {};
        //if the client supports configuration, look for config group called "brightscript"
        if (this.hasConfigurationCapability) {
            config = await this.connection.workspace.getConfiguration({
                scopeUri: scopeUri,
                section: section
            });
        }
        return config;
    }
    /**
     * Send a critical failure notification to the client, which should show a notification of some kind
     */
    sendCriticalFailure(message) {
        this.connection.sendNotification('critical-failure', message).catch(logAndIgnoreError);
    }
    /**
     * Send diagnostics to the client
     */
    async sendDiagnostics(options) {
        const patch = this.diagnosticCollection.getPatch(options.project.projectNumber, options.diagnostics);
        await Promise.all(Object.keys(patch).map(async (srcPath) => {
            const uri = vscode_uri_1.URI.file(srcPath).toString();
            const diagnostics = patch[srcPath].map(d => util_1.util.toDiagnostic(d, uri));
            await this.connection.sendDiagnostics({
                uri: uri,
                diagnostics: diagnostics
            });
        }));
    }
    dispose() {
        var _a, _b, _c;
        (_a = this.loggerSubscription) === null || _a === void 0 ? void 0 : _a.call(this);
        (_c = (_b = this.projectManager) === null || _b === void 0 ? void 0 : _b.dispose) === null || _c === void 0 ? void 0 : _c.call(_b);
    }
}
/**
 * The default threading setting for the language server. Can be overridden by per-workspace settings
 */
LanguageServer.enableThreadingDefault = true;
/**
 * The default project discovery setting for the language server. Can be overridden by per-workspace settings
 */
LanguageServer.enableProjectDiscoveryDefault = true;
__decorate([
    AddStackToErrorMessage
], LanguageServer.prototype, "onInitialize", null);
__decorate([
    AddStackToErrorMessage
], LanguageServer.prototype, "onInitialized", null);
__decorate([
    AddStackToErrorMessage
], LanguageServer.prototype, "onTextDocumentDidChangeContent", null);
__decorate([
    AddStackToErrorMessage
], LanguageServer.prototype, "onDidChangeWatchedFiles", null);
__decorate([
    AddStackToErrorMessage
], LanguageServer.prototype, "onDocumentClose", null);
__decorate([
    AddStackToErrorMessage
], LanguageServer.prototype, "onCompletion", null);
__decorate([
    AddStackToErrorMessage
], LanguageServer.prototype, "onDidChangeConfiguration", null);
__decorate([
    AddStackToErrorMessage
], LanguageServer.prototype, "onHover", null);
__decorate([
    AddStackToErrorMessage
], LanguageServer.prototype, "onWorkspaceSymbol", null);
__decorate([
    AddStackToErrorMessage
], LanguageServer.prototype, "onDocumentSymbol", null);
__decorate([
    AddStackToErrorMessage
], LanguageServer.prototype, "onDefinition", null);
__decorate([
    AddStackToErrorMessage
], LanguageServer.prototype, "onSignatureHelp", null);
__decorate([
    AddStackToErrorMessage
], LanguageServer.prototype, "onReferences", null);
__decorate([
    AddStackToErrorMessage
], LanguageServer.prototype, "onFullSemanticTokens", null);
__decorate([
    AddStackToErrorMessage
], LanguageServer.prototype, "onCodeAction", null);
__decorate([
    AddStackToErrorMessage
], LanguageServer.prototype, "onExecuteCommand", null);
exports.LanguageServer = LanguageServer;
var CustomCommands;
(function (CustomCommands) {
    CustomCommands["TranspileFile"] = "TranspileFile";
})(CustomCommands = exports.CustomCommands || (exports.CustomCommands = {}));
var NotificationName;
(function (NotificationName) {
    NotificationName["busyStatus"] = "busyStatus";
})(NotificationName = exports.NotificationName || (exports.NotificationName = {}));
/**
 * Wraps a method. If there's an error (either sync or via a promise),
 * this appends the error's stack trace at the end of the error message so that the connection will
 */
function AddStackToErrorMessage(target, propertyKey, descriptor) {
    let originalMethod = descriptor.value;
    //wrapping the original method
    descriptor.value = function value(...args) {
        try {
            let result = originalMethod.apply(this, args);
            //if the result looks like a promise, log if there's a rejection
            if (result === null || result === void 0 ? void 0 : result.then) {
                return Promise.resolve(result).catch((e) => {
                    if (e === null || e === void 0 ? void 0 : e.stack) {
                        e.message = e.stack;
                    }
                    return Promise.reject(e);
                });
            }
            else {
                return result;
            }
        }
        catch (e) {
            if (e === null || e === void 0 ? void 0 : e.stack) {
                e.message = e.stack;
            }
            throw e;
        }
    };
}
function logAndIgnoreError(error) {
    if (error === null || error === void 0 ? void 0 : error.stack) {
        error.message = error.stack;
    }
    console.error(error);
}
//# sourceMappingURL=LanguageServer.js.map
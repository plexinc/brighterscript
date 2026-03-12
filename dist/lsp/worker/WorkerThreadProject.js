"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerThreadProject = exports.workerPool = void 0;
const EventEmitter = require("eventemitter3");
const worker_threads_1 = require("worker_threads");
const MessageHandler_1 = require("./MessageHandler");
const util_1 = require("../../util");
const WorkerPool_1 = require("./WorkerPool");
const deferred_1 = require("../../deferred");
const logging_1 = require("../../logging");
const fsExtra = require("fs-extra");
const path = require("path");
const util_2 = require("../../util");
exports.workerPool = new WorkerPool_1.WorkerPool(() => {
    var _a;
    //construct the path to the `./run.ts` (or `./run.js`) script in this same directory
    const runScriptPath = (0, util_2.standardizePath) `${__dirname}/run${path.extname(__filename)}`;
    // Prepare execArgv for debugging support
    const execArgv = [];
    // Add ts-node if we're running TypeScript
    if (/\.ts$/i.test(runScriptPath)) {
        execArgv.push('--require', 'ts-node/register');
    }
    // Enable debugging for worker threads if the main process is being debugged
    // Check if debugging is enabled via execArgv or environment variables
    const isDebugging = process.execArgv.some(arg => arg.startsWith('--inspect')) || ((_a = process.env.NODE_OPTIONS) === null || _a === void 0 ? void 0 : _a.includes('--inspect'));
    if (isDebugging) {
        // Node.js will automatically assign a unique port for each worker when using --inspect=0
        // This allows VSCode to automatically attach to worker threads
        execArgv.push('--inspect=0');
    }
    return new worker_threads_1.Worker(runScriptPath, {
        execArgv: execArgv.length > 0 ? execArgv : undefined
    });
});
class WorkerThreadProject {
    constructor(options) {
        var _a;
        this.isStandaloneProject = false;
        this.activationDeferred = new deferred_1.Deferred();
        this.emitter = new EventEmitter();
        this.disposables = [];
        this.logger = (_a = options === null || options === void 0 ? void 0 : options.logger) !== null && _a !== void 0 ? _a : (0, logging_1.createLogger)();
    }
    async activate(options) {
        var _a;
        this.activateOptions = options;
        this.bsconfigPath = options.bsconfigPath ? util_1.default.standardizePath(options.bsconfigPath) : options.bsconfigPath;
        this.projectDir = options.projectDir ? util_1.default.standardizePath(options.projectDir) : options.projectDir;
        this.projectKey = options.projectKey ? util_1.default.standardizePath(options.projectKey) : (_a = options.bsconfigPath) !== null && _a !== void 0 ? _a : options.projectDir;
        this.workspaceFolder = options.workspaceFolder ? util_1.default.standardizePath(options.workspaceFolder) : options.workspaceFolder;
        this.projectNumber = options.projectNumber;
        // start a new worker thread or get an unused existing thread
        this.worker = exports.workerPool.getWorker();
        this.messageHandler = new MessageHandler_1.MessageHandler({
            name: 'MainThread',
            port: this.worker,
            onRequest: this.processRequest.bind(this),
            onUpdate: this.processUpdate.bind(this)
        });
        this.disposables.push(this.messageHandler);
        const activateResponse = await this.messageHandler.sendRequest('activate', { data: [options] });
        this.bsconfigPath = activateResponse.data.bsconfigPath;
        this.rootDir = activateResponse.data.rootDir;
        this.filePatterns = activateResponse.data.filePatterns;
        this.logger.logLevel = activateResponse.data.logLevel;
        //load the bsconfig file contents (used for performance optimizations externally)
        try {
            this.bsconfigFileContents = (await fsExtra.readFile(this.bsconfigPath)).toString();
        }
        catch (_b) { }
        this.activationDeferred.resolve();
        return activateResponse.data;
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
     * and will also eventually emit a new 'diagnostics' event that includes all diagnostics for the project
     */
    async validate() {
        const response = await this.messageHandler.sendRequest('validate');
        return response.data;
    }
    /**
     * Cancel any active validation that's running
     */
    async cancelValidate() {
        const response = await this.messageHandler.sendRequest('cancelValidate');
        return response.data;
    }
    async getDiagnostics() {
        const response = await this.messageHandler.sendRequest('getDiagnostics');
        return response.data;
    }
    /**
     * Apply a series of file changes to the project. This is safe to call any time. Changes will be queued and flushed at the correct times
     * during the program's lifecycle flow
     */
    async applyFileChanges(documentActions) {
        const response = await this.messageHandler.sendRequest('applyFileChanges', {
            data: [documentActions]
        });
        return response.data;
    }
    /**
     * Send a request with the standard structure
     * @param name the name of the request
     * @param data the array of data to send
     * @returns the response from the request
     */
    async sendStandardRequest(name, ...data) {
        const response = await this.messageHandler.sendRequest(name, {
            data: data
        });
        return response.data;
    }
    /**
     * Get the full list of semantic tokens for the given file path
     */
    async getSemanticTokens(options) {
        return this.sendStandardRequest('getSemanticTokens', options);
    }
    async transpileFile(options) {
        return this.sendStandardRequest('transpileFile', options);
    }
    async getHover(options) {
        return this.sendStandardRequest('getHover', options);
    }
    async getDefinition(options) {
        return this.sendStandardRequest('getDefinition', options);
    }
    async getSignatureHelp(options) {
        return this.sendStandardRequest('getSignatureHelp', options);
    }
    async getDocumentSymbol(options) {
        return this.sendStandardRequest('getDocumentSymbol', options);
    }
    async getWorkspaceSymbol() {
        return this.sendStandardRequest('getWorkspaceSymbol');
    }
    async getReferences(options) {
        return this.sendStandardRequest('getReferences', options);
    }
    async getCodeActions(options) {
        return this.sendStandardRequest('getCodeActions', options);
    }
    async getCompletions(options) {
        return this.sendStandardRequest('getCompletions', options);
    }
    processRequest(request) {
    }
    processUpdate(update) {
        //for now, all updates are treated like "events"
        this.emit(update.name, update.data);
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
        var _a, _b, _c;
        for (let disposable of (_a = this.disposables) !== null && _a !== void 0 ? _a : []) {
            (_b = disposable === null || disposable === void 0 ? void 0 : disposable.dispose) === null || _b === void 0 ? void 0 : _b.call(disposable);
        }
        this.disposables = [];
        //move the worker back to the pool so it can be used again
        if (this.worker) {
            exports.workerPool.releaseWorker(this.worker);
        }
        (_c = this.emitter) === null || _c === void 0 ? void 0 : _c.removeAllListeners();
    }
}
exports.WorkerThreadProject = WorkerThreadProject;
//# sourceMappingURL=WorkerThreadProject.js.map
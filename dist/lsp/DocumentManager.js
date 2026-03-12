"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentManager = void 0;
const EventEmitter = require("eventemitter3");
const util_1 = require("../util");
/**
 * Maintains a queued/buffered list of file operations. These operations don't actually do anything on their own.
 * You need to call the .apply() function and provide an action to operate on them.
 */
class DocumentManager {
    constructor(options) {
        this.options = options;
        this.queue = new Map();
        this.isFlushRunning = false;
        this.emitter = new EventEmitter();
    }
    throttle() {
        if (this.timeoutHandle) {
            clearTimeout(this.timeoutHandle);
        }
        this.timeoutHandle = setTimeout(() => {
            void this.flush();
        }, this.options.delay);
    }
    /**
     * Add/set the contents of a file
     */
    set(options) {
        var _a;
        const srcPath = util_1.default.standardizePath(options.srcPath);
        if (this.queue.has(srcPath)) {
            this.queue.delete(srcPath);
        }
        this.queue.set(srcPath, {
            type: 'set',
            srcPath: srcPath,
            fileContents: options.fileContents,
            allowStandaloneProject: (_a = options.allowStandaloneProject) !== null && _a !== void 0 ? _a : false
        });
        //schedule a future flush
        this.throttle();
    }
    /**
     * Delete a file or directory. If a directory is provided, all pending changes within that directory will be discarded
     * and only the delete action will be queued
     */
    delete(srcPath) {
        srcPath = util_1.default.standardizePath(srcPath);
        //remove any pending action with this exact path
        this.queue.delete(srcPath);
        //we can't tell if this a directory, so just remove all pending changes for files that start with this path
        for (const key of this.queue.keys()) {
            if (key.startsWith(srcPath)) {
                this.queue.delete(key);
            }
        }
        //register this delete
        this.queue.set(srcPath, { type: 'delete', srcPath: srcPath });
        //schedule a future flush
        this.throttle();
    }
    async flush() {
        var _a, _b;
        //if we're already running a flush, don't run another
        if (this.isFlushRunning) {
            return;
        }
        this.isFlushRunning = true;
        while (this.queue.size > 0) {
            try {
                const event = {
                    actions: [...this.queue.values()]
                };
                this.queue.clear();
                await ((_b = (_a = this.options).flushHandler) === null || _b === void 0 ? void 0 : _b.call(_a, event));
            }
            catch (e) {
                console.error(e);
            }
        }
        this.emitSync('flush');
        this.isFlushRunning = false;
    }
    /**
     * Is the manager settled (i.e. no pending files, all files have been fully flushed)
     */
    get isIdle() {
        return this.queue.size === 0 && this.isFlushRunning === false;
    }
    /**
     * Returns a promise that resolves when there are no pending files and no active flushes are running. Will immediately resolve if there are no files,
     * and will wait until files are flushed if there are files.
     */
    async onIdle() {
        while (!this.isIdle) {
            await this.once('flush');
        }
    }
    once(eventName) {
        return new Promise((resolve) => {
            const off = this.on(eventName, (data) => {
                off();
                resolve(data);
            });
        });
    }
    on(eventName, handler) {
        this.emitter.on(eventName, handler);
        return () => {
            this.emitter.removeListener(eventName, handler);
        };
    }
    emitSync(eventName, data) {
        this.emitter.emit(eventName, data);
    }
    dispose() {
        this.queue = new Map();
        this.emitter.removeAllListeners();
    }
}
exports.DocumentManager = DocumentManager;
//# sourceMappingURL=DocumentManager.js.map
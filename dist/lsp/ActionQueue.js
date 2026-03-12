"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionQueue = void 0;
const vscode_languageserver_protocol_1 = require("vscode-languageserver-protocol");
const deferred_1 = require("../deferred");
const safeJsonStringify = require("safe-json-stringify");
const eventemitter3_1 = require("eventemitter3");
const util_1 = require("../util");
class ActionQueue {
    constructor(options) {
        var _a;
        var _b;
        this.queue = [];
        this.isRunning = false;
        this.emitter = new eventemitter3_1.EventEmitter();
        this.options = options !== null && options !== void 0 ? options : {};
        (_a = (_b = this.options).maxActionDuration) !== null && _a !== void 0 ? _a : (_b.maxActionDuration = 2147483647);
    }
    /**
     * Run an action. This will run after all previous actions have completed
     * @param action action to be run
     */
    run(action, data) {
        const deferred = new deferred_1.Deferred();
        this.queue.push({
            action: action,
            data: data,
            deferred: deferred
        });
        void this.process();
        return deferred.promise;
    }
    /**
     * Process the next pending action. Safe to call even if another action is running, we will only run one action at a time
     */
    async process() {
        if (this.isRunning) {
            return;
        }
        if (this.queue.length === 0) {
            this.emit('idle');
            return;
        }
        this.isRunning = true;
        //run the action and resolve the deferred if it succeeds
        const queueItem = this.queue.shift();
        const cancellationTokenSource = new vscode_languageserver_protocol_1.CancellationTokenSource();
        //process the action next tick to allow the event loop to catch up
        let actionPromise = Promise.resolve().then(() => {
            return queueItem.action(queueItem.data, cancellationTokenSource.token);
        }).then((result) => {
            queueItem.deferred.resolve(result);
        });
        //register a timeout that will reject if the action takes too long
        let timeoutId;
        const timeoutPromise = new Promise((resolve, reject) => {
            timeoutId = setTimeout(() => {
                cancellationTokenSource.cancel();
                reject(new Error(`Action took longer than ${this.options.maxActionDuration}ms to complete. Data: ${this.stringifyJson(queueItem.data)}`));
            }, this.options.maxActionDuration);
        });
        //wait for the action to finish or the timeout to trigger
        await Promise.race([timeoutPromise, actionPromise]).catch((error) => {
            //if we have an error, reject the deferred
            queueItem.deferred.tryReject(error);
        });
        clearTimeout(timeoutId);
        //small delay to allow the event loop to catch up
        await util_1.default.sleep(1);
        this.isRunning = false;
        //at this point, we've properly handled the action, so try and handle the next one
        await this.process();
    }
    stringifyJson(data) {
        return safeJsonStringify(data, (_, value) => {
            return typeof value === 'bigint' ? value.toString() : value;
        });
    }
    get isIdle() {
        return this.queue.length === 0 && !this.isRunning;
    }
    /**
     * Get a promise that resolves when the queue is empty
     */
    onIdle() {
        if (!this.isIdle) {
            return this.once('idle');
        }
        return Promise.resolve();
    }
    once(eventName) {
        return new Promise((resolve) => {
            const disconnect = this.on(eventName, (...args) => {
                disconnect();
                resolve(args);
            });
        });
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
    }
    dispose() {
        this.emitter.removeAllListeners();
    }
}
exports.ActionQueue = ActionQueue;
//# sourceMappingURL=ActionQueue.js.map
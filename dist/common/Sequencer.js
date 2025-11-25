"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sequencer = void 0;
const util_1 = require("../util");
const eventemitter3_1 = require("eventemitter3");
/**
 * Supports running a series of actions in sequence, either synchronously or asynchronously
 */
class Sequencer {
    constructor(options) {
        this.options = options;
        // eslint-disable-next-line @typescript-eslint/ban-types
        this.actions = [];
        this.emitter = new eventemitter3_1.EventEmitter();
    }
    get minSyncDuration() {
        var _a, _b;
        return (_b = (_a = this.options) === null || _a === void 0 ? void 0 : _a.minSyncDuration) !== null && _b !== void 0 ? _b : 150;
    }
    forEach(itemsOrFactory, func) {
        //register a single action for now, we will fetch the full list and register their actions later
        const primaryAction = {
            args: [],
            func: (data) => {
                const items = typeof itemsOrFactory === 'function' ? itemsOrFactory() : itemsOrFactory;
                const actions = [];
                for (const item of items) {
                    actions.push({
                        args: [item],
                        func: func
                    });
                }
                let primaryActionIndex = this.actions.indexOf(primaryAction);
                //insert all of these item actions immediately after this action
                this.actions.splice(primaryActionIndex + 1, 0, ...actions);
            }
        };
        this.actions.push(primaryAction);
        return this;
    }
    onCancel(callback) {
        this.emitter.on('cancel', callback);
        return this;
    }
    onComplete(callback) {
        this.emitter.on('complete', callback);
        return this;
    }
    onSuccess(callback) {
        this.emitter.on('success', callback);
        return this;
    }
    once(func) {
        this.actions.push({
            args: [],
            func: func
        });
        return this;
    }
    async run() {
        var _a, _b, _c, _d;
        try {
            let start = Date.now();
            for (const action of this.actions) {
                //register a very short timeout between every action so we don't hog the CPU
                if (Date.now() - start > this.minSyncDuration) {
                    await util_1.util.sleep(1);
                    start = Date.now();
                }
                //if the cancellation token has asked us to cancel, then stop processing now
                if ((_b = (_a = this.options) === null || _a === void 0 ? void 0 : _a.cancellationToken) === null || _b === void 0 ? void 0 : _b.isCancellationRequested) {
                    return this.handleCancel();
                }
                await Promise.resolve(action.func(...action.args));
                //if the cancellation token has asked us to cancel, then stop processing now
                if ((_d = (_c = this.options) === null || _c === void 0 ? void 0 : _c.cancellationToken) === null || _d === void 0 ? void 0 : _d.isCancellationRequested) {
                    return this.handleCancel();
                }
            }
            this.emitter.emit('success');
        }
        catch (e) {
            this.handleCancel();
            throw e;
        }
        finally {
            this.emitter.emit('complete');
            this.dispose();
        }
    }
    runSync() {
        var _a, _b;
        try {
            for (const action of this.actions) {
                //if the cancellation token has asked us to cancel, then stop processing now
                if ((_b = (_a = this.options) === null || _a === void 0 ? void 0 : _a.cancellationToken) === null || _b === void 0 ? void 0 : _b.isCancellationRequested) {
                    return this.handleCancel();
                }
                const result = action.func(...action.args);
                if (typeof (result === null || result === void 0 ? void 0 : result.then) === 'function') {
                    throw new Error(`Action returned a promise which is unsupported when running 'runSync'`);
                }
            }
            this.emitter.emit('success');
        }
        catch (e) {
            this.handleCancel();
            throw e;
        }
        finally {
            this.emitter.emit('complete');
            this.dispose();
        }
    }
    handleCancel() {
        var _a;
        console.log(`Cancelling sequence ${(_a = this.options) === null || _a === void 0 ? void 0 : _a.name}`);
        this.emitter.emit('cancel');
    }
    dispose() {
        this.emitter.removeAllListeners();
    }
}
exports.Sequencer = Sequencer;
//# sourceMappingURL=Sequencer.js.map
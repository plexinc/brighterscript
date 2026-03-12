"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusyStatus = exports.BusyStatusTracker = void 0;
const eventemitter3_1 = require("eventemitter3");
const deferred_1 = require("./deferred");
/**
 * Tracks the busy/idle status of various sync or async tasks
 * Reports the overall status to the client
 */
class BusyStatusTracker {
    constructor() {
        /**
         * @readonly
         */
        this.activeRuns = [];
        this.emitter = new eventemitter3_1.EventEmitter();
    }
    /**
     * Begin a busy task. It's expected you will call `endScopeRun` when the task is complete.
     * @param scope an object used for reference as to what is doing the work. Can be used to bulk-cancel all runs for a given scope.
     * @param label  label for the run. This is required for the `endScopedRun` method to know what to end.
     */
    beginScopedRun(scope, label) {
        const deferred = new deferred_1.Deferred();
        const runInfo = {
            label: label,
            startTime: new Date(),
            deferred: deferred,
            scope: scope
        };
        void this._run(runInfo, () => {
            //don't mark the busy run as completed until the deferred is resolved
            return deferred.promise;
        });
    }
    /**
     * End the earliest run for the given scope and label
     * @param scope an object used for reference as to what is doing the work. Can be used to bulk-cancel all runs for a given scope.
     * @param label label for the run
     */
    endScopedRun(scope, label) {
        const earliestRunIndex = this.activeRuns.findIndex(x => x.scope === scope && x.label === label);
        if (earliestRunIndex === -1) {
            return;
        }
        const earliestRun = this.activeRuns[earliestRunIndex];
        this.activeRuns.splice(earliestRunIndex, 1);
        earliestRun.deferred.resolve();
        return earliestRun.deferred.promise;
    }
    /**
     * End all runs for a given scope. This is typically used when the scope is destroyed, and we want to make sure all runs are cleaned up.
     * @param scope an object used for reference as to what is doing the work.
     */
    endAllRunsForScope(scope) {
        for (let i = this.activeRuns.length - 1; i >= 0; i--) {
            const activeRun = this.activeRuns[i];
            if (activeRun.scope === scope) {
                //delete the active run
                this.activeRuns.splice(i, 1);
                //mark the run as resolved
                activeRun.deferred.resolve();
            }
        }
    }
    /**
     * Start a new piece of work
     */
    run(callback, label) {
        const run = {
            label: label,
            startTime: new Date()
        };
        return this._run(run, callback);
    }
    _run(runInfo, callback, label) {
        this.activeRuns.push(runInfo);
        if (this.activeRuns.length === 1) {
            this.emit('change', BusyStatus.busy);
        }
        this.emit('active-runs-change', { activeRuns: [...this.activeRuns] });
        let isFinalized = false;
        const finalizeRun = () => {
            if (isFinalized === false) {
                isFinalized = true;
                let idx = this.activeRuns.indexOf(runInfo);
                if (idx > -1) {
                    this.activeRuns.splice(idx, 1);
                }
                this.emit('active-runs-change', { activeRuns: [...this.activeRuns] });
                if (this.activeRuns.length <= 0) {
                    this.emit('change', BusyStatus.idle);
                }
            }
        };
        let result;
        //call the callback function
        try {
            result = callback(finalizeRun);
            //if the result is a promise, don't finalize until it completes
            if (typeof (result === null || result === void 0 ? void 0 : result.then) === 'function') {
                return Promise.resolve(result).finally(finalizeRun).then(() => result);
            }
            else {
                finalizeRun();
                return result;
            }
        }
        catch (e) {
            finalizeRun();
            throw e;
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
            this.emitter.off(eventName, handler);
        };
    }
    emit(eventName, event) {
        this.emitter.emit(eventName, event);
    }
    destroy() {
        this.emitter.removeAllListeners();
    }
    /**
     * The current status of the busy tracker.
     * @readonly
     */
    get status() {
        return this.activeRuns.length === 0 ? BusyStatus.idle : BusyStatus.busy;
    }
}
exports.BusyStatusTracker = BusyStatusTracker;
var BusyStatus;
(function (BusyStatus) {
    BusyStatus["busy"] = "busy";
    BusyStatus["idle"] = "idle";
})(BusyStatus = exports.BusyStatus || (exports.BusyStatus = {}));
//# sourceMappingURL=BusyStatusTracker.js.map
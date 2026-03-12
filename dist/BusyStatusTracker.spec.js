"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const deferred_1 = require("./deferred");
const BusyStatusTracker_1 = require("./BusyStatusTracker");
const sinon_1 = require("sinon");
const sinon = (0, sinon_1.createSandbox)();
describe('BusyStatusTracker', () => {
    let tracker;
    let latestStatus;
    beforeEach(() => {
        sinon.restore();
        latestStatus = BusyStatusTracker_1.BusyStatus.idle;
        tracker = new BusyStatusTracker_1.BusyStatusTracker();
        tracker.on('change', (value) => {
            latestStatus = value;
        });
    });
    afterEach(() => {
        sinon.restore();
        tracker === null || tracker === void 0 ? void 0 : tracker.destroy();
    });
    it('tracks a single run', () => {
        (0, chai_1.expect)(latestStatus).to.eql(BusyStatusTracker_1.BusyStatus.idle);
        tracker.run(() => {
            (0, chai_1.expect)(tracker.status).to.eql(BusyStatusTracker_1.BusyStatus.busy);
        });
        (0, chai_1.expect)(latestStatus).to.eql(BusyStatusTracker_1.BusyStatus.idle);
    });
    it('tracks a single async flow', async () => {
        const deferred = new deferred_1.Deferred();
        const finishedPromise = tracker.run(() => {
            return deferred.promise;
        });
        (0, chai_1.expect)(latestStatus).to.eql(BusyStatusTracker_1.BusyStatus.busy);
        deferred.resolve();
        await finishedPromise;
        (0, chai_1.expect)(latestStatus).to.eql(BusyStatusTracker_1.BusyStatus.idle);
    });
    it('independently tracks multiple runs for same program', () => {
        tracker.run(() => {
            (0, chai_1.expect)(latestStatus).to.eql(BusyStatusTracker_1.BusyStatus.busy);
        });
        tracker.run(() => {
            (0, chai_1.expect)(latestStatus).to.eql(BusyStatusTracker_1.BusyStatus.busy);
        });
        (0, chai_1.expect)(latestStatus).to.eql(BusyStatusTracker_1.BusyStatus.idle);
    });
    it('tracks as `busy` one of the runs is still pending', async () => {
        const deferred = new deferred_1.Deferred();
        tracker.run(() => {
            (0, chai_1.expect)(latestStatus).to.eql(BusyStatusTracker_1.BusyStatus.busy);
        });
        const finishedPromise = tracker.run(() => {
            (0, chai_1.expect)(latestStatus).to.eql(BusyStatusTracker_1.BusyStatus.busy);
            return deferred.promise;
        });
        (0, chai_1.expect)(latestStatus).to.eql(BusyStatusTracker_1.BusyStatus.busy);
        deferred.resolve();
        await finishedPromise;
        (0, chai_1.expect)(latestStatus).to.eql(BusyStatusTracker_1.BusyStatus.idle);
    });
    it('handles error during synchronous flow', () => {
        try {
            tracker.run(() => {
                throw new Error('Crash');
            });
        }
        catch (_a) { }
        (0, chai_1.expect)(latestStatus).to.eql(BusyStatusTracker_1.BusyStatus.idle);
    });
    it('handles error during async flow', async () => {
        try {
            await tracker.run(() => {
                return Promise.reject(new Error('Crash'));
            });
        }
        catch (_a) { }
        (0, chai_1.expect)(latestStatus).to.eql(BusyStatusTracker_1.BusyStatus.idle);
    });
    it('only finalizes on the first call to finalize', () => {
        try {
            tracker.run((finalize) => {
                (0, chai_1.expect)(latestStatus).to.eql(BusyStatusTracker_1.BusyStatus.busy);
                finalize === null || finalize === void 0 ? void 0 : finalize();
                (0, chai_1.expect)(latestStatus).to.eql(BusyStatusTracker_1.BusyStatus.idle);
                finalize === null || finalize === void 0 ? void 0 : finalize();
                (0, chai_1.expect)(latestStatus).to.eql(BusyStatusTracker_1.BusyStatus.idle);
            });
        }
        catch (_a) { }
        (0, chai_1.expect)(latestStatus).to.eql(BusyStatusTracker_1.BusyStatus.idle);
    });
    it('supports multiple simultaneous projects', async () => {
        //run the projects out of order
        const deferred2 = new deferred_1.Deferred();
        const run1Promise = tracker.run(() => {
            (0, chai_1.expect)(latestStatus).to.eql(BusyStatusTracker_1.BusyStatus.busy);
            return deferred2.promise;
        });
        const deferred1 = new deferred_1.Deferred();
        const run2Promise = tracker.run(() => {
            (0, chai_1.expect)(latestStatus).to.eql(BusyStatusTracker_1.BusyStatus.busy);
            return deferred1.promise;
        });
        (0, chai_1.expect)(latestStatus).to.eql(BusyStatusTracker_1.BusyStatus.busy);
        deferred1.resolve();
        await run2Promise;
        (0, chai_1.expect)(latestStatus).to.eql(BusyStatusTracker_1.BusyStatus.busy);
        deferred2.resolve();
        await run1Promise;
        (0, chai_1.expect)(latestStatus).to.eql(BusyStatusTracker_1.BusyStatus.idle);
    });
    it('supports unsubscribing from events', () => {
        const changes = []; //contains every busy/idle status change
        const disconnect = tracker.on('change', (status) => changes.push(status));
        (0, chai_1.expect)(changes.length).to.eql(0);
        tracker.run(() => { });
        (0, chai_1.expect)(changes.length).to.eql(2);
        tracker.run(() => { });
        (0, chai_1.expect)(changes.length).to.eql(4);
        disconnect();
        tracker.run(() => { });
        (0, chai_1.expect)(changes.length).to.eql(4);
    });
    it('getStatus returns proper value', () => {
        (0, chai_1.expect)(tracker.status).to.eql(BusyStatusTracker_1.BusyStatus.idle);
        tracker.run(() => {
            (0, chai_1.expect)(tracker.status).to.eql(BusyStatusTracker_1.BusyStatus.busy);
        });
        (0, chai_1.expect)(tracker.status).to.eql(BusyStatusTracker_1.BusyStatus.idle);
    });
    describe('scopedTracking', () => {
        const scope1 = {};
        it('supports scoped tracking', async () => {
            let onStatus = tracker.once('change');
            tracker.beginScopedRun(scope1, 'run1');
            (0, chai_1.expect)(await onStatus).to.eql(BusyStatusTracker_1.BusyStatus.busy);
            tracker.beginScopedRun(scope1, 'run2');
            (0, chai_1.expect)(latestStatus).to.eql(BusyStatusTracker_1.BusyStatus.busy);
            await tracker.endScopedRun(scope1, 'run1');
            (0, chai_1.expect)(latestStatus).to.eql(BusyStatusTracker_1.BusyStatus.busy);
            onStatus = tracker.once('change');
            await tracker.endScopedRun(scope1, 'run2');
            (0, chai_1.expect)(await onStatus).to.eql(BusyStatusTracker_1.BusyStatus.idle);
        });
        it('clears runs for scope', async () => {
            let onChange = tracker.once('change');
            tracker.beginScopedRun(scope1, 'run1');
            tracker.beginScopedRun(scope1, 'run1');
            tracker.beginScopedRun(scope1, 'run1');
            (0, chai_1.expect)(await onChange).to.eql(BusyStatusTracker_1.BusyStatus.busy);
            onChange = tracker.once('change');
            tracker.endAllRunsForScope(scope1);
            (0, chai_1.expect)(await onChange).to.eql(BusyStatusTracker_1.BusyStatus.idle);
        });
        it('emits an active-runs-change event when any run changes', async () => {
            let count = 0;
            tracker.on('active-runs-change', () => {
                count++;
            });
            tracker.run(() => { }, 'run1');
            tracker.run(() => { }, 'run2');
            await tracker.run(() => Promise.resolve(true), 'run3');
            tracker.beginScopedRun(this, 'run4');
            tracker.beginScopedRun(this, 'run4');
            await tracker.endScopedRun(this, 'run4');
            await tracker.endScopedRun(this, 'run4');
            //we should have 10 total events (5 starts, 5 ends)
            (0, chai_1.expect)(count).to.eql(10);
        });
        it('emits active-runs-change with the correct list of remaining active runs', () => {
            const spy = sinon.spy();
            tracker.on('active-runs-change', spy);
            tracker.run(() => {
                (0, chai_1.expect)(tracker.status).to.eql(BusyStatusTracker_1.BusyStatus.busy);
            }, 'test');
            //small timeout to allow all the events to show up
            (0, chai_1.expect)(spy.callCount).to.eql(2);
            (0, chai_1.expect)(spy.getCall(0).args[0].activeRuns.map(x => ({ label: x.label }))).to.eql([
                { label: 'test' }
            ]);
            (0, chai_1.expect)(spy.getCall(1).args[0].activeRuns).to.eql([]);
        });
        it('removes the entry for the scope when the last run is cleared', async () => {
            (0, chai_1.expect)(tracker['activeRuns']).to.be.empty;
            tracker.beginScopedRun(scope1, 'run1');
            (0, chai_1.expect)(tracker['activeRuns'].find(x => x.scope === scope1 && x.label === 'run1')).to.exist;
            await tracker.endScopedRun(scope1, 'run1');
            (0, chai_1.expect)(tracker['activeRuns']).to.be.empty;
        });
    });
});
//# sourceMappingURL=BusyStatusTracker.spec.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const ActionQueue_1 = require("./ActionQueue");
const util_1 = require("../util");
const deferred_1 = require("../deferred");
const testHelpers_spec_1 = require("../testHelpers.spec");
describe('ActionQueue', () => {
    let queue;
    beforeEach(() => {
        queue = new ActionQueue_1.ActionQueue();
    });
    it('runs successful actions in sequence', async () => {
        let results = [];
        void queue.run(() => {
            results.push(1);
        });
        await queue.run(() => {
            results.push(2);
        });
        (0, chai_1.expect)(results).to.eql([1, 2]);
    });
    it('runs actions after a failed action', async () => {
        let results = [];
        void queue.run(() => {
            results.push(1);
        });
        void queue.run(() => {
            throw new Error('Crash');
        });
        await queue.run(() => {
            results.push(3);
        });
        (0, chai_1.expect)(results).to.eql([1, 3]);
    });
    it('properly serializes bigInt', async () => {
        queue = new ActionQueue_1.ActionQueue({
            maxActionDuration: 1
        });
        await (0, testHelpers_spec_1.expectThrowsAsync)(async () => {
            await queue.run(async () => {
                await util_1.default.sleep(10);
            }, BigInt(1));
        }, 'Action took longer than 1ms to complete. Data: "1"');
    });
    it('rejects action that took too long, and marks cancellationToken accordingly', async () => {
        queue = new ActionQueue_1.ActionQueue({
            maxActionDuration: 100
        });
        let cancellationToken;
        let results = [];
        let task1Deferred = new deferred_1.Deferred();
        let task1Promise = queue.run(async (data, token) => {
            await util_1.default.sleep(200);
            cancellationToken = token;
            if (!cancellationToken.isCancellationRequested) {
                results.push(1);
            }
            task1Deferred.resolve();
        });
        await queue.run(() => {
            results.push(2);
        });
        (0, chai_1.expect)(results).to.eql([2]);
        //wait for task 1's promise to finish and verify we get an error
        let error;
        try {
            await task1Promise;
        }
        catch (e) {
            error = e;
        }
        (0, chai_1.expect)(error === null || error === void 0 ? void 0 : error.message).to.eql('Action took longer than 100ms to complete. Data: undefined');
        //now wait for task1's work to actually finish
        await task1Deferred.promise;
        //the token should be marked as cancelled
        (0, chai_1.expect)(cancellationToken.isCancellationRequested).to.be.true;
    });
});
//# sourceMappingURL=ActionQueue.spec.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const WorkerPool_1 = require("./WorkerPool");
describe('WorkerPool', () => {
    let pool;
    let workers = [];
    beforeEach(() => {
        workers = [];
        //our factory will create empty objects. This prevents us from having to actually run threads.
        pool = new WorkerPool_1.WorkerPool(() => {
            const worker = {};
            workers.push(worker);
            return worker;
        });
    });
    describe('preload', () => {
        it('ensures enough free workers have been created', () => {
            (0, chai_1.expect)(workers.length).to.eql(0);
            pool.preload(5);
            (0, chai_1.expect)(workers.length).to.eql(5);
            pool.preload(7);
            (0, chai_1.expect)(workers.length).to.eql(7);
        });
    });
    describe('releaseWorker', () => {
        it('releases a worker back to the pool', () => {
            const worker = pool.getWorker();
            (0, chai_1.expect)(pool['freeWorkers']).lengthOf(0);
            pool.releaseWorker(worker);
            (0, chai_1.expect)(pool['freeWorkers']).lengthOf(1);
            //doesn't crash if we do the same thing again
            pool.releaseWorker(worker);
            (0, chai_1.expect)(pool['freeWorkers']).lengthOf(1);
        });
    });
    describe('getWorker', () => {
        it('creates a new worker when none exist', () => {
            (0, chai_1.expect)(pool['allWorkers']).to.be.empty;
            (0, chai_1.expect)(pool['freeWorkers']).to.be.empty;
            const worker = pool.getWorker();
            (0, chai_1.expect)(worker).to.eql(workers[0]);
            (0, chai_1.expect)(pool['allWorkers']).to.be.lengthOf(1);
            //should be same instance
            (0, chai_1.expect)(pool['allWorkers'][0]).equals(workers[0]);
        });
    });
    describe('dispose', () => {
        it('does not crash when worker.terminate() fails', () => {
            const worker = pool.getWorker();
            worker['terminate'] = () => {
                throw new Error('Test crash');
            };
            //should not throw error
            pool.dispose();
        });
    });
});
//# sourceMappingURL=WorkerPool.spec.js.map
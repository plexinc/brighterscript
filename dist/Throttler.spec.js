"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-floating-promises */
const chai_config_spec_1 = require("./chai-config.spec");
const Throttler_1 = require("./Throttler");
const sinon_1 = require("sinon");
const deferred_1 = require("./deferred");
let sinon = (0, sinon_1.createSandbox)();
describe('Throttler', () => {
    let throttler;
    beforeEach(() => {
        throttler = new Throttler_1.Throttler(0);
    });
    afterEach(() => {
        sinon.restore();
    });
    describe('run', () => {
        it('runs a job', async () => {
            const job = (0, sinon_1.fake)();
            await throttler.run(job);
            (0, chai_config_spec_1.expect)(job.callCount).to.equal(1);
        });
        it('runs a second job after the first one finishes', async () => {
            const job1 = (0, sinon_1.fake)();
            const job2 = (0, sinon_1.fake)();
            throttler.run(job1);
            throttler.run(job2);
            await throttler.onIdleOnce();
            (0, chai_config_spec_1.expect)(job1.callCount).to.equal(1);
            (0, chai_config_spec_1.expect)(job2.callCount).to.equal(1);
        });
        it('skips the middle job when a third job is registered', async () => {
            const job1 = (0, sinon_1.fake)();
            const job2 = (0, sinon_1.fake)();
            const job3 = (0, sinon_1.fake)();
            throttler.run(job1);
            throttler.run(job2);
            throttler.run(job3);
            await throttler.onIdleOnce();
            (0, chai_config_spec_1.expect)(job1.callCount).to.equal(1);
            (0, chai_config_spec_1.expect)(job2.callCount).to.equal(0);
            (0, chai_config_spec_1.expect)(job3.callCount).to.equal(1);
        });
        it('runs another job after settled', async () => {
            const job1 = (0, sinon_1.fake)();
            throttler.run(job1);
            await throttler.onIdleOnce();
            const job2 = (0, sinon_1.fake)();
            throttler.run(job2);
            await throttler.onIdleOnce();
            (0, chai_config_spec_1.expect)(job1.called).to.be.true;
            (0, chai_config_spec_1.expect)(job2.called).to.be.true;
        });
        it('logs error to console but continues', async () => {
            var _a, _b;
            const stub = sinon.stub(console, 'error').callsFake(() => { });
            await throttler.run(() => {
                throw new Error('fail!');
            });
            (0, chai_config_spec_1.expect)(stub.callCount).to.equal(1);
            (0, chai_config_spec_1.expect)((_b = (_a = stub.getCalls()[0]) === null || _a === void 0 ? void 0 : _a.args[0]) === null || _b === void 0 ? void 0 : _b.message).to.eql('fail!');
        });
    });
    describe('onIdle', () => {
        it('fires every time the throttler idles', async () => {
            const onIdle = (0, sinon_1.fake)();
            throttler.onIdle(onIdle);
            await throttler.run(() => { });
            await throttler.run(() => { });
            await throttler.run(() => { });
            (0, chai_config_spec_1.expect)(onIdle.callCount).to.equal(3);
        });
        it('disconnects when called', async () => {
            const onIdle1 = (0, sinon_1.fake)();
            const off1 = throttler.onIdle(onIdle1);
            const onIdle2 = (0, sinon_1.fake)();
            throttler.onIdle(onIdle2);
            await throttler.run(() => { });
            //turn off onIdle1 listener
            off1();
            await throttler.run(() => { });
            (0, chai_config_spec_1.expect)(onIdle1.callCount).to.equal(1);
            (0, chai_config_spec_1.expect)(onIdle2.callCount).to.equal(2);
        });
    });
    describe('onIdleOnce', () => {
        it('resolves immediately if idle', async () => {
            await throttler.onIdleOnce(true);
            //we resolved instead of waiting...this is a pass
        });
        it('waits until the next resolve when resolveImmediately is false', async () => {
            const deferred = new deferred_1.Deferred();
            const promise = throttler.onIdleOnce(false);
            throttler.run(() => {
                return deferred.promise;
            });
            deferred.resolve();
            await promise;
            //we resolved, this test passes
        });
    });
});
//# sourceMappingURL=Throttler.spec.js.map
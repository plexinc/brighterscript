"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("./chai-config.spec");
const Stopwatch_1 = require("./Stopwatch");
const util_1 = require("./util");
describe('Stopwatch', () => {
    let stopwatch;
    beforeEach(() => {
        stopwatch = new Stopwatch_1.Stopwatch();
    });
    it('constructs', () => {
        stopwatch = new Stopwatch_1.Stopwatch();
    });
    it('starts', () => {
        (0, chai_config_spec_1.expect)(stopwatch['startTime']).to.not.exist;
        stopwatch.start();
        (0, chai_config_spec_1.expect)(stopwatch['startTime']).to.exist;
    });
    it('resets', () => {
        stopwatch.start();
        (0, chai_config_spec_1.expect)(stopwatch['startTime']).to.exist;
        stopwatch.reset();
        (0, chai_config_spec_1.expect)(stopwatch['startTime']).to.not.exist;
    });
    it('stops', async () => {
        stopwatch.start();
        (0, chai_config_spec_1.expect)(stopwatch['startTime']).to.exist;
        await util_1.util.sleep(3);
        stopwatch.stop();
        (0, chai_config_spec_1.expect)(stopwatch['startTime']).to.not.exist;
        (0, chai_config_spec_1.expect)(stopwatch['totalMilliseconds']).to.be.gte(2);
    });
    it('stop multiple times has no effect', () => {
        stopwatch.start();
        stopwatch.stop();
        stopwatch.stop();
    });
    it('breaks out hours, minutes, and seconds', () => {
        stopwatch['totalMilliseconds'] = (17 * 60 * 1000) + (43 * 1000) + 30;
        (0, chai_config_spec_1.expect)(stopwatch.getDurationText()).to.eql('17m43s30.0ms');
    });
    it('returns only seconds and milliseconds', () => {
        stopwatch['totalMilliseconds'] = (43 * 1000) + 30;
        (0, chai_config_spec_1.expect)(stopwatch.getDurationText()).to.eql('43s30.0ms');
    });
    it('returns only  milliseconds', () => {
        stopwatch['totalMilliseconds'] = 30;
        (0, chai_config_spec_1.expect)(stopwatch.getDurationText()).to.eql('30.0ms');
    });
    it('works for single run', async () => {
        let stopwatch = new Stopwatch_1.Stopwatch();
        stopwatch.start();
        await new Promise((resolve) => {
            setTimeout(resolve, 2);
        });
        stopwatch.stop();
        (0, chai_config_spec_1.expect)(stopwatch.totalMilliseconds).to.be.greaterThan(1);
    });
    it('works for multiple start/stop', async () => {
        let stopwatch = new Stopwatch_1.Stopwatch();
        stopwatch.start();
        stopwatch.stop();
        stopwatch.totalMilliseconds = 3;
        stopwatch.start();
        await new Promise((resolve) => {
            setTimeout(resolve, 4);
        });
        stopwatch.stop();
        (0, chai_config_spec_1.expect)(stopwatch.totalMilliseconds).to.be.at.least(6);
    });
    it('pretty prints', () => {
        let stopwatch = new Stopwatch_1.Stopwatch();
        stopwatch.totalMilliseconds = 45;
        (0, chai_config_spec_1.expect)(stopwatch.getDurationText()).to.equal('45.0ms');
        stopwatch.totalMilliseconds = 2000 + 45;
        (0, chai_config_spec_1.expect)(stopwatch.getDurationText()).to.equal('2s45.0ms');
        stopwatch.totalMilliseconds = 180000 + 2000 + 45;
        (0, chai_config_spec_1.expect)(stopwatch.getDurationText()).to.equal('3m2s45.0ms');
    });
});
//# sourceMappingURL=Stopwatch.spec.js.map
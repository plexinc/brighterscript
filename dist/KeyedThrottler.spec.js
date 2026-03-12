"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const KeyedThrottler_1 = require("./KeyedThrottler");
const chai_config_spec_1 = require("./chai-config.spec");
describe('KeyedThrottler', () => {
    let throttler;
    beforeEach(() => {
        throttler = new KeyedThrottler_1.KeyedThrottler(0);
    });
    it('returns the correct value for each resolved promise', async () => {
        let results = [null, null, null, null, null];
        //should only run index 0 and index 4
        let promises = [0, 1, 2, 3, 4].map(x => {
            return throttler.run('same-key', () => {
                results[x] = x;
            });
        });
        await Promise.all(promises);
        (0, chai_config_spec_1.expect)(results).to.eql([0, null, null, null, 4]);
    });
});
//# sourceMappingURL=KeyedThrottler.spec.js.map
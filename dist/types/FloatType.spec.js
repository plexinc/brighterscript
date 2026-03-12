"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../chai-config.spec");
const DynamicType_1 = require("./DynamicType");
const FloatType_1 = require("./FloatType");
describe('FloatType', () => {
    it('is equivalent to double types', () => {
        (0, chai_config_spec_1.expect)(new FloatType_1.FloatType().isAssignableTo(new FloatType_1.FloatType())).to.be.true;
        (0, chai_config_spec_1.expect)(new FloatType_1.FloatType().isAssignableTo(new DynamicType_1.DynamicType())).to.be.true;
    });
});
//# sourceMappingURL=FloatType.spec.js.map
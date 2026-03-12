"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../chai-config.spec");
const DoubleType_1 = require("./DoubleType");
const DynamicType_1 = require("./DynamicType");
describe('DoubleType', () => {
    it('is equivalent to double types', () => {
        (0, chai_config_spec_1.expect)(new DoubleType_1.DoubleType().isAssignableTo(new DoubleType_1.DoubleType())).to.be.true;
        (0, chai_config_spec_1.expect)(new DoubleType_1.DoubleType().isAssignableTo(new DynamicType_1.DynamicType())).to.be.true;
    });
});
//# sourceMappingURL=DoubleType.spec.js.map
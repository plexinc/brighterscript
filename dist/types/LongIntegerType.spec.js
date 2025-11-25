"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../chai-config.spec");
const DynamicType_1 = require("./DynamicType");
const LongIntegerType_1 = require("./LongIntegerType");
describe('LongIntegerType', () => {
    it('is equivalent to other long integer types', () => {
        (0, chai_config_spec_1.expect)(new LongIntegerType_1.LongIntegerType().isAssignableTo(new LongIntegerType_1.LongIntegerType())).to.be.true;
        (0, chai_config_spec_1.expect)(new LongIntegerType_1.LongIntegerType().isAssignableTo(new DynamicType_1.DynamicType())).to.be.true;
    });
});
//# sourceMappingURL=LongIntegerType.spec.js.map
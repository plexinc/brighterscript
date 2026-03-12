"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../chai-config.spec");
const DynamicType_1 = require("./DynamicType");
const StringType_1 = require("./StringType");
describe('StringType', () => {
    it('is equivalent to string types', () => {
        (0, chai_config_spec_1.expect)(new StringType_1.StringType().isAssignableTo(new StringType_1.StringType())).to.be.true;
        (0, chai_config_spec_1.expect)(new StringType_1.StringType().isAssignableTo(new DynamicType_1.DynamicType())).to.be.true;
    });
});
//# sourceMappingURL=StringType.spec.js.map
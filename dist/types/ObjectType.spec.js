"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../chai-config.spec");
const DynamicType_1 = require("./DynamicType");
const ObjectType_1 = require("./ObjectType");
describe('ObjectType', () => {
    it('is equivalent to other object types', () => {
        (0, chai_config_spec_1.expect)(new ObjectType_1.ObjectType().isAssignableTo(new ObjectType_1.ObjectType())).to.be.true;
        (0, chai_config_spec_1.expect)(new ObjectType_1.ObjectType().isAssignableTo(new DynamicType_1.DynamicType())).to.be.true;
    });
});
//# sourceMappingURL=ObjectType.spec.js.map
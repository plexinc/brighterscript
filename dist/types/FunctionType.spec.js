"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../chai-config.spec");
const DynamicType_1 = require("./DynamicType");
const FunctionType_1 = require("./FunctionType");
const IntegerType_1 = require("./IntegerType");
const StringType_1 = require("./StringType");
const VoidType_1 = require("./VoidType");
describe('FunctionType', () => {
    it('is equivalent to dynamic type', () => {
        (0, chai_config_spec_1.expect)(new FunctionType_1.FunctionType(new VoidType_1.VoidType()).isAssignableTo(new DynamicType_1.DynamicType())).to.be.true;
    });
    it('validates using param and return types', () => {
        (0, chai_config_spec_1.expect)(new FunctionType_1.FunctionType(new VoidType_1.VoidType()).isAssignableTo(new FunctionType_1.FunctionType(new VoidType_1.VoidType()))).to.be.true;
        //different parameter count
        (0, chai_config_spec_1.expect)(new FunctionType_1.FunctionType(new VoidType_1.VoidType()).addParameter('a', new IntegerType_1.IntegerType(), false).isAssignableTo(new FunctionType_1.FunctionType(new VoidType_1.VoidType()))).to.be.false;
        //different parameter types
        (0, chai_config_spec_1.expect)(new FunctionType_1.FunctionType(new VoidType_1.VoidType()).addParameter('a', new IntegerType_1.IntegerType(), false).isAssignableTo(new FunctionType_1.FunctionType(new VoidType_1.VoidType()).addParameter('a', new StringType_1.StringType(), false))).to.be.false;
        //different return type
        (0, chai_config_spec_1.expect)(new FunctionType_1.FunctionType(new VoidType_1.VoidType()).isAssignableTo(new FunctionType_1.FunctionType(new IntegerType_1.IntegerType()))).to.be.false;
    });
});
//# sourceMappingURL=FunctionType.spec.js.map
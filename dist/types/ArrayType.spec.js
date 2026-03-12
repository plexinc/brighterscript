"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../chai-config.spec");
const ArrayType_1 = require("./ArrayType");
const DynamicType_1 = require("./DynamicType");
const BooleanType_1 = require("./BooleanType");
const StringType_1 = require("./StringType");
describe('ArrayType', () => {
    it('is equivalent to array types', () => {
        (0, chai_config_spec_1.expect)(new ArrayType_1.ArrayType().isAssignableTo(new ArrayType_1.ArrayType())).to.be.true;
        (0, chai_config_spec_1.expect)(new ArrayType_1.ArrayType().isAssignableTo(new DynamicType_1.DynamicType())).to.be.true;
    });
    it('catches arrays containing different inner types', () => {
        (0, chai_config_spec_1.expect)(new ArrayType_1.ArrayType(new BooleanType_1.BooleanType()).isAssignableTo(new ArrayType_1.ArrayType(new BooleanType_1.BooleanType()))).to.be.true;
        (0, chai_config_spec_1.expect)(new ArrayType_1.ArrayType(new BooleanType_1.BooleanType()).isAssignableTo(new ArrayType_1.ArrayType(new StringType_1.StringType()))).to.be.false;
    });
    it('is not equivalent to other types', () => {
        (0, chai_config_spec_1.expect)(new ArrayType_1.ArrayType().isAssignableTo(new BooleanType_1.BooleanType())).to.be.false;
    });
    describe('isConveribleTo', () => {
        (0, chai_config_spec_1.expect)(new ArrayType_1.ArrayType().isConvertibleTo(new BooleanType_1.BooleanType())).to.be.false;
        (0, chai_config_spec_1.expect)(new ArrayType_1.ArrayType().isConvertibleTo(new ArrayType_1.ArrayType())).to.be.true;
    });
    describe('toString', () => {
        it('prints inner types', () => {
            (0, chai_config_spec_1.expect)(new ArrayType_1.ArrayType(new BooleanType_1.BooleanType(), new StringType_1.StringType()).toString()).to.eql('Array<boolean | string>');
        });
    });
});
//# sourceMappingURL=ArrayType.spec.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../chai-config.spec");
const sinon_1 = require("sinon");
const testHelpers_spec_1 = require("../testHelpers.spec");
const DynamicType_1 = require("./DynamicType");
const IntegerType_1 = require("./IntegerType");
const InterfaceType_1 = require("./InterfaceType");
const ObjectType_1 = require("./ObjectType");
const StringType_1 = require("./StringType");
describe('InterfaceType', () => {
    describe('toString', () => {
        it('returns empty curly braces when no members', () => {
            (0, chai_config_spec_1.expect)(iface({}).toString()).to.eql('{}');
        });
        it('includes member types', () => {
            (0, chai_config_spec_1.expect)(iface({ name: new StringType_1.StringType() }).toString()).to.eql('{ name: string; }');
        });
        it('includes nested object types', () => {
            (0, chai_config_spec_1.expect)(iface({
                name: new StringType_1.StringType(),
                parent: iface({
                    age: new IntegerType_1.IntegerType()
                })
            }).toString()).to.eql('{ name: string; parent: { age: integer; }; }');
        });
    });
    describe('isConvertibleTo', () => {
        it('works', () => {
            expectAssignable({
                name: new StringType_1.StringType()
            }, {
                name: new StringType_1.StringType()
            });
        });
    });
    describe('equals', () => {
        it('matches equal objects', () => {
            (0, chai_config_spec_1.expect)(iface({ name: new StringType_1.StringType() }).equals(iface({ name: new StringType_1.StringType() }))).to.be.true;
        });
        it('does not match inequal objects', () => {
            (0, chai_config_spec_1.expect)(iface({ name: new StringType_1.StringType() }).equals(iface({ name: new IntegerType_1.IntegerType() }))).to.be.false;
        });
    });
    describe('isAssignableTo', () => {
        it('rejects being assignable to other types', () => {
            (0, chai_config_spec_1.expect)(iface({
                name: new StringType_1.StringType()
            }).isAssignableTo(new IntegerType_1.IntegerType())).to.be.false;
        });
        it('matches exact properties', () => {
            expectAssignable({
                name: new StringType_1.StringType()
            }, {
                name: new StringType_1.StringType()
            });
        });
        it('matches an object with more properties being assigned to an object with less', () => {
            expectAssignable({
                name: new StringType_1.StringType()
            }, {
                name: new StringType_1.StringType(),
                age: new IntegerType_1.IntegerType()
            });
        });
        it('rejects assigning an object with less properties to one with more', () => {
            expectNotAssignable({
                name: new StringType_1.StringType(),
                age: new IntegerType_1.IntegerType()
            }, {
                name: new StringType_1.StringType()
            });
        });
        it('matches properties in mismatched order', () => {
            (0, chai_config_spec_1.expect)(new InterfaceType_1.InterfaceType(new Map([
                ['name', new StringType_1.StringType()],
                ['age', new IntegerType_1.IntegerType()]
            ])).isAssignableTo(new InterfaceType_1.InterfaceType(new Map([
                ['age', new IntegerType_1.IntegerType()],
                ['name', new StringType_1.StringType()]
            ])))).to.be.true;
        });
        it('rejects with member having mismatched type', () => {
            expectNotAssignable({
                name: new StringType_1.StringType()
            }, {
                name: new IntegerType_1.IntegerType()
            });
        });
        it('rejects with object member having mismatched type', () => {
            expectNotAssignable({
                parent: iface({
                    name: new StringType_1.StringType()
                })
            }, {
                parent: iface({
                    name: new IntegerType_1.IntegerType()
                })
            });
        });
        it('rejects with object member having missing prop type', () => {
            expectNotAssignable({
                parent: iface({
                    name: new StringType_1.StringType(),
                    age: new IntegerType_1.IntegerType()
                })
            }, {
                parent: iface({
                    name: new StringType_1.StringType()
                })
            });
        });
        it('accepts with object member having same prop types', () => {
            expectAssignable({
                parent: iface({
                    name: new StringType_1.StringType(),
                    age: new IntegerType_1.IntegerType()
                })
            }, {
                parent: iface({
                    name: new StringType_1.StringType(),
                    age: new IntegerType_1.IntegerType()
                })
            });
        });
        it('accepts with source member having dyanmic prop type', () => {
            expectAssignable({
                parent: iface({
                    name: new StringType_1.StringType(),
                    age: new IntegerType_1.IntegerType()
                })
            }, {
                parent: new DynamicType_1.DynamicType()
            });
        });
        it('accepts with target member having dyanmic prop type', () => {
            expectAssignable({
                parent: new DynamicType_1.DynamicType()
            }, {
                parent: iface({
                    name: new StringType_1.StringType(),
                    age: new IntegerType_1.IntegerType()
                })
            });
        });
        it('accepts with target member having "object" prop type', () => {
            expectAssignable({
                parent: new ObjectType_1.ObjectType()
            }, {
                parent: iface({
                    name: new StringType_1.StringType(),
                    age: new IntegerType_1.IntegerType()
                })
            });
        });
    });
});
function iface(members) {
    return new InterfaceType_1.InterfaceType((0, testHelpers_spec_1.objectToMap)(members));
}
function expectAssignable(targetMembers, sourceMembers) {
    const targetIface = iface(targetMembers);
    const sourceIface = iface(sourceMembers);
    if (!sourceIface.isAssignableTo(targetIface)) {
        sinon_1.assert.fail(`expected type ${targetIface.toString()} to be assignable to type ${sourceIface.toString()}`);
    }
}
function expectNotAssignable(targetMembers, sourceMembers) {
    const targetIface = iface(targetMembers);
    const sourceIface = iface(sourceMembers);
    if (sourceIface.isAssignableTo(targetIface)) {
        sinon_1.assert.fail(`expected type ${targetIface.toString()} to not be assignable to type ${sourceIface.toString()}`);
    }
}
//# sourceMappingURL=InterfaceType.spec.js.map
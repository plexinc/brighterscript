"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterfaceType = void 0;
const reflection_1 = require("../astUtils/reflection");
class InterfaceType {
    constructor(members) {
        this.members = members;
    }
    isAssignableTo(targetType) {
        //we must have all of the members of the target type, and they must be equivalent types
        if ((0, reflection_1.isInterfaceType)(targetType)) {
            for (const [targetMemberName, targetMemberType] of targetType.members) {
                const ourMemberType = this.members.get(targetMemberName);
                //we don't have the target member
                if (!ourMemberType) {
                    return false;
                }
                //our member's type is not assignable to the target member type
                if (!ourMemberType.isAssignableTo(targetMemberType)) {
                    return false;
                }
            }
            //we have all of the target member's types. we are assignable!
            return true;
            //we are always assignable to dynamic or object
        }
        else if ((0, reflection_1.isDynamicType)(targetType) || (0, reflection_1.isObjectType)(targetType)) {
            return true;
            //not assignable to any other object types
        }
        else {
            return false;
        }
    }
    isConvertibleTo(targetType) {
        return this.isAssignableTo(targetType);
    }
    toString() {
        let result = '{';
        for (const [key, type] of this.members.entries()) {
            result += ' ' + key + ': ' + type.toString() + ';';
        }
        if (this.members.size > 0) {
            result += ' ';
        }
        return result + '}';
    }
    toTypeString() {
        return 'object';
    }
    equals(targetType) {
        if ((0, reflection_1.isInterfaceType)(targetType)) {
            if (targetType.members.size !== this.members.size) {
                return false;
            }
            return targetType.isAssignableTo(this);
        }
        return false;
    }
    clone() {
        let members = new Map();
        for (const [key, member] of this.members) {
            members.set(key, member === null || member === void 0 ? void 0 : member.clone());
        }
        const result = new InterfaceType(members);
        result.name = this.name;
        return result;
    }
}
exports.InterfaceType = InterfaceType;
//# sourceMappingURL=InterfaceType.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomType = void 0;
const reflection_1 = require("../astUtils/reflection");
class CustomType {
    constructor(name) {
        this.name = name;
    }
    toString() {
        return this.name;
    }
    toTypeString() {
        return 'object';
    }
    isAssignableTo(targetType) {
        //TODO for now, if the custom types have the same name, assume they're the same thing
        if ((0, reflection_1.isCustomType)(targetType) && targetType.name === this.name) {
            return true;
        }
        else if ((0, reflection_1.isDynamicType)(targetType)) {
            return true;
        }
        else {
            return false;
        }
    }
    isConvertibleTo(targetType) {
        return this.isAssignableTo(targetType);
    }
    clone() {
        return new CustomType(this.name);
    }
}
exports.CustomType = CustomType;
//# sourceMappingURL=CustomType.js.map
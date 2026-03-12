"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BooleanType = void 0;
const DynamicType_1 = require("./DynamicType");
class BooleanType {
    constructor(typeText) {
        this.typeText = typeText;
    }
    isAssignableTo(targetType) {
        return (targetType instanceof BooleanType ||
            targetType instanceof DynamicType_1.DynamicType);
    }
    isConvertibleTo(targetType) {
        return this.isAssignableTo(targetType);
    }
    toString() {
        var _a;
        return (_a = this.typeText) !== null && _a !== void 0 ? _a : 'boolean';
    }
    toTypeString() {
        return this.toString();
    }
    clone() {
        return new BooleanType(this.typeText);
    }
}
exports.BooleanType = BooleanType;
//# sourceMappingURL=BooleanType.js.map
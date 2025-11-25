"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectType = void 0;
const DynamicType_1 = require("./DynamicType");
class ObjectType {
    constructor(typeText) {
        this.typeText = typeText;
    }
    isAssignableTo(targetType) {
        return (targetType instanceof ObjectType ||
            targetType instanceof DynamicType_1.DynamicType);
    }
    isConvertibleTo(targetType) {
        return this.isAssignableTo(targetType);
    }
    toString() {
        var _a;
        return (_a = this.typeText) !== null && _a !== void 0 ? _a : 'object';
    }
    toTypeString() {
        return this.toString();
    }
    clone() {
        return new ObjectType(this.typeText);
    }
}
exports.ObjectType = ObjectType;
//# sourceMappingURL=ObjectType.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidType = void 0;
const DynamicType_1 = require("./DynamicType");
class InvalidType {
    constructor(typeText) {
        this.typeText = typeText;
    }
    isAssignableTo(targetType) {
        return (targetType instanceof InvalidType ||
            targetType instanceof DynamicType_1.DynamicType);
    }
    isConvertibleTo(targetType) {
        return this.isAssignableTo(targetType);
    }
    toString() {
        var _a;
        return (_a = this.typeText) !== null && _a !== void 0 ? _a : 'invalid';
    }
    toTypeString() {
        return this.toString();
    }
    clone() {
        return new InvalidType(this.typeText);
    }
}
exports.InvalidType = InvalidType;
//# sourceMappingURL=InvalidType.js.map
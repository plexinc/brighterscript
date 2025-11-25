"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoidType = void 0;
const DynamicType_1 = require("./DynamicType");
class VoidType {
    constructor(typeText) {
        this.typeText = typeText;
    }
    isAssignableTo(targetType) {
        return (targetType instanceof VoidType ||
            targetType instanceof DynamicType_1.DynamicType);
    }
    isConvertibleTo(targetType) {
        return this.isAssignableTo(targetType);
    }
    toString() {
        var _a;
        return (_a = this.typeText) !== null && _a !== void 0 ? _a : 'void';
    }
    toTypeString() {
        return this.toString();
    }
    clone() {
        return new VoidType(this.typeText);
    }
}
exports.VoidType = VoidType;
//# sourceMappingURL=VoidType.js.map
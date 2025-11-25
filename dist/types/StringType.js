"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StringType = void 0;
const DynamicType_1 = require("./DynamicType");
class StringType {
    constructor(typeText) {
        this.typeText = typeText;
    }
    isAssignableTo(targetType) {
        return (targetType instanceof StringType ||
            targetType instanceof DynamicType_1.DynamicType);
    }
    isConvertibleTo(targetType) {
        return this.isAssignableTo(targetType);
    }
    toString() {
        var _a;
        return (_a = this.typeText) !== null && _a !== void 0 ? _a : 'string';
    }
    toTypeString() {
        return this.toString();
    }
    clone() {
        return new StringType(this.typeText);
    }
}
exports.StringType = StringType;
//# sourceMappingURL=StringType.js.map
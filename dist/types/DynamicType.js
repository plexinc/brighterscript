"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicType = void 0;
class DynamicType {
    constructor(typeText) {
        this.typeText = typeText;
    }
    isAssignableTo(targetType) {
        //everything can be dynamic, so as long as a type is provided, this is true
        return !!targetType;
    }
    /**
     * The dynamic type is convertible to everything.
     */
    isConvertibleTo(targetType) {
        //everything can be dynamic, so as long as a type is provided, this is true
        return !!targetType;
    }
    toString() {
        var _a;
        return (_a = this.typeText) !== null && _a !== void 0 ? _a : 'dynamic';
    }
    toTypeString() {
        return this.toString();
    }
    clone() {
        return new DynamicType(this.typeText);
    }
}
exports.DynamicType = DynamicType;
DynamicType.instance = new DynamicType();
//# sourceMappingURL=DynamicType.js.map
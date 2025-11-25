"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FloatType = void 0;
const DoubleType_1 = require("./DoubleType");
const DynamicType_1 = require("./DynamicType");
const IntegerType_1 = require("./IntegerType");
const LongIntegerType_1 = require("./LongIntegerType");
class FloatType {
    constructor(typeText) {
        this.typeText = typeText;
    }
    isAssignableTo(targetType) {
        return (targetType instanceof FloatType ||
            targetType instanceof DynamicType_1.DynamicType);
    }
    isConvertibleTo(targetType) {
        if (targetType instanceof DynamicType_1.DynamicType ||
            targetType instanceof IntegerType_1.IntegerType ||
            targetType instanceof FloatType ||
            targetType instanceof DoubleType_1.DoubleType ||
            targetType instanceof LongIntegerType_1.LongIntegerType) {
            return true;
        }
        else {
            return false;
        }
    }
    toString() {
        var _a;
        return (_a = this.typeText) !== null && _a !== void 0 ? _a : 'float';
    }
    toTypeString() {
        return this.toString();
    }
    clone() {
        return new FloatType(this.typeText);
    }
}
exports.FloatType = FloatType;
//# sourceMappingURL=FloatType.js.map
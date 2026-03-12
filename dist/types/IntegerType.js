"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegerType = void 0;
const DoubleType_1 = require("./DoubleType");
const DynamicType_1 = require("./DynamicType");
const FloatType_1 = require("./FloatType");
const LongIntegerType_1 = require("./LongIntegerType");
class IntegerType {
    constructor(typeText) {
        this.typeText = typeText;
    }
    isAssignableTo(targetType) {
        return (targetType instanceof IntegerType ||
            targetType instanceof DynamicType_1.DynamicType);
    }
    isConvertibleTo(targetType) {
        if (targetType instanceof DynamicType_1.DynamicType ||
            targetType instanceof IntegerType ||
            targetType instanceof FloatType_1.FloatType ||
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
        return (_a = this.typeText) !== null && _a !== void 0 ? _a : 'integer';
    }
    toTypeString() {
        return this.toString();
    }
    clone() {
        return new IntegerType(this.typeText);
    }
}
exports.IntegerType = IntegerType;
//# sourceMappingURL=IntegerType.js.map
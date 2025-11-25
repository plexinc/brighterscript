"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArrayType = void 0;
const DynamicType_1 = require("./DynamicType");
class ArrayType {
    constructor(...innerTypes) {
        this.innerTypes = [];
        this.innerTypes = innerTypes;
    }
    isAssignableTo(targetType) {
        if (targetType instanceof DynamicType_1.DynamicType) {
            return true;
        }
        else if (!(targetType instanceof ArrayType)) {
            return false;
        }
        //this array type is assignable to the target IF
        //1. all of the types in this array are present in the target
        outer: for (let innerType of this.innerTypes) {
            //find this inner type in the target
            // eslint-disable-next-line no-unreachable-loop
            for (let targetInnerType of targetType.innerTypes) {
                //TODO is this loop correct? It ends after 1 iteration but we might need to do more iterations
                if (innerType.isAssignableTo(targetInnerType)) {
                    continue outer;
                }
                //our array contains a type that the target array does not...so these arrays are different
                return false;
            }
        }
        return true;
    }
    isConvertibleTo(targetType) {
        return this.isAssignableTo(targetType);
    }
    toString() {
        return `Array<${this.innerTypes.map((x) => x.toString()).join(' | ')}>`;
    }
    toTypeString() {
        return 'object';
    }
    clone() {
        var _a, _b;
        return new ArrayType(...(_b = (_a = this.innerTypes) === null || _a === void 0 ? void 0 : _a.map(x => x === null || x === void 0 ? void 0 : x.clone())) !== null && _b !== void 0 ? _b : []);
    }
}
exports.ArrayType = ArrayType;
//# sourceMappingURL=ArrayType.js.map
import type { BscType } from './BscType';
export declare class VoidType implements BscType {
    typeText?: string;
    constructor(typeText?: string);
    isAssignableTo(targetType: BscType): boolean;
    isConvertibleTo(targetType: BscType): boolean;
    toString(): string;
    toTypeString(): string;
    clone(): VoidType;
}

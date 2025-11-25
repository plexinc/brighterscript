import type { BscType } from './BscType';
export declare class DynamicType implements BscType {
    typeText?: string;
    constructor(typeText?: string);
    static readonly instance: DynamicType;
    isAssignableTo(targetType: BscType): boolean;
    /**
     * The dynamic type is convertible to everything.
     */
    isConvertibleTo(targetType: BscType): boolean;
    toString(): string;
    toTypeString(): string;
    clone(): DynamicType;
}

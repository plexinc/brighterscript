import type { BscType } from './BscType';
export declare class CustomType implements BscType {
    name: string;
    constructor(name: string);
    toString(): string;
    toTypeString(): string;
    isAssignableTo(targetType: BscType): boolean;
    isConvertibleTo(targetType: BscType): boolean;
    clone(): CustomType;
}

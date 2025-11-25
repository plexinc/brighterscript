import type { BscType } from './BscType';
export declare class InterfaceType implements BscType {
    members: Map<string, BscType>;
    constructor(members: Map<string, BscType>);
    /**
     * The name of the interface. Can be undefined.
     */
    name: string | undefined;
    isAssignableTo(targetType: BscType): boolean;
    isConvertibleTo(targetType: BscType): boolean;
    toString(): string;
    toTypeString(): string;
    equals(targetType: BscType): boolean;
    clone(): InterfaceType;
}

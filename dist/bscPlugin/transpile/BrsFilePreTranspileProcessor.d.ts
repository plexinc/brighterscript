import type { BrsFile } from '../../files/BrsFile';
import type { BeforeFileTranspileEvent } from '../../interfaces';
export declare class BrsFilePreTranspileProcessor {
    private event;
    constructor(event: BeforeFileTranspileEvent<BrsFile>);
    process(): void;
    private iterateExpressions;
    private processTernaryExpression;
    /**
     * Given a string optionally separated by dots, find an enum related to it.
     * For example, all of these would return the enum: `SomeNamespace.SomeEnum.SomeMember`, SomeEnum.SomeMember, `SomeEnum`
     */
    private getEnumInfo;
    /**
     * Recursively resolve a const or enum value until we get to the final resolved expression
     * Returns an object with the resolved value and a flag indicating if a circular reference was detected
     */
    private resolveConstValue;
    private processExpression;
}

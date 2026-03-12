import type { XmlFile } from '../../files/XmlFile';
import type { OnFileValidateEvent } from '../../interfaces';
export declare class XmlFileValidator {
    event: OnFileValidateEvent<XmlFile>;
    constructor(event: OnFileValidateEvent<XmlFile>);
    process(): void;
    private validateComponent;
}

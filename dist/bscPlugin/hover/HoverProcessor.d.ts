import type { ProvideHoverEvent } from '../../interfaces';
export declare class HoverProcessor {
    event: ProvideHoverEvent;
    constructor(event: ProvideHoverEvent);
    process(): void;
    private buildContentsWithDocs;
    private getBrsFileHover;
    /**
     * Combine all the documentation found before a token (i.e. comment tokens)
     */
    private getTokenDocumentation;
    private getXmlFileHover;
}

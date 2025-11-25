import type { ProvideCompletionsEvent } from '../../interfaces';
export declare class CompletionsProcessor {
    private event;
    constructor(event: ProvideCompletionsEvent);
    process(): void;
}

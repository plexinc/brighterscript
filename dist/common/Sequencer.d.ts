import type { CancellationToken } from 'vscode-languageserver-protocol';
/**
 * Supports running a series of actions in sequence, either synchronously or asynchronously
 */
export declare class Sequencer {
    private options?;
    constructor(options?: {
        name?: string;
        cancellationToken?: CancellationToken;
        /**
         * The number of operations to run before registering a nexttick
         */
        minSyncDuration?: number;
    });
    private get minSyncDuration();
    private actions;
    forEach<T>(itemsOrFactory: Iterable<T> | (() => Iterable<T>), func: (item: T) => any): this;
    private emitter;
    onCancel(callback: () => void): this;
    onComplete(callback: () => void): this;
    onSuccess(callback: () => void): this;
    once(func: () => any): this;
    run(): Promise<void>;
    runSync(): void;
    private handleCancel;
    private dispose;
}

import type { MaybePromise } from '../interfaces';
/**
 * Manages multiple readers and writers, and ensures that no readers are reading while a writer is writing.
 * This is useful when multiple file changes show up but we also got a completions request, so we need to wait
 * until the files have been written and the program is validated before executing the completions request
 */
export declare class ReaderWriterManager {
    private readers;
    private writers;
    /**
     * Register a read action
     */
    read(action: Action): Promise<void>;
    /**
     * Register a write action
     */
    write(action: Action): Promise<void>;
    private execute;
}
declare type Action = () => MaybePromise<any>;
export {};

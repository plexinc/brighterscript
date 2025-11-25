import type { MaybePromise } from '../interfaces';
/**
 * Maintains a queued/buffered list of file operations. These operations don't actually do anything on their own.
 * You need to call the .apply() function and provide an action to operate on them.
 */
export declare class DocumentManager {
    private options;
    constructor(options: {
        delay: number;
        flushHandler?: (event: FlushEvent) => any;
    });
    private queue;
    private timeoutHandle;
    private throttle;
    /**
     * Add/set the contents of a file
     */
    set(options: {
        srcPath: string;
        fileContents?: string;
        allowStandaloneProject?: boolean;
    }): void;
    /**
     * Delete a file or directory. If a directory is provided, all pending changes within that directory will be discarded
     * and only the delete action will be queued
     */
    delete(srcPath: string): void;
    private isFlushRunning;
    private flush;
    /**
     * Is the manager settled (i.e. no pending files, all files have been fully flushed)
     */
    get isIdle(): boolean;
    /**
     * Returns a promise that resolves when there are no pending files and no active flushes are running. Will immediately resolve if there are no files,
     * and will wait until files are flushed if there are files.
     */
    onIdle(): Promise<void>;
    once(eventName: 'flush'): Promise<FlushEvent>;
    on(eventName: 'flush', handler: (data: any) => MaybePromise<void>): any;
    private emitSync;
    private emitter;
    dispose(): void;
}
export interface SetDocumentAction {
    srcPath: string;
    type: 'set';
    allowStandaloneProject?: boolean;
    fileContents: string;
}
export interface DeleteDocumentAction {
    srcPath: string;
    type: 'delete';
    allowStandaloneProject?: boolean;
}
export declare type DocumentAction = SetDocumentAction | DeleteDocumentAction;
export declare type DocumentActionWithStatus = DocumentAction & {
    id: number;
    status: 'accepted' | 'rejected';
};
export interface FlushEvent {
    actions: DocumentAction[];
}

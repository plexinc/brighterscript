/// <reference types="node" />
import type { MessagePort } from 'worker_threads';
/**
 * Runner logic for Running a Project in a worker thread.
 */
export declare class WorkerThreadProjectRunner {
    private requestInterceptors;
    private project;
    private messageHandler;
    run(parentPort: MessagePort): void;
    /**
     * Fired anytime we get an `activate` request from the client. This allows us to clean up the previous project and make a new one
     */
    private onActivate;
}

/// <reference types="node" />
import type { Worker } from 'worker_threads';
export declare class WorkerPool {
    private factory;
    constructor(factory: () => Worker);
    logger: import("@rokucommunity/logger/dist/Logger").Logger;
    /**
     * List of workers that are free to be used by a new task
     */
    private freeWorkers;
    /**
     * List of all workers that we've ever created
     */
    private allWorkers;
    /**
     * Ensure that there are ${count} workers available in the pool
     * @param count the number of total free workers that should exist when this function exits
     */
    preload(count: number): void;
    /**
     * Create a new worker
     */
    private createWorker;
    /**
     * Get a worker from the pool, or create a new one if none are available
     * @returns a worker
     */
    getWorker(): Worker;
    /**
     * Give the worker back to the pool so it can be used by someone else
     * @param worker the worker
     */
    releaseWorker(worker: Worker): void;
    /**
     * Shut down all active worker pools
     */
    dispose(): void;
}

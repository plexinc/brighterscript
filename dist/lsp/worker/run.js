"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * This script is the entry point for worker threads that run LSP Projects.
 * It sets up the WorkerThreadProjectRunner to handle messages from the main thread.
 */
const worker_threads_1 = require("worker_threads");
const WorkerThreadProjectRunner_1 = require("./WorkerThreadProjectRunner");
const runner = new WorkerThreadProjectRunner_1.WorkerThreadProjectRunner();
if (!worker_threads_1.parentPort) {
    throw new Error('This script must be run as a worker thread');
}
runner.run(worker_threads_1.parentPort);
//# sourceMappingURL=run.js.map
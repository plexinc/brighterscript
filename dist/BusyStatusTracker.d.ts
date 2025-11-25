import { Deferred } from './deferred';
interface RunInfo<T> {
    label: string;
    startTime: Date;
    scope?: T;
    deferred?: Deferred;
}
/**
 * Tracks the busy/idle status of various sync or async tasks
 * Reports the overall status to the client
 */
export declare class BusyStatusTracker<T = any> {
    /**
     * @readonly
     */
    activeRuns: Array<RunInfo<T>>;
    /**
     * Begin a busy task. It's expected you will call `endScopeRun` when the task is complete.
     * @param scope an object used for reference as to what is doing the work. Can be used to bulk-cancel all runs for a given scope.
     * @param label  label for the run. This is required for the `endScopedRun` method to know what to end.
     */
    beginScopedRun(scope: T, label: string): void;
    /**
     * End the earliest run for the given scope and label
     * @param scope an object used for reference as to what is doing the work. Can be used to bulk-cancel all runs for a given scope.
     * @param label label for the run
     */
    endScopedRun(scope: T, label: string): Promise<void>;
    /**
     * End all runs for a given scope. This is typically used when the scope is destroyed, and we want to make sure all runs are cleaned up.
     * @param scope an object used for reference as to what is doing the work.
     */
    endAllRunsForScope(scope: T): void;
    /**
     * Start a new piece of work
     */
    run<A, R = A | Promise<A>>(callback: (finalize?: FinalizeBuildStatusRun) => R, label?: string): R;
    private _run;
    private emitter;
    once(eventName: 'active-runs-change'): Promise<{
        activeRuns: Array<RunInfo<T>>;
    }>;
    once(eventName: 'change'): Promise<BusyStatus>;
    on(eventName: 'active-runs-change', handler: (event: {
        activeRuns: Array<RunInfo<T>>;
    }) => void): any;
    on(eventName: 'change', handler: (status: BusyStatus) => void): any;
    private emit;
    destroy(): void;
    /**
     * The current status of the busy tracker.
     * @readonly
     */
    get status(): BusyStatus;
}
export declare type FinalizeBuildStatusRun = (status?: BusyStatus) => void;
export declare enum BusyStatus {
    busy = "busy",
    idle = "idle"
}
export {};

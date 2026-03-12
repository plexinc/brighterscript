import type { CancellationToken } from 'vscode-languageserver-protocol';
export declare class ActionQueue {
    constructor(options?: ActionQueueOptions);
    options: ActionQueueOptions;
    private queue;
    /**
     * Run an action. This will run after all previous actions have completed
     * @param action action to be run
     */
    run<T = any>(action: Action<T>, data?: T): Promise<void>;
    private isRunning;
    /**
     * Process the next pending action. Safe to call even if another action is running, we will only run one action at a time
     */
    private process;
    private stringifyJson;
    get isIdle(): boolean;
    /**
     * Get a promise that resolves when the queue is empty
     */
    onIdle(): Promise<void>;
    once(eventname: 'idle'): Promise<void>;
    on(eventName: 'idle', handler: () => any): any;
    private emit;
    private emitter;
    dispose(): void;
}
export declare type Action<T = any> = (data: T, cancellationToken?: CancellationToken) => any;
export interface ActionQueueOptions {
    /**
     * Max milliseconds an individual action may run before it's cancelled. This is the amount of time the action actually runs,
     * and does not count the time it waits in the queue
     */
    maxActionDuration: number;
}

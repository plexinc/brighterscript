export declare class Deferred<T = void, TReject = any> {
    constructor();
    get promise(): Promise<T>;
    private _promise;
    /**
     * Indicates whether the promise has been resolved or rejected
     */
    get isCompleted(): boolean;
    private _isCompleted;
    /**
     * Indicates whether the promise has been resolved
     */
    get isResolved(): boolean;
    private _isResolved;
    /**
     * Indicates whether the promise has been rejected
     */
    get isRejected(): boolean;
    private _isRejected;
    /**
     * Resolve the promise
     */
    resolve(value?: T): void;
    private _resolve;
    tryResolve(value?: T): void;
    /**
     * Reject the promise
     */
    reject(value: TReject): void;
    private _reject;
    tryReject(reason?: TReject): void;
}

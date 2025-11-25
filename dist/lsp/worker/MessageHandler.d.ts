/// <reference types="node" />
import type { parentPort } from 'worker_threads';
interface PseudoMessagePort {
    on: (name: 'message', cb: (message: any) => any) => any;
    postMessage: typeof parentPort['postMessage'];
}
export declare class MessageHandler<T, TRequestName = MethodNames<T>> {
    constructor(options: {
        name?: string;
        port: PseudoMessagePort;
        onRequest?: (message: WorkerRequest) => any;
        onResponse?: (message: WorkerResponse) => any;
        onUpdate?: (message: WorkerUpdate) => any;
    });
    /**
     * An optional name to help with debugging this handler
     */
    readonly name: string;
    private port;
    private disposables;
    private emitter;
    private activeRequests;
    /**
     * Get the response with this ID
     * @param id the ID of the response
     * @returns the message
     */
    private onResponse;
    /**
     * A unique sequence for identifying messages
     */
    private idSequence;
    /**
     * Send a request to the worker, and wait for a response.
     * @param name the name of the request
     * @param options the request options
     * @param options.data an array of data that will be passed in as params to the target function
     * @param options.id an id for this request
     */
    sendRequest<R>(name: TRequestName, options?: {
        data: any[];
        id?: number;
    }): Promise<WorkerResponse<R>>;
    /**
     * Send a request to the worker, and wait for a response.
     * @param request the request we are responding to
     * @param options options for this request
     */
    sendResponse(request: WorkerMessage, options?: {
        data: any;
    } | {
        error: Error;
    } | undefined): void;
    /**
     * Send a request to the worker, and wait for a response.
     * @param name the name of the request
     * @param options options for the update
     * @param options.data an array of data that will be passed in as params to the target function
     * @param options.id an id for this update
     */
    sendUpdate<T>(name: string, options?: {
        data?: any[];
        id?: number;
    }): void;
    /**
     * Convert an Error object into a plain object so it can be serialized
     * @param error the error to object-ify
     * @returns an object version of an error
     */
    private errorToObject;
    dispose(): void;
}
export interface WorkerRequest<TData = any> {
    id: number;
    type: 'request';
    name: string;
    data?: TData;
}
export interface WorkerResponse<TData = any> {
    id: number;
    type: 'response';
    name: string;
    data?: TData;
    /**
     * An error occurred on the remote side. There will be no `.data` value
     */
    error?: Error;
}
export interface WorkerUpdate<TData = any> {
    id: number;
    type: 'update';
    name: string;
    data?: TData;
}
export declare type WorkerMessage<T = any> = WorkerRequest<T> | WorkerResponse<T> | WorkerUpdate<T>;
export declare type MethodNames<T> = {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];
export {};

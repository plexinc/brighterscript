"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageHandler = void 0;
const EventEmitter = require("eventemitter3");
const util_1 = require("../../util");
const deferred_1 = require("../../deferred");
class MessageHandler {
    constructor(options) {
        this.disposables = [];
        this.emitter = new EventEmitter();
        this.activeRequests = new Map();
        /**
         * A unique sequence for identifying messages
         */
        this.idSequence = 0;
        this.name = options === null || options === void 0 ? void 0 : options.name;
        this.port = options === null || options === void 0 ? void 0 : options.port;
        const listener = (message) => {
            var _a, _b, _c;
            switch (message.type) {
                case 'request':
                    (_a = options === null || options === void 0 ? void 0 : options.onRequest) === null || _a === void 0 ? void 0 : _a.call(options, message);
                    break;
                case 'response':
                    (_b = options === null || options === void 0 ? void 0 : options.onResponse) === null || _b === void 0 ? void 0 : _b.call(options, message);
                    this.emitter.emit(`${message.type}-${message.id}`, message);
                    break;
                case 'update':
                    (_c = options === null || options === void 0 ? void 0 : options.onUpdate) === null || _c === void 0 ? void 0 : _c.call(options, message);
                    break;
            }
        };
        options === null || options === void 0 ? void 0 : options.port.on('message', listener);
        this.disposables.push(this.emitter.removeAllListeners.bind(this.emitter), () => (options === null || options === void 0 ? void 0 : options.port).off('message', listener));
    }
    /**
     * Get the response with this ID
     * @param id the ID of the response
     * @returns the message
     */
    onResponse(id) {
        const deferred = new deferred_1.Deferred();
        //store this request so we can resolve it later, or reject if this class is disposed
        this.activeRequests.set(id, {
            id: id,
            deferred: deferred
        });
        this.emitter.once(`response-${id}`, (response) => {
            deferred.resolve(response);
            this.activeRequests.delete(id);
        });
        return deferred.promise;
    }
    /**
     * Send a request to the worker, and wait for a response.
     * @param name the name of the request
     * @param options the request options
     * @param options.data an array of data that will be passed in as params to the target function
     * @param options.id an id for this request
     */
    async sendRequest(name, options) {
        var _a, _b;
        const request = {
            type: 'request',
            name: name,
            data: (_a = options === null || options === void 0 ? void 0 : options.data) !== null && _a !== void 0 ? _a : [],
            id: (_b = options === null || options === void 0 ? void 0 : options.id) !== null && _b !== void 0 ? _b : this.idSequence++
        };
        const responsePromise = this.onResponse(request.id);
        this.port.postMessage(request);
        const response = await responsePromise;
        if ('error' in response) {
            //throw the error so it causes a rejected promise (like we'd expect)
            throw new Error(`Worker thread encountered an error: ${JSON.stringify(response.error.stack)}`);
        }
        return response;
    }
    /**
     * Send a request to the worker, and wait for a response.
     * @param request the request we are responding to
     * @param options options for this request
     */
    sendResponse(request, options) {
        const response = {
            type: 'response',
            name: request.name,
            id: request.id
        };
        if ('error' in options) {
            //hack: turn the error into a plain json object
            response.error = this.errorToObject(options.error);
        }
        else if ('data' in options) {
            response.data = options.data;
        }
        this.port.postMessage(response);
    }
    /**
     * Send a request to the worker, and wait for a response.
     * @param name the name of the request
     * @param options options for the update
     * @param options.data an array of data that will be passed in as params to the target function
     * @param options.id an id for this update
     */
    sendUpdate(name, options) {
        var _a, _b;
        let update = {
            type: 'update',
            name: name,
            data: (_a = options === null || options === void 0 ? void 0 : options.data) !== null && _a !== void 0 ? _a : [],
            id: (_b = options === null || options === void 0 ? void 0 : options.id) !== null && _b !== void 0 ? _b : this.idSequence++
        };
        this.port.postMessage(update);
    }
    /**
     * Convert an Error object into a plain object so it can be serialized
     * @param error the error to object-ify
     * @returns an object version of an error
     */
    errorToObject(error) {
        var _a, _b;
        return {
            name: error.name,
            message: error.message,
            stack: error.stack,
            cause: ((_a = error.cause) === null || _a === void 0 ? void 0 : _a.message) && ((_b = error.cause) === null || _b === void 0 ? void 0 : _b.stack) ? this.errorToObject(error.cause) : error.cause
        };
    }
    dispose() {
        util_1.default.applyDispose(this.disposables);
        //reject all active requests
        for (const request of this.activeRequests.values()) {
            request.deferred.reject(new Error(`Request ${request.id} has been rejected because MessageHandler is now disposed`));
        }
    }
}
exports.MessageHandler = MessageHandler;
//# sourceMappingURL=MessageHandler.js.map
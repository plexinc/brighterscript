"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerThreadProjectRunner = void 0;
const logging_1 = require("../../logging");
const Project_1 = require("../Project");
const MessageHandler_1 = require("./MessageHandler");
/**
 * Runner logic for Running a Project in a worker thread.
 */
class WorkerThreadProjectRunner {
    constructor() {
        //collection of interceptors that will be called when events are fired
        this.requestInterceptors = {};
    }
    run(parentPort) {
        //ensure the lgoger is configured for LSP mode
        (0, logging_1.setLspLoggerProps)();
        this.messageHandler = new MessageHandler_1.MessageHandler({
            name: 'WorkerThread',
            port: parentPort,
            onRequest: async (request) => {
                var _a, _b, _c;
                try {
                    //if we have a request interceptor registered for this event, call it
                    (_b = (_a = this.requestInterceptors)[request.name]) === null || _b === void 0 ? void 0 : _b.call(_a, request.data);
                    //only the LspProject interface method names will be passed as request names, so just call those functions on the Project class directly
                    let responseData = await this.project[request.name](...(_c = request.data) !== null && _c !== void 0 ? _c : []);
                    this.messageHandler.sendResponse(request, { data: responseData });
                    //we encountered a runtime crash. Pass that error along as the response to this request
                }
                catch (e) {
                    const error = e;
                    this.messageHandler.sendResponse(request, { error: error });
                }
            },
            onUpdate: (update) => {
            }
        });
        this.requestInterceptors.activate = this.onActivate.bind(this);
    }
    /**
     * Fired anytime we get an `activate` request from the client. This allows us to clean up the previous project and make a new one
     */
    onActivate() {
        var _a;
        //clean up any existing project
        (_a = this.project) === null || _a === void 0 ? void 0 : _a.dispose();
        //make a new instance of the project (which is the same way we run it in the main thread).
        this.project = new Project_1.Project();
        this.project.on('all', (eventName, data) => {
            this.messageHandler.sendUpdate(eventName, {
                data: data
            });
        });
    }
}
exports.WorkerThreadProjectRunner = WorkerThreadProjectRunner;
//# sourceMappingURL=WorkerThreadProjectRunner.js.map
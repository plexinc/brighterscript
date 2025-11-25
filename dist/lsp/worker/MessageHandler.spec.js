"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const MessageHandler_1 = require("./MessageHandler");
const chai_config_spec_1 = require("../../chai-config.spec");
const util_1 = require("../../util");
describe('MessageHandler', () => {
    let server;
    let client;
    let channel;
    beforeEach(() => {
        channel = new worker_threads_1.MessageChannel();
    });
    afterEach(() => {
        server === null || server === void 0 ? void 0 : server.dispose();
        client === null || client === void 0 ? void 0 : client.dispose();
        channel.port1.close();
        channel.port2.close();
    });
    it('serializes an error when present', async () => {
        let server = new MessageHandler_1.MessageHandler({
            port: channel.port1,
            onRequest: (request) => {
                server.sendResponse(request, {
                    error: new Error('Crash')
                });
            }
        });
        let client = new MessageHandler_1.MessageHandler({ port: channel.port2 });
        let error;
        try {
            await client.sendRequest('activate');
        }
        catch (e) {
            error = e;
        }
        (0, chai_config_spec_1.expect)(error).to.exist;
        (0, chai_config_spec_1.expect)(error).instanceof(Error);
    });
    it('terminates pending request promises when disposed', async () => {
        let server = new MessageHandler_1.MessageHandler({
            port: channel.port1,
            onRequest: (request) => {
                //never respond to any requests
            }
        });
        let client = new MessageHandler_1.MessageHandler({ port: channel.port2 });
        let error;
        //send a request that will never be responded to
        let responsePromise = client.sendRequest('activate');
        //sleep a bit to settle
        await util_1.default.sleep(10);
        server.dispose();
        client.dispose();
        try {
            await responsePromise;
        }
        catch (e) {
            error = e;
        }
        (0, chai_config_spec_1.expect)(error === null || error === void 0 ? void 0 : error.message).to.eql('Request 0 has been rejected because MessageHandler is now disposed');
    });
});
//# sourceMappingURL=MessageHandler.spec.js.map
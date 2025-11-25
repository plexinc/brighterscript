"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageserver_protocol_1 = require("vscode-languageserver-protocol");
const Sequencer_1 = require("./Sequencer");
const chai_config_spec_1 = require("../chai-config.spec");
describe('Sequencer', () => {
    it('cancels when asked', () => {
        const cancellationTokenSource = new vscode_languageserver_protocol_1.CancellationTokenSource();
        const values = [];
        new Sequencer_1.Sequencer({
            name: 'test',
            cancellationToken: cancellationTokenSource.token,
            minSyncDuration: 100
        }).forEach([1, 2, 3], (i) => {
            values.push(i);
            if (i === 2) {
                cancellationTokenSource.cancel();
            }
        }).runSync();
        (0, chai_config_spec_1.expect)(values).to.eql([1, 2]);
    });
    it('throws when returning a promise from runSync', () => {
        let error;
        try {
            new Sequencer_1.Sequencer().once(() => {
                return Promise.resolve();
            }).runSync();
        }
        catch (e) {
            error = e;
        }
        (0, chai_config_spec_1.expect)(error === null || error === void 0 ? void 0 : error.message).to.eql(`Action returned a promise which is unsupported when running 'runSync'`);
    });
    it('waits for async actions to complete', async () => {
        const values = [];
        await new Sequencer_1.Sequencer().forEach([1, 2, 3], async (i) => {
            await new Promise((resolve) => {
                setTimeout(resolve, 10);
            });
            values.push(i);
        }).run();
        (0, chai_config_spec_1.expect)(values).to.eql([1, 2, 3]);
    });
    it('runSync() calls cancel before throwing', () => {
        let cancelCalled = false;
        try {
            new Sequencer_1.Sequencer().once(() => {
                throw new Error('crash');
            }).onCancel(() => {
                cancelCalled = true;
            }).runSync();
        }
        catch (e) {
            //this is expected
            (0, chai_config_spec_1.expect)(e.message).to.eql('crash');
        }
        (0, chai_config_spec_1.expect)(cancelCalled).to.be.true;
    });
    it('run() calls cancel before throwing', async () => {
        let cancelCalled = false;
        try {
            await new Sequencer_1.Sequencer().once(() => {
                throw new Error('crash');
            }).onCancel(() => {
                cancelCalled = true;
            }).run();
        }
        catch (e) {
            //this is expected
            (0, chai_config_spec_1.expect)(e.message).to.eql('crash');
        }
        (0, chai_config_spec_1.expect)(cancelCalled).to.be.true;
    });
});
//# sourceMappingURL=Sequencer.spec.js.map
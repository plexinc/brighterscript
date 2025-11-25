"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const util_1 = require("../util");
const DocumentManager_1 = require("./DocumentManager");
const testHelpers_spec_1 = require("../testHelpers.spec");
describe('DocumentManager', () => {
    let manager;
    let results = [];
    beforeEach(() => {
        results = [];
        manager = new DocumentManager_1.DocumentManager({
            delay: 5,
            flushHandler: (event) => {
                results.push(...event.actions);
            }
        });
    });
    it('throttles multiple events', async () => {
        manager.set({ srcPath: 'alpha', fileContents: 'one' });
        await util_1.util.sleep(1);
        manager.set({ srcPath: 'alpha', fileContents: 'two' });
        await util_1.util.sleep(1);
        manager.set({ srcPath: 'alpha', fileContents: 'three' });
        await manager.onIdle();
        (0, chai_1.expect)(results).to.eql([{
                type: 'set',
                srcPath: 'alpha',
                fileContents: 'three',
                allowStandaloneProject: false
            }]);
    });
    it('does not lose newly added that arrives during a flush operation', async () => {
        const srcPath = (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/source/main.bs`;
        let contentsQueue = [
            'two',
            'three',
            'four'
        ];
        manager = new DocumentManager_1.DocumentManager({
            delay: 5,
            flushHandler: (event) => {
                //once the flush happens, add NEW data to the queue. this is the data we need to ensure we don't lose
                if (contentsQueue.length > 0) {
                    manager.set({ srcPath: srcPath, fileContents: contentsQueue.shift() });
                }
                //store the actions
                results.push(...event.actions);
            }
        });
        manager.set({ srcPath: srcPath, fileContents: 'one' });
        await manager.onIdle();
        (0, chai_1.expect)(results.map(x => x.fileContents)).to.eql([
            'one',
            'two',
            'three',
            'four'
        ]);
    });
    it('any file change delays the first one', async () => {
        manager.set({ srcPath: 'alpha', fileContents: 'one' });
        await util_1.util.sleep(1);
        manager.set({ srcPath: 'beta', fileContents: 'two' });
        await util_1.util.sleep(1);
        manager.set({ srcPath: 'alpha', fileContents: 'three' });
        await util_1.util.sleep(1);
        manager.set({ srcPath: 'beta', fileContents: 'four' });
        await util_1.util.sleep(1);
        await manager.onIdle();
        (0, chai_1.expect)(results).to.eql([{
                type: 'set',
                srcPath: 'alpha',
                fileContents: 'three',
                allowStandaloneProject: false
            }, {
                type: 'set',
                srcPath: 'beta',
                fileContents: 'four',
                allowStandaloneProject: false
            }]);
    });
    it('keeps the last-in change', async () => {
        manager.set({ srcPath: 'alpha', fileContents: 'one' });
        manager.delete('alpha');
        await manager.onIdle();
        (0, chai_1.expect)(results).to.eql([{
                type: 'delete',
                srcPath: 'alpha'
            }]);
        results = [];
        manager.set({ srcPath: 'alpha', fileContents: 'two' });
        manager.delete('alpha');
        manager.set({ srcPath: 'alpha', fileContents: 'three' });
        await manager.onIdle();
        (0, chai_1.expect)(results).to.eql([{
                type: 'set',
                srcPath: 'alpha',
                fileContents: 'three',
                allowStandaloneProject: false
            }]);
    });
});
//# sourceMappingURL=DocumentManager.spec.js.map
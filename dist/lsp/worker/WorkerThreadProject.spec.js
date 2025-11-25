"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWakeWorkerThreadPromise = exports.wakeWorkerThread = void 0;
const testHelpers_spec_1 = require("../../testHelpers.spec");
const fsExtra = require("fs-extra");
const WorkerThreadProject_1 = require("./WorkerThreadProject");
const DiagnosticMessages_1 = require("../../DiagnosticMessages");
const chai_1 = require("chai");
async function wakeWorkerThread() {
    console.log('waking up a worker thread');
    const project = new WorkerThreadProject_1.WorkerThreadProject();
    try {
        await project.activate({
            projectPath: testHelpers_spec_1.rootDir,
            projectNumber: 1
        });
    }
    finally {
        project.dispose();
    }
}
exports.wakeWorkerThread = wakeWorkerThread;
let wakeWorkerThreadPromise1;
function getWakeWorkerThreadPromise() {
    if (wakeWorkerThreadPromise1 === undefined) {
        wakeWorkerThreadPromise1 = wakeWorkerThread();
    }
    return wakeWorkerThreadPromise1;
}
exports.getWakeWorkerThreadPromise = getWakeWorkerThreadPromise;
after(() => {
    WorkerThreadProject_1.workerPool.dispose();
});
describe('WorkerThreadProject', () => {
    let project;
    before(async function workerThreadWarmup() {
        this.timeout(20000);
        await getWakeWorkerThreadPromise();
    });
    beforeEach(() => {
        project === null || project === void 0 ? void 0 : project.dispose();
        project = new WorkerThreadProject_1.WorkerThreadProject();
        fsExtra.emptyDirSync(testHelpers_spec_1.tempDir);
    });
    afterEach(() => {
        fsExtra.emptyDirSync(testHelpers_spec_1.tempDir);
        project === null || project === void 0 ? void 0 : project.dispose();
    });
    describe('activate', () => {
        it('shows diagnostics after running', async () => {
            fsExtra.outputFileSync(`${testHelpers_spec_1.rootDir}/source/main.brs`, `
                sub main()
                    print varNotThere
                end sub
            `);
            await project.activate({
                projectKey: undefined,
                projectDir: testHelpers_spec_1.rootDir,
                workspaceFolder: testHelpers_spec_1.rootDir,
                bsconfigPath: undefined,
                projectNumber: 1
            });
            const diagnostics = await project.getDiagnostics();
            (0, chai_1.expect)(diagnostics).lengthOf(1);
            await (0, testHelpers_spec_1.expectDiagnosticsAsync)(diagnostics, [
                DiagnosticMessages_1.DiagnosticMessages.cannotFindName('varNotThere').message
            ]);
        });
    });
});
//# sourceMappingURL=WorkerThreadProject.spec.js.map
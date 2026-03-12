"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const testHelpers_spec_1 = require("../testHelpers.spec");
const fsExtra = require("fs-extra");
const util_1 = require("../util");
const deferred_1 = require("../deferred");
const DiagnosticMessages_1 = require("../DiagnosticMessages");
const Project_1 = require("./Project");
const sinon_1 = require("sinon");
const Scope_1 = require("../Scope");
const sinon = (0, sinon_1.createSandbox)();
describe('Project', () => {
    let project;
    beforeEach(() => {
        sinon.restore();
        project = new Project_1.Project();
        fsExtra.emptyDirSync(testHelpers_spec_1.tempDir);
    });
    afterEach(() => {
        sinon.restore();
        fsExtra.emptyDirSync(testHelpers_spec_1.tempDir);
        project.dispose();
    });
    describe('on', () => {
        it('emits events', async () => {
            const stub = sinon.stub();
            const off = project.on('diagnostics', stub);
            await project['emit']('diagnostics', { diagnostics: [] });
            (0, chai_1.expect)(stub.callCount).to.eql(1);
            await project['emit']('diagnostics', { diagnostics: [] });
            (0, chai_1.expect)(stub.callCount).to.eql(2);
            off();
            await project['emit']('diagnostics', { diagnostics: [] });
            (0, chai_1.expect)(stub.callCount).to.eql(2);
        });
    });
    describe('validate', () => {
        it('prevents multiple valiations from running at the same time', async () => {
            //create 10 scopes, which should each take at least 1ms to validate
            for (let i = 0; i < 20; i++) {
                fsExtra.outputFileSync(`${testHelpers_spec_1.rootDir}/components/component${i}.xml`, `<component name="component${i}"></component>`);
            }
            await project.activate({
                projectKey: testHelpers_spec_1.rootDir,
                projectDir: testHelpers_spec_1.rootDir,
                bsconfigPath: undefined,
                workspaceFolder: testHelpers_spec_1.rootDir,
                enableThreading: false
            });
            //wait for the first validate to finish
            await new Promise((resolve) => {
                const off = project.on('validate-end', () => {
                    off();
                    resolve();
                });
            });
            let validationCount = 0;
            let maxValidationCount = 0;
            //force validation cycles to yield very frequently
            project['builder'].program['validationMinSyncDuration'] = 0.001;
            project['builder'].program.plugins.add({
                name: 'Test',
                beforeProgramValidate: () => {
                    validationCount++;
                    maxValidationCount = Math.max(maxValidationCount, validationCount);
                },
                afterProgramValidate: () => {
                    validationCount--;
                }
            });
            //very small threshold so every validation step will yield
            project['builder'].program['validationMinSyncDuration'] = 0.001;
            sinon.stub(Scope_1.Scope.prototype, 'validate').callsFake(() => {
                //each of these needs to take about 1ms to complete
                const startTime = Date.now();
                while (Date.now() - startTime < 2) { }
            });
            //validate 3 times in quick succession
            await Promise.all([
                project.validate(),
                project.validate(),
                project.validate()
            ]);
            (0, chai_1.expect)(validationCount).to.eql(0);
            (0, chai_1.expect)(maxValidationCount).to.eql(1);
        });
    });
    describe('activate', () => {
        it('uses `files` from bsconfig.json', async () => {
            fsExtra.outputJsonSync(`${testHelpers_spec_1.rootDir}/bsconfig.json`, {
                rootDir: testHelpers_spec_1.rootDir,
                files: [{
                        src: (0, util_1.standardizePath) `${testHelpers_spec_1.tempDir}/lib1.brs`,
                        dest: 'source/lib1.brs'
                    }]
            });
            fsExtra.outputFileSync(`${testHelpers_spec_1.tempDir}/lib1.brs`, `
                sub main()
                    print alpha 'this var doesn't exist
                end sub
            `);
            await project.activate({
                projectDir: testHelpers_spec_1.rootDir,
                projectKey: undefined,
                workspaceFolder: undefined,
                bsconfigPath: undefined
            });
            await (0, testHelpers_spec_1.once)(project, 'diagnostics');
            (0, testHelpers_spec_1.expectDiagnostics)(project, [
                DiagnosticMessages_1.DiagnosticMessages.cannotFindName('alpha').message
            ]);
        });
        it('prevents creating package on first run', async () => {
            await project.activate({
                projectDir: testHelpers_spec_1.rootDir,
                projectKey: undefined,
                workspaceFolder: undefined,
                bsconfigPath: undefined
            });
            (0, chai_1.expect)(project['builder'].program.options.copyToStaging).to.be.false;
        });
    });
    describe('applyFileChanges', () => {
        it('skips setting the file if the contents have not changed', async () => {
            await project.activate({
                projectDir: testHelpers_spec_1.rootDir,
                projectKey: undefined,
                workspaceFolder: undefined,
                bsconfigPath: undefined
            });
            //initial set should be true
            (0, chai_1.expect)((await project.applyFileChanges([{
                    fileContents: 'sub main:end sub',
                    srcPath: (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/source/main.brs`,
                    type: 'set'
                }]))[0].status).to.eql('accepted');
            //contents haven't changed, this should be false
            (0, chai_1.expect)((await project.applyFileChanges([{
                    fileContents: 'sub main:end sub',
                    srcPath: (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/source/main.brs`,
                    type: 'set'
                }]))[0].status).to.eql('accepted');
            //contents changed again, should be true
            (0, chai_1.expect)((await project.applyFileChanges([{
                    fileContents: 'sub main2:end sub',
                    srcPath: (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/source/main.brs`,
                    type: 'set'
                }]))[0].status).to.eql('accepted');
        });
        it('always includes a status', async () => {
            await project.activate({
                projectDir: testHelpers_spec_1.rootDir,
                projectKey: undefined,
                workspaceFolder: undefined,
                bsconfigPath: undefined
            });
            project['builder'].options.files = [
                'source/**/*',
                '!source/**/*.spec.bs'
            ];
            //set file that maches files array
            (0, chai_1.expect)((await project['applyFileChanges']([{
                    fileContents: '',
                    srcPath: (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/source/main.bs`,
                    type: 'set'
                }]))[0].status).to.eql('accepted');
            //delete this file that matches a file in the program
            (0, chai_1.expect)((await project['applyFileChanges']([{
                    srcPath: (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/source/main.bs`,
                    type: 'delete'
                }]))[0].status).to.eql('accepted');
            //set file that does not match files array files array
            (0, chai_1.expect)((await project['applyFileChanges']([{
                    fileContents: '',
                    srcPath: (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/source/main.spec.bs`,
                    type: 'set'
                }]))[0].status).to.eql('rejected');
            //delete directory is "reject" because those should be unraveled into individual files on the outside
            (0, chai_1.expect)((await project['applyFileChanges']([{
                    srcPath: (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/source`,
                    type: 'delete'
                }]))[0].status).to.eql('rejected');
        });
    });
    describe('activate', () => {
        it('finds bsconfig.json at root', async () => {
            fsExtra.outputFileSync(`${testHelpers_spec_1.rootDir}/bsconfig.json`, '');
            await project.activate({
                projectDir: testHelpers_spec_1.rootDir,
                projectKey: undefined,
                workspaceFolder: undefined,
                bsconfigPath: undefined
            });
            (0, chai_1.expect)(project.bsconfigPath).to.eql((0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/bsconfig.json`);
        });
        it('produces diagnostics after running', async () => {
            fsExtra.outputFileSync(`${testHelpers_spec_1.rootDir}/source/main.brs`, `
                sub main()
                    print varNotThere
                end sub
            `);
            await project.activate({
                projectDir: testHelpers_spec_1.rootDir,
                projectKey: undefined,
                workspaceFolder: undefined,
                bsconfigPath: undefined
            });
            await (0, testHelpers_spec_1.once)(project, 'diagnostics');
            await (0, testHelpers_spec_1.expectDiagnosticsAsync)(project, [
                DiagnosticMessages_1.DiagnosticMessages.cannotFindName('varNotThere').message
            ]);
        });
    });
    describe('createProject', () => {
        it('uses given projectNumber', async () => {
            await project.activate({
                projectDir: testHelpers_spec_1.rootDir,
                projectNumber: 123,
                projectKey: undefined,
                workspaceFolder: undefined,
                bsconfigPath: undefined
            });
            (0, chai_1.expect)(project.projectNumber).to.eql(123);
        });
        it('warns about deprecated brsconfig.json', async () => {
            fsExtra.outputFileSync(`${testHelpers_spec_1.rootDir}/subdir1/brsconfig.json`, '');
            await project.activate({
                bsconfigPath: 'subdir1/brsconfig.json',
                projectDir: testHelpers_spec_1.rootDir,
                workspaceFolder: testHelpers_spec_1.rootDir,
                projectKey: undefined
            });
            await (0, testHelpers_spec_1.expectDiagnosticsAsync)(project, [
                DiagnosticMessages_1.DiagnosticMessages.brsConfigJsonIsDeprecated()
            ]);
        });
    });
    describe('getConfigPath', () => {
        it('emits critical failure for missing file', async () => {
            const deferred = new deferred_1.Deferred();
            project.on('critical-failure', (event) => {
                deferred.resolve(event.message);
            });
            await project['getConfigFilePath']({
                projectDir: testHelpers_spec_1.rootDir,
                bsconfigPath: (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/bsconfig.json`
            });
            (0, chai_1.expect)((await deferred.promise).startsWith('Cannot find config file')).to.be.true;
        });
        it('finds brsconfig.json', async () => {
            fsExtra.outputFileSync(`${testHelpers_spec_1.rootDir}/brsconfig.json`, '');
            (0, chai_1.expect)(await project['getConfigFilePath']({
                projectDir: testHelpers_spec_1.rootDir,
                bsconfigPath: undefined
            })).to.eql((0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/brsconfig.json`);
        });
        it('does not crash on undefined', async () => {
            await project['getConfigFilePath'](undefined);
        });
    });
});
//# sourceMappingURL=Project.spec.js.map
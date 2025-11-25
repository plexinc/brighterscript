"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileProtocolPath = void 0;
const chai_config_spec_1 = require("./chai-config.spec");
const fsExtra = require("fs-extra");
const path = require("path");
const vscode_languageserver_1 = require("vscode-languageserver");
const deferred_1 = require("./deferred");
const LanguageServer_1 = require("./LanguageServer");
const sinon_1 = require("sinon");
const util_1 = require("./util");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const assert = require("assert");
const testHelpers_spec_1 = require("./testHelpers.spec");
const reflection_1 = require("./astUtils/reflection");
const visitors_1 = require("./astUtils/visitors");
const testHelpers_spec_2 = require("./testHelpers.spec");
const vscode_uri_1 = require("vscode-uri");
const BusyStatusTracker_1 = require("./BusyStatusTracker");
const logging_1 = require("./logging");
const DiagnosticMessages_1 = require("./DiagnosticMessages");
const roku_deploy_1 = require("roku-deploy");
const undent_1 = require("undent");
const ProjectManager_1 = require("./lsp/ProjectManager");
const sinon = (0, sinon_1.createSandbox)();
const workspacePath = testHelpers_spec_2.rootDir;
const enableThreadingDefault = LanguageServer_1.LanguageServer.enableThreadingDefault;
describe('LanguageServer', () => {
    let server;
    let program;
    let workspaceFolders = [];
    let connection = {
        onInitialize: () => null,
        onInitialized: () => null,
        onDidChangeConfiguration: () => null,
        onDidChangeWatchedFiles: () => null,
        onCompletion: () => null,
        onCompletionResolve: () => null,
        onDocumentSymbol: () => null,
        onWorkspaceSymbol: () => null,
        onDefinition: () => null,
        onSignatureHelp: () => null,
        onReferences: () => null,
        onHover: () => null,
        listen: () => null,
        sendNotification: () => null,
        sendDiagnostics: () => null,
        onExecuteCommand: () => null,
        onCodeAction: () => null,
        onDidOpenTextDocument: () => null,
        onDidChangeTextDocument: () => null,
        onDidCloseTextDocument: () => null,
        onWillSaveTextDocument: () => null,
        onWillSaveTextDocumentWaitUntil: () => null,
        onDidSaveTextDocument: () => null,
        onRequest: () => null,
        workspace: {
            getWorkspaceFolders: () => {
                return workspaceFolders.map(x => ({
                    uri: getFileProtocolPath(x),
                    name: path.basename(x)
                }));
            },
            getConfiguration: () => {
                return {};
            },
            onDidChangeWorkspaceFolders: () => { }
        },
        tracer: {
            log: () => { }
        },
        client: {
            register: () => Promise.resolve()
        }
    };
    beforeEach(() => {
        sinon.restore();
        fsExtra.emptyDirSync(testHelpers_spec_2.tempDir);
        server = new LanguageServer_1.LanguageServer();
        server['busyStatusTracker'] = new BusyStatusTracker_1.BusyStatusTracker();
        workspaceFolders = [workspacePath];
        LanguageServer_1.LanguageServer.enableThreadingDefault = false;
        //mock the connection stuff
        sinon.stub(server, 'establishConnection').callsFake(() => {
            return connection;
        });
        server['hasConfigurationCapability'] = true;
    });
    afterEach(() => {
        sinon.restore();
        fsExtra.emptyDirSync(testHelpers_spec_2.tempDir);
        server['dispose']();
        LanguageServer_1.LanguageServer.enableThreadingDefault = enableThreadingDefault;
    });
    function addXmlFile(name, additionalXmlContents = '') {
        const filePath = `components/${name}.xml`;
        const contents = `<?xml version="1.0" encoding="utf-8"?>
        <component name="${name}" extends="Group">
            ${additionalXmlContents}
            <script type="text/brightscript" uri="${name}.brs" />
        </component>`;
        return program.setFile(filePath, contents);
    }
    function addScriptFile(name, contents, extension = 'brs') {
        const filePath = (0, util_1.standardizePath) `components/${name}.${extension}`;
        const file = program.setFile(filePath, contents);
        if (file) {
            const document = vscode_languageserver_textdocument_1.TextDocument.create(util_1.util.pathToUri(file.srcPath), 'brightscript', 1, contents);
            server['documents']['_syncedDocuments'].set(document.uri, document);
            return document;
        }
    }
    it('does not cause infinite loop of project creation', async () => {
        //add a project with a files array that includes (and then excludes) a file
        fsExtra.outputFileSync((0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/bsconfig.json`, JSON.stringify({
            files: ['source/**/*', '!source/**/*.spec.bs']
        }));
        server['run']();
        function setSyncedDocument(srcPath, text, version = 1) {
            //force an open text document
            const document = vscode_languageserver_textdocument_1.TextDocument.create(util_1.util.pathToUri(util_1.util.standardizePath(srcPath)), 'brightscript', 1, `sub main()\nend sub`);
            server['documents']['_syncedDocuments'].set(document.uri, document);
        }
        //wait for the projects to finish loading up
        await server['syncProjects']();
        //this bug was causing an infinite async loop of new project creations. So monitor the creation of new projects for evaluation later
        const { stub, promise: createProjectsSettled } = (0, testHelpers_spec_1.createInactivityStub)(ProjectManager_1.ProjectManager.prototype, 'constructProject', 400, sinon);
        setSyncedDocument((0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/source/lib1.spec.bs`, 'sub lib1()\nend sub');
        setSyncedDocument((0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/source/lib2.spec.bs`, 'sub lib2()\nend sub');
        // open a file that is excluded by the project, so it should trigger a standalone project.
        await server['onTextDocumentDidChangeContent']({
            document: vscode_languageserver_textdocument_1.TextDocument.create(util_1.util.pathToUri((0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/source/lib1.spec.bs`), 'brightscript', 1, `sub main()\nend sub`)
        });
        //wait for the "create projects" deferred debounce to settle
        await createProjectsSettled;
        //test passes if we've only made 2 new projects (one for each of the standalone projects)
        (0, chai_config_spec_1.expect)(stub.callCount).to.eql(2);
    });
    describe('onDidChangeConfiguration', () => {
        async function doTest(startingConfigs, endingConfigs) {
            server['connection'] = connection;
            server['workspaceConfigsCache'] = new Map(startingConfigs.map(x => [x.workspaceFolder, x]));
            const stub = sinon.stub(server, 'getWorkspaceConfigs').returns(Promise.resolve(endingConfigs));
            await server.onDidChangeConfiguration({ settings: {} });
            stub.restore();
        }
        it('does not reload project when: no projects are present before and after', async () => {
            const stub = sinon.stub(server, 'syncProjects').callsFake(() => Promise.resolve());
            await doTest([], []);
            (0, chai_config_spec_1.expect)(stub.called).to.be.false;
        });
        it('does not reload project when: 1 project is unchanged', async () => {
            const stub = sinon.stub(server, 'syncProjects').callsFake(() => Promise.resolve());
            await doTest([{
                    languageServer: {
                        enableThreading: false,
                        enableProjectDiscovery: true,
                        logLevel: 'info'
                    },
                    workspaceFolder: workspacePath,
                    excludePatterns: []
                }], [{
                    languageServer: {
                        enableThreading: false,
                        enableProjectDiscovery: true,
                        logLevel: 'info'
                    },
                    workspaceFolder: workspacePath,
                    excludePatterns: []
                }]);
            (0, chai_config_spec_1.expect)(stub.called).to.be.false;
        });
        it('reloads project when adding new project', async () => {
            const stub = sinon.stub(server, 'syncProjects').callsFake(() => Promise.resolve());
            await doTest([], [{
                    languageServer: {
                        enableThreading: false,
                        enableProjectDiscovery: true,
                        logLevel: 'info'
                    },
                    workspaceFolder: workspacePath,
                    excludePatterns: []
                }]);
            (0, chai_config_spec_1.expect)(stub.called).to.be.true;
        });
        it('reloads project when deleting a project', async () => {
            const stub = sinon.stub(server, 'syncProjects').callsFake(() => Promise.resolve());
            await doTest([{
                    languageServer: {
                        enableThreading: false,
                        enableProjectDiscovery: true,
                        logLevel: 'info'
                    },
                    workspaceFolder: workspacePath,
                    excludePatterns: []
                }, {
                    languageServer: {
                        enableThreading: false,
                        enableProjectDiscovery: true,
                        logLevel: 'info'
                    },
                    workspaceFolder: (0, util_1.standardizePath) `${testHelpers_spec_2.tempDir}/project2`,
                    excludePatterns: []
                }], [{
                    languageServer: {
                        enableThreading: false,
                        enableProjectDiscovery: true,
                        logLevel: 'info'
                    },
                    workspaceFolder: workspacePath,
                    excludePatterns: []
                }]);
            (0, chai_config_spec_1.expect)(stub.called).to.be.true;
        });
        it('reloads project when changing specific settings', async () => {
            const stub = sinon.stub(server, 'syncProjects').callsFake(() => Promise.resolve());
            await doTest([{
                    languageServer: {
                        enableThreading: false,
                        enableProjectDiscovery: true,
                        logLevel: 'trace'
                    },
                    workspaceFolder: workspacePath,
                    excludePatterns: []
                }], [{
                    languageServer: {
                        enableThreading: false,
                        enableProjectDiscovery: true,
                        logLevel: 'info'
                    },
                    workspaceFolder: workspacePath,
                    excludePatterns: []
                }]);
            (0, chai_config_spec_1.expect)(stub.called).to.be.true;
        });
    });
    describe('sendDiagnostics', () => {
        it('dedupes diagnostics found at same location from multiple projects', async () => {
            var _a, _b;
            fsExtra.outputFileSync((0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/common/lib.brs`, `
                sub test()
                    print alpha 'variable does not exist
                end sub
            `);
            fsExtra.outputFileSync((0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/project1/bsconfig.json`, JSON.stringify({
                rootDir: (0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/project1`,
                files: [{
                        src: `../common/lib.brs`,
                        dest: 'source/lib.brs'
                    }]
            }));
            fsExtra.outputFileSync((0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/project2/bsconfig.json`, JSON.stringify({
                rootDir: (0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/project2`,
                files: [{
                        src: `../common/lib.brs`,
                        dest: 'source/lib.brs'
                    }]
            }));
            server['connection'] = connection;
            let sendDiagnosticsDeferred = new deferred_1.Deferred();
            let stub = sinon.stub(server['connection'], 'sendDiagnostics').callsFake(async (arg) => {
                sendDiagnosticsDeferred.resolve(arg);
                return sendDiagnosticsDeferred.promise;
            });
            await server['syncProjects']();
            await sendDiagnosticsDeferred.promise;
            (0, chai_config_spec_1.expect)((_b = (_a = stub.getCall(0).args) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.diagnostics).to.be.lengthOf(1);
        });
    });
    describe('project-activate', () => {
        it('should sync all open document changes to all projects', async () => {
            //force an open text document
            const srcPath = (0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/source/main.brs`;
            const document = vscode_languageserver_textdocument_1.TextDocument.create(util_1.util.pathToUri(srcPath), 'brightscript', 1, `sub main()\nend sub`);
            server['documents']['_syncedDocuments'].set(document.uri, document);
            const deferred = new deferred_1.Deferred();
            const stub = sinon.stub(server['projectManager'], 'handleFileChanges').callsFake(() => {
                deferred.resolve();
                return Promise.resolve();
            });
            server['projectManager']['emit']('project-activate', {
                project: server['projectManager'].projects[0]
            });
            await deferred.promise;
            (0, chai_config_spec_1.expect)(stub.getCalls()[0].args[0].map(x => ({
                srcPath: x.srcPath,
                fileContents: x.fileContents
            }))).to.eql([{
                    srcPath: srcPath,
                    fileContents: document.getText()
                }]);
        });
        it('handles when there were no open documents', () => {
            server['projectManager']['emit']('project-activate', {
                project: {
                    projectNumber: 1
                }
            });
            //we can't really test this, but it helps with code coverage...
        });
    });
    describe('syncProjects', () => {
        it('loads workspace as project', async () => {
            server.run();
            (0, chai_config_spec_1.expect)(server['projectManager'].projects).to.be.lengthOf(0);
            fsExtra.ensureDirSync(workspacePath);
            await server['syncProjects']();
            //no child bsconfig.json files, use the workspacePath
            (0, chai_config_spec_1.expect)(server['projectManager'].projects.map(x => x.projectKey)).to.eql([
                workspacePath
            ]);
            fsExtra.outputJsonSync((0, util_1.standardizePath) `${workspacePath}/project1/bsconfig.json`, {});
            fsExtra.outputJsonSync((0, util_1.standardizePath) `${workspacePath}/project2/bsconfig.json`, {});
            await server['syncProjects']();
            //2 child bsconfig.json files. Use those folders as projects, and don't use workspacePath
            (0, chai_config_spec_1.expect)(server['projectManager'].projects.map(x => x.projectKey).sort()).to.eql([
                (0, util_1.standardizePath) `${workspacePath}/project1/bsconfig.json`,
                (0, util_1.standardizePath) `${workspacePath}/project2/bsconfig.json`
            ]);
            fsExtra.removeSync((0, util_1.standardizePath) `${workspacePath}/project2/bsconfig.json`);
            await server['syncProjects']();
            //1 child bsconfig.json file. Still don't use workspacePath
            (0, chai_config_spec_1.expect)(server['projectManager'].projects.map(x => x.projectKey)).to.eql([
                (0, util_1.standardizePath) `${workspacePath}/project1/bsconfig.json`
            ]);
            fsExtra.removeSync((0, util_1.standardizePath) `${workspacePath}/project1/bsconfig.json`);
            await server['syncProjects']();
            //back to no child bsconfig.json files. use workspacePath again
            (0, chai_config_spec_1.expect)(server['projectManager'].projects.map(x => x.projectKey)).to.eql([
                workspacePath
            ]);
        });
        it('ignores bsconfig.json files from vscode ignored paths', async () => {
            const mapItem = (item) => {
                if (item.section === 'files') {
                    return {
                        exclude: {
                            '**/vendor': true
                        }
                    };
                }
                else if (item.section === 'search') {
                    return {
                        exclude: {
                            '**/temp': true
                        }
                    };
                }
                else {
                    return {};
                }
            };
            server.run();
            sinon.stub(server['connection'].workspace, 'getConfiguration').callsFake(
            // @ts-expect-error Sinon incorrectly infers the type of this function
            (items) => {
                if (typeof items === 'string') {
                    return Promise.resolve({});
                }
                if (Array.isArray(items)) {
                    return Promise.resolve(items.map(mapItem));
                }
                return Promise.resolve(mapItem(items));
            });
            await server.onInitialized();
            fsExtra.outputJsonSync((0, util_1.standardizePath) `${workspacePath}/vendor/someProject/bsconfig.json`, {});
            fsExtra.outputJsonSync((0, util_1.standardizePath) `${workspacePath}/temp/someProject/bsconfig.json`, {});
            //it always ignores node_modules
            fsExtra.outputJsonSync((0, util_1.standardizePath) `${workspacePath}/node_modules/someProject/bsconfig.json`, {});
            await server['syncProjects']();
            //no child bsconfig.json files, use the workspacePath
            (0, chai_config_spec_1.expect)(server['projectManager'].projects.map(x => x.projectKey)).to.eql([
                workspacePath
            ]);
        });
        it('does not produce duplicate projects when subdir and parent dir are opened as workspace folders', async () => {
            fsExtra.outputJsonSync((0, util_1.standardizePath) `${testHelpers_spec_2.tempDir}/root/bsconfig.json`, {});
            fsExtra.outputJsonSync((0, util_1.standardizePath) `${testHelpers_spec_2.tempDir}/root/subdir/bsconfig.json`, {});
            workspaceFolders = [
                (0, util_1.standardizePath) `${testHelpers_spec_2.tempDir}/root`,
                (0, util_1.standardizePath) `${testHelpers_spec_2.tempDir}/root/subdir`
            ];
            server.run();
            await server['syncProjects']();
            (0, chai_config_spec_1.expect)(server['projectManager'].projects.map(x => x.projectKey).sort()).to.eql([
                (0, util_1.standardizePath) `${testHelpers_spec_2.tempDir}/root/bsconfig.json`,
                (0, util_1.standardizePath) `${testHelpers_spec_2.tempDir}/root/subdir/bsconfig.json`
            ]);
        });
        it('finds nested roku-like dirs', async () => {
            fsExtra.outputFileSync((0, util_1.standardizePath) `${testHelpers_spec_2.tempDir}/project1/manifest`, '');
            fsExtra.outputFileSync((0, util_1.standardizePath) `${testHelpers_spec_2.tempDir}/project1/source/main.brs`, '');
            fsExtra.outputFileSync((0, util_1.standardizePath) `${testHelpers_spec_2.tempDir}/sub/dir/project2/manifest`, '');
            fsExtra.outputFileSync((0, util_1.standardizePath) `${testHelpers_spec_2.tempDir}/sub/dir/project2/source/main.bs`, '');
            //does not match folder with manifest without a sibling ./source folder
            fsExtra.outputFileSync((0, util_1.standardizePath) `${testHelpers_spec_2.tempDir}/project3/manifest`, '');
            workspaceFolders = [
                (0, util_1.standardizePath) `${testHelpers_spec_2.tempDir}/`
            ];
            server.run();
            await server['syncProjects']();
            (0, chai_config_spec_1.expect)(server['projectManager'].projects.map(x => x.projectKey).sort()).to.eql([
                (0, util_1.standardizePath) `${testHelpers_spec_2.tempDir}/project1`,
                (0, util_1.standardizePath) `${testHelpers_spec_2.tempDir}/sub/dir/project2`
            ]);
        });
        it('uses explicit projects list', async () => {
            fsExtra.outputJsonSync((0, util_1.standardizePath) `${testHelpers_spec_2.tempDir}/project1/bsconfig.json`, {});
            fsExtra.outputFileSync((0, util_1.standardizePath) `${testHelpers_spec_2.tempDir}/project1/source/main.brs`, '');
            fsExtra.outputJsonSync((0, util_1.standardizePath) `${testHelpers_spec_2.tempDir}/sub/dir/project2/bsconfig.json`, {});
            fsExtra.outputFileSync((0, util_1.standardizePath) `${testHelpers_spec_2.tempDir}/sub/dir/project2/source/main.bs`, '');
            //not in projects list
            fsExtra.outputJsonSync((0, util_1.standardizePath) `${testHelpers_spec_2.tempDir}/project3/bsconfig.json`, {});
            fsExtra.outputFileSync((0, util_1.standardizePath) `${testHelpers_spec_2.tempDir}/project3/source/main.brs`, '');
            workspaceFolders = [
                (0, util_1.standardizePath) `${testHelpers_spec_2.tempDir}/`
            ];
            const workspaceSettings = {
                languageServer: {
                    enableThreading: false,
                    enableProjectDiscovery: true,
                    logLevel: 'info'
                },
                projects: [
                    // eslint-disable-next-line no-template-curly-in-string
                    'project1',
                    // eslint-disable-next-line no-template-curly-in-string
                    '${workspaceFolder}/sub/dir/project2/bsconfig.json',
                    // eslint-disable-next-line no-template-curly-in-string
                    { name: 'p3', path: '${workspaceFolder}/project3', disabled: true }
                ]
            };
            server.run();
            sinon.stub(server, 'getClientConfiguration').returns(Promise.resolve(workspaceSettings));
            (0, chai_config_spec_1.expect)(await server['getWorkspaceConfigs']()).to.eql([
                {
                    workspaceFolder: (0, util_1.standardizePath) `${testHelpers_spec_2.tempDir}/`,
                    excludePatterns: [],
                    projects: [
                        { path: 'project1' },
                        { path: (0, util_1.standardizePath) `${testHelpers_spec_2.tempDir}/sub/dir/project2/bsconfig.json` },
                        { name: 'p3', path: (0, util_1.standardizePath) `${testHelpers_spec_2.tempDir}/project3`, disabled: true }
                    ],
                    languageServer: {
                        enableThreading: false,
                        enableProjectDiscovery: true,
                        projectDiscoveryMaxDepth: 15,
                        projectDiscoveryExclude: undefined,
                        logLevel: 'info'
                    }
                }
            ]);
        });
    });
    describe('projectDiscoveryExclude and files.watcherExclude', () => {
        it('includes projectDiscoveryExclude in workspace configuration', async () => {
            const projectDiscoveryExclude = {
                '**/test/**': true,
                'node_modules/**': true
            };
            sinon.stub(server, 'getClientConfiguration').callsFake((workspaceFolder, section) => {
                if (section === 'brightscript') {
                    return Promise.resolve({
                        languageServer: {
                            projectDiscoveryExclude: projectDiscoveryExclude
                        }
                    });
                }
                return Promise.resolve({});
            });
            server.run();
            const configs = await server['getWorkspaceConfigs']();
            (0, chai_config_spec_1.expect)(configs[0].languageServer.projectDiscoveryExclude).to.deep.equal(projectDiscoveryExclude);
        });
        it('includes files.watcherExclude in workspace exclude patterns', async () => {
            sinon.stub(server, 'getClientConfiguration').callsFake((workspaceFolder, section) => {
                if (section === 'files') {
                    return Promise.resolve({
                        exclude: { 'node_modules': true },
                        watcherExclude: {
                            '**/tmp/**': true,
                            '**/cache/**': true
                        }
                    });
                }
                return Promise.resolve({});
            });
            server.run();
            const excludeGlobs = await server['getWorkspaceExcludeGlobs'](workspaceFolders[0]);
            (0, chai_config_spec_1.expect)(excludeGlobs).to.include('**/tmp/**');
            (0, chai_config_spec_1.expect)(excludeGlobs).to.include('**/cache/**');
        });
        it('includes projectDiscoveryExclude in workspace exclude patterns', async () => {
            const projectDiscoveryExclude = {
                '**/test/**': true,
                '**/node_modules/**': true,
                '**/.build/**': true
            };
            sinon.stub(server, 'getClientConfiguration').callsFake((workspaceFolder, section) => {
                if (section === 'brightscript') {
                    return Promise.resolve({
                        languageServer: {
                            projectDiscoveryExclude: projectDiscoveryExclude
                        }
                    });
                }
                return Promise.resolve({});
            });
            server.run();
            const excludeGlobs = await server['getWorkspaceExcludeGlobs'](workspaceFolders[0]);
            (0, chai_config_spec_1.expect)(excludeGlobs).to.include('**/test/**');
            (0, chai_config_spec_1.expect)(excludeGlobs).to.include('**/node_modules/**');
            (0, chai_config_spec_1.expect)(excludeGlobs).to.include('**/.build/**');
        });
        it('handles undefined projectDiscoveryExclude without crashing', async () => {
            sinon.stub(server, 'getClientConfiguration').callsFake((workspaceFolder, section) => {
                if (section === 'brightscript') {
                    return Promise.resolve({
                        languageServer: {
                        // projectDiscoveryExclude is undefined
                        }
                    });
                }
                return Promise.resolve({});
            });
            server.run();
            const configs = await server['getWorkspaceConfigs']();
            (0, chai_config_spec_1.expect)(configs[0].languageServer.projectDiscoveryExclude).to.be.undefined;
            // Should not crash during pathFilterer rebuild
            await server['rebuildPathFilterer']();
        });
        it('handles undefined files.watcherExclude without crashing', async () => {
            sinon.stub(server, 'getClientConfiguration').callsFake((workspaceFolder, section) => {
                if (section === 'files') {
                    return Promise.resolve({
                        exclude: { '**/node_modules/**/*': true }
                        // watcherExclude is undefined
                    });
                }
                return Promise.resolve({});
            });
            server.run();
            const excludeGlobs = await server['getWorkspaceExcludeGlobs'](workspaceFolders[0]);
            (0, chai_config_spec_1.expect)(excludeGlobs).to.eql([
                '**/node_modules/**/*'
            ]);
        });
        it('handles null/undefined configuration sections without crashing', async () => {
            sinon.stub(server, 'getClientConfiguration').callsFake((workspaceFolder, section) => {
                return Promise.resolve(null);
            });
            server.run();
            const configs = await server['getWorkspaceConfigs']();
            (0, chai_config_spec_1.expect)(configs[0].languageServer.projectDiscoveryExclude).to.be.undefined;
            const excludeGlobs = await server['getWorkspaceExcludeGlobs'](workspaceFolders[0]);
            (0, chai_config_spec_1.expect)(excludeGlobs).to.eql([]);
        });
        it('handles empty objects for configuration sections without crashing', async () => {
            sinon.stub(server, 'getClientConfiguration').callsFake((workspaceFolder, section) => {
                return Promise.resolve({});
            });
            server.run();
            const configs = await server['getWorkspaceConfigs']();
            (0, chai_config_spec_1.expect)(configs[0].languageServer.projectDiscoveryExclude).to.be.undefined;
            const excludeGlobs = await server['getWorkspaceExcludeGlobs'](workspaceFolders[0]);
            (0, chai_config_spec_1.expect)(excludeGlobs).to.eql([]);
        });
        it('handles mixed defined/undefined settings without crashing', async () => {
            sinon.stub(server, 'getClientConfiguration').callsFake((workspaceFolder, section) => {
                if (section === 'brightscript') {
                    return Promise.resolve({
                        languageServer: {
                            projectDiscoveryExclude: {
                                '**/test/**/*': true
                            }
                        }
                    });
                }
                else if (section === 'files') {
                    return Promise.resolve({
                        exclude: { '**/excludeMe/**/*': true }
                        // watcherExclude is undefined
                    });
                }
                return Promise.resolve({});
            });
            server.run();
            const excludeGlobs = await server['getWorkspaceExcludeGlobs'](workspaceFolders[0]);
            (0, chai_config_spec_1.expect)(excludeGlobs).to.eql([
                '**/excludeMe/**/*',
                '**/test/**/*'
            ]);
            // Should not crash during pathFilterer rebuild
            await server['rebuildPathFilterer']();
        });
    });
    describe('onInitialize', () => {
        it('sets capabilities', async () => {
            server['hasConfigurationCapability'] = false;
            server['clientHasWorkspaceFolderCapability'] = false;
            await server.onInitialize({
                capabilities: {
                    workspace: {
                        configuration: true,
                        workspaceFolders: true
                    }
                }
            });
            (0, chai_config_spec_1.expect)(server['hasConfigurationCapability']).to.be.true;
            (0, chai_config_spec_1.expect)(server['clientHasWorkspaceFolderCapability']).to.be.true;
        });
    });
    describe('onInitialized', () => {
        it('registers workspaceFolders change listener', async () => {
            server['connection'] = connection;
            const deferred = new deferred_1.Deferred();
            sinon.stub(server['connection']['workspace'], 'onDidChangeWorkspaceFolders').callsFake((() => {
                deferred.resolve();
            }));
            server['hasConfigurationCapability'] = false;
            server['clientHasWorkspaceFolderCapability'] = true;
            await server.onInitialized();
            //if the promise resolves, we know the function was called
            await deferred.promise;
        });
    });
    describe('syncLogLevel', () => {
        beforeEach(() => {
            //disable logging for these tests
            sinon.stub(logging_1.Logger.prototype, 'write').callsFake(() => { });
        });
        it('uses a default value when no workspace or projects are present', async () => {
            server.run();
            await server['syncLogLevel']();
            (0, chai_config_spec_1.expect)(server.logger.logLevel).to.eql(logging_1.LogLevel.log);
        });
        it('recovers when workspace sends unsupported value', async () => {
            server.run();
            sinon.stub(server, 'getClientConfiguration').returns(Promise.resolve({
                languageServer: {
                    logLevel: 'not-valid'
                }
            }));
            await server['syncLogLevel']();
            (0, chai_config_spec_1.expect)(server.logger.logLevel).to.eql(logging_1.LogLevel.log);
        });
        it('uses logLevel from workspace', async () => {
            server.run();
            sinon.stub(server, 'getClientConfiguration').returns(Promise.resolve({
                languageServer: {
                    logLevel: 'trace'
                }
            }));
            await server['syncLogLevel']();
            (0, chai_config_spec_1.expect)(server.logger.logLevel).to.eql(logging_1.LogLevel.trace);
        });
        it('uses the higher-verbosity logLevel from multiple workspaces', async () => {
            server.run();
            //mock multiple workspaces
            sinon.stub(server['connection'].workspace, 'getWorkspaceFolders').returns(Promise.resolve([
                {
                    name: 'workspace1',
                    uri: getFileProtocolPath((0, util_1.standardizePath) `${testHelpers_spec_2.tempDir}/project1`)
                },
                {
                    name: 'workspace1',
                    uri: getFileProtocolPath((0, util_1.standardizePath) `${testHelpers_spec_2.tempDir}/project2`)
                }
            ]));
            sinon.stub(server, 'getClientConfiguration').onFirstCall().returns(Promise.resolve({
                languageServer: {
                    logLevel: 'trace'
                }
            })).onSecondCall().returns(Promise.resolve({
                languageServer: {
                    logLevel: 'info'
                }
            }));
            await server['syncLogLevel']();
            (0, chai_config_spec_1.expect)(server.logger.logLevel).to.eql(logging_1.LogLevel.trace);
        });
        it('uses valid workspace value when one of them is invalid', async () => {
            server.run();
            //mock multiple workspaces
            sinon.stub(server['connection'].workspace, 'getWorkspaceFolders').returns(Promise.resolve([
                {
                    name: 'workspace1',
                    uri: getFileProtocolPath((0, util_1.standardizePath) `${testHelpers_spec_2.tempDir}/project1`)
                },
                {
                    name: 'workspace1',
                    uri: getFileProtocolPath((0, util_1.standardizePath) `${testHelpers_spec_2.tempDir}/project2`)
                }
            ]));
            sinon.stub(server, 'getClientConfiguration').onFirstCall().returns(Promise.resolve({
                languageServer: {
                    logLevel: 'trace1'
                }
            })).onSecondCall().returns(Promise.resolve({
                languageServer: {
                    logLevel: 'info'
                }
            }));
            await server['syncLogLevel']();
            (0, chai_config_spec_1.expect)(server.logger.logLevel).to.eql(logging_1.LogLevel.info);
        });
        it('uses value from projects when not found in workspace', async () => {
            server.run();
            //mock multiple workspaces
            sinon.stub(server['connection'].workspace, 'getWorkspaceFolders').returns(Promise.resolve([{
                    name: 'workspace1',
                    uri: getFileProtocolPath((0, util_1.standardizePath) `${testHelpers_spec_2.tempDir}/project2`)
                }]));
            server['projectManager'].projects.push({
                logger: (0, logging_1.createLogger)({
                    logLevel: logging_1.LogLevel.info
                }),
                projectNumber: 2
            });
            await server['syncLogLevel']();
            (0, chai_config_spec_1.expect)(server.logger.logLevel).to.eql(logging_1.LogLevel.info);
        });
    });
    describe('rebuildPathFilterer', () => {
        let workspaceConfigs = [];
        beforeEach(() => {
            workspaceConfigs = [
                {
                    languageServer: {
                        enableThreading: false,
                        enableProjectDiscovery: true,
                        logLevel: 'info'
                    },
                    workspaceFolder: workspacePath,
                    excludePatterns: []
                }
            ];
            server['connection'] = connection;
            sinon.stub(server, 'getWorkspaceConfigs').callsFake(() => Promise.resolve(workspaceConfigs));
        });
        it('allows files from dist by default', async () => {
            const filterer = await server['rebuildPathFilterer']();
            //certain files are allowed through by default
            (0, chai_config_spec_1.expect)(filterer.filter([
                (0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/manifest`,
                (0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/dist/file.brs`,
                (0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/source/file.brs`
            ])).to.eql([
                (0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/manifest`,
                (0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/dist/file.brs`,
                (0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/source/file.brs`
            ]);
        });
        it('filters out some standard locations by default', async () => {
            const filterer = await server['rebuildPathFilterer']();
            (0, chai_config_spec_1.expect)(filterer.filter([
                (0, util_1.standardizePath) `${workspacePath}/node_modules/file.brs`,
                (0, util_1.standardizePath) `${workspacePath}/.git/file.brs`,
                (0, util_1.standardizePath) `${workspacePath}/out/file.brs`,
                (0, util_1.standardizePath) `${workspacePath}/.roku-deploy-staging/file.brs`
            ])).to.eql([]);
        });
        it('properly handles a .gitignore list', async () => {
            fsExtra.outputFileSync((0, util_1.standardizePath) `${workspacePath}/.gitignore`, (0, undent_1.default) `
                dist/
            `);
            const filterer = await server['rebuildPathFilterer']();
            //filters files that appear in a .gitignore list
            (0, chai_config_spec_1.expect)(filterer.filter([
                (0, util_1.standardizePath) `${workspacePath}/src/source/file.brs`,
                //this file should be excluded
                (0, util_1.standardizePath) `${workspacePath}/dist/source/file.brs`
            ])).to.eql([
                (0, util_1.standardizePath) `${workspacePath}/src/source/file.brs`
            ]);
        });
        it('does not crash for path outside of workspaceFolder', async () => {
            fsExtra.outputFileSync((0, util_1.standardizePath) `${workspacePath}/.gitignore`, (0, undent_1.default) `
                dist/
            `);
            const filterer = await server['rebuildPathFilterer']();
            //filters files that appear in a .gitignore list
            (0, chai_config_spec_1.expect)(filterer.filter([
                (0, util_1.standardizePath) `${workspacePath}/../flavor1/src/source/file.brs`
            ])).to.eql([
                //since the path is outside the workspace, it does not match the .gitignore patter, and thus is not excluded
                (0, util_1.standardizePath) `${workspacePath}/../flavor1/src/source/file.brs`
            ]);
        });
        it('a gitignore file from any workspace will apply to all workspaces', async () => {
            workspaceConfigs = [{
                    languageServer: {
                        enableThreading: false,
                        enableProjectDiscovery: true,
                        logLevel: 'info'
                    },
                    workspaceFolder: (0, util_1.standardizePath) `${testHelpers_spec_2.tempDir}/flavor1`,
                    excludePatterns: []
                }, {
                    languageServer: {
                        enableThreading: false,
                        enableProjectDiscovery: true,
                        logLevel: 'info'
                    },
                    workspaceFolder: (0, util_1.standardizePath) `${testHelpers_spec_2.tempDir}/flavor2`,
                    excludePatterns: []
                }];
            fsExtra.outputFileSync((0, util_1.standardizePath) `${workspaceConfigs[0].workspaceFolder}/.gitignore`, (0, undent_1.default) `
                dist/
            `);
            fsExtra.outputFileSync((0, util_1.standardizePath) `${workspaceConfigs[1].workspaceFolder}/.gitignore`, (0, undent_1.default) `
                out/
            `);
            const filterer = await server['rebuildPathFilterer']();
            //filters files that appear in a .gitignore list
            (0, chai_config_spec_1.expect)(filterer.filter([
                //included files
                (0, util_1.standardizePath) `${workspaceConfigs[0].workspaceFolder}/src/source/file.brs`,
                (0, util_1.standardizePath) `${workspaceConfigs[1].workspaceFolder}/src/source/file.brs`,
                //excluded files
                (0, util_1.standardizePath) `${workspaceConfigs[0].workspaceFolder}/dist/source/file.brs`,
                (0, util_1.standardizePath) `${workspaceConfigs[1].workspaceFolder}/out/source/file.brs`
            ])).to.eql([
                (0, util_1.standardizePath) `${workspaceConfigs[0].workspaceFolder}/src/source/file.brs`,
                (0, util_1.standardizePath) `${workspaceConfigs[1].workspaceFolder}/src/source/file.brs`
            ]);
        });
        it('does not erase project-specific filters', async () => {
            let filterer = await server['rebuildPathFilterer']();
            const files = [
                (0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/node_modules/one/file.xml`,
                (0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/node_modules/two.bs`,
                (0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/node_modules/three/dist/lib.bs`
            ];
            //all node_modules files are filtered out by default, unless included in an includeList
            (0, chai_config_spec_1.expect)(filterer.filter(files)).to.eql([]);
            //register two specific node_module folders to include
            filterer.registerIncludeList(testHelpers_spec_2.rootDir, ['node_modules/one/**/*', 'node_modules/two.bs']);
            //unless included in an includeList
            (0, chai_config_spec_1.expect)(filterer.filter(files)).to.eql([
                (0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/node_modules/one/file.xml`,
                (0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/node_modules/two.bs`
                //three should still be excluded
            ]);
            //rebuild the path filterer, make sure the project's includeList is still retained
            filterer = await server['rebuildPathFilterer']();
            (0, chai_config_spec_1.expect)(filterer.filter(files)).to.eql([
                //one and two should still make it through the filter unscathed
                (0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/node_modules/one/file.xml`,
                (0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/node_modules/two.bs`
                //three should still be excluded
            ]);
        });
        it('a removed project includeList gets unregistered', async () => {
            let filterer = await server['rebuildPathFilterer']();
            const files = [
                (0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/project1/node_modules/one/file.xml`,
                (0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/project1/node_modules/two.bs`,
                (0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/project1/node_modules/three/dist/lib.bs`
            ];
            //all node_modules files are filtered out by default, unless included in an includeList
            (0, chai_config_spec_1.expect)(filterer.filter(files)).to.eql([]);
            //register a new project that references a file from node_modules
            fsExtra.outputFileSync((0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/project1/bsconfig.json`, JSON.stringify({
                files: ['node_modules/one/file.xml']
            }));
            await server['syncProjects']();
            //one should be included because the project references it
            (0, chai_config_spec_1.expect)(filterer.filter(files)).to.eql([
                (0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/project1/node_modules/one/file.xml`
            ]);
            //delete the project's bsconfig.json and sync again (thus destroying the project)
            fsExtra.removeSync((0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/project1/bsconfig.json`);
            await server['syncProjects']();
            //the project's pathFilterer pattern has been unregistered
            (0, chai_config_spec_1.expect)(filterer.filter(files)).to.eql([]);
        });
    });
    describe('onDidChangeWatchedFiles', () => {
        it('does not trigger revalidates when changes are in files which are not tracked', async () => {
            server.run();
            const externalDir = (0, util_1.standardizePath) `${testHelpers_spec_2.tempDir}/not_app_dir`;
            fsExtra.outputJsonSync((0, util_1.standardizePath) `${externalDir}/bsconfig.json`, {});
            fsExtra.outputFileSync((0, util_1.standardizePath) `${externalDir}/source/main.brs`, '');
            fsExtra.outputFileSync((0, util_1.standardizePath) `${externalDir}/source/lib.brs`, '');
            await server['syncProjects']();
            const stub2 = sinon.stub(server['projectManager'].projects[0]['builder'].program, 'setFile');
            await server['onDidChangeWatchedFiles']({
                changes: [{
                        type: vscode_languageserver_1.FileChangeType.Created,
                        uri: getFileProtocolPath(externalDir)
                    }]
            });
            (0, chai_config_spec_1.expect)(stub2.getCalls()).to.be.empty;
        });
        it('rebuilds the path filterer when certain files are changed', async () => {
            sinon.stub(server['projectManager'], 'handleFileChanges').callsFake(() => Promise.resolve());
            server['connection'] = connection;
            async function test(filePath, expected = true) {
                const stub = sinon.stub(server, 'rebuildPathFilterer');
                await server['onDidChangeWatchedFiles']({
                    changes: [{
                            type: vscode_languageserver_1.FileChangeType.Changed,
                            uri: util_1.util.pathToUri(filePath)
                        }]
                });
                (0, chai_config_spec_1.expect)(stub.getCalls().length).to.eql(expected ? 1 : 0);
                stub.restore();
            }
            await test((0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/bsconfig.json`);
            await test((0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/sub/dir/bsconfig.json`);
            await test((0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/.vscode/settings.json`);
            await test((0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/.gitignore`);
            await test((0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/sub/dir/.two/.gitignore`);
            await test((0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/source/main.brs`, false);
        });
        it('excludes explicit workspaceFolder paths', async () => {
            server.connection = connection;
            sinon.stub(server['connection'].workspace, 'getWorkspaceFolders').returns(Promise.resolve([{
                    name: 'workspace1',
                    uri: util_1.util.pathToUri((0, util_1.standardizePath) `${testHelpers_spec_2.tempDir}/project1`)
                }]));
            const stub = sinon.stub(server['projectManager'], 'handleFileChanges').callsFake(() => Promise.resolve());
            await server['onDidChangeWatchedFiles']({
                changes: [{
                        type: vscode_languageserver_1.FileChangeType.Created,
                        uri: util_1.util.pathToUri((0, util_1.standardizePath) `${testHelpers_spec_2.tempDir}/project1`)
                    }]
            });
            //it did not send along the workspace folder itself
            (0, chai_config_spec_1.expect)(stub.getCalls()[0].args[0]).to.eql([]);
        });
    });
    describe('onDocumentClose', () => {
        it('calls handleFileClose', async () => {
            const stub = sinon.stub(server['projectManager'], 'handleFileClose').callsFake((() => { }));
            await server['onDocumentClose']({
                document: {
                    uri: util_1.util.pathToUri((0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/source/main.brs`)
                }
            });
            (0, chai_config_spec_1.expect)(stub.args[0][0].srcPath).to.eql((0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/source/main.brs`);
        });
    });
    describe('onSignatureHelp', () => {
        let callDocument;
        let importingXmlFile;
        const functionFileBaseName = 'buildAwesome';
        const funcDefinitionLine = 'function buildAwesome(confirm = true as Boolean)';
        beforeEach(async () => {
            server['connection'] = server['establishConnection']();
            await server['syncProjects']();
            program = server['projectManager'].projects[0]['builder'].program;
            const name = `CallComponent`;
            callDocument = addScriptFile(name, `
                sub init()
                    shouldBuildAwesome = true
                    if shouldBuildAwesome then
                        buildAwesome()
                    else
                        m.buildAwesome()
                    end if
                end sub
            `);
            importingXmlFile = addXmlFile(name, `<script type="text/brightscript" uri="${functionFileBaseName}.bs" />`);
        });
        it('should return the expected signature info when documentation is included', async () => {
            const funcDescriptionComment = '@description Builds awesome for you';
            const funcReturnComment = '@return {Integer} The key to everything';
            addScriptFile(functionFileBaseName, `
                ' /**
                ' * ${funcDescriptionComment}
                ' * ${funcReturnComment}
                ' */
                ${funcDefinitionLine}
                    return 42
                end function
            `, 'bs');
            const result = await server['onSignatureHelp']({
                textDocument: {
                    uri: callDocument.uri
                },
                position: util_1.util.createPosition(4, 37)
            });
            (0, chai_config_spec_1.expect)(result.signatures).to.not.be.empty;
            const signature = result.signatures[0];
            (0, chai_config_spec_1.expect)(signature.label).to.equal(funcDefinitionLine);
            (0, chai_config_spec_1.expect)(signature.documentation).to.include(funcDescriptionComment);
            (0, chai_config_spec_1.expect)(signature.documentation).to.include(funcReturnComment);
        });
        it('should work if used on a property value', async () => {
            addScriptFile(functionFileBaseName, `
                ${funcDefinitionLine}
                    return 42
                end function
            `, 'bs');
            const result = await server['onSignatureHelp']({
                textDocument: {
                    uri: callDocument.uri
                },
                position: util_1.util.createPosition(6, 39)
            });
            (0, chai_config_spec_1.expect)(result.signatures).to.not.be.empty;
            const signature = result.signatures[0];
            (0, chai_config_spec_1.expect)(signature.label).to.equal(funcDefinitionLine);
        });
        it('should give the correct signature for a class method', async () => {
            const classMethodDefinitionLine = 'function buildAwesome(classVersion = true as Boolean)';
            addScriptFile(functionFileBaseName, `
                class ${functionFileBaseName}
                    ${classMethodDefinitionLine}
                        return 42
                    end function
                end class
            `, 'bs');
            const result = await server['onSignatureHelp']({
                textDocument: {
                    uri: callDocument.uri
                },
                position: util_1.util.createPosition(6, 39)
            });
            (0, chai_config_spec_1.expect)(result.signatures).to.not.be.empty;
            const signature = result.signatures[0];
            (0, chai_config_spec_1.expect)(signature.label).to.equal(classMethodDefinitionLine);
        });
        it('should return "null" as signature and parameter when used on something with no signature', async () => {
            const result = await server['onSignatureHelp']({
                textDocument: {
                    uri: importingXmlFile.pkgPath
                },
                position: util_1.util.createPosition(0, 5)
            });
            console.dir(result);
            (0, chai_config_spec_1.expect)(result.signatures.length).to.equal(0);
            (0, chai_config_spec_1.expect)(result.activeSignature).to.equal(null);
            (0, chai_config_spec_1.expect)(result.activeParameter).to.equal(null);
        });
    });
    describe('onCompletion', () => {
        it('does not crash when uri is invalid', async () => {
            sinon.stub(server['projectManager'], 'getCompletions').callsFake(() => Promise.resolve({ items: [], isIncomplete: false }));
            (0, chai_config_spec_1.expect)(await server['onCompletion']({
                textDocument: {
                    uri: 'invalid'
                },
                position: util_1.util.createPosition(0, 0)
            })).to.eql({
                items: [],
                isIncomplete: false
            });
        });
    });
    describe('onReferences', () => {
        let functionDocument;
        let referenceFileUris = [];
        beforeEach(async () => {
            server['connection'] = server['establishConnection']();
            await server['syncProjects']();
            program = server['projectManager'].projects[0]['builder'].program;
            const functionFileBaseName = 'buildAwesome';
            functionDocument = addScriptFile(functionFileBaseName, `
                function buildAwesome()
                    return 42
                end function
            `);
            for (let i = 0; i < 5; i++) {
                let name = `CallComponent${i}`;
                const document = addScriptFile(name, `
                    sub init()
                        shouldBuildAwesome = true
                        if shouldBuildAwesome then
                            buildAwesome()
                        end if
                    end sub
                `);
                addXmlFile(name, `<script type="text/brightscript" uri="${functionFileBaseName}.brs" />`);
                referenceFileUris.push(document.uri);
            }
        });
        it('should return the expected results if we entered on an identifier token', async () => {
            const references = await server['onReferences']({
                textDocument: {
                    uri: functionDocument.uri
                },
                position: util_1.util.createPosition(1, 32)
            });
            (0, chai_config_spec_1.expect)(references.length).to.equal(referenceFileUris.length);
            for (const reference of references) {
                (0, chai_config_spec_1.expect)(referenceFileUris).to.contain(reference.uri);
            }
        });
        it('should return an empty response if we entered on a token that should not return any results', async () => {
            let references = await server['onReferences']({
                textDocument: {
                    uri: functionDocument.uri
                },
                position: util_1.util.createPosition(1, 20) // function token
            });
            (0, chai_config_spec_1.expect)(references).to.be.empty;
            references = await server['onReferences']({
                textDocument: {
                    uri: functionDocument.uri
                },
                position: util_1.util['createPosition'](1, 20) // return token
            });
            (0, chai_config_spec_1.expect)(references).to.be.empty;
        });
    });
    describe('onDefinition', () => {
        let functionDocument;
        let referenceDocument;
        beforeEach(async () => {
            server['connection'] = server['establishConnection']();
            await server['syncProjects']();
            program = server['projectManager'].projects[0]['builder'].program;
            const functionFileBaseName = 'buildAwesome';
            functionDocument = addScriptFile(functionFileBaseName, `
                function pi()
                    return 3.141592653589793
                end function

                function buildAwesome()
                    return 42
                end function
            `);
            const name = `CallComponent`;
            referenceDocument = addScriptFile(name, `
                sub init()
                    shouldBuildAwesome = true
                    if shouldBuildAwesome then
                        buildAwesome()
                    else
                        m.top.observeFieldScope("loadFinished", "buildAwesome")
                    end if
                end sub
            `);
            addXmlFile(name, `<script type="text/brightscript" uri="${functionFileBaseName}.brs" />`);
        });
        it('should return the expected location if we entered on an identifier token', async () => {
            const locations = await server['onDefinition']({
                textDocument: {
                    uri: referenceDocument.uri
                },
                position: util_1.util.createPosition(4, 33)
            });
            (0, chai_config_spec_1.expect)(locations.length).to.equal(1);
            const location = locations[0];
            (0, chai_config_spec_1.expect)(location.uri).to.equal(functionDocument.uri);
            (0, chai_config_spec_1.expect)(location.range.start.line).to.equal(5);
            (0, chai_config_spec_1.expect)(location.range.start.character).to.equal(16);
        });
        it('should return the expected location if we entered on a StringLiteral token', async () => {
            const locations = await server['onDefinition']({
                textDocument: {
                    uri: referenceDocument.uri
                },
                position: util_1.util.createPosition(6, 77)
            });
            (0, chai_config_spec_1.expect)(locations.length).to.equal(1);
            const location = locations[0];
            (0, chai_config_spec_1.expect)(location.uri).to.equal(functionDocument.uri);
            (0, chai_config_spec_1.expect)(location.range.start.line).to.equal(5);
            (0, chai_config_spec_1.expect)(location.range.start.character).to.equal(16);
        });
        it('should return nothing if neither StringLiteral or identifier token entry point', async () => {
            const locations = await server['onDefinition']({
                textDocument: {
                    uri: referenceDocument.uri
                },
                position: util_1.util.createPosition(1, 18)
            });
            (0, chai_config_spec_1.expect)(locations).to.be.empty;
        });
        it('should work on local variables as well', async () => {
            const locations = await server['onDefinition']({
                textDocument: {
                    uri: referenceDocument.uri
                },
                position: util_1.util.createPosition(3, 36)
            });
            (0, chai_config_spec_1.expect)(locations.length).to.equal(1);
            const location = locations[0];
            (0, chai_config_spec_1.expect)(location.uri).to.equal(referenceDocument.uri);
            (0, chai_config_spec_1.expect)(location.range.start.line).to.equal(2);
            (0, chai_config_spec_1.expect)(location.range.start.character).to.equal(20);
            (0, chai_config_spec_1.expect)(location.range.end.line).to.equal(2);
            (0, chai_config_spec_1.expect)(location.range.end.character).to.equal(38);
        });
        it('should work for bs class functions as well', async () => {
            const functionFileBaseName = 'Build';
            functionDocument = addScriptFile(functionFileBaseName, `
                class ${functionFileBaseName}
                    function awesome()
                        return 42
                    end function
                end class
            `, 'bs');
            const name = `CallComponent`;
            referenceDocument = addScriptFile(name, `
                sub init()
                    build = new Build()
                    build.awesome()
                end sub
            `);
            addXmlFile(name, `<script type="text/brightscript" uri="${functionFileBaseName}.bs" />`);
            const locations = await server['onDefinition']({
                textDocument: {
                    uri: referenceDocument.uri
                },
                position: util_1.util.createPosition(3, 30)
            });
            (0, chai_config_spec_1.expect)(locations.length).to.equal(1);
            const location = locations[0];
            (0, chai_config_spec_1.expect)(location.uri).to.equal(functionDocument.uri);
            (0, chai_config_spec_1.expect)(location.range.start.line).to.equal(2);
            (0, chai_config_spec_1.expect)(location.range.start.character).to.equal(20);
            (0, chai_config_spec_1.expect)(location.range.end.line).to.equal(4);
            (0, chai_config_spec_1.expect)(location.range.end.character).to.equal(32);
        });
    });
    describe('onDocumentSymbol', () => {
        beforeEach(async () => {
            server['connection'] = server['establishConnection']();
            await server['syncProjects']();
            program = server['projectManager'].projects[0]['builder'].program;
        });
        it('should return the expected symbols even if pulled from cache', async () => {
            const document = addScriptFile('buildAwesome', `
                function pi()
                    return 3.141592653589793
                end function

                function buildAwesome()
                    return 42
                end function
            `);
            // We run the check twice as the first time is with it not cached and second time is with it cached
            for (let i = 0; i < 2; i++) {
                const symbols = (await server.onDocumentSymbol({
                    textDocument: document
                }));
                (0, chai_config_spec_1.expect)(symbols.length).to.equal(2);
                (0, chai_config_spec_1.expect)(symbols[0].name).to.equal('pi');
                (0, chai_config_spec_1.expect)(symbols[1].name).to.equal('buildAwesome');
            }
        });
        it('should work for brightscript classes as well', async () => {
            const document = addScriptFile('MyFirstClass', `
                class MyFirstClass
                    function pi()
                        return 3.141592653589793
                    end function

                    function buildAwesome()
                        return 42
                    end function
                end class
            `, 'bs');
            // We run the check twice as the first time is with it not cached and second time is with it cached
            for (let i = 0; i < 2; i++) {
                const symbols = (await server['onDocumentSymbol']({
                    textDocument: document
                }));
                (0, chai_config_spec_1.expect)(symbols.length).to.equal(1);
                const classSymbol = symbols[0];
                (0, chai_config_spec_1.expect)(classSymbol.name).to.equal('MyFirstClass');
                const classChildrenSymbols = classSymbol.children;
                (0, chai_config_spec_1.expect)(classChildrenSymbols.length).to.equal(2);
                (0, chai_config_spec_1.expect)(classChildrenSymbols[0].name).to.equal('pi');
                (0, chai_config_spec_1.expect)(classChildrenSymbols[1].name).to.equal('buildAwesome');
            }
        });
        it('should work for brightscript namespaces as well', async () => {
            const document = addScriptFile('MyFirstNamespace', `
                namespace MyFirstNamespace
                    function pi()
                        return 3.141592653589793
                    end function

                    function buildAwesome()
                        return 42
                    end function
                end namespace
            `, 'bs');
            program.validate();
            // We run the check twice as the first time is with it not cached and second time is with it cached
            for (let i = 0; i < 2; i++) {
                const symbols = (await server['onDocumentSymbol']({
                    textDocument: document
                }));
                (0, chai_config_spec_1.expect)(symbols.length).to.equal(1);
                const namespaceSymbol = symbols[0];
                (0, chai_config_spec_1.expect)(namespaceSymbol.name).to.equal('MyFirstNamespace');
                const classChildrenSymbols = namespaceSymbol.children;
                (0, chai_config_spec_1.expect)(classChildrenSymbols.length).to.equal(2);
                (0, chai_config_spec_1.expect)(classChildrenSymbols[0].name).to.equal('pi');
                (0, chai_config_spec_1.expect)(classChildrenSymbols[1].name).to.equal('buildAwesome');
            }
        });
    });
    describe('onWorkspaceSymbol', () => {
        beforeEach(async () => {
            server['connection'] = server['establishConnection']();
            await server['syncProjects']();
            program = server['projectManager'].projects[0]['builder'].program;
        });
        it('should return the expected symbols even if pulled from cache', async () => {
            const className = 'MyFirstClass';
            const namespaceName = 'MyFirstNamespace';
            addScriptFile('buildAwesome', `
                function pi()
                    return 3.141592653589793
                end function

                function buildAwesome()
                    return 42
                end function
            `);
            addScriptFile(className, `
                class ${className}
                    function ${className}pi()
                        return 3.141592653589793
                    end function

                    function ${className}buildAwesome()
                        return 42
                    end function
                end class
            `, 'bs');
            addScriptFile(namespaceName, `
                namespace ${namespaceName}
                    function pi()
                        return 3.141592653589793
                    end function

                    function buildAwesome()
                        return 42
                    end function
                end namespace
            `, 'bs');
            // We run the check twice as the first time is with it not cached and second time is with it cached
            for (let i = 0; i < 2; i++) {
                const symbols = await server['onWorkspaceSymbol']({});
                (0, chai_config_spec_1.expect)(symbols.length).to.equal(8);
                for (const symbol of symbols) {
                    switch (symbol.name) {
                        case 'pi':
                            break;
                        case 'buildAwesome':
                            break;
                        case `${className}`:
                            break;
                        case `${className}pi`:
                            (0, chai_config_spec_1.expect)(symbol.containerName).to.equal(className);
                            break;
                        case `${className}buildAwesome`:
                            (0, chai_config_spec_1.expect)(symbol.containerName).to.equal(className);
                            break;
                        case `${namespaceName}`:
                            break;
                        case `${namespaceName}.pi`:
                            (0, chai_config_spec_1.expect)(symbol.containerName).to.equal(namespaceName);
                            break;
                        case `${namespaceName}.buildAwesome`:
                            (0, chai_config_spec_1.expect)(symbol.containerName).to.equal(namespaceName);
                            break;
                        default:
                            assert.fail(`'${symbol.name}' was not expected in list of symbols`);
                    }
                }
            }
        });
        it('should work for nested class as well', async () => {
            addScriptFile('nested', `
                namespace animals
                    class dog
                        function run()
                            return 3.141592653589793
                        end function

                        function speak()
                            return 42
                        end function
                    end class
                end namespace
            `, 'bs');
            program.validate();
            // We run the check twice as the first time is with it not cached and second time is with it cached
            for (let i = 0; i < 2; i++) {
                const symbols = await server['onWorkspaceSymbol']({});
                (0, chai_config_spec_1.expect)(symbols.map(x => ({
                    name: x.name,
                    containerName: x.containerName
                })).sort((a, b) => a.name.localeCompare(b.name))).to.eql([
                    { name: 'animals', containerName: undefined },
                    { name: `dog`, containerName: 'animals' },
                    { name: `run`, containerName: 'dog' },
                    { name: 'speak', containerName: 'dog' }
                ]);
            }
        });
    });
    describe('getClientConfiguration', () => {
        it('executes the connection.workspace.getConfiguration call when enabled to do so', async () => {
            server.run();
            sinon.restore();
            sinon.stub(server['connection'].workspace, 'getConfiguration').returns(Promise.resolve({ configFile: 'something.json' }));
            server['hasConfigurationCapability'] = true;
            (0, chai_config_spec_1.expect)(await server['getClientConfiguration'](workspacePath, 'brightscript')).to.eql({
                configFile: 'something.json'
            });
        });
        it('skips the connection.workspace.getConfiguration call when not supported', async () => {
            server.run();
            sinon.restore();
            const stub = sinon.stub(server['connection'].workspace, 'getConfiguration').returns(Promise.resolve({ configFile: 'something.json' }));
            server['hasConfigurationCapability'] = false;
            await server['getClientConfiguration'](workspacePath, 'brightscript');
            (0, chai_config_spec_1.expect)(stub.called).to.be.false;
        });
    });
    describe('CustomCommands', () => {
        describe('TranspileFile', () => {
            it('returns pathAbsolute to support backwards compatibility', async () => {
                fsExtra.outputFileSync((0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/source/main.bs`, `
                    sub main()
                        print \`hello world\`
                    end sub
                `);
                fsExtra.outputFileSync((0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/bsconfig.json`, '');
                server.run();
                await server['syncProjects']();
                const result = (await server.onExecuteCommand({
                    command: LanguageServer_1.CustomCommands.TranspileFile,
                    arguments: [(0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/source/main.bs`]
                }));
                (0, chai_config_spec_1.expect)((0, testHelpers_spec_1.trim)(result === null || result === void 0 ? void 0 : result.code)).to.eql((0, testHelpers_spec_1.trim) `
                    sub main()
                        print "hello world"
                    end sub
                `);
                (0, chai_config_spec_1.expect)(result['pathAbsolute']).to.eql(result.srcPath);
            });
            it('calls beforeProgramTranspile and afterProgramTranspile plugin events', async () => {
                fsExtra.outputFileSync((0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/source/main.bs`, `
                    sub main()
                        print \`hello world\`
                    end sub
                `);
                fsExtra.outputFileSync((0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/bsconfig.json`, '');
                server.run();
                await server['syncProjects']();
                const afterSpy = sinon.spy();
                //make a plugin that changes string text
                server['projectManager'].projects[0]['builder'].program.plugins.add({
                    name: 'test-plugin',
                    beforeProgramTranspile: (program, entries, editor) => {
                        const file = program.getFile('source/main.bs');
                        if ((0, reflection_1.isBrsFile)(file)) {
                            file.ast.walk((0, visitors_1.createVisitor)({
                                LiteralExpression: (expression) => {
                                    if ((0, reflection_1.isLiteralString)(expression)) {
                                        editor.setProperty(expression.token, 'text', 'hello moon');
                                    }
                                }
                            }), {
                                walkMode: visitors_1.WalkMode.visitAllRecursive
                            });
                        }
                    },
                    afterProgramTranspile: afterSpy
                });
                const result = (await server.onExecuteCommand({
                    command: LanguageServer_1.CustomCommands.TranspileFile,
                    arguments: [(0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/source/main.bs`]
                }));
                (0, chai_config_spec_1.expect)((0, testHelpers_spec_1.trim)(result === null || result === void 0 ? void 0 : result.code)).to.eql((0, testHelpers_spec_1.trim) `
                    sub main()
                        print "hello moon"
                    end sub
                `);
                (0, chai_config_spec_1.expect)(afterSpy.called).to.be.true;
            });
        });
    });
    it('semantic tokens request waits until after validation has finished', async () => {
        fsExtra.outputFileSync((0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/source/main.bs`, `
            sub main()
                print \`hello world\`
            end sub
        `);
        let spaceCount = 0;
        const getContents = () => {
            return `
                namespace sgnode
                    sub speak(message)
                        print message
                    end sub

                    sub sayHello()
                        sgnode.speak("Hello")${' '.repeat(spaceCount++)}
                    end sub
                end namespace
            `;
        };
        const uri = vscode_uri_1.URI.file((0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/source/sgnode.bs`).toString();
        fsExtra.outputFileSync((0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/source/sgnode.bs`, getContents());
        server.run();
        await server['syncProjects']();
        (0, testHelpers_spec_1.expectZeroDiagnostics)(server['projectManager'].projects[0]['builder'].program);
        fsExtra.outputFileSync((0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/source/sgnode.bs`, getContents());
        const changeWatchedFilesPromise = server['onDidChangeWatchedFiles']({
            changes: [{
                    type: vscode_languageserver_1.FileChangeType.Changed,
                    uri: uri
                }]
        });
        const document = {
            getText: () => getContents(),
            uri: uri
        };
        const semanticTokensPromise = server['onFullSemanticTokens']({
            textDocument: document
        });
        await Promise.all([
            changeWatchedFilesPromise,
            semanticTokensPromise
        ]);
        (0, testHelpers_spec_1.expectZeroDiagnostics)(server['projectManager'].projects[0]['builder'].program);
    });
    describe('sendDiagnostics', () => {
        let diagnostics = {};
        let diagnosticsDeferred = new deferred_1.Deferred();
        beforeEach(() => {
            server['connection'] = connection;
            sinon.stub(logging_1.Logger.prototype, 'write').callsFake(() => {
                //do nothing, logging is too noisy
            });
            diagnosticsDeferred = new deferred_1.Deferred();
            let timer = setTimeout(() => { }, 0);
            sinon.stub(server['connection'], 'sendDiagnostics').callsFake((params) => {
                clearTimeout(timer);
                if (params.diagnostics.length === 0) {
                    delete diagnostics[params.uri];
                }
                else {
                    diagnostics[params.uri] = params.diagnostics;
                }
                //debounce the promise so we get the final snapshot of diagnostics sent
                timer = setTimeout(() => {
                    diagnosticsDeferred.resolve();
                    diagnosticsDeferred = new deferred_1.Deferred();
                }, 100);
                return Promise.resolve();
            });
        });
        async function diagnosticsEquals(expectedDiagnostics) {
            var _a;
            //wait for a patch
            await diagnosticsDeferred.promise;
            let actualDiagnostics = Object.assign({}, diagnostics);
            //normalize the keys
            for (let collection of [actualDiagnostics, expectedDiagnostics]) {
                //convert a URI-like string to an fsPath
                for (let key in collection) {
                    let keyNormalized = key.startsWith('file:') ? vscode_uri_1.URI.parse(key).fsPath : key;
                    keyNormalized = (0, roku_deploy_1.standardizePath)(path.isAbsolute(keyNormalized) ? keyNormalized : (0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/${keyNormalized}`);
                    //if we changed the key, replace this in the collection
                    if (keyNormalized !== key) {
                        collection[keyNormalized] = collection[key];
                        delete collection[key];
                    }
                }
            }
            //normalize the actual diagnostics so it has diagnostics in the same format as the expected
            for (let key in actualDiagnostics) {
                const [actual, expected] = (0, testHelpers_spec_1.normalizeDiagnostics)(actualDiagnostics[key], (_a = expectedDiagnostics[key]) !== null && _a !== void 0 ? _a : []);
                actualDiagnostics[key] = actual;
                expectedDiagnostics[key] = expected;
            }
            (0, chai_config_spec_1.expect)(actualDiagnostics).to.eql(expectedDiagnostics);
        }
        it('clears standalone file project diagnostics when that file is adopted by at least one project', async () => {
            const projectManager = server['projectManager'];
            const documentManager = projectManager['documentManager'];
            //force instant document flushes
            documentManager['options'].delay = 0;
            //build a small functional project
            fsExtra.outputFileSync(`${testHelpers_spec_2.rootDir}/source/main.bs`, `
                sub main()
                    alpha.beta()
                    print missing
                end sub
            `);
            fsExtra.outputFileSync(`${testHelpers_spec_2.rootDir}/source/lib.bs`, `
                    namespace alpha
                    sub beta()
                    end sub
                end namespace
            `);
            fsExtra.outputFileSync(`${testHelpers_spec_2.rootDir}/bsconfig.json`, `
                {
                    "files": ["source/**/*.bs"],
                    //silence the logger, it's noisy
                    "logLevel": "error"
                }
            `);
            server.run();
            await server['onInitialized']();
            await diagnosticsEquals({
                'source/main.bs': [
                    DiagnosticMessages_1.DiagnosticMessages.cannotFindName('missing').message
                ]
            });
            const document = vscode_languageserver_textdocument_1.TextDocument.create(vscode_uri_1.URI.file((0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/source/main.bs`).toString(), 'brightscript', 0, `
                    sub main()
                        alpha.beta()
                        print missing2
                    end sub
                `);
            //open the main.bs file so it gets reloaded in a standalone project
            server['documents'].all = () => [document];
            await server['onTextDocumentDidChangeContent']({
                document: document
            });
            await diagnosticsEquals({
                'source/main.bs': [
                    DiagnosticMessages_1.DiagnosticMessages.cannotFindName('missing2').message
                ]
            });
            //mangle the bsconfig and then sync the project. this should produce new diagnostics from the file as it's now in a standalone project
            fsExtra.outputFileSync(`${testHelpers_spec_2.rootDir}/bsconfig.json`, `
                    {
                        "files": ["source/lib.bs"]
                //missing closing curly brace (and also have a comma, oops
            `);
            //tell the language server we've changed a bsconfig. it'll reload the file (fail cuz syntax error) and create a standalone project for the opened file
            await server['onDidChangeWatchedFiles']({
                changes: [{
                        type: vscode_languageserver_1.FileChangeType.Changed,
                        uri: vscode_uri_1.URI.file(`${testHelpers_spec_2.rootDir}/bsconfig.json`).toString()
                    }]
            });
            //wait for the manager to settle
            await projectManager.onIdle();
            //we should get a patch clearing the diagnostics from the unloaded main project, then
            //when the standalone project finishes loading, we should get another diagnostics patch, then
            //when the project activates, we flush open document changes. So now the opened copy of the file is re-processed and we get the correct error message `missing2`
            await diagnosticsEquals({
                'source/main.bs': [
                    DiagnosticMessages_1.DiagnosticMessages.cannotFindName('alpha').message,
                    DiagnosticMessages_1.DiagnosticMessages.cannotFindName('missing2').message
                ],
                'bsconfig.json': [
                    'Encountered syntax errors in bsconfig.json: CloseBraceExpected'
                ]
            });
            //now fix the bsconfig and sync again. This should dispose the standalone project and send new diagnostics
            fsExtra.outputFileSync(`${testHelpers_spec_2.rootDir}/bsconfig.json`, `
                {
                    "files": ["source/**/*.bs"],
                    //silence the logger, it's noisy
                    "logLevel": "error"
                }
            `);
            //tell the language server we've changed a bsconfig
            await server['onDidChangeWatchedFiles']({
                changes: [{
                        type: vscode_languageserver_1.FileChangeType.Changed,
                        uri: vscode_uri_1.URI.file(`${testHelpers_spec_2.rootDir}/bsconfig.json`).toString()
                    }]
            });
            //let the manager settle
            await projectManager.onIdle();
            //and then get more diagnostics when the opened file is parsed as well
            await diagnosticsEquals({
                'source/main.bs': [
                    DiagnosticMessages_1.DiagnosticMessages.cannotFindName('missing2').message
                ]
            });
        });
    });
});
function getFileProtocolPath(fullPath) {
    let result;
    if (fullPath.startsWith('/') || fullPath.startsWith('\\')) {
        result = `file://${fullPath}`;
    }
    else {
        result = `file:///${fullPath}`;
    }
    return result;
}
exports.getFileProtocolPath = getFileProtocolPath;
//# sourceMappingURL=LanguageServer.spec.js.map
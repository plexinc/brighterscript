"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectManager = void 0;
const util_1 = require("../util");
const roku_deploy_1 = require("roku-deploy");
const path = require("path");
const EventEmitter = require("eventemitter3");
const Project_1 = require("./Project");
const WorkerThreadProject_1 = require("./worker/WorkerThreadProject");
const vscode_languageserver_protocol_1 = require("vscode-languageserver-protocol");
const deferred_1 = require("../deferred");
const DocumentManager_1 = require("./DocumentManager");
const BusyStatusTracker_1 = require("../BusyStatusTracker");
const fastGlob = require("fast-glob");
const PathFilterer_1 = require("./PathFilterer");
const logging_1 = require("../logging");
const Cache_1 = require("../Cache");
const ActionQueue_1 = require("./ActionQueue");
const fsExtra = require("fs-extra");
const FileChangeTypeLookup = Object.entries(vscode_languageserver_protocol_1.FileChangeType).reduce((acc, [key, value]) => {
    acc[value] = key;
    acc[key] = value;
    return acc;
}, {});
/**
 * Manages all brighterscript projects for the language server
 */
class ProjectManager {
    constructor(options) {
        var _a, _b;
        /**
         * Collection of all projects
         */
        this.projects = [];
        /**
         * Collection of standalone projects. These are projects that are not part of a workspace, but are instead single files.
         * All of these are also present in the `projects` collection.
         */
        this.standaloneProjects = new Map();
        this.busyStatusTracker = new BusyStatusTracker_1.BusyStatusTracker();
        this.firstSync = new deferred_1.Deferred();
        this.fileChangesQueue = new ActionQueue_1.ActionQueue({
            maxActionDuration: 45000
        });
        this.emitter = new EventEmitter();
        this.logger = (_a = options === null || options === void 0 ? void 0 : options.logger) !== null && _a !== void 0 ? _a : (0, logging_1.createLogger)();
        this.pathFilterer = (_b = options === null || options === void 0 ? void 0 : options.pathFilterer) !== null && _b !== void 0 ? _b : new PathFilterer_1.PathFilterer({ logger: options === null || options === void 0 ? void 0 : options.logger });
        this.documentManager = new DocumentManager_1.DocumentManager({
            delay: ProjectManager.documentManagerDelay,
            flushHandler: (event) => {
                return this.flushDocumentChanges(event).catch(e => console.error(e));
            }
        });
        this.on('validate-begin', (event) => {
            this.busyStatusTracker.beginScopedRun(event.project, `validate-project`);
        });
        this.on('validate-end', (event) => {
            void this.busyStatusTracker.endScopedRun(event.project, `validate-project`);
        });
    }
    /**
     * Apply all of the queued document changes. This should only be called as a result of the documentManager flushing changes, and never called manually
     * @param event the document changes that have occurred since the last time we applied
     */
    async flushDocumentChanges(event) {
        var _a;
        this.logger.info(`flushDocumentChanges`, (_a = event === null || event === void 0 ? void 0 : event.actions) === null || _a === void 0 ? void 0 : _a.map(x => ({
            type: x.type,
            srcPath: x.srcPath,
            allowStandaloneProject: x.allowStandaloneProject
        })));
        //ensure that we're fully initialized before proceeding
        await this.onInitialized();
        const actions = [...event.actions];
        let idSequence = 0;
        //add an ID to every action (so we can track which actions were handled by which projects)
        for (const action of actions) {
            action.id = idSequence++;
        }
        //apply all of the document actions to each project in parallel
        const responses = await Promise.all(this.projects.map(async (project) => {
            //wait for this project to finish activating
            await project.whenActivated();
            const filterer = new PathFilterer_1.PathCollection({
                rootDir: project.rootDir,
                globs: project.filePatterns
            });
            // only include files that are applicable to this specific project (still allow deletes to flow through since they're cheap)
            const projectActions = actions.filter(action => {
                return (
                //if this is a delete, just pass it through because they're cheap to apply
                action.type === 'delete' ||
                    //if this is a set, only pass it through if it's a file that this project cares about
                    filterer.isMatch(action.srcPath));
            });
            if (projectActions.length > 0) {
                const responseActions = await project.applyFileChanges(projectActions);
                return responseActions.map(x => ({
                    project: project,
                    action: x
                }));
            }
        }));
        //create standalone projects for any files not handled by any project
        const flatResponses = responses.flat();
        for (const action of actions) {
            //skip this action if it doesn't support standalone projects
            if (!action.allowStandaloneProject || action.type !== 'set') {
                continue;
            }
            //a list of responses that handled this action
            const handledResponses = flatResponses.filter(x => { var _a, _b; return ((_a = x === null || x === void 0 ? void 0 : x.action) === null || _a === void 0 ? void 0 : _a.id) === action.id && ((_b = x === null || x === void 0 ? void 0 : x.action) === null || _b === void 0 ? void 0 : _b.status) === 'accepted'; });
            //remove any standalone project created for this file since it was handled by a normal project
            const normalProjectsThatHandledThisFile = handledResponses.filter(x => !x.project.isStandaloneProject);
            if (normalProjectsThatHandledThisFile.length > 0) {
                //if there's a standalone project for this file, delete it
                if (this.getStandaloneProject(action.srcPath, false)) {
                    this.logger.debug(`flushDocumentChanges: removing standalone project because the following normal projects handled the file: '${action.srcPath}', projects:`, normalProjectsThatHandledThisFile.map(x => util_1.util.getProjectLogName(x.project)));
                    this.removeStandaloneProject(action.srcPath);
                }
                // create a standalone project if this action was handled by zero normal projects.
                //(safe to call even if there's already a standalone project, won't create dupes)
            }
            else {
                //TODO only create standalone projects for files we understand (brightscript, brighterscript, scenegraph xml, etc)
                await this.createStandaloneProject(action.srcPath);
            }
        }
        this.logger.info('flushDocumentChanges complete', actions.map(x => ({
            type: x.type,
            srcPath: x.srcPath,
            allowStandaloneProject: x.allowStandaloneProject
        })));
    }
    /**
     * Get a standalone project for a given file path
     */
    getStandaloneProject(srcPath, standardizePath = true) {
        return this.standaloneProjects.get(standardizePath ? util_1.util.standardizePath(srcPath) : srcPath);
    }
    /**
     * Create a project that validates a single file. This is useful for getting language support for files that don't belong to a project
     */
    async createStandaloneProject(srcPath) {
        srcPath = util_1.util.standardizePath(srcPath);
        //if we already have a standalone project with this path, do nothing because it already exists
        if (this.getStandaloneProject(srcPath, false)) {
            this.logger.log('createStandaloneProject skipping because we already have one for this path');
            return;
        }
        this.logger.log(`Creating standalone project for '${srcPath}'`);
        const projectNumber = ProjectManager.projectNumberSequence++;
        const rootDir = path.join(__dirname, `standalone-project-${projectNumber}`);
        const projectConfig = {
            //these folders don't matter for standalone projects
            workspaceFolder: rootDir,
            projectDir: rootDir,
            //there's no bsconfig.json for standalone projects, so projectKey is the same as the dir
            projectKey: rootDir,
            bsconfigPath: undefined,
            enableThreading: false,
            projectNumber: projectNumber,
            files: [{
                    src: srcPath,
                    dest: 'source/standalone.brs'
                }]
        };
        const project = this.constructProject(projectConfig);
        project.srcPath = srcPath;
        project.isStandaloneProject = true;
        this.standaloneProjects.set(srcPath, project);
        await this.activateProject(project, projectConfig);
    }
    removeStandaloneProject(srcPath) {
        srcPath = util_1.util.standardizePath(srcPath);
        const project = this.getStandaloneProject(srcPath, false);
        if (project) {
            if (project.srcPath === srcPath) {
                this.logger.debug(`Removing standalone project for file '${srcPath}'`);
                this.removeProject(project);
                this.standaloneProjects.delete(srcPath);
            }
        }
    }
    /**
     * Get a promise that resolves when this manager is finished initializing
     */
    onInitialized() {
        return Promise.allSettled([
            //wait for the first sync to finish
            this.firstSync.promise,
            //make sure we're not in the middle of a sync
            this.syncPromise,
            //make sure all projects are activated
            ...this.projects.map(x => x.whenActivated())
        ]);
    }
    /**
     * Get a promise that resolves when the project manager is idle (no pending work)
     */
    async onIdle() {
        await this.onInitialized();
        //There are race conditions where the fileChangesQueue will become idle, but that causes the documentManager
        //to start a new flush. So we must keep waiting until everything is idle
        while (!this.documentManager.isIdle || !this.fileChangesQueue.isIdle) {
            this.logger.debug('onIdle', { documentManagerIdle: this.documentManager.isIdle, fileChangesQueueIdle: this.fileChangesQueue.isIdle });
            await Promise.allSettled([
                //make sure all pending file changes have been flushed
                this.documentManager.onIdle(),
                //wait for the file changes queue to be idle
                this.fileChangesQueue.onIdle()
            ]);
        }
        this.logger.info('onIdle debug', { documentManagerIdle: this.documentManager.isIdle, fileChangesQueueIdle: this.fileChangesQueue.isIdle });
    }
    /**
     * Given a list of all desired projects, create any missing projects and destroy and projects that are no longer available
     * Treat workspaces that don't have a bsconfig.json as a project.
     * Handle situations where bsconfig.json files were added or removed (to elevate/lower workspaceFolder projects accordingly)
     * Leave existing projects alone if they are not affected by these changes
     * @param workspaceConfigs an array of workspaces
     */
    async syncProjects(workspaceConfigs, forceReload = false) {
        //if we're force reloading, destroy all projects and start fresh
        if (forceReload) {
            this.logger.log('syncProjects: forceReload is true so removing all existing projects');
            for (const project of this.projects) {
                this.removeProject(project);
            }
        }
        this.logger.log('syncProjects', workspaceConfigs.map(x => x.workspaceFolder));
        this.syncPromise = (async () => {
            //build a list of unique projects across all workspace folders
            let projectConfigs = (await Promise.all(workspaceConfigs.map(async (workspaceConfig) => {
                const discoveredProjects = await this.discoverProjectsForWorkspace(workspaceConfig);
                return discoveredProjects.map(discoveredProject => {
                    var _a;
                    return ({
                        name: discoveredProject === null || discoveredProject === void 0 ? void 0 : discoveredProject.name,
                        projectKey: (0, util_1.standardizePath) `${(_a = discoveredProject.bsconfigPath) !== null && _a !== void 0 ? _a : discoveredProject.dir}`,
                        projectDir: (0, util_1.standardizePath) `${discoveredProject.dir}`,
                        bsconfigPath: discoveredProject === null || discoveredProject === void 0 ? void 0 : discoveredProject.bsconfigPath,
                        workspaceFolder: (0, util_1.standardizePath) `${workspaceConfig.workspaceFolder}`,
                        excludePatterns: workspaceConfig.excludePatterns,
                        enableThreading: workspaceConfig.languageServer.enableThreading
                    });
                });
            }))).flat(1);
            //TODO handle when a project came from the workspace config .projects array (it should probably never be filtered out)
            //filter the project paths to only include those that are allowed by the path filterer
            projectConfigs = this.pathFilterer.filter(projectConfigs, x => x.projectKey);
            //delete projects not represented in the list
            for (const project of this.projects) {
                //we can't find this existing project in our new list, so scrap it
                if (!projectConfigs.find(x => x.projectKey === project.projectKey)) {
                    this.removeProject(project);
                }
            }
            // skip projects we already have (they're already loaded...no need to reload them)
            projectConfigs = projectConfigs.filter(x => {
                return !this.hasProject(x);
            });
            //dedupe by projectKey
            projectConfigs = [
                ...projectConfigs.reduce((acc, x) => acc.set(x.projectKey, x), new Map()).values()
            ];
            //create missing projects
            await Promise.all(projectConfigs.map(async (config) => {
                await this.createAndActivateProject(config);
            }));
            //mark that we've completed our first sync
            this.firstSync.tryResolve();
        })();
        //return the sync promise
        return this.syncPromise;
    }
    handleFileChanges(changes) {
        this.logger.debug('handleFileChanges', changes.map(x => `${FileChangeTypeLookup[x.type]}: ${x.srcPath}`));
        //this function should NOT be marked as async, because typescript wraps the body in an async call sometimes. These need to be registered synchronously
        return this.fileChangesQueue.run(async (changes) => {
            //wait for any pending syncs to finish
            await this.onInitialized();
            return this._handleFileChanges(changes);
        }, changes);
    }
    /**
     * Handle when files or directories are added, changed, or deleted in the workspace.
     * This is safe to call any time. Changes will be queued and flushed at the correct times
     */
    async _handleFileChanges(changes) {
        //normalize srcPath for all changes
        for (const change of changes) {
            change.srcPath = util_1.util.standardizePath(change.srcPath);
        }
        //filter any changes that are not allowed by the path filterer
        changes = this.pathFilterer.filter(changes, x => x.srcPath);
        this.logger.debug('handleFileChanges -> filtered', changes.map(x => `${FileChangeTypeLookup[x.type]}: ${x.srcPath}`));
        //process all file changes in parallel
        await Promise.all(changes.map(async (change) => {
            await this.handleFileChange(change);
        }));
    }
    /**
     * Handle a single file change. If the file is a directory, this will recursively read all files in the directory and call `handleFileChanges` again
     */
    async handleFileChange(change) {
        if (change.type === vscode_languageserver_protocol_1.FileChangeType.Deleted) {
            //mark this document or directory as deleted
            this.documentManager.delete(change.srcPath);
            //file added or changed
        }
        else {
            //if this is a new directory, read all files recursively and register those as file changes too
            if (util_1.util.isDirectorySync(change.srcPath)) {
                const files = await fastGlob('**/*', {
                    cwd: change.srcPath,
                    onlyFiles: true,
                    absolute: true
                });
                //pipe all files found recursively in the new directory through this same function so they can be processed correctly
                await Promise.all(files.map((srcPath) => {
                    return this.handleFileChange({
                        srcPath: util_1.util.standardizePath(srcPath),
                        type: vscode_languageserver_protocol_1.FileChangeType.Changed,
                        allowStandaloneProject: change.allowStandaloneProject
                    });
                }));
                //this is a new file. set the file contents
            }
            else {
                this.documentManager.set({
                    srcPath: change.srcPath,
                    fileContents: change.fileContents,
                    allowStandaloneProject: change.allowStandaloneProject
                });
            }
        }
        //reload any projects whose bsconfig.json was changed
        const projectsToReload = this.projects.filter(project => {
            var _a;
            //this is a path to a bsconfig.json file
            if (((_a = project.bsconfigPath) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === change.srcPath.toLowerCase()) {
                //fetch file contents if we don't already have them
                if (!change.fileContents) {
                    try {
                        change.fileContents = fsExtra.readFileSync(project.bsconfigPath).toString();
                    }
                    finally { }
                }
                ///the bsconfig contents have changed since we last saw it, so reload this project
                if (project.bsconfigFileContents !== change.fileContents) {
                    return true;
                }
            }
            return false;
        });
        if (projectsToReload.length > 0) {
            await Promise.all(projectsToReload.map(x => this.reloadProject(x)));
        }
    }
    /**
     * Handle when a file is closed in the editor (this mostly just handles removing standalone projects)
     */
    async handleFileClose(event) {
        this.logger.debug(`File was closed. ${event.srcPath}`);
        this.removeStandaloneProject(event.srcPath);
        //most other methods on this class are async, might as well make this one async too for consistency and future expansion
        await Promise.resolve();
    }
    /**
     * Given a project, forcibly reload it by removing it and re-adding it
     */
    async reloadProject(project) {
        this.logger.log('Reloading project', { projectPath: project.projectKey });
        this.removeProject(project);
        project = await this.createAndActivateProject(project.activateOptions);
    }
    /**
     * Get all the semantic tokens for the given file
     * @returns an array of semantic tokens
     */
    async getSemanticTokens(options) {
        //wait for all pending syncs to finish
        await this.onIdle();
        let result = await util_1.util.promiseRaceMatch(this.projects.map(x => x.getSemanticTokens(options)), 
        //keep the first non-falsey result
        (result) => (result === null || result === void 0 ? void 0 : result.length) > 0);
        return result;
    }
    /**
     * Get a string containing the transpiled contents of the file at the given path
     * @returns the transpiled contents of the file as a string
     */
    async transpileFile(options) {
        //wait for all pending syncs to finish
        await this.onIdle();
        let result = await util_1.util.promiseRaceMatch(this.projects.map(x => x.transpileFile(options)), 
        //keep the first non-falsey result
        (result) => !!result);
        return result;
    }
    /**
     *  Get the completions for the given position in the file
     */
    async getCompletions(options) {
        var _a;
        await this.onIdle();
        //if the request has been cancelled since originally requested due to idle time being slow, skip the rest of the wor
        if ((_a = options === null || options === void 0 ? void 0 : options.cancellationToken) === null || _a === void 0 ? void 0 : _a.isCancellationRequested) {
            this.logger.debug('ProjectManager getCompletions cancelled', options);
            return;
        }
        this.logger.debug('ProjectManager getCompletions', options);
        //Ask every project for results, keep whichever one responds first that has a valid response
        let result = await util_1.util.promiseRaceMatch(this.projects.map(x => x.getCompletions(options)), 
        //keep the first non-falsey result
        (result) => { var _a; return ((_a = result === null || result === void 0 ? void 0 : result.items) === null || _a === void 0 ? void 0 : _a.length) > 0; });
        return result;
    }
    /**
     * Get the hover information for the given position in the file. If multiple projects have hover information, the projects will be raced and
     * the fastest result will be returned
     * @returns the hover information or undefined if no hover information was found
     */
    async getHover(options) {
        //wait for all pending syncs to finish
        await this.onIdle();
        //Ask every project for hover info, keep whichever one responds first that has a valid response
        let hover = await util_1.util.promiseRaceMatch(this.projects.map(x => x.getHover(options)), 
        //keep the first set of non-empty results
        (result) => (result === null || result === void 0 ? void 0 : result.length) > 0);
        return hover === null || hover === void 0 ? void 0 : hover[0];
    }
    /**
     * Get the definition for the symbol at the given position in the file
     * @returns a list of locations where the symbol under the position is defined in the project
     */
    async getDefinition(options) {
        //wait for all pending syncs to finish
        await this.onIdle();
        //TODO should we merge definitions across ALL projects? or just return definitions from the first project we found
        //Ask every project for definition info, keep whichever one responds first that has a valid response
        let result = await util_1.util.promiseRaceMatch(this.projects.map(x => x.getDefinition(options)), 
        //keep the first non-falsey result
        (result) => !!result);
        return result;
    }
    async getSignatureHelp(options) {
        var _a;
        //wait for all pending syncs to finish
        await this.onIdle();
        //Ask every project for definition info, keep whichever one responds first that has a valid response
        let signatures = await util_1.util.promiseRaceMatch(this.projects.map(x => x.getSignatureHelp(options)), 
        //keep the first non-falsey result
        (result) => !!result);
        if ((signatures === null || signatures === void 0 ? void 0 : signatures.length) > 0) {
            const activeSignature = signatures.length > 0 ? 0 : undefined;
            const activeParameter = activeSignature >= 0 ? (_a = signatures[activeSignature]) === null || _a === void 0 ? void 0 : _a.index : undefined;
            let result = {
                signatures: signatures.map((s) => s.signature),
                activeSignature: activeSignature,
                activeParameter: activeParameter
            };
            return result;
        }
    }
    async getDocumentSymbol(options) {
        //wait for all pending syncs to finish
        await this.onIdle();
        //Ask every project for definition info, keep whichever one responds first that has a valid response
        let result = await util_1.util.promiseRaceMatch(this.projects.map(x => x.getDocumentSymbol(options)), 
        //keep the first non-falsey result
        (result) => !!result);
        return result;
    }
    async getWorkspaceSymbol() {
        //wait for all pending syncs to finish
        await this.onIdle();
        //Ask every project for definition info, keep whichever one responds first that has a valid response
        let responses = await Promise.allSettled(this.projects.map(x => x.getWorkspaceSymbol()));
        let results = responses
            //keep all symbol results
            .map((x) => {
            return x.status === 'fulfilled' ? x.value : [];
        })
            //flatten the array
            .flat()
            //throw out nulls
            .filter(x => !!x);
        // Remove duplicates
        const allSymbols = Object.values(results.reduce((map, symbol) => {
            const key = symbol.location.uri + symbol.name;
            map[key] = symbol;
            return map;
        }, {}));
        return allSymbols;
    }
    async getReferences(options) {
        //wait for all pending syncs to finish
        await this.onIdle();
        //Ask every project for definition info, keep whichever one responds first that has a valid response
        let result = await util_1.util.promiseRaceMatch(this.projects.map(x => x.getReferences(options)), 
        //keep the first non-falsey result
        (result) => !!result);
        return result !== null && result !== void 0 ? result : [];
    }
    async getCodeActions(options) {
        //wait for all pending syncs to finish
        await this.onIdle();
        //Ask every project for definition info, keep whichever one responds first that has a valid response
        let result = await util_1.util.promiseRaceMatch(this.projects.map(x => x.getCodeActions(options)), 
        //keep the first non-falsey result
        (result) => !!result);
        return result;
    }
    /**
     * Scan a given workspace for all `bsconfig.json` files. If at least one is found, then only folders who have bsconfig.json are returned.
     * If none are found, then the workspaceFolder itself is treated as a project
     */
    async discoverProjectsForWorkspace(workspaceConfig) {
        var _a, _b, _c;
        //config may provide a list of project paths. If we have these, no other discovery is permitted
        if (Array.isArray(workspaceConfig.projects) && workspaceConfig.projects.length > 0) {
            this.logger.debug(`Using project paths from workspace config`, workspaceConfig.projects);
            const projectConfigs = workspaceConfig.projects.reduce((acc, project) => {
                //skip this project if it's disabled or we don't have a path
                if (project.disabled || !project.path) {
                    return acc;
                }
                //ensure the project path is absolute
                if (!path.isAbsolute(project.path)) {
                    project.path = path.resolve(workspaceConfig.workspaceFolder, project.path);
                }
                //skip this project if the path does't exist
                if (!fsExtra.existsSync(project.path)) {
                    return acc;
                }
                //if the project is a directory
                if (fsExtra.statSync(project.path).isDirectory()) {
                    acc.push({
                        name: project.name,
                        bsconfigPath: undefined,
                        dir: project.path
                    });
                    //it's a path to a file (hopefully bsconfig.json)
                }
                else {
                    acc.push({
                        name: project.name,
                        dir: path.dirname(project.path),
                        bsconfigPath: project.path
                    });
                }
                return acc;
            }, []);
            //if we didn't find any valid project paths, log a warning. having zero projects is acceptable, it typically means the user wanted to disable discovery or
            //disabled all their projects on purpose
            if (projectConfigs.length === 0) {
                this.logger.warn(`No valid project paths found in workspace config`, JSON.stringify(workspaceConfig.projects, null, 4));
            }
            return projectConfigs;
        }
        //automatic discovery disabled?
        if (!workspaceConfig.languageServer.enableProjectDiscovery) {
            return [{
                    dir: workspaceConfig.workspaceFolder
                }];
        }
        //get the list of exclude patterns, negate them so they actually work like excludes), and coerce to forward slashes since that's what fast-glob expects
        const excludePatterns = ((_a = workspaceConfig.excludePatterns) !== null && _a !== void 0 ? _a : []).map(x => (0, util_1.standardizePath) `!${x}`.replace(/[\\/]+/g, '/'));
        let files = await fastGlob(['**/bsconfig.json', ...excludePatterns], {
            cwd: workspaceConfig.workspaceFolder,
            followSymbolicLinks: false,
            absolute: true,
            onlyFiles: true,
            deep: (_b = workspaceConfig.languageServer.projectDiscoveryMaxDepth) !== null && _b !== void 0 ? _b : 15
        });
        //filter the files to only include those that are allowed by the path filterer
        files = this.pathFilterer.filter(files);
        //if we found at least one bsconfig.json, then ALL projects must have a bsconfig.json.
        if (files.length > 0) {
            return files.map(file => ({
                dir: (0, util_1.standardizePath) `${path.dirname(file)}`,
                bsconfigPath: (0, util_1.standardizePath) `${file}`
            }));
        }
        //look for roku project folders
        let rokuLikeDirs = (await Promise.all(
        //find all folders containing a `manifest` file
        (await fastGlob(['**/manifest', ...excludePatterns], {
            cwd: workspaceConfig.workspaceFolder,
            followSymbolicLinks: false,
            absolute: true,
            onlyFiles: true,
            deep: (_c = workspaceConfig.languageServer.projectDiscoveryMaxDepth) !== null && _c !== void 0 ? _c : 15
        })).map(async (manifestEntry) => {
            const manifestDir = path.dirname(manifestEntry);
            //TODO validate that manifest is a Roku manifest
            const files = await roku_deploy_1.rokuDeploy.getFilePaths([
                'source/**/*.{brs,bs}',
                ...excludePatterns
            ], manifestDir);
            if (files.length > 0) {
                return (0, util_1.standardizePath) `${manifestDir}`;
            }
        })
        //throw out nulls
        )).filter(x => !!x);
        //throw out any directories that are not allowed by the path filterer
        rokuLikeDirs = this.pathFilterer.filter(rokuLikeDirs, srcPath => srcPath);
        if (rokuLikeDirs.length > 0) {
            return rokuLikeDirs.map(file => ({
                dir: file
            }));
        }
        //treat the workspace folder as a brightscript project itself
        return [{
                dir: workspaceConfig.workspaceFolder
            }];
    }
    /**
     * Returns true if we have this project, or false if we don't
     * @returns true if the project exists, or false if it doesn't
     */
    hasProject(config) {
        return !!this.getProject(config);
    }
    /**
     * Get a project with the specified path
     * @param param path to the project or an obj that has `projectPath` prop
     * @returns a project, or undefined if no project was found
     */
    getProject(param) {
        var _a, _b;
        const projectKey = util_1.util.standardizePath((typeof param === 'string') ? param : ((_b = (_a = param === null || param === void 0 ? void 0 : param.projectKey) !== null && _a !== void 0 ? _a : param === null || param === void 0 ? void 0 : param.bsconfigPath) !== null && _b !== void 0 ? _b : param === null || param === void 0 ? void 0 : param.projectDir));
        if (!projectKey) {
            return;
        }
        return this.projects.find(x => x.projectKey === projectKey);
    }
    /**
     * Remove a project from the language server
     */
    removeProject(project) {
        const idx = this.projects.findIndex(x => x.projectKey === (project === null || project === void 0 ? void 0 : project.projectKey));
        if (idx > -1) {
            this.logger.log('Removing project', { projectKey: project.projectKey, projectNumber: project.projectNumber });
            this.projects.splice(idx, 1);
        }
        //anytime we remove a project, we should emit an event that clears all of its diagnostics
        this.emit('diagnostics', { project: project, diagnostics: [] });
        project === null || project === void 0 ? void 0 : project.dispose();
        this.busyStatusTracker.endAllRunsForScope(project);
    }
    /**
     * Get a projectNumber for a given config. Try to reuse project numbers when we've seen this project before
     *  - If the config already has one, use that.
     *  - If we've already seen this config before, use the same project number as before
     */
    getProjectNumber(config) {
        if (config.projectNumber !== undefined) {
            return config.projectNumber;
        }
        const key = (0, util_1.standardizePath) `${config.projectKey}` + '-' + (0, util_1.standardizePath) `${config.workspaceFolder}` + '-' + (0, util_1.standardizePath) `${config.bsconfigPath}`;
        return ProjectManager.projectNumberCache.getOrAdd(key, () => {
            return ProjectManager.projectNumberSequence++;
        });
    }
    /**
     * Constructs a project for the given config. Just makes the project, doesn't activate it
     * @returns a new project, or the existing project if one already exists with this config info
     */
    constructProject(config) {
        //skip this project if we already have it
        if (this.hasProject(config)) {
            return this.getProject(config);
        }
        config.projectNumber = this.getProjectNumber(config);
        let project = config.enableThreading
            ? new WorkerThreadProject_1.WorkerThreadProject({
                logger: this.logger.createLogger()
            })
            : new Project_1.Project({
                logger: this.logger.createLogger()
            });
        this.logger.log(`Created project #${config.projectNumber} for: "${config.projectKey}" (${config.enableThreading ? 'worker thread' : 'main thread'})`);
        this.projects.push(project);
        //pipe all project-specific events through our emitter, and include the project reference
        project.on('all', (eventName, data) => {
            this.emit(eventName, Object.assign(Object.assign({}, data), { project: project }));
        });
        return project;
    }
    /**
     * Constructs a project for the given config
     * @returns a new project, or the existing project if one already exists with this config info
     */
    async createAndActivateProject(config) {
        //skip this project if we already have it
        if (this.hasProject(config)) {
            return this.getProject(config.projectKey);
        }
        const project = this.constructProject(config);
        await this.activateProject(project, config);
        return project;
    }
    async activateProject(project, config) {
        this.logger.debug('Activating project', util_1.util.getProjectLogName(project), {
            projectPath: config === null || config === void 0 ? void 0 : config.projectKey,
            bsconfigPath: config.bsconfigPath
        });
        await project.activate(config);
        //send an event to indicate that this project has been activated
        this.emit('project-activate', { project: project });
        //register this project's list of files with the path filterer
        const unregister = this.pathFilterer.registerIncludeList(project.rootDir, project.filePatterns);
        project.disposables.push({ dispose: unregister });
    }
    on(eventName, handler) {
        this.emitter.on(eventName, handler);
        return () => {
            this.emitter.removeListener(eventName, handler);
        };
    }
    async emit(eventName, data) {
        //emit these events on next tick, otherwise they will be processed immediately which could cause issues
        await util_1.util.sleep(0);
        this.emitter.emit(eventName, data);
    }
    dispose() {
        var _a;
        this.emitter.removeAllListeners();
        for (const project of this.projects) {
            (_a = project === null || project === void 0 ? void 0 : project.dispose) === null || _a === void 0 ? void 0 : _a.call(project);
        }
    }
}
ProjectManager.documentManagerDelay = 150;
/**
 * A unique project counter to help distinguish log entries in lsp mode
 */
ProjectManager.projectNumberSequence = 0;
ProjectManager.projectNumberCache = new Cache_1.Cache();
__decorate([
    TrackBusyStatus
], ProjectManager.prototype, "flushDocumentChanges", null);
__decorate([
    TrackBusyStatus
], ProjectManager.prototype, "syncProjects", null);
__decorate([
    TrackBusyStatus
], ProjectManager.prototype, "getSemanticTokens", null);
__decorate([
    TrackBusyStatus
], ProjectManager.prototype, "transpileFile", null);
__decorate([
    TrackBusyStatus
], ProjectManager.prototype, "getCompletions", null);
__decorate([
    TrackBusyStatus
], ProjectManager.prototype, "getHover", null);
__decorate([
    TrackBusyStatus
], ProjectManager.prototype, "getDefinition", null);
__decorate([
    TrackBusyStatus
], ProjectManager.prototype, "getSignatureHelp", null);
__decorate([
    TrackBusyStatus
], ProjectManager.prototype, "getDocumentSymbol", null);
__decorate([
    TrackBusyStatus
], ProjectManager.prototype, "getWorkspaceSymbol", null);
__decorate([
    TrackBusyStatus
], ProjectManager.prototype, "getReferences", null);
__decorate([
    TrackBusyStatus
], ProjectManager.prototype, "getCodeActions", null);
__decorate([
    TrackBusyStatus
], ProjectManager.prototype, "createAndActivateProject", null);
__decorate([
    TrackBusyStatus
], ProjectManager.prototype, "activateProject", null);
exports.ProjectManager = ProjectManager;
/**
 * An annotation used to wrap the method in a busyStatus tracking call
 */
function TrackBusyStatus(target, propertyKey, descriptor) {
    let originalMethod = descriptor.value;
    //wrapping the original method
    descriptor.value = function value(...args) {
        return this.busyStatusTracker.run(() => {
            return originalMethod.apply(this, args);
        }, originalMethod.name);
    };
}
//# sourceMappingURL=ProjectManager.js.map
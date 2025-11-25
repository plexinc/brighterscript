"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("./chai-config.spec");
const path = require("path");
const util_1 = require("./util");
const vscode_languageserver_1 = require("vscode-languageserver");
const fsExtra = require("fs-extra");
const sinon_1 = require("sinon");
const DiagnosticMessages_1 = require("./DiagnosticMessages");
const testHelpers_spec_1 = require("./testHelpers.spec");
const Program_1 = require("./Program");
const sinon = (0, sinon_1.createSandbox)();
let cwd = process.cwd();
describe('util', () => {
    beforeEach(() => {
        sinon.restore();
        fsExtra.ensureDirSync(testHelpers_spec_1.tempDir);
        fsExtra.emptyDirSync(testHelpers_spec_1.tempDir);
    });
    afterEach(() => {
        sinon.restore();
        fsExtra.ensureDirSync(testHelpers_spec_1.tempDir);
        fsExtra.emptyDirSync(testHelpers_spec_1.tempDir);
    });
    describe('fileExists', () => {
        it('returns false when no value is passed', async () => {
            (0, chai_config_spec_1.expect)(await util_1.default.pathExists(undefined)).to.be.false;
        });
    });
    describe('uriToPath', () => {
        it('retains original drive casing for windows', () => {
            (0, chai_config_spec_1.expect)(util_1.default.uriToPath(`file:///C:${path.sep}something`)).to.equal(`C:${path.sep}something`);
            (0, chai_config_spec_1.expect)(util_1.default.uriToPath(`file:///c:${path.sep}something`)).to.equal(`c:${path.sep}something`);
        });
    });
    describe('diagnosticIsSuppressed', () => {
        it('does not crash when diagnostic is missing location information', () => {
            const program = new Program_1.Program({});
            const file = program.setFile('source/main.brs', '');
            const diagnostic = {
                file: file,
                message: 'crash',
                //important part of the test. range must be missing
                range: undefined
            };
            file.commentFlags.push({
                affectedRange: util_1.default.createRange(1, 2, 3, 4),
                codes: [1, 2, 3],
                file: file,
                range: util_1.default.createRange(1, 2, 3, 4)
            });
            file.diagnostics.push(diagnostic);
            util_1.default.diagnosticIsSuppressed(diagnostic);
            //test passes if there's no crash
        });
    });
    describe('getRokuPkgPath', () => {
        it('replaces more than one windows slash in a path', () => {
            (0, chai_config_spec_1.expect)(util_1.default.getRokuPkgPath('source\\folder1\\folder2\\file.brs')).to.eql('pkg:/source/folder1/folder2/file.brs');
        });
    });
    describe('loadConfigFile', () => {
        it('returns undefined when no path is provided', () => {
            (0, chai_config_spec_1.expect)(util_1.default.loadConfigFile(undefined)).to.be.undefined;
        });
        it('returns undefined when the path does not exist', () => {
            (0, chai_config_spec_1.expect)(util_1.default.loadConfigFile(`?${testHelpers_spec_1.rootDir}/donotexist.json`)).to.be.undefined;
        });
        it('returns proper list of ancestor project paths', () => {
            var _a, _b;
            fsExtra.outputFileSync((0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/child.json`, `{"extends": "parent.json"}`);
            fsExtra.outputFileSync((0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/parent.json`, `{"extends": "grandparent.json"}`);
            fsExtra.outputFileSync((0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/grandparent.json`, `{"extends": "greatgrandparent.json"}`);
            fsExtra.outputFileSync((0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/greatgrandparent.json`, `{}`);
            (0, chai_config_spec_1.expect)((_b = (_a = util_1.default.loadConfigFile((0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/child.json`)) === null || _a === void 0 ? void 0 : _a._ancestors) === null || _b === void 0 ? void 0 : _b.map(x => (0, util_1.standardizePath)(x))).to.eql([
                (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/child.json`,
                (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/parent.json`,
                (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/grandparent.json`,
                (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/greatgrandparent.json`
            ]);
        });
        it('resolves sourceRoot relative to the bsconfig file', () => {
            fsExtra.outputJsonSync((0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/folder1/parent.json`, { sourceRoot: './alpha/beta', resolveSourceRoot: true });
            fsExtra.outputJsonSync((0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/child.json`, { extends: 'folder1/parent.json' });
            (0, chai_config_spec_1.expect)(util_1.default.loadConfigFile((0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/child.json`).sourceRoot).to.eql((0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/folder1/alpha/beta`);
        });
        it('leaves sourceRoot relative when defaulted to', () => {
            fsExtra.outputJsonSync((0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/folder1/parent.json`, { sourceRoot: './alpha/beta' });
            fsExtra.outputJsonSync((0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/child.json`, { extends: 'folder1/parent.json' });
            (0, chai_config_spec_1.expect)(util_1.default.loadConfigFile((0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/child.json`).sourceRoot).to.eql(`./alpha/beta`);
        });
        it('returns empty ancestors list for non-extends files', () => {
            var _a;
            fsExtra.outputFileSync((0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/child.json`, `{}`);
            let config = util_1.default.loadConfigFile((0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/child.json`);
            (0, chai_config_spec_1.expect)((_a = config === null || config === void 0 ? void 0 : config._ancestors) === null || _a === void 0 ? void 0 : _a.map(x => (0, util_1.standardizePath)(x))).to.eql([
                (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/child.json`
            ]);
        });
        it('resolves plugins path relatively to config file', () => {
            var _a;
            const config = {
                plugins: [
                    './plugins.js',
                    './scripts/plugins.js',
                    '../scripts/plugins.js',
                    'bsplugin'
                ]
            };
            util_1.default.resolvePathsRelativeTo(config, 'plugins', (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/config`);
            (0, chai_config_spec_1.expect)((_a = config === null || config === void 0 ? void 0 : config.plugins) === null || _a === void 0 ? void 0 : _a.map(p => (p ? util_1.default.pathSepNormalize(p, '/') : undefined))).to.deep.equal([
                `${testHelpers_spec_1.rootDir}/config/plugins.js`,
                `${testHelpers_spec_1.rootDir}/config/scripts/plugins.js`,
                `${testHelpers_spec_1.rootDir}/scripts/plugins.js`,
                'bsplugin'
            ].map(p => util_1.default.pathSepNormalize(p, '/')));
        });
        it('resolves path relatively to config file', () => {
            const mockConfig = {
                outFile: 'out/app.zip',
                rootDir: 'rootDir',
                cwd: 'cwd',
                stagingDir: 'stagingDir'
            };
            fsExtra.outputFileSync((0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/child.json`, JSON.stringify(mockConfig));
            let config = util_1.default.loadConfigFile((0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/child.json`);
            (0, chai_config_spec_1.expect)(config).to.deep.equal({
                '_ancestors': [
                    (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/child.json`
                ],
                'cwd': (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/cwd`,
                'outFile': (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/out/app.zip`,
                'rootDir': (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/rootDir`,
                'stagingDir': (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/stagingDir`
            });
        });
        it('removes duplicate plugins and undefined values', () => {
            var _a;
            const config = {
                plugins: [
                    './plugins.js',
                    'bsplugin',
                    '../config/plugins.js',
                    'bsplugin',
                    undefined
                ]
            };
            util_1.default.resolvePathsRelativeTo(config, 'plugins', (0, util_1.standardizePath) `${process.cwd()}/config`);
            (0, chai_config_spec_1.expect)((_a = config === null || config === void 0 ? void 0 : config.plugins) === null || _a === void 0 ? void 0 : _a.map(p => (p ? util_1.default.pathSepNormalize(p, '/') : undefined))).to.deep.equal([
                (0, util_1.standardizePath) `${process.cwd()}/config/plugins.js`,
                'bsplugin'
            ].map(p => util_1.default.pathSepNormalize(p, '/')));
        });
    });
    describe('getConfigFilePath', () => {
        it('returns undefined when it does not find the file', () => {
            let configFilePath = util_1.default.getConfigFilePath((0, util_1.standardizePath) `${process.cwd()}/testProject/project1`);
            (0, chai_config_spec_1.expect)(configFilePath).not.to.exist;
        });
        it('returns path to file when found', () => {
            fsExtra.outputFileSync((0, util_1.standardizePath) `${testHelpers_spec_1.tempDir}/rootDir/bsconfig.json`, '');
            (0, chai_config_spec_1.expect)(util_1.default.getConfigFilePath((0, util_1.standardizePath) `${testHelpers_spec_1.tempDir}/rootDir`)).to.equal((0, util_1.standardizePath) `${testHelpers_spec_1.tempDir}/rootDir/bsconfig.json`);
        });
        it('finds config file in parent directory', () => {
            const bsconfigPath = (0, util_1.standardizePath) `${testHelpers_spec_1.tempDir}/rootDir/bsconfig.json`;
            fsExtra.outputFileSync(bsconfigPath, '');
            fsExtra.ensureDirSync(`${testHelpers_spec_1.tempDir}/rootDir/source`);
            (0, chai_config_spec_1.expect)(util_1.default.getConfigFilePath((0, util_1.standardizePath) `${testHelpers_spec_1.tempDir}/rootDir/source`)).to.equal((0, util_1.standardizePath) `${testHelpers_spec_1.tempDir}/rootDir/bsconfig.json`);
        });
        it('uses cwd when not provided', () => {
            //sanity check
            (0, chai_config_spec_1.expect)(util_1.default.getConfigFilePath()).not.to.exist;
            const rootDir = (0, util_1.standardizePath) `${testHelpers_spec_1.tempDir}/rootDir`;
            fsExtra.outputFileSync(`${rootDir}/bsconfig.json`, '');
            fsExtra.ensureDirSync(rootDir);
            process.chdir(rootDir);
            try {
                (0, chai_config_spec_1.expect)(util_1.default.getConfigFilePath()).to.equal((0, util_1.standardizePath) `${rootDir}/bsconfig.json`);
            }
            finally {
                process.chdir(cwd);
            }
        });
    });
    describe('pathSepNormalize', () => {
        it('works for both types of separators', () => {
            (0, chai_config_spec_1.expect)(util_1.default.pathSepNormalize('c:/some\\path', '\\')).to.equal('c:\\some\\path');
            (0, chai_config_spec_1.expect)(util_1.default.pathSepNormalize('c:/some\\path', '/')).to.equal('c:/some/path');
        });
        it('does not throw when given `undefined`', () => {
            (0, chai_config_spec_1.expect)(undefined).to.be.undefined;
        });
    });
    describe('lowerDrivePath', () => {
        it('forces drive letters to lower case', () => {
            //unix slashes
            (0, chai_config_spec_1.expect)(util_1.default.driveLetterToLower('C:/projects')).to.equal('c:/projects');
            //windows slashes
            (0, chai_config_spec_1.expect)(util_1.default.driveLetterToLower('C:\\projects')).to.equal(('c:\\projects'));
        });
    });
    describe('findClosestConfigFile', () => {
        it('finds config up the chain', async () => {
            const brsFilePath = (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/src/app.brs`;
            const currentDirBsConfigPath = (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/src/bsconfig.json`;
            const currentDirBrsConfigPath = (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/src/brsconfig.json`;
            const parentDirBsConfigPath = (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/bsconfig.json`;
            const parentDirBrsConfigPath = (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/brsconfig.json`;
            fsExtra.outputFileSync(brsFilePath, '');
            fsExtra.outputFileSync(currentDirBsConfigPath, '');
            fsExtra.outputFileSync(currentDirBrsConfigPath, '');
            fsExtra.outputFileSync(parentDirBsConfigPath, '');
            fsExtra.outputFileSync(parentDirBrsConfigPath, '');
            (0, chai_config_spec_1.expect)(await util_1.default.findClosestConfigFile(brsFilePath)).to.equal(currentDirBsConfigPath);
            fsExtra.removeSync(currentDirBsConfigPath);
            (0, chai_config_spec_1.expect)(await util_1.default.findClosestConfigFile(brsFilePath)).to.equal(currentDirBrsConfigPath);
            fsExtra.removeSync(currentDirBrsConfigPath);
            (0, chai_config_spec_1.expect)(await util_1.default.findClosestConfigFile(brsFilePath)).to.equal(parentDirBsConfigPath);
            fsExtra.removeSync(parentDirBsConfigPath);
            (0, chai_config_spec_1.expect)(await util_1.default.findClosestConfigFile(brsFilePath)).to.equal(parentDirBrsConfigPath);
        });
    });
    describe('normalizeAndResolveConfig', () => {
        it('loads project by default', () => {
            fsExtra.outputJsonSync(`${testHelpers_spec_1.rootDir}/bsconfig.json`, {
                rootDir: (0, util_1.standardizePath) `${cwd}/TEST`
            });
            (0, chai_config_spec_1.expect)(util_1.default.normalizeAndResolveConfig({
                cwd: testHelpers_spec_1.rootDir
            }).rootDir).to.eql((0, util_1.standardizePath) `${cwd}/TEST`);
        });
        it('noproject skips loading the local bsconfig.json', () => {
            fsExtra.outputJsonSync(`${testHelpers_spec_1.rootDir}/bsconfig.json`, {
                rootDir: (0, util_1.standardizePath) `${cwd}/TEST`
            });
            (0, chai_config_spec_1.expect)(util_1.default.normalizeAndResolveConfig({
                cwd: testHelpers_spec_1.rootDir,
                noProject: true
            }).rootDir).to.be.undefined;
        });
        it('throws for missing project file', () => {
            (0, chai_config_spec_1.expect)(() => {
                util_1.default.normalizeAndResolveConfig({ project: 'path/does/not/exist/bsconfig.json' });
            }).to.throw;
        });
        it('does not throw for optional missing', () => {
            (0, chai_config_spec_1.expect)(() => {
                util_1.default.normalizeAndResolveConfig({ project: '?path/does/not/exist/bsconfig.json' });
            }).not.to.throw;
        });
        it('throws for missing extends file', () => {
            try {
                fsExtra.outputFileSync((0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/bsconfig.json`, `{ "extends": "path/does/not/exist/bsconfig.json" }`);
                (0, chai_config_spec_1.expect)(() => {
                    util_1.default.normalizeAndResolveConfig({
                        project: (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/bsconfig.json`
                    });
                }).to.throw;
            }
            finally {
                process.chdir(cwd);
            }
        });
        it('throws for missing extends file', () => {
            fsExtra.outputFileSync((0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/bsconfig.json`, `{ "extends": "?path/does/not/exist/bsconfig.json" }`);
            (0, chai_config_spec_1.expect)(() => {
                util_1.default.normalizeAndResolveConfig({
                    project: (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/bsconfig.json`
                });
            }).not.to.throw;
        });
    });
    describe('normalizeConfig', () => {
        it('sets emitDefinitions to false by default and in edge cases', () => {
            (0, chai_config_spec_1.expect)(util_1.default.normalizeConfig({}).emitDefinitions).to.be.false;
            (0, chai_config_spec_1.expect)(util_1.default.normalizeConfig().emitDefinitions).to.be.false;
            (0, chai_config_spec_1.expect)(util_1.default.normalizeConfig({ emitDefinitions: 123 }).emitDefinitions).to.be.false;
            (0, chai_config_spec_1.expect)(util_1.default.normalizeConfig({ emitDefinitions: undefined }).emitDefinitions).to.be.false;
            (0, chai_config_spec_1.expect)(util_1.default.normalizeConfig({ emitDefinitions: 'true' }).emitDefinitions).to.be.false;
        });
        it('sets pruneEmptyCodeFiles to false by default, or true if explicitly true', () => {
            (0, chai_config_spec_1.expect)(util_1.default.normalizeConfig({}).pruneEmptyCodeFiles).to.be.false;
            (0, chai_config_spec_1.expect)(util_1.default.normalizeConfig({ pruneEmptyCodeFiles: true }).pruneEmptyCodeFiles).to.be.true;
            (0, chai_config_spec_1.expect)(util_1.default.normalizeConfig({ pruneEmptyCodeFiles: false }).pruneEmptyCodeFiles).to.be.false;
        });
        it('loads project from disc', () => {
            fsExtra.outputFileSync((0, util_1.standardizePath) `${testHelpers_spec_1.tempDir}/rootDir/bsconfig.json`, `{ "outFile": "customOutDir/pkg.zip" }`);
            let config = util_1.default.normalizeAndResolveConfig({
                project: (0, util_1.standardizePath) `${testHelpers_spec_1.tempDir}/rootDir/bsconfig.json`
            });
            (0, chai_config_spec_1.expect)(config.outFile).to.equal((0, util_1.standardizePath) `${testHelpers_spec_1.tempDir}/rootDir/customOutDir/pkg.zip`);
        });
        it('loads project from disc and extends it', () => {
            //the extends file
            fsExtra.outputFileSync((0, util_1.standardizePath) `${testHelpers_spec_1.tempDir}/rootDir/bsconfig.base.json`, `{
                "outFile": "customOutDir/pkg1.zip",
                "rootDir": "core"
            }`);
            //the project file
            fsExtra.outputFileSync((0, util_1.standardizePath) `${testHelpers_spec_1.tempDir}/rootDir/bsconfig.json`, `{
                "extends": "bsconfig.base.json",
                "watch": true
            }`);
            let config = util_1.default.normalizeAndResolveConfig({ project: (0, util_1.standardizePath) `${testHelpers_spec_1.tempDir}/rootDir/bsconfig.json` });
            (0, chai_config_spec_1.expect)(config.outFile).to.equal((0, util_1.standardizePath) `${testHelpers_spec_1.tempDir}/rootDir/customOutDir/pkg1.zip`);
            (0, chai_config_spec_1.expect)(config.rootDir).to.equal((0, util_1.standardizePath) `${testHelpers_spec_1.tempDir}/rootDir/core`);
            (0, chai_config_spec_1.expect)(config.watch).to.equal(true);
        });
        it('overrides parent files array with child files array', () => {
            //the parent file
            fsExtra.outputFileSync((0, util_1.standardizePath) `${testHelpers_spec_1.tempDir}/rootDir/bsconfig.parent.json`, `{
                "files": ["base.brs"]
            }`);
            //the project file
            fsExtra.outputFileSync((0, util_1.standardizePath) `${testHelpers_spec_1.tempDir}/rootDir/bsconfig.json`, `{
                "extends": "bsconfig.parent.json",
                "files": ["child.brs"]
            }`);
            let config = util_1.default.normalizeAndResolveConfig({ project: (0, util_1.standardizePath) `${testHelpers_spec_1.tempDir}/rootDir/bsconfig.json` });
            (0, chai_config_spec_1.expect)(config.files).to.eql(['child.brs']);
        });
        it('catches circular dependencies', () => {
            fsExtra.outputFileSync((0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/bsconfig.json`, `{
                "extends": "bsconfig2.json"
            }`);
            fsExtra.outputFileSync((0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/bsconfig2.json`, `{
                "extends": "bsconfig.json"
            }`);
            let threw = false;
            try {
                util_1.default.normalizeAndResolveConfig({ project: (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/bsconfig.json` });
            }
            catch (e) {
                threw = true;
            }
            process.chdir(cwd);
            (0, chai_config_spec_1.expect)(threw).to.equal(true, 'Should have thrown an error');
            //the test passed
        });
        it('properly handles default for watch', () => {
            let config = util_1.default.normalizeAndResolveConfig({ watch: true });
            (0, chai_config_spec_1.expect)(config.watch).to.be.true;
        });
        it('sets default value for bslibDestinationDir', () => {
            (0, chai_config_spec_1.expect)(util_1.default.normalizeConfig({}).bslibDestinationDir).to.equal('source');
        });
        it('strips leading and/or trailing slashes from bslibDestinationDir', () => {
            ['source/opt', '/source/opt', 'source/opt/', '/source/opt/'].forEach(input => {
                (0, chai_config_spec_1.expect)(util_1.default.normalizeConfig({ bslibDestinationDir: input }).bslibDestinationDir).to.equal('source/opt');
            });
        });
    });
    describe('areArraysEqual', () => {
        it('finds equal arrays', () => {
            (0, chai_config_spec_1.expect)(util_1.default.areArraysEqual([1, 2], [1, 2])).to.be.true;
            (0, chai_config_spec_1.expect)(util_1.default.areArraysEqual(['cat', 'dog'], ['cat', 'dog'])).to.be.true;
        });
        it('detects non-equal arrays', () => {
            (0, chai_config_spec_1.expect)(util_1.default.areArraysEqual([1, 2], [1])).to.be.false;
            (0, chai_config_spec_1.expect)(util_1.default.areArraysEqual([1, 2], [2])).to.be.false;
            (0, chai_config_spec_1.expect)(util_1.default.areArraysEqual([2], [1])).to.be.false;
            (0, chai_config_spec_1.expect)(util_1.default.areArraysEqual([2], [0])).to.be.false;
            (0, chai_config_spec_1.expect)(util_1.default.areArraysEqual(['cat', 'dog'], ['cat', 'dog', 'mouse'])).to.be.false;
            (0, chai_config_spec_1.expect)(util_1.default.areArraysEqual(['cat', 'dog'], ['dog', 'cat'])).to.be.false;
        });
    });
    describe('getPkgPathFromTarget', () => {
        it('works with both types of separators', () => {
            (0, chai_config_spec_1.expect)(util_1.default.getPkgPathFromTarget('components/component1.xml', '../lib.brs')).to.equal('lib.brs');
            (0, chai_config_spec_1.expect)(util_1.default.getPkgPathFromTarget('components\\component1.xml', '../lib.brs')).to.equal('lib.brs');
        });
        it('resolves single dot directory', () => {
            (0, chai_config_spec_1.expect)(util_1.default.getPkgPathFromTarget('components/component1.xml', './lib.brs')).to.equal((0, util_1.standardizePath) `components/lib.brs`);
        });
        it('resolves absolute pkg paths as relative paths', () => {
            (0, chai_config_spec_1.expect)(util_1.default.getPkgPathFromTarget('components/component1.xml', 'pkg:/source/lib.brs')).to.equal((0, util_1.standardizePath) `source/lib.brs`);
            (0, chai_config_spec_1.expect)(util_1.default.getPkgPathFromTarget('components/component1.xml', 'pkg:/lib.brs')).to.equal(`lib.brs`);
        });
        it('resolves gracefully for invalid values', () => {
            (0, chai_config_spec_1.expect)(util_1.default.getPkgPathFromTarget('components/component1.xml', 'pkg:/')).to.equal(null);
            (0, chai_config_spec_1.expect)(util_1.default.getPkgPathFromTarget('components/component1.xml', 'pkg:')).to.equal(null);
            (0, chai_config_spec_1.expect)(util_1.default.getPkgPathFromTarget('components/component1.xml', 'pkg')).to.equal((0, util_1.standardizePath) `components/pkg`);
        });
        it('supports pkg:/ and libpkg:/', () => {
            (0, chai_config_spec_1.expect)(util_1.default.getPkgPathFromTarget('components/component1.xml', 'pkg:/source/lib.brs')).to.equal((0, util_1.standardizePath) `source/lib.brs`);
            (0, chai_config_spec_1.expect)(util_1.default.getPkgPathFromTarget('components/component1.xml', 'libpkg:/source/lib.brs')).to.equal((0, util_1.standardizePath) `source/lib.brs`);
        });
        it('works case insensitive', () => {
            (0, chai_config_spec_1.expect)(util_1.default.getPkgPathFromTarget('components/component1.xml', 'PKG:/source/lib.brs')).to.equal((0, util_1.standardizePath) `source/lib.brs`);
            (0, chai_config_spec_1.expect)(util_1.default.getPkgPathFromTarget('components/component1.xml', 'LIBPKG:/source/lib.brs')).to.equal((0, util_1.standardizePath) `source/lib.brs`);
        });
    });
    describe('getRelativePath', () => {
        it('works when both files are at the root', () => {
            (0, chai_config_spec_1.expect)(util_1.default.getRelativePath('file.xml', 'file.brs')).to.equal('file.brs');
        });
        it('works when both files are in subfolder', () => {
            (0, chai_config_spec_1.expect)(util_1.default.getRelativePath('sub/file.xml', 'sub/file.brs')).to.equal('file.brs');
        });
        it('works when source in root, target in subdir', () => {
            (0, chai_config_spec_1.expect)(util_1.default.getRelativePath('file.xml', 'sub/file.brs')).to.equal((0, util_1.standardizePath) `sub/file.brs`);
        });
        it('works when source in sub, target in root', () => {
            (0, chai_config_spec_1.expect)(util_1.default.getRelativePath('sub/file.xml', 'file.brs')).to.equal((0, util_1.standardizePath) `../file.brs`);
        });
        it('works when source and target are in different subs', () => {
            (0, chai_config_spec_1.expect)(util_1.default.getRelativePath('sub1/file.xml', 'sub2/file.brs')).to.equal((0, util_1.standardizePath) `../sub2/file.brs`);
        });
    });
    describe('padLeft', () => {
        it('stops at an upper limit to prevent terrible memory explosions', () => {
            (0, chai_config_spec_1.expect)(util_1.default.padLeft('', Number.MAX_VALUE, ' ')).to.be.lengthOf(1000);
        });
    });
    describe('getTextForRange', () => {
        const testArray = ['The quick', 'brown fox', 'jumps over', 'the lazy dog'];
        const testString = testArray.join('\n');
        it('should work if string is passed in', () => {
            const result = util_1.default.getTextForRange(testString, vscode_languageserver_1.Range.create(0, 0, 1, 5));
            (0, chai_config_spec_1.expect)(result).to.equal('The quick\nbrown');
        });
        it('should work if array is passed in', () => {
            const result = util_1.default.getTextForRange(testArray, vscode_languageserver_1.Range.create(0, 0, 1, 5));
            (0, chai_config_spec_1.expect)(result).to.equal('The quick\nbrown');
        });
        it('should work if start and end are on the same line', () => {
            const result = util_1.default.getTextForRange(testArray, vscode_languageserver_1.Range.create(0, 4, 0, 7));
            (0, chai_config_spec_1.expect)(result).to.equal('qui');
        });
    });
    describe('comparePositionToRange', () => {
        it('does not crash on undefined props', () => {
            (0, chai_config_spec_1.expect)(util_1.default.comparePositionToRange(undefined, util_1.default.createRange(0, 0, 0, 0))).to.eql(0);
            (0, chai_config_spec_1.expect)(util_1.default.comparePositionToRange(util_1.default.createPosition(1, 1), undefined)).to.eql(0);
        });
        it('correctly compares positions to ranges with one line range line', () => {
            let range = vscode_languageserver_1.Range.create(1, 10, 1, 15);
            (0, chai_config_spec_1.expect)(util_1.default.comparePositionToRange(vscode_languageserver_1.Position.create(0, 13), range)).to.equal(-1);
            (0, chai_config_spec_1.expect)(util_1.default.comparePositionToRange(vscode_languageserver_1.Position.create(1, 1), range)).to.equal(-1);
            (0, chai_config_spec_1.expect)(util_1.default.comparePositionToRange(vscode_languageserver_1.Position.create(1, 9), range)).to.equal(-1);
            (0, chai_config_spec_1.expect)(util_1.default.comparePositionToRange(vscode_languageserver_1.Position.create(1, 10), range)).to.equal(0);
            (0, chai_config_spec_1.expect)(util_1.default.comparePositionToRange(vscode_languageserver_1.Position.create(1, 13), range)).to.equal(0);
            (0, chai_config_spec_1.expect)(util_1.default.comparePositionToRange(vscode_languageserver_1.Position.create(1, 15), range)).to.equal(0);
            (0, chai_config_spec_1.expect)(util_1.default.comparePositionToRange(vscode_languageserver_1.Position.create(1, 16), range)).to.equal(1);
            (0, chai_config_spec_1.expect)(util_1.default.comparePositionToRange(vscode_languageserver_1.Position.create(2, 10), range)).to.equal(1);
        });
        it('correctly compares positions to ranges with multiline range', () => {
            let range = vscode_languageserver_1.Range.create(1, 10, 3, 15);
            (0, chai_config_spec_1.expect)(util_1.default.comparePositionToRange(vscode_languageserver_1.Position.create(0, 13), range)).to.equal(-1);
            (0, chai_config_spec_1.expect)(util_1.default.comparePositionToRange(vscode_languageserver_1.Position.create(1, 1), range)).to.equal(-1);
            (0, chai_config_spec_1.expect)(util_1.default.comparePositionToRange(vscode_languageserver_1.Position.create(1, 9), range)).to.equal(-1);
            (0, chai_config_spec_1.expect)(util_1.default.comparePositionToRange(vscode_languageserver_1.Position.create(1, 10), range)).to.equal(0);
            (0, chai_config_spec_1.expect)(util_1.default.comparePositionToRange(vscode_languageserver_1.Position.create(1, 13), range)).to.equal(0);
            (0, chai_config_spec_1.expect)(util_1.default.comparePositionToRange(vscode_languageserver_1.Position.create(1, 15), range)).to.equal(0);
            (0, chai_config_spec_1.expect)(util_1.default.comparePositionToRange(vscode_languageserver_1.Position.create(2, 0), range)).to.equal(0);
            (0, chai_config_spec_1.expect)(util_1.default.comparePositionToRange(vscode_languageserver_1.Position.create(2, 10), range)).to.equal(0);
            (0, chai_config_spec_1.expect)(util_1.default.comparePositionToRange(vscode_languageserver_1.Position.create(2, 13), range)).to.equal(0);
            (0, chai_config_spec_1.expect)(util_1.default.comparePositionToRange(vscode_languageserver_1.Position.create(3, 0), range)).to.equal(0);
            (0, chai_config_spec_1.expect)(util_1.default.comparePositionToRange(vscode_languageserver_1.Position.create(3, 10), range)).to.equal(0);
            (0, chai_config_spec_1.expect)(util_1.default.comparePositionToRange(vscode_languageserver_1.Position.create(3, 13), range)).to.equal(0);
            (0, chai_config_spec_1.expect)(util_1.default.comparePositionToRange(vscode_languageserver_1.Position.create(3, 16), range)).to.equal(1);
            (0, chai_config_spec_1.expect)(util_1.default.comparePositionToRange(vscode_languageserver_1.Position.create(4, 10), range)).to.equal(1);
        });
    });
    describe('getExtension', () => {
        it('handles edge cases', () => {
            (0, chai_config_spec_1.expect)(util_1.default.getExtension('main.bs')).to.eql('.bs');
            (0, chai_config_spec_1.expect)(util_1.default.getExtension('main.brs')).to.eql('.brs');
            (0, chai_config_spec_1.expect)(util_1.default.getExtension('main.spec.bs')).to.eql('.bs');
            (0, chai_config_spec_1.expect)(util_1.default.getExtension('main.d.bs')).to.eql('.d.bs');
            (0, chai_config_spec_1.expect)(util_1.default.getExtension('main.xml')).to.eql('.xml');
            (0, chai_config_spec_1.expect)(util_1.default.getExtension('main.component.xml')).to.eql('.xml');
        });
    });
    describe('loadPlugins', () => {
        let pluginPath;
        let id = 1;
        beforeEach(() => {
            // `require` caches plugins, so generate a unique plugin name for every test
            pluginPath = `${testHelpers_spec_1.tempDir}/plugin${id++}.js`;
        });
        it('shows warning when loading plugin with old "object" format', () => {
            fsExtra.writeFileSync(pluginPath, `
                module.exports = {
                    name: 'AwesomePlugin'
                };
            `);
            const stub = sinon.stub(console, 'warn').callThrough();
            const plugins = util_1.default.loadPlugins(cwd, [pluginPath]);
            (0, chai_config_spec_1.expect)(plugins[0].name).to.eql('AwesomePlugin');
            (0, chai_config_spec_1.expect)(stub.callCount).to.equal(1);
        });
        it('shows warning when loading plugin with old "object" format and exports.default', () => {
            fsExtra.writeFileSync(pluginPath, `
                module.exports.default = {
                    name: 'AwesomePlugin'
                };
            `);
            const stub = sinon.stub(console, 'warn').callThrough();
            const plugins = util_1.default.loadPlugins(cwd, [pluginPath]);
            (0, chai_config_spec_1.expect)(plugins[0].name).to.eql('AwesomePlugin');
            (0, chai_config_spec_1.expect)(stub.callCount).to.equal(1);
        });
        it('loads plugin with factory pattern', () => {
            fsExtra.writeFileSync(pluginPath, `
                module.exports = function() {
                    return {
                        name: 'AwesomePlugin'
                    };
                };
            `);
            const stub = sinon.stub(console, 'warn').callThrough();
            const plugins = util_1.default.loadPlugins(cwd, [pluginPath]);
            (0, chai_config_spec_1.expect)(plugins[0].name).to.eql('AwesomePlugin');
            //does not warn about factory pattern
            (0, chai_config_spec_1.expect)(stub.callCount).to.equal(0);
        });
        it('loads plugin with factory pattern and `default`', () => {
            fsExtra.writeFileSync(pluginPath, `
                module.exports.default = function() {
                    return {
                        name: 'AwesomePlugin'
                    };
                };
            `);
            const stub = sinon.stub(console, 'warn').callThrough();
            const plugins = util_1.default.loadPlugins(cwd, [pluginPath]);
            (0, chai_config_spec_1.expect)(plugins[0].name).to.eql('AwesomePlugin');
            //does not warn about factory pattern
            (0, chai_config_spec_1.expect)(stub.callCount).to.equal(0);
        });
        it('passes factory options', () => {
            fsExtra.writeFileSync(pluginPath, `
                module.exports.default = function(options) {
                    return {
                        name: 'AwesomePlugin',
                        initOptions: options
                    };
                };
            `);
            sinon.stub(console, 'warn').callThrough();
            const plugins = util_1.default.loadPlugins(cwd, [pluginPath]);
            (0, chai_config_spec_1.expect)(plugins[0].initOptions).to.eql({
                version: util_1.default.getBrighterScriptVersion()
            });
        });
    });
    describe('copyBslibToStaging', () => {
        it('copies from local bslib dependency', async () => {
            await util_1.default.copyBslibToStaging(testHelpers_spec_1.tempDir);
            (0, chai_config_spec_1.expect)(fsExtra.pathExistsSync(`${testHelpers_spec_1.tempDir}/source/bslib.brs`)).to.be.true;
            (0, chai_config_spec_1.expect)(/^function bslib_toString\(/mg.exec(fsExtra.readFileSync(`${testHelpers_spec_1.tempDir}/source/bslib.brs`).toString())).not.to.be.null;
        });
        it('copies from local bslib dependency to optionally specified destination directory', async () => {
            await util_1.default.copyBslibToStaging(testHelpers_spec_1.tempDir, 'source/opt');
            (0, chai_config_spec_1.expect)(fsExtra.pathExistsSync(`${testHelpers_spec_1.tempDir}/source/opt/bslib.brs`)).to.be.true;
            (0, chai_config_spec_1.expect)(/^function bslib_toString\(/mg.exec(fsExtra.readFileSync(`${testHelpers_spec_1.tempDir}/source/opt/bslib.brs`).toString())).not.to.be.null;
        });
    });
    describe('rangesIntersect', () => {
        it('does not crash on undefined range', () => {
            (0, chai_config_spec_1.expect)(util_1.default.rangesIntersect(undefined, util_1.default.createRange(0, 0, 0, 0))).to.be.false;
            (0, chai_config_spec_1.expect)(util_1.default.rangesIntersect(util_1.default.createRange(0, 0, 0, 0), undefined)).to.be.false;
        });
        it('does not match when ranges do not touch (a < b)', () => {
            // AA BB
            (0, chai_config_spec_1.expect)(util_1.default.rangesIntersectOrTouch(util_1.default.createRange(0, 0, 0, 1), util_1.default.createRange(0, 2, 0, 3))).to.be.false;
        });
        it('does not match when ranges do not touch (a < b)', () => {
            // BB AA
            (0, chai_config_spec_1.expect)(util_1.default.rangesIntersectOrTouch(util_1.default.createRange(0, 2, 0, 3), util_1.default.createRange(0, 0, 0, 1))).to.be.false;
        });
        it('does not match when ranges touch at right edge', () => {
            // AABB
            (0, chai_config_spec_1.expect)(util_1.default.rangesIntersect(util_1.default.createRange(0, 0, 0, 1), util_1.default.createRange(0, 1, 0, 2))).to.be.false;
        });
        it('does not match when ranges touch at left edge', () => {
            // BBAA
            (0, chai_config_spec_1.expect)(util_1.default.rangesIntersect(util_1.default.createRange(0, 1, 0, 2), util_1.default.createRange(0, 0, 0, 1))).to.be.false;
        });
        it('matches when range overlaps by single character on the right', () => {
            // A BA B
            (0, chai_config_spec_1.expect)(util_1.default.rangesIntersect(util_1.default.createRange(0, 1, 0, 3), util_1.default.createRange(0, 2, 0, 4))).to.be.true;
        });
        it('matches when range overlaps by single character on the left', () => {
            // B AB A
            (0, chai_config_spec_1.expect)(util_1.default.rangesIntersect(util_1.default.createRange(0, 2, 0, 4), util_1.default.createRange(0, 1, 0, 3))).to.be.true;
        });
        it('matches when A is contained by B at the edges', () => {
            // B AA B
            (0, chai_config_spec_1.expect)(util_1.default.rangesIntersect(util_1.default.createRange(0, 2, 0, 3), util_1.default.createRange(0, 1, 0, 4))).to.be.true;
        });
        it('matches when B is contained by A at the edges', () => {
            // A BB A
            (0, chai_config_spec_1.expect)(util_1.default.rangesIntersect(util_1.default.createRange(0, 1, 0, 4), util_1.default.createRange(0, 2, 0, 3))).to.be.true;
        });
        it('matches when A and B are identical', () => {
            // ABBA
            (0, chai_config_spec_1.expect)(util_1.default.rangesIntersect(util_1.default.createRange(0, 1, 0, 2), util_1.default.createRange(0, 1, 0, 2))).to.be.true;
        });
        it('matches when A spans multiple lines', () => {
            // ABBA
            (0, chai_config_spec_1.expect)(util_1.default.rangesIntersect(util_1.default.createRange(0, 1, 2, 0), util_1.default.createRange(0, 1, 0, 3))).to.be.true;
        });
        it('matches when B spans multiple lines', () => {
            // ABBA
            (0, chai_config_spec_1.expect)(util_1.default.rangesIntersect(util_1.default.createRange(0, 1, 0, 3), util_1.default.createRange(0, 1, 2, 0))).to.be.true;
        });
    });
    describe('rangesIntersectOrTouch', () => {
        it('does not crash on undefined range', () => {
            (0, chai_config_spec_1.expect)(util_1.default.rangesIntersectOrTouch(undefined, util_1.default.createRange(0, 0, 0, 0))).to.be.false;
            (0, chai_config_spec_1.expect)(util_1.default.rangesIntersectOrTouch(util_1.default.createRange(0, 0, 0, 0), undefined)).to.be.false;
        });
        it('does not match when ranges do not touch (a < b)', () => {
            // AA BB
            (0, chai_config_spec_1.expect)(util_1.default.rangesIntersectOrTouch(util_1.default.createRange(0, 0, 0, 1), util_1.default.createRange(0, 2, 0, 3))).to.be.false;
        });
        it('does not match when ranges do not touch (a < b)', () => {
            // BB AA
            (0, chai_config_spec_1.expect)(util_1.default.rangesIntersectOrTouch(util_1.default.createRange(0, 2, 0, 3), util_1.default.createRange(0, 0, 0, 1))).to.be.false;
        });
        it('matches when ranges touch at right edge', () => {
            // AABB
            (0, chai_config_spec_1.expect)(util_1.default.rangesIntersectOrTouch(util_1.default.createRange(0, 0, 0, 1), util_1.default.createRange(0, 1, 0, 2))).to.be.true;
        });
        it('matches when ranges touch at left edge', () => {
            // BBAA
            (0, chai_config_spec_1.expect)(util_1.default.rangesIntersectOrTouch(util_1.default.createRange(0, 1, 0, 2), util_1.default.createRange(0, 0, 0, 1))).to.be.true;
        });
        it('matches when range overlaps by single character on the right', () => {
            // A BA B
            (0, chai_config_spec_1.expect)(util_1.default.rangesIntersectOrTouch(util_1.default.createRange(0, 1, 0, 3), util_1.default.createRange(0, 2, 0, 4))).to.be.true;
        });
        it('matches when range overlaps by single character on the left', () => {
            // B AB A
            (0, chai_config_spec_1.expect)(util_1.default.rangesIntersectOrTouch(util_1.default.createRange(0, 2, 0, 4), util_1.default.createRange(0, 1, 0, 3))).to.be.true;
        });
        it('matches when A is contained by B at the edges', () => {
            // B AA B
            (0, chai_config_spec_1.expect)(util_1.default.rangesIntersectOrTouch(util_1.default.createRange(0, 2, 0, 3), util_1.default.createRange(0, 1, 0, 4))).to.be.true;
        });
        it('matches when B is contained by A at the edges', () => {
            // A BB A
            (0, chai_config_spec_1.expect)(util_1.default.rangesIntersectOrTouch(util_1.default.createRange(0, 1, 0, 4), util_1.default.createRange(0, 2, 0, 3))).to.be.true;
        });
        it('matches when A and B are identical', () => {
            // ABBA
            (0, chai_config_spec_1.expect)(util_1.default.rangesIntersectOrTouch(util_1.default.createRange(0, 1, 0, 2), util_1.default.createRange(0, 1, 0, 2))).to.be.true;
        });
        it('matches when A spans multiple lines', () => {
            // ABBA
            (0, chai_config_spec_1.expect)(util_1.default.rangesIntersectOrTouch(util_1.default.createRange(0, 1, 2, 0), util_1.default.createRange(0, 1, 0, 3))).to.be.true;
        });
        it('matches when B spans multiple lines', () => {
            // ABBA
            (0, chai_config_spec_1.expect)(util_1.default.rangesIntersectOrTouch(util_1.default.createRange(0, 1, 0, 3), util_1.default.createRange(0, 1, 2, 0))).to.be.true;
        });
    });
    it('sortByRange', () => {
        const front = {
            range: util_1.default.createRange(1, 1, 1, 2)
        };
        const middle = {
            range: util_1.default.createRange(1, 3, 1, 4)
        };
        const back = {
            range: util_1.default.createRange(1, 5, 1, 6)
        };
        (0, chai_config_spec_1.expect)(util_1.default.sortByRange([middle, front, back])).to.eql([
            front, middle, back
        ]);
    });
    describe('splitWithLocation', () => {
        it('works with no split items', () => {
            (0, chai_config_spec_1.expect)(util_1.default.splitGetRange('.', 'hello', util_1.default.createRange(2, 10, 2, 15))).to.eql([{
                    text: 'hello',
                    range: util_1.default.createRange(2, 10, 2, 15)
                }]);
        });
        it('handles empty chunks', () => {
            (0, chai_config_spec_1.expect)(util_1.default.splitGetRange('l', 'hello', util_1.default.createRange(2, 10, 2, 15))).to.eql([{
                    text: 'he',
                    range: util_1.default.createRange(2, 10, 2, 12)
                }, {
                    text: 'o',
                    range: util_1.default.createRange(2, 14, 2, 15)
                }]);
        });
        it('handles multiple non-empty chunks', () => {
            (0, chai_config_spec_1.expect)(util_1.default.splitGetRange('.', 'abc.d.efgh.i', util_1.default.createRange(2, 10, 2, 2))).to.eql([{
                    text: 'abc',
                    range: util_1.default.createRange(2, 10, 2, 13)
                }, {
                    text: 'd',
                    range: util_1.default.createRange(2, 14, 2, 15)
                }, {
                    text: 'efgh',
                    range: util_1.default.createRange(2, 16, 2, 20)
                }, {
                    text: 'i',
                    range: util_1.default.createRange(2, 21, 2, 22)
                }]);
        });
    });
    describe('toDiagnostic', () => {
        it('uses a uri on relatedInfo missing location', () => {
            (0, chai_config_spec_1.expect)(util_1.default.toDiagnostic(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.cannotFindName('someVar')), { file: undefined, range: util_1.default.createRange(1, 2, 3, 4), relatedInformation: [{
                        message: 'Alpha',
                        location: undefined
                    }] }), 'u/r/i').relatedInformation).to.eql([{
                    message: 'Alpha',
                    location: util_1.default.createLocation('u/r/i', util_1.default.createRange(1, 2, 3, 4))
                }]);
        });
        it('eliminates diagnostics with relatedInformation that are missing a uri', () => {
            (0, chai_config_spec_1.expect)(util_1.default.toDiagnostic(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.cannotFindName('someVar')), { file: undefined, range: util_1.default.createRange(1, 2, 3, 4), relatedInformation: [{
                        message: 'Alpha',
                        location: util_1.default.createLocation('uri', util_1.default.createRange(2, 3, 4, 5))
                    }, {
                        message: 'Beta',
                        location: undefined
                    }] }), undefined).relatedInformation).to.eql([{
                    message: 'Alpha',
                    location: util_1.default.createLocation('uri', util_1.default.createRange(2, 3, 4, 5))
                }]);
        });
    });
    describe('promiseRaceMatch', () => {
        async function resolveAfter(value, timeout) {
            await util_1.default.sleep(timeout);
            return value;
        }
        it('returns the value from the first promise that resolves that matches the matcher', async () => {
            (0, chai_config_spec_1.expect)(await util_1.default.promiseRaceMatch([
                resolveAfter('a', 1),
                resolveAfter('b', 20),
                resolveAfter('c', 30)
            ], x => true)).to.eql('a');
            (0, chai_config_spec_1.expect)(await util_1.default.promiseRaceMatch([
                resolveAfter('a', 30),
                resolveAfter('b', 1),
                resolveAfter('c', 20)
            ], x => true)).to.eql('b');
            (0, chai_config_spec_1.expect)(await util_1.default.promiseRaceMatch([
                resolveAfter('a', 20),
                resolveAfter('b', 30),
                resolveAfter('c', 1)
            ], x => true)).to.eql('c');
        });
        it('does not throw when there were zero promises', async () => {
            (0, chai_config_spec_1.expect)(await util_1.default.promiseRaceMatch([], x => true)).to.be.undefined;
        });
        it('returns a value even if one of the promises never resolves', async () => {
            (0, chai_config_spec_1.expect)(await util_1.default.promiseRaceMatch([
                new Promise(() => {
                    //i will never resolve
                }),
                resolveAfter('a', 1)
            ], x => true)).to.eql('a');
        });
        it('rejects if all the promises fail', async () => {
            let error;
            try {
                await util_1.default.promiseRaceMatch([
                    Promise.reject(new Error('error 1')),
                    Promise.reject(new Error('error 2')),
                    Promise.reject(new Error('error 3'))
                ], x => true);
            }
            catch (e) {
                error = e;
            }
            (0, chai_config_spec_1.expect)(error.errors.map(x => x.message)).to.eql([
                'error 1',
                'error 2',
                'error 3'
            ]);
        });
        it('returns a value when one of the promises rejects', async () => {
            (0, chai_config_spec_1.expect)(await util_1.default.promiseRaceMatch([
                Promise.reject(new Error('crash')),
                resolveAfter('a', 1)
            ], x => true)).to.eql('a');
        });
        it('returns undefined if no valuees match the matcher', async () => {
            (0, chai_config_spec_1.expect)(await util_1.default.promiseRaceMatch([
                resolveAfter('a', 1),
                resolveAfter('b', 20),
                resolveAfter('c', 30)
            ], x => false)).to.be.undefined;
        });
        it('returns undefined if no matcher is provided', async () => {
            (0, chai_config_spec_1.expect)(await util_1.default.promiseRaceMatch([
                resolveAfter('a', 1),
                resolveAfter('b', 20),
                resolveAfter('c', 30)
            ], undefined)).to.be.undefined;
        });
    });
    describe('standardizePath', () => {
        let isWindowsOrig = util_1.default['isWindows'];
        let isWindows = isWindowsOrig;
        beforeEach(() => {
            util_1.default['standardizePathCache'].clear();
        });
        afterEach(() => {
            util_1.default['standardizePathCache'].clear();
            util_1.default['isWindows'] = isWindowsOrig;
        });
        function test(incoming, expected) {
            util_1.default['isWindows'] = isWindows;
            (0, chai_config_spec_1.expect)(util_1.default.standardizePath(incoming)).to.eql(expected);
            util_1.default['isWindows'] = isWindowsOrig;
        }
        describe('windows paths on windows', () => {
            beforeEach(() => {
                isWindows = true;
            });
            it('mismatched slashes', () => {
                test('c:/one/two/three', 'c:\\one\\two\\three');
                test('c:\\one\\two\\three', 'c:\\one\\two\\three');
                test('c:/one\\two/three', 'c:\\one\\two\\three');
            });
            it('trailing slashes', () => {
                test('c:/one/two/three/', 'c:\\one\\two\\three\\');
                test('c:/one/two/three\\', 'c:\\one\\two\\three\\');
            });
            it('drive letter case', () => {
                test('D:/one/two/three', 'd:\\one\\two\\three');
            });
            it('consecutive slashes', () => {
                test('c://one//two//three//', 'c:\\one\\two\\three\\');
                test('c:\\\\one\\\\two\\\\three\\\\', 'c:\\one\\two\\three\\');
            });
        });
        describe('windows paths on unix', () => {
            beforeEach(() => {
                isWindows = false;
            });
            it('mismatched slashes', () => {
                test('c:/one/two/three', 'c:/one/two/three');
                test('c:\\one\\two\\three', 'c:/one/two/three');
                test('c:/one\\two/three', 'c:/one/two/three');
            });
            it('trailing slashes', () => {
                test('c:/one/two/three/', 'c:/one/two/three/');
                test('c:/one/two/three\\', 'c:/one/two/three/');
            });
            it('drive letter case', () => {
                test('D:/one/two/three', 'd:/one/two/three');
            });
            it('consecutive slashes', () => {
                test('c://one//two//three//', 'c:/one/two/three/');
                test('c:\\\\one\\\\two\\\\three\\\\', 'c:/one/two/three/');
            });
        });
        describe('unix paths on windows', () => {
            beforeEach(() => {
                isWindows = true;
            });
            it('mismatched slashes', () => {
                test('/one/two/three', '\\one\\two\\three');
                test('\\one\\two\\three', '\\one\\two\\three');
                test('/one\\two/three', '\\one\\two\\three');
            });
            it('trailing slashes', () => {
                test('/one/two/three/', '\\one\\two\\three\\');
                test('/one/two/three\\', '\\one\\two\\three\\');
            });
            it('consecutive slashes', () => {
                test('/one//two///three//', '\\one\\two\\three\\');
                test('\\one\\\\two\\\\\\three\\\\', '\\one\\two\\three\\');
            });
        });
        describe('unix paths on unix', () => {
            beforeEach(() => {
                isWindows = false;
            });
            it('mismatched slashes', () => {
                test('/one/two/three', '/one/two/three');
                test('\\one\\two\\three', '/one/two/three');
                test('/one\\two/three', '/one/two/three');
            });
            it('trailing slashes', () => {
                test('/one/two/three/', '/one/two/three/');
                test('/one/two/three\\', '/one/two/three/');
            });
            it('consecutive slashes', () => {
                test('/one//two///three//', '/one/two/three/');
                test('\\\\one\\\\two\\\\three\\\\', '/one/two/three/');
            });
        });
    });
});
//# sourceMappingURL=util.spec.js.map
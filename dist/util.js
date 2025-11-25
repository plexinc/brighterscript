"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.util = exports.standardizePath = exports.Util = void 0;
const fs = require("fs");
const fsExtra = require("fs-extra");
const jsonc_parser_1 = require("jsonc-parser");
const path = require("path");
const roku_deploy_1 = require("roku-deploy");
const vscode_uri_1 = require("vscode-uri");
const xml2js = require("xml2js");
const DiagnosticMessages_1 = require("./DiagnosticMessages");
const BooleanType_1 = require("./types/BooleanType");
const DoubleType_1 = require("./types/DoubleType");
const DynamicType_1 = require("./types/DynamicType");
const FloatType_1 = require("./types/FloatType");
const FunctionType_1 = require("./types/FunctionType");
const IntegerType_1 = require("./types/IntegerType");
const InvalidType_1 = require("./types/InvalidType");
const LongIntegerType_1 = require("./types/LongIntegerType");
const ObjectType_1 = require("./types/ObjectType");
const StringType_1 = require("./types/StringType");
const VoidType_1 = require("./types/VoidType");
const Parser_1 = require("./parser/Parser");
const logging_1 = require("./logging");
const TokenKind_1 = require("./lexer/TokenKind");
const reflection_1 = require("./astUtils/reflection");
const visitors_1 = require("./astUtils/visitors");
const CustomType_1 = require("./types/CustomType");
const source_map_1 = require("source-map");
const requireRelative = require("require-relative");
const roku_types_1 = require("./roku-types");
class Util {
    constructor() {
        this.isWindows = process.platform === 'win32';
        this.standardizePathCache = new Map();
    }
    clearConsole() {
        // process.stdout.write('\x1Bc');
    }
    /**
     * Get the version of brighterscript
     */
    getBrighterScriptVersion() {
        try {
            return fsExtra.readJsonSync(`${__dirname}/../package.json`).version;
        }
        catch (_a) {
            return undefined;
        }
    }
    /**
     * Returns the number of parent directories in the filPath
     */
    getParentDirectoryCount(filePath) {
        if (!filePath) {
            return -1;
        }
        else {
            return filePath.replace(/^pkg:/, '').split(/[\\\/]/).length - 1;
        }
    }
    /**
     * Determine if the file exists
     */
    async pathExists(filePath) {
        if (!filePath) {
            return false;
        }
        else {
            return fsExtra.pathExists(filePath);
        }
    }
    /**
     * Determine if the file exists
     */
    pathExistsSync(filePath) {
        if (!filePath) {
            return false;
        }
        else {
            return fsExtra.pathExistsSync(filePath);
        }
    }
    /**
     * Determine if this path is a directory
     */
    isDirectorySync(dirPath) {
        try {
            return dirPath !== undefined && fs.existsSync(dirPath) && fs.lstatSync(dirPath).isDirectory();
        }
        catch (e) {
            return false;
        }
    }
    /**
     * Read a file from disk. If a failure occurrs, simply return undefined
     * @param filePath path to the file
     * @returns the string contents, or undefined if the file doesn't exist
     */
    readFileSync(filePath) {
        try {
            return fsExtra.readFileSync(filePath);
        }
        catch (e) {
            return undefined;
        }
    }
    /**
     * Given a pkg path of any kind, transform it to a roku-specific pkg path (i.e. "pkg:/some/path.brs")
     */
    sanitizePkgPath(pkgPath) {
        pkgPath = pkgPath.replace(/\\/g, '/');
        //if there's no protocol, assume it's supposed to start with `pkg:/`
        if (!this.startsWithProtocol(pkgPath)) {
            pkgPath = 'pkg:/' + pkgPath;
        }
        return pkgPath;
    }
    /**
     * Determine if the given path starts with a protocol
     */
    startsWithProtocol(path) {
        return !!/^[-a-z]+:\//i.exec(path);
    }
    /**
     * Given a pkg path of any kind, transform it to a roku-specific pkg path (i.e. "pkg:/some/path.brs")
     */
    getRokuPkgPath(pkgPath) {
        pkgPath = pkgPath.replace(/\\/g, '/');
        return 'pkg:/' + pkgPath;
    }
    /**
     * Given a path to a file/directory, replace all path separators with the current system's version.
     */
    pathSepNormalize(filePath, separator) {
        if (!filePath) {
            return filePath;
        }
        separator = separator ? separator : path.sep;
        return filePath.replace(/[\\/]+/g, separator);
    }
    /**
     * Find the path to the config file.
     * If the config file path doesn't exist
     * @param cwd the current working directory where the search for configs should begin
     */
    getConfigFilePath(cwd) {
        cwd = cwd !== null && cwd !== void 0 ? cwd : process.cwd();
        let configPath = path.join(cwd, 'bsconfig.json');
        //find the nearest config file path
        for (let i = 0; i < 100; i++) {
            if (this.pathExistsSync(configPath)) {
                return configPath;
            }
            else {
                let parentDirPath = path.dirname(path.dirname(configPath));
                configPath = path.join(parentDirPath, 'bsconfig.json');
            }
        }
    }
    getRangeFromOffsetLength(text, offset, length) {
        let lineIndex = 0;
        let colIndex = 0;
        for (let i = 0; i < text.length; i++) {
            if (offset === i) {
                break;
            }
            let char = text[i];
            if (char === '\n' || (char === '\r' && text[i + 1] === '\n')) {
                lineIndex++;
                colIndex = 0;
                i++;
                continue;
            }
            else {
                colIndex++;
            }
        }
        return exports.util.createRange(lineIndex, colIndex, lineIndex, colIndex + length);
    }
    /**
     * Load the contents of a config file.
     * If the file extends another config, this will load the base config as well.
     * @param configFilePath the relative or absolute path to a brighterscript config json file
     * @param parentProjectPaths a list of parent config files. This is used by this method to recursively build the config list
     */
    loadConfigFile(configFilePath, parentProjectPaths, cwd = process.cwd()) {
        var _a;
        if (configFilePath) {
            //if the config file path starts with question mark, then it's optional. return undefined if it doesn't exist
            if (configFilePath.startsWith('?')) {
                //remove leading question mark
                configFilePath = configFilePath.substring(1);
                if (fsExtra.pathExistsSync(path.resolve(cwd, configFilePath)) === false) {
                    return undefined;
                }
            }
            //keep track of the inheritance chain
            parentProjectPaths = parentProjectPaths ? parentProjectPaths : [];
            configFilePath = path.resolve(cwd, configFilePath);
            if (parentProjectPaths === null || parentProjectPaths === void 0 ? void 0 : parentProjectPaths.includes(configFilePath)) {
                parentProjectPaths.push(configFilePath);
                parentProjectPaths.reverse();
                throw new Error('Circular dependency detected: "' + parentProjectPaths.join('" => ') + '"');
            }
            //load the project file
            let projectFileContents = fsExtra.readFileSync(configFilePath).toString();
            let parseErrors = [];
            let projectConfig = (_a = (0, jsonc_parser_1.parse)(projectFileContents, parseErrors, {
                allowEmptyContent: true,
                allowTrailingComma: true,
                disallowComments: false
            })) !== null && _a !== void 0 ? _a : {};
            if (parseErrors.length > 0) {
                let err = parseErrors[0];
                let diagnostic = Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.bsConfigJsonHasSyntaxErrors((0, jsonc_parser_1.printParseErrorCode)(parseErrors[0].error))), { file: {
                        srcPath: configFilePath
                    }, range: this.getRangeFromOffsetLength(projectFileContents, err.offset, err.length) });
                throw diagnostic; //eslint-disable-line @typescript-eslint/no-throw-literal
            }
            let projectFileCwd = path.dirname(configFilePath);
            //`plugins` paths should be relative to the current bsconfig
            this.resolvePathsRelativeTo(projectConfig, 'plugins', projectFileCwd);
            //`require` paths should be relative to cwd
            exports.util.resolvePathsRelativeTo(projectConfig, 'require', projectFileCwd);
            let result;
            //if the project has a base file, load it
            if (projectConfig && typeof projectConfig.extends === 'string') {
                let baseProjectConfig = this.loadConfigFile(projectConfig.extends, [...parentProjectPaths, configFilePath], projectFileCwd);
                //extend the base config with the current project settings
                result = Object.assign(Object.assign({}, baseProjectConfig), projectConfig);
            }
            else {
                result = projectConfig;
                let ancestors = parentProjectPaths ? parentProjectPaths : [];
                ancestors.push(configFilePath);
                result._ancestors = parentProjectPaths;
            }
            //make any paths in the config absolute (relative to the CURRENT config file)
            if (result.outFile) {
                result.outFile = path.resolve(projectFileCwd, result.outFile);
            }
            if (result.rootDir) {
                result.rootDir = path.resolve(projectFileCwd, result.rootDir);
            }
            if (result.cwd) {
                result.cwd = path.resolve(projectFileCwd, result.cwd);
            }
            if (result.stagingDir) {
                result.stagingDir = path.resolve(projectFileCwd, result.stagingDir);
            }
            if (result.sourceRoot && result.resolveSourceRoot) {
                result.sourceRoot = path.resolve(projectFileCwd, result.sourceRoot);
            }
            return result;
        }
    }
    /**
     * Convert relative paths to absolute paths, relative to the given directory. Also de-dupes the paths. Modifies the array in-place
     * @param collection usually a bsconfig.
     * @param key a key of the config to read paths from (usually this is `'plugins'` or `'require'`)
     * @param relativeDir the path to the folder where the paths should be resolved relative to. This should be an absolute path
     */
    resolvePathsRelativeTo(collection, key, relativeDir) {
        var _a;
        if (!collection[key]) {
            return;
        }
        const result = new Set();
        for (const p of (_a = collection[key]) !== null && _a !== void 0 ? _a : []) {
            if (p) {
                result.add((p === null || p === void 0 ? void 0 : p.startsWith('.')) ? path.resolve(relativeDir, p) : p);
            }
        }
        collection[key] = [...result];
    }
    /**
     * Do work within the scope of a changed current working directory
     * @param targetCwd the cwd where the work should be performed
     * @param callback a function to call when the cwd has been changed to `targetCwd`
     */
    cwdWork(targetCwd, callback) {
        let originalCwd = process.cwd();
        if (targetCwd) {
            process.chdir(targetCwd);
        }
        let result;
        let err;
        try {
            result = callback();
        }
        catch (e) {
            err = e;
        }
        if (targetCwd) {
            process.chdir(originalCwd);
        }
        if (err) {
            throw err;
        }
        else {
            //justification: `result` is set as long as `err` is not set and vice versa
            return result;
        }
    }
    /**
     * Given a BsConfig object, start with defaults,
     * merge with bsconfig.json and the provided options.
     * @param config a bsconfig object to use as the baseline for the resulting config
     */
    normalizeAndResolveConfig(config) {
        let result = this.normalizeConfig({});
        if (config === null || config === void 0 ? void 0 : config.noProject) {
            return result;
        }
        //if no options were provided, try to find a bsconfig.json file
        if (!config || !config.project) {
            result.project = this.getConfigFilePath(config === null || config === void 0 ? void 0 : config.cwd);
        }
        else {
            //use the config's project link
            result.project = config.project;
        }
        if (result.project) {
            let configFile = this.loadConfigFile(result.project, undefined, config === null || config === void 0 ? void 0 : config.cwd);
            result = Object.assign(result, configFile);
        }
        //override the defaults with the specified options
        result = Object.assign(result, config);
        return result;
    }
    /**
     * Set defaults for any missing items
     * @param config a bsconfig object to use as the baseline for the resulting config
     */
    normalizeConfig(config) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        config = config !== null && config !== void 0 ? config : {};
        const cwd = (_a = config.cwd) !== null && _a !== void 0 ? _a : process.cwd();
        const rootFolderName = path.basename(cwd);
        const retainStagingDir = ((_b = config.retainStagingDir) !== null && _b !== void 0 ? _b : config.retainStagingFolder) === true ? true : false;
        let logLevel = logging_1.LogLevel.log;
        if (typeof config.logLevel === 'string') {
            logLevel = (_c = logging_1.LogLevel[config.logLevel.toLowerCase()]) !== null && _c !== void 0 ? _c : logging_1.LogLevel.log;
        }
        let bslibDestinationDir = (_d = config.bslibDestinationDir) !== null && _d !== void 0 ? _d : 'source';
        if (bslibDestinationDir !== 'source') {
            // strip leading and trailing slashes
            bslibDestinationDir = bslibDestinationDir.replace(/^(\/*)(.*?)(\/*)$/, '$2');
        }
        const configWithDefaults = {
            cwd: cwd,
            deploy: config.deploy === true ? true : false,
            //use default files array from rokuDeploy
            files: (_e = config.files) !== null && _e !== void 0 ? _e : [...roku_deploy_1.DefaultFiles],
            createPackage: config.createPackage === false ? false : true,
            outFile: (_f = config.outFile) !== null && _f !== void 0 ? _f : `./out/${rootFolderName}.zip`,
            sourceMap: config.sourceMap === true,
            username: (_g = config.username) !== null && _g !== void 0 ? _g : 'rokudev',
            watch: config.watch === true ? true : false,
            emitFullPaths: config.emitFullPaths === true ? true : false,
            retainStagingDir: retainStagingDir,
            retainStagingFolder: retainStagingDir,
            copyToStaging: config.copyToStaging === false ? false : true,
            ignoreErrorCodes: (_h = config.ignoreErrorCodes) !== null && _h !== void 0 ? _h : [],
            diagnosticSeverityOverrides: (_j = config.diagnosticSeverityOverrides) !== null && _j !== void 0 ? _j : {},
            diagnosticFilters: (_k = config.diagnosticFilters) !== null && _k !== void 0 ? _k : [],
            plugins: (_l = config.plugins) !== null && _l !== void 0 ? _l : [],
            pruneEmptyCodeFiles: config.pruneEmptyCodeFiles === true ? true : false,
            autoImportComponentScript: config.autoImportComponentScript === true ? true : false,
            showDiagnosticsInConsole: config.showDiagnosticsInConsole === false ? false : true,
            sourceRoot: config.sourceRoot ? standardizePath(config.sourceRoot) : undefined,
            resolveSourceRoot: config.resolveSourceRoot === true ? true : false,
            allowBrighterScriptInBrightScript: config.allowBrighterScriptInBrightScript === true ? true : false,
            emitDefinitions: config.emitDefinitions === true ? true : false,
            removeParameterTypes: config.removeParameterTypes === true ? true : false,
            logLevel: logLevel,
            bslibDestinationDir: bslibDestinationDir
        };
        //mutate `config` in case anyone is holding a reference to the incomplete one
        const merged = Object.assign(config, configWithDefaults);
        return merged;
    }
    /**
     * Get the root directory from options.
     * Falls back to options.cwd.
     * Falls back to process.cwd
     * @param options a bsconfig object
     */
    getRootDir(options) {
        if (!options) {
            throw new Error('Options is required');
        }
        let cwd = options.cwd;
        cwd = cwd ? cwd : process.cwd();
        let rootDir = options.rootDir ? options.rootDir : cwd;
        rootDir = path.resolve(cwd, rootDir);
        return rootDir;
    }
    /**
     * Given a list of callables as a dictionary indexed by their full name (namespace included, transpiled to underscore-separated.
     */
    getCallableContainersByLowerName(callables) {
        //find duplicate functions
        const result = new Map();
        for (let callableContainer of callables) {
            let lowerName = callableContainer.callable.getName(Parser_1.ParseMode.BrightScript).toLowerCase();
            //create a new array for this name
            const list = result.get(lowerName);
            if (list) {
                list.push(callableContainer);
            }
            else {
                result.set(lowerName, [callableContainer]);
            }
        }
        return result;
    }
    /**
     * Split a file by newline characters (LF or CRLF)
     */
    getLines(text) {
        return text.split(/\r?\n/);
    }
    /**
     * Given an absolute path to a source file, and a target path,
     * compute the pkg path for the target relative to the source file's location
     */
    getPkgPathFromTarget(containingFilePathAbsolute, targetPath) {
        var _a;
        // https://regex101.com/r/w7CG2N/1
        const regexp = /^(?:pkg|libpkg):(\/)?/i;
        const [fullScheme, slash] = (_a = regexp.exec(targetPath)) !== null && _a !== void 0 ? _a : [];
        //if the target starts with 'pkg:' or 'libpkg:' then it's an absolute path. Return as is
        if (slash) {
            targetPath = targetPath.substring(fullScheme.length);
            if (targetPath === '') {
                return null;
            }
            else {
                return path.normalize(targetPath);
            }
        }
        //if the path is exactly `pkg:` or `libpkg:`
        if (targetPath === fullScheme && !slash) {
            return null;
        }
        //remove the filename
        let containingFolder = path.normalize(path.dirname(containingFilePathAbsolute));
        //start with the containing folder, split by slash
        let result = containingFolder.split(path.sep);
        //split on slash
        let targetParts = path.normalize(targetPath).split(path.sep);
        for (let part of targetParts) {
            if (part === '' || part === '.') {
                //do nothing, it means current directory
                continue;
            }
            if (part === '..') {
                //go up one directory
                result.pop();
            }
            else {
                result.push(part);
            }
        }
        return result.join(path.sep);
    }
    /**
     * Compute the relative path from the source file to the target file
     * @param pkgSrcPath  - the absolute path to the source, where cwd is the package location
     * @param pkgTargetPath  - the absolute path to the target, where cwd is the package location
     */
    getRelativePath(pkgSrcPath, pkgTargetPath) {
        pkgSrcPath = path.normalize(pkgSrcPath);
        pkgTargetPath = path.normalize(pkgTargetPath);
        //break by path separator
        let sourceParts = pkgSrcPath.split(path.sep);
        let targetParts = pkgTargetPath.split(path.sep);
        let commonParts = [];
        //find their common root
        for (let i = 0; i < targetParts.length; i++) {
            if (targetParts[i].toLowerCase() === sourceParts[i].toLowerCase()) {
                commonParts.push(targetParts[i]);
            }
            else {
                //we found a non-matching part...so no more commonalities past this point
                break;
            }
        }
        //throw out the common parts from both sets
        sourceParts.splice(0, commonParts.length);
        targetParts.splice(0, commonParts.length);
        //throw out the filename part of source
        sourceParts.splice(sourceParts.length - 1, 1);
        //start out by adding updir paths for each remaining source part
        let resultParts = sourceParts.map(() => '..');
        //now add every target part
        resultParts = [...resultParts, ...targetParts];
        return path.join(...resultParts);
    }
    /**
     * Walks left in a DottedGetExpression and returns a VariableExpression if found, or undefined if not found
     */
    findBeginningVariableExpression(dottedGet) {
        let left = dottedGet;
        while (left) {
            if ((0, reflection_1.isVariableExpression)(left)) {
                return left;
            }
            else if ((0, reflection_1.isDottedGetExpression)(left)) {
                left = left.obj;
            }
            else {
                break;
            }
        }
    }
    /**
     * Do `a` and `b` overlap by at least one character. This returns false if they are at the edges. Here's some examples:
     * ```
     * | true | true | true | true | true | false | false | false | false |
     * |------|------|------|------|------|-------|-------|-------|-------|
     * | aa   |  aaa |  aaa | aaa  |  a   |  aa   |    aa | a     |     a |
     * |  bbb | bb   |  bbb |  b   | bbb  |    bb |  bb   |     b | a     |
     * ```
     */
    rangesIntersect(a, b) {
        //stop if the either range is misisng
        if (!a || !b) {
            return false;
        }
        // Check if `a` is before `b`
        if (a.end.line < b.start.line || (a.end.line === b.start.line && a.end.character <= b.start.character)) {
            return false;
        }
        // Check if `b` is before `a`
        if (b.end.line < a.start.line || (b.end.line === a.start.line && b.end.character <= a.start.character)) {
            return false;
        }
        // These ranges must intersect
        return true;
    }
    /**
     * Do `a` and `b` overlap by at least one character or touch at the edges
     * ```
     * | true | true | true | true | true | true  | true  | false | false |
     * |------|------|------|------|------|-------|-------|-------|-------|
     * | aa   |  aaa |  aaa | aaa  |  a   |  aa   |    aa | a     |     a |
     * |  bbb | bb   |  bbb |  b   | bbb  |    bb |  bb   |     b | a     |
     * ```
     */
    rangesIntersectOrTouch(a, b) {
        //stop if the either range is misisng
        if (!a || !b) {
            return false;
        }
        // Check if `a` is before `b`
        if (a.end.line < b.start.line || (a.end.line === b.start.line && a.end.character < b.start.character)) {
            return false;
        }
        // Check if `b` is before `a`
        if (b.end.line < a.start.line || (b.end.line === a.start.line && b.end.character < a.start.character)) {
            return false;
        }
        // These ranges must intersect
        return true;
    }
    /**
     * Test if `position` is in `range`. If the position is at the edges, will return true.
     * Adapted from core vscode
     */
    rangeContains(range, position) {
        return this.comparePositionToRange(position, range) === 0;
    }
    comparePositionToRange(position, range) {
        //stop if the either range is misisng
        if (!position || !range) {
            return 0;
        }
        if (position.line < range.start.line || (position.line === range.start.line && position.character < range.start.character)) {
            return -1;
        }
        if (position.line > range.end.line || (position.line === range.end.line && position.character > range.end.character)) {
            return 1;
        }
        return 0;
    }
    /**
     * Parse an xml file and get back a javascript object containing its results
     */
    parseXml(text) {
        return new Promise((resolve, reject) => {
            xml2js.parseString(text, (err, data) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(data);
                }
            });
        });
    }
    propertyCount(object) {
        let count = 0;
        for (let key in object) {
            if (object.hasOwnProperty(key)) {
                count++;
            }
        }
        return count;
    }
    padLeft(subject, totalLength, char) {
        totalLength = totalLength > 1000 ? 1000 : totalLength;
        while (subject.length < totalLength) {
            subject = char + subject;
        }
        return subject;
    }
    /**
     * Force the drive letter to lower case
     */
    driveLetterToLower(fullPath) {
        if (fullPath) {
            let firstCharCode = fullPath.charCodeAt(0);
            if (
            //is upper case A-Z
            firstCharCode >= 65 && firstCharCode <= 90 &&
                //next char is colon
                fullPath[1] === ':') {
                fullPath = fullPath[0].toLowerCase() + fullPath.substring(1);
            }
        }
        return fullPath;
    }
    /**
     * Replace the first instance of `search` in `subject` with `replacement`
     */
    replaceCaseInsensitive(subject, search, replacement) {
        let idx = subject.toLowerCase().indexOf(search.toLowerCase());
        if (idx > -1) {
            let result = subject.substring(0, idx) + replacement + subject.substring(idx + search.length);
            return result;
        }
        else {
            return subject;
        }
    }
    /**
     * Determine if two arrays containing primitive values are equal.
     * This considers order and compares by equality.
     */
    areArraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) {
            return false;
        }
        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i] !== arr2[i]) {
                return false;
            }
        }
        return true;
    }
    /**
     * Does the string appear to be a uri (i.e. does it start with `file:`)
     */
    isUriLike(filePath) {
        return (filePath === null || filePath === void 0 ? void 0 : filePath.indexOf('file:')) === 0; // eslint-disable-line @typescript-eslint/prefer-string-starts-ends-with
    }
    /**
     * Given a file path, convert it to a URI string
     */
    pathToUri(filePath) {
        if (!filePath) {
            return filePath;
        }
        else if (this.isUriLike(filePath)) {
            return filePath;
        }
        else {
            return vscode_uri_1.URI.file(filePath).toString();
        }
    }
    /**
     * Given a URI, convert that to a regular fs path
     */
    uriToPath(uri) {
        //if this doesn't look like a URI, then assume it's already a path
        if (this.isUriLike(uri) === false) {
            return uri;
        }
        let parsedPath = vscode_uri_1.URI.parse(uri).fsPath;
        //Uri annoyingly converts all drive letters to lower case...so this will bring back whatever case it came in as
        let match = /\/\/\/([a-z]:)/i.exec(uri);
        if (match) {
            let originalDriveCasing = match[1];
            parsedPath = originalDriveCasing + parsedPath.substring(2);
        }
        const normalizedPath = path.normalize(parsedPath);
        return normalizedPath;
    }
    /**
     * Get the outDir from options, taking into account cwd and absolute outFile paths
     */
    getOutDir(options) {
        options = this.normalizeConfig(options);
        let cwd = path.normalize(options.cwd ? options.cwd : process.cwd());
        if (path.isAbsolute(options.outFile)) {
            return path.dirname(options.outFile);
        }
        else {
            return path.normalize(path.join(cwd, path.dirname(options.outFile)));
        }
    }
    /**
     * Get paths to all files on disc that match this project's source list
     */
    async getFilePaths(options) {
        let rootDir = this.getRootDir(options);
        let files = await roku_deploy_1.rokuDeploy.getFilePaths(options.files, rootDir);
        return files;
    }
    /**
     * Given a path to a brs file, compute the path to a theoretical d.bs file.
     * Only `.brs` files can have typedef path, so return undefined for everything else
     */
    getTypedefPath(brsSrcPath) {
        const typedefPath = brsSrcPath
            .replace(/\.brs$/i, '.d.bs')
            .toLowerCase();
        if (typedefPath.endsWith('.d.bs')) {
            return typedefPath;
        }
        else {
            return undefined;
        }
    }
    /**
     * Determine whether this diagnostic should be supressed or not, based on brs comment-flags
     */
    diagnosticIsSuppressed(diagnostic) {
        var _a, _b;
        const diagnosticCode = typeof diagnostic.code === 'string' ? diagnostic.code.toLowerCase() : diagnostic.code;
        for (let flag of (_b = (_a = diagnostic.file) === null || _a === void 0 ? void 0 : _a.commentFlags) !== null && _b !== void 0 ? _b : []) {
            //this diagnostic is affected by this flag
            if (diagnostic.range && this.rangeContains(flag.affectedRange, diagnostic.range.start)) {
                //if the flag acts upon this diagnostic's code
                if (flag.codes === null || (diagnosticCode !== undefined && flag.codes.includes(diagnosticCode))) {
                    return true;
                }
            }
        }
    }
    /**
     * Walks up the chain to find the closest bsconfig.json file
     */
    async findClosestConfigFile(currentPath) {
        //make the path absolute
        currentPath = path.resolve(path.normalize(currentPath));
        let previousPath;
        //using ../ on the root of the drive results in the same file path, so that's how we know we reached the top
        while (previousPath !== currentPath) {
            previousPath = currentPath;
            let bsPath = path.join(currentPath, 'bsconfig.json');
            let brsPath = path.join(currentPath, 'brsconfig.json');
            if (await this.pathExists(bsPath)) {
                return bsPath;
            }
            else if (await this.pathExists(brsPath)) {
                return brsPath;
            }
            else {
                //walk upwards one directory
                currentPath = path.resolve(path.join(currentPath, '../'));
            }
        }
        //got to the root path, no config file exists
    }
    /**
     * Set a timeout for the specified milliseconds, and resolve the promise once the timeout is finished.
     * @param milliseconds the minimum number of milliseconds to sleep for
     */
    sleep(milliseconds) {
        return new Promise((resolve) => {
            //if milliseconds is 0, don't actually timeout (improves unit test throughput)
            if (milliseconds === 0) {
                process.nextTick(resolve);
            }
            else {
                setTimeout(resolve, milliseconds);
            }
        });
    }
    /**
     * Given an array, map and then flatten
     * @param array the array to flatMap over
     * @param callback a function that is called for every array item
     */
    flatMap(array, callback) {
        return Array.prototype.concat.apply([], array.map(callback));
    }
    /**
     * Determines if the position is greater than the range. This means
     * the position does not touch the range, and has a position greater than the end
     * of the range. A position that touches the last line/char of a range is considered greater
     * than the range, because the `range.end` is EXclusive
     */
    positionIsGreaterThanRange(position, range) {
        //if the position is a higher line than the range
        if (position.line > range.end.line) {
            return true;
        }
        else if (position.line < range.end.line) {
            return false;
        }
        //they are on the same line
        //if the position's char is greater than or equal to the range's
        if (position.character >= range.end.character) {
            return true;
        }
        else {
            return false;
        }
    }
    /**
     * Get a location object back by extracting location information from other objects that contain location
     */
    getRange(startObj, endObj) {
        var _a, _b;
        if (!(startObj === null || startObj === void 0 ? void 0 : startObj.range) || !(endObj === null || endObj === void 0 ? void 0 : endObj.range)) {
            return undefined;
        }
        return exports.util.createRangeFromPositions((_a = startObj.range) === null || _a === void 0 ? void 0 : _a.start, (_b = endObj.range) === null || _b === void 0 ? void 0 : _b.end);
    }
    /**
     * If the two items both start on the same line
     */
    sameStartLine(first, second) {
        if (first && second && (first.range !== undefined) && (second.range !== undefined) &&
            first.range.start.line === second.range.start.line) {
            return true;
        }
        else {
            return false;
        }
    }
    /**
     * If the two items have lines that touch
     */
    linesTouch(first, second) {
        if (first && second && (first.range !== undefined) && (second.range !== undefined) && (first.range.start.line === second.range.start.line ||
            first.range.start.line === second.range.end.line ||
            first.range.end.line === second.range.start.line ||
            first.range.end.line === second.range.end.line)) {
            return true;
        }
        else {
            return false;
        }
    }
    /**
     * Given text with (or without) dots separating text, get the rightmost word.
     * (i.e. given "A.B.C", returns "C". or "B" returns "B because there's no dot)
     */
    getTextAfterFinalDot(name) {
        if (name) {
            let parts = name.split('.');
            if (parts.length > 0) {
                return parts[parts.length - 1];
            }
        }
    }
    /**
     * Find a script import that the current position touches, or undefined if not found
     */
    getScriptImportAtPosition(scriptImports, position) {
        let scriptImport = scriptImports.find((x) => {
            return x.filePathRange &&
                x.filePathRange.start.line === position.line &&
                //column between start and end
                position.character >= x.filePathRange.start.character &&
                position.character <= x.filePathRange.end.character;
        });
        return scriptImport;
    }
    /**
     * Given the class name text, return a namespace-prefixed name.
     * If the name already has a period in it, or the namespaceName was not provided, return the class name as is.
     * If the name does not have a period, and a namespaceName was provided, return the class name prepended by the namespace name.
     * If no namespace is provided, return the `className` unchanged.
     */
    getFullyQualifiedClassName(className, namespaceName) {
        if ((className === null || className === void 0 ? void 0 : className.includes('.')) === false && namespaceName) {
            return `${namespaceName}.${className}`;
        }
        else {
            return className;
        }
    }
    splitIntoLines(string) {
        return string.split(/\r?\n/g);
    }
    getTextForRange(string, range) {
        let lines;
        if (Array.isArray(string)) {
            lines = string;
        }
        else {
            lines = this.splitIntoLines(string);
        }
        const start = range.start;
        const end = range.end;
        let endCharacter = end.character;
        // If lines are the same we need to subtract out our new starting position to make it work correctly
        if (start.line === end.line) {
            endCharacter -= start.character;
        }
        let rangeLines = [lines[start.line].substring(start.character)];
        for (let i = start.line + 1; i <= end.line; i++) {
            rangeLines.push(lines[i]);
        }
        const lastLine = rangeLines.pop();
        if (lastLine !== undefined) {
            rangeLines.push(lastLine.substring(0, endCharacter));
        }
        return rangeLines.join('\n');
    }
    /**
     * Helper for creating `Location` objects. Prefer using this function because vscode-languageserver's `Location.create()` is significantly slower at scale
     */
    createLocation(uri, range) {
        return {
            uri: uri,
            range: range
        };
    }
    /**
     * Helper for creating `Range` objects. Prefer using this function because vscode-languageserver's `Range.create()` is significantly slower
     */
    createRange(startLine, startCharacter, endLine, endCharacter) {
        return {
            start: {
                line: startLine,
                character: startCharacter
            },
            end: {
                line: endLine,
                character: endCharacter
            }
        };
    }
    /**
     * Create a `Range` from two `Position`s
     */
    createRangeFromPositions(startPosition, endPosition) {
        return {
            start: {
                line: startPosition.line,
                character: startPosition.character
            },
            end: {
                line: endPosition.line,
                character: endPosition.character
            }
        };
    }
    /**
     * Clone a range
     */
    cloneRange(range) {
        if (range) {
            return this.createRange(range.start.line, range.start.character, range.end.line, range.end.character);
        }
        else {
            return range;
        }
    }
    /**
     * Clone every token
     */
    cloneToken(token) {
        if (token) {
            const result = {
                kind: token.kind,
                range: this.cloneRange(token.range),
                text: token.text,
                isReserved: token.isReserved,
                leadingWhitespace: token.leadingWhitespace
            };
            //handle those tokens that have charCode
            if ('charCode' in token) {
                result.charCode = token.charCode;
            }
            return result;
        }
        else {
            return token;
        }
    }
    /**
     * Given a list of ranges, create a range that starts with the first non-null lefthand range, and ends with the first non-null
     * righthand range. Returns undefined if none of the items have a range.
     */
    createBoundingRange(...locatables) {
        let leftmostRange;
        let rightmostRange;
        for (let i = 0; i < locatables.length; i++) {
            //set the leftmost non-null-range item
            const left = locatables[i];
            //the range might be a getter, so access it exactly once
            const leftRange = left === null || left === void 0 ? void 0 : left.range;
            if (!leftmostRange && leftRange) {
                leftmostRange = leftRange;
            }
            //set the rightmost non-null-range item
            const right = locatables[locatables.length - 1 - i];
            //the range might be a getter, so access it exactly once
            const rightRange = right === null || right === void 0 ? void 0 : right.range;
            if (!rightmostRange && rightRange) {
                rightmostRange = rightRange;
            }
            //if we have both sides, quit
            if (leftmostRange && rightmostRange) {
                break;
            }
        }
        if (leftmostRange) {
            //if we don't have a rightmost range, use the leftmost range for both the start and end
            return this.createRangeFromPositions(leftmostRange.start, rightmostRange ? rightmostRange.end : leftmostRange.end);
        }
        else {
            return undefined;
        }
    }
    /**
     * Create a `Position` object. Prefer this over `Position.create` for performance reasons
     */
    createPosition(line, character) {
        return {
            line: line,
            character: character
        };
    }
    /**
     * Convert a list of tokens into a string, including their leading whitespace
     */
    tokensToString(tokens) {
        let result = '';
        //skip iterating the final token
        for (let token of tokens) {
            result += token.leadingWhitespace + token.text;
        }
        return result;
    }
    /**
     * Convert a token into a BscType
     */
    tokenToBscType(token, allowCustomType = true) {
        // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
        switch (token.kind) {
            case TokenKind_1.TokenKind.Boolean:
                return new BooleanType_1.BooleanType(token.text);
            case TokenKind_1.TokenKind.True:
            case TokenKind_1.TokenKind.False:
                return new BooleanType_1.BooleanType();
            case TokenKind_1.TokenKind.Double:
                return new DoubleType_1.DoubleType(token.text);
            case TokenKind_1.TokenKind.DoubleLiteral:
                return new DoubleType_1.DoubleType();
            case TokenKind_1.TokenKind.ReplacementIdentifier:
                return new DynamicType_1.DynamicType();
            case TokenKind_1.TokenKind.Dynamic:
                return new DynamicType_1.DynamicType(token.text);
            case TokenKind_1.TokenKind.Float:
                return new FloatType_1.FloatType(token.text);
            case TokenKind_1.TokenKind.FloatLiteral:
                return new FloatType_1.FloatType();
            case TokenKind_1.TokenKind.Function:
                //TODO should there be a more generic function type without a signature that's assignable to all other function types?
                return new FunctionType_1.FunctionType(new DynamicType_1.DynamicType(token.text));
            case TokenKind_1.TokenKind.Integer:
                return new IntegerType_1.IntegerType(token.text);
            case TokenKind_1.TokenKind.IntegerLiteral:
                return new IntegerType_1.IntegerType();
            case TokenKind_1.TokenKind.Invalid:
                return new InvalidType_1.InvalidType(token.text);
            case TokenKind_1.TokenKind.LongInteger:
                return new LongIntegerType_1.LongIntegerType(token.text);
            case TokenKind_1.TokenKind.LongIntegerLiteral:
                return new LongIntegerType_1.LongIntegerType();
            case TokenKind_1.TokenKind.Object:
                return new ObjectType_1.ObjectType(token.text);
            case TokenKind_1.TokenKind.String:
                return new StringType_1.StringType(token.text);
            case TokenKind_1.TokenKind.StringLiteral:
            case TokenKind_1.TokenKind.TemplateStringExpressionBegin:
            case TokenKind_1.TokenKind.TemplateStringExpressionEnd:
            case TokenKind_1.TokenKind.TemplateStringQuasi:
                return new StringType_1.StringType();
            case TokenKind_1.TokenKind.Void:
                return new VoidType_1.VoidType(token.text);
            case TokenKind_1.TokenKind.Identifier:
                switch (token.text.toLowerCase()) {
                    case 'boolean':
                        return new BooleanType_1.BooleanType(token.text);
                    case 'double':
                        return new DoubleType_1.DoubleType(token.text);
                    case 'float':
                        return new FloatType_1.FloatType(token.text);
                    case 'function':
                        return new FunctionType_1.FunctionType(new DynamicType_1.DynamicType(token.text));
                    case 'integer':
                        return new IntegerType_1.IntegerType(token.text);
                    case 'invalid':
                        return new InvalidType_1.InvalidType(token.text);
                    case 'longinteger':
                        return new LongIntegerType_1.LongIntegerType(token.text);
                    case 'object':
                        return new ObjectType_1.ObjectType(token.text);
                    case 'string':
                        return new StringType_1.StringType(token.text);
                    case 'void':
                        return new VoidType_1.VoidType(token.text);
                }
                if (allowCustomType) {
                    return new CustomType_1.CustomType(token.text);
                }
        }
    }
    /**
     * Get the extension for the given file path. Basically the part after the final dot, except for
     * `d.bs` which is treated as single extension
     */
    getExtension(filePath) {
        filePath = filePath.toLowerCase();
        if (filePath.endsWith('.d.bs')) {
            return '.d.bs';
        }
        else {
            const idx = filePath.lastIndexOf('.');
            if (idx > -1) {
                return filePath.substring(idx);
            }
        }
    }
    /**
     * Load and return the list of plugins
     */
    loadPlugins(cwd, pathOrModules, onError) {
        const logger = (0, logging_1.createLogger)();
        return pathOrModules.reduce((acc, pathOrModule) => {
            if (typeof pathOrModule === 'string') {
                try {
                    const loaded = requireRelative(pathOrModule, cwd);
                    const theExport = loaded.default ? loaded.default : loaded;
                    let plugin;
                    // legacy plugins returned a plugin object. If we find that, then add a warning
                    if (typeof theExport === 'object') {
                        logger.warn(`Plugin "${pathOrModule}" was loaded as a singleton. Please contact the plugin author to update to the factory pattern.\n`);
                        plugin = theExport;
                        // the official plugin format is a factory function that returns a new instance of a plugin.
                    }
                    else if (typeof theExport === 'function') {
                        plugin = theExport({
                            version: this.getBrighterScriptVersion()
                        });
                    }
                    else {
                        //this should never happen; somehow an invalid plugin has made it into here
                        throw new Error(`TILT: Encountered an invalid plugin: ${String(plugin)}`);
                    }
                    if (!plugin.name) {
                        plugin.name = pathOrModule;
                    }
                    acc.push(plugin);
                }
                catch (err) {
                    if (onError) {
                        onError(pathOrModule, err);
                    }
                    else {
                        throw err;
                    }
                }
            }
            return acc;
        }, []);
    }
    /**
     * Gathers expressions, variables, and unique names from an expression.
     * This is mostly used for the ternary expression
     */
    getExpressionInfo(expression, file) {
        const expressions = [expression];
        const variableExpressions = [];
        const uniqueVarNames = new Set();
        function expressionWalker(expression) {
            if ((0, reflection_1.isExpression)(expression)) {
                expressions.push(expression);
            }
            if ((0, reflection_1.isVariableExpression)(expression)) {
                variableExpressions.push(expression);
                uniqueVarNames.add(expression.name.text);
            }
        }
        // Collect all expressions. Most of these expressions are fairly small so this should be quick!
        // This should only be called during transpile time and only when we actually need it.
        expression === null || expression === void 0 ? void 0 : expression.walk(expressionWalker, {
            walkMode: visitors_1.WalkMode.visitExpressions
        });
        //handle the expression itself (for situations when expression is a VariableExpression)
        expressionWalker(expression);
        const scope = file.program.getFirstScopeForFile(file);
        let filteredVarNames = [...uniqueVarNames];
        if (scope) {
            filteredVarNames = filteredVarNames.filter((varName) => {
                const varNameLower = varName.toLowerCase();
                // TODO: include namespaces in this filter
                return !scope.getEnumMap().has(varNameLower) &&
                    !scope.getConstMap().has(varNameLower);
            });
        }
        return { expressions: expressions, varExpressions: variableExpressions, uniqueVarNames: filteredVarNames };
    }
    /**
     * Create a SourceNode that maps every line to itself. Useful for creating maps for files
     * that haven't changed at all, but we still need the map
     */
    simpleMap(source, src) {
        //create a source map from the original source code
        let chunks = [];
        let lines = src.split(/\r?\n/g);
        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            let line = lines[lineIndex];
            chunks.push(lineIndex > 0 ? '\n' : '', new source_map_1.SourceNode(lineIndex + 1, 0, source, line));
        }
        return new source_map_1.SourceNode(null, null, source, chunks);
    }
    /**
     * Creates a new SGAttribute object, but keeps the existing Range references (since those shouldn't ever get changed directly)
     */
    cloneSGAttribute(attr, value) {
        return {
            key: {
                text: attr.key.text,
                range: attr.range
            },
            value: {
                text: value,
                range: attr.value.range
            },
            range: attr.range
        };
    }
    /**
     * Converts a path into a standardized format (drive letter to lower, remove extra slashes, use single slash type, resolve relative parts, etc...)
     */
    standardizePath(thePath) {
        //if we have the value in cache already, return it
        if (this.standardizePathCache.has(thePath)) {
            return this.standardizePathCache.get(thePath);
        }
        const originalPath = thePath;
        if (typeof thePath !== 'string') {
            return thePath;
        }
        //windows path.normalize will convert all slashes to backslashes and remove duplicates
        if (this.isWindows) {
            thePath = path.win32.normalize(thePath);
        }
        else {
            //replace all windows or consecutive slashes with path.sep
            thePath = thePath.replace(/[\/\\]+/g, '/');
            // only use path.normalize if dots are present since it's expensive
            if (thePath.includes('./')) {
                thePath = path.posix.normalize(thePath);
            }
        }
        // Lowercase drive letter on Windows-like paths (e.g., "C:/...")
        if (thePath.charCodeAt(1) === 58 /* : */) {
            // eslint-disable-next-line no-var
            var firstChar = thePath.charCodeAt(0);
            if (firstChar >= 65 && firstChar <= 90) {
                thePath = String.fromCharCode(firstChar + 32) + thePath.slice(1);
            }
        }
        this.standardizePathCache.set(originalPath, thePath);
        return thePath;
    }
    /**
     * Copy the version of bslib from local node_modules to the staging folder
     */
    async copyBslibToStaging(stagingDir, bslibDestinationDir = 'source') {
        //copy bslib to the output directory
        await fsExtra.ensureDir(standardizePath(`${stagingDir}/${bslibDestinationDir}`));
        // eslint-disable-next-line
        const bslib = require('@rokucommunity/bslib');
        let source = bslib.source;
        //apply the `bslib_` prefix to the functions
        let match;
        const positions = [];
        const regexp = /^(\s*(?:function|sub)\s+)([a-z0-9_]+)/mg;
        // eslint-disable-next-line no-cond-assign
        while (match = regexp.exec(source)) {
            positions.push(match.index + match[1].length);
        }
        for (let i = positions.length - 1; i >= 0; i--) {
            const position = positions[i];
            source = source.slice(0, position) + 'bslib_' + source.slice(position);
        }
        await fsExtra.writeFile(`${stagingDir}/${bslibDestinationDir}/bslib.brs`, source);
    }
    /**
     * Given a Diagnostic or BsDiagnostic, return a deep clone of the diagnostic.
     * @param diagnostic the diagnostic to clone
     * @param relatedInformationFallbackLocation a default location to use for all `relatedInformation` entries that are missing a location
     */
    toDiagnostic(diagnostic, relatedInformationFallbackLocation) {
        var _a, _b;
        return {
            severity: diagnostic.severity,
            range: diagnostic.range,
            message: diagnostic.message,
            relatedInformation: (_a = diagnostic.relatedInformation) === null || _a === void 0 ? void 0 : _a.map(x => {
                //clone related information just in case a plugin added circular ref info here
                const clone = Object.assign({}, x);
                if (!clone.location) {
                    // use the fallback location if available
                    if (relatedInformationFallbackLocation) {
                        clone.location = exports.util.createLocation(relatedInformationFallbackLocation, diagnostic.range);
                    }
                    else {
                        //remove this related information so it doesn't bring crash the language server
                        return undefined;
                    }
                }
                return clone;
                //filter out null relatedInformation items
            }).filter((x) => Boolean(x)),
            code: diagnostic.code,
            source: (_b = diagnostic.source) !== null && _b !== void 0 ? _b : 'brs'
        };
    }
    /**
     * Get the first locatable item found at the specified position
     * @param locatables an array of items that have a `range` property
     * @param position the position that the locatable must contain
     */
    getFirstLocatableAt(locatables, position) {
        for (let token of locatables) {
            if (exports.util.rangeContains(token.range, position)) {
                return token;
            }
        }
    }
    /**
     * Sort an array of objects that have a Range
     */
    sortByRange(locatables) {
        //sort the tokens by range
        return locatables === null || locatables === void 0 ? void 0 : locatables.sort((a, b) => {
            //start line
            if (a.range.start.line < b.range.start.line) {
                return -1;
            }
            if (a.range.start.line > b.range.start.line) {
                return 1;
            }
            //start char
            if (a.range.start.character < b.range.start.character) {
                return -1;
            }
            if (a.range.start.character > b.range.start.character) {
                return 1;
            }
            //end line
            if (a.range.end.line < b.range.end.line) {
                return -1;
            }
            if (a.range.end.line > b.range.end.line) {
                return 1;
            }
            //end char
            if (a.range.end.character < b.range.end.character) {
                return -1;
            }
            else if (a.range.end.character > b.range.end.character) {
                return 1;
            }
            return 0;
        });
    }
    /**
     * Split the given text and return ranges for each chunk.
     * Only works for single-line strings
     */
    splitGetRange(separator, text, range) {
        const chunks = text.split(separator);
        const result = [];
        let offset = 0;
        for (let chunk of chunks) {
            //only keep nonzero chunks
            if (chunk.length > 0) {
                result.push({
                    text: chunk,
                    range: this.createRange(range.start.line, range.start.character + offset, range.end.line, range.start.character + offset + chunk.length)
                });
            }
            offset += chunk.length + separator.length;
        }
        return result;
    }
    /**
     * Wrap the given code in a markdown code fence (with the language)
     */
    mdFence(code, language = '') {
        return '```' + language + '\n' + code + '\n```';
    }
    /**
     * Gets each part of the dotted get.
     * @param node any ast expression
     * @returns an array of the parts of the dotted get. If not fully a dotted get, then returns undefined
     */
    getAllDottedGetParts(node) {
        const parts = [];
        let nextPart = node;
        while (nextPart) {
            if ((0, reflection_1.isAssignmentStatement)(node)) {
                return [node.name];
            }
            else if ((0, reflection_1.isDottedGetExpression)(nextPart)) {
                parts.push(nextPart === null || nextPart === void 0 ? void 0 : nextPart.name);
                nextPart = nextPart.obj;
            }
            else if ((0, reflection_1.isNamespacedVariableNameExpression)(nextPart)) {
                nextPart = nextPart.expression;
            }
            else if ((0, reflection_1.isVariableExpression)(nextPart)) {
                parts.push(nextPart === null || nextPart === void 0 ? void 0 : nextPart.name);
                break;
            }
            else if ((0, reflection_1.isFunctionParameterExpression)(nextPart)) {
                return [nextPart.name];
            }
            else {
                //we found a non-DottedGet expression, so return because this whole operation is invalid.
                return undefined;
            }
        }
        return parts.reverse();
    }
    /**
     * Break an expression into each part.
     */
    splitExpression(expression) {
        const parts = [expression];
        let nextPart = expression;
        while (nextPart) {
            if ((0, reflection_1.isDottedGetExpression)(nextPart) || (0, reflection_1.isIndexedGetExpression)(nextPart) || (0, reflection_1.isXmlAttributeGetExpression)(nextPart)) {
                nextPart = nextPart.obj;
            }
            else if ((0, reflection_1.isCallExpression)(nextPart) || (0, reflection_1.isCallfuncExpression)(nextPart)) {
                nextPart = nextPart.callee;
            }
            else if ((0, reflection_1.isNamespacedVariableNameExpression)(nextPart)) {
                nextPart = nextPart.expression;
            }
            else {
                break;
            }
            parts.unshift(nextPart);
        }
        return parts;
    }
    /**
     * Break an expression into each part, and return any VariableExpression or DottedGet expresisons from left-to-right.
     */
    getDottedGetPath(expression) {
        let parts = [];
        let nextPart = expression;
        while (nextPart) {
            if ((0, reflection_1.isDottedGetExpression)(nextPart)) {
                parts.unshift(nextPart);
                nextPart = nextPart.obj;
            }
            else if ((0, reflection_1.isIndexedGetExpression)(nextPart) || (0, reflection_1.isXmlAttributeGetExpression)(nextPart)) {
                nextPart = nextPart.obj;
                parts = [];
            }
            else if ((0, reflection_1.isCallExpression)(nextPart) || (0, reflection_1.isCallfuncExpression)(nextPart)) {
                nextPart = nextPart.callee;
                parts = [];
            }
            else if ((0, reflection_1.isNewExpression)(nextPart)) {
                nextPart = nextPart.call.callee;
                parts = [];
            }
            else if ((0, reflection_1.isNamespacedVariableNameExpression)(nextPart)) {
                nextPart = nextPart.expression;
            }
            else if ((0, reflection_1.isVariableExpression)(nextPart)) {
                parts.unshift(nextPart);
                break;
            }
            else {
                parts = [];
                break;
            }
        }
        return parts;
    }
    /**
     * Returns an integer if valid, or undefined. Eliminates checking for NaN
     */
    parseInt(value) {
        const result = parseInt(value);
        if (!isNaN(result)) {
            return result;
        }
        else {
            return undefined;
        }
    }
    /**
     * Converts a range to a string in the format 1:2-3:4
     */
    rangeToString(range) {
        var _a, _b, _c, _d;
        return `${(_a = range === null || range === void 0 ? void 0 : range.start) === null || _a === void 0 ? void 0 : _a.line}:${(_b = range === null || range === void 0 ? void 0 : range.start) === null || _b === void 0 ? void 0 : _b.character}-${(_c = range === null || range === void 0 ? void 0 : range.end) === null || _c === void 0 ? void 0 : _c.line}:${(_d = range === null || range === void 0 ? void 0 : range.end) === null || _d === void 0 ? void 0 : _d.character}`;
    }
    validateTooDeepFile(file) {
        var _a;
        //find any files nested too deep
        let pkgPath = (_a = file.pkgPath) !== null && _a !== void 0 ? _a : file.pkgPath.toString();
        let rootFolder = pkgPath.replace(/^pkg:/, '').split(/[\\\/]/)[0].toLowerCase();
        if ((0, reflection_1.isBrsFile)(file) && rootFolder !== 'source') {
            return;
        }
        if ((0, reflection_1.isXmlFile)(file) && rootFolder !== 'components') {
            return;
        }
        let fileDepth = this.getParentDirectoryCount(pkgPath);
        if (fileDepth >= 8) {
            file.addDiagnostics([Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.detectedTooDeepFileSource(fileDepth)), { file: file, range: this.createRange(0, 0, 0, Number.MAX_VALUE) })]);
        }
    }
    /**
     * Execute dispose for a series of disposable items
     * @param disposables a list of functions or disposables
     */
    applyDispose(disposables) {
        var _a;
        for (const disposable of disposables !== null && disposables !== void 0 ? disposables : []) {
            if (typeof disposable === 'function') {
                disposable();
            }
            else {
                (_a = disposable === null || disposable === void 0 ? void 0 : disposable.dispose) === null || _a === void 0 ? void 0 : _a.call(disposable);
            }
        }
    }
    /**
     * Race a series of promises, and return the first one that resolves AND matches the matcher function.
     * If all of the promises reject, then this will emit an AggregatreError with all of the errors.
     * If at least one promise resolves, then this will log all of the errors to the console
     * If at least one promise resolves but none of them match the matcher, then this will return undefined.
     * @param promises all of the promises to race
     * @param matcher a function that should return true if this value should be kept. Returning any value other than true means `false`
     * @returns the first resolved value that matches the matcher, or undefined if none of them match
     */
    async promiseRaceMatch(promises, matcher) {
        const workingPromises = [
            ...promises
        ];
        const results = [];
        let returnValue;
        while (workingPromises.length > 0) {
            //race the promises. If any of them resolve, evaluate it against the matcher. If that passes, return the value. otherwise, eliminate this promise and try again
            const result = await Promise.race(workingPromises.map((promise, i) => {
                return Promise.resolve(promise)
                    .then(value => ({ value: value, index: i }))
                    .catch(error => ({ error: error, index: i }));
            }));
            results.push(result);
            //if we got a value and it matches the matcher, return it
            if ('value' in result && (matcher === null || matcher === void 0 ? void 0 : matcher(result.value)) === true) {
                returnValue = result.value;
                break;
            }
            //remove this non-matched (or errored) promise from the list and try again
            workingPromises.splice(result.index, 1);
        }
        const errors = results
            .filter(x => 'error' in x)
            .map(x => x.error);
        //if all of them crashed, then reject
        if (promises.length > 0 && errors.length === promises.length) {
            throw new AggregateError(errors, 'All requests failed. First error message: ' + errors[0].message);
        }
        else {
            //log all of the errors
            for (const error of errors) {
                console.error(error);
            }
        }
        //return the matched value, or undefined if there wasn't one
        return returnValue;
    }
    /**
     * Wraps SourceNode's constructor to be compatible with the TranspileResult type
     */
    sourceNodeFromTranspileResult(line, column, source, chunks, name) {
        // we can use a typecast rather than actually transforming the data because SourceNode
        // accepts a more permissive type than its typedef states
        return new source_map_1.SourceNode(line, column, source, chunks, name);
    }
    isBuiltInType(typeName) {
        const typeNameLower = typeName.toLowerCase();
        if (typeNameLower.startsWith('rosgnode')) {
            // NOTE: this is unsafe and only used to avoid validation errors in backported v1 type syntax
            return true;
        }
        return roku_types_1.components[typeNameLower] || roku_types_1.interfaces[typeNameLower] || roku_types_1.events[typeNameLower];
    }
    /**
     * Get a short name that can be used to reference the project in logs. (typically something like `prj1`, `prj8`, etc...)
     */
    getProjectLogName(config) {
        //if we have a project number, use it
        if ((config === null || config === void 0 ? void 0 : config.projectNumber) !== undefined) {
            return `prj${config.projectNumber}`;
        }
        //just return empty string so log functions don't crash with undefined project numbers
        return '';
    }
}
exports.Util = Util;
/**
 * A tagged template literal function for standardizing the path. This has to be defined as standalone function since it's a tagged template literal function,
 * we can't use `object.tag` syntax.
 */
function standardizePath(stringParts, ...expressions) {
    let result = [];
    for (let i = 0; i < (stringParts === null || stringParts === void 0 ? void 0 : stringParts.length); i++) {
        result.push(stringParts[i], expressions[i]);
    }
    return exports.util.standardizePath(result.join(''));
}
exports.standardizePath = standardizePath;
exports.util = new Util();
exports.default = exports.util;
//# sourceMappingURL=util.js.map
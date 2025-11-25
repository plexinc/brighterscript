"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scope = void 0;
const path = require("path");
const vscode_languageserver_1 = require("vscode-languageserver");
const chalk_1 = require("chalk");
const DiagnosticMessages_1 = require("./DiagnosticMessages");
const ClassValidator_1 = require("./validators/ClassValidator");
const Parser_1 = require("./parser/Parser");
const util_1 = require("./util");
const globalCallables_1 = require("./globalCallables");
const Cache_1 = require("./Cache");
const vscode_uri_1 = require("vscode-uri");
const reflection_1 = require("./astUtils/reflection");
const SymbolTable_1 = require("./SymbolTable");
const logging_1 = require("./logging");
/**
 * A class to keep track of all declarations within a given scope (like source scope, component scope)
 */
class Scope {
    constructor(name, program, _dependencyGraphKey) {
        this.name = name;
        this.program = program;
        this._dependencyGraphKey = _dependencyGraphKey;
        this.cache = new Cache_1.Cache();
        /**
         * The list of diagnostics found specifically for this scope. Individual file diagnostics are stored on the files themselves.
         */
        this.diagnostics = [];
        this.isValidated = false;
        //used for improved logging performance
        this._debugLogComponentName = `Scope '${chalk_1.default.redBright(this.name)}'`;
    }
    get dependencyGraphKey() {
        return this._dependencyGraphKey;
    }
    /**
     * A dictionary of namespaces, indexed by the lower case full name of each namespace.
     * If a namespace is declared as "NameA.NameB.NameC", there will be 3 entries in this dictionary,
     * "namea", "namea.nameb", "namea.nameb.namec"
     */
    get namespaceLookup() {
        return this.cache.getOrAdd('namespaceLookup', () => this.buildNamespaceLookup());
    }
    /**
     * Get a NamespaceContainer by its name, looking for a fully qualified version first, then global version next if not found
     */
    getNamespace(name, containingNamespace) {
        const nameLower = name === null || name === void 0 ? void 0 : name.toLowerCase();
        const lookup = this.namespaceLookup;
        let ns;
        if (containingNamespace) {
            ns = lookup.get(`${containingNamespace === null || containingNamespace === void 0 ? void 0 : containingNamespace.toLowerCase()}.${nameLower}`);
        }
        //if we couldn't find the namespace by its full namespaced name, look for a global version
        if (!ns) {
            ns = lookup.get(nameLower);
        }
        return ns;
    }
    /**
     * Get the class with the specified name.
     * @param className - The class name, including the namespace of the class if possible
     * @param containingNamespace - The namespace used to resolve relative class names. (i.e. the namespace around the current statement trying to find a class)
     */
    getClass(className, containingNamespace) {
        var _a;
        return (_a = this.getClassFileLink(className, containingNamespace)) === null || _a === void 0 ? void 0 : _a.item;
    }
    /**
     * Get the interface with the specified name.
     * @param ifaceName - The interface name, including the namespace of the interface if possible
     * @param containingNamespace - The namespace used to resolve relative interface names. (i.e. the namespace around the current statement trying to find a interface)
     */
    getInterface(ifaceName, containingNamespace) {
        var _a;
        return (_a = this.getInterfaceFileLink(ifaceName, containingNamespace)) === null || _a === void 0 ? void 0 : _a.item;
    }
    /**
     * Get the enum with the specified name.
     * @param enumName - The enum name, including the namespace if possible
     * @param containingNamespace - The namespace used to resolve relative enum names. (i.e. the namespace around the current statement trying to find an enum)
     */
    getEnum(enumName, containingNamespace) {
        var _a;
        return (_a = this.getEnumFileLink(enumName, containingNamespace)) === null || _a === void 0 ? void 0 : _a.item;
    }
    /**
     * Get a class and its containing file by the class name
     * @param className - The class name, including the namespace of the class if possible
     * @param containingNamespace - The namespace used to resolve relative class names. (i.e. the namespace around the current statement trying to find a class)
     */
    getClassFileLink(className, containingNamespace) {
        const lowerClassName = className === null || className === void 0 ? void 0 : className.toLowerCase();
        const classMap = this.getClassMap();
        let cls = classMap.get(util_1.util.getFullyQualifiedClassName(lowerClassName, containingNamespace === null || containingNamespace === void 0 ? void 0 : containingNamespace.toLowerCase()));
        //if we couldn't find the class by its full namespaced name, look for a global class with that name
        if (!cls) {
            cls = classMap.get(lowerClassName);
        }
        return cls;
    }
    /**
     * Get an interface and its containing file by the interface name
     * @param ifaceName - The interface name, including the namespace of the interface if possible
     * @param containingNamespace - The namespace used to resolve relative interface names. (i.e. the namespace around the current statement trying to find a interface)
     */
    getInterfaceFileLink(ifaceName, containingNamespace) {
        const lowerName = ifaceName === null || ifaceName === void 0 ? void 0 : ifaceName.toLowerCase();
        const ifaceMap = this.getInterfaceMap();
        let iface = ifaceMap.get(util_1.util.getFullyQualifiedClassName(lowerName, containingNamespace === null || containingNamespace === void 0 ? void 0 : containingNamespace.toLowerCase()));
        //if we couldn't find the iface by its full namespaced name, look for a global class with that name
        if (!iface) {
            iface = ifaceMap.get(lowerName);
        }
        return iface;
    }
    /**
     * Get an Enum and its containing file by the Enum name
     * @param enumName - The Enum name, including the namespace of the enum if possible
     * @param containingNamespace - The namespace used to resolve relative enum names. (i.e. the namespace around the current statement trying to find a enum)
     */
    getEnumFileLink(enumName, containingNamespace) {
        const lowerName = enumName === null || enumName === void 0 ? void 0 : enumName.toLowerCase();
        const enumMap = this.getEnumMap();
        let enumeration = enumMap.get(util_1.util.getFullyQualifiedClassName(lowerName, containingNamespace === null || containingNamespace === void 0 ? void 0 : containingNamespace.toLowerCase()));
        //if we couldn't find the enum by its full namespaced name, look for a global enum with that name
        if (!enumeration) {
            enumeration = enumMap.get(lowerName);
        }
        return enumeration;
    }
    /**
     * Get an Enum and its containing file by the Enum name
     * @param enumMemberName - The Enum name, including the namespace of the enum if possible
     * @param containingNamespace - The namespace used to resolve relative enum names. (i.e. the namespace around the current statement trying to find a enum)
     */
    getEnumMemberFileLink(enumMemberName, containingNamespace) {
        var _a, _b;
        let lowerNameParts = (_a = enumMemberName === null || enumMemberName === void 0 ? void 0 : enumMemberName.toLowerCase()) === null || _a === void 0 ? void 0 : _a.split('.');
        let memberName = (_b = lowerNameParts === null || lowerNameParts === void 0 ? void 0 : lowerNameParts.splice(lowerNameParts.length - 1, 1)) === null || _b === void 0 ? void 0 : _b[0];
        let lowerName = lowerNameParts === null || lowerNameParts === void 0 ? void 0 : lowerNameParts.join('.').toLowerCase();
        const enumMap = this.getEnumMap();
        let enumeration = enumMap.get(util_1.util.getFullyQualifiedClassName(lowerName, containingNamespace === null || containingNamespace === void 0 ? void 0 : containingNamespace.toLowerCase()));
        //if we couldn't find the enum by its full namespaced name, look for a global enum with that name
        if (!enumeration) {
            enumeration = enumMap.get(lowerName);
        }
        if (enumeration) {
            let member = enumeration.item.findChild((child) => { var _a; return (0, reflection_1.isEnumMemberStatement)(child) && ((_a = child.name) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === memberName; });
            return member ? { item: member, file: enumeration.file } : undefined;
        }
    }
    /**
     * Get a constant and its containing file by the constant name
     * @param constName - The constant name, including the namespace of the constant if possible
     * @param containingNamespace - The namespace used to resolve relative constant names. (i.e. the namespace around the current statement trying to find a constant)
     */
    getConstFileLink(constName, containingNamespace) {
        const lowerName = constName === null || constName === void 0 ? void 0 : constName.toLowerCase();
        const constMap = this.getConstMap();
        let result = constMap.get(util_1.util.getFullyQualifiedClassName(lowerName, containingNamespace === null || containingNamespace === void 0 ? void 0 : containingNamespace.toLowerCase()));
        //if we couldn't find the constant by its full namespaced name, look for a global constant with that name
        if (!result) {
            result = constMap.get(lowerName);
        }
        return result;
    }
    /**
     * Get a map of all enums by their member name.
     * The keys are lower-case fully-qualified paths to the enum and its member. For example:
     * namespace.enum.value
     */
    getEnumMemberMap() {
        return this.cache.getOrAdd('enumMemberMap', () => {
            const result = new Map();
            for (const [key, eenum] of this.getEnumMap()) {
                for (const member of eenum.item.getMembers()) {
                    result.set(`${key}.${member.name.toLowerCase()}`, member);
                }
            }
            return result;
        });
    }
    /**
     * Tests if a class exists with the specified name
     * @param className - the all-lower-case namespace-included class name
     * @param namespaceName - The namespace used to resolve relative class names. (i.e. the namespace around the current statement trying to find a class)
     */
    hasClass(className, namespaceName) {
        return !!this.getClass(className, namespaceName);
    }
    /**
     * Tests if an interface exists with the specified name
     * @param ifaceName - the all-lower-case namespace-included interface name
     * @param namespaceName - the current namespace name
     */
    hasInterface(ifaceName, namespaceName) {
        return !!this.getInterface(ifaceName, namespaceName);
    }
    /**
     * Tests if an enum exists with the specified name
     * @param enumName - the all-lower-case namespace-included enum name
     * @param namespaceName - the current namespace name
     */
    hasEnum(enumName, namespaceName) {
        return !!this.getEnum(enumName, namespaceName);
    }
    /**
     * A dictionary of all classes in this scope. This includes namespaced classes always with their full name.
     * The key is stored in lower case
     */
    getClassMap() {
        return this.cache.getOrAdd('classMap', () => {
            const map = new Map();
            this.enumerateBrsFiles((file) => {
                var _a;
                if ((0, reflection_1.isBrsFile)(file)) {
                    for (let cls of file.parser.references.classStatements) {
                        const lowerClassName = (_a = cls.getName(Parser_1.ParseMode.BrighterScript)) === null || _a === void 0 ? void 0 : _a.toLowerCase();
                        //only track classes with a defined name (i.e. exclude nameless malformed classes)
                        if (lowerClassName) {
                            map.set(lowerClassName, { item: cls, file: file });
                        }
                    }
                }
            });
            return map;
        });
    }
    /**
     * A dictionary of all Interfaces in this scope. This includes namespaced Interfaces always with their full name.
     * The key is stored in lower case
     */
    getInterfaceMap() {
        return this.cache.getOrAdd('interfaceMap', () => {
            const map = new Map();
            this.enumerateBrsFiles((file) => {
                var _a;
                if ((0, reflection_1.isBrsFile)(file)) {
                    for (let iface of file.parser.references.interfaceStatements) {
                        const lowerIfaceName = (_a = iface.getName(Parser_1.ParseMode.BrighterScript)) === null || _a === void 0 ? void 0 : _a.toLowerCase();
                        //only track classes with a defined name (i.e. exclude nameless malformed classes)
                        if (lowerIfaceName) {
                            map.set(lowerIfaceName, { item: iface, file: file });
                        }
                    }
                }
            });
            return map;
        });
    }
    /**
     * A dictionary of all enums in this scope. This includes namespaced enums always with their full name.
     * The key is stored in lower case
     */
    getEnumMap() {
        return this.cache.getOrAdd('enumMap', () => {
            const map = new Map();
            this.enumerateBrsFiles((file) => {
                for (let enumStmt of file.parser.references.enumStatements) {
                    const lowerEnumName = enumStmt.fullName.toLowerCase();
                    //only track enums with a defined name (i.e. exclude nameless malformed enums)
                    if (lowerEnumName) {
                        map.set(lowerEnumName, { item: enumStmt, file: file });
                    }
                }
            });
            return map;
        });
    }
    /**
     * A dictionary of all constants in this scope. This includes namespaced constants always with their full name.
     * The key is stored in lower case
     */
    getConstMap() {
        return this.cache.getOrAdd('constMap', () => {
            const map = new Map();
            this.enumerateBrsFiles((file) => {
                for (let stmt of file.parser.references.constStatements) {
                    const lowerEnumName = stmt.fullName.toLowerCase();
                    //only track enums with a defined name (i.e. exclude nameless malformed enums)
                    if (lowerEnumName) {
                        map.set(lowerEnumName, { item: stmt, file: file });
                    }
                }
            });
            return map;
        });
    }
    onDependenciesChanged(event) {
        this.logDebug('invalidated because dependency graph said [', event.sourceKey, '] changed');
        this.invalidate();
    }
    /**
     * Clean up all event handles
     */
    dispose() {
        var _a;
        (_a = this.unsubscribeFromDependencyGraph) === null || _a === void 0 ? void 0 : _a.call(this);
    }
    /**
     * Does this scope know about the given namespace name?
     * @param namespaceName - the name of the namespace (i.e. "NameA", or "NameA.NameB", etc...)
     */
    isKnownNamespace(namespaceName) {
        let namespaceNameLower = namespaceName.toLowerCase();
        this.enumerateBrsFiles((file) => {
            for (let namespace of file.parser.references.namespaceStatements) {
                let loopNamespaceNameLower = namespace.name.toLowerCase();
                if (loopNamespaceNameLower === namespaceNameLower || loopNamespaceNameLower.startsWith(namespaceNameLower + '.')) {
                    return true;
                }
            }
        });
        return false;
    }
    /**
     * Get the parent scope for this scope (for source scope this will always be the globalScope).
     * XmlScope overrides this to return the parent xml scope if available.
     * For globalScope this will return null.
     */
    getParentScope() {
        let scope;
        //use the global scope if we didn't find a sope and this is not the global scope
        if (this.program.globalScope !== this) {
            scope = this.program.globalScope;
        }
        if (scope) {
            return scope;
        }
        else {
            //passing null to the cache allows it to skip the factory function in the future
            return null;
        }
    }
    attachDependencyGraph(dependencyGraph) {
        this.dependencyGraph = dependencyGraph;
        if (this.unsubscribeFromDependencyGraph) {
            this.unsubscribeFromDependencyGraph();
        }
        //anytime a dependency for this scope changes, we need to be revalidated
        this.unsubscribeFromDependencyGraph = this.dependencyGraph.onchange(this.dependencyGraphKey, this.onDependenciesChanged.bind(this));
        //invalidate immediately since this is a new scope
        this.invalidate();
    }
    /**
     * Get the file from this scope with the given path.
     * @param filePath can be a srcPath or pkgPath
     * @param normalizePath should this function repair and standardize the path? Passing false should have a performance boost if you can guarantee your path is already sanitized
     */
    getFile(filePath, normalizePath = true) {
        if (typeof filePath !== 'string') {
            return undefined;
        }
        const key = path.isAbsolute(filePath) ? 'srcPath' : 'pkgPath';
        let map = this.cache.getOrAdd('fileMaps-srcPath', () => {
            const result = new Map();
            for (const file of this.getAllFiles()) {
                result.set(file[key].toLowerCase(), file);
            }
            return result;
        });
        return map.get((normalizePath ? util_1.util.standardizePath(filePath) : filePath).toLowerCase());
    }
    /**
     * Get the list of files referenced by this scope that are actually loaded in the program.
     * Excludes files from ancestor scopes
     */
    getOwnFiles() {
        //source scope only inherits files from global, so just return all files. This function mostly exists to assist XmlScope
        return this.getAllFiles();
    }
    /**
     * Get the list of files referenced by this scope that are actually loaded in the program.
     * Includes files from this scope and all ancestor scopes
     */
    getAllFiles() {
        return this.cache.getOrAdd('getAllFiles', () => {
            let result = [];
            let dependencies = this.dependencyGraph.getAllDependencies(this.dependencyGraphKey);
            for (let dependency of dependencies) {
                //load components by their name
                if (dependency.startsWith('component:')) {
                    let comp = this.program.getComponent(dependency.replace(/$component:/, ''));
                    if (comp) {
                        result.push(comp.file);
                    }
                }
                else {
                    let file = this.program.getFile(dependency);
                    if (file) {
                        result.push(file);
                    }
                }
            }
            this.logDebug('getAllFiles', () => result.map(x => x.pkgPath));
            return result;
        });
    }
    /**
     * Get the list of errors for this scope. It's calculated on the fly, so
     * call this sparingly.
     */
    getDiagnostics() {
        let diagnosticLists = [this.diagnostics];
        //add diagnostics from every referenced file
        this.enumerateOwnFiles((file) => {
            diagnosticLists.push(file.getDiagnostics());
        });
        let allDiagnostics = Array.prototype.concat.apply([], diagnosticLists);
        let filteredDiagnostics = allDiagnostics.filter((x) => {
            return !util_1.util.diagnosticIsSuppressed(x);
        });
        //filter out diangostics that match any of the comment flags
        return filteredDiagnostics;
    }
    addDiagnostics(diagnostics) {
        this.diagnostics.push(...diagnostics);
    }
    /**
     * Get the list of callables available in this scope (either declared in this scope or in a parent scope)
     */
    getAllCallables() {
        //get callables from parent scopes
        let parentScope = this.getParentScope();
        if (parentScope) {
            return [...this.getOwnCallables(), ...parentScope.getAllCallables()];
        }
        else {
            return [...this.getOwnCallables()];
        }
    }
    /**
     * Get the callable with the specified name.
     * If there are overridden callables with the same name, the closest callable to this scope is returned
     */
    getCallableByName(name) {
        return this.getCallableMap().get(name.toLowerCase());
    }
    getCallableMap() {
        return this.cache.getOrAdd('callableMap', () => {
            var _a, _b;
            const result = new Map();
            for (let callable of this.getAllCallables()) {
                const callableName = (_a = callable.callable.getName(Parser_1.ParseMode.BrighterScript)) === null || _a === void 0 ? void 0 : _a.toLowerCase();
                result.set(callableName, callable.callable);
                result.set(
                // Split by `.` and check the last term to consider namespaces.
                (_b = callableName.split('.').pop()) === null || _b === void 0 ? void 0 : _b.toLowerCase(), callable.callable);
            }
            return result;
        });
    }
    /**
     * Iterate over Brs files not shadowed by typedefs
     */
    enumerateBrsFiles(callback) {
        const files = this.getAllFiles();
        for (const file of files) {
            //only brs files without a typedef
            if ((0, reflection_1.isBrsFile)(file) && !file.hasTypedef) {
                callback(file);
            }
        }
    }
    /**
     * Call a function for each file directly included in this scope (excluding files found only in parent scopes).
     */
    enumerateOwnFiles(callback) {
        const files = this.getOwnFiles();
        for (const file of files) {
            //either XML components or files without a typedef
            if ((0, reflection_1.isXmlFile)(file) || !file.hasTypedef) {
                callback(file);
            }
        }
    }
    /**
     * Get the list of callables explicitly defined in files in this scope.
     * This excludes ancestor callables
     */
    getOwnCallables() {
        let result = [];
        this.logDebug('getOwnCallables() files: ', () => this.getOwnFiles().map(x => x.pkgPath));
        //get callables from own files
        this.enumerateOwnFiles((file) => {
            var _a;
            for (let callable of (_a = file === null || file === void 0 ? void 0 : file.callables) !== null && _a !== void 0 ? _a : []) {
                result.push({
                    callable: callable,
                    scope: this
                });
            }
        });
        return result;
    }
    /**
     * Builds a tree of namespace objects
     */
    buildNamespaceLookup() {
        let namespaceLookup = new Map();
        this.enumerateBrsFiles((file) => {
            for (let namespaceStatement of file.parser.references.namespaceStatements) {
                //TODO should we handle non-brighterscript?
                let name = namespaceStatement.getName(Parser_1.ParseMode.BrighterScript);
                let nameParts = name.split('.');
                let loopName = null;
                //ensure each namespace section is represented in the results
                //(so if the namespace name is A.B.C, this will make an entry for "A", an entry for "A.B", and an entry for "A.B.C"
                for (let part of nameParts) {
                    loopName = loopName === null ? part : `${loopName}.${part}`;
                    let lowerLoopName = loopName.toLowerCase();
                    if (!namespaceLookup.has(lowerLoopName)) {
                        namespaceLookup.set(lowerLoopName, {
                            file: file,
                            fullName: loopName,
                            nameRange: namespaceStatement.nameExpression.range,
                            lastPartName: part,
                            namespaces: new Map(),
                            classStatements: {},
                            functionStatements: {},
                            enumStatements: new Map(),
                            constStatements: new Map(),
                            statements: [],
                            symbolTable: new SymbolTable_1.SymbolTable(`Namespace Aggregate: '${loopName}'`, () => this.symbolTable)
                        });
                    }
                }
                let ns = namespaceLookup.get(name.toLowerCase());
                ns.statements.push(...namespaceStatement.body.statements);
                for (let statement of namespaceStatement.body.statements) {
                    if ((0, reflection_1.isClassStatement)(statement) && statement.name) {
                        ns.classStatements[statement.name.text.toLowerCase()] = statement;
                    }
                    else if ((0, reflection_1.isFunctionStatement)(statement) && statement.name) {
                        ns.functionStatements[statement.name.text.toLowerCase()] = statement;
                    }
                    else if ((0, reflection_1.isEnumStatement)(statement) && statement.fullName) {
                        ns.enumStatements.set(statement.fullName.toLowerCase(), statement);
                    }
                    else if ((0, reflection_1.isConstStatement)(statement) && statement.fullName) {
                        ns.constStatements.set(statement.fullName.toLowerCase(), statement);
                    }
                }
                // Merges all the symbol tables of the namespace statements into the new symbol table created above.
                // Set those symbol tables to have this new merged table as a parent
                ns.symbolTable.mergeSymbolTable(namespaceStatement.body.getSymbolTable());
            }
            //associate child namespaces with their parents
            for (let [, ns] of namespaceLookup) {
                let parts = ns.fullName.split('.');
                if (parts.length > 1) {
                    //remove the last part
                    parts.pop();
                    let parentName = parts.join('.');
                    const parent = namespaceLookup.get(parentName.toLowerCase());
                    parent.namespaces.set(ns.lastPartName.toLowerCase(), ns);
                }
            }
        });
        return namespaceLookup;
    }
    getAllNamespaceStatements() {
        let result = [];
        this.enumerateBrsFiles((file) => {
            result.push(...file.parser.references.namespaceStatements);
        });
        return result;
    }
    logDebug(...args) {
        this.program.logger.debug(this._debugLogComponentName, ...args);
    }
    validate(force = false) {
        //if this scope is already validated, no need to revalidate
        if (this.isValidated === true && !force) {
            this.logDebug('validate(): already validated');
            return;
        }
        this.program.logger.time(logging_1.LogLevel.debug, [this._debugLogComponentName, 'validate()'], () => {
            let parentScope = this.getParentScope();
            //validate our parent before we validate ourself
            if (parentScope && parentScope.isValidated === false) {
                this.logDebug('validate(): validating parent first');
                parentScope.validate(force);
            }
            //clear the scope's errors list (we will populate them from this method)
            this.diagnostics = [];
            let callables = this.getAllCallables();
            //sort the callables by filepath and then method name, so the errors will be consistent
            // eslint-disable-next-line prefer-arrow-callback
            callables = callables.sort((a, b) => {
                const pathA = a.callable.file.srcPath;
                const pathB = b.callable.file.srcPath;
                //sort by path
                if (pathA < pathB) {
                    return -1;
                }
                else if (pathA > pathB) {
                    return 1;
                }
                //sort by function name
                const funcA = b.callable.name;
                const funcB = b.callable.name;
                if (funcA < funcB) {
                    return -1;
                }
                else if (funcA > funcB) {
                    return 1;
                }
                return 0;
            });
            //get a list of all callables, indexed by their lower case names
            let callableContainerMap = util_1.util.getCallableContainersByLowerName(callables);
            let files = this.getOwnFiles();
            //Since statements from files are shared across multiple scopes, we need to link those statements to the current scope
            this.linkSymbolTable();
            this.program.plugins.emit('beforeScopeValidate', this, files, callableContainerMap);
            this.program.plugins.emit('onScopeValidate', {
                program: this.program,
                scope: this
            });
            this._validate(callableContainerMap);
            this.program.plugins.emit('afterScopeValidate', this, files, callableContainerMap);
            //unlink all symbol tables from this scope (so they don't accidentally stick around)
            this.unlinkSymbolTable();
            this.isValidated = true;
        });
    }
    _validate(callableContainerMap) {
        //find all duplicate function declarations
        this.diagnosticFindDuplicateFunctionDeclarations(callableContainerMap);
        //detect missing and incorrect-case script imports
        this.diagnosticValidateScriptImportPaths();
        //enforce a series of checks on the bodies of class methods
        this.validateClasses();
        //do many per-file checks
        this.enumerateBrsFiles((file) => {
            this.diagnosticDetectFunctionCallsWithWrongParamCount(file, callableContainerMap);
            this.diagnosticDetectShadowedLocalVars(file, callableContainerMap);
            this.diagnosticDetectFunctionCollisions(file);
            this.detectVariableNamespaceCollisions(file);
            this.diagnosticDetectInvalidFunctionExpressionTypes(file);
        });
    }
    /**
     * Mark this scope as invalid, which means its `validate()` function needs to be called again before use.
     */
    invalidate() {
        this.isValidated = false;
        //clear out various lookups (they'll get regenerated on demand the next time they're requested)
        this.cache.clear();
    }
    get symbolTable() {
        return this.cache.getOrAdd('symbolTable', () => {
            var _a;
            const result = new SymbolTable_1.SymbolTable(`Scope: '${this.name}'`, () => { var _a; return (_a = this.getParentScope()) === null || _a === void 0 ? void 0 : _a.symbolTable; });
            for (let file of this.getOwnFiles()) {
                if ((0, reflection_1.isBrsFile)(file)) {
                    result.mergeSymbolTable((_a = file.parser) === null || _a === void 0 ? void 0 : _a.symbolTable);
                }
            }
            return result;
        });
    }
    /**
     * Builds the current symbol table for the scope, by merging the tables for all the files in this scope.
     * Also links all file symbols tables to this new table
     * This will only rebuilt if the symbol table has not been built before
     */
    linkSymbolTable() {
        for (const file of this.getAllFiles()) {
            if ((0, reflection_1.isBrsFile)(file)) {
                file.parser.symbolTable.pushParentProvider(() => this.symbolTable);
                //link each NamespaceStatement's SymbolTable with the aggregate NamespaceLookup SymbolTable
                for (const namespace of file.parser.references.namespaceStatements) {
                    const namespaceNameLower = namespace.getName(Parser_1.ParseMode.BrighterScript).toLowerCase();
                    namespace.getSymbolTable().addSibling(this.namespaceLookup.get(namespaceNameLower).symbolTable);
                }
            }
        }
    }
    unlinkSymbolTable() {
        var _a;
        for (let file of this.getOwnFiles()) {
            if ((0, reflection_1.isBrsFile)(file)) {
                (_a = file.parser) === null || _a === void 0 ? void 0 : _a.symbolTable.popParentProvider();
                for (const namespace of file.parser.references.namespaceStatements) {
                    const namespaceNameLower = namespace.getName(Parser_1.ParseMode.BrighterScript).toLowerCase();
                    namespace.getSymbolTable().removeSibling(this.namespaceLookup.get(namespaceNameLower).symbolTable);
                }
            }
        }
    }
    detectVariableNamespaceCollisions(file) {
        var _a, _b;
        //find all function parameters
        for (let func of file.parser.references.functionExpressions) {
            for (let param of func.parameters) {
                let lowerParamName = param.name.text.toLowerCase();
                let namespace = this.getNamespace(lowerParamName, (_a = param.findAncestor(reflection_1.isNamespaceStatement)) === null || _a === void 0 ? void 0 : _a.getName(Parser_1.ParseMode.BrighterScript).toLowerCase());
                //see if the param matches any starting namespace part
                if (namespace) {
                    this.diagnostics.push(Object.assign(Object.assign({ file: file }, DiagnosticMessages_1.DiagnosticMessages.parameterMayNotHaveSameNameAsNamespace(param.name.text)), { range: param.name.range, relatedInformation: [{
                                message: 'Namespace declared here',
                                location: util_1.util.createLocation(vscode_uri_1.URI.file(namespace.file.srcPath).toString(), namespace.nameRange)
                            }] }));
                }
            }
        }
        for (let assignment of file.parser.references.assignmentStatements) {
            let lowerAssignmentName = assignment.name.text.toLowerCase();
            let namespace = this.getNamespace(lowerAssignmentName, (_b = assignment.findAncestor(reflection_1.isNamespaceStatement)) === null || _b === void 0 ? void 0 : _b.getName(Parser_1.ParseMode.BrighterScript).toLowerCase());
            //see if the param matches any starting namespace part
            if (namespace) {
                this.diagnostics.push(Object.assign(Object.assign({ file: file }, DiagnosticMessages_1.DiagnosticMessages.variableMayNotHaveSameNameAsNamespace(assignment.name.text)), { range: assignment.name.range, relatedInformation: [{
                            message: 'Namespace declared here',
                            location: util_1.util.createLocation(vscode_uri_1.URI.file(namespace.file.srcPath).toString(), namespace.nameRange)
                        }] }));
            }
        }
    }
    /**
     * Find various function collisions
     */
    diagnosticDetectFunctionCollisions(file) {
        var _a;
        for (let func of (_a = file === null || file === void 0 ? void 0 : file.callables) !== null && _a !== void 0 ? _a : []) {
            const funcName = func.getName(Parser_1.ParseMode.BrighterScript);
            const lowerFuncName = funcName === null || funcName === void 0 ? void 0 : funcName.toLowerCase();
            if (lowerFuncName) {
                //find function declarations with the same name as a stdlib function
                if (globalCallables_1.globalCallableMap.has(lowerFuncName)) {
                    this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.scopeFunctionShadowedByBuiltInFunction()), { range: func.nameRange, file: file }));
                }
                //find any functions that have the same name as a class
                if (this.hasClass(lowerFuncName)) {
                    this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.functionCannotHaveSameNameAsClass(funcName)), { range: func.nameRange, file: file }));
                }
            }
        }
    }
    /**
     * Find function parameters and function return types that are neither built-in types or known Class references
     */
    diagnosticDetectInvalidFunctionExpressionTypes(file) {
        var _a, _b;
        for (let func of file.parser.references.functionExpressions) {
            if ((0, reflection_1.isCustomType)(func.returnType) && func.returnTypeToken) {
                // check if this custom type is in our class map
                const returnTypeName = func.returnType.name;
                const currentNamespaceName = (_a = func.findAncestor(reflection_1.isNamespaceStatement)) === null || _a === void 0 ? void 0 : _a.getName(Parser_1.ParseMode.BrighterScript);
                // check for built in types
                const isBuiltInType = util_1.util.isBuiltInType(returnTypeName);
                if (!isBuiltInType && !this.hasClass(returnTypeName, currentNamespaceName) && !this.hasInterface(returnTypeName) && !this.hasEnum(returnTypeName)) {
                    this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.invalidFunctionReturnType(returnTypeName)), { range: func.returnTypeToken.range, file: file }));
                }
            }
            for (let param of func.parameters) {
                if ((0, reflection_1.isCustomType)(param.type) && param.typeToken) {
                    const paramTypeName = param.type.name;
                    const currentNamespaceName = (_b = func.findAncestor(reflection_1.isNamespaceStatement)) === null || _b === void 0 ? void 0 : _b.getName(Parser_1.ParseMode.BrighterScript);
                    // check for built in types
                    const isBuiltInType = util_1.util.isBuiltInType(paramTypeName);
                    if (!isBuiltInType && !this.hasClass(paramTypeName, currentNamespaceName) && !this.hasInterface(paramTypeName) && !this.hasEnum(paramTypeName)) {
                        this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.functionParameterTypeIsInvalid(param.name.text, paramTypeName)), { range: param.typeToken.range, file: file }));
                    }
                }
            }
        }
    }
    getNewExpressions() {
        let result = [];
        this.enumerateBrsFiles((file) => {
            let expressions = file.parser.references.newExpressions;
            for (let expression of expressions) {
                expression.file = file;
                result.push(expression);
            }
        });
        return result;
    }
    validateClasses() {
        let validator = new ClassValidator_1.BsClassValidator(this);
        validator.validate();
        this.diagnostics.push(...validator.diagnostics);
    }
    /**
     * Detect calls to functions with the incorrect number of parameters
     */
    diagnosticDetectFunctionCallsWithWrongParamCount(file, callableContainersByLowerName) {
        var _a;
        //validate all function calls
        for (let expCall of (_a = file === null || file === void 0 ? void 0 : file.functionCalls) !== null && _a !== void 0 ? _a : []) {
            let callableContainersWithThisName = callableContainersByLowerName.get(expCall.name.toLowerCase());
            //use the first item from callablesByLowerName, because if there are more, that's a separate error
            let knownCallableContainer = callableContainersWithThisName ? callableContainersWithThisName[0] : undefined;
            if (knownCallableContainer) {
                //get min/max parameter count for callable
                let minParams = 0;
                let maxParams = 0;
                for (let param of knownCallableContainer.callable.params) {
                    maxParams++;
                    //optional parameters must come last, so we can assume that minParams won't increase once we hit
                    //the first isOptional
                    if (param.isOptional !== true) {
                        minParams++;
                    }
                }
                let expCallArgCount = expCall.args.length;
                if (expCall.args.length > maxParams || expCall.args.length < minParams) {
                    let minMaxParamsText = minParams === maxParams ? maxParams : `${minParams}-${maxParams}`;
                    this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.mismatchArgumentCount(minMaxParamsText, expCallArgCount)), { range: expCall.nameRange, 
                        //TODO detect end of expression call
                        file: file }));
                }
            }
        }
    }
    /**
     * Detect local variables (function scope) that have the same name as scope calls
     */
    diagnosticDetectShadowedLocalVars(file, callableContainerMap) {
        var _a;
        const classMap = this.getClassMap();
        //loop through every function scope
        for (let scope of file.functionScopes) {
            //every var declaration in this function scope
            for (let varDeclaration of scope.variableDeclarations) {
                const varName = varDeclaration.name;
                const lowerVarName = varName.toLowerCase();
                //if the var is a function
                if ((0, reflection_1.isFunctionType)(varDeclaration.type)) {
                    //local var function with same name as stdlib function
                    if (
                    //has same name as stdlib
                    globalCallables_1.globalCallableMap.has(lowerVarName)) {
                        this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.localVarFunctionShadowsParentFunction('stdlib')), { range: varDeclaration.nameRange, file: file }));
                        //this check needs to come after the stdlib one, because the stdlib functions are included
                        //in the scope function list
                    }
                    else if (
                    //has same name as scope function
                    callableContainerMap.has(lowerVarName)) {
                        this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.localVarFunctionShadowsParentFunction('scope')), { range: varDeclaration.nameRange, file: file }));
                    }
                    //var is not a function
                }
                else if (
                //is NOT a callable from stdlib (because non-function local vars can have same name as stdlib names)
                !globalCallables_1.globalCallableMap.has(lowerVarName)) {
                    //is same name as a callable
                    if (callableContainerMap.has(lowerVarName)) {
                        this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.localVarShadowedByScopedFunction()), { range: varDeclaration.nameRange, file: file }));
                        //has the same name as an in-scope class
                    }
                    else if (classMap.has(lowerVarName)) {
                        this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.localVarSameNameAsClass((_a = classMap.get(lowerVarName)) === null || _a === void 0 ? void 0 : _a.item.getName(Parser_1.ParseMode.BrighterScript))), { range: varDeclaration.nameRange, file: file }));
                    }
                }
            }
        }
    }
    /**
     * Create diagnostics for any duplicate function declarations
     */
    diagnosticFindDuplicateFunctionDeclarations(callableContainersByLowerName) {
        //for each list of callables with the same name
        for (let [lowerName, callableContainers] of callableContainersByLowerName) {
            let globalCallables = [];
            let nonGlobalCallables = [];
            let ownCallables = [];
            let ancestorNonGlobalCallables = [];
            for (let container of callableContainers) {
                if (container.scope === this.program.globalScope) {
                    globalCallables.push(container);
                }
                else {
                    nonGlobalCallables.push(container);
                    if (container.scope === this) {
                        ownCallables.push(container);
                    }
                    else {
                        ancestorNonGlobalCallables.push(container);
                    }
                }
            }
            //add info diagnostics about child shadowing parent functions
            if (ownCallables.length > 0 && ancestorNonGlobalCallables.length > 0) {
                for (let container of ownCallables) {
                    //skip the init function (because every component will have one of those){
                    if (lowerName !== 'init') {
                        let shadowedCallable = ancestorNonGlobalCallables[ancestorNonGlobalCallables.length - 1];
                        if (!!shadowedCallable && shadowedCallable.callable.file === container.callable.file) {
                            //same file: skip redundant imports
                            continue;
                        }
                        this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.overridesAncestorFunction(container.callable.name, container.scope.name, shadowedCallable.callable.file.pkgPath, 
                        //grab the last item in the list, which should be the closest ancestor's version
                        shadowedCallable.scope.name)), { range: container.callable.nameRange, file: container.callable.file }));
                    }
                }
            }
            //add error diagnostics about duplicate functions in the same scope
            if (ownCallables.length > 1) {
                for (let callableContainer of ownCallables) {
                    let callable = callableContainer.callable;
                    this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.duplicateFunctionImplementation(callable.name, callableContainer.scope.name)), { range: util_1.util.createRange(callable.nameRange.start.line, callable.nameRange.start.character, callable.nameRange.start.line, callable.nameRange.end.character), file: callable.file }));
                }
            }
        }
    }
    /**
     * Get the list of all script imports for this scope
     */
    getOwnScriptImports() {
        let result = [];
        this.enumerateOwnFiles((file) => {
            if ((0, reflection_1.isBrsFile)(file)) {
                result.push(...file.ownScriptImports);
            }
            else if ((0, reflection_1.isXmlFile)(file)) {
                result.push(...file.scriptTagImports);
            }
        });
        return result;
    }
    /**
     * Verify that all of the scripts imported by each file in this scope actually exist
     */
    diagnosticValidateScriptImportPaths() {
        let scriptImports = this.getOwnScriptImports();
        //verify every script import
        for (let scriptImport of scriptImports) {
            let referencedFile = this.getFileByRelativePath(scriptImport.pkgPath);
            //if we can't find the file
            if (!referencedFile) {
                //skip the default bslib file, it will exist at transpile time but should not show up in the program during validation cycle
                if (scriptImport.pkgPath === `source${path.sep}bslib.brs`) {
                    continue;
                }
                let dInfo;
                if (scriptImport.text.trim().length === 0) {
                    dInfo = DiagnosticMessages_1.DiagnosticMessages.scriptSrcCannotBeEmpty();
                }
                else {
                    dInfo = DiagnosticMessages_1.DiagnosticMessages.referencedFileDoesNotExist();
                }
                this.diagnostics.push(Object.assign(Object.assign({}, dInfo), { range: scriptImport.filePathRange, file: scriptImport.sourceFile }));
                //if the character casing of the script import path does not match that of the actual path
            }
            else if (scriptImport.pkgPath !== referencedFile.pkgPath) {
                this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.scriptImportCaseMismatch(referencedFile.pkgPath)), { range: scriptImport.filePathRange, file: scriptImport.sourceFile }));
            }
        }
    }
    /**
     * Find the file with the specified relative path
     */
    getFileByRelativePath(relativePath) {
        if (!relativePath) {
            return;
        }
        let files = this.getAllFiles();
        for (let file of files) {
            if (file.pkgPath.toLowerCase() === relativePath.toLowerCase()) {
                return file;
            }
        }
    }
    /**
     * Determine if this file is included in this scope (excluding parent scopes)
     */
    hasFile(file) {
        let files = this.getOwnFiles();
        let hasFile = files.includes(file);
        return hasFile;
    }
    /**
     * Get all callables as completionItems
     */
    getCallablesAsCompletions(parseMode) {
        let completions = [];
        let callables = this.getAllCallables();
        if (parseMode === Parser_1.ParseMode.BrighterScript) {
            //throw out the namespaced callables (they will be handled by another method)
            callables = callables.filter(x => x.callable.hasNamespace === false);
        }
        for (let callableContainer of callables) {
            completions.push(this.createCompletionFromCallable(callableContainer));
        }
        return completions;
    }
    createCompletionFromCallable(callableContainer) {
        return {
            label: callableContainer.callable.getName(Parser_1.ParseMode.BrighterScript),
            kind: vscode_languageserver_1.CompletionItemKind.Function,
            detail: callableContainer.callable.shortDescription,
            documentation: callableContainer.callable.documentation ? { kind: 'markdown', value: callableContainer.callable.documentation } : undefined
        };
    }
    createCompletionFromFunctionStatement(statement) {
        return {
            label: statement.getName(Parser_1.ParseMode.BrighterScript),
            kind: vscode_languageserver_1.CompletionItemKind.Function
        };
    }
    /**
     * Get the definition (where was this thing first defined) of the symbol under the position
     * @deprecated use `DefinitionProvider.process()`
     */
    getDefinition(file, position) {
        // Overridden in XMLScope. Brs files use implementation in BrsFile
        return [];
    }
    /**
     * Scan all files for property names, and return them as completions
     */
    getPropertyNameCompletions() {
        let results = [];
        this.enumerateBrsFiles((file) => {
            results.push(...file.propertyNameCompletions);
        });
        return results;
    }
    getAllClassMemberCompletions() {
        let results = new Map();
        let filesSearched = new Set();
        for (const file of this.getAllFiles()) {
            if ((0, reflection_1.isXmlFile)(file) || filesSearched.has(file)) {
                continue;
            }
            filesSearched.add(file);
            for (let cs of file.parser.references.classStatements) {
                for (let s of [...cs.methods, ...cs.fields]) {
                    if (!results.has(s.name.text) && s.name.text.toLowerCase() !== 'new') {
                        results.set(s.name.text, {
                            label: s.name.text,
                            kind: (0, reflection_1.isMethodStatement)(s) ? vscode_languageserver_1.CompletionItemKind.Method : vscode_languageserver_1.CompletionItemKind.Field
                        });
                    }
                }
            }
        }
        return results;
    }
    /**
     * @param className - The name of the class (including namespace if possible)
     * @param callsiteNamespace - the name of the namespace where the call site resides (this is NOT the known namespace of the class).
     *                            This is used to help resolve non-namespaced class names that reside in the same namespac as the call site.
     */
    getClassHierarchy(className, callsiteNamespace) {
        var _a, _b;
        let items = [];
        let link = this.getClassFileLink(className, callsiteNamespace);
        while (link) {
            items.push(link);
            link = this.getClassFileLink((_b = (_a = link.item.parentClassName) === null || _a === void 0 ? void 0 : _a.getName(Parser_1.ParseMode.BrighterScript)) === null || _b === void 0 ? void 0 : _b.toLowerCase(), callsiteNamespace);
        }
        return items;
    }
}
exports.Scope = Scope;
//# sourceMappingURL=Scope.js.map
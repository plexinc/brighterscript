"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScopeValidator = void 0;
const vscode_uri_1 = require("vscode-uri");
const reflection_1 = require("../../astUtils/reflection");
const Cache_1 = require("../../Cache");
const DiagnosticMessages_1 = require("../../DiagnosticMessages");
const util_1 = require("../../util");
const roku_types_1 = require("../../roku-types");
const Parser_1 = require("../../parser/Parser");
/**
 * The lower-case names of all platform-included scenegraph nodes
 */
const platformNodeNames = new Set(Object.values(roku_types_1.nodes).map(x => x.name.toLowerCase()));
const platformComponentNames = new Set(Object.values(roku_types_1.components).map(x => x.name.toLowerCase()));
/**
 * A validator that handles all scope validations for a program validation cycle.
 * You should create ONE of these to handle all scope events between beforeProgramValidate and afterProgramValidate,
 * and call reset() before using it again in the next cycle
 */
class ScopeValidator {
    constructor() {
        this.expressionsByFile = new Cache_1.Cache();
        this.onceCache = new Cache_1.Cache();
        this.multiScopeCache = new Cache_1.Cache();
    }
    processEvent(event) {
        this.event = event;
        this.walkFiles();
        this.detectDuplicateEnums();
    }
    reset() {
        this.event = undefined;
        this.onceCache.clear();
        this.multiScopeCache.clear();
    }
    walkFiles() {
        this.event.scope.enumerateOwnFiles((file) => {
            if ((0, reflection_1.isBrsFile)(file)) {
                this.iterateFileExpressions(file);
                this.validateCreateObjectCalls(file);
            }
        });
    }
    iterateFileExpressions(file) {
        var _a, _b, _c, _d, _e;
        const { scope } = this.event;
        //build an expression collection ONCE per file
        const expressionInfos = this.expressionsByFile.getOrAdd(file, () => {
            var _a, _b;
            const result = [];
            const expressions = [
                ...file.parser.references.expressions,
                //all class "extends <whatever>" expressions
                ...file.parser.references.classStatements.map(x => { var _a; return (_a = x.parentClassName) === null || _a === void 0 ? void 0 : _a.expression; }),
                //all interface "extends <whatever>" expressions
                ...file.parser.references.interfaceStatements.map(x => { var _a; return (_a = x.parentInterfaceName) === null || _a === void 0 ? void 0 : _a.expression; })
            ];
            for (let expression of expressions) {
                if (!expression) {
                    continue;
                }
                //walk left-to-right on every expression, only keep the ones that start with VariableExpression, and then keep subsequent DottedGet parts
                const parts = util_1.default.getDottedGetPath(expression);
                if (parts.length > 0) {
                    result.push({
                        parts: parts,
                        expression: expression,
                        enclosingNamespaceNameLower: (_b = (_a = expression.findAncestor(reflection_1.isNamespaceStatement)) === null || _a === void 0 ? void 0 : _a.getName(Parser_1.ParseMode.BrighterScript)) === null || _b === void 0 ? void 0 : _b.toLowerCase()
                    });
                }
            }
            return result;
        });
        outer: for (const info of expressionInfos) {
            const symbolTable = info.expression.getSymbolTable();
            const firstPart = info.parts[0];
            const firstNamespacePart = info.parts[0].name.text;
            const firstNamespacePartLower = firstNamespacePart === null || firstNamespacePart === void 0 ? void 0 : firstNamespacePart.toLowerCase();
            //get the namespace container (accounting for namespace-relative as well)
            const namespaceContainer = scope.getNamespace(firstNamespacePartLower, info.enclosingNamespaceNameLower);
            //flag all unknown left-most variables
            if (!(symbolTable === null || symbolTable === void 0 ? void 0 : symbolTable.hasSymbol((_a = firstPart.name) === null || _a === void 0 ? void 0 : _a.text)) &&
                !namespaceContainer) {
                //flag functions differently than all other variables
                if ((0, reflection_1.isCallExpression)(firstPart.parent) && firstPart.parent.callee === firstPart) {
                    this.addMultiScopeDiagnostic(Object.assign(Object.assign({ file: file }, DiagnosticMessages_1.DiagnosticMessages.cannotFindFunction((_b = firstPart.name) === null || _b === void 0 ? void 0 : _b.text)), { range: firstPart.name.range }));
                }
                else {
                    this.addMultiScopeDiagnostic(Object.assign(Object.assign({ file: file }, DiagnosticMessages_1.DiagnosticMessages.cannotFindName((_c = firstPart.name) === null || _c === void 0 ? void 0 : _c.text)), { range: firstPart.name.range }));
                }
                //skip to the next expression
                continue;
            }
            const enumStatement = scope.getEnum(firstNamespacePartLower, info.enclosingNamespaceNameLower);
            //if this isn't a namespace, skip it
            if (!namespaceContainer && !enumStatement) {
                continue;
            }
            //catch unknown namespace items
            let entityName = firstNamespacePart;
            let entityNameLower = firstNamespacePart.toLowerCase();
            for (let i = 1; i < info.parts.length; i++) {
                const part = info.parts[i];
                entityName += '.' + part.name.text;
                entityNameLower += '.' + part.name.text.toLowerCase();
                //if this is an enum member, stop validating here to prevent errors further down the chain
                if (scope.getEnumMemberFileLink(entityName, info.enclosingNamespaceNameLower)) {
                    break;
                }
                if (!scope.getEnumMap().has(entityNameLower) &&
                    !scope.getClassMap().has(entityNameLower) &&
                    !scope.getConstMap().has(entityNameLower) &&
                    !scope.getCallableByName(entityNameLower) &&
                    !scope.getNamespace(entityNameLower, info.enclosingNamespaceNameLower)) {
                    //if this looks like an enum, provide a nicer error message
                    const theEnum = (_d = this.getEnum(scope, entityNameLower)) === null || _d === void 0 ? void 0 : _d.item;
                    if (theEnum) {
                        this.addMultiScopeDiagnostic(Object.assign(Object.assign({ file: file }, DiagnosticMessages_1.DiagnosticMessages.unknownEnumValue((_e = part.name.text) === null || _e === void 0 ? void 0 : _e.split('.').pop(), theEnum.fullName)), { range: part.name.range, relatedInformation: [{
                                    message: 'Enum declared here',
                                    location: util_1.default.createLocation(vscode_uri_1.URI.file(file.srcPath).toString(), theEnum.tokens.name.range)
                                }] }));
                    }
                    else {
                        //flag functions differently than all other variables
                        if ((0, reflection_1.isCallExpression)(firstPart.parent) && firstPart.parent.callee === firstPart) {
                            this.addMultiScopeDiagnostic(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.cannotFindFunction(part.name.text, entityName)), { range: part.name.range, file: file }));
                        }
                        else {
                            this.addMultiScopeDiagnostic(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.cannotFindName(part.name.text, entityName)), { range: part.name.range, file: file }));
                        }
                    }
                    //no need to add another diagnostic for future unknown items
                    continue outer;
                }
            }
            //if the full expression is a namespace path, this is an illegal statement because namespaces don't exist at runtme
            if (scope.getNamespace(entityNameLower, info.enclosingNamespaceNameLower)) {
                this.addMultiScopeDiagnostic(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.itemCannotBeUsedAsVariable('namespace')), { range: info.expression.range, file: file }), 'When used in scope');
            }
        }
    }
    /**
     * Given a string optionally separated by dots, find an enum related to it.
     * For example, all of these would return the enum: `SomeNamespace.SomeEnum.SomeMember`, SomeEnum.SomeMember, `SomeEnum`
     */
    getEnum(scope, name) {
        //look for the enum directly
        let result = scope.getEnumMap().get(name);
        //assume we've been given the enum.member syntax, so pop the member and try again
        if (!result) {
            const parts = name.split('.');
            parts.pop();
            result = scope.getEnumMap().get(parts.join('.'));
        }
        return result;
    }
    /**
     * Flag duplicate enums
     */
    detectDuplicateEnums() {
        const diagnostics = [];
        const enumLocationsByName = new Cache_1.Cache();
        this.event.scope.enumerateBrsFiles((file) => {
            for (const enumStatement of file.parser.references.enumStatements) {
                const fullName = enumStatement.fullName;
                const nameLower = fullName === null || fullName === void 0 ? void 0 : fullName.toLowerCase();
                if ((nameLower === null || nameLower === void 0 ? void 0 : nameLower.length) > 0) {
                    enumLocationsByName.getOrAdd(nameLower, () => []).push({
                        file: file,
                        statement: enumStatement
                    });
                }
            }
        });
        //now that we've collected all enum declarations, flag duplicates
        for (const enumLocations of enumLocationsByName.values()) {
            //sort by srcPath to keep the primary enum location consistent
            enumLocations.sort((a, b) => {
                var _a, _b;
                const pathA = (_a = a.file) === null || _a === void 0 ? void 0 : _a.srcPath;
                const pathB = (_b = b.file) === null || _b === void 0 ? void 0 : _b.srcPath;
                if (pathA < pathB) {
                    return -1;
                }
                else if (pathA > pathB) {
                    return 1;
                }
                return 0;
            });
            const primaryEnum = enumLocations.shift();
            const fullName = primaryEnum.statement.fullName;
            for (const duplicateEnumInfo of enumLocations) {
                diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.duplicateEnumDeclaration(this.event.scope.name, fullName)), { file: duplicateEnumInfo.file, range: duplicateEnumInfo.statement.tokens.name.range, relatedInformation: [{
                            message: 'Enum declared here',
                            location: util_1.default.createLocation(vscode_uri_1.URI.file(primaryEnum.file.srcPath).toString(), primaryEnum.statement.tokens.name.range)
                        }] }));
            }
        }
        this.event.scope.addDiagnostics(diagnostics);
    }
    /**
     * Validate every function call to `CreateObject`.
     * Ideally we would create better type checking/handling for this, but in the mean time, we know exactly
     * what these calls are supposed to look like, and this is a very common thing for brs devs to do, so just
     * do this manually for now.
     */
    validateCreateObjectCalls(file) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        const diagnostics = [];
        for (const call of (_a = file === null || file === void 0 ? void 0 : file.functionCalls) !== null && _a !== void 0 ? _a : []) {
            //skip non CreateObject function calls
            if (((_b = call.name) === null || _b === void 0 ? void 0 : _b.toLowerCase()) !== 'createobject' || !(0, reflection_1.isLiteralExpression)((_c = call === null || call === void 0 ? void 0 : call.args[0]) === null || _c === void 0 ? void 0 : _c.expression)) {
                continue;
            }
            const firstParamToken = (_e = (_d = call === null || call === void 0 ? void 0 : call.args[0]) === null || _d === void 0 ? void 0 : _d.expression) === null || _e === void 0 ? void 0 : _e.token;
            const firstParamStringValue = (_f = firstParamToken === null || firstParamToken === void 0 ? void 0 : firstParamToken.text) === null || _f === void 0 ? void 0 : _f.replace(/"/g, '');
            //if this is a `createObject('roSGNode'` call, only support known sg node types
            if ((firstParamStringValue === null || firstParamStringValue === void 0 ? void 0 : firstParamStringValue.toLowerCase()) === 'rosgnode' && (0, reflection_1.isLiteralExpression)((_g = call === null || call === void 0 ? void 0 : call.args[1]) === null || _g === void 0 ? void 0 : _g.expression)) {
                const componentName = (_j = (_h = call === null || call === void 0 ? void 0 : call.args[1]) === null || _h === void 0 ? void 0 : _h.expression) === null || _j === void 0 ? void 0 : _j.token;
                //don't validate any components with a colon in their name (probably component libraries, but regular components can have them too).
                if ((_k = componentName === null || componentName === void 0 ? void 0 : componentName.text) === null || _k === void 0 ? void 0 : _k.includes(':')) {
                    continue;
                }
                //add diagnostic for unknown components
                const unquotedComponentName = (_l = componentName === null || componentName === void 0 ? void 0 : componentName.text) === null || _l === void 0 ? void 0 : _l.replace(/"/g, '');
                if (unquotedComponentName && !platformNodeNames.has(unquotedComponentName.toLowerCase()) && !this.event.program.getComponent(unquotedComponentName)) {
                    this.addDiagnosticOnce(Object.assign(Object.assign({ file: file }, DiagnosticMessages_1.DiagnosticMessages.unknownRoSGNode(unquotedComponentName)), { range: componentName.range }));
                }
                else if ((call === null || call === void 0 ? void 0 : call.args.length) !== 2) {
                    // roSgNode should only ever have 2 args in `createObject`
                    this.addDiagnosticOnce(Object.assign(Object.assign({ file: file }, DiagnosticMessages_1.DiagnosticMessages.mismatchCreateObjectArgumentCount(firstParamStringValue, [2], call === null || call === void 0 ? void 0 : call.args.length)), { range: call.range }));
                }
            }
            else if (!platformComponentNames.has(firstParamStringValue.toLowerCase())) {
                this.addDiagnosticOnce(Object.assign(Object.assign({ file: file }, DiagnosticMessages_1.DiagnosticMessages.unknownBrightScriptComponent(firstParamStringValue)), { range: firstParamToken.range }));
            }
            else {
                // This is valid brightscript component
                // Test for invalid arg counts
                const brightScriptComponent = roku_types_1.components[firstParamStringValue.toLowerCase()];
                // Valid arg counts for createObject are 1+ number of args for constructor
                let validArgCounts = brightScriptComponent.constructors.map(cnstr => cnstr.params.length + 1);
                if (validArgCounts.length === 0) {
                    // no constructors for this component, so createObject only takes 1 arg
                    validArgCounts = [1];
                }
                if (!validArgCounts.includes(call === null || call === void 0 ? void 0 : call.args.length)) {
                    // Incorrect number of arguments included in `createObject()`
                    this.addDiagnosticOnce(Object.assign(Object.assign({ file: file }, DiagnosticMessages_1.DiagnosticMessages.mismatchCreateObjectArgumentCount(firstParamStringValue, validArgCounts, call === null || call === void 0 ? void 0 : call.args.length)), { range: call.range }));
                }
                // Test for deprecation
                if (brightScriptComponent.isDeprecated) {
                    this.addDiagnosticOnce(Object.assign(Object.assign({ file: file }, DiagnosticMessages_1.DiagnosticMessages.deprecatedBrightScriptComponent(firstParamStringValue, brightScriptComponent.deprecatedDescription)), { range: call.range }));
                }
            }
        }
        this.event.scope.addDiagnostics(diagnostics);
    }
    /**
     * Adds a diagnostic to the first scope for this key. Prevents duplicate diagnostics
     * for diagnostics where scope isn't important. (i.e. CreateObject validations)
     */
    addDiagnosticOnce(diagnostic) {
        this.onceCache.getOrAdd(`${diagnostic.code}-${diagnostic.message}-${util_1.default.rangeToString(diagnostic.range)}`, () => {
            this.event.scope.addDiagnostics([diagnostic]);
            return true;
        });
    }
    addDiagnostic(diagnostic) {
        this.event.scope.addDiagnostics([diagnostic]);
    }
    /**
     * Add a diagnostic (to the first scope) that will have `relatedInformation` for each affected scope
     */
    addMultiScopeDiagnostic(diagnostic, message = 'Not defined in scope') {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        diagnostic = this.multiScopeCache.getOrAdd(`${(_a = diagnostic.file) === null || _a === void 0 ? void 0 : _a.srcPath}-${diagnostic.code}-${diagnostic.message}-${util_1.default.rangeToString(diagnostic.range)}`, () => {
            if (!diagnostic.relatedInformation) {
                diagnostic.relatedInformation = [];
            }
            this.addDiagnostic(diagnostic);
            return diagnostic;
        });
        const info = {
            message: `${message} '${this.event.scope.name}'`
        };
        if ((0, reflection_1.isXmlScope)(this.event.scope) && ((_b = this.event.scope.xmlFile) === null || _b === void 0 ? void 0 : _b.srcPath)) {
            info.location = util_1.default.createLocation(vscode_uri_1.URI.file(this.event.scope.xmlFile.srcPath).toString(), (_h = (_g = (_f = (_e = (_d = (_c = this.event.scope) === null || _c === void 0 ? void 0 : _c.xmlFile) === null || _d === void 0 ? void 0 : _d.ast) === null || _e === void 0 ? void 0 : _e.component) === null || _f === void 0 ? void 0 : _f.getAttribute('name')) === null || _g === void 0 ? void 0 : _g.value.range) !== null && _h !== void 0 ? _h : util_1.default.createRange(0, 0, 0, 10));
        }
        else {
            info.location = util_1.default.createLocation(vscode_uri_1.URI.file(diagnostic.file.srcPath).toString(), diagnostic.range);
        }
        diagnostic.relatedInformation.push(info);
    }
}
exports.ScopeValidator = ScopeValidator;
//# sourceMappingURL=ScopeValidator.js.map
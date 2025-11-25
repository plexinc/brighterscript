"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BsClassValidator = void 0;
const DiagnosticMessages_1 = require("../DiagnosticMessages");
const Parser_1 = require("../parser/Parser");
const vscode_languageserver_1 = require("vscode-languageserver");
const vscode_uri_1 = require("vscode-uri");
const util_1 = require("../util");
const reflection_1 = require("../astUtils/reflection");
const visitors_1 = require("../astUtils/visitors");
const TokenKind_1 = require("../lexer/TokenKind");
const DynamicType_1 = require("../types/DynamicType");
class BsClassValidator {
    constructor(scope) {
        /**
         * The key is the namespace-prefixed class name. (i.e. `NameA.NameB.SomeClass` or `CoolClass`)
         */
        this.classes = new Map();
        this.scope = scope;
        this.diagnostics = [];
    }
    validate() {
        this.findClasses();
        this.findNamespaceNonNamespaceCollisions();
        this.linkClassesWithParents();
        this.detectCircularReferences();
        this.validateMemberCollisions();
        this.verifyChildConstructor();
        this.verifyNewExpressions();
        this.validateFieldTypes();
        this.cleanUp();
    }
    /**
     * Given a class name optionally prefixed with a namespace name, find the class that matches
     */
    getClassByName(className, namespaceName) {
        let fullName = util_1.default.getFullyQualifiedClassName(className, namespaceName);
        let cls = this.classes.get(fullName.toLowerCase());
        //if we couldn't find the class by its full namespaced name, look for a global class with that name
        if (!cls) {
            cls = this.classes.get(className.toLowerCase());
        }
        return cls;
    }
    /**
     * Find all "new" statements in the program,
     * and make sure we can find a class with that name
     */
    verifyNewExpressions() {
        this.scope.enumerateBrsFiles((file) => {
            var _a;
            let newExpressions = file.parser.references.newExpressions;
            for (let newExpression of newExpressions) {
                let className = newExpression.className.getName(Parser_1.ParseMode.BrighterScript);
                const namespaceName = (_a = newExpression.findAncestor(reflection_1.isNamespaceStatement)) === null || _a === void 0 ? void 0 : _a.getName(Parser_1.ParseMode.BrighterScript);
                let newableClass = this.getClassByName(className, namespaceName);
                if (!newableClass) {
                    //try and find functions with this name.
                    let fullName = util_1.default.getFullyQualifiedClassName(className, namespaceName);
                    let callable = this.scope.getCallableByName(fullName);
                    //if we found a callable with this name, the user used a "new" keyword in front of a function. add error
                    if (callable) {
                        this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.expressionIsNotConstructable(callable.isSub ? 'sub' : 'function')), { file: file, range: newExpression.className.range }));
                    }
                    else {
                        //could not find a class with this name (handled by ScopeValidator)
                    }
                }
            }
        });
    }
    findNamespaceNonNamespaceCollisions() {
        var _a;
        for (const [className, classStatement] of this.classes) {
            //catch namespace class collision with global class
            let nonNamespaceClassName = (_a = util_1.default.getTextAfterFinalDot(className)) === null || _a === void 0 ? void 0 : _a.toLowerCase();
            let nonNamespaceClass = this.classes.get(nonNamespaceClassName);
            const namespace = classStatement.findAncestor(reflection_1.isNamespaceStatement);
            if (namespace && nonNamespaceClass) {
                this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.namespacedClassCannotShareNamewithNonNamespacedClass(nonNamespaceClass.name.text)), { file: classStatement.file, range: classStatement.name.range, relatedInformation: [{
                            location: util_1.default.createLocation(vscode_uri_1.URI.file(nonNamespaceClass.file.srcPath).toString(), nonNamespaceClass.name.range),
                            message: 'Original class declared here'
                        }] }));
            }
        }
    }
    verifyChildConstructor() {
        for (const [, classStatement] of this.classes) {
            const newMethod = classStatement.memberMap.new;
            if (
            //this class has a "new method"
            newMethod &&
                //this class has a parent class
                classStatement.parentClass) {
                //prevent use of `m.` anywhere before the `super()` call
                const cancellationToken = new vscode_languageserver_1.CancellationTokenSource();
                let superCall;
                newMethod.func.body.walk((0, visitors_1.createVisitor)({
                    VariableExpression: (expression, parent) => {
                        var _a;
                        const expressionNameLower = (_a = expression === null || expression === void 0 ? void 0 : expression.name) === null || _a === void 0 ? void 0 : _a.text.toLowerCase();
                        if (expressionNameLower === 'm') {
                            this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.classConstructorIllegalUseOfMBeforeSuperCall()), { file: classStatement.file, range: expression.range }));
                        }
                        if ((0, reflection_1.isCallExpression)(parent) && expressionNameLower === 'super') {
                            superCall = parent;
                            //stop walking
                            cancellationToken.cancel();
                        }
                    }
                }), {
                    walkMode: visitors_1.WalkMode.visitAll,
                    cancel: cancellationToken.token
                });
                //every child class constructor must include a call to `super()` (except for typedef files)
                if (!superCall && !classStatement.file.isTypedef) {
                    this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.classConstructorMissingSuperCall()), { file: classStatement.file, range: newMethod.range }));
                }
            }
        }
    }
    detectCircularReferences() {
        for (let [, cls] of this.classes) {
            const names = new Map();
            do {
                const className = cls.getName(Parser_1.ParseMode.BrighterScript);
                if (!className) {
                    break;
                }
                const lowerClassName = className.toLowerCase();
                //if we've already seen this class name before, then we have a circular dependency
                if (lowerClassName && names.has(lowerClassName)) {
                    this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.circularReferenceDetected(Array.from(names.values()).concat(className), this.scope.name)), { file: cls.file, range: cls.name.range }));
                    break;
                }
                names.set(lowerClassName, className);
                if (!cls.parentClass) {
                    break;
                }
                cls = cls.parentClass;
            } while (cls);
        }
    }
    validateMemberCollisions() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        for (const [, classStatement] of this.classes) {
            let methods = {};
            let fields = {};
            for (let statement of classStatement.body) {
                if ((0, reflection_1.isMethodStatement)(statement) || (0, reflection_1.isFieldStatement)(statement)) {
                    let member = statement;
                    let memberName = member.name;
                    if (!memberName) {
                        continue;
                    }
                    let lowerMemberName = memberName.text.toLowerCase();
                    //catch duplicate member names on same class
                    if (methods[lowerMemberName] || fields[lowerMemberName]) {
                        this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.duplicateIdentifier(memberName.text)), { file: classStatement.file, range: memberName.range }));
                    }
                    let memberType = (0, reflection_1.isFieldStatement)(member) ? 'field' : 'method';
                    let ancestorAndMember = this.getAncestorMember(classStatement, lowerMemberName);
                    if (ancestorAndMember) {
                        let ancestorMemberKind = (0, reflection_1.isFieldStatement)(ancestorAndMember.member) ? 'field' : 'method';
                        //mismatched member type (field/method in child, opposite in ancestor)
                        if (memberType !== ancestorMemberKind) {
                            this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.classChildMemberDifferentMemberTypeThanAncestor(memberType, ancestorMemberKind, ancestorAndMember.classStatement.getName(Parser_1.ParseMode.BrighterScript))), { file: classStatement.file, range: member.range }));
                        }
                        //child field has same name as parent
                        if ((0, reflection_1.isFieldStatement)(member)) {
                            let ancestorMemberType = new DynamicType_1.DynamicType();
                            if ((0, reflection_1.isFieldStatement)(ancestorAndMember.member)) {
                                ancestorMemberType = (_a = ancestorAndMember.member.getType()) !== null && _a !== void 0 ? _a : new DynamicType_1.DynamicType();
                            }
                            else if ((0, reflection_1.isMethodStatement)(ancestorAndMember.member)) {
                                ancestorMemberType = ancestorAndMember.member.func.getFunctionType();
                            }
                            const childFieldType = member.getType();
                            if (childFieldType && !childFieldType.isAssignableTo(ancestorMemberType)) {
                                //flag incompatible child field type to ancestor field type
                                this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.childFieldTypeNotAssignableToBaseProperty((_b = classStatement.getName(Parser_1.ParseMode.BrighterScript)) !== null && _b !== void 0 ? _b : '', ancestorAndMember.classStatement.getName(Parser_1.ParseMode.BrighterScript), memberName.text, childFieldType.toString(), ancestorMemberType.toString())), { file: classStatement.file, range: member.range }));
                            }
                        }
                        //child method missing the override keyword
                        if (
                        //is a method
                        (0, reflection_1.isMethodStatement)(member) &&
                            //does not have an override keyword
                            !member.override &&
                            //is not the constructur function
                            member.name.text.toLowerCase() !== 'new') {
                            this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.missingOverrideKeyword(ancestorAndMember.classStatement.getName(Parser_1.ParseMode.BrighterScript))), { file: classStatement.file, range: member.range }));
                        }
                        //child member has different visiblity
                        if (
                        //is a method
                        (0, reflection_1.isMethodStatement)(member) &&
                            ((_d = (_c = member.accessModifier) === null || _c === void 0 ? void 0 : _c.kind) !== null && _d !== void 0 ? _d : TokenKind_1.TokenKind.Public) !== ((_f = (_e = ancestorAndMember.member.accessModifier) === null || _e === void 0 ? void 0 : _e.kind) !== null && _f !== void 0 ? _f : TokenKind_1.TokenKind.Public)) {
                            this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.mismatchedOverriddenMemberVisibility(classStatement.name.text, (_g = ancestorAndMember.member.name) === null || _g === void 0 ? void 0 : _g.text, (_j = (_h = member.accessModifier) === null || _h === void 0 ? void 0 : _h.text) !== null && _j !== void 0 ? _j : 'public', ((_k = ancestorAndMember.member.accessModifier) === null || _k === void 0 ? void 0 : _k.text) || 'public', ancestorAndMember.classStatement.getName(Parser_1.ParseMode.BrighterScript))), { file: classStatement.file, range: member.range }));
                        }
                    }
                    if ((0, reflection_1.isMethodStatement)(member)) {
                        methods[lowerMemberName] = member;
                    }
                    else if ((0, reflection_1.isFieldStatement)(member)) {
                        fields[lowerMemberName] = member;
                    }
                }
            }
        }
    }
    /**
     * Check the types for fields, and validate they are valid types
     */
    validateFieldTypes() {
        var _a, _b;
        for (const [, classStatement] of this.classes) {
            for (let statement of classStatement.body) {
                if ((0, reflection_1.isFieldStatement)(statement)) {
                    let fieldType = statement.getType();
                    if ((0, reflection_1.isCustomType)(fieldType)) {
                        const fieldTypeName = fieldType.name;
                        const lowerFieldTypeName = fieldTypeName === null || fieldTypeName === void 0 ? void 0 : fieldTypeName.toLowerCase();
                        if (lowerFieldTypeName) {
                            const namespace = classStatement.findAncestor(reflection_1.isNamespaceStatement);
                            const currentNamespaceName = namespace === null || namespace === void 0 ? void 0 : namespace.getName(Parser_1.ParseMode.BrighterScript);
                            //check if this custom type is in our class map
                            const isBuiltInType = util_1.default.isBuiltInType(lowerFieldTypeName);
                            if (!isBuiltInType && !this.getClassByName(lowerFieldTypeName, currentNamespaceName) && !this.scope.hasInterface(lowerFieldTypeName) && !this.scope.hasEnum(lowerFieldTypeName)) {
                                this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.cannotFindType(fieldTypeName)), { range: (_b = (_a = statement.type) === null || _a === void 0 ? void 0 : _a.range) !== null && _b !== void 0 ? _b : statement.range, file: classStatement.file }));
                            }
                        }
                    }
                }
            }
        }
    }
    /**
     * Get the closest member with the specified name (case-insensitive)
     */
    getAncestorMember(classStatement, memberName) {
        let lowerMemberName = memberName.toLowerCase();
        let ancestor = classStatement.parentClass;
        while (ancestor) {
            let member = ancestor.memberMap[lowerMemberName];
            if (member) {
                return {
                    member: member,
                    classStatement: ancestor
                };
            }
            ancestor = ancestor.parentClass !== ancestor ? ancestor.parentClass : null;
        }
    }
    cleanUp() {
        //unlink all classes from their parents so it doesn't mess up the next scope
        for (const [, classStatement] of this.classes) {
            delete classStatement.parentClass;
            delete classStatement.file;
        }
    }
    findClasses() {
        this.classes = new Map();
        this.scope.enumerateBrsFiles((file) => {
            var _a;
            for (let x of (_a = file.parser.references.classStatements) !== null && _a !== void 0 ? _a : []) {
                let classStatement = x;
                let name = classStatement.getName(Parser_1.ParseMode.BrighterScript);
                //skip this class if it doesn't have a name
                if (!name) {
                    continue;
                }
                let lowerName = name.toLowerCase();
                //see if this class was already defined
                let alreadyDefinedClass = this.classes.get(lowerName);
                //if we don't already have this class, register it
                if (!alreadyDefinedClass) {
                    this.classes.set(lowerName, classStatement);
                    classStatement.file = file;
                    //add a diagnostic about this class already existing
                }
                else {
                    this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.duplicateClassDeclaration(this.scope.name, name)), { file: file, range: classStatement.name.range, relatedInformation: [{
                                location: util_1.default.createLocation(vscode_uri_1.URI.file(alreadyDefinedClass.file.srcPath).toString(), alreadyDefinedClass.range),
                                message: ''
                            }] }));
                }
            }
        });
    }
    linkClassesWithParents() {
        var _a;
        //link all classes with their parents
        for (const [, classStatement] of this.classes) {
            let parentClassName = (_a = classStatement.parentClassName) === null || _a === void 0 ? void 0 : _a.getName(Parser_1.ParseMode.BrighterScript);
            if (parentClassName) {
                let relativeName;
                let absoluteName;
                //if the parent class name was namespaced in the declaration of this class,
                //compute the relative name of the parent class and the absolute name of the parent class
                if (parentClassName.indexOf('.') > 0) {
                    absoluteName = parentClassName;
                    let parts = parentClassName.split('.');
                    relativeName = parts[parts.length - 1];
                    //the parent class name was NOT namespaced.
                    //compute the relative name of the parent class and prepend the current class's namespace
                    //to the beginning of the parent class's name
                }
                else {
                    const namespace = classStatement.findAncestor(reflection_1.isNamespaceStatement);
                    if (namespace) {
                        absoluteName = `${namespace.getName(Parser_1.ParseMode.BrighterScript)}.${parentClassName}`;
                    }
                    else {
                        absoluteName = parentClassName;
                    }
                    relativeName = parentClassName;
                }
                let relativeParent = this.classes.get(relativeName.toLowerCase());
                let absoluteParent = this.classes.get(absoluteName.toLowerCase());
                let parentClass;
                //if we found a relative parent class
                if (relativeParent) {
                    parentClass = relativeParent;
                    //we found an absolute parent class
                }
                else if (absoluteParent) {
                    parentClass = absoluteParent;
                }
                else {
                    //couldn't find the parent class (validated in ScopeValidator)
                }
                classStatement.parentClass = parentClass;
            }
        }
    }
}
exports.BsClassValidator = BsClassValidator;
//# sourceMappingURL=ClassValidator.js.map
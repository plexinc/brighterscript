"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrsFileValidator = void 0;
const reflection_1 = require("../../astUtils/reflection");
const visitors_1 = require("../../astUtils/visitors");
const DiagnosticMessages_1 = require("../../DiagnosticMessages");
const TokenKind_1 = require("../../lexer/TokenKind");
const Expression_1 = require("../../parser/Expression");
const Parser_1 = require("../../parser/Parser");
const DynamicType_1 = require("../../types/DynamicType");
const InterfaceType_1 = require("../../types/InterfaceType");
const util_1 = require("../../util");
class BrsFileValidator {
    constructor(event) {
        this.event = event;
    }
    process() {
        util_1.default.validateTooDeepFile(this.event.file);
        this.walk();
        this.flagTopLevelStatements();
        //only validate the file if it was actually parsed (skip files containing typedefs)
        if (!this.event.file.hasTypedef) {
            this.validateImportStatements();
        }
    }
    /**
     * Walk the full AST
     */
    walk() {
        const visitor = (0, visitors_1.createVisitor)({
            MethodStatement: (node) => {
                //add the `super` symbol to class methods
                node.func.body.symbolTable.addSymbol('super', undefined, DynamicType_1.DynamicType.instance);
            },
            CallfuncExpression: (node) => {
                if (node.args.length > 5) {
                    this.event.file.addDiagnostic(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.callfuncHasToManyArgs(node.args.length)), { range: node.methodName.range }));
                }
            },
            EnumStatement: (node) => {
                var _a;
                this.validateDeclarationLocations(node, 'enum', () => util_1.default.createBoundingRange(node.tokens.enum, node.tokens.name));
                this.validateEnumDeclaration(node);
                //register this enum declaration
                if (node.tokens.name) {
                    (_a = node.parent.getSymbolTable()) === null || _a === void 0 ? void 0 : _a.addSymbol(node.tokens.name.text, node.tokens.name.range, DynamicType_1.DynamicType.instance);
                }
            },
            ClassStatement: (node) => {
                var _a;
                this.validateDeclarationLocations(node, 'class', () => util_1.default.createBoundingRange(node.classKeyword, node.name));
                //register this class
                if (node.name) {
                    (_a = node.parent.getSymbolTable()) === null || _a === void 0 ? void 0 : _a.addSymbol(node.name.text, node.name.range, DynamicType_1.DynamicType.instance);
                }
            },
            AssignmentStatement: (node) => {
                var _a;
                //register this variable
                if (node.name) {
                    (_a = node.parent.getSymbolTable()) === null || _a === void 0 ? void 0 : _a.addSymbol(node.name.text, node.name.range, DynamicType_1.DynamicType.instance);
                }
            },
            DottedSetStatement: (node) => {
                this.validateNoOptionalChainingInVarSet(node, [node.obj]);
            },
            IndexedSetStatement: (node) => {
                this.validateNoOptionalChainingInVarSet(node, [node.obj]);
            },
            ForEachStatement: (node) => {
                var _a;
                //register the for loop variable
                (_a = node.parent.getSymbolTable()) === null || _a === void 0 ? void 0 : _a.addSymbol(node.item.text, node.item.range, DynamicType_1.DynamicType.instance);
            },
            NamespaceStatement: (node) => {
                this.validateDeclarationLocations(node, 'namespace', () => util_1.default.createBoundingRange(node.keyword, node.nameExpression));
                if (node.name) {
                    node.parent.getSymbolTable().addSymbol(node.name.split('.')[0], node.nameExpression.range, DynamicType_1.DynamicType.instance);
                }
            },
            FunctionStatement: (node) => {
                var _a;
                this.validateDeclarationLocations(node, 'function', () => util_1.default.createBoundingRange(node.func.functionType, node.name));
                if ((_a = node.name) === null || _a === void 0 ? void 0 : _a.text) {
                    node.parent.getSymbolTable().addSymbol(node.name.text, node.name.range, DynamicType_1.DynamicType.instance);
                }
                const namespace = node.findAncestor(reflection_1.isNamespaceStatement);
                //this function is declared inside a namespace
                if (namespace) {
                    //add the transpiled name for namespaced functions to the root symbol table
                    const transpiledNamespaceFunctionName = node.getName(Parser_1.ParseMode.BrightScript);
                    const funcType = node.func.getFunctionType();
                    funcType.setName(transpiledNamespaceFunctionName);
                    if (node.name) {
                        this.event.file.parser.ast.symbolTable.addSymbol(transpiledNamespaceFunctionName, node.name.range, funcType);
                    }
                }
            },
            FunctionExpression: (node) => {
                if (!node.symbolTable.hasSymbol('m')) {
                    node.symbolTable.addSymbol('m', undefined, DynamicType_1.DynamicType.instance);
                }
                this.validateFunctionParameterCount(node);
            },
            FunctionParameterExpression: (node) => {
                if (node.name) {
                    const paramName = node.name.text;
                    const symbolTable = node.getSymbolTable();
                    symbolTable === null || symbolTable === void 0 ? void 0 : symbolTable.addSymbol(paramName, node.name.range, node.type);
                }
            },
            InterfaceStatement: (node) => {
                var _a, _b;
                this.validateDeclarationLocations(node, 'interface', () => util_1.default.createBoundingRange(node.tokens.interface, node.tokens.name));
                if (node.tokens.name) {
                    (_b = (_a = node.parent) === null || _a === void 0 ? void 0 : _a.getSymbolTable()) === null || _b === void 0 ? void 0 : _b.addSymbol(node.tokens.name.text, node.tokens.name.range, new InterfaceType_1.InterfaceType(new Map()));
                }
            },
            ConstStatement: (node) => {
                this.validateDeclarationLocations(node, 'const', () => util_1.default.createBoundingRange(node.tokens.const, node.tokens.name));
                if (node.tokens.name) {
                    node.parent.getSymbolTable().addSymbol(node.tokens.name.text, node.tokens.name.range, DynamicType_1.DynamicType.instance);
                }
            },
            CatchStatement: (node) => {
                node.parent.getSymbolTable().addSymbol(node.exceptionVariable.text, node.exceptionVariable.range, DynamicType_1.DynamicType.instance);
            },
            DimStatement: (node) => {
                if (node.identifier) {
                    node.parent.getSymbolTable().addSymbol(node.identifier.text, node.identifier.range, DynamicType_1.DynamicType.instance);
                }
            },
            ReturnStatement: (node) => {
                var _a, _b, _c, _d;
                const func = node.findAncestor(reflection_1.isFunctionExpression);
                //these situations cannot have a value next to `return`
                if (
                //`function as void`, `sub as void`
                ((_a = func === null || func === void 0 ? void 0 : func.returnTypeToken) === null || _a === void 0 ? void 0 : _a.kind) === TokenKind_1.TokenKind.Void ||
                    //`sub` <without return value>
                    (((_b = func.functionType) === null || _b === void 0 ? void 0 : _b.kind) === TokenKind_1.TokenKind.Sub && !func.returnTypeToken)) {
                    //there may not be a return value
                    if (node.value) {
                        this.event.file.addDiagnostic(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.voidFunctionMayNotReturnValue((_c = func.functionType) === null || _c === void 0 ? void 0 : _c.text)), { range: node.range }));
                    }
                }
                else {
                    //there MUST be a return value
                    if (!node.value) {
                        this.event.file.addDiagnostic(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.nonVoidFunctionMustReturnValue((_d = func === null || func === void 0 ? void 0 : func.functionType) === null || _d === void 0 ? void 0 : _d.text)), { range: node.range }));
                    }
                }
            },
            ContinueStatement: (node) => {
                this.validateContinueStatement(node);
            }
        });
        this.event.file.ast.walk((node, parent) => {
            visitor(node, parent);
        }, {
            walkMode: visitors_1.WalkMode.visitAllRecursive
        });
    }
    /**
     * Validate that a statement is defined in one of these specific locations
     *  - the root of the AST
     *  - inside a namespace
     * This is applicable to things like FunctionStatement, ClassStatement, NamespaceStatement, EnumStatement, InterfaceStatement
     */
    validateDeclarationLocations(statement, keyword, rangeFactory) {
        var _a, _b, _c;
        //if nested inside a namespace, or defined at the root of the AST (i.e. in a body that has no parent)
        if ((0, reflection_1.isNamespaceStatement)((_a = statement.parent) === null || _a === void 0 ? void 0 : _a.parent) || ((0, reflection_1.isBody)(statement.parent) && !((_b = statement.parent) === null || _b === void 0 ? void 0 : _b.parent))) {
            return;
        }
        //the statement was defined in the wrong place. Flag it.
        this.event.file.addDiagnostic(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.keywordMustBeDeclaredAtNamespaceLevel(keyword)), { range: (_c = rangeFactory === null || rangeFactory === void 0 ? void 0 : rangeFactory()) !== null && _c !== void 0 ? _c : statement.range }));
    }
    validateFunctionParameterCount(func) {
        if (func.parameters.length > Expression_1.CallExpression.MaximumArguments) {
            //flag every parameter over the limit
            for (let i = Expression_1.CallExpression.MaximumArguments; i < func.parameters.length; i++) {
                this.event.file.addDiagnostic(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.tooManyCallableParameters(func.parameters.length, Expression_1.CallExpression.MaximumArguments)), { range: func.parameters[i].name.range }));
            }
        }
    }
    validateEnumDeclaration(stmt) {
        var _a, _b, _c, _d, _e;
        const members = stmt.getMembers();
        //the enum data type is based on the first member value
        const enumValueKind = (_d = (_c = (_b = (_a = members.find(x => x.value)) === null || _a === void 0 ? void 0 : _a.value) === null || _b === void 0 ? void 0 : _b.token) === null || _c === void 0 ? void 0 : _c.kind) !== null && _d !== void 0 ? _d : TokenKind_1.TokenKind.IntegerLiteral;
        const memberNames = new Set();
        for (const member of members) {
            const memberNameLower = (_e = member.name) === null || _e === void 0 ? void 0 : _e.toLowerCase();
            /**
             * flag duplicate member names
             */
            if (memberNames.has(memberNameLower)) {
                this.event.file.addDiagnostic(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.duplicateIdentifier(member.name)), { range: member.range }));
            }
            else {
                memberNames.add(memberNameLower);
            }
            //Enforce all member values are the same type
            this.validateEnumValueTypes(member, enumValueKind);
        }
    }
    validateEnumValueTypes(member, enumValueKind) {
        var _a, _b, _c, _d, _e, _f, _g;
        let memberValueKind;
        let memberValue;
        if ((0, reflection_1.isUnaryExpression)(member.value)) {
            memberValueKind = (_c = (_b = (_a = member.value) === null || _a === void 0 ? void 0 : _a.right) === null || _b === void 0 ? void 0 : _b.token) === null || _c === void 0 ? void 0 : _c.kind;
            memberValue = (_d = member.value) === null || _d === void 0 ? void 0 : _d.right;
        }
        else {
            memberValueKind = (_f = (_e = member.value) === null || _e === void 0 ? void 0 : _e.token) === null || _f === void 0 ? void 0 : _f.kind;
            memberValue = member.value;
        }
        const range = (_g = (memberValue !== null && memberValue !== void 0 ? memberValue : member)) === null || _g === void 0 ? void 0 : _g.range;
        if (
        //is integer enum, has value, that value type is not integer
        (enumValueKind === TokenKind_1.TokenKind.IntegerLiteral && memberValueKind && memberValueKind !== enumValueKind) ||
            //has value, that value is not a literal
            (memberValue && !(0, reflection_1.isLiteralExpression)(memberValue))) {
            this.event.file.addDiagnostic(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.enumValueMustBeType(enumValueKind.replace(/literal$/i, '').toLowerCase())), { range: range }));
        }
        //is non integer value
        if (enumValueKind !== TokenKind_1.TokenKind.IntegerLiteral) {
            //default value present
            if (memberValueKind) {
                //member value is same as enum
                if (memberValueKind !== enumValueKind) {
                    this.event.file.addDiagnostic(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.enumValueMustBeType(enumValueKind.replace(/literal$/i, '').toLowerCase())), { range: range }));
                }
                //default value missing
            }
            else {
                this.event.file.addDiagnostic(Object.assign(Object.assign({ file: this.event.file }, DiagnosticMessages_1.DiagnosticMessages.enumValueIsRequired(enumValueKind.replace(/literal$/i, '').toLowerCase())), { range: range }));
            }
        }
    }
    /**
     * Find statements defined at the top level (or inside a namespace body) that are not allowed to be there
     */
    flagTopLevelStatements() {
        const statements = [...this.event.file.ast.statements];
        while (statements.length > 0) {
            const statement = statements.pop();
            if ((0, reflection_1.isNamespaceStatement)(statement)) {
                statements.push(...statement.body.statements);
            }
            else {
                //only allow these statement types
                if (!(0, reflection_1.isFunctionStatement)(statement) &&
                    !(0, reflection_1.isClassStatement)(statement) &&
                    !(0, reflection_1.isEnumStatement)(statement) &&
                    !(0, reflection_1.isInterfaceStatement)(statement) &&
                    !(0, reflection_1.isCommentStatement)(statement) &&
                    !(0, reflection_1.isLibraryStatement)(statement) &&
                    !(0, reflection_1.isImportStatement)(statement) &&
                    !(0, reflection_1.isConstStatement)(statement) &&
                    !(0, reflection_1.isTypecastStatement)(statement) &&
                    !(0, reflection_1.isAliasStatement)(statement)) {
                    this.event.file.addDiagnostic(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.unexpectedStatementOutsideFunction()), { range: statement.range }));
                }
            }
        }
    }
    validateImportStatements() {
        let topOfFileIncludeStatements = [];
        for (let stmt of this.event.file.parser.ast.statements) {
            //skip comments
            if ((0, reflection_1.isCommentStatement)(stmt)) {
                continue;
            }
            //if we found a non-library statement, this statement is not at the top of the file
            if ((0, reflection_1.isLibraryStatement)(stmt) || (0, reflection_1.isImportStatement)(stmt)) {
                topOfFileIncludeStatements.push(stmt);
            }
            else {
                //break out of the loop, we found all of our library statements
                break;
            }
        }
        let statements = [
            // eslint-disable-next-line @typescript-eslint/dot-notation
            ...this.event.file['_parser'].references.libraryStatements,
            // eslint-disable-next-line @typescript-eslint/dot-notation
            ...this.event.file['_parser'].references.importStatements
        ];
        for (let result of statements) {
            //if this statement is not one of the top-of-file statements,
            //then add a diagnostic explaining that it is invalid
            if (!topOfFileIncludeStatements.includes(result)) {
                if ((0, reflection_1.isLibraryStatement)(result)) {
                    this.event.file.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.libraryStatementMustBeDeclaredAtTopOfFile()), { range: result.range, file: this.event.file }));
                }
                else if ((0, reflection_1.isImportStatement)(result)) {
                    this.event.file.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.importStatementMustBeDeclaredAtTopOfFile()), { range: result.range, file: this.event.file }));
                }
            }
        }
    }
    validateContinueStatement(statement) {
        const validateLoopTypeMatch = (expectedLoopType) => {
            var _a;
            //coerce ForEach to For
            expectedLoopType = expectedLoopType === TokenKind_1.TokenKind.ForEach ? TokenKind_1.TokenKind.For : expectedLoopType;
            const actualLoopType = statement.tokens.loopType;
            if (actualLoopType && (expectedLoopType === null || expectedLoopType === void 0 ? void 0 : expectedLoopType.toLowerCase()) !== ((_a = actualLoopType.text) === null || _a === void 0 ? void 0 : _a.toLowerCase())) {
                this.event.file.addDiagnostic(Object.assign({ range: statement.tokens.loopType.range }, DiagnosticMessages_1.DiagnosticMessages.expectedToken(expectedLoopType)));
            }
        };
        //find the parent loop statement
        const parent = statement.findAncestor((node) => {
            if ((0, reflection_1.isWhileStatement)(node)) {
                validateLoopTypeMatch(node.tokens.while.kind);
                return true;
            }
            else if ((0, reflection_1.isForStatement)(node)) {
                validateLoopTypeMatch(node.forToken.kind);
                return true;
            }
            else if ((0, reflection_1.isForEachStatement)(node)) {
                validateLoopTypeMatch(node.tokens.forEach.kind);
                return true;
            }
        });
        //flag continue statements found outside of a loop
        if (!parent) {
            this.event.file.addDiagnostic(Object.assign({ range: statement.range }, DiagnosticMessages_1.DiagnosticMessages.illegalContinueStatement()));
        }
    }
    /**
     * Validate that there are no optional chaining operators on the left-hand-side of an assignment, indexed set, or dotted get
     */
    validateNoOptionalChainingInVarSet(parent, children) {
        var _a, _b, _c, _d;
        const nodes = [...children, parent];
        //flag optional chaining anywhere in the left of this statement
        while (nodes.length > 0) {
            const node = nodes.shift();
            if (
            // a?.b = true or a.b?.c = true
            (((0, reflection_1.isDottedSetStatement)(node) || (0, reflection_1.isDottedGetExpression)(node)) && ((_a = node.dot) === null || _a === void 0 ? void 0 : _a.kind) === TokenKind_1.TokenKind.QuestionDot) ||
                // a.b?[2] = true
                ((0, reflection_1.isIndexedGetExpression)(node) && (((_b = node === null || node === void 0 ? void 0 : node.questionDotToken) === null || _b === void 0 ? void 0 : _b.kind) === TokenKind_1.TokenKind.QuestionDot || ((_c = node.openingSquare) === null || _c === void 0 ? void 0 : _c.kind) === TokenKind_1.TokenKind.QuestionLeftSquare)) ||
                // a?[1] = true
                ((0, reflection_1.isIndexedSetStatement)(node) && ((_d = node.openingSquare) === null || _d === void 0 ? void 0 : _d.kind) === TokenKind_1.TokenKind.QuestionLeftSquare)) {
                //try to highlight the entire left-hand-side expression if possible
                let range;
                if ((0, reflection_1.isDottedSetStatement)(parent)) {
                    range = util_1.default.createBoundingRange(parent.obj, parent.dot, parent.name);
                }
                else if ((0, reflection_1.isIndexedSetStatement)(parent)) {
                    range = util_1.default.createBoundingRange(parent.obj, parent.openingSquare, parent.index, parent.closingSquare);
                }
                else {
                    range = node.range;
                }
                this.event.file.addDiagnostic(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.noOptionalChainingInLeftHandSideOfAssignment()), { range: range }));
            }
            if (node === parent) {
                break;
            }
            else {
                nodes.push(node.parent);
            }
        }
    }
}
exports.BrsFileValidator = BrsFileValidator;
//# sourceMappingURL=BrsFileValidator.js.map
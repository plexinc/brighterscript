"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrsFilePreTranspileProcessor = void 0;
const creators_1 = require("../../astUtils/creators");
const reflection_1 = require("../../astUtils/reflection");
const visitors_1 = require("../../astUtils/visitors");
const TokenKind_1 = require("../../lexer/TokenKind");
const Expression_1 = require("../../parser/Expression");
const Parser_1 = require("../../parser/Parser");
const util_1 = require("../../util");
class BrsFilePreTranspileProcessor {
    constructor(event) {
        this.event = event;
    }
    process() {
        if ((0, reflection_1.isBrsFile)(this.event.file)) {
            this.iterateExpressions();
        }
    }
    iterateExpressions() {
        const scope = this.event.program.getFirstScopeForFile(this.event.file);
        //TODO move away from this loop and use a visitor instead
        for (let expression of this.event.file.parser.references.expressions) {
            if (expression) {
                if ((0, reflection_1.isUnaryExpression)(expression)) {
                    this.processExpression(expression.right, scope);
                }
                else {
                    this.processExpression(expression, scope);
                }
            }
        }
        const walkMode = visitors_1.WalkMode.visitExpressionsRecursive;
        const visitor = (0, visitors_1.createVisitor)({
            TernaryExpression: (ternaryExpression) => {
                this.processTernaryExpression(ternaryExpression, visitor, walkMode);
            }
        });
        this.event.file.ast.walk(visitor, { walkMode: walkMode });
    }
    processTernaryExpression(ternaryExpression, visitor, walkMode) {
        var _a, _b;
        function getOwnerAndKey(statement) {
            const parent = statement.parent;
            if ((0, reflection_1.isBlock)(parent) || (0, reflection_1.isBody)(parent)) {
                let idx = parent.statements.indexOf(statement);
                if (idx > -1) {
                    return { owner: parent.statements, key: idx };
                }
            }
        }
        //if the ternary expression is part of a simple assignment, rewrite it as an `IfStatement`
        let parent = ternaryExpression.findAncestor(x => !(0, reflection_1.isGroupingExpression)(x));
        let operator;
        //operators like `+=` will cause the RHS to be a BinaryExpression  due to how the parser handles this. let's do a little magic to detect this situation
        if (
        //parent is a binary expression
        (0, reflection_1.isBinaryExpression)(parent) &&
            (((0, reflection_1.isAssignmentStatement)(parent.parent) && (0, reflection_1.isVariableExpression)(parent.left) && parent.left.name === parent.parent.name) ||
                ((0, reflection_1.isDottedSetStatement)(parent.parent) && (0, reflection_1.isDottedGetExpression)(parent.left) && parent.left.name === parent.parent.name) ||
                ((0, reflection_1.isIndexedSetStatement)(parent.parent) && (0, reflection_1.isIndexedGetExpression)(parent.left) && parent.left.index === parent.parent.index))) {
            //keep the correct operator (i.e. `+=`)
            operator = parent.operator;
            //use the outer parent and skip this BinaryExpression
            parent = parent.parent;
        }
        let ifStatement;
        if ((0, reflection_1.isAssignmentStatement)(parent)) {
            ifStatement = (0, creators_1.createIfStatement)({
                if: (0, creators_1.createToken)(TokenKind_1.TokenKind.If, 'if', ternaryExpression.questionMarkToken.range),
                condition: ternaryExpression.test,
                then: (0, creators_1.createToken)(TokenKind_1.TokenKind.Then, 'then', ternaryExpression.questionMarkToken.range),
                thenBranch: (0, creators_1.createBlock)({
                    statements: [
                        (0, creators_1.createAssignmentStatement)({
                            name: parent.name,
                            equals: operator !== null && operator !== void 0 ? operator : parent.equals,
                            value: ternaryExpression.consequent
                        })
                    ]
                }),
                else: (0, creators_1.createToken)(TokenKind_1.TokenKind.Else, 'else', ternaryExpression.questionMarkToken.range),
                elseBranch: (0, creators_1.createBlock)({
                    statements: [
                        (0, creators_1.createAssignmentStatement)({
                            name: parent.name,
                            equals: operator !== null && operator !== void 0 ? operator : parent.equals,
                            value: ternaryExpression.alternate
                        })
                    ]
                }),
                endIf: (0, creators_1.createToken)(TokenKind_1.TokenKind.EndIf, 'end if', ternaryExpression.questionMarkToken.range)
            });
        }
        else if ((0, reflection_1.isDottedSetStatement)(parent)) {
            ifStatement = (0, creators_1.createIfStatement)({
                if: (0, creators_1.createToken)(TokenKind_1.TokenKind.If, 'if', ternaryExpression.questionMarkToken.range),
                condition: ternaryExpression.test,
                then: (0, creators_1.createToken)(TokenKind_1.TokenKind.Then, 'then', ternaryExpression.questionMarkToken.range),
                thenBranch: (0, creators_1.createBlock)({
                    statements: [
                        (0, creators_1.createDottedSetStatement)({
                            obj: parent.obj,
                            name: parent.name,
                            equals: operator !== null && operator !== void 0 ? operator : parent.equals,
                            value: ternaryExpression.consequent
                        })
                    ]
                }),
                else: (0, creators_1.createToken)(TokenKind_1.TokenKind.Else, 'else', ternaryExpression.questionMarkToken.range),
                elseBranch: (0, creators_1.createBlock)({
                    statements: [
                        (0, creators_1.createDottedSetStatement)({
                            obj: parent.obj,
                            name: parent.name,
                            equals: operator !== null && operator !== void 0 ? operator : parent.equals,
                            value: ternaryExpression.alternate
                        })
                    ]
                }),
                endIf: (0, creators_1.createToken)(TokenKind_1.TokenKind.EndIf, 'end if', ternaryExpression.questionMarkToken.range)
            });
            //if this is an indexedSetStatement, and the ternary expression is NOT an index
        }
        else if ((0, reflection_1.isIndexedSetStatement)(parent) && parent.index !== ternaryExpression && !((_a = parent.additionalIndexes) === null || _a === void 0 ? void 0 : _a.includes(ternaryExpression))) {
            ifStatement = (0, creators_1.createIfStatement)({
                if: (0, creators_1.createToken)(TokenKind_1.TokenKind.If, 'if', ternaryExpression.questionMarkToken.range),
                condition: ternaryExpression.test,
                then: (0, creators_1.createToken)(TokenKind_1.TokenKind.Then, 'then', ternaryExpression.questionMarkToken.range),
                thenBranch: (0, creators_1.createBlock)({
                    statements: [
                        (0, creators_1.createIndexedSetStatement)({
                            obj: parent.obj,
                            openingSquare: parent.openingSquare,
                            index: parent.index,
                            closingSquare: parent.closingSquare,
                            equals: operator !== null && operator !== void 0 ? operator : parent.equals,
                            value: ternaryExpression.consequent,
                            additionalIndexes: parent.additionalIndexes
                        })
                    ]
                }),
                else: (0, creators_1.createToken)(TokenKind_1.TokenKind.Else, 'else', ternaryExpression.questionMarkToken.range),
                elseBranch: (0, creators_1.createBlock)({
                    statements: [
                        (0, creators_1.createIndexedSetStatement)({
                            obj: parent.obj,
                            openingSquare: parent.openingSquare,
                            index: parent.index,
                            closingSquare: parent.closingSquare,
                            equals: operator !== null && operator !== void 0 ? operator : parent.equals,
                            value: ternaryExpression.alternate,
                            additionalIndexes: parent.additionalIndexes
                        })
                    ]
                }),
                endIf: (0, creators_1.createToken)(TokenKind_1.TokenKind.EndIf, 'end if', ternaryExpression.questionMarkToken.range)
            });
        }
        if (ifStatement) {
            let { owner, key } = (_b = getOwnerAndKey(parent)) !== null && _b !== void 0 ? _b : {};
            if (owner && key !== undefined) {
                this.event.editor.setProperty(owner, key, ifStatement);
            }
            //we've injected an ifStatement, so now we need to trigger a walk to handle any nested ternary expressions
            ifStatement.walk(visitor, { walkMode: walkMode });
        }
    }
    /**
     * Given a string optionally separated by dots, find an enum related to it.
     * For example, all of these would return the enum: `SomeNamespace.SomeEnum.SomeMember`, SomeEnum.SomeMember, `SomeEnum`
     */
    getEnumInfo(name, containingNamespace, scope) {
        //do we have an enum MEMBER reference? (i.e. SomeEnum.someMember or SomeNamespace.SomeEnum.SomeMember)
        let memberLink = scope === null || scope === void 0 ? void 0 : scope.getEnumMemberFileLink(name, containingNamespace);
        if (memberLink) {
            const value = memberLink.item.getValue();
            return {
                enum: memberLink.item.parent,
                value: new Expression_1.LiteralExpression((0, creators_1.createToken)(
                //just use float literal for now...it will transpile properly with any literal value
                value.startsWith('"') ? TokenKind_1.TokenKind.StringLiteral : TokenKind_1.TokenKind.FloatLiteral, value))
            };
        }
        //do we have an enum reference? (i.e. SomeEnum or SomeNamespace.SomeEnum)
        let enumLink = scope === null || scope === void 0 ? void 0 : scope.getEnumFileLink(name, containingNamespace);
        if (enumLink) {
            return {
                enum: enumLink.item
            };
        }
    }
    /**
     * Recursively resolve a const or enum value until we get to the final resolved expression
     * Returns an object with the resolved value and a flag indicating if a circular reference was detected
     */
    resolveConstValue(value, scope, containingNamespace, visited = new Set()) {
        var _a, _b, _c, _d;
        // If it's already a literal, return it as-is
        if ((0, reflection_1.isLiteralExpression)(value)) {
            return { value: value, isCircular: false };
        }
        // If it's a variable expression, try to resolve it as a const or enum
        if ((0, reflection_1.isVariableExpression)(value)) {
            const entityName = value.name.text.toLowerCase();
            // Prevent infinite recursion by tracking visited constants
            if (visited.has(entityName)) {
                return { value: value, isCircular: true }; // Return the original value to avoid infinite loop
            }
            visited.add(entityName);
            // Try to resolve as const first
            const constStatement = (_a = scope === null || scope === void 0 ? void 0 : scope.getConstFileLink(entityName, containingNamespace)) === null || _a === void 0 ? void 0 : _a.item;
            if (constStatement) {
                // Recursively resolve the const value
                return this.resolveConstValue(constStatement.value, scope, containingNamespace, visited);
            }
            // Try to resolve as enum member
            const enumInfo = this.getEnumInfo(entityName, containingNamespace, scope);
            if (enumInfo === null || enumInfo === void 0 ? void 0 : enumInfo.value) {
                // Enum values are already resolved to literals by getEnumInfo
                return { value: enumInfo.value, isCircular: false };
            }
        }
        // If it's a dotted get expression (e.g., namespace.const or namespace.enum.member), try to resolve it
        if ((0, reflection_1.isDottedGetExpression)(value)) {
            const parts = util_1.default.splitExpression(value);
            const processedNames = [];
            for (let part of parts) {
                if ((0, reflection_1.isVariableExpression)(part) || (0, reflection_1.isDottedGetExpression)(part)) {
                    processedNames.push((_c = (_b = part === null || part === void 0 ? void 0 : part.name) === null || _b === void 0 ? void 0 : _b.text) === null || _c === void 0 ? void 0 : _c.toLowerCase());
                }
                else {
                    return { value: value, isCircular: false }; // Can't resolve further
                }
            }
            const entityName = processedNames.join('.');
            // Prevent infinite recursion
            if (visited.has(entityName)) {
                return { value: value, isCircular: true };
            }
            visited.add(entityName);
            // Try to resolve as const first
            const constStatement = (_d = scope === null || scope === void 0 ? void 0 : scope.getConstFileLink(entityName, containingNamespace)) === null || _d === void 0 ? void 0 : _d.item;
            if (constStatement) {
                // Recursively resolve the const value
                return this.resolveConstValue(constStatement.value, scope, containingNamespace, visited);
            }
            // Try to resolve as enum member
            const enumInfo = this.getEnumInfo(entityName, containingNamespace, scope);
            if (enumInfo === null || enumInfo === void 0 ? void 0 : enumInfo.value) {
                // Enum values are already resolved to literals by getEnumInfo
                return { value: enumInfo.value, isCircular: false };
            }
        }
        // Return the value as-is if we can't resolve it further
        return { value: value, isCircular: false };
    }
    processExpression(ternaryExpression, scope) {
        var _a, _b, _c, _d;
        let containingNamespace = (_a = this.event.file.getNamespaceStatementForPosition(ternaryExpression.range.start)) === null || _a === void 0 ? void 0 : _a.getName(Parser_1.ParseMode.BrighterScript);
        const parts = util_1.default.splitExpression(ternaryExpression);
        const processedNames = [];
        for (let part of parts) {
            let entityName;
            if ((0, reflection_1.isVariableExpression)(part) || (0, reflection_1.isDottedGetExpression)(part)) {
                processedNames.push((_c = (_b = part === null || part === void 0 ? void 0 : part.name) === null || _b === void 0 ? void 0 : _b.text) === null || _c === void 0 ? void 0 : _c.toLocaleLowerCase());
                entityName = processedNames.join('.');
            }
            else {
                return;
            }
            let value;
            let isCircular = false;
            //did we find a const? transpile the value
            let constStatement = (_d = scope === null || scope === void 0 ? void 0 : scope.getConstFileLink(entityName, containingNamespace)) === null || _d === void 0 ? void 0 : _d.item;
            if (constStatement) {
                // Recursively resolve the const value to its final form
                const resolved = this.resolveConstValue(constStatement.value, scope, containingNamespace);
                value = resolved.value;
                isCircular = resolved.isCircular;
            }
            else {
                //did we find an enum member? transpile that
                let enumInfo = this.getEnumInfo(entityName, containingNamespace, scope);
                if (enumInfo === null || enumInfo === void 0 ? void 0 : enumInfo.value) {
                    value = enumInfo.value;
                }
            }
            if (value && !isCircular) {
                //override the transpile for this item.
                this.event.editor.setProperty(part, 'transpile', (state) => {
                    if ((0, reflection_1.isLiteralExpression)(value)) {
                        return value.transpile(state);
                    }
                    else {
                        //wrap non-literals with parens to prevent on-device compile errors
                        return ['(', ...value.transpile(state), ')'];
                    }
                });
                //we are finished handling this expression
                return;
            }
        }
    }
}
exports.BrsFilePreTranspileProcessor = BrsFilePreTranspileProcessor;
//# sourceMappingURL=BrsFilePreTranspileProcessor.js.map
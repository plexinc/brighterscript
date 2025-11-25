"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallExpressionInfo = exports.CallExpressionType = void 0;
const reflection_1 = require("../astUtils/reflection");
const util_1 = require("../util");
const Parser_1 = require("../parser/Parser");
var CallExpressionType;
(function (CallExpressionType) {
    CallExpressionType["namespaceCall"] = "namespaceCall";
    CallExpressionType["call"] = "call";
    CallExpressionType["callFunc"] = "callFunc";
    CallExpressionType["constructorCall"] = "constructorCall";
    CallExpressionType["myClassCall"] = "myClassCall";
    CallExpressionType["otherClassCall"] = "otherClassCall";
    CallExpressionType["unknown"] = "unknown";
})(CallExpressionType = exports.CallExpressionType || (exports.CallExpressionType = {}));
//Util Class, for extracting info about an expression, which can be used in the IDE
class CallExpressionInfo {
    constructor(file, position) {
        this.expression = file.ast.findChildAtPosition(position);
        this.file = file;
        this.position = position;
        this.process();
    }
    process() {
        this.callExpression = this.ascertainCallExpression();
        let callExpression = this.callExpression;
        if (!callExpression) {
            this.type = CallExpressionType.unknown;
            return;
        }
        if (!this.isPositionBetweenParentheses()) {
            return;
        }
        this.isCallingMethodOnMyClass = false;
        if ((0, reflection_1.isNewExpression)(callExpression.parent)) {
            this.name = callExpression.parent.className.getName(Parser_1.ParseMode.BrighterScript);
            this.newExpression = callExpression.parent;
        }
        if ((0, reflection_1.isCallfuncExpression)(callExpression)) {
            this.name = callExpression.methodName.text;
        }
        else if ((0, reflection_1.isVariableExpression)(callExpression.callee)) {
            this.name = callExpression.callee.name.text;
        }
        else if ((0, reflection_1.isVariableExpression)(callExpression)) {
            this.name = callExpression.name.text;
        }
        else if ((0, reflection_1.isDottedGetExpression)(callExpression.callee)) {
            this.name = callExpression.callee.name.text;
            if ((0, reflection_1.isDottedGetExpression)(callExpression.callee) && (0, reflection_1.isVariableExpression)(callExpression.callee.obj)) {
                this.isCallingMethodOnMyClass = callExpression.callee.obj.name.text === 'm';
            }
            else {
                let parts = util_1.util.getAllDottedGetParts(callExpression.callee);
                if (parts) {
                    parts.splice((parts === null || parts === void 0 ? void 0 : parts.length) - 1, 1);
                    this.dotPart = parts.map(x => x.text).join('.');
                    this.namespace = this.getNamespace();
                }
            }
        }
        this.myClass = this.expression.findAncestor(reflection_1.isClassStatement);
        this.type = this.ascertainType();
        this.parameterIndex = this.getParameterIndex();
    }
    isPositionBetweenParentheses() {
        if (!this.callExpression) {
            return false;
        }
        let boundingRange = util_1.util.createBoundingRange(this.callExpression.openingParen, this.callExpression.closingParen);
        return util_1.util.rangeContains(boundingRange, this.position);
    }
    ascertainCallExpression() {
        var _a, _b;
        let expression = this.expression;
        function isCallFuncOrCallExpression(expression) {
            return (0, reflection_1.isCallfuncExpression)(expression) || (0, reflection_1.isCallExpression)(expression);
        }
        let callExpression = expression === null || expression === void 0 ? void 0 : expression.findAncestor(isCallFuncOrCallExpression);
        if (callExpression && callExpression.callee === expression) {
            //this expression is the NAME of a CallExpression
            callExpression = (_a = expression.parent) === null || _a === void 0 ? void 0 : _a.findAncestor(isCallFuncOrCallExpression);
        }
        else if ((0, reflection_1.isDottedGetExpression)(expression === null || expression === void 0 ? void 0 : expression.parent) && ((_b = expression === null || expression === void 0 ? void 0 : expression.parent) === null || _b === void 0 ? void 0 : _b.parent) === callExpression) {
            callExpression = callExpression.findAncestor(isCallFuncOrCallExpression);
        }
        if (!callExpression && (0, reflection_1.isCallExpression)(expression)) {
            //let's check to see if we are in a space, in the args of a valid CallExpression
            let boundingRange = util_1.util.createBoundingRange(expression.openingParen, expression.closingParen);
            if (util_1.util.rangeContains(boundingRange, this.position)) {
                callExpression = expression;
            }
        }
        return callExpression;
    }
    ascertainType() {
        if (this.name) {
            //General case, for function calls
            if (this.newExpression) {
                return CallExpressionType.constructorCall;
            }
            else if (this.isCallingMethodOnMyClass && this.myClass) {
                return CallExpressionType.myClassCall;
            }
            else if (!this.namespace && (0, reflection_1.isDottedGetExpression)(this.callExpression)) {
                return CallExpressionType.otherClassCall;
            }
            else if ((0, reflection_1.isCallfuncExpression)(this.callExpression)) {
                return CallExpressionType.callFunc;
            }
            else if (this.namespace) {
                return CallExpressionType.namespaceCall;
            }
            else {
                return CallExpressionType.call;
            }
        }
        return CallExpressionType.unknown;
    }
    getNamespace() {
        let scope = this.file.program.getFirstScopeForFile(this.file);
        return scope.namespaceLookup.get(this.dotPart);
    }
    getParameterIndex() {
        if (!this.callExpression || !this.callExpression.args) {
            return 0;
        }
        for (let i = this.callExpression.args.length - 1; i > -1; i--) {
            let argExpression = this.callExpression.args[i];
            let comparison = util_1.util.comparePositionToRange(this.position, argExpression.range);
            if (comparison >= 0) {
                return i + comparison;
            }
        }
        return 0;
    }
}
exports.CallExpressionInfo = CallExpressionInfo;
//# sourceMappingURL=CallExpressionInfo.js.map
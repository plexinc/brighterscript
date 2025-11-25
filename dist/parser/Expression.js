"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeCastExpression = exports.RegexLiteralExpression = exports.NullCoalescingExpression = exports.TernaryExpression = exports.AnnotationExpression = exports.TaggedTemplateStringExpression = exports.TemplateStringExpression = exports.TemplateStringQuasiExpression = exports.CallfuncExpression = exports.NewExpression = exports.SourceLiteralExpression = exports.VariableExpression = exports.UnaryExpression = exports.AALiteralExpression = exports.AAMemberExpression = exports.ArrayLiteralExpression = exports.EscapedCharCodeLiteralExpression = exports.LiteralExpression = exports.GroupingExpression = exports.IndexedGetExpression = exports.XmlAttributeGetExpression = exports.DottedGetExpression = exports.NamespacedVariableNameExpression = exports.FunctionParameterExpression = exports.FunctionExpression = exports.CallExpression = exports.BinaryExpression = void 0;
const TokenKind_1 = require("../lexer/TokenKind");
const util_1 = require("../util");
const Parser_1 = require("./Parser");
const fileUrl = require("file-url");
const visitors_1 = require("../astUtils/visitors");
const visitors_2 = require("../astUtils/visitors");
const reflection_1 = require("../astUtils/reflection");
const VoidType_1 = require("../types/VoidType");
const DynamicType_1 = require("../types/DynamicType");
const FunctionType_1 = require("../types/FunctionType");
const AstNode_1 = require("./AstNode");
const SymbolTable_1 = require("../SymbolTable");
const source_map_1 = require("source-map");
class BinaryExpression extends AstNode_1.Expression {
    constructor(left, operator, right) {
        super();
        this.left = left;
        this.operator = operator;
        this.right = right;
        this.range = util_1.default.createBoundingRange(this.left, this.operator, this.right);
    }
    transpile(state) {
        return [
            state.sourceNode(this.left, this.left.transpile(state)),
            ' ',
            state.transpileToken(this.operator),
            ' ',
            state.sourceNode(this.right, this.right.transpile(state))
        ];
    }
    walk(visitor, options) {
        if (options.walkMode & visitors_2.InternalWalkMode.walkExpressions) {
            (0, visitors_2.walk)(this, 'left', visitor, options);
            (0, visitors_2.walk)(this, 'right', visitor, options);
        }
    }
    clone() {
        var _a, _b;
        return this.finalizeClone(new BinaryExpression((_a = this.left) === null || _a === void 0 ? void 0 : _a.clone(), util_1.default.cloneToken(this.operator), (_b = this.right) === null || _b === void 0 ? void 0 : _b.clone()), ['left', 'right']);
    }
}
exports.BinaryExpression = BinaryExpression;
class CallExpression extends AstNode_1.Expression {
    constructor(callee, 
    /**
     * Can either be `(`, or `?(` for optional chaining
     */
    openingParen, closingParen, args, unused) {
        super();
        this.callee = callee;
        this.openingParen = openingParen;
        this.closingParen = closingParen;
        this.args = args;
        this.range = util_1.default.createBoundingRange(this.callee, this.openingParen, ...args !== null && args !== void 0 ? args : [], this.closingParen);
    }
    /**
     * Get the name of the wrapping namespace (if it exists)
     * @deprecated use `.findAncestor(isNamespaceStatement)` instead.
     */
    get namespaceName() {
        var _a;
        return (_a = this.findAncestor(reflection_1.isNamespaceStatement)) === null || _a === void 0 ? void 0 : _a.nameExpression;
    }
    transpile(state, nameOverride) {
        let result = [];
        //transpile the name
        if (nameOverride) {
            result.push(state.sourceNode(this.callee, nameOverride));
        }
        else {
            result.push(...this.callee.transpile(state));
        }
        result.push(state.transpileToken(this.openingParen));
        for (let i = 0; i < this.args.length; i++) {
            //add comma between args
            if (i > 0) {
                result.push(', ');
            }
            let arg = this.args[i];
            result.push(...arg.transpile(state));
        }
        if (this.closingParen) {
            result.push(state.transpileToken(this.closingParen));
        }
        return result;
    }
    walk(visitor, options) {
        if (options.walkMode & visitors_2.InternalWalkMode.walkExpressions) {
            (0, visitors_2.walk)(this, 'callee', visitor, options);
            (0, visitors_2.walkArray)(this.args, visitor, options, this);
        }
    }
    clone() {
        var _a, _b;
        return this.finalizeClone(new CallExpression((_a = this.callee) === null || _a === void 0 ? void 0 : _a.clone(), util_1.default.cloneToken(this.openingParen), util_1.default.cloneToken(this.closingParen), (_b = this.args) === null || _b === void 0 ? void 0 : _b.map(e => e === null || e === void 0 ? void 0 : e.clone())), ['callee', 'args']);
    }
}
exports.CallExpression = CallExpression;
/**
 * Number of parameters that can be defined on a function
 *
 * Prior to Roku OS 11.5, this was 32
 * As of Roku OS 11.5, this is 63
 */
CallExpression.MaximumArguments = 63;
class FunctionExpression extends AstNode_1.Expression {
    constructor(parameters, body, functionType, end, leftParen, rightParen, asToken, returnTypeToken) {
        super();
        this.parameters = parameters;
        this.body = body;
        this.functionType = functionType;
        this.end = end;
        this.leftParen = leftParen;
        this.rightParen = rightParen;
        this.asToken = asToken;
        this.returnTypeToken = returnTypeToken;
        /**
         * The list of function calls that are declared within this function scope. This excludes CallExpressions
         * declared in child functions
         */
        this.callExpressions = [];
        this.setReturnType(); // set the initial return type that we parse
        //if there's a body, and it doesn't have a SymbolTable, assign one
        if (this.body && !this.body.symbolTable) {
            this.body.symbolTable = new SymbolTable_1.SymbolTable(`Function Body`);
        }
        this.symbolTable = new SymbolTable_1.SymbolTable('FunctionExpression', () => { var _a; return (_a = this.parent) === null || _a === void 0 ? void 0 : _a.getSymbolTable(); });
    }
    /**
     * Get the name of the wrapping namespace (if it exists)
     * @deprecated use `.findAncestor(isNamespaceStatement)` instead.
     */
    get namespaceName() {
        var _a;
        return (_a = this.findAncestor(reflection_1.isNamespaceStatement)) === null || _a === void 0 ? void 0 : _a.nameExpression;
    }
    /**
     * Get the name of the wrapping namespace (if it exists)
     * @deprecated use `.findAncestor(isFunctionExpression)` instead.
     */
    get parentFunction() {
        return this.findAncestor(reflection_1.isFunctionExpression);
    }
    /**
     * A list of all child functions declared directly within this function
     * @deprecated use `.walk(createVisitor({ FunctionExpression: ()=>{}), { walkMode: WalkMode.visitAllRecursive })` instead
     */
    get childFunctionExpressions() {
        const expressions = [];
        this.walk((0, visitors_1.createVisitor)({
            FunctionExpression: (expression) => {
                expressions.push(expression);
            }
        }), {
            walkMode: visitors_1.WalkMode.visitAllRecursive
        });
        return expressions;
    }
    /**
     * The range of the function, starting at the 'f' in function or 's' in sub (or the open paren if the keyword is missing),
     * and ending with the last n' in 'end function' or 'b' in 'end sub'
     */
    get range() {
        var _a;
        return util_1.default.createBoundingRange(this.functionType, this.leftParen, ...(_a = this.parameters) !== null && _a !== void 0 ? _a : [], this.rightParen, this.asToken, this.returnTypeToken, this.end);
    }
    transpile(state, name, includeBody = true) {
        let results = [];
        //'function'|'sub'
        results.push(state.transpileToken(this.functionType));
        //functionName?
        if (name) {
            results.push(' ', state.transpileToken(name));
        }
        //leftParen
        results.push(state.transpileToken(this.leftParen));
        //parameters
        for (let i = 0; i < this.parameters.length; i++) {
            let param = this.parameters[i];
            //add commas
            if (i > 0) {
                results.push(', ');
            }
            //add parameter
            results.push(param.transpile(state));
        }
        //right paren
        results.push(state.transpileToken(this.rightParen));
        //as [Type]
        this.setReturnType(); // check one more time before transpile
        if (this.asToken && !(state.options.removeParameterTypes && !this.requiresReturnType)) {
            results.push(' ', 
            //as
            state.transpileToken(this.asToken), ' ', 
            //return type
            state.sourceNode(this.returnTypeToken, this.returnType.toTypeString()));
        }
        if (includeBody) {
            state.lineage.unshift(this);
            let body = this.body.transpile(state);
            state.lineage.shift();
            results.push(...body);
        }
        results.push('\n');
        //'end sub'|'end function'
        results.push(state.indent(), state.transpileToken(this.end));
        return results;
    }
    getTypedef(state) {
        var _a, _b, _c, _d, _e, _f;
        let results = [
            new source_map_1.SourceNode(1, 0, null, [
                //'function'|'sub'
                (_a = this.functionType) === null || _a === void 0 ? void 0 : _a.text,
                //functionName?
                ...((0, reflection_1.isFunctionStatement)(this.parent) || (0, reflection_1.isMethodStatement)(this.parent) ? [' ', (_c = (_b = this.parent.name) === null || _b === void 0 ? void 0 : _b.text) !== null && _c !== void 0 ? _c : ''] : []),
                //leftParen
                '(',
                //parameters
                ...((_e = (_d = this.parameters) === null || _d === void 0 ? void 0 : _d.map((param, i) => ([
                    //separating comma
                    i > 0 ? ', ' : '',
                    ...param.getTypedef(state)
                ]))) !== null && _e !== void 0 ? _e : []),
                //right paren
                ')',
                //as <ReturnType>
                ...(this.asToken ? [
                    ' as ',
                    (_f = this.returnTypeToken) === null || _f === void 0 ? void 0 : _f.text
                ] : []),
                '\n',
                state.indent(),
                //'end sub'|'end function'
                this.end.text
            ])
        ];
        return results;
    }
    walk(visitor, options) {
        if (options.walkMode & visitors_2.InternalWalkMode.walkExpressions) {
            (0, visitors_2.walkArray)(this.parameters, visitor, options, this);
            //This is the core of full-program walking...it allows us to step into sub functions
            if (options.walkMode & visitors_2.InternalWalkMode.recurseChildFunctions) {
                (0, visitors_2.walk)(this, 'body', visitor, options);
            }
        }
    }
    getFunctionType() {
        var _a;
        let functionType = new FunctionType_1.FunctionType(this.returnType);
        functionType.isSub = ((_a = this.functionType) === null || _a === void 0 ? void 0 : _a.text) === 'sub';
        for (let param of this.parameters) {
            functionType.addParameter(param.name.text, param.type, !!param.typeToken);
        }
        return functionType;
    }
    setReturnType() {
        /**
         * RokuOS methods can be written several different ways:
         * 1. Function() : return withValue
         * 2. Function() as type : return withValue
         * 3. Function() as void : return
         *
         * 4. Sub() : return
         * 5. Sub () as void : return
         * 6. Sub() as type : return withValue
         *
         * Formats (1), (2), and (6) throw a compile error if there IS NOT a return value in the function body.
         * Formats (3), (4), and (5) throw a compile error if there IS a return value in the function body.
         *
         * 7. Additionally, as a special case, the OS requires that `onKeyEvent()` be defined with `as boolean`
         */
        var _a, _b, _c;
        const isSub = ((_a = this.functionType) === null || _a === void 0 ? void 0 : _a.text.toLowerCase()) === 'sub';
        if (this.returnTypeToken) {
            this.returnType = util_1.default.tokenToBscType(this.returnTypeToken);
        }
        else if (isSub) {
            this.returnType = new VoidType_1.VoidType();
        }
        else {
            this.returnType = DynamicType_1.DynamicType.instance;
        }
        if (((0, reflection_1.isFunctionStatement)(this.parent) || (0, reflection_1.isMethodStatement)(this.parent)) && ((_c = (_b = this.parent) === null || _b === void 0 ? void 0 : _b.name) === null || _c === void 0 ? void 0 : _c.text.toLowerCase()) === 'onkeyevent') {
            // onKeyEvent() requires 'as Boolean' otherwise RokuOS throws errors
            this.requiresReturnType = true;
        }
        else if (isSub && !(0, reflection_1.isVoidType)(this.returnType)) { // format (6)
            this.requiresReturnType = true;
        }
        else if (this.returnTypeToken && (0, reflection_1.isVoidType)(this.returnType)) { // format (3)
            this.requiresReturnType = true;
        }
    }
    clone() {
        var _a, _b, _c, _d;
        const clone = this.finalizeClone(new FunctionExpression((_a = this.parameters) === null || _a === void 0 ? void 0 : _a.map(e => e === null || e === void 0 ? void 0 : e.clone()), (_b = this.body) === null || _b === void 0 ? void 0 : _b.clone(), util_1.default.cloneToken(this.functionType), util_1.default.cloneToken(this.end), util_1.default.cloneToken(this.leftParen), util_1.default.cloneToken(this.rightParen), util_1.default.cloneToken(this.asToken), util_1.default.cloneToken(this.returnTypeToken)), ['body']);
        //rebuild the .callExpressions list in the clone
        (_d = (_c = clone.body) === null || _c === void 0 ? void 0 : _c.walk) === null || _d === void 0 ? void 0 : _d.call(_c, (node) => {
            if ((0, reflection_1.isCallExpression)(node) && !(0, reflection_1.isNewExpression)(node.parent)) {
                clone.callExpressions.push(node);
            }
        }, { walkMode: visitors_1.WalkMode.visitExpressions });
        return clone;
    }
}
exports.FunctionExpression = FunctionExpression;
class FunctionParameterExpression extends AstNode_1.Expression {
    constructor(name, typeToken, defaultValue, asToken) {
        super();
        this.name = name;
        this.typeToken = typeToken;
        this.defaultValue = defaultValue;
        this.asToken = asToken;
        if (typeToken) {
            this.type = util_1.default.tokenToBscType(typeToken);
        }
        else {
            this.type = new DynamicType_1.DynamicType();
        }
    }
    get range() {
        return util_1.default.createBoundingRange(this.name, this.asToken, this.typeToken, this.defaultValue);
    }
    transpile(state) {
        let result = [
            //name
            state.transpileToken(this.name)
        ];
        //default value
        if (this.defaultValue) {
            result.push(' = ');
            result.push(this.defaultValue.transpile(state));
        }
        //type declaration
        if (this.asToken && !state.options.removeParameterTypes) {
            result.push(' ');
            result.push(state.transpileToken(this.asToken));
            result.push(' ');
            result.push(state.sourceNode(this.typeToken, this.type.toTypeString()));
        }
        return result;
    }
    getTypedef(state) {
        var _a;
        const results = [this.name.text];
        if (this.defaultValue) {
            results.push(' = ', ...((_a = this.defaultValue.getTypedef(state)) !== null && _a !== void 0 ? _a : this.defaultValue.transpile(state)));
        }
        if (this.asToken) {
            results.push(' as ');
            if (this.typeToken) {
                results.push(this.typeToken.text);
            }
        }
        return results;
    }
    walk(visitor, options) {
        // eslint-disable-next-line no-bitwise
        if (this.defaultValue && options.walkMode & visitors_2.InternalWalkMode.walkExpressions) {
            (0, visitors_2.walk)(this, 'defaultValue', visitor, options);
        }
    }
    clone() {
        var _a;
        return this.finalizeClone(new FunctionParameterExpression(util_1.default.cloneToken(this.name), util_1.default.cloneToken(this.typeToken), (_a = this.defaultValue) === null || _a === void 0 ? void 0 : _a.clone(), util_1.default.cloneToken(this.asToken)), ['defaultValue']);
    }
}
exports.FunctionParameterExpression = FunctionParameterExpression;
class NamespacedVariableNameExpression extends AstNode_1.Expression {
    constructor(
    //if this is a `DottedGetExpression`, it must be comprised only of `VariableExpression`s
    expression) {
        super();
        this.expression = expression;
        this.range = expression === null || expression === void 0 ? void 0 : expression.range;
    }
    transpile(state) {
        return [
            state.sourceNode(this, this.getName(Parser_1.ParseMode.BrightScript))
        ];
    }
    getNameParts() {
        let parts = [];
        if ((0, reflection_1.isVariableExpression)(this.expression)) {
            parts.push(this.expression.name.text);
        }
        else {
            let expr = this.expression;
            parts.push(expr.name.text);
            while ((0, reflection_1.isVariableExpression)(expr) === false) {
                expr = expr.obj;
                parts.unshift(expr.name.text);
            }
        }
        return parts;
    }
    getName(parseMode) {
        if (parseMode === Parser_1.ParseMode.BrighterScript) {
            return this.getNameParts().join('.');
        }
        else {
            return this.getNameParts().join('_');
        }
    }
    walk(visitor, options) {
        var _a;
        (_a = this.expression) === null || _a === void 0 ? void 0 : _a.link();
        if (options.walkMode & visitors_2.InternalWalkMode.walkExpressions) {
            (0, visitors_2.walk)(this, 'expression', visitor, options);
        }
    }
    clone() {
        var _a;
        return this.finalizeClone(new NamespacedVariableNameExpression((_a = this.expression) === null || _a === void 0 ? void 0 : _a.clone()));
    }
}
exports.NamespacedVariableNameExpression = NamespacedVariableNameExpression;
class DottedGetExpression extends AstNode_1.Expression {
    constructor(obj, name, 
    /**
     * Can either be `.`, or `?.` for optional chaining
     */
    dot) {
        super();
        this.obj = obj;
        this.name = name;
        this.dot = dot;
        this.range = util_1.default.createBoundingRange(this.obj, this.dot, this.name);
    }
    transpile(state) {
        //if the callee starts with a namespace name, transpile the name
        if (state.file.calleeStartsWithNamespace(this)) {
            return new NamespacedVariableNameExpression(this).transpile(state);
        }
        else {
            return [
                ...this.obj.transpile(state),
                state.transpileToken(this.dot),
                state.transpileToken(this.name)
            ];
        }
    }
    getTypedef(state) {
        //always transpile the dots for typedefs
        return [
            ...this.obj.transpile(state),
            state.transpileToken(this.dot),
            state.transpileToken(this.name)
        ];
    }
    walk(visitor, options) {
        if (options.walkMode & visitors_2.InternalWalkMode.walkExpressions) {
            (0, visitors_2.walk)(this, 'obj', visitor, options);
        }
    }
    clone() {
        var _a;
        return this.finalizeClone(new DottedGetExpression((_a = this.obj) === null || _a === void 0 ? void 0 : _a.clone(), util_1.default.cloneToken(this.name), util_1.default.cloneToken(this.dot)), ['obj']);
    }
}
exports.DottedGetExpression = DottedGetExpression;
class XmlAttributeGetExpression extends AstNode_1.Expression {
    constructor(obj, name, 
    /**
     * Can either be `@`, or `?@` for optional chaining
     */
    at) {
        super();
        this.obj = obj;
        this.name = name;
        this.at = at;
        this.range = util_1.default.createBoundingRange(this.obj, this.at, this.name);
    }
    transpile(state) {
        return [
            ...this.obj.transpile(state),
            state.transpileToken(this.at),
            state.transpileToken(this.name)
        ];
    }
    walk(visitor, options) {
        if (options.walkMode & visitors_2.InternalWalkMode.walkExpressions) {
            (0, visitors_2.walk)(this, 'obj', visitor, options);
        }
    }
    clone() {
        var _a;
        return this.finalizeClone(new XmlAttributeGetExpression((_a = this.obj) === null || _a === void 0 ? void 0 : _a.clone(), util_1.default.cloneToken(this.name), util_1.default.cloneToken(this.at)), ['obj']);
    }
}
exports.XmlAttributeGetExpression = XmlAttributeGetExpression;
class IndexedGetExpression extends AstNode_1.Expression {
    constructor(obj, index, 
    /**
     * Can either be `[` or `?[`. If `?.[` is used, this will be `[` and `optionalChainingToken` will be `?.`
     */
    openingSquare, closingSquare, questionDotToken, //  ? or ?.
    /**
     * More indexes, separated by commas
     */
    additionalIndexes) {
        var _a;
        super();
        this.obj = obj;
        this.index = index;
        this.openingSquare = openingSquare;
        this.closingSquare = closingSquare;
        this.questionDotToken = questionDotToken;
        this.additionalIndexes = additionalIndexes;
        this.range = util_1.default.createBoundingRange(this.obj, this.openingSquare, this.questionDotToken, this.openingSquare, this.index, this.closingSquare);
        (_a = this.additionalIndexes) !== null && _a !== void 0 ? _a : (this.additionalIndexes = []);
    }
    transpile(state) {
        var _a, _b;
        const result = [];
        result.push(...this.obj.transpile(state), this.questionDotToken ? state.transpileToken(this.questionDotToken) : '', state.transpileToken(this.openingSquare));
        const indexes = [this.index, ...(_a = this.additionalIndexes) !== null && _a !== void 0 ? _a : []];
        for (let i = 0; i < indexes.length; i++) {
            //add comma between indexes
            if (i > 0) {
                result.push(', ');
            }
            let index = indexes[i];
            result.push(...((_b = index === null || index === void 0 ? void 0 : index.transpile(state)) !== null && _b !== void 0 ? _b : []));
        }
        result.push(this.closingSquare ? state.transpileToken(this.closingSquare) : '');
        return result;
    }
    walk(visitor, options) {
        if (options.walkMode & visitors_2.InternalWalkMode.walkExpressions) {
            (0, visitors_2.walk)(this, 'obj', visitor, options);
            (0, visitors_2.walk)(this, 'index', visitor, options);
            (0, visitors_2.walkArray)(this.additionalIndexes, visitor, options, this);
        }
    }
    clone() {
        var _a, _b, _c;
        return this.finalizeClone(new IndexedGetExpression((_a = this.obj) === null || _a === void 0 ? void 0 : _a.clone(), (_b = this.index) === null || _b === void 0 ? void 0 : _b.clone(), util_1.default.cloneToken(this.openingSquare), util_1.default.cloneToken(this.closingSquare), util_1.default.cloneToken(this.questionDotToken), (_c = this.additionalIndexes) === null || _c === void 0 ? void 0 : _c.map(e => e === null || e === void 0 ? void 0 : e.clone())), ['obj', 'index', 'additionalIndexes']);
    }
}
exports.IndexedGetExpression = IndexedGetExpression;
class GroupingExpression extends AstNode_1.Expression {
    constructor(tokens, expression) {
        super();
        this.tokens = tokens;
        this.expression = expression;
        this.range = util_1.default.createBoundingRange(this.tokens.left, this.expression, this.tokens.right);
    }
    transpile(state) {
        if ((0, reflection_1.isTypeCastExpression)(this.expression)) {
            return this.expression.transpile(state);
        }
        return [
            state.transpileToken(this.tokens.left),
            ...this.expression.transpile(state),
            state.transpileToken(this.tokens.right)
        ];
    }
    walk(visitor, options) {
        if (options.walkMode & visitors_2.InternalWalkMode.walkExpressions) {
            (0, visitors_2.walk)(this, 'expression', visitor, options);
        }
    }
    clone() {
        var _a;
        return this.finalizeClone(new GroupingExpression({
            left: util_1.default.cloneToken(this.tokens.left),
            right: util_1.default.cloneToken(this.tokens.right)
        }, (_a = this.expression) === null || _a === void 0 ? void 0 : _a.clone()), ['expression']);
    }
}
exports.GroupingExpression = GroupingExpression;
class LiteralExpression extends AstNode_1.Expression {
    constructor(token) {
        super();
        this.token = token;
        this.type = util_1.default.tokenToBscType(token);
    }
    get range() {
        return this.token.range;
    }
    transpile(state) {
        let text;
        if (this.token.kind === TokenKind_1.TokenKind.TemplateStringQuasi) {
            //wrap quasis with quotes (and escape inner quotemarks)
            text = `"${this.token.text.replace(/"/g, '""')}"`;
        }
        else if ((0, reflection_1.isStringType)(this.type)) {
            text = this.token.text;
            //add trailing quotemark if it's missing. We will have already generated a diagnostic for this.
            if (text.endsWith('"') === false) {
                text += '"';
            }
        }
        else {
            text = this.token.text;
        }
        return [
            state.sourceNode(this, text)
        ];
    }
    walk(visitor, options) {
        //nothing to walk
    }
    clone() {
        return this.finalizeClone(new LiteralExpression(util_1.default.cloneToken(this.token)));
    }
}
exports.LiteralExpression = LiteralExpression;
/**
 * This is a special expression only used within template strings. It exists so we can prevent producing lots of empty strings
 * during template string transpile by identifying these expressions explicitly and skipping the bslib_toString around them
 */
class EscapedCharCodeLiteralExpression extends AstNode_1.Expression {
    constructor(token) {
        super();
        this.token = token;
        this.range = token.range;
    }
    transpile(state) {
        return [
            state.sourceNode(this, `chr(${this.token.charCode})`)
        ];
    }
    walk(visitor, options) {
        //nothing to walk
    }
    clone() {
        return this.finalizeClone(new EscapedCharCodeLiteralExpression(util_1.default.cloneToken(this.token)));
    }
}
exports.EscapedCharCodeLiteralExpression = EscapedCharCodeLiteralExpression;
class ArrayLiteralExpression extends AstNode_1.Expression {
    constructor(elements, open, close, hasSpread = false) {
        var _a;
        super();
        this.elements = elements;
        this.open = open;
        this.close = close;
        this.hasSpread = hasSpread;
        this.range = util_1.default.createBoundingRange(this.open, ...(_a = this.elements) !== null && _a !== void 0 ? _a : [], this.close);
    }
    transpile(state) {
        let result = [];
        result.push(state.transpileToken(this.open));
        let hasChildren = this.elements.length > 0;
        state.blockDepth++;
        for (let i = 0; i < this.elements.length; i++) {
            let previousElement = this.elements[i - 1];
            let element = this.elements[i];
            if ((0, reflection_1.isCommentStatement)(element)) {
                //if the comment is on the same line as opening square or previous statement, don't add newline
                if (util_1.default.linesTouch(this.open, element) || util_1.default.linesTouch(previousElement, element)) {
                    result.push(' ');
                }
                else {
                    result.push('\n', state.indent());
                }
                state.lineage.unshift(this);
                result.push(element.transpile(state));
                state.lineage.shift();
            }
            else {
                result.push('\n');
                result.push(state.indent(), ...element.transpile(state));
            }
        }
        state.blockDepth--;
        //add a newline between open and close if there are elements
        if (hasChildren) {
            result.push('\n');
            result.push(state.indent());
        }
        if (this.close) {
            result.push(state.transpileToken(this.close));
        }
        return result;
    }
    walk(visitor, options) {
        if (options.walkMode & visitors_2.InternalWalkMode.walkExpressions) {
            (0, visitors_2.walkArray)(this.elements, visitor, options, this);
        }
    }
    clone() {
        var _a;
        return this.finalizeClone(new ArrayLiteralExpression((_a = this.elements) === null || _a === void 0 ? void 0 : _a.map(e => e === null || e === void 0 ? void 0 : e.clone()), util_1.default.cloneToken(this.open), util_1.default.cloneToken(this.close), this.hasSpread), ['elements']);
    }
}
exports.ArrayLiteralExpression = ArrayLiteralExpression;
class AAMemberExpression extends AstNode_1.Expression {
    constructor(keyToken, colonToken, 
    /** The expression evaluated to determine the member's initial value. */
    value) {
        super();
        this.keyToken = keyToken;
        this.colonToken = colonToken;
        this.value = value;
        this.range = util_1.default.createBoundingRange(this.keyToken, this.colonToken, this.value);
    }
    transpile(state) {
        //TODO move the logic from AALiteralExpression loop into this function
        return [];
    }
    walk(visitor, options) {
        (0, visitors_2.walk)(this, 'value', visitor, options);
    }
    clone() {
        var _a;
        return this.finalizeClone(new AAMemberExpression(util_1.default.cloneToken(this.keyToken), util_1.default.cloneToken(this.colonToken), (_a = this.value) === null || _a === void 0 ? void 0 : _a.clone()), ['value']);
    }
}
exports.AAMemberExpression = AAMemberExpression;
class AALiteralExpression extends AstNode_1.Expression {
    constructor(elements, open, close) {
        var _a;
        super();
        this.elements = elements;
        this.open = open;
        this.close = close;
        this.range = util_1.default.createBoundingRange(this.open, ...(_a = this.elements) !== null && _a !== void 0 ? _a : [], this.close);
    }
    transpile(state) {
        var _a, _b;
        let result = [];
        //open curly
        result.push(state.transpileToken(this.open));
        let hasChildren = this.elements.length > 0;
        //add newline if the object has children and the first child isn't a comment starting on the same line as opening curly
        if (hasChildren && ((0, reflection_1.isCommentStatement)(this.elements[0]) === false || !util_1.default.linesTouch(this.elements[0], this.open))) {
            result.push('\n');
        }
        state.blockDepth++;
        for (let i = 0; i < this.elements.length; i++) {
            let element = this.elements[i];
            let previousElement = this.elements[i - 1];
            let nextElement = this.elements[i + 1];
            //don't indent if comment is same-line
            if ((0, reflection_1.isCommentStatement)(element) &&
                (util_1.default.linesTouch(this.open, element) || util_1.default.linesTouch(previousElement, element))) {
                result.push(' ');
                //indent line
            }
            else {
                result.push(state.indent());
            }
            //render comments
            if ((0, reflection_1.isCommentStatement)(element)) {
                result.push(...element.transpile(state));
            }
            else {
                //key
                result.push(state.transpileToken(element.keyToken));
                //colon
                result.push(state.transpileToken(element.colonToken), ' ');
                //value
                result.push(...element.value.transpile(state));
            }
            //if next element is a same-line comment, skip the newline
            if (nextElement && (0, reflection_1.isCommentStatement)(nextElement) && ((_a = nextElement.range) === null || _a === void 0 ? void 0 : _a.start.line) === ((_b = element.range) === null || _b === void 0 ? void 0 : _b.start.line)) {
                //add a newline between statements
            }
            else {
                result.push('\n');
            }
        }
        state.blockDepth--;
        //only indent the closing curly if we have children
        if (hasChildren) {
            result.push(state.indent());
        }
        //close curly
        if (this.close) {
            result.push(state.transpileToken(this.close));
        }
        return result;
    }
    walk(visitor, options) {
        if (options.walkMode & visitors_2.InternalWalkMode.walkExpressions) {
            (0, visitors_2.walkArray)(this.elements, visitor, options, this);
        }
    }
    clone() {
        var _a;
        return this.finalizeClone(new AALiteralExpression((_a = this.elements) === null || _a === void 0 ? void 0 : _a.map(e => e === null || e === void 0 ? void 0 : e.clone()), util_1.default.cloneToken(this.open), util_1.default.cloneToken(this.close)), ['elements']);
    }
}
exports.AALiteralExpression = AALiteralExpression;
class UnaryExpression extends AstNode_1.Expression {
    constructor(operator, right) {
        super();
        this.operator = operator;
        this.right = right;
        this.range = util_1.default.createBoundingRange(this.operator, this.right);
    }
    transpile(state) {
        let separatingWhitespace;
        if ((0, reflection_1.isVariableExpression)(this.right)) {
            separatingWhitespace = this.right.name.leadingWhitespace;
        }
        else if ((0, reflection_1.isLiteralExpression)(this.right)) {
            separatingWhitespace = this.right.token.leadingWhitespace;
        }
        return [
            state.transpileToken(this.operator),
            separatingWhitespace !== null && separatingWhitespace !== void 0 ? separatingWhitespace : ' ',
            ...this.right.transpile(state)
        ];
    }
    walk(visitor, options) {
        if (options.walkMode & visitors_2.InternalWalkMode.walkExpressions) {
            (0, visitors_2.walk)(this, 'right', visitor, options);
        }
    }
    clone() {
        var _a;
        return this.finalizeClone(new UnaryExpression(util_1.default.cloneToken(this.operator), (_a = this.right) === null || _a === void 0 ? void 0 : _a.clone()), ['right']);
    }
}
exports.UnaryExpression = UnaryExpression;
class VariableExpression extends AstNode_1.Expression {
    constructor(name) {
        var _a;
        super();
        this.name = name;
        this.range = (_a = this.name) === null || _a === void 0 ? void 0 : _a.range;
    }
    getName(parseMode) {
        return this.name.text;
    }
    transpile(state) {
        let result = [];
        const namespace = this.findAncestor(reflection_1.isNamespaceStatement);
        //if the callee is the name of a known namespace function
        if (namespace && state.file.calleeIsKnownNamespaceFunction(this, namespace.getName(Parser_1.ParseMode.BrighterScript))) {
            result.push(state.sourceNode(this, [
                namespace.getName(Parser_1.ParseMode.BrightScript),
                '_',
                this.getName(Parser_1.ParseMode.BrightScript)
            ]));
            //transpile  normally
        }
        else {
            result.push(state.transpileToken(this.name));
        }
        return result;
    }
    getTypedef(state) {
        return [
            state.transpileToken(this.name)
        ];
    }
    walk(visitor, options) {
        //nothing to walk
    }
    clone() {
        return this.finalizeClone(new VariableExpression(util_1.default.cloneToken(this.name)));
    }
}
exports.VariableExpression = VariableExpression;
class SourceLiteralExpression extends AstNode_1.Expression {
    constructor(token) {
        super();
        this.token = token;
        this.range = token === null || token === void 0 ? void 0 : token.range;
    }
    getFunctionName(state, parseMode) {
        let func = this.findAncestor(reflection_1.isFunctionExpression);
        let nameParts = [];
        while (func.parentFunction) {
            let index = func.parentFunction.childFunctionExpressions.indexOf(func);
            nameParts.unshift(`anon${index}`);
            func = func.parentFunction;
        }
        //get the index of this function in its parent
        nameParts.unshift(func.functionStatement.getName(parseMode));
        return nameParts.join('$');
    }
    /**
     * Get the line number from our token or from the closest ancestor that has a range
     */
    getClosestLineNumber() {
        let node = this;
        while (node) {
            if (node.range) {
                return node.range.start.line + 1;
            }
            node = node.parent;
        }
        return -1;
    }
    transpile(state) {
        var _a;
        let text;
        switch (this.token.kind) {
            case TokenKind_1.TokenKind.SourceFilePathLiteral:
                const pathUrl = fileUrl(state.srcPath);
                text = `"${pathUrl.substring(0, 4)}" + "${pathUrl.substring(4)}"`;
                break;
            case TokenKind_1.TokenKind.SourceLineNumLiteral:
                //TODO find first parent that has range, or default to -1
                text = `${this.getClosestLineNumber()}`;
                break;
            case TokenKind_1.TokenKind.FunctionNameLiteral:
                text = `"${this.getFunctionName(state, Parser_1.ParseMode.BrightScript)}"`;
                break;
            case TokenKind_1.TokenKind.SourceFunctionNameLiteral:
                text = `"${this.getFunctionName(state, Parser_1.ParseMode.BrighterScript)}"`;
                break;
            case TokenKind_1.TokenKind.SourceNamespaceNameLiteral:
                let namespaceParts = this.getFunctionName(state, Parser_1.ParseMode.BrighterScript).split('.');
                namespaceParts.pop(); // remove the function name
                text = `"${namespaceParts.join('.')}"`;
                break;
            case TokenKind_1.TokenKind.SourceNamespaceRootNameLiteral:
                let namespaceRootParts = this.getFunctionName(state, Parser_1.ParseMode.BrighterScript).split('.');
                namespaceRootParts.pop(); // remove the function name
                let rootNamespace = (_a = namespaceRootParts.shift()) !== null && _a !== void 0 ? _a : '';
                text = `"${rootNamespace}"`;
                break;
            case TokenKind_1.TokenKind.SourceLocationLiteral:
                const locationUrl = fileUrl(state.srcPath);
                //TODO find first parent that has range, or default to -1
                text = `"${locationUrl.substring(0, 4)}" + "${locationUrl.substring(4)}:${this.getClosestLineNumber()}"`;
                break;
            case TokenKind_1.TokenKind.PkgPathLiteral:
                let pkgPath1 = `pkg:/${state.file.pkgPath}`
                    .replace(/\\/g, '/')
                    .replace(/\.bs$/i, '.brs');
                text = `"${pkgPath1}"`;
                break;
            case TokenKind_1.TokenKind.PkgLocationLiteral:
                let pkgPath2 = `pkg:/${state.file.pkgPath}`
                    .replace(/\\/g, '/')
                    .replace(/\.bs$/i, '.brs');
                text = `"${pkgPath2}:" + str(LINE_NUM)`;
                break;
            case TokenKind_1.TokenKind.LineNumLiteral:
            default:
                //use the original text (because it looks like a variable)
                text = this.token.text;
                break;
        }
        return [
            state.sourceNode(this, text)
        ];
    }
    walk(visitor, options) {
        //nothing to walk
    }
    clone() {
        return this.finalizeClone(new SourceLiteralExpression(util_1.default.cloneToken(this.token)));
    }
}
exports.SourceLiteralExpression = SourceLiteralExpression;
/**
 * This expression transpiles and acts exactly like a CallExpression,
 * except we need to uniquely identify these statements so we can
 * do more type checking.
 */
class NewExpression extends AstNode_1.Expression {
    constructor(newKeyword, call) {
        super();
        this.newKeyword = newKeyword;
        this.call = call;
        this.range = util_1.default.createBoundingRange(this.newKeyword, this.call);
    }
    /**
     * The name of the class to initialize (with optional namespace prefixed)
     */
    get className() {
        //the parser guarantees the callee of a new statement's call object will be
        //a NamespacedVariableNameExpression
        return this.call.callee;
    }
    transpile(state) {
        var _a;
        const namespace = this.findAncestor(reflection_1.isNamespaceStatement);
        const cls = (_a = state.file.getClassFileLink(this.className.getName(Parser_1.ParseMode.BrighterScript), namespace === null || namespace === void 0 ? void 0 : namespace.getName(Parser_1.ParseMode.BrighterScript))) === null || _a === void 0 ? void 0 : _a.item;
        //new statements within a namespace block can omit the leading namespace if the class resides in that same namespace.
        //So we need to figure out if this is a namespace-omitted class, or if this class exists without a namespace.
        return this.call.transpile(state, cls === null || cls === void 0 ? void 0 : cls.getName(Parser_1.ParseMode.BrightScript));
    }
    walk(visitor, options) {
        if (options.walkMode & visitors_2.InternalWalkMode.walkExpressions) {
            (0, visitors_2.walk)(this, 'call', visitor, options);
        }
    }
    clone() {
        var _a;
        return this.finalizeClone(new NewExpression(util_1.default.cloneToken(this.newKeyword), (_a = this.call) === null || _a === void 0 ? void 0 : _a.clone()), ['call']);
    }
}
exports.NewExpression = NewExpression;
class CallfuncExpression extends AstNode_1.Expression {
    constructor(callee, operator, methodName, openingParen, args, closingParen) {
        super();
        this.callee = callee;
        this.operator = operator;
        this.methodName = methodName;
        this.openingParen = openingParen;
        this.args = args;
        this.closingParen = closingParen;
        this.range = util_1.default.createBoundingRange(callee, operator, methodName, openingParen, ...args !== null && args !== void 0 ? args : [], closingParen);
    }
    /**
     * Get the name of the wrapping namespace (if it exists)
     * @deprecated use `.findAncestor(isNamespaceStatement)` instead.
     */
    get namespaceName() {
        var _a;
        return (_a = this.findAncestor(reflection_1.isNamespaceStatement)) === null || _a === void 0 ? void 0 : _a.nameExpression;
    }
    transpile(state) {
        let result = [];
        result.push(...this.callee.transpile(state), state.sourceNode(this.operator, '.callfunc'), state.transpileToken(this.openingParen), 
        //the name of the function
        state.sourceNode(this.methodName, ['"', this.methodName.text, '"']), ', ');
        //transpile args
        //callfunc with zero args never gets called, so pass invalid as the first parameter if there are no args
        if (this.args.length === 0) {
            result.push('invalid');
        }
        else {
            for (let i = 0; i < this.args.length; i++) {
                //add comma between args
                if (i > 0) {
                    result.push(', ');
                }
                let arg = this.args[i];
                result.push(...arg.transpile(state));
            }
        }
        result.push(state.transpileToken(this.closingParen));
        return result;
    }
    walk(visitor, options) {
        if (options.walkMode & visitors_2.InternalWalkMode.walkExpressions) {
            (0, visitors_2.walk)(this, 'callee', visitor, options);
            (0, visitors_2.walkArray)(this.args, visitor, options, this);
        }
    }
    clone() {
        var _a, _b;
        return this.finalizeClone(new CallfuncExpression((_a = this.callee) === null || _a === void 0 ? void 0 : _a.clone(), util_1.default.cloneToken(this.operator), util_1.default.cloneToken(this.methodName), util_1.default.cloneToken(this.openingParen), (_b = this.args) === null || _b === void 0 ? void 0 : _b.map(e => e === null || e === void 0 ? void 0 : e.clone()), util_1.default.cloneToken(this.closingParen)), ['callee', 'args']);
    }
}
exports.CallfuncExpression = CallfuncExpression;
/**
 * Since template strings can contain newlines, we need to concatenate multiple strings together with chr() calls.
 * This is a single expression that represents the string contatenation of all parts of a single quasi.
 */
class TemplateStringQuasiExpression extends AstNode_1.Expression {
    constructor(expressions) {
        super();
        this.expressions = expressions;
        this.range = util_1.default.createBoundingRange(...expressions !== null && expressions !== void 0 ? expressions : []);
    }
    transpile(state, skipEmptyStrings = true) {
        let result = [];
        let plus = '';
        for (let expression of this.expressions) {
            //skip empty strings
            //TODO what does an empty string literal expression look like?
            if (expression.token.text === '' && skipEmptyStrings === true) {
                continue;
            }
            result.push(plus, ...expression.transpile(state));
            plus = ' + ';
        }
        return result;
    }
    walk(visitor, options) {
        if (options.walkMode & visitors_2.InternalWalkMode.walkExpressions) {
            (0, visitors_2.walkArray)(this.expressions, visitor, options, this);
        }
    }
    clone() {
        var _a;
        return this.finalizeClone(new TemplateStringQuasiExpression((_a = this.expressions) === null || _a === void 0 ? void 0 : _a.map(e => e === null || e === void 0 ? void 0 : e.clone())), ['expressions']);
    }
}
exports.TemplateStringQuasiExpression = TemplateStringQuasiExpression;
class TemplateStringExpression extends AstNode_1.Expression {
    constructor(openingBacktick, quasis, expressions, closingBacktick) {
        super();
        this.openingBacktick = openingBacktick;
        this.quasis = quasis;
        this.expressions = expressions;
        this.closingBacktick = closingBacktick;
        this.range = util_1.default.createBoundingRange(openingBacktick, quasis === null || quasis === void 0 ? void 0 : quasis[0], quasis === null || quasis === void 0 ? void 0 : quasis[(quasis === null || quasis === void 0 ? void 0 : quasis.length) - 1], closingBacktick);
    }
    transpile(state) {
        //if this is essentially just a normal brightscript string but with backticks, transpile it as a normal string without parens
        if (this.expressions.length === 0 && this.quasis.length === 1 && this.quasis[0].expressions.length === 1) {
            return this.quasis[0].transpile(state);
        }
        let result = ['('];
        let plus = '';
        //helper function to figure out when to include the plus
        function add(...items) {
            if (items.length > 0) {
                result.push(plus, ...items);
            }
            //set the plus after the first occurance of a nonzero length set of items
            if (plus === '' && items.length > 0) {
                plus = ' + ';
            }
        }
        for (let i = 0; i < this.quasis.length; i++) {
            let quasi = this.quasis[i];
            let expression = this.expressions[i];
            add(...quasi.transpile(state));
            if (expression) {
                //skip the toString wrapper around certain expressions
                if ((0, reflection_1.isEscapedCharCodeLiteralExpression)(expression) ||
                    ((0, reflection_1.isLiteralExpression)(expression) && (0, reflection_1.isStringType)(expression.type))) {
                    add(...expression.transpile(state));
                    //wrap all other expressions with a bslib_toString call to prevent runtime type mismatch errors
                }
                else {
                    add(state.bslibPrefix + '_toString(', ...expression.transpile(state), ')');
                }
            }
        }
        //the expression should be wrapped in parens so it can be used line a single expression at runtime
        result.push(')');
        return result;
    }
    walk(visitor, options) {
        var _a;
        if (options.walkMode & visitors_2.InternalWalkMode.walkExpressions) {
            //walk the quasis and expressions in left-to-right order
            for (let i = 0; i < ((_a = this.quasis) === null || _a === void 0 ? void 0 : _a.length); i++) {
                (0, visitors_2.walk)(this.quasis, i, visitor, options, this);
                //this skips the final loop iteration since we'll always have one more quasi than expression
                if (this.expressions[i]) {
                    (0, visitors_2.walk)(this.expressions, i, visitor, options, this);
                }
            }
        }
    }
    clone() {
        var _a, _b;
        return this.finalizeClone(new TemplateStringExpression(util_1.default.cloneToken(this.openingBacktick), (_a = this.quasis) === null || _a === void 0 ? void 0 : _a.map(e => e === null || e === void 0 ? void 0 : e.clone()), (_b = this.expressions) === null || _b === void 0 ? void 0 : _b.map(e => e === null || e === void 0 ? void 0 : e.clone()), util_1.default.cloneToken(this.closingBacktick)), ['quasis', 'expressions']);
    }
}
exports.TemplateStringExpression = TemplateStringExpression;
class TaggedTemplateStringExpression extends AstNode_1.Expression {
    constructor(tagName, openingBacktick, quasis, expressions, closingBacktick) {
        super();
        this.tagName = tagName;
        this.openingBacktick = openingBacktick;
        this.quasis = quasis;
        this.expressions = expressions;
        this.closingBacktick = closingBacktick;
        this.range = util_1.default.createBoundingRange(tagName, openingBacktick, quasis === null || quasis === void 0 ? void 0 : quasis[0], quasis === null || quasis === void 0 ? void 0 : quasis[(quasis === null || quasis === void 0 ? void 0 : quasis.length) - 1], closingBacktick);
    }
    transpile(state) {
        let result = [];
        result.push(state.transpileToken(this.tagName), '([');
        //add quasis as the first array
        for (let i = 0; i < this.quasis.length; i++) {
            let quasi = this.quasis[i];
            //separate items with a comma
            if (i > 0) {
                result.push(', ');
            }
            result.push(...quasi.transpile(state, false));
        }
        result.push('], [');
        //add expressions as the second array
        for (let i = 0; i < this.expressions.length; i++) {
            let expression = this.expressions[i];
            if (i > 0) {
                result.push(', ');
            }
            result.push(...expression.transpile(state));
        }
        result.push(state.sourceNode(this.closingBacktick, '])'));
        return result;
    }
    walk(visitor, options) {
        var _a;
        if (options.walkMode & visitors_2.InternalWalkMode.walkExpressions) {
            //walk the quasis and expressions in left-to-right order
            for (let i = 0; i < ((_a = this.quasis) === null || _a === void 0 ? void 0 : _a.length); i++) {
                (0, visitors_2.walk)(this.quasis, i, visitor, options, this);
                //this skips the final loop iteration since we'll always have one more quasi than expression
                if (this.expressions[i]) {
                    (0, visitors_2.walk)(this.expressions, i, visitor, options, this);
                }
            }
        }
    }
    clone() {
        var _a, _b;
        return this.finalizeClone(new TaggedTemplateStringExpression(util_1.default.cloneToken(this.tagName), util_1.default.cloneToken(this.openingBacktick), (_a = this.quasis) === null || _a === void 0 ? void 0 : _a.map(e => e === null || e === void 0 ? void 0 : e.clone()), (_b = this.expressions) === null || _b === void 0 ? void 0 : _b.map(e => e === null || e === void 0 ? void 0 : e.clone()), util_1.default.cloneToken(this.closingBacktick)), ['quasis', 'expressions']);
    }
}
exports.TaggedTemplateStringExpression = TaggedTemplateStringExpression;
class AnnotationExpression extends AstNode_1.Expression {
    constructor(atToken, nameToken) {
        super();
        this.atToken = atToken;
        this.nameToken = nameToken;
        this.name = nameToken.text;
    }
    get range() {
        return util_1.default.createBoundingRange(this.atToken, this.nameToken, this.call);
    }
    /**
     * Convert annotation arguments to JavaScript types
     * @param strict If false, keep Expression objects not corresponding to JS types
     */
    getArguments(strict = true) {
        if (!this.call) {
            return [];
        }
        return this.call.args.map(e => expressionToValue(e, strict));
    }
    transpile(state) {
        return [];
    }
    walk(visitor, options) {
        //nothing to walk
    }
    getTypedef(state) {
        var _a, _b;
        return [
            '@',
            this.name,
            ...((_b = (_a = this.call) === null || _a === void 0 ? void 0 : _a.transpile(state)) !== null && _b !== void 0 ? _b : [])
        ];
    }
    clone() {
        const clone = this.finalizeClone(new AnnotationExpression(util_1.default.cloneToken(this.atToken), util_1.default.cloneToken(this.nameToken)));
        return clone;
    }
}
exports.AnnotationExpression = AnnotationExpression;
class TernaryExpression extends AstNode_1.Expression {
    constructor(test, questionMarkToken, consequent, colonToken, alternate) {
        super();
        this.test = test;
        this.questionMarkToken = questionMarkToken;
        this.consequent = consequent;
        this.colonToken = colonToken;
        this.alternate = alternate;
        this.range = util_1.default.createBoundingRange(test, questionMarkToken, consequent, colonToken, alternate);
    }
    transpile(state) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        let result = [];
        const file = state.file;
        let consequentInfo = util_1.default.getExpressionInfo(this.consequent, file);
        let alternateInfo = util_1.default.getExpressionInfo(this.alternate, file);
        //get all unique variable names used in the consequent and alternate, and sort them alphabetically so the output is consistent
        let allUniqueVarNames = [...new Set([...consequentInfo.uniqueVarNames, ...alternateInfo.uniqueVarNames])].sort();
        //discard names of global functions that cannot be passed by reference
        allUniqueVarNames = allUniqueVarNames.filter(name => {
            return !nonReferenceableFunctions.includes(name.toLowerCase());
        });
        let mutatingExpressions = [
            ...consequentInfo.expressions,
            ...alternateInfo.expressions
        ].filter(e => e instanceof CallExpression || e instanceof CallfuncExpression || e instanceof DottedGetExpression);
        if (mutatingExpressions.length > 0) {
            result.push(state.sourceNode(this.questionMarkToken, 
            //write all the scope variables as parameters.
            //TODO handle when there are more than 31 parameters
            `(function(${['__bsCondition', ...allUniqueVarNames].join(', ')})`), state.newline, 
            //double indent so our `end function` line is still indented one at the end
            state.indent(2), state.sourceNode(this.test, `if __bsCondition then`), state.newline, state.indent(1), state.sourceNode((_a = this.consequent) !== null && _a !== void 0 ? _a : this.questionMarkToken, 'return '), ...(_c = (_b = this.consequent) === null || _b === void 0 ? void 0 : _b.transpile(state)) !== null && _c !== void 0 ? _c : [state.sourceNode(this.questionMarkToken, 'invalid')], state.newline, state.indent(-1), state.sourceNode((_d = this.consequent) !== null && _d !== void 0 ? _d : this.questionMarkToken, 'else'), state.newline, state.indent(1), state.sourceNode((_e = this.consequent) !== null && _e !== void 0 ? _e : this.questionMarkToken, 'return '), ...(_g = (_f = this.alternate) === null || _f === void 0 ? void 0 : _f.transpile(state)) !== null && _g !== void 0 ? _g : [state.sourceNode((_h = this.consequent) !== null && _h !== void 0 ? _h : this.questionMarkToken, 'invalid')], state.newline, state.indent(-1), state.sourceNode(this.questionMarkToken, 'end if'), state.newline, state.indent(-1), state.sourceNode(this.questionMarkToken, 'end function)('), ...this.test.transpile(state), state.sourceNode(this.questionMarkToken, `${['', ...allUniqueVarNames].join(', ')})`));
            state.blockDepth--;
        }
        else {
            result.push(state.sourceNode(this.test, state.bslibPrefix + `_ternary(`), ...this.test.transpile(state), state.sourceNode(this.test, `, `), ...(_k = (_j = this.consequent) === null || _j === void 0 ? void 0 : _j.transpile(state)) !== null && _k !== void 0 ? _k : ['invalid'], `, `, ...(_m = (_l = this.alternate) === null || _l === void 0 ? void 0 : _l.transpile(state)) !== null && _m !== void 0 ? _m : ['invalid'], `)`);
        }
        return result;
    }
    walk(visitor, options) {
        if (options.walkMode & visitors_2.InternalWalkMode.walkExpressions) {
            (0, visitors_2.walk)(this, 'test', visitor, options);
            (0, visitors_2.walk)(this, 'consequent', visitor, options);
            (0, visitors_2.walk)(this, 'alternate', visitor, options);
        }
    }
    clone() {
        var _a, _b, _c;
        return this.finalizeClone(new TernaryExpression((_a = this.test) === null || _a === void 0 ? void 0 : _a.clone(), util_1.default.cloneToken(this.questionMarkToken), (_b = this.consequent) === null || _b === void 0 ? void 0 : _b.clone(), util_1.default.cloneToken(this.colonToken), (_c = this.alternate) === null || _c === void 0 ? void 0 : _c.clone()), ['test', 'consequent', 'alternate']);
    }
}
exports.TernaryExpression = TernaryExpression;
class NullCoalescingExpression extends AstNode_1.Expression {
    constructor(consequent, questionQuestionToken, alternate) {
        super();
        this.consequent = consequent;
        this.questionQuestionToken = questionQuestionToken;
        this.alternate = alternate;
        this.range = util_1.default.createBoundingRange(consequent, questionQuestionToken, alternate);
    }
    transpile(state) {
        let result = [];
        let consequentInfo = util_1.default.getExpressionInfo(this.consequent, state.file);
        let alternateInfo = util_1.default.getExpressionInfo(this.alternate, state.file);
        //get all unique variable names used in the consequent and alternate, and sort them alphabetically so the output is consistent
        let allUniqueVarNames = [...new Set([...consequentInfo.uniqueVarNames, ...alternateInfo.uniqueVarNames])].sort();
        //discard names of global functions that cannot be passed by reference
        allUniqueVarNames = allUniqueVarNames.filter(name => {
            return !nonReferenceableFunctions.includes(name.toLowerCase());
        });
        let hasMutatingExpression = [
            ...consequentInfo.expressions,
            ...alternateInfo.expressions
        ].find(e => (0, reflection_1.isCallExpression)(e) || (0, reflection_1.isCallfuncExpression)(e) || (0, reflection_1.isDottedGetExpression)(e));
        if (hasMutatingExpression) {
            result.push(`(function(`, 
            //write all the scope variables as parameters.
            //TODO handle when there are more than 31 parameters
            allUniqueVarNames.join(', '), ')', state.newline, 
            //double indent so our `end function` line is still indented one at the end
            state.indent(2), 
            //evaluate the consequent exactly once, and then use it in the following condition
            `__bsConsequent = `, ...this.consequent.transpile(state), state.newline, state.indent(), `if __bsConsequent <> invalid then`, state.newline, state.indent(1), 'return __bsConsequent', state.newline, state.indent(-1), 'else', state.newline, state.indent(1), 'return ', ...this.alternate.transpile(state), state.newline, state.indent(-1), 'end if', state.newline, state.indent(-1), 'end function)(', allUniqueVarNames.join(', '), ')');
            state.blockDepth--;
        }
        else {
            result.push(state.bslibPrefix + `_coalesce(`, ...this.consequent.transpile(state), ', ', ...this.alternate.transpile(state), ')');
        }
        return result;
    }
    walk(visitor, options) {
        if (options.walkMode & visitors_2.InternalWalkMode.walkExpressions) {
            (0, visitors_2.walk)(this, 'consequent', visitor, options);
            (0, visitors_2.walk)(this, 'alternate', visitor, options);
        }
    }
    clone() {
        var _a, _b;
        return this.finalizeClone(new NullCoalescingExpression((_a = this.consequent) === null || _a === void 0 ? void 0 : _a.clone(), util_1.default.cloneToken(this.questionQuestionToken), (_b = this.alternate) === null || _b === void 0 ? void 0 : _b.clone()), ['consequent', 'alternate']);
    }
}
exports.NullCoalescingExpression = NullCoalescingExpression;
class RegexLiteralExpression extends AstNode_1.Expression {
    constructor(tokens) {
        super();
        this.tokens = tokens;
    }
    get range() {
        var _a, _b;
        return (_b = (_a = this.tokens) === null || _a === void 0 ? void 0 : _a.regexLiteral) === null || _b === void 0 ? void 0 : _b.range;
    }
    transpile(state) {
        var _a, _b;
        let text = (_b = (_a = this.tokens.regexLiteral) === null || _a === void 0 ? void 0 : _a.text) !== null && _b !== void 0 ? _b : '';
        let flags = '';
        //get any flags from the end
        const flagMatch = /\/([a-z]+)$/i.exec(text);
        if (flagMatch) {
            text = text.substring(0, flagMatch.index + 1);
            flags = flagMatch[1];
        }
        let pattern = text
            //remove leading and trailing slashes
            .substring(1, text.length - 1)
            //escape quotemarks
            .split('"').join('" + chr(34) + "');
        return [
            state.sourceNode(this.tokens.regexLiteral, [
                'CreateObject("roRegex", ',
                `"${pattern}", `,
                `"${flags}"`,
                ')'
            ])
        ];
    }
    walk(visitor, options) {
        //nothing to walk
    }
    clone() {
        return this.finalizeClone(new RegexLiteralExpression({
            regexLiteral: util_1.default.cloneToken(this.tokens.regexLiteral)
        }));
    }
}
exports.RegexLiteralExpression = RegexLiteralExpression;
class TypeCastExpression extends AstNode_1.Expression {
    constructor(obj, asToken, typeToken) {
        super();
        this.obj = obj;
        this.asToken = asToken;
        this.typeToken = typeToken;
        this.range = util_1.default.createBoundingRange(this.obj, this.asToken, this.typeToken);
    }
    transpile(state) {
        return this.obj.transpile(state);
    }
    walk(visitor, options) {
        if (options.walkMode & visitors_2.InternalWalkMode.walkExpressions) {
            (0, visitors_2.walk)(this, 'obj', visitor, options);
        }
    }
    clone() {
        var _a;
        return this.finalizeClone(new TypeCastExpression((_a = this.obj) === null || _a === void 0 ? void 0 : _a.clone(), util_1.default.cloneToken(this.asToken), util_1.default.cloneToken(this.typeToken)), ['obj']);
    }
}
exports.TypeCastExpression = TypeCastExpression;
function expressionToValue(expr, strict) {
    var _a;
    if (!expr) {
        return null;
    }
    if ((0, reflection_1.isUnaryExpression)(expr) && (0, reflection_1.isLiteralNumber)(expr.right)) {
        return numberExpressionToValue(expr.right, expr.operator.text);
    }
    if ((0, reflection_1.isLiteralString)(expr)) {
        //remove leading and trailing quotes
        return expr.token.text.replace(/^"/, '').replace(/"$/, '');
    }
    if ((0, reflection_1.isLiteralNumber)(expr)) {
        return numberExpressionToValue(expr);
    }
    if ((0, reflection_1.isLiteralBoolean)(expr)) {
        return expr.token.text.toLowerCase() === 'true';
    }
    if ((0, reflection_1.isArrayLiteralExpression)(expr)) {
        return expr.elements
            .filter(e => !(0, reflection_1.isCommentStatement)(e))
            .map(e => expressionToValue(e, strict));
    }
    if ((0, reflection_1.isAALiteralExpression)(expr)) {
        return expr.elements.reduce((acc, e) => {
            if (!(0, reflection_1.isCommentStatement)(e)) {
                acc[e.keyToken.text] = expressionToValue(e.value, strict);
            }
            return acc;
        }, {});
    }
    //for annotations, we only support serializing pure string values
    if ((0, reflection_1.isTemplateStringExpression)(expr)) {
        if (((_a = expr.quasis) === null || _a === void 0 ? void 0 : _a.length) === 1 && expr.expressions.length === 0) {
            return expr.quasis[0].expressions.map(x => x.token.text).join('');
        }
    }
    return strict ? null : expr;
}
function numberExpressionToValue(expr, operator = '') {
    if ((0, reflection_1.isIntegerType)(expr.type) || (0, reflection_1.isLongIntegerType)(expr.type)) {
        return parseInt(operator + expr.token.text);
    }
    else {
        return parseFloat(operator + expr.token.text);
    }
}
/**
 * A list of names of functions that are restricted from being stored to a
 * variable, property, or passed as an argument. (i.e. `type` or `createobject`).
 * Names are stored in lower case.
 */
const nonReferenceableFunctions = [
    'createobject',
    'type',
    'getglobalaa',
    'box',
    'run',
    'eval',
    'getlastruncompileerror',
    'getlastrunruntimeerror',
    'tab',
    'pos'
];
//# sourceMappingURL=Expression.js.map
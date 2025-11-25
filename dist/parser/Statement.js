"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AliasStatement = exports.TypecastStatement = exports.ContinueStatement = exports.ConstStatement = exports.EnumMemberStatement = exports.EnumStatement = exports.ThrowStatement = exports.CatchStatement = exports.TryCatchStatement = exports.ClassFieldStatement = exports.FieldStatement = exports.ClassMethodStatement = exports.MethodStatement = exports.ClassStatement = exports.InterfaceMethodStatement = exports.InterfaceFieldStatement = exports.InterfaceStatement = exports.ImportStatement = exports.NamespaceStatement = exports.LibraryStatement = exports.IndexedSetStatement = exports.DottedSetStatement = exports.WhileStatement = exports.ForEachStatement = exports.ForStatement = exports.StopStatement = exports.EndStatement = exports.ReturnStatement = exports.LabelStatement = exports.GotoStatement = exports.DimStatement = exports.PrintStatement = exports.IncrementStatement = exports.IfStatement = exports.FunctionStatement = exports.ExitWhileStatement = exports.ExitForStatement = exports.CommentStatement = exports.ExpressionStatement = exports.Block = exports.AssignmentStatement = exports.Body = exports.EmptyStatement = void 0;
const TokenKind_1 = require("../lexer/TokenKind");
const Expression_1 = require("./Expression");
const Expression_2 = require("./Expression");
const util_1 = require("../util");
const Parser_1 = require("./Parser");
const visitors_1 = require("../astUtils/visitors");
const reflection_1 = require("../astUtils/reflection");
const creators_1 = require("../astUtils/creators");
const DynamicType_1 = require("../types/DynamicType");
const SymbolTable_1 = require("../SymbolTable");
const AstNode_1 = require("./AstNode");
class EmptyStatement extends AstNode_1.Statement {
    constructor(
    /**
     * Create a negative range to indicate this is an interpolated location
     */
    range = undefined) {
        super();
        this.range = range;
    }
    transpile(state) {
        return [];
    }
    walk(visitor, options) {
        //nothing to walk
    }
    clone() {
        return this.finalizeClone(new EmptyStatement(util_1.util.cloneRange(this.range)));
    }
}
exports.EmptyStatement = EmptyStatement;
/**
 * This is a top-level statement. Consider this the root of the AST
 */
class Body extends AstNode_1.Statement {
    constructor(statements = []) {
        super();
        this.statements = statements;
        this.symbolTable = new SymbolTable_1.SymbolTable('Body', () => { var _a; return (_a = this.parent) === null || _a === void 0 ? void 0 : _a.getSymbolTable(); });
    }
    get range() {
        var _a;
        //this needs to be a getter because the body has its statements pushed to it after being constructed
        return util_1.util.createBoundingRange(...((_a = this.statements) !== null && _a !== void 0 ? _a : []));
    }
    transpile(state) {
        var _a, _b;
        let result = [];
        for (let i = 0; i < this.statements.length; i++) {
            let statement = this.statements[i];
            let previousStatement = this.statements[i - 1];
            let nextStatement = this.statements[i + 1];
            if (!previousStatement) {
                //this is the first statement. do nothing related to spacing and newlines
                //if comment is on same line as prior sibling
            }
            else if ((0, reflection_1.isCommentStatement)(statement) && previousStatement && ((_a = statement.range) === null || _a === void 0 ? void 0 : _a.start.line) === ((_b = previousStatement.range) === null || _b === void 0 ? void 0 : _b.end.line)) {
                result.push(' ');
                //add double newline if this is a comment, and next is a function
            }
            else if ((0, reflection_1.isCommentStatement)(statement) && nextStatement && (0, reflection_1.isFunctionStatement)(nextStatement)) {
                result.push(state.newline, state.newline);
                //add double newline if is function not preceeded by a comment
            }
            else if ((0, reflection_1.isFunctionStatement)(statement) && previousStatement && !((0, reflection_1.isCommentStatement)(previousStatement))) {
                result.push(state.newline, state.newline);
            }
            else {
                //separate statements by a single newline
                result.push(state.newline);
            }
            result.push(...statement.transpile(state));
        }
        return result;
    }
    getTypedef(state) {
        let result = [];
        for (const statement of this.statements) {
            //if the current statement supports generating typedef, call it
            if ((0, reflection_1.isTypedefProvider)(statement)) {
                result.push(state.indent(), ...statement.getTypedef(state), state.newline);
            }
        }
        return result;
    }
    walk(visitor, options) {
        if (options.walkMode & visitors_1.InternalWalkMode.walkStatements) {
            (0, visitors_1.walkArray)(this.statements, visitor, options, this);
        }
    }
    clone() {
        var _a;
        return this.finalizeClone(new Body((_a = this.statements) === null || _a === void 0 ? void 0 : _a.map(s => s === null || s === void 0 ? void 0 : s.clone())), ['statements']);
    }
}
exports.Body = Body;
class AssignmentStatement extends AstNode_1.Statement {
    constructor(equals, name, value) {
        super();
        this.equals = equals;
        this.name = name;
        this.value = value;
        this.range = util_1.util.createBoundingRange(name, equals, value);
    }
    /**
     * Get the name of the wrapping namespace (if it exists)
     * @deprecated use `.findAncestor(isFunctionExpression)` instead.
     */
    get containingFunction() {
        return this.findAncestor(reflection_1.isFunctionExpression);
    }
    transpile(state) {
        var _a, _b;
        //if the value is a compound assignment, just transpile the expression itself
        if (TokenKind_1.CompoundAssignmentOperators.includes((_b = (_a = this.value) === null || _a === void 0 ? void 0 : _a.operator) === null || _b === void 0 ? void 0 : _b.kind)) {
            return this.value.transpile(state);
        }
        else {
            return [
                state.transpileToken(this.name),
                ' ',
                state.transpileToken(this.equals),
                ' ',
                ...this.value.transpile(state)
            ];
        }
    }
    walk(visitor, options) {
        if (options.walkMode & visitors_1.InternalWalkMode.walkExpressions) {
            (0, visitors_1.walk)(this, 'value', visitor, options);
        }
    }
    clone() {
        var _a;
        return this.finalizeClone(new AssignmentStatement(util_1.util.cloneToken(this.equals), util_1.util.cloneToken(this.name), (_a = this.value) === null || _a === void 0 ? void 0 : _a.clone()), ['value']);
    }
}
exports.AssignmentStatement = AssignmentStatement;
class Block extends AstNode_1.Statement {
    constructor(statements, startingRange) {
        super();
        this.statements = statements;
        this.startingRange = startingRange;
        this.range = util_1.util.createBoundingRange({ range: this.startingRange }, ...(statements !== null && statements !== void 0 ? statements : []));
    }
    transpile(state) {
        state.blockDepth++;
        let results = [];
        for (let i = 0; i < this.statements.length; i++) {
            let previousStatement = this.statements[i - 1];
            let statement = this.statements[i];
            //if comment is on same line as parent
            if ((0, reflection_1.isCommentStatement)(statement) &&
                (util_1.util.linesTouch(state.lineage[0], statement) || util_1.util.linesTouch(previousStatement, statement))) {
                results.push(' ');
                //is not a comment
            }
            else {
                //add a newline and indent
                results.push(state.newline, state.indent());
            }
            //push block onto parent list
            state.lineage.unshift(this);
            results.push(...statement.transpile(state));
            state.lineage.shift();
        }
        state.blockDepth--;
        return results;
    }
    walk(visitor, options) {
        if (options.walkMode & visitors_1.InternalWalkMode.walkStatements) {
            (0, visitors_1.walkArray)(this.statements, visitor, options, this);
        }
    }
    clone() {
        var _a;
        return this.finalizeClone(new Block((_a = this.statements) === null || _a === void 0 ? void 0 : _a.map(s => s === null || s === void 0 ? void 0 : s.clone()), util_1.util.cloneRange(this.startingRange)), ['statements']);
    }
}
exports.Block = Block;
class ExpressionStatement extends AstNode_1.Statement {
    constructor(expression) {
        var _a;
        super();
        this.expression = expression;
        this.range = (_a = this.expression) === null || _a === void 0 ? void 0 : _a.range;
    }
    transpile(state) {
        return this.expression.transpile(state);
    }
    walk(visitor, options) {
        if (options.walkMode & visitors_1.InternalWalkMode.walkExpressions) {
            (0, visitors_1.walk)(this, 'expression', visitor, options);
        }
    }
    clone() {
        var _a;
        return this.finalizeClone(new ExpressionStatement((_a = this.expression) === null || _a === void 0 ? void 0 : _a.clone()), ['expression']);
    }
}
exports.ExpressionStatement = ExpressionStatement;
class CommentStatement extends AstNode_1.Statement {
    constructor(comments) {
        var _a;
        super();
        this.comments = comments;
        this.visitMode = visitors_1.InternalWalkMode.visitStatements | visitors_1.InternalWalkMode.visitExpressions;
        if (((_a = this.comments) === null || _a === void 0 ? void 0 : _a.length) > 0) {
            this.range = util_1.util.createBoundingRange(...this.comments);
        }
    }
    get text() {
        return this.comments.map(x => x.text).join('\n');
    }
    transpile(state) {
        let result = [];
        for (let i = 0; i < this.comments.length; i++) {
            let comment = this.comments[i];
            if (i > 0) {
                result.push(state.indent());
            }
            result.push(state.transpileToken(comment));
            //add newline for all except final comment
            if (i < this.comments.length - 1) {
                result.push(state.newline);
            }
        }
        return result;
    }
    getTypedef(state) {
        return this.transpile(state);
    }
    walk(visitor, options) {
        //nothing to walk
    }
    clone() {
        var _a;
        return this.finalizeClone(new CommentStatement((_a = this.comments) === null || _a === void 0 ? void 0 : _a.map(x => util_1.util.cloneToken(x))), ['comments']);
    }
}
exports.CommentStatement = CommentStatement;
class ExitForStatement extends AstNode_1.Statement {
    constructor(tokens) {
        super();
        this.tokens = tokens;
        this.range = this.tokens.exitFor.range;
    }
    transpile(state) {
        return [
            state.transpileToken(this.tokens.exitFor)
        ];
    }
    walk(visitor, options) {
        //nothing to walk
    }
    clone() {
        return this.finalizeClone(new ExitForStatement({
            exitFor: util_1.util.cloneToken(this.tokens.exitFor)
        }));
    }
}
exports.ExitForStatement = ExitForStatement;
class ExitWhileStatement extends AstNode_1.Statement {
    constructor(tokens) {
        super();
        this.tokens = tokens;
        this.range = this.tokens.exitWhile.range;
    }
    transpile(state) {
        return [
            state.transpileToken(this.tokens.exitWhile)
        ];
    }
    walk(visitor, options) {
        //nothing to walk
    }
    clone() {
        return this.finalizeClone(new ExitWhileStatement({
            exitWhile: util_1.util.cloneToken(this.tokens.exitWhile)
        }));
    }
}
exports.ExitWhileStatement = ExitWhileStatement;
class FunctionStatement extends AstNode_1.Statement {
    constructor(name, func) {
        var _a;
        super();
        this.name = name;
        this.func = func;
        this.range = (_a = this.func) === null || _a === void 0 ? void 0 : _a.range;
    }
    /**
     * Get the name of this expression based on the parse mode
     */
    getName(parseMode) {
        var _a;
        const namespace = this.findAncestor(reflection_1.isNamespaceStatement);
        if (namespace) {
            let delimiter = parseMode === Parser_1.ParseMode.BrighterScript ? '.' : '_';
            let namespaceName = namespace.getName(parseMode);
            return namespaceName + delimiter + ((_a = this.name) === null || _a === void 0 ? void 0 : _a.text);
        }
        else {
            return this.name.text;
        }
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
        //create a fake token using the full transpiled name
        let nameToken = Object.assign(Object.assign({}, this.name), { text: this.getName(Parser_1.ParseMode.BrightScript) });
        return this.func.transpile(state, nameToken);
    }
    getTypedef(state) {
        var _a;
        let result = [];
        for (let annotation of (_a = this.annotations) !== null && _a !== void 0 ? _a : []) {
            result.push(...annotation.getTypedef(state), state.newline, state.indent());
        }
        result.push(...this.func.getTypedef(state));
        return result;
    }
    walk(visitor, options) {
        if (options.walkMode & visitors_1.InternalWalkMode.walkExpressions) {
            (0, visitors_1.walk)(this, 'func', visitor, options);
        }
    }
    clone() {
        var _a;
        return this.finalizeClone(new FunctionStatement(util_1.util.cloneToken(this.name), (_a = this.func) === null || _a === void 0 ? void 0 : _a.clone()), ['func']);
    }
}
exports.FunctionStatement = FunctionStatement;
class IfStatement extends AstNode_1.Statement {
    constructor(tokens, condition, thenBranch, elseBranch, isInline) {
        super();
        this.tokens = tokens;
        this.condition = condition;
        this.thenBranch = thenBranch;
        this.elseBranch = elseBranch;
        this.isInline = isInline;
        this.range = util_1.util.createBoundingRange(tokens.if, condition, tokens.then, thenBranch, tokens.else, elseBranch, tokens.endIf);
    }
    transpile(state) {
        let results = [];
        //if   (already indented by block)
        results.push(state.transpileToken(this.tokens.if));
        results.push(' ');
        //conditions
        results.push(...this.condition.transpile(state));
        //then
        if (this.tokens.then) {
            results.push(' ');
            results.push(state.transpileToken(this.tokens.then));
        }
        state.lineage.unshift(this);
        //if statement body
        let thenNodes = this.thenBranch.transpile(state);
        state.lineage.shift();
        if (thenNodes.length > 0) {
            results.push(thenNodes);
        }
        results.push('\n');
        //else branch
        if (this.tokens.else) {
            //else
            results.push(state.indent(), state.transpileToken(this.tokens.else));
        }
        if (this.elseBranch) {
            if ((0, reflection_1.isIfStatement)(this.elseBranch)) {
                //chained elseif
                state.lineage.unshift(this.elseBranch);
                let body = this.elseBranch.transpile(state);
                state.lineage.shift();
                if (body.length > 0) {
                    //zero or more spaces between the `else` and the `if`
                    results.push(this.elseBranch.tokens.if.leadingWhitespace);
                    results.push(...body);
                    // stop here because chained if will transpile the rest
                    return results;
                }
                else {
                    results.push('\n');
                }
            }
            else {
                //else body
                state.lineage.unshift(this.tokens.else);
                let body = this.elseBranch.transpile(state);
                state.lineage.shift();
                if (body.length > 0) {
                    results.push(...body);
                }
                results.push('\n');
            }
        }
        //end if
        results.push(state.indent());
        if (this.tokens.endIf) {
            results.push(state.transpileToken(this.tokens.endIf));
        }
        else {
            results.push('end if');
        }
        return results;
    }
    walk(visitor, options) {
        if (options.walkMode & visitors_1.InternalWalkMode.walkExpressions) {
            (0, visitors_1.walk)(this, 'condition', visitor, options);
        }
        if (options.walkMode & visitors_1.InternalWalkMode.walkStatements) {
            (0, visitors_1.walk)(this, 'thenBranch', visitor, options);
        }
        if (this.elseBranch && options.walkMode & visitors_1.InternalWalkMode.walkStatements) {
            (0, visitors_1.walk)(this, 'elseBranch', visitor, options);
        }
    }
    clone() {
        var _a, _b, _c;
        return this.finalizeClone(new IfStatement({
            if: util_1.util.cloneToken(this.tokens.if),
            else: util_1.util.cloneToken(this.tokens.else),
            endIf: util_1.util.cloneToken(this.tokens.endIf),
            then: util_1.util.cloneToken(this.tokens.then)
        }, (_a = this.condition) === null || _a === void 0 ? void 0 : _a.clone(), (_b = this.thenBranch) === null || _b === void 0 ? void 0 : _b.clone(), (_c = this.elseBranch) === null || _c === void 0 ? void 0 : _c.clone(), this.isInline), ['condition', 'thenBranch', 'elseBranch']);
    }
}
exports.IfStatement = IfStatement;
class IncrementStatement extends AstNode_1.Statement {
    constructor(value, operator) {
        super();
        this.value = value;
        this.operator = operator;
        this.range = util_1.util.createBoundingRange(value, operator);
    }
    transpile(state) {
        return [
            ...this.value.transpile(state),
            state.transpileToken(this.operator)
        ];
    }
    walk(visitor, options) {
        if (options.walkMode & visitors_1.InternalWalkMode.walkExpressions) {
            (0, visitors_1.walk)(this, 'value', visitor, options);
        }
    }
    clone() {
        var _a;
        return this.finalizeClone(new IncrementStatement((_a = this.value) === null || _a === void 0 ? void 0 : _a.clone(), util_1.util.cloneToken(this.operator)), ['value']);
    }
}
exports.IncrementStatement = IncrementStatement;
/**
 * Represents a `print` statement within BrightScript.
 */
class PrintStatement extends AstNode_1.Statement {
    /**
     * Creates a new internal representation of a BrightScript `print` statement.
     * @param tokens the tokens for this statement
     * @param tokens.print a print token
     * @param expressions an array of expressions or `PrintSeparator`s to be evaluated and printed.
     */
    constructor(tokens, expressions) {
        super();
        this.tokens = tokens;
        this.expressions = expressions;
        this.range = util_1.util.createBoundingRange(tokens.print, ...(expressions !== null && expressions !== void 0 ? expressions : []));
    }
    transpile(state) {
        var _a;
        let result = [
            state.transpileToken(this.tokens.print),
            ' '
        ];
        for (let i = 0; i < this.expressions.length; i++) {
            const expressionOrSeparator = this.expressions[i];
            if (expressionOrSeparator.transpile) {
                result.push(...expressionOrSeparator.transpile(state));
            }
            else {
                result.push(state.tokenToSourceNode(expressionOrSeparator));
            }
            //if there's an expression after us, add a space
            if ((_a = this.expressions[i + 1]) === null || _a === void 0 ? void 0 : _a.transpile) {
                result.push(' ');
            }
        }
        return result;
    }
    walk(visitor, options) {
        if (options.walkMode & visitors_1.InternalWalkMode.walkExpressions) {
            //sometimes we have semicolon Tokens in the expressions list (should probably fix that...), so only walk the actual expressions
            (0, visitors_1.walkArray)(this.expressions, visitor, options, this, (item) => (0, reflection_1.isExpression)(item));
        }
    }
    clone() {
        var _a;
        return this.finalizeClone(new PrintStatement({
            print: util_1.util.cloneToken(this.tokens.print)
        }, (_a = this.expressions) === null || _a === void 0 ? void 0 : _a.map(e => {
            if ((0, reflection_1.isExpression)(e)) {
                return e.clone();
            }
            else {
                return util_1.util.cloneToken(e);
            }
        })), ['expressions']);
    }
}
exports.PrintStatement = PrintStatement;
class DimStatement extends AstNode_1.Statement {
    constructor(dimToken, identifier, openingSquare, dimensions, closingSquare) {
        super();
        this.dimToken = dimToken;
        this.identifier = identifier;
        this.openingSquare = openingSquare;
        this.dimensions = dimensions;
        this.closingSquare = closingSquare;
        this.range = util_1.util.createBoundingRange(dimToken, identifier, openingSquare, ...(dimensions !== null && dimensions !== void 0 ? dimensions : []), closingSquare);
    }
    transpile(state) {
        let result = [
            state.transpileToken(this.dimToken),
            ' ',
            state.transpileToken(this.identifier),
            state.transpileToken(this.openingSquare)
        ];
        for (let i = 0; i < this.dimensions.length; i++) {
            if (i > 0) {
                result.push(', ');
            }
            result.push(...this.dimensions[i].transpile(state));
        }
        result.push(state.transpileToken(this.closingSquare));
        return result;
    }
    walk(visitor, options) {
        var _a, _b;
        if (((_a = this.dimensions) === null || _a === void 0 ? void 0 : _a.length) !== undefined && ((_b = this.dimensions) === null || _b === void 0 ? void 0 : _b.length) > 0 && options.walkMode & visitors_1.InternalWalkMode.walkExpressions) {
            (0, visitors_1.walkArray)(this.dimensions, visitor, options, this);
        }
    }
    clone() {
        var _a;
        return this.finalizeClone(new DimStatement(util_1.util.cloneToken(this.dimToken), util_1.util.cloneToken(this.identifier), util_1.util.cloneToken(this.openingSquare), (_a = this.dimensions) === null || _a === void 0 ? void 0 : _a.map(e => e === null || e === void 0 ? void 0 : e.clone()), util_1.util.cloneToken(this.closingSquare)), ['dimensions']);
    }
}
exports.DimStatement = DimStatement;
class GotoStatement extends AstNode_1.Statement {
    constructor(tokens) {
        super();
        this.tokens = tokens;
        this.range = util_1.util.createBoundingRange(tokens.goto, tokens.label);
    }
    transpile(state) {
        return [
            state.transpileToken(this.tokens.goto),
            ' ',
            state.transpileToken(this.tokens.label)
        ];
    }
    walk(visitor, options) {
        //nothing to walk
    }
    clone() {
        return this.finalizeClone(new GotoStatement({
            goto: util_1.util.cloneToken(this.tokens.goto),
            label: util_1.util.cloneToken(this.tokens.label)
        }));
    }
}
exports.GotoStatement = GotoStatement;
class LabelStatement extends AstNode_1.Statement {
    constructor(tokens) {
        super();
        this.tokens = tokens;
        this.range = util_1.util.createBoundingRange(tokens.identifier, tokens.colon);
    }
    transpile(state) {
        return [
            state.transpileToken(this.tokens.identifier),
            state.transpileToken(this.tokens.colon)
        ];
    }
    walk(visitor, options) {
        //nothing to walk
    }
    clone() {
        return this.finalizeClone(new LabelStatement({
            identifier: util_1.util.cloneToken(this.tokens.identifier),
            colon: util_1.util.cloneToken(this.tokens.colon)
        }));
    }
}
exports.LabelStatement = LabelStatement;
class ReturnStatement extends AstNode_1.Statement {
    constructor(tokens, value) {
        super();
        this.tokens = tokens;
        this.value = value;
        this.range = util_1.util.createBoundingRange(tokens.return, value);
    }
    transpile(state) {
        let result = [];
        result.push(state.transpileToken(this.tokens.return));
        if (this.value) {
            result.push(' ');
            result.push(...this.value.transpile(state));
        }
        return result;
    }
    walk(visitor, options) {
        if (options.walkMode & visitors_1.InternalWalkMode.walkExpressions) {
            (0, visitors_1.walk)(this, 'value', visitor, options);
        }
    }
    clone() {
        var _a;
        return this.finalizeClone(new ReturnStatement({
            return: util_1.util.cloneToken(this.tokens.return)
        }, (_a = this.value) === null || _a === void 0 ? void 0 : _a.clone()), ['value']);
    }
}
exports.ReturnStatement = ReturnStatement;
class EndStatement extends AstNode_1.Statement {
    constructor(tokens) {
        super();
        this.tokens = tokens;
        this.range = tokens.end.range;
    }
    transpile(state) {
        return [
            state.transpileToken(this.tokens.end)
        ];
    }
    walk(visitor, options) {
        //nothing to walk
    }
    clone() {
        return this.finalizeClone(new EndStatement({
            end: util_1.util.cloneToken(this.tokens.end)
        }));
    }
}
exports.EndStatement = EndStatement;
class StopStatement extends AstNode_1.Statement {
    constructor(tokens) {
        var _a;
        super();
        this.tokens = tokens;
        this.range = (_a = tokens === null || tokens === void 0 ? void 0 : tokens.stop) === null || _a === void 0 ? void 0 : _a.range;
    }
    transpile(state) {
        return [
            state.transpileToken(this.tokens.stop)
        ];
    }
    walk(visitor, options) {
        //nothing to walk
    }
    clone() {
        return this.finalizeClone(new StopStatement({
            stop: util_1.util.cloneToken(this.tokens.stop)
        }));
    }
}
exports.StopStatement = StopStatement;
class ForStatement extends AstNode_1.Statement {
    constructor(forToken, counterDeclaration, toToken, finalValue, body, endForToken, stepToken, increment) {
        super();
        this.forToken = forToken;
        this.counterDeclaration = counterDeclaration;
        this.toToken = toToken;
        this.finalValue = finalValue;
        this.body = body;
        this.endForToken = endForToken;
        this.stepToken = stepToken;
        this.increment = increment;
        this.range = util_1.util.createBoundingRange(forToken, counterDeclaration, toToken, finalValue, stepToken, increment, body, endForToken);
    }
    transpile(state) {
        let result = [];
        //for
        result.push(state.transpileToken(this.forToken), ' ');
        //i=1
        result.push(...this.counterDeclaration.transpile(state), ' ');
        //to
        result.push(state.transpileToken(this.toToken), ' ');
        //final value
        result.push(this.finalValue.transpile(state));
        //step
        if (this.stepToken) {
            result.push(' ', state.transpileToken(this.stepToken), ' ', this.increment.transpile(state));
        }
        //loop body
        state.lineage.unshift(this);
        result.push(...this.body.transpile(state));
        state.lineage.shift();
        // add new line before "end for"
        result.push('\n');
        //end for
        result.push(state.indent(), state.transpileToken(this.endForToken));
        return result;
    }
    walk(visitor, options) {
        if (options.walkMode & visitors_1.InternalWalkMode.walkStatements) {
            (0, visitors_1.walk)(this, 'counterDeclaration', visitor, options);
        }
        if (options.walkMode & visitors_1.InternalWalkMode.walkExpressions) {
            (0, visitors_1.walk)(this, 'finalValue', visitor, options);
            (0, visitors_1.walk)(this, 'increment', visitor, options);
        }
        if (options.walkMode & visitors_1.InternalWalkMode.walkStatements) {
            (0, visitors_1.walk)(this, 'body', visitor, options);
        }
    }
    clone() {
        var _a, _b, _c, _d;
        return this.finalizeClone(new ForStatement(util_1.util.cloneToken(this.forToken), (_a = this.counterDeclaration) === null || _a === void 0 ? void 0 : _a.clone(), util_1.util.cloneToken(this.toToken), (_b = this.finalValue) === null || _b === void 0 ? void 0 : _b.clone(), (_c = this.body) === null || _c === void 0 ? void 0 : _c.clone(), util_1.util.cloneToken(this.endForToken), util_1.util.cloneToken(this.stepToken), (_d = this.increment) === null || _d === void 0 ? void 0 : _d.clone()), ['counterDeclaration', 'finalValue', 'body', 'increment']);
    }
}
exports.ForStatement = ForStatement;
class ForEachStatement extends AstNode_1.Statement {
    constructor(tokens, item, target, body) {
        super();
        this.tokens = tokens;
        this.item = item;
        this.target = target;
        this.body = body;
        this.range = util_1.util.createBoundingRange(tokens.forEach, item, tokens.in, target, body, tokens.endFor);
    }
    transpile(state) {
        let result = [];
        //for each
        result.push(state.transpileToken(this.tokens.forEach), ' ');
        //item
        result.push(state.transpileToken(this.item), ' ');
        //in
        result.push(state.transpileToken(this.tokens.in), ' ');
        //target
        result.push(...this.target.transpile(state));
        //body
        state.lineage.unshift(this);
        result.push(...this.body.transpile(state));
        state.lineage.shift();
        // add new line before "end for"
        result.push('\n');
        //end for
        result.push(state.indent(), state.transpileToken(this.tokens.endFor));
        return result;
    }
    walk(visitor, options) {
        if (options.walkMode & visitors_1.InternalWalkMode.walkExpressions) {
            (0, visitors_1.walk)(this, 'target', visitor, options);
        }
        if (options.walkMode & visitors_1.InternalWalkMode.walkStatements) {
            (0, visitors_1.walk)(this, 'body', visitor, options);
        }
    }
    clone() {
        var _a, _b;
        return this.finalizeClone(new ForEachStatement({
            forEach: util_1.util.cloneToken(this.tokens.forEach),
            in: util_1.util.cloneToken(this.tokens.in),
            endFor: util_1.util.cloneToken(this.tokens.endFor)
        }, util_1.util.cloneToken(this.item), (_a = this.target) === null || _a === void 0 ? void 0 : _a.clone(), (_b = this.body) === null || _b === void 0 ? void 0 : _b.clone()), ['target', 'body']);
    }
}
exports.ForEachStatement = ForEachStatement;
class WhileStatement extends AstNode_1.Statement {
    constructor(tokens, condition, body) {
        super();
        this.tokens = tokens;
        this.condition = condition;
        this.body = body;
        this.range = util_1.util.createBoundingRange(tokens.while, condition, body, tokens.endWhile);
    }
    transpile(state) {
        let result = [];
        //while
        result.push(state.transpileToken(this.tokens.while), ' ');
        //condition
        result.push(...this.condition.transpile(state));
        state.lineage.unshift(this);
        //body
        result.push(...this.body.transpile(state));
        state.lineage.shift();
        //trailing newline only if we have body statements
        result.push('\n');
        //end while
        result.push(state.indent(), state.transpileToken(this.tokens.endWhile));
        return result;
    }
    walk(visitor, options) {
        if (options.walkMode & visitors_1.InternalWalkMode.walkExpressions) {
            (0, visitors_1.walk)(this, 'condition', visitor, options);
        }
        if (options.walkMode & visitors_1.InternalWalkMode.walkStatements) {
            (0, visitors_1.walk)(this, 'body', visitor, options);
        }
    }
    clone() {
        var _a, _b;
        return this.finalizeClone(new WhileStatement({
            while: util_1.util.cloneToken(this.tokens.while),
            endWhile: util_1.util.cloneToken(this.tokens.endWhile)
        }, (_a = this.condition) === null || _a === void 0 ? void 0 : _a.clone(), (_b = this.body) === null || _b === void 0 ? void 0 : _b.clone()), ['condition', 'body']);
    }
}
exports.WhileStatement = WhileStatement;
class DottedSetStatement extends AstNode_1.Statement {
    constructor(obj, name, value, dot, equals) {
        super();
        this.obj = obj;
        this.name = name;
        this.value = value;
        this.dot = dot;
        this.equals = equals;
        this.range = util_1.util.createBoundingRange(obj, dot, name, equals, value);
    }
    transpile(state) {
        var _a, _b;
        //if the value is a compound assignment, don't add the obj, dot, name, or operator...the expression will handle that
        if (TokenKind_1.CompoundAssignmentOperators.includes((_b = (_a = this.value) === null || _a === void 0 ? void 0 : _a.operator) === null || _b === void 0 ? void 0 : _b.kind)) {
            return this.value.transpile(state);
        }
        else {
            return [
                //object
                ...this.obj.transpile(state),
                this.dot ? state.tokenToSourceNode(this.dot) : '.',
                //name
                state.transpileToken(this.name),
                ' ',
                state.transpileToken(this.equals, '='),
                ' ',
                //right-hand-side of assignment
                ...this.value.transpile(state)
            ];
        }
    }
    walk(visitor, options) {
        if (options.walkMode & visitors_1.InternalWalkMode.walkExpressions) {
            (0, visitors_1.walk)(this, 'obj', visitor, options);
            (0, visitors_1.walk)(this, 'value', visitor, options);
        }
    }
    clone() {
        var _a, _b;
        return this.finalizeClone(new DottedSetStatement((_a = this.obj) === null || _a === void 0 ? void 0 : _a.clone(), util_1.util.cloneToken(this.name), (_b = this.value) === null || _b === void 0 ? void 0 : _b.clone(), util_1.util.cloneToken(this.dot), util_1.util.cloneToken(this.equals)), ['obj', 'value']);
    }
}
exports.DottedSetStatement = DottedSetStatement;
class IndexedSetStatement extends AstNode_1.Statement {
    constructor(obj, index, value, openingSquare, closingSquare, additionalIndexes, equals) {
        var _a;
        super();
        this.obj = obj;
        this.index = index;
        this.value = value;
        this.openingSquare = openingSquare;
        this.closingSquare = closingSquare;
        this.additionalIndexes = additionalIndexes;
        this.equals = equals;
        (_a = this.additionalIndexes) !== null && _a !== void 0 ? _a : (this.additionalIndexes = []);
        this.range = util_1.util.createBoundingRange(obj, openingSquare, index, closingSquare, equals, value, ...this.additionalIndexes);
    }
    transpile(state) {
        var _a, _b, _c, _d;
        //if the value is a component assignment, don't add the obj, index or operator...the expression will handle that
        if (TokenKind_1.CompoundAssignmentOperators.includes((_b = (_a = this.value) === null || _a === void 0 ? void 0 : _a.operator) === null || _b === void 0 ? void 0 : _b.kind)) {
            return this.value.transpile(state);
        }
        else {
            const result = [];
            result.push(
            //obj
            ...this.obj.transpile(state), 
            //   [
            state.transpileToken(this.openingSquare));
            const indexes = [this.index, ...(_c = this.additionalIndexes) !== null && _c !== void 0 ? _c : []];
            for (let i = 0; i < indexes.length; i++) {
                //add comma between indexes
                if (i > 0) {
                    result.push(', ');
                }
                let index = indexes[i];
                result.push(...((_d = index === null || index === void 0 ? void 0 : index.transpile(state)) !== null && _d !== void 0 ? _d : []));
            }
            result.push(state.transpileToken(this.closingSquare), ' ', state.transpileToken(this.equals, '='), ' ', ...this.value.transpile(state));
            return result;
        }
    }
    walk(visitor, options) {
        if (options.walkMode & visitors_1.InternalWalkMode.walkExpressions) {
            (0, visitors_1.walk)(this, 'obj', visitor, options);
            (0, visitors_1.walk)(this, 'index', visitor, options);
            (0, visitors_1.walkArray)(this.additionalIndexes, visitor, options, this);
            (0, visitors_1.walk)(this, 'value', visitor, options);
        }
    }
    clone() {
        var _a, _b, _c, _d;
        return this.finalizeClone(new IndexedSetStatement((_a = this.obj) === null || _a === void 0 ? void 0 : _a.clone(), (_b = this.index) === null || _b === void 0 ? void 0 : _b.clone(), (_c = this.value) === null || _c === void 0 ? void 0 : _c.clone(), util_1.util.cloneToken(this.openingSquare), util_1.util.cloneToken(this.closingSquare), (_d = this.additionalIndexes) === null || _d === void 0 ? void 0 : _d.map(e => e === null || e === void 0 ? void 0 : e.clone()), util_1.util.cloneToken(this.equals)), ['obj', 'index', 'value', 'additionalIndexes']);
    }
}
exports.IndexedSetStatement = IndexedSetStatement;
class LibraryStatement extends AstNode_1.Statement {
    constructor(tokens) {
        var _a, _b;
        super();
        this.tokens = tokens;
        this.range = util_1.util.createBoundingRange((_a = this.tokens) === null || _a === void 0 ? void 0 : _a.library, (_b = this.tokens) === null || _b === void 0 ? void 0 : _b.filePath);
    }
    transpile(state) {
        let result = [];
        result.push(state.transpileToken(this.tokens.library));
        //there will be a parse error if file path is missing, but let's prevent a runtime error just in case
        if (this.tokens.filePath) {
            result.push(' ', state.transpileToken(this.tokens.filePath));
        }
        return result;
    }
    getTypedef(state) {
        return this.transpile(state);
    }
    walk(visitor, options) {
        //nothing to walk
    }
    clone() {
        var _a, _b;
        return this.finalizeClone(new LibraryStatement(this.tokens === undefined ? undefined : {
            library: util_1.util.cloneToken((_a = this.tokens) === null || _a === void 0 ? void 0 : _a.library),
            filePath: util_1.util.cloneToken((_b = this.tokens) === null || _b === void 0 ? void 0 : _b.filePath)
        }));
    }
}
exports.LibraryStatement = LibraryStatement;
class NamespaceStatement extends AstNode_1.Statement {
    constructor(keyword, 
    // this should technically only be a VariableExpression or DottedGetExpression, but that can be enforced elsewhere
    nameExpression, body, endKeyword) {
        super();
        this.keyword = keyword;
        this.nameExpression = nameExpression;
        this.body = body;
        this.endKeyword = endKeyword;
        this.symbolTable = new SymbolTable_1.SymbolTable(`NamespaceStatement: '${this.name}'`, () => { var _a; return (_a = this.parent) === null || _a === void 0 ? void 0 : _a.getSymbolTable(); });
    }
    /**
     * The string name for this namespace
     */
    get name() {
        return this.getName(Parser_1.ParseMode.BrighterScript);
    }
    get range() {
        return this.cacheRange();
    }
    cacheRange() {
        if (!this._range) {
            this._range = util_1.util.createBoundingRange(this.keyword, this.nameExpression, this.body, this.endKeyword);
        }
        return this._range;
    }
    getName(parseMode) {
        var _a, _b;
        const parentNamespace = this.findAncestor(reflection_1.isNamespaceStatement);
        let name = (_b = (_a = this.nameExpression) === null || _a === void 0 ? void 0 : _a.getName) === null || _b === void 0 ? void 0 : _b.call(_a, parseMode);
        if (!name) {
            return name;
        }
        if (parentNamespace) {
            const sep = parseMode === Parser_1.ParseMode.BrighterScript ? '.' : '_';
            name = parentNamespace.getName(parseMode) + sep + name;
        }
        return name;
    }
    transpile(state) {
        //namespaces don't actually have any real content, so just transpile their bodies
        return this.body.transpile(state);
    }
    getTypedef(state) {
        let result = [
            'namespace ',
            ...this.getName(Parser_1.ParseMode.BrighterScript),
            state.newline
        ];
        state.blockDepth++;
        result.push(...this.body.getTypedef(state));
        state.blockDepth--;
        result.push(state.indent(), 'end namespace');
        return result;
    }
    walk(visitor, options) {
        if (options.walkMode & visitors_1.InternalWalkMode.walkExpressions) {
            (0, visitors_1.walk)(this, 'nameExpression', visitor, options);
        }
        if (this.body.statements.length > 0 && options.walkMode & visitors_1.InternalWalkMode.walkStatements) {
            (0, visitors_1.walk)(this, 'body', visitor, options);
        }
    }
    clone() {
        var _a, _b;
        const clone = this.finalizeClone(new NamespaceStatement(util_1.util.cloneToken(this.keyword), (_a = this.nameExpression) === null || _a === void 0 ? void 0 : _a.clone(), (_b = this.body) === null || _b === void 0 ? void 0 : _b.clone(), util_1.util.cloneToken(this.endKeyword)), ['nameExpression', 'body']);
        clone.cacheRange();
        return clone;
    }
}
exports.NamespaceStatement = NamespaceStatement;
class ImportStatement extends AstNode_1.Statement {
    constructor(importToken, filePathToken) {
        super();
        this.importToken = importToken;
        this.filePathToken = filePathToken;
        this.range = util_1.util.createBoundingRange(importToken, filePathToken);
        if (this.filePathToken) {
            //remove quotes
            this.filePath = this.filePathToken.text.replace(/"/g, '');
            if (this.filePathToken.range) {
                //adjust the range to exclude the quotes
                this.filePathToken.range = util_1.util.createRange(this.filePathToken.range.start.line, this.filePathToken.range.start.character + 1, this.filePathToken.range.end.line, this.filePathToken.range.end.character - 1);
            }
        }
    }
    transpile(state) {
        //The xml files are responsible for adding the additional script imports, but
        //add the import statement as a comment just for debugging purposes
        return [
            `'`,
            state.transpileToken(this.importToken),
            ' ',
            state.transpileToken(this.filePathToken)
        ];
    }
    /**
     * Get the typedef for this statement
     */
    getTypedef(state) {
        return [
            this.importToken.text,
            ' ',
            //replace any `.bs` extension with `.brs`
            this.filePathToken.text.replace(/\.bs"?$/i, '.brs"')
        ];
    }
    walk(visitor, options) {
        //nothing to walk
    }
    clone() {
        return this.finalizeClone(new ImportStatement(util_1.util.cloneToken(this.importToken), util_1.util.cloneToken(this.filePathToken)));
    }
}
exports.ImportStatement = ImportStatement;
class InterfaceStatement extends AstNode_1.Statement {
    constructor(interfaceToken, name, extendsToken, parentInterfaceName, body, endInterfaceToken) {
        var _a;
        super();
        this.parentInterfaceName = parentInterfaceName;
        this.body = body;
        this.tokens = {};
        this.tokens.interface = interfaceToken;
        this.tokens.name = name;
        this.tokens.extends = extendsToken;
        this.tokens.endInterface = endInterfaceToken;
        this.range = util_1.util.createBoundingRange(this.tokens.interface, this.tokens.name, this.tokens.extends, this.parentInterfaceName, ...(_a = this.body) !== null && _a !== void 0 ? _a : [], this.tokens.endInterface);
    }
    /**
     * Get the name of the wrapping namespace (if it exists)
     * @deprecated use `.findAncestor(isNamespaceStatement)` instead.
     */
    get namespaceName() {
        var _a;
        return (_a = this.findAncestor(reflection_1.isNamespaceStatement)) === null || _a === void 0 ? void 0 : _a.nameExpression;
    }
    get fields() {
        return this.body.filter(x => (0, reflection_1.isInterfaceFieldStatement)(x));
    }
    get methods() {
        return this.body.filter(x => (0, reflection_1.isInterfaceMethodStatement)(x));
    }
    /**
     * The name of the interface WITH its leading namespace (if applicable)
     */
    get fullName() {
        var _a;
        const name = (_a = this.tokens.name) === null || _a === void 0 ? void 0 : _a.text;
        if (name) {
            const namespace = this.findAncestor(reflection_1.isNamespaceStatement);
            if (namespace) {
                let namespaceName = namespace.getName(Parser_1.ParseMode.BrighterScript);
                return `${namespaceName}.${name}`;
            }
            else {
                return name;
            }
        }
        else {
            //return undefined which will allow outside callers to know that this interface doesn't have a name
            return undefined;
        }
    }
    /**
     * The name of the interface (without the namespace prefix)
     */
    get name() {
        var _a;
        return (_a = this.tokens.name) === null || _a === void 0 ? void 0 : _a.text;
    }
    /**
     * Get the name of this expression based on the parse mode
     */
    getName(parseMode) {
        const namespace = this.findAncestor(reflection_1.isNamespaceStatement);
        if (namespace) {
            let delimiter = parseMode === Parser_1.ParseMode.BrighterScript ? '.' : '_';
            let namespaceName = namespace.getName(parseMode);
            return namespaceName + delimiter + this.name;
        }
        else {
            return this.name;
        }
    }
    transpile(state) {
        //interfaces should completely disappear at runtime
        return [];
    }
    getTypedef(state) {
        var _a, _b, _c;
        const result = [];
        for (let annotation of (_a = this.annotations) !== null && _a !== void 0 ? _a : []) {
            result.push(...annotation.getTypedef(state), state.newline, state.indent());
        }
        result.push(this.tokens.interface.text, ' ', this.tokens.name.text);
        const parentInterfaceName = (_b = this.parentInterfaceName) === null || _b === void 0 ? void 0 : _b.getName(Parser_1.ParseMode.BrighterScript);
        if (parentInterfaceName) {
            result.push(' extends ', parentInterfaceName);
        }
        const body = (_c = this.body) !== null && _c !== void 0 ? _c : [];
        if (body.length > 0) {
            state.blockDepth++;
        }
        for (const statement of body) {
            if ((0, reflection_1.isInterfaceMethodStatement)(statement) || (0, reflection_1.isInterfaceFieldStatement)(statement)) {
                result.push(state.newline, state.indent(), ...statement.getTypedef(state));
            }
            else {
                result.push(state.newline, state.indent(), ...statement.transpile(state));
            }
        }
        if (body.length > 0) {
            state.blockDepth--;
        }
        result.push(state.newline, state.indent(), 'end interface', state.newline);
        return result;
    }
    walk(visitor, options) {
        //visitor-less walk function to do parent linking
        (0, visitors_1.walk)(this, 'parentInterfaceName', null, options);
        if (options.walkMode & visitors_1.InternalWalkMode.walkStatements) {
            (0, visitors_1.walkArray)(this.body, visitor, options, this);
        }
    }
    clone() {
        var _a, _b;
        return this.finalizeClone(new InterfaceStatement(util_1.util.cloneToken(this.tokens.interface), util_1.util.cloneToken(this.tokens.name), util_1.util.cloneToken(this.tokens.extends), (_a = this.parentInterfaceName) === null || _a === void 0 ? void 0 : _a.clone(), (_b = this.body) === null || _b === void 0 ? void 0 : _b.map(x => x === null || x === void 0 ? void 0 : x.clone()), util_1.util.cloneToken(this.tokens.endInterface)), ['parentInterfaceName', 'body']);
    }
}
exports.InterfaceStatement = InterfaceStatement;
class InterfaceFieldStatement extends AstNode_1.Statement {
    constructor(nameToken, asToken, typeToken, type, optionalToken) {
        super();
        this.type = type;
        this.tokens = {};
        this.tokens.optional = optionalToken;
        this.tokens.name = nameToken;
        this.tokens.as = asToken;
        this.tokens.type = typeToken;
        this.range = util_1.util.createBoundingRange(optionalToken, nameToken, asToken, typeToken);
    }
    transpile(state) {
        throw new Error('Method not implemented.');
    }
    get name() {
        return this.tokens.name.text;
    }
    get isOptional() {
        return !!this.tokens.optional;
    }
    walk(visitor, options) {
        //nothing to walk
    }
    getTypedef(state) {
        var _a, _b, _c;
        const result = [];
        for (let annotation of (_a = this.annotations) !== null && _a !== void 0 ? _a : []) {
            result.push(...annotation.getTypedef(state), state.newline, state.indent());
        }
        if (this.isOptional) {
            result.push(this.tokens.optional.text, ' ');
        }
        result.push(this.tokens.name.text);
        if (((_c = (_b = this.tokens.type) === null || _b === void 0 ? void 0 : _b.text) === null || _c === void 0 ? void 0 : _c.length) > 0) {
            result.push(' as ', this.tokens.type.text);
        }
        return result;
    }
    clone() {
        var _a;
        return this.finalizeClone(new InterfaceFieldStatement(util_1.util.cloneToken(this.tokens.name), util_1.util.cloneToken(this.tokens.as), util_1.util.cloneToken(this.tokens.type), (_a = this.type) === null || _a === void 0 ? void 0 : _a.clone(), util_1.util.cloneToken(this.tokens.optional)));
    }
}
exports.InterfaceFieldStatement = InterfaceFieldStatement;
class InterfaceMethodStatement extends AstNode_1.Statement {
    constructor(functionTypeToken, nameToken, leftParen, params, rightParen, asToken, returnTypeToken, returnType, optionalToken) {
        super();
        this.params = params;
        this.returnType = returnType;
        this.tokens = {};
        this.tokens.optional = optionalToken;
        this.tokens.functionType = functionTypeToken;
        this.tokens.name = nameToken;
        this.tokens.leftParen = leftParen;
        this.tokens.rightParen = rightParen;
        this.tokens.as = asToken;
        this.tokens.returnType = returnTypeToken;
    }
    transpile(state) {
        throw new Error('Method not implemented.');
    }
    get range() {
        var _a;
        return util_1.util.createBoundingRange(this.tokens.optional, this.tokens.functionType, this.tokens.name, this.tokens.leftParen, ...((_a = this.params) !== null && _a !== void 0 ? _a : []), this.tokens.rightParen, this.tokens.as, this.tokens.returnType);
    }
    get isOptional() {
        return !!this.tokens.optional;
    }
    walk(visitor, options) {
        //nothing to walk
    }
    getTypedef(state) {
        var _a, _b;
        const result = [];
        for (let annotation of (_a = this.annotations) !== null && _a !== void 0 ? _a : []) {
            result.push(...annotation.getTypedef(state), state.newline, state.indent());
        }
        if (this.isOptional) {
            result.push(this.tokens.optional.text, ' ');
        }
        result.push(this.tokens.functionType.text, ' ', this.tokens.name.text, '(');
        const params = (_b = this.params) !== null && _b !== void 0 ? _b : [];
        for (let i = 0; i < params.length; i++) {
            if (i > 0) {
                result.push(', ');
            }
            const param = params[i];
            result.push(param.name.text);
            const typeToken = param.typeToken;
            if (typeToken && typeToken.text.length > 0) {
                result.push(' as ', typeToken.text);
            }
        }
        result.push(')');
        const returnTypeToken = this.tokens.returnType;
        if (returnTypeToken && returnTypeToken.text.length > 0) {
            result.push(' as ', returnTypeToken.text);
        }
        return result;
    }
    clone() {
        var _a, _b;
        return this.finalizeClone(new InterfaceMethodStatement(util_1.util.cloneToken(this.tokens.functionType), util_1.util.cloneToken(this.tokens.name), util_1.util.cloneToken(this.tokens.leftParen), (_a = this.params) === null || _a === void 0 ? void 0 : _a.map(p => p === null || p === void 0 ? void 0 : p.clone()), util_1.util.cloneToken(this.tokens.rightParen), util_1.util.cloneToken(this.tokens.as), util_1.util.cloneToken(this.tokens.returnType), (_b = this.returnType) === null || _b === void 0 ? void 0 : _b.clone(), util_1.util.cloneToken(this.tokens.optional)), ['params']);
    }
}
exports.InterfaceMethodStatement = InterfaceMethodStatement;
class ClassStatement extends AstNode_1.Statement {
    constructor(classKeyword, 
    /**
     * The name of the class (without namespace prefix)
     */
    name, body, end, extendsKeyword, parentClassName) {
        var _a, _b, _c;
        super();
        this.classKeyword = classKeyword;
        this.name = name;
        this.body = body;
        this.end = end;
        this.extendsKeyword = extendsKeyword;
        this.parentClassName = parentClassName;
        this.memberMap = {};
        this.methods = [];
        this.fields = [];
        this.body = (_a = this.body) !== null && _a !== void 0 ? _a : [];
        for (let statement of this.body) {
            if ((0, reflection_1.isMethodStatement)(statement)) {
                this.methods.push(statement);
                this.memberMap[(_b = statement === null || statement === void 0 ? void 0 : statement.name) === null || _b === void 0 ? void 0 : _b.text.toLowerCase()] = statement;
            }
            else if ((0, reflection_1.isFieldStatement)(statement)) {
                this.fields.push(statement);
                this.memberMap[(_c = statement.name) === null || _c === void 0 ? void 0 : _c.text.toLowerCase()] = statement;
            }
        }
        this.range = util_1.util.createBoundingRange(classKeyword, name, extendsKeyword, parentClassName, ...(body !== null && body !== void 0 ? body : []), end);
    }
    /**
     * Get the name of the wrapping namespace (if it exists)
     * @deprecated use `.findAncestor(isNamespaceStatement)` instead.
     */
    get namespaceName() {
        var _a;
        return (_a = this.findAncestor(reflection_1.isNamespaceStatement)) === null || _a === void 0 ? void 0 : _a.nameExpression;
    }
    getName(parseMode) {
        var _a;
        const name = (_a = this.name) === null || _a === void 0 ? void 0 : _a.text;
        if (name) {
            const namespace = this.findAncestor(reflection_1.isNamespaceStatement);
            if (namespace) {
                let namespaceName = namespace.getName(parseMode);
                let separator = parseMode === Parser_1.ParseMode.BrighterScript ? '.' : '_';
                return namespaceName + separator + name;
            }
            else {
                return name;
            }
        }
        else {
            //return undefined which will allow outside callers to know that this class doesn't have a name
            return undefined;
        }
    }
    transpile(state) {
        let result = [];
        const className = this.getName(Parser_1.ParseMode.BrightScript).replace(/\./g, '_');
        const ancestors = this.getAncestors(state);
        const body = this.getTranspiledClassBody(ancestors);
        //make the methods
        result.push(...this.getTranspiledMethods(state, className, body));
        //make the builder
        result.push(...this.getTranspiledBuilder(state, className, ancestors, body));
        result.push('\n', state.indent());
        //make the class assembler (i.e. the public-facing class creator method)
        result.push(...this.getTranspiledClassFunction(state, className));
        return result;
    }
    getTypedef(state) {
        var _a;
        const result = [];
        for (let annotation of (_a = this.annotations) !== null && _a !== void 0 ? _a : []) {
            result.push(...annotation.getTypedef(state), state.newline, state.indent());
        }
        result.push('class ', this.name.text);
        if (this.extendsKeyword && this.parentClassName) {
            const namespace = this.findAncestor(reflection_1.isNamespaceStatement);
            const fqName = util_1.util.getFullyQualifiedClassName(this.parentClassName.getName(Parser_1.ParseMode.BrighterScript), namespace === null || namespace === void 0 ? void 0 : namespace.getName(Parser_1.ParseMode.BrighterScript));
            result.push(` extends ${fqName}`);
        }
        result.push(state.newline);
        state.blockDepth++;
        let body = this.body;
        //inject an empty "new" method if missing
        if (!this.getConstructorFunction()) {
            const constructor = (0, creators_1.createMethodStatement)('new', TokenKind_1.TokenKind.Sub);
            constructor.parent = this;
            //walk the constructor to set up parent links
            constructor.link();
            body = [
                constructor,
                ...this.body
            ];
        }
        for (const member of body) {
            if ((0, reflection_1.isTypedefProvider)(member)) {
                result.push(state.indent(), ...member.getTypedef(state), state.newline);
            }
        }
        state.blockDepth--;
        result.push(state.indent(), 'end class');
        return result;
    }
    /**
     * Find the parent index for this class's parent.
     * For class inheritance, every class is given an index.
     * The base class is index 0, its child is index 1, and so on.
     */
    getParentClassIndex(state) {
        var _a;
        let myIndex = 0;
        let stmt = this;
        while (stmt) {
            if (stmt.parentClassName) {
                const namespace = stmt.findAncestor(reflection_1.isNamespaceStatement);
                //find the parent class
                stmt = (_a = state.file.getClassFileLink(stmt.parentClassName.getName(Parser_1.ParseMode.BrighterScript), namespace === null || namespace === void 0 ? void 0 : namespace.getName(Parser_1.ParseMode.BrighterScript))) === null || _a === void 0 ? void 0 : _a.item;
                myIndex++;
            }
            else {
                break;
            }
        }
        const result = myIndex - 1;
        if (result >= 0) {
            return result;
        }
        else {
            return null;
        }
    }
    hasParentClass() {
        return !!this.parentClassName;
    }
    /**
     * Get all ancestor classes, in closest-to-furthest order (i.e. 0 is parent, 1 is grandparent, etc...).
     * This will return an empty array if no ancestors were found
     */
    getAncestors(state) {
        var _a;
        let ancestors = [];
        let stmt = this;
        while (stmt) {
            if (stmt.parentClassName) {
                const namespace = stmt.findAncestor(reflection_1.isNamespaceStatement);
                stmt = (_a = state.file.getClassFileLink(stmt.parentClassName.getName(Parser_1.ParseMode.BrighterScript), namespace === null || namespace === void 0 ? void 0 : namespace.getName(Parser_1.ParseMode.BrighterScript))) === null || _a === void 0 ? void 0 : _a.item;
                ancestors.push(stmt);
            }
            else {
                break;
            }
        }
        return ancestors;
    }
    getBuilderName(transpiledClassName) {
        return `__${transpiledClassName}_builder`;
    }
    getMethodIdentifier(transpiledClassName, statement) {
        return Object.assign(Object.assign({}, statement.name), { text: `__${transpiledClassName}_method_${statement.name.text}` });
    }
    /**
     * Get the constructor function for this class (if exists), or undefined if not exist
     */
    getConstructorFunction() {
        return this.body.find((stmt) => {
            var _a, _b;
            return ((_b = (_a = stmt === null || stmt === void 0 ? void 0 : stmt.name) === null || _a === void 0 ? void 0 : _a.text) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === 'new';
        });
    }
    /**
     * Return the parameters for the first constructor function for this class
     * @param ancestors The list of ancestors for this class
     * @returns The parameters for the first constructor function for this class
     */
    getConstructorParams(ancestors) {
        for (let ancestor of ancestors) {
            const ctor = ancestor === null || ancestor === void 0 ? void 0 : ancestor.getConstructorFunction();
            if (ctor) {
                return ctor.func.parameters;
            }
        }
        return [];
    }
    /**
     * Determine if the specified field was declared in one of the ancestor classes
     */
    isFieldDeclaredByAncestor(fieldName, ancestors) {
        let lowerFieldName = fieldName.toLowerCase();
        for (let ancestor of ancestors) {
            if (ancestor.memberMap[lowerFieldName]) {
                return true;
            }
        }
        return false;
    }
    /**
     * The builder is a function that assigns all of the methods and property names to a class instance.
     * This needs to be a separate function so that child classes can call the builder from their parent
     * without instantiating the parent constructor at that point in time.
     */
    getTranspiledBuilder(state, transpiledClassName, ancestors, body) {
        let result = [];
        result.push(`function ${this.getBuilderName(transpiledClassName)}()\n`);
        state.blockDepth++;
        //indent
        result.push(state.indent());
        //construct parent class or empty object
        if (ancestors[0]) {
            const ancestorNamespace = ancestors[0].findAncestor(reflection_1.isNamespaceStatement);
            let fullyQualifiedClassName = util_1.util.getFullyQualifiedClassName(ancestors[0].getName(Parser_1.ParseMode.BrighterScript), ancestorNamespace === null || ancestorNamespace === void 0 ? void 0 : ancestorNamespace.getName(Parser_1.ParseMode.BrighterScript));
            result.push(`instance = ${this.getBuilderName(fullyQualifiedClassName.replace(/\./g, '_'))}()`);
        }
        else {
            //use an empty object.
            result.push('instance = {}');
        }
        result.push(state.newline, state.indent());
        let parentClassIndex = this.getParentClassIndex(state);
        for (let statement of body) {
            //is field statement
            if ((0, reflection_1.isFieldStatement)(statement)) {
                //do nothing with class fields in this situation, they are handled elsewhere
                continue;
                //methods
            }
            else if ((0, reflection_1.isMethodStatement)(statement)) {
                //store overridden parent methods as super{parentIndex}_{methodName}
                if (
                //is override method
                statement.override ||
                    //is constructor function in child class
                    (statement.name.text.toLowerCase() === 'new' && ancestors[0])) {
                    result.push(`instance.super${parentClassIndex}_${statement.name.text} = instance.${statement.name.text}`, state.newline, state.indent());
                }
                state.classStatement = this;
                result.push('instance.', state.transpileToken(statement.name), ' = ', state.transpileToken(this.getMethodIdentifier(transpiledClassName, statement)), state.newline, state.indent());
                delete state.classStatement;
            }
            else {
                //other random statements (probably just comments)
                result.push(...statement.transpile(state), state.newline, state.indent());
            }
        }
        //return the instance
        result.push('return instance\n');
        state.blockDepth--;
        result.push(state.indent());
        result.push(`end function`);
        return result;
    }
    /**
     * Returns a copy of the class' body, with the constructor function added if it doesn't exist.
     */
    getTranspiledClassBody(ancestors) {
        const body = [];
        body.push(...this.body);
        //inject an empty "new" method if missing
        if (!this.getConstructorFunction()) {
            if (ancestors.length === 0) {
                body.unshift((0, creators_1.createMethodStatement)('new', TokenKind_1.TokenKind.Sub));
            }
            else {
                const params = this.getConstructorParams(ancestors);
                const call = new ExpressionStatement(new Expression_2.CallExpression(new Expression_2.VariableExpression((0, creators_1.createToken)(TokenKind_1.TokenKind.Identifier, 'super')), (0, creators_1.createToken)(TokenKind_1.TokenKind.LeftParen), (0, creators_1.createToken)(TokenKind_1.TokenKind.RightParen), params.map(x => new Expression_2.VariableExpression(x.name))));
                body.unshift(new MethodStatement([], (0, creators_1.createIdentifier)('new'), new Expression_1.FunctionExpression(params.map(x => x.clone()), new Block([call]), (0, creators_1.createToken)(TokenKind_1.TokenKind.Sub), (0, creators_1.createToken)(TokenKind_1.TokenKind.EndSub), (0, creators_1.createToken)(TokenKind_1.TokenKind.LeftParen), (0, creators_1.createToken)(TokenKind_1.TokenKind.RightParen)), null));
            }
        }
        return body;
    }
    /**
     * These are the methods that are defined in this class. They are transpiled outside of the class body
     * to ensure they don't appear as "$anon_#" in stack traces and crash logs.
     */
    getTranspiledMethods(state, transpiledClassName, body) {
        let result = [];
        for (let statement of body) {
            if ((0, reflection_1.isMethodStatement)(statement)) {
                state.classStatement = this;
                result.push(...statement.transpile(state, this.getMethodIdentifier(transpiledClassName, statement)), state.newline, state.indent());
                delete state.classStatement;
            }
        }
        return result;
    }
    /**
     * The class function is the function with the same name as the class. This is the function that
     * consumers should call to create a new instance of that class.
     * This invokes the builder, gets an instance of the class, then invokes the "new" function on that class.
     */
    getTranspiledClassFunction(state, transpiledClassName) {
        let result = [];
        const constructorFunction = this.getConstructorFunction();
        let constructorParams = [];
        if (constructorFunction) {
            constructorParams = constructorFunction.func.parameters;
        }
        else {
            constructorParams = this.getConstructorParams(this.getAncestors(state));
        }
        result.push(state.sourceNode(this.classKeyword, 'function'), state.sourceNode(this.classKeyword, ' '), state.sourceNode(this.name, this.getName(Parser_1.ParseMode.BrightScript)), `(`);
        let i = 0;
        for (let param of constructorParams) {
            if (i > 0) {
                result.push(', ');
            }
            result.push(param.transpile(state));
            i++;
        }
        result.push(')', '\n');
        state.blockDepth++;
        result.push(state.indent());
        result.push(`instance = ${this.getBuilderName(transpiledClassName)}()\n`);
        result.push(state.indent());
        result.push(`instance.new(`);
        //append constructor arguments
        i = 0;
        for (let param of constructorParams) {
            if (i > 0) {
                result.push(', ');
            }
            result.push(state.transpileToken(param.name));
            i++;
        }
        result.push(')', '\n');
        result.push(state.indent());
        result.push(`return instance\n`);
        state.blockDepth--;
        result.push(state.indent());
        result.push(`end function`);
        return result;
    }
    walk(visitor, options) {
        //visitor-less walk function to do parent linking
        (0, visitors_1.walk)(this, 'parentClassName', null, options);
        if (options.walkMode & visitors_1.InternalWalkMode.walkStatements) {
            (0, visitors_1.walkArray)(this.body, visitor, options, this);
        }
    }
    clone() {
        var _a, _b;
        return this.finalizeClone(new ClassStatement(util_1.util.cloneToken(this.classKeyword), util_1.util.cloneToken(this.name), (_a = this.body) === null || _a === void 0 ? void 0 : _a.map(x => x === null || x === void 0 ? void 0 : x.clone()), util_1.util.cloneToken(this.end), util_1.util.cloneToken(this.extendsKeyword), (_b = this.parentClassName) === null || _b === void 0 ? void 0 : _b.clone()), ['body', 'parentClassName']);
    }
}
exports.ClassStatement = ClassStatement;
const accessModifiers = [
    TokenKind_1.TokenKind.Public,
    TokenKind_1.TokenKind.Protected,
    TokenKind_1.TokenKind.Private
];
class MethodStatement extends FunctionStatement {
    constructor(modifiers, name, func, override) {
        super(name, func);
        this.override = override;
        this.modifiers = [];
        if (modifiers) {
            if (Array.isArray(modifiers)) {
                this.modifiers.push(...modifiers);
            }
            else {
                this.modifiers.push(modifiers);
            }
        }
        this.range = util_1.util.createBoundingRange(...(this.modifiers), override, func);
    }
    get accessModifier() {
        return this.modifiers.find(x => accessModifiers.includes(x.kind));
    }
    /**
     * Get the name of this method.
     */
    getName(parseMode) {
        return this.name.text;
    }
    transpile(state, name) {
        if (this.name.text.toLowerCase() === 'new') {
            this.ensureSuperConstructorCall(state);
            //TODO we need to undo this at the bottom of this method
            this.injectFieldInitializersForConstructor(state);
        }
        //TODO - remove type information from these methods because that doesn't work
        //convert the `super` calls into the proper methods
        const parentClassIndex = state.classStatement.getParentClassIndex(state);
        const visitor = (0, visitors_1.createVisitor)({
            VariableExpression: e => {
                if (e.name.text.toLocaleLowerCase() === 'super') {
                    state.editor.setProperty(e.name, 'text', `m.super${parentClassIndex}_new`);
                }
            },
            DottedGetExpression: e => {
                const beginningVariable = util_1.util.findBeginningVariableExpression(e);
                const lowerName = beginningVariable === null || beginningVariable === void 0 ? void 0 : beginningVariable.getName(Parser_1.ParseMode.BrighterScript).toLowerCase();
                if (lowerName === 'super') {
                    state.editor.setProperty(beginningVariable.name, 'text', 'm');
                    state.editor.setProperty(e.name, 'text', `super${parentClassIndex}_${e.name.text}`);
                }
            }
        });
        const walkOptions = { walkMode: visitors_1.WalkMode.visitExpressions };
        for (const statement of this.func.body.statements) {
            visitor(statement, undefined);
            statement.walk(visitor, walkOptions);
        }
        return this.func.transpile(state, name);
    }
    getTypedef(state) {
        var _a;
        const result = [];
        for (let annotation of (_a = this.annotations) !== null && _a !== void 0 ? _a : []) {
            result.push(...annotation.getTypedef(state), state.newline, state.indent());
        }
        if (this.accessModifier) {
            result.push(this.accessModifier.text, ' ');
        }
        if (this.override) {
            result.push('override ');
        }
        result.push(...this.func.getTypedef(state));
        return result;
    }
    /**
     * All child classes must call the parent constructor. The type checker will warn users when they don't call it in their own class,
     * but we still need to call it even if they have omitted it. This injects the super call if it's missing
     */
    ensureSuperConstructorCall(state) {
        //if this class doesn't extend another class, quit here
        if (state.classStatement.getAncestors(state).length === 0) {
            return;
        }
        //check whether any calls to super exist
        let containsSuperCall = this.func.body.statements.findIndex((x) => {
            var _a;
            //is a call statement
            return (0, reflection_1.isExpressionStatement)(x) && (0, reflection_1.isCallExpression)(x.expression) &&
                //is a call to super
                ((_a = util_1.util.findBeginningVariableExpression(x.expression.callee)) === null || _a === void 0 ? void 0 : _a.name.text.toLowerCase()) === 'super';
        }) !== -1;
        //if a call to super exists, quit here
        if (containsSuperCall) {
            return;
        }
        //this is a child class, and the constructor doesn't contain a call to super. Inject one
        const superCall = new ExpressionStatement(new Expression_2.CallExpression(new Expression_2.VariableExpression({
            kind: TokenKind_1.TokenKind.Identifier,
            text: 'super',
            isReserved: false,
            range: state.classStatement.name.range,
            leadingWhitespace: ''
        }), {
            kind: TokenKind_1.TokenKind.LeftParen,
            text: '(',
            isReserved: false,
            range: state.classStatement.name.range,
            leadingWhitespace: ''
        }, {
            kind: TokenKind_1.TokenKind.RightParen,
            text: ')',
            isReserved: false,
            range: state.classStatement.name.range,
            leadingWhitespace: ''
        }, []));
        state.editor.arrayUnshift(this.func.body.statements, superCall);
    }
    /**
     * Inject field initializers at the top of the `new` function (after any present `super()` call)
     */
    injectFieldInitializersForConstructor(state) {
        var _a, _b, _c;
        let startingIndex = state.classStatement.hasParentClass() ? 1 : 0;
        let newStatements = [];
        //insert the field initializers in order
        for (let field of state.classStatement.fields) {
            let thisQualifiedName = Object.assign({}, field.name);
            thisQualifiedName.text = 'm.' + ((_a = field.name) === null || _a === void 0 ? void 0 : _a.text);
            if (field.initialValue) {
                newStatements.push(new AssignmentStatement(field.equal, thisQualifiedName, field.initialValue));
            }
            else {
                //if there is no initial value, set the initial value to `invalid`
                newStatements.push(new AssignmentStatement((0, creators_1.createToken)(TokenKind_1.TokenKind.Equal, '=', (_b = field.name) === null || _b === void 0 ? void 0 : _b.range), thisQualifiedName, (0, creators_1.createInvalidLiteral)('invalid', (_c = field.name) === null || _c === void 0 ? void 0 : _c.range)));
            }
        }
        state.editor.arraySplice(this.func.body.statements, startingIndex, 0, ...newStatements);
    }
    walk(visitor, options) {
        if (options.walkMode & visitors_1.InternalWalkMode.walkExpressions) {
            (0, visitors_1.walk)(this, 'func', visitor, options);
        }
    }
    clone() {
        var _a, _b;
        return this.finalizeClone(new MethodStatement((_a = this.modifiers) === null || _a === void 0 ? void 0 : _a.map(m => util_1.util.cloneToken(m)), util_1.util.cloneToken(this.name), (_b = this.func) === null || _b === void 0 ? void 0 : _b.clone(), util_1.util.cloneToken(this.override)), ['func']);
    }
}
exports.MethodStatement = MethodStatement;
/**
 * @deprecated use `MethodStatement`
 */
class ClassMethodStatement extends MethodStatement {
}
exports.ClassMethodStatement = ClassMethodStatement;
class FieldStatement extends AstNode_1.Statement {
    constructor(accessModifier, name, as, type, equal, initialValue, optional) {
        super();
        this.accessModifier = accessModifier;
        this.name = name;
        this.as = as;
        this.type = type;
        this.equal = equal;
        this.initialValue = initialValue;
        this.optional = optional;
        this.range = util_1.util.createBoundingRange(accessModifier, name, as, type, equal, initialValue);
    }
    /**
     * Derive a ValueKind from the type token, or the initial value.
     * Defaults to `DynamicType`
     */
    getType() {
        if (this.type) {
            return util_1.util.tokenToBscType(this.type);
        }
        else if ((0, reflection_1.isLiteralExpression)(this.initialValue)) {
            return this.initialValue.type;
        }
        else {
            return new DynamicType_1.DynamicType();
        }
    }
    get isOptional() {
        return !!this.optional;
    }
    transpile(state) {
        throw new Error('transpile not implemented for ' + Object.getPrototypeOf(this).constructor.name);
    }
    getTypedef(state) {
        var _a, _b, _c, _d;
        const result = [];
        if (this.name) {
            for (let annotation of (_a = this.annotations) !== null && _a !== void 0 ? _a : []) {
                result.push(...annotation.getTypedef(state), state.newline, state.indent());
            }
            let type = this.getType();
            if ((0, reflection_1.isInvalidType)(type) || (0, reflection_1.isVoidType)(type)) {
                type = new DynamicType_1.DynamicType();
            }
            result.push((_c = (_b = this.accessModifier) === null || _b === void 0 ? void 0 : _b.text) !== null && _c !== void 0 ? _c : 'public', ' ');
            if (this.isOptional) {
                result.push(this.optional.text, ' ');
            }
            result.push((_d = this.name) === null || _d === void 0 ? void 0 : _d.text, ' as ', type.toTypeString());
        }
        return result;
    }
    walk(visitor, options) {
        if (this.initialValue && options.walkMode & visitors_1.InternalWalkMode.walkExpressions) {
            (0, visitors_1.walk)(this, 'initialValue', visitor, options);
        }
    }
    clone() {
        var _a;
        return this.finalizeClone(new FieldStatement(util_1.util.cloneToken(this.accessModifier), util_1.util.cloneToken(this.name), util_1.util.cloneToken(this.as), util_1.util.cloneToken(this.type), util_1.util.cloneToken(this.equal), (_a = this.initialValue) === null || _a === void 0 ? void 0 : _a.clone(), util_1.util.cloneToken(this.optional)), ['initialValue']);
    }
}
exports.FieldStatement = FieldStatement;
/**
 * @deprecated use `FieldStatement`
 */
class ClassFieldStatement extends FieldStatement {
}
exports.ClassFieldStatement = ClassFieldStatement;
class TryCatchStatement extends AstNode_1.Statement {
    constructor(tokens, tryBranch, catchStatement) {
        super();
        this.tokens = tokens;
        this.tryBranch = tryBranch;
        this.catchStatement = catchStatement;
        this.range = util_1.util.createBoundingRange(tokens.try, tryBranch, catchStatement, tokens.endTry);
    }
    transpile(state) {
        var _a, _b;
        return [
            state.transpileToken(this.tokens.try),
            ...this.tryBranch.transpile(state),
            state.newline,
            state.indent(),
            ...((_b = (_a = this.catchStatement) === null || _a === void 0 ? void 0 : _a.transpile(state)) !== null && _b !== void 0 ? _b : ['catch']),
            state.newline,
            state.indent(),
            state.transpileToken(this.tokens.endTry)
        ];
    }
    walk(visitor, options) {
        if (this.tryBranch && options.walkMode & visitors_1.InternalWalkMode.walkStatements) {
            (0, visitors_1.walk)(this, 'tryBranch', visitor, options);
            (0, visitors_1.walk)(this, 'catchStatement', visitor, options);
        }
    }
    clone() {
        var _a, _b;
        return this.finalizeClone(new TryCatchStatement({
            try: util_1.util.cloneToken(this.tokens.try),
            endTry: util_1.util.cloneToken(this.tokens.endTry)
        }, (_a = this.tryBranch) === null || _a === void 0 ? void 0 : _a.clone(), (_b = this.catchStatement) === null || _b === void 0 ? void 0 : _b.clone()), ['tryBranch', 'catchStatement']);
    }
}
exports.TryCatchStatement = TryCatchStatement;
class CatchStatement extends AstNode_1.Statement {
    constructor(tokens, exceptionVariable, catchBranch) {
        super();
        this.tokens = tokens;
        this.exceptionVariable = exceptionVariable;
        this.catchBranch = catchBranch;
        this.range = util_1.util.createBoundingRange(tokens.catch, exceptionVariable, catchBranch);
    }
    transpile(state) {
        var _a, _b, _c, _d;
        return [
            state.transpileToken(this.tokens.catch),
            ' ',
            (_b = (_a = this.exceptionVariable) === null || _a === void 0 ? void 0 : _a.text) !== null && _b !== void 0 ? _b : 'e',
            ...((_d = (_c = this.catchBranch) === null || _c === void 0 ? void 0 : _c.transpile(state)) !== null && _d !== void 0 ? _d : [])
        ];
    }
    walk(visitor, options) {
        if (this.catchBranch && options.walkMode & visitors_1.InternalWalkMode.walkStatements) {
            (0, visitors_1.walk)(this, 'catchBranch', visitor, options);
        }
    }
    clone() {
        var _a;
        return this.finalizeClone(new CatchStatement({
            catch: util_1.util.cloneToken(this.tokens.catch)
        }, util_1.util.cloneToken(this.exceptionVariable), (_a = this.catchBranch) === null || _a === void 0 ? void 0 : _a.clone()), ['catchBranch']);
    }
}
exports.CatchStatement = CatchStatement;
class ThrowStatement extends AstNode_1.Statement {
    constructor(throwToken, expression) {
        super();
        this.throwToken = throwToken;
        this.expression = expression;
        this.range = util_1.util.createBoundingRange(throwToken, expression);
    }
    transpile(state) {
        const result = [
            state.transpileToken(this.throwToken),
            ' '
        ];
        //if we have an expression, transpile it
        if (this.expression) {
            result.push(...this.expression.transpile(state));
            //no expression found. Rather than emit syntax errors, provide a generic error message
        }
        else {
            result.push('"An error has occurred"');
        }
        return result;
    }
    walk(visitor, options) {
        if (this.expression && options.walkMode & visitors_1.InternalWalkMode.walkExpressions) {
            (0, visitors_1.walk)(this, 'expression', visitor, options);
        }
    }
    clone() {
        var _a;
        return this.finalizeClone(new ThrowStatement(util_1.util.cloneToken(this.throwToken), (_a = this.expression) === null || _a === void 0 ? void 0 : _a.clone()), ['expression']);
    }
}
exports.ThrowStatement = ThrowStatement;
class EnumStatement extends AstNode_1.Statement {
    constructor(tokens, body) {
        var _a;
        super();
        this.tokens = tokens;
        this.body = body;
        this.body = (_a = this.body) !== null && _a !== void 0 ? _a : [];
    }
    get range() {
        return util_1.util.createBoundingRange(this.tokens.enum, this.tokens.name, ...this.body, this.tokens.endEnum);
    }
    /**
     * Get the name of the wrapping namespace (if it exists)
     * @deprecated use `.findAncestor(isNamespaceStatement)` instead.
     */
    get namespaceName() {
        var _a;
        return (_a = this.findAncestor(reflection_1.isNamespaceStatement)) === null || _a === void 0 ? void 0 : _a.nameExpression;
    }
    getMembers() {
        const result = [];
        for (const statement of this.body) {
            if ((0, reflection_1.isEnumMemberStatement)(statement)) {
                result.push(statement);
            }
        }
        return result;
    }
    /**
     * Get a map of member names and their values.
     * All values are stored as their AST LiteralExpression representation (i.e. string enum values include the wrapping quotes)
     */
    getMemberValueMap() {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const result = new Map();
        const members = this.getMembers();
        let currentIntValue = 0;
        for (const member of members) {
            //if there is no value, assume an integer and increment the int counter
            if (!member.value) {
                result.set((_a = member.name) === null || _a === void 0 ? void 0 : _a.toLowerCase(), currentIntValue.toString());
                currentIntValue++;
                //if explicit integer value, use it and increment the int counter
            }
            else if ((0, reflection_1.isLiteralExpression)(member.value) && member.value.token.kind === TokenKind_1.TokenKind.IntegerLiteral) {
                //try parsing as integer literal, then as hex integer literal.
                let tokenIntValue = (_b = util_1.util.parseInt(member.value.token.text)) !== null && _b !== void 0 ? _b : util_1.util.parseInt(member.value.token.text.replace(/&h/i, '0x'));
                if (tokenIntValue !== undefined) {
                    currentIntValue = tokenIntValue;
                    currentIntValue++;
                }
                result.set((_c = member.name) === null || _c === void 0 ? void 0 : _c.toLowerCase(), member.value.token.text);
                //simple unary expressions (like `-1`)
            }
            else if ((0, reflection_1.isUnaryExpression)(member.value) && (0, reflection_1.isLiteralExpression)(member.value.right)) {
                result.set((_d = member.name) === null || _d === void 0 ? void 0 : _d.toLowerCase(), member.value.operator.text + member.value.right.token.text);
                //all other values
            }
            else {
                result.set((_e = member.name) === null || _e === void 0 ? void 0 : _e.toLowerCase(), (_h = (_g = (_f = member.value) === null || _f === void 0 ? void 0 : _f.token) === null || _g === void 0 ? void 0 : _g.text) !== null && _h !== void 0 ? _h : 'invalid');
            }
        }
        return result;
    }
    getMemberValue(name) {
        return this.getMemberValueMap().get(name.toLowerCase());
    }
    /**
     * The name of the enum (without the namespace prefix)
     */
    get name() {
        var _a;
        return (_a = this.tokens.name) === null || _a === void 0 ? void 0 : _a.text;
    }
    /**
     * The name of the enum WITH its leading namespace (if applicable)
     */
    get fullName() {
        var _a;
        const name = (_a = this.tokens.name) === null || _a === void 0 ? void 0 : _a.text;
        if (name) {
            const namespace = this.findAncestor(reflection_1.isNamespaceStatement);
            if (namespace) {
                let namespaceName = namespace.getName(Parser_1.ParseMode.BrighterScript);
                return `${namespaceName}.${name}`;
            }
            else {
                return name;
            }
        }
        else {
            //return undefined which will allow outside callers to know that this doesn't have a name
            return undefined;
        }
    }
    transpile(state) {
        //enum declarations do not exist at runtime, so don't transpile anything...
        return [];
    }
    getTypedef(state) {
        var _a, _b, _c;
        const result = [];
        for (let annotation of (_a = this.annotations) !== null && _a !== void 0 ? _a : []) {
            result.push(...annotation.getTypedef(state), state.newline, state.indent());
        }
        result.push((_b = this.tokens.enum.text) !== null && _b !== void 0 ? _b : 'enum', ' ', this.tokens.name.text);
        result.push(state.newline);
        state.blockDepth++;
        for (const member of this.body) {
            if ((0, reflection_1.isTypedefProvider)(member)) {
                result.push(state.indent(), ...member.getTypedef(state), state.newline);
            }
        }
        state.blockDepth--;
        result.push(state.indent(), (_c = this.tokens.endEnum.text) !== null && _c !== void 0 ? _c : 'end enum');
        return result;
    }
    walk(visitor, options) {
        if (options.walkMode & visitors_1.InternalWalkMode.walkStatements) {
            (0, visitors_1.walkArray)(this.body, visitor, options, this);
        }
    }
    clone() {
        var _a;
        return this.finalizeClone(new EnumStatement({
            enum: util_1.util.cloneToken(this.tokens.enum),
            name: util_1.util.cloneToken(this.tokens.name),
            endEnum: util_1.util.cloneToken(this.tokens.endEnum)
        }, (_a = this.body) === null || _a === void 0 ? void 0 : _a.map(x => x === null || x === void 0 ? void 0 : x.clone())), ['body']);
    }
}
exports.EnumStatement = EnumStatement;
class EnumMemberStatement extends AstNode_1.Statement {
    constructor(tokens, value) {
        super();
        this.tokens = tokens;
        this.value = value;
    }
    /**
     * The name of the member
     */
    get name() {
        return this.tokens.name.text;
    }
    get range() {
        return util_1.util.createBoundingRange(this.tokens.name, this.tokens.equal, this.value);
    }
    /**
     * Get the value of this enum. Requires that `.parent` is set
     */
    getValue() {
        return this.parent.getMemberValue(this.name);
    }
    transpile(state) {
        return [];
    }
    getTypedef(state) {
        const result = [
            this.tokens.name.text
        ];
        if (this.tokens.equal) {
            result.push(' ', this.tokens.equal.text, ' ');
            if (this.value) {
                result.push(...this.value.transpile(state));
            }
        }
        return result;
    }
    walk(visitor, options) {
        if (this.value && options.walkMode & visitors_1.InternalWalkMode.walkExpressions) {
            (0, visitors_1.walk)(this, 'value', visitor, options);
        }
    }
    clone() {
        var _a;
        return this.finalizeClone(new EnumMemberStatement({
            name: util_1.util.cloneToken(this.tokens.name),
            equal: util_1.util.cloneToken(this.tokens.equal)
        }, (_a = this.value) === null || _a === void 0 ? void 0 : _a.clone()), ['value']);
    }
}
exports.EnumMemberStatement = EnumMemberStatement;
class ConstStatement extends AstNode_1.Statement {
    constructor(tokens, value) {
        super();
        this.tokens = tokens;
        this.value = value;
        this.range = util_1.util.createBoundingRange(this.tokens.const, this.tokens.name, this.tokens.equals, this.value);
    }
    get name() {
        return this.tokens.name.text;
    }
    /**
     * The name of the statement WITH its leading namespace (if applicable)
     */
    get fullName() {
        var _a;
        const name = (_a = this.tokens.name) === null || _a === void 0 ? void 0 : _a.text;
        if (name) {
            const namespace = this.findAncestor(reflection_1.isNamespaceStatement);
            if (namespace) {
                let namespaceName = namespace.getName(Parser_1.ParseMode.BrighterScript);
                return `${namespaceName}.${name}`;
            }
            else {
                return name;
            }
        }
        else {
            //return undefined which will allow outside callers to know that this doesn't have a name
            return undefined;
        }
    }
    transpile(state) {
        //const declarations don't exist at runtime, so just transpile empty
        return [];
    }
    getTypedef(state) {
        return [
            state.tokenToSourceNode(this.tokens.const),
            ' ',
            state.tokenToSourceNode(this.tokens.name),
            ' ',
            state.tokenToSourceNode(this.tokens.equals),
            ' ',
            ...this.value.transpile(state)
        ];
    }
    walk(visitor, options) {
        if (this.value && options.walkMode & visitors_1.InternalWalkMode.walkExpressions) {
            (0, visitors_1.walk)(this, 'value', visitor, options);
        }
    }
    clone() {
        var _a;
        return this.finalizeClone(new ConstStatement({
            const: util_1.util.cloneToken(this.tokens.const),
            name: util_1.util.cloneToken(this.tokens.name),
            equals: util_1.util.cloneToken(this.tokens.equals)
        }, (_a = this.value) === null || _a === void 0 ? void 0 : _a.clone()), ['value']);
    }
}
exports.ConstStatement = ConstStatement;
class ContinueStatement extends AstNode_1.Statement {
    constructor(tokens) {
        super();
        this.tokens = tokens;
        this.range = util_1.util.createBoundingRange(tokens.continue, tokens.loopType);
    }
    transpile(state) {
        var _a, _b, _c, _d, _e;
        return [
            state.sourceNode(this.tokens.continue, (_b = (_a = this.tokens.continue) === null || _a === void 0 ? void 0 : _a.text) !== null && _b !== void 0 ? _b : 'continue'),
            (_d = (_c = this.tokens.loopType) === null || _c === void 0 ? void 0 : _c.leadingWhitespace) !== null && _d !== void 0 ? _d : ' ',
            state.sourceNode(this.tokens.continue, (_e = this.tokens.loopType) === null || _e === void 0 ? void 0 : _e.text)
        ];
    }
    walk(visitor, options) {
        //nothing to walk
    }
    clone() {
        return this.finalizeClone(new ContinueStatement({
            continue: util_1.util.cloneToken(this.tokens.continue),
            loopType: util_1.util.cloneToken(this.tokens.loopType)
        }));
    }
}
exports.ContinueStatement = ContinueStatement;
class TypecastStatement extends AstNode_1.Statement {
    constructor(options) {
        super();
        this.tokens = {
            typecast: options.typecast,
            obj: options.obj,
            as: options.as,
            type: options.type
        };
        this.range = util_1.util.createBoundingRange(this.tokens.typecast, this.tokens.obj, this.tokens.as, this.tokens.type);
    }
    transpile(state) {
        return [];
    }
    walk(visitor, options) {
        //nothing to walk
    }
    clone() {
        return this.finalizeClone(new TypecastStatement({
            typecast: util_1.util.cloneToken(this.tokens.typecast),
            obj: util_1.util.cloneToken(this.tokens.obj),
            as: util_1.util.cloneToken(this.tokens.as),
            type: util_1.util.cloneToken(this.tokens.type)
        }));
    }
}
exports.TypecastStatement = TypecastStatement;
class AliasStatement extends AstNode_1.Statement {
    constructor(options) {
        super();
        this.tokens = {
            alias: options.alias,
            name: options.name,
            equals: options.equals,
            value: options.value
        };
        this.range = util_1.util.createBoundingRange(this.tokens.alias, this.tokens.name, this.tokens.equals, this.tokens.value);
    }
    transpile(state) {
        return [];
    }
    walk(visitor, options) {
        //nothing to walk
    }
    clone() {
        return this.finalizeClone(new AliasStatement({
            alias: util_1.util.cloneToken(this.tokens.alias),
            name: util_1.util.cloneToken(this.tokens.name),
            equals: util_1.util.cloneToken(this.tokens.equals),
            value: util_1.util.cloneToken(this.tokens.value)
        }));
    }
}
exports.AliasStatement = AliasStatement;
//# sourceMappingURL=Statement.js.map
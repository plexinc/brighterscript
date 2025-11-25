"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createIndexedSetStatement = exports.createDottedSetStatement = exports.createAssignmentStatement = exports.createBlock = exports.createIfStatement = exports.createSGAttribute = exports.createCall = exports.createClassMethodStatement = exports.createMethodStatement = exports.createFunctionExpression = exports.createBooleanLiteral = exports.createInvalidLiteral = exports.createFloatLiteral = exports.createIntegerLiteral = exports.createStringLiteral = exports.createDottedIdentifier = exports.createVariableExpression = exports.createIdentifier = exports.createToken = exports.interpolatedRange = void 0;
const TokenKind_1 = require("../lexer/TokenKind");
const Expression_1 = require("../parser/Expression");
const Statement_1 = require("../parser/Statement");
/**
 * A range that points to the beginning of the file. Used to give non-null ranges to programmatically-added source code.
 * (Hardcoded range to prevent circular dependency issue in `../util.ts`)
 * @deprecated don't use this, it screws up sourcemaps. Just set range to null
 */
exports.interpolatedRange = {
    start: {
        line: 0,
        character: 0
    },
    end: {
        line: 0,
        character: 0
    }
};
const tokenDefaults = {
    [TokenKind_1.TokenKind.BackTick]: '`',
    [TokenKind_1.TokenKind.Backslash]: '\\',
    [TokenKind_1.TokenKind.BackslashEqual]: '\\=',
    [TokenKind_1.TokenKind.Callfunc]: '@.',
    [TokenKind_1.TokenKind.Caret]: '^',
    [TokenKind_1.TokenKind.Colon]: ':',
    [TokenKind_1.TokenKind.Comma]: ',',
    [TokenKind_1.TokenKind.Comment]: '\'',
    [TokenKind_1.TokenKind.Dollar]: '$',
    [TokenKind_1.TokenKind.Dot]: '.',
    [TokenKind_1.TokenKind.EndClass]: 'end class',
    [TokenKind_1.TokenKind.EndEnum]: 'end enum',
    [TokenKind_1.TokenKind.EndFor]: 'end for',
    [TokenKind_1.TokenKind.EndFunction]: 'end function',
    [TokenKind_1.TokenKind.EndIf]: 'end if',
    [TokenKind_1.TokenKind.EndInterface]: 'end interface',
    [TokenKind_1.TokenKind.EndNamespace]: 'end namespace',
    [TokenKind_1.TokenKind.EndSub]: 'end sub',
    [TokenKind_1.TokenKind.EndTry]: 'end try',
    [TokenKind_1.TokenKind.EndWhile]: 'end while',
    [TokenKind_1.TokenKind.Equal]: '=',
    [TokenKind_1.TokenKind.Greater]: '>',
    [TokenKind_1.TokenKind.GreaterEqual]: '>=',
    [TokenKind_1.TokenKind.LeftCurlyBrace]: '{',
    [TokenKind_1.TokenKind.LeftParen]: '(',
    [TokenKind_1.TokenKind.LeftShift]: '<<',
    [TokenKind_1.TokenKind.LeftShiftEqual]: '<<=',
    [TokenKind_1.TokenKind.LeftSquareBracket]: '[',
    [TokenKind_1.TokenKind.Less]: '<',
    [TokenKind_1.TokenKind.LessEqual]: '<=',
    [TokenKind_1.TokenKind.LessGreater]: '<>',
    [TokenKind_1.TokenKind.LineNumLiteral]: 'LINE_NUM',
    [TokenKind_1.TokenKind.Minus]: '-',
    [TokenKind_1.TokenKind.MinusEqual]: '-=',
    [TokenKind_1.TokenKind.MinusMinus]: '--',
    [TokenKind_1.TokenKind.Newline]: '\n',
    [TokenKind_1.TokenKind.PkgLocationLiteral]: 'PKG_LOCATION',
    [TokenKind_1.TokenKind.PkgPathLiteral]: 'PKG_PATH',
    [TokenKind_1.TokenKind.Plus]: '+',
    [TokenKind_1.TokenKind.PlusEqual]: '+=',
    [TokenKind_1.TokenKind.PlusPlus]: '++',
    [TokenKind_1.TokenKind.Question]: '?',
    [TokenKind_1.TokenKind.QuestionQuestion]: '??',
    [TokenKind_1.TokenKind.RightCurlyBrace]: '}',
    [TokenKind_1.TokenKind.RightParen]: ')',
    [TokenKind_1.TokenKind.RightShift]: '>>',
    [TokenKind_1.TokenKind.RightShiftEqual]: '>>=',
    [TokenKind_1.TokenKind.RightSquareBracket]: ']',
    [TokenKind_1.TokenKind.Semicolon]: ';',
    [TokenKind_1.TokenKind.SourceFilePathLiteral]: 'SOURCE_FILE_PATH',
    [TokenKind_1.TokenKind.SourceFunctionNameLiteral]: 'SOURCE_FUNCTION_NAME',
    [TokenKind_1.TokenKind.SourceNamespaceRootNameLiteral]: 'SOURCE_NAMESPACE_ROOT_NAME',
    [TokenKind_1.TokenKind.SourceNamespaceNameLiteral]: 'SOURCE_NAMESPACE_NAME',
    [TokenKind_1.TokenKind.SourceLineNumLiteral]: 'SOURCE_LINE_NUM',
    [TokenKind_1.TokenKind.SourceLocationLiteral]: 'SOURCE_LOCATION',
    [TokenKind_1.TokenKind.Star]: '*',
    [TokenKind_1.TokenKind.StarEqual]: '*=',
    [TokenKind_1.TokenKind.Tab]: '\t',
    [TokenKind_1.TokenKind.TemplateStringExpressionBegin]: '${',
    [TokenKind_1.TokenKind.TemplateStringExpressionEnd]: '}',
    [TokenKind_1.TokenKind.Whitespace]: ' '
};
function createToken(kind, text, range) {
    var _a;
    return {
        kind: kind,
        text: (_a = text !== null && text !== void 0 ? text : tokenDefaults[kind]) !== null && _a !== void 0 ? _a : kind.toString().toLowerCase(),
        isReserved: !text || text === kind.toString(),
        range: range,
        leadingWhitespace: ''
    };
}
exports.createToken = createToken;
function createIdentifier(name, range) {
    return {
        kind: TokenKind_1.TokenKind.Identifier,
        text: name,
        isReserved: false,
        range: range,
        leadingWhitespace: ''
    };
}
exports.createIdentifier = createIdentifier;
function createVariableExpression(ident, range) {
    return new Expression_1.VariableExpression(createToken(TokenKind_1.TokenKind.Identifier, ident, range));
}
exports.createVariableExpression = createVariableExpression;
function createDottedIdentifier(path, range) {
    const ident = path.pop();
    const obj = path.length > 1 ? createDottedIdentifier(path, range) : createVariableExpression(path[0], range);
    return new Expression_1.DottedGetExpression(obj, createToken(TokenKind_1.TokenKind.Identifier, ident, range), createToken(TokenKind_1.TokenKind.Dot, '.', range));
}
exports.createDottedIdentifier = createDottedIdentifier;
/**
 * Create a StringLiteralExpression. The TokenKind.StringLiteral token value includes the leading and trailing doublequote during lexing.
 * Since brightscript doesn't support strings with quotes in them, we can safely auto-detect and wrap the value in quotes in this function.
 * @param value - the string value. (value will be wrapped in quotes if they are missing)
 */
function createStringLiteral(value, range) {
    //wrap the value in double quotes
    if (!value.startsWith('"') && !value.endsWith('"')) {
        value = '"' + value + '"';
    }
    return new Expression_1.LiteralExpression(createToken(TokenKind_1.TokenKind.StringLiteral, value, range));
}
exports.createStringLiteral = createStringLiteral;
function createIntegerLiteral(value, range) {
    return new Expression_1.LiteralExpression(createToken(TokenKind_1.TokenKind.IntegerLiteral, value, range));
}
exports.createIntegerLiteral = createIntegerLiteral;
function createFloatLiteral(value, range) {
    return new Expression_1.LiteralExpression(createToken(TokenKind_1.TokenKind.FloatLiteral, value, range));
}
exports.createFloatLiteral = createFloatLiteral;
function createInvalidLiteral(value, range) {
    return new Expression_1.LiteralExpression(createToken(TokenKind_1.TokenKind.Invalid, value, range));
}
exports.createInvalidLiteral = createInvalidLiteral;
function createBooleanLiteral(value, range) {
    return new Expression_1.LiteralExpression(createToken(value === 'true' ? TokenKind_1.TokenKind.True : TokenKind_1.TokenKind.False, value, range));
}
exports.createBooleanLiteral = createBooleanLiteral;
function createFunctionExpression(kind) {
    return new Expression_1.FunctionExpression([], new Statement_1.Block([]), createToken(kind), kind === TokenKind_1.TokenKind.Sub ? createToken(TokenKind_1.TokenKind.EndSub) : createToken(TokenKind_1.TokenKind.EndFunction), createToken(TokenKind_1.TokenKind.LeftParen), createToken(TokenKind_1.TokenKind.RightParen));
}
exports.createFunctionExpression = createFunctionExpression;
function createMethodStatement(name, kind = TokenKind_1.TokenKind.Function, modifiers) {
    return new Statement_1.MethodStatement(modifiers, createIdentifier(name), createFunctionExpression(kind), null);
}
exports.createMethodStatement = createMethodStatement;
/**
 * @deprecated use `createMethodStatement`
 */
function createClassMethodStatement(name, kind = TokenKind_1.TokenKind.Function, accessModifier) {
    return createMethodStatement(name, kind, [accessModifier]);
}
exports.createClassMethodStatement = createClassMethodStatement;
function createCall(callee, args) {
    return new Expression_1.CallExpression(callee, createToken(TokenKind_1.TokenKind.LeftParen, '('), createToken(TokenKind_1.TokenKind.RightParen, ')'), args || []);
}
exports.createCall = createCall;
/**
 * Create an SGAttribute without any ranges
 */
function createSGAttribute(keyName, value) {
    return {
        key: {
            text: keyName
        },
        value: {
            text: value
        }
    };
}
exports.createSGAttribute = createSGAttribute;
function createIfStatement(options) {
    var _a, _b, _c, _d;
    return new Statement_1.IfStatement({
        if: (_a = options.if) !== null && _a !== void 0 ? _a : createToken(TokenKind_1.TokenKind.If),
        then: (_b = options.then) !== null && _b !== void 0 ? _b : createToken(TokenKind_1.TokenKind.Then),
        else: (_c = options.else) !== null && _c !== void 0 ? _c : createToken(TokenKind_1.TokenKind.Else),
        endIf: (_d = options.endIf) !== null && _d !== void 0 ? _d : createToken(TokenKind_1.TokenKind.EndIf)
    }, options.condition, options.thenBranch, options.elseBranch);
}
exports.createIfStatement = createIfStatement;
function createBlock(options) {
    return new Statement_1.Block(options.statements);
}
exports.createBlock = createBlock;
function createAssignmentStatement(options) {
    var _a;
    return new Statement_1.AssignmentStatement((_a = options.equals) !== null && _a !== void 0 ? _a : createToken(TokenKind_1.TokenKind.Equal), typeof options.name === 'string' ? createIdentifier(options.name) : options.name, options.value);
}
exports.createAssignmentStatement = createAssignmentStatement;
function createDottedSetStatement(options) {
    var _a;
    return new Statement_1.DottedSetStatement(options.obj, typeof options.name === 'string' ? createIdentifier(options.name) : options.name, options.value, options.dot, (_a = options.equals) !== null && _a !== void 0 ? _a : createToken(TokenKind_1.TokenKind.Equal));
}
exports.createDottedSetStatement = createDottedSetStatement;
function createIndexedSetStatement(options) {
    var _a, _b, _c;
    return new Statement_1.IndexedSetStatement(options.obj, options.index, options.value, (_a = options.openingSquare) !== null && _a !== void 0 ? _a : createToken(TokenKind_1.TokenKind.LeftSquareBracket), (_b = options.closingSquare) !== null && _b !== void 0 ? _b : createToken(TokenKind_1.TokenKind.RightSquareBracket), options.additionalIndexes || [], (_c = options.equals) !== null && _c !== void 0 ? _c : createToken(TokenKind_1.TokenKind.Equal));
}
exports.createIndexedSetStatement = createIndexedSetStatement;
//# sourceMappingURL=creators.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBinaryExpression = exports.isExpression = exports.isAliasStatement = exports.isTypecastStatement = exports.isThrowStatement = exports.isCatchStatement = exports.isTryCatchStatement = exports.isContinueStatement = exports.isConstStatement = exports.isEnumMemberStatement = exports.isEnumStatement = exports.isInterfaceFieldStatement = exports.isInterfaceMethodStatement = exports.isInterfaceStatement = exports.isClassFieldStatement = exports.isFieldStatement = exports.isClassMethodStatement = exports.isMethodStatement = exports.isImportStatement = exports.isClassStatement = exports.isNamespaceStatement = exports.isLibraryStatement = exports.isIndexedSetStatement = exports.isDottedSetStatement = exports.isDimStatement = exports.isWhileStatement = exports.isForEachStatement = exports.isForStatement = exports.isStopStatement = exports.isEndStatement = exports.isNullCoalescingExpression = exports.isTernaryExpression = exports.isReturnStatement = exports.isLabelStatement = exports.isGotoStatement = exports.isPrintStatement = exports.isIncrementStatement = exports.isIfStatement = exports.isFunctionStatement = exports.isExitWhileStatement = exports.isExitForStatement = exports.isCommentStatement = exports.isExpressionStatement = exports.isBlock = exports.isAssignmentStatement = exports.isBody = exports.isStatement = exports.isXmlScope = exports.isXmlFile = exports.isBrsFile = void 0;
exports.isLiteralNumber = exports.isLiteralString = exports.isLiteralBoolean = exports.isLiteralInvalid = exports.isNumberType = exports.isObjectType = exports.isInterfaceType = exports.isDynamicType = exports.isCustomType = exports.isVoidType = exports.isInvalidType = exports.isDoubleType = exports.isFloatType = exports.isLongIntegerType = exports.isIntegerType = exports.isBooleanType = exports.isFunctionType = exports.isStringType = exports.isTypeCastExpression = exports.isTypedefProvider = exports.isAnnotationExpression = exports.isFunctionParameterExpression = exports.isTaggedTemplateStringExpression = exports.isTemplateStringExpression = exports.isTemplateStringQuasiExpression = exports.isCallfuncExpression = exports.isNewExpression = exports.isSourceLiteralExpression = exports.isVariableExpression = exports.isUnaryExpression = exports.isAAMemberExpression = exports.isAALiteralExpression = exports.isArrayLiteralExpression = exports.isEscapedCharCodeLiteralExpression = exports.isLiteralExpression = exports.isGroupingExpression = exports.isIndexedGetExpression = exports.isXmlAttributeGetExpression = exports.isDottedGetExpression = exports.isNamespacedVariableNameExpression = exports.isFunctionExpression = exports.isCallExpression = void 0;
const InvalidType_1 = require("../types/InvalidType");
const VoidType_1 = require("../types/VoidType");
const visitors_1 = require("./visitors");
const FunctionType_1 = require("../types/FunctionType");
const StringType_1 = require("../types/StringType");
const BooleanType_1 = require("../types/BooleanType");
const IntegerType_1 = require("../types/IntegerType");
const LongIntegerType_1 = require("../types/LongIntegerType");
const FloatType_1 = require("../types/FloatType");
const DoubleType_1 = require("../types/DoubleType");
const CustomType_1 = require("../types/CustomType");
const DynamicType_1 = require("../types/DynamicType");
// File reflection
function isBrsFile(file) {
    return (file === null || file === void 0 ? void 0 : file.constructor.name) === 'BrsFile';
}
exports.isBrsFile = isBrsFile;
function isXmlFile(file) {
    return (file === null || file === void 0 ? void 0 : file.constructor.name) === 'XmlFile';
}
exports.isXmlFile = isXmlFile;
function isXmlScope(scope) {
    return (scope === null || scope === void 0 ? void 0 : scope.constructor.name) === 'XmlScope';
}
exports.isXmlScope = isXmlScope;
// Statements reflection
/**
 * Determine if the variable is a descendent of the Statement base class.
 * Due to performance restrictions, this expects all statements to
 * directly extend Statement or FunctionStatement,
 * so it only checks the immediate parent's class name.
 */
function isStatement(element) {
    // eslint-disable-next-line no-bitwise
    return !!(element && element.visitMode & visitors_1.InternalWalkMode.visitStatements);
}
exports.isStatement = isStatement;
function isBody(element) {
    var _a;
    return ((_a = element === null || element === void 0 ? void 0 : element.constructor) === null || _a === void 0 ? void 0 : _a.name) === 'Body';
}
exports.isBody = isBody;
function isAssignmentStatement(element) {
    var _a;
    return ((_a = element === null || element === void 0 ? void 0 : element.constructor) === null || _a === void 0 ? void 0 : _a.name) === 'AssignmentStatement';
}
exports.isAssignmentStatement = isAssignmentStatement;
function isBlock(element) {
    var _a;
    return ((_a = element === null || element === void 0 ? void 0 : element.constructor) === null || _a === void 0 ? void 0 : _a.name) === 'Block';
}
exports.isBlock = isBlock;
function isExpressionStatement(element) {
    var _a;
    return ((_a = element === null || element === void 0 ? void 0 : element.constructor) === null || _a === void 0 ? void 0 : _a.name) === 'ExpressionStatement';
}
exports.isExpressionStatement = isExpressionStatement;
function isCommentStatement(element) {
    var _a;
    return ((_a = element === null || element === void 0 ? void 0 : element.constructor) === null || _a === void 0 ? void 0 : _a.name) === 'CommentStatement';
}
exports.isCommentStatement = isCommentStatement;
function isExitForStatement(element) {
    var _a;
    return ((_a = element === null || element === void 0 ? void 0 : element.constructor) === null || _a === void 0 ? void 0 : _a.name) === 'ExitForStatement';
}
exports.isExitForStatement = isExitForStatement;
function isExitWhileStatement(element) {
    var _a;
    return ((_a = element === null || element === void 0 ? void 0 : element.constructor) === null || _a === void 0 ? void 0 : _a.name) === 'ExitWhileStatement';
}
exports.isExitWhileStatement = isExitWhileStatement;
function isFunctionStatement(element) {
    var _a;
    return ((_a = element === null || element === void 0 ? void 0 : element.constructor) === null || _a === void 0 ? void 0 : _a.name) === 'FunctionStatement';
}
exports.isFunctionStatement = isFunctionStatement;
function isIfStatement(element) {
    var _a;
    return ((_a = element === null || element === void 0 ? void 0 : element.constructor) === null || _a === void 0 ? void 0 : _a.name) === 'IfStatement';
}
exports.isIfStatement = isIfStatement;
function isIncrementStatement(element) {
    var _a;
    return ((_a = element === null || element === void 0 ? void 0 : element.constructor) === null || _a === void 0 ? void 0 : _a.name) === 'IncrementStatement';
}
exports.isIncrementStatement = isIncrementStatement;
function isPrintStatement(element) {
    var _a;
    return ((_a = element === null || element === void 0 ? void 0 : element.constructor) === null || _a === void 0 ? void 0 : _a.name) === 'PrintStatement';
}
exports.isPrintStatement = isPrintStatement;
function isGotoStatement(element) {
    var _a;
    return ((_a = element === null || element === void 0 ? void 0 : element.constructor) === null || _a === void 0 ? void 0 : _a.name) === 'GotoStatement';
}
exports.isGotoStatement = isGotoStatement;
function isLabelStatement(element) {
    var _a;
    return ((_a = element === null || element === void 0 ? void 0 : element.constructor) === null || _a === void 0 ? void 0 : _a.name) === 'LabelStatement';
}
exports.isLabelStatement = isLabelStatement;
function isReturnStatement(element) {
    var _a;
    return ((_a = element === null || element === void 0 ? void 0 : element.constructor) === null || _a === void 0 ? void 0 : _a.name) === 'ReturnStatement';
}
exports.isReturnStatement = isReturnStatement;
function isTernaryExpression(element) {
    var _a;
    return ((_a = element === null || element === void 0 ? void 0 : element.constructor) === null || _a === void 0 ? void 0 : _a.name) === 'TernaryExpression';
}
exports.isTernaryExpression = isTernaryExpression;
function isNullCoalescingExpression(element) {
    var _a;
    return ((_a = element === null || element === void 0 ? void 0 : element.constructor) === null || _a === void 0 ? void 0 : _a.name) === 'NullCoalescingExpression';
}
exports.isNullCoalescingExpression = isNullCoalescingExpression;
function isEndStatement(element) {
    var _a;
    return ((_a = element === null || element === void 0 ? void 0 : element.constructor) === null || _a === void 0 ? void 0 : _a.name) === 'EndStatement';
}
exports.isEndStatement = isEndStatement;
function isStopStatement(element) {
    var _a;
    return ((_a = element === null || element === void 0 ? void 0 : element.constructor) === null || _a === void 0 ? void 0 : _a.name) === 'StopStatement';
}
exports.isStopStatement = isStopStatement;
function isForStatement(element) {
    var _a;
    return ((_a = element === null || element === void 0 ? void 0 : element.constructor) === null || _a === void 0 ? void 0 : _a.name) === 'ForStatement';
}
exports.isForStatement = isForStatement;
function isForEachStatement(element) {
    var _a;
    return ((_a = element === null || element === void 0 ? void 0 : element.constructor) === null || _a === void 0 ? void 0 : _a.name) === 'ForEachStatement';
}
exports.isForEachStatement = isForEachStatement;
function isWhileStatement(element) {
    var _a;
    return ((_a = element === null || element === void 0 ? void 0 : element.constructor) === null || _a === void 0 ? void 0 : _a.name) === 'WhileStatement';
}
exports.isWhileStatement = isWhileStatement;
function isDimStatement(element) {
    var _a;
    return ((_a = element === null || element === void 0 ? void 0 : element.constructor) === null || _a === void 0 ? void 0 : _a.name) === 'DimStatement';
}
exports.isDimStatement = isDimStatement;
function isDottedSetStatement(element) {
    var _a;
    return ((_a = element === null || element === void 0 ? void 0 : element.constructor) === null || _a === void 0 ? void 0 : _a.name) === 'DottedSetStatement';
}
exports.isDottedSetStatement = isDottedSetStatement;
function isIndexedSetStatement(element) {
    var _a;
    return ((_a = element === null || element === void 0 ? void 0 : element.constructor) === null || _a === void 0 ? void 0 : _a.name) === 'IndexedSetStatement';
}
exports.isIndexedSetStatement = isIndexedSetStatement;
function isLibraryStatement(element) {
    var _a;
    return ((_a = element === null || element === void 0 ? void 0 : element.constructor) === null || _a === void 0 ? void 0 : _a.name) === 'LibraryStatement';
}
exports.isLibraryStatement = isLibraryStatement;
function isNamespaceStatement(element) {
    var _a;
    return ((_a = element === null || element === void 0 ? void 0 : element.constructor) === null || _a === void 0 ? void 0 : _a.name) === 'NamespaceStatement';
}
exports.isNamespaceStatement = isNamespaceStatement;
function isClassStatement(element) {
    var _a;
    return ((_a = element === null || element === void 0 ? void 0 : element.constructor) === null || _a === void 0 ? void 0 : _a.name) === 'ClassStatement';
}
exports.isClassStatement = isClassStatement;
function isImportStatement(element) {
    var _a;
    return ((_a = element === null || element === void 0 ? void 0 : element.constructor) === null || _a === void 0 ? void 0 : _a.name) === 'ImportStatement';
}
exports.isImportStatement = isImportStatement;
function isMethodStatement(element) {
    const name = element === null || element === void 0 ? void 0 : element.constructor.name;
    return name === 'MethodStatement' || name === 'ClassMethodStatement';
}
exports.isMethodStatement = isMethodStatement;
/**
 * @deprecated use `isMethodStatement`
 */
function isClassMethodStatement(element) {
    return isMethodStatement(element);
}
exports.isClassMethodStatement = isClassMethodStatement;
function isFieldStatement(element) {
    const name = element === null || element === void 0 ? void 0 : element.constructor.name;
    return name === 'FieldStatement' || name === 'ClassFieldStatement';
}
exports.isFieldStatement = isFieldStatement;
/**
 * @deprecated use `isFieldStatement`
 */
function isClassFieldStatement(element) {
    return isFieldStatement(element);
}
exports.isClassFieldStatement = isClassFieldStatement;
function isInterfaceStatement(element) {
    return (element === null || element === void 0 ? void 0 : element.constructor.name) === 'InterfaceStatement';
}
exports.isInterfaceStatement = isInterfaceStatement;
function isInterfaceMethodStatement(element) {
    return (element === null || element === void 0 ? void 0 : element.constructor.name) === 'InterfaceMethodStatement';
}
exports.isInterfaceMethodStatement = isInterfaceMethodStatement;
function isInterfaceFieldStatement(element) {
    return (element === null || element === void 0 ? void 0 : element.constructor.name) === 'InterfaceFieldStatement';
}
exports.isInterfaceFieldStatement = isInterfaceFieldStatement;
function isEnumStatement(element) {
    return (element === null || element === void 0 ? void 0 : element.constructor.name) === 'EnumStatement';
}
exports.isEnumStatement = isEnumStatement;
function isEnumMemberStatement(element) {
    return (element === null || element === void 0 ? void 0 : element.constructor.name) === 'EnumMemberStatement';
}
exports.isEnumMemberStatement = isEnumMemberStatement;
function isConstStatement(element) {
    return (element === null || element === void 0 ? void 0 : element.constructor.name) === 'ConstStatement';
}
exports.isConstStatement = isConstStatement;
function isContinueStatement(element) {
    return (element === null || element === void 0 ? void 0 : element.constructor.name) === 'ContinueStatement';
}
exports.isContinueStatement = isContinueStatement;
function isTryCatchStatement(element) {
    return (element === null || element === void 0 ? void 0 : element.constructor.name) === 'TryCatchStatement';
}
exports.isTryCatchStatement = isTryCatchStatement;
function isCatchStatement(element) {
    return (element === null || element === void 0 ? void 0 : element.constructor.name) === 'CatchStatement';
}
exports.isCatchStatement = isCatchStatement;
function isThrowStatement(element) {
    return (element === null || element === void 0 ? void 0 : element.constructor.name) === 'ThrowStatement';
}
exports.isThrowStatement = isThrowStatement;
function isTypecastStatement(element) {
    var _a;
    return ((_a = element === null || element === void 0 ? void 0 : element.constructor) === null || _a === void 0 ? void 0 : _a.name) === 'TypecastStatement';
}
exports.isTypecastStatement = isTypecastStatement;
function isAliasStatement(element) {
    var _a;
    return ((_a = element === null || element === void 0 ? void 0 : element.constructor) === null || _a === void 0 ? void 0 : _a.name) === 'AliasStatement';
}
exports.isAliasStatement = isAliasStatement;
// Expressions reflection
/**
 * Determine if the variable is a descendent of the Expression base class.
 * Due to performance restrictions, this expects all statements to directly extend Expression,
 * so it only checks the immediate parent's class name. For example:
 * this will work for StringLiteralExpression -> Expression,
 * but will not work CustomStringLiteralExpression -> StringLiteralExpression -> Expression
 */
function isExpression(element) {
    // eslint-disable-next-line no-bitwise
    return !!(element && element.visitMode & visitors_1.InternalWalkMode.visitExpressions);
}
exports.isExpression = isExpression;
function isBinaryExpression(element) {
    return (element === null || element === void 0 ? void 0 : element.constructor.name) === 'BinaryExpression';
}
exports.isBinaryExpression = isBinaryExpression;
function isCallExpression(element) {
    return (element === null || element === void 0 ? void 0 : element.constructor.name) === 'CallExpression';
}
exports.isCallExpression = isCallExpression;
function isFunctionExpression(element) {
    return (element === null || element === void 0 ? void 0 : element.constructor.name) === 'FunctionExpression';
}
exports.isFunctionExpression = isFunctionExpression;
function isNamespacedVariableNameExpression(element) {
    return (element === null || element === void 0 ? void 0 : element.constructor.name) === 'NamespacedVariableNameExpression';
}
exports.isNamespacedVariableNameExpression = isNamespacedVariableNameExpression;
function isDottedGetExpression(element) {
    return (element === null || element === void 0 ? void 0 : element.constructor.name) === 'DottedGetExpression';
}
exports.isDottedGetExpression = isDottedGetExpression;
function isXmlAttributeGetExpression(element) {
    return (element === null || element === void 0 ? void 0 : element.constructor.name) === 'XmlAttributeGetExpression';
}
exports.isXmlAttributeGetExpression = isXmlAttributeGetExpression;
function isIndexedGetExpression(element) {
    return (element === null || element === void 0 ? void 0 : element.constructor.name) === 'IndexedGetExpression';
}
exports.isIndexedGetExpression = isIndexedGetExpression;
function isGroupingExpression(element) {
    return (element === null || element === void 0 ? void 0 : element.constructor.name) === 'GroupingExpression';
}
exports.isGroupingExpression = isGroupingExpression;
function isLiteralExpression(element) {
    return (element === null || element === void 0 ? void 0 : element.constructor.name) === 'LiteralExpression';
}
exports.isLiteralExpression = isLiteralExpression;
function isEscapedCharCodeLiteralExpression(element) {
    return (element === null || element === void 0 ? void 0 : element.constructor.name) === 'EscapedCharCodeLiteralExpression';
}
exports.isEscapedCharCodeLiteralExpression = isEscapedCharCodeLiteralExpression;
function isArrayLiteralExpression(element) {
    return (element === null || element === void 0 ? void 0 : element.constructor.name) === 'ArrayLiteralExpression';
}
exports.isArrayLiteralExpression = isArrayLiteralExpression;
function isAALiteralExpression(element) {
    return (element === null || element === void 0 ? void 0 : element.constructor.name) === 'AALiteralExpression';
}
exports.isAALiteralExpression = isAALiteralExpression;
function isAAMemberExpression(element) {
    return (element === null || element === void 0 ? void 0 : element.constructor.name) === 'AAMemberExpression';
}
exports.isAAMemberExpression = isAAMemberExpression;
function isUnaryExpression(element) {
    return (element === null || element === void 0 ? void 0 : element.constructor.name) === 'UnaryExpression';
}
exports.isUnaryExpression = isUnaryExpression;
function isVariableExpression(element) {
    return (element === null || element === void 0 ? void 0 : element.constructor.name) === 'VariableExpression';
}
exports.isVariableExpression = isVariableExpression;
function isSourceLiteralExpression(element) {
    return (element === null || element === void 0 ? void 0 : element.constructor.name) === 'SourceLiteralExpression';
}
exports.isSourceLiteralExpression = isSourceLiteralExpression;
function isNewExpression(element) {
    return (element === null || element === void 0 ? void 0 : element.constructor.name) === 'NewExpression';
}
exports.isNewExpression = isNewExpression;
function isCallfuncExpression(element) {
    return (element === null || element === void 0 ? void 0 : element.constructor.name) === 'CallfuncExpression';
}
exports.isCallfuncExpression = isCallfuncExpression;
function isTemplateStringQuasiExpression(element) {
    return (element === null || element === void 0 ? void 0 : element.constructor.name) === 'TemplateStringQuasiExpression';
}
exports.isTemplateStringQuasiExpression = isTemplateStringQuasiExpression;
function isTemplateStringExpression(element) {
    return (element === null || element === void 0 ? void 0 : element.constructor.name) === 'TemplateStringExpression';
}
exports.isTemplateStringExpression = isTemplateStringExpression;
function isTaggedTemplateStringExpression(element) {
    return (element === null || element === void 0 ? void 0 : element.constructor.name) === 'TaggedTemplateStringExpression';
}
exports.isTaggedTemplateStringExpression = isTaggedTemplateStringExpression;
function isFunctionParameterExpression(element) {
    return (element === null || element === void 0 ? void 0 : element.constructor.name) === 'FunctionParameterExpression';
}
exports.isFunctionParameterExpression = isFunctionParameterExpression;
function isAnnotationExpression(element) {
    return (element === null || element === void 0 ? void 0 : element.constructor.name) === 'AnnotationExpression';
}
exports.isAnnotationExpression = isAnnotationExpression;
function isTypedefProvider(element) {
    return 'getTypedef' in element;
}
exports.isTypedefProvider = isTypedefProvider;
function isTypeCastExpression(element) {
    return (element === null || element === void 0 ? void 0 : element.constructor.name) === 'TypeCastExpression';
}
exports.isTypeCastExpression = isTypeCastExpression;
// BscType reflection
function isStringType(value) {
    return (value === null || value === void 0 ? void 0 : value.constructor.name) === StringType_1.StringType.name;
}
exports.isStringType = isStringType;
function isFunctionType(e) {
    return (e === null || e === void 0 ? void 0 : e.constructor.name) === FunctionType_1.FunctionType.name;
}
exports.isFunctionType = isFunctionType;
function isBooleanType(e) {
    return (e === null || e === void 0 ? void 0 : e.constructor.name) === BooleanType_1.BooleanType.name;
}
exports.isBooleanType = isBooleanType;
function isIntegerType(e) {
    return (e === null || e === void 0 ? void 0 : e.constructor.name) === IntegerType_1.IntegerType.name;
}
exports.isIntegerType = isIntegerType;
function isLongIntegerType(e) {
    return (e === null || e === void 0 ? void 0 : e.constructor.name) === LongIntegerType_1.LongIntegerType.name;
}
exports.isLongIntegerType = isLongIntegerType;
function isFloatType(e) {
    return (e === null || e === void 0 ? void 0 : e.constructor.name) === FloatType_1.FloatType.name;
}
exports.isFloatType = isFloatType;
function isDoubleType(e) {
    return (e === null || e === void 0 ? void 0 : e.constructor.name) === DoubleType_1.DoubleType.name;
}
exports.isDoubleType = isDoubleType;
function isInvalidType(e) {
    return (e === null || e === void 0 ? void 0 : e.constructor.name) === InvalidType_1.InvalidType.name;
}
exports.isInvalidType = isInvalidType;
function isVoidType(e) {
    return (e === null || e === void 0 ? void 0 : e.constructor.name) === VoidType_1.VoidType.name;
}
exports.isVoidType = isVoidType;
function isCustomType(e) {
    return (e === null || e === void 0 ? void 0 : e.constructor.name) === CustomType_1.CustomType.name;
}
exports.isCustomType = isCustomType;
function isDynamicType(e) {
    return (e === null || e === void 0 ? void 0 : e.constructor.name) === DynamicType_1.DynamicType.name;
}
exports.isDynamicType = isDynamicType;
function isInterfaceType(e) {
    return (e === null || e === void 0 ? void 0 : e.constructor.name) === 'InterfaceType';
}
exports.isInterfaceType = isInterfaceType;
function isObjectType(e) {
    return (e === null || e === void 0 ? void 0 : e.constructor.name) === 'ObjectType';
}
exports.isObjectType = isObjectType;
const numberConstructorNames = [
    IntegerType_1.IntegerType.name,
    LongIntegerType_1.LongIntegerType.name,
    FloatType_1.FloatType.name,
    DoubleType_1.DoubleType.name
];
function isNumberType(e) {
    return numberConstructorNames.includes(e === null || e === void 0 ? void 0 : e.constructor.name);
}
exports.isNumberType = isNumberType;
// Literal reflection
function isLiteralInvalid(e) {
    return isLiteralExpression(e) && isInvalidType(e.type);
}
exports.isLiteralInvalid = isLiteralInvalid;
function isLiteralBoolean(e) {
    return isLiteralExpression(e) && isBooleanType(e.type);
}
exports.isLiteralBoolean = isLiteralBoolean;
function isLiteralString(e) {
    return isLiteralExpression(e) && isStringType(e.type);
}
exports.isLiteralString = isLiteralString;
function isLiteralNumber(e) {
    return isLiteralExpression(e) && isNumberType(e.type);
}
exports.isLiteralNumber = isLiteralNumber;
//# sourceMappingURL=reflection.js.map
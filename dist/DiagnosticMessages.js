"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.diagnosticCodes = exports.DiagnosticCodeMap = exports.DiagnosticMessages = void 0;
const vscode_languageserver_1 = require("vscode-languageserver");
/**
 * An object that keeps track of all possible error messages.
 */
exports.DiagnosticMessages = {
    //this one won't be used much, we just need a catchall object for the code since we pass through the message from the parser
    genericParserMessage: (message) => ({
        message: message,
        code: 1000,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    /**
     *
     * @param name for local vars, it's the var name. for namespaced parts, it's the specific part that's unknown (`alpha.beta.charlie` would result in "cannot find name 'charlie')
     * @param fullName if a namespaced name, this is the full name `alpha.beta.charlie`, otherwise it's the same as `name`
     */
    cannotFindName: (name, fullName) => ({
        message: `Cannot find name '${name}'`,
        code: 1001,
        data: {
            name: name,
            fullName: fullName !== null && fullName !== void 0 ? fullName : name
        },
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    mismatchArgumentCount: (expectedCount, actualCount) => ({
        message: `Expected ${expectedCount} arguments, but got ${actualCount}.`,
        code: 1002,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    duplicateFunctionImplementation: (functionName, scopeName) => ({
        message: `Duplicate function implementation for '${functionName}' when this file is included in scope '${scopeName}'.`,
        code: 1003,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    referencedFileDoesNotExist: () => ({
        message: `Referenced file does not exist.`,
        code: 1004,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    xmlComponentMissingComponentDeclaration: () => ({
        message: `Missing a component declaration.`,
        code: 1005,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    xmlComponentMissingNameAttribute: () => ({
        message: `Component must have a name attribute.`,
        code: 1006,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    xmlComponentMissingExtendsAttribute: () => ({
        message: `Component is mising "extends" attribute and will automatically extend "Group" by default`,
        code: 1007,
        severity: vscode_languageserver_1.DiagnosticSeverity.Warning
    }),
    xmlGenericParseError: (message) => ({
        //generic catchall xml parse error
        message: message,
        code: 1008,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    unnecessaryScriptImportInChildFromParent: (parentComponentName) => ({
        message: `Unnecessary script import: Script is already imported in ancestor component '${parentComponentName}'.`,
        code: 1009,
        severity: vscode_languageserver_1.DiagnosticSeverity.Warning
    }),
    overridesAncestorFunction: (callableName, currentScopeName, parentFilePath, parentScopeName) => ({
        message: `Function '${callableName}' included in '${currentScopeName}' overrides function in '${parentFilePath}' included in '${parentScopeName}'.`,
        code: 1010,
        severity: vscode_languageserver_1.DiagnosticSeverity.Hint
    }),
    localVarFunctionShadowsParentFunction: (scopeName) => ({
        message: `Local variable function has same name as ${scopeName} function and will never be called.`,
        code: 1011,
        severity: vscode_languageserver_1.DiagnosticSeverity.Warning
    }),
    scriptImportCaseMismatch: (correctFilePath) => ({
        message: `Script import path does not match casing of actual file path '${correctFilePath}'.`,
        code: 1012,
        severity: vscode_languageserver_1.DiagnosticSeverity.Warning
    }),
    fileNotReferencedByAnyOtherFile: () => ({
        message: `This file is not referenced by any other file in the project.`,
        code: 1013,
        severity: vscode_languageserver_1.DiagnosticSeverity.Warning
    }),
    unknownDiagnosticCode: (theUnknownCode) => ({
        message: `Unknown diagnostic code ${theUnknownCode}`,
        code: 1014,
        severity: vscode_languageserver_1.DiagnosticSeverity.Warning
    }),
    scriptSrcCannotBeEmpty: () => ({
        message: `Script import cannot be empty or whitespace`,
        code: 1015,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    expectedIdentifierAfterKeyword: (keywordText) => ({
        message: `Expected identifier after '${keywordText}' keyword`,
        code: 1016,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    missingCallableKeyword: () => ({
        message: `Expected 'function' or 'sub' to preceed identifier`,
        code: 1017,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    expectedValidTypeToFollowAsKeyword: () => ({
        message: `Expected valid type to follow 'as' keyword`,
        code: 1018,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    bsFeatureNotSupportedInBrsFiles: (featureName) => ({
        message: `BrighterScript feature '${featureName}' is not supported in standard BrightScript files`,
        code: 1019,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    brsConfigJsonIsDeprecated: () => ({
        message: `'brsconfig.json' is deprecated. Please rename to 'bsconfig.json'`,
        code: 1020,
        severity: vscode_languageserver_1.DiagnosticSeverity.Warning
    }),
    bsConfigJsonHasSyntaxErrors: (message) => ({
        message: `Encountered syntax errors in bsconfig.json: ${message}`,
        code: 1021,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    namespacedClassCannotShareNamewithNonNamespacedClass: (nonNamespacedClassName) => ({
        message: `Namespaced class cannot have the same name as a non-namespaced class '${nonNamespacedClassName}'`,
        code: 1022,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    cannotUseOverrideKeywordOnConstructorFunction: () => ({
        message: 'Override keyword is not allowed on class constructor method',
        code: 1023,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    importStatementMustBeDeclaredAtTopOfFile: () => ({
        message: `'import' statement must be declared at the top of the file`,
        code: 1024,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    methodDoesNotExistOnType: (methodName, className) => ({
        message: `Method '${methodName}' does not exist on type '${className}'`,
        code: 1025,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    duplicateIdentifier: (memberName) => ({
        message: `Duplicate identifier '${memberName}'`,
        code: 1026,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    missingOverrideKeyword: (ancestorClassName) => ({
        message: `Method has no override keyword but is declared in ancestor class '${ancestorClassName}'`,
        code: 1027,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    duplicateClassDeclaration: (scopeName, className) => ({
        message: `Scope '${scopeName}' already contains a class with name '${className}'`,
        code: 1028,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    classCouldNotBeFound: (className, scopeName) => ({
        message: `Class '${className}' could not be found when this file is included in scope '${scopeName}'`,
        code: 1029,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error,
        data: {
            className: className
        }
    }),
    expectedClassFieldIdentifier: () => ({
        message: `Expected identifier in class body`,
        code: 1030,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    expressionIsNotConstructable: (expressionType) => ({
        message: `Cannot use the 'new' keyword here because '${expressionType}' is not a constructable type`,
        code: 1031,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    expectedKeyword: (kind) => ({
        message: `Expected '${kind}' keyword`,
        code: 1032,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    expectedLeftParenAfterCallable: (callableType) => ({
        message: `Expected '(' after ${callableType}`,
        code: 1033,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    expectedNameAfterCallableKeyword: (callableType) => ({
        message: `Expected ${callableType} name after '${callableType}' keyword`,
        code: 1034,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    expectedLeftParenAfterCallableName: (callableType) => ({
        message: `Expected '(' after ${callableType} name`,
        code: 1035,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    tooManyCallableParameters: (actual, max) => ({
        message: `Cannot have more than ${max} parameters but found ${actual})`,
        code: 1036,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    invalidFunctionReturnType: (typeText) => ({
        message: `Function return type '${typeText}' is invalid`,
        code: 1037,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    requiredParameterMayNotFollowOptionalParameter: (parameterName) => ({
        message: `Required parameter '${parameterName}' must be declared before any optional parameters`,
        code: 1038,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    expectedNewlineOrColon: () => ({
        message: `Expected newline or ':' at the end of a statement`,
        code: 1039,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    functionNameCannotEndWithTypeDesignator: (callableType, name, designator) => ({
        message: `${callableType} name '${name}' cannot end with type designator '${designator}'`,
        code: 1040,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    callableBlockMissingEndKeyword: (callableType) => ({
        message: `Expected 'end ${callableType}' to terminate ${callableType} block`,
        code: 1041,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    mismatchedEndCallableKeyword: (expectedCallableType, actualCallableType) => ({
        message: `Expected 'end ${expectedCallableType === null || expectedCallableType === void 0 ? void 0 : expectedCallableType.replace(/^end\s*/, '')}' to terminate ${expectedCallableType} block but found 'end ${actualCallableType === null || actualCallableType === void 0 ? void 0 : actualCallableType.replace(/^end\s*/, '')}' instead.`,
        code: 1042,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    expectedParameterNameButFound: (text) => ({
        message: `Expected parameter name, but found '${text !== null && text !== void 0 ? text : ''}'`,
        code: 1043,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    functionParameterTypeIsInvalid: (parameterName, typeText) => ({
        message: `Function parameter '${parameterName}' is of invalid type '${typeText}'`,
        code: 1044,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    cannotUseReservedWordAsIdentifier: (name) => ({
        message: `Cannot use reserved word '${name}' as an identifier`,
        code: 1045,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    expectedOperatorAfterIdentifier: (operators, name) => {
        operators = Array.isArray(operators) ? operators : [];
        return {
            message: `Expected operator ('${operators.join(`', '`)}') after idenfifier '${name}'`,
            code: 1046,
            severity: vscode_languageserver_1.DiagnosticSeverity.Error
        };
    },
    expectedInlineIfStatement: () => ({
        message: `If/else statement within an inline if should be also inline`,
        code: 1047,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    expectedFinalNewline: () => ({
        message: `Expected newline at the end of an inline if statement`,
        code: 1048,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    couldNotFindMatchingEndKeyword: (keyword) => ({
        message: `Could not find matching 'end ${keyword}'`,
        code: 1049,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    expectedCatchBlockInTryCatch: () => ({
        message: `Expected 'catch' block in 'try' statement`,
        code: 1050,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    expectedEndForOrNextToTerminateForLoop: () => ({
        message: `Expected 'end for' or 'next' to terminate 'for' loop`,
        code: 1051,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    expectedInAfterForEach: (name) => ({
        message: `Expected 'in' after 'for each ${name}'`,
        code: 1052,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    expectedExpressionAfterForEachIn: () => ({
        message: `Expected expression after 'in' keyword from 'for each' statement`,
        code: 1053,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    unexpectedColonBeforeIfStatement: () => ({
        message: `Colon before 'if' statement is not allowed`,
        code: 1054,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    expectedStringLiteralAfterKeyword: (keyword) => ({
        message: `Missing string literal after '${keyword}' keyword`,
        code: 1055,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    keywordMustBeDeclaredAtRootLevel: (keyword) => ({
        message: `${keyword} must be declared at the root level`,
        code: 1056,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    libraryStatementMustBeDeclaredAtTopOfFile: () => ({
        message: `'library' statement must be declared at the top of the file`,
        code: 1057,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    expectedEndIfElseIfOrElseToTerminateThenBlock: () => ({
        message: `Expected 'end if', 'else if', or 'else' to terminate 'then' block`,
        code: 1058,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    expectedEndTryToTerminateTryCatch: () => ({
        message: `Expected 'end try' to terminate 'try-catch' statement`,
        code: 1059,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    expectedEndIfToCloseIfStatement: (startingPosition) => ({
        message: `Expected 'end if' to close 'if' statement started at ${(startingPosition === null || startingPosition === void 0 ? void 0 : startingPosition.line) + 1}:${(startingPosition === null || startingPosition === void 0 ? void 0 : startingPosition.character) + 1}`,
        code: 1060,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    expectedStatementToFollowConditionalCondition: (conditionType) => ({
        message: `Expected a statement to follow '${conditionType === null || conditionType === void 0 ? void 0 : conditionType.toLowerCase()} ...condition... then'`,
        code: 1061,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    expectedStatementToFollowElse: () => ({
        message: `Expected a statement to follow 'else'`,
        code: 1062,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    consecutiveIncrementDecrementOperatorsAreNotAllowed: () => ({
        message: `Consecutive increment/decrement operators are not allowed`,
        code: 1063,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    incrementDecrementOperatorsAreNotAllowedAsResultOfFunctionCall: () => ({
        message: ``,
        code: 1064,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    xmlUnexpectedTag: (tagName) => ({
        message: `Unexpected tag '${tagName}'`,
        code: 1065,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    expectedStatementOrFunctionCallButReceivedExpression: () => ({
        message: `Expected statement or function call but instead found expression`,
        code: 1066,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    xmlFunctionNotFound: (name) => ({
        message: `Cannot find function with name '${name}' in component scope`,
        code: 1067,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    xmlInvalidFieldType: (name) => ({
        message: `Invalid field type ${name}`,
        code: 1068,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    xmlUnexpectedChildren: (tagName) => ({
        message: `Tag '${tagName}' should not have children`,
        code: 1069,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    xmlTagMissingAttribute: (tagName, attrName) => ({
        message: `Tag '${tagName}' must have a '${attrName}' attribute`,
        code: 1070,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    expectedLabelIdentifierAfterGotoKeyword: () => ({
        message: `Expected label identifier after 'goto' keyword`,
        code: 1071,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    expectedRightSquareBraceAfterArrayOrObjectIndex: () => ({
        message: `Expected ']' after array or object index`,
        code: 1072,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    expectedPropertyNameAfterPeriod: () => ({
        message: `Expected property name after '.'`,
        code: 1073,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    tooManyCallableArguments: (actual, max) => ({
        message: `Cannot have more than ${max} arguments but found ${actual}`,
        code: 1074,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    expectedRightParenAfterFunctionCallArguments: () => ({
        message: `Expected ')' after function call arguments`,
        code: 1075,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    unmatchedLeftParenAfterExpression: () => ({
        message: `Unmatched '(': expected ')' after expression`,
        code: 1076,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    unmatchedLeftSquareBraceAfterArrayLiteral: () => ({
        message: `Unmatched '[': expected ']' after array literal`,
        code: 1077,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    unexpectedAAKey: () => ({
        message: `Expected identifier or string as associative array key`,
        code: 1078,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    expectedColonBetweenAAKeyAndvalue: () => ({
        message: `Expected ':' between associative array key and value`,
        code: 1079,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    unmatchedLeftCurlyAfterAALiteral: () => ({
        message: `Unmatched '{': expected '}' after associative array literal`,
        code: 1080,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    unexpectedToken: (text) => ({
        message: `Unexpected token '${text}'`,
        code: 1081,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    /**
     * Used in the lexer anytime we encounter an unsupported character
     */
    unexpectedCharacter: (text) => ({
        message: `Unexpected character '${text}' (char code ${text === null || text === void 0 ? void 0 : text.charCodeAt(0)})`,
        code: 1082,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    unterminatedStringAtEndOfLine: () => ({
        message: `Unterminated string at end of line`,
        code: 1083,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    unterminatedStringAtEndOfFile: () => ({
        message: `Unterminated string at end of file`,
        code: 1084,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    fractionalHexLiteralsAreNotSupported: () => ({
        message: `Fractional hex literals are not supported`,
        code: 1085,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    unexpectedConditionalCompilationString: () => ({
        message: `Unexpected conditional-compilation string`,
        code: 1086,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    duplicateConstDeclaration: (name) => ({
        message: `Attempting to redeclare #const with name '${name}'`,
        code: 1087,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    constAliasDoesNotExist: (name) => ({
        message: `Attempting to create #const alias of '${name}', but no such #const exists`,
        code: 1088,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    invalidHashConstValue: () => ({
        message: '#const declarations can only have values of `true`, `false`, or other #const names',
        code: 1089,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    referencedConstDoesNotExist: () => ({
        message: `Referenced #const does not exist`,
        code: 1090,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    invalidHashIfValue: () => ({
        message: `#if conditionals can only be 'true', 'false', or other #const names`,
        code: 1091,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    hashError: (message) => ({
        message: `#error ${message}`,
        code: 1092,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    expectedEqualAfterConstName: () => ({
        message: `Expected '=' after #const`,
        code: 1093,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    expectedHashElseIfToCloseHashIf: (startingLine) => ({
        message: `Expected '#else if' to close '#if' conditional compilation statement starting on line ${startingLine}`,
        code: 1094,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    constNameCannotBeReservedWord: () => ({
        message: `#const name cannot be a reserved word`,
        code: 1095,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    expectedIdentifier: () => ({
        message: `Expected identifier`,
        code: 1096,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    expectedAttributeNameAfterAtSymbol: () => ({
        message: `Expected xml attribute name after '@'`,
        code: 1097,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    childFieldTypeNotAssignableToBaseProperty: (childTypeName, baseTypeName, fieldName, childFieldType, parentFieldType) => ({
        message: `Field '${fieldName}' in class '${childTypeName}' is not assignable to the same field in base class '${baseTypeName}'. Type '${childFieldType}' is not assignable to type '${parentFieldType}'.`,
        code: 1098,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    classChildMemberDifferentMemberTypeThanAncestor: (memberType, parentMemberType, parentClassName) => ({
        message: `Class member is a ${memberType} here but a ${parentMemberType} in ancestor class '${parentClassName}'`,
        code: 1099,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    classConstructorMissingSuperCall: () => ({
        message: `Missing "super()" call in class constructor method.`,
        code: 1100,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    classConstructorIllegalUseOfMBeforeSuperCall: () => ({
        message: `Illegal use of "m" before calling "super()"`,
        code: 1101,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    classFieldCannotBeOverridden: () => ({
        message: `Class field cannot be overridden`,
        code: 1102,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    unusedAnnotation: () => ({
        message: `This annotation is not attached to any statement`,
        code: 1103,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    localVarShadowedByScopedFunction: () => ({
        message: `Declaring a local variable with same name as scoped function can result in unexpected behavior`,
        code: 1104,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    scopeFunctionShadowedByBuiltInFunction: () => ({
        message: `Scope function will not be accessible because it has the same name as a built-in function`,
        code: 1105,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    localVarSameNameAsClass: (className) => ({
        message: `Local variable has same name as class '${className}'`,
        code: 1106,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    unnecessaryCodebehindScriptImport: () => ({
        message: `This import is unnecessary because compiler option 'autoImportComponentScript' is enabled`,
        code: 1107,
        severity: vscode_languageserver_1.DiagnosticSeverity.Warning
    }),
    expectedOpenParenToFollowCallfuncIdentifier: () => ({
        message: `Expected '(' to follow callfunc identifier`,
        code: 1108,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    expectedToken: (...tokenKinds) => ({
        message: `Expected token '${tokenKinds.join(`' or '`)}'`,
        code: 1109,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    parameterMayNotHaveSameNameAsNamespace: (paramName) => ({
        message: `Parameter '${paramName}' may not have the same name as namespace`,
        code: 1110,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    variableMayNotHaveSameNameAsNamespace: (variableName) => ({
        message: `Variable '${variableName}' may not have the same name as namespace`,
        code: 1111,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    unterminatedTemplateStringAtEndOfFile: () => ({
        message: `Unterminated template string at end of file`,
        code: 1113,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    unterminatedTemplateExpression: () => ({
        message: `Unterminated template string expression. '\${' must be followed by expression, then '}'`,
        code: 1114,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    duplicateComponentName: (componentName) => ({
        message: `There are multiple components with the name '${componentName}'`,
        code: 1115,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    functionCannotHaveSameNameAsClass: (className) => ({
        message: `Function has same name as class '${className}'`,
        code: 1116,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    missingExceptionVarToFollowCatch: () => ({
        message: `Missing exception variable after 'catch' keyword`,
        code: 1117,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    missingExceptionExpressionAfterThrowKeyword: () => ({
        message: `Missing exception expression after 'throw' keyword`,
        code: 1118,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    missingLeftSquareBracketAfterDimIdentifier: () => ({
        message: `Missing left square bracket after 'dim' identifier`,
        code: 1119,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    missingRightSquareBracketAfterDimIdentifier: () => ({
        message: `Missing right square bracket after 'dim' identifier`,
        code: 1120,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    missingExpressionsInDimStatement: () => ({
        message: `Missing expression(s) in 'dim' statement`,
        code: 1121,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    mismatchedOverriddenMemberVisibility: (childClassName, memberName, childAccessModifier, ancestorAccessModifier, ancestorClassName) => ({
        message: `Access modifier mismatch: '${memberName}' is ${childAccessModifier} in type '${childClassName}' but is ${ancestorAccessModifier} in base type '${ancestorClassName}'.`,
        code: 1122,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    cannotFindType: (typeName) => ({
        message: `Cannot find type with name '${typeName}'`,
        code: 1123,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    enumValueMustBeType: (expectedType) => ({
        message: `Enum value must be type '${expectedType}'`,
        code: 1124,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    enumValueIsRequired: (expectedType) => ({
        message: `Value is required for ${expectedType} enum`,
        code: 1125,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    unknownEnumValue: (name, enumName) => ({
        message: `Property '${name}' does not exist on enum '${enumName}'`,
        code: 1126,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    duplicateEnumDeclaration: (scopeName, enumName) => ({
        message: `Scope '${scopeName}' already contains an enum with name '${enumName}'`,
        code: 1127,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    unknownRoSGNode: (nodeName) => ({
        message: `Unknown roSGNode '${nodeName}'`,
        code: 1128,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    unknownBrightScriptComponent: (componentName) => ({
        message: `Unknown BrightScript component '${componentName}'`,
        code: 1129,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    mismatchCreateObjectArgumentCount: (componentName, allowedArgCounts, actualCount) => {
        const argCountArray = (allowedArgCounts || [1]).sort().filter((value, index, self) => self.indexOf(value) === index);
        return {
            message: `For ${componentName}, expected ${argCountArray.map(c => c.toString()).join(' or ')} total arguments, but got ${actualCount}.`,
            code: 1130,
            severity: vscode_languageserver_1.DiagnosticSeverity.Error
        };
    },
    deprecatedBrightScriptComponent: (componentName, deprecatedDescription) => ({
        message: `${componentName} has been deprecated${deprecatedDescription ? ': ' + deprecatedDescription : ''}`,
        code: 1131,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    circularReferenceDetected: (items, scopeName) => ({
        message: `Circular reference detected between ${Array.isArray(items) ? items.join(' -> ') : ''} in scope '${scopeName}'`,
        code: 1132,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    unexpectedStatementOutsideFunction: () => ({
        message: `Unexpected statement found outside of function body`,
        code: 1133,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    detectedTooDeepFileSource: (numberOfParentDirectories) => ({
        message: `Expected directory depth no larger than 7, but found ${numberOfParentDirectories}`,
        code: 1134,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    illegalContinueStatement: () => ({
        message: `Continue statement must be contained within a loop statement`,
        code: 1135,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    keywordMustBeDeclaredAtNamespaceLevel: (keyword) => ({
        message: `${keyword} must be declared at the root level or within a namespace`,
        code: 1136,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    itemCannotBeUsedAsVariable: (itemType) => ({
        message: `${itemType} cannot be used as a variable`,
        code: 1137,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    callfuncHasToManyArgs: (numberOfArgs) => ({
        message: `You can not have more than 5 arguments in a callFunc. ${numberOfArgs} found.`,
        code: 1138,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    noOptionalChainingInLeftHandSideOfAssignment: () => ({
        message: `Optional chaining may not be used in the left-hand side of an assignment`,
        code: 1139,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    /**
     * @param name for function calls where we can't find the name of the function
     * @param fullName if a namespaced name, this is the full name `alpha.beta.charlie`, otherwise it's the same as `name`
     */
    cannotFindFunction: (name, fullName) => ({
        message: `Cannot find function '${name}'`,
        code: 1140,
        data: {
            name: name,
            fullName: fullName !== null && fullName !== void 0 ? fullName : name
        },
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    voidFunctionMayNotReturnValue: (functionType = 'function') => ({
        message: `Void ${functionType} may not return a value`,
        code: 1141,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    nonVoidFunctionMustReturnValue: (functionType = 'function') => ({
        message: `Non-void ${functionType} must return a value`,
        code: 1142,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    }),
    unterminatedReplacementIdentifier: () => ({
        message: `Unterminated replacement identifier`,
        code: 1143,
        severity: vscode_languageserver_1.DiagnosticSeverity.Error
    })
};
exports.DiagnosticCodeMap = {};
exports.diagnosticCodes = [];
for (let key in exports.DiagnosticMessages) {
    exports.diagnosticCodes.push(exports.DiagnosticMessages[key]().code);
    exports.DiagnosticCodeMap[key] = exports.DiagnosticMessages[key]().code;
}
//# sourceMappingURL=DiagnosticMessages.js.map
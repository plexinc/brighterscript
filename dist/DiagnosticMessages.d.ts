import type { Position } from 'vscode-languageserver';
import { DiagnosticSeverity } from 'vscode-languageserver';
import type { BsDiagnostic } from './interfaces';
import type { TokenKind } from './lexer/TokenKind';
/**
 * An object that keeps track of all possible error messages.
 */
export declare let DiagnosticMessages: {
    genericParserMessage: (message: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    /**
     *
     * @param name for local vars, it's the var name. for namespaced parts, it's the specific part that's unknown (`alpha.beta.charlie` would result in "cannot find name 'charlie')
     * @param fullName if a namespaced name, this is the full name `alpha.beta.charlie`, otherwise it's the same as `name`
     */
    cannotFindName: (name: string, fullName?: string) => {
        message: string;
        code: number;
        data: {
            name: string;
            fullName: string;
        };
        severity: 1;
    };
    mismatchArgumentCount: (expectedCount: number | string, actualCount: number) => {
        message: string;
        code: number;
        severity: 1;
    };
    duplicateFunctionImplementation: (functionName: string, scopeName: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    referencedFileDoesNotExist: () => {
        message: string;
        code: number;
        severity: 1;
    };
    xmlComponentMissingComponentDeclaration: () => {
        message: string;
        code: number;
        severity: 1;
    };
    xmlComponentMissingNameAttribute: () => {
        message: string;
        code: number;
        severity: 1;
    };
    xmlComponentMissingExtendsAttribute: () => {
        message: string;
        code: number;
        severity: 2;
    };
    xmlGenericParseError: (message: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    unnecessaryScriptImportInChildFromParent: (parentComponentName: string) => {
        message: string;
        code: number;
        severity: 2;
    };
    overridesAncestorFunction: (callableName: string, currentScopeName: string, parentFilePath: string, parentScopeName: string) => {
        message: string;
        code: number;
        severity: 4;
    };
    localVarFunctionShadowsParentFunction: (scopeName: 'stdlib' | 'scope') => {
        message: string;
        code: number;
        severity: 2;
    };
    scriptImportCaseMismatch: (correctFilePath: string) => {
        message: string;
        code: number;
        severity: 2;
    };
    fileNotReferencedByAnyOtherFile: () => {
        message: string;
        code: number;
        severity: 2;
    };
    unknownDiagnosticCode: (theUnknownCode: number) => {
        message: string;
        code: number;
        severity: 2;
    };
    scriptSrcCannotBeEmpty: () => {
        message: string;
        code: number;
        severity: 1;
    };
    expectedIdentifierAfterKeyword: (keywordText: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    missingCallableKeyword: () => {
        message: string;
        code: number;
        severity: 1;
    };
    expectedValidTypeToFollowAsKeyword: () => {
        message: string;
        code: number;
        severity: 1;
    };
    bsFeatureNotSupportedInBrsFiles: (featureName: any) => {
        message: string;
        code: number;
        severity: 1;
    };
    brsConfigJsonIsDeprecated: () => {
        message: string;
        code: number;
        severity: 2;
    };
    bsConfigJsonHasSyntaxErrors: (message: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    namespacedClassCannotShareNamewithNonNamespacedClass: (nonNamespacedClassName: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    cannotUseOverrideKeywordOnConstructorFunction: () => {
        message: string;
        code: number;
        severity: 1;
    };
    importStatementMustBeDeclaredAtTopOfFile: () => {
        message: string;
        code: number;
        severity: 1;
    };
    methodDoesNotExistOnType: (methodName: string, className: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    duplicateIdentifier: (memberName: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    missingOverrideKeyword: (ancestorClassName: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    duplicateClassDeclaration: (scopeName: string, className: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    classCouldNotBeFound: (className: string, scopeName: string) => {
        message: string;
        code: number;
        severity: 1;
        data: {
            className: string;
        };
    };
    expectedClassFieldIdentifier: () => {
        message: string;
        code: number;
        severity: 1;
    };
    expressionIsNotConstructable: (expressionType: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    expectedKeyword: (kind: TokenKind) => {
        message: string;
        code: number;
        severity: 1;
    };
    expectedLeftParenAfterCallable: (callableType: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    expectedNameAfterCallableKeyword: (callableType: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    expectedLeftParenAfterCallableName: (callableType: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    tooManyCallableParameters: (actual: number, max: number) => {
        message: string;
        code: number;
        severity: 1;
    };
    invalidFunctionReturnType: (typeText: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    requiredParameterMayNotFollowOptionalParameter: (parameterName: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    expectedNewlineOrColon: () => {
        message: string;
        code: number;
        severity: 1;
    };
    functionNameCannotEndWithTypeDesignator: (callableType: string, name: string, designator: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    callableBlockMissingEndKeyword: (callableType: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    mismatchedEndCallableKeyword: (expectedCallableType: string, actualCallableType: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    expectedParameterNameButFound: (text: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    functionParameterTypeIsInvalid: (parameterName: string, typeText: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    cannotUseReservedWordAsIdentifier: (name: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    expectedOperatorAfterIdentifier: (operators: TokenKind[], name: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    expectedInlineIfStatement: () => {
        message: string;
        code: number;
        severity: 1;
    };
    expectedFinalNewline: () => {
        message: string;
        code: number;
        severity: 1;
    };
    couldNotFindMatchingEndKeyword: (keyword: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    expectedCatchBlockInTryCatch: () => {
        message: string;
        code: number;
        severity: 1;
    };
    expectedEndForOrNextToTerminateForLoop: () => {
        message: string;
        code: number;
        severity: 1;
    };
    expectedInAfterForEach: (name: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    expectedExpressionAfterForEachIn: () => {
        message: string;
        code: number;
        severity: 1;
    };
    unexpectedColonBeforeIfStatement: () => {
        message: string;
        code: number;
        severity: 1;
    };
    expectedStringLiteralAfterKeyword: (keyword: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    keywordMustBeDeclaredAtRootLevel: (keyword: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    libraryStatementMustBeDeclaredAtTopOfFile: () => {
        message: string;
        code: number;
        severity: 1;
    };
    expectedEndIfElseIfOrElseToTerminateThenBlock: () => {
        message: string;
        code: number;
        severity: 1;
    };
    expectedEndTryToTerminateTryCatch: () => {
        message: string;
        code: number;
        severity: 1;
    };
    expectedEndIfToCloseIfStatement: (startingPosition: Position) => {
        message: string;
        code: number;
        severity: 1;
    };
    expectedStatementToFollowConditionalCondition: (conditionType: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    expectedStatementToFollowElse: () => {
        message: string;
        code: number;
        severity: 1;
    };
    consecutiveIncrementDecrementOperatorsAreNotAllowed: () => {
        message: string;
        code: number;
        severity: 1;
    };
    incrementDecrementOperatorsAreNotAllowedAsResultOfFunctionCall: () => {
        message: string;
        code: number;
        severity: 1;
    };
    xmlUnexpectedTag: (tagName: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    expectedStatementOrFunctionCallButReceivedExpression: (expressionType?: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    xmlFunctionNotFound: (name: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    xmlInvalidFieldType: (name: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    xmlUnexpectedChildren: (tagName: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    xmlTagMissingAttribute: (tagName: string, attrName: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    expectedLabelIdentifierAfterGotoKeyword: () => {
        message: string;
        code: number;
        severity: 1;
    };
    expectedRightSquareBraceAfterArrayOrObjectIndex: () => {
        message: string;
        code: number;
        severity: 1;
    };
    expectedPropertyNameAfterPeriod: () => {
        message: string;
        code: number;
        severity: 1;
    };
    tooManyCallableArguments: (actual: number, max: number) => {
        message: string;
        code: number;
        severity: 1;
    };
    expectedRightParenAfterFunctionCallArguments: () => {
        message: string;
        code: number;
        severity: 1;
    };
    unmatchedLeftParenAfterExpression: () => {
        message: string;
        code: number;
        severity: 1;
    };
    unmatchedLeftSquareBraceAfterArrayLiteral: () => {
        message: string;
        code: number;
        severity: 1;
    };
    unexpectedAAKey: () => {
        message: string;
        code: number;
        severity: 1;
    };
    expectedColonBetweenAAKeyAndvalue: () => {
        message: string;
        code: number;
        severity: 1;
    };
    unmatchedLeftCurlyAfterAALiteral: () => {
        message: string;
        code: number;
        severity: 1;
    };
    unexpectedToken: (text: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    /**
     * Used in the lexer anytime we encounter an unsupported character
     */
    unexpectedCharacter: (text: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    unterminatedStringAtEndOfLine: () => {
        message: string;
        code: number;
        severity: 1;
    };
    unterminatedStringAtEndOfFile: () => {
        message: string;
        code: number;
        severity: 1;
    };
    fractionalHexLiteralsAreNotSupported: () => {
        message: string;
        code: number;
        severity: 1;
    };
    unexpectedConditionalCompilationString: () => {
        message: string;
        code: number;
        severity: 1;
    };
    duplicateConstDeclaration: (name: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    constAliasDoesNotExist: (name: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    invalidHashConstValue: () => {
        message: string;
        code: number;
        severity: 1;
    };
    referencedConstDoesNotExist: () => {
        message: string;
        code: number;
        severity: 1;
    };
    invalidHashIfValue: () => {
        message: string;
        code: number;
        severity: 1;
    };
    hashError: (message: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    expectedEqualAfterConstName: () => {
        message: string;
        code: number;
        severity: 1;
    };
    expectedHashElseIfToCloseHashIf: (startingLine: number) => {
        message: string;
        code: number;
        severity: 1;
    };
    constNameCannotBeReservedWord: () => {
        message: string;
        code: number;
        severity: 1;
    };
    expectedIdentifier: () => {
        message: string;
        code: number;
        severity: 1;
    };
    expectedAttributeNameAfterAtSymbol: () => {
        message: string;
        code: number;
        severity: 1;
    };
    childFieldTypeNotAssignableToBaseProperty: (childTypeName: string, baseTypeName: string, fieldName: string, childFieldType: string, parentFieldType: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    classChildMemberDifferentMemberTypeThanAncestor: (memberType: string, parentMemberType: string, parentClassName: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    classConstructorMissingSuperCall: () => {
        message: string;
        code: number;
        severity: 1;
    };
    classConstructorIllegalUseOfMBeforeSuperCall: () => {
        message: string;
        code: number;
        severity: 1;
    };
    classFieldCannotBeOverridden: () => {
        message: string;
        code: number;
        severity: 1;
    };
    unusedAnnotation: () => {
        message: string;
        code: number;
        severity: 1;
    };
    localVarShadowedByScopedFunction: () => {
        message: string;
        code: number;
        severity: 1;
    };
    scopeFunctionShadowedByBuiltInFunction: () => {
        message: string;
        code: number;
        severity: 1;
    };
    localVarSameNameAsClass: (className: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    unnecessaryCodebehindScriptImport: () => {
        message: string;
        code: number;
        severity: 2;
    };
    expectedOpenParenToFollowCallfuncIdentifier: () => {
        message: string;
        code: number;
        severity: 1;
    };
    expectedToken: (...tokenKinds: string[]) => {
        message: string;
        code: number;
        severity: 1;
    };
    parameterMayNotHaveSameNameAsNamespace: (paramName: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    variableMayNotHaveSameNameAsNamespace: (variableName: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    unterminatedTemplateStringAtEndOfFile: () => {
        message: string;
        code: number;
        severity: 1;
    };
    unterminatedTemplateExpression: () => {
        message: string;
        code: number;
        severity: 1;
    };
    duplicateComponentName: (componentName: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    functionCannotHaveSameNameAsClass: (className: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    missingExceptionVarToFollowCatch: () => {
        message: string;
        code: number;
        severity: 1;
    };
    missingExceptionExpressionAfterThrowKeyword: () => {
        message: string;
        code: number;
        severity: 1;
    };
    missingLeftSquareBracketAfterDimIdentifier: () => {
        message: string;
        code: number;
        severity: 1;
    };
    missingRightSquareBracketAfterDimIdentifier: () => {
        message: string;
        code: number;
        severity: 1;
    };
    missingExpressionsInDimStatement: () => {
        message: string;
        code: number;
        severity: 1;
    };
    mismatchedOverriddenMemberVisibility: (childClassName: string, memberName: string, childAccessModifier: string, ancestorAccessModifier: string, ancestorClassName: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    cannotFindType: (typeName: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    enumValueMustBeType: (expectedType: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    enumValueIsRequired: (expectedType: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    unknownEnumValue: (name: string, enumName: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    duplicateEnumDeclaration: (scopeName: string, enumName: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    unknownRoSGNode: (nodeName: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    unknownBrightScriptComponent: (componentName: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    mismatchCreateObjectArgumentCount: (componentName: string, allowedArgCounts: number[], actualCount: number) => {
        message: string;
        code: number;
        severity: 1;
    };
    deprecatedBrightScriptComponent: (componentName: string, deprecatedDescription?: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    circularReferenceDetected: (items: string[], scopeName: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    unexpectedStatementOutsideFunction: () => {
        message: string;
        code: number;
        severity: 1;
    };
    detectedTooDeepFileSource: (numberOfParentDirectories: number) => {
        message: string;
        code: number;
        severity: 1;
    };
    illegalContinueStatement: () => {
        message: string;
        code: number;
        severity: 1;
    };
    keywordMustBeDeclaredAtNamespaceLevel: (keyword: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    itemCannotBeUsedAsVariable: (itemType: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    callfuncHasToManyArgs: (numberOfArgs: number) => {
        message: string;
        code: number;
        severity: 1;
    };
    noOptionalChainingInLeftHandSideOfAssignment: () => {
        message: string;
        code: number;
        severity: 1;
    };
    /**
     * @param name for function calls where we can't find the name of the function
     * @param fullName if a namespaced name, this is the full name `alpha.beta.charlie`, otherwise it's the same as `name`
     */
    cannotFindFunction: (name: string, fullName?: string) => {
        message: string;
        code: number;
        data: {
            name: string;
            fullName: string;
        };
        severity: 1;
    };
    voidFunctionMayNotReturnValue: (functionType?: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    nonVoidFunctionMustReturnValue: (functionType?: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    propAccessNotPermittedAfterFunctionCallInExpressionStatement: (accessDescription: string) => {
        message: string;
        code: number;
        severity: 1;
    };
    unterminatedReplacementIdentifier: () => {
        message: string;
        code: number;
        severity: 1;
    };
};
export declare const DiagnosticCodeMap: Record<"genericParserMessage" | "cannotFindName" | "mismatchArgumentCount" | "duplicateFunctionImplementation" | "referencedFileDoesNotExist" | "xmlComponentMissingComponentDeclaration" | "xmlComponentMissingNameAttribute" | "xmlComponentMissingExtendsAttribute" | "xmlGenericParseError" | "unnecessaryScriptImportInChildFromParent" | "overridesAncestorFunction" | "localVarFunctionShadowsParentFunction" | "scriptImportCaseMismatch" | "fileNotReferencedByAnyOtherFile" | "unknownDiagnosticCode" | "scriptSrcCannotBeEmpty" | "expectedIdentifierAfterKeyword" | "missingCallableKeyword" | "expectedValidTypeToFollowAsKeyword" | "bsFeatureNotSupportedInBrsFiles" | "brsConfigJsonIsDeprecated" | "bsConfigJsonHasSyntaxErrors" | "namespacedClassCannotShareNamewithNonNamespacedClass" | "cannotUseOverrideKeywordOnConstructorFunction" | "importStatementMustBeDeclaredAtTopOfFile" | "methodDoesNotExistOnType" | "duplicateIdentifier" | "missingOverrideKeyword" | "duplicateClassDeclaration" | "classCouldNotBeFound" | "expectedClassFieldIdentifier" | "expressionIsNotConstructable" | "expectedKeyword" | "expectedLeftParenAfterCallable" | "expectedNameAfterCallableKeyword" | "expectedLeftParenAfterCallableName" | "tooManyCallableParameters" | "invalidFunctionReturnType" | "requiredParameterMayNotFollowOptionalParameter" | "expectedNewlineOrColon" | "functionNameCannotEndWithTypeDesignator" | "callableBlockMissingEndKeyword" | "mismatchedEndCallableKeyword" | "expectedParameterNameButFound" | "functionParameterTypeIsInvalid" | "cannotUseReservedWordAsIdentifier" | "expectedOperatorAfterIdentifier" | "expectedInlineIfStatement" | "expectedFinalNewline" | "couldNotFindMatchingEndKeyword" | "expectedCatchBlockInTryCatch" | "expectedEndForOrNextToTerminateForLoop" | "expectedInAfterForEach" | "expectedExpressionAfterForEachIn" | "unexpectedColonBeforeIfStatement" | "expectedStringLiteralAfterKeyword" | "keywordMustBeDeclaredAtRootLevel" | "libraryStatementMustBeDeclaredAtTopOfFile" | "expectedEndIfElseIfOrElseToTerminateThenBlock" | "expectedEndTryToTerminateTryCatch" | "expectedEndIfToCloseIfStatement" | "expectedStatementToFollowConditionalCondition" | "expectedStatementToFollowElse" | "consecutiveIncrementDecrementOperatorsAreNotAllowed" | "incrementDecrementOperatorsAreNotAllowedAsResultOfFunctionCall" | "xmlUnexpectedTag" | "expectedStatementOrFunctionCallButReceivedExpression" | "xmlFunctionNotFound" | "xmlInvalidFieldType" | "xmlUnexpectedChildren" | "xmlTagMissingAttribute" | "expectedLabelIdentifierAfterGotoKeyword" | "expectedRightSquareBraceAfterArrayOrObjectIndex" | "expectedPropertyNameAfterPeriod" | "tooManyCallableArguments" | "expectedRightParenAfterFunctionCallArguments" | "unmatchedLeftParenAfterExpression" | "unmatchedLeftSquareBraceAfterArrayLiteral" | "unexpectedAAKey" | "expectedColonBetweenAAKeyAndvalue" | "unmatchedLeftCurlyAfterAALiteral" | "unexpectedToken" | "unexpectedCharacter" | "unterminatedStringAtEndOfLine" | "unterminatedStringAtEndOfFile" | "fractionalHexLiteralsAreNotSupported" | "unexpectedConditionalCompilationString" | "duplicateConstDeclaration" | "constAliasDoesNotExist" | "invalidHashConstValue" | "referencedConstDoesNotExist" | "invalidHashIfValue" | "hashError" | "expectedEqualAfterConstName" | "expectedHashElseIfToCloseHashIf" | "constNameCannotBeReservedWord" | "expectedIdentifier" | "expectedAttributeNameAfterAtSymbol" | "childFieldTypeNotAssignableToBaseProperty" | "classChildMemberDifferentMemberTypeThanAncestor" | "classConstructorMissingSuperCall" | "classConstructorIllegalUseOfMBeforeSuperCall" | "classFieldCannotBeOverridden" | "unusedAnnotation" | "localVarShadowedByScopedFunction" | "scopeFunctionShadowedByBuiltInFunction" | "localVarSameNameAsClass" | "unnecessaryCodebehindScriptImport" | "expectedOpenParenToFollowCallfuncIdentifier" | "expectedToken" | "parameterMayNotHaveSameNameAsNamespace" | "variableMayNotHaveSameNameAsNamespace" | "unterminatedTemplateStringAtEndOfFile" | "unterminatedTemplateExpression" | "duplicateComponentName" | "functionCannotHaveSameNameAsClass" | "missingExceptionVarToFollowCatch" | "missingExceptionExpressionAfterThrowKeyword" | "missingLeftSquareBracketAfterDimIdentifier" | "missingRightSquareBracketAfterDimIdentifier" | "missingExpressionsInDimStatement" | "mismatchedOverriddenMemberVisibility" | "cannotFindType" | "enumValueMustBeType" | "enumValueIsRequired" | "unknownEnumValue" | "duplicateEnumDeclaration" | "unknownRoSGNode" | "unknownBrightScriptComponent" | "mismatchCreateObjectArgumentCount" | "deprecatedBrightScriptComponent" | "circularReferenceDetected" | "unexpectedStatementOutsideFunction" | "detectedTooDeepFileSource" | "illegalContinueStatement" | "keywordMustBeDeclaredAtNamespaceLevel" | "itemCannotBeUsedAsVariable" | "callfuncHasToManyArgs" | "noOptionalChainingInLeftHandSideOfAssignment" | "cannotFindFunction" | "voidFunctionMayNotReturnValue" | "nonVoidFunctionMustReturnValue" | "propAccessNotPermittedAfterFunctionCallInExpressionStatement" | "unterminatedReplacementIdentifier", number>;
export declare let diagnosticCodes: number[];
export interface DiagnosticInfo {
    message: string;
    code: number;
    severity: DiagnosticSeverity;
}
/**
 * Provides easy type support for the return value of any DiagnosticMessage function.
 * The second type parameter is optional, but allows plugins to pass in their own
 * DiagnosticMessages-like object in order to get the same type support
 */
export declare type DiagnosticMessageType<K extends keyof D, D extends Record<string, (...args: any) => any> = typeof DiagnosticMessages> = ReturnType<D[K]> & Pick<BsDiagnostic, 'range' | 'file' | 'relatedInformation' | 'tags'>;

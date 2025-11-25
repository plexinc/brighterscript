"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.References = exports.ParseMode = exports.Parser = void 0;
const Token_1 = require("../lexer/Token");
const Lexer_1 = require("../lexer/Lexer");
const TokenKind_1 = require("../lexer/TokenKind");
const Statement_1 = require("./Statement");
const DiagnosticMessages_1 = require("../DiagnosticMessages");
const util_1 = require("../util");
const Expression_1 = require("./Expression");
const logging_1 = require("../logging");
const reflection_1 = require("../astUtils/reflection");
const visitors_1 = require("../astUtils/visitors");
const creators_1 = require("../astUtils/creators");
const Cache_1 = require("../Cache");
const SymbolTable_1 = require("../SymbolTable");
class Parser {
    constructor() {
        /**
         * The array of tokens passed to `parse()`
         */
        this.tokens = [];
        /**
         * The list of statements for the parsed file
         */
        this.ast = new Statement_1.Body([]);
        this._references = new References();
        this.globalTerminators = [];
        /**
         * An array of CallExpression for the current function body
         */
        this.callExpressions = [];
    }
    get statements() {
        return this.ast.statements;
    }
    /**
     * The top-level symbol table for the body of this file.
     */
    get symbolTable() {
        return this.ast.symbolTable;
    }
    /**
     * References for significant statements/expressions in the parser.
     * These are initially extracted during parse-time to improve performance, but will also be dynamically regenerated if need be.
     *
     * If a plugin modifies the AST, then the plugin should call Parser#invalidateReferences() to force this object to refresh
     */
    get references() {
        //build the references object if it's missing.
        if (!this._references) {
            this.findReferences();
        }
        return this._references;
    }
    /**
     * Invalidates (clears) the references collection. This should be called anytime the AST has been manipulated.
     */
    invalidateReferences() {
        this._references = undefined;
    }
    addPropertyHints(item) {
        if ((0, Token_1.isToken)(item)) {
            const name = item.text;
            this._references.propertyHints[name.toLowerCase()] = name;
        }
        else {
            for (const member of item.elements) {
                if (!(0, reflection_1.isCommentStatement)(member)) {
                    const name = member.keyToken.text;
                    if (!name.startsWith('"')) {
                        this._references.propertyHints[name.toLowerCase()] = name;
                    }
                }
            }
        }
    }
    /**
     * Get the currently active global terminators
     */
    peekGlobalTerminators() {
        var _a;
        return (_a = this.globalTerminators[this.globalTerminators.length - 1]) !== null && _a !== void 0 ? _a : [];
    }
    /**
     * Static wrapper around creating a new parser and parsing a list of tokens
     */
    static parse(toParse, options) {
        return new Parser().parse(toParse, options);
    }
    /**
     * Parses an array of `Token`s into an abstract syntax tree
     * @param toParse the array of tokens to parse. May not contain any whitespace tokens
     * @returns the same instance of the parser which contains the diagnostics and statements
     */
    parse(toParse, options) {
        var _a;
        this.logger = (_a = options === null || options === void 0 ? void 0 : options.logger) !== null && _a !== void 0 ? _a : (0, logging_1.createLogger)();
        options = this.sanitizeParseOptions(options);
        this.options = options;
        let tokens;
        if (typeof toParse === 'string') {
            tokens = Lexer_1.Lexer.scan(toParse, { trackLocations: options.trackLocations }).tokens;
        }
        else {
            tokens = toParse;
        }
        this.tokens = tokens;
        this.allowedLocalIdentifiers = [
            ...TokenKind_1.AllowedLocalIdentifiers,
            //when in plain brightscript mode, the BrighterScript source literals can be used as regular variables
            ...(this.options.mode === ParseMode.BrightScript ? TokenKind_1.BrighterScriptSourceLiterals : [])
        ];
        this.current = 0;
        this.diagnostics = [];
        this.namespaceAndFunctionDepth = 0;
        this.pendingAnnotations = [];
        this.ast = this.body();
        //now that we've built the AST, link every node to its parent
        this.ast.link();
        return this;
    }
    body() {
        const parentAnnotations = this.enterAnnotationBlock();
        let body = new Statement_1.Body([]);
        if (this.tokens.length > 0) {
            this.consumeStatementSeparators(true);
            try {
                while (
                //not at end of tokens
                !this.isAtEnd() &&
                    //the next token is not one of the end terminators
                    !this.checkAny(...this.peekGlobalTerminators())) {
                    let dec = this.declaration();
                    if (dec) {
                        if (!(0, reflection_1.isAnnotationExpression)(dec)) {
                            this.consumePendingAnnotations(dec);
                            body.statements.push(dec);
                            //ensure statement separator
                            this.consumeStatementSeparators(false);
                        }
                        else {
                            this.consumeStatementSeparators(true);
                        }
                    }
                }
            }
            catch (parseError) {
                //do nothing with the parse error for now. perhaps we can remove this?
                console.error(parseError);
            }
        }
        this.exitAnnotationBlock(parentAnnotations);
        return body;
    }
    sanitizeParseOptions(options) {
        var _a, _b;
        options !== null && options !== void 0 ? options : (options = {});
        (_a = options.mode) !== null && _a !== void 0 ? _a : (options.mode = ParseMode.BrightScript);
        (_b = options.trackLocations) !== null && _b !== void 0 ? _b : (options.trackLocations = true);
        return options;
    }
    /**
     * Determine if the parser is currently parsing tokens at the root level.
     */
    isAtRootLevel() {
        return this.namespaceAndFunctionDepth === 0;
    }
    /**
     * Throws an error if the input file type is not BrighterScript
     */
    warnIfNotBrighterScriptMode(featureName) {
        if (this.options.mode !== ParseMode.BrighterScript) {
            let diagnostic = Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.bsFeatureNotSupportedInBrsFiles(featureName)), { range: this.peek().range });
            this.diagnostics.push(diagnostic);
        }
    }
    /**
     * Throws an exception using the last diagnostic message
     */
    lastDiagnosticAsError() {
        var _a, _b;
        let error = new Error((_b = (_a = this.diagnostics[this.diagnostics.length - 1]) === null || _a === void 0 ? void 0 : _a.message) !== null && _b !== void 0 ? _b : 'Unknown error');
        error.isDiagnostic = true;
        return error;
    }
    declaration() {
        try {
            if (this.checkAny(TokenKind_1.TokenKind.Sub, TokenKind_1.TokenKind.Function)) {
                return this.functionDeclaration(false);
            }
            if (this.checkLibrary()) {
                return this.libraryStatement();
            }
            if (this.check(TokenKind_1.TokenKind.Const) && this.checkAnyNext(TokenKind_1.TokenKind.Identifier, ...this.allowedLocalIdentifiers)) {
                return this.constDeclaration();
            }
            if (this.check(TokenKind_1.TokenKind.At) && this.checkNext(TokenKind_1.TokenKind.Identifier)) {
                return this.annotationExpression();
            }
            if (this.check(TokenKind_1.TokenKind.Comment)) {
                return this.commentStatement();
            }
            //catch certain global terminators to prevent unnecessary lookahead (i.e. like `end namespace`, no need to continue)
            if (this.checkAny(...this.peekGlobalTerminators())) {
                return;
            }
            return this.statement();
        }
        catch (error) {
            //if the error is not a diagnostic, then log the error for debugging purposes
            if (!error.isDiagnostic) {
                this.logger.error(error);
            }
            this.synchronize();
        }
    }
    /**
     * Try to get an identifier. If not found, add diagnostic and return undefined
     */
    tryIdentifier(...additionalTokenKinds) {
        const identifier = this.tryConsume(DiagnosticMessages_1.DiagnosticMessages.expectedIdentifier(), TokenKind_1.TokenKind.Identifier, ...additionalTokenKinds);
        if (identifier) {
            // force the name into an identifier so the AST makes some sense
            identifier.kind = TokenKind_1.TokenKind.Identifier;
            return identifier;
        }
    }
    identifier(...additionalTokenKinds) {
        const identifier = this.consume(DiagnosticMessages_1.DiagnosticMessages.expectedIdentifier(), TokenKind_1.TokenKind.Identifier, ...additionalTokenKinds);
        // force the name into an identifier so the AST makes some sense
        identifier.kind = TokenKind_1.TokenKind.Identifier;
        return identifier;
    }
    enumMemberStatement() {
        const statement = new Statement_1.EnumMemberStatement({});
        statement.tokens.name = this.consume(DiagnosticMessages_1.DiagnosticMessages.expectedClassFieldIdentifier(), TokenKind_1.TokenKind.Identifier, ...TokenKind_1.AllowedProperties);
        //look for `= SOME_EXPRESSION`
        if (this.check(TokenKind_1.TokenKind.Equal)) {
            statement.tokens.equal = this.advance();
            statement.value = this.expression();
        }
        return statement;
    }
    /**
     * Create a new InterfaceMethodStatement. This should only be called from within `interfaceDeclaration`
     */
    interfaceFieldStatement(optionalKeyword) {
        const name = this.identifier(...TokenKind_1.AllowedProperties);
        let asToken;
        let typeToken;
        let type;
        if (this.check(TokenKind_1.TokenKind.As)) {
            asToken = this.consumeToken(TokenKind_1.TokenKind.As);
            typeToken = this.typeToken();
            type = util_1.util.tokenToBscType(typeToken);
        }
        if (!type) {
            this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.functionParameterTypeIsInvalid(name.text, typeToken.text)), { range: typeToken.range }));
            throw this.lastDiagnosticAsError();
        }
        return new Statement_1.InterfaceFieldStatement(name, asToken, typeToken, type, optionalKeyword);
    }
    /**
     * Create a new InterfaceMethodStatement. This should only be called from within `interfaceDeclaration()`
     */
    interfaceMethodStatement(optionalKeyword) {
        const functionType = this.advance();
        const name = this.identifier(...TokenKind_1.AllowedProperties);
        const leftParen = this.consume(DiagnosticMessages_1.DiagnosticMessages.expectedToken(TokenKind_1.TokenKind.LeftParen), TokenKind_1.TokenKind.LeftParen);
        let params = [];
        if (!this.check(TokenKind_1.TokenKind.RightParen)) {
            do {
                if (params.length >= Expression_1.CallExpression.MaximumArguments) {
                    this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.tooManyCallableParameters(params.length, Expression_1.CallExpression.MaximumArguments)), { range: this.peek().range }));
                }
                params.push(this.functionParameter());
            } while (this.match(TokenKind_1.TokenKind.Comma));
        }
        const rightParen = this.consumeToken(TokenKind_1.TokenKind.RightParen);
        let asToken = null;
        let returnTypeToken = null;
        if (this.check(TokenKind_1.TokenKind.As)) {
            asToken = this.advance();
            returnTypeToken = this.typeToken();
            const returnType = util_1.util.tokenToBscType(returnTypeToken);
            if (!returnType) {
                this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.functionParameterTypeIsInvalid(name.text, returnTypeToken.text)), { range: returnTypeToken.range }));
                throw this.lastDiagnosticAsError();
            }
        }
        return new Statement_1.InterfaceMethodStatement(functionType, name, leftParen, params, rightParen, asToken, returnTypeToken, util_1.util.tokenToBscType(returnTypeToken), optionalKeyword);
    }
    interfaceDeclaration() {
        this.warnIfNotBrighterScriptMode('interface declarations');
        const parentAnnotations = this.enterAnnotationBlock();
        const interfaceToken = this.consume(DiagnosticMessages_1.DiagnosticMessages.expectedKeyword(TokenKind_1.TokenKind.Interface), TokenKind_1.TokenKind.Interface);
        const nameToken = this.identifier(...this.allowedLocalIdentifiers);
        let extendsToken;
        let parentInterfaceName;
        if (this.peek().text.toLowerCase() === 'extends') {
            extendsToken = this.advance();
            parentInterfaceName = this.getNamespacedVariableNameExpression();
        }
        this.consumeStatementSeparators();
        //gather up all interface members (Fields, Methods)
        let body = [];
        while (this.checkAny(TokenKind_1.TokenKind.Comment, TokenKind_1.TokenKind.Identifier, TokenKind_1.TokenKind.At, ...TokenKind_1.AllowedProperties)) {
            try {
                //break out of this loop if we encountered the `EndInterface` token not followed by `as`
                if (this.check(TokenKind_1.TokenKind.EndInterface) && !this.checkNext(TokenKind_1.TokenKind.As)) {
                    break;
                }
                let decl;
                //collect leading annotations
                if (this.check(TokenKind_1.TokenKind.At)) {
                    this.annotationExpression();
                }
                const optionalKeyword = this.consumeTokenIf(TokenKind_1.TokenKind.Optional);
                //fields
                if (this.checkAny(TokenKind_1.TokenKind.Identifier, ...TokenKind_1.AllowedProperties) && this.checkAnyNext(TokenKind_1.TokenKind.As, TokenKind_1.TokenKind.Newline, TokenKind_1.TokenKind.Comment)) {
                    decl = this.interfaceFieldStatement(optionalKeyword);
                    //field with name = 'optional'
                }
                else if (optionalKeyword && this.checkAny(TokenKind_1.TokenKind.As, TokenKind_1.TokenKind.Newline, TokenKind_1.TokenKind.Comment)) {
                    //rewind one place, so that 'optional' is the field name
                    this.current--;
                    decl = this.interfaceFieldStatement();
                    //methods (function/sub keyword followed by opening paren)
                }
                else if (this.checkAny(TokenKind_1.TokenKind.Function, TokenKind_1.TokenKind.Sub) && this.checkAnyNext(TokenKind_1.TokenKind.Identifier, ...TokenKind_1.AllowedProperties)) {
                    decl = this.interfaceMethodStatement(optionalKeyword);
                    //comments
                }
                else if (this.check(TokenKind_1.TokenKind.Comment)) {
                    decl = this.commentStatement();
                }
                if (decl) {
                    this.consumePendingAnnotations(decl);
                    body.push(decl);
                }
                else {
                    //we didn't find a declaration...flag tokens until next line
                    this.flagUntil(TokenKind_1.TokenKind.Newline, TokenKind_1.TokenKind.Colon, TokenKind_1.TokenKind.Eof);
                }
            }
            catch (e) {
                //throw out any failed members and move on to the next line
                this.flagUntil(TokenKind_1.TokenKind.Newline, TokenKind_1.TokenKind.Colon, TokenKind_1.TokenKind.Eof);
            }
            //ensure statement separator
            this.consumeStatementSeparators();
        }
        //consume the final `end interface` token
        const endInterfaceToken = this.consumeToken(TokenKind_1.TokenKind.EndInterface);
        const statement = new Statement_1.InterfaceStatement(interfaceToken, nameToken, extendsToken, parentInterfaceName, body, endInterfaceToken);
        this._references.interfaceStatements.push(statement);
        this.exitAnnotationBlock(parentAnnotations);
        return statement;
    }
    enumDeclaration() {
        const result = new Statement_1.EnumStatement({}, []);
        this.warnIfNotBrighterScriptMode('enum declarations');
        const parentAnnotations = this.enterAnnotationBlock();
        result.tokens.enum = this.consume(DiagnosticMessages_1.DiagnosticMessages.expectedKeyword(TokenKind_1.TokenKind.Enum), TokenKind_1.TokenKind.Enum);
        result.tokens.name = this.tryIdentifier(...this.allowedLocalIdentifiers);
        this.consumeStatementSeparators();
        //gather up all members
        while (this.checkAny(TokenKind_1.TokenKind.Comment, TokenKind_1.TokenKind.Identifier, TokenKind_1.TokenKind.At, ...TokenKind_1.AllowedProperties)) {
            try {
                let decl;
                //collect leading annotations
                if (this.check(TokenKind_1.TokenKind.At)) {
                    this.annotationExpression();
                }
                //members
                if (this.checkAny(TokenKind_1.TokenKind.Identifier, ...TokenKind_1.AllowedProperties)) {
                    decl = this.enumMemberStatement();
                    //comments
                }
                else if (this.check(TokenKind_1.TokenKind.Comment)) {
                    decl = this.commentStatement();
                }
                if (decl) {
                    this.consumePendingAnnotations(decl);
                    result.body.push(decl);
                }
                else {
                    //we didn't find a declaration...flag tokens until next line
                    this.flagUntil(TokenKind_1.TokenKind.Newline, TokenKind_1.TokenKind.Colon, TokenKind_1.TokenKind.Eof);
                }
            }
            catch (e) {
                //throw out any failed members and move on to the next line
                this.flagUntil(TokenKind_1.TokenKind.Newline, TokenKind_1.TokenKind.Colon, TokenKind_1.TokenKind.Eof);
            }
            //ensure statement separator
            this.consumeStatementSeparators();
            //break out of this loop if we encountered the `EndEnum` token
            if (this.check(TokenKind_1.TokenKind.EndEnum)) {
                break;
            }
        }
        //consume the final `end interface` token
        result.tokens.endEnum = this.consumeToken(TokenKind_1.TokenKind.EndEnum);
        this._references.enumStatements.push(result);
        this.exitAnnotationBlock(parentAnnotations);
        return result;
    }
    /**
     * A BrighterScript class declaration
     */
    classDeclaration() {
        this.warnIfNotBrighterScriptMode('class declarations');
        const parentAnnotations = this.enterAnnotationBlock();
        let classKeyword = this.consume(DiagnosticMessages_1.DiagnosticMessages.expectedKeyword(TokenKind_1.TokenKind.Class), TokenKind_1.TokenKind.Class);
        let extendsKeyword;
        let parentClassName;
        //get the class name
        let className = this.tryConsume(DiagnosticMessages_1.DiagnosticMessages.expectedIdentifierAfterKeyword('class'), TokenKind_1.TokenKind.Identifier, ...this.allowedLocalIdentifiers);
        //see if the class inherits from parent
        if (this.peek().text.toLowerCase() === 'extends') {
            extendsKeyword = this.advance();
            parentClassName = this.getNamespacedVariableNameExpression();
        }
        //ensure statement separator
        this.consumeStatementSeparators();
        //gather up all class members (Fields, Methods)
        let body = [];
        while (this.checkAny(TokenKind_1.TokenKind.Public, TokenKind_1.TokenKind.Protected, TokenKind_1.TokenKind.Private, TokenKind_1.TokenKind.Function, TokenKind_1.TokenKind.Sub, TokenKind_1.TokenKind.Comment, TokenKind_1.TokenKind.Identifier, TokenKind_1.TokenKind.At, ...TokenKind_1.AllowedProperties)) {
            try {
                let decl;
                let accessModifier;
                if (this.check(TokenKind_1.TokenKind.At)) {
                    this.annotationExpression();
                }
                if (this.checkAny(TokenKind_1.TokenKind.Public, TokenKind_1.TokenKind.Protected, TokenKind_1.TokenKind.Private)) {
                    //use actual access modifier
                    accessModifier = this.advance();
                }
                let overrideKeyword;
                if (this.peek().text.toLowerCase() === 'override') {
                    overrideKeyword = this.advance();
                }
                //methods (function/sub keyword OR identifier followed by opening paren)
                if (this.checkAny(TokenKind_1.TokenKind.Function, TokenKind_1.TokenKind.Sub) || (this.checkAny(TokenKind_1.TokenKind.Identifier, ...TokenKind_1.AllowedProperties) && this.checkNext(TokenKind_1.TokenKind.LeftParen))) {
                    const funcDeclaration = this.functionDeclaration(false, false);
                    //remove this function from the lists because it's not a callable
                    const functionStatement = this._references.functionStatements.pop();
                    //if we have an overrides keyword AND this method is called 'new', that's not allowed
                    if (overrideKeyword && funcDeclaration.name.text.toLowerCase() === 'new') {
                        this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.cannotUseOverrideKeywordOnConstructorFunction()), { range: overrideKeyword.range }));
                    }
                    decl = new Statement_1.MethodStatement(accessModifier, funcDeclaration.name, funcDeclaration.func, overrideKeyword);
                    //refer to this statement as parent of the expression
                    functionStatement.func.functionStatement = decl;
                    //fields
                }
                else if (this.checkAny(TokenKind_1.TokenKind.Identifier, ...TokenKind_1.AllowedProperties)) {
                    decl = this.fieldDeclaration(accessModifier);
                    //class fields cannot be overridden
                    if (overrideKeyword) {
                        this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.classFieldCannotBeOverridden()), { range: overrideKeyword.range }));
                    }
                    //comments
                }
                else if (this.check(TokenKind_1.TokenKind.Comment)) {
                    decl = this.commentStatement();
                }
                if (decl) {
                    this.consumePendingAnnotations(decl);
                    body.push(decl);
                }
            }
            catch (e) {
                //throw out any failed members and move on to the next line
                this.flagUntil(TokenKind_1.TokenKind.Newline, TokenKind_1.TokenKind.Colon, TokenKind_1.TokenKind.Eof);
            }
            //ensure statement separator
            this.consumeStatementSeparators();
        }
        let endingKeyword = this.advance();
        if (endingKeyword.kind !== TokenKind_1.TokenKind.EndClass) {
            this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.couldNotFindMatchingEndKeyword('class')), { range: endingKeyword.range }));
        }
        const result = new Statement_1.ClassStatement(classKeyword, className, body, endingKeyword, extendsKeyword, parentClassName);
        this._references.classStatements.push(result);
        this.exitAnnotationBlock(parentAnnotations);
        return result;
    }
    fieldDeclaration(accessModifier) {
        let optionalKeyword = this.consumeTokenIf(TokenKind_1.TokenKind.Optional);
        if (this.checkAny(TokenKind_1.TokenKind.Identifier, ...TokenKind_1.AllowedProperties)) {
            if (this.check(TokenKind_1.TokenKind.As)) {
                if (this.checkAnyNext(TokenKind_1.TokenKind.Comment, TokenKind_1.TokenKind.Newline)) {
                    // as <EOL>
                    // `as` is the field name
                }
                else if (this.checkNext(TokenKind_1.TokenKind.As)) {
                    //  as as ____
                    // first `as` is the field name
                }
                else if (optionalKeyword) {
                    // optional as ____
                    // optional is the field name, `as` starts type
                    // rewind current token
                    optionalKeyword = null;
                    this.current--;
                }
            }
        }
        else {
            // no name after `optional` ... optional is the name
            // rewind current token
            optionalKeyword = null;
            this.current--;
        }
        let name = this.consume(DiagnosticMessages_1.DiagnosticMessages.expectedClassFieldIdentifier(), TokenKind_1.TokenKind.Identifier, ...TokenKind_1.AllowedProperties);
        let asToken;
        let fieldType;
        //look for `as SOME_TYPE`
        if (this.check(TokenKind_1.TokenKind.As)) {
            asToken = this.advance();
            fieldType = this.typeToken();
            //no field type specified
            if (!util_1.util.tokenToBscType(fieldType)) {
                this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.expectedValidTypeToFollowAsKeyword()), { range: this.peek().range }));
            }
        }
        let initialValue;
        let equal;
        //if there is a field initializer
        if (this.check(TokenKind_1.TokenKind.Equal)) {
            equal = this.advance();
            initialValue = this.expression();
        }
        return new Statement_1.FieldStatement(accessModifier, name, asToken, fieldType, equal, initialValue, optionalKeyword);
    }
    functionDeclaration(isAnonymous, checkIdentifier = true, onlyCallableAsMember = false) {
        var _a, _b;
        let previousCallExpressions = this.callExpressions;
        this.callExpressions = [];
        try {
            //track depth to help certain statements need to know if they are contained within a function body
            this.namespaceAndFunctionDepth++;
            let functionType;
            if (this.checkAny(TokenKind_1.TokenKind.Sub, TokenKind_1.TokenKind.Function)) {
                functionType = this.advance();
            }
            else {
                this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.missingCallableKeyword()), { range: this.peek().range }));
                functionType = {
                    isReserved: true,
                    kind: TokenKind_1.TokenKind.Function,
                    text: 'function',
                    //zero-length location means derived
                    range: {
                        start: this.peek().range.start,
                        end: this.peek().range.start
                    },
                    leadingWhitespace: ''
                };
            }
            let isSub = (functionType === null || functionType === void 0 ? void 0 : functionType.kind) === TokenKind_1.TokenKind.Sub;
            let functionTypeText = isSub ? 'sub' : 'function';
            let name;
            let leftParen;
            if (isAnonymous) {
                leftParen = this.consume(DiagnosticMessages_1.DiagnosticMessages.expectedLeftParenAfterCallable(functionTypeText), TokenKind_1.TokenKind.LeftParen);
            }
            else {
                name = this.consume(DiagnosticMessages_1.DiagnosticMessages.expectedNameAfterCallableKeyword(functionTypeText), TokenKind_1.TokenKind.Identifier, ...TokenKind_1.AllowedProperties);
                leftParen = this.consume(DiagnosticMessages_1.DiagnosticMessages.expectedLeftParenAfterCallableName(functionTypeText), TokenKind_1.TokenKind.LeftParen);
                //prevent functions from ending with type designators
                let lastChar = name.text[name.text.length - 1];
                if (['$', '%', '!', '#', '&'].includes(lastChar)) {
                    //don't throw this error; let the parser continue
                    this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.functionNameCannotEndWithTypeDesignator(functionTypeText, name.text, lastChar)), { range: name.range }));
                }
                //flag functions with keywords for names (only for standard functions)
                if (checkIdentifier && TokenKind_1.DisallowedFunctionIdentifiersText.has(name.text.toLowerCase())) {
                    this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.cannotUseReservedWordAsIdentifier(name.text)), { range: name.range }));
                }
            }
            let params = [];
            let asToken;
            let typeToken;
            if (!this.check(TokenKind_1.TokenKind.RightParen)) {
                do {
                    params.push(this.functionParameter());
                } while (this.match(TokenKind_1.TokenKind.Comma));
            }
            let rightParen = this.advance();
            if (this.check(TokenKind_1.TokenKind.As)) {
                asToken = this.advance();
                typeToken = this.typeToken();
                if (!util_1.util.tokenToBscType(typeToken, this.options.mode === ParseMode.BrighterScript)) {
                    this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.invalidFunctionReturnType((_a = typeToken.text) !== null && _a !== void 0 ? _a : '')), { range: typeToken.range }));
                }
            }
            params.reduce((haveFoundOptional, param) => {
                if (haveFoundOptional && !param.defaultValue) {
                    this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.requiredParameterMayNotFollowOptionalParameter(param.name.text)), { range: param.range }));
                }
                return haveFoundOptional || !!param.defaultValue;
            }, false);
            this.consumeStatementSeparators(true);
            let func = new Expression_1.FunctionExpression(params, undefined, //body
            functionType, undefined, //ending keyword
            leftParen, rightParen, asToken, typeToken);
            // add the function to the relevant symbol tables
            if (!onlyCallableAsMember && name) {
                const funcType = func.getFunctionType();
                funcType.setName(name.text);
            }
            this._references.functionExpressions.push(func);
            //support ending the function with `end sub` OR `end function`
            func.body = this.block();
            //if the parser was unable to produce a block, make an empty one so the AST makes some sense...
            if (!func.body) {
                func.body = new Statement_1.Block([], util_1.util.createRangeFromPositions(func.range.start, func.range.start));
            }
            func.body.symbolTable = new SymbolTable_1.SymbolTable(`Block: Function '${(_b = name === null || name === void 0 ? void 0 : name.text) !== null && _b !== void 0 ? _b : ''}'`, () => func.getSymbolTable());
            if (!func.body) {
                this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.callableBlockMissingEndKeyword(functionTypeText)), { range: this.peek().range }));
                throw this.lastDiagnosticAsError();
            }
            // consume 'end sub' or 'end function'
            func.end = this.advance();
            let expectedEndKind = isSub ? TokenKind_1.TokenKind.EndSub : TokenKind_1.TokenKind.EndFunction;
            //if `function` is ended with `end sub`, or `sub` is ended with `end function`, then
            //add an error but don't hard-fail so the AST can continue more gracefully
            if (func.end.kind !== expectedEndKind) {
                this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.mismatchedEndCallableKeyword(functionTypeText, func.end.text)), { range: func.end.range }));
            }
            func.callExpressions = this.callExpressions;
            if (isAnonymous) {
                return func;
            }
            else {
                let result = new Statement_1.FunctionStatement(name, func);
                func.symbolTable.name += `: '${name === null || name === void 0 ? void 0 : name.text}'`;
                func.functionStatement = result;
                this._references.functionStatements.push(result);
                return result;
            }
        }
        finally {
            this.namespaceAndFunctionDepth--;
            //restore the previous CallExpression list
            this.callExpressions = previousCallExpressions;
        }
    }
    functionParameter() {
        if (!this.checkAny(TokenKind_1.TokenKind.Identifier, ...this.allowedLocalIdentifiers)) {
            this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.expectedParameterNameButFound(this.peek().text)), { range: this.peek().range }));
            throw this.lastDiagnosticAsError();
        }
        let name = this.advance();
        // force the name into an identifier so the AST makes some sense
        name.kind = TokenKind_1.TokenKind.Identifier;
        //add diagnostic if name is a reserved word that cannot be used as an identifier
        if (TokenKind_1.DisallowedLocalIdentifiersText.has(name.text.toLowerCase())) {
            this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.cannotUseReservedWordAsIdentifier(name.text)), { range: name.range }));
        }
        let typeToken;
        let defaultValue;
        // parse argument default value
        if (this.match(TokenKind_1.TokenKind.Equal)) {
            // it seems any expression is allowed here -- including ones that operate on other arguments!
            defaultValue = this.expression(false);
        }
        let asToken = null;
        if (this.check(TokenKind_1.TokenKind.As)) {
            asToken = this.advance();
            typeToken = this.typeToken();
            if (!util_1.util.tokenToBscType(typeToken, this.options.mode === ParseMode.BrighterScript)) {
                this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.functionParameterTypeIsInvalid(name.text, typeToken.text)), { range: typeToken.range }));
            }
        }
        return new Expression_1.FunctionParameterExpression(name, typeToken, defaultValue, asToken);
    }
    assignment() {
        let name = this.advance();
        //add diagnostic if name is a reserved word that cannot be used as an identifier
        if (TokenKind_1.DisallowedLocalIdentifiersText.has(name.text.toLowerCase())) {
            this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.cannotUseReservedWordAsIdentifier(name.text)), { range: name.range }));
        }
        if (this.check(TokenKind_1.TokenKind.As)) {
            // v1 syntax allows type declaration on lhs of assignment
            this.warnIfNotBrighterScriptMode('typed assignment');
            this.advance(); // skip 'as'
            this.typeToken(); // skip typeToken;
        }
        let operator = this.consume(DiagnosticMessages_1.DiagnosticMessages.expectedOperatorAfterIdentifier(TokenKind_1.AssignmentOperators, name.text), ...TokenKind_1.AssignmentOperators);
        let value = this.expression();
        let result;
        if (operator.kind === TokenKind_1.TokenKind.Equal) {
            result = new Statement_1.AssignmentStatement(operator, name, value);
        }
        else {
            const nameExpression = new Expression_1.VariableExpression(name);
            result = new Statement_1.AssignmentStatement({ kind: TokenKind_1.TokenKind.Equal, text: '=', range: operator.range }, name, new Expression_1.BinaryExpression(nameExpression, operator, value));
            this.addExpressionsToReferences(nameExpression);
            if ((0, reflection_1.isBinaryExpression)(value)) {
                //remove the right-hand-side expression from this assignment operator, and replace with the full assignment expression
                this._references.expressions.delete(value);
            }
            this._references.expressions.add(result);
        }
        this._references.assignmentStatements.push(result);
        return result;
    }
    checkLibrary() {
        let isLibraryToken = this.check(TokenKind_1.TokenKind.Library);
        //if we are at the top level, any line that starts with "library" should be considered a library statement
        if (this.isAtRootLevel() && isLibraryToken) {
            return true;
            //not at root level, library statements are all invalid here, but try to detect if the tokens look
            //like a library statement (and let the libraryStatement function handle emitting the diagnostics)
        }
        else if (isLibraryToken && this.checkNext(TokenKind_1.TokenKind.StringLiteral)) {
            return true;
            //definitely not a library statement
        }
        else {
            return false;
        }
    }
    checkAlias() {
        let isAliasToken = this.check(TokenKind_1.TokenKind.Alias);
        //if we are at the top level, any line that starts with "alias" should be considered a alias statement
        if (this.isAtRootLevel() && isAliasToken) {
            return true;
            //not at root level, alias statements are all invalid here, but try to detect if the tokens look
            //like a alias statement (and let the alias function handle emitting the diagnostics)
        }
        else if (isAliasToken && this.checkNext(TokenKind_1.TokenKind.Identifier)) {
            return true;
            //definitely not a alias statement
        }
        else {
            return false;
        }
    }
    statement() {
        if (this.checkLibrary()) {
            return this.libraryStatement();
        }
        if (this.check(TokenKind_1.TokenKind.Import)) {
            return this.importStatement();
        }
        if (this.check(TokenKind_1.TokenKind.Typecast) && this.checkAnyNext(TokenKind_1.TokenKind.Identifier, ...this.allowedLocalIdentifiers)) {
            return this.typecastStatement();
        }
        if (this.checkAlias()) {
            return this.aliasStatement();
        }
        if (this.check(TokenKind_1.TokenKind.Stop) || this.check(TokenKind_1.TokenKind.AtStop)) {
            return this.stopStatement();
        }
        if (this.check(TokenKind_1.TokenKind.If)) {
            return this.ifStatement();
        }
        //`try` must be followed by a block, otherwise it could be a local variable
        if (this.check(TokenKind_1.TokenKind.Try) && this.checkAnyNext(TokenKind_1.TokenKind.Newline, TokenKind_1.TokenKind.Colon, TokenKind_1.TokenKind.Comment)) {
            return this.tryCatchStatement();
        }
        if (this.check(TokenKind_1.TokenKind.Throw)) {
            return this.throwStatement();
        }
        if (this.checkAny(TokenKind_1.TokenKind.Print, TokenKind_1.TokenKind.Question)) {
            return this.printStatement();
        }
        if (this.check(TokenKind_1.TokenKind.Dim)) {
            return this.dimStatement();
        }
        if (this.check(TokenKind_1.TokenKind.While)) {
            return this.whileStatement();
        }
        if (this.check(TokenKind_1.TokenKind.ExitWhile)) {
            return this.exitWhile();
        }
        if (this.check(TokenKind_1.TokenKind.For)) {
            return this.forStatement();
        }
        if (this.check(TokenKind_1.TokenKind.ForEach)) {
            return this.forEachStatement();
        }
        if (this.check(TokenKind_1.TokenKind.ExitFor)) {
            return this.exitFor();
        }
        if (this.check(TokenKind_1.TokenKind.End)) {
            return this.endStatement();
        }
        if (this.match(TokenKind_1.TokenKind.Return)) {
            return this.returnStatement();
        }
        if (this.check(TokenKind_1.TokenKind.Goto)) {
            return this.gotoStatement();
        }
        //the continue keyword (followed by `for`, `while`, or a statement separator)
        if (this.check(TokenKind_1.TokenKind.Continue) && this.checkAnyNext(TokenKind_1.TokenKind.While, TokenKind_1.TokenKind.For, TokenKind_1.TokenKind.Newline, TokenKind_1.TokenKind.Colon, TokenKind_1.TokenKind.Comment)) {
            return this.continueStatement();
        }
        //does this line look like a label? (i.e.  `someIdentifier:` )
        if (this.check(TokenKind_1.TokenKind.Identifier) && this.checkNext(TokenKind_1.TokenKind.Colon) && this.checkPrevious(TokenKind_1.TokenKind.Newline)) {
            try {
                return this.labelStatement();
            }
            catch (err) {
                if (!(err instanceof CancelStatementError)) {
                    throw err;
                }
                //not a label, try something else
            }
        }
        // BrightScript is like python, in that variables can be declared without a `var`,
        // `let`, (...) keyword. As such, we must check the token *after* an identifier to figure
        // out what to do with it.
        if (this.checkAny(TokenKind_1.TokenKind.Identifier, ...this.allowedLocalIdentifiers)) {
            if (this.checkAnyNext(...TokenKind_1.AssignmentOperators)) {
                return this.assignment();
            }
            else if (this.checkNext(TokenKind_1.TokenKind.As)) {
                // may be a typed assignment - this is v1 syntax
                const backtrack = this.current;
                let validTypeExpression = false;
                try {
                    // skip the identifier, and check for valid type expression
                    this.advance();
                    // skip the 'as'
                    this.advance();
                    // check if there is a valid type
                    const typeToken = this.typeToken(true);
                    const allowedNameKinds = [TokenKind_1.TokenKind.Identifier, ...TokenKind_1.DeclarableTypes, ...this.allowedLocalIdentifiers];
                    validTypeExpression = allowedNameKinds.includes(typeToken.kind);
                }
                catch (e) {
                    // ignore any errors
                }
                finally {
                    this.current = backtrack;
                }
                if (validTypeExpression) {
                    // there is a valid 'as' and type expression
                    return this.assignment();
                }
            }
        }
        //some BrighterScript keywords are allowed as a local identifiers, so we need to check for them AFTER the assignment check
        if (this.check(TokenKind_1.TokenKind.Interface)) {
            return this.interfaceDeclaration();
        }
        if (this.check(TokenKind_1.TokenKind.Class)) {
            return this.classDeclaration();
        }
        if (this.check(TokenKind_1.TokenKind.Namespace)) {
            return this.namespaceStatement();
        }
        if (this.check(TokenKind_1.TokenKind.Enum)) {
            return this.enumDeclaration();
        }
        // TODO: support multi-statements
        return this.setStatement();
    }
    whileStatement() {
        const whileKeyword = this.advance();
        const condition = this.expression();
        this.consumeStatementSeparators();
        const whileBlock = this.block(TokenKind_1.TokenKind.EndWhile);
        let endWhile;
        if (!whileBlock || this.peek().kind !== TokenKind_1.TokenKind.EndWhile) {
            this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.couldNotFindMatchingEndKeyword('while')), { range: this.peek().range }));
            if (!whileBlock) {
                throw this.lastDiagnosticAsError();
            }
        }
        else {
            endWhile = this.advance();
        }
        return new Statement_1.WhileStatement({ while: whileKeyword, endWhile: endWhile }, condition, whileBlock);
    }
    exitWhile() {
        let keyword = this.advance();
        return new Statement_1.ExitWhileStatement({ exitWhile: keyword });
    }
    forStatement() {
        const forToken = this.advance();
        const initializer = this.assignment();
        //TODO: newline allowed?
        const toToken = this.advance();
        const finalValue = this.expression();
        let incrementExpression;
        let stepToken;
        if (this.check(TokenKind_1.TokenKind.Step)) {
            stepToken = this.advance();
            incrementExpression = this.expression();
        }
        else {
            // BrightScript for/to/step loops default to a step of 1 if no `step` is provided
        }
        this.consumeStatementSeparators();
        let body = this.block(TokenKind_1.TokenKind.EndFor, TokenKind_1.TokenKind.Next);
        let endForToken;
        if (!body || !this.checkAny(TokenKind_1.TokenKind.EndFor, TokenKind_1.TokenKind.Next)) {
            this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.expectedEndForOrNextToTerminateForLoop()), { range: this.peek().range }));
            if (!body) {
                throw this.lastDiagnosticAsError();
            }
        }
        else {
            endForToken = this.advance();
        }
        // WARNING: BrightScript doesn't delete the loop initial value after a for/to loop! It just
        // stays around in scope with whatever value it was when the loop exited.
        return new Statement_1.ForStatement(forToken, initializer, toToken, finalValue, body, endForToken, stepToken, incrementExpression);
    }
    forEachStatement() {
        let forEach = this.advance();
        let name = this.advance();
        let maybeIn = this.peek();
        if (this.check(TokenKind_1.TokenKind.Identifier) && maybeIn.text.toLowerCase() === 'in') {
            this.advance();
        }
        else {
            this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.expectedInAfterForEach(name.text)), { range: this.peek().range }));
            throw this.lastDiagnosticAsError();
        }
        let target = this.expression();
        if (!target) {
            this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.expectedExpressionAfterForEachIn()), { range: this.peek().range }));
            throw this.lastDiagnosticAsError();
        }
        this.consumeStatementSeparators();
        let body = this.block(TokenKind_1.TokenKind.EndFor, TokenKind_1.TokenKind.Next);
        if (!body) {
            this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.expectedEndForOrNextToTerminateForLoop()), { range: this.peek().range }));
            throw this.lastDiagnosticAsError();
        }
        let endFor = this.advance();
        return new Statement_1.ForEachStatement({
            forEach: forEach,
            in: maybeIn,
            endFor: endFor
        }, name, target, body);
    }
    exitFor() {
        let keyword = this.advance();
        return new Statement_1.ExitForStatement({ exitFor: keyword });
    }
    commentStatement() {
        var _a, _b;
        //if this comment is on the same line as the previous statement,
        //then this comment should be treated as a single-line comment
        let prev = this.previous();
        if (((_a = prev === null || prev === void 0 ? void 0 : prev.range) === null || _a === void 0 ? void 0 : _a.end.line) === ((_b = this.peek().range) === null || _b === void 0 ? void 0 : _b.start.line)) {
            return new Statement_1.CommentStatement([this.advance()]);
        }
        else {
            let comments = [this.advance()];
            while (this.check(TokenKind_1.TokenKind.Newline) && this.checkNext(TokenKind_1.TokenKind.Comment)) {
                this.advance();
                comments.push(this.advance());
            }
            return new Statement_1.CommentStatement(comments);
        }
    }
    namespaceStatement() {
        this.warnIfNotBrighterScriptMode('namespace');
        let keyword = this.advance();
        this.namespaceAndFunctionDepth++;
        let name = this.getNamespacedVariableNameExpression();
        //set the current namespace name
        let result = new Statement_1.NamespaceStatement(keyword, name, null, null);
        this.globalTerminators.push([TokenKind_1.TokenKind.EndNamespace]);
        let body = this.body();
        this.globalTerminators.pop();
        let endKeyword;
        if (this.check(TokenKind_1.TokenKind.EndNamespace)) {
            endKeyword = this.advance();
        }
        else {
            //the `end namespace` keyword is missing. add a diagnostic, but keep parsing
            this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.couldNotFindMatchingEndKeyword('namespace')), { range: keyword.range }));
        }
        this.namespaceAndFunctionDepth--;
        result.body = body;
        result.endKeyword = endKeyword;
        this._references.namespaceStatements.push(result);
        //cache the range property so that plugins can't affect it
        result.cacheRange();
        result.body.symbolTable.name += `: namespace '${result.name}'`;
        return result;
    }
    /**
     * Get an expression with identifiers separated by periods. Useful for namespaces and class extends
     */
    getNamespacedVariableNameExpression(ignoreDiagnostics = false) {
        let firstIdentifier;
        if (ignoreDiagnostics) {
            if (this.checkAny(...this.allowedLocalIdentifiers)) {
                firstIdentifier = this.advance();
            }
            else {
                throw new Error();
            }
        }
        else {
            firstIdentifier = this.consume(DiagnosticMessages_1.DiagnosticMessages.expectedIdentifierAfterKeyword(this.previous().text), TokenKind_1.TokenKind.Identifier, ...this.allowedLocalIdentifiers);
        }
        let expr;
        if (firstIdentifier) {
            // force it into an identifier so the AST makes some sense
            firstIdentifier.kind = TokenKind_1.TokenKind.Identifier;
            const varExpr = new Expression_1.VariableExpression(firstIdentifier);
            expr = varExpr;
            //consume multiple dot identifiers (i.e. `Name.Space.Can.Have.Many.Parts`)
            while (this.check(TokenKind_1.TokenKind.Dot)) {
                let dot = this.tryConsume(DiagnosticMessages_1.DiagnosticMessages.unexpectedToken(this.peek().text), TokenKind_1.TokenKind.Dot);
                if (!dot) {
                    break;
                }
                let identifier = this.tryConsume(DiagnosticMessages_1.DiagnosticMessages.expectedIdentifier(), TokenKind_1.TokenKind.Identifier, ...this.allowedLocalIdentifiers, ...TokenKind_1.AllowedProperties);
                if (!identifier) {
                    break;
                }
                // force it into an identifier so the AST makes some sense
                identifier.kind = TokenKind_1.TokenKind.Identifier;
                expr = new Expression_1.DottedGetExpression(expr, identifier, dot);
            }
        }
        return new Expression_1.NamespacedVariableNameExpression(expr);
    }
    /**
     * Add an 'unexpected token' diagnostic for any token found between current and the first stopToken found.
     */
    flagUntil(...stopTokens) {
        while (!this.checkAny(...stopTokens) && !this.isAtEnd()) {
            let token = this.advance();
            this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.unexpectedToken(token.text)), { range: token.range }));
        }
    }
    /**
     * Consume tokens until one of the `stopTokenKinds` is encountered
     * @param stopTokenKinds a list of tokenKinds where any tokenKind in this list will result in a match
     * @returns - the list of tokens consumed, EXCLUDING the `stopTokenKind` (you can use `this.peek()` to see which one it was)
     */
    consumeUntil(...stopTokenKinds) {
        let result = [];
        //take tokens until we encounter one of the stopTokenKinds
        while (!stopTokenKinds.includes(this.peek().kind)) {
            result.push(this.advance());
        }
        return result;
    }
    constDeclaration() {
        this.warnIfNotBrighterScriptMode('const declaration');
        const constToken = this.advance();
        const nameToken = this.identifier(...this.allowedLocalIdentifiers);
        const equalToken = this.consumeToken(TokenKind_1.TokenKind.Equal);
        const expression = this.expression();
        const statement = new Statement_1.ConstStatement({
            const: constToken,
            name: nameToken,
            equals: equalToken
        }, expression);
        this._references.constStatements.push(statement);
        return statement;
    }
    libraryStatement() {
        let libStatement = new Statement_1.LibraryStatement({
            library: this.advance(),
            //grab the next token only if it's a string
            filePath: this.tryConsume(DiagnosticMessages_1.DiagnosticMessages.expectedStringLiteralAfterKeyword('library'), TokenKind_1.TokenKind.StringLiteral)
        });
        this._references.libraryStatements.push(libStatement);
        return libStatement;
    }
    importStatement() {
        this.warnIfNotBrighterScriptMode('import statements');
        let importStatement = new Statement_1.ImportStatement(this.advance(), 
        //grab the next token only if it's a string
        this.tryConsume(DiagnosticMessages_1.DiagnosticMessages.expectedStringLiteralAfterKeyword('import'), TokenKind_1.TokenKind.StringLiteral));
        this._references.importStatements.push(importStatement);
        return importStatement;
    }
    typecastStatement() {
        this.warnIfNotBrighterScriptMode('typecast statements');
        const typecastToken = this.advance();
        const obj = this.identifier(...this.allowedLocalIdentifiers);
        const asToken = this.advance();
        const typeToken = this.typeToken();
        return new Statement_1.TypecastStatement({
            typecast: typecastToken,
            obj: obj,
            as: asToken,
            type: typeToken
        });
    }
    aliasStatement() {
        this.warnIfNotBrighterScriptMode('alias statements');
        const aliasToken = this.advance();
        const name = this.identifier(...this.allowedLocalIdentifiers);
        const equals = this.consumeToken(TokenKind_1.TokenKind.Equal);
        const value = this.identifier(...this.allowedLocalIdentifiers);
        return new Statement_1.AliasStatement({
            alias: aliasToken,
            name: name,
            equals: equals,
            value: value
        });
    }
    annotationExpression() {
        const atToken = this.advance();
        const identifier = this.tryConsume(DiagnosticMessages_1.DiagnosticMessages.expectedIdentifier(), TokenKind_1.TokenKind.Identifier, ...TokenKind_1.AllowedProperties);
        if (identifier) {
            identifier.kind = TokenKind_1.TokenKind.Identifier;
        }
        let annotation = new Expression_1.AnnotationExpression(atToken, identifier);
        this.pendingAnnotations.push(annotation);
        //optional arguments
        if (this.check(TokenKind_1.TokenKind.LeftParen)) {
            let leftParen = this.advance();
            annotation.call = this.finishCall(leftParen, annotation, false);
        }
        return annotation;
    }
    ternaryExpression(test) {
        this.warnIfNotBrighterScriptMode('ternary operator');
        if (!test) {
            test = this.expression();
        }
        const questionMarkToken = this.advance();
        //consume newlines or comments
        while (this.checkAny(TokenKind_1.TokenKind.Newline, TokenKind_1.TokenKind.Comment)) {
            this.advance();
        }
        let consequent;
        try {
            consequent = this.expression();
        }
        catch (_a) { }
        //consume newlines or comments
        while (this.checkAny(TokenKind_1.TokenKind.Newline, TokenKind_1.TokenKind.Comment)) {
            this.advance();
        }
        const colonToken = this.tryConsumeToken(TokenKind_1.TokenKind.Colon);
        //consume newlines
        while (this.checkAny(TokenKind_1.TokenKind.Newline, TokenKind_1.TokenKind.Comment)) {
            this.advance();
        }
        let alternate;
        try {
            alternate = this.expression();
        }
        catch (_b) { }
        return new Expression_1.TernaryExpression(test, questionMarkToken, consequent, colonToken, alternate);
    }
    nullCoalescingExpression(test) {
        this.warnIfNotBrighterScriptMode('null coalescing operator');
        const questionQuestionToken = this.advance();
        const alternate = this.expression();
        return new Expression_1.NullCoalescingExpression(test, questionQuestionToken, alternate);
    }
    regexLiteralExpression() {
        this.warnIfNotBrighterScriptMode('regular expression literal');
        return new Expression_1.RegexLiteralExpression({
            regexLiteral: this.advance()
        });
    }
    templateString(isTagged) {
        this.warnIfNotBrighterScriptMode('template string');
        //get the tag name
        let tagName;
        if (isTagged) {
            tagName = this.consume(DiagnosticMessages_1.DiagnosticMessages.expectedIdentifier(), TokenKind_1.TokenKind.Identifier, ...TokenKind_1.AllowedProperties);
            // force it into an identifier so the AST makes some sense
            tagName.kind = TokenKind_1.TokenKind.Identifier;
        }
        let quasis = [];
        let expressions = [];
        let openingBacktick = this.peek();
        this.advance();
        let currentQuasiExpressionParts = [];
        while (!this.isAtEnd() && !this.check(TokenKind_1.TokenKind.BackTick)) {
            let next = this.peek();
            if (next.kind === TokenKind_1.TokenKind.TemplateStringQuasi) {
                //a quasi can actually be made up of multiple quasis when it includes char literals
                currentQuasiExpressionParts.push(new Expression_1.LiteralExpression(next));
                this.advance();
            }
            else if (next.kind === TokenKind_1.TokenKind.EscapedCharCodeLiteral) {
                currentQuasiExpressionParts.push(new Expression_1.EscapedCharCodeLiteralExpression(next));
                this.advance();
            }
            else {
                //finish up the current quasi
                quasis.push(new Expression_1.TemplateStringQuasiExpression(currentQuasiExpressionParts));
                currentQuasiExpressionParts = [];
                if (next.kind === TokenKind_1.TokenKind.TemplateStringExpressionBegin) {
                    this.advance();
                }
                //now keep this expression
                expressions.push(this.expression());
                if (!this.isAtEnd() && this.check(TokenKind_1.TokenKind.TemplateStringExpressionEnd)) {
                    //TODO is it an error if this is not present?
                    this.advance();
                }
                else {
                    this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.unterminatedTemplateExpression()), { range: util_1.util.getRange(openingBacktick, this.peek()) }));
                    throw this.lastDiagnosticAsError();
                }
            }
        }
        //store the final set of quasis
        quasis.push(new Expression_1.TemplateStringQuasiExpression(currentQuasiExpressionParts));
        if (this.isAtEnd()) {
            //error - missing backtick
            this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.unterminatedTemplateStringAtEndOfFile()), { range: util_1.util.getRange(openingBacktick, this.peek()) }));
            throw this.lastDiagnosticAsError();
        }
        else {
            let closingBacktick = this.advance();
            if (isTagged) {
                return new Expression_1.TaggedTemplateStringExpression(tagName, openingBacktick, quasis, expressions, closingBacktick);
            }
            else {
                return new Expression_1.TemplateStringExpression(openingBacktick, quasis, expressions, closingBacktick);
            }
        }
    }
    tryCatchStatement() {
        const tryToken = this.advance();
        const statement = new Statement_1.TryCatchStatement({ try: tryToken });
        //ensure statement separator
        this.consumeStatementSeparators();
        statement.tryBranch = this.block(TokenKind_1.TokenKind.Catch, TokenKind_1.TokenKind.EndTry);
        const peek = this.peek();
        if (peek.kind !== TokenKind_1.TokenKind.Catch) {
            this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.expectedCatchBlockInTryCatch()), { range: this.peek().range }));
            //gracefully handle end-try
            if (peek.kind === TokenKind_1.TokenKind.EndTry) {
                statement.tokens.endTry = this.advance();
            }
            return statement;
        }
        const catchStmt = new Statement_1.CatchStatement({ catch: this.advance() });
        statement.catchStatement = catchStmt;
        const exceptionVarToken = this.tryConsume(DiagnosticMessages_1.DiagnosticMessages.missingExceptionVarToFollowCatch(), TokenKind_1.TokenKind.Identifier, ...this.allowedLocalIdentifiers);
        if (exceptionVarToken) {
            // force it into an identifier so the AST makes some sense
            exceptionVarToken.kind = TokenKind_1.TokenKind.Identifier;
            catchStmt.exceptionVariable = exceptionVarToken;
        }
        //ensure statement sepatator
        this.consumeStatementSeparators();
        catchStmt.catchBranch = this.block(TokenKind_1.TokenKind.EndTry);
        if (this.peek().kind !== TokenKind_1.TokenKind.EndTry) {
            this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.expectedEndTryToTerminateTryCatch()), { range: this.peek().range }));
        }
        else {
            statement.tokens.endTry = this.advance();
        }
        return statement;
    }
    throwStatement() {
        const throwToken = this.advance();
        let expression;
        if (this.checkAny(TokenKind_1.TokenKind.Newline, TokenKind_1.TokenKind.Colon)) {
            this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.missingExceptionExpressionAfterThrowKeyword()), { range: throwToken.range }));
        }
        else {
            expression = this.expression();
        }
        return new Statement_1.ThrowStatement(throwToken, expression);
    }
    dimStatement() {
        const dim = this.advance();
        let identifier = this.tryConsume(DiagnosticMessages_1.DiagnosticMessages.expectedIdentifierAfterKeyword('dim'), TokenKind_1.TokenKind.Identifier, ...this.allowedLocalIdentifiers);
        // force to an identifier so the AST makes some sense
        if (identifier) {
            identifier.kind = TokenKind_1.TokenKind.Identifier;
        }
        let leftSquareBracket = this.tryConsume(DiagnosticMessages_1.DiagnosticMessages.missingLeftSquareBracketAfterDimIdentifier(), TokenKind_1.TokenKind.LeftSquareBracket);
        let expressions = [];
        let expression;
        do {
            try {
                expression = this.expression();
                expressions.push(expression);
                if (this.check(TokenKind_1.TokenKind.Comma)) {
                    this.advance();
                }
                else {
                    // will also exit for right square braces
                    break;
                }
            }
            catch (error) {
            }
        } while (expression);
        if (expressions.length === 0) {
            this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.missingExpressionsInDimStatement()), { range: this.peek().range }));
        }
        let rightSquareBracket = this.tryConsume(DiagnosticMessages_1.DiagnosticMessages.missingRightSquareBracketAfterDimIdentifier(), TokenKind_1.TokenKind.RightSquareBracket);
        return new Statement_1.DimStatement(dim, identifier, leftSquareBracket, expressions, rightSquareBracket);
    }
    ifStatement() {
        // colon before `if` is usually not allowed, unless it's after `then`
        if (this.current > 0) {
            const prev = this.previous();
            if (prev.kind === TokenKind_1.TokenKind.Colon) {
                if (this.current > 1 && this.tokens[this.current - 2].kind !== TokenKind_1.TokenKind.Then) {
                    this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.unexpectedColonBeforeIfStatement()), { range: prev.range }));
                }
            }
        }
        const ifToken = this.advance();
        const startingRange = ifToken.range;
        const condition = this.expression();
        let thenBranch;
        let elseBranch;
        let thenToken;
        let endIfToken;
        let elseToken;
        //optional `then`
        if (this.check(TokenKind_1.TokenKind.Then)) {
            thenToken = this.advance();
        }
        //is it inline or multi-line if?
        const isInlineIfThen = !this.checkAny(TokenKind_1.TokenKind.Newline, TokenKind_1.TokenKind.Colon, TokenKind_1.TokenKind.Comment);
        if (isInlineIfThen) {
            /*** PARSE INLINE IF STATEMENT ***/
            thenBranch = this.inlineConditionalBranch(TokenKind_1.TokenKind.Else, TokenKind_1.TokenKind.EndIf);
            if (!thenBranch) {
                this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.expectedStatementToFollowConditionalCondition(ifToken.text)), { range: this.peek().range }));
                throw this.lastDiagnosticAsError();
            }
            else {
                this.ensureInline(thenBranch.statements);
            }
            //else branch
            if (this.check(TokenKind_1.TokenKind.Else)) {
                elseToken = this.advance();
                if (this.check(TokenKind_1.TokenKind.If)) {
                    // recurse-read `else if`
                    elseBranch = this.ifStatement();
                    //no multi-line if chained with an inline if
                    if (!elseBranch.isInline) {
                        this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.expectedInlineIfStatement()), { range: elseBranch.range }));
                    }
                }
                else if (this.checkAny(TokenKind_1.TokenKind.Newline, TokenKind_1.TokenKind.Colon)) {
                    //expecting inline else branch
                    this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.expectedInlineIfStatement()), { range: this.peek().range }));
                    throw this.lastDiagnosticAsError();
                }
                else {
                    elseBranch = this.inlineConditionalBranch(TokenKind_1.TokenKind.Else, TokenKind_1.TokenKind.EndIf);
                    if (elseBranch) {
                        this.ensureInline(elseBranch.statements);
                    }
                }
                if (!elseBranch) {
                    //missing `else` branch
                    this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.expectedStatementToFollowElse()), { range: this.peek().range }));
                    throw this.lastDiagnosticAsError();
                }
            }
            if (!elseBranch || !(0, reflection_1.isIfStatement)(elseBranch)) {
                //enforce newline at the end of the inline if statement
                const peek = this.peek();
                if (peek.kind !== TokenKind_1.TokenKind.Newline && peek.kind !== TokenKind_1.TokenKind.Comment && !this.isAtEnd()) {
                    //ignore last error if it was about a colon
                    if (this.previous().kind === TokenKind_1.TokenKind.Colon) {
                        this.diagnostics.pop();
                        this.current--;
                    }
                    //newline is required
                    this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.expectedFinalNewline()), { range: this.peek().range }));
                }
            }
        }
        else {
            /*** PARSE MULTI-LINE IF STATEMENT ***/
            thenBranch = this.blockConditionalBranch(ifToken);
            //ensure newline/colon before next keyword
            this.ensureNewLineOrColon();
            //else branch
            if (this.check(TokenKind_1.TokenKind.Else)) {
                elseToken = this.advance();
                if (this.check(TokenKind_1.TokenKind.If)) {
                    // recurse-read `else if`
                    elseBranch = this.ifStatement();
                }
                else {
                    elseBranch = this.blockConditionalBranch(ifToken);
                    //ensure newline/colon before next keyword
                    this.ensureNewLineOrColon();
                }
            }
            if (!(0, reflection_1.isIfStatement)(elseBranch)) {
                if (this.check(TokenKind_1.TokenKind.EndIf)) {
                    endIfToken = this.advance();
                }
                else {
                    //missing endif
                    this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.expectedEndIfToCloseIfStatement(startingRange.start)), { range: ifToken.range }));
                }
            }
        }
        return new Statement_1.IfStatement({
            if: ifToken,
            then: thenToken,
            endIf: endIfToken,
            else: elseToken
        }, condition, thenBranch, elseBranch, isInlineIfThen);
    }
    //consume a `then` or `else` branch block of an `if` statement
    blockConditionalBranch(ifToken) {
        //keep track of the current error count, because if the then branch fails,
        //we will trash them in favor of a single error on if
        let diagnosticsLengthBeforeBlock = this.diagnostics.length;
        // we're parsing a multi-line ("block") form of the BrightScript if/then and must find
        // a trailing "end if" or "else if"
        let branch = this.block(TokenKind_1.TokenKind.EndIf, TokenKind_1.TokenKind.Else);
        if (!branch) {
            //throw out any new diagnostics created as a result of a `then` block parse failure.
            //the block() function will discard the current line, so any discarded diagnostics will
            //resurface if they are legitimate, and not a result of a malformed if statement
            this.diagnostics.splice(diagnosticsLengthBeforeBlock, this.diagnostics.length - diagnosticsLengthBeforeBlock);
            //this whole if statement is bogus...add error to the if token and hard-fail
            this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.expectedEndIfElseIfOrElseToTerminateThenBlock()), { range: ifToken.range }));
            throw this.lastDiagnosticAsError();
        }
        return branch;
    }
    ensureNewLineOrColon(silent = false) {
        const prev = this.previous().kind;
        if (prev !== TokenKind_1.TokenKind.Newline && prev !== TokenKind_1.TokenKind.Colon) {
            if (!silent) {
                this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.expectedNewlineOrColon()), { range: this.peek().range }));
            }
            return false;
        }
        return true;
    }
    //ensure each statement of an inline block is single-line
    ensureInline(statements) {
        for (const stat of statements) {
            if ((0, reflection_1.isIfStatement)(stat) && !stat.isInline) {
                this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.expectedInlineIfStatement()), { range: stat.range }));
            }
        }
    }
    //consume inline branch of an `if` statement
    inlineConditionalBranch(...additionalTerminators) {
        let statements = [];
        //attempt to get the next statement without using `this.declaration`
        //which seems a bit hackish to get to work properly
        let statement = this.statement();
        if (!statement) {
            return undefined;
        }
        statements.push(statement);
        const startingRange = statement.range;
        //look for colon statement separator
        let foundColon = false;
        while (this.match(TokenKind_1.TokenKind.Colon)) {
            foundColon = true;
        }
        //if a colon was found, add the next statement or err if unexpected
        if (foundColon) {
            if (!this.checkAny(TokenKind_1.TokenKind.Newline, ...additionalTerminators)) {
                //if not an ending keyword, add next statement
                let extra = this.inlineConditionalBranch(...additionalTerminators);
                if (!extra) {
                    return undefined;
                }
                statements.push(...extra.statements);
            }
            else {
                //error: colon before next keyword
                const colon = this.previous();
                this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.unexpectedToken(colon.text)), { range: colon.range }));
            }
        }
        return new Statement_1.Block(statements, startingRange);
    }
    expressionStatement(expr) {
        let expressionStart = this.peek();
        if (this.checkAny(TokenKind_1.TokenKind.PlusPlus, TokenKind_1.TokenKind.MinusMinus)) {
            let operator = this.advance();
            if (this.checkAny(TokenKind_1.TokenKind.PlusPlus, TokenKind_1.TokenKind.MinusMinus)) {
                this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.consecutiveIncrementDecrementOperatorsAreNotAllowed()), { range: this.peek().range }));
                throw this.lastDiagnosticAsError();
            }
            else if ((0, reflection_1.isCallExpression)(expr)) {
                this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.incrementDecrementOperatorsAreNotAllowedAsResultOfFunctionCall()), { range: expressionStart.range }));
                throw this.lastDiagnosticAsError();
            }
            const result = new Statement_1.IncrementStatement(expr, operator);
            this._references.expressions.add(result);
            return result;
        }
        if ((0, reflection_1.isCallExpression)(expr) || (0, reflection_1.isCallfuncExpression)(expr)) {
            return new Statement_1.ExpressionStatement(expr);
        }
        //at this point, it's probably an error. However, we recover a little more gracefully by creating an assignment
        this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.expectedStatementOrFunctionCallButReceivedExpression()), { range: expressionStart.range }));
        throw this.lastDiagnosticAsError();
    }
    setStatement() {
        /**
         * Attempts to find an expression-statement or an increment statement.
         * While calls are valid expressions _and_ statements, increment (e.g. `foo++`)
         * statements aren't valid expressions. They _do_ however fall under the same parsing
         * priority as standalone function calls though, so we can parse them in the same way.
         */
        let expr = this.call();
        if (this.checkAny(...TokenKind_1.AssignmentOperators) && !((0, reflection_1.isCallExpression)(expr))) {
            let left = expr;
            let operator = this.advance();
            let right = this.expression();
            // Create a dotted or indexed "set" based on the left-hand side's type
            if ((0, reflection_1.isIndexedGetExpression)(left)) {
                return new Statement_1.IndexedSetStatement(left.obj, left.index, operator.kind === TokenKind_1.TokenKind.Equal
                    ? right
                    : new Expression_1.BinaryExpression(left, operator, right), left.openingSquare, left.closingSquare, left.additionalIndexes, operator.kind === TokenKind_1.TokenKind.Equal
                    ? operator
                    : { kind: TokenKind_1.TokenKind.Equal, text: '=', range: operator.range });
            }
            else if ((0, reflection_1.isDottedGetExpression)(left)) {
                return new Statement_1.DottedSetStatement(left.obj, left.name, operator.kind === TokenKind_1.TokenKind.Equal
                    ? right
                    : new Expression_1.BinaryExpression(left, operator, right), left.dot, operator.kind === TokenKind_1.TokenKind.Equal
                    ? operator
                    : { kind: TokenKind_1.TokenKind.Equal, text: '=', range: operator.range });
            }
        }
        return this.expressionStatement(expr);
    }
    printStatement() {
        let printKeyword = this.advance();
        let values = [];
        while (!this.checkEndOfStatement()) {
            if (this.check(TokenKind_1.TokenKind.Semicolon)) {
                values.push(this.advance());
            }
            else if (this.check(TokenKind_1.TokenKind.Comma)) {
                values.push(this.advance());
            }
            else if (this.check(TokenKind_1.TokenKind.Else)) {
                break; // inline branch
            }
            else {
                values.push(this.expression());
            }
        }
        //print statements can be empty, so look for empty print conditions
        if (!values.length) {
            let emptyStringLiteral = (0, creators_1.createStringLiteral)('');
            values.push(emptyStringLiteral);
        }
        let last = values[values.length - 1];
        if ((0, Token_1.isToken)(last)) {
            // TODO: error, expected value
        }
        return new Statement_1.PrintStatement({ print: printKeyword }, values);
    }
    /**
     * Parses a return statement with an optional return value.
     * @returns an AST representation of a return statement.
     */
    returnStatement() {
        let tokens = { return: this.previous() };
        if (this.checkEndOfStatement()) {
            return new Statement_1.ReturnStatement(tokens);
        }
        let toReturn = this.check(TokenKind_1.TokenKind.Else) ? undefined : this.expression();
        return new Statement_1.ReturnStatement(tokens, toReturn);
    }
    /**
     * Parses a `label` statement
     * @returns an AST representation of an `label` statement.
     */
    labelStatement() {
        let tokens = {
            identifier: this.advance(),
            colon: this.advance()
        };
        //label must be alone on its line, this is probably not a label
        if (!this.checkAny(TokenKind_1.TokenKind.Newline, TokenKind_1.TokenKind.Comment)) {
            //rewind and cancel
            this.current -= 2;
            throw new CancelStatementError();
        }
        return new Statement_1.LabelStatement(tokens);
    }
    /**
     * Parses a `continue` statement
     */
    continueStatement() {
        return new Statement_1.ContinueStatement({
            continue: this.advance(),
            loopType: this.tryConsume(DiagnosticMessages_1.DiagnosticMessages.expectedToken(TokenKind_1.TokenKind.While, TokenKind_1.TokenKind.For), TokenKind_1.TokenKind.While, TokenKind_1.TokenKind.For)
        });
    }
    /**
     * Parses a `goto` statement
     * @returns an AST representation of an `goto` statement.
     */
    gotoStatement() {
        let tokens = {
            goto: this.advance(),
            label: this.consume(DiagnosticMessages_1.DiagnosticMessages.expectedLabelIdentifierAfterGotoKeyword(), TokenKind_1.TokenKind.Identifier)
        };
        return new Statement_1.GotoStatement(tokens);
    }
    /**
     * Parses an `end` statement
     * @returns an AST representation of an `end` statement.
     */
    endStatement() {
        let endTokens = { end: this.advance() };
        return new Statement_1.EndStatement(endTokens);
    }
    /**
     * Parses a `stop` statement
     * @returns an AST representation of a `stop` statement
     */
    stopStatement() {
        let tokens = { stop: this.advance() };
        return new Statement_1.StopStatement(tokens);
    }
    /**
     * Parses a block, looking for a specific terminating TokenKind to denote completion.
     * Always looks for `end sub`/`end function` to handle unterminated blocks.
     * @param terminators the token(s) that signifies the end of this block; all other terminators are
     *                    ignored.
     */
    block(...terminators) {
        const parentAnnotations = this.enterAnnotationBlock();
        this.consumeStatementSeparators(true);
        let startingToken = this.peek();
        const statements = [];
        while (!this.isAtEnd() && !this.checkAny(TokenKind_1.TokenKind.EndSub, TokenKind_1.TokenKind.EndFunction, ...terminators)) {
            //grab the location of the current token
            let loopCurrent = this.current;
            let dec = this.declaration();
            if (dec) {
                if (!(0, reflection_1.isAnnotationExpression)(dec)) {
                    this.consumePendingAnnotations(dec);
                    statements.push(dec);
                }
                //ensure statement separator
                this.consumeStatementSeparators();
            }
            else {
                //something went wrong. reset to the top of the loop
                this.current = loopCurrent;
                //scrap the entire line (hopefully whatever failed has added a diagnostic)
                this.consumeUntil(TokenKind_1.TokenKind.Newline, TokenKind_1.TokenKind.Colon, TokenKind_1.TokenKind.Eof);
                //trash the next token. this prevents an infinite loop. not exactly sure why we need this,
                //but there's already an error in the file being parsed, so just leave this line here
                this.advance();
                //consume potential separators
                this.consumeStatementSeparators(true);
            }
        }
        if (this.isAtEnd()) {
            return undefined;
            // TODO: Figure out how to handle unterminated blocks well
        }
        else if (terminators.length > 0) {
            //did we hit end-sub / end-function while looking for some other terminator?
            //if so, we need to restore the statement separator
            let prev = this.previous().kind;
            let peek = this.peek().kind;
            if ((peek === TokenKind_1.TokenKind.EndSub || peek === TokenKind_1.TokenKind.EndFunction) &&
                (prev === TokenKind_1.TokenKind.Newline || prev === TokenKind_1.TokenKind.Colon)) {
                this.current--;
            }
        }
        this.exitAnnotationBlock(parentAnnotations);
        return new Statement_1.Block(statements, startingToken.range);
    }
    /**
     * Attach pending annotations to the provided statement,
     * and then reset the annotations array
     */
    consumePendingAnnotations(statement) {
        if (this.pendingAnnotations.length) {
            statement.annotations = this.pendingAnnotations;
            this.pendingAnnotations = [];
        }
    }
    enterAnnotationBlock() {
        const pending = this.pendingAnnotations;
        this.pendingAnnotations = [];
        return pending;
    }
    exitAnnotationBlock(parentAnnotations) {
        // non consumed annotations are an error
        if (this.pendingAnnotations.length) {
            for (const annotation of this.pendingAnnotations) {
                this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.unusedAnnotation()), { range: annotation.range }));
            }
        }
        this.pendingAnnotations = parentAnnotations;
    }
    expression(findTypeCast = true) {
        let expression = this.anonymousFunction();
        let asToken;
        let typeToken;
        if (findTypeCast) {
            do {
                if (this.check(TokenKind_1.TokenKind.As)) {
                    this.warnIfNotBrighterScriptMode('type cast');
                    // Check if this expression is wrapped in any type casts
                    // allows for multiple casts:
                    // myVal = foo() as dynamic as string
                    asToken = this.advance();
                    typeToken = this.typeToken();
                    if (asToken && typeToken) {
                        expression = new Expression_1.TypeCastExpression(expression, asToken, typeToken);
                    }
                }
                else {
                    break;
                }
            } while (asToken && typeToken);
        }
        this._references.expressions.add(expression);
        return expression;
    }
    anonymousFunction() {
        if (this.checkAny(TokenKind_1.TokenKind.Sub, TokenKind_1.TokenKind.Function)) {
            const func = this.functionDeclaration(true);
            //if there's an open paren after this, this is an IIFE
            if (this.check(TokenKind_1.TokenKind.LeftParen)) {
                return this.finishCall(this.advance(), func);
            }
            else {
                return func;
            }
        }
        let expr = this.boolean();
        if (this.check(TokenKind_1.TokenKind.Question)) {
            return this.ternaryExpression(expr);
        }
        else if (this.check(TokenKind_1.TokenKind.QuestionQuestion)) {
            return this.nullCoalescingExpression(expr);
        }
        else {
            return expr;
        }
    }
    boolean() {
        let expr = this.relational();
        while (this.matchAny(TokenKind_1.TokenKind.And, TokenKind_1.TokenKind.Or)) {
            let operator = this.previous();
            let right = this.relational();
            this.addExpressionsToReferences(expr, right);
            expr = new Expression_1.BinaryExpression(expr, operator, right);
        }
        return expr;
    }
    relational() {
        let expr = this.additive();
        while (this.matchAny(TokenKind_1.TokenKind.Equal, TokenKind_1.TokenKind.LessGreater, TokenKind_1.TokenKind.Greater, TokenKind_1.TokenKind.GreaterEqual, TokenKind_1.TokenKind.Less, TokenKind_1.TokenKind.LessEqual)) {
            let operator = this.previous();
            let right = this.additive();
            this.addExpressionsToReferences(expr, right);
            expr = new Expression_1.BinaryExpression(expr, operator, right);
        }
        return expr;
    }
    addExpressionsToReferences(...expressions) {
        for (const expression of expressions) {
            if (!(0, reflection_1.isBinaryExpression)(expression)) {
                this.references.expressions.add(expression);
            }
        }
    }
    // TODO: bitshift
    additive() {
        let expr = this.multiplicative();
        while (this.matchAny(TokenKind_1.TokenKind.Plus, TokenKind_1.TokenKind.Minus)) {
            let operator = this.previous();
            let right = this.multiplicative();
            this.addExpressionsToReferences(expr, right);
            expr = new Expression_1.BinaryExpression(expr, operator, right);
        }
        return expr;
    }
    multiplicative() {
        let expr = this.exponential();
        while (this.matchAny(TokenKind_1.TokenKind.Forwardslash, TokenKind_1.TokenKind.Backslash, TokenKind_1.TokenKind.Star, TokenKind_1.TokenKind.Mod, TokenKind_1.TokenKind.LeftShift, TokenKind_1.TokenKind.RightShift)) {
            let operator = this.previous();
            let right = this.exponential();
            this.addExpressionsToReferences(expr, right);
            expr = new Expression_1.BinaryExpression(expr, operator, right);
        }
        return expr;
    }
    exponential() {
        let expr = this.prefixUnary();
        while (this.match(TokenKind_1.TokenKind.Caret)) {
            let operator = this.previous();
            let right = this.prefixUnary();
            this.addExpressionsToReferences(expr, right);
            expr = new Expression_1.BinaryExpression(expr, operator, right);
        }
        return expr;
    }
    prefixUnary() {
        const nextKind = this.peek().kind;
        if (nextKind === TokenKind_1.TokenKind.Not) {
            this.current++; //advance
            let operator = this.previous();
            let right = this.relational();
            return new Expression_1.UnaryExpression(operator, right);
        }
        else if (nextKind === TokenKind_1.TokenKind.Minus || nextKind === TokenKind_1.TokenKind.Plus) {
            this.current++; //advance
            let operator = this.previous();
            let right = this.prefixUnary();
            return new Expression_1.UnaryExpression(operator, right);
        }
        return this.call();
    }
    indexedGet(expr) {
        let openingSquare = this.previous();
        let questionDotToken = this.getMatchingTokenAtOffset(-2, TokenKind_1.TokenKind.QuestionDot);
        let indexes = [];
        //consume leading newlines
        while (this.match(TokenKind_1.TokenKind.Newline)) { }
        try {
            indexes.push(this.expression());
            //consume additional indexes separated by commas
            while (this.check(TokenKind_1.TokenKind.Comma)) {
                //discard the comma
                this.advance();
                indexes.push(this.expression());
            }
        }
        catch (error) {
            this.rethrowNonDiagnosticError(error);
        }
        //consume trailing newlines
        while (this.match(TokenKind_1.TokenKind.Newline)) { }
        const closingSquare = this.tryConsume(DiagnosticMessages_1.DiagnosticMessages.expectedRightSquareBraceAfterArrayOrObjectIndex(), TokenKind_1.TokenKind.RightSquareBracket);
        return new Expression_1.IndexedGetExpression(expr, indexes.shift(), openingSquare, closingSquare, questionDotToken, indexes);
    }
    newExpression() {
        this.warnIfNotBrighterScriptMode(`using 'new' keyword to construct a class`);
        let newToken = this.advance();
        let nameExpr = this.getNamespacedVariableNameExpression();
        let leftParen = this.consume(DiagnosticMessages_1.DiagnosticMessages.unexpectedToken(this.peek().text), TokenKind_1.TokenKind.LeftParen, TokenKind_1.TokenKind.QuestionLeftParen);
        let call = this.finishCall(leftParen, nameExpr);
        //pop the call from the  callExpressions list because this is technically something else
        this.callExpressions.pop();
        let result = new Expression_1.NewExpression(newToken, call);
        this._references.newExpressions.push(result);
        return result;
    }
    /**
     * A callfunc expression (i.e. `node@.someFunctionOnNode()`)
     */
    callfunc(callee) {
        this.warnIfNotBrighterScriptMode('callfunc operator');
        let operator = this.previous();
        let methodName = this.consume(DiagnosticMessages_1.DiagnosticMessages.expectedIdentifier(), TokenKind_1.TokenKind.Identifier, ...TokenKind_1.AllowedProperties);
        // force it into an identifier so the AST makes some sense
        methodName.kind = TokenKind_1.TokenKind.Identifier;
        let openParen = this.consume(DiagnosticMessages_1.DiagnosticMessages.expectedOpenParenToFollowCallfuncIdentifier(), TokenKind_1.TokenKind.LeftParen);
        let call = this.finishCall(openParen, callee, false);
        return new Expression_1.CallfuncExpression(callee, operator, methodName, openParen, call.args, call.closingParen);
    }
    call() {
        if (this.check(TokenKind_1.TokenKind.New) && this.checkAnyNext(TokenKind_1.TokenKind.Identifier, ...this.allowedLocalIdentifiers)) {
            return this.newExpression();
        }
        let expr = this.primary();
        //an expression to keep for _references
        let referenceCallExpression;
        while (true) {
            if (this.matchAny(TokenKind_1.TokenKind.LeftParen, TokenKind_1.TokenKind.QuestionLeftParen)) {
                expr = this.finishCall(this.previous(), expr);
                //store this call expression in references
                referenceCallExpression = expr;
            }
            else if (this.matchAny(TokenKind_1.TokenKind.LeftSquareBracket, TokenKind_1.TokenKind.QuestionLeftSquare) || this.matchSequence(TokenKind_1.TokenKind.QuestionDot, TokenKind_1.TokenKind.LeftSquareBracket)) {
                expr = this.indexedGet(expr);
            }
            else if (this.match(TokenKind_1.TokenKind.Callfunc)) {
                expr = this.callfunc(expr);
                //store this callfunc expression in references
                referenceCallExpression = expr;
            }
            else if (this.matchAny(TokenKind_1.TokenKind.Dot, TokenKind_1.TokenKind.QuestionDot)) {
                if (this.match(TokenKind_1.TokenKind.LeftSquareBracket)) {
                    expr = this.indexedGet(expr);
                }
                else {
                    let dot = this.previous();
                    let name = this.tryConsume(DiagnosticMessages_1.DiagnosticMessages.expectedPropertyNameAfterPeriod(), TokenKind_1.TokenKind.Identifier, ...TokenKind_1.AllowedProperties);
                    if (!name) {
                        break;
                    }
                    // force it into an identifier so the AST makes some sense
                    name.kind = TokenKind_1.TokenKind.Identifier;
                    expr = new Expression_1.DottedGetExpression(expr, name, dot);
                    this.addPropertyHints(name);
                }
            }
            else if (this.checkAny(TokenKind_1.TokenKind.At, TokenKind_1.TokenKind.QuestionAt)) {
                let dot = this.advance();
                let name = this.tryConsume(DiagnosticMessages_1.DiagnosticMessages.expectedAttributeNameAfterAtSymbol(), TokenKind_1.TokenKind.Identifier, ...TokenKind_1.AllowedProperties);
                if (!name) {
                    break;
                }
                // force it into an identifier so the AST makes some sense
                name.kind = TokenKind_1.TokenKind.Identifier;
                expr = new Expression_1.XmlAttributeGetExpression(expr, name, dot);
                //only allow a single `@` expression
                break;
            }
            else {
                break;
            }
        }
        //if we found a callExpression, add it to `expressions` in references
        if (referenceCallExpression) {
            this._references.expressions.add(referenceCallExpression);
        }
        return expr;
    }
    finishCall(openingParen, callee, addToCallExpressionList = true) {
        let args = [];
        while (this.match(TokenKind_1.TokenKind.Newline)) { }
        if (!this.check(TokenKind_1.TokenKind.RightParen)) {
            do {
                while (this.match(TokenKind_1.TokenKind.Newline)) { }
                if (args.length >= Expression_1.CallExpression.MaximumArguments) {
                    this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.tooManyCallableArguments(args.length, Expression_1.CallExpression.MaximumArguments)), { range: this.peek().range }));
                    throw this.lastDiagnosticAsError();
                }
                try {
                    args.push(this.expression());
                }
                catch (error) {
                    this.rethrowNonDiagnosticError(error);
                    // we were unable to get an expression, so don't continue
                    break;
                }
            } while (this.match(TokenKind_1.TokenKind.Comma));
        }
        while (this.match(TokenKind_1.TokenKind.Newline)) { }
        const closingParen = this.tryConsume(DiagnosticMessages_1.DiagnosticMessages.expectedRightParenAfterFunctionCallArguments(), TokenKind_1.TokenKind.RightParen);
        let expression = new Expression_1.CallExpression(callee, openingParen, closingParen, args);
        if (addToCallExpressionList) {
            this.callExpressions.push(expression);
        }
        return expression;
    }
    /**
     * Tries to get the next token as a type
     * Allows for built-in types (double, string, etc.) or namespaced custom types in Brighterscript mode
     * Will return a token of whatever is next to be parsed
     * Will allow v1 type syntax (typed arrays, union types), but there is no validation on types used this way
     */
    typeToken(ignoreDiagnostics = false) {
        let typeToken;
        let lookForUnions = true;
        let isAUnion = false;
        let resultToken;
        while (lookForUnions) {
            lookForUnions = false;
            if (this.checkAny(...TokenKind_1.DeclarableTypes)) {
                // Token is a built in type
                typeToken = this.advance();
            }
            else if (this.options.mode === ParseMode.BrighterScript) {
                try {
                    // see if we can get a namespaced identifer
                    const qualifiedType = this.getNamespacedVariableNameExpression(ignoreDiagnostics);
                    typeToken = (0, creators_1.createToken)(TokenKind_1.TokenKind.Identifier, qualifiedType.getName(this.options.mode), qualifiedType.range);
                }
                catch (_a) {
                    //could not get an identifier - just get whatever's next
                    typeToken = this.advance();
                }
            }
            else {
                // just get whatever's next
                typeToken = this.advance();
            }
            resultToken = resultToken !== null && resultToken !== void 0 ? resultToken : typeToken;
            if (resultToken && this.options.mode === ParseMode.BrighterScript) {
                // check for brackets
                while (this.check(TokenKind_1.TokenKind.LeftSquareBracket) && this.peekNext().kind === TokenKind_1.TokenKind.RightSquareBracket) {
                    const leftBracket = this.advance();
                    const rightBracket = this.advance();
                    typeToken = (0, creators_1.createToken)(TokenKind_1.TokenKind.Identifier, typeToken.text + leftBracket.text + rightBracket.text, util_1.util.createBoundingRange(typeToken, leftBracket, rightBracket));
                    resultToken = (0, creators_1.createToken)(TokenKind_1.TokenKind.Dynamic, null, typeToken.range);
                }
                if (this.check(TokenKind_1.TokenKind.Or)) {
                    lookForUnions = true;
                    let orToken = this.advance();
                    resultToken = (0, creators_1.createToken)(TokenKind_1.TokenKind.Dynamic, null, util_1.util.createBoundingRange(resultToken, typeToken, orToken));
                    isAUnion = true;
                }
            }
        }
        if (isAUnion) {
            resultToken = (0, creators_1.createToken)(TokenKind_1.TokenKind.Dynamic, null, util_1.util.createBoundingRange(resultToken, typeToken));
        }
        return resultToken;
    }
    primary() {
        switch (true) {
            case this.matchAny(TokenKind_1.TokenKind.False, TokenKind_1.TokenKind.True, TokenKind_1.TokenKind.Invalid, TokenKind_1.TokenKind.IntegerLiteral, TokenKind_1.TokenKind.LongIntegerLiteral, TokenKind_1.TokenKind.FloatLiteral, TokenKind_1.TokenKind.DoubleLiteral, TokenKind_1.TokenKind.StringLiteral):
                return new Expression_1.LiteralExpression(this.previous());
            //capture source literals (LINE_NUM if brightscript, or a bunch of them if brighterscript)
            case this.matchAny(TokenKind_1.TokenKind.LineNumLiteral, ...(this.options.mode === ParseMode.BrightScript ? [] : TokenKind_1.BrighterScriptSourceLiterals)):
                return new Expression_1.SourceLiteralExpression(this.previous());
            //template string
            case this.check(TokenKind_1.TokenKind.BackTick):
                return this.templateString(false);
            //tagged template string (currently we do not support spaces between the identifier and the backtick)
            case this.checkAny(TokenKind_1.TokenKind.Identifier, ...TokenKind_1.AllowedLocalIdentifiers) && this.checkNext(TokenKind_1.TokenKind.BackTick):
                return this.templateString(true);
            case this.matchAny(TokenKind_1.TokenKind.Identifier, ...this.allowedLocalIdentifiers):
                return new Expression_1.VariableExpression(this.previous());
            case this.match(TokenKind_1.TokenKind.ReplacementIdentifier):
                return new Expression_1.LiteralExpression(this.previous());
            case this.match(TokenKind_1.TokenKind.LeftParen):
                let left = this.previous();
                let expr = this.expression();
                let right = this.consume(DiagnosticMessages_1.DiagnosticMessages.unmatchedLeftParenAfterExpression(), TokenKind_1.TokenKind.RightParen);
                return new Expression_1.GroupingExpression({ left: left, right: right }, expr);
            case this.matchAny(TokenKind_1.TokenKind.LeftSquareBracket):
                return this.arrayLiteral();
            case this.match(TokenKind_1.TokenKind.LeftCurlyBrace):
                return this.aaLiteral();
            case this.matchAny(TokenKind_1.TokenKind.Pos, TokenKind_1.TokenKind.Tab):
                let token = Object.assign(this.previous(), {
                    kind: TokenKind_1.TokenKind.Identifier
                });
                return new Expression_1.VariableExpression(token);
            case this.checkAny(TokenKind_1.TokenKind.Function, TokenKind_1.TokenKind.Sub):
                return this.anonymousFunction();
            case this.check(TokenKind_1.TokenKind.RegexLiteral):
                return this.regexLiteralExpression();
            case this.check(TokenKind_1.TokenKind.Comment):
                return new Statement_1.CommentStatement([this.advance()]);
            default:
                //if we found an expected terminator, don't throw a diagnostic...just return undefined
                if (this.checkAny(...this.peekGlobalTerminators())) {
                    //don't throw a diagnostic, just return undefined
                    //something went wrong...throw an error so the upstream processor can scrap this line and move on
                }
                else {
                    this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.unexpectedToken(this.peek().text)), { range: this.peek().range }));
                    throw this.lastDiagnosticAsError();
                }
        }
    }
    arrayLiteral() {
        let elements = [];
        let openingSquare = this.previous();
        //add any comment found right after the opening square
        if (this.check(TokenKind_1.TokenKind.Comment)) {
            elements.push(new Statement_1.CommentStatement([this.advance()]));
        }
        while (this.match(TokenKind_1.TokenKind.Newline)) {
        }
        let closingSquare;
        if (!this.match(TokenKind_1.TokenKind.RightSquareBracket)) {
            try {
                elements.push(this.expression());
                while (this.matchAny(TokenKind_1.TokenKind.Comma, TokenKind_1.TokenKind.Newline, TokenKind_1.TokenKind.Comment)) {
                    if (this.checkPrevious(TokenKind_1.TokenKind.Comment) || this.check(TokenKind_1.TokenKind.Comment)) {
                        let comment = this.check(TokenKind_1.TokenKind.Comment) ? this.advance() : this.previous();
                        elements.push(new Statement_1.CommentStatement([comment]));
                    }
                    while (this.match(TokenKind_1.TokenKind.Newline)) {
                    }
                    if (this.check(TokenKind_1.TokenKind.RightSquareBracket)) {
                        break;
                    }
                    elements.push(this.expression());
                }
            }
            catch (error) {
                this.rethrowNonDiagnosticError(error);
            }
            closingSquare = this.tryConsume(DiagnosticMessages_1.DiagnosticMessages.unmatchedLeftSquareBraceAfterArrayLiteral(), TokenKind_1.TokenKind.RightSquareBracket);
        }
        else {
            closingSquare = this.previous();
        }
        //this.consume("Expected newline or ':' after array literal", TokenKind.Newline, TokenKind.Colon, TokenKind.Eof);
        return new Expression_1.ArrayLiteralExpression(elements, openingSquare, closingSquare);
    }
    aaLiteral() {
        let openingBrace = this.previous();
        let members = [];
        let key = () => {
            let result = {
                colonToken: null,
                keyToken: null,
                range: null
            };
            if (this.checkAny(TokenKind_1.TokenKind.Identifier, ...TokenKind_1.AllowedProperties)) {
                result.keyToken = this.identifier(...TokenKind_1.AllowedProperties);
            }
            else if (this.check(TokenKind_1.TokenKind.StringLiteral)) {
                result.keyToken = this.advance();
            }
            else {
                this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.unexpectedAAKey()), { range: this.peek().range }));
                throw this.lastDiagnosticAsError();
            }
            result.colonToken = this.consume(DiagnosticMessages_1.DiagnosticMessages.expectedColonBetweenAAKeyAndvalue(), TokenKind_1.TokenKind.Colon);
            result.range = util_1.util.getRange(result.keyToken, result.colonToken);
            return result;
        };
        while (this.match(TokenKind_1.TokenKind.Newline)) { }
        let closingBrace;
        if (!this.match(TokenKind_1.TokenKind.RightCurlyBrace)) {
            let lastAAMember;
            try {
                if (this.check(TokenKind_1.TokenKind.Comment)) {
                    lastAAMember = null;
                    members.push(new Statement_1.CommentStatement([this.advance()]));
                }
                else {
                    let k = key();
                    let expr = this.expression();
                    lastAAMember = new Expression_1.AAMemberExpression(k.keyToken, k.colonToken, expr);
                    members.push(lastAAMember);
                }
                while (this.matchAny(TokenKind_1.TokenKind.Comma, TokenKind_1.TokenKind.Newline, TokenKind_1.TokenKind.Colon, TokenKind_1.TokenKind.Comment)) {
                    // collect comma at end of expression
                    if (lastAAMember && this.checkPrevious(TokenKind_1.TokenKind.Comma)) {
                        lastAAMember.commaToken = this.previous();
                    }
                    //check for comment at the end of the current line
                    if (this.check(TokenKind_1.TokenKind.Comment) || this.checkPrevious(TokenKind_1.TokenKind.Comment)) {
                        let token = this.checkPrevious(TokenKind_1.TokenKind.Comment) ? this.previous() : this.advance();
                        members.push(new Statement_1.CommentStatement([token]));
                    }
                    else {
                        this.consumeStatementSeparators(true);
                        //check for a comment on its own line
                        if (this.check(TokenKind_1.TokenKind.Comment) || this.checkPrevious(TokenKind_1.TokenKind.Comment)) {
                            let token = this.checkPrevious(TokenKind_1.TokenKind.Comment) ? this.previous() : this.advance();
                            lastAAMember = null;
                            members.push(new Statement_1.CommentStatement([token]));
                            continue;
                        }
                        if (this.check(TokenKind_1.TokenKind.RightCurlyBrace)) {
                            break;
                        }
                        let k = key();
                        let expr = this.expression();
                        lastAAMember = new Expression_1.AAMemberExpression(k.keyToken, k.colonToken, expr);
                        members.push(lastAAMember);
                    }
                }
            }
            catch (error) {
                this.rethrowNonDiagnosticError(error);
            }
            closingBrace = this.tryConsume(DiagnosticMessages_1.DiagnosticMessages.unmatchedLeftCurlyAfterAALiteral(), TokenKind_1.TokenKind.RightCurlyBrace);
        }
        else {
            closingBrace = this.previous();
        }
        const aaExpr = new Expression_1.AALiteralExpression(members, openingBrace, closingBrace);
        this.addPropertyHints(aaExpr);
        return aaExpr;
    }
    /**
     * Pop token if we encounter specified token
     */
    match(tokenKind) {
        if (this.check(tokenKind)) {
            this.current++; //advance
            return true;
        }
        return false;
    }
    /**
     * Pop token if we encounter a token in the specified list
     * @param tokenKinds a list of tokenKinds where any tokenKind in this list will result in a match
     */
    matchAny(...tokenKinds) {
        for (let tokenKind of tokenKinds) {
            if (this.check(tokenKind)) {
                this.current++; //advance
                return true;
            }
        }
        return false;
    }
    /**
     * If the next series of tokens matches the given set of tokens, pop them all
     * @param tokenKinds a list of tokenKinds used to match the next set of tokens
     */
    matchSequence(...tokenKinds) {
        var _a;
        const endIndex = this.current + tokenKinds.length;
        for (let i = 0; i < tokenKinds.length; i++) {
            if (tokenKinds[i] !== ((_a = this.tokens[this.current + i]) === null || _a === void 0 ? void 0 : _a.kind)) {
                return false;
            }
        }
        this.current = endIndex;
        return true;
    }
    /**
     * Get next token matching a specified list, or fail with an error
     */
    consume(diagnosticInfo, ...tokenKinds) {
        let token = this.tryConsume(diagnosticInfo, ...tokenKinds);
        if (token) {
            return token;
        }
        else {
            let error = new Error(diagnosticInfo.message);
            error.isDiagnostic = true;
            throw error;
        }
    }
    /**
     * Consume next token IF it matches the specified kind. Otherwise, do nothing and return undefined
     */
    consumeTokenIf(tokenKind) {
        if (this.match(tokenKind)) {
            return this.previous();
        }
    }
    consumeToken(tokenKind) {
        return this.consume(DiagnosticMessages_1.DiagnosticMessages.expectedToken(tokenKind), tokenKind);
    }
    /**
     * Consume, or add a message if not found. But then continue and return undefined
     */
    tryConsume(diagnostic, ...tokenKinds) {
        const nextKind = this.peek().kind;
        let foundTokenKind = tokenKinds.some(tokenKind => nextKind === tokenKind);
        if (foundTokenKind) {
            return this.advance();
        }
        this.diagnostics.push(Object.assign(Object.assign({}, diagnostic), { range: this.peek().range }));
    }
    tryConsumeToken(tokenKind) {
        return this.tryConsume(DiagnosticMessages_1.DiagnosticMessages.expectedToken(tokenKind), tokenKind);
    }
    consumeStatementSeparators(optional = false) {
        //a comment or EOF mark the end of the statement
        if (this.isAtEnd() || this.check(TokenKind_1.TokenKind.Comment)) {
            return true;
        }
        let consumed = false;
        //consume any newlines and colons
        while (this.matchAny(TokenKind_1.TokenKind.Newline, TokenKind_1.TokenKind.Colon)) {
            consumed = true;
        }
        if (!optional && !consumed) {
            this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.expectedNewlineOrColon()), { range: this.peek().range }));
        }
        return consumed;
    }
    advance() {
        if (!this.isAtEnd()) {
            this.current++;
        }
        return this.previous();
    }
    checkEndOfStatement() {
        const nextKind = this.peek().kind;
        return [TokenKind_1.TokenKind.Colon, TokenKind_1.TokenKind.Newline, TokenKind_1.TokenKind.Comment, TokenKind_1.TokenKind.Eof].includes(nextKind);
    }
    checkPrevious(tokenKind) {
        var _a;
        return ((_a = this.previous()) === null || _a === void 0 ? void 0 : _a.kind) === tokenKind;
    }
    /**
     * Check that the next token kind is the expected kind
     * @param tokenKind the expected next kind
     * @returns true if the next tokenKind is the expected value
     */
    check(tokenKind) {
        const nextKind = this.peek().kind;
        if (nextKind === TokenKind_1.TokenKind.Eof) {
            return false;
        }
        return nextKind === tokenKind;
    }
    checkAny(...tokenKinds) {
        const nextKind = this.peek().kind;
        if (nextKind === TokenKind_1.TokenKind.Eof) {
            return false;
        }
        return tokenKinds.includes(nextKind);
    }
    checkNext(tokenKind) {
        if (this.isAtEnd()) {
            return false;
        }
        return this.peekNext().kind === tokenKind;
    }
    checkAnyNext(...tokenKinds) {
        if (this.isAtEnd()) {
            return false;
        }
        const nextKind = this.peekNext().kind;
        return tokenKinds.includes(nextKind);
    }
    isAtEnd() {
        return this.peek().kind === TokenKind_1.TokenKind.Eof;
    }
    peekNext() {
        if (this.isAtEnd()) {
            return this.peek();
        }
        return this.tokens[this.current + 1];
    }
    peek() {
        return this.tokens[this.current];
    }
    previous() {
        return this.tokens[this.current - 1];
    }
    /**
     * Sometimes we catch an error that is a diagnostic.
     * If that's the case, we want to continue parsing.
     * Otherwise, re-throw the error
     *
     * @param error error caught in a try/catch
     */
    rethrowNonDiagnosticError(error) {
        if (!error.isDiagnostic) {
            throw error;
        }
    }
    /**
     * Get the token that is {offset} indexes away from {this.current}
     * @param offset the number of index steps away from current index to fetch
     * @param tokenKinds the desired token must match one of these
     * @example
     * getToken(-1); //returns the previous token.
     * getToken(0);  //returns current token.
     * getToken(1);  //returns next token
     */
    getMatchingTokenAtOffset(offset, ...tokenKinds) {
        const token = this.tokens[this.current + offset];
        if (tokenKinds.includes(token.kind)) {
            return token;
        }
    }
    synchronize() {
        this.advance(); // skip the erroneous token
        while (!this.isAtEnd()) {
            if (this.ensureNewLineOrColon(true)) {
                // end of statement reached
                return;
            }
            switch (this.peek().kind) { //eslint-disable-line @typescript-eslint/switch-exhaustiveness-check
                case TokenKind_1.TokenKind.Namespace:
                case TokenKind_1.TokenKind.Class:
                case TokenKind_1.TokenKind.Function:
                case TokenKind_1.TokenKind.Sub:
                case TokenKind_1.TokenKind.If:
                case TokenKind_1.TokenKind.For:
                case TokenKind_1.TokenKind.ForEach:
                case TokenKind_1.TokenKind.While:
                case TokenKind_1.TokenKind.Print:
                case TokenKind_1.TokenKind.Return:
                    // start parsing again from the next block starter or obvious
                    // expression start
                    return;
            }
            this.advance();
        }
    }
    /**
     * References are found during the initial parse.
     * However, sometimes plugins can modify the AST, requiring a full walk to re-compute all references.
     * This does that walk.
     */
    findReferences() {
        this._references = new References();
        const excludedExpressions = new Set();
        const visitCallExpression = (e) => {
            for (const p of e.args) {
                this._references.expressions.add(p);
            }
            //add calls that were not excluded (from loop below)
            if (!excludedExpressions.has(e)) {
                this._references.expressions.add(e);
            }
            //if this call is part of a longer expression that includes a call higher up, find that higher one and remove it
            if (e.callee) {
                let node = e.callee;
                while (node) {
                    //the primary goal for this loop. If we found a parent call expression, remove it from `references`
                    if ((0, reflection_1.isCallExpression)(node)) {
                        this.references.expressions.delete(node);
                        excludedExpressions.add(node);
                        //stop here. even if there are multiple calls in the chain, each child will find and remove its closest parent, so that reduces excess walking.
                        break;
                        //when we hit a variable expression, we're definitely at the leftmost expression so stop
                    }
                    else if ((0, reflection_1.isVariableExpression)(node)) {
                        break;
                        //if
                    }
                    else if ((0, reflection_1.isDottedGetExpression)(node) || (0, reflection_1.isIndexedGetExpression)(node)) {
                        node = node.obj;
                    }
                    else {
                        //some expression we don't understand. log it and quit the loop
                        this.logger.info('Encountered unknown expression while calculating function expression chain', node);
                        break;
                    }
                }
            }
        };
        this.ast.walk((0, visitors_1.createVisitor)({
            AssignmentStatement: s => {
                this._references.assignmentStatements.push(s);
                this.references.expressions.add(s.value);
            },
            ClassStatement: s => {
                this._references.classStatements.push(s);
            },
            ClassFieldStatement: s => {
                if (s.initialValue) {
                    this._references.expressions.add(s.initialValue);
                }
            },
            NamespaceStatement: s => {
                this._references.namespaceStatements.push(s);
            },
            FunctionStatement: s => {
                this._references.functionStatements.push(s);
            },
            ImportStatement: s => {
                this._references.importStatements.push(s);
            },
            LibraryStatement: s => {
                this._references.libraryStatements.push(s);
            },
            FunctionExpression: (expression, parent) => {
                if (!(0, reflection_1.isMethodStatement)(parent)) {
                    this._references.functionExpressions.push(expression);
                }
            },
            NewExpression: e => {
                this._references.newExpressions.push(e);
                for (const p of e.call.args) {
                    this._references.expressions.add(p);
                }
            },
            ExpressionStatement: s => {
                this._references.expressions.add(s.expression);
            },
            CallfuncExpression: e => {
                visitCallExpression(e);
            },
            CallExpression: e => {
                visitCallExpression(e);
            },
            AALiteralExpression: e => {
                this.addPropertyHints(e);
                this._references.expressions.add(e);
                for (const member of e.elements) {
                    if ((0, reflection_1.isAAMemberExpression)(member)) {
                        this._references.expressions.add(member.value);
                    }
                }
            },
            BinaryExpression: (e, parent) => {
                //walk the chain of binary expressions and add each one to the list of expressions
                const expressions = [e];
                let expression;
                while ((expression = expressions.pop())) {
                    if ((0, reflection_1.isBinaryExpression)(expression)) {
                        expressions.push(expression.left, expression.right);
                    }
                    else {
                        this._references.expressions.add(expression);
                    }
                }
            },
            ArrayLiteralExpression: e => {
                for (const element of e.elements) {
                    //keep everything except comments
                    if (!(0, reflection_1.isCommentStatement)(element)) {
                        this._references.expressions.add(element);
                    }
                }
            },
            DottedGetExpression: e => {
                this.addPropertyHints(e.name);
            },
            DottedSetStatement: e => {
                this.addPropertyHints(e.name);
            },
            EnumStatement: e => {
                this._references.enumStatements.push(e);
            },
            ConstStatement: s => {
                this._references.constStatements.push(s);
            },
            UnaryExpression: e => {
                this._references.expressions.add(e);
            },
            IncrementStatement: e => {
                this._references.expressions.add(e);
            }
        }), {
            walkMode: visitors_1.WalkMode.visitAllRecursive
        });
    }
    dispose() {
    }
}
exports.Parser = Parser;
var ParseMode;
(function (ParseMode) {
    ParseMode["BrightScript"] = "BrightScript";
    ParseMode["BrighterScript"] = "BrighterScript";
})(ParseMode = exports.ParseMode || (exports.ParseMode = {}));
class References {
    constructor() {
        this.cache = new Cache_1.Cache();
        this.assignmentStatements = [];
        this.classStatements = [];
        this.functionExpressions = [];
        this.functionStatements = [];
        this.interfaceStatements = [];
        this.enumStatements = [];
        this.constStatements = [];
        /**
         * A collection of full expressions. This excludes intermediary expressions.
         *
         * Example 1:
         * `a.b.c` is composed of `a` (variableExpression)  `.b` (DottedGetExpression) `.c` (DottedGetExpression)
         * This will only contain the final `.c` DottedGetExpression because `.b` and `a` can both be derived by walking back from the `.c` DottedGetExpression.
         *
         * Example 2:
         * `name.space.doSomething(a.b.c)` will result in 2 entries in this list. the `CallExpression` for `doSomething`, and the `.c` DottedGetExpression.
         *
         * Example 3:
         * `value = SomeEnum.value > 2 or SomeEnum.otherValue < 10` will result in 4 entries. `SomeEnum.value`, `2`, `SomeEnum.otherValue`, `10`
         */
        this.expressions = new Set();
        this.importStatements = [];
        this.libraryStatements = [];
        this.namespaceStatements = [];
        this.newExpressions = [];
        this.propertyHints = {};
    }
    get classStatementLookup() {
        if (!this._classStatementLookup) {
            this._classStatementLookup = new Map();
            for (const stmt of this.classStatements) {
                this._classStatementLookup.set(stmt.getName(ParseMode.BrighterScript).toLowerCase(), stmt);
            }
        }
        return this._classStatementLookup;
    }
    /**
     * A map of function statements, indexed by fully-namespaced lower function name.
     */
    get functionStatementLookup() {
        if (!this._functionStatementLookup) {
            this._functionStatementLookup = new Map();
            for (const stmt of this.functionStatements) {
                this._functionStatementLookup.set(stmt.getName(ParseMode.BrighterScript).toLowerCase(), stmt);
            }
        }
        return this._functionStatementLookup;
    }
    get interfaceStatementLookup() {
        if (!this._interfaceStatementLookup) {
            this._interfaceStatementLookup = new Map();
            for (const stmt of this.interfaceStatements) {
                this._interfaceStatementLookup.set(stmt.fullName.toLowerCase(), stmt);
            }
        }
        return this._interfaceStatementLookup;
    }
    get enumStatementLookup() {
        return this.cache.getOrAdd('enums', () => {
            const result = new Map();
            for (const stmt of this.enumStatements) {
                result.set(stmt.fullName.toLowerCase(), stmt);
            }
            return result;
        });
    }
    get constStatementLookup() {
        return this.cache.getOrAdd('consts', () => {
            const result = new Map();
            for (const stmt of this.constStatements) {
                result.set(stmt.fullName.toLowerCase(), stmt);
            }
            return result;
        });
    }
}
exports.References = References;
class CancelStatementError extends Error {
    constructor() {
        super('CancelStatement');
    }
}
//# sourceMappingURL=Parser.js.map
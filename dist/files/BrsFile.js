"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeywordCompletions = exports.BrsFile = void 0;
const source_map_1 = require("source-map");
const vscode_languageserver_1 = require("vscode-languageserver");
const vscode_languageserver_2 = require("vscode-languageserver");
const chalk_1 = require("chalk");
const path = require("path");
const Scope_1 = require("../Scope");
const DiagnosticMessages_1 = require("../DiagnosticMessages");
const FunctionScope_1 = require("../FunctionScope");
const Lexer_1 = require("../lexer/Lexer");
const TokenKind_1 = require("../lexer/TokenKind");
const Parser_1 = require("../parser/Parser");
const DynamicType_1 = require("../types/DynamicType");
const FunctionType_1 = require("../types/FunctionType");
const VoidType_1 = require("../types/VoidType");
const util_1 = require("../util");
const BrsTranspileState_1 = require("../parser/BrsTranspileState");
const Preprocessor_1 = require("../preprocessor/Preprocessor");
const serialize_error_1 = require("serialize-error");
const reflection_1 = require("../astUtils/reflection");
const visitors_1 = require("../astUtils/visitors");
const CommentFlagProcessor_1 = require("../CommentFlagProcessor");
const DefinitionProvider_1 = require("../bscPlugin/definition/DefinitionProvider");
const ReferencesProvider_1 = require("../bscPlugin/references/ReferencesProvider");
const DocumentSymbolProcessor_1 = require("../bscPlugin/symbols/DocumentSymbolProcessor");
const WorkspaceSymbolProcessor_1 = require("../bscPlugin/symbols/WorkspaceSymbolProcessor");
/**
 * Holds all details about this file within the scope of the whole program
 */
class BrsFile {
    constructor(srcPath, 
    /**
     * The full pkg path to this file
     */
    pkgPath, program) {
        var _a, _b;
        this.srcPath = srcPath;
        this.pkgPath = pkgPath;
        this.program = program;
        /**
         * The parseMode used for the parser for this file
         */
        this.parseMode = Parser_1.ParseMode.BrightScript;
        /**
         * Indicates whether this file needs to be validated.
         * Files are only ever validated a single time
         */
        this.isValidated = false;
        /**
         * A collection of diagnostics related to this file
         */
        this.diagnostics = [];
        this.commentFlags = [];
        this.callables = [];
        this.functionCalls = [];
        /**
         * Does this file need to be transpiled?
         */
        this.needsTranspiled = false;
        this.scopesByFunc = new Map();
        this.srcPath = (0, util_1.standardizePath) `${this.srcPath}`;
        this.pkgPath = (0, util_1.standardizePath) `${this.pkgPath}`;
        this.dependencyGraphKey = this.pkgPath.toLowerCase();
        this.extension = util_1.util.getExtension(this.srcPath);
        //all BrighterScript files need to be transpiled
        if (((_a = this.extension) === null || _a === void 0 ? void 0 : _a.endsWith('.bs')) || ((_b = program === null || program === void 0 ? void 0 : program.options) === null || _b === void 0 ? void 0 : _b.allowBrighterScriptInBrightScript)) {
            this.needsTranspiled = true;
            this.parseMode = Parser_1.ParseMode.BrighterScript;
        }
        this.isTypedef = this.extension === '.d.bs';
        if (!this.isTypedef) {
            this.typedefKey = util_1.util.getTypedefPath(this.srcPath);
        }
        //global file doesn't have a program, so only resolve typedef info if we have a program
        if (this.program) {
            this.resolveTypedef();
        }
    }
    /**
     * The absolute path to the source location for this file
     * @deprecated use `srcPath` instead
     */
    get pathAbsolute() {
        return this.srcPath;
    }
    set pathAbsolute(value) {
        this.srcPath = value;
    }
    /**
     * Will this file result in only comment or whitespace output? If so, it can be excluded from the output if that bsconfig setting is enabled.
     */
    get canBePruned() {
        let canPrune = true;
        this.ast.walk((0, visitors_1.createVisitor)({
            FunctionStatement: () => {
                canPrune = false;
            },
            ClassStatement: () => {
                canPrune = false;
            }
        }), {
            walkMode: visitors_1.WalkMode.visitStatements
        });
        return canPrune;
    }
    getDiagnostics() {
        return [...this.diagnostics];
    }
    addDiagnostic(diagnostic) {
        this.addDiagnostics([diagnostic]);
    }
    addDiagnostics(diagnostics) {
        for (const diagnostic of diagnostics) {
            if (!diagnostic.file) {
                diagnostic.file = this;
            }
            this.diagnostics.push(diagnostic);
        }
    }
    get functionScopes() {
        if (!this._functionScopes) {
            this.createFunctionScopes();
        }
        return this._functionScopes;
    }
    get cache() {
        var _a;
        // eslint-disable-next-line @typescript-eslint/dot-notation
        return (_a = this._parser) === null || _a === void 0 ? void 0 : _a.references['cache'];
    }
    /**
     * files referenced by import statements
     */
    get ownScriptImports() {
        var _a, _b;
        const result = (_b = (_a = this.cache) === null || _a === void 0 ? void 0 : _a.getOrAdd('BrsFile_ownScriptImports', () => {
            var _a, _b, _c, _d;
            const result = [];
            for (const statement of (_c = (_b = (_a = this.parser) === null || _a === void 0 ? void 0 : _a.references) === null || _b === void 0 ? void 0 : _b.importStatements) !== null && _c !== void 0 ? _c : []) {
                //register import statements
                if ((0, reflection_1.isImportStatement)(statement) && statement.filePathToken) {
                    result.push({
                        filePathRange: statement.filePathToken.range,
                        pkgPath: util_1.util.getPkgPathFromTarget(this.pkgPath, statement.filePath),
                        sourceFile: this,
                        text: (_d = statement.filePathToken) === null || _d === void 0 ? void 0 : _d.text
                    });
                }
            }
            return result;
        })) !== null && _b !== void 0 ? _b : [];
        return result;
    }
    /**
     * The AST for this file
     */
    get ast() {
        return this.parser.ast;
    }
    /**
     * Get the token at the specified position
     */
    getTokenAt(position) {
        for (let token of this.parser.tokens) {
            if (util_1.util.rangeContains(token.range, position)) {
                return token;
            }
        }
    }
    /**
     * Walk the AST and find the expression that this token is most specifically contained within
     */
    getClosestExpression(position) {
        if (typeof (position === null || position === void 0 ? void 0 : position.line) !== 'number') {
            return undefined;
        }
        const handle = new vscode_languageserver_1.CancellationTokenSource();
        let containingNode;
        this.ast.walk((node) => {
            const latestContainer = containingNode;
            //bsc walks depth-first
            if (util_1.util.rangeContains(node.range, position)) {
                containingNode = node;
            }
            //we had a match before, and don't now. this means we've finished walking down the whole way, and found our match
            if (latestContainer && !containingNode) {
                containingNode = latestContainer;
                handle.cancel();
            }
        }, {
            walkMode: visitors_1.WalkMode.visitAllRecursive,
            cancel: handle.token
        });
        return containingNode;
    }
    get parser() {
        if (!this._parser) {
            //remove the typedef file (if it exists)
            this.hasTypedef = false;
            this.typedefFile = undefined;
            //parse the file (it should parse fully since there's no linked typedef
            this.parse(this.fileContents);
            //re-link the typedef (if it exists...which it should)
            this.resolveTypedef();
        }
        return this._parser;
    }
    /**
     * Find and set the typedef variables (if a matching typedef file exists)
     */
    resolveTypedef() {
        this.typedefFile = this.program.getFile(this.typedefKey);
        this.hasTypedef = !!this.typedefFile;
    }
    /**
     * Attach the file to the dependency graph so it can monitor changes.
     * Also notify the dependency graph of our current dependencies so other dependents can be notified.
     */
    attachDependencyGraph(dependencyGraph) {
        var _a;
        (_a = this.unsubscribeFromDependencyGraph) === null || _a === void 0 ? void 0 : _a.call(this);
        //event that fires anytime a dependency changes
        this.unsubscribeFromDependencyGraph = dependencyGraph.onchange(this.dependencyGraphKey, () => {
            this.resolveTypedef();
        });
        const dependencies = this.ownScriptImports.filter(x => !!x.pkgPath).map(x => x.pkgPath.toLowerCase());
        //if this is a .brs file, watch for typedef changes
        if (this.extension === '.brs') {
            dependencies.push(util_1.util.getTypedefPath(this.pkgPath));
        }
        dependencyGraph.addOrReplace(this.dependencyGraphKey, dependencies);
    }
    /**
     * Calculate the AST for this file
     * @param fileContents the raw source code to parse
     */
    parse(fileContents) {
        try {
            this.fileContents = fileContents;
            this.diagnostics = [];
            //if we have a typedef file, skip parsing this file
            if (this.hasTypedef) {
                //skip validation since the typedef is shadowing this file
                this.isValidated = true;
                return;
            }
            //tokenize the input file
            let lexer = this.program.logger.time('debug', ['lexer.lex', chalk_1.default.green(this.srcPath)], () => {
                return Lexer_1.Lexer.scan(fileContents, {
                    includeWhitespace: false
                });
            });
            this.getCommentFlags(lexer.tokens);
            let preprocessor = new Preprocessor_1.Preprocessor();
            //remove all code inside false-resolved conditional compilation statements.
            //TODO preprocessor should go away in favor of the AST handling this internally (because it affects transpile)
            //currently the preprocessor throws exceptions on syntax errors...so we need to catch it
            try {
                this.program.logger.time('debug', ['preprocessor.process', chalk_1.default.green(this.srcPath)], () => {
                    preprocessor.process(lexer.tokens, this.program.getManifest());
                });
            }
            catch (error) {
                //if the thrown error is DIFFERENT than any errors from the preprocessor, add that error to the list as well
                if (this.diagnostics.find((x) => x === error) === undefined) {
                    this.diagnostics.push(error);
                }
            }
            //if the preprocessor generated tokens, use them.
            let tokens = preprocessor.processedTokens.length > 0 ? preprocessor.processedTokens : lexer.tokens;
            this.program.logger.time('debug', ['parser.parse', chalk_1.default.green(this.srcPath)], () => {
                this._parser = Parser_1.Parser.parse(tokens, {
                    mode: this.parseMode,
                    logger: this.program.logger
                });
            });
            //absorb all lexing/preprocessing/parsing diagnostics
            this.diagnostics.push(...lexer.diagnostics, ...preprocessor.diagnostics, ...this._parser.diagnostics);
            //extract all callables from this file
            this.findCallables();
            //find all places where a sub/function is being called
            this.findFunctionCalls();
            //attach this file to every diagnostic
            for (let diagnostic of this.diagnostics) {
                diagnostic.file = this;
            }
        }
        catch (e) {
            this._parser = new Parser_1.Parser();
            this.diagnostics.push(Object.assign({ file: this, range: util_1.util.createRange(0, 0, 0, Number.MAX_VALUE) }, DiagnosticMessages_1.DiagnosticMessages.genericParserMessage('Critical error parsing file: ' + JSON.stringify((0, serialize_error_1.serializeError)(e)))));
        }
    }
    /**
     * @deprecated logic has moved into BrsFileValidator, this is now an empty function
     */
    validate() {
    }
    /**
     * Find a class. This scans all scopes for this file, and returns the first matching class that is found.
     * Returns undefined if not found.
     * @param className - The class name, including the namespace of the class if possible
     * @param containingNamespace - The namespace used to resolve relative class names. (i.e. the namespace around the current statement trying to find a class)
     * @returns the first class in the first scope found, or undefined if not found
     */
    getClassFileLink(className, containingNamespace) {
        const lowerClassName = className.toLowerCase();
        const lowerContainingNamespace = containingNamespace === null || containingNamespace === void 0 ? void 0 : containingNamespace.toLowerCase();
        const scopes = this.program.getScopesForFile(this);
        //find the first class in the first scope that has it
        for (let scope of scopes) {
            const cls = scope.getClassFileLink(lowerClassName, lowerContainingNamespace);
            if (cls) {
                return cls;
            }
        }
    }
    findPropertyNameCompletions() {
        //Build completion items from all the "properties" found in the file
        const { propertyHints } = this.parser.references;
        const results = [];
        for (const key of Object.keys(propertyHints)) {
            results.push({
                label: propertyHints[key],
                kind: vscode_languageserver_2.CompletionItemKind.Text
            });
        }
        return results;
    }
    get propertyNameCompletions() {
        if (!this._propertyNameCompletions) {
            this._propertyNameCompletions = this.findPropertyNameCompletions();
        }
        return this._propertyNameCompletions;
    }
    /**
     * Find all comment flags in the source code. These enable or disable diagnostic messages.
     * @param tokens - an array of tokens of which to find `TokenKind.Comment` from
     */
    getCommentFlags(tokens) {
        const processor = new CommentFlagProcessor_1.CommentFlagProcessor(this, ['rem', `'`], DiagnosticMessages_1.diagnosticCodes, [DiagnosticMessages_1.DiagnosticCodeMap.unknownDiagnosticCode]);
        this.commentFlags = [];
        for (let token of tokens) {
            if (token.kind === TokenKind_1.TokenKind.Comment) {
                processor.tryAdd(token.text, token.range);
            }
        }
        this.commentFlags.push(...processor.commentFlags);
        this.diagnostics.push(...processor.diagnostics);
    }
    /**
     * Create a scope for every function in this file
     */
    createFunctionScopes() {
        var _a, _b, _c;
        //find every function
        let functions = this.parser.references.functionExpressions;
        //create a functionScope for every function
        this._functionScopes = [];
        for (let func of functions) {
            let scope = new FunctionScope_1.FunctionScope(func);
            //find parent function, and add this scope to it if found
            {
                let parentScope = this.scopesByFunc.get(func.parentFunction);
                //add this child scope to its parent
                if (parentScope) {
                    parentScope.childrenScopes.push(scope);
                }
                //store the parent scope for this scope
                scope.parentScope = parentScope;
            }
            //add every parameter
            for (let param of func.parameters) {
                scope.variableDeclarations.push({
                    nameRange: param.name.range,
                    lineIndex: (_a = param.name.range) === null || _a === void 0 ? void 0 : _a.start.line,
                    name: param.name.text,
                    type: param.type
                });
            }
            //add all of ForEachStatement loop varibales
            (_b = func.body) === null || _b === void 0 ? void 0 : _b.walk((0, visitors_1.createVisitor)({
                ForEachStatement: (stmt) => {
                    var _a;
                    scope.variableDeclarations.push({
                        nameRange: stmt.item.range,
                        lineIndex: (_a = stmt.item.range) === null || _a === void 0 ? void 0 : _a.start.line,
                        name: stmt.item.text,
                        type: new DynamicType_1.DynamicType()
                    });
                },
                LabelStatement: (stmt) => {
                    var _a;
                    const { identifier } = stmt.tokens;
                    scope.labelStatements.push({
                        nameRange: identifier.range,
                        lineIndex: (_a = identifier.range) === null || _a === void 0 ? void 0 : _a.start.line,
                        name: identifier.text
                    });
                }
            }), {
                walkMode: visitors_1.WalkMode.visitStatements
            });
            this.scopesByFunc.set(func, scope);
            //find every statement in the scope
            this._functionScopes.push(scope);
        }
        //find every variable assignment in the whole file
        let assignmentStatements = this.parser.references.assignmentStatements;
        for (let statement of assignmentStatements) {
            //find this statement's function scope
            let scope = this.scopesByFunc.get(statement.containingFunction);
            //skip variable declarations that are outside of any scope
            if (scope) {
                scope.variableDeclarations.push({
                    nameRange: statement.name.range,
                    lineIndex: (_c = statement.name.range) === null || _c === void 0 ? void 0 : _c.start.line,
                    name: statement.name.text,
                    type: this.getBscTypeFromAssignment(statement, scope)
                });
            }
        }
    }
    getBscTypeFromAssignment(assignment, scope) {
        var _a, _b, _c, _d;
        try {
            //function
            if ((0, reflection_1.isFunctionExpression)(assignment.value)) {
                let functionType = new FunctionType_1.FunctionType(assignment.value.returnType);
                functionType.isSub = assignment.value.functionType.text === 'sub';
                if (functionType.isSub) {
                    functionType.returnType = new VoidType_1.VoidType();
                }
                functionType.setName(assignment.name.text);
                for (let param of assignment.value.parameters) {
                    let isOptional = !!param.defaultValue;
                    //TODO compute optional parameters
                    functionType.addParameter(param.name.text, param.type, isOptional);
                }
                return functionType;
                //literal
            }
            else if ((0, reflection_1.isLiteralExpression)(assignment.value)) {
                return assignment.value.type;
                //function call
            }
            else if ((0, reflection_1.isCallExpression)(assignment.value)) {
                let calleeName = (_b = (_a = assignment.value.callee) === null || _a === void 0 ? void 0 : _a.name) === null || _b === void 0 ? void 0 : _b.text;
                if (calleeName) {
                    let func = this.getCallableByName(calleeName);
                    if (func) {
                        return func.type.returnType;
                    }
                }
            }
            else if ((0, reflection_1.isVariableExpression)(assignment.value)) {
                let variableName = (_d = (_c = assignment.value) === null || _c === void 0 ? void 0 : _c.name) === null || _d === void 0 ? void 0 : _d.text;
                let variable = scope.getVariableByName(variableName);
                return variable.type;
            }
        }
        catch (e) {
            //do nothing. Just return dynamic
        }
        //fallback to dynamic
        return new DynamicType_1.DynamicType();
    }
    getCallableByName(name) {
        name = name ? name.toLowerCase() : undefined;
        if (!name) {
            return;
        }
        for (let func of this.callables) {
            if (func.name.toLowerCase() === name) {
                return func;
            }
        }
    }
    findCallables() {
        var _a;
        for (let statement of (_a = this.parser.references.functionStatements) !== null && _a !== void 0 ? _a : []) {
            let functionType = new FunctionType_1.FunctionType(statement.func.returnType);
            functionType.setName(statement.name.text);
            functionType.isSub = statement.func.functionType.text.toLowerCase() === 'sub';
            if (functionType.isSub) {
                functionType.returnType = new VoidType_1.VoidType();
            }
            //extract the parameters
            let params = [];
            for (let param of statement.func.parameters) {
                let callableParam = {
                    name: param.name.text,
                    type: param.type,
                    isOptional: !!param.defaultValue,
                    isRestArgument: false
                };
                params.push(callableParam);
                let isOptional = !!param.defaultValue;
                functionType.addParameter(callableParam.name, callableParam.type, isOptional);
            }
            this.callables.push({
                isSub: statement.func.functionType.text.toLowerCase() === 'sub',
                name: statement.name.text,
                nameRange: statement.name.range,
                file: this,
                params: params,
                range: statement.func.range,
                type: functionType,
                getName: statement.getName.bind(statement),
                hasNamespace: !!statement.findAncestor(reflection_1.isNamespaceStatement),
                functionStatement: statement
            });
        }
    }
    findFunctionCalls() {
        this.functionCalls = [];
        //for every function in the file
        for (let func of this._parser.references.functionExpressions) {
            //for all function calls in this function
            for (let expression of func.callExpressions) {
                if (
                //filter out dotted function invocations (i.e. object.doSomething()) (not currently supported. TODO support it)
                expression.callee.obj ||
                    //filter out method calls on method calls for now (i.e. getSomething().getSomethingElse())
                    expression.callee.callee ||
                    //filter out callees without a name (immediately-invoked function expressions)
                    !expression.callee.name) {
                    continue;
                }
                let functionName = expression.callee.name.text;
                //callee is the name of the function being called
                let callee = expression.callee;
                let columnIndexBegin = callee.range.start.character;
                let columnIndexEnd = callee.range.end.character;
                let args = [];
                //TODO convert if stmts to use instanceof instead
                for (let arg of expression.args) {
                    //is a literal parameter value
                    if ((0, reflection_1.isLiteralExpression)(arg)) {
                        args.push({
                            range: arg.range,
                            type: arg.type,
                            text: arg.token.text,
                            expression: arg,
                            typeToken: undefined
                        });
                        //is variable being passed into argument
                    }
                    else if (arg.name) {
                        args.push({
                            range: arg.range,
                            //TODO - look up the data type of the actual variable
                            type: new DynamicType_1.DynamicType(),
                            text: arg.name.text,
                            expression: arg,
                            typeToken: undefined
                        });
                    }
                    else if (arg.value) {
                        let text = '';
                        /* istanbul ignore next: TODO figure out why value is undefined sometimes */
                        if (arg.value.value) {
                            text = arg.value.value.toString();
                        }
                        let callableArg = {
                            range: arg.range,
                            //TODO not sure what to do here
                            type: new DynamicType_1.DynamicType(),
                            text: text,
                            expression: arg,
                            typeToken: undefined
                        };
                        //wrap the value in quotes because that's how it appears in the code
                        if ((0, reflection_1.isStringType)(callableArg.type)) {
                            callableArg.text = '"' + callableArg.text + '"';
                        }
                        args.push(callableArg);
                    }
                    else {
                        args.push({
                            range: arg.range,
                            type: new DynamicType_1.DynamicType(),
                            //TODO get text from other types of args
                            text: '',
                            expression: arg,
                            typeToken: undefined
                        });
                    }
                }
                let functionCall = {
                    range: expression.range,
                    functionScope: this.getFunctionScopeAtPosition(callee.range.start),
                    file: this,
                    name: functionName,
                    nameRange: util_1.util.createRange(callee.range.start.line, columnIndexBegin, callee.range.start.line, columnIndexEnd),
                    //TODO keep track of parameters
                    args: args
                };
                this.functionCalls.push(functionCall);
            }
        }
    }
    /**
     * Find the function scope at the given position.
     * @param position the position used to find the deepest scope that contains it
     */
    getFunctionScopeAtPosition(position) {
        return this.cache.getOrAdd(`functionScope-${position.line}:${position.character}`, () => {
            return this._getFunctionScopeAtPosition(position, this.functionScopes);
        });
    }
    _getFunctionScopeAtPosition(position, functionScopes) {
        if (!functionScopes) {
            functionScopes = this.functionScopes;
        }
        for (let scope of functionScopes) {
            if (util_1.util.rangeContains(scope.range, position)) {
                //see if any of that scope's children match the position also, and give them priority
                let childScope = this._getFunctionScopeAtPosition(position, scope.childrenScopes);
                if (childScope) {
                    return childScope;
                }
                else {
                    return scope;
                }
            }
        }
    }
    /**
     * Find the NamespaceStatement enclosing the given position
     */
    getNamespaceStatementForPosition(position) {
        if (position) {
            return this.cache.getOrAdd(`namespaceStatementForPosition-${position.line}:${position.character}`, () => {
                for (const statement of this.parser.references.namespaceStatements) {
                    if (util_1.util.rangeContains(statement.range, position)) {
                        return statement;
                    }
                }
            });
        }
    }
    /**
     * Get completions available at the given cursor. This aggregates all values from this file and the current scope.
     */
    getCompletions(position, scope) {
        let result = [];
        //a map of lower-case names of all added options
        let names = {};
        //handle script import completions
        let scriptImport = util_1.util.getScriptImportAtPosition(this.ownScriptImports, position);
        if (scriptImport) {
            return this.program.getScriptImportCompletions(this.pkgPath, scriptImport);
        }
        //if cursor is within a comment, disable completions
        let currentToken = this.getTokenAt(position);
        const tokenKind = currentToken === null || currentToken === void 0 ? void 0 : currentToken.kind;
        if (tokenKind === TokenKind_1.TokenKind.Comment) {
            return [];
        }
        else if (tokenKind === TokenKind_1.TokenKind.StringLiteral || tokenKind === TokenKind_1.TokenKind.TemplateStringQuasi) {
            const match = /^("?)(pkg|libpkg):/.exec(currentToken.text);
            if (match) {
                const [, openingQuote, fileProtocol] = match;
                //include every absolute file path from this scope
                for (const file of scope.getAllFiles()) {
                    const pkgPath = `${fileProtocol}:/${file.pkgPath.replace(/\\/g, '/')}`;
                    result.push({
                        label: pkgPath,
                        textEdit: vscode_languageserver_2.TextEdit.replace(util_1.util.createRange(currentToken.range.start.line, 
                        //+1 to step past the opening quote
                        currentToken.range.start.character + (openingQuote ? 1 : 0), currentToken.range.end.line, 
                        //-1 to exclude the closing quotemark (or the end character if there is no closing quotemark)
                        currentToken.range.end.character + (currentToken.text.endsWith('"') ? -1 : 0)), pkgPath),
                        kind: vscode_languageserver_2.CompletionItemKind.File
                    });
                }
                return result;
            }
            else {
                //do nothing. we don't want to show completions inside of strings...
                return [];
            }
        }
        const namespaceCompletions = this.getNamespaceCompletions(currentToken, this.parseMode, scope);
        if (namespaceCompletions.length > 0) {
            return [...namespaceCompletions];
        }
        const enumMemberCompletions = this.getEnumMemberStatementCompletions(currentToken, this.parseMode, scope);
        if (enumMemberCompletions.length > 0) {
            // no other completion is valid in this case
            return enumMemberCompletions;
        }
        //determine if cursor is inside a function
        let functionScope = this.getFunctionScopeAtPosition(position);
        if (!functionScope) {
            //we aren't in any function scope, so return the keyword completions and namespaces
            if (this.getTokenBefore(currentToken, TokenKind_1.TokenKind.New)) {
                // there's a new keyword, so only class types are viable here
                return [...this.getGlobalClassStatementCompletions(currentToken, this.parseMode)];
            }
            else {
                return [
                    ...exports.KeywordCompletions,
                    ...this.getGlobalClassStatementCompletions(currentToken, this.parseMode),
                    ...namespaceCompletions,
                    ...this.getNonNamespacedEnumStatementCompletions(currentToken, this.parseMode, scope)
                ];
            }
        }
        const classNameCompletions = this.getGlobalClassStatementCompletions(currentToken, this.parseMode);
        const newToken = this.getTokenBefore(currentToken, TokenKind_1.TokenKind.New);
        if (newToken) {
            //we are after a new keyword; so we can only be top-level namespaces or classes at this point
            result.push(...classNameCompletions);
            result.push(...namespaceCompletions);
            return result;
        }
        if (this.tokenFollows(currentToken, TokenKind_1.TokenKind.Goto)) {
            return this.getLabelCompletion(functionScope);
        }
        if (this.isPositionNextToTokenKind(position, TokenKind_1.TokenKind.Dot)) {
            const selfClassMemberCompletions = this.getClassMemberCompletions(position, currentToken, functionScope, scope);
            if (selfClassMemberCompletions.size > 0) {
                return [...selfClassMemberCompletions.values()].filter((i) => i.label !== 'new');
            }
            if (!this.getClassFromMReference(position, currentToken, functionScope)) {
                //and anything from any class in scope to a non m class
                let classMemberCompletions = scope.getAllClassMemberCompletions();
                result.push(...classMemberCompletions.values());
                result.push(...scope.getPropertyNameCompletions().filter((i) => !classMemberCompletions.has(i.label)));
            }
            else {
                result.push(...scope.getPropertyNameCompletions());
            }
        }
        else {
            result.push(
            //include namespaces
            ...namespaceCompletions, 
            //include class names
            ...classNameCompletions, 
            //include enums
            ...this.getNonNamespacedEnumStatementCompletions(currentToken, this.parseMode, scope), 
            //include constants
            ...this.getNonNamespacedConstStatementCompletions(currentToken, this.parseMode, scope), 
            //include the global callables
            ...scope.getCallablesAsCompletions(this.parseMode));
            //add `m` because that's always valid within a function
            result.push({
                label: 'm',
                kind: vscode_languageserver_2.CompletionItemKind.Variable
            });
            names.m = true;
            result.push(...exports.KeywordCompletions);
            //include local variables
            let variables = functionScope.variableDeclarations;
            for (let variable of variables) {
                //skip duplicate variable names
                if (names[variable.name.toLowerCase()]) {
                    continue;
                }
                names[variable.name.toLowerCase()] = true;
                result.push({
                    label: variable.name,
                    kind: (0, reflection_1.isFunctionType)(variable.type) ? vscode_languageserver_2.CompletionItemKind.Function : vscode_languageserver_2.CompletionItemKind.Variable
                });
            }
            if (this.parseMode === Parser_1.ParseMode.BrighterScript) {
                //include the first part of namespaces
                let namespaces = scope.getAllNamespaceStatements();
                for (let stmt of namespaces) {
                    let firstPart = stmt.nameExpression.getNameParts().shift();
                    //skip duplicate namespace names
                    if (names[firstPart.toLowerCase()]) {
                        continue;
                    }
                    names[firstPart.toLowerCase()] = true;
                    result.push({
                        label: firstPart,
                        kind: vscode_languageserver_2.CompletionItemKind.Module
                    });
                }
            }
        }
        return result;
    }
    getLabelCompletion(functionScope) {
        return functionScope.labelStatements.map(label => ({
            label: label.name,
            kind: vscode_languageserver_2.CompletionItemKind.Reference
        }));
    }
    getClassMemberCompletions(position, currentToken, functionScope, scope) {
        var _a, _b, _c, _d;
        let classStatement = this.getClassFromMReference(position, currentToken, functionScope);
        let results = new Map();
        if (classStatement) {
            let classes = scope.getClassHierarchy(classStatement.item.getName(Parser_1.ParseMode.BrighterScript).toLowerCase());
            for (let cs of classes) {
                for (let member of [...(_b = (_a = cs === null || cs === void 0 ? void 0 : cs.item) === null || _a === void 0 ? void 0 : _a.fields) !== null && _b !== void 0 ? _b : [], ...(_d = (_c = cs === null || cs === void 0 ? void 0 : cs.item) === null || _c === void 0 ? void 0 : _c.methods) !== null && _d !== void 0 ? _d : []]) {
                    if (!results.has(member.name.text.toLowerCase())) {
                        results.set(member.name.text.toLowerCase(), {
                            label: member.name.text,
                            kind: (0, reflection_1.isFieldStatement)(member) ? vscode_languageserver_2.CompletionItemKind.Field : vscode_languageserver_2.CompletionItemKind.Function
                        });
                    }
                }
            }
        }
        return results;
    }
    getClassFromMReference(position, currentToken, functionScope) {
        let previousToken = this.getPreviousToken(currentToken);
        if ((previousToken === null || previousToken === void 0 ? void 0 : previousToken.kind) === TokenKind_1.TokenKind.Dot) {
            previousToken = this.getPreviousToken(previousToken);
        }
        if ((previousToken === null || previousToken === void 0 ? void 0 : previousToken.kind) === TokenKind_1.TokenKind.Identifier && (previousToken === null || previousToken === void 0 ? void 0 : previousToken.text.toLowerCase()) === 'm' && (0, reflection_1.isMethodStatement)(functionScope.func.functionStatement)) {
            return { item: this.parser.references.classStatements.find((cs) => util_1.util.rangeContains(cs.range, position)), file: this };
        }
        return undefined;
    }
    getGlobalClassStatementCompletions(currentToken, parseMode) {
        var _a;
        if (parseMode === Parser_1.ParseMode.BrightScript) {
            return [];
        }
        let results = new Map();
        let completionName = (_a = this.getPartialVariableName(currentToken, [TokenKind_1.TokenKind.New])) === null || _a === void 0 ? void 0 : _a.toLowerCase();
        if (completionName === null || completionName === void 0 ? void 0 : completionName.includes('.')) {
            return [];
        }
        let scopes = this.program.getScopesForFile(this);
        for (let scope of scopes) {
            let classMap = scope.getClassMap();
            for (const key of [...classMap.keys()]) {
                let cs = classMap.get(key).item;
                if (!results.has(cs.name.text)) {
                    results.set(cs.name.text, {
                        label: cs.name.text,
                        kind: vscode_languageserver_2.CompletionItemKind.Class
                    });
                }
            }
        }
        return [...results.values()];
    }
    getNonNamespacedEnumStatementCompletions(currentToken, parseMode, scope) {
        var _a, _b;
        if (parseMode !== Parser_1.ParseMode.BrighterScript) {
            return [];
        }
        const containingNamespaceName = ((_b = this.getNamespaceStatementForPosition((_a = currentToken === null || currentToken === void 0 ? void 0 : currentToken.range) === null || _a === void 0 ? void 0 : _a.start)) === null || _b === void 0 ? void 0 : _b.name) + '.';
        const results = new Map();
        const enumMap = scope.getEnumMap();
        for (const key of [...enumMap.keys()]) {
            const enumStatement = enumMap.get(key).item;
            const fullName = enumStatement.fullName;
            //if the enum is contained within our own namespace, or if it's a non-namespaced enum
            if (fullName.startsWith(containingNamespaceName) || !fullName.includes('.')) {
                results.set(fullName, {
                    label: enumStatement.name,
                    kind: vscode_languageserver_2.CompletionItemKind.Enum
                });
            }
        }
        return [...results.values()];
    }
    getNonNamespacedConstStatementCompletions(currentToken, parseMode, scope) {
        var _a, _b;
        if (parseMode !== Parser_1.ParseMode.BrighterScript) {
            return [];
        }
        const containingNamespaceName = ((_b = this.getNamespaceStatementForPosition((_a = currentToken === null || currentToken === void 0 ? void 0 : currentToken.range) === null || _a === void 0 ? void 0 : _a.start)) === null || _b === void 0 ? void 0 : _b.name) + '.';
        const results = new Map();
        const map = scope.getConstMap();
        for (const key of [...map.keys()]) {
            const statement = map.get(key).item;
            const fullName = statement.fullName;
            //if the item is contained within our own namespace, or if it's non-namespaced
            if (fullName.startsWith(containingNamespaceName) || !fullName.includes('.')) {
                results.set(fullName, {
                    label: statement.name,
                    kind: vscode_languageserver_2.CompletionItemKind.Constant
                });
            }
        }
        return [...results.values()];
    }
    getEnumMemberStatementCompletions(currentToken, parseMode, scope) {
        var _a, _b, _c, _d, _e;
        if (parseMode === Parser_1.ParseMode.BrightScript || !currentToken) {
            return [];
        }
        const results = new Map();
        const completionName = (_a = this.getPartialVariableName(currentToken)) === null || _a === void 0 ? void 0 : _a.toLowerCase();
        //if we don't have a completion name, or if there's no period in the name, then this is not to the right of an enum name
        if (!completionName || !completionName.includes('.')) {
            return [];
        }
        const enumNameLower = (_b = completionName === null || completionName === void 0 ? void 0 : completionName.split(/\.(\w+)?$/)[0]) === null || _b === void 0 ? void 0 : _b.toLowerCase();
        const namespaceNameLower = (_c = this.getNamespaceStatementForPosition(currentToken.range.end)) === null || _c === void 0 ? void 0 : _c.name.toLowerCase();
        const enumMap = scope.getEnumMap();
        //get the enum statement with this name (check without namespace prefix first, then with inferred namespace prefix next)
        const enumStatement = (_e = ((_d = enumMap.get(enumNameLower)) !== null && _d !== void 0 ? _d : enumMap.get(namespaceNameLower + '.' + enumNameLower))) === null || _e === void 0 ? void 0 : _e.item;
        //if we found an enum with this name
        if (enumStatement) {
            for (const member of enumStatement.getMembers()) {
                const name = enumStatement.fullName + '.' + member.name;
                const nameLower = name.toLowerCase();
                results.set(nameLower, {
                    label: member.name,
                    kind: vscode_languageserver_2.CompletionItemKind.EnumMember
                });
            }
        }
        return [...results.values()];
    }
    getNamespaceCompletions(currentToken, parseMode, scope) {
        //BrightScript does not support namespaces, so return an empty list in that case
        if (parseMode === Parser_1.ParseMode.BrightScript) {
            return [];
        }
        const completionName = this.getPartialVariableName(currentToken, [TokenKind_1.TokenKind.New]);
        //if we don't have a completion name, or if there's no period in the name, then this is not a namespaced variable
        if (!completionName || !completionName.includes('.')) {
            return [];
        }
        //remove any trailing identifer and then any trailing dot, to give us the
        //name of its immediate parent namespace
        let closestParentNamespaceName = completionName.replace(/\.([a-z0-9_]*)?$/gi, '').toLowerCase();
        let newToken = this.getTokenBefore(currentToken, TokenKind_1.TokenKind.New);
        let result = new Map();
        for (let [, namespace] of scope.namespaceLookup) {
            //completionName = "NameA."
            //completionName = "NameA.Na
            //NameA
            //NameA.NameB
            //NameA.NameB.NameC
            if (namespace.fullName.toLowerCase() === closestParentNamespaceName) {
                //add all of this namespace's immediate child namespaces, bearing in mind if we are after a new keyword
                for (let [, ns] of namespace.namespaces) {
                    if (!newToken || ns.statements.find((s) => (0, reflection_1.isClassStatement)(s))) {
                        if (!result.has(ns.lastPartName)) {
                            result.set(ns.lastPartName, {
                                label: ns.lastPartName,
                                kind: vscode_languageserver_2.CompletionItemKind.Module
                            });
                        }
                    }
                }
                //add function and class statement completions
                for (let stmt of namespace.statements) {
                    if ((0, reflection_1.isClassStatement)(stmt)) {
                        result.set(stmt.name.text, {
                            label: stmt.name.text,
                            kind: vscode_languageserver_2.CompletionItemKind.Class
                        });
                    }
                    else if ((0, reflection_1.isFunctionStatement)(stmt) && !newToken) {
                        result.set(stmt.name.text, {
                            label: stmt.name.text,
                            kind: vscode_languageserver_2.CompletionItemKind.Function
                        });
                    }
                    else if ((0, reflection_1.isEnumStatement)(stmt) && !newToken) {
                        result.set(stmt.name, {
                            label: stmt.name,
                            kind: vscode_languageserver_2.CompletionItemKind.Enum
                        });
                    }
                    else if ((0, reflection_1.isConstStatement)(stmt) && !newToken) {
                        result.set(stmt.name, {
                            label: stmt.name,
                            kind: vscode_languageserver_2.CompletionItemKind.Constant
                        });
                    }
                }
            }
        }
        return [...result.values()];
    }
    /**
     * Given a current token, walk
     */
    getPartialVariableName(currentToken, excludeTokens = null) {
        let identifierAndDotKinds = [TokenKind_1.TokenKind.Identifier, ...TokenKind_1.AllowedLocalIdentifiers, TokenKind_1.TokenKind.Dot];
        //consume tokens backwards until we find something other than a dot or an identifier
        let tokens = [];
        const parser = this.parser;
        for (let i = parser.tokens.indexOf(currentToken); i >= 0; i--) {
            currentToken = parser.tokens[i];
            if (identifierAndDotKinds.includes(currentToken.kind) && (!excludeTokens || !excludeTokens.includes(currentToken.kind))) {
                tokens.unshift(currentToken.text);
            }
            else {
                break;
            }
        }
        //if we found name and dot tokens, join them together to make the namespace name
        if (tokens.length > 0) {
            return tokens.join('');
        }
        else {
            return undefined;
        }
    }
    isPositionNextToTokenKind(position, tokenKind) {
        const closestToken = this.getClosestToken(position);
        const previousToken = this.getPreviousToken(closestToken);
        const previousTokenKind = previousToken === null || previousToken === void 0 ? void 0 : previousToken.kind;
        //next to matched token
        if (!closestToken || closestToken.kind === TokenKind_1.TokenKind.Eof) {
            return false;
        }
        else if (closestToken.kind === tokenKind) {
            return true;
        }
        else if (closestToken.kind === TokenKind_1.TokenKind.Newline || previousTokenKind === TokenKind_1.TokenKind.Newline) {
            return false;
            //next to an identifier, which is next to token kind
        }
        else if (closestToken.kind === TokenKind_1.TokenKind.Identifier && previousTokenKind === tokenKind) {
            return true;
        }
        else {
            return false;
        }
    }
    getTokenBefore(currentToken, tokenKind) {
        const index = this.parser.tokens.indexOf(currentToken);
        for (let i = index - 1; i >= 0; i--) {
            currentToken = this.parser.tokens[i];
            if (currentToken.kind === TokenKind_1.TokenKind.Newline) {
                break;
            }
            else if (currentToken.kind === tokenKind) {
                return currentToken;
            }
        }
        return undefined;
    }
    tokenFollows(currentToken, tokenKind) {
        const index = this.parser.tokens.indexOf(currentToken);
        if (index > 0) {
            return this.parser.tokens[index - 1].kind === tokenKind;
        }
        return false;
    }
    getTokensUntil(currentToken, tokenKind, direction = -1) {
        let tokens = [];
        for (let i = this.parser.tokens.indexOf(currentToken); direction === -1 ? i >= 0 : i === this.parser.tokens.length; i += direction) {
            currentToken = this.parser.tokens[i];
            if (currentToken.kind === TokenKind_1.TokenKind.Newline || currentToken.kind === tokenKind) {
                break;
            }
            tokens.push(currentToken);
        }
        return tokens;
    }
    getPreviousToken(token) {
        const parser = this.parser;
        let idx = parser.tokens.indexOf(token);
        return parser.tokens[idx - 1];
    }
    /**
     * Finds the first scope for this file, then returns true if there's a namespace with this name.
     * Returns false if no namespace was found with that name
     */
    calleeStartsWithNamespace(callee) {
        let left = callee;
        while ((0, reflection_1.isDottedGetExpression)(left)) {
            left = left.obj;
        }
        if ((0, reflection_1.isVariableExpression)(left)) {
            let lowerName = left.name.text.toLowerCase();
            //find the first scope that contains this namespace
            let scope = this.program.getFirstScopeForFile(this);
            if (scope === null || scope === void 0 ? void 0 : scope.namespaceLookup.has(lowerName)) {
                return true;
            }
        }
        return false;
    }
    /**
     * Determine if the callee (i.e. function name) is a known function declared on the given namespace.
     */
    calleeIsKnownNamespaceFunction(callee, namespaceName) {
        var _a, _b;
        //if we have a variable and a namespace
        if ((0, reflection_1.isVariableExpression)(callee) && namespaceName) {
            let lowerCalleeName = (_b = (_a = callee === null || callee === void 0 ? void 0 : callee.name) === null || _a === void 0 ? void 0 : _a.text) === null || _b === void 0 ? void 0 : _b.toLowerCase();
            if (lowerCalleeName) {
                let scope = this.program.getFirstScopeForFile(this);
                //if this file does not belong to any scopes, make a temporary one to answer the question
                if (!scope) {
                    scope = new Scope_1.Scope(`temporary-for-${this.pkgPath}`, this.program);
                    scope.getAllFiles = () => [this];
                    scope.getOwnFiles = scope.getAllFiles;
                }
                let namespace = scope.namespaceLookup.get(namespaceName.toLowerCase());
                if (namespace === null || namespace === void 0 ? void 0 : namespace.functionStatements[lowerCalleeName]) {
                    return true;
                }
            }
        }
        return false;
    }
    /**
     * Get the token closest to the position. if no token is found, the previous token is returned
     */
    getClosestToken(position) {
        let tokens = this.parser.tokens;
        for (let i = 0; i < tokens.length; i++) {
            let token = tokens[i];
            if (util_1.util.rangeContains(token.range, position)) {
                return token;
            }
            //if the position less than this token range, then this position touches no token,
            if (util_1.util.positionIsGreaterThanRange(position, token.range) === false) {
                let t = tokens[i - 1];
                //return the token or the first token
                return t ? t : tokens[0];
            }
        }
        //return the last token
        return tokens[tokens.length - 1];
    }
    /**
     * Builds a list of document symbols for this file. Used by LanguageServer's onDocumentSymbol functionality
     * @deprecated use `DocumentSymbolProvider.process()` instead
     */
    getDocumentSymbols() {
        return new DocumentSymbolProcessor_1.DocumentSymbolProcessor({
            documentSymbols: [],
            file: this,
            program: this.program
        }).process();
    }
    /**
     * Builds a list of workspace symbols for this file. Used by LanguageServer's onWorkspaceSymbol functionality
     */
    getWorkspaceSymbols() {
        return new WorkspaceSymbolProcessor_1.WorkspaceSymbolProcessor({
            program: this.program,
            workspaceSymbols: []
        }).process();
    }
    /**
     * Given a position in a file, if the position is sitting on some type of identifier,
     * go to the definition of that identifier (where this thing was first defined)
     * @deprecated use `DefinitionProvider.process()` instead
     */
    getDefinition(position) {
        return new DefinitionProvider_1.DefinitionProvider({
            program: this.program,
            file: this,
            position: position,
            definitions: []
        }).process();
    }
    getClassMemberDefinitions(textToSearchFor, file) {
        let results = [];
        //get class fields and members
        const statementHandler = (statement) => {
            if (statement.getName(file.parseMode).toLowerCase() === textToSearchFor) {
                results.push(util_1.util.createLocation(util_1.util.pathToUri(file.srcPath), statement.range));
            }
        };
        const fieldStatementHandler = (statement) => {
            if (statement.name.text.toLowerCase() === textToSearchFor) {
                results.push(util_1.util.createLocation(util_1.util.pathToUri(file.srcPath), statement.range));
            }
        };
        file.parser.ast.walk((0, visitors_1.createVisitor)({
            ClassMethodStatement: statementHandler,
            ClassFieldStatement: fieldStatementHandler
        }), {
            walkMode: visitors_1.WalkMode.visitStatements
        });
        return results;
    }
    getClassMethod(classStatement, name, walkParents = true) {
        var _a;
        //TODO - would like to write this with getClassHieararchy; but got stuck on working out the scopes to use... :(
        let statement;
        const statementHandler = (e) => {
            if (!statement && e.name.text.toLowerCase() === name.toLowerCase()) {
                statement = e;
            }
        };
        while (classStatement) {
            classStatement.walk((0, visitors_1.createVisitor)({
                MethodStatement: statementHandler
            }), {
                walkMode: visitors_1.WalkMode.visitStatements
            });
            if (statement) {
                break;
            }
            if (walkParents && classStatement.parentClassName) {
                const nameParts = classStatement.parentClassName.getNameParts();
                classStatement = (_a = this.getClassFileLink(nameParts[nameParts.length - 1], nameParts.slice(0, -1).join('.'))) === null || _a === void 0 ? void 0 : _a.item;
            }
            else {
                break;
            }
        }
        return statement;
    }
    /**
     * Given a position in a file, if the position is sitting on some type of identifier,
     * look up all references of that identifier (every place that identifier is used across the whole app)
     * @deprecated use `ReferencesProvider.process()` instead
     */
    getReferences(position) {
        return new ReferencesProvider_1.ReferencesProvider({
            program: this.program,
            file: this,
            position: position,
            references: []
        }).process();
    }
    /**
     * Convert the brightscript/brighterscript source code into valid brightscript
     */
    transpile() {
        const state = new BrsTranspileState_1.BrsTranspileState(this);
        let transpileResult;
        if (this.needsTranspiled) {
            transpileResult = util_1.util.sourceNodeFromTranspileResult(null, null, state.srcPath, this.ast.transpile(state));
        }
        else if (this.program.options.sourceMap) {
            //emit code as-is with a simple map to the original file location
            transpileResult = util_1.util.simpleMap(state.srcPath, this.fileContents);
        }
        else {
            //simple SourceNode wrapping the entire file to simplify the logic below
            transpileResult = new source_map_1.SourceNode(null, null, state.srcPath, this.fileContents);
        }
        //undo any AST edits that the transpile cycle has made
        state.editor.undoAll();
        if (this.program.options.sourceMap) {
            const stagingFileName = path.basename(state.srcPath).replace(/\.bs$/, '.brs');
            return new source_map_1.SourceNode(null, null, stagingFileName, [
                transpileResult,
                //add the sourcemap reference comment
                state.newline + `'//# sourceMappingURL=./${stagingFileName}.map`
            ]).toStringWithSourceMap({ file: stagingFileName });
        }
        else {
            return {
                code: transpileResult.toString(),
                map: undefined
            };
        }
    }
    getTypedef() {
        const state = new BrsTranspileState_1.BrsTranspileState(this);
        const typedef = this.ast.getTypedef(state);
        const programNode = util_1.util.sourceNodeFromTranspileResult(null, null, this.srcPath, typedef);
        return programNode.toString();
    }
    dispose() {
        var _a, _b;
        (_a = this._parser) === null || _a === void 0 ? void 0 : _a.dispose();
        //unsubscribe from any DependencyGraph subscriptions
        (_b = this.unsubscribeFromDependencyGraph) === null || _b === void 0 ? void 0 : _b.call(this);
        //deleting these properties result in lower memory usage (garbage collection is magic!)
        delete this.fileContents;
        delete this._parser;
        delete this.callables;
        delete this.functionCalls;
        delete this._functionScopes;
        delete this.scopesByFunc;
    }
}
exports.BrsFile = BrsFile;
/**
 * List of completions for all valid keywords/reserved words.
 * Build this list once because it won't change for the lifetime of this process
 */
exports.KeywordCompletions = Object.keys(TokenKind_1.Keywords)
    //remove any keywords with whitespace
    .filter(x => !x.includes(' '))
    //create completions
    .map(x => {
    return {
        label: x,
        kind: vscode_languageserver_2.CompletionItemKind.Keyword
    };
});
//# sourceMappingURL=BrsFile.js.map
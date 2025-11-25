"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefinitionProvider = void 0;
const reflection_1 = require("../../astUtils/reflection");
const TokenKind_1 = require("../../lexer/TokenKind");
const Parser_1 = require("../../parser/Parser");
const util_1 = require("../../util");
const vscode_uri_1 = require("vscode-uri");
const visitors_1 = require("../../astUtils/visitors");
class DefinitionProvider {
    constructor(event) {
        this.event = event;
    }
    process() {
        if ((0, reflection_1.isBrsFile)(this.event.file)) {
            this.brsFileGetDefinition(this.event.file);
        }
        else if ((0, reflection_1.isXmlFile)(this.event.file)) {
            this.xmlFileGetDefinition(this.event.file);
        }
        return this.event.definitions;
    }
    /**
     * For a position in a BrsFile, get the location where the token at that position was defined
     */
    brsFileGetDefinition(file) {
        var _a, _b, _c, _d, _e, _f;
        //get the token at the position
        const token = file.getTokenAt(this.event.position);
        // While certain other tokens are allowed as local variables (AllowedLocalIdentifiers: https://github.com/rokucommunity/brighterscript/blob/master/src/lexer/TokenKind.ts#L418), these are converted by the parser to TokenKind.Identifier by the time we retrieve the token using getTokenAt
        let definitionTokenTypes = [
            TokenKind_1.TokenKind.Identifier,
            TokenKind_1.TokenKind.StringLiteral
        ];
        //throw out invalid tokens and the wrong kind of tokens
        if (!token || !definitionTokenTypes.includes(token.kind)) {
            return;
        }
        const scopesForFile = this.event.program.getScopesForFile(file);
        const [scope] = scopesForFile;
        const expression = file.getClosestExpression(this.event.position);
        if (scope && expression) {
            scope.linkSymbolTable();
            let containingNamespace = (_a = expression.findAncestor(reflection_1.isNamespaceStatement)) === null || _a === void 0 ? void 0 : _a.getName(Parser_1.ParseMode.BrighterScript);
            const fullName = (_b = util_1.default.getAllDottedGetParts(expression)) === null || _b === void 0 ? void 0 : _b.map(x => x.text).join('.');
            //find a constant with this name
            const constant = scope === null || scope === void 0 ? void 0 : scope.getConstFileLink(fullName, containingNamespace);
            if (constant) {
                this.event.definitions.push(util_1.default.createLocation(vscode_uri_1.URI.file(constant.file.srcPath).toString(), constant.item.tokens.name.range));
                return;
            }
            if ((0, reflection_1.isDottedGetExpression)(expression)) {
                const enumLink = scope.getEnumFileLink(fullName, containingNamespace);
                if (enumLink) {
                    this.event.definitions.push(util_1.default.createLocation(vscode_uri_1.URI.file(enumLink.file.srcPath).toString(), enumLink.item.tokens.name.range));
                    return;
                }
                const enumMemberLink = scope.getEnumMemberFileLink(fullName, containingNamespace);
                if (enumMemberLink) {
                    this.event.definitions.push(util_1.default.createLocation(vscode_uri_1.URI.file(enumMemberLink.file.srcPath).toString(), enumMemberLink.item.tokens.name.range));
                    return;
                }
            }
        }
        let textToSearchFor = token.text.toLowerCase();
        const previousToken = file.getTokenAt({ line: token.range.start.line, character: token.range.start.character });
        if ((previousToken === null || previousToken === void 0 ? void 0 : previousToken.kind) === TokenKind_1.TokenKind.Callfunc) {
            for (const scope of this.event.program.getScopes()) {
                //does this xml file declare this function in its interface?
                if ((0, reflection_1.isXmlScope)(scope)) {
                    const apiFunc = (_f = (_e = (_d = (_c = scope.xmlFile.ast) === null || _c === void 0 ? void 0 : _c.component) === null || _d === void 0 ? void 0 : _d.api) === null || _e === void 0 ? void 0 : _e.functions) === null || _f === void 0 ? void 0 : _f.find(x => x.name.toLowerCase() === textToSearchFor); // eslint-disable-line @typescript-eslint/no-loop-func
                    if (apiFunc) {
                        this.event.definitions.push(util_1.default.createLocation(util_1.default.pathToUri(scope.xmlFile.srcPath), apiFunc.range));
                        const callable = scope.getAllCallables().find((c) => c.callable.name.toLowerCase() === textToSearchFor); // eslint-disable-line @typescript-eslint/no-loop-func
                        if (callable) {
                            this.event.definitions.push(util_1.default.createLocation(util_1.default.pathToUri(callable.callable.file.srcPath), callable.callable.functionStatement.name.range));
                        }
                    }
                }
            }
            return;
        }
        // eslint-disable-next-line @typescript-eslint/dot-notation
        let classToken = file['getTokenBefore'](token, TokenKind_1.TokenKind.Class);
        if (classToken) {
            let cs = file.parser.ast.findChild((klass) => (0, reflection_1.isClassStatement)(klass) && klass.classKeyword.range === classToken.range);
            if (cs === null || cs === void 0 ? void 0 : cs.parentClassName) {
                const nameParts = cs.parentClassName.getNameParts();
                let extendedClass = file.getClassFileLink(nameParts[nameParts.length - 1], nameParts.slice(0, -1).join('.'));
                if (extendedClass) {
                    this.event.definitions.push(util_1.default.createLocation(util_1.default.pathToUri(extendedClass.file.srcPath), extendedClass.item.range));
                }
            }
            return;
        }
        if (token.kind === TokenKind_1.TokenKind.StringLiteral) {
            // We need to strip off the quotes but only if present
            const startIndex = textToSearchFor.startsWith('"') ? 1 : 0;
            let endIndex = textToSearchFor.length;
            if (textToSearchFor.endsWith('"')) {
                endIndex--;
            }
            textToSearchFor = textToSearchFor.substring(startIndex, endIndex);
        }
        //look through local variables first, get the function scope for this position (if it exists)
        const functionScope = file.getFunctionScopeAtPosition(this.event.position);
        if (functionScope) {
            //find any variable or label with this name
            for (const varDeclaration of functionScope.variableDeclarations) {
                //we found a variable declaration with this token text!
                if (varDeclaration.name.toLowerCase() === textToSearchFor) {
                    const uri = util_1.default.pathToUri(file.srcPath);
                    this.event.definitions.push(util_1.default.createLocation(uri, varDeclaration.nameRange));
                }
            }
            // eslint-disable-next-line @typescript-eslint/dot-notation
            if (file['tokenFollows'](token, TokenKind_1.TokenKind.Goto)) {
                for (const label of functionScope.labelStatements) {
                    if (label.name.toLocaleLowerCase() === textToSearchFor) {
                        const uri = util_1.default.pathToUri(file.srcPath);
                        this.event.definitions.push(util_1.default.createLocation(uri, label.nameRange));
                    }
                }
            }
        }
        const filesSearched = new Set();
        //look through all files in scope for matches
        for (const scope of scopesForFile) {
            for (const file of scope.getAllFiles()) {
                if ((0, reflection_1.isXmlFile)(file) || filesSearched.has(file)) {
                    continue;
                }
                filesSearched.add(file);
                if ((previousToken === null || previousToken === void 0 ? void 0 : previousToken.kind) === TokenKind_1.TokenKind.Dot && file.parseMode === Parser_1.ParseMode.BrighterScript) {
                    this.event.definitions.push(...file.getClassMemberDefinitions(textToSearchFor, file));
                    const namespaceDefinition = this.brsFileGetDefinitionsForNamespace(token, file);
                    if (namespaceDefinition) {
                        this.event.definitions.push(namespaceDefinition);
                    }
                }
                file.parser.ast.walk((0, visitors_1.createVisitor)({
                    FunctionStatement: (statement) => {
                        if (statement.getName(file.parseMode).toLowerCase() === textToSearchFor) {
                            const uri = util_1.default.pathToUri(file.srcPath);
                            this.event.definitions.push(util_1.default.createLocation(uri, statement.range));
                        }
                    }
                }), {
                    walkMode: visitors_1.WalkMode.visitStatements
                });
            }
        }
    }
    brsFileGetDefinitionsForNamespace(token, file) {
        //BrightScript does not support namespaces, so return an empty list in that case
        if (!token) {
            return undefined;
        }
        let location;
        const nameParts = this.event.file.getPartialVariableName(token, [TokenKind_1.TokenKind.New]).split('.');
        const endName = nameParts[nameParts.length - 1].toLowerCase();
        const namespaceName = nameParts.slice(0, -1).join('.').toLowerCase();
        const statementHandler = (statement) => {
            if (!location && statement.getName(Parser_1.ParseMode.BrighterScript).toLowerCase() === namespaceName) {
                const namespaceItemStatementHandler = (statement) => {
                    if (!location && statement.name.text.toLowerCase() === endName) {
                        const uri = util_1.default.pathToUri(file.srcPath);
                        location = util_1.default.createLocation(uri, statement.range);
                    }
                };
                file.parser.ast.walk((0, visitors_1.createVisitor)({
                    ClassStatement: namespaceItemStatementHandler,
                    FunctionStatement: namespaceItemStatementHandler
                }), {
                    walkMode: visitors_1.WalkMode.visitStatements
                });
            }
        };
        file.parser.ast.walk((0, visitors_1.createVisitor)({
            NamespaceStatement: statementHandler
        }), {
            walkMode: visitors_1.WalkMode.visitStatements
        });
        return location;
    }
    xmlFileGetDefinition(file) {
        //if the position is within the file's parent component name
        if ((0, reflection_1.isXmlFile)(file) &&
            file.parentComponent &&
            file.parentComponentName &&
            util_1.default.rangeContains(file.parentComponentName.range, this.event.position)) {
            this.event.definitions.push({
                range: util_1.default.createRange(0, 0, 0, 0),
                uri: util_1.default.pathToUri(file.parentComponent.srcPath)
            });
        }
    }
}
exports.DefinitionProvider = DefinitionProvider;
//# sourceMappingURL=DefinitionProvider.js.map
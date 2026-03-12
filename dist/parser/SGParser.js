"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rangeFromTokenValue = void 0;
const parser = require("@xml-tools/parser");
const DiagnosticMessages_1 = require("../DiagnosticMessages");
const util_1 = require("../util");
const SGTypes_1 = require("./SGTypes");
const xml_1 = require("../astUtils/xml");
class SGParser {
    constructor() {
        /**
         * The AST of the XML document, not including the inline scripts
         */
        this.ast = new SGTypes_1.SGAst();
        /**
         * The list of diagnostics found during the parse process
         */
        this.diagnostics = [];
    }
    /**
     * These are initially extracted during parse-time, but will also be dynamically regenerated if need be.
     *
     * If a plugin modifies the AST, then the plugin should call SGAst#invalidateReferences() to force this object to refresh
     */
    get references() {
        if (this._references === undefined) {
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
    /**
     * Walk the AST to extract references to useful bits of information
     */
    findReferences() {
        this._references = emptySGReferences();
        const { component } = this.ast;
        if (!component) {
            return;
        }
        const nameAttr = component.getAttribute('name');
        if (nameAttr === null || nameAttr === void 0 ? void 0 : nameAttr.value) {
            this._references.name = nameAttr.value;
        }
        const extendsAttr = component.getAttribute('extends');
        if (extendsAttr === null || extendsAttr === void 0 ? void 0 : extendsAttr.value) {
            this._references.extends = extendsAttr.value;
        }
        for (const script of component.scripts) {
            const uriAttr = script.getAttribute('uri');
            if (uriAttr) {
                const uri = uriAttr.value.text;
                this._references.scriptTagImports.push({
                    filePathRange: uriAttr.value.range,
                    text: uri,
                    pkgPath: util_1.default.getPkgPathFromTarget(this.pkgPath, uri)
                });
            }
        }
    }
    parse(pkgPath, fileContents) {
        this.pkgPath = pkgPath;
        this.diagnostics = [];
        const { cst, tokenVector, lexErrors, parseErrors } = parser.parse(fileContents);
        this.tokens = tokenVector;
        if (lexErrors.length) {
            for (const err of lexErrors) {
                this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.xmlGenericParseError(`Syntax error: ${err.message}`)), { range: util_1.default.createRange(err.line - 1, err.column, err.line - 1, err.column + err.length) }));
            }
        }
        if (parseErrors.length) {
            const err = parseErrors[0];
            const token = err.token;
            this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.xmlGenericParseError(`Syntax error: ${err.message}`)), { range: !isNaN(token.startLine) ? rangeFromTokens(token) : util_1.default.createRange(0, 0, 0, Number.MAX_VALUE) }));
        }
        const { prolog, root } = buildAST(cst, this.diagnostics);
        if (!root) {
            const token1 = tokenVector[0];
            const token2 = tokenVector[1];
            //whitespace before the prolog isn't allowed by the parser
            if ((token1 === null || token1 === void 0 ? void 0 : token1.image.trim().length) === 0 &&
                (token2 === null || token2 === void 0 ? void 0 : token2.image.trim()) === '<?xml') {
                this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.xmlGenericParseError('Syntax error: whitespace found before the XML prolog')), { range: rangeFromTokens(token1) }));
            }
        }
        if ((0, xml_1.isSGComponent)(root)) {
            this.ast = new SGTypes_1.SGAst(prolog, root, root);
        }
        else {
            if (root) {
                //error: not a component
                this.diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.xmlUnexpectedTag(root.tag.text)), { range: root.tag.range }));
            }
            this.ast = new SGTypes_1.SGAst(prolog, root);
        }
    }
}
exports.default = SGParser;
function buildAST(cst, diagnostics) {
    var _a, _b;
    const { prolog: cstProlog, element } = cst.children;
    let prolog;
    if (cstProlog === null || cstProlog === void 0 ? void 0 : cstProlog[0]) {
        const ctx = cstProlog[0].children;
        prolog = new SGTypes_1.SGProlog(mapToken(ctx.XMLDeclOpen[0]), mapAttributes(ctx.attribute), rangeFromTokens(ctx.XMLDeclOpen[0], ctx.SPECIAL_CLOSE[0]));
    }
    let root;
    if (element.length > 0 && ((_b = (_a = element[0]) === null || _a === void 0 ? void 0 : _a.children) === null || _b === void 0 ? void 0 : _b.Name)) {
        root = mapElement(element[0], diagnostics);
    }
    return {
        prolog: prolog,
        root: root
    };
}
function mapElement({ children }, diagnostics) {
    var _a, _b;
    const nameToken = children.Name[0];
    let range;
    const selfClosing = !!children.SLASH_CLOSE;
    if (selfClosing) {
        const scToken = children.SLASH_CLOSE[0];
        range = rangeFromTokens(nameToken, scToken);
    }
    else {
        const endToken = (_a = children.END) === null || _a === void 0 ? void 0 : _a[0];
        range = rangeFromTokens(nameToken, endToken);
    }
    const name = mapToken(nameToken);
    const attributes = mapAttributes(children.attribute);
    const content = (_b = children.content) === null || _b === void 0 ? void 0 : _b[0];
    switch (name.text) {
        case 'component':
            const componentContent = mapElements(content, ['interface', 'script', 'children', 'customization'], diagnostics);
            return new SGTypes_1.SGComponent(name, attributes, componentContent, range);
        case 'interface':
            const interfaceContent = mapElements(content, ['field', 'function'], diagnostics);
            return new SGTypes_1.SGInterface(name, interfaceContent, range);
        case 'field':
            if (hasElements(content)) {
                reportUnexpectedChildren(name, diagnostics);
            }
            return new SGTypes_1.SGField(name, attributes, range);
        case 'function':
            if (hasElements(content)) {
                reportUnexpectedChildren(name, diagnostics);
            }
            return new SGTypes_1.SGFunction(name, attributes, range);
        case 'script':
            if (hasElements(content)) {
                reportUnexpectedChildren(name, diagnostics);
            }
            const cdata = getCdata(content);
            return new SGTypes_1.SGScript(name, attributes, cdata, range);
        case 'children':
            const childrenContent = mapNodes(content);
            return new SGTypes_1.SGChildren(name, childrenContent, range);
        default:
            const nodeContent = mapNodes(content);
            return new SGTypes_1.SGNode(name, attributes, nodeContent, range);
    }
}
function reportUnexpectedChildren(name, diagnostics) {
    diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.xmlUnexpectedChildren(name.text)), { range: name.range }));
}
function mapNode({ children }) {
    var _a, _b;
    const nameToken = children.Name[0];
    let range;
    const selfClosing = !!children.SLASH_CLOSE;
    if (selfClosing) {
        const scToken = children.SLASH_CLOSE[0];
        range = rangeFromTokens(nameToken, scToken);
    }
    else {
        const endToken = (_a = children.END) === null || _a === void 0 ? void 0 : _a[0];
        range = rangeFromTokens(nameToken, endToken);
    }
    const name = mapToken(nameToken);
    const attributes = mapAttributes(children.attribute);
    const content = (_b = children.content) === null || _b === void 0 ? void 0 : _b[0];
    const nodeContent = mapNodes(content);
    return new SGTypes_1.SGNode(name, attributes, nodeContent, range);
}
function mapElements(content, allow, diagnostics) {
    var _a;
    if (!content) {
        return [];
    }
    const { element } = content.children;
    const tags = [];
    if (element) {
        for (const entry of element) {
            const name = (_a = entry.children.Name) === null || _a === void 0 ? void 0 : _a[0];
            if (name === null || name === void 0 ? void 0 : name.image) {
                if (allow.includes(name.image)) {
                    tags.push(mapElement(entry, diagnostics));
                }
                else {
                    //unexpected tag
                    diagnostics.push(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.xmlUnexpectedTag(name.image)), { range: rangeFromTokens(name) }));
                }
            }
            else {
                //bad xml syntax...
            }
        }
    }
    return tags;
}
function mapNodes(content) {
    if (!content) {
        return [];
    }
    const { element } = content.children;
    return element === null || element === void 0 ? void 0 : element.map(element => mapNode(element));
}
function hasElements(content) {
    var _a;
    return !!((_a = content === null || content === void 0 ? void 0 : content.children.element) === null || _a === void 0 ? void 0 : _a.length);
}
function getCdata(content) {
    if (!content) {
        return undefined;
    }
    const { CData } = content.children;
    return mapToken(CData === null || CData === void 0 ? void 0 : CData[0]);
}
function mapToken(token, unquote = false) {
    if (!token) {
        return undefined;
    }
    return {
        text: unquote ? stripQuotes(token.image) : token.image,
        range: unquote ? rangeFromTokenValue(token) : rangeFromTokens(token)
    };
}
function mapAttributes(attributes) {
    return (attributes === null || attributes === void 0 ? void 0 : attributes.map(({ children }) => {
        var _a;
        const key = children.Name[0];
        const value = (_a = children.STRING) === null || _a === void 0 ? void 0 : _a[0];
        let openQuote;
        let closeQuote;
        //capture the leading and trailing quote tokens
        const match = /^(["']).*?(["'])$/.exec(value === null || value === void 0 ? void 0 : value.image);
        if (match) {
            const range = rangeFromTokenValue(value);
            openQuote = {
                text: match[1],
                range: util_1.default.createRange(range.start.line, range.start.character, range.start.line, range.start.character + 1)
            };
            closeQuote = {
                text: match[1],
                range: util_1.default.createRange(range.end.line, range.end.character - 1, range.end.line, range.end.character)
            };
        }
        return {
            key: mapToken(key),
            openQuote: openQuote,
            value: mapToken(value, true),
            closeQuote: closeQuote,
            range: rangeFromTokens(key, value)
        };
    })) || [];
}
//make range from `start` to `end` tokens
function rangeFromTokens(start, end) {
    if (!end) {
        end = start;
    }
    return util_1.default.createRange(start.startLine - 1, start.startColumn - 1, end.endLine - 1, end.endColumn);
}
//make range not including quotes
function rangeFromTokenValue(token) {
    if (!token) {
        return undefined;
    }
    return util_1.default.createRange(token.startLine - 1, token.startColumn, token.endLine - 1, token.endColumn - 1);
}
exports.rangeFromTokenValue = rangeFromTokenValue;
function stripQuotes(value) {
    if ((value === null || value === void 0 ? void 0 : value.length) > 1) {
        return value.substr(1, value.length - 2);
    }
    return '';
}
function emptySGReferences() {
    return {
        scriptTagImports: []
    };
}
//# sourceMappingURL=SGParser.js.map